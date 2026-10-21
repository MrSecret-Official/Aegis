/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · cambio rápido de contenedor desde la barra de direcciones (docs/DISENO.md §9, «Selector de contenedor»).
 *
 * - Firefox enseña el contenedor de la pestaña en la barra (#userContext-icons, que pinta
 *   Tabbrowser.updateUserContextUIIndicator) y, al pulsarlo, un menú con solo «Añadir nuevo contenedor» y «Gestionar
 *   contenedores». Aegis abre en su lugar su panel: un oyente en captura sobre el propio indicador va antes que el de
 *   Firefox y lo para. Sin contenedor, el indicador está oculto y en su sitio va el botón propio #aegis-contenedor-button
 *   (solo el glifo), así siempre hay dónde pulsar. Ctrl+Mayús+L abre el panel desde cualquier sitio.
 * - El panel lista «Sin contenedor» y los contenedores (ContextualIdentityService): la fila reabre la pestaña en ese
 *   contenedor y su «+» abre una pestaña nueva en él. Firefox no puede cambiar el contenedor de una pestaña abierta: se
 *   abre la misma dirección en el elegido, en el mismo sitio (fijada, en su grupo, silenciada), con el principal que usa
 *   «Abrir en nueva pestaña contenedora» de Firefox (TabContextMenu.reopenInContainer), y se cierra la de antes, que
 *   queda en «Reabrir pestañas cerradas». La página se vuelve a cargar sin las cookies del otro contenedor: el panel lo
 *   dice y, si SessionStore guarda algo escrito en un formulario de la pestaña, avisa de que se perderá.
 * - Pie: «Nuevo contenedor…» (el panel de creación de Firefox, ContainerCreationPanel) y «Gestionar» (Ajustes ›
 *   Contenedores).
 * - Teclado: flechas arriba y abajo entre filas, derecha e izquierda entre la fila y su «+», Inicio y Fin, Intro reabre
 *   (Mayús+Intro, pestaña nueva), 0 (sin contenedor) y 1–9 eligen una fila (con Mayús, pestaña nueva) y Esc cierra.
 *
 * Sin red ni temporizadores: el panel se pinta cada vez que se abre y no escucha nada mientras está cerrado. En las
 * ventanas privadas no hay contenedores (Firefox no los usa ahí): ni botón, ni atajo, ni panel.
 */

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  ContextualIdentityService: "moz-src:///toolkit/components/contextualidentity/ContextualIdentityService.sys.mjs",
  E10SUtils: "resource://gre/modules/E10SUtils.sys.mjs",
  PrivateBrowsingUtils: "resource://gre/modules/PrivateBrowsingUtils.sys.mjs",
  SessionStore: "moz-src:///browser/components/sessionstore/SessionStore.sys.mjs",
  ShortcutUtils: "resource://gre/modules/ShortcutUtils.sys.mjs",
  TabStateFlusher: "moz-src:///browser/components/sessionstore/TabStateFlusher.sys.mjs",
});

const HTML = "http://www.w3.org/1999/xhtml";
const PREF_CONTENEDORES = "privacy.userContext.enabled";
const icono = nombre => new URL(`estilos/iconos/${nombre}.svg`, import.meta.url).href;
/** Cambios de los contenedores (crear, editar, quitar, ordenar): si el panel está abierto, se repinta. */
const TEMAS = [
  "contextual-identity-created",
  "contextual-identity-updated",
  "contextual-identity-deleted",
  "contextual-identity-reordered",
];

let localizacion;
/**
 * Textos de Aegis con su propio Localization síncrono: nunca en el document.l10n de la ventana (si aegis.ftl fallara,
 * Fluent dejaría sin traducir lo que Firefox crea después). brand.ftl, para el nombre del navegador.
 *
 * @param {string} id
 * @param {object} [args]
 * @returns {{value: string, attributes: Record<string, string>}}
 */
function texto(id, args) {
  localizacion ??= new Localization(["aegis.ftl", "branding/brand.ftl"], true);
  const [m] = localizacion.formatMessagesSync([{ id, args }]);
  return {
    value: m?.value ?? "",
    attributes: Object.fromEntries((m?.attributes ?? []).map(a => [a.name, a.value])),
  };
}

