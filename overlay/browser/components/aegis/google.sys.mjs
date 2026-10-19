/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · Google limpio (docs/PLAN.md, «Buscar en Google sin ser rastreado»; docs/CONEXIONES.md, «Google»).
 *
 * Filtro de red ligero, en el proceso padre, para los servicios de Google. Existe porque la protección contra rastreo
 * de Firefox no actúa dentro de Google: la lista de entidades de Disconnect trata google.com, youtube.com,
 * doubleclick.net, google-analytics.com… como una misma empresa, así que en las páginas de Google sus propios
 * rastreadores cuentan como «del mismo sitio» y se cargan. Este módulo:
 *
 * 1. cancela la telemetría y los anuncios de Google (lista REGLAS, más abajo, con su fuente) y deja pasar lo
 *    necesario: inicio de sesión, reCAPTCHA, Gmail, Drive, Maps, la reproducción de YouTube y los archivos estáticos;
 * 2. en las búsquedas de Google, quita los parámetros de rastreo de la URL (ved, ei, oq…) y, si se quiere, pide
 *    «solo resultados web» (udm=14), con una redirección interna (no hay petición de más);
 * 3. convierte los enlaces de Google que pasan por su redirección (/url?q=… de la búsqueda y Gmail, /redirect?q=…
 *    de YouTube) en enlaces directos al destino, solo si es una URL http(s) válida y el clic sale de Google.
 *
 * No hace ninguna conexión: solo corta o reescribe peticiones que ya hace la página. Con Escudos en marcha, lo que
 * corta recibe la respuesta neutra de su tipo en vez de un error de red (escudos/red.sys.mjs, «Bloqueo silencioso»). Coste: un observador de
 * http-on-modify-request; por cada petición, el host se busca en un Map por sufijos (unas pocas búsquedas) y solo
 * si es de Google se mira la ruta. Sin temporizadores ni trabajo en reposo. Con aegis.google.limpio en false, el
 * observador se quita (coste cero).
 *
 * Futuro (fase 4): cuando exista el motor de Escudos, las REGLAS de bloqueo pasan a una lista de Escudos (formato uBO,
 * «Aegis: Google») y aquí queda solo lo que no es un filtro de red: udm=14, la limpieza de la búsqueda y los enlaces
 * directos (o también se mueve a scriptlets de Escudos). Hasta entonces, este módulo es la única pieza.
 */

import { AegisEscudos } from "./escudos.sys.mjs";

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  AegisEscudosRed: new URL("escudos/red.sys.mjs", import.meta.url).href,
});

const PREF_LIMPIO = "aegis.google.limpio";
const PREF_SOLO_WEB = "aegis.google.solo_web";

const { TYPE_DOCUMENT, TYPE_SCRIPT, TYPE_PING, TYPE_BEACON } = Ci.nsIContentPolicy;

/**
 * Dominios (y todos sus subdominios) que solo sirven anuncios, medición de anuncios o analítica: se cancela todo lo
 * que no sea una página abierta por el usuario. Fuente: EasyList y EasyPrivacy (reglas «||dominio^»), las mismas
 * que trae uBlock Origin de serie, y la lista de Disconnect (categorías Advertising y Analytics) de la protección
 * contra rastreo.
 */
const SOLO_PUBLICIDAD = [
  "doubleclick.net", // DoubleClick / Google Ad Manager: anuncios y su medición (incluye googleads.g., stats.g.)
  "googlesyndication.com", // AdSense: pagead2, tpc, ade…
  "googleadservices.com", // conversiones de Google Ads (la página de un clic en un anuncio sí se abre)
  "googletagservices.com", // etiquetas de Google Publisher Tag
  "google-analytics.com", // Google Analytics (también region1., ssl., www.)
  "googletagmanager.com", // Google Tag Manager y gtag.js
  "imasdk.googleapis.com", // SDK de anuncios de vídeo (IMA)
  "csi.gstatic.com", // medición de tiempos de carga (Client Side Instrumentation)
  "firebaselogging-pa.googleapis.com", // registro de uso de Firebase
];

/**
 * Scripts de esos dominios que SmartBlock (protección contra rastreo) sustituye por uno inocuo en las webs de
 * terceros: browser/extensions/webcompat/data/shims.js de Firefox 157 (Google Analytics, Tag Manager, Publisher Tag,
 * AdSense, IMA y conversiones de Google Ads). Revisar al cambiar de versión.
 */
