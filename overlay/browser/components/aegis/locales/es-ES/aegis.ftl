# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

## Botón de modo en la barra (Estándar / Workflow)

aegis-modo-button =
    .label = Modo
    .tooltiptext = Cambiar entre los modos Estándar y Workflow

## Panel de marcadores en la barra lateral

aegis-marcadores-ventana =
    .title = Administrar en una ventana
aegis-marcadores-todos =
    .label = Todos los marcadores
aegis-marcadores-ordenar =
    .title = Ordenar
aegis-marcadores-orden-propio =
    .label = Tu orden
aegis-marcadores-orden-nombre =
    .label = Nombre (A–Z)
aegis-marcadores-orden-recientes =
    .label = Más recientes primero
aegis-marcadores-vista =
    .title = Vista compacta
aegis-marcadores-editar =
    .title = Editar marcadores al hacer clic
aegis-marcadores-nueva-carpeta =
    .label = Nueva carpeta
aegis-marcadores-anadir-pestana =
    .label = Añadir pestaña actual

## Página de ajustes: cabecera de la barra lateral y grupos de categorías

aegis-ajustes-titulo = Ajustes
aegis-ajustes-grupo-personal = Personal
aegis-ajustes-grupo-navegacion = Navegación
aegis-ajustes-grupo-privacidad = Privacidad
aegis-ajustes-grupo-sistema = Sistema
aegis-ajustes-no-predeterminado =
    .message = { -brand-short-name } no es tu navegador predeterminado.

## Ajustes › Apariencia: icono de la app (Windows)

aegis-icono-titulo = Icono de la app
aegis-icono-descripcion = Se ve en las ventanas de { -brand-short-name }. Las ventanas privadas llevan siempre el fantasma con el hueco de la cerradura.
aegis-icono-fantasma = Fantasma
aegis-icono-uroboros = Uróboros

## Escudos (panel de la barra de direcciones)

aegis-escudos-boton =
    .tooltiptext = { $count ->
        [0] Escudos activos
        [one] Escudos activos: 1 bloqueado en esta página
       *[other] Escudos activos: { $count } bloqueados en esta página
    }
aegis-escudos-boton-bajados =
    .tooltiptext = Escudos bajados en este sitio
aegis-escudos-activos-sitio = Escudos activos para este sitio
aegis-escudos-bajados-sitio = Escudos bajados para este sitio
aegis-escudos-contador = { $count ->
        [one] anuncio o rastreador bloqueado en esta página
       *[other] anuncios y rastreadores bloqueados en esta página
    }
aegis-escudos-contador-bajados = Los Escudos están bajados: en este sitio no se bloquea nada.
aegis-escudos-total = { $total ->
        [one] 1 bloqueo desde que instalaste { -brand-short-name }
       *[other] { $total } bloqueos desde que instalaste { -brand-short-name }
    }
aegis-escudos-avanzadas = Opciones avanzadas
aegis-escudos-rastreadores = Rastreadores y anuncios
aegis-escudos-nivel-normal = Normal
aegis-escudos-nivel-estricto = Estricto
aegis-escudos-nivel-estricto-mas = Estricto+
aegis-escudos-personalizado = Personalizado
aegis-escudos-global = En todos los sitios
aegis-escudos-ver-bloqueado = Lo bloqueado en esta página
aegis-escudos-https = Pasar conexiones a HTTPS
aegis-escudos-https-activo = Solo HTTPS en este sitio
aegis-escudos-https-excepcion = Este sitio puede abrirse sin cifrar
aegis-escudos-https-apagado = El modo solo HTTPS está desactivado en Ajustes
aegis-escudos-scripts = Bloquear scripts
aegis-escudos-scripts-pronto = Pronto
aegis-escudos-huella = Huella digital
aegis-escudos-cookies = Cookies de terceros
aegis-escudos-cookies-entre-sitios = Bloquear rastreo
aegis-escudos-cookies-todas = Bloquear todas
aegis-escudos-olvidar = Olvidar este sitio al cerrar
aegis-escudos-olvidar-detalle = Borra sus cookies y datos al cerrar { -brand-short-name }
aegis-escudos-olvidar-privada = Una ventana privada ya lo olvida todo al cerrarla
aegis-escudos-listas = Listas de filtros
aegis-escudos-configuracion = Ajustes globales
aegis-escudos-pie = Si este sitio se ve mal, baja los Escudos para él. Eso reduce su protección.
aegis-escudos-lista-titulo = Lo bloqueado en esta página
aegis-escudos-atras =
    .aria-label = Atrás
aegis-escudos-cat-rastreadores = Rastreadores y anuncios
aegis-escudos-cat-anuncios = Anuncios (listas de filtros)
aegis-escudos-cat-sociales = Rastreadores de redes sociales
aegis-escudos-cat-huella = Huella digital
aegis-escudos-cat-criptomineros = Criptomineros
aegis-escudos-lista-vacia = No se ha bloqueado nada en esta página.

## Página de ajustes: nombres de Aegis en lugar de los de Firefox

aegis-ajustes-general = General
aegis-ajustes-inicio-predeterminado =
    .label = Inicio de { -brand-short-name } (predeterminado)
aegis-ajustes-inicio =
    .label = Inicio de { -brand-short-name }
aegis-ajustes-inicio-aviso =
    .message = Para usar estas funciones, abre las pestañas o las ventanas nuevas con Inicio de { -brand-short-name }.
aegis-ajustes-personalizar-inicio =
    .label = Personalizar Inicio de { -brand-short-name }

## Complementos (about:addons): cabecera de la barra lateral, buscador y estado vacío de Extensiones.

aegis-complementos-titulo = Complementos
# Texto de ayuda del buscador: abre la tienda de complementos en una pestaña.
aegis-complementos-buscar = Buscar complementos en la web
aegis-complementos-vacio = Aún no tienes extensiones.
aegis-complementos-vacio-boton = Buscar extensiones
# Panel de extensiones de la barra (la pieza de puzle) sin ninguna instalada: título, frase y, debajo, el botón
# aegis-complementos-vacio-boton, que abre la tienda de complementos en una pestaña.
aegis-extensiones-vacio-titulo = Aún no tienes extensiones
aegis-extensiones-vacio-texto = Búscalas en la tienda de complementos.
# Panel de extensiones con extensiones (al estilo de Chrome y Brave). Etiquetas de sección (se ven en MAYÚSCULAS):
# las fijadas en la barra de herramientas y, debajo, las que se ven solo dentro del panel.
aegis-extensiones-en-barra = En la barra
aegis-extensiones-en-panel = En este panel
# Botón de la chincheta de cada extensión (texto de ayuda y para lectores de pantalla). Dice lo que hace al pulsarlo.
# Variables:
#   $nombre (String) - nombre de la extensión
aegis-extensiones-fijar = Fijar { $nombre } en la barra
aegis-extensiones-desfijar = Quitar { $nombre } de la barra
# Pie del panel: abre Complementos › Extensiones (about:addons) y la tienda de complementos en una pestaña.
aegis-extensiones-gestionar = Gestionar extensiones
aegis-extensiones-anadir = Añadir extensiones

## Barra lateral y barra de marcadores

# Pie de «Personalizar barra lateral»: abre los Ajustes del navegador.
aegis-barra-ajustes = Ajustes de { -brand-short-name }
# Botón junto al aviso de la barra de marcadores vacía: la oculta mientras no tenga marcadores (vuelve sola con el primero).
aegis-marcadores-aviso-cerrar = Ahora no
    .title = Ocultar la barra de marcadores mientras esté vacía

## Contraseñas (about:logins): estado vacío. La bóveda propia llegará más adelante.

aegis-contrasenas-vacio = Aquí verás las contraseñas que guardes al iniciar sesión en una web.
aegis-contrasenas-importar = Importar contraseñas

## Contraseñas: protección (contrasenas.sys.mjs), panel de la barra lateral (contrasenas-panel.sys.mjs) y aviso de
## about:logins. «Contraseña principal» es el término de Firefox (Primary Password): el mismo en todo el navegador.

