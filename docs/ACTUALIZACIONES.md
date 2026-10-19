# Actualizaciones de Aegis

Aegis se actualiza solo con el sistema nativo de Firefox (servicio de actualizaciones, `updater` y paquetes MAR),
pero **sin servidores**: todo son archivos estáticos en GitHub Releases, firmados con una clave que solo tiene quien
publica. **Probado de extremo a extremo en Windows el 2026-10-16** (Firefox 158.0; ver «Prueba de extremo a extremo»).

## Cómo funciona en el navegador

1. **Nada antes de aceptar.** Con un perfil nuevo no se comprueba nada hasta que el usuario acepta el grupo
   «Actualizaciones de Aegis» en `about:conexiones` (`app.update.aegis.automaticas`, parche
   `0400-privacidad/0003`, por el camino de `manualUpdateOnly`). Al aceptarlo, una comprobación en ese momento
   (`conexiones.sys.mjs`); después, una vez al día con el navegador abierto (`app.update.interval`, 24 h) y cada vez
   que se abre Acerca de o Ajustes, como en Firefox. Antes de aceptar, abrirlos no comprueba nada: muestran el botón
   «Buscar actualizaciones», que funciona siempre porque lo pide el usuario. Al revocar, se para una descarga en
   curso y no se reanuda ninguna. La lista de conexiones y sus
   interruptores está en `docs/CONEXIONES.md`.
2. El navegador pide:
   ```
   https://github.com/<usuario>/<repo>/releases/latest/download/update-<objetivo>-<canal>.xml
   ```
   - `<usuario>/<repo>` sale de `branding/marca.json` (`publicacion.github`) y se compila dentro: mozconfig
     `MOZ_APPUPDATE_HOST` y el parche `0100-build/0001-actualizaciones-estaticas.patch`. En Windows la URL va
     compilada en el ejecutable: el `application.ini` de la carpeta no se usa.
   - `<objetivo>` es `WINNT_x86_64-msvc-x64` (en Windows lleva además la arquitectura real de la CPU: `-aarch64` en un
     Windows ARM64 que ejecuta la build x64), `Linux_x86_64-gcc3`…; `<canal>`, `release`.
   - **La URL no lleva** versión, idioma, sistema operativo ni ningún identificador. La de Mozilla (aus5) enviaba
     todo eso.
   - **Sin cookies** (`mozAnon`) **y con un `Accept-Language` fijo** (`en-US,en;q=0.5`, el mismo en todos los Aegis)
     en todos los saltos: `latest/download` redirige a la release y de ahí al CDN de archivos de GitHub (parche
     `0400-privacidad/0001`; la cabecera va en la XHR, que la vuelve a aplicar en cada redirección). Comprobado en la
     prueba: los tres saltos llegan sin `Cookie` y con ese idioma.
3. `update.xml` dice qué versión hay, su `buildID`, y dónde está el MAR (en la release de esa versión) con su tamaño.
   Se ofrece si su `appVersion` es mayor que la instalada o, con la misma versión de Firefox, si su `buildID` es
   distinto (una revisión de Aegis sobre la misma base: `158.0-1`, `158.0-2`…).
4. **Descarga del MAR** con la red del navegador (`nsIIncrementalDownload`):
   - **sin cookies** (`LOAD_ANONYMOUS`, parche `0400-privacidad/0001`);
   - **sin los extras del servidor de Mozilla** (`?backgroundTaskMode=0` y `X-BackgroundTaskMode`, que Firefox
     añade cuando `MOZ_APP_NAME` es «firefox»: parche `0400-privacidad/0004`);
   - **no por BITS** (el servicio de transferencias de Windows que Firefox usa de serie): con BITS la descarga la
     haría Windows, seguiría con Aegis cerrado y no pasaría por la red de Aegis (`app.update.BITS.enabled` en false,
     `settings/prefs/60-actualizaciones.js`);
   - **con el `Accept-Language` del navegador.** Quitarlo no basta con pasar la cabecera al descargador: Firefox
     (`nsIncrementalDownload::AsyncOnChannelRedirect`) pone las cabeceras extra en el canal viejo en cada
     redirección, así que el CDN recibiría igualmente la de serie. Haría falta una línea de C++ (pendiente).
   - Firefox **no comprueba el SHA-512** de `update.xml`: solo el tamaño (`Downloader._verifyDownload`). Lo que
     garantiza que el MAR es el bueno es su **firma**, que comprueba el `updater` (paso 5).
