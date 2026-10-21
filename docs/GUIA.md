# Aegis: guía del proyecto

Navegador privado basado en Firefox (Gecko), **para todo el mundo**. Orden de dispositivos: **Windows → SecretOS
(Linux, Arch con linux-zen) → Android**. Hasta que la versión de Windows esté hecha, se trabaja solo en Windows: lo
de Linux se conserva pero no se toca. La presentación para personas está en `README.md`; el plan técnico completo, en `docs/PLAN.md`; el
calendario, en `docs/PLANNING.md`. Léelos antes de cambiar algo grande.

Todo el proyecto está en español: comentarios, mensajes de los scripts, documentación y commits. Los textos de la
interfaz se escriben en Fluent (`.ftl`) en seis idiomas (es-ES, en-US, pt-BR, fr, de, it).

**Lenguaje visual:** `docs/DISENO.md` (derivado de SecretOS: monocromo, Inter, sobrio). Todo lo que se ve lo cumple.

## Principios que no se negocian

1. **Cero telemetría y cero conexiones no pedidas.** Con un perfil nuevo, Aegis no envía ni un paquete hasta que el
   usuario termina la bienvenida o navega. Después, solo las conexiones de `docs/CONEXIONES.md`, cada una con su
   interruptor. Una llamada de red nueva (`fetch`, `XMLHttpRequest`, `newChannel`, una URL `https://` en código)
   sin entrada en `CONEXIONES.md` es un fallo.
2. **Sin servidores propios.** El autor solo crea las aplicaciones. Nada puede depender de un servidor de Aegis:
   - actualizaciones: archivos estáticos (`update.xml` y `.mar`) en GitHub Releases o Pages;
   - sincronización: en la nube del propio usuario (Google Drive, OneDrive, repo privado de GitHub), cifrada de
     extremo a extremo;
   - listas de filtros: directamente de sus autores;
   - lo que sí hay que registrar (apps OAuth de Google, Microsoft y GitHub, clave de Safe Browsing, firma de código)
     son identificadores públicos o trámites, no servidores.
3. **Seguir a Firefox de cerca.** Soft fork sobre Firefox **Release**: cada versión nueva (cada 4 semanas) y cada
   corrección de seguridad se integra en días. Por eso:
   - todo lo nuevo va en `overlay/` (archivos que no existen en Firefox);
   - un parche solo toca archivos de Firefox, con el mínimo de líneas (un `#include`, una línea de `jar.mn`, una
     llamada a nuestro código);
   - se prefieren las funciones nativas de Firefox (pestañas verticales, grupos, vista dividida, contenedores) a
     reescribirlas.
4. **Ligero.** Ningún módulo propio con temporizadores ni trabajo en reposo; nada animado en reposo; las pestañas
   inactivas se descargan. Se mide (`tools/rendimiento.py`, cuando exista) contra Firefox de la misma versión.
5. **Honestidad.** Aegis anónimo no es Tor Browser, y el bloqueador no es indetectable al 100 %. Los textos lo dicen.

## Estructura

```
Aegis/
├── upstream.json        versión de Firefox fijada (URL, sha256, huella GPG de Mozilla), revisión de Aegis y traducciones (l10n)
├── patches/series       parches en orden; patches/<grupo>/*.patch (0100-build … 0900-migracion)
├── overlay/             archivos nuevos que se copian tal cual al árbol (browser/components/aegis/, temas…)
├── mozconfigs/          common + linux-x86_64 + windows-x86_64-cross (aegis.py los concatena)
├── settings/            prefs (se compilan como prefs por defecto), policies.json mínimo, búsqueda
├── filtros/             catálogo de listas y la instantánea que va dentro de la build
├── branding/            marca.json: nombre, repositorio de publicación y canal MAR (en un solo sitio)
├── updates/claves/      certificados PÚBLICOS de firma de las actualizaciones (las privadas, nunca aquí)
├── packaging/           instalador propio, zip portable, tarball, Flatpak, AppImage, AUR (msix/: Microsoft Store, docs/TIENDA.md)
├── tools/
│   ├── aegis.py         fetch | prepare | patch | overlay | export | mozconfig | bootstrap | build | run | package |
│   │                    claves-mar | mar | publicar | msix | estado
│   ├── build-wsl.sh     lanza aegis.py en WSL Arch como el usuario «aegis» (registro en ~/aegis/registro/)
│   └── verificar.py     comprobaciones automáticas (antes de cada cambio y de cada versión)
├── web/                 web pública: política de privacidad y aviso legal (GitHub Pages)
└── docs/                GUIA.md (esta guía), PLAN.md, PLANNING.md, DISENO.md, ACTUALIZACIONES.md, CONEXIONES.md…
```

