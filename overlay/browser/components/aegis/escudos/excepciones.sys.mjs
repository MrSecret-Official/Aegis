/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · Escudos: excepciones por sitio.
 *
 * Para cada sitio (el dominio base de la página, como «aegis-huella»), qué grupos de Escudos no se bloquean:
 *   anuncios, rastreadores        bloqueo de red del motor propio (escudos/red.sys.mjs)
 *   cookies-avisos, molestias,    las tres molestias (avisos de cookies; ventanas y banners; avisos anti-bloqueador);
 *   antiadblock                   cada una tiene además su interruptor general (aegis.escudos.molestias.*)
 *   cosmetico, scriptlets         ocultar elementos y los scriptlets de las listas
 *
 * - Se guardan como permisos nativos de Gecko (Services.perms), uno por grupo, de tipo «aegis-escudos-<grupo>», con el
 *   principal https://<dominio base>. Así «Olvidar este sitio», el borrado de datos del sitio y el del historial los
 *   quitan solos (ClearDataService › PermissionsCleaner borra todos los tipos).
 * - En ventanas privadas: con el principal privado y de sesión (EXPIRE_SESSION); el gestor de permisos los aísla
 *   (permissions.isolateBy.privateBrowsing) y los borra al cerrar la última ventana privada. Como la excepción de
 *   Firefox («Escudos bajados»), los de las ventanas normales no cuentan en las privadas ni al revés.
 * - Un grupo apagado en general cuenta como permitido en todos los sitios (herencia: Ajustes lo enseña como
 *   «Permitido por ajuste general»).
 * - «Permitir todo en este sitio» es la excepción de Firefox que ya usa el panel (ContentBlockingAllowList, permisos
 *   «trackingprotection» y «trackingprotection-pb»): con ella, permitido() es true para todos los grupos.
 *
 * Ligero: una caché en memoria (dominio → grupos) que se rehace solo cuando cambia un permiso de estos tipos
 * (perm-changed). permitido() es una búsqueda en un Map; nada de temporizadores.
 */

export const GRUPOS = ["anuncios", "rastreadores", "cookies-avisos", "molestias", "antiadblock", "cosmetico", "scriptlets"];
const PREFIJO = "aegis-escudos-";
const tipoDe = grupo => PREFIJO + grupo;
const TIPOS = GRUPOS.map(tipoDe);
/** Los permisos de la excepción de Firefox («Escudos bajados»): normal y privada. */
const TODO = "trackingprotection";
const TODO_PRIVADA = "trackingprotection-pb";

/** Grupos con interruptor general: grupo → pref (settings/prefs/58-escudos.js). */
export const PREF_GENERAL = {
  "cookies-avisos": "aegis.escudos.molestias.cookies",
  molestias: "aegis.escudos.molestias.ventanas",
  antiadblock: "aegis.escudos.molestias.antiadblock",
};

/** Se notifica (sin sujeto) cuando cambian las excepciones o los interruptores generales: Ajustes y el panel repintan. */
const TEMA = "aegis-escudos-excepciones";

/** dominio + "|p" si es de una ventana privada → Set de grupos permitidos. null = hay que rehacerla. */
let cache = null;
/** Nombres exactos con «Escudos bajados» (el de cada permiso de Firefox), con la misma clave. */
let todos = null;
let observando = false;

const clave = (dominio, privada) => (privada ? `${dominio}|p` : dominio);

function dominioDeUri(uri) {
  if (!uri || !(uri.schemeIs("http") || uri.schemeIs("https"))) {
    return null;
  }
  let host = "";
  try {
    host = uri.asciiHost.toLowerCase();
  } catch {}
  if (!host) {
    return null;
  }
  try {
    return Services.eTLD.getBaseDomain(uri).toLowerCase();
  } catch {
    // Una IP, «localhost» o un nombre sin dominio: el propio nombre.
    return host;
  }
}

