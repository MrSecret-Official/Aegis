/* Cookies y almacenamiento de un sitio, vistos desde dentro: poner y leer una cookie con JavaScript, otra con la
 * cabecera Set-Cookie del servidor y un valor en localStorage. Lo usan cookies.html (como página o como marco de otro
 * sitio) y olvidar.html. Los nombres llevan el run: cada ejecución usa los suyos. */
"use strict";

const Almacen = (() => {
  const sufijo = Banco.run.replace(/[^A-Za-z0-9]/g, "");
  const nombres = { js: `cj_${sufijo}`, http: `ch_${sufijo}`, ls: `ls_${sufijo}`, idb: `idb_${sufijo}` };

  function cookieJs() {
    return document.cookie.split(";").some(c => c.trim() === `${nombres.js}=v`);
  }

  function leerLs() {
    try {
      return localStorage.getItem(nombres.ls) === "v" ? "si" : "no";
    } catch (e) {
      return `excepcion:${e.name}`;
    }
  }

  function abrirIdb() {
    return new Promise((ok, mal) => {
      let r;
      try {
        r = indexedDB.open(nombres.idb, 1);
      } catch (e) {
        mal(e);
        return;
      }
      r.onupgradeneeded = () => r.result.createObjectStore("d");
      r.onsuccess = () => ok(r.result);
      r.onerror = () => mal(r.error);
    });
  }

  async function ponerIdb() {
    try {
      const db = await abrirIdb();
      await new Promise((ok, mal) => {
        const t = db.transaction("d", "readwrite");
        t.objectStore("d").put("v", "clave");
        t.oncomplete = ok;
        t.onerror = () => mal(t.error);
      });
      db.close();
      return "si";
    } catch (e) {
      return `excepcion:${e?.name}`;
    }
  }

  async function leerIdb() {
    try {
      // Sin crear la base si no existe: databases() dice si está.
      const lista = await indexedDB.databases();
      if (!lista.some(d => d.name === nombres.idb)) {
        return "no";
      }
      const db = await abrirIdb();
      const v = await new Promise(ok => {
        const r = db.transaction("d").objectStore("d").get("clave");
        r.onsuccess = () => ok(r.result);
        r.onerror = () => ok(undefined);
      });
      db.close();
      return v === "v" ? "si" : "no";
    } catch (e) {
      return `excepcion:${e?.name}`;
    }
  }

  async function ponerCache() {
    try {
      const c = await caches.open(`cache_${sufijo}`);
      await c.put("/__/cacheado", new Response("v"));
      return "si";
    } catch (e) {
      return `excepcion:${e?.name}`;
    }
  }

  async function leerCache() {
    try {
      if (!(await caches.has(`cache_${sufijo}`))) {
        return "no";
      }
      const r = await (await caches.open(`cache_${sufijo}`)).match("/__/cacheado");
      return r && (await r.text()) === "v" ? "si" : "no";
    } catch (e) {
      return `excepcion:${e?.name}`;
    }
  }

  /** Pone todo. `completo` también IndexedDB y Cache (para «Olvidar este sitio»). */
  async function poner(completo = false) {
    const resultado = {};
    document.cookie = `${nombres.js}=v; Path=/; SameSite=None; Secure; Max-Age=86400`;
    try {
      await fetch(`/__/cookie?poner=${nombres.http}&valor=v&id=${encodeURIComponent(Banco.id("poner"))}`, {
        credentials: "include",
        cache: "no-store",
      });
    } catch (e) {
      resultado.errorFetch = String(e);
    }
    try {
      localStorage.setItem(nombres.ls, "v");
    } catch (e) {
      resultado.errorLs = e.name;
    }
    if (completo) {
      resultado.idbPuesto = await ponerIdb();
      resultado.cachePuesto = await ponerCache();
    }
    return resultado;
  }

  /** Lee lo que hay. `eco`: las cookies que el servidor recibe ahora (la prueba de verdad). */
  async function leer(completo = false) {
    const r = { js: cookieJs(), ls: leerLs() };
    try {
      const eco = await (
        await fetch(`/__/eco?id=${encodeURIComponent(Banco.id("eco"))}`, { credentials: "include", cache: "no-store" })
      ).json();
      r.httpServidor = eco.recibidas[nombres.http] === "v";
      r.jsServidor = eco.recibidas[nombres.js] === "v";
    } catch (e) {
      r.errorEco = String(e);
    }
    if (completo) {
      r.idb = await leerIdb();
      r.cache = await leerCache();
    }
    return r;
  }

  return { nombres, poner, leer };
})();
