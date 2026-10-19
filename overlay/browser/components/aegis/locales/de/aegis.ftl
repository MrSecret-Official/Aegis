# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

## Modus-Schaltfläche in der Symbolleiste (Standard / Workflow)

aegis-modo-button =
    .label = Modus
    .tooltiptext = Zwischen Standard- und Workflow-Modus wechseln

## Lesezeichen-Bereich in der Sidebar

aegis-marcadores-ventana =
    .title = In einem Fenster verwalten
aegis-marcadores-todos =
    .label = Alle Lesezeichen
aegis-marcadores-ordenar =
    .title = Sortieren
aegis-marcadores-orden-propio =
    .label = Eigene Reihenfolge
aegis-marcadores-orden-nombre =
    .label = Name (A–Z)
aegis-marcadores-orden-recientes =
    .label = Neueste zuerst
aegis-marcadores-vista =
    .title = Kompakte Ansicht
aegis-marcadores-editar =
    .title = Lesezeichen beim Klicken bearbeiten
aegis-marcadores-nueva-carpeta =
    .label = Neuer Ordner
aegis-marcadores-anadir-pestana =
    .label = Aktuellen Tab hinzufügen

## Einstellungsseite: Kopf der Sidebar und Kategoriegruppen

aegis-ajustes-titulo = Einstellungen
aegis-ajustes-grupo-personal = Persönlich
aegis-ajustes-grupo-navegacion = Surfen
aegis-ajustes-grupo-privacidad = Datenschutz
aegis-ajustes-grupo-sistema = System
aegis-ajustes-no-predeterminado =
    .message = { -brand-short-name } ist nicht dein Standardbrowser.

## Einstellungen › Erscheinungsbild: App-Symbol (Windows)

aegis-icono-titulo = App-Symbol
aegis-icono-descripcion = Wird in den Fenstern von { -brand-short-name } angezeigt. Private Fenster verwenden immer den Geist mit Schlüsselloch.
aegis-icono-fantasma = Geist
aegis-icono-uroboros = Ouroboros

## Schilde (Panel der Adressleiste)

aegis-escudos-boton =
    .tooltiptext = { $count ->
        [0] Schilde aktiv
        [one] Schilde aktiv: 1 blockiert auf dieser Seite
       *[other] Schilde aktiv: { $count } blockiert auf dieser Seite
    }
aegis-escudos-boton-bajados =
    .tooltiptext = Schilde für diese Website deaktiviert
aegis-escudos-activos-sitio = Schilde für diese Website aktiv
aegis-escudos-bajados-sitio = Schilde für diese Website deaktiviert
aegis-escudos-contador = { $count ->
        [one] Anzeige oder Tracker auf dieser Seite blockiert
       *[other] Anzeigen und Tracker auf dieser Seite blockiert
    }
aegis-escudos-contador-bajados = Die Schilde sind deaktiviert: Auf dieser Website wird nichts blockiert.
aegis-escudos-total = { $total ->
        [one] 1 Blockierung seit der Installation von { -brand-short-name }
       *[other] { $total } Blockierungen seit der Installation von { -brand-short-name }
    }
aegis-escudos-avanzadas = Erweiterte Optionen
aegis-escudos-rastreadores = Tracker und Werbung
aegis-escudos-nivel-normal = Normal
aegis-escudos-nivel-estricto = Streng
aegis-escudos-nivel-estricto-mas = Streng+
aegis-escudos-personalizado = Benutzerdefiniert
aegis-escudos-global = Auf allen Websites
aegis-escudos-ver-bloqueado = Auf dieser Seite blockiert
aegis-escudos-https = Verbindungen auf HTTPS umstellen
aegis-escudos-https-activo = Nur HTTPS auf dieser Website
aegis-escudos-https-excepcion = Diese Website darf unverschlüsselt laden
aegis-escudos-https-apagado = Der Nur-HTTPS-Modus ist in den Einstellungen deaktiviert
aegis-escudos-scripts = Skripte blockieren
aegis-escudos-scripts-pronto = Demnächst
aegis-escudos-huella = Fingerprinting
aegis-escudos-cookies = Drittanbieter-Cookies
aegis-escudos-cookies-entre-sitios = Tracker blockieren
aegis-escudos-cookies-todas = Alle blockieren
aegis-escudos-olvidar = Website beim Schließen vergessen
aegis-escudos-olvidar-detalle = Löscht ihre Cookies und Daten, wenn du { -brand-short-name } schließt
aegis-escudos-olvidar-privada = Ein privates Fenster vergisst beim Schließen ohnehin alles
aegis-escudos-listas = Filterlisten
aegis-escudos-configuracion = Alle Einstellungen
aegis-escudos-pie = Wenn diese Website fehlerhaft aussieht, deaktiviere die Schilde für sie. Das verringert ihren Schutz.
aegis-escudos-lista-titulo = Auf dieser Seite blockiert
aegis-escudos-atras =
    .aria-label = Zurück
aegis-escudos-cat-rastreadores = Tracker und Werbung
aegis-escudos-cat-anuncios = Werbung (Filterlisten)
aegis-escudos-cat-sociales = Social-Media-Tracker
aegis-escudos-cat-huella = Fingerprinting
aegis-escudos-cat-criptomineros = Krypto-Miner
aegis-escudos-lista-vacia = Auf dieser Seite wurde nichts blockiert.

## Einstellungsseite: Aegis-Namen statt der von Firefox

aegis-ajustes-general = Allgemein
aegis-ajustes-inicio-predeterminado =
    .label = { -brand-short-name }-Startseite (Standard)
aegis-ajustes-inicio =
    .label = { -brand-short-name }-Startseite
aegis-ajustes-inicio-aviso =
    .message = Um diese Funktionen zu nutzen, öffne neue Tabs oder neue Fenster mit der { -brand-short-name }-Startseite.
aegis-ajustes-personalizar-inicio =
    .label = { -brand-short-name }-Startseite anpassen

## Complementos (about:addons): cabecera de la barra lateral, buscador y estado vacío de Extensiones.

aegis-complementos-titulo = Add-ons
# Texto de ayuda del buscador: abre la tienda de complementos en una pestaña.
aegis-complementos-buscar = Add-ons im Web suchen
aegis-complementos-vacio = Du hast noch keine Erweiterungen.
aegis-complementos-vacio-boton = Erweiterungen suchen
# Panel de extensiones de la barra (la pieza de puzle) sin ninguna instalada: título, frase y, debajo, el botón
# aegis-complementos-vacio-boton, que abre la tienda de complementos en una pestaña.
aegis-extensiones-vacio-titulo = Du hast noch keine Erweiterungen
aegis-extensiones-vacio-texto = Such sie im Add-on-Store.
# Panel de extensiones con extensiones (al estilo de Chrome y Brave). Etiquetas de sección (se ven en MAYÚSCULAS):
# las fijadas en la barra de herramientas y, debajo, las que se ven solo dentro del panel.
aegis-extensiones-en-barra = In der Symbolleiste
aegis-extensiones-en-panel = In diesem Panel
# Botón de la chincheta de cada extensión (texto de ayuda y para lectores de pantalla). Dice lo que hace al pulsarlo.
# Variables:
#   $nombre (String) - nombre de la extensión
aegis-extensiones-fijar = { $nombre } an die Symbolleiste anheften
aegis-extensiones-desfijar = { $nombre } von der Symbolleiste lösen
# Pie del panel: abre Complementos › Extensiones (about:addons) y la tienda de complementos en una pestaña.
aegis-extensiones-gestionar = Erweiterungen verwalten
aegis-extensiones-anadir = Erweiterungen finden

## Barra lateral y barra de marcadores

# Pie de «Personalizar barra lateral»: abre los Ajustes del navegador.
aegis-barra-ajustes = { -brand-short-name }-Einstellungen
# Botón junto al aviso de la barra de marcadores vacía: la oculta mientras no tenga marcadores (vuelve sola con el primero).
aegis-marcadores-aviso-cerrar = Jetzt nicht
    .title = Lesezeichen-Symbolleiste ausblenden, solange sie leer ist

## Contraseñas (about:logins): estado vacío. La bóveda propia llegará más adelante.

aegis-contrasenas-vacio = Passwörter, die du beim Anmelden auf einer Website speicherst, erscheinen hier.
aegis-contrasenas-importar = Passwörter importieren

## Contraseñas: protección (contrasenas.sys.mjs), panel de la barra lateral (contrasenas-panel.sys.mjs) y aviso de
## about:logins. «Contraseña principal» es el término de Firefox (Primary Password): el mismo en todo el navegador.

