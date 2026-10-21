# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

## Bouton de mode dans la barre (Standard / Workflow)

aegis-modo-button =
    .label = Mode
    .tooltiptext = Basculer entre les modes Standard et Workflow

## Panneau des marque-pages dans la barre latérale

aegis-marcadores-ventana =
    .title = Gérer dans une fenêtre
aegis-marcadores-todos =
    .label = Tous les marque-pages
aegis-marcadores-ordenar =
    .title = Trier
aegis-marcadores-orden-propio =
    .label = Votre ordre
aegis-marcadores-orden-nombre =
    .label = Nom (A–Z)
aegis-marcadores-orden-recientes =
    .label = Plus récents d’abord
aegis-marcadores-vista =
    .title = Affichage compact
aegis-marcadores-editar =
    .title = Modifier les marque-pages au clic
aegis-marcadores-nueva-carpeta =
    .label = Nouveau dossier
aegis-marcadores-anadir-pestana =
    .label = Ajouter l’onglet actuel

## Page des paramètres : en-tête de la barre latérale et groupes de catégories

aegis-ajustes-titulo = Paramètres
aegis-ajustes-grupo-personal = Personnel
aegis-ajustes-grupo-navegacion = Navigation
aegis-ajustes-grupo-privacidad = Vie privée
aegis-ajustes-grupo-sistema = Système
aegis-ajustes-no-predeterminado =
    .message = { -brand-short-name } n’est pas votre navigateur par défaut.

## Paramètres › Apparence : icône de l’application (Windows)

aegis-icono-titulo = Icône de l’application
aegis-icono-descripcion = Affichée sur les fenêtres d’{ -brand-short-name }. Les fenêtres de navigation privée gardent toujours le fantôme au trou de serrure.
aegis-icono-fantasma = Fantôme
aegis-icono-uroboros = Ouroboros

## Boucliers (panneau de la barre d’adresse)

aegis-escudos-boton =
    .tooltiptext = { $count ->
        [0] Boucliers activés
        [one] Boucliers activés : { $count } élément bloqué sur cette page
       *[other] Boucliers activés : { $count } éléments bloqués sur cette page
    }
aegis-escudos-boton-bajados =
    .tooltiptext = Boucliers baissés pour ce site
# Ligne des Boucliers dans le panneau du cadenas (ouvre le panneau des Boucliers). Courte : le panneau est étroit.
aegis-escudos-confianza = { $count ->
        [0] Boucliers activés
        [one] Boucliers activés : { $count } élément bloqué
       *[other] Boucliers activés : { $count } éléments bloqués
    }
aegis-escudos-activos-sitio = Boucliers activés pour ce site
aegis-escudos-bajados-sitio = Boucliers baissés pour ce site
aegis-escudos-contador = { $count ->
        [one] publicité ou traqueur bloqué sur cette page
       *[other] publicités et traqueurs bloqués sur cette page
    }
aegis-escudos-contador-bajados = Les Boucliers sont baissés : rien n’est bloqué sur ce site.
aegis-escudos-total = { $total ->
        [one] { $total } blocage depuis l’installation d’{ -brand-short-name }
       *[other] { $total } blocages depuis l’installation d’{ -brand-short-name }
    }
aegis-escudos-avanzadas = Options avancées
aegis-escudos-rastreadores = Traqueurs et publicités
aegis-escudos-nivel-normal = Normal
aegis-escudos-nivel-estricto = Strict
aegis-escudos-nivel-estricto-mas = Strict+
aegis-escudos-personalizado = Personnalisé
aegis-escudos-global = Sur tous les sites
aegis-escudos-ver-bloqueado = Bloqué sur cette page
aegis-escudos-https = Passer les connexions en HTTPS
aegis-escudos-https-activo = HTTPS uniquement sur ce site
aegis-escudos-https-excepcion = Ce site peut s’ouvrir sans chiffrement
aegis-escudos-https-apagado = Le mode HTTPS uniquement est désactivé dans les Paramètres
aegis-escudos-scripts = Bloquer les scripts
aegis-escudos-scripts-pronto = Bientôt
aegis-escudos-huella = Empreinte numérique
aegis-escudos-cookies = Cookies tiers
aegis-escudos-cookies-entre-sitios = Bloquer le pistage
aegis-escudos-cookies-todas = Tout bloquer
aegis-escudos-olvidar = Oublier ce site à la fermeture
aegis-escudos-olvidar-detalle = Supprime ses cookies et données à la fermeture d’{ -brand-short-name }
aegis-escudos-olvidar-privada = Une fenêtre privée oublie déjà tout à sa fermeture
aegis-escudos-listas = Listes de filtres
aegis-escudos-configuracion = Paramètres généraux
aegis-escudos-pie = Si ce site s’affiche mal, baissez les Boucliers pour lui. Cela réduit sa protection.
aegis-escudos-lista-titulo = Bloqué sur cette page
aegis-escudos-atras =
    .aria-label = Retour
aegis-escudos-cat-rastreadores = Traqueurs et publicités
aegis-escudos-cat-anuncios = Publicités (listes de filtres)
aegis-escudos-cat-sociales = Traqueurs de réseaux sociaux
aegis-escudos-cat-huella = Empreinte numérique
aegis-escudos-cat-criptomineros = Mineurs de cryptomonnaies
aegis-escudos-lista-vacia = Rien n’a été bloqué sur cette page.

## Page des paramètres : noms d’Aegis à la place de ceux de Firefox

aegis-ajustes-general = Général
aegis-ajustes-inicio-predeterminado =
    .label = Accueil d’{ -brand-short-name } (par défaut)
aegis-ajustes-inicio =
    .label = Accueil d’{ -brand-short-name }
aegis-ajustes-inicio-aviso =
    .message = Pour utiliser ces fonctionnalités, ouvrez les nouveaux onglets ou les nouvelles fenêtres sur l’Accueil d’{ -brand-short-name }.
aegis-ajustes-personalizar-inicio =
    .label = Personnaliser l’Accueil d’{ -brand-short-name }

## Complementos (about:addons): cabecera de la barra lateral, buscador y estado vacío de Extensiones.

aegis-complementos-titulo = Modules complémentaires
# Texto de ayuda del buscador: abre la tienda de complementos en una pestaña.
aegis-complementos-buscar = Rechercher des modules sur le Web
aegis-complementos-vacio = Vous n’avez encore aucune extension.
aegis-complementos-vacio-boton = Trouver des extensions
# Panel de extensiones de la barra (la pieza de puzle) sin ninguna instalada: título, frase y, debajo, el botón
# aegis-complementos-vacio-boton, que abre la tienda de complementos en una pestaña.
aegis-extensiones-vacio-titulo = Vous n’avez encore aucune extension
aegis-extensiones-vacio-texto = Trouvez-en dans la boutique des modules complémentaires.
# Panel de extensiones con extensiones (al estilo de Chrome y Brave). Etiquetas de sección (se ven en MAYÚSCULAS):
# las fijadas en la barra de herramientas y, debajo, las que se ven solo dentro del panel.
aegis-extensiones-en-barra = Dans la barre
aegis-extensiones-en-panel = Dans ce panneau
# Botón de la chincheta de cada extensión (texto de ayuda y para lectores de pantalla). Dice lo que hace al pulsarlo.
# Variables:
#   $nombre (String) - nombre de la extensión
aegis-extensiones-fijar = Épingler { $nombre } à la barre d’outils
aegis-extensiones-desfijar = Désépingler { $nombre } de la barre d’outils
# Pie del panel: abre Complementos › Extensiones (about:addons) y la tienda de complementos en una pestaña.
aegis-extensiones-gestionar = Gérer les extensions
aegis-extensiones-anadir = Ajouter des extensions

## Barra lateral y barra de marcadores

# Pie de «Personalizar barra lateral»: abre los Ajustes del navegador.
aegis-barra-ajustes = Paramètres d’{ -brand-short-name }
# Botón junto al aviso de la barra de marcadores vacía: la oculta mientras no tenga marcadores (vuelve sola con el primero).
aegis-marcadores-aviso-cerrar = Pas maintenant
    .title = Masquer la barre personnelle tant qu’elle est vide

## Contraseñas (about:logins): estado vacío. La bóveda propia llegará más adelante.

aegis-contrasenas-vacio = Les mots de passe que vous enregistrez en vous connectant à un site apparaîtront ici.
aegis-contrasenas-importar = Importer des mots de passe

## Contraseñas: protección (contrasenas.sys.mjs), panel de la barra lateral (contrasenas-panel.sys.mjs) y aviso de
## about:logins. «Contraseña principal» es el término de Firefox (Primary Password): el mismo en todo el navegador.

# Botón del aviso del panel y de about:logins: abre el diálogo de la contraseña principal.
aegis-contrasenas-principal-crear = Créer un mot de passe principal
# Aviso del panel y de about:logins cuando no hay contraseña principal.
aegis-contrasenas-sin-principal = Sans mot de passe principal, toute personne qui utilise votre session Windows peut se servir de vos mots de passe enregistrés, et un programme qui copie votre profil peut les lire. Un mot de passe principal rend les deux bien plus difficiles.
# Estado vacío del panel de la barra lateral.
aegis-contrasenas-panel-titulo = Vos mots de passe, sur cet appareil
aegis-contrasenas-panel-texto = { -brand-short-name } les conserve chiffrés sur cet appareil et ne les envoie nulle part.

## Ajustes › Contraseñas y autorrelleno: «Cierre automático de la bóveda» (ajustes.sys.mjs), detrás de «Contraseñas». Segmentos:
## Nunca, 15, 10, 5, 3, 2 y 1 min; caben siete en una fila, así que las etiquetas son cortas.

aegis-bloqueo-titulo = Verrouillage automatique des mots de passe
aegis-bloqueo-descripcion = Après ce délai sans utiliser l’ordinateur, les mots de passe enregistrés se verrouillent et { -brand-short-name } redemande le mot de passe principal. Ils se verrouillent aussi à la mise en veille et à la fermeture de { -brand-short-name }.
aegis-bloqueo-nunca-aviso = Avec « Jamais », ils ne se verrouillent qu’à la fermeture de { -brand-short-name } ou à la mise en veille.
aegis-bloqueo-sin-principal = Ne s’applique qu’avec un mot de passe principal.
aegis-bloqueo-nunca = Jamais
# Cada segmento con minutos. $minutos: 1, 2, 3, 5, 10 o 15.
aegis-bloqueo-minutos = { $minutos } min

## Diálogo de la contraseña principal (dialogos/contrasena-principal.xhtml), en lugar del de Firefox: crearla
## (antes de guardar la primera contraseña, desde el panel, about:logins o Ajustes) o cambiarla (Ajustes). Ancho
## fijo de 440 px: los textos largos pasan a otra línea.

