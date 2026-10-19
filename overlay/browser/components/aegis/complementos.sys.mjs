/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · Complementos (about:addons) con la forma de Ajustes: cabecera pequeña con el icono y el buscador en la
 * barra lateral, y un estado vacío sobrio (glifo, una frase y un botón) en lugar del zorro y las recomendaciones.
 * También el panel de extensiones de la barra (la pieza de puzle), al estilo de Chrome y Brave: ventana().
 *
 * AegisArranque llama a pagina() para cada documento about:addons, en cuanto se crea (antes de que exista el cuerpo),
 * y a ventana() para cada ventana del navegador.
 * Idempotente y sin temporizadores: solo eventos del propio documento y un MutationObserver sobre #main.
 *
 * - La forma va en estilos/complementos.css (hoja de autor, la pone AegisArranque).
 * - Lo de dentro de los componentes de Firefox (shadow DOM: cabecera de la barra, la tarjeta del estado vacío) va en
 *   estilos/complementos-sombra.css como hoja de usuario, la única que entra en el shadow DOM.
 * - Buscar y «Buscar extensiones» abren addons.mozilla.org en una pestaña, como en Firefox, pero sin los parámetros
 *   utm_* que Firefox añade para atribuir la visita. Es la tienda que el usuario pide al pulsar, igual que abrir una
 *   web; no se vuelve a encender el panel de recomendaciones, que sí pedía datos por su cuenta (63-complementos.js).
 */

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  AddonRepository: "resource://gre/modules/addons/AddonRepository.sys.mjs",
});

const HOJA_SOMBRA = "estilos/complementos-sombra.css";
/** Hoja del panel de extensiones de la barra (en la ventana del navegador). */
const HOJA_PANEL = "estilos/extensiones.css";
const ICONO_AEGIS = "estilos/iconos/aegis-pequeno.svg";
/** Glifo de línea de las extensiones (la pieza de puzle de Aegis, monocroma con context-fill). */
const GLIFO_VACIO = "estilos/iconos/extensiones.svg";
/** Glifo de línea de la chincheta: fijar una extensión en la barra o quitarla. */
const GLIFO_FIJAR = "estilos/iconos/fijar.svg";
const HTML = "http://www.w3.org/1999/xhtml";

const hechos = new WeakSet();
const ventanas = new WeakSet();
let localizacion;

/**
 * Textos de Aegis con su propio Localization síncrono: nunca en el document.l10n de la página (si aegis.ftl fallara,
 * Fluent dejaría sin traducir Complementos entero).
 *
 * @param {string} id
 * @param {object} [args]
 * @returns {string}
 */
function texto(id, args) {
  localizacion ??= new Localization(["aegis.ftl", "branding/brand.ftl"], true);
  const [m] = localizacion.formatMessagesSync([{ id, args }]);
  return m?.value ?? "";
}

/**
 * Abre una dirección web en una pestaña nueva de la ventana del navegador que contiene a win (Complementos, que se carga
 * en una pestaña, o la propia ventana). Es lo que hace Firefox (windowRoot); docShell.chromeEventHandler.ownerGlobal no
 * sirve: desde un módulo llega sin ownerGlobal y el botón no hacía nada.
 */
function abrirEnPestana(win, url) {
  const ventana = win.browsingContext?.topChromeWindow ?? win.windowRoot?.ownerGlobal;
  ventana.openWebLinkIn(url, "tab");
}

/**
 * La tienda de complementos, sección Extensiones, en el idioma del navegador: la dirección que usa Firefox para
 * «buscar más complementos» (extensions.getAddons.link.url, …/%LOCALE%/firefox/) sin los utm_*.
 */
function urlTienda() {
  const base = Services.urlFormatter.formatURLPref("extensions.getAddons.link.url");
  return base.endsWith("/") ? base + "extensions/" : base;
}

/**
 * Cabecera de la barra lateral (icono y «Complementos») con el buscador debajo, en la ranura «subheading» de
 * moz-page-nav (va al final de sus hijos: la ranura decide dónde se ve y así no se mezcla con lo que pinta Lit).
 */
