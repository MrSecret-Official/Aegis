// Aegis · protección de serie.

// Protección contra rastreo estricta: NO va aquí. Como valor por defecto, Firefox la ignora (ContentBlockingPrefs
// solo aplica la categoría si es un valor del usuario) y además impediría guardarla como valor del usuario (libpref
// no guarda un valor igual al de serie). La pone AegisArranque.inicio() una sola vez (marca aegis.etp.inicial); si
// luego el usuario elige otra, se respeta. Hasta el gancho de la fase 2, solo en las copias de prueba.
// verificar.py falla si browser.contentblocking.category aparece en settings/prefs.

// Solo HTTPS sin la petición HTTP de fondo que manda el dominio sin cifrar a los 3 s (arkenfox).
pref("dom.security.https_only_mode_send_http_background_request", false);

// Safe Browsing: no enviar a Google los datos de las descargas (arkenfox). Las listas locales siguen.
pref("browser.safebrowsing.downloads.remote.enabled", false);

// Solo HTTPS: si una web no lo admite, Aegis avisa antes de abrirla sin cifrar.
pref("dom.security.https_only_mode", true);

// Firefox Relay (máscaras de correo, servicio de Mozilla con cuenta): con un valor fuera de los que reconoce
// (available, offered, enabled, disabled), OptInFeature.isAvailable es falso y no se ofrece ni sale en Ajustes.
pref("signon.firefoxRelay.feature", "");

// Comprobación de intermediario (MITM): en una página de error de certificado con emisor desconocido, Firefox lanza
// sin preguntar un HEAD a mitmdetection.services.mozilla.com (NetErrorParent), también antes de la bienvenida. Es una
// conexión no pedida: el error se sigue mostrando igual, sin la sugerencia que da esa comprobación.
pref("security.certerrors.mitm.priming.enabled", false);

// Ubicación: si una web la pide y se permite, en Windows la da el servicio de ubicación de Windows
// (geo.provider.ms-windows-location); Firefox 158 no define esta URL en Windows ni recurre a la red si ese servicio
// falla. En Linux sí (Portal/Geoclue → MLSFallback): mandaría las redes Wi-Fi cercanas a www.googleapis.com con una
// clave vacía (esta build no tiene clave). Vacía en todas, también por si una versión futura la define en Windows.
pref("geo.provider.network.url", "");