# Botón del aviso del panel y de about:logins: abre el diálogo de la contraseña principal.
aegis-contrasenas-principal-crear = Hauptpasswort erstellen
# Aviso del panel y de about:logins cuando no hay contraseña principal.
aegis-contrasenas-sin-principal = Kein Hauptpasswort: Jedes Programm, das dein Profil kopiert, könnte deine gespeicherten Passwörter lesen.
# Estado vacío del panel de la barra lateral.
aegis-contrasenas-panel-titulo = Deine Passwörter, sicher verschlossen
aegis-contrasenas-panel-texto = { -brand-short-name } speichert sie verschlüsselt auf diesem Gerät, geschützt durch dein Hauptpasswort, und sendet sie nirgendwohin.

## Ajustes › Contraseñas y autorrelleno: «Cierre automático de la bóveda» (ajustes.sys.mjs), detrás de «Contraseñas». Segmentos:
## Nunca, 15, 10, 5, 3, 2 y 1 min; caben siete en una fila, así que las etiquetas son cortas.

aegis-bloqueo-titulo = Passwörter automatisch sperren
aegis-bloqueo-descripcion = Nach dieser Zeit ohne Nutzung des Computers werden die gespeicherten Passwörter gesperrt und { -brand-short-name } fragt erneut nach dem Hauptpasswort. Sie werden auch im Ruhezustand und beim Schließen von { -brand-short-name } gesperrt.
aegis-bloqueo-nunca-aviso = Mit „Nie“ werden sie nur beim Schließen von { -brand-short-name } oder im Ruhezustand gesperrt.
aegis-bloqueo-sin-principal = Gilt nur mit einem Hauptpasswort.
aegis-bloqueo-nunca = Nie
# Cada segmento con minutos. $minutos: 1, 2, 3, 5, 10 o 15.
aegis-bloqueo-minutos = { $minutos } Min.

## Diálogo de la contraseña principal (dialogos/contrasena-principal.xhtml), en lugar del de Firefox: crearla
## (antes de guardar la primera contraseña, desde el panel, about:logins o Ajustes) o cambiarla (Ajustes). Ancho
## fijo de 440 px: los textos largos pasan a otra línea.

# Título de la ventana o del marco del diálogo (Ajustes lo muestra arriba).
aegis-principal-ventana = Hauptpasswort
aegis-principal-titulo-crear = Erstelle dein Hauptpasswort
aegis-principal-titulo-cambiar = Ändere dein Hauptpasswort
# Antes de guardar la primera contraseña (botones «No guardar» y «Crear y guardar»).
aegis-principal-explicacion-guardar = Um Passwörter zu speichern, verschlüsselt { -brand-short-name } sie mit einem Hauptpasswort. Ohne Hauptpasswort könnte jedes Programm, das dein Profil kopiert, sie lesen. Du gibst es einmal pro Sitzung ein und erneut, wenn du den Computer eine Weile nicht benutzt hast.
# Desde el aviso del panel o de about:logins, o desde Ajustes.
aegis-principal-explicacion-crear = { -brand-short-name } verschlüsselt damit die Passwörter, die du speicherst. Ohne Hauptpasswort könnte jedes Programm, das dein Profil kopiert, sie lesen. Du gibst es einmal pro Sitzung ein und erneut, wenn du den Computer eine Weile nicht benutzt hast.
aegis-principal-explicacion-cambiar = Zum Ändern brauchst du das aktuelle. Deine gespeicherten Passwörter bleiben erhalten und sind dann mit dem neuen geschützt.
# Si una política de empresa exige la contraseña principal.
aegis-principal-politica = Deine Organisation verlangt ein Hauptpasswort.
aegis-principal-actual = Aktuelles Hauptpasswort
aegis-principal-nueva = Hauptpasswort
aegis-principal-nueva-cambiar = Neues Hauptpasswort
aegis-principal-repetir = Noch einmal eingeben
# Botón con el icono del ojo dentro de cada campo: muestra u oculta lo escrito.
aegis-principal-mostrar =
    .title = Passwort anzeigen
    .aria-label = Passwort anzeigen
# Debajo del campo, antes de escribir: el mínimo de Aegis.
aegis-principal-requisito = Mindestens 12 Zeichen. Ein Satz aus vier oder mehr Wörtern ist leicht zu merken und schwer zu erraten.
# Mientras se escribe, lo que falta o el nivel. $faltan: caracteres que faltan para llegar a 12.
aegis-principal-corta =
    { $faltan ->
        [one] Zu kurz: Es fehlt { $faltan } Zeichen.
       *[other] Zu kurz: Es fehlen { $faltan } Zeichen.
    }
aegis-principal-comun = Zu leicht zu erraten: Vermeide gängige Wörter und Passwörter.
aegis-principal-secuencia = Zu leicht zu erraten: Vermeide Folgen wie „1234“ oder „qwertz“.
aegis-principal-repetida = Zu leicht zu erraten: Es enthält zu viele Wiederholungen.
aegis-principal-variedad = Zu leicht zu erraten: Verwende mehr unterschiedliche Zeichen.
aegis-principal-aceptable = Stärke: ausreichend. Länger wäre besser.
aegis-principal-fuerte = Stärke: stark.
aegis-principal-muy-fuerte = Stärke: sehr stark.
aegis-principal-no-coinciden = Die Passwörter stimmen nicht überein.
aegis-principal-error-actual = Das aktuelle Passwort ist falsch. Gib es noch einmal ein.
aegis-principal-error = Das Hauptpasswort konnte nicht gespeichert werden. Versuche es erneut.
# Tarjeta de aviso: no se puede recuperar (restablecerla en Firefox borra las contraseñas guardadas).
aegis-principal-olvido-titulo = Wenn du es vergisst, lässt es sich nicht wiederherstellen
aegis-principal-olvido-texto = { -brand-short-name } speichert es nirgends, und niemand kann es dir schicken. Um neu anzufangen, müsstest du es zurücksetzen – dabei werden alle gespeicherten Passwörter gelöscht.
# La línea de honestidad: qué protege y qué no.
aegis-principal-limites = Es schützt deine Passwörter, wenn jemand dein Profil kopiert, ein anderes Konto auf diesem Computer nutzt oder die Festplatte mitnimmt. Es schützt sie nicht vor Schadsoftware, die deinen Computer bereits kontrolliert: Sie könnte aufzeichnen, was du tippst, auch dieses Passwort.
# Botones. «No guardar» y «Crear y guardar», antes de guardar; los demás, desde Ajustes, el panel o about:logins.
aegis-principal-no-guardar = Nicht speichern
aegis-principal-cancelar = Abbrechen
aegis-principal-crear-guardar = Erstellen und speichern
aegis-principal-crear = Passwort erstellen
aegis-principal-cambiar = Passwort ändern

## Códigos de verificación (autenticador/): panel de contraseñas, about:logins, el autorrelleno y el diálogo para
## añadirlos (dialogos/autenticador.xhtml). «Código de verificación» es el código de 6 u 8 cifras de la verificación
## en dos pasos (TOTP); «clave de configuración», el texto que da la web para configurarlo (glosario).

# Panel de contraseñas: título de la sección plegable.
aegis-codigos-titulo = Bestätigungscodes
aegis-codigos-vacio = Speichere hier den Code für die Zwei-Schritt-Verifizierung eines Kontos, und { -brand-short-name } zeigt dir seine Codes.
# Botón compacto del panel: abre el diálogo para añadir uno.
aegis-codigos-anadir = Code hinzufügen
# Botones de icono de cada fila del panel. $sitio: el dominio («github.com»).
aegis-codigos-ver =
    .title = Code für { $sitio } anzeigen
    .aria-label = Code für { $sitio } anzeigen
aegis-codigos-copiar =
    .title = Code für { $sitio } kopieren
    .aria-label = Code für { $sitio } kopieren
aegis-codigos-editar =
    .title = Code für { $sitio } ändern oder entfernen
    .aria-label = Code für { $sitio } ändern oder entfernen
