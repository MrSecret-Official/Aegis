# Aegis: navegador privado basado en Gecko (plan)

## Contexto
Navegador **para todo el mundo** (Windows y Linux primero, macOS más adelante). Tiene la estética de SecretOS como identidad propia y no depende de SecretOS. Objetivos: privacidad sin telemetría, limpieza, dos modos de uso (Workflow al estilo Zen y Estándar minimalista), bloqueador integrado al estilo Brave, anonimato (Tor y proxy por espacio), un gestor de contraseñas cerrado, y **el menor consumo posible**, con fluidez.

## Decisión de motor: Gecko, soft fork sobre Firefox **Release**
- **Chromium no:**
  - MV2 está saliendo del código: Chrome lo desactivó en la 138 y lo está borrando entre la 150 y la 151.
  - Desde la 153 publica cada 2 semanas.
  - Compilarlo cuesta de 3 a 5 veces más (más de 100 GB de disco, de 4 a 8 horas).
  - No tiene contenedores nativos.
- **Hard fork no:** con una persona, el navegador se quedaría semanas atrás en parches de seguridad.
- **Gecko a favor:**
  - uBO con MV2 garantizado.
  - adblock-rust (de Brave, MPL-2.0) ya va dentro de Firefox 149 y posteriores (`third_party/rust/adblock`; desde la 158,
    su fork `etp_engine` en `toolkit/components/content-classifier/`).
  - Contenedores nativos.
  - Pestañas verticales (136), grupos de pestañas (137) y Split View (149).
  - Wayland con escalado fraccional (146).
  - *Artifact builds* para iterar la interfaz en minutos.
- **Árbol propio, al estilo LibreWolf:** tarball de Firefox + `patches/` (mínimos) + `overlay/` (código nuevo) + herramientas propias.
  - Se toman piezas de **Zen** (MPL-2.0, con atribución), reescritas sobre las API nativas.
  - No se usa *surfer*, que está abandonado.
  - Plan B: pasar a ESR si el mantenimiento se dispara.

## Estructura del repositorio (`Aegis/`)
- `upstream.json`: versión de Firefox, sha256 y huella GPG; versiones de l10n, tor, uBO y fuentes.
- `patches/series` y `patches/0100-build … 0900-migracion/`:
  - Cada parche lleva una cabecera con Asunto, Por qué, Bug upstream y Origen.
  - Hay un presupuesto de líneas.
- `overlay/browser/components/aegis/`: todo lo nuevo, que se copia tal cual al árbol.
  - Módulos: `AegisStartup`, `modos/`, `espacios/`, `proxy/`, `tor/`, `escudos/`, `contrasenas/`, `urlbar/`, `content/` (páginas `about:`) y `test/`.
- `overlay/browser/components/aegis/estilos/`:
  - `tokens.css` y `mapeo-firefox.css`.
  - CSS de `chrome/` y de `in-content/`.
  - Fuentes Inter y JetBrains Mono, cargadas solo en la interfaz por `chrome://`, para que las webs no las vean.
  - Iconos de línea con `context-fill`.
- `overlay/browser/branding/aegis/` y `branding/marca.json`: el nombre se define en un solo sitio, porque hay que comprobar antes la marca «Aegis» en EUIPO y USPTO.
- `overlay/browser/components/aegis/locales/<idioma>/aegis.ftl` (en-US, es-ES, pt-BR, fr, de, it): Fluent para lo propio, registrado con `L10nFileSource`. Lo de Firefox, en los mismos seis, va dentro de la build (hecho el 2026-10-20: `aegis.py package` multi-idioma con las traducciones de `mozilla-l10n/firefox-l10n` fijadas en `upstream.json` › `l10n`; sin paquetes de idioma de addons.mozilla.org, que traen la marca de Firefox). El idioma es el de Windows.
- `settings/`:
  - `prefs/*.js`, compiladas como prefs por defecto y bloqueadas solo para la telemetría.
  - `policies.json` mínimo.
  - `search-config-v2.json`, sin códigos de socio.
  - `anonimo/user.js`.
- `filtros/listas.json` y `filtros/instantanea/`: las listas van dentro de la build, así bloquea desde el primer minuto sin red.
- `mozconfigs/`: `common`, `linux-x86_64` y `windows-x86_64-cross` (clang-cl cruzado desde Linux, como en el CI de Mozilla). MozillaBuild solo para depurar.
- `packaging/`:
  - Windows: NSIS por usuario y zip portable.
  - Linux: tarball, Flatpak, AppImage y AUR (`aegis`, `aegis-bin`).
  - `updates/`: claves públicas MAR.
- `tools/`:
  - `aegis.py`: fetch, prepare (convierte la fuente en un repo git con un commit por parche), patch, export, build, package, mar y rebase.
  - `verificar.py`, `auditar-red.py`, `capturar.py`, `huella.py`, `rendimiento.py`, `iconos.py` y `nueva-version.py`.
  - `build-wsl.sh`: la fuente y el objdir van siempre en el ext4 de WSL, nunca en `/mnt/c`.
