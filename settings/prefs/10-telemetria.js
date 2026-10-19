// Aegis · telemetría, estudios y experimentos: todo apagado.
// Referencias: arkenfox user.js (sección 8500) y la configuración de LibreWolf. Nombres comprobados en Firefox 157.

// Telemetría clásica y Glean: sin envío (además, la build no tiene servidor de subida; ver mozconfigs/common).
pref("toolkit.telemetry.unified", false);
pref("toolkit.telemetry.enabled", false);
pref("toolkit.telemetry.server", "data:,");
pref("toolkit.telemetry.archive.enabled", false);
pref("toolkit.telemetry.newProfilePing.enabled", false);
pref("toolkit.telemetry.shutdownPingSender.enabled", false);
pref("toolkit.telemetry.updatePing.enabled", false);
pref("toolkit.telemetry.bhrPing.enabled", false);
pref("toolkit.telemetry.firstShutdownPing.enabled", false);
pref("toolkit.coverage.opt-out", true);
pref("toolkit.coverage.endpoint.base", "");

// Informe de salud y aviso de envío de datos: sin subida y sin la barra que lo anuncia.
pref("datareporting.healthreport.uploadEnabled", false);
pref("datareporting.policy.dataSubmissionEnabled", false);
pref("datareporting.usage.uploadEnabled", false);

// Términos de uso de Mozilla: Aegis no los muestra (no aplican a Aegis).
pref("termsofuse.bypassNotification", true);

// Estudios y experimentos a distancia (Normandy y Nimbus). Nimbus activa funciones como el VPN o el tiempo
// aunque su pref esté apagada; sin él, mandan las prefs de Aegis. Su colección de Remote Settings (la de los
// experimentos de Labs) no se sincroniza nunca: no está en aegis.remotesettings.colecciones (66-conexiones.js).
pref("app.shield.optoutstudies.enabled", false);
pref("app.normandy.enabled", false);
pref("app.normandy.api_url", "");
pref("nimbus.rollouts.enabled", false);

// Telemetría de la nueva pestaña.
pref("browser.newtabpage.activity-stream.telemetry", false);

// Windows App SDK de Microsoft (Windows 11 22H2 o posterior): Firefox carga sus DLL en cada ventana
// (WindowsUIUtils::AssociateWithWinAppSDK) para no duplicar los botones de la barra de título con el fondo Mica.
// Esas DLL llevan los proveedores TraceLogging del grupo de telemetría de Microsoft, que Windows sube según su nivel
// de diagnóstico, no según Aegis. Aegis no usa Mica (widget.windows.mica en false, 50-interfaz.js; van juntas: con Mica
// y sin el SDK saldrían los botones de la ventana dobles): con esto ni se cargan.
pref("widget.windows.windowsappsdk.enabled", false);
