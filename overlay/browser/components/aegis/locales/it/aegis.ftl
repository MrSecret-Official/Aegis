# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

## Pulsante della modalità nella barra (Standard / Workflow)

aegis-modo-button =
    .label = Modalità
    .tooltiptext = Alterna tra le modalità Standard e Workflow

## Pannello dei segnalibri nella barra laterale

aegis-marcadores-ventana =
    .title = Gestisci in una finestra
aegis-marcadores-todos =
    .label = Tutti i segnalibri
aegis-marcadores-ordenar =
    .title = Ordina
aegis-marcadores-orden-propio =
    .label = Il tuo ordine
aegis-marcadores-orden-nombre =
    .label = Nome (A–Z)
aegis-marcadores-orden-recientes =
    .label = Più recenti prima
aegis-marcadores-vista =
    .title = Vista compatta
aegis-marcadores-editar =
    .title = Modifica i segnalibri al clic
aegis-marcadores-nueva-carpeta =
    .label = Nuova cartella
aegis-marcadores-anadir-pestana =
    .label = Aggiungi scheda corrente

## Pagina delle impostazioni: intestazione della barra laterale e gruppi di categorie

aegis-ajustes-titulo = Impostazioni
aegis-ajustes-grupo-personal = Personale
aegis-ajustes-grupo-navegacion = Navigazione
aegis-ajustes-grupo-privacidad = Privacy
aegis-ajustes-grupo-sistema = Sistema
aegis-ajustes-no-predeterminado =
    .message = { -brand-short-name } non è il tuo browser predefinito.

## Impostazioni › Aspetto: icona dell’app (Windows)

aegis-icono-titulo = Icona dell’app
aegis-icono-descripcion = Compare nelle finestre di { -brand-short-name }. Le finestre anonime usano sempre il fantasma con il buco della serratura.
aegis-icono-fantasma = Fantasma
aegis-icono-uroboros = Uroboro

## Scudi (pannello della barra degli indirizzi)

aegis-escudos-boton =
    .tooltiptext = { $count ->
        [0] Scudi attivi
        [one] Scudi attivi: 1 bloccato in questa pagina
       *[other] Scudi attivi: { $count } bloccati in questa pagina
    }
aegis-escudos-boton-bajados =
    .tooltiptext = Scudi abbassati per questo sito
aegis-escudos-activos-sitio = Scudi attivi per questo sito
aegis-escudos-bajados-sitio = Scudi abbassati per questo sito
aegis-escudos-contador = { $count ->
        [one] annuncio o tracciante bloccato in questa pagina
       *[other] annunci e traccianti bloccati in questa pagina
    }
aegis-escudos-contador-bajados = Gli Scudi sono abbassati: su questo sito non si blocca nulla.
aegis-escudos-total = { $total ->
        [one] 1 blocco da quando hai installato { -brand-short-name }
       *[other] { $total } blocchi da quando hai installato { -brand-short-name }
    }
aegis-escudos-avanzadas = Opzioni avanzate
aegis-escudos-rastreadores = Traccianti e annunci
aegis-escudos-nivel-normal = Normale
aegis-escudos-nivel-estricto = Rigoroso
aegis-escudos-nivel-estricto-mas = Rigoroso+
aegis-escudos-personalizado = Personalizzato
aegis-escudos-global = Su tutti i siti
aegis-escudos-ver-bloqueado = Bloccati in questa pagina
aegis-escudos-https = Passa le connessioni a HTTPS
aegis-escudos-https-activo = Solo HTTPS su questo sito
aegis-escudos-https-excepcion = Questo sito può aprirsi senza crittografia
aegis-escudos-https-apagado = La modalità solo HTTPS è disattivata nelle Impostazioni
aegis-escudos-scripts = Blocca script
aegis-escudos-scripts-pronto = Presto
aegis-escudos-huella = Impronta digitale
aegis-escudos-cookies = Cookie di terze parti
aegis-escudos-cookies-entre-sitios = Blocca traccianti
aegis-escudos-cookies-todas = Blocca tutti
aegis-escudos-olvidar = Dimentica questo sito alla chiusura
aegis-escudos-olvidar-detalle = Elimina i suoi cookie e dati quando chiudi { -brand-short-name }
aegis-escudos-olvidar-privada = Una finestra anonima dimentica già tutto quando la chiudi
aegis-escudos-listas = Liste di filtri
aegis-escudos-configuracion = Impostazioni generali
aegis-escudos-pie = Se questo sito non si vede bene, abbassa gli Scudi qui. Così sarà meno protetto.
aegis-escudos-lista-titulo = Bloccati in questa pagina
aegis-escudos-atras =
    .aria-label = Indietro
aegis-escudos-cat-rastreadores = Traccianti e annunci
aegis-escudos-cat-anuncios = Pubblicità (liste di filtri)
aegis-escudos-cat-sociales = Traccianti dei social media
aegis-escudos-cat-huella = Impronta digitale
aegis-escudos-cat-criptomineros = Cryptominer
aegis-escudos-lista-vacia = Non è stato bloccato nulla in questa pagina.

## Pagina delle impostazioni: nomi di Aegis al posto di quelli di Firefox

aegis-ajustes-general = Generale
aegis-ajustes-inicio-predeterminado =
    .label = Pagina iniziale di { -brand-short-name } (predefinita)
aegis-ajustes-inicio =
    .label = Pagina iniziale di { -brand-short-name }
aegis-ajustes-inicio-aviso =
    .message = Per usare queste funzioni, apri le nuove schede o le nuove finestre con la pagina iniziale di { -brand-short-name }.
aegis-ajustes-personalizar-inicio =
    .label = Personalizza la pagina iniziale di { -brand-short-name }

## Complementos (about:addons): cabecera de la barra lateral, buscador y estado vacío de Extensiones.

aegis-complementos-titulo = Componenti aggiuntivi
# Texto de ayuda del buscador: abre la tienda de complementos en una pestaña.
aegis-complementos-buscar = Cerca componenti aggiuntivi sul web
aegis-complementos-vacio = Non hai ancora estensioni.
aegis-complementos-vacio-boton = Cerca estensioni
# Panel de extensiones de la barra (la pieza de puzle) sin ninguna instalada: título, frase y, debajo, el botón
# aegis-complementos-vacio-boton, que abre la tienda de complementos en una pestaña.
aegis-extensiones-vacio-titulo = Non hai ancora estensioni
aegis-extensiones-vacio-texto = Cercale nello store dei componenti aggiuntivi.
# Panel de extensiones con extensiones (al estilo de Chrome y Brave). Etiquetas de sección (se ven en MAYÚSCULAS):
# las fijadas en la barra de herramientas y, debajo, las que se ven solo dentro del panel.
aegis-extensiones-en-barra = Nella barra
aegis-extensiones-en-panel = In questo pannello
# Botón de la chincheta de cada extensión (texto de ayuda y para lectores de pantalla). Dice lo que hace al pulsarlo.
# Variables:
#   $nombre (String) - nombre de la extensión
aegis-extensiones-fijar = Fissa { $nombre } nella barra degli strumenti
aegis-extensiones-desfijar = Rimuovi { $nombre } dalla barra degli strumenti
# Pie del panel: abre Complementos › Extensiones (about:addons) y la tienda de complementos en una pestaña.
aegis-extensiones-gestionar = Gestisci estensioni
aegis-extensiones-anadir = Aggiungi estensioni

## Barra lateral y barra de marcadores

# Pie de «Personalizar barra lateral»: abre los Ajustes del navegador.
aegis-barra-ajustes = Impostazioni di { -brand-short-name }
# Botón junto al aviso de la barra de marcadores vacía: la oculta mientras no tenga marcadores (vuelve sola con el primero).
aegis-marcadores-aviso-cerrar = Non ora
    .title = Nascondi la barra dei segnalibri finché è vuota

## Contraseñas (about:logins): estado vacío. La bóveda propia llegará más adelante.

aegis-contrasenas-vacio = Le password che salvi quando accedi a un sito appariranno qui.
aegis-contrasenas-importar = Importa password

