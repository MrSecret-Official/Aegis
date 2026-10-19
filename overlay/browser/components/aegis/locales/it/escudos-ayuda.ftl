# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

## about:escudos, «Cómo funcionan los Escudos» (paginas/escudos-ayuda.html): la ayuda de cada opción del panel de
## Escudos y de la huella digital. Para todo el mundo: de tú, frases cortas y sin jerga. Los nombres de las opciones
## son los del panel (aegis.ftl) y se escriben igual. <strong> se deja tal cual (negrita del nombre de la opción).

escudos-ayuda-pestana = Come funzionano gli Scudi
escudos-ayuda-titulo = Come funzionano gli Scudi
escudos-ayuda-entradilla = Cosa fa ogni opzione del pannello degli Scudi, quando conviene cambiarla e cosa fare se un sito smette di funzionare.
# Etiqueta del índice (se muestra en mayúsculas).
escudos-ayuda-indice = In questa pagina
# Encabezados que se repiten en varias secciones.
escudos-ayuda-h-cuando = Quando usarlo
escudos-ayuda-h-falla = Se un sito non funziona

## Qué son los Escudos y el contador

escudos-ayuda-escudos-titulo = Cosa sono gli Scudi
escudos-ayuda-escudos-que = Ogni sito che apri carica pezzi di altre aziende: annunci, contatori di visite, pulsanti dei social. Molti servono a seguirti da un sito all’altro e a sapere cosa fai. Gli Scudi li bloccano prima che arrivino.
escudos-ayuda-escudos-panel = Il pulsante degli Scudi è l’anello a destra della barra degli indirizzi. Facendo clic si apre il pannello, con ciò che è stato bloccato nella pagina e le opzioni di protezione. Ogni opzione indica se vale solo per il sito che stai guardando o «Su tutti i siti».
escudos-ayuda-contador-titulo = Il contatore
escudos-ayuda-contador-que = Il numero sul pulsante conta ciò che è stato bloccato nella pagina che stai guardando: pubblicità, traccianti, traccianti dei social media, raccoglitori di impronta digitale e cryptominer. Di serie conta ogni richiesta bloccata; in Impostazioni › Scudi › «Contatore» puoi far contare ogni server una sola volta («Origini»). Il numero torna a zero quando cambi pagina.
escudos-ayuda-contador-no = Non conta ciò che viene protetto senza bloccare nulla: i cookie tenuti separati per ogni sito, i dati del browser nascosti né le connessioni passate a HTTPS. Con gli Scudi abbassati, il numero non compare.
escudos-ayuda-contador-total = Sotto il numero grande del pannello vedi quanto è stato bloccato da quando hai installato { -brand-short-name }. Resta solo sul tuo dispositivo e non viene inviato a nessuno. Viene contato a modo suo, quindi non deve per forza coincidere con la somma di ciò che vedi in ogni pagina.

## Escudos del sitio

escudos-ayuda-sitio-titulo = Scudi del sito
escudos-ayuda-sitio-que = L’interruttore grande in alto nel pannello alza o abbassa gli Scudi solo per il sito che stai guardando. Quando li abbassi, la pagina si ricarica senza blocchi e senza la protezione dell’impronta digitale, e il pulsante appare barrato.
escudos-ayuda-sitio-recuerda = { -brand-short-name } se lo ricorda per la prossima volta. Se lo fai in una finestra anonima, viene dimenticato quando la chiudi.
escudos-ayuda-sitio-cuando = Quando un sito di cui ti fidi non funziona bene: un video che non parte, un pagamento che non va avanti o un accesso che torna sempre alla stessa schermata.
escudos-ayuda-sitio-falla = Con gli Scudi abbassati, quel sito torna a caricare ciò che prima veniva bloccato e può seguirti. Se abbassarli non risolve, il problema era un altro: rialzali.

## Rastreadores y anuncios: Normal o Estricto

