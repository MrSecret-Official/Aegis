# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

## about:escudos, «Cómo funcionan los Escudos» (paginas/escudos-ayuda.html): la ayuda de cada opción del panel de
## Escudos y de la huella digital. Para todo el mundo: de tú, frases cortas y sin jerga. Los nombres de las opciones
## son los del panel (aegis.ftl) y se escriben igual. <strong> se deja tal cual (negrita del nombre de la opción).

escudos-ayuda-pestana = So funktionieren die Schilde
escudos-ayuda-titulo = So funktionieren die Schilde
escudos-ayuda-entradilla = Was jede Option im Schilde-Panel macht, wann du sie ändern solltest und was du tun kannst, wenn eine Website nicht mehr funktioniert.
# Etiqueta del índice (se muestra en mayúsculas).
escudos-ayuda-indice = Auf dieser Seite
# Encabezados que se repiten en varias secciones.
escudos-ayuda-h-cuando = Wann sinnvoll
escudos-ayuda-h-falla = Wenn eine Website nicht funktioniert

## Qué son los Escudos y el contador

escudos-ayuda-escudos-titulo = Was die Schilde sind
escudos-ayuda-escudos-que = Jede Website, die du öffnest, lädt Teile anderer Firmen: Werbung, Besucherzähler, Social-Media-Schaltflächen. Viele davon sollen dir von Website zu Website folgen und herausfinden, was du tust. Die Schilde blockieren sie, bevor sie ankommen.
escudos-ayuda-escudos-panel = Die Schaltfläche der Schilde ist der Ring rechts in der Adressleiste. Ein Klick öffnet das Panel mit dem, was auf der Seite blockiert wurde, und den Schutzoptionen. Bei jeder Option steht, ob sie nur für die aktuelle Website gilt oder „Auf allen Websites“.
escudos-ayuda-contador-titulo = Der Zähler
escudos-ayuda-contador-que = Die Zahl auf der Schaltfläche zählt, was auf der aktuellen Seite blockiert wurde: Werbung, Tracker, Social-Media-Tracker, Fingerprinter und Krypto-Miner. Standardmäßig zählt jede blockierte Anfrage; unter Einstellungen › Schilde › „Zähler“ kannst du jeden Server nur einmal zählen lassen („Ursprünge“). Die Zahl beginnt auf jeder neuen Seite wieder bei null.
escudos-ayuda-contador-no = Nicht gezählt wird Schutz, der nichts blockiert: Cookies, die für jede Website getrennt gespeichert werden, verborgene Browserdaten und Verbindungen, die auf HTTPS umgestellt werden. Wenn die Schilde deaktiviert sind, wird keine Zahl angezeigt.
escudos-ayuda-contador-total = Unter der großen Zahl im Panel siehst du, wie viel seit der Installation von { -brand-short-name } blockiert wurde. Das bleibt nur auf deinem Gerät und wird nirgendwohin gesendet. Es wird auf eigene Weise gezählt und muss daher nicht mit der Summe der einzelnen Seiten übereinstimmen.

## Escudos del sitio

escudos-ayuda-sitio-titulo = Schilde für diese Website
escudos-ayuda-sitio-que = Der große Schalter oben im Panel aktiviert oder deaktiviert die Schilde nur für die aktuelle Website. Beim Deaktivieren lädt die Seite ohne Blockierungen und ohne Fingerprinting-Schutz neu, und die Schaltfläche erscheint durchgestrichen.
escudos-ayuda-sitio-recuerda = { -brand-short-name } merkt sich das für das nächste Mal. In einem privaten Fenster wird es beim Schließen vergessen.
escudos-ayuda-sitio-cuando = Wenn eine Website, der du vertraust, nicht richtig funktioniert: ein Video startet nicht, eine Zahlung geht nicht weiter oder die Anmeldung landet immer wieder auf demselben Bildschirm.
escudos-ayuda-sitio-falla = Mit deaktivierten Schilden lädt diese Website wieder alles, was vorher blockiert war, und kann dir folgen. Hilft das Deaktivieren nicht, lag das Problem woanders: Aktiviere sie wieder.

## Rastreadores y anuncios: Normal o Estricto

