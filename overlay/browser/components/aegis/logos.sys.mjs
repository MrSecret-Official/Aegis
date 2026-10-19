/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · logos de los accesos directos de la nueva pestaña (proceso principal). Lo llama el actor AegisPaginas
 * (paginas/AegisPaginasParent.sys.mjs) a petición de paginas/logos.sys.mjs.
 *
 * Por qué hace falta: la nueva pestaña busca el favicon de un acceso en Places con su dirección exacta y, si no está,
 * con el otro esquema (NewTabUtils._addFavicons). Firefox no prueba con o sin «www» ni sigue las redirecciones salvo
 * para iconos de 96 px o más y solo si el acceso ya está en el historial (FaviconProvider.fetchIconFromRedirects). Un
 * acceso a http://chess.com cuya web es https://www.chess.com/ se queda con la inicial aunque el icono esté guardado.
 *
 * - iconoLocal(): el favicon guardado en Places para la dirección del acceso o una equivalente: el otro esquema, con o
 *   sin «www», la raíz del sitio, las redirecciones de la última visita y las páginas del sitio más visitadas. Solo lee
 *   la base de datos del perfil: nunca la red. Con el más grande va otro favicon de la misma página (alternativa): el
 *   menor de 48 px o más que no sea el grande y, si no hay, el de 32.
 * - Sin fondo claro: el icono más grande de un sitio suele ser el «apple-touch-icon» de iOS, el logo sobre un cuadrado
 *   opaco. Si el cuadrado es blanco o gris muy claro (YouTube), en la loseta se ve como un cuadrado blanco: solo
 *   entonces se prefiere otro sin ese fondo de 32 px o más (fondoClaro() y sinFondo(), paginas/logos.sys.mjs). Un
 *   cuadrado oscuro (DeepL) o del color de la marca (Roblox) se queda: se ve bien sobre la loseta y es el icono
 *   grande, nítido; uno de 32 ampliado a la caja se vería pixelado.
 * - logo(): el botón «Usar el logo de la web» del diálogo de editar un acceso. Primero el favicon local; si no hay, y
 *   solo porque el usuario lo ha pedido, lo descarga del propio sitio (docs/CONEXIONES.md): la página del acceso y el
 *   icono que declara (o /favicon.ico), sin cookies, sin Referer y sin guardar nada en la caché. La imagen se deja en
 *   el almacén de miniaturas de la nueva pestaña (PageThumbs) con la dirección del icono como clave: es lo que lee
 *   Firefox para una «imagen personalizada» (customScreenshotURL) y, como la captura de webs en segundo plano está
 *   apagada (settings/prefs/20-nueva-pestana.js), nunca va a la red a por ella.
 *
 * Sin temporizadores ni trabajo en reposo: todo empieza con una petición de la página.
 */

import { LADO_MEDIDA, fondoClaro, pixeles, sinFondo } from "./paginas/logos.sys.mjs";

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  PageThumbsStorage: "resource://gre/modules/PageThumbs.sys.mjs",
  PlacesUtils: "resource://gre/modules/PlacesUtils.sys.mjs",
  clearTimeout: "resource://gre/modules/Timer.sys.mjs",
  setTimeout: "resource://gre/modules/Timer.sys.mjs",
});

/** Tamaño que se pide a Places: el mayor razonable para una loseta (el mismo que la nueva pestaña). */
const TAMANO_PLACES = 96;
/**
 * Y los de la alternativa, por orden: otro favicon de la página por si el grande es un icono táctil con fondo claro.
 * Mejor de 48 o más (se ve nítido en la caja de 40); si no hay, el normal de 32.
 */
const TAMANOS_ALTERNATIVA = [48, 32];
/**
 * Imagen que se guarda: 160 px (4 × los 40 px del icono de la loseta, para pantallas de alta densidad). El icono la
 * llena, como Firefox pinta un favicon en la loseta (pequeño o grande, a los 40 px de la caja).
 */
const LADO = 160;
const MAX_HTML = 512 * 1024;
const MAX_ICONO = 1024 * 1024;
const ESPERA_RED = 15000;
const MAX_URL = 2048;

