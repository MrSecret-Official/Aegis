/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · marcadores integrados, como el panel de marcadores de Chrome o Brave.
 *
 * - «Gestionar marcadores» (Ctrl+Mayús+O, menú Marcadores, barra de marcadores, menú de la aplicación…) abre el
 *   panel lateral de marcadores en vez de la ventana Biblioteca. El historial y las descargas siguen yendo a la
 *   Biblioteca, y el propio panel tiene un botón para abrirla (importar, copias de seguridad…).
 * - Al panel nuevo de Firefox (sidebar-bookmarks.html, pref sidebar.updatedBookmarks.enabled) le añade: botón
 *   «Gestionar en una ventana» en la cabecera; título «Todos los marcadores» con ordenar, vista compacta y editar
 *   (con él encendido, un clic en un marcador lo edita en vez de abrirlo); «Nueva carpeta» y, abajo, «Añadir
 *   pestaña actual». El aspecto está en estilos/marcadores.css.
 *
 * Sin parches: se sustituye PlacesCommandHook.showPlacesOrganizer en cada ventana y se completa el panel cuando
 * Firefox avisa de que se ha mostrado (evento SidebarShown). Sin temporizadores ni trabajo en reposo.
 */

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  PlacesUIUtils: "moz-src:///browser/components/places/PlacesUIUtils.sys.mjs",
  PlacesUtils: "resource://gre/modules/PlacesUtils.sys.mjs",
});

const PANEL = "viewBookmarksSidebar";
const URL_PANEL = "chrome://browser/content/sidebar/sidebar-bookmarks.html";
/** Se carga también como hoja de usuario en el panel: es la única que llega dentro de sus componentes (shadow DOM). */
const HOJA = new URL("estilos/marcadores.css", import.meta.url).href;
/** Lo que la Biblioteca abriría para los marcadores (sin argumento, «Mostrar todos los marcadores»). */
const DE_MARCADORES = new Set([undefined, "AllBookmarks", "BookmarksMenu", "BookmarksToolbar", "UnfiledBookmarks"]);

const PREF_ORDEN = "aegis.marcadores.orden"; // «propio» (el de Firefox) | «nombre» | «recientes»
const PREF_VISTA = "aegis.marcadores.vista"; // «normal» | «compacta»
const ORDENES = [
  ["propio", "aegis-marcadores-orden-propio"],
  ["nombre", "aegis-marcadores-orden-nombre"],
  ["recientes", "aegis-marcadores-orden-recientes"],
];

const ICONO = {
  ventana: "chrome://global/skin/icons/open-in-new.svg",
  ordenar: "chrome://browser/skin/sort.svg",
  vista: new URL("estilos/iconos/vista.svg", import.meta.url).href,
  editar: "chrome://global/skin/icons/edit.svg",
  mas: "chrome://global/skin/icons/plus.svg",
};

/** Ventana → el showPlacesOrganizer original de Firefox (abre la Biblioteca). */
const bibliotecas = new WeakMap();
/** Documentos del panel ya completados. */
const completados = new WeakSet();

let localizacion;
/**
 * Textos de Aegis ya traducidos (igual que en AegisArranque): con su propio Localization y nunca en el
 * document.l10n de la ventana, que dejaría sin traducir lo de Firefox si aegis.ftl fallara.
 *
 * @param {string} id
 * @returns {{label?: string, title?: string}}
 */
function textos(id) {
  localizacion ??= new Localization(["aegis.ftl"], true);
  const [mensaje] = localizacion.formatMessagesSync([{ id }]);
  return Object.fromEntries((mensaje?.attributes ?? []).map(a => [a.name, a.value]));
}

const orden = () => Services.prefs.getStringPref(PREF_ORDEN, "propio");
const compacta = () => Services.prefs.getStringPref(PREF_VISTA, "normal") == "compacta";

/** Abre el panel de marcadores en lugar de la Biblioteca; si no se puede (ventana emergente…), la Biblioteca. */
function abrirOrganizador(win, item) {
  const biblioteca = bibliotecas.get(win);
  const barra = win.SidebarController;
  if (!DE_MARCADORES.has(item) || !barra?.sidebars?.has(PANEL) || barra.inSingleTabWindow) {
    return biblioteca(item);
  }
  return barra.show(PANEL).then(
    mostrado => mostrado || biblioteca(item),
    e => {
      console.error("Aegis: panel de marcadores", e);
      biblioteca(item);
    }
  );
}

/**
 * Ordena para mostrar (no cambia los marcadores guardados): carpetas primero y después por nombre o por fecha.
 * Las raíces (Barra, Menú, Otros) mantienen su orden, y las carpetas de consulta («Añadidos recientemente»…), el suyo.
 */