escudos-ayuda-nivel-titulo = Tracker und Werbung
escudos-ayuda-nivel-que = Wähle, wie viel die Schilde auf allen Websites blockieren. { -brand-short-name } ist auf Streng+ eingestellt. Du kannst die Stufe auch unter Einstellungen › Schilde wählen.
escudos-ayuda-nivel-normal = <strong>Normal</strong> blockiert in allen Fenstern Werbung aus den Filterlisten, verfolgende Inhalte der Basisliste (Werbung und Zähler von Firmen, die dich verfolgen), Krypto-Miner und bekannte Fingerprinter sowie Cookies, die dir von Website zu Website folgen, auch die von sozialen Netzwerken; deren eingebettete Schaltflächen und Videos werden trotzdem geladen.
escudos-ayuda-nivel-estricto = <strong>Streng</strong> nutzt zusätzlich die vollständige Liste verfolgender Inhalte, blockiert auch Schaltflächen und eingebettete Beiträge sozialer Netzwerke und entfernt aus Links die Daten, die angehängt werden, um dir zu folgen. Manche Websites können Probleme haben.
escudos-ayuda-nivel-personalizado = Wenn du eine einzelne Option änderst, etwa die Drittanbieter-Cookies, wechselt die Stufe zu <strong>Benutzerdefiniert</strong>. Wähle Normal, Streng oder Streng+, um zurückzukehren.
escudos-ayuda-nivel-recarga = Wenn du die Stufe änderst, lädt die Seite neu.
escudos-ayuda-nivel-cuando = Bleib bei Streng+, solange alles funktioniert. Wenn viele deiner Websites nicht funktionieren, probiere Normal; ist es nur eine, deaktiviere besser die Schilde für sie.
escudos-ayuda-nivel-falla = Bei Streng können ein eingebettetes Video oder eine Karte, die Kommentare oder eine Schaltfläche „Anmelden mit …“ fehlen. Deaktiviere die Schilde für diese Website, dann lädt sie vollständig neu.

## Lo bloqueado en esta página

escudos-ayuda-lista-titulo = Auf dieser Seite blockiert
escudos-ayuda-lista-que = Diese Zeile im Panel zeigt, welche Websites auf der Seite blockiert wurden, nach Gruppen: Tracker und Werbung, Social-Media-Tracker, Fingerprinting und Krypto-Miner. So siehst du, wer dir folgen wollte.
escudos-ayuda-lista-listas = Was blockiert wird, bestimmen der Tracking-Schutz des Browsers (mit den Listen von Disconnect) und der eigene Blocker der Schilde (mit den Filterlisten). Die Schaltfläche „Filterlisten“ öffnet Einstellungen › Schilde.
escudos-ayuda-lista-falla = Steht in der Liste etwas, das die Website braucht, etwa ihr Zahlungs- oder Videodienst, deaktiviere die Schilde für diese Website.

## Pasar conexiones a HTTPS

escudos-ayuda-https-titulo = Verbindungen auf HTTPS umstellen
escudos-ayuda-https-que = Mit dem Nur-HTTPS-Modus öffnet { -brand-short-name } immer die verschlüsselte Version jeder Website. So kann niemand in deinem Netzwerk, etwa im WLAN eines Cafés oder bei deinem Internetanbieter, mitlesen oder verändern, was du siehst. Er ist für alle Websites aktiviert.
escudos-ayuda-https-sitio = Der Schalter im Panel macht eine Ausnahme für die aktuelle Website: Sie darf unverschlüsselt öffnen. Ist der Nur-HTTPS-Modus in den Einstellungen deaktiviert, erscheint die Zeile ausgegraut.
escudos-ayuda-https-cuando = Fast nie. Nur für eine vertrauenswürdige Website ohne verschlüsselte Version, etwa die Einstellungsseite deines Routers.
escudos-ayuda-https-falla = Hat eine Website keine verschlüsselte Version, warnt dich { -brand-short-name } vor dem Öffnen, und in dieser Warnung kannst du unverschlüsselt fortfahren. Bedenke: Ohne Verschlüsselung kann jeder mitlesen, was du auf dieser Website eingibst.

## Bloquear scripts

escudos-ayuda-scripts-titulo = Skripte blockieren
escudos-ayuda-scripts-que = Skripte (die Programme, die jede Website mitbringt) auf einer Website zu blockieren, ist noch nicht verfügbar. Der Browser hat noch keinen zuverlässigen Weg, das pro Website zu tun, und { -brand-short-name } zeigt keinen Schalter, der nicht funktioniert. Es kommt mit dem eigenen Blocker der Schilde.