/**
 * La dirección si es http(s) y razonable, o null.
 *
 * @param {string} texto
 * @returns {URL|null}
 */
export function direccionValida(texto) {
  if (typeof texto != "string" || !texto || texto.length > MAX_URL) {
    return null;
  }
  const url = URL.parse(texto);
  return url && ["http:", "https:"].includes(url.protocol) && url.hostname ? url : null;
}

/** El host con y sin «www.» (primero el que se ha dado). */
function hostsDe(host) {
  return [host, host.startsWith("www.") ? host.slice(4) : "www." + host];
}

/** rev_host de moz_places: el host al revés y con un punto al final. */
function revHost(host) {
  return [...host].reverse().join("") + ".";
}

/**
 * Direcciones de la última visita a una página y de sus redirecciones (la consulta de FaviconProvider de Firefox).
 *
 * @param {object} db conexión de solo lectura de Places
 * @param {string} spec
 */
async function redirecciones(db, spec) {
  const { REDIRECT_PERMANENT, REDIRECT_TEMPORARY } = lazy.PlacesUtils.history.TRANSITIONS;
  const filas = await db.executeCached(
    `WITH RECURSIVE path(visit_id) AS (
       SELECT v.id FROM moz_places h JOIN moz_historyvisits v ON v.place_id = h.id
       WHERE h.url_hash = hash(:url) AND h.url = :url AND v.visit_date = h.last_visit_date
       UNION
       SELECT id FROM moz_historyvisits JOIN path ON visit_id = from_visit
       WHERE visit_type IN (${REDIRECT_PERMANENT}, ${REDIRECT_TEMPORARY})
     )
     SELECT (SELECT url FROM moz_places WHERE id = (SELECT place_id FROM moz_historyvisits WHERE id = visit_id)) AS url
     FROM path`,
    { url: spec }
  );
  return filas.map(f => f.getResultByName("url")).filter(Boolean);
}

/** Las páginas más visitadas del sitio (con o sin «www»). */
async function paginasDelSitio(db, hosts) {
  const filas = await db.executeCached(
    `SELECT url FROM moz_places WHERE rev_host IN (:a, :b) AND frecency > 0 ORDER BY frecency DESC LIMIT 5`,
    { a: revHost(hosts[0]), b: revHost(hosts[1]) }
  );
  return filas.map(f => f.getResultByName("url"));
}

/**
 * Páginas cuyo favicon vale para la dirección, de la más parecida a la menos.
 *
 * @param {URL} url
 * @returns {Promise<string[]>}
 */
async function candidatas(url) {
  const lista = [];
  const poner = spec => {
    const u = direccionValida(spec);
    if (u && !lista.includes(u.href)) {
      lista.push(u.href);
    }
  };
  const otroEsquema = new URL(url.href);
  otroEsquema.protocol = url.protocol == "https:" ? "http:" : "https:";
  poner(url.href);
  poner(otroEsquema.href);
  const hosts = hostsDe(url.hostname);
  for (const host of hosts) {
    poner(`https://${host}/`);
    poner(`http://${host}/`);
  }
  const db = await lazy.PlacesUtils.promiseDBConnection();
  for (const spec of [...lista]) {
    for (const destino of await redirecciones(db, spec)) {
      poner(destino);
    }
  }
  for (const spec of await paginasDelSitio(db, hosts)) {
    poner(spec);
  }
  return lista;
}

/**
 * El favicon de una página guardado en Places más cercano a `tamano`, o null.
 *
 * @param {string} spec
 * @param {number} tamano
 * @returns {Promise<{uri: string, dato: string, ancho: number, tipo: string, bytes: number[]}|null>}
 */
async function faviconGuardado(spec, tamano) {
  let icono = null;
  try {
    icono = await lazy.PlacesUtils.favicons.getFaviconForPage(Services.io.newURI(spec), tamano);
  } catch {}
  return icono
    ? { uri: icono.uri.spec, dato: icono.dataURI.spec, ancho: icono.width, tipo: icono.mimeType, bytes: icono.rawData }
    : null;
}