function h(doc, etiqueta, props = {}, ...hijos) {
  const el = doc.createElementNS(HTML, etiqueta);
  for (const [k, v] of Object.entries(props)) {
    if (k.startsWith("aria-") || k.startsWith("data-") || k == "role" || k == "tabindex") {
      el.setAttribute(k, v);
    } else {
      el[k] = v;
    }
  }
  el.append(...hijos.filter(x => x != null));
  return el;
}

function glifo(doc, nombre, clase) {
  return h(doc, "img", { className: clase, src: icono(nombre), alt: "" });
}

/** ¿Hay contenedores en esta ventana? (activados y fuera de una ventana privada) */
function disponible(win) {
  // Sin ventana (BrowserWindowTracker.getTopWindow() puede dar null), no.
  return !!win && Services.prefs.getBoolPref(PREF_CONTENEDORES, false) && !lazy.PrivateBrowsingUtils.isWindowPrivate(win);
}

/** El contenedor de una pestaña: 0 sin contenedor. */
const contenedorDe = tab => Number(tab?.getAttribute("usercontextid") || 0);

/** ¿Tiene la pestaña una web (y no la nueva pestaña, about:blank o una página propia del navegador)? */
function esWeb(tab) {
  const uri = tab?.linkedBrowser?.currentURI;
  return !!uri && (uri.schemeIs("http") || uri.schemeIs("https") || uri.schemeIs("file"));
}

/** Por ventana: {boton, panel, partes, atajo}. */
const ventanas = new Map();

// ── Reabrir y abrir ─────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Reabre la pestaña en otro contenedor: la misma dirección, en el mismo sitio, y cierra la de antes (queda en «Reabrir
 * pestañas cerradas»). El principal, como TabContextMenu.reopenInContainer de Firefox: el de la página con el
 * contenedor nuevo (o el del sistema para las páginas del navegador).
 *
 * Antes de abrir nada, la web puede pedir confirmar que se sale (beforeunload): si el usuario se queda, no cambia nada.
 * No se toca una pestaña oculta, la de Firefox View, una que ya se está cerrando ni una ventana privada (ahí no hay
 * contenedores). Una pestaña que aún carga su primera página (about:blank) se reabre con lo que se pidió
 * (userTypedValue, arreglado como en la barra y solo si es http o https, con un principal nulo: lo puede haber puesto
 * una web); si no, no se hace nada. En una vista dividida, la nueva ocupa el sitio de la vieja.
 *
 * @param {Window} win
 * @param {MozTabbrowserTab} tab
 * @param {number} userContextId 0 = sin contenedor
 * @returns {Promise<MozTabbrowserTab | null>} la pestaña nueva
 */