/**
 * El sitio (dominio base) de un principal, una URI, una dirección o un nombre («www.ejemplo.com»,
 * «https://ejemplo.com/x»). null si no es una web http(s).
 *
 * @param {nsIPrincipal|nsIURI|string} x
 * @returns {string?}
 */
export function dominioDe(x) {
  if (!x) {
    return null;
  }
  try {
    if (typeof x == "string") {
      let t = x.trim().toLowerCase();
      if (!t || /\s/.test(t)) {
        return null;
      }
      if (!/^[a-z][a-z0-9+.-]*:\/\//.test(t)) {
        t = "https://" + t;
      }
      return dominioDeUri(Services.io.newURI(t));
    }
    if (x instanceof Ci.nsIPrincipal) {
      return x.isContentPrincipal ? dominioDeUri(x.URI) : null;
    }
    if (x instanceof Ci.nsIURI) {
      return dominioDeUri(x);
    }
  } catch {}
  return null;
}

/** Principal con el que se guarda la excepción de un sitio. */
function principalDe(dominio, privada) {
  const uri = Services.io.newURI(`https://${dominio}`);
  return Services.scriptSecurityManager.createContentPrincipal(uri, privada ? { privateBrowsingId: 1 } : {});
}

function dominioDePermiso(p) {
  try {
    return dominioDeUri(p.principal.URI);
  } catch {
    return null;
  }
}

function rehacer() {
  cache = new Map();
  todos = new Set();
  for (const p of Services.perms.getAllByTypes(TIPOS)) {
    if (p.capability != Services.perms.ALLOW_ACTION) {
      continue;
    }
    const d = dominioDePermiso(p);
    if (!d) {
      continue;
    }
    const k = clave(d, p.principal.privateBrowsingId > 0);
    if (!cache.has(k)) {
      cache.set(k, new Set());
    }
    cache.get(k).add(p.type.slice(PREFIJO.length));
  }
  for (const p of Services.perms.getAllByTypes([TODO, TODO_PRIVADA])) {
    if (p.capability == Services.perms.ALLOW_ACTION) {
      let host = "";
      try {
        host = p.principal.asciiHost.toLowerCase();
      } catch {}
      if (host) {
        todos.add(clave(host, p.type == TODO_PRIVADA));
      }
    }
  }
}

const observador = {
  observe(sujeto, tema, dato) {
    if (tema == "perm-changed") {
      const p = sujeto instanceof Ci.nsIPermission ? sujeto : null;
      if (dato == "cleared" || (p && (p.type.startsWith(PREFIJO) || p.type == TODO || p.type == TODO_PRIVADA))) {
        cache = null;
        todos = null;
        Services.obs.notifyObservers(null, TEMA);
      }
    } else if (tema == "nsPref:changed") {
      Services.obs.notifyObservers(null, TEMA);
    } else if (tema == "quit-application-granted") {
      Services.obs.removeObserver(observador, "perm-changed");
      Services.obs.removeObserver(observador, "quit-application-granted");
      for (const pref of Object.values(PREF_GENERAL)) {
        Services.prefs.removeObserver(pref, observador);
      }
    }
  },
};

function vigilar() {
  if (observando) {
    return;
  }
  observando = true;
  Services.obs.addObserver(observador, "perm-changed");
  Services.obs.addObserver(observador, "quit-application-granted");
  for (const pref of Object.values(PREF_GENERAL)) {
    Services.prefs.addObserver(pref, observador);
  }
}

function mapa() {
  vigilar();
  if (!cache) {
    rehacer();
  }
  return cache;
}

/** ¿Está apagado en general el grupo (solo las molestias tienen interruptor general)? */
function apagadoEnGeneral(grupo) {
  const pref = PREF_GENERAL[grupo];
  return !!pref && !Services.prefs.getBoolPref(pref, true);
}

function privadaDe(x, opciones) {
  if (opciones?.privada !== undefined) {
    return !!opciones.privada;
  }
  return x instanceof Ci.nsIPrincipal && x.privateBrowsingId > 0;
}