function ordenar(arbol, criterio) {
  if (criterio == "propio") {
    return;
  }
  const nombres = new Intl.Collator(Services.locale.appLocaleAsBCP47, { numeric: true, sensitivity: "base" });
  const porCriterio =
    criterio == "nombre"
      ? (a, b) => nombres.compare(a.title ?? "", b.title ?? "")
      : (a, b) => (b.dateAdded ?? 0) - (a.dateAdded ?? 0);
  const carpeta = nodo => {
    for (const hijo of nodo.children) {
      if (hijo.children && !hijo.isPlaceContainer) {
        carpeta(hijo);
      }
    }
    // Ordenados, los separadores ya no separan nada.
    nodo.children = nodo.children
      .filter(h => h.url || h.children)
      .sort((a, b) => Number(!!b.children) - Number(!!a.children) || porCriterio(a, b));
  };
  for (const raiz of arbol?.children ?? []) {
    if (raiz.children) {
      carpeta(raiz);
    }
  }
}

/** Modo «Editar»: un clic (o Intro) en un marcador abre su diálogo de edición en vez de abrir la página. */
async function editar(win, guid) {
  const info = await lazy.PlacesUtils.bookmarks.fetch({ guid });
  if (info) {
    const node = await lazy.PlacesUIUtils.promiseNodeLikeFromFetchInfo(info);
    await lazy.PlacesUIUtils.showBookmarkDialog({ action: "edit", node }, win);
  }
}

/** El panel de marcadores abierto en esta ventana (el elemento <sidebar-bookmarks>), si lo hay. */
function panelDe(win) {
  const doc = win.SidebarController?.browser?.contentDocument;
  return doc?.documentURI == URL_PANEL ? doc.querySelector("sidebar-bookmarks") : null;
}

async function recargar(panel) {
  panel.bookmarks = await panel.getBookmarksList();
}

/** Menú «Ordenar» (uno por ventana, en su mainPopupSet, como el menú de orden del panel de historial). */
function menuOrden(win) {
  const doc = win.document;
  let menu = doc.getElementById("aegis-marcadores-orden");
  if (!menu) {
    menu = doc.createXULElement("menupopup");
    menu.id = "aegis-marcadores-orden";
    for (const [valor, id] of ORDENES) {
      const item = doc.createXULElement("menuitem");
      item.setAttribute("type", "radio");
      item.setAttribute("name", "aegis-marcadores-orden");
      item.setAttribute("value", valor);
      item.setAttribute("label", textos(id).label ?? valor);
      menu.append(item);
    }
    menu.addEventListener("command", e => {
      Services.prefs.setStringPref(PREF_ORDEN, e.target.getAttribute("value"));
      const panel = panelDe(win);
      if (panel) {
        recargar(panel).catch(console.error);
      }
    });
    doc.getElementById("mainPopupSet").append(menu);
  }
  for (const item of menu.children) {
    item.toggleAttribute("checked", item.getAttribute("value") == orden());
  }
  return menu;
}

/** Botón con el mismo componente que los de Firefox (moz-button), así comparte su forma y su foco. */
function boton(doc, id, { icono, tipo = "icon ghost", clase }) {
  const b = doc.createElement("moz-button");
  const { label, title } = textos(id);
  b.type = tipo;
  b.iconSrc = icono;
  if (tipo.includes("icon")) {
    b.title = title ?? "";
    b.ariaLabel = title ?? "";
  } else {
    b.label = label ?? "";
  }
  if (clase) {
    b.className = clase;
  }
  return b;
}

/** Interruptor de la sección (vista, editar): estado en un atributo de la raíz y en aria-pressed (que moz-button
 * pinta como pulsado). */
function interruptor(b, raiz, atributo, encendido) {
  raiz.toggleAttribute(atributo, encendido);
  b.ariaPressed = String(encendido);
}

/**
 * Completa el panel nuevo de marcadores. Solo cuando tiene la forma que conocemos (Firefox 157); si cambia en
 * otra versión, se deja tal cual en vez de romperlo.
 */
