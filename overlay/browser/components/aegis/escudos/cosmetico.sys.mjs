/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · Escudos: cosmético y scriptlets en las páginas (proceso padre). El lado de la página es
 * AegisEscudosChild.sys.mjs; el motor, motor.sys.mjs.
 *
 * Por cada documento http(s) de una pestaña (también sus marcos), el hijo pregunta aquí al empezar y para el análisis
 * de la página (document.blockParsing) hasta tener la respuesta, con un tope. Aquí se decide con lo que solo sabe este
 * proceso:
 * - nada si el sitio tiene los Escudos bajados (cookieJarSettings.isOnContentBlockingAllowList, la excepción de
 *   Firefox que usa el panel) o si el usuario ha permitido en el sitio el cosmético y los scriptlets
 *   (escudos/excepciones.sys.mjs);
 * - qué capas del motor cuentan: anuncios y rastreo, y cada grupo de molestias (avisos de cookies, ventanas y banners,
 *   avisos anti-bloqueador) si está encendido en general y no permitido en el sitio;
 * - el motor da los selectores del sitio, los procedurales, los scriptlets y si hay `generichide`/`$elemhide`.
 * Lo genérico (igual en todas las webs) va en una hoja por capa que se publica una vez por versión del motor en
 * Services.ppmm.sharedData: cada proceso la analiza una vez y la comparte entre sus documentos.
 *
 * El hijo también manda la máscara de la CSP del documento (qué tipos admiten data:): red.sys.mjs la consulta antes de
 * redirigir una petición a un recurso neutro (con una CSP que no admite data:, se cancela en vez de redirigir, para que
 * la web no reciba un informe de violación). Mientras el hijo aún no la ha mandado (las precargas del analizador
 * especulativo pueden salir antes), vale lo que dicen las cabeceras de la respuesta del documento
 * (http-on-examine-response): con «Content-Security-Policy» se cancela. Con «…-Report-Only», siempre se cancela (no se
 * sabe si admite data:, y si no, la web recibiría el informe). Sin el actor (uBlock Origin activo, cosmético y
 * scriptlets apagados), sin máscara siempre se cancela: una <meta> con CSP no se vería.
 *
 * Con uBlock Origin activo (uBlock0@raymondhill.net) el actor se retira: ni hojas ni scriptlets propios, para no
 * pisarse con los suyos. El bloqueo de red de Aegis sigue. Se sabe por los avisos de AddonManager, sin sondear.
 *
 * Ligero: sin temporizadores en reposo (solo uno de un disparo si un documento llega antes de que el motor esté listo
 * al arrancar). Con aegis.escudos.cosmetico y aegis.escudos.scriptlets a false, el actor ni se registra.
 */

import { AegisEscudosMotor, TEMA_MOTOR } from "./motor.sys.mjs";
import { cssDeSelectores } from "./procedural.sys.mjs";

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  AddonManager: "resource://gre/modules/AddonManager.sys.mjs",
});

const ACTOR = "AegisEscudos";
const PREF_COSMETICO = "aegis.escudos.cosmetico";
const PREF_SCRIPTLETS = "aegis.escudos.scriptlets";
const PREF_MEDIR = "aegis.escudos.medir";
/** uBlock Origin en Firefox (platform/firefox/manifest.json). */
const UBO = "uBlock0@raymondhill.net";
/** sharedData: {version, css: [hoja de la capa 0, 1, 2, 3]}. */
export const CLAVE_GENERICOS = "aegis:escudos:genericos";
/** Lo más que espera el cosmético de un documento a que el motor esté listo al arrancar (el hijo tiene su propio tope). */
const ESPERA_MOTOR = 800;
/** Capa del motor → grupo de excepciones (escudos/excepciones.sys.mjs). */
const GRUPOS_CAPA = ["anuncios", "cookies-avisos", "molestias", "antiadblock"];
/** Tope de clases e ids por consulta (lo que se pase, el hijo lo manda en la siguiente). */
const MAX_NOMBRES = 4000;
const MAX_LARGO_NOMBRE = 256;

