/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · Escudos: hojas de ocultar y filtros procedurales. Lo usan el padre (cosmetico.sys.mjs, la hoja genérica) y
 * el hijo (AegisEscudosChild.sys.mjs).
 *
 * Hojas: una regla por selector («selector{display:none!important}»), así un selector que el motor de estilos no
 * entienda solo tira su regla. Un selector que podría salirse de su regla («{», «}», «;», «@», un comentario, un salto
 * de línea, una «\» al final, comillas o paréntesis sin cerrar) no se usa, y cada hoja empieza con una regla vacía
 * (INICIO_HOJA), así que un «@import» nunca sería válido en ella: una lista no puede meter CSS propio (p. ej. un
 * @import o un url() que pida algo).
 *
 * Procedurales: los filtros de adblock-rust que no son CSS puro (JSON {selector: [operadores], action}), con la
 * semántica de uBlock Origin (https://github.com/gorhill/uBlock/wiki/Procedural-cosmetic-filters). Implementación
 * propia. Operadores: css-selector, has-text, matches-attr, matches-css (y -before/-after), matches-path,
 * min-text-length, upward y xpath. Acciones: ocultar (de serie), remove, style, remove-attr y remove-class. Los que
 * son CSS puro (un solo css-selector, sin acción o con style) van a la hoja y no tocan el DOM; el resto sí lo toca
 * (un estilo en línea o quitar el elemento): la web lo puede ver, como con uBlock Origin.
 */

/**
 * Primera regla de toda hoja de Escudos: una regla de estilo válida que no casa con nada. Tras ella, un @import ya no
 * es válido (CSS solo los admite al principio de la hoja).
 */
export const INICIO_HOJA = ":root:not(*){}\n";

/** ¿Se puede poner este selector en una hoja sin que se salga de su regla? */
export function selectorSeguro(s) {
  if (typeof s != "string" || !s || s.length > 4096 || /[{}\n\r]|\/\*|\*\//.test(s)) {
    return false;
  }
  let comilla = "";
  let parentesis = 0;
  let corchetes = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c == "\\") {
      if (i == s.length - 1) {
        // Una «\» al final escaparía lo que se ponga detrás.
        return false;
      }
      i++;
      continue;
    }
    if (comilla) {
      if (c == comilla) {
        comilla = "";
      }
      continue;
    }
    if (c == '"' || c == "'") {
      comilla = c;
    } else if (c == ";" || c == "@") {
      // Fuera de comillas no hacen falta en un selector y podrían cerrar o abrir una regla (@import…).
      return false;
    } else if (c == "(") {
      parentesis++;
    } else if (c == ")") {
      parentesis--;
    } else if (c == "[") {
      corchetes++;
    } else if (c == "]") {
      corchetes--;
    }
    if (parentesis < 0 || corchetes < 0) {
      return false;
    }
  }
  return !comilla && !parentesis && !corchetes;
}

