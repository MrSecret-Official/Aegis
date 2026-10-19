/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · Importar de Firefox y de otro perfil de Aegis. Dos migradores para el asistente de importar de Firefox
 * (Ajustes › General › Importar datos, Biblioteca, menú Archivo), que los registra con una entrada cada uno en
 * MIGRATOR_MODULES (parche 0900-migracion/0001); el asistente los enseña si browser.migrate.<clave>.enabled
 * (settings/prefs/67-migracion.js) y si hay algún perfil.
 *
 * - «Firefox» (aegis-firefox): los perfiles de su profiles.ini (en Windows, %APPDATA%\Mozilla\Firefox). Ahí están
 *   también los perfiles de las instalaciones antiguas de Aegis 157, de antes de la identidad propia.
 * - «Aegis» (aegis-perfil): los demás perfiles de este Aegis (el profiles.ini de UAppData; en Windows,
 *   %APPDATA%\Aegis), nunca el que está en uso.
 *
 * El FirefoxProfileMigrator de Firefox no sirve para esto: solo funciona al crear un perfil («startup-only»), copia
 * los archivos tal cual encima del perfil nuevo y lista los perfiles de la propia aplicación. Estos dos se usan con el
 * navegador abierto y **fusionan** (fusion.sys.mjs): marcadores, historial y formularios se añaden a lo que hay.
 *
 * Se lee places.sqlite y formhistory.sqlite sin bloquearlos (MigrationUtils.getRowsFromDBWithoutLocks, como el de
 * Chrome), así que el otro navegador puede estar abierto; entonces puede faltar lo último que hizo (lo que aún no ha
 * pasado del -wal a la base). Nada de esto conecta con la red.
 *
 * Contraseñas: no se leen de otro perfil (key4.db y logins.json). El asistente ofrece el CSV (Firefox lo exporta en
 * about:logins) y, para otro Aegis, que no exporta en claro, el paquete cifrado con el código de 6 palabras
 * (asistente.sys.mjs y contrasenas/transferencia/). Lo que entra por el CSV o por el paquete acaba en la bóveda con
 * contraseña principal (contrasenas.sys.mjs).
 */

import { MigrationUtils } from "resource:///modules/MigrationUtils.sys.mjs";
import { MigratorBase } from "resource:///modules/MigratorBase.sys.mjs";
import {
  CONSULTAS,
  RAICES,
  arbolDeMarcadores,
  clavePar,
  consultaHistorial,
  consultaPaginas,
  operacionesDeFormularios,
  paginasDeHistorial,
  perfilesDeIni,
  planDeFusion,
  sinElActivo,
} from "./fusion.sys.mjs";

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  AppConstants: "resource://gre/modules/AppConstants.sys.mjs",
  FormHistory: "resource://gre/modules/FormHistory.sys.mjs",
  PlacesUtils: "resource://gre/modules/PlacesUtils.sys.mjs",
});

/** Visitas como mucho por página (las más recientes): bastan para el orden de la barra de direcciones. */
const VISITAS_POR_PAGINA = 10;

/** Archivos del perfil de origen que se leen (solo esos). */
const PLACES = "places.sqlite";
const FORMULARIOS = "formhistory.sqlite";

const windows = () => lazy.AppConstants.platform == "win";

/** Un directorio del servicio de directorios con más tramos; null si no existe. */
function carpeta(clave, ...tramos) {
  try {
    const dir = Services.dirsvc.get(clave, Ci.nsIFile);
    for (const t of tramos) {
      dir.append(t);
    }
    return dir;
  } catch (e) {
    return null;
  }
}

/** Una carpeta dentro de la de configuración XDG ($XDG_CONFIG_HOME o ~/.config); null si no se puede resolver. */
function configXdg(...tramos) {
  const xdg = Services.env.get("XDG_CONFIG_HOME");
  if (!xdg) {
    return carpeta("Home", ".config", ...tramos);
  }
  try {
    const dir = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
    dir.initWithPath(xdg);
    for (const t of tramos) {
      dir.append(t);
    }
    return dir;
  } catch (e) {
    return null;
  }
}

/**
 * Lee un profiles.ini con nsIINIParser y devuelve los perfiles con su carpeta ya resuelta (las relativas, respecto a
 * la carpeta del profiles.ini, como hace el servicio de perfiles).
 *
 * @param {nsIFile} raiz carpeta que contiene profiles.ini
 * @returns {{nombre: string, ruta: string, dir: nsIFile}[]}
 */
