/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · ventana de perfiles (about:profilemanager: «Administrar perfiles» y, si se ha pedido, al abrir Aegis).
 * La pone AegisArranque.aplicarHojas() al crearse el documento:
 * - la hoja de usuario de sus componentes (paginas/perfiles-sombra.css; las de autor van en HOJAS_POR_DOCUMENTO);
 * - borrar otro perfil desde aquí mismo. Firefox abría ese perfil con about:deleteprofile para borrarlo desde dentro
 *   (había que entrar en él). Aquí, la papelera de un perfil que no es el que está en uso pregunta en un diálogo qué se
 *   borra y lo borra con el servicio de perfiles de Firefox (SelectableProfileService.deleteProfile, que se niega con el
 *   perfil en uso y si el perfil está abierto). El perfil en uso sigue con el camino de Firefox (about:deleteprofile:
 *   enseña lo que se borra y cierra Aegis), y un perfil abierto en otra ventana de Aegis no se borra: se dice.
 * Sin temporizadores: todo responde a la papelera y a los botones del diálogo.
 */

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  ProfilesDatastoreService: "moz-src:///toolkit/profile/ProfilesDatastoreService.sys.mjs",
  SelectableProfileService: "resource:///modules/profiles/SelectableProfileService.sys.mjs",
});

export const DIRECCION = "about:profilemanager";
const SOMBRA = "paginas/perfiles-sombra.css";
const PREF_ACCESO = "browser.profiles.shortcutFileName";

let localizacion;
function texto(id, args) {
  localizacion ??= new Localization(["aegis.ftl", "branding/brand.ftl"], true);
  const [m] = localizacion.formatMessagesSync([{ id, args }]);
  return m?.value ?? "";
}

/**
 * ¿Abre el .lnk este perfil? Sus argumentos son los que pone Firefox (`--profile <ruta>`, entre comillas si la ruta
 * lleva espacios), en UTF-16LE, y su alineación depende de lo que los precede (la longitud de la ruta del ejecutable):
 * se lee desde el byte 0 y desde el 1. Firefox escribe cada argumento entre comillas (`"--profile" "<ruta>" `,
 * nsWindowsShellService.cpp, CreateShellLinkObject), así que tras «--profile» puede venir su comilla de cierre. La ruta
 * tiene que ir entera, hasta la comilla de cierre o un separador: otro perfil cuya ruta empiece igual no cuenta.
 *
 * @param {Uint8Array} bytes el .lnk
 * @param {string} ruta la carpeta del perfil
 */
export function lnkConRuta(bytes, ruta) {
  const r = ruta.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patron = new RegExp(`--profile"?\\s+(?:"${r}"|${r}(?=[\\s\\0"]|$))`, "i");
  const d = new TextDecoder("utf-16le");
  return [0, 1].some(i => patron.test(d.decode(bytes.subarray(i))));
}

/**
 * El acceso directo del escritorio de un perfil (Windows): Firefox apunta su nombre en el prefs.js de ese perfil. Solo
 * se da si el .lnk sigue en el escritorio y lleva la ruta de ese perfil (lo creó Firefox para él).
 *
 * @param {SelectableProfile} perfil
 * @returns {Promise<string|null>} el nombre del archivo
 */
