/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · panel «Contraseñas» de la barra lateral: las secciones «Códigos de verificación» y «Passkeys», plegadas de
 * serie, entre la cabecera y la lista (fuera de la lista virtual, que calcula sus alturas). Lo llama
 * contrasenas-panel.sys.mjs después de cada pintado; la sección se construye una vez y se repinta solo cuando cambia
 * algo (un código guardado o quitado, desplegar, ver, copiar). Aspecto: estilos/contrasenas-panel.css.
 *
 * - Los códigos se ven ocultos («••• •••»). Ver o copiar uno pide verificar la identidad (autenticador.sys.mjs).
 * - Con un código a la vista, la cuenta atrás corre cada segundo solo mientras el panel se ve, y como mucho 2 minutos:
 *   después (o al ocultarse el panel) el código se vuelve a ocultar y el reloj se para. Nada corre en reposo.
 * - Passkeys (solo en Windows): dónde viven y un botón a su página de la Configuración de Windows. Firefox no da una
 *   lista fiable de las passkeys de cada sitio, así que no se inventa ninguna.
 */

import { AppConstants } from "resource://gre/modules/AppConstants.sys.mjs";
import { AegisAutenticador } from "./autenticador.sys.mjs";
import { agrupar } from "./totp.sys.mjs";

const HTML = "http://www.w3.org/1999/xhtml";
/** Un código a la vista se oculta solo a los 2 minutos. */
const VISIBLE_MS = 2 * 60 * 1000;

let localizacion;
function mensaje(id, args) {
  localizacion ??= new Localization(["aegis.ftl", "branding/brand.ftl"], true);
  const [m] = localizacion.formatMessagesSync([{ id, args }]);
  return {
    valor: m?.value ?? "",
    atributos: Object.fromEntries((m?.attributes ?? []).map(a => [a.name, a.value])),
  };
}

function host(origen) {
  try {
    return new URL(origen).host;
  } catch (e) {
    return origen;
  }
}

/** Estado de cada panel (<megalist-alpha>): lo desplegado, los códigos a la vista y el reloj. */
const estados = new WeakMap();

function estadoDe(panel) {
  let e = estados.get(panel);
  if (!e) {
    e = { abiertos: new Set(), visibles: new Map(), reloj: null, aviso: null, seccion: null };
    estados.set(panel, e);
  }
  return e;
}

/* ───────── Reloj (solo con un código a la vista y el panel visible) ───────── */

function parar(panel) {
  const e = estadoDe(panel);
  if (e.reloj) {
    panel.ownerDocument.defaultView.clearInterval(e.reloj);
    e.reloj = null;
  }
}

function ocultarTodo(panel) {
  const e = estadoDe(panel);
  parar(panel);
  if (e.visibles.size) {
    e.visibles.clear();
    pintarCodigos(panel).catch(console.error);
  }
}

async function tic(panel) {
  const e = estadoDe(panel);
  const ahora = Date.now();
  for (const [guid, v] of [...e.visibles]) {
    if (ahora >= v.hasta) {
      e.visibles.delete(guid);
      continue;
    }
    if (ahora >= v.expira && !v.pidiendo) {
      v.pidiendo = true;
      try {
        // Sin preguntar: solo dentro de los 5 minutos de gracia y con la bóveda abierta. Si no, se oculta.
        const r = await AegisAutenticador.siguiente(guid);
        if (r) {
          Object.assign(v, { codigo: r.codigo, expira: Date.now() + r.restante * 1000 });
        } else {
          e.visibles.delete(guid);
        }
      } catch (error) {
        e.visibles.delete(guid);
      }
      v.pidiendo = false;
    }
  }
  if (!e.visibles.size) {
    parar(panel);
  }
  pintarValores(panel);
}

function arrancar(panel) {
  const e = estadoDe(panel);
  const win = panel.ownerDocument.defaultView;
  if (!e.reloj && e.visibles.size && win.document.visibilityState == "visible") {
    e.reloj = win.setInterval(() => tic(panel).catch(console.error), 1000);
  }
}

/* ───────── Construcción ───────── */

function boton(doc, clase, id, args) {
  const b = doc.createElementNS(HTML, "button");
  b.type = "button";
  b.className = clase;
  const { valor, atributos } = mensaje(id, args);
  if (valor) {
    b.textContent = valor;
  }
  for (const [k, v] of Object.entries(atributos)) {
    b.setAttribute(k, v);
  }
  return b;
}