function perfilesDe(raiz) {
  const archivo = raiz.clone();
  archivo.append("profiles.ini");
  if (!archivo.exists() || !archivo.isFile()) {
    return [];
  }
  let parser;
  try {
    parser = Cc["@mozilla.org/xpcom/ini-parser-factory;1"]
      .getService(Ci.nsIINIParserFactory)
      .createINIParser(archivo);
  } catch (e) {
    console.error(`Aegis: no se pudo leer ${archivo.path}`, e);
    return [];
  }
  const ini = {
    secciones() {
      const lista = [];
      const e = parser.getSections();
      while (e.hasMore()) {
        lista.push(e.getNext());
      }
      return lista;
    },
    valor(seccion, clave) {
      try {
        return parser.getString(seccion, clave);
      } catch (e) {
        return null;
      }
    },
  };
  const perfiles = [];
  for (const p of perfilesDeIni(ini)) {
    try {
      const dir = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
      if (p.relativa) {
        dir.setRelativeDescriptor(raiz, p.ruta);
      } else {
        dir.initWithPath(p.ruta);
      }
      dir.normalize();
      perfiles.push({ nombre: p.nombre, ruta: dir.path, dir });
    } catch (e) {
      // Una ruta que no se puede resolver: ese perfil no se ofrece.
    }
  }
  return perfiles;
}

function archivoDe(dir, nombre) {
  const f = dir.clone();
  f.append(nombre);
  return f;
}

/** Base de Places en microsegundos desde la que se importa el historial (browser.migrate.history.maxAgeInDays). */
function desdeHistorial() {
  return (Date.now() - MigrationUtils.HISTORY_MAX_AGE_IN_MILLISECONDS) * 1000;
}

/** El número de la primera columna de la primera fila de una consulta COUNT(*). */
async function contar(ruta, descripcion, consulta) {
  try {
    const filas = await MigrationUtils.getRowsFromDBWithoutLocks(ruta, descripcion, consulta);
    return filas[0]?.getResultByName("n") ?? 0;
  } catch (e) {
    return 0;
  }
}

/** Filas de mozIStorageRow a objetos con esos campos. */
function objetos(filas, campos) {
  return filas.map(f => Object.fromEntries(campos.map(c => [c, f.getResultByName(c)])));
}

/**
 * Un recurso del asistente: «hacer» es async y el resultado se avisa con aCallback(éxito), como piden MigratorBase y
 * MigrationWizardParent.
 */
function recurso(type, hacer) {
  return {
    type,
    migrate(aCallback) {
      hacer().then(
        () => aCallback(true),
        e => {
          console.error("Aegis: importar", e);
          aCallback(false);
        }
      );
    },
  };
}

/* ───────── Marcadores ───────── */

/** Una carpeta de Aegis (PlacesUtils.promiseBookmarksTree) en la forma que espera planDeFusion. */
function carpetaDeAegis(nodo) {
  const contenedor = nodo.type == lazy.PlacesUtils.TYPE_X_MOZ_PLACE_CONTAINER;
  return {
    guid: nodo.guid,
    carpeta: contenedor,
    titulo: nodo.title ?? "",
    url: nodo.uri,
    hijos: contenedor ? (nodo.children ?? []).map(carpetaDeAegis) : [],
  };
}

async function importarMarcadores(places) {
  const filas = await MigrationUtils.getRowsFromDBWithoutLocks(places, "Aegis: marcadores", CONSULTAS.arbol);
  const origen = arbolDeMarcadores(
    objetos(filas, ["id", "tipo", "padre", "posicion", "titulo", "guid", "fechaAlta", "url"])
  );
  for (const guid of RAICES) {
    const hijos = origen.get(guid);
    if (!hijos?.length) {
      continue;
    }
    const destino = carpetaDeAegis(await lazy.PlacesUtils.promiseBookmarksTree(guid));
    for (const { padre, hijos: nuevos } of planDeFusion(hijos, destino)) {
      await MigrationUtils.insertManyBookmarksWrapper(nuevos, padre);
    }
  }
}

/* ───────── Historial ───────── */

async function importarHistorial(places) {
  const limite = Services.prefs.getIntPref("browser.migrate.chrome.history.limit", 2000) || 2000;
  const filas = await MigrationUtils.getRowsFromDBWithoutLocks(
    places,
    "Aegis: historial",
    consultaHistorial(desdeHistorial(), limite)
  );
  const paginas = paginasDeHistorial(objetos(filas, ["url", "titulo", "fecha", "tipo"]), VISITAS_POR_PAGINA);
  if (paginas.length) {
    await MigrationUtils.insertVisitsWrapper(paginas);
  }
}

/* ───────── Formularios ───────── */

async function importarFormularios(ruta) {
  const filas = await MigrationUtils.getRowsFromDBWithoutLocks(ruta, "Aegis: formularios", CONSULTAS.paresDeFormularios);
  const existentes = new Set(
    (await lazy.FormHistory.search(["fieldname", "value"], {})).map(e => clavePar(e.fieldname, e.value))
  );
  const ops = operacionesDeFormularios(objetos(filas, ["campo", "valor", "usos", "primero", "ultimo"]), existentes);
  if (ops.length) {
    await lazy.FormHistory.update(ops);
  }
}

/* ───────── Los migradores ───────── */

