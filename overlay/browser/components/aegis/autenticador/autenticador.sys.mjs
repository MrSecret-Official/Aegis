/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · autenticador: códigos de verificación en dos pasos (TOTP) guardados junto a cada inicio de sesión. Detalle,
 * límites y por qué, en docs/PRIVACIDAD.md, «Códigos de verificación».
 *
 * Dónde se guardan: en aegis-autenticador.json, en el perfil, una entrada por inicio de sesión:
 *   { "version": 1, "entradas": [ { "guid": "{…}", "origen": "https://…", "datos": "<SDR>" } ] }
 * - «datos» es el secreto con sus parámetros (algoritmo, dígitos, periodo, emisor, cuenta), cifrado con
 *   nsILoginManagerCrypto (SDR): la misma clave de key4.db que cifra logins.json, que depende de la contraseña
 *   principal. Nada del secreto queda en claro en el disco ni en prefs.
 * - «guid» y «origen» van en claro: ya lo están en logins.json (el guid enlaza la entrada; el origen permite saber si
 *   un sitio tiene código sin descifrar nada, es decir, sin pedir la contraseña principal al enfocar un campo).
 * - Por qué un archivo propio y no un campo del inicio de sesión: nsILoginInfo de Firefox 158 no tiene ninguno para
 *   esto, y el único libre (unknownFields) es de Firefox Sync, que lo reescribe. Un archivo aparte no cambia el
 *   formato de logins.json, así que importar, exportar (que además nunca incluye estos secretos) o la limpieza de
 *   Firefox no lo tocan. Al borrar un inicio de sesión (o todos, también al restablecer la contraseña principal) se
 *   borra su código.
 *
 * Qué se hace con ellos:
 * - el código se calcula en el proceso principal (totp.sys.mjs) y solo sale de él el código, nunca el secreto: el
 *   panel de contraseñas, about:logins y el autorrelleno reciben seis u ocho cifras;
 * - añadir un código, cambiar su clave o recibirlo de otro Aegis exige la contraseña principal, aunque guardar una
 *   contraseña ya no la exija: sin ella, quien copie el perfil tendría los dos pasos de la cuenta (guardar() y
 *   recibir() lo comprueban; abrirDialogo pide crearla antes de abrir el diálogo para añadir). Quitar uno, no: puede
 *   quedar uno de cuando la había, y quitarlo no debe obligar a crearla (el diálogo de uno que ya está se abre igual;
 *   si sin ella se intenta cambiar la clave, dice cómo crearla);
 * - ver o copiar un código pide verificar la identidad (Windows Hello o la contraseña principal), como ver una
 *   contraseña, con la misma gracia de 5 minutos que about:logins;
 * - copiar lo marca como sensible (fuera del historial del portapapeles de Windows) y, a los 30 s, lo borra si sigue
 *   ahí: un único temporizador tras copiar, nunca en reposo;
 * - autorrelleno: AegisCodigosChild/Parent, registrados solo mientras haya algún código guardado;
 * - pasar a otro Aegis (contrasenas/transferencia/): van dentro del paquete cifrado con el código de 6 palabras, junto
 *   a su inicio de sesión, salvo que se desmarque; al recibirlos, solo se guardan en cuentas que no tengan ya uno.
 *
 * Nada de red: ni para leer los QR (dialogos/autenticador.mjs, en el equipo) ni para calcular los códigos.
 */

import { codigo as calcularCodigo, leer as leerTotp, normalizar as normalizarTotp } from "./totp.sys.mjs";

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  AegisContrasenas: new URL("../contrasenas.sys.mjs", import.meta.url).href,
  BrowserWindowTracker: "resource:///modules/BrowserWindowTracker.sys.mjs",
  clearTimeout: "resource://gre/modules/Timer.sys.mjs",
  LoginHelper: "resource://gre/modules/LoginHelper.sys.mjs",
  setTimeout: "resource://gre/modules/Timer.sys.mjs",
});

