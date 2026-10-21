# Privacidad en Aegis: lo que protege y lo que no

Aegis quita todo lo que puede sin romper las webs, pero hay cosas que un navegador no puede ocultar. Este documento
lo dice claro (principio 5 de `docs/GUIA.md`, honestidad). Las conexiones que hace Aegis por su cuenta están en
`docs/CONEXIONES.md`.

## Google

Puedes elegir Google como buscador y usar sus servicios (Gmail, Drive, YouTube, Maps). Aegis corta su telemetría y
sus anuncios, limpia las búsquedas y hace directos sus enlaces (detalle en `docs/CONEXIONES.md`, «Google»). Aun así:

- **Google ve tu IP y lo que buscas.** Cada búsqueda llega a Google con tu dirección IP, el texto que buscas, el
  idioma y el User-Agent (el de Firefox, igual que el de millones de personas). Con tu IP puede saber, de forma
  aproximada, dónde estás. Para que no la vea hace falta un proxy o una ventana privada con Tor (más abajo), y por Tor Google pide muchos
  captchas.
- **Con la sesión iniciada, Google sabe quién eres en sus servicios.** Si entras en tu cuenta de Google, todo lo que
  haces en Google, Gmail, YouTube, Maps o Drive queda asociado a tu cuenta, como en cualquier navegador. Aegis no
  puede ni debe impedirlo: es el servicio que usas. Lo que sí hace la protección contra rastreo estricta es que esa
  sesión no te siga a otras webs (las cookies de terceros quedan aisladas por sitio).
- **YouTube sigue contando lo que ves.** Se dejan las estadísticas de reproducción (`/api/stats/playback` y
  `/watchtime`) porque sin ellas no funcionan el historial ni «seguir viendo». Si no quieres historial, desactívalo
  en tu cuenta de Google o usa YouTube sin iniciar sesión.
- **Los anuncios que van dentro de la página dependen de las listas.** El filtro corta las peticiones de anuncios y
  de medición; los resultados patrocinados y los anuncios de vídeo de YouTube llegan en la misma respuesta que el
  contenido y los quitan el filtrado cosmético y los scriptlets de Escudos (más abajo), con las reglas que tengan las
  listas en ese momento. Google cambia a menudo: puede haber días en que alguno se cuele hasta que las listas se
  actualizan.
- **El aviso de cookies de Google** lo ocultan las listas de molestias de Escudos («Avisos de cookies»), si ese grupo
  está encendido: según la regla, se oculta o se rechaza solo (un aviso solo oculto no es un rechazo).
- **En otras webs**, los scripts de Google que la protección contra rastreo sabe sustituir (Analytics, Tag Manager,
  AdSense…) se le dejan a ella para no romper la web. Si las listas de rastreadores todavía no se han descargado, o si
  quitas la protección en una web, esos scripts se cargan, aunque los datos que intentan enviar (balizas y píxeles
  de Google) se siguen cortando.
- **Google puede notar que tu navegador no es un Firefox normal.** Al no recibir su telemetría (`gen_204`,
  `log_event`…) ni los parámetros de seguimiento de la búsqueda, puede distinguir este tráfico, igual que con
  uBlock Origin. Con la sesión iniciada, eso queda asociado a tu cuenta.
- **Los enlaces de los resultados van directos solo si los firmó Google** (los de sus propios resultados). Un enlace
  de Google sin firma, pegado en un comentario o en un documento, sigue pasando por su aviso «te están redirigiendo».
- **Lo que Google sabe por otras vías no depende del navegador:** tu cuenta, tu teléfono Android, el correo que
  recibes en Gmail o lo que otras webs le envían desde sus servidores.

Pendiente (fase 5b): las búsquedas en un contenedor propio que se borra al cerrar, para que Google no vea tu cuenta
al buscar aunque tengas la sesión iniciada en el perfil.

## Los demás buscadores (DuckDuckGo, Bing, Startpage, Qwant, Ecosia, Wikipedia)

Aegis hace con ellos lo mismo que con Google: corta su telemetría, quita los parámetros de socio y de seguimiento de
las búsquedas y hace directos los enlaces de resultados que pasan por su redirección. En DuckDuckGo, las búsquedas que
salen del navegador van a su versión sin IA, `noai.duckduckgo.com` (detalle en `docs/CONEXIONES.md`, «Otros
buscadores»). Aun así:

- **El buscador ve tu IP y lo que buscas**, sea cual sea. Cada búsqueda le llega con tu dirección IP, el texto, el
  idioma y el User-Agent (el de Firefox). Lo que haga después con esos datos depende de su política, no del navegador:
  DuckDuckGo, Startpage, Qwant y Ecosia dicen no crear perfiles; Bing es de Microsoft, que usa las búsquedas para
  personalizar y para sus anuncios. Startpage, Qwant y Ecosia sacan sus resultados y sus anuncios de Google o de Bing,
  así que la búsqueda también les llega a ellos (cada buscador explica en su política qué datos les pasa).
- **Con la sesión iniciada, el buscador sabe quién eres.** Con tu cuenta de Microsoft en Bing (Rewards, historial)
  todo lo que buscas queda en tu cuenta. Aegis no toca el inicio de sesión.
- **Microsoft Rewards lo decides tú.** De serie, Aegis corta la actividad que Bing envía para sumar puntos
  (`/rewardsapp/reportActivity`), así que **tus búsquedas no suman puntos de Rewards**. Si quieres los puntos, enciende
  «Sumar puntos de Microsoft Rewards» en el panel de Escudos (sale solo en Bing): entonces Bing recibe esa actividad.
  El contador de puntos de la página se sigue viendo en los dos casos.
- **Quitar parámetros no te hace anónimo.** Los que se quitan (form, cvid, t, perf_id, sourceid…) dicen de dónde
  viene la búsqueda o la agrupan con otras; la cookie del buscador, tu IP y la propia búsqueda siguen ahí.
- **El buscador puede distinguir el tráfico de Aegis del de Firefox.** Firefox manda sus búsquedas con un código de
  socio (`t=` en DuckDuckGo, `form=`/`pc=` en Bing, `sourceid=` en Wikipedia…) y Aegis sin él; además no recibe su
  telemetría, igual que con uBlock Origin. En DuckDuckGo, Aegis busca en `noai.duckduckgo.com` como quien la escribe a
  mano: la extensión oficial «DuckDuckGo No-AI Search» añade `t=noaiext` y `bext=noai` y Aegis no, así que Aegis no se
  confunde con quien usa esa extensión, sino con quien entra en noai directamente. Con la sesión iniciada, eso queda
  asociado a tu cuenta.
- **Sin IA solo en DuckDuckGo, y con la versión sin IA que ofrece el propio DuckDuckGo.** En noai no salen Search
  Assist ni los botones de Duck.ai, y las imágenes hechas con IA se ocultan. «Explore More» (preguntas de seguimiento
  generadas) no está entre lo que noai apaga y no se ha podido comprobar si sale. Los ajustes que guardaste antes en
  `duckduckgo.com` (región, tema, búsqueda segura) no pasan a noai, porque DuckDuckGo los guarda por dirección: hay que
  elegirlos de nuevo en noai una vez. Con `aegis.buscadores.sin_ia` en `false` (about:config) se vuelve a buscar en
  `duckduckgo.com`.
- **Los anuncios de DuckDuckGo los decides tú.** DuckDuckGo vive de sus anuncios y pide que no se quiten salvo por
  decisión de cada persona. De serie, Aegis no le pide nada: los oculta Escudos con sus listas, como en cualquier web.
  Si prefieres que DuckDuckGo no los muestre, enciende «Quitar los anuncios de DuckDuckGo» en el panel de Escudos (sale
  solo en DuckDuckGo): tus búsquedas llevarán su ajuste «Advertisements: Off» (`k1=-1`).
- **Bing, Qwant y Ecosia no tienen una forma documentada de quitar su IA** (Copilot y «AI Mode» en Bing; las
  respuestas de IA de Qwant y de Ecosia, que solo se apagan en sus ajustes): se ve lo que el buscador muestre, salvo lo
  que oculten las listas de molestias. Sus anuncios los ocultan las listas de Escudos; algunas reglas solo los sacan de
  la vista (la página los sigue recibiendo) para que el buscador no detecte el bloqueador.
- **Bing deduce dónde estás por tu IP.** Su página, además, envía a `/geolocation/write` la latitud, la longitud y
  el nombre de la localidad que ha deducido (comprobado el 2026-10-19). Aegis corta ese envío, pero Bing sigue
  deduciendo la ubicación de tu IP en cada búsqueda.