# Botón del aviso del panel y de about:logins: abre el diálogo de la contraseña principal.
aegis-contrasenas-principal-crear = Crear contraseña principal
# Aviso del panel y de about:logins cuando no hay contraseña principal.
aegis-contrasenas-sin-principal = Sin contraseña principal: cualquier programa que copie tu perfil podría leer las contraseñas guardadas.
# Estado vacío del panel de la barra lateral.
aegis-contrasenas-panel-titulo = Tus contraseñas, bajo llave
aegis-contrasenas-panel-texto = { -brand-short-name } las guarda cifradas en este equipo, bajo tu contraseña principal, y no las envía a ningún sitio.

## Ajustes › Contraseñas y autorrelleno: «Cierre automático de la bóveda» (ajustes.sys.mjs), detrás de «Contraseñas». Segmentos:
## Nunca, 15, 10, 5, 3, 2 y 1 min; caben siete en una fila, así que las etiquetas son cortas.

aegis-bloqueo-titulo = Cierre automático de las contraseñas
aegis-bloqueo-descripcion = Tras este tiempo sin usar el equipo, las contraseñas guardadas se cierran y { -brand-short-name } vuelve a pedir la contraseña principal. También se cierran al suspender el equipo y al cerrar { -brand-short-name }.
aegis-bloqueo-nunca-aviso = Con «Nunca», solo se cierran al cerrar { -brand-short-name } o al suspender el equipo.
aegis-bloqueo-sin-principal = Solo tiene efecto con una contraseña principal.
aegis-bloqueo-nunca = Nunca
# Cada segmento con minutos. $minutos: 1, 2, 3, 5, 10 o 15.
aegis-bloqueo-minutos = { $minutos } min

## Diálogo de la contraseña principal (dialogos/contrasena-principal.xhtml), en lugar del de Firefox: crearla
## (antes de guardar la primera contraseña, desde el panel, about:logins o Ajustes) o cambiarla (Ajustes). Ancho
## fijo de 440 px: los textos largos pasan a otra línea.

# Título de la ventana o del marco del diálogo (Ajustes lo muestra arriba).
aegis-principal-ventana = Contraseña principal
aegis-principal-titulo-crear = Crea tu contraseña principal
aegis-principal-titulo-cambiar = Cambia tu contraseña principal
# Antes de guardar la primera contraseña (botones «No guardar» y «Crear y guardar»).
aegis-principal-explicacion-guardar = Para guardar contraseñas, { -brand-short-name } las cifra con una contraseña principal. Sin ella, cualquier programa que copie tu perfil podría leerlas. Te la pedirá una vez por sesión y otra vez tras un rato sin usar el equipo.
# Desde el aviso del panel o de about:logins, o desde Ajustes.
aegis-principal-explicacion-crear = { -brand-short-name } cifra con ella las contraseñas que guardas. Sin ella, cualquier programa que copie tu perfil podría leerlas. Te la pedirá una vez por sesión y otra vez tras un rato sin usar el equipo.
aegis-principal-explicacion-cambiar = Para cambiarla necesitas la actual. Tus contraseñas guardadas seguirán ahí, protegidas con la nueva.
# Si una política de empresa exige la contraseña principal.
aegis-principal-politica = Tu organización exige una contraseña principal.
aegis-principal-actual = Contraseña principal actual
aegis-principal-nueva = Contraseña principal
aegis-principal-nueva-cambiar = Nueva contraseña principal
aegis-principal-repetir = Repítela
# Botón con el icono del ojo dentro de cada campo: muestra u oculta lo escrito.
aegis-principal-mostrar =
    .title = Mostrar la contraseña
    .aria-label = Mostrar la contraseña
# Debajo del campo, antes de escribir: el mínimo de Aegis.
aegis-principal-requisito = Al menos 12 caracteres. Una frase de cuatro o más palabras es fácil de recordar y difícil de adivinar.
# Mientras se escribe, lo que falta o el nivel. $faltan: caracteres que faltan para llegar a 12.
aegis-principal-corta =
    { $faltan ->
        [one] Demasiado corta: falta { $faltan } carácter.
       *[other] Demasiado corta: faltan { $faltan } caracteres.
    }
aegis-principal-comun = Demasiado fácil de adivinar: evita palabras y contraseñas muy usadas.
aegis-principal-secuencia = Demasiado fácil de adivinar: evita secuencias como «1234» o «qwerty».
aegis-principal-repetida = Demasiado fácil de adivinar: tiene demasiadas repeticiones.
aegis-principal-variedad = Demasiado fácil de adivinar: usa más caracteres distintos.
aegis-principal-aceptable = Fortaleza: aceptable. Más larga sería mejor.
aegis-principal-fuerte = Fortaleza: fuerte.
aegis-principal-muy-fuerte = Fortaleza: muy fuerte.
aegis-principal-no-coinciden = Las dos contraseñas no coinciden.
aegis-principal-error-actual = La contraseña actual no es correcta. Vuelve a escribirla.
aegis-principal-error = No se ha podido guardar la contraseña principal. Vuelve a intentarlo.
# Tarjeta de aviso: no se puede recuperar (restablecerla en Firefox borra las contraseñas guardadas).
aegis-principal-olvido-titulo = Si la olvidas, no se puede recuperar
aegis-principal-olvido-texto = { -brand-short-name } no la guarda en ningún sitio y nadie puede enviártela. Para volver a empezar habría que restablecerla, y eso borra todas las contraseñas guardadas.
# La línea de honestidad: qué protege y qué no.
aegis-principal-limites = Protege tus contraseñas si alguien copia tu perfil, entra con otra cuenta de este equipo o se lleva el disco. No las protege de un programa malicioso que ya controle tu equipo: podría registrar lo que escribes, también esta contraseña.
# Botones. «No guardar» y «Crear y guardar», antes de guardar; los demás, desde Ajustes, el panel o about:logins.
aegis-principal-no-guardar = No guardar
aegis-principal-cancelar = Cancelar
aegis-principal-crear-guardar = Crear y guardar
aegis-principal-crear = Crear contraseña
aegis-principal-cambiar = Cambiar contraseña

## Códigos de verificación (autenticador/): panel de contraseñas, about:logins, el autorrelleno y el diálogo para
## añadirlos (dialogos/autenticador.xhtml). «Código de verificación» es el código de 6 u 8 cifras de la verificación
## en dos pasos (TOTP); «clave de configuración», el texto que da la web para configurarlo (glosario).

# Panel de contraseñas: título de la sección plegable.
aegis-codigos-titulo = Códigos de verificación
aegis-codigos-vacio = Guarda aquí el código de verificación en dos pasos de una cuenta y { -brand-short-name } te dará sus códigos.
# Botón compacto del panel: abre el diálogo para añadir uno.
aegis-codigos-anadir = Añadir código
# Botones de icono de cada fila del panel. $sitio: el dominio («github.com»).
aegis-codigos-ver =
    .title = Mostrar el código de { $sitio }
    .aria-label = Mostrar el código de { $sitio }
aegis-codigos-copiar =
    .title = Copiar el código de { $sitio }
    .aria-label = Copiar el código de { $sitio }
aegis-codigos-editar =
    .title = Cambiar o quitar el código de { $sitio }
    .aria-label = Cambiar o quitar el código de { $sitio }
