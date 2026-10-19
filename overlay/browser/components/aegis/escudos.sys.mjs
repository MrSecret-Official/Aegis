/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · Escudos en la barra de direcciones, al estilo de Brave y con el lenguaje de SecretOS (docs/DISENO.md).
 *
 * - Botón con el uróboros a la derecha de la barra (al final de #page-action-buttons) y un contador pequeño con lo
 *   bloqueado en la página actual («99+» desde 100). Con los Escudos bajados en el sitio, el uróboros tachado.
 * - Al pulsarlo, un panel propio (no el de Firefox): interruptor del sitio, contador, «Opciones avanzadas» plegable
 *   y la lista de lo bloqueado por categoría.
 *
 * De dónde sale cada cosa:
 * - bloqueo: la protección contra rastreo (ETP) y, por detrás, el motor propio con las listas de filtros
 *   (escudos/red.sys.mjs, que anota aquí lo que bloquea). El contador junta el registro de bloqueo de la pestaña
 *   (browser.getContentBlockingLog()) y lo anotado, y cuenta peticiones (de serie) u orígenes
 *   (aegis.escudos.contador);
 * - Escudos del sitio: la excepción de ETP (ContentBlockingAllowList), la misma que usa el panel de Firefox;
 * - el resto: prefs y permisos nativos (categoría de ETP, Solo HTTPS, cookies, permiso «cookie» de sesión);
 * - molestias: tres interruptores generales (aegis.escudos.molestias.*) y, en cada uno, si el sitio tiene una excepción
 *   (escudos/excepciones.sys.mjs); «Excepciones de este sitio…» abre Ajustes › Escudos (escudos/ajustes.sys.mjs);
 * - la huella digital: el nivel y el permiso por sitio de Caja fuerte, de huella.sys.mjs.
 *
 * Enganches: AegisEscudos.anotar(browser, categoría, origen) suma lo que cancela otro módulo (el motor propio, el
 * filtro de Google); AegisEscudos.registrarFuente() añade otra fuente de bloqueos al contador y a la lista, y
 * AegisEscudos.avisar() pide repintar. Este módulo no observa peticiones.
 *
 * Ligero: nada en reposo. El contador solo se recalcula con un evento de la pestaña visible (gBrowser solo avisa de
 * la pestaña seleccionada), como mucho unas 4 veces por segundo: si llegan eventos seguidos, se arma una sola espera
 * de un disparo hasta completar los 250 ms y luego no queda nada pendiente.
 */

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  ContentBlockingAllowList: "resource://gre/modules/ContentBlockingAllowList.sys.mjs",
  SitePermissions: "resource:///modules/SitePermissions.sys.mjs",
});
// Webs en oscuro (fila «Oscurecer este sitio») y huella digital: relativos a este archivo, como el resto del código
// de Aegis.
ChromeUtils.defineESModuleGetters(lazy, {
  AegisHuella: new URL("huella.sys.mjs", import.meta.url).href,
  AegisWebsOscuro: new URL("webs-oscuro/webs-oscuro.sys.mjs", import.meta.url).href,
  AegisEscudosAyuda: new URL("escudos-ayuda.sys.mjs", import.meta.url).href,
  AegisEscudosAjustes: new URL("escudos/ajustes.sys.mjs", import.meta.url).href,
  AegisEscudosExcepciones: new URL("escudos/excepciones.sys.mjs", import.meta.url).href,
});

const HTML = "http://www.w3.org/1999/xhtml";
const HOJA = new URL("estilos/escudos.css", import.meta.url).href;
const icono = nombre => new URL(`estilos/iconos/${nombre}.svg`, import.meta.url).href;
const FAVICON = "chrome://global/skin/icons/defaultFavicon.svg";

/** «Opciones avanzadas» abierto o cerrado: se recuerda (settings/prefs/58-escudos.js). */
const PREF_AVANZADAS = "aegis.escudos.avanzadas";
const PREF_CATEGORIA = "browser.contentblocking.category";
const PREF_HTTPS = "dom.security.https_only_mode";
const PREF_HTTPS_PRIVADA = "dom.security.https_only_mode_pbm";
const PREFS_COOKIES = ["network.cookie.cookieBehavior", "network.cookie.cookieBehavior.pbmode"];

/**
 * Niveles de Escudos: Normal (protección contra rastreo «standard»), Estricto («strict») y Estricto+ («strict» más la
 * lista AdGuard Tracking Protection en el motor propio, aegis.escudos.estricto_mas; el de serie).
 */
const NIVELES = [
  ["standard", "aegis-escudos-nivel-normal"],
  ["strict", "aegis-escudos-nivel-estricto"],
  ["strict+", "aegis-escudos-nivel-estricto-mas"],
];
const PREF_ESTRICTO_MAS = "aegis.escudos.estricto_mas";
/** Qué cuenta el contador: «peticiones» (de serie, como Brave) u «origenes» (cada origen una vez). */
const PREF_CONTADOR = "aegis.escudos.contador";

/** El nivel que se ve en el desplegable (una categoría de ETP que no es de NIVELES sale como «Personalizado»). */
function nivelActual() {
  const categoria = Services.prefs.getStringPref(PREF_CATEGORIA, "standard");
  return categoria == "strict" && Services.prefs.getBoolPref(PREF_ESTRICTO_MAS, true) ? "strict+" : categoria;
}

/**
 * Pone un nivel: primero la lista extra y luego la categoría (listas.sys.mjs recompila una sola vez). También lo usa
 * instalador.sys.mjs para el nivel elegido en Aegis Setup.
 *
 * @param {"standard" | "strict" | "strict+"} valor
 */
export function ponerNivel(valor) {
  if (valor != "standard") {
    Services.prefs.setBoolPref(PREF_ESTRICTO_MAS, valor == "strict+");
  }
  Services.prefs.setStringPref(PREF_CATEGORIA, valor == "strict+" ? "strict" : valor);
}

const porOrigenes = () => Services.prefs.getStringPref(PREF_CONTADOR, "peticiones") == "origenes";
/** Niveles de la huella digital (huella.sys.mjs); «firefox» se llama «Básica» (sin marcas en los textos). */
const NIVELES_HUELLA = [
  ["firefox", "aegis-huella-nivel-basica"],
  ["equilibrada", "aegis-huella-nivel-equilibrada"],
  ["estricta", "aegis-huella-nivel-estricta"],
  ["caja_fuerte", "aegis-huella-nivel-caja-fuerte"],
];
/** network.cookie.cookieBehavior: 5 = BEHAVIOR_PARTITION_FOREIGN (la protección total de cookies:
 * las de terceros, también las de rastreadores que llegan a cargarse, quedan aisladas por sitio), 1 = ninguna cookie
 * de terceros. */
const COOKIES = [
  [5, "aegis-escudos-cookies-entre-sitios"],
  [Ci.nsICookieService.BEHAVIOR_REJECT_FOREIGN, "aegis-escudos-cookies-todas"],
];

