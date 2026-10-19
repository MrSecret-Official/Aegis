/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · Importar: la lógica pura de los migradores de migradores.sys.mjs (perfiles de profiles.ini, marcadores,
 * historial y formularios). Sin Services, ChromeUtils ni XPCOM: recibe objetos y devuelve objetos, así que se prueba
 * con node y datos falsos (out/pruebas/2026-10-17-importar/).
 *
 * Todo lo que sale de aquí **se fusiona** con lo que ya hay en el perfil de Aegis, nunca lo sustituye:
 * - marcadores: cada raíz (menú, barra, otros, móvil) con la suya; una carpeta con el mismo nombre en el mismo sitio
 *   se reutiliza y, dentro de cada carpeta, un marcador con la misma dirección no se repite (importar dos veces no
 *   duplica nada);
 * - historial: visitas nuevas (Places junta las de la misma página);
 * - formularios: solo los pares campo-valor que no estén ya.
 */

/** Tipos de moz_bookmarks (los mismos números que PlacesUtils.bookmarks.TYPE_*). */
export const TIPO = Object.freeze({ MARCADOR: 1, CARPETA: 2, SEPARADOR: 3 });

/** Raíces de Places que se importan, por su guid fijo (las etiquetas no: son otra cosa). */
export const RAICES = Object.freeze(["menu________", "toolbar_____", "unfiled_____", "mobile______"]);

/** Places no guarda direcciones más largas (PlacesUtils, MAX_URL_LENGTH en History). */
const URL_MAX = 65536;

/** Esquemas que el historial de Places admite (los demás los descarta o hacen fallar insertMany entero). */
const ESQUEMAS_HISTORIAL = new Set(["http:", "https:", "ftp:", "file:"]);

/** Transiciones de moz_historyvisits que se importan (las de PlacesUtils.history.TRANSITIONS menos EMBED, 4). */
const TRANSICIONES = new Set([1, 2, 3, 5, 6, 7, 8, 9]);
const TRANSICION_ENLACE = 1;

/* ───────── Consultas (places.sqlite y formhistory.sqlite de Firefox y de Aegis) ───────── */

/**
 * Las consultas SQL, aquí para que la prueba las ejecute tal cual sobre una base falsa. Los números se escriben en la
 * consulta (getRowsFromDBWithoutLocks no admite parámetros): siempre enteros que calcula el módulo, nunca texto de
 * fuera. Los nombres de columna salen como los campos que esperan las funciones de abajo.
 */
export const CONSULTAS = Object.freeze({
  /** Cuántos marcadores (sin las etiquetas, que son marcadores dentro de las carpetas de la raíz de etiquetas). */
  marcadores:
    "SELECT COUNT(*) AS n FROM moz_bookmarks WHERE type = 1 AND parent NOT IN " +
    "(SELECT id FROM moz_bookmarks WHERE parent = (SELECT id FROM moz_bookmarks WHERE guid = 'tags________'))",
  /** Todo moz_bookmarks con la dirección de cada marcador; el árbol lo arma arbolDeMarcadores(). */
  arbol:
    "SELECT b.id AS id, b.type AS tipo, b.parent AS padre, b.position AS posicion, b.title AS titulo, " +
    "b.guid AS guid, b.dateAdded AS fechaAlta, p.url AS url FROM moz_bookmarks b LEFT JOIN moz_places p ON p.id = b.fk",
  formularios: "SELECT COUNT(*) AS n FROM moz_formhistory",
  paresDeFormularios:
    "SELECT fieldname AS campo, value AS valor, timesUsed AS usos, firstUsed AS primero, lastUsed AS ultimo " +
    "FROM moz_formhistory",
});

function entero(n) {
  const v = Math.floor(Number(n));
  if (!Number.isSafeInteger(v) || v < 0) {
    throw new TypeError(`Aegis: número no válido para una consulta: ${n}`);
  }
  return v;
}

/**
 * Cuántas páginas visibles se visitaron desde «desde» (microsegundos).
 *
 * @param {number} desde
 */
export function consultaPaginas(desde) {
  return `SELECT COUNT(*) AS n FROM moz_places WHERE hidden = 0 AND last_visit_date > ${entero(desde)}`;
}

