# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

## about:conexiones (paginas/conexiones.html; conexiones.sys.mjs): what the browser connects to on its own and the
## user's permission. Shown on first run, before anything connects. For everyone: plain words, short sentences, no
## jargon and no overstatement. Service names (GitHub, Mozilla, Google, Cisco, Disconnect, Remote Settings, Safe
## Browsing, OpenH264, Widevine, CRLite, Netflix) are not translated. What each row says comes from docs/CONEXIONES.md.

conexiones-pestana = Connections
conexiones-titulo = You decide what connects
conexiones-entradilla = { -brand-short-name } hasn’t connected to anything yet. These are the connections it makes on its own, without you browsing. Choose which ones you allow.
# Card label (shown in capitals).
conexiones-lista-titulo = { -brand-short-name } connections

conexiones-actualizaciones-nombre = { -brand-short-name } updates
conexiones-actualizaciones-que = Once a day, it asks GitHub whether there’s a new version and, if there is, downloads it from there. GitHub sees your IP address and your { -brand-short-name } version, without cookies. Without this, you’ll have to check for updates yourself in About { -brand-short-name }.
conexiones-seguridad-nombre = Security lists
conexiones-seguridad-que = Revoked certificates (CRLite) and dangerous add-ons, from Remote Settings (services.mozilla.com). It checks for changes once a day. That server sees your IP address and your version. Without this, to know whether a site’s certificate has been revoked, { -brand-short-name } asks the authority that issued it every time you open a new site, often unencrypted: turning it off means more of those checks, not fewer.
conexiones-listas-nombre = Protection lists
conexiones-listas-que = The lists Shields use to recognize what follows you. The tracking protection lists, from Remote Settings (based on Disconnect’s): without them, no tracker, fingerprinter, cryptominer or social media button is recognized, and the replacements that keep a site from breaking when they’re blocked don’t work. And the filter lists from their authors (EasyList, AdGuard, uBlock Origin): without them, Shields use the copy that comes with { -brand-short-name }, which gets out of date. They’re checked at most once a day and only what changed is downloaded.
conexiones-codecs-nombre = Video codecs
conexiones-codecs-que = OpenH264, from Cisco, for video calls: downloaded once. Widevine, from Google, for protected video (DRM) such as Netflix: only if a site asks for it and you turn it on. After that, it checks for new versions at most once a day (at aus5.mozilla.org and, for Widevine, at Google).
conexiones-traduccion-nombre = Page translation
conexiones-traduccion-que = Translates sites on your device, without sending them to anyone. Only when you ask to translate a page or download a language in Settings, it downloads that language’s model (several MB) from Remote Settings (services.mozilla.com); the list of languages is checked once a day. Without this, the option to translate doesn’t appear.
conexiones-safebrowsing-nombre = Google Safe Browsing
conexiones-safebrowsing-que = Warns you about scam sites and dangerous downloads using Google’s lists, which update about every half hour. To confirm a warning, it sends Google a fragment of a code calculated from the address, not the address itself.
conexiones-safebrowsing-sin-clave = Not available in this version of { -brand-short-name }: its key for the Google service is missing.
conexiones-push-nombre = Website notifications
conexiones-push-que = An open connection to a notification server (push.services.mozilla.com), so the sites you allow can notify you even when they aren’t open. That server sees your IP address and an identifier for this browser.

conexiones-navegar = Browsing doesn’t depend on this: when you open a site, { -brand-short-name } connects to it. This page only covers what happens on its own, without you doing anything.
conexiones-cambiar = Changes apply right away, without restarting. You can come back here anytime from Settings › Privacy.

conexiones-aceptar = Accept
conexiones-guardar = Save
conexiones-ahora-no = Not now
conexiones-ninguna = Allow none
conexiones-estado-aceptadas = Saved. On its own, { -brand-short-name } will only connect for what you left on.
conexiones-estado-ninguna = Saved. { -brand-short-name } won’t connect to anything on its own. Without updates or lists, it will fall behind on security.

## Settings › Privacy › Connections (ajustes.sys.mjs)

# Section label (shown in capitals).
conexiones-ajustes-titulo = Connections
conexiones-ajustes-ninguna = { -brand-short-name } doesn’t connect to anything on its own.
# $lista: the names of the active groups, joined as a list in the language (“Aegis updates and Security lists”).
conexiones-ajustes-activas = On its own, { -brand-short-name } only connects for this: { $lista }.
conexiones-ajustes-elegir = Choose what connects