/** Bits de la máscara de la CSP (los mismos que AegisEscudosChild). */
export const CSP = Object.freeze({
  script: 1,
  image: 2,
  stylesheet: 4,
  media: 8,
  font: 16,
  xmlhttprequest: 32,
  subdocument: 64,
  object: 128,
});
const CSP_TODO = 255;
/** Tipo de adblock-rust → bit de la CSP (lo que no está aquí no se mira). */
const CSP_TIPO = new Map([
  ["script", CSP.script],
  ["image", CSP.image],
  ["stylesheet", CSP.stylesheet],
  ["media", CSP.media],
  ["font", CSP.font],
  ["xmlhttprequest", CSP.xmlhttprequest],
  ["websocket", CSP.xmlhttprequest],
  ["ping", CSP.xmlhttprequest],
  ["subdocument", CSP.subdocument],
  ["object", CSP.object],
]);

/**
 * Máscara de la CSP de cada documento (lo que manda el hijo). Va por WindowGlobalParent: al navegar, el documento
 * nuevo empieza sin máscara.
 *
 * @type {WeakMap<WindowGlobalParent, number>}
 */
const cspDocumentos = new WeakMap();

/**
 * CSP de las cabeceras del último documento de cada contexto: 1 «Content-Security-Policy», 2 «…-Report-Only».
 *
 * @type {WeakMap<BrowsingContext, number>}
 */
const cabecerasCsp = new WeakMap();
const { TYPE_DOCUMENT, TYPE_SUBDOCUMENT } = Ci.nsIContentPolicy;

const observadorCabeceras = {
  observe(subject) {
    let canal;
    try {
      canal = subject.QueryInterface(Ci.nsIHttpChannel);
    } catch {
      return;
    }
    const li = canal.loadInfo;
    const tipo = li.externalContentPolicyType;
    if (tipo != TYPE_DOCUMENT && tipo != TYPE_SUBDOCUMENT) {
      return;
    }
    const contexto = li.targetBrowsingContext ?? li.browsingContext;
    if (!contexto) {
      return;
    }
    let v = 0;
    for (const [bit, nombre] of [
      [1, "Content-Security-Policy"],
      [2, "Content-Security-Policy-Report-Only"],
    ]) {
      try {
        if (canal.getResponseHeader(nombre)) {
          v |= bit;
        }
      } catch {}
    }
    if (v) {
      cabecerasCsp.set(contexto, v);
    } else {
      cabecerasCsp.delete(contexto);
    }
  },
};

let registrado = false;
let iniciado = false;
let uboActivo = false;
let versionPublicada = -1;

const medidas = {
  documentos: 0,
  sinMotor: 0,
  bajados: 0,
  permitidos: 0,
  conScript: 0,
  conProcedurales: 0,
  genericosLotes: 0,
  genericosNombres: 0,
  genericosSelectores: 0,
  // Lo que mide el hijo (con aegis.escudos.medir): tiempo con el análisis parado y documentos que llegaron al tope.
  bloqueos: 0,
  bloqueoMs: 0,
  bloqueoMaximoMs: 0,
  topes: 0,
  esperaMs: 0,
  // Lo que tarda en llegar aquí la consulta (reloj de pared, en ms enteros) y lo que se tarda en contestarla.
  llegadaMs: 0,
  padreMs: 0,
  scriptMs: 0,
  hojasMs: 0,
};

let excepciones;
/** escudos/excepciones.sys.mjs (lo hace otro módulo; si no está, nada está permitido). */
function permitido(principal, grupo) {
  if (excepciones === undefined) {
    try {
      excepciones =
        ChromeUtils.importESModule(new URL("excepciones.sys.mjs", import.meta.url).href).AegisEscudosExcepciones ?? null;
    } catch (e) {
      console.warn("Aegis: Escudos, sin excepciones por sitio", e);
      excepciones = null;
    }
  }
  try {
    return !!excepciones?.permitido(principal, grupo);
  } catch (e) {
    console.error("Aegis: Escudos, excepciones", e);
    return false;
  }
}

