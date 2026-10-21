/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · diálogo de la contraseña principal (contrasena-principal.xhtml, en lugar del changemp.xhtml de Firefox).
 *
 * El mismo contrato que changemp.xhtml en Firefox 158, para que valga para todos los que lo abren:
 * - Ajustes (passwords-autofill.mjs): gSubDialog.open(url, {closingCallback}) sin argumentos; al cerrarse, Ajustes
 *   avisa de «passwordmgr-primary-pw-changed» y vuelve a mirar si hay contraseña principal;
 * - about:logins y el aviso de guardar de Firefox (AboutLoginsParent, LoginManagerPrompter): openDialog modal sin
 *   argumentos, y después miran LoginHelper.isPrimaryPasswordSet();
 * - contrasenas.sys.mjs: gDialogBox.open(url, bolsa) con «aegis-motivo» = «guardar» (antes de guardar la primera
 *   contraseña, solo con aegis.contrasenas.principal_obligatoria: los botones dicen «No guardar» y «Crear y
 *   guardar»), «accion» (antes de pasar o recibir de otro Aegis o de añadir un código de verificación, que la exigen
 *   siempre: explica por qué) o «crear». Al terminar, pone «aegis-creada».
 * Cerrar sin crear (botón, Esc o la cruz) no cambia nada: quien lo abrió ve que sigue sin contraseña principal.
 *
 * Dos modos, según el token: crear (sin contraseña principal) o cambiar (pide la actual). Las dos cosas las hace
 * token.changePassword(actual, nueva), como changemp.js de Firefox 158: sin contraseña, con «actual» vacía la pone;
 * con contraseña, comprueba la actual (si no es, falla con SEC_ERROR_BAD_PASSWORD) y la cambia. En Firefox 158
 * nsIPKCS11Token ya no tiene checkPassword, needsUserInit ni initPassword.
 *
 * Seguridad (docs/PRIVACIDAD.md, «Contraseñas»):
 * - fortaleza mínima obligatoria (fortaleza.mjs, en el equipo y sin red: la CSP de la página no deja conectar);
 * - antes de crearla o cambiarla, contrasenas.sys.mjs asegura las 600 000 iteraciones del KDF; si no se puede, no se
 *   crea (nunca una contraseña con la KDF floja de serie sin que se sepa);
 * - los campos no guardan nada (autocomplete off, sin corrector) y se vacían al cerrar.
 */

import { evaluar } from "chrome://browser/content/aegis/contrasena-principal-fortaleza.mjs";

const $ = id => document.getElementById(id);

// Sin el ojo propio del motor en los campos de contraseña (solo se oculta con una hoja de agente; ver la hoja).
try {
  window.windowUtils.loadSheetUsingURIString(
    "chrome://browser/content/aegis/dialogo-agente.css",
    window.windowUtils.AGENT_SHEET
  );
} catch (e) {
  console.error("Aegis: hoja de agente de los diálogos", e);
}

const token = Cc["@mozilla.org/security/internalkeytoken;1"].createInstance(Ci.nsIPKCS11Token);
/** Modo cambiar: ya hay contraseña principal. Se decide al abrir. */
const cambiar = token.hasPassword;

/** Argumentos de contrasenas.sys.mjs (gDialogBox); los demás no pasan ninguno. */
const bolsa = (() => {
  try {
    return window.arguments?.[0]?.QueryInterface(Ci.nsIWritablePropertyBag2) ?? null;
  } catch (e) {
    return null;
  }
})();

function motivo() {
  try {
    return bolsa?.getPropertyAsAString("aegis-motivo") ?? "";
  } catch (e) {
    return "";
  }
}

const formulario = $("formulario");
const actual = $("actual");
const nueva = $("nueva");
const repetir = $("repetir");
const aceptar = $("aceptar");
const cancelar = $("cancelar");
const medidor = $("medidor");
const nota = $("nota-fortaleza");
const errorActual = $("error-actual");
const errorRepetir = $("error-repetir");
const errorGeneral = $("error-general");

let ocupado = false;
/** El usuario ya ha salido del campo «Repítela»: desde entonces se avisa en cuanto no coincidan. */
let repetirTocado = false;

/* ───────── Textos según el modo ───────── */

