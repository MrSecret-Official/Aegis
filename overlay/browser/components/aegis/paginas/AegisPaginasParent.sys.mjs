/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · lado del proceso principal del actor AegisPaginas (lo registra AegisArranque.registrarPaginas()). Responde a
 * paginas/logos.sys.mjs: los logos de los accesos de la nueva pestaña (logos.sys.mjs). Solo atiende a about:newtab y
 * about:home cargadas en el proceso de las páginas privilegiadas, nunca a una web. También a about:logins
 * (paginas/contrasenas.sys.mjs): si hay contraseña principal y el diálogo para crearla (../contrasenas.sys.mjs), y el
 * código de verificación de la contraseña elegida (../autenticador/). Y el correo de la nueva pestaña: leer, guardar,
 * quitar y abrir la dirección de la bandeja (../correo.sys.mjs, que la valida).
 */

import { AegisCorreo } from "../correo.sys.mjs";
import { iconosLocales, logo } from "../logos.sys.mjs";

const PAGINAS = ["about:newtab", "about:home"];

export class AegisPaginasParent extends JSWindowActorParent {
  /** ¿Viene de la nueva pestaña de verdad? */
  deLaNuevaPestana() {
    const direccion = this.manager?.documentURI?.spec ?? "";
    const proceso = this.manager?.domProcess?.remoteType;
    return proceso == "privilegedabout" && PAGINAS.some(p => direccion.startsWith(p));
  }

  /** ¿Viene de about:logins de verdad (contraseñas, ../contrasenas.sys.mjs)? */
  deContrasenas() {
    const direccion = this.manager?.documentURI?.spec ?? "";
    const proceso = this.manager?.domProcess?.remoteType;
    return proceso == "privilegedabout" && direccion.startsWith("about:logins");
  }

  /**
   * Código de verificación de la contraseña elegida en about:logins (../autenticador/). A la página solo llega el
   * código (y solo tras verificar la identidad), nunca el secreto.
   *
   * @param {"Estado"|"Ver"|"Siguiente"|"Copiar"|"Gestionar"} accion
   * @param {string} guid
   */
  async codigo(accion, guid) {
    if (typeof guid != "string" || !/^\{[0-9a-f-]{36}\}$/i.test(guid)) {
      return null;
    }
    const { AegisAutenticador } = ChromeUtils.importESModule(
      new URL("../autenticador/autenticador.sys.mjs", import.meta.url).href
    );
    const win = this.browsingContext.topChromeWindow;
    const soloCodigo = r => (r ? { codigo: r.codigo, restante: r.restante } : null);
    try {
      switch (accion) {
        case "Estado":
          return await AegisAutenticador.tiene(guid);
        case "Ver":
          return soloCodigo(await AegisAutenticador.ver(guid, win));
        case "Siguiente":
          return soloCodigo(await AegisAutenticador.siguiente(guid));
        case "Copiar":
          return { copiado: await AegisAutenticador.copiar(guid, win) };
        case "Gestionar":
          await AegisAutenticador.abrirDialogo(win, guid);
          return await AegisAutenticador.tiene(guid);
      }
    } catch (e) {
      if (e?.codigo == "ilegible") {
        return { error: "ilegible" };
      }
      // Cancelar la contraseña principal no es un error que haya que contar.
      if (e?.result != Cr.NS_ERROR_ABORT && e?.result != Cr.NS_ERROR_FAILURE) {
        console.error(`Aegis: código de verificación (${accion})`, e);
      }
    }
    return null;
  }

  async receiveMessage(mensaje) {
    if (mensaje.name.startsWith("Aegis:Contrasenas:")) {
      if (!this.deContrasenas()) {
        return null;
      }
      const { AegisContrasenas } = ChromeUtils.importESModule(new URL("../contrasenas.sys.mjs", import.meta.url).href);
      switch (mensaje.name) {
        case "Aegis:Contrasenas:Estado":
          return AegisContrasenas.estado();
        case "Aegis:Contrasenas:CrearPrincipal":
          return AegisContrasenas.crearPrincipal(this.browsingContext.topChromeWindow);
      }
      if (mensaje.name.startsWith("Aegis:Contrasenas:Codigo:")) {
        return this.codigo(mensaje.name.slice("Aegis:Contrasenas:Codigo:".length), mensaje.data?.guid);
      }
      return null;
    }
    if (!this.deLaNuevaPestana()) {
      return null;
    }
    try {
      switch (mensaje.name) {
        case "Aegis:LogosLocales":
          return await iconosLocales(mensaje.data?.urls);
        case "Aegis:Logo":
          return await logo(mensaje.data?.url, this.browsingContext.topChromeWindow);
        // El correo de la nueva pestaña (../correo.sys.mjs): la dirección se valida y se abre aquí.
        case "Aegis:Correo:Leer":
          return { url: AegisCorreo.leer() };
        case "Aegis:Correo:Guardar":
          return AegisCorreo.guardar(mensaje.data?.url);
        case "Aegis:Correo:Quitar":
          return AegisCorreo.quitar();
        case "Aegis:Correo:Abrir":
          return AegisCorreo.abrir(this.browsingContext, mensaje.data);
      }
    } catch (e) {
      console.error(`Aegis: ${mensaje.name}`, e);
      return mensaje.name == "Aegis:Logo" ? { error: "imagen" } : {};
    }
    return null;
  }
}
