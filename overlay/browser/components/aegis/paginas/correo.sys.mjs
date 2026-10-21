/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · el correo de la nueva pestaña, en su proceso de contenido (docs/DISENO.md §9, «Botón del correo»). Lo pone
 * AegisPaginasChild en about:newtab y about:home; guardar, quitar y abrir los hace el proceso principal
 * (../correo.sys.mjs, por el actor AegisPaginas).
 *
 * - Un botón con el sobre junto a Personalizar (el mismo moz-button, de 32 y radio 8). Sin dirección, el primer clic
 *   abre un diálogo pequeño que la pide. Con ella, abre la bandeja en esta pestaña; con clic central o Ctrl+clic, en
 *   otra (lo decide el proceso principal, con la dirección que tiene guardada).
 * - Clic derecho (o la tecla de menú): «Cambiar la dirección del correo…» y «Quitar». También en Personalizar, en su
 *   propia sección, al final de las de Aegis.
 * - La dirección llega del proceso principal: se pide al abrir la página y, si cambia, llega sola (MENSAJE_CORREO).
 *   Se guarda en este proceso para las demás pestañas nuevas. Nada sale a la red hasta que el usuario pulsa el sobre.
 *
 * Sin temporizadores: un MutationObserver (React rehace la cabecera y el panel) y una revisión por tanda de cambios.
 */

import { MENSAJE_CORREO, normalizar } from "../correo.sys.mjs";

const HTML = "http://www.w3.org/1999/xhtml";
/**
 * El src del <img> de moz-button (sin iconsrc no lo pinta): un SVG vacío en data:, que la CSP de la página admite. El
 * sobre lo pone nueva-pestana.css con --button-icon-content (chrome://aegis-iconos/, que AegisArranque registra): la
 * hoja es de Aegis y puede cargarlo. El <img> carga con el principal de about:newtab, y chrome://aegis-iconos no es
 * accesible al contenido (a propósito: así ninguna web lo ve); con esa dirección en el src, cada proceso nuevo de la
 * nueva pestaña dejaba en la consola «no puede cargar o enlazar con chrome://aegis-iconos/content/correo.svg».
 */
const ICONO = "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2016%2016%22%2F%3E";

let localizacion;
function texto(id, args) {
  localizacion ??= new Localization(["aegis.ftl", "branding/brand.ftl"], true);
  try {
    return localizacion.formatValueSync(id, args) ?? "";
  } catch (e) {
    console.error(`Aegis: texto ${id}`, e);
    return "";
  }
}

// ── La dirección, compartida por las pestañas nuevas de este proceso ──────────────────────────────────────────────

/** La dirección guardada ("" sin ella), o null mientras no se sabe. */
let direccion = null;
const avisos = new Set();
let escuchando = false;

function poner(url) {
  direccion = typeof url == "string" ? (normalizar(url).url ?? "") : "";
  for (const aviso of avisos) {
    aviso();
  }
}

function seguir(aviso, pedir) {
  if (!escuchando) {
    escuchando = true;
    Services.cpmm.addMessageListener(MENSAJE_CORREO, m => poner(m.data?.url));
  }
  avisos.add(aviso);
  if (direccion === null) {
    pedir("Aegis:Correo:Leer", {})
      .then(r => direccion === null && poner(r?.url))
      .catch(() => {});
  }
  return () => avisos.delete(aviso);
}

// ── Piezas ─────────────────────────────────────────────────────────────────────────────────────────────────────────

function crear(doc, etiqueta, atributos = {}, contenido) {
  const el = doc.createElementNS(HTML, etiqueta);
  for (const [k, v] of Object.entries(atributos)) {
    el.setAttribute(k, v);
  }
  if (contenido !== undefined) {
    el.textContent = contenido;
  }
  return el;
}

/** El sitio de la dirección, para enseñarlo («mail.proton.me»). */
function sitio(url) {
  return URL.parse(url)?.host ?? url;
}