/**
 * El cosmético de un documento, una capa por consulta al motor y juntado aquí. Así los scriptlets de cada capa van en
 * su propio ámbito: el motor no repite dependencias dentro de una capa, pero dos capas pueden traer la misma, y si es
 * una clase (RangeParser, ArglistParser…) declararla dos veces en el mismo ámbito sería un SyntaxError que dejaría la
 * página sin ningún scriptlet. null sin motor.
 *
 * @param {string} url
 * @param {number} mascara
 */
function cosmeticoPorCapas(url, mascara) {
  let total = null;
  const juntos = { especificos: new Set(), capas: [], procedurales: new Set(), excepciones: new Set() };
  for (let capa = 0; capa < GRUPOS_CAPA.length; capa++) {
    if (!(mascara & (1 << capa))) {
      continue;
    }
    const r = AegisEscudosMotor.cosmetico(url, 1 << capa);
    if (!r) {
      return null;
    }
    total ??= { filtrados: {}, script: "", generichide: false, elemhide: false };
    r.especificos.forEach(s => juntos.especificos.add(s));
    juntos.capas.push(...r.capas);
    Object.assign(total.filtrados, r.filtrados);
    r.procedurales.forEach(s => juntos.procedurales.add(s));
    r.excepciones.forEach(s => juntos.excepciones.add(s));
    if (r.script) {
      total.script += `(function() {\n${r.script}\n})();\n`;
    }
    total.generichide ||= r.generichide;
    total.elemhide ||= r.elemhide;
  }
  if (!total) {
    return null;
  }
  if (total.elemhide) {
    // `$elemhide`: nada de ocultar en el sitio (sí los scriptlets).
    juntos.especificos.clear();
    juntos.capas = [];
    total.filtrados = {};
    juntos.procedurales.clear();
  }
  return {
    ...total,
    especificos: [...juntos.especificos],
    capas: [...new Set(juntos.capas)],
    procedurales: [...juntos.procedurales],
    excepciones: [...juntos.excepciones],
  };
}

/** Publica (si ha cambiado el motor) la hoja genérica de cada capa para los procesos de contenido. */
function publicarGenericos() {
  const version = AegisEscudosMotor.version;
  if (!version || version == versionPublicada) {
    return;
  }
  const css = [];
  for (let capa = 0; capa < GRUPOS_CAPA.length; capa++) {
    css.push(cssDeSelectores(AegisEscudosMotor.genericosCapa(capa)));
  }
  Services.ppmm.sharedData.set(CLAVE_GENERICOS, { version, css });
  Services.ppmm.sharedData.flush();
  versionPublicada = version;
}

const esLista = (x, max) => Array.isArray(x) && x.length <= max;
const nombres = lista =>
  esLista(lista, MAX_NOMBRES)
    ? lista.filter(n => typeof n == "string" && n.length && n.length <= MAX_LARGO_NOMBRE)
    : [];

export class AegisEscudosParent extends JSWindowActorParent {
  receiveMessage({ name, data }) {
    switch (name) {
      case "Aegis:Escudos:Cosmetico":
        return this.#cosmetico(data);
      case "Aegis:Escudos:Genericos":
        return this.#genericos(data);
      case "Aegis:Escudos:Csp":
        this.#csp(data);
        return undefined;
      case "Aegis:Escudos:Medida":
        this.#medida(data);
        return undefined;
    }
    return undefined;
  }