const CON_SUSTITUTO = [
  "/analytics.js",
  "/ga.js",
  "/gtm.js",
  "/gtm/js",
  "/ec.js",
  "/gpt.js",
  "/adsbygoogle.js",
  "/ima3.js",
  "/conversion_async.js",
];
function conSustituto(ruta) {
  return ruta.startsWith("/gpt/pubads_impl_") || CON_SUSTITUTO.some(f => ruta.endsWith(f));
}

/** Familias de dominios de Google con reglas por ruta. Clave: dominio base (se miran también sus subdominios). */
const FAMILIA = new Map([
  ...SOLO_PUBLICIDAD.map(d => [d, "publicidad"]),
  ["youtube.com", "youtube"],
  ["youtube-nocookie.com", "youtube"],
]);
/** google.com, google.es, google.co.uk, google.com.br… (se comprueba solo si el host contiene «google.»). */
const GOOGLE_TLD = /(?:^|\.)google\.(?:com?\.)?[a-z]{2,3}$/;

/**
 * Hosts de Google que nunca se tocan: inicio de sesión (también «Iniciar sesión con Google» en otras webs, que carga
 * accounts.google.com/gsi/…), la cuenta, la barra de cuentas de Google y la sincronización de la sesión entre
 * dominios. Aunque hoy ninguna regla les afecta, quedan fuera de forma explícita.
 */
const EXENTOS = new Set([
  "accounts.google.com",
  "accounts.youtube.com",
  "myaccount.google.com",
  "id.google.com",
  "ogs.google.com",
]);

/**
 * Reglas por ruta en los dominios de Google (google.<tld>) y de YouTube. Solo telemetría y anuncios: nada de lo que
 * aquí se corta hace falta para que el servicio funcione. Fuente: EasyPrivacy (filtros de Google y YouTube) y
 * «uBlock filters – Privacy», comprobadas en Aegis (docs/CONEXIONES.md, «Google»).
 * - exactas: la ruta entera (sin la consulta);
 * - prefijos: la ruta empieza así;
 * - finales: la ruta termina así (cualquier servicio: /maps/gen_204, /gen_204…).
 */
const REGLAS = {
  google: {
    exactas: new Set([
      "/log", // registro de uso de las apps web de Google (play.google.com/log?format=json…)
      "/csi", // tiempos de carga
    ]),
    prefijos: [
      "/pagead/", // conversiones y listas de remarketing de Google Ads (www.google.com/pagead/1p-user-list/…)
      "/ads/ga-audiences", // remarketing de Analytics
      "/ads/measurement", // medición de anuncios
      "/rmkt/", // remarketing
      "/ccm/collect", // medición del modo de consentimiento de las etiquetas de Google
      "/afs/ads", // anuncios de búsqueda en otras webs (AdSense for Search)
      "/g/collect", // Analytics 4 servido desde analytics.google.com
      "/g/s/collect",
    ],
    finales: [
      "/gen_204", // pings de clics, impresiones y errores (búsqueda, Maps, Noticias…)
      "/client_204", // ping de la portada
      "/logImpressions", // impresiones de Docs y Drive
      "/jserror", // informes de errores de JavaScript de Docs y Drive
    ],
  },
  youtube: {
    exactas: new Set([
      "/api/stats/ads", // estadísticas de anuncios
      "/api/stats/atr", // atribución de anuncios
      "/api/stats/qoe", // calidad de la reproducción (telemetría; la reproducción no depende de ella)
      "/ptracking", // seguimiento de la reproducción para anuncios
      "/csi_204", // tiempos de carga
      "/error_204", // informes de errores
      "/youtubei/v1/log_event", // registro de uso de la interfaz
      "/get_midroll_info", // anuncios a mitad de vídeo
    ]),
    prefijos: [
      "/pagead/", // anuncios y su medición (adview, viewthroughconversion…)
      "/pcs/activeview", // visibilidad de los anuncios
    ],
    finales: [],
  },
};
// Se dejan a propósito (hacen falta o tienen función para el usuario):
// - youtube.com/api/stats/playback y /api/stats/watchtime: alimentan el historial de reproducciones y «seguir
//   viendo»; sin ellos, el historial de una cuenta deja de funcionar.
// - */generate_204 (YouTube y googlevideo.com): prepara la conexión con el servidor de vídeo.
// - ogads-pa.clients6.google.com: datos del menú de cuentas y del lanzador de apps de la barra de Google.
// - www.google.com/complete/search: las sugerencias del cuadro de búsqueda de la propia página.
// - www.google.com/recaptcha/, www.gstatic.com, fonts.googleapis.com, maps.googleapis.com, *.googlevideo.com,
//   *.googleusercontent.com, *.ggpht.com, *.ytimg.com: contenido.

