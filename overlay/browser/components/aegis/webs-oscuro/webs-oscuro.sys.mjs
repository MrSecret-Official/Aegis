/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · webs en oscuro: las webs se adaptan al tema oscuro de Aegis (docs/DISENO.md §2, docs/PRIVACIDAD.md).
 *
 * - Pref aegis.webs_oscuro (settings/prefs/64-webs-oscuro.js): «apagado» (de serie), «todas» o «sin_modo_oscuro» (solo
 *   las webs que no tienen modo oscuro propio). Se elige en Ajustes › Apariencia (ajustes.sys.mjs).
 * - Solo con el tema oscuro: lo que la web ve en prefers-color-scheme (con «Apariencia de los sitios web» en
 *   Automático, el tema de Aegis). Con el claro no se toca nada.
 * - Excepción por sitio: permiso propio «aegis-webs-oscuro» del PermissionManager, por origen, que se pone desde el panel
 *   de Escudos («Oscurecer este sitio»). DENY = no oscurecer. En una ventana privada el PermissionManager lo guarda solo
 *   en memoria (EXPIRE_SESSION, nunca en disco); allí también cuentan las excepciones de las ventanas normales, salvo
 *   que se encienda el sitio en la privada (ALLOW, también solo en memoria).
 *
 * Mecanismo: un JSWindowActor propio (AegisWebsOscuroChild.sys.mjs) con el motor dinámico de Dark Reader (darkreader.js,
 * MIT, copia local). Se registra solo cuando la función se enciende: con ella apagada desde el arranque no hay actor,
 * ni código en las páginas, ni coste. El hijo pregunta aquí si toca oscurecer (modo y excepción, que solo se conocen en
 * este proceso) y recibe los arreglos de Dark Reader para su dirección (arreglos.sys.mjs: se leen una vez aquí y no en
 * cada proceso); luego cuenta lo que ha hecho, para el panel de Escudos.
 *
 * Sin temporizadores: un observador de la pref y mensajes del actor.
 */

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  AegisEscudos: new URL("../escudos.sys.mjs", import.meta.url).href,
  AegisWebsOscuroArreglos: new URL("arreglos.sys.mjs", import.meta.url).href,
});

export const PREF = "aegis.webs_oscuro";
/** Modos, en el orden en que se enseñan. */
export const MODOS = ["apagado", "todas", "sin_modo_oscuro"];
const PERMISO = "aegis-webs-oscuro";
const ACTOR = "AegisWebsOscuro";
/** sharedData (lo leen los procesos de contenido sin preguntar): {modo}. */
const CLAVE = "aegis:webs-oscuro";

let registrado = false;
let iniciado = false;

/**
 * Lo que ha contado el documento principal de cada pestaña: «aplicado», «propio» (ya tiene modo oscuro), «claro» (tema
 * claro), «excepcion» o «apagado». Por documento: al navegar, el nuevo empieza sin estado.
 *
 * @type {WeakMap<WindowGlobalParent, string>}
 */
const estados = new WeakMap();
const ESTADOS = new Set(["aplicado", "propio", "claro", "excepcion", "apagado"]);

function modo() {
  const m = Services.prefs.getStringPref(PREF, "apagado");
  return MODOS.includes(m) ? m : "apagado";
}

/** Web http(s) con principal de contenido. */
function esWeb(principal) {
  return !!principal?.isContentPrincipal && (principal.schemeIs("http") || principal.schemeIs("https"));
}

/**
 * ¿Hay una excepción que pida no oscurecer este sitio?
 *
 * @param {nsIPrincipal} principal el del documento principal de la pestaña
 */
function excepcion(principal) {
  const pm = Services.perms;
  const propio = pm.testExactPermissionFromPrincipal(principal, PERMISO);
  if (propio != pm.UNKNOWN_ACTION) {
    return propio == pm.DENY_ACTION;
  }
  if (principal.privateBrowsingId > 0) {
    const normal = Services.scriptSecurityManager.principalWithOA(principal, {
      ...principal.originAttributes,
      privateBrowsingId: 0,
    });
    return pm.testExactPermissionFromPrincipal(normal, PERMISO) == pm.DENY_ACTION;
  }
  return false;
}

/**
 * Pone o quita la excepción del sitio. En una ventana privada, todo en memoria (EXPIRE_SESSION).
 *
 * @param {nsIPrincipal} principal
 * @param {boolean} oscurecer
 */
function ponerExcepcion(principal, oscurecer) {
  const pm = Services.perms;
  const privada = principal.privateBrowsingId > 0;
  if (oscurecer) {
    pm.removeFromPrincipal(principal, PERMISO);
    // La excepción viene de las ventanas normales: en la privada se enciende solo aquí, sin tocar la normal.
    if (privada && excepcion(principal)) {
      pm.addFromPrincipal(principal, PERMISO, pm.ALLOW_ACTION, pm.EXPIRE_SESSION);
    }
  } else {
    pm.addFromPrincipal(principal, PERMISO, pm.DENY_ACTION, privada ? pm.EXPIRE_SESSION : pm.EXPIRE_NEVER);
  }
}