- `docs/`: DISENO.md (derivado de SecretOS), CONEXIONES.md, PRIVACIDAD.md («no es Tor Browser»), PARCHES.md, PUBLICAR.md y RENDIMIENTO.md.
- Flujo de calidad: revisiones de estabilidad, diseño, privacidad y traducción antes de cada cambio, como en SecretOS.
  - Categorías: estabilidad, visual, **privacidad** y **rendimiento**.
  - Revisiones: estabilidad, diseño, **privacidad**, traducción y optimización.
- `Aegis.cmd` / `aegis.ps1`: panel de Windows como el de SecretOS, que lanza los builds en WSL.
- Además: docs/GUIA.md, README.md, LICENSE (MPL-2.0) y NOTICE.md (Firefox, Zen, Tor Browser, Waterfox, listas, fuentes).

## Requisitos de producto (lo que has pedido)
### Dos modos (se cambian en la bienvenida, en ajustes o con la paleta `>`)
- **Estándar** (minimalista y directo):
  - Pestañas horizontales y una sola barra: atrás, adelante, recargar, marcador, barra de direcciones con información del sitio, y a la derecha el escudo con su contador y el menú. Como en la captura de Brave.
  - **Barra de favoritos** fina, con iconos y nombres cortos, que **solo se ve en la nueva pestaña** (o siempre o nunca, a elegir).
  - Los marcadores no ocupan sitio hasta que se usan.
- **Workflow** (al estilo Zen):
  - Pestañas verticales en la barra lateral.
  - **Espacios**: cada uno con su icono, su contenedor y su proxy opcional.
  - **Esenciales**, **modo compacto**, **Glance** (abrir un enlace superpuesto) y **vista dividida** (la nativa de Firefox).
  - Paleta de órdenes `>` en la barra de direcciones.
  - Los favoritos van como sección plegable en la barra lateral.
- Los dos modos comparten perfil, marcadores y sesión. Cambiar de modo no pierde nada (se guarda en `SessionStore`).

### Escudos (bloqueador en la barra al estilo Brave, discreto y rápido)
- **Motor:**
  - adblock-rust nativo (el del árbol de Gecko), en el proceso padre, a nivel de red.
  - Más filtrado cosmético y scriptlets (parche `0600`: servicio XPCOM `nsIAegisAdblock` sobre el mismo `Engine` más un `JSWindowActor`).
  - Referencia: la integración de Waterfox (MPL).
- **Listas combinadas y sin duplicados:**
  - **uBO**: filters, privacy, badware, quick-fixes y unbreak.
  - **AdGuard**: Base, Tracking Protection, Annoyances y los regionales según el idioma.
  - **Brave**: brave-unbreak y brave-specific.
  - **EasyList** y **EasyPrivacy**.
  - Atribución de licencias en NOTICE.
- **Que las webs no lo detecten:**
  - Lo cosmético va en hojas de usuario o de agente (`windowUtils.loadSheet`). No se ven en `document.styleSheets` ni dejan rastro en el DOM.
  - Scriptlets anti-detección (`set-constant`, `abort-on-property-read`, `prevent-fetch`…) inyectados antes que los scripts de la página.
  - Se activan las listas anti-adblock de uBO y AdGuard.
  - Las peticiones bloqueadas devuelven *redirect resources* neutros (por ejemplo `noop.js`), no un error de red.
  - Ninguna extensión visible ni `moz-extension://` detectable.
  - Honestidad: es una carrera continua, y la documentación lo dice.
- **Interfaz:**
  - Un icono de escudo monocromo a la derecha de la barra de direcciones, con un contador pequeño (por ejemplo «99+»).
  - **El contador suma los anuncios y los rastreadores bloqueados en la página actual.** Junta lo que bloquea nuestro motor y lo que bloquea la protección contra rastreo de Firefox (ETP), sin contar dos veces la misma petición. Se reinicia al navegar a otra página.
    - Se actualiza como mucho unas 4 veces por segundo y solo en la pestaña visible, para no gastar.
    - Los elementos ocultados con filtros cosméticos no cuentan: no son peticiones.
  - Al pulsarlo, un panel de radio 12 con:
    - interruptor por sitio (desactivar en este sitio);
    - nivel: Normal o Estricto;
    - bloquear scripts de terceros;
    - recuento desglosado: anuncios, rastreadores y, aparte, huella digital y criptomineros (vienen de ETP);
    - total acumulado discreto («12 430 bloqueados desde que instalaste Aegis»), guardado en local y nunca enviado;
    - «¿Se ve mal este sitio?».
  - **Interruptor global** en ajustes y en el propio panel.
  - La pantalla `about:preferences#escudos` gestiona las listas, las listas propias y el intervalo de actualización.
- **Actualización de listas:**
  - Solo desde las fuentes activas.
  - Cada 4 días por defecto.
  - Sin cookies.
  - Después de aceptar la bienvenida.
  - Si falla, se mantiene la versión anterior.
- **uBlock Origin:** opcional en la bienvenida. Si se instala, Aegis deja solo su bloqueo de red, para no duplicar.

