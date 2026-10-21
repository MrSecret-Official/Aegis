/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · «Cerrar las sesiones al salir de Aegis» (Ajustes › Privacidad › Sesiones; ajustes.sys.mjs). Opción de mayor
 * seguridad, apagada de serie (decisión del usuario, 2026-10-21: «no queremos molestar al usuario normal»). Qué
 * protege y qué no: docs/PRIVACIDAD.md, «Sesiones».
 *
 * No es un borrado propio: es la limpieza al cerrar de Firefox (Sanitizer.sys.mjs), con solo lo que hace falta para
 * cerrar las sesiones. Al encenderla:
 * - privacy.clearOnShutdown_v2.cookiesAndStorage: cookies y datos de las webs (CLEAR_COOKIES_AND_SITE_DATA: cookies,
 *   almacenamiento de las webs (localStorage, IndexedDB, Cache API), suscripciones push, HSTS, licencias de DRM,
 *   tokens e inicios de sesión HTTP en memoria, permisos de acceso al almacenamiento). Solo de webs http,
 *   https y file (PrincipalsCollector): nada de Aegis ni de las extensiones.
 * - privacy.clearOnShutdown_v2.cache: la caché, como hace la casilla «Eliminar cookies y datos del sitio al cerrar»
 *   de Firefox (así esa casilla y este interruptor dicen lo mismo).
 * - privacy.clearOnShutdown_v2.browsingHistoryAndDownloads, .formdata y .siteSettings en false: Firefox los trae a
 *   true (historial y descargas) y se borrarían también. El historial, las descargas, los formularios, los permisos de
 *   las webs, las contraseñas y los marcadores no se tocan. Si la limpieza al cerrar ya estaba encendida (el usuario
 *   la eligió en «Historial»), esas tres se dejan como estaban.
 * - privacy.sanitize.sanitizeOnShutdown, la última, para que la limpieza pendiente de Firefox ya vea las de arriba.
 * - browser.sessionstore.privacy_level = 2: la sesión guardada (sessionstore) no lleva cookies de sesión ni lo escrito
 *   en los formularios de ninguna web.
 *
 * Las webs con una excepción en «Webs que conservan la sesión» (permiso persist-data-on-shutdown de Firefox 158, su
 * propio diálogo de excepciones) no se borran; una web con «Permitir para la sesión» en las excepciones de cookies se
 * borra siempre. Si Aegis se cierra a la fuerza, Firefox deja la limpieza apuntada (privacy.sanitize.pending) y la
 * hace en el siguiente arranque.
 *
 * Al apagarla, cada pref vuelve al valor que tenía antes (aegis.sesiones.previo), salvo las que se hayan cambiado
 * después desde otro sitio (Ajustes › Historial, about:config): esas se respetan. Sin temporizadores ni observadores
 * propios: solo actúa al pulsar el interruptor.
 */

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  Sanitizer: "resource:///modules/Sanitizer.sys.mjs",
});

const LIMPIAR = "privacy.sanitize.sanitizeOnShutdown";
const COOKIES = "privacy.clearOnShutdown_v2.cookiesAndStorage";
const CACHE = "privacy.clearOnShutdown_v2.cache";
const NIVEL = "browser.sessionstore.privacy_level";
/** Lo demás de la limpieza al cerrar: se apaga si la limpieza no estaba encendida. */
const OTROS = [
  "privacy.clearOnShutdown_v2.browsingHistoryAndDownloads",
  "privacy.clearOnShutdown_v2.formdata",
  "privacy.clearOnShutdown_v2.siteSettings",
];
/** Las que pueden cambiar, en el orden en que se guardan. */
const TODAS = [COOKIES, CACHE, ...OTROS, NIVEL, LIMPIAR];
const PREVIO = "aegis.sesiones.previo";

/** Sesión guardada sin cookies de sesión ni formularios, en ninguna web (SessionStore: PrivacyLevel). */
const NIVEL_SIN_DATOS = 2;

function leer(pref) {
  if (Services.prefs.getPrefType(pref) == Services.prefs.PREF_INT) {
    return Services.prefs.getIntPref(pref);
  }
  return Services.prefs.getBoolPref(pref, false);
}

