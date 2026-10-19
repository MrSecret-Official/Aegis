# Instalador de Aegis para Windows («Aegis Setup»)

Un instalador propio, a la altura del resto de Aegis: monocromo, calmado y preciso (`docs/DISENO.md`). Sustituye
al instalador NSIS de Firefox, que no se puede dejar con este aspecto. El código está en `packaging/instalador/`.

## Experiencia

Es el asistente de bienvenida de SecretOS (`SecretOS-Private/system/share/bienvenida/Bienvenida.qml`) con el
contenido de Aegis, copiado medida a medida:

- Ventana sin marco del sistema de **960 × 620** lógicos (escala con la pantalla), fondo `--aegis-bg`. En Windows 11,
  esquinas redondeadas, sombra y un borde fino del propio sistema (DWM). Se arrastra desde cualquier zona vacía.
- Arriba a la izquierda, el icono y «Aegis» (16 px, 600); a la derecha, una × discreta de 28 px (apagada mientras
  instala).
- Contenido centrado de 600 de ancho: icono en un círculo de 56, título de 24 px (600, −0,4), subtítulo gris de 14 y
  debajo las opciones: tarjetas con miniatura (la elegida con borde de 1 px del color del texto, relleno `--aegis-sel` y nombre en 600, radio 12),
  tarjetas sin miniatura (más bajas, en rejilla, con el nombre y la descripción dentro; la elegida, igual) o grupos de
  filas. Una tarjeta puede llevar una insignia («RECOMENDADO»: etiqueta de sección de 11 px 600 en gris, en una pestaña
  de radio 5 sobre su borde de arriba). Los controles segmentados (fondo de control con radio 12, opciones de radio 8 y
  la activa en gris más claro con borde) siguen en `componentes.slint`, aunque ahora ningún paso los usa.
- Pie fijo de 76 separado por una línea: los pasos en rayitas (12 px; la actual, 26; las hechas, del color del
  texto), «Paso N de 8» y, a la derecha, el botón secundario y el principal.
- Al cambiar de paso, el nuevo entra deslizándose 30 px y apareciendo (300 ms, OutCubic). Nada se mueve en reposo.
- Claro u oscuro según Windows.
- Todo con teclado: Tab y Mayús+Tab recorren la ×, las filas del resumen, las tarjetas, el campo de la carpeta, los
  interruptores, la casilla y los botones del pie (solo los del paso visible; al cambiar de paso, el foco vuelve a la
  ventana). Espacio o Intro activan el control con el foco; en las tarjetas (y en los segmentos), las flechas izquierda
  y derecha eligen la de al lado, y en la rejilla del buscador también arriba y abajo; el foco la acompaña. Sin nada con foco, Intro hace la acción
  principal y Esc vuelve un paso. El foco se ve con un anillo de 2 px por fuera en `--aegis-focus` (DISENO §5); el
  ratón no mueve el foco. Las capturas `2x-teclado-*` de `--captura` lo enseñan.
- Con los efectos de animación de Windows apagados (Accesibilidad › Efectos visuales), los cambios son instantáneos
  (DISENO §7).
- Lo único que no se puede seguir de DISENO: las cifras tabulares del porcentaje (Slint no tiene características
  OpenType); va alineado a la derecha para que apenas se mueva.

### Pasos

