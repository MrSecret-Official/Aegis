/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · los accesos automáticos de la nueva pestaña: «Descartar» quita el sitio entero, y solo salen sitios
 * visitados en Aegis.
 *
 * 1. «Descartar». Firefox guarda la dirección descartada (NewTabUtils.blockedLinks, pref browser.newtabpage.blocked,
 *    con el hash MD5 de la dirección) y, al calcular los accesos, primero quita las bloqueadas y después se queda con
 *    la página más visitada de cada sitio (ActivityStreamProvider.getTopFrecentSites, onePerDomain). Si el sitio tiene
 *    más páginas en el historial, la siguiente ocupa la loseta con el mismo nombre y el mismo icono, y parece que
 *    «Descartar» no ha hecho nada (y cada intento solo bloquea otra página).
 *
 *    Aquí, al descartar una dirección que es un acceso directo, se guarda además una marca del sitio (su host sin
 *    «www.», como agrupa Firefox) en el mismo almacén y con el mismo hash: el nombre no queda en claro en prefs.js, y
 *    lo que vacía ese almacén lo vacía también. isBlocked() mira además esa marca, así que ninguna página del sitio
 *    vuelve a salir. Añadirlo a mano («Añadir acceso directo», que llama a unblock) la quita.
 *
 * 2. Solo lo visitado en Aegis. Firefox elige los accesos automáticos por «frecencia» entre todo el historial, también
 *    el importado de otro navegador (Importar datos): con el historial de Brave o de Chrome dentro, los accesos se
 *    llenan con lo que se visitaba allí y, al descartar uno, entra el siguiente de allí. Aquí una página solo puede ser
 *    acceso automático si tiene al menos una visita hecha en Aegis:
 *    - posterior a la creación del perfil (times.json › created, ProfileAge): una visita importada conserva su fecha
 *      original, que es anterior;
 *    - y que no venga de una importación. Places no marca las visitas importadas (los migradores las insertan con
 *      PlacesUtils.history.insertMany, transición LINK o TYPED y origen ORGANIC, como una visita normal), así que
 *      Aegis apunta cada importación de historial al hacerse: MigrationUtils.insertVisitsWrapper, por el que pasan
 *      todos los migradores (Chrome, Brave, Edge, Safari y los de Aegis), se envuelve al empezar una importación
 *      («Migration:Started») y guarda en aegis.accesos.importaciones el tramo de identificadores de moz_historyvisits
 *      que creó y el momento en que empezó. Una visita de ese tramo con fecha anterior a ese momento es importada
 *      (cubre lo visitado en el otro navegador después de instalar Aegis e importado más tarde); una visita de
 *      Aegis hecha mientras tanto tiene fecha posterior y cuenta. Solo identificadores y una fecha: ninguna dirección.
 *      Se guardan las MAX_IMPORTACIONES últimas; con una más se olvida la más antigua (sus visitas quedan solo con el
 *      umbral de fecha). Juntar dos tramos haría importadas las visitas de Aegis hechas entre ambos. Al borrar todo el
 *      historial («history-cleared» de Places, también desde Borrar historial) la lista se vacía: ya no hay visitas.
 *    El filtro va dentro de la consulta de Firefox (una condición más en su WHERE, con el mismo LIMIT), así que no hace
 *    falta pedir más candidatos ni otra consulta: el orden, el agrupado por sitio y los bloqueados siguen siendo los de
 *    Firefox. El historial importado no se toca: sigue en la barra de direcciones, en el historial y en la frecencia
 *    de cada página. Los accesos fijados y «Añadir acceso directo» no pasan por aquí. Un perfil sin importaciones no
 *    cambia: todas sus visitas son posteriores a su creación.
 *
 * Sin parche: se envuelven block, unblock e isBlocked del objeto BlockedLinks, getTopFrecentSites del proveedor de
 * Activity Stream (que lee _commonPlacesWhere y _getCommonParams de su `this`) e insertVisitsWrapper de MigrationUtils,
 * este a partir de la primera importación de la sesión y hasta cerrar Aegis (antes no se carga MigrationUtils; fuera
 * de una importación nadie lo llama). tools/verificar.py comprueba que siguen así en la versión fijada. Sin red y sin
 * temporizadores: un observador de «Migration:Started», otro de «history-cleared» y el trabajo de cada cálculo de los
 * accesos.
 */