# Título de la ventana o del marco del diálogo (Ajustes lo muestra arriba).
aegis-principal-ventana = Mot de passe principal
aegis-principal-titulo-crear = Créez votre mot de passe principal
aegis-principal-titulo-cambiar = Modifiez votre mot de passe principal
# Antes de guardar la primera contraseña (botones «No guardar» y «Crear y guardar»).
aegis-principal-explicacion-guardar = Pour enregistrer des mots de passe, { -brand-short-name } les chiffre avec un mot de passe principal. Sans lui, n’importe quel programme qui copie votre profil pourrait les lire. Il vous sera demandé une fois par session, puis à nouveau après un moment sans utiliser l’ordinateur.
# Desde el aviso del panel o de about:logins, o desde Ajustes.
aegis-principal-explicacion-crear = { -brand-short-name } l’utilise pour chiffrer les mots de passe que vous enregistrez. Sans lui, n’importe quel programme qui copie votre profil pourrait les lire. Il vous sera demandé une fois par session, puis à nouveau après un moment sans utiliser l’ordinateur.
# Antes de pasar o recibir de otro Aegis o de añadir un código de verificación, que la piden siempre.
aegis-principal-explicacion-accion = Pour cela, { -brand-short-name } a besoin d’un mot de passe principal. Il s’en sert pour chiffrer vos mots de passe et vos codes de vérification : sans lui, n’importe quel programme qui copie votre profil pourrait les lire. Il vous sera demandé une fois par session, puis à nouveau après un moment sans utiliser l’ordinateur.
aegis-principal-explicacion-cambiar = Pour le modifier, il vous faut l’actuel. Vos mots de passe enregistrés restent là, protégés par le nouveau.
# Si una política de empresa exige la contraseña principal.
aegis-principal-politica = Votre organisation exige un mot de passe principal.
aegis-principal-actual = Mot de passe principal actuel
aegis-principal-nueva = Mot de passe principal
aegis-principal-nueva-cambiar = Nouveau mot de passe principal
aegis-principal-repetir = Saisissez-le à nouveau
# Botón con el icono del ojo dentro de cada campo: muestra u oculta lo escrito.
aegis-principal-mostrar =
    .title = Afficher le mot de passe
    .aria-label = Afficher le mot de passe
# Debajo del campo, antes de escribir: el mínimo de Aegis.
aegis-principal-requisito = Au moins 12 caractères. Une phrase de quatre mots ou plus est facile à retenir et difficile à deviner.
# Mientras se escribe, lo que falta o el nivel. $faltan: caracteres que faltan para llegar a 12.
aegis-principal-corta =
    { $faltan ->
        [one] Trop court : il manque { $faltan } caractère.
       *[other] Trop court : il manque { $faltan } caractères.
    }
aegis-principal-comun = Trop facile à deviner : évitez les mots et mots de passe très courants.
aegis-principal-secuencia = Trop facile à deviner : évitez les suites comme « 1234 » ou « azerty ».
aegis-principal-repetida = Trop facile à deviner : il contient trop de répétitions.
aegis-principal-variedad = Trop facile à deviner : utilisez plus de caractères différents.
aegis-principal-aceptable = Robustesse : acceptable. Plus long, ce serait mieux.
aegis-principal-fuerte = Robustesse : bonne.
aegis-principal-muy-fuerte = Robustesse : très bonne.
aegis-principal-no-coinciden = Les mots de passe ne correspondent pas.
aegis-principal-error-actual = Le mot de passe actuel est incorrect. Saisissez-le à nouveau.
aegis-principal-error = Impossible d’enregistrer le mot de passe principal. Réessayez.
# Tarjeta de aviso: no se puede recuperar (restablecerla en Firefox borra las contraseñas guardadas).
aegis-principal-olvido-titulo = Si vous l’oubliez, il est impossible de le récupérer
aegis-principal-olvido-texto = { -brand-short-name } ne le conserve nulle part et personne ne peut vous l’envoyer. Pour repartir de zéro, il faudrait le réinitialiser, ce qui supprime tous les mots de passe enregistrés.
# La línea de honestidad: qué protege y qué no.
aegis-principal-limites = Il protège vos mots de passe si quelqu’un copie votre profil, utilise un autre compte de cet ordinateur ou emporte le disque. Il ne les protège pas d’un logiciel malveillant qui contrôle déjà votre ordinateur : celui-ci pourrait enregistrer ce que vous tapez, y compris ce mot de passe.
# Botones. «No guardar» y «Crear y guardar», antes de guardar; los demás, desde Ajustes, el panel o about:logins.
aegis-principal-no-guardar = Ne pas enregistrer
aegis-principal-cancelar = Annuler
aegis-principal-crear-guardar = Créer et enregistrer
aegis-principal-crear = Créer le mot de passe
aegis-principal-cambiar = Modifier le mot de passe

## Códigos de verificación (autenticador/): panel de contraseñas, about:logins, el autorrelleno y el diálogo para
## añadirlos (dialogos/autenticador.xhtml). «Código de verificación» es el código de 6 u 8 cifras de la verificación
## en dos pasos (TOTP); «clave de configuración», el texto que da la web para configurarlo (glosario).

# Panel de contraseñas: título de la sección plegable.
aegis-codigos-titulo = Codes de vérification
aegis-codigos-vacio = Enregistrez ici le code de validation en deux étapes d’un compte et { -brand-short-name } vous donnera ses codes.
# Botón compacto del panel: abre el diálogo para añadir uno.
aegis-codigos-anadir = Ajouter un code
# Botones de icono de cada fila del panel. $sitio: el dominio («github.com»).
aegis-codigos-ver =
    .title = Afficher le code de { $sitio }
    .aria-label = Afficher le code de { $sitio }
aegis-codigos-copiar =
    .title = Copier le code de { $sitio }
    .aria-label = Copier le code de { $sitio }
aegis-codigos-editar =
    .title = Modifier ou supprimer le code de { $sitio }
    .aria-label = Modifier ou supprimer le code de { $sitio }
# Junto al código a la vista: segundos que le quedan. Cabe en poco: «18 s».
aegis-codigos-restante = { $segundos } s
# Tras copiar. $segundos: tras cuántos segundos se borra (30 de serie).
aegis-codigos-copiado = Code copié. Il sera effacé du presse-papiers dans { $segundos } s s’il y est encore.
aegis-codigos-copiado-sin-borrar = Code copié.
aegis-codigos-ilegible = Impossible de lire ce code. Ajoutez-le à nouveau.
# Mensaje y título del diálogo de Windows Hello al ver o copiar un código.
aegis-codigos-autenticacion-ver = Pour afficher le code de vérification, saisissez vos identifiants Windows. Cela aide à protéger vos comptes.
aegis-codigos-autenticacion-copiar = Pour copier le code de vérification, saisissez vos identifiants Windows. Cela aide à protéger vos comptes.
aegis-codigos-autenticacion-titulo = { -brand-short-name }
# about:logins: la fila de la contraseña elegida y sus botones compactos.
aegis-codigos-etiqueta = Code de vérification
aegis-codigos-ninguno = Aucun code de vérification
aegis-codigos-boton-mostrar = Afficher
aegis-codigos-boton-ocultar = Masquer
aegis-codigos-boton-copiar = Copier
aegis-codigos-boton-cambiar = Modifier
aegis-codigos-boton-anadir = Ajouter
# Autorrelleno: el panelito junto al campo del código en la web. $sitio: el dominio.
aegis-codigos-ofrecer-titulo = Code de vérification
aegis-codigos-ofrecer-texto = { -brand-short-name } a le code de { $sitio }.
aegis-codigos-rellenar = Remplir le code
# Con varias cuentas en el sitio. $cuenta: el usuario (o un número).
aegis-codigos-rellenar-cuenta = Remplir le code de { $cuenta }
# Panel de contraseñas (solo Windows): sección «Passkeys». No prometer sincronización.
aegis-passkeys-titulo = Clés d’accès
aegis-passkeys-texto = Les clés d’accès (passkeys) que vous créez sur un site sont stockées dans Windows Hello, sur cet ordinateur. S’il dispose d’une puce de sécurité (TPM), la clé privée ne la quitte pas ; sinon, Windows la protège par logiciel. { -brand-short-name } ne peut ni la voir ni la copier. Celles de Windows Hello ne sont pas synchronisées avec d’autres ordinateurs ; si, dans l’invite de Windows, vous choisissez un autre fournisseur de clés d’accès, elles sont stockées là où il l’indique.
# Abre la Configuración de Windows › Cuentas › Claves de acceso.
aegis-passkeys-gestionar = Gérer dans Windows
# Diálogo para añadir, cambiar o quitar un código de verificación.
aegis-autenticador-ventana = Code de vérification
aegis-autenticador-titulo = Ajouter un code de vérification
aegis-autenticador-titulo-editar = Code de vérification
aegis-autenticador-explicacion = Quand un site vous demande de configurer une application d’authentification, lisez ici son code QR ou copiez sa clé de configuration. { -brand-short-name } générera les codes sur cet ordinateur.
aegis-autenticador-cuenta = Compte
# Primera opción del desplegable de cuentas.
aegis-autenticador-elige = Choisissez un compte enregistré
aegis-autenticador-sin-cuentas = Enregistrez d’abord le mot de passe de ce compte dans { -brand-short-name }.
aegis-autenticador-existe = Ce compte a déjà un code de vérification. Enregistrer une autre clé le remplace.
aegis-autenticador-clave = Clé de configuration ou lien otpauth://
# Botón del ojo dentro del campo de la clave.
aegis-autenticador-mostrar =
    .title = Afficher la clé
    .aria-label = Afficher la clé
# Botones compactos para leer el código QR (en el equipo, sin red).
aegis-autenticador-qr-pagina = Lire le QR de cette page
aegis-autenticador-qr-imagen = Lire le QR d’une image…
# Título del selector de archivos.
aegis-autenticador-qr-imagen-titulo = Choisissez une image avec le code QR
aegis-autenticador-qr-no = Aucun code QR trouvé. Affichez le code en entier et réessayez.
aegis-autenticador-qr-otro = Ce code QR n’est pas celui d’une application d’authentification.
# La clave es válida. $emisor: quien la da; $digitos: 6–8; $periodo: segundos (30).
aegis-autenticador-valida = { $emisor } : { $digitos } chiffres toutes les { $periodo } s.
aegis-autenticador-valida-sin-emisor = Clé valide : { $digitos } chiffres toutes les { $periodo } s.
aegis-autenticador-error-formato = Ce n’est pas une clé valide. Copiez la clé de configuration ou le lien otpauth:// en entier.
aegis-autenticador-error-hotp = Les codes à compteur (HOTP) ne sont pas pris en charge, seulement ceux basés sur le temps (TOTP).
aegis-autenticador-error-corta = La clé est trop courte pour être sûre.
aegis-autenticador-error-parametros = Ce code utilise un format non pris en charge (chiffres ou période inhabituels).
aegis-autenticador-error-guardar = Impossible d’enregistrer le code. Réessayez.
# Cambiar la clave de un código sin contraseña principal (quitarlo sí se puede).
aegis-autenticador-error-sin-principal = Pour modifier la clé, il faut un mot de passe principal. Créez-le depuis l’avis du panneau des mots de passe, ou supprimez le code.
# La tarjeta de honestidad: los dos pasos juntos en la bóveda.
aegis-autenticador-honestidad-titulo = Les deux étapes au même endroit
aegis-autenticador-honestidad = Enregistrer le code avec le mot de passe réunit les deux étapes dans { -brand-short-name } : quiconque déverrouillerait vos mots de passe aurait les deux. Votre mot de passe principal et la vérification d’identité pour afficher ou copier un code les protègent. Pour vos comptes les plus importants, une application d’authentification sur un autre appareil est plus sûre.
# Quitar pide dos pulsaciones: la segunda con «-confirmar» y el aviso.
aegis-autenticador-quitar = Supprimer le code
aegis-autenticador-quitar-confirmar = Supprimer définitivement
aegis-autenticador-quitar-aviso = Avant de le supprimer, vérifiez que vous pouvez vous connecter autrement (par exemple avec les codes de récupération du site).
aegis-autenticador-cancelar = Annuler
aegis-autenticador-guardar = Enregistrer

