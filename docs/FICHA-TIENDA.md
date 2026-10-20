# Ficha de la Microsoft Store

Textos de la ficha de **Aegis Browser** (editor «Secret Studios», Store ID 9P68GV1KD9XH) para el envío **158.0.2.0**,
en los seis idiomas que declara el paquete y en el orden es-ES, en-US, de, fr, it y pt-BR. Se pegan campo a campo en
Partner Center › Aegis Browser › el envío › **Fichas de la Tienda** › cada idioma. El resto del envío, en
[TIENDA.md](TIENDA.md).

## Cómo usarlo

- Cada campo va en su bloque: se copia entero. Las cifras son caracteres (puntos de código Unicode, cada salto de
  línea cuenta uno). En la descripción y las novedades va también la cifra por si Partner Center cuenta cada salto de
  línea como dos: las dos caben.
- Es texto plano: Partner Center no admite formato. Las viñetas «•» y los títulos en mayúsculas son texto normal. Sin
  direcciones web: Microsoft pide poner la web, el soporte y la política de privacidad en sus propios campos.
- **Novedades de esta versión:** se rellena porque la 158.0.1.0 ya está publicada (Microsoft pide dejarlo vacío solo
  en el primer envío). Resume lo nuevo frente a la 158.0.1.0 (commits `1a7647a` y `0014dc3`).
- **Nombre del producto:** «Aegis Browser», el reservado, en los seis idiomas.
- Estilo de cada idioma como la interfaz: tú (es-ES), you (en-US), du (de), vous (fr), tu (it) y você (pt-BR), con los
  términos de `overlay/browser/components/aegis/locales/GLOSARIO.md` (Escudos, Shields, Schilde, Boucliers, Scudi;
  Workflow sin traducir; Estricto+, Strict+, Streng+, Rigoroso+; Caja fuerte, Vault, Tresor, Coffre-fort,
  Cassaforte, Cofre). En francés, espacios finos de no separación antes de «; ? ! %» y dentro de « », y uno de no
  separación antes de «:», como en Firefox.
- Si una función cambia o se quita, hay que cambiar también esta ficha.

## Límites de los campos

Documentación de Microsoft consultada el 2026-10-20:

| Campo | Límite | Fuente |
|---|---|---|
| Descripción | 10 000 caracteres de texto plano; obligatoria | [1] |
| Novedades de esta versión | 1500 caracteres | [1] |
| Características del producto | hasta 20, de 200 caracteres cada una, sin viñetas propias | [1] |
| Descripción corta | 1000 caracteres; algunas vistas muestran solo los primeros 270. Si falta, la Tienda usa el primer párrafo de la descripción (hasta 500) | [1] |
| Requisitos adicionales del sistema | hasta 11 en «Hardware mínimo» y 11 en «Hardware recomendado», de 200 caracteres cada uno | [1] |
| Términos de búsqueda (*Keywords*) | 7 términos, 40 caracteres cada uno, 21 palabras distintas en total | [3] |
| Copyright e información de marcas | 200 caracteres | [3] |

- [1] *Add and edit Store listing info for MSIX app*, <https://learn.microsoft.com/windows/apps/publish/publish-your-app/msix/add-and-edit-store-listing-info> (actualizada el 2026-08-24).
- [2] *Create an app submission for your MSIX app*, <https://learn.microsoft.com/windows/apps/publish/publish-your-app/msix/create-app-submission>: lista los campos *Keywords*, *Copyright and trademark info*, *Additional license terms* y *Developed by* de la ficha MSIX, pero sin límites.
- [3] *Create an app submission for your MSI/EXE app*, <https://learn.microsoft.com/windows/apps/publish/publish-your-app/msi/create-app-submission>: la tabla con los límites de esos campos. Es la página de las apps MSI/EXE; por si el campo de las MSIX fuera más corto, aquí ningún término pasa de 30 caracteres.

*Términos de licencia adicionales* y *Desarrollado por* se dejan vacíos: la licencia (MPL-2.0) va en el copyright y
en la web legal, y el editor ya sale como «Secret Studios».

## Qué cuenta la ficha

Solo lo que hace la 158.0.2.0, comprobado en el código (`overlay/browser/components/aegis/` y `settings/prefs/`), no
en el plan:

- **Escudos:** contador en la barra y panel por sitio (lo bloqueado, bajar los Escudos, solo HTTPS, cookies de
  terceros, huella digital y oscurecer el sitio); niveles Normal, Estricto y Estricto+ (de serie); grupos de molestias
  con su interruptor; listas incluidas en la build, que bloquean sin red; bloqueo silencioso.
- **Conexiones:** cero telemetría (también sin informes de fallos: `--disable-crashreporter`), ninguna conexión antes
  de la bienvenida y `about:conexiones` con un interruptor por grupo. La ficha no nombra el grupo «Actualizaciones de
  Aegis»: en el paquete de la Tienda, las versiones nuevas las instala la Tienda.
- **Bienvenida** (`about:bienvenida`): modo, Escudos, buscador y apariencia.
- **Búsqueda limpia:** DuckDuckGo de serie (`noai`), Google limpio (solo resultados web; sin telemetría ni anuncios
  en Google y YouTube), Bing, Startpage, Qwant, Ecosia y Wikipedia; sugerencias apagadas.
- **Huella digital:** Básica, Equilibrada (de serie), Estricta y Caja fuerte, con permiso por sitio.
- **Contraseñas:** principal obligatoria, bloqueo a los 10 minutos y al cerrar, ver y copiar con las credenciales de
  Windows, sin exportar en claro, sin autorrelleno, códigos de verificación (TOTP con lector de QR), transferencia con
  archivo cifrado y código de 6 palabras (caduca en 24 h) y passkeys de Windows Hello.
- **Importar:** marcadores e historial de Chrome, Edge, Brave, Firefox y otro perfil de Aegis; contraseñas por CSV o
  por la transferencia.
- **Tor:** ventana privada con Tor, descargado solo bajo demanda y comprobado con su sha256; puentes obfs4 y
  Snowflake; «Nueva identidad».
- **Modos:** Estándar y Workflow; hoy Workflow son las pestañas verticales. Modo Acciones («>» en la barra).
- **Apariencia:** claro, oscuro o automático; temas Grafito, Medianoche, Niebla y Arena; énfasis Monocromo, Color de
  Windows, Fondo de escritorio, 13 colores y «A medida» (hasta 24 guardados); webs en oscuro; nueva pestaña sin
  anuncios ni noticias, con accesos solo de lo visitado en Aegis.
- **Seis idiomas**, según Windows.

**No sale, porque aún no está hecho:** cuentas y sincronización en la nube; los espacios, esenciales, modo compacto,
Glance y vista dividida del modo Workflow; el proxy por espacio y la instancia «Aegis anónimo»; Safe Browsing (no hay
clave); uBlock Origin opcional en la bienvenida; idioma e importar dentro de la bienvenida.

**Honestidad** (`docs/GUIA.md`, principio 5): en los seis idiomas, Aegis con Tor no es Tor Browser, ningún bloqueador
es indetectable al 100 %, el buscador sigue viendo la IP y lo que se busca, los códigos de verificación dejan los dos
pasos en el mismo sitio y, en la versión de la Tienda, desinstalar borra el perfil (`docs/TIENDA.md`). En la ficha en
español, además, que algunos textos poco habituales siguen en inglés (a la traducción de Firefox 158 le faltan unos
1080).

**Marca:** «Firefox» y «Mozilla» solo en la última frase de la descripción («basado en el código abierto de Mozilla
Firefox (MPL-2.0)», como permite `docs/TIENDA.md`) y en el copyright, para atribuir el código y negar la afiliación,
como la web legal. Por eso «Importar» dice «Chrome, Edge, Brave y otros navegadores». Los términos de búsqueda no
llevan marcas ajenas (ni Tor). El titular del copyright es «Secret Studios», el editor de la Tienda; si prefieres otro,
se cambia en los seis.

## Resumen de caracteres

| Idioma | Descripción | Novedades | Característica más larga | Corta | Término más largo · palabras | Copyright |
|---|---|---|---|---|---|---|
| es-ES | 5293 | 1151 | 142 | 213 | 22 · 11 | 172 |
| en-US | 5115 | 1104 | 147 | 202 | 16 · 10 | 186 |
| de | 5784 | 1239 | 144 | 228 | 18 · 9 | 184 |
| fr | 6012 | 1316 | 148 | 236 | 29 · 13 | 183 |
| it | 5419 | 1183 | 158 | 216 | 17 · 11 | 179 |
| pt-BR | 5398 | 1158 | 143 | 215 | 26 · 11 | 169 |

## es-ES · Español (España)

### Descripción · 5293 / 10 000

5341 si Partner Center cuenta cada salto de línea como dos caracteres.

