# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

### Aegis: own interface strings (source language). Other languages live next to this folder.
### Glossary: ../GLOSARIO.md

## Mode button in the toolbar (Standard / Workflow)

aegis-modo-button =
    .label = Mode
    .tooltiptext = Switch between Standard and Workflow modes

## Bookmarks panel in the sidebar

aegis-marcadores-ventana =
    .title = Manage in a window
aegis-marcadores-todos =
    .label = All bookmarks
aegis-marcadores-ordenar =
    .title = Sort
aegis-marcadores-orden-propio =
    .label = Your order
aegis-marcadores-orden-nombre =
    .label = Name (A–Z)
aegis-marcadores-orden-recientes =
    .label = Newest first
aegis-marcadores-vista =
    .title = Compact view
aegis-marcadores-editar =
    .title = Edit bookmarks on click
aegis-marcadores-nueva-carpeta =
    .label = New folder
aegis-marcadores-anadir-pestana =
    .label = Add current tab

## Settings page: sidebar header and category groups

aegis-ajustes-titulo = Settings
aegis-ajustes-grupo-personal = Personal
aegis-ajustes-grupo-navegacion = Browsing
aegis-ajustes-grupo-privacidad = Privacy
aegis-ajustes-grupo-sistema = System
aegis-ajustes-no-predeterminado =
    .message = { -brand-short-name } isn’t your default browser.

## Settings › Appearance: app icon (Windows)

aegis-icono-titulo = App icon
aegis-icono-descripcion = Shown on { -brand-short-name } windows. Private windows always use the ghost with a keyhole.
aegis-icono-fantasma = Ghost
aegis-icono-uroboros = Ouroboros

## Shields (address bar panel)

aegis-escudos-boton =
    .tooltiptext = { $count ->
        [0] Shields are up
        [one] Shields are up: 1 blocked on this page
       *[other] Shields are up: { $count } blocked on this page
    }
aegis-escudos-boton-bajados =
    .tooltiptext = Shields are down for this site
aegis-escudos-activos-sitio = Shields are up for this site
aegis-escudos-bajados-sitio = Shields are down for this site
aegis-escudos-contador = { $count ->
        [one] ad or tracker blocked on this page
       *[other] ads and trackers blocked on this page
    }
aegis-escudos-contador-bajados = Shields are down: nothing is blocked on this site.
aegis-escudos-total = { $total ->
        [one] 1 block since you installed { -brand-short-name }
       *[other] { $total } blocks since you installed { -brand-short-name }
    }
aegis-escudos-avanzadas = Advanced options
aegis-escudos-rastreadores = Trackers and ads
aegis-escudos-nivel-normal = Normal
aegis-escudos-nivel-estricto = Strict
aegis-escudos-nivel-estricto-mas = Strict+
aegis-escudos-personalizado = Custom
aegis-escudos-global = On all sites
aegis-escudos-ver-bloqueado = Blocked on this page
aegis-escudos-https = Upgrade connections to HTTPS
aegis-escudos-https-activo = HTTPS-Only on this site
aegis-escudos-https-excepcion = This site can open without encryption
aegis-escudos-https-apagado = HTTPS-Only Mode is off in Settings
aegis-escudos-scripts = Block scripts
aegis-escudos-scripts-pronto = Coming soon
aegis-escudos-huella = Fingerprinting
aegis-escudos-cookies = Third-party cookies
aegis-escudos-cookies-entre-sitios = Block tracking
aegis-escudos-cookies-todas = Block all
aegis-escudos-olvidar = Forget this site on close
aegis-escudos-olvidar-detalle = Deletes its cookies and data when you close { -brand-short-name }
aegis-escudos-olvidar-privada = A private window already forgets everything when you close it
aegis-escudos-listas = Filter lists
aegis-escudos-configuracion = Global settings
aegis-escudos-pie = If this site looks broken, lower the Shields for it. That reduces its protection.
aegis-escudos-lista-titulo = Blocked on this page
aegis-escudos-atras =
    .aria-label = Back
aegis-escudos-cat-rastreadores = Trackers and ads
aegis-escudos-cat-anuncios = Ads (filter lists)
aegis-escudos-cat-sociales = Social media trackers
aegis-escudos-cat-huella = Fingerprinting
aegis-escudos-cat-criptomineros = Cryptominers
aegis-escudos-lista-vacia = Nothing has been blocked on this page.

## Settings page: Aegis names in place of Firefox ones

aegis-ajustes-general = General
aegis-ajustes-inicio-predeterminado =
    .label = { -brand-short-name } Home (default)
aegis-ajustes-inicio =
    .label = { -brand-short-name } Home
aegis-ajustes-inicio-aviso =
    .message = To use these features, set new tabs or new windows to { -brand-short-name } Home.
aegis-ajustes-personalizar-inicio =
    .label = Customize { -brand-short-name } Home

## Complementos (about:addons): cabecera de la barra lateral, buscador y estado vacío de Extensiones.

aegis-complementos-titulo = Add-ons
# Texto de ayuda del buscador: abre la tienda de complementos en una pestaña.
aegis-complementos-buscar = Search add-ons on the web
aegis-complementos-vacio = You don’t have any extensions yet.
aegis-complementos-vacio-boton = Find extensions
# Panel de extensiones de la barra (la pieza de puzle) sin ninguna instalada: título, frase y, debajo, el botón
# aegis-complementos-vacio-boton, que abre la tienda de complementos en una pestaña.
aegis-extensiones-vacio-titulo = You don’t have any extensions yet
aegis-extensiones-vacio-texto = Find them in the add-ons store.
# Panel de extensiones con extensiones (al estilo de Chrome y Brave). Etiquetas de sección (se ven en MAYÚSCULAS):
# las fijadas en la barra de herramientas y, debajo, las que se ven solo dentro del panel.
aegis-extensiones-en-barra = On the toolbar
aegis-extensiones-en-panel = In this panel
# Botón de la chincheta de cada extensión (texto de ayuda y para lectores de pantalla). Dice lo que hace al pulsarlo.
# Variables:
#   $nombre (String) - nombre de la extensión
aegis-extensiones-fijar = Pin { $nombre } to the toolbar
aegis-extensiones-desfijar = Unpin { $nombre } from the toolbar
# Pie del panel: abre Complementos › Extensiones (about:addons) y la tienda de complementos en una pestaña.
aegis-extensiones-gestionar = Manage extensions
aegis-extensiones-anadir = Add extensions

## Barra lateral y barra de marcadores

# Pie de «Personalizar barra lateral»: abre los Ajustes del navegador.
aegis-barra-ajustes = { -brand-short-name } settings
# Botón junto al aviso de la barra de marcadores vacía: la oculta mientras no tenga marcadores (vuelve sola con el primero).
aegis-marcadores-aviso-cerrar = Not now
    .title = Hide the bookmarks toolbar while it’s empty

## Contraseñas (about:logins): estado vacío. La bóveda propia llegará más adelante.

aegis-contrasenas-vacio = Passwords you save when you sign in to a website will appear here.
aegis-contrasenas-importar = Import passwords

## Contraseñas: protección (contrasenas.sys.mjs), panel de la barra lateral (contrasenas-panel.sys.mjs) y aviso de
## about:logins. «Contraseña principal» es el término de Firefox (Primary Password): el mismo en todo el navegador.

# Botón del aviso del panel y de about:logins: abre el diálogo de la contraseña principal.
aegis-contrasenas-principal-crear = Create primary password
# Aviso del panel y de about:logins cuando no hay contraseña principal.
aegis-contrasenas-sin-principal = No primary password: any program that copies your profile could read your saved passwords.
# Estado vacío del panel de la barra lateral.
aegis-contrasenas-panel-titulo = Your passwords, under lock
aegis-contrasenas-panel-texto = { -brand-short-name } keeps them encrypted on this device, locked with your primary password, and never sends them anywhere.

## Ajustes › Contraseñas y autorrelleno: «Cierre automático de la bóveda» (ajustes.sys.mjs), detrás de «Contraseñas». Segmentos:
## Nunca, 15, 10, 5, 3, 2 y 1 min; caben siete en una fila, así que las etiquetas son cortas.