| | Paso | Qué hay |
|---|---|---|
| 1 | **Bienvenida** | El icono, «Aegis» (30 px) y «Un navegador privado, limpio y rápido». Debajo, «LO QUE SE INSTALA»: modo, Escudos, buscador, apariencia y carpeta con sus valores (cada fila lleva a su paso). Botón principal «Instalar» (instala con eso) y secundario «Personalizar» |
| 2 | **¿Cómo quieres navegar?** | Dos tarjetas con miniatura: Estándar (pestañas arriba, barra de marcadores discreta) y Workflow (pestañas verticales, esenciales y espacios) |
| 3 | **¿Cuánto quieres bloquear?** | Los Escudos: tres tarjetas con miniatura (una página con sus peticiones, tachadas las bloqueadas, y el contador del botón de los Escudos, que sube con el nivel): Normal, Estricto y Estricto+, el elegido de serie, con la insignia «RECOMENDADO». Debajo de cada una, qué hace (los niveles y textos de Ajustes › Escudos) |
| 4 | **¿Dónde quieres buscar?** | El buscador: cuatro tarjetas sin miniatura en rejilla de 2 × 2, solo texto (sin logotipos): DuckDuckGo, Startpage, Brave Search o Google, cada una con una frase honesta («Google guarda lo que buscas») |
| 5 | **Elige el aspecto** | Tres tarjetas: Oscuro, Claro y Automático (sigue a Windows) |
| 6 | **Últimos detalles** | Carpeta (`%LOCALAPPDATA%\Programs\Aegis` de serie), acceso en el escritorio (apagado) y en el menú Inicio (encendido), y el espacio que necesita. Botón «Instalar» |
| 7 | **Instalando** | Barra fina (alto 4, radio 2) con el progreso real y debajo la fase («Copiando archivos», «Creando accesos») y el porcentaje. Sin rutas ni términos técnicos |
| 8 | **Aegis está listo** | «Abrir Aegis» y la casilla «Hacer que Aegis sea el navegador predeterminado», que abre la página de aplicaciones predeterminadas de Windows (Windows 11 no deja hacerlo de otra forma, y está bien así) |

Importar de otro navegador no está aquí: se ofrece en la bienvenida del propio Aegis.

Errores en dos partes, en el paso 7, con «Atrás» y «Reintentar»: qué ha pasado y qué hacer.

| Código | Texto |
|---|---|
| 1 | No hay espacio suficiente en el disco. Libera N MB y vuelve a intentarlo. |
| 2 | Aegis está abierto y no se puede sustituir. Ciérralo y vuelve a intentarlo. |
| 3 | El instalador está dañado. Vuelve a descargarlo de la página oficial. |
| 4 | No se han podido copiar los archivos en esa carpeta. Elige otra y vuelve a intentarlo. |
| 5 | Esa carpeta ya tiene otros archivos. Elige una vacía y vuelve a intentarlo. |

### Textos

En la interfaz con `@tr()` de Slint. El texto de origen es el inglés (como en `locales/GLOSARIO.md`) y las
traducciones (es, pt-BR, fr, de, it) están en `packaging/instalador/traducciones/<idioma>/LC_MESSAGES/aegis-setup.po`,
dentro del ejecutable. El idioma es el de Windows (`--idioma <código>` lo fuerza). Pasan por el `traductor`.
Pendientes del glosario: «Escudos» (en «Shields», fr «Boucliers», de «Schilde», it «Scudi») y «espacios».

## Qué hace (y qué no)

- **Por usuario, sin UAC:** copia a `%LOCALAPPDATA%\Programs\Aegis`. Así el updater de Aegis puede escribir sin pedir
  permisos de administrador (no hay servicio de mantenimiento). El manifiesto lleva `asInvoker`: sin él, Windows ve
  «setup» en el nombre y pide elevación.
- **Atómico:** comprueba la suma SHA-256 de toda la carga, descomprime en `Aegis.parcial`, escribe ahí las elecciones
  y el desinstalador, y renombra: `Aegis` → `Aegis.anterior`, `Aegis.parcial` → `Aegis`, y borra la anterior. Si se
  corta, no queda una instalación a medias; si el segundo renombrado falla, se devuelve la anterior a su sitio. Si
  Aegis está abierto, Windows no deja renombrar la carpeta y se avisa (error 2) sin tocar nada. El perfil no está en
  la carpeta del programa, así que se conserva.