### Gestor de contraseñas cerrado
- **Bóveda cifrada:**
  - Basada en el NSS `key4.db` de Firefox, con **contraseña principal obligatoria** al primer guardado o con la llave del sistema (Windows Hello/DPAPI en Windows, libsecret en Linux) como segunda vía.
  - KDF reforzado: PBKDF2-HMAC-SHA256 con 600 000 iteraciones (Firefox: 10 000) mediante la variable de NSS `NSS_MIN_MP_PBE_ITERATION_COUNT`, sin parche (verificado en la 157: se lee al poner o cambiar la contraseña y queda guardado en `key4.db`). Argon2id exigiría parchear NSS.
  - Windows Hello no sustituye a la principal: Firefox solo lo usa para ver, copiar y editar y no cifra `key4.db` (DPAPI exigiría parchear NSS u OSKeyStore).
  - Se bloquea sola por inactividad y al cerrar.
- **Inaccesible:**
  - «Ver», «copiar» y «editar» piden autenticación (Windows Hello o la principal); «exportar CSV» no existe salvo que se active a mano (`LoginExport` envuelto, sin parche). Decidido el 2026-10-13: quitar ver y copiar dejaba al usuario sin forma de consultar sus contraseñas.
  - Solo autocompleta en el sitio correcto, tras pulsar el usuario, nunca de forma automática en iframes de otros dominios.
  - Lo único que se ve es la lista de sitios.
- **Solo sale con un código de transferencia:**
  - Se genera un paquete cifrado (`.aegisvault`) de un solo uso con una clave derivada de un **código de 6 palabras** que se muestra en pantalla y caduca.
  - Se importa en otro Aegis con ese código.
  - **Fase 2 (Aegis → Aegis): implementada el 2026-10-17; falta probarla con un binario que arranque.** Código en `overlay/browser/components/aegis/contrasenas/transferencia/` y `dialogos/transferencia-*`; el formato, sus límites y lo que no protege, en `docs/PRIVACIDAD.md`, «Pasar las contraseñas a otro Aegis». Lo decidido:
    - **Exportar** (perfil de origen, Ajustes › Contraseñas y autorrelleno › «Pasar a otro Aegis»): pide siempre la autenticación (Windows Hello o la contraseña principal, con `LoginHelper.requestReauth` y sin la gracia de 5 minutos), el usuario elige dónde guardar en el selector nativo, se descifran los inicios de sesión (`getAllLogins`) y se serializan en JSON: origen, origen del formulario, ámbito HTTP, usuario, contraseña, campos y las tres fechas; sin GUID, sin contador de usos ni datos del equipo.
    - **Códigos de verificación:** viven en otro almacén (`aegis-autenticador.json`, cifrado con la misma clave de `key4.db`), así que no van solos: se descifran tras la misma autenticación y van dentro del mismo cifrado, junto a su inicio de sesión, salvo que se desmarque la casilla (marcada de serie; el diálogo avisa de que el archivo lleva entonces los dos pasos). Al recibirlos, solo en cuentas sin código.
    - **Código:** 6 palabras de la lista grande del EFF (7776 palabras, unos 77,5 bits; `palabras.sys.mjs`, generada una vez de eff.org y comprobada: 7776 líneas, dados 11111–66666, sin repetidas, sha256 `addd3553…903e`, que `verificar.py` vuelve a comprobar), elegidas con `crypto.getRandomValues` y rechazo por módulo, enseñadas una sola vez; nunca se guardan. Normalización: NFKC, minúsculas y cualquier cosa que no sea a–z como separación.
    - **Clave:** PBKDF2-SHA256 de WebCrypto con sal aleatoria de 16 bytes y **2 000 000 de iteraciones** (fijo en el formato; medido: 0,36 s en node 22 en el equipo de pruebas y, por la relación de NSS, alrededor de 1 s en el navegador), para una clave AES-256 no extraíble. Al importar se aceptan de 600 000 a 5 000 000 (fuera de eso, se rechaza antes de derivar nada).
    - **Cifrado:** AES-256-GCM (en lugar de XChaCha20-Poly1305, que WebCrypto no tiene) con IV aleatorio de 12 bytes. Cabecera JSON en claro (formato, versión, kdf, iteraciones, sal, cifrado, iv) que va también como AAD; dentro, id aleatorio de 16 bytes, hora de creación y las contraseñas, con relleno a múltiplos de 4 KiB.
    - **Un solo uso y caducidad:** los impone el Aegis que importa (el identificador, en `aegis.contrasenas.transferencia.usados`; rechaza los de más de 24 h y los fechados más de 5 min en el futuro). La protección real es el código; se dice así en la interfaz y en `PRIVACIDAD.md`.
    - **Importar** (Ajustes › «Recibir de otro Aegis» y Ajustes › Importar datos › «Aegis», cuya página de las contraseñas ya no dice «próximamente»: su «Seleccionar archivo» elige el `.aegisvault` y luego se pide el código): un único error para código mal escrito y archivo tocado; entra por `LoginHelper.maybeImportLogins` (no duplica) y, así, por la contraseña principal obligatoria, que se pide antes de abrir el diálogo (`gDialogBox` pondría el suyo en cola detrás). Resumen (nuevas, actualizadas, ya estaban) y botón para borrar el archivo.
    - **Portapapeles:** «Copiar» lo marca como sensible y lo borra a los 60 s si sigue ahí, con un único temporizador tras copiar (Firefox no tiene un borrado propio), como el de los códigos de verificación.
    - Nada conecta con la red: los dos diálogos llevan `default-src 'none'` y `connect-src 'none'`.
    - **Falta, con binario:** el diálogo de Windows Hello y el de la contraseña principal en los dos sentidos, el selector de archivos, la ida y vuelta entre dos perfiles reales (con y sin códigos de verificación), el asistente (que «Saltar» siga con el resto), el tiempo real de PBKDF2 en NSS (si pasa de 2 s, bajar `ITERACIONES` sin bajar de 600 000) y las capturas para el `inspector-visual`.
  - Para otros navegadores, una exportación cifrada que se abre con el mismo código (formato documentado; importarla en otro navegador puede exigir descifrarla una vez).