const NOMBRE_ARCHIVO = "aegis-autenticador.json";
/** Hay al menos un código guardado: así el arranque no lee el archivo para saber si registrar el autorrelleno. */
const PREF_HAY = "aegis.autenticador.hay";
const PREF_RELLENAR = "aegis.autenticador.rellenar";
const PREF_PORTAPAPELES = "aegis.autenticador.portapapeles_segundos";
/** Como about:logins (AUTH_TIMEOUT_MS): tras verificar la identidad, 5 minutos sin volver a pedirlo. */
const GRACIA_MS = 5 * 60 * 1000;
const ACTOR = "AegisCodigos";
const DIALOGO = "chrome://browser/content/aegis/autenticador.xhtml";
const HOJA_PANEL = "estilos/codigos.css";
const HTML = "http://www.w3.org/1999/xhtml";

function token() {
  return Cc["@mozilla.org/security/internalkeytoken;1"].createInstance(Ci.nsIPKCS11Token);
}

function sdr() {
  return Cc["@mozilla.org/login-manager/crypto/SDR;1"].getService(Ci.nsILoginManagerCrypto);
}

let localizacion;
/**
 * @param {string} id
 * @param {object} [args]
 * @returns {string}
 */
function texto(id, args) {
  localizacion ??= new Localization(["aegis.ftl", "branding/brand.ftl"], true);
  const [m] = localizacion.formatMessagesSync([{ id, args }]);
  return m?.value ?? "";
}

/** La bóveda está abierta (o no tiene contraseña principal): descifrar no pedirá nada. */
function bovedaAbierta() {
  const t = token();
  return !t.hasPassword || t.isLoggedIn;
}

/* ───────── Archivo ───────── */

function ruta() {
  return PathUtils.join(PathUtils.profileDir, NOMBRE_ARCHIVO);
}

/** @type {{version: number, entradas: {guid: string, origen: string, datos: string}[]} | null} */
let almacen = null;
let cola = Promise.resolve();

async function cargar() {
  if (almacen) {
    return almacen;
  }
  let leido = null;
  try {
    leido = await IOUtils.readJSON(ruta());
  } catch (e) {
    if (e.name != "NotFoundError") {
      console.error("Aegis: no se pudo leer el autenticador", e);
    }
  }
  const entradas = Array.isArray(leido?.entradas)
    ? leido.entradas.filter(
        x => typeof x?.guid == "string" && typeof x?.origen == "string" && typeof x?.datos == "string"
      )
    : [];
  almacen ??= { version: 1, entradas };
  return almacen;
}

/** Escribe el archivo (atómico: primero a .tmp) y actualiza la marca y el autorrelleno. En cola, uno tras otro. */
function escribir() {
  // Un fallo anterior no bloquea las escrituras siguientes (cada una escribe el estado completo).
  cola = cola.catch(() => {}).then(async () => {
    const datos = await cargar();
    if (datos.entradas.length) {
      await IOUtils.writeJSON(ruta(), datos, { tmpPath: `${ruta()}.tmp` });
    } else {
      await IOUtils.remove(ruta(), { ignoreAbsent: true });
    }
    Services.prefs.setBoolPref(PREF_HAY, datos.entradas.length > 0);
    actualizarActor();
    Services.obs.notifyObservers(null, "aegis-autenticador-cambiado");
  });
  return cola;
}

/* ───────── Cifrado ───────── */

async function cifrar(totp) {
  const [cifrado] = await sdr().encryptMany([JSON.stringify(totp)]);
  if (!cifrado) {
    throw new Error("Aegis: no se pudo cifrar el código");
  }
  return cifrado;
}

/** Descifra el secreto de una entrada (si la bóveda está cerrada, NSS pide la contraseña principal). */
async function descifrar(entrada) {
  const [claro] = await sdr().decryptMany([entrada.datos]);
  if (!claro) {
    // Cifrado con otra clave (la contraseña principal se restableció) o dañado.
    throw Object.assign(new Error("Aegis: código ilegible"), { codigo: "ilegible" });
  }
  return JSON.parse(claro);
}

/**
 * Sin contraseña principal no se guarda ningún secreto: lanza un error con codigo «sin-principal» (el diálogo lo
 * explica).
 */
