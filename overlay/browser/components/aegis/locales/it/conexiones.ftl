# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

## about:conexiones (paginas/conexiones.html; conexiones.sys.mjs): a cosa si collega il browser da solo e il permesso
## dell’utente. Appare al primo avvio, prima di qualsiasi connessione. I nomi dei servizi (GitHub, Mozilla, Google,
## Cisco, Disconnect, Remote Settings, Safe Browsing, OpenH264, Widevine, CRLite, Netflix) non si traducono.

conexiones-pestana = Connessioni
conexiones-titulo = Decidi tu cosa si collega
conexiones-entradilla = { -brand-short-name } non si è ancora collegato a nulla. Queste sono le connessioni che fa da solo, senza che tu navighi. Scegli quali permettere.
# Etichetta della scheda (mostrata in maiuscolo).
conexiones-lista-titulo = Connessioni di { -brand-short-name }

conexiones-actualizaciones-nombre = Aggiornamenti di { -brand-short-name }
conexiones-actualizaciones-que = Una volta al giorno chiede a GitHub se c’è una nuova versione e, se c’è, la scarica da lì. GitHub vede il tuo IP e la tua versione di { -brand-short-name }, senza cookie. Senza questo, dovrai cercare gli aggiornamenti a mano in Informazioni su { -brand-short-name }.
conexiones-seguridad-nombre = Elenchi di sicurezza
conexiones-seguridad-que = Certificati revocati (CRLite) e componenti aggiuntivi pericolosi, da Remote Settings (services.mozilla.com). Controlla se ci sono modifiche una volta al giorno. Quel server vede il tuo IP e la tua versione. Senza questo, per sapere se il certificato di un sito è stato revocato, { -brand-short-name } chiede all’autorità che l’ha emesso ogni volta che apri un nuovo sito, spesso senza crittografia: disattivarlo comporta più richieste di questo tipo, non meno.
conexiones-listas-nombre = Elenchi di protezione
conexiones-listas-que = Gli elenchi con cui gli Scudi riconoscono ciò che ti segue. Quelli della protezione antitracciamento, da Remote Settings (basati su quelli di Disconnect): senza di essi non si riconosce nessun tracker, raccoglitore di impronte digitali, cryptominer o pulsante dei social, e non funzionano i sostituti che evitano che un sito si rompa quando vengono bloccati. E le liste di filtri dei loro autori (EasyList, AdGuard, uBlock Origin): senza di esse, gli Scudi usano la copia inclusa in { -brand-short-name }, che invecchia. Si controllano al massimo una volta al giorno e si scarica solo ciò che è cambiato.
conexiones-codecs-nombre = Codec video
conexiones-codecs-que = OpenH264, di Cisco, per le videochiamate: si scarica una volta. Widevine, di Google, per i video protetti (DRM), come quelli di Netflix: solo se un sito lo chiede e tu lo attivi. Poi controlla al massimo una volta al giorno se ci sono nuove versioni (su aus5.mozilla.org e, per Widevine, su Google).
conexiones-traduccion-nombre = Traduzione delle pagine
conexiones-traduccion-que = Traduce i siti sul tuo dispositivo, senza inviarli a nessuno. Solo quando chiedi di tradurre una pagina o scarichi una lingua nelle Impostazioni, scarica il modello di quella lingua (diversi MB) da Remote Settings (services.mozilla.com); l’elenco delle lingue si controlla una volta al giorno. Senza questo, l’opzione di traduzione non appare.
conexiones-safebrowsing-nombre = Safe Browsing di Google
conexiones-safebrowsing-que = Ti avvisa di siti truffa e download pericolosi con gli elenchi di Google, che si aggiornano circa ogni mezz’ora. Per confermare un avviso invia a Google un frammento di un codice calcolato dall’indirizzo, non l’indirizzo.
conexiones-safebrowsing-sin-clave = Non disponibile in questa versione di { -brand-short-name }: manca la sua chiave per il servizio di Google.
conexiones-push-nombre = Notifiche dei siti
conexiones-push-que = Una connessione aperta con un server delle notifiche (push.services.mozilla.com), perché i siti a cui dai il permesso possano avvisarti anche quando non sono aperti. Quel server vede il tuo IP e un identificativo di questo browser.

conexiones-navegar = La navigazione non dipende da questo: quando apri un sito, { -brand-short-name } si collega a esso. Qui c’è solo ciò che succede da solo, senza che tu faccia nulla.
conexiones-cambiar = Le modifiche valgono subito, senza riavviare. Puoi tornare qui quando vuoi da Impostazioni › Privacy.

conexiones-aceptar = Accetta
conexiones-guardar = Salva
conexiones-ahora-no = Non ora
conexiones-ninguna = Non permetterne nessuna
conexiones-estado-aceptadas = Salvato. Da solo, { -brand-short-name } si collegherà solo per ciò che hai lasciato attivo.
conexiones-estado-ninguna = Salvato. { -brand-short-name } non si collegherà a nulla da solo. Senza aggiornamenti né elenchi, resterà indietro sulla sicurezza.

## Impostazioni › Privacy › Connessioni (ajustes.sys.mjs)

# Etichetta di sezione (mostrata in maiuscolo).
conexiones-ajustes-titulo = Connessioni
conexiones-ajustes-ninguna = { -brand-short-name } non si collega a nulla da solo.
# $lista: i nomi dei gruppi attivi, come elenco nella lingua («Aggiornamenti di Aegis ed Elenchi di sicurezza»).
conexiones-ajustes-activas = Da solo, { -brand-short-name } si collega solo per questo: { $lista }.
conexiones-ajustes-elegir = Scegli cosa si collega
