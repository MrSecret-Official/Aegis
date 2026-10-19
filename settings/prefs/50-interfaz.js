// Aegis · interfaz limpia: sin promociones de Mozilla, sin IA y sin cuenta de Mozilla.

// VPN de Mozilla (botón de la barra y promociones).
pref("browser.ipProtection.enabled", false);
pref("browser.vpn_promo.enabled", false);

// Funciones de IA: chat en la barra lateral, vista previa de enlaces con IA y grupos de pestañas «inteligentes».
pref("browser.ml.enable", false);
pref("browser.ml.chat.enabled", false);
pref("browser.ml.linkPreview.enabled", false);
pref("browser.tabs.groups.smart.enabled", false);
// Extractor de páginas de la IA para YouTube (Firefox 158): sin IA no sirve de nada; apagado por higiene.
pref("browser.pageextractor.youtube.enabled", false);

// Cuenta de Mozilla y Sync: ocultos (Aegis sincroniza en la nube del usuario, más adelante).
pref("identity.fxaccounts.enabled", false);

// Recomendaciones y promociones en Complementos y en Ajustes («Más de Mozilla»).
pref("browser.discovery.enabled", false);
pref("extensions.getAddons.showPane", false);
pref("extensions.htmlaboutaddons.recommendations.enabled", false);
pref("browser.preferences.moreFromMozilla", false);

// Bienvenida de Firefox: Aegis tendrá la suya.
pref("browser.aboutwelcome.enabled", false);

// Sin el botón «Importar marcadores…» fijo en la barra de marcadores.
pref("browser.bookmarks.addedImportButton", true);

// Sin la barra «¿Abrir las pestañas anteriores?» al arrancar: -1 la apaga (SessionWindowUI solo la muestra con 0–1).
// Restaurar la sesión sigue en el menú Historial.
pref("browser.startup.couldRestoreSession.count", -1);

// Panel de marcadores nuevo de la barra lateral (el que Aegis completa como el de Chrome o Brave: cabecera, orden,
// «Nueva carpeta» y «Añadir pestaña actual»). En Release viene apagado; sin él sale el panel XUL antiguo.
pref("sidebar.updatedBookmarks.enabled", true);

// Icono de la app en Windows (Ajustes › Apariencia, icono.sys.mjs): «fantasma», el del ejecutable, o «uroboros», el
// alternativo. Las ventanas privadas llevan siempre el fantasma con cerradura.
pref("aegis.icono", "fantasma");

// El selector de iconos de Firefox (Ajustes › Apariencia › Icono del navegador) solo ofrece logotipos de Firefox, que
// es marca registrada, y pisaría el icono de Aegis. Apagado, CustomIconManager vuelve al icono de serie si había otro.
pref("browser.shell.customIcon.enabled", false);

// Lista de saltos de la barra de tareas (clic derecho en el icono): sin «Frecuentes», que enseñaba en la barra de
// Windows las webs que más visitas (privacidad); se quedan las tareas (nueva pestaña, ventana, ventana privada).
pref("browser.taskbar.lists.frequent.enabled", false);
pref("browser.taskbar.lists.recent.enabled", false);

// Ventanas privadas con el tema de Aegis, no con el tema violeta de Firefox. Se distinguen por el fantasma con candado
// (icono de la ventana y el indicador de la barra de pestañas).
pref("browser.theme.dark-private-windows", false);

// Herramientas de la barra lateral de serie: Historial y Marcadores (y Pestañas abiertas si se activa). Sin
// «Pestañas de otros dispositivos», que es Firefox Sync (Aegis no lo usa; barra-lateral.sys.mjs la oculta también en
// los perfiles que ya la tenían), ni el chat de IA. Firefox solo pone su lista de serie si esta pref está vacía.
pref("sidebar.main.tools", "history,bookmarks,opentabs");

// Barra de marcadores vacía: con «Ahora no» junto a su aviso (barra-lateral.sys.mjs) pasa a true y la barra no se
// muestra mientras no tenga marcadores; vuelve sola con el primero.
pref("aegis.marcadores.aviso_oculto", false);

// Sin el fondo Mica de Windows 11: el «Cristal» de DISENO aún no se ofrece. Va junto con
// widget.windows.windowsappsdk.enabled = false (10-telemetria.js): Firefox necesita el Windows App SDK para ocultar los
// botones de la ventana que Windows dibuja con Mica; si algún día se ofrece Mica, hay que volver a encender el SDK.
pref("widget.windows.mica", false);

// Restos de Firefox (decisión del usuario, 2026-10-19: de Firefox, solo lo imprescindible).
// Páginas de error (red, certificado, Solo HTTPS, reinicio necesario): sin la ilustración del zorro «Kit» de Firefox.
// La lee net-error-card.mjs y la hoja de about:restartrequired (firefox.js la pone en true).
pref("browser.netError.illustration.enabled", false);
// Barra de direcciones: sin las etiquetas de grupo encima de los resultados («Firefox Suggest» sobre el historial y los
// marcadores). Firefox no permite quitar solo esa: la pref apaga todas (también «Sugerencias de <buscador>» y
// «Búsquedas recientes»), y los resultados siguen igual (UrlbarView.mjs, #rowLabel).
pref("browser.urlbar.groupLabels.enabled", false);
// Ajustes › Idioma: los Ajustes nuevos piden a addons.mozilla.org la lista de paquetes de idioma solo con abrir el
// panel (languages.mjs, BrowserLanguageRemoteLocalesSetting), y abrir un panel no es pedir una conexión (principio 1).
// Apagada, no se pide nada y el selector solo ofrece los seis idiomas que trae la build (multi-idioma). Aegis no
// descarga idiomas: los paquetes de addons.mozilla.org traen la marca de Firefox (decisión del usuario, 2026-10-20).
pref("intl.multilingual.downloadEnabled", false);

// Idioma de la interfaz: vacío = el de Windows (LocaleService::GetRequestedLocales, «Case 3»), negociado con los seis
// que trae la build (en-US, es-ES, pt-BR, fr, de, it; un Windows en es-MX usa es-ES). Sin esta pref, el zip y lo que
// instala Aegis Setup usarían en-US (la de serie de una build sin identidad de paquete); el paquete de la Tienda ya la
// pone igual en su distribution.ini. Ajustes › Idioma la cambia como siempre (requestedLocales).
pref("intl.locale.requested", "");