## Construir

- **Dónde:** en Linux. En Windows 11, en WSL con la distribución `archlinux`.
  - `tools/build-wsl.sh` corre como root solo para preparar el entorno: paquetes base, el usuario `aegis` y un
    sudo sin contraseña limitado a `pacman` (lo usa `mach bootstrap`). mach no se ejecuta como root.
  - El árbol vive en `/home/aegis/aegis/src/firefox-<v>` y el objdir, aparte, en `/home/aegis/aegis/obj/firefox-<v>`
    (así `prepare --limpio` no tira la compilación). Todo en ext4: **nunca en `/mnt/c`**; `aegis.py` se niega, y
    también a ejecutarse como root.
  - Una orden a la vez: `build-wsl.sh` toma un cerrojo (`~/aegis/.cerrojo`).
  - El repo se lee desde `/mnt/c` (solo parches, overlay y mozconfigs, que son pequeños).
- **Pasos:** `fetch` (tarball verificado con sha256 y la firma GPG de Mozilla, y las traducciones) → `prepare`
  (árbol como repo git: un commit con la fuente intacta, etiqueta `aegis-upstream`, y un commit por parche) →
  `bootstrap` → `build` → `package` (multi-idioma) → `run` o `instalar-prueba`.
- **Idiomas (build multi-idioma):** la interfaz entera, de Firefox y de Aegis, va en en-US, es-ES, pt-BR, fr, de e
  it, y se usa el de Windows (`intl.locale.requested` vacía, `50-interfaz.js`).
  - Las traducciones de Firefox son las del monorepo `mozilla-l10n/firefox-l10n` en el commit que fija
    `browser/locales/l10n-changesets.json` de la versión de Firefox (`upstream.json` › `l10n`: commit, URL de
    codeload, sha256 e idiomas). `fetch` comprueba que el commit es el de Firefox (del árbol intacto o del tarball),
    descarga el `.tar.gz` (unos 88 MB), lo comprueba con su sha256 y extrae **solo** esos cinco idiomas a
    `~/.mozbuild/l10n-central` (la ruta de serie de configure: no hace falta `--with-l10n-base`), con un sello
    (`.aegis-l10n.json`). Si GitHub cambiara la compresión y el sha256 dejara de cuadrar, `fetch` falla; plan B en
    `aegis.py` (`git fetch --depth 1 <commit>` y un sha256 nuevo).
  - `package` es `mach package-multi-locale --locales de es-ES fr it pt-BR`, siempre **después** de `build` (una build
    incremental deja `dist/bin` otra vez solo en en-US). Se niega con `NIGHTLY_BUILD` (mach clonaría y pondría al día
    firefox-l10n sin fijar nada) y comprueba el paquete: `res/multilocale.txt` con los seis y, en cada idioma, el
    `brand.ftl` y el `brand.properties` de Aegis (la entrada de branding de `l10n-manifest.json`, `is_locale: false`,
    copia los de en-US de la marca a todos); ningún archivo de marca del paquete dice «Firefox» ni «Mozilla». `mar` y
    `msix` lo vuelven a comprobar; `msix` declara los seis en el `AppxManifest.xml`.
  - Nada de paquetes de idioma (langpacks) de addons.mozilla.org: traen la marca de Firefox. Ajustes › Idioma solo
    ofrece los seis (sin «Buscar más idiomas…»; `intl.multilingual.downloadEnabled` en false).
  - **Diccionarios de ortografía** (`upstream.json` › `diccionarios`): uno por idioma, con el código del idioma de la
    interfaz por nombre (`de.dic`, `es-ES.dic`…), así el corrector usa de serie el del idioma de la app (no se fija
    `spellchecker.dictionary`). es-ES, pt-BR y fr son los de firefox-l10n (los que Mozilla pone en sus builds de esos
    idiomas); de e it, de LibreOffice/dictionaries en un commit fijado (GPL; Mozilla no los tiene). `fetch` los
    comprueba archivo a archivo (sha256) en `cache/diccionarios`, `overlay` los copia junto a
    `browser/components/aegis/diccionarios/moz.build`, que los instala en `dist/bin/dictionaries` (built_in_addons.json
    los registra; van en el omni.ja de Gecko), y `package`, `mar` y `msix` comprueban que están. Hace falta porque
    `package-multi-locale` no pone los diccionarios de las traducciones. «Elegir más diccionarios» (addons.mozilla.org)
    sigue para otros idiomas.
  - **Cambios de Aegis a las traducciones** (`tools/l10n-cambios.json`, MPL-2.0, apuntado en `NOTICE.md`): una lista
    cerrada que `fetch` aplica al extraer, como las sustituciones de LibreWolf. «sustituciones»: textos visibles que
    nombran a «Firefox» con todas las letras donde en-US usa la marca (pt-BR: aviso de actualización del menú y
    `about:profiles`; de: la «Firefox-Startseite» y otros 15); el nombre pasa a `{ -brand-short-name }`.
    «correcciones»: textos de es-ES que Aegis cambia por otros más claros o de tú, sin marca de por medio (menú de los
    accesos de la nueva pestaña: «Desfijar» en vez de «Soltar», «Quitar» en vez de «Ignorar»; el aviso de la barra de
    marcadores vacía, que trataba de usted); se aplican y comprueban como las sustituciones. **Aegis en español va de
    tú** (decisión del usuario, 2026-10-20): los textos de usted que se ven en un uso normal (Ajustes, panel del sitio,
    barra de direcciones, permisos, diálogos, ventana privada, perfiles, contraseñas, errores) son correcciones, y se
    dice «contraseña principal», nunca «maestra». Una corrección puede ir también en un `.properties` de
    `browser/chrome/`, `security/manager/chrome/` o `toolkit/chrome/` (avisos de permisos de `browser.properties`,
    contraseña principal de NSS en `pipnss.properties`, autenticación HTTP y contraseñas: aún no están en Fluent;
    `PROPERTIES_L10N` en `aegis.py`). Una entrada por mensaje (dos del mismo mensaje no se encadenan), el «antes» nunca
    dentro del «después», y «Firefox» o «Mozilla» solo en el «antes» de una sustitución: `aegis.py` y `verificar.py`
    lo rechazan, y `verificar.py` comprueba que cada mensaje sigue en el en-US del árbol. «anadidos»: los
    textos del menú principal, de los contenedores y de lo demás que se ve y falta en es-ES (p. ej. «Help and Report»,
    «Add New Container», la ventana privada, `about:keyboard`), siempre en .ftl. `fetch` falla si un texto ya no está tal
    cual, si un añadido ya existe o si Firefox ya no tiene el mensaje: entonces se revisa la entrada. `package` y
    `verificar.py` comprueban que están en el paquete. Fuera de la lista, a propósito: lo que atribuye el origen o es
    legal (créditos de it, «respaldado por Mozilla» en `certError.ftl`, «Absturzbericht an Mozilla»: informes de fallos
    que Aegis no compila) y lo que Aegis no enseña (marcadores de serie de fr, `about:welcome`, el error de SSLv3). Los
    «Firefox» que ya trae en-US (errores de red antiguos de `appstrings.properties`, nombres de otros productos en
    `brandings.ftl`) siguen igual en todos los idiomas.
  - **es-ES incompleto:** al commit fijado le faltan 1089 textos de 158.0 (compare-locales; a fr, de, it y pt-BR,
    ninguno) y al último de firefox-l10n (2026-10-19), 1083: ningún commit lo completa, así que no se fija otro para
    es-ES (serían 88 MB más por 6 textos). Lo que falta sale en inglés salvo los añadidos de `l10n-cambios.json`. Medir
    con compare-locales de `third_party/python` sobre `~/.mozbuild/l10n-central` (`docs/PLANNING.md`).
  - Al cambiar de versión de Firefox: el commit nuevo de `l10n-changesets.json` en `upstream.json` › `l10n` (y la URL),
    `sha256` vacío, `fetch` (lo calcula y lo dice), fijarlo y `fetch` otra vez.