## Contraseñas: protección (contrasenas.sys.mjs), panel de la barra lateral (contrasenas-panel.sys.mjs) y aviso de
## about:logins. «Contraseña principal» es el término de Firefox (Primary Password): el mismo en todo el navegador.

# Botón del aviso del panel y de about:logins: abre el diálogo de la contraseña principal.
aegis-contrasenas-principal-crear = Crea password principale
# Aviso del panel y de about:logins cuando no hay contraseña principal.
aegis-contrasenas-sin-principal = Nessuna password principale: qualsiasi programma che copi il tuo profilo potrebbe leggere le password salvate.
# Estado vacío del panel de la barra lateral.
aegis-contrasenas-panel-titulo = Le tue password, sotto chiave
aegis-contrasenas-panel-texto = { -brand-short-name } le conserva cifrate su questo dispositivo, protette dalla tua password principale, e non le invia da nessuna parte.

## Ajustes › Contraseñas y autorrelleno: «Cierre automático de la bóveda» (ajustes.sys.mjs), detrás de «Contraseñas». Segmentos:
## Nunca, 15, 10, 5, 3, 2 y 1 min; caben siete en una fila, así que las etiquetas son cortas.

aegis-bloqueo-titulo = Blocco automatico delle password
aegis-bloqueo-descripcion = Dopo questo tempo senza usare il computer, le password salvate si bloccano e { -brand-short-name } chiede di nuovo la password principale. Si bloccano anche quando il computer va in sospensione e quando chiudi { -brand-short-name }.
aegis-bloqueo-nunca-aviso = Con «Mai», si bloccano solo quando chiudi { -brand-short-name } o il computer va in sospensione.
aegis-bloqueo-sin-principal = Vale solo con una password principale.
aegis-bloqueo-nunca = Mai
# Cada segmento con minutos. $minutos: 1, 2, 3, 5, 10 o 15.
aegis-bloqueo-minutos = { $minutos } min

## Diálogo de la contraseña principal (dialogos/contrasena-principal.xhtml), en lugar del de Firefox: crearla
## (antes de guardar la primera contraseña, desde el panel, about:logins o Ajustes) o cambiarla (Ajustes). Ancho
## fijo de 440 px: los textos largos pasan a otra línea.

# Título de la ventana o del marco del diálogo (Ajustes lo muestra arriba).
aegis-principal-ventana = Password principale
aegis-principal-titulo-crear = Crea la tua password principale
aegis-principal-titulo-cambiar = Cambia la tua password principale
# Antes de guardar la primera contraseña (botones «No guardar» y «Crear y guardar»).
aegis-principal-explicacion-guardar = Per salvare le password, { -brand-short-name } le cifra con una password principale. Senza, qualsiasi programma che copi il tuo profilo potrebbe leggerle. Ti verrà chiesta una volta per sessione e di nuovo dopo un po’ che non usi il computer.
# Desde el aviso del panel o de about:logins, o desde Ajustes.
aegis-principal-explicacion-crear = { -brand-short-name } la usa per cifrare le password che salvi. Senza, qualsiasi programma che copi il tuo profilo potrebbe leggerle. Ti verrà chiesta una volta per sessione e di nuovo dopo un po’ che non usi il computer.
aegis-principal-explicacion-cambiar = Per cambiarla ti serve quella attuale. Le password salvate restano dove sono, protette da quella nuova.
# Si una política de empresa exige la contraseña principal.
aegis-principal-politica = La tua organizzazione richiede una password principale.
aegis-principal-actual = Password principale attuale
aegis-principal-nueva = Password principale
aegis-principal-nueva-cambiar = Nuova password principale
aegis-principal-repetir = Ripetila
# Botón con el icono del ojo dentro de cada campo: muestra u oculta lo escrito.
aegis-principal-mostrar =
    .title = Mostra la password
    .aria-label = Mostra la password
# Debajo del campo, antes de escribir: el mínimo de Aegis.
aegis-principal-requisito = Almeno 12 caratteri. Una frase di quattro o più parole è facile da ricordare e difficile da indovinare.
# Mientras se escribe, lo que falta o el nivel. $faltan: caracteres que faltan para llegar a 12.
aegis-principal-corta =
    { $faltan ->
        [one] Troppo corta: manca { $faltan } carattere.
       *[other] Troppo corta: mancano { $faltan } caratteri.
    }
aegis-principal-comun = Troppo facile da indovinare: evita parole e password molto usate.
aegis-principal-secuencia = Troppo facile da indovinare: evita sequenze come «1234» o «qwerty».
aegis-principal-repetida = Troppo facile da indovinare: ha troppe ripetizioni.
aegis-principal-variedad = Troppo facile da indovinare: usa più caratteri diversi.
aegis-principal-aceptable = Sicurezza: accettabile. Più lunga sarebbe meglio.
aegis-principal-fuerte = Sicurezza: buona.
aegis-principal-muy-fuerte = Sicurezza: ottima.
aegis-principal-no-coinciden = Le password non corrispondono.
aegis-principal-error-actual = La password attuale non è corretta. Scrivila di nuovo.
aegis-principal-error = Impossibile salvare la password principale. Riprova.
# Tarjeta de aviso: no se puede recuperar (restablecerla en Firefox borra las contraseñas guardadas).
aegis-principal-olvido-titulo = Se la dimentichi, non si può recuperare
aegis-principal-olvido-texto = { -brand-short-name } non la conserva da nessuna parte e nessuno può inviartela. Per ricominciare dovresti reimpostarla, e così si eliminano tutte le password salvate.
# La línea de honestidad: qué protege y qué no.
aegis-principal-limites = Protegge le tue password se qualcuno copia il tuo profilo, usa un altro account di questo computer o porta via il disco. Non le protegge da un programma dannoso che controlla già il tuo computer: potrebbe registrare ciò che digiti, anche questa password.
# Botones. «No guardar» y «Crear y guardar», antes de guardar; los demás, desde Ajustes, el panel o about:logins.
aegis-principal-no-guardar = Non salvare
aegis-principal-cancelar = Annulla
aegis-principal-crear-guardar = Crea e salva
aegis-principal-crear = Crea password
aegis-principal-cambiar = Cambia password

## Códigos de verificación (autenticador/): panel de contraseñas, about:logins, el autorrelleno y el diálogo para
## añadirlos (dialogos/autenticador.xhtml). «Código de verificación» es el código de 6 u 8 cifras de la verificación
## en dos pasos (TOTP); «clave de configuración», el texto que da la web para configurarlo (glosario).

# Panel de contraseñas: título de la sección plegable.
aegis-codigos-titulo = Codici di verifica
aegis-codigos-vacio = Salva qui il codice di verifica in due passaggi di un account e { -brand-short-name } ti darà i suoi codici.
# Botón compacto del panel: abre el diálogo para añadir uno.
aegis-codigos-anadir = Aggiungi codice
# Botones de icono de cada fila del panel. $sitio: el dominio («github.com»).
aegis-codigos-ver =
    .title = Mostra il codice di { $sitio }
    .aria-label = Mostra il codice di { $sitio }
aegis-codigos-copiar =
    .title = Copia il codice di { $sitio }
    .aria-label = Copia il codice di { $sitio }
aegis-codigos-editar =
    .title = Modifica o rimuovi il codice di { $sitio }
    .aria-label = Modifica o rimuovi il codice di { $sitio }