## Escudos: el bloqueador de anuncios y rastreadores

Escudos bloquea con dos piezas, una detrás de otra:
1. La **protección contra rastreo de Firefox** (ETP), con sus listas (basadas en las de Disconnect). Decide primero.
   Esas listas llegan por Remote Settings y solo después de aceptar «Listas de protección» en `about:conexiones`: sin
   ellas, ETP no reconoce ningún rastreador, recolector de huella digital, criptominero ni botón de red social, y
   SmartBlock (los sustitutos que evitan que una web se rompa al bloquearlos) no actúa. Lo que sí hace sin listas:
   separar las cookies de cada web, la protección de la huella y quitar parámetros de rastreo de los enlaces.
2. El **bloqueador propio**: el motor de Aegis (adblock-rust, el mismo que usa Brave, en la copia que el propio
   navegador ya trae, `etp_engine`) con las listas de sus autores: uBlock filters, EasyList, EasyPrivacy, AdGuard y
   Brave (lista completa y cuándo se renuevan, en `docs/CONEXIONES.md`, «Escudos: listas de filtros»). Lo que ETP no
   ha cortado lo mira el motor.
   - **Bloqueo silencioso.** El bloqueo de ETP es un error de red, y las webs lo usan para detectar el bloqueador.
     Con el motor en marcha, justo antes de que ETP corte una petición (el mismo enganche que usa SmartBlock), Aegis la
     deja seguir y le da una respuesta neutra de su tipo (un script vacío, una respuesta vacía, una imagen de un
     píxel, una hoja de estilos vacía, un marco en blanco, un vídeo mudo; o el sustituto de uBlock Origin si la lista
     tiene uno). A la red no sale nada y la web recibe un 200, no un error. Se bloquea exactamente lo mismo que antes;
     ETP la apunta como bloqueada y el contador la cuenta. Lo mismo con lo que bloquea el motor sin recurso de la
     lista. Se siguen cortando: fuentes, objetos, websockets, balizas e informes de CSP (sin respuesta neutra posible,
     o invisibles para la web) y las peticiones con CORS (fetch o XMLHttpRequest a otro dominio): Firefox no deja leer
     una respuesta falsa en ellas sin delatar una extensión, así que dan error, como con uBlock Origin.
   - **Excepciones por sitio.** Las listas dejan pasar algunos dominios solo en webs concretas porque sin ellos esa web
     se rompe o detecta el bloqueador aunque la respuesta sea neutra (work.ink, por ejemplo, comprueba lo que devuelve
     doubleverify.com). En esas webs, y solo en ellas, ETP deja pasar ese dominio y decide el motor con la regla de
     la lista, que solo deja pasar lo que dice (el resto de ese dominio en esa web queda en manos del motor y sus
     listas). No cuentan las excepciones que solo quitan lo cosmético o dejan abrir ventanas, ni las de webs que son
     un sufijo público (`gouv.fr`). En el resto de webs, nada cambia (`escudos/etp.sys.mjs`).
   - Nadie es indetectable al 100 %: una web que compruebe que un anuncio se ha visto de verdad (no solo que su
     petición ha respondido) notará el bloqueo igual.

- **Niveles:** Normal (ETP «standard» y las listas de serie), Estricto (ETP «strict» y las mismas listas) y
  **Estricto+**, el de serie (Estricto más AdGuard Tracking Protection). Las listas de molestias (avisos de cookies,
  ventanas y banners, avisos anti-bloqueador) van en todos los niveles, cada grupo con su interruptor
  (`aegis.escudos.molestias.*`).
- **Desde el primer arranque y sin conexión:** la build trae una copia de las listas **de filtros** del motor propio.
  Se renuevan solas desde sus autores solo después de aceptar «Listas de protección» en la bienvenida; mientras tanto,
  bloquea con esa copia. Las listas de ETP no vienen en la build: hasta aceptar, lo que se bloquea por lista lo
  bloquea solo el motor propio.
- **Escudos bajados en un sitio:** el motor no toca nada en él (la misma excepción que ETP): ni peticiones, ni
  elementos ocultos, ni scriptlets.
- **Además de cortar peticiones, oculta y neutraliza** (como uBlock Origin y Brave):
  - **Filtrado cosmético:** oculta los huecos de anuncios, los avisos de cookies, las ventanas y los banners que dicen
    las listas, con hojas de estilo de usuario del propio navegador. No se añaden a la página: no salen en
    `document.styleSheets` ni en el DOM.
  - **Scriptlets:** pequeños scripts de la biblioteca de uBlock Origin y de Brave (`set-constant`,
    `abort-on-property-read`, `json-prune`…) que las listas aplican a webs concretas, por ejemplo para que un detector
    de bloqueadores no salte o para quitar los anuncios que llegan dentro de los datos de la página. Corren antes que
    los scripts de la web. Van dentro de la build (uBlock Origin 1.75.0 y brave/adblock-resources fijados): una lista
    solo puede llamarlos con argumentos, nunca meter código suyo. Los que pueden tocar cookies o el almacenamiento
    (`trusted-*`) solo se aceptan de las listas de uBlock Origin.
  - **Recursos neutros:** cuando una regla lo pide (`$redirect`), en vez de cortar un script de anuncios se le da uno
    inocuo con lo que la web espera encontrar (p. ej. un `adsbygoogle.js` vacío), para que no se rompa ni avise.
  - Cada grupo de molestias se apaga en general o por sitio, y por sitio también el cosmético, los scriptlets o los
    anuncios (Ajustes › Escudos).
- **Con uBlock Origin instalado y activo,** Aegis retira su cosmético y sus scriptlets para no pisarse con los suyos;
  sigue cortando peticiones. El contador de Escudos no ve lo que bloquea uBlock Origin.
- **Contador:** de serie cuenta **peticiones** bloqueadas en la página (como Brave); también puede contar orígenes
  (`aegis.escudos.contador`). Lo que corta el motor sale en «Anuncios (listas de filtros)», salvo lo que ETP ya había
  marcado como rastreador. Es aproximado: el motor no dice de qué lista sale cada regla.

Lo que todavía **no** hace, y conviene saber:
- **No bloquea la página que abres:** solo lo que esa página pide después (ni las páginas de la lista de badware de
  uBlock Origin, que tendrán su aviso propio). Tampoco quita parámetros de las direcciones (`$removeparam`) ni pone
  las CSP de las listas (`$csp`): llegan en el paso siguiente.
- **Los marcos `about:blank` y `srcdoc`** (los que una web crea sin dirección propia) no reciben el cosmético ni los
  scriptlets.
- **Las listas no van firmadas por sus autores.** Se piden por https y se comprueban (título, tamaño, que no pierdan de
  golpe la mitad de las reglas, que compilen), pero una lista manipulada en el servidor de su autor podría bloquear u
  ocultar de más o llamar a scriptlets de la biblioteca de la build con otros argumentos. No puede meter código propio
  ni CSS propio (las reglas que se saldrían de su selector se descartan).
- **Los scriptlets se actualizan con Aegis, no con las listas.** Una regla nueva que use un scriptlet que aún no está
  en la biblioteca de la build no hace nada hasta la siguiente versión de Aegis (cada 4 semanas).

**No es invisible (la anti-detección tiene límites).** Lo que sí se oculta: ninguna hoja ni elemento añadido a la
página, ninguna extensión ni dirección `moz-extension://` de Aegis (los pocos sustitutos de SmartBlock que ETP pone
en lugar de algunos scripts conocidos los sirve la extensión de compatibilidad que trae Firefox, como en cualquier
Firefox), los scriptlets que neutralizan los detectores conocidos
antes de que corran, y los recursos neutros para que el script de anuncios «cargue». Lo que una web **sí puede
notar**, y no tiene arreglo general:
- **Los cebos:** una web crea un `<div class="ad-banner">` y mira si se ve (`offsetHeight`, `getComputedStyle`). Si
  Escudos lo oculta, lo ve; si no lo ocultara, tampoco ocultaría el anuncio de verdad. Solo se arregla sitio a sitio,
  con excepciones de las listas.
- **Que algo no cargó:** sin recurso neutro, el script de anuncios falla (`onerror`, un `fetch` rechazado); con
  recurso neutro, una petición `fetch` redirigida enseña una dirección `data:` en `response.url`.