/**
 * Lo común: perfiles de uno o varios profiles.ini (raices()), sin el perfil en uso, y los recursos de cada uno. No es
 * «startup-only»: sale también desde Ajustes.
 */
class AegisPerfilesMigrator extends MigratorBase {
  /** @returns {nsIFile[]} carpetas con un profiles.ini */
  raices() {
    return [];
  }

  /** Los perfiles que se pueden importar: con places.sqlite o formhistory.sqlite y que no sean el que está en uso. */
  #perfiles() {
    const activo = Services.dirsvc.get("ProfD", Ci.nsIFile);
    activo.normalize();
    const todos = this.raices()
      .filter(Boolean)
      .flatMap(raiz => perfilesDe(raiz));
    return sinElActivo(todos, activo.path, windows()).filter(p => {
      try {
        return (
          p.dir.isDirectory() &&
          p.dir.isReadable() &&
          (archivoDe(p.dir, PLACES).exists() || archivoDe(p.dir, FORMULARIOS).exists())
        );
      } catch (e) {
        return false;
      }
    });
  }

  async getSourceProfiles() {
    return this.#perfiles()
      .map(p => ({ id: p.ruta, name: p.nombre }))
      .sort((a, b) => a.name.toLocaleLowerCase().localeCompare(b.name.toLocaleLowerCase()));
  }

  async getResources(aProfile) {
    // El perfil llega del asistente (que puede estar en un proceso de contenido): solo vale uno de los de la lista.
    const perfil = this.#perfiles().find(p => p.ruta == aProfile?.id);
    if (!perfil) {
      return [];
    }
    const recursos = [];
    const places = archivoDe(perfil.dir, PLACES).path;
    if (await IOUtils.exists(places)) {
      if (await contar(places, "Aegis: marcadores", CONSULTAS.marcadores)) {
        recursos.push(recurso(MigrationUtils.resourceTypes.BOOKMARKS, () => importarMarcadores(places)));
      }
      if (await contar(places, "Aegis: historial", consultaPaginas(desdeHistorial()))) {
        recursos.push(recurso(MigrationUtils.resourceTypes.HISTORY, () => importarHistorial(places)));
      }
    }
    const formularios = archivoDe(perfil.dir, FORMULARIOS).path;
    if ((await IOUtils.exists(formularios)) && (await contar(formularios, "Aegis: formularios", CONSULTAS.formularios))) {
      recursos.push(recurso(MigrationUtils.resourceTypes.FORMDATA, () => importarFormularios(formularios)));
    }
    return recursos;
  }

  /** El uso más reciente de cualquiera de sus perfiles (el asistente ordena los navegadores así). */
  async getLastUsedDate() {
    let ultimo = 0;
    for (const p of this.#perfiles()) {
      try {
        ultimo = Math.max(ultimo, (await IOUtils.stat(archivoDe(p.dir, PLACES).path)).lastModified);
      } catch (e) {
        // Sin places.sqlite: no cuenta.
      }
    }
    return new Date(ultimo);
  }

  /**
   * «Contraseñas» sale en la lista aunque no se lean: al elegirla, el asistente enseña cómo pasarlas
   * (asistente.sys.mjs) en lugar de importar nada.
   */
  get showsManualPasswordImport() {
    return true;
  }
}

/** «Firefox»: sus perfiles, en la carpeta de cada sistema. */
export class AegisFirefoxMigrator extends AegisPerfilesMigrator {
  static get key() {
    return "aegis-firefox";
  }

  static get displayNameL10nID() {
    return "aegis-migracion-navegador-firefox";
  }

  /** Un navegador genérico de línea (nada de logotipos de otros en los archivos de Aegis). */
  static get brandImage() {
    return "chrome://browser/content/aegis/migracion-navegador.svg";
  }

  raices() {
    switch (lazy.AppConstants.platform) {
      case "win":
        return [carpeta("AppData", "Mozilla", "Firefox")];
      case "macosx":
        return [carpeta("Home", "Library", "Application Support", "Firefox")];
      default:
        // Linux: la carpeta clásica, la XDG de las versiones nuevas y las de Flatpak y Snap.
        return [
          carpeta("Home", ".mozilla", "firefox"),
          configXdg("mozilla", "firefox"),
          carpeta("Home", ".var", "app", "org.mozilla.firefox", ".mozilla", "firefox"),
          carpeta("Home", "snap", "firefox", "common", ".mozilla", "firefox"),
        ];
    }
  }
}

/** «Aegis»: los otros perfiles de este Aegis (el profiles.ini de su carpeta de datos, UAppData). */
export class AegisPerfilMigrator extends AegisPerfilesMigrator {
  static get key() {
    return "aegis-perfil";
  }

  static get displayNameL10nID() {
    return "aegis-migracion-navegador-aegis";
  }

  static get brandImage() {
    return "chrome://branding/content/icon128.png";
  }

  raices() {
    return [carpeta("UAppData")];
  }
}
