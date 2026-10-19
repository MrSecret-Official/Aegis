/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · Búsqueda limpia en DuckDuckGo, Bing, Startpage, Qwant, Ecosia y Wikipedia (docs/PLAN.md, «Buscar sin ser
 * rastreado en los demás buscadores»; docs/CONEXIONES.md, «Otros buscadores»). Lo mismo que google.sys.mjs hace con
 * Google, para el resto de buscadores que se quedan en Aegis:
 *
 * 1. cancela sus pings y balizas de telemetría (REGLAS, cada una con su fuente), con la respuesta neutra de Escudos;
 * 2. quita de sus búsquedas los parámetros de socio y de seguimiento que quedan (el código de socio ya no lo pone el
 *    buscador: parche 0400-privacidad/0002; esto quita lo fijo de la configuración de Firefox, como form=MOZLBR de Bing
 *    o sourceid=Mozilla-search de Wikipedia, y lo que añade la propia web: cvid, perf_id…);
 * 3. convierte en directos los enlaces de resultados que pasan por la redirección del buscador (duckduckgo.com/l/?uddg=
 *    y bing.com/ck/a?…&u=a1…), solo si el clic sale del propio buscador y el destino es una URL válida;
 * 4. en DuckDuckGo, las búsquedas hechas desde el navegador van a noai.duckduckgo.com, su versión sin IA (como la
 *    extensión oficial «DuckDuckGo No-AI Search»); y, solo si el usuario lo enciende en el panel de Escudos, sin sus
 *    anuncios (k1=-1);
 * 5. arregla las sugerencias de Startpage: sin el código de socio (segment=) su dirección de la configuración de
 *    Firefox ya no contesta, así que se piden a la de su propio OpenSearch (/osuggestions).
 *
 * Todo con redirecciones internas (redirectTo antes de enviar: ninguna petición de más) y cancelaciones; ninguna
 * conexión nueva. No toca el inicio de sesión (login.live.com, /fd/auth/, auth.wikimedia.org… no están en ninguna
 * regla), ni los ajustes que el usuario haya puesto en el buscador (un parámetro que ya viene en la URL se respeta), ni
 * una página con los Escudos bajados. Los anuncios y los avisos de las páginas los oculta Escudos con sus listas; aquí
 * solo va lo que las listas no pueden hacer (quitar parámetros, deshacer redirecciones: el motor aún no tiene
 * $removeparam ni urlskip) y la telemetría, para que se corte también con Escudos en Normal.
 *
 * Coste: un observador de http-on-modify-request; por cada petición, el host se busca en un Map por sufijos (unas
 * pocas búsquedas) y solo si es de un buscador se mira la ruta. Sin temporizadores ni trabajo en reposo. Con
 * aegis.buscadores.limpio en false, el observador se quita.
 */

import { AegisEscudos } from "./escudos.sys.mjs";
import { escudosBajados, sinParametrosNativos } from "./google.sys.mjs";

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  AegisEscudosRed: new URL("escudos/red.sys.mjs", import.meta.url).href,
});

const PREF_LIMPIO = "aegis.buscadores.limpio";
const PREF_SIN_IA = "aegis.buscadores.sin_ia";
const PREF_SIN_ANUNCIOS = "aegis.buscadores.sin_anuncios";
const PREF_REWARDS = "aegis.buscadores.bing_rewards";

/** La versión sin IA de DuckDuckGo. */
const NOAI = "noai.duckduckgo.com";
/** La actividad de Microsoft Rewards en Bing (ver REGLAS), en minúsculas como el resto de rutas de Bing. */
const RUTA_REWARDS = "/rewardsapp/reportactivity";

const { TYPE_DOCUMENT, TYPE_SUBDOCUMENT, TYPE_PING, TYPE_BEACON, TYPE_XMLHTTPREQUEST } = Ci.nsIContentPolicy;

/** Buscador de cada dominio (y de sus subdominios). */
const FAMILIA = new Map([
  ["duckduckgo.com", "duckduckgo"],
  ["bing.com", "bing"],
  ["startpage.com", "startpage"],
  ["qwant.com", "qwant"],
  ["ecosia.org", "ecosia"],
  ["wikipedia.org", "wikipedia"],
  ["wikimedia.org", "wikipedia"],
]);