- **Con una CSP estricta,** un recurso neutro en `data:` lo bloquearía la propia web y el navegador le mandaría un
  informe de violación. Escudos lo evita: si la CSP de la página no admite `data:` para ese tipo, corta la petición en
  vez de redirigirla (la web solo ve que no cargó); con una CSP solo de informes (`Report-Only`), siempre la corta. Una
  CSP que se ponga más tarde con `<meta>` se tiene en cuenta en cuanto aparece; lo que se pidiera antes, no. Con
  uBlock Origin activo (sin el cosmético de Aegis) no se conoce la CSP de la página y se corta siempre.
- **El servidor:** si la impresión del anuncio no llega a su servidor, la web lo sabe, haga lo que haga el navegador.
  Tampoco se pueden ocultar las diferencias de tiempos.
- **Los scriptlets cambian la página:** un detector muy elaborado puede ver propiedades con getters raros o un
  `Function.prototype.toString` distinto en lo que sustituyen. En una traza de error salen como un script de la propia
  página.
- **Los filtros procedurales** (los que buscan texto, suben al elemento padre o quitan atributos) sí tocan el DOM: un
  estilo en línea `display: none` o quitar el elemento, como hace uBlock Origin. Los de ocultar con un selector normal
  van en la hoja y no se ven.
- **Es una carrera:** depende de que las listas estén al día (por eso las de arreglos rápidos se revisan a diario).

- **Lo que cuesta:** el motor ocupa unos 75 MB de memoria con Estricto+ (unos 38 MB con Estricto o Normal) y unas
  décimas de segundo al arrancar, ya con la ventana pintada; compilar las listas (el primer arranque y tras cada
  actualización) va en segundo plano. El cosmético para el análisis de cada página hasta tener sus reglas y sus
  scriptlets (unos 10-20 ms por documento en las medidas, sobre todo esperando al proceso principal); el resto (las
  reglas genéricas de clase e id) va después de cargar y solo cuando cambia la página. Medidas en `docs/PLANNING.md`,
  fase 4.

## Webs en oscuro

Ajustes › Apariencia › «Webs en oscuro» hace que las webs se adapten al tema oscuro de Aegis con el motor de Dark Reader
(MIT, va dentro del navegador). **Viene apagado** por esto:

- **Una web puede notar que se ha cambiado su aspecto.** Para oscurecerla, el motor añade a su página estilos y
  atributos propios (`<style class="darkreader">`, `<meta name="darkreader">`, `data-darkreader-*`) y vigila algunas de
  sus funciones de estilo (`insertRule`, `adoptedStyleSheets`, los elementos personalizados). Un script de la web puede
  verlo. Es una señal más para la huella digital: muy poca gente navega con las webs oscurecidas, así que distingue.
  Lo dice también la descripción del ajuste.
- **No usa la red.** No descarga nada al funcionar: ni el motor ni sus arreglos por sitio (van dentro del navegador,
  de la versión 4.9.133). El CSS que necesita lo lee de lo que la página ya ha descargado, y las imágenes de fondo que
  analiza (logotipos e iconos oscuros, para invertirlos), solo de la caché: si no están en la caché, no se analizan y
  se quedan como están. Nada de esto se guarda en el almacenamiento de la web.
- **Lo que se copia a la página.** Para oscurecer una hoja de estilos o un icono de otro sitio, el motor pone en la
  página una versión cambiada (los selectores y colores de esa hoja, el icono invertido), que la página podría leer
  aunque el navegador normalmente no la deja leer recursos de otros sitios. Aegis solo lo hace si ese recurso es del
  mismo sitio o si se pidió sin tu sesión de ese otro sitio (con las cookies de terceros aisladas por sitio o
  bloqueadas, como en Aegis de serie). Con otra política de cookies, esas hojas e imágenes se quedan sin oscurecer.
- **Excepción por sitio.** «Oscurecer este sitio», en el panel de Escudos, apaga la función en ese sitio. Se guarda en
  los permisos del perfil (tipo `aegis-webs-oscuro`), en tu equipo. En una ventana privada se guarda solo en memoria y se
  olvida al cerrarla; allí cuentan también las excepciones de las ventanas normales. «Olvidar este sitio» y borrar los
  datos del sitio la quitan.
- **No es perfecto.** El oscurecido automático se equivoca a veces (un logotipo que no se ve, un texto con poco
  contraste). Si una web se ve mal, apágalo en ella desde el panel de Escudos.

## Huella digital

Una web puede reconocerte sin cookies juntando lo que lee de tu navegador: la pantalla, las fuentes, la tarjeta
gráfica, la zona horaria, el idioma… Aegis lo limita con la protección frente a la huella que trae Firefox, en cuatro
niveles: Ajustes › Privacidad › «Huella digital» o el desplegable «Huella digital» del panel de Escudos. Cada nivel
vale en ventanas normales y privadas. Código: `overlay/browser/components/aegis/huella.sys.mjs`; valores de serie:
`settings/prefs/42-huella.js`.

- **Básica.** Lo que Firefox hace de serie: una marca al azar en la imagen que se saca de un canvas (toDataURL,
  toBlob; los píxeles que se leen con getImageData no cambian), solo las fuentes del sistema y de su
  idioma, operaciones matemáticas iguales en todos los equipos, la resolución en lugar del área libre de la pantalla,
  los núcleos por tramos, los puntos táctiles agrupados y el estilo del editor de idiomas (IME). Nunca hay menos.
- **Equilibrada (de serie).** Además, todo lo que se puede ocultar sin romper las webs normales (inicio de sesión,
  vídeo, mapas, ofimática, videollamadas, juegos web, mandos): la tarjeta gráfica (WebGL dice «Mozilla»), datos de
  WebGPU, la latencia y los canales de audio, el tipo de conexión, los sensores, si la cámara es frontal o trasera, el
  color de la pantalla (24 bits, sRGB), los contadores de fotogramas propios de Gecko y el
  texto de los errores de vídeo. No toca la accesibilidad, la hora, el idioma ni el tema oscuro.
- **Estricta.** Además: la posición de la ventana y del ratón en la pantalla, las barras de la ventana (la web ve
  como tamaño exterior el de la página), la orientación de la pantalla, las fuentes (solo las de Windows de serie),
  las voces de lectura en voz alta, las capacidades de WebGL (texturas de 2048 como mucho) y WebGPU, el HDR, el tipo
  de puntero y el límite de almacenamiento (fijo, desde el siguiente arranque). La pantalla, el audio, los núcleos y el
  canvas quedan como en Equilibrada: probado con webs de huella, cambiarlos te hacía más fácil de reconocer (abajo,
  «Lo que hace más único»). **Alguna web puede fallar:** algún juego o mapa en 3D no arranca o se ve peor, la lectura
  en voz alta de algunas webs se queda sin voces, los textos en escrituras cuyas fuentes vienen de un paquete de idioma
  cambian de fuente y las pantallas táctiles pueden recibir la versión de ratón.
- **Caja fuerte (el uróboros).** Todo lo que sabe ocultar la protección de Firefox salvo si usas tema oscuro o claro
  (forzar el claro deslumbraba, y oscuro o claro lo comparte media Internet) y lo que, probado, te hace más fácil de
  reconocer: el tamaño de la pantalla, la frecuencia del audio y los puntos táctiles quedan como en Equilibrada (abajo,
  «Lo que hace más único»). Las webs ven la hora en UTC, el
  inglés (Aegis pide las webs en inglés y deja tus idiomas como estaban al salir) y 60 fps (en todo el
  navegador; se aplica al reiniciar Aegis, y al salir de Caja fuerte dura hasta el siguiente arranque), no ven tus ajustes de accesibilidad (alto contraste, reducir movimiento, transparencias, colores del
  sistema), reciben el teclado de EE. UU., temporizadores menos precisos, el ratón y el lápiz sin presión, cámaras y
  micrófonos con nombres genéricos y una calidad de vídeo fija (YouTube puede bajar de calidad), no ven los mandos ni
  tienen WebCodecs, el zoom no se recuerda por sitio y dice tener una pantalla de densidad 2 (las webs pueden pedir
  imágenes más grandes). **Sin márgenes (letterboxing)**: encogían la web y se veían mal, así que el tamaño de la
  ventana sí lo ven (con la ventana maximizada, es el de tu pantalla menos la barra, muy común). Un marco con marcas
  de corte alrededor de la web indica que la Caja fuerte está puesta.
  **Muchas webs fallarán.** Y la web tiene que pedir permiso:
  - Para leer un canvas, el aviso del propio navegador (su icono en la barra de direcciones). Si no lo pide un clic
    tuyo, se bloquea sin preguntar; los iframes de otros sitios no pueden.
  - Si el navegador reconoce un intento de sacar la huella (la detección de Firefox de recolectores conocidos de
    canvas y de fuentes), un aviso junto al botón de Escudos: «Permitir en este sitio» o «Seguir bloqueando». Una vez
    por sitio y sesión, y solo si el intento lo hace la propia web (no un iframe de otro sitio metido en ella: para
    ese el permiso no cambiaría nada). **No reconoce todos los intentos**: solo los que se parecen a recolectores conocidos; el resto
    se bloquea igual, pero sin aviso.
  - «Permitir en este sitio» (en el aviso o en la tarjeta del panel de Escudos) baja ese sitio a Equilibrada. Se
    guarda en el perfil como un permiso del sitio (`aegis-huella`): se quita en Ajustes y también al borrar los datos
    de ese sitio (por ejemplo, «Olvidar este sitio» en el historial). Desde una ventana privada no se puede dar
    (quedaría guardado en el disco); los que ya tienes valen también en las privadas. Vale para la página del sitio y
    lo que cargue del mismo sitio: lo que otros sitios metan dentro (iframes) sigue en Caja fuerte. No se puede dar a
    direcciones IP, `localhost` ni a dominios cuya terminación tenga cifras o más de 6 letras (`.photography`):
    Firefox no admite ajustes por sitio para ellos. Lo que es de todo el navegador (idioma pedido, 60 fps,
    colores del sistema, límite de almacenamiento) y lo que Firefox decide sin mirar el sitio (WebCodecs) no cambia
    con el permiso.
  - Si sales de Caja fuerte, los idiomas vuelven a ser los de antes, salvo que los hayas cambiado mientras tanto.