# Junto al código a la vista: segundos que le quedan. Cabe en poco: «18 s».
aegis-codigos-restante = { $segundos } s
# Tras copiar. $segundos: tras cuántos segundos se borra (30 de serie).
aegis-codigos-copiado = Codice copiato. Verrà cancellato dagli appunti tra { $segundos } s se è ancora lì.
aegis-codigos-copiado-sin-borrar = Codice copiato.
aegis-codigos-ilegible = Impossibile leggere questo codice. Aggiungilo di nuovo.
# Mensaje y título del diálogo de Windows Hello al ver o copiar un código.
aegis-codigos-autenticacion-ver = Per vedere il codice di verifica, inserisci le tue credenziali di Windows. Così proteggi i tuoi account.
aegis-codigos-autenticacion-copiar = Per copiare il codice di verifica, inserisci le tue credenziali di Windows. Così proteggi i tuoi account.
aegis-codigos-autenticacion-titulo = { -brand-short-name }
# about:logins: la fila de la contraseña elegida y sus botones compactos.
aegis-codigos-etiqueta = Codice di verifica
aegis-codigos-ninguno = Nessun codice di verifica
aegis-codigos-boton-mostrar = Mostra
aegis-codigos-boton-ocultar = Nascondi
aegis-codigos-boton-copiar = Copia
aegis-codigos-boton-cambiar = Modifica
aegis-codigos-boton-anadir = Aggiungi
# Autorrelleno: el panelito junto al campo del código en la web. $sitio: el dominio.
aegis-codigos-ofrecer-titulo = Codice di verifica
aegis-codigos-ofrecer-texto = { -brand-short-name } ha il codice di { $sitio }.
aegis-codigos-rellenar = Inserisci il codice
# Con varias cuentas en el sitio. $cuenta: el usuario (o un número).
aegis-codigos-rellenar-cuenta = Inserisci il codice di { $cuenta }
# Panel de contraseñas (solo Windows): sección «Passkeys». No prometer sincronización.
aegis-passkeys-titulo = Passkey
aegis-passkeys-texto = Le passkey che crei su un sito vengono salvate in Windows Hello, su questo computer. Se ha un chip di sicurezza (TPM), la chiave privata non lo lascia; altrimenti Windows la protegge via software. { -brand-short-name } non può vederla né copiarla. Quelle di Windows Hello non vengono sincronizzate con altri computer; se nell’avviso di Windows scegli un altro provider di passkey, vengono salvate dove indica lui.
# Abre la Configuración de Windows › Cuentas › Claves de acceso.
aegis-passkeys-gestionar = Gestisci in Windows
# Diálogo para añadir, cambiar o quitar un código de verificación.
aegis-autenticador-ventana = Codice di verifica
aegis-autenticador-titulo = Aggiungi codice di verifica
aegis-autenticador-titulo-editar = Codice di verifica
aegis-autenticador-explicacion = Quando un sito ti chiede di configurare un’app di autenticazione, leggi qui il suo codice QR o copia la sua chiave di configurazione. { -brand-short-name } genererà i codici su questo computer.
aegis-autenticador-cuenta = Account
# Primera opción del desplegable de cuentas.
aegis-autenticador-elige = Scegli un account salvato
aegis-autenticador-sin-cuentas = Prima salva la password di quell’account in { -brand-short-name }.
aegis-autenticador-existe = Questo account ha già un codice di verifica. Se salvi un’altra chiave, sostituisce quella precedente.
aegis-autenticador-clave = Chiave di configurazione o link otpauth://
# Botón del ojo dentro del campo de la clave.
aegis-autenticador-mostrar =
    .title = Mostra la chiave
    .aria-label = Mostra la chiave
# Botones compactos para leer el código QR (en el equipo, sin red).
aegis-autenticador-qr-pagina = Leggi il QR di questa pagina
aegis-autenticador-qr-imagen = Leggi il QR da un’immagine…
# Título del selector de archivos.
aegis-autenticador-qr-imagen-titulo = Scegli un’immagine con il codice QR
aegis-autenticador-qr-no = Nessun codice QR trovato. Fai in modo che il codice si veda per intero e riprova.
aegis-autenticador-qr-otro = Quel codice QR non è di un’app di autenticazione.
# La clave es válida. $emisor: quien la da; $digitos: 6–8; $periodo: segundos (30).
aegis-autenticador-valida = { $emisor }: { $digitos } cifre ogni { $periodo } s.
aegis-autenticador-valida-sin-emisor = Chiave valida: { $digitos } cifre ogni { $periodo } s.
aegis-autenticador-error-formato = Non è una chiave valida. Copia per intero la chiave di configurazione o il link otpauth://.
aegis-autenticador-error-hotp = I codici a contatore (HOTP) non sono supportati, solo quelli basati sul tempo (TOTP).
aegis-autenticador-error-corta = La chiave è troppo corta per essere sicura.
aegis-autenticador-error-parametros = Questo codice usa un formato non supportato (cifre o periodo insoliti).
aegis-autenticador-error-guardar = Impossibile salvare il codice. Riprova.
# La tarjeta de honestidad: los dos pasos juntos en la bóveda.
aegis-autenticador-honestidad-titulo = Entrambi i passaggi in un solo posto
aegis-autenticador-honestidad = Salvare il codice insieme alla password riunisce entrambi i passaggi in { -brand-short-name }: chi sbloccasse le tue password li avrebbe tutti e due. Li proteggono la password principale e la verifica dell’identità quando vedi o copi un codice. Per gli account più importanti, un’app di autenticazione su un altro dispositivo è più sicura.
# Quitar pide dos pulsaciones: la segunda con «-confirmar» y el aviso.
aegis-autenticador-quitar = Rimuovi il codice
aegis-autenticador-quitar-confirmar = Rimuovi definitivamente
aegis-autenticador-quitar-aviso = Prima di rimuoverlo, assicurati di poter accedere in un altro modo (per esempio con i codici di recupero del sito).
aegis-autenticador-cancelar = Annulla
aegis-autenticador-guardar = Salva

## Énfasis de color (Ajustes › Apariencia y «Personalizar» de la nueva pestaña)

aegis-enfasis-titulo = Colore d’accento
aegis-enfasis-descripcion = Il colore della selezione, del focus, degli interruttori, del bordo della scheda attiva e della sfumatura della cornice.
aegis-enfasis-automatico = «Colore di Windows» e «Sfondo del desktop» cambiano da soli quando li cambi in Windows. Lo sfondo viene letto su questo computer e non ne esce.
aegis-enfasis-monocromo = Monocromo
aegis-enfasis-windows = Colore di Windows
aegis-enfasis-fondo = Sfondo del desktop
aegis-enfasis-hielo = Ghiaccio
aegis-enfasis-pizarra = Ardesia
aegis-enfasis-salvia = Salvia
aegis-enfasis-ambar = Ambra
aegis-enfasis-coral = Corallo
aegis-enfasis-lavanda = Lavanda
aegis-enfasis-malva = Malva
aegis-enfasis-cobalto = Cobalto
aegis-enfasis-piedra = Pietra
aegis-enfasis-laguna = Laguna
aegis-enfasis-musgo = Muschio
aegis-enfasis-frambuesa = Lampone
aegis-enfasis-ciruela = Prugna

## Énfasis personalizado: el «+» de los selectores y su ventana («Crear» y «Mis énfasis»)

