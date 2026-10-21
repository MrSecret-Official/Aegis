/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · arranque de la interfaz. Punto de entrada único del código propio de Aegis:
 * - en una versión compilada lo llama BrowserComponents.manifest (parche 0500-ui/0001): inicio() en
 *   browser-before-ui-startup y ventana(win) en browser-window-delayed-startup;
 * - en una copia de prueba lo llama el cargador de desarrollo (tools/dev/aegis-dev.cfg) desde el repo.
 *
 * Las rutas son relativas a este archivo (import.meta.url), así que funcionan igual en los dos casos.
 * Nada de temporizadores ni trabajo en reposo (docs/GUIA.md, principio 4).
 */

import { AegisModos } from "./modos.sys.mjs";
import { AegisMarcadores } from "./marcadores.sys.mjs";
import { pagina as paginaDeAjustes } from "./ajustes.sys.mjs";
import { pagina as paginaDeComplementos, ventana as ventanaDeComplementos } from "./complementos.sys.mjs";
import { AegisIcono } from "./icono.sys.mjs";
import { AegisGoogle } from "./google.sys.mjs";
import { AegisBusquedaLimpia } from "./busqueda-limpia.sys.mjs";
import { AegisEscudos } from "./escudos.sys.mjs";
import { AegisEscudosAyuda } from "./escudos-ayuda.sys.mjs";
import { AegisConexiones } from "./conexiones.sys.mjs";
import { AegisBienvenida } from "./bienvenida.sys.mjs";
import { AegisHuella } from "./huella.sys.mjs";
import { AegisBarraLateral } from "./barra-lateral.sys.mjs";
import { AegisContenedores } from "./contenedores.sys.mjs";
import { AegisEnfasis } from "./enfasis.sys.mjs";
import { AegisWebsOscuro } from "./webs-oscuro/webs-oscuro.sys.mjs";
import { AegisTor } from "./tor/tor.sys.mjs";
import { AegisBuscador } from "./buscador.sys.mjs";
import { AegisContrasenas } from "./contrasenas.sys.mjs";
import { AegisInstalador } from "./instalador.sys.mjs";
import { panel as panelDeContrasenas, PREFIJO_PANEL as PREFIJO_PANEL_CONTRASENAS } from "./contrasenas-panel.sys.mjs";

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  CustomizableUI: "moz-src:///browser/components/customizableui/CustomizableUI.sys.mjs",
  SearchService: "moz-src:///toolkit/components/search/SearchService.sys.mjs",
});

/**
 * Hojas de toda la interfaz: cada documento chrome:// o about: del navegador con permisos de sistema. La de los
 * contenedores también: sus colores salen en la ventana, en sus menús, en Ajustes y en el diálogo de editar uno.
 */
const HOJAS = ["estilos/tokens.css", "estilos/mapeo-firefox.css", "estilos/interfaz.css", "estilos/contenedores.css"];
/** Y como hojas de usuario, las únicas que entran en el shadow DOM: el énfasis en los componentes de Firefox. */
const HOJAS_USUARIO = ["estilos/sombra-firefox.css"];
/** El @font-face de Inter, aparte: solo donde la CSP lo admite (ponerInter). */
const FUENTES = "estilos/fuentes.css";
/** Hojas añadidas a los documentos chrome:// cuya dirección empieza por la clave. */
const HOJAS_POR_DOCUMENTO = [
  // La ventana del navegador: las pestañas verticales del modo Workflow.
  ["chrome://browser/content/browser.xhtml", ["estilos/workflow.css"]],
  // Marcadores: panel de la barra lateral y la ventana Biblioteca.
  ["chrome://browser/content/places/", ["estilos/marcadores.css"]],
  ["chrome://browser/content/sidebar/", ["estilos/marcadores.css"]],
  // Complementos (temas incluidos).
  ["about:addons", ["estilos/complementos.css"]],
  // Ajustes, con el aspecto del Centro de SecretOS.
  // Con el selector del énfasis personalizado (Apariencia › Énfasis).
  ["about:preferences", ["estilos/ajustes.css", "estilos/selector-enfasis.css"]],
  ["about:settings", ["estilos/ajustes.css", "estilos/selector-enfasis.css"]],
  // «Cómo funcionan los Escudos» (escudos-ayuda.sys.mjs): página propia en el proceso padre.
  ["about:escudos", ["paginas/comun.css", "paginas/escudos-ayuda.css"]],
  // «Tú decides qué se conecta» (conexiones.sys.mjs): página propia en el proceso padre.
  ["about:conexiones", ["paginas/comun.css", "paginas/conexiones.css"]],
  // La bienvenida sin el instalador (bienvenida.sys.mjs): página propia en el proceso padre.
  ["about:bienvenida", ["paginas/comun.css", "paginas/bienvenida.css"]],
  // Ventana de perfiles de Firefox (perfiles.sys.mjs pone la hoja de sus componentes y el diálogo de borrar).
  ["about:profilemanager", ["paginas/comun.css", "paginas/perfiles.css"]],
];
const IDIOMAS = ["en-US", "es-ES", "pt-BR", "fr", "de", "it"];
const FTL = "aegis.ftl";