- **Nunca pisa una carpeta ajena:** la carpeta de instalación **siempre se llama «Aegis»**: si se elige otra
  (`D:\Apps`), Aegis va en `D:\Apps\Aegis`, y la interfaz enseña esa ruta final. Así una actualización o una
  desinstalación nunca apartan ni borran una carpeta contenedora con otras cosas. Además, solo se sustituye (y solo se
  desinstala) una carpeta vacía o una instalación de Aegis con **las dos marcas a la vez**
  (`distribution/aegis-instalador.json` y `desinstalar.exe`); si no, error 5. Se comprueba al empezar y otra vez justo
  antes de apartar la carpeta.
- Accesos en el menú Inicio y, si se pide, en el escritorio (`Aegis.lnk`).
- Registro como navegador en `HKCU` (`Software\Clients\StartMenuInternet\Aegis` con sus `Capabilities`,
  `RegisteredApplications`, clases `AegisURL`, `AegisHTML` y `AegisPDF`, asociaciones de `http`, `https`, `.html`,
  `.pdf`… como «capacidades»), **sin** ponerse de predeterminado; entrada en «Aplicaciones instaladas»
  (`…\Uninstall\Aegis`) con el desinstalador.
- **Desinstalador:** `desinstalar.exe` en la carpeta de Aegis es este mismo programa sin la carga; «Aplicaciones
  instaladas» lo abre con `--desinstalar`. Se copia a la carpeta temporal (Windows no deja borrar la carpeta desde la
  que se ejecuta; la copia, `%TEMP%\aegis-desinstalar-<pid>.exe`, se marca para borrarse al reiniciar con
  `MoveFileExW(MOVEFILE_DELAY_UNTIL_REBOOT)`, que solo funciona con permisos de administrador; si no, el instalador y
  el desinstalador borran las copias viejas cada vez que se abren), pide confirmación y quita accesos, registro y carpeta. También
  `HKCU\Software\Aegis`, lo que escribe el propio navegador (cachés del lanzador y de la ventana de arranque): con el
  fabricante «Aegis» (`docs/PLAN.md`, «Identidad en el sistema») es solo suyo; Aegis lo vuelve a crear si hay otra
  copia. **El perfil no se borra** (marcadores, contraseñas, historial, en `%APPDATA%\Aegis` y
  `%LOCALAPPDATA%\Aegis`). Ahora que la ruta es fija y solo de Aegis, falta la casilla «Borrar también mis datos»
  (apagada).
- **Lo que queda tras desinstalar y no es del perfil:** `C:\ProgramData\Mozilla-1de4eec8-…\updates\<hash de la
  carpeta>` (estado de las actualizaciones; la ruta la fija Firefox en el código). Borrarla exige calcular el hash
  de la carpeta como Firefox (CityHash64 de la ruta): pendiente.
- **Sin conexiones:** el navegador va dentro del instalador. Nada de telemetría, ni «instalador ligero» que descargue.
  El instalador no abre ningún socket (no tiene código de red).

## Elecciones para el primer arranque

El asistente deja lo elegido en `distribution/aegis-instalador.json`, dentro de la carpeta de instalación (Firefox
ignora los archivos de `distribution/` que no conoce, y las actualizaciones MAR no lo tocan porque no está en el
paquete):

```json
{
  "formato": 2,
  "instalador": "0.1.0",
  "modo": "estandar",
  "escudos": "estricto_mas",
  "buscador": "duckduckgo",
  "apariencia": "auto",
  "idioma": "es-ES"
}
```

| Clave | Valores |
|---|---|
| `formato` | 2 (cambia si cambia el significado de algo). En el 1 solo había `normal` y `estricto`, y `estricto` era el nivel de serie de entonces: Aegis lo lee como Estricto+ |
| `modo` | `estandar` \| `workflow` |
| `escudos` | `normal` \| `estricto` \| `estricto_mas` (de serie) |
| `buscador` | `duckduckgo` \| `startpage` \| `brave` \| `google` |
| `apariencia` | `oscuro` \| `claro` \| `auto` |
| `idioma` | el idioma en que se ve Windows (BCP 47, p. ej. `es-ES`; el primero de los preferidos para la interfaz, no el de los formatos regionales) |

