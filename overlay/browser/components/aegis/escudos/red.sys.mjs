/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · Escudos: bloqueo de red con el motor propio (motor.sys.mjs) y las listas de sus autores (listas.sys.mjs).
 *
 * Un observador de http-on-modify-request en el proceso padre. Va por detrás de la protección contra rastreo de
 * Firefox (ETP): el clasificador de ETP decide antes (nsHttpChannel::AsyncOpenFinal). Lo que ETP corta llega aquí
 * una sola vez, justo antes de cortarlo (nsHttpChannel::CancelByURLClassifier, con loadInfo.requestBlockingReason
 * puesto): ver «Bloqueo silencioso». El resto, por cada petición:
 * - fuera si ya está cancelada (Google limpio), si no es de una web (principal de sistema o de una extensión,
 *   las del propio navegador), si es la página que abre el usuario (documento de nivel superior: en esta versión no
 *   se bloquea una navegación) o si el usuario ha bajado los Escudos en el sitio (la misma excepción de ETP que usa
 *   el panel: loadInfo.cookieJarSettings.isOnContentBlockingAllowList);
 * - el motor decide con la URL, el origen del documento que la pide y el tipo; si toca bloquear, se cancela
 *   (NS_ERROR_ABORT, como hace Google limpio) y se apunta en el contador de Escudos: «rastreadores» si ETP la había
 *   marcado como rastreador sin bloquearla (nivel Normal) y «anuncios» en el resto. Si la página de la pestaña tiene
 *   una excepción de esa categoría (escudos/excepciones.sys.mjs), pasa.
 * - Una regla con recurso neutro ($redirect, $redirect-rule) redirige a su data: (recursos.json, dentro de la build),
 *   como hace WebRequest con las extensiones: channel.redirectTo y allowInsecureRedirectToDataURI. Las peticiones en
 *   modo CORS no admiten un data: (se cortan, ver redirigir). Si la CSP del documento no admite data: para ese tipo
 *   (cosmetico.sys.mjs lo sabe por el hijo), se cancela: así la web no recibe un informe de violación. Cuenta como
 *   bloqueada. Si la lista no trae recurso, el genérico de su tipo (SUSTITUTO), como con lo que corta ETP.
 * $removeparam y $csp llegan en pasos posteriores: hoy una reescritura deja pasar la petición tal cual.
 *
 * Bloqueo silencioso: un bloqueo que la web ve como error de red delata al bloqueador. Con el motor listo:
 * - Excepciones por sitio: justo antes de que ETP corte (nsIChannelClassifierService, el enganche de SmartBlock), si
 *   las listas dejan pasar ese dominio en esa web (escudos/etp.sys.mjs), sigue (allow) y decide el motor con la regla
 *   de la lista.
 * - Lo que ETP corta: Firefox llama aquí justo antes de cortarlo, y si se redirige, redirige en vez de cortar
 *   (CancelByURLClassifier mira mAPIRedirectTo). Se redirige a una respuesta neutra de su tipo: el recurso de la lista
 *   si el motor tiene uno para esa URL (los sustitutos de uBlock Origin) o el genérico (SUSTITUTO: script vacío,
 *   respuesta vacía, imagen de un píxel, hoja de estilos vacía, marco en blanco, vídeo mudo). Nada sale a la red y la
 *   web recibe un 200. ETP ya la ha apuntado como bloqueada (el contador la cuenta; aquí no se anota). Sin respuesta
 *   neutra posible (fuentes, objetos, websockets, balizas, informes de CSP) o con una CSP que no admite data:, ETP la
 *   corta como siempre.
 *
 * Arranque: mientras el motor carga las listas (unas décimas de segundo), las peticiones de las webs esperan
 * suspendidas (channel.suspend) y se deciden en cuanto está listo; nunca más de ESPERA_MAXIMA. Las del navegador no
 * esperan nunca.
 *
 * Ligero: ningún temporizador en reposo (solo uno de un disparo mientras hay peticiones esperando al arrancar). Con
 * aegis.escudos.medir = true guarda el tiempo de cada decisión (para tools/pruebas; de serie, apagado).
 */

