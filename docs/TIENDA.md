# Aegis en la Microsoft Store

> **Retomada (2026-10-17).** Se descartó el 2026-10-13 (verificación de identidad y revisión de cada versión), pero
> sin firma el Control inteligente bloquea Aegis cuando quiere: el 2026-10-17 la misma `xul.dll` que había cargado a
> la 01:00 se bloqueó desde las 11:49 en cualquier copia nueva, también la que dejó `Aegis Setup.exe`
> (0xc0e90002). El usuario se registra en Partner Center; la Tienda firma el MSIX y es la vía para quien tenga el
> Control inteligente. GitHub Releases (instalador y MAR) sigue para el resto, sin firma.
>
> **Estado (2026-10-17):** `aegis.py msix --prueba` funciona con Firefox 158 y la identidad propia de Aegis; el paquete
> se instala y se desinstala bien en el Espacio aislado. **Solo faltan los datos de identidad de Partner Center**
> (paso 3). Resultados en `out/pruebas/2026-10-17-msix/`.

Windows 11 trae el **Control inteligente de aplicaciones**, que bloquea sin preguntar los programas sin una firma
reconocida (le pasó a `Aegis Setup.exe` el 2026-10-11). Una firma de código propia cuesta dinero o meses de trámites.
La Microsoft Store es la vía gratuita: **la Tienda firma el paquete** al publicarlo, Windows se fía de él y además lo
actualiza solo.

- Registrarse como desarrollador individual es **gratis**.
- Lo que se sube es un paquete **MSIX** (el formato de la Tienda), que genera `aegis.py msix` desde la build de
  Windows. No hace falta Visual Studio ni nada en Windows: todo sale de WSL.
- Sin servidores: el paquete va a la Tienda de Microsoft y las demás descargas siguen en GitHub Releases.

## Resumen

| Paso | Quién | Dónde |
|---|---|---|
| 1. Registrarte en Partner Center como individual | tú | navegador |
| 2. Reservar el nombre de la app | tú | Partner Center |
| 3. Copiar los datos de identidad a `branding/marca.json` | tú (o me los pasas) | el repo |
| 4. Generar el `.msix` | `aegis.py msix` | WSL |
| 5. Primer envío con **audiencia privada** y subir el paquete | tú | Partner Center |
| 6. Esperar la certificación (normalmente de 1 a 3 días) | Microsoft | — |
| 7. Instalarlo desde la Tienda en tu equipo y probarlo (ver «La primera prueba de verdad») | tú | este Windows |
| 8. Cuando todo esté bien: un envío nuevo con audiencia **pública** | tú | Partner Center |

## 1. Registrarte en Partner Center

1. Entra en <https://storedeveloper.microsoft.com> (si la dirección cambia, busca «Microsoft Store developer
   registration»). Inicia sesión con tu **cuenta Microsoft** (la de Outlook o Hotmail sirve).
2. Elige el tipo de cuenta **Individual** (persona física). Es gratis.
3. Rellena tu nombre, país y datos de contacto. Microsoft puede pedirte que **verifiques tu identidad** con un
   documento y una foto. Es normal y no cuesta nada. Puede tardar unos días.
4. El **nombre de editor** (*Publisher display name*) es el que verá la gente debajo de «Aegis» en la Tienda. Elige
   uno con el que te sientas a gusto (tu nombre o un alias como «MrSecret»). Se puede cambiar más tarde.
5. Al terminar entras en el panel: <https://partner.microsoft.com/dashboard>.

## 2. Reservar el nombre

1. En el panel: **Aplicaciones y juegos → Nueva aplicación** (o «+ Nuevo producto → Aplicación MSIX o PWA»).
   Elige **MSIX o PWA**, no «EXE o MSI»: el paquete de Aegis es un MSIX.
2. Escribe **Aegis** y pulsa «Comprobar disponibilidad». Si está libre, resérvalo.
3. Si «Aegis» está cogido (es probable: es un nombre corto), prueba en este orden:
   - `Aegis Browser`
   - `Aegis Navegador`
   - `Aegis Private Browser`
   - `Aegis Web`

   El nombre reservado es el de la ficha de la Tienda. En el menú Inicio y en la barra de tareas Aegis se sigue
   llamando «Aegis».