/**
 * En una copia de prueba (modo desarrollo, pref aegis.dev) manda el código del repo, cargado como
 * resource://aegis/; la copia compilada en resource:///modules/aegis/ no hace nada para no taparlo.
 */
function apartadoPorDesarrollo() {
  return (
    Services.prefs.getBoolPref("aegis.dev", false) &&
    !import.meta.url.startsWith("resource://aegis/")
  );
}

/** Textos de Aegis (Fluent): locales/<idioma>/aegis.ftl junto a este archivo. */
function registrarTextos() {
  // Con new URL() las llaves de {locale} saldrían codificadas (%7B…%7D) y Fluent no encontraría ningún archivo.
  const raiz = new URL("locales/", import.meta.url).href + "{locale}/";
  L10nRegistry.getInstance().registerSources([
    new L10nFileSource("aegis", "app", IDIOMAS, raiz),
  ]);
}

/**
 * Inter (DISENO §3) también en las páginas con CSP: about:preferences, about:addons y casi todas las de Firefox
 * llevan «default-src chrome:», que bloquea una fuente resource:// aunque la ponga una hoja de usuario o de agente.
 * Por eso la carpeta fuentes/ se registra como paquete chrome://aegis-fuentes/content/, la dirección del @font-face de
 * estilos/fuentes.css. Es un paquete de contenido sin contentaccessible: las webs no pueden cargarlo. La referencia se
 * guarda: si el objeto se recogiera, el registro se desharía.
 */
const registrosChrome = [];
function registrarFuentes() {
  const resource = Services.io.getProtocolHandler("resource").QueryInterface(Ci.nsIResProtocolHandler);
  const base = resource.resolveURI(Services.io.newURI(new URL("./", import.meta.url).href));
  const aom = Cc["@mozilla.org/addons/addon-manager-startup;1"].getService(Ci.amIAddonManagerStartup);
  registrosChrome.push(
    aom.registerChrome(Services.io.newURI(base + "chrome.manifest"), [
      ["content", "aegis-fuentes", "fuentes/"],
      // Los glifos de línea, por la misma razón: la nueva pestaña («img-src chrome:», no resource:) pinta con ellos
      // los botones de Personalizar y del correo (paginas/nueva-pestana.css).
      ["content", "aegis-iconos", "estilos/iconos/"],
    ])
  );
}

/** Documentos sin nada que ver (anfitriones de extensiones): ni hojas ni fuente. */
const SIN_HOJAS = new Set(["chrome://extensions/content/dummy.xhtml"]);

/**
 * ¿Deja la CSP del documento cargar una fuente chrome://? Sin CSP, sí. Cada política que se aplica (las de solo
 * informe no cuentan) tiene que permitirlo en font-src o, si no lo hay, en default-src.
 *
 * @param {Document} doc
 */
function admiteFuenteChrome(doc) {
  let politicas = [];
  try {
    politicas = JSON.parse(doc.cspJSON || "{}")["csp-policies"] ?? [];
  } catch (e) {
    return false;
  }
  return politicas
    .filter(p => !p["report-only"])
    .every(p => {
      const fuentes = p["font-src"] ?? p["default-src"];
      return !fuentes || fuentes.some(f => f == "chrome:" || f == "*" || f.startsWith("chrome://aegis-fuentes"));
    });
}

