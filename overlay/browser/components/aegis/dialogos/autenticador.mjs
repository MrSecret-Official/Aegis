/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · diálogo de los códigos de verificación (autenticador.xhtml). Lo abre AegisAutenticador.abrirDialogo con
 * gDialogBox y una bolsa de argumentos con «aegis-guid» (el inicio de sesión; vacío, para elegirlo aquí).
 *
 * - La clave se escribe o pega (oculta, con el ojo para verla) o se lee de un código QR: de la página que se está
 *   viendo (WindowGlobalParent.drawSnapshot de la parte visible) o de una imagen elegida. La imagen se decodifica aquí,
 *   en memoria, con jsQR (window.jsQR, de jsqr/jsQR.js): nada se guarda ni sale del equipo, y la CSP no deja conectar.
 * - Al guardar, autenticador.sys.mjs la cifra con la clave de las contraseñas. Los campos se vacían al cerrar.
 * - Quitar pide confirmarlo en el propio diálogo (dos pulsaciones), sin otro diálogo encima.
 */

const { AegisAutenticador } = ChromeUtils.importESModule("resource:///modules/aegis/autenticador/autenticador.sys.mjs");
const { BrowserWindowTracker } = ChromeUtils.importESModule("resource:///modules/BrowserWindowTracker.sys.mjs");

const HTML = "http://www.w3.org/1999/xhtml";
/** Lado mayor con el que se busca el QR: más no lo encuentra mejor y cuesta más. */
const LADO_MAXIMO = 2048;
/** Imágenes de más de esto, fuera (una captura de pantalla pesa mucho menos). */
const BYTES_MAXIMOS = 20 * 1024 * 1024;

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
const formulario = $("formulario");
const cuenta = $("cuenta");
const notaCuenta = $("nota-cuenta");
const clave = $("clave");
const estado = $("estado");
const guardar = $("guardar");
const cancelar = $("cancelar");
const quitar = $("quitar");
const errorGeneral = $("error-general");

const bolsa = (() => {
  try {
    return window.arguments?.[0]?.QueryInterface(Ci.nsIWritablePropertyBag2) ?? null;
  } catch (e) {
    return null;
  }
})();
const guidPedido = (() => {
  try {
    return bolsa?.getPropertyAsAString("aegis-guid") ?? "";
  } catch (e) {
    return "";
  }
})();

let valida = false;
let ocupado = false;
let confirmandoQuitar = false;
/** guid → tiene código. */
let conCodigo = new Set();

/** La ventana del navegador: la que tiene el diálogo encima (gDialogBox) o, en ventana propia, la de arriba. */
function ventanaNavegador() {
  const arriba = window.browsingContext.topChromeWindow;
  return arriba?.gBrowser ? arriba : BrowserWindowTracker.getTopWindow({ allowFromInactiveWorkspace: true });
}

/* ───────── Altura (como el de la contraseña principal) ───────── */

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
    console.error("Aegis: altura del diálogo de los códigos", e);
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
  ajustarAltura(el);
}

/* ───────── Cuentas ───────── */

function host(origen) {
  try {
    return new URL(origen).host;
  } catch (e) {
    return origen;
  }
}

async function cargarCuentas() {
  let logins = [];
  try {
    // Con la bóveda cerrada, NSS pide aquí la contraseña principal (hace falta para ver los usuarios).
    logins = await Services.logins.getAllLogins();
  } catch (e) {
    console.error("Aegis: cuentas del autenticador", e);
  }
  conCodigo = new Set((await AegisAutenticador.entradas()).map(e => e.guid));
  const filas = logins
    .map(l => ({ guid: l.QueryInterface(Ci.nsILoginMetaInfo).guid, origen: l.origin, usuario: l.username }))
    .sort((a, b) => host(a.origen).localeCompare(host(b.origen)) || a.usuario.localeCompare(b.usuario));

  cuenta.replaceChildren();
  if (!filas.length) {
    cuenta.disabled = true;
    decir(notaCuenta, "aegis-autenticador-sin-cuentas");
    return;
  }
  const vacia = document.createElementNS(HTML, "option");
  vacia.value = "";
  document.l10n.setAttributes(vacia, "aegis-autenticador-elige");
  cuenta.append(vacia);
  for (const f of filas) {
    const opcion = document.createElementNS(HTML, "option");
    opcion.value = f.guid;
    opcion.textContent = f.usuario ? `${host(f.origen)} — ${f.usuario}` : host(f.origen);
    cuenta.append(opcion);
  }

  if (guidPedido && filas.some(f => f.guid == guidPedido)) {
    cuenta.value = guidPedido;
    // Desde una cuenta concreta (about:logins, el panel): esa y no otra.
    cuenta.disabled = true;
  } else {
    // Sin cuenta: si la pestaña es de un sitio con una sola cuenta guardada, esa.
    const origen = ventanaNavegador()?.gBrowser?.selectedBrowser?.currentURI?.prePath;
    const delSitio = filas.filter(f => f.origen == origen);
    if (delSitio.length == 1) {
      cuenta.value = delSitio[0].guid;
    }
  }
  cambiarCuenta();
}