aegis-bloqueo-titulo = Lock passwords automatically
aegis-bloqueo-descripcion = After this long without using your computer, your saved passwords lock and { -brand-short-name } asks for your primary password again. They also lock when your computer sleeps and when you close { -brand-short-name }.
aegis-bloqueo-nunca-aviso = With “Never”, they only lock when you close { -brand-short-name } or your computer sleeps.
aegis-bloqueo-sin-principal = This only applies if you have a primary password.
aegis-bloqueo-nunca = Never
# Cada segmento con minutos. $minutos: 1, 2, 3, 5, 10 o 15.
aegis-bloqueo-minutos = { $minutos } min

## Diálogo de la contraseña principal (dialogos/contrasena-principal.xhtml), en lugar del de Firefox: crearla
## (antes de guardar la primera contraseña, desde el panel, about:logins o Ajustes) o cambiarla (Ajustes). Ancho
## fijo de 440 px: los textos largos pasan a otra línea.

# Título de la ventana o del marco del diálogo (Ajustes lo muestra arriba).
aegis-principal-ventana = Primary password
aegis-principal-titulo-crear = Create your primary password
aegis-principal-titulo-cambiar = Change your primary password
# Antes de guardar la primera contraseña (botones «No guardar» y «Crear y guardar»).
aegis-principal-explicacion-guardar = To save passwords, { -brand-short-name } encrypts them with a primary password. Without one, any program that copies your profile could read them. You’ll enter it once per session, and again after some time away from your computer.
# Desde el aviso del panel o de about:logins, o desde Ajustes.
aegis-principal-explicacion-crear = { -brand-short-name } uses it to encrypt the passwords you save. Without one, any program that copies your profile could read them. You’ll enter it once per session, and again after some time away from your computer.
aegis-principal-explicacion-cambiar = You need your current one to change it. Your saved passwords stay where they are, protected by the new one.
# Si una política de empresa exige la contraseña principal.
aegis-principal-politica = Your organization requires a primary password.
aegis-principal-actual = Current primary password
aegis-principal-nueva = Primary password
aegis-principal-nueva-cambiar = New primary password
aegis-principal-repetir = Enter it again
# Botón con el icono del ojo dentro de cada campo: muestra u oculta lo escrito.
aegis-principal-mostrar =
    .title = Show password
    .aria-label = Show password
# Debajo del campo, antes de escribir: el mínimo de Aegis.
aegis-principal-requisito = At least 12 characters. A phrase of four or more words is easy to remember and hard to guess.
# Mientras se escribe, lo que falta o el nivel. $faltan: caracteres que faltan para llegar a 12.
aegis-principal-corta =
    { $faltan ->
        [one] Too short: { $faltan } more character needed.
       *[other] Too short: { $faltan } more characters needed.
    }
aegis-principal-comun = Too easy to guess: avoid common words and passwords.
aegis-principal-secuencia = Too easy to guess: avoid sequences like “1234” or “qwerty”.
aegis-principal-repetida = Too easy to guess: it has too many repetitions.
aegis-principal-variedad = Too easy to guess: use more different characters.
aegis-principal-aceptable = Strength: acceptable. Longer would be better.
aegis-principal-fuerte = Strength: strong.
aegis-principal-muy-fuerte = Strength: very strong.
aegis-principal-no-coinciden = The passwords don’t match.
aegis-principal-error-actual = The current password is incorrect. Enter it again.
aegis-principal-error = The primary password couldn’t be saved. Try again.
# Tarjeta de aviso: no se puede recuperar (restablecerla en Firefox borra las contraseñas guardadas).
aegis-principal-olvido-titulo = If you forget it, it can’t be recovered
aegis-principal-olvido-texto = { -brand-short-name } doesn’t store it anywhere, and no one can send it to you. To start over, you’d have to reset it, and that deletes all your saved passwords.
# La línea de honestidad: qué protege y qué no.
aegis-principal-limites = It protects your passwords if someone copies your profile, uses another account on this computer, or takes the disk. It doesn’t protect them from malware that already controls your computer: that could record what you type, including this password.
# Botones. «No guardar» y «Crear y guardar», antes de guardar; los demás, desde Ajustes, el panel o about:logins.
aegis-principal-no-guardar = Don’t save
aegis-principal-cancelar = Cancel
aegis-principal-crear-guardar = Create and save
aegis-principal-crear = Create password
aegis-principal-cambiar = Change password

## Códigos de verificación (autenticador/): panel de contraseñas, about:logins, el autorrelleno y el diálogo para
## añadirlos (dialogos/autenticador.xhtml). «Código de verificación» es el código de 6 u 8 cifras de la verificación
## en dos pasos (TOTP); «clave de configuración», el texto que da la web para configurarlo (glosario).

# Panel de contraseñas: título de la sección plegable.
aegis-codigos-titulo = Verification codes
aegis-codigos-vacio = Save an account’s two-step verification code here and { -brand-short-name } will give you its codes.
# Botón compacto del panel: abre el diálogo para añadir uno.
aegis-codigos-anadir = Add code
# Botones de icono de cada fila del panel. $sitio: el dominio («github.com»).
aegis-codigos-ver =
    .title = Show the code for { $sitio }
    .aria-label = Show the code for { $sitio }
aegis-codigos-copiar =
    .title = Copy the code for { $sitio }
    .aria-label = Copy the code for { $sitio }
aegis-codigos-editar =
    .title = Change or remove the code for { $sitio }
    .aria-label = Change or remove the code for { $sitio }
# Junto al código a la vista: segundos que le quedan. Cabe en poco: «18 s».
aegis-codigos-restante = { $segundos } s
# Tras copiar. $segundos: tras cuántos segundos se borra (30 de serie).
aegis-codigos-copiado = Code copied. It will be cleared from the clipboard in { $segundos } s if it’s still there.
aegis-codigos-copiado-sin-borrar = Code copied.
aegis-codigos-ilegible = This code can’t be read. Add it again.
# Mensaje y título del diálogo de Windows Hello al ver o copiar un código.
aegis-codigos-autenticacion-ver = To view the verification code, enter your Windows login credentials. This helps protect your accounts.
aegis-codigos-autenticacion-copiar = To copy the verification code, enter your Windows login credentials. This helps protect your accounts.
aegis-codigos-autenticacion-titulo = { -brand-short-name }
# about:logins: la fila de la contraseña elegida y sus botones compactos.
aegis-codigos-etiqueta = Verification code
aegis-codigos-ninguno = No verification code
aegis-codigos-boton-mostrar = Show
aegis-codigos-boton-ocultar = Hide
aegis-codigos-boton-copiar = Copy
aegis-codigos-boton-cambiar = Change
aegis-codigos-boton-anadir = Add
# Autorrelleno: el panelito junto al campo del código en la web. $sitio: el dominio.
aegis-codigos-ofrecer-titulo = Verification code
aegis-codigos-ofrecer-texto = { -brand-short-name } has the code for { $sitio }.
aegis-codigos-rellenar = Fill in the code
# Con varias cuentas en el sitio. $cuenta: el usuario (o un número).
aegis-codigos-rellenar-cuenta = Fill in the code for { $cuenta }
# Panel de contraseñas (solo Windows): sección «Passkeys». No prometer sincronización.
aegis-passkeys-titulo = Passkeys
aegis-passkeys-texto = Passkeys you create on a website are stored by Windows Hello on this computer. If it has a security chip (TPM), the private key never leaves it; if not, Windows protects it in software. { -brand-short-name } can’t see or copy it. Windows Hello passkeys aren’t synced to other computers; if you pick another passkey provider in the Windows prompt, they’re stored wherever it says.
# Abre la Configuración de Windows › Cuentas › Claves de acceso.
aegis-passkeys-gestionar = Manage in Windows
# Diálogo para añadir, cambiar o quitar un código de verificación.
aegis-autenticador-ventana = Verification code
aegis-autenticador-titulo = Add verification code
aegis-autenticador-titulo-editar = Verification code
aegis-autenticador-explicacion = When a website asks you to set up an authenticator app, scan its QR code here or copy its setup key. { -brand-short-name } will generate the codes on this computer.
aegis-autenticador-cuenta = Account
# Primera opción del desplegable de cuentas.
aegis-autenticador-elige = Choose a saved account
aegis-autenticador-sin-cuentas = First save that account’s password in { -brand-short-name }.
aegis-autenticador-existe = This account already has a verification code. Saving another key replaces it.
aegis-autenticador-clave = Setup key or otpauth:// link
# Botón del ojo dentro del campo de la clave.
aegis-autenticador-mostrar =
    .title = Show key
    .aria-label = Show key