- **Editar un parche:** se cambia en el árbol, se hace commit con el remolque `Aegis-Parche: NNNN-grupo/nombre.patch`
  y `aegis.py export` regenera `patches/` (sin hash ni fecha, para diffs estables). `export` se niega si se perdería
  algo (parches de `series` sin aplicar en el árbol, rutas repetidas o raras).
- **Comprobar la serie:** `aegis.py patch --check` la aplica entera, en orden y acumulando, sobre un índice temporal
  con la fuente intacta (no toca el árbol). Si cambia el orden o un parche ya aplicado: `prepare --limpio`.
- **La base del árbol es la fuente exacta:** `git add --force` (también lo que ignora el `.gitignore` de Firefox) y
  `* -text` en `.git/info/attributes` (sin normalizar finales de línea).
- **Propiedades de los `.exe`** (parche `0200-branding/0002`): en `config/rules.mk` el `.rc` de cada ejecutable no
  depende de su `module.ver`, así que `aegis.py build` borra el `.rc` y el `.res` de `firefox.exe`,
  `private_browsing.exe` y `plugin-container.exe` si su `module.ver` es más reciente (`RECURSOS_DE_VERSION`).
- **Recursos:** unos 45–60 GB de disco por objetivo. Con los 16 GB que WSL usa de serie, la build se quedaba sin
  memoria: con `memory=24GB` y `swap=16GB` en `%USERPROFILE%\.wslconfig` basta.
