/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · diálogo «Recibir de otro Aegis» (transferencia-recibir.xhtml). Lo abre AegisTransferencia.abrirRecibir con
 * gDialogBox (desde Ajustes o desde el asistente de importar, que ya trae el archivo en «aegis-ruta») después de
 * asegurar la contraseña principal.
 *
 * - El archivo se elige con el selector nativo; el código se escribe o se pega (visible y en monoespaciada: son
 *   palabras para escribir a mano). Debajo, cuántas palabras lleva o cuál no es de la lista; «Recibir» se activa con
 *   las 6.
 * - Si no abre, un solo mensaje para el código mal escrito y el archivo tocado (sin pistas de cuál). Caducado, ya
 *   importado o de una versión más nueva sí se dicen: solo se sabe con el código bueno (o en la cabecera, sin secretos).
 * - Al terminar, cuántas han entrado, cuántas ya estaban y el aviso de borrar el archivo, con un botón para hacerlo.
 *   Devuelve «aegis-recibidas» en la bolsa de argumentos (el asistente sigue con el resto).
 */

const { AegisTransferencia } = ChromeUtils.importESModule(
  "resource:///modules/aegis/contrasenas/transferencia/transferencia.sys.mjs"
);

const HTML = "http://www.w3.org/1999/xhtml";
const $ = id => document.getElementById(id);

const formulario = $("formulario");
const nombreArchivo = $("nombre-archivo");
const elegir = $("elegir");
const codigo = $("codigo");
const nota = $("nota-codigo");
const recibir = $("recibir");
const cancelar = $("cancelar");
const hecho = $("hecho");
const borrar = $("borrar");
const estadoBorrar = $("estado-borrar");
const errorGeneral = $("error-general");

const bolsa = (() => {
  try {
    return window.arguments?.[0]?.QueryInterface(Ci.nsIWritablePropertyBag2) ?? null;
  } catch (e) {
    return null;
  }
})();

let ruta = (() => {
  try {
    return bolsa?.getPropertyAsAString("aegis-ruta") ?? "";
  } catch (e) {
    return "";
  }
})();
let completo = false;
let ocupado = false;
let terminado = false;

/* ───────── Altura (como los demás diálogos de Aegis) ───────── */

let ultimoAlto = 0;
async function ajustarAltura(...elementos) {
  if (elementos.length) {
    await document.l10n.translateElements(elementos).catch(() => {});
  }
  const alto = document.body.scrollHeight;
  if (!ultimoAlto || alto == ultimoAlto) {
    ultimoAlto ||= alto;
    return;
  }
  ultimoAlto = alto;
  try {
    if (typeof window.resizeDialog == "function") {
      await window.resizeDialog();
    } else if (!document.documentElement.hasAttribute("subdialog")) {
      window.sizeToContent();
    }
  } catch (e) {
    console.error("Aegis: altura del diálogo de recibir contraseñas", e);
  }
}

function decir(el, id, args) {
  if (!id) {
    el.hidden = true;
    el.removeAttribute("data-l10n-id");
    el.textContent = "";
  } else {
    el.hidden = false;
    document.l10n.setAttributes(el, id, args);
  }
  return ajustarAltura(el);
}

function mismoTexto(el, id, args) {
  const actual = document.l10n.getAttributes(el);
  return actual.id == id && JSON.stringify(actual.args ?? {}) == JSON.stringify(args ?? {});
}

/* ───────── Archivo ───────── */

function ponerArchivo() {
  if (ruta) {
    nombreArchivo.removeAttribute("data-l10n-id");
    nombreArchivo.removeAttribute("data-vacio");
    nombreArchivo.textContent = PathUtils.filename(ruta);
    nombreArchivo.title = ruta;
    document.l10n.setAttributes(elegir, "aegis-recibir-cambiar");
  } else {
    nombreArchivo.setAttribute("data-vacio", "");
    nombreArchivo.removeAttribute("title");
    document.l10n.setAttributes(nombreArchivo, "aegis-recibir-sin-archivo");
    document.l10n.setAttributes(elegir, "aegis-recibir-elegir");
  }
}

async function pulsarElegir() {
  elegir.disabled = true;
  try {
    const elegida = await AegisTransferencia.elegirArchivo(window, "abrir");
    if (elegida) {
      ruta = elegida;
      ponerArchivo();
      decir(errorGeneral, null);
    }
  } catch (e) {
    console.error("Aegis: elegir el paquete de contraseñas", e);
  } finally {
    elegir.disabled = ocupado;
    actualizar();
  }
}

/* ───────── Código ───────── */

function actualizar() {
  const leido = AegisTransferencia.leerCodigo(codigo.value);
  completo = leido.completo;
  let id = "aegis-recibir-codigo-nota";
  let args;
  if (leido.desconocida) {
    id = "aegis-recibir-codigo-desconocida";
    args = { palabra: leido.desconocida };
  } else if (leido.normalizado) {
    id = "aegis-recibir-codigo-cuenta";
    args = { palabras: leido.palabras };
  }
  if (!mismoTexto(nota, id, args)) {
    document.l10n.setAttributes(nota, id, args);
    ajustarAltura(nota);
  }
  codigo.toggleAttribute("aria-invalid", !!leido.desconocida);
  recibir.disabled = ocupado || !completo || !ruta;
}

