/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · Contraseñas (about:logins), estado vacío. Firefox pinta un zorro con un cofre, habla de sus avisos de
 * filtraciones (Mozilla Monitor), explica cómo activar Firefox Sync y enlaza a su ayuda. Aquí: el glifo de la llave,
 * una frase y «Importar contraseñas» (docs/DISENO.md, «Estado vacío»). El aspecto está en contrasenas.css y
 * contrasenas-sombra.css. Además, la parte de la protección (../contrasenas.sys.mjs): aviso si no hay contraseña
 * principal y sin «Exportar contraseñas» en claro. Y en la contraseña elegida, su código de verificación
 * (../autenticador/): verlo, copiarlo, añadirlo o cambiarlo.
 *
 * Lo llama AegisPaginasChild en el proceso de la página, cuando sus componentes ya están montados. Sin
 * temporizadores; idempotente.
 */

const SVG = "http://www.w3.org/2000/svg";
/** El glifo «llave» del Centro de SecretOS (rejilla de 24, trazo de 1,5). Va dentro de la página como SVG en línea:
 * la CSP de about:logins no deja cargar imágenes resource:// y, en línea, toma el color del texto. */
const LLAVE = "M4 15.5a4 4 0 1 0 8 0a4 4 0 1 0 -8 0M10.8 12.7l7.7 -7.7M15.5 8l2.5 2.5M13 10.5l2 2";

let localizacion;
/**
 * Textos de Aegis con su propio Localization síncrono (nunca el document.l10n de la página: si aegis.ftl fallara,
 * Fluent dejaría sin traducir la página entera).
 *
 * @param {string} id
 * @param {object} [args]
 * @returns {string}
 */
function texto(id, args) {
  localizacion ??= new Localization(["aegis.ftl", "branding/brand.ftl"], true);
  const [m] = localizacion.formatMessagesSync([{ id, args }]);
  return m?.value ?? "";
}

/**
 * Importar: desde otro navegador donde la página lo ofrece (Windows y macOS; el asistente también importa de un
 * archivo CSV) y, si no, desde un archivo. Son los mismos eventos que el menú «⋯» de la página.
 *
 * @param {Window} win
 */
function importar(win) {
  const desdeNavegador = Cu.waiveXrays(win).AboutLoginsUtils?.importVisible;
  const evento = desdeNavegador ? "AboutLoginsImportFromBrowser" : "AboutLoginsImportFromFile";
  win.document.dispatchEvent(new win.CustomEvent(evento, { bubbles: true }));
}

/**
 * @param {Document} doc
 * @returns {Element}
 */
function glifo(doc) {
  const svg = doc.createElementNS(SVG, "svg");
  for (const [k, v] of Object.entries({
    class: "aegis-vacio-glifo",
    viewBox: "0 0 24 24",
    width: "32",
    height: "32",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "1.5",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    "aria-hidden": "true",
  })) {
    svg.setAttribute(k, v);
  }
  const trazo = doc.createElementNS(SVG, "path");
  trazo.setAttribute("d", LLAVE);
  svg.append(trazo);
  return svg;
}

/**
 * Estado vacío propio dentro de <login-intro> (su shadow DOM). Lo de Firefox (ilustración, título, filtraciones,
 * pasos de Sync, ayuda) lo oculta contrasenas-sombra.css.
 *
 * @param {Window} win
 */
function estadoVacio(win) {
  const doc = win.document;
  const raiz = doc.querySelector("login-intro")?.shadowRoot;
  if (!raiz || raiz.querySelector(".aegis-vacio")) {
    return;
  }
  const caja = doc.createElement("div");
  caja.className = "aegis-vacio";
  const frase = doc.createElement("p");
  frase.className = "aegis-vacio-frase";
  frase.textContent = texto("aegis-contrasenas-vacio");
  const boton = doc.createElement("button");
  boton.className = "primary aegis-vacio-importar";
  boton.textContent = texto("aegis-contrasenas-importar");
  boton.addEventListener("click", () => importar(win));
  caja.append(glifo(doc), frase, boton);
  raiz.append(caja);
}