escudos-ayuda-nivel-titulo = Traccianti e annunci
escudos-ayuda-nivel-que = Scegli quanto bloccano gli Scudi su tutti i siti. { -brand-short-name } è impostato su Rigoroso+. Il livello si sceglie anche in Impostazioni › Scudi.
escudos-ayuda-nivel-normal = <strong>Normale</strong> blocca, in tutte le finestre, la pubblicità delle liste di filtri, i contenuti traccianti della lista di base (annunci e contatori di aziende che tracciano), i cryptominer e i raccoglitori di impronta noti, e i cookie che ti seguono da un sito all’altro, anche quelli dei social media; i loro pulsanti e video incorporati vengono comunque caricati.
escudos-ayuda-nivel-estricto = <strong>Rigoroso</strong> usa inoltre la lista completa dei contenuti traccianti, blocca anche i pulsanti e i post incorporati dei social media e toglie dai link i dati aggiunti per seguirti. Qualche sito può non funzionare.
escudos-ayuda-nivel-personalizado = Se cambi un’opzione singola, come i cookie di terze parti, il livello diventa <strong>Personalizzato</strong>. Per tornare indietro, scegli Normale, Rigoroso o Rigoroso+.
escudos-ayuda-nivel-recarga = Quando cambi livello, la pagina si ricarica.
escudos-ayuda-nivel-cuando = Lascia Rigoroso+ se non hai problemi. Se molti dei siti che usi non funzionano, prova Normale; se è solo uno, meglio abbassare gli Scudi su quel sito.
escudos-ayuda-nivel-falla = In Rigoroso può mancare un video o una mappa incorporati, i commenti o un pulsante «Accedi con…». Abbassa gli Scudi su quel sito e si ricaricherà completo.

## Lo bloqueado en esta página

escudos-ayuda-lista-titulo = Bloccati in questa pagina
escudos-ayuda-lista-que = Questa riga del pannello mostra quali siti sono stati bloccati nella pagina, per gruppi: traccianti e annunci, traccianti dei social media, impronta digitale e cryptominer. Così vedi chi cercava di seguirti.
escudos-ayuda-lista-listas = Ciò che viene bloccato lo decidono la protezione antitracciamento del browser (con le liste di Disconnect) e il bloccatore proprio degli Scudi (con le liste di filtri). Il pulsante «Liste di filtri» apre Impostazioni › Scudi.
escudos-ayuda-lista-falla = Se nella lista vedi qualcosa di cui il sito ha bisogno, come il suo servizio di pagamento o di video, abbassa gli Scudi su quel sito.

## Pasar conexiones a HTTPS

escudos-ayuda-https-titulo = Passa le connessioni a HTTPS
escudos-ayuda-https-que = Con la modalità solo HTTPS, { -brand-short-name } apre sempre la versione cifrata di ogni sito. Così nessuno nella tua rete, come il Wi-Fi di un bar o il tuo fornitore di internet, può leggere o modificare ciò che vedi. È attiva su tutti i siti.
escudos-ayuda-https-sitio = L’interruttore del pannello crea un’eccezione per il sito che stai guardando: potrà aprirsi senza cifratura. Se la modalità solo HTTPS è disattivata nelle Impostazioni, la riga appare spenta.
escudos-ayuda-https-cuando = Quasi mai. Solo per un sito di cui ti fidi senza versione cifrata, come la pagina di configurazione del tuo router.
escudos-ayuda-https-falla = Se un sito non ha una versione cifrata, { -brand-short-name } ti avvisa prima di aprirlo, e da quell’avviso puoi continuare senza cifratura. Tieni presente che, senza cifratura, ciò che scrivi su quel sito viaggia in chiaro.

## Bloquear scripts