# Junto al código a la vista: segundos que le quedan. Cabe en poco: «18 s».
aegis-codigos-restante = { $segundos } s
# Tras copiar. $segundos: tras cuántos segundos se borra (30 de serie).
aegis-codigos-copiado = Código copiado. Se borrará del portapapeles en { $segundos } s si sigue ahí.
aegis-codigos-copiado-sin-borrar = Código copiado.
aegis-codigos-ilegible = No se puede leer este código. Vuelve a añadirlo.
# Mensaje y título del diálogo de Windows Hello al ver o copiar un código.
aegis-codigos-autenticacion-ver = Para ver el código de verificación, introduce tus credenciales de Windows. Así proteges tus cuentas.
aegis-codigos-autenticacion-copiar = Para copiar el código de verificación, introduce tus credenciales de Windows. Así proteges tus cuentas.
aegis-codigos-autenticacion-titulo = { -brand-short-name }
# about:logins: la fila de la contraseña elegida y sus botones compactos.
aegis-codigos-etiqueta = Código de verificación
aegis-codigos-ninguno = Sin código de verificación
aegis-codigos-boton-mostrar = Mostrar
aegis-codigos-boton-ocultar = Ocultar
aegis-codigos-boton-copiar = Copiar
aegis-codigos-boton-cambiar = Cambiar
aegis-codigos-boton-anadir = Añadir
# Autorrelleno: el panelito junto al campo del código en la web. $sitio: el dominio.
aegis-codigos-ofrecer-titulo = Código de verificación
aegis-codigos-ofrecer-texto = { -brand-short-name } tiene el código de { $sitio }.
aegis-codigos-rellenar = Rellenar el código
# Con varias cuentas en el sitio. $cuenta: el usuario (o un número).
aegis-codigos-rellenar-cuenta = Rellenar el código de { $cuenta }
# Panel de contraseñas (solo Windows): sección «Passkeys». No prometer sincronización.
aegis-passkeys-titulo = Passkeys
aegis-passkeys-texto = Las passkeys (claves de acceso) que crees en una web las guarda Windows Hello en este equipo. Si tiene chip de seguridad (TPM), la clave privada no sale de él; si no, Windows la protege por software. { -brand-short-name } no la ve ni la copia. Las de Windows Hello no se sincronizan con otros equipos; si en el aviso de Windows eliges otro proveedor de passkeys, se guardan donde él diga.
# Abre la Configuración de Windows › Cuentas › Claves de acceso.
aegis-passkeys-gestionar = Gestionar en Windows
# Diálogo para añadir, cambiar o quitar un código de verificación.
aegis-autenticador-ventana = Código de verificación
aegis-autenticador-titulo = Añadir código de verificación
aegis-autenticador-titulo-editar = Código de verificación
aegis-autenticador-explicacion = Cuando una web te pida configurar una app de autenticación, lee aquí su código QR o copia su clave de configuración. { -brand-short-name } calculará los códigos en este equipo.
aegis-autenticador-cuenta = Cuenta
# Primera opción del desplegable de cuentas.
aegis-autenticador-elige = Elige una cuenta guardada
aegis-autenticador-sin-cuentas = Primero guarda la contraseña de esa cuenta en { -brand-short-name }.
aegis-autenticador-existe = Esta cuenta ya tiene un código de verificación. Si guardas otra clave, sustituye a la anterior.
aegis-autenticador-clave = Clave de configuración o enlace otpauth://
# Botón del ojo dentro del campo de la clave.
aegis-autenticador-mostrar =
    .title = Mostrar la clave
    .aria-label = Mostrar la clave
# Botones compactos para leer el código QR (en el equipo, sin red).
aegis-autenticador-qr-pagina = Leer el QR de esta página
aegis-autenticador-qr-imagen = Leer el QR de una imagen…
# Título del selector de archivos.
aegis-autenticador-qr-imagen-titulo = Elige una imagen con el código QR
aegis-autenticador-qr-no = No se ha encontrado ningún código QR. Haz que se vea entero y vuelve a intentarlo.
aegis-autenticador-qr-otro = Ese código QR no es de una app de autenticación.
# La clave es válida. $emisor: quien la da; $digitos: 6–8; $periodo: segundos (30).
aegis-autenticador-valida = { $emisor }: { $digitos } cifras cada { $periodo } s.
aegis-autenticador-valida-sin-emisor = Clave válida: { $digitos } cifras cada { $periodo } s.
aegis-autenticador-error-formato = No es una clave válida. Copia la clave de configuración o el enlace otpauth:// completos.
aegis-autenticador-error-hotp = Los códigos por contador (HOTP) no se admiten: solo los que cambian con el tiempo (TOTP).
aegis-autenticador-error-corta = La clave es demasiado corta para ser segura.
aegis-autenticador-error-parametros = Este código usa un formato que no se admite (cifras o periodo poco habituales).
aegis-autenticador-error-guardar = No se ha podido guardar el código. Vuelve a intentarlo.
# La tarjeta de honestidad: los dos pasos juntos en la bóveda.
aegis-autenticador-honestidad-titulo = Los dos pasos, en un solo sitio
aegis-autenticador-honestidad = Guardar el código junto a la contraseña reúne los dos pasos en { -brand-short-name }: quien desbloqueara tus contraseñas guardadas tendría los dos. Los protegen tu contraseña principal y la verificación de identidad al ver o copiar un código. Para tus cuentas más importantes, un autenticador en otro dispositivo es más seguro.
# Quitar pide dos pulsaciones: la segunda con «-confirmar» y el aviso.
aegis-autenticador-quitar = Quitar el código
aegis-autenticador-quitar-confirmar = Quitar definitivamente
aegis-autenticador-quitar-aviso = Antes de quitarlo, asegúrate de poder entrar de otra forma (por ejemplo, con los códigos de recuperación de la web).
aegis-autenticador-cancelar = Cancelar
aegis-autenticador-guardar = Guardar

## Énfasis de color (Ajustes › Apariencia y «Personalizar» de la nueva pestaña)

aegis-enfasis-titulo = Énfasis
aegis-enfasis-descripcion = El color de la selección, el foco, los interruptores, el borde de la pestaña activa y el degradado del marco.
aegis-enfasis-automatico = «Color de Windows» y «Fondo de escritorio» cambian solos cuando los cambias en Windows. El fondo se lee en este equipo y no sale de él.
aegis-enfasis-monocromo = Monocromo
aegis-enfasis-windows = Color de Windows
aegis-enfasis-fondo = Fondo de escritorio
aegis-enfasis-hielo = Hielo
aegis-enfasis-pizarra = Pizarra
aegis-enfasis-salvia = Salvia
aegis-enfasis-ambar = Ámbar
aegis-enfasis-coral = Coral
aegis-enfasis-lavanda = Lavanda
aegis-enfasis-malva = Malva
aegis-enfasis-cobalto = Cobalto
aegis-enfasis-piedra = Piedra
aegis-enfasis-laguna = Laguna
aegis-enfasis-musgo = Musgo
aegis-enfasis-frambuesa = Frambuesa
aegis-enfasis-ciruela = Ciruela

## Énfasis personalizado: el «+» de los selectores y su ventana («Crear» y «Mis énfasis»)