function cambiarCuenta() {
  confirmandoQuitar = false;
  guardar.hidden = false;
  document.l10n.setAttributes(quitar, "aegis-autenticador-quitar");
  const tiene = conCodigo.has(cuenta.value);
  quitar.hidden = !tiene;
  document.l10n.setAttributes($("titulo"), tiene ? "aegis-autenticador-titulo-editar" : "aegis-autenticador-titulo");
  decir(notaCuenta, tiene ? "aegis-autenticador-existe" : null);
  actualizar();
}

/* ───────── Clave ───────── */

const ERRORES = {
  formato: "aegis-autenticador-error-formato",
  hotp: "aegis-autenticador-error-hotp",
  corta: "aegis-autenticador-error-corta",
  parametros: "aegis-autenticador-error-parametros",
};

function comprobarClave() {
  const valor = clave.value.trim();
  valida = false;
  if (!valor) {
    decir(estado, null);
    clave.removeAttribute("aria-invalid");
    return;
  }
  try {
    const totp = AegisAutenticador.leer(valor);
    valida = true;
    clave.removeAttribute("aria-invalid");
    const args = { digitos: totp.digitos, periodo: totp.periodo, emisor: totp.emisor };
    decir(estado, totp.emisor ? "aegis-autenticador-valida" : "aegis-autenticador-valida-sin-emisor", args);
    estado.classList.remove("error");
  } catch (e) {
    clave.setAttribute("aria-invalid", "true");
    decir(estado, ERRORES[e?.codigo] ?? ERRORES.formato);
    estado.classList.add("error");
  }
}

function actualizar() {
  guardar.disabled = ocupado || !valida || !cuenta.value;
}

/* ───────── Códigos QR ───────── */

/**
 * Busca un QR en una imagen (en memoria) y devuelve su texto, o null.
 *
 * @param {ImageBitmap} imagen
 */
function leerQR(imagen) {
  const f = Math.min(1, LADO_MAXIMO / Math.max(imagen.width, imagen.height));
  const ancho = Math.max(1, Math.round(imagen.width * f));
  const alto = Math.max(1, Math.round(imagen.height * f));
  const lienzo = document.createElementNS(HTML, "canvas");
  lienzo.width = ancho;
  lienzo.height = alto;
  try {
    const ctx = lienzo.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(imagen, 0, 0, ancho, alto);
    const pixeles = ctx.getImageData(0, 0, ancho, alto);
    const resultado = window.jsQR(pixeles.data, ancho, alto, { inversionAttempts: "attemptBoth" });
    return resultado?.data ?? null;
  } finally {
    // Nada de la imagen se queda: el lienzo a cero.
    lienzo.width = 0;
    lienzo.height = 0;
  }
}

function usarQR(texto) {
  if (!texto) {
    decir(estado, "aegis-autenticador-qr-no");
    estado.classList.add("error");
    return;
  }
  if (!/^otpauth:\/\/totp\//i.test(texto) && !/^otpauth:\/\/hotp\//i.test(texto)) {
    decir(estado, "aegis-autenticador-qr-otro");
    estado.classList.add("error");
    return;
  }
  clave.value = texto;
  comprobarClave();
  actualizar();
}

async function conBotonesQR(tarea) {
  const botones = [$("qr-pagina"), $("qr-imagen")];
  botones.forEach(b => (b.disabled = true));
  try {
    await tarea();
  } catch (e) {
    console.error("Aegis: leer el código QR", e);
    usarQR(null);
  } finally {
    botones.forEach(b => (b.disabled = false));
  }
}

/** La parte visible de la pestaña, tal como se ve (sin guardarla). */
function qrDeLaPagina() {
  return conBotonesQR(async () => {
    const win = ventanaNavegador();
    const global = win?.gBrowser?.selectedBrowser?.browsingContext?.currentWindowGlobal;
    if (!global) {
      usarQR(null);
      return;
    }
    const escala = Math.min(2, win.devicePixelRatio || 1);
    const imagen = await global.drawSnapshot(null, escala, "rgb(255,255,255)");
    try {
      usarQR(leerQR(imagen));
    } finally {
      imagen.close();
    }
  });
}

