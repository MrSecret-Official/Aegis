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

export const AegisEscudosAyuda = {
  DIRECCION,

  /** Una vez por arranque, en el proceso padre (lo llama AegisArranque.inicio). Idempotente. */
  registrar() {
    const registro = Components.manager.QueryInterface(Ci.nsIComponentRegistrar);
    if (registro.isContractIDRegistered(CONTRATO)) {
      return;
    }
    registro.registerFactory(CID, "Aegis: about:escudos", CONTRATO, modulo);
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