function cabecera(doc) {
  const nav = doc.querySelector("categories-box > moz-page-nav");
  if (!nav || nav.querySelector(":scope > .aegis-complementos-cabecera")) {
    return Boolean(nav);
  }
  const caja = doc.createElement("div");
  caja.className = "aegis-complementos-cabecera";
  caja.slot = "subheading";

  const marca = doc.createElement("div");
  marca.className = "aegis-complementos-marca";
  const icono = doc.createElement("img");
  icono.className = "aegis-complementos-icono";
  icono.src = new URL(ICONO_AEGIS, import.meta.url).href;
  icono.alt = "";
  const titulo = doc.createElement("span");
  titulo.className = "aegis-complementos-titulo";
  titulo.textContent = texto("aegis-complementos-titulo");
  marca.append(icono, titulo);
  caja.append(marca);

  // El buscador de Firefox (search-addons): se mueve tal cual, con su propio texto de ayuda.
  const buscador = doc.querySelector("addon-page-header search-addons");
  if (buscador) {
    caja.append(buscador);
    buscar(doc, buscador);
  }
  nav.append(caja);
  return true;
}

/** El buscador: texto propio y búsqueda sin utm_* (se adelanta al de Firefox, que escucha en el campo y el botón). */
function buscar(doc, buscador) {
  const win = doc.defaultView;
  const campo = buscador.querySelector("moz-input-search");
  if (campo) {
    campo.removeAttribute("data-l10n-id");
    campo.removeAttribute("data-l10n-args");
    campo.removeAttribute("data-l10n-attrs");
    campo.setAttribute("placeholder", texto("aegis-complementos-buscar"));
  }
  const lanzar = e => {
    const esIntro = e.type == "keypress" && e.keyCode == win.KeyEvent.DOM_VK_RETURN;
    const esBoton = e.type == "click" && e.target.closest?.("moz-button");
    if (!esIntro && !esBoton) {
      return;
    }
    e.stopPropagation();
    const consulta = buscador.value?.trim();
    if (consulta) {
      abrirEnPestana(win, lazy.AddonRepository.getSearchURL(consulta));
    }
  };
  buscador.addEventListener("keypress", lanzar, true);
  buscador.addEventListener("click", lanzar, true);
}

/**
 * Estado vacío de Extensiones: Firefox pinta un zorro con piezas de puzle, «A few extensions go a long way» y un
 * botón que abre la tienda con utm_*. Aquí: el glifo de las extensiones, una frase y «Buscar extensiones».
 */
function estadoVacio(doc) {
  const win = doc.defaultView;
  for (const promo of doc.querySelectorAll("addons-promo#empty-addons-promo:not([aegis])")) {
    promo.setAttribute("aegis", "");
    promo.removeAttribute("data-l10n-id");
    promo.heading = "";
    promo.message = texto("aegis-complementos-vacio");
    promo.imageSrc = new URL(GLIFO_VACIO, import.meta.url).href;
    promo.imageAlignment = "center";
    const boton = promo.querySelector(':scope > moz-button[slot="actions"]');
    if (boton) {
      boton.removeAttribute("data-l10n-id");
      boton.size = "default";
      boton.label = texto("aegis-complementos-vacio-boton");
      boton.onclick = () => abrirEnPestana(win, urlTienda());
    }
  }
}

function montar(doc) {
  const win = doc.defaultView;
  // La barra lateral la pinta categories-box (Lit) cuando se define: si aún no está, se espera a ella.
  try {
    if (!cabecera(doc)) {
      win.customElements.whenDefined("categories-box").then(() => {
        const caja = doc.querySelector("categories-box");
        (caja?.updateComplete ?? Promise.resolve()).then(() => {
          try {
            if (cabecera(doc)) {
              doc.documentElement.setAttribute("aegis-complementos", "");
            }
          } catch (e) {
            console.error("Aegis: Complementos, cabecera", e);
          }
        });
      });
    } else {
      doc.documentElement.setAttribute("aegis-complementos", "");
    }
  } catch (e) {
    console.error("Aegis: Complementos, cabecera", e);
  }

  // Las listas se pintan al cambiar de vista: el estado vacío se rehace cada vez que aparece (solo en #main).
  const main = doc.getElementById("main");
  if (main) {
    const aplicar = () => {
      try {
        estadoVacio(doc);
      } catch (e) {
        console.error("Aegis: Complementos, estado vacío", e);
      }
    };
    aplicar();
    new win.MutationObserver(aplicar).observe(main, { childList: true, subtree: true });
  }
}

