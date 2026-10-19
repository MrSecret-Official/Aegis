/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · énfasis de color (docs/DISENO.md §2, «Énfasis»), a elegir en Ajustes › Apariencia o en «Personalizar» de
 * la nueva pestaña (pref aegis.enfasis):
 * - «monocromo» (de serie): el blanco o negro de la acción principal;
 * - temas fijos: hielo, pizarra, salvia, ambar, coral, lavanda, malva, cobalto, piedra, laguna, musgo, frambuesa y
 *   ciruela (sus bases están en estilos/tokens.css);
 * - «windows»: el color de énfasis de Windows (el color de sistema AccentColor);
 * - «fondo»: el color dominante del fondo de escritorio, leído y calculado en este equipo;
 * - «propio»: uno que crea el usuario en el selector del «+» (selector-enfasis.sys.mjs), con un color o dos (degradado).
 *   El que está en uso va en aegis.enfasis.propio y los guardados («Mis énfasis»), en aegis.enfasis.guardados (JSON,
 *   validados por enfasis-propio.sys.mjs, como mucho 24). Solo prefs del perfil: nada sale del equipo. Sin valor de
 *   serie, Gecko no copia su valor a los procesos de las webs ni a los precargados; los demás (privilegedabout, un
 *   privilegedmozilla creado en frío, el de las extensiones y el de file://) sí lo reciben, como cualquier pref: es el
 *   modelo de Gecko y solo lo aprovecharía un proceso comprometido. A sharedData, que ven todos los procesos, solo van
 *   los colores del que está en uso; el nombre y los guardados, por mensaje y solo al proceso de las páginas
 *   privilegiadas.
 *
 * Cómo llega a cada documento: el atributo aegis-enfasis en la raíz. tokens.css deriva de la base de cada énfasis, con
 * una sola fórmula, el énfasis de cada esquema, su encima, el foco, el filo de la pestaña activa y el tinte del
 * degradado del marco (siempre con el contraste de DISENO §2). Lo que solo sabe este módulo va como variables en la
 * raíz: --aegis-enfasis-fondo (el color del fondo), los colores del personalizado (--aegis-enfasis-propio y -propio-2,
 * con el atributo aegis-enfasis-degradado si tiene dos) y, en las páginas de contenido, que no ven los colores de
 * sistema, --aegis-enfasis-windows.
 * - Documentos de la interfaz (chrome:// y about: del proceso principal, como la ventana o Ajustes): los marca este
 *   módulo al crearse (document-element-inserted, antes de pintarse).
 * - Páginas propias en un proceso de contenido (nueva pestaña, navegación privada…): el actor AegisPaginas lee el
 *   estado que este módulo publica en Services.ppmm.sharedData (paginas/personalizar.sys.mjs).
 *
 * El fondo de escritorio: la ruta sale del registro (HKCU\Control Panel\Desktop\WallPaper, o la copia de Windows en
 * %APPDATA%\Microsoft\Windows\Themes\TranscodedWallpaper; con un color liso, HKCU\Control Panel\Colors\Background),
 * la imagen se decodifica a 32 × 32 en memoria y de ahí sale un color agradable: el tono que más pesa, con el croma
 * limitado. Nada sale del equipo y no se guarda la ruta: solo el color y una huella (hash) para no repetir el cálculo.
 *
 * Sin temporizadores ni trabajo en reposo: se recalcula al arrancar (con la huella guardada no hace falta decodificar
 * nada), cuando Windows avisa de un cambio de colores (look-and-feel-changed) y cuando una ventana vuelve a primer
 * plano, que es cuando el usuario puede haber cambiado el fondo en Configuración; en los dos casos solo se compara la
 * huella (una lectura del registro y la fecha del archivo) y se decodifica únicamente si ha cambiado.
 */

import { borrarDe, guardarEn, leerGuardados, leerPropio, oklab, validarAcento } from "./enfasis-propio.sys.mjs";

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  BrowserWindowTracker: "resource:///modules/BrowserWindowTracker.sys.mjs",
});

export const PREF = "aegis.enfasis";
/**
 * Énfasis que se pueden elegir con una muestra, en el orden de los selectores: arriba Monocromo y los automáticos,
 * debajo los temas en dos filas de siete con el «+» del personalizado al final. El primero es el de serie.
 */