import { NewTabUtils } from "resource://gre/modules/NewTabUtils.sys.mjs";

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  AboutNewTab: "resource:///modules/AboutNewTab.sys.mjs",
  PlacesUtils: "resource://gre/modules/PlacesUtils.sys.mjs",
  ProfileAge: "resource://gre/modules/ProfileAge.sys.mjs",
});

/** Lo que se resume con el hash: así la marca de un sitio no puede coincidir con la de una dirección. */
const PREFIJO = "aegis-sitio:";
/** Sitio → su clave en el almacén de bloqueados (el hash se calcula una vez por sitio). */
const claves = new Map();
const MAX_CLAVES = 2000;

/** Importaciones de historial apuntadas: [[primer id, último id, momento en µs], …] (JSON). */
const PREF_IMPORTACIONES = "aegis.accesos.importaciones";
/** Como mucho tantas; con una más, se olvida la más antigua (no se juntan: ver la cabecera). */
const MAX_IMPORTACIONES = 20;

// ── 1. «Descartar» quita el sitio entero ──────────────────────────────────────────────────────────────────────────

/** El sitio de una dirección, como lo agrupa Firefox (getTopFrecentSites: «://», sin «www.», hasta la «/»). */
function sitio(url) {
  return typeof url == "string" ? (url.match(/:\/\/(?:www\.)?([^\/]+)/)?.[1] ?? null) : null;
}

/** Hash MD5 en base64, como toHash() de NewTabUtils. */
function hash(texto) {
  const datos = new TextEncoder().encode(texto);
  const h = Cc["@mozilla.org/security/hash;1"].createInstance(Ci.nsICryptoHash);
  h.init(Ci.nsICryptoHash.MD5);
  h.update(datos, datos.length);
  return h.finish(true);
}

/** Clave del sitio de una dirección en el almacén de bloqueados, o null si no tiene sitio. */
function clave(url) {
  const s = sitio(url);
  if (!s) {
    return null;
  }
  let k = claves.get(s);
  if (!k) {
    if (claves.size >= MAX_CLAVES) {
      claves.clear();
    }
    k = hash(PREFIJO + s);
    claves.set(s, k);
  }
  return k;
}

/** ¿La dirección es la de un acceso directo de la nueva pestaña? (la que manda «Descartar»: link-menu-options) */
function esAcceso(url) {
  try {
    const filas = lazy.AboutNewTab.activityStream?.store?.getState?.()?.TopSites?.rows;
    return !!filas?.some(f => f && (f.url == url || f.original_url == url || f.open_url == url));
  } catch {
    return false;
  }
}

function descartarSitios() {
  const bloqueados = NewTabUtils.blockedLinks;
  const { block, unblock, isBlocked, save } = bloqueados ?? {};
  if (![block, unblock, isBlocked, save].every(f => typeof f == "function") || !("links" in bloqueados)) {
    console.error("Aegis: NewTabUtils.blockedLinks ha cambiado; «Descartar» quita solo la página, no el sitio");
    return;
  }
  if (isBlocked.aegis) {
    return;
  }
  const marcado = link => {
    const k = clave(link?.url);
    return !!k && Object.hasOwn(bloqueados.links, k);
  };
  const conSitio = function (link) {
    return isBlocked.call(bloqueados, link) || marcado(link);
  };
  conSitio.aegis = true;
  bloqueados.isBlocked = conSitio;
  // Firefox avisa (la nueva pestaña se recalcula) y guarda el almacén justo después: la marca va antes y se guarda
  // con él.
  bloqueados.block = function (link) {
    const k = esAcceso(link?.url) ? clave(link.url) : null;
    if (k) {
      bloqueados.links[k] = 1;
    }
    return block.call(bloqueados, link);
  };
  // Añadir a mano un sitio descartado lo vuelve a mostrar entero.
  bloqueados.unblock = function (link) {
    const k = clave(link?.url);
    if (k && Object.hasOwn(bloqueados.links, k)) {
      delete bloqueados.links[k];
      save.call(bloqueados);
    }
    return unblock.call(bloqueados, link);
  };
}