async function reabrir(win, tab, userContextId) {
  const gBrowser = win.gBrowser;
  if (
    !tab ||
    tab.closing ||
    tab.hidden ||
    tab == win.FirefoxViewHandler?.tab ||
    lazy.PrivateBrowsingUtils.isWindowPrivate(win) ||
    contenedorDe(tab) == userContextId
  ) {
    return null;
  }
  const browser = tab.linkedBrowser;
  let url = browser.currentURI.spec;
  let delUsuario = false;
  if (url == "about:blank" && (browser.userTypedValue || tab.hasAttribute("busy"))) {
    // Aún sin su primera página (recién abierta o cargándola: Firefox no marca «busy» hasta que empieza): lo que se
    // pidió, que es lo que enseña la barra. Si no se sabe, no se hace nada.
    // Solo http y https: Tabbrowser.addTab pone userTypedValue también a las pestañas que abre una web, así que aquí
    // puede haber una dirección que Firefox le ha negado (about:config, file:///…), y se cargaría con el principal del
    // sistema. Con cualquier otro esquema, no se hace nada.
    // Además se pasa por el arreglo de direcciones de la barra, sin buscar palabras clave (como lo cargaría Firefox).
    let arreglada = null;
    try {
      arreglada = Services.uriFixup.getFixupURIInfo(browser.userTypedValue ?? "", Ci.nsIURIFixup.FIXUP_FLAG_NONE)
        .preferredURI;
    } catch (e) {
      arreglada = null;
    }
    if (!arreglada || !(arreglada.schemeIs("http") || arreglada.schemeIs("https"))) {
      return null;
    }
    url = arreglada.spec;
    delUsuario = true;
  }
  if (tab.linkedPanel && (await gBrowser.runBeforeUnloadForTabs([tab]))) {
    return null; // la web ha pedido confirmar y el usuario se queda
  }
  if (tab.closing || !tab.isConnected) {
    return null;
  }
  let principal;
  if (delUsuario) {
    // La dirección puede haberla puesto una web: se carga sin privilegios, con un principal nulo del contenedor de
    // destino (lo que hace TabContextMenu.reopenInContainer cuando no hay principal).
    principal = Services.scriptSecurityManager.createNullPrincipal({ userContextId });
  } else if (tab.linkedPanel) {
    principal = tab.linkedBrowser.contentPrincipal;
  } else {
    // Pestaña sin cargar (restaurada y aún no vista): el principal que guardó SessionStore.
    try {
      const estado = JSON.parse(lazy.SessionStore.getTabState(tab));
      principal = lazy.E10SUtils.deserializePrincipal(estado.triggeringPrincipal_base64);
    } catch (e) {
      principal = null;
    }
  }
  if (!principal || principal.isNullPrincipal) {
    principal = Services.scriptSecurityManager.createNullPrincipal({ userContextId });
  } else if (principal.isContentPrincipal) {
    principal = Services.scriptSecurityManager.principalWithOA(principal, { userContextId });
  }
  const seleccionada = gBrowser.selectedTab == tab;
  const opciones = {
    userContextId,
    pinned: tab.pinned,
    tabIndex: tab.index + 1,
    triggeringPrincipal: principal,
  };
  if (tab.group) {
    opciones.tabGroup = tab.group;
  }
  const nueva = gBrowser.addTab(url, opciones);
  if (tab.muted && !nueva.muted) {
    nueva.toggleMuteAudio(tab.muteReason);
  }
  if (tab.splitview) {
    // Vista dividida: la nueva ocupa el sitio de la vieja (Firefox la elige y quita la vieja). replaceTab la cierra con
    // removeTab sin skipPermitUnload; ya se ha preguntado a la web (arriba), así que se marca como pendiente de esa
    // pregunta: #beginRemoveTab de Tabbrowser no vuelve a preguntar con _pendingPermitUnload puesto (lo vigila
    // tools/verificar.py).
    tab._pendingPermitUnload = true;
    try {
      tab.splitview.replaceTab(tab, nueva);
    } finally {
      tab._pendingPermitUnload = false;
    }
    return nueva;
  }
  if (seleccionada) {
    gBrowser.selectedTab = nueva;
  }
  // Ya se ha preguntado a la web (arriba): no se vuelve a preguntar.
  gBrowser.removeTab(tab, { animate: false, skipPermitUnload: true });
  return nueva;
}

/** Una pestaña nueva (la página de nueva pestaña) en ese contenedor, como el menú del «+» de Firefox. */
function nuevaPestana(win, userContextId) {
  win.openTrustedLinkIn(win.BROWSER_NEW_TAB_URL, "tab", { userContextId });
}

// ── Botón de la barra ─────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Botón «Contenedor» (#aegis-contenedor-button) justo detrás del indicador de Firefox, en #page-action-buttons. El CSS
 * (estilos/contenedores.css) lo oculta mientras el indicador se ve: así hay un solo control en la barra.
 */
function crearBoton(win) {
  const doc = win.document;
  const indicador = doc.getElementById("userContext-icons");
  if (!indicador) {
    return null;
  }
  const boton = doc.createXULElement("hbox");
  boton.id = "aegis-contenedor-button";
  boton.className = "urlbar-page-action";
  boton.setAttribute("role", "button");
  boton.setAttribute("aria-haspopup", "dialog");
  boton.setAttribute("aria-expanded", "false");
  const imagen = doc.createXULElement("image");
  imagen.className = "urlbar-icon";
  boton.append(imagen);
  indicador.after(boton);

  const abrir = (ancla, e) => {
    if ((e.type == "click" && e.button != 0) || (e.type == "keypress" && ![" ", "Enter"].includes(e.key))) {
      return;
    }
    e.preventDefault();
    // El menú de Firefox del indicador no se abre: el panel de Aegis lo sustituye.
    e.stopImmediatePropagation();
    alternar(win, ancla, e);
  };
  boton.addEventListener("click", e => abrir(boton, e));
  boton.addEventListener("keypress", e => abrir(boton, e));
  // En captura sobre el propio indicador: va antes que el oyente de Firefox (main-popupset.js).
  indicador.addEventListener("click", e => abrir(indicador, e), true);
  indicador.addEventListener("keypress", e => abrir(indicador, e), true);
  indicador.setAttribute("aria-haspopup", "dialog");
  return boton;
}