/**
 * Molestias: un interruptor general por grupo (afectan a todos los sitios; listas.sys.mjs recompila el motor). Grupo
 * de las excepciones por sitio (escudos/excepciones.sys.mjs, y su nombre: aegis-escudos-grupo-<grupo>), pref y glifo.
 */
const MOLESTIAS = [
  ["cookies-avisos", "aegis.escudos.molestias.cookies", "escudo-aviso-cookies"],
  ["molestias", "aegis.escudos.molestias.ventanas", "escudo-ventanas"],
  ["antiadblock", "aegis.escudos.molestias.antiadblock", "escudo-antiadblock"],
];

/** Unas 4 actualizaciones por segundo como mucho. */
const INTERVALO = 250;

const W = Ci.nsIWebProgressListener;
/**
 * Categorías de lo bloqueado, en orden de prioridad: contando orígenes, uno que entra en varias cuenta en la primera.
 * «anuncios»: lo que bloquea el motor propio con las listas de filtros (escudos/red.sys.mjs) y ETP no había marcado
 * como rastreador.
 */
const CATEGORIAS = [
  ["rastreadores", "aegis-escudos-cat-rastreadores"],
  ["anuncios", "aegis-escudos-cat-anuncios"],
  ["sociales", "aegis-escudos-cat-sociales"],
  ["huella", "aegis-escudos-cat-huella"],
  ["criptomineros", "aegis-escudos-cat-criptomineros"],
];
/** Banderas del registro de bloqueo de Firefox para cada categoría (comprobadas en este orden). */
const BANDERAS_ETP = [
  ["criptomineros", W.STATE_BLOCKED_CRYPTOMINING_CONTENT],
  ["huella", W.STATE_BLOCKED_FINGERPRINTING_CONTENT | W.STATE_REPLACED_FINGERPRINTING_CONTENT],
  ["sociales", W.STATE_BLOCKED_SOCIALTRACKING_CONTENT],
  [
    "rastreadores",
    W.STATE_BLOCKED_TRACKING_CONTENT | W.STATE_REPLACED_TRACKING_CONTENT | W.STATE_BLOCKED_EMAILTRACKING_CONTENT,
  ],
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

// ── Lo bloqueado ────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Lo que bloquea la protección contra rastreo de Firefox en la página del navegador: {categoría: Map(origen →
 * peticiones)}. Formato del registro: {origen: [[estado, bloqueado, repeticiones], …]}; las repeticiones de los
 * eventos bloqueados son las peticiones que se cortaron.
 *
 * @param {MozBrowser} browser
 */
function bloqueadoPorEtp(browser) {
  const crudo = browser.getContentBlockingLog();
  if (!crudo) {
    return {};
  }
  const resultado = {};
  for (const [origen, eventos] of Object.entries(JSON.parse(crudo))) {
    let estado = 0;
    let peticiones = 0;
    for (const [bandera, bloqueado, repeticiones] of eventos) {
      if (bloqueado) {
        estado |= bandera;
        peticiones += Math.max(1, repeticiones ?? 1);
      }
    }
    const categoria = BANDERAS_ETP.find(([, banderas]) => estado & banderas)?.[0];
    if (categoria) {
      (resultado[categoria] ??= new Map()).set(origen, peticiones);
    }
  }
  return resultado;
}

/**
 * Bloqueos que anotan otros módulos de Aegis al cancelar una petición (el filtro de Google; en la fase 4, el motor
 * propio) con AegisEscudos.anotar(), con las peticiones de cada origen. Van por documento (WindowGlobalParent): al
 * navegar, el documento nuevo empieza vacío y lo anterior se libera solo.
 *
 * @type {WeakMap<WindowGlobalParent, Map<string, Map<string, number>>>}
 */
const anotados = new WeakMap();

function bloqueadoAnotado(browser) {
  const porCategoria = anotados.get(browser.browsingContext?.currentWindowGlobal);
  return porCategoria ? Object.fromEntries(porCategoria) : {};
}

/** Fuentes de bloqueos de la página: ETP, lo anotado por otros módulos y, en la fase 4, las que se registren. */
const fuentes = new Map([
  ["etp", bloqueadoPorEtp],
  ["anotados", bloqueadoAnotado],
]);

/**
 * Lo bloqueado en la página, de todas las fuentes. Cada fuente da, por categoría, los orígenes (un array: una petición
 * cada uno) o un Map de origen → peticiones. Una misma petición nunca llega a dos fuentes (ETP decide antes y lo que
 * cancela no llega al motor propio ni a Google limpio), así que las peticiones se suman.
 * - Contando peticiones (aegis.escudos.contador = «peticiones», de serie): el total y cada categoría son peticiones;
 *   un origen sale en cada categoría en la que se le bloqueó algo.
 * - Contando orígenes («origenes»): cada origen una sola vez, en la primera categoría (orden de CATEGORIAS).
 *
 * @param {MozBrowser} browser
 * @returns {{total: number, porCategoria: Map<string, string[]>, cuentas: Map<string, number>}}
 */
function bloqueado(browser) {
  const juntos = new Map(CATEGORIAS.map(([c]) => [c, new Map()]));
  for (const [nombre, fuente] of fuentes) {
    try {
      for (const [categoria, valor] of Object.entries(fuente(browser) ?? {})) {
        const destino = juntos.get(categoria);
        if (!destino) {
          continue;
        }
        const pares = valor instanceof Map ? valor : Array.from(valor ?? [], o => [o, 1]);
        for (const [o, n] of pares) {
          destino.set(o, (destino.get(o) ?? 0) + n);
        }
      }
    } catch (e) {
      console.error(`Aegis: Escudos, fuente ${nombre}`, e);
    }
  }
  const origenes = porOrigenes();
  const vistos = new Set();
  const porCategoria = new Map();
  const cuentas = new Map();
  let total = 0;
  for (const [categoria, mapa] of juntos) {
    if (origenes) {
      const propios = [...mapa.keys()].filter(o => !vistos.has(o));
      propios.forEach(o => vistos.add(o));
      porCategoria.set(categoria, propios);
      cuentas.set(categoria, propios.length);
    } else {
      let n = 0;
      for (const v of mapa.values()) {
        n += v;
      }
      porCategoria.set(categoria, [...mapa.keys()]);
      cuentas.set(categoria, n);
      total += n;
    }
  }
  return { total: origenes ? vistos.size : total, porCategoria, cuentas };
}

/** El nombre que se enseña de un origen («https://ads.ejemplo.com» → «ads.ejemplo.com»). */
function anfitrion(origen) {
  try {
    return Services.io.newURI(origen).displayHostPort || origen;
  } catch {
    return origen;
  }
}

// ── Estado del sitio ────────────────────────────────────────────────────────────────────────────────────────────

/** Los Escudos solo tienen sentido en una web (http o https) que ETP sepa tratar. */
function aplicable(browser) {
  const uri = browser.currentURI;
  return (
    !!uri &&
    (uri.schemeIs("http") || uri.schemeIs("https")) &&
    lazy.ContentBlockingAllowList.canHandle(browser)
  );
}

