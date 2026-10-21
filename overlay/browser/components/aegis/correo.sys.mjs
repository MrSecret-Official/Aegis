/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · el correo de la nueva pestaña (docs/DISENO.md §9, «Botón del correo»). El usuario decide cuál es su correo:
 * junto a Personalizar, un sobre que abre la dirección de su bandeja de entrada (paginas/correo.sys.mjs pinta el
 * botón, su diálogo y su menú). Este módulo es el lado del proceso principal: guarda, valida y abre.
 *
 * - La dirección vive en la pref aegis.nuevapestana.correo, de texto y SIN valor de serie (no está en settings/prefs).
 *   Gecko no copia a los procesos hijos una pref de texto sin valor de serie (ShouldSanitizePreference), así que la
 *   página no la lee: la pide al actor AegisPaginas (Aegis:Correo:Leer) y, cuando cambia, este módulo la manda solo
 *   al proceso de las páginas privilegiadas (MENSAJE_CORREO), como enfasis.sys.mjs hace con los personalizados.
 * - Solo https: (normalizar). Sin esquema, se le pone https://; javascript:, data:, file:, http: y las direcciones con
 *   usuario o contraseña no valen. El proceso principal vuelve a validar todo lo que llega de la página.
 * - Abrir: con la dirección guardada aquí (nunca con una que mande la página), en la misma pestaña o, con clic central
 *   o Ctrl+clic, en otra (BrowserUtils.whereToOpenLink). Es la única conexión, y solo porque el usuario lo pulsa, como
 *   cualquier navegación (docs/CONEXIONES.md). Sin favicon de la web del correo: el icono es siempre el sobre.
 *
 * Sin temporizadores ni trabajo en reposo: un observador de la pref, que se pone la primera vez que la página la pide.
 */

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  BrowserUtils: "resource://gre/modules/BrowserUtils.sys.mjs",
  PrivateBrowsingUtils: "resource://gre/modules/PrivateBrowsingUtils.sys.mjs",
});

export const PREF_CORREO = "aegis.nuevapestana.correo";
/** La dirección guardada, solo al proceso de las páginas privilegiadas (paginas/correo.sys.mjs). */
export const MENSAJE_CORREO = "Aegis:Paginas:Correo";
const MAX_URL = 2048;

/**
 * La dirección de la bandeja tal como se guarda, o por qué no vale. Sirve a la página (para decirlo al momento) y al
 * proceso principal (que es quien decide).
 *
 * @param {string} texto lo que ha escrito el usuario
 * @returns {{url: string}|{error: "vacio"|"esquema"|"direccion"}}
 */
export function normalizar(texto) {
  const t = typeof texto == "string" ? texto.trim() : "";
  if (!t) {
    return { error: "vacio" };
  }
  if (t.length > MAX_URL || /\s/.test(t)) {
    return { error: "direccion" };
  }
  // Sin esquema («mail.proton.me», «outlook.live.com/mail», «localhost:8443»): https://. Un «host:puerto» no es un
  // esquema.
  const conEsquema = /^[a-z][a-z0-9+.-]*:/i.test(t) && !/^[^:/?#]+:\d+(?:[/?#]|$)/.test(t) ? t : `https://${t}`;
  const url = URL.parse(conEsquema);
  if (!url) {
    return { error: "direccion" };
  }
  if (url.protocol != "https:") {
    return { error: "esquema" };
  }
  if (!url.hostname || url.username || url.password) {
    return { error: "direccion" };
  }
  return { url: url.href };
}

let observando = false;

/** Manda la dirección a los procesos de las páginas privilegiadas (las nuevas pestañas abiertas). */
function avisar() {
  const datos = { url: AegisCorreo.leer() };
  for (let i = 0; i < Services.ppmm.childCount; i++) {
    const proceso = Services.ppmm.getChildAt(i);
    if (proceso.remoteType == "privilegedabout") {
      proceso.sendAsyncMessage(MENSAJE_CORREO, datos);
    }
  }
}

function observar() {
  if (!observando) {
    observando = true;
    Services.prefs.addObserver(PREF_CORREO, avisar);
  }
}

export const AegisCorreo = {
  /** La dirección guardada (validada otra vez), o "" si no hay. */
  leer() {
    observar();
    const r = normalizar(Services.prefs.getStringPref(PREF_CORREO, ""));
    return r.url ?? "";
  },

  /**
   * @param {string} texto
   * @returns {{url: string}|{error: string}}
   */
  guardar(texto) {
    observar();
    const r = normalizar(texto);
    if (r.url) {
      Services.prefs.setStringPref(PREF_CORREO, r.url);
    }
    return r;
  },

  quitar() {
    observar();
    Services.prefs.clearUserPref(PREF_CORREO);
    return { url: "" };
  },

  /**
   * Abre la bandeja guardada desde la nueva pestaña que lo pide.
   *
   * @param {BrowsingContext} contexto el de la nueva pestaña (actor AegisPaginas)
   * @param {{button?: number, ctrlKey?: boolean, metaKey?: boolean, shiftKey?: boolean, altKey?: boolean}} teclas
   * @returns {{abierto: boolean}}
   */
  abrir(contexto, teclas) {
    const url = this.leer();
    const win = contexto?.topChromeWindow;
    if (!url || !win?.openTrustedLinkIn) {
      return { abierto: false };
    }
    const evento = {
      button: teclas?.button == 1 ? 1 : 0,
      ctrlKey: !!teclas?.ctrlKey,
      metaKey: !!teclas?.metaKey,
      shiftKey: !!teclas?.shiftKey,
      altKey: false,
    };
    const donde = lazy.BrowserUtils.whereToOpenLink(evento);
    if (donde == "current") {
      // La propia pestaña que lo pide (su contexto de navegación), como al escribir la dirección en la barra.
      contexto.top.fixupAndLoadURIString(url, {
        triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
      });
    } else {
      // Como un enlace (no como un marcador, que abre delante): browser.tabs.loadInBackground. Sigue en lo privado y en
      // el contenedor de la pestaña que lo pide, como los accesos de Firefox (PlacesFeed.openLink).
      const browser = contexto.top.embedderElement;
      const contenedor = parseInt(browser?.getAttribute("usercontextid"), 10);
      win.openTrustedLinkIn(url, donde, {
        inBackground: Services.prefs.getBoolPref("browser.tabs.loadInBackground", true),
        private: !!browser && lazy.PrivateBrowsingUtils.isBrowserPrivate(browser),
        ...(contenedor > 0 ? { userContextId: contenedor } : {}),
      });
    }
    return { abierto: true };
  },
};