import { AegisEscudos } from "../escudos.sys.mjs";
import { AegisEscudosMotor } from "./motor.sys.mjs";
import { AegisEscudosEtp } from "./etp.sys.mjs";
import { AegisEscudosExcepciones } from "./excepciones.sys.mjs";

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  AegisEscudosCosmetico: new URL("cosmetico.sys.mjs", import.meta.url).href,
});

const PREF_MEDIR = "aegis.escudos.medir";
/** Lo más que espera una petición a que el motor esté listo al arrancar (luego pasa con la protección de ETP). */
const ESPERA_MAXIMA = 1500;

const P = Ci.nsIContentPolicy;
/** Tipo de petición de Firefox → tipo de adblock-rust (como ContentClassifierEngine.cpp de Firefox). */
const TIPOS = new Map(
  [
    [P.TYPE_SCRIPT, "script"],
    [P.TYPE_IMAGE, "image"],
    [P.TYPE_IMAGESET, "image"],
    [P.TYPE_STYLESHEET, "stylesheet"],
    [P.TYPE_OBJECT, "object"],
    [P.TYPE_OBJECT_SUBREQUEST, "object"],
    [P.TYPE_SUBDOCUMENT, "subdocument"],
    [P.TYPE_PING, "ping"],
    [P.TYPE_BEACON, "ping"],
    [P.TYPE_XMLHTTPREQUEST, "xmlhttprequest"],
    [P.TYPE_FETCH, "xmlhttprequest"],
    [P.TYPE_FONT, "font"],
    [P.TYPE_MEDIA, "media"],
    [P.TYPE_WEBSOCKET, "websocket"],
    [P.TYPE_CSP_REPORT, "csp_report"],
    [P.TYPE_OTHER, "other"],
    [P.TYPE_XSLT, "other"],
    [P.TYPE_DTD, "other"],
    [P.TYPE_WEB_MANIFEST, "other"],
    [P.TYPE_SPECULATIVE, "other"],
    [P.TYPE_UA_FONT, "font"],
    [P.TYPE_JSON, "xmlhttprequest"],
    [P.TYPE_TEXT, "other"],
    [P.TYPE_WEB_TRANSPORT, "websocket"],
    [P.TYPE_WEB_IDENTITY, "other"],
  ].filter(([n]) => n !== undefined)
);

/** Respuesta neutra genérica de cada tipo (nombres de recursos.json, los de uBlock Origin). */
const SUSTITUTO = {
  script: "noop.js",
  xmlhttprequest: "noop.txt",
  image: "1x1.gif",
  stylesheet: "noop.css",
  subdocument: "noop.html",
  media: "noop-1s.mp4",
};
const URL_RECURSOS = new URL("recursos.json", import.meta.url).href;
/** nombre → data: de cada SUSTITUTO (se leen de recursos.json al arrancar); null hasta entonces. */
let sustitutos = null;
/**
 * Peticiones ya redirigidas a una respuesta neutra (por este módulo o por Google limpio con neutro()): channelId. Un
 * observador posterior las vería sin cancelar y las decidiría y contaría otra vez. Con tope, para no crecer.
 */
const neutralizadas = new Set();
const MAX_NEUTRALIZADAS = 2000;

/** Motivos de bloqueo de ETP (nsILoadInfo.BLOCKING_REASON_CLASSIFY_*): los que se silencian. */
const MOTIVOS_ETP = new Set([
  Ci.nsILoadInfo.BLOCKING_REASON_CLASSIFY_TRACKING_URI,
  Ci.nsILoadInfo.BLOCKING_REASON_CLASSIFY_CRYPTOMINING_URI,
  Ci.nsILoadInfo.BLOCKING_REASON_CLASSIFY_FINGERPRINTING_URI,
  Ci.nsILoadInfo.BLOCKING_REASON_CLASSIFY_SOCIALTRACKING_URI,
  Ci.nsILoadInfo.BLOCKING_REASON_CLASSIFY_EMAILTRACKING_URI,
]);

