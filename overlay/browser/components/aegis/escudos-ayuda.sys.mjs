/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · about:escudos, «Cómo funcionan los Escudos»: qué hace cada opción del panel de Escudos y de la huella
 * digital, dentro del navegador y sin red. Lo que dice sale del código y de docs/PRIVACIDAD.md.
 *
 * Nombre: about:escudos. Es el nombre de la función (el que ya usa docs/DISENO.md para esta página), corto de escribir
 * y sin choque posible con una página de Firefox: Firefox nombra las suyas en inglés.
 *
 * Cómo se registra, sin parchear Firefox:
 * - Firefox resuelve about:<nombre> con el contrato «@mozilla.org/network/protocol/about;1?what=<nombre>». Este módulo
 *   lo registra al arrancar con nsIComponentRegistrar.registerFactory, como hace Firefox con las fábricas de sus
 *   políticas de empresa (PoliciesHelpers.sys.mjs). Vale igual en la build y en la copia de desarrollo, que no compila
 *   un components.conf.
 * - Sin URI_SAFE_FOR_UNTRUSTED_CONTENT ni URI_*_LOAD_IN_CHILD: la página se abre en el proceso padre con el principal de
 *   sistema, como about:preferences. El registro solo existe en el proceso padre: para una web (proceso de contenido)
 *   about:escudos no existe, y aunque existiera no podría abrirla, enlazarla ni meterla en un marco.
 * - La página (paginas/escudos-ayuda.html) es HTML estático sin scripts, con una CSP que solo deja cargar archivos del
 *   propio navegador (resource: y chrome:). Sus textos, en Fluent (locales/<idioma>/escudos-ayuda.ftl); sus hojas
 *   (tokens.css, comun.css y paginas/escudos-ayuda.css) las pone AegisArranque al crearse el documento.
 *
 * about:protections (el panel de protecciones de Firefox, con su contador aparte) lleva a Ajustes › Escudos: una sola
 * cara para la protección (decisión del usuario, 2026-10-20). Mismo camino que about:escudos: en el proceso padre se
 * registra otra fábrica para su contrato, que pisa la de Firefox (AboutRedirector.cpp). Sus banderas ya no la mandan a
 * un proceso de contenido: se abre en el padre una página mínima (data:, sin scripts) y, al insertarse su documento
 * (observador de document-element-inserted), en su DOMContentLoaded se hace location.replace(«about:preferences#escudos»).
 * replace() sustituye la entrada del historial dentro del mismo proceso y de la misma pestaña: «Atrás» vuelve a lo de
 * antes y about:protections no queda en el historial, tampoco al restaurar una pestaña que la tenía. Solo para lo que abre el navegador o el usuario
 * (principal de sistema); si la pide una web, la carga se aborta.
 *
 * Ligero: nada en reposo. El módulo solo trabaja cuando se abre la página.
 */

const NOMBRE = "escudos";
const DIRECCION = `about:${NOMBRE}`;
const CONTRATO = `@mozilla.org/network/protocol/about;1?what=${NOMBRE}`;
const CID = Components.ID("{f2a7c5b9-150b-47af-9d45-f0a6abc9c385}");
const PAGINA = new URL("paginas/escudos-ayuda.html", import.meta.url).href;

/** El módulo about:escudos (nsIAboutModule). Su propia fábrica: un solo objeto para todo el proceso. */
const modulo = {
  QueryInterface: ChromeUtils.generateQI(["nsIAboutModule", "nsIFactory"]),

  createInstance(iid) {
    return this.QueryInterface(iid);
  },

  getURIFlags() {
    // La barra de direcciones la trata como una página segura del navegador (como Ajustes).
    return Ci.nsIAboutModule.IS_SECURE_CHROME_UI;
  },

  getChromeURI() {
    return Services.io.newURI(PAGINA);
  },

  newChannel(uri, loadInfo) {
    const canal = Services.io.newChannelFromURIWithLoadInfo(Services.io.newURI(PAGINA), loadInfo);
    // La dirección que se ve es about:escudos (con su #ancla), y el documento tiene el principal de sistema: las hojas
    // de Aegis se le aplican igual que a Ajustes. Solo llega aquí lo que ha abierto el navegador o el usuario.
    canal.originalURI = uri;
    canal.owner = Services.scriptSecurityManager.getSystemPrincipal();
    return canal;
  },
};

const CONTRATO_PROTECCIONES = "@mozilla.org/network/protocol/about;1?what=protections";
const CID_PROTECCIONES = Components.ID("{0b6c2f4e-8d1a-4b7e-9c35-2e4f6a1d7b90}");
const AJUSTES_ESCUDOS = "about:preferences#escudos";
/** La página de paso: vacía, sin scripts y del color del tema (sin destello blanco en oscuro). */
const PASO =
  "data:text/html;charset=utf-8," +
  encodeURIComponent(
    '<!DOCTYPE html><meta charset="utf-8">' +
      `<meta http-equiv="Content-Security-Policy" content="default-src 'none'">` +
      '<meta name="color-scheme" content="light dark"><title></title>'
  );

/**
 * Cuando la página de paso ya está en su pestaña, su propio location.replace() la cambia por Ajustes › Escudos: la
 * entrada del historial se sustituye en el mismo proceso, como un redirect. Un solo observador, que se quita cuando ya
 * no queda ninguna página de paso por llegar.
 */
let porLlegar = 0;
function observador(doc) {
  const win = doc?.defaultView;
  if (!win || !/^about:protections(?:[?#]|$)/i.test(doc.documentURI) || !doc.nodePrincipal?.isSystemPrincipal) {
    return;
  }
  if (--porLlegar <= 0) {
    porLlegar = 0;
    Services.obs.removeObserver(observador, "document-element-inserted");
  }
  win.addEventListener("DOMContentLoaded", () => win.location.replace(AJUSTES_ESCUDOS), { once: true });
}
function sustituirAlCargar() {
  if (porLlegar++ == 0) {
    Services.obs.addObserver(observador, "document-element-inserted");
  }
}

/** about:protections → Ajustes › Escudos (ver la cabecera). */
const moduloProtecciones = {
  QueryInterface: ChromeUtils.generateQI(["nsIAboutModule", "nsIFactory"]),

  createInstance(iid) {
    return this.QueryInterface(iid);
  },

  getURIFlags() {
    // Sin URI_*_LOAD_IN_CHILD: en el proceso padre, como Ajustes, que es adonde lleva.
    return Ci.nsIAboutModule.IS_SECURE_CHROME_UI | Ci.nsIAboutModule.HIDE_FROM_ABOUTABOUT;
  },

  getChromeURI() {
    // Lo que de verdad se ve (lo usa, p. ej., el bloqueo de páginas por política).
    return Services.io.newURI("chrome://browser/content/preferences/preferences.xhtml");
  },

  newChannel(uri, loadInfo) {
    if (!loadInfo?.triggeringPrincipal?.isSystemPrincipal) {
      throw Components.Exception("Aegis: about:protections solo desde el navegador", Cr.NS_ERROR_ABORT);
    }
    const canal = Services.io.newChannelFromURIWithLoadInfo(Services.io.newURI(PASO), loadInfo);
    canal.originalURI = uri;
    // El refresco a about:preferences necesita el principal de sistema (una web no puede enlazar Ajustes).
    canal.owner = Services.scriptSecurityManager.getSystemPrincipal();
    sustituirAlCargar();
    return canal;
  },
};

export const AegisEscudosAyuda = {
  DIRECCION,

  /** Una vez por arranque, en el proceso padre (lo llama AegisArranque.inicio). Idempotente. */
  registrar() {
    const registro = Components.manager.QueryInterface(Ci.nsIComponentRegistrar);
    if (!registro.isContractIDRegistered(CONTRATO)) {
      registro.registerFactory(CID, "Aegis: about:escudos", CONTRATO, modulo);
    }
    // about:protections ya existe (el de Firefox): se pisa una sola vez con el de Aegis.
    if (!registro.isCIDRegistered(CID_PROTECCIONES)) {
      registro.registerFactory(CID_PROTECCIONES, "Aegis: about:protections", CONTRATO_PROTECCIONES, moduloProtecciones);
    }
  },

  /**
   * Abre la página (en su ancla, si se da) en una pestaña junto a la actual. Si ya hay una pestaña con la página en
   * esa ventana o en otra del mismo tipo (normal o privada), va a ella y salta al ancla en lugar de abrir otra.
   *
   * @param {Window} win ventana del navegador, o un documento suyo (Ajustes)
   * @param {string} [ancla] id de la sección: «huella», «https»…
   */
  abrir(win, ancla = "") {
    const ventana = win?.gBrowser ? win : win?.browsingContext?.topChromeWindow;
    if (!ventana?.switchToTabHavingURI) {
      return;
    }
    ventana.switchToTabHavingURI(DIRECCION + (ancla ? `#${ancla}` : ""), true, {
      ignoreFragment: "whenComparingAndReplace",
      relatedToCurrent: true,
      triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
    });
  },
};