# Nombre de la opción del «+» en Ajustes y principio de sus etiquetas.
aegis-enfasis-propio = Su misura
# Etiqueta (y descripción emergente) del «+» sin ningún personalizado en uso.
aegis-enfasis-propio-abrir = Su misura: creane uno o scegline uno salvato
# El «+» con un personalizado en uso. $nombre: su nombre o sus códigos (p. ej. #88C0DC)
aegis-enfasis-propio-abrir-activo = Su misura: { $nombre }
# Línea del elegido, bajo las muestras de la nueva pestaña. $nombre: su nombre o sus códigos
aegis-enfasis-propio-actual = Su misura: { $nombre }
aegis-enfasis-propio-titulo = Colore d’accento personalizzato
aegis-enfasis-propio-cerrar = Chiudi
# Las dos pestañas de la ventana.
aegis-enfasis-propio-crear = Crea
aegis-enfasis-propio-mis = I miei colori
aegis-enfasis-propio-degradado = Sfumatura
aegis-enfasis-propio-degradado-ayuda = Un secondo colore per la cornice della finestra e il bordo della scheda attiva. Il resto usa il primo.
# Para lectores de pantalla: los dos segmentos que eligen qué color se edita.
aegis-enfasis-propio-editando = Colore che stai modificando
aegis-enfasis-propio-color-1 = Primo colore
aegis-enfasis-propio-color-2 = Secondo colore
# El cuadro de color, para lectores de pantalla. $saturacion y $brillo: de 0 a 100
aegis-enfasis-propio-area = Saturazione e luminosità
aegis-enfasis-propio-area-valor = Saturazione { $saturacion }%, luminosità { $brillo }%
aegis-enfasis-propio-tono = Tonalità
# Campo del color en hexadecimal (#RRGGBB).
aegis-enfasis-propio-hex = Codice
aegis-enfasis-propio-hex-error = Inserisci un colore esadecimale, come #88C0DC.
aegis-enfasis-propio-nombre = Nome
aegis-enfasis-propio-nombre-ejemplo = Facoltativo
aegis-enfasis-propio-vista = Anteprima
aegis-enfasis-propio-ajuste = { -brand-short-name } regola luminosità e intensità perché resti leggibile sia in chiaro sia in scuro.
aegis-enfasis-propio-guardar = Salva
aegis-enfasis-propio-usar = Usa
aegis-enfasis-propio-guardado = Salvato in «I miei colori».
aegis-enfasis-propio-actualizado = Era già in «I miei colori».
# $maximo: cuántos se pueden guardar (24)
aegis-enfasis-propio-lleno = Ne hai già { $maximo } salvati. Eliminane uno in «I miei colori» per salvarne un altro.
# $cuantos: los guardados; $maximo: el límite (24)
aegis-enfasis-propio-cuenta = { $cuantos } di { $maximo }
# Supr (Delete): la tecla que borra el guardado con el foco.
aegis-enfasis-propio-mis-ayuda = Scegline uno per usarlo. Canc lo elimina.
aegis-enfasis-propio-sin-nombre = Senza nome
aegis-enfasis-propio-editar = Modifica
aegis-enfasis-propio-borrar = Elimina
# $nombre: el nombre del guardado (o el texto de «sin nombre»)
aegis-enfasis-propio-borrar-pregunta = Eliminare «{ $nombre }»? L’operazione non si può annullare.
aegis-enfasis-propio-borrar-confirmar = Elimina
aegis-enfasis-propio-cancelar = Annulla
aegis-enfasis-propio-borrado = «{ $nombre }» è stato eliminato.
aegis-enfasis-propio-vacio-titulo = Ancora nessuno salvato
# Estado vacío de «Mis énfasis». $maximo: cuántos se pueden guardar (24)
aegis-enfasis-propio-vacio = Crea un colore d’accento e scegli «Salva»: apparirà qui, pronto da usare con un clic. Fino a { $maximo }.
aegis-enfasis-propio-ir-crear = Creane uno

## Nueva pestaña › Personalizar: fondo, diseño (buscador, accesos y espaciado)

aegis-np-fondo-titulo = Sfondo
aegis-np-fondo-liso = Tinta unita
aegis-np-fondo-degradado = Sfumatura
aegis-np-fondo-enfasis = Accento
aegis-np-fondo-imagen = Immagine
aegis-np-imagen-cambiar = Cambia immagine…
aegis-np-imagen-error = Impossibile usare questa immagine. Provane un’altra JPG, PNG, WebP, AVIF o GIF sotto i 20 MB.
aegis-np-diseno-titulo = Layout
aegis-np-buscador = Mostra la ricerca
aegis-np-posicion = Posizione della ricerca
aegis-np-posicion-centro = Al centro
aegis-np-posicion-arriba = Più in alto
aegis-np-accesos = Scorciatoie
aegis-np-accesos-arriba = Sopra la ricerca
aegis-np-accesos-abajo = Sotto la ricerca
aegis-np-espaciado = Spaziatura
# $px: número de píxeles
aegis-np-espaciado-valor = { $px } px
aegis-np-ancho = Larghezza della barra di ricerca

## Menu dei motori di ricerca della barra degli indirizzi (la lente)

# Riga mostrata quando il motore scelto per questa ricerca non è quello predefinito. $buscador: nome del motore, ad es. Google
aegis-buscador-predeterminado = Usa { $buscador } come predefinito

## Nuova scheda › Aggiungi o modifica una scorciatoia: il logo del sito come immagine della scorciatoia

# Link accanto a «Usa un’immagine personalizzata». Cerca l’icona del sito (prima sul dispositivo, poi sul sito) e la imposta come immagine personalizzata.
aegis-logo-usar = Usa il logo del sito
aegis-logo-buscando = Ricerca del logo…
aegis-logo-sin-direccion = Digita prima l’indirizzo della scorciatoia.
aegis-logo-error = Impossibile usare il logo di questo sito. Prova con un’immagine personalizzata.
aegis-logo-error-red = Impossibile ottenere il logo dal sito. Controlla l’indirizzo o riprova più tardi.

## Webs en oscuro (Ajustes › Apariencia y fila «Oscurecer este sitio» del panel de Escudos)

aegis-webs-oscuro-titulo = Siti in modalità scura
aegis-webs-oscuro-descripcion = I siti si adattano al tema scuro di { -brand-short-name }. Solo quando { -brand-short-name } è scuro; immagini e video non cambiano.
aegis-webs-oscuro-aviso = Un sito può accorgersi che il suo aspetto è stato cambiato.
aegis-webs-oscuro-apagado = Disattivato
aegis-webs-oscuro-todas = Tutti i siti
aegis-webs-oscuro-sin-modo-oscuro = Solo quelli senza modalità scura
aegis-escudos-oscuro = Scurisci questo sito
aegis-escudos-oscuro-activo = Si adatta al tema scuro
aegis-escudos-oscuro-propio = Questo sito ha già una modalità scura
aegis-escudos-oscuro-claro = Solo quando { -brand-short-name } è scuro
aegis-escudos-oscuro-excepcion = Non viene scurito su questo sito

## Impronta digitale (Impostazioni › Privacy, pannello degli Scudi e avviso di Cassaforte)

aegis-huella-titulo = Impronta digitale
aegis-huella-descripcion = Ciò che i siti possono leggere del tuo browser per riconoscerti senza cookie: schermo, caratteri, scheda grafica, fuso orario e altro.
aegis-huella-nivel-basica = Base
aegis-huella-nivel-basica-descripcion = Solo la protezione integrata nel browser.
aegis-huella-nivel-equilibrada = Bilanciata
aegis-huella-nivel-equilibrada-descripcion = Nasconde tutto ciò che può senza rompere i siti. Consigliata.
aegis-huella-nivel-estricta = Rigorosa
aegis-huella-nivel-estricta-descripcion = Nasconde anche la posizione della finestra, i caratteri, le voci e ciò che può fare la scheda grafica. Alcuni siti potrebbero non funzionare.
aegis-huella-nivel-caja-fuerte = Cassaforte
aegis-huella-nivel-caja-fuerte-descripcion = Nasconde quasi tutto ciò che la protezione sa nascondere (non il tema scuro o chiaro né le dimensioni dello schermo): i siti vedono l’ora UTC, l’inglese e 60 fps, non vedono le tue impostazioni di accessibilità e il contrasto elevato non si applica più a loro. Per leggere un canvas devono chiederti il permesso, e puoi lasciare che un sito veda i dati del browser. Molti siti non funzioneranno.
aegis-huella-nota = Nessuna protezione è perfetta: i siti vedono comunque il tuo indirizzo IP, e { -brand-short-name } non è Tor Browser.
aegis-huella-permitidos-titulo = Siti con permesso in Cassaforte
aegis-huella-permitidos-vacio = Nessun sito ha il permesso.
# $sitio: dominio del sito, ad esempio esempio.it
aegis-huella-quitar = Rimuovi
    .aria-label = Rimuovi { $sitio }