let medir = false;
/** Con aegis.escudos.medir: las últimas peticiones bloqueadas (URL, tipo, banderas de ETP), para las pruebas. */
const ultimas = [];
const medidas = {
  peticiones: 0,
  bloqueadas: 0,
  totalMs: 0,
  maximoMs: 0,
  motorMs: 0,
  anotarMs: 0,
  esperaron: 0,
  redirigidas: 0,
  cspCanceladas: 0,
  corsCanceladas: 0,
  silenciadas: 0,
  exceptuadasEtp: 0,
};

/** Peticiones de webs que esperan a que el motor esté listo: {canal, desde}. */
let esperando = [];
/** El temporizador de un disparo de la espera (se guarda para que no lo recoja el recolector). */
let espera = null;
/** ¿Se está cargando el motor? (lo dice listas.sys.mjs) Sin carga en marcha, nada espera. */
let cargando = false;

/**
 * Principal del documento que hace la petición, o null si no es de una web (http/https). Un documento con principal
 * nulo (marco con sandbox) cuenta como el sitio que lo creó.
 */
function principalWeb(loadInfo) {
  let p = loadInfo.loadingPrincipal ?? loadInfo.triggeringPrincipal;
  if (p?.isNullPrincipal) {
    p = p.precursorPrincipal;
  }
  return p?.isContentPrincipal && (p.schemeIs("https") || p.schemeIs("http")) ? p : null;
}

/** «rastreadores» si ETP la había marcado como rastreador sin bloquearla (nivel Normal); si no, «anuncios». */
function categoriaDe(canal) {
  try {
    if (canal.QueryInterface(Ci.nsIClassifiedChannel).isThirdPartyTrackingResource()) {
      return "rastreadores";
    }
  } catch {}
  return "anuncios";
}

/**
 * ¿Tiene la página de la pestaña una excepción de esta categoría (escudos/excepciones.sys.mjs)? Cuenta el sitio de
 * la página principal, no el del marco que hace la petición (como la excepción de Firefox).
 */
function exceptuada(loadInfo, principal, categoria) {
  const arriba = loadInfo.browsingContext?.top?.currentWindowGlobal?.documentPrincipal;
  return AegisEscudosExcepciones.permitido(arriba?.isContentPrincipal ? arriba : principal, categoria);
}

function anotar(canal, loadInfo, uri, categoria = categoriaDe(canal)) {
  try {
    AegisEscudos.anotar(loadInfo.browsingContext?.top?.embedderElement, categoria, uri.prePath);
  } catch (e) {
    console.error("Aegis: Escudos, contador", e);
  }
}

/** ¿Admite la CSP del documento un data: de este tipo? Sin el módulo del cosmético, sí. */
function cspPermite(loadInfo, tipo) {
  try {
    return lazy.AegisEscudosCosmetico.cspPermite(loadInfo, tipo);
  } catch {
    return true;
  }
}

/**
 * Redirige a un recurso neutro (data:), como WebRequest (toolkit/components/extensions/webrequest/WebRequest.sys.mjs).
 * Devuelve false si no se puede (otro destino, CSP estricta o el canal ya no admite redirigirse): entonces se cancela.
 */
function redirigir(canal, loadInfo, tipo, destino) {
  if (!destino.startsWith("data:")) {
    return false;
  }
  if (!cspPermite(loadInfo, tipo)) {
    medidas.cspCanceladas++;
    return false;
  }
  // Peticiones en modo CORS (fetch con mode «cors», XMLHttpRequest a otro origen, scripts con crossorigin): Firefox
  // no deja leer un data: tras una redirección («CORS request not http»; solo exime a moz-extension:, que delataría
  // una extensión). Daría el mismo error que cortarla, y además un aviso en la consola: se corta.
  if (loadInfo.securityMode == Ci.nsILoadInfo.SEC_REQUIRE_CORS_INHERITS_SEC_CONTEXT) {
    medidas.corsCanceladas++;
    return false;
  }
  try {
    canal.redirectTo(Services.io.newURI(destino));
    // redirectTo() quita la marca (HttpBaseChannel::RedirectTo): se pone justo después, como WebRequest.
    loadInfo.allowInsecureRedirectToDataURI = true;
    neutralizadas.add(canal.channelId);
    if (neutralizadas.size > MAX_NEUTRALIZADAS) {
      neutralizadas.delete(neutralizadas.values().next().value);
    }
    medidas.redirigidas++;
    return true;
  } catch (e) {
    console.error("Aegis: Escudos, recurso neutro", e);
    return false;
  }
}

