/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · autorrelleno de códigos de verificación, lado del proceso principal (AegisCodigosChild avisa de que se ha
 * enfocado un campo de código). Aquí se decide, sin fiarse de la página:
 * - solo la página principal (el actor no existe en marcos) y solo un documento https cuyo origen es exactamente el
 *   de la entrada guardada (como las contraseñas: ni otros subdominios ni http);
 * - solo en la pestaña que se está viendo;
 * - ofrecer no descifra nada (no pide la contraseña principal): el origen de cada código está en claro en el índice.
 * El código solo sale al pulsar «Rellenar el código» (autenticador.sys.mjs, ofrecer).
 */

import { AegisAutenticador } from "./autenticador.sys.mjs";

export class AegisCodigosParent extends JSWindowActorParent {
  async receiveMessage(mensaje) {
    const browser = this.browsingContext.top?.embedderElement;
    switch (mensaje.name) {
      case "Aegis:Codigos:Fuera":
        AegisAutenticador.retirar(browser);
        return;
      case "Aegis:Codigos:Teclado":
        AegisAutenticador.enfocarPanel(browser);
        return;
      case "Aegis:Codigos:Campo":
        break;
      default:
        return;
    }
    if (!browser || this.browsingContext.parent) {
      return;
    }
    const principal = this.manager.documentPrincipal;
    if (!principal?.isContentPrincipal || !principal.schemeIs("https")) {
      return;
    }
    const origen = principal.originNoSuffix;
    const entradas = await AegisAutenticador.entradasDe(origen);
    if (!entradas.length || this.manager.isClosed) {
      return;
    }
    const { left, top, width, height } = mensaje.data ?? {};
    if (![left, top, width, height].every(Number.isFinite)) {
      return;
    }
    const actor = this;
    await AegisAutenticador.ofrecer({
      browser,
      rect: { left, top, width, height },
      origen,
      entradas,
      rellenar(codigo) {
        // Si entretanto la pestaña ha cambiado de página, el actor ya no existe y no se manda nada.
        if (!actor.manager?.isClosed && actor.manager.documentPrincipal?.originNoSuffix == origen) {
          actor.sendAsyncMessage("Aegis:Codigos:Rellenar", { codigo });
        }
      },
    });
  }
}