/** Bytes de Inter, leídos una sola vez y solo si alguna página los necesita. */
let bytesDeInter = null;

/**
 * Pone Inter en un documento de la interfaz sin que la CSP tenga que bloquear nada (la consola queda limpia):
 * - si su CSP admite chrome:, con estilos/fuentes.css (una sola descarga para todos los documentos, en caché);
 * - si no (pocas páginas del proceso principal, con «default-src 'none'», como el diálogo de importar de otro
 *   navegador), con una FontFace hecha de sus bytes, como las páginas de contenido (paginas/AegisPaginasChild):
 *   no descarga nada, así que la CSP no interviene.
 * La CSP de una página va en un <meta> de su cabecera, que todavía no existe cuando se crea el documento: se decide
 * cuando la raíz recibe su primer hijo que no es la cabecera (el cuerpo ya viene detrás) o, como tarde, en
 * DOMContentLoaded. Sin nada de texto pintado aún, así que no hay cambio de letra a la vista.
 *
 * @param {Document} doc
 */
function ponerInter(doc) {
  const win = doc.defaultView;
  let hecho = false;
  const decidir = () => {
    if (hecho || win.closed) {
      return;
    }
    hecho = true;
    observador?.disconnect();
    if (registrosChrome.length && admiteFuenteChrome(doc)) {
      try {
        win.windowUtils.loadSheetUsingURIString(new URL(FUENTES, import.meta.url).href, win.windowUtils.AUTHOR_SHEET);
      } catch (e) {
        console.error(`Aegis: no se pudo cargar ${FUENTES}`, e);
      }
      return;
    }
    bytesDeInter ??= fetch(new URL("fuentes/InterVariable.woff2", import.meta.url).href).then(r => r.arrayBuffer());
    bytesDeInter
      .then(bytes => {
        if (!win.closed) {
          doc.fonts.add(new win.FontFace("Inter", bytes, { weight: "100 900", style: "normal", display: "block" }));
        }
      })
      .catch(error => console.error("Aegis: no se pudo poner Inter", error));
  };
  const cabecera = el => el.localName == "head" || el.localName == "linkset";
  const pasadaLaCabecera = () => [...(doc.documentElement?.children ?? [])].some(el => !cabecera(el));
  let observador = null;
  if (doc.readyState != "loading" || pasadaLaCabecera()) {
    decidir();
    return;
  }
  observador = new win.MutationObserver(() => pasadaLaCabecera() && decidir());
  observador.observe(doc.documentElement, { childList: true });
  win.addEventListener("DOMContentLoaded", decidir, { once: true });
}

let localizacion;
/**
 * Textos de Aegis ya traducidos. Van con su propio Localization y nunca en el document.l10n de la ventana: si
 * aegis.ftl faltara o fallara dentro de la ventana, Fluent dejaría sin traducir todo lo que Firefox crea después
 * (pasó con las filas Marcadores, Pestañas, Historial, Acciones y Ajustes del selector de buscadores).
 *
 * @param {string} id
 * @returns {{label?: string, tooltiptext?: string}}
 */
function textos(id) {
  localizacion ??= new Localization([FTL], true);
  const [mensaje] = localizacion.formatMessagesSync([{ id }]);
  return Object.fromEntries((mensaje?.attributes ?? []).map(a => [a.name, a.value]));
}

/** Botón «Modo» (Estándar / Workflow) en la barra. Se puede quitar desde «Personalizar barra». */
function crearBotonModo() {
  const { label, tooltiptext } = textos("aegis-modo-button");
  lazy.CustomizableUI.createWidget({
    id: "aegis-modo-button",
    label: label ?? "Aegis",
    tooltiptext,
    type: "button",
    defaultArea: lazy.CustomizableUI.AREA_NAVBAR,
    onCommand: () => AegisModos.alternar(),
  });
}

/**
 * Protección contra rastreo estricta de serie. ContentBlockingPrefs solo aplica la categoría cuando es un valor del
 * usuario (con un valor por defecto la deja en «standard»), así que se pone una sola vez como valor del usuario: su
 * observador ajusta entonces todas las prefs de la categoría. Si después el usuario elige otra, se respeta.
 * Con aegis.escudos.estricto_mas (true de serie, settings/prefs/58-escudos.js), «strict» es el nivel Estricto+ de
 * Escudos: un perfil nuevo empieza en Estricto+.
 */