/**
 * Parámetros de rastreo de la búsqueda de Google que se quitan de la URL de /search: identificadores del clic
 * (ved, ei, sa, usg), de la sesión y del experimento (sca_esv, sca_upv, sxsrf, iflsig, cshid), de cómo se escribió
 * la búsqueda (oq, gs_lcrp, gs_lp, gs_ssp, aqs, uact, sclient) y del navegador (bih, biw, dpr, rlz, source,
 * sourceid, fbs, ictx). Fuente: reglas de Google de ClearURLs y de AdGuard URL Tracking Protection. Se quedan los
 * que cambian el resultado (q, start, num, tbm, udm, tbs, hl, gl, lr, safe, filter, nfpr…).
 *
 * No van en privacy.query_stripping.strip_list porque esa lista se aplica a todas las webs (un «sa» o un «ei» de
 * otra web podría ser necesario) y porque el query stripping nativo no actúa en las navegaciones dentro del mismo
 * sitio (de una página de Google a otra).
 */
const PARAMETROS_BUSQUEDA = new Set([
  "ved", "ei", "sa", "usg", "oq", "gs_lcrp", "gs_lp", "gs_ssp", "aqs", "uact", "sclient", "iflsig", "sca_esv",
  "sca_upv", "sxsrf", "cshid", "bih", "biw", "dpr", "rlz", "source", "sourceid", "fbs", "ictx",
]);

/**
 * Familia de un host: "google", "youtube", "publicidad" o null. Primero el Map por sufijos (a.b.c.com → a.b.c.com,
 * b.c.com, c.com, com); la expresión regular de google.<tld> solo si el host contiene «google.».
 *
 * @param {string} host
 * @returns {string | null}
 */
function familia(host) {
  let sufijo = host;
  let i = 0;
  for (;;) {
    const f = FAMILIA.get(sufijo);
    if (f) {
      return f;
    }
    i = host.indexOf(".", i) + 1;
    if (!i) {
      break;
    }
    sufijo = host.slice(i);
  }
  return host.includes("google.") && GOOGLE_TLD.test(host) ? "google" : null;
}

/** Familia del documento que hace la petición (o de quien la desencadena). */
function familiaDeOrigen(loadInfo) {
  const p = loadInfo.loadingPrincipal ?? loadInfo.triggeringPrincipal;
  try {
    return p?.isContentPrincipal ? familia(p.asciiHost) : null;
  } catch {
    return null;
  }
}

/** ¿La ruta está en las reglas de la familia? */
function rutaBloqueada(reglas, ruta) {
  if (reglas.exactas.has(ruta)) {
    return true;
  }
  for (const p of reglas.prefijos) {
    if (ruta.startsWith(p)) {
      return true;
    }
  }
  for (const f of reglas.finales) {
    if (ruta.endsWith(f)) {
      return true;
    }
  }
  return false;
}

let soloWeb = true;

/** Destino directo de un enlace de redirección de Google (/url, /redirect), o null si no es http(s) válido. */
function destinoDirecto(uri) {
  const consulta = new URLSearchParams(uri.query);
  const destino = consulta.get("url") || consulta.get("q");
  if (!destino || !URL.canParse(destino)) {
    return null;
  }
  const url = new URL(destino);
  return url.protocol == "https:" || url.protocol == "http:" ? url.href : null;
}

/**
 * Quita del destino los parámetros de la lista nativa de query stripping (gclid, srsltid…; ver 59-google.js). También
 * lo usa la búsqueda limpia de los demás buscadores (busqueda-limpia.sys.mjs).
 */