```text
Aegis es un navegador para usar internet sin que te sigan. Bloquea anuncios y rastreadores desde el primer minuto, no envía telemetría y no se conecta a nada por su cuenta hasta que tú lo decides. No hay cuentas ni servidores de Aegis: lo que haces se queda en tu equipo.

ESCUDOS: ANUNCIOS Y RASTREADORES, FUERA
Los Escudos son el bloqueador integrado de Aegis. Usan listas de filtros conocidas (EasyList, AdGuard, uBlock Origin y Brave) y funcionan desde el primer arranque, incluso sin conexión, con una copia de las listas que viene incluida.
• Un contador en la barra de direcciones y un panel por sitio: lo bloqueado en la página, bajar los Escudos en esa web, solo HTTPS, cookies de terceros, huella digital y oscurecer el sitio.
• Tres niveles: Normal, Estricto y Estricto+ (el recomendado).
• Oculta avisos de cookies, ventanas y banners, y avisos anti-bloqueador, con un interruptor para cada grupo.
• Bloqueo discreto: la web recibe una respuesta vacía en lugar de un error, así que menos webs notan el bloqueador. Aun así, ningún bloqueador es indetectable al 100 %.

TÚ DECIDES QUÉ SE CONECTA
Aegis no envía datos de uso, estudios ni informes de fallos. La primera vez que lo abres no se conecta a nada: eliges cómo quieres navegar (modo, Escudos, buscador y apariencia) y después, en la página Conexiones, qué puede conectarse por su cuenta: listas de protección, listas de seguridad, códecs de vídeo, traducción de páginas y notificaciones de webs. Cada una tiene su interruptor y los cambios se aplican al momento. Las páginas se traducen en tu equipo, sin enviarlas a nadie.

BÚSQUEDA LIMPIA
DuckDuckGo es el buscador de serie, en su versión sin IA. También puedes elegir Google, Bing, Startpage, Qwant, Ecosia o Wikipedia. En todos ellos, Aegis corta su telemetría, quita los parámetros de seguimiento y hace que los enlaces de los resultados vayan directos a la web. En Google muestra solo resultados web, sin respuestas de IA, y en Google y YouTube corta también sus datos de uso y sus anuncios. Las sugerencias mientras escribes vienen apagadas. Ten en cuenta que el buscador sigue viendo tu IP y lo que buscas, y, si inicias sesión, quién eres.

HUELLA DIGITAL
Cuatro niveles de protección frente a la huella digital: Básica, Equilibrada (la de serie), Estricta y Caja fuerte. Si una web falla, puedes permitirla solo en ese sitio.

CONTRASEÑAS CERRADAS
• Aegis cifra tus contraseñas con una contraseña principal, que te pide crear al guardar la primera. Se bloquean al cerrar y tras 10 minutos sin usar el equipo.
• Para ver o copiar una contraseña, te pide tus credenciales de Windows. No se pueden exportar en claro.
• No se rellenan solas: las eliges tú, y solo en la web exacta donde las guardaste.
• Códigos de verificación en dos pasos: lee el código QR de la web y Aegis calcula los códigos en tu equipo. Así los dos pasos quedan en el mismo sitio: tú decides si te compensa.
• «Pasar a otro Aegis»: tus contraseñas viajan en un archivo cifrado que solo se abre con un código de 6 palabras y caduca en 24 horas. No pasan por ningún servidor.
• Las passkeys las guarda Windows Hello.

IMPORTAR
Trae marcadores e historial de Chrome, Edge, Brave y otros navegadores, o de otro perfil de Aegis. Las contraseñas entran con un archivo que exportas del otro navegador (Aegis te explica cómo) y quedan protegidas con tu contraseña principal.

VENTANA PRIVADA CON TOR
Abre una ventana privada que va por la red de Tor: las webs ven una IP de Tor, no la tuya. Tor no viene con Aegis: se descarga del Tor Project solo si lo pides y se comprueba antes de instalarlo. La ventana tiene su propio perfil, que se borra al cerrarla, y admite puentes (obfs4 y Snowflake) y «Nueva identidad». Aegis con Tor no es Tor Browser: Tor Browser hace que todos sus usuarios parezcan iguales, y a Aegis se le distingue más. Si tu seguridad depende del anonimato, usa Tor Browser.

DOS MODOS
• Estándar: pestañas arriba, una barra limpia y la barra de marcadores discreta.
• Workflow: pestañas verticales en un lateral.
Cambias de uno a otro cuando quieras, sin perder pestañas. Con el modo Acciones (escribe «>» en la barra de direcciones) llegas a los Escudos, las contraseñas, el modo, la apariencia o Tor sin pasar por los menús.

A TU GUSTO
Aegis es en blanco y negro: el color lo pone la web. Elige tema claro, oscuro o automático, o uno de sus cuatro temas (Grafito, Medianoche, Niebla y Arena), y un énfasis: monocromo, el color de Windows, el de tu fondo de escritorio, 13 colores o uno a medida. Con «Webs en oscuro», las páginas se adaptan al tema oscuro: todas o solo las que no tienen modo oscuro. La nueva pestaña no tiene anuncios ni noticias: tu fondo, el buscador y accesos solo de lo que visitas en Aegis.

SEIS IDIOMAS
Español, inglés, portugués de Brasil, francés, alemán e italiano. Aegis usa el idioma de Windows y puedes cambiarlo en Ajustes. En español todavía aparecen en inglés algunos textos poco habituales.

ANTES DE INSTALAR
• Esta versión se actualiza con la Microsoft Store.
• Al desinstalarla, Windows borra también su perfil: marcadores, historial y contraseñas. Antes, pasa tus contraseñas a otro Aegis y exporta tus marcadores.

CÓDIGO ABIERTO
Aegis es un proyecto independiente de código abierto (MPL-2.0), basado en el código abierto de Mozilla Firefox.
```

### Novedades de esta versión · 1151 / 1500

1160 si cuenta cada salto de línea como dos.

```text
Novedades de Aegis 158.0.2.0:
• Bienvenida: la primera vez que abres Aegis eliges modo, Escudos, buscador y apariencia, y después qué se conecta.
• Seis idiomas: toda la interfaz en español, inglés, portugués de Brasil, francés, alemán e italiano, según el idioma de Windows.
• Búsqueda limpia también en DuckDuckGo (en su versión sin IA), Bing, Startpage, Qwant, Ecosia y Wikipedia: sin telemetría, sin parámetros de seguimiento y con enlaces directos.
• Panel de Escudos en DuckDuckGo y Bing: interruptores para quitar los anuncios de DuckDuckGo y para decidir si Bing suma puntos de Microsoft Rewards.
• Énfasis a medida: selector de color propio, segundo color opcional para el degradado y hasta 24 guardados. Además, seis colores nuevos.
• Modo Acciones: escribe «>» en la barra de direcciones para abrir los Escudos, las contraseñas, el modo o Tor.
• Nueva pestaña: accesos solo de lo que visitas en Aegis, rejilla de 3 o 4 filas, «Descartar» quita el sitio entero y logos más nítidos.
• Menos restos del navegador de origen: fuera las páginas y los botones que no eran de Aegis y los buscadores de socios comerciales.
• Menú principal revisado.
```

### Características del producto · 12 de 20

Una por casilla, sin viñeta (la pone la Tienda).

**Característica 1** · 88 / 200

```text
Escudos: bloqueador de anuncios y rastreadores integrado, con contador y panel por sitio
```

**Característica 2** · 53 / 200

```text
Tres niveles de bloqueo: Normal, Estricto y Estricto+
```

**Característica 3** · 98 / 200

```text
Oculta avisos de cookies, ventanas, banners y avisos anti-bloqueador, con un interruptor por grupo
```

**Característica 4** · 78 / 200

```text
Sin telemetría y sin conexiones por su cuenta hasta que terminas la bienvenida
```

**Característica 5** · 69 / 200

```text
Página Conexiones: eliges qué se conecta por su cuenta, sin reiniciar
```

**Característica 6** · 142 / 200

```text
Búsqueda limpia: DuckDuckGo sin IA de serie; Google, Bing, Startpage, Qwant, Ecosia y Wikipedia sin su telemetría ni parámetros de seguimiento
```

**Característica 7** · 80 / 200

```text
Protección frente a la huella digital en cuatro niveles, de Básica a Caja fuerte
```

**Característica 8** · 111 / 200

```text
Contraseñas cifradas con contraseña principal, sin exportación en claro, y códigos de verificación en dos pasos
```

**Característica 9** · 82 / 200

```text
Pasa tus contraseñas a otro Aegis con un archivo cifrado y un código de 6 palabras
```

**Característica 10** · 73 / 200

```text
Importa marcadores e historial de Chrome, Edge, Brave y otros navegadores
```

**Característica 11** · 57 / 200

```text
Ventana privada con Tor; Tor se descarga solo si lo pides
```

**Característica 12** · 81 / 200

```text
Modos Estándar y Workflow, temas, énfasis a medida, webs en oscuro y seis idiomas
```

### Descripción corta · 213 / 1000 (se ve entera por debajo de 270)

```text
Navegador privado con bloqueador de anuncios y rastreadores integrado. Sin telemetría y sin conectarse a nada por su cuenta hasta que tú lo decides. Búsqueda limpia, contraseñas cerradas y ventana privada con Tor.
```

### Términos de búsqueda · 7 de 7 · 11 palabras distintas de 21

Uno por casilla.

**Término 1** · 17 / 40

```text
navegador privado
```

**Término 2** · 22 / 40

```text
bloqueador de anuncios
```

**Término 3** · 12 / 40

```text
antirrastreo
```

**Término 4** · 13 / 40

```text
navegador web
```

**Término 5** · 10 / 40

```text
privacidad
```

**Término 6** · 7 / 40

```text
adblock
```