**Cómo lo aplica Aegis** (`overlay/browser/components/aegis/instalador.sys.mjs`, llamado desde `AegisArranque.inicio()`):
en el primer arranque de un perfil nuevo (todavía sin la marca `aegis.etp.inicial`), después de poner el nivel de serie
de los Escudos y antes de que arranquen el bloqueador y los modos, lee el archivo de `XREAppDist` (la carpeta
`distribution` de la aplicación) y aplica cada valor con las mismas funciones que la interfaz, como preferencias de
usuario: lo que el usuario cambie después manda. Apunta `aegis.instalador.aplicado` en el primer arranque de cualquier
perfil, haya archivo o no, y no vuelve a leerlo nunca. Si falta, no se entiende (JSON roto, más de 64 KB) o el formato
es otro, no aplica nada (y sale la bienvenida, abajo); un valor desconocido se salta. Sin red ni temporizadores.

| Clave | Cómo se aplica |
|---|---|
| `modo` | `AegisModos.aplicar` (como el botón «Modo») |
| `escudos` | `ponerNivel` de `escudos.sys.mjs` (como el panel de Escudos): `standard`, `strict` o `strict+` |
| `buscador` | `SearchService.setDefault`, después de que Aegis ponga DuckDuckGo de serie. Startpage y Brave Search no están en la configuración de búsqueda de todas las regiones: si faltan, se añaden como buscador del usuario (`addUserEngine`, como «Añadir buscador» de Ajustes), sin conexión (`docs/CONEXIONES.md`, «Buscadores del instalador») |
| `apariencia` | el tema Oscuro o Claro con `AddonManager`, como la bienvenida (`auto` es el de serie, que sigue al sistema: no se toca). Se pone al terminar de abrirse la primera ventana, después de `AddonManagerPrivate.databaseReady` y `BuiltInThemes.ensureBuiltInThemes()`: al arrancar un perfil nuevo, Firefox aún está instalando sus temas integrados y activar uno en medio los dejaba todos desactivados. Por eso la primera ventana puede salir un instante con el tema de serie |
| `idioma` | La build es multi-idioma (en-US, es-ES, pt-BR, fr, de, it; `docs/GUIA.md`, «Construir» › «Idiomas») y de serie sigue al idioma de Windows (`intl.locale.requested` vacía, `50-interfaz.js`). Solo si el idioma del archivo da, entre los seis, otro que el de Windows (p. ej. con `--idioma`), se pide con `Services.locale.requestedLocales`, como Ajustes › Idioma; si da el mismo (`es-MX` y un Windows en español: los dos, es-ES), no se toca nada y Aegis sigue a Windows. Uno que la build no trae (`ja-JP`) se salta. Las webs ven el mismo idioma por `Intl` y por `Accept-Language`: en Firefox 158 los dos salen del idioma de la aplicación (`intl.accept_languages` vale `und` de serie y se deriva de él) |

### Sin el instalador: la bienvenida del navegador

La versión de la **Microsoft Store** (MSIX, `docs/TIENDA.md`) y el **zip** no pasan por Aegis Setup: no hay
`aegis-instalador.json`. Para que nadie se quede sin elegir, el navegador hace las mismas preguntas en
`about:bienvenida` (`overlay/browser/components/aegis/bienvenida.sys.mjs`, `paginas/bienvenida.html` y `.css`):

- **Cuándo:** solo en el primer arranque de un perfil nuevo **sin archivo** del instalador (también si el archivo no se
  entiende): `AegisInstalador.inicio()` lo dice y `AegisArranque` deja la marca `aegis.bienvenida.pendiente`. Con el
  archivo no sale nunca. Tampoco en la instancia con Tor. La primera ventana la abre **antes** que `about:conexiones`
  (en su lugar); si se cierra sin terminar, sale otra vez en el siguiente arranque, y hasta entonces se queda lo de
  serie.