## Huella digital

escudos-ayuda-huella-titulo = Fingerprinting
escudos-ayuda-huella-que = Eine Website kann dich ohne Cookies erkennen, indem sie kombiniert, was sie aus deinem Browser liest: Bildschirmgröße, Schriftarten, Grafikkarte, Zeitzone, Sprache … Diese Kombination ist dein digitaler Fingerabdruck. { -brand-short-name } verbirgt einen Teil dieser Daten oder zeigt allen Websites dieselben Werte.
escudos-ayuda-huella-donde = Du wählst es im Panel in der Zeile „Fingerprinting“ oder unter Einstellungen › Datenschutz. Es gilt für alle Websites, in normalen und privaten Fenstern. Wenn du es im Panel änderst, lädt die Seite neu.
escudos-ayuda-huella-niveles = Die vier Stufen
escudos-ayuda-huella-basica = <strong>Einfach.</strong> Der Schutz, der im Browser enthalten ist: Er verändert leicht, was eine Website aus ihren Zeichnungen (dem Canvas) liest, zeigt ihr nur die Systemschriftarten und vereinheitlicht einige Berechnungen.
escudos-ayuda-huella-equilibrada = <strong>Ausgewogen</strong> (Standard). Verbirgt zusätzlich Grafikkarte, Sensoren, Verbindungstyp, Details zu Audio und Bildschirmfarbe und weitere Daten, die normale Websites nicht brauchen. Nichts Alltägliches geht kaputt: Anmeldung, Video, Karten, Dokumente und Videoanrufe funktionieren weiter.
escudos-ayuda-huella-estricta = <strong>Streng.</strong> Verbirgt zusätzlich, wo Fenster und Maus auf dem Bildschirm sind, und die Leisten des Fensters, die Schriftarten (nur die Standardschriften des Systems), die Vorlesestimmen und die Fähigkeiten der Grafikkarte. Bildschirmgröße, Audio, Prozessorkerne und Canvas bleiben wie bei Ausgewogen: Sie zu ändern machte dich leichter erkennbar. Manche Websites können Probleme haben: Manche 3D-Karten oder -Spiele starten nicht, das Vorlesen auf manchen Websites hat keine Stimmen und Touchscreens bekommen vielleicht die Mausversion.
escudos-ayuda-huella-caja = <strong>Tresor.</strong> Verbirgt fast alles, was er verbergen kann: nicht, ob du ein dunkles oder helles Theme nutzt, und nicht die Bildschirmgröße (sie zu verbergen machte dich leichter erkennbar). Websites sehen die UTC-Zeit, Englisch, 60 Bilder pro Sekunde und eine US-Tastatur und sehen deine Barrierefreiheitseinstellungen nicht (hoher Kontrast, Bewegung reduzieren …). Um ein Canvas zu lesen, muss die Website dich um Erlaubnis bitten. Markierungen an den Ecken der Website erinnern dich daran, dass er aktiv ist. Viele Websites werden nicht funktionieren.
escudos-ayuda-caja-titulo = Der Tresor und die Erlaubnis pro Website
escudos-ayuda-caja-aviso = Versucht eine Website, deinen Fingerabdruck auf bekannte Weise auszulesen, erscheint neben der Schaltfläche der Schilde ein Hinweis: „Weiter blockieren“ oder „Auf dieser Website erlauben“. Er kommt einmal pro Website und Sitzung. Er erkennt nicht jeden Versuch: Die übrigen werden trotzdem blockiert, nur ohne Hinweis.
escudos-ayuda-caja-permiso = „Auf dieser Website erlauben“ im Hinweis oder im Panel setzt diese Website auf Ausgewogen; alle anderen bleiben im Tresor. Es wird als Website-Berechtigung gespeichert, die du unter Einstellungen › Datenschutz bei „Websites mit Erlaubnis im Tresor“ entfernen kannst oder indem du die Daten dieser Website löschst.
escudos-ayuda-caja-limites = In einem privaten Fenster kann sie nicht erteilt werden, weil sie gespeichert bliebe, aber bestehende Erlaubnisse gelten auch dort. Auch für Zahlenadressen (IP), „localhost“ und einige ungewöhnliche Domains geht es nicht. Sprache, 60 Bilder pro Sekunde und Systemfarben gelten für den ganzen Browser und ändern sich mit der Erlaubnis nicht.
escudos-ayuda-caja-salir = Wenn du den Tresor verlässt, werden deine Sprachen wieder wie vorher.
escudos-ayuda-ven-titulo = Was Websites weiterhin sehen
escudos-ayuda-ven-ip = Deine IP-Adresse und damit dein Land und ungefähr deine Stadt. Um sie zu verbergen, brauchst du Tor oder einen Proxy.
escudos-ayuda-ven-navegador = Welchen Browser und welches System du nutzt, allgemein gehalten: dieselbe Angabe wie bei Millionen Menschen. Dort steht nie { -brand-short-name }.
escudos-ayuda-ven-resto = Deine Sprache und deine Zeitzone, außer im Tresor; die Fenstergröße und ob du ein dunkles oder helles Theme nutzt, immer.
escudos-ayuda-ven-ocultar = Dass du Dinge verbirgst: Wenige Menschen surfen so, und auch das unterscheidet dich. Bei anderen privaten Browsern ist es genauso.
escudos-ayuda-ven-bajados = Wenn du die Schilde für eine Website deaktivierst, hat diese Website keinen Fingerprinting-Schutz.
escudos-ayuda-huella-cuando = Ausgewogen passt für fast alles. Streng, wenn du in Kauf nimmst, dass manche Websites nicht funktionieren. Den Tresor für Momente, in denen du möglichst wenig Spuren hinterlassen willst.
escudos-ayuda-huella-falla = Funktioniert eine Website bei Streng oder im Tresor nicht, deaktiviere die Schilde für sie oder nutze im Tresor „Auf dieser Website erlauben“. Funktionieren viele nicht, kehre zu Ausgewogen zurück.