/**
 * Prepara una página de Complementos. Se puede llamar en cuanto se crea el documento (document-element-inserted) o
 * más tarde; una sola vez por documento.
 *
 * @param {Document} doc
 */
export function pagina(doc) {
  const win = doc?.defaultView;
  if (!win || hechos.has(doc) || !doc.nodePrincipal?.isSystemPrincipal) {
    return;
  }
  hechos.add(doc);
  try {
    const utils = win.windowUtils;
    utils.loadSheetUsingURIString(new URL(HOJA_SOMBRA, import.meta.url).href, utils.USER_SHEET);
  } catch (e) {
    console.error(`Aegis: no se pudo cargar ${HOJA_SOMBRA}`, e);
  }
  if (doc.readyState == "loading") {
    win.addEventListener("DOMContentLoaded", () => montar(doc), { once: true });
  } else {
    montar(doc);
  }
}

/**
 * Panel de extensiones de la barra sin ninguna instalada: debajo del glifo (estilos/extensiones.css), «Aún no tienes
 * extensiones», «Búscalas en la tienda de complementos» y «Buscar extensiones». Se monta una vez, la primera vez que
 * se abre el panel (sale de una plantilla), y la hoja decide cuándo se ve: solo en el caso «sin ninguna extensión»
 * que marca Firefox. Los textos de Firefox de ese caso (recomendaciones) quedan ocultos.
 *
 * @param {Element} vista #unified-extensions-view
 */
function panelVacio(win, vista) {
  const doc = win.document;
  const caja = vista.querySelector("#unified-extensions-empty-state");
  if (!caja || caja.querySelector(":scope > .aegis-extensiones-vacio")) {
    return;
  }
  const crear = (etiqueta, clase, contenido) => {
    const el = doc.createElementNS(HTML, etiqueta);
    el.className = clase;
    el.textContent = contenido;
    return el;
  };
  const boton = crear("button", "aegis-extensiones-vacio-boton", texto("aegis-complementos-vacio-boton"));
  boton.id = "aegis-extensiones-buscar";
  boton.type = "button";
  boton.addEventListener("click", () => {
    vista.closest("panel")?.hidePopup();
    abrirEnPestana(win, urlTienda());
  });
  const bloque = crear("div", "aegis-extensiones-vacio", "");
  bloque.append(
    crear("h2", "aegis-extensiones-vacio-titulo", texto("aegis-extensiones-vacio-titulo")),
    crear("p", "aegis-extensiones-vacio-texto", texto("aegis-extensiones-vacio-texto")),
    boton
  );
  caja.append(bloque);
}

/*
 * Panel de extensiones al estilo de Chrome y Brave (la pieza de puzle de la barra).
 *
 * Firefox ya pinta en el panel las extensiones que no están en la barra (los nodos de CustomizableUI de su acción, en
 * #unified-extensions-area, y las que no caben, en #overflowed-extensions-list). Un nodo de CustomizableUI vive en un
 * solo sitio por ventana, así que las fijadas en la barra no se pueden reutilizar en el panel. Por eso:
 * - arriba, una sección propia «En la barra» (#aegis-ext-barra) con las fijadas: icono, nombre y la chincheta; pulsar
 *   la fila es pulsar su botón de la barra (triggerAction de ext-browserAction: abre su ventanita o lanza su acción);
 * - debajo, la lista de Firefox tal cual, con la chincheta añadida en cada fila (antes del «…»);
 * - en el pie, «Gestionar extensiones» (about:addons, como el botón de Firefox, que se oculta) y «Añadir
 *   extensiones» (la tienda en una pestaña, solo al pulsar: la misma dirección que el estado vacío).
 * Fijar es lo que hace el menú contextual de Firefox: a la barra de navegación o, al quitarla, al principio del panel.
 * Las extensiones sin botón (sin browser_action) no se pueden fijar: se quedan en la lista de Firefox sin chincheta.
 *
 * Sin trabajo en reposo: se pinta al abrir el panel, y mientras está abierto un oyente de CustomizableUI lo repinta si
 * cambia algo (fijar desde aquí o desde el menú contextual); al cerrarse, el oyente se quita.
 */

