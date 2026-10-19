/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · Conexiones: la puerta de todo lo que el navegador hace en la red por su cuenta (docs/GUIA.md, principio 1;
 * docs/CONEXIONES.md). Con un perfil nuevo no sale nada hasta que el usuario elige en about:conexiones, que se abre
 * en la primera ventana mientras no haya decidido.
 *
 * Lo que el usuario elige se guarda en sus prefs (aegis.conexiones.aceptadas y un interruptor por grupo:
 * aegis.conexiones.<grupo>). De ahí salen las prefs «efectivas» de cada servicio, que este módulo escribe en la rama
 * de valores por defecto en cada arranque y cada vez que cambia una de las suyas (no se guardan en prefs.js). Sus
 * valores compilados (settings/prefs/66-conexiones.js) son los de la puerta cerrada: si este módulo no llega a
 * ejecutarse, todo sigue cerrado.
 * - Remote Settings: aegis.remotesettings.colecciones, la lista de colecciones que pueden sincronizarse (parche
 *   0400-privacidad/0003). Vacía, Remote Settings no conecta.
 * - Actualizaciones: app.update.aegis.automaticas (el mismo parche: manualUpdateOnly). Esta va como valor del usuario
 *   (en prefs.js), no en la rama por defecto: la tarea de actualización en segundo plano de Windows, que corre con Aegis
 *   cerrado, solo copia del perfil las prefs app.update.* que haya en prefs.js. «Buscar actualizaciones»
 *   en Acerca de sigue funcionando a mano.
 * - Listas del clasificador de URLs: browser.safebrowsing.update.enabled; las de rastreo llegan por Remote Settings
 *   (moz-sbrs) y las de Safe Browsing, de Google.
 * - Safe Browsing: browser.safebrowsing.malware.enabled y phishing.enabled (solo si la build trae la clave de Google).
 * - Notificaciones de webs: dom.push.connection.enabled.
 * - Traducción de páginas: browser.translations.enable y sus colecciones de Remote Settings (modelos bajo demanda).
 * - Códecs: media.gmp-manager.updateEnabled y media.gmp-gmpopenh264.enabled. Widevine, solo si una web lo pide y el
 *   usuario activa el DRM en su aviso (media.eme.enabled, apagado de serie): eso abre también la comprobación.
 * Todas se aplican sin reiniciar: los servicios leen la pref en cada uso u observan sus cambios.
 *
 * Ligero: sin temporizadores. Solo trabaja al arrancar, cuando cambia una pref suya y cuando se abre su página.
 */

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  GMPInstallManager: "resource://gre/modules/GMPInstallManager.sys.mjs",
  RemoteSettings: "resource://services-settings/remote-settings.sys.mjs",
});

const PREFIJO = "aegis.conexiones.";
const ACEPTADAS = `${PREFIJO}aceptadas`;
const DECIDIDO = `${PREFIJO}decidido`;
const DRM = "media.eme.enabled";
const ACTUALIZACIONES_AUTO = "app.update.aegis.automaticas";

/** Grupos, en el orden de la página. Su valor de serie (settings/prefs/66-conexiones.js) es el que sale marcado. */
const GRUPOS = ["actualizaciones", "seguridad", "listas", "codecs", "traduccion", "safebrowsing", "push"];

/** Colecciones de Remote Settings de cada grupo («bucket/colección» o «bucket/*»). */
const COLECCIONES = {
  // CRLite y OneCRL (revocaciones), certificados intermedios, registros de transparencia, y la lista de bloqueo de
  // complementos y de controladores gráficos.
  seguridad: ["security-state/*", "blocklists/*"],
  // Listas de la protección contra rastreo (Firefox ya no las baja de shavar: llegan por Remote Settings, moz-sbrs),
  // sus excepciones para que las webs no se rompan y los parámetros de rastreo que se quitan de los enlaces.
  listas: ["main/tracking-protection-lists", "main/url-classifier-exceptions", "main/query-stripping"],
  // Traducción de páginas (en el equipo): la lista de modelos y el motor; los modelos, como adjuntos, solo cuando el
  // usuario pide traducir o descarga un idioma.
  traduccion: ["main/translations-models-v2", "main/translations-wasm-v2"],
};

