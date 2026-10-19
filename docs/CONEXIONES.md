# Conexiones de Aegis

Lista blanca de **todas** las conexiones que Aegis hace por su cuenta, sin que el usuario navegue. Lo que no está
aquí es un fallo (principio 1 de `docs/GUIA.md`). Lo revisa `auditor-privacidad` y lo comprueba `tools/auditar-red.py`.

## La puerta: nada sale hasta que el usuario elige

Con un perfil nuevo, Aegis **no se conecta a nada** hasta que el usuario elige en `about:conexiones` («Tú decides qué
se conecta»; `overlay/browser/components/aegis/conexiones.sys.mjs`). La página se abre sola en la primera ventana de
cada arranque mientras no haya decidido (sin el archivo de Aegis Setup, al terminar la bienvenida `about:bienvenida`,
que no conecta nada: `docs/INSTALADOR.md`), y se puede volver a ella desde Ajustes › Privacidad › Conexiones. Si la
bienvenida se cierra sin terminar, en ese arranque no sale `about:conexiones` y todo sigue cerrado: en el siguiente
arranque vuelve a salir la bienvenida, que lleva a ella. Tiene un
interruptor por grupo: «Aceptar» aplica lo elegido **al momento, sin reiniciar**, y pone en marcha ya lo que se acaba
de encender (una comprobación de actualizaciones, un sondeo de Remote Settings y la comprobación de los códecs);
«Ahora no» (o, ya aceptado, «No permitir ninguna») lo deja todo cerrado. Abrir una web que el usuario escribe o pulsa
no pasa por la puerta: es cosa suya.

| Grupo (`aegis.conexiones.<grupo>`) | Marcado de serie | Qué abre |
|---|---|---|
| `actualizaciones` | Sí | Las dos primeras filas de la tabla de abajo |
| `seguridad` | Sí | Remote Settings, solo las colecciones `security-state/*` (CRLite, OneCRL, intermedios, registros de transparencia) y `blocklists/*` (bloqueo de complementos y de controladores gráficos) |
| `listas` | Sí | Remote Settings, las listas de la protección contra rastreo: `main/tracking-protection-lists` (Firefox ya no las baja de shavar, sino de aquí), `main/url-classifier-exceptions` y `main/query-stripping`; y las listas de filtros de los Escudos, de sus autores (sección «Escudos: listas de filtros») |
| `codecs` | Sí | OpenH264 y la comprobación de los códecs. Widevine, además, solo si una web pide DRM y el usuario lo activa en su aviso |
| `traduccion` | Sí | La traducción de páginas (en el equipo): sin el grupo, la función no aparece (`browser.translations.enable`). Con él, Remote Settings `main/translations-models-v2` y `main/translations-wasm-v2`; los modelos, solo al pedir traducir |
| `safebrowsing` | No | Las listas de Safe Browsing de Google. **No se ofrece**: la build no lleva clave de Google, sin ella Firefox no las descarga, y el interruptor sale desactivado con una nota |
| `push` | No | Las notificaciones push (y el aviso inmediato de cambios de Remote Settings, que va por la misma conexión) |

Cómo queda cerrada cada cosa (valores de serie en `settings/prefs/66-conexiones.js`; el módulo los vuelve a calcular en
cada arranque y los escribe como valores por defecto, así que, si no llegara a ejecutarse, todo seguiría cerrado):

- **Remote Settings:** solo sincroniza las colecciones de `aegis.remotesettings.colecciones` (vacía de serie), sin el
  paquete de arranque y sin consultar el servidor desde about:support (parche `0400-privacidad/0003`). Nimbus (también
  Firefox Labs), tippytop, `fingerprinting-protection-overrides`, los mensajes, la configuración de búsqueda, etc. no
  están nunca en la lista. Para una colección que no está en la lista no se sincroniza nada ni se baja ningún adjunto
  (tampoco la consulta al servidor que da la dirección de los adjuntos; parche `0400-privacidad/0003`): el código que
  la usa se queda con la copia que trae la build, si la hay, o sin datos. Todas las peticiones de Remote Settings van
  sin cookies y con el mismo `Accept-Language` en todos los Aegis (el mismo parche).
- **Traducción de páginas:** `browser.translations.enable` en false, así que no aparece ni el botón de traducir ni la
  descarga de idiomas en Ajustes; sus colecciones tampoco están en la lista hasta aceptar el grupo `traduccion`.
- **Actualizaciones:** `app.update.aegis.automaticas` (el mismo parche, por el camino de la política
  ManualAppUpdateOnly): sin comprobaciones automáticas, tampoco la de los 30 s del primer arranque. «Buscar
  actualizaciones» en Acerca de funciona siempre, porque lo pide el usuario. Antes de aceptar, abrir Acerca de o
  Ajustes no comprueba nada: muestra ese botón (parche `0400-privacidad/0003`, `aboutDialog-appUpdater.js`). Después,
  como en Firefox, cada vez que se abren se comprueba. Al revocar el grupo se para una descarga en curso. Tras
  aceptar, se guarda como valor del usuario en `prefs.js`. Firefox tiene además una tarea de actualización en segundo plano de Windows (con el
  navegador cerrado), pero en Aegis no se programa nunca: necesita BITS (`app.update.BITS.enabled` en false) y el
  servicio de mantenimiento (no se compila). Con las automáticas sin aceptar o revocadas, tampoco se reanuda sola una
  comprobación ni una descarga a medias (parche `0400-privacidad/0003`: `_attemptResume` y el arranque).
- **Listas del clasificador de URLs:** `browser.safebrowsing.update.enabled` en false. La protección contra rastreo
  sigue (cookies separadas por web, huella, parámetros de rastreo), pero **sin listas no reconoce ningún rastreador por
  su nombre**: la build no trae ninguna dentro (solo las de prueba `moztest-*`) y Remote Settings no tiene copia de
  `tracking-protection-lists`. El motor propio de los Escudos sí bloquea desde el primer arranque, con la instantánea
  de listas que va en la build (`escudos/listas.sys.mjs`).
- **Safe Browsing:** `browser.safebrowsing.malware.enabled` y `phishing.enabled` en false, y sin clave de Google.
- **Push:** `dom.push.connection.enabled` en false.
- **Códecs (GMP):** `media.gmp-manager.updateEnabled`, `media.gmp-gmpopenh264.enabled` y
  `media.gmp-widevinecdm.allow-chromium-update` en false, y `media.eme.enabled` en false (DRM bajo demanda, como
  Firefox en Linux).
- **Portal cautivo, conectividad y región:** apagados siempre (`30-red.js`); la medición lo confirma.

Medido con `tools/auditar-red.py` sobre la build empaquetada y un perfil nuevo: 10 minutos sin tocar nada, **0
intentos de salida** (ni por el proxy, ni resoluciones DNS propias, ni TCP fuera de 127.0.0.1), también forzando lo que
Firefox hace con el equipo inactivo (`--simular-reposo`); tras «Aceptar» con los interruptores de serie, solo hosts de
esta lista. En una medición del auditor salieron una vez duckduckgo.com y www.google.com antes de aceptar, sin
reproducirse después: está abierto. Detalle en `docs/PLANNING.md` (fase 1).

## Lo que sale tras aceptar