// ── 2. Solo sitios visitados en Aegis ─────────────────────────────────────────────────────────────────────────────

/** Creación del perfil en µs (como visit_date), o 0 si no se sabe. Se lee una vez (times.json). */
let creado = null;
function creadoEn() {
  creado ??= lazy
    .ProfileAge()
    .then(edad => edad.created)
    .then(
      ms => (Number.isFinite(ms) && ms > 0 ? Math.floor(ms * 1000) : 0),
      e => {
        console.error("Aegis: accesos, no se sabe cuándo se creó el perfil", e);
        return 0;
      }
    );
  return creado;
}

/** Las importaciones apuntadas, validadas. */
function importaciones() {
  let lista;
  try {
    lista = JSON.parse(Services.prefs.getStringPref(PREF_IMPORTACIONES, "[]"));
  } catch {
    return [];
  }
  return Array.isArray(lista)
    ? lista.filter(
        t => Array.isArray(t) && t.length == 3 && t.every(n => Number.isSafeInteger(n) && n >= 0) && t[0] <= t[1]
      )
    : [];
}

/** Importaciones en curso (aún sin el último id): [primer id, momento]. */
const enCurso = new Set();

/**
 * La condición que se añade al WHERE de getTopFrecentSites (sobre `moz_places h`) y sus parámetros: la página tiene
 * una visita posterior a la creación del perfil que no es de ninguna importación.
 *
 * @param {number} desde creación del perfil en µs
 */
function condicion(desde) {
  const parametros = { aegis_desde: desde };
  let fuera = "";
  const tramos = [...importaciones(), ...[...enCurso].map(([a, m]) => [a, Number.MAX_SAFE_INTEGER, m])];
  tramos.forEach(([a, b, m], i) => {
    parametros[`aegis_a${i}`] = a;
    parametros[`aegis_b${i}`] = b;
    parametros[`aegis_m${i}`] = m;
    fuera += ` AND NOT (v.id BETWEEN :aegis_a${i} AND :aegis_b${i} AND v.visit_date <= :aegis_m${i})`;
  });
  // last_visit_date primero: una página sin visitas desde la creación del perfil se descarta sin mirar sus visitas.
  // EXISTS usa el índice (place_id, visit_date) de moz_historyvisits.
  const sql = `
    AND h.last_visit_date > :aegis_desde
    AND EXISTS (SELECT 1 FROM moz_historyvisits v
                WHERE v.place_id = h.id AND v.visit_date > :aegis_desde${fuera})`;
  return { sql, parametros };
}

let avisado = false;
function avisar(texto, e) {
  if (!avisado) {
    avisado = true;
    console.error(`Aegis: accesos, ${texto}; los accesos automáticos incluyen el historial importado`, e ?? "");
  }
}

function soloDeAegis() {
  const proveedor = NewTabUtils.activityStreamProvider;
  const original = proveedor?.getTopFrecentSites;
  if (
    typeof original != "function" ||
    typeof proveedor._getCommonParams != "function" ||
    typeof proveedor._commonPlacesWhere != "string"
  ) {
    avisar("ActivityStreamProvider ha cambiado");
    return;
  }
  if (original.aegis) {
    return;
  }
  const envuelta = async function (aOptions) {
    const base = this ?? proveedor;
    let filtro;
    try {
      filtro = condicion(await creadoEn());
    } catch (e) {
      avisar("no se pudo preparar el filtro", e);
      return original.call(base, aOptions);
    }
    // La consulta de Firefox lee las dos cosas de su `this`: un objeto que hereda de él con la condición añadida.
    let leida = false;
    const conFiltro = Object.create(base, {
      _commonPlacesWhere: {
        get() {
          leida = true;
          return base._commonPlacesWhere + filtro.sql;
        },
      },
      _getCommonParams: {
        value(opciones, extra = {}) {
          return base._getCommonParams.call(this, opciones, { ...extra, ...filtro.parametros });
        },
      },
    });
    let enlaces;
    try {
      enlaces = await original.call(conFiltro, aOptions);
    } catch (e) {
      // Por ejemplo, si Firefox dejara de usar _commonPlacesWhere y sobraran los parámetros: que salgan los de Firefox.
      avisar("la consulta con el filtro ha fallado", e);
      return original.call(base, aOptions);
    }
    if (!leida) {
      avisar("getTopFrecentSites ya no usa _commonPlacesWhere");
    }
    return enlaces;
  };
  envuelta.aegis = true;
  proveedor.getTopFrecentSites = envuelta;
}

