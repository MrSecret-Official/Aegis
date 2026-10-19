/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · diálogo Acerca de (chrome://browser/content/aboutDialog.xhtml). Lo llama AegisArranque.aplicarHojas() al
 * crearse el documento. Sin parche: solo cambia adónde llevan dos enlaces del pie.
 * - «Terms of Use» y «Privacy Notice» llevaban a las condiciones y a la política de privacidad de Firefox en
 *   mozilla.org; ahora, al aviso legal y a la política de privacidad de Aegis (web/legal/ y web/privacidad/ del repo,
 *   publicadas en GitHub Pages), en español si el idioma de la interfaz lo es y si no en inglés (web/en/). Son
 *   enlaces: solo hay conexión si el usuario los pulsa (docs/CONEXIONES.md).
 * - «Licensing Information» (about:license), la versión y las actualizaciones se quedan como en Firefox.
 * - Los párrafos de Mozilla (comunidad, donar, colaborar) y «Ayuda» / «Enviar opiniones» los oculta la hoja de la marca
 *   (overlay/browser/branding/aegis/content/aboutDialog.css).
 */

/** Web pública de Aegis (rama gh-pages de MrSecret-Official/Aegis). */
const WEB = "https://mrsecret-official.github.io/Aegis/";
/** Cada enlace del pie (por su id de Fluent) y su página, en español y en inglés. */
const ENLACES = {
  "bottom-links-terms": { es: "legal/", en: "en/legal/" },
  "bottom-links-privacy": { es: "privacidad/", en: "en/privacy/" },
};

/** Dirección de cada enlace en el idioma de la interfaz. */
export function direcciones(idioma = Services.locale.appLocaleAsBCP47) {
  const clave = /^es\b/i.test(idioma) ? "es" : "en";
  return Object.fromEntries(Object.entries(ENLACES).map(([id, rutas]) => [id, WEB + rutas[clave]]));
}

export const AegisAcerca = {
  /**
   * @param {Document} doc el del diálogo, recién creado (el pie todavía no existe: se espera a DOMContentLoaded).
   */
  dialogo(doc) {
    const poner = () => {
      for (const [id, url] of Object.entries(direcciones())) {
        for (const enlace of doc.querySelectorAll(`label.bottom-link[data-l10n-id="${id}"]`)) {
          enlace.setAttribute("href", url);
        }
      }
    };
    if (doc.readyState == "loading") {
      doc.defaultView.addEventListener("DOMContentLoaded", poner, { once: true });
    } else {
      poner();
    }
  },
};