# Botones compactos para leer el código QR (en el equipo, sin red).
aegis-autenticador-qr-pagina = Scan QR on this page
aegis-autenticador-qr-imagen = Scan QR from an image…
# Título del selector de archivos.
aegis-autenticador-qr-imagen-titulo = Choose an image with the QR code
aegis-autenticador-qr-no = No QR code found. Make sure the whole code is visible and try again.
aegis-autenticador-qr-otro = That QR code isn’t for an authenticator app.
# La clave es válida. $emisor: quien la da; $digitos: 6–8; $periodo: segundos (30).
aegis-autenticador-valida = { $emisor }: { $digitos } digits every { $periodo } s.
aegis-autenticador-valida-sin-emisor = Valid key: { $digitos } digits every { $periodo } s.
aegis-autenticador-error-formato = That’s not a valid key. Copy the whole setup key or otpauth:// link.
aegis-autenticador-error-hotp = Counter-based codes (HOTP) aren’t supported, only time-based ones (TOTP).
aegis-autenticador-error-corta = The key is too short to be secure.
aegis-autenticador-error-parametros = This code uses an unsupported format (unusual digits or period).
aegis-autenticador-error-guardar = The code couldn’t be saved. Try again.
# La tarjeta de honestidad: los dos pasos juntos en la bóveda.
aegis-autenticador-honestidad-titulo = Both steps in one place
aegis-autenticador-honestidad = Saving the code next to the password puts both steps in { -brand-short-name }: anyone who unlocked your saved passwords would have both. Your primary password and identity check when viewing or copying a code protect them. For your most important accounts, an authenticator on another device is safer.
# Quitar pide dos pulsaciones: la segunda con «-confirmar» y el aviso.
aegis-autenticador-quitar = Remove code
aegis-autenticador-quitar-confirmar = Remove permanently
aegis-autenticador-quitar-aviso = Before removing it, make sure you can sign in another way (for example, with the website’s recovery codes).
aegis-autenticador-cancelar = Cancel
aegis-autenticador-guardar = Save

## Énfasis de color (Ajustes › Apariencia y «Personalizar» de la nueva pestaña)

aegis-enfasis-titulo = Accent
aegis-enfasis-descripcion = The color of selections, focus, switches, the active tab edge and the window frame gradient.
aegis-enfasis-automatico = “Windows color” and “Desktop background” change on their own when you change them in Windows. The background is read on this computer and never leaves it.
aegis-enfasis-monocromo = Monochrome
aegis-enfasis-windows = Windows color
aegis-enfasis-fondo = Desktop background
aegis-enfasis-hielo = Ice
aegis-enfasis-pizarra = Slate
aegis-enfasis-salvia = Sage
aegis-enfasis-ambar = Amber
aegis-enfasis-coral = Coral
aegis-enfasis-lavanda = Lavender
aegis-enfasis-malva = Mauve
aegis-enfasis-cobalto = Cobalt
aegis-enfasis-piedra = Stone
aegis-enfasis-laguna = Lagoon
aegis-enfasis-musgo = Moss
aegis-enfasis-frambuesa = Raspberry
aegis-enfasis-ciruela = Plum

## Énfasis personalizado: el «+» de los selectores y su ventana («Crear» y «Mis énfasis»)

# Nombre de la opción del «+» en Ajustes y principio de sus etiquetas.
aegis-enfasis-propio = Custom
# Etiqueta (y descripción emergente) del «+» sin ningún personalizado en uso.
aegis-enfasis-propio-abrir = Custom: create one or pick a saved one
# El «+» con un personalizado en uso. $nombre: su nombre o sus códigos (p. ej. #88C0DC)
aegis-enfasis-propio-abrir-activo = Custom: { $nombre }
# Línea del elegido, bajo las muestras de la nueva pestaña. $nombre: su nombre o sus códigos
aegis-enfasis-propio-actual = Custom: { $nombre }
aegis-enfasis-propio-titulo = Custom accent
aegis-enfasis-propio-cerrar = Close
# Las dos pestañas de la ventana.
aegis-enfasis-propio-crear = Create
aegis-enfasis-propio-mis = My accents
aegis-enfasis-propio-degradado = Gradient
aegis-enfasis-propio-degradado-ayuda = A second color for the window frame and the active tab edge. Everything else uses the first.
# Para lectores de pantalla: los dos segmentos que eligen qué color se edita.
aegis-enfasis-propio-editando = Color you’re editing
aegis-enfasis-propio-color-1 = First color
aegis-enfasis-propio-color-2 = Second color
# El cuadro de color, para lectores de pantalla. $saturacion y $brillo: de 0 a 100
aegis-enfasis-propio-area = Saturation and brightness
aegis-enfasis-propio-area-valor = Saturation { $saturacion }%, brightness { $brillo }%
aegis-enfasis-propio-tono = Hue
# Campo del color en hexadecimal (#RRGGBB).
aegis-enfasis-propio-hex = Code
aegis-enfasis-propio-hex-error = Enter a hex color, like #88C0DC.
aegis-enfasis-propio-nombre = Name
aegis-enfasis-propio-nombre-ejemplo = Optional
aegis-enfasis-propio-vista = Preview
aegis-enfasis-propio-ajuste = { -brand-short-name } adjusts brightness and intensity so it stays readable in light and dark.
aegis-enfasis-propio-guardar = Save
aegis-enfasis-propio-usar = Use
aegis-enfasis-propio-guardado = Saved to “My accents”.
aegis-enfasis-propio-actualizado = Already in “My accents”.
# $maximo: cuántos se pueden guardar (24)
aegis-enfasis-propio-lleno = You already have { $maximo } saved. Delete one in “My accents” to save another.
# $cuantos: los guardados; $maximo: el límite (24)
aegis-enfasis-propio-cuenta = { $cuantos } of { $maximo }
# Supr (Delete): la tecla que borra el guardado con el foco.
aegis-enfasis-propio-mis-ayuda = Pick one to use it. Press Delete to remove it.
aegis-enfasis-propio-sin-nombre = Untitled
aegis-enfasis-propio-editar = Edit
aegis-enfasis-propio-borrar = Delete
# $nombre: el nombre del guardado (o el texto de «sin nombre»)
aegis-enfasis-propio-borrar-pregunta = Delete “{ $nombre }”? This can’t be undone.
aegis-enfasis-propio-borrar-confirmar = Delete
aegis-enfasis-propio-cancelar = Cancel
aegis-enfasis-propio-borrado = “{ $nombre }” deleted.
aegis-enfasis-propio-vacio-titulo = Nothing saved yet
# Estado vacío de «Mis énfasis». $maximo: cuántos se pueden guardar (24)
aegis-enfasis-propio-vacio = Create an accent and select “Save”: it’ll show up here, ready to use with one click. You can keep up to { $maximo }.
aegis-enfasis-propio-ir-crear = Create one

## Nueva pestaña › Personalizar: fondo, diseño (buscador, accesos y espaciado)

aegis-np-fondo-titulo = Background
aegis-np-fondo-liso = Solid
aegis-np-fondo-degradado = Gradient
aegis-np-fondo-enfasis = Accent
aegis-np-fondo-imagen = Image
aegis-np-imagen-cambiar = Change image…
aegis-np-imagen-error = Couldn’t use that image. Try another JPG, PNG, WebP, AVIF or GIF under 20 MB.
aegis-np-diseno-titulo = Layout
aegis-np-buscador = Show search
aegis-np-posicion = Search position
aegis-np-posicion-centro = Centered
aegis-np-posicion-arriba = Higher up
aegis-np-accesos = Shortcuts
aegis-np-accesos-arriba = Above search
aegis-np-accesos-abajo = Below search
aegis-np-espaciado = Spacing
# $px: número de píxeles
aegis-np-espaciado-valor = { $px } px
aegis-np-ancho = Search bar width