/**
 * Página de aviso de Solo HTTPS (about:httpsonlyerror) de una web http(s): la protección contra rastreo no la maneja
 * (su principal no es de contenido), pero desde aquí se añade la excepción de HTTPS. El botón se ve y el panel enseña
 * solo la cabecera y la fila de HTTPS.
 */
function soloHttps(browser) {
  const uri = browser.currentURI;
  return (
    !!uri &&
    (uri.schemeIs("http") || uri.schemeIs("https")) &&
    !!browser.documentURI?.spec.startsWith("about:httpsonlyerror")
  );
}

/** Principal con el que Firefox guarda «Escudos bajados» (https://<nombre>, con los atributos de la ventana). */
const principalBajados = browser => browser.browsingContext?.currentWindowGlobal?.contentBlockingAllowListPrincipal;
/**
 * ¿Escudos bajados en el sitio? El permiso del nombre exacto (el que pone este panel) o, como lo aplica Firefox, el de
 * un nombre superior (el que pone Ajustes › Escudos para todo el sitio).
 */
const bajados = browser =>
  lazy.ContentBlockingAllowList.includes(browser) ||
  lazy.AegisEscudosExcepciones.todoPermitido(principalBajados(browser));
const privada = win => win.gBrowser.selectedBrowser.browsingContext?.usePrivateBrowsing ?? false;

/** Principal http:// del sitio: Solo HTTPS guarda sus excepciones en la versión http (como el panel de Firefox). */
function principalHttp(browser) {
  let uri = browser.currentURI;
  if (uri instanceof Ci.nsINestedURI) {
    uri = uri.QueryInterface(Ci.nsINestedURI).innermostURI;
  }
  uri = uri.mutate().setScheme("http").finalize();
  return Services.scriptSecurityManager.createContentPrincipal(uri, browser.contentPrincipal.originAttributes);
}

function httpsActivo(win) {
  return (
    Services.prefs.getBoolPref(PREF_HTTPS, false) ||
    (privada(win) && Services.prefs.getBoolPref(PREF_HTTPS_PRIVADA, false))
  );
}

function excepcionHttps(browser) {
  const { state } = lazy.SitePermissions.getForPrincipal(principalHttp(browser), "https-only-load-insecure");
  return (
    state == Ci.nsIHttpsOnlyModePermission.LOAD_INSECURE_ALLOW ||
    state == Ci.nsIHttpsOnlyModePermission.LOAD_INSECURE_ALLOW_SESSION
  );
}

function olvidarActivo(browser) {
  const { state } = lazy.SitePermissions.getForPrincipal(browser.contentPrincipal, "cookie");
  return state == lazy.SitePermissions.ALLOW_COOKIES_FOR_SESSION;
}

// ── Botón de la barra ───────────────────────────────────────────────────────────────────────────────────────────

/** Por ventana: {boton, contador, panel, partes, ultima, pendiente}. */
const ventanas = new WeakMap();

function crearBoton(win) {
  const doc = win.document;
  const boton = doc.createXULElement("hbox");
  boton.id = "aegis-escudos-button";
  boton.className = "urlbar-page-action";
  boton.setAttribute("role", "button");
  boton.setAttribute("aria-haspopup", "dialog");
  boton.setAttribute("aria-expanded", "false");
  boton.hidden = true;
  const imagen = doc.createXULElement("image");
  imagen.className = "urlbar-icon";
  const contador = doc.createElementNS(HTML, "span");
  contador.id = "aegis-escudos-contador";
  contador.setAttribute("aria-hidden", "true");
  contador.hidden = true;
  boton.append(imagen, contador);

  const abrir = e => {
    if ((e.type == "click" && e.button != 0) || (e.type == "keypress" && ![" ", "Enter"].includes(e.key))) {
      return;
    }
    e.preventDefault();
    alternarPanel(win, e);
  };
  boton.addEventListener("click", abrir);
  boton.addEventListener("keypress", abrir);
  doc.getElementById("page-action-buttons").append(boton);
  return { boton, contador };
}

/**
 * Repinta el botón (y el panel, si está abierto) con el estado de la pestaña visible.
 *
 * @param {Window} win
 */
function actualizar(win) {
  const e = ventanas.get(win);
  if (!e) {
    return;
  }
  e.ultima = win.performance.now();
  const browser = win.gBrowser.selectedBrowser;
  if (!aplicable(browser)) {
    const conHttps = soloHttps(browser);
    e.boton.hidden = !conHttps;
    e.boton.removeAttribute("bajados");
    e.contador.hidden = true;
    if (conHttps) {
      const { tooltiptext } = texto("aegis-escudos-boton", { count: 0 }).attributes;
      e.boton.setAttribute("tooltiptext", tooltiptext ?? "");
      e.boton.setAttribute("aria-label", tooltiptext ?? "");
      if (e.panel?.state == "open" || e.panel?.state == "showing") {
        pintarPanel(win);
      }
    } else if (e.panel?.state == "open") {
      e.panel.hidePopup();
    }
    return;
  }
  const abajo = bajados(browser);
  const datos = abajo ? { total: 0, porCategoria: new Map() } : bloqueado(browser);
  e.boton.hidden = false;
  e.boton.toggleAttribute("bajados", abajo);
  e.contador.hidden = abajo || datos.total == 0;
  e.contador.textContent = datos.total > 99 ? "99+" : String(datos.total);
  const { tooltiptext } = texto(abajo ? "aegis-escudos-boton-bajados" : "aegis-escudos-boton", {
    count: datos.total,
  }).attributes;
  e.boton.setAttribute("tooltiptext", tooltiptext ?? "");
  e.boton.setAttribute("aria-label", tooltiptext ?? "");
  if (e.panel?.state == "open" || e.panel?.state == "showing") {
    pintarPanel(win, datos);
  }
  // Caja fuerte: aviso si la web ha intentado sacar la huella (una vez por sitio y sesión).
  if (!abajo) {
    try {
      lazy.AegisHuella.avisar(win, browser, e.boton, b => b.reload());
    } catch (ex) {
      console.error("Aegis: Escudos, aviso de huella", ex);
    }
  }
}

/** El panel en la página de aviso de Solo HTTPS: cabecera y fila de HTTPS (escudos.css oculta lo demás). */
function pintarPanelHttps(win, e, p, browser) {
  e.panel.setAttribute("solo-https", "true");
  p.favicon.src = FAVICON;
  p.dominio.textContent = browser.currentURI.displayHost;
  p.estado.textContent = texto("aegis-escudos-https").value;
  p.sitio.hidden = true;
  p.avanzadas.hidden = false;
  const conHttps = httpsActivo(win);
  const excepcion = conHttps && excepcionHttps(browser);
  p.https.disabled = !conHttps;
  desactivar(p.filaHttps, !conHttps);
  marcar(p.https, conHttps && !excepcion);
  p.filaHttps.detalle.textContent = texto(
    !conHttps ? "aegis-escudos-https-apagado" : excepcion ? "aegis-escudos-https-excepcion" : "aegis-escudos-https-activo"
  ).value;
}