const NOMBRE = "conexiones";
const DIRECCION = `about:${NOMBRE}`;
const CONTRATO = `@mozilla.org/network/protocol/about;1?what=${NOMBRE}`;
const CID = Components.ID("{e27d520f-feb0-41a8-8b40-8261b94f06b4}");
const PAGINA = new URL("paginas/conexiones.html", import.meta.url).href;

/** ¿Trae la build la clave de Safe Browsing de Google? Sin ella, Firefox no descarga sus listas. */
function hayClaveSafeBrowsing() {
  const clave = Services.urlFormatter.formatURL("%GOOGLE_SAFEBROWSING_API_KEY%").trim();
  return !!clave && clave != "no-google-safebrowsing-api-key";
}

function aceptadas() {
  return Services.prefs.getBoolPref(ACEPTADAS, false);
}

/** El interruptor del grupo, tal como está (sin mirar si se ha aceptado). */
function elegido(grupo) {
  return Services.prefs.getBoolPref(PREFIJO + grupo, false);
}

/** ¿Puede conectar el grupo ahora? */
function activo(grupo) {
  return aceptadas() && elegido(grupo) && (grupo != "safebrowsing" || hayClaveSafeBrowsing());
}

/** ¿Ha activado el usuario el DRM (Widevine)? De serie está apagado (66-conexiones.js): solo cuenta si lo enciende. */
function drmPedido() {
  return Services.prefs.prefHasUserValue(DRM) && Services.prefs.getBoolPref(DRM, false);
}

/** Lo que estaba activo la última vez que se aplicó: para arrancar ya lo que se acaba de encender. */
let anterior = null;

/** Escribe las prefs efectivas de cada servicio en la rama de valores por defecto. */
function aplicar() {
  const on = Object.fromEntries(GRUPOS.map(g => [g, activo(g)]));
  const def = Services.prefs.getDefaultBranch("");
  const colecciones = GRUPOS.filter(g => on[g]).flatMap(g => COLECCIONES[g] ?? []);
  def.setStringPref("aegis.remotesettings.colecciones", colecciones.join(","));
  // Como valor del usuario (ver la cabecera). Con false, igual que el de serie, libpref no lo guarda: la tarea en segundo
  // plano no ve nada y se queda en «solo a mano», como sin aceptar.
  const antes = Services.prefs.getBoolPref(ACTUALIZACIONES_AUTO, false);
  Services.prefs.setBoolPref(ACTUALIZACIONES_AUTO, on.actualizaciones);
  // Al revocarlas, una descarga de actualización en curso se para (si no, terminaría aunque ya no se quiera).
  if (antes && !on.actualizaciones) {
    try {
      Cc["@mozilla.org/updates/update-service;1"]
        .getService(Ci.nsIApplicationUpdateService)
        .stopDownload()
        .catch(e => console.warn("Aegis: no se ha podido parar la descarga de la actualización", e));
    } catch (e) {
      console.warn("Aegis: no se ha podido parar la descarga de la actualización", e);
    }
  }
  def.setBoolPref("browser.safebrowsing.update.enabled", on.listas || on.safebrowsing);
  def.setBoolPref("browser.safebrowsing.malware.enabled", on.safebrowsing);
  def.setBoolPref("browser.safebrowsing.phishing.enabled", on.safebrowsing);
  def.setBoolPref("dom.push.connection.enabled", on.push);
  // Traducción: sin el grupo, la función no aparece (ni el botón de traducir ni los idiomas en Ajustes).
  def.setBoolPref("browser.translations.enable", on.traduccion);
  // Códecs: OpenH264 solo con el grupo; la comprobación y las descargas, también cuando el usuario activa el DRM en el
  // aviso que sale en una web que lo pide (eso es pedir Widevine, aunque no haya aceptado el grupo).
  def.setBoolPref("media.gmp-gmpopenh264.enabled", on.codecs);
  def.setBoolPref("media.gmp-manager.updateEnabled", on.codecs || drmPedido());
  // Cada comprobación de códecs pregunta además al servicio de Google por la versión de Widevine
  // (update.googleapis.com), aunque no se vaya a instalar: solo cuando el usuario ha pedido el DRM.
  def.setBoolPref("media.gmp-widevinecdm.allow-chromium-update", drmPedido());

  const encendidos = anterior ? GRUPOS.filter(g => on[g] && !anterior[g]) : [];
  anterior = on;
  if (encendidos.length) {
    arrancar(encendidos);
  }
}

