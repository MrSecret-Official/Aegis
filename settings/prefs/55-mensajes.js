// Aegis · sin mensajes de Firefox: ni avisos en la nueva pestaña, ni globos de funciones, ni promociones.
// Los muestra ASRouter (el sistema de mensajes de Firefox) a partir de cuatro fuentes; se apagan todas. Aegis tendrá
// su propia bienvenida. El JSON es el de Firefox 157 (browser/app/profile/firefox.js) con "enabled":false.

// Mensajes de serie del navegador: «Haz de Nightly tu navegador principal», globos de funciones nuevas, avisos de
// la navegación privada…
pref("browser.newtabpage.activity-stream.asrouter.providers.onboarding", "{\"id\":\"onboarding\",\"type\":\"local\",\"localProvider\":\"OnboardingMessageProvider\",\"enabled\":false,\"exclude\":[]}");
// Mensajes que Mozilla publica en Remote Settings (se descargan cada hora).
pref("browser.newtabpage.activity-stream.asrouter.providers.cfr", "{\"id\":\"cfr\",\"enabled\":false,\"type\":\"remote-settings\",\"collection\":\"cfr\",\"updateCycleInMs\":3600000}");
pref("browser.newtabpage.activity-stream.asrouter.providers.message-groups", "{\"id\":\"message-groups\",\"enabled\":false,\"type\":\"remote-settings\",\"collection\":\"message-groups\",\"updateCycleInMs\":3600000}");
// Mensajes de los experimentos de Mozilla (Nimbus).
pref("browser.newtabpage.activity-stream.asrouter.providers.messaging-experiments", "{\"id\":\"messaging-experiments\",\"enabled\":false,\"type\":\"remote-experiments\",\"updateCycleInMs\":3600000}");
// Traducciones de los mensajes descargadas de Remote Settings: sin mensajes, no hacen falta.
pref("browser.newtabpage.activity-stream.asrouter.useRemoteL10n", false);

// Sin preguntar al arrancar si Aegis debe ser el navegador predeterminado (se puede elegir en Ajustes).
pref("browser.shell.checkDefaultBrowser", false);

// Promociones de la página de navegación privada: fijar a la barra de tareas y Firefox Relay.
pref("browser.promo.pin.enabled", false);
pref("browser.promo.relay.enabled", false);
// La del bloqueo de avisos de cookies en la misma página (la VPN, browser.vpn_promo.enabled, está en 50-interfaz.js).
pref("browser.promo.cookiebanners.enabled", false);

// about:protections: sin la tarjeta de la app móvil de Firefox ni el anuncio de Mozilla VPN.
pref("browser.contentblocking.report.show_mobile_app", false);
pref("browser.contentblocking.report.hide_vpn_banner", true);