export function sinParametrosNativos(uri, privado) {
  try {
    const salida = {};
    const n = Cc["@mozilla.org/url-query-string-stripper;1"]
      .getService(Ci.nsIURLQueryStringStripper)
      .strip(uri, privado, salida);
    return n ? salida.value : uri;
  } catch {
    return uri;
  }
}

/**
 * Página que se abre (documento principal o marco) en un dominio de Google: enlaces directos y búsqueda limpia.
 * Nunca se cancela una página: lo que el usuario abre, se abre.
 */
function documento(canal, uri, fam) {
  const ruta = uri.filePath;
  const loadInfo = canal.loadInfo;
  // Enlaces directos: /url?q=… (búsqueda, Gmail, Docs) y /redirect?q=… (YouTube), solo si el clic sale de Google y el
  // enlace va firmado (usg en Google, redir_token en YouTube): esos los genera Google para sus propios resultados. Un
  // enlace sin firma (pegado en un comentario o un documento) sigue pasando por el aviso de seguridad de Google.
  if ((fam == "google" && ruta == "/url") || (fam == "youtube" && ruta == "/redirect")) {
    const origen = familiaDeOrigen(loadInfo);
    const firma = new URLSearchParams(uri.query).has(fam == "google" ? "usg" : "redir_token");
    const destino = firma && (origen == "google" || origen == "youtube") && destinoDirecto(uri);
    if (destino) {
      const privado = loadInfo.originAttributes.privateBrowsingId > 0;
      canal.redirectTo(sinParametrosNativos(Services.io.newURI(destino), privado));
    }
    return;
  }
  if (fam != "google" || ruta != "/search" || canal.requestMethod != "GET" || !uri.query) {
    return;
  }
  // Búsqueda: sin parámetros de rastreo y, si se busca desde el navegador (barra de direcciones, buscador, menú
  // contextual: principal de sistema) y sin un tipo de resultado elegido, solo resultados web (udm=14).
  const consulta = new URLSearchParams(uri.query);
  let cambios = false;
  for (const [nombre, valor] of [...consulta]) {
    // client=firefox-b-…: código de socio. Ya no lo pone el buscador (parche 0400-privacidad/0002); esto cubre una
    // build sin el parche o un enlace que lo traiga de fuera.
    if (PARAMETROS_BUSQUEDA.has(nombre) || (nombre == "client" && valor.startsWith("firefox"))) {
      consulta.delete(nombre);
      cambios = true;
    }
  }
  if (
    soloWeb &&
    loadInfo.triggeringPrincipal?.isSystemPrincipal &&
    consulta.has("q") &&
    !consulta.has("udm") &&
    !consulta.has("tbm")
  ) {
    consulta.set("udm", "14");
    cambios = true;
  }
  if (cambios) {
    const limpia = uri.mutate().setQuery(consulta.toString()).finalize();
    canal.redirectTo(limpia);
  }
}

/**
 * ¿Tiene el usuario los Escudos bajados en la página (lista de excepciones de la protección contra rastreo, la misma
 * que usa el panel de Escudos)?
 * - Peticiones de una página (recursos, marcos): el dato que el navegador calcula para la página principal y lleva
 *   cada canal (cookieJarSettings.isOnContentBlockingAllowList).
 * - Navegación de la pestaña: aún no hay página, así que se mira el permiso de la de destino (por origen, como lo
 *   guarda ContentBlockingAllowList; en privado, el tipo «-pb»).
 * También lo usa busqueda-limpia.sys.mjs.
 */
export function escudosBajados(canal, uri, tipo) {
  const loadInfo = canal.loadInfo;
  try {
    if (tipo != TYPE_DOCUMENT) {
      return loadInfo.cookieJarSettings.isOnContentBlockingAllowList;
    }
    const privado = loadInfo.originAttributes.privateBrowsingId > 0;
    const permiso = privado ? "trackingprotection-pb" : "trackingprotection";
    const atributos = privado ? [{}, { privateBrowsingId: 1 }] : [{}];
    return atributos.some(
      oa =>
        Services.perms.testExactPermissionFromPrincipal(
          Services.scriptSecurityManager.createContentPrincipal(uri, oa),
          permiso
        ) == Services.perms.ALLOW_ACTION
    );
  } catch {
    return false;
  }
}