- **Sincronización entre dispositivos Aegis:** con la sincronización en tu nube (ver «Cuentas»), cifrada de extremo a extremo con el código de sincronización. Nunca con una cuenta de Mozilla.

### Cuentas de Google, Microsoft y GitHub (sin telemetría)
Regla general: Aegis habla con estas empresas **solo** cuando tú inicias sesión o sincronizas. Nunca les manda datos de uso. Cada conexión figura en `CONEXIONES.md` y se puede apagar.

- **Perfiles con identidad:**
  - Se usa el gestor de perfiles moderno de Firefox (perfiles con nombre, avatar y tema; `browser.profiles.enabled` **[VERIFICAR estado en la versión fijada]**). Cada perfil es un conjunto de datos separado.
  - «Crear perfil con Google, Microsoft o GitHub»: OAuth 2.0 con PKCE como cliente nativo, con redirección a `127.0.0.1` (loopback) y abriendo el inicio de sesión real del proveedor en una pestaña.
    - Pide solo los permisos mínimos: `openid profile email` en Google y Microsoft, `read:user` en GitHub.
    - Guarda en local el nombre y la foto, y nada más. Si no se activa la sincronización, no se queda con ningún token.
  - La sesión de esa cuenta (Gmail, Outlook, GitHub) vive en ese perfil y no se ve desde los demás.
  - Hace falta registrar una app OAuth por proveedor (identificadores de cliente públicos en `branding/marca.json`). Google exige verificar la app **[VERIFICAR requisitos]**.
- **Inicio de sesión sin fricción:**
  - «Iniciar sesión con Google, Microsoft o GitHub» en webs de terceros funciona también en modo estricto. Para ello:
    - las listas de corrección de Brave y uBO (unbreak) van activas;
    - se mantienen las heurísticas de acceso al almacenamiento de las ventanas emergentes de inicio de sesión (`privacy.restrict3rdpartystorage.heuristic.*`);
    - hay una lista blanca mínima de dominios de identidad (accounts.google.com, login.microsoftonline.com, login.live.com, github.com/login) a los que no se aplican los filtros cosméticos ni los scriptlets.
  - Los rastreadores de esas empresas en otras webs **siguen bloqueados**: la excepción afecta solo al flujo de inicio de sesión.
  - Pruebas: una batería de flujos reales de inicio de sesión (Google, Microsoft, GitHub, «Iniciar sesión con…» en webs conocidas) con Marionette, con cuentas de prueba.
- **Sincronizar en tu nube**, cifrado de extremo a extremo:
  - **Qué se guarda:** marcadores, ajustes, espacios y modo, listas propias de Escudos y, si se quiere, las contraseñas (cifradas además con la clave de la bóveda).
  - **Dónde:**
    - Google Drive, en la carpeta oculta de la app (`drive.appdata`);
    - OneDrive, en la carpeta de la app (`Files.ReadWrite.AppFolder`);
    - GitHub, en un repositorio privado `aegis-sync` mediante una GitHub App con permiso de contenidos **solo en ese repo**, para no pedir el permiso `repo` completo.
  - **Cifrado:**
    - La clave sale de un **código de sincronización** de 24 palabras (256 bits), que se crea en el primer dispositivo y se introduce en los demás.
    - AES-256-GCM (WebCrypto), con una clave por tipo de dato.
    - El proveedor solo ve archivos cifrados, de tamaño acolchado y con nombres opacos.
  - **Funcionamiento:**
    - Registros versionados con fusión por elemento (el último cambio gana por campo; los marcadores con un árbol con IDs estables).
    - Sube solo cuando hay cambios, agrupados (debounce de 30 s), y baja al arrancar y al volver de reposo. Sin consultas periódicas frecuentes.
  - **Si se pierde el código:** los datos de la nube no se pueden recuperar. Se dice claro al crearlo.
  - Sustituye a la idea anterior de syncstorage-rs autoalojado: no hace falta servidor propio. El código de transferencia de contraseñas de 6 palabras se mantiene para pasar las contraseñas a otro navegador.

### Buscar en Google sin ser rastreado
- Google está disponible como motor, **sin código de socio** (`client=` y similares), con la opción «Solo resultados web» (`udm=14`, sin respuestas de IA).
- **Las búsquedas van en un contenedor propio de búsqueda**, que se borra al cerrar. Aunque tengas sesión de Google en el perfil, Google no ve tu cuenta al buscar.
- **Limpieza:**
  - los enlaces de resultados `/url?q=…` se reescriben al destino directo (scriptlet y regla de red);
  - se quitan los parámetros de rastreo (`ved`, `ei`, `sa`, `usg`, `gs_lcrp`, `oq`, `sclient`…) con el *query stripping* nativo más nuestra lista;
  - se bloquean los pings (`/gen_204`, `/client_204`, `/log`), los resultados patrocinados y los «Anuncios»;
  - el aviso de cookies se rechaza solo, con las listas de molestias (annoyances) o con la cookie de consentimiento rechazada.
