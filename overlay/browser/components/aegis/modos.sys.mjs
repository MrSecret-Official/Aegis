/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · modos de uso (docs/PLAN.md, «Dos modos»). Se apoyan en funciones nativas de Firefox, así que cambiar de
 * modo no pierde pestañas, marcadores ni sesión:
 * - Estándar: pestañas arriba.
 * - Workflow: pestañas verticales en la barra lateral (después: espacios, esenciales, compacto, Glance).
 *
 * La verdad la tiene Firefox (sidebar.verticalTabs): si el usuario cambia la orientación en «Personalizar la barra
 * lateral», el modo la sigue (aegis.modo se actualiza) y se guarda como cualquier otra pref. El modo solo escribe
 * sidebar.verticalTabs cuando el usuario elige un modo (botón de la barra, bienvenida o about:config), nunca al
 * arrancar: hacerlo al arrancar pisaba la elección del usuario y, si llegaba después de que la ventana montara la
 * barra lateral, la dejaba a medias (barra visible sin pestañas). sidebar.visibility tampoco se toca: Firefox la
 * normaliza al cambiar la orientación (SidebarManager), y «hide-sidebar» solo vale con pestañas verticales.
 */

export const PREF_MODO = "aegis.modo";
const PREF_VERTICAL = "sidebar.verticalTabs";
const VERTICAL = { estandar: false, workflow: true };

const modoDe = vertical => (vertical ? "workflow" : "estandar");

export const AegisModos = {
  /** @returns {"estandar" | "workflow"} */
  actual() {
    const modo = Services.prefs.getStringPref(PREF_MODO, "");
    return modo in VERTICAL ? modo : modoDe(Services.prefs.getBoolPref(PREF_VERTICAL, false));
  },

  /** @param {"estandar" | "workflow"} modo */
  aplicar(modo) {
    if (!(modo in VERTICAL)) {
      return;
    }
    if (Services.prefs.getBoolPref(PREF_VERTICAL, false) != VERTICAL[modo]) {
      Services.prefs.setBoolPref(PREF_VERTICAL, VERTICAL[modo]);
    }
    if (Services.prefs.getStringPref(PREF_MODO, "") != modo) {
      Services.prefs.setStringPref(PREF_MODO, modo);
    }
  },

  alternar() {
    this.aplicar(this.actual() == "estandar" ? "workflow" : "estandar");
  },

  /**
   * Una vez por arranque: deja aegis.modo de acuerdo con la orientación que ya tiene Firefox (sin cambiarla) y
   * escucha los dos sentidos: elegir modo cambia la orientación, y cambiar la orientación en Firefox cambia el modo.
   * Sin temporizadores.
   */
  inicio() {
    const segun = modoDe(Services.prefs.getBoolPref(PREF_VERTICAL, false));
    if (Services.prefs.getStringPref(PREF_MODO, "") != segun) {
      Services.prefs.setStringPref(PREF_MODO, segun);
    }
    Services.prefs.addObserver(PREF_MODO, () => this.aplicar(this.actual()));
    Services.prefs.addObserver(PREF_VERTICAL, () => {
      const modo = modoDe(Services.prefs.getBoolPref(PREF_VERTICAL, false));
      if (Services.prefs.getStringPref(PREF_MODO, "") != modo) {
        Services.prefs.setStringPref(PREF_MODO, modo);
      }
    });
  },
};