4. La reserva dura 3 meses: si en ese tiempo no publicas, caduca y hay que volver a reservar.

## 3. Copiar los datos de identidad

En Partner Center, abre tu app → **Gestión de productos → Identidad del producto** (*Product management → Product
identity*). Verás algo así:

```
Package/Identity/Name                     12345MrSecret.Aegis
Package/Identity/Publisher                CN=1A2B3C4D-5E6F-7A8B-9C0D-1E2F3A4B5C6D
Package/Properties/PublisherDisplayName   MrSecret
```

Abre `branding/marca.json`. En la sección `tienda` hay cuatro líneas con esos mismos nombres; ahora tres dicen
`PENDIENTE`. Cambia cada `PENDIENTE` por el valor de Partner Center, **copiado tal cual** (mayúsculas, puntos y el
`CN=` incluidos). En `Package/Properties/DisplayName` va el nombre que reservaste en el paso 2 (si fue «Aegis», ya
está puesto). La línea `_ayuda` se queda como está.

```json
"tienda": {
  "_ayuda": "…(no se toca)…",
  "Package/Identity/Name": "12345MrSecret.Aegis",
  "Package/Identity/Publisher": "CN=1A2B3C4D-5E6F-7A8B-9C0D-1E2F3A4B5C6D",
  "Package/Properties/PublisherDisplayName": "MrSecret",
  "Package/Properties/DisplayName": "Aegis"
}
```

| Línea de `marca.json` | Qué es | Dónde acaba |
|---|---|---|
| `Package/Identity/Name` | el nombre interno del paquete (lo da Microsoft) | `<Identity Name=…>` del `AppxManifest.xml` |
| `Package/Identity/Publisher` | tu identificador de editor (`CN=` y un código) | `<Identity Publisher=…>` |
| `Package/Properties/PublisherDisplayName` | el nombre de editor que ve la gente | `<PublisherDisplayName>` |
| `Package/Properties/DisplayName` | el nombre reservado | `<DisplayName>` |

Si uno no coincide exactamente, Partner Center rechaza el paquete al subirlo (paso 5) y dice cuál.

Para comprobarlo: `python tools/verificar.py` revisa la forma de cada valor y `aegis.py estado` dice «identidad
completa» cuando ya no queda ningún `PENDIENTE`. Mientras quede alguno, `aegis.py msix` se niega a hacer el paquete
para subir (solo hace paquetes de prueba). Si prefieres no tocar el archivo, pásame los tres valores y lo hago yo.

## 4. Generar el paquete

Con los datos ya en `marca.json`, desde Git Bash en Windows (cada orden espera a que acabe la anterior; las tres usan
el cerrojo de `build-wsl.sh`, así que no se pisan con otra orden de Aegis):

```sh
export MSYS_NO_PATHCONV=1
wsl.exe -d archlinux -u root -- bash /mnt/c/<ruta del repo>/tools/build-wsl.sh build      # build completa
wsl.exe -d archlinux -u root -- bash /mnt/c/<ruta del repo>/tools/build-wsl.sh package    # el zip
wsl.exe -d archlinux -u root -- bash /mnt/c/<ruta del repo>/tools/build-wsl.sh msix       # el .msix
```

(Desde PowerShell, lo mismo sin la línea `export`.) El registro de cada una queda en `~/aegis/registro/<orden>.log` de
WSL.

El paquete queda en `\\wsl.localhost\archlinux\home\aegis\aegis\salida\aegis-<versión>-x64.msix` (unos 145 MB; para
158.0-1, `aegis-158.0-1-x64.msix`). **No va firmado**: lo firma la Tienda. No se instala con doble clic.

- `msix` toma el **último zip** de `package`. Para un envío, que sea el de una build completa (no `build --rapido`)
  y el mismo que se publica en GitHub Releases en esa versión.