aegis-huella-apagada = Disattivata nella protezione antitracciamento
aegis-huella-permitir-sitio = Consenti su questo sito
aegis-huella-permiso-no = Dati del browser: bloccati
aegis-huella-permiso-si = Dati del browser: protezione bilanciata
aegis-huella-permiso-privada = Solo da una finestra normale
aegis-huella-permiso-no-disponible = Non disponibile per questo indirizzo
# <> viene sostituito dal nome del sito (in grassetto). Lasciarlo così.
aegis-huella-aviso = <> ha cercato di leggere dati del tuo browser. Cassaforte li ha nascosti.
aegis-huella-aviso-permitir =
    .label = Consenti su questo sito
    .accesskey = C
aegis-huella-aviso-bloquear =
    .label = Continua a bloccare
    .accesskey = B

## Tor: «Nuova finestra anonima con Tor» (menu ☰, Maiusc+Alt+N), Impostazioni › Privacy › Tor, l’indicatore nella
## barra e about:privatebrowsing nell’istanza con Tor. «Tor» e «Tor Browser» sono nomi di un altro progetto.

aegis-tor-titulo = Tor
aegis-tor-descripcion = Apri finestre anonime che passano per la rete Tor: i siti non vedono il tuo IP. È un { -brand-short-name } separato, con un proprio profilo che viene eliminato alla chiusura, e non condivide nulla con le altre finestre.
aegis-tor-honestidad = { -brand-short-name } con Tor non è Tor Browser: { -brand-short-name } si distingue più facilmente di Tor Browser, che sembra lo stesso browser per tutti. Per un anonimato forte, usa Tor Browser. Ciò che apri fuori dal browser (un download aperto con un’altra app, un link email) non passa per Tor.
aegis-tor-no-descargado = Tor non è stato scaricato
# $tamano: megabyte, es. 21,5; $origen: server, es. dist.torproject.org
aegis-tor-origen = { $tamano } MB dal Tor Project ({ $origen }). L’impronta sha256 viene verificata prima dell’installazione.
# $progreso: percentuale
aegis-tor-descargando = Download in corso… { $progreso }%
aegis-tor-comprobando = Verifica del pacchetto…
# $progreso: percentuale
aegis-tor-extrayendo = Installazione… { $progreso }%
# $tor: versione di tor; $version: versione del pacchetto
aegis-tor-listo = Tor { $tor } scaricato (pacchetto { $version })
aegis-tor-desactualizado = È disponibile una nuova versione di Tor (pacchetto { $version })
aegis-tor-boton-descargar = Scarica Tor
aegis-tor-boton-actualizar = Aggiorna
aegis-tor-boton-cancelar = Annulla
aegis-tor-boton-borrar = Elimina
aegis-tor-borrar-abierta = Chiudi le finestre con Tor per poterlo eliminare.
aegis-tor-abrir-titulo = Nuova finestra anonima con Tor
aegis-tor-abrir-detalle = Anche dal menu o con Maiusc+Alt+N.
aegis-tor-boton-abrir = Apri
aegis-tor-puentes-titulo = Bridge
aegis-tor-puentes-descripcion = Per le reti che bloccano Tor. Si applica dalla prossima finestra con Tor.
aegis-tor-puentes-ninguno = Nessun bridge
aegis-tor-puentes-obfs4 = obfs4
aegis-tor-puentes-snowflake = Snowflake
aegis-tor-nota-huella = La finestra con Tor usa Cassaforte: Tor nasconde il tuo IP, ma ciò che il browser rivela di sé dipende da { -brand-short-name }.
aegis-tor-nota-buscadores = Alcuni motori di ricerca, come Google, chiedono captcha o bloccano le connessioni che arrivano da Tor. DuckDuckGo funziona.
aegis-tor-instancia-texto = Questa è una finestra anonima con Tor: tutto il traffico passa per Tor e alla chiusura non viene conservato nulla.
aegis-tor-boton-identidad = Nuova identità
aegis-tor-error-descarga = Impossibile scaricare Tor. Controlla la connessione e riprova.
aegis-tor-error-suma = Il download non è il pacchetto previsto (l’impronta sha256 non corrisponde) ed è stato scartato. Riprova più tardi.
aegis-tor-error-sin-descargar = Tor non è stato scaricato: scaricalo in Impostazioni › Privacy.
aegis-tor-error-arranque = Tor non è riuscito ad avviarsi. Se Windows lo ha bloccato, consentilo e apri un’altra finestra con Tor.
aegis-tor-error-caido = Tor si è chiuso. Chiudi questa finestra e aprine un’altra con Tor.
aegis-tor-aviso-red = Tor ha problemi a connettersi. Se la tua rete blocca Tor, prova i bridge.
aegis-tor-red-arrancando = Tor: avvio…
# $progreso: percentuale
aegis-tor-red-conectando = Tor: connessione… { $progreso }%
aegis-tor-red-conectado = Tor: connesso
aegis-tor-red-error = Tor: nessuna connessione.
aegis-tor-red-parado = Tor: fermo.
aegis-tor-privada-nota = I siti vedono un IP della rete Tor, non il tuo. { -brand-short-name } con Tor non è Tor Browser.
aegis-tor-menu-ventana =
    .label = Nuova finestra anonima con Tor
aegis-tor-menu-identidad =
    .label = Nuova identità Tor
aegis-tor-menu-ajustes =
    .label = Impostazioni di Tor
aegis-tor-ofrecer-titulo = Scarica Tor
# $tamano: megabyte, es. 21,5
aegis-tor-ofrecer-texto = Per aprire una finestra anonima con Tor serve Tor, che non è incluso in { -brand-short-name }. Verranno scaricati { $tamano } MB dal Tor Project (dist.torproject.org) e l’impronta verrà verificata prima di installarlo nel tuo profilo.
aegis-tor-ofrecer-botones =
    .descargar = Scarica
aegis-tor-identidad-confirmar = Tutte le finestre con Tor verranno chiuse, tutto ciò che riguarda questa sessione verrà eliminato e Tor userà nuovi circuiti.
    .title = Nuova identità
    .aceptar = Nuova identità

## Google (Ajustes › Privacidad; google.sys.mjs). «Google» y «YouTube» son nombres propios: no se traducen.

aegis-google-titulo = Google
aegis-google-descripcion = La protezione antitracciamento non agisce sui siti di Google e YouTube. Lì { -brand-short-name } blocca i loro dati di utilizzo e gli annunci, e i link dei risultati portano direttamente al sito.
# Mismo nombre que la sección «Google limpio» de about:escudos (escudos-ayuda-google-titulo).
aegis-google-limpio = Google pulito
aegis-google-limpio-detalle = Google vede ancora il tuo IP, ciò che cerchi e, se accedi, chi sei.
# Pide a Google la vista «Web» (udm=14). Solo actúa con «Google limpio» encendido.
aegis-google-solo-web = Solo risultati web su Google
aegis-google-solo-web-detalle = Per le ricerche dalla barra degli indirizzi, senza risposte dell’IA né moduli.

## Link a «Come funzionano gli Scudi» (about:escudos)

# Pie del panel de Escudos: abre la página de ayuda en una pestaña.
aegis-escudos-ayuda = Come funzionano gli Scudi
# Ajustes: enlace junto a cada opción de Escudos y de huella; abre la ayuda en su sección.
aegis-ayuda-rastreo = Ulteriori informazioni
    .aria-label = Ulteriori informazioni sulla protezione antitracciamento
aegis-ayuda-cookies = Ulteriori informazioni
    .aria-label = Ulteriori informazioni sui cookie di terze parti
aegis-ayuda-https = Ulteriori informazioni
    .aria-label = Ulteriori informazioni sulla modalità solo HTTPS
aegis-ayuda-olvidar = Ulteriori informazioni
    .aria-label = Ulteriori informazioni su come dimenticare i siti alla chiusura
aegis-ayuda-huella = Ulteriori informazioni
    .aria-label = Ulteriori informazioni sull’impronta digitale
aegis-ayuda-google = Ulteriori informazioni
    .aria-label = Ulteriori informazioni su Google pulito

## Escudos: molestias, excepciones por sitio y Ajustes › Escudos (escudos.sys.mjs, escudos/ajustes.sys.mjs)

