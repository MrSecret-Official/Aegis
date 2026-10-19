/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · las elecciones del instalador (docs/INSTALADOR.md, «Elecciones para el primer arranque»).
 *
 * Aegis Setup deja lo elegido en su asistente en `distribution/aegis-instalador.json`, dentro de la carpeta de la
 * aplicación (Firefox no lee ese archivo). En el primer arranque de un perfil nuevo, este módulo lo lee y aplica cada
 * valor con las mismas funciones que usa la interfaz de Aegis, como preferencias de usuario: lo que el usuario cambie
 * después manda, porque no se vuelve a aplicar nunca (marca `aegis.instalador.aplicado`, que se pone en el primer
 * arranque de cualquier perfil, haya archivo o no).
 *
 * - modo: AegisModos.aplicar (como el botón «Modo»).
 * - escudos: ponerNivel de escudos.sys.mjs (como el desplegable del panel de Escudos).
 * - buscador: SearchService.setDefault (como Ajustes › Búsqueda y la lupa). Startpage y Brave Search no están en la
 *   configuración de búsqueda de Firefox en todas las regiones: si faltan, se añaden como buscador del usuario
 *   (SearchService.addUserEngine, lo mismo que «Añadir buscador» de Ajustes; su icono sale solo de la caché local de
 *   favicons). Ninguna búsqueda sale hasta que el usuario busca.
 * - apariencia: el tema Oscuro, Claro o el de serie (que sigue al sistema), con AddonManager, como la bienvenida y
 *   Complementos. Se pone cuando termina de abrirse la primera ventana (ventana()), no al arrancar: en un perfil nuevo,
 *   Firefox está instalando todavía sus temas integrados (XPIProvider y BuiltInThemes.maybeInstallActiveBuiltInTheme,
 *   sin esperar), y activar uno en medio dejaba todos los temas desactivados (visto el 2026-10-16 en la build). Antes
 *   se espera a AddonManagerPrivate.databaseReady y a ensureBuiltInThemes, como la bienvenida al elegir un tema.
 * - idioma: todavía no se aplica. La build solo trae la interfaz de Firefox en inglés, y pedir otro idioma de la
 *   aplicación (Services.locale.requestedLocales) solo traduciría una parte de los textos de Aegis: casi todos van
 *   junto a branding/brand.ftl, que solo existe en inglés, y Fluent deja en inglés el grupo entero (probado con la
 *   copia de desarrollo: about:conexiones y el panel de Escudos seguían en inglés). Además, las webs verían por Intl
 *   un idioma distinto del de Accept-Language, una combinación más rara (huella). Cuando la build traiga los paquetes
 *   de idioma (docs/PLANNING.md, «Build multi-idioma»), se aplicará aquí con requestedLocales, como Ajustes › Idioma.
 *
 * Si el archivo falta, no se entiende o es de un formato desconocido, no se hace nada; un valor desconocido se salta.
 * Sin red y sin temporizadores: una lectura de un archivo pequeño, una sola vez en la vida del perfil.
 */

import { AegisModos } from "./modos.sys.mjs";
import { ponerNivel } from "./escudos.sys.mjs";

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  AddonManager: "resource://gre/modules/AddonManager.sys.mjs",
  AddonManagerPrivate: "resource://gre/modules/AddonManager.sys.mjs",
  BuiltInThemes: "resource:///modules/BuiltInThemes.sys.mjs",
  SearchService: "moz-src:///toolkit/components/search/SearchService.sys.mjs",
});

const MARCA = "aegis.instalador.aplicado";
const ARCHIVO = "aegis-instalador.json";
/** Formatos que se entienden (packaging/instalador/src/instalar.rs, FORMATO). */
const FORMATOS = [1, 2];

/** Niveles de Escudos: valor del JSON → valor de ponerNivel. En el formato 1, «estricto» era el de serie (Estricto+). */
const NIVELES = { normal: "standard", estricto: "strict", estricto_mas: "strict+" };
const NIVELES_FORMATO_1 = { normal: "standard", estricto: "strict+" };

/** Buscadores: nombre en SearchService y, si puede faltar en la configuración, la dirección para añadirlo. */
const BUSCADORES = {
  duckduckgo: { nombre: "DuckDuckGo" },
  startpage: { nombre: "Startpage", url: "https://www.startpage.com/sp/search?q={searchTerms}" },
  brave: { nombre: "Brave Search", url: "https://search.brave.com/search?q={searchTerms}" },
  google: { nombre: "Google" },
};