  #csp(data) {
    const m = data?.csp;
    cspDocumentos.set(this.manager, Number.isInteger(m) && m >= 0 && m <= CSP_TODO ? m : CSP_TODO);
  }

  async #cosmetico(data) {
    const t0 = ChromeUtils.now();
    if (Number.isFinite(data?.enviado)) {
      medidas.llegadaMs += Math.max(0, Date.now() - data.enviado);
    }
    try {
      return await this.#cosmeticoSinMedir(data);
    } finally {
      medidas.padreMs += ChromeUtils.now() - t0;
    }
  }

  async #cosmeticoSinMedir(data) {
    this.#csp(data);
    const wg = this.manager;
    const uri = wg.documentURI;
    if (!uri || !(uri.schemeIs("http") || uri.schemeIs("https"))) {
      return null;
    }
    medidas.documentos++;
    // Escudos bajados en el sitio (vale también para sus marcos).
    try {
      if (wg.cookieJarSettings?.isOnContentBlockingAllowList) {
        medidas.bajados++;
        return null;
      }
    } catch {}
    // Las excepciones son las del sitio de la pestaña, también para sus marcos (como las de la red).
    const arriba = this.browsingContext.top?.currentWindowGlobal?.documentPrincipal;
    const sitio = arriba?.isContentPrincipal ? arriba : wg.documentPrincipal;
    const cosmetico = Services.prefs.getBoolPref(PREF_COSMETICO, true) && !permitido(sitio, "cosmetico");
    const scriptlets = Services.prefs.getBoolPref(PREF_SCRIPTLETS, true) && !permitido(sitio, "scriptlets");
    let mascara = 0;
    GRUPOS_CAPA.forEach((grupo, capa) => {
      if (!permitido(sitio, grupo)) {
        mascara |= 1 << capa;
      }
    });
    if ((!cosmetico && !scriptlets) || !mascara) {
      medidas.permitidos++;
      return null;
    }
    if (!AegisEscudosMotor.listo && !(await AegisEscudosMotor.esperarListo(ESPERA_MOTOR))) {
      medidas.sinMotor++;
      return null;
    }
    const r = cosmeticoPorCapas(uri.spec, mascara);
    if (!r) {
      medidas.sinMotor++;
      return null;
    }
    if (cosmetico) {
      publicarGenericos();
    }
    // Para las consultas de clases e ids de este documento.
    this.excepciones = r.excepciones;
    this.mascara = cosmetico && !r.generichide ? mascara : 0;
    const procedurales = cosmetico ? r.procedurales : [];
    medidas.conScript += scriptlets && r.script ? 1 : 0;
    medidas.conProcedurales += procedurales.length ? 1 : 0;
    return {
      version: versionPublicada,
      capas: cosmetico ? r.capas : [],
      filtrados: cosmetico ? r.filtrados : {},
      especificos: cosmetico ? r.especificos : [],
      procedurales,
      genericos: !!this.mascara,
      script: scriptlets ? r.script : "",
      medir: Services.prefs.getBoolPref(PREF_MEDIR, false),
    };
  }

  #genericos(data) {
    if (!this.mascara) {
      return [];
    }
    const clases = nombres(data?.clases);
    const ids = nombres(data?.ids);
    if (!clases.length && !ids.length) {
      return [];
    }
    const selectores = AegisEscudosMotor.genericos(clases, ids, this.excepciones ?? [], this.mascara);
    medidas.genericosLotes++;
    medidas.genericosNombres += clases.length + ids.length;
    medidas.genericosSelectores += selectores.length;
    return selectores;
  }

  #medida(data) {
    const ms = Number(data?.bloqueoMs);
    if (!Number.isFinite(ms) || ms < 0) {
      return;
    }
    medidas.bloqueos++;
    medidas.bloqueoMs += ms;
    medidas.bloqueoMaximoMs = Math.max(medidas.bloqueoMaximoMs, ms);
    medidas.topes += data.tope ? 1 : 0;
    medidas.esperaMs += Number(data.esperaMs) || 0;
    medidas.scriptMs += Number(data.scriptMs) || 0;
    medidas.hojasMs += Number(data.hojasMs) || 0;
  }
}

function registrar() {
  if (registrado) {
    return;
  }
  ChromeUtils.registerWindowActor(ACTOR, {
    parent: { esModuleURI: import.meta.url },
    child: {
      esModuleURI: new URL("AegisEscudosChild.sys.mjs", import.meta.url).href,
      events: { DOMDocElementInserted: {}, DOMContentLoaded: {}, DOMMetaAdded: {} },
    },
    // Solo webs, en pestañas (no en barras laterales, extensiones ni herramientas), también en sus marcos.
    matches: ["http://*/*", "https://*/*"],
    messageManagerGroups: ["browsers"],
    allFrames: true,
    // Vive en los procesos de las webs. El padre responde solo con lo del documento de ese mismo actor (su dirección
    // la sabe el padre, no la manda el hijo): un proceso comprometido no saca nada que no pudiera calcular él.
    safeForUntrustedWebProcess: true,
  });
  registrado = true;
}