## Énfasis de color (Ajustes › Apariencia y «Personalizar» de la nueva pestaña)

aegis-enfasis-titulo = Couleur d’accent
aegis-enfasis-descripcion = La couleur de la sélection, du focus, des interrupteurs, du liseré de l’onglet actif et du dégradé du cadre.
aegis-enfasis-automatico = « Couleur de Windows » et « Arrière-plan du bureau » changent d’eux-mêmes quand vous les modifiez dans Windows. L’arrière-plan est lu sur cet ordinateur et n’en sort pas.
aegis-enfasis-monocromo = Monochrome
aegis-enfasis-windows = Couleur de Windows
aegis-enfasis-fondo = Arrière-plan du bureau
aegis-enfasis-hielo = Glace
aegis-enfasis-pizarra = Ardoise
aegis-enfasis-salvia = Sauge
aegis-enfasis-ambar = Ambre
aegis-enfasis-coral = Corail
aegis-enfasis-lavanda = Lavande
aegis-enfasis-malva = Mauve
aegis-enfasis-cobalto = Cobalt
aegis-enfasis-piedra = Pierre
aegis-enfasis-laguna = Lagon
aegis-enfasis-musgo = Mousse
aegis-enfasis-frambuesa = Framboise
aegis-enfasis-ciruela = Prune

## Énfasis personalizado: el «+» de los selectores y su ventana («Crear» y «Mis énfasis»)

# Nombre de la opción del «+» en Ajustes y principio de sus etiquetas.
aegis-enfasis-propio = Sur mesure
# Etiqueta (y descripción emergente) del «+» sin ningún personalizado en uso.
aegis-enfasis-propio-abrir = Sur mesure : créez-en une ou choisissez-en une enregistrée
# El «+» con un personalizado en uso. $nombre: su nombre o sus códigos (p. ej. #88C0DC)
aegis-enfasis-propio-abrir-activo = Sur mesure : { $nombre }
# Línea del elegido, bajo las muestras de la nueva pestaña. $nombre: su nombre o sus códigos
aegis-enfasis-propio-actual = Sur mesure : { $nombre }
aegis-enfasis-propio-titulo = Couleur d’accent personnalisée
aegis-enfasis-propio-cerrar = Fermer
# Las dos pestañas de la ventana.
aegis-enfasis-propio-crear = Créer
aegis-enfasis-propio-mis = Mes couleurs
aegis-enfasis-propio-degradado = Dégradé
aegis-enfasis-propio-degradado-ayuda = Une deuxième couleur pour le cadre de la fenêtre et le liseré de l’onglet actif. Le reste utilise la première.
# Para lectores de pantalla: los dos segmentos que eligen qué color se edita.
aegis-enfasis-propio-editando = Couleur en cours de modification
aegis-enfasis-propio-color-1 = Première couleur
aegis-enfasis-propio-color-2 = Deuxième couleur
# El cuadro de color, para lectores de pantalla. $saturacion y $brillo: de 0 a 100
aegis-enfasis-propio-area = Saturation et luminosité
aegis-enfasis-propio-area-valor = Saturation { $saturacion } %, luminosité { $brillo } %
aegis-enfasis-propio-tono = Teinte
# Campo del color en hexadecimal (#RRGGBB).
aegis-enfasis-propio-hex = Code
aegis-enfasis-propio-hex-error = Saisissez une couleur hexadécimale, comme #88C0DC.
aegis-enfasis-propio-nombre = Nom
aegis-enfasis-propio-nombre-ejemplo = Facultatif
aegis-enfasis-propio-vista = Aperçu
aegis-enfasis-propio-ajuste = { -brand-short-name } ajuste la luminosité et l’intensité pour que tout reste lisible en clair comme en sombre.
aegis-enfasis-propio-guardar = Enregistrer
aegis-enfasis-propio-usar = Utiliser
aegis-enfasis-propio-guardado = Enregistrée dans « Mes couleurs ».
aegis-enfasis-propio-actualizado = Déjà dans « Mes couleurs ».
# $maximo: cuántos se pueden guardar (24)
aegis-enfasis-propio-lleno = Vous en avez déjà { $maximo } enregistrées. Supprimez-en une dans « Mes couleurs » pour en enregistrer une autre.
# $cuantos: los guardados; $maximo: el límite (24)
aegis-enfasis-propio-cuenta = { $cuantos } sur { $maximo }
# Supr (Delete): la tecla que borra el guardado con el foco.
aegis-enfasis-propio-mis-ayuda = Choisissez-en une pour l’utiliser. Suppr la supprime.
aegis-enfasis-propio-sin-nombre = Sans nom
aegis-enfasis-propio-editar = Modifier
aegis-enfasis-propio-borrar = Supprimer
# $nombre: el nombre del guardado (o el texto de «sin nombre»)
aegis-enfasis-propio-borrar-pregunta = Supprimer « { $nombre } » ? Cette action est irréversible.
aegis-enfasis-propio-borrar-confirmar = Supprimer
aegis-enfasis-propio-cancelar = Annuler
aegis-enfasis-propio-borrado = « { $nombre } » a été supprimée.
aegis-enfasis-propio-vacio-titulo = Aucune couleur enregistrée
# Estado vacío de «Mis énfasis». $maximo: cuántos se pueden guardar (24)
aegis-enfasis-propio-vacio = Créez une couleur d’accent et cliquez sur « Enregistrer » : elle apparaîtra ici, prête à l’emploi en un clic. Jusqu’à { $maximo }.
aegis-enfasis-propio-ir-crear = En créer une

## Nueva pestaña › Personalizar: fondo, diseño (buscador, accesos y espaciado)

aegis-np-fondo-titulo = Arrière-plan
aegis-np-fondo-liso = Uni
aegis-np-fondo-degradado = Dégradé
aegis-np-fondo-enfasis = Accent
aegis-np-fondo-imagen = Image
aegis-np-imagen-cambiar = Changer d’image…
aegis-np-imagen-error = Impossible d’utiliser cette image. Essayez une autre image JPG, PNG, WebP, AVIF ou GIF de moins de 20 Mo.
aegis-np-diseno-titulo = Disposition
aegis-np-buscador = Afficher la recherche
aegis-np-posicion = Position de la recherche
aegis-np-posicion-centro = Au centre
aegis-np-posicion-arriba = Plus haut
aegis-np-accesos = Raccourcis
# Segmentos cortos: deben caber en una línea (la fila se llama «Raccourcis» y va debajo de la posición de la recherche).
aegis-np-accesos-arriba = Au-dessus
aegis-np-accesos-abajo = En dessous
aegis-np-espaciado = Espacement
# $px: número de píxeles
aegis-np-espaciado-valor = { $px } px
aegis-np-ancho = Largeur de la barre de recherche

## Menu des moteurs de recherche de la barre d’adresse (la loupe)

# Ligne affichée quand le moteur choisi pour cette recherche n’est pas celui par défaut. $buscador : nom du moteur, p. ex. Google
aegis-buscador-predeterminado = Utiliser { $buscador } par défaut

## Nouvel onglet › Ajouter ou modifier un raccourci : le logo du site comme image du raccourci

# Lien à côté de « Utiliser une image personnalisée ». Cherche l’icône du site (d’abord sur l’appareil, puis sur le site) et la définit comme image personnalisée.
aegis-logo-usar = Utiliser le logo du site
aegis-logo-buscando = Recherche du logo…
aegis-logo-sin-direccion = Saisissez d’abord l’adresse du raccourci.
aegis-logo-error = Impossible d’utiliser le logo de ce site. Essayez une image personnalisée.
aegis-logo-error-red = Impossible de récupérer le logo du site. Vérifiez l’adresse ou réessayez plus tard.

## Webs en oscuro (Ajustes › Apariencia y fila «Oscurecer este sitio» del panel de Escudos)

aegis-webs-oscuro-titulo = Sites en mode sombre
aegis-webs-oscuro-descripcion = Les sites s’adaptent au thème sombre d’{ -brand-short-name }. Seulement quand { -brand-short-name } utilise le thème sombre ; les images et les vidéos ne changent pas.
aegis-webs-oscuro-aviso = Un site peut remarquer que son apparence a été modifiée.
aegis-webs-oscuro-apagado = Désactivé
aegis-webs-oscuro-todas = Tous les sites
aegis-webs-oscuro-sin-modo-oscuro = Seulement ceux sans mode sombre
aegis-escudos-oscuro = Assombrir ce site
aegis-escudos-oscuro-activo = S’adapte au thème sombre
aegis-escudos-oscuro-propio = Ce site a déjà un mode sombre
aegis-escudos-oscuro-claro = Seulement quand { -brand-short-name } utilise le thème sombre
aegis-escudos-oscuro-excepcion = Pas assombri sur ce site

## Panneau des Boucliers : réglage du moteur de recherche (busqueda-limpia.sys.mjs). Seulement sur DuckDuckGo ou Bing.

aegis-escudos-ddg-anuncios = Retirer les publicités de DuckDuckGo
aegis-escudos-ddg-anuncios-apagado = Désactivé : les Boucliers masquent celles qu’ils reconnaissent
aegis-escudos-ddg-anuncios-activo = Utilise le réglage de DuckDuckGo pour ne pas les afficher
aegis-escudos-bing-rewards = Gagner des points Microsoft Rewards
aegis-escudos-bing-rewards-apagado = Désactivé : votre activité n’est pas envoyée et les recherches ne rapportent aucun point
aegis-escudos-bing-rewards-activo = Bing reçoit votre activité de recherche pour ajouter des points

## Empreinte numérique (Paramètres › Vie privée, panneau des Boucliers et avis du Coffre-fort)

