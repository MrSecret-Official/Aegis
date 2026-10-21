/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · favicons que no se ven sobre el tema (docs/DISENO.md §9, «Favicons de poco contraste»).
 *
 * El favicon negro y monocromo de GitHub, sobre la barra de marcadores oscura, casi desaparece; uno blanco, sobre la
 * clara, igual. Cada favicon se mide una vez, en el equipo, y el elemento que lo pinta recibe el atributo
 * aegis-favicon con lo que le hace falta (estilos/favicons.css):
 * - «osc-inv»: monocromo y oscuro, con transparencia alrededor (el de GitHub). En el tema oscuro se pinta en blanco
 *   (invertido), como el logo de la nueva pestaña (paginas/logos.sys.mjs, aegis-logo-oscuro).
 * - «cla-inv»: monocromo y claro. En el tema claro se pinta en negro.
 * - «osc-placa»: oscuro y de color (un azul marino), que invertido perdería su color. En el tema oscuro lleva detrás
 *   una placa clara sutil (--aegis-favicon-placa).
 * Los que tienen fondo propio (un cuadrado opaco) ya traen su contraste y no se tocan, ni los de Aegis o Firefox
 * (chrome://, resource://).
 *
 * Dónde: pestañas (también las verticales), barra de marcadores, menús con favicons (Marcadores, Historial, carpetas
 * de la barra…) y los paneles de Historial y Marcadores de la barra lateral.
 *
 * Sin red: solo se miden imágenes que ya están en el equipo (data:, y page-icon:/cached-favicon:, que lee Places); un
 * favicon de la web (https:, moz-remote-image:) se deja como está. Un SVG que se adapta solo al tema
 * (prefers-color-scheme dentro) tampoco se toca.
 *
 * Ligero: sin temporizadores ni trabajo en reposo. Se mide al cambiar el favicon de una pestaña (TabAttrModified), al
 * cambiar la barra de marcadores (un MutationObserver en su lista), al abrirse un menú (popupshown) y en los paneles,
 * al cambiar sus filas. Cada imagen se mide una sola vez por sesión (caché de MAX_CACHE entradas).
 */

import { pixeles, LADO_MEDIDA } from "./paginas/logos.sys.mjs";

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  PlacesUtils: "resource://gre/modules/PlacesUtils.sys.mjs",
  PrivateBrowsingUtils: "resource://gre/modules/PrivateBrowsingUtils.sys.mjs",
});

const ATRIBUTO = "aegis-favicon";
const HOJA = new URL("estilos/favicons.css", import.meta.url).href;
const PANELES = ["chrome://browser/content/sidebar/sidebar-history.html", "chrome://browser/content/sidebar/sidebar-bookmarks.html"];
/** Imágenes que ya están en el equipo: solo esas se miden (una de la web se volvería a pedir). */
const LOCAL = /^(?:data:image\/|page-icon:|cached-favicon:)/;
const MAX_CACHE = 512;
/** Luminancia relativa (WCAG) de los fondos del tema: el oscuro (--aegis-bg … --aegis-menu) y el claro. */
const FONDO_OSCURO = 0.01;
const FONDO_CLARO = 0.91;
/** Por debajo de este contraste con el fondo, un favicon monocromo se invierte (3:1, el de los gráficos en WCAG)… */
const CONTRASTE_MONOCROMO = 3;
/** …y uno de color lleva placa (más bajo: un color de marca medio se ve sin ayuda). */
const CONTRASTE_COLOR = 2;

/** imagen → tokens de ATRIBUTO ("" si no le hace falta nada). */
const cache = new Map();
/** imagen → promesa de su medida, mientras se mide. */
const midiendo = new Map();
/** Ventana privada → su propia caché y sus medidas en curso: mueren con la ventana, nada de lo visto en privado queda en
 * la de la sesión. */
const privadas = new WeakMap();
const ventanas = new WeakSet();
const paneles = new WeakSet();
const sombras = new WeakSet();

const lineal = c => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const contraste = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

/**
 * Lo que le hace falta a un favicon, de sus píxeles (RGBA de lado × lado): "" o tokens separados por espacios.
 *
 * @param {ArrayLike<number>} d
 * @param {number} lado
 * @returns {string}
 */
