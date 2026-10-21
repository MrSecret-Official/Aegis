# Aegis

Un navegador privado, limpio y rápido, basado en el código de Mozilla Firefox (Gecko).

> **Estado: en desarrollo (fase 0).** Todavía no hay versión para descargar. El plan está en
> [docs/PLAN.md](docs/PLAN.md) y el calendario en [docs/PLANNING.md](docs/PLANNING.md).

## Qué será Aegis

- **Sin telemetría.** No envía datos de uso, ni estudios, ni informes de fallos. Al abrirlo por primera
  vez no se conecta a nada hasta que tú lo decides, y cada conexión que hace está listada en
  [docs/CONEXIONES.md](docs/CONEXIONES.md) y se puede apagar.
- **Dos modos de uso**, que se cambian cuando quieras sin perder nada:
  - **Estándar:** pestañas arriba, una sola barra y una barra de favoritos discreta.
  - **Workflow:** pestañas verticales, espacios (cada uno con su contenedor y su proxy), modo compacto,
    vista dividida y abrir enlaces por encima de la página.
- **Escudos:** bloqueador de anuncios y rastreadores integrado, con listas de uBlock Origin, AdGuard,
  Brave y EasyList. Está en la barra de direcciones con un contador, se apaga por sitio o del todo y
  procura que las webs no lo detecten.
- **Anonimato:** protección contra la huella digital, contenedores, proxy por espacio y una ventana
  anónima por la red Tor. Aegis anónimo **no es Tor Browser**: si tu seguridad depende de ello, usa
  Tor Browser.
- **Contraseñas en tu equipo:** se guardan cifradas y sin exportación en claro; con contraseña principal, quien copie
  tu perfil no puede leerlas. Solo salen a otro Aegis con un código de un solo uso.
- **Tu nube, cifrada:** perfiles con Google, Microsoft o GitHub y sincronización cifrada de extremo a
  extremo en tu Google Drive, OneDrive o un repositorio privado de GitHub. No hay servidores de Aegis.
- **Se actualiza solo:** las versiones nuevas llegan firmadas desde GitHub Releases; la comprobación no envía
  ningún dato del equipo ([docs/ACTUALIZACIONES.md](docs/ACTUALIZACIONES.md)).
- **Ligero:** lo justo para funcionar, sin servicios de fondo, y fluido.
- **Aspecto:** monocromo y sobrio, en claro y en oscuro, con la tipografía Inter.
- **Instalador propio**, con el mismo cuidado que el navegador ([docs/INSTALADOR.md](docs/INSTALADOR.md)).

Plataformas, en este orden: **Windows**, después Linux (empezando por SecretOS) y Android. macOS, más adelante.

## Construir

Se compila en Linux; la versión de Windows, en cruzado desde Linux (en Windows, dentro de WSL con la distribución
`archlinux`), sin instalar Visual Studio. Hacen falta unos 60 GB libres y 24 GB de RAM para WSL (32 GB en el equipo).

```bash
# Desde Windows (PowerShell), cada paso:
wsl -d archlinux -u root -- bash /mnt/c/<ruta>/Aegis/tools/build-wsl.sh fetch      # fuente de Firefox, verificada
wsl -d archlinux -u root -- bash /mnt/c/<ruta>/Aegis/tools/build-wsl.sh prepare    # árbol + parches + overlay
wsl -d archlinux -u root -- bash /mnt/c/<ruta>/Aegis/tools/build-wsl.sh bootstrap  # compiladores de Mozilla
wsl -d archlinux -u root -- bash /mnt/c/<ruta>/Aegis/tools/build-wsl.sh build

# En Linux, directamente:
python3 tools/aegis.py fetch && python3 tools/aegis.py prepare
python3 tools/aegis.py bootstrap && python3 tools/aegis.py build && python3 tools/aegis.py run
```

`tools/aegis.py --help` muestra todas las órdenes. Detalles en [docs/GUIA.md](docs/GUIA.md).

## Cómo está hecho

Aegis es un *soft fork*: parte de la fuente oficial de Firefox Release de cada mes, le aplica una serie
corta de parches (`patches/`) y le añade su propio código (`overlay/`). Así recibe las correcciones de
seguridad de Mozilla en días, no en meses.

## Licencia

Código de Aegis: [MPL-2.0](https://www.mozilla.org/MPL/2.0/), la misma que Firefox. Incluye partes
derivadas de Zen Browser y de Tor Browser (MPL-2.0); las listas de filtros y uBlock Origin conservan sus
licencias. Detalle en `NOTICE.md`.

Aegis no está afiliado a Mozilla. Firefox es una marca de la Fundación Mozilla.