# Nombre de la opción del «+» en Ajustes y principio de sus etiquetas.
aegis-enfasis-propio = A medida
# Etiqueta (y descripción emergente) del «+» sin ningún personalizado en uso.
aegis-enfasis-propio-abrir = A medida: crea uno o elige uno guardado
# El «+» con un personalizado en uso. $nombre: su nombre o sus códigos (p. ej. #88C0DC)
aegis-enfasis-propio-abrir-activo = A medida: { $nombre }
# Línea del elegido, bajo las muestras de la nueva pestaña. $nombre: su nombre o sus códigos
aegis-enfasis-propio-actual = A medida: { $nombre }
aegis-enfasis-propio-titulo = Énfasis personalizado
aegis-enfasis-propio-cerrar = Cerrar
# Las dos pestañas de la ventana.
aegis-enfasis-propio-crear = Crear
aegis-enfasis-propio-mis = Mis énfasis
aegis-enfasis-propio-degradado = Degradado
aegis-enfasis-propio-degradado-ayuda = Un segundo color para el marco y el borde de la pestaña activa. Lo demás usa el primero.
# Para lectores de pantalla: los dos segmentos que eligen qué color se edita.
aegis-enfasis-propio-editando = Color que editas
aegis-enfasis-propio-color-1 = Primer color
aegis-enfasis-propio-color-2 = Segundo color
# El cuadro de color, para lectores de pantalla. $saturacion y $brillo: de 0 a 100
aegis-enfasis-propio-area = Saturación y brillo
aegis-enfasis-propio-area-valor = Saturación { $saturacion } %, brillo { $brillo } %
aegis-enfasis-propio-tono = Tono
# Campo del color en hexadecimal (#RRGGBB).
aegis-enfasis-propio-hex = Código
aegis-enfasis-propio-hex-error = Escribe un color en hexadecimal, como #88C0DC.
aegis-enfasis-propio-nombre = Nombre
aegis-enfasis-propio-nombre-ejemplo = Opcional
aegis-enfasis-propio-vista = Así queda
aegis-enfasis-propio-ajuste = { -brand-short-name } ajusta el brillo y la intensidad para que se lea bien en claro y en oscuro.
aegis-enfasis-propio-guardar = Guardar
aegis-enfasis-propio-usar = Usar
aegis-enfasis-propio-guardado = Guardado en «Mis énfasis».
aegis-enfasis-propio-actualizado = Ya estaba en «Mis énfasis».
# $maximo: cuántos se pueden guardar (24)
aegis-enfasis-propio-lleno = Ya tienes { $maximo } guardados. Borra alguno en «Mis énfasis» para guardar otro.
# $cuantos: los guardados; $maximo: el límite (24)
aegis-enfasis-propio-cuenta = { $cuantos } de { $maximo }
# Supr (Delete): la tecla que borra el guardado con el foco.
aegis-enfasis-propio-mis-ayuda = Elige uno para usarlo. Supr lo borra.
aegis-enfasis-propio-sin-nombre = Sin nombre
aegis-enfasis-propio-editar = Editar
aegis-enfasis-propio-borrar = Borrar
# $nombre: el nombre del guardado (o el texto de «sin nombre»)
aegis-enfasis-propio-borrar-pregunta = ¿Borrar «{ $nombre }»? No se puede deshacer.
aegis-enfasis-propio-borrar-confirmar = Borrar
aegis-enfasis-propio-cancelar = Cancelar
aegis-enfasis-propio-borrado = «{ $nombre }» se ha borrado.
aegis-enfasis-propio-vacio-titulo = Aún no hay ninguno guardado
# Estado vacío de «Mis énfasis». $maximo: cuántos se pueden guardar (24)
aegis-enfasis-propio-vacio = Crea un énfasis y pulsa «Guardar»: aparecerá aquí para usarlo con un clic. Caben { $maximo }.
aegis-enfasis-propio-ir-crear = Crear uno

## Nueva pestaña › Personalizar: fondo, diseño (buscador, accesos y espaciado)

aegis-np-fondo-titulo = Fondo
aegis-np-fondo-liso = Liso
aegis-np-fondo-degradado = Degradado
aegis-np-fondo-enfasis = Énfasis
aegis-np-fondo-imagen = Imagen
aegis-np-imagen-cambiar = Cambiar imagen…
aegis-np-imagen-error = No se ha podido usar esa imagen. Prueba con otra JPG, PNG, WebP, AVIF o GIF de menos de 20 MB.
aegis-np-diseno-titulo = Diseño
aegis-np-buscador = Mostrar el buscador
aegis-np-posicion = Posición del buscador
aegis-np-posicion-centro = En el centro
aegis-np-posicion-arriba = Más arriba
aegis-np-accesos = Accesos
aegis-np-accesos-arriba = Encima del buscador
aegis-np-accesos-abajo = Debajo del buscador
aegis-np-espaciado = Espaciado
# $px: número de píxeles
aegis-np-espaciado-valor = { $px } px
aegis-np-ancho = Ancho del buscador

## Menú de buscadores de la barra de direcciones (la lupa)

# Fila que sale cuando el buscador elegido para esta búsqueda no es el predeterminado. $buscador: nombre del buscador, p. ej. Google
aegis-buscador-predeterminado = Usar { $buscador } como predeterminado

## Nueva pestaña › Añadir o editar un acceso: el logo de la web como imagen del acceso

# Enlace junto a «Usar una imagen personalizada». Busca el icono de la web (primero en el equipo, luego en la propia web) y lo pone como imagen personalizada.
aegis-logo-usar = Usar el logo de la web
aegis-logo-buscando = Buscando el logo…
aegis-logo-sin-direccion = Escribe primero la dirección del acceso.
aegis-logo-error = No se ha podido usar el logo de esta web. Prueba con una imagen personalizada.
aegis-logo-error-red = No se ha podido traer el logo de la web. Revisa la dirección o vuelve a intentarlo más tarde.

## Webs en oscuro (Ajustes › Apariencia y fila «Oscurecer este sitio» del panel de Escudos)

aegis-webs-oscuro-titulo = Webs en oscuro
aegis-webs-oscuro-descripcion = Las webs se adaptan al tema oscuro de { -brand-short-name }. Solo cuando { -brand-short-name } está en oscuro; las imágenes y los vídeos no cambian.
aegis-webs-oscuro-aviso = Una web puede notar que se ha cambiado su aspecto.
aegis-webs-oscuro-apagado = Apagado
aegis-webs-oscuro-todas = Todas las webs
aegis-webs-oscuro-sin-modo-oscuro = Solo las que no tienen modo oscuro
aegis-escudos-oscuro = Oscurecer este sitio
aegis-escudos-oscuro-activo = Se adapta al tema oscuro
aegis-escudos-oscuro-propio = Este sitio ya tiene modo oscuro
aegis-escudos-oscuro-claro = Solo cuando { -brand-short-name } está en oscuro
aegis-escudos-oscuro-excepcion = No se oscurece en este sitio

## Huella digital (Ajustes › Privacidad, panel de Escudos y aviso de Caja fuerte)

aegis-huella-titulo = Huella digital
aegis-huella-descripcion = Lo que las webs pueden leer de tu navegador para reconocerte sin cookies: la pantalla, las fuentes, la tarjeta gráfica, la zona horaria y más.
aegis-huella-nivel-basica = Básica
aegis-huella-nivel-basica-descripcion = Solo la protección que trae el navegador.
aegis-huella-nivel-equilibrada = Equilibrada
aegis-huella-nivel-equilibrada-descripcion = Oculta todo lo que puede sin romper las webs. La recomendada.
aegis-huella-nivel-estricta = Estricta
aegis-huella-nivel-estricta-descripcion = Oculta también la posición de la ventana, las fuentes, las voces y lo que puede hacer la tarjeta gráfica. Alguna web puede fallar.
aegis-huella-nivel-caja-fuerte = Caja fuerte
aegis-huella-nivel-caja-fuerte-descripcion = Oculta casi todo lo que la protección sabe ocultar (no el tema oscuro o claro ni el tamaño de la pantalla): las webs ven la hora UTC, el inglés y 60 fps, no ven tus ajustes de accesibilidad y el alto contraste deja de aplicarse en ellas. Para leer un canvas tienen que pedirte permiso, y puedes dejar a un sitio ver los datos del navegador. Muchas webs fallarán.
aegis-huella-nota = Ninguna protección es perfecta: las webs siguen viendo tu dirección IP, y { -brand-short-name } no es Tor Browser.
aegis-huella-permitidos-titulo = Sitios con permiso en Caja fuerte
aegis-huella-permitidos-vacio = Ningún sitio tiene permiso.
# $sitio: dominio del sitio, p. ej. ejemplo.com
aegis-huella-quitar = Quitar
    .aria-label = Quitar { $sitio }
aegis-huella-apagada = Desactivada en la protección contra rastreo
aegis-huella-permitir-sitio = Permitir en este sitio
aegis-huella-permiso-no = Datos del navegador: bloqueados
aegis-huella-permiso-si = Datos del navegador: protección equilibrada
aegis-huella-permiso-privada = Solo desde una ventana normal
aegis-huella-permiso-no-disponible = No disponible para esta dirección
# <> se cambia por el nombre del sitio (en negrita). Se deja tal cual.
aegis-huella-aviso = <> ha intentado leer datos de tu navegador. Caja fuerte se los ha ocultado.
aegis-huella-aviso-permitir =
    .label = Permitir en este sitio
    .accesskey = P
aegis-huella-aviso-bloquear =
    .label = Seguir bloqueando
    .accesskey = S

## Tor: «Nueva ventana privada con Tor» (menú ☰, Mayús+Alt+N), Ajustes › Privacidad › Tor, el indicador de la barra
## y about:privatebrowsing en la instancia con Tor. «Tor» y «Tor Browser» son nombres de otro proyecto: no se traducen.