/**
 * El diálogo que pide la dirección (DISENO §9). Devuelve una promesa que se cumple al cerrarse.
 *
 * @param {Window} win
 * @param {(nombre: string, datos: object) => Promise<any>} pedir
 * @param {Element} [abridor] adonde vuelve el foco
 */
function dialogo(win, pedir, abridor) {
  const doc = win.document;
  doc.querySelector("dialog.aegis-correo")?.remove();
  const caja = crear(doc, "dialog", {
    class: "aegis-correo",
    "aria-labelledby": "aegis-correo-titulo",
    "aria-describedby": "aegis-correo-texto",
  });
  const form = crear(doc, "form", { class: "aegis-correo-form", novalidate: "" });
  const titulo = crear(doc, "h2", { class: "aegis-correo-titulo", id: "aegis-correo-titulo" }, texto("aegis-correo-dialogo-titulo"));
  const explicacion = crear(doc, "p", { class: "aegis-correo-texto", id: "aegis-correo-texto" }, texto("aegis-correo-dialogo-texto"));
  const rotulo = crear(doc, "label", { class: "aegis-correo-rotulo", for: "aegis-correo-url" }, texto("aegis-correo-dialogo-campo"));
  const campo = crear(doc, "input", {
    class: "aegis-correo-campo",
    id: "aegis-correo-url",
    type: "text",
    inputmode: "url",
    autocomplete: "off",
    spellcheck: "false",
    placeholder: "https://mail.proton.me",
    "aria-describedby": "aegis-correo-ejemplos aegis-correo-error",
  });
  campo.value = direccion ?? "";
  const ejemplos = crear(doc, "p", { class: "aegis-correo-ejemplos", id: "aegis-correo-ejemplos" }, texto("aegis-correo-dialogo-ejemplos"));
  const error = crear(doc, "p", { class: "aegis-correo-error", id: "aegis-correo-error", role: "alert" });
  const pie = crear(doc, "div", { class: "aegis-correo-pie" });
  const cancelar = crear(doc, "button", { type: "button", class: "aegis-correo-boton" }, texto("aegis-correo-cancelar"));
  const guardar = crear(doc, "button", { type: "submit", class: "aegis-correo-boton aegis-correo-principal" }, texto("aegis-correo-guardar"));
  pie.append(cancelar, guardar);
  form.append(titulo, explicacion, rotulo, campo, ejemplos, error, pie);
  caja.append(form);
  doc.body.append(caja);

  const mostrarError = clave => {
    error.textContent = clave ? texto(`aegis-correo-error-${clave}`) : "";
    campo.toggleAttribute("aria-invalid", !!clave);
  };
  campo.addEventListener("input", () => mostrarError(null));
  cancelar.addEventListener("click", () => caja.close());
  form.addEventListener("submit", async ev => {
    ev.preventDefault();
    const local = normalizar(campo.value);
    if (local.error) {
      mostrarError(local.error);
      campo.focus();
      return;
    }
    guardar.disabled = true;
    const r = await pedir("Aegis:Correo:Guardar", { url: campo.value }).catch(() => ({ error: "direccion" }));
    guardar.disabled = false;
    if (r?.url) {
      poner(r.url);
      caja.close();
    } else {
      mostrarError(r?.error ?? "direccion");
      campo.focus();
    }
  });
  return new Promise(resolver => {
    caja.addEventListener(
      "close",
      () => {
        caja.remove();
        abridor?.focus();
        resolver();
      },
      { once: true }
    );
    caja.showModal();
    campo.focus();
    campo.select();
  });
}

/**
 * El menú del botón (clic derecho o la tecla de menú): un popover manual con dos elementos. Manual y no «auto»: el
 * menú contextual llega en medio de la pulsación del botón derecho, y el cierre automático de un popover «auto» lo
 * cerraría al soltarlo; aquí se cierra al pulsar fuera, con Esc, al perder el foco o al elegir.
 *
 * @param {Window} win
 * @param {Element} boton
 * @param {(nombre: string, datos: object) => Promise<any>} pedir
 */