/**
 * Las visitas de las «limite» páginas visibles visitadas más recientemente desde «desde» (microsegundos), sin las
 * incrustadas (tipo 4), de la más reciente a la más antigua.
 *
 * @param {number} desde
 * @param {number} limite
 */
export function consultaHistorial(desde, limite) {
  const d = entero(desde);
  return (
    "SELECT p.url AS url, p.title AS titulo, v.visit_date AS fecha, v.visit_type AS tipo FROM moz_historyvisits v " +
    "JOIN (SELECT id, url, title FROM moz_places WHERE hidden = 0 AND last_visit_date > " +
    `${d} ORDER BY last_visit_date DESC LIMIT ${entero(limite)}) p ON p.id = v.place_id ` +
    `WHERE v.visit_date > ${d} AND v.visit_type <> 4 ORDER BY v.visit_date DESC`
  );
}

/* ───────── profiles.ini ───────── */

/**
 * Los perfiles de un profiles.ini, en el orden del archivo. «ini» es lo mínimo de nsIINIParser: la lista de secciones
 * y el valor de una clave (null si no está). Solo las secciones [ProfileN] con Path; las [Install…] y [General], no.
 *
 * @param {{secciones(): string[], valor(seccion: string, clave: string): string|null}} ini
 * @returns {{nombre: string, ruta: string, relativa: boolean, predeterminado: boolean}[]}
 */
export function perfilesDeIni(ini) {
  const perfiles = [];
  for (const seccion of ini.secciones()) {
    if (!/^Profile\d+$/.test(seccion)) {
      continue;
    }
    const ruta = ini.valor(seccion, "Path");
    if (!ruta) {
      continue;
    }
    perfiles.push({
      nombre: ini.valor(seccion, "Name") || ruta,
      ruta,
      relativa: ini.valor(seccion, "IsRelative") == "1",
      predeterminado: ini.valor(seccion, "Default") == "1",
    });
  }
  return perfiles;
}

/**
 * Una ruta lista para comparar: barras normalizadas, sin la barra final y, en Windows, sin mayúsculas (su sistema de
 * archivos no las distingue).
 *
 * @param {string} ruta
 * @param {boolean} windows
 */
export function normalizarRuta(ruta, windows) {
  let r = String(ruta).replace(/[\\/]+/g, "/");
  if (r.length > 1 && r.endsWith("/")) {
    r = r.slice(0, -1);
  }
  return windows ? r.toLowerCase() : r;
}

/**
 * Quita el perfil en uso (nunca se importa de uno mismo) y los repetidos (el mismo perfil puede salir en dos
 * profiles.ini, o dos veces en uno). Conserva el orden.
 *
 * @template {{ruta: string}} P
 * @param {P[]} perfiles con la ruta absoluta ya resuelta
 * @param {string} activo ruta del perfil en uso (ProfD)
 * @param {boolean} windows
 * @returns {P[]}
 */
export function sinElActivo(perfiles, activo, windows) {
  const vistos = new Set([normalizarRuta(activo, windows)]);
  return perfiles.filter(p => {
    const clave = normalizarRuta(p.ruta, windows);
    if (vistos.has(clave)) {
      return false;
    }
    vistos.add(clave);
    return true;
  });
}

/* ───────── Marcadores ───────── */

/**
 * Fecha de Places (microsegundos) a Date, nunca en el futuro; sin fecha válida, null (Places pone la de ahora).
 *
 * @param {number|null} us
 * @param {number} ahora en milisegundos
 */
function fecha(us, ahora) {
  const ms = Math.floor(Number(us) / 1000);
  if (!Number.isFinite(ms) || ms <= 0) {
    return null;
  }
  return new Date(Math.min(ms, ahora));
}

function urlValida(url) {
  return typeof url == "string" && url.length > 0 && url.length < URL_MAX && URL.canParse(url);
}

/** La dirección como la escribe Places (URL.href), para comparar la de origen con la de Aegis. */
function normal(url) {
  return URL.parse(url)?.href ?? url;
}