export async function accesoDirecto(perfil) {
  if (Services.appinfo.OS != "WINNT") {
    return null;
  }
  try {
    const prefs = await IOUtils.readUTF8(PathUtils.join(perfil.path, "prefs.js"));
    const linea = prefs.split("\n").find(l => l.includes(`"${PREF_ACCESO}"`));
    const nombre = linea && JSON.parse(linea.slice(linea.indexOf(",") + 1, linea.lastIndexOf(")")).trim());
    if (typeof nombre != "string" || !/^[^\\/:*?"<>|]+\.lnk$/i.test(nombre)) {
      return null;
    }
    const lnk = PathUtils.join(Services.dirsvc.get("Desk", Ci.nsIFile).path, nombre);
    return lnkConRuta(await IOUtils.read(lnk), perfil.path) ? nombre : null;
  } catch (e) {
    return null;
  }
}

/**
 * Borra un perfil que no es el que está en uso: su acceso directo, sus carpetas y su fila del grupo. Si era el que
 * abre Aegis de serie, pasa a serlo el que está en uso (o, al arrancar, otro de los que quedan). Su imagen de avatar
 * propia (Firefox la guarda fuera del perfil, en «Profile Groups/avatars/<uuid>», y deleteProfile no la borra) se
 * borra también si ningún perfil del grupo la usa (copiar un perfil la comparte). Solo falla (y el diálogo dice que no
 * se ha podido borrar) si no se ha borrado el perfil; lo de después, ya borrado, solo se apunta.
 *
 * @param {SelectableProfile} perfil
 * @param {string|null} acceso nombre del acceso directo del escritorio, si lo tiene
 */
async function borrar(perfil, acceso) {
  const sps = lazy.SelectableProfileService;
  const raiz = await perfil.rootDir;
  const deSerie = sps.groupToolkitProfile?.rootDir?.equals(raiz);
  const avatares = PathUtils.join(lazy.ProfilesDatastoreService.constructor.PROFILE_GROUPS_DIR, "avatars");
  const imagen =
    perfil.hasCustomAvatar && /^[0-9a-f-]{36}$/i.test(perfil.avatar) && PathUtils.parent(perfil.getAvatarPath()) == avatares
      ? { nombre: perfil.avatar, ruta: perfil.getAvatarPath() }
      : null;
  if (sps.currentProfile) {
    await sps.deleteProfile(perfil);
  } else {
    // Al arrancar (la ventana sale antes de abrir ningún perfil) no hay perfil en uso y deleteProfile no se puede
    // llamar: los mismos dos pasos que hace él.
    await lazy.ProfilesDatastoreService.toolkitProfileService.removeProfileFilesByPath(raiz, null, 0);
    const db = await lazy.ProfilesDatastoreService.getConnection();
    await db.execute("DELETE FROM Profiles WHERE id = :id;", { id: perfil.id });
    lazy.ProfilesDatastoreService.notify();
  }
  if (acceso) {
    try {
      await Cc["@mozilla.org/browser/shell-service;1"]
        .getService(Ci.nsIWindowsShellService)
        .deleteShortcut("Desktop", acceso);
    } catch (e) {
      console.error("Aegis: acceso directo del perfil borrado", e);
    }
  }
  if (deSerie) {
    try {
      const otro = sps.currentProfile ?? (await sps.getAllProfiles())[0];
      if (otro) {
        await sps.setDefaultProfileForGroup(otro);
      }
    } catch (e) {
      console.error("Aegis: perfil de serie tras borrar otro", e);
    }
  }
  if (imagen) {
    try {
      if (!(await sps.getAllProfiles()).some(p => p.avatar == imagen.nombre)) {
        await IOUtils.remove(imagen.ruta, { ignoreAbsent: true });
        await IOUtils.remove(imagen.ruta + ".tmp", { ignoreAbsent: true });
      }
    } catch (e) {
      console.error("Aegis: avatar del perfil borrado", e);
    }
  }
}

/**
 * El diálogo «¿Borrar el perfil…?».
 *
 * @param {Document} doc la ventana de perfiles
 * @param {SelectableProfile} perfil
 */
async function preguntar(doc, perfil) {
  doc.querySelector(".aegis-perfil-borrar")?.remove();
  const acceso = await accesoDirecto(perfil);
  const crear = (etiqueta, clase, contenido) => {
    const el = doc.createElement(etiqueta);
    el.className = clase;
    if (contenido) {
      el.textContent = contenido;
    }
    return el;
  };
  const dialogo = crear("dialog", "aegis-perfil-borrar");
  const cabecera = crear("div", "aegis-perfil-borrar-cabecera");
  const avatar = crear("img", "aegis-perfil-borrar-avatar");
  avatar.alt = "";
  perfil
    .getAvatarURL(48)
    .then(url => (avatar.src = url))
    .catch(() => avatar.remove());
  const titulo = crear("h2", "aegis-perfil-borrar-titulo", texto("aegis-perfiles-borrar-titulo", { nombre: perfil.name }));
  titulo.id = "aegis-perfil-borrar-titulo";
  cabecera.append(avatar, titulo);
  const explicacion = crear(
    "p",
    "aegis-perfil-borrar-texto",
    texto("aegis-perfiles-borrar-texto") + (acceso ? " " + texto("aegis-perfiles-borrar-acceso") : "")
  );
  explicacion.id = "aegis-perfil-borrar-texto";
  const estado = crear("p", "aegis-perfil-borrar-estado");
  estado.setAttribute("role", "alert");
  const pie = crear("div", "aegis-perfil-borrar-pie");
  const cancelar = crear("button", "aegis-perfil-borrar-secundario", texto("aegis-perfiles-borrar-cancelar"));
  cancelar.addEventListener("click", () => dialogo.close());
  const confirmar = crear("button", "aegis-perfil-borrar-principal", texto("aegis-perfiles-borrar-confirmar"));
  confirmar.addEventListener("click", async () => {
    confirmar.disabled = cancelar.disabled = true;
    estado.textContent = "";
    try {
      await borrar(perfil, acceso);
      const selector = doc.querySelector("profile-selector");
      if (selector) {
        selector.profiles = await lazy.SelectableProfileService.getAllProfiles();
      }
      dialogo.close();
    } catch (e) {
      // Casi siempre, que el perfil está abierto en otra ventana de Aegis: Firefox no toma su cerrojo y no borra nada.
      console.error("Aegis: borrar un perfil", e);
      estado.textContent = texto("aegis-perfiles-borrar-error", { nombre: perfil.name });
      confirmar.disabled = cancelar.disabled = false;
    }
  });
  pie.append(cancelar, confirmar);
  dialogo.setAttribute("aria-labelledby", titulo.id);
  dialogo.setAttribute("aria-describedby", explicacion.id);
  dialogo.append(cabecera, explicacion, estado, pie);
  dialogo.addEventListener("close", () => dialogo.remove());
  doc.body.append(dialogo);
  dialogo.showModal();
  // El foco, en la salida segura.
  cancelar.focus();
}

export const AegisPerfiles = {
  DIRECCION,

  /**
   * @param {Document} doc la ventana de perfiles, recién creada
   */
  gestor(doc) {
    const win = doc.defaultView;
    try {
      win.windowUtils.loadSheetUsingURIString(new URL(SOMBRA, import.meta.url).href, win.windowUtils.USER_SHEET);
    } catch (e) {
      console.error("Aegis: hoja de la ventana de perfiles", e);
    }
    // Antes que la ventana de Firefox (que escucha en el documento): captura en la ventana.
    win.addEventListener(
      "DeleteProfile",
      event => {
        const perfil = event.detail;
        const sps = lazy.SelectableProfileService;
        if (!perfil || perfil.id == sps.currentProfile?.id) {
          // El perfil en uso: about:deleteprofile, que dice lo que se borra y cierra Aegis.
          return;
        }
        if (!sps.currentProfile && doc.querySelector("profile-selector")?.profiles?.length <= 1) {
          // Al arrancar, con un solo perfil: el camino de Firefox, que crea otro antes de borrar el último.
          return;
        }
        event.stopImmediatePropagation();
        preguntar(doc, perfil).catch(e => console.error("Aegis: borrar un perfil", e));
      },
      true
    );
  },
};