Aegis gestiona `privacy.fingerprintingProtection.overrides` y `.granularOverrides` según el nivel: lo que se ponga a
mano en `about:config` se sustituye al arrancar y al cambiar de nivel o de permisos.

**Lo que hace más único (y por eso Estricta y Caja fuerte no lo ponen).** Medido el 2026-10-15 con Cover Your
Tracks, AmIUnique, CreepJS y BrowserLeaks (`tools/pruebas/reales.py`; resultados en
`out/pruebas-reales/2026-10-15-huella-ajuste/`):
- **Una pantalla del tamaño de la ventana** (ScreenRect, ScreenAvailRect, CSSDeviceSize). El tamaño de la ventana lo
  lee cualquier web, así que no oculta nada, y una pantalla así casi no existe: Cover Your Tracks le daba 17 bits
  (la resolución real, 5) y CreepJS la contaba como de un navegador sin interfaz. Las webs ven la resolución real y
  el área libre como si la barra de tareas midiera 48 px (lo de serie de Firefox).
- **Ruido en los píxeles que se leen de un canvas** (getImageData). CreepJS lo detecta como mentira y, al detectarlo,
  deja el canvas fuera de su huella: el resto, que no cambia, le daba la misma huella en cada sesión. Con la marca al
  azar solo en la imagen que se saca (lo de serie), su huella cambiaba en cada sesión.
- **Audio a 44,1 kHz** (en AmIUnique, los datos de audio coincidían con los del 12 % de los navegadores; con la
  frecuencia real, con los del 30 %) y **4 núcleos fijos** en Estricta (los tramos de serie, 4 u 8, dicen casi lo
  mismo; 4 es menos común que 8 y las webs pesadas reparten menos trabajo). Caja fuerte sí deja los 4 núcleos.
- **10 puntos táctiles** (lo que dice Firefox a todos en Windows con MaxTouchPoints): raro sin pantalla táctil.
Lo que no se ha podido medir: si las voces vacías o las texturas de 2048 te hacen más raro (ninguna de esas webs lo
puntúa aparte). En Caja fuerte, el canvas bloqueado sigue siendo una «mentira» para CreepJS: es el precio de que la web
no pueda leerlo sin tu permiso. Y estas webs guardan cada visita: las pruebas repetidas desde el mismo equipo hacen que
sus «uno de cada N» no valgan para comparar combinaciones raras.

**Lo que siguen viendo las webs, en cualquier nivel:**
- **Tu dirección IP**, y con ella el país y la ciudad aproximados. Para ocultarla hace falta un proxy o una ventana privada con Tor (más abajo).
- **El User-Agent de Firefox** (versión y sistema), igual que el de millones de personas. Nunca lleva «Aegis».
- El idioma y la zona horaria, salvo en Caja fuerte; la resolución de la pantalla, el tamaño exacto de la ventana y
  el tema claro u oscuro, en todos los niveles (también en la ventana privada con Tor: entre sitios con circuitos
  distintos, el tamaño de la ventana puede servir para relacionarlos; maximizada, es el de tu pantalla menos la barra,
  muy común).
- **Que ocultas cosas.** Pocas personas navegan con la tarjeta gráfica «Mozilla» o con todo en Caja fuerte: ocultar
  también es una señal. Pasa igual con Brave o LibreWolf.
- Con los **Escudos bajados** en un sitio, ese sitio no tiene protección frente a la huella (igual que en Firefox).
- Mozilla publica ajustes por sitio para webs concretas que fallan con esta protección (una colección de Remote
  Settings). Aegis no la descarga ni trae copia: ninguna protección se quita por sitio sin que tú lo decidas, pero
  alguna web que Mozilla arreglaba así puede fallar; se arregla con una excepción en el escudo.

**En todos los niveles**, además (no son de la protección frente a la huella): sin UITour (que dejaba a webs de
Mozilla manejar la interfaz), sin los permisos de serie para dominios de Mozilla (instalar desde la tienda de
complementos pide un clic más), WebRTC solo por la ruta por defecto y por el proxy si lo hay, el Referer a otros sitios
solo con el origen, las webs no pueden mover ni cambiar el tamaño de la ventana, los PDF no ejecutan JavaScript (algún
formulario deja de calcular solo) y la señal Global Privacy Control (`Sec-GPC`) también en ventanas normales. Esa
señal pide a las webs que no vendan ni compartan tus datos y tiene valor legal en varios países, pero también es un
dato más: Firefox solo la envía en privado.

**Ninguna protección es perfecta.** Aegis no es Tor Browser: Tor Browser hace que todos sus usuarios parezcan el
mismo navegador y oculta la IP; Aegis reduce lo que una web puede leer, pero una web con empeño puede seguir
distinguiéndote. La ventana privada con Tor usa Tor, y tampoco es Tor Browser (sección siguiente).

## Contraseñas

Aegis usa el gestor de contraseñas de Firefox, más cerrado. Lo que guardas vive solo en tu perfil: `logins.json` (usuarios
y contraseñas, cifrados) y `key4.db` (la clave que los descifra). No sale de tu equipo: sin Firefox Sync, sin Firefox
Relay y sin los avisos de filtraciones de Mozilla Monitor (no se compara nada con ningún servidor). Código:
`overlay/browser/components/aegis/contrasenas.sys.mjs`; prefs: `settings/prefs/61-contrasenas.js`.

**Lo que hace cada medida:**
- **Contraseña principal recomendada (no obligatoria para guardar).** Hasta el 2026-10-20, Aegis no guardaba nada sin
  ella; ahora guarda como Firefox (decisión del usuario: era la única salida del aviso de guardar, «No guardar»). Lo
  que eso significa, sin adornos:
  - **Sin contraseña principal**, las contraseñas van cifradas en `logins.json` con la clave de `key4.db`, que está en
    el mismo perfil y **no lleva contraseña**. En Windows no la protege nada del sistema (ni DPAPI ni Windows Hello: eso
    solo guarda la puerta de «ver», «copiar» y «editar»). Quien copie tu perfil (un programa de los que roban datos de
    navegadores, alguien con tu disco sin BitLocker, otra cuenta de administrador del equipo) **lee todas tus
    contraseñas en segundos**, y quien use tu sesión de Windows puede **entrar con ellas** en las webs (elegirlas en el
    desplegable no pide nada).
  - **Con contraseña principal**, `key4.db` va cifrada con ella (600 000 iteraciones, abajo): una copia del perfil no
    sirve sin adivinarla, y la bóveda se cierra sola (abajo).
  - Mientras no la tengas, el panel «Contraseñas» y `about:logins` lo dicen arriba, en una línea, con el botón «Crear
    contraseña principal». No hay más avisos ni ventanas: guardar funciona como en Firefox.
  - Quien quiera la regla de antes (no guardar nada sin ella): `about:config`,
    `aegis.contrasenas.principal_obligatoria` a `true`.
  - **La siguen pidiendo siempre**, con la pref o sin ella, tres cosas: **pasar las contraseñas a otro Aegis** (las saca
    todas del equipo de una vez; sin ella, bastaría el PIN de Windows o, con la autenticación del sistema apagada,
    nada), **recibirlas de otro Aegis** (llegan con sus códigos de verificación, protegidas en el otro equipo por su
    contraseña principal) y **añadir un código de verificación o cambiar su clave** (abajo). Si no la hay, el diálogo de
    Aegis explica por qué y pide crearla; al crearla, se abre solo lo que habías pedido (sin repetir el paso), y con
    «Cancelar», no se hace nada. No basta con saltarse ese paso: el módulo de la transferencia no verifica la identidad
    ni crea el archivo sin contraseña principal aunque el diálogo de pasar se abra escribiendo su dirección (entonces
    ofrece crearla o dice cómo).
  - **Un solo diálogo, el de Aegis** (`overlay/browser/components/aegis/dialogos/`), para crearla y para cambiarla, venga
    de donde venga (el aviso de guardar, el panel, `about:logins` o Ajustes): sustituye al de Firefox con un
    «override» del manifiesto chrome, sin parche. Explica por qué hace falta, la pide dos veces (con un botón para
    verla), avisa de que **si la olvidas no se puede recuperar** (restablecerla borra todas las contraseñas guardadas:
    es lo que hace Firefox, y la única salida honesta, porque nadie más tiene la clave) y dice qué protege y qué no.
    Al cambiarla pide la actual; NSS la comprueba antes de cambiar nada.