- **Fase 0:** mientras `docs/CONEXIONES.md` lleve el aviso de la fase 0, `msix` exige `--privado`. El 2026-10-17 ya no
  lo lleva, así que no hace falta; aun así, el **primer envío conviene hacerlo con audiencia privada** (paso 5).
- `msix` también se niega si la marca aún lleva recursos de Firefox Nightly que se verían en el paquete. El
  2026-10-17 no queda ninguno.

### Opciones

| Orden | Qué hace |
|---|---|
| `msix` | Paquete para subir, sin firmar, en `salida/`. Exige la identidad completa |
| `msix --privado` | Igual; obligatorio solo mientras dure el aviso de la fase 0 (el envío será con audiencia privada) |
| `msix --prueba` | Con la identidad provisional si hace falta, en `salida/pruebas/`. Sin firmar: solo para revisarlo |
| `msix --firma-local` | Como `--prueba` y firmado con el certificado de pruebas de `~/.config/aegis-firma/` (ver «Probar sin la Tienda») |

### Si algo falla

| Código | Qué pasa | Qué hacer |
|---|---|---|
| 2 | La identidad de `marca.json` aún dice `PENDIENTE` | Paso 3, o `--prueba` para probar |
| 2 | Fase 0 sin `--privado` | Añade `--privado` y haz el envío con audiencia privada |
| 2 | La marca lleva recursos de Nightly | Terminar la marca antes de subir |
| 2 | Los assets del árbol no son los de `overlay/` | `build-wsl.sh overlay` y repetir |
| 2 | No hay paquete | `build-wsl.sh package` y repetir |
| 3 | `makemsix` no tiene las sumas fijadas | Ver «Cómo se hace el paquete» › herramienta |
| 3 | La plantilla de Firefox ha cambiado | Pasa al cambiar de versión de Firefox: revisar `ajustar_manifiesto()` en `aegis.py` |
| 3 | El paquete no pasa las comprobaciones | El mensaje dice cuál; no se deja ningún `.msix` a medias |
| 1 | Otro fallo (mach, openssl, disco) | El mensaje lo dice; el registro está en `~/aegis/registro/msix.log` |
| 1 | «ya hay otra orden de Aegis en marcha» | Otra orden usa WSL: espera a que acabe y repite |

## 5. Crear el envío

En Partner Center, tu app → **Iniciar el envío**. Cada apartado:

### Precios y disponibilidad
- **Precio:** gratis.
- **Mercados:** todos (o los que quieras).
- **Visibilidad:** el primer envío, **audiencia privada** (*Private audience*): solo la ven las cuentas Microsoft que
  añadas, por ejemplo la tuya. Así se prueba el paquete firmado por la Tienda antes de que lo vea nadie (paso 7).
  Cuando esté bien, un envío nuevo con visibilidad **pública**.

### Propiedades
- **Categoría:** *Productividad* (o *Utilidades y herramientas*).
- **Política de privacidad:** obligatoria para un navegador. Es la de la web del proyecto en GitHub Pages,
  `https://mrsecret-official.github.io/Aegis/privacidad/` (en inglés, `https://mrsecret-official.github.io/Aegis/en/privacy/`).
  Su fuente está en `web/` y se publica como dice `web/LEEME.md`; tiene que estar publicada antes del envío.
- **Web y soporte:** la web del proyecto, `https://mrsecret-official.github.io/Aegis/`, y el correo de contacto
  `mrsecret_official@protonmail.com`.
- **Requisitos del sistema:** teclado y ratón, Windows 10 1809 o posterior, x64.

### Clasificación por edades
Un cuestionario (IARC) de unos minutos. Responde con la verdad: es un **navegador web**, así que permite el acceso
sin restricciones a internet. La clasificación sale sola y es la misma que la de los demás navegadores.

### Paquetes
Arrastra el `.msix` de `salida/`. Partner Center lo valida al momento: si la identidad no coincide, lo dice aquí.
- El paquete declara los **seis idiomas** de la interfaz (`en-US`, `de`, `es-ES`, `fr`, `it`, `pt-BR`): la build es
  multi-idioma desde el 2026-10-20 (`docs/GUIA.md`, «Construir» › «Idiomas») y `aegis.py msix` los pone en
  `<Resources>` del `AppxManifest.xml`. Aegis usa el idioma de Windows (`intl.locale.requested=""` en
  `packaging/msix/distribution.ini`). La ficha de la Tienda se puede escribir en esos idiomas.