function completarPanel(win) {
  const doc = win.SidebarController?.browser?.contentDocument;
  if (win.SidebarController?.currentID != PANEL || doc?.documentURI != URL_PANEL || completados.has(doc)) {
    return;
  }
  const panel = doc.querySelector("sidebar-bookmarks");
  const caja = panel?.shadowRoot?.querySelector(".sidebar-panel");
  const lista = caja?.querySelector(":scope > .sidebar-panel-scrollable-content");
  const cabecera = caja?.querySelector(":scope > sidebar-panel-header")?.shadowRoot?.querySelector(
    ".sidebar-panel-heading"
  );
  const cerrar = cabecera?.querySelector(":scope > moz-button");
  if (!lista || !cerrar || typeof panel.getBookmarksList != "function") {
    return;
  }
  completados.add(doc);
  const utils = doc.defaultView.windowUtils;
  utils.loadSheetUsingURIString(HOJA, utils.USER_SHEET);

  // Cabecera: «Gestionar en una ventana» junto a cerrar.
  const ventana = boton(doc, "aegis-marcadores-ventana", { icono: ICONO.ventana, clase: "aegis-marcadores-ventana" });
  ventana.addEventListener("click", () => bibliotecas.get(win)?.("AllBookmarks"));
  cerrar.before(ventana);

  // Título de sección y sus acciones.
  const seccion = doc.createElement("div");
  seccion.className = "aegis-marcadores-seccion";
  const titulo = doc.createElement("h3");
  titulo.className = "aegis-marcadores-titulo";
  titulo.textContent = textos("aegis-marcadores-todos").label ?? "";
  const acciones = doc.createElement("div");
  acciones.className = "aegis-marcadores-acciones";

  const ordenarB = boton(doc, "aegis-marcadores-ordenar", { icono: ICONO.ordenar });
  ordenarB.ariaHasPopup = "menu";
  ordenarB.addEventListener("click", e => {
    const menu = menuOrden(win);
    const lado = win.SidebarController._positionStart ? "after_start" : "after_end";
    menu.addEventListener("popuphidden", () => (ordenarB.ariaExpanded = "false"), { once: true });
    ordenarB.ariaExpanded = "true";
    menu.openPopup(ordenarB, lado, 0, 0, false, false, e);
  });

  const raiz = doc.documentElement;
  const vistaB = boton(doc, "aegis-marcadores-vista", { icono: ICONO.vista });
  interruptor(vistaB, raiz, "aegis-compacta", compacta());
  vistaB.addEventListener("click", () => {
    const encendido = !raiz.hasAttribute("aegis-compacta");
    Services.prefs.setStringPref(PREF_VISTA, encendido ? "compacta" : "normal");
    interruptor(vistaB, raiz, "aegis-compacta", encendido);
  });

  const editarB = boton(doc, "aegis-marcadores-editar", { icono: ICONO.editar });
  interruptor(editarB, raiz, "aegis-editar", false);
  editarB.addEventListener("click", () => interruptor(editarB, raiz, "aegis-editar", !raiz.hasAttribute("aegis-editar")));
  // Las filas avisan con fxview-tab-list-primary-action; en captura, antes de que el panel abra la página.
  panel.shadowRoot.addEventListener(
    "fxview-tab-list-primary-action",
    e => {
      const fila = e.originalTarget;
      if (raiz.hasAttribute("aegis-editar") && fila?.localName == "sidebar-bookmark-row" && fila.guid) {
        e.stopPropagation();
        editar(win, fila.guid).catch(console.error);
      }
    },
    { capture: true }
  );

  acciones.append(ordenarB, vistaB, editarB);
  seccion.append(titulo, acciones);

  const carpeta = boton(doc, "aegis-marcadores-nueva-carpeta", {
    icono: ICONO.mas,
    tipo: "ghost",
    clase: "aegis-marcadores-nueva",
  });
  // Sin punto de inserción, el diálogo propone la carpeta de serie de los marcadores y deja elegir otra.
  carpeta.addEventListener("click", () =>
    lazy.PlacesUIUtils.showBookmarkDialog({ action: "add", type: "folder" }, win).catch(console.error)
  );
  lista.before(seccion, carpeta);

  // Pie: «Añadir pestaña actual» (el mismo flujo que la estrella de la barra de direcciones).
  const pie = doc.createElement("div");
  pie.className = "aegis-marcadores-pie";
  const anadir = boton(doc, "aegis-marcadores-anadir-pestana", { icono: ICONO.mas, tipo: "default" });
  anadir.addEventListener("click", () => win.PlacesCommandHook.bookmarkPage().catch(console.error));
  pie.append(anadir);
  lista.after(pie);

  // Orden elegido: Firefox pide el árbol con getBookmarksList() al abrir y con cada cambio de los marcadores.
  const original = panel.getBookmarksList;
  panel.getBookmarksList = async function () {
    const arbol = await original.call(this);
    ordenar(arbol, orden());
    return arbol;
  };
  if (orden() != "propio") {
    recargar(panel).catch(console.error);
  }
}

export const AegisMarcadores = {
  /**
   * Cada ventana del navegador, cuando termina de abrirse (lo llama AegisArranque.ventana).
   *
   * @param {Window} win
   */
  ventana(win) {
    const hook = win?.PlacesCommandHook;
    if (!hook || bibliotecas.has(win)) {
      return;
    }
    const original = hook.showPlacesOrganizer;
    bibliotecas.set(win, item => original.call(hook, item));
    hook.showPlacesOrganizer = item => abrirOrganizador(win, item);
    const completar = () => {
      try {
        completarPanel(win);
      } catch (e) {
        console.error("Aegis: panel de marcadores", e);
      }
    };
    win.addEventListener("SidebarShown", completar);
    // Si el panel ya estaba abierto (sesión restaurada) antes de llegar aquí.
    completar();
  },
};