| Conexión | Cuándo | Qué envía | Para qué | Cómo apagarla |
|---|---|---|---|---|
| Comprobación de actualizaciones: `github.com/<repo>/releases/latest/download/update-<objetivo>-release.xml`, que redirige a `github.com/<repo>/releases/download/<tag>/…` y al CDN de archivos de GitHub (`release-assets.githubusercontent.com`; confirmar con una captura) | **Nunca antes de aceptar el grupo `actualizaciones`.** Al aceptarlo, una comprobación en ese momento; con un perfil nuevo, otra unos 30 s después del siguiente arranque (el temporizador de Firefox); después, cada 24 h con el navegador abierto (`app.update.interval`), cada vez que se abre Acerca de o Ajustes (con `?force=1`, como en Firefox), y siempre al pulsar «Buscar actualizaciones» (también antes de aceptar: lo pide el usuario) | La IP, el objetivo (`WINNT_x86_64-msvc-x64`, `Linux_x86_64-gcc3`…; en Windows incluye la arquitectura real de la CPU, x64 o ARM64, aunque se ejecute la build x64 en emulación) y el User-Agent (sistema y versión mayor, como cualquier web). **Sin cookies** (`mozAnon`) y con un `Accept-Language` fijo (`en-US,en;q=0.5`), igual en todos los Aegis y en todos los saltos de la redirección (parche `0400-privacidad/0001`) | Saber si hay versión nueva | `about:conexiones` › «Actualizaciones de Aegis» (`app.update.auto` solo decide si se descarga sola o pregunta); en paquetes de distribución, desactivada |
| Descarga del MAR: `github.com/<repo>/releases/download/v<versión>/…mar` (redirige al CDN de archivos de GitHub) | Solo si hay versión nueva | La IP, el User-Agent y el `Accept-Language` del navegador, es decir, **el idioma del usuario** (p. ej. `es-ES,es;q=0.9,…`; quitarlo exigiría tocar C++ de Necko). Sin `?backgroundTaskMode` ni `X-BackgroundTaskMode` (parche `0400-privacidad/0004`). **Sin cookies** (`LOAD_ANONYMOUS`). En Windows también la hace el navegador, no BITS, el servicio de transferencias de Windows que Firefox usa de serie y que seguiría descargando con Aegis cerrado y fuera de su red (`app.update.BITS.enabled` en false, `60-actualizaciones.js`) | Actualizar | Igual que la anterior |
| Remote Settings: `firefox.settings.services.mozilla.com/v2/buckets/monitor/collections/changes/changeset` (la lista de cambios de todas las colecciones) y el `changeset` de cada colección permitida que haya cambiado; adjuntos de `firefox-settings-attachments.cdn.mozilla.net` (filtros de CRLite, certificados intermedios, filtro de bloqueo de complementos, listas de rastreo); la cadena de certificados con la que se comprueba la firma de cada colección, de `content-signature-2.cdn.mozilla.net` | Solo con `seguridad` o `listas` aceptados. Al aceptar, un sondeo; después, uno cada 24 h (`services.settings.poll_interval`) y, con `push` aceptado, también al arrancar y cuando el servidor avisa de un cambio. Con `listas`, el clasificador pide sus listas cada 6 h, pero eso lee la copia local (a la red solo va un adjunto nuevo) | La IP, el User-Agent y, en la URL, marcas de tiempo (`_expected`, `_since`) iguales para todos. **Sin cookies** (`mozAnon`) y con un `Accept-Language` fijo (`en-US,en;q=0.5`), igual en todos los Aegis (parche `0400-privacidad/0003`) | Revocaciones de certificados, complementos peligrosos y listas de rastreo al día | `about:conexiones` › «Listas de seguridad» y «Listas de protección» |
| Códecs (GMP): `aus5.mozilla.org/update/3/GMP/…/update.xml` y, si hay versión nueva de OpenH264, su descarga de `ciscobinary.openh264.org`. Con el DRM activado por el usuario, también `update.googleapis.com` (versión de Widevine) y la descarga de Widevine de los servidores de Google (`*.gvt1.com`) | Solo con `codecs` aceptado (o con el DRM activado en el aviso de una web). Al aceptar, una comprobación; después, como mucho una vez al día, al arrancar | La URL de aus5 lleva la versión, el identificador de la build, el objetivo, el idioma, el canal, la versión de Windows y la distribución (`default/default` en el instalador y el zip; `aegis-msix/1.0` en el paquete de la Microsoft Store, así que Mozilla sabe que es el Aegis de la Tienda; igual en todos los equipos). La IP y el User-Agent. **Sin cookies** (`mozAnon`) | Videollamadas con H.264 (OpenH264) y vídeo con DRM (Widevine) | `about:conexiones` › «Códecs de vídeo»; el DRM, en Ajustes › General |
| Notificaciones push: WebSocket con `push.services.mozilla.com` | Solo con `push` aceptado (apagado de serie): conexión abierta mientras el navegador está abierto | La IP, el User-Agent y el `Accept-Language` del usuario (en el saludo del WebSocket: fijarlo exigiría tocar C++ de Necko), y un identificador del navegador (UAID) que asigna el servidor; las suscripciones de las webs a las que el usuario da permiso | Que las webs avisen aunque no estén abiertas; Remote Settings se entera antes de los cambios | `about:conexiones` › «Notificaciones de webs» |
| Traducción de páginas: los modelos de un idioma (adjuntos de `firefox-settings-attachments.cdn.mozilla.net`) y la lista de idiomas y el motor (Remote Settings, como la fila de arriba) | Solo con `traduccion` aceptado. Los modelos, solo cuando el usuario pulsa «Traducir» o descarga un idioma en Ajustes; la lista de idiomas, en el sondeo diario de Remote Settings o la primera vez que se ofrece traducir una página | Como Remote Settings (sin cookies, idioma fijo). Por los modelos que pide, el servidor sabe entre qué idiomas traduce el usuario; el texto de la página nunca sale del equipo | Traducir en el equipo | `about:conexiones` › «Traducción de páginas» |
| Safe Browsing de Google: `safebrowsing.googleapis.com` | **No disponible:** sin clave de Google en la build, Firefox no descarga sus listas aunque se active | — | — | — |
| Comprobación de revocación de certificados (OCSP): al servidor OCSP de la autoridad que emitió el certificado de la web (el que dice el propio certificado; p. ej. `r10.o.lencr.org`, `ocsp.digicert.com`), **a menudo por http sin cifrar** | Al abrir una web https cuyo certificado no cubre CRLite: siempre **antes de aceptar** y siempre con «Listas de seguridad» apagado (sin CRLite no hay otra forma de saberlo; `security.OCSP.enabled` = 1, el de Firefox). Con CRLite al día (`security.pki.crlite_mode` = 2), solo para los certificados EV (de validación extendida). Es parte de la navegación que pide el usuario, no una conexión de fondo, pero la hace el navegador y no la web | La IP y qué certificado se comprueba, es decir, a qué web se entra (por http, también a la vista de la red). Sin cookies | Saber si el certificado de la web está revocado | Aceptar «Listas de seguridad» (CRLite) las reduce; apagarlas del todo (`security.OCSP.enabled` = 0) quita esa comprobación y no se recomienda |
| Sugerencias de búsqueda, al buscador elegido (DuckDuckGo: `ac.duckduckgo.com`; Google: `www.google.com/complete/search?client=firefox&channel=fen`, parámetros fijos que el formato de respuesta necesita y que no identifican a la persona; Bing: `www.bing.com/osjson.aspx`, sin `form=OSDJAS`; Startpage: `www.startpage.com/osuggestions`, la de su propio OpenSearch, porque la de la configuración de Firefox no contesta sin código de socio; detalle en «Otros buscadores») | **Apagadas de serie** (`settings/prefs/59-google.js`). Si el usuario las activa, mientras escribe en la barra de direcciones | Lo que se escribe, la IP y el User-Agent | Proponer búsquedas | Ajustes › Búsqueda › «Mostrar sugerencias de búsqueda» (`browser.search.suggest.enabled`) |
| Logo de un acceso directo: la dirección del acceso (por https) y los iconos que declara su página (`<link rel="icon">` o `apple-touch-icon`, que pueden estar en otro dominio, como `github.githubassets.com`), del más grande al más pequeño, y al final `/favicon.ico` del sitio. Se queda con el primero de 32 px o más que no tenga fondo blanco o gris muy claro (el `apple-touch-icon` a veces lo tiene; uno oscuro o del color de la marca vale; uno transparente de menos de 32 px no detiene la búsqueda) y solo pide el siguiente mientras no lo encuentra; si ninguno vale, usa el primero. Como mucho la página y cuatro iconos, con un tope de 15 s (`logos.sys.mjs`) | **Solo al pulsar «Usar el logo de la web»** en el diálogo de añadir o editar un acceso de la nueva pestaña, y solo si el icono no está ya guardado en el equipo (Places). Nada automático | La IP, el User-Agent y el `Accept-Language` de serie, como cualquier visita a ese sitio. **Sin cookies** (`credentials: "omit"`), **sin Referer** y sin guardar nada en la caché (`no-store`). Solo https mientras Solo HTTPS esté activado (de serie): sin él, una redirección del sitio a http se seguiría | Poner el logo de la web como imagen del acceso | No pulsar el botón |