## Cookies de terceros

escudos-ayuda-cookies-titulo = Drittanbieter-Cookies
escudos-ayuda-cookies-que = Cookies sind Daten, die eine Website in deinem Browser speichert, um sich an dich zu erinnern. Drittanbieter-Cookies gehören anderen Firmen, die in die besuchte Website eingebunden sind, und dienen vor allem dazu, dir von Website zu Website zu folgen. Diese Option gilt für alle Websites.
escudos-ayuda-cookies-rastreo = <strong>Tracker blockieren</strong> (Standard) blockiert Cookies bekannter Tracker und speichert alle anderen für jede Website getrennt, wie in einer eigenen Schublade. So kann eine Firma nicht zusammenführen, was du auf zwei verschiedenen Websites tust.
escudos-ayuda-cookies-todas = <strong>Alle blockieren</strong> lässt keine Drittanbieter-Cookies zu.
escudos-ayuda-cookies-cuando = „Tracker blockieren“ schützt fast genauso gut und macht viel weniger kaputt. Wähle „Alle blockieren“ nur, wenn du das Maximum willst und in Kauf nimmst, dass manches nicht funktioniert.
escudos-ayuda-cookies-falla = Mit „Alle blockieren“ können Schaltflächen wie „Anmelden mit …“, Zahlungen, Kommentare und eingebettete Videos ausfallen: Kehre zu „Tracker blockieren“ zurück. Wenn du diese Option änderst, wechselt die Stufe der Schilde zu Benutzerdefiniert.

## Olvidar este sitio al cerrar

escudos-ayuda-olvidar-titulo = Website beim Schließen vergessen
escudos-ayuda-olvidar-que = Löscht die Cookies und Daten der aktuellen Website jedes Mal, wenn du { -brand-short-name } schließt. Das gilt nur für diese Website: Andere bleiben unberührt. Es ist nicht dasselbe wie „Diese Website vergessen“ in der Chronik, das sofort alles löscht.
escudos-ayuda-olvidar-privada = In einem privaten Fenster ist es deaktiviert: Ein privates Fenster vergisst ohnehin alles, wenn du es schließt.
escudos-ayuda-olvidar-cuando = Für Websites, die du ab und zu nutzt und die sich nicht an dich erinnern sollen: Shops, Zeitungen oder Flugsuchen.
escudos-ayuda-olvidar-falla = Du musst dich jedes Mal neu anmelden, und die Website hat deine Einstellungen vergessen, etwa die Sprache, den Warenkorb oder deine Antwort auf den Cookie-Hinweis. Wenn dich das stört, schalte es für diese Website aus.

## Oscurecer este sitio

