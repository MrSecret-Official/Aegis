/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · Tor: «Nueva ventana privada con Tor», como en Brave (menú ☰ y Ctrl+Mayús+U). Opcional y apagado mientras
 * no se use: tor no viene con el navegador, se descarga aparte cuando el usuario lo pide (descarga.sys.mjs).
 *
 * Por qué una INSTANCIA aparte con su propio perfil y no unas ventanas privadas más (comprobado en la 157): todas
 * las ventanas privadas de un perfil comparten la misma sesión (originAttributes.privateBrowsingId = 1: las mismas
 * cookies, la misma caché, el mismo almacenamiento y las mismas conexiones abiertas). Si una ventana privada con Tor
 * y otra sin Tor la compartieran, una web podría enlazar la IP de Tor con la real. Con un perfil aparte, cada
 * instancia tiene su proceso, su sesión y su configuración de red, y no hay nada en común.
 *
 * Dos papeles, según la pref aegis.tor.instancia:
 *
 * 1. Aegis normal (aegis.tor.instancia = false): Ajustes › Privacidad › «Tor» (descargar, borrar, puentes) y la entrada
 *    del menú. Al pulsarla:
 *    - si tor no está descargado, lo ofrece (un diálogo; nada se descarga sin que el usuario lo acepte);
 *    - si lo está, crea <perfil local>/aegis-tor/perfil con un user.js (más abajo) y lanza el mismo ejecutable con
 *      «-profile <esa carpeta> -wait-for-browser». Si esa instancia ya está abierta, Gecko le pasa la orden
 *      (remoting por perfil, nsAppRunner.cpp) y abre otra ventana en ella;
 *    - cuando esa instancia termina, borra su perfil. Si este Aegis se cerró antes, lo borra la siguiente vez que se
 *      abre una ventana con Tor o al arrancar (solo si no está en uso).
 *    Este Aegis nunca arranca tor ni cambia su propia red.
 *
 * 2. La instancia con Tor (aegis.tor.instancia = true, puesta por su user.js):
 *    - Todas sus ventanas son privadas (browser.privatebrowsing.autostart): ni historial ni cookies en el disco.
 *    - Arranca tor al empezar (proceso.sys.mjs) y lo para al salir (TAKEOWNERSHIP: si la instancia muere, tor también).
 *    - TODO su tráfico va por el SOCKS de tor con el DNS resuelto en tor: un filtro de canales en la última posición
 *      (registerChannelFilter) da a cada canal el proxy de tor con usuario y contraseña de su sitio
 *      (aislamiento.sys.mjs). Mientras tor arranca, las peticiones esperan (el filtro responde cuando hay puerto); si
 *      tor falla, van a un sumidero (un socket propio en 127.0.0.1 que cierra cada conexión). Nunca directas.
 *    - Defensa en profundidad, en su user.js: proxy manual SOCKS 127.0.0.1 con DNS remoto (si el filtro no se
 *      aplicara, todo iría a ese puerto, que es el de tor en cuanto se sabe y antes uno cerrado), sin «bypass» de proxy
 *      (Remote Settings y la telemetría reintentan sin proxy si pueden, ServiceRequest.sys.mjs), sin DoH, sin
 *      WebRTC, sin HTTP/3 ni WebTransport (UDP), sin geolocalización y Caja fuerte de huella digital.
 *    - Indicador «Tor» en la barra de herramientas (delante del menú ☰), estado en about:privatebrowsing (que es
 *      también su nueva pestaña) y «Nueva identidad» (menú ☰ y el indicador): ventana nueva, se cierran las demás,
 *      se borra todo lo de la sesión, se cortan las conexiones, circuitos nuevos (SIGNAL NEWNYM) y credenciales SOCKS
 *      nuevas.
 *
 * Ligero: con el Aegis normal, nada en reposo (ni observadores de red ni procesos). En la instancia, solo tor y los
 * eventos de su puerto de control; ningún temporizador propio.
 */

import {
  borrar as borrarArchivos,
  carpetaDe,
  datosFijados,
  descargar as descargarPaquete,
  instalada,
  raiz,
} from "./descarga.sys.mjs";
import { ProcesoTor } from "./proceso.sys.mjs";
import { Aislamiento } from "./aislamiento.sys.mjs";

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  AboutNewTab: "resource:///modules/AboutNewTab.sys.mjs",
  ShortcutUtils: "resource://gre/modules/ShortcutUtils.sys.mjs",
});

