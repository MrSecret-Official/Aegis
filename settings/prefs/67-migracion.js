// Aegis · Importar de otros navegadores (Ajustes › General › Importar datos). Importar es local: se leen los archivos
// del otro navegador en este equipo, sin ninguna conexión (docs/CONEXIONES.md, «Importar de otros navegadores»). Código:
// overlay/browser/components/aegis/migracion/ y el parche 0900-migracion/0001.

// Extensiones de Chrome y los demás Chromium: para encontrar su equivalente, el asistente pregunta a
// addons.mozilla.org (AddonRepository.getMappedAddons) con la lista de las extensiones del usuario. Es la única
// conexión que haría importar, y le diría a ese servidor qué extensiones tiene: apagado, el asistente no las ofrece.
pref("browser.migrate.chrome.extensions.enabled", false);

// Tarjetas de pago de Chrome y los demás Chromium: el asistente las copiaría al almacén de autorrelleno, que las cifra
// con la llave del sistema y no con la contraseña principal de la bóveda. Apagado, no las ofrece ni las copia.
pref("browser.migrate.chrome.payment_methods.enabled", false);

// Los dos orígenes de Aegis (migracion/migradores.sys.mjs): «Firefox» (sus perfiles, también los de Aegis 157) y otro
// perfil de este Aegis. Fusionan marcadores, historial y formularios con lo que ya hay; las contraseñas, por el CSV.
pref("browser.migrate.aegis-firefox.enabled", true);
pref("browser.migrate.aegis-perfil.enabled", true);

// El migrador «firefox» de serie (FirefoxProfileMigrator) se queda como está: solo sale al crear un perfil y es el que
// usa «Restablecer» (about:support) para pasar los datos al perfil nuevo; desde Ajustes no aparece.
