// Aegis · actualizaciones (ver docs/ACTUALIZACIONES.md). @REPO@ lo sustituye aegis.py con branding/marca.json.

// Página de la versión y descarga manual si la automática falla: las releases de GitHub.
pref("app.update.url.manual", "https://github.com/@REPO@/releases/latest");
pref("app.update.url.details", "https://github.com/@REPO@/releases/latest");

// Descarga del MAR con la red del navegador, no con BITS (el servicio de transferencias de Windows, que Firefox usa
// de serie en Windows). Con BITS, la descarga la hace un servicio de Windows: sigue con Aegis cerrado, no pasa por la
// red de Aegis (ni por LOAD_ANONYMOUS del parche 0400-privacidad/0001, ni por un proxy que no sea el del sistema) y no
// la ve la auditoría de red (tools/auditar-red.py, que con su proxy hace que Firefox no use BITS).
// Sin BITS, una descarga a medias se reanuda en el siguiente arranque. Ver docs/ACTUALIZACIONES.md.
pref("app.update.BITS.enabled", false);