# Junto al código a la vista: segundos que le quedan. Cabe en poco: «18 s».
aegis-codigos-restante = { $segundos } s
# Tras copiar. $segundos: tras cuántos segundos se borra (30 de serie).
aegis-codigos-copiado = Code kopiert. Er wird in { $segundos } s aus der Zwischenablage gelöscht, falls er noch dort ist.
aegis-codigos-copiado-sin-borrar = Code kopiert.
aegis-codigos-ilegible = Dieser Code kann nicht gelesen werden. Füge ihn erneut hinzu.
# Mensaje y título del diálogo de Windows Hello al ver o copiar un código.
aegis-codigos-autenticacion-ver = Um den Bestätigungscode anzuzeigen, gib deine Windows-Anmeldedaten ein. Das hilft, deine Konten zu schützen.
aegis-codigos-autenticacion-copiar = Um den Bestätigungscode zu kopieren, gib deine Windows-Anmeldedaten ein. Das hilft, deine Konten zu schützen.
aegis-codigos-autenticacion-titulo = { -brand-short-name }
# about:logins: la fila de la contraseña elegida y sus botones compactos.
aegis-codigos-etiqueta = Bestätigungscode
aegis-codigos-ninguno = Kein Bestätigungscode
aegis-codigos-boton-mostrar = Anzeigen
aegis-codigos-boton-ocultar = Ausblenden
aegis-codigos-boton-copiar = Kopieren
aegis-codigos-boton-cambiar = Ändern
aegis-codigos-boton-anadir = Hinzufügen
# Autorrelleno: el panelito junto al campo del código en la web. $sitio: el dominio.
aegis-codigos-ofrecer-titulo = Bestätigungscode
aegis-codigos-ofrecer-texto = { -brand-short-name } hat den Code für { $sitio }.
aegis-codigos-rellenar = Code eintragen
# Con varias cuentas en el sitio. $cuenta: el usuario (o un número).
aegis-codigos-rellenar-cuenta = Code für { $cuenta } eintragen
# Panel de contraseñas (solo Windows): sección «Passkeys». No prometer sincronización.
aegis-passkeys-titulo = Passkeys
aegis-passkeys-texto = Passkeys, die du auf einer Website erstellst, werden in Windows Hello auf diesem Computer gespeichert. Hat er einen Sicherheitschip (TPM), verlässt der private Schlüssel ihn nie; sonst schützt Windows ihn per Software. { -brand-short-name } kann ihn weder sehen noch kopieren. Passkeys in Windows Hello werden nicht mit anderen Computern synchronisiert; wählst du im Windows-Hinweis einen anderen Passkey-Anbieter, werden sie dort gespeichert, wo dieser es vorgibt.
# Abre la Configuración de Windows › Cuentas › Claves de acceso.
aegis-passkeys-gestionar = In Windows verwalten
# Diálogo para añadir, cambiar o quitar un código de verificación.
aegis-autenticador-ventana = Bestätigungscode
aegis-autenticador-titulo = Bestätigungscode hinzufügen
aegis-autenticador-titulo-editar = Bestätigungscode
aegis-autenticador-explicacion = Wenn eine Website dich bittet, eine Authenticator-App einzurichten, lies hier ihren QR-Code ein oder kopiere ihren Einrichtungsschlüssel. { -brand-short-name } erzeugt die Codes auf diesem Computer.
aegis-autenticador-cuenta = Konto
# Primera opción del desplegable de cuentas.
aegis-autenticador-elige = Gespeichertes Konto auswählen
aegis-autenticador-sin-cuentas = Speichere zuerst das Passwort dieses Kontos in { -brand-short-name }.
aegis-autenticador-existe = Dieses Konto hat bereits einen Bestätigungscode. Ein neuer Schlüssel ersetzt ihn.
aegis-autenticador-clave = Einrichtungsschlüssel oder otpauth://-Link
# Botón del ojo dentro del campo de la clave.
aegis-autenticador-mostrar =
    .title = Schlüssel anzeigen
    .aria-label = Schlüssel anzeigen
# Botones compactos para leer el código QR (en el equipo, sin red).
aegis-autenticador-qr-pagina = QR-Code dieser Seite lesen
aegis-autenticador-qr-imagen = QR-Code aus einem Bild lesen…
# Título del selector de archivos.
aegis-autenticador-qr-imagen-titulo = Bild mit dem QR-Code auswählen
aegis-autenticador-qr-no = Kein QR-Code gefunden. Sorge dafür, dass der ganze Code sichtbar ist, und versuche es erneut.
aegis-autenticador-qr-otro = Dieser QR-Code gehört zu keiner Authenticator-App.
# La clave es válida. $emisor: quien la da; $digitos: 6–8; $periodo: segundos (30).
aegis-autenticador-valida = { $emisor }: { $digitos } Ziffern alle { $periodo } s.
aegis-autenticador-valida-sin-emisor = Gültiger Schlüssel: { $digitos } Ziffern alle { $periodo } s.
aegis-autenticador-error-formato = Das ist kein gültiger Schlüssel. Kopiere den ganzen Einrichtungsschlüssel oder otpauth://-Link.
aegis-autenticador-error-hotp = Zählerbasierte Codes (HOTP) werden nicht unterstützt, nur zeitbasierte (TOTP).
aegis-autenticador-error-corta = Der Schlüssel ist zu kurz, um sicher zu sein.
aegis-autenticador-error-parametros = Dieser Code verwendet ein nicht unterstütztes Format (ungewöhnliche Ziffern oder Dauer).
aegis-autenticador-error-guardar = Der Code konnte nicht gespeichert werden. Versuche es erneut.
# La tarjeta de honestidad: los dos pasos juntos en la bóveda.
aegis-autenticador-honestidad-titulo = Beide Schritte an einem Ort
aegis-autenticador-honestidad = Wenn du den Code neben dem Passwort speicherst, liegen beide Schritte in { -brand-short-name }: Wer deine gespeicherten Passwörter entsperrt, hätte beide. Geschützt werden sie durch dein Hauptpasswort und die Identitätsprüfung beim Anzeigen oder Kopieren eines Codes. Für deine wichtigsten Konten ist eine Authenticator-App auf einem anderen Gerät sicherer.
# Quitar pide dos pulsaciones: la segunda con «-confirmar» y el aviso.
aegis-autenticador-quitar = Code entfernen
aegis-autenticador-quitar-confirmar = Endgültig entfernen
aegis-autenticador-quitar-aviso = Stelle vor dem Entfernen sicher, dass du dich auch anders anmelden kannst (zum Beispiel mit den Wiederherstellungscodes der Website).
aegis-autenticador-cancelar = Abbrechen
aegis-autenticador-guardar = Speichern

## Énfasis de color (Ajustes › Apariencia y «Personalizar» de la nueva pestaña)

aegis-enfasis-titulo = Akzentfarbe
aegis-enfasis-descripcion = Die Farbe von Auswahl, Fokus, Schaltern, der Kante des aktiven Tabs und dem Verlauf des Fensterrahmens.
aegis-enfasis-automatico = „Windows-Farbe“ und „Desktop-Hintergrund“ ändern sich von selbst, wenn du sie in Windows änderst. Der Hintergrund wird auf diesem Computer gelesen und verlässt ihn nicht.
aegis-enfasis-monocromo = Monochrom
aegis-enfasis-windows = Windows-Farbe
aegis-enfasis-fondo = Desktop-Hintergrund
aegis-enfasis-hielo = Eis
aegis-enfasis-pizarra = Schiefer
aegis-enfasis-salvia = Salbei
aegis-enfasis-ambar = Bernstein
aegis-enfasis-coral = Koralle
aegis-enfasis-lavanda = Lavendel
aegis-enfasis-malva = Malve
aegis-enfasis-cobalto = Kobalt
aegis-enfasis-piedra = Stein
aegis-enfasis-laguna = Lagune
aegis-enfasis-musgo = Moos
aegis-enfasis-frambuesa = Himbeere
aegis-enfasis-ciruela = Pflaume

## Énfasis personalizado: el «+» de los selectores y su ventana («Crear» y «Mis énfasis»)