**Término 7** · 21 / 40

```text
gestor de contraseñas
```

### Requisitos adicionales del sistema · Hardware mínimo

Uno por casilla; «Hardware recomendado» se deja vacío.

**Requisito 1** · 60 / 200

```text
Windows 10 (versión 1809 o posterior) u 11, de 64 bits (x64)
```

**Requisito 2** · 27 / 200

```text
Unos 400 MB libres en disco
```

### Copyright e información de marcas · 172 / 200

```text
© 2026 Secret Studios. Aegis se basa en el código abierto de Mozilla Firefox (MPL-2.0). Firefox y Mozilla son marcas de la Fundación Mozilla; Aegis no está afiliado a ella.
```

## en-US · English (United States)

### Descripción · 5115 / 10 000

5163 si Partner Center cuenta cada salto de línea como dos caracteres.

```text
Aegis is a browser for using the internet without being followed. It blocks ads and trackers from the first minute, sends no telemetry and doesn’t connect to anything on its own until you decide. There are no Aegis accounts or servers: what you do stays on your computer.

SHIELDS: ADS AND TRACKERS, GONE
Shields are the blocker built into Aegis. They use well-known filter lists (EasyList, AdGuard, uBlock Origin and Brave) and work from the very first launch, even offline, with a copy of the lists included.
• A counter in the address bar and a panel for each site: what was blocked on the page, Shields down on that site, HTTPS-Only, third-party cookies, fingerprinting and darkening the site.
• Three levels: Normal, Strict and Strict+ (recommended).
• Hides cookie notices, pop-ups and banners, and anti-adblock notices, with a switch for each group.
• Quiet blocking: the site gets an empty response instead of an error, so fewer sites notice the blocker. Even so, no blocker is 100% undetectable.

YOU DECIDE WHAT CONNECTS
Aegis sends no usage data, studies or crash reports. The first time you open it, it connects to nothing: you choose how you want to browse (mode, Shields, search engine and appearance) and then, on the Connections page, what may connect on its own: protection lists, security lists, video codecs, page translation and website notifications. Each has its own switch, and changes apply right away. Pages are translated on your computer, without being sent to anyone.

CLEAN SEARCH
DuckDuckGo is the default search engine, in its no-AI version. You can also choose Google, Bing, Startpage, Qwant, Ecosia or Wikipedia. On all of them, Aegis cuts their telemetry, removes tracking parameters and makes result links go straight to the site. On Google it shows web results only, without AI answers, and on Google and YouTube it also cuts their usage data and ads. Search suggestions while you type are off. Keep in mind that the search engine still sees your IP address and what you search for, and, if you sign in, who you are.

FINGERPRINTING
Four levels of fingerprinting protection: Basic, Balanced (the default), Strict and Vault. If a site breaks, you can allow it on that site only.

LOCKED-DOWN PASSWORDS
• Aegis encrypts your passwords with a primary password, which it asks you to create when you save the first one. They lock when you close Aegis and after 10 minutes without using the computer.
• To see or copy a password, it asks for your Windows credentials. Passwords can’t be exported in plain text.
• They aren’t filled in on their own: you pick them, and only on the exact site where you saved them.
• Two-step verification codes: scan the site’s QR code and Aegis calculates the codes on your computer. That puts both steps in the same place, so it’s your call.
• “Move to another Aegis”: your passwords travel in an encrypted file that only opens with a 6-word code and expires after 24 hours. They never go through a server.
• Passkeys are stored by Windows Hello.

IMPORT
Bring bookmarks and history from Chrome, Edge, Brave and other browsers, or from another Aegis profile. Passwords come in through a file you export from the other browser (Aegis shows you how) and are then protected by your primary password.

PRIVATE WINDOW WITH TOR
Open a private window that goes through the Tor network: sites see a Tor IP address, not yours. Tor doesn’t come with Aegis: it’s downloaded from the Tor Project only if you ask, and checked before it’s installed. The window has its own profile, deleted when you close it, and supports bridges (obfs4 and Snowflake) and “New identity”. Aegis with Tor is not Tor Browser: Tor Browser makes all its users look alike, while Aegis is easier to tell apart. If your safety depends on anonymity, use Tor Browser.

TWO MODES
• Standard: tabs on top, a clean toolbar and a discreet bookmarks toolbar.
• Workflow: vertical tabs in the sidebar.
Switch between them anytime without losing tabs. With Actions mode (type “>” in the address bar) you can reach Shields, passwords, modes, appearance or Tor without digging through menus.

MAKE IT YOURS
Aegis is black and white: the color comes from the web. Choose a light, dark or automatic theme, or one of its four themes (Graphite, Midnight, Mist and Sand), and an accent: monochrome, your Windows color, your desktop background, 13 colors or a custom one. With “Dark websites”, pages adapt to the dark theme: all of them or only those without a dark mode. The new tab has no ads or news: just your background, the search box and shortcuts only to sites you visit in Aegis.

SIX LANGUAGES
English, Spanish, Brazilian Portuguese, French, German and Italian. Aegis follows your Windows language, and you can change it in Settings.

BEFORE YOU INSTALL
• This version is updated through the Microsoft Store.
• When you uninstall it, Windows also deletes its profile: bookmarks, history and passwords. Before that, move your passwords to another Aegis and export your bookmarks.

OPEN SOURCE
Aegis is an independent open-source project (MPL-2.0), based on the open-source code of Mozilla Firefox.
```

### Novedades de esta versión · 1104 / 1500

1113 si cuenta cada salto de línea como dos.

```text
What’s new in Aegis 158.0.2.0:
• Welcome: the first time you open Aegis, you choose your mode, Shields, search engine and appearance, and then what connects.
• Six languages: the whole interface in English, Spanish, Brazilian Portuguese, French, German and Italian, following your Windows language.
• Clean search now also on DuckDuckGo (in its no-AI version), Bing, Startpage, Qwant, Ecosia and Wikipedia: no telemetry, no tracking parameters and direct links.
• Shields panel on DuckDuckGo and Bing: switches to remove DuckDuckGo’s ads and to decide whether Bing earns Microsoft Rewards points.
• Custom accent: a new color picker, an optional second color for the gradient and up to 24 saved. Plus six new colors.
• Actions mode: type “>” in the address bar to open Shields, passwords, modes or Tor.
• New tab: shortcuts only to sites you visit in Aegis, a 3- or 4-row grid, dismissing a shortcut removes the whole site, and sharper logos.
• Fewer leftovers from the original browser: pages and buttons that weren’t Aegis’s are gone, along with commercial partner search engines.
• Reworked main menu.
```

### Características del producto · 12 de 20

Una por casilla, sin viñeta (la pone la Tienda).

**Característica 1** · 81 / 200

```text
Shields: built-in ad and tracker blocker with a counter and a panel for each site
```

**Característica 2** · 49 / 200

```text
Three blocking levels: Normal, Strict and Strict+
```

**Característica 3** · 93 / 200

```text
Hides cookie notices, pop-ups, banners and anti-adblock notices, with a switch for each group
```

**Característica 4** · 71 / 200

```text
No telemetry and no connections on its own until you finish the welcome
```

**Característica 5** · 68 / 200

```text
Connections page: choose what connects on its own, no restart needed
```

**Característica 6** · 147 / 200

```text
Clean search: DuckDuckGo without AI by default; Google, Bing, Startpage, Qwant, Ecosia and Wikipedia without their telemetry or tracking parameters
```

**Característica 7** · 61 / 200

```text
Fingerprinting protection in four levels, from Basic to Vault
```

**Característica 8** · 99 / 200

```text
Passwords encrypted with a primary password, no plain-text export, plus two-step verification codes
```

**Característica 9** · 77 / 200

```text
Move your passwords to another Aegis with an encrypted file and a 6-word code
```

**Característica 10** · 72 / 200

```text
Import bookmarks and history from Chrome, Edge, Brave and other browsers
```

**Característica 11** · 58 / 200

```text
Private window with Tor; Tor is downloaded only if you ask
```

**Característica 12** · 84 / 200

```text
Standard and Workflow modes, themes, custom accents, dark websites and six languages
```

### Descripción corta · 202 / 1000 (se ve entera por debajo de 270)

```text
A private browser with a built-in ad and tracker blocker. No telemetry, and it doesn’t connect to anything on its own until you decide. Clean search, locked-down passwords and a private window with Tor.
```

### Términos de búsqueda · 7 de 7 · 10 palabras distintas de 21

Uno por casilla.

**Término 1** · 15 / 40

```text
private browser
```

**Término 2** · 10 / 40

```text
ad blocker
```

**Término 3** · 15 / 40

```text
tracker blocker
```

**Término 4** · 11 / 40

```text
web browser
```

**Término 5** · 7 / 40

```text
privacy
```

**Término 6** · 7 / 40

```text
adblock
```

**Término 7** · 16 / 40

```text
password manager
```

### Requisitos adicionales del sistema · Hardware mínimo

Uno por casilla; «Hardware recomendado» se deja vacío.

**Requisito 1** · 62 / 200

```text
Windows 10 (version 1809 or later) or Windows 11, 64-bit (x64)
```

**Requisito 2** · 31 / 200

```text
About 400 MB of free disk space
```

### Copyright e información de marcas · 186 / 200