aegis-tor-titulo = Tor
aegis-tor-descripcion = Abre ventanas privadas que van por la red de Tor: las webs no ven tu IP. Es otro { -brand-short-name } aparte, con su propio perfil, que se borra al cerrarlo, y no comparte nada con tus demás ventanas.
aegis-tor-honestidad = { -brand-short-name } con Tor no es Tor Browser: a { -brand-short-name } se le distingue más que a Tor Browser, que parece el mismo navegador para todos. Para un anonimato fuerte, usa Tor Browser. Lo que abras fuera del navegador (una descarga con otro programa, un enlace de correo) no va por Tor.
aegis-tor-no-descargado = Tor no está descargado
# $tamano: megabytes, p. ej. 21,5; $origen: servidor, p. ej. dist.torproject.org
aegis-tor-origen = { $tamano } MB del Tor Project ({ $origen }). Se comprueba su huella sha256 antes de instalarlo.
# $progreso: porcentaje
aegis-tor-descargando = Descargando… { $progreso } %
aegis-tor-comprobando = Comprobando el paquete…
# $progreso: porcentaje
aegis-tor-extrayendo = Instalando… { $progreso } %
# $tor: versión de tor; $version: versión del paquete (la de Tor Browser de la que sale)
aegis-tor-listo = Tor { $tor } descargado (paquete { $version })
aegis-tor-desactualizado = Hay una versión nueva de Tor (paquete { $version })
aegis-tor-boton-descargar = Descargar Tor
aegis-tor-boton-actualizar = Actualizar
aegis-tor-boton-cancelar = Cancelar
aegis-tor-boton-borrar = Borrar
aegis-tor-borrar-abierta = Cierra las ventanas con Tor para poder borrarlo.
aegis-tor-abrir-titulo = Nueva ventana privada con Tor
aegis-tor-abrir-detalle = También desde el menú o con Mayús+Alt+N.
aegis-tor-boton-abrir = Abrir
aegis-tor-puentes-titulo = Puentes
aegis-tor-puentes-descripcion = Para redes que bloquean Tor. Se aplica la próxima vez que abras una ventana con Tor.
aegis-tor-puentes-ninguno = Sin puentes
aegis-tor-puentes-obfs4 = obfs4
aegis-tor-puentes-snowflake = Snowflake
aegis-tor-nota-huella = La ventana con Tor usa Caja fuerte: Tor oculta tu IP, pero lo que el navegador cuenta de sí mismo depende de { -brand-short-name }.
aegis-tor-nota-buscadores = Algunos buscadores, como Google, piden captchas o bloquean las conexiones que llegan por Tor. DuckDuckGo funciona.
aegis-tor-instancia-texto = Esta es una ventana privada con Tor: todo su tráfico va por Tor y nada se guarda al cerrarla.
aegis-tor-boton-identidad = Nueva identidad
aegis-tor-error-descarga = No se ha podido descargar Tor. Comprueba la conexión y vuelve a intentarlo.
aegis-tor-error-suma = Lo descargado no es el paquete esperado (su huella sha256 no coincide) y se ha descartado. Vuelve a intentarlo más tarde.
aegis-tor-error-sin-descargar = Tor no está descargado: descárgalo en Ajustes › Privacidad.
aegis-tor-error-arranque = Tor no ha podido arrancar. Si Windows lo ha bloqueado, permítelo y abre otra ventana con Tor.
aegis-tor-error-caido = Tor se ha cerrado. Cierra esta ventana y abre otra con Tor.
aegis-tor-aviso-red = Tor tiene problemas para conectar. Si tu red bloquea Tor, prueba con puentes.
aegis-tor-red-arrancando = Tor: arrancando…
# $progreso: porcentaje
aegis-tor-red-conectando = Tor: conectando… { $progreso } %
aegis-tor-red-conectado = Tor: conectado
aegis-tor-red-error = Tor: sin conexión.
aegis-tor-red-parado = Tor: parado.
aegis-tor-privada-nota = Las webs ven una IP de la red de Tor, no la tuya. { -brand-short-name } con Tor no es Tor Browser.
aegis-tor-menu-ventana =
    .label = Nueva ventana privada con Tor
aegis-tor-menu-identidad =
    .label = Nueva identidad de Tor
aegis-tor-menu-ajustes =
    .label = Ajustes de Tor
aegis-tor-ofrecer-titulo = Descargar Tor
# $tamano: megabytes, p. ej. 21,5
aegis-tor-ofrecer-texto = Para abrir una ventana privada con Tor hace falta Tor, que no viene con { -brand-short-name }. Se descargarán { $tamano } MB del Tor Project (dist.torproject.org) y se comprobará su huella antes de instalarlo en tu perfil.
aegis-tor-ofrecer-botones =
    .descargar = Descargar
aegis-tor-identidad-confirmar = Se cerrarán todas las ventanas con Tor, se borrará lo de esta sesión y Tor usará circuitos nuevos.
    .title = Nueva identidad
    .aceptar = Nueva identidad

## Google (Ajustes › Privacidad; google.sys.mjs). «Google» y «YouTube» son nombres propios: no se traducen.

aegis-google-titulo = Google
aegis-google-descripcion = La protección contra rastreo no actúa en las webs de Google ni de YouTube. { -brand-short-name } corta ahí sus datos de uso y sus anuncios, y los enlaces de los resultados van directos a la web.
# Mismo nombre que la sección «Google limpio» de about:escudos (escudos-ayuda-google-titulo).
aegis-google-limpio = Google limpio
aegis-google-limpio-detalle = Google sigue viendo tu IP, lo que buscas y, si inicias sesión, quién eres.
# Pide a Google la vista «Web» (udm=14). Solo actúa con «Google limpio» encendido.
aegis-google-solo-web = Solo resultados web en Google
aegis-google-solo-web-detalle = En las búsquedas desde la barra de direcciones, sin respuestas de IA ni módulos.

## Enlaces a «Cómo funcionan los Escudos» (about:escudos)

# Pie del panel de Escudos: abre la página de ayuda en una pestaña.
aegis-escudos-ayuda = Cómo funcionan los Escudos
# Ajustes: enlace junto a cada opción de Escudos y de huella; abre la ayuda en su sección.
aegis-ayuda-rastreo = Más información
    .aria-label = Más información sobre la protección contra rastreo
aegis-ayuda-cookies = Más información
    .aria-label = Más información sobre las cookies de terceros
aegis-ayuda-https = Más información
    .aria-label = Más información sobre el modo solo HTTPS
aegis-ayuda-olvidar = Más información
    .aria-label = Más información sobre olvidar sitios al cerrar
aegis-ayuda-huella = Más información
    .aria-label = Más información sobre la huella digital
aegis-ayuda-google = Más información
    .aria-label = Más información sobre Google limpio

## Escudos: molestias, excepciones por sitio y Ajustes › Escudos (escudos.sys.mjs, escudos/ajustes.sys.mjs)

# Panel de Escudos › Opciones avanzadas: línea de detalle de los interruptores generales de molestias (valen para todos los sitios).
aegis-escudos-molestia-activa = Se ocultan en todos los sitios
aegis-escudos-molestia-apagada = Apagado en todos los sitios
aegis-escudos-molestia-permitida-sitio = Permitidos en este sitio

# Fila que abre Ajustes › Escudos con este sitio elegido. Debajo: los grupos permitidos en el sitio, o «Ninguna».
aegis-escudos-excepciones-sitio = Excepciones de este sitio…
aegis-escudos-excepciones-ninguna = Ninguna

# Grupos de las excepciones por sitio: los mismos nombres en el panel, en Ajustes y en about:escudos.
aegis-escudos-grupo-anuncios = Anuncios
aegis-escudos-grupo-rastreadores = Rastreadores
aegis-escudos-grupo-cookies-avisos = Avisos de cookies
aegis-escudos-grupo-molestias = Ventanas y banners
aegis-escudos-grupo-antiadblock = Avisos anti-bloqueador
aegis-escudos-grupo-cosmetico = Elementos ocultos
aegis-escudos-grupo-scriptlets = Scripts de las listas