/** Una fila plegable: el botón de cabecera (con su glifo) y el cuerpo. */
function plegable(panel, doc, clave, tituloId, glifo) {
  const e = estadoDe(panel);
  const fila = doc.createElementNS(HTML, "div");
  fila.className = `aegis-extra-grupo aegis-extra-${clave}`;
  const cabecera = doc.createElementNS(HTML, "button");
  cabecera.type = "button";
  cabecera.className = `aegis-plegable aegis-glifo-${glifo}`;
  const cuerpoId = `aegis-extra-${clave}-cuerpo`;
  cabecera.setAttribute("aria-controls", cuerpoId);
  const titulo = doc.createElementNS(HTML, "span");
  titulo.className = "aegis-plegable-titulo";
  titulo.textContent = mensaje(tituloId).valor;
  const cuenta = doc.createElementNS(HTML, "span");
  cuenta.className = "aegis-plegable-cuenta";
  cabecera.append(titulo, cuenta);
  const cuerpo = doc.createElementNS(HTML, "div");
  cuerpo.className = "aegis-extra-cuerpo";
  cuerpo.id = cuerpoId;
  const abierto = e.abiertos.has(clave);
  cabecera.setAttribute("aria-expanded", String(abierto));
  cuerpo.hidden = !abierto;
  cabecera.addEventListener("click", () => {
    const ahora = !e.abiertos.has(clave);
    if (ahora) {
      e.abiertos.add(clave);
    } else {
      e.abiertos.delete(clave);
    }
    cabecera.setAttribute("aria-expanded", String(ahora));
    cuerpo.hidden = !ahora;
    if (clave == "codigos") {
      if (!ahora) {
        ocultarTodo(panel);
      }
      pintarCodigos(panel).catch(console.error);
    }
  });
  fila.append(cabecera, cuerpo);
  return { fila, cuerpo, cuenta };
}

function construir(panel) {
  const doc = panel.ownerDocument;
  const e = estadoDe(panel);
  const seccion = doc.createElementNS(HTML, "section");
  seccion.className = "aegis-extra";

  const codigos = plegable(panel, doc, "codigos", "aegis-codigos-titulo", "codigos");
  e.cuerpoCodigos = codigos.cuerpo;
  e.cuentaCodigos = codigos.cuenta;
  seccion.append(codigos.fila);

  if (AppConstants.platform == "win") {
    const passkeys = plegable(panel, doc, "passkeys", "aegis-passkeys-titulo", "passkeys");
    const texto = doc.createElementNS(HTML, "p");
    texto.className = "aegis-extra-texto";
    texto.textContent = mensaje("aegis-passkeys-texto").valor;
    const gestionar = boton(doc, "aegis-compacto", "aegis-passkeys-gestionar");
    gestionar.addEventListener("click", () => {
      try {
        AegisAutenticador.gestionarPasskeys();
      } catch (error) {
        console.error("Aegis: abrir las passkeys de Windows", error);
      }
    });
    passkeys.cuerpo.append(texto, gestionar);
    seccion.append(passkeys.fila);
  }
  e.seccion = seccion;
  return seccion;
}

/* ───────── Pintado ───────── */

/** Solo los valores y la cuenta atrás (cada segundo con el reloj en marcha). */
function pintarValores(panel) {
  const e = estadoDe(panel);
  for (const fila of e.cuerpoCodigos?.querySelectorAll(".aegis-codigo-fila") ?? []) {
    const v = e.visibles.get(fila.dataset.guid);
    const valor = fila.querySelector(".aegis-codigo-valor");
    const restante = fila.querySelector(".aegis-codigo-restante");
    const ver = fila.querySelector(".aegis-icono-ver");
    if (v) {
      valor.textContent = agrupar(v.codigo);
      const segundos = Math.max(0, Math.ceil((v.expira - Date.now()) / 1000));
      restante.textContent = mensaje("aegis-codigos-restante", { segundos }).valor;
      restante.hidden = false;
      ver.setAttribute("aria-pressed", "true");
    } else {
      valor.textContent = "••• •••";
      restante.hidden = true;
      ver.setAttribute("aria-pressed", "false");
    }
  }
}

function decirAviso(panel, id, args) {
  const e = estadoDe(panel);
  e.aviso = id ? mensaje(id, args).valor : null;
  const p = e.cuerpoCodigos?.querySelector(".aegis-codigos-aviso");
  if (p) {
    p.textContent = e.aviso ?? "";
    p.hidden = !e.aviso;
  }
}