```text
© 2026 Secret Studios. Aegis is based on the open-source code of Mozilla Firefox (MPL-2.0). Firefox and Mozilla are trademarks of the Mozilla Foundation; Aegis is not affiliated with it.
```

## de · Deutsch

### Descripción · 5784 / 10 000

5832 si Partner Center cuenta cada salto de línea como dos caracteres.

```text
Aegis ist ein Browser, mit dem du im Internet unterwegs bist, ohne verfolgt zu werden. Er blockiert Werbung und Tracker ab der ersten Minute, sendet keine Telemetrie und verbindet sich von sich aus mit nichts, bis du es erlaubst. Es gibt keine Aegis-Konten und keine Aegis-Server: Was du tust, bleibt auf deinem Computer.

SCHILDE: SCHLUSS MIT WERBUNG UND TRACKERN
Die Schilde sind der eingebaute Blocker von Aegis. Sie nutzen bekannte Filterlisten (EasyList, AdGuard, uBlock Origin und Brave) und wirken ab dem ersten Start, auch offline, mit einer mitgelieferten Kopie der Listen.
• Ein Zähler in der Adressleiste und ein Panel für jede Website: was auf der Seite blockiert wurde, Schilde für diese Website deaktivieren, Nur-HTTPS, Drittanbieter-Cookies, Fingerprinting und die Website abdunkeln.
• Drei Stufen: Normal, Streng und Streng+ (empfohlen).
• Blendet Cookie-Hinweise, Pop-ups und Banner sowie Anti-Adblock-Hinweise aus, mit einem Schalter für jede Gruppe.
• Unauffälliges Blockieren: Die Website erhält eine leere Antwort statt eines Fehlers, sodass weniger Websites den Blocker bemerken. Trotzdem ist kein Blocker zu 100 % unsichtbar.

DU ENTSCHEIDEST, WAS SICH VERBINDET
Aegis sendet keine Nutzungsdaten, Studien oder Absturzberichte. Beim ersten Öffnen verbindet sich Aegis mit nichts: Du wählst, wie du surfen möchtest (Modus, Schilde, Suchmaschine und Aussehen), und danach auf der Seite „Verbindungen“, was sich von selbst verbinden darf: Schutzlisten, Sicherheitslisten, Video-Codecs, Seitenübersetzung und Benachrichtigungen von Websites. Jede hat ihren eigenen Schalter, und Änderungen gelten sofort. Seiten werden auf deinem Computer übersetzt, ohne sie an jemanden zu senden.

SAUBERE SUCHE
DuckDuckGo ist die Standardsuchmaschine, in der Version ohne KI. Du kannst auch Google, Bing, Startpage, Qwant, Ecosia oder Wikipedia wählen. Bei allen kappt Aegis die Telemetrie, entfernt Tracking-Parameter und lässt die Links in den Ergebnissen direkt zur Website führen. Bei Google zeigt Aegis nur Webergebnisse ohne KI-Antworten, und bei Google und YouTube kappt es auch Nutzungsdaten und Werbung. Suchvorschläge beim Tippen sind ausgeschaltet. Beachte: Die Suchmaschine sieht weiterhin deine IP-Adresse und wonach du suchst – und wenn du angemeldet bist, wer du bist.

FINGERPRINTING
Vier Stufen Schutz vor Fingerprinting: Einfach, Ausgewogen (Standard), Streng und Tresor. Wenn eine Website nicht funktioniert, kannst du sie nur dort erlauben.

GUT VERSCHLOSSENE PASSWÖRTER
• Aegis verschlüsselt deine Passwörter mit einem Hauptpasswort, das du beim Speichern des ersten Passworts festlegst. Sie werden beim Schließen und nach 10 Minuten ohne Nutzung des Computers gesperrt.
• Um ein Passwort anzuzeigen oder zu kopieren, fragt Aegis nach deinen Windows-Anmeldedaten. Ein Export im Klartext ist nicht möglich.
• Sie werden nicht von selbst ausgefüllt: Du wählst sie aus, und nur auf genau der Website, auf der du sie gespeichert hast.
• Bestätigungscodes für die Zwei-Schritt-Verifizierung: Scanne den QR-Code der Website, und Aegis berechnet die Codes auf deinem Computer. Damit liegen beide Schritte am selben Ort – du entscheidest, ob dir das recht ist.
• „An ein anderes Aegis übertragen“: Deine Passwörter reisen in einer verschlüsselten Datei, die sich nur mit einem Code aus 6 Wörtern öffnen lässt und nach 24 Stunden abläuft. Kein Server ist beteiligt.
• Passkeys speichert Windows Hello.

IMPORTIEREN
Übernimm Lesezeichen und Chronik aus Chrome, Edge, Brave und anderen Browsern oder aus einem anderen Aegis-Profil. Passwörter kommen über eine Datei, die du im anderen Browser exportierst (Aegis zeigt dir, wie), und sind danach durch dein Hauptpasswort geschützt.

PRIVATES FENSTER MIT TOR
Öffne ein privates Fenster, das über das Tor-Netzwerk läuft: Websites sehen eine IP-Adresse von Tor, nicht deine. Tor ist nicht in Aegis enthalten: Es wird nur auf deinen Wunsch vom Tor Project heruntergeladen und vor der Installation geprüft. Das Fenster hat ein eigenes Profil, das beim Schließen gelöscht wird, und unterstützt Brücken (obfs4 und Snowflake) sowie „Neue Identität“. Aegis mit Tor ist nicht Tor Browser: Bei Tor Browser sehen alle Nutzer gleich aus, Aegis ist leichter zu unterscheiden. Wenn deine Sicherheit von Anonymität abhängt, nutze Tor Browser.

ZWEI MODI
• Standard: Tabs oben, eine aufgeräumte Symbolleiste und eine dezente Lesezeichen-Symbolleiste.
• Workflow: vertikale Tabs in der Sidebar.
Du kannst jederzeit zwischen beiden wechseln, ohne Tabs zu verlieren. Im Aktionen-Modus (tippe „>“ in die Adressleiste) erreichst du Schilde, Passwörter, Modus, Aussehen oder Tor, ohne dich durch Menüs zu klicken.

NACH DEINEM GESCHMACK
Aegis ist schwarz-weiß: Die Farbe bringt das Web mit. Wähle ein helles, dunkles oder automatisches Theme oder eines der vier eigenen Themes (Graphit, Mitternacht, Nebel und Sand) und eine Akzentfarbe: monochrom, deine Windows-Farbe, dein Desktop-Hintergrund, 13 Farben oder eine eigene. Mit „Dunkle Websites“ passen sich Seiten an das dunkle Theme an: alle oder nur die ohne Dunkelmodus. Der neue Tab hat weder Werbung noch Nachrichten: nur dein Hintergrund, das Suchfeld und Verknüpfungen zu Websites, die du in Aegis besuchst.

SECHS SPRACHEN
Deutsch, Englisch, Spanisch, brasilianisches Portugiesisch, Französisch und Italienisch. Aegis folgt der Sprache von Windows; du kannst sie in den Einstellungen ändern.

VOR DER INSTALLATION
• Diese Version wird über den Microsoft Store aktualisiert.
• Wenn du sie deinstallierst, löscht Windows auch ihr Profil: Lesezeichen, Chronik und Passwörter. Übertrage vorher deine Passwörter an ein anderes Aegis und exportiere deine Lesezeichen.

OPEN SOURCE
Aegis ist ein unabhängiges Open-Source-Projekt (MPL-2.0) auf Basis des offenen Quellcodes von Mozilla Firefox.
```

### Novedades de esta versión · 1239 / 1500

1248 si cuenta cada salto de línea como dos.

```text
Neu in Aegis 158.0.2.0:
• Willkommen: Beim ersten Öffnen wählst du Modus, Schilde, Suchmaschine und Aussehen und danach, was sich verbinden darf.
• Sechs Sprachen: die ganze Oberfläche auf Deutsch, Englisch, Spanisch, brasilianischem Portugiesisch, Französisch und Italienisch, passend zur Sprache von Windows.
• Saubere Suche jetzt auch bei DuckDuckGo (in der Version ohne KI), Bing, Startpage, Qwant, Ecosia und Wikipedia: ohne Telemetrie, ohne Tracking-Parameter und mit direkten Links.
• Schilde-Panel bei DuckDuckGo und Bing: Schalter, um die Werbung von DuckDuckGo zu entfernen und zu entscheiden, ob Bing Microsoft-Rewards-Punkte sammelt.
• Eigene Akzentfarbe: neue Farbauswahl, optional eine zweite Farbe für den Verlauf und bis zu 24 gespeicherte. Dazu sechs neue Farben.
• Aktionen-Modus: Tippe „>“ in die Adressleiste, um Schilde, Passwörter, Modus oder Tor zu öffnen.
• Neuer Tab: Verknüpfungen nur zu Websites, die du in Aegis besuchst, ein Raster mit 3 oder 4 Zeilen, eine entfernte Verknüpfung blendet die ganze Website aus, schärfere Logos.
• Weniger Überbleibsel des Ursprungsbrowsers: Seiten und Schaltflächen, die nicht zu Aegis gehörten, sind weg, ebenso Suchmaschinen kommerzieller Partner.
• Überarbeitetes Hauptmenü.
```

### Características del producto · 12 de 20

