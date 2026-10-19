/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · énfasis personalizado (docs/DISENO.md §2, «Énfasis»): las cuentas, sin nada de Gecko (se prueban con node,
 * tools/pruebas/enfasis-propio.mjs).
 * - Colores: hexadecimal (#rrggbb), RGB, HSV (el cuadro y la barra de tono del selector) y OKLab/OKLCH (la fórmula de
 *   tokens.css, que fija la luminosidad en una banda y limita el croma: así el contraste está garantizado).
 * - Contraste WCAG entre dos colores.
 * - El énfasis personalizado: {c: "#rrggbb", c2?: "#rrggbb", n?: "nombre"}. c es el color de todo; c2, si lo hay, el
 *   segundo color del degradado (marco, filo de la pestaña activa y el fondo «Énfasis» de la nueva pestaña).
 * - La lista de guardados (pref aegis.enfasis.guardados, JSON): validada, sin repetidos y con un máximo.
 *
 * Todo lo que llega de una pref o de otro proceso pasa por validarAcento: lo que sale de aquí son solo colores
 * #rrggbb y un nombre corto sin caracteres de control, que se pinta siempre como texto (textContent).
 */

/** Cuántos énfasis se pueden guardar en «Mis énfasis». */
export const MAXIMO_GUARDADOS = 24;
/** Largo máximo del nombre, en caracteres (lo que cabe en una línea del selector). */
export const MAXIMO_NOMBRE = 24;

/**
 * Las bandas de la fórmula de tokens.css («Énfasis de color»): la luminosidad (OKLCH) se fija entre mínimo y máximo y
 * el croma se limita. Si cambian allí, cambian aquí (las pruebas comparan las dos).
 */
export const BANDAS = {
  oscuro: { minimo: 0.72, maximo: 0.8, croma: 0.11 },
  claro: { minimo: 0.4, maximo: 0.48, croma: 0.1 },
};
/** Lo que va encima del énfasis en cada esquema (--aegis-on-accent). */
export const SOBRE_ENFASIS = { oscuro: "#0b0b0c", claro: "#ffffff" };

// ── Hexadecimal, RGB y HSV ────────────────────────────────────────────────────────────────────────────────────────

/**
 * Un color escrito por el usuario («#88C0DC», «88c0dc», «#8cd») en la forma de siempre, «#rrggbb», o null.
 *
 * @param {*} texto
 * @returns {string|null}
 */
export function normalizarHex(texto) {
  if (typeof texto != "string") {
    return null;
  }
  const m = /^\s*#?([0-9a-f]{3}|[0-9a-f]{6})\s*$/i.exec(texto);
  if (!m) {
    return null;
  }
  let h = m[1].toLowerCase();
  if (h.length == 3) {
    h = [...h].map(c => c + c).join("");
  }
  return "#" + h;
}

/** «#rrggbb» a [r, g, b] de 0 a 255, o null. */
export function hexARgb(hex) {
  const n = normalizarHex(hex);
  return n ? [1, 3, 5].map(i => parseInt(n.slice(i, i + 2), 16)) : null;
}

/** [r, g, b] (0–255, se redondea y se recorta) a «#rrggbb». */
export function rgbAHex([r, g, b]) {
  return (
    "#" +
    [r, g, b]
      .map(v =>
        Math.round(Math.min(255, Math.max(0, v)))
          .toString(16)
          .padStart(2, "0")
      )
      .join("")
  );
}

/**
 * HSV a RGB.
 *
 * @param {number} h tono, 0–360
 * @param {number} s saturación, 0–1
 * @param {number} v brillo, 0–1
 * @returns {number[]} [r, g, b] de 0 a 255
 */
export function hsvARgb(h, s, v) {
  h = ((h % 360) + 360) % 360;
  const f = n => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return [f(5), f(3), f(1)].map(x => Math.round(x * 255));
}

/**
 * RGB a HSV. Un gris (o el negro) no tiene tono: se queda el que se diga, para que el cuadro del selector no salte al
 * rojo al escribir un gris.
 *
 * @param {number[]} rgb [r, g, b] de 0 a 255
 * @param {number} [tonoPrevio]
 * @returns {{h: number, s: number, v: number}}
 */
export function rgbAHsv([r, g, b], tonoPrevio = 0) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  let h = tonoPrevio;
  if (d > 0) {
    if (max == r) {
      h = 60 * (((g - b) / d) % 6);
    } else if (max == g) {
      h = 60 * ((b - r) / d + 2);
    } else {
      h = 60 * ((r - g) / d + 4);
    }
    h = (h + 360) % 360;
  }
  return { h, s: max == 0 ? 0 : d / max, v: max };
}

// ── OKLab y la fórmula de tokens.css ──────────────────────────────────────────────────────────────────────────────

const aLineal = v => {
  v /= 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const deLineal = v => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055) * 255;

/** sRGB (0–255) a OKLab [L, a, b]. */
export function oklab(r, g, b) {
  const [R, G, B] = [aLineal(r), aLineal(g), aLineal(b)];
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/**
 * OKLab a sRGB (0–255, sin redondear ni recortar: fuera de la gama sale de 0–255).
 *
 * @returns {number[]}
 */
export function rgbDeOklab(L, a, b) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map(deLineal);
}

/** sRGB (0–255) a OKLCH [L, C, h°]. */
export function oklch(r, g, b) {
  const [L, a, bb] = oklab(r, g, b);
  return [L, Math.hypot(a, bb), ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360];
}

/** OKLCH a sRGB (0–255, sin recortar). */
export function rgbDeOklch(L, C, h) {
  const rad = (h * Math.PI) / 180;
  return rgbDeOklab(L, C * Math.cos(rad), C * Math.sin(rad));
}