const PREF_INSTANCIA = "aegis.tor.instancia";
const PREF_PUENTES = "aegis.tor.puentes";
const PREF_INSTALADO = "aegis.tor.instalado";
/** En la instancia: dónde está tor (la carpeta aegis-tor del perfil normal) y qué versión. */
const PREF_RAIZ = "aegis.tor.raiz";
const PREF_VERSION = "aegis.tor.version";
const PUENTES = ["", "obfs4", "snowflake"];
/** Se notifica cada vez que cambia el estado (Ajustes, el indicador). */
const TEMA = "aegis-tor-estado";
/** Estado para las páginas de un proceso de contenido (about:privatebrowsing). */
const CLAVE_COMPARTIDA = "aegis-tor";
/** El último filtro: lo que digan otros (extensiones, PAC) no cuenta en la instancia con Tor. */
const POSICION_FILTRO = 0xffffffff;
/** Puerto SOCKS de partida en el user.js de la instancia (cerrado) hasta que tor diga el suyo. */
const PUERTO_CERRADO = 1;

const instancia = () => Services.prefs.getBoolPref(PREF_INSTANCIA, false);

let localizacion;
function texto(id, args) {
  localizacion ??= new Localization(["aegis.ftl", "branding/brand.ftl"], true);
  const [m] = localizacion.formatMessagesSync([{ id, args }]);
  return {
    value: m?.value ?? "",
    attributes: Object.fromEntries((m?.attributes ?? []).map(a => [a.name, a.value])),
  };
}

// ── Estado ──────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * descarga.fase: nada | descargando | comprobando | extrayendo | error
 * red.fase (instancia): arrancando | conectando | conectado | error | parado
 * Los errores son ids de Fluent.
 */
const estado = {
  descarga: { fase: "nada", progreso: 0, error: null },
  red: { fase: "parado", progreso: 0, error: null, aviso: null },
};

function publicar() {
  Services.obs.notifyObservers(null, TEMA);
  if (instancia()) {
    const sd = Services.ppmm.sharedData;
    sd.set(CLAVE_COMPARTIDA, { fase: estado.red.fase, progreso: estado.red.progreso, error: estado.red.error });
    sd.flush();
  }
}

function ponerDescarga(fase, progreso = 0, error = null) {
  estado.descarga = { fase, progreso, error };
  publicar();
}

function ponerRed(fase, progreso = 0, error = null, aviso = null) {
  estado.red = { fase, progreso, error, aviso };
  publicar();
}

// ── Aegis normal: descarga ──────────────────────────────────────────────────────────────────────────────────────

let senalDescarga = null;
let descargando = null;

/** Descarga e instala el paquete fijado. Solo la llama una acción del usuario. */
function descargar() {
  if (instancia()) {
    return Promise.resolve(false);
  }
  descargando ??= (async () => {
    senalDescarga = {};
    ponerDescarga("descargando", 0);
    try {
      const version = await descargarPaquete((fase, progreso) => {
        if (fase != estado.descarga.fase || progreso != estado.descarga.progreso) {
          ponerDescarga(fase, progreso);
        }
      }, senalDescarga);
      Services.prefs.setStringPref(PREF_INSTALADO, version);
      ponerDescarga("nada");
      return true;
    } catch (e) {
      if (e?.name == "Cancelada") {
        ponerDescarga("nada");
      } else {
        console.error("Aegis: Tor, descarga", e);
        ponerDescarga("error", 0, /sha256/.test(e?.message) ? "aegis-tor-error-suma" : "aegis-tor-error-descarga");
      }
      return false;
    } finally {
      senalDescarga = null;
      descargando = null;
    }
  })();
  return descargando;
}

// ── Aegis normal: la instancia con Tor ──────────────────────────────────────────────────────────────────────────

const carpetaPerfil = () => PathUtils.join(raiz(), "perfil");
/** El proceso que lanzó la instancia (con -wait-for-browser, vive lo que ella). */
let lanzada = null;

/** ¿Hay una instancia usando ese perfil? Firefox tiene parent.lock abierto en exclusiva mientras lo usa. */
async function perfilEnUso(dir) {
  const candado = PathUtils.join(dir, "parent.lock");
  if (!(await IOUtils.exists(candado))) {
    return false;
  }
  try {
    await IOUtils.remove(candado);
    return false;
  } catch {
    return true;
  }
}

/** Borra el perfil de la instancia si nadie lo usa. */
async function borrarPerfil() {
  const dir = carpetaPerfil();
  if (!(await IOUtils.exists(dir)) || (await perfilEnUso(dir))) {
    return;
  }
  await IOUtils.remove(dir, { recursive: true, ignoreAbsent: true });
}

const literal = v => (typeof v == "string" ? JSON.stringify(v) : String(v));

