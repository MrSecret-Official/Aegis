/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · icono de la app en Windows, a elegir en Ajustes › Apariencia (pref aegis.icono):
 * - «fantasma», el de serie: el del ejecutable (recurso IDI_APPICON, branding/aegis/firefox.ico);
 * - «uroboros», el alternativo: branding/aegis/alternos/uroboros.ico, que va dentro del navegador en
 *   resource:///modules/aegis/iconos-app/ (moz.build).
 *
 * Cómo: nsIWindowsUIUtils.setWindowIcon (WM_SETICON), lo mismo que usa Firefox para las ventanas de Taskbar Tabs, en
 * cada ventana de primer nivel; para volver al de serie, setWindowIconFromExe con el recurso del ejecutable, como
 * hace BrowserContentHandler con las ventanas privadas. No se tocan las ventanas privadas (llevan siempre el fantasma
 * con cerradura, IDI_PBMODE, con su propio AUMID), ni las de Taskbar Tabs ni las de Imagen en imagen, que ponen el
 * suyo.
 *
 * Qué cambia: el icono de cada ventana (Alt+Tab, vista previa de la barra de tareas) y el botón de la barra de tareas
 * cuando ningún acceso directo lleva el AUMID de Aegis (copia portátil). Si lo lleva (el acceso del menú Inicio del
 * instalador), Windows pinta el botón con el icono del acceso, y los accesos no se cambian aquí.
 *
 * Sin temporizadores ni trabajo en reposo: un observador de la pref y otro de ventanas nuevas.
 */

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  PrivateBrowsingUtils: "resource://gre/modules/PrivateBrowsingUtils.sys.mjs",
});
ChromeUtils.defineLazyGetter(lazy, "WindowsUIUtils", () =>
  Cc["@mozilla.org/windows-ui-utils;1"].getService(Ci.nsIWindowsUIUtils)
);

export const PREF_ICONO = "aegis.icono";
/** Iconos que se pueden elegir, en el orden de Ajustes. El primero es el de serie (el del ejecutable). */
export const ICONOS = ["fantasma", "uroboros"];
/** Recurso del icono de la app en el ejecutable (toolkit/xre/nsNativeAppSupportWin.h). */
const IDI_APPICON = 1;

/**
 * Archivos de cada icono: [dirección en la build (relativa a este módulo o absoluta), ruta en la carpeta de marca del
 * repo (copia de prueba)]. El fantasma no tiene .ico propio: es el del ejecutable.
 */
const ARCHIVOS = {
  fantasma: {
    miniatura: ["chrome://branding/content/icon64.png", "default64.png"],
  },
  uroboros: {
    ico: ["iconos-app/uroboros.ico", "alternos/uroboros.ico"],
    miniatura: ["iconos-app/uroboros-64.png", "alternos/uroboros-64.png"],
  },
};

let marcaDelRepo;

/**
 * En una copia de prueba (código cargado como resource://aegis/ por tools/dev/aegis-dev.cfg), la carpeta
 * overlay/browser/branding/aegis del repo: la marca no se copia a la copia de prueba, y la de su ejecutable es la de
 * Nightly. La ruta del repo sale de la constante REPO de aegis-dev.cfg, junto al ejecutable.
 *
 * @returns {nsIFile?}
 */
function marcaDev() {
  if (marcaDelRepo !== undefined) {
    return marcaDelRepo;
  }
  marcaDelRepo = null;
  if (!import.meta.url.startsWith("resource://aegis/")) {
    return null;
  }
  try {
    const cfg = Services.dirsvc.get("GreD", Ci.nsIFile);
    cfg.append("aegis-dev.cfg");
    const m = /const REPO = ("(?:[^"\\]|\\.)*");/.exec(Cu.readUTF8File(cfg));
    if (m) {
      const dir = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
      dir.initWithPath(JSON.parse(m[1]));
      for (const parte of ["overlay", "browser", "branding", "aegis"]) {
        dir.append(parte);
      }
      marcaDelRepo = dir;
    }
  } catch (e) {
    console.error("Aegis: icono, carpeta de marca del repo", e);
  }
  return marcaDelRepo;
}

/**
 * @param {string} nombre Uno de ICONOS.
 * @param {"ico" | "miniatura"} tipo
 * @returns {string?} Dirección del archivo, o null si ese icono no lo tiene.
 */
