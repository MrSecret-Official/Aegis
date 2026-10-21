# Planning de Aegis

Plan por **fases** hasta la **1.0 para Windows**. El qué y el porqué de cada fase están en `PLAN.md`; aquí está el
orden, la lista de tareas y cuándo se da cada fase por hecha. Sin fechas: una fase empieza cuando termina la
anterior (o antes, si una tarea no depende de nada).

- Marca `[x]` lo hecho y `[~]` lo empezado. Cada tarea termina con el APROBADO de sus revisiones
  (estabilidad, diseño, privacidad y traducción).
- **Sin servidores:** todo lo que necesita Aegis son archivos estáticos (GitHub Releases o Pages) y la nube de cada
  usuario. Las únicas cosas «de fuera» son registros que haces tú (sección «Lo que tienes que hacer tú»).
- **Desarrollo sin esperas:** la copia de prueba (`aegis.py instalar-prueba`) lee prefs, estilos y código de
  `overlay/browser/components/aegis` directamente del repo: un cambio se ve al reiniciar Aegis. Solo se compila para
  publicar o cuando cambia algo que va dentro del ejecutable (parches, marca, iconos, temas incluidos).

## Orden de dispositivos

**Windows → SecretOS (Linux, Arch con linux-zen) → Android.** Hasta que la versión de Windows esté hecha, todo se
construye, se prueba y se publica solo para Windows. Las piezas que ya sirven para Linux (`aegis.py`, el mozconfig
`linux-x86_64`) se conservan, pero no se trabaja en ellas. Windows se compila en cruzado desde WSL: configure
descarga de Microsoft el kit de Visual Studio y el SDK, así que no hay que instalar nada en Windows.

## Resumen

| Fase | Qué se entrega | Hito |
|---|---|---|
| 0 · Herramientas y primera build | Árbol propio, build de Windows en cruzado, actualizaciones, modo desarrollo | Arranca en Windows |
| 1 · Limpieza, marca y privacidad | Marca e icono, cero conexiones, búsqueda limpia, seis idiomas, instalador v1 | **0.1** |
| 2 · Tema y modo Estándar | Interfaz de Aegis entera: barra, menús, nueva pestaña, ajustes, complementos, marcadores | **0.3** |
| 3 · Modo Workflow | Espacios, esenciales, compacto, Glance, vista dividida, paleta | **0.5** |
| 4 · Escudos | Bloqueador con contador en la barra, listas combinadas, anti-detección | **0.7** |
| 5 · Contraseñas | Bóveda cerrada y código de transferencia | **0.8** |
| 5b · Cuentas y nube | Perfiles con Google, Microsoft o GitHub y sincronización cifrada en tu nube | **0.85** |
| 6 · Anonimato | Proxy por espacio, Tor y Aegis anónimo | **0.9** |
| 7 · Instalador y pulido de Windows | PGO, bienvenida final, repaso completo (sin firma de código) | **1.0 para Windows** |

Las tareas pequeñas de la fase 7 (CI, integración con Windows) se van haciendo en paralelo desde la fase 3.

## Versiones de Firefox (cambio de base cada 4 semanas)

Firefox sale cada 4 semanas, pase lo que pase en Aegis: cada salida interrumpe la fase en curso de 1 a 3 días.
Fechas reales en `product-details.mozilla.org` (`NEXT_RELEASE_DATE`). **Firefox 158.0 salió el 13-10-2026** (product-details, comprobado el 15-10); Aegis pasó a la 158.0 el 15-10-2026. Próxima fecha publicada: 23-10-2026.

**Lista de cada cambio de base** (repetir en cada versión):
- [ ] Mirar la beta 3 semanas antes: ¿se aplican los parches? (`aegis.py patch --check` sobre la beta).
- [ ] El día de salida: actualizar `upstream.json` (versión, URL, sha256, tamaño).
- [ ] `fetch`, `prepare --limpio`, arreglar parches, `export`.
- [ ] Prefs renombradas o retiradas (lint de `verificar.py`) y selectores CSS que ya no existan.
- [ ] Compilar, arrancar y repasar a mano lo que toca cada parche.
- [ ] Revisores: guardian-estabilidad y auditor-privacidad (e inspector-visual si cambió la interfaz de Firefox).
- [ ] Correcciones de seguridad de Mozilla entre versiones: integrarlas en 48–72 h.

---

## Fase 0 · Herramientas y primera build

- [x] Investigación: Gecko o Chromium, soft fork o hard fork (decidido: Gecko, soft fork sobre Release).
- [x] Repo: estructura, `README.md`, `docs/GUIA.md`, `docs/PLAN.md`, este planning.
- [x] `tools/aegis.py` (fetch, prepare, patch, overlay, export, mozconfig, bootstrap, build, run, package, estado).
- [x] `tools/build-wsl.sh` (entorno en WSL Arch, usuario `aegis`).
- [x] Fuente de Firefox 157.0.1 descargada y verificada (sha256 y firma GPG de Mozilla).
- [x] `docs/DISENO.md` de Aegis.
- [x] Flujo de calidad: revisiones (estabilidad, diseño, privacidad, traducción, rendimiento) y `tools/verificar.py` v1.
- [x] `prepare` y `bootstrap` en WSL (WSL con 24 GB de memoria y 16 de swap: con 16 GB se quedaba sin memoria).
- [x] **Primera build de Windows**, en cruzado desde WSL, que arranca en Windows (`aegis.py instalar-prueba`).
- [x] **Actualizaciones**: URL estática en GitHub Releases (parche `0100-build/0001`), claves MAR propias,
      `aegis.py mar` y `publicar` (ver `docs/ACTUALIZACIONES.md`).