function exigirPrincipal() {
  if (!token().hasPassword) {
    throw Object.assign(new Error("Aegis: sin contraseña principal no se guardan códigos de verificación"), {
      codigo: "sin-principal",
    });
  }
}

/* ───────── Verificar la identidad ───────── */

let autorizadoHasta = 0;

/**
 * Windows Hello (o la contraseña principal, con la bóveda cerrada o sin autenticación del sistema), como para ver una
 * contraseña en about:logins. Tras verificar, 5 minutos sin volver a pedirlo.
 *
 * @param {Window} win ventana del navegador sobre la que sale el diálogo
 * @param {"ver"|"copiar"} accion
 */
async function verificarIdentidad(win, accion) {
  const { isAuthorized } = await lazy.LoginHelper.requestReauth(
    { documentGlobal: win },
    autorizadoHasta,
    texto(`aegis-codigos-autenticacion-${accion}`),
    texto("aegis-codigos-autenticacion-titulo"),
    "aegis_codigo"
  );
  if (isAuthorized) {
    autorizadoHasta = Date.now() + GRACIA_MS;
  }
  return isAuthorized;
}

/* ───────── Portapapeles ───────── */

let limpieza = null;

function textoDelPortapapeles() {
  try {
    const trans = Cc["@mozilla.org/widget/transferable;1"].createInstance(Ci.nsITransferable);
    trans.init(null);
    trans.addDataFlavor("text/plain");
    Services.clipboard.getData(trans, Services.clipboard.kGlobalClipboard);
    const valor = {};
    trans.getTransferData("text/plain", valor);
    return valor.value?.QueryInterface(Ci.nsISupportsString).data ?? null;
  } catch (e) {
    return null;
  }
}

/** Borra el código del portapapeles si sigue siendo lo último copiado (no borra lo que el usuario haya copiado luego). */
function limpiarPortapapeles(copiado) {
  if (limpieza) {
    lazy.clearTimeout(limpieza.id);
    limpieza = null;
  }
  if (textoDelPortapapeles() === copiado) {
    Services.clipboard.emptyClipboard(Services.clipboard.kGlobalClipboard);
  }
}

function programarLimpieza(copiado) {
  if (limpieza) {
    lazy.clearTimeout(limpieza.id);
  }
  const segundos = Services.prefs.getIntPref(PREF_PORTAPAPELES, 30);
  if (segundos <= 0) {
    limpieza = null;
    return;
  }
  // Un solo temporizador, solo tras copiar; se va al dispararse.
  limpieza = { copiado, id: lazy.setTimeout(() => limpiarPortapapeles(copiado), segundos * 1000) };
}

/* ───────── Autorrelleno ───────── */

let actorRegistrado = false;

/** El autorrelleno existe solo si hay códigos guardados y está activado: sin ellos, ninguna página lleva el actor. */
function actualizarActor() {
  const quiere = Services.prefs.getBoolPref(PREF_HAY, false) && Services.prefs.getBoolPref(PREF_RELLENAR, true);
  if (quiere == actorRegistrado) {
    return;
  }
  if (quiere) {
    ChromeUtils.registerWindowActor(ACTOR, {
      parent: { esModuleURI: new URL("AegisCodigosParent.sys.mjs", import.meta.url).href },
      child: {
        esModuleURI: new URL("AegisCodigosChild.sys.mjs", import.meta.url).href,
        events: { focusin: {}, pagehide: {} },
      },
      // Solo la página principal y solo https: nunca un marco (de otro sitio o no) ni una página sin cifrar.
      matches: ["https://*/*"],
      allFrames: false,
      // Tiene que vivir en los procesos de las webs (desde la 158, Firefox no instancia ahí los actores que no lo
      // declaran). Es seguro aunque la web se hiciera con su proceso: el lado del proceso principal no se fía de nada
      // de lo que manda (origen y marco los saca él del WindowGlobalParent, la posición solo coloca el panelito) y el
      // código solo llega tras un clic del usuario, y solo el del origen exacto de esa página.
      safeForUntrustedWebProcess: true,
    });
  } else {
    ChromeUtils.unregisterWindowActor(ACTOR);
  }
  actorRegistrado = quiere;
}