function aplicarEtpEstrictoUnaVez() {
  const MARCA = "aegis.etp.inicial";
  if (Services.prefs.getBoolPref(MARCA, false)) {
    return;
  }
  Services.prefs.setStringPref("browser.contentblocking.category", "strict");
  Services.prefs.setBoolPref(MARCA, true);
}

/**
 * Buscador de serie: DuckDuckGo, una sola vez. Si después el usuario elige otro, se respeta. Los códigos de socio de
 * Mozilla ya no van en ninguna URL (parche 0400-privacidad/0002).
 *
 * Las ventanas privadas usan siempre el mismo que las normales: con browser.search.separatePrivateDefault.featureGate
 * apagado (así viene en la 157), SearchService no separa los dos. Antes se llamaba también a setDefaultPrivate, que no
 * cambiaba nada más pero dejaba browser.search.separatePrivateDefault.enabled=true en el perfil; si la puerta se
 * encendiera algún día, las privadas se quedarían con DuckDuckGo aunque el usuario eligiera otro. Se borra esa marca.
 */
async function buscadorDeSerieUnaVez() {
  if (!Services.prefs.getBoolPref("browser.search.separatePrivateDefault.featureGate", false)) {
    Services.prefs.clearUserPref("browser.search.separatePrivateDefault.enabled");
  }
  const MARCA = "aegis.busqueda.inicial";
  if (Services.prefs.getBoolPref(MARCA, false)) {
    return;
  }
  // En Firefox 157 el buscador es el módulo SearchService (ya no hay Services.search).
  const buscador = lazy.SearchService;
  await buscador.init();
  const motor = buscador.getEngineByName("DuckDuckGo");
  if (motor) {
    const motivo = buscador.CHANGE_REASON.UNKNOWN;
    await buscador.setDefault(motor, motivo);
  }
  Services.prefs.setBoolPref(MARCA, true);
}

/**
 * «Restart (Developer)» y su atajo Ctrl+Alt+R: los crea browser-development-helpers.js en las builds sin
 * MOZILLA_OFFICIAL (la de Aegis) en el mismo browser-window-delayed-startup, antes que Aegis (va antes en
 * BrowserComponents.manifest). La fila la oculta interfaz.css; el atajo se desactiva aquí: una <key> con disabled no
 * responde (GlobalKeyListener). Si aún no existe, se mira otra vez cuando acaba esa ronda de arranque, sin esperar más.
 *
 * @param {Window} win
 */
function sinReinicioDeDesarrollo(win) {
  const desactivar = () => win.document.getElementById("key_quickRestart")?.setAttribute("disabled", "true");
  if (!win.document.getElementById("key_quickRestart")) {
    win.queueMicrotask(desactivar);
    return;
  }
  desactivar();
}

/** El buscador de serie ya puesto (inicio()) y si ya se han mirado los de socio en esta sesión (ventana()). */
let buscadorListo = Promise.resolve();
let sociosLanzados = false;

/** Buscadores de socio comerciales de la configuración de búsqueda de Mozilla (ids de search-config-v2). */
const SOCIOS = /^(perplexity|ebay(-[a-z]+)?|mercadoli[bv]re(-[a-z]+)?|leo_ende_de)$/;

/**
 * Fuera de la lista de buscadores, una sola vez por buscador: los de socio comerciales que la configuración de Mozilla
 * pone según el idioma (Perplexity, eBay, Mercado Livre y Mercado Libre, LEO). Quedan instalados y ocultos (hidden),
 * como si el usuario los quitara en Ajustes › Búsqueda: allí puede volver a ponerlos, y lo que haga después se respeta.
 * Se mira en cada arranque, pero cada id se trata una sola vez (aegis.busqueda.socios_vistos): así también se ocultan
 * los que aparecen al cambiar el idioma de la app (con la build multi-idioma, p. ej. LEO en alemán). El predeterminado
 * no se toca nunca.
 */