/**
 * El énfasis que sale de un color con la fórmula de tokens.css en un esquema: la luminosidad en su banda y el croma
 * limitado. Lo que queda fuera de la gama sRGB se recorta por canal.
 *
 * @param {string} hex
 * @param {"oscuro"|"claro"} esquema
 * @returns {string} «#rrggbb»
 */
export function enfasisAplicado(hex, esquema) {
  const rgb = hexARgb(hex);
  if (!rgb) {
    return null;
  }
  const banda = BANDAS[esquema];
  const [L, C, h] = oklch(...rgb);
  return rgbAHex(rgbDeOklch(Math.min(banda.maximo, Math.max(banda.minimo, L)), Math.min(C, banda.croma), h));
}

// ── Contraste ─────────────────────────────────────────────────────────────────────────────────────────────────────

/** Luminancia relativa WCAG de un color «#rrggbb» o [r, g, b]. */
export function luminancia(color) {
  const [r, g, b] = (typeof color == "string" ? hexARgb(color) : color).map(aLineal);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contraste WCAG (1–21) entre dos colores. */
export function contraste(a, b) {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** El texto (casi negro o blanco) que más contraste da sobre un color. */
export function textoSobre(hex) {
  const negro = SOBRE_ENFASIS.oscuro;
  const blanco = SOBRE_ENFASIS.claro;
  return contraste(hex, negro) >= contraste(hex, blanco) ? negro : blanco;
}

// ── El énfasis personalizado y la lista de guardados ──────────────────────────────────────────────────────────────

/**
 * Un nombre escrito por el usuario, limpio: sin caracteres de control, de dirección del texto ni separadores de línea,
 * sin sustitutos sueltos (en JSON ocuparían 6 bytes cada uno: así la pref de guardados no pasa de 4 KB), sin espacios
 * de más y
 * de MAXIMO_NOMBRE caracteres como mucho. Vacío si no hay nombre.
 *
 * @param {*} texto
 * @returns {string}
 */
export function limpiarNombre(texto) {
  if (typeof texto != "string") {
    return "";
  }
  const limpio = texto
    .replace(/[\p{Cc}\p{Cs}\p{Zl}\p{Zp}\p{Bidi_Control}]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  return [...limpio].slice(0, MAXIMO_NOMBRE).join("").trim();
}

/**
 * Un énfasis personalizado válido ({c, c2?, n?}) o null. c2 igual a c no es un degradado: se quita.
 *
 * @param {*} dato
 * @returns {{c: string, c2?: string, n?: string}|null}
 */
export function validarAcento(dato) {
  if (!dato || typeof dato != "object" || Array.isArray(dato)) {
    return null;
  }
  const c = normalizarHex(dato.c);
  if (!c) {
    return null;
  }
  const acento = { c };
  if (dato.c2 !== undefined && dato.c2 !== null && dato.c2 !== "") {
    const c2 = normalizarHex(dato.c2);
    if (!c2) {
      return null;
    }
    if (c2 != c) {
      acento.c2 = c2;
    }
  }
  const n = limpiarNombre(dato.n);
  if (n) {
    acento.n = n;
  }
  return acento;
}

/** Lo que identifica a un énfasis guardado: sus colores (el nombre puede cambiar). */
export function clave(acento) {
  return acento.c + (acento.c2 ? ">" + acento.c2 : "");
}

/** El JSON de una pref, o undefined si no se puede leer. */
function json(texto) {
  if (typeof texto != "string" || !texto || texto.length > 16 * 1024) {
    return undefined;
  }
  try {
    return JSON.parse(texto);
  } catch {
    return undefined;
  }
}

/**
 * El énfasis personalizado en uso (pref aegis.enfasis.propio), o null.
 *
 * @param {string} texto JSON
 */
export function leerPropio(texto) {
  return validarAcento(json(texto));
}

/**
 * La lista de guardados (pref aegis.enfasis.guardados): solo los válidos, sin repetidos (manda el primero) y como
 * mucho MAXIMO_GUARDADOS.
 *
 * @param {string} texto JSON
 * @returns {Array<{c: string, c2?: string, n?: string}>}
 */
export function leerGuardados(texto) {
  const datos = json(texto);
  if (!Array.isArray(datos)) {
    return [];
  }
  const vistos = new Set();
  const lista = [];
  for (const dato of datos) {
    const acento = validarAcento(dato);
    if (!acento || vistos.has(clave(acento))) {
      continue;
    }
    vistos.add(clave(acento));
    lista.push(acento);
    if (lista.length == MAXIMO_GUARDADOS) {
      break;
    }
  }
  return lista;
}

/**
 * Guarda un énfasis en la lista. Si ya estaba (mismos colores), cambia su nombre si trae uno y se queda en su sitio.
 *
 * @param {Array} lista la de leerGuardados
 * @param {*} dato
 * @returns {{lista: Array, resultado: "nuevo"|"actualizado"|"lleno"|"invalido"}}
 */
export function guardarEn(lista, dato) {
  const acento = validarAcento(dato);
  if (!acento) {
    return { lista, resultado: "invalido" };
  }
  const i = lista.findIndex(a => clave(a) == clave(acento));
  if (i >= 0) {
    const nueva = [...lista];
    nueva[i] = acento.n ? acento : { ...acento, ...(lista[i].n ? { n: lista[i].n } : {}) };
    return { lista: nueva, resultado: "actualizado" };
  }
  if (lista.length >= MAXIMO_GUARDADOS) {
    return { lista, resultado: "lleno" };
  }
  return { lista: [...lista, acento], resultado: "nuevo" };
}

/**
 * Quita de la lista el énfasis con esa clave.
 *
 * @returns {Array}
 */
export function borrarDe(lista, laClave) {
  return lista.filter(a => clave(a) != laClave);
}