/**
 * Telemetría que se cancela (nunca una página: solo lo que la página pide por su cuenta). Solo lo que confirman las
 * listas de referencia y que no hace falta para buscar, ver resultados, cambiar de región o iniciar sesión.
 * - hosts: el host entero;
 * - exactas, prefijos, finales: la ruta (en Bing, en minúsculas: sus rutas cambian de mayúsculas);
 * - balizas: prefijos de ruta que se cancelan solo si llegan como ping o sendBeacon;
 * - consulta: [ruta, parámetro, valor] que se cancelan solo con ese valor.
 */
const REGLAS = {
  duckduckgo: {
    // Píxeles de uso y los informes de errores de JavaScript (en d.js de duckduckgo.com:
    // «//improving.duckduckgo.com/t/»).
    // EasyPrivacy «||duckduckgo.com/t/»; AdGuard Tracking Protection «||improving.duckduckgo.com^».
    hosts: new Set(["improving.duckduckgo.com"]),
    exactas: new Set([
      "/atb.js", // cohorte de instalación (AdGuard Tracking Protection «||duckduckgo.com/atb.js»)
    ]),
    prefijos: [
      "/t/", // píxeles servidos desde duckduckgo.com (EasyPrivacy «||duckduckgo.com/t/»)
      "/exti/", // instalación de la extensión (AdGuard Tracking Protection «||duckduckgo.com/exti/»)
    ],
    finales: [],
    balizas: [],
    // Informes de errores de la página (d.js: fetch("/collect.js?type=fe-error&…")). «type=feedback» es el formulario
    // de opinión que envía el usuario: pasa.
    consulta: [["/collect.js", "type", "fe-error"]],
  },
  bing: {
    hosts: new Set(),
    exactas: new Set([
      "/fd/ls/l", // registro de la página de resultados (EasyPrivacy «||bing.com/fd/ls/l?IG=»)
      "/fd/ls/lsp.aspx", // registro de clics y de rendimiento (EasyPrivacy «||bing.com/fd/ls/lsp.aspx»)
      // Actividad para Microsoft Rewards (EasyPrivacy «||bing.com/rewardsapp/reportActivity?»): sin ella, las búsquedas
      // no suman puntos. Pasa si el usuario lo enciende en el panel de Escudos (aegis.buscadores.bing_rewards).
      "/rewardsapp/reportactivity",
      "/mouselog", // movimiento del ratón (EasyPrivacy «||bing.com/mouselog»)
      // Envía la latitud, la longitud y la localidad que Bing deduce de la IP
      // (EasyPrivacy «||bing.com/geolocation/write?»).
      "/geolocation/write",
      // uBlock filters – Unbreak anula estas dos reglas de EasyPrivacy
      // («||bing.com/rewardsapp/reportactivity?$badfilter» y «||bing.com/geolocation/write?$badfilter», uAssets #17650:
      // con un error de red se rompía Bing Chat). Aegis las
      // mantiene porque no las corta con un error: contesta con la respuesta neutra de Escudos (un 200 vacío).
    ]),
    prefijos: [],
    finales: [
      "/glinkping.aspx", // clics en enlaces (EasyPrivacy «||bing.com/fd/ls/GLinkPing.aspx?» y «^*/glinkping.aspx»)
      "/glinkpingpost.aspx", // ídem por POST (EasyPrivacy «||bing.com^*/GLinkPingPost.aspx»)
    ],
    balizas: [],
    consulta: [],
  },
  startpage: {
    // Medición propia (EasyPrivacy y AdGuard Tracking Protection «||vf.startpage.com^»).
    hosts: new Set(["vf.startpage.com"]),
    exactas: new Set([
      "/sp/cl", // clics (AdGuard Tracking Protection «||startpage.com/sp/cl|»)
    ]),
    prefijos: [
      "/sp/dplpxs", // píxel (EasyPrivacy «||startpage.com/sp/dplpxs?»)
      "/sp/jst", // EasyPrivacy y AdGuard Tracking Protection «||startpage.com/sp/jst»
      "/sp/elp", // AdGuard Tracking Protection «||startpage.com/sp/elp»
      "/sp/atq/ep2/sodar/", // verificación de anuncios de Google, Sodar (EasyPrivacy)
    ],
    finales: [],
    balizas: ["/sp/"], // pings y balizas (EasyPrivacy «||startpage.com/sp/$ping»)
    consulta: [],
  },
  qwant: {
    // EasyPrivacy «||k.qwant.com^» y «||stats.qwant.com^».
    hosts: new Set(["k.qwant.com", "stats.qwant.com"]),
    exactas: new Set(),
    prefijos: [
      "/maps/events", // uso de Qwant Maps (EasyPrivacy «||qwant.com/maps/events»)
      "/nemo-telemetry/", // AdGuard Tracking Protection «||qwant.com/nemo-telemetry/»
    ],
    finales: [],
    // Clics en los resultados, por ping (uBlock filters «||qwant.com/action/click_serp$ping,1p,important»). El resto de
    // pings de qwant.com y su medición de rendimiento (apm) se dejan, como hace uBlock filters, que los permite a
    // propósito («@@||qwant.com^$ping,1p», «@@||qwant.com/apm/intake/v2/rum/events$xhr,1p»).
    balizas: ["/action/click_serp"],
    consulta: [],
  },
  ecosia: {
    // Analítica (Snowplow): EasyPrivacy «||sp.ecosia.org^»; AdGuard Tracking Protection «||analytics.ecosia.org^».
    hosts: new Set(["sp.ecosia.org", "analytics.ecosia.org"]),
    exactas: new Set(),
    prefijos: [],
    finales: [],
    balizas: [],
    consulta: [],
  },
  wikipedia: {
    // Eventos de analítica (EventGate) y registro de errores: EasyPrivacy «||intake-analytics.wikimedia.org^»; AdGuard
    // Tracking Protection «||intake-logging.wikimedia.org^».
    hosts: new Set(["intake-analytics.wikimedia.org", "intake-logging.wikimedia.org"]),
    exactas: new Set(),
    prefijos: [
      "/beacon/", // estadísticas y eventos (EasyPrivacy «||wikipedia.org/beacon/»)
    ],
    finales: [],
    balizas: [],
    consulta: [],
  },
};
// Se dejan a propósito:
// - links.duckduckgo.com/d.js (los resultados), ac.duckduckgo.com (sugerencias), duckduckgo.com/y.js (el clic en un
//   anuncio, si el usuario los vuelve a mostrar: se abre, sin sus parámetros de medición).
// - bing.com/rewardsapp/ncheader (el contador de Microsoft Rewards de quien tiene sesión: lo muestra, no suma puntos),
//   /notifications/ (avisos de la cuenta), /fd/auth/ y login.live.com (inicio de sesión).
// - qwant.com/apm/ y el resto de sus pings (ver arriba); Startpage /sp/adsense/ (los anuncios los oculta Escudos, que
//   sabe sustituir su script sin que la página lo note).

