/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * La forma de leer los archivos .config y de comparar direcciones (patronARegExp) sigue a Dark Reader
 * (src/utils/url.ts y src/generators/utils/parse.ts, MIT, Copyright (c) Dark Reader Ltd.; ver NOTICE.md). */

/**
 * Aegis · webs en oscuro: los arreglos por sitio de Dark Reader, en el proceso principal. Se leen de los archivos que
 * van dentro del navegador (copias de la misma versión que darkreader.js, ver NOTICE.md), nunca de la red, y solo la
 * primera vez que una web los pide con la función encendida; después quedan en memoria.
 *
 * - dynamic-theme-fixes.config: por sitio, selectores que invertir (logotipos con texto negro…), CSS extra y lo que no
 *   hay que analizar. El bloque «*» vale para todos; se junta con el del sitio más concreto (como Dark Reader).
 * - detector-hints.config: cómo saber si un sitio tiene su modo oscuro puesto (un selector en la raíz) o si no tiene.
 * - dark-sites.config: sitios que ya son oscuros de por sí.
 * Las dos últimas solo cuentan en «sin_modo_oscuro».
 */

const BASE = new URL("./", import.meta.url).href;
const SEPARADOR = /^\s*={2,}\s*$/;
const ORDENES_ARREGLOS = new Map([
  ["INVERT", "invert"],
  ["CSS", "css"],
  ["IGNORE INLINE STYLE", "ignoreInlineStyle"],
  ["IGNORE IMAGE ANALYSIS", "ignoreImageAnalysis"],
  ["IGNORE CSS URL", "ignoreCSSUrl"],
  ["DISABLE STYLESHEETS PROXY", "disableStyleSheetsProxy"],
  ["DISABLE CUSTOM ELEMENT REGISTRY PROXY", "disableCustomElementRegistryProxy"],
]);
const ORDENES_PISTAS = new Map([
  ["TARGET", "target"],
  ["MATCH", "match"],
  ["NO DARK THEME", "noDarkTheme"],
  ["SYSTEM THEME", "systemTheme"],
  ["IFRAME", "iframe"],
]);

/**
 * Dirección comparable con un patrón de Dark Reader: «ejemplo.com» vale también para sus subdominios; «*.» es un
 * nivel cualquiera; con «/» se compara también la ruta; «^» y «$», principio y final exactos.
 *
 * @param {string} patron
 */
function patronARegExp(patron) {
  patron = patron.trim();
  const principio = patron.startsWith("^");
  const fin = patron.endsWith("$");
  patron = patron
    .replace(/^\^/, "")
    .replace(/\$$/, "")
    .replace(/^.*?\/{2,3}/, "")
    .replace(/\?.*$/, "")
    .replace(/\/$/, "");
  const barra = patron.indexOf("/");
  const anfitrion = (barra >= 0 ? patron.slice(0, barra) : patron).replace(/\$/g, "");
  const ruta = barra >= 0 ? patron.replace(/\$/g, "").slice(barra) : "";
  const escapar = t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  let re = principio ? "^(.*?\\:\\/{2,3})?" : "^(.*?\\:\\/{2,3})?([^/]*?\\.)?";
  re += "(" + anfitrion.split(".").map(p => (p == "*" ? "[^\\.\\/]+?" : escapar(p))).join("\\.") + ")";
  if (ruta) {
    re += "(" + escapar(ruta) + ")";
  }
  re += fin ? "(\\/?(\\?[^/]*?)?)$" : "(\\/?.*?)$";
  return new RegExp(re, "i");
}

/** Clave del índice: los dos últimos niveles del anfitrión («es.wikipedia.org» → «wikipedia.org»), o null. */
function clave(anfitrion) {
  const partes = anfitrion.toLowerCase().split(".").filter(Boolean);
  if (partes.length < 2 || partes.slice(-2).includes("*")) {
    return null;
  }
  return partes.slice(-2).join(".");
}

/**
 * Lee un .config de Dark Reader: bloques separados por «====», cada uno con sus direcciones y luego órdenes en
 * mayúsculas seguidas de sus valores.
 *
 * @param {string} texto
 * @param {Map<string, string>} ordenes
 * @returns {{urls: string[], valores: Record<string, string[]>}[]}
 */
function leerConfig(texto, ordenes) {
  const bloques = [];
  let actual = null;
  let orden = null;
  for (const linea of texto.split("\n")) {
    if (SEPARADOR.test(linea)) {
      actual = null;
      continue;
    }
    if (!actual) {
      if (!linea.trim()) {
        continue;
      }
      actual = { urls: [], valores: {} };
      orden = null;
      bloques.push(actual);
    }
    const limpia = linea.trim();
    if (ordenes.has(limpia)) {
      orden = ordenes.get(limpia);
      actual.valores[orden] ??= [];
      continue;
    }
    if (!orden) {
      if (limpia) {
        actual.urls.push(limpia);
      }
    } else {
      actual.valores[orden].push(linea);
    }
  }
  return bloques;
}

