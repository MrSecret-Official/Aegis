# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

## about:escudos, «Cómo funcionan los Escudos» (paginas/escudos-ayuda.html): la ayuda de cada opción del panel de
## Escudos y de la huella digital. Para todo el mundo: de tú, frases cortas y sin jerga. Los nombres de las opciones
## son los del panel (aegis.ftl) y se escriben igual. <strong> se deja tal cual (negrita del nombre de la opción).

escudos-ayuda-pestana = How Shields work
escudos-ayuda-titulo = How Shields work
escudos-ayuda-entradilla = What each option in the Shields panel does, when to change it, and what to do if a website stops working.
# Etiqueta del índice (se muestra en mayúsculas).
escudos-ayuda-indice = On this page
# Encabezados que se repiten en varias secciones.
escudos-ayuda-h-cuando = When to use it
escudos-ayuda-h-falla = If a website breaks

## Qué son los Escudos y el contador

escudos-ayuda-escudos-titulo = What Shields are
escudos-ayuda-escudos-que = Every website you open loads pieces from other companies: ads, visitor counters, social media buttons. Many of them exist to follow you from site to site and learn what you do. Shields block them before they arrive.
escudos-ayuda-escudos-panel = The Shields button is the ring on the right side of the address bar. Click it to open the panel, with what was blocked on the page and the protection options. Each option tells you whether it applies only to the website you’re on or “On all sites”.
escudos-ayuda-contador-titulo = The counter
escudos-ayuda-contador-que = The number on the button counts what was blocked on the page you’re viewing: ads, trackers, social media trackers, fingerprinters and cryptominers. By default it counts every blocked request; in Settings › Shields › “Counter” you can have each server count only once (“Origins”). The number goes back to zero when you go to another page.
escudos-ayuda-contador-no = It doesn’t count protection that doesn’t block anything: cookies kept separately for each website, browser data that is hidden, or connections upgraded to HTTPS. When Shields are down, the number isn’t shown.
escudos-ayuda-contador-total = Below the big number in the panel you can see how much has been blocked since you installed { -brand-short-name }. It’s stored only on your device and never sent anywhere. It’s counted its own way, so it won’t necessarily match the sum of what you see on each page.

## Escudos del sitio

escudos-ayuda-sitio-titulo = Shields for this site
escudos-ayuda-sitio-que = The big switch at the top of the panel raises or lowers Shields only for the website you’re on. When you lower them, the page reloads with nothing blocked and without fingerprinting protection, and the button is shown crossed out.
escudos-ayuda-sitio-recuerda = { -brand-short-name } remembers it for next time. If you do it in a private window, it’s forgotten when you close the window.
escudos-ayuda-sitio-cuando = When a website you trust doesn’t work properly: a video that won’t start, a payment that won’t go through, or a sign-in that keeps sending you back to the same screen.
escudos-ayuda-sitio-falla = With Shields down, that website loads everything that was blocked before and can follow you again. If lowering them doesn’t fix it, the problem was something else: raise them again.

## Rastreadores y anuncios: Normal o Estricto

escudos-ayuda-nivel-titulo = Trackers and ads
escudos-ayuda-nivel-que = Choose how much Shields block on every website. { -brand-short-name } comes set to Strict+. You can also choose it in Settings › Shields.
escudos-ayuda-nivel-normal = <strong>Normal</strong> blocks, in every window, ads from the filter lists, tracking content from the basic list (ads and counters from companies that track you), cryptominers and known fingerprinters, and the cookies that follow you from site to site, including those of social networks; their embedded buttons and videos still load.
escudos-ayuda-nivel-estricto = <strong>Strict</strong> also uses the full list of tracking content, blocks social media buttons and embedded posts too, and removes the extra data added to links to follow you. Some websites may break.
escudos-ayuda-nivel-personalizado = If you change a single option, such as third-party cookies, the level becomes <strong>Custom</strong>. To go back, choose Normal, Strict or Strict+.
escudos-ayuda-nivel-recarga = When you change the level, the page reloads.
escudos-ayuda-nivel-cuando = Keep Strict+ if everything works. If many of the websites you use break, try Normal; if only one breaks, lower Shields on that site instead.
escudos-ayuda-nivel-falla = In Strict, an embedded video or map, the comments or a “Sign in with…” button may be missing. Lower Shields on that website and it will reload with everything.

## Lo bloqueado en esta página