/** Tipos de contenido (de un data:) con los que la web ve una carga normal, por tipo de petición. */
const MIME_VALIDO = {
  script: /^(?:application|text)\/(?:x-)?javascript$/,
  image: /^image\//,
  stylesheet: /^text\/css$/,
  subdocument: /^text\/html$/,
  media: /^(?:audio|video)\//,
};

/**
 * La respuesta neutra de una petición: el recurso de la lista si sirve para su tipo; si no (no hay, o la lista
 * redirige una imagen a un texto, como `||adnxs.com^$redirect=noop.txt,image` de AdGuard Base, y la web vería un
 * error de imagen), el genérico de su tipo. Vacía si no hay ninguno.
 */
function neutroPara(tipo, deLaLista) {
  const mime = /^data:([^;,]+)/.exec(deLaLista)?.[1];
  if (deLaLista && (!MIME_VALIDO[tipo] || MIME_VALIDO[tipo].test(mime ?? ""))) {
    return deLaLista;
  }
  return sustitutos?.get(SUSTITUTO[tipo]) || deLaLista || "";
}

/** Lee las respuestas neutras genéricas de recursos.json. */
async function cargarSustitutos() {
  try {
    const recursos = await (await fetch(URL_RECURSOS)).json();
    const mapa = new Map();
    for (const r of recursos) {
      if (Object.values(SUSTITUTO).includes(r.name) && r.kind?.mime && typeof r.content == "string") {
        mapa.set(r.name, `data:${r.kind.mime};base64,${r.content}`);
      }
    }
    sustitutos = mapa;
  } catch (e) {
    console.error("Aegis: Escudos, respuestas neutras", e);
  }
}

/**
 * ETP va a cortar una petición (urlclassifier-before-block-channel): si las listas la dejan pasar en esa web, sigue.
 * Si no, sigue su camino: llega al observador justo antes del corte y allí se silencia.
 */
const antesDeBloquear = {
  observe(subject) {
    try {
      if (!AegisEscudosMotor.listo) {
        return;
      }
      const bloqueada = subject.QueryInterface(Ci.nsIUrlClassifierBlockedChannel);
      const canal = bloqueada.channel;
      const loadInfo = canal?.loadInfo;
      if (!loadInfo) {
        return;
      }
      const host = canal.URI.host;
      const webs = [];
      try {
        webs.push(Services.io.newURI(bloqueada.topLevelUrl).host);
      } catch {}
      const principal = principalWeb(loadInfo);
      if (principal) {
        webs.push(principal.host);
      }
      if (AegisEscudosEtp.exceptuado(host, webs)) {
        medidas.exceptuadasEtp++;
        bloqueada.allow();
      }
    } catch (e) {
      console.error("Aegis: Escudos, bloqueo silencioso", e);
    }
  },
};

/**
 * Una petición que ETP está a punto de cortar: a su respuesta neutra (Firefox redirige en vez de cortar). Devuelve si
 * la ha redirigido; si no (sin respuesta neutra para su tipo, CSP estricta), la corta ETP.
 */
function silenciar(canal, loadInfo) {
  const tipo = TIPOS.get(loadInfo.externalContentPolicyType);
  const principal = principalWeb(loadInfo);
  let destino = "";
  if (principal && AegisEscudosMotor.red(canal.URI.spec, principal.originNoSuffix, tipo) ==
      AegisEscudosMotor.RESULTADO.REDIRIGIR) {
    destino = AegisEscudosMotor.salida();
  }
  destino = neutroPara(tipo, destino);
  if (destino && redirigir(canal, loadInfo, tipo, destino)) {
    medidas.silenciadas++;
    return true;
  }
  return false;
}