/** El nombre exacto (host) de un principal o una URI; null si llega el nombre de un sitio (texto). */
function hostDe(x) {
  try {
    if (x instanceof Ci.nsIPrincipal || x instanceof Ci.nsIURI) {
      return x.asciiHost.toLowerCase() || null;
    }
  } catch {}
  return null;
}

/**
 * «Escudos bajados» (la excepción de Firefox). Con un nombre exacto (`host`), como el clasificador de Firefox
 * (ContentBlockingAllowList::Check, con TestPermissionFromPrincipal): un permiso de ese nombre o de uno superior hasta
 * el dominio base. Sin él (Ajustes, que trabaja por sitio), cualquiera de los nombres del sitio.
 */
function bajados(dominio, privada, host = null) {
  mapa();
  if (!host) {
    for (const k of todos) {
      const [h, p] = k.split("|");
      if (!!p == privada && (h == dominio || h.endsWith("." + dominio))) {
        return true;
      }
    }
    return false;
  }
  for (let h = host; h; ) {
    if (todos.has(clave(h, privada))) {
      return true;
    }
    if (h == dominio) {
      break;
    }
    const i = h.indexOf(".");
    h = i < 0 ? "" : h.slice(i + 1);
  }
  return false;
}

export const AegisEscudosExcepciones = {
  GRUPOS,
  PREF_GENERAL,
  TEMA,
  dominioDe,

  /**
   * ¿En este sitio no se bloquea este grupo? true si el grupo está apagado en general, si el sitio tiene una
   * excepción de ese grupo o si tiene los Escudos bajados.
   *
   * @param {nsIPrincipal|nsIURI|string} sitio el principal de la página principal de la pestaña (o su dirección)
   * @param {string} grupo uno de GRUPOS
   * @param {{privada?: boolean}} [opciones] solo hace falta si `sitio` no es un principal
   * @returns {boolean}
   */
  permitido(sitio, grupo, opciones) {
    if (!GRUPOS.includes(grupo)) {
      return false;
    }
    if (apagadoEnGeneral(grupo)) {
      return true;
    }
    const d = dominioDe(sitio);
    if (!d) {
      return false;
    }
    const privada = privadaDe(sitio, opciones);
    return !!mapa().get(clave(d, privada))?.has(grupo) || bajados(d, privada, hostDe(sitio));
  },

  /**
   * Por qué se bloquea o no un grupo en un sitio (para la herencia visual de Ajustes y el panel):
   * "general" (apagado para todos los sitios), "todo" (Escudos bajados en el sitio), "sitio" (excepción del grupo)
   * o "bloquea".
   *
   * @returns {"general"|"todo"|"sitio"|"bloquea"}
   */
  motivo(sitio, grupo, opciones) {
    if (apagadoEnGeneral(grupo)) {
      return "general";
    }
    const d = dominioDe(sitio);
    if (!d) {
      return "bloquea";
    }
    const privada = privadaDe(sitio, opciones);
    if (bajados(d, privada, hostDe(sitio))) {
      return "todo";
    }
    return mapa().get(clave(d, privada))?.has(grupo) ? "sitio" : "bloquea";
  },

  /** ¿Está el grupo encendido en general? (Los que no tienen interruptor general, siempre.) */
  activoEnGeneral(grupo) {
    return !apagadoEnGeneral(grupo);
  },

  /**
   * Pone o quita la excepción de un grupo en un sitio. Desde una ventana privada, de sesión (con el principal
   * privado). No toca la de Firefox («Permitir todo»: permitirTodo).
   *
   * @param {nsIPrincipal|nsIURI|string} sitio
   * @param {string} grupo uno de GRUPOS
   * @param {boolean} permitir
   * @param {{privada?: boolean}} [opciones]
   */
  poner(sitio, grupo, permitir, opciones) {
    const d = dominioDe(sitio);
    if (!d || !GRUPOS.includes(grupo)) {
      return;
    }
    const privada = privadaDe(sitio, opciones);
    if (permitir) {
      Services.perms.addFromPrincipal(
        principalDe(d, privada),
        tipoDe(grupo),
        Services.perms.ALLOW_ACTION,
        privada ? Services.perms.EXPIRE_SESSION : Services.perms.EXPIRE_NEVER
      );
      return;
    }
    for (const p of Services.perms.getAllByTypes([tipoDe(grupo)])) {
      if (dominioDePermiso(p) == d && p.principal.privateBrowsingId > 0 == privada) {
        Services.perms.removePermission(p);
      }
    }
  },

  /**
   * «Permitir todo en este sitio»: la excepción de Firefox (Escudos bajados), la misma que el interruptor de la
   * cabecera del panel. Se pone para el dominio base (cubre todos sus nombres, como la aplica Firefox). Al quitarla
   * con el nombre del sitio se quitan todas las del sitio, también las que el panel pone con el nombre exacto (www.…).
   */
  permitirTodo(sitio, si, opciones) {
    const d = dominioDe(sitio);
    if (!d) {
      return;
    }
    const privada = privadaDe(sitio, opciones);
    const tipo = privada ? TODO_PRIVADA : TODO;
    if (si) {
      Services.perms.addFromPrincipal(
        principalDe(d, privada),
        tipo,
        Services.perms.ALLOW_ACTION,
        privada ? Services.perms.EXPIRE_SESSION : Services.perms.EXPIRE_NEVER
      );
      return;
    }
    // Con un principal (el panel), las que cubren ese nombre: el suyo y los superiores. Con el nombre del sitio
    // (Ajustes), todas las del sitio.
    const host = hostDe(sitio);
    for (const p of Services.perms.getAllByTypes([tipo])) {
      if (dominioDePermiso(p) != d) {
        continue;
      }
      let h = "";
      try {
        h = p.principal.asciiHost.toLowerCase();
      } catch {}
      if (!host || host == h || host.endsWith("." + h)) {
        Services.perms.removePermission(p);
      }
    }
  },

  /** ¿Tiene el sitio los Escudos bajados (en este nombre o en uno superior, como los aplica Firefox)? */
  todoPermitido(sitio, opciones) {
    const d = dominioDe(sitio);
    return !!d && bajados(d, privadaDe(sitio, opciones), hostDe(sitio));
  },

  /** Quita todas las excepciones de un sitio (las de grupo y «Permitir todo»). */
  quitar(sitio, opciones) {
    for (const grupo of GRUPOS) {
      this.poner(sitio, grupo, false, opciones);
    }
    this.permitirTodo(sitio, false, opciones);
  },

  /**
   * Los sitios con alguna excepción, ordenados: [{sitio, grupos: [...], todo}]. `todo`: Escudos bajados.
   *
   * @param {{privada?: boolean}} [opciones] las de las ventanas privadas (de sesión) en vez de las normales
   */
  listar(opciones) {
    const privada = !!opciones?.privada;
    const m = mapa();
    const sitios = new Map();
    for (const [k, grupos] of m) {
      const [d, p] = k.split("|");
      if (!!p == privada && grupos.size) {
        sitios.set(d, { sitio: d, grupos: GRUPOS.filter(g => grupos.has(g)), todo: false });
      }
    }
    for (const k of todos) {
      const [h, p] = k.split("|");
      const d = dominioDe(h);
      if (d && !!p == privada) {
        const s = sitios.get(d) ?? { sitio: d, grupos: [], todo: false };
        s.todo = true;
        sitios.set(d, s);
      }
    }
    return [...sitios.values()].sort((a, b) => a.sitio.localeCompare(b.sitio));
  },

  /** ¿Hay alguna excepción de grupo? (Atajo para quien consulta por petición.) */
  hay() {
    return mapa().size > 0;
  },
};