escudos-ayuda-lista-titulo = Blocked on this page
escudos-ayuda-lista-que = This row in the panel shows which sites were blocked on the page, in groups: trackers and ads, social media trackers, fingerprinting and cryptominers. It shows you who was trying to follow you.
escudos-ayuda-lista-listas = What gets blocked is decided by the browser’s tracking protection (with Disconnect’s lists) and by the Shields’ own blocker (with the filter lists). The “Filter lists” button opens Settings › Shields.
escudos-ayuda-lista-falla = If the list shows something the website needs, such as its payment or video service, lower Shields on that website.

## Pasar conexiones a HTTPS

escudos-ayuda-https-titulo = Upgrade connections to HTTPS
escudos-ayuda-https-que = With HTTPS-Only Mode, { -brand-short-name } always opens the encrypted version of every website. That way nobody on your network, like a café’s Wi-Fi or your internet provider, can read or change what you see. It’s on for all websites.
escudos-ayuda-https-sitio = The switch in the panel makes an exception for the website you’re on: it will be allowed to open without encryption. If HTTPS-Only Mode is off in Settings, the row is shown greyed out.
escudos-ayuda-https-cuando = Almost never. Only for a website you trust that has no encrypted version, such as your router’s settings page.
escudos-ayuda-https-falla = If a website has no encrypted version, { -brand-short-name } warns you before opening it, and you can continue without encryption from that warning. Keep in mind that, without encryption, what you type on that website travels in the open.

## Bloquear scripts

escudos-ayuda-scripts-titulo = Block scripts
escudos-ayuda-scripts-que = Blocking scripts (the programs each website brings along) on a site isn’t available yet. The browser doesn’t have a reliable way to do it site by site, and { -brand-short-name } doesn’t show a switch that doesn’t work. It will come with Shields’ own blocker.

## Huella digital

escudos-ayuda-huella-titulo = Fingerprinting
escudos-ayuda-huella-que = A website can recognize you without cookies by combining what it reads from your browser: screen size, fonts, graphics card, time zone, language… That combination is your fingerprint. { -brand-short-name } hides some of that data or shows every website the same values.
escudos-ayuda-huella-donde = You choose it in the panel, in the “Fingerprinting” row, or in Settings › Privacy. It applies to every website, in normal and private windows. If you change it from the panel, the page reloads.
escudos-ayuda-huella-niveles = The four levels
escudos-ayuda-huella-basica = <strong>Basic.</strong> The protection built into the browser: it slightly changes what a website reads from its drawings (the canvas), shows it only the system fonts and makes some calculations identical.
escudos-ayuda-huella-equilibrada = <strong>Balanced</strong> (the default). It also hides your graphics card, sensors, connection type, details about audio and screen color, and other data that normal websites don’t need. It doesn’t break anything common: signing in, video, maps, documents and video calls keep working.
escudos-ayuda-huella-estricta = <strong>Strict.</strong> It also hides where your window and mouse are on the screen and the window’s toolbars, your fonts (it only shows the system’s default ones), reading voices and what your graphics card can do. Screen size, audio, processor cores and the canvas stay as in Balanced: changing them made you easier to recognize. Some websites may break: some 3D maps or games won’t start, read-aloud on some websites has no voices, and touch screens may get the mouse version.
escudos-ayuda-huella-caja = <strong>Vault.</strong> It hides almost everything it knows how to hide: not whether you use a dark or light theme, and not your screen size (hiding it made you easier to recognize). Websites see UTC time, English, 60 frames per second and a US keyboard, and can’t see your accessibility settings (high contrast, reduce motion…). To read a canvas, a website has to ask you first. Marks in the corners around the website remind you it’s on. Many websites will break.
escudos-ayuda-caja-titulo = Vault and per-site permission
escudos-ayuda-caja-aviso = If a website tries to take your fingerprint in a known way, a notice appears next to the Shields button: “Keep blocking” or “Allow on this site”. It shows once per site and session. It doesn’t recognize every attempt: the rest are blocked anyway, just without a notice.
escudos-ayuda-caja-permiso = “Allow on this site”, in the notice or in the panel, puts that website on Balanced; all others stay in Vault. It’s saved as a site permission, which you can remove in Settings › Privacy, under “Sites allowed in Vault”, or by clearing that site’s data.
escudos-ayuda-caja-limites = It can’t be given from a private window, because it would stay saved, although the permissions you already have also apply there. It can’t be given to numeric addresses (IP), to “localhost” or to some uncommon domains either. Language, 60 frames per second and system colors apply to the whole browser and don’t change with the permission.
escudos-ayuda-caja-salir = When you leave Vault, your languages go back to what they were before.
escudos-ayuda-ven-titulo = What websites can still see
escudos-ayuda-ven-ip = Your IP address and, with it, your country and approximate city. Hiding it requires Tor or a proxy.
escudos-ayuda-ven-navegador = Which browser and system you use, in a generic way: the same as millions of people. It never says { -brand-short-name }.
escudos-ayuda-ven-resto = Your language and time zone, except in Vault; your window size and whether you use a dark or light theme, always.
escudos-ayuda-ven-ocultar = That you’re hiding things: few people browse this way, and that sets you apart too. The same happens with other private browsers.
escudos-ayuda-ven-bajados = If you lower Shields on a site, that site gets no fingerprinting protection.
escudos-ayuda-huella-cuando = Balanced works for almost everything. Strict, if you’re fine with some websites breaking. Vault, for the moments when you want to leave as little trace as possible.
escudos-ayuda-huella-falla = If a website breaks in Strict or Vault, lower Shields on it or, in Vault, use “Allow on this site”. If many break, go back to Balanced.