aegis-escudos-molestia-activa = Nascosti su tutti i siti
aegis-escudos-molestia-apagada = Disattivato su tutti i siti
aegis-escudos-molestia-permitida-sitio = Consentiti su questo sito

aegis-escudos-excepciones-sitio = Eccezioni per questo sito…
aegis-escudos-excepciones-ninguna = Nessuna

aegis-escudos-grupo-anuncios = Pubblicità
aegis-escudos-grupo-rastreadores = Traccianti
aegis-escudos-grupo-cookies-avisos = Avvisi sui cookie
aegis-escudos-grupo-molestias = Pop-up e banner
aegis-escudos-grupo-antiadblock = Avvisi anti-adblock
aegis-escudos-grupo-cosmetico = Elementi nascosti
aegis-escudos-grupo-scriptlets = Script delle liste

aegis-ajustes-escudos = Scudi
aegis-ajustes-escudos-descripcion = Cosa bloccano gli Scudi su tutti i siti e le eccezioni di ciascun sito.

aegis-ajustes-escudos-nivel-titulo = Livello
aegis-ajustes-escudos-nivel-descripcion = Quanto bloccano gli Scudi su tutti i siti. È la stessa impostazione del pannello.
aegis-ajustes-escudos-nivel-normal = Normale
aegis-ajustes-escudos-nivel-normal-descripcion = Blocca i traccianti noti e la pubblicità delle liste di filtri. Quasi nessun sito si rompe.
aegis-ajustes-escudos-nivel-estricto = Rigoroso
aegis-ajustes-escudos-nivel-estricto-descripcion = Blocca anche video, commenti e pulsanti social che tracciano, e toglie dai link i dati di tracciamento. Alcuni siti potrebbero apparire incompleti.
aegis-ajustes-escudos-nivel-estricto-mas = Rigoroso+ (consigliato)
aegis-ajustes-escudos-nivel-estricto-mas-descripcion = Tutto ciò che fa Rigoroso più una lista di tracciamento più ampia (AdGuard Tracking Protection). Usa un po’ più di memoria.
aegis-ajustes-escudos-nivel-personalizado = Hai cambiato a mano la protezione antitracciamento in Privacy, quindi nessun livello corrisponde. Scegline uno per tornare.
aegis-ajustes-escudos-nivel-nota = Nessun livello rende il blocco invisibile: un sito può accorgersi che mancano le sue pubblicità.

aegis-ajustes-escudos-molestias-titulo = Elementi fastidiosi
aegis-ajustes-escudos-molestias-descripcion = Nascosti su tutti i siti. Per vederli su un sito specifico, aggiungilo in «Eccezioni per sito».
aegis-ajustes-escudos-molestia-cookies-detalle = Banner di consenso. Nasconderne uno non sempre equivale a rifiutare: il sito decide cosa fare senza la tua risposta.
aegis-ajustes-escudos-molestia-ventanas-detalle = Pop-up, banner per installare app, widget e altri elementi fastidiosi.
aegis-ajustes-escudos-molestia-antiadblock-detalle = Avvisi che chiedono di disattivare il blocco. Non funziona su tutti i siti.
aegis-ajustes-escudos-molestias-nota = Ogni gruppo usa liste dei rispettivi autori (uBlock Origin, AdGuard ed EasyList). Quando lo cambi, gli Scudi impiegano qualche secondo a prepararle.

aegis-ajustes-escudos-contador-titulo = Contatore
aegis-ajustes-escudos-contador-descripcion = Cosa conta il numero sul pulsante degli Scudi e nel pannello.
aegis-ajustes-escudos-contador-peticiones = Richieste
aegis-ajustes-escudos-contador-origenes = Origini
aegis-ajustes-escudos-contador-peticiones-detalle = Ogni richiesta bloccata conta una volta, anche se va allo stesso server.
aegis-ajustes-escudos-contador-origenes-detalle = Ogni server bloccato conta una sola volta per pagina, per quante volte ci provi.

aegis-ajustes-escudos-listas-titulo = Liste di filtri
aegis-ajustes-escudos-listas-descripcion = Le regole sono dei loro autori (uBlock Origin, EasyList, AdGuard e Brave). { -brand-short-name } le scarica direttamente da loro, senza cookie.
aegis-ajustes-escudos-listas-activas = { $listas ->
        [one] 1 lista attiva
       *[other] { $listas } liste attive
    }
aegis-ajustes-escudos-ultima = Ultimo aggiornamento: { $fecha }
aegis-ajustes-escudos-actualizar-ahora = Aggiorna ora
aegis-ajustes-escudos-actualizando = Aggiornamento in corso…
aegis-ajustes-escudos-resultado-nuevas = Liste aggiornate
aegis-ajustes-escudos-resultado-iguales = Erano già aggiornate
aegis-ajustes-escudos-resultado-fallos = { $listas ->
        [one] Non è stato possibile scaricare una lista, resta la versione precedente
       *[other] Non è stato possibile scaricare { $listas } liste, restano le versioni precedenti
    }
aegis-ajustes-escudos-resultado-sin-permiso = Manca il permesso in Connessioni per scaricarle
aegis-ajustes-escudos-resultado-error = Impossibile aggiornare. Riprova più tardi
aegis-ajustes-escudos-automatica = Aggiorna le liste automaticamente
aegis-ajustes-escudos-automatica-detalle = Un controllo al giorno; ogni lista viene scaricata solo quando scade.
aegis-ajustes-escudos-automatica-sin-permiso = Richiede il permesso «Elenchi di protezione» in Connessioni.
aegis-ajustes-escudos-sin-conexiones = Finché non lo dai, gli Scudi usano le liste incluse in { -brand-short-name }.
aegis-ajustes-escudos-elegir-conexiones = Scegli le connessioni

aegis-ajustes-escudos-intervalo = Rinnova ogni lista almeno ogni
aegis-ajustes-escudos-intervalo-detalle = Prima, se l’autore lo chiede: alcune liste scadono in poche ore.
aegis-ajustes-escudos-dias = { $dias ->
        [one] 1 giorno
       *[other] { $dias } giorni
    }
aegis-ajustes-escudos-ver-listas = Mostra le liste ({ $listas })
aegis-ajustes-escudos-ocultar-listas = Nascondi le liste

aegis-ajustes-escudos-origen-red = scaricata
aegis-ajustes-escudos-origen-build = inclusa in { -brand-short-name }

aegis-ajustes-escudos-excepciones-titulo = Eccezioni per sito
aegis-ajustes-escudos-excepciones-descripcion = Siti in cui gli Scudi lasciano passare qualcosa. «Consenti tutto» equivale ad abbassare gli Scudi dal pannello.
aegis-ajustes-escudos-excepciones-descripcion-privada = In una finestra anonima, le eccezioni durano finché non chiudi l’ultima finestra anonima. «Consenti tutto» equivale ad abbassare gli Scudi dal pannello.
aegis-ajustes-escudos-anadir-titulo = Aggiungi un sito

aegis-ajustes-escudos-anadir-ejemplo = esempio.it
aegis-ajustes-escudos-anadir = Aggiungi
aegis-ajustes-escudos-anadir-error = Scrivi l’indirizzo di un sito, come esempio.it.
aegis-ajustes-escudos-excepciones-vacio = Nessun sito ha eccezioni.
aegis-ajustes-escudos-sitio-todo = Tutto consentito: Scudi abbassati
aegis-ajustes-escudos-sitio-nada = Ancora niente di consentito
aegis-ajustes-escudos-editar = Modifica
    .aria-label = Modifica le eccezioni di { $sitio }
aegis-ajustes-escudos-cerrar = Chiudi
    .aria-label = Chiudi le eccezioni di { $sitio }
aegis-ajustes-escudos-quitar = Rimuovi
    .aria-label = Rimuovi tutte le eccezioni di { $sitio }
