# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

## about:escudos, «Cómo funcionan los Escudos» (paginas/escudos-ayuda.html): la ayuda de cada opción del panel de
## Escudos y de la huella digital. Para todo el mundo: de tú, frases cortas y sin jerga. Los nombres de las opciones
## son los del panel (aegis.ftl) y se escriben igual. <strong> se deja tal cual (negrita del nombre de la opción).

escudos-ayuda-pestana = Cómo funcionan los Escudos
escudos-ayuda-titulo = Cómo funcionan los Escudos
escudos-ayuda-entradilla = Qué hace cada opción del panel de los Escudos, cuándo te conviene tocarla y qué hacer si una web deja de funcionar.
# Etiqueta del índice (se muestra en mayúsculas).
escudos-ayuda-indice = En esta página
# Encabezados que se repiten en varias secciones.
escudos-ayuda-h-cuando = Cuándo usarlo
escudos-ayuda-h-falla = Si una web falla

## Qué son los Escudos y el contador

escudos-ayuda-escudos-titulo = Qué son los Escudos
escudos-ayuda-escudos-que = Cada web que abres carga piezas de otras empresas: anuncios, contadores de visitas, botones de redes sociales. Muchas sirven para seguirte de una web a otra y saber qué haces. Los Escudos las bloquean antes de que lleguen.
escudos-ayuda-escudos-panel = El botón de los Escudos es el anillo que hay a la derecha de la barra de direcciones. Al pulsarlo se abre el panel, con lo bloqueado en la página y las opciones de protección. Cada opción dice si vale solo para la web que estás viendo o «En todos los sitios».
escudos-ayuda-contador-titulo = El contador
escudos-ayuda-contador-que = El número del botón cuenta lo bloqueado en la página que estás viendo: anuncios, rastreadores, rastreadores de redes sociales, recolectores de huella digital y criptomineros. De serie cuenta cada petición bloqueada; en Ajustes › Escudos › «Contador» puedes elegir que cada servidor cuente una sola vez («Orígenes»). El número vuelve a cero al cambiar de página.
escudos-ayuda-contador-no = No cuenta lo que se protege sin bloquear nada: las cookies que se guardan aparte para cada web, los datos del navegador que se ocultan ni las conexiones que pasan a HTTPS. Con los Escudos bajados, el número no aparece.
escudos-ayuda-contador-total = Debajo del número grande del panel ves cuánto se ha bloqueado desde que instalaste { -brand-short-name }. Se guarda solo en tu equipo y no se envía a nadie. Se cuenta a su manera, así que no tiene por qué coincidir con la suma de lo que ves en cada página.

## Escudos del sitio

escudos-ayuda-sitio-titulo = Escudos del sitio
escudos-ayuda-sitio-que = El interruptor grande de arriba del panel sube o baja los Escudos solo para la web que estás viendo. Al bajarlos, la página se recarga sin bloqueos y sin la protección de la huella digital, y el botón aparece tachado.
escudos-ayuda-sitio-recuerda = { -brand-short-name } lo recuerda para la próxima vez. Si lo haces en una ventana privada, se olvida al cerrarla.
escudos-ayuda-sitio-cuando = Cuando una web en la que confías no funciona bien: un vídeo que no arranca, un pago que no avanza o un inicio de sesión que vuelve una y otra vez a la misma pantalla.
escudos-ayuda-sitio-falla = Con los Escudos bajados, esa web vuelve a cargar lo que antes se bloqueaba y puede seguirte. Si al bajarlos no se arregla, el problema era otro: vuelve a subirlos.

## Rastreadores y anuncios: Normal o Estricto