/**
 * El favicon guardado que mejor sirve para la dirección (el más grande; a igualdad, el de la página más parecida) y,
 * como alternativa, otro favicon de esa misma página (TAMANOS_ALTERNATIVA: el menor de 48 o más que no sea el grande,
 * o el de 32): si el grande resulta tener fondo claro opaco (un icono táctil blanco), se usa la alternativa cuando no
 * lo tiene. Solo lee Places.
 *
 * @param {URL} url
 * @returns {Promise<{uri: string, dato: string, ancho: number, tipo: string, bytes: number[], alternativa: object|null}|null>}
 */
export async function iconoLocal(url) {
  let mejor = null;
  let pagina = null;
  for (const spec of await candidatas(url)) {
    const icono = await faviconGuardado(spec, TAMANO_PLACES);
    if (icono && (!mejor || icono.ancho > mejor.ancho)) {
      mejor = icono;
      pagina = spec;
    }
  }
  if (mejor) {
    mejor.alternativa = null;
    for (const tamano of TAMANOS_ALTERNATIVA) {
      // Places da el menor de `tamano` o más (o, si no hay, el mayor): vale si es otro y llega a `tamano`.
      const otro = await faviconGuardado(pagina, tamano);
      if (otro && otro.uri != mejor.uri && otro.ancho >= tamano) {
        mejor.alternativa = otro;
        break;
      }
    }
  }
  return mejor;
}

/**
 * Favicons locales de varios accesos, para los que la nueva pestaña enseña con la inicial.
 *
 * @param {string[]} urls
 * @returns {Promise<object>} {url: {dato, alternativa?}} solo de los que tienen; la alternativa (otro favicon de la
 *   misma página) la elige el proceso de contenido si `dato` tiene fondo claro y ella no (paginas/logos.sys.mjs)
 */
export async function iconosLocales(urls) {
  const resultado = {};
  for (const texto of (Array.isArray(urls) ? urls : []).slice(0, 48)) {
    const url = direccionValida(texto);
    if (!url) {
      continue;
    }
    const icono = await iconoLocal(url);
    if (icono) {
      resultado[texto] = icono.alternativa ? { dato: icono.dato, alternativa: icono.alternativa.dato } : { dato: icono.dato };
    }
  }
  return resultado;
}

// ── Red: solo con el botón ────────────────────────────────────────────────────────────────────────────────────────

/**
 * Opciones de cada petición: sin cookies, sin Referer, sin caché y con un tope de tiempo (la señal de la descarga).
 *
 * @param {AbortSignal} senal
 */
function opcionesDeRed(senal) {
  return {
    credentials: "omit",
    referrerPolicy: "no-referrer",
    cache: "no-store",
    redirect: "follow",
    signal: senal,
  };
}

/** Lee como mucho `maximo` bytes de una respuesta. */
async function leerHasta(respuesta, maximo) {
  const lector = respuesta.body.getReader();
  const trozos = [];
  let total = 0;
  while (total < maximo) {
    const { done, value } = await lector.read();
    if (done) {
      break;
    }
    trozos.push(value);
    total += value.length;
  }
  lector.cancel().catch(() => {});
  const bytes = new Uint8Array(Math.min(total, maximo));
  let pos = 0;
  for (const t of trozos) {
    const parte = t.subarray(0, bytes.length - pos);
    bytes.set(parte, pos);
    pos += parte.length;
  }
  return bytes;
}

/**
 * Iconos que declara una página (<link rel="icon">, «apple-touch-icon»), del más grande al más pequeño.
 *
 * @param {string} html
 * @param {string} base dirección final de la página
 * @returns {string[]}
 */