export const ENFASIS = [
  "monocromo",
  "windows",
  "fondo",
  "hielo",
  "pizarra",
  "salvia",
  "ambar",
  "coral",
  "lavanda",
  "malva",
  "cobalto",
  "piedra",
  "laguna",
  "musgo",
  "frambuesa",
  "ciruela",
];
/** El personalizado: un valor más de aegis.enfasis, sin muestra propia (lo abre el «+»). */
export const PROPIO = "propio";
/** El personalizado en uso y los guardados (JSON; enfasis-propio.sys.mjs). */
export const PREF_PROPIO = "aegis.enfasis.propio";
export const PREF_GUARDADOS = "aegis.enfasis.guardados";
/** Color calculado del fondo de escritorio (oklch) y la huella del fondo del que salió. */
const PREF_FONDO_COLOR = "aegis.enfasis.fondo.color";
const PREF_FONDO_HUELLA = "aegis.enfasis.fondo.huella";
/** Estado que leen las páginas de contenido (paginas/personalizar.sys.mjs). */
export const CLAVE_COMPARTIDA = "aegis:enfasis";
/** Mensajes de las páginas propias (paginas/personalizar.sys.mjs). */
export const MENSAJE = "Aegis:Paginas";
export const MENSAJE_IMAGEN = "Aegis:Paginas:Imagen";
/** El personalizado con su nombre y los guardados, solo al proceso de las páginas privilegiadas. */
export const MENSAJE_PROPIO = "Aegis:Paginas:Propio";
/**
 * Separación entre la fila de accesos y el buscador de la nueva pestaña (pref aegis.nuevapestana.espaciado), en px de
 * la rejilla de 4 (DISENO §4): del mínimo (la de Brave) al máximo (la de serie de Aegis).
 */
export const ESPACIADO = { minimo: 36, maximo: 64, paso: 4, serie: 64 };
/**
 * Ancho del buscador de la nueva pestaña (pref aegis.nuevapestana.ancho), en px: del de Brave (416; en las capturas
 * del usuario, a la misma escala, 520 frente a los 750 de los 600 px de Aegis) al de serie de Aegis, de 8 en 8.
 */
export const ANCHO = { minimo: 416, maximo: 600, paso: 8, serie: 600 };

const estado = {
  modo: "monocromo",
  /** Base del fondo de escritorio, «oklch(…)», o null si aún no se ha calculado. */
  fondo: null,
  /** Énfasis de Windows en «rgb(…)», para las páginas de contenido. */
  windows: null,
  /** El personalizado en uso ({c, c2?, n?}) o null. */
  propio: null,
  /** Los guardados en «Mis énfasis». */
  guardados: [],
};

/** Documentos de la interfaz marcados (WeakRef), para repintarlos cuando cambia el énfasis. */
const documentos = new Set();
const marcados = new WeakSet();
let iniciado = false;
/** Cálculo del fondo en curso (para no lanzar dos a la vez). */
let calculando = null;

function leerModo() {
  const modo = Services.prefs.getStringPref(PREF, "monocromo");
  if (modo == PROPIO) {
    return leerPropio(Services.prefs.getStringPref(PREF_PROPIO, "")) ? PROPIO : "monocromo";
  }
  return ENFASIS.includes(modo) ? modo : "monocromo";
}

/** El personalizado y los guardados, de sus prefs (validados). */
function leerPersonalizados() {
  estado.propio = leerPropio(Services.prefs.getStringPref(PREF_PROPIO, ""));
  estado.guardados = leerGuardados(Services.prefs.getStringPref(PREF_GUARDADOS, "[]"));
}

/**
 * Pone en la raíz de un documento lo que necesita el personalizado: sus colores (siempre que haya uno, también para la
 * muestra del «+») y, si es el elegido y tiene dos, el atributo del degradado. Lo usan este módulo (interfaz) y
 * paginas/personalizar.sys.mjs (páginas de contenido); valida otra vez lo que recibe.
 *
 * @param {Element} raiz
 * @param {string} modo
 * @param {{c: string, c2?: string}|null} propio
 */