### Ficha de la Tienda (al menos en español y en inglés)
- **Descripción:** puedes partir del principio de `README.md`. Honesta: Aegis no es Tor Browser y el bloqueador no es
  invisible al 100 % (docs/GUIA.md, principio 5). Sin «Firefox» ni «Mozilla» en el nombre ni en los iconos; en la
  descripción sí se puede decir «basado en el código de Mozilla Firefox».
- **Capturas:** al menos una, de 1366 × 768 o más (PNG). Mejor 3 o 4: modo Estándar, modo Workflow, Escudos y Ajustes.
- **Logotipo de la Tienda:** opcional; si no se sube, usa el del paquete (el fantasma).

### Opciones del envío: la capacidad `runFullTrust`
Aegis es una aplicación de escritorio completa (Win32) dentro de un MSIX, así que declara la capacidad restringida
`runFullTrust`, como Firefox y los demás navegadores de la Tienda. Partner Center pide justificarla en **Opciones del
envío → Capacidades restringidas** (y, si quieres, también en **Notas para la certificación**). Texto para pegar (en
inglés, que es lo que leen los revisores):

> Aegis is a desktop web browser built from the Firefox (Gecko) source code and packaged as a full-trust Win32
> application with MSIX. It needs runFullTrust because the browser is a native Win32 program: it starts its own
> sandboxed child processes (content, GPU, networking and utility processes), registers as a handler for http/https
> links and .html/.pdf files when the user chooses it, and shows native Windows notifications. Without full trust the
> browser cannot start. Aegis installs no drivers or services, does not start with Windows unless the user turns that
> on, and sends no telemetry.

En español, para ti: «Aegis es un navegador de escritorio hecho con el código de Firefox. Necesita confianza total
porque es un programa Win32: abre sus propios procesos aislados, se registra para abrir enlaces y archivos si el
usuario lo elige y muestra notificaciones de Windows. Sin ella no arranca. No instala controladores ni servicios, no
arranca con Windows salvo que el usuario lo active y no envía telemetría.»

### Enviar
Pulsa **Enviar a la Tienda**. La certificación suele tardar de 1 a 3 días; si la rechazan, el informe dice por qué
(pásamelo y lo arreglamos).

## La primera prueba de verdad (paso 7)

Un paquete firmado por nosotros no sirve para probar en este equipo: el Control inteligente lo bloquea igual que al
instalador (comprobado el 2026-10-17, ver «Probar sin la Tienda»). La única prueba completa es la del paquete que firma
la Tienda:

1. Con el envío de audiencia privada ya publicado, Partner Center te da un **enlace a la ficha** (Gestión de producto
   → Identidad del producto, «URL de la Tienda»). Ábrelo con la cuenta Microsoft que añadiste a la audiencia.
2. **Obtener** → se instala como cualquier app de la Tienda.
3. Abre Aegis desde el menú Inicio y comprueba:
   - que arranca (si el Control inteligente lo bloqueara, Windows lo diría con un aviso: pásame el mensaje);
   - que sale la bienvenida (`about:bienvenida`: modo, Escudos, buscador y apariencia, como en Aegis Setup) y, al
     terminarla, `about:conexiones` (`docs/INSTALADOR.md`, «Sin el instalador: la bienvenida del navegador»);
   - que «Acerca de» **no** busca actualizaciones (ver «Actualizaciones» más abajo);
   - que en `about:conexiones` todo está como en la versión de GitHub.
4. Si va bien, haz el envío público (paso 8).

## Actualizaciones: dos canales que conviven

