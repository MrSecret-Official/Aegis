// Aegis · conexiones de fondo: nada sale hasta que el usuario elige en about:conexiones (conexiones.sys.mjs), que se
// abre en la primera ventana mientras no haya decidido. Lista completa, con qué envía cada una: docs/CONEXIONES.md.

// Lo que elige el usuario (se guarda en su perfil). «decidido»: ya ha pulsado Aceptar o Ahora no (la página deja de
// abrirse sola). «aceptadas»: ha aceptado; sin esto, ningún grupo conecta aunque su interruptor esté encendido.
pref("aegis.conexiones.decidido", false);
pref("aegis.conexiones.aceptadas", false);
// Un interruptor por grupo. El valor de serie es el que sale marcado en la página; no conecta nada hasta aceptar.
// Comprobación diaria de actualizaciones en GitHub.
pref("aegis.conexiones.actualizaciones", true);
// Remote Settings, solo colecciones de seguridad: CRLite, OneCRL, intermedios y la lista de bloqueo de complementos.
pref("aegis.conexiones.seguridad", true);
// Listas de la protección contra rastreo (por Remote Settings) y las de filtros de los Escudos (escudos/listas.sys.mjs).
pref("aegis.conexiones.listas", true);
// OpenH264 (una descarga) y Widevine (solo si una web pide DRM y el usuario lo activa), y su comprobación diaria.
pref("aegis.conexiones.codecs", true);
// Traducción de páginas en el equipo: los modelos de cada idioma se bajan solo al pedir traducir (o en Ajustes).
pref("aegis.conexiones.traduccion", true);
// Safe Browsing de Google: apagado de serie (docs/PLAN.md); sin la clave de Google en la build, ni se ofrece.
pref("aegis.conexiones.safebrowsing", false);
// Notificaciones de webs (push): conexión abierta con push.services.mozilla.com. Apagado de serie.
pref("aegis.conexiones.push", false);

// ───────── Prefs efectivas: la puerta cerrada ─────────
// conexiones.sys.mjs las vuelve a calcular en cada arranque a partir de las de arriba y las escribe como valores por
// defecto (no van a prefs.js). Aquí, el valor si ese módulo no llegara a ejecutarse: todo cerrado.

// Colecciones de Remote Settings que pueden sincronizarse (parche 0400-privacidad/0003). Vacía: ninguna conexión, ni
// al arrancar ni en el sondeo diario; con tippytop, Nimbus o fingerprinting-protection-overrides nunca en la lista.
pref("aegis.remotesettings.colecciones", "");
// Comprobación automática de actualizaciones (el mismo parche: manualUpdateOnly). «Buscar actualizaciones» funciona.
// En la rama app.update. porque la tarea de actualización en segundo plano de Windows (con Aegis cerrado) solo copia
// esas del perfil; conexiones.sys.mjs la escribe como valor del usuario.
pref("app.update.aegis.automaticas", false);
// Listas del clasificador de URLs (protección contra rastreo y Safe Browsing): sin descargas. La protección contra
// rastreo funciona igual, pero sin listas no reconoce ningún rastreador por su nombre (la build no trae ninguna).
pref("browser.safebrowsing.update.enabled", false);
// Safe Browsing de Google (avisos de estafa y malware): apagado mientras no se acepte. Sin clave de Google en la
// build, Firefox no descargaría sus listas de todas formas.
pref("browser.safebrowsing.malware.enabled", false);
pref("browser.safebrowsing.phishing.enabled", false);
// Traducción de páginas: oculta hasta aceptar su grupo (sin ella, «Traducir» bajaba modelos de Remote Settings).
pref("browser.translations.enable", false);
// Notificaciones push: sin la conexión con push.services.mozilla.com (que también avisa a Remote Settings).
pref("dom.push.connection.enabled", false);
// Códecs (GMP): sin la comprobación en aus5.mozilla.org ni las descargas de Cisco y Google. Se abre con el grupo
// «codecs» o cuando el usuario activa el DRM (abajo). OpenH264, solo con el grupo.
pref("media.gmp-manager.updateEnabled", false);
pref("media.gmp-gmpopenh264.enabled", false);
// Cada comprobación de códecs preguntaría también a Google (update.googleapis.com) por la versión de Widevine, aunque no
// se instale: solo cuando el usuario activa el DRM.
pref("media.gmp-widevinecdm.allow-chromium-update", false);
// DRM (Widevine) bajo demanda, como Firefox en Linux: apagado; la primera web que lo pide muestra el aviso para
// activarlo y solo entonces se descarga Widevine (si los códecs están aceptados).
pref("media.eme.enabled", false);
// Ayudante de notificaciones en segundo plano (notification-helper.exe, Firefox 158): con Aegis cerrado hablaría con
// el servidor de push de Mozilla, fuera del permiso «push» de about:conexiones. Apagado del todo.
pref("app.backgroundNotifications.helper.available", false);
pref("app.backgroundNotifications.helper.enabled", false);
