/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · diálogo «Pasar a otro Aegis» (transferencia-pasar.xhtml). Lo abre AegisTransferencia.abrirPasar con
 * gDialogBox desde Ajustes.
 *
 * 1. Dice cuántas contraseñas (y códigos de verificación) hay, sin descifrar nada, y avisa de qué supone el archivo.
 * 2. «Crear el archivo…»: verifica la identidad (Windows Hello o la contraseña principal), el usuario elige dónde
 *    guardarlo en el selector nativo y transferencia.sys.mjs descifra, cifra con un código nuevo y escribe.
 * 3. Enseña el código una sola vez: seis palabras numeradas y «Copiar» (portapapeles sensible, se borra a los 60 s si
 *    sigue ahí). El código no se guarda en ningún sitio: al cerrar el diálogo, desaparece de él.
 *
 * Esc cierra en el paso 1; en el paso 2 no (perder el código obliga a crear otro paquete): se cierra con «Hecho».
 */

const { AegisTransferencia } = ChromeUtils.importESModule(
  "resource:///modules/aegis/contrasenas/transferencia/transferencia.sys.mjs"
);

const HTML = "http://www.w3.org/1999/xhtml";
const $ = id => document.getElementById(id);

const formulario = $("formulario");
const resumen = $("resumen");
const filaCodigos = $("fila-codigos");
const incluirCodigos = $("incluir-codigos");
const avisoCodigos = $("aviso-codigos");
const crear = $("crear");
const cancelar = $("cancelar");
const hecho = $("hecho");
const copiar = $("copiar");
const estadoCopia = $("estado-copia");
const errorGeneral = $("error-general");
const lista = $("palabras");

let ocupado = false;
let hayContrasenas = false;
/** Las palabras mientras se enseñan (para «Copiar»); se vacían al cerrar. */
let palabras = [];
let enCodigo = false;

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
    console.error("Aegis: altura del diálogo de pasar contraseñas", e);
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

/* ───────── Paso 1 ───────── */

async function preparar() {
  const { contrasenas, codigos } = await AegisTransferencia.resumenParaPasar();
  hayContrasenas = contrasenas > 0;
  document.l10n.setAttributes(resumen, hayContrasenas ? "aegis-pasar-resumen" : "aegis-pasar-vacio", { contrasenas });
  if (codigos > 0 && hayContrasenas) {
    filaCodigos.hidden = false;
    avisoCodigos.hidden = false;
    document.l10n.setAttributes($("incluir-codigos-texto"), "aegis-pasar-incluir-codigos", { codigos });
  }
  actualizar();
}

function actualizar() {
  crear.disabled = ocupado || !hayContrasenas;
  avisoCodigos.hidden = filaCodigos.hidden || !incluirCodigos.checked;
}

const ERRORES = {
  autenticacion: "aegis-pasar-error-autenticacion",
  vacio: "aegis-pasar-vacio",
  escribir: "aegis-pasar-error-escribir",
};

async function enviar(evento) {
  evento.preventDefault();
  if (crear.disabled || ocupado || enCodigo) {
    return;
  }
  ocupado = true;
  formulario.setAttribute("aria-busy", "true");
  cancelar.disabled = true;
  actualizar();
  decir(errorGeneral, null);
  try {
    if (!(await AegisTransferencia.verificarIdentidad(window))) {
      await decir(errorGeneral, ERRORES.autenticacion);
      return;
    }
    const ruta = await AegisTransferencia.elegirArchivo(window, "guardar");
    if (!ruta) {
      return;
    }
    const hechoAhora = await AegisTransferencia.pasar({ ruta, incluirCodigos: !filaCodigos.hidden && incluirCodigos.checked });
    await mostrarCodigo(hechoAhora, PathUtils.filename(ruta));
  } catch (e) {
    if (!ERRORES[e?.codigo]) {
      console.error("Aegis: pasar las contraseñas", e);
    }
    await decir(errorGeneral, ERRORES[e?.codigo] ?? "aegis-pasar-error");
  } finally {
    ocupado = false;
    formulario.removeAttribute("aria-busy");
    cancelar.disabled = false;
    actualizar();
  }
}

/* ───────── Paso 2: el código ───────── */

async function mostrarCodigo({ palabras: nuevas, contrasenas, codigos }, archivo) {
  enCodigo = true;
  palabras = nuevas;
  lista.replaceChildren(
    ...nuevas.map((palabra, i) => {
      const li = document.createElementNS(HTML, "li");
      const numero = document.createElementNS(HTML, "span");
      numero.className = "numero";
      numero.textContent = String(i + 1);
      const texto = document.createElementNS(HTML, "span");
      texto.className = "palabra";
      texto.textContent = palabra;
      li.append(numero, texto);
      return li;
    })
  );
  $("paso-preparar").hidden = true;
  $("paso-codigo").hidden = false;
  document.l10n.setAttributes($("titulo"), "aegis-pasar-codigo-titulo");
  document.l10n.setAttributes($("explicacion"), "aegis-pasar-codigo-explicacion");
  document.l10n.setAttributes($("guardado"), codigos ? "aegis-pasar-guardado-codigos" : "aegis-pasar-guardado", {
    contrasenas,
    codigos,
    archivo,
  });
  crear.hidden = true;
  cancelar.hidden = true;
  hecho.hidden = false;
  await ajustarAltura($("titulo"), $("explicacion"), $("guardado"));
  hecho.focus();
}

function pulsarCopiar() {
  if (!palabras.length) {
    return;
  }
  try {
    const segundos = AegisTransferencia.copiarCodigo(palabras);
    decir(estadoCopia, segundos ? "aegis-pasar-copiado" : "aegis-pasar-copiado-sin-borrar", { segundos });
  } catch (e) {
    console.error("Aegis: copiar el código de transferencia", e);
    decir(estadoCopia, "aegis-pasar-copiar-error");
  }
}

/* ───────── Cerrar ───────── */

function vaciar() {
  palabras = [];
  lista.replaceChildren();
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
    (crear.disabled ? cancelar : crear).focus();
  }
};

formulario.addEventListener("submit", enviar);
cancelar.addEventListener("click", cerrar);
hecho.addEventListener("click", cerrar);
copiar.addEventListener("click", pulsarCopiar);
incluirCodigos.addEventListener("change", () => {
  actualizar();
  ajustarAltura();
});
document.addEventListener("keydown", evento => {
  if (evento.key == "Escape" && !evento.defaultPrevented) {
    evento.preventDefault();
    if (!ocupado && !enCodigo) {
      cerrar();
    }
  }
});
window.addEventListener("pagehide", vaciar);
// SubDialog espera a esta promesa antes de medir el diálogo: el resumen ya está puesto.
document.mozSubdialogReady = preparar().catch(e => console.error("Aegis: diálogo de pasar contraseñas", e));
window.addEventListener("load", async () => {
  await document.mozSubdialogReady;
  await document.l10n.ready;
  ultimoAlto = document.body.scrollHeight;
  if (!document.documentElement.hasAttribute("subdialog")) {
    try {
      window.sizeToContent();
    } catch (e) {}
    document.subDialogSetDefaultFocus();
  }
});