/** Como mucho una actualización cada INTERVALO ms; los eventos de en medio se juntan en una sola. */
function programar(win) {
  const e = ventanas.get(win);
  if (!e) {
    return;
  }
  // Ya hay una espera armada: ese repintado leerá también lo que acaba de llegar.
  if (e.pendiente) {
    return;
  }
  const espera = e.ultima + INTERVALO - win.performance.now();
  if (espera <= 0) {
    actualizar(win);
    return;
  }
  e.pendiente = true;
  win.setTimeout(() => {
    e.pendiente = false;
    actualizar(win);
  }, espera);
}

// ── Panel ───────────────────────────────────────────────────────────────────────────────────────────────────────

/** Crea un elemento HTML con propiedades y atributos (los que empiezan por «aria-», «data-» o «role»). */
function h(doc, etiqueta, props = {}, ...hijos) {
  const el = doc.createElementNS(HTML, etiqueta);
  for (const [k, v] of Object.entries(props)) {
    if (k.startsWith("aria-") || k.startsWith("data-") || k == "role") {
      el.setAttribute(k, v);
    } else {
      el[k] = v;
    }
  }
  el.append(...hijos.filter(x => x != null));
  return el;
}

function glifo(doc, nombre, clase = "aegis-escudos-glifo") {
  return h(doc, "img", { className: clase, src: icono(nombre), alt: "" });
}

/** Interruptor 34 × 20 (o el grande de la cabecera): un botón con role=switch. */
function interruptor(doc, etiquetadoPor, alCambiar, grande = false) {
  const b = h(doc, "button", {
    className: "aegis-interruptor" + (grande ? " aegis-interruptor-grande" : ""),
    role: "switch",
    "aria-checked": "false",
    "aria-labelledby": etiquetadoPor,
  });
  b.addEventListener("click", () => alCambiar(b.getAttribute("aria-checked") != "true"));
  return b;
}

const marcar = (b, encendido) => b.setAttribute("aria-checked", String(encendido));
/** Fila desactivada: atenuada (CSS) y anunciada como tal. */
function desactivar(f, si) {
  if (si) {
    f.setAttribute("aria-disabled", "true");
  } else {
    f.removeAttribute("aria-disabled");
  }
}

/** Desplegable compacto (como el «Estándar ▾» de Brave): un botón que abre un menú de opciones. */
function desplegable(win, idMenu, opciones, etiquetadoPor, alElegir) {
  const doc = win.document;
  const etiqueta = h(doc, "span", { className: "aegis-escudos-desplegable-texto", id: `${idMenu}-valor` });
  const b = h(
    doc,
    "button",
    { className: "aegis-escudos-desplegable", "aria-haspopup": "menu", "aria-expanded": "false" },
    etiqueta,
    glifo(doc, "escudo-desplegar", "aegis-escudos-glifo-pequeno")
  );
  // Nombre accesible: «Rastreadores y anuncios Estricto».
  b.setAttribute("aria-labelledby", `${etiquetadoPor} ${etiqueta.id}`);
  const menu = doc.createXULElement("menupopup");
  menu.id = idMenu;
  for (const [valor, id] of opciones) {
    const item = doc.createXULElement("menuitem");
    item.setAttribute("type", "radio");
    item.setAttribute("value", String(valor));
    item.setAttribute("label", texto(id).value);
    menu.append(item);
  }
  menu.addEventListener("command", e => alElegir(e.target.getAttribute("value")));
  menu.addEventListener("popuphidden", e => {
    if (e.target == menu) {
      b.setAttribute("aria-expanded", "false");
    }
  });
  doc.getElementById("mainPopupSet").append(menu);
  b.addEventListener("click", () => {
    b.setAttribute("aria-expanded", "true");
    menu.openPopup(b, "after_end", 0, 4);
  });
  /** Muestra el valor actual (o «Personalizado» si no es ninguna de las opciones). */
  b.poner = valor => {
    const elegida = opciones.find(([v]) => String(v) == String(valor));
    etiqueta.textContent = texto(elegida?.[1] ?? "aegis-escudos-personalizado").value;
    for (const item of menu.children) {
      item.toggleAttribute("checked", item.getAttribute("value") == String(valor));
    }
  };
  return b;
}

/** Fila de las opciones avanzadas: glifo, título con detalle y el control a la derecha. */
function fila(doc, { id, glifoNombre, titulo, control, clic }) {
  const tituloEl = h(doc, "span", { className: "aegis-escudos-fila-titulo", id: `${id}-titulo` }, titulo);
  const detalle = h(doc, "span", { className: "aegis-escudos-fila-detalle", id: `${id}-detalle` });
  const textos = h(doc, "span", { className: "aegis-escudos-fila-textos" }, tituloEl, detalle);
  const el = h(
    doc,
    clic ? "button" : "div",
    { className: "aegis-escudos-fila" + (clic ? " aegis-escudos-fila-clic" : ""), id },
    glifo(doc, glifoNombre),
    textos,
    control
  );
  if (clic) {
    el.addEventListener("click", clic);
  }
  el.detalle = detalle;
  return el;
}

/** Recarga la pestaña para aplicar un cambio, como hace Firefox al tocar su panel. */
function recargar(win) {
  win.BrowserCommands.reload();
}