function prepararTextos() {
  const l10n = document.l10n;
  if (cambiar) {
    $("bloque-actual").hidden = false;
    l10n.setAttributes($("titulo"), "aegis-principal-titulo-cambiar");
    l10n.setAttributes($("explicacion"), "aegis-principal-explicacion-cambiar");
    l10n.setAttributes($("etiqueta-nueva"), "aegis-principal-nueva-cambiar");
    l10n.setAttributes(cancelar, "aegis-principal-cancelar");
    l10n.setAttributes(aceptar, "aegis-principal-cambiar");
    return;
  }
  if (motivo() == "guardar") {
    l10n.setAttributes($("explicacion"), "aegis-principal-explicacion-guardar");
    // Los botones de serie del HTML ya son «No guardar» y «Crear y guardar».
  } else {
    if (motivo() == "accion") {
      l10n.setAttributes($("explicacion"), "aegis-principal-explicacion-accion");
    }
    l10n.setAttributes(cancelar, "aegis-principal-cancelar");
    l10n.setAttributes(aceptar, "aegis-principal-crear");
  }
  // Como changemp: si una política exige la contraseña principal, se dice.
  if (!Services.policies.isAllowed("removeMasterPassword")) {
    $("politica").hidden = false;
  }
}

/* ───────── Altura ───────── */

let ultimoAlto = 0;
/**
 * Si cambia la altura (aparece un error o un texto pasa a dos líneas), el marco se ajusta: SubDialog con
 * resizeDialog() (lo define en la ventana del diálogo), una ventana propia con sizeToContent().
 */
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
    console.error("Aegis: altura del diálogo de la contraseña principal", e);
  }
}

/* ───────── Validación ───────── */

/** Texto de la nota bajo la contraseña: lo que falta o el nivel. */
const NOTAS = {
  corta: "aegis-principal-corta",
  comun: "aegis-principal-comun",
  secuencia: "aegis-principal-secuencia",
  repetida: "aegis-principal-repetida",
  variedad: "aegis-principal-variedad",
};
const NIVELES = { 2: "aegis-principal-aceptable", 3: "aegis-principal-fuerte", 4: "aegis-principal-muy-fuerte" };

function mismoTexto(el, id, args) {
  const actualId = document.l10n.getAttributes(el);
  return actualId.id == id && JSON.stringify(actualId.args ?? {}) == JSON.stringify(args ?? {});
}

function actualizar() {
  const f = evaluar(nueva.value);
  medidor.dataset.nivel = String(f.nivel);

  let id = "aegis-principal-requisito";
  let args;
  if (f.nivel == 1) {
    id = NOTAS[f.motivo] ?? id;
    args = f.motivo == "corta" ? { faltan: f.faltan } : undefined;
  } else if (f.nivel >= 2) {
    id = NIVELES[f.nivel];
  }
  const cambiaNota = !mismoTexto(nota, id, args);
  if (cambiaNota) {
    document.l10n.setAttributes(nota, id, args);
  }

  const coinciden = repetir.value == nueva.value;
  // Avisar de que no coinciden solo cuando tiene sentido: al salir del campo o cuando ya hay tanto como en la primera.
  const avisar =
    !!repetir.value && !coinciden && (repetirTocado || [...repetir.value].length >= [...nueva.value].length);
  const cambiaError = errorRepetir.hidden == avisar;
  errorRepetir.hidden = !avisar;
  repetir.toggleAttribute("aria-invalid", avisar);

  aceptar.disabled = ocupado || !f.valida || !coinciden || (cambiar && !actual.value);

  if (cambiaNota || cambiaError) {
    ajustarAltura(nota);
  }
}

/* ───────── Mostrar y ocultar ───────── */

function prepararVer() {
  for (const boton of document.querySelectorAll("button.ver")) {
    boton.addEventListener("click", () => {
      const campo = $(boton.getAttribute("aria-controls"));
      const ver = campo.type == "password";
      campo.type = ver ? "text" : "password";
      boton.setAttribute("aria-pressed", String(ver));
      campo.focus();
    });
  }
}

/* ───────── Crear o cambiar ───────── */

function vaciar() {
  for (const campo of [actual, nueva, repetir]) {
    campo.value = "";
    campo.type = "password";
  }
}

function cerrar() {
  vaciar();
  window.close();
}