/**
 * Lo que se acaba de permitir (en la página o en about:config) se pone en marcha ya, sin esperar a su temporizador
 * (un día para las actualizaciones, Remote Settings y los códecs). Solo cuando el usuario lo enciende, nunca al
 * arrancar: entonces mandan los temporizadores de Firefox. Las listas del clasificador y las notificaciones observan
 * su pref y arrancan solas.
 *
 * @param {string[]} grupos
 */
function arrancar(grupos) {
  if (grupos.includes("actualizaciones")) {
    try {
      Cc["@mozilla.org/updates/update-service;1"]
        .getService(Ci.nsIApplicationUpdateService)
        .checkForBackgroundUpdates()
        .catch(e => console.error("Aegis: conexiones, actualizaciones", e));
    } catch (e) {
      // Una build sin actualizaciones (paquetes de distribución): no hay nada que comprobar.
    }
  }
  if (grupos.some(g => COLECCIONES[g])) {
    // full: sin la ETag del último sondeo. Si ya se había aceptado otro grupo, el servidor contestaría «nada nuevo
    // desde entonces» y las colecciones que se acaban de permitir no se bajarían hasta que cambiaran (semanas, para
    // OneCRL).
    lazy.RemoteSettings.pollChanges({ trigger: "manual", full: true }).catch(e =>
      console.error("Aegis: conexiones, Remote Settings", e)
    );
  }
  if (grupos.includes("codecs")) {
    // simpleCheckAndInstall no vuelve a mirar si comprobó hace menos de un día: la comprobación de este arranque,
    // cerrada, cuenta como hecha.
    Services.prefs.clearUserPref("media.gmp-manager.lastCheck");
    new lazy.GMPInstallManager()
      .simpleCheckAndInstall()
      .catch(e => console.error("Aegis: conexiones, códecs", e));
  }
}

/** El módulo about:conexiones (nsIAboutModule), como about:escudos (escudos-ayuda.sys.mjs): proceso padre. */
const modulo = {
  QueryInterface: ChromeUtils.generateQI(["nsIAboutModule", "nsIFactory"]),

  createInstance(iid) {
    return this.QueryInterface(iid);
  },

  getURIFlags() {
    return Ci.nsIAboutModule.IS_SECURE_CHROME_UI;
  },

  getChromeURI() {
    return Services.io.newURI(PAGINA);
  },

  newChannel(uri, loadInfo) {
    const canal = Services.io.newChannelFromURIWithLoadInfo(Services.io.newURI(PAGINA), loadInfo);
    canal.originalURI = uri;
    canal.owner = Services.scriptSecurityManager.getSystemPrincipal();
    return canal;
  },
};

/** Documentos de la página ya preparados. */
const preparados = new WeakSet();

/**
 * Prepara la página: marca los interruptores con lo elegido (o con los valores de serie, si aún no se ha decidido)
 * y responde a los botones. La página es HTML estático sin scripts (su CSP no los admite): todo lo hace este módulo
 * desde el proceso padre.
 *
 * @param {Document} doc
 */
function prepararPagina(doc) {
  const casillas = () => [...doc.querySelectorAll("input[data-grupo]")];
  const clave = hayClaveSafeBrowsing();

  // Los interruptores enseñan lo elegido (o lo de serie): con «Ahora no» no cambian, solo dejan de valer hasta aceptar.
  const pintar = () => {
    const si = aceptadas();
    for (const c of casillas()) {
      const grupo = c.dataset.grupo;
      const disponible = grupo != "safebrowsing" || clave;
      c.disabled = !disponible;
      c.checked = disponible && elegido(grupo);
      c.closest(".conexiones-fila")?.toggleAttribute("no-disponible", !disponible);
    }
    doc.getElementById("conexiones-safebrowsing-sin-clave").hidden = clave;
    doc.l10n.setAttributes(doc.getElementById("conexiones-aceptar"), si ? "conexiones-guardar" : "conexiones-aceptar");
    doc.l10n.setAttributes(doc.getElementById("conexiones-ahora-no"), si ? "conexiones-ninguna" : "conexiones-ahora-no");
  };

  const avisar = id => {
    const estado = doc.getElementById("conexiones-estado");
    doc.l10n.setAttributes(estado, id);
    estado.hidden = false;
  };

  doc.getElementById("conexiones-aceptar").addEventListener("click", () => {
    const eleccion = Object.fromEntries(casillas().map(c => [c.dataset.grupo, c.checked]));
    AegisConexiones.aceptar(eleccion);
    pintar();
    avisar("conexiones-estado-aceptadas");
  });
  doc.getElementById("conexiones-ahora-no").addEventListener("click", () => {
    AegisConexiones.ahoraNo();
    pintar();
    avisar("conexiones-estado-ninguna");
  });
  pintar();
}