aegis-ajustes-escudos-permitir-todo = Consenti tutto su questo sito
aegis-ajustes-escudos-permitir-todo-detalle = Abbassa gli Scudi: non si blocca niente. È l’interruttore grande del pannello.
aegis-ajustes-escudos-que-permitir = Oppure scegli cosa consentire

aegis-ajustes-escudos-por-ajuste-general = Consentito da un’impostazione generale: è disattivato per tutti i siti.
aegis-ajustes-escudos-por-permitir-todo = Consentito: questo sito ha «Consenti tutto».
aegis-ajustes-escudos-grupo-anuncios-detalle = Richieste a server pubblicitari delle liste di filtri.
aegis-ajustes-escudos-grupo-rastreadores-detalle = Quelli delle liste di filtri. La protezione antitracciamento del browser resta attiva; per toglierla, usa «Consenti tutto».
aegis-ajustes-escudos-grupo-cookies-avisos-detalle = I banner di consenso ai cookie.
aegis-ajustes-escudos-grupo-molestias-detalle = Pop-up, banner di app e widget.
aegis-ajustes-escudos-grupo-antiadblock-detalle = Gli avvisi che chiedono di disattivare il blocco.
aegis-ajustes-escudos-grupo-cosmetico-detalle = Spazi pubblicitari e altri elementi che le liste nascondono nella pagina.
aegis-ajustes-escudos-grupo-scriptlets-detalle = Piccoli script delle liste che disattivano pubblicità e rilevatori nella pagina.

aegis-ayuda-nivel = Ulteriori informazioni
    .aria-label = Ulteriori informazioni sui livelli degli Scudi
aegis-ayuda-molestias = Ulteriori informazioni
    .aria-label = Ulteriori informazioni sugli elementi fastidiosi
aegis-ayuda-contador = Ulteriori informazioni
    .aria-label = Ulteriori informazioni sul contatore
aegis-ayuda-listas = Ulteriori informazioni
    .aria-label = Ulteriori informazioni sulle liste di filtri
aegis-ayuda-excepciones = Ulteriori informazioni
    .aria-label = Ulteriori informazioni sulle eccezioni per sito

## Importar de otros navegadores (migracion/). Nombres de los navegadores de origen en el asistente de importar
## (marcas: no se traducen) y la página de las contraseñas: cómo sacar un CSV de cada uno. Solo los ids que empiezan
## por «aegis-migracion-navegador-firefox» pueden nombrar ese navegador (tools/verificar.py).

aegis-migracion-navegador-firefox = Firefox
aegis-migracion-navegador-aegis = { -brand-short-name }

aegis-migracion-navegador-firefox-csv-titulo = Come importare le password da Firefox
aegis-migracion-navegador-firefox-csv-en = In Firefox:
aegis-migracion-navegador-firefox-csv-paso1 = Digita about:logins nella barra degli indirizzi e premi Invio.
aegis-migracion-navegador-firefox-csv-paso2 = Apri il menu (…) in alto a destra e scegli «Esporta password…».
aegis-migracion-navegador-firefox-csv-paso3 = Conferma e salva il file sul tuo dispositivo.
aegis-migracion-csv-brave-titulo = Come importare le password da Brave
aegis-migracion-csv-brave-en = In Brave:
aegis-migracion-csv-brave-paso1 = Digita brave://password-manager/settings nella barra degli indirizzi e premi Invio.
aegis-migracion-csv-brave-paso2 = In «Esporta password», fai clic su «Scarica file».
aegis-migracion-csv-brave-paso3 = Salva il file sul tuo dispositivo.
aegis-migracion-csv-edge-titulo = Come importare le password da Microsoft Edge
aegis-migracion-csv-edge-en = In Microsoft Edge:
aegis-migracion-csv-edge-paso1 = Digita edge://settings/passwords nella barra degli indirizzi e premi Invio.
aegis-migracion-csv-edge-paso2 = Apri «Altre azioni» (…) accanto alle password salvate e scegli «Esporta password».
aegis-migracion-csv-edge-paso3 = Conferma con il PIN o la password di Windows e salva il file sul tuo dispositivo.
# Último paso, común: vuelve al asistente y elige el CSV con su botón (el de Firefox, «Seleccionar archivo»).
aegis-migracion-csv-final = Torna qui e scegli il file per finire. Contiene le tue password non cifrate: eliminalo appena hai finito.

# Otro Aegis (otro perfil o el de otro equipo): no exporta en claro; las contraseñas pasan con el código de
# transferencia (contrasenas/transferencia/). El botón «Seleccionar archivo» de la página (el de Firefox) elige el
# archivo y luego se pide el código. «-final-ajustes»: cuando el asistente no puede abrir el diálogo (dentro de la
# bienvenida), remite a Ajustes. Los nombres de Ajustes y de los botones, como salen en la interfaz.
aegis-migracion-aegis-contrasenas-titulo = Come trasferire le password da un altro { -brand-short-name }
aegis-migracion-aegis-contrasenas-en = Nell’altro { -brand-short-name } (su questo computer o su un altro):
aegis-migracion-aegis-contrasenas-paso1 = Apri Impostazioni › Password e, in «Trasferisci a un altro { -brand-short-name }», fai clic su «Crea file…».
aegis-migracion-aegis-contrasenas-paso2 = Salva il file e annota il codice di 6 parole che compare.
aegis-migracion-aegis-contrasenas-paso3 = Se è un altro computer, porta il file fin qui (su una chiavetta USB o nel tuo cloud).
aegis-migracion-aegis-contrasenas-final = Torna qui, scegli il file e scrivi il codice. Se preferisci non trasferirle ora, salta questo passaggio per importare il resto.
aegis-migracion-aegis-contrasenas-final-ajustes = Poi aprilo in Impostazioni › Password › «Ricevi da un altro { -brand-short-name }». Per ora, salta questo passaggio per importare il resto.

## Pasar las contraseñas a otro Aegis con el código de 6 palabras (contrasenas/transferencia/): Ajustes › Contraseñas
## y autorrelleno («Transferencia de contraseñas», detrás del cierre automático), los diálogos de pasar y de recibir
## (dialogos/transferencia-*.xhtml, 440 px de ancho: los textos largos pasan a otra línea) y el selector de archivos.
## «Código de transferencia» está en el glosario. Las palabras del código son siempre las de la lista del EFF, en
## inglés: no se traducen ni salen aquí. Honestidad: la caducidad (24 h) y el «una sola vez» los comprueba Aegis al
## abrir el archivo; lo que protege el archivo es el código.

# Ajustes: etiqueta de la sección (en mayúsculas), su descripción y dos filas con su detalle y un botón compacto.
aegis-transferencia-titulo = Trasferimento delle password
aegis-transferencia-descripcion = Trasferisci le tue password a un altro { -brand-short-name } (su questo computer o su un altro) in un file cifrato che si apre solo con un codice di 6 parole. Non passano da nessun server: il file lo porti tu.
aegis-transferencia-pasar = Trasferisci a un altro { -brand-short-name }
aegis-transferencia-pasar-detalle = Crea il file e il suo codice. Il codice si vede una sola volta e il file scade dopo 24 ore.
aegis-transferencia-pasar-boton = Crea file…
aegis-transferencia-recibir = Ricevi da un altro { -brand-short-name }
aegis-transferencia-recibir-detalle = Apre qui il file con il suo codice. Le password che hai già non vengono duplicate.
aegis-transferencia-recibir-boton = Apri file…
# Títulos del selector de archivos del sistema, el nombre del tipo de archivo y el nombre que se propone (sin la
# extensión .aegisvault, que se añade sola).
aegis-transferencia-selector-guardar = Salva il file delle password
aegis-transferencia-selector-abrir = Scegli il file delle password
aegis-transferencia-selector-filtro = Password di { -brand-short-name }
aegis-transferencia-nombre-archivo = Password di { -brand-short-name }
# Mensaje y título del diálogo de Windows Hello al crear el archivo.
aegis-transferencia-autenticacion = Per trasferire le tue password a un altro { -brand-short-name }, inserisci le tue credenziali di Windows. Così proteggi i tuoi account.
aegis-transferencia-autenticacion-titulo = { -brand-short-name }
# Botones comunes de los dos diálogos.
aegis-transferencia-cancelar = Annulla
aegis-transferencia-hecho = Fatto