/** Apariencia: tema que se activa (los mismos que ofrece la bienvenida). */
const TEMAS = {
  oscuro: "firefox-compact-dark@mozilla.org",
  claro: "firefox-compact-light@mozilla.org",
  auto: "default-theme@mozilla.org",
};

/** Buscador pendiente hasta que AegisArranque haya puesto el de serie (buscadorDeSerieUnaVez). */
let buscadorPendiente = null;
/** Tema pendiente hasta que termine de abrirse la primera ventana (ver la cabecera). */
let temaPendiente = null;

/**
 * Lee el archivo del instalador. null si falta, no se entiende o es de un formato desconocido.
 *
 * @returns {object|null}
 */
function leer() {
  let archivo;
  try {
    archivo = Services.dirsvc.get("XREAppDist", Ci.nsIFile);
    archivo.append(ARCHIVO);
    if (!archivo.exists() || !archivo.isFile() || archivo.fileSize > 64 * 1024) {
      return null;
    }
  } catch (e) {
    return null;
  }
  try {
    const datos = JSON.parse(Cu.readUTF8File(archivo));
    if (!datos || typeof datos != "object" || !FORMATOS.includes(datos.formato)) {
      console.warn(`Aegis: ${ARCHIVO} con un formato que no se entiende; se ignora`);
      return null;
    }
    return datos;
  } catch (e) {
    console.warn(`Aegis: ${ARCHIVO} no se entiende; se ignora`, e);
    return null;
  }
}

async function ponerApariencia(id) {
  // Primero, que terminen las instalaciones de temas que Firefox empieza al arrancar.
  await lazy.AddonManagerPrivate.databaseReady;
  await lazy.BuiltInThemes.ensureBuiltInThemes();
  const tema = await lazy.AddonManager.getAddonByID(id);
  if (tema && !tema.isActive) {
    await tema.enable();
  }
}

async function ponerBuscador({ nombre, url }) {
  const buscador = lazy.SearchService;
  await buscador.init();
  let motor = buscador.getEngineByName(nombre);
  if (!motor && url) {
    motor = await buscador.addUserEngine({ name: nombre, url });
  }
  if (motor && motor != buscador.defaultEngine) {
    await buscador.setDefault(motor, buscador.CHANGE_REASON.USER);
  }
}

export const AegisInstalador = {
  /**
   * Una vez por arranque, antes de que se abra la primera ventana y después de poner el nivel de serie de los
   * Escudos (AegisArranque). Modo y Escudos quedan puestos al volver; el buscador y el tema, después (buscador() y
   * ventana()).
   *
   * @param {boolean} perfilNuevo si es el primer arranque de este perfil
   */
  inicio(perfilNuevo) {
    if (Services.prefs.getBoolPref(MARCA, false)) {
      return;
    }
    Services.prefs.setBoolPref(MARCA, true);
    if (!perfilNuevo) {
      return;
    }
    const el = leer();
    if (!el) {
      return;
    }
    if (el.modo == "estandar" || el.modo == "workflow") {
      AegisModos.aplicar(el.modo);
    }
    const nivel = (el.formato == 1 ? NIVELES_FORMATO_1 : NIVELES)[el.escudos];
    if (nivel) {
      ponerNivel(nivel);
    }
    // el.idioma: todavía no (ver la cabecera).
    // «auto» es el tema de serie: no hay nada que cambiar.
    if (Object.hasOwn(TEMAS, el.apariencia) && el.apariencia != "auto") {
      temaPendiente = TEMAS[el.apariencia];
    }
    if (Object.hasOwn(BUSCADORES, el.buscador)) {
      buscadorPendiente = BUSCADORES[el.buscador];
    }
  },

  /** Después del buscador de serie (AegisArranque.buscadorDeSerieUnaVez): el elegido en el instalador, si lo hay. */
  async buscador() {
    const pendiente = buscadorPendiente;
    buscadorPendiente = null;
    if (pendiente) {
      await ponerBuscador(pendiente);
    }
  },

  /** Cada ventana del navegador al terminar de abrirse (AegisArranque.ventana): en la primera, el tema elegido. */
  ventana() {
    const pendiente = temaPendiente;
    temaPendiente = null;
    if (pendiente) {
      ponerApariencia(pendiente).catch(e => console.error("Aegis: apariencia del instalador", e));
    }
  },
};