/**
 * user.js de la instancia: se lee en cada arranque y manda sobre prefs.js, así que el usuario no puede quitar nada
 * de esto desde la propia instancia.
 */
function userJs(version) {
  const puentes = Services.prefs.getStringPref(PREF_PUENTES, "");
  const prefs = [
    ["aegis.tor.instancia", true],
    [PREF_RAIZ, raiz()],
    [PREF_VERSION, version],
    [PREF_PUENTES, PUENTES.includes(puentes) ? puentes : ""],
    // Todas las ventanas privadas: nada de la navegación se guarda en el disco.
    ["browser.privatebrowsing.autostart", true],
    // Proxy manual por si el filtro no se aplicara: SOCKS 5 en 127.0.0.1, DNS en el proxy, sin excepciones.
    ["network.proxy.type", 1],
    ["network.proxy.socks", "127.0.0.1"],
    ["network.proxy.socks_port", PUERTO_CERRADO],
    ["network.proxy.socks_version", 5],
    ["network.proxy.socks_remote_dns", true],
    ["network.proxy.socks5_remote_dns", true],
    ["network.proxy.no_proxies_on", ""],
    ["network.proxy.http", ""],
    ["network.proxy.ssl", ""],
    ["network.proxy.share_proxy_settings", false],
    // Sin peticiones que se salten el proxy (Remote Settings y la telemetría lo intentan si falla, con esto a true).
    ["network.proxy.allow_bypass", false],
    // DNS: nunca fuera de tor. dns.disabled corta cualquier resolución local (solo pasan las direcciones literales, como
    // 127.0.0.1 del SOCKS, del puerto de control y del sumidero), también la API dns de una extensión; sin DoH ni
    // precarga. Lo mismo hace Tor Browser.
    ["network.dns.disabled", true],
    ["network.trr.mode", 5],
    ["network.dns.disablePrefetch", true],
    ["network.prefetch-next", false],
    ["network.http.speculative-parallel-limit", 0],
    // Rutas UNC (file://\\servidor\recurso): abrirían una conexión SMB directa desde Windows, fuera de tor.
    ["network.file.disable_unc_paths", true],
    // UDP: WebRTC, HTTP/3 y WebTransport no pasan por un SOCKS.
    ["media.peerconnection.enabled", false],
    ["network.http.http3.enable", false],
    ["network.webtransport.enabled", false],
    // La ubicación saldría por la red del sistema hacia el servicio de geolocalización.
    ["geo.enabled", false],
    // Huella digital: Caja fuerte (huella.sys.mjs).
    ["aegis.huella.nivel", "caja_fuerte"],
    // Perfil de usar y tirar: sin bienvenidas ni comprobaciones de primer arranque.
    ["browser.aboutwelcome.enabled", false],
    ["browser.shell.checkDefaultBrowser", false],
    ["browser.startup.homepage_override.mstone", "ignore"],
    ["startup.homepage_welcome_url", ""],
    ["startup.homepage_welcome_url.additional", ""],
    ["browser.sessionstore.resume_from_crash", false],
    // Inicio en la página de navegación privada, que enseña el estado de Tor (paginas/privada.sys.mjs).
    ["browser.startup.page", 1],
    ["browser.startup.homepage", "about:privatebrowsing"],
    // Importar de otros navegadores (o del perfil normal de Aegis) mezclaría en local esa identidad con la de Tor:
    // todos los migradores apagados, también los que añada una versión nueva de Firefox.
    ...Services.prefs
      .getChildList("browser.migrate.")
      .filter(n => n.endsWith(".enabled"))
      .map(n => [n, false]),
  ];
  return (
    "// Aegis · perfil de la ventana privada con Tor (tor/tor.sys.mjs). Se crea al abrirla y se borra al cerrarla.\n" +
    prefs.map(([n, v]) => `user_pref(${JSON.stringify(n)}, ${literal(v)});`).join("\n") +
    "\n"
  );
}

/**
 * Abre una ventana privada con Tor (la entrada del menú y Ctrl+Mayús+U).
 *
 * @param {Window} win la ventana desde la que se pide
 */