/**
 * Atajo Ctrl+Mayús+L en un keyset propio (como el de Tor) y su orden. No Alt+Mayús+letra: en Windows es la tecla de las
 * accesskey de las webs (ui.key.contentAccess) y una web con accesskey="c" se lo quedaba. En Firefox 158, Ctrl+Mayús+L
 * no está en browser-sets.inc.xhtml; solo lo usa la consola de las herramientas de desarrollo («Limpiar la consola»),
 * que gana mientras tiene el foco (llama a preventDefault). Fuera de ella, la tecla abre el panel. Sin reserved="true":
 * una web que use Ctrl+Mayús+L (alinear a la izquierda en los editores de documentos) se la queda con preventDefault,
 * como con cualquier atajo no reservado del navegador.
 */
function crearAtajo(win) {
  const doc = win.document;
  const comando = doc.createXULElement("command");
  comando.id = "aegis-cmd-contenedores";
  comando.addEventListener("command", () => alternar(win));
  (doc.getElementById("mainCommandSet") ?? doc.documentElement).append(comando);
  const teclas = doc.createXULElement("keyset");
  teclas.id = "aegis-keyset-contenedores";
  const tecla = doc.createXULElement("key");
  tecla.id = "aegis-key-contenedores";
  tecla.setAttribute("key", "L");
  tecla.setAttribute("modifiers", "accel,shift");
  tecla.setAttribute("command", comando.id);
  teclas.append(tecla);
  (doc.getElementById("mainKeyset")?.parentNode ?? doc.documentElement).append(teclas);
  return tecla;
}

/** Texto de ayuda del botón, con el atajo escrito como lo escribe el sistema en cada idioma. */
function pintarBoton(win) {
  const e = ventanas.get(win);
  if (!e?.boton) {
    return;
  }
  const atajo = e.tecla ? lazy.ShortcutUtils.prettifyShortcut(e.tecla) : "";
  const ayuda = texto("aegis-contenedores-boton", { atajo }).attributes.tooltiptext ?? "";
  e.boton.setAttribute("tooltiptext", ayuda);
  e.boton.setAttribute("aria-label", ayuda);
  e.boton.hidden = !disponible(win);
}

// ── Panel ─────────────────────────────────────────────────────────────────────────────────────────────────────────