function desregistrar() {
  if (!registrado) {
    return;
  }
  ChromeUtils.unregisterWindowActor(ACTOR);
  registrado = false;
}

/** Registra o retira el actor según uBlock Origin y los interruptores. */
function decidir() {
  const quiere =
    !uboActivo &&
    (Services.prefs.getBoolPref(PREF_COSMETICO, true) || Services.prefs.getBoolPref(PREF_SCRIPTLETS, true));
  if (quiere) {
    registrar();
  } else {
    desregistrar();
  }
}

const oyenteUbo = {
  onEnabled(a) {
    this.cambio(a);
  },
  onDisabled(a) {
    this.cambio(a);
  },
  onInstalled(a) {
    this.cambio(a);
  },
  onUninstalled(a) {
    this.cambio(a, false);
  },
  onOperationCancelled(a) {
    this.cambio(a);
  },
  cambio(addon, activo = addon?.isActive) {
    if (addon?.id != UBO) {
      return;
    }
    uboActivo = !!activo;
    decidir();
  },
};

export const AegisEscudosCosmetico = {
  /** Una vez por arranque (lo llama listas.sys.mjs cuando el motor está en marcha). Idempotente. */
  inicio() {
    if (iniciado) {
      return;
    }
    iniciado = true;
    try {
      uboActivo = !!WebExtensionPolicy.getByID(UBO)?.active;
    } catch {}
    decidir();
    for (const tema of ["http-on-examine-response", "http-on-examine-cached-response", "http-on-examine-merged-response"]) {
      Services.obs.addObserver(observadorCabeceras, tema);
    }
    Services.prefs.addObserver(PREF_COSMETICO, decidir);
    Services.prefs.addObserver(PREF_SCRIPTLETS, decidir);
    Services.obs.addObserver(publicarGenericos, TEMA_MOTOR);
    publicarGenericos();
    try {
      lazy.AddonManager.addAddonListener(oyenteUbo);
      lazy.AddonManager.getAddonByID(UBO).then(
        a => {
          uboActivo = !!a?.isActive;
          decidir();
        },
        e => console.error("Aegis: Escudos, uBlock Origin", e)
      );
    } catch (e) {
      console.error("Aegis: Escudos, AddonManager", e);
    }
  },

  /** ¿Está el cosmético propio en marcha? (false con uBlock Origin activo o con los dos interruptores apagados) */
  get activo() {
    return registrado;
  },

  get uboActivo() {
    return uboActivo;
  },

  /**
   * ¿Admite la CSP del documento que hace la petición un recurso data: de este tipo? Ver la cabecera del módulo: la
   * máscara del hijo si la hay; si no, las cabeceras del documento; sin actor, no.
   *
   * @param {nsILoadInfo} loadInfo
   * @param {string} tipo de adblock-rust
   */
  cspPermite(loadInfo, tipo) {
    const bit = CSP_TIPO.get(tipo);
    if (!bit) {
      return true;
    }
    let contexto = loadInfo.browsingContext;
    // Un marco: la CSP que manda es la del documento que lo contiene (frame-src).
    if (tipo == "subdocument") {
      contexto = (loadInfo.targetBrowsingContext ?? contexto)?.parent;
    }
    const cabeceras = contexto ? cabecerasCsp.get(contexto) ?? 0 : 0;
    if (cabeceras & 2) {
      return false;
    }
    const m = contexto?.currentWindowGlobal ? cspDocumentos.get(contexto.currentWindowGlobal) : undefined;
    if (m !== undefined) {
      return (m & bit) != 0;
    }
    return registrado && !(cabeceras & 1);
  },

  /** Para las pruebas y el banco de rendimiento. */
  medidas() {
    return { ...medidas, activo: registrado, uboActivo, version: versionPublicada };
  },

  reiniciarMedidas() {
    for (const k of Object.keys(medidas)) {
      medidas[k] = 0;
    }
  },

  /** Para el banco de pruebas: lo mismo que hace el aviso de AddonManager cuando uBlock Origin se activa o no. */
  _simularUbo(activo) {
    oyenteUbo.cambio({ id: UBO }, !!activo);
  },
};