export function clasificar(d, lado) {
  let opacos = 0;
  let transparentes = 0;
  let luz = 0;
  let color = 0;
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3];
    if (a < 32) {
      transparentes++;
      continue;
    }
    if (a < 160) {
      continue;
    }
    const [r, g, b] = [d[i], d[i + 1], d[i + 2]];
    const max = Math.max(r, g, b);
    opacos++;
    luz += 0.2126 * lineal(r) + 0.7152 * lineal(g) + 0.0722 * lineal(b);
    // Croma absoluto (no la saturación, que en un gris casi negro como #0d1117 se dispara sin que se vea color).
    color += (max - Math.min(r, g, b)) / 255;
  }
  const total = lado * lado;
  // Sin transparencia alrededor (un cuadrado opaco) o casi vacío: trae su propio contraste o no hay nada que ver.
  if (opacos < total * 0.05 || transparentes < total * 0.15) {
    return "";
  }
  const l = luz / opacos;
  const monocromo = color / opacos < 0.1;
  const tokens = [];
  if (monocromo) {
    if (contraste(l, FONDO_OSCURO) < CONTRASTE_MONOCROMO) {
      tokens.push("osc-inv");
    }
    if (contraste(l, FONDO_CLARO) < CONTRASTE_MONOCROMO) {
      tokens.push("cla-inv");
    }
  } else if (contraste(l, FONDO_OSCURO) < CONTRASTE_COLOR) {
    tokens.push("osc-placa");
  }
  return tokens.join(" ");
}

/** ¿Un SVG que cambia solo con el tema? Entonces se deja como está. */
const svgAdaptable = texto => /prefers-color-scheme/i.test(texto);

/**
 * La imagen que hay que medir para `src`, como dirección que se puede cargar sin red, o null si no se mide.
 *
 * @param {string} src
 * @returns {Promise<string|null>}
 */
async function fuente(src) {
  if (src.startsWith("data:image/svg")) {
    const coma = src.indexOf(",");
    const cuerpo = src.slice(coma + 1);
    const texto = src.slice(0, coma).includes(";base64") ? atob(cuerpo) : decodeURIComponent(cuerpo);
    return svgAdaptable(texto) ? null : src;
  }
  if (src.startsWith("page-icon:")) {
    // El favicon de una página lo da Places, que dice además si es un SVG (para no tocar uno que se adapta solo).
    const pagina = src.slice("page-icon:".length).split("#")[0];
    const icono = await lazy.PlacesUtils.favicons.getFaviconForPage(Services.io.newURI(pagina), LADO_MEDIDA);
    if (!icono) {
      return null;
    }
    if (icono.mimeType.includes("svg") && svgAdaptable(new TextDecoder().decode(new Uint8Array(icono.rawData)))) {
      return null;
    }
    return icono.dataURI.spec;
  }
  return src;
}

/**
 * Mide una imagen en la ventana `win` (un lienzo de LADO_MEDIDA en memoria).
 *
 * @param {Window} win
 * @param {string} src
 * @returns {Promise<string>}
 */
async function medir(win, src) {
  const dir = await fuente(src).catch(() => null);
  if (!dir || win.closed) {
    return "";
  }
  const img = new win.Image();
  img.src = dir;
  await img.decode();
  return clasificar(pixeles(win.document, img), LADO_MEDIDA);
}

/** La caché de la ventana: la de la sesión o, en una ventana privada, la suya. */
function almacen(win) {
  if (!lazy.PrivateBrowsingUtils.isWindowPrivate(win)) {
    return { cache, midiendo };
  }
  let a = privadas.get(win);
  if (!a) {
    a = { cache: new Map(), midiendo: new Map() };
    privadas.set(win, a);
  }
  return a;
}

/**
 * Lo que le hace falta a `src`: de la caché o, si no está, null (y se mide una vez; `listo` recibe los tokens).
 *
 * @param {Window} win
 * @param {string} src
 * @param {(tokens: string) => void} listo
 * @returns {string|null}
 */
function tokensDe(win, src, listo) {
  const a = almacen(win);
  if (a.cache.has(src)) {
    return a.cache.get(src);
  }
  if (!a.midiendo.has(src)) {
    a.midiendo.set(
      src,
      medir(win, src)
        .catch(() => "")
        .then(tokens => {
          a.midiendo.delete(src);
          if (a.cache.size >= MAX_CACHE) {
            a.cache.delete(a.cache.keys().next().value);
          }
          a.cache.set(src, tokens);
          return tokens;
        })
    );
  }
  a.midiendo.get(src).then(listo, () => {});
  return null;
}

/**
 * Marca un elemento según su favicon `src` (o lo desmarca si no le hace falta nada o no se puede medir).
 *
 * @param {Window} win
 * @param {Element} el
 * @param {string|null} src
 * @param {() => string|null} srcActual vuelve a leer el favicon (puede haber cambiado mientras se medía)
 */