function crearPanel(win) {
  const doc = win.document;
  const e = ventanas.get(win);
  const panel = doc.createXULElement("panel");
  panel.id = "aegis-escudos-panel";
  panel.setAttribute("type", "arrow");
  panel.setAttribute("role", "dialog");
  panel.setAttribute("orient", "vertical");
  panel.setAttribute("aria-labelledby", "aegis-escudos-dominio");
  const navegador = () => win.gBrowser.selectedBrowser;

  // Cabecera: favicon y dominio, estado y el interruptor del sitio.
  const favicon = h(doc, "img", { className: "aegis-escudos-favicon", alt: "" });
  const dominio = h(doc, "span", { className: "aegis-escudos-dominio", id: "aegis-escudos-dominio" });
  const estado = h(doc, "span", { className: "aegis-escudos-estado", id: "aegis-escudos-estado" });
  const sitio = interruptor(
    doc,
    "aegis-escudos-estado",
    encender => {
      const browser = navegador();
      if (encender) {
        lazy.ContentBlockingAllowList.remove(browser);
        // Y la de un nombre superior, si la hay (Ajustes › Escudos la pone para todo el sitio).
        lazy.AegisEscudosExcepciones.permitirTodo(principalBajados(browser), false);
      } else {
        lazy.ContentBlockingAllowList.add(browser);
      }
      recargar(win);
      actualizar(win);
    },
    true
  );
  const cabecera = h(
    doc,
    "div",
    { className: "aegis-escudos-cabecera" },
    favicon,
    h(doc, "div", { className: "aegis-escudos-cabecera-textos" }, dominio, estado),
    sitio
  );

  // Tarjeta del contador.
  const numero = h(doc, "span", { className: "aegis-escudos-numero" });
  const numeroTexto = h(doc, "span", { className: "aegis-escudos-numero-texto" });
  const total = h(doc, "span", { className: "aegis-escudos-total", hidden: true });
  const tarjeta = h(
    doc,
    "div",
    { className: "aegis-escudos-tarjeta aegis-escudos-contador", role: "status" },
    numero,
    h(doc, "div", { className: "aegis-escudos-contador-textos" }, numeroTexto, total)
  );

  // Opciones avanzadas (plegable).
  const avanzadas = h(doc, "div", { className: "aegis-escudos-tarjeta aegis-escudos-avanzadas", id: "aegis-escudos-avanzadas" });
  const plegar = h(
    doc,
    "button",
    { className: "aegis-escudos-plegar", "aria-controls": "aegis-escudos-avanzadas", "aria-expanded": "false" },
    h(doc, "span", {}, texto("aegis-escudos-avanzadas").value),
    glifo(doc, "escudo-desplegar", "aegis-escudos-glifo-pequeno")
  );
  plegar.addEventListener("click", () => {
    Services.prefs.setBoolPref(PREF_AVANZADAS, !Services.prefs.getBoolPref(PREF_AVANZADAS, false));
    pintarPanel(win);
  });

  const nivel = desplegable(win, "aegis-escudos-menu-nivel", NIVELES, "aegis-escudos-rastreadores-titulo", valor => {
    ponerNivel(valor);
    recargar(win);
    pintarPanel(win);
  });
  const filaNivel = fila(doc, {
    id: "aegis-escudos-rastreadores",
    glifoNombre: "escudo-rastreadores",
    titulo: texto("aegis-escudos-rastreadores").value,
    control: nivel,
  });

  // Molestias: interruptores generales (todos los sitios). Las excepciones de un sitio, en Ajustes › Escudos.
  const molestias = MOLESTIAS.map(([grupo, pref, glifoNombre]) => {
    const control = interruptor(doc, `aegis-escudos-molestia-${grupo}-titulo`, encender => {
      Services.prefs.setBoolPref(pref, encender);
      recargar(win);
      pintarPanel(win);
    });
    const titulo = texto(`aegis-escudos-grupo-${grupo}`).value;
    const f = fila(doc, { id: `aegis-escudos-molestia-${grupo}`, glifoNombre, titulo, control });
    return Object.assign(f, { grupo, pref, control });
  });
  // «Excepciones de este sitio…»: Ajustes › Escudos con el sitio elegido.
  const filaExcepciones = fila(doc, {
    id: "aegis-escudos-excepciones",
    glifoNombre: "escudo-excepciones",
    titulo: texto("aegis-escudos-excepciones-sitio").value,
    control: h(doc, "span", { className: "aegis-escudos-fila-fin" }, glifo(doc, "escudo-chevron", "aegis-escudos-glifo-pequeno")),
    clic: () => {
      const browser = navegador();
      panel.hidePopup();
      lazy.AegisEscudosAjustes.abrir(win, lazy.AegisEscudosExcepciones.dominioDe(browser.contentPrincipal));
    },
  });

  const cuenta = h(doc, "span", { className: "aegis-escudos-fila-cuenta" });
  const filaLista = fila(doc, {
    id: "aegis-escudos-ver",
    glifoNombre: "escudo-lista",
    titulo: texto("aegis-escudos-ver-bloqueado").value,
    control: h(doc, "span", { className: "aegis-escudos-fila-fin" }, cuenta, glifo(doc, "escudo-chevron", "aegis-escudos-glifo-pequeno")),
    clic: ev => mostrarVista(win, "detalle", ev),
  });

  const https = interruptor(doc, "aegis-escudos-https-titulo", encender => {
    const browser = navegador();
    const principal = principalHttp(browser);
    if (encender) {
      lazy.SitePermissions.removeFromPrincipal(principal, "https-only-load-insecure");
    } else {
      // En una ventana privada, solo para la sesión (como el panel de Firefox).
      const enPrivada = privada(win);
      lazy.SitePermissions.setForPrincipal(
        principal,
        "https-only-load-insecure",
        enPrivada
          ? Ci.nsIHttpsOnlyModePermission.LOAD_INSECURE_ALLOW_SESSION
          : Ci.nsIHttpsOnlyModePermission.LOAD_INSECURE_ALLOW,
        enPrivada ? lazy.SitePermissions.SCOPE_SESSION : lazy.SitePermissions.SCOPE_PERSISTENT
      );
    }
    // En la página de error de Solo HTTPS hay que ir a la versión http (como hace el panel de Firefox).
    if (!encender && browser.documentURI?.spec.startsWith("about:httpsonlyerror")) {
      win.gBrowser.loadURI(principal.URI, {
        triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
        loadFlags: Ci.nsIWebNavigation.LOAD_FLAGS_REPLACE_HISTORY,
      });
    } else {
      recargar(win);
    }
    pintarPanel(win);
  });
  const filaHttps = fila(doc, {
    id: "aegis-escudos-https",
    glifoNombre: "escudo-https",
    titulo: texto("aegis-escudos-https").value,
    control: https,
  });

  // Bloquear scripts: Firefox 157 no tiene un permiso nativo y persistente por sitio para JavaScript (llegará con el
  // motor propio). Hasta que exista no se enseña (principio 5, honestidad: no se promete lo que no hay); la fila queda
  // construida para la fase 4.
  const scripts = interruptor(doc, "aegis-escudos-scripts-titulo", () => {});
  scripts.disabled = true;
  const filaScripts = fila(doc, {
    id: "aegis-escudos-scripts",
    glifoNombre: "escudo-scripts",
    titulo: texto("aegis-escudos-scripts").value,
    control: scripts,
  });
  filaScripts.detalle.textContent = texto("aegis-escudos-scripts-pronto").value;
  desactivar(filaScripts, true);
  filaScripts.hidden = true;

  // Huella digital: el nivel (huella.sys.mjs), con el mismo desplegable que el de rastreadores.
  const huella = desplegable(win, "aegis-escudos-menu-huella", NIVELES_HUELLA, "aegis-escudos-huella-titulo", valor => {
    lazy.AegisHuella.poner(valor);
    recargar(win);
    pintarPanel(win);
  });
  const filaHuella = fila(doc, {
    id: "aegis-escudos-huella",
    glifoNombre: "escudo-huella",
    titulo: texto("aegis-escudos-huella").value,
    control: huella,
  });

  const cookies = desplegable(win, "aegis-escudos-menu-cookies", COOKIES, "aegis-escudos-cookies-titulo", valor => {
    for (const p of PREFS_COOKIES) {
      Services.prefs.setIntPref(p, Number(valor));
    }
    recargar(win);
    pintarPanel(win);
  });
  const filaCookies = fila(doc, {
    id: "aegis-escudos-cookies",
    glifoNombre: "escudo-cookies",
    titulo: texto("aegis-escudos-cookies").value,
    control: cookies,
  });

  const olvidar = interruptor(doc, "aegis-escudos-olvidar-titulo", encender => {
    const principal = navegador().contentPrincipal;
    if (encender) {
      lazy.SitePermissions.setForPrincipal(principal, "cookie", lazy.SitePermissions.ALLOW_COOKIES_FOR_SESSION);
    } else {
      lazy.SitePermissions.removeFromPrincipal(principal, "cookie");
    }
    pintarPanel(win);
  });
  const filaOlvidar = fila(doc, {
    id: "aegis-escudos-olvidar",
    glifoNombre: "escudo-olvidar",
    titulo: texto("aegis-escudos-olvidar").value,
    control: olvidar,
  });

  avanzadas.append(
    filaNivel,
    ...molestias,
    filaExcepciones,
    filaLista,
    filaHttps,
    filaScripts,
    filaHuella,
    filaCookies,
    filaOlvidar
  );

  // Caja fuerte: la web no ve los datos del navegador salvo que se le dé permiso. Fila con el uróboros en su propia
  // tarjeta, a la vista aunque las opciones avanzadas estén plegadas; solo en Caja fuerte (pintarPanel).
  const permiso = interruptor(doc, "aegis-escudos-permiso-titulo", encender => {
    lazy.AegisHuella.permitir(lazy.AegisHuella.dominio(navegador()), encender, privada(win));
    recargar(win);
    pintarPanel(win);
  });
  const filaPermiso = fila(doc, {
    id: "aegis-escudos-permiso",
    glifoNombre: "escudo",
    titulo: texto("aegis-huella-permitir-sitio").value,
    control: permiso,
  });
  const cajaFuerte = h(doc, "div", { className: "aegis-escudos-tarjeta", hidden: true }, filaPermiso);

  // Webs en oscuro (webs-oscuro.sys.mjs): oscurecer o no este sitio, al momento y sin recargar. La fila solo se ve con
  // la función encendida en Ajustes › Apariencia (pintarPanel).
  const oscuro = interruptor(doc, "aegis-escudos-oscuro-titulo", encender => {
    lazy.AegisWebsOscuro.alternarSitio(navegador(), encender);
    pintarPanel(win);
  });
  const filaOscuro = fila(doc, {
    id: "aegis-escudos-oscuro",
    glifoNombre: "escudo-oscuro",
    titulo: texto("aegis-escudos-oscuro").value,
    control: oscuro,
  });
  filaOscuro.hidden = true;
  avanzadas.append(filaOscuro);

  // Botones y pie.
  const boton = (id, destino) => {
    const b = h(doc, "button", { className: "aegis-escudos-secundario" }, texto(id).value);
    b.addEventListener("click", () => {
      panel.hidePopup();
      win.openPreferences(destino);
    });
    return b;
  };
  const botones = h(
    doc,
    "div",
    { className: "aegis-escudos-botones" },
    // Ajustes › Escudos (escudos/ajustes.sys.mjs): nivel, molestias, listas, contador y excepciones.
    boton("aegis-escudos-listas", "escudos"),
    boton("aegis-escudos-configuracion", "privacy")
  );
  const pie = h(doc, "p", { className: "aegis-escudos-pie" }, texto("aegis-escudos-pie").value);
  // «Cómo funcionan los Escudos»: la ayuda de cada opción (about:escudos, escudos-ayuda.sys.mjs) en una pestaña.
  const ayuda = h(doc, "button", { className: "aegis-escudos-ayuda" }, texto("aegis-escudos-ayuda").value);
  ayuda.addEventListener("click", () => {
    panel.hidePopup();
    lazy.AegisEscudosAyuda.abrir(win);
  });

  const principal = h(
    doc,
    "div",
    { className: "aegis-escudos-vista", id: "aegis-escudos-principal" },
    cabecera,
    tarjeta,
    cajaFuerte,
    plegar,
    avanzadas,
    botones,
    h(doc, "div", { className: "aegis-escudos-pie-caja" }, pie, ayuda)
  );

  // Vista de detalle: lo bloqueado por categoría.
  const atras = h(
    doc,
    "button",
    { className: "aegis-escudos-atras", "aria-label": texto("aegis-escudos-atras").attributes["aria-label"] ?? "" },
    glifo(doc, "escudo-atras")
  );
  atras.addEventListener("click", ev => mostrarVista(win, "principal", ev));
  const lista = h(doc, "div", { className: "aegis-escudos-lista" });
  const detalle = h(
    doc,
    "div",
    { className: "aegis-escudos-vista", id: "aegis-escudos-detalle", hidden: true },
    h(
      doc,
      "div",
      { className: "aegis-escudos-subcabecera" },
      atras,
      h(doc, "h2", { className: "aegis-escudos-subtitulo" }, texto("aegis-escudos-lista-titulo").value)
    ),
    lista
  );

  panel.append(h(doc, "div", { className: "aegis-escudos" }, principal, detalle));
  panel.addEventListener("popupshowing", ev => {
    if (ev.target == panel) {
      mostrarVista(win, "principal");
      // Botón y panel con el mismo recuento (actualizar() también pinta el panel).
      actualizar(win);
      e.boton.setAttribute("open", "true");
      e.boton.setAttribute("aria-expanded", "true");
      totalHistorico(win);
    }
  });
  panel.addEventListener("popuphidden", ev => {
    if (ev.target == panel) {
      e.boton.removeAttribute("open");
      e.boton.setAttribute("aria-expanded", "false");
    }
  });
  doc.getElementById("mainPopupSet").append(panel);

  e.partes = {
    favicon,
    dominio,
    estado,
    sitio,
    numero,
    numeroTexto,
    total,
    plegar,
    avanzadas,
    nivel,
    molestias,
    filaExcepciones,
    cuenta,
    filaLista,
    https,
    filaHttps,
    huella,
    filaHuella,
    permiso,
    filaPermiso,
    cajaFuerte,
    cookies,
    filaCookies,
    olvidar,
    filaOlvidar,
    oscuro,
    filaOscuro,
    principal,
    detalle,
    lista,
    atras,
  };
  return panel;
}