aegis-huella-titulo = Empreinte numérique
aegis-huella-descripcion = Ce que les sites peuvent lire de votre navigateur pour vous reconnaître sans cookies : écran, polices, carte graphique, fuseau horaire, etc.
aegis-huella-nivel-basica = Basique
aegis-huella-nivel-basica-descripcion = Seulement la protection intégrée au navigateur.
aegis-huella-nivel-equilibrada = Équilibrée
aegis-huella-nivel-equilibrada-descripcion = Masque tout ce qui peut l’être sans casser les sites. Recommandée.
aegis-huella-nivel-estricta = Stricte
aegis-huella-nivel-estricta-descripcion = Masque aussi la position de la fenêtre, les polices, les voix et les capacités de la carte graphique. Certains sites peuvent mal fonctionner.
aegis-huella-nivel-caja-fuerte = Coffre-fort
aegis-huella-nivel-caja-fuerte-descripcion = Masque presque tout ce que la protection sait masquer (pas le thème sombre ou clair ni la taille de l’écran) : les sites voient l’heure UTC, l’anglais et 60 i/s, ne voient pas vos paramètres d’accessibilité, et le contraste élevé ne s’y applique plus. Pour lire un canvas, ils doivent vous demander la permission, et vous pouvez laisser un site voir les données du navigateur. Beaucoup de sites ne fonctionneront pas.
aegis-huella-nota = Aucune protection n’est parfaite : les sites voient toujours votre adresse IP, et { -brand-short-name } n’est pas Tor Browser.
aegis-huella-permitidos-titulo = Sites autorisés dans le Coffre-fort
aegis-huella-permitidos-vacio = Aucun site n’est autorisé.
# $sitio : domaine du site, par exemple exemple.com
aegis-huella-quitar = Retirer
    .aria-label = Retirer { $sitio }
aegis-huella-apagada = Désactivée dans la protection contre le pistage
aegis-huella-permitir-sitio = Autoriser sur ce site
aegis-huella-permiso-no = Données du navigateur : bloquées
aegis-huella-permiso-si = Données du navigateur : protection équilibrée
aegis-huella-permiso-privada = Uniquement depuis une fenêtre normale
aegis-huella-permiso-no-disponible = Non disponible pour cette adresse
# <> est remplacé par le nom du site (en gras). À garder tel quel.
aegis-huella-aviso = <> a essayé de lire des données de votre navigateur. Le Coffre-fort les a masquées.
aegis-huella-aviso-permitir =
    .label = Autoriser sur ce site
    .accesskey = A
aegis-huella-aviso-bloquear =
    .label = Continuer à bloquer
    .accesskey = C

## Tor : « Nouvelle fenêtre privée avec Tor » (menu ☰, Ctrl+Maj+U), Paramètres › Vie privée › Tor, l’indicateur de la
## barre et about:privatebrowsing dans l’instance avec Tor. « Tor » et « Tor Browser » sont des noms d’un autre projet.

aegis-tor-titulo = Tor
aegis-tor-descripcion = Ouvrez des fenêtres privées qui passent par le réseau Tor : les sites ne voient pas votre IP. C’est un { -brand-short-name } à part, avec son propre profil, supprimé à la fermeture, qui ne partage rien avec vos autres fenêtres.
aegis-tor-honestidad = { -brand-short-name } avec Tor n’est pas Tor Browser : { -brand-short-name } se distingue plus facilement que Tor Browser, qui ressemble au même navigateur pour tout le monde. Pour un anonymat fort, utilisez Tor Browser. Ce que vous ouvrez hors du navigateur (un téléchargement ouvert dans une autre application, un lien de courriel) ne passe pas par Tor.
aegis-tor-no-descargado = Tor n’est pas téléchargé
# $tamano : mégaoctets, p. ex. 21,5 ; $origen : serveur, p. ex. dist.torproject.org
aegis-tor-origen = { $tamano } Mo du Tor Project ({ $origen }). Son empreinte sha256 est vérifiée avant l’installation.
# $progreso : pourcentage
aegis-tor-descargando = Téléchargement… { $progreso } %
aegis-tor-comprobando = Vérification du paquet…
# $progreso : pourcentage
aegis-tor-extrayendo = Installation… { $progreso } %
# $tor : version de tor ; $version : version du paquet
aegis-tor-listo = Tor { $tor } téléchargé (paquet { $version })
aegis-tor-desactualizado = Une nouvelle version de Tor est disponible (paquet { $version })
aegis-tor-boton-descargar = Télécharger Tor
aegis-tor-boton-actualizar = Mettre à jour
aegis-tor-boton-cancelar = Annuler
aegis-tor-boton-borrar = Supprimer
aegis-tor-borrar-abierta = Fermez les fenêtres avec Tor pour pouvoir le supprimer.
aegis-tor-abrir-titulo = Nouvelle fenêtre privée avec Tor
aegis-tor-abrir-detalle = Aussi depuis le menu ou avec Ctrl+Maj+U.
aegis-tor-boton-abrir = Ouvrir
aegis-tor-puentes-titulo = Ponts
aegis-tor-puentes-descripcion = Pour les réseaux qui bloquent Tor. S’applique à la prochaine fenêtre avec Tor.
aegis-tor-puentes-ninguno = Sans ponts
aegis-tor-puentes-obfs4 = obfs4
aegis-tor-puentes-snowflake = Snowflake
aegis-tor-nota-huella = La fenêtre avec Tor utilise le Coffre-fort : Tor masque votre IP, mais ce que le navigateur révèle de lui-même dépend d’{ -brand-short-name }.
aegis-tor-nota-buscadores = Certains moteurs de recherche, comme Google, demandent des captchas ou bloquent les connexions venant de Tor. DuckDuckGo fonctionne.
aegis-tor-instancia-texto = Ceci est une fenêtre privée avec Tor : tout son trafic passe par Tor et rien n’est conservé à la fermeture.
aegis-tor-boton-identidad = Nouvelle identité
aegis-tor-error-descarga = Impossible de télécharger Tor. Vérifiez la connexion et réessayez.
aegis-tor-error-suma = Le téléchargement n’est pas le paquet attendu (son empreinte sha256 ne correspond pas) et a été écarté. Réessayez plus tard.
aegis-tor-error-sin-descargar = Tor n’est pas téléchargé : téléchargez-le dans Paramètres › Vie privée.
aegis-tor-error-arranque = Tor n’a pas pu démarrer. Si Windows l’a bloqué, autorisez-le et ouvrez une autre fenêtre avec Tor.
aegis-tor-error-caido = Tor s’est fermé. Fermez cette fenêtre et ouvrez-en une autre avec Tor.
aegis-tor-aviso-red = Tor a du mal à se connecter. Si votre réseau bloque Tor, essayez les ponts.
aegis-tor-red-arrancando = Tor : démarrage…
# $progreso : pourcentage
aegis-tor-red-conectando = Tor : connexion… { $progreso } %
aegis-tor-red-conectado = Tor : connecté
aegis-tor-red-error = Tor : pas de connexion.
aegis-tor-red-parado = Tor : arrêté.
aegis-tor-privada-nota = Les sites voient une IP du réseau Tor, pas la vôtre. { -brand-short-name } avec Tor n’est pas Tor Browser.
aegis-tor-menu-ventana =
    .label = Nouvelle fenêtre privée avec Tor
aegis-tor-menu-identidad =
    .label = Nouvelle identité Tor
aegis-tor-menu-ajustes =
    .label = Paramètres de Tor
aegis-tor-ofrecer-titulo = Télécharger Tor
# $tamano : mégaoctets, p. ex. 21,5
aegis-tor-ofrecer-texto = Pour ouvrir une fenêtre privée avec Tor, il faut Tor, qui n’est pas fourni avec { -brand-short-name }. { $tamano } Mo seront téléchargés depuis le Tor Project (dist.torproject.org) et leur empreinte vérifiée avant l’installation dans votre profil.
aegis-tor-ofrecer-botones =
    .descargar = Télécharger
aegis-tor-identidad-confirmar = Toutes les fenêtres avec Tor seront fermées, tout ce qui concerne cette session sera supprimé et Tor utilisera de nouveaux circuits.
    .title = Nouvelle identité
    .aceptar = Nouvelle identité

## Google (Ajustes › Privacidad; google.sys.mjs). «Google» y «YouTube» son nombres propios: no se traducen.

aegis-google-titulo = Google
aegis-google-descripcion = La protection contre le pistage n’agit pas sur les sites de Google ni de YouTube. { -brand-short-name } y coupe leurs données d’utilisation et leurs publicités, et les liens des résultats mènent directement au site.
# Mismo nombre que la sección «Google limpio» de about:escudos (escudos-ayuda-google-titulo).
aegis-google-limpio = Google propre
aegis-google-limpio-detalle = Google voit toujours votre IP, ce que vous cherchez et, si vous vous connectez, qui vous êtes.
# Pide a Google la vista «Web» (udm=14). Solo actúa con «Google limpio» encendido.
aegis-google-solo-web = Uniquement les résultats web dans Google
aegis-google-solo-web-detalle = Pour les recherches depuis la barre d’adresse, sans réponses d’IA ni modules.

## Sessions (Paramètres › Vie privée ; sesiones.sys.mjs) : option de sécurité renforcée, désactivée par défaut.

aegis-sesiones-titulo = Sessions
aegis-sesiones-descripcion = { -brand-short-name } se souvient des sites où vous êtes connecté, pour vous éviter de vous reconnecter à chaque fois. Pour plus de sécurité, vous pouvez fermer toutes les sessions en quittant.
aegis-sesiones-cerrar = Fermer les sessions en quittant { -brand-short-name }
aegis-sesiones-cerrar-detalle = En quittant, les cookies, les données et le cache des sites sont supprimés : vous devrez vous reconnecter. L’historique, les mots de passe et les marque-pages sont conservés.
aegis-sesiones-excepciones = Sites qui restent connectés
aegis-sesiones-excepciones-detalle = Leurs cookies et leurs données ne sont pas supprimés en quittant.
aegis-sesiones-boton-excepciones = Choisir des sites…
aegis-sesiones-protege = Protège vos comptes si quelqu’un copie votre profil : sans les cookies, il ne peut pas y accéder.
aegis-sesiones-no-protege = Ne protège pas d’un logiciel malveillant tant que { -brand-short-name } est ouvert : jusqu’à ce que vous quittiez, les sessions restent sur l’ordinateur.
aegis-sesiones-cierre-forzado = Si { -brand-short-name } est fermé de force (plantage ou coupure de courant), le nettoyage se fait à la prochaine ouverture.

## Liens vers « Comment fonctionnent les Boucliers » (about:escudos)

# Pie del panel de Escudos: abre la página de ayuda en una pestaña.
aegis-escudos-ayuda = Comment fonctionnent les Boucliers
# Ajustes: enlace junto a cada opción de Escudos y de huella; abre la ayuda en su sección.
aegis-ayuda-rastreo = En savoir plus
    .aria-label = En savoir plus sur la protection contre le pistage
aegis-ayuda-cookies = En savoir plus
    .aria-label = En savoir plus sur les cookies tiers
aegis-ayuda-https = En savoir plus
    .aria-label = En savoir plus sur le mode HTTPS uniquement
aegis-ayuda-olvidar = En savoir plus
    .aria-label = En savoir plus sur l’oubli des sites à la fermeture
aegis-ayuda-huella = En savoir plus
    .aria-label = En savoir plus sur l’empreinte numérique
aegis-ayuda-google = En savoir plus
    .aria-label = En savoir plus sur Google propre

## Escudos: molestias, excepciones por sitio y Ajustes › Escudos (escudos.sys.mjs, escudos/ajustes.sys.mjs)

aegis-escudos-molestia-activa = Masqués sur tous les sites
aegis-escudos-molestia-apagada = Désactivé sur tous les sites
aegis-escudos-molestia-permitida-sitio = Autorisés sur ce site

aegis-escudos-excepciones-sitio = Exceptions pour ce site…
aegis-escudos-excepciones-ninguna = Aucune