- **Objetivos:** `windows-x86_64-cross` (el de serie) y `linux-x86_64`, cada uno con su mozconfig en el árbol
  (`mozconfig-<objetivo>`) y su objdir (`obj/firefox-<v>-windows-x86_64-cross` y `obj/firefox-<v>`). `build`,
  `package`, `mar`… aceptan `--objetivo`; `AEGIS_OBJETIVO` cambia el de serie.
- **Windows se compila en cruzado desde WSL** con clang-cl. No hace falta Visual Studio en Windows: con
  `--enable-bootstrap` y sin `WINSYSROOT`, configure descarga de Microsoft el kit de MSVC y el SDK de Windows (`vs`) y
  wine para las herramientas que lo necesitan. Para probar la build: `aegis.py instalar-prueba --destino /mnt/c/…`
  la deja en una carpeta de Windows (no se puede ejecutar con `run`). MozillaBuild, solo para depurar.

**Trampas desde Windows:**
- Desde Git Bash, `wsl.exe … /mnt/c/…` necesita `MSYS_NO_PATHCONV=1`; si no, la ruta se convierte en
  `C:/Program Files/Git/mnt/c/…`.
- Las órdenes con comillas anidadas (`wsl -- sh -c '…'`) se rompen: mejor un script.
- Un `wsl.exe` lanzado desde una herramienta puede terminar (255) con su proceso vivo dentro: para builds largos,
  segundo plano y seguir el registro.

## Actualizaciones (sin servidores)

Todo en `docs/ACTUALIZACIONES.md`. Lo esencial:
- El navegador pide `update-<objetivo>-release.xml` a `github.com/<repo>/releases/latest/download/` (parche
  `0100-build/0001` y `MOZ_APPUPDATE_HOST` en el mozconfig). La URL no lleva datos del equipo.
- MAR firmados con la clave de Aegis (canal MAR `aegis-release`). `aegis.py claves-mar` las crea una vez en
  `~/.config/aegis-firma/` de WSL; **copia de seguridad fuera del equipo obligatoria**.
- `REEMPLAZOS` en `aegis.py`: los certificados del updater (`release_primary.der`, `release_secondary.der`) son lo
  **único** de Firefox que se sustituye sin parche. Cualquier otro archivo de `overlay/` que pise uno de Firefox hace
  fallar `prepare`.
- Publicar: `build` → `package` (multi-idioma) → `mar` → `publicar` (borrador, subir, comprobar y luego «latest»). Versión
  `v<firefox>-<revisión>` desde `upstream.json`.

## Versión de Firefox

- `upstream.json` fija la versión. Para cambiarla: versión, URL, `sha256` y tamaño de `SHA256SUMS` de esa versión
  (la huella de la clave no cambia salvo que Mozilla rote la principal) y `aegis.revision` a 1.
- Calendario de Mozilla: `https://product-details.mozilla.org/1.0/firefox_versions.json` (`NEXT_RELEASE_DATE`).
- Al cambiar de versión: `prepare --limpio`, arreglar los parches que no se apliquen, `export`, el commit de las
  traducciones (`upstream.json` › `l10n`, «Construir» › «Idiomas»), compilar, probar y pasar las revisiones. Además, `git grep "campaignId("` fuera de las pruebas: `AttributionCode.msixCampaignId()`
  (parche `0400-privacidad/0005`) tiene que seguir siendo la única llamada; otra devolvería la consulta a la Tienda
  en cada arranque del paquete MSIX.