- **Sugerencias mientras escribes:** apagadas de serie, porque mandan cada tecla a Google. Se pueden activar.
- **Honestidad:** Google sigue viendo tu IP y lo que buscas. Opción de enviar el contenedor de búsqueda por un proxy, con aviso de que por Tor Google pide muchos captchas.

### Buscar sin ser rastreado en los demás buscadores
- Lo mismo que con Google en DuckDuckGo (el de serie), Bing, Startpage, Qwant, Ecosia y Wikipedia: `busqueda-limpia.sys.mjs` (pref `aegis.buscadores.limpio`), sin parches.
- **Sin códigos de socio** (parche `0400-privacidad/0002`) ni los parámetros fijos de la configuración de Firefox (`form=MOZLBR` en Bing, `sourceid=Mozilla-search` en Wikipedia).
- **Limpieza:** parámetros de seguimiento de la búsqueda (`t`, `perf_id`, `cvid`, `form`, `wprov`…), enlaces de resultados directos (`duckduckgo.com/l/?uddg=`, `bing.com/ck/a`) y pings cortados (`improving.duckduckgo.com`, `bing.com/fd/ls/`, `vf.startpage.com`, `sp.ecosia.org`, `intake-analytics.wikimedia.org`…). Cada regla, de una lista de referencia (EasyPrivacy, AdGuard, uBlock filters, ClearURLs).
- **DuckDuckGo sin IA:** las búsquedas hechas desde el navegador van a `noai.duckduckgo.com`, su versión sin IA (como su extensión oficial No-AI, sin sus marcas `t=noaiext` y `bext=noai`). En Bing, Qwant y Ecosia no hay un parámetro documentado: no se inventa.
- **Lo que decide cada persona, en el panel de Escudos** (solo en su buscador): quitar los anuncios de DuckDuckGo (`k1=-1`, apagado de serie: DuckDuckGo pide que sea uso individual) y sumar puntos de Microsoft Rewards en Bing (apagado de serie: su actividad se corta y no se suman puntos).
- **Sugerencias de Startpage** a su dirección pública (`/osuggestions`): la de la configuración de Firefox no contesta sin código de socio.
- **Cuando Escudos tenga `$removeparam` y `urlskip`:** la limpieza de parámetros y los enlaces directos pueden pasar a una lista propia de Aegis; aquí quedarían noai, los interruptores del panel y las sugerencias.
- **Honestidad:** el buscador sigue viendo tu IP y lo que buscas (`docs/PRIVACIDAD.md`).

### Rendimiento: lo mínimo, con fluidez
- **Compilación:**
  - `--enable-release`, LTO cruzado y **PGO** (primero en Linux, luego en Windows).
  - Sin crashreporter, default-browser-agent, telemetría (Glean sin subida), Normandy/Nimbus, Pocket, IA ni sugerencias patrocinadas.
- **Ejecución:**
  - Pestañas de espacios ocultos y pestañas inactivas **descargadas** (`browser.tabs.unloadOnLowMemory` más descarga por tiempo de inactividad configurable).
  - Ningún módulo propio con temporizadores: `IdleDispatch` y cero trabajo en reposo.
  - Nada animado en reposo (DISENO).
  - Se mantiene Fission, porque la seguridad no se sacrifica.
  - Sin precarga ni conexiones especulativas: menos red y además más privado.
- **Presupuesto en `docs/RENDIMIENTO.md`, que mide `tools/rendimiento.py`:**
  - El arranque en frío y la memoria en reposo con 1 y con 10 pestañas no superan los de Firefox con el mismo perfil.
  - CPU en reposo: aproximadamente 0 %.
  - El optimizador lo vigila en cada fase.

### Anonimato (nivel máximo)
- **Proxy por espacio o contenedor:**
  - `AegisProxyRouter.sys.mjs` implementa `nsIProtocolProxyChannelFilter` en el proceso padre y lee `loadInfo.originAttributes.userContextId`, como `TorDomainIsolator` de Tor Browser.
  - Perfiles SOCKS5 (con usuario y contraseña), HTTP o Tor.
  - El DNS va por el proxy.
  - Si el proxy cae, la conexión se bloquea (sumidero) en vez de salir sin él.
  - Parche pequeño de WebRTC para forzar `proxy_only` en esos contextos.
- **Tor:**
  - El tor en C (0.4.9 o posterior) como proceso hijo bajo demanda: código portado de `tor-launcher` y `torconnect` de Tor Browser.
  - Puentes lyrebird y snowflake.
  - Aislamiento por sitio con usuario y contraseña SOCKS distintos.
  - «Nueva identidad».
  - Arti, en la v2.
- **Ventana anónima, v1:** instancia «Aegis anónimo» con su propio perfil:
  - RFP con letterboxing, Tor global y nada en disco.
  - Sin WebRTC ni HTTP/3.
  - HTTPS-Only.
- **Ventana anónima, v2:** dentro del mismo perfil, con un `userContextId` reservado.
- Fuera del modo anónimo: FPP agresivo de serie y contenedores.
- Texto honesto en la interfaz: «no es Tor Browser».