aegis-escudos-grupo-anuncios = Publicités
aegis-escudos-grupo-rastreadores = Traqueurs
aegis-escudos-grupo-cookies-avisos = Bandeaux de cookies
aegis-escudos-grupo-molestias = Pop-ups et bannières
aegis-escudos-grupo-antiadblock = Alertes anti-bloqueur
aegis-escudos-grupo-cosmetico = Éléments masqués
aegis-escudos-grupo-scriptlets = Scripts des listes

aegis-ajustes-escudos = Boucliers
aegis-ajustes-escudos-descripcion = Ce que bloquent les Boucliers sur tous les sites, et les exceptions de chaque site.

# Paramètres › Vie privée : la section « Boucliers » (à la place de la protection contre le pistage du navigateur, qui
# continue de fonctionner en dessous) et l’avis de mises à jour désactivées (seulement dans la version qui se met à jour
# toute seule). « Connexions » est about:conexiones.
aegis-ajustes-privacidad-escudos-descripcion = Ils bloquent les publicités et les traqueurs sur tous les sites. Leur niveau, les nuisances et les exceptions de chaque site se trouvent sur leur page.
aegis-ajustes-privacidad-escudos-abrir = Ouvrir les Boucliers
aegis-ajustes-actualizaciones-apagadas = Mises à jour automatiques désactivées
aegis-ajustes-actualizaciones-apagadas-detalle = { -brand-short-name } ne cherche pas de nouvelles versions, car vous ne l’avez pas autorisé dans Connexions. Les correctifs de sécurité arrivent avec elles.

aegis-ajustes-escudos-nivel-titulo = Niveau
aegis-ajustes-escudos-nivel-descripcion = Ce que bloquent les Boucliers sur tous les sites. C’est le même réglage que dans le panneau.
aegis-ajustes-escudos-nivel-normal = Normal
aegis-ajustes-escudos-nivel-normal-descripcion = Bloque les traqueurs connus et les publicités des listes de filtres. Presque aucun site ne casse.
aegis-ajustes-escudos-nivel-estricto = Strict
aegis-ajustes-escudos-nivel-estricto-descripcion = Bloque aussi les vidéos, commentaires et boutons de réseaux sociaux qui pistent, et retire des liens les données de pistage. Certains sites peuvent paraître incomplets.
aegis-ajustes-escudos-nivel-estricto-mas = Strict+ (recommandé)
aegis-ajustes-escudos-nivel-estricto-mas-descripcion = Tout ce que fait Strict, plus une liste de pistage plus large (AdGuard Tracking Protection). Utilise un peu plus de mémoire.
aegis-ajustes-escudos-nivel-personalizado = Vous avez modifié à la main la protection contre le pistage : aucun niveau ne correspond. Choisissez-en un pour revenir.
aegis-ajustes-escudos-nivel-nota = Aucun niveau ne rend le blocage invisible : un site peut remarquer que ses publicités manquent.

aegis-ajustes-escudos-molestias-titulo = Nuisances
aegis-ajustes-escudos-molestias-descripcion = Masquées sur tous les sites. Pour les voir sur un site précis, ajoutez-le dans « Exceptions par site ».
aegis-ajustes-escudos-molestia-cookies-detalle = Bandeaux de consentement. En masquer un ne revient pas toujours à refuser : le site décide quoi faire sans votre réponse.
aegis-ajustes-escudos-molestia-ventanas-detalle = Pop-ups, bannières d’installation d’applis, widgets et autres nuisances.
aegis-ajustes-escudos-molestia-antiadblock-detalle = Messages qui vous demandent de désactiver le bloqueur. Ne fonctionne pas sur tous les sites.
aegis-ajustes-escudos-molestias-nota = Chaque groupe utilise des listes de leurs auteurs (uBlock Origin, AdGuard et EasyList). Quand vous le modifiez, les Boucliers mettent quelques secondes à les préparer.

aegis-ajustes-escudos-contador-titulo = Compteur
aegis-ajustes-escudos-contador-descripcion = Ce que compte le nombre du bouton des Boucliers et de son panneau.
aegis-ajustes-escudos-contador-peticiones = Requêtes
aegis-ajustes-escudos-contador-origenes = Origines
aegis-ajustes-escudos-contador-peticiones-detalle = Chaque requête bloquée compte pour une, même vers le même serveur.
aegis-ajustes-escudos-contador-origenes-detalle = Chaque serveur bloqué compte une seule fois par page, quel que soit le nombre de tentatives.

aegis-ajustes-escudos-listas-titulo = Listes de filtres
aegis-ajustes-escudos-listas-descripcion = Les règles viennent de leurs auteurs (uBlock Origin, EasyList, AdGuard et Brave). { -brand-short-name } les télécharge directement chez eux, sans cookies.
aegis-ajustes-escudos-listas-activas = { $listas ->
        [one] 1 liste active
       *[other] { $listas } listes actives
    }
aegis-ajustes-escudos-ultima = Dernière mise à jour : { $fecha }
aegis-ajustes-escudos-actualizar-ahora = Mettre à jour
aegis-ajustes-escudos-actualizando = Mise à jour…
aegis-ajustes-escudos-resultado-nuevas = Listes mises à jour
aegis-ajustes-escudos-resultado-iguales = Déjà à jour
aegis-ajustes-escudos-resultado-fallos = { $listas ->
        [one] Une liste n’a pas pu être téléchargée ; la version précédente est conservée
       *[other] { $listas } listes n’ont pas pu être téléchargées ; les versions précédentes sont conservées
    }
aegis-ajustes-escudos-resultado-sin-permiso = Il manque l’autorisation de Connexions pour les télécharger
aegis-ajustes-escudos-resultado-error = Mise à jour impossible. Réessayez plus tard
aegis-ajustes-escudos-automatica = Mettre à jour les listes automatiquement
aegis-ajustes-escudos-automatica-detalle = Une vérification par jour ; chaque liste n’est demandée qu’à son expiration.
aegis-ajustes-escudos-automatica-sin-permiso = Nécessite l’autorisation « Listes de protection » dans Connexions.
aegis-ajustes-escudos-sin-conexiones = En attendant, les Boucliers utilisent les listes fournies avec { -brand-short-name }.
aegis-ajustes-escudos-elegir-conexiones = Choisir les connexions

aegis-ajustes-escudos-intervalo = Renouveler chaque liste au moins tous les
aegis-ajustes-escudos-intervalo-detalle = Plus tôt si son auteur le demande : certaines listes expirent en quelques heures.
aegis-ajustes-escudos-dias = { $dias ->
        [one] 1 jour
       *[other] { $dias } jours
    }
aegis-ajustes-escudos-ver-listas = Voir les listes ({ $listas })
aegis-ajustes-escudos-ocultar-listas = Masquer les listes

aegis-ajustes-escudos-origen-red = téléchargée
aegis-ajustes-escudos-origen-build = incluse dans { -brand-short-name }

aegis-ajustes-escudos-excepciones-titulo = Exceptions par site
aegis-ajustes-escudos-excepciones-descripcion = Sites où les Boucliers laissent passer quelque chose. « Tout autoriser » revient à baisser les Boucliers depuis le panneau.
aegis-ajustes-escudos-excepciones-descripcion-privada = Dans une fenêtre privée, les exceptions durent jusqu’à la fermeture de la dernière fenêtre privée. « Tout autoriser » revient à baisser les Boucliers depuis le panneau.
aegis-ajustes-escudos-anadir-titulo = Ajouter un site

aegis-ajustes-escudos-anadir-ejemplo = exemple.com
aegis-ajustes-escudos-anadir = Ajouter
aegis-ajustes-escudos-anadir-error = Saisissez l’adresse d’un site, comme exemple.com.
aegis-ajustes-escudos-excepciones-vacio = Aucun site n’a d’exception.
aegis-ajustes-escudos-sitio-todo = Tout autorisé : Boucliers baissés
aegis-ajustes-escudos-sitio-nada = Rien d’autorisé pour l’instant
aegis-ajustes-escudos-editar = Modifier
    .aria-label = Modifier les exceptions de { $sitio }
aegis-ajustes-escudos-cerrar = Fermer
    .aria-label = Fermer les exceptions de { $sitio }
aegis-ajustes-escudos-quitar = Retirer
    .aria-label = Retirer toutes les exceptions de { $sitio }
aegis-ajustes-escudos-permitir-todo = Tout autoriser sur ce site
aegis-ajustes-escudos-permitir-todo-detalle = Baisse les Boucliers : rien n’est bloqué. C’est le grand interrupteur du panneau.
aegis-ajustes-escudos-que-permitir = Ou choisissez quoi autoriser

aegis-ajustes-escudos-por-ajuste-general = Autorisé par un réglage global : désactivé pour tous les sites.
aegis-ajustes-escudos-por-permitir-todo = Autorisé : ce site a « Tout autoriser ».
aegis-ajustes-escudos-grupo-anuncios-detalle = Requêtes vers les serveurs publicitaires des listes de filtres.
aegis-ajustes-escudos-grupo-rastreadores-detalle = Ceux des listes de filtres. La protection contre le pistage du navigateur reste active ; pour la retirer aussi, utilisez « Tout autoriser ».
aegis-ajustes-escudos-grupo-cookies-avisos-detalle = Les bandeaux de consentement aux cookies.
aegis-ajustes-escudos-grupo-molestias-detalle = Pop-ups, bannières d’applis et widgets.
aegis-ajustes-escudos-grupo-antiadblock-detalle = Les messages qui vous demandent de désactiver le bloqueur.
aegis-ajustes-escudos-grupo-cosmetico-detalle = Emplacements publicitaires et autres éléments que les listes masquent sur la page.
aegis-ajustes-escudos-grupo-scriptlets-detalle = Petits scripts des listes qui neutralisent publicités et détecteurs dans la page.

aegis-ayuda-nivel = En savoir plus
    .aria-label = En savoir plus sur les niveaux des Boucliers
aegis-ayuda-molestias = En savoir plus
    .aria-label = En savoir plus sur les nuisances
aegis-ayuda-contador = En savoir plus
    .aria-label = En savoir plus sur le compteur
aegis-ayuda-listas = En savoir plus
    .aria-label = En savoir plus sur les listes de filtres
aegis-ayuda-excepciones = En savoir plus
    .aria-label = En savoir plus sur les exceptions par site

## Importar de otros navegadores (migracion/). Nombres de los navegadores de origen en el asistente de importar
## (marcas: no se traducen) y la página de las contraseñas: cómo sacar un CSV de cada uno. Solo los ids que empiezan
## por «aegis-migracion-navegador-firefox» pueden nombrar ese navegador (tools/verificar.py).

aegis-migracion-navegador-firefox = Firefox
aegis-migracion-navegador-aegis = { -brand-short-name }

