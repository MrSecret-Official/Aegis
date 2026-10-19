/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · estilo de las páginas propias del navegador (nueva pestaña, bienvenida, navegación privada, contraseñas).
 * Lo registra AegisArranque.registrarPaginas() solo para esas direcciones about:, así que una web nunca recibe estas
 * hojas. Se cargan al crearse el documento, antes de que se pinte: como hojas de autor y, para lo que vive dentro de
 * los componentes de la página (shadow DOM), como hojas de usuario, las únicas que llegan ahí.
 */

import { aspecto } from "./personalizar.sys.mjs";
import { logos } from "./logos.sys.mjs";

/** Hojas de todas las páginas propias: los tokens y el mapeo de los colores de Firefox. */
const COMUNES = ["../estilos/tokens.css", "comun.css"];
/** Hojas de cada página, por el principio de su dirección. */
const POR_PAGINA = [
  // Con el selector del énfasis personalizado (Personalizar › Énfasis).
  ["about:newtab", ["nueva-pestana.css", "../estilos/selector-enfasis.css"]],
  ["about:home", ["nueva-pestana.css", "../estilos/selector-enfasis.css"]],
  ["about:logins", ["contrasenas.css"]],
  ["about:privatebrowsing", ["privada.css"]],
];
/** Hojas de usuario de cada página (con !important): lo de dentro de sus componentes. */
const SOMBRA_POR_PAGINA = [
  ["about:logins", ["contrasenas-sombra.css"]],
  // El buscador de la página (content-search-handoff-ui) en Inter.
  ["about:newtab", ["busqueda-sombra.css"]],
  ["about:home", ["busqueda-sombra.css"]],
  ["about:privatebrowsing", ["busqueda-sombra.css"]],
];
/** Módulos que completan una página cuando está montada (export completar(win)), por el principio de su dirección. */
const MODULO_POR_PAGINA = [
  ["about:logins", "contrasenas.sys.mjs"],
  // Estado de Tor, solo en la instancia con Tor (tor/tor.sys.mjs).
  ["about:privatebrowsing", "privada.sys.mjs"],
];
/** Inter (DISENO §3), la misma que declara estilos/fuentes.css en la interfaz. */
const INTER = "../fuentes/InterVariable.woff2";

/**
 * Bytes de Inter, leídos una sola vez por proceso y solo cuando se abre una de estas páginas.
 * Hace falta porque estas páginas tienen una CSP sin font-src (default-src 'none'), que bloquearía un @font-face
 * aunque la hoja la ponga el navegador (por eso aquí no se pone estilos/fuentes.css: la consola queda limpia). Una
 * FontFace creada con los bytes no descarga nada, así que la CSP no interviene. Es un archivo del propio navegador
 * (resource://), nunca una conexión.
 *
 * @type {Promise<ArrayBuffer>|null}
 */
let bytesDeInter = null;

function leerInter() {
  bytesDeInter ??= fetch(new URL(INTER, import.meta.url).href).then(r => r.arrayBuffer());
  return bytesDeInter;
}

export class AegisPaginasChild extends JSWindowActorChild {
  handleEvent(event) {
    if (event.type != "DOMDocElementInserted") {
      return;
    }
    const direccion = this.document.documentURI;
    const deEstaPagina = tabla => tabla.filter(([prefijo]) => direccion.startsWith(prefijo)).flatMap(([, v]) => v);
    const win = this.contentWindow;
    const utils = win.windowUtils;
    for (const [hojas, tipo] of [
      [[...COMUNES, ...deEstaPagina(POR_PAGINA)], utils.AUTHOR_SHEET],
      [deEstaPagina(SOMBRA_POR_PAGINA), utils.USER_SHEET],
    ]) {
      for (const hoja of hojas) {
        try {
          utils.loadSheetUsingURIString(new URL(hoja, import.meta.url).href, tipo);
        } catch (e) {
          console.error(`Aegis: no se pudo cargar ${hoja}`, e);
        }
      }
    }
    this.ponerInter(win);
    // Énfasis (todas) y nueva pestaña (fondo, orden, «Personalizar»): antes de la primera pintura.
    try {
      this.deshacerAspecto = aspecto(win, direccion);
    } catch (e) {
      console.error("Aegis: aspecto de la página", e);
    }
    // Logos de los accesos directos (paginas/logos.sys.mjs): lo del perfil lo responde AegisPaginasParent.
    if (direccion.startsWith("about:newtab") || direccion.startsWith("about:home")) {
      try {
        this.deshacerLogos = logos(win, (nombre, datos) => this.sendQuery(nombre, datos));
      } catch (e) {
        console.error("Aegis: logos de los accesos", e);
      }
    }
    for (const modulo of deEstaPagina(MODULO_POR_PAGINA)) {
      // Los componentes de la página se montan con sus scripts (módulos diferidos): antes de DOMContentLoaded.
      win.addEventListener(
        "DOMContentLoaded",
        () => {
          try {
            ChromeUtils.importESModule(new URL(modulo, import.meta.url).href).completar(win);
          } catch (e) {
            console.error(`Aegis: ${modulo}`, e);
          }
        },
        { once: true }
      );
    }
  }

  didDestroy() {
    this.deshacerAspecto?.();
    this.deshacerLogos?.();
  }

  /**
   * Añade Inter a las fuentes del documento a partir de sus bytes (ver leerInter).
   *
   * @param {Window} win
   */
  ponerInter(win) {
    leerInter()
      .then(bytes => {
        if (win.closed || !win.document) {
          return;
        }
        const cara = new win.FontFace(
          "Inter",
          Cu.cloneInto(bytes, win),
          Cu.cloneInto({ weight: "100 900", style: "normal", display: "block" }, win)
        );
        win.document.fonts.add(cara);
      })
      .catch(e => console.error("Aegis: no se pudo poner Inter", e));
  }
}