function menu(win, boton, pedir) {
  const doc = win.document;
  doc.querySelector(".aegis-correo-menu")?.remove();
  const lista = crear(doc, "div", { class: "aegis-correo-menu", role: "menu", popover: "manual" });
  const cambiar = crear(
    doc,
    "button",
    { type: "button", role: "menuitem", class: "aegis-correo-menu-elemento" },
    texto(direccion ? "aegis-correo-menu-cambiar" : "aegis-correo-menu-anadir")
  );
  lista.append(cambiar);
  const elementos = [cambiar];
  if (direccion) {
    const quitar = crear(doc, "button", { type: "button", role: "menuitem", class: "aegis-correo-menu-elemento" }, texto("aegis-correo-quitar"));
    quitar.addEventListener("click", () => {
      cerrar();
      pedir("Aegis:Correo:Quitar", {}).then(r => poner(r?.url ?? ""), () => {});
      boton.focus();
    });
    lista.append(quitar);
    elementos.push(quitar);
  }
  cambiar.addEventListener("click", () => {
    cerrar();
    dialogo(win, pedir, boton);
  });
  lista.addEventListener("keydown", ev => {
    const i = elementos.indexOf(doc.activeElement);
    if (ev.key == "ArrowDown" || ev.key == "ArrowUp") {
      ev.preventDefault();
      const paso = ev.key == "ArrowDown" ? 1 : -1;
      elementos[(i + paso + elementos.length) % elementos.length].focus();
    } else if (ev.key == "Home" || ev.key == "End") {
      ev.preventDefault();
      elementos[ev.key == "Home" ? 0 : elementos.length - 1].focus();
    } else if (ev.key == "Escape" || ev.key == "Tab") {
      ev.preventDefault();
      cerrar();
      boton.focus();
    }
  });
  const fuera = ev => {
    if (!lista.contains(ev.target)) {
      cerrar();
    }
  };
  const cerrar = () => {
    doc.removeEventListener("pointerdown", fuera, true);
    lista.removeEventListener("focusout", alSalir);
    if (lista.isConnected) {
      lista.hidePopover();
      lista.remove();
    }
  };
  const alSalir = ev => {
    if (!ev.relatedTarget || !lista.contains(ev.relatedTarget)) {
      cerrar();
    }
  };
  doc.body.append(lista);
  // Debajo del botón, alineado por su borde derecho (está arriba a la derecha de la página).
  const r = boton.getBoundingClientRect();
  lista.style.setProperty("--aegis-correo-arriba", `${Math.round(r.bottom + 4)}px`);
  lista.style.setProperty("--aegis-correo-derecha", `${Math.round(win.innerWidth - r.right)}px`);
  lista.showPopover();
  cambiar.focus();
  doc.addEventListener("pointerdown", fuera, true);
  lista.addEventListener("focusout", alSalir);
}

/**
 * Sección «Correo» de Personalizar (al final de las de Aegis): la dirección y sus botones.
 *
 * @returns {{raiz: HTMLElement, actualizar: () => void}}
 */
function seccion(win, pedir) {
  const doc = win.document;
  const raiz = crear(doc, "section", { class: "aegis-np-seccion aegis-correo-seccion", "aria-labelledby": "aegis-correo-seccion-titulo" });
  raiz.append(crear(doc, "h2", { class: "aegis-np-etiqueta", id: "aegis-correo-seccion-titulo" }, texto("aegis-correo-titulo")));
  const tarjeta = crear(doc, "div", { class: "aegis-np-tarjeta" });
  const fila = crear(doc, "div", { class: "aegis-correo-fila" });
  const estado = crear(doc, "p", { class: "aegis-correo-estado" });
  const botones = crear(doc, "div", { class: "aegis-correo-botones" });
  const cambiar = crear(doc, "button", { type: "button", class: "aegis-np-boton" });
  const quitar = crear(doc, "button", { type: "button", class: "aegis-np-boton" }, texto("aegis-correo-quitar"));
  botones.append(cambiar, quitar);
  fila.append(estado, botones);
  tarjeta.append(fila);
  raiz.append(tarjeta);
  cambiar.addEventListener("click", () => dialogo(win, pedir, cambiar));
  quitar.addEventListener("click", () => {
    pedir("Aegis:Correo:Quitar", {}).then(r => poner(r?.url ?? ""), () => {});
    cambiar.focus();
  });
  const actualizar = () => {
    estado.textContent = direccion ? texto("aegis-correo-actual", { sitio: sitio(direccion) }) : texto("aegis-correo-sin");
    cambiar.textContent = texto(direccion ? "aegis-correo-cambiar" : "aegis-correo-anadir");
    quitar.hidden = !direccion;
  };
  actualizar();
  return { raiz, actualizar };
}