escudos-ayuda-nivel-titulo = Rastreadores y anuncios
escudos-ayuda-nivel-que = Elige cuánto bloquean los Escudos en todas las webs. { -brand-short-name } viene en Estricto+. También se elige en Ajustes › Escudos.
escudos-ayuda-nivel-normal = <strong>Normal</strong> bloquea en todas las ventanas los anuncios de las listas de filtros, el contenido que rastrea de la lista básica (anuncios y contadores de empresas que rastrean), los criptomineros y los recolectores de huella conocidos, y las cookies que te siguen de una web a otra, también las de las redes sociales; sus botones y vídeos incrustados sí se cargan.
escudos-ayuda-nivel-estricto = <strong>Estricto</strong> usa además la lista completa de contenido que rastrea, bloquea también los botones y publicaciones incrustadas de las redes sociales, y quita de los enlaces los datos que se les añaden para seguirte. Alguna web puede fallar.
escudos-ayuda-nivel-personalizado = Si cambias una opción suelta, como las cookies de terceros, el nivel pasa a <strong>Personalizado</strong>. Para volver, elige Normal, Estricto o Estricto+.
escudos-ayuda-nivel-recarga = Al cambiar el nivel, la página se recarga.
escudos-ayuda-nivel-cuando = Deja Estricto+ si no tienes problemas. Si fallan muchas de las webs que usas, prueba Normal; si falla solo una, mejor baja los Escudos en ella.
escudos-ayuda-nivel-falla = En Estricto puede faltar un vídeo o un mapa incrustado, los comentarios o un botón de «Iniciar sesión con…». Baja los Escudos en esa web y se recargará completa.

## Lo bloqueado en esta página

escudos-ayuda-lista-titulo = Lo bloqueado en esta página
escudos-ayuda-lista-que = Esta fila del panel enseña qué sitios se han bloqueado en la página, por grupos: rastreadores y anuncios, rastreadores de redes sociales, huella digital y criptomineros. Así ves quién intentaba seguirte.
escudos-ayuda-lista-listas = Lo bloquean la protección contra rastreo del navegador (con las listas de Disconnect) y el bloqueador propio de los Escudos (con las listas de filtros). El botón «Listas de filtros» abre Ajustes › Escudos.
escudos-ayuda-lista-falla = Si en la lista ves algo que la web necesita, como su servicio de pagos o de vídeo, baja los Escudos en esa web.

## Pasar conexiones a HTTPS

escudos-ayuda-https-titulo = Pasar conexiones a HTTPS
escudos-ayuda-https-que = Con el modo solo HTTPS, { -brand-short-name } abre siempre la versión cifrada de cada web. Así nadie en tu red, como la wifi de una cafetería o tu proveedor de internet, puede leer ni cambiar lo que ves. Viene activado en todas las webs.
escudos-ayuda-https-sitio = El interruptor del panel hace una excepción para la web que estás viendo: podrá abrirse sin cifrar. Si el modo solo HTTPS está desactivado en Ajustes, la fila aparece apagada.
escudos-ayuda-https-cuando = Casi nunca. Solo para una web sin versión cifrada en la que confías, como la página de configuración de tu router.
escudos-ayuda-https-falla = Si una web no tiene versión cifrada, { -brand-short-name } te avisa antes de abrirla, y desde ese aviso puedes seguir sin cifrar. Ten en cuenta que, sin cifrar, lo que escribes en esa web viaja a la vista.

## Bloquear scripts

escudos-ayuda-scripts-titulo = Bloquear scripts
escudos-ayuda-scripts-que = Bloquear los scripts (los programas que trae cada web) en un sitio todavía no está disponible. El navegador aún no tiene una forma fiable de hacerlo web a web, y { -brand-short-name } no enseña un interruptor que no funciona. Llegará con el bloqueador propio de los Escudos.

## Huella digital