async function abrirVentana(win) {
  if (instancia()) {
    // Ya estamos en la instancia con Tor: otra ventana suya (todas son privadas).
    win.OpenBrowserWindow({ private: true });
    return;
  }
  const version = Services.prefs.getStringPref(PREF_INSTALADO, "");
  if (!(await instalada(version))) {
    await ofrecerDescarga(win);
    return;
  }
  const dir = carpetaPerfil();
  if (!lanzada && !(await perfilEnUso(dir))) {
    // Perfil nuevo cada vez: lo que quedara de una sesión anterior se borra.
    await IOUtils.remove(dir, { recursive: true, ignoreAbsent: true });
    await IOUtils.makeDirectory(dir, { createAncestors: true });
    await IOUtils.writeUTF8(PathUtils.join(dir, "user.js"), userJs(version));
  }
  const exe = Services.dirsvc.get("XREExeF", Ci.nsIFile);
  const proceso = Cc["@mozilla.org/process/util;1"].createInstance(Ci.nsIProcess);
  proceso.init(exe);
  const argumentos = ["-profile", dir, "-wait-for-browser"];
  const propietaria = !lanzada;
  if (propietaria) {
    lanzada = proceso;
  }
  proceso.runwAsync(argumentos, argumentos.length, {
    observe() {
      // Solo la primera (la que abrió la instancia) dice cuándo termina; las demás solo le pasan la orden.
      if (propietaria && lanzada === proceso) {
        lanzada = null;
        borrarPerfil().catch(e => console.error("Aegis: Tor, borrar el perfil de la instancia", e));
        publicar();
      }
    },
  });
  publicar();
}

/** Tor no está descargado: se ofrece, y solo se descarga si el usuario acepta. */
async function ofrecerDescarga(win) {
  const d = await datosFijados().catch(() => null);
  const mb = d ? (d.tamano / (1024 * 1024)).toLocaleString(undefined, { maximumFractionDigits: 1 }) : "?";
  const titulo = texto("aegis-tor-ofrecer-titulo").value;
  const cuerpo = texto("aegis-tor-ofrecer-texto", { tamano: mb }).value;
  const botones = texto("aegis-tor-ofrecer-botones").attributes;
  const p = Services.prompt;
  const respuesta = p.confirmEx(
    win,
    titulo,
    cuerpo,
    p.BUTTON_POS_0 * p.BUTTON_TITLE_IS_STRING + p.BUTTON_POS_1 * p.BUTTON_TITLE_CANCEL + p.BUTTON_POS_1_DEFAULT,
    botones.descargar || "Download Tor",
    null,
    null,
    null,
    {}
  );
  if (respuesta != 0) {
    return;
  }
  // El progreso se ve en Ajustes; al terminar, se abre la ventana que se había pedido.
  win.openPreferences("privacy-aegis-tor");
  if (await descargar()) {
    abrirVentana(win);
  }
}

// ── Instancia con Tor: tor y el filtro de canales ───────────────────────────────────────────────────────────────

let proceso = null;
let control = null;
let socks = null;
let arrancando = null;
const aislamiento = new Aislamiento();
/** Canales que esperan a que tor diga su puerto SOCKS. */
let pendientes = [];

let servidorSumidero = null;
/**
 * El sumidero: un socket propio en 127.0.0.1 (puerto elegido por el sistema) que acepta y cierra cada conexión. Se
 * usa como proxy cuando tor no está: la petición falla en el acto y nunca sale directa. Al ser nuestro, no puede
 * haber otro programa escuchando en ese puerto.
 */
function sumidero() {
  const pps = Cc["@mozilla.org/network/protocol-proxy-service;1"].getService(Ci.nsIProtocolProxyService);
  try {
    if (!servidorSumidero) {
      const s = Cc["@mozilla.org/network/server-socket;1"].createInstance(Ci.nsIServerSocket);
      s.init(-1, true, -1);
      s.asyncListen({
        onSocketAccepted(servidor, transporte) {
          transporte.close(Cr.NS_ERROR_ABORT);
        },
        onStopListening() {},
      });
      servidorSumidero = s;
    }
    return pps.newProxyInfo(
      "socks",
      "127.0.0.1",
      servidorSumidero.port,
      "",
      "",
      Ci.nsIProxyInfo.TRANSPARENT_PROXY_RESOLVES_HOST,
      0,
      null
    );
  } catch (e) {
    console.error("Aegis: Tor, sumidero", e);
    // Último recurso: un puerto cerrado. Sigue sin ser una conexión directa, y con DNS en el «proxy»: sin la bandera,
    // Necko resolvería el destino con el DNS del sistema (GetProxyDNSStrategyHelper, nsHttp.cpp).
    return pps.newProxyInfo(
      "socks",
      "127.0.0.1",
      PUERTO_CERRADO,
      "",
      "",
      Ci.nsIProxyInfo.TRANSPARENT_PROXY_RESOLVES_HOST,
      0,
      null
    );
  }
}

function cerrarSumidero() {
  try {
    servidorSumidero?.close();
  } catch {}
  servidorSumidero = null;
}