/** Decide una petición ya filtrada y actúa. Devuelve si la ha bloqueado. */
function decidir(canal, loadInfo, tipo, principal) {
  const uri = canal.URI;
  const t0 = medir ? ChromeUtils.now() : 0;
  const r = AegisEscudosMotor.red(uri.spec, principal.originNoSuffix, tipo);
  if (medir) {
    medidas.motorMs += ChromeUtils.now() - t0;
  }
  if (r == AegisEscudosMotor.RESULTADO.BLOQUEAR || r == AegisEscudosMotor.RESULTADO.REDIRIGIR) {
    // El recurso se lee ya: la salida del motor vale hasta su siguiente llamada.
    const destino = neutroPara(tipo, r == AegisEscudosMotor.RESULTADO.REDIRIGIR ? AegisEscudosMotor.salida() : "");
    // Excepción del sitio para esta categoría: pasa (solo se mira en lo que el motor bloquearía).
    const categoria = categoriaDe(canal);
    if (exceptuada(loadInfo, principal, categoria)) {
      return false;
    }
    if (!destino || !redirigir(canal, loadInfo, tipo, destino)) {
      canal.cancel(Cr.NS_ERROR_ABORT);
    }
    if (medir && ultimas.length < 200) {
      let flags = -1;
      try {
        flags = canal.QueryInterface(Ci.nsIClassifiedChannel).classificationFlags;
      } catch {}
      ultimas.push([uri.spec, tipo, flags]);
    }
    const t1 = medir ? ChromeUtils.now() : 0;
    anotar(canal, loadInfo, uri, categoria);
    if (medir) {
      medidas.anotarMs += ChromeUtils.now() - t1;
    }
    return true;
  }
  return false;
}

/** Lo que hay que mirar de una petición: {loadInfo, tipo, principal} o null si no es asunto de Escudos. */
function aplicable(canal) {
  if (canal.canceled || neutralizadas.has(canal.channelId)) {
    return null;
  }
  const loadInfo = canal.loadInfo;
  // Otro la está cancelando con su motivo (lo de ETP ya se ha silenciado en el observador): el motor no la mira, y
  // así cuenta una sola vez y en su categoría.
  if (loadInfo.requestBlockingReason) {
    return null;
  }
  const tipo = TIPOS.get(loadInfo.externalContentPolicyType);
  if (!tipo) {
    return null;
  }
  const principal = principalWeb(loadInfo);
  if (!principal) {
    return null;
  }
  try {
    if (loadInfo.cookieJarSettings?.isOnContentBlockingAllowList) {
      return null;
    }
  } catch {}
  const esquema = canal.URI.scheme;
  if (esquema != "https" && esquema != "http" && esquema != "wss" && esquema != "ws") {
    return null;
  }
  return { loadInfo, tipo, principal };
}

function soltarEsperando() {
  const lista = esperando;
  esperando = [];
  for (const { canal } of lista) {
    try {
      if (!canal.canceled && AegisEscudosMotor.listo) {
        const datos = aplicable(canal);
        if (datos) {
          decidir(canal, datos.loadInfo, datos.tipo, datos.principal);
        }
      }
    } catch (e) {
      console.error("Aegis: Escudos, petición en espera", e);
    } finally {
      try {
        canal.resume();
      } catch {}
    }
  }
}

function armarEspera() {
  if (espera) {
    return;
  }
  // Un solo disparo, solo mientras carga el motor y solo si hay peticiones esperando. Si vence, ya no se espera más
  // en esta carga: lo que llegue pasa con la protección de ETP hasta que el motor esté listo.
  espera = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
  espera.initWithCallback(
    () => {
      espera = null;
      cargando = false;
      soltarEsperando();
    },
    ESPERA_MAXIMA,
    Ci.nsITimer.TYPE_ONE_SHOT
  );
}