- **Una contraseña principal con un mínimo.** El diálogo no deja crear una que se adivine en los primeros intentos:
  - al menos **12 caracteres**;
  - quitando lo predecible (palabras y contraseñas muy usadas en los seis idiomas, también con sustituciones como
    «p4ssw0rd»; secuencias como «1234» o «abcd»; filas del teclado como «qwerty» o «azerty»; repeticiones como «aaaa»
    o «perroperro»), tienen que quedar al menos 8;
  - al menos 5 caracteres distintos, y ninguna de las contraseñas largas famosas de las listas de filtraciones.
  Debajo del campo, un medidor sobrio (insuficiente, aceptable, fuerte, muy fuerte) con el motivo en texto. Es una
  **estimación sencilla y conservadora**, no una garantía: lo que más ayuda es la longitud, por eso propone una frase
  de cuatro o más palabras. **El medidor no envía ni guarda la contraseña**: se calcula en el propio diálogo
  (`dialogos/fortaleza.mjs`), cuya política de seguridad no le deja conectar con nada (`connect-src 'none'`), sin
  autocompletar ni corrector, y los campos se vacían al cerrarlo. Por qué un mínimo obligatorio: con una copia de
  `key4.db`, la única defensa es que la contraseña cueste de adivinar; las 600 000 iteraciones multiplican el coste de
  cada intento, pero no salvan una contraseña que esté entre las primeras que se prueban.
- **Una clave más difícil de adivinar.** NSS saca la clave de tu contraseña principal con PBKDF2-HMAC-SHA256. Firefox
  usa 10 000 iteraciones; Aegis, 600 000 (lo que recomienda OWASP), así que probar contraseñas con una copia de
  `key4.db` cuesta 60 veces más. Abrir la bóveda tarda unos 0,3 s, una vez por sesión. Vale al crear o cambiar la
  contraseña principal: si ya la tenías, cámbiala (puede ser por la misma) para reforzarla. Aun así, **una contraseña
  principal corta o conocida se adivina**: usa una frase larga que no uses en ningún otro sitio.
- **Se cierra sola** (solo con contraseña principal: sin ella no hay nada que cerrar). Tras un rato sin usar el equipo, **al suspender el equipo** y al cerrar Aegis, la bóveda se
  cierra y lo siguiente que necesite una contraseña vuelve a pedir la principal. El rato lo eliges en Ajustes ›
  Contraseñas y autorrelleno › «Cierre automático de la bóveda»: Nunca, 15, 10 (de serie), 5, 3, 2 o 1 minutos
  (`aegis.contrasenas.bloqueo_minutos`; un valor fuera de la lista se lleva al más cercano). El cambio vale al momento.
  Con «Nunca», solo se cierra al cerrar Aegis o al suspender el equipo. La inactividad la avisa el servicio de
  inactividad del navegador (solo mientras la bóveda está abierta) y la suspensión, un aviso del sistema
  (`sleep_notification`): no hay nada que sondear ni temporizadores.
  - **Bloquear Windows (Windows + L) no la cierra al momento:** Firefox recibe ese aviso de Windows pero no lo pasa a
    su código JavaScript, y hacerlo exigiría un parche en C++. Mientras la pantalla está bloqueada nadie usa el equipo,
    así que se cierra igualmente pasado el tiempo elegido (con «Nunca», no).
- **Al copiar una contraseña** (del panel o de `about:logins`), Firefox la marca como sensible: Windows no la guarda en
  el historial del portapapeles (Windows + V) ni la sincroniza con otros equipos. No se borra sola del portapapeles:
  eso pediría un temporizador por cada copia en el código de Firefox. Pega y copia otra cosa cuando termines.
- **Ver, copiar y editar piden autenticación.** En Windows, la de tu sesión (Windows Hello, PIN o tu contraseña de
  Windows), también sin contraseña principal (sin ella, es lo único que hay entre quien use tu sesión y tus
  contraseñas a la vista; elegirlas en el desplegable de una web no la pide); con la bóveda cerrada, la contraseña
  principal. Después de autenticarte,
  Firefox no lo vuelve a pedir durante 5 minutos en esa página (es fijo en su código). En Linux no hay autenticación del
  sistema: solo la contraseña principal.
- **No se exportan en claro.** «Exportar contraseñas» (un CSV con todas legibles) no está en el menú y, aunque se
  llame por otro camino, no escribe nada. A otro Aegis se pasan cifradas, con un código de 6 palabras (abajo, «Pasar
  las contraseñas a otro Aegis»). Si necesitas llevártelas a otro navegador antes de que llegue la exportación cifrada
  para ellos, actívala en `about:config` (`aegis.contrasenas.exportar_en_claro`): seguirá pidiendo autenticación.
  Borra el archivo en cuanto lo importes.
- **No rellena solo.** Al cargar una página no se escribe nada en los campos: eliges la cuenta en el desplegable del
  campo. Así ninguna web (un script inyectado, un formulario oculto o invisible, un script de terceros que lee los
  campos) recibe tu contraseña sin un clic tuyo.
  - Solo se ofrecen las del sitio exacto, no las de otros subdominios: si guardaste una en `cuenta.ejemplo.com` y
    entras en `ejemplo.com`, no saldrá en el desplegable (búscala en el panel).
  - Las guardadas para un sitio https nunca se ofrecen en http.
  - En un iframe de otro sitio no se rellena nunca solo. Si eliges tú una cuenta en un campo dentro de un iframe, se
    ofrecen solo las del sitio de ese iframe, nunca las de la página que lo contiene.
- **Sin diálogos de inicio de sesión de otros sitios.** Una imagen o un script de otro sitio metido en una página no
  puede abrir el diálogo de usuario y contraseña de HTTP (una forma conocida de suplantar un inicio de sesión).

**Lo que no protege:**
- **Sin contraseña principal, una copia de tu perfil:** `key4.db` no lleva contraseña y descifra `logins.json` en
  cualquier equipo. Es lo mismo que en Firefox sin contraseña principal. Créala si guardas algo que importe.
- **Un programa malicioso que ya controla tu sesión de Windows** puede registrar lo que tecleas (también la contraseña
  principal), leer la memoria de Aegis mientras la bóveda está abierta o capturar la pantalla. Ningún navegador puede
  impedirlo. Lo que sí evita la contraseña principal es el robo «en frío»: copiar tu perfil y descifrarlo en otro sitio.
- **Alguien delante de tu equipo desbloqueado, con la bóveda abierta,** puede entrar en webs con tus cuentas (elegir
  una cuenta en el desplegable no vuelve a pedir nada), aunque no pueda ver las contraseñas. Bloquea Windows al
  levantarte (Windows + L); pasado el tiempo que hayas elegido, la bóveda se cierra igualmente (con «Nunca», no).
- **`about:logins` o el panel abiertos** guardan en memoria lo que ya han cargado hasta que los cierras.
- **El phishing:** en una web falsa (otra dirección) el desplegable no ofrece tu contraseña, pero si la escribes tú a
  mano, la web la recibe.
- **Una web legítima con un fallo de seguridad (XSS)** puede leer lo que eliges o escribes en sus campos; sin relleno
  automático, al menos no se lleva nada sin que tú lo pidas.