- **Qué:** cinco pasos con el aspecto del asistente (DISENO §9, «Bienvenida del navegador»): el resumen («Tu
  configuración», cada fila lleva a su paso), cómo navegar, Escudos, buscador y apariencia, con las mismas tarjetas,
  miniaturas, textos (en Fluent, en `aegis.ftl`, con la redacción de los `.po` del instalador) y el mismo pie («Paso N
  de 5», Atrás y Continuar). Sale elegido lo recomendado (`RECOMENDADO` de `instalador.sys.mjs`).
- **Saltar:** en el primer paso, el principal es **«Usar lo recomendado»** (aplica lo de serie y sigue); si se ha
  cambiado algo y se vuelve al resumen, dice «Usar esta configuración». «Personalizar» recorre los pasos.
- **Al terminar:** aplica lo elegido con `AegisInstalador.aplicar()`, que usa las mismas funciones y valores que el
  archivo (`AegisModos.aplicar`, `ponerNivel`, `SearchService` con Startpage y Brave Search añadidos sin conexión, y el
  tema con `AddonManager` después de `databaseReady` y `ensureBuiltInThemes`; el buscador, siempre después del de
  serie). Quita la marca (no vuelve a salir) y lleva la misma pestaña a `about:conexiones`, sin dejar la bienvenida en
  el historial. La puerta de la red no cambia: hasta «Aceptar» allí no sale nada.
- **Teclado y accesibilidad:** las tarjetas son radios nativos (Tab entra en el grupo por la elegida; flechas izquierda
  y derecha, y en la rejilla del buscador también arriba y abajo, sin dar la vuelta); Intro hace la acción principal
  (en un botón, la suya) y Esc vuelve un paso. Al cambiar de paso, el foco va a su título, que lee el lector de
  pantalla; cada tarjeta tiene nombre («Estricto+ (recomendado)») y descripción.
- **Sin red ni temporizadores:** la página es HTML estático sin scripts con la CSP de las demás páginas propias (solo
  archivos del navegador); el módulo solo trabaja cuando el usuario pulsa algo.

Probado el 2026-10-19 en Gecko con perfiles nuevos y el código del repo (`out/pruebas/2026-10-19-bienvenida/`).

## Tecnología

- **Rust + Slint 1.18.1** con el backend winit y el **renderizador por software** (sin OpenGL ni motor web; redibuja
  solo lo que cambia). Slint es declarativo y muy parecido al QML del asistente de SecretOS.
- Inter 4.1 (Regular y SemiBold en TTF) dentro del ejecutable; iconos de línea de `docs/DISENO.md` §8 (los de SecretOS)
  en SVG. El icono de la app son **copias**: `assets/aegis.svg` y `aegis-pequeno.svg` de `branding/icono/`, y
  `assets/aegis.ico` de `overlay/browser/branding/aegis/firefox.ico` (lo genera `tools/iconos.py`). Si cambia la
  marca, se vuelven a copiar (la compilación en WSL solo ve `packaging/instalador/`).
- Versiones exactas en `Cargo.toml` (`=x.y.z`) y `Cargo.lock` en el repo.
- **Sin firma de código** (decisión del 2026-10-13, `docs/PLANNING.md` fase 7). Ver «Distribución sin firma».

### Estructura

```
packaging/instalador/
├── Cargo.toml, Cargo.lock, build.rs     build.rs compila la interfaz (con las traducciones) y los recursos (windres)
├── .cargo/config.toml                    enlazador de MinGW y CRT estático para x86_64-pc-windows-gnu
├── src/main.rs                           órdenes, ventana y conexión con la interfaz
├── src/instalar.rs                       instalación atómica, elecciones, accesos, registro, desinstalación
├── src/carga.rs                          formato de la carga, suma SHA-256, --anadir-carga
├── src/sistema.rs                        Windows: tema, idioma, carpetas conocidas, espacio, registro, accesos
├── src/captura.rs                        --captura: PNG de cada paso con el renderizador por software
├── ui/tokens.slint                       colores de DISENO.md (oscuro y claro)
├── ui/componentes.slint                  botones, segmentos, tarjetas, grupos, interruptor, casilla, campo, barra
├── ui/miniaturas.slint                   el navegador en pequeño (Estándar, Workflow, oscuro, claro, automático)
├── ui/instalador.slint                   la ventana y los pasos
├── traducciones/<idioma>/LC_MESSAGES/aegis-setup.po
└── assets/                               icono (SVG e ICO), iconos de línea, Inter, manifiesto y .rc
```