/* ───────── Recibir ───────── */

const ERRORES = {
  incorrecto: "aegis-recibir-error-incorrecto",
  version: "aegis-recibir-error-version",
  caducado: "aegis-recibir-error-caducado",
  reloj: "aegis-recibir-error-reloj",
  usado: "aegis-recibir-error-usado",
  leer: "aegis-recibir-error-leer",
  "sin-principal": "aegis-recibir-error-sin-principal",
  bloqueada: "aegis-recibir-error-bloqueada",
};

function linea(id, args) {
  const li = document.createElementNS(HTML, "li");
  document.l10n.setAttributes(li, id, args);
  return li;
}

async function mostrarResumen(total) {
  terminado = true;
  try {
    bolsa?.setPropertyAsBool("aegis-recibidas", true);
  } catch (e) {}
  const lineas = [linea("aegis-recibir-resumen-nuevas", { n: total.nuevas })];
  if (total.actualizadas) {
    lineas.push(linea("aegis-recibir-resumen-actualizadas", { n: total.actualizadas }));
  }
  if (total.yaEstaban) {
    lineas.push(linea("aegis-recibir-resumen-ya", { n: total.yaEstaban }));
  }
  if (total.codigosNuevos) {
    lineas.push(linea("aegis-recibir-resumen-codigos", { n: total.codigosNuevos }));
  }
  if (total.codigosYaEstaban) {
    lineas.push(linea("aegis-recibir-resumen-codigos-ya", { n: total.codigosYaEstaban }));
  }
  if (total.errores) {
    lineas.push(linea("aegis-recibir-resumen-errores", { n: total.errores }));
  }
  $("resumen").replaceChildren(...lineas);
  $("paso-datos").hidden = true;
  $("paso-resumen").hidden = false;
  document.l10n.setAttributes($("titulo"), "aegis-recibir-hecho-titulo");
  document.l10n.setAttributes($("explicacion"), "aegis-recibir-hecho-explicacion");
  recibir.hidden = true;
  cancelar.hidden = true;
  hecho.hidden = false;
  codigo.value = "";
  await ajustarAltura($("titulo"), $("explicacion"), ...lineas);
  hecho.focus();
}

async function enviar(evento) {
  evento.preventDefault();
  if (recibir.disabled || ocupado || terminado) {
    return;
  }
  ocupado = true;
  formulario.setAttribute("aria-busy", "true");
  for (const el of [codigo, elegir, cancelar]) {
    el.disabled = true;
  }
  actualizar();
  decir(errorGeneral, null);
  // Derivar la clave tarda alrededor de un segundo: se dice.
  document.l10n.setAttributes(nota, "aegis-recibir-abriendo");
  try {
    const total = await AegisTransferencia.recibir({ ruta, codigo: codigo.value });
    await mostrarResumen(total);
  } catch (e) {
    if (!ERRORES[e?.codigo]) {
      console.error("Aegis: recibir las contraseñas", e);
    }
    await decir(errorGeneral, ERRORES[e?.codigo] ?? "aegis-recibir-error");
  } finally {
    ocupado = false;
    formulario.removeAttribute("aria-busy");
    for (const el of [codigo, elegir, cancelar]) {
      el.disabled = false;
    }
    if (!terminado) {
      actualizar();
      codigo.focus();
    }
  }
}

async function pulsarBorrar() {
  borrar.disabled = true;
  try {
    await AegisTransferencia.borrarArchivo(ruta);
    decir(estadoBorrar, "aegis-recibir-borrado");
  } catch (e) {
    console.error("Aegis: borrar el paquete de contraseñas", e);
    decir(estadoBorrar, "aegis-recibir-borrar-error");
    borrar.disabled = false;
  }
}

/* ───────── Cerrar ───────── */

function vaciar() {
  codigo.value = "";
}

function cerrar() {
  vaciar();
  window.close();
}

/* ───────── Arranque ───────── */

let enfocado = false;
document.subDialogSetDefaultFocus = () => {
  if (!enfocado) {
    enfocado = true;
    (ruta ? codigo : elegir).focus();
  }
};

ponerArchivo();
formulario.addEventListener("submit", enviar);
elegir.addEventListener("click", pulsarElegir);
codigo.addEventListener("input", () => {
  if (!errorGeneral.hidden) {
    decir(errorGeneral, null);
  }
  codigo.removeAttribute("aria-invalid");
  actualizar();
});
borrar.addEventListener("click", pulsarBorrar);
cancelar.addEventListener("click", cerrar);
hecho.addEventListener("click", cerrar);
document.addEventListener("keydown", evento => {
  if (evento.key == "Escape" && !evento.defaultPrevented) {
    evento.preventDefault();
    if (!ocupado) {
      cerrar();
    }
  }
});
window.addEventListener("pagehide", vaciar);
window.addEventListener("load", async () => {
  await document.l10n.ready;
  ultimoAlto = document.body.scrollHeight;
  if (!document.documentElement.hasAttribute("subdialog")) {
    try {
      window.sizeToContent();
    } catch (e) {}
    document.subDialogSetDefaultFocus();
  }
});
actualizar();