/** Declaraciones de un :style() de una lista, con !important, o null si no son seguras (sin url(), @, llaves…). */
export function estiloSeguro(estilo) {
  if (typeof estilo != "string" || !estilo || estilo.length > 1024) {
    return null;
  }
  if (/[{}\\<>@]|\/\*|url\s*\(|image-set\s*\(|image\s*\(|expression|-moz-binding/i.test(estilo)) {
    return null;
  }
  // Comillas equilibradas (si no, la cadena se comería lo que viene detrás).
  if ((estilo.match(/"/g)?.length ?? 0) % 2 || (estilo.match(/'/g)?.length ?? 0) % 2) {
    return null;
  }
  const declaraciones = [];
  for (const d of estilo.split(";")) {
    const t = d.trim();
    if (!t) {
      continue;
    }
    const dos = t.indexOf(":");
    if (dos <= 0) {
      return null;
    }
    const propiedad = t.slice(0, dos).trim();
    const valor = t
      .slice(dos + 1)
      .replace(/!\s*important\s*$/i, "")
      .trim();
    if (!/^-?[a-z][a-z0-9-]*$/i.test(propiedad) || !valor) {
      return null;
    }
    declaraciones.push([propiedad, valor]);
  }
  return declaraciones.length ? declaraciones : null;
}

/** Hoja de ocultar para una lista de selectores (los que no son seguros se quedan fuera). */
export function cssDeSelectores(selectores) {
  let css = "";
  for (const s of selectores ?? []) {
    if (selectorSeguro(s)) {
      css += `${s}{display:none!important}\n`;
    }
  }
  return css;
}

/** Regla de una acción :style() sobre un selector CSS, o "" si no es segura. */
export function cssDeEstilo(selector, estilo) {
  const d = estiloSeguro(estilo);
  if (!d || !selectorSeguro(selector)) {
    return "";
  }
  return `${selector}{${d.map(([p, v]) => `${p}:${v}!important`).join(";")}}\n`;
}

/** Texto de uBlock Origin: «/expresión/banderas» o una cadena literal → función que dice si casa. */
function patron(texto) {
  const m = /^\/(.+)\/([imsu]*)$/.exec(texto ?? "");
  if (m) {
    try {
      const re = new RegExp(m[1], m[2]);
      return s => re.test(s);
    } catch {
      return () => false;
    }
  }
  const literal = String(texto ?? "");
  return s => s.includes(literal);
}

/** «nombre=valor» de matches-attr (comillas opcionales; los dos admiten /expresión/). */
function patronAtributo(arg) {
  const m = /^\s*("[^"]*"|'[^']*'|\/(?:\\\/|[^/])+\/[imsu]*|[^=\s]+)\s*(?:=\s*(.+?))?\s*$/.exec(arg ?? "");
  if (!m) {
    return null;
  }
  const quitar = s => (s && /^(["']).*\1$/.test(s) ? s.slice(1, -1) : s);
  const nombre = quitar(m[1]);
  const valor = m[2] === undefined ? null : quitar(m[2]);
  const casaNombre = nombre.startsWith("/") ? patron(nombre) : n => n == nombre;
  const casaValor = valor === null ? () => true : valor.startsWith("/") ? patron(valor) : v => v == valor;
  return { casaNombre, casaValor };
}

/** «propiedad: valor» de matches-css (valor literal exacto o /expresión/). */
function patronCss(arg) {
  const dos = (arg ?? "").indexOf(":");
  if (dos <= 0) {
    return null;
  }
  const propiedad = arg.slice(0, dos).trim();
  const valor = arg.slice(dos + 1).trim();
  const casa = valor.startsWith("/") ? patron(valor) : v => v == valor;
  return { propiedad, casa };
}

/** Un operador sobre un conjunto de elementos → el conjunto siguiente. */
function operar(op, entrada, doc, win) {
  const salida = new Set();
  const arg = op.arg;
  switch (op.type) {
    case "css-selector": {
      if (entrada === null) {
        for (const el of doc.querySelectorAll(arg)) {
          salida.add(el);
        }
        break;
      }
      const s = arg.trim();
      if (!/^[\s>+~]/.test(arg)) {
        // Sigue el mismo elemento («div:has-text(x).anuncio»): filtra.
        for (const el of entrada) {
          if (el.matches(s)) {
            salida.add(el);
          }
        }
      } else if (s.startsWith("+") || s.startsWith("~")) {
        // Hermanos: «+ x» el siguiente, «~ x» los siguientes.
        const resto = s.slice(1).trim();
        for (const el of entrada) {
          for (let h = el.nextElementSibling; h; h = h.nextElementSibling) {
            if (h.matches(resto)) {
              salida.add(h);
            }
            if (s.startsWith("+")) {
              break;
            }
          }
        }
      } else {
        // Descendientes («x» o «> x»), relativos a cada elemento.
        const relativo = `:scope ${s}`;
        for (const el of entrada) {
          for (const x of el.querySelectorAll(relativo)) {
            salida.add(x);
          }
        }
      }
      break;
    }
    case "has-text": {
      const casa = patron(arg);
      for (const el of entrada) {
        if (casa(el.textContent)) {
          salida.add(el);
        }
      }
      break;
    }
    case "min-text-length": {
      const n = parseInt(arg, 10) || 0;
      for (const el of entrada) {
        if (el.textContent.length >= n) {
          salida.add(el);
        }
      }
      break;
    }
    case "matches-attr": {
      const p = patronAtributo(arg);
      if (!p) {
        break;
      }
      for (const el of entrada) {
        for (const nombre of el.getAttributeNames()) {
          if (p.casaNombre(nombre) && p.casaValor(el.getAttribute(nombre) ?? "")) {
            salida.add(el);
            break;
          }
        }
      }
      break;
    }
    case "matches-css":
    case "matches-css-before":
    case "matches-css-after": {
      const p = patronCss(arg);
      if (!p) {
        break;
      }
      const pseudo = op.type == "matches-css" ? null : op.type == "matches-css-before" ? "::before" : "::after";
      for (const el of entrada) {
        const estilo = win.getComputedStyle(el, pseudo);
        if (estilo && p.casa(estilo.getPropertyValue(p.propiedad))) {
          salida.add(el);
        }
      }
      break;
    }
    case "matches-path": {
      const casa = patron(arg);
      const loc = doc.location;
      if (loc && casa(loc.pathname + loc.search)) {
        for (const el of entrada) {
          salida.add(el);
        }
      }
      break;
    }
    case "upward": {
      const n = /^\d+$/.test(String(arg).trim()) ? parseInt(arg, 10) : 0;
      for (const el of entrada) {
        let x = null;
        if (n > 0) {
          x = el;
          for (let i = 0; i < n && x; i++) {
            x = x.parentElement;
          }
        } else if (arg) {
          x = el.parentElement?.closest(arg) ?? null;
        }
        if (x && x != doc.documentElement && x != doc.body) {
          salida.add(x);
        }
      }
      break;
    }
    case "xpath": {
      const contextos = entrada === null ? [doc] : [...entrada];
      for (const c of contextos) {
        const r = doc.evaluate(arg, c, null, win.XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        for (let i = 0; i < r.snapshotLength; i++) {
          const nodo = r.snapshotItem(i);
          if (nodo?.nodeType == 1) {
            salida.add(nodo);
          }
        }
      }
      break;
    }
    case "has":
    case "not-has":
      // :has() con procedurales dentro: el elemento se queda si la cadena, desde él, encuentra algo (o no).
      for (const el of entrada) {
        if (cadena(arg, new Set([el]), doc, win, true).size > 0 == (op.type == "has")) {
          salida.add(el);
        }
      }
      break;
    case "not":
      // :not() con procedurales dentro: el elemento se queda si él mismo no cumple la cadena.
      for (const el of entrada) {
        if (!cumple(el, arg, doc, win)) {
          salida.add(el);
        }
      }
      break;
    case "matches-media":
      if (win.matchMedia(arg).matches) {
        for (const el of entrada) {
          salida.add(el);
        }
      }
      break;
    case "watch-attr":
      // En uBlock Origin, volver a mirar al cambiar esos atributos: aquí ya se vuelve a mirar con cada cambio del DOM.
      return new Set(entrada);
    default:
      // Operador que no conocemos: el filtro no hace nada.
      return new Set();
  }
  return salida;
}

/** Una cadena de operadores sobre un conjunto (null: todo el documento). `relativa`: desde cada elemento, como :has(). */
function cadena(ops, entrada, doc, win, relativa = false) {
  let conjunto = entrada;
  for (let i = 0; i < ops.length; i++) {
    let op = ops[i];
    // En un :has() relativo, el primer selector sin combinador busca descendientes.
    if (relativa && i == 0 && op.type == "css-selector" && !/^\s*[>+~]/.test(op.arg)) {
      op = { ...op, arg: " " + op.arg };
    }
    conjunto = operar(op, conjunto, doc, win);
    if (!conjunto.size) {
      break;
    }
  }
  return conjunto ?? new Set();
}

/** ¿Cumple el propio elemento la cadena (como filtro, para :not())? */
function cumple(el, ops, doc, win) {
  let conjunto = new Set([el]);
  for (const op of ops) {
    if (op.type == "css-selector") {
      conjunto = el.matches(op.arg.trim()) ? conjunto : new Set();
    } else {
      conjunto = operar(op, conjunto, doc, win);
    }
    if (!conjunto.size) {
      return false;
    }
  }
  return true;
}

/**
 * Operadores procedurales en la sintaxis de uBlock Origin → tipo de operador. adblock-rust, tal como se compila con
 * las fuentes de Firefox (sin la feature css-validation, que pide otras versiones de cssparser y selectors), no los
 * separa: llegan como un selector CSS entero («span:has-text(Anuncio):upward(3)»). Se separan aquí.
 */
const OPERADORES = new Map([
  ["has-text", "has-text"],
  ["-abp-contains", "has-text"],
  ["matches-css", "matches-css"],
  ["matches-css-before", "matches-css-before"],
  ["matches-css-after", "matches-css-after"],
  ["matches-attr", "matches-attr"],
  ["matches-path", "matches-path"],
  ["matches-media", "matches-media"],
  ["min-text-length", "min-text-length"],
  ["upward", "upward"],
  ["nth-ancestor", "upward"],
  ["xpath", "xpath"],
  ["watch-attr", "watch-attr"],
  ["-abp-has", "has"],
  ["has", "has"],
  ["if", "has"],
  ["if-not", "not-has"],
  ["not", "not"],
]);
/** ¿Lleva el selector algún operador procedural (o uno que el motor de estilos no entiende)? */
const PROCEDURAL =
  /:(?:has-text|-abp-contains|-abp-has|matches-css(?:-before|-after)?|matches-attr|matches-path|matches-media|matches-prop|min-text-length|upward|nth-ancestor|xpath|watch-attr|if-not|if|others|remove|style)\(/;

export function esProcedural(selector) {
  return PROCEDURAL.test(selector);
}

/** Posición del «)» que cierra el «(» de `i`, con comillas, escapes y paréntesis anidados; -1 si no cierra. */
function cierre(s, i) {
  let nivel = 0;
  let comilla = "";
  for (let j = i; j < s.length; j++) {
    const c = s[j];
    if (c == "\\") {
      j++;
    } else if (comilla) {
      if (c == comilla) {
        comilla = "";
      }
    } else if (c == '"' || c == "'") {
      comilla = c;
    } else if (c == "(") {
      nivel++;
    } else if (c == ")" && --nivel == 0) {
      return j;
    }
  }
  return -1;
}

/** Fin de un «[atributo]» que empieza en `i` (con comillas y escapes). */
function finAtributo(s, i) {
  let comilla = "";
  for (let j = i; j < s.length; j++) {
    const c = s[j];
    if (c == "\\") {
      j++;
    } else if (comilla) {
      if (c == comilla) {
        comilla = "";
      }
    } else if (c == '"' || c == "'") {
      comilla = c;
    } else if (c == "]") {
      return j;
    }
  }
  return s.length - 1;
}

/**
 * Separa un selector con operadores procedurales en la cadena de operadores ({type, arg}), o null si no se entiende
 * (un operador que no conocemos, paréntesis sin cerrar). Un :has() o :not() sin procedurales dentro se queda en el CSS
 * (Firefox los entiende).
 *
 * @param {string} texto
 * @returns {{type: string, arg: any}[] | null}
 */
export function analizarSelector(texto) {
  const ops = [];
  let css = "";
  let comilla = "";
  const cerrarCss = xpath => {
    if (css.trim()) {
      // El primero, tal cual; los siguientes conservan su combinador inicial (o su falta: mismo elemento).
      ops.push({ type: "css-selector", arg: ops.length ? css : css.trim() });
    } else if (!ops.length && !xpath) {
      // Un operador sin selector delante vale para cualquier elemento (salvo :xpath, que busca desde el documento).
      ops.push({ type: "css-selector", arg: "*" });
    }
    css = "";
  };
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (c == "\\") {
      css += texto.slice(i, i + 2);
      i++;
      continue;
    }
    if (comilla) {
      css += c;
      if (c == comilla) {
        comilla = "";
      }
      continue;
    }
    if (c == '"' || c == "'") {
      comilla = c;
      css += c;
      continue;
    }
    if (c == "[") {
      const fin = finAtributo(texto, i);
      css += texto.slice(i, fin + 1);
      i = fin;
      continue;
    }
    if (c == ":") {
      const m = /^:([-a-z]+)\(/.exec(texto.slice(i, i + 24));
      if (m) {
        const fin = cierre(texto, i + m[0].length - 1);
        if (fin < 0) {
          return null;
        }
        const nombre = m[1];
        const arg = texto.slice(i + m[0].length, fin);
        const tipo = OPERADORES.get(nombre);
        if (!tipo) {
          if (PROCEDURAL.test(`:${nombre}(`)) {
            return null;
          }
          css += texto.slice(i, fin + 1);
        } else if ((tipo == "has" || tipo == "not" || tipo == "not-has") && !PROCEDURAL.test(arg)) {
          // CSS normal.
          css += tipo == "not-has" ? `:not(:has(${arg}))` : tipo == "has" ? `:has(${arg})` : `:not(${arg})`;
        } else {
          cerrarCss(tipo == "xpath");
          if (tipo == "has" || tipo == "not" || tipo == "not-has") {
            const sub = analizarSelector(arg.trim());
            if (!sub) {
              return null;
            }
            ops.push({ type: tipo, arg: sub });
          } else {
            ops.push({ type: tipo, arg });
          }
        }
        i = fin;
        continue;
      }
    }
    css += c;
  }
  if (css.trim()) {
    ops.push({ type: "css-selector", arg: ops.length ? css : css.trim() });
  }
  return ops.length ? ops : null;
}

/**
 * ¿Es un filtro CSS puro? Devuelve la regla de hoja que lo sustituye ("" si no se puede usar) o null si es procedural.
 *
 * @param {{selector: {type: string, arg: string}[], action?: {type: string, arg?: string}}} f
 */
export function comoCss(f) {
  if (f.selector?.length != 1 || f.selector[0].type != "css-selector") {
    return null;
  }
  const s = f.selector[0].arg;
  if (esProcedural(s)) {
    // Lleva operadores sin separar (ver analizarSelector): es procedural, o nada si no se entiende.
    const ops = analizarSelector(s);
    if (ops) {
      f.selector = ops;
    }
    return ops ? null : "";
  }
  if (!f.action) {
    return cssDeSelectores([s]);
  }
  if (f.action.type == "style") {
    return cssDeEstilo(s, f.action.arg);
  }
  return null;
}

/** Los procedurales de un documento: se aplican al cargar y tras cada cambio del DOM (lo decide el hijo). */
export class Procedurales {
  /**
   * @param {Window} win la ventana de la página (con Xrays)
   * @param {object[]} filtros los que no son CSS puro (comoCss() == null)
   */
  constructor(win, filtros) {
    this.win = win;
    this.filtros = filtros.map(f => ({ ...f, hechos: new WeakSet() }));
    this.ejecuciones = 0;
  }

  /** Aplica todos los filtros; cada elemento recibe cada acción una sola vez. */
  aplicar() {
    const doc = this.win.document;
    if (!doc?.documentElement) {
      return;
    }
    this.ejecuciones++;
    for (const f of this.filtros) {
      let conjunto = null;
      try {
        conjunto = cadena(f.selector, null, doc, this.win);
      } catch {
        // Un selector que el motor de estilos no entiende: el filtro no hace nada.
        continue;
      }
      for (const el of conjunto ?? []) {
        if (f.hechos.has(el) || el == doc.documentElement || el == doc.body || el == doc.head) {
          continue;
        }
        f.hechos.add(el);
        this.#accion(f.action, el);
      }
    }
  }

  #accion(accion, el) {
    try {
      switch (accion?.type) {
        case undefined:
          el.style.setProperty("display", "none", "important");
          break;
        case "remove":
          el.remove();
          break;
        case "style":
          for (const [p, v] of estiloSeguro(accion.arg) ?? []) {
            el.style.setProperty(p, v, "important");
          }
          break;
        case "remove-attr":
          for (const nombre of String(accion.arg).split("|")) {
            if (nombre.trim()) {
              el.removeAttribute(nombre.trim());
            }
          }
          break;
        case "remove-class":
          for (const nombre of String(accion.arg).split("|")) {
            if (nombre.trim()) {
              el.classList.remove(nombre.trim());
            }
          }
          break;
      }
    } catch {}
  }
}