- [x] **Modo desarrollo:** la copia de prueba carga prefs y código del repo al arrancar (sin compilar).
- [~] Build incremental con sccache y marca de Aegis.
- [ ] Medir: tiempo de build limpia e incremental y RAM máxima. Apuntarlo en `docs/GUIA.md`.
- [x] Probar una actualización de extremo a extremo **en Windows** (2026-10-16, Firefox 158.0; detalle en
      `docs/ACTUALIZACIONES.md` y resultados en `out/pruebas/2026-10-16-actualizaciones/`): build N, build N+1, `mar`
      (revisión 2 solo para la prueba), `update.xml` servido por un HTTPS local que imita GitHub Releases (política
      `AppUpdateURL` en la copia de prueba y la CA solo en su perfil). Aceptar en `about:conexiones` → descarga →
      preparación → al reabrir arranca N+1 con su buildID, también en `%LOCALAPPDATA%\Programs`; rechaza (error 19,
      instalación intacta) un MAR firmado con otra clave, de otro canal con otra clave, o con un byte cambiado.
      Control inteligente: 0 eventos en 14 ejecuciones. Arreglado por el camino:
      - buildID distinto en `firefox.exe` y en `application.ini` en las builds incrementales (cada versión se habría
        vuelto a instalar a diario): `build` fija `MOZ_BUILD_DATE` y `mar` lo comprueba;
      - el asistente NSIS tras actualizar (`helper.exe /PostUpdate`) pisaría el registro del instalador propio:
        parche `0100-build/0002`;
      - extras del servidor de Mozilla en la descarga del MAR: parche `0400-privacidad/0004`;
      - descarga por BITS (fuera de la red de Aegis y con Aegis cerrado): `app.update.BITS.enabled` en false.
- [ ] Actualizaciones, lo que queda: rechazo por canal con una firma válida (error 22; exige firmar con la clave real
      un MAR de otro canal), `Accept-Language` fijo también en la descarga del MAR (una línea de C++:
      `nsIncrementalDownload` pone las cabeceras extra en el canal viejo al redirigir), el banco de prueba a
      `tools/pruebas/` y la primera prueba contra GitHub de verdad (release en borrador).
- [ ] Desinstalador del instalador propio: hoy se copia a `%TEMP%` para ejecutarse, y es ahí donde el Control
      inteligente bloquea los ejecutables sin firma en este equipo. Ejecutarlo desde otra carpeta.
- [x] Primer cambio de base real: **Firefox 158** (2026-10-15). Los 7 parches, solo con desplazamientos salvo el
      0600 (el motor usa `etp_engine`, el fork de adblock-rust de Mozilla); dos ajustes del overlay (`Cargo.toml`
      del motor y `--tab-icon-fill-loading`). Build incremental de 16 min tras un primer intento sin memoria al
      enlazar gkrust. Actualización de extremo a extremo probada el 2026-10-16 (ver arriba).
- [ ] Panel de Windows `Aegis.cmd` / `aegis.ps1` (como el de SecretOS): fetch, prepare, build, instalar-prueba, registro.
- [ ] Subir el código al repositorio privado `MrSecret-Official/Aegis-Private` (GitHub CLI ya instalado y con sesión).
- **Hecho cuando:** Aegis arranca en Windows desde este repo, y un cambio de base sale en menos de un día.

## Fase 1 · Limpieza, marca y privacidad → 0.1

**Marca**
- [~] `branding/marca.json` (nombre, ids, URLs) y búsqueda de la marca «Aegis» (EUIPO y USPTO, clase 9).
- [~] Icono: fantasma blanco con una cerradura por boca sobre loseta negra (`branding/icono/`), y su generador
      `tools/iconos.py` (`.ico` y PNG de 16 a 256).