escudos-ayuda-scripts-titulo = Blocca script
escudos-ayuda-scripts-que = Bloccare gli script (i programmi che porta ogni sito) su un sito non è ancora disponibile. Il browser non ha ancora un modo affidabile per farlo sito per sito, e { -brand-short-name } non mostra un interruttore che non funziona. Arriverà con il bloccatore proprio degli Scudi.

## Huella digital

escudos-ayuda-huella-titulo = Impronta digitale
escudos-ayuda-huella-que = Un sito può riconoscerti senza cookie mettendo insieme ciò che legge dal tuo browser: la dimensione dello schermo, i caratteri, la scheda grafica, il fuso orario, la lingua… Questa combinazione è la tua impronta digitale. { -brand-short-name } nasconde parte di questi dati o mostra a tutti i siti gli stessi.
escudos-ayuda-huella-donde = Si sceglie nel pannello, alla riga «Impronta digitale», o in Impostazioni › Privacy. Vale per tutti i siti, nelle finestre normali e anonime. Se la cambi dal pannello, la pagina si ricarica.
escudos-ayuda-huella-niveles = I quattro livelli
escudos-ayuda-huella-basica = <strong>Base.</strong> La protezione inclusa nel browser: cambia un po’ ciò che un sito legge dai suoi disegni (il canvas), gli mostra solo i caratteri del sistema e rende uguali alcuni calcoli.
escudos-ayuda-huella-equilibrada = <strong>Bilanciata</strong> (predefinita). Nasconde anche la scheda grafica, i sensori, il tipo di connessione, dettagli dell’audio e del colore dello schermo e altri dati di cui i siti normali non hanno bisogno. Non rompe nulla di comune: accesso, video, mappe, documenti e videochiamate continuano a funzionare.
escudos-ayuda-huella-estricta = <strong>Rigorosa.</strong> Nasconde anche dove si trovano la finestra e il mouse sullo schermo e le barre della finestra, i caratteri (mostra solo quelli predefiniti del sistema), le voci di lettura e ciò che può fare la scheda grafica. Le dimensioni dello schermo, l’audio, i core del processore e il canvas restano come in Bilanciata: cambiarli ti rendeva più facile da riconoscere. Qualche sito può non funzionare: qualche mappa o gioco in 3D non parte, la lettura ad alta voce di alcuni siti resta senza voci e gli schermi touch possono ricevere la versione per mouse.
escudos-ayuda-huella-caja = <strong>Cassaforte.</strong> Nasconde quasi tutto ciò che sa nascondere: non il tema scuro o chiaro, né le dimensioni dello schermo (nasconderle ti rendeva più facile da riconoscere). I siti vedono l’ora UTC, l’inglese, 60 fotogrammi al secondo e una tastiera statunitense, e non vedono le tue impostazioni di accessibilità (contrasto elevato, riduci movimento…). Per leggere un canvas, il sito deve chiederti il permesso. Dei segni agli angoli del sito ti ricordano che è attiva. Molti siti non funzioneranno.
escudos-ayuda-caja-titulo = Cassaforte e il permesso per sito
escudos-ayuda-caja-aviso = Se un sito prova a rilevare la tua impronta in un modo noto, compare un avviso accanto al pulsante degli Scudi: «Continua a bloccare» o «Consenti su questo sito». Compare una volta per sito e sessione. Non riconosce tutti i tentativi: gli altri vengono bloccati comunque, ma senza avviso.
escudos-ayuda-caja-permiso = «Consenti su questo sito», nell’avviso o nel pannello, mette quel sito in Bilanciata; gli altri restano in Cassaforte. Viene salvato come permesso del sito, che puoi togliere in Impostazioni › Privacy, in «Siti con permesso in Cassaforte», o cancellando i dati di quel sito.
escudos-ayuda-caja-limites = Non si può dare da una finestra anonima, perché resterebbe salvato, ma i permessi che hai già valgono anche lì. Non si può dare nemmeno a indirizzi numerici (IP), a «localhost» né ad alcuni domini poco comuni. La lingua, i 60 fotogrammi al secondo e i colori del sistema valgono per tutto il browser e non cambiano con il permesso.
escudos-ayuda-caja-salir = Quando esci da Cassaforte, le tue lingue tornano quelle di prima.
escudos-ayuda-ven-titulo = Cosa vedono ancora i siti
escudos-ayuda-ven-ip = Il tuo indirizzo IP e, con esso, il tuo paese e la tua città approssimativa. Per nasconderlo serve Tor o un proxy.
escudos-ayuda-ven-navegador = Quale browser e quale sistema usi, in modo generico: lo stesso dato di milioni di persone. Non dice mai { -brand-short-name }.
escudos-ayuda-ven-resto = La tua lingua e il tuo fuso orario, tranne in Cassaforte; la dimensione della finestra e se usi il tema scuro o chiaro, sempre.
escudos-ayuda-ven-ocultar = Che nascondi delle cose: poche persone navigano così, e anche questo ti distingue. Succede lo stesso con altri browser per la privacy.
escudos-ayuda-ven-bajados = Se abbassi gli Scudi su un sito, quel sito non ha protezione dell’impronta digitale.
escudos-ayuda-huella-cuando = Bilanciata va bene per quasi tutto. Rigorosa, se accetti che qualche sito non funzioni. Cassaforte, per i momenti in cui vuoi lasciare meno tracce possibile.
escudos-ayuda-huella-falla = Se un sito non funziona in Rigorosa o in Cassaforte, abbassa gli Scudi su quel sito o, in Cassaforte, usa «Consenti su questo sito». Se non funzionano in molti, torna a Bilanciata.