async function sociosOcultosUnaVez() {
  const VISTOS = "aegis.busqueda.socios_vistos";
  const ANTIGUA = "aegis.busqueda.socios_ocultos"; // la marca de antes: todos los de entonces ya se trataron
  const buscador = lazy.SearchService;
  await buscador.init();
  const motores = await buscador.getEngines();
  const socios = motores.filter(m => SOCIOS.test(m.id));
  if (!Services.prefs.prefHasUserValue(VISTOS) && Services.prefs.getBoolPref(ANTIGUA, false)) {
    Services.prefs.setStringPref(VISTOS, socios.map(m => m.id).join(","));
    Services.prefs.clearUserPref(ANTIGUA);
    return;
  }
  const vistos = new Set(Services.prefs.getStringPref(VISTOS, "").split(",").filter(Boolean));
  const nuevos = socios.filter(m => !vistos.has(m.id));
  if (!nuevos.length) {
    return;
  }
  const predeterminado = await buscador.getDefault();
  for (const motor of nuevos) {
    if (motor.id != predeterminado?.id && !motor.hidden) {
      motor.hidden = true;
    }
    vistos.add(motor.id);
  }
  Services.prefs.setStringPref(VISTOS, [...vistos].join(","));
}

const conHojas = new WeakSet();

/**
 * Pone las hojas de Aegis en un documento de la interfaz: chrome:// o about: con permisos de sistema, como la ventana,
 * la barra lateral, Complementos o Ajustes. Nunca en una web, que podría verlas. Una sola vez por documento.
 *
 * @param {Document} doc
 */
function aplicarHojas(doc) {
  const win = doc.defaultView;
  const propio = doc.documentURI.startsWith("chrome://") || doc.documentURI.startsWith("about:");
  if (
    !win ||
    !propio ||
    conHojas.has(doc) ||
    !doc.nodePrincipal?.isSystemPrincipal ||
    doc.documentURI == "about:blank" ||
    SIN_HOJAS.has(doc.documentURI)
  ) {
    return;
  }
  conHojas.add(doc);
  ponerInter(doc);
  const hojas = [...HOJAS];
  for (const [prefijo, extra] of HOJAS_POR_DOCUMENTO) {
    if (doc.documentURI.startsWith(prefijo)) {
      hojas.push(...extra);
    }
  }
  const utils = win.windowUtils;
  for (const [lista, tipo] of [
    [hojas, utils.AUTHOR_SHEET],
    [HOJAS_USUARIO, utils.USER_SHEET],
  ]) {
    for (const hoja of lista) {
      try {
        utils.loadSheetUsingURIString(new URL(hoja, import.meta.url).href, tipo);
      } catch (e) {
        console.error(`Aegis: no se pudo cargar ${hoja}`, e);
      }
    }
  }
  // Ajustes con la forma del Centro de SecretOS: cabecera, buscador y grupos (ajustes.sys.mjs).
  if (doc.documentURI.startsWith("about:preferences") || doc.documentURI.startsWith("about:settings")) {
    try {
      paginaDeAjustes(doc);
    } catch (e) {
      console.error("Aegis: ajustes", e);
    }
  }
  // Complementos con el mismo lenguaje: cabecera, buscador en la barra lateral y estado vacío (complementos.sys.mjs).
  if (doc.documentURI.startsWith("about:addons")) {
    try {
      paginaDeComplementos(doc);
    } catch (e) {
      console.error("Aegis: complementos", e);
    }
  }
  // Panel «Contraseñas» de la barra lateral (megalist): forma de Aegis y aviso de contraseña principal.
  if (doc.documentURI.startsWith(PREFIJO_PANEL_CONTRASENAS)) {
    try {
      panelDeContrasenas(doc);
    } catch (e) {
      console.error("Aegis: panel de contraseñas", e);
    }
  }
  // about:conexiones: sus interruptores y botones los atiende conexiones.sys.mjs (la página no lleva scripts).
  if (doc.documentURI.startsWith(AegisConexiones.DIRECCION)) {
    try {
      AegisConexiones.pagina(doc);
    } catch (e) {
      console.error("Aegis: about:conexiones", e);
    }
  }
  // about:bienvenida: sus tarjetas, pasos y botones los atiende bienvenida.sys.mjs (la página no lleva scripts).
  if (doc.documentURI.startsWith(AegisBienvenida.DIRECCION)) {
    try {
      AegisBienvenida.pagina(doc);
    } catch (e) {
      console.error("Aegis: about:bienvenida", e);
    }
  }
  // Diálogo Acerca de: las condiciones y la privacidad de Aegis en lugar de las de Firefox (acerca.sys.mjs). Se importa
  // aquí: si fallara al cargar, el diálogo sigue funcionando.
  if (doc.documentURI == "chrome://browser/content/aboutDialog.xhtml") {
    try {
      ChromeUtils.importESModule(new URL("acerca.sys.mjs", import.meta.url).href).AegisAcerca.dialogo(doc);
    } catch (e) {
      console.error("Aegis: Acerca de", e);
    }
  }
  // Ventana de perfiles: la hoja de sus componentes y borrar otro perfil sin entrar en él (perfiles.sys.mjs). Se importa
  // aquí: si fallara al cargar, la ventana sigue funcionando como la de Firefox.
  if (doc.documentURI.startsWith("about:profilemanager")) {
    try {
      ChromeUtils.importESModule(new URL("perfiles.sys.mjs", import.meta.url).href).AegisPerfiles.gestor(doc);
    } catch (e) {
      console.error("Aegis: ventana de perfiles", e);
    }
  }
}