## Search engine menu in the address bar (the magnifying glass)

# Row shown when the engine chosen for this search is not the default one. $buscador: engine name, e.g. Google
aegis-buscador-predeterminado = Use { $buscador } by default

## New tab › Add or edit a shortcut: the site’s logo as the shortcut image

# Link next to “Use a custom image”. It looks for the site’s icon (first on this device, then on the site) and sets it as the custom image.
aegis-logo-usar = Use the site’s logo
aegis-logo-buscando = Looking for the logo…
aegis-logo-sin-direccion = Type the shortcut’s URL first.
aegis-logo-error = Couldn’t use this site’s logo. Try a custom image.
aegis-logo-error-red = Couldn’t get the logo from the site. Check the URL or try again later.

## Webs en oscuro (Ajustes › Apariencia y fila «Oscurecer este sitio» del panel de Escudos)

aegis-webs-oscuro-titulo = Dark websites
aegis-webs-oscuro-descripcion = Websites adapt to the dark theme of { -brand-short-name }. Only while { -brand-short-name } is dark; images and videos stay as they are.
aegis-webs-oscuro-aviso = A website can tell that its appearance has been changed.
aegis-webs-oscuro-apagado = Off
aegis-webs-oscuro-todas = All websites
aegis-webs-oscuro-sin-modo-oscuro = Only those without dark mode
aegis-escudos-oscuro = Darken this site
aegis-escudos-oscuro-activo = Adapts to the dark theme
aegis-escudos-oscuro-propio = This site already has a dark mode
aegis-escudos-oscuro-claro = Only while { -brand-short-name } is dark
aegis-escudos-oscuro-excepcion = Not darkened on this site

## Shields panel: search engine setting (busqueda-limpia.sys.mjs). Only shown on DuckDuckGo or Bing.

aegis-escudos-ddg-anuncios = Remove DuckDuckGo ads
aegis-escudos-ddg-anuncios-apagado = Off: Shields still hide the ads they recognize
aegis-escudos-ddg-anuncios-activo = Uses DuckDuckGo’s own setting to hide them
aegis-escudos-bing-rewards = Earn Microsoft Rewards points
aegis-escudos-bing-rewards-apagado = Off: your activity isn’t sent and searches earn no points
aegis-escudos-bing-rewards-activo = Bing receives your search activity to add points

## Fingerprinting (Settings › Privacy, Shields panel and the Vault notice)

aegis-huella-titulo = Fingerprinting
aegis-huella-descripcion = What websites can read about your browser to recognize you without cookies: screen, fonts, graphics card, time zone and more.
aegis-huella-nivel-basica = Basic
aegis-huella-nivel-basica-descripcion = Only the protection built into the browser.
aegis-huella-nivel-equilibrada = Balanced
aegis-huella-nivel-equilibrada-descripcion = Hides everything it can without breaking websites. Recommended.
aegis-huella-nivel-estricta = Strict
aegis-huella-nivel-estricta-descripcion = Also hides your window position, fonts, voices and what your graphics card can do. Some websites may not work properly.
aegis-huella-nivel-caja-fuerte = Vault
aegis-huella-nivel-caja-fuerte-descripcion = Hides almost everything the protection knows how to hide (not your dark or light theme or your screen size): websites see UTC time, English and 60 fps, can’t see your accessibility settings, and high contrast stops applying to them. To read a canvas they have to ask you, and you can let a site see your browser data. Many websites will break.
aegis-huella-nota = No protection is perfect: websites still see your IP address, and { -brand-short-name } isn’t Tor Browser.
aegis-huella-permitidos-titulo = Sites allowed in Vault
aegis-huella-permitidos-vacio = No sites have permission.
# $sitio: the site’s domain, e.g. example.com
aegis-huella-quitar = Remove
    .aria-label = Remove { $sitio }
aegis-huella-apagada = Off in tracking protection settings
aegis-huella-permitir-sitio = Allow on this site
aegis-huella-permiso-no = Browser data: blocked
aegis-huella-permiso-si = Browser data: Balanced protection
aegis-huella-permiso-privada = Only from a normal window
aegis-huella-permiso-no-disponible = Not available for this address
# <> is replaced by the site’s name (shown in bold). Keep it as is.
aegis-huella-aviso = <> tried to read data from your browser. Vault hid it.
aegis-huella-aviso-permitir =
    .label = Allow on this site
    .accesskey = A
aegis-huella-aviso-bloquear =
    .label = Keep blocking
    .accesskey = K

## Tor: “New private window with Tor” (☰ menu, Shift+Alt+N), Settings › Privacy › Tor, the toolbar indicator and
## about:privatebrowsing in the Tor instance. “Tor” and “Tor Browser” belong to another project: never translated.

aegis-tor-titulo = Tor
aegis-tor-descripcion = Open private windows that go through the Tor network: websites don’t see your IP. It’s a separate { -brand-short-name } with its own profile, deleted when you close it, and it shares nothing with your other windows.
aegis-tor-honestidad = { -brand-short-name } with Tor is not Tor Browser: { -brand-short-name } is easier to tell apart than Tor Browser, which looks like the same browser for everyone. For strong anonymity, use Tor Browser. What you open outside the browser (a download opened in another app, an email link) doesn’t go through Tor.
aegis-tor-no-descargado = Tor isn’t downloaded
# $tamano: megabytes, e.g. 21.5; $origen: server, e.g. dist.torproject.org
aegis-tor-origen = { $tamano } MB from the Tor Project ({ $origen }). Its sha256 fingerprint is checked before installing it.
# $progreso: percentage
aegis-tor-descargando = Downloading… { $progreso }%
aegis-tor-comprobando = Checking the package…
# $progreso: percentage
aegis-tor-extrayendo = Installing… { $progreso }%
# $tor: tor version; $version: package version (the Tor Browser release it comes from)
aegis-tor-listo = Tor { $tor } downloaded (package { $version })
aegis-tor-desactualizado = A new version of Tor is available (package { $version })
aegis-tor-boton-descargar = Download Tor
aegis-tor-boton-actualizar = Update
aegis-tor-boton-cancelar = Cancel
aegis-tor-boton-borrar = Delete
aegis-tor-borrar-abierta = Close the Tor windows to delete it.
aegis-tor-abrir-titulo = New private window with Tor
aegis-tor-abrir-detalle = Also from the menu or with Shift+Alt+N.
aegis-tor-boton-abrir = Open
aegis-tor-puentes-titulo = Bridges
aegis-tor-puentes-descripcion = For networks that block Tor. Applies the next time you open a window with Tor.
aegis-tor-puentes-ninguno = No bridges
aegis-tor-puentes-obfs4 = obfs4
aegis-tor-puentes-snowflake = Snowflake
aegis-tor-nota-huella = The Tor window uses Vault: Tor hides your IP, but what the browser reveals about itself is up to { -brand-short-name }.
aegis-tor-nota-buscadores = Some search engines, like Google, ask for captchas or block connections coming from Tor. DuckDuckGo works.
aegis-tor-instancia-texto = This is a private window with Tor: all its traffic goes through Tor and nothing is kept when you close it.
aegis-tor-boton-identidad = New identity
aegis-tor-error-descarga = Tor couldn’t be downloaded. Check your connection and try again.
aegis-tor-error-suma = The download isn’t the expected package (its sha256 fingerprint doesn’t match) and was discarded. Try again later.
aegis-tor-error-sin-descargar = Tor isn’t downloaded: download it in Settings › Privacy.
aegis-tor-error-arranque = Tor couldn’t start. If Windows blocked it, allow it and open another window with Tor.
aegis-tor-error-caido = Tor has closed. Close this window and open another one with Tor.
aegis-tor-aviso-red = Tor is having trouble connecting. If your network blocks Tor, try bridges.
aegis-tor-red-arrancando = Tor: starting…
# $progreso: percentage
aegis-tor-red-conectando = Tor: connecting… { $progreso }%
aegis-tor-red-conectado = Tor: connected
aegis-tor-red-error = Tor: not connected.
aegis-tor-red-parado = Tor: stopped.
aegis-tor-privada-nota = Websites see an IP from the Tor network, not yours. { -brand-short-name } with Tor is not Tor Browser.
aegis-tor-menu-ventana =
    .label = New private window with Tor
