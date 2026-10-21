/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · about:editprofile y about:newprofile (actor AegisPaginas, en cuanto se crea el documento).
 *
 * Aegis quita de estas páginas el selector de temas de Firefox (perfiles-sombra.css): sus temas no son los de Aegis
 * y su «Claro / Oscuro / Dispositivo» repetía Ajustes › Apariencia. Pero about:newprofile, al abrirse, elige un tema
 * al azar de esa lista para el perfil nuevo (NewProfileCard.setRandomTheme) y lo pone con un evento «themechange»
 * del selector: un perfil nuevo podía empezar con el tema Claro u Oscuro forzado en vez de seguir al sistema. Aquí se
 * para ese evento antes de que llegue al selector (captura en la ventana), así que estas páginas no cambian el tema;
 * el perfil nuevo empieza con el de serie y el tema se elige en Ajustes › Apariencia.
 */

/**
 * @param {Window} win la página
 */
export function proteger(win) {
  win.addEventListener(
    "themechange",
    event => {
      event.stopImmediatePropagation();
    },
    true
  );
}
