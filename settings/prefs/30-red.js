// Aegis · conexiones que el navegador hace por su cuenta: apagadas (ver docs/CONEXIONES.md).

// Comprobación de portal cautivo y de conectividad (detectportal.firefox.com).
pref("network.captive-portal-service.enabled", false);
pref("network.connectivity-service.enabled", false);

// Región por IP (location.services.mozilla.com) y su actualización.
pref("browser.region.network.url", "");
pref("browser.region.update.enabled", false);

// Precarga y conexiones especulativas: conectan a sitios que el usuario no ha pedido abrir. Además gastan.
pref("network.prefetch-next", false);
pref("network.dns.disablePrefetch", true);
pref("network.http.speculative-parallel-limit", 0);
pref("browser.urlbar.speculativeConnect.enabled", false);
pref("browser.places.speculativeConnect.enabled", false);
// <link rel=preconnect> y la cabecera «Link: rel=preconnect»: aun con el límite de arriba a 0, Firefox 157 resolvía
// esos dominios nada más cargar la página, sin que esta pidiera nada de ellos (medido el 2026-10-15:
// out/pruebas/2026-10-15-fase1/prueba-preconnect-*). Las «early hints» tienen su propio límite (10) que se salta el
// general. dns-prefetch desde páginas https, también fuera (el de http ya lo quita disablePrefetch).
pref("network.preconnect", false);
pref("network.early-hints.preconnect.enabled", false);
pref("network.dns.disablePrefetchFromHTTPS", true);

// Complementos de sistema: sin actualizaciones desde aus5.mozilla.org ni caché de complementos de AMO (arkenfox).
pref("extensions.systemAddon.update.enabled", false);
pref("extensions.systemAddon.update.url", "");
pref("extensions.getAddons.cache.enabled", false);

// Proxy (y Tor): si falla, que nada salga directo. Sin esto, Remote Settings y otras peticiones del sistema reintentan
// sin proxy (network.proxy.allow_bypass) y Necko puede pasar a conexión directa al fallar el proxy
// (network.proxy.failover_direct). Lo vio el banco de pruebas de Escudos (tools/pruebas): DNS y TCP directos con el
// proxy caído. arkenfox hace lo mismo.
pref("network.proxy.allow_bypass", false);
pref("network.proxy.failover_direct", false);

// Rutas UNC en file:// (\\servidor\recurso): Windows abriría una conexión SMB directa, fuera de cualquier proxy, y
// con ella la IP real (arkenfox). Para abrir una carpeta de red, el explorador de archivos.
pref("network.file.disable_unc_paths", true);