Una por casilla, sin viñeta (la pone la Tienda).

**Característica 1** · 91 / 200

```text
Schilde: eingebauter Blocker für Werbung und Tracker, mit Zähler und Panel für jede Website
```

**Característica 2** · 47 / 200

```text
Drei Blockierstufen: Normal, Streng und Streng+
```

**Característica 3** · 101 / 200

```text
Blendet Cookie-Hinweise, Pop-ups, Banner und Anti-Adblock-Hinweise aus, mit einem Schalter pro Gruppe
```

**Característica 4** · 104 / 200

```text
Keine Telemetrie und keine Verbindungen von sich aus, bis du die ersten Einstellungen abgeschlossen hast
```

**Característica 5** · 77 / 200

```text
Seite „Verbindungen“: Du wählst, was sich von selbst verbindet, ohne Neustart
```

**Característica 6** · 144 / 200

```text
Saubere Suche: DuckDuckGo ohne KI als Standard; Google, Bing, Startpage, Qwant, Ecosia und Wikipedia ohne ihre Telemetrie und Tracking-Parameter
```

**Característica 7** · 64 / 200

```text
Schutz vor Fingerprinting in vier Stufen, von Einfach bis Tresor
```

**Característica 8** · 126 / 200

```text
Passwörter mit Hauptpasswort verschlüsselt, kein Export im Klartext, dazu Bestätigungscodes für die Zwei-Schritt-Verifizierung
```

**Característica 9** · 110 / 200

```text
Übertrage deine Passwörter an ein anderes Aegis – mit einer verschlüsselten Datei und einem Code aus 6 Wörtern
```

**Característica 10** · 79 / 200

```text
Importiere Lesezeichen und Chronik aus Chrome, Edge, Brave und anderen Browsern
```

**Característica 11** · 65 / 200

```text
Privates Fenster mit Tor; Tor wird nur auf Wunsch heruntergeladen
```

**Característica 12** · 91 / 200

```text
Modi Standard und Workflow, Themes, eigene Akzentfarben, dunkle Websites und sechs Sprachen
```

### Descripción corta · 228 / 1000 (se ve entera por debajo de 270)

```text
Privater Browser mit eingebautem Blocker für Werbung und Tracker. Keine Telemetrie, und er verbindet sich von sich aus mit nichts, bis du es erlaubst. Saubere Suche, gut verschlossene Passwörter und ein privates Fenster mit Tor.
```

### Términos de búsqueda · 7 de 7 · 9 palabras distintas de 21

Uno por casilla.

**Término 1** · 16 / 40

```text
privater Browser
```

**Término 2** · 18 / 40

```text
Werbung blockieren
```

**Término 3** · 14 / 40

```text
Trackingschutz
```

**Término 4** · 10 / 40

```text
Webbrowser
```

**Término 5** · 11 / 40

```text
Datenschutz
```

**Término 6** · 9 / 40

```text
Adblocker
```

**Término 7** · 15 / 40

```text
Passwortmanager
```

### Requisitos adicionales del sistema · Hardware mínimo

Uno por casilla; «Hardware recomendado» se deja vacío.

**Requisito 1** · 66 / 200

```text
Windows 10 (Version 1809 oder neuer) oder Windows 11, 64 Bit (x64)
```

**Requisito 2** · 32 / 200

```text
Etwa 400 MB freier Speicherplatz
```

### Copyright e información de marcas · 184 / 200

```text
© 2026 Secret Studios. Aegis basiert auf dem offenen Quellcode von Mozilla Firefox (MPL-2.0). Firefox und Mozilla sind Marken der Mozilla Foundation; Aegis ist nicht mit ihr verbunden.
```

## fr · Français

### Descripción · 6012 / 10 000

6060 si Partner Center cuenta cada salto de línea como dos caracteres.

```text
Aegis est un navigateur pour utiliser Internet sans être suivi. Il bloque les publicités et les traqueurs dès la première minute, n’envoie aucune télémétrie et ne se connecte à rien de lui-même tant que vous ne l’avez pas décidé. Pas de compte ni de serveur Aegis : ce que vous faites reste sur votre ordinateur.

BOUCLIERS : PUBLICITÉS ET TRAQUEURS, DEHORS
Les Boucliers sont le bloqueur intégré d’Aegis. Ils utilisent des listes de filtres reconnues (EasyList, AdGuard, uBlock Origin et Brave) et fonctionnent dès le premier lancement, même hors ligne, grâce à une copie des listes incluse.
• Un compteur dans la barre d’adresse et un panneau pour chaque site : ce qui a été bloqué sur la page, baisser les Boucliers sur ce site, HTTPS uniquement, cookies tiers, empreinte numérique et assombrir le site.
• Trois niveaux : Normal, Strict et Strict+ (recommandé).
• Masque les bandeaux de cookies, les pop-ups et bannières et les alertes anti-bloqueur, avec un interrupteur pour chaque groupe.
• Blocage discret : le site reçoit une réponse vide au lieu d’une erreur, si bien que moins de sites remarquent le bloqueur. Aucun bloqueur n’est pour autant indétectable à 100 %.

VOUS DÉCIDEZ CE QUI SE CONNECTE
Aegis n’envoie ni données d’utilisation, ni études, ni rapports de plantage. À la première ouverture, il ne se connecte à rien : vous choisissez comment naviguer (mode, Boucliers, moteur de recherche et apparence), puis, sur la page Connexions, ce qui peut se connecter de lui-même : listes de protection, listes de sécurité, codecs vidéo, traduction des pages et notifications des sites. Chacune a son interrupteur, et les changements s’appliquent aussitôt. Les pages sont traduites sur votre ordinateur, sans être envoyées à quiconque.

RECHERCHE PROPRE
DuckDuckGo est le moteur de recherche par défaut, dans sa version sans IA. Vous pouvez aussi choisir Google, Bing, Startpage, Qwant, Ecosia ou Wikipédia. Sur chacun, Aegis coupe leur télémétrie, retire les paramètres de pistage et fait pointer les liens des résultats directement vers le site. Sur Google, il n’affiche que les résultats web, sans réponses d’IA, et sur Google et YouTube il coupe aussi leurs données d’utilisation et leurs publicités. Les suggestions pendant la saisie sont désactivées. Attention : le moteur de recherche voit toujours votre adresse IP et ce que vous cherchez, et, si vous êtes connecté, qui vous êtes.

EMPREINTE NUMÉRIQUE
Quatre niveaux de protection contre l’empreinte numérique : Basique, Équilibrée (par défaut), Stricte et Coffre-fort. Si un site ne fonctionne plus, vous pouvez l’autoriser sur ce site uniquement.

DES MOTS DE PASSE BIEN GARDÉS
• Aegis chiffre vos mots de passe avec un mot de passe principal, qu’il vous demande de créer au premier enregistrement. Ils se verrouillent à la fermeture et après 10 minutes sans utiliser l’ordinateur.
• Pour afficher ou copier un mot de passe, Aegis vous demande vos identifiants Windows. Impossible de les exporter en clair.
• Ils ne sont pas remplis automatiquement : vous les choisissez, et uniquement sur le site exact où vous les avez enregistrés.
• Codes de vérification en deux étapes : lisez le code QR du site et Aegis calcule les codes sur votre ordinateur. Les deux étapes se retrouvent alors au même endroit : à vous de juger.
• « Transférer vers un autre Aegis » : vos mots de passe voyagent dans un fichier chiffré qui ne s’ouvre qu’avec un code de 6 mots et expire au bout de 24 heures. Aucun serveur n’intervient.
• Les clés d’accès sont conservées par Windows Hello.

IMPORTER
Récupérez marque-pages et historique depuis Chrome, Edge, Brave et d’autres navigateurs, ou depuis un autre profil Aegis. Les mots de passe arrivent par un fichier que vous exportez de l’autre navigateur (Aegis vous explique comment) et sont ensuite protégés par votre mot de passe principal.

FENÊTRE PRIVÉE AVEC TOR
Ouvrez une fenêtre privée qui passe par le réseau Tor : les sites voient une adresse IP de Tor, pas la vôtre. Tor n’est pas fourni avec Aegis : il est téléchargé depuis le Tor Project seulement si vous le demandez, et vérifié avant d’être installé. La fenêtre a son propre profil, effacé à la fermeture, et prend en charge les ponts (obfs4 et Snowflake) et « Nouvelle identité ». Aegis avec Tor n’est pas Tor Browser : Tor Browser fait se ressembler tous ses utilisateurs, alors qu’Aegis se distingue davantage. Si votre sécurité dépend de l’anonymat, utilisez Tor Browser.

DEUX MODES
• Standard : les onglets en haut, une barre d’outils épurée et une barre personnelle discrète.
• Workflow : des onglets verticaux dans la barre latérale.
Passez de l’un à l’autre quand vous voulez, sans perdre vos onglets. Avec le mode Actions (tapez « > » dans la barre d’adresse), vous accédez aux Boucliers, aux mots de passe, au mode, à l’apparence ou à Tor sans fouiller dans les menus.

À VOTRE GOÛT
Aegis est en noir et blanc : la couleur vient du Web. Choisissez un thème clair, sombre ou automatique, ou l’un de ses quatre thèmes (Graphite, Minuit, Brume et Sable), et une couleur d’accent : monochrome, la couleur de Windows, celle de votre arrière-plan du bureau, 13 couleurs ou une couleur sur mesure. Avec « Sites en mode sombre », les pages s’adaptent au thème sombre : toutes, ou seulement celles qui n’ont pas de mode sombre. Le nouvel onglet n’a ni publicités ni actualités : votre arrière-plan, le champ de recherche et des raccourcis uniquement vers les sites que vous visitez dans Aegis.

SIX LANGUES
Français, anglais, espagnol, portugais du Brésil, allemand et italien. Aegis suit la langue de Windows, et vous pouvez la changer dans les Paramètres.

AVANT D’INSTALLER
• Cette version est mise à jour par le Microsoft Store.
• Si vous la désinstallez, Windows supprime aussi son profil : marque-pages, historique et mots de passe. Avant cela, transférez vos mots de passe vers un autre Aegis et exportez vos marque-pages.

OPEN SOURCE
Aegis est un projet open source indépendant (MPL-2.0), basé sur le code source ouvert de Mozilla Firefox.
```

