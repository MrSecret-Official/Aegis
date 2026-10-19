// Aegis · Escudos (overlay/browser/components/aegis/escudos.sys.mjs): el botón con el uróboros en la barra de
// direcciones y su panel. Hasta la fase 4 trabajan con la protección contra rastreo de Firefox.

// «Opciones avanzadas» del panel: plegado de serie; el panel recuerda la última elección.
pref("aegis.escudos.avanzadas", false);

// Contador del icono de confianza de Firefox (la pastilla «N rastreadores bloqueados» junto al candado): lo sustituye
// el de Escudos, así la barra enseña un solo contador. UrlbarPrefs la lee como «trackerCount.enabled».
pref("browser.urlbar.trackerCount.enabled", false);

// Nivel «Normal» de Escudos (la categoría «standard» de la protección contra rastreo): bloquear los rastreadores
// conocidos también en las ventanas normales, no solo en las privadas (Firefox de serie solo les quita las cookies
// fuera de privado). Va como valor por defecto: «standard» se define como «las prefs con su valor de serie»
// (ContentBlockingPrefs.prefsMatch), así que la categoría sigue siendo «standard» y no pasa a «custom».
pref("privacy.trackingprotection.enabled", true);

// Nivel de serie: Estricto+ (protección contra rastreo «strict», que AegisArranque pone una vez en un perfil nuevo, más
// la lista AdGuard Tracking Protection en el motor propio). Con false, «strict» es Estricto. En Normal no se usa.
pref("aegis.escudos.estricto_mas", true);

// Qué cuenta el contador del botón y del panel: "peticiones" (cada petición bloqueada, como Brave) u "origenes" (cada
// origen una sola vez). Se elegirá en la sección de Escudos de Ajustes.
pref("aegis.escudos.contador", "peticiones");

// Molestias, en todos los niveles y de serie: un interruptor por grupo (escudos/catalogo.json). Avisos de cookies;
// ventanas, banners de apps y widgets; avisos que piden quitar el bloqueador.
pref("aegis.escudos.molestias.cookies", true);
pref("aegis.escudos.molestias.ventanas", true);
pref("aegis.escudos.molestias.antiadblock", true);

// Listas de Escudos: se renuevan solas desde sus autores (escudos/listas.sys.mjs), solo después de aceptar las
// conexiones en la bienvenida con «Listas de protección» (aegis.conexiones.aceptadas y aegis.conexiones.listas).
// Una revisión al día con el temporizador compartido de Firefox; cada lista se pide cuando caduca según su «! Expires»,
// al menos un día y como mucho cada `intervalo` días.
pref("aegis.escudos.listas.actualizar", true);
pref("aegis.escudos.listas.intervalo", 4);

// Bloqueador propio de Escudos (motor y listas de filtros, escudos/listas.sys.mjs). Con false (al reiniciar) solo
// bloquea la protección contra rastreo de Firefox; sirve también para medir lo que cuesta el bloqueador.
pref("aegis.escudos.motor", true);

// Cosmético (ocultar los huecos de anuncios y molestias con hojas de usuario, escudos/cosmetico.sys.mjs) y scriptlets
// de las listas (en el mundo de la página, antes que sus scripts). Interruptores generales, sin interfaz: con los dos
// a false el actor de las páginas ni se registra (sirve para medir lo que cuestan). Por sitio, las excepciones de
// Ajustes › Escudos (escudos/excepciones.sys.mjs). Con uBlock Origin activo se retiran solos.
pref("aegis.escudos.cosmetico", true);
pref("aegis.escudos.scriptlets", true);