/**
 * El botón de extensiones abre siempre el panel si hay alguna extensión activa.
 *
 * Firefox (browser-addons.js, gUnifiedExtensions.togglePanel) abre about:addons en lugar del panel cuando hay
 * extensiones activas pero ninguna «en el panel» (todas fijadas en la barra) según hasExtensionsInPanel(). Con el
 * panel de Aegis eso ya no tiene sentido: el panel lista también las fijadas. Sin parche, se envuelven dos métodos del
 * objeto de la ventana:
 * - togglePanel levanta una marca solo mientras corre su parte síncrona (hasta su primer await), que es donde está esa
 *   comprobación; luego la baja (finally).
 * - hasExtensionsInPanel responde «sí» si la marca está levantada y la ventana tiene extensiones activas; en cualquier
 *   otro momento (al pintar el panel, el aviso de dominios en cuarentena) responde lo de Firefox.
 * No cambia nada más: sin ninguna extensión (estado vacío de Aegis), en una ventana privada con extensiones sin
 * permiso o con extensiones desactivadas, Firefox ya abría el panel y lo sigue haciendo con sus mismos textos.
 *
 * Si Firefox cambia esto (tools/verificar.py lo comprueba contra el árbol fijado): si la comprobación pasa detrás de
 * un await o hasExtensionsInPanel cambia de nombre, la marca ya no llega y el botón vuelve a abrir about:addons cuando
 * todas están fijadas (no se rompe nada: se pierde el atajo al panel). Si togglePanel o hasExtensionsInPanel
 * desaparecen, no se envuelve nada y queda un console.error.
 *
 * @param {Window} win
 */
function panelSiempre(win) {
  const ue = win.gUnifiedExtensions;
  if (!ue || ue.aegisPanelSiempre) {
    return;
  }
  const { togglePanel, hasExtensionsInPanel } = ue;
  if (typeof togglePanel != "function" || typeof hasExtensionsInPanel != "function") {
    console.error("Aegis: panel de extensiones: gUnifiedExtensions ya no tiene togglePanel o hasExtensionsInPanel");
    return;
  }
  let abriendo = false;
  ue.hasExtensionsInPanel = function (policies) {
    if (abriendo && (policies ?? this.getActivePolicies()).length) {
      return true;
    }
    return hasExtensionsInPanel.call(this, policies);
  };
  ue.togglePanel = function (...args) {
    abriendo = true;
    try {
      return togglePanel.apply(this, args);
    } finally {
      abriendo = false;
    }
  };
  ue.aegisPanelSiempre = true;
}

/** Cierra el panel de extensiones como lo cierra Firefox (PanelMultiView), con hidePopup de reserva. */
function cerrarPanel(win, vista) {
  const panel = vista.closest("panel");
  if (!panel) {
    return;
  }
  if (win.PanelMultiView) {
    win.PanelMultiView.hidePopup(panel);
  } else {
    panel.hidePopup();
  }
}

/** ¿Está la extensión (su widget de CustomizableUI) colocada en una barra? Lo mismo que mira Firefox para fijar. */
function enBarra(win, widgetId) {
  const CUI = win.CustomizableUI;
  const area = CUI.getPlacementOfWidget(widgetId)?.area;
  return Boolean(area) && CUI.getAreaType(area) == CUI.TYPE_TOOLBAR;
}

/**
 * Fija la extensión en la barra de navegación o la devuelve al panel, como «Fijar en la barra» del menú contextual de
 * Firefox (onPinToToolbarChange): si su nodo estaba en el panel porque su barra está plegada, antes vuelve a su sitio.
 */
function cambiarFijada(win, widgetId, fijar) {
  const ue = win.gUnifiedExtensions;
  if (fijar) {
    ue._maybeMoveWidgetNodeBack?.(widgetId);
  }
  ue.pinToToolbar(widgetId, fijar);
}

/** Texto y estado de una chincheta: el texto dice lo que hace al pulsarla. */
function estadoChincheta(boton, nombre, fijada) {
  boton.toggleAttribute("fijada", fijada);
  const t = texto(fijada ? "aegis-extensiones-desfijar" : "aegis-extensiones-fijar", { nombre });
  boton.setAttribute("tooltiptext", t);
  boton.setAttribute("aria-label", t);
}