- **Copias antiguas del perfil:** si creas la contraseña principal después de guardar contraseñas, una copia de
  `key4.db` hecha antes (una copia de seguridad, por ejemplo) sigue sin ella.

**«Impenetrable» no existe.** Esto hace mucho más difícil robar tus contraseñas de una copia del perfil o desde una
web, pero no las protege de alguien que ya controla tu equipo.

### Códigos de verificación (autenticador)

Cada inicio de sesión guardado puede llevar el código de la verificación en dos pasos (TOTP, el de Google
Authenticator o Bitwarden: 6 u 8 cifras que cambian cada 30 s). Se añade desde el panel «Contraseñas» o desde
`about:logins`, pegando la clave de configuración o el enlace `otpauth://` que da la web, o leyendo su código QR de la
pestaña que se está viendo o de una imagen. Código: `overlay/browser/components/aegis/autenticador/` y
`dialogos/autenticador.*`; prefs: `settings/prefs/61-contrasenas.js`.

**Cómo se protege:**
- **Cifrado con la clave de las contraseñas.** Los secretos van en `aegis-autenticador.json`, en el perfil, cifrados
  con la misma clave de `key4.db` que cifra `logins.json` (SDR de NSS), así que dependen de la contraseña principal.
  **Añadir un código, cambiar su clave o recibirlo de otro Aegis la exigen siempre**, aunque guardar contraseñas ya
  no la exija: sin ella, quien copie el perfil tendría los dos pasos de la cuenta. Si no la hay, el diálogo de Aegis
  pide crearla antes de abrir el de los códigos, y el módulo se niega a guardar ningún secreto sin ella (se llegue por
  donde se llegue). **Quitar uno, no:** si quitas la contraseña principal en Ajustes, los códigos que ya tenías se
  quedan, con la misma protección que tus contraseñas; su diálogo se abre igual para quitarlos, y si intentas cambiar
  la clave, dice cómo crear la contraseña principal. En claro solo quedan el identificador del inicio de sesión y su
  origen (los mismos que ya están en claro en `logins.json`): así Aegis sabe si una web tiene código sin descifrar
  nada. Nada va a las prefs.
  - Por qué un archivo aparte y no un campo de la entrada: Firefox 158 no tiene ningún campo para esto, y el único
    libre es de Firefox Sync, que lo reescribe. El archivo aparte no cambia el formato de `logins.json`. Al borrar
    un inicio de sesión (o todos, también al restablecer la contraseña principal), se borra su código.
- **El secreto no sale del proceso principal.** El código se calcula ahí (HMAC-SHA1, SHA-256 o SHA-512, como diga la
  web) y al panel, a `about:logins` o a la web solo llegan las cifras.
- **Ver o copiar un código pide verificar tu identidad** (Windows Hello, o la contraseña principal con la bóveda
  cerrada), como ver una contraseña; después, 5 minutos sin volver a pedirlo. Se ven ocultos («••• •••»).
- **Copiar lo marca como sensible** (fuera del historial del portapapeles de Windows) y lo borra a los 30 s si sigue
  ahí (`aegis.autenticador.portapapeles_segundos`; también al cerrar Aegis). Es un único temporizador que se pone al
  copiar y se va al dispararse: nada corre en reposo. Lo que copies después no se toca.
- **La cuenta atrás solo corre con un código a la vista y el panel o la página visibles**, y como mucho 2 minutos.
- **Autorrelleno:** al enfocar el campo del código (`autocomplete="one-time-code"` o un campo corto con un nombre
  claro) en una web **https** cuyo origen es exactamente el de la entrada guardada, sale un panelito «Rellenar el
  código» junto al campo. **Nada se escribe sin tu clic**, ni en marcos (tampoco del mismo sitio) ni en `http`. Ofrecerlo
  no descifra nada ni pide la contraseña principal. El observador de los campos solo existe en las páginas mientras
  tengas algún código guardado (`aegis.autenticador.rellenar` lo apaga).
- **Leer un QR no conecta con nada:** la captura de la parte visible de la pestaña o la imagen elegida se decodifican
  en memoria con jsQR (Apache-2.0, `NOTICE.md`) y no se guardan. El diálogo no puede conectar (`connect-src 'none'`).
- **Nunca se exportan en claro.** La exportación de contraseñas (CSV) no los incluye; una copia del perfil los lleva
  cifrados. Solo salen, cifrados con el código de 6 palabras, en el archivo para otro Aegis, y solo si dejas marcada
  la casilla (abajo, «Pasar las contraseñas a otro Aegis»).

**Lo que no protege, y lo que hay que saber:**
- **Juntar los dos pasos en la bóveda.** La verificación en dos pasos existe para que una contraseña robada no baste.
  Si el código vive junto a la contraseña, quien abra tu bóveda tiene los dos. Lo mitigan la contraseña principal
  (obligatoria para añadir códigos, con su mínimo), la KDF reforzada y la verificación al ver o copiar, pero **para tus cuentas más
  importantes, un autenticador en otro dispositivo es más seguro**. El diálogo lo dice.
- **El autorrelleno no verifica tu identidad** (como el de las contraseñas): con la bóveda abierta, alguien delante de
  tu equipo desbloqueado puede rellenar un código en la web de la cuenta.
- **Un programa malicioso que controla tu equipo** puede leer los códigos igual que las contraseñas.
- **Solo TOTP.** Los códigos por contador (HOTP), los de Steam y las exportaciones de Google Authenticator
  (`otpauth-migration://`) no se admiten.

### Passkeys

Las passkeys (claves de acceso) las crea y las guarda **Windows Hello**: con chip de seguridad (TPM), la clave privada
vive en él y no sale; sin TPM, Windows la protege por software. Ni Aegis ni las webs pueden copiarla. Aegis usa WebAuthn de Firefox tal cual (sin parches ni prefs
`security.webauthn.*` cambiadas) y no tiene bóveda propia de passkeys. El panel «Contraseñas» tiene una sección
«Passkeys» que lo explica y un botón «Gestionar en Windows» que abre Configuración › Cuentas › Claves de acceso
(`ms-settings:savedpasskeys`, una dirección local de Windows). Firefox no da una lista fiable de qué sitios tienen
passkey, así que Aegis no la inventa. **Las de Windows Hello no se sincronizan** con otros equipos (si en el aviso de
Windows 11 se elige otro proveedor de passkeys, las guarda ese proveedor, con sus reglas): si pierdes el equipo, entra con otro
método de la web (otra passkey, códigos de recuperación) y bórrala desde la propia web.

### Pasar las contraseñas a otro Aegis (código de 6 palabras)

Aegis no exporta en claro, así que para llevar las contraseñas a otro Aegis (otro perfil de este equipo o el de otro
equipo) crea un archivo cifrado (`.aegisvault`) que solo se abre con un **código de 6 palabras**. No hay servidores ni
conexiones: el archivo lo llevas tú (una memoria USB, tu nube). Código:
`overlay/browser/components/aegis/contrasenas/transferencia/` (`formato.sys.mjs`: el código, la clave y el formato;
`transferencia.sys.mjs`: lo que hace el navegador) y `dialogos/transferencia-*`; prefs:
`settings/prefs/61-contrasenas.js`; prueba sin navegador: `tools/pruebas/transferencia.mjs`.

**Cómo se usa:**
- **Pasar** (en el Aegis de origen): Ajustes › Contraseñas y autorrelleno › «Pasar a otro Aegis» › «Crear archivo…».
  Pide verificar tu identidad (Windows Hello o, con la bóveda cerrada, la contraseña principal) **siempre**, sin los
  5 minutos de gracia de `about:logins`; eliges dónde guardar el archivo en el selector del sistema y ves el código
  **una sola vez**, con un botón «Copiar». Aegis no lo guarda en ningún sitio, y el perfil de origen no apunta nada.
- **Recibir** (en el de destino): Ajustes › Contraseñas y autorrelleno › «Recibir de otro Aegis», o Ajustes › General
  › Importar datos › «Aegis» (en la página de las contraseñas, «Seleccionar archivo» elige el archivo y luego se pide
  el código; si entran, el asistente sigue con lo demás). Al terminar dice cuántas son nuevas, cuántas se han
  actualizado y cuántas ya estaban, y ofrece borrar el archivo.

**Qué lleva el archivo:** por cada inicio de sesión, el origen, el origen del formulario, el ámbito de la autenticación
HTTP, el usuario, la contraseña, los nombres de los campos y las fechas de creación, último cambio y último uso. **Sin**
el identificador interno (GUID), sin el contador de usos y sin nada del equipo ni del perfil. Y, salvo que desmarques la
casilla, el **código de verificación** (TOTP) de cada cuenta:
- Viven aparte, en `aegis-autenticador.json`, cifrados con la misma clave de la bóveda (arriba, «Códigos de
  verificación»); para el paquete se descifran tras la misma verificación de identidad y van dentro del mismo cifrado,
  junto a su inicio de sesión (sin otro identificador que el sitio y el usuario).
