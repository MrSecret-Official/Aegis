/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · about:privatebrowsing en la instancia con Tor (tor/tor.sys.mjs): debajo del buscador, el estado de la
 * conexión con Tor y una línea honesta. Lee el estado que publica tor.sys.mjs en sharedData (solo existe en la
 * instancia con Tor; en las ventanas privadas normales no se pinta nada) y lo sigue con su evento «change», sin
 * temporizadores. Lo carga AegisPaginasChild cuando la página está montada.
 */

const CLAVE_COMPARTIDA = "aegis-tor";

let localizacion;
function texto(id, args) {
  localizacion ??= new Localization(["aegis.ftl", "branding/brand.ftl"], true);
  const [m] = localizacion.formatMessagesSync([{ id, args }]);
  return m?.value ?? "";
}

/**
 * @param {Window} win la página about:privatebrowsing
 */
export function completar(win) {
  const doc = win.document;
  if (!Services.cpmm.sharedData.has(CLAVE_COMPARTIDA)) {
    return;
  }
  const ancla = doc.querySelector(".search-inner-wrapper") ?? doc.querySelector(".container");
  if (!ancla) {
    return;
  }
  const caja = doc.createElement("div");
  caja.className = "aegis-tor-privada";
  const estado = doc.createElement("p");
  estado.className = "aegis-tor-privada-estado";
  estado.setAttribute("role", "status");
  const nota = doc.createElement("p");
  nota.className = "aegis-tor-privada-nota";
  nota.textContent = texto("aegis-tor-privada-nota");
  caja.append(estado, nota);
  ancla.after(caja);

  const pintar = () => {
    const d = Services.cpmm.sharedData.get(CLAVE_COMPARTIDA);
    if (!d) {
      return;
    }
    estado.textContent = d.error
      ? `${texto(`aegis-tor-red-${d.fase}`, { progreso: d.progreso })} ${texto(d.error)}`
      : texto(`aegis-tor-red-${d.fase}`, { progreso: d.progreso });
    caja.setAttribute("aegis-tor-fase", d.fase);
  };
  const alCambiar = e => {
    if (e.changedKeys.includes(CLAVE_COMPARTIDA)) {
      pintar();
    }
  };
  pintar();
  Services.cpmm.sharedData.addEventListener("change", alCambiar);
  win.addEventListener("unload", () => Services.cpmm.sharedData.removeEventListener("change", alCambiar), {
    once: true,
  });
}