/**
 * Chincheta de una extensión. Solo se llega con el tabulador, como el «…» de Firefox: las flechas van de fila en fila
 * (data-navigable-with-tab-only, PanelMultiView). closemenu="none" y stopPropagation: el panel se queda abierto y el
 * comando no llega al widget de CustomizableUI (su onBeforeCommand no lo reconoce y no haría nada, pero así ni lo ve).
 */
function chincheta(win, vista, widgetId) {
  const doc = win.document;
  const boton = doc.createXULElement("toolbarbutton");
  boton.className = "aegis-ext-fijar";
  boton.setAttribute("aegis-widget", widgetId);
  boton.setAttribute("closemenu", "none");
  boton.setAttribute("data-navigable-with-tab-only", "true");
  // Enfocable sin estar en el orden de tabulación del documento: lo recorre PanelMultiView, que pone el mismo
  // tabindex a lo que visita; así también se le puede dar el foco al moverla de sección.
  boton.setAttribute("tabindex", "-1");
  boton.setAttribute("image", new URL(GLIFO_FIJAR, import.meta.url).href);
  boton.addEventListener("command", e => {
    e.stopPropagation();
    const conFoco = doc.activeElement == boton;
    try {
      cambiarFijada(win, widgetId, !boton.hasAttribute("fijada"));
      pintar(win, vista);
    } catch (err) {
      console.error("Aegis: panel de extensiones, fijar", err);
      return;
    }
    // Con el teclado, el foco sigue a la extensión a su nuevo sitio (su fila ha cambiado de sección), y también la
    // selección de PanelMultiView: si no, el siguiente Tab partiría del botón quitado y volvería al principio.
    if (conFoco) {
      const otra = vista.querySelector(`.aegis-ext-fijar[aegis-widget="${win.CSS.escape(widgetId)}"]`);
      if (otra?.checkVisibility()) {
        otra.focus();
        try {
          win.PanelView.forNode(vista).selectedElement = otra;
        } catch (err) {
          console.error("Aegis: panel de extensiones, foco", err);
        }
      }
    }
  });
  return boton;
}

/**
 * Fila de una extensión fijada: su icono (el mismo que pone Firefox en el panel, --webextension-menupanel-image, que
 * ext-browserAction deja en el estilo del botón de la barra), su nombre y la chincheta.
 */
function filaFijada(win, vista, policy, widgetId, nodo) {
  const doc = win.document;
  const delBoton = nodo.querySelector(".unified-extensions-item-action-button");

  const fila = doc.createXULElement("hbox");
  fila.className = "aegis-ext-fila";
  fila.setAttribute("align", "center");

  const accion = doc.createXULElement("toolbarbutton");
  accion.className = "aegis-ext-accion";
  accion.setAttribute("label", policy.name);
  accion.setAttribute("crop", "end");
  accion.setAttribute("tooltiptext", policy.name);
  for (const [de, a] of [
    ["--webextension-menupanel-image", "--aegis-ext-icono"],
    ["--webextension-menupanel-image-dark", "--aegis-ext-icono-oscuro"],
  ]) {
    const valor = delBoton?.style.getPropertyValue(de).trim();
    if (valor) {
      accion.style.setProperty(a, valor);
    }
  }
  if (delBoton?.hasAttribute("disabled")) {
    accion.setAttribute("disabled", "true");
  }
  accion.addEventListener("command", e => {
    e.stopPropagation();
    // Primero se cierra el panel y luego se pulsa el botón de la barra: la ventanita de la extensión se ancla a él.
    const panel = vista.closest("panel");
    const lanzar = () => {
      try {
        win.gUnifiedExtensions.browserActionFor(policy)?.triggerAction(win);
      } catch (err) {
        console.error("Aegis: panel de extensiones, acción", err);
      }
    };
    if (panel && panel.state != "closed") {
      const alCerrar = ev => {
        if (ev.target == panel) {
          panel.removeEventListener("popuphidden", alCerrar);
          lanzar();
        }
      };
      panel.addEventListener("popuphidden", alCerrar);
      cerrarPanel(win, vista);
    } else {
      lanzar();
    }
  });

  const fijar = chincheta(win, vista, widgetId);
  estadoChincheta(fijar, policy.name, true);
  fila.append(accion, fijar);
  return fila;
}