aegis-tor-menu-identidad =
    .label = New Tor identity
aegis-tor-menu-ajustes =
    .label = Tor settings
aegis-tor-ofrecer-titulo = Download Tor
# $tamano: megabytes, e.g. 21.5
aegis-tor-ofrecer-texto = To open a private window with Tor you need Tor, which doesn’t come with { -brand-short-name }. { $tamano } MB will be downloaded from the Tor Project (dist.torproject.org) and its fingerprint checked before it’s installed in your profile.
aegis-tor-ofrecer-botones =
    .descargar = Download
aegis-tor-identidad-confirmar = All Tor windows will close, everything from this session will be deleted and Tor will use new circuits.
    .title = New identity
    .aceptar = New identity

## Google (Ajustes › Privacidad; google.sys.mjs). «Google» y «YouTube» son nombres propios: no se traducen.

aegis-google-titulo = Google
aegis-google-descripcion = Tracking protection doesn’t act on Google or YouTube websites. There, { -brand-short-name } cuts their usage data and ads, and result links go straight to the website.
# Mismo nombre que la sección «Google limpio» de about:escudos (escudos-ayuda-google-titulo).
aegis-google-limpio = Clean Google
aegis-google-limpio-detalle = Google still sees your IP, what you search for and, if you sign in, who you are.
# Pide a Google la vista «Web» (udm=14). Solo actúa con «Google limpio» encendido.
aegis-google-solo-web = Web results only in Google
aegis-google-solo-web-detalle = For searches from the address bar, without AI answers or extra modules.

## Links to “How Shields work” (about:escudos)

# Pie del panel de Escudos: abre la página de ayuda en una pestaña.
aegis-escudos-ayuda = How Shields work
# Ajustes: enlace junto a cada opción de Escudos y de huella; abre la ayuda en su sección.
aegis-ayuda-rastreo = Learn more
    .aria-label = Learn more about tracking protection
aegis-ayuda-cookies = Learn more
    .aria-label = Learn more about third-party cookies
aegis-ayuda-https = Learn more
    .aria-label = Learn more about HTTPS-Only Mode
aegis-ayuda-olvidar = Learn more
    .aria-label = Learn more about forgetting sites on close
aegis-ayuda-huella = Learn more
    .aria-label = Learn more about fingerprinting
aegis-ayuda-google = Learn more
    .aria-label = Learn more about Clean Google

## Shields: annoyances, site exceptions and Settings › Shields (escudos.sys.mjs, escudos/ajustes.sys.mjs)

# Shields panel › Advanced options: detail line of the global annoyance switches (they apply to all sites).
aegis-escudos-molestia-activa = Hidden on all sites
aegis-escudos-molestia-apagada = Off on all sites
aegis-escudos-molestia-permitida-sitio = Allowed on this site

# Row that opens Settings › Shields with this site selected. Below it: the groups allowed on the site, or “None”.
aegis-escudos-excepciones-sitio = Exceptions for this site…
aegis-escudos-excepciones-ninguna = None

# Site exception groups: the same names in the panel, in Settings and in about:escudos.
aegis-escudos-grupo-anuncios = Ads
aegis-escudos-grupo-rastreadores = Trackers
aegis-escudos-grupo-cookies-avisos = Cookie notices
aegis-escudos-grupo-molestias = Pop-ups and banners
aegis-escudos-grupo-antiadblock = Anti-adblock notices
aegis-escudos-grupo-cosmetico = Hidden elements
aegis-escudos-grupo-scriptlets = List scripts

# Settings › Shields: category name in the sidebar and page title.
aegis-ajustes-escudos = Shields
aegis-ajustes-escudos-descripcion = What Shields block on every site, and the exceptions for each site.

# Level: option cards, each with one honest line.
aegis-ajustes-escudos-nivel-titulo = Level
aegis-ajustes-escudos-nivel-descripcion = How much Shields block on all sites. It’s the same setting as in the panel.
aegis-ajustes-escudos-nivel-normal = Normal
aegis-ajustes-escudos-nivel-normal-descripcion = Blocks known trackers and ads from the filter lists. Almost no site breaks.
aegis-ajustes-escudos-nivel-estricto = Strict
aegis-ajustes-escudos-nivel-estricto-descripcion = Also blocks tracking videos, comments and social media buttons, and strips tracking data from links. Some sites may look incomplete.
aegis-ajustes-escudos-nivel-estricto-mas = Strict+ (recommended)
aegis-ajustes-escudos-nivel-estricto-mas-descripcion = Everything in Strict plus a broader tracking list (AdGuard Tracking Protection). Uses a little more memory.
aegis-ajustes-escudos-nivel-personalizado = You changed tracking protection by hand in Privacy, so no level matches. Pick one to go back.
aegis-ajustes-escudos-nivel-nota = No level makes blocking invisible: a site can notice that its ads are missing.

# Annoyances: three global switches (their names are aegis-escudos-grupo-*).
aegis-ajustes-escudos-molestias-titulo = Annoyances
aegis-ajustes-escudos-molestias-descripcion = Hidden on all sites. To see them on a particular site, add it under “Site exceptions”.
aegis-ajustes-escudos-molestia-cookies-detalle = Consent banners. Hiding one isn’t always the same as rejecting: the site decides what to do without your answer.
aegis-ajustes-escudos-molestia-ventanas-detalle = Pop-ups, app install banners, widgets and other annoyances.
aegis-ajustes-escudos-molestia-antiadblock-detalle = Notices asking you to turn off your blocker. It doesn’t work on every site.
aegis-ajustes-escudos-molestias-nota = Each group uses lists from their authors (uBlock Origin, AdGuard and EasyList). When you change it, Shields take a few seconds to prepare them.

# Counter: two segments and a line explaining the selected one.
aegis-ajustes-escudos-contador-titulo = Counter
aegis-ajustes-escudos-contador-descripcion = What the number on the Shields button and panel counts.
aegis-ajustes-escudos-contador-peticiones = Requests
aegis-ajustes-escudos-contador-origenes = Origins
aegis-ajustes-escudos-contador-peticiones-detalle = Every blocked request adds one, even if it goes to the same server.
aegis-ajustes-escudos-contador-origenes-detalle = Each blocked server adds one per page, however many times it tries.

# Filter lists. $listas: number of lists; $fecha: date and time; $dias: number of days.
aegis-ajustes-escudos-listas-titulo = Filter lists
aegis-ajustes-escudos-listas-descripcion = The rules come from their authors (uBlock Origin, EasyList, AdGuard and Brave). { -brand-short-name } downloads them straight from them, without cookies.
aegis-ajustes-escudos-listas-activas = { $listas ->
        [one] 1 active list
       *[other] { $listas } active lists
    }
aegis-ajustes-escudos-ultima = Last updated: { $fecha }
aegis-ajustes-escudos-actualizar-ahora = Update now
aegis-ajustes-escudos-actualizando = Updating…
aegis-ajustes-escudos-resultado-nuevas = Lists updated
aegis-ajustes-escudos-resultado-iguales = Already up to date
aegis-ajustes-escudos-resultado-fallos = { $listas ->
        [one] One list couldn’t be downloaded, so the previous version stays
       *[other] { $listas } lists couldn’t be downloaded, so the previous versions stay
    }