/**
 * El árbol de marcadores de un places.sqlite a partir de sus filas (moz_bookmarks con la url de moz_places).
 *
 * @param {{id: number, tipo: number, padre: number, posicion: number, titulo: string|null, guid: string,
 *          fechaAlta: number|null, url: string|null}[]} filas
 * @returns {Map<string, object[]>} por guid de raíz (RAICES), sus hijos: {tipo, titulo, url?, fechaAlta?, hijos?}
 */
export function arbolDeMarcadores(filas) {
  const hijosDe = new Map();
  for (const f of filas) {
    if (!hijosDe.has(f.padre)) {
      hijosDe.set(f.padre, []);
    }
    hijosDe.get(f.padre).push(f);
  }
  for (const lista of hijosDe.values()) {
    lista.sort((a, b) => a.posicion - b.posicion);
  }
  // Una carpeta que se contuviera a sí misma (un places.sqlite dañado) no puede colgar el import.
  const enCamino = new Set();
  const convertir = fila => {
    if (fila.tipo == TIPO.CARPETA) {
      if (enCamino.has(fila.id)) {
        return null;
      }
      enCamino.add(fila.id);
      const hijos = (hijosDe.get(fila.id) ?? []).map(convertir).filter(Boolean);
      enCamino.delete(fila.id);
      return { tipo: TIPO.CARPETA, titulo: fila.titulo ?? "", fechaAlta: fila.fechaAlta, hijos };
    }
    if (fila.tipo == TIPO.SEPARADOR) {
      return { tipo: TIPO.SEPARADOR };
    }
    if (fila.tipo == TIPO.MARCADOR && urlValida(fila.url)) {
      return { tipo: TIPO.MARCADOR, titulo: fila.titulo ?? "", url: normal(fila.url), fechaAlta: fila.fechaAlta };
    }
    return null;
  };
  const raices = new Map();
  for (const guid of RAICES) {
    const raiz = filas.find(f => f.guid == guid);
    raices.set(guid, raiz ? (hijosDe.get(raiz.id) ?? []).map(convertir).filter(Boolean) : []);
  }
  return raices;
}

/**
 * Un nodo nuevo para PlacesUtils.bookmarks.insertTree. Dentro de una carpeta nueva, una dirección repetida entre
 * hermanos se pone una sola vez. Una carpeta que tenía algo pero se queda sin nada que no sea un separador, no se crea.
 *
 * @returns {object|null}
 */
function nodoNuevo(nodo, ahora) {
  const fechaAlta = fecha(nodo.fechaAlta, ahora);
  const conFecha = obj => (fechaAlta ? Object.assign(obj, { dateAdded: fechaAlta }) : obj);
  if (nodo.tipo == TIPO.MARCADOR) {
    return conFecha({ title: nodo.titulo, url: nodo.url });
  }
  if (nodo.tipo == TIPO.SEPARADOR) {
    return { type: TIPO.SEPARADOR };
  }
  const vistas = new Set();
  const hijos = [];
  for (const h of nodo.hijos) {
    if (h.tipo == TIPO.MARCADOR) {
      if (vistas.has(h.url)) {
        continue;
      }
      vistas.add(h.url);
    }
    const n = nodoNuevo(h, ahora);
    if (n) {
      hijos.push(n);
    }
  }
  if (nodo.hijos.length && !hijos.some(h => h.type != TIPO.SEPARADOR)) {
    return null;
  }
  // insertTree toma por marcador lo que no dice su tipo: la carpeta lo lleva siempre.
  return conFecha({ type: TIPO.CARPETA, title: nodo.titulo, children: hijos });
}

/**
 * Qué insertar para fusionar los hijos de una carpeta del perfil de origen con la carpeta equivalente de Aegis.
 *
 * @param {object[]} origen hijos de arbolDeMarcadores()
 * @param {{guid: string, hijos: {guid: string, carpeta: boolean, titulo: string, url?: string}[]}} destino la carpeta
 *   de Aegis, con sus hijos directos (y los de sus subcarpetas, en «hijos», si se quieren fusionar más abajo)
 * @param {number} [ahora=Date.now()]
 * @returns {{padre: string, hijos: object[]}[]} una entrada por carpeta de Aegis que recibe algo, para
 *   MigrationUtils.insertManyBookmarksWrapper(hijos, padre)
 */