function qrDeUnaImagen() {
  return conBotonesQR(async () => {
    const selector = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
    const [titulo] = await document.l10n.formatValues([{ id: "aegis-autenticador-qr-imagen-titulo" }]);
    selector.init(window.browsingContext, titulo, Ci.nsIFilePicker.modeOpen);
    selector.appendFilters(Ci.nsIFilePicker.filterImages);
    const respuesta = await new Promise(resolver => selector.open(resolver));
    if (respuesta != Ci.nsIFilePicker.returnOK || !selector.file) {
      return;
    }
    const archivo = await File.createFromNsIFile(selector.file);
    if (archivo.size > BYTES_MAXIMOS) {
      usarQR(null);
      return;
    }
    const imagen = await createImageBitmap(archivo);
    try {
      usarQR(leerQR(imagen));
    } finally {
      imagen.close();
    }
  });
}

/* ───────── Guardar, quitar, cerrar ───────── */

function vaciar() {
  clave.value = "";
  clave.type = "password";
}

function cerrar() {
  vaciar();
  window.close();
}

async function enviar(evento) {
  evento.preventDefault();
  if (guardar.disabled || ocupado) {
    return;
  }
  ocupado = true;
  actualizar();
  errorGeneral.hidden = true;
  try {
    await AegisAutenticador.guardar(cuenta.value, clave.value.trim());
    cerrar();
    return;
  } catch (e) {
    // Sin contraseña principal no se cambia la clave de un código (autenticador.sys.mjs): se dice cómo crearla.
    const sinPrincipal = e?.codigo == "sin-principal";
    if (!sinPrincipal) {
      console.error("Aegis: guardar el código de verificación", e);
    }
    document.l10n.setAttributes(
      errorGeneral,
      sinPrincipal ? "aegis-autenticador-error-sin-principal" : "aegis-autenticador-error-guardar"
    );
    errorGeneral.hidden = false;
    ajustarAltura(errorGeneral);
  }
  ocupado = false;
  actualizar();
}

async function pulsarQuitar() {
  if (!confirmandoQuitar) {
    // Primera pulsación: lo que pasa, y el botón pide una segunda.
    confirmandoQuitar = true;
    // Mientras se confirma, «Guardar» no pinta nada (y así el pie cabe en una fila).
    guardar.hidden = true;
    document.l10n.setAttributes(quitar, "aegis-autenticador-quitar-confirmar");
    decir(notaCuenta, "aegis-autenticador-quitar-aviso");
    return;
  }
  ocupado = true;
  quitar.disabled = true;
  try {
    await AegisAutenticador.quitar(cuenta.value);
    cerrar();
  } catch (e) {
    console.error("Aegis: quitar el código de verificación", e);
    errorGeneral.hidden = false;
    quitar.disabled = false;
    ocupado = false;
  }
}

/* ───────── Arranque ───────── */

let enfocado = false;
document.subDialogSetDefaultFocus = () => {
  if (!enfocado) {
    enfocado = true;
    (cuenta.disabled ? clave : cuenta).focus();
  }
};

for (const boton of document.querySelectorAll("button.ver")) {
  boton.addEventListener("click", () => {
    const campo = $(boton.getAttribute("aria-controls"));
    const ver = campo.type == "password";
    campo.type = ver ? "text" : "password";
    boton.setAttribute("aria-pressed", String(ver));
    campo.focus();
  });
}
cuenta.addEventListener("change", cambiarCuenta);
clave.addEventListener("input", () => {
  comprobarClave();
  actualizar();
});
$("qr-pagina").addEventListener("click", qrDeLaPagina);
$("qr-imagen").addEventListener("click", qrDeUnaImagen);
quitar.addEventListener("click", pulsarQuitar);
cancelar.addEventListener("click", cerrar);
formulario.addEventListener("submit", enviar);
document.addEventListener("keydown", evento => {
  if (evento.key == "Escape" && !evento.defaultPrevented) {
    evento.preventDefault();
    if (!ocupado) {
      cerrar();
    }
  }
});
window.addEventListener("pagehide", vaciar);
// SubDialog espera a esta promesa antes de medir el diálogo: las cuentas ya están en el desplegable.
document.mozSubdialogReady = cargarCuentas().catch(e => console.error("Aegis: diálogo de los códigos", e));
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