aegis-ajustes-escudos-resultado-sin-permiso = The Connections permission is needed to download them
aegis-ajustes-escudos-resultado-error = Couldn’t update. Try again later
aegis-ajustes-escudos-automatica = Update lists automatically
aegis-ajustes-escudos-automatica-detalle = One check a day; each list is only fetched when it expires.
aegis-ajustes-escudos-automatica-sin-permiso = Needs the “Protection lists” permission in Connections.
aegis-ajustes-escudos-sin-conexiones = Until you give it, Shields use the lists that come with { -brand-short-name }.
aegis-ajustes-escudos-elegir-conexiones = Choose connections

# Above the 1, 2, 4 and 7 day segments (aegis-ajustes-escudos-dias).
aegis-ajustes-escudos-intervalo = Renew each list at least every
aegis-ajustes-escudos-intervalo-detalle = Sooner if its author asks: some lists expire within hours.
aegis-ajustes-escudos-dias = { $dias ->
        [one] 1 day
       *[other] { $dias } days
    }
aegis-ajustes-escudos-ver-listas = Show lists ({ $listas })
aegis-ajustes-escudos-ocultar-listas = Hide lists

# Detail of each list: author · date · where the copy in use comes from.
aegis-ajustes-escudos-origen-red = downloaded
aegis-ajustes-escudos-origen-build = included with { -brand-short-name }

# Site exceptions. $sitio: the domain, e.g. example.com. A switch that is on = allowed on that site.
aegis-ajustes-escudos-excepciones-titulo = Site exceptions
aegis-ajustes-escudos-excepciones-descripcion = Sites where Shields let something through. “Allow everything” is the same as lowering Shields from the panel.
aegis-ajustes-escudos-excepciones-descripcion-privada = In a private window, exceptions last until you close the last private window. “Allow everything” is the same as lowering Shields from the panel.
aegis-ajustes-escudos-anadir-titulo = Add a site

# Example text inside the field (grey).
aegis-ajustes-escudos-anadir-ejemplo = example.com
aegis-ajustes-escudos-anadir = Add
aegis-ajustes-escudos-anadir-error = Type a site address, like example.com.
aegis-ajustes-escudos-excepciones-vacio = No sites have exceptions.
aegis-ajustes-escudos-sitio-todo = Everything allowed: Shields down
aegis-ajustes-escudos-sitio-nada = Nothing allowed yet
aegis-ajustes-escudos-editar = Edit
    .aria-label = Edit exceptions for { $sitio }
aegis-ajustes-escudos-cerrar = Close
    .aria-label = Close exceptions for { $sitio }
aegis-ajustes-escudos-quitar = Remove
    .aria-label = Remove all exceptions for { $sitio }
aegis-ajustes-escudos-permitir-todo = Allow everything on this site
aegis-ajustes-escudos-permitir-todo-detalle = Lowers Shields: nothing is blocked. It’s the big switch in the panel.
aegis-ajustes-escudos-que-permitir = Or choose what to allow

# Inheritance: the group is off globally (Annoyances) or the site has “Allow everything”.
aegis-ajustes-escudos-por-ajuste-general = Allowed by a global setting: it’s off for all sites.
aegis-ajustes-escudos-por-permitir-todo = Allowed: this site has “Allow everything”.
aegis-ajustes-escudos-grupo-anuncios-detalle = Requests to ad servers in the filter lists.
aegis-ajustes-escudos-grupo-rastreadores-detalle = The ones in the filter lists. The browser’s tracking protection stays on; to turn it off too, use “Allow everything”.
aegis-ajustes-escudos-grupo-cookies-avisos-detalle = Cookie consent banners.
aegis-ajustes-escudos-grupo-molestias-detalle = Pop-ups, app banners and widgets.
aegis-ajustes-escudos-grupo-antiadblock-detalle = Notices asking you to turn off your blocker.
aegis-ajustes-escudos-grupo-cosmetico-detalle = Ad slots and other elements the lists hide on the page.
aegis-ajustes-escudos-grupo-scriptlets-detalle = Small scripts from the lists that disable ads and detectors inside the page.

# “Learn more” for each section: opens about:escudos at that section.
aegis-ayuda-nivel = Learn more
    .aria-label = Learn more about Shields levels
aegis-ayuda-molestias = Learn more
    .aria-label = Learn more about annoyances
aegis-ayuda-contador = Learn more
    .aria-label = Learn more about the counter
aegis-ayuda-listas = Learn more
    .aria-label = Learn more about filter lists
aegis-ayuda-excepciones = Learn more
    .aria-label = Learn more about site exceptions

## Importar de otros navegadores (migracion/). Nombres de los navegadores de origen en el asistente de importar
## (marcas: no se traducen) y la página de las contraseñas: cómo sacar un CSV de cada uno. Solo los ids que empiezan
## por «aegis-migracion-navegador-firefox» pueden nombrar ese navegador (tools/verificar.py).

aegis-migracion-navegador-firefox = Firefox
aegis-migracion-navegador-aegis = { -brand-short-name }

aegis-migracion-navegador-firefox-csv-titulo = How to import passwords from Firefox
aegis-migracion-navegador-firefox-csv-en = In Firefox:
aegis-migracion-navegador-firefox-csv-paso1 = Type about:logins in the address bar and press Enter.
aegis-migracion-navegador-firefox-csv-paso2 = Open the menu (…) in the top right corner and choose “Export Passwords…”.
aegis-migracion-navegador-firefox-csv-paso3 = Confirm and save the file on your device.
aegis-migracion-csv-brave-titulo = How to import passwords from Brave
aegis-migracion-csv-brave-en = In Brave:
aegis-migracion-csv-brave-paso1 = Type brave://password-manager/settings in the address bar and press Enter.
aegis-migracion-csv-brave-paso2 = Under “Export passwords”, select “Download file”.
aegis-migracion-csv-brave-paso3 = Save the file on your device.
aegis-migracion-csv-edge-titulo = How to import passwords from Microsoft Edge
aegis-migracion-csv-edge-en = In Microsoft Edge:
aegis-migracion-csv-edge-paso1 = Type edge://settings/passwords in the address bar and press Enter.
aegis-migracion-csv-edge-paso2 = Open “More actions” (…) next to your saved passwords and choose “Export passwords”.
aegis-migracion-csv-edge-paso3 = Confirm with your Windows PIN or password and save the file on your device.
# Último paso, común: vuelve al asistente y elige el CSV con su botón (el de Firefox, «Seleccionar archivo»).
aegis-migracion-csv-final = Come back here and select the file to finish. It holds your passwords unencrypted: delete it as soon as you’re done.

# Otro Aegis (otro perfil o el de otro equipo): no exporta en claro; las contraseñas pasan con el código de
# transferencia (contrasenas/transferencia/). El botón «Seleccionar archivo» de la página (el de Firefox) elige el
# archivo y luego se pide el código. «-final-ajustes»: cuando el asistente no puede abrir el diálogo (dentro de la
# bienvenida), remite a Ajustes. Los nombres de Ajustes y de los botones, como salen en la interfaz.
aegis-migracion-aegis-contrasenas-titulo = How to move passwords from another { -brand-short-name }
aegis-migracion-aegis-contrasenas-en = In the other { -brand-short-name } (on this computer or another one):
aegis-migracion-aegis-contrasenas-paso1 = Open Settings › Passwords and autofill and, under “Move to another { -brand-short-name }”, select “Create file…”.
aegis-migracion-aegis-contrasenas-paso2 = Save the file and write down the 6-word code it shows you.
aegis-migracion-aegis-contrasenas-paso3 = If it’s another computer, bring the file over (on a USB drive or in your cloud).
aegis-migracion-aegis-contrasenas-final = Come back here, select the file and type the code. If you’d rather not move them now, skip this step to import everything else.
aegis-migracion-aegis-contrasenas-final-ajustes = Then open it in Settings › Passwords and autofill › “Receive from another { -brand-short-name }”. For now, skip this step to import everything else.