function panelDe(win) {
  const doc = win.document;
  let panel = doc.getElementById("aegis-codigo-panel");
  if (panel) {
    return panel;
  }
  try {
    win.windowUtils.loadSheetUsingURIString(new URL(`../${HOJA_PANEL}`, import.meta.url).href, win.windowUtils.AUTHOR_SHEET);
  } catch (e) {
    console.error("Aegis: hoja del panel de códigos", e);
  }
  panel = doc.createXULElement("panel");
  panel.id = "aegis-codigo-panel";
  panel.className = "aegis-codigo-panel";
  panel.setAttribute("type", "arrow");
  panel.setAttribute("noautofocus", "true");
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-labelledby", "aegis-codigo-panel-titulo");
  const caja = doc.createElementNS(HTML, "div");
  caja.className = "aegis-codigo-caja";
  const titulo = doc.createElementNS(HTML, "p");
  titulo.id = "aegis-codigo-panel-titulo";
  titulo.className = "aegis-codigo-titulo";
  const detalle = doc.createElementNS(HTML, "p");
  detalle.className = "aegis-codigo-detalle";
  const botones = doc.createElementNS(HTML, "div");
  botones.className = "aegis-codigo-botones";
  caja.append(titulo, detalle, botones);
  panel.append(caja);
  (doc.getElementById("mainPopupSet") ?? doc.documentElement).append(panel);
  return panel;
}

/**
 * El panelito junto al campo: «Código de verificación» y un botón por cuenta con código en el sitio. Rellena tras un
 * clic (o Intro con el teclado: la flecha abajo en el campo lleva al panel).
 *
 * @param {object} opciones
 * @param {Element} opciones.browser el <browser> de la pestaña
 * @param {{left: number, top: number, width: number, height: number}} opciones.rect el campo, en la pantalla (CSS)
 * @param {string} opciones.origen
 * @param {{guid: string}[]} opciones.entradas
 * @param {(codigo: string) => void} opciones.rellenar
 */
async function ofrecer({ browser, rect, origen, entradas, rellenar }) {
  // La ventana del <browser> (ownerGlobal no existe desde un módulo: lo pone el código de la ventana).
  const win = browser.ownerDocument?.defaultView;
  if (!win || win.closed || win.gBrowser?.selectedBrowser != browser) {
    return;
  }
  const panel = panelDe(win);
  if (panel.state == "open" || panel.state == "showing") {
    panel.hidePopup();
  }
  const doc = win.document;
  const host = (() => {
    try {
      return new URL(origen).host;
    } catch (e) {
      return origen;
    }
  })();
  panel.querySelector(".aegis-codigo-titulo").textContent = texto("aegis-codigos-ofrecer-titulo");
  panel.querySelector(".aegis-codigo-detalle").textContent = texto("aegis-codigos-ofrecer-texto", { sitio: host });

  // Con varias cuentas en el sitio, su usuario (solo si la bóveda ya está abierta: ofrecer nunca pide nada).
  const cuentas = new Map();
  if (entradas.length > 1 && bovedaAbierta()) {
    try {
      for (const login of await Services.logins.searchLoginsAsync({ origin: origen })) {
        cuentas.set(login.QueryInterface(Ci.nsILoginMetaInfo).guid, login.username);
      }
    } catch (e) {}
  }
  const botones = panel.querySelector(".aegis-codigo-botones");
  botones.replaceChildren();
  entradas.forEach((entrada, i) => {
    const boton = doc.createElementNS(HTML, "button");
    // Con varias cuentas, todos secundarios: ninguna es «la» acción (DISENO: una sola principal).
    boton.className = entradas.length == 1 ? "aegis-codigo-rellenar" : "aegis-codigo-rellenar secundario";
    boton.textContent =
      entradas.length == 1
        ? texto("aegis-codigos-rellenar")
        : texto("aegis-codigos-rellenar-cuenta", { cuenta: cuentas.get(entrada.guid) || String(i + 1) });
    boton.addEventListener("click", async () => {
      boton.disabled = true;
      try {
        const { codigo } = await AegisAutenticador.codigoDe(entrada.guid);
        rellenar(codigo);
        panel.hidePopup();
      } catch (e) {
        if (e?.codigo != "ilegible" && e?.result != Cr.NS_ERROR_ABORT) {
          console.error("Aegis: rellenar el código", e);
        }
        panel.querySelector(".aegis-codigo-detalle").textContent = texto("aegis-codigos-ilegible");
        boton.disabled = false;
      }
    });
    botones.append(boton);
  });
  panel.aegisBrowser = browser;
  panel.openPopupAtScreenRect("after_start", rect.left, rect.top, rect.width, rect.height, false, false);
}