/**
 * Pregunta al proceso principal (paginas/AegisPaginasParent.sys.mjs, contrasenas.sys.mjs).
 *
 * @param {Window} win
 * @param {string} mensaje
 * @param {object} [datos]
 * @returns {Promise<any>}
 */
function preguntar(win, mensaje, datos) {
  return win.windowGlobalChild.getActor("AegisPaginas").sendQuery(`Aegis:Contrasenas:${mensaje}`, datos);
}

/**
 * Menú «⋯»: fuera «Exportar contraseñas» (en claro, CSV) salvo que se active aegis.contrasenas.exportar_en_claro.
 * Aunque alguien la llame, el proceso principal no escribe el archivo (contrasenas.sys.mjs).
 *
 * @param {Window} win
 * @param {boolean} exportar
 */
function menuSinExportar(win, exportar) {
  const boton = win.document.querySelector("menu-button")?.shadowRoot?.querySelector(".menuitem-export");
  if (boton) {
    boton.hidden = !exportar;
  }
}

/**
 * Aviso «Sin contraseña principal» en la cabecera, con «Crear contraseña principal» (el diálogo de Aegis,
 * dialogos/contrasena-principal.xhtml, modal en la ventana).
 *
 * @param {Window} win
 */
function avisoPrincipal(win) {
  const doc = win.document;
  const cabecera = doc.querySelector("body > header");
  if (!cabecera || doc.querySelector(".aegis-aviso-principal")) {
    return;
  }
  const aviso = doc.createElement("div");
  aviso.className = "aegis-aviso-principal";
  aviso.setAttribute("role", "status");
  const frase = doc.createElement("p");
  frase.className = "aegis-aviso-principal-texto";
  frase.textContent = texto("aegis-contrasenas-sin-principal");
  const boton = doc.createElement("button");
  boton.className = "aegis-aviso-principal-boton";
  boton.textContent = texto("aegis-contrasenas-principal-crear");
  boton.addEventListener("click", async () => {
    boton.disabled = true;
    try {
      if (await preguntar(win, "CrearPrincipal")) {
        aviso.remove();
        return;
      }
    } catch (e) {
      console.error("Aegis: contraseña principal", e);
    }
    boton.disabled = false;
  });
  aviso.append(frase, boton);
  cabecera.prepend(aviso);
}

/**
 * @param {Window} win
 */
async function proteccion(win) {
  const estado = await preguntar(win, "Estado");
  if (win.closed || !estado) {
    return;
  }
  win.customElements.whenDefined("menu-button").then(() => menuSinExportar(win, estado.exportar), console.error);
  if (!estado.principal) {
    avisoPrincipal(win);
  } else {
    win.document.querySelector(".aegis-aviso-principal")?.remove();
  }
}

/* ───────── Código de verificación de la contraseña elegida (../autenticador/) ───────── */

/** Un código a la vista se oculta solo a los 2 minutos (y al ocultarse la página). */
const VISIBLE_MS = 2 * 60 * 1000;

/**
 * Fila «Código de verificación» en la tarjeta de la contraseña elegida (<login-item>, su shadow DOM), debajo de la
 * contraseña. El secreto nunca llega a esta página: el proceso principal (AegisPaginasParent) verifica la identidad y
 * devuelve solo el código. Con un código a la vista, la cuenta atrás corre cada segundo solo mientras la página se ve,
 * y como mucho 2 minutos. Al editar o crear una contraseña, la fila no se enseña.
 *
 * @param {Window} win
 */