- Los accesos que salen con la inicial aunque el favicon del sitio esté guardado para otra dirección equivalente (otro
  esquema, con o sin «www», redirecciones) lo enseñan sin ninguna conexión: solo se lee Places (`logos.sys.mjs`).
- Con un proxy por espacio (fase 6), estas peticiones usan el proxy **global**, no el de un espacio: hay que
  documentarlo en la interfaz. La ventana privada con Tor es otra instancia con su propio perfil: lo que ella pida
  (también sus comprobaciones de actualizaciones) va por Tor; el Aegis normal sigue saliendo directo.

## Lo que depende de una acción del usuario (sin interruptor en la bienvenida)

| Conexión | Cuándo | Qué envía | Para qué | Cómo apagarla |
|---|---|---|---|---|
| Actualizaciones de complementos: `versioncheck-bg.addons.mozilla.org/update/VersionCheck.php` (`extensions.update.background.url`, la de Firefox; a mano desde `about:addons`, `versioncheck.addons.mozilla.org`, `extensions.update.url`) o, si el complemento declara su propio `update_url` (los que se distribuyen fuera de AMO, `XPIInstall.sys.mjs`), el servidor de su autor | **Solo si el usuario ha instalado algún complemento** (los integrados no se actualizan por aquí). Una vez al día (`extensions.update.interval`), con el temporizador compartido; no pasa por la puerta de `about:conexiones` | La IP, el User-Agent y, en la URL, el id y la versión de cada complemento, su estado, el id y la versión del navegador, el sistema (`appOS`, `appABI`) y el idioma. La lista de complementos puede distinguir al usuario. Con un `update_url` propio, ese servidor recibe la IP, el User-Agent y lo que pida su URL | Instalar versiones nuevas (a menudo, correcciones de seguridad) | `extensions.update.enabled` en false (`about:config`). La opción del engranaje de `about:addons` «Update Add-ons Automatically» solo cambia `extensions.update.autoUpdateDefault` (si se instalan solas): la consulta sigue (comprobado en `AddonManager.sys.mjs` de Firefox 158, `backgroundUpdateCheck` mira `updateEnabled`) |
| Ubicación: el servicio de ubicación de Windows (`geo.provider.ms-windows-location`), que decide Windows cómo calcula (puede consultar a Microsoft) | Solo si una web la pide y el usuario la permite | Lo que Windows envíe según sus ajustes de ubicación; Aegis no manda nada a la red | Dar la ubicación a la web | No permitirla; o Configuración de Windows › Privacidad › Ubicación. **Sin ubicación por red:** en Windows, Firefox 158 no recurre a la red si el servicio de Windows falla; además `geo.provider.network.url` va vacía (`40-privacidad.js`), que lo garantiza también en Linux y si una versión futura lo cambiara |
| Idiomas de la interfaz: ninguna. Aegis no descarga idiomas desde el navegador: los seis de la interfaz (en-US, es-ES, pt-BR, fr, de, it, de Firefox y de Aegis) vienen dentro de la build (`aegis.py package` multi-idioma, `docs/GUIA.md`) y se usa el de Windows (`intl.locale.requested` vacía, `50-interfaz.js`). Ajustes › Idioma solo ofrece esos seis: «Buscar más idiomas…» se quitó (2026-10-20; los paquetes de idioma de addons.mozilla.org traen la marca de Firefox), e `intl.multilingual.downloadEnabled` va en false (`50-interfaz.js`), que es lo que impide que los Ajustes nuevos de Firefox (`languages.mjs`, `BrowserLanguageRemoteLocalesSetting`) pidan la lista a `services.addons.mozilla.org` (`extensions.getAddons.langpacks.url`) solo con abrir el panel | Nunca | Nada | — | Nada que apagar. Si alguien encendiera `intl.multilingual.downloadEnabled` en `about:config`, el panel volvería a pedir la lista de idiomas a addons.mozilla.org al abrirse (IP, User-Agent y `Accept-Language`, sin cookies) y un paquete elegido sería un complemento más (fila de `versioncheck-bg.addons.mozilla.org`, arriba) |
| Diccionarios de ortografía: `addons.mozilla.org/<idioma>/firefox/language-tools/` (`browser.dictionaries.download.url`, la de Firefox) | **Solo al pulsar** «Elegir más diccionarios» en Ajustes › Idioma o «Añadir diccionarios…» en el menú contextual de un campo de texto | Abre la web en una pestaña normal: la IP, el User-Agent, el `Accept-Language` y las cookies de AMO, como cualquier visita; la URL lleva el idioma de la app | Instalar un diccionario. Un diccionario instalado es un complemento más: entra en la comprobación de actualizaciones de complementos (fila de `versioncheck-bg.addons.mozilla.org`) | No pulsarlo, o vaciar `browser.dictionaries.download.url` |

## Escudos: listas de filtros

El bloqueador propio de Escudos usa las listas de sus autores (`overlay/browser/components/aegis/escudos/catalogo.json`).
La build trae una copia de todas (`filtros/`, `aegis.py filtros`): con un perfil nuevo bloquea desde el primer
arranque **sin ninguna conexión**. Después se renuevan solas, pidiéndoselas solo a sus autores.

| Conexión | Cuándo | Qué envía | Para qué | Cómo apagarla |
|---|---|---|---|---|
| uBlock Origin: `ublockorigin.github.io` (GitHub Pages de uBlockOrigin/uAssetsCDN); si falla, `ublockorigin.pages.dev`, del mismo proyecto. También las copias de EasyList y EasyPrivacy de `ublockorigin.github.io/uAssets` si `easylist.to` falla | Solo con la bienvenida aceptada y el grupo «Listas de protección» encendido (`aegis.conexiones.aceptadas` y `aegis.conexiones.listas`). El temporizador compartido de Firefox (`nsIUpdateTimerManager`, sin despertares propios) mira una vez al día (la primera, unos minutos después de aceptar) y pide solo las listas activas que han caducado según su «! Expires»: al menos un día y como mucho cada `aegis.escudos.listas.intervalo` días (4 de serie). Hoy: Quick fixes y Brave Unbreak a diario; el resto, cada 4 días. Además, al pulsar «Actualizar ahora» en Ajustes › Escudos: todas las listas activas, aunque no hayan caducado (basta con «Listas de protección»; no hace falta la actualización automática). Cambiar de nivel o de molestias no conecta: usa lo que ya hay | La IP y el User-Agent (el de Firefox, como cualquier web). **Sin cookies** (`credentials: "omit"`, `LOAD_ANONYMOUS`), **sin Referer**, sin caché y con un `Accept-Language` fijo (`en-US,en;q=0.5`), igual en todos los Aegis. Petición condicional (`If-None-Match` / `If-Modified-Since`): si la lista no ha cambiado, no se descarga. **Ojo:** el `ETag` y la fecha que devuelve el servidor de la lista y que Aegis le reenvía después podrían servir a ese servidor para reconocer al mismo navegador aunque cambie de IP (un `ETag` distinto para cada descarga funciona como una cookie); es el precio de no descargar lo que no ha cambiado. Solo https: una redirección a algo que no sea https se corta antes de conectar con ella, y se siguen como mucho 5 | Mantener al día las reglas de bloqueo | «Listas de protección» en `about:conexiones` (`aegis.conexiones.listas`): sin ella no se pide nada, tampoco con «Actualizar ahora». La revisión diaria, además, con «Actualizar las listas solas» en Ajustes › Escudos (`aegis.escudos.listas.actualizar`). Sin listas descargadas, bloquea con la copia de la build |
| EasyList, EasyPrivacy y EasyList Germany: `easylist.to`; Adblock Warning Removal List, EasyList Spanish y EasyList Italy: `easylist-downloads.adblockplus.org` (los mismos autores) | Igual | Igual | Igual | Igual |
| AdGuard (Base, Tracking Protection, molestias y regionales): `filters.adtidy.org` | Igual | Igual | Igual | Igual |
| Brave (Unbreak, Specific): `raw.githubusercontent.com` (brave/adblock-lists) | Igual | Igual | Igual | Igual |