aegis-migracion-navegador-firefox-csv-titulo = Comment importer les mots de passe de Firefox
aegis-migracion-navegador-firefox-csv-en = Dans Firefox :
aegis-migracion-navegador-firefox-csv-paso1 = Saisissez about:logins dans la barre d’adresse et appuyez sur Entrée.
aegis-migracion-navegador-firefox-csv-paso2 = Ouvrez le menu (…) en haut à droite et choisissez « Exporter les mots de passe… ».
aegis-migracion-navegador-firefox-csv-paso3 = Confirmez et enregistrez le fichier sur votre appareil.
aegis-migracion-csv-brave-titulo = Comment importer les mots de passe de Brave
aegis-migracion-csv-brave-en = Dans Brave :
aegis-migracion-csv-brave-paso1 = Saisissez brave://password-manager/settings dans la barre d’adresse et appuyez sur Entrée.
aegis-migracion-csv-brave-paso2 = Sous « Exporter les mots de passe », cliquez sur « Télécharger le fichier ».
aegis-migracion-csv-brave-paso3 = Enregistrez le fichier sur votre appareil.
aegis-migracion-csv-edge-titulo = Comment importer les mots de passe de Microsoft Edge
aegis-migracion-csv-edge-en = Dans Microsoft Edge :
aegis-migracion-csv-edge-paso1 = Saisissez edge://settings/passwords dans la barre d’adresse et appuyez sur Entrée.
aegis-migracion-csv-edge-paso2 = Ouvrez « Autres actions » (…) à côté des mots de passe enregistrés et choisissez « Exporter les mots de passe ».
aegis-migracion-csv-edge-paso3 = Confirmez avec le code PIN ou le mot de passe de Windows et enregistrez le fichier sur votre appareil.
# Último paso, común: vuelve al asistente y elige el CSV con su botón (el de Firefox, «Seleccionar archivo»).
aegis-migracion-csv-final = Revenez ici et choisissez le fichier pour terminer. Il contient vos mots de passe en clair : supprimez-le dès que vous avez fini.

# Otro Aegis (otro perfil o el de otro equipo): no exporta en claro; las contraseñas pasan con el código de
# transferencia (contrasenas/transferencia/). El botón «Seleccionar archivo» de la página (el de Firefox) elige el
# archivo y luego se pide el código. «-final-ajustes»: cuando el asistente no puede abrir el diálogo (dentro de la
# bienvenida), remite a Ajustes. Los nombres de Ajustes y de los botones, como salen en la interfaz.
aegis-migracion-aegis-contrasenas-titulo = Comment transférer les mots de passe d’un autre { -brand-short-name }
aegis-migracion-aegis-contrasenas-en = Dans l’autre { -brand-short-name } (sur cet ordinateur ou un autre) :
aegis-migracion-aegis-contrasenas-paso1 = Ouvrez Paramètres › Mots de passe et, sous « Transférer vers un autre { -brand-short-name } », cliquez sur « Créer le fichier… ».
aegis-migracion-aegis-contrasenas-paso2 = Enregistrez le fichier et notez le code de 6 mots qui s’affiche.
aegis-migracion-aegis-contrasenas-paso3 = S’il s’agit d’un autre ordinateur, apportez le fichier jusqu’à celui-ci (sur une clé USB ou dans votre cloud).
aegis-migracion-aegis-contrasenas-final = Revenez ici, choisissez le fichier et saisissez le code. Si vous préférez ne pas les transférer maintenant, passez cette étape pour importer le reste.
aegis-migracion-aegis-contrasenas-final-ajustes = Ensuite, ouvrez-le dans Paramètres › Mots de passe › « Recevoir d’un autre { -brand-short-name } ». Pour l’instant, passez cette étape pour importer le reste.

## Pasar las contraseñas a otro Aegis con el código de 6 palabras (contrasenas/transferencia/): Ajustes › Contraseñas
## y autorrelleno («Transferencia de contraseñas», detrás del cierre automático), los diálogos de pasar y de recibir
## (dialogos/transferencia-*.xhtml, 440 px de ancho: los textos largos pasan a otra línea) y el selector de archivos.
## «Código de transferencia» está en el glosario. Las palabras del código son siempre las de la lista del EFF, en
## inglés: no se traducen ni salen aquí. Honestidad: la caducidad (24 h) y el «una sola vez» los comprueba Aegis al
## abrir el archivo; lo que protege el archivo es el código.

# Ajustes: etiqueta de la sección (en mayúsculas), su descripción y dos filas con su detalle y un botón compacto.
aegis-transferencia-titulo = Transfert des mots de passe
aegis-transferencia-descripcion = Transférez vos mots de passe vers un autre { -brand-short-name } (sur cet ordinateur ou un autre) dans un fichier chiffré qui ne s’ouvre qu’avec un code de 6 mots. Ils ne passent par aucun serveur : c’est vous qui transportez le fichier.
aegis-transferencia-pasar = Transférer vers un autre { -brand-short-name }
aegis-transferencia-pasar-detalle = Crée le fichier et son code. Le code ne s’affiche qu’une fois et le fichier expire au bout de 24 heures.
aegis-transferencia-pasar-boton = Créer le fichier…
aegis-transferencia-recibir = Recevoir d’un autre { -brand-short-name }
aegis-transferencia-recibir-detalle = Ouvre ici le fichier avec son code. Les mots de passe que vous avez déjà ne sont pas dupliqués.
aegis-transferencia-recibir-boton = Ouvrir le fichier…
# Títulos del selector de archivos del sistema, el nombre del tipo de archivo y el nombre que se propone (sin la
# extensión .aegisvault, que se añade sola).
aegis-transferencia-selector-guardar = Enregistrer le fichier de mots de passe
aegis-transferencia-selector-abrir = Choisissez le fichier de mots de passe
aegis-transferencia-selector-filtro = Mots de passe { -brand-short-name }
aegis-transferencia-nombre-archivo = Mots de passe { -brand-short-name }
# Mensaje y título del diálogo de Windows Hello al crear el archivo.
aegis-transferencia-autenticacion = Pour transférer vos mots de passe vers un autre { -brand-short-name }, saisissez vos identifiants Windows. Cela aide à protéger vos comptes.
aegis-transferencia-autenticacion-titulo = { -brand-short-name }
# Botones comunes de los dos diálogos.
aegis-transferencia-cancelar = Annuler
aegis-transferencia-hecho = Terminé

# Diálogo «Pasar a otro Aegis». Paso 1: qué se lleva y el aviso.
aegis-pasar-ventana = Transférer vers un autre { -brand-short-name }
aegis-pasar-titulo = Transférez vos mots de passe vers un autre { -brand-short-name }
aegis-pasar-explicacion = Ils sont enregistrés dans un fichier chiffré. À la fin, vous verrez un code de 6 mots : dans l’autre { -brand-short-name }, ouvrez le fichier dans Paramètres › Mots de passe › « Recevoir d’un autre { -brand-short-name } » et saisissez le code.
# $contrasenas: cuántas hay guardadas (1 o más).
aegis-pasar-resumen =
    { $contrasenas ->
        [one] 1 mot de passe enregistré sera transféré.
       *[other] { $contrasenas } mots de passe enregistrés seront transférés.
    }
aegis-pasar-vacio = Aucun mot de passe enregistré à transférer.
# Casilla, marcada de serie. $codigos: cuántos códigos de verificación hay guardados.
aegis-pasar-incluir-codigos =
    { $codigos ->
        [one] Inclure aussi le code de vérification enregistré
       *[other] Inclure aussi les { $codigos } codes de vérification enregistrés
    }
aegis-pasar-aviso-titulo = Quiconque possède le fichier et le code possède vos mots de passe
aegis-pasar-aviso-texto = Gardez le fichier dans un endroit que vous contrôlez et ne l’envoyez pas avec le code. Supprimez-le dès que vous l’avez ouvert dans l’autre { -brand-short-name }.
# Solo con la casilla de los códigos marcada.
aegis-pasar-aviso-codigos = Avec les codes de vérification, le fichier contient les deux étapes de ces comptes.
aegis-pasar-limites = Le fichier expire au bout de 24 heures et ne peut être ouvert qu’une fois dans chaque profil : c’est { -brand-short-name } qui le vérifie à l’ouverture. Ce qui le protège vraiment, c’est le code.
aegis-pasar-crear = Créer le fichier…
# Paso 2: el código, una sola vez.
aegis-pasar-codigo-titulo = Votre code de transfert
aegis-pasar-codigo-explicacion = Saisissez-le dans l’autre { -brand-short-name } en ouvrant le fichier. Il expire au bout de 24 heures.
aegis-pasar-copiar = Copier le code
# Tras copiar. $segundos: tras cuántos segundos se borra (60 de serie).
aegis-pasar-copiado = Copié. Il sera effacé du presse-papiers dans { $segundos } s s’il y est encore.
aegis-pasar-copiado-sin-borrar = Copié. Videz le presse-papiers une fois le code collé.
aegis-pasar-copiar-error = Impossible de copier. Notez-le à la main.
aegis-pasar-una-vez-titulo = Il ne sera plus affiché
aegis-pasar-una-vez-texto = Notez-le ou copiez-le maintenant. { -brand-short-name } ne le garde pas : si vous le perdez, le fichier ne pourra pas être ouvert et il faudra en créer un autre.
# $archivo: el nombre del archivo; $contrasenas y $codigos: cuántos lleva.
aegis-pasar-guardado =
    Dans « { $archivo } » : { $contrasenas ->
        [one] 1 mot de passe
       *[other] { $contrasenas } mots de passe
    }.
aegis-pasar-guardado-codigos =
    Dans « { $archivo } » : { $contrasenas ->
        [one] 1 mot de passe
       *[other] { $contrasenas } mots de passe
    } et { $codigos ->
        [one] 1 code de vérification
       *[other] { $codigos } codes de vérification
    }.
aegis-pasar-error-autenticacion = Impossible de vérifier votre identité. Réessayez.
# Sin contraseña principal no se pasa nada (si el diálogo se abre sin pasar por Ajustes).
aegis-pasar-error-sin-principal = Pour transférer vos mots de passe vers un autre { -brand-short-name }, il faut un mot de passe principal. Créez-le depuis l’avis du panneau des mots de passe et réessayez.
aegis-pasar-error-escribir = Impossible d’enregistrer le fichier. Choisissez un autre dossier et réessayez.
aegis-pasar-error = Impossible de créer le fichier. Réessayez.