# Ajustes › Escudos: nombre de la categoría en la barra lateral y título de la página.
aegis-ajustes-escudos = Escudos
aegis-ajustes-escudos-descripcion = Qué bloquean los Escudos en todas las webs y las excepciones de cada sitio.

# Nivel: tarjetas de opción con una línea honesta cada una.
aegis-ajustes-escudos-nivel-titulo = Nivel
aegis-ajustes-escudos-nivel-descripcion = Cuánto bloquean los Escudos en todos los sitios. Es el mismo ajuste que el del panel.
aegis-ajustes-escudos-nivel-normal = Normal
aegis-ajustes-escudos-nivel-normal-descripcion = Bloquea los rastreadores conocidos y los anuncios de las listas de filtros. Casi ninguna web falla.
aegis-ajustes-escudos-nivel-estricto = Estricto
aegis-ajustes-escudos-nivel-estricto-descripcion = Además, bloquea vídeos, comentarios y botones de redes sociales que rastrean, y quita de los enlaces los datos de seguimiento. Alguna web puede verse incompleta.
aegis-ajustes-escudos-nivel-estricto-mas = Estricto+ (recomendado)
aegis-ajustes-escudos-nivel-estricto-mas-descripcion = Lo de Estricto y una lista de rastreo más amplia (AdGuard Tracking Protection). Usa algo más de memoria.
aegis-ajustes-escudos-nivel-personalizado = Has cambiado a mano la protección contra rastreo en Privacidad, así que ningún nivel coincide. Elige uno para volver.
aegis-ajustes-escudos-nivel-nota = Ningún nivel hace el bloqueo invisible: una web puede notar que faltan sus anuncios.

# Molestias: tres interruptores generales (los nombres son aegis-escudos-grupo-*).
aegis-ajustes-escudos-molestias-titulo = Molestias
aegis-ajustes-escudos-molestias-descripcion = Se ocultan en todos los sitios. Para verlas en una web concreta, añádela en «Excepciones por sitio».
aegis-ajustes-escudos-molestia-cookies-detalle = Banners de consentimiento. Ocultar uno no siempre equivale a rechazar: la web decide qué hace sin tu respuesta.
aegis-ajustes-escudos-molestia-ventanas-detalle = Ventanas emergentes, banners para instalar apps, widgets y otras molestias.
aegis-ajustes-escudos-molestia-antiadblock-detalle = Avisos que piden desactivar el bloqueador. No funciona en todas las webs.
aegis-ajustes-escudos-molestias-nota = Cada grupo usa listas de sus autores (uBlock Origin, AdGuard y EasyList). Al cambiarlo, los Escudos tardan unos segundos en prepararlas.

# Contador: dos segmentos y una línea que explica el elegido.
aegis-ajustes-escudos-contador-titulo = Contador
aegis-ajustes-escudos-contador-descripcion = Qué cuenta el número del botón de los Escudos y de su panel.
aegis-ajustes-escudos-contador-peticiones = Peticiones
aegis-ajustes-escudos-contador-origenes = Orígenes
aegis-ajustes-escudos-contador-peticiones-detalle = Cada petición bloqueada suma una, aunque vaya al mismo servidor.
aegis-ajustes-escudos-contador-origenes-detalle = Cada servidor bloqueado suma una sola vez por página, aunque lo intente muchas veces.

# Listas de filtros. $listas: número de listas; $fecha: fecha y hora; $dias: número de días.
aegis-ajustes-escudos-listas-titulo = Listas de filtros
aegis-ajustes-escudos-listas-descripcion = Las reglas son de sus autores (uBlock Origin, EasyList, AdGuard y Brave). { -brand-short-name } las descarga directamente de ellos, sin cookies.
aegis-ajustes-escudos-listas-activas = { $listas ->
        [one] 1 lista activa
       *[other] { $listas } listas activas
    }
aegis-ajustes-escudos-ultima = Última actualización: { $fecha }
aegis-ajustes-escudos-actualizar-ahora = Actualizar ahora
aegis-ajustes-escudos-actualizando = Actualizando…
aegis-ajustes-escudos-resultado-nuevas = Listas actualizadas
aegis-ajustes-escudos-resultado-iguales = Ya estaban al día
aegis-ajustes-escudos-resultado-fallos = { $listas ->
        [one] Una lista no se ha podido descargar y se queda la versión anterior
       *[other] { $listas } listas no se han podido descargar y se quedan las versiones anteriores
    }
aegis-ajustes-escudos-resultado-sin-permiso = Falta el permiso de Conexiones para descargarlas
aegis-ajustes-escudos-resultado-error = No se han podido actualizar. Vuelve a intentarlo más tarde
aegis-ajustes-escudos-automatica = Actualizar las listas solas
aegis-ajustes-escudos-automatica-detalle = Una revisión al día; cada lista se pide solo cuando caduca.
aegis-ajustes-escudos-automatica-sin-permiso = Necesita el permiso «Listas de protección» de Conexiones.
aegis-ajustes-escudos-sin-conexiones = Mientras no lo des, los Escudos usan las listas que trae { -brand-short-name }.
aegis-ajustes-escudos-elegir-conexiones = Elegir conexiones

# Encima de los segmentos 1, 2, 4 y 7 días (aegis-ajustes-escudos-dias).
aegis-ajustes-escudos-intervalo = Renovar cada lista al menos cada
aegis-ajustes-escudos-intervalo-detalle = Antes, si su autor lo pide: hay listas que caducan en unas horas.
aegis-ajustes-escudos-dias = { $dias ->
        [one] 1 día
       *[other] { $dias } días
    }
aegis-ajustes-escudos-ver-listas = Ver las listas ({ $listas })
aegis-ajustes-escudos-ocultar-listas = Ocultar las listas

# Detalle de cada lista: autor · fecha · de dónde sale la copia que se usa.
aegis-ajustes-escudos-origen-red = descargada
aegis-ajustes-escudos-origen-build = incluida en { -brand-short-name }

# Excepciones por sitio. $sitio: el dominio, p. ej. ejemplo.com. Un interruptor encendido = permitido en ese sitio.
aegis-ajustes-escudos-excepciones-titulo = Excepciones por sitio
aegis-ajustes-escudos-excepciones-descripcion = Sitios en los que los Escudos dejan pasar algo. «Permitir todo» es lo mismo que bajar los Escudos desde el panel.
aegis-ajustes-escudos-excepciones-descripcion-privada = En una ventana privada, las excepciones duran hasta que cierras la última ventana privada. «Permitir todo» es lo mismo que bajar los Escudos desde el panel.
aegis-ajustes-escudos-anadir-titulo = Añadir un sitio

# Texto de ejemplo dentro del campo (en gris).
aegis-ajustes-escudos-anadir-ejemplo = ejemplo.com
aegis-ajustes-escudos-anadir = Añadir
aegis-ajustes-escudos-anadir-error = Escribe la dirección de un sitio, como ejemplo.com.
aegis-ajustes-escudos-excepciones-vacio = Ningún sitio tiene excepciones.
aegis-ajustes-escudos-sitio-todo = Todo permitido: Escudos bajados
aegis-ajustes-escudos-sitio-nada = Nada permitido todavía
aegis-ajustes-escudos-editar = Editar
    .aria-label = Editar las excepciones de { $sitio }
aegis-ajustes-escudos-cerrar = Cerrar
    .aria-label = Cerrar las excepciones de { $sitio }
aegis-ajustes-escudos-quitar = Quitar
    .aria-label = Quitar todas las excepciones de { $sitio }
aegis-ajustes-escudos-permitir-todo = Permitir todo en este sitio
aegis-ajustes-escudos-permitir-todo-detalle = Baja los Escudos: no se bloquea nada. Es el interruptor grande del panel.
aegis-ajustes-escudos-que-permitir = O elige qué permitir