export function planDeFusion(origen, destino, ahora = Date.now()) {
  const plan = [];
  const fusionar = (nodos, carpeta) => {
    const urls = new Set(carpeta.hijos.filter(h => !h.carpeta && h.url).map(h => normal(h.url)));
    const nuevos = [];
    for (const nodo of nodos) {
      if (nodo.tipo == TIPO.CARPETA) {
        const existente = carpeta.hijos.find(h => h.carpeta && h.titulo == nodo.titulo);
        if (existente) {
          fusionar(nodo.hijos, { guid: existente.guid, hijos: existente.hijos ?? [] });
          continue;
        }
        const n = nodoNuevo(nodo, ahora);
        if (n) {
          nuevos.push(n);
        }
      } else if (nodo.tipo == TIPO.MARCADOR) {
        if (!urls.has(nodo.url)) {
          urls.add(nodo.url);
          nuevos.push(nodoNuevo(nodo, ahora));
        }
      }
      // Los separadores sueltos en una carpeta que ya existe no se copian: cada importación añadiría otro.
    }
    if (nuevos.length) {
      plan.push({ padre: carpeta.guid, hijos: nuevos });
    }
  };
  fusionar(origen, destino);
  return plan;
}

/* ───────── Historial ───────── */

/**
 * Las páginas para MigrationUtils.insertVisitsWrapper (PlacesUtils.history.insertMany) a partir de las visitas de un
 * places.sqlite, de la más reciente a la más antigua. Como mucho «maxVisitas» por página.
 *
 * @param {{url: string, titulo: string|null, fecha: number, tipo: number}[]} filas fecha en microsegundos
 * @param {number} maxVisitas
 * @param {number} [ahora=Date.now()]
 * @returns {{url: string, title?: string, visits: {date: Date, transition: number}[]}[]}
 */
export function paginasDeHistorial(filas, maxVisitas, ahora = Date.now()) {
  const paginas = new Map();
  for (const f of filas) {
    if (!urlValida(f.url) || !ESQUEMAS_HISTORIAL.has(new URL(f.url).protocol)) {
      continue;
    }
    const date = fecha(f.fecha, ahora);
    if (!date) {
      continue;
    }
    let pagina = paginas.get(f.url);
    if (!pagina) {
      pagina = { url: f.url, visits: [] };
      if (typeof f.titulo == "string" && f.titulo) {
        pagina.title = f.titulo;
      }
      paginas.set(f.url, pagina);
    }
    if (pagina.visits.length < maxVisitas) {
      pagina.visits.push({ date, transition: TRANSICIONES.has(f.tipo) ? f.tipo : TRANSICION_ENLACE });
    }
  }
  return [...paginas.values()];
}

/* ───────── Formularios ───────── */

/** Clave de un par campo-valor del historial de formularios. */
export function clavePar(campo, valor) {
  return `${campo}\u0000${valor}`;
}

/**
 * Las operaciones «add» de FormHistory.update para los pares que Aegis aún no tiene (FormHistory no comprueba si ya
 * existe y un par repetido rompe sus búsquedas después). Fechas en microsegundos, como las guarda.
 *
 * @param {{campo: string, valor: string, usos: number, primero: number, ultimo: number}[]} filas
 * @param {Set<string>} existentes claves de clavePar() de lo que ya hay
 */
export function operacionesDeFormularios(filas, existentes) {
  const ops = [];
  const vistas = new Set(existentes);
  for (const f of filas) {
    if (typeof f.campo != "string" || typeof f.valor != "string" || !f.campo || !f.valor) {
      continue;
    }
    const clave = clavePar(f.campo, f.valor);
    if (vistas.has(clave)) {
      continue;
    }
    vistas.add(clave);
    const op = { op: "add", fieldname: f.campo, value: f.valor };
    if (f.usos > 0) {
      op.timesUsed = f.usos;
    }
    if (f.primero > 0) {
      op.firstUsed = f.primero;
    }
    if (f.ultimo > 0) {
      op.lastUsed = f.ultimo;
    }
    ops.push(op);
  }
  return ops;
}