### Novedades de esta versión · 1316 / 1500

1325 si cuenta cada salto de línea como dos.

```text
Nouveautés d’Aegis 158.0.2.0 :
• Bienvenue : à la première ouverture, vous choisissez le mode, les Boucliers, le moteur de recherche et l’apparence, puis ce qui se connecte.
• Six langues : toute l’interface en français, anglais, espagnol, portugais du Brésil, allemand et italien, selon la langue de Windows.
• Recherche propre aussi sur DuckDuckGo (dans sa version sans IA), Bing, Startpage, Qwant, Ecosia et Wikipédia : sans télémétrie, sans paramètres de pistage et avec des liens directs.
• Panneau des Boucliers sur DuckDuckGo et Bing : des interrupteurs pour retirer les publicités de DuckDuckGo et pour décider si Bing cumule des points Microsoft Rewards.
• Couleur d’accent sur mesure : nouveau sélecteur, seconde couleur facultative pour le dégradé et jusqu’à 24 couleurs enregistrées. Et six nouvelles couleurs.
• Mode Actions : tapez « > » dans la barre d’adresse pour ouvrir les Boucliers, les mots de passe, le mode ou Tor.
• Nouvel onglet : des raccourcis uniquement vers les sites visités dans Aegis, une grille de 3 ou 4 lignes, un raccourci retiré fait disparaître tout le site, et des logos plus nets.
• Moins de restes du navigateur d’origine : les pages et boutons qui n’étaient pas ceux d’Aegis ont disparu, tout comme les moteurs de recherche de partenaires commerciaux.
• Menu principal revu.
```

### Características del producto · 12 de 20

Una por casilla, sin viñeta (la pone la Tienda).

**Característica 1** · 101 / 200

```text
Boucliers : bloqueur intégré de publicités et de traqueurs, avec compteur et panneau pour chaque site
```

**Característica 2** · 52 / 200

```text
Trois niveaux de blocage : Normal, Strict et Strict+
```

**Característica 3** · 108 / 200

```text
Masque les bandeaux de cookies, pop-ups, bannières et alertes anti-bloqueur, avec un interrupteur par groupe
```

**Característica 4** · 75 / 200

```text
Aucune télémétrie et aucune connexion de lui-même avant la fin de l’accueil
```

**Característica 5** · 81 / 200

```text
Page Connexions : vous choisissez ce qui se connecte de lui-même, sans redémarrer
```

**Característica 6** · 148 / 200

```text
Recherche propre : DuckDuckGo sans IA par défaut ; Google, Bing, Startpage, Qwant, Ecosia et Wikipédia sans leur télémétrie ni paramètres de pistage
```

**Característica 7** · 83 / 200

```text
Protection contre l’empreinte numérique en quatre niveaux, de Basique à Coffre-fort
```

**Característica 8** · 115 / 200

```text
Mots de passe chiffrés par un mot de passe principal, sans export en clair, et codes de vérification en deux étapes
```

**Característica 9** · 93 / 200

```text
Transférez vos mots de passe vers un autre Aegis avec un fichier chiffré et un code de 6 mots
```

**Característica 10** · 86 / 200

```text
Importez marque-pages et historique depuis Chrome, Edge, Brave et d’autres navigateurs
```

**Característica 11** · 70 / 200

```text
Fenêtre privée avec Tor ; Tor n’est téléchargé que si vous le demandez
```

**Característica 12** · 101 / 200

```text
Modes Standard et Workflow, thèmes, couleurs d’accent sur mesure, sites en mode sombre et six langues
```

### Descripción corta · 236 / 1000 (se ve entera por debajo de 270)

```text
Navigateur privé avec bloqueur de publicités et de traqueurs intégré. Aucune télémétrie, et il ne se connecte à rien de lui-même tant que vous ne l’avez pas décidé. Recherche propre, mots de passe bien gardés et fenêtre privée avec Tor.
```

### Términos de búsqueda · 7 de 7 · 13 palabras distintas de 21

Uno por casilla.

**Término 1** · 16 / 40

```text
navigateur privé
```

**Término 2** · 15 / 40

```text
bloqueur de pub
```

**Término 3** · 14 / 40

```text
anti-traqueurs
```

**Término 4** · 14 / 40

```text
navigateur web
```

**Término 5** · 10 / 40

```text
vie privée
```

**Término 6** · 7 / 40

```text
adblock
```

**Término 7** · 29 / 40

```text
gestionnaire de mots de passe
```

### Requisitos adicionales del sistema · Hardware mínimo

Uno por casilla; «Hardware recomendado» se deja vacío.

**Requisito 1** · 68 / 200

```text
Windows 10 (version 1809 ou ultérieure) ou Windows 11, 64 bits (x64)
```

**Requisito 2** · 36 / 200

```text
Environ 400 Mo d’espace disque libre
```

### Copyright e información de marcas · 183 / 200

```text
© 2026 Secret Studios. Aegis est basé sur le code source ouvert de Mozilla Firefox (MPL-2.0). Firefox et Mozilla sont des marques de la Mozilla Foundation ; Aegis n’y est pas affilié.
```

## it · Italiano

### Descripción · 5419 / 10 000

5467 si Partner Center cuenta cada salto de línea como dos caracteres.

```text
Aegis è un browser per usare Internet senza essere seguito. Blocca pubblicità e traccianti dal primo minuto, non invia telemetria e non si collega a nulla di sua iniziativa finché non lo decidi tu. Non ci sono account né server di Aegis: quello che fai resta sul tuo computer.

SCUDI: VIA PUBBLICITÀ E TRACCIANTI
Gli Scudi sono il sistema di blocco integrato di Aegis. Usano liste di filtri note (EasyList, AdGuard, uBlock Origin e Brave) e funzionano dal primo avvio, anche offline, con una copia delle liste inclusa.
• Un contatore nella barra degli indirizzi e un pannello per ogni sito: cosa è stato bloccato nella pagina, abbassare gli Scudi su quel sito, Solo HTTPS, cookie di terze parti, impronta digitale e scurire il sito.
• Tre livelli: Normale, Rigoroso e Rigoroso+ (consigliato).
• Nasconde avvisi sui cookie, pop-up e banner e avvisi anti-adblock, con un interruttore per ogni gruppo.
• Blocco discreto: il sito riceve una risposta vuota invece di un errore, così meno siti si accorgono del blocco. Nessun sistema di blocco, però, è invisibile al 100%.

DECIDI TU COSA SI COLLEGA
Aegis non invia dati di utilizzo, studi né segnalazioni di arresto anomalo. La prima volta che lo apri non si collega a nulla: scegli come vuoi navigare (modalità, Scudi, motore di ricerca e aspetto) e poi, nella pagina Connessioni, cosa può collegarsi da solo: elenchi di protezione, elenchi di sicurezza, codec video, traduzione delle pagine e notifiche dei siti. Ognuno ha il suo interruttore e le modifiche si applicano subito. Le pagine vengono tradotte sul tuo computer, senza inviarle a nessuno.

RICERCA PULITA
DuckDuckGo è il motore di ricerca predefinito, nella versione senza IA. Puoi scegliere anche Google, Bing, Startpage, Qwant, Ecosia o Wikipedia. Su tutti, Aegis taglia la loro telemetria, rimuove i parametri di tracciamento e fa sì che i link dei risultati portino direttamente al sito. Su Google mostra solo risultati web, senza risposte dell’IA, e su Google e YouTube taglia anche dati di utilizzo e pubblicità. I suggerimenti durante la digitazione sono disattivati. Tieni presente che il motore di ricerca vede comunque il tuo indirizzo IP e cosa cerchi e, se accedi, chi sei.

IMPRONTA DIGITALE
Quattro livelli di protezione contro l’impronta digitale: Base, Bilanciata (predefinita), Rigorosa e Cassaforte. Se un sito non funziona, puoi consentirlo solo su quel sito.

PASSWORD BEN CHIUSE
• Aegis cifra le tue password con una password principale, che ti chiede di creare quando ne salvi una per la prima volta. Si bloccano alla chiusura e dopo 10 minuti senza usare il computer.
• Per vedere o copiare una password, ti chiede le credenziali di Windows. Non si possono esportare in chiaro.
• Non vengono compilate da sole: le scegli tu, e solo sul sito esatto in cui le hai salvate.
• Codici di verifica in due passaggi: leggi il codice QR del sito e Aegis calcola i codici sul tuo computer. Così i due passaggi stanno nello stesso posto: valuta tu se ti va bene.
• «Trasferisci a un altro Aegis»: le tue password viaggiano in un file cifrato che si apre solo con un codice di 6 parole e scade dopo 24 ore. Nessun server di mezzo.
• Le passkey le conserva Windows Hello.

IMPORTARE
Porta segnalibri e cronologia da Chrome, Edge, Brave e altri browser, o da un altro profilo di Aegis. Le password arrivano con un file che esporti dall’altro browser (Aegis ti spiega come) e poi sono protette dalla tua password principale.

FINESTRA ANONIMA CON TOR
Apri una finestra anonima che passa per la rete Tor: i siti vedono un indirizzo IP di Tor, non il tuo. Tor non è incluso in Aegis: viene scaricato dal Tor Project solo se lo chiedi e verificato prima dell’installazione. La finestra ha un proprio profilo, che si cancella alla chiusura, e supporta i bridge (obfs4 e Snowflake) e «Nuova identità». Aegis con Tor non è Tor Browser: Tor Browser fa sembrare uguali tutti i suoi utenti, mentre Aegis si distingue di più. Se la tua sicurezza dipende dall’anonimato, usa Tor Browser.

DUE MODALITÀ
• Standard: schede in alto, una barra degli strumenti pulita e una barra dei segnalibri discreta.
• Workflow: schede verticali nella barra laterale.
Passi dall’una all’altra quando vuoi, senza perdere schede. Con la modalità Azioni (digita «>» nella barra degli indirizzi) raggiungi Scudi, password, modalità, aspetto o Tor senza cercare nei menu.

COME PIACE A TE
Aegis è in bianco e nero: il colore lo mette il web. Scegli un tema chiaro, scuro o automatico, o uno dei suoi quattro temi (Grafite, Mezzanotte, Nebbia e Sabbia), e un colore d’accento: monocromo, il colore di Windows, quello dello sfondo del desktop, 13 colori o uno su misura. Con «Siti in modalità scura», le pagine si adattano al tema scuro: tutte o solo quelle senza una modalità scura. La nuova scheda non ha pubblicità né notizie: il tuo sfondo, la casella di ricerca e scorciatoie solo dei siti che visiti in Aegis.

SEI LINGUE
Italiano, inglese, spagnolo, portoghese brasiliano, francese e tedesco. Aegis segue la lingua di Windows e puoi cambiarla nelle Impostazioni.

PRIMA DI INSTALLARE
• Questa versione si aggiorna tramite il Microsoft Store.
• Se la disinstalli, Windows elimina anche il suo profilo: segnalibri, cronologia e password. Prima, trasferisci le password a un altro Aegis ed esporta i segnalibri.

OPEN SOURCE
Aegis è un progetto open source indipendente (MPL-2.0), basato sul codice sorgente aperto di Mozilla Firefox.
```