# Diálogo «Recibir de otro Aegis». Paso 1: el archivo y el código.
aegis-recibir-ventana = Recevoir d’un autre { -brand-short-name }
aegis-recibir-titulo = Recevez des mots de passe d’un autre { -brand-short-name }
aegis-recibir-explicacion = Choisissez le fichier créé dans l’autre { -brand-short-name } et saisissez son code de 6 mots.
aegis-recibir-archivo = Fichier
aegis-recibir-sin-archivo = Aucun fichier choisi
aegis-recibir-elegir = Choisir…
aegis-recibir-cambiar = Changer…
aegis-recibir-codigo = Code de 6 mots
# Debajo del campo: antes de escribir, cuántas palabras lleva o cuál no es del código. $palabras: de 1 a 7 o más.
aegis-recibir-codigo-nota = Les mots dans l’ordre, séparés par des espaces. Les majuscules n’ont pas d’importance.
aegis-recibir-codigo-cuenta = { $palabras } mots sur 6
aegis-recibir-codigo-desconocida = « { $palabra } » n’est pas un mot du code. Vérifiez l’orthographe.
aegis-recibir-limites = Ils s’ajoutent à vos mots de passe enregistrés, protégés par votre mot de passe principal. Ceux que vous avez déjà ne sont pas dupliqués ; si celui du fichier est plus récent, il remplace le vôtre.
aegis-recibir-boton = Recevoir
aegis-recibir-abriendo = Ouverture du fichier…
# Errores. «-incorrecto» no dice si el fallo es del código o del archivo (a propósito).
aegis-recibir-error-incorrecto = Le code ou le fichier n’est pas correct. Vérifiez les 6 mots et qu’il s’agit bien du fichier que vous avez créé.
aegis-recibir-error-version = Ce fichier provient d’une version plus récente de { -brand-short-name }. Mettez { -brand-short-name } à jour et réessayez.
aegis-recibir-error-caducado = Ce fichier a expiré : il n’est valable que 24 heures. Créez-en un autre dans l’autre { -brand-short-name }.
aegis-recibir-error-reloj = La date de ce fichier est postérieure à celle de cet ordinateur. Vérifiez la date et l’heure des deux ordinateurs.
aegis-recibir-error-usado = Ce fichier a déjà été ouvert ici et n’est valable qu’une fois. Si besoin, créez-en un autre dans l’autre { -brand-short-name }.
aegis-recibir-error-leer = Impossible de lire le fichier. Vérifiez qu’il est toujours à sa place et réessayez.
aegis-recibir-error-sin-principal = Pour recevoir des mots de passe d’un autre { -brand-short-name }, il faut un mot de passe principal. Créez-le et réessayez.
aegis-recibir-error-bloqueada = Votre mot de passe principal est nécessaire pour enregistrer les mots de passe. Réessayez.
aegis-recibir-error = Impossible de recevoir les mots de passe. Réessayez.
# Paso 2: el resumen (una línea por cada cosa que no sea cero; la primera, siempre) y borrar el archivo. $n: cuántas.
aegis-recibir-hecho-titulo = Mots de passe reçus
aegis-recibir-hecho-explicacion = Ils sont maintenant dans vos mots de passe enregistrés, protégés par votre mot de passe principal.
aegis-recibir-resumen-nuevas =
    { $n ->
        [one] 1 nouveau mot de passe
       *[other] { $n } nouveaux mots de passe
    }
aegis-recibir-resumen-actualizadas =
    { $n ->
        [one] 1 mis à jour (celui du fichier était plus récent)
       *[other] { $n } mis à jour (ceux du fichier étaient plus récents)
    }
aegis-recibir-resumen-ya =
    { $n ->
        [one] 1 était déjà enregistré
       *[other] { $n } étaient déjà enregistrés
    }
aegis-recibir-resumen-codigos =
    { $n ->
        [one] 1 nouveau code de vérification
       *[other] { $n } nouveaux codes de vérification
    }
aegis-recibir-resumen-codigos-ya =
    { $n ->
        [one] 1 compte avait déjà son code de vérification (inchangé)
       *[other] { $n } comptes avaient déjà leur code de vérification (inchangé)
    }
aegis-recibir-resumen-errores =
    { $n ->
        [one] 1 n’a pas pu être ajouté
       *[other] { $n } n’ont pas pu être ajoutés
    }
aegis-recibir-borrar-titulo = Supprimez le fichier
aegis-recibir-borrar-texto = Il n’est plus utile et, avec lui et le code, n’importe qui pourrait lire vos mots de passe. Supprimez-le aussi là où vous l’avez copié (une clé USB, votre cloud).
aegis-recibir-borrar = Supprimer le fichier
aegis-recibir-borrado = Fichier supprimé.
aegis-recibir-borrar-error = Impossible de le supprimer. Supprimez-le depuis son dossier.

## about:bienvenida (paginas/bienvenida.html; bienvenida.sys.mjs): las preguntas de Aegis Setup dentro del navegador,
## para quien no pasa por el instalador (Microsoft Store, zip). Sale en el primer arranque, antes de «Tú decides qué se
## conecta». Misma redacción que el asistente del instalador (packaging/instalador/traducciones/): si cambia uno, cambia
## el otro. Los nombres de los buscadores (DuckDuckGo, Startpage, Brave Search, Google) y «Workflow» no se traducen.

aegis-bienvenida-pestana = Bienvenue
aegis-bienvenida-nombre = { -brand-short-name }
aegis-bienvenida-lema = Un navigateur privé, épuré et rapide
# Etiqueta de sección del resumen (se muestra en mayúsculas).
aegis-bienvenida-resumen = Votre configuration
aegis-bienvenida-fila-modo = Mode
aegis-bienvenida-fila-escudos = Boucliers
aegis-bienvenida-fila-buscador = Moteur de recherche
aegis-bienvenida-fila-apariencia = Apparence
aegis-bienvenida-resumen-nota = Vous pourrez tout changer quand vous voulez dans les Paramètres.
aegis-bienvenida-modo-titulo = Comment voulez-vous naviguer ?
aegis-bienvenida-modo-subtitulo = Choisissez un mode. Vous pourrez le changer quand vous voulez dans les Paramètres.
aegis-bienvenida-modo-estandar = Standard
aegis-bienvenida-modo-estandar-detalle = Les onglets en haut, comme toujours
aegis-bienvenida-modo-workflow = Workflow
aegis-bienvenida-modo-workflow-detalle = Onglets verticaux sur le côté
aegis-bienvenida-modo-nota-estandar = Une barre épurée, avec les onglets en haut et une barre personnelle discrète.
aegis-bienvenida-modo-nota-workflow = Les onglets dans une barre latérale, et plus de largeur pour la page.
aegis-bienvenida-escudos-titulo = Quel niveau de blocage voulez-vous ?
aegis-bienvenida-escudos-subtitulo = Les Boucliers bloquent les publicités et les traqueurs dès la première minute.
aegis-bienvenida-escudos-normal = Normal
aegis-bienvenida-escudos-normal-detalle = Bloque les traqueurs connus et les publicités. Presque aucun site ne casse.
aegis-bienvenida-escudos-estricto = Strict
aegis-bienvenida-escudos-estricto-detalle = Bloque aussi les boutons sociaux et les vidéos qui pistent. Certains sites peuvent paraître incomplets.
aegis-bienvenida-escudos-estricto-mas = Strict+
# Nombre que lee el lector de pantalla para la tarjeta de Estricto+ (la insignia es parte del dibujo).
aegis-bienvenida-escudos-estricto-mas-accesible =
    .aria-label = Strict+ (recommandé)
aegis-bienvenida-escudos-estricto-mas-detalle = Tout ce que fait Strict, plus une liste de pistage plus large. Utilise un peu plus de mémoire.
# Insignia sobre la tarjeta de Estricto+ (se muestra en mayúsculas).
aegis-bienvenida-recomendado = Recommandé
aegis-bienvenida-escudos-nota = Vous pourrez le changer quand vous voulez dans Paramètres › Boucliers.
aegis-bienvenida-buscador-titulo = Où voulez-vous chercher ?
aegis-bienvenida-buscador-subtitulo = Le moteur de recherche de la barre d’adresse. Vous pourrez le changer quand vous voulez dans les Paramètres.
aegis-bienvenida-buscador-duckduckgo = Ne conserve pas vos recherches.
aegis-bienvenida-buscador-startpage = Les résultats de Google sans que Google sache qui vous êtes.
aegis-bienvenida-buscador-brave = Son propre index indépendant, sans profilage.
aegis-bienvenida-buscador-google = Les résultats habituels. Google conserve vos recherches.
aegis-bienvenida-apariencia-titulo = Choisissez l’apparence
aegis-bienvenida-apariencia-subtitulo = { -brand-short-name } reste en noir et blanc : la couleur vient du Web.
aegis-bienvenida-apariencia-oscuro = Sombre
aegis-bienvenida-apariencia-oscuro-detalle = Noir et gris
aegis-bienvenida-apariencia-claro = Clair
aegis-bienvenida-apariencia-claro-detalle = Blanc et gris
aegis-bienvenida-apariencia-auto = Automatique
# Automático sigue el tema del sistema: en Windows, como en el instalador.
aegis-bienvenida-apariencia-auto-detalle =
    { PLATFORM() ->
        [windows] Comme Windows
       *[other] Comme le système
    }
aegis-bienvenida-apariencia-nota = Vous pourrez le changer quand vous voulez dans Paramètres › Apparence.
# Pie: los pasos. $n es el paso en el que se está y $total, cuántos hay (5).
aegis-bienvenida-paso = Étape { $n } sur { $total }
aegis-bienvenida-atras = Retour
aegis-bienvenida-continuar = Continuer
# Primer paso: ver y cambiar cada pregunta.
aegis-bienvenida-personalizar = Personnaliser
# Primer paso, sin haber cambiado nada: aplica lo recomendado y sigue (se salta las preguntas).
aegis-bienvenida-usar-recomendado = Utiliser les réglages recommandés
# Primer paso, después de cambiar algo: aplica lo elegido y sigue.
aegis-bienvenida-usar-eleccion = Utiliser ces réglages

## Contenedores: el selector de la barra de direcciones (contenedores.sys.mjs; DISENO §9, «Selector de contenedor»).
## «Contenedor» es el término de Firefox en cada idioma (de «Umgebung», fr «conteneur», it «contenitore», pt-BR
## «contêiner»). Panel de 340 px: textos cortos.

# Botón de la barra cuando la pestaña no está en ningún contenedor (texto de ayuda y nombre para lectores de pantalla).
# $atajo: el atajo de teclado tal como lo escribe el sistema (p. ej. «Ctrl+Mayús+L»).
aegis-contenedores-boton =
    .tooltiptext = Changer de conteneur ({ $atajo })
aegis-contenedores-titulo = Conteneur
# Debajo del título. $nombre: el contenedor de la pestaña («Trabajo»).
aegis-contenedores-actual = Cet onglet est dans { $nombre }
aegis-contenedores-actual-ninguno = Cet onglet n’est dans aucun conteneur
# Etiqueta de sección encima de la lista (se ve en MAYÚSCULAS): cada fila es un contenedor.
aegis-contenedores-reabrir-etiqueta = Déplacer l’onglet vers
# Primera fila: la pestaña sin contenedor.
aegis-contenedores-ninguno = Sans conteneur
# Para lectores de pantalla, lo que hace cada fila. $nombre: el contenedor.
aegis-contenedores-reabrir-en = Rouvrir l’onglet dans { $nombre }
aegis-contenedores-reabrir-sin = Rouvrir l’onglet sans conteneur
# El «+» de cada fila (texto de ayuda y para lectores de pantalla). $nombre: el contenedor.
aegis-contenedores-nueva-en = Nouvel onglet dans { $nombre }
aegis-contenedores-nueva-sin = Nouvel onglet sans conteneur
# Línea de honestidad debajo de la lista (solo con una web en la pestaña): las cookies no pasan, la dirección sí (con lo
# que lleve, p. ej. un código de sesión). El atajo es el de «Reabrir pestaña cerrada».
aegis-contenedores-nota = La page se recharge dans l’autre conteneur, qui n’a pas les cookies de celui-ci : vous devrez peut-être vous reconnecter. L’adresse est transmise telle quelle, avec tout ce qu’elle contient. L’onglet actuel se ferme ; récupérez-le avec Ctrl+Maj+T.
# Aviso si SessionStore tiene algo escrito en un formulario de la pestaña.
aegis-contenedores-aviso-formulario = Vous avez saisi quelque chose sur cette page. Ce sera perdu si vous la déplacez vers un autre conteneur.
aegis-contenedores-nuevo = Nouveau conteneur…
aegis-contenedores-gestionar = Gérer