export function pintarPropio(raiz, modo, propio) {
  const valido = validarAcento(propio);
  if (valido) {
    raiz.style.setProperty("--aegis-enfasis-propio", valido.c);
    raiz.style.setProperty("--aegis-enfasis-propio-2", valido.c2 ?? valido.c);
  } else {
    raiz.style.removeProperty("--aegis-enfasis-propio");
    raiz.style.removeProperty("--aegis-enfasis-propio-2");
  }
  raiz.toggleAttribute("aegis-enfasis-degradado", modo == PROPIO && !!valido?.c2);
}

/** Un color «oklch(L C H)» como los que escribe colorDeLosPixeles (nada más: va a una propiedad CSS). */
function colorValido(texto) {
  return /^oklch\(\d(?:\.\d+)? \d(?:\.\d+)? \d{1,3}(?:\.\d+)?\)$/.test(texto ?? "") ? texto : null;
}

// ── Documentos de la interfaz ─────────────────────────────────────────────────────────────────────────────────────

/** Mismo criterio que AegisArranque.aplicarHojas: chrome:// o about: con permisos de sistema, nunca una web. */
function esDeLaInterfaz(doc) {
  const uri = doc?.documentURI ?? "";
  return (
    (uri.startsWith("chrome://") || uri.startsWith("about:")) &&
    uri != "about:blank" &&
    !!doc.defaultView &&
    !!doc.nodePrincipal?.isSystemPrincipal
  );
}

/** Pone el énfasis actual en la raíz de un documento. */
function pintar(doc) {
  const raiz = doc.documentElement;
  // Sin .style: la raíz no es un elemento HTML, XUL ni SVG (p. ej., un XML sin hoja de estilos visto como árbol).
  if (!raiz?.style) {
    return;
  }
  if (estado.modo == "monocromo") {
    raiz.removeAttribute("aegis-enfasis");
  } else {
    raiz.setAttribute("aegis-enfasis", estado.modo);
  }
  // Los colores automáticos van siempre que se sepan: también los usan sus muestras en los selectores. El de Windows
  // también aquí, aunque la interfaz vea AccentColor: las páginas de la interfaz que se cargan en una pestaña (Ajustes)
  // no ven el color de sistema sino un azul fijo.
  for (const [variable, valor] of [
    ["--aegis-enfasis-windows", estado.windows],
    ["--aegis-enfasis-fondo", estado.fondo],
  ]) {
    if (valor) {
      raiz.style.setProperty(variable, valor);
    } else {
      raiz.style.removeProperty(variable);
    }
  }
  pintarPropio(raiz, estado.modo, estado.propio);
}

function marcar(doc) {
  if (!esDeLaInterfaz(doc)) {
    return;
  }
  pintar(doc);
  if (!marcados.has(doc)) {
    marcados.add(doc);
    documentos.add(new WeakRef(doc));
  }
}

function pintarTodos() {
  for (const ref of documentos) {
    const doc = ref.deref();
    if (!doc?.defaultView || doc.defaultView.closed) {
      documentos.delete(ref);
      continue;
    }
    pintar(doc);
  }
}

/** Publica el estado para las páginas de contenido (nueva pestaña, navegación privada…). */
function publicar() {
  // sharedData llega a todos los procesos, también a los de las webs: del personalizado, solo sus colores (los pinta
  // cualquier página propia). El nombre y «Mis énfasis» van por mensaje solo al proceso de las páginas privilegiadas
  // (enviarPersonales).
  const datos = {
    modo: estado.modo,
    fondo: estado.fondo,
    windows: estado.windows,
    propio: estado.propio ? { c: estado.propio.c, ...(estado.propio.c2 ? { c2: estado.propio.c2 } : {}) } : null,
  };
  const sd = Services.ppmm.sharedData;
  const antes = sd.get(CLAVE_COMPARTIDA);
  if (antes && JSON.stringify(antes) == JSON.stringify(datos)) {
    return;
  }
  sd.set(CLAVE_COMPARTIDA, datos);
  sd.flush();
}