# Herencia: el grupo está apagado en general (Molestias) o el sitio tiene «Permitir todo».
aegis-ajustes-escudos-por-ajuste-general = Permitido por ajuste general: está apagado para todos los sitios.
aegis-ajustes-escudos-por-permitir-todo = Permitido: este sitio tiene «Permitir todo».
aegis-ajustes-escudos-grupo-anuncios-detalle = Peticiones a servidores de anuncios de las listas de filtros.
aegis-ajustes-escudos-grupo-rastreadores-detalle = Los de las listas de filtros. La protección contra rastreo del navegador sigue activa; para quitarla también, usa «Permitir todo».
aegis-ajustes-escudos-grupo-cookies-avisos-detalle = Los banners de consentimiento de cookies.
aegis-ajustes-escudos-grupo-molestias-detalle = Ventanas emergentes, banners de apps y widgets.
aegis-ajustes-escudos-grupo-antiadblock-detalle = Los avisos que piden desactivar el bloqueador.
aegis-ajustes-escudos-grupo-cosmetico-detalle = Huecos de anuncios y otros elementos que las listas esconden en la página.
aegis-ajustes-escudos-grupo-scriptlets-detalle = Pequeños scripts de las listas que desactivan anuncios y detectores dentro de la página.

# «Más información» de cada sección: abre about:escudos en su sección.
aegis-ayuda-nivel = Más información
    .aria-label = Más información sobre los niveles de los Escudos
aegis-ayuda-molestias = Más información
    .aria-label = Más información sobre las molestias
aegis-ayuda-contador = Más información
    .aria-label = Más información sobre el contador
aegis-ayuda-listas = Más información
    .aria-label = Más información sobre las listas de filtros
aegis-ayuda-excepciones = Más información
    .aria-label = Más información sobre las excepciones por sitio

## Importar de otros navegadores (migracion/). Nombres de los navegadores de origen en el asistente de importar
## (marcas: no se traducen) y la página de las contraseñas: cómo sacar un CSV de cada uno. Solo los ids que empiezan
## por «aegis-migracion-navegador-firefox» pueden nombrar ese navegador (tools/verificar.py).

aegis-migracion-navegador-firefox = Firefox
aegis-migracion-navegador-aegis = { -brand-short-name }

aegis-migracion-navegador-firefox-csv-titulo = Cómo importar las contraseñas de Firefox
aegis-migracion-navegador-firefox-csv-en = En Firefox:
aegis-migracion-navegador-firefox-csv-paso1 = Escribe about:logins en la barra de direcciones y pulsa Intro.
aegis-migracion-navegador-firefox-csv-paso2 = Abre el menú (…) de la esquina superior derecha y elige «Exportar contraseñas…».
aegis-migracion-navegador-firefox-csv-paso3 = Confirma y guarda el archivo en tu equipo.
aegis-migracion-csv-brave-titulo = Cómo importar las contraseñas de Brave
aegis-migracion-csv-brave-en = En Brave:
aegis-migracion-csv-brave-paso1 = Escribe brave://password-manager/settings en la barra de direcciones y pulsa Intro.
aegis-migracion-csv-brave-paso2 = En «Exportar contraseñas», pulsa «Descargar archivo».
aegis-migracion-csv-brave-paso3 = Guarda el archivo en tu equipo.
aegis-migracion-csv-edge-titulo = Cómo importar las contraseñas de Microsoft Edge
aegis-migracion-csv-edge-en = En Microsoft Edge:
aegis-migracion-csv-edge-paso1 = Escribe edge://settings/passwords en la barra de direcciones y pulsa Intro.
aegis-migracion-csv-edge-paso2 = Abre «Más acciones» (…) junto a tus contraseñas guardadas y elige «Exportar contraseñas».
aegis-migracion-csv-edge-paso3 = Confirma con el PIN o la contraseña de Windows y guarda el archivo en tu equipo.
# Último paso, común: vuelve al asistente y elige el CSV con su botón (el de Firefox, «Seleccionar archivo»).
aegis-migracion-csv-final = Vuelve aquí y elige el archivo para terminar. Lleva tus contraseñas sin cifrar: bórralo en cuanto acabes.

# Otro Aegis (otro perfil o el de otro equipo): no exporta en claro; las contraseñas pasan con el código de
# transferencia (contrasenas/transferencia/). El botón «Seleccionar archivo» de la página (el de Firefox) elige el
# archivo y luego se pide el código. «-final-ajustes»: cuando el asistente no puede abrir el diálogo (dentro de la
# bienvenida), remite a Ajustes. Los nombres de Ajustes y de los botones, como salen en la interfaz.
aegis-migracion-aegis-contrasenas-titulo = Cómo pasar las contraseñas de otro { -brand-short-name }
aegis-migracion-aegis-contrasenas-en = En el otro { -brand-short-name } (en este equipo o en otro):
aegis-migracion-aegis-contrasenas-paso1 = Abre Ajustes › Contraseñas y autorrelleno y, en «Pasar a otro { -brand-short-name }», pulsa «Crear archivo…».
aegis-migracion-aegis-contrasenas-paso2 = Guarda el archivo y apunta el código de 6 palabras que te enseña.
aegis-migracion-aegis-contrasenas-paso3 = Si es otro equipo, trae el archivo hasta este (en una memoria USB o en tu nube).
aegis-migracion-aegis-contrasenas-final = Vuelve aquí, selecciona el archivo y escribe el código. Si prefieres no pasarlas ahora, salta este paso para importar el resto.
aegis-migracion-aegis-contrasenas-final-ajustes = Después, ábrelo en Ajustes › Contraseñas y autorrelleno › «Recibir de otro { -brand-short-name }». Ahora, salta este paso para importar el resto.

## Pasar las contraseñas a otro Aegis con el código de 6 palabras (contrasenas/transferencia/): Ajustes › Contraseñas
## y autorrelleno («Transferencia de contraseñas», detrás del cierre automático), los diálogos de pasar y de recibir
## (dialogos/transferencia-*.xhtml, 440 px de ancho: los textos largos pasan a otra línea) y el selector de archivos.
## «Código de transferencia» está en el glosario. Las palabras del código son siempre las de la lista del EFF, en
## inglés: no se traducen ni salen aquí. Honestidad: la caducidad (24 h) y el «una sola vez» los comprueba Aegis al
## abrir el archivo; lo que protege el archivo es el código.

# Ajustes: etiqueta de la sección (en mayúsculas), su descripción y dos filas con su detalle y un botón compacto.
aegis-transferencia-titulo = Transferencia de contraseñas
aegis-transferencia-descripcion = Pasa tus contraseñas a otro { -brand-short-name } (en este equipo o en otro) en un archivo cifrado que solo se abre con un código de 6 palabras. No pasan por ningún servidor: el archivo lo llevas tú.
aegis-transferencia-pasar = Pasar a otro { -brand-short-name }
aegis-transferencia-pasar-detalle = Crea el archivo y su código. El código se ve una sola vez y el archivo caduca en 24 horas.
aegis-transferencia-pasar-boton = Crear archivo…
aegis-transferencia-recibir = Recibir de otro { -brand-short-name }
aegis-transferencia-recibir-detalle = Abre aquí el archivo con su código. Las contraseñas que ya tengas no se duplican.
aegis-transferencia-recibir-boton = Abrir archivo…
# Títulos del selector de archivos del sistema, el nombre del tipo de archivo y el nombre que se propone (sin la
# extensión .aegisvault, que se añade sola).
aegis-transferencia-selector-guardar = Guardar el archivo de contraseñas
aegis-transferencia-selector-abrir = Elige el archivo de contraseñas
aegis-transferencia-selector-filtro = Contraseñas de { -brand-short-name }
aegis-transferencia-nombre-archivo = Contraseñas de { -brand-short-name }
# Mensaje y título del diálogo de Windows Hello al crear el archivo.
aegis-transferencia-autenticacion = Para pasar tus contraseñas a otro { -brand-short-name }, introduce tus credenciales de Windows. Así proteges tus cuentas.
aegis-transferencia-autenticacion-titulo = { -brand-short-name }
# Botones comunes de los dos diálogos.
aegis-transferencia-cancelar = Cancelar
aegis-transferencia-hecho = Hecho