escudos-ayuda-oscuro-titulo = Diese Website abdunkeln
escudos-ayuda-oscuro-que = Diese Zeile erscheint nur, wenn du „Dunkle Websites“ unter Einstellungen › Erscheinungsbild eingeschaltet hast. Schalte sie aus, damit die aktuelle Website ihre eigenen Farben behält. Die Änderung wirkt sofort, ohne Neuladen.
escudos-ayuda-oscuro-falla = Das automatische Abdunkeln liegt manchmal daneben: ein Logo, das man nicht sieht, oder Text mit wenig Kontrast. Schalte es für diese Website aus. Bedenke, dass eine Website bemerken kann, dass ihr Aussehen verändert wurde.

## Google limpio

escudos-ayuda-google-titulo = Sauberes Google
escudos-ayuda-google-que = Auf den Websites von Google und YouTube blockiert { -brand-short-name } deren Nutzungsdaten und Werbung, entfernt Tracking-Daten aus Suchen und lässt Links in den Ergebnissen direkt zur Website führen statt über Google. Was dabei blockiert wird, zählt im Zähler mit.
escudos-ayuda-google-busqueda = Google-Suchen aus der Adressleiste fordern nur Webergebnisse an, ohne KI-Antworten oder Zusatzmodule. In Google kannst du wieder zu „Alle“ wechseln.
escudos-ayuda-google-pasa = Was nötig ist, wird absichtlich durchgelassen: Anmeldung, Captchas, Gmail, Drive, Maps, die Wiedergabe auf YouTube und dessen Verlauf.
escudos-ayuda-google-limites-titulo = Was es nicht macht
escudos-ayuda-google-limites = Wenn du die Schilde für eine Google-Website deaktivierst, greift es dort nicht mehr ein. Du kannst es unter Einstellungen › Datenschutz › Google ausschalten. Google sieht weiterhin deine IP und deine Suchen, und wenn du angemeldet bist, weiß Google in seinen Diensten, wer du bist. Werbung, die direkt in der Seite steckt, etwa gesponserte Ergebnisse oder Videowerbung auf YouTube, wird noch nicht entfernt.

## Lo que los Escudos no hacen

escudos-ayuda-limites-titulo = Was die Schilde nicht tun
escudos-ayuda-limites-ip = <strong>Sie verbergen deine IP-Adresse nicht.</strong> Jede Website, die du besuchst, sieht sie und weiß damit ungefähr, wo du bist. Um sie zu verbergen, brauchst du Tor oder einen Proxy.
escudos-ayuda-limites-detectable = <strong>Sie sind nicht unsichtbar.</strong> Eine Website kann bemerken, dass du Dinge blockierst oder Daten verbirgst, und manche sagen es dir. Kein Blocker kann das zu 100 % verhindern.
escudos-ayuda-limites-tor = <strong>{ -brand-short-name } ist nicht Tor Browser.</strong> Tor Browser lässt alle seine Nutzer wie denselben Browser aussehen und verbirgt die IP. { -brand-short-name } verringert, was eine Website über dich erfahren kann, aber eine hartnäckige Website kann dich trotzdem unterscheiden.
escudos-ayuda-limites-cuenta = <strong>Sie verbergen dich nicht vor der Website, bei der du dich anmeldest.</strong> Wenn du dich in dein Konto einloggst, weiß diese Website, wer du bist. Die Schilde sorgen dafür, dass sie dir nicht auf andere Websites folgt.

## Lo que viene

escudos-ayuda-pronto-titulo = Was noch kommt
escudos-ayuda-pronto-que = Diese Seite beschreibt nur, was heute funktioniert. Das gibt es noch nicht:
escudos-ayuda-pronto-motor = Filterlisten einzeln auswählen und eigene hinzufügen.
escudos-ayuda-pronto-scripts = Skripte pro Website blockieren.

## Estricto+, molestias, excepciones por sitio y listas de filtros (los nombres, como en el panel y en Ajustes › Escudos)