/**
 * Parámetros que se quitan de la página de resultados de cada buscador (peticiones GET de documento). Se quedan los que
 * cambian el resultado (q, región, idioma, página, tipo de resultado, búsqueda segura, ajustes del buscador…).
 */
const PARAMETROS = {
  // AdGuard URL Tracking Protection: «||duckduckgo.com/?q=*&t=$document,removeparam=t» (t: origen de la búsqueda,
  // https://duckduckgo.com/duckduckgo-help-pages/privacy/t) y «||duckduckgo.com^$removeparam=» from, vis, perf_id,
  // parent_perf_id, origin y /^experiment_/. «atb» (cohorte anónima de instalación) se deja, como hace AdGuard: con la
  // extensión de DuckDuckGo instalada, quitarlo rompe su redirección.
  duckduckgo: new Set(["t", "from", "vis", "perf_id", "parent_perf_id", "origin"]),
  // ClearURLs, «bing»: cvid, sk, sp, sc, qs, qp y, en «referralMarketing», form (el código de origen: form=MOZLBR de la
  // configuración de Firefox, FORM=PERE de la paginación…). En minúsculas: Bing usa «form» y «FORM».
  bing: new Set(["form", "cvid", "sk", "sp", "sc", "qs", "qp"]),
  // AdGuard URL Tracking Protection «||wikipedia.org^$removeparam=wprov» (procedencia del enlace,
  // https://wikitech.wikimedia.org/wiki/Provenance).
  wikipedia: new Set(["wprov"]),
};