5. **Preparación (staging), con Aegis abierto.** El navegador lanza `updater.exe` **desde la carpeta de
   instalación**, sin elevar y sin servicio de mantenimiento, que:
   - comprueba la **firma** del MAR con los certificados compilados dentro (`updates/claves/primaria.der` y
     `secundaria.der`, que sustituyen a los de Mozilla). Otra clave o un byte cambiado: error 19
     (`CERT_VERIFY_ERROR`);
   - comprueba el **canal MAR** contra `update-settings.ini` (`ACCEPTED_MAR_CHANNEL_IDS=aegis-release`; error 22) y
     que la versión no baje (error 23);
   - copia la instalación entera en `<carpeta>\updated` y aplica allí el MAR. Lo que no viene en el paquete
     (`distribution/aegis-instalador.json`, `desinstalar.exe` del instalador propio) se conserva.
   Si algo falla, el navegador lo apunta en el historial («failed: <código>»), borra la descarga y sigue como estaba.
6. **Al volver a abrir Aegis** (o al pulsar «Reiniciar para actualizar»): el navegador ve la actualización preparada,
   lanza `updater.exe` en modo «replace» y se cierra; el updater cambia las carpetas (`Aegis` → `Aegis.bak`,
   `updated` → `Aegis`, borra `Aegis.bak`) y abre el `firefox.exe` nuevo con los mismos argumentos (unos segundos más
   que un arranque normal).
   - Queda `<carpeta>\tobedeleted\` con el `updater.exe` viejo (1,1 MB): estaba en ejecución y no se puede borrar, y
     programar su borrado al reiniciar exige ser administrador. La siguiente actualización se lo lleva (solo queda
     uno).
   - **Sin el asistente de NSIS** (`uninstall\helper.exe /PostUpdate /DesktopLauncher`), que Firefox lanza tras cada
     actualización: escribiría en `HKCU` su propia entrada de «Aplicaciones instaladas», volvería a registrar el
     navegador con sus claves, tocaría accesos directos y podría añadir el lanzador del escritorio, por encima de lo
     que hace el instalador propio (parche `0100-build/0002`). En la prueba, el registro de Windows, el escritorio y
     el menú Inicio quedaron igual.
   - La carpeta de trabajo del servicio es `C:\ProgramData\Mozilla-1de4eec8-1241-4177-a864-e594e8d1fb38\updates\<hash
     de la carpeta de instalación>` (la de Firefox; cada instalación tiene la suya): `update.mar`, `update.status`,
     `last-update.log` y el historial. El nombre no se ve en ningún sitio. No cambia con el fabricante propio
     (`docs/PLAN.md`, «Identidad en el sistema»): Firefox lo tiene fijo en `commonupdatedir.cpp` (también lo usan el
     updater y el servicio de mantenimiento), y la parte que distingue cada instalación ya es el hash de su carpeta,
     así que no se mezcla con la de un Firefox instalado.

### Dónde no se actualiza solo
- **Paquetes de distribuciones de Linux, Flatpak y AUR** (cuando existan): los actualiza su gestor y llevarán la
  política `DisableAppUpdate`.
- **Instalación en una carpeta sin permiso de escritura** (por ejemplo `Program Files`): sin servicio de
  mantenimiento (no hay firma Authenticode), el updater pediría permisos de administrador (UAC) en cada
  actualización. Por eso el instalador propio (`packaging/instalador`, `docs/INSTALADOR.md`) instala por usuario en
  `%LOCALAPPDATA%\Programs\Aegis`, donde el updater escribe sin preguntar.
- **Microsoft Store** (retomada el 2026-10-17, `docs/TIENDA.md`): dentro del paquete MSIX el updater de Aegis se
  apaga solo (Firefox lo hace al tener identidad de paquete: `isPackagedApp`) y la Tienda trae las versiones nuevas.
  Comprobado en el código de Firefox 158 el 2026-10-17; en el Espacio aislado el paquete se instaló y desinstaló, pero
  Aegis no llegó a arrancar (el Control inteligente bloquea la firma de prueba): falta comprobarlo con el paquete de la
  Tienda (`out/pruebas/2026-10-17-msix/`).

## Claves

- `aegis.py claves-mar` crea, **una sola vez**, dos claves RSA de 4096 bits en `~/.config/aegis-firma/` de WSL
  (permisos 600, nunca en el repo) y deja sus certificados públicos en `updates/claves/`.
  - **primaria:** firma todas las versiones.
  - **secundaria:** de reserva. Si la primaria se pierde o se compromete, se firma con la secundaria y se publica
    una versión con un par nuevo.
- `prepare` y `overlay` copian los certificados sobre `release_primary.der` y `release_secondary.der` del updater.
  Es el **único** archivo de Firefox que Aegis sustituye sin parche (`REEMPLAZOS` en `aegis.py`).
- **Copia de seguridad obligatoria** de `~/.config/aegis-firma/` fuera del equipo (USB cifrado). Sin la primaria ni
  la secundaria, los Aegis instalados no aceptarán ninguna actualización más y habría que reinstalar.
- `claves-mar` nunca sustituye un certificado del repo por el de otra clave: se niega.

## Publicar una versión

En WSL (o con `tools/build-wsl.sh <orden>` desde Windows):

```bash
python3 tools/aegis.py build
python3 tools/aegis.py package
python3 tools/aegis.py mar          # MAR completo firmado y verificado + update-<objetivo>-release.xml en ~/aegis/salida
python3 tools/aegis.py publicar     # release v<versión> en GitHub: borrador → subir → comprobar → «latest»
```

- **Versión:** `upstream.json` → `firefox.version` y `aegis.revision`. Se publica como `v158.0-1`. Al cambiar de
  versión de Firefox, la revisión vuelve a 1; para otra build sobre la misma versión, se sube la revisión.
- **Un buildID por build.** `build` fija `MOZ_BUILD_DATE` para toda la compilación. Sin eso, en una build
  incremental mach generaba el buildID dos veces: `firefox.exe` se quedaba con el primero y `application.ini` (el
  que `mar` pone en `update.xml`) con el segundo, y un Aegis ya actualizado volvía a ver una build «distinta» y la
  descargaba e instalaba otra vez cada día (visto el 2026-10-16). `mar` se niega si el ejecutable del paquete no
  lleva el buildID de `application.ini`.
- **Varias plataformas en la misma versión:** se ejecuta `mar` en cada objetivo (Linux y Windows) y `publicar` sube
  lo que haya en `salida/` de esa versión. Cada plataforma tiene su propio `update-<objetivo>-release.xml`.
- `publicar` necesita `gh` con sesión iniciada (`gh auth login`, una vez) y el repositorio público de
  `branding/marca.json`. Publica en borrador, comprueba los tamaños subidos y solo entonces la marca como «latest»:
  `latest/download` nunca apunta a una versión a medias. Con `--borrador` se queda en borrador para revisarla.
- Herramienta de MAR: `make_full_update.sh` de Firefox con **mardor** (`mar==3.2.1`, la biblioteca de Mozilla), que
  firma con SHA-384 al recibir una clave de 4096 bits. Se instala en `~/aegis/venv-mar` **solo con las versiones y
  hashes de `tools/requisitos-mar.txt`** (`--require-hashes --only-binary :all:`), porque ese código carga la clave
  privada. `mar` verifica después la firma con el certificado público, el canal MAR, la versión y el tipo sha384, y
  comprueba que la URL compilada apunta a las actualizaciones de Aegis.
- `mar --objetivo windows-x86_64-cross` para el objdir de Windows. Cada `mar` apunta sus archivos en
  `salida/manifiesto-<versión>.json`, y `publicar` sube solo eso.
- **Mientras dure la fase 0** (aviso en `docs/CONEXIONES.md`), `publicar` solo publica en borrador.

## Prueba de extremo a extremo (Windows, 2026-10-16)

Banco y resultados en `out/pruebas/2026-10-16-actualizaciones/` (`banco/prueba.py`, `banco/servidor.py`,
`banco/preparar_servidos.py`; `resumen.json` con cada escenario). Se repite tras cada cambio de base de Firefox
(`updater.cpp` cambia a menudo: en la 158, el tipo de elevación).

**Cómo, y por qué así.** Lo más fiel sin publicar nada: la build N tal cual (compilada, empaquetada e instalada como
lo hace el instalador propio, con el contenido de `firefox/` en una carpeta `Aegis`), y N+1 con `aegis.py mar`
(revisión 2 solo durante la prueba). Solo cambian dos cosas, y las dos se quedan dentro de la prueba:
- la política `AppUpdateURL` (`distribution/policies.json` de la copia de prueba) cambia el **host** de la URL de
  `update.xml` por un servidor HTTPS local que imita GitHub Releases: dos orígenes (`127.0.0.1` hace de github.com y
  `localhost` de CDN) y las dos redirecciones reales. La plantilla `update-%BUILD_TARGET%-%CHANNEL%.xml` es la misma.
  No hay otra forma: la URL va compilada en el ejecutable. En `update.xml` solo se cambia el host de la URL del MAR;
- la CA de ese servidor se añade **solo a la base de certificados del perfil de prueba** (por Marionette), no a
  Windows. Ni `hosts`, ni la red del equipo, ni el almacén de certificados de Windows.
Después, como una persona: `about:conexiones` con solo «Actualizaciones» encendido y «Aceptar»; esperar a que quede
preparada; cerrar y volver a abrir. Marionette solo lee el estado y hace las capturas.

**Resultados** (N `20261016210203` → N+1 `20261016210615`, y una primera ronda igual sin el parche `0400/0004`):
- **Funciona:** comprobación, descarga (107 MB, menos de 1 s en local), preparación (unos 10 s), aplicación al
  reabrir y arranque de N+1 con su buildID, en `C:\Users\<tú>\…` y en `%LOCALAPPDATA%\Programs\…` (5 ejecuciones). Una segunda
  comprobación ya en N+1 no ofrece nada. El registro de Windows, el escritorio y el menú Inicio, igual.
- **Rechaza sin romper nada:** MAR firmado con una clave desechable (canal bueno y canal de Firefox) y MAR auténtico
  con un byte cambiado: error 19 al preparar, la instalación sigue siendo N y arranca.
- **No probado:** el rechazo por canal con una firma válida (error 22): exige firmar un MAR de otro canal con la
  clave de Aegis, y las claves reales no se usan fuera de `aegis.py mar`. El canal lo comprueba el mismo código del
  updater, justo después de la firma.
- Un `update.xml` con un SHA-512 falso **no** se rechaza (Firefox no lo mira; ver arriba): no es un fallo, la firma
  manda.

### Control inteligente de aplicaciones (Smart App Control)

Activado en el equipo de pruebas (`VerifiedAndReputablePolicyState` = 1, directiva `VerifiedAndReputableDesktop`).
Medido en cada paso con el registro `Microsoft-Windows-CodeIntegrity/Operational`:
- **0 eventos** en todo el flujo (instalar y abrir N, `updater.exe` preparando, `updater.exe` sustituyendo y el
  `firefox.exe` nuevo de N+1), en 14 ejecuciones y en las dos ubicaciones.
- Los únicos bloqueos de Aegis registrados en este equipo son de ejecutables dentro de `%TEMP%` (evento 3077 con su
  3033 y su 3089: «did not meet the Enterprise signing level requirements», `Status 0xc0e90002`, firmado 1 frente a
  2 pedido).
- Ni `update.mar` ni los binarios que escribe el updater llevan la marca de «descargado de Internet»
  (`Zone.Identifier`).
- Microsoft no documenta qué decide el bloqueo de un ejecutable sin firma (reputación en la nube, origen, ubicación):
  en otro equipo puede ser distinto. Opciones sin firma, de más a menos útil:
  1. **Nada del flujo en `%TEMP%`** (ya es así: el MAR va a `ProgramData`, la preparación a `<carpeta>\updated` y el
     updater se ejecuta desde la carpeta de instalación). Ojo: el desinstalador del instalador propio se copia a
     `%TEMP%` para ejecutarse (`docs/INSTALADOR.md`): en este equipo eso es justo lo que se bloquea. Conviene otra
     carpeta (por ejemplo una junto a la instalación o en `%LOCALAPPDATA%\Aegis`).
  2. **Instalación por usuario fuera de `%TEMP%`** (`%LOCALAPPDATA%\Programs\Aegis`), como ahora.
  3. **Si un equipo empezara a bloquear el `firefox.exe` nuevo**, el updater ya habría cambiado la carpeta: Aegis no
     abriría y no hay vuelta atrás automática. Mitigación posible: que el instalador propio, al abrirse, detecte el
     error 4551 y lo explique (reinstalar no lo arregla). Sin firma no hay forma legítima de evitarlo; no se debe
     pedir al usuario que desactive el Control inteligente (no se puede volver a activar sin reinstalar Windows).
  4. MAR que no cambien ejecutables (solo `omni.ja`) para revisiones de Aegis sobre la misma versión de Firefox:
     menos binarios nuevos, pero no evita nada en cada versión de Firefox (cambian `xul.dll` y `firefox.exe`).

## Riesgos conocidos

- El usuario `aegis` de WSL que firma es el mismo que compila (mach, bootstrap, node): un compromiso del build podría
  leer `~/.config/aegis-firma`. Mejora prevista: firmar con otro usuario o guardar la clave cifrada fuera de WSL salvo
  al firmar.
- La URL no lleva `%LOCALE%`: todos los idiomas reciben el mismo MAR. Desde el 2026-10-20 la build es multi-idioma
  (`aegis.py package` con los seis idiomas; `docs/GUIA.md`, «Construir» › «Idiomas»), así que el MAR también lo es: `mar`
  comprueba antes que el paquete trae los seis y la marca de Aegis en todos. Un MAR hecho de un paquete solo en en-US
  dejaría en inglés a quien lo use en otro idioma.
- Las builds incrementales no vuelven a enlazar `xul.dll` si no cambia: su buildID de plataforma
  (`-parentBuildID` de los procesos hijos) se queda en el de la última vez que se enlazó. N y N+1 llevan entonces el
  mismo `xul.dll`, lo que es correcto; solo cuenta que `firefox.exe` y `application.ini` coincidan (lo comprueba
  `mar`).
- Comprobado en local, no contra GitHub de verdad: los nombres del CDN de GitHub y que acepte `latest/download` con
  el XML se verán con la primera publicación (en borrador).

## Pendiente

- La línea de C++ para que la descarga del MAR lleve también el `Accept-Language` fijo tras las redirecciones.
- MAR parciales (solo diferencias) para ahorrar descarga.
- Pasar el banco de prueba a `tools/pruebas/` para repetirlo en cada cambio de base.