function direccion(nombre, tipo) {
  const archivo = ARCHIVOS[nombre]?.[tipo];
  if (!archivo) {
    return null;
  }
  const [build, dev] = archivo;
  const marca = marcaDev();
  if (marca) {
    const f = marca.clone();
    for (const parte of dev.split("/")) {
      f.append(parte);
    }
    return Services.io.newFileURI(f).spec;
  }
  return new URL(build, import.meta.url).href;
}

/** @returns {string} El icono elegido (uno de ICONOS). */
function actual() {
  const nombre = Services.prefs.getStringPref(PREF_ICONO, ICONOS[0]);
  return ICONOS.includes(nombre) ? nombre : ICONOS[0];
}

const imagenes = new Map();

/**
 * El .ico decodificado (una vez por icono). Es un archivo del propio navegador (resource://, o file:// del repo en
 * una copia de prueba): el canal no sale a la red.
 *
 * @param {string} nombre
 * @returns {Promise<imgIContainer>}
 */
function imagen(nombre) {
  let promesa = imagenes.get(nombre);
  if (!promesa) {
    const uri = Services.io.newURI(direccion(nombre, "ico"));
    const canal = Services.io.newChannelFromURI(
      uri,
      null,
      Services.scriptSecurityManager.getSystemPrincipal(),
      null,
      Ci.nsILoadInfo.SEC_ALLOW_CROSS_ORIGIN_SEC_CONTEXT_IS_NULL,
      Ci.nsIContentPolicy.TYPE_IMAGE
    );
    promesa = ChromeUtils.fetchDecodedImage(uri, canal);
    promesa.catch(() => imagenes.delete(nombre));
    imagenes.set(nombre, promesa);
  }
  return promesa;
}

/** Ventanas que llevan el icono de la app: de primer nivel, y ni privadas ni de Taskbar Tabs ni de Imagen en imagen. */
function admite(win) {
  const raiz = win?.document?.documentElement;
  if (!raiz || win.closed) {
    return false;
  }
  if (raiz.hasAttribute("taskbartab") || raiz.getAttribute("windowtype") == "Toolkit:PictureInPicture") {
    return false;
  }
  return !lazy.PrivateBrowsingUtils.isWindowPrivate(win);
}

/** Ventanas a las que Aegis les cambió el icono (las demás ya llevan el del ejecutable). */
const cambiadas = new WeakSet();

/** Pone en una ventana el icono elegido. */
function poner(win) {
  if (!admite(win)) {
    return;
  }
  const nombre = actual();
  if (nombre == ICONOS[0]) {
    if (cambiadas.has(win)) {
      cambiadas.delete(win);
      lazy.WindowsUIUtils.setWindowIconFromExe(win, Services.dirsvc.get("XREExeF", Ci.nsIFile).path, IDI_APPICON);
    }
    return;
  }
  imagen(nombre).then(
    img => {
      // La elección puede haber cambiado mientras se decodificaba.
      if (actual() == nombre && admite(win)) {
        lazy.WindowsUIUtils.setWindowIcon(win, img, img);
        cambiadas.add(win);
      }
    },
    e => console.error(`Aegis: no se pudo cargar el icono «${nombre}»`, e)
  );
}

function ponerEnTodas() {
  for (const win of Services.wm.getEnumerator(null)) {
    poner(win);
  }
}

const ventanasNuevas = {
  observe(win, tema) {
    if (tema == "domwindowopened") {
      win.addEventListener("load", () => poner(win), { once: true });
    }
  },
};

let iniciado = false;

export const AegisIcono = {
  PREF: PREF_ICONO,
  ICONOS,

  /** El icono de la app se elige en Windows (en Linux lo pone el entorno de escritorio con el .desktop). */
  get disponible() {
    return Services.appinfo.OS == "WINNT";
  },

  actual,

  /**
   * Miniatura de 64 px de un icono, para Ajustes.
   *
   * @param {string} nombre Uno de ICONOS.
   * @returns {string}
   */
  miniatura(nombre) {
    return direccion(nombre, "miniatura");
  },

  /** Una vez por arranque: el icono elegido en las ventanas abiertas y en las que se abran, y al cambiar la pref. */
  inicio() {
    if (iniciado || !this.disponible) {
      return;
    }
    iniciado = true;
    Services.prefs.addObserver(PREF_ICONO, ponerEnTodas);
    Services.ww.registerNotification(ventanasNuevas);
    ponerEnTodas();
  },
};
