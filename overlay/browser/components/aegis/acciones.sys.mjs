/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · acciones de la barra de direcciones: el modo «Acciones» (escribir «>» o elegir Acciones en el menú de la
 * lupa) y la fila de botones que sale al escribir tres letras de una palabra clave («desc», «escudos»…).
 *
 * Firefox trae sus acciones en QuickActionsLoaderDefault y las registra en ActionsProviderQuickActions la primera vez
 * que se usa la barra. Aegis las cambia con la API pública del proveedor (getAction, removeAction, addAction), sin
 * parches:
 * - quita las que no tienen sentido en Aegis: las de Firefox (Firefox View, Firefox Labs, «Restablecer», la ayuda de
 *   la web de Mozilla, controles de IA), las que repiten otra («Ver complementos» = extensiones, «Abrir la Biblioteca»
 *   = marcadores, «Gestionar contraseñas» = la de Aegis), el editor de PDF y las de herramientas de desarrollo;
 * - añade las de Aegis (Escudos, Conexiones, modo, apariencia, Tor, contraseñas, transferencia, importar), con sus
 *   textos y palabras clave en aegis.ftl;
 * - pone a todas un glifo de línea de Aegis (DISENO §8; el de la ventana privada era el violeta de Firefox) y las
 *   ordena: primero las de Aegis.
 *
 * Los textos de Aegis van con su propio Localization y nunca en el document.l10n de la ventana (si aegis.ftl fallara
 * ahí, Fluent dejaría sin traducir lo de Firefox): los dos proveedores que pintan acciones (UrlbarProviderGlobalActions,
 * la fila de botones, y UrlbarProviderActionsSearchMode, la lista del modo Acciones) dan un id de Fluent en
 * getViewUpdate; para las acciones de Aegis se cambia por el texto ya traducido (textContent, que la vista admite).
 *
 * Perezoso: hasta la primera búsqueda de acciones no se carga nada más que QuickActionsLoaderDefault (se envuelve su
 * load). Sin red ni temporizadores. Los puntos de Firefox de los que depende los comprueba tools/verificar.py.
 */

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  ActionsProviderQuickActions: "moz-src:///browser/components/urlbar/ActionsProviderQuickActions.sys.mjs",
  BrowserWindowTracker: "resource:///modules/BrowserWindowTracker.sys.mjs",
});
ChromeUtils.defineESModuleGetters(lazy, {
  AegisConexiones: new URL("conexiones.sys.mjs", import.meta.url).href,
  AegisEscudos: new URL("escudos.sys.mjs", import.meta.url).href,
  AegisEscudosAjustes: new URL("escudos/ajustes.sys.mjs", import.meta.url).href,
  AegisModos: new URL("modos.sys.mjs", import.meta.url).href,
  AegisTor: new URL("tor/tor.sys.mjs", import.meta.url).href,
  AegisTransferencia: new URL("contrasenas/transferencia/transferencia.sys.mjs", import.meta.url).href,
});

const CARGADOR = "moz-src:///browser/components/urlbar/QuickActionsLoaderDefault.sys.mjs";
const FILA = "moz-src:///browser/components/urlbar/UrlbarProviderGlobalActions.sys.mjs";
const LISTA = "moz-src:///browser/components/urlbar/UrlbarProviderActionsSearchMode.sys.mjs";
/** Nombre del proveedor en los resultados de la fila de botones (ActionsProviderQuickActions.name). */
const PROVEEDOR = "ActionsProviderQuickActions";

/** Acciones de Firefox que Aegis quita (claves de DEFAULT_ACTIONS en QuickActionsLoaderDefault). */
export const QUITADAS = [
  "addons", // «Ver complementos»: la página de recomendaciones; ya está «Gestionar extensiones»
  "colorpicker", // herramientas de desarrollo
  "editpdf", // editor de PDF de Firefox
  "firefoxview",
  "help", // la ayuda de la web de Mozilla
  "inspect", // herramientas de desarrollo
  "labs", // Firefox Labs
  "library", // la misma ventana que «Gestionar marcadores»
  "logins", // la sustituye «Contraseñas» de Aegis
  "manageai", // controles de IA (Aegis no los usa)
  "refresh", // «Restablecer» el perfil de Firefox
];

/** Acciones de Firefox que se quedan, en el orden en que salen, con su glifo de Aegis. */
export const DE_FIREFOX = [
  ["downloads", "accion-descargas"],
  ["bookmarks", "accion-marcadores"],
  ["clear", "accion-borrar-historial"],
  ["print", "accion-imprimir"],
  ["savepdf", "accion-pdf"],
  ["screenshot", "accion-captura"],
  ["translate", "accion-traducir"],
  ["viewsource", "accion-codigo"],
  ["mute", "accion-silenciar"],
  ["extensions", "extensiones"],
  ["themes", "accion-temas"],
  ["settings", "accion-ajustes"],
  ["restart", "accion-reiniciar"],
  ["update", "accion-actualizar"],
];

