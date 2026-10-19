# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

## about:conexiones (paginas/conexiones.html; conexiones.sys.mjs): womit sich der Browser von selbst verbindet und die
## Erlaubnis der Person. Erscheint beim ersten Start, bevor sich etwas verbindet. Dienstnamen (GitHub, Mozilla, Google,
## Cisco, Disconnect, Remote Settings, Safe Browsing, OpenH264, Widevine, CRLite, Netflix) werden nicht übersetzt.

conexiones-pestana = Verbindungen
conexiones-titulo = Du entscheidest, was sich verbindet
conexiones-entradilla = { -brand-short-name } hat sich noch mit nichts verbunden. Das sind die Verbindungen, die es von selbst aufbaut, ohne dass du surfst. Wähle, welche du erlaubst.
# Bezeichnung der Karte (in Großbuchstaben angezeigt).
conexiones-lista-titulo = Verbindungen von { -brand-short-name }

conexiones-actualizaciones-nombre = { -brand-short-name }-Updates
conexiones-actualizaciones-que = Einmal am Tag fragt es bei GitHub nach, ob es eine neue Version gibt, und lädt sie gegebenenfalls von dort herunter. GitHub sieht deine IP-Adresse und deine { -brand-short-name }-Version, ohne Cookies. Ohne das musst du in „Über { -brand-short-name }“ selbst nach Updates suchen.
conexiones-seguridad-nombre = Sicherheitslisten
conexiones-seguridad-que = Widerrufene Zertifikate (CRLite) und gefährliche Add-ons, von Remote Settings (services.mozilla.com). Sucht einmal am Tag nach Änderungen. Dieser Server sieht deine IP-Adresse und deine Version. Ohne das fragt { -brand-short-name } bei jeder neuen Website die Stelle, die ihr Zertifikat ausgestellt hat, ob es widerrufen wurde, oft unverschlüsselt: Abschalten bedeutet mehr solcher Anfragen, nicht weniger.
conexiones-listas-nombre = Schutzlisten
conexiones-listas-que = Die Listen, mit denen die Schilde erkennen, was dich verfolgt. Die des Tracking-Schutzes von Remote Settings (auf Basis der Listen von Disconnect): Ohne sie wird kein Tracker, Fingerprinter, Krypto-Miner oder Social-Media-Button erkannt, und die Ersatzskripte, die verhindern, dass eine Website beim Blockieren kaputtgeht, funktionieren nicht. Und die Filterlisten ihrer Autoren (EasyList, AdGuard, uBlock Origin): Ohne sie verwenden die Schilde die Kopie, die mit { -brand-short-name } kommt und mit der Zeit veraltet. Sie werden höchstens einmal am Tag geprüft, und nur Geändertes wird heruntergeladen.
conexiones-codecs-nombre = Video-Codecs
conexiones-codecs-que = OpenH264 von Cisco für Videoanrufe: wird einmal heruntergeladen. Widevine von Google für geschützte Videos (DRM) wie bei Netflix: nur, wenn eine Website es anfordert und du es aktivierst. Danach wird höchstens einmal am Tag nach neuen Versionen gesucht (bei aus5.mozilla.org und für Widevine bei Google).
conexiones-traduccion-nombre = Seitenübersetzung
conexiones-traduccion-que = Übersetzt Websites auf deinem Gerät, ohne sie an jemanden zu senden. Nur wenn du eine Seite übersetzen lässt oder in den Einstellungen eine Sprache herunterlädst, wird das Modell dieser Sprache (mehrere MB) von Remote Settings (services.mozilla.com) geladen; die Liste der Sprachen wird einmal am Tag geprüft. Ohne das erscheint die Übersetzungsoption nicht.
conexiones-safebrowsing-nombre = Google Safe Browsing
conexiones-safebrowsing-que = Warnt vor Betrugsseiten und gefährlichen Downloads mit Listen von Google, die etwa jede halbe Stunde aktualisiert werden. Um eine Warnung zu bestätigen, sendet es Google ein Bruchstück eines aus der Adresse berechneten Codes, nicht die Adresse selbst.
conexiones-safebrowsing-sin-clave = In dieser Version von { -brand-short-name } nicht verfügbar: Es fehlt sein Schlüssel für den Google-Dienst.
conexiones-push-nombre = Website-Benachrichtigungen
conexiones-push-que = Eine offene Verbindung zu einem Benachrichtigungsserver (push.services.mozilla.com), damit Websites, denen du es erlaubst, dich auch dann benachrichtigen können, wenn sie nicht geöffnet sind. Dieser Server sieht deine IP-Adresse und eine Kennung dieses Browsers.

conexiones-navegar = Das Surfen hängt nicht davon ab: Wenn du eine Website öffnest, verbindet sich { -brand-short-name } mit ihr. Hier geht es nur um das, was von selbst passiert, ohne dass du etwas tust.
conexiones-cambiar = Änderungen gelten sofort, ohne Neustart. Du kannst jederzeit über Einstellungen › Datenschutz hierher zurückkehren.

conexiones-aceptar = Akzeptieren
conexiones-guardar = Speichern
conexiones-ahora-no = Jetzt nicht
conexiones-ninguna = Keine erlauben
conexiones-estado-aceptadas = Gespeichert. Von selbst verbindet sich { -brand-short-name } nur noch für das, was du aktiviert gelassen hast.
conexiones-estado-ninguna = Gespeichert. { -brand-short-name } verbindet sich von selbst mit nichts. Ohne Updates und Listen fällt es bei der Sicherheit zurück.

## Einstellungen › Datenschutz › Verbindungen (ajustes.sys.mjs)

# Abschnittsbezeichnung (in Großbuchstaben angezeigt).
conexiones-ajustes-titulo = Verbindungen
conexiones-ajustes-ninguna = { -brand-short-name } verbindet sich von selbst mit nichts.
# $lista: die Namen der aktiven Gruppen als Aufzählung in der Sprache („Aegis-Updates und Sicherheitslisten“).
conexiones-ajustes-activas = Von selbst verbindet sich { -brand-short-name } nur hierfür: { $lista }.
conexiones-ajustes-elegir = Auswählen, was sich verbindet
