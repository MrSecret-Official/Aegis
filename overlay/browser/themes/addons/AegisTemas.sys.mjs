/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · temas integrados. Va en browser.jar (aegis-temas.inc.mn) y se carga como
 * resource://builtin-themes/AegisTemas.sys.mjs desde dos archivos de Firefox (parche 0500-ui, «Temas de Aegis»):
 * - BuiltInThemeConfig.sys.mjs: qué temas se instalan con el navegador (TEMAS_AEGIS, en lugar de Alpenglow);
 * - ThemesList.sys.mjs: qué temas ofrecen los selectores de temas (Complementos, editor de perfiles, bienvenida).
 *   Solo los integrados: los de Firefox se descargaban de addons.mozilla.org al elegirlos.
 *
 * El tema de serie sigue siendo el «Predeterminado» de Firefox (default-theme@mozilla.org): usa la hoja de la
 * interfaz y, con las de Aegis encima, es Aegis Oscuro o Aegis Claro según el sistema. «Claro» y «Oscuro»
 * (firefox-compact-*) son lo mismo con el esquema forzado. Los de aquí son variantes con colores propios.
 * Cada «version» tiene que coincidir con la del manifest.json del tema: si cambia, Firefox lo reinstala.
 */

const VERSION = "1.0.0";

/** Entradas de BuiltInThemeConfig: [id, { version, path }]. */
export const TEMAS_AEGIS = ["grafito", "medianoche", "niebla", "arena"].map(nombre => [
  `aegis-${nombre}@aegis`,
  { version: VERSION, path: `resource://builtin-themes/aegis-${nombre}/` },
]);

/**
 * Entradas de ThemesList (selectores de temas). Solo temas con nombre traducido en Firefox (los selectores lo leen
 * de appExtensionFields.ftl): el de serie, Oscuro y Claro. Muestras monocromas, con el degradado casi imperceptible
 * del marco de Aegis.
 */
export const SELECTOR_AEGIS = [
  {
    id: "default-theme@mozilla.org",
    isBuiltIn: true,
    showInCompactLayout: true,
    themePickerColors: {
      light: { type: "gradient", value: "linear-gradient(180deg, #fafafb 0%, #f5f5f7 100%)" },
      dark: { type: "gradient", value: "linear-gradient(180deg, #111113 0%, #0a0a0b 100%)" },
    },
  },
  {
    id: "firefox-compact-dark@mozilla.org",
    isBuiltIn: true,
    showInCompactLayout: true,
    themePickerColors: {
      light: { type: "gradient", value: "linear-gradient(180deg, #111113 0%, #0a0a0b 100%)" },
      dark: { type: "gradient", value: "linear-gradient(180deg, #111113 0%, #0a0a0b 100%)" },
    },
  },
  {
    id: "firefox-compact-light@mozilla.org",
    isBuiltIn: true,
    showInCompactLayout: true,
    themePickerColors: {
      light: { type: "gradient", value: "linear-gradient(180deg, #fafafb 0%, #f5f5f7 100%)" },
      dark: { type: "gradient", value: "linear-gradient(180deg, #fafafb 0%, #f5f5f7 100%)" },
    },
  },
];