## Cookies de terceros

escudos-ayuda-cookies-titulo = Third-party cookies
escudos-ayuda-cookies-que = Cookies are data a website stores in your browser to remember you. Third-party cookies belong to other companies embedded in the website you visit, and they’re mostly used to follow you from site to site. This option applies to every website.
escudos-ayuda-cookies-rastreo = <strong>Block tracking</strong> (the default) blocks cookies from known trackers and keeps all the others separately for each website, like in a drawer of their own. That way, a company can’t combine what you do on two different websites.
escudos-ayuda-cookies-todas = <strong>Block all</strong> lets no third-party cookies in.
escudos-ayuda-cookies-cuando = “Block tracking” protects almost as much and breaks far less. Choose “Block all” only if you want the maximum and accept that some things will break.
escudos-ayuda-cookies-falla = With “Block all”, “Sign in with…” buttons, payments, comments and embedded videos may break: go back to “Block tracking”. If you change this option, the Shields level becomes Custom.

## Olvidar este sitio al cerrar

escudos-ayuda-olvidar-titulo = Forget this site on close
escudos-ayuda-olvidar-que = Deletes the cookies and data stored by the website you’re on every time you close { -brand-short-name }. It only applies to that website: others aren’t touched. It’s not the same as “Forget About This Site” in your history, which deletes everything right away.
escudos-ayuda-olvidar-privada = In a private window it’s shown off: a private window already forgets everything when you close it.
escudos-ayuda-olvidar-cuando = For websites you use now and then and don’t want remembering you: shops, newspapers or flight search sites.
escudos-ayuda-olvidar-falla = You’ll have to sign in again every time, and the website will have forgotten your preferences, such as language, cart or your answer to the cookie notice. If that bothers you, turn it off for that website.

## Oscurecer este sitio

escudos-ayuda-oscuro-titulo = Darken this site
escudos-ayuda-oscuro-que = This row only appears if you’ve turned on “Dark websites” in Settings › Appearance. Turn it off so the website you’re on keeps its own colors. The change shows right away, without reloading.
escudos-ayuda-oscuro-falla = Automatic darkening sometimes gets it wrong: a logo you can’t see or text with poor contrast. Turn it off for that website. Keep in mind that a website can tell its appearance has been changed.

## Google limpio

escudos-ayuda-google-titulo = Clean Google
escudos-ayuda-google-que = On Google and YouTube websites, { -brand-short-name } cuts off their usage data and ads, removes tracking data from searches and makes result links go straight to the website instead of through Google. What it cuts off adds to the counter.
escudos-ayuda-google-busqueda = Google searches you make from the address bar ask for web results only, without AI answers or extra modules. Inside Google you can switch back to “All”.
escudos-ayuda-google-pasa = What’s needed is let through on purpose: signing in, captchas, Gmail, Drive, Maps, YouTube playback and its history.
escudos-ayuda-google-limites-titulo = What it doesn’t do
escudos-ayuda-google-limites = If you lower Shields on a Google website, it stops acting there. You can turn it off in Settings › Privacy › Google. Google still sees your IP and what you search for, and if you sign in, it knows who you are on its services. Ads that come inside the page, like sponsored results or YouTube video ads, aren’t removed yet.

## Lo que los Escudos no hacen

