/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · autorrelleno de códigos de verificación, lado de la página (lo registra autenticador.sys.mjs solo mientras
 * haya códigos guardados, y solo en páginas https y en la página principal, nunca en marcos).
 *
 * Al enfocar un campo de código de verificación, avisa al proceso principal con su posición en la pantalla; nada más.
 * La página no recibe nada hasta que el usuario pulsa «Rellenar el código» en el panelito: entonces el proceso
 * principal manda el código (seis u ocho cifras, nunca el secreto) y se escribe como si lo tecleara el usuario
 * (setUserInput, con sus eventos), solo si el campo sigue en la página.
 */

/** Pistas de un campo de código en los atributos (inglés y los idiomas de Aegis). */
const PISTAS =
  /(^|[^a-z])(otp|totp|2fa|mfa|one[-_ ]?time|verification[-_ ]?code|security[-_ ]?code|auth(entication|enticator)?[-_ ]?code|two[-_ ]?factor|2[-_ ]?step|c[oó]digo|codice|code|token)([^a-z]|$)/i;

/**
 * ¿Es un campo para el código de verificación? autocomplete="one-time-code" (el estándar) o, si no, un campo de texto
 * corto (6–8 caracteres o numérico) con alguna pista en su nombre, id, etiqueta o texto de ejemplo. No los de un
 * carácter por casilla.
 *
 * @param {Element} el
 */
function esCampoDeCodigo(el) {
  if (el?.localName != "input" || el.disabled || el.readOnly) {
    return false;
  }
  const tipo = el.type;
  if (!["text", "tel", "number", ""].includes(tipo)) {
    return false;
  }
  const autocompletar = (el.getAttribute("autocomplete") ?? "").toLowerCase();
  if (autocompletar.split(/\s+/).includes("one-time-code")) {
    return true;
  }
  const largo = el.maxLength;
  if (largo == 1 || (largo > 0 && (largo < 6 || largo > 10))) {
    return false;
  }
  const corto = (largo >= 6 && largo <= 10) || el.inputMode == "numeric" || tipo == "tel" || tipo == "number";
  if (!corto) {
    return false;
  }
  const pistas = [el.name, el.id, autocompletar, el.getAttribute("aria-label"), el.placeholder].join(" ");
  return PISTAS.test(pistas);
}

export class AegisCodigosChild extends JSWindowActorChild {
  /** @type {WeakRef<Element>|null} */
  campo = null;

  handleEvent(evento) {
    if (evento.type == "pagehide") {
      this.campo = null;
      this.sendAsyncMessage("Aegis:Codigos:Fuera");
      return;
    }
    if (!evento.isTrusted) {
      return;
    }
    if (evento.type == "keydown") {
      // Flecha abajo en el campo: al panelito, como en el desplegable de las contraseñas.
      if (evento.key == "ArrowDown" && this.campo?.deref() == evento.target) {
        this.sendAsyncMessage("Aegis:Codigos:Teclado");
      }
      return;
    }
    if (evento.type != "focusin") {
      return;
    }
    const el = evento.composedTarget ?? evento.target;
    if (!esCampoDeCodigo(el)) {
      return;
    }
    if (this.campo?.deref() != el) {
      el.addEventListener("keydown", this, { mozSystemGroup: true });
    }
    this.campo = new WeakRef(el);
    const r = el.getBoundingClientRect();
    const pantalla = this.contentWindow.windowUtils.toScreenRectInCSSUnits(r.left, r.top, r.width, r.height);
    this.sendAsyncMessage("Aegis:Codigos:Campo", {
      left: pantalla.left,
      top: pantalla.top,
      width: pantalla.width,
      height: pantalla.height,
    });
  }

  receiveMessage(mensaje) {
    if (mensaje.name != "Aegis:Codigos:Rellenar") {
      return;
    }
    const el = this.campo?.deref();
    const codigo = String(mensaje.data?.codigo ?? "");
    if (!el || !el.isConnected || el.ownerDocument != this.document || !/^\d{6,8}$/.test(codigo)) {
      return;
    }
    el.focus();
    el.setUserInput(codigo);
  }
}