// ── Windows ───────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * El énfasis de Windows tal como lo ve la ventana del navegador (AccentColor). Las páginas de contenido y las de la
 * interfaz que se cargan en una pestaña (Ajustes) solo verían un azul fijo, así que reciben este valor; tokens.css
 * usa AccentColor solo hasta tenerlo.
 *
 * @param {Window} [win] una ventana del navegador
 */
function leerWindows(win) {
  win ??= lazy.BrowserWindowTracker.getTopWindow({ allowPopups: true });
  if (!win?.InspectorUtils) {
    return;
  }
  try {
    const c = win.InspectorUtils.colorToRGBA("AccentColor");
    if (c) {
      estado.windows = `rgb(${c.r} ${c.g} ${c.b})`;
    }
  } catch (e) {
    console.error("Aegis: énfasis de Windows", e);
  }
}

// ── Fondo de escritorio ───────────────────────────────────────────────────────────────────────────────────────────

function leerRegistro(ruta, valor) {
  const clave = Cc["@mozilla.org/windows-registry-key;1"].createInstance(Ci.nsIWindowsRegKey);
  try {
    clave.open(Ci.nsIWindowsRegKey.ROOT_KEY_CURRENT_USER, ruta, Ci.nsIWindowsRegKey.ACCESS_READ);
  } catch {
    return null;
  }
  try {
    return clave.hasValue(valor) ? clave.readStringValue(valor) : null;
  } catch {
    return null;
  } finally {
    clave.close();
  }
}

/**
 * De dónde sale el fondo: una imagen ({archivo}) o un color liso ({liso: [r, g, b]}). null si no se sabe (otro
 * sistema, o sin acceso).
 */
function fuenteDelFondo() {
  if (Services.appinfo.OS != "WINNT") {
    return null;
  }
  const ruta = leerRegistro("Control Panel\\Desktop", "WallPaper");
  // Con un color liso, Windows deja WallPaper vacío (la copia de TranscodedWallpaper puede ser de un fondo anterior).
  if (ruta === "") {
    const liso = /^(\d{1,3}) (\d{1,3}) (\d{1,3})$/.exec(leerRegistro("Control Panel\\Colors", "Background") ?? "");
    return liso ? { liso: liso.slice(1).map(Number) } : null;
  }
  const candidatos = [];
  if (ruta) {
    try {
      const f = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
      f.initWithPath(ruta);
      candidatos.push(f);
    } catch {}
  }
  // Presentación, Windows destacado o un archivo que ya no existe: la copia que Windows guarda del fondo actual.
  const copia = Services.dirsvc.get("AppData", Ci.nsIFile);
  for (const parte of ["Microsoft", "Windows", "Themes", "TranscodedWallpaper"]) {
    copia.append(parte);
  }
  candidatos.push(copia);
  for (const f of candidatos) {
    try {
      if (f.exists() && f.isFile() && f.fileSize > 0) {
        return { archivo: f };
      }
    } catch {}
  }
  return null;
}