| | Microsoft Store | Descarga directa (GitHub Releases) |
|---|---|---|
| Paquete | `.msix` (firmado por la Tienda) | zip / Aegis Setup |
| Quién actualiza | la Tienda (Windows), sola | el updater de Aegis con los MAR firmados (`docs/ACTUALIZACIONES.md`) |
| Cuándo llega una versión | cuando Microsoft certifica el envío (de 1 a 3 días después) | en cuanto se publica |
| Control inteligente de aplicaciones | pasa (firma de Microsoft) | puede bloquearlo (sin firma Authenticode) |
| Perfil | dentro de la carpeta de la app (ver abajo) | `%APPDATA%\Aegis` y `%LOCALAPPDATA%\Aegis` |
| Primeras preguntas (modo, Escudos, buscador, apariencia) | la bienvenida del navegador (`about:bienvenida`) | el asistente de Aegis Setup; con el zip, la bienvenida |

- **Dentro del paquete de la Tienda, el updater de Aegis se apaga solo.** Es lo que hace Firefox: al arrancar con
  identidad de paquete de Windows, `Services.sysinfo` dice `isPackagedApp` y:
  - el servicio de actualizaciones se da por desactivado (`UpdateServiceStub.updateDisabled`), así que las
    comprobaciones de cada día y la que lanza `about:conexiones` al aceptar «Actualizaciones de Aegis»
    (`checkForBackgroundUpdates`) no hacen nada: no se pide `update.xml` a GitHub ni se descarga ningún MAR;
  - «Buscar actualizaciones» en «Acerca de» (`AppUpdater`) se queda en «sin actualizador» antes de mirar nada;
  - Ajustes no muestra la sección de actualizaciones (`about-firefox.mjs`, `privacy.mjs`).

  No hace falta ninguna pref ni ningún parche. Revisado en el código de Firefox 158 el 2026-10-17. **Pendiente:** con el
  parche `0400-privacidad/0003`, «Acerca de» enseña el botón «Buscar actualizaciones» si no se han aceptado las
  automáticas, también en el paquete (Firefox no lo enseña ahí). Pulsarlo no conecta (se queda en «sin
  actualizador»), pero sobra: el arreglo es añadir `Services.sysinfo.getProperty("isPackagedApp") ||` a la condición
  del parche en `aboutDialog-appUpdater.js`. En `about:conexiones`, el grupo «Actualizaciones de Aegis» tampoco hace
  nada en el paquete; se podría ocultar ahí.
- **Las actualizaciones de la Tienda las hace Windows, no Aegis**: es el servicio de la Microsoft Store el que habla
  con Microsoft, como con cualquier otra app instalada desde la Tienda (Microsoft sabe qué cuenta ha instalado Aegis).
  Aegis no hace ninguna conexión nueva por ir en un paquete:
  - en el paquete, Firefox pregunta a la Tienda por la «campaña» con la que se instaló (atribución:
    `AttributionCode.msixCampaignId()` → `nsWindowsPackageManager::CampaignId` → `StoreContext`, con la cuenta
    Microsoft del usuario). Lo lanza `TelemetryStartup` en **cada arranque** (`profile-after-change` →
    `TelemetryEnvironment` → `EnvironmentCache._loadAttributionAsync`), sin mirar ninguna pref, así que pasaría antes
    de la bienvenida aunque la telemetría esté apagada. El parche `0400-privacidad/0005-sin-atribucion-msix` lo corta
    en su único punto de paso: `msixCampaignId()` devuelve `""` sin preguntar a nadie;
  - el paquete no lleva la tarea en segundo plano de Firefox ni su servidor COM (ver «Cómo se hace el paquete»).
- **Cada versión se publica en los dos canales:** `build` → `package` → `mar` → `publicar` (GitHub) y además `msix` →
  un envío nuevo en Partner Center con el `.msix` nuevo (el mismo zip). La Tienda va uno o dos días por detrás de
  GitHub, también en las correcciones de seguridad urgentes: la certificación no se puede saltar.
- **Versión del paquete:** la Tienda exige cuatro números y que cada envío suba la versión. `aegis.py` la calcula de
  `upstream.json`: `<mayor>.<menor>.<parche × 100 + revisión>.0`. `157.0.1-1` → `157.0.101.0`; `157.0.1-2` →
  `157.0.102.0`; `158.0-1` → `158.0.1.0`. El último número siempre es 0 (lo reserva la Tienda).