/** «En la barra»: las extensiones con botón fijadas en una barra visible de esta ventana, por nombre. */
function pintarBarra(win, vista) {
  const seccion = vista.querySelector("#aegis-ext-barra");
  if (!seccion) {
    return;
  }
  const ue = win.gUnifiedExtensions;
  const CUI = win.CustomizableUI;
  const filas = [];
  for (const policy of ue.getActivePolicies()) {
    const widget = ue.browserActionFor(policy)?.widget;
    if (!widget || widget.areaType !== CUI.TYPE_TOOLBAR) {
      continue;
    }
    const enVentana = widget.forWindow(win);
    const nodo = enVentana?.node;
    // Las que no caben o están en una barra plegada ya las enseña Firefox en el panel (con su chincheta).
    if (!nodo || enVentana.overflowed || nodo.getAttribute("overflowedItem") == "true") {
      continue;
    }
    filas.push({ nombre: policy.name, fila: filaFijada(win, vista, policy, widget.id, nodo) });
  }
  filas.sort((a, b) => a.nombre.localeCompare(b.nombre));
  for (const vieja of seccion.querySelectorAll(":scope > .aegis-ext-fila")) {
    vieja.remove();
  }
  seccion.append(...filas.map(f => f.fila));
  seccion.hidden = !filas.length;
}

/** La chincheta en cada fila de Firefox con botón (en el panel o desbordada), antes de su «…». */
function pintarLista(win, vista) {
  const nodos = vista.querySelectorAll(
    ":is(#unified-extensions-area, #overflowed-extensions-list) > toolbaritem.unified-extensions-item"
  );
  for (const nodo of nodos) {
    const fila = nodo.querySelector(":scope > .unified-extensions-item-row-wrapper");
    if (!fila || !nodo.id) {
      continue;
    }
    let boton = fila.querySelector(":scope > .aegis-ext-fijar");
    if (!boton) {
      boton = chincheta(win, vista, nodo.id);
      fila.insertBefore(boton, fila.querySelector(":scope > .unified-extensions-item-menu-button"));
    }
    const id = nodo.getAttribute("data-extensionid");
    const nombre =
      (id && win.WebExtensionPolicy.getByID(id)?.name) ||
      nodo.querySelector(".unified-extensions-item-name")?.textContent ||
      "";
    estadoChincheta(boton, nombre, enBarra(win, nodo.id));
  }
}

function pintar(win, vista) {
  pintarBarra(win, vista);
  pintarLista(win, vista);
}

/** Botón del pie: cierra el panel y hace lo suyo. */
function botonPie(win, vista, id, contenido, accion) {
  const boton = win.document.createXULElement("toolbarbutton");
  boton.id = id;
  boton.className = "aegis-ext-pie-boton";
  boton.setAttribute("label", contenido);
  boton.addEventListener("command", e => {
    e.stopPropagation();
    cerrarPanel(win, vista);
    try {
      accion();
    } catch (err) {
      console.error(`Aegis: panel de extensiones, ${id}`, err);
    }
  });
  return boton;
}

/**
 * Monta lo de Aegis en la vista del panel (una vez: la vista sale de una plantilla la primera vez que se abre y luego
 * se queda): el estado vacío, la sección «En la barra», la etiqueta de la lista de Firefox y el pie.
 *
 * @param {Window} win
 * @param {Element} vista #unified-extensions-view
 * @returns {Function} lo que hay que hacer cada vez que se abre el panel
 */