/** La ventana privada de Firefox se queda junto a la de Tor, con el fantasma de Aegis. */
const PRIVADA = ["private", "privado"];

const icono = nombre => new URL(`estilos/iconos/${nombre}.svg`, import.meta.url).href;
const ventanaArriba = () => lazy.BrowserWindowTracker.getTopWindow();
const enPrimerPlano = { focusContent: true };

/**
 * Las acciones de Aegis. `texto` es el id de aegis.ftl (o una función que lo elige según el estado), `claves` el id
 * con las palabras clave, `glifo` el icono (o una función). isInactive, como en Firefox: la acción no sale en la fila
 * y en la lista del modo Acciones sale desactivada.
 */
const PROPIAS = [
  {
    clave: "aegis-escudos",
    texto: "aegis-accion-escudos",
    claves: "aegis-accion-escudos-claves",
    glifo: "accion-escudos",
    isInactive: () => !lazy.AegisEscudos.sitio(ventanaArriba()),
    onPick: (_contexto, controlador) => {
      lazy.AegisEscudos.abrirPanel(controlador.browserWindow);
    },
  },
  {
    clave: "aegis-escudos-sitio",
    texto: () =>
      lazy.AegisEscudos.sitio(ventanaArriba())?.bajados ? "aegis-accion-escudos-subir" : "aegis-accion-escudos-bajar",
    claves: "aegis-accion-escudos-sitio-claves",
    glifo: () => (lazy.AegisEscudos.sitio(ventanaArriba())?.bajados ? "accion-escudos" : "accion-escudos-bajar"),
    isInactive: () => !lazy.AegisEscudos.sitio(ventanaArriba()),
    onPick: (_contexto, controlador) => {
      const win = controlador.browserWindow;
      const sitio = lazy.AegisEscudos.sitio(win);
      if (sitio) {
        lazy.AegisEscudos.ponerSitio(win, sitio.bajados);
      }
      return enPrimerPlano;
    },
  },
  {
    clave: "aegis-escudos-ajustes",
    texto: "aegis-accion-escudos-ajustes",
    claves: "aegis-accion-escudos-ajustes-claves",
    glifo: "escudo-ajustes",
    onPick: (_contexto, controlador) => {
      lazy.AegisEscudosAjustes.abrir(controlador.browserWindow);
      return enPrimerPlano;
    },
  },
  {
    clave: "aegis-conexiones",
    texto: "aegis-accion-conexiones",
    claves: "aegis-accion-conexiones-claves",
    glifo: "accion-conexiones",
    onPick: (_contexto, controlador) => {
      lazy.AegisConexiones.abrir(controlador.browserWindow);
      return enPrimerPlano;
    },
  },
  {
    clave: "aegis-modo",
    texto: () => (lazy.AegisModos.actual() == "estandar" ? "aegis-accion-modo-workflow" : "aegis-accion-modo-estandar"),
    claves: "aegis-accion-modo-claves",
    glifo: "modo",
    onPick: () => {
      lazy.AegisModos.alternar();
    },
  },
  {
    clave: "aegis-apariencia",
    texto: "aegis-accion-apariencia",
    claves: "aegis-accion-apariencia-claves",
    glifo: "accion-enfasis",
    onPick: (_contexto, controlador) => {
      controlador.browserWindow.openPreferences("paneAppearance");
      return enPrimerPlano;
    },
  },
  PRIVADA,
  {
    clave: "aegis-tor",
    texto: "aegis-accion-tor",
    claves: "aegis-accion-tor-claves",
    glifo: "tor",
    onPick: (_contexto, controlador) => {
      lazy.AegisTor.abrirVentana(controlador.browserWindow).catch(e => console.error("Aegis: acción Tor", e));
    },
  },
  {
    clave: "aegis-contrasenas",
    texto: "aegis-accion-contrasenas",
    claves: "aegis-accion-contrasenas-claves",
    glifo: "llave",
    onPick: (_contexto, controlador) => abrirContrasenas(controlador.browserWindow),
  },
  {
    clave: "aegis-pasar",
    texto: "aegis-accion-pasar",
    claves: "aegis-accion-pasar-claves",
    glifo: "accion-pasar",
    onPick: (_contexto, controlador) => {
      lazy.AegisTransferencia.abrirPasar(controlador.browserWindow).catch(e => console.error("Aegis: acción pasar", e));
    },
  },
  {
    clave: "aegis-recibir",
    texto: "aegis-accion-recibir",
    claves: "aegis-accion-recibir-claves",
    glifo: "accion-recibir",
    onPick: (_contexto, controlador) => {
      lazy.AegisTransferencia.abrirRecibir(controlador.browserWindow).catch(e =>
        console.error("Aegis: acción recibir", e)
      );
    },
  },
  {
    clave: "aegis-importar",
    texto: "aegis-accion-importar",
    claves: "aegis-accion-importar-claves",
    glifo: "accion-importar",
    onPick: (_contexto, controlador) => {
      // La orden de Archivo › Importar de otro navegador: el asistente de importar con los orígenes de Aegis.
      controlador.browserWindow.document.getElementById("cmd_file_importFromAnotherBrowser")?.doCommand();
    },
  },
];