- Con ellos, **el archivo lleva los dos pasos de esas cuentas**: el diálogo lo dice antes de crearlo.
- Al recibirlos se comprueban como los que se pegan a mano y solo se guardan en cuentas que no tengan ya uno.

**El formato (versión 1):**

```
{"formato":"aegisvault","version":1,"kdf":"PBKDF2-SHA256","iteraciones":2000000,"sal":"…","cifrado":"AES-256-GCM","iv":"…"}
<texto cifrado con AES-256-GCM, con su etiqueta de 16 bytes al final>
```

- **Cabecera en claro:** JSON en UTF-8 en una sola línea, terminada en un salto de línea (0x0A); la sal (16 bytes
  aleatorios) y el IV (12 bytes aleatorios) en base64url sin relleno. Nada del usuario ni del equipo. Va también como
  **datos autenticados (AAD)**, tal cual está en el archivo: cambiar un byte de la cabecera hace fallar el descifrado.
- **Clave:** PBKDF2-HMAC-SHA256 de WebCrypto (en el proceso principal) sobre el código normalizado en UTF-8, con esa sal
  y **2 000 000 de iteraciones**, para una clave AES-256 que no se puede extraer. Medido el 2026-10-17 en el equipo de
  pruebas: 0,36 s en node 22 (OpenSSL); por la relación de NSS (las 600 000 de `key4.db` tardan unos 0,3 s en Aegis),
  alrededor de 1 s en el navegador, una vez al crear y otra al recibir. Es un valor fijo del formato, no una pref.
- **Cifrado:** AES-256-GCM con el IV de la cabecera y etiqueta de 128 bits.
- **Dentro:** 4 bytes con la longitud del JSON (big-endian), el JSON (`{"id":"<16 bytes aleatorios>","creado":<ms desde
  1970>,"contrasenas":[…]}`) y ceros hasta un múltiplo de 4096 bytes, para que el tamaño no diga cuántas contraseñas
  hay: con pocas, el archivo mide lo mismo (en la prueba, de 0 a 11 contraseñas, 4271 bytes); con más, solo se ve el
  orden de magnitud (unos 300 bytes por contraseña).
- Es estándar (PBKDF2 y AES-GCM): cualquier biblioteca de cifrado lo abre con el código y esta descripción.

**El código:**
- 6 palabras de la lista grande del EFF (7776 palabras en inglés, CC BY 3.0, `NOTICE.md`): log2(7776⁶) ≈ **77,5 bits**.
  Se eligen con `crypto.getRandomValues` y rechazo (los valores de 32 bits que darían más peso a unas palabras se
  descartan), así que cada palabra es igual de probable; la prueba lo comprueba con millones de tiradas.
- Se escribe como se quiera: se pasa a NFKC y minúsculas, y todo lo que no sea una letra de la «a» a la «z» (espacios,
  guiones, saltos de línea, la numeración) cuenta como una separación. «T-Shirt» y «t shirt» valen igual. De las cuatro
  palabras con guion (drop-down, felt-tip, t-shirt, yo-yo), «down» y «shirt» sí están sueltas en la lista, pero
  «drop», «felt», «t» y «yo» no: ninguna de las cuatro se puede leer como dos palabras de la lista, así que no hay dos
  códigos que se escriban igual.
- **Cuánto resiste:** cada intento de adivinarlo cuesta 2 millones de HMAC-SHA256. Con una tarjeta gráfica de gama alta
  (del orden de 4000 intentos por segundo con estas iteraciones), recorrer la mitad de los códigos llevaría cientos de
  miles de millones de años; con un millón de tarjetas, cientos de miles. Lo que lo rompe no es la fuerza bruta, sino
  ver el código: no lo mandes con el archivo ni lo apuntes donde se vea.

**Una sola vez y 24 horas: lo comprueba Aegis, no el cifrado.**
- El paquete lleva dentro su identificador aleatorio y su hora de creación, que solo se leen con el código. El Aegis
  que lo recibe rechaza los de más de 24 h (y los fechados más de 5 minutos en el futuro: la hora de uno de los dos
  equipos está mal) y apunta el identificador en `aegis.contrasenas.transferencia.usados`, con su hora, para rechazar
  el mismo paquete otra vez; lo olvida pasadas 24 h, cuando ya caducaría. La pref no dice nada de las contraseñas ni de
  quién las mandó.
- **Honesto:** son reglas del Aegis que importa. Quien tenga el archivo y el código puede descifrarlo con otro programa
  a cualquier hora, y otro perfil de Aegis lo aceptaría una vez más (cada perfil lleva su lista). **Lo que de verdad
  protege el archivo es el código.** El de origen no guarda nada: si pierdes el archivo o el código, crea otro.

**Errores sin pistas:** con el código mal escrito o con el archivo tocado (un byte de la cabecera, la sal, el IV, el
cifrado o la etiqueta), AES-GCM no descifra, y el mensaje es el mismo para los dos casos: «El código o el archivo no
son correctos». Caducado y ya importado se dicen aparte porque solo se saben con el código bueno; una versión más nueva
del formato, también (está en la cabecera, sin secretos). Antes de derivar la clave, que es lo que cuesta, se rechaza
lo que no cuadre: iteraciones fuera de 600 000–5 000 000 (un archivo manipulado no puede tener el equipo ocupado
minutos), sal o IV de otra longitud, claves de más en la cabecera, un tamaño que no sea múltiplo de 4096 más la
etiqueta y archivos de más de 32 MiB.

**Al recibir:** entran por el importador de Firefox (`LoginHelper.maybeImportLogins`), que no duplica las que ya están
(mismo sitio y usuario) y, si la del archivo es más reciente, actualiza la contraseña. **Pasar y recibir piden siempre
la contraseña principal**, aunque guardar una contraseña ya no la exija: si no la hay, se ofrece crearla antes de abrir
el diálogo; con la bóveda cerrada, se pide una vez.

**Portapapeles:** «Copiar el código» lo marca como sensible (fuera del historial del portapapeles de Windows) y lo borra
a los 60 s si sigue ahí (`aegis.contrasenas.transferencia.portapapeles_segundos`; también al cerrar Aegis). Firefox no
tiene un borrado propio: es un único temporizador que se pone al copiar y se va al dispararse, como el de los códigos de
verificación; nada corre en reposo. Lo que copies después no se toca.

**Memoria:** los bloques de bytes con el contenido en claro (lo que se cifra y lo descifrado) y los del código se
rellenan con ceros en cuanto dejan de hacer falta, y la clave AES no se puede extraer. Las contraseñas como texto de
JavaScript (al leerlas de la bóveda y al descifrarlas) no se pueden borrar a mano: las libera el recolector de
basura, como en `about:logins`.

**Lo que no protege:**
- **El archivo y el código juntos** (en el mismo correo, en la misma carpeta de la nube) son tus contraseñas.
- **Un programa malicioso en cualquiera de los dos equipos** puede leer el código en la pantalla, la memoria o lo que
  tecleas.
- **Borrar el archivo** («Borrar el archivo» o a mano) lo quita como cualquier otro, sin sobrescribirlo, y en un SSD o en
  la nube pueden quedar copias: sin el código no sirven, pero bórralas también.

## Sesiones

Ajustes › Privacidad › Sesiones › **«Cerrar las sesiones al salir de Aegis»**: opción de mayor seguridad, **apagada de
serie** (decisión del usuario, 2026-10-21: iniciar sesión cada vez molesta a la mayoría). De serie, Aegis guarda las
sesiones como Firefox. Código: `overlay/browser/components/aegis/sesiones.sys.mjs` (interruptor en `ajustes.sys.mjs`).

**Qué hace.** No es un borrado propio: enciende la limpieza al cerrar de Firefox (`Sanitizer.sys.mjs`) solo con lo que
cierra las sesiones, y la sesión guardada sin datos de las webs:
- `privacy.sanitize.sanitizeOnShutdown` y `privacy.clearOnShutdown_v2.cookiesAndStorage`: al cerrar se borran, de cada
  web http, https o file, sus cookies y sus datos (`CLEAR_COOKIES_AND_SITE_DATA` en Firefox 158: cookies,
  `localStorage`, IndexedDB, Cache API, suscripciones push, HSTS, licencias de DRM, inicios de sesión HTTP y tokens en
  memoria, permisos de acceso al almacenamiento, estado de la protección contra rastreo por rebote).
