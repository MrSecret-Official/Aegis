/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · barra lateral y barra de marcadores (docs/DISENO.md).
 *
 * - Paneles de la barra lateral (chrome://browser/content/sidebar/): Historial y «Personalizar barra lateral» con la
 *   forma de SecretOS. Sus piezas viven dentro de componentes (shadow DOM), así que el aspecto va en
 *   estilos/barra-lateral.css como hoja de USUARIO, la única que entra ahí. Se pone en cuanto se crea el documento
 *   (antes de pintarlo). En «Personalizar», el pie lleva «Ajustes de Aegis».
 * - Lanzador (la tira con Historial, Marcadores… y el engranaje): botones de icono de Aegis en vez de los círculos
 *   de Firefox (estilos/lanzador.css, también hoja de usuario de la ventana por la misma razón).
 * - «Pestañas de otros dispositivos» (Firefox Sync, que Aegis no usa) desaparece de la barra y de «Personalizar».
 * - Barra de marcadores vacía: junto a su aviso, «Ahora no». Con él (pref aegis.marcadores.aviso_oculto), la barra
 *   no se muestra mientras esté vacía y vuelve sola con el primer marcador (estilos/barra-marcadores.css, que lo
 *   resuelve con CSS: sin observadores ni temporizadores).
 *
 * Sin parches ni temporizadores: un observador de documentos y eventos de la propia ventana. Todo idempotente.
 */

const PREFIJO_PANELES = "chrome://browser/content/sidebar/";
/** Paneles con el aspecto de Aegis (el de marcadores lo completa marcadores.sys.mjs). */
const PANELES = new Set(["sidebar-history.html", "sidebar-customize.html"]);
const URL_VENTANA = "chrome://browser/content/browser.xhtml";
const HOJA_PANELES = new URL("estilos/barra-lateral.css", import.meta.url).href;
const HOJA_VENTANA = new URL("estilos/barra-marcadores.css", import.meta.url).href;
/** Lanzador de la barra lateral (<sidebar-main>): de usuario, para llegar a su sombra. */
const HOJA_LANZADOR = new URL("estilos/lanzador.css", import.meta.url).href;
const ICONO_AJUSTES = new URL("estilos/iconos/escudo-ajustes.svg", import.meta.url).href;

/** Panel de «Pestañas de otros dispositivos» (sidebar.main.tools lo llama «syncedtabs»). */
const SINCRONIZADAS = "viewTabsSidebar";
const PREF_AVISO = "aegis.marcadores.aviso_oculto";

const conHoja = new WeakSet();
let observando = false;
let localizacion;

/**
 * Textos de Aegis con su propio Localization síncrono: nunca en el document.l10n de la ventana ni del panel (si
 * aegis.ftl fallara, Fluent dejaría sin traducir lo de Firefox). brand.ftl, para el nombre del navegador.
 *
 * @param {string} id
 * @returns {{value: string?, attributes: Record<string, string>}}
 */
function texto(id) {
  localizacion ??= new Localization(["aegis.ftl", "branding/brand.ftl"], true);
  const [m] = localizacion.formatMessagesSync([{ id }]);
  return {
    value: m?.value ?? null,
    attributes: Object.fromEntries((m?.attributes ?? []).map(a => [a.name, a.value])),
  };
}

/** Nombre del panel (sidebar-history.html…) si el documento es uno de los que cambia Aegis. */
function panel(doc) {
  const uri = doc?.documentURI ?? "";
  if (!uri.startsWith(PREFIJO_PANELES)) {
    return null;
  }
  const nombre = uri.slice(PREFIJO_PANELES.length).split(/[?#]/)[0];
  return PANELES.has(nombre) ? nombre : null;
}

/**
 * Pone las hojas que tocan en un documento de la interfaz, una sola vez: la de usuario en los paneles; en la
 * ventana, la de autor (barra de marcadores) y la de usuario del lanzador. Solo documentos con permisos de sistema
 * (nunca una web).
 *
 * @param {Document} doc
 */
function hojas(doc) {
  const win = doc?.defaultView;
  if (!win || conHoja.has(doc) || !doc.nodePrincipal?.isSystemPrincipal) {
    return;
  }
  const nombre = panel(doc);
  const ventana = doc.documentURI == URL_VENTANA;
  if (!nombre && !ventana) {
    return;
  }
  conHoja.add(doc);
  const utils = win.windowUtils;
  const lista = ventana
    ? [[HOJA_VENTANA, utils.AUTHOR_SHEET], [HOJA_LANZADOR, utils.USER_SHEET]]
    : [[HOJA_PANELES, utils.USER_SHEET]];
  for (const [hoja, tipo] of lista) {
    try {
      utils.loadSheetUsingURIString(hoja, tipo);
    } catch (e) {
      console.error("Aegis: barra lateral, hoja", hoja, e);
    }
  }
  if (nombre == "sidebar-customize.html") {
    // El componente se pinta al cargar el documento (Lit): el pie se completa entonces.
    win.addEventListener("load", () => pieDePersonalizar(doc), { once: true });
  }
}

/**
 * Pie de «Personalizar barra lateral»: en lugar del enlace de Firefox («Administrar los ajustes de…»), una fila
 * «Ajustes de Aegis» con el glifo de ajustes. Abre los Ajustes, igual que el enlace.
 *
 * @param {Document} doc
 */
async function pieDePersonalizar(doc) {
  const componente = doc.querySelector("sidebar-customize");
  await componente?.updateComplete;
  const pie = componente?.shadowRoot?.querySelector("#manage-settings");
  if (!pie || pie.querySelector(".aegis-barra-ajustes")) {
    return;
  }
  const win = doc.defaultView;
  const boton = doc.createElement("button");
  boton.className = "aegis-barra-ajustes";
  const icono = doc.createElement("img");
  icono.className = "aegis-barra-ajustes-icono";
  icono.src = ICONO_AJUSTES;
  icono.alt = "";
  const etiqueta = doc.createElement("span");
  etiqueta.textContent = texto("aegis-barra-ajustes").value ?? "";
  boton.append(icono, etiqueta);
  boton.addEventListener("click", () => {
    win.browsingContext.embedderWindowGlobal?.browsingContext.window?.openPreferences();
  });
  pie.append(boton);
}

/** Cada documento de la interfaz que se crea recibe su hoja antes de pintarse (un evento, sin temporizadores). */
function observar() {
  if (observando) {
    return;
  }
  observando = true;
  Services.obs.addObserver(doc => {
    try {
      hojas(doc);
    } catch (e) {
      console.error("Aegis: barra lateral", e);
    }
  }, "document-element-inserted");
}

/**
 * Sin «Pestañas de otros dispositivos»: es Firefox Sync, que Aegis no usa (la nube del usuario llegará aparte).
 * SidebarController trata como oculta una herramienta cuyo «visible» es falso: no sale en la barra, ni en
 * «Personalizar», ni se puede abrir. sidebar.main.tools (prefs) ya no la trae de serie; esto cubre los perfiles que
 * la tenían.
 *
 * @param {Window} win
 */
function sinPestanasSincronizadas(win) {
  const barra = win.SidebarController;
  const herramienta = barra?.sidebars?.get(SINCRONIZADAS);
  if (!herramienta || Object.getOwnPropertyDescriptor(herramienta, "visible")?.get?.aegis) {
    return;
  }
  const oculta = () => false;
  oculta.aegis = true;
  Object.defineProperty(herramienta, "visible", { get: oculta, configurable: true });
  if (barra.currentID == SINCRONIZADAS) {
    barra.hide();
  }
  win.dispatchEvent(new win.CustomEvent("SidebarItemChanged"));
}

/** Atributo de la barra de marcadores con el aviso descartado (estilos/barra-marcadores.css). */
const ATRIBUTO_AVISO = "aegis-aviso-oculto";
let observandoAviso = false;

/** Pone o quita ATRIBUTO_AVISO en la barra de marcadores de cada ventana según la pref. */
function marcarAvisoOculto() {
  const oculto = Services.prefs.getBoolPref(PREF_AVISO, false);
  for (const win of Services.wm.getEnumerator("navigator:browser")) {
    win.document.getElementById("PersonalToolbar")?.toggleAttribute(ATRIBUTO_AVISO, oculto);
  }
}

/**
 * «Ahora no» junto al aviso de la barra de marcadores vacía. Pulsado, la barra se oculta mientras esté vacía
 * (estilos/barra-marcadores.css lo hace con :has, así que vuelve sola con el primer marcador).
 *
 * La barra lleva el atributo aegis-aviso-oculto, que este módulo pone al pulsar y cuando cambia la pref (en todas las
 * ventanas): un cambio de atributo se aplica en el mismo restilo. Antes la hoja leía la pref con @media -moz-pref(),
 * que depende de que Gecko vuelva a evaluar las consultas de medios de la ventana; el aviso del usuario se quedaba a la
 * vista tras pulsar «Ahora no» y solo se iba al cambiar el tamaño de la ventana (que sí las reevalúa).
 *
 * @param {Window} win
 */
function avisoDeMarcadores(win) {
  const doc = win.document;
  const aviso = doc.getElementById("personal-toolbar-empty");
  if (!observandoAviso) {
    observandoAviso = true;
    Services.prefs.addObserver(PREF_AVISO, marcarAvisoOculto);
  }
  doc.getElementById("PersonalToolbar")?.toggleAttribute(ATRIBUTO_AVISO, Services.prefs.getBoolPref(PREF_AVISO, false));
  if (!aviso || aviso.querySelector(".aegis-aviso-cerrar")) {
    return;
  }
  const { value, attributes } = texto("aegis-marcadores-aviso-cerrar");
  const boton = doc.createElementNS("http://www.w3.org/1999/xhtml", "button");
  boton.className = "aegis-aviso-cerrar";
  boton.textContent = value ?? "";
  if (attributes.title) {
    boton.title = attributes.title;
  }
  boton.addEventListener("click", () => {
    Services.prefs.setBoolPref(PREF_AVISO, true);
    marcarAvisoOculto();
  });
  aviso.append(boton);
}

export const AegisBarraLateral = {
  /**
   * Una vez por arranque (lo llama AegisArranque.inicio): la hoja de cada panel y de la ventana, antes de pintarlos.
   */
  inicio() {
    observar();
  },

  /**
   * Cada ventana del navegador, cuando termina de abrirse (lo llama AegisArranque.ventana). Cubre también lo que
   * se abrió antes del observador (la primera ventana o un panel restaurado).
   *
   * @param {Window} win
   */
  ventana(win) {
    if (!win?.document) {
      return;
    }
    observar();
    for (const [nombre, paso] of [
      ["hoja de la ventana", () => hojas(win.document)],
      ["panel abierto", () => {
        const doc = win.SidebarController?.browser?.contentDocument;
        if (doc && panel(doc)) {
          const ya = conHoja.has(doc);
          hojas(doc);
          if (!ya && panel(doc) == "sidebar-customize.html" && doc.readyState == "complete") {
            pieDePersonalizar(doc).catch(console.error);
          }
        }
      }],
      ["pestañas sincronizadas", () => sinPestanasSincronizadas(win)],
      ["aviso de la barra de marcadores", () => avisoDeMarcadores(win)],
    ]) {
      try {
        paso();
      } catch (e) {
        console.error(`Aegis: barra lateral, ${nombre}`, e);
      }
    }
  },
};