### Privacidad y telemetría
- Prefs al estilo arkenfox y LibreWolf: telemetría, estudios, Pocket, IA, PPA, sugerencias rápidas, región, portal cautivo y precarga apagados; ETP en Estricto; HTTPS-Only; contenedores activos.
- La búsqueda usa solo la configuración local.
- Remote Settings se mantiene solo para las colecciones de seguridad (CRLite, lista de bloqueo de complementos) y las listas de la protección contra rastreo (que Firefox ya baja de ahí y no de shavar), y no arranca hasta después de la bienvenida (`about:conexiones`, parche `0400-privacidad/0003`).
- **Cero conexiones** hasta acabar la bienvenida. Después, solo las de la lista blanca de `CONEXIONES.md`, y cada una se puede apagar.
- Safe Browsing apagado de serie y ofrecido en la bienvenida, con clave propia.
- DRM y OpenH264 bajo demanda.
- El User-Agent es el de Firefox y se conserva el ID de Firefox, para que funcionen las extensiones de AMO.

### Identidad en el sistema
Aegis no se hace pasar por Firefox ante Windows (ni ante Linux), pero sí ante las webs y las extensiones. Antes,
con los valores de Firefox, compartía con un Firefox instalado la carpeta de perfiles, `profiles.ini`/`installs.ini`,
las claves del registro y el nombre de remoting (abrir Aegis con Firefox abierto podía abrir una ventana del otro).