# Nombre de la opción del «+» en Ajustes y principio de sus etiquetas.
aegis-enfasis-propio = Eigene
# Etiqueta (y descripción emergente) del «+» sin ningún personalizado en uso.
aegis-enfasis-propio-abrir = Eigene: erstellen oder eine gespeicherte wählen
# El «+» con un personalizado en uso. $nombre: su nombre o sus códigos (p. ej. #88C0DC)
aegis-enfasis-propio-abrir-activo = Eigene: { $nombre }
# Línea del elegido, bajo las muestras de la nueva pestaña. $nombre: su nombre o sus códigos
aegis-enfasis-propio-actual = Eigene: { $nombre }
aegis-enfasis-propio-titulo = Eigene Akzentfarbe
aegis-enfasis-propio-cerrar = Schließen
# Las dos pestañas de la ventana.
aegis-enfasis-propio-crear = Erstellen
aegis-enfasis-propio-mis = Meine Farben
aegis-enfasis-propio-degradado = Verlauf
aegis-enfasis-propio-degradado-ayuda = Eine zweite Farbe für den Fensterrahmen und die Kante des aktiven Tabs. Alles andere nutzt die erste.
# Para lectores de pantalla: los dos segmentos que eligen qué color se edita.
aegis-enfasis-propio-editando = Farbe, die du bearbeitest
aegis-enfasis-propio-color-1 = Erste Farbe
aegis-enfasis-propio-color-2 = Zweite Farbe
# El cuadro de color, para lectores de pantalla. $saturacion y $brillo: de 0 a 100
aegis-enfasis-propio-area = Sättigung und Helligkeit
aegis-enfasis-propio-area-valor = Sättigung { $saturacion } %, Helligkeit { $brillo } %
aegis-enfasis-propio-tono = Farbton
# Campo del color en hexadecimal (#RRGGBB).
aegis-enfasis-propio-hex = Code
aegis-enfasis-propio-hex-error = Gib eine Hex-Farbe ein, etwa #88C0DC.
aegis-enfasis-propio-nombre = Name
aegis-enfasis-propio-nombre-ejemplo = Optional
aegis-enfasis-propio-vista = Vorschau
aegis-enfasis-propio-ajuste = { -brand-short-name } passt Helligkeit und Intensität an, damit alles hell wie dunkel gut lesbar bleibt.
aegis-enfasis-propio-guardar = Speichern
aegis-enfasis-propio-usar = Verwenden
aegis-enfasis-propio-guardado = In „Meine Farben“ gespeichert.
aegis-enfasis-propio-actualizado = Schon in „Meine Farben“.
# $maximo: cuántos se pueden guardar (24)
aegis-enfasis-propio-lleno = Du hast schon { $maximo } gespeichert. Lösche eine in „Meine Farben“, um eine weitere zu speichern.
# $cuantos: los guardados; $maximo: el límite (24)
aegis-enfasis-propio-cuenta = { $cuantos } von { $maximo }
# Supr (Delete): la tecla que borra el guardado con el foco.
aegis-enfasis-propio-mis-ayuda = Wähle eine, um sie zu verwenden. Entf löscht sie.
aegis-enfasis-propio-sin-nombre = Ohne Namen
aegis-enfasis-propio-editar = Bearbeiten
aegis-enfasis-propio-borrar = Löschen
# $nombre: el nombre del guardado (o el texto de «sin nombre»)
aegis-enfasis-propio-borrar-pregunta = „{ $nombre }“ löschen? Das lässt sich nicht rückgängig machen.
aegis-enfasis-propio-borrar-confirmar = Löschen
aegis-enfasis-propio-cancelar = Abbrechen
aegis-enfasis-propio-borrado = „{ $nombre }“ wurde gelöscht.
aegis-enfasis-propio-vacio-titulo = Noch nichts gespeichert
# Estado vacío de «Mis énfasis». $maximo: cuántos se pueden guardar (24)
aegis-enfasis-propio-vacio = Erstelle eine Akzentfarbe und wähle „Speichern“: Sie erscheint dann hier und lässt sich mit einem Klick verwenden. Bis zu { $maximo }.
aegis-enfasis-propio-ir-crear = Eine erstellen

## Nueva pestaña › Personalizar: fondo, diseño (buscador, accesos y espaciado)

aegis-np-fondo-titulo = Hintergrund
aegis-np-fondo-liso = Einfarbig
aegis-np-fondo-degradado = Verlauf
aegis-np-fondo-enfasis = Akzent
aegis-np-fondo-imagen = Bild
aegis-np-imagen-cambiar = Bild ändern …
aegis-np-imagen-error = Dieses Bild konnte nicht verwendet werden. Versuche ein anderes JPG, PNG, WebP, AVIF oder GIF unter 20 MB.
aegis-np-diseno-titulo = Layout
aegis-np-buscador = Suche anzeigen
aegis-np-posicion = Position der Suche
aegis-np-posicion-centro = In der Mitte
aegis-np-posicion-arriba = Weiter oben
aegis-np-accesos = Verknüpfungen
aegis-np-accesos-arriba = Über der Suche
aegis-np-accesos-abajo = Unter der Suche
aegis-np-espaciado = Abstand
# $px: número de píxeles
aegis-np-espaciado-valor = { $px } px
aegis-np-ancho = Breite der Suchleiste

## Suchmaschinen-Menü der Adressleiste (die Lupe)

# Zeile, die erscheint, wenn die für diese Suche gewählte Suchmaschine nicht die Standardsuchmaschine ist. $buscador: Name der Suchmaschine, z. B. Google
aegis-buscador-predeterminado = { $buscador } als Standard verwenden

## Neuer Tab › Verknüpfung hinzufügen oder bearbeiten: das Logo der Website als Bild der Verknüpfung

# Link neben „Eigenes Bild verwenden“. Sucht das Symbol der Website (zuerst auf dem Gerät, dann auf der Website) und setzt es als eigenes Bild.
aegis-logo-usar = Logo der Website verwenden
aegis-logo-buscando = Logo wird gesucht …
aegis-logo-sin-direccion = Gib zuerst die Adresse der Verknüpfung ein.
aegis-logo-error = Das Logo dieser Website konnte nicht verwendet werden. Versuche es mit einem eigenen Bild.
aegis-logo-error-red = Das Logo konnte nicht von der Website geladen werden. Prüfe die Adresse oder versuche es später erneut.

## Webs en oscuro (Ajustes › Apariencia y fila «Oscurecer este sitio» del panel de Escudos)

aegis-webs-oscuro-titulo = Dunkle Websites
aegis-webs-oscuro-descripcion = Websites passen sich dem dunklen Theme von { -brand-short-name } an. Nur wenn { -brand-short-name } dunkel ist; Bilder und Videos bleiben unverändert.
aegis-webs-oscuro-aviso = Eine Website kann bemerken, dass ihr Aussehen verändert wurde.
aegis-webs-oscuro-apagado = Aus
aegis-webs-oscuro-todas = Alle Websites
aegis-webs-oscuro-sin-modo-oscuro = Nur ohne eigenen Dunkelmodus
aegis-escudos-oscuro = Diese Website abdunkeln
aegis-escudos-oscuro-activo = Passt sich dem dunklen Theme an
aegis-escudos-oscuro-propio = Diese Website hat schon einen Dunkelmodus
aegis-escudos-oscuro-claro = Nur wenn { -brand-short-name } dunkel ist
aegis-escudos-oscuro-excepcion = Wird auf dieser Website nicht abgedunkelt

## Fingerprinting (Einstellungen › Datenschutz, Schilde-Panel und Hinweis des Tresors)

aegis-huella-titulo = Fingerprinting
aegis-huella-descripcion = Was Websites über deinen Browser auslesen können, um dich ohne Cookies wiederzuerkennen: Bildschirm, Schriftarten, Grafikkarte, Zeitzone und mehr.
aegis-huella-nivel-basica = Einfach
aegis-huella-nivel-basica-descripcion = Nur der im Browser eingebaute Schutz.
aegis-huella-nivel-equilibrada = Ausgewogen
aegis-huella-nivel-equilibrada-descripcion = Verbirgt alles, was geht, ohne Websites zu stören. Empfohlen.
aegis-huella-nivel-estricta = Streng
aegis-huella-nivel-estricta-descripcion = Verbirgt auch Fensterposition, Schriftarten, Stimmen und die Fähigkeiten der Grafikkarte. Manche Websites funktionieren eventuell nicht richtig.
aegis-huella-nivel-caja-fuerte = Tresor
aegis-huella-nivel-caja-fuerte-descripcion = Verbirgt fast alles, was der Schutz verbergen kann (nicht dein dunkles oder helles Theme und nicht die Bildschirmgröße): Websites sehen UTC-Zeit, Englisch und 60 fps, sehen deine Einstellungen zur Barrierefreiheit nicht, und der hohe Kontrast gilt für sie nicht mehr. Um ein Canvas auszulesen, müssen sie dich um Erlaubnis bitten, und du kannst einer Website erlauben, die Browserdaten zu sehen. Viele Websites funktionieren dann nicht.
aegis-huella-nota = Kein Schutz ist perfekt: Websites sehen weiterhin deine IP-Adresse, und { -brand-short-name } ist kein Tor Browser.
aegis-huella-permitidos-titulo = Websites mit Erlaubnis im Tresor
aegis-huella-permitidos-vacio = Keine Website hat eine Erlaubnis.
# $sitio: Domain der Website, z. B. beispiel.de
aegis-huella-quitar = Entfernen
    .aria-label = { $sitio } entfernen
aegis-huella-apagada = Im Schutz vor Aktivitätenverfolgung deaktiviert
aegis-huella-permitir-sitio = Auf dieser Website erlauben
aegis-huella-permiso-no = Browserdaten: blockiert
aegis-huella-permiso-si = Browserdaten: ausgewogener Schutz
aegis-huella-permiso-privada = Nur in einem normalen Fenster
aegis-huella-permiso-no-disponible = Für diese Adresse nicht verfügbar
# <> wird durch den Namen der Website ersetzt (fett). Unverändert lassen.
aegis-huella-aviso = <> hat versucht, Daten deines Browsers auszulesen. Der Tresor hat sie verborgen.
aegis-huella-aviso-permitir =
    .label = Auf dieser Website erlauben
    .accesskey = E