/** Total guardado por Firefox (protections.sqlite, local y nunca enviado). Solo al abrir el panel. */
function totalHistorico(win) {
  const { total } = ventanas.get(win).partes;
  let servicio;
  try {
    servicio = Cc["@mozilla.org/tracking-db-service;1"].getService(Ci.nsITrackingDBService);
  } catch {
    return;
  }
  servicio.sumAllEvents().then(
    suma => {
      total.hidden = !(suma > 0);
      total.textContent = suma > 0 ? texto("aegis-escudos-total", { total: suma }).value : "";
    },
    () => (total.hidden = true)
  );
}

/**
 * Cambia entre la vista principal y la lista. El foco va al control equivalente de la otra vista; con el ratón
 * (detail > 0), sin anillo.
 */
function mostrarVista(win, vista, evento) {
  const p = ventanas.get(win).partes;
  const conFoco = win.document.activeElement == p.atras || win.document.activeElement == p.filaLista;
  p.principal.hidden = vista != "principal";
  p.detalle.hidden = vista != "detalle";
  const opciones = { focusVisible: !(evento?.detail > 0) };
  if (vista == "detalle") {
    pintarPanel(win);
    p.atras.focus(opciones);
  } else if (conFoco) {
    p.filaLista.focus(opciones);
  }
}