async function pintarCodigos(panel) {
  const e = estadoDe(panel);
  const cuerpo = e.cuerpoCodigos;
  if (!cuerpo) {
    return;
  }
  const lista = await AegisAutenticador.lista();
  e.cuentaCodigos.textContent = lista.length ? String(lista.length) : "";
  if (!e.abiertos.has("codigos")) {
    cuerpo.replaceChildren();
    return;
  }
  const doc = panel.ownerDocument;
  const win = panel.ownerDocument.defaultView.browsingContext.topChromeWindow;
  const hijos = [];
  if (!lista.length) {
    const vacio = doc.createElementNS(HTML, "p");
    vacio.className = "aegis-extra-texto";
    vacio.textContent = mensaje("aegis-codigos-vacio").valor;
    hijos.push(vacio);
  }
  for (const { guid, origen, usuario } of lista.sort((a, b) => host(a.origen).localeCompare(host(b.origen)))) {
    const sitio = host(origen);
    const fila = doc.createElementNS(HTML, "div");
    fila.className = "aegis-codigo-fila";
    fila.dataset.guid = guid;
    const textos = doc.createElementNS(HTML, "div");
    textos.className = "aegis-codigo-textos";
    const nombre = doc.createElementNS(HTML, "span");
    nombre.className = "aegis-codigo-sitio";
    nombre.textContent = usuario ? `${sitio} · ${usuario}` : sitio;
    const linea = doc.createElementNS(HTML, "span");
    linea.className = "aegis-codigo-linea";
    const valor = doc.createElementNS(HTML, "span");
    valor.className = "aegis-codigo-valor";
    const restante = doc.createElementNS(HTML, "span");
    restante.className = "aegis-codigo-restante";
    linea.append(valor, restante);
    textos.append(nombre, linea);

    const ver = boton(doc, "aegis-icono aegis-icono-ver", "aegis-codigos-ver", { sitio });
    ver.addEventListener("click", async () => {
      if (e.visibles.has(guid)) {
        e.visibles.delete(guid);
        pintarValores(panel);
        return;
      }
      ver.disabled = true;
      try {
        const r = await AegisAutenticador.ver(guid, win);
        if (r) {
          e.visibles.set(guid, { codigo: r.codigo, expira: Date.now() + r.restante * 1000, hasta: Date.now() + VISIBLE_MS });
          decirAviso(panel, null);
          arrancar(panel);
        }
      } catch (error) {
        decirAviso(panel, "aegis-codigos-ilegible");
      }
      ver.disabled = false;
      pintarValores(panel);
    });
    const copiar = boton(doc, "aegis-icono aegis-icono-copiar", "aegis-codigos-copiar", { sitio });
    copiar.addEventListener("click", async () => {
      copiar.disabled = true;
      try {
        if (await AegisAutenticador.copiar(guid, win)) {
          const segundos = Services.prefs.getIntPref("aegis.autenticador.portapapeles_segundos", 30);
          decirAviso(panel, segundos > 0 ? "aegis-codigos-copiado" : "aegis-codigos-copiado-sin-borrar", { segundos });
        }
      } catch (error) {
        decirAviso(panel, "aegis-codigos-ilegible");
      }
      copiar.disabled = false;
    });
    const editar = boton(doc, "aegis-icono aegis-icono-editar", "aegis-codigos-editar", { sitio });
    editar.addEventListener("click", () => AegisAutenticador.abrirDialogo(win, guid).catch(console.error));
    fila.append(textos, ver, copiar, editar);
    hijos.push(fila);
  }
  const aviso = doc.createElementNS(HTML, "p");
  aviso.className = "aegis-codigos-aviso aegis-extra-texto";
  aviso.setAttribute("role", "status");
  aviso.textContent = e.aviso ?? "";
  aviso.hidden = !e.aviso;
  const anadir = boton(doc, "aegis-compacto", "aegis-codigos-anadir");
  anadir.addEventListener("click", () => AegisAutenticador.abrirDialogo(win).catch(console.error));
  hijos.push(aviso, anadir);
  cuerpo.replaceChildren(...hijos);
  // Lo que ya no existe deja de estar a la vista.
  for (const guid of e.visibles.keys()) {
    if (!lista.some(x => x.guid == guid)) {
      e.visibles.delete(guid);
    }
  }
  pintarValores(panel);
}

/**
 * Pone (o quita) la sección en el panel. La llama contrasenas-panel.sys.mjs tras cada pintado: barato si no cambia.
 *
 * @param {Element} panel <megalist-alpha>
 * @param {ShadowRoot} raiz
 */
export function seccionDelPanel(panel, raiz) {
  const contenedor = raiz.querySelector(".container");
  const lista = contenedor?.querySelector(":scope > .sidebar-panel-scrollable-content");
  const e = estadoDe(panel);
  // Con la bóveda pidiendo la contraseña principal o fuera de la lista (añadir, editar), no se enseña.
  if (!lista || panel.shouldShowPrimaryPasswordAuth) {
    contenedor?.querySelector(":scope > .aegis-extra")?.remove();
    ocultarTodo(panel);
    return;
  }
  if (e.seccion?.parentNode == contenedor && e.seccion.nextElementSibling == lista) {
    return;
  }
  const primeraVez = !e.seccion;
  const seccion = e.seccion ?? construir(panel);
  contenedor.insertBefore(seccion, lista);
  if (primeraVez) {
    const win = panel.ownerDocument.defaultView;
    const repintar = () => pintarCodigos(panel).catch(console.error);
    Services.obs.addObserver(repintar, "aegis-autenticador-cambiado");
    // El panel oculto (otra herramienta en la barra lateral, ventana minimizada): fuera los códigos y el reloj.
    const visibilidad = () => win.document.visibilityState != "visible" && ocultarTodo(panel);
    win.document.addEventListener("visibilitychange", visibilidad);
    win.addEventListener(
      "unload",
      () => {
        parar(panel);
        Services.obs.removeObserver(repintar, "aegis-autenticador-cambiado");
      },
      { once: true }
    );
    repintar();
  }
}