aegis-huella-aviso-bloquear =
    .label = Weiter blockieren
    .accesskey = W

## Tor: „Neues privates Fenster mit Tor“ (☰-Menü, Umschalt+Alt+N), Einstellungen › Datenschutz › Tor, die Anzeige in
## der Leiste und about:privatebrowsing in der Tor-Instanz. „Tor“ und „Tor Browser“ sind Namen eines anderen Projekts.

aegis-tor-titulo = Tor
aegis-tor-descripcion = Öffne private Fenster, die über das Tor-Netzwerk laufen: Websites sehen deine IP nicht. Es ist ein eigenes { -brand-short-name } mit eigenem Profil, das beim Schließen gelöscht wird, und es teilt nichts mit deinen anderen Fenstern.
aegis-tor-honestidad = { -brand-short-name } mit Tor ist nicht Tor Browser: { -brand-short-name } lässt sich leichter unterscheiden als Tor Browser, der für alle wie derselbe Browser aussieht. Für starke Anonymität nutze Tor Browser. Was du außerhalb des Browsers öffnest (einen Download in einer anderen App, einen E-Mail-Link), läuft nicht über Tor.
aegis-tor-no-descargado = Tor ist nicht heruntergeladen
# $tamano: Megabyte, z. B. 21,5; $origen: Server, z. B. dist.torproject.org
aegis-tor-origen = { $tamano } MB vom Tor Project ({ $origen }). Der sha256-Fingerabdruck wird vor der Installation geprüft.
# $progreso: Prozent
aegis-tor-descargando = Wird heruntergeladen … { $progreso } %
aegis-tor-comprobando = Paket wird geprüft …
# $progreso: Prozent
aegis-tor-extrayendo = Wird installiert … { $progreso } %
# $tor: tor-Version; $version: Paketversion
aegis-tor-listo = Tor { $tor } heruntergeladen (Paket { $version })
aegis-tor-desactualizado = Eine neue Tor-Version ist verfügbar (Paket { $version })
aegis-tor-boton-descargar = Tor herunterladen
aegis-tor-boton-actualizar = Aktualisieren
aegis-tor-boton-cancelar = Abbrechen
aegis-tor-boton-borrar = Löschen
aegis-tor-borrar-abierta = Schließe die Tor-Fenster, um es zu löschen.
aegis-tor-abrir-titulo = Neues privates Fenster mit Tor
aegis-tor-abrir-detalle = Auch über das Menü oder mit Umschalt+Alt+N.
aegis-tor-boton-abrir = Öffnen
aegis-tor-puentes-titulo = Brücken
aegis-tor-puentes-descripcion = Für Netzwerke, die Tor blockieren. Gilt ab dem nächsten Fenster mit Tor.
aegis-tor-puentes-ninguno = Keine Brücken
aegis-tor-puentes-obfs4 = obfs4
aegis-tor-puentes-snowflake = Snowflake
aegis-tor-nota-huella = Das Tor-Fenster nutzt den Tresor: Tor verbirgt deine IP, aber was der Browser über sich verrät, hängt von { -brand-short-name } ab.
aegis-tor-nota-buscadores = Manche Suchmaschinen wie Google verlangen Captchas oder blockieren Verbindungen über Tor. DuckDuckGo funktioniert.
aegis-tor-instancia-texto = Dies ist ein privates Fenster mit Tor: Der gesamte Verkehr läuft über Tor, und beim Schließen wird nichts gespeichert.
aegis-tor-boton-identidad = Neue Identität
aegis-tor-error-descarga = Tor konnte nicht heruntergeladen werden. Prüfe die Verbindung und versuche es erneut.
aegis-tor-error-suma = Der Download ist nicht das erwartete Paket (der sha256-Fingerabdruck stimmt nicht) und wurde verworfen. Versuche es später erneut.
aegis-tor-error-sin-descargar = Tor ist nicht heruntergeladen: Lade es unter Einstellungen › Datenschutz herunter.
aegis-tor-error-arranque = Tor konnte nicht starten. Wenn Windows es blockiert hat, erlaube es und öffne ein neues Fenster mit Tor.
aegis-tor-error-caido = Tor wurde beendet. Schließe dieses Fenster und öffne ein neues mit Tor.
aegis-tor-aviso-red = Tor hat Probleme beim Verbinden. Wenn dein Netzwerk Tor blockiert, versuche es mit Brücken.
aegis-tor-red-arrancando = Tor: wird gestartet …
# $progreso: Prozent
aegis-tor-red-conectando = Tor: verbindet … { $progreso } %
aegis-tor-red-conectado = Tor: verbunden
aegis-tor-red-error = Tor: keine Verbindung.
aegis-tor-red-parado = Tor: gestoppt.
aegis-tor-privada-nota = Websites sehen eine IP aus dem Tor-Netzwerk, nicht deine. { -brand-short-name } mit Tor ist nicht Tor Browser.
aegis-tor-menu-ventana =
    .label = Neues privates Fenster mit Tor
aegis-tor-menu-identidad =
    .label = Neue Tor-Identität
aegis-tor-menu-ajustes =
    .label = Tor-Einstellungen
aegis-tor-ofrecer-titulo = Tor herunterladen
# $tamano: Megabyte, z. B. 21,5
aegis-tor-ofrecer-texto = Für ein privates Fenster mit Tor wird Tor benötigt, das nicht mit { -brand-short-name } kommt. Es werden { $tamano } MB vom Tor Project (dist.torproject.org) heruntergeladen und der Fingerabdruck wird geprüft, bevor es in deinem Profil installiert wird.
aegis-tor-ofrecer-botones =
    .descargar = Herunterladen
aegis-tor-identidad-confirmar = Alle Tor-Fenster werden geschlossen, alles aus dieser Sitzung wird gelöscht und Tor verwendet neue Verbindungen.
    .title = Neue Identität
    .aceptar = Neue Identität

## Google (Ajustes › Privacidad; google.sys.mjs). «Google» y «YouTube» son nombres propios: no se traducen.

aegis-google-titulo = Google
aegis-google-descripcion = Der Tracking-Schutz greift auf Websites von Google und YouTube nicht. Dort blockiert { -brand-short-name } ihre Nutzungsdaten und Werbung, und Links in den Ergebnissen führen direkt zur Website.
# Mismo nombre que la sección «Google limpio» de about:escudos (escudos-ayuda-google-titulo).
aegis-google-limpio = Sauberes Google
aegis-google-limpio-detalle = Google sieht weiterhin deine IP, deine Suchen und, wenn du angemeldet bist, wer du bist.
# Pide a Google la vista «Web» (udm=14). Solo actúa con «Google limpio» encendido.
aegis-google-solo-web = Nur Webergebnisse in Google
aegis-google-solo-web-detalle = Für Suchen aus der Adressleiste, ohne KI-Antworten oder Zusatzmodule.

## Links zu „So funktionieren die Schilde“ (about:escudos)

# Pie del panel de Escudos: abre la página de ayuda en una pestaña.
aegis-escudos-ayuda = So funktionieren die Schilde
# Ajustes: enlace junto a cada opción de Escudos y de huella; abre la ayuda en su sección.
aegis-ayuda-rastreo = Weitere Informationen
    .aria-label = Weitere Informationen zum Tracking-Schutz
aegis-ayuda-cookies = Weitere Informationen
    .aria-label = Weitere Informationen zu Drittanbieter-Cookies
aegis-ayuda-https = Weitere Informationen
    .aria-label = Weitere Informationen zum Nur-HTTPS-Modus
aegis-ayuda-olvidar = Weitere Informationen
    .aria-label = Weitere Informationen zum Vergessen von Websites beim Schließen
aegis-ayuda-huella = Weitere Informationen
    .aria-label = Weitere Informationen zum Fingerprinting
aegis-ayuda-google = Weitere Informationen
    .aria-label = Weitere Informationen zu „Sauberes Google“

## Escudos: molestias, excepciones por sitio y Ajustes › Escudos (escudos.sys.mjs, escudos/ajustes.sys.mjs)

aegis-escudos-molestia-activa = Auf allen Websites ausgeblendet
aegis-escudos-molestia-apagada = Auf allen Websites aus
aegis-escudos-molestia-permitida-sitio = Auf dieser Website erlaubt

aegis-escudos-excepciones-sitio = Ausnahmen für diese Website …
aegis-escudos-excepciones-ninguna = Keine