- [~] `overlay/browser/branding/aegis/` y la marca en el mozconfig: ni «Nightly» ni «Firefox» a la vista.
- [~] **Identidad propia en el sistema** (`docs/PLAN.md`, «Identidad en el sistema»; lo encontró el auditor de
      privacidad el 2026-10-16: `application.ini` decía Vendor=Mozilla, Name=Firefox, RemotingName=firefox).
      Preparado: fabricante y perfiles `Aegis` (parche `0200-branding/0001`), remoting `aegis` (`mozconfigs/common`),
      el desinstalador quita `HKCU\Software\Aegis` y `verificar.py` lo comprueba. User-Agent, `firefox.exe` e ID
      de la app sin tocar. Falta, con la build completa:
      - `application.ini`: Vendor=Aegis, Name=Firefox, RemotingName=aegis, Profile=Aegis, ID de siempre;
      - perfil nuevo sin `-profile`: se crea en `%APPDATA%\Aegis` (`profiles.ini`, `installs.ini`, `Profiles\`) y
        `%LOCALAPPDATA%\Aegis`, y nada nuevo en `%APPDATA%\Mozilla` ni en `HKCU\Software\Mozilla`;
      - con un Firefox abierto (sin `-no-remote`), abrir Aegis abre Aegis, y al revés;
      - registro tras instalar, usar y desinstalar (`tools/pruebas/instalador.py`: `Software\Aegis` desaparece);
      - actualización N→N+1 con la build nueva (misma carpeta de estado en `ProgramData`, que no cambia);
      - extensiones de AMO: instalar, actualizar y `runtime.getBrowserInfo()` (nombre «Firefox», fabricante «Aegis»);
      - User-Agent igual que el de Firefox 158 (HTTP, `navigator.userAgent`, en workers) y `navigator.vendor` vacío.
- [ ] Desinstalador: borrar también `C:\ProgramData\Mozilla-1de4eec8-…\updates\<hash>` (CityHash64 de la ruta, como
      `GetInstallHash`) y la casilla «Borrar también mis datos» (`%APPDATA%\Aegis`, `%LOCALAPPDATA%\Aegis`).
- [ ] Pantalla «Acerca de Aegis» con «Basado en el código de Mozilla Firefox».

**Instalador de Aegis v1** · diseño en `docs/INSTALADOR.md`
- [~] «Aegis Setup» en Rust + Slint con el aspecto del asistente de SecretOS: pasos con tarjetas de opción, pie con
      el progreso de pasos, Atrás y Continuar. Contenido de Aegis: bienvenida, modo (Estándar o Workflow),
      privacidad, apariencia, opciones, instalando y listo. 2026-10-16: Escudos con tres niveles (Normal, Estricto y
      «Estricto+ (recomendado)», el de serie; JSON en formato 2), repaso contra DISENO (hover y pulsado de la ×,
      interruptor apagado, duraciones, movimiento reducido de Windows) y `--automatico` que termina solo con código de
      salida. Capturas en `out/pruebas/2026-10-16-instalador/capturas/`.
- [x] Instalación por usuario en `%LOCALAPPDATA%\Programs\Aegis` (sin UAC), menú Inicio, registro como navegador en
      HKCU sin imponerse, entrada en «Aplicaciones instaladas» y desinstalador con el mismo aspecto. Probado de
      extremo a extremo el 2026-10-16 con el Setup real (`tools/pruebas/instalador.py`): instala, desinstala por
      «Aplicaciones instaladas» y deja el registro y los accesos limpios, sin borrar perfiles.
- [x] El navegador va dentro del instalador (comprimido y con suma); una sola descarga, sin conexiones.
- [x] Aegis aplica las elecciones del instalador en el primer arranque de un perfil nuevo
      (`overlay/browser/components/aegis/instalador.sys.mjs`): modo, Escudos, buscador y tema probados con la build
      del 2026-10-16 22:16 (el tema, que fallaba por una carrera con los temas integrados, se pone al abrirse la
      primera ventana). El idioma, desde la build multi-idioma (2026-10-20): Aegis sigue al de Windows y solo pide el
      del instalador si da otro de los seis (`--idioma`); uno que la build no trae se salta.
- [ ] Distribución sin firma: la página de descarga explica el aviso de SmartScreen la primera vez y que con el
      Control inteligente de aplicaciones Windows no deja abrirlo (texto en `docs/INSTALADOR.md`).
- [ ] Revisión de inspector-visual con capturas reales en Windows 10 y 11, a 100–200 %.

**Telemetría y conexiones**
- [x] `settings/prefs/` por área: telemetría, nueva pestaña, red, privacidad, interfaz y actualizaciones.
- [~] Sin mensajes de marketing: aviso de navegador predeterminado, mensajes de ASRouter, sugerencias.
- [ ] Parches `0300-telemetria`: Normandy/Nimbus, Pocket, IA, PPA, quicksuggest, newtab sin feeds (solo lo que no
      se pueda con prefs).
- [x] Remote Settings, push, GMP, listas de rastreo, Safe Browsing y la comprobación de actualizaciones: no antes de
      la bienvenida. Puerta `about:conexiones` (`conexiones.sys.mjs`, un interruptor por grupo, sin reiniciar),
      `settings/prefs/66-conexiones.js` y el parche `0400-privacidad/0003` (Remote Settings solo con las colecciones
      permitidas; actualizaciones automáticas por manualUpdateOnly). Entrada en Ajustes › Privacidad › Conexiones.
- [x] `tools/auditar-red.py` en Windows: perfil nuevo detrás del proxy local de `tools/pruebas/red.py` (registra y
      corta cada intento), más `MOZ_LOG` (DNS) y netstat (TCP); `--directo` sin proxy; `--aceptar` pulsa «Aceptar».
      `docs/CONEXIONES.md` v1. Falta `pktmon` para UDP (a mano).
- [x] **Prueba: perfil nuevo, 10 minutos, 0 paquetes** (2026-10-14, build empaquetada, `auditar-red.py`):
      - antes del cambio: aus5.mozilla.org, ciscobinary.openh264.org, edgedl.me.gvt1.com, update.googleapis.com,
        firefox.settings.services.mozilla.com (15), push.services.mozilla.com (7), github.com y www.google.com;
      - después: **0 intentos** en 10 minutos (proxy, DNS y TCP); tras «Aceptar» con los interruptores de serie,
        10 minutos más: solo firefox.settings.services.mozilla.com, github.com, aus5.mozilla.org y
        ciscobinary.openh264.org, todas en `CONEXIONES.md`. Sin proxy (`--directo`, conexiones reales: 3 min antes y
        7 después): 0 antes; después, además, firefox-settings-attachments.cdn.mozilla.net y
        content-signature-2.cdn.mozilla.net (la cadena de la firma de Remote Settings), también en la lista.
      - 2026-10-15 (revisión del auditor): en una de sus mediciones salieron duckduckgo.com (2) y www.google.com
        a los 510 s, justo cuando Firefox dispara «idle-daily» (equipo 3 min inactivo). No se ha podido reproducir:
        3 seguidas de 10 min (`cero-1..3`), 3 más rastreando cada canal (`caza-1..3`) y 3 seguidas con las tareas de
        inactividad forzadas (`--simular-reposo`: tareas tardías de BrowserGlue e «idle-daily»; `cero-reposo-1..3`),
        todas con **0 intentos**. Ojo: con alguien usando el equipo, Firefox no llega a estar «inactivo» y esas
        tareas no corren; por eso existen `--simular-reposo` y `--rastrear` (pila de quién abre cada canal), y
        `--sin-ventana` para que nadie pueda tocar la ventana de la prueba. Resultados en `out/pruebas/2026-10-15-fase1/`.
- [ ] Encontrar el origen de esas tres conexiones si vuelven a salir (medir con `--rastrear --simular-reposo`).
      - 2026-10-15, en la 158 (`out/pruebas/2026-10-15-auditor-158/`): 0 intentos en 4 mediciones antes de aceptar,
        una de ellas con interacción (foco en la barra, escribir sin Enter, la lupa, nueva pestaña e «idle-daily»), y 0
        resoluciones DNS en modo directo. Con un proxy, Firefox no hace conexiones especulativas: lo más probable es que
        aquellas tres fueran cargas de verdad de alguien usando la ventana visible.
- [ ] `SearchEngine.speculativeConnect` no mira ninguna pref y, con ECH, pide el registro DNS HTTPS del buscador aunque
      `network.http.speculative-parallel-limit` sea 0. De serie no se llama (el buscador de la nueva pestaña pasa la
      búsqueda a la barra), pero sí con `handoffToAwesomebar` en false o con la barra de búsqueda aparte al enfocarla.
      Parche de una línea al principio de esa función: salir si `browser.urlbar.speculativeConnect.enabled` es false.
      Medir también `SessionStore` y `PlacesUIUtils` (llaman a `Services.io.speculativeConnect` al pasar el ratón por
      pestañas sin cargar y marcadores) en `auditar-red.py --directo`.
- [ ] `verificar.py`: comprobar contra el árbol fijado que `chrome://browser/content/default-bookmarks.html` sigue
      existiendo y lo sigue leyendo `PlacesBrowserStartup` (el `override` de `aegis-temas.inc.mn` que deja un perfil
      nuevo sin marcadores dejaría de actuar sin avisar).
- [x] Listas propias de los Escudos: su descarga sigue también el interruptor «Listas de protección»
      (`aegis.conexiones.listas`), no solo `aegis.conexiones.aceptadas` (2026-10-14, `escudos/listas.sys.mjs`), y el
      texto de ese grupo en `about:conexiones` las nombra.
- [x] Traducción de páginas detrás de la puerta (grupo `traduccion`), adjuntos de Remote Settings solo de colecciones
      permitidas, Remote Settings sin cookies y con idioma fijo, `<link rel=preconnect>` y early hints apagados,
      actualizaciones automáticas visibles para la tarea en segundo plano (`app.update.aegis.automaticas`) y sondeo
      completo al encender un grupo más tarde (2026-10-15).

**Búsqueda e idiomas**
- [x] Sin códigos de socio en las URL de búsqueda (parche `0400-privacidad/0002`); DuckDuckGo de serie.
- [ ] Motores: DuckDuckGo, Startpage, Brave Search, Google limpio, Mullvad Leta, Qwant, Ecosia, Wikipedia; solo
      configuración local.
- [x] Build multi-idioma (en-US, es-ES, pt-BR, fr, de, it) y el idioma del sistema al primer arranque (2026-10-20):
      traducciones de Firefox de `mozilla-l10n/firefox-l10n` en el commit que fija `l10n-changesets.json` (`upstream.json`
      › `l10n`, con sha256), `package` con `mach package-multi-locale`, la marca de Aegis en los seis y
      `intl.locale.requested` vacía (el idioma de Windows). El MSIX declara los seis. Sin «Buscar más idiomas…»: no se
      descargan idiomas. Los textos visibles de las traducciones que decían «Firefox» con todas las letras (pt-BR, de)
      y lo que le falta a es-ES en el menú principal los corrige `fetch` (`tools/l10n-cambios.json`).
- [ ] es-ES incompleto: al commit fijado le faltan 1089 textos de 158.0 (compare-locales; fr, de, it y pt-BR, 0), y
      al más reciente de firefox-l10n (2026-10-19) todavía 1083: ningún commit lo completa. Se van rellenando a mano solo
      los que se ven (`tools/l10n-cambios.json` › `anadidos`, hoy los del menú principal); el resto sale en inglés.
      Revisar con cada versión de Firefox.
- [ ] Ajustes no cambia de idioma en el momento: al elegir otro en Ajustes › Idiomas, lo de Firefox cambia al
      instante, pero los textos que pone Aegis con `textContent` (cabecera y grupos de la barra lateral, Escudos, Tor,
      huella, conexiones…; unas 50 llamadas a `texto()` en `ajustes.sys.mjs` y más en sus módulos) se quedan en el
      idioma anterior hasta reiniciar o volver a abrir Ajustes. Arreglo: pasarlos a `document.l10n.setAttributes` (con
      `aegis.ftl` añadido a los recursos del documento) para que Fluent los cambie solo; o, como mínimo, volver a montar
      la página con `intl:app-locales-changed`. Visto el 2026-10-20 (`out/pruebas/2026-10-20-multi-idioma/`).
- [~] `policies.json` mínimo y Safe Browsing apagado de serie; DRM (Widevine) y OpenH264 bajo demanda. Hecho:
      Safe Browsing apagado (y sin clave de Google en la build: no se ofrece), Widevine solo si una web pide DRM y el
      usuario lo activa, OpenH264 solo con «Códecs de vídeo» aceptado. Falta: la clave propia de Safe Browsing.
- [ ] Windows: que no se registre como navegador predeterminado sin pedirlo; «Hacer predeterminado» abre
      Configuración de Windows.
- **Hecho cuando:** perfil nuevo sin un paquete en 10 minutos y nada de Firefox ni de Nightly a la vista → **0.1**.

## Fase 2 · Tema y modo Estándar → 0.3

- [x] `tokens.css` y `mapeo-firefox.css` (oscuro y claro), Inter cargada desde el navegador.
- [~] Interfaz: barra de herramientas, barra de direcciones con el selector de buscadores, pestañas, menús en
      cápsulas, paneles, avisos y mensajes emergentes al estilo de los widgets de SecretOS, contenido como tarjeta.
      Sin el degradado ni el violeta de Firefox: blanco y grises.
- [~] Las hojas de Aegis llegan a todas las páginas propias (`chrome://` y `about:` del navegador, nunca a una web).
- [~] **Nueva pestaña** al estilo de Brave: accesos arriba, buscador debajo, sin logotipo ni accesos de serie.
- [~] **Ajustes** al estilo del Centro de SecretOS: barra lateral con grupos y buscador, tarjetas, sin nada de Mozilla.
- [~] **Complementos y temas:** sin los temas de Firefox; temas propios de Aegis, monocromos.
- [~] **Marcadores** integrados en un panel lateral como Chrome o Brave (la ventana Biblioteca, solo si se pide).
- [ ] Iconos de línea (unos 100, desde los glifos de SecretOS) con `tools/iconos.py`.
- [ ] Modo **Estándar** completo: una sola barra y barra de favoritos discreta (por defecto solo en la nueva
      pestaña); énfasis (Monocromo, Sistema o Personalizado); Mica opcional en Windows 11.
- [ ] `tools/capturar.py` (oscuro y claro, 100–200 %).
- **Hecho cuando:** el inspector-visual aprueba las capturas en los dos temas y las cuatro escalas → **0.3**.

## Fase 3 · Modo Workflow → 0.5

- [~] Interruptor de modo (Estándar ↔ Workflow sin perder nada) con pestañas verticales nativas.
- [~] Estilo de las pestañas verticales y de la barra lateral. 2026-10-20: filas de 36, la activa con `--aegis-sel`, el
      filo y el título en 500 (`estilos/workflow.css`). Falta: etiquetas de los grupos de pestañas con los colores de Aegis.
- [x] Contenedores cómodos (2026-10-20, `out/pruebas/2026-10-20-contenedores-workflow/`): selector de la barra de
      direcciones (indicador de Firefox o botón propio sin contenedor, Ctrl+Mayús+L y la acción «Cambiar de contenedor»)
      que reabre la pestaña en otro contenedor o abre una nueva en él, con aviso de lo escrito en formularios
      (`contenedores.sys.mjs`); colores de los contenedores con la fórmula del énfasis y un punto en la pestaña en lugar
      de la raya de Firefox (`tokens.css`, `estilos/contenedores.css`); textos de es-ES que faltaban del panel de crear y
      del diálogo de editar (`tools/l10n-cambios.json`).
- [x] Tutorial de Workflow (2026-10-20): cuatro pasos tras la bienvenida con Workflow y cuando se quiera (Ajustes ›
      Pestañas y navegación y la acción «Ver el tutorial de Workflow»), `about:bienvenida?tutorial`.
- [ ] **Espacios** (nombre, icono, contenedor propio, borrar al cerrar por espacio, `Ctrl+1…9`) guardados en la sesión.
- [ ] **Esenciales** (fijadas por espacio, en rejilla).
- [ ] **Modo compacto** y descarga de pestañas inactivas y de espacios ocultos.
- [ ] **Glance** (abrir un enlace por encima, «Abrir como pestaña»).
- [ ] **Vista dividida** nativa con nuestro estilo; **paleta de órdenes** `>` en la barra de direcciones.
- [ ] Pruebas con Marionette (espacios, sesión, compacto, Glance); `tools/rendimiento.py` (arranque, memoria y CPU
      en reposo frente a Firefox).
- **Hecho cuando:** los dos modos conviven sin perder pestañas ni sesión y el consumo no supera al de Firefox → **0.5**.

## Fase 4 · Escudos → 0.7

- [x] Motor (2026-10-14, pasos 1 y 2 del diseño): adblock-rust 0.12.1 de `third_party/rust` compilado a WebAssembly
      (`aegis.py motor-escudos`, `tools/motor-escudos/`, `escudos/motor.wasm` de 1,6 MB) y bloqueo de red en
      `http-on-modify-request` (`escudos/red.sys.mjs`) detrás de ETP, con Escudos bajados respetados, categoría
      «Anuncios» en el contador y la espera de las peticiones mientras carga (como mucho 1,5 s). Firefox trata compilar
      WebAssembly en el proceso padre como `eval()`: hace falta un parche de una línea que permite los dos archivos del
      motor (`0600-escudos/0001`).
- [x] Listas (pasos 3 y 4): catálogo de 24 listas (`escudos/catalogo.json`), preprocesado de `!#if` y `!#include` y
      compilación en un ChromeWorker (`escudos/motor-worker.js`), caché en el perfil (`aegis-escudos/`), instantánea
      dentro de la build (`aegis.py filtros` → `filtros/`, 26 MB de texto, con licencias y atribución): bloquea desde
      el primer arranque sin red. Actualización con `nsIUpdateTimerManager`, diaria para las caducadas según su
      «Expires», condicional, sin cookies ni Referer, solo https, comprobada y con vuelta atrás, solo tras la bienvenida.
      Niveles Normal, Estricto y **Estricto+** (de serie: AdGuard Tracking); molestias de serie con interruptor por grupo
      (prefs; el interruptor en el panel y en Ajustes, en la fase siguiente); regionales por idioma. Contador de
      peticiones de serie u orígenes (`aegis.escudos.contador`). Banco: caso «anuncios» en `tools/pruebas/escudos.py`;
      rendimiento en `tools/pruebas/escudos_rendimiento.py`.
      - Medido (2026-10-14, build de Windows, la misma con y sin motor): primer pintado igual (el motor se carga tras
        él); cargar el .dat, 0,2-0,3 s en el hilo principal con Estricto+ (0,1 s con Estricto); memoria del motor
        76 MB con Estricto+ (38 MB con Estricto), proceso principal +60 MB; compilar las listas en el worker, 2-3 s
        (0,9 s con Estricto). Por petición, unos 110-130 µs de motor en una carga real (19 µs con la caché del
        procesador caliente) más unos 50 µs de contador por petición bloqueada; la página de 300 peticiones carga
        igual con y sin motor.
- [x] Motor nativo (2026-10-15, opción B del diseño): el mismo adblock-rust 0.12.1 que Firefox ya compila en gkrust,
      tras un servicio XPCOM propio (`escudos/motor-nativo/`: crate `aegis_escudos_motor`, IDL y registro), enlazado
      por `0600-escudos/0001-motor-en-gkrust.patch` (una línea en `toolkit/library/rust/shared/Cargo.toml`, otra en su
      `lib.rs` y la entrada de `Cargo.lock`). Cargar el .dat y compilar las listas van en un hilo de fondo; el worker
      solo preprocesa. La API de `motor.sys.mjs` no cambia. Se retiran el .wasm, `tools/motor-escudos/`, `aegis.py
      motor-escudos`, el parche de `eval()` y `security.allow_eval_in_parent_process` del modo desarrollo.
      - Medido A (wasm) frente a B (nativo), 2026-10-15, misma build (mismo `xul.dll`, solo cambia el JS del motor),
        Estricto+, 3 veces, medianas (`out/pruebas/2026-10-15-motor-nativo/`): memoria del motor 77,6 → 40,3 MB;
        proceso principal +55,7 → +33,9 MB sobre «sin motor»; cargar el .dat, 140-170 ms (más 85-100 ms de instanciar)
        en el hilo principal → 0,01 ms (100-150 ms en el de fondo); por petición, 67 → 35 µs en frío y 14 → 8 µs en
        caliente, y 62 → 53 µs en una carga real; consulta cosmética de youtube.com 1,0 → 0,6 ms; compilar, unos 1,5 s
        en los dos; primer pintado igual. B lee el .dat que dejó A (mismo formato, mismas decisiones), pero la clave
        cambia y se recompila una vez.
      - **Coste de compilar:** cada cambio en el Rust del motor rehace el LTO de gkrust y el enlace de `xul.dll`:
        **12,6 min** de build incremental en este equipo (el crate, 1 s; el resto, LTO en un hilo con 8 GB de swap). La
        primera vez, con la interfaz nueva, 25 min (el IDL rehace los enlaces de XPCOM). Los cambios de JS siguen siendo
        `build --rapido` (12 s). Ojo: un cambio guardado mientras una build escribe `gkrust.lib` queda más viejo que
        ella y make no lo recompila; si la build siguiente dura segundos, tocar el `.rs` en el árbol y repetir.
      - **En cada versión de Firefox:** el parche toca `Cargo.lock` (su contexto cambia en casi todas) y gkrust; si
        Firefox sube la versión de adblock-rust, revisar la API que usa `motor-nativo/src/lib.rs` (el .dat se
        recompila solo: la clave del motor cambia con cada build).
- [x] Plan B del motor (2026-10-16): desde la 158 el motor usa `etp_engine`, el fork de Mozilla, que puede cambiar,
      recortarse o desaparecer. Copia propia de adblock-rust 0.12.1 en `motor-nativo/adblock/` (tal cual de la 157,
      comprobada contra su `.cargo-checksum.json`), `Cargo.toml.propio` y el parche
      `0600-escudos/alternativos/propio/0001`; se elige con `upstream.json` › `escudos` › `motor` y `aegis.py
      prepare` (docs/GUIA.md, «Versión de Firefox»). `verificar.py` avisa si `etp_engine` cambia de versión, de API o de
      contenido, o si una dependencia de la copia falta en `third_party/rust`; `patch --check` prueba los dos motores.
      Comprobado con `cargo check` del motor contra la copia y `Cargo.lock --locked` con la serie completa en la 158.
      Probado de verdad (`out/pruebas/2026-10-16-motor-propio/`): `prepare` a «propio» sin rehacer el árbol, build
      incremental de Windows en 16 min (`xul.dll` +122 KiB), humo sin errores de Aegis (motor cargado, bloquea, recursos
      y scriptlets), banco `--aislar` con 0 fallos (1418 ok, controles 11 de 11); el `.dat` que compila cada motor es
      idéntico byte a byte y cada uno carga el del otro con las mismas decisiones. Vuelta a `etp_engine` con `prepare`,
      `patch --check` con los dos motores y build (13 min).
      - **Sin bucles de cierres** (2026-10-15): en gkrust un pánico de adblock-rust cierra el navegador entero.
        `listas.sys.mjs` escribe un marcador (`aegis-escudos/compilando.json`) antes de compilar y lo borra al
        terminar; si al arrancar sigue ahí, las listas sospechosas pasan a cuarentena por su sha256 (no se vuelve a
        aceptar ese texto), vuelven las versiones anteriores o la instantánea y queda en `estado().incidencias`. Cada
        lista nueva se compila antes sola (1,3 s para cinco listas grandes, frente a 1,8 s de la tanda; fuera del hilo
        principal): la culpable queda identificada. Si muere la instantánea, el motor no la recompila con esa build
        (solo ETP). El compilador nativo ya pasa la hoja genérica y una petición, para que un fallo de carga salte al
        compilar. Prueba: `tools/pruebas/escudos_cierres.py` (copia aislada; mata su propio proceso en cada fase),
        20 de 20. adblock-rust 0.12.1 no cae con 260 000 líneas mutadas de las listas reales ni con las 24 de la
        instantánea enteras (arnés nativo con las mismas features). Falta: los textos para el panel y Ajustes, y un
        pánico al decidir una petición o al consultar el cosmético de una página (no lo cubre el marcador).
- [x] Cosmético, genéricas y scriptlets (2026-10-15, pasos 5-7 del diseño, sin parches): actor por documento
      (`escudos/cosmetico.sys.mjs` y `AegisEscudosChild.sys.mjs`) que para el análisis con `document.blockParsing`
      (tope de 1 s) hasta tener las reglas; hojas de usuario (`windowUtils`, `!important`; la genérica de cada capa,
      analizada una vez por proceso), invisibles en `document.styleSheets` y en el DOM; genéricas de clase e id con un
      `MutationObserver` agrupado desde DOMContentLoaded; procedurales propios (`escudos/procedural.sys.mjs`: el
      adblock-rust de Firefox, sin `css-validation`, no los separa); `generichide` y `$elemhide` (centinela del worker).
      Motor por capas (ABI 2: anuncios y rastreo, y una por grupo de molestias) para que cada grupo se permita por sitio
      sin recompilar. Recursos neutros y scriptlets de uBlock Origin 1.75.0 y Brave (`aegis.py recursos-escudos` →
      `escudos/recursos.json`, fijados con sha256 en `upstream.json`, nunca se descargan); `$redirect` a `data:` como
      WebRequest, con CORS, y cortado si la CSP de la página no admite `data:`; scriptlets con `compileScript` +
      `executeInGlobal` antes que la página; `trusted-*` solo de las listas de uBO. Respeta Escudos bajados, las
      excepciones por sitio y los grupos de molestias; con uBlock Origin activo se retira (la red sigue). Banco: caso
      «cosmetico» en `tools/pruebas/escudos.py` (huecos, `document.styleSheets`, genéricas dinámicas, `generichide`,
      procedural, `set-constant`, scriptlets de dos capas, recurso neutro con detector, CSP estricta y precarga,
      molestias apagadas, Escudos bajados, uBO simulado).
      - Medido (2026-10-15, build de Windows, `escudos_rendimiento.py --cosmetico`, página de 3000 elementos): con el
        equipo en reposo, DOMContentLoaded 81 ms frente a 66 sin cosmético (youtube.com 92/66, un sitio con reglas
        propias 103/73); el análisis parado, 13 ms por documento de media (20 el peor): 8 de espera al proceso
        principal (su cola; contestar le cuesta 0,7-1 ms), 4 de scriptlets (compilarlos la primera vez en cada
        proceso) y 0,7 de hojas. Con otra compilación en paralelo, todo cerca del doble (DOMContentLoaded 213/101,
        27 ms parados). Pendiente: no parar el análisis en los sitios sin scriptlets (diseño 2.4).
- [ ] **Icono del escudo con contador** (anuncios y rastreadores bloqueados en la página), panel por sitio,
      interruptor global, `about:preferences#escudos`.
- [~] **Huella digital** en cuatro niveles (Básica, Equilibrada de serie, Estricta y Caja fuerte con el uróboros) sobre
      la protección frente a la huella de Firefox: desplegable en el panel, tarjetas en Ajustes › Privacidad, permiso
      por sitio y aviso en Caja fuerte (`huella.sys.mjs`, `settings/prefs/42-huella.js`). Falta medirla con CreepJS,
      coveryourtracks y TZP (fase 6).
- [~] Anti-detección (listas anti-adblock y *redirect resources* hechos; límites en `docs/PRIVACIDAD.md`); pruebas
      (página local hecha; d3ward, canyoublockit, webs con detector); uBO opcional en la bienvenida; Google limpio
      (contenedor de búsqueda, enlaces directos, sin pings).
- [x] Bloqueo silencioso (2026-10-16, decisión del usuario: «silencioso + excepciones»). Lo que corta ETP, el motor
      o Google limpio recibe una respuesta neutra de su tipo (data:, nada sale a la red) en vez de un error de red:
      Firefox llama a `http-on-modify-request` desde `CancelByURLClassifier` y redirige si hay `redirectTo`. Las
      excepciones por sitio de las listas (`@@…$domain=`) también valen frente a ETP, solo en esas webs
      (`nsIChannelClassifierService` → `allow()`; `escudos/etp.sys.mjs`). Sin parches. Medido: 0 conexiones a lo
      bloqueado; 0 excepciones fuera de su web en 239 246 casos; banco 0 fallos (r13). Origen: work.ink detectaba el
      bloqueador porque ETP cortaba doubleverify.com y adligature.com, que uBO deja pasar allí.
- [ ] Límite conocido: las peticiones en modo CORS (fetch «cors», XMLHttpRequest a otro dominio) no admiten una
      respuesta data: en Firefox y se cortan con error (como uBO). Fuentes, objetos y websockets tampoco tienen
      respuesta neutra.
- [ ] Probar work.ink de verdad, a mano (con Marionette, Cloudflare pide el reto a cualquier navegador automatizado).
- **Hecho cuando:** bloquea como uBO en las pruebas, el contador cuadra con `MOZ_LOG` y las webs con detector no
  saltan → **0.7**.

## Fase 5 · Contraseñas → 0.8

- [x] Contraseña principal obligatoria al primer guardado (aviso de guardar, a mano, importar, contraseña generada) y
      bloqueo tras 10 min de inactividad y al cerrar (2026-10-13, `contrasenas.sys.mjs`, sin parches). Windows Hello
      **no** sustituye a la principal: Firefox solo lo usa para ver, copiar y editar, y no cifra `key4.db`; cifrar con
      DPAPI exigiría parchear NSS u OSKeyStore en C++.
- [x] **2026-10-20, decisión del usuario:** guardar ya no exige la contraseña principal (como Firefox); el panel y
      `about:logins` avisan sin ella, con «Crear contraseña principal». La siguen exigiendo pasar y recibir de otro Aegis
      y añadir un código de verificación. `aegis.contrasenas.principal_obligatoria` a true devuelve la regla de antes.
- [x] Interfaz cerrada (2026-10-13): ver, copiar y editar **con autenticación** (Windows Hello o la principal) en vez de
      quitarlos; sin exportar en claro (menú y `LoginExport`); sin rellenar solo, solo el sitio exacto, nunca en http
      ni solo en iframes de otro origen. Panel de la barra lateral y `about:logins` con el aspecto de Aegis.
- [ ] Código de transferencia de 6 palabras (paquete cifrado de un solo uso que caduca); importar desde otros navegadores.
- [x] KDF reforzado: PBKDF2-HMAC-SHA256 con 600 000 iteraciones (10 000 en Firefox) con la variable de NSS
      `NSS_MIN_MP_PBE_ITERATION_COUNT`, sin parche; Argon2id exigiría parchear NSS. Pruebas con Marionette (guardar,
      ver, copiar, bloquear, exportar, autorrelleno, iframe de otro origen, iteraciones en `key4.db`): 23 de 23.
- [ ] Exportación cifrada (para salir de Aegis sin un CSV en claro) y que la prueba «ninguna contraseña en claro desde
      la interfaz» corra sola en la CI.
- **Hecho cuando:** ninguna prueba consigue una contraseña en claro desde la interfaz → **0.8**.

## Fase 5b · Cuentas y nube → 0.85

Antes de empezar: las apps OAuth registradas (ver «Lo que tienes que hacer tú»).

- [ ] Perfiles con identidad (gestor de perfiles de Firefox), creación con Google, Microsoft o GitHub (OAuth con PKCE
      y loopback, permisos mínimos).
- [ ] Inicio de sesión sin fricción («Iniciar sesión con…» en modo estricto) y su batería de pruebas.
- [ ] Formato de sincronización: código de 24 palabras, AES-256-GCM, registros versionados y fusión.
- [ ] Proveedores: Google Drive (carpeta de la app), OneDrive (carpeta de la app), GitHub (repo privado mediante
      GitHub App).
- [ ] Pruebas: lo subido es ilegible y dos perfiles convergen.
- **Hecho cuando:** dos equipos sincronizan por los tres proveedores y lo subido no se puede leer → **0.85**.

## Fase 6 · Anonimato → 0.9

- [ ] `AegisProxyRouter` (filtro de canal por `userContextId`): perfiles SOCKS5, HTTP o Tor por espacio, DNS por el
      proxy, sumidero si el proxy cae, WebRTC solo por proxy.
- [~] Tor (2026-10-13): «Nueva ventana privada con Tor» (menú ☰, Ctrl+Mayús+U) como instancia aparte con perfil de
      usar y tirar (todas las ventanas privadas, proxy SOCKS de tor con DNS remoto, Caja fuerte, sin WebRTC, HTTP/3
      ni DoH); tor descargado aparte a petición (`aegis.py tor-fijar`, `tor/tor.json`), portado de Tor Browser
      (puerto de control, arranque, aislamiento por sitio), puentes obfs4 y Snowflake, «Nueva identidad». Probado:
      descarga y extracción, IsTor en la instancia y no en las ventanas normales ni privadas normales, DNS fuera de
      la caché del sistema, tor caído = sin red, tor y perfil fuera al cerrar. Falta: remoting de la segunda ventana
      probado con escritorio, Snowflake, `.onion`, `auditar-red.py` y la marca visual propia de la instancia.
- [ ] Instancia **Aegis anónimo** (perfil propio con RFP, letterboxing, Tor y nada en disco) con su acceso y su marca
      visual.
- [ ] Pruebas de fugas (check.torproject.org, sin DNS directo, sin WebRTC, `.onion`, tor se cierra con Aegis);
      `docs/PRIVACIDAD.md` con el aviso honesto.
- [ ] Huella digital (CreepJS, coveryourtracks, TZP) en modo normal y anónimo.
- **Hecho cuando:** ninguna prueba de fugas sale con la IP real ni con DNS directo → **0.9**.

## Fase 7 · Instalador y pulido de Windows → 1.0

**En paralelo desde la fase 3:**
- [ ] CI alojada en GitHub (gratis): `verificar.py`, lint y comprobación de parches; cron diario contra beta y
      release (`tools/nueva-version.py`).
- [ ] Runner autoalojado en el portátil (WSL) para las builds completas de Windows, con sccache.
- [ ] Instalador de Aegis v2: reparar, actualizar encima, desinstalar conservando o borrando el perfil; y zip portable.
- [ ] Integración con Windows: accesos del menú Inicio, registro como navegador (sin imponerse), desinstalador limpio
      (sin dejar perfil salvo que se pida), icono y VisualElements.

**Al final:**
- [ ] Actualizaciones: comprobación automática solo si se aceptó en la bienvenida; MAR parciales.
- [ ] PGO y LTO en Windows (PGO necesita ejecutar el navegador instrumentado: con wine o en Windows; valorarlo).
- **Sin firma de código (decidido el 2026-10-13).** Toda firma Authenticode reconocida por Windows (SignPath, Azure
  Trusted Signing, Microsoft Store) exige verificar la identidad del autor con un documento oficial, y la Tienda
  además retrasa cada versión con su revisión. Aegis se distribuye **sin firma**, solo por GitHub Releases. Lo que
  eso supone, y que hay que decir con claridad en la web de descarga:
  - **SmartScreen** avisa la primera vez que se abre el instalador descargado («Windows protegió tu PC» → «Más
    información» → «Ejecutar de todas formas»).
  - En equipos con el **Control inteligente de aplicaciones** activado, Windows bloquea Aegis sin opción de abrirlo
    (visto el 2026-10-11 con `Aegis Setup.exe` y con `firefox.exe`). No hay forma legítima de saltárselo desde Aegis.
  - Las **actualizaciones no cambian**: son MAR firmados con la clave propia de Aegis (`~/.config/aegis-firma`), gratis
    y sin esperas. Los archivos que escribe el updater no llevan la marca de «descargado de Internet», así que
    SmartScreen no vuelve a avisar. Medido el 2026-10-16 con el Control inteligente activado: ningún evento de
    CodeIntegrity en todo el flujo de actualización (los bloqueos de este equipo son de ejecutables en `%TEMP%`);
    opciones si en otro equipo bloqueara, en `docs/ACTUALIZACIONES.md`.
  - Builds nuevas en este equipo (que tiene el Control inteligente activado): se prueban en el Espacio aislado de
    Windows (`packaging/instalador/probar-en-sandbox.wsb`). Los cambios de prefs, estilos y código del overlay, en la
    copia de desarrollo, que arranca con un ejecutable ya aceptado.
- [ ] Si Defender marca una versión como sospechosa (falso positivo habitual en ejecutables sin firma), enviarla a
      Microsoft como falso positivo (formulario de envío de archivos de Microsoft Security Intelligence).
- [x] ~~Microsoft Store~~: descartada (identidad con documento oficial y revisión lenta de cada versión). Queda
      `aegis.py msix` y `docs/TIENDA.md` por si algún día cambia; no se usan.
- [~] Bienvenida final: idioma y apariencia, modo, conexiones, importar (Chrome, Edge, Brave, Firefox), Escudos y uBO.
      2026-10-19: `about:bienvenida` con las preguntas de Aegis Setup (modo, Escudos, buscador y apariencia, mismo
      aspecto y mismas funciones), solo cuando no hay archivo del instalador (Microsoft Store, zip) y antes de
      `about:conexiones` (`docs/INSTALADOR.md`, «Sin el instalador: la bienvenida del navegador»). Faltan idioma,
      importar y uBO.
- [ ] Repaso completo en Windows 10 y 11: todas las pruebas, los cinco revisores, `NOTICE.md`, licencias.
- [ ] **1.0 para Windows** publicada en GitHub Releases.

## Después de la 1.0 para Windows (en este orden)

1. **SecretOS (Linux, Arch con linux-zen).** Build `linux-x86_64` (ya preparada en `aegis.py` y en los mozconfigs),
   tarball, paquete AUR (`aegis-bin`) y opción «Navegador: Brave o Aegis» en SecretOS, con los colores de
   `secretos-colores`. Más tarde, Flatpak y AppImage para el resto de distribuciones.
2. **Android.** Proyecto aparte sobre Fenix (Firefox para Android) y GeckoView, con el mismo enfoque de soft fork.
   Referencia: IronFox (fork de Fenix centrado en la privacidad). Necesitará su propio plan.
3. Más adelante: macOS (necesita un Mac o CI de macOS y la cuenta de Apple Developer, 99 $/año); Arti en lugar de
   tor; ventana anónima dentro del mismo perfil.

## Lo que tienes que hacer tú (ni servidores ni código)

| Cuándo | Qué | Coste |
|---|---|---|
| Fase 0 | Repositorio **privado** `Aegis-Private` para el código (GitHub CLI ya con sesión) y uno **público** para publicar | Gratis |
| Fase 1 | Buscar «Aegis» en EUIPO y USPTO (clase 9). Si choca, elegir otro nombre (solo cambia `marca.json`) | Gratis |
| Antes de la fase 4 | Opcional: dominio propio para la web del proyecto y `update.xml` (si no, GitHub Pages) | 10–15 €/año |
| Antes de la fase 5b | Registrar las apps OAuth: Google Cloud (pantalla de consentimiento y verificación), Microsoft Entra (app pública), GitHub App | Gratis |
| Antes de la fase 7 | Opcional: clave de Google Safe Browsing (uso no comercial) | Gratis |
| **Ya** | Copiar `~/.config/aegis-firma/` de WSL (claves de firma de las actualizaciones) a un USB cifrado | — |
| **Ya** | Confirmar el repositorio público donde se publica (`branding/marca.json`: `MrSecret-Official/Aegis`) | Gratis |