| Valor | Aegis | Dónde se pone | Qué decide |
|---|---|---|---|
| `MOZ_APP_VENDOR` | `Aegis` | parche `0200-branding/0001` (`browser/moz.configure`) | `Vendor` de `application.ini`; claves `HKCU\Software\Aegis\Firefox\…` (`Launcher`, `PreXULSkeletonUISettings`, `DllPrefetchExperiment`), `…\firefox\Installer\<hash>`, prefijo de los perfiles temporales de tareas en segundo plano, valores de «Iniciar con Windows» |
| `MOZ_APP_PROFILE` | `Aegis` | el mismo parche | carpeta de perfiles: `%APPDATA%\Aegis` (`profiles.ini`, `installs.ini`, `Profiles\`) y `%LOCALAPPDATA%\Aegis\Profiles` (caché); en Linux, `~/.aegis` |
| `MOZ_APP_REMOTINGNAME` | `aegis` | `mozconfigs/common` | a qué ventana pasa la orden una segunda ejecución; en Linux, `WM_CLASS` y `app_id` |
| `MOZ_APP_BASENAME` | `Firefox` (sin tocar) | — | `Name` de `application.ini`, y de él sale el User-Agent: si no fuera «Firefox», añadiría «Aegis/158.0» |
| `MOZ_APP_NAME` | `firefox` (sin tocar) | — | `firefox.exe`; los lectores de pantalla (NVDA, JAWS) y otros programas reconocen el navegador por ese nombre |
| `MOZ_APP_ID` | `{ec8030f7-…}` (sin tocar) | — | compatibilidad y actualizaciones de las extensiones de AMO |
| `MOZ_APP_DISPLAYNAME` | `Aegis` | `overlay/browser/branding/aegis/configure.sh` | nombre visible |
| `CompanyName` y `LegalTrademarks` de `firefox.exe`, `private_browsing.exe` y `plugin-container.exe` | `Aegis` y vacío | parche `0200-branding/0002` (su `module.ver`; `aegis.py build` rehace el `.rc`) | Propiedades › Detalles del ejecutable en Windows (antes «Mozilla Corporation» y la marca de Firefox). `LegalCopyright` sigue siendo el de Firefox: es la atribución de la MPL. Las DLL (`xul.dll`…) siguen con los valores de serie |

- Vendor y Profile son `project_flag` de Firefox: solo `imply_option` los fija (el mozconfig o el `configure.sh` de
  la marca no valen). Por eso hay un parche, de tres líneas.
- Efecto secundario: la ventana provisional de arranque de Windows (`browser.startup.preXulSkeletonUI`, que pinta
  la barra de Firefox antes de cargar la interfaz) busca `profiles.ini` en `%APPDATA%\<fabricante>\<nombre>`, sin
  mirar `Profile`, así que no se muestra. Con la interfaz propia de Aegis, esa ventana con la forma de Firefox
  tampoco encajaba.
- Igual que esa ventana, la lista de bloqueo de DLL del lanzador va en `%APPDATA%\<fabricante>\<nombre>`: aparece
  `%APPDATA%\Aegis\Firefox\blocklist-<hash>` junto a los perfiles. Es solo de Aegis y no molesta (comprobado el
  2026-10-17, `out/pruebas/2026-10-17-identidad/`).
- **Lo que sigue compartido con Firefox**, porque Firefox lo tiene fijo en el código y cambiarlo no compensa:
  - `C:\ProgramData\Mozilla-1de4eec8-1241-4177-a864-e594e8d1fb38\updates\<hash>`: la carpeta de trabajo de las
    actualizaciones (`commonupdatedir.cpp`). Cada instalación tiene la suya, por el hash de su ruta: no se mezclan.
  - `HKCU\Software\Mozilla\NativeMessagingHosts`: a propósito, para que los programas de las extensiones (gestores de
    contraseñas…) funcionen igual que en Firefox.
  - `Software\Policies\Mozilla\Firefox` (directivas de grupo) y `HKCU\Software\Mozilla\Firefox\TaskBarIDs` (Aegis
    no escribe ahí; sin valor, el AUMID es el hash de la carpeta): siguen el nombre (`Firefox`).
  - La entrada «Firefox Encrypted Storage» del Administrador de credenciales (OSKeyStore, nombre + « Encrypted
    Storage»): la clave con la que se cifran las tarjetas del autorrelleno. Se crea solo si no existe y Firefox solo
    la borra en sus pruebas y en la recuperación de copias de seguridad, así que compartirla no rompe nada; separarla
    exigiría otro parche (`OSKeyStore.sys.mjs`).
  - `%APPDATA%\Mozilla\Extensions\{ec8030f7-…}` (complementos instalados por otros programas, que Firefox pregunta
    antes de activar).
- Las webs no notan nada: `navigator.vendor` es siempre `""` y el User-Agent no cambia. Las extensiones ven
  `vendor: "Aegis"` en `runtime.getBrowserInfo()` (el nombre sigue siendo «Firefox»).
- LibreWolf hace algo parecido: `MOZ_APP_REMOTINGNAME` y `--with-app-name` en el mozconfig, y un parche de
  `nsXREDirProvider.cpp` para sus carpetas. Aegis no cambia el ejecutable (`firefox.exe`, ver la tabla).

### Estética (de SecretOS)
- **Tokens** de `SecretOS-Private/system/share/centro/ui/Estilo.qml`:
  - Oscuro: fondo `#0a0a0b`, lateral `#0f0f11`, superficie `#151517`, texto `#f4f4f5`, secundario `#a1a1aa`, apagado `#85858e`, principal `#ececee`.
  - Claro: fondo `#f5f5f7`, superficie `#fff`, texto `#0a0a0b`, secundario `#6b6b73`, principal `#1c1c1e`.
  - Estados: error, aviso y positivo.
- **Forma:**
  - Radios 5, 7, 8, 10, 12, 14 y 20, concéntricos.
  - Bordes de 1 px y rejilla de 4.
- **Tipografía:** Inter, con pesos 400 y 600.
- **Movimiento:**
  - De 90 a 300 ms, con OutCubic.
  - Respeta `prefers-reduced-motion`.
  - Nada en reposo.
- **Iconos:** de línea, con trazo 1,5.
- **Énfasis:** Monocromo de serie, o el del Sistema o uno Personalizado. Solo para selección, foco, interruptores y el día de hoy.
- **Capas de CSS:** `tokens.css`, luego `mapeo-firefox.css` (variables de Firefox y design-system), luego CSS estructural. El contenido web va en una tarjeta de radio 12.
- **Densidad del navegador:**
  - Pestaña de 36 px.
  - Barra de direcciones de 34 px con radio 7.
  - Botones de icono de 28 px.
- **Páginas propias:**
  - Nueva pestaña `about:aegis-inicio`, limpia y sin feeds.
  - Bienvenida: idioma y apariencia, modo (Estándar o Workflow), conexiones, importar, escudos y uBO.
- **Cristal:** en Windows 11, Mica (opcional). En Linux no se ofrece, porque no hay translucidez sin desenfoque.
- **Iconos de partida:** los glifos de `SecretOS-Private/system/share/centro/iconos.js` y `system/setup/icons/`, normalizados con `tools/iconos.py`.

## Hoja de ruta (unos 7 a 10 meses hasta la 1.0 en Windows y Linux)
| Fase | Qué se entrega | Hito |
|---|---|---|
| 0 Herramientas (1-2 sem.) | `aegis.py` fetch, prepare y build. Build sin marca en WSL Arch y Windows cruzado. flujo de calidad, docs/GUIA.md y `verificar.py` v1 | Arranca |
| 1 Limpieza y marca (2-3 sem.) | Marca Aegis, mozconfig sin telemetría, prefs, búsqueda local, multi-idioma (6), `CONEXIONES.md` y `auditar-red.py` | **0.1** |
| 2 Tema y modo Estándar (3-4 sem.) | Tokens, mapeo, CSS, iconos, nueva pestaña, bienvenida, barra de favoritos discreta | **0.3** |
| 3 Modo Workflow (6-10 sem.) | Espacios, esenciales, compacto, Glance, vista dividida, paleta `>`, borrar al cerrar por espacio, descarga de pestañas | **0.5** |
| 4 Escudos (3-5 sem.) | Red, cosmético y scriptlets, listas combinadas, anti-detección, icono y panel en la barra, ajustes de listas | **0.7** |
| 5 Contraseñas (3-4 sem.) | Bóveda obligatoria, interfaz cerrada, código de transferencia | **0.8** |
| 5b Cuentas y nube (4-6 sem.) | Perfiles con Google, Microsoft o GitHub; inicio de sesión sin fricción; sincronización E2E en Drive, OneDrive o GitHub; Google limpio (contenedor de búsqueda y limpieza de enlaces) | **0.85** |
| 6 Anonimato (5-8 sem.) | Proxy por espacio, Tor, Aegis anónimo | **0.9** |
| 7 Paquetes y CI (3-5 sem., en paralelo) | NSIS, portable, Flatpak, AppImage, AUR; MAR con claves propias y `update.xml` estático; PGO; `nueva-version.py` (avisa con la beta) | **1.0** |
| 8 Después | Arti, ventana anónima v2, macOS, integración opcional en SecretOS (opción «Navegador: Brave/Aegis» en `post-install.sh` y `secretos-colores` con `aegis.accent`) | — |

## Verificación
- **`tools/verificar.py`:**
  - Los parches se aplican con fuzz 0 sobre la versión fijada.
  - Cabeceras y presupuesto de líneas.
  - Lint de prefs frente a `StaticPrefList.yaml`, `all.js` y `firefox.js` (detecta las renombradas).
  - `policies.json` frente a su esquema.
  - FTL completo en los 6 idiomas y sin ids huérfanos.
  - Ni «Firefox» ni «Mozilla» en nuestros textos.
  - Cabeceras MPL.
  - LF y BOM.
  - `mach lint`.
- **Pruebas de `mach`:** `./mach test browser/components/aegis/` más los mochitests de tabbrowser, sessionstore, urlbar, preferences, contextualidentity y passwordmgr, y los xpcshell de proxy, en modo `--headless`.
- **Humo con Marionette:**
  - Los dos modos.
  - Espacios con su `userContextId`.
  - Glance, vista dividida y modo compacto.
  - La sesión se restaura.
  - Un MAR de prueba se aplica.
  - El gestor de contraseñas no deja exportar en claro.
- **Red (`auditar-red.py`):** netns, tcpdump y `MOZ_LOG`.
  - Perfil nuevo durante 10 minutos: 0 paquetes.
  - Después de la bienvenida: solo los de la lista blanca.
  - En un espacio con proxy: ningún DNS ni TCP directo.
- **Huella:** CreepJS, coveryourtracks, arkenfox TZP y browserleaks.
- **Escudos:**
  - Página local de pruebas.
  - d3ward toolz, canyoublockit y adblock-tester.
  - Páginas con detector de adblock: no salta.
  - Escudos desactivados: el contador queda a 0.
  - El contador coincide con las peticiones bloqueadas que registra `MOZ_LOG` (anuncios más rastreadores, sin dobles) y vuelve a 0 al cambiar de página.
- **Tor:**
  - check.torproject.org.
  - Sin fugas de UDP/53 ni WebRTC.
  - `.onion`.
  - «Nueva identidad».
  - Tor se cierra con Aegis.
- **Cuentas y Google:**
  - Sin sincronización activa, cero conexiones a Google, Microsoft o GitHub salvo las que provoca el usuario al navegar.
  - Lo que se sube a la nube es ilegible sin el código: se comprueba descargándolo y buscando texto en claro.
  - Dos perfiles sincronizados convergen tras cambios cruzados.
  - En una búsqueda de Google, la captura de red no tiene cookies de la cuenta, los enlaces van directos y no salen pings `gen_204`.
- **Rendimiento (`tools/rendimiento.py`):** arranque, memoria y CPU en reposo frente a Firefox de la misma versión.
- **CI:**
  - GitHub alojado para lint, verificar y parches (cron diario contra beta y release).
  - Builds completas en un runner autoalojado (el portátil en WSL) con sccache.
- **Revisores:** guardian, inspector-visual y auditor-privacidad tienen que dar el APROBADO antes de cada publicación.

## Riesgos principales
1. **Mantenimiento cada 4 semanas.** Se mitiga con overlay antes que parches, el aviso de la beta, funciones nativas y el plan B de ESR.
2. **adblock-rust en Gecko es un prototipo.** El puente propio va aislado y uBO queda como alternativa.
3. **RAM al compilar.** Con 16 GB va justo usando LTO: `.wslconfig` con 24 GB de memoria y 16 GB de swap. Hacen falta unos 60 GB libres.
4. **Marcas y licencias:**
   - «Aegis» (Aegis Authenticator, Lockheed).
   - Nada de logos de Firefox.
   - MPL, GPL de uBO y de las listas, OFL de las fuentes.
5. **Safe Browsing, DRM y Widevine:** apagados de serie, bajo demanda.
6. **Firma de Windows:** no hay (toda firma reconocida exige un documento de identidad). SmartScreen avisa la primera
   vez y el Control inteligente de aplicaciones de Windows 11, si está activado, bloquea Aegis. Las actualizaciones
   (MAR con clave propia) no se ven afectadas.
7. **Expectativas de anonimato:** textos honestos.
8. **Apps OAuth de los proveedores:** hay que registrarlas a nombre del proyecto. Google pide verificar la app (y más si el permiso de Drive es sensible), y los proveedores pueden revocar o limitar el acceso. Cada proveedor va aislado detrás de una misma interfaz `AegisNube`, para poder quitar uno sin tocar los demás.

## Primer paso al aprobar (Fase 0)
1. Crear el esqueleto del repositorio: docs/GUIA.md, `docs/DISENO.md`, el flujo de calidad adaptado de SecretOS, `upstream.json` (Firefox Release vigente, mirando `product-details.mozilla.org`) y `tools/aegis.py` fetch y prepare.
2. Preparar WSL: ajustar `.wslconfig` (pide confirmación) y ejecutar `mach bootstrap` en `~/aegis`.
3. Hacer la primera build sin marca en Linux, y después la de Windows cruzada.