function montarPanel(win, vista) {
  const doc = win.document;
  panelVacio(win, vista);

  const desbordadas = vista.querySelector("#overflowed-extensions-list");
  if (desbordadas && !vista.querySelector("#aegis-ext-barra")) {
    const etiqueta = (id, clave) => {
      const el = doc.createXULElement("label");
      el.id = id;
      el.className = "aegis-ext-etiqueta";
      el.setAttribute("value", texto(clave));
      return el;
    };
    // context="" como el estado vacío de Firefox: el menú contextual del panel es para sus filas, no para estas.
    const seccion = doc.createXULElement("vbox");
    seccion.id = "aegis-ext-barra";
    seccion.setAttribute("context", "");
    seccion.setAttribute("closemenu", "none");
    seccion.setAttribute("role", "group");
    seccion.setAttribute("aria-labelledby", "aegis-ext-etiqueta-barra");
    seccion.hidden = true;
    seccion.append(etiqueta("aegis-ext-etiqueta-barra", "aegis-extensiones-en-barra"));
    // La de la lista de Firefox solo se ve si hay filas arriba y abajo (estilos/extensiones.css).
    const otras = etiqueta("aegis-ext-etiqueta-panel", "aegis-extensiones-en-panel");
    otras.setAttribute("context", "");
    desbordadas.before(seccion, otras);
  }

  const gestionar = vista.querySelector("#unified-extensions-manage-extensions");
  if (gestionar && !vista.querySelector("#aegis-ext-pie")) {
    const pie = doc.createXULElement("hbox");
    pie.id = "aegis-ext-pie";
    pie.setAttribute("closemenu", "none");
    pie.append(
      botonPie(win, vista, "aegis-ext-gestionar", texto("aegis-extensiones-gestionar"), () =>
        win.BrowserAddonUI.openAddonsMgr("addons://list/extension")
      ),
      botonPie(win, vista, "aegis-ext-anadir", texto("aegis-extensiones-anadir"), () =>
        abrirEnPestana(win, urlTienda())
      )
    );
    gestionar.after(pie);
  }

  // Mientras el panel está abierto: repintar si se fija o se quita una extensión (desde aquí o desde el menú
  // contextual de Firefox) o si una deja de caber en la barra. Solo widgets de extensiones y de esta ventana.
  const CUI = win.CustomizableUI;
  const repintar = () => {
    try {
      pintar(win, vista);
    } catch (e) {
      console.error("Aegis: panel de extensiones", e);
    }
  };
  const deExtension = id => CUI.isWebExtensionWidget(id);
  const oyente = {
    onWidgetAdded: id => deExtension(id) && repintar(),
    onWidgetMoved: id => deExtension(id) && repintar(),
    onWidgetRemoved: id => deExtension(id) && repintar(),
    // ownerDocument.defaultView y no ownerGlobal: desde un módulo el nodo llega sin él y la comparación siempre fallaba.
    onWidgetOverflow: nodo => nodo.ownerDocument?.defaultView == win && repintar(),
    onWidgetUnderflow: nodo => nodo.ownerDocument?.defaultView == win && repintar(),
  };
  let escuchando = false;
  const alAbrir = () => {
    repintar();
    if (!escuchando) {
      escuchando = true;
      CUI.addListener(oyente);
    }
  };
  const dejar = () => {
    if (escuchando) {
      escuchando = false;
      CUI.removeListener(oyente);
    }
  };
  vista.addEventListener("ViewShowing", alAbrir);
  vista.addEventListener("ViewHiding", dejar);
  win.addEventListener("unload", dejar, { once: true });
  return alAbrir;
}

/**
 * Prepara una ventana del navegador: la hoja del panel de extensiones, que el botón abra siempre el panel y, la primera
 * vez que se abre ese panel, lo de Aegis dentro (montarPanel). Sin trabajo en reposo: un solo oyente de ViewShowing
 * en la ventana que se quita en cuanto se ha montado; después, los de la propia vista.
 *
 * @param {Window} win
 */
export function ventana(win) {
  if (!win?.document || ventanas.has(win)) {
    return;
  }
  ventanas.add(win);
  try {
    const utils = win.windowUtils;
    utils.loadSheetUsingURIString(new URL(HOJA_PANEL, import.meta.url).href, utils.AUTHOR_SHEET);
  } catch (e) {
    console.error(`Aegis: no se pudo cargar ${HOJA_PANEL}`, e);
  }
  try {
    panelSiempre(win);
  } catch (e) {
    console.error("Aegis: panel de extensiones, botón", e);
  }
  // En captura: llega antes de que Firefox rellene el panel (su oyente está en la propia vista). La primera vez se pinta
  // aquí mismo; pintar es idempotente, así que no importa si el ViewShowing de la vista recién añadido también lo recibe.
  const alMostrar = e => {
    if (e.target?.id != "unified-extensions-view") {
      return;
    }
    win.removeEventListener("ViewShowing", alMostrar, true);
    try {
      montarPanel(win, e.target)();
    } catch (err) {
      console.error("Aegis: panel de extensiones", err);
    }
  };
  win.addEventListener("ViewShowing", alMostrar, true);
}