/** ¿Es el error de NSS «contraseña incorrecta» (SEC_ERROR_BAD_PASSWORD)? Como changemp.js. */
function esContrasenaIncorrecta(e) {
  const nss = Cc["@mozilla.org/nss_errors_service;1"].getService(Ci.nsINSSErrorsService);
  return e?.result == nss.getXPCOMFromNSSError(Ci.nsINSSErrorsService.NSS_SEC_ERROR_BASE + 15);
}

async function enviar(evento) {
  evento.preventDefault();
  if (aceptar.disabled || ocupado) {
    return;
  }
  ocupado = true;
  formulario.setAttribute("aria-busy", "true");
  aceptar.disabled = true;
  cancelar.disabled = true;
  errorGeneral.hidden = true;
  errorActual.hidden = true;
  actual.removeAttribute("aria-invalid");

  let hecho = false;
  try {
    // Las 600 000 iteraciones del KDF: NSS las lee de una variable de entorno al poner o cambiar la contraseña.
    const { AegisContrasenas } = ChromeUtils.importESModule("resource:///modules/aegis/contrasenas.sys.mjs");
    AegisContrasenas.reforzarKdf();
    await token.changePassword(cambiar ? actual.value : "", nueva.value);
    hecho = true;
  } catch (e) {
    if (cambiar && esContrasenaIncorrecta(e)) {
      errorActual.hidden = false;
      actual.setAttribute("aria-invalid", "true");
      actual.value = "";
      actual.focus();
      ajustarAltura(errorActual);
    } else {
      console.error("Aegis: no se pudo poner la contraseña principal", e);
      errorGeneral.hidden = false;
      ajustarAltura(errorGeneral);
    }
  }

  if (hecho) {
    try {
      bolsa?.setPropertyAsBool("aegis-creada", true);
    } catch (e) {}
    // Lo mismo que avisa Ajustes al cerrar el diálogo: about:preferences, el panel y el bloqueo por inactividad
    // (contrasenas.sys.mjs) lo escuchan. Ajustes lo vuelve a avisar al cerrarse; repetirlo no cambia nada.
    Services.obs.notifyObservers(null, "passwordmgr-primary-pw-changed");
    cerrar();
    return;
  }
  ocupado = false;
  formulario.removeAttribute("aria-busy");
  cancelar.disabled = false;
  actualizar();
}

/* ───────── Arranque ───────── */

function primerCampo() {
  return cambiar ? actual : nueva;
}

let enfocado = false;
/**
 * SubDialog llama a esto al abrirse (y otra vez cada vez que se ajusta la altura): el foco va al primer campo solo
 * la primera vez, para no quitárselo al campo en el que se está escribiendo.
 */
document.subDialogSetDefaultFocus = () => {
  if (!enfocado) {
    enfocado = true;
    primerCampo().focus();
  }
};

prepararTextos();
prepararVer();
for (const campo of [actual, nueva, repetir]) {
  campo.addEventListener("input", actualizar);
}
repetir.addEventListener("blur", () => {
  repetirTocado = true;
  actualizar();
});
actual.addEventListener("input", () => {
  if (!errorActual.hidden) {
    errorActual.hidden = true;
    actual.removeAttribute("aria-invalid");
    ajustarAltura();
  }
});
formulario.addEventListener("submit", enviar);
cancelar.addEventListener("click", cerrar);
// Esc = «No guardar» / «Cancelar», también en la ventana propia (openDialog). Con preventDefault, SubDialog no cierra
// por su cuenta; mientras NSS está poniendo la contraseña, Esc no hace nada.
document.addEventListener("keydown", evento => {
  if (evento.key == "Escape" && !evento.defaultPrevented) {
    evento.preventDefault();
    if (!ocupado) {
      cerrar();
    }
  }
});
// Al cerrar por cualquier camino (la cruz de Ajustes, Esc en SubDialog), los campos se vacían.
window.addEventListener("pagehide", vaciar);
window.addEventListener("load", async () => {
  await document.l10n.ready;
  ultimoAlto = document.body.scrollHeight;
  if (!document.documentElement.hasAttribute("subdialog")) {
    // Ventana propia (openDialog): a la medida del contenido, y el foco en el primer campo.
    try {
      window.sizeToContent();
    } catch (e) {}
    document.subDialogSetDefaultFocus();
  }
});
actualizar();