/** El proxy de tor para un canal: usuario y contraseña de su sitio, DNS en tor. */
function proxyDeTor(canal) {
  const pps = Cc["@mozilla.org/network/protocol-proxy-service;1"].getService(Ci.nsIProtocolProxyService);
  const { usuario, clave } = aislamiento.credenciales(canal);
  return pps.newProxyInfoWithAuth(
    "socks",
    "127.0.0.1",
    socks,
    usuario,
    clave,
    "",
    "",
    Ci.nsIProxyInfo.TRANSPARENT_PROXY_RESOLVES_HOST,
    // Sin tiempo de «proxy caído»: si tor no responde, la petición falla; nunca se prueba sin proxy.
    0,
    null
  );
}

function responder(canal, callback) {
  let proxy;
  try {
    proxy = socks ? proxyDeTor(canal) : sumidero();
  } catch (e) {
    console.error("Aegis: Tor, proxy de un canal", e);
    proxy = sumidero();
  }
  callback.onProxyFilterResult(proxy);
}

function vaciarPendientes() {
  const lista = pendientes;
  pendientes = [];
  for (const { canal, callback } of lista) {
    try {
      responder(canal, callback);
    } catch (e) {
      console.error("Aegis: Tor, respuesta pendiente", e);
    }
  }
}

/**
 * Filtro de canales de la instancia: TODO canal va a tor. Nunca lanza (si lanzara, Necko se saltaría el filtro y usaría
 * el proxy anterior: en la instancia, el manual del user.js, que tampoco es directo).
 */
const filtro = {
  QueryInterface: ChromeUtils.generateQI(["nsIProtocolProxyChannelFilter"]),
  applyFilter(canal, proxyAnterior, callback) {
    try {
      if (socks) {
        responder(canal, callback);
        return;
      }
      if (estado.red.fase == "error" || estado.red.fase == "parado") {
        callback.onProxyFilterResult(sumidero());
        return;
      }
      // tor arranca: la petición espera a su puerto.
      pendientes.push({ canal, callback });
    } catch (e) {
      console.error("Aegis: Tor, filtro", e);
      try {
        callback.onProxyFilterResult(sumidero());
      } catch {}
    }
  },
};