- **Son dos apps distintas.** Pueden estar a la vez en el mismo equipo, pero es mejor usar solo una:
  - no comparten perfil. En un paquete, Windows guarda lo que la app escribe en `AppData` dentro de su propia carpeta
    (`%LOCALAPPDATA%\Packages\<nombre del paquete>\LocalCache\…`), así que el Aegis de la Tienda empieza con un perfil
    vacío aunque haya uno de la versión de GitHub. Esto dice la documentación de Microsoft y es lo que hace Firefox;
    en la prueba del 2026-10-17 no se pudo ver porque Aegis no llegó a arrancar (ver abajo);
  - **al desinstalar el Aegis de la Tienda, Windows borra también su perfil** (marcadores, contraseñas…). Conviene
    decirlo en la ficha y en la ayuda;
  - pasar de la versión de GitHub a la de la Tienda no es automático: se instala la de la Tienda, se llevan los datos
    (exportar e importar) y se desinstala la otra.

## Probar sin la Tienda

### En el Espacio aislado (lo que se hizo el 2026-10-17)

Banco en `out/pruebas/2026-10-17-msix/banco/` y resultados en `out/pruebas/2026-10-17-msix/`:

1. `build-wsl.sh msix --prueba` (identidad provisional `PENDIENTE`): correcto en 35 s; 145 MB; plantilla, `msix.py` y
   makemsix de Firefox 158 iguales que en 157; las comprobaciones de `aegis.py` pasan (identidad, versión `158.0.1.0`,
   ejecutable, los 11 assets, `distribution.ini` propio, sin el cargador de desarrollo, `makemsix unpack` entero).
2. Una **copia** firmada con un certificado desechable (`CN=PENDIENTE`, creado y borrado en `/tmp` de WSL; no se usa
   `~/.config/aegis-firma`), solo para instalarla dentro del Espacio aislado (`banco/firmar-copia.sh`).
3. Espacio aislado **sin red** (`banco/probar-msix.wsb`), con un script (`banco/probar-msix.ps1`) que confía en ese
   certificado solo ahí dentro, instala con `Add-AppxPackage`, intenta abrir Aegis, recoge registros y desinstala.

Resultado:
- **Bien:** se instala en 4,8 s en `C:\Program Files\WindowsApps\…`; aparece «Aegis» en Inicio; el alias de la línea
  de órdenes es `aegis.exe` (no `firefox.exe`); `application.ini` (`Vendor=Aegis`, `Profile=Aegis`,
  `RemotingName=aegis`) y `distribution.ini` son los de Aegis; se desinstala sin dejar nada.
- **No arranca:** el Espacio aislado también tiene el **Control inteligente activado** (hereda el de este equipo) y
  bloquea `firefox.exe` porque la firma desechable no es de una entidad reconocida (CodeIntegrity 3033/3077, «did not
  meet the Enterprise signing level requirements»). Es lo esperado y no dice nada del paquete de la Tienda, que va
  firmado por Microsoft. Por eso no se pudo comprobar en marcha que el updater se apaga (está comprobado en el código,
  arriba) ni dónde queda el perfil: se verá en el paso 7.
- Ojo: el comentario de `packaging/instalador/probar-en-sandbox.wsb` («dentro del espacio aislado no actúa el Control
  inteligente») ya no vale en este equipo.

### En tu equipo con `--firma-local` (no sirve con el Control inteligente)