### Compilar

En WSL (Arch), como el usuario `aegis`, **fuera de `/mnt/c`** y sin tocar el árbol de Firefox:

```sh
sudo pacman -S --needed mingw-w64-gcc            # una vez (enlazador y windres)
rustup target add x86_64-pc-windows-gnu          # una vez
rsync -a --delete --exclude target --exclude dist /mnt/c/…/Aegis/packaging/instalador/ ~/instalador/
cd ~/instalador && nice -n 19 cargo build --release --target x86_64-pc-windows-gnu -j 2
# → target/x86_64-pc-windows-gnu/release/aegis-setup.exe
```

`--profile desarrollo` enlaza en segundos (sin LTO) para iterar.

### La carga

El paquete de Windows de `aegis.py package` (zip) va pegado al final del ejecutable, con una cola de 64 bytes:

```
[ aegis-setup.exe | carga (zip) | "AEGIS-CARGA-v1\0\0" | desplazamiento u64 LE | longitud u64 LE | SHA-256 de la carga ]
```

Se pega con el propio instalador: `aegis-setup.exe --anadir-carga aegis-<v>-windows.zip --salida aegis-<v>-setup.exe`
(o con 20 líneas de Python en `aegis.py instalador`, cuando exista). Si todas las entradas del zip están dentro de una
carpeta (`aegis/`), se quita. Sin cola, el instalador funciona en **modo demostración**: la barra avanza sola, no se
escribe nada y los textos lo dicen. Para probar con un zip suelto: `--carga <zip>`.

Más adelante: recomprimir con zstd o xz (el zip de `mach package` es deflate) para que el .exe pese menos.

### Órdenes

| Orden | Qué hace |
|---|---|
| `aegis-setup.exe` | el asistente |
| `--carpeta <ruta>` | otra carpeta de instalación (o la que se desinstala) |
| `--automatico` | empieza solo, con lo de serie, y termina solo sin abrir Aegis: código de salida 0 si ha ido bien o el del error (1–5, la tabla de errores). Pruebas e instalaciones desatendidas; también con `--desinstalar` (lanzado desde la carpeta instalada, el código que se ve es el del lanzador, que copia el desinstalador a %TEMP% y sale con 0; el de la desinstalación lo da esa copia) |
| `--desinstalar` | desinstalar |
| `--anadir-carga <zip> --salida <exe>` | pega la carga |
| `--carga <zip>` | carga suelta (pruebas) |
| `--captura <carpeta> [--escalas …]` | PNG de cada paso |
| `--idioma <código>`, `--tema oscuro\|claro` | fuerzan idioma y tema |

Probado en Windows 11 (125 %) con una carga de prueba: instalar, volver a instalar encima (sustitución atómica),
negarse con una carpeta ajena, y desinstalar dejando el registro y el menú Inicio como estaban.

**Prueba de extremo a extremo (2026-10-16)** con `tools/pruebas/instalador.py` y el `Aegis Setup.exe` real (Aegis
158.0, builds del 2026-10-16 a las 21:32 y a las 22:16), en este equipo y fuera de la carpeta temporal. Resultados en
`out/pruebas/2026-10-16-instalador/`:
- `instalar`: `--automatico` termina con 0 en unos 3 s; 66 archivos, `desinstalar.exe` y el JSON (formato 2,
  `estricto_mas`); **sin cargador de desarrollo** (ni `aegis-dev.cfg`, ni `general.config.filename`, ni `aegis.dev`);
  acceso en el menú Inicio, claves de HKCU y entrada en «Aplicaciones instaladas».