escudos-ayuda-nivel-estricto-mas = <strong>Streng+</strong> (die Standardstufe) ist Streng mit einer umfangreicheren Tracking-Liste, AdGuard Tracking Protection. Sie braucht etwas mehr Speicher.
escudos-ayuda-molestias-titulo = Belästigungen
escudos-ayuda-molestias-que = Neben Werbung und Trackern blenden die Schilde drei Arten von Belästigungen aus, jede mit eigenem Schalter: <strong>Cookie-Hinweise</strong> (Einwilligungsbanner), <strong>Pop-ups und Banner</strong> (Pop-up-Fenster, Banner zum Installieren von Apps und Widgets) und <strong>Anti-Adblock-Hinweise</strong> (die dich bitten, den Blocker abzuschalten). Sie sind standardmäßig an.
escudos-ayuda-molestias-donde = Du schaltest sie für alle Websites in den erweiterten Optionen des Panels oder unter Einstellungen › Schilde ein und aus. Für eine einzelne Website nutzt du ihre Ausnahmen.
escudos-ayuda-molestias-cookies = Einen Cookie-Hinweis auszublenden heißt nicht immer, Cookies abzulehnen: Wenn du nicht antwortest, macht die Website, was sie standardmäßig tut, und manche speichern trotzdem Cookies.
escudos-ayuda-molestias-falla = Wenn eine Website dich nicht weitermachen lässt, ohne auf ihren Hinweis zu antworten, oder eine benötigte Schaltfläche in einem ausgeblendeten Fenster steckt, füge für sie eine Ausnahme dieser Gruppe hinzu. Anti-Adblock-Hinweise verschwinden nicht auf jeder Website: Manche merken das Blockieren auf andere Weise.
escudos-ayuda-excepciones-titulo = Ausnahmen pro Website
escudos-ayuda-excepciones-que = Eine Ausnahme lässt die Schilde auf einer bestimmten Website etwas durch. Du verwaltest sie unter Einstellungen › Schilde › „Ausnahmen pro Website“ und im Panel über „Ausnahmen für diese Website …“. Sie gelten für die ganze Website (beispiel.de und ihre Subdomains).
escudos-ayuda-excepciones-todo = <strong>Alles erlauben</strong> ist dasselbe, wie die Schilde mit dem großen Schalter im Panel zu deaktivieren: Nichts wird blockiert. Das hilft am schnellsten, wenn eine Website nicht funktioniert.
escudos-ayuda-excepciones-grupos = Wenn du es genauer willst, wähle, was erlaubt ist: Werbung, Tracker aus den Listen, Cookie-Hinweise, Pop-ups und Banner, Anti-Adblock-Hinweise, ausgeblendete Elemente oder Skripte der Listen. Alles andere bleibt blockiert.
escudos-ayuda-excepciones-herencia = Ist eine Gruppe für alle Websites aus, zeigt die Ausnahme sie als „Durch eine allgemeine Einstellung erlaubt“, und du kannst sie dort nicht ändern: Schalte sie dafür allgemein wieder ein.
escudos-ayuda-excepciones-guardado = Sie werden auf deinem Gerät als Website-Berechtigungen gespeichert. Wenn du die Website vergisst oder ihre Daten oder die Chronik löschst, verschwinden sie mit. Ausnahmen aus einem privaten Fenster gelten, bis du das letzte private Fenster schließt.
escudos-ayuda-excepciones-rastreadores = Die Ausnahme für Tracker betrifft nur die Filterlisten: Der Tracking-Schutz des Browsers bleibt aktiv. Um auch ihn abzuschalten, nutze „Alles erlauben“.
escudos-ayuda-listas-titulo = Filterlisten
escudos-ayuda-listas-que = Was der eigene Blocker der Schilde blockiert, bestimmen die Filterlisten ihrer Autoren: uBlock Origin, EasyList, AdGuard und Brave. Die Stufe und die Belästigungen legen fest, welche genutzt werden; dazu kommen die für die Sprache von { -brand-short-name }.
escudos-ayuda-listas-copia = { -brand-short-name } bringt eine Kopie der Listen mit und blockiert deshalb vom ersten Moment an, ohne sich mit irgendetwas zu verbinden.
escudos-ayuda-listas-actualizar = Wenn du unter Verbindungen „Schutzlisten“ erlaubst, erneuern sich die Listen selbst: eine Prüfung pro Tag, und jede Liste wird erst bei ihrem Ablauf bei ihrem Autor abgerufen, ohne Cookies und ohne zu verraten, welche Websites du besuchst. Kommt eine neue Liste fehlerhaft an, bleibt die vorherige. Unter Einstellungen › Schilde kannst du das abschalten, wählen, wie oft sie sich erneuern, oder sie sofort abrufen.