## Cookies de terceros

escudos-ayuda-cookies-titulo = Cookie di terze parti
escudos-ayuda-cookies-que = I cookie sono dati che un sito salva nel tuo browser per ricordarsi di te. Quelli di terze parti appartengono ad altre aziende presenti nel sito che visiti, e servono soprattutto a seguirti da un sito all’altro. Questa opzione vale per tutti i siti.
escudos-ayuda-cookies-rastreo = <strong>Blocca traccianti</strong> (predefinita) blocca i cookie dei traccianti noti e tiene gli altri separati per ogni sito, come in un cassetto a parte. Così un’azienda non può mettere insieme ciò che fai su due siti diversi.
escudos-ayuda-cookies-todas = <strong>Blocca tutti</strong> non lascia entrare nessun cookie di terze parti.
escudos-ayuda-cookies-cuando = «Blocca traccianti» protegge quasi allo stesso modo e rompe molto meno. Scegli «Blocca tutti» solo se vuoi il massimo e accetti che qualcosa non funzioni.
escudos-ayuda-cookies-falla = Con «Blocca tutti» possono non funzionare i pulsanti «Accedi con…», i pagamenti, i commenti e i video incorporati: torna a «Blocca traccianti». Se cambi questa opzione, il livello degli Scudi diventa Personalizzato.

## Olvidar este sitio al cerrar

escudos-ayuda-olvidar-titulo = Dimentica questo sito alla chiusura
escudos-ayuda-olvidar-que = Cancella i cookie e i dati salvati dal sito che stai guardando ogni volta che chiudi { -brand-short-name }. Vale solo per quel sito: gli altri non vengono toccati. Non è come «Dimentica questo sito» della cronologia, che cancella tutto subito.
escudos-ayuda-olvidar-privada = In una finestra anonima è disattivato: una finestra anonima dimentica già tutto quando la chiudi.
escudos-ayuda-olvidar-cuando = Per i siti che usi ogni tanto e che non vuoi che si ricordino di te: negozi, giornali o motori di ricerca di voli.
escudos-ayuda-olvidar-falla = Ogni volta dovrai accedere di nuovo, e il sito avrà dimenticato le tue preferenze, come la lingua, il carrello o la tua risposta all’avviso dei cookie. Se ti dà fastidio, disattivalo per quel sito.