/** El último id de moz_historyvisits (solo lectura). */
async function ultimaVisita() {
  const db = await lazy.PlacesUtils.promiseDBConnection();
  const [fila] = await db.execute("SELECT IFNULL(MAX(id), 0) AS n FROM moz_historyvisits");
  return fila?.getResultByName("n") ?? 0;
}

/**
 * Apunta una importación terminada. Con más de MAX_IMPORTACIONES se olvidan las más antiguas: juntarlas en un tramo
 * haría importadas las visitas de Aegis hechas entre ellas; olvidarlas solo deja sus visitas con el umbral de fecha.
 */
function apuntar(tramo) {
  const lista = importaciones();
  lista.push(tramo);
  Services.prefs.setStringPref(PREF_IMPORTACIONES, JSON.stringify(lista.slice(-MAX_IMPORTACIONES)));
}

/**
 * Todo el historial borrado: ninguna visita apuntada sigue existiendo. Una importación en curso sigue (lo que inserte
 * después del borrado se apunta al acabar).
 */
function historialBorrado() {
  if (Services.prefs.prefHasUserValue(PREF_IMPORTACIONES)) {
    Services.prefs.clearUserPref(PREF_IMPORTACIONES);
  }
}

/**
 * Envuelve MigrationUtils.insertVisitsWrapper (una vez): antes de insertar, el último id de visita y el momento; al
 * acabar, el tramo de ids que ha creado. Mientras dura, el tramo abierto ya cuenta como importado (la nueva pestaña se
 * recalcula con cada visita que entra).
 */
function apuntarImportaciones() {
  let MigrationUtils;
  try {
    ({ MigrationUtils } = ChromeUtils.importESModule("resource:///modules/MigrationUtils.sys.mjs"));
  } catch (e) {
    avisar("no se pudo cargar MigrationUtils", e);
    return;
  }
  const original = MigrationUtils?.insertVisitsWrapper;
  if (typeof original != "function") {
    avisar("MigrationUtils.insertVisitsWrapper ha cambiado");
    return;
  }
  if (original.aegis) {
    return;
  }
  const envuelta = async function (pageInfos) {
    let tramo = null;
    try {
      tramo = [(await ultimaVisita()) + 1, Date.now() * 1000];
      enCurso.add(tramo);
    } catch (e) {
      avisar("no se pudo apuntar la importación", e);
    }
    try {
      return await original.call(this, pageInfos);
    } finally {
      if (tramo) {
        try {
          const ultimo = await ultimaVisita();
          if (ultimo >= tramo[0]) {
            apuntar([tramo[0], ultimo, tramo[1]]);
          }
        } catch (e) {
          avisar("no se pudo apuntar la importación", e);
        } finally {
          enCurso.delete(tramo);
        }
      }
    }
  };
  envuelta.aegis = true;
  MigrationUtils.insertVisitsWrapper = envuelta;
}

let iniciado = false;

export const AegisAccesos = {
  inicio() {
    if (iniciado) {
      return;
    }
    iniciado = true;
    descartarSitios();
    soloDeAegis();
    // Al empezar una importación MigrationUtils ya está cargado (lo usa MigratorBase.migrate antes de avisar).
    Services.obs.addObserver(apuntarImportaciones, "Migration:Started");
    // Borrar todo el historial (PlacesUtils.history.clear(): Borrar historial › Todo, «Olvidar»…): fuera los tramos.
    PlacesObservers.addListener(["history-cleared"], historialBorrado);
  },
};