- Qué listas se piden: las activas. Normal y Estricto: uBlock filters (Ads, Privacy, Badware risks, Quick fixes,
  Unbreak), EasyList, EasyPrivacy, AdGuard Base (sin EasyList), Brave Unbreak y Brave Specific. Estricto+ (de serie),
  además AdGuard Tracking Protection (unos 11 MB). Molestias, de serie y con un interruptor por grupo: avisos de cookies
  (uBlock filters – Cookie Notices, AdGuard Cookie Notices), ventanas y banners (uBlock filters – Annoyances, AdGuard
  Popups, Mobile App Banners, Other Annoyances y Widgets) y avisos anti-bloqueador (Adblock Warning Removal List). Y
  las regionales del idioma de la interfaz (es: EasyList Spanish y AdGuard Spanish/Portuguese; pt: AdGuard
  Spanish/Portuguese; fr: AdGuard French; de: EasyList Germany; it: EasyList Italy).
- Cada lista nueva se comprueba antes de usarla (tamaño entre límites, su título «! Title», que no pierda más de la
  mitad de sus reglas y, todas juntas, que el motor las compile); si algo falla, se queda la versión anterior.
- Los recursos que el motor pondría en lugar de un anuncio (y los scriptlets, en pasos posteriores) **nunca** se
  descargan: irán dentro de la build.
- Con un proxy por espacio (fase 6), estas peticiones usan el proxy global, como las demás de esta página.

## Tor (opcional, apagado mientras no se use)

tor no viene con Aegis. Código: `overlay/browser/components/aegis/tor/`; versión y sha256 fijados en `tor/tor.json`
(los escribe `aegis.py tor-fijar` después de comprobar la firma GPG de Tor Browser).

| Conexión | Cuándo | Qué envía | Para qué | Cómo apagarla |
|---|---|---|---|---|
| Descarga del Tor Expert Bundle: `https://dist.torproject.org/torbrowser/<versión>/tor-expert-bundle-windows-x86_64-<versión>.tar.gz`; si esa versión ya no está en dist, `https://archive.torproject.org/tor-package-archive/torbrowser/<versión>/…` (unos 21,5 MB) | **Solo** cuando el usuario pulsa «Descargar Tor» o «Actualizar» en Ajustes › Privacidad › Tor, o acepta el diálogo que sale al pedir una ventana con Tor sin tenerlo. Nunca sola | La IP, el User-Agent y un `Accept-Language` fijo (`en-US,en;q=0.5`). Sin cookies, sin caché y sin Referer. Desde el Aegis normal (no va por Tor: aún no lo hay), así que el Tor Project y la red ven que esta IP descarga Tor | Tener tor | No pulsar el botón. «Borrar» quita todo lo descargado |
| La red de Tor: tor.exe conecta con los relés de directorio y la guarda (por TLS, al puerto que tenga cada relé) | Solo mientras haya abierta una ventana privada con Tor. Al cerrarla, tor se cierra (también si la instancia se cae: TAKEOWNERSHIP y `__OwningControllerProcess`) | Tráfico cifrado de Tor. El proveedor de internet ve que se usa Tor (salvo con puentes) | Ocultar la IP a las webs de la ventana con Tor | Cerrar las ventanas con Tor |
| Puentes obfs4 (opcional): los de `pt_config.json` del paquete, por lyrebird | Como la anterior, solo con «obfs4» elegido en Ajustes | Tráfico obfs4 hacia esas IP (parece aleatorio) | Redes que bloquean Tor | «Sin puentes» |
| Puentes Snowflake (opcional): lyrebird usa *domain fronting* por la CDN de `pt_config.json` (hoy `*.rsc.cdn77.org` con SNI de `app.datapacket.com`) y servidores STUN públicos de esa lista para WebRTC con los proxies voluntarios | Como la anterior, solo con «Snowflake» elegido | La IP a la CDN y a los STUN; tráfico WebRTC cifrado con los proxies Snowflake | Redes que bloquean Tor | «Sin puentes» |
| Conexiones de fondo dentro de la instancia con Tor | **Ninguna:** su perfil es nuevo y nunca acepta las conexiones (la puerta sigue cerrada y `about:conexiones` no sale allí). Si el usuario pulsa «Buscar actualizaciones» dentro de ella, va por Tor | Por Tor (sin salida directa: proxy manual y `network.proxy.allow_bypass` en false) | — | Cerrar las ventanas con Tor |

En el disco del usuario queda, hasta que pulse «Borrar»: el paquete extraído (`<perfil local>/aegis-tor/<versión>/`)
y el estado de tor (`aegis-tor/datos/`: guardas y consenso, como en Tor Browser, para no elegir guardas nuevas cada
vez). El perfil de la instancia (`aegis-tor/perfil/`) se borra al cerrarla; si el Aegis normal estaba cerrado en ese
momento, al abrir la siguiente ventana con Tor o al arrancar.

Ver `docs/ACTUALIZACIONES.md`.


## Buscadores del instalador

Aegis Setup deja elegir DuckDuckGo, Startpage, Brave Search o Google (`instalador.sys.mjs`), y también la bienvenida
del navegador cuando no se pasa por él (`about:bienvenida`, con las mismas funciones). Startpage y Brave Search no
están en la configuración de búsqueda de todas las regiones: si faltan, se añaden en el equipo como buscador del
usuario (`https://www.startpage.com/sp/search?q=…` y `https://search.brave.com/search?q=…`, sin código de socio ni
sugerencias), sin ninguna conexión al añadirlos (el icono sale solo de la caché local de favicons). No son conexiones
de Aegis: solo hay tráfico con el buscador cuando el usuario busca, como con cualquier otro.

## Google

Google no es una conexión de Aegis: solo hay tráfico con Google cuando el usuario lo elige como buscador o abre sus
servicios. Lo que Aegis hace con ese tráfico (`google.sys.mjs`, pref `aegis.google.limpio`, de serie `true`; con
`false` todo esto se apaga sin reiniciar; con los Escudos bajados en una página, no actúa en ella):

- **Buscador:** Google está en la lista de buscadores, sin código de socio (`client=firefox-b-…`; parche
  `0400-privacidad/0002`, y el módulo lo quita también si llega en un enlace). DuckDuckGo sigue siendo el de serie.
  Las búsquedas hechas desde el navegador piden «solo resultados web» (`udm=14`, sin respuestas de IA ni módulos;
  pref `aegis.google.solo_web`, de serie `true`). Las sugerencias mientras se escribe, apagadas (fila de arriba).