function poner(pref, valor) {
  if (typeof valor == "number") {
    Services.prefs.setIntPref(pref, valor);
  } else {
    Services.prefs.setBoolPref(pref, valor);
  }
}

export const AegisSesiones = {
  /** Prefs que cambian el estado: ajustes.sys.mjs las observa para pintar el interruptor. */
  PREFS: [LIMPIAR, COOKIES],

  /** ¿Se cierran las sesiones al cerrar? (también si se encendió con la casilla de cookies de Firefox). */
  activo() {
    return Services.prefs.getBoolPref(LIMPIAR, false) && Services.prefs.getBoolPref(COOKIES, false);
  },

  /** Diálogo de Firefox de las webs que conservan sus datos al cerrar (persist-data-on-shutdown, solo «Permitir»). */
  abrirExcepciones(win) {
    win.gSubDialog?.open(
      "chrome://browser/content/preferences/dialogs/permissions.xhtml",
      {},
      {
        blockVisible: false,
        sessionVisible: false,
        allowVisible: true,
        prefilledHost: "",
        permissionType: "persist-data-on-shutdown",
      }
    );
  },

  /** @param {boolean} encender */
  poner(encender) {
    if (encender == this.activo()) {
      return;
    }
    if (encender) {
      this.encender();
    } else {
      this.apagar();
    }
  },

  encender() {
    // Primero la migración de Firefox a las prefs _v2 (como hace su casilla, deleteOnClose): si se hiciera después,
    // en el cierre, copiaría encima las antiguas privacy.clearOnShutdown.* (con el historial a true).
    try {
      lazy.Sanitizer.maybeMigratePrefs("clearOnShutdown");
    } catch (e) {
      console.error("Aegis: Sesiones, migración de la limpieza al cerrar", e);
    }
    const yaLimpiaba = Services.prefs.getBoolPref(LIMPIAR, false);
    // Lo de antes (null: sin valor del usuario) y lo que pone Aegis, para deshacerlo al apagar.
    const antes = {};
    const puesto = {};
    for (const pref of TODAS) {
      antes[pref] = Services.prefs.prefHasUserValue(pref) ? leer(pref) : null;
    }
    const cambios = [[COOKIES, true]];
    if (!yaLimpiaba) {
      cambios.push([CACHE, true], ...OTROS.map(p => [p, false]));
    }
    cambios.push([NIVEL, NIVEL_SIN_DATOS], [LIMPIAR, true]);
    for (const [pref, valor] of cambios) {
      poner(pref, valor);
      puesto[pref] = valor;
    }
    Services.prefs.setStringPref(PREVIO, JSON.stringify({ antes, puesto }));
  },

  apagar() {
    let guardado = null;
    try {
      guardado = JSON.parse(Services.prefs.getStringPref(PREVIO, "") || "null");
    } catch {}
    Services.prefs.clearUserPref(PREVIO);
    if (!guardado?.puesto) {
      // Encendida desde la casilla de cookies de Firefox: se apaga como la apaga ella. La limpieza al cerrar sigue
      // solo si queda algo más elegido en «Historial» (historial o permisos, como en config/privacy.mjs).
      Services.prefs.setBoolPref(COOKIES, false);
      Services.prefs.setBoolPref(CACHE, false);
      const otros = ["privacy.clearOnShutdown_v2.browsingHistoryAndDownloads", "privacy.clearOnShutdown_v2.siteSettings"];
      Services.prefs.setBoolPref(LIMPIAR, otros.some(p => Services.prefs.getBoolPref(p, false)));
      return;
    }
    // La limpieza primero: así no queda apuntada una limpieza a medias mientras vuelven las demás.
    const orden = [LIMPIAR, ...TODAS.filter(p => p != LIMPIAR)];
    for (const pref of orden) {
      if (!(pref in guardado.puesto)) {
        continue;
      }
      // Cambiada después desde otro sitio: se respeta.
      if (leer(pref) !== guardado.puesto[pref]) {
        continue;
      }
      const antes = guardado.antes?.[pref];
      if (antes === null || antes === undefined) {
        Services.prefs.clearUserPref(pref);
      } else {
        poner(pref, antes);
      }
    }
  },
};