### Novedades de esta versión · 1183 / 1500

1192 si cuenta cada salto de línea como dos.

```text
Novità di Aegis 158.0.2.0:
• Benvenuto: la prima volta che apri Aegis scegli modalità, Scudi, motore di ricerca e aspetto, e poi cosa si collega.
• Sei lingue: tutta l’interfaccia in italiano, inglese, spagnolo, portoghese brasiliano, francese e tedesco, in base alla lingua di Windows.
• Ricerca pulita anche su DuckDuckGo (nella versione senza IA), Bing, Startpage, Qwant, Ecosia e Wikipedia: senza telemetria, senza parametri di tracciamento e con link diretti.
• Pannello degli Scudi su DuckDuckGo e Bing: interruttori per togliere la pubblicità di DuckDuckGo e per decidere se Bing accumula punti Microsoft Rewards.
• Colore d’accento su misura: nuovo selettore, secondo colore facoltativo per la sfumatura e fino a 24 colori salvati. In più, sei colori nuovi.
• Modalità Azioni: digita «>» nella barra degli indirizzi per aprire Scudi, password, modalità o Tor.
• Nuova scheda: scorciatoie solo dei siti visitati in Aegis, griglia da 3 o 4 righe, una scorciatoia rimossa fa sparire tutto il sito, loghi più nitidi.
• Meno residui del browser di origine: via le pagine e i pulsanti che non erano di Aegis e i motori di ricerca dei partner commerciali.
• Menu principale rivisto.
```

### Características del producto · 12 de 20

Una por casilla, sin viñeta (la pone la Tienda).

**Característica 1** · 90 / 200

```text
Scudi: blocco integrato di pubblicità e traccianti, con contatore e pannello per ogni sito
```

**Característica 2** · 52 / 200

```text
Tre livelli di blocco: Normale, Rigoroso e Rigoroso+
```

**Característica 3** · 96 / 200

```text
Nasconde avvisi sui cookie, pop-up, banner e avvisi anti-adblock, con un interruttore per gruppo
```

**Característica 4** · 91 / 200

```text
Nessuna telemetria e nessuna connessione di sua iniziativa finché non completi il benvenuto
```

**Característica 5** · 67 / 200

```text
Pagina Connessioni: scegli cosa si collega da solo, senza riavviare
```

**Característica 6** · 158 / 200

```text
Ricerca pulita: DuckDuckGo senza IA come predefinito; Google, Bing, Startpage, Qwant, Ecosia e Wikipedia senza la loro telemetria né parametri di tracciamento
```

**Característica 7** · 78 / 200

```text
Protezione contro l’impronta digitale in quattro livelli, da Base a Cassaforte
```

**Característica 8** · 112 / 200

```text
Password cifrate con una password principale, niente esportazione in chiaro e codici di verifica in due passaggi
```

**Característica 9** · 84 / 200

```text
Trasferisci le password a un altro Aegis con un file cifrato e un codice di 6 parole
```

**Característica 10** · 70 / 200

```text
Importa segnalibri e cronologia da Chrome, Edge, Brave e altri browser
```

**Característica 11** · 58 / 200

```text
Finestra anonima con Tor; Tor si scarica solo se lo chiedi
```

**Característica 12** · 99 / 200

```text
Modalità Standard e Workflow, temi, colori d’accento su misura, siti in modalità scura e sei lingue
```

### Descripción corta · 216 / 1000 (se ve entera por debajo de 270)

```text
Browser privato con blocco integrato di pubblicità e traccianti. Nessuna telemetria, e non si collega a nulla di sua iniziativa finché non lo decidi tu. Ricerca pulita, password ben chiuse e finestra anonima con Tor.
```

### Términos de búsqueda · 7 de 7 · 11 palabras distintas de 21

Uno por casilla.

**Término 1** · 15 / 40

```text
browser privato
```

**Término 2** · 17 / 40

```text
blocco pubblicità
```

**Término 3** · 17 / 40

```text
anti tracciamento
```

**Término 4** · 11 / 40

```text
browser web
```

**Término 5** · 7 / 40

```text
privacy
```

**Término 6** · 7 / 40

```text
adblock
```

**Término 7** · 16 / 40

```text
gestore password
```

### Requisitos adicionales del sistema · Hardware mínimo

Uno por casilla; «Hardware recomendado» se deja vacío.

**Requisito 1** · 68 / 200

```text
Windows 10 (versione 1809 o successiva) o Windows 11, a 64 bit (x64)
```

**Requisito 2** · 38 / 200

```text
Circa 400 MB di spazio libero su disco
```

### Copyright e información de marcas · 179 / 200

```text
© 2026 Secret Studios. Aegis si basa sul codice sorgente aperto di Mozilla Firefox (MPL-2.0). Firefox e Mozilla sono marchi della Mozilla Foundation; Aegis non è affiliato a essa.
```

## pt-BR · Português (Brasil)

### Descripción · 5398 / 10 000

5446 si Partner Center cuenta cada salto de línea como dos caracteres.