escudos-ayuda-huella-titulo = Huella digital
escudos-ayuda-huella-que = Una web puede reconocerte sin cookies juntando lo que lee de tu navegador: el tamaño de la pantalla, las fuentes, la tarjeta gráfica, la zona horaria, el idioma… Esa combinación es tu huella digital. { -brand-short-name } esconde parte de esos datos o enseña a todas las webs los mismos.
escudos-ayuda-huella-donde = Se elige en el panel, en la fila «Huella digital», o en Ajustes › Privacidad. Vale para todas las webs, en ventanas normales y privadas. Si lo cambias desde el panel, la página se recarga.
escudos-ayuda-huella-niveles = Los cuatro niveles
escudos-ayuda-huella-basica = <strong>Básica.</strong> La protección que trae el navegador: cambia un poco lo que una web lee de sus dibujos (el canvas), solo le enseña las fuentes del sistema e iguala algunos cálculos.
escudos-ayuda-huella-equilibrada = <strong>Equilibrada</strong> (la de serie). Además, oculta la tarjeta gráfica, los sensores, el tipo de conexión, detalles del audio y del color de la pantalla, y otros datos que las webs normales no necesitan. No rompe nada habitual: el inicio de sesión, el vídeo, los mapas, los documentos y las videollamadas siguen funcionando.
escudos-ayuda-huella-estricta = <strong>Estricta.</strong> Además, oculta dónde están la ventana y el ratón en la pantalla y las barras de la ventana, las fuentes (solo enseña las de serie del sistema), las voces de lectura y lo que puede hacer la tarjeta gráfica. El tamaño de la pantalla, el audio, los núcleos del procesador y el lienzo (canvas) se quedan como en Equilibrada: cambiarlos te hacía más fácil de reconocer. Alguna web puede fallar: algún mapa o juego en 3D no arranca, la lectura en voz alta de algunas webs se queda sin voces y las pantallas táctiles pueden recibir la versión para ratón.
escudos-ayuda-huella-caja = <strong>Caja fuerte.</strong> Oculta casi todo lo que sabe ocultar: no si usas tema oscuro o claro, ni el tamaño de la pantalla (ocultarlo te hacía más fácil de reconocer). Las webs ven la hora en UTC, el inglés, 60 imágenes por segundo y un teclado de EE. UU., y no ven tus ajustes de accesibilidad (alto contraste, reducir movimiento…). Para leer un canvas, la web tiene que pedirte permiso. Unas marcas en las esquinas de la web te recuerdan que está puesta. Muchas webs fallarán.
escudos-ayuda-caja-titulo = Caja fuerte y el permiso por sitio
escudos-ayuda-caja-aviso = Si una web intenta sacar tu huella de una forma conocida, aparece un aviso junto al botón de los Escudos: «Seguir bloqueando» o «Permitir en este sitio». Sale una vez por sitio y sesión. No reconoce todos los intentos: el resto se bloquea igual, pero sin aviso.
escudos-ayuda-caja-permiso = «Permitir en este sitio», en el aviso o en el panel, deja esa web en Equilibrada; las demás siguen en Caja fuerte. Se guarda como un permiso del sitio, que puedes quitar en Ajustes › Privacidad, en «Sitios con permiso en Caja fuerte», o borrando los datos de ese sitio.
escudos-ayuda-caja-limites = No se puede dar desde una ventana privada, porque se quedaría guardado, aunque los permisos que ya tienes valen también allí. Tampoco se puede dar a direcciones con números (IP), a «localhost» ni a algunos dominios poco comunes. El idioma, las 60 imágenes por segundo y los colores del sistema son de todo el navegador y no cambian con el permiso.
escudos-ayuda-caja-salir = Al salir de Caja fuerte, tus idiomas vuelven a ser los de antes.
escudos-ayuda-ven-titulo = Lo que las webs siguen viendo
escudos-ayuda-ven-ip = Tu dirección IP y, con ella, tu país y tu ciudad aproximada. Para ocultarla hace falta Tor o un proxy.
escudos-ayuda-ven-navegador = Qué navegador y qué sistema usas, de forma genérica: el mismo dato que millones de personas. Nunca dice { -brand-short-name }.
escudos-ayuda-ven-resto = Tu idioma y tu zona horaria, salvo en Caja fuerte; el tamaño de la ventana y si usas tema oscuro o claro, siempre.
escudos-ayuda-ven-ocultar = Que ocultas cosas: poca gente navega así, y eso también te distingue. Pasa igual con otros navegadores privados.
escudos-ayuda-ven-bajados = Si bajas los Escudos en un sitio, ese sitio no tiene protección de la huella.
escudos-ayuda-huella-cuando = Equilibrada sirve para casi todo. Estricta, si aceptas que alguna web falle. Caja fuerte, para los momentos en los que quieres dejar el menor rastro posible.
escudos-ayuda-huella-falla = Si una web falla en Estricta o en Caja fuerte, baja los Escudos en ella o, en Caja fuerte, usa «Permitir en este sitio». Si fallan muchas, vuelve a Equilibrada.

## Cookies de terceros

escudos-ayuda-cookies-titulo = Cookies de terceros
escudos-ayuda-cookies-que = Las cookies son datos que una web guarda en tu navegador para recordarte. Las de terceros son las de otras empresas que están dentro de la web que visitas, y sirven sobre todo para seguirte de una web a otra. Esta opción vale para todas las webs.
escudos-ayuda-cookies-rastreo = <strong>Bloquear rastreo</strong> (la de serie) bloquea las cookies de los rastreadores conocidos y guarda las demás aparte para cada web, como en un cajón propio. Así, una empresa no puede juntar lo que haces en dos webs distintas.
escudos-ayuda-cookies-todas = <strong>Bloquear todas</strong> no deja entrar ninguna cookie de terceros.
escudos-ayuda-cookies-cuando = «Bloquear rastreo» protege casi lo mismo y rompe mucho menos. Elige «Bloquear todas» solo si quieres lo máximo y aceptas que algunas cosas fallen.
escudos-ayuda-cookies-falla = Con «Bloquear todas» pueden fallar los botones de «Iniciar sesión con…», los pagos, los comentarios y los vídeos incrustados: vuelve a «Bloquear rastreo». Si cambias esta opción, el nivel de los Escudos pasa a Personalizado.