function crearPanel(win) {
  const doc = win.document;
  const panel = doc.createXULElement("panel");
  panel.id = "aegis-contenedores-panel";
  panel.setAttribute("type", "arrow");
  panel.setAttribute("role", "dialog");
  panel.setAttribute("orient", "vertical");
  panel.setAttribute("aria-labelledby", "aegis-contenedores-titulo");
  panel.setAttribute("aria-describedby", "aegis-contenedores-actual");

  const titulo = h(doc, "h2", { id: "aegis-contenedores-titulo", className: "aegis-contenedores-titulo" });
  const actual = h(doc, "p", { id: "aegis-contenedores-actual", className: "aegis-contenedores-actual" });
  const atajo = h(doc, "span", { className: "aegis-contenedores-atajo", "aria-hidden": "true" });
  const cabecera = h(
    doc,
    "div",
    { className: "aegis-contenedores-cabecera" },
    h(doc, "div", { className: "aegis-contenedores-cabecera-textos" }, titulo, actual),
    atajo
  );
  const etiqueta = h(doc, "p", { id: "aegis-contenedores-etiqueta", className: "aegis-contenedores-etiqueta" });
  const lista = h(doc, "div", {
    className: "aegis-contenedores-lista",
    role: "group",
    "aria-labelledby": "aegis-contenedores-etiqueta",
  });
  const avisoTexto = h(doc, "span", { id: "aegis-contenedores-aviso-texto" });
  const aviso = h(
    doc,
    "div",
    { className: "aegis-contenedores-aviso", role: "status", hidden: true },
    glifo(doc, "aviso", "aegis-contenedores-aviso-glifo"),
    avisoTexto
  );
  const nota = h(doc, "p", { id: "aegis-contenedores-nota", className: "aegis-contenedores-nota" });
  const nuevo = h(doc, "button", { className: "aegis-contenedores-secundario" });
  const gestionar = h(doc, "button", { className: "aegis-contenedores-secundario" });
  const botones = h(doc, "div", { className: "aegis-contenedores-botones" }, nuevo, gestionar);

  nuevo.addEventListener("click", () => {
    panel.hidePopup();
    // El panel de creación de Firefox (el mismo editor que Ajustes), anclado al indicador de la barra.
    ChromeUtils.importESModule("chrome://browser/content/usercontext/ContainerCreationPanel.mjs")
      .ContainerCreationPanel.open(win, "aegis_contenedores")
      .catch(ex => console.error("Aegis: nuevo contenedor", ex));
  });
  gestionar.addEventListener("click", () => {
    panel.hidePopup();
    win.openPreferences("paneContainers");
  });

  lista.addEventListener("keydown", ev => teclado(win, ev));
  panel.addEventListener("keydown", ev => {
    // Los números eligen una fila desde cualquier sitio del panel (0, sin contenedor; con Mayús, pestaña nueva).
    const n = /^Digit(\d)$/.exec(ev.code)?.[1];
    if (n == null || ev.ctrlKey || ev.altKey || ev.metaKey) {
      return;
    }
    const fila = lista.children[Number(n)];
    if (fila) {
      ev.preventDefault();
      elegir(win, Number(fila.dataset.usercontextid), ev.shiftKey);
    }
  });

  panel.append(h(doc, "div", { className: "aegis-contenedores" }, cabecera, etiqueta, lista, aviso, nota, botones));

  const repintar = () => {
    if (panel.state == "open" || panel.state == "showing") {
      pintar(win);
    }
  };
  panel.addEventListener("popupshowing", ev => {
    if (ev.target != panel) {
      return;
    }
    pintar(win);
    for (const tema of TEMAS) {
      Services.obs.addObserver(repintar, tema);
    }
  });
  panel.addEventListener("popupshown", ev => {
    if (ev.target != panel) {
      return;
    }
    // El foco, a la fila de la pestaña (o la primera), en el fotograma siguiente: en popupshown el panel aún no lo
    // acepta y se quedaba en la página (las flechas y el Intro iban a la web).
    win.requestAnimationFrame(() => {
      if (panel.state == "open") {
        (lista.querySelector('[aria-current="true"]') ?? lista.querySelector(".aegis-contenedores-reabrir"))?.focus();
      }
    });
  });
  panel.addEventListener("popuphidden", ev => {
    if (ev.target != panel) {
      return;
    }
    for (const tema of TEMAS) {
      Services.obs.removeObserver(repintar, tema);
    }
    for (const el of win.document.querySelectorAll("#userContext-icons, #aegis-contenedor-button")) {
      el.removeAttribute("open");
      el.setAttribute("aria-expanded", "false");
    }
  });
  doc.getElementById("mainPopupSet").append(panel);
  return { panel, titulo, actual, atajo, etiqueta, lista, aviso, avisoTexto, nota, nuevo, gestionar };
}