aegis-escudos-grupo-anuncios = Werbung
aegis-escudos-grupo-rastreadores = Tracker
aegis-escudos-grupo-cookies-avisos = Cookie-Hinweise
aegis-escudos-grupo-molestias = Pop-ups und Banner
aegis-escudos-grupo-antiadblock = Anti-Adblock-Hinweise
aegis-escudos-grupo-cosmetico = Ausgeblendete Elemente
aegis-escudos-grupo-scriptlets = Skripte der Listen

aegis-ajustes-escudos = Schilde
aegis-ajustes-escudos-descripcion = Was die Schilde auf allen Websites blockieren, und die Ausnahmen für einzelne Websites.

aegis-ajustes-escudos-nivel-titulo = Stufe
aegis-ajustes-escudos-nivel-descripcion = Wie viel die Schilde auf allen Websites blockieren. Dieselbe Einstellung wie im Panel.
aegis-ajustes-escudos-nivel-normal = Normal
aegis-ajustes-escudos-nivel-normal-descripcion = Blockiert bekannte Tracker und Werbung aus den Filterlisten. Kaum eine Website geht dabei kaputt.
aegis-ajustes-escudos-nivel-estricto = Streng
aegis-ajustes-escudos-nivel-estricto-descripcion = Blockiert außerdem Videos, Kommentare und Social-Media-Buttons, die dich verfolgen, und entfernt Tracking-Daten aus Links. Manche Websites wirken unvollständig.
aegis-ajustes-escudos-nivel-estricto-mas = Streng+ (empfohlen)
aegis-ajustes-escudos-nivel-estricto-mas-descripcion = Alles aus Streng und eine umfangreichere Tracking-Liste (AdGuard Tracking Protection). Braucht etwas mehr Speicher.
aegis-ajustes-escudos-nivel-personalizado = Du hast den Tracking-Schutz unter Datenschutz von Hand geändert, deshalb passt keine Stufe. Wähle eine, um zurückzukehren.
aegis-ajustes-escudos-nivel-nota = Keine Stufe macht das Blockieren unsichtbar: Eine Website kann merken, dass ihre Werbung fehlt.

aegis-ajustes-escudos-molestias-titulo = Belästigungen
aegis-ajustes-escudos-molestias-descripcion = Werden auf allen Websites ausgeblendet. Um sie auf einer bestimmten Website zu sehen, füge sie unter „Ausnahmen pro Website“ hinzu.
aegis-ajustes-escudos-molestia-cookies-detalle = Einwilligungsbanner. Ausblenden heißt nicht immer ablehnen: Die Website entscheidet ohne deine Antwort, was sie tut.
aegis-ajustes-escudos-molestia-ventanas-detalle = Pop-ups, Banner zum Installieren von Apps, Widgets und andere Belästigungen.
aegis-ajustes-escudos-molestia-antiadblock-detalle = Hinweise, die dich bitten, den Blocker abzuschalten. Klappt nicht auf jeder Website.
aegis-ajustes-escudos-molestias-nota = Jede Gruppe nutzt Listen ihrer Autoren (uBlock Origin, AdGuard und EasyList). Nach einer Änderung brauchen die Schilde ein paar Sekunden, um sie vorzubereiten.

aegis-ajustes-escudos-contador-titulo = Zähler
aegis-ajustes-escudos-contador-descripcion = Was die Zahl auf dem Schilde-Button und im Panel zählt.
aegis-ajustes-escudos-contador-peticiones = Anfragen
aegis-ajustes-escudos-contador-origenes = Ursprünge
aegis-ajustes-escudos-contador-peticiones-detalle = Jede blockierte Anfrage zählt einmal, auch wenn sie an denselben Server geht.
aegis-ajustes-escudos-contador-origenes-detalle = Jeder blockierte Server zählt nur einmal pro Seite, egal wie oft er es versucht.

aegis-ajustes-escudos-listas-titulo = Filterlisten
aegis-ajustes-escudos-listas-descripcion = Die Regeln stammen von ihren Autoren (uBlock Origin, EasyList, AdGuard und Brave). { -brand-short-name } lädt sie direkt bei ihnen herunter, ohne Cookies.
aegis-ajustes-escudos-listas-activas = { $listas ->
        [one] 1 aktive Liste
       *[other] { $listas } aktive Listen
    }
aegis-ajustes-escudos-ultima = Zuletzt aktualisiert: { $fecha }
aegis-ajustes-escudos-actualizar-ahora = Jetzt aktualisieren
aegis-ajustes-escudos-actualizando = Wird aktualisiert …
aegis-ajustes-escudos-resultado-nuevas = Listen aktualisiert
aegis-ajustes-escudos-resultado-iguales = Bereits aktuell
aegis-ajustes-escudos-resultado-fallos = { $listas ->
        [one] Eine Liste konnte nicht heruntergeladen werden, die vorherige Version bleibt
       *[other] { $listas } Listen konnten nicht heruntergeladen werden, die vorherigen Versionen bleiben
    }
aegis-ajustes-escudos-resultado-sin-permiso = Zum Herunterladen fehlt die Berechtigung unter Verbindungen
aegis-ajustes-escudos-resultado-error = Aktualisierung nicht möglich. Versuche es später noch einmal
aegis-ajustes-escudos-automatica = Listen automatisch aktualisieren
aegis-ajustes-escudos-automatica-detalle = Eine Prüfung pro Tag; jede Liste wird erst abgerufen, wenn sie abläuft.
aegis-ajustes-escudos-automatica-sin-permiso = Braucht die Berechtigung „Schutzlisten“ unter Verbindungen.
aegis-ajustes-escudos-sin-conexiones = Bis dahin nutzen die Schilde die Listen, die mit { -brand-short-name } kommen.
aegis-ajustes-escudos-elegir-conexiones = Verbindungen wählen

aegis-ajustes-escudos-intervalo = Höchstalter jeder Liste
aegis-ajustes-escudos-intervalo-detalle = Früher, wenn ihr Autor es verlangt: Manche Listen laufen nach wenigen Stunden ab.
aegis-ajustes-escudos-dias = { $dias ->
        [one] 1 Tag
       *[other] { $dias } Tage
    }
aegis-ajustes-escudos-ver-listas = Listen anzeigen ({ $listas })
aegis-ajustes-escudos-ocultar-listas = Listen ausblenden

aegis-ajustes-escudos-origen-red = heruntergeladen
aegis-ajustes-escudos-origen-build = in { -brand-short-name } enthalten

aegis-ajustes-escudos-excepciones-titulo = Ausnahmen pro Website
aegis-ajustes-escudos-excepciones-descripcion = Websites, auf denen die Schilde etwas durchlassen. „Alles erlauben“ ist dasselbe, wie die Schilde im Panel zu deaktivieren.
aegis-ajustes-escudos-excepciones-descripcion-privada = In einem privaten Fenster gelten Ausnahmen, bis du das letzte private Fenster schließt. „Alles erlauben“ ist dasselbe, wie die Schilde im Panel zu deaktivieren.
aegis-ajustes-escudos-anadir-titulo = Website hinzufügen

aegis-ajustes-escudos-anadir-ejemplo = beispiel.de
aegis-ajustes-escudos-anadir = Hinzufügen
aegis-ajustes-escudos-anadir-error = Gib die Adresse einer Website ein, z. B. beispiel.de.
aegis-ajustes-escudos-excepciones-vacio = Keine Website hat Ausnahmen.
aegis-ajustes-escudos-sitio-todo = Alles erlaubt: Schilde deaktiviert
aegis-ajustes-escudos-sitio-nada = Noch nichts erlaubt
aegis-ajustes-escudos-editar = Bearbeiten
    .aria-label = Ausnahmen für { $sitio } bearbeiten
aegis-ajustes-escudos-cerrar = Schließen
    .aria-label = Ausnahmen für { $sitio } schließen
aegis-ajustes-escudos-quitar = Entfernen
    .aria-label = Alle Ausnahmen für { $sitio } entfernen
aegis-ajustes-escudos-permitir-todo = Auf dieser Website alles erlauben
aegis-ajustes-escudos-permitir-todo-detalle = Deaktiviert die Schilde: Nichts wird blockiert. Das ist der große Schalter im Panel.
aegis-ajustes-escudos-que-permitir = Oder wähle, was erlaubt ist