/**
 * @param {Window} win la nueva pestaña
 * @param {(nombre: string, datos: object) => Promise<any>} pedir pregunta al proceso principal (actor AegisPaginas)
 * @returns {() => void} para deshacerlo
 */
export function correo(win, pedir) {
  const doc = win.document;
  let boton = null;
  let parte = null;

  const crearBoton = () => {
    const b = doc.createElementNS(HTML, "moz-button");
    b.className = "aegis-correo-abrir";
    b.setAttribute("type", "primary");
    b.setAttribute("iconsrc", ICONO);
    b.addEventListener("click", ev => {
      if (ev.button != 0) {
        return;
      }
      ev.preventDefault();
      if (!direccion) {
        dialogo(win, pedir, b);
        return;
      }
      pedir("Aegis:Correo:Abrir", { button: 0, ctrlKey: ev.ctrlKey, metaKey: ev.metaKey, shiftKey: ev.shiftKey }).catch(() => {});
    });
    // Clic central: en otra pestaña (sin dirección no hace nada; el diálogo es para el clic normal).
    b.addEventListener("auxclick", ev => {
      if (ev.button == 1 && direccion) {
        ev.preventDefault();
        pedir("Aegis:Correo:Abrir", { button: 1, ctrlKey: ev.ctrlKey, metaKey: ev.metaKey, shiftKey: ev.shiftKey }).catch(() => {});
      }
    });
    b.addEventListener("contextmenu", ev => {
      ev.preventDefault();
      menu(win, b, pedir);
    });
    return b;
  };

  const etiquetar = () => {
    if (!boton) {
      return;
    }
    const t = direccion ? texto("aegis-correo-boton-abrir", { sitio: sitio(direccion) }) : texto("aegis-correo-boton-elegir");
    boton.setAttribute("title", t);
    boton.setAttribute("aria-label", t);
  };

  const revisar = () => {
    programado = false;
    try {
      // El botón, delante del de Personalizar, dentro de su contenedor (arriba a la derecha).
      const contenedor = doc.querySelector(".personalizeButtonWrapper");
      if (contenedor && (!boton || boton.parentNode != contenedor)) {
        boton ??= crearBoton();
        contenedor.prepend(boton);
        etiquetar();
      }
      // La sección de Personalizar, al final de las de Aegis (paginas/personalizar.sys.mjs las pone en .aegis-np).
      const aegis = doc.querySelector(".customize-menu .aegis-np");
      if (aegis && (!parte || parte.raiz.parentNode != aegis)) {
        parte ??= seccion(win, pedir);
        aegis.append(parte.raiz);
      }
    } catch (e) {
      console.error("Aegis: correo de la nueva pestaña", e);
    }
  };
  let programado = false;
  const programar = () => {
    if (!programado) {
      programado = true;
      Promise.resolve().then(revisar);
    }
  };

  const dejar = seguir(() => {
    etiquetar();
    parte?.actualizar();
  }, pedir);
  const observador = new win.MutationObserver(programar);
  observador.observe(doc, { childList: true, subtree: true });
  programar();
  return () => {
    observador.disconnect();
    dejar();
  };
}