/** Pone en el panel los textos, las filas y el aviso con el estado de la pestaña visible. */
function pintar(win) {
  const e = ventanas.get(win);
  const p = e.partes;
  const doc = win.document;
  const tab = win.gBrowser.selectedTab;
  const actualId = contenedorDe(tab);
  const CIS = lazy.ContextualIdentityService;
  const identidades = CIS.getPublicIdentities();
  const nombreActual = actualId ? CIS.getUserContextLabel(actualId) : "";

  p.titulo.textContent = texto("aegis-contenedores-titulo").value;
  p.actual.textContent = actualId
    ? texto("aegis-contenedores-actual", { nombre: nombreActual }).value
    : texto("aegis-contenedores-actual-ninguno").value;
  p.atajo.textContent = e.tecla ? lazy.ShortcutUtils.prettifyShortcut(e.tecla) : "";
  p.etiqueta.textContent = texto("aegis-contenedores-reabrir-etiqueta").value;
  p.nuevo.textContent = texto("aegis-contenedores-nuevo").value;
  p.gestionar.textContent = texto("aegis-contenedores-gestionar").value;

  const filas = [{ id: 0, nombre: texto("aegis-contenedores-ninguno").value }].concat(
    identidades.map(i => ({ id: i.userContextId, nombre: CIS.getUserContextLabel(i.userContextId), i }))
  );
  p.lista.replaceChildren(
    ...filas.map(({ id, nombre, i }, n) => {
      const esActual = id == actualId;
      const marca = i
        ? h(doc, "span", { className: `aegis-contenedores-icono identity-color-${i.color} identity-icon-${i.icon}` })
        : glifo(doc, "contenedor-ninguno", "aegis-contenedores-icono aegis-contenedores-icono-ninguno");
      const reabrirBoton = h(
        doc,
        "button",
        {
          className: "aegis-contenedores-reabrir",
          tabindex: "-1",
          "aria-label": id
            ? texto("aegis-contenedores-reabrir-en", { nombre }).value
            : texto("aegis-contenedores-reabrir-sin").value,
          "aria-keyshortcuts": String(n),
        },
        marca,
        h(doc, "span", { className: "aegis-contenedores-nombre" }, nombre),
        esActual ? glifo(doc, "visto", "aegis-contenedores-visto") : null
      );
      if (esActual) {
        reabrirBoton.setAttribute("aria-current", "true");
        reabrirBoton.setAttribute("aria-disabled", "true");
      }
      reabrirBoton.addEventListener("click", ev => elegir(win, id, ev.shiftKey));
      const ayudaNueva = id
        ? texto("aegis-contenedores-nueva-en", { nombre }).value
        : texto("aegis-contenedores-nueva-sin").value;
      const nueva = h(
        doc,
        "button",
        { className: "aegis-contenedores-nueva", tabindex: "-1", "aria-label": ayudaNueva, title: ayudaNueva },
        glifo(doc, "mas", "aegis-contenedores-mas")
      );
      nueva.addEventListener("click", () => elegir(win, id, true));
      return h(doc, "div", { className: "aegis-contenedores-fila", "data-usercontextid": String(id) }, reabrirBoton, nueva);
    })
  );
  // Un solo control de la lista en el orden del tabulador: el de la pestaña (o el primero).
  (p.lista.querySelector('[aria-current="true"]') ?? p.lista.querySelector(".aegis-contenedores-reabrir"))?.setAttribute(
    "tabindex",
    "0"
  );

  // La nota de honestidad solo tiene sentido con una web: lo demás (nueva pestaña, páginas del navegador) se abre igual.
  const web = esWeb(tab);
  p.nota.hidden = !web;
  p.nota.textContent = web ? texto("aegis-contenedores-nota").value : "";
  p.aviso.hidden = true;
  if (web && tab.linkedPanel) {
    // Lo escrito en un formulario: SessionStore lo recoge de la página (después de vaciar lo pendiente de la pestaña).
    lazy.TabStateFlusher.flush(tab.linkedBrowser)
      .then(() => {
        if (win.gBrowser.selectedTab != tab || e.panel.state == "closed") {
          return;
        }
        const estado = JSON.parse(lazy.SessionStore.getTabState(tab));
        if (estado.formdata) {
          p.avisoTexto.textContent = texto("aegis-contenedores-aviso-formulario").value;
          p.aviso.hidden = false;
          p.panel.setAttribute("aria-describedby", "aegis-contenedores-actual aegis-contenedores-aviso-texto");
        }
      })
      .catch(ex => console.error("Aegis: contenedores, formulario", ex));
  }
  p.panel.setAttribute("aria-describedby", "aegis-contenedores-actual");
}

/** Lo que hace una fila: reabrir la pestaña en ese contenedor o, con `nueva`, abrir una pestaña nueva en él. */
function elegir(win, userContextId, nueva) {
  const e = ventanas.get(win);
  const tab = win.gBrowser.selectedTab;
  if (!nueva && contenedorDe(tab) == userContextId) {
    return;
  }
  e.panel.hidePopup();
  if (nueva) {
    nuevaPestana(win, userContextId);
  } else {
    reabrir(win, tab, userContextId).catch(ex => console.error("Aegis: reabrir en otro contenedor", ex));
  }
}