- `privacy.clearOnShutdown_v2.cache`: también la caché, como la casilla «Eliminar cookies y datos de los sitios al
  cerrar» de Firefox (así las dos dicen lo mismo).
- `privacy.clearOnShutdown_v2.browsingHistoryAndDownloads`, `.formdata` y `.siteSettings` en false. **Ojo:** Firefox
  trae las dos primeras de la caché y del historial a true, así que encender solo `sanitizeOnShutdown` borraría también
  el historial y las descargas. Si la limpieza al cerrar ya estaba encendida (elegida en «Historial»), esas tres se
  dejan como estaban. Antes de cambiar nada se hace la migración de Firefox a las prefs `_v2`
  (`Sanitizer.maybeMigratePrefs`, como su casilla): si no, la del primer cierre copiaría encima las antiguas
  `privacy.clearOnShutdown.*`, con el historial y los formularios a true.
- `browser.sessionstore.privacy_level` = 2: la sesión guardada (`sessionstore.jsonlz4`, para restaurar las pestañas)
  no lleva las cookies de sesión ni lo escrito en los formularios de ninguna web.

**Qué no se borra:** el historial, las descargas, los formularios, los marcadores, las contraseñas (`logins.json` y
`key4.db`: la limpieza no los toca), los códigos de verificación, los permisos de cada web (cámara, notificaciones…),
las excepciones de los Escudos y de la huella, la configuración de Aegis y los datos de las extensiones (solo se
borran webs http, https y file). Con esta limpieza Firefox borra además los identificadores de cámara y
micrófono que da a las webs (`CLEAR_MEDIA_DEVICES`) y las conversaciones de su ventana con IA (Smart Window), estas
solo si se ha aceptado usarla (`browser.smartwindow.tos.consentTime`).

**Excepciones.** «Webs que conservan la sesión» abre el diálogo de Firefox de las excepciones de la limpieza al cerrar
(permiso `persist-data-on-shutdown`, solo «Permitir»): esas webs y sus subdominios conservan sus cookies y sus datos.
En Firefox 158 es un permiso aparte: el «Permitir» de las excepciones de cookies ya no salva a una web de la limpieza
(Firefox copió una vez los que había, `ProfileDataUpgrader`, versión 176), y una web con «Permitir para la sesión» se
borra siempre al cerrar, con este interruptor o sin él.

**Apagarlo** devuelve cada pref al valor que tenía antes de encenderlo (guardado en `aegis.sesiones.previo`), salvo
las que se hayan cambiado después desde otro sitio (Ajustes › Historial, about:config), que se respetan. Si se
encendió con la casilla de cookies de Firefox, se apaga como la apaga ella.

**Lo que protege:** que alguien que **copie tu perfil** (una copia de seguridad, el disco de un equipo robado o
prestado, la carpeta en la nube) entre en tus cuentas con tus cookies: al cerrar Aegis ya no están, ni en el perfil ni
en la sesión guardada.

**Lo que no protege:**
- **Un programa malicioso mientras Aegis está abierto**: las sesiones están en el equipo hasta que cierras, y un
  programa así puede leerlas o leer lo que tecleas.
- **Un cierre a la fuerza** (un fallo, un apagón, matar el proceso): no hay limpieza en ese momento. Firefox la deja
  apuntada (`privacy.sanitize.pending`) y la hace en el siguiente arranque; hasta entonces, las cookies siguen en el
  disco.
- **Lo que las webs guardan en sus servidores**: cerrar la sesión en el navegador no la cierra en el servidor; para
  eso, «Cerrar sesión» en la web.
- **Los datos que las webs con excepción** conservan, a propósito.

Mientras está encendido, el desplegable «Historial» de Firefox pasa a «Usar una configuración personalizada» (con
`sanitizeOnShutdown` encendida, Firefox ya no lo considera «Recordar historial»); elegir otra vez «Recordar historial»
apaga la limpieza al cerrar y, con ella, este interruptor.

## Perfiles

Borrar otro perfil desde la ventana de perfiles (`perfiles.sys.mjs`) quita su carpeta, la de `%LOCALAPPDATA%` (caché),
su acceso directo del escritorio si lo tenía y su imagen de avatar propia si ningún otro perfil la usa. **Lo que no se
borra:** al borrar el perfil **en uso** (por `about:deleteprofile`, el camino de Firefox, que cierra Aegis) una imagen
de avatar propia se queda en `%APPDATA%\Aegis\Profile Groups\avatars\` hasta que la borres a mano. Nunca sale del
equipo.

## Ventana privada con Tor

Menú ☰ › «Nueva ventana privada con Tor» (Ctrl+Mayús+U), como en Brave. Opcional: tor no viene con Aegis y se descarga
aparte, solo si lo pides (Ajustes › Privacidad › Tor), del Tor Project y comprobado con un sha256 fijado en Aegis.
Código: `overlay/browser/components/aegis/tor/`; conexiones: `docs/CONEXIONES.md`, «Tor».

**Qué hace.** Abre otro Aegis aparte, con su propio perfil de usar y tirar, en el que todas las ventanas son privadas
y todo el tráfico va por Tor:

- **Las webs ven una IP de la red de Tor, no la tuya.** Cada sitio va por su propio circuito (usuario y contraseña
  SOCKS distintos por sitio, como en Tor Browser).
- **No comparte nada con tus otras ventanas**, tampoco con las privadas normales: es otro proceso con otro perfil.
  Si compartieran la sesión (las ventanas privadas de un mismo perfil comparten cookies y caché), una web podría
  enlazar tu IP de Tor con la real. Por eso las ventanas privadas normales **no** van por Tor.
- **Nada sale directo.** El DNS lo resuelve Tor; si tor no ha arrancado todavía, las peticiones esperan; si se cae,
  fallan (van a un «sumidero» en tu propio equipo), nunca salen sin Tor. Además, su configuración de red tiene un
  proxy manual por si algo fallara, y sin la excepción que deja a Remote Settings y a la telemetría reintentar sin
  proxy.
- **Apagado en esa ventana:** WebRTC (sus conexiones van por UDP, fuera de Tor), HTTP/3 y WebTransport (UDP), DoH, la
  geolocalización (saldría por la red del sistema) y la precarga.
- **Huella digital en Caja fuerte**, con sus avisos y sus fallos (sección «Huella digital»).
- **Nueva identidad** (menú ☰ o el indicador «Tor» de la barra): cierra las ventanas, borra todo lo de la sesión,
  corta las conexiones abiertas y pide a Tor circuitos nuevos.
- **Al cerrarla**, tor se cierra y el perfil se borra.

**Lo que no hace, con franqueza:**

- **Aegis con Tor no es Tor Browser.** Tor Browser hace que todos sus usuarios parezcan el mismo navegador; a Aegis
  se le distingue más (aunque vaya en Caja fuerte): las webs pueden saber que eres «alguien con Aegis por Tor», que son
  muchos menos. **Para un anonimato fuerte, usa Tor Browser.**
- **Lo que abras fuera del navegador no va por Tor:** una descarga que abres con otro programa (un PDF, un documento
  que carga imágenes), un enlace `mailto:` que abre tu correo, una app que se abre desde un enlace.
- **Las extensiones** no están en esa ventana (el perfil es nuevo cada vez); si instalas alguna en ella, se pierde al
  cerrarla.
- **Tu proveedor de internet ve que usas Tor** (no qué haces). Con puentes (obfs4 o Snowflake) cuesta más verlo.
  Descargar tor también se ve: va del Aegis normal al Tor Project.
- **Algunas webs bloquean Tor o piden captchas** (Google, a menudo). DuckDuckGo, el buscador de serie, funciona.
- **Queda rastro en el disco de que usas Tor:** el paquete y el estado de tor (sus guardas, como en Tor Browser) en
  la carpeta local de tu perfil, hasta que pulses «Borrar». El perfil de la ventana se borra al cerrarla (si el
  Aegis normal ya estaba cerrado, la próxima vez que lo abras). Durante la sesión, ese perfil está en el disco; la
  navegación (historial, cookies, caché) va en memoria, como en cualquier ventana privada.
- **tor.exe y lyrebird.exe no llevan firma de Windows** (Authenticode; comprobado en el paquete 15.0.25): con el
  Control inteligente de aplicaciones activado, Windows podría bloquearlos. En el equipo de pruebas, con él activado,
  arrancaron.
- Los puentes cambian **en la siguiente ventana con Tor**, no en la que está abierta.