## Ajustes › Pestañas y navegación: la fila del tutorial de Workflow, debajo de «Disposición del navegador».

aegis-ajustes-tutorial = Tutoriel de Workflow
aegis-ajustes-tutorial-detalle = Les onglets verticaux, les conteneurs et les actions, en quatre étapes.
aegis-ajustes-tutorial-boton = Voir le tutoriel
# «Disposición del navegador» de Firefox (pestañas horizontales o verticales) son los modos de Aegis: el grupo y sus
# dos tarjetas se llaman como en la bienvenida.
aegis-ajustes-modo =
    .label = Mode
aegis-ajustes-modo-estandar =
    .label = Standard
    .description = Les onglets en haut, comme toujours
    .title = Les onglets en haut, comme toujours
aegis-ajustes-modo-workflow =
    .label = Workflow
    .description = Onglets verticaux sur le côté
    .title = Onglets verticaux sur le côté

## about:bienvenida: el tutorial de Workflow (bienvenida.sys.mjs). Sale al terminar la bienvenida con Workflow elegido
## y cuando se quiera desde Ajustes › Pestañas y navegación o con la acción «Ver el tutorial de Workflow». Cuatro pasos;
## cada uno con una chuleta: lo que se hace (izquierda) y cómo (derecha: un atajo o un gesto, corto). Los menús de
## Firefox, con su nombre en cada idioma («Fijar pestaña»); las teclas, con el suyo (Mayús, Maj, Umschalt, Maiusc…).

aegis-tutorial-pestana = Tutoriel de Workflow
aegis-tutorial-saltar = Passer le tutoriel
aegis-tutorial-siguiente = Suivant
# Último paso, al venir de la bienvenida: lleva a elegir qué se conecta (about:conexiones).
aegis-tutorial-empezar = Commencer
# Último paso, abierto desde Ajustes o las acciones: cierra la pestaña.
aegis-tutorial-hecho = Terminé

aegis-tutorial-pestanas-titulo = Vos onglets, dans le panneau latéral
aegis-tutorial-pestanas-subtitulo = En Workflow, ils s’empilent les uns sous les autres avec leur titre complet, et la page gagne en largeur.
aegis-tutorial-pestanas-plegar = Réduire ou développer le panneau latéral
aegis-tutorial-pestanas-plegar-como = Ctrl+Alt+Z
aegis-tutorial-pestanas-nueva = Ouvrir un nouvel onglet
aegis-tutorial-pestanas-nueva-como = Ctrl+T
aegis-tutorial-pestanas-cambiar = Aller à l’onglet suivant
aegis-tutorial-pestanas-cambiar-como = Ctrl+Tab

aegis-tutorial-ordenar-titulo = Déplacez-les et épinglez vos favoris
aegis-tutorial-ordenar-subtitulo = Organisez le panneau à votre façon : vos onglets du quotidien en haut, toujours à portée de main.
aegis-tutorial-ordenar-mover = Déplacer un onglet
aegis-tutorial-ordenar-mover-como = Faites-le glisser
aegis-tutorial-ordenar-fijar = L’épingler en haut
aegis-tutorial-ordenar-fijar-como = Clic droit › Épingler cet onglet
aegis-tutorial-ordenar-grupo = En regrouper plusieurs
aegis-tutorial-ordenar-grupo-como = Glissez-en un sur un autre

aegis-tutorial-contenedores-titulo = Conteneurs
aegis-tutorial-contenedores-subtitulo = Chaque conteneur garde ses propres cookies : vous pouvez ouvrir deux comptes du même site en même temps.
aegis-tutorial-contenedores-cambiar = Déplacer l’onglet vers un autre conteneur
aegis-tutorial-contenedores-cambiar-como = Ctrl+Maj+L
aegis-tutorial-contenedores-nueva = Ouvrir un nouvel onglet dans l’un d’eux
aegis-tutorial-contenedores-nueva-como = Clic droit sur +
aegis-tutorial-contenedores-enlace = Ouvrir un lien dans l’un d’eux
aegis-tutorial-contenedores-enlace-como = Clic droit sur le lien
aegis-tutorial-contenedores-nota = Le conteneur de l’onglet s’affiche dans la barre d’adresse : cliquez dessus pour en changer. La page se recharge alors, et ce que vous y aviez saisi ne suit pas.

aegis-tutorial-acciones-titulo = Tout depuis la barre d’adresse
aegis-tutorial-acciones-subtitulo = Tapez > et choisissez quoi faire, sans fouiller dans les menus.
aegis-tutorial-acciones-abrir = Voir toutes les actions
aegis-tutorial-acciones-abrir-como = Ctrl+L puis >
aegis-tutorial-acciones-modo = Changer de mode
aegis-tutorial-acciones-modo-como = > mode
aegis-tutorial-acciones-contenedor = Changer de conteneur
aegis-tutorial-acciones-contenedor-como = > conteneur
aegis-tutorial-acciones-nota = Revoyez ce tutoriel dans Paramètres › Onglets et navigation, ou avec > tutoriel.

## Barra de direcciones: modo «Acciones» (escribir «>» o elegir Acciones en el menú de la lupa) y la fila de botones
## que sale al escribir una palabra clave (acciones.sys.mjs). Cada acción es un botón pequeño: textos cortos, como los
## de las acciones del navegador («Ver descargas»). Los «-claves» son las palabras que la buscan: separadas por comas,
## en minúsculas y en el idioma de la interfaz (Aegis las busca también sin tildes). No se traducen palabra por
## palabra: las que usaría alguien de ese idioma para encontrar la acción.

aegis-accion-escudos = Ouvrir le panneau des Boucliers
aegis-accion-escudos-claves = boucliers, bloqueur, publicités, traqueurs, panneau des boucliers
aegis-accion-escudos-bajar = Baisser les Boucliers sur ce site
aegis-accion-escudos-subir = Activer les Boucliers sur ce site
aegis-accion-escudos-sitio-claves = boucliers, baisser les boucliers, activer les boucliers, désactiver le bloqueur, autoriser les publicités
aegis-accion-escudos-ajustes = Paramètres des Boucliers
aegis-accion-escudos-ajustes-claves = boucliers, paramètres des boucliers, exceptions, listes de filtres, filtres
aegis-accion-conexiones = Choisir ce qui se connecte
aegis-accion-conexiones-claves = connexions, connecter, réseau, vie privée
aegis-accion-modo-workflow = Passer au mode Workflow
aegis-accion-modo-estandar = Passer au mode Standard
aegis-accion-modo-claves = mode, workflow, standard, onglets verticaux
aegis-accion-contenedor = Changer de conteneur
aegis-accion-contenedor-claves = conteneur, conteneurs, changer de conteneur, onglet conteneur, comptes, identité
aegis-accion-tutorial = Voir le tutoriel de Workflow
aegis-accion-tutorial-claves = tutoriel, aide, workflow, onglets verticaux, comment faire
aegis-accion-apariencia = Apparence et couleur d’accent
aegis-accion-apariencia-claves = apparence, couleur d’accent, accent, couleur, thème sombre, thème clair
aegis-accion-tor = Nouvelle fenêtre privée avec Tor
aegis-accion-tor-claves = tor, fenêtre tor, anonyme, onion
aegis-accion-contrasenas = Ouvrir les mots de passe
aegis-accion-contrasenas-claves = mots de passe, identifiants, comptes, codes de vérification
aegis-accion-pasar = Transférer les mots de passe vers un autre { -brand-short-name }
aegis-accion-pasar-claves = transférer les mots de passe, exporter les mots de passe, transfert, mots de passe
aegis-accion-recibir = Recevoir les mots de passe d’un autre { -brand-short-name }
aegis-accion-recibir-claves = recevoir les mots de passe, transfert, code de transfert, mots de passe
aegis-accion-importar = Importer des données d’un autre navigateur
aegis-accion-importar-claves = importer, importer des données, chrome, edge, brave, migrer

## Fenêtre des profils (about:profilemanager) : supprimer un autre profil sans l’ouvrir (perfiles.sys.mjs).
## $nombre est le nom du profil.

aegis-perfiles-borrar-titulo = Supprimer le profil « { $nombre } » ?
aegis-perfiles-borrar-texto = Ses marque-pages, son historique, ses mots de passe, ses cookies, ses extensions et ses paramètres seront supprimés de cet appareil. Cette action est irréversible.
aegis-perfiles-borrar-acceso = Son raccourci sur le bureau sera aussi supprimé.
aegis-perfiles-borrar-cancelar = Annuler
aegis-perfiles-borrar-confirmar = Supprimer le profil
aegis-perfiles-borrar-error = Impossible de supprimer « { $nombre } ». S’il est ouvert dans une autre fenêtre de { -brand-short-name }, fermez-la et réessayez.

## Nouvel onglet › Messagerie : l’enveloppe à côté de Personnaliser, sa boîte de dialogue, son menu et sa section de
## Personnaliser (paginas/correo.sys.mjs). $sitio est le site de la boîte enregistrée (ex. « mail.proton.me »). Boîte de 440 px.

aegis-correo-titulo = Messagerie
aegis-correo-boton-elegir = Choisir votre messagerie
aegis-correo-boton-abrir = Ouvrir la messagerie ({ $sitio })
aegis-correo-dialogo-titulo = Votre messagerie
aegis-correo-dialogo-texto = Saisissez l’adresse de votre boîte de réception. L’enveloppe du nouvel onglet l’ouvrira ; { -brand-short-name } ne s’y connecte pas tant que vous ne cliquez pas dessus. L’adresse est enregistrée uniquement sur cet appareil.
aegis-correo-dialogo-campo = Adresse
aegis-correo-dialogo-ejemplos = Par exemple : mail.proton.me, mail.google.com ou outlook.live.com
aegis-correo-error-vacio = Saisissez l’adresse de votre messagerie.
aegis-correo-error-esquema = Seule une adresse sécurisée (https://) est acceptée. Vérifiez-la et réessayez.
aegis-correo-error-direccion = Cette adresse n’est pas valide. Vérifiez qu’elle est bien écrite.
aegis-correo-cancelar = Annuler
aegis-correo-guardar = Enregistrer
aegis-correo-menu-anadir = Ajouter l’adresse de la messagerie…
aegis-correo-menu-cambiar = Modifier l’adresse de la messagerie…
aegis-correo-quitar = Retirer
aegis-correo-sin = Aucune adresse : l’enveloppe en demandera une quand vous cliquerez dessus.
aegis-correo-actual = Ouvre { $sitio }
aegis-correo-anadir = Ajouter…
aegis-correo-cambiar = Modifier…

## Nouvel onglet : nom de la liste des raccourcis pour le lecteur d’écran (Firefox l’a écrit en dur en anglais).

aegis-accesos-titulo = Raccourcis