export const AegisConexiones = {
  DIRECCION,
  GRUPOS,

  /** Una vez por arranque, en el proceso padre y antes que nada que use la red (AegisArranque.inicio). */
  inicio() {
    const registro = Components.manager.QueryInterface(Ci.nsIComponentRegistrar);
    if (!registro.isContractIDRegistered(CONTRATO)) {
      registro.registerFactory(CID, "Aegis: about:conexiones", CONTRATO, modulo);
    }
    aplicar();
    Services.prefs.addObserver(PREFIJO, aplicar);
    Services.prefs.addObserver(DRM, aplicar);
  },

  /**
   * ¿Puede conectar este grupo? Para el código de Aegis que descargue algo por su cuenta (p. ej. las listas propias
   * de los Escudos: grupo «listas»).
   *
   * @param {string} grupo
   */
  permitido(grupo) {
    return activo(grupo);
  },

  /**
   * Acepta las conexiones con estos interruptores. Lo que se enciende arranca al momento (aplicar → arrancar).
   *
   * @param {Object<string, boolean>} eleccion grupo → encendido
   */
  aceptar(eleccion) {
    for (const g of GRUPOS) {
      Services.prefs.setBoolPref(PREFIJO + g, !!eleccion[g]);
    }
    Services.prefs.setBoolPref(DECIDIDO, true);
    Services.prefs.setBoolPref(ACEPTADAS, true);
  },

  /** «Ahora no» (o «No permitir ninguna»): nada se conecta por su cuenta. Los interruptores se quedan como estaban. */
  ahoraNo() {
    Services.prefs.setBoolPref(DECIDIDO, true);
    Services.prefs.setBoolPref(ACEPTADAS, false);
  },

  /** ¿Está decidido? Mientras no, la página se abre en la primera ventana de cada arranque. */
  get decidido() {
    return Services.prefs.getBoolPref(DECIDIDO, false);
  },

  /** Grupos activos ahora (para Ajustes). */
  activos() {
    return GRUPOS.filter(activo);
  },

  /**
   * La primera ventana de cada arranque, mientras el usuario no haya decidido: abre la página en primer plano. Si se
   * cierra sin elegir, vuelve a salir en el siguiente arranque; hasta entonces no se conecta nada.
   *
   * @param {Window} win
   */
  ventana(win) {
    if (this._mostrada || this.decidido || !win?.gBrowser || win.closed) {
      return;
    }
    if (Services.prefs.getBoolPref("aegis.tor.instancia", false)) {
      // La instancia con Tor tiene su propio perfil de usar y tirar: no es una bienvenida.
      return;
    }
    this._mostrada = true;
    this.abrir(win);
  },

  /**
   * Abre la página en una pestaña (o va a la que ya la tenga).
   *
   * @param {Window} win ventana del navegador, o un documento suyo (Ajustes)
   */
  abrir(win) {
    const ventana = win?.gBrowser ? win : win?.browsingContext?.topChromeWindow;
    ventana?.switchToTabHavingURI?.(DIRECCION, true, {
      relatedToCurrent: true,
      triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
    });
  },

  /**
   * Cada documento de la página (AegisArranque.aplicarHojas, en document-element-inserted).
   *
   * @param {Document} doc
   */
  pagina(doc) {
    if (preparados.has(doc) || !doc.nodePrincipal?.isSystemPrincipal) {
      return;
    }
    preparados.add(doc);
    const win = doc.defaultView;
    if (doc.readyState == "loading") {
      win.addEventListener("DOMContentLoaded", () => prepararPagina(doc), { once: true });
    } else {
      prepararPagina(doc);
    }
  },
};