const observador = {
  observe(subject) {
    const t0 = medir ? ChromeUtils.now() : 0;
    let canal;
    try {
      canal = subject.QueryInterface(Ci.nsIHttpChannel);
    } catch {
      return;
    }
    // ETP la está cortando: a su respuesta neutra (sin pasar por el motor ni anotarla: ETP ya la ha apuntado).
    try {
      if (MOTIVOS_ETP.has(canal.loadInfo.requestBlockingReason)) {
        if (AegisEscudosMotor.listo && sustitutos && !canal.canceled && principalWeb(canal.loadInfo)) {
          silenciar(canal, canal.loadInfo);
        }
        return;
      }
    } catch (e) {
      console.error("Aegis: Escudos, bloqueo silencioso", e);
      return;
    }
    const datos = aplicable(canal);
    if (!datos) {
      return;
    }
    if (!AegisEscudosMotor.listo) {
      if (cargando) {
        canal.suspend();
        esperando.push({ canal });
        medidas.esperaron++;
        armarEspera();
      }
      return;
    }
    const bloqueada = decidir(canal, datos.loadInfo, datos.tipo, datos.principal);
    if (medir) {
      const ms = ChromeUtils.now() - t0;
      medidas.peticiones++;
      medidas.bloqueadas += bloqueada ? 1 : 0;
      medidas.totalMs += ms;
      medidas.maximoMs = Math.max(medidas.maximoMs, ms);
    }
  },
};

let activo = false;

function leerMedir() {
  medir = Services.prefs.getBoolPref(PREF_MEDIR, false);
}

export const AegisEscudosRed = {
  /**
   * Para otros filtros de Aegis (Google limpio): redirige la petición a la respuesta neutra genérica de su tipo en
   * lugar de cortarla. Devuelve si lo ha hecho; si no (sin Escudos en marcha, tipo sin respuesta neutra, CORS, CSP),
   * quien llama la corta.
   */
  neutro(canal) {
    try {
      const loadInfo = canal.loadInfo;
      const tipo = TIPOS.get(loadInfo.externalContentPolicyType);
      const destino = sustitutos?.get(SUSTITUTO[tipo]);
      return !!destino && redirigir(canal, loadInfo, tipo, destino);
    } catch (e) {
      console.error("Aegis: Escudos, respuesta neutra", e);
      return false;
    }
  },

  /** Una vez por arranque (lo llama listas.sys.mjs antes de cargar el motor). Idempotente. */
  inicio() {
    if (activo) {
      return;
    }
    activo = true;
    leerMedir();
    Services.prefs.addObserver(PREF_MEDIR, leerMedir);
    Services.obs.addObserver(observador, "http-on-modify-request");
    // Bloqueo silencioso de lo que corta ETP (arriba): las respuestas neutras y el enganche anterior al bloqueo.
    cargarSustitutos().then(() => {
      try {
        Cc["@mozilla.org/url-classifier/channel-classifier-service;1"]
          .getService(Ci.nsIChannelClassifierService)
          .addListener(antesDeBloquear);
      } catch (e) {
        console.error("Aegis: Escudos, sin bloqueo silencioso: ETP corta con error", e);
      }
    });
  },

  /**
   * listas.sys.mjs avisa de que empieza (true) o termina (false) de cargar el motor. Al terminar, las peticiones que
   * esperaban se deciden y siguen.
   *
   * @param {boolean} si
   */
  cargando(si) {
    cargando = si;
    if (!si) {
      espera?.cancel();
      espera = null;
      soltarEsperando();
    }
  },

  /** Para las pruebas: tiempo por petición (con aegis.escudos.medir = true). */
  medidas() {
    const n = medidas.peticiones || 1;
    return {
      ...medidas,
      mediaUs: (medidas.totalMs * 1000) / n,
      motorUs: (medidas.motorMs * 1000) / n,
      anotarUs: medidas.bloqueadas ? (medidas.anotarMs * 1000) / medidas.bloqueadas : 0,
    };
  },

  ultimas() {
    return ultimas.splice(0);
  },

  reiniciarMedidas() {
    for (const k of Object.keys(medidas)) {
      medidas[k] = 0;
    }
  },

  _tipos: TIPOS,
};