/**
 * Pone en el panel el estado actual del sitio y de las prefs.
 *
 * @param {Window} win
 * @param {{total: number, porCategoria: Map<string, string[]>}} [datos]
 */
function pintarPanel(win, datos) {
  const e = ventanas.get(win);
  const p = e?.partes;
  const browser = win.gBrowser.selectedBrowser;
  if (!p) {
    return;
  }
  if (!aplicable(browser)) {
    if (soloHttps(browser)) {
      pintarPanelHttps(win, e, p, browser);
    }
    return;
  }
  e.panel.removeAttribute("solo-https");
  p.sitio.hidden = false;
  const doc = win.document;
  const abajo = bajados(browser);
  datos ??= abajo ? { total: 0, porCategoria: new Map() } : bloqueado(browser);

  // Cabecera.
  p.favicon.src = win.gBrowser.getIcon(win.gBrowser.selectedTab) || FAVICON;
  p.dominio.textContent = browser.currentURI.displayHost;
  p.estado.textContent = texto(abajo ? "aegis-escudos-bajados-sitio" : "aegis-escudos-activos-sitio").value;
  marcar(p.sitio, !abajo);
  e.panel.toggleAttribute("bajados", abajo);

  // Contador.
  p.numero.hidden = abajo;
  p.numero.textContent = String(datos.total);
  p.numeroTexto.textContent = abajo
    ? texto("aegis-escudos-contador-bajados").value
    : texto("aegis-escudos-contador", { count: datos.total }).value;

  // Opciones avanzadas.
  const abiertas = Services.prefs.getBoolPref(PREF_AVANZADAS, false);
  p.plegar.setAttribute("aria-expanded", String(abiertas));
  p.avanzadas.hidden = !abiertas;
  p.nivel.poner(nivelActual());
  p.cuenta.textContent = String(datos.total);

  pintarMolestias(win, browser);

  const global = texto("aegis-escudos-global").value;
  p.filaCookies.detalle.textContent = global;
  doc.getElementById("aegis-escudos-rastreadores-detalle").textContent = global;

  const conHttps = httpsActivo(win);
  p.https.disabled = !conHttps;
  desactivar(p.filaHttps, !conHttps);
  const excepcion = conHttps && excepcionHttps(browser);
  marcar(p.https, conHttps && !excepcion);
  p.filaHttps.detalle.textContent = texto(
    !conHttps ? "aegis-escudos-https-apagado" : excepcion ? "aegis-escudos-https-excepcion" : "aegis-escudos-https-activo"
  ).value;

  pintarHuella(win, browser);
  p.cookies.poner(Services.prefs.getIntPref(PREFS_COOKIES[0], 0));

  const enPrivada = privada(win);
  p.olvidar.disabled = enPrivada;
  desactivar(p.filaOlvidar, enPrivada);
  marcar(p.olvidar, !enPrivada && olvidarActivo(browser));
  p.filaOlvidar.detalle.textContent = texto(
    enPrivada ? "aegis-escudos-olvidar-privada" : "aegis-escudos-olvidar-detalle"
  ).value;

  // Webs en oscuro: null con la función apagada (la fila no se ve).
  let oscuro = null;
  try {
    oscuro = lazy.AegisWebsOscuro.estado(browser);
  } catch (ex) {
    console.error("Aegis: Escudos, webs en oscuro", ex);
  }
  p.filaOscuro.hidden = !oscuro;
  if (oscuro) {
    marcar(p.oscuro, oscuro.oscurecer);
    p.filaOscuro.detalle.textContent = texto(
      !oscuro.oscurecer
        ? "aegis-escudos-oscuro-excepcion"
        : oscuro.pagina == "propio"
          ? "aegis-escudos-oscuro-propio"
          : oscuro.pagina == "claro"
            ? "aegis-escudos-oscuro-claro"
            : "aegis-escudos-oscuro-activo"
    ).value;
  }

  // Lista de lo bloqueado (solo si se ve).
  if (!p.detalle.hidden) {
    pintarLista(doc, p.lista, datos);
  }
}

/**
 * Molestias: cada interruptor con su estado general y, debajo, si este sitio tiene una excepción de ese grupo; la
 * fila de excepciones, con el resumen de lo permitido en el sitio.
 */
function pintarMolestias(win, browser) {
  const p = ventanas.get(win).partes;
  const ex = lazy.AegisEscudosExcepciones;
  const principal = browser.contentPrincipal;
  for (const f of p.molestias) {
    const encendido = Services.prefs.getBoolPref(f.pref, true);
    marcar(f.control, encendido);
    const motivo = encendido ? ex.motivo(principal, f.grupo) : "general";
    f.detalle.textContent = texto(
      motivo == "general"
        ? "aegis-escudos-molestia-apagada"
        : motivo == "sitio"
          ? "aegis-escudos-molestia-permitida-sitio"
          : "aegis-escudos-molestia-activa"
    ).value;
  }
  const grupos = ex.GRUPOS.filter(g => ex.motivo(principal, g) == "sitio");
  const nombres = grupos.map(g => texto(`aegis-escudos-grupo-${g}`).value);
  p.filaExcepciones.detalle.textContent = nombres.length
    ? new Intl.ListFormat(Services.locale.appLocaleAsBCP47, { type: "conjunction" }).format(nombres)
    : texto("aegis-escudos-excepciones-ninguna").value;
}

/** Huella digital: nivel, glifo (el uróboros en Caja fuerte) y la tarjeta del permiso por sitio. */
function pintarHuella(win, browser) {
  const p = ventanas.get(win).partes;
  const huella = lazy.AegisHuella;
  const nivel = huella.nivel();
  const enPrivada = privada(win);
  const caja = nivel == "caja_fuerte";
  p.huella.poner(nivel);
  p.filaHuella.querySelector(".aegis-escudos-glifo").src = icono(caja ? "escudo" : "escudo-huella");
  p.filaHuella.detalle.textContent = texto(
    huella.activa(enPrivada) ? "aegis-escudos-global" : "aegis-huella-apagada"
  ).value;

  p.cajaFuerte.hidden = !caja;
  if (!caja) {
    return;
  }
  // En una ventana privada no se guardan permisos; una dirección sin dominio válido (IP, TLD raro) no los admite.
  const dominio = huella.dominio(browser);
  const sePuede = !enPrivada && !!dominio;
  const si = sePuede && huella.permitido(dominio);
  p.permiso.disabled = !sePuede;
  desactivar(p.filaPermiso, !sePuede);
  marcar(p.permiso, si);
  p.filaPermiso.detalle.textContent = texto(
    enPrivada
      ? "aegis-huella-permiso-privada"
      : !dominio
        ? "aegis-huella-permiso-no-disponible"
        : si
          ? "aegis-huella-permiso-si"
          : "aegis-huella-permiso-no"
  ).value;
}