- **Motor de Escudos (plan B).** De serie usa `etp_engine`, el fork de adblock-rust que Firefox trae desde la 158
  (`toolkit/components/content-classifier/etp_engine`; no duplica código en `xul.dll`). Si Mozilla cambia su API, lo
  recorta o lo borra, `verificar.py` falla con «cambia a motor propio» (compara su versión, las 32 firmas que usa
  `motor-nativo/src/lib.rs` contra la copia propia y el sha256 del directorio, apuntado en
  `motor-nativo/adblock-origen.json`). Cambiar de motor es una línea: `upstream.json` › `escudos` › `"motor":
  "propio"` (o `"etp_engine"`) y `aegis.py prepare` (vuelve con `git reset --keep` a antes del parche que cambia y
  aplica la variante, sin rehacer el árbol; `prepare --limpio` también vale). Con «propio»:
  - el código es `motor-nativo/adblock/`, adblock-rust 0.12.1 **tal cual** del `third_party/rust` de Firefox 157.0.1
    (fuente verificada); `verificar.py` comprueba cada archivo contra su `.cargo-checksum.json` (los sha256 de
    crates.io). Un cambio imprescindible, en `adblock-origen.json` › `cambios` con su sha256 y su motivo;
  - el `Cargo.toml` del motor sale de `motor-nativo/Cargo.toml.propio`, y el parche 0600, de
    `patches/0600-escudos/alternativos/propio/0001-motor-en-gkrust.patch` (mismo remolque que el de la serie; además
    saca la copia del workspace de Cargo con una línea en `exclude`, para que no pida sus dependencias opcionales ni
    las de pruebas);
  - `patch --check` comprueba la serie con los dos motores, y `verificar.py`, que cada dependencia de la copia sigue en
    `third_party/rust` (o en los `[patch]` de Firefox) con una versión válida y que la entrada de `Cargo.lock` del
    alternativo casa con la del árbol. Si una versión de Firefox rompe el alternativo: se edita en el árbol con el
    motor «propio» puesto y `export` lo regenera en `alternativos/` (con el otro motor puesto, `export` se niega).
  - El `.dat` de los perfiles sigue valiendo: los dos motores compilan el mismo `.dat` byte a byte y cada uno carga el
    del otro con las mismas decisiones (probado el 2026-10-16, `out/pruebas/2026-10-16-motor-propio/`). La clave del
    motor lleva `platformBuildID` y `appBuildID` (`escudos/motor.sys.mjs`): el primero no cambia en una build
    incremental, el segundo sí, así que cada build nueva recompila el `.dat` una vez (unos segundos).

## Reglas al cambiar cosas

- Cada parche lleva cabecera con **Asunto**, **Por qué**, **Bug upstream** (si existe) y **Origen** (Zen, Tor
  Browser, LibreWolf, Waterfox…), y el remolque `Aegis-Parche:`.
- Código portado de Zen o de Tor Browser: se conservan sus cabeceras MPL y se apunta en `NOTICE.md`.
- Ni «Firefox» ni «Mozilla» en nuestros textos ni iconos (marca registrada). El User-Agent es el de Firefox y nunca
  lleva «Aegis» (huella digital).
  Única excepción (decidida por el usuario el 2026-10-17): nombrar a Firefox como navegador de origen en «Importar
  datos», solo en los ids `aegis-migracion-navegador-firefox*` de `aegis.ftl`; «Mozilla», nunca. `verificar.py` lo
  comprueba. Segunda excepción (decidida por el usuario el 2026-10-17): en la web legal (`web/legal/`,
  `web/privacidad/` y sus versiones en inglés), «Firefox» y «Mozilla» solo para atribuir el origen del código, negar
  la afiliación y decir quién recibe cada conexión; nunca como marca.
- **Identidad en el sistema** (`docs/PLAN.md`): fabricante y carpeta de perfiles `Aegis` (parche
  `0200-branding/0001`; solo con `imply_option`), remoting `aegis` (`mozconfigs/common`). Perfiles en
  `%APPDATA%\Aegis` y `%LOCALAPPDATA%\Aegis`, registro del navegador en `HKCU\Software\Aegis`. **No se tocan**
  `MOZ_APP_BASENAME` («Firefox»: de él sale el User-Agent), `MOZ_APP_NAME` (`firefox.exe`) ni el ID de la app (AMO).
  `verificar.py` lo comprueba.
- Las prefs van en `settings/prefs/*.js`, una por área, con un comentario de por qué. `policies.json` se queda
  mínimo: cualquier política hace que los ajustes digan «tu organización administra el navegador».
- Fuentes (Inter, JetBrains Mono) solo para la interfaz, cargadas desde `chrome://`: una fuente instalada en el
  sistema la verían las webs.
- Textos nuevos: en Fluent, en `overlay/browser/components/aegis/locales/<idioma>/aegis.ftl` (en-US es el origen técnico;
  glosario en `locales/GLOSARIO.md`), traducidos a los seis idiomas.
- Codificación: LF y UTF-8 sin BOM; `.ps1` con BOM y CRLF; `.cmd` CRLF (`.gitattributes`).