# Diálogo «Pasar a otro Aegis». Paso 1: qué se lleva y el aviso.
aegis-pasar-ventana = Trasferisci a un altro { -brand-short-name }
aegis-pasar-titulo = Trasferisci le tue password a un altro { -brand-short-name }
aegis-pasar-explicacion = Vengono salvate in un file cifrato. Alla fine vedrai un codice di 6 parole: nell’altro { -brand-short-name }, apri il file in Impostazioni › Password › «Ricevi da un altro { -brand-short-name }» e scrivi il codice.
# $contrasenas: cuántas hay guardadas (1 o más).
aegis-pasar-resumen =
    { $contrasenas ->
        [one] Verrà trasferita 1 password salvata.
       *[other] Verranno trasferite { $contrasenas } password salvate.
    }
aegis-pasar-vacio = Non ci sono password salvate da trasferire.
# Casilla, marcada de serie. $codigos: cuántos códigos de verificación hay guardados.
aegis-pasar-incluir-codigos =
    { $codigos ->
        [one] Includi anche il codice di verifica salvato
       *[other] Includi anche i { $codigos } codici di verifica salvati
    }
aegis-pasar-aviso-titulo = Chi ha il file e il codice ha le tue password
aegis-pasar-aviso-texto = Tieni il file in un posto che controlli e non mandarlo insieme al codice. Appena lo apri nell’altro { -brand-short-name }, eliminalo.
# Solo con la casilla de los códigos marcada.
aegis-pasar-aviso-codigos = Con i codici di verifica, il file contiene entrambi i passaggi di quegli account.
aegis-pasar-limites = Il file scade dopo 24 ore e si può aprire una sola volta in ogni profilo: lo controlla { -brand-short-name } all’apertura. Ciò che lo protegge davvero è il codice.
aegis-pasar-crear = Crea file…
# Paso 2: el código, una sola vez.
aegis-pasar-codigo-titulo = Il tuo codice di trasferimento
aegis-pasar-codigo-explicacion = Scrivilo nell’altro { -brand-short-name } quando apri il file. Scade dopo 24 ore.
aegis-pasar-copiar = Copia il codice
# Tras copiar. $segundos: tras cuántos segundos se borra (60 de serie).
aegis-pasar-copiado = Copiato. Verrà cancellato dagli appunti tra { $segundos } s se è ancora lì.
aegis-pasar-copiado-sin-borrar = Copiato. Svuota gli appunti dopo averlo incollato.
aegis-pasar-copiar-error = Impossibile copiarlo. Annotalo a mano.
aegis-pasar-una-vez-titulo = Non verrà più mostrato
aegis-pasar-una-vez-texto = Annotalo o copialo ora. { -brand-short-name } non lo conserva: se lo perdi, il file non si potrà aprire e bisognerà crearne un altro.
# $archivo: el nombre del archivo; $contrasenas y $codigos: cuántos lleva.
aegis-pasar-guardado =
    In «{ $archivo }»: { $contrasenas ->
        [one] 1 password
       *[other] { $contrasenas } password
    }.
aegis-pasar-guardado-codigos =
    In «{ $archivo }»: { $contrasenas ->
        [one] 1 password
       *[other] { $contrasenas } password
    } e { $codigos ->
        [one] 1 codice di verifica
       *[other] { $codigos } codici di verifica
    }.
aegis-pasar-error-autenticacion = Impossibile verificare la tua identità. Riprova.
aegis-pasar-error-escribir = Impossibile salvare il file. Scegli un’altra cartella e riprova.
aegis-pasar-error = Impossibile creare il file. Riprova.

# Diálogo «Recibir de otro Aegis». Paso 1: el archivo y el código.
aegis-recibir-ventana = Ricevi da un altro { -brand-short-name }
aegis-recibir-titulo = Ricevi le password da un altro { -brand-short-name }
aegis-recibir-explicacion = Scegli il file che hai creato nell’altro { -brand-short-name } e scrivi il suo codice di 6 parole.
aegis-recibir-archivo = File
aegis-recibir-sin-archivo = Nessun file scelto
aegis-recibir-elegir = Scegli…
aegis-recibir-cambiar = Cambia…
aegis-recibir-codigo = Codice di 6 parole
# Debajo del campo: antes de escribir, cuántas palabras lleva o cuál no es del código. $palabras: de 1 a 7 o más.
aegis-recibir-codigo-nota = Le parole in ordine, separate da spazi. Le maiuscole non contano.
aegis-recibir-codigo-cuenta = { $palabras } di 6 parole
aegis-recibir-codigo-desconocida = «{ $palabra }» non è una parola del codice. Controlla come si scrive.
aegis-recibir-limites = Vengono aggiunte alle tue password salvate, protette dalla tua password principale. Quelle che hai già non vengono duplicate; se quella del file è più recente, sostituisce la tua.
aegis-recibir-boton = Ricevi
aegis-recibir-abriendo = Apertura del file…
# Errores. «-incorrecto» no dice si el fallo es del código o del archivo (a propósito).
aegis-recibir-error-incorrecto = Il codice o il file non sono corretti. Controlla le 6 parole e che sia il file che hai creato.
aegis-recibir-error-version = Questo file proviene da una versione più recente di { -brand-short-name }. Aggiorna { -brand-short-name } e riprova.
aegis-recibir-error-caducado = Questo file è scaduto: vale solo 24 ore. Creane un altro nell’altro { -brand-short-name }.
aegis-recibir-error-reloj = La data di questo file è successiva a quella di questo computer. Controlla data e ora su entrambi i computer.
aegis-recibir-error-usado = Questo file è già stato aperto qui e vale una sola volta. Se serve, creane un altro nell’altro { -brand-short-name }.
aegis-recibir-error-leer = Impossibile leggere il file. Controlla che sia ancora al suo posto e riprova.
aegis-recibir-error-sin-principal = Senza password principale non si salvano password. Creala e riprova.
aegis-recibir-error-bloqueada = Serve la tua password principale per salvare le password. Riprova.
aegis-recibir-error = Impossibile ricevere le password. Riprova.
# Paso 2: el resumen (una línea por cada cosa que no sea cero; la primera, siempre) y borrar el archivo. $n: cuántas.
aegis-recibir-hecho-titulo = Password ricevute
aegis-recibir-hecho-explicacion = Ora sono tra le tue password salvate, protette dalla tua password principale.
aegis-recibir-resumen-nuevas =
    { $n ->
        [one] 1 password nuova
       *[other] { $n } password nuove
    }
aegis-recibir-resumen-actualizadas =
    { $n ->
        [one] 1 aggiornata (quella del file era più recente)
       *[other] { $n } aggiornate (quelle del file erano più recenti)
    }
aegis-recibir-resumen-ya =
    { $n ->
        [one] 1 era già salvata
       *[other] { $n } erano già salvate
    }
aegis-recibir-resumen-codigos =
    { $n ->
        [one] 1 codice di verifica nuovo
       *[other] { $n } codici di verifica nuovi
    }
aegis-recibir-resumen-codigos-ya =
    { $n ->
        [one] 1 account aveva già il suo codice di verifica (non modificato)
       *[other] { $n } account avevano già il loro codice di verifica (non modificato)
    }
aegis-recibir-resumen-errores =
    { $n ->
        [one] 1 non è stata aggiunta
       *[other] { $n } non sono state aggiunte
    }
aegis-recibir-borrar-titulo = Elimina il file
aegis-recibir-borrar-texto = Non serve più e, con il file e il codice, chiunque potrebbe leggere le tue password. Eliminalo anche dove l’hai copiato (una chiavetta USB, il tuo cloud).
aegis-recibir-borrar = Elimina il file
aegis-recibir-borrado = File eliminato.
aegis-recibir-borrar-error = Impossibile eliminarlo. Eliminalo dalla sua cartella.