aegis-ajustes-escudos-por-ajuste-general = Durch eine allgemeine Einstellung erlaubt: Für alle Websites aus.
aegis-ajustes-escudos-por-permitir-todo = Erlaubt: Diese Website hat „Alles erlauben“.
aegis-ajustes-escudos-grupo-anuncios-detalle = Anfragen an Werbeserver aus den Filterlisten.
aegis-ajustes-escudos-grupo-rastreadores-detalle = Die aus den Filterlisten. Der Tracking-Schutz des Browsers bleibt aktiv; um auch ihn abzuschalten, nutze „Alles erlauben“.
aegis-ajustes-escudos-grupo-cookies-avisos-detalle = Cookie-Einwilligungsbanner.
aegis-ajustes-escudos-grupo-molestias-detalle = Pop-ups, App-Banner und Widgets.
aegis-ajustes-escudos-grupo-antiadblock-detalle = Hinweise, die dich bitten, den Blocker abzuschalten.
aegis-ajustes-escudos-grupo-cosmetico-detalle = Werbeflächen und andere Elemente, die die Listen auf der Seite ausblenden.
aegis-ajustes-escudos-grupo-scriptlets-detalle = Kleine Skripte der Listen, die Werbung und Erkennungsskripte auf der Seite ausschalten.

aegis-ayuda-nivel = Weitere Informationen
    .aria-label = Weitere Informationen zu den Stufen der Schilde
aegis-ayuda-molestias = Weitere Informationen
    .aria-label = Weitere Informationen zu Belästigungen
aegis-ayuda-contador = Weitere Informationen
    .aria-label = Weitere Informationen zum Zähler
aegis-ayuda-listas = Weitere Informationen
    .aria-label = Weitere Informationen zu den Filterlisten
aegis-ayuda-excepciones = Weitere Informationen
    .aria-label = Weitere Informationen zu den Ausnahmen pro Website

## Importar de otros navegadores (migracion/). Nombres de los navegadores de origen en el asistente de importar
## (marcas: no se traducen) y la página de las contraseñas: cómo sacar un CSV de cada uno. Solo los ids que empiezan
## por «aegis-migracion-navegador-firefox» pueden nombrar ese navegador (tools/verificar.py).

aegis-migracion-navegador-firefox = Firefox
aegis-migracion-navegador-aegis = { -brand-short-name }

aegis-migracion-navegador-firefox-csv-titulo = So importierst du Passwörter aus Firefox
aegis-migracion-navegador-firefox-csv-en = In Firefox:
aegis-migracion-navegador-firefox-csv-paso1 = Gib about:logins in die Adressleiste ein und drücke die Eingabetaste.
aegis-migracion-navegador-firefox-csv-paso2 = Öffne oben rechts das Menü (…) und wähle „Passwörter exportieren…“.
aegis-migracion-navegador-firefox-csv-paso3 = Bestätige und speichere die Datei auf deinem Gerät.
aegis-migracion-csv-brave-titulo = So importierst du Passwörter aus Brave
aegis-migracion-csv-brave-en = In Brave:
aegis-migracion-csv-brave-paso1 = Gib brave://password-manager/settings in die Adressleiste ein und drücke die Eingabetaste.
aegis-migracion-csv-brave-paso2 = Klicke unter „Passwörter exportieren“ auf „Datei herunterladen“.
aegis-migracion-csv-brave-paso3 = Speichere die Datei auf deinem Gerät.
aegis-migracion-csv-edge-titulo = So importierst du Passwörter aus Microsoft Edge
aegis-migracion-csv-edge-en = In Microsoft Edge:
aegis-migracion-csv-edge-paso1 = Gib edge://settings/passwords in die Adressleiste ein und drücke die Eingabetaste.
aegis-migracion-csv-edge-paso2 = Öffne „Weitere Aktionen“ (…) neben den gespeicherten Passwörtern und wähle „Passwörter exportieren“.
aegis-migracion-csv-edge-paso3 = Bestätige mit der PIN oder dem Passwort von Windows und speichere die Datei auf deinem Gerät.
# Último paso, común: vuelve al asistente y elige el CSV con su botón (el de Firefox, «Seleccionar archivo»).
aegis-migracion-csv-final = Komm hierher zurück und wähle die Datei aus, um den Import abzuschließen. Sie enthält deine Passwörter unverschlüsselt: Lösche sie, sobald du fertig bist.

# Otro Aegis (otro perfil o el de otro equipo): no exporta en claro; las contraseñas pasan con el código de
# transferencia (contrasenas/transferencia/). El botón «Seleccionar archivo» de la página (el de Firefox) elige el
# archivo y luego se pide el código. «-final-ajustes»: cuando el asistente no puede abrir el diálogo (dentro de la
# bienvenida), remite a Ajustes. Los nombres de Ajustes y de los botones, como salen en la interfaz.
aegis-migracion-aegis-contrasenas-titulo = So überträgst du Passwörter aus einem anderen { -brand-short-name }
aegis-migracion-aegis-contrasenas-en = Im anderen { -brand-short-name } (auf diesem oder einem anderen Computer):
aegis-migracion-aegis-contrasenas-paso1 = Öffne Einstellungen › Passwörter und klicke unter „An ein anderes { -brand-short-name } übertragen“ auf „Datei erstellen…“.
aegis-migracion-aegis-contrasenas-paso2 = Speichere die Datei und notiere den Code aus 6 Wörtern, der angezeigt wird.
aegis-migracion-aegis-contrasenas-paso3 = Wenn es ein anderer Computer ist, bring die Datei hierher (auf einem USB-Stick oder in deiner Cloud).
aegis-migracion-aegis-contrasenas-final = Komm hierher zurück, wähle die Datei aus und gib den Code ein. Wenn du sie jetzt nicht übertragen möchtest, überspringe diesen Schritt, um alles andere zu importieren.
aegis-migracion-aegis-contrasenas-final-ajustes = Öffne sie danach unter Einstellungen › Passwörter › „Von einem anderen { -brand-short-name } empfangen“. Überspringe diesen Schritt vorerst, um alles andere zu importieren.

## Pasar las contraseñas a otro Aegis con el código de 6 palabras (contrasenas/transferencia/): Ajustes › Contraseñas
## y autorrelleno («Transferencia de contraseñas», detrás del cierre automático), los diálogos de pasar y de recibir
## (dialogos/transferencia-*.xhtml, 440 px de ancho: los textos largos pasan a otra línea) y el selector de archivos.
## «Código de transferencia» está en el glosario. Las palabras del código son siempre las de la lista del EFF, en
## inglés: no se traducen ni salen aquí. Honestidad: la caducidad (24 h) y el «una sola vez» los comprueba Aegis al
## abrir el archivo; lo que protege el archivo es el código.

# Ajustes: etiqueta de la sección (en mayúsculas), su descripción y dos filas con su detalle y un botón compacto.
aegis-transferencia-titulo = Passwortübertragung
aegis-transferencia-descripcion = Übertrage deine Passwörter an ein anderes { -brand-short-name } (auf diesem oder einem anderen Computer) in einer verschlüsselten Datei, die sich nur mit einem Code aus 6 Wörtern öffnen lässt. Sie laufen über keinen Server: Die Datei bringst du selbst hin.
aegis-transferencia-pasar = An ein anderes { -brand-short-name } übertragen
aegis-transferencia-pasar-detalle = Erstellt die Datei und ihren Code. Der Code wird nur einmal angezeigt, und die Datei läuft nach 24 Stunden ab.
aegis-transferencia-pasar-boton = Datei erstellen…
aegis-transferencia-recibir = Von einem anderen { -brand-short-name } empfangen
aegis-transferencia-recibir-detalle = Öffnet die Datei hier mit ihrem Code. Passwörter, die du schon hast, werden nicht doppelt gespeichert.
aegis-transferencia-recibir-boton = Datei öffnen…
# Títulos del selector de archivos del sistema, el nombre del tipo de archivo y el nombre que se propone (sin la
# extensión .aegisvault, que se añade sola).
aegis-transferencia-selector-guardar = Passwortdatei speichern
aegis-transferencia-selector-abrir = Passwortdatei auswählen
aegis-transferencia-selector-filtro = { -brand-short-name }-Passwörter
aegis-transferencia-nombre-archivo = { -brand-short-name }-Passwörter
# Mensaje y título del diálogo de Windows Hello al crear el archivo.
aegis-transferencia-autenticacion = Um deine Passwörter an ein anderes { -brand-short-name } zu übertragen, gib deine Windows-Anmeldedaten ein. Das hilft, deine Konten zu schützen.
aegis-transferencia-autenticacion-titulo = { -brand-short-name }
# Botones comunes de los dos diálogos.
aegis-transferencia-cancelar = Abbrechen
aegis-transferencia-hecho = Fertig

# Diálogo «Pasar a otro Aegis». Paso 1: qué se lleva y el aviso.
aegis-pasar-ventana = An ein anderes { -brand-short-name } übertragen
aegis-pasar-titulo = Passwörter an ein anderes { -brand-short-name } übertragen
aegis-pasar-explicacion = Sie werden in einer verschlüsselten Datei gespeichert. Am Ende siehst du einen Code aus 6 Wörtern: Öffne die Datei im anderen { -brand-short-name } unter Einstellungen › Passwörter › „Von einem anderen { -brand-short-name } empfangen“ und gib den Code ein.
# $contrasenas: cuántas hay guardadas (1 o más).
aegis-pasar-resumen =
    { $contrasenas ->
        [one] 1 gespeichertes Passwort wird übertragen.
       *[other] { $contrasenas } gespeicherte Passwörter werden übertragen.
    }