- **Se cancela** (telemetría y anuncios; fuente: EasyList, EasyPrivacy y «uBlock filters – Privacy»):
  - dominios enteros de anuncios y analítica: `doubleclick.net`, `googlesyndication.com`, `googleadservices.com`,
    `googletagservices.com`, `google-analytics.com`, `googletagmanager.com`, `imasdk.googleapis.com`,
    `csi.gstatic.com`, `firebaselogging-pa.googleapis.com`. Nunca una página que abre el usuario (un clic en un
    anuncio se abre). En webs que no son de Google, los scripts que SmartBlock sabe sustituir (`analytics.js`,
    `gtm.js`, `gpt.js`, `adsbygoogle.js`, `ima3.js`…) se le dejan a la protección contra rastreo para no romper la
    web; las balizas y los píxeles se cancelan siempre;
  - en `google.<tld>`: `*/gen_204`, `*/client_204`, `/log` (`play.google.com/log`), `/csi`, `/pagead/`,
    `/ads/ga-audiences`, `/ads/measurement`, `/rmkt/`, `/ccm/collect`, `/afs/ads`, `/g/collect`, `*/logImpressions`
    y `*/jserror` (Docs y Drive), y las balizas de clic hacia `/url`;
  - en YouTube: `/api/stats/ads`, `/api/stats/atr`, `/api/stats/qoe`, `/ptracking`, `/csi_204`, `/error_204`,
    `/youtubei/v1/log_event`, `/get_midroll_info`, `/pagead/`, `/pcs/activeview`.
- **Se limpia:** en `google.<tld>/search` se quitan `ved`, `ei`, `sa`, `usg`, `oq`, `gs_lcrp`, `gs_lp`, `aqs`,
  `sca_esv`, `sxsrf`, `iflsig`, `bih`, `biw`, `dpr`, `rlz`, `source`… (lista en el módulo). Al salir hacia otra web,
  el *query stripping* nativo quita `gclid`, `gclsrc`, `dclid`, `gbraid`, `wbraid`, `gad_source`, `gad_campaignid`,
  `srsltid` y `_gl` (`privacy.query_stripping.strip_list`).
- **Enlaces directos:** `google.<tld>/url?q=…` (búsqueda, Gmail, Docs) y `youtube.com/redirect?q=…` van directos al
  destino si el clic sale de una página de Google y el destino es `http(s)`. Un enlace a `/url` desde otra web o
  pegado en la barra no se toca (Google enseña su aviso).
- **Se deja pasar** (hace falta): `accounts.google.com` y el resto del inicio de sesión (también «Iniciar sesión con
  Google» en otras webs), `myaccount.google.com`, `ogs.google.com`, `id.google.com`, `consent.google.com`,
  reCAPTCHA (`www.google.com/recaptcha/`, `www.gstatic.com/recaptcha/`), `www.gstatic.com`, `fonts.googleapis.com`,
  `maps.googleapis.com`, `*.googlevideo.com`, `*.ytimg.com`, `*.ggpht.com`, `*.googleusercontent.com`, las
  sugerencias del cuadro de búsqueda de la propia página, `ogads-pa.clients6.google.com` (menú de cuentas y
  lanzador de apps) y `youtube.com/api/stats/playback` y `/watchtime` (historial de reproducciones y «seguir
  viendo»).
- Lo que Google sigue viendo, en `docs/PRIVACIDAD.md`.

## Otros buscadores

DuckDuckGo (el de serie), Bing, Startpage, Qwant, Ecosia y Wikipedia tampoco son conexiones de Aegis: solo hay tráfico
con ellos cuando el usuario busca o abre sus páginas. Lo que Aegis hace con ese tráfico (`busqueda-limpia.sys.mjs`, pref
`aegis.buscadores.limpio`, de serie `true`; con `false` todo esto se apaga sin reiniciar; con los Escudos bajados en una
página, no actúa en ella). Cada regla sale de una lista de referencia (EasyPrivacy, AdGuard Tracking Protection, AdGuard
URL Tracking Protection, uBlock filters, ClearURLs) o de la documentación del buscador, y está comprobada en Aegis
(`out/pruebas/2026-10-19-buscadores/`, sin red; `out/pruebas-reales/2026-10-19-buscadores/`, con los buscadores de
verdad, búsquedas anónimas):

- **Códigos de socio:** ninguno (parche `0400-privacidad/0002`: sin `t=` en DuckDuckGo, `pc=` en Bing, `segment=` en
  Startpage, `client=` en Qwant ni `tt=` en Ecosia); el módulo los quita también si llegan en un enlace. Además se
  quitan los parámetros fijos de la configuración de Firefox que dicen de dónde viene la búsqueda: `form=MOZLBR` de
  Bing y `sourceid=Mozilla-search` de Wikipedia.
- **Se limpia** (solo en las páginas de resultados de cada buscador; se quedan la búsqueda, la región, el idioma, la
  página, el tipo de resultado y los ajustes):
  - DuckDuckGo: `t`, `from`, `vis`, `perf_id`, `parent_perf_id`, `origin` y `experiment_*` (AdGuard URL Tracking
    Protection). `atb` (la cohorte anónima de instalación) se deja, como hace AdGuard: con la extensión de DuckDuckGo,
    quitarlo rompe su redirección. En el clic en un anuncio (`/y.js`), `ad_domain`, `ad_provider`, `ad_type`,
    `click_metadata`, `iurl` y `vqd` (AdGuard).
  - Bing (`/search`, `/images/search`, `/videos/search`…): `form`/`FORM`, `cvid`, `sk`, `sp`, `sc`, `qs` y `qp`
    (ClearURLs). Solo en las páginas de resultados: quitar `FORM` en todo Bing rompía sus enlaces (AdGuard lo retiró).
    Cuando se busca desde su propio cuadro, la página vuelve a escribir esos parámetros en la barra de direcciones con
    su script, pero la petición sale sin ellos.
  - Wikipedia: `wprov` (procedencia del enlace; AdGuard URL Tracking Protection).
  - Al salir hacia otra web, el *query stripping* nativo quita además `msclkid` (clics de anuncios de Microsoft
    Advertising: ClearURLs y AdGuard), junto a los de Google (`privacy.query_stripping.strip_list`).
- **Enlaces directos:** `duckduckgo.com/l/?uddg=…` (su versión HTML y la ligera; ClearURLs y uBlock filters – Privacy)
  y `bing.com/ck/a?…&u=a1…` (el destino va en base64; regla de uBlock filters – Privacy) van directos al destino si
  el clic sale del propio buscador y el destino es `http(s)`. Las pestañas de Bing (Imágenes, Vídeos…) también pasan
  por `/ck/a` con una ruta de Bing dentro: se resuelven contra Bing. Pegado en la barra o desde otra web, no se toca.
  Startpage y Ecosia ya enlazan directo (comprobado el 2026-10-19). Qwant no se pudo comprobar con el navegador
  automatizado (su protección contra robots pide una verificación, con el módulo y sin él); en su API los resultados
  llevan la dirección directa, y su versión ligera (`lite.qwant.com/redirect/`) no se toca.