- `navegador` (Marionette, perfiles propios con un proxy cerrado): modo, nivel de Escudos y buscador se aplican en el
  primer arranque (Startpage y Brave Search, añadidos como buscadores del usuario, sin código de socio); un segundo
  arranque respeta lo que el usuario cambió; un perfil ya usado, un JSON roto y un formato desconocido no aplican
  nada. El tema falló en la build de las 21:32 (se quedaban todos los temas desactivados: carrera con la instalación
  de los temas integrados al arrancar); con el arreglo (se pone al abrirse la primera ventana), en la de las 22:16
  Oscuro y Claro quedan activos. En esa misma pasada, cambiar el nivel de Escudos y cerrar enseguida (con las listas
  compilándose) deja el siguiente arranque con las 18 listas, sin cuarentena ni incidencias.
- `desinstalar`: por el camino de «Aplicaciones instaladas» (`desinstalar.exe` → copia en `%TEMP%`), sin claves, sin
  accesos y sin carpeta; los perfiles se quedan. La copia vieja de `%TEMP%` la borra la siguiente ejecución.

### Probar la interfaz

`aegis-setup.exe --captura <carpeta> [--escalas 1,1.5,2] [--idioma es]` dibuja cada paso (y el error, el modo
Workflow, Estricto, desinstalar…) en oscuro y en claro con el mismo renderizador que la ventana, sin abrirla. Las
capturas de referencia se comparan con las de la bienvenida de SecretOS.

## Distribución sin firma

`Aegis Setup.exe` se publica en GitHub Releases tal cual, sin firma Authenticode (toda firma que Windows reconoce exige
verificar la identidad del autor con un documento oficial). Lo que eso supone para quien lo descarga, y que la página de
descarga tiene que decir sin rodeos:

- **SmartScreen avisa la primera vez** que se abre el instalador descargado: «Windows protegió tu PC». Se abre con «Más
  información» → «Ejecutar de todas formas». Es el aviso de cualquier programa sin firma y poco descargado; no quiere
  decir que tenga nada malo, pero tampoco lo podemos demostrar con una firma: quien desconfíe puede comparar la suma
  SHA-256 del archivo con la publicada junto a él.
- **Con el Control inteligente de aplicaciones activado** (Seguridad de Windows › Control de aplicaciones y del
  explorador), Windows bloquea el instalador sin opción de abrirlo, y también el navegador. No hay forma legítima de
  saltárselo desde Aegis: hay que desactivar el Control inteligente o no usar Aegis en ese equipo. Lo decimos así, sin trucos.
- **Después, nada más:** la instalación es por usuario y sin UAC; las actualizaciones son MAR firmados con la clave de
  Aegis, que el updater escribe sin la marca de «descargado de Internet», así que SmartScreen no vuelve a avisar.
- Si Defender marcara una versión como sospechosa (falso positivo habitual sin firma), se envía a Microsoft como falso
  positivo.
- **En este equipo de desarrollo** (con el Control inteligente activado) los ejecutables sin firma arrancan desde
  la carpeta del usuario (`%USERPROFILE%\…`), pero en la carpeta temporal se han visto bloqueados; por eso el banco de pruebas
  (`tools/pruebas/instalador.py`) copia el Setup a `%USERPROFILE%\Aegis-instalador-prueba\`. La copia del
  desinstalador en `%TEMP%` (la escribe el propio desinstalador, sin la marca de descargado) sí arrancó el
  2026-10-16. Las builds nuevas también se prueban en el Espacio aislado
  (`packaging/instalador/probar-en-sandbox.wsb`).

## Revisión

Pasa por `inspector-visual` con capturas reales en Windows 10 y 11 a 100, 125, 150 y 200 %, en claro y en oscuro, y por
`guardian-estabilidad` (instalar, actualizar encima, desinstalar y volver a instalar sin dejar restos).