/* ───────── Observadores ───────── */

async function quitarPorGuid(guids) {
  if (!Services.prefs.getBoolPref(PREF_HAY, false)) {
    return;
  }
  const datos = await cargar();
  const antes = datos.entradas.length;
  datos.entradas = datos.entradas.filter(e => !guids.includes(e.guid));
  if (datos.entradas.length != antes) {
    await escribir();
  }
}

const observador = {
  observe(sujeto, tema, dato) {
    if (tema == "nsPref:changed") {
      actualizarActor();
      return;
    }
    if (tema == "quit-application-granted") {
      // Al cerrar, no dejar un código copiado en el portapapeles.
      if (limpieza) {
        limpiarPortapapeles(limpieza.copiado);
      }
      return;
    }
    if (tema != "passwordmgr-storage-changed") {
      return;
    }
    const tarea = (async () => {
      switch (dato) {
        case "removeLogin":
          await quitarPorGuid([sujeto.QueryInterface(Ci.nsILoginMetaInfo).guid]);
          break;
        case "removeAllLogins":
          if (Services.prefs.getBoolPref(PREF_HAY, false)) {
            (await cargar()).entradas = [];
            await escribir();
          }
          break;
        case "modifyLogin": {
          // El origen de la entrada puede cambiar al editarla: el código lo sigue.
          if (!Services.prefs.getBoolPref(PREF_HAY, false)) {
            break;
          }
          const viejo = sujeto.queryElementAt(0, Ci.nsILoginInfo);
          const nuevo = sujeto.queryElementAt(1, Ci.nsILoginInfo);
          const guidViejo = viejo.QueryInterface(Ci.nsILoginMetaInfo).guid;
          const guidNuevo = nuevo.QueryInterface(Ci.nsILoginMetaInfo).guid;
          const entrada = (await cargar()).entradas.find(e => e.guid == guidViejo);
          if (entrada && (entrada.origen != nuevo.origin || guidViejo != guidNuevo)) {
            entrada.origen = nuevo.origin;
            entrada.guid = guidNuevo;
            await escribir();
          }
          break;
        }
      }
    })();
    tarea.catch(e => console.error("Aegis: autenticador", e));
  },
};

/* ───────── API ───────── */