/** Parámetros del clic en un anuncio de DuckDuckGo (/y.js): AdGuard URL Tracking Protection. */
const PARAMETROS_ANUNCIO_DDG = new Set(["ad_domain", "ad_provider", "ad_type", "click_metadata", "iurl", "vqd"]);

/**
 * Códigos de socio de la configuración de búsqueda de Firefox (search-config-v2): ya no los pone el buscador (parche
 * 0400-privacidad/0002); esto cubre una build sin el parche o un enlace que los traiga de fuera. [parámetro, prueba].
 */
const SOCIO = {
  bing: ["pc", v => /^(?:MOZ|MZ)/i.test(v)],
  startpage: ["segment", v => v.startsWith("startpage.apex")],
  qwant: ["client", v => ["brz-moz", "ff_android", "ff_ios", "firefoxqwant"].includes(v)],
  ecosia: ["tt", v => ["mzl", "813cf1dd", "16eeffc4"].includes(v)],
  // sourceid=Mozilla-search, fijo en la configuración de Firefox.
  wikipedia: ["sourceid", v => v.startsWith("Mozilla")],
};

/**
 * DuckDuckGo sin anuncios: k1=-1 («Advertisements: Off»,
 * https://duckduckgo.com/duckduckgo-help-pages/settings/params/).
 * DuckDuckGo pide que esos parámetros sean de uso individual y que no se quite su publicidad por otros: por eso no
 * viene de serie. Solo lo enciende el propio usuario, con el interruptor del panel de Escudos en DuckDuckGo
 * (escudos.sys.mjs), que pone aegis.buscadores.sin_anuncios.
 *
 * DuckDuckGo sin IA: noai.duckduckgo.com (https://duckduckgo.com/duckduckgo-help-pages/ai-features/
 * about-noaiduckduckgocom), la misma dirección que usa su extensión oficial «DuckDuckGo No-AI Search». Allí la página
 * apaga Search Assist, Duck.ai y las respuestas automáticas y oculta las imágenes hechas con IA (kbd, kbe, kbg, kbf
 * y kbj, sin guardarlos en cookies, en el código de duckduckgo.com); no apaga Explore More (kbl). La extensión añade
 * t=noaiext y bext=noai, que la identifican; Aegis no añade nada. Los ajustes que DuckDuckGo guardó en duckduckgo.com
 * no pasan a noai: sus cookies de ajustes son solo de su host (docs/CONEXIONES.md, «Otros buscadores»).
 */
const DDG_SIN_ANUNCIOS = [["k1", "-1"]];

/** Rutas de la página de resultados de DuckDuckGo (la normal, la HTML y la ligera). */
const DDG_BUSQUEDA = new Set(["/", "/html", "/html/", "/lite", "/lite/"]);

let sinIA = true;
let sinAnuncios = false;
let rewards = false;

/**
 * Buscador de un host o null: el Map por sufijos (a.b.c.com → a.b.c.com, b.c.com, c.com, com).
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
      return null;
    }
    sufijo = host.slice(i);
  }
}

/** Buscador del documento que hace la petición (o de quien la desencadena). */
function familiaDeOrigen(loadInfo) {
  const p = loadInfo.loadingPrincipal ?? loadInfo.triggeringPrincipal;
  try {
    return p?.isContentPrincipal ? familia(p.asciiHost) : null;
  } catch {
    return null;
  }
}

/**
 * ¿Se corta esta petición (que no es una página)?
 *
 * @param {object} r reglas del buscador
 * @param {string} host
 * @param {string} ruta ruta sin la consulta (en Bing, en minúsculas)
 * @param {string} consulta
 * @param {number} tipo tipo de contenido externo
 */
function cortar(r, host, ruta, consulta, tipo) {
  if (r.hosts.has(host) || r.exactas.has(ruta)) {
    return true;
  }
  if (r.prefijos.some(p => ruta.startsWith(p)) || r.finales.some(f => ruta.endsWith(f))) {
    return true;
  }
  if ((tipo == TYPE_PING || tipo == TYPE_BEACON) && r.balizas.some(p => ruta.startsWith(p))) {
    return true;
  }
  if (r.consulta.length) {
    const c = new URLSearchParams(consulta);
    return r.consulta.some(([rr, p, v]) => ruta == rr && c.get(p) == v);
  }
  return false;
}

