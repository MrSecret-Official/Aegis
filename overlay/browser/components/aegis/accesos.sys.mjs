/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · «Descartar» un acceso directo de la nueva pestaña lo quita de verdad: el sitio entero, no solo esa página.
 *
 * Firefox guarda la dirección descartada (NewTabUtils.blockedLinks, pref browser.newtabpage.blocked, con el hash MD5
 * de la dirección) y, al calcular los accesos, primero quita las bloqueadas y después se queda con la página más
 * visitada de cada sitio (ActivityStreamProvider.getTopFrecentSites, onePerDomain). Si el sitio tiene más páginas en
 * el historial, la siguiente ocupa la loseta con el mismo nombre y el mismo icono, y parece que «Descartar» no ha
 * hecho nada (y cada intento solo bloquea otra página).
 *
 * Aquí, al descartar una dirección que es un acceso directo, se guarda además una marca del sitio (su host sin «www.»,
 * como agrupa Firefox) en el mismo almacén y con el mismo hash: el nombre no queda en claro en prefs.js, y lo que
 * vacía ese almacén lo vacía también. isBlocked() mira además esa marca, así que ninguna página del sitio vuelve a
 * salir. Añadirlo a mano («Añadir acceso directo», que llama a unblock) la quita.
 *
 * Sin parche: se envuelven block, unblock e isBlocked del objeto BlockedLinks (tools/verificar.py comprueba que siguen
 * en la versión fijada). Sin red y sin temporizadores.
 */

import { NewTabUtils } from "resource://gre/modules/NewTabUtils.sys.mjs";

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  AboutNewTab: "resource:///modules/AboutNewTab.sys.mjs",
});

/** Lo que se resume con el hash: así la marca de un sitio no puede coincidir con la de una dirección. */
const PREFIJO = "aegis-sitio:";
/** Sitio → su clave en el almacén (el hash se calcula una vez por sitio). */
const claves = new Map();
const MAX_CLAVES = 2000;

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

export const AegisAccesos = {
  inicio() {
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
  },
};