const observador = {
  observe(subject) {
    const canal = subject.QueryInterface(Ci.nsIHttpChannel);
    // Otro observador (Escudos) puede haberla cancelado ya: no se toca (redirectTo sobre un canal cancelado lanza).
    if (canal.canceled) {
      return;
    }
    const uri = canal.URI;
    let host;
    try {
      host = uri.asciiHost;
    } catch {
      return;
    }
    const fam = familia(host);
    if (!fam) {
      return;
    }
    const loadInfo = canal.loadInfo;
    const tipo = loadInfo.externalContentPolicyType;
    // Escudos bajados en la página: no se toca nada, como hace la protección contra rastreo.
    if (escudosBajados(canal, uri, tipo)) {
      return;
    }
    if (tipo == TYPE_DOCUMENT || tipo == Ci.nsIContentPolicy.TYPE_SUBDOCUMENT) {
      // Un marco de Google normal (Maps, un vídeo de YouTube) se trata como página. Un marco de anuncios (dominios de
      // publicidad o rutas de anuncios de Google, como /afs/ads en otra web) se cancela como el resto (abajo).
      const marcoDeAnuncios =
        tipo != TYPE_DOCUMENT && (fam == "publicidad" || rutaBloqueada(REGLAS[fam], uri.filePath));
      if (!marcoDeAnuncios) {
        documento(canal, uri, fam);
        return;
      }
    }
    if (EXENTOS.has(host)) {
      return;
    }
    let cancelar;
    if (fam == "publicidad") {
      // Todo, salvo los scripts que SmartBlock sabe sustituir en webs que no son de Google: esos se le dejan a la
      // protección contra rastreo, que los cambia por un sustituto inocuo para que la web no se rompa (si se
      // cancelaran aquí antes, la web se quedaría sin el sustituto).
      cancelar =
        tipo != TYPE_SCRIPT || familiaDeOrigen(loadInfo) != null || !conSustituto(uri.filePath);
    } else {
      const ruta = uri.filePath;
      // Balizas de clic de la búsqueda hacia /url (con ping o sendBeacon): telemetría, no navegación.
      cancelar =
        (fam == "google" && ruta == "/url" && (tipo == TYPE_PING || tipo == TYPE_BEACON)) ||
        (!ruta.startsWith("/recaptcha/") && rutaBloqueada(REGLAS[fam], ruta));
    }
    if (cancelar) {
      // Respuesta neutra (un 200 vacío, no un error que la web pueda ver) o, si no se puede, cortarla.
      if (!lazy.AegisEscudosRed.neutro(canal)) {
        canal.cancel(Cr.NS_ERROR_ABORT);
      }
      // Que el contador de Escudos de la pestaña lo cuente (sin repetir orígenes que ya contó la protección).
      try {
        AegisEscudos.anotar(canal.loadInfo.browsingContext?.top?.embedderElement, "rastreadores", uri.prePath);
      } catch (e) {
        console.error("Aegis: Google limpio, contador de Escudos", e);
      }
    }
  },
};

let activo = false;
let iniciado = false;

function aplicarPref() {
  const quiere = Services.prefs.getBoolPref(PREF_LIMPIO, true);
  if (quiere && !activo) {
    Services.obs.addObserver(observador, "http-on-modify-request");
  } else if (!quiere && activo) {
    Services.obs.removeObserver(observador, "http-on-modify-request");
  }
  activo = quiere;
}

function leerSoloWeb() {
  soloWeb = Services.prefs.getBoolPref(PREF_SOLO_WEB, true);
}

export const AegisGoogle = {
  /** Una vez por arranque (idempotente). Escucha las dos prefs para encenderse o apagarse sin reiniciar. */
  inicio() {
    if (iniciado) {
      return;
    }
    iniciado = true;
    leerSoloWeb();
    aplicarPref();
    Services.prefs.addObserver(PREF_LIMPIO, aplicarPref);
    Services.prefs.addObserver(PREF_SOLO_WEB, leerSoloWeb);
  },

  /** Para las pruebas: familia de un host y si una ruta se cortaría. */
  _familia: familia,
  _rutaBloqueada: (fam, ruta) => !!REGLAS[fam] && rutaBloqueada(REGLAS[fam], ruta),
};

export const inicio = () => AegisGoogle.inicio();