/** URL http(s) válida o null. */
function http(texto, base) {
  if (!texto || !URL.canParse(texto, base)) {
    return null;
  }
  const url = new URL(texto, base);
  return url.protocol == "https:" || url.protocol == "http:" ? url.href : null;
}

/**
 * Destino de un enlace de resultado de Bing (/ck/a?…&u=a1<base64url>): el formato de la regla de uBlock filters –
 * Privacy «||bing.com/ck/a*u=a1$doc,urlskip=?u /^a1(.*)$/ -safebase64». Los de las pestañas de Bing (Imágenes,
 * Vídeos…) llevan una ruta de Bing («/images/search?…»): se resuelve contra el propio Bing.
 */
function destinoBing(uri) {
  const u = new URLSearchParams(uri.query).get("u");
  if (!u?.startsWith("a1")) {
    return null;
  }
  try {
    let b = u.slice(2).replace(/-/g, "+").replace(/_/g, "/");
    b += "=".repeat((4 - (b.length % 4)) % 4);
    const texto = new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(atob(b), c => c.charCodeAt(0)));
    if (texto.startsWith("/") && !texto.startsWith("//")) {
      return http(texto, uri.prePath);
    }
    return http(texto);
  } catch {
    return null;
  }
}

/** Destino de un enlace de DuckDuckGo (/l/?uddg=<url>&rut=…): ClearURLs, «duckduckgo», y uBlock filters – Privacy. */
function destinoDDG(uri) {
  return http(new URLSearchParams(uri.query).get("uddg"));
}

/** La consulta sin los parámetros de `quitar` (en Bing, comparando en minúsculas) y sin el código de socio. */
function limpiarConsulta(fam, consulta) {
  const quitar = PARAMETROS[fam];
  const socio = SOCIO[fam];
  let cambios = false;
  for (const [nombre, valor] of [...consulta]) {
    const n = fam == "bing" ? nombre.toLowerCase() : nombre;
    if (
      quitar?.has(n) ||
      (fam == "duckduckgo" && nombre.startsWith("experiment_")) ||
      (socio && nombre == socio[0] && socio[1](valor))
    ) {
      consulta.delete(nombre);
      cambios = true;
    }
  }
  return cambios;
}

/** Añade los ajustes que falten (nunca cambia uno que ya trae la URL: ese lo ha elegido el usuario o la web). */
function ponerAjustes(consulta, ajustes) {
  let cambios = false;
  for (const [nombre, valor] of ajustes) {
    if (!consulta.has(nombre)) {
      consulta.set(nombre, valor);
      cambios = true;
    }
  }
  return cambios;
}

/** Redirección interna a `destino` (sin los parámetros de la lista nativa si sale del buscador). */
function ir(canal, destino, nativos) {
  const uri = Services.io.newURI(destino);
  const privado = canal.loadInfo.originAttributes.privateBrowsingId > 0;
  canal.redirectTo(nativos ? sinParametrosNativos(uri, privado) : uri);
}

/**
 * Una página (documento principal o marco) de un buscador: enlaces directos y búsqueda limpia. Nunca se cancela una
 * página: lo que el usuario abre, se abre.
 */