/** Líneas del torrc para los puentes elegidos, sacadas de pt_config.json del paquete (ya comprobado). */
async function lineasDePuentes(raizTor, version) {
  const tipo = Services.prefs.getStringPref(PREF_PUENTES, "");
  if (!tipo || !PUENTES.includes(tipo)) {
    return [];
  }
  const cfg = JSON.parse(
    await IOUtils.readUTF8(PathUtils.join(raizTor, version, "tor", "pluggable_transports", "pt_config.json"))
  );
  const plugin = tipo == "snowflake" ? cfg?.pluggableTransports?.snowflake : cfg?.pluggableTransports?.lyrebird;
  const puentes = cfg?.bridges?.[tipo];
  const limpia = s => typeof s == "string" && !/[\r\n"]/.test(s);
  if (!limpia(plugin) || !plugin.startsWith("ClientTransportPlugin ") || !plugin.includes("${pt_path}lyrebird.exe")) {
    throw new Error("pt_config.json: transporte no reconocido");
  }
  if (!Array.isArray(puentes) || !puentes.length || !puentes.every(b => limpia(b) && b.startsWith(`${tipo} `))) {
    throw new Error("pt_config.json: puentes no reconocidos");
  }
  // Ruta relativa al directorio de trabajo de tor (aegis-tor/), como hace Tor Browser con la suya.
  const ruta = `${version}\\tor\\pluggable_transports\\`;
  return ["UseBridges 1", plugin.replace("${pt_path}", ruta), ...puentes.map(b => `Bridge ${b}`)];
}

function alArrancar(fase) {
  const progreso = Math.max(0, Math.min(100, fase?.PROGRESS ?? 0));
  const aviso = fase?.TYPE == "WARN" ? "aegis-tor-aviso-red" : null;
  ponerRed(progreso >= 100 ? "conectado" : "conectando", progreso, null, aviso);
}

/** Arranca tor en la instancia. Las peticiones que llegan mientras tanto esperan. */
function arrancar() {
  arrancando ??= (async () => {
    ponerRed("arrancando", 0);
    const raizTor = Services.prefs.getStringPref(PREF_RAIZ, "");
    const version = Services.prefs.getStringPref(PREF_VERSION, "");
    try {
      if (!raizTor || !(await IOUtils.exists(PathUtils.join(raizTor, version, "tor", "tor.exe")))) {
        throw Object.assign(new Error("tor no está descargado"), { id: "aegis-tor-error-sin-descargar" });
      }
      const puentes = await lineasDePuentes(raizTor, version);
      proceso = new ProcesoTor({ raiz: raizTor, version, puentes });
      proceso.alSalir = () => {
        socks = null;
        control = null;
        proceso = null;
        ponerRed("error", 0, "aegis-tor-error-caido");
      };
      const r = await proceso.arrancar(alArrancar);
      control = r.control;
      control.oyente.alCerrar = () => {
        if (control === r.control) {
          control = null;
        }
      };
      socks = r.socks;
      // Defensa en profundidad: el proxy manual del user.js apunta ya al tor de verdad.
      Services.prefs.setIntPref("network.proxy.socks_port", socks);
      alArrancar(r.arranque);
      cerrarSumidero();
    } catch (e) {
      console.error(`Aegis: Tor no ha arrancado: ${e}
${e?.stack ?? ""}
${proceso?.salidaReciente ?? ""}`);
      socks = null;
      await proceso?.parar().catch(() => {});
      proceso = null;
      ponerRed("error", 0, e?.id ?? "aegis-tor-error-arranque");
    } finally {
      arrancando = null;
      vaciarPendientes();
    }
  })();
  return arrancando;
}

/** Para tor (al salir de la instancia). */
async function parar() {
  socks = null;
  const p = proceso;
  proceso = null;
  control = null;
  await p?.parar().catch(() => {});
  ponerRed("parado");
  vaciarPendientes();
  cerrarSumidero();
}

/**
 * Nueva identidad (como la de Tor Browser): una ventana nueva, se cierran las demás, se borra todo lo de la sesión de
 * la instancia, se cortan las conexiones abiertas y tor da circuitos nuevos a todo, con credenciales SOCKS nuevas.
 */
async function nuevaIdentidad(win) {
  const p = Services.prompt;
  const t = texto("aegis-tor-identidad-confirmar");
  const respuesta = p.confirmEx(
    win,
    t.attributes.title || "",
    t.value,
    p.BUTTON_POS_0 * p.BUTTON_TITLE_IS_STRING + p.BUTTON_POS_1 * p.BUTTON_TITLE_CANCEL + p.BUTTON_POS_1_DEFAULT,
    t.attributes.aceptar || "New identity",
    null,
    null,
    null,
    {}
  );
  if (respuesta != 0) {
    return;
  }
  const viejas = [...Services.wm.getEnumerator("navigator:browser")];
  const nueva = win.OpenBrowserWindow({ private: true });
  for (const w of viejas) {
    if (w !== nueva) {
      w.close();
    }
  }
  aislamiento.olvidar();
  await new Promise(resolve => Services.clearData.deleteData(Ci.nsIClearDataService.CLEAR_ALL, resolve));
  Services.obs.notifyObservers(null, "net:prune-all-connections");
  try {
    await control?.newnym();
  } catch (e) {
    console.error("Aegis: Tor, NEWNYM", e);
  }
}

// ── Ventanas: menú, atajo e indicador ───────────────────────────────────────────────────────────────────────────

const XUL = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
const ventanas = new WeakSet();

function textoDelIndicador() {
  const { fase, progreso } = estado.red;
  return texto(`aegis-tor-red-${fase}`, { progreso }).value;
}

/**
 * Entrada «Nueva ventana privada con Tor» (y, en la instancia, «Nueva identidad de Tor») debajo de «Nueva ventana
 * privada» del menú ☰, con Ctrl+Mayús+U. La vista del menú vive en una plantilla que se copia al
 * documento la primera vez que se abre (PanelMultiView.getViewNode da el nodo de la plantilla o el ya copiado): las
 * entradas se ponen ahí al abrir la ventana, sin crear el menú antes de tiempo, y funcionan con elementos <command>
 * (una copia de la plantilla no conservaría los oyentes).
 */
function menuYAtajo(win) {
  const doc = win.document;
  const comandos = doc.getElementById("mainCommandSet") ?? doc.documentElement;
  const comando = (id, accion) => {
    const c = doc.createXULElement("command");
    c.id = id;
    c.addEventListener("command", () => accion().catch(ex => console.error("Aegis: Tor", ex)));
    comandos.append(c);
  };
  comando("aegis-cmd-tor", () => abrirVentana(win));
  if (instancia()) {
    comando("aegis-cmd-tor-identidad", () => nuevaIdentidad(win));
  }

  // Ctrl+Mayús+U (Cmd+Mayús+U en macOS), en un keyset propio para que la ventana lo registre al insertarlo. Antes era
  // Mayús+Alt+N (el de Brave), pero en Windows Alt+Mayús es el modificador de las teclas de acceso de las webs
  // (ui.key.contentAccess = 5) y una web con accesskey="n" se lo quitaba. En Firefox 158 Ctrl+Mayús+U está libre (Ctrl+U
  // es ver el código fuente; Ctrl+Alt+U, la barra de pestañas abiertas).
  // SecretOS (Linux): IBus usa Ctrl+Mayús+U para escribir caracteres Unicode y se queda la tecla antes que Aegis;
  // al llegar a Linux, elegir otro atajo allí (AppConstants.platform == "linux").
  const teclas = doc.createXULElement("keyset");
  teclas.id = "aegis-keyset-tor";
  const tecla = doc.createXULElement("key");
  tecla.id = "aegis-key-tor";
  tecla.setAttribute("key", "U");
  tecla.setAttribute("modifiers", "accel,shift");
  tecla.setAttribute("command", "aegis-cmd-tor");
  teclas.append(tecla);
  (doc.getElementById("mainKeyset")?.parentNode ?? doc.documentElement).append(teclas);

  const ancla = win.PanelMultiView?.getViewNode(doc, "appMenu-new-private-window-button2");
  if (!ancla || ancla.parentNode?.querySelector("#appMenu-aegis-tor-button")) {
    return;
  }
  const boton = doc.createXULElement("toolbarbutton");
  boton.id = "appMenu-aegis-tor-button";
  // Sin icono, como el resto del menú: con uno, su texto quedaría 16 px más adentro que el de las demás filas.
  boton.className = "subviewbutton";
  boton.setAttribute("label", texto("aegis-tor-menu-ventana").attributes.label ?? "");
  boton.setAttribute("command", "aegis-cmd-tor");
  boton.setAttribute("key", "aegis-key-tor");
  boton.setAttribute("shortcut", lazy.ShortcutUtils.prettifyShortcut(tecla));
  const entradas = [boton];
  if (instancia()) {
    const identidad = doc.createXULElement("toolbarbutton");
    identidad.id = "appMenu-aegis-tor-identidad";
    identidad.className = "subviewbutton";
    identidad.setAttribute("label", texto("aegis-tor-menu-identidad").attributes.label ?? "");
    identidad.setAttribute("command", "aegis-cmd-tor-identidad");
    entradas.push(identidad);
  }
  ancla.after(...entradas);
}

/** Indicador «Tor» junto al de navegación privada (instancia): estado y, al pulsarlo, un menú. */
function indicador(win) {
  const doc = win.document;
  const menu = doc.createXULElement("menupopup");
  menu.id = "aegis-tor-menu";
  const linea = doc.createXULElement("menuitem");
  linea.setAttribute("disabled", "true");
  const identidad = doc.createXULElement("menuitem");
  identidad.setAttribute("label", texto("aegis-tor-menu-identidad").attributes.label ?? "");
  identidad.addEventListener("command", () => nuevaIdentidad(win).catch(ex => console.error("Aegis: Tor", ex)));
  const ajustes = doc.createXULElement("menuitem");
  ajustes.setAttribute("label", texto("aegis-tor-menu-ajustes").attributes.label ?? "");
  ajustes.addEventListener("command", () => win.openPreferences("privacy-aegis-tor"));
  menu.append(linea, doc.createXULElement("menuseparator"), identidad, ajustes);
  doc.getElementById("mainPopupSet")?.append(menu);

  const botones = [];
  // Uno solo, en la barra de herramientas, delante del menú ☰ (siempre visible, con pestañas horizontales o verticales).
  for (const ancla of [doc.getElementById("PanelUI-button")].filter(Boolean)) {
    const b = doc.createXULElement("hbox");
    b.className = "aegis-tor-indicador";
    b.setAttribute("role", "button");
    b.setAttribute("tabindex", "0");
    b.setAttribute("aria-haspopup", "menu");
    const glifo = doc.createXULElement("image");
    glifo.className = "aegis-tor-indicador-glifo";
    const etiqueta = doc.createXULElement("label");
    etiqueta.className = "aegis-tor-indicador-texto";
    b.append(glifo, etiqueta);
    const abrir = e => {
      if ((e.type == "click" && e.button != 0) || (e.type == "keypress" && ![" ", "Enter"].includes(e.key))) {
        return;
      }
      e.preventDefault();
      menu.openPopup(b, "after_start", 0, 4);
    };
    b.addEventListener("click", abrir);
    b.addEventListener("keypress", abrir);
    menu.addEventListener("popupshowing", () => b.setAttribute("open", "true"));
    menu.addEventListener("popuphidden", () => b.removeAttribute("open"));
    ancla.before(b);
    botones.push({ b, etiqueta });
  }
  const pintar = () => {
    const t = textoDelIndicador();
    linea.setAttribute("label", t);
    for (const { b, etiqueta } of botones) {
      b.setAttribute("aegis-tor-fase", estado.red.fase);
      etiqueta.setAttribute("value", estado.red.fase == "conectando" ? `${estado.red.progreso} %` : "Tor");
      b.setAttribute("tooltiptext", t);
      b.setAttribute("aria-label", t);
    }
  };
  pintar();
  Services.obs.addObserver(pintar, TEMA);
  win.addEventListener("unload", () => Services.obs.removeObserver(pintar, TEMA), { once: true });
}

// ── Entrada ─────────────────────────────────────────────────────────────────────────────────────────────────────

const observador = {
  observe(sujeto, tema) {
    if (tema == "quit-application-granted") {
      Services.obs.removeObserver(observador, "quit-application-granted");
      if (instancia()) {
        parar();
      }
    }
  },
};

export const AegisTor = {
  TEMA,
  PUENTES,
  PREF_PUENTES,

  /** Una vez por arranque (AegisArranque.inicio). En el Aegis normal no hace nada que gaste. */
  inicio() {
    if (!instancia()) {
      // Perfil de una instancia anterior que se cerró con este Aegis cerrado: solo si se ha usado Tor alguna vez.
      if (Services.prefs.getStringPref(PREF_INSTALADO, "")) {
        borrarPerfil().catch(e => console.error("Aegis: Tor, borrar el perfil de la instancia", e));
      }
      return;
    }
    Services.obs.addObserver(observador, "quit-application-granted");
    const pps = Cc["@mozilla.org/network/protocol-proxy-service;1"].getService(Ci.nsIProtocolProxyService);
    pps.registerChannelFilter(filtro, POSICION_FILTRO);
    // Con todas las ventanas privadas, una pestaña nueva sería la nueva pestaña normal: aquí, la de navegación
    // privada, con el estado de Tor.
    try {
      lazy.AboutNewTab.newTabURL = "about:privatebrowsing";
    } catch (e) {
      console.error("Aegis: Tor, nueva pestaña", e);
    }
    // Antes de que nada pida red: el filtro deja esperando lo que llegue.
    ponerRed("arrancando", 0);
    arrancar();
  },

  /**
   * Cada ventana del navegador (AegisArranque.ventana).
   *
   * @param {Window} win
   */
  ventana(win) {
    if (!win?.document || ventanas.has(win)) {
      return;
    }
    ventanas.add(win);
    try {
      win.windowUtils.loadSheetUsingURIString(
        new URL("../estilos/tor.css", import.meta.url).href,
        win.windowUtils.AUTHOR_SHEET
      );
    } catch (e) {
      console.error("Aegis: no se pudo cargar tor.css", e);
    }
    menuYAtajo(win);
    if (instancia()) {
      win.document.documentElement.setAttribute("aegis-tor", "");
      indicador(win);
    }
  },

  /** ¿Es esta la instancia con Tor? */
  get esInstancia() {
    return instancia();
  },

  /** Estado para Ajustes. */
  async estado() {
    const fijado = await datosFijados().catch(() => null);
    const version = instancia()
      ? Services.prefs.getStringPref(PREF_VERSION, "")
      : Services.prefs.getStringPref(PREF_INSTALADO, "");
    const lista = !instancia() && (await instalada(version));
    return {
      instancia: instancia(),
      instalada: lista ? version : null,
      fijada: fijado?.version ?? null,
      tor: fijado?.tor ?? null,
      tamano: fijado?.tamano ?? 0,
      origen: fijado?.urls?.[0] ? new URL(fijado.urls[0]).host : "",
      desactualizada: !!(lista && fijado && fijado.version != version),
      abierta: !!lanzada,
      descarga: { ...estado.descarga },
      red: { ...estado.red },
      puentes: Services.prefs.getStringPref(PREF_PUENTES, ""),
    };
  },

  descargar,

  cancelarDescarga() {
    senalDescarga?.cancelar?.();
  },

  /** Borra tor del perfil (no se puede con una ventana con Tor abierta). */
  async borrar() {
    if (instancia() || lanzada || (await perfilEnUso(carpetaPerfil()))) {
      return false;
    }
    await borrarArchivos();
    Services.prefs.clearUserPref(PREF_INSTALADO);
    ponerDescarga("nada");
    return true;
  },

  ponerPuentes(tipo) {
    if (PUENTES.includes(tipo)) {
      Services.prefs.setStringPref(PREF_PUENTES, tipo);
      publicar();
    }
  },

  abrirVentana,
  nuevaIdentidad,
  carpetaDe,
};