- **DuckDuckGo sin IA (`noai.duckduckgo.com`):** las búsquedas hechas desde el navegador (barra de direcciones, nueva
  pestaña, menú contextual) van a `https://noai.duckduckgo.com/?q=…`, la versión sin IA de DuckDuckGo
  (https://duckduckgo.com/duckduckgo-help-pages/ai-features/about-noaiduckduckgocom), la misma dirección que usa su
  extensión oficial «DuckDuckGo No-AI Search». Es una redirección interna: la búsqueda no llega a `duckduckgo.com`. Sí se ve su nombre en el DNS: sin proxy, el navegador resuelve `duckduckgo.com` al abrir la petición, justo antes de redirigirla (con un proxy HTTP o SOCKS con DNS remoto, como Tor, no).
  Pref `aegis.buscadores.sin_ia`, de serie `true`.
  - Qué cambia (código de duckduckgo.com y prueba del 2026-10-19): sin Search Assist ni botones de Duck.ai, y las
    imágenes hechas con IA ocultas (la página pide sus resultados con `hide_ai_images=1`). Explore More (las preguntas
    de seguimiento generadas, ajuste `kbl`) no está entre lo que noai apaga; en las pruebas no apareció ni en noai ni en
    `duckduckgo.com`, así que no está comprobado.
  - Lo que sigue igual: las búsquedas desde su cuadro, la paginación, las imágenes y la región se quedan en noai (comprobado).
  - **Los ajustes guardados en `duckduckgo.com` no pasan a noai.** DuckDuckGo guarda cada ajuste en una cookie solo de
    su host (sin `domain`; visto en su código y en las cookies del navegador): una región, un tema o una búsqueda
    segura elegidos antes en `duckduckgo.com` no se ven en noai, y hay que volver a elegirlos allí una vez. Lo que se
    elige en noai se conserva.
  - Sugerencias: las del navegador siguen yendo a `ac.duckduckgo.com` (las de la configuración de Firefox; la extensión
    oficial usa `noai.duckduckgo.com/ac/`; comparadas el 2026-10-19, las dos dan el mismo tipo de sugerencias, sin
    filtrar nada de IA, y cambian de una petición a otra en las dos: no se añade ese host). Las que pide la propia página
    de noai mientras se escribe en su cuadro van a `noai.duckduckgo.com/ac/`: es la web, no el navegador.
  - La extensión oficial añade `t=noaiext` y `bext=noai`, que la identifican, y cuenta instalaciones con `atb.js` y
    `/exti/`; Aegis no añade nada a la búsqueda y esas dos peticiones las corta (arriba).
- **DuckDuckGo sin anuncios, a elección de cada uno:** interruptor «Quitar los anuncios de DuckDuckGo» en el panel de
  Escudos, que solo sale en DuckDuckGo. Apagado de serie (`aegis.buscadores.sin_anuncios` en `false`): DuckDuckGo pide
  que sus parámetros de ajustes sean de uso individual y que no se quite su publicidad
  (https://duckduckgo.com/duckduckgo-help-pages/settings/params/). Encendido, las búsquedas del navegador llevan `k1=-1`
  («Advertisements: Off») y la búsqueda abierta se recarga así; un `k1` que ya trae la URL se respeta. Apagado, los
  Escudos ocultan igualmente los anuncios que reconocen sus listas.
- **Bing, Qwant y Ecosia:** no hay un parámetro documentado que quite su IA (Copilot y «AI Mode» en Bing; las
  respuestas de IA de Qwant; las de Ecosia, que solo se apagan en sus ajustes, guardados en una cookie). No se inventa
  ninguno: se ve lo que muestre el buscador. Startpage y Wikipedia no tienen.
- **Microsoft Rewards en Bing, a elección de cada uno:** interruptor «Sumar puntos de Microsoft Rewards» en el panel de
  Escudos, que solo sale en Bing. Apagado de serie (`aegis.buscadores.bing_rewards` en `false`): se corta
  `/rewardsapp/reportActivity`, la actividad de búsqueda que Bing envía para sumar puntos, y **las búsquedas no suman
  puntos de Rewards**. Encendido, esa petición pasa. El resto de la telemetría de Bing se corta igual.
- En la página de resultados de un buscador que Firefox conoce (Bing, Google, Wikipedia…), la barra de direcciones
  enseña los términos de búsqueda y oculta los botones de la página (comportamiento de Firefox) salvo el de Escudos, que
  Aegis deja visible (`estilos/interfaz.css`). En noai la barra enseña la dirección: Firefox no la reconoce como la
  búsqueda de DuckDuckGo.
- **Se cancela** (telemetría; nunca una página que abre el usuario):
  - DuckDuckGo: `improving.duckduckgo.com` (sus píxeles de uso y los informes de errores de JavaScript), `*/t/`
    (EasyPrivacy), `/atb.js` y `/exti/` (AdGuard Tracking Protection) y `/collect.js?type=fe-error` (informes de
    errores de la página). El formulario de opinión (`/collect.js?type=feedback`) pasa.
  - Bing: `/fd/ls/l`, `/fd/ls/lsp.aspx`, `*/GLinkPing.aspx`, `*/GLinkPingPost.aspx`, `/mouselog`,
    `/geolocation/write` y, salvo que el usuario lo encienda (arriba), `/rewardsapp/reportActivity` (EasyPrivacy).
    `/geolocation/write` envía la latitud, la longitud y la localidad que Bing deduce de la IP (visto el 2026-10-19).
    uBlock filters – Unbreak anula las reglas de EasyPrivacy de `reportactivity?` y `geolocation/write?`
    (`$badfilter`, uAssets #17650: con un error de red se rompía Bing Chat); Aegis las mantiene porque no contesta con
    un error, sino con la respuesta neutra de Escudos (un 200 vacío).
  - Startpage: `vf.startpage.com`, `/sp/cl`, `/sp/dplpxs`, `/sp/jst`, `/sp/elp`, `/sp/atq/ep2/sodar/` y cualquier
    ping o baliza a `/sp/` (EasyPrivacy y AdGuard Tracking Protection).
  - Qwant: `k.qwant.com` (Piwik PRO), `stats.qwant.com`, `/maps/events`, `/nemo-telemetry/` y los pings de clic
    `/action/click_serp` (EasyPrivacy, AdGuard y uBlock filters). Su medición de rendimiento (`apm`) y el resto de sus
    pings no los corta este módulo: uBlock filters los permite a propósito (`@@||qwant.com^$ping,1p`). Escudos sí corta
    `apm.qwant.com` (EasyPrivacy).
  - Ecosia: `sp.ecosia.org` (Snowplow) y `analytics.ecosia.org` (EasyPrivacy y AdGuard Tracking Protection).
  - Wikipedia: `intake-analytics.wikimedia.org`, `intake-logging.wikimedia.org` y `wikipedia.org/beacon/`
    (EasyPrivacy y AdGuard Tracking Protection).
- **Sugerencias** (si el usuario las activa): las de Startpage se piden a `www.startpage.com/osuggestions?q=…`, la
  dirección de su propio OpenSearch (`cdn.startpage.com/sp/cdn/opensearch/en/opensearch.xml`): la de la configuración de
  Firefox (`/suggestions?partner=apex&format=opensearch&segment=…`) contesta vacía sin el código de socio. Las de Bing,
  sin `form=OSDJAS` (la respuesta es la misma). Las demás, igual que en Firefox.
- **Se deja pasar** (hace falta): los resultados (`links.duckduckgo.com/d.js`, `api.qwant.com`), las sugerencias de las
  propias páginas, el inicio de sesión (`login.live.com`, `bing.com/fd/auth/`, `auth.wikimedia.org`), el contador de
  Microsoft Rewards de quien tiene sesión (`/rewardsapp/ncheader`: enseña los puntos, no los suma), el clic en un
  anuncio y el resto de pings de Qwant.
- **Anuncios y avisos en la página:** los ocultan las listas de Escudos (EasyList, AdGuard, uBlock filters), como en
  cualquier web. Algunas reglas (Bing, Startpage, Qwant) solo los sacan de la vista para que el buscador no detecte el
  bloqueador.
- Lo que los buscadores siguen viendo, en `docs/PRIVACIDAD.md`.

## Contraseñas, códigos de verificación y passkeys: ninguna

El gestor de contraseñas, el diálogo de la contraseña principal y los códigos de verificación (`autenticador/`) no conectan con nada: el medidor de fortaleza, el cálculo de los códigos (TOTP) y la lectura de los códigos QR (jsQR, sobre una captura en memoria de la pestaña o una imagen del disco) se hacen en el equipo, y las páginas de esos diálogos llevan `connect-src 'none'`. «Gestionar en Windows» (passkeys) abre `ms-settings:savedpasskeys` con el sistema: es una dirección local de Windows, no una conexión. Las passkeys las crea y las usa Windows Hello (WebAuthn de Firefox sin cambios); Aegis no las sincroniza.

**Pasar las contraseñas a otro Aegis** (`contrasenas/transferencia/`, Ajustes › Contraseñas y autorrelleno y la página de las contraseñas del asistente de importar) tampoco conecta con nada: crea o lee un archivo `.aegisvault` donde el usuario elige, y el código de 6 palabras, la clave (PBKDF2) y el cifrado (AES-GCM) se hacen con WebCrypto en el equipo. No hay servidor de por medio: el archivo lo lleva el usuario. La lista de palabras del EFF va dentro de Aegis (`palabras.sys.mjs`): se descargó una sola vez de eff.org al desarrollarlo y el navegador nunca la pide. Los dos diálogos llevan `default-src 'none'` y `connect-src 'none'`.

## Versión de la Microsoft Store

Lo mismo que el resto de este documento, con estas diferencias del paquete MSIX (`docs/TIENDA.md`):

- **El actualizador de Aegis no conecta**: en un paquete Firefox lo apaga solo (`isPackagedApp`), así que no se pide
  `update.xml` ni ningún MAR a GitHub, ni con las actualizaciones aceptadas.
- **Las versiones nuevas las baja el servicio de la Microsoft Store de Windows**, no Aegis: es una conexión de
  Windows con Microsoft, como la de cualquier app de la Tienda, y Microsoft sabe qué cuenta ha instalado Aegis.
- **Sin atribución**: Firefox preguntaría a la Tienda en cada arranque con qué «campaña» se instaló
  (`StoreContext`, con la cuenta Microsoft del usuario), sin ninguna pref que lo apague. El parche
  `0400-privacidad/0005-sin-atribucion-msix` lo corta: no se pregunta nada.
- **Códecs:** con «Códecs de vídeo» aceptado, la URL de aus5 lleva la distribución `aegis-msix/1.0` (la del paquete,
  `packaging/msix/distribution.ini`), en lugar de `default/default`.

**Sin el Windows App SDK** (en el paquete y también en el instalador y el zip): en Windows 11 22H2 o posterior, Firefox
cargaría en cada ventana sus DLL, que llevan proveedores de telemetría de Microsoft. Con
`widget.windows.windowsappsdk.enabled` en false (`10-telemetria.js`) no se cargan; las DLL siguen en la carpeta, sin
usarse. Va junto con `widget.windows.mica` en false (`50-interfaz.js`). Eso no quita lo que Windows y la Tienda ven por
su cuenta de cualquier app instalada (la instalación y su uso en el sistema).

## Importar de otros navegadores: ninguna

Ajustes › General › Importar datos (el asistente de Firefox, con los orígenes de Aegis de
`overlay/browser/components/aegis/migracion/`) es **local**: lee los archivos del otro navegador en este equipo
(marcadores, historial y formularios de Brave, Chrome, Edge, Opera, Vivaldi…, de Firefox y de otro perfil de Aegis) y
los fusiona con los del perfil. Las contraseñas entran por un CSV que el usuario exporta y elige o, desde otro Aegis,
por el archivo cifrado con el código de 6 palabras (arriba). Nada de eso conecta.

- **Extensiones, apagadas** (`browser.migrate.chrome.extensions.enabled` en false, `settings/prefs/67-migracion.js`):
  era la única conexión de la importación. Para encontrar el equivalente de cada extensión de Chrome, Firefox manda la
  lista de las del usuario a addons.mozilla.org (`AddonRepository.getMappedAddons`). Sin la pref, el asistente no
  ofrece «Extensiones» y no se pide nada.
- **Tarjetas de pago, apagadas** (`browser.migrate.chrome.payment_methods.enabled` en false): no son una conexión, pero
  irían al almacén de autorrelleno, que no protege la contraseña principal.
- Los iconos del asistente son locales (`chrome://`): los de Brave, Chrome y Edge, de Firefox; el del origen «Firefox»,
  un glifo de Aegis (`migracion/navegador.svg`); el de «Aegis», la marca.

## Lo que ve el autor (no son conexiones de Aegis)

Aegis no se conecta con Secret Studios. Lo que le llega al autor sale de los canales de distribución:

- **Partner Center (Microsoft Store):** estadísticas agregadas de adquisición y de uso de la versión de la Tienda, e
  informes de fallos de Windows (Windows Error Reporting) cuando Aegis falla, según el nivel de datos de diagnóstico de
  Windows: pueden llevar trazas y, en equipos Windows Insider, volcados de memoria. Los envía Windows, no Aegis.
- **GitHub:** el número de descargas de cada archivo de las versiones. Como cada comprobación de actualizaciones baja
  `update-<objetivo>-release.xml`, su contador es un recuento aproximado de comprobaciones. Sin IP ni identidad.
- **El correo de contacto** (`mrsecret_official@protonmail.com`, Proton AG, Suiza): solo lo que la persona escribe.
- **Windows por su cuenta:** al abrir el instalador o el zip de GitHub, SmartScreen y el Control inteligente de
  aplicaciones consultan a Microsoft. No es de Aegis, pero la política de privacidad lo cuenta.

Todo esto está en la política de privacidad pública (`web/privacidad/`, apartados 2 y 7).

## Lo que Aegis corta

Para que se vea lo que se ha cerrado (cada una con la pref que la apaga, en `settings/prefs/`):

| Conexión o dato de Firefox | Para qué era | Dónde se apaga |
|---|---|---|
| Telemetría e informes de fallos | Datos de uso para Mozilla | `10-telemetria.js` y el mozconfig |
| Normandy; estudios y lanzamientos de Nimbus (su colección de Remote Settings no se sincroniza nunca: no está en `aegis.remotesettings.colecciones`, ni con las conexiones aceptadas) | Experimentos de Mozilla | `10-telemetria.js` y `66-conexiones.js` |
| Remote Settings fuera de las colecciones de seguridad y de rastreo: sincronización al arrancar, paquete de arranque, Nimbus, tippytop, `fingerprinting-protection-overrides`, mensajes, búsqueda… | Configuración remota de Mozilla | Parche `0400-privacidad/0003` y `66-conexiones.js` |
| Iconos de webs para los accesos de la nueva pestaña (tippytop, `TopSites.sys.mjs` › `FaviconProvider`). En Firefox, el icono de un acceso se baja del CDN de Mozilla **solo si** el acceso no tiene ya guardado un favicon grande (96 px o más) **y** su dominio está en la colección «tippytop» de Remote Settings, que no viene en la build y solo se llena con un sondeo. En Aegis esa colección no se sincroniza nunca, así que no hay iconos que bajar. Los favicons se siguen guardando al visitar las webs (no se toca `browser.chrome.site_icons`) | Iconos más grandes en los accesos | `66-conexiones.js` (`aegis.remotesettings.colecciones`) |
| Actualizaciones, códecs (aus5, Cisco y Google), push y listas antes de aceptar | — | `66-conexiones.js` y el parche `0400-privacidad/0003` |
| Portal cautivo y comprobación de conectividad (`detectportal.firefox.com`), región por IP | Saber si hay un portal y en qué país estás | `30-red.js` |
| Comprobación de intermediario (MITM): en una página de error de certificado con emisor desconocido, un `HEAD` sin preguntar a `mitmdetection.services.mozilla.com` (`NetErrorParent`), también antes de la bienvenida | Sugerir que un antivirus o un proxy intercepta el tráfico | `40-privacidad.js` (`security.certerrors.mitm.priming.enabled`) |
| Ubicación por red: las redes Wi-Fi cercanas a `www.googleapis.com` (en Linux, si no hay servicio de ubicación del sistema —Portal o Geoclue— o falla; en Windows, Firefox 158 no la usa; sin clave en esta build, así que Google las recibiría sin dar respuesta) | Ubicación por Wi-Fi | `40-privacidad.js` (`geo.provider.network.url` vacío) |
| Precarga de enlaces y conexiones especulativas, también `<link rel=preconnect>`, la cabecera `Link: rel=preconnect` y las «early hints» (se saltaban el límite de conexiones especulativas: resolvían esos dominios al cargar la página) | Abrir páginas antes de pulsar | `30-red.js` |
| Actualizaciones de complementos del sistema (aus5) y caché de metadatos de AMO | Complementos de Mozilla | `30-red.js` |
| Comprobación remota de descargas de Safe Browsing en Google y petición HTTP de fondo de Solo HTTPS | Revisar descargas y probar HTTP | `40-privacidad.js` |
| Código de socio en las URL de búsqueda (no es una conexión: un dato que se quitaba de cada búsqueda) | Acuerdos comerciales de Mozilla | Parche `0400-privacidad/0002` |
| Accesos, noticias, tiempo, fondos y anuncios de la nueva pestaña | Contenido de Mozilla y patrocinadores | `20-nueva-pestana.js` |
| Miniaturas de webs cargadas en segundo plano | Imagen de los accesos | `20-nueva-pestana.js` |
| Mensajes de ASRouter (cfr, message-groups, experimentos) y sus traducciones | Promociones y avisos de Mozilla | `55-mensajes.js` |
| Recomendaciones y panel de descubrimiento de complementos | Sugerencias de addons.mozilla.org | `50-interfaz.js`, `63-complementos.js` |
| Selector de temas de addons.mozilla.org | Temas de colores de Firefox | `56-temas.js` y el parche `0500-ui/0002` |
| Lista de filtraciones de Mozilla Monitor | Avisos de contraseñas filtradas | `61-contrasenas.js` |
| Firefox Relay, Firefox Sync y cuentas de Mozilla | Servicios con cuenta de Mozilla | `40-privacidad.js`, `50-interfaz.js` |
| Buscar en addons.mozilla.org el equivalente de las extensiones de Chrome al importar (con la lista de las del usuario) | Instalar las mismas extensiones | `67-migracion.js` |
| Enlaces a webs de Mozilla para opinar y para cambiar de equipo: «Compartir ideas y opiniones» (Mozilla Connect, `ideas.mozilla.org`, `app.feedback.baseURL`) en el menú Ayuda y «Enviar opiniones» (`#submit-feedback`, la misma dirección) en el diálogo Acerca de; «Share ideas» (`connect.mozilla.org`, `about-firefox.mjs`) en Ajustes › Acerca de › Soporte; y «Cambiar a un dispositivo nuevo» (soporte de Mozilla con parámetros de campaña `utm_*`; con el diseño Nova, un recuadro promocional en Ayuda). No conectaban solos, solo al pulsarlos; se quitan porque no son de Aegis | Opiniones y promoción de Mozilla | Sin pref (solo una política): `estilos/interfaz.css` los oculta en el menú Ayuda de la barra de menús y en el submenú Ayuda del menú principal (con Nova y sin él); `branding/aegis/content/aboutDialog.css`, en Acerca de; `estilos/ajustes.css` (el grupo «Soporte» y sus filas `#setting-control-supportGetHelp` y `#setting-control-supportShareIdeas`), en Ajustes |
| Ayuda de Mozilla (`support.mozilla.org`): «Get help» en el menú Ayuda, «Ayuda de <navegador>» en Acerca de, «Get help» en Ajustes › Acerca de, y los «Learn more» de los paneles de la ventana (información del sitio, permisos, avisos emergentes) y de las páginas de error. Solo al pulsarlos | Ayuda de Firefox, no de Aegis | Sin pref: `estilos/interfaz.css`, `estilos/ajustes.css`, `aboutDialog.css` de la marca y `paginas/errores.css` y `errores-sombra.css` (los de Ajustes y Complementos ya los quitaban sus hojas) |
| «Report Broken Site» (abre `webcompat.com` con la dirección de la web y datos del equipo: con la telemetría apagada, Firefox manda el formulario a la web) y «Report deceptive site…» / «This isn’t a deceptive site…» (`phish-report.mozilla.com`). Solo al pulsarlos | Informes a Mozilla | Sin pref: `estilos/interfaz.css` (los de sitio engañoso, solo mientras `browser.safebrowsing.phishing.enabled` esté apagada, como de serie) |
| Diálogo Acerca de: «diseñado por Mozilla, una comunidad global» (`www.mozilla.org` y `about:credits`), «Haz un donativo» (`foundation.mozilla.org`) y «colabora» (`mozilla.org/contribute`); «Terms of Use» y «Privacy Notice» llevaban a las de Firefox en `mozilla.org`. Solo al pulsarlos | Comunidad y textos legales de Firefox | Los párrafos, `aboutDialog.css` de la marca. Las condiciones y la privacidad llevan ahora a la web de Aegis (`mrsecret-official.github.io/Aegis/legal/` y `…/privacidad/`, o `…/en/legal/` y `…/en/privacy/` si la interfaz no está en español; `acerca.sys.mjs`): un enlace, solo al pulsarlo |
| «Extensions for Developers» (Herramientas del navegador): una colección de Mozilla en `addons.mozilla.org`. Solo al pulsarla | Promoción de complementos | Sin pref: `estilos/interfaz.css` |

**Restos de Firefox que no son conexiones** (decisión del usuario, 2026-10-19: de Firefox, solo lo imprescindible), también fuera: la ilustración del zorro de las páginas de error (`browser.netError.illustration.enabled`, `50-interfaz.js`), el violeta y la letra de Firefox en esas páginas (`paginas/errores.css`), la etiqueta «Firefox Suggest» y las demás etiquetas de grupo de la barra de direcciones (`browser.urlbar.groupLabels.enabled`), la tarjeta «Haz de <navegador> tu editor de PDF» y el aviso de novedades de about:pdf y del visor de PDF (`browser.aboutpdf.promo.dismissed`, `pdfjs.featuresNotificationImpressionLimit`, `55-mensajes.js`), Firefox View, «Restart (Developer)» y su atajo, el dragón de Personalizar (`estilos/interfaz.css` y `AegisArranque.sys.mjs`), los buscadores de socio comerciales de la configuración de Mozilla (Perplexity, eBay, Mercado Livre y Mercado Libre, LEO: ocultos una vez cada uno en la lista de buscadores, también los que aparecen al cambiar el idioma de la app (se ocultan en el siguiente arranque), `AegisArranque.sys.mjs`, `aegis.busqueda.socios_vistos`; el usuario puede volver a ponerlos) y, en Propiedades › Detalles de `firefox.exe`, `private_browsing.exe` y `plugin-container.exe`, la compañía «Mozilla Corporation» y la marca registrada de Firefox (parche `0200-branding/0002`; el copyright de Firefox se queda: es la atribución de la MPL).

Además, en las páginas de Google y YouTube (no son conexiones de Firefox, sino peticiones de esas webs), Google limpio
corta su telemetría y su publicidad: `google.sys.mjs` (`aegis.google.limpio`); detalle en la sección «Google». Y en
las de DuckDuckGo, Bing, Startpage, Qwant, Ecosia y Wikipedia, la búsqueda limpia corta su telemetría y quita sus
parámetros de seguimiento: `busqueda-limpia.sys.mjs` (`aegis.buscadores.limpio`); detalle en «Otros buscadores».

**Webs en oscuro** (apagado de serie) no hace ninguna conexión: el motor va dentro del navegador y solo usa lo que la
página ya ha cargado.