function marcar(win, el, src, srcActual) {
  if (!src || !LOCAL.test(src)) {
    el.removeAttribute(ATRIBUTO);
    return;
  }
  const poner = tokens => {
    if (tokens) {
      el.setAttribute(ATRIBUTO, tokens);
    } else {
      el.removeAttribute(ATRIBUTO);
    }
  };
  const ya = tokensDe(win, src, tokens => {
    if (el.isConnected && srcActual() == src) {
      poner(tokens);
    }
  });
  if (ya !== null) {
    poner(ya);
  }
}

// ── Pestañas, barra de marcadores y menús de la ventana ──

function marcarPestana(win, tab) {
  const icono = tab.querySelector(".tab-icon-image");
  if (icono) {
    marcar(win, icono, tab.getAttribute("image"), () => tab.getAttribute("image"));
  }
}

/** Botones y elementos de menú con favicon (atributo image) dentro de `raiz`. */
function marcarConImagen(win, raiz) {
  for (const el of raiz.querySelectorAll(":is(toolbarbutton, menuitem, menu)[image]")) {
    marcar(win, el, el.getAttribute("image"), () => el.getAttribute("image"));
  }
}

// ── Paneles de Historial y Marcadores (filas en sombras anidadas) ──

const URL_IMAGEN = /url\("?(.+?)"?\)/;

/** Las filas de las listas (fxview-tab-row) pintan el favicon como fondo de .fxview-tab-row-favicon. */
function marcarSombra(win, raiz) {
  for (const el of raiz.querySelectorAll(".fxview-tab-row-favicon")) {
    const leer = () => URL_IMAGEN.exec(el.style.backgroundImage)?.[1] ?? null;
    marcar(win, el, leer(), leer);
  }
  for (const host of raiz.querySelectorAll("*")) {
    if (host.shadowRoot) {
      observarSombra(win, host.shadowRoot);
    }
  }
}

/** Cada sombra se observa una vez: filas nuevas o un favicon que cambia (las listas son de Lit). */
function observarSombra(win, raiz) {
  if (sombras.has(raiz)) {
    return;
  }
  sombras.add(raiz);
  const obs = new win.MutationObserver(() => marcarSombra(win, raiz));
  obs.observe(raiz, { childList: true, subtree: true, attributes: true, attributeFilter: ["style"] });
  marcarSombra(win, raiz);
}

/** El panel de Historial o de Marcadores de la barra lateral, cuando se muestra. */
function panel(win) {
  const doc = win.SidebarController?.browser?.contentDocument;
  if (!doc || !PANELES.some(p => doc.documentURI.startsWith(p)) || paneles.has(doc)) {
    return;
  }
  paneles.add(doc);
  try {
    doc.defaultView.windowUtils.loadSheetUsingURIString(HOJA, doc.defaultView.windowUtils.USER_SHEET);
  } catch (e) {
    if (e.result != Cr.NS_ERROR_ILLEGAL_VALUE) {
      throw e;
    }
  }
  const empezar = () => observarSombra(doc.defaultView, doc);
  if (doc.readyState == "complete") {
    empezar();
  } else {
    doc.defaultView.addEventListener("load", empezar, { once: true });
  }
}

export const AegisFavicons = {
  /**
   * Cada ventana del navegador (AegisArranque.ventana). Idempotente.
   *
   * @param {Window} win
   */
  ventana(win) {
    if (!win?.gBrowser || ventanas.has(win)) {
      return;
    }
    ventanas.add(win);
    win.windowUtils.loadSheetUsingURIString(HOJA, win.windowUtils.USER_SHEET);
    for (const tab of win.gBrowser.tabs) {
      marcarPestana(win, tab);
    }
    win.gBrowser.tabContainer.addEventListener("TabAttrModified", e => {
      if (e.detail?.changed?.includes("image")) {
        marcarPestana(win, e.target);
      }
    });
    // La barra de marcadores: Firefox crea sus botones y les pone el favicon después.
    const barra = win.document.getElementById("PlacesToolbarItems");
    if (barra) {
      new win.MutationObserver(() => marcarConImagen(win, barra)).observe(barra, {
        childList: true,
        attributes: true,
        attributeFilter: ["image"],
        subtree: true,
      });
      marcarConImagen(win, barra);
    }
    // Menús con favicons (Marcadores, Historial, carpetas de la barra, pestañas cerradas…), al abrirse ya montados.
    win.addEventListener("popupshown", e => {
      if (e.target.localName == "menupopup") {
        marcarConImagen(win, e.target);
      }
    });
    win.addEventListener("SidebarShown", () => panel(win));
    panel(win);
  },
};