function documento(canal, uri, fam, host) {
  if (canal.requestMethod != "GET") {
    return;
  }
  const loadInfo = canal.loadInfo;
  const ruta = uri.filePath;
  const delBuscador = () => familiaDeOrigen(loadInfo) == fam;

  // Enlaces de resultados que pasan por la redirección del buscador: directos, si el clic sale del buscador.
  if (fam == "duckduckgo" && (ruta == "/l/" || ruta == "/l")) {
    const destino = delBuscador() && destinoDDG(uri);
    if (destino) {
      ir(canal, destino, true);
    }
    return;
  }
  if (fam == "bing" && ruta.toLowerCase() == "/ck/a") {
    const destino = delBuscador() && destinoBing(uri);
    if (destino) {
      ir(canal, destino, familia(Services.io.newURI(destino).asciiHost) != "bing");
    }
    return;
  }

  if (!uri.query) {
    return;
  }
  const consulta = new URLSearchParams(uri.query);
  let cambios = false;
  if (fam == "duckduckgo") {
    if (ruta == "/y.js") {
      for (const n of [...consulta.keys()]) {
        if (PARAMETROS_ANUNCIO_DDG.has(n)) {
          consulta.delete(n);
          cambios = true;
        }
      }
    } else if (DDG_BUSQUEDA.has(ruta) && consulta.has("q")) {
      cambios = limpiarConsulta(fam, consulta);
      // Búsquedas desde el navegador (barra de direcciones, nueva pestaña, menú contextual: principal de sistema) en
      // la página normal. Dentro de DuckDuckGo, sus enlaces se quedan en el mismo host y conservan los ajustes.
      const ddg = host == "duckduckgo.com" || host == NOAI;
      if (ruta == "/" && ddg && loadInfo.triggeringPrincipal?.isSystemPrincipal) {
        // Sin anuncios, solo si el usuario lo ha encendido (y salvo que la URL ya traiga k1).
        cambios = (sinAnuncios && ponerAjustes(consulta, DDG_SIN_ANUNCIOS)) || cambios;
        // Sin IA: a noai.duckduckgo.com, con la misma búsqueda.
        if (sinIA && host == "duckduckgo.com") {
          canal.redirectTo(uri.mutate().setHost(NOAI).setQuery(consulta.toString()).finalize());
          return;
        }
      }
    }
  } else if (fam == "bing") {
    // Páginas de resultados: /search, /images/search, /videos/search, /news/search…
    if (ruta.toLowerCase().endsWith("/search")) {
      cambios = limpiarConsulta(fam, consulta);
    }
  } else if (fam == "wikipedia") {
    if (host.endsWith("wikipedia.org")) {
      cambios = limpiarConsulta(fam, consulta);
    }
  } else if (
    (fam == "startpage" && ruta == "/sp/search") ||
    (fam == "qwant" && host == "www.qwant.com" && ruta == "/") ||
    (fam == "ecosia" && ruta == "/search")
  ) {
    cambios = limpiarConsulta(fam, consulta);
  }
  if (cambios) {
    canal.redirectTo(uri.mutate().setQuery(consulta.toString()).finalize());
  }
}

/**
 * Sugerencias que pide el navegador (XMLHttpRequest con principal de sistema: SearchSuggestionController).
 * - Startpage: la configuración de Firefox las pide a /suggestions?partner=apex&format=opensearch&segment=<socio>; sin
 *   el código de socio esa dirección contesta 204 sin nada (comprobado el 2026-10-19). Se piden a la que publica el
 *   propio Startpage en su OpenSearch (https://cdn.startpage.com/sp/cdn/opensearch/en/opensearch.xml):
 *   /osuggestions?q=…, con la misma respuesta.
 * - Bing: sin form=OSDJAS (código de origen; la respuesta es la misma sin él, comprobado el 2026-10-19).
 */
function sugerencias(canal, uri, fam) {
  const ruta = uri.filePath;
  const consulta = new URLSearchParams(uri.query);
  if (fam == "startpage" && ruta == "/suggestions" && consulta.get("partner") == "apex" && consulta.has("q")) {
    const limpia = new URLSearchParams({ q: consulta.get("q") });
    canal.redirectTo(uri.mutate().setPathQueryRef(`/osuggestions?${limpia}`).finalize());
    return;
  }
  if (fam == "bing" && ruta.toLowerCase() == "/osjson.aspx" && limpiarConsulta(fam, consulta)) {
    canal.redirectTo(uri.mutate().setQuery(consulta.toString()).finalize());
  }
}