## Oscurecer este sitio

escudos-ayuda-oscuro-titulo = Scurisci questo sito
escudos-ayuda-oscuro-que = Questa riga compare solo se hai attivato «Siti in modalità scura» in Impostazioni › Aspetto. Disattivala perché il sito che stai guardando mantenga i suoi colori. Il cambio si vede subito, senza ricaricare.
escudos-ayuda-oscuro-falla = L’oscuramento automatico a volte sbaglia: un logo che non si vede o un testo con poco contrasto. Disattivalo su quel sito. Tieni presente che un sito può accorgersi che il suo aspetto è stato cambiato.

## Google limpio

escudos-ayuda-google-titulo = Google pulito
escudos-ayuda-google-que = Sui siti di Google e di YouTube, { -brand-short-name } blocca i loro dati di utilizzo e i loro annunci, toglie dalle ricerche i dati di tracciamento e fa andare i link dei risultati direttamente al sito, senza passare da Google. Ciò che blocca si somma al contatore.
escudos-ayuda-google-busqueda = Le ricerche su Google fatte dalla barra degli indirizzi chiedono solo risultati web, senza risposte dell’IA né moduli. Dentro Google puoi tornare a «Tutti».
escudos-ayuda-google-pasa = Lascia passare di proposito ciò che serve: l’accesso, i captcha, Gmail, Drive, Maps, la riproduzione di YouTube e la sua cronologia.
escudos-ayuda-google-limites-titulo = Cosa non fa
escudos-ayuda-google-limites = Se abbassi gli Scudi su un sito di Google, smette di agire su quel sito. Puoi disattivarlo in Impostazioni › Privacy › Google. Google vede ancora il tuo IP e ciò che cerchi, e se accedi, sa chi sei nei suoi servizi. Gli annunci che arrivano dentro la pagina, come i risultati sponsorizzati o gli annunci video di YouTube, non vengono ancora tolti.

## Lo que los Escudos no hacen

escudos-ayuda-limites-titulo = Cosa non fanno gli Scudi
escudos-ayuda-limites-ip = <strong>Non nascondono il tuo indirizzo IP.</strong> Tutti i siti che visiti lo vedono e, con esso, sanno più o meno dove ti trovi. Per nasconderlo serve Tor o un proxy.
escudos-ayuda-limites-detectable = <strong>Non sono invisibili.</strong> Un sito può accorgersi che blocchi delle cose o nascondi dei dati, e qualcuno te lo dirà. Nessun bloccatore lo evita al 100%.
escudos-ayuda-limites-tor = <strong>{ -brand-short-name } non è Tor Browser.</strong> Tor Browser fa sembrare tutti i suoi utenti lo stesso browser e nasconde l’IP. { -brand-short-name } riduce ciò che un sito può sapere di te, ma un sito ostinato può ancora distinguerti.
escudos-ayuda-limites-cuenta = <strong>Non ti nascondono dal sito in cui accedi.</strong> Se entri nel tuo account, quel sito sa chi sei. Gli Scudi fanno sì che non ti segua su altri siti.

## Lo que viene

escudos-ayuda-pronto-titulo = In arrivo
escudos-ayuda-pronto-que = Questa pagina descrive solo ciò che funziona oggi. Questo non c’è ancora:
escudos-ayuda-pronto-motor = Scegliere le liste di filtri una per una e aggiungere le tue.
escudos-ayuda-pronto-scripts = Bloccare gli script sito per sito.

## Estricto+, molestias, excepciones por sitio y listas de filtros (los nombres, como en el panel y en Ajustes › Escudos)

