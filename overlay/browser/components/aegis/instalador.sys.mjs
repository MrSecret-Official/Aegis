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
 * - idioma: la build trae seis idiomas y de serie sigue al de Windows (intl.locale.requested vacía, 50-interfaz.js).
 *   Solo si el idioma del instalador (el de Windows, o el que forzó `--idioma`) da otro de los seis que el de Windows,
 *   se pide con Services.locale.requestedLocales, como Ajustes › Idioma; si da el mismo, no se toca nada y Aegis sigue
 *   a Windows aunque cambie. Un idioma que la build no trae se salta.
 *
 * Si el archivo falta, no se entiende o es de un formato desconocido, no se aplica nada; un valor desconocido se salta.
 * Sin archivo (la versión de la Microsoft Store y el zip no pasan por Aegis Setup), inicio() lo dice y AegisArranque
 * deja pendiente la bienvenida del navegador (bienvenida.sys.mjs), que hace las mismas preguntas y aplica lo elegido
 * con aplicar(): las mismas funciones y los mismos valores que el archivo.
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

/**
 * Lo recomendado: lo que Aegis pone de serie en un perfil nuevo (Estándar, Estricto+, DuckDuckGo y el tema que sigue
 * al sistema). Es lo que sale elegido en el asistente de Aegis Setup y en la bienvenida, y lo que aplica «Usar lo
 * recomendado».
 */
export const RECOMENDADO = Object.freeze({
  modo: "estandar",
  escudos: "estricto_mas",
  buscador: "duckduckgo",
  apariencia: "auto",
});

/** Buscador pendiente hasta que AegisArranque haya puesto el de serie (buscadorDeSerieUnaVez). */
let buscadorPendiente = null;
/** Tema pendiente hasta que termine de abrirse la primera ventana (ver la cabecera). */
let temaPendiente = null;
/** Se cumple cuando AegisArranque ya ha puesto el buscador de serie (buscador()): el elegido va siempre después. */
let buscadorDeSerieListo;
const esperaBuscadorDeSerie = new Promise(r => (buscadorDeSerieListo = r));

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

/**
 * Qué hay que hacer con una elección (las claves y valores del archivo, docs/INSTALADOR.md). Lo desconocido se queda
 * en null y no se toca; «auto» (el tema de serie, que sigue al sistema) tampoco cambia nada.
 *
 * @param {object} el modo, escudos, buscador y apariencia
 * @param {number} [formato] el del archivo (en el 1, «estricto» era el de serie: Estricto+)
 */
function interpretar(el, formato = 2) {
  const niveles = formato == 1 ? NIVELES_FORMATO_1 : NIVELES;
  return {
    modo: el.modo == "estandar" || el.modo == "workflow" ? el.modo : null,
    nivel: Object.hasOwn(niveles, el.escudos) ? niveles[el.escudos] : null,
    buscador: Object.hasOwn(BUSCADORES, el.buscador) ? BUSCADORES[el.buscador] : null,
    tema: Object.hasOwn(TEMAS, el.apariencia) && el.apariencia != "auto" ? TEMAS[el.apariencia] : null,
  };
}

/**
 * El idioma de los que trae la build que corresponde a una lista de idiomas pedidos (la misma negociación que hace
 * LocaleService con intl.locale.requested), o null si ninguno casa.
 *
 * @param {string[]} pedidos
 */
function idiomaDeLaBuild(pedidos) {
  const [idioma] = Services.locale.negotiateLanguages(
    pedidos,
    Services.locale.availableLocales,
    "",
    Services.locale.langNegStrategyFiltering
  );
  return idioma ?? null;
}

/** El idioma del instalador, solo si da otro de los de la build que el de Windows (ver la cabecera). */
function ponerIdioma(idioma) {
  if (typeof idioma != "string" || !/^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(idioma)) {
    return;
  }
  const elegido = idiomaDeLaBuild([idioma]);
  if (!elegido) {
    return;
  }
  const sistema = Cc["@mozilla.org/intl/ospreferences;1"].getService(Ci.mozIOSPreferences).systemLocales;
  const deWindows = idiomaDeLaBuild(sistema) ?? Services.locale.defaultLocale;
  if (elegido != deWindows) {
    Services.locale.requestedLocales = [elegido];
  }
}

/** Modo y nivel de los Escudos: al momento (prefs que los módulos ya observan). */
function aplicarModoYNivel({ modo, nivel }) {
  if (modo) {
    AegisModos.aplicar(modo);
  }
  if (nivel) {
    ponerNivel(nivel);
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
   * @returns {boolean} true si es el primer arranque de un perfil nuevo y no había un archivo que se entienda: hay que
   *   preguntar en la bienvenida (bienvenida.sys.mjs)
   */
  inicio(perfilNuevo) {
    if (Services.prefs.getBoolPref(MARCA, false)) {
      return false;
    }
    Services.prefs.setBoolPref(MARCA, true);
    if (!perfilNuevo) {
      return false;
    }
    const el = leer();
    if (!el) {
      return true;
    }
    const que = interpretar(el, el.formato);
    aplicarModoYNivel(que);
    try {
      ponerIdioma(el.idioma);
    } catch (e) {
      console.error("Aegis: idioma del instalador", e);
    }
    temaPendiente = que.tema;
    buscadorPendiente = que.buscador;
    return false;
  },

  /** Después del buscador de serie (AegisArranque.buscadorDeSerieUnaVez): el elegido en el instalador, si lo hay. */
  async buscador() {
    buscadorDeSerieListo();
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

  /**
   * Lo elegido en la bienvenida (bienvenida.sys.mjs), con la ventana ya abierta: lo mismo que haría el archivo del
   * instalador. Modo y Escudos, al momento; el buscador, después del de serie (si la bienvenida acaba antes de que
   * AegisArranque lo ponga, lo pisaría); el tema, cuando Firefox ha terminado de instalar los suyos.
   *
   * @param {object} el modo, escudos, buscador y apariencia, con los valores del archivo
   */
  async aplicar(el) {
    const que = interpretar(el);
    aplicarModoYNivel(que);
    const pendientes = [];
    if (que.buscador) {
      pendientes.push(esperaBuscadorDeSerie.then(() => ponerBuscador(que.buscador)));
    }
    if (que.tema) {
      pendientes.push(ponerApariencia(que.tema));
    }
    const resultados = await Promise.allSettled(pendientes);
    for (const r of resultados) {
      if (r.status == "rejected") {
        console.error("Aegis: elecciones de la bienvenida", r.reason);
      }
    }
  },
};