`build-wsl.sh msix --firma-local` firma el paquete con un certificado de pruebas («CN=Aegis Pruebas Locales») que
guarda en `~/.config/aegis-firma/` de WSL (ya existe desde el 2026-10-11; el `.pfx` va sin contraseña porque makemsix no
las admite, con permisos 600) y deja en `\\wsl.localhost\archlinux\home\aegis\aegis\salida\pruebas\` el paquete
(`aegis-<versión>-x64-prueba.msix`) y el certificado público (`aegis-msix-prueba.cer`). Para instalarlo habría que
poner ese certificado en **Personas de confianza** del equipo (como administrador) y luego abrir el `.msix`.

**Con el Control inteligente activado no vale:** Windows bloquea el `firefox.exe` del paquete igual que en el Espacio
aislado. Solo tiene sentido en un equipo sin el Control inteligente, y aun así hay que quitar el certificado al
terminar, porque mientras esté en «Personas de confianza» Windows se fía de cualquier paquete firmado con su clave:

```powershell
Get-ChildItem Cert:\LocalMachine\TrustedPeople | Where-Object Subject -eq "CN=Aegis Pruebas Locales" | Remove-Item
```

El paquete de pruebas tiene otro editor que el de la Tienda: Windows los trata como dos apps distintas.

## Qué falta para el definitivo

1. ~~**Tú:** registro en Partner Center, reservar el nombre y copiar los tres datos de identidad~~ — hecho el
   2026-10-17: «Aegis Browser» (Store ID 9P68GV1KD9XH), editor «Secret Studios», identidad en `branding/marca.json`.
2. ~~Build completa, `package` y `msix`~~ — hecho el 2026-10-17: `aegis-158.0-1-x64.msix` (sha256 `164ec61a…16c160c`,
   con el Windows App SDK y Mica apagados), aprobado por `guardian-estabilidad` y `auditor-privacidad`.
3. Primer envío con audiencia privada, certificación e instalación desde la Tienda en este equipo (pasos 5 a 7): ahí se
   comprueba por fin que arranca con el Control inteligente, que el updater queda apagado y dónde va el perfil.
4. Recomendado antes del envío público:
   - el arreglo del botón «Buscar actualizaciones» en «Acerca de» dentro del paquete (ver «Actualizaciones»);
   - que `verificar.py` vuelva a avisar si la identidad sigue en `PENDIENTE` (desde el 2026-10-13 no lo hace);
   - ~~la build multilingüe, para que el paquete no declare solo inglés~~ (hecho el 2026-10-20: declara los seis);
   - decir en la ficha que desinstalar borra los datos del perfil que guarda la versión de la Tienda.
5. La web de privacidad publicada en `https://mrsecret-official.github.io/Aegis/privacidad/` (la ficha la enlaza;
   ver `web/LEEME.md`).

## Cómo se hace el paquete (técnico)

`aegis.py msix` (en `tools/aegis.py`, sección «Microsoft Store (MSIX)»):

1. Comprueba la identidad de `marca.json`, la fase 0, la marca, que el zip de `package` no lleve el cargador de
   desarrollo y sea el multi-idioma (los seis idiomas y la marca de Aegis en todos), y que los assets del árbol sean
   los de `overlay/`.
2. Llama a **`mach repackage msix`** de Firefox (`python/mozbuild/mozbuild/repackaging/msix.py`) con `--input <zip>`,
   `--channel unofficial`, `--arch x86_64`, `--identity-name Aegis`, `--vendor Aegis`, `--publisher`,
   `--publisher-display-name` y `--version`. mach prepara la carpeta del paquete: el navegador en
   `VFS/ProgramFiles/Aegis Package Root/`, `Assets/` (de `browser/branding/aegis/msix/Assets`, que elige por el
   `--with-branding` de la build), `Resources.pri` y el `AppxManifest.xml` de su plantilla
   (`browser/installer/windows/msix/`). Como `--makeappx` recibe un sustituto que no empaqueta: solo apunta dónde
   quedó esa carpeta.