escudos-ayuda-nivel-estricto-mas = <strong>Rigoroso+</strong> (quello di serie) è Rigoroso con una lista di tracciamento più ampia, AdGuard Tracking Protection. Usa un po’ più di memoria.
escudos-ayuda-molestias-titulo = Elementi fastidiosi
escudos-ayuda-molestias-que = Oltre a pubblicità e traccianti, gli Scudi nascondono tre tipi di elementi fastidiosi, ognuno con il suo interruttore: <strong>Avvisi sui cookie</strong> (i banner di consenso), <strong>Pop-up e banner</strong> (finestre pop-up, banner per installare app e widget) e <strong>Avvisi anti-adblock</strong> (quelli che chiedono di disattivare il blocco). Sono attivi di serie.
escudos-ayuda-molestias-donde = Si attivano e si disattivano per tutti i siti nelle opzioni avanzate del pannello o in Impostazioni › Scudi. Per un solo sito, usa le sue eccezioni.
escudos-ayuda-molestias-cookies = Nascondere un avviso sui cookie non sempre equivale a rifiutarli: se non rispondi, il sito fa quello che fa di serie, e alcuni salvano cookie comunque.
escudos-ayuda-molestias-falla = Se un sito non ti lascia continuare senza rispondere all’avviso, o un pulsante che ti serve è in una finestra nascosta, aggiungi per quel sito un’eccezione di quel gruppo. Gli avvisi anti-adblock non spariscono su tutti i siti: alcuni si accorgono del blocco in altri modi.
escudos-ayuda-excepciones-titulo = Eccezioni per sito
escudos-ayuda-excepciones-que = Un’eccezione fa sì che gli Scudi lascino passare qualcosa su un sito specifico. Si gestiscono in Impostazioni › Scudi › «Eccezioni per sito» e, dal pannello, con «Eccezioni per questo sito…». Valgono per tutto il sito (esempio.it e i suoi sottodomini).
escudos-ayuda-excepciones-todo = <strong>Consenti tutto</strong> equivale ad abbassare gli Scudi con l’interruttore grande del pannello: non si blocca niente. È la soluzione più rapida quando un sito non funziona.
escudos-ayuda-excepciones-grupos = Se preferisci regolare meglio, scegli cosa consentire: pubblicità, traccianti delle liste, avvisi sui cookie, pop-up e banner, avvisi anti-adblock, elementi nascosti o script delle liste. Il resto continua a essere bloccato.
escudos-ayuda-excepciones-herencia = Se un gruppo è disattivato per tutti i siti, nell’eccezione appare come «Consentito da un’impostazione generale» e lì non si può cambiare: per cambiarlo, riattivalo in generale.
escudos-ayuda-excepciones-guardado = Sono salvate sul tuo dispositivo come permessi del sito. Se dimentichi il sito o cancelli i suoi dati o la cronologia, se ne vanno con loro. Quelle che crei in una finestra anonima durano finché non chiudi l’ultima finestra anonima.
escudos-ayuda-excepciones-rastreadores = L’eccezione dei traccianti riguarda solo le liste di filtri: la protezione antitracciamento del browser resta attiva. Per toglierla, usa «Consenti tutto».
escudos-ayuda-listas-titulo = Liste di filtri
escudos-ayuda-listas-que = Ciò che blocca il bloccatore proprio degli Scudi lo decidono le liste di filtri dei loro autori: uBlock Origin, EasyList, AdGuard e Brave. Il livello e gli elementi fastidiosi scelgono quali usare, più quelle della lingua di { -brand-short-name }.
escudos-ayuda-listas-copia = { -brand-short-name } include una copia delle liste, quindi blocca fin dal primo momento, senza collegarsi a nulla.
escudos-ayuda-listas-actualizar = Se in Connessioni consenti «Elenchi di protezione», le liste si rinnovano da sole: un controllo al giorno, e ogni lista viene chiesta al suo autore solo quando scade, senza cookie e senza dire quali siti visiti. Se una lista nuova arriva danneggiata, resta la precedente. In Impostazioni › Scudi puoi disattivarlo, scegliere ogni quanto si rinnovano o scaricarle subito.