escudos-ayuda-limites-titulo = What Shields don’t do
escudos-ayuda-limites-ip = <strong>They don’t hide your IP address.</strong> Every website you visit sees it, and can tell roughly where you are. Hiding it requires Tor or a proxy.
escudos-ayuda-limites-detectable = <strong>They aren’t invisible.</strong> A website can notice that you block things or hide data, and some will tell you so. No blocker can prevent that 100%.
escudos-ayuda-limites-tor = <strong>{ -brand-short-name } isn’t Tor Browser.</strong> Tor Browser makes all its users look like the same browser and hides the IP address. { -brand-short-name } reduces what a website can learn about you, but a determined website can still tell you apart.
escudos-ayuda-limites-cuenta = <strong>They don’t hide you from the website you sign in to.</strong> If you sign in to your account, that website knows who you are. What Shields do is stop it from following you to other websites.

## Lo que viene

escudos-ayuda-pronto-titulo = Coming soon
escudos-ayuda-pronto-que = This page only describes what works today. These aren’t here yet:
escudos-ayuda-pronto-motor = Choosing filter lists one by one and adding your own.
escudos-ayuda-pronto-scripts = Blocking scripts site by site.

## Strict+, annoyances, site exceptions and filter lists (names as in the panel and in Settings › Shields)

escudos-ayuda-nivel-estricto-mas = <strong>Strict+</strong> (the default) is Strict plus a broader tracking list, AdGuard Tracking Protection. It uses a little more memory.
escudos-ayuda-molestias-titulo = Annoyances
escudos-ayuda-molestias-que = Besides ads and trackers, Shields hide three kinds of annoyances, each with its own switch: <strong>Cookie notices</strong> (consent banners), <strong>Pop-ups and banners</strong> (pop-up windows, app install banners and widgets) and <strong>Anti-adblock notices</strong> (the ones asking you to turn off your blocker). They’re on by default.
escudos-ayuda-molestias-donde = You turn them on and off for every site in the panel’s advanced options or in Settings › Shields. For a single site, use its exceptions.
escudos-ayuda-molestias-cookies = Hiding a cookie notice isn’t always the same as rejecting cookies: if you don’t answer, the site does whatever it does by default, and some set cookies anyway.
escudos-ayuda-molestias-falla = If a site won’t let you continue without answering its notice, or a button you need is in a window that gets hidden, add an exception for that group on that site. Anti-adblock notices aren’t removed on every site: some notice the blocking in other ways.
escudos-ayuda-excepciones-titulo = Site exceptions
escudos-ayuda-excepciones-que = An exception makes Shields let something through on a particular site. You manage them in Settings › Shields › “Site exceptions” and, from the panel, with “Exceptions for this site…”. They apply to the whole site (example.com and its subdomains).
escudos-ayuda-excepciones-todo = <strong>Allow everything</strong> is the same as lowering Shields with the big switch in the panel: nothing is blocked. It’s the quickest fix when a site breaks.
escudos-ayuda-excepciones-grupos = If you’d rather fine-tune, choose what to allow: ads, trackers from the lists, cookie notices, pop-ups and banners, anti-adblock notices, hidden elements or list scripts. Everything else is still blocked.
escudos-ayuda-excepciones-herencia = If a group is off for every site, the exception shows it as “Allowed by a global setting” and you can’t change it there: to change it, turn it back on globally.
escudos-ayuda-excepciones-guardado = They’re saved on your device as site permissions. If you forget the site or clear its data or your history, they go with it. The ones you set in a private window last until you close the last private window.
escudos-ayuda-excepciones-rastreadores = The trackers exception only affects the filter lists: the browser’s tracking protection stays on. To turn it off too, use “Allow everything”.
escudos-ayuda-listas-titulo = Filter lists
escudos-ayuda-listas-que = What the Shields’ own blocker blocks is decided by filter lists from their authors: uBlock Origin, EasyList, AdGuard and Brave. The level and the annoyances choose which ones are used, plus the ones for { -brand-short-name }’s language.
escudos-ayuda-listas-copia = { -brand-short-name } comes with a copy of the lists, so it blocks from the very first moment without connecting to anything.
escudos-ayuda-listas-actualizar = If you allow “Protection lists” in Connections, the lists renew themselves: one check a day, and each list is only fetched from its author when it expires, without cookies and without saying which sites you visit. If a new list arrives broken, the previous one stays. In Settings › Shields you can turn this off, choose how often they renew or fetch them now.