## Pasar las contraseñas a otro Aegis con el código de 6 palabras (contrasenas/transferencia/): Ajustes › Contraseñas
## y autorrelleno («Transferencia de contraseñas», detrás del cierre automático), los diálogos de pasar y de recibir
## (dialogos/transferencia-*.xhtml, 440 px de ancho: los textos largos pasan a otra línea) y el selector de archivos.
## «Código de transferencia» está en el glosario. Las palabras del código son siempre las de la lista del EFF, en
## inglés: no se traducen ni salen aquí. Honestidad: la caducidad (24 h) y el «una sola vez» los comprueba Aegis al
## abrir el archivo; lo que protege el archivo es el código.

# Ajustes: etiqueta de la sección (en mayúsculas), su descripción y dos filas con su detalle y un botón compacto.
aegis-transferencia-titulo = Password transfer
aegis-transferencia-descripcion = Move your passwords to another { -brand-short-name } (on this computer or another one) in an encrypted file that only opens with a 6-word code. They don’t go through any server: you carry the file yourself.
aegis-transferencia-pasar = Move to another { -brand-short-name }
aegis-transferencia-pasar-detalle = Creates the file and its code. The code is shown only once and the file expires in 24 hours.
aegis-transferencia-pasar-boton = Create file…
aegis-transferencia-recibir = Receive from another { -brand-short-name }
aegis-transferencia-recibir-detalle = Opens the file here with its code. Passwords you already have aren’t duplicated.
aegis-transferencia-recibir-boton = Open file…
# Títulos del selector de archivos del sistema, el nombre del tipo de archivo y el nombre que se propone (sin la
# extensión .aegisvault, que se añade sola).
aegis-transferencia-selector-guardar = Save the password file
aegis-transferencia-selector-abrir = Choose the password file
aegis-transferencia-selector-filtro = { -brand-short-name } passwords
aegis-transferencia-nombre-archivo = { -brand-short-name } passwords
# Mensaje y título del diálogo de Windows Hello al crear el archivo.
aegis-transferencia-autenticacion = To move your passwords to another { -brand-short-name }, enter your Windows credentials. This helps protect your accounts.
aegis-transferencia-autenticacion-titulo = { -brand-short-name }
# Botones comunes de los dos diálogos.
aegis-transferencia-cancelar = Cancel
aegis-transferencia-hecho = Done

# Diálogo «Pasar a otro Aegis». Paso 1: qué se lleva y el aviso.
aegis-pasar-ventana = Move to another { -brand-short-name }
aegis-pasar-titulo = Move your passwords to another { -brand-short-name }
aegis-pasar-explicacion = They’re saved in an encrypted file. When it’s done, you’ll see a 6-word code: in the other { -brand-short-name }, open the file in Settings › Passwords and autofill › “Receive from another { -brand-short-name }” and type the code.
# $contrasenas: cuántas hay guardadas (1 o más).
aegis-pasar-resumen =
    { $contrasenas ->
        [one] 1 saved password will be moved.
       *[other] { $contrasenas } saved passwords will be moved.
    }
aegis-pasar-vacio = There are no saved passwords to move.
# Casilla, marcada de serie. $codigos: cuántos códigos de verificación hay guardados.
aegis-pasar-incluir-codigos =
    { $codigos ->
        [one] Also include the saved verification code
       *[other] Also include the { $codigos } saved verification codes
    }
aegis-pasar-aviso-titulo = Anyone with the file and the code has your passwords
aegis-pasar-aviso-texto = Keep the file somewhere you control and don’t send it along with the code. Delete it as soon as you’ve opened it in the other { -brand-short-name }.
# Solo con la casilla de los códigos marcada.
aegis-pasar-aviso-codigos = With the verification codes, the file holds both steps of those accounts.
aegis-pasar-limites = The file expires in 24 hours and can only be opened once in each profile: { -brand-short-name } checks this when opening it. What really protects it is the code.
aegis-pasar-crear = Create file…
# Paso 2: el código, una sola vez.
aegis-pasar-codigo-titulo = Your transfer code
aegis-pasar-codigo-explicacion = Type it in the other { -brand-short-name } when you open the file. It expires in 24 hours.
aegis-pasar-copiar = Copy code
# Tras copiar. $segundos: tras cuántos segundos se borra (60 de serie).
aegis-pasar-copiado = Copied. It will be cleared from the clipboard in { $segundos } s if it’s still there.
aegis-pasar-copiado-sin-borrar = Copied. Clear the clipboard once you’ve pasted it.
aegis-pasar-copiar-error = Couldn’t copy it. Write it down by hand.
aegis-pasar-una-vez-titulo = It won’t be shown again
aegis-pasar-una-vez-texto = Write it down or copy it now. { -brand-short-name } doesn’t keep it: if you lose it, the file can’t be opened and you’ll need to create another one.
# $archivo: el nombre del archivo; $contrasenas y $codigos: cuántos lleva.
aegis-pasar-guardado =
    In “{ $archivo }”: { $contrasenas ->
        [one] 1 password
       *[other] { $contrasenas } passwords
    }.
aegis-pasar-guardado-codigos =
    In “{ $archivo }”: { $contrasenas ->
        [one] 1 password
       *[other] { $contrasenas } passwords
    } and { $codigos ->
        [one] 1 verification code
       *[other] { $codigos } verification codes
    }.
aegis-pasar-error-autenticacion = Your identity couldn’t be verified. Try again.
aegis-pasar-error-escribir = The file couldn’t be saved. Choose another folder and try again.
aegis-pasar-error = The file couldn’t be created. Try again.

# Diálogo «Recibir de otro Aegis». Paso 1: el archivo y el código.
aegis-recibir-ventana = Receive from another { -brand-short-name }
aegis-recibir-titulo = Receive passwords from another { -brand-short-name }
aegis-recibir-explicacion = Choose the file you created in the other { -brand-short-name } and type its 6-word code.
aegis-recibir-archivo = File
aegis-recibir-sin-archivo = No file chosen
aegis-recibir-elegir = Choose…
aegis-recibir-cambiar = Change…
aegis-recibir-codigo = 6-word code
# Debajo del campo: antes de escribir, cuántas palabras lleva o cuál no es del código. $palabras: de 1 a 7 o más.
aegis-recibir-codigo-nota = The words in order, separated by spaces. Capital letters don’t matter.
aegis-recibir-codigo-cuenta = { $palabras } of 6 words
aegis-recibir-codigo-desconocida = “{ $palabra }” isn’t a word in the code. Check how it’s spelled.
aegis-recibir-limites = They’re added to your saved passwords, protected by your primary password. Passwords you already have aren’t duplicated; if the one in the file is newer, it replaces yours.
aegis-recibir-boton = Receive
aegis-recibir-abriendo = Opening the file…
# Errores. «-incorrecto» no dice si el fallo es del código o del archivo (a propósito).
aegis-recibir-error-incorrecto = The code or the file isn’t correct. Check the 6 words and that this is the file you created.
aegis-recibir-error-version = This file comes from a newer version of { -brand-short-name }. Update { -brand-short-name } and try again.
aegis-recibir-error-caducado = This file has expired: it’s only valid for 24 hours. Create another one in the other { -brand-short-name }.
aegis-recibir-error-reloj = This file is dated later than this computer’s clock. Check the date and time on both computers.
aegis-recibir-error-usado = This file has already been opened here, and it’s only valid once. If needed, create another one in the other { -brand-short-name }.
aegis-recibir-error-leer = The file couldn’t be read. Check that it’s still there and try again.
aegis-recibir-error-sin-principal = Without a primary password, no passwords are saved. Create one and try again.
aegis-recibir-error-bloqueada = Your primary password is needed to save the passwords. Try again.
aegis-recibir-error = The passwords couldn’t be received. Try again.
# Paso 2: el resumen (una línea por cada cosa que no sea cero; la primera, siempre) y borrar el archivo. $n: cuántas.
aegis-recibir-hecho-titulo = Passwords received
aegis-recibir-hecho-explicacion = They’re now in your saved passwords, protected by your primary password.
aegis-recibir-resumen-nuevas =
    { $n ->
        [one] 1 new password
       *[other] { $n } new passwords
    }
aegis-recibir-resumen-actualizadas =
    { $n ->
        [one] 1 updated (the one in the file was newer)
       *[other] { $n } updated (the ones in the file were newer)
    }