/** Panel «Contraseñas» de la barra lateral si está; si no, about:logins. */
function abrirContrasenas(win) {
  const PANEL = "viewCPMSidebar";
  if (
    Services.prefs.getBoolPref("browser.contextual-password-manager.enabled", false) &&
    win.SidebarController?.sidebars?.has(PANEL)
  ) {
    win.SidebarController.show(PANEL).catch(e => console.error("Aegis: acción contraseñas", e));
    return null;
  }
  win.switchToTabHavingURI("about:logins", true, {
    triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
  });
  return enPrimerPlano;
}

/** Textos ya traducidos de las acciones de Aegis (id → texto). La vista los pide sin esperar. */
const textos = new Map();
/** Definiciones de Aegis registradas (clave → definición), para la vista. */
const registradas = new Map();

/** Las palabras de un mensaje de claves, en minúsculas y también sin tildes («contrasenas» encuentra la acción). */
function palabras(valor) {
  const lista = (valor ?? "")
    .split(",")
    .map(p => p.trim().toLowerCase())
    .filter(Boolean);
  const sinTildes = lista.map(p => p.normalize("NFD").replace(/[̀-ͯ]/g, "").normalize("NFC"));
  return [...new Set([...lista, ...sinTildes])];
}

async function cargarTextos() {
  const ids = new Set();
  for (const a of PROPIAS.filter(p => !Array.isArray(p))) {
    ids.add(a.claves);
  }
  for (const id of [
    "aegis-accion-escudos",
    "aegis-accion-escudos-bajar",
    "aegis-accion-escudos-subir",
    "aegis-accion-escudos-ajustes",
    "aegis-accion-conexiones",
    "aegis-accion-modo-workflow",
    "aegis-accion-modo-estandar",
    "aegis-accion-apariencia",
    "aegis-accion-tor",
    "aegis-accion-contrasenas",
    "aegis-accion-pasar",
    "aegis-accion-recibir",
    "aegis-accion-importar",
  ]) {
    ids.add(id);
  }
  const localizacion = new Localization(["aegis.ftl", "branding/brand.ftl"]);
  const lista = [...ids];
  const mensajes = await localizacion.formatValues(lista.map(id => ({ id })));
  lista.forEach((id, i) => {
    if (mensajes[i]) {
      textos.set(id, mensajes[i]);
    }
  });
}

/** El texto que se ve de una acción de Aegis, o null si no es de Aegis. */
function textoDe(clave) {
  const a = registradas.get(clave);
  if (!a) {
    return null;
  }
  const id = typeof a.texto == "function" ? a.texto() : a.texto;
  return textos.get(id) ?? null;
}

/** Definición para ActionsProviderQuickActions.addAction (QuickActionsDefinition de Firefox). */
function definicion(a) {
  const d = {
    commands: palabras(textos.get(a.claves)),
    // Un id de Fluent que la ventana no tiene: la vista pinta el texto de textoDe() (envolverVistas).
    get label() {
      return typeof a.texto == "function" ? a.texto() : a.texto;
    },
    get icon() {
      return icono(typeof a.glifo == "function" ? a.glifo() : a.glifo);
    },
    onPick: a.onPick,
  };
  if (a.isInactive) {
    d.isInactive = a.isInactive;
  }
  return d;
}

/**
 * Cambia getViewUpdate de los dos proveedores que pintan acciones: para las de Aegis, el texto en vez del id de
 * Fluent. En el prototipo, así vale para la barra de todas las ventanas (cada ProvidersManager tiene su instancia).
 */