function iconosDeLaPagina(html, base) {
  const iconos = [];
  for (const [etiqueta] of html.matchAll(/<link\b[^>]*>/gi)) {
    const atributos = {};
    for (const m of etiqueta.matchAll(/([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
      atributos[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? "";
    }
    const rel = (atributos.rel ?? "").toLowerCase().split(/\s+/);
    const tactil = rel.some(r => r.startsWith("apple-touch-icon"));
    if (!atributos.href || !(tactil || rel.includes("icon"))) {
      continue;
    }
    const url = URL.parse(atributos.href.trim(), base);
    if (!url || !["https:", "data:"].includes(url.protocol)) {
      continue;
    }
    const tamanos = (atributos.sizes ?? "").toLowerCase();
    let tamano = Math.max(0, ...[...tamanos.matchAll(/(\d+)x\d+/g)].map(m => Number(m[1])));
    if (!tamano) {
      const svg = (atributos.type ?? "").includes("svg") || url.pathname.endsWith(".svg") || tamanos.includes("any");
      tamano = svg ? 64 : tactil ? 180 : 32;
    }
    iconos.push({ url: url.href, tamano });
  }
  iconos.sort((a, b) => b.tamano - a.tamano);
  return [...new Set(iconos.map(i => i.url))];
}

/**
 * Descarga el icono del sitio: la página del acceso (por https) y los iconos que declara, del más grande al más
 * pequeño, y al final /favicon.ico (como mucho cuatro iconos). Se queda con el primero sin fondo claro (sinFondo) y,
 * si ninguno lo es, con el primero que `pintar` acepte: los siguientes solo se piden mientras el que hay tiene fondo
 * claro. Un icono sobre un cuadrado oscuro o de color vale a la primera.
 * Solo https.
 *
 * Todo lleva un tope de ESPERA_RED: un solo temporizador mientras dura la descarga pedida, que se quita al acabar
 * (AbortSignal.timeout no funciona fuera de una ventana).
 *
 * @param {URL} url
 * @param {(blob: Blob) => Promise<{png: Uint8Array, fondo: boolean, lado: number}|null>} pintar convierte el icono en
 *   la imagen de la loseta
 * @returns {Promise<{uri: string, png: Uint8Array}|null>}
 */
async function iconoDeLaRed(url, pintar) {
  const control = new AbortController();
  const tope = lazy.setTimeout(() => control.abort(), ESPERA_RED);
  try {
    return await descargarIcono(url, control.signal, pintar);
  } finally {
    lazy.clearTimeout(tope);
  }
}

/**
 * @param {URL} url
 * @param {AbortSignal} senal
 * @param {(blob: Blob) => Promise<{png: Uint8Array, fondo: boolean, lado: number}|null>} pintar
 */
async function descargarIcono(url, senal, pintar) {
  const pagina = new URL(url.href);
  pagina.protocol = "https:";
  pagina.hash = "";
  let base = pagina.href;
  let iconos = [];
  try {
    const respuesta = await fetch(pagina.href, opcionesDeRed(senal));
    if (respuesta.ok && (respuesta.headers.get("content-type") ?? "").includes("html")) {
      base = respuesta.url || base;
      iconos = iconosDeLaPagina(new TextDecoder().decode(await leerHasta(respuesta, MAX_HTML)), base);
    } else {
      respuesta.body?.cancel().catch(() => {});
    }
  } catch (e) {
    console.warn("Aegis: logo de la web, página", e);
  }
  const finalHttps = URL.parse(base);
  if (finalHttps?.protocol == "https:") {
    iconos.push(new URL("/favicon.ico", finalHttps).href);
  }
  let respaldo = null;
  for (const icono of [...new Set(iconos)].slice(0, 4)) {
    try {
      const respuesta = await fetch(icono, opcionesDeRed(senal));
      if (!respuesta.ok) {
        respuesta.body?.cancel().catch(() => {});
        continue;
      }
      const bytes = await leerHasta(respuesta, MAX_ICONO + 1);
      if (bytes.length > MAX_ICONO || !bytes.length) {
        continue;
      }
      const tipo = (respuesta.headers.get("content-type") ?? "").split(";")[0];
      const imagen = await pintar(new Blob([bytes], { type: tipo }));
      if (!imagen) {
        continue;
      }
      const resultado = { uri: icono.startsWith("data:") ? base : icono, png: imagen.png };
      if (sinFondo(imagen)) {
        return resultado;
      }
      // Con fondo claro (o diminuto): vale si no hay otro mejor.
      respaldo ??= resultado;
    } catch (e) {
      console.warn("Aegis: logo de la web, icono", e);
    }
  }
  return respaldo;
}

// ── Imagen de la loseta ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * Pinta el icono como PNG cuadrado de LADO px, entero y centrado (si no es cuadrado, con transparente a los lados), y
 * dice si tiene fondo claro opaco (fondoClaro) y su lado mayor. Decodifica con la ventana del navegador; null si no es
 * una imagen.
 *
 * @param {Window} win ventana del navegador
 * @param {Blob} blob
 * @returns {Promise<{png: Uint8Array, fondo: boolean, lado: number}|null>}
 */
async function pintar(win, blob) {
  const direccion = win.URL.createObjectURL(blob);
  try {
    const img = new win.Image();
    img.src = direccion;
    await img.decode();
    const ancho = img.naturalWidth || LADO;
    const alto = img.naturalHeight || LADO;
    const lienzo = win.document.createElementNS("http://www.w3.org/1999/xhtml", "canvas");
    lienzo.width = lienzo.height = LADO;
    const ctx = lienzo.getContext("2d");
    const escala = LADO / Math.max(ancho, alto);
    // Un favicon diminuto (16 o 32 px) aumentado un número entero de veces se ve nítido sin suavizado.
    ctx.imageSmoothingEnabled = blob.type.includes("svg") || !Number.isInteger(escala);
    const w = ancho * escala;
    const h = alto * escala;
    ctx.drawImage(img, (LADO - w) / 2, (LADO - h) / 2, w, h);
    const png = await new Promise(r => lienzo.toBlob(r, "image/png"));
    if (!png) {
      return null;
    }
    let fondo = false;
    try {
      fondo = fondoClaro(pixeles(win.document, img), LADO_MEDIDA);
    } catch {}
    // Un SVG sin tamaño propio (naturalWidth 0) se escala sin perder nitidez: cuenta como grande.
    const lado = Math.max(img.naturalWidth, img.naturalHeight) || LADO;
    return { png: new Uint8Array(await png.arrayBuffer()), fondo, lado };
  } catch {
    return null;
  } finally {
    win.URL.revokeObjectURL(direccion);
  }
}

/**
 * «Usar el logo de la web»: deja el logo del sitio como imagen personalizada del acceso.
 *
 * @param {string} texto dirección del acceso
 * @param {Window} win ventana del navegador (para decodificar el icono)
 * @returns {Promise<{clave: string, origen: string}|{error: string}>} clave: la dirección que va en «imagen
 *   personalizada»; origen: «local» o «red»
 */
export async function logo(texto, win) {
  const url = direccionValida(texto);
  if (!url || !win) {
    return { error: "direccion" };
  }
  const aImagen = blob => pintar(win, blob);
  let icono = null;
  let origen = "local";
  const aBlob = guardado => new Blob([new Uint8Array(guardado.bytes)], { type: guardado.tipo });
  const local = await iconoLocal(url);
  if (local) {
    let imagen = await aImagen(aBlob(local));
    let uri = local.uri;
    // El grande con fondo claro (un icono táctil blanco): el otro favicon de la misma página, si no lo tiene.
    if (local.alternativa && (!imagen || imagen.fondo)) {
      const otra = await aImagen(aBlob(local.alternativa));
      if (otra && (!imagen || sinFondo(otra))) {
        imagen = otra;
        uri = local.alternativa.uri;
      }
    }
    icono = imagen && { uri, png: imagen.png };
  }
  if (!icono) {
    // Sin icono local que valga: solo ahora, y porque el usuario lo ha pedido, se va al sitio.
    origen = "red";
    icono = await iconoDeLaRed(url, aImagen);
  }
  if (!icono) {
    return { error: "red" };
  }
  // La clave es la dirección del icono, si es web (la que ve el usuario en «imagen personalizada»).
  const uri = direccionValida(icono.uri);
  const clave = uri ? uri.href : new URL("/favicon.ico", `https://${url.hostname}`).href;
  await lazy.PageThumbsStorage.writeData(clave, icono.png);
  return { clave, origen };
}
