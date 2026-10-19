# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

## about:conexiones (paginas/conexiones.html; conexiones.sys.mjs): qué conecta el navegador por su cuenta y el permiso
## del usuario. Sale en el primer arranque, antes de que se conecte nada. Para todo el mundo: de tú, frases cortas, sin
## jerga y sin exagerar. Los nombres de servicios (GitHub, Mozilla, Google, Cisco, Disconnect, Remote Settings, Safe
## Browsing, OpenH264, Widevine, CRLite, Netflix) no se traducen. Lo que dice cada fila sale de docs/CONEXIONES.md.

conexiones-pestana = Conexiones
conexiones-titulo = Tú decides qué se conecta
conexiones-entradilla = { -brand-short-name } aún no se ha conectado a nada. Estas son las conexiones que hace por su cuenta, sin que navegues. Elige cuáles permites.
# Etiqueta de la tarjeta (se muestra en mayúsculas).
conexiones-lista-titulo = Conexiones de { -brand-short-name }

conexiones-actualizaciones-nombre = Actualizaciones de { -brand-short-name }
conexiones-actualizaciones-que = Una vez al día pregunta a GitHub si hay una versión nueva y, si la hay, la descarga de allí. GitHub ve tu IP y tu versión de { -brand-short-name }, sin cookies. Sin esto, tendrás que buscar las actualizaciones a mano en Acerca de { -brand-short-name }.
conexiones-seguridad-nombre = Listas de seguridad
conexiones-seguridad-que = Certificados revocados (CRLite) y complementos peligrosos, de Remote Settings (services.mozilla.com). Comprueba si hay cambios una vez al día. Ese servidor ve tu IP y tu versión. Sin esto, para saber si el certificado de una web está revocado, { -brand-short-name } pregunta a la autoridad que lo emitió cada vez que abres una web nueva, a menudo sin cifrar: apagarlo hace que haya más consultas, no menos.
conexiones-listas-nombre = Listas de protección
conexiones-listas-que = Las listas con las que los Escudos reconocen lo que te sigue. Las de la protección contra rastreo, de Remote Settings (basadas en las de Disconnect): sin ellas no se reconoce ningún rastreador, recolector de huella digital, criptominero ni botón de red social, ni funcionan los sustitutos que evitan que una web se rompa al bloquearlos. Y las listas de filtros de sus autores (EasyList, AdGuard, uBlock Origin): sin ellas, los Escudos usan la copia que trae { -brand-short-name }, que se va quedando vieja. Se comprueban como mucho una vez al día y solo se descarga lo que ha cambiado.
conexiones-codecs-nombre = Códecs de vídeo
conexiones-codecs-que = OpenH264, de Cisco, para videollamadas: se descarga una vez. Widevine, de Google, para vídeo protegido (DRM), como el de Netflix: solo si una web lo pide y tú lo activas. Después, comprueba como mucho una vez al día si hay versiones nuevas (en aus5.mozilla.org y, para Widevine, en Google).
conexiones-traduccion-nombre = Traducción de páginas
conexiones-traduccion-que = Traduce las webs en tu equipo, sin enviarlas a nadie. Solo cuando pides traducir una página o descargas un idioma en Ajustes, baja el modelo de ese idioma (varios MB) de Remote Settings (services.mozilla.com); la lista de idiomas se comprueba una vez al día. Sin esto, la opción de traducir no aparece.
conexiones-safebrowsing-nombre = Safe Browsing de Google
conexiones-safebrowsing-que = Avisa de webs de estafa y de descargas peligrosas con listas de Google, que se actualizan más o menos cada media hora. Para confirmar un aviso, envía a Google un fragmento de un código calculado a partir de la dirección, no la dirección.
conexiones-safebrowsing-sin-clave = No está disponible en esta versión de { -brand-short-name }: falta su clave para el servicio de Google.
conexiones-push-nombre = Notificaciones de webs
conexiones-push-que = Una conexión abierta con un servidor de notificaciones (push.services.mozilla.com), para que las webs a las que des permiso te avisen aunque no las tengas abiertas. Ese servidor ve tu IP y un identificador de este navegador.

conexiones-navegar = Navegar no depende de esto: cuando abres una web, { -brand-short-name } se conecta a ella. Aquí solo está lo que ocurre solo, sin que hagas nada.
conexiones-cambiar = Los cambios se aplican al momento, sin reiniciar. Puedes volver aquí cuando quieras desde Ajustes › Privacidad.

conexiones-aceptar = Aceptar
conexiones-guardar = Guardar
conexiones-ahora-no = Ahora no
conexiones-ninguna = No permitir ninguna
conexiones-estado-aceptadas = Guardado. { -brand-short-name } solo se conectará por su cuenta para lo que has dejado activado.
conexiones-estado-ninguna = Guardado. { -brand-short-name } no se conectará a nada por su cuenta. Sin actualizaciones ni listas, se irá quedando atrás en seguridad.

## Ajustes › Privacidad › Conexiones (ajustes.sys.mjs)

# Etiqueta de sección (se muestra en mayúsculas).
conexiones-ajustes-titulo = Conexiones
conexiones-ajustes-ninguna = { -brand-short-name } no se conecta a nada por su cuenta.
# $lista: los nombres de los grupos activos, en forma de lista del idioma («Actualizaciones de Aegis y Listas de seguridad»).
conexiones-ajustes-activas = Por su cuenta, { -brand-short-name } solo se conecta para esto: { $lista }.
conexiones-ajustes-elegir = Elegir qué se conecta