## Olvidar este sitio al cerrar

escudos-ayuda-olvidar-titulo = Olvidar este sitio al cerrar
escudos-ayuda-olvidar-que = Borra las cookies y los datos que guarda la web que estás viendo cada vez que cierras { -brand-short-name }. Solo vale para esa web: las demás no se tocan. No es lo mismo que «Olvidar este sitio» del historial, que lo borra todo en el momento.
escudos-ayuda-olvidar-privada = En una ventana privada aparece apagado: una ventana privada ya lo olvida todo al cerrarla.
escudos-ayuda-olvidar-cuando = Para webs que usas de vez en cuando y no quieres que te recuerden: tiendas, periódicos o buscadores de vuelos.
escudos-ayuda-olvidar-falla = Cada vez tendrás que volver a iniciar sesión, y la web habrá olvidado tus preferencias, como el idioma, el carrito o tu respuesta al aviso de cookies. Si te molesta, apágalo para esa web.

## Oscurecer este sitio

escudos-ayuda-oscuro-titulo = Oscurecer este sitio
escudos-ayuda-oscuro-que = Esta fila solo aparece si has encendido «Webs en oscuro» en Ajustes › Apariencia. Apágala para que la web que estás viendo se quede con sus colores. El cambio se ve al momento, sin recargar.
escudos-ayuda-oscuro-falla = El oscurecido automático a veces se equivoca: un logotipo que no se ve o un texto con poco contraste. Apágalo en esa web. Ten en cuenta que una web puede notar que se ha cambiado su aspecto.

## Google limpio

escudos-ayuda-google-titulo = Google limpio
escudos-ayuda-google-que = En las webs de Google y de YouTube, { -brand-short-name } corta sus datos de uso y sus anuncios, quita de las búsquedas los datos de seguimiento y hace que los enlaces de los resultados vayan directos a la web, sin pasar por Google. Lo que corta suma en el contador.
escudos-ayuda-google-busqueda = Las búsquedas en Google que haces desde la barra de direcciones piden solo resultados web, sin respuestas de IA ni módulos. Dentro de Google puedes volver a «Todo».
escudos-ayuda-google-pasa = Se deja pasar a propósito lo que hace falta: el inicio de sesión, los captchas, Gmail, Drive, Maps, la reproducción de YouTube y su historial.
escudos-ayuda-google-limites-titulo = Lo que no hace
escudos-ayuda-google-limites = Si bajas los Escudos en una web de Google, deja de actuar en ella. Se apaga en Ajustes › Privacidad › Google. Google sigue viendo tu IP y lo que buscas, y si inicias sesión, sabe quién eres en sus servicios. Los anuncios que llegan dentro de la página, como los resultados patrocinados o los anuncios de vídeo de YouTube, todavía no se quitan.

## Lo que los Escudos no hacen

escudos-ayuda-limites-titulo = Lo que los Escudos no hacen
escudos-ayuda-limites-ip = <strong>No ocultan tu dirección IP.</strong> Todas las webs que visitas la ven, y con ella saben más o menos dónde estás. Para ocultarla hace falta Tor o un proxy.
escudos-ayuda-limites-detectable = <strong>No son invisibles.</strong> Una web puede notar que bloqueas cosas o que ocultas datos, y alguna te lo dirá. Ningún bloqueador lo evita al 100 %.
escudos-ayuda-limites-tor = <strong>{ -brand-short-name } no es Tor Browser.</strong> Tor Browser hace que todos sus usuarios parezcan el mismo navegador y oculta la IP. { -brand-short-name } reduce lo que una web puede saber de ti, pero una web con empeño puede seguir distinguiéndote.
escudos-ayuda-limites-cuenta = <strong>No te ocultan de la web en la que inicias sesión.</strong> Si entras en tu cuenta, esa web sabe quién eres. Lo que hacen los Escudos es que no te siga a otras webs.