/** Cada documento de la interfaz que se crea a partir de ahora recibe las hojas (sin temporizadores: un evento). */
function observarDocumentos() {
  Services.obs.addObserver(doc => aplicarHojas(doc), "document-element-inserted");
}

/**
 * Páginas propias del navegador que se cargan en un proceso de contenido (nueva pestaña, bienvenida, navegación
 * privada): el actor AegisPaginas les pone las hojas de paginas/. Solo esas direcciones: las webs no las ven. Su
 * lado del proceso principal responde a la nueva pestaña (logos de los accesos, paginas/AegisPaginasParent.sys.mjs).
 */
function registrarPaginas() {
  ChromeUtils.registerWindowActor("AegisPaginas", {
    parent: {
      esModuleURI: new URL("paginas/AegisPaginasParent.sys.mjs", import.meta.url).href,
    },
    child: {
      esModuleURI: new URL("paginas/AegisPaginasChild.sys.mjs", import.meta.url).href,
      events: { DOMDocElementInserted: {} },
    },
    matches: [
      "about:home*",
      "about:logins*",
      "about:newtab*",
      "about:welcome*",
      "about:privatebrowsing*",
      // Editar, crear y borrar un perfil (paginas/perfiles.sys.mjs).
      "about:editprofile*",
      "about:newprofile*",
      "about:deleteprofile*",
      // Páginas de Firefox en un proceso de contenido sin hojas propias: solo los tokens y el énfasis (paginas/comun.css),
      // para que no salga el violeta de Firefox.
      "about:protections*",
      "about:loginsimportreport*",
      "about:pdf*",
      "about:certificate*",
    ],
  });
  // Páginas de error de Firefox (paginas/errores.css: tokens e Inter, sin el violeta ni la ayuda de Mozilla). Las de
  // red, certificado y Solo HTTPS se cargan en el proceso de la web que ha fallado (y también en marcos): por eso van
  // en otro actor, marcado como seguro para esos procesos, igual que los de Firefox para estas páginas (NetError,
  // AboutHttpsOnlyError en ActorManagerParent). Solo pone hojas: no tiene lado en el proceso principal.
  ChromeUtils.registerWindowActor("AegisErrores", {
    child: {
      esModuleURI: new URL("paginas/AegisPaginasChild.sys.mjs", import.meta.url).href,
      events: { DOMDocElementInserted: {} },
    },
    matches: [
      "about:neterror?*",
      "about:certerror?*",
      "about:httpsonlyerror?*",
      "about:tabcrashed*",
      "about:restartrequired*",
      // Marco caído (dentro de una web): solo los tokens y el énfasis.
      "about:framecrashed*",
      // Vista de lectura (en el proceso de la web): solo sus enlaces y su selección (paginas/lector.css).
      "about:reader*",
    ],
    allFrames: true,
    safeForUntrustedWebProcess: true,
  });
}