let vistasEnvueltas = false;
function envolverVistas() {
  if (vistasEnvueltas) {
    return;
  }
  vistasEnvueltas = true;
  const { UrlbarProviderGlobalActions } = ChromeUtils.importESModule(FILA);
  const { UrlbarProviderActionsSearchMode } = ChromeUtils.importESModule(LISTA);
  envolver(UrlbarProviderGlobalActions.prototype, (resultado, vista) => {
    (resultado.payload?.actionsResults ?? []).forEach((accion, i) => {
      const texto = accion.providerName == PROVEEDOR ? textoDe(accion.key) : null;
      if (texto != null) {
        vista[`label-${i}`] = { textContent: texto };
      }
    });
  });
  envolver(UrlbarProviderActionsSearchMode.prototype, (resultado, vista) => {
    const texto = textoDe(resultado.payload?.key);
    if (texto != null) {
      vista.label = { textContent: texto };
    }
  });
}

function envolver(prototipo, cambiar) {
  const original = prototipo.getViewUpdate;
  prototipo.getViewUpdate = function (resultado, ...resto) {
    const vista = original.call(this, resultado, ...resto) ?? {};
    try {
      cambiar(resultado, vista);
    } catch (e) {
      console.error("Aegis: acciones, texto de la vista", e);
    }
    return vista;
  };
}

/**
 * Quita, añade y ordena (addAction pone al final: el orden de la lista es el de registro).
 *
 * @param {string[]} cargadas las claves que ha registrado Firefox, en su orden
 */
async function aplicar(cargadas) {
  await cargarTextos();
  envolverVistas();
  const Q = lazy.ActionsProviderQuickActions;
  const quitar = clave => {
    const d = Q.getAction(clave);
    if (d) {
      Q.removeAction(clave);
    }
    return d;
  };
  for (const clave of QUITADAS) {
    quitar(clave);
  }
  // Las de Firefox que se quedan, fuera para volver a meterlas en su sitio y con el glifo de Aegis.
  const deFirefox = new Map();
  for (const [clave, glifo] of [PRIVADA, ...DE_FIREFOX]) {
    const d = quitar(clave);
    if (d) {
      d.icon = icono(glifo);
      deFirefox.set(clave, d);
    }
  }
  // Las que traiga una versión nueva de Firefox y Aegis aún no conozca (verificar.py avisa): al final, como vengan.
  const otras = new Map();
  for (const clave of cargadas) {
    if (!deFirefox.has(clave) && !QUITADAS.includes(clave)) {
      const d = quitar(clave);
      if (d) {
        otras.set(clave, d);
      }
    }
  }
  for (const a of PROPIAS) {
    if (Array.isArray(a)) {
      const d = deFirefox.get(a[0]);
      if (d) {
        Q.addAction(a[0], d);
        deFirefox.delete(a[0]);
      }
      continue;
    }
    if (Q.getAction(a.clave)) {
      Q.removeAction(a.clave);
    }
    registradas.set(a.clave, a);
    Q.addAction(a.clave, definicion(a));
  }
  for (const [clave] of DE_FIREFOX) {
    if (deFirefox.has(clave)) {
      Q.addAction(clave, deFirefox.get(clave));
    }
  }
  for (const [clave, d] of otras) {
    Q.addAction(clave, d);
  }
}

let iniciado = false;

export const AegisAcciones = {
  /** Una vez por arranque (AegisArranque.inicio): envuelve la carga de las acciones de Firefox. */
  inicio() {
    if (iniciado) {
      return;
    }
    iniciado = true;
    const Q = lazy.ActionsProviderQuickActions;
    const conocidas = [...QUITADAS, PRIVADA[0], ...DE_FIREFOX.map(([c]) => c)];
    if (Q.getAction("settings") || Q.getAction("downloads")) {
      // Ya cargadas (una copia de prueba que arranca Aegis con la barra ya usada): se cambian ahora.
      aplicar(conocidas).catch(e => console.error("Aegis: acciones de la barra", e));
      return;
    }
    const { QuickActionsLoaderDefault } = ChromeUtils.importESModule(CARGADOR);
    const original = QuickActionsLoaderDefault.load;
    QuickActionsLoaderDefault.load = async function () {
      // Se apuntan las claves que registra Firefox, para no perder las que Aegis aún no conozca.
      const cargadas = [];
      const anadir = Q.addAction;
      Q.addAction = function (clave, definicionDeFirefox) {
        cargadas.push(clave);
        return anadir.call(this, clave, definicionDeFirefox);
      };
      try {
        await original.call(this);
      } finally {
        delete Q.addAction;
      }
      try {
        await aplicar(cargadas);
      } catch (e) {
        console.error("Aegis: acciones de la barra", e);
      }
    };
  },
};