/** Índice por anfitrión: {general: entradas sin clave, porClave: Map<clave, entradas>} con sus RegExp ya hechas. */
function indexar(bloques) {
  const indice = { comun: null, general: [], porClave: new Map() };
  for (const bloque of bloques) {
    if (bloque.urls.length == 1 && bloque.urls[0] == "*") {
      indice.comun = bloque;
      continue;
    }
    const entrada = { bloque, patrones: bloque.urls.map(u => [u, patronARegExp(u)]) };
    const claves = new Set(bloque.urls.map(u => clave(u.replace(/^\^/, "").replace(/^.*?\/{2,3}/, "").split("/")[0])));
    for (const c of claves) {
      if (c) {
        if (!indice.porClave.has(c)) {
          indice.porClave.set(c, []);
        }
        indice.porClave.get(c).push(entrada);
      } else {
        indice.general.push(entrada);
      }
    }
  }
  return indice;
}

/**
 * Bloque más concreto para una dirección (el patrón que coincide más largo, como Dark Reader), o null.
 *
 * @param {object} indice
 * @param {nsIURI} uri
 */
function buscar(indice, uri) {
  const url = uri.spec;
  const candidatos = [...indice.general, ...(indice.porClave.get(clave(uri.host)) ?? [])];
  let mejor = null;
  let largo = 0;
  for (const { bloque, patrones } of candidatos) {
    for (const [patron, re] of patrones) {
      if (patron.length > largo && re.test(url)) {
        mejor = bloque;
        largo = patron.length;
      }
    }
  }
  return mejor;
}

const lista = valores => (valores ?? []).map(l => l.trim()).filter(Boolean);

/** Arreglos de un bloque en el formato de DarkReader.enable(tema, arreglos). */
function arreglosDe(bloque) {
  const v = bloque?.valores ?? {};
  return {
    invert: lista(v.invert),
    css: (v.css ?? []).join("\n").trim(),
    ignoreInlineStyle: lista(v.ignoreInlineStyle),
    ignoreImageAnalysis: lista(v.ignoreImageAnalysis),
    ignoreCSSUrl: lista(v.ignoreCSSUrl),
    disableStyleSheetsProxy: "disableStyleSheetsProxy" in v,
    disableCustomElementRegistryProxy: "disableCustomElementRegistryProxy" in v,
  };
}

/** El común («*») y el del sitio, juntos (Dark Reader: combineFixes). */
function juntar(a, b) {
  return {
    invert: [...a.invert, ...b.invert],
    css: [a.css, b.css].filter(Boolean).join("\n"),
    ignoreInlineStyle: [...a.ignoreInlineStyle, ...b.ignoreInlineStyle],
    ignoreImageAnalysis: [...a.ignoreImageAnalysis, ...b.ignoreImageAnalysis],
    ignoreCSSUrl: [...a.ignoreCSSUrl, ...b.ignoreCSSUrl],
    disableStyleSheetsProxy: a.disableStyleSheetsProxy || b.disableStyleSheetsProxy,
    disableCustomElementRegistryProxy: a.disableCustomElementRegistryProxy || b.disableCustomElementRegistryProxy,
  };
}

/** @type {Promise<{arreglos: object, pistas: object, oscuros: object}>|null} */
let datos = null;

async function leer(nombre) {
  return (await fetch(BASE + nombre)).text();
}

function cargar() {
  datos ??= (async () => {
    const [arreglos, pistas, oscuros] = await Promise.all([
      leer("dynamic-theme-fixes.config"),
      leer("detector-hints.config"),
      leer("dark-sites.config"),
    ]);
    return {
      arreglos: indexar(leerConfig(arreglos, ORDENES_ARREGLOS)),
      pistas: indexar(leerConfig(pistas, ORDENES_PISTAS)),
      // Una dirección por línea: cada una, un bloque sin órdenes.
      oscuros: indexar(
        oscuros
          .split("\n")
          .map(l => l.trim())
          .filter(l => l && !l.startsWith("#"))
          .map(u => ({ urls: [u], valores: {} }))
      ),
    };
  })().catch(e => {
    datos = null; // se vuelve a intentar la próxima vez
    throw e;
  });
  return datos;
}

export const AegisWebsOscuroArreglos = {
  /**
   * Lo que el documento necesita para oscurecerse bien.
   *
   * @param {nsIURI} uri dirección del documento
   * @returns {Promise<{arreglos: object, pista: object?, oscuroDeSerie: boolean}>}
   */
  async para(uri) {
    const d = await cargar();
    const comun = arreglosDe(d.arreglos.comun);
    const sitio = buscar(d.arreglos, uri);
    const pista = buscar(d.pistas, uri)?.valores ?? null;
    return {
      arreglos: sitio ? juntar(comun, arreglosDe(sitio)) : comun,
      pista: pista && {
        target: lista(pista.target)[0] ?? null,
        match: lista(pista.match),
        noDarkTheme: "noDarkTheme" in pista,
        systemTheme: "systemTheme" in pista,
      },
      oscuroDeSerie: !!buscar(d.oscuros, uri),
    };
  },
};