export const AegisArranque = {
  /** Una vez por arranque del navegador. */
  inicio() {
    if (apartadoPorDesarrollo()) {
      return;
    }
    // Un perfil que nunca ha arrancado Aegis: todavía no tiene la marca de la protección de serie.
    const perfilNuevo = !Services.prefs.getBoolPref("aegis.etp.inicial", false);
    for (const [nombre, paso] of [
      ["textos", registrarTextos],
      // Antes de que se cree el primer documento con las hojas de Aegis.
      ["fuentes", registrarFuentes],
      // Lo primero después de los textos: en la instancia con Tor, el filtro de red tiene que estar antes que nada
      // pida red. En el Aegis normal no hace nada (tor/tor.sys.mjs).
      ["tor", () => AegisTor.inicio()],
      // La puerta de las conexiones de fondo, antes de que arranque ningún servicio que las use (y about:conexiones).
      ["conexiones", () => AegisConexiones.inicio()],
      // about:bienvenida: las preguntas del instalador para quien no pasa por él (Microsoft Store, zip).
      ["bienvenida", () => AegisBienvenida.inicio()],
      // Antes de que nadie pueda poner la contraseña principal (KDF) o guardar una contraseña.
      ["contraseñas", () => AegisContrasenas.inicio()],
      // Códigos de verificación (autenticador/): observadores y, solo si hay códigos guardados, el autorrelleno. Sin
      // leer ningún archivo. Se importa aquí: si fallara al cargar, el resto de Aegis sigue funcionando.
      [
        "autenticador",
        () =>
          ChromeUtils.importESModule(new URL("autenticador/autenticador.sys.mjs", import.meta.url).href).AegisAutenticador.inicio(),
      ],
      ["énfasis", () => AegisEnfasis.inicio()],
      ["hojas de la interfaz", observarDocumentos],
      ["barra lateral", () => AegisBarraLateral.inicio()],
      ["páginas propias", registrarPaginas],
      // «Descartar» un acceso de la nueva pestaña quita el sitio entero (accesos.sys.mjs). Se importa aquí: si fallara
      // al cargar, el resto de Aegis sigue funcionando.
      [
        "accesos descartados",
        () => ChromeUtils.importESModule(new URL("accesos.sys.mjs", import.meta.url).href).AegisAccesos.inicio(),
      ],
      // Acciones de la barra de direcciones (modo «Acciones»): las de Aegis en vez de las de Firefox. Solo envuelve la
      // carga de Firefox, que llega con la primera búsqueda (acciones.sys.mjs). Se importa aquí: si fallara al cargar,
      // el resto de Aegis sigue funcionando.
      [
        "acciones de la barra",
        () => ChromeUtils.importESModule(new URL("acciones.sys.mjs", import.meta.url).href).AegisAcciones.inicio(),
      ],
      ["about:escudos", () => AegisEscudosAyuda.registrar()],
      ["protección estricta", aplicarEtpEstrictoUnaVez],
      // Las elecciones de Aegis Setup, solo en el primer arranque de un perfil nuevo (instalador.sys.mjs): después del
      // nivel de serie (las pisan) y antes del bloqueador y de los modos, que leen lo que dejan puesto. Sin su archivo
      // (Microsoft Store, zip), las mismas preguntas en la bienvenida del navegador (bienvenida.sys.mjs).
      [
        "elecciones del instalador",
        () => {
          if (AegisInstalador.inicio(perfilNuevo)) {
            AegisBienvenida.pedir();
          }
        },
      ],
      // Después del nivel de serie (las listas dependen de él) y antes de que se carguen las pestañas: el bloqueador
      // propio (escudos/listas.sys.mjs) con la instantánea de la build o lo ya descargado. Sin red hasta la bienvenida.
      // Se importa aquí y no arriba: si el bloqueador fallara al cargar, el resto de Aegis sigue funcionando.
      [
        "bloqueador de Escudos",
        () =>
          ChromeUtils.importESModule(new URL("escudos/listas.sys.mjs", import.meta.url).href).AegisEscudosListas.inicio(),
      ],
      ["huella digital", () => AegisHuella.inicio()],
      ["modos", () => AegisModos.inicio()],
      ["botón de modo", crearBotonModo],
      ["icono de la app", () => AegisIcono.inicio()],
      ["Google limpio", () => AegisGoogle.inicio()],
      ["búsqueda limpia", () => AegisBusquedaLimpia.inicio()],
      ["webs en oscuro", () => AegisWebsOscuro.inicio()],
    ]) {
      try {
        paso();
      } catch (e) {
        console.error(`Aegis: ${nombre}`, e);
      }
    }
    buscadorListo = buscadorDeSerieUnaVez().catch(e => console.error("Aegis: buscador de serie", e));
    buscadorListo
      // Después del de serie: el elegido en Aegis Setup, si lo hay.
      .then(() => AegisInstalador.buscador())
      .catch(e => console.error("Aegis: buscador del instalador", e));
    // Los buscadores de socio, aparte: miran SearchService en cada arranque, y eso no puede ir antes del primer pintado
    // (Firefox 158 lo prohíbe: browser_startup.js). Se lanzan desde la primera ventana ya abierta (ventana()).
  },

  /**
   * Cada ventana del navegador, cuando termina de abrirse. Las hojas ya las pone el observador de inicio(); esto
   * cubre la primera ventana si se abrió antes que él.
   *
   * @param {Window} win
   */
  ventana(win) {
    if (apartadoPorDesarrollo() || !win?.document) {
      return;
    }
    aplicarHojas(win.document);
    // Una vez por sesión, con la primera ventana (browser-window-delayed-startup: ya después del primer pintado) y
    // tras el buscador de serie.
    if (!sociosLanzados) {
      sociosLanzados = true;
      buscadorListo
        .then(() => sociosOcultosUnaVez())
        .catch(e => console.error("Aegis: buscadores de socio", e));
    }
    try {
      sinReinicioDeDesarrollo(win);
    } catch (e) {
      console.error("Aegis: atajo de reinicio", e);
    }
    try {
      AegisEnfasis.ventana(win);
    } catch (e) {
      console.error("Aegis: énfasis", e);
    }
    try {
      AegisMarcadores.ventana(win);
    } catch (e) {
      console.error("Aegis: marcadores", e);
    }
    try {
      AegisEscudos.ventana(win);
    } catch (e) {
      console.error("Aegis: escudos", e);
    }
    try {
      AegisBarraLateral.ventana(win);
    } catch (e) {
      console.error("Aegis: barra lateral", e);
    }
    try {
      // Cambio rápido de contenedor: el botón de la barra de direcciones, su panel y Ctrl+Mayús+L.
      AegisContenedores.ventana(win);
    } catch (e) {
      console.error("Aegis: contenedores", e);
    }
    try {
      AegisTor.ventana(win);
    } catch (e) {
      console.error("Aegis: tor", e);
    }
    try {
      // «Usar <buscador> como predeterminado» en el menú de la lupa.
      AegisBuscador.ventana(win);
    } catch (e) {
      console.error("Aegis: lupa", e);
    }
    try {
      // Panel de extensiones de la barra: siempre el panel, con las fijadas y el estado vacío (complementos.sys.mjs).
      ventanaDeComplementos(win);
    } catch (e) {
      console.error("Aegis: panel de extensiones", e);
    }
    try {
      AegisHuella.ventana(win);
    } catch (e) {
      console.error("Aegis: huella", e);
    }
    try {
      // Favicons que no se ven sobre el tema (el negro de GitHub en el oscuro): favicons.sys.mjs. Se importa aquí: si
      // fallara al cargar, el resto de Aegis sigue funcionando.
      ChromeUtils.importESModule(new URL("favicons.sys.mjs", import.meta.url).href).AegisFavicons.ventana(win);
    } catch (e) {
      console.error("Aegis: favicons", e);
    }
    try {
      // El tema elegido en Aegis Setup, en la primera ventana de un perfil nuevo (instalador.sys.mjs).
      AegisInstalador.ventana();
    } catch (e) {
      console.error("Aegis: tema del instalador", e);
    }
    // Sin el archivo del instalador, la bienvenida va primero y lleva a about:conexiones al terminar.
    let porLaBienvenida = false;
    try {
      porLaBienvenida = AegisBienvenida.ventana(win);
    } catch (e) {
      console.error("Aegis: bienvenida", e);
    }
    try {
      // Mientras el usuario no elija qué se conecta, about:conexiones sale en la primera ventana de cada arranque.
      if (!porLaBienvenida) {
        AegisConexiones.ventana(win);
      }
    } catch (e) {
      console.error("Aegis: conexiones", e);
    }
  },
};