aegis-recibir-resumen-ya =
    { $n ->
        [one] 1 was already saved
       *[other] { $n } were already saved
    }
aegis-recibir-resumen-codigos =
    { $n ->
        [one] 1 new verification code
       *[other] { $n } new verification codes
    }
aegis-recibir-resumen-codigos-ya =
    { $n ->
        [one] 1 account already had its verification code (left unchanged)
       *[other] { $n } accounts already had their verification code (left unchanged)
    }
aegis-recibir-resumen-errores =
    { $n ->
        [one] 1 couldn’t be added
       *[other] { $n } couldn’t be added
    }
aegis-recibir-borrar-titulo = Delete the file
aegis-recibir-borrar-texto = You don’t need it anymore, and with it and the code anyone could read your passwords. Also delete it wherever you copied it (a USB drive, your cloud).
aegis-recibir-borrar = Delete file
aegis-recibir-borrado = File deleted.
aegis-recibir-borrar-error = It couldn’t be deleted. Delete it from its folder.

## about:bienvenida (paginas/bienvenida.html; bienvenida.sys.mjs): las preguntas de Aegis Setup dentro del navegador,
## para quien no pasa por el instalador (Microsoft Store, zip). Sale en el primer arranque, antes de «Tú decides qué se
## conecta». Misma redacción que el asistente del instalador (packaging/instalador/traducciones/): si cambia uno, cambia
## el otro. Los nombres de los buscadores (DuckDuckGo, Startpage, Brave Search, Google) y «Workflow» no se traducen.

aegis-bienvenida-pestana = Welcome
aegis-bienvenida-nombre = { -brand-short-name }
aegis-bienvenida-lema = A private browser, clean and fast
# Etiqueta de sección del resumen (se muestra en mayúsculas).
aegis-bienvenida-resumen = Your setup
aegis-bienvenida-fila-modo = Mode
aegis-bienvenida-fila-escudos = Shields
aegis-bienvenida-fila-buscador = Search engine
aegis-bienvenida-fila-apariencia = Appearance
aegis-bienvenida-resumen-nota = You can change all of it whenever you like in Settings.
aegis-bienvenida-modo-titulo = How do you want to browse?
aegis-bienvenida-modo-subtitulo = Choose a mode. You can change it whenever you like in Settings.
aegis-bienvenida-modo-estandar = Standard
aegis-bienvenida-modo-estandar-detalle = Tabs on top, as always
aegis-bienvenida-modo-workflow = Workflow
aegis-bienvenida-modo-workflow-detalle = Vertical tabs and spaces
aegis-bienvenida-modo-nota-estandar = A clean bar with the tabs on top and a discreet bookmarks bar.
aegis-bienvenida-modo-nota-workflow = Tabs on the side and spaces to keep work and leisure apart.
aegis-bienvenida-escudos-titulo = How much do you want to block?
aegis-bienvenida-escudos-subtitulo = Shields block ads and trackers from the very first minute.
aegis-bienvenida-escudos-normal = Normal
aegis-bienvenida-escudos-normal-detalle = Blocks known trackers and ads. Almost no site breaks.
aegis-bienvenida-escudos-estricto = Strict
aegis-bienvenida-escudos-estricto-detalle = Also blocks social buttons and videos that track you. Some sites may look incomplete.
aegis-bienvenida-escudos-estricto-mas = Strict+
# Nombre que lee el lector de pantalla para la tarjeta de Estricto+ (la insignia es parte del dibujo).
aegis-bienvenida-escudos-estricto-mas-accesible =
    .aria-label = Strict+ (recommended)
aegis-bienvenida-escudos-estricto-mas-detalle = Everything in Strict plus a broader tracking list. Uses a little more memory.
# Insignia sobre la tarjeta de Estricto+ (se muestra en mayúsculas).
aegis-bienvenida-recomendado = Recommended
aegis-bienvenida-escudos-nota = You can change it whenever you like in Settings › Shields.
aegis-bienvenida-buscador-titulo = Where do you want to search?
aegis-bienvenida-buscador-subtitulo = The search engine for the address bar. You can change it whenever you like in Settings.
aegis-bienvenida-buscador-duckduckgo = Doesn't keep what you search for.
aegis-bienvenida-buscador-startpage = Google results without Google knowing who you are.
aegis-bienvenida-buscador-brave = Its own independent index, with no profiles.
aegis-bienvenida-buscador-google = The usual results. Google keeps what you search for.
aegis-bienvenida-apariencia-titulo = Choose a look
aegis-bienvenida-apariencia-subtitulo = { -brand-short-name } stays black and white: the color comes from the web.
aegis-bienvenida-apariencia-oscuro = Dark
aegis-bienvenida-apariencia-oscuro-detalle = Black and grays
aegis-bienvenida-apariencia-claro = Light
aegis-bienvenida-apariencia-claro-detalle = White and grays
aegis-bienvenida-apariencia-auto = Automatic
# Automático sigue el tema del sistema: en Windows, como en el instalador.
aegis-bienvenida-apariencia-auto-detalle =
    { PLATFORM() ->
        [windows] Follows Windows
       *[other] Follows your system
    }
aegis-bienvenida-apariencia-nota = You can change it whenever you like in Settings › Appearance.
# Pie: los pasos. $n es el paso en el que se está y $total, cuántos hay (5).
aegis-bienvenida-paso = Step { $n } of { $total }
aegis-bienvenida-atras = Back
aegis-bienvenida-continuar = Continue
# Primer paso: ver y cambiar cada pregunta.
aegis-bienvenida-personalizar = Customize
# Primer paso, sin haber cambiado nada: aplica lo recomendado y sigue (se salta las preguntas).
aegis-bienvenida-usar-recomendado = Use recommended
# Primer paso, después de cambiar algo: aplica lo elegido y sigue.
aegis-bienvenida-usar-eleccion = Use this setup

## Barra de direcciones: modo «Acciones» (escribir «>» o elegir Acciones en el menú de la lupa) y la fila de botones
## que sale al escribir una palabra clave (acciones.sys.mjs). Cada acción es un botón pequeño: textos cortos, como los
## de las acciones del navegador («Ver descargas»). Los «-claves» son las palabras que la buscan: separadas por comas,
## en minúsculas y en el idioma de la interfaz (Aegis las busca también sin tildes). No se traducen palabra por
## palabra: las que usaría alguien de ese idioma para encontrar la acción.

aegis-accion-escudos = Open Shields panel
aegis-accion-escudos-claves = shields, blocker, ad blocker, ads, trackers, shields panel
aegis-accion-escudos-bajar = Turn Shields down for this site
aegis-accion-escudos-subir = Turn Shields up for this site
aegis-accion-escudos-sitio-claves = shields, shields down, shields up, disable shields, enable shields, disable blocker, allow ads
aegis-accion-escudos-ajustes = Shields settings
aegis-accion-escudos-ajustes-claves = shields, shields settings, exceptions, filter lists, filters
aegis-accion-conexiones = Choose what connects
aegis-accion-conexiones-claves = connections, connect, network, privacy
aegis-accion-modo-workflow = Switch to Workflow mode
aegis-accion-modo-estandar = Switch to Standard mode
aegis-accion-modo-claves = mode, workflow, standard, vertical tabs
aegis-accion-apariencia = Appearance and accent
aegis-accion-apariencia-claves = appearance, accent, color, colour, dark theme, light theme
aegis-accion-tor = New private window with Tor
aegis-accion-tor-claves = tor, tor window, anonymous, onion
aegis-accion-contrasenas = Open passwords
aegis-accion-contrasenas-claves = passwords, logins, accounts, verification codes
aegis-accion-pasar = Move passwords to another { -brand-short-name }
aegis-accion-pasar-claves = move passwords, export passwords, transfer, passwords
aegis-accion-recibir = Receive passwords from another { -brand-short-name }
aegis-accion-recibir-claves = receive passwords, transfer, transfer code, passwords
aegis-accion-importar = Import data from another browser
aegis-accion-importar-claves = import, import data, chrome, edge, brave, migrate