## Lo que viene

escudos-ayuda-pronto-titulo = Lo que viene
escudos-ayuda-pronto-que = Esta página solo cuenta lo que funciona hoy. Esto todavía no está:
escudos-ayuda-pronto-motor = Elegir una a una las listas de filtros y añadir las tuyas.
escudos-ayuda-pronto-scripts = Bloquear scripts web a web.

## Estricto+, molestias, excepciones por sitio y listas de filtros (los nombres, como en el panel y en Ajustes › Escudos)

escudos-ayuda-nivel-estricto-mas = <strong>Estricto+</strong> (el de serie) es Estricto con una lista de rastreo más amplia, AdGuard Tracking Protection. Usa algo más de memoria.
escudos-ayuda-molestias-titulo = Molestias
escudos-ayuda-molestias-que = Además de anuncios y rastreadores, los Escudos ocultan tres tipos de molestias, cada uno con su interruptor: <strong>Avisos de cookies</strong> (los banners de consentimiento), <strong>Ventanas y banners</strong> (ventanas emergentes, banners para instalar apps y widgets) y <strong>Avisos anti-bloqueador</strong> (los que piden desactivar el bloqueador). Vienen encendidos.
escudos-ayuda-molestias-donde = Se encienden y se apagan para todas las webs en las opciones avanzadas del panel o en Ajustes › Escudos. Para una sola web, usa sus excepciones.
escudos-ayuda-molestias-cookies = Ocultar un aviso de cookies no siempre equivale a rechazarlas: si no respondes, la web hace lo que tenga de serie, y alguna guarda cookies igualmente.
escudos-ayuda-molestias-falla = Si una web no te deja seguir sin responder a su aviso, o un botón que necesitas está en una ventana que se oculta, añade para ella una excepción de ese grupo. Los avisos anti-bloqueador no se quitan en todas las webs: algunas notan el bloqueo de otras formas.
escudos-ayuda-excepciones-titulo = Excepciones por sitio
escudos-ayuda-excepciones-que = Una excepción hace que los Escudos dejen pasar algo en una web concreta. Se gestionan en Ajustes › Escudos › «Excepciones por sitio» y, desde el panel, con «Excepciones de este sitio…». Valen para todo el sitio (ejemplo.com y sus subdominios).
escudos-ayuda-excepciones-todo = <strong>Permitir todo</strong> es lo mismo que bajar los Escudos con el interruptor grande del panel: no se bloquea nada. Es lo más rápido cuando una web falla.
escudos-ayuda-excepciones-grupos = Si prefieres afinar, elige qué permitir: anuncios, rastreadores de las listas, avisos de cookies, ventanas y banners, avisos anti-bloqueador, elementos ocultos o scripts de las listas. Lo demás se sigue bloqueando.
escudos-ayuda-excepciones-herencia = Si un grupo está apagado para todas las webs, en la excepción aparece como «Permitido por ajuste general» y no se puede tocar ahí: para cambiarlo, vuelve a encenderlo en general.
escudos-ayuda-excepciones-guardado = Se guardan en tu equipo como permisos del sitio. Si olvidas el sitio o borras sus datos o el historial, se borran con ellos. Las que pones en una ventana privada duran hasta que cierras la última ventana privada.
escudos-ayuda-excepciones-rastreadores = La excepción de rastreadores solo afecta a las listas de filtros: la protección contra rastreo del navegador sigue activa. Para quitarla también, usa «Permitir todo».
escudos-ayuda-listas-titulo = Listas de filtros
escudos-ayuda-listas-que = Lo que bloquea el bloqueador propio de los Escudos lo deciden las listas de filtros de sus autores: uBlock Origin, EasyList, AdGuard y Brave. El nivel y las molestias eligen cuáles se usan, y se añaden las del idioma de { -brand-short-name }.
escudos-ayuda-listas-copia = { -brand-short-name } trae una copia de las listas, así que bloquea desde el primer momento, sin conectarse a nada.
escudos-ayuda-listas-actualizar = Si en Conexiones permites «Listas de protección», las listas se renuevan solas: una revisión al día, y cada lista se pide a su autor solo cuando caduca, sin cookies y sin decir qué webs visitas. Si una lista nueva llega mal, se queda la anterior. En Ajustes › Escudos puedes apagarlo, elegir cada cuánto se renuevan o pedirlas ahora.