3. Ajusta el `AppxManifest.xml` (cada cambio tiene que encontrarse exactamente una vez; si no, código 3):
   - `Identity Name` y `Publisher` exactos de Partner Center (mach compondría «Aegis.Aegis»);
   - `DisplayName` = el nombre reservado; `PublisherDisplayName`;
   - `BackgroundColor` = la loseta del icono (`#0a0a0b`, leída de `branding/icono/aegis.svg`), no el violeta de
     Firefox;
   - el alias de la línea de órdenes, `aegis.exe` en lugar de `firefox.exe` (chocaría con el Firefox de la Tienda);
   - los idiomas (`<Resources>`): los seis de la build. mach solo declararía en-US y los de los paquetes de idioma de
     `distribution/`, que Aegis no usa (los de addons.mozilla.org traen la marca de Firefox); cada uno se comprueba
     contra la lista de idiomas que admite Windows (`msix-all-locales` de Firefox);
   - **fuera** la tarea en segundo plano con temporizador (`windows.backgroundTasks`, la del agente del navegador
     predeterminado, que Aegis no compila: `--disable-default-browser-agent`) y su servidor COM
     (`msixcomserver.dll`, que el zip no lleva). Nada de trabajo en reposo (docs/GUIA.md, principio 4).
   - Se quedan, como en Firefox: el servidor de notificaciones (`notificationserver.dll`, que el zip sí lleva), el
     arranque con Windows (`windows.startupTask`, **apagado** de serie: solo si el usuario lo activa), los tipos de
     archivo y protocolos (solo actúan si el usuario elige Aegis como navegador) y las interfaces de accesibilidad.
4. Cambia `distribution/distribution.ini` (el de Firefox dice `mozilla-MSIX` y pone un texto de Mozilla en «Acerca
   de») por `packaging/msix/distribution.ini` (`aegis-msix`, sin texto; idioma de Windows, como en Firefox).
5. Empaqueta con **makemsix** (`makemsix pack`), firma si es `--firma-local` (`makemsix sign`) y comprueba el
   resultado: archivos del formato, identidad, versión, idiomas, ejecutable, los 11 assets idénticos a los de
   `overlay/`, la distribución y, al final, `makemsix unpack` lo desempaqueta entero comprobando el hash de cada archivo (y la firma).
   Todo en un `.parcial` que solo se renombra si pasa; la carpeta preparada (unos 400 MB) se borra.

**Firefox 158 (2026-10-17):** la plantilla `AppxManifest.xml.in`, su `distribution.ini`, `priconfig.xml` y
`repackaging/msix.py` son idénticos a los de 157, y el toolchain de makemsix es la misma revisión. Con la identidad
propia (`Vendor=Aegis`, `Profile=Aegis`, `RemotingName=aegis` en `application.ini`) no cambia nada del paquete: mach
toma el nombre del paquete de `--identity-name`, no del fabricante.

### Herramienta: makemsix
- Es la versión de Mozilla de `msix-packaging` de Microsoft (<https://github.com/mozilla/msix-packaging>, revisión
  `1d068315fc1cff43c04837816c28a4a66cba22c1`, la que fija `taskcluster/kinds/fetch/toolchains.yml` de Firefox 157 y
  158), con la orden `sign`. Mozilla la compila en su CI como el toolchain **`linux64-msix-packaging`**.
- `aegis.py` la descarga la primera vez con `mach artifact toolchain --from-build linux64-msix-packaging` (lo mismo que
  usa `mach bootstrap` para los compiladores): mach comprueba el archivo con el **sha256 de su chain-of-trust.json**
  (`msix-packaging.tar.zst`, sha256 `1b0fbaad23ba9906512e2dae3154b7b16cdb41fa055785cb5326616603664ad6` el
  2026-10-11). Queda en `~/.mozbuild/msix-packaging/` (`makemsix`, `libmsix.so` y dos bibliotecas de ICU).
- Además, `aegis.py` fija el sha256 de esos cuatro archivos (`MSIX_SUMAS`) y los comprueba **cada vez** (coinciden el
  2026-10-17). Si al cambiar de versión de Firefox el toolchain cambia, `msix` se niega (código 3): se borra la
  carpeta, se descarga la nueva, se comprueba y se actualizan las sumas.
- Es una conexión del **equipo de compilación** a la CI de Mozilla (`firefox-ci-tc.services.mozilla.com`), como las de
  `mach bootstrap`; el navegador no hace ninguna.

### Lo que no cambia
- El navegador dentro del paquete es el mismo zip de `package` (el mismo que va en GitHub Releases).
- El updater ya se apaga solo en un paquete; lo único propio del paquete es el parche
  `0400-privacidad/0005-sin-atribucion-msix` (atribución, ver arriba), que en el zip de GitHub no tiene efecto.