/** Publica el modo para los procesos de contenido. */
function publicar() {
  Services.ppmm.sharedData.set(CLAVE, { modo: modo() });
  Services.ppmm.sharedData.flush();
}

function registrar() {
  if (registrado) {
    return;
  }
  ChromeUtils.registerWindowActor(ACTOR, {
    parent: { esModuleURI: import.meta.url },
    child: {
      esModuleURI: new URL("AegisWebsOscuroChild.sys.mjs", import.meta.url).href,
      events: { DOMDocElementInserted: {} },
    },
    // Solo webs, en pestañas (no en barras laterales, extensiones ni herramientas), también en sus marcos.
    matches: ["http://*/*", "https://*/*"],
    messageManagerGroups: ["browsers"],
    allFrames: true,
    // Vive en los procesos de las webs. El padre solo responde si toca oscurecer el sitio de esa misma pestaña y
    // guarda una palabra de estado de una lista cerrada: un proceso comprometido no saca nada más de aquí.
    safeForUntrustedWebProcess: true,
  });
  registrado = true;
}

/**
 * Pide a los documentos de una pestaña (también sus marcos) que vuelvan a decidir, sin recargar.
 *
 * @param {MozBrowser} browser
 * @param {string} m modo actual
 */
function reevaluar(browser, m) {
  if (!registrado) {
    return;
  }
  for (const contexto of browser?.browsingContext?.getAllBrowsingContextsInSubtree() ?? []) {
    let actor = null;
    try {
      actor = contexto.currentWindowGlobal?.getActor(ACTOR);
    } catch {
      continue; // un documento que no es una web
    }
    try {
      actor?.sendAsyncMessage("AegisWebsOscuro:reevaluar", { modo: m });
    } catch {
      // se está cerrando
    }
  }
}

function reevaluarTodo() {
  const m = modo();
  for (const win of Services.wm.getEnumerator("navigator:browser")) {
    for (const browser of win.gBrowser?.browsers ?? []) {
      reevaluar(browser, m);
    }
  }
}

export class AegisWebsOscuroParent extends JSWindowActorParent {
  receiveMessage({ name, data }) {
    if (name == "AegisWebsOscuro:consulta") {
      const m = modo();
      // La excepción es la del sitio de la pestaña, también para sus marcos.
      const principal = this.browsingContext.top?.currentWindowGlobal?.documentPrincipal;
      const aplicar = m != "apagado" && esWeb(principal) && !excepcion(principal);
      const uri = this.manager.documentURI;
      if (!aplicar || !uri) {
        return { modo: m, aplicar: false };
      }
      // Arreglos de Dark Reader para la dirección de este documento (también la de un marco).
      return lazy.AegisWebsOscuroArreglos.para(uri).then(
        extra => ({ modo: m, aplicar, ...extra }),
        e => {
          console.error("Aegis: webs en oscuro, arreglos", e);
          return { modo: m, aplicar, arreglos: null, pista: null, oscuroDeSerie: false };
        }
      );
    }
    if (name == "AegisWebsOscuro:estado" && !this.browsingContext.parent && ESTADOS.has(data?.estado)) {
      estados.set(this.manager, data.estado);
      // Si el panel de Escudos de esa pestaña está abierto, que lo enseñe (solo repinta la pestaña visible).
      try {
        lazy.AegisEscudos.avisar(this.browsingContext.top.embedderElement);
      } catch (e) {
        console.error("Aegis: webs en oscuro, Escudos", e);
      }
    }
    return undefined;
  }
}

export const AegisWebsOscuro = {
  PREF,
  MODOS,

  modo,

  /** Una vez por arranque (lo llama AegisArranque.inicio). Con la función apagada solo deja el observador de la pref. */
  inicio() {
    if (iniciado) {
      return;
    }
    iniciado = true;
    publicar();
    if (modo() != "apagado") {
      registrar();
    }
    Services.prefs.addObserver(PREF, () => {
      publicar();
      if (modo() != "apagado") {
        registrar();
      }
      reevaluarTodo();
    });
  },

  /**
   * Para el panel de Escudos: null si la función está apagada o la pestaña no es una web.
   *
   * @param {MozBrowser} browser
   * @returns {{modo: string, oscurecer: boolean, pagina: string?}|null}
   */
  estado(browser) {
    const m = modo();
    const principal = browser?.contentPrincipal;
    if (m == "apagado" || !esWeb(principal)) {
      return null;
    }
    return {
      modo: m,
      oscurecer: !excepcion(principal),
      pagina: estados.get(browser.browsingContext?.currentWindowGlobal) ?? null,
    };
  },

  /**
   * Interruptor «Oscurecer este sitio» del panel de Escudos: pone o quita la excepción y lo aplica en la pestaña sin
   * recargar.
   *
   * @param {MozBrowser} browser
   * @param {boolean} oscurecer
   */
  alternarSitio(browser, oscurecer) {
    const principal = browser?.contentPrincipal;
    if (!esWeb(principal)) {
      return;
    }
    ponerExcepcion(principal, oscurecer);
    // Con la función encendida pero el actor aún sin registrar (no debería pasar si se llamó a inicio()).
    if (modo() != "apagado") {
      registrar();
    }
    reevaluar(browser, modo());
  },
};