const observador = {
  observe(subject) {
    const canal = subject.QueryInterface(Ci.nsIHttpChannel);
    // Otro observador (Escudos, Google limpio) puede haberla cancelado ya: no se toca.
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
    if (tipo == TYPE_XMLHTTPREQUEST && loadInfo.loadingPrincipal?.isSystemPrincipal) {
      sugerencias(canal, uri, fam);
      return;
    }
    // Escudos bajados en la página: no se toca nada, como hace la protección contra rastreo.
    if (escudosBajados(canal, uri, tipo)) {
      return;
    }
    if (tipo == TYPE_DOCUMENT || tipo == TYPE_SUBDOCUMENT) {
      documento(canal, uri, fam, host);
      return;
    }
    const ruta = fam == "bing" ? uri.filePath.toLowerCase() : uri.filePath;
    if (!cortar(REGLAS[fam], host, ruta, uri.query, tipo) || (rewards && fam == "bing" && ruta == RUTA_REWARDS)) {
      return;
    }
    // Respuesta neutra (un 200 vacío, no un error que la web pueda ver) o, si no se puede, cortarla.
    if (!lazy.AegisEscudosRed.neutro(canal)) {
      canal.cancel(Cr.NS_ERROR_ABORT);
    }
    try {
      AegisEscudos.anotar(loadInfo.browsingContext?.top?.embedderElement, "rastreadores", uri.prePath);
    } catch (e) {
      console.error("Aegis: búsqueda limpia, contador de Escudos", e);
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

function leerAjustes() {
  sinIA = Services.prefs.getBoolPref(PREF_SIN_IA, true);
  sinAnuncios = Services.prefs.getBoolPref(PREF_SIN_ANUNCIOS, false);
  rewards = Services.prefs.getBoolPref(PREF_REWARDS, false);
}

export const AegisBusquedaLimpia = {
  /** Una vez por arranque (idempotente). Escucha las prefs para encenderse o apagarse sin reiniciar. */
  inicio() {
    if (iniciado) {
      return;
    }
    iniciado = true;
    leerAjustes();
    aplicarPref();
    Services.prefs.addObserver(PREF_LIMPIO, aplicarPref);
    Services.prefs.addObserver(PREF_SIN_IA, leerAjustes);
    Services.prefs.addObserver(PREF_SIN_ANUNCIOS, leerAjustes);
    Services.prefs.addObserver(PREF_REWARDS, leerAjustes);
  },

  /**
   * Para el panel de Escudos: el buscador de la pestaña con un ajuste propio en el panel («duckduckgo» o «bing»), o
   * null. Con la búsqueda limpia apagada, null (los interruptores no harían nada).
   *
   * @param {Element} browser
   * @returns {"duckduckgo" | "bing" | null}
   */
  buscadorDe(browser) {
    if (!activo) {
      return null;
    }
    let host;
    try {
      host = browser.currentURI.asciiHost;
    } catch {
      return null;
    }
    const fam = familia(host);
    return fam == "duckduckgo" || fam == "bing" ? fam : null;
  },

  /** ¿Pide el usuario DuckDuckGo sin anuncios? */
  get sinAnuncios() {
    return sinAnuncios;
  },

  /** ¿Deja el usuario pasar la actividad de Microsoft Rewards? */
  get rewards() {
    return rewards;
  },

  /**
   * Interruptor del panel en DuckDuckGo: guarda la elección del usuario y, si la pestaña tiene una búsqueda de
   * DuckDuckGo abierta, la vuelve a cargar con k1=-1 o sin él (las búsquedas siguientes ya salen así).
   *
   * @param {Window} win la ventana del navegador (su pestaña visible)
   * @param {boolean} quitar
   */
  ponerSinAnuncios(win, quitar) {
    Services.prefs.setBoolPref(PREF_SIN_ANUNCIOS, quitar);
    const browser = win.gBrowser.selectedBrowser;
    const uri = browser.currentURI;
    let url;
    try {
      url = new URL(uri.spec);
    } catch {
      return;
    }
    if (familia(url.hostname) != "duckduckgo" || url.pathname != "/" || !url.searchParams.has("q")) {
      return;
    }
    if (quitar) {
      url.searchParams.set("k1", "-1");
    } else {
      url.searchParams.delete("k1");
    }
    win.gBrowser.loadURI(Services.io.newURI(url.href), {
      triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
    });
  },

  /**
   * Interruptor del panel en Bing: deja pasar (true) o corta la actividad de Microsoft Rewards. Vale desde la siguiente
   * petición; no hace falta recargar.
   *
   * @param {boolean} dejar
   */
  ponerRewards(dejar) {
    Services.prefs.setBoolPref(PREF_REWARDS, dejar);
  },

  /** Para las pruebas. */
  _familia: familia,
  _cortar: (url, tipo) => {
    const u = new URL(url);
    const fam = familia(u.hostname);
    const ruta = fam == "bing" ? u.pathname.toLowerCase() : u.pathname;
    return !!fam && cortar(REGLAS[fam], u.hostname, ruta, u.search.slice(1), tipo);
  },
  _destinoBing: url => destinoBing(Services.io.newURI(url)),
  _destinoDDG: url => destinoDDG(Services.io.newURI(url)),
};

export const inicio = () => AegisBusquedaLimpia.inicio();