/** Flechas, Inicio y Fin dentro de la lista (un solo control con tabindex=0 a la vez). */
function teclado(win, ev) {
  const lista = ventanas.get(win).partes.lista;
  const actual = ev.target.closest?.("button");
  if (!actual || ev.altKey || ev.ctrlKey || ev.metaKey) {
    return;
  }
  const principales = [...lista.querySelectorAll(".aegis-contenedores-reabrir")];
  const fila = actual.parentNode;
  const i = principales.indexOf(fila.firstElementChild);
  let destino = null;
  switch (ev.key) {
    case "ArrowDown":
      destino = principales[(i + 1) % principales.length];
      break;
    case "ArrowUp":
      destino = principales[(i - 1 + principales.length) % principales.length];
      break;
    case "Home":
      destino = principales[0];
      break;
    case "End":
      destino = principales.at(-1);
      break;
    case "ArrowRight":
    case "ArrowLeft": {
      const hacia = (ev.key == "ArrowRight") == (win.document.dir != "rtl");
      destino = hacia ? fila.lastElementChild : fila.firstElementChild;
      break;
    }
    case "Enter":
      if (ev.shiftKey && actual.classList.contains("aegis-contenedores-reabrir")) {
        ev.preventDefault();
        elegir(win, Number(fila.dataset.usercontextid), true);
      }
      return;
    default:
      return;
  }
  ev.preventDefault();
  if (destino && destino != actual) {
    for (const b of lista.querySelectorAll("button")) {
      b.setAttribute("tabindex", "-1");
    }
    destino.setAttribute("tabindex", "0");
    destino.focus();
  }
}

/**
 * Abre el panel (o lo cierra si ya está abierto), anclado al control de la barra que se vea: el indicador de Firefox,
 * el botón de Aegis o, si la barra no enseña ninguno (escribiendo, en la nueva pestaña), la propia barra.
 *
 * @param {Window} win
 * @param {Element} [ancla]
 * @param {Event} [evento]
 */
function alternar(win, ancla, evento) {
  const e = ventanas.get(win);
  if (!e || !disponible(win)) {
    return;
  }
  e.partes ??= crearPanel(win);
  e.panel = e.partes.panel;
  if (e.panel.state == "open" || e.panel.state == "showing") {
    e.panel.hidePopup();
    return;
  }
  const doc = win.document;
  const visible = el => el && !el.hidden && el.getBoundingClientRect().width > 0;
  ancla = [ancla, doc.getElementById("userContext-icons"), e.boton].find(visible);
  const barra = doc.querySelector("#urlbar > .urlbar-input-container") ?? doc.getElementById("urlbar");
  if (win.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    e.panel.setAttribute("animate", "false");
  } else if (e.panel.getAttribute("animate") == "false") {
    e.panel.removeAttribute("animate");
  }
  if (ancla) {
    ancla.setAttribute("open", "true");
    ancla.setAttribute("aria-expanded", "true");
    e.panel.openPopup(ancla, { position: "bottomright topright", y: 4, triggerEvent: evento });
  } else {
    e.panel.openPopup(barra, { position: "bottomleft topleft", y: 4, triggerEvent: evento });
  }
}

// ── Ventanas ──────────────────────────────────────────────────────────────────────────────────────────────────────

let prefObservada = false;

export const AegisContenedores = {
  /**
   * Cada ventana del navegador cuando termina de abrirse (AegisArranque.ventana). Idempotente.
   *
   * @param {Window} win
   */
  ventana(win) {
    if (!win?.gBrowser || ventanas.has(win) || !win.document.getElementById("page-action-buttons")) {
      return;
    }
    const e = { boton: null, tecla: null, panel: null, partes: null };
    ventanas.set(win, e);
    win.addEventListener("unload", () => ventanas.delete(win), { once: true });
    if (lazy.PrivateBrowsingUtils.isWindowPrivate(win)) {
      return;
    }
    e.boton = crearBoton(win);
    e.tecla = crearAtajo(win);
    pintarBoton(win);
    if (!prefObservada) {
      prefObservada = true;
      Services.prefs.addObserver(PREF_CONTENEDORES, () => {
        for (const w of ventanas.keys()) {
          pintarBoton(w);
        }
      });
    }
  },

  /**
   * Abre el panel de la ventana (acción «Cambiar de contenedor», acciones.sys.mjs). No hace nada en una ventana privada
   * o con los contenedores apagados.
   *
   * @param {Window} win
   * @returns {boolean} si se ha abierto (o ya estaba abierto)
   */
  abrirPanel(win) {
    const e = ventanas.get(win);
    if (!e || !disponible(win)) {
      return false;
    }
    if (e.panel?.state != "open" && e.panel?.state != "showing") {
      alternar(win);
    }
    return true;
  },

  /** ¿Se puede usar en esta ventana? (acciones.sys.mjs: la acción sale atenuada si no) */
  disponible,

  reabrir,
};