function codigoDeVerificacion(win) {
  const doc = win.document;
  const item = doc.querySelector("login-item");
  const raiz = item?.shadowRoot;
  const rejilla = raiz?.querySelector(".detail-grid");
  if (!rejilla || raiz.querySelector(".aegis-codigo")) {
    return;
  }
  const crear = (etiqueta, clase) => {
    const el = doc.createElement(etiqueta);
    el.className = clase;
    return el;
  };
  const fila = crear("div", "detail-row aegis-codigo");
  const celda = crear("div", "detail-cell aegis-codigo-celda");
  const etiqueta = crear("span", "field-label");
  etiqueta.textContent = texto("aegis-codigos-etiqueta");
  const linea = crear("span", "aegis-codigo-linea");
  const valor = crear("span", "aegis-codigo-valor");
  const restante = crear("span", "aegis-codigo-restante");
  linea.append(valor, restante);
  const aviso = crear("p", "aegis-codigo-aviso");
  aviso.setAttribute("role", "status");
  aviso.hidden = true;
  celda.append(etiqueta, linea, aviso);
  const acciones = crear("div", "aegis-codigo-acciones");
  const ver = crear("button", "aegis-codigo-boton");
  const copiar = crear("button", "aegis-codigo-boton");
  const gestionar = crear("button", "aegis-codigo-boton");
  for (const b of [ver, copiar, gestionar]) {
    b.type = "button";
  }
  copiar.textContent = texto("aegis-codigos-boton-copiar");
  acciones.append(ver, copiar, gestionar);
  fila.append(celda, acciones);
  rejilla.append(fila);

  /** La contraseña elegida, si tiene código, y el código a la vista. */
  const estado = { guid: "", tiene: false, visible: null, reloj: null, pidiendo: false };

  const parar = () => {
    if (estado.reloj) {
      win.clearInterval(estado.reloj);
      estado.reloj = null;
    }
  };
  const pintar = () => {
    if (estado.visible) {
      const c = estado.visible.codigo;
      const corte = Math.ceil(c.length / 2);
      valor.textContent = `${c.slice(0, corte)} ${c.slice(corte)}`;
      const segundos = Math.max(0, Math.ceil((estado.visible.expira - Date.now()) / 1000));
      restante.textContent = texto("aegis-codigos-restante", { segundos });
      restante.hidden = false;
      ver.textContent = texto("aegis-codigos-boton-ocultar");
      ver.setAttribute("aria-pressed", "true");
    } else {
      valor.textContent = estado.tiene ? "••• •••" : texto("aegis-codigos-ninguno");
      restante.hidden = true;
      ver.textContent = texto("aegis-codigos-boton-mostrar");
      ver.setAttribute("aria-pressed", "false");
    }
    valor.classList.toggle("aegis-codigo-sin", !estado.tiene);
    ver.hidden = !estado.tiene;
    copiar.hidden = !estado.tiene;
    gestionar.textContent = texto(estado.tiene ? "aegis-codigos-boton-cambiar" : "aegis-codigos-boton-anadir");
  };
  const ocultar = () => {
    parar();
    estado.visible = null;
    pintar();
  };
  const decir = id => {
    const segundos = Services.prefs.getIntPref("aegis.autenticador.portapapeles_segundos", 30);
    aviso.textContent = id ? texto(id, { segundos }) : "";
    aviso.hidden = !id;
  };
  const tic = async () => {
    const v = estado.visible;
    if (!v || Date.now() >= v.hasta) {
      ocultar();
      return;
    }
    if (Date.now() >= v.expira && !estado.pidiendo) {
      estado.pidiendo = true;
      // Sin preguntar: solo dentro de la gracia de 5 minutos y con la bóveda abierta. Si no, se oculta.
      const r = await preguntar(win, "Codigo:Siguiente", { guid: estado.guid }).catch(() => null);
      estado.pidiendo = false;
      if (!r?.codigo || estado.visible != v) {
        ocultar();
        return;
      }
      Object.assign(v, { codigo: r.codigo, expira: Date.now() + r.restante * 1000 });
    }
    pintar();
  };

  const actualizar = async () => {
    const login = Cu.waiveXrays(item)._login ?? {};
    const guid = typeof login.guid == "string" ? login.guid : "";
    const editando = "editing" in item.dataset || "isNewLogin" in item.dataset;
    fila.hidden = !guid || editando;
    if (guid != estado.guid) {
      ocultar();
      decir(null);
      estado.guid = guid;
      estado.tiene = false;
      pintar();
    }
    if (!guid || editando) {
      return;
    }
    const tiene = !!(await preguntar(win, "Codigo:Estado", { guid }).catch(() => false));
    if (estado.guid == guid) {
      estado.tiene = tiene;
      pintar();
    }
  };

  ver.addEventListener("click", async () => {
    if (estado.visible) {
      ocultar();
      return;
    }
    ver.disabled = true;
    const guid = estado.guid;
    const r = await preguntar(win, "Codigo:Ver", { guid }).catch(() => null);
    ver.disabled = false;
    if (r?.error) {
      decir("aegis-codigos-ilegible");
      return;
    }
    if (!r?.codigo || estado.guid != guid) {
      return;
    }
    decir(null);
    estado.tiene = true;
    estado.visible = { codigo: r.codigo, expira: Date.now() + r.restante * 1000, hasta: Date.now() + VISIBLE_MS };
    pintar();
    if (!estado.reloj && doc.visibilityState == "visible") {
      estado.reloj = win.setInterval(() => tic().catch(() => ocultar()), 1000);
    }
  });
  copiar.addEventListener("click", async () => {
    copiar.disabled = true;
    const r = await preguntar(win, "Codigo:Copiar", { guid: estado.guid }).catch(() => null);
    copiar.disabled = false;
    if (r?.error) {
      decir("aegis-codigos-ilegible");
    } else if (r?.copiado) {
      const segundos = Services.prefs.getIntPref("aegis.autenticador.portapapeles_segundos", 30);
      decir(segundos > 0 ? "aegis-codigos-copiado" : "aegis-codigos-copiado-sin-borrar");
    }
  });
  gestionar.addEventListener("click", async () => {
    gestionar.disabled = true;
    ocultar();
    decir(null);
    await preguntar(win, "Codigo:Gestionar", { guid: estado.guid }).catch(() => null);
    gestionar.disabled = false;
    estado.guid = "";
    actualizar().catch(console.error);
  });

  // Cambia la contraseña elegida (el título de la tarjeta) o se empieza a editar o a crear una (atributos).
  const observador = new win.MutationObserver(() => actualizar().catch(console.error));
  const titulo = raiz.querySelector(".login-item-title");
  if (titulo) {
    observador.observe(titulo, { childList: true, characterData: true, subtree: true });
  }
  observador.observe(item, { attributes: true, attributeFilter: ["data-editing", "data-is-new-login"] });
  // Al volver a la página se pregunta otra vez si tiene código (se ha podido añadir o quitar desde el panel); al
  // dejarla de ver, el código se oculta y el reloj se para.
  doc.addEventListener("visibilitychange", () => {
    if (doc.visibilityState == "visible") {
      actualizar().catch(console.error);
    } else {
      ocultar();
    }
  });
  win.addEventListener("pagehide", ocultar);
  pintar();
  actualizar().catch(console.error);
}

/**
 * @param {Window} win
 */
export function completar(win) {
  if (win.closed || !win.document) {
    return;
  }
  const comprobar = () => proteccion(win).catch(e => console.error("Aegis: contraseñas (protección)", e));
  comprobar();
  // Si la contraseña principal se crea en otro sitio (el panel, Ajustes), el aviso se va al volver a la página.
  win.addEventListener("visibilitychange", () => win.document.visibilityState == "visible" && comprobar());
  win.addEventListener("focus", comprobar);
  const hecho = () => {
    try {
      estadoVacio(win);
    } catch (e) {
      console.error("Aegis: contraseñas", e);
    }
  };
  const codigo = () => {
    try {
      codigoDeVerificacion(win);
    } catch (e) {
      console.error("Aegis: contraseñas (código de verificación)", e);
    }
  };
  if (win.document.querySelector("login-item")?.shadowRoot) {
    codigo();
  } else {
    win.customElements.whenDefined("login-item").then(codigo, console.error);
  }
  if (win.document.querySelector("login-intro")?.shadowRoot) {
    hecho();
  } else {
    // Por si el componente aún no estaba definido: en cuanto lo esté.
    win.customElements.whenDefined("login-intro").then(hecho, console.error);
  }
}