aegis-pasar-vacio = Es gibt keine gespeicherten Passwörter zum Übertragen.
# Casilla, marcada de serie. $codigos: cuántos códigos de verificación hay guardados.
aegis-pasar-incluir-codigos =
    { $codigos ->
        [one] Auch den gespeicherten Bestätigungscode mitnehmen
       *[other] Auch die { $codigos } gespeicherten Bestätigungscodes mitnehmen
    }
aegis-pasar-aviso-titulo = Wer die Datei und den Code hat, hat deine Passwörter
aegis-pasar-aviso-texto = Bewahre die Datei an einem Ort auf, den du kontrollierst, und schicke sie nicht zusammen mit dem Code. Lösche sie, sobald du sie im anderen { -brand-short-name } geöffnet hast.
# Solo con la casilla de los códigos marcada.
aegis-pasar-aviso-codigos = Mit den Bestätigungscodes enthält die Datei beide Schritte dieser Konten.
aegis-pasar-limites = Die Datei läuft nach 24 Stunden ab und lässt sich in jedem Profil nur einmal öffnen: Das prüft { -brand-short-name } beim Öffnen. Was sie wirklich schützt, ist der Code.
aegis-pasar-crear = Datei erstellen…
# Paso 2: el código, una sola vez.
aegis-pasar-codigo-titulo = Dein Übertragungscode
aegis-pasar-codigo-explicacion = Gib ihn im anderen { -brand-short-name } ein, wenn du die Datei öffnest. Er läuft nach 24 Stunden ab.
aegis-pasar-copiar = Code kopieren
# Tras copiar. $segundos: tras cuántos segundos se borra (60 de serie).
aegis-pasar-copiado = Kopiert. Er wird in { $segundos } s aus der Zwischenablage gelöscht, falls er noch dort ist.
aegis-pasar-copiado-sin-borrar = Kopiert. Leere die Zwischenablage, wenn du ihn eingefügt hast.
aegis-pasar-copiar-error = Kopieren nicht möglich. Schreib ihn von Hand auf.
aegis-pasar-una-vez-titulo = Er wird nicht noch einmal angezeigt
aegis-pasar-una-vez-texto = Schreib ihn jetzt auf oder kopiere ihn. { -brand-short-name } speichert ihn nicht: Wenn du ihn verlierst, lässt sich die Datei nicht öffnen, und du musst eine neue erstellen.
# $archivo: el nombre del archivo; $contrasenas y $codigos: cuántos lleva.
aegis-pasar-guardado =
    In „{ $archivo }“: { $contrasenas ->
        [one] 1 Passwort
       *[other] { $contrasenas } Passwörter
    }.
aegis-pasar-guardado-codigos =
    In „{ $archivo }“: { $contrasenas ->
        [one] 1 Passwort
       *[other] { $contrasenas } Passwörter
    } und { $codigos ->
        [one] 1 Bestätigungscode
       *[other] { $codigos } Bestätigungscodes
    }.
aegis-pasar-error-autenticacion = Deine Identität konnte nicht bestätigt werden. Versuche es erneut.
aegis-pasar-error-escribir = Die Datei konnte nicht gespeichert werden. Wähle einen anderen Ordner und versuche es erneut.
aegis-pasar-error = Die Datei konnte nicht erstellt werden. Versuche es erneut.

# Diálogo «Recibir de otro Aegis». Paso 1: el archivo y el código.
aegis-recibir-ventana = Von einem anderen { -brand-short-name } empfangen
aegis-recibir-titulo = Passwörter von einem anderen { -brand-short-name } empfangen
aegis-recibir-explicacion = Wähle die Datei aus, die du im anderen { -brand-short-name } erstellt hast, und gib ihren Code aus 6 Wörtern ein.
aegis-recibir-archivo = Datei
aegis-recibir-sin-archivo = Keine Datei ausgewählt
aegis-recibir-elegir = Auswählen…
aegis-recibir-cambiar = Ändern…
aegis-recibir-codigo = Code aus 6 Wörtern
# Debajo del campo: antes de escribir, cuántas palabras lleva o cuál no es del código. $palabras: de 1 a 7 o más.
aegis-recibir-codigo-nota = Die Wörter in der richtigen Reihenfolge, durch Leerzeichen getrennt. Groß- und Kleinschreibung spielt keine Rolle.
aegis-recibir-codigo-cuenta = { $palabras } von 6 Wörtern
aegis-recibir-codigo-desconocida = „{ $palabra }“ ist kein Wort des Codes. Prüfe die Schreibweise.
aegis-recibir-limites = Sie werden zu deinen gespeicherten Passwörtern hinzugefügt, geschützt durch dein Hauptpasswort. Passwörter, die du schon hast, werden nicht doppelt gespeichert; ist das aus der Datei neuer, ersetzt es das bisherige.
aegis-recibir-boton = Empfangen
aegis-recibir-abriendo = Datei wird geöffnet…
# Errores. «-incorrecto» no dice si el fallo es del código o del archivo (a propósito).
aegis-recibir-error-incorrecto = Der Code oder die Datei stimmt nicht. Prüfe die 6 Wörter und ob es die Datei ist, die du erstellt hast.
aegis-recibir-error-version = Diese Datei stammt aus einer neueren Version von { -brand-short-name }. Aktualisiere { -brand-short-name } und versuche es erneut.
aegis-recibir-error-caducado = Diese Datei ist abgelaufen: Sie gilt nur 24 Stunden. Erstelle im anderen { -brand-short-name } eine neue.
aegis-recibir-error-reloj = Das Datum dieser Datei liegt nach dem dieses Computers. Prüfe Datum und Uhrzeit auf beiden Computern.
aegis-recibir-error-usado = Diese Datei wurde hier schon geöffnet und gilt nur einmal. Erstelle bei Bedarf im anderen { -brand-short-name } eine neue.
aegis-recibir-error-leer = Die Datei konnte nicht gelesen werden. Prüfe, ob sie noch da ist, und versuche es erneut.
aegis-recibir-error-sin-principal = Ohne Hauptpasswort werden keine Passwörter gespeichert. Erstelle es und versuche es erneut.
aegis-recibir-error-bloqueada = Zum Speichern der Passwörter wird dein Hauptpasswort benötigt. Versuche es erneut.
aegis-recibir-error = Die Passwörter konnten nicht empfangen werden. Versuche es erneut.
# Paso 2: el resumen (una línea por cada cosa que no sea cero; la primera, siempre) y borrar el archivo. $n: cuántas.
aegis-recibir-hecho-titulo = Passwörter empfangen
aegis-recibir-hecho-explicacion = Sie sind jetzt bei deinen gespeicherten Passwörtern, geschützt durch dein Hauptpasswort.
aegis-recibir-resumen-nuevas =
    { $n ->
        [one] 1 neues Passwort
       *[other] { $n } neue Passwörter
    }
aegis-recibir-resumen-actualizadas =
    { $n ->
        [one] 1 aktualisiert (das aus der Datei war neuer)
       *[other] { $n } aktualisiert (die aus der Datei waren neuer)
    }
aegis-recibir-resumen-ya =
    { $n ->
        [one] 1 war schon gespeichert
       *[other] { $n } waren schon gespeichert
    }
aegis-recibir-resumen-codigos =
    { $n ->
        [one] 1 neuer Bestätigungscode
       *[other] { $n } neue Bestätigungscodes
    }
aegis-recibir-resumen-codigos-ya =
    { $n ->
        [one] 1 Konto hatte schon seinen Bestätigungscode (nicht geändert)
       *[other] { $n } Konten hatten schon ihren Bestätigungscode (nicht geändert)
    }
aegis-recibir-resumen-errores =
    { $n ->
        [one] 1 konnte nicht hinzugefügt werden
       *[other] { $n } konnten nicht hinzugefügt werden
    }
aegis-recibir-borrar-titulo = Lösche die Datei
aegis-recibir-borrar-texto = Du brauchst sie nicht mehr, und mit ihr und dem Code könnte jeder deine Passwörter lesen. Lösche sie auch dort, wohin du sie kopiert hast (USB-Stick, deine Cloud).
aegis-recibir-borrar = Datei löschen
aegis-recibir-borrado = Datei gelöscht.
aegis-recibir-borrar-error = Sie konnte nicht gelöscht werden. Lösche sie in ihrem Ordner.