```text
O Aegis é um navegador para usar a internet sem ser seguido. Ele bloqueia anúncios e rastreadores desde o primeiro minuto, não envia telemetria e não se conecta a nada por conta própria até você decidir. Não há contas nem servidores do Aegis: o que você faz fica no seu computador.

ESCUDOS: ANÚNCIOS E RASTREADORES, FORA
Os Escudos são o bloqueador integrado do Aegis. Eles usam listas de filtros conhecidas (EasyList, AdGuard, uBlock Origin e Brave) e funcionam desde a primeira vez que você abre o navegador, mesmo sem internet, com uma cópia das listas incluída.
• Um contador na barra de endereços e um painel para cada site: o que foi bloqueado na página, desativar os Escudos nesse site, Somente HTTPS, cookies de terceiros, impressão digital e escurecer o site.
• Três níveis: Normal, Rigoroso e Rigoroso+ (recomendado).
• Oculta avisos de cookies, pop-ups e banners e avisos antibloqueador, com um botão para cada grupo.
• Bloqueio discreto: o site recebe uma resposta vazia em vez de um erro, então menos sites percebem o bloqueador. Mesmo assim, nenhum bloqueador é 100% indetectável.

VOCÊ DECIDE O QUE SE CONECTA
O Aegis não envia dados de uso, estudos nem relatórios de falhas. Na primeira vez que você o abre, ele não se conecta a nada: você escolhe como quer navegar (modo, Escudos, mecanismo de pesquisa e aparência) e depois, na página Conexões, o que pode se conectar por conta própria: listas de proteção, listas de segurança, codecs de vídeo, tradução de páginas e notificações de sites. Cada uma tem seu próprio botão, e as mudanças valem na hora. As páginas são traduzidas no seu computador, sem enviá-las a ninguém.

PESQUISA LIMPA
O DuckDuckGo é o mecanismo de pesquisa padrão, na versão sem IA. Você também pode escolher Google, Bing, Startpage, Qwant, Ecosia ou Wikipédia. Em todos eles, o Aegis corta a telemetria, remove os parâmetros de rastreamento e faz os links dos resultados irem direto para o site. No Google, mostra só resultados da web, sem respostas de IA, e no Google e no YouTube também corta dados de uso e anúncios. As sugestões enquanto você digita ficam desativadas. Lembre-se: o mecanismo de pesquisa continua vendo seu IP e o que você pesquisa e, se você fizer login, quem você é.

IMPRESSÃO DIGITAL
Quatro níveis de proteção contra impressão digital: Básica, Equilibrada (a padrão), Rigorosa e Cofre. Se um site não funcionar, você pode permiti-lo só nesse site.

SENHAS BEM GUARDADAS
• O Aegis criptografa suas senhas com uma senha principal, que ele pede para você criar ao salvar a primeira. Elas são bloqueadas ao fechar o navegador e depois de 10 minutos sem usar o computador.
• Para ver ou copiar uma senha, ele pede suas credenciais do Windows. Não é possível exportá-las em texto puro.
• Elas não são preenchidas sozinhas: você as escolhe, e só no site exato em que foram salvas.
• Códigos de verificação em duas etapas: leia o QR code do site e o Aegis calcula os códigos no seu computador. Assim, as duas etapas ficam no mesmo lugar: você decide se vale a pena.
• “Transferir para outro Aegis”: suas senhas viajam em um arquivo criptografado que só abre com um código de 6 palavras e expira em 24 horas. Nenhum servidor no meio.
• As chaves de acesso ficam guardadas pelo Windows Hello.

IMPORTAR
Traga favoritos e histórico do Chrome, Edge, Brave e outros navegadores, ou de outro perfil do Aegis. As senhas entram com um arquivo que você exporta do outro navegador (o Aegis mostra como) e depois ficam protegidas pela sua senha principal.

JANELA PRIVATIVA COM TOR
Abra uma janela privativa que passa pela rede Tor: os sites veem um IP do Tor, não o seu. O Tor não vem com o Aegis: ele é baixado do Tor Project só se você pedir e é verificado antes da instalação. A janela tem seu próprio perfil, apagado ao fechá-la, e aceita pontes (obfs4 e Snowflake) e “Nova identidade”. O Aegis com Tor não é o Tor Browser: o Tor Browser faz todos os seus usuários parecerem iguais, enquanto o Aegis se distingue mais. Se sua segurança depende do anonimato, use o Tor Browser.

DOIS MODOS
• Padrão: abas em cima, uma barra de ferramentas limpa e uma barra de favoritos discreta.
• Workflow: abas verticais no painel lateral.
Troque de um para o outro quando quiser, sem perder abas. Com o modo Ações (digite “>” na barra de endereços), você chega aos Escudos, às senhas, ao modo, à aparência ou ao Tor sem procurar nos menus.

DO SEU JEITO
O Aegis é em preto e branco: a cor vem da web. Escolha um tema claro, escuro ou automático, ou um dos seus quatro temas (Grafite, Meia-noite, Névoa e Areia), e uma cor de destaque: monocromática, a cor do Windows, a do seu plano de fundo, 13 cores ou uma sob medida. Com “Sites em modo escuro”, as páginas se adaptam ao tema escuro: todas ou só as que não têm modo escuro. A nova aba não tem anúncios nem notícias: só o seu fundo, a caixa de pesquisa e atalhos apenas dos sites que você visita no Aegis.

SEIS IDIOMAS
Português do Brasil, inglês, espanhol, francês, alemão e italiano. O Aegis segue o idioma do Windows, e você pode mudá-lo nas Configurações.

ANTES DE INSTALAR
• Esta versão é atualizada pela Microsoft Store.
• Ao desinstalá-la, o Windows também apaga o perfil dela: favoritos, histórico e senhas. Antes, transfira suas senhas para outro Aegis e exporte seus favoritos.

CÓDIGO ABERTO
O Aegis é um projeto independente de código aberto (MPL-2.0), baseado no código aberto do Mozilla Firefox.
```

### Novedades de esta versión · 1158 / 1500

1167 si cuenta cada salto de línea como dos.

```text
Novidades do Aegis 158.0.2.0:
• Boas-vindas: na primeira vez que você abre o Aegis, escolhe o modo, os Escudos, o mecanismo de pesquisa e a aparência, e depois o que se conecta.
• Seis idiomas: toda a interface em português do Brasil, inglês, espanhol, francês, alemão e italiano, conforme o idioma do Windows.
• Pesquisa limpa também no DuckDuckGo (na versão sem IA), Bing, Startpage, Qwant, Ecosia e Wikipédia: sem telemetria, sem parâmetros de rastreamento e com links diretos.
• Painel dos Escudos no DuckDuckGo e no Bing: botões para remover os anúncios do DuckDuckGo e para decidir se o Bing soma pontos do Microsoft Rewards.
• Cor de destaque sob medida: novo seletor, segunda cor opcional para o degradê e até 24 salvas. E seis cores novas.
• Modo Ações: digite “>” na barra de endereços para abrir os Escudos, as senhas, o modo ou o Tor.
• Nova aba: atalhos só dos sites visitados no Aegis, grade de 3 ou 4 linhas, um atalho removido faz sumir o site inteiro e logotipos mais nítidos.
• Menos restos do navegador de origem: saíram páginas e botões que não eram do Aegis e os mecanismos de pesquisa de parceiros comerciais.
• Menu principal revisado.
```

### Características del producto · 12 de 20

Una por casilla, sin viñeta (la pone la Tienda).

**Característica 1** · 94 / 200

```text
Escudos: bloqueador integrado de anúncios e rastreadores, com contador e painel para cada site
```

**Característica 2** · 53 / 200

```text
Três níveis de bloqueio: Normal, Rigoroso e Rigoroso+
```

**Característica 3** · 90 / 200

```text
Oculta avisos de cookies, pop-ups, banners e avisos antibloqueador, com um botão por grupo
```

**Característica 4** · 80 / 200

```text
Sem telemetria e sem conexões por conta própria até você terminar as boas-vindas
```

**Característica 5** · 79 / 200

```text
Página Conexões: você escolhe o que se conecta por conta própria, sem reiniciar
```

**Característica 6** · 143 / 200

```text
Pesquisa limpa: DuckDuckGo sem IA como padrão; Google, Bing, Startpage, Qwant, Ecosia e Wikipédia sem telemetria nem parâmetros de rastreamento
```

**Característica 7** · 69 / 200

```text
Proteção contra impressão digital em quatro níveis, de Básica a Cofre
```

**Característica 8** · 112 / 200

```text
Senhas criptografadas com senha principal, sem exportação em texto puro, e códigos de verificação em duas etapas
```

**Característica 9** · 93 / 200

```text
Transfira suas senhas para outro Aegis com um arquivo criptografado e um código de 6 palavras
```

**Característica 10** · 73 / 200

```text
Importe favoritos e histórico do Chrome, Edge, Brave e outros navegadores
```

**Característica 11** · 58 / 200

```text
Janela privativa com Tor; o Tor só é baixado se você pedir
```

**Característica 12** · 97 / 200

```text
Modos Padrão e Workflow, temas, cores de destaque sob medida, sites em modo escuro e seis idiomas
```

### Descripción corta · 215 / 1000 (se ve entera por debajo de 270)

```text
Navegador privado com bloqueador integrado de anúncios e rastreadores. Sem telemetria, e ele não se conecta a nada por conta própria até você decidir. Pesquisa limpa, senhas bem guardadas e janela privativa com Tor.
```

### Términos de búsqueda · 7 de 7 · 11 palabras distintas de 21

Uno por casilla.

**Término 1** · 17 / 40

```text
navegador privado
```

**Término 2** · 22 / 40

```text
bloqueador de anúncios
```

**Término 3** · 26 / 40

```text
bloqueador de rastreadores
```

**Término 4** · 13 / 40

```text
navegador web
```

**Término 5** · 11 / 40

```text
privacidade
```

**Término 6** · 7 / 40

```text
adblock
```

**Término 7** · 21 / 40

```text
gerenciador de senhas
```

### Requisitos adicionales del sistema · Hardware mínimo

Uno por casilla; «Hardware recomendado» se deja vacío.

**Requisito 1** · 66 / 200

```text
Windows 10 (versão 1809 ou posterior) ou Windows 11, 64 bits (x64)
```

**Requisito 2** · 40 / 200

```text
Cerca de 400 MB de espaço livre em disco
```

### Copyright e información de marcas · 169 / 200

```text
© 2026 Secret Studios. O Aegis é baseado no código aberto do Mozilla Firefox (MPL-2.0). Firefox e Mozilla são marcas da Mozilla Foundation; o Aegis não é afiliado a ela.
```
