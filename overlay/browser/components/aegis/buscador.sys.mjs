/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · «Usar <buscador> como predeterminado» en el menú de la lupa (el selector de buscadores de la barra de
 * direcciones, SearchModeSwitcher.mjs de Firefox).
 *
 * Elegir un buscador en la lupa vale para una búsqueda: la barra entra en el «modo de búsqueda» de ese buscador. Si
 * después se vuelve a abrir la lupa con ese modo puesto, y el buscador no es ya el predeterminado, el menú lleva una
 * fila más, junto a las acciones del pie («Añadir buscador», «Ajustes»), que lo hace predeterminado: el mismo cambio
 * que Ajustes › Búsqueda. Vale para la barra, la nueva pestaña (que pasa lo escrito a la barra con el predeterminado,
 * ContentSearchParent) y las ventanas privadas (que usan el mismo; ver AegisArranque.buscadorDeSerieUnaVez).
 *
 * Una fila y no un menú contextual: panel-list anula el menú contextual de sus filas (preventDefault en
 * «contextmenu»), y una fila se ve y se alcanza con el teclado como las demás.
 *
 * Sin parche: Firefox avisa con el evento «rebuild» cada vez que termina de montar el menú (al abrirse). No es de los
 * que suben, así que se escucha en la fase de captura de la ventana. Nada de red ni de temporizadores.
 */

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  SearchService: "moz-src:///toolkit/components/search/SearchService.sys.mjs",
});

const CLASE = "aegis-buscador-predeterminado";
const ICONO = new URL("estilos/iconos/predeterminado.svg", import.meta.url).href;

let localizacion;
/** Texto de Aegis con su propio Localization síncrono (nunca el document.l10n de la ventana). */
function texto(id, args) {
  localizacion ??= new Localization(["aegis.ftl"], true);
  try {
    return localizacion.formatValueSync(id, args) ?? "";
  } catch (e) {
    console.error(`Aegis: texto ${id}`, e);
    return "";
  }
}

/**
 * El buscador del modo de búsqueda de la barra que contiene el menú, si no es ya el predeterminado.
 *
 * @param {Element} lista el panel-list del selector
 * @returns {object|null} el motor de SearchService
 */
function elegidoNoPredeterminado(lista) {
  // La barra (moz-urlbar, moz-searchbar…) es la que tiene searchMode; el menú está dentro de ella.
  let barra = lista.parentElement;
  while (barra && !("searchMode" in barra)) {
    barra = barra.parentElement;
  }
  const nombre = barra?.searchMode?.engineName;
  if (!nombre || !lazy.SearchService.isInitialized) {
    return null;
  }
  const motor = lazy.SearchService.getEngineByName(nombre);
  const predeterminado = barra.isPrivate ? lazy.SearchService.defaultPrivateEngine : lazy.SearchService.defaultEngine;
  return motor && motor != predeterminado ? motor : null;
}

/** Al terminar Firefox de montar el menú: pone (o quita) la fila. */
function alMontar(evento) {
  const lista = evento.target;
  if (!lista?.classList?.contains("searchmode-switcher-panel-list")) {
    return;
  }
  lista.querySelector(`:scope > .${CLASE}`)?.remove();
  const motor = elegidoNoPredeterminado(lista);
  const pie = lista.querySelector(":scope > .searchmode-switcher-panel-footer-separator");
  if (!motor || !pie) {
    return;
  }
  const fila = lista.ownerDocument.createElementNS("http://www.w3.org/1999/xhtml", "panel-item");
  fila.classList.add(CLASE);
  fila.textContent = texto("aegis-buscador-predeterminado", { buscador: motor.name });
  fila.style.setProperty("--icon-url", `url("${ICONO}")`);
  // panel-list cierra el menú con el clic (o Intro o espacio, que llegan como clic) en cualquier fila.
  fila.addEventListener("click", () => {
    lazy.SearchService.setDefault(motor, lazy.SearchService.CHANGE_REASON.USER).catch(e =>
      console.error("Aegis: buscador predeterminado", e)
    );
  });
  pie.after(fila);
}

export const AegisBuscador = {
  /**
   * Cada ventana del navegador, cuando termina de abrirse.
   *
   * @param {Window} win
   */
  ventana(win) {
    win.addEventListener("rebuild", alMontar, { capture: true });
  },
};
