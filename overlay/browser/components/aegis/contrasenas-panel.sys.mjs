/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · panel «Contraseñas» de la barra lateral (el megalist de Firefox, chrome://global/content/megalist/), con el
 * aspecto de Aegis (docs/DISENO.md):
 * - estilos/contrasenas-panel.css como hoja de USUARIO, la única que entra en sus componentes (shadow DOM);
 * - estado vacío propio: el glifo de la llave (lo pone la hoja), un título y una frase honesta, sin el zorro ni la
 *   promesa de vigilar filtraciones (Aegis no usa Mozilla Monitor);
 * - aviso cuando no hay contraseña principal, con «Crear contraseña principal»;
 * - sin «Exportar contraseñas» (en claro) salvo que se active aegis.contrasenas.exportar_en_claro;
 * - las secciones «Códigos de verificación» y «Passkeys» (autenticador/panel.sys.mjs).
 *
 * El panel es un componente Lit (<megalist-alpha>) que se vuelve a pintar a menudo: los cambios se repiten después de
 * cada pintado con un controlador de Lit (hostUpdated), sin temporizadores ni observadores del DOM.
 */

import { AegisContrasenas, PREF_EXPORTAR } from "./contrasenas.sys.mjs";

export const PREFIJO_PANEL = "chrome://global/content/megalist/";
const HOJA = new URL("estilos/contrasenas-panel.css", import.meta.url).href;

let localizacion;
/**
 * @param {string} id
 * @returns {string}
 */
function texto(id) {
  localizacion ??= new Localization(["aegis.ftl", "branding/brand.ftl"], true);
  const [m] = localizacion.formatMessagesSync([{ id }]);
  return m?.value ?? "";
}

/**
 * Estado vacío: título y una frase de Aegis en lugar de los de Firefox (que prometen avisar de filtraciones). Se les
 * quita data-l10n-id para que Fluent no los vuelva a traducir.
 *
 * @param {ShadowRoot} raiz
 */
function estadoVacio(raiz) {
  const caja = raiz.querySelector(".no-logins-card-content:not([aegis-hecho])");
  if (!caja) {
    return;
  }
  caja.setAttribute("aegis-hecho", "");
  const titulo = caja.querySelector(".no-logins-card-heading");
  const parrafos = caja.querySelectorAll(":scope > p");
  if (titulo) {
    titulo.removeAttribute("data-l10n-id");
    titulo.textContent = texto("aegis-contrasenas-panel-titulo");
  }
  if (parrafos[0]) {
    parrafos[0].removeAttribute("data-l10n-id");
    parrafos[0].textContent = texto("aegis-contrasenas-panel-texto");
  }
  for (const p of [...parrafos].slice(1)) {
    p.remove();
  }
}

/**
 * Aviso «Sin contraseña principal», entre la cabecera y la lista (fuera de la lista virtual, que calcula sus alturas).
 *
 * @param {Element} panel <megalist-alpha>
 * @param {ShadowRoot} raiz
 */
function avisoPrincipal(panel, raiz) {
  const doc = panel.ownerDocument;
  const contenedor = raiz.querySelector(".container");
  const lista = contenedor?.querySelector(":scope > .sidebar-panel-scrollable-content");
  let aviso = contenedor?.querySelector(":scope > .aegis-aviso-principal");
  const hace = !AegisContrasenas.estado().principal && !panel.shouldShowPrimaryPasswordAuth;
  if (!hace || !lista) {
    aviso?.remove();
    return;
  }
  if (aviso) {
    return;
  }
  aviso = doc.createElement("div");
  aviso.className = "aegis-aviso-principal";
  aviso.setAttribute("role", "status");
  const frase = doc.createElement("p");
  frase.className = "aegis-aviso-principal-texto";
  frase.textContent = texto("aegis-contrasenas-sin-principal");
  const boton = doc.createElement("button");
  boton.className = "aegis-aviso-principal-boton";
  boton.textContent = texto("aegis-contrasenas-principal-crear");
  boton.addEventListener("click", async () => {
    boton.disabled = true;
    try {
      await AegisContrasenas.crearPrincipal(doc.defaultView.browsingContext.topChromeWindow);
    } catch (e) {
      console.error("Aegis: contraseña principal", e);
    }
    boton.disabled = false;
    ajustar(panel);
  });
  aviso.append(frase, boton);
  contenedor.insertBefore(aviso, lista);
}

/**
 * Menú «⋯»: fuera «Exportar contraseñas» (en claro) salvo que se active la pref.
 *
 * @param {ShadowRoot} raiz
 */
function menu(raiz) {
  const exportar = raiz.querySelector('panel-item[action="export-logins"]');
  if (exportar) {
    exportar.hidden = !Services.prefs.getBoolPref(PREF_EXPORTAR, false);
  }
}

/**
 * @param {Element} panel <megalist-alpha>
 */
function ajustar(panel) {
  const raiz = panel.shadowRoot;
  if (!raiz) {
    return;
  }
  for (const [nombre, paso] of [
    ["estado vacío", () => estadoVacio(raiz)],
    ["aviso", () => avisoPrincipal(panel, raiz)],
    ["menú", () => menu(raiz)],
    // Se importa aquí: si el autenticador fallara al cargar, el resto del panel sigue funcionando.
    [
      "códigos de verificación",
      () =>
        ChromeUtils.importESModule(new URL("autenticador/panel.sys.mjs", import.meta.url).href).seccionDelPanel(
          panel,
          raiz
        ),
    ],
  ]) {
    try {
      paso();
    } catch (e) {
      console.error(`Aegis: panel de contraseñas (${nombre})`, e);
    }
  }
}

/**
 * Lo llama AegisArranque cuando se crea el documento del panel (document-element-inserted).
 *
 * @param {Document} doc
 */
export function panel(doc) {
  const win = doc.defaultView;
  try {
    win.windowUtils.loadSheetUsingURIString(HOJA, win.windowUtils.USER_SHEET);
  } catch (e) {
    console.error("Aegis: no se pudo cargar contrasenas-panel.css", e);
  }
  // El componente se define con un módulo del documento, que se ejecuta antes de DOMContentLoaded.
  win.addEventListener(
    "DOMContentLoaded",
    () => {
      const el = doc.querySelector("megalist-alpha");
      if (!el?.addController) {
        console.error("Aegis: el panel de contraseñas no es el componente esperado");
        return;
      }
      el.addController({ hostUpdated: () => ajustar(el) });
      ajustar(el);
      // Si se crea o se quita la contraseña principal desde Ajustes, el aviso cambia.
      const alCambiar = () => ajustar(el);
      Services.obs.addObserver(alCambiar, "passwordmgr-primary-pw-changed");
      win.addEventListener("unload", () => Services.obs.removeObserver(alCambiar, "passwordmgr-primary-pw-changed"), {
        once: true,
      });
    },
    { once: true }
  );
}