export const AegisAutenticador = {
  /** Una vez por arranque: solo observadores y, si hay códigos, el autorrelleno. Sin leer el archivo. */
  inicio() {
    Services.obs.addObserver(observador, "passwordmgr-storage-changed");
    Services.obs.addObserver(observador, "quit-application-granted");
    Services.prefs.addObserver(PREF_RELLENAR, observador);
    actualizarActor();
  },

  /** Lo que pega el usuario o lee el QR (totp.sys.mjs). Lanza ErrorTotp si no vale. */
  leer: leerTotp,

  /**
   * Las entradas guardadas, sin descifrar nada.
   *
   * @returns {Promise<{guid: string, origen: string}[]>}
   */
  async entradas() {
    if (!Services.prefs.getBoolPref(PREF_HAY, false)) {
      return [];
    }
    return (await cargar()).entradas.map(({ guid, origen }) => ({ guid, origen }));
  },

  /** Las de un origen exacto (para el autorrelleno). */
  async entradasDe(origen) {
    return (await this.entradas()).filter(e => e.origen == origen);
  },

  async tiene(guid) {
    return (await this.entradas()).some(e => e.guid == guid);
  },

  /**
   * Las entradas con la cuenta de cada una, para el panel: el usuario solo si la bóveda está abierta (no pide nada).
   *
   * @returns {Promise<{guid: string, origen: string, usuario: string|null}[]>}
   */
  async lista() {
    const entradas = await this.entradas();
    if (!entradas.length) {
      return [];
    }
    const usuarios = new Map();
    if (bovedaAbierta()) {
      try {
        for (const login of await Services.logins.getAllLogins()) {
          usuarios.set(login.QueryInterface(Ci.nsILoginMetaInfo).guid, login.username);
        }
      } catch (e) {}
    }
    return entradas.map(e => ({ ...e, usuario: usuarios.get(e.guid) ?? null }));
  },

  /**
   * Guarda (o sustituye) el código de un inicio de sesión.
   *
   * @param {string} guid
   * @param {string} entrada otpauth://… o la clave en base32
   */
  async guardar(guid, entrada) {
    const totp = leerTotp(entrada);
    const [login] = await Services.logins.searchLoginsAsync({ guid });
    if (!login) {
      throw new Error("Aegis: el inicio de sesión ya no existe");
    }
    // Añadir o cambiar la clave exige la contraseña principal (arriba, «Qué se hace con ellos»).
    exigirPrincipal();
    const datos = await cargar();
    const cifrado = await cifrar(totp);
    datos.entradas = datos.entradas.filter(e => e.guid != guid);
    datos.entradas.push({ guid, origen: login.origin, datos: cifrado });
    await escribir();
  },

  async quitar(guid) {
    const datos = await cargar();
    datos.entradas = datos.entradas.filter(e => e.guid != guid);
    await escribir();
  },

  /**
   * Para pasar a otro Aegis (contrasenas/transferencia/transferencia.sys.mjs, tras verificar la identidad): los secretos
   * descifrados de todas las entradas, por guid. Los que no se pueden leer (otra clave) no van.
   *
   * @returns {Promise<Map<string, object>>}
   */
  async secretosParaTransferir() {
    const mapa = new Map();
    if (!Services.prefs.getBoolPref(PREF_HAY, false)) {
      return mapa;
    }
    for (const entrada of (await cargar()).entradas) {
      try {
        mapa.set(entrada.guid, await descifrar(entrada));
      } catch (e) {
        // Ilegible: se queda fuera del paquete.
      }
    }
    return mapa;
  },

  /**
   * Al recibir de otro Aegis: guarda el código de un inicio de sesión que no tenga ninguno (nunca sustituye uno que ya
   * esté). Lo que llega se comprueba como lo que se pega (totp.sys.mjs).
   *
   * @param {string} guid
   * @param {object} totp
   * @returns {Promise<boolean>} true si se ha guardado; false si la cuenta ya tenía código
   */
  async recibir(guid, totp) {
    exigirPrincipal();
    const normal = normalizarTotp(totp ?? {});
    const [login] = await Services.logins.searchLoginsAsync({ guid });
    if (!login) {
      throw new Error("Aegis: el inicio de sesión ya no existe");
    }
    const datos = await cargar();
    if (datos.entradas.some(e => e.guid == guid)) {
      return false;
    }
    const cifrado = await cifrar(normal);
    // Otra vez: cifrar es asíncrono y alguien podría haberlo añadido entretanto.
    if (datos.entradas.some(e => e.guid == guid)) {
      return false;
    }
    datos.entradas.push({ guid, origen: login.origin, datos: cifrado });
    await escribir();
    return true;
  },

  /**
   * El código de ahora. Si la bóveda está cerrada, NSS pide la contraseña principal.
   *
   * @param {string} guid
   * @returns {Promise<{codigo: string, restante: number, periodo: number}>}
   */
  async codigoDe(guid) {
    const entrada = (await cargar()).entradas.find(e => e.guid == guid);
    if (!entrada) {
      throw Object.assign(new Error("Aegis: sin código"), { codigo: "ilegible" });
    }
    const totp = await descifrar(entrada);
    const { codigo, restante } = await calcularCodigo(totp);
    return { codigo, restante, periodo: totp.periodo };
  },

  /**
   * Ver el código (panel, about:logins): verifica la identidad primero.
   *
   * @returns {Promise<{codigo: string, restante: number, periodo: number} | null>} null si no se verifica
   */
  async ver(guid, win) {
    if (!(await verificarIdentidad(win, "ver"))) {
      return null;
    }
    return this.codigoDe(guid);
  },

  /**
   * El siguiente código de uno que ya se está viendo: sin preguntar, solo dentro de la gracia y con la bóveda abierta.
   * Si no, null y quien lo muestra lo vuelve a ocultar.
   */
  async siguiente(guid) {
    if (Date.now() >= autorizadoHasta || !bovedaAbierta()) {
      return null;
    }
    return this.codigoDe(guid);
  },

  /**
   * Copiar el código: verifica la identidad, lo copia como dato sensible y programa su borrado.
   *
   * @returns {Promise<boolean>}
   */
  async copiar(guid, win) {
    if (!(await verificarIdentidad(win, "copiar"))) {
      return false;
    }
    const { codigo } = await this.codigoDe(guid);
    const ayudante = Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper);
    ayudante.copyString(codigo, null, Ci.nsIClipboardHelper.Sensitive);
    programarLimpieza(codigo);
    return true;
  },

  /**
   * El diálogo para añadir, cambiar o quitar el código (dialogos/autenticador.xhtml), modal en la ventana.
   *
   * @param {Window} [win] ventana del navegador
   * @param {string} [guid] el inicio de sesión; si no, el diálogo deja elegirlo
   */
  async abrirDialogo(win, guid = "") {
    win = win && !win.closed ? win : lazy.BrowserWindowTracker.getTopWindow({ allowFromInactiveWorkspace: true });
    if (!win) {
      return;
    }
    // Añadir uno pide la contraseña principal (arriba, «Qué se hace con ellos»); antes de abrir este diálogo, porque
    // gDialogBox pondría el de la contraseña en cola detrás.
    if (!token().hasPassword && !(guid && (await this.tiene(guid)))) {
      if (!(await lazy.AegisContrasenas.pedirPrincipal(win))) {
        return;
      }
    }
    const args = Cc["@mozilla.org/hash-property-bag;1"].createInstance(Ci.nsIWritablePropertyBag2);
    args.setPropertyAsBool("async", true);
    args.setPropertyAsAString("aegis-guid", guid);
    if (win.gDialogBox) {
      await win.gDialogBox.open(DIALOGO, args);
    } else {
      win.openDialog(DIALOGO, "", "centerscreen,chrome,modal,titlebar", args);
    }
  },

  /** Para AegisCodigosParent. */
  ofrecer,

  /** Cierra el panelito del autorrelleno si es de esa pestaña. */
  retirar(browser) {
    const panel = browser?.ownerDocument?.getElementById("aegis-codigo-panel");
    if (panel && panel.aegisBrowser == browser && panel.state != "closed") {
      panel.hidePopup();
    }
  },

  /** La flecha abajo en el campo: el foco al primer botón del panelito. */
  enfocarPanel(browser) {
    const panel = browser?.ownerDocument?.getElementById("aegis-codigo-panel");
    if (panel?.state == "open" && panel.aegisBrowser == browser) {
      panel.querySelector("button")?.focus();
    }
  },

  /**
   * Passkeys: abre su página en la Configuración de Windows (Cuentas › Claves de acceso). Sin red: es una dirección
   * ms-settings: que abre el sistema.
   */
  gestionarPasskeys() {
    const servicio = Cc["@mozilla.org/uriloader/external-protocol-service;1"].getService(
      Ci.nsIExternalProtocolService
    );
    const info = servicio.getProtocolHandlerInfo("ms-settings");
    info.preferredAction = Ci.nsIHandlerInfo.useSystemDefault;
    info.alwaysAskBeforeHandling = false;
    info.launchWithURI(Services.io.newURI("ms-settings:savedpasskeys"), null);
  },
};