# Diálogo «Pasar a otro Aegis». Paso 1: qué se lleva y el aviso.
aegis-pasar-ventana = Pasar a otro { -brand-short-name }
aegis-pasar-titulo = Pasa tus contraseñas a otro { -brand-short-name }
aegis-pasar-explicacion = Se guardan en un archivo cifrado. Al terminar verás un código de 6 palabras: en el otro { -brand-short-name }, abre el archivo en Ajustes › Contraseñas y autorrelleno › «Recibir de otro { -brand-short-name }» y escribe el código.
# $contrasenas: cuántas hay guardadas (1 o más).
aegis-pasar-resumen =
    { $contrasenas ->
        [one] Se pasará 1 contraseña guardada.
       *[other] Se pasarán { $contrasenas } contraseñas guardadas.
    }
aegis-pasar-vacio = No hay contraseñas guardadas que pasar.
# Casilla, marcada de serie. $codigos: cuántos códigos de verificación hay guardados.
aegis-pasar-incluir-codigos =
    { $codigos ->
        [one] Incluir también el código de verificación guardado
       *[other] Incluir también los { $codigos } códigos de verificación guardados
    }
aegis-pasar-aviso-titulo = Quien tenga el archivo y el código tiene tus contraseñas
aegis-pasar-aviso-texto = Guarda el archivo en un sitio tuyo y no lo mandes junto al código. En cuanto lo abras en el otro { -brand-short-name }, bórralo.
# Solo con la casilla de los códigos marcada.
aegis-pasar-aviso-codigos = Con los códigos de verificación, el archivo lleva los dos pasos de esas cuentas.
aegis-pasar-limites = El archivo caduca en 24 horas y solo se puede abrir una vez en cada perfil: lo comprueba { -brand-short-name } al abrirlo. Lo que de verdad lo protege es el código.
aegis-pasar-crear = Crear archivo…
# Paso 2: el código, una sola vez.
aegis-pasar-codigo-titulo = Tu código de transferencia
aegis-pasar-codigo-explicacion = Escríbelo en el otro { -brand-short-name } al abrir el archivo. Caduca en 24 horas.
aegis-pasar-copiar = Copiar el código
# Tras copiar. $segundos: tras cuántos segundos se borra (60 de serie).
aegis-pasar-copiado = Copiado. Se borrará del portapapeles en { $segundos } s si sigue ahí.
aegis-pasar-copiado-sin-borrar = Copiado. Borra el portapapeles cuando lo hayas pegado.
aegis-pasar-copiar-error = No se ha podido copiar. Apúntalo a mano.
aegis-pasar-una-vez-titulo = No se volverá a mostrar
aegis-pasar-una-vez-texto = Apúntalo o cópialo ahora. { -brand-short-name } no lo guarda: si lo pierdes, el archivo no se puede abrir y habrá que crear otro.
# $archivo: el nombre del archivo; $contrasenas y $codigos: cuántos lleva.
aegis-pasar-guardado =
    En «{ $archivo }»: { $contrasenas ->
        [one] 1 contraseña
       *[other] { $contrasenas } contraseñas
    }.
aegis-pasar-guardado-codigos =
    En «{ $archivo }»: { $contrasenas ->
        [one] 1 contraseña
       *[other] { $contrasenas } contraseñas
    } y { $codigos ->
        [one] 1 código de verificación
       *[other] { $codigos } códigos de verificación
    }.
aegis-pasar-error-autenticacion = No se ha podido verificar tu identidad. Vuelve a intentarlo.
aegis-pasar-error-escribir = No se ha podido guardar el archivo. Elige otra carpeta y vuelve a intentarlo.
aegis-pasar-error = No se ha podido crear el archivo. Vuelve a intentarlo.

# Diálogo «Recibir de otro Aegis». Paso 1: el archivo y el código.
aegis-recibir-ventana = Recibir de otro { -brand-short-name }
aegis-recibir-titulo = Recibe contraseñas de otro { -brand-short-name }
aegis-recibir-explicacion = Elige el archivo que creaste en el otro { -brand-short-name } y escribe su código de 6 palabras.
aegis-recibir-archivo = Archivo
aegis-recibir-sin-archivo = Ningún archivo elegido
aegis-recibir-elegir = Elegir…
aegis-recibir-cambiar = Cambiar…
aegis-recibir-codigo = Código de 6 palabras
# Debajo del campo: antes de escribir, cuántas palabras lleva o cuál no es del código. $palabras: de 1 a 7 o más.
aegis-recibir-codigo-nota = Las palabras en orden, separadas por espacios. Da igual si usas mayúsculas.
aegis-recibir-codigo-cuenta = { $palabras } de 6 palabras
aegis-recibir-codigo-desconocida = «{ $palabra }» no es una palabra del código. Revisa cómo se escribe.
aegis-recibir-limites = Se añaden a tus contraseñas guardadas, protegidas por tu contraseña principal. Las que ya tengas no se duplican; si la del archivo es más reciente, sustituye a la tuya.
aegis-recibir-boton = Recibir
aegis-recibir-abriendo = Abriendo el archivo…
# Errores. «-incorrecto» no dice si el fallo es del código o del archivo (a propósito).
aegis-recibir-error-incorrecto = El código o el archivo no son correctos. Revisa las 6 palabras y que el archivo sea el que creaste.
aegis-recibir-error-version = Este archivo es de una versión de { -brand-short-name } más nueva. Actualiza { -brand-short-name } y vuelve a intentarlo.
aegis-recibir-error-caducado = Este archivo ha caducado: solo vale 24 horas. Crea otro en el otro { -brand-short-name }.
aegis-recibir-error-reloj = Este archivo tiene una fecha posterior a la de este equipo. Comprueba la fecha y la hora de los dos equipos.
aegis-recibir-error-usado = Este archivo ya se ha abierto aquí y solo vale una vez. Si hace falta, crea otro en el otro { -brand-short-name }.
aegis-recibir-error-leer = No se ha podido leer el archivo. Comprueba que sigue en su sitio y vuelve a intentarlo.
aegis-recibir-error-sin-principal = Sin contraseña principal no se guardan contraseñas. Créala y vuelve a intentarlo.
aegis-recibir-error-bloqueada = Hace falta tu contraseña principal para guardar las contraseñas. Vuelve a intentarlo.
aegis-recibir-error = No se han podido recibir las contraseñas. Vuelve a intentarlo.
# Paso 2: el resumen (una línea por cada cosa que no sea cero; la primera, siempre) y borrar el archivo. $n: cuántas.
aegis-recibir-hecho-titulo = Contraseñas recibidas
aegis-recibir-hecho-explicacion = Ya están en tus contraseñas guardadas, protegidas por tu contraseña principal.
aegis-recibir-resumen-nuevas =
    { $n ->
        [one] 1 contraseña nueva
       *[other] { $n } contraseñas nuevas
    }
aegis-recibir-resumen-actualizadas =
    { $n ->
        [one] 1 actualizada (la del archivo era más reciente)
       *[other] { $n } actualizadas (las del archivo eran más recientes)
    }
aegis-recibir-resumen-ya =
    { $n ->
        [one] 1 ya estaba guardada
       *[other] { $n } ya estaban guardadas
    }
aegis-recibir-resumen-codigos =
    { $n ->
        [one] 1 código de verificación nuevo
       *[other] { $n } códigos de verificación nuevos
    }
aegis-recibir-resumen-codigos-ya =
    { $n ->
        [one] 1 cuenta ya tenía su código de verificación (no se ha cambiado)
       *[other] { $n } cuentas ya tenían su código de verificación (no se ha cambiado)
    }
aegis-recibir-resumen-errores =
    { $n ->
        [one] 1 no se ha podido añadir
       *[other] { $n } no se han podido añadir
    }
aegis-recibir-borrar-titulo = Borra el archivo
aegis-recibir-borrar-texto = Ya no hace falta, y con él y el código cualquiera podría leer tus contraseñas. Bórralo también de donde lo hayas copiado (una memoria USB, tu nube).
aegis-recibir-borrar = Borrar el archivo
aegis-recibir-borrado = Archivo borrado.
aegis-recibir-borrar-error = No se ha podido borrar. Bórralo desde su carpeta.