function pintarLista(doc, lista, datos) {
  const secciones = [];
  for (const [categoria, id] of CATEGORIAS) {
    const origenes = datos.porCategoria.get(categoria) ?? [];
    if (!origenes.length) {
      continue;
    }
    const nombres = [...new Set(origenes.map(anfitrion))].sort();
    secciones.push(
      h(
        doc,
        "section",
        { className: "aegis-escudos-seccion" },
        h(
          doc,
          "h3",
          { className: "aegis-escudos-etiqueta" },
          h(doc, "span", {}, texto(id).value),
          h(
            doc,
            "span",
            { className: "aegis-escudos-etiqueta-cuenta" },
            String(datos.cuentas?.get(categoria) ?? origenes.length)
          )
        ),
        h(
          doc,
          "ul",
          { className: "aegis-escudos-tarjeta aegis-escudos-origenes" },
          ...nombres.map(n => h(doc, "li", { title: n }, n))
        )
      )
    );
  }
  if (!secciones.length) {
    secciones.push(h(doc, "p", { className: "aegis-escudos-vacio" }, texto("aegis-escudos-lista-vacia").value));
  }
  lista.replaceChildren(...secciones);
}

function alternarPanel(win, evento) {
  const e = ventanas.get(win);
  e.panel ??= crearPanel(win);
  if (e.panel.state == "open" || e.panel.state == "showing") {
    e.panel.hidePopup();
    return;
  }
  // Como en Brave: justo debajo del botón y alineado con el borde derecho de la barra de direcciones (el botón es el
  // último de la barra). Se ancla al botón (anclarlo a #urlbar le pondría [open] y la desplegaría) y se desplaza lo
  // que separa el botón del borde de la barra.
  const barra = win.document.querySelector("#urlbar > .urlbar-input-container") ?? win.document.getElementById("urlbar");
  const b = e.boton.getBoundingClientRect();
  const u = barra?.getBoundingClientRect();
  const x = u?.width ? Math.max(0, u.right - b.right) : 0;
  const y = u?.height ? Math.max(0, u.bottom - b.bottom) : 0;
  // Con «reducir movimiento», sin animación: así el panel no espera a una transición de 0 s.
  if (win.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    e.panel.setAttribute("animate", "false");
  } else if (e.panel.getAttribute("animate") == "false") {
    e.panel.removeAttribute("animate");
  }
  e.panel.openPopup(e.boton, { position: "bottomright topright", x, y, triggerEvent: evento });
}

// ── Ventanas ────────────────────────────────────────────────────────────────────────────────────────────────────

export const AegisEscudos = {
  /**
   * Cada ventana del navegador, cuando termina de abrirse (lo llama AegisArranque.ventana). Idempotente.
   *
   * @param {Window} win
   */
  ventana(win) {
    const doc = win?.document;
    if (!win?.gBrowser || ventanas.has(win) || !doc?.getElementById("page-action-buttons")) {
      return;
    }
    try {
      win.windowUtils.loadSheetUsingURIString(HOJA, win.windowUtils.AUTHOR_SHEET);
    } catch (e) {
      console.error("Aegis: no se pudo cargar escudos.css", e);
    }
    const e = { ...crearBoton(win), panel: null, partes: null, ultima: -Infinity, pendiente: false };
    ventanas.set(win, e);

    // gBrowser solo avisa a estos oyentes de la pestaña seleccionada: el resto no gasta nada.
    const oyente = {
      onContentBlockingEvent() {
        programar(win);
      },
      onLocationChange(webProgress, request, location, flags) {
        if (webProgress && !webProgress.isTopLevel) {
          return;
        }
        // Página nueva o cambio de pestaña: se repinta en el acto (el registro de una página nueva está vacío).
        if (!(flags & W.LOCATION_CHANGE_SAME_DOCUMENT)) {
          actualizar(win);
        }
      },
    };
    win.gBrowser.addProgressListener(oyente);
    win.addEventListener("unload", () => win.gBrowser.removeProgressListener(oyente), { once: true });
    actualizar(win);
  },

  /**
   * Añade una fuente de bloqueos. `fuente(browser)` devuelve {categoría: [orígenes] | Map(origen → peticiones)} con
   * las categorías de CATEGORIAS; el contador las junta con las de ETP (ver bloqueado()).
   *
   * @param {string} nombre
   * @param {(browser: MozBrowser) => Record<string, string[] | Map<string, number>>} fuente
   */
  registrarFuente(nombre, fuente) {
    fuentes.set(nombre, fuente);
  },

  /**
   * Otro módulo de Aegis ha cancelado una petición de la pestaña `browser` (p. ej. google.sys.mjs en
   * http-on-modify-request): cuenta en el contador y en la lista, sin repetir orígenes que ya contó ETP.
   * `browser` sale del canal: channel.loadInfo.browsingContext?.top?.embedderElement.
   *
   * @param {MozBrowser} browser
   * @param {string} categoria una de CATEGORIAS («rastreadores», «anuncios», «sociales», «huella», «criptomineros»)
   * @param {string} origen p. ej. channel.URI.prePath
   * Cada llamada es una petición bloqueada (el contador de peticiones las suma; el de orígenes cuenta el origen).
   */
  anotar(browser, categoria, origen) {
    const documento = browser?.browsingContext?.currentWindowGlobal;
    if (!documento || !origen || !CATEGORIAS.some(([c]) => c == categoria)) {
      return;
    }
    let porCategoria = anotados.get(documento);
    if (!porCategoria) {
      porCategoria = new Map();
      anotados.set(documento, porCategoria);
    }
    if (!porCategoria.has(categoria)) {
      porCategoria.set(categoria, new Map());
    }
    const mapa = porCategoria.get(categoria);
    mapa.set(origen, (mapa.get(origen) ?? 0) + 1);
    this.avisar(browser);
  },

  /**
   * Fase 4: el motor avisa de que ha bloqueado algo en `browser`. Solo se repinta si es la pestaña visible.
   *
   * @param {MozBrowser} browser
   */
  avisar(browser) {
    // La ventana del <browser>: ownerDocument.defaultView. No ownerGlobal: desde un módulo llega sin él (como en
    // complementos.sys.mjs) y el aviso no repintaba nunca.
    const win = browser?.ownerDocument?.defaultView;
    if (win && win.gBrowser?.selectedBrowser == browser) {
      programar(win);
    }
  },
};