/** Huella corta (FNV-1a de 32 bits) de la fuente del fondo: ruta, tamaño y fecha. La ruta no se guarda. */
function huella(fuente) {
  const texto = fuente.liso
    ? `liso|${fuente.liso.join(" ")}`
    : `${fuente.archivo.path}|${fuente.archivo.fileSize}|${fuente.archivo.lastModifiedTime}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

/**
 * Color agradable de un conjunto de píxeles: el tono que más pesa (24 cajas de 15°, cada píxel con peso de su croma,
 * sin los casi grises, casi negros o casi blancos), con el croma medio de ese tono limitado a 0,10. Si el fondo es casi
 * neutro, el croma baja en proporción (un fondo gris da un énfasis gris). La luminosidad la pone tokens.css.
 *
 * @param {Iterable<number[]>} pixeles [r, g, b] de 0 a 255
 * @returns {string} oklch(…)
 */
export function colorDeLosPixeles(pixeles) {
  const CAJAS = 24;
  const peso = new Float64Array(CAJAS);
  const sumaA = new Float64Array(CAJAS);
  const sumaB = new Float64Array(CAJAS);
  const sumaC = new Float64Array(CAJAS);
  let total = 0;
  let coloridos = 0;
  for (const [r, g, b] of pixeles) {
    total++;
    const [L, a, bb] = oklab(r, g, b);
    const C = Math.hypot(a, bb);
    if (C < 0.03 || L < 0.12 || L > 0.96) {
      continue;
    }
    coloridos++;
    const i = Math.floor((((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360) / (360 / CAJAS)) % CAJAS;
    peso[i] += C;
    sumaA[i] += a * C;
    sumaB[i] += bb * C;
    sumaC[i] += C * C;
  }
  if (!total || !coloridos) {
    return "oklch(0.76 0 0)";
  }
  let mejor = 0;
  let mejorPeso = -1;
  for (let i = 0; i < CAJAS; i++) {
    const p = peso[i] + 0.5 * (peso[(i + CAJAS - 1) % CAJAS] + peso[(i + 1) % CAJAS]);
    if (p > mejorPeso) {
      mejorPeso = p;
      mejor = i;
    }
  }
  let w = 0;
  let a = 0;
  let b = 0;
  let c = 0;
  for (const i of [(mejor + CAJAS - 1) % CAJAS, mejor, (mejor + 1) % CAJAS]) {
    w += peso[i];
    a += sumaA[i];
    b += sumaB[i];
    c += sumaC[i];
  }
  const tono = ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;
  // Un fondo con poco color (menos de una cuarta parte de píxeles con color) da un tinte proporcionalmente suave.
  const croma = Math.min(c / w, 0.1) * Math.min(1, coloridos / total / 0.25);
  return `oklch(0.76 ${croma.toFixed(3)} ${tono.toFixed(1)})`;
}

/**
 * Decodifica la imagen del fondo a 32 × 32 (en memoria, en este proceso) y devuelve sus píxeles. Lee un archivo
 * local: ninguna conexión.
 *
 * @param {nsIFile} archivo
 * @returns {Promise<number[][]>}
 */
async function pixelesDe(archivo) {
  const bytes = await IOUtils.read(archivo.path, { maxBytes: 64 * 1024 * 1024 });
  const tipo = tipoDeImagen(bytes);
  if (!tipo) {
    throw new Error("el fondo no es una imagen conocida");
  }
  const herramientas = Cc["@mozilla.org/image/tools;1"].getService(Ci.imgITools);
  const imagen = herramientas.decodeImageFromArrayBuffer(bytes.buffer, tipo);
  // BMP de 24 bits: cabecera, y filas de abajo arriba en BGR, cada una alineada a 4 bytes.
  const flujo = herramientas.encodeScaledImage(imagen, "image/bmp", 32, 32, "");
  const bmp = new Uint8Array(flujo.available());
  const binario = Cc["@mozilla.org/binaryinputstream;1"].createInstance(Ci.nsIBinaryInputStream);
  binario.setInputStream(flujo);
  binario.readArrayBuffer(bmp.length, bmp.buffer);
  flujo.close();
  const vista = new DataView(bmp.buffer);
  const inicio = vista.getUint32(10, true);
  const ancho = vista.getInt32(18, true);
  const alto = Math.abs(vista.getInt32(22, true));
  const bytesPorPixel = vista.getUint16(28, true) / 8;
  const fila = Math.ceil((ancho * bytesPorPixel) / 4) * 4;
  const pixeles = [];
  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      const i = inicio + y * fila + x * bytesPorPixel;
      pixeles.push([bmp[i + 2], bmp[i + 1], bmp[i]]);
    }
  }
  return pixeles;
}

/** Tipo de una imagen por sus primeros bytes (el archivo del fondo de Windows no tiene extensión). */
export function tipoDeImagen(bytes) {
  const empieza = (...firma) => firma.every((v, i) => v === null || bytes[i] === v);
  if (empieza(0xff, 0xd8, 0xff)) {
    return "image/jpeg";
  }
  if (empieza(0x89, 0x50, 0x4e, 0x47)) {
    return "image/png";
  }
  if (empieza(0x52, 0x49, 0x46, 0x46, null, null, null, null, 0x57, 0x45, 0x42, 0x50)) {
    return "image/webp";
  }
  if (empieza(0x47, 0x49, 0x46, 0x38)) {
    return "image/gif";
  }
  if (empieza(0x42, 0x4d)) {
    return "image/bmp";
  }
  if (empieza(null, null, null, null, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66)) {
    return "image/avif";
  }
  return null;
}

/**
 * Comprueba el fondo de escritorio y, solo si ha cambiado desde el último cálculo (huella), saca su color, lo guarda y
 * lo pinta. Barato cuando no ha cambiado: una lectura del registro y la fecha de un archivo.
 *
 * @returns {Promise<void>}
 */
function comprobarFondo() {
  calculando ??= (async () => {
    const fuente = fuenteDelFondo();
    if (!fuente) {
      return;
    }
    const firma = huella(fuente);
    if (estado.fondo && firma == Services.prefs.getStringPref(PREF_FONDO_HUELLA, "")) {
      return;
    }
    const color = fuente.liso ? colorDeLosPixeles([fuente.liso]) : colorDeLosPixeles(await pixelesDe(fuente.archivo));
    Services.prefs.setStringPref(PREF_FONDO_COLOR, color);
    Services.prefs.setStringPref(PREF_FONDO_HUELLA, firma);
    if (color != estado.fondo) {
      estado.fondo = color;
      pintarTodos();
      publicar();
    }
  })()
    .catch(e => console.error("Aegis: color del fondo de escritorio", e))
    .finally(() => {
      calculando = null;
    });
  return calculando;
}

// ── Cambios ───────────────────────────────────────────────────────────────────────────────────────────────────────

/** Lo último que se envió con enviarPersonales (JSON), para no repetirlo. */
let personalesEnviados = null;

/**
 * El personalizado con su nombre y los guardados, solo a los procesos de las páginas privilegiadas (la nueva pestaña),
 * nunca a los de las webs: a uno que los pide o, si han cambiado, a todos. Las prefs no tienen valor de serie, así que
 * Gecko tampoco copia su valor a los procesos de las webs ni a los precargados (Preferences.cpp,
 * ShouldSanitizePreference; los demás procesos sí lo reciben, como cualquier pref).
 *
 * @param {nsIMessageSender} [destino]
 */
function enviarPersonales(destino) {
  const datos = { propio: estado.propio, guardados: estado.guardados };
  const json = JSON.stringify(datos);
  if (destino) {
    destino.sendAsyncMessage(MENSAJE_PROPIO, datos);
    return;
  }
  if (json == personalesEnviados) {
    return;
  }
  personalesEnviados = json;
  for (let i = 0; i < Services.ppmm.childCount; i++) {
    const proceso = Services.ppmm.getChildAt(i);
    if (proceso.remoteType == "privilegedabout") {
      proceso.sendAsyncMessage(MENSAJE_PROPIO, datos);
    }
  }
}

function alCambiarPref() {
  leerPersonalizados();
  estado.modo = leerModo();
  pintarTodos();
  publicar();
  enviarPersonales();
  if (estado.modo == "fondo") {
    comprobarFondo();
  }
}

/** Windows cambió colores o tema: el énfasis de Windows (las páginas de contenido) y, con «fondo», el fondo. */
function alCambiarElSistema() {
  const antes = estado.windows;
  leerWindows();
  if (estado.windows != antes) {
    pintarTodos();
    publicar();
  }
  if (estado.modo == "fondo") {
    comprobarFondo();
  }
}

// ── Énfasis personalizado ─────────────────────────────────────────────────────────────────────────────────────────

/**
 * Usa un énfasis personalizado (lo valida antes: también llega de las páginas de contenido).
 *
 * @returns {boolean} si era válido
 */
function usarPropio(dato) {
  const acento = validarAcento(dato);
  if (!acento) {
    return false;
  }
  Services.prefs.setStringPref(PREF_PROPIO, JSON.stringify(acento));
  Services.prefs.setStringPref(PREF, PROPIO);
  return true;
}

/**
 * Guarda un énfasis en «Mis énfasis».
 *
 * @returns {"nuevo"|"actualizado"|"lleno"|"invalido"}
 */
function guardarPropio(dato) {
  leerPersonalizados();
  const { lista, resultado } = guardarEn(estado.guardados, dato);
  if (resultado == "nuevo" || resultado == "actualizado") {
    Services.prefs.setStringPref(PREF_GUARDADOS, JSON.stringify(lista));
  }
  return resultado;
}

/** Borra un énfasis de «Mis énfasis» por su clave (sus colores). Si es el que está en uso, sigue en uso. */
function borrarPropio(laClave) {
  if (typeof laClave != "string") {
    return;
  }
  leerPersonalizados();
  const lista = borrarDe(estado.guardados, laClave);
  if (lista.length != estado.guardados.length) {
    Services.prefs.setStringPref(PREF_GUARDADOS, JSON.stringify(lista));
  }
}

// ── Mensajes de las páginas propias ───────────────────────────────────────────────────────────────────────────────

/**
 * Prefs que pueden cambiar las páginas propias (Personalizar de la nueva pestaña), con su comprobación. Un proceso
 * de contenido no puede escribir prefs: se las pide al principal, y solo estas, solo con valores válidos y solo desde
 * el proceso de las páginas privilegiadas.
 */
const PREFS_DE_PAGINAS = {
  // «propio» no: se elige con su mensaje (propio-usar), que trae los colores.
  [PREF]: v => ENFASIS.includes(v),
  "aegis.nuevapestana.fondo": v => ["liso", "degradado", "enfasis", "imagen"].includes(v),
  "aegis.nuevapestana.posicion": v => ["centro", "arriba"].includes(v),
  "aegis.nuevapestana.accesos": v => ["arriba", "abajo"].includes(v),
  "aegis.nuevapestana.espaciado": v =>
    Number.isInteger(v) && v >= ESPACIADO.minimo && v <= ESPACIADO.maximo && v % ESPACIADO.paso == 0,
  "aegis.nuevapestana.ancho": v => Number.isInteger(v) && v >= ANCHO.minimo && v <= ANCHO.maximo && v % ANCHO.paso == 0,
  "browser.newtabpage.activity-stream.showSearch": v => typeof v == "boolean",
};

/** Imagen propia de la nueva pestaña: un archivo del perfil, sin extensión (el tipo va en su pref). */
const ARCHIVO_IMAGEN = "aegis-nueva-pestana-fondo";
const PREF_IMAGEN_TIPO = "aegis.nuevapestana.imagen.tipo";
const MAXIMO_IMAGEN = 20 * 1024 * 1024;
/** @type {Blob|null} */
let imagen = null;

function rutaImagen() {
  return PathUtils.join(PathUtils.profileDir, ARCHIVO_IMAGEN);
}

/** Envía la imagen propia a los procesos de las páginas privilegiadas (solo a esos: las webs no la reciben). */
function enviarImagen(destino) {
  const datos = { imagen };
  if (destino) {
    destino.sendAsyncMessage(MENSAJE_IMAGEN, datos);
    return;
  }
  for (let i = 0; i < Services.ppmm.childCount; i++) {
    const proceso = Services.ppmm.getChildAt(i);
    if (proceso.remoteType == "privilegedabout") {
      proceso.sendAsyncMessage(MENSAJE_IMAGEN, datos);
    }
  }
}

async function leerImagen() {
  if (imagen) {
    return;
  }
  const tipo = Services.prefs.getStringPref(PREF_IMAGEN_TIPO, "");
  if (!tipo || !(await IOUtils.exists(rutaImagen()))) {
    return;
  }
  imagen = new Blob([await IOUtils.read(rutaImagen(), { maxBytes: MAXIMO_IMAGEN })], { type: tipo });
}

async function guardarImagen(blob) {
  if (!Blob.isInstance(blob) || blob.size > MAXIMO_IMAGEN) {
    throw new Error("imagen no válida");
  }
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const tipo = tipoDeImagen(bytes);
  if (!tipo) {
    throw new Error("no es una imagen");
  }
  await IOUtils.write(rutaImagen(), bytes);
  Services.prefs.setStringPref(PREF_IMAGEN_TIPO, tipo);
  imagen = new Blob([bytes], { type: tipo });
  Services.prefs.setStringPref("aegis.nuevapestana.fondo", "imagen");
  enviarImagen();
}

function recibir(mensaje) {
  const proceso = mensaje.target;
  // Solo el proceso de las páginas privilegiadas (about:newtab, about:home…), nunca el de una web.
  if (proceso?.remoteType != "privilegedabout") {
    return;
  }
  const datos = mensaje.data ?? {};
  switch (datos.tipo) {
    case "pref": {
      const valido = Object.hasOwn(PREFS_DE_PAGINAS, datos.nombre) && PREFS_DE_PAGINAS[datos.nombre](datos.valor);
      if (!valido) {
        return;
      }
      const v = datos.valor;
      if (typeof v == "boolean") {
        Services.prefs.setBoolPref(datos.nombre, v);
      } else if (typeof v == "number") {
        Services.prefs.setIntPref(datos.nombre, v);
      } else {
        Services.prefs.setStringPref(datos.nombre, v);
      }
      break;
    }
    // El selector del énfasis personalizado de la nueva pestaña (usarPropio y guardarPropio validan los datos).
    case "propio-usar":
      usarPropio(datos.acento);
      break;
    case "propio-guardar":
      guardarPropio(datos.acento);
      break;
    case "propio-borrar":
      borrarPropio(datos.clave);
      break;
    case "fondo-escritorio":
      // Una muestra de «Fondo de escritorio» se ha abierto: que tenga su color aunque no sea el énfasis elegido.
      comprobarFondo();
      break;
    // «Personalizar» se ha abierto: el nombre del personalizado y «Mis énfasis».
    case "pedir-propio":
      leerPersonalizados();
      enviarPersonales(proceso);
      break;
    case "pedir-imagen":
      leerImagen()
        .then(() => imagen && enviarImagen(proceso))
        .catch(e => console.error("Aegis: imagen de la nueva pestaña", e));
      break;
    case "imagen":
      guardarImagen(datos.imagen).catch(e => {
        console.error("Aegis: imagen de la nueva pestaña", e);
        proceso.sendAsyncMessage(MENSAJE_IMAGEN, { error: true });
      });
      break;
  }
}

export const AegisEnfasis = {
  ENFASIS,
  PREF,
  PROPIO,

  /** El énfasis elegido (de la pref: vale también dentro de otro observador de la pref). */
  actual() {
    return leerModo();
  },

  /** El personalizado en uso y los guardados, recién leídos de sus prefs. */
  personalizados() {
    leerPersonalizados();
    return { propio: estado.propio, guardados: estado.guardados };
  },

  /** Usa un énfasis personalizado ({c, c2?, n?}). */
  usarPropio(acento) {
    return usarPropio(acento);
  },

  /** Lo guarda en «Mis énfasis»: «nuevo», «actualizado», «lleno» o «invalido». */
  guardarPropio(acento) {
    return guardarPropio(acento);
  },

  /** Lo borra de «Mis énfasis» por su clave (enfasis-propio.sys.mjs, clave()). */
  borrarPropio(laClave) {
    borrarPropio(laClave);
  },

  /** Que la muestra «Fondo de escritorio» de un selector tenga su color (calcula solo si ha cambiado). */
  comprobarFondo() {
    return comprobarFondo();
  },

  /** Una vez por arranque del navegador. */
  inicio() {
    if (iniciado) {
      return;
    }
    iniciado = true;
    leerPersonalizados();
    estado.modo = leerModo();
    estado.fondo = colorValido(Services.prefs.getStringPref(PREF_FONDO_COLOR, ""));
    publicar();
    Services.obs.addObserver(doc => marcar(doc), "document-element-inserted");
    Services.prefs.addObserver(PREF, alCambiarPref);
    Services.obs.addObserver(alCambiarElSistema, "look-and-feel-changed");
    Services.ppmm.addMessageListener(MENSAJE, recibir);
    if (estado.modo == "fondo") {
      comprobarFondo();
    }
  },

  /**
   * Cada ventana del navegador, cuando termina de abrirse: la marca (por si se abrió antes que el observador) y, al
   * volver a primer plano, comprueba el fondo de escritorio si es el énfasis elegido.
   *
   * @param {Window} win
   */
  ventana(win) {
    if (!win?.document) {
      return;
    }
    if (!estado.windows) {
      leerWindows(win);
      pintarTodos();
      publicar();
    }
    marcar(win.document);
    win.addEventListener("activate", () => {
      if (estado.modo == "fondo") {
        comprobarFondo();
      }
    });
  },
};
