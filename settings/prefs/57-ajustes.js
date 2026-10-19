// Aegis · Ajustes (about:preferences): sin secciones de Mozilla ni de funciones que Aegis no usa.
// La forma de la página está en overlay/browser/components/aegis (ajustes.css y ajustes.sys.mjs).

// Controles de IA: Aegis no trae funciones de IA (50-interfaz.js las apaga), así que su página sobra.
pref("browser.preferences.aiControls", false);

// Firefox Labs: experimentos que Mozilla activa a distancia (Aegis no los recibe; ver 10-telemetria.js).
pref("browser.preferences.experimental.hidden", true);

// Copia de seguridad de Firefox: su tarjeta habla de «copias de Firefox» y de la ayuda de Mozilla. Sin ella, la
// sección no aparece y el servicio no prepara copias ni restauraciones.
pref("browser.backup.archive.enabled", false);
pref("browser.backup.restore.enabled", false);
