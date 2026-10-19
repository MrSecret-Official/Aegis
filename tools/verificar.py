#!/usr/bin/env python3
"""Comprobaciones automáticas de Aegis (las pasa guardian-estabilidad antes de aprobar).

    python tools/verificar.py            todo
    python tools/verificar.py --rapido   sin ShellCheck ni nada que necesite el árbol de Firefox

Funciona en Windows y en Linux. Si encuentra el árbol preparado (WSL: /home/aegis/aegis/src/firefox-<v>, también
visible desde Windows como \\\\wsl.localhost\\archlinux\\…), comprueba además los nombres de las prefs.

Salida: una línea por comprobación (✓ bien, ✗ fallo, · aviso). Código 0 si no hay ningún ✗, 1 si hay alguno.
"""
import hashlib
import json
import os
import re
import shutil
import struct
import subprocess
import sys
import tomllib

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IGNORAR_DIRS = {".git", "work", "out", "__pycache__", ".cache", "estado"}
TEXTO_EXT = {".py", ".sh", ".md", ".json", ".js", ".mjs", ".css", ".ftl", ".html", ".xhtml", ".svg", ".txt", ".patch",
             ".yml", ".yaml", ".toml", ".ini", ".mn", ".build", ".conf", ".cfg", ".ps1", ".cmd", ""}
IDIOMAS = ("es-ES", "pt-BR", "fr", "de", "it")
MARCAS = re.compile(r"\b(Firefox|Mozilla)\b")
# Única excepción a MARCAS en los .ftl: los rótulos del asistente de importar que nombran a Firefox como navegador de
# origen (migracion/, «Importar de otros navegadores» en aegis.ftl). Solo «Firefox», nunca «Mozilla», y solo en los
# mensajes de aegis.ftl cuyo id es ese o sigue con «-».
MARCAS_IMPORTAR = re.compile(r"aegis-migracion-navegador-firefox(?:-[\w-]+)?")
COLOR_FIJO = re.compile(r"#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(")

fallos = []
avisos = []


def ok(msg):
    print(f"✓ {msg}")


def mal(msg):
    fallos.append(msg)
    print(f"✗ {msg}")


def aviso(msg):
    avisos.append(msg)
    print(f"· {msg}")


def archivos(base=REPO):
    for raiz, dirs, nombres in os.walk(base):
        dirs[:] = [d for d in dirs if d not in IGNORAR_DIRS]
        for n in nombres:
            yield os.path.relpath(os.path.join(raiz, n), REPO).replace(os.sep, "/")


def leer_bytes(rel):
    with open(os.path.join(REPO, rel), "rb") as f:
        return f.read()


def ext(rel):
    return os.path.splitext(rel)[1].lower()


def codificacion():
    n = 0
    for rel in archivos():
        e = ext(rel)
        if e not in TEXTO_EXT or (e == "" and "/" in rel and not rel.startswith(("mozconfigs/", "patches/"))):
            continue
        datos = leer_bytes(rel)
        n += 1
        try:
            datos.decode("utf-8")
        except UnicodeDecodeError:
            mal(f"{rel}: no es UTF-8")
            continue
        bom = datos.startswith(b"\xef\xbb\xbf")
        crlf = b"\r\n" in datos
        if e == ".ps1":
            if not bom or (datos.count(b"\n") != datos.count(b"\r\n")):
                mal(f"{rel}: .ps1 tiene que ir en UTF-8 con BOM y CRLF")
        elif e == ".cmd":
            if datos.count(b"\n") != datos.count(b"\r\n"):
                mal(f"{rel}: .cmd tiene que ir en CRLF")
        else:
            if bom:
                mal(f"{rel}: UTF-8 con BOM (tiene que ir sin BOM)")
            if crlf and e != ".patch":
                mal(f"{rel}: finales de línea CRLF (tiene que ir en LF)")
    ok(f"codificación y finales de línea ({n} archivos de texto)")


def python():
    n = 0
    for rel in archivos():
        if ext(rel) == ".py":
            try:   # compile() en memoria: no escribe .pyc en el repo
                compile(leer_bytes(rel), rel, "exec")
                n += 1
            except SyntaxError as e:
                mal(f"{rel}:{e.lineno}: sintaxis de Python: {e.msg}")
    ok(f"sintaxis de Python ({n} archivos)")


def shell(rapido):
    scripts = [rel for rel in archivos() if ext(rel) == ".sh"]
    bash = shutil.which("bash")
    if not bash:
        aviso("sin bash: no se comprueba la sintaxis de los scripts")
    else:
        for rel in scripts:
            r = subprocess.run([bash, "-n", rel], cwd=REPO, capture_output=True, text=True)
            if r.returncode != 0:
                mal(f"{rel}: sintaxis de bash: {r.stderr.strip()}")
        ok(f"sintaxis de bash ({len(scripts)} scripts)")
    if rapido:
        return
    sc = shutil.which("shellcheck")
    if not sc:
        aviso("sin ShellCheck: no se analizan los scripts (en WSL: pacman -S shellcheck)")
        return
    r = subprocess.run([sc, "-S", "warning", *scripts], cwd=REPO, capture_output=True, text=True)
    if r.returncode != 0:
        mal("ShellCheck:\n" + r.stdout.strip())
    else:
        ok("ShellCheck")


def json_validos():
    n = 0
    for rel in archivos():
        if ext(rel) == ".json":
            try:
                json.loads(leer_bytes(rel).decode("utf-8"))
                n += 1
            except ValueError as e:
                mal(f"{rel}: JSON no válido: {e}")
    ok(f"JSON válido ({n} archivos)")


def upstream():
    try:
        up = json.loads(leer_bytes("upstream.json").decode("utf-8"))["firefox"]
    except (OSError, ValueError, KeyError) as e:
        mal(f"upstream.json: {e}")
        return None
    v = up.get("version", "")
    bien = True
    if not re.fullmatch(r"\d{3}\.\d+(\.\d+)?", v):
        mal(f"upstream.json: versión «{v}» no es de Firefox Release")
        bien = False
    if up.get("canal") != "release":
        mal("upstream.json: el canal tiene que ser «release» (ver docs/GUIA.md)")
        bien = False
    for clave in ("url", "sumas_url", "firma_url", "clave_url"):
        u = up.get(clave, "")
        if not u.startswith(f"https://archive.mozilla.org/pub/firefox/releases/{v}/"):
            mal(f"upstream.json: {clave} no apunta a la versión {v} en archive.mozilla.org")
            bien = False
    if not up.get("url", "").endswith(f"/source/firefox-{v}.source.tar.xz"):
        mal("upstream.json: url no es el tarball de la fuente")
        bien = False
    if not re.fullmatch(r"[0-9a-f]{64}", up.get("sha256", "")):
        mal("upstream.json: sha256 no válido")
        bien = False
    if not re.fullmatch(r"[0-9A-F]{40}", up.get("clave_huella", "")):
        mal("upstream.json: clave_huella tiene que ser la huella GPG completa (40 hexadecimales en mayúsculas)")
        bien = False
    if not isinstance(up.get("tamano"), int) or up["tamano"] < 100_000_000:
        mal("upstream.json: tamano no es razonable")
        bien = False
    motor = motor_escudos()
    if motor not in MOTORES:
        mal(f"upstream.json: escudos › motor «{motor}» no es uno de {', '.join(MOTORES)}")
        bien = False
    if bien:
        ok(f"upstream.json (Firefox {v}, motor de Escudos «{motor}»)")
    return v


def parches():
    ruta = os.path.join(REPO, "patches", "series")
    if not os.path.isfile(ruta):
        mal("falta patches/series")
        return
    with open(ruta, encoding="utf-8") as f:
        lista = [l.strip() for l in f if l.strip() and not l.lstrip().startswith("#")]
    todos = sorted(rel[len("patches/"):] for rel in archivos() if rel.startswith("patches/") and rel.endswith(".patch"))
    # Variantes de un parche de la serie para un motor de Escudos que no es el de serie (aegis.py, ruta_parche):
    # <grupo>/alternativos/<motor>/<nombre>.patch ocupa el sitio de <grupo>/<nombre>.patch, con su mismo remolque.
    reales = [p for p in todos if "/alternativos/" not in p]
    for p in todos:
        if "/alternativos/" not in p:
            continue
        m = re.fullmatch(r"([^/]+)/alternativos/([^/]+)/([^/]+)", p)
        if not m or m.group(2) not in MOTORES[1:]:
            mal(f"patches/{p}: un alternativo va en <grupo>/alternativos/<motor>/<nombre>.patch, con motor "
                f"{' o '.join(MOTORES[1:])}")
            continue
        sitio = f"{m.group(1)}/{m.group(3)}"
        texto = leer_bytes(f"patches/{p}").decode("utf-8", "replace")
        if sitio not in lista:
            mal(f"patches/{p}: no hay {sitio} en patches/series, que es el que sustituye")
        if f"Aegis-Parche: {sitio}" not in texto:
            mal(f"patches/{p}: falta el remolque «Aegis-Parche: {sitio}» (el del sitio que ocupa en la serie)")
        for campo in ("Por qué:", "Bug upstream:", "Origen:"):
            if campo not in texto:
                mal(f"patches/{p}: falta «{campo}» en la cabecera (ver docs/GUIA.md)")
    for p in lista:
        if p not in reales:
            mal(f"patches/series cita {p}, que no existe")
    for p in reales:
        if p not in lista:
            mal(f"patches/{p} no está en patches/series")
    if len(set(lista)) != len(lista):
        mal("patches/series tiene parches repetidos")
    lineas = 0
    for p in lista:
        if p not in reales:
            continue
        texto = leer_bytes(f"patches/{p}").decode("utf-8", "replace")
        if f"Aegis-Parche: {p}" not in texto:
            mal(f"patches/{p}: falta el remolque «Aegis-Parche: {p}»")
        for campo in ("Por qué:", "Origen:"):
            if campo not in texto:
                mal(f"patches/{p}: falta «{campo}» en la cabecera (ver docs/GUIA.md)")
        lineas += sum(1 for l in texto.splitlines() if l[:1] in "+-" and not l.startswith(("+++", "---")))
    ok(f"parches: {len(lista)} en series, {lineas} líneas cambiadas en Firefox")


def mozconfigs():
    for n in ("common", "linux-x86_64", "windows-x86_64-cross"):
        if not os.path.isfile(os.path.join(REPO, "mozconfigs", n)):
            mal(f"falta mozconfigs/{n}")
    antes = len(fallos)
    texto = leer_bytes("mozconfigs/common").decode("utf-8")
    codigo = "\n".join(l for l in texto.splitlines() if not l.lstrip().startswith("#"))
    if not re.search(r"^export MOZ_TELEMETRY_REPORTING=\s*$", codigo, re.M):
        mal("mozconfigs/common: MOZ_TELEMETRY_REPORTING tiene que quedar vacío (sin telemetría)")
    prohibido = [
        (r"MOZILLA_OFFICIAL", "MOZILLA_OFFICIAL reactiva la subida de Glean (telemetría)"),
        (r"--enable-official-branding", "la marca oficial es de Mozilla y reactiva la telemetría"),
        (r"MOZ_TELEMETRY_REPORTING=[ \t]*\S","MOZ_TELEMETRY_REPORTING tiene que quedar vacío"),
        (r"MOZ_DATA_REPORTING", "MOZ_DATA_REPORTING no es una opción (lo calcula configure): sería un control falso"),
        (r"--enable-unverified-updates", "las actualizaciones se verifican siempre"),
        (r"--with-branding", "la marca la pone aegis.py, no el mozconfig"),
    ]
    for n in ("common", "linux-x86_64", "windows-x86_64-cross"):
        ruta = os.path.join(REPO, "mozconfigs", n)
        if not os.path.isfile(ruta):
            continue
        cod = "\n".join(l for l in leer_bytes(f"mozconfigs/{n}").decode("utf-8").splitlines() if not l.lstrip().startswith("#"))
        for patron, motivo in prohibido:
            if re.search(patron, cod):
                mal(f"mozconfigs/{n}: {motivo}")
    if len(fallos) == antes:
        ok("mozconfigs")


def marca_y_claves():
    try:
        m = json.loads(leer_bytes("branding/marca.json").decode("utf-8"))
        repo = m["publicacion"]["github"]
        canal = m["actualizaciones"]["mar_canal"]
    except (OSError, ValueError, KeyError) as e:
        mal(f"branding/marca.json: {e}")
        return
    if not re.fullmatch(r"[A-Za-z0-9-]+/[A-Za-z0-9._-]+", repo):
        mal(f"branding/marca.json: publicacion.github «{repo}» no es usuario/repositorio")
    if not re.fullmatch(r"[a-z0-9-]+", canal) or canal.startswith("firefox"):
        mal(f"branding/marca.json: mar_canal «{canal}» no vale (no puede ser uno de Mozilla)")
    claves = [f"updates/claves/{n}.der" for n in ("primaria", "secundaria")]
    hay = [c for c in claves if os.path.isfile(os.path.join(REPO, c))]
    if hay and len(hay) != len(claves):
        mal("updates/claves: tienen que estar las dos claves públicas (primaria y secundaria) o ninguna")
    elif not hay:
        aviso("sin claves MAR en updates/claves: las builds no aceptarán actualizaciones (aegis.py claves-mar)")
    for c in hay:
        if not leer_bytes(c).startswith(bytes([0x30, 0x82])):   # SEQUENCE DER
            mal(f"{c}: no parece un certificado DER")
    if any(os.path.basename(r).endswith((".pem", ".key")) for r in archivos() if r.startswith("updates/")):
        mal("updates/: hay una clave privada en el repo")
    ok(f"marca y actualizaciones ({repo}, canal MAR {canal})")


# Identidad de la Microsoft Store (branding/marca.json › tienda), con los nombres de Partner Center. Las mismas formas
# que TIENDA_CLAVES de tools/aegis.py.
TIENDA = {
    "Package/Identity/Name": r"[A-Za-z0-9][A-Za-z0-9.-]{1,48}[A-Za-z0-9]",
    "Package/Identity/Publisher": r"CN=[^\"<>&]{1,8000}",
    "Package/Properties/PublisherDisplayName": r"[^\"<>&]{1,256}",
    "Package/Properties/DisplayName": r"[^\"<>&]{1,256}",
}
# Los once assets del paquete MSIX: nombres que cita el Resources.pri de la plantilla de Firefox, y su tamaño.
MSIX_ASSETS = {
    "Document44x44.png": (44, 44),
    "LargeTile.scale-200.png": (620, 620),
    "MedTile.scale-200.png": (300, 300),
    "SmallTile.scale-200.png": (142, 142),
    "Square150x150Logo.scale-200.png": (300, 300),
    "Square44x44Logo.altform-lightunplated_targetsize-256.png": (256, 256),
    "Square44x44Logo.altform-unplated_targetsize-256.png": (256, 256),
    "Square44x44Logo.scale-200.png": (88, 88),
    "Square44x44Logo.targetsize-256.png": (256, 256),
    "StoreLogo.scale-200.png": (100, 100),
    "Wide310x150Logo.scale-200.png": (620, 300),
}


def tienda():
    antes = len(fallos)
    try:
        t = json.loads(leer_bytes("branding/marca.json").decode("utf-8")).get("tienda")
    except (OSError, ValueError) as e:
        mal(f"branding/marca.json: {e}")
        return
    if not isinstance(t, dict):
        mal("branding/marca.json: falta la sección «tienda» (docs/TIENDA.md)")
        return
    for clave, forma in TIENDA.items():
        if not isinstance(t.get(clave), str) or not re.fullmatch(forma, t[clave]):
            mal(f"branding/marca.json › tienda › «{clave}» no vale: «{t.get(clave)}»")
    # La Tienda está descartada (docs/TIENDA.md): la identidad provisional («PENDIENTE») ya no es un aviso.
    base = "overlay/browser/branding/aegis/msix/Assets"
    hay = set()
    if os.path.isdir(os.path.join(REPO, base)):
        hay = {r[len(base) + 1:] for r in archivos(os.path.join(REPO, base))}
    for n in sorted(hay - set(MSIX_ASSETS)):
        mal(f"{base}/{n}: Firefox no lo usa (Resources.pri no lo cita)")
    for n, tam in MSIX_ASSETS.items():
        if n not in hay:
            mal(f"falta {base}/{n} (tools/iconos.py)")
            continue
        datos = leer_bytes(f"{base}/{n}")
        if datos[:8] != b"\x89PNG\r\n\x1a\n" or struct.unpack(">II", datos[16:24]) != tam:
            mal(f"{base}/{n}: tiene que ser un PNG de {tam[0]}×{tam[1]}")
    if len(fallos) == antes:
        ok(f"tienda: identidad y {len(MSIX_ASSETS)} assets MSIX")


def ids_ftl(rel):
    texto = leer_bytes(rel).decode("utf-8")
    return set(re.findall(r"^(-?[a-zA-Z][\w-]*)\s*=", texto, re.M)), texto


def marca_en_ftl(texto, importar=False):
    """La primera marca registrada de un .ftl fuera de los comentarios, o None. Con importar (aegis.ftl), «Firefox»
    vale solo dentro de un mensaje (su valor, sus atributos y sus líneas de continuación) cuyo id casa entero con
    MARCAS_IMPORTAR."""
    actual = None
    for l in texto.splitlines():
        if l.lstrip().startswith("#"):
            continue
        m = re.match(r"(-?[a-zA-Z][\w-]*)\s*=", l)
        if m:
            actual = m.group(1)
        elif l and not l[0].isspace():
            actual = None
        for marca in MARCAS.finditer(l):
            if importar and marca.group(1) == "Firefox" and actual and MARCAS_IMPORTAR.fullmatch(actual):
                continue
            return marca.group(1)
    return None


def textos():
    base = "overlay/browser/components/aegis/locales/en-US/"
    origen = [rel for rel in archivos() if rel.startswith(base) and rel.endswith(".ftl")]
    for rel in archivos():
        if rel.endswith(".ftl") and rel.startswith("overlay/"):
            _, texto = ids_ftl(rel)
            marca = marca_en_ftl(texto, importar=rel.endswith("/aegis.ftl"))
            if marca:
                mal(f"{rel}: menciona «{marca}» (marca registrada; ver docs/GUIA.md)")
    for rel in origen:
        ids, _ = ids_ftl(rel)
        nombre = rel[len(base):]
        for idioma in IDIOMAS:
            dest = f"overlay/browser/components/aegis/locales/{idioma}/{nombre}"
            if not os.path.isfile(os.path.join(REPO, dest)):
                mal(f"falta {dest}")
                continue
            ids_d, _ = ids_ftl(dest)
            if ids - ids_d:
                mal(f"{dest}: faltan {', '.join(sorted(ids - ids_d)[:8])}")
            if ids_d - ids:
                mal(f"{dest}: sobran {', '.join(sorted(ids_d - ids)[:8])}")
    ok(f"textos: {len(origen)} archivos .ftl de origen, {len(IDIOMAS) + 1} idiomas")


L10N_URL = "https://codeload.github.com/mozilla-l10n/firefox-l10n/tar.gz/{commit}"


def paquetes_windows(v):
    """El zip de `aegis.py package` más reciente del objdir de Windows (visto desde WSL o desde Windows), o None."""
    for base in ("/home/aegis/aegis/obj", r"\\wsl.localhost\archlinux\home\aegis\aegis\obj",
                 r"\\wsl$\archlinux\home\aegis\aegis\obj"):
        dist = os.path.join(base, f"firefox-{v}-windows-x86_64-cross", "dist")
        try:
            zips = [os.path.join(dist, n) for n in os.listdir(dist)
                    if n.endswith(".zip") and ".langpack" not in n and "-symbols" not in n and "xpt_artifacts" not in n]
        except OSError:
            continue
        return max(zips, key=os.path.getmtime) if zips else None
    return None


def idiomas(v, rapido):
    """Build multi-idioma (docs/GUIA.md): los mismos seis idiomas en el código de Aegis (IDIOMAS de AegisArranque), en
    sus traducciones (locales/<idioma>), en upstream.json › l10n y en el paquete; el commit de firefox-l10n es el que fija
    Firefox; el idioma de la interfaz sigue a Windows (intl.locale.requested vacía) y `package` es multi-idioma."""
    antes = len(fallos)
    todos = {"en-US", *IDIOMAS}
    arranque = leer_bytes("overlay/browser/components/aegis/AegisArranque.sys.mjs").decode("utf-8")
    m = re.search(r"^const IDIOMAS = \[([^\]]*)\];", arranque, re.M)
    en_codigo = set(re.findall(r'"([^"]+)"', m.group(1))) if m else set()
    if en_codigo != todos:
        mal(f"idiomas: IDIOMAS de AegisArranque.sys.mjs ({', '.join(sorted(en_codigo)) or 'nada'}) no son "
            f"{', '.join(sorted(todos))}")
    base = os.path.join(REPO, "overlay", "browser", "components", "aegis", "locales")
    carpetas = {n for n in os.listdir(base) if os.path.isdir(os.path.join(base, n))}
    if carpetas != todos:
        mal(f"idiomas: las carpetas de locales/ ({', '.join(sorted(carpetas))}) no son {', '.join(sorted(todos))}")
    try:
        d = json.loads(leer_bytes("upstream.json").decode("utf-8"))["l10n"]
    except (OSError, ValueError, KeyError):
        mal("idiomas: upstream.json no tiene la sección «l10n» (traducciones de Firefox para la build multi-idioma)")
        return
    commit = d.get("commit", "")
    if not re.fullmatch(r"[0-9a-f]{40}", commit):
        mal(f"idiomas: upstream.json › l10n › commit «{commit}» no es un commit completo")
    if d.get("url") != L10N_URL.format(commit=commit):
        mal(f"idiomas: upstream.json › l10n › url tiene que ser {L10N_URL.format(commit=commit)}")
    if not re.fullmatch(r"[0-9a-f]{64}", d.get("sha256", "")):
        mal("idiomas: upstream.json › l10n › sha256 no es un sha256 (lo calcula `aegis.py fetch`)")
    if not isinstance(d.get("idiomas"), list) or sorted(d["idiomas"]) != sorted(IDIOMAS):
        mal(f"idiomas: upstream.json › l10n › idiomas ({d.get('idiomas')}) no son {', '.join(IDIOMAS)}")
    # El idioma de Windows: vacía en las prefs (instalador y zip) y en la distribución del paquete de la Tienda.
    prefs_txt = "".join(leer_bytes(rel).decode("utf-8") for rel in archivos()
                        if rel.startswith("settings/prefs/") and rel.endswith(".js"))
    if not re.search(r'^pref\("intl\.locale\.requested",\s*""\);', prefs_txt, re.M):
        mal('idiomas: settings/prefs tiene que llevar pref("intl.locale.requested", "") (el idioma de Windows)')
    if 'intl.locale.requested=""' not in leer_bytes("packaging/msix/distribution.ini").decode("utf-8"):
        mal('idiomas: packaging/msix/distribution.ini tiene que llevar intl.locale.requested="" (el de Windows)')
    # aegis.py: package multi-idioma (sin Nightly), el manifiesto MSIX con los idiomas y la comprobación del paquete.
    herramienta = leer_bytes("tools/aegis.py").decode("utf-8")
    for trozo, que in (('"package-multi-locale", "--locales"', "package con mach package-multi-locale"),
                       ('config_status_opcional("NIGHTLY_BUILD"', "package se niega con NIGHTLY_BUILD"),
                       ('("Resources", r"<Resources>.*?</Resources>"', "msix declara los idiomas en el AppxManifest"),
                       ("comprobar_idiomas_paquete(pkg", "package comprueba los idiomas y la marca del paquete"),
                       ("build_zip != build_actual", "msix se niega con un zip de otra build (BuildID)")):
        if trozo not in herramienta:
            mal(f"idiomas: tools/aegis.py ya no hace «{que}»")
    src = None if rapido else arbol(v)
    if src:
        try:
            with open(os.path.join(src, "browser", "locales", "l10n-changesets.json"), encoding="utf-8") as f:
                cs = json.load(f)
            for i in IDIOMAS:
                if (cs.get(i) or {}).get("revision") != commit:
                    mal(f"idiomas: l10n-changesets.json de Firefox {v} fija {i} en "
                        f"{(cs.get(i) or {}).get('revision')}, no en el commit de upstream.json › l10n")
        except (OSError, ValueError) as e:
            mal(f"idiomas: no se puede leer l10n-changesets.json de Firefox {v}: {e}")
    # Los cambios de Aegis a las traducciones de Firefox (tools/l10n-cambios.json; los aplica `aegis.py fetch`).
    cambios = []
    try:
        c = json.loads(leer_bytes("tools/l10n-cambios.json").decode("utf-8"))
        for clave in ("sustituciones", "anadidos"):
            for e in c.get(clave, []):
                cambios.append((clave, e))
                if e.get("idioma") not in IDIOMAS or not re.fullmatch(r"[a-z]+/[\w/.-]+\.ftl", e.get("archivo", "")):
                    mal(f"idiomas: tools/l10n-cambios.json › {clave}: idioma o archivo no válido ({e.get('id')})")
                if clave == "sustituciones" and (not MARCAS.search(e.get("antes", ""))
                                                 or MARCAS.search(e.get("despues", "x"))):
                    mal(f"idiomas: tools/l10n-cambios.json › {e.get('id')}: una sustitución quita «Firefox» o "
                        "«Mozilla» («antes» lo lleva y «después» no)")
                if clave == "anadidos" and not e.get("texto", "").startswith(f"{e.get('id')} ="):
                    mal(f"idiomas: tools/l10n-cambios.json › añadido {e.get('id')}: el texto empieza por su id")
    except (OSError, ValueError) as e:
        mal(f"idiomas: tools/l10n-cambios.json: {e}")
    pkg = None if rapido else paquetes_windows(v)
    if pkg:
        import io
        import zipfile
        try:
            with zipfile.ZipFile(pkg) as z:
                raiz = z.namelist()[0].split("/", 1)[0]
                gre = zipfile.ZipFile(io.BytesIO(z.read(f"{raiz}/omni.ja")))
                nav = zipfile.ZipFile(io.BytesIO(z.read(f"{raiz}/browser/omni.ja")))
            multi = gre.read("res/multilocale.txt").decode("utf-8").replace(",", " ").split()
            if set(multi) != todos:
                mal(f"idiomas: el paquete {os.path.basename(pkg)} trae {', '.join(sorted(multi))} "
                    "(res/multilocale.txt): `aegis.py package` después de `build`")
            for clave, e in cambios:
                nombre = f"localization/{e['idioma']}/{e['archivo'].split('/', 1)[1]}"
                z = nav if nombre in nav.namelist() else gre
                texto = z.read(nombre).decode("utf-8") if nombre in z.namelist() else ""
                m = re.search(rf"^{re.escape(e['id'])}\s*=.*?(?=^\S|\Z)", texto, re.M | re.S)
                bloque = m.group(0) if m else ""
                if not bloque or (clave == "sustituciones" and (e["antes"] in bloque or e["despues"] not in bloque)):
                    mal(f"idiomas: el paquete no lleva el cambio de Aegis de {e['idioma']} {e['id']} "
                        "(tools/l10n-cambios.json): `aegis.py fetch` y `package`")
        except (OSError, KeyError, zipfile.BadZipFile) as e:
            mal(f"idiomas: no se puede leer {pkg}: {e}")
    if len(fallos) == antes:
        ok(f"idiomas: {len(todos)} en Aegis, en upstream.json (firefox-l10n {commit[:12]}) y en las prefs; "
           f"{len(cambios)} cambios de Aegis a las traducciones"
           + ("" if not src else f"; el commit es el de Firefox {v}")
           + ("" if not pkg else "; el paquete los trae"))


def tokens():
    n = 0
    for rel in archivos():
        # La marca (browser/branding/aegis) parte de la de Firefox y se rehace con el icono de Aegis.
        if (not (rel.startswith("overlay/") and ext(rel) == ".css") or rel.endswith("/aegis/estilos/tokens.css")
                or rel.startswith("overlay/browser/branding/")):
            continue
        n += 1
        for i, l in enumerate(leer_bytes(rel).decode("utf-8").splitlines(), 1):
            if l.lstrip().startswith(("/*", "*")):
                continue
            if COLOR_FIJO.search(l):
                mal(f"{rel}:{i}: color fijo fuera de tokens.css (ver docs/DISENO.md)")
    ok(f"CSS sin colores fijos ({n} hojas)")


def arbol(v):
    for c in (f"/home/aegis/aegis/src/firefox-{v}",
              rf"\\wsl.localhost\archlinux\home\aegis\aegis\src\firefox-{v}",
              rf"\\wsl$\archlinux\home\aegis\aegis\src\firefox-{v}"):
        try:
            if os.path.isfile(os.path.join(c, "mach")):
                return c
        except OSError:
            pass
    return None


def prefs(v, rapido):
    mios = [rel for rel in archivos() if rel.startswith("settings/prefs/") and rel.endswith(".js")]
    nombres = {}
    for rel in mios:
        en_bloque = False
        for i, l in enumerate(leer_bytes(rel).decode("utf-8").splitlines(), 1):
            # Cada línea: vacía, comentario (// o dentro de /* … */) o una pref de una sola línea. Cualquier otra cosa
            # la rechaza el lector de prefs de Firefox al arrancar («prefs parse error») y se pierden prefs detrás.
            limpia = l.strip()
            if en_bloque:
                en_bloque = "*/" not in limpia
            elif limpia.startswith("/*"):
                en_bloque = "*/" not in limpia[2:]
            elif limpia and not limpia.startswith("//") and not re.fullmatch(
                r'(?:pref|lockPref|sticky_pref)\(.*\);(?:\s*//.*)?', limpia
            ):
                mal(f"{rel}:{i}: línea que no es ni comentario ni una pref completa (Firefox no la entendería): «{limpia[:60]}»")
            m = re.match(r'\s*(?:pref|lockPref|sticky_pref)\(\s*"([^"]+)"\s*,', l)
            if m:
                # El cargador de desarrollo no evalúa código (la CSP del sistema lo bloquea): solo literales JSON.
                lit = re.match(r'\s*(?:pref|lockPref|sticky_pref)\(\s*("(?:[^"\\]|\\.)*")\s*,\s*(.+?)\s*\)\s*;', l)
                try:
                    json.loads(lit.group(2).replace("@REPO@", "x/y")) if lit else json.loads("x")
                except ValueError:
                    mal(f"{rel}:{i}: el valor tiene que ser un literal (true/false, número o \"texto\") en una sola línea")
                if m.group(1) in nombres:
                    mal(f"{rel}:{i}: «{m.group(1)}» ya está en {nombres[m.group(1)]}")
                nombres[m.group(1)] = f"{rel}:{i}"
    if not mios:
        ok("prefs: todavía no hay")
        return
    if "browser.contentblocking.category" in nombres:
        mal(f"{nombres['browser.contentblocking.category']}: browser.contentblocking.category no puede ser un valor de "
            "serie (Firefox la dejaría en «standard»); la pone AegisArranque.inicio()")
    src = None if rapido else arbol(v)
    if not src:
        aviso(f"prefs: {len(nombres)} sin comprobar contra Firefox {v} (no se encuentra el árbol preparado)")
        return
    conocidas = set()
    for f in ("modules/libpref/init/StaticPrefList.yaml", "modules/libpref/init/all.js", "browser/app/profile/firefox.js"):
        with open(os.path.join(src, f), encoding="utf-8", errors="replace") as h:
            t = h.read()
        conocidas |= set(re.findall(r'^- name:\s*(\S+)', t, re.M)) | set(re.findall(r'pref\(\s*"([^"]+)"', t))
    # Las de Aegis: aegis.* y app.update.aegis.* (en la rama app.update. para que la vea la tarea de actualización en
    # segundo plano; settings/prefs/66-conexiones.js).
    # Y las que activan los migradores de Aegis (browser.migrate.<clave>.enabled con claves aegis-*; 67-migracion.js).
    desconocidas = [n for n in nombres if n not in conocidas and not n.startswith(("aegis.", "app.update.aegis."))
                    and not re.fullmatch(r"browser\.migrate\.aegis-[a-z-]+\.enabled", n)]
    # Muchas prefs solo se declaran en código (la nueva pestaña, la telemetría…): se buscan como texto en todo el
    # árbol con git grep (índice de git: rápido). Desde Windows, dentro de WSL.
    if desconocidas:
        patrones = [x for n in desconocidas for x in ("-e", f'"{n}"')]
        cmd = ["git", "-C", "/home/aegis/aegis/src/firefox-" + v, "grep", "-ohF", *patrones]
        if os.name == "nt":
            cmd = ["wsl.exe", "-d", "archlinux", "-u", "aegis", "--", *cmd]
        try:
            r = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
            vistas = {x.strip().strip('"') for x in r.stdout.splitlines()}
            desconocidas = [n for n in desconocidas if n not in vistas]
        except (OSError, subprocess.TimeoutExpired):
            aviso("prefs: no se pudo buscar en el árbol con git grep; solo se comprobaron los archivos de prefs")
    for n in desconocidas:
        aviso(f"pref «{n}» ({nombres[n]}) no existe en Firefox {v}: ¿renombrada, retirada o se lee sin valor por defecto?")
    # Las prefs de Aegis van en el firefox-branding.js de la marca (aegis.py generar_prefs): tiene que empaquetarse.
    with open(os.path.join(src, "browser", "installer", "package-manifest.in"), encoding="utf-8", errors="replace") as h:
        if "firefox-branding.js" not in h.read():
            mal("package-manifest.in ya no empaqueta firefox-branding.js: las prefs de Aegis no entrarían en la build")
    ok(f"prefs: {len(nombres)} comprobadas contra Firefox {v}")


def huella(v, rapido):
    """Los objetivos de la protección frente a la huella que usa Aegis (settings/prefs/42-huella.js y huella.sys.mjs)
    existen en la versión fijada, y SERIE_FIREFOX es el conjunto de serie de escritorio de esa versión: si Firefox lo
    cambia, los sitios con permiso en Caja fuerte se quedarían con otro y nadie lo notaría."""
    modulo = leer_bytes("overlay/browser/components/aegis/huella.sys.mjs").decode("utf-8")
    listas = {}
    for nombre in ("SERIE_FIREFOX", "ESTRICTA", "DELATA"):
        m = re.search(rf"const {nombre} = \[(.*?)\];", modulo, re.S)
        if not m:
            mal(f"huella.sys.mjs: no se encuentra la lista {nombre}")
            return
        listas[nombre] = re.findall(r'"(\w+)"', m.group(1))
    prefs_huella = leer_bytes("settings/prefs/42-huella.js").decode("utf-8")
    # A principio de línea: una línea comentada no cuenta (la pref no se aplicaría).
    m = re.search(r'^pref\("privacy\.fingerprintingProtection\.overrides",\s*"([^"]*)"\)', prefs_huella, re.M)
    listas["42-huella.js"] = re.findall(r"[+-](\w+)", m.group(1)) if m else []
    if not listas["42-huella.js"]:
        mal("settings/prefs/42-huella.js: falta privacy.fingerprintingProtection.overrides (nivel «equilibrada») o está vacía")
        return
    src = None if rapido else arbol(v)
    if not src:
        aviso(f"huella: objetivos sin comprobar contra Firefox {v} (no se encuentra el árbol preparado)")
        return
    base = os.path.join(src, "toolkit", "components", "resistfingerprinting")
    with open(os.path.join(base, "RFPTargets.inc"), encoding="utf-8") as h:
        existen = set(re.findall(r"ITEM_VALUE\((\w+),", h.read()))
    with open(os.path.join(base, "RFPTargetsDefault.inc"), encoding="utf-8") as h:
        # Solo lo de Release: fuera de los bloques #ifdef NIGHTLY_BUILD … #endif (a principio de línea: la cabecera
        # nombra «#ifdef NIGHTLY_BUILD» dentro de un comentario).
        texto = h.read()
    # Solo se entienden esas dos directivas: con otra (#else, #if defined…), mejor fallar que comparar mal.
    # Cualquier línea de directiva (también sangrada o con espacios, que el preprocesador de C acepta; la cabecera
    # «// #ifdef…» no cuenta) tiene que ser exactamente una de estas dos, y alternar abriendo y cerrando: es lo único
    # que sabe quitar el re.sub de abajo. Si no, mejor fallar que comparar mal.
    directivas = re.findall(r"^[ \t]*#[ \t]*\w+.*$", texto, re.M)
    esperado = ["#ifdef NIGHTLY_BUILD", "#endif"] * (len(directivas) // 2)
    if directivas != esperado:
        mal(f"huella: RFPTargetsDefault.inc de Firefox {v} trae directivas que verificar.py no entiende: {directivas}")
        return
    release = re.sub(r"^#ifdef NIGHTLY_BUILD$.*?^#endif$", "", texto, flags=re.S | re.M)
    serie = set(re.findall(r"^DESKTOP_DEFAULT\((\w+)\)", release, re.M))
    antes = len(fallos)
    for donde, nombres in listas.items():
        for n in nombres:
            if n not in existen:
                mal(f"huella: «{n}» ({donde}) no existe en RFPTargets.inc de Firefox {v}")
    if set(listas["SERIE_FIREFOX"]) != serie:
        mal(f"huella.sys.mjs: SERIE_FIREFOX no es el conjunto de serie de Firefox {v} (RFPTargetsDefault.inc): "
            f"sobran {sorted(set(listas['SERIE_FIREFOX']) - serie)}, faltan {sorted(serie - set(listas['SERIE_FIREFOX']))}")
    if len(fallos) == antes:
        ok(f"huella: {sum(map(len, listas.values()))} objetivos y el conjunto de serie, al día con Firefox {v}")


def contrasenas(v, rapido):
    """La protección de contraseñas (overlay/…/contrasenas.sys.mjs y contrasenas-panel.sys.mjs) envuelve métodos y
    retoca componentes de Firefox sin parche: si cambian de nombre en la versión fijada, dejaría de proteger sin que se
    notara (solo un console.error)."""
    src = None if rapido else arbol(v)
    if not src:
        aviso(f"contraseñas: sin comprobar contra Firefox {v} (no se encuentra el árbol preparado)")
        return
    esperado = {
        "toolkit/components/passwordmgr/LoginManager.sys.mjs":
            ["LoginManager.prototype = {", "async addLoginAsync(login)", "async addLogins(logins)",
             # Pasar a otro Aegis (contrasenas/transferencia/): contar sin descifrar y leer todas.
             "async countLoginsAsync(origin, formActionOrigin, httpRealm)", "async getAllLogins("],
        "toolkit/components/passwordmgr/LoginExport.sys.mjs": ["static async exportAsCSV("],
        "toolkit/components/passwordmgr/LoginHelper.sys.mjs":
            ["setOSAuthEnabled(enable)", '"signon.management.page.os-auth.locked.enabled"', "async requestReauth(",
             # Recibir de otro Aegis: importar sin duplicar, su resumen y los nombres de los campos que espera.
             "async maybeImportLogins(loginDatas)", 'processor.addLoginToSummary(login, "added")', '"no_change"',
             "loginData.usernameElement", "loginData.passwordElement"],
        "toolkit/modules/OSKeyStore.sys.mjs": ["canReauth()"],
        "security/nss/lib/softoken/sftkpwd.c": ['getenv("NSS_MIN_MP_PBE_ITERATION_COUNT")'],
        # Diálogo de la contraseña principal (overlay/…/aegis/dialogos/): sustituye a changemp.xhtml con un «override»
        # (aegis-temas.inc.mn). Tiene que seguir existiendo con esa dirección y abriéndose desde Ajustes, about:logins
        # y el aviso de guardar; y el diálogo usa el contrato de SubDialog, changePassword de NSS y el aviso de
        # suspensión.
        "toolkit/mozapps/preferences/jar.mn": ["content/mozapps/preferences/changemp.xhtml"],
        "browser/components/preferences/config/passwords-autofill.mjs":
            ['"chrome://mozapps/content/preferences/changemp.xhtml"', "passwordmgr-primary-pw-changed"],
        "browser/components/aboutlogins/AboutLoginsParent.sys.mjs":
            ['"chrome://mozapps/content/preferences/changemp.xhtml"'],
        "toolkit/components/passwordmgr/LoginManagerPrompter.sys.mjs":
            ['"chrome://mozapps/content/preferences/changemp.xhtml"'],
        "toolkit/modules/SubDialog.sys.mjs": ["subDialogSetDefaultFocus", "contentWindow.resizeDialog"],
        "security/manager/ssl/nsIPKCS11Token.idl":
            ["Promise changePassword(in AUTF8String oldPassword, in AUTF8String newPassword)", "boolean hasPassword",
             "Promise login();", "readonly attribute boolean isLoggedIn;"],
        "widget/nsIWidget.h": ['"sleep_notification"'],
        # Códigos de verificación (overlay/…/aegis/autenticador/ y dialogos/autenticador.*).
        "toolkit/components/passwordmgr/nsILoginManagerCrypto.idl":
            ["Promise encryptMany(in jsval plainTexts)", "Promise decryptMany(in jsval cipherTexts)"],
        "toolkit/components/passwordmgr/storage-json.sys.mjs": ['"removeLogin"', '"removeAllLogins"', '"modifyLogin"'],
        "dom/chrome-webidl/WindowGlobalActors.webidl": ["Promise<ImageBitmap> drawSnapshot("],
        "dom/webidl/HTMLInputElement.webidl": ["undefined setUserInput(DOMString input)"],
        "dom/interfaces/base/nsIDOMWindowUtils.idl": ["DOMRect toScreenRectInCSSUnits("],
        "widget/nsIClipboardHelper.idl": ["Sensitive = 1"],
        "toolkit/components/satchel/megalist/content/MegalistAlpha.mjs":
            ["cpm-fox-illustration.svg", "no-logins-card-heading", 'action="export-logins"', "shouldShowPrimaryPasswordAuth"],
        "browser/components/aboutlogins/content/aboutLogins.html":
            ["menuitem-export", 'class="detail-grid"', 'class="login-item-title"'],
        # Pasar las contraseñas a otro Aegis (overlay/…/aegis/contrasenas/transferencia/): abrir la bóveda una vez, el
        # selector de archivos y la cola de gDialogBox (por eso la contraseña principal se pide antes de abrir el
        # diálogo de recibir). Lo de LoginManager y LoginHelper, arriba, con sus archivos.
        "widget/nsIFilePicker.idl": ["modeSave         = 1,", "attribute AString defaultExtension;"],
        "browser/base/content/browser.js": ["var gDialogBox = {", "this._queued[queueMethod]("],
    }
    antes = len(fallos)
    for rel, trozos in esperado.items():
        try:
            with open(os.path.join(src, *rel.split("/")), encoding="utf-8", errors="replace") as h:
                texto = h.read()
        except OSError:
            mal(f"contraseñas: no existe {rel} en Firefox {v}")
            continue
        for t in trozos:
            if t not in texto:
                mal(f"contraseñas: {rel} ya no contiene «{t}» (Firefox {v}); revisar contrasenas*.sys.mjs")
    if len(fallos) == antes:
        ok(f"contraseñas: los puntos de Firefox que usa la protección siguen en Firefox {v}")


def nueva_pestana(v, rapido):
    """La nueva pestaña de Aegis se apoya en piezas de Firefox sin parchearlas: nueva-pestana.css coloca el buscador y
    los accesos en la rejilla de Nova (con 3 o 4 filas el buscador sale de .content) y da al «+» el tamaño de las
    losetas, y accesos.sys.mjs envuelve NewTabUtils.blockedLinks para que «Descartar» quite el sitio entero,
    ActivityStreamProvider.getTopFrecentSites para que los accesos automáticos solo salgan de lo visitado en Aegis (una
    condición más en su WHERE, a través de _commonPlacesWhere y _getCommonParams de su `this`) y, desde la primera
    importación de la sesión, MigrationUtils.insertVisitsWrapper para apuntar las visitas importadas. Si cambian, la
    rejilla se descolocaría, «Descartar» volvería a quitar solo una página o el historial importado volvería a llenar
    los accesos, sin más aviso que la consola.

    Además, aegis.accesos.importaciones (los tramos de visitas importadas) no puede tener valor de serie: así Gecko no
    copia su valor a los procesos de las webs (ver enfasis_propio)."""
    pref_importaciones = "aegis.accesos.importaciones"
    for rel in archivos():
        if rel.startswith("settings/") and rel.endswith(".js"):
            texto = leer_bytes(rel).decode("utf-8")
            if re.search(r'^\s*(?:pref|sticky_pref|lockPref)\(\s*"' + re.escape(pref_importaciones) + '"', texto, re.M):
                mal(f"nueva pestaña: {rel} da valor de serie a {pref_importaciones}; tiene que quedarse sin él (si no, "
                    "Gecko copia su valor a los procesos de las webs; ver accesos.sys.mjs)")
    src = None if rapido else arbol(v)
    if not src:
        aviso(f"nueva pestaña: sin comprobar contra Firefox {v} (no se encuentra el árbol preparado)")
        return
    nt = "browser/extensions/newtab/"
    esperado = {
        "toolkit/modules/NewTabUtils.sys.mjs":
            ["var BlockedLinks = {", "block: function BlockedLinks_block(aLink) {",
             "unblock: function BlockedLinks_unblock(aLink) {", "isBlocked: function BlockedLinks_isBlocked(aLink) {",
             "save: function BlockedLinks_save() {", "blockedLinks: BlockedLinks,",
             # Se quitan las bloqueadas y luego se agrupa por sitio así (accesos.sys.mjs, sitio()).
             "links = links.filter(link => !BlockedLinks.isBlocked(link));",
             r"url => url.match(/:\/\/(?:www\.)?([^\/]+)/),",
             # Solo lo visitado en Aegis (accesos.sys.mjs, soloDeAegis): se envuelve el método del proveedor, que
             # getTopSites llama por la propiedad, y la consulta lee estas dos piezas de su `this` (ver más abajo).
             "activityStreamProvider: ActivityStreamProvider,", "async getTopFrecentSites(aOptions) {",
             "return ActivityStreamProvider.getTopFrecentSites(aOptions);", "_commonPlacesWhere: `",
             "_getCommonParams(aOptions, aParams = {}) {"],
        nt + "lib/PlacesFeed.sys.mjs": ["lazy.NewTabUtils.activityStreamLinks.blockURL({ url, pocket_id });"],
        # «Añadir acceso directo» desbloquea así el sitio (accesos.sys.mjs envuelve unblock para quitarlo entero).
        nt + "lib/TopSitesFeed.sys.mjs": ["lazy.NewTabUtils.blockedLinks.unblock({ url: site.url });",
                                          # Los accesos automáticos salen de activityStreamLinks.getTopSites.
                                          "lazy.NewTabUtils.activityStreamLinks,", '"getTopSites",'],
        # Las importaciones de historial pasan todas por insertVisitsWrapper, que se envuelve al empezar una
        # («Migration:Started», ya con MigrationUtils cargado) para apuntar el tramo de visitas que crea.
        "browser/components/migration/MigrationUtils.sys.mjs":
            ["insertVisitsWrapper(pageInfos) {", "return lazy.PlacesUtils.history.insertMany(pageInfos);",
             "export { MigrationUtilsSingleton as MigrationUtils };"],
        "browser/components/migration/MigratorBase.sys.mjs": ['notify("Migration:Started");'],
        "browser/components/migration/ChromeProfileMigrator.sys.mjs":
            ["await MigrationUtils.insertVisitsWrapper(pageInfos);"],
        # La creación del perfil (times.json › created): desde cuándo cuenta una visita como de Aegis.
        "toolkit/modules/ProfileAge.sys.mjs": ["export function ProfileAge(profile) {", "get created() {"],
        # El EXISTS de la condición usa este índice (place_id, visit_date) de moz_historyvisits.
        "toolkit/components/places/nsPlacesIndexes.h":
            ['CREATE_PLACES_IDX("placedateindex", "moz_historyvisits", \\\n'
             '                    "place_id, visit_date", "")'],
        # accesos.sys.mjs lee los accesos de la página en activityStream.store.getState().TopSites.rows.
        nt + "common/Reducers.sys.mjs":
            ["function TopSites(prevState = INITIAL_STATE.TopSites, action) {",
             "{ initialized: true, rows: action.data.links },"],
        "browser/modules/AboutNewTab.sys.mjs": ["activityStream: null,",
                                                "this.activityStream.store.getState().TopSites.rows"],
        nt + "content-src/lib/link-menu-options.mjs": ["url: site.original_url || site.open_url || site.url,"],
        nt + "content-src/components/Base/Base.jsx":
            ["const hasManyTopSitesRows = topSitesEnabled && prefs.topSitesRows > 2;",
             '${logoShouldBeCentered ? " logo-in-content" : ""}', "{!logoShouldBeCentered && searchArea}"],
        nt + "content-src/components/Base/_Grid.scss":
            ["grid-template-rows: repeat(2, var(--row-height));", ".nova-enabled.container > .search-wrapper {",
             "gap: var(--space-medium);"],
        nt + "content-src/components/TopSites/TopSite.jsx": ['{...(this.props.inGrid && { size: "large" })}'],
        "toolkit/content/widgets/moz-button/moz-button.css":
            ["width: var(--button-size-icon-large);", "min-height: var(--button-min-height-large);"],
    }
    antes = len(fallos)
    for rel, trozos in esperado.items():
        try:
            with open(os.path.join(src, *rel.split("/")), encoding="utf-8", errors="replace") as h:
                texto = h.read()
        except OSError:
            mal(f"nueva pestaña: no existe {rel} en Firefox {v}")
            continue
        for t in trozos:
            if t not in texto:
                mal(f"nueva pestaña: {rel} ya no contiene «{t}» (Firefox {v}); revisar paginas/nueva-pestana.css y "
                    "accesos.sys.mjs")
    # La consulta de getTopFrecentSites tiene que leer las dos piezas de `this` y ser sobre «moz_places h» (la condición
    # de accesos.sys.mjs usa h.id y h.last_visit_date): si no, el filtro no se aplicaría o la consulta fallaría.
    try:
        ruta = os.path.join(src, "toolkit", "modules", "NewTabUtils.sys.mjs")
        with open(ruta, encoding="utf-8", errors="replace") as h:
            ntu = h.read()
    except OSError:
        ntu = ""
    m = re.search(r"\n  async getTopFrecentSites\(aOptions\) \{\n(.*?)\n  \},\n", ntu, re.S)
    for t in ("FROM moz_places h", "${this._commonPlacesWhere}", "params: this._getCommonParams(options, {"):
        if not m or t not in m.group(1):
            mal(f"nueva pestaña: getTopFrecentSites (NewTabUtils.sys.mjs, Firefox {v}) ya no contiene «{t}»; revisar "
                "accesos.sys.mjs (los accesos automáticos solo de Aegis)")
    if len(fallos) == antes:
        ok(f"nueva pestaña: los puntos de Firefox que usan la rejilla, «Descartar» y los accesos solo de Aegis siguen "
           f"en Firefox {v}")


def enfasis_propio(v, rapido):
    """El énfasis personalizado guarda nombres y colores del usuario en aegis.enfasis.propio y .guardados. No tienen
    valor de serie a propósito: así Gecko no copia su valor a los procesos de las webs ni a los precargados
    (ShouldSanitizePreference sanea las prefs de texto sin valor de serie, y fission.omitBlocklistedPrefsInSubprocesses
    hace que se omitan de verdad). Si alguien les da valor de serie, o Firefox cambia esa regla, sus valores llegarían
    a los procesos de las webs."""
    nombres = ("aegis.enfasis.propio", "aegis.enfasis.guardados")
    antes = len(fallos)
    for rel in archivos():
        if rel.startswith("settings/prefs/") and rel.endswith(".js"):
            texto = leer_bytes(rel).decode("utf-8")
            for n in nombres:
                if re.search(r'^\s*(?:pref|sticky_pref|lockPref)\(\s*"' + re.escape(n) + '"', texto, re.M):
                    mal(f"énfasis: {rel} da valor de serie a {n}; tiene que quedarse sin él (si no, Gecko copia su "
                        "valor, con los nombres del usuario, a los procesos de las webs; ver 62-enfasis.js)")
    src = None if rapido else arbol(v)
    if not src:
        aviso(f"énfasis: el saneado de prefs sin comprobar contra Firefox {v} (no se encuentra el árbol preparado)")
    else:
        try:
            with open(os.path.join(src, "modules", "libpref", "init", "StaticPrefList.yaml"), encoding="utf-8") as h:
                yaml = h.read()
            with open(os.path.join(src, "modules", "libpref", "Preferences.cpp"), encoding="utf-8", errors="replace") as h:
                cpp = h.read()
        except OSError as e:
            mal(f"énfasis: no se puede leer libpref de Firefox {v}: {e}")
        else:
            m = re.search(r"^- name: fission\.omitBlocklistedPrefsInSubprocesses\n(.*?)(?=^- name:|\Z)", yaml, re.M | re.S)
            if not m or not re.search(r"^\s+value: true\s*$", m.group(1), re.M):
                mal(f"énfasis: en Firefox {v}, fission.omitBlocklistedPrefsInSubprocesses ya no es true "
                    "(StaticPrefList.yaml): los valores de aegis.enfasis.propio y .guardados podrían llegar a los "
                    "procesos de las webs; revisar enfasis.sys.mjs y 62-enfasis.js")
            f = re.search(r"static bool ShouldSanitizePreference\(const Pref\* const aPref\) \{\n(.*?)\n\}\n", cpp, re.S)
            regla = "if (aPref->Type() == PrefType::String && !aPref->HasDefaultValue()) {"
            if not f or regla not in f.group(1):
                mal(f"énfasis: en Firefox {v}, ShouldSanitizePreference (Preferences.cpp) ya no tiene la regla «{regla}»: "
                    "las prefs de texto sin valor de serie (aegis.enfasis.propio y .guardados) podrían dejar de "
                    "sanearse para los procesos de las webs; revisar enfasis.sys.mjs y 62-enfasis.js")
    if len(fallos) == antes:
        ok("énfasis: aegis.enfasis.propio y .guardados sin valor de serie"
           + ("" if not src else f", y Firefox {v} sigue sin copiarlas a los procesos de las webs"))


def migracion(v, rapido):
    """Importar de otros navegadores (overlay/…/aegis/migracion/ y el parche 0900-migracion/0001) se apoya en piezas de
    Firefox sin parchearlas: la clase base de los migradores, los envoltorios de MigrationUtils, la página del CSV de
    Chrome del asistente (que reutiliza asistente.sys.mjs) y las prefs que apaga 67-migracion.js. Si cambian, el
    asistente dejaría de enseñar los orígenes de Aegis o la página de las contraseñas sin más aviso que la consola."""
    base = "overlay/browser/components/aegis/migracion/"
    claves = {"aegis-firefox", "aegis-perfil"}
    modulo = leer_bytes(base + "migradores.sys.mjs").decode("utf-8")
    asistente = leer_bytes(base + "asistente.sys.mjs").decode("utf-8")
    prefs_txt = leer_bytes("settings/prefs/67-migracion.js").decode("utf-8")
    antes = len(fallos)
    vistas = set(re.findall(r'static get key\(\) \{\s*return "([^"]+)"', modulo))
    if vistas != claves:
        mal(f"migración: las claves de migradores.sys.mjs ({sorted(vistas)}) no son {sorted(claves)}")
    for c in sorted(claves):
        if f'pref("browser.migrate.{c}.enabled", true);' not in prefs_txt:
            mal(f"migración: falta browser.migrate.{c}.enabled en settings/prefs/67-migracion.js")
        if f'"{c}"' not in asistente:
            mal(f"migración: asistente.sys.mjs no da pasos para las contraseñas de «{c}»")
    # Los ids de texto que se escriben enteros en el código tienen que existir (los compuestos, como los de los pasos
    # de cada navegador, los cubre la comprobación de los seis idiomas).
    ids_en, _ = ids_ftl("overlay/browser/components/aegis/locales/en-US/aegis.ftl")
    for c in sorted(set(re.findall(r'"(aegis-migracion-[\w-]+)"', modulo + asistente))):
        if not c.endswith("-csv") and c not in ids_en:
            mal(f"migración: el texto «{c}» no está en aegis.ftl")
    for fuente in ("navegador-firefox-csv", "csv-brave", "csv-edge"):
        for parte in ("titulo", "en", "paso1", "paso2", "paso3"):
            if f"aegis-migracion-{fuente}-{parte}" not in ids_en:
                mal(f"migración: falta aegis-migracion-{fuente}-{parte} en aegis.ftl")
    src = None if rapido else arbol(v)
    if not src:
        aviso(f"migración: sin comprobar contra Firefox {v} (no se encuentra el árbol preparado)")
        return
    esperado = {
        "browser/components/migration/MigratorBase.sys.mjs":
            ["export class MigratorBase", "getSourceProfiles() {", "get showsManualPasswordImport() {",
             "get startupOnlyMigrator() {", "browser.migrate.${key}.enabled", "getLastUsedDate() {"],
        "browser/components/migration/MigrationUtils.sys.mjs":
            ["const MIGRATOR_MODULES = Object.freeze({", "getRowsFromDBWithoutLocks(",
             "insertManyBookmarksWrapper(bookmarks, parent)", "insertVisitsWrapper(pageInfos)",
             "get HISTORY_MAX_AGE_IN_MILLISECONDS()", "ChromeUtils.importESModule(moduleURI)"],
        "browser/components/migration/MigrationWizardParent.sys.mjs":
            ['"browser/migrationWizard.ftl",', "migrator.constructor.displayNameL10nID",
             "migrator.showsManualPasswordImport"],
        "browser/components/migration/MigrationWizardChild.sys.mjs":
            ["CHROME_WINDOWS_PASSWORD_PERMISSION", 'migrationDetails.key == "chrome"', "this.#wizardEl"],
        "browser/components/migration/content/migration-wizard.mjs":
            ['<div name="page-chrome-windows-password-permission">', 'class="manual-password-import-select primary"',
             "manual-password-import-skip", 'attachShadow({ mode: "open" })', "document.l10n.connectRoot(shadow)"],
        "browser/components/migration/ChromeProfileMigrator.sys.mjs":
            ['"browser.migrate.chrome.extensions.enabled"', '"browser.migrate.chrome.payment_methods.enabled"',
             '"browser.migrate.chrome.history.limit"', 'return "brave";', 'return "chromium-edge";',
             'return "chromium-edge-beta";', 'return "chrome-beta";', 'return "canary";'],
        "toolkit/components/satchel/FormHistory.sys.mjs": ['case "add": {', "async search(aSelectTerms"],
        "toolkit/components/places/PlacesUtils.sys.mjs": ["promiseBookmarksTree(", "TYPE_X_MOZ_PLACE_CONTAINER"],
        "dom/chrome-webidl/L10nRegistry.webidl": ["boolean _optional = false;"],
    }
    for rel, trozos in esperado.items():
        try:
            with open(os.path.join(src, *rel.split("/")), encoding="utf-8", errors="replace") as h:
                texto = h.read()
        except OSError:
            mal(f"migración: no existe {rel} en Firefox {v}")
            continue
        for t in trozos:
            if t not in texto:
                mal(f"migración: {rel} ya no contiene «{t}» (Firefox {v}); revisar overlay/…/aegis/migracion/")
    if len(fallos) == antes:
        ok(f"migración: dos migradores de Aegis, sus prefs y sus textos, y lo que usan de Firefox {v}")


def transferencia():
    """Pasar las contraseñas a otro Aegis (overlay/…/aegis/contrasenas/transferencia/): la lista del EFF tiene que
    seguir siendo la original (7776 palabras sin repetir que, reconstruidas con sus dados, dan el sha256 publicado), el
    formato no puede bajar las iteraciones por debajo de las de la bóveda y los diálogos no pueden conectar."""
    base = "overlay/browser/components/aegis/contrasenas/transferencia/"
    antes = len(fallos)
    sha_eff = "addd35536511597a02fa0a9ff1e5284677b8883b83e986e43f15a3db996b903e"
    texto = leer_bytes(base + "palabras.sys.mjs").decode("utf-8")
    m = re.search(r"export const PALABRAS = Object\.freeze\(\[(.*?)\]\);", texto, re.S)
    palabras = re.findall(r'"([^"]*)"', m.group(1)) if m else []
    if len(palabras) != 7776 or len(set(palabras)) != 7776 or not all(re.fullmatch(r"[a-z]+(-[a-z]+)?", p) for p in palabras):
        mal(f"transferencia: palabras.sys.mjs no tiene las 7776 palabras distintas de la lista del EFF ({len(palabras)})")
    else:
        import itertools
        dados = ("".join(d) for d in itertools.product("123456", repeat=5))
        reconstruida = "".join(f"{d}\t{p}\n" for d, p in zip(dados, palabras)).encode("ascii")
        if hashlib.sha256(reconstruida).hexdigest() != sha_eff or f'SHA256_ORIGEN = "{sha_eff}"' not in texto:
            mal("transferencia: palabras.sys.mjs ya no es la lista grande del EFF (el sha256 reconstruido no casa)")
    formato = leer_bytes(base + "formato.sys.mjs").decode("utf-8")
    num = lambda n: int((re.search(rf"export const {n} = ([\d_]+);", formato) or [None, "0"])[1].replace("_", ""))
    it, minimo, maximo = num("ITERACIONES"), num("ITERACIONES_MINIMAS"), num("ITERACIONES_MAXIMAS")
    if not (600000 <= minimo <= it <= maximo):
        mal(f"transferencia: iteraciones de PBKDF2 fuera de orden o por debajo de 600 000 ({minimo} ≤ {it} ≤ {maximo})")
    for rel in [base + n for n in ("formato.sys.mjs", "transferencia.sys.mjs")] + [
            f"overlay/browser/components/aegis/dialogos/transferencia-{d}.{e}" for d in ("pasar", "recibir")
            for e in ("mjs", "xhtml")]:
        codigo = leer_bytes(rel).decode("utf-8")
        if re.search(r"\bfetch\(|XMLHttpRequest|newChannel|WebSocket|sendBeacon", codigo):
            mal(f"transferencia: {rel} hace una petición de red")
        if rel.endswith(".xhtml") and ("connect-src 'none'" not in codigo or "default-src 'none'" not in codigo):
            mal(f"transferencia: {rel} tiene que llevar default-src 'none' y connect-src 'none' en su CSP")
    if len(fallos) == antes:
        ok(f"transferencia: lista del EFF intacta, {it} iteraciones (de {minimo} a {maximo}) y sin red")


def extensiones(v, rapido):
    """El panel de extensiones (overlay/…/complementos.sys.mjs) envuelve gUnifiedExtensions.togglePanel y
    hasExtensionsInPanel sin parche para que el botón abra siempre el panel, y usa piezas de Firefox para fijar y
    lanzar las extensiones. Si cambian en la versión fijada, el botón volvería a abrir about:addons con todas las
    extensiones fijadas, o la chincheta dejaría de funcionar, sin más aviso que un console.error."""
    src = None if rapido else arbol(v)
    if not src:
        aviso(f"extensiones: sin comprobar contra Firefox {v} (no se encuentra el árbol preparado)")
        return
    esperado = {
        "browser/base/content/browser-addons.js": [
            "async togglePanel(aEvent, reason) {",
            "hasExtensionsInPanel(policies = this.getActivePolicies()) {",
            "getActivePolicies(skipPBMCheck = false) {",
            "browserActionFor(policy) {",
            "pinToToolbar(widgetId, shouldPinToToolbar) {",
            "_maybeMoveWidgetNodeBack(widgetID) {",
            'BrowserAddonUI.openAddonsMgr("addons://list/extension")',
            "EMPTY_STATE_ILLUSTRATION_ONBOARDING_CLASS: \"extensions-onboardingpanel-state\"",
        ],
        "browser/base/content/navigator-toolbox.js": ["gUnifiedExtensions.togglePanel(event)"],
        "browser/components/extensions/parent/ext-browserAction.js": [
            "triggerAction(window) {",
            '"unified-extensions-item-action-button"',
            '"unified-extensions-item-menu-button"',
            '"unified-extensions-item-row-wrapper"',
            '"--webextension-menupanel-image"',
        ],
        "browser/components/customizableui/content/panelUI.inc.xhtml": [
            'id="unified-extensions-view"',
            'id="overflowed-extensions-list"',
            'id="unified-extensions-area"',
            'id="unified-extensions-empty-state"',
            'id="unified-extensions-manage-extensions"',
        ],
        "browser/components/customizableui/PanelMultiView.sys.mjs": [
            "element.dataset?.navigableWithTabOnly",
            "set selectedElement(value) {",
            "static forNode(node) {",
        ],
        # PanelView como global de la ventana (complementos.sys.mjs lo usa para que el foco siga a la chincheta).
        "browser/base/content/browser.js": ["  PanelView:\n"],
    }
    antes = len(fallos)
    textos_ff = {}
    for rel, trozos in esperado.items():
        try:
            with open(os.path.join(src, *rel.split("/")), encoding="utf-8", errors="replace") as h:
                textos_ff[rel] = h.read()
        except OSError:
            mal(f"extensiones: no existe {rel} en Firefox {v}")
            continue
        for t in trozos:
            if t not in textos_ff[rel]:
                mal(f"extensiones: {rel} ya no contiene «{t}» (Firefox {v}); revisar complementos.sys.mjs")
    # La envoltura solo llega a la comprobación de togglePanel si esta va antes del primer await (complementos.sys.mjs,
    # panelSiempre).
    js = textos_ff.get("browser/base/content/browser-addons.js", "")
    ini = js.find("async togglePanel(aEvent, reason) {")
    if ini >= 0:
        fin = js.find("\n  },\n", ini)
        cuerpo = js[ini:fin if fin > 0 else len(js)]
        comprobacion = cuerpo.find("!this.hasExtensionsInPanel(policies)")
        espera = cuerpo.find("await ")
        if comprobacion < 0 or (0 <= espera < comprobacion):
            mal(f"extensiones: en Firefox {v}, togglePanel ya no comprueba hasExtensionsInPanel antes de su primer "
                "await; el botón volvería a abrir about:addons (revisar panelSiempre en complementos.sys.mjs)")
    if len(fallos) == antes:
        ok(f"extensiones: los puntos de Firefox que usa el panel de extensiones siguen en Firefox {v}")


# --- Motor de Escudos: etp_engine (de serie) y la copia propia de adblock-rust (plan B) -------------------------------

MOTORES = ("etp_engine", "propio")              # como en tools/aegis.py; el primero es el de serie
MOTOR = "overlay/browser/components/aegis/escudos/motor-nativo"
COPIA = MOTOR + "/adblock"
ORIGEN_COPIA = MOTOR + "/adblock-origen.json"
ALT_PROPIO = "patches/0600-escudos/alternativos/propio/0001-motor-en-gkrust.patch"
ETP = "toolkit/components/content-classifier/etp_engine"

# Lo que src/lib.rs del motor usa de adblock-rust: (archivo de src/, qué, patrón, bloque). La firma va del patrón hasta
# el primer «{» o «;»; con bloque, es el bloque entero (los campos que se leen, y los de recursos.json, que lee serde).
# Tiene que ser igual en etp_engine que en la copia propia, con la que src/lib.rs compila (comprobado con cargo check).
API_MOTOR = (
    ("lib.rs", "adblock::lists", r"pub mod lists;", False),
    ("lib.rs", "adblock::request", r"pub mod request;", False),
    ("lib.rs", "adblock::resources", r"pub mod resources;", False),
    ("lib.rs", "adblock::url_parser", r"pub mod url_parser;", False),
    ("lib.rs", "adblock::Engine", r"pub use engine::Engine;", False),
    ("engine.rs", "Engine", r"pub struct Engine\b", False),
    ("engine.rs", "Engine::default", r"impl Default for Engine\b", False),
    ("engine.rs", "Engine::from_filter_set", r"pub fn from_filter_set\(", False),
    ("engine.rs", "Engine::check_network_request", r"pub fn check_network_request\(", False),
    ("engine.rs", "Engine::use_resource_storage", r"pub fn use_resource_storage<", False),
    ("engine.rs", "Engine::url_cosmetic_resources", r"pub fn url_cosmetic_resources\(", False),
    ("engine.rs", "Engine::serialize", r"pub fn serialize\(", False),
    ("engine.rs", "Engine::deserialize", r"pub fn deserialize\(", False),
    ("lists.rs", "FilterSet", r"pub struct FilterSet\b", False),
    ("lists.rs", "FilterSet::new", r"pub fn new\(debug: bool\)", False),
    ("lists.rs", "FilterSet::add_filter_list", r"pub fn add_filter_list\(", False),
    ("lists.rs", "ParseOptions", r"pub struct ParseOptions\b", True),
    ("request.rs", "Request::new", r"pub fn new\(url: &str", False),
    ("resources/mod.rs", "PermissionMask", r"pub struct PermissionMask\b", False),
    ("resources/mod.rs", "PermissionMask::from_bits", r"pub (?:const )?fn from_bits\(", False),
    ("resources/mod.rs", "Resource", r"pub struct Resource\b", True),
    ("resources/mod.rs", "ResourceType", r"pub enum ResourceType\b", True),
    ("resources/mod.rs", "MimeType", r"pub enum MimeType\b", True),
    ("resources/mod.rs", "reexportaciones de resources", r"pub use [^;]*;", False),
    ("resources/resource_storage.rs", "ResourceImpl", r"pub struct ResourceImpl\b", False),
    ("resources/resource_storage.rs", "ResourceStorageBackend", r"pub trait ResourceStorageBackend\b", True),
    ("resources/resource_storage.rs", "InMemoryResourceStorage", r"pub struct InMemoryResourceStorage\b", False),
    ("resources/resource_storage.rs", "InMemoryResourceStorage::from_resources", r"pub fn from_resources\(", False),
    ("blocker.rs", "BlockerResult", r"pub struct BlockerResult\b", True),
    ("cosmetic_filter_cache.rs", "UrlSpecificResources", r"pub struct UrlSpecificResources\b", True),
    ("url_parser/mod.rs", "ResolvesDomain", r"pub trait ResolvesDomain\b", True),
    ("url_parser/mod.rs", "set_domain_resolver", r"pub fn set_domain_resolver\(", False),
)


def motor_escudos():
    try:
        return json.loads(leer_bytes("upstream.json").decode("utf-8")).get("escudos", {}).get("motor", MOTORES[0])
    except (OSError, ValueError, AttributeError):
        return MOTORES[0]


def firmas(base, archivo, patron, bloque):
    """Firmas normalizadas (sin comentarios ni espacios de más) de lo que casa con `patron` en src/<archivo>, o None si
    el archivo no está."""
    try:
        with open(os.path.join(base, "src", archivo), encoding="utf-8") as f:
            texto = re.sub(r"//[^\n]*", "", f.read())
    except OSError:
        return None
    out = []
    for m in re.finditer(r"^[ \t]*" + patron, texto, re.M):
        i = m.start()
        fin = min((j for j in (texto.find("{", i), texto.find(";", i)) if j >= 0), default=len(texto))
        if bloque and texto[fin:fin + 1] == "{":
            nivel = 0
            for k in range(fin, len(texto)):
                nivel += {"{": 1, "}": -1}.get(texto[k], 0)
                if nivel == 0:
                    fin = k
                    break
        out.append(" ".join(texto[i:fin + 1].split()))
    return sorted(out)


def huella_dir(base):
    """sha256 de una carpeta: de la lista ordenada «ruta\\0sha256» de todos sus archivos."""
    filas = []
    for raiz, _, nombres in os.walk(base):
        for n in nombres:
            p = os.path.join(raiz, n)
            with open(p, "rb") as f:
                filas.append(f"{os.path.relpath(p, base).replace(os.sep, '/')}\0{hashlib.sha256(f.read()).hexdigest()}\n")
    return hashlib.sha256("".join(sorted(filas)).encode("utf-8")).hexdigest()


def leer_toml(ruta):
    with open(ruta, "rb") as f:
        return tomllib.load(f)


def version_t(v):
    m = re.match(r"(\d+)(?:\.(\d+))?(?:\.(\d+))?", v.strip())
    if not m:
        return None, 0
    partes = [int(x) for x in m.groups() if x is not None]
    return tuple(partes + [0] * (3 - len(partes))), len(partes)


def casa_requisito(req, version):
    """¿`version` cumple el requisito de Cargo `req`? (^ de serie, =, ~, >=, >, <=, <, separados por comas)."""
    v, _ = version_t(version)
    if v is None:
        return False
    for parte in req.split(","):
        m = re.fullmatch(r"\s*(\^|=|~|>=|>|<=|<)?\s*([0-9][0-9.]*)\s*", parte)
        if not m:
            return False
        op, (r, n) = m.group(1) or "^", version_t(m.group(2))
        if op == "^":
            corte = next((i for i, x in enumerate(r[:n]) if x != 0), n - 1)
            techo = tuple(list(r[:corte]) + [r[corte] + 1] + [0] * (2 - corte))
            bien = r <= v < techo
        elif op == "~":
            techo = (r[0] + 1, 0, 0) if n == 1 else (r[0], r[1] + 1, 0)
            bien = r <= v < techo
        elif op == "=":
            bien = v[:n] == r[:n]
        else:
            bien = {">=": v >= r, ">": v > r, "<=": v <= r, "<": v < r}[op]
        if not bien:
            return False
    return True


def motor(v, rapido):
    """El motor de Escudos y su plan B. (a) etp_engine (el de serie) sigue en la versión fijada con la misma versión,
    la misma API que usa src/lib.rs y el mismo contenido que cuando se comprobó; si no, «cambia a motor propio». (b) La
    copia propia sigue siendo compilable en esa versión: cada dependencia suya existe en third_party/rust (o en los
    [patch] de Firefox) con una versión que la satisface, y la entrada de Cargo.lock del parche alternativo casa con el
    Cargo.lock del árbol. (c) La copia propia no ha cambiado respecto a su origen (los sha256 de su
    .cargo-checksum.json, que son los del crate de crates.io), salvo los cambios apuntados en adblock-origen.json."""
    antes = len(fallos)
    en_uso = motor_escudos()
    try:
        origen = json.loads(leer_bytes(ORIGEN_COPIA).decode("utf-8"))
        copia_toml = leer_toml(os.path.join(REPO, COPIA, "Cargo.toml"))
    except (OSError, ValueError, tomllib.TOMLDecodeError) as e:
        mal(f"motor de Escudos: no se puede leer la copia propia ({ORIGEN_COPIA}, {COPIA}/Cargo.toml): {e}")
        return
    # (c) Integridad de la copia propia.
    base = os.path.join(REPO, COPIA)
    try:
        crudo = leer_bytes(f"{COPIA}/.cargo-checksum.json")
        sumas = json.loads(crudo.decode("utf-8"))
    except (OSError, ValueError) as e:
        mal(f"motor de Escudos: {COPIA}/.cargo-checksum.json: {e}")
        return
    if hashlib.sha256(crudo).hexdigest() != origen.get("cargo_checksum_sha256"):
        mal(f"motor de Escudos: {COPIA}/.cargo-checksum.json no es el del origen (adblock-origen.json)")
    if sumas.get("package") != origen.get("origen", {}).get("crates_io_sha256"):
        mal(f"motor de Escudos: la copia propia no es el adblock {origen.get('version')} de crates.io "
            "(.cargo-checksum.json › package ≠ adblock-origen.json › origen › crates_io_sha256)")
    cambios = origen.get("cambios", {})
    presentes = set()
    for raiz, _, nombres in os.walk(base):
        for n in nombres:
            presentes.add(os.path.relpath(os.path.join(raiz, n), base).replace(os.sep, "/"))
    for rel in sorted(presentes - {".cargo-checksum.json"}):
        esperado = sumas.get("files", {}).get(rel)
        real = hashlib.sha256(leer_bytes(f"{COPIA}/{rel}")).hexdigest()
        if rel in cambios:
            if not cambios[rel].get("motivo") or real != cambios[rel].get("sha256"):
                mal(f"motor de Escudos: {COPIA}/{rel} cambia respecto al origen y adblock-origen.json › cambios no "
                    "lo recoge tal cual (sha256 y motivo)")
        elif esperado is None:
            mal(f"motor de Escudos: {COPIA}/{rel} no viene del origen (no está en su .cargo-checksum.json)")
        elif real != esperado:
            mal(f"motor de Escudos: {COPIA}/{rel} ha cambiado respecto al origen; la copia va tal cual (un cambio "
                "imprescindible, apuntado en adblock-origen.json › cambios con su motivo)")
    for rel in sorted(set(sumas.get("files", {})) - presentes):
        mal(f"motor de Escudos: falta {COPIA}/{rel} (está en su .cargo-checksum.json)")
    # Las dos variantes del Cargo.toml del motor piden lo mismo (features) a su adblock-rust.
    features = sorted(origen.get("features", []))
    for nombre, clave in (("Cargo.toml", "adblock"), ("Cargo.toml.propio", "adblock")):
        try:
            dep = leer_toml(os.path.join(REPO, MOTOR, nombre)).get("dependencies", {}).get(clave, {})
        except (OSError, tomllib.TOMLDecodeError) as e:
            mal(f"motor de Escudos: {MOTOR}/{nombre}: {e}")
            continue
        if sorted(dep.get("features", [])) != features or dep.get("default-features", True):
            mal(f"motor de Escudos: {MOTOR}/{nombre}: adblock tiene que ir con default-features = false y las features "
                f"{features} (adblock-origen.json)")
    if not os.path.isfile(os.path.join(REPO, ALT_PROPIO)):
        mal(f"motor de Escudos: falta {ALT_PROPIO} (el parche del motor propio)")
    if len(fallos) == antes:
        ok(f"motor de Escudos: la copia propia es adblock {origen.get('version')} tal cual de su origen "
           f"({len(presentes)} archivos, {len(cambios)} cambios apuntados)")
    src = None if rapido else arbol(v)
    if not src:
        aviso(f"motor de Escudos: etp_engine y las dependencias de la copia propia sin comprobar contra Firefox {v} "
              "(no se encuentra el árbol preparado)")
        return
    # (a) etp_engine en la versión fijada.
    if en_uso == MOTORES[0]:
        cambia = ("cambia a motor propio: upstream.json › escudos › motor = \"propio\" y `aegis.py prepare` "
                  "(docs/GUIA.md, «Versión de Firefox»).")
        grave = mal
    else:                                                  # con el motor propio, etp_engine ya no hace falta
        cambia = "no afecta: el motor en uso es el propio."
        grave = aviso
    antes = len(fallos)
    etp = os.path.join(src, *ETP.split("/"))
    esperado = origen.get("etp_engine", {})
    if not os.path.isdir(os.path.join(etp, "src")):
        grave(f"motor de Escudos: Firefox {v} ya no trae etp_engine ({ETP}): {cambia}")
    else:
        try:
            nombre_etp = leer_toml(os.path.join(etp, "Cargo.toml")).get("package", {})
            with open(os.path.join(etp, "moz.yaml"), encoding="utf-8") as f:
                rev = re.search(r"^\s*revision:\s*(\S+)", f.read(), re.M)
            rev = rev.group(1) if rev else None
        except (OSError, tomllib.TOMLDecodeError) as e:
            nombre_etp, rev = {}, None
            grave(f"motor de Escudos: no se puede leer etp_engine de Firefox {v} ({e}): {cambia}")
        actual = (nombre_etp.get("name"), nombre_etp.get("version"), rev)
        if actual != (esperado.get("crate"), esperado.get("version"), esperado.get("revision")):
            grave(f"motor de Escudos: etp_engine cambia de versión en Firefox {v}: {actual} y se esperaba "
                  f"{(esperado.get('crate'), esperado.get('version'), esperado.get('revision'))} (adblock-origen.json "
                  f"› etp_engine). Revisa su moz.yaml y el diff de src/ y, si cambia la API o lo que hace, {cambia}")
        distintas = []
        for archivo, que, patron, bloque in API_MOTOR:
            a, b = firmas(etp, archivo, patron, bloque), firmas(base, archivo, patron, bloque)
            if not b:
                mal(f"motor de Escudos: la copia propia no tiene {que} (src/{archivo}); verificar.py está mal")
            elif a != b:
                distintas.append(f"{que} ({'falta' if not a else 'cambia'})")
        if distintas:
            grave(f"motor de Escudos: la API de etp_engine que usa src/lib.rs cambia en Firefox {v}: "
                  f"{', '.join(distintas)}; {cambia}")
        if len(fallos) == antes:
            huella = huella_dir(etp)
            if huella != esperado.get("sha256"):
                grave(f"motor de Escudos: etp_engine cambia en Firefox {v} (sha256 {huella[:12]}…; el comprobado, de "
                      f"Firefox {esperado.get('firefox')}, {str(esperado.get('sha256'))[:12]}…) aunque su versión y la "
                      "API que usamos no. Revisa el diff (¿sigue lo cosmético, los recursos y los scriptlets?), pasa "
                      "tools/pruebas/escudos.py y, si todo sigue, apunta firefox y sha256 en adblock-origen.json › "
                      f"etp_engine. Si recorta algo, {cambia}")
            else:
                ok(f"motor de Escudos: etp_engine de Firefox {v} es el comprobado ({esperado.get('revision')}, "
                   f"{len(API_MOTOR)} puntos de la API que usa src/lib.rs iguales que en la copia propia)")
    # (b) La copia propia, compilable en la versión fijada.
    antes = len(fallos)
    try:
        raiz_toml = leer_toml(os.path.join(src, "Cargo.toml"))
        with open(os.path.join(src, "Cargo.lock"), encoding="utf-8") as f:
            lock = f.read()
        vendor = os.listdir(os.path.join(src, "third_party", "rust"))
    except (OSError, tomllib.TOMLDecodeError) as e:
        mal(f"motor de Escudos: no se puede leer el Cargo.toml, el Cargo.lock o third_party/rust de Firefox {v}: {e}")
        return
    parches_cargo = raiz_toml.get("patch", {}).get("crates-io", {})

    def candidatos(nombre):
        rutas = [os.path.join(src, "third_party", "rust", d) for d in vendor if d == nombre or d.startswith(nombre + "-")]
        rutas += [os.path.join(src, *e["path"].split("/")) for k, e in parches_cargo.items()
                  if isinstance(e, dict) and "path" in e and e.get("package", k) == nombre]
        out = []
        for r in rutas:
            try:
                c = leer_toml(os.path.join(r, "Cargo.toml"))
            except (OSError, tomllib.TOMLDecodeError):
                continue
            if c.get("package", {}).get("name") == nombre:
                opcionales = {k for k, d in c.get("dependencies", {}).items() if isinstance(d, dict) and d.get("optional")}
                out.append((str(c["package"].get("version")), set(c.get("features", {})) | opcionales))
        return out

    # Dependencias que se compilan: las no opcionales y las opcionales que activen las features de adblock-origen.json.
    activas = set(features)
    pendientes = list(features)
    while pendientes:
        for e in copia_toml.get("features", {}).get(pendientes.pop(), []):
            e = e.removeprefix("dep:").split("/")[0].rstrip("?")
            if e not in activas:
                activas.add(e)
                pendientes.append(e)
    versiones = {}
    for clave, spec in copia_toml.get("dependencies", {}).items():
        spec = {"version": spec} if isinstance(spec, str) else spec
        if spec.get("optional") and clave not in activas:
            continue
        nombre = spec.get("package", clave)
        req = spec.get("version", "*")
        buenos = [ver for ver, feats in candidatos(nombre)
                  if casa_requisito(req, ver) and set(spec.get("features", [])) <= feats]
        if not buenos:
            mal(f"motor de Escudos: la copia propia pide {nombre} {req}{' con ' + str(spec['features']) if spec.get('features') else ''} "
                f"y Firefox {v} no lo trae (third_party/rust ni [patch.crates-io]). El plan B ya no compila tal cual: "
                "hay que actualizar la copia propia (otra versión de adblock-rust) o llevar esa dependencia.")
        versiones[nombre] = (req, buenos)
    # La entrada de Cargo.lock del parche alternativo, contra el Cargo.lock del árbol (cargo usa --frozen).
    try:
        alt = leer_bytes(ALT_PROPIO).decode("utf-8")
    except OSError:
        alt = ""
    bloque = re.search(r'^\+name = "adblock"\n\+version = "([^"]+)"\n\+dependencies = \[\n((?:\+ "[^"]+",\n)+)\+\]', alt, re.M)
    paquetes = {}
    for n, ver in re.findall(r'^\[\[package\]\]\nname = "([^"]+)"\nversion = "([^"]+)"', lock, re.M):
        paquetes.setdefault(n, set()).add(ver)
    if not bloque or bloque.group(1) != origen.get("version"):
        mal(f"motor de Escudos: {ALT_PROPIO} no trae la entrada de Cargo.lock de adblock {origen.get('version')}")
    else:
        en_lock = set()
        for d in re.findall(r'^\+ "([^"]+)",$', bloque.group(2), re.M):
            n, _, ver = d.partition(" ")
            en_lock.add(n)
            if ver and ver not in paquetes.get(n, set()):
                mal(f"motor de Escudos: {ALT_PROPIO}: Cargo.lock pide {n} {ver} y el de Firefox {v} trae "
                    f"{sorted(paquetes.get(n, [])) or 'ninguno'}: regenera la entrada (docs/GUIA.md, «Versión de Firefox»)")
            elif not ver and len(paquetes.get(n, ())) != 1:
                mal(f"motor de Escudos: {ALT_PROPIO}: Cargo.lock nombra {n} sin versión y Firefox {v} trae "
                    f"{sorted(paquetes.get(n, [])) or 'ninguno'}: regenera la entrada")
            elif n in versiones:
                ver = ver or next(iter(paquetes[n]))
                if not casa_requisito(versiones[n][0], ver):
                    mal(f"motor de Escudos: {ALT_PROPIO}: Cargo.lock fija {n} {ver}, que no cumple {versiones[n][0]}")
        if en_lock != set(versiones):
            mal(f"motor de Escudos: {ALT_PROPIO}: las dependencias de adblock en Cargo.lock ({sorted(en_lock)}) no son "
                f"las de la copia propia ({sorted(versiones)})")
    if len(fallos) == antes:
        ok(f"motor de Escudos: la copia propia compila en Firefox {v}: sus {len(versiones)} dependencias están en el "
           "árbol con versión válida y el Cargo.lock del parche alternativo casa")


# --- Identidad en el sistema (docs/PLAN.md) --------------------------------------------------------------------------
# Lo que fija Aegis: fabricante y carpeta de perfiles con el nombre de la marca (parche 0200-branding/0001, solo con
# imply_option) y remoting en minúsculas (mozconfigs/common). Lo que no se toca: MOZ_APP_BASENAME (de él sale el
# User-Agent), MOZ_APP_NAME (firefox.exe) y MOZ_APP_ID (AMO).
PARCHE_IDENTIDAD = "0200-branding/0001-identidad-propia.patch"
ID_FIREFOX = "{ec8030f7-c20a-464f-9b0e-13a3a9e97384}"
# Variables que no pueden ir en un mozconfig ni en el configure.sh de la marca: o configure las rechaza (project_flag),
# o cambiarían el User-Agent, el ejecutable o el ID de la app.
NO_EN_MOZCONFIG = ("MOZ_APP_VENDOR", "MOZ_APP_PROFILE", "MOZ_APP_BASENAME", "--with-app-basename", "MOZ_APP_NAME",
                   "--with-app-name", "MOZ_APP_ID", "MOZ_APP_UA_NAME")


def objdirs(v):
    for base in ("/home/aegis/aegis/obj", r"\\wsl.localhost\archlinux\home\aegis\aegis\obj",
                 r"\\wsl$\archlinux\home\aegis\aegis\obj"):
        for nombre in (f"firefox-{v}-windows-x86_64-cross", f"firefox-{v}"):
            ruta = os.path.join(base, nombre, "build", "application.ini")
            try:
                if os.path.isfile(ruta):
                    yield nombre, ruta
            except OSError:
                pass
        try:
            if os.path.isdir(base):
                return
        except OSError:
            pass


def identidad(v, rapido):
    antes = len(fallos)
    try:
        nombre = json.loads(leer_bytes("branding/marca.json").decode("utf-8"))["nombre"]
    except (OSError, ValueError, KeyError) as e:
        mal(f"identidad: branding/marca.json: {e}")
        return
    remoting = nombre.lower()
    # El parche: cambia el fabricante de Firefox por el de la marca y añade la carpeta de perfiles.
    ruta = os.path.join(REPO, "patches", PARCHE_IDENTIDAD)
    with open(os.path.join(REPO, "patches", "series"), encoding="utf-8") as f:
        serie = [l.strip() for l in f if l.strip() and not l.lstrip().startswith("#")]
    if not os.path.isfile(ruta) or PARCHE_IDENTIDAD not in serie:
        mal(f"identidad: falta patches/{PARCHE_IDENTIDAD} en patches/series (fabricante y perfiles propios)")
    else:
        texto = leer_bytes(f"patches/{PARCHE_IDENTIDAD}").decode("utf-8")
        cambios = [l for l in texto.splitlines() if l[:1] in "+-" and not l.startswith(("+++", "---"))]
        esperado = {
            '-imply_option("MOZ_APP_VENDOR", "Mozilla")',
            f'+imply_option("MOZ_APP_VENDOR", "{nombre}")',
            f'+imply_option("MOZ_APP_PROFILE", "{nombre}")',
        }
        if not esperado <= set(cambios):
            mal(f"identidad: patches/{PARCHE_IDENTIDAD} tiene que cambiar MOZ_APP_VENDOR de «Mozilla» a «{nombre}» "
                f"y fijar MOZ_APP_PROFILE «{nombre}» (branding/marca.json › nombre)")
        if "diff --git a/browser/moz.configure b/browser/moz.configure" not in texto:
            mal(f"identidad: patches/{PARCHE_IDENTIDAD} solo debe tocar browser/moz.configure")
    for rel in archivos():
        if rel.startswith("patches/") and rel.endswith(".patch"):
            for l in leer_bytes(rel).decode("utf-8", "replace").splitlines():
                if l.startswith("+") and not l.startswith("+++") and re.search(
                        r"MOZ_APP_(BASENAME|UA_NAME|ID)\b|MOZ_APP_NAME\b.*=", l) and "imply_option" in l:
                    mal(f"identidad: {rel} cambia {l[1:].strip()[:60]}: el User-Agent, el ejecutable y el ID de "
                        "Firefox no se tocan")
    # El mozconfig: remoting propio y nada de lo que no se puede (o no se debe) poner ahí.
    for n in ("common", "linux-x86_64", "windows-x86_64-cross"):
        p = os.path.join(REPO, "mozconfigs", n)
        if not os.path.isfile(p):
            continue
        cod = "\n".join(l for l in leer_bytes(f"mozconfigs/{n}").decode("utf-8").splitlines()
                        if not l.lstrip().startswith("#"))
        for var in NO_EN_MOZCONFIG:
            if re.search(rf"(^|[\s=]){re.escape(var)}\b", cod, re.M):
                mal(f"identidad: mozconfigs/{n} pone {var} (ver docs/PLAN.md, «Identidad en el sistema»)")
    comun = "\n".join(l for l in leer_bytes("mozconfigs/common").decode("utf-8").splitlines()
                      if not l.lstrip().startswith("#"))
    fijados = re.findall(r"^\s*(?:export\s+|ac_add_options\s+)?MOZ_APP_REMOTINGNAME=(\S*)\s*$", comun, re.M)
    if fijados != [remoting]:
        mal(f"identidad: mozconfigs/common tiene que llevar «export MOZ_APP_REMOTINGNAME={remoting}» una vez "
            f"(ahora: {fijados or 'nada'}); sin él, el remoting es «firefox», el de Firefox")
    # La marca: solo las confvar (el resto lo rechaza configure o no se aplica).
    marca = "overlay/browser/branding/aegis/configure.sh"
    cod = "\n".join(l for l in leer_bytes(marca).decode("utf-8").splitlines() if not l.lstrip().startswith("#"))
    for var in NO_EN_MOZCONFIG + ("MOZ_APP_REMOTINGNAME",):
        if re.search(rf"^\s*{re.escape(var)}=", cod, re.M):
            mal(f"identidad: {marca} pone {var}: ahí solo valen las confvar (ver docs/PLAN.md)")
    if not re.search(rf"^MOZ_APP_DISPLAYNAME={re.escape(nombre)}\s*$", cod, re.M):
        mal(f"identidad: {marca}: MOZ_APP_DISPLAYNAME tiene que ser «{nombre}» (branding/marca.json)")
    # Contra el árbol: que Firefox siga funcionando como supone todo lo anterior.
    src = None if rapido else arbol(v)
    if src:
        def leer(rel):
            with open(os.path.join(src, rel), encoding="utf-8", errors="replace") as f:
                return f.read()
        try:
            toolkit = leer("toolkit/moz.configure")
            http = leer("netwerk/protocol/http/nsHttpHandler.cpp")
            moz = leer("browser/moz.configure")
        except OSError as e:
            mal(f"identidad: no se puede leer el árbol de Firefox {v}: {e}")
        else:
            for var in ("MOZ_APP_VENDOR", "MOZ_APP_PROFILE"):
                if not re.search(rf'project_flag\(\s*(env=)?"{var}"', toolkit):
                    aviso(f"identidad: en Firefox {v}, {var} ya no es un project_flag de toolkit/moz.configure: "
                          "revisar si ya se puede fijar sin parche")
            if 'mAppName.EqualsLiteral("Firefox")' not in http:
                mal(f"identidad: en Firefox {v}, nsHttpHandler.cpp ya no compara el nombre con «Firefox»: revisar "
                    "que el User-Agent sigue sin «Aegis»")
            if f'imply_option("MOZ_APP_ID", "{ID_FIREFOX}")' not in moz:
                mal(f"identidad: en Firefox {v}, browser/moz.configure ya no fija el ID {ID_FIREFOX}")
            if f'imply_option("MOZ_APP_VENDOR", "{nombre}")' not in moz:
                aviso(f"identidad: el árbol de Firefox {v} no tiene aplicado {PARCHE_IDENTIDAD} (aegis.py prepare)")
    # La última build, si está a mano: lo que dice su application.ini.
    if not rapido:
        quiere = {"Vendor": nombre, "Name": "Firefox", "RemotingName": remoting, "Profile": nombre, "ID": ID_FIREFOX}
        for obj, ini in objdirs(v):
            try:
                with open(ini, encoding="utf-8", errors="replace") as f:
                    texto = f.read()
            except OSError:
                continue
            app = dict(re.findall(r"^(\w+)=(.*)$", texto.split("[Gecko]")[0], re.M))
            distinto = {k: app.get(k) for k, w in quiere.items() if app.get(k) != w}
            if distinto:
                aviso(f"identidad: la build de {obj} es anterior a la identidad propia ({distinto}): recompilar")
    if len(fallos) == antes:
        ok(f"identidad en el sistema: fabricante y perfiles «{nombre}», remoting «{remoting}»; nombre «Firefox» "
           "(User-Agent), firefox.exe e ID de Firefox sin tocar")


def acciones(v, rapido):
    """Las acciones de la barra de direcciones (modo «Acciones», acciones.sys.mjs) se cambian sin parches, con la API
    pública de ActionsProviderQuickActions y envolviendo QuickActionsLoaderDefault.load y getViewUpdate de los dos
    proveedores que pintan acciones. En el repo: cada glifo y cada texto que usa existe (y el glifo está en moz.build).
    Contra Firefox: esas piezas siguen igual y la lista de acciones de Firefox es la que Aegis conoce (una acción nueva
    saldría al final con el icono y el texto de Firefox; una quitada de Firefox se borra aquí)."""
    base = "overlay/browser/components/aegis/"
    modulo = leer_bytes(base + "acciones.sys.mjs").decode("utf-8")
    antes = len(fallos)

    def lista(nombre):
        m = re.search(r"export const " + nombre + r" = \[\n(.*?)\n\];", modulo, re.S)
        return re.findall(r'^\s*(?:\[)?"([\w-]+)"', m.group(1), re.M) if m else []

    quitadas = lista("QUITADAS")
    de_firefox = lista("DE_FIREFOX")
    privada = re.search(r'^const PRIVADA = \["([\w-]+)", "([\w-]+)"\];', modulo, re.M)
    if not quitadas or not de_firefox or not privada:
        mal("acciones: acciones.sys.mjs ya no tiene QUITADAS, DE_FIREFOX o PRIVADA con la forma que lee verificar.py")
        return
    conocidas = set(quitadas) | set(de_firefox) | {privada.group(1)}

    # Glifos: la segunda columna de DE_FIREFOX y PRIVADA, los `glifo: "…"` de las de Aegis y los que elige una función
    # según el estado (`? "accion-…" : "accion-…"`).
    glifos = set(re.findall(r'^\s*\["[\w-]+", "([\w-]+)"\],?$', modulo, re.M)) | {privada.group(2)}
    glifos |= set(re.findall(r'glifo: "([\w-]+)"', modulo))
    glifos |= {g for par in re.findall(r'\? "(accion-[\w-]+)" : "(accion-[\w-]+)"', modulo) for g in par}
    mozbuild = leer_bytes(base + "moz.build").decode("utf-8")
    for g in sorted(glifos):
        rel = f"{base}estilos/iconos/{g}.svg"
        if not os.path.isfile(os.path.join(REPO, rel)):
            mal(f"acciones: falta {rel}")
        elif f'"estilos/iconos/{g}.svg"' not in mozbuild:
            mal(f"acciones: {rel} no está en moz.build (la build no lo llevaría)")
        elif 'stroke="context-fill"' not in leer_bytes(rel).decode("utf-8"):
            mal(f"acciones: {rel} no es un glifo de línea con context-fill (DISENO §8)")
    # Textos: cada id aegis-accion-* del módulo, en los seis aegis.ftl (que estén en todos lo comprueba textos()).
    ids_mod = set(re.findall(r'"(aegis-accion-[\w-]+)"', modulo))
    ids_en, _ = ids_ftl(base + "locales/en-US/aegis.ftl")
    for falta in sorted(ids_mod - ids_en):
        mal(f"acciones: acciones.sys.mjs usa {falta}, que no está en aegis.ftl")
    if f'"acciones.sys.mjs"' not in mozbuild:
        mal("acciones: acciones.sys.mjs no está en moz.build")

    src = None if rapido else arbol(v)
    if not src:
        aviso(f"acciones: sin comprobar contra Firefox {v} (no se encuentra el árbol preparado)")
    else:
        ub = "browser/components/urlbar/"
        esperado = {
            # La carga perezosa que se envuelve: ensureLoaded llama a this.load() y load registra con addAction.
            ub + "QuickActionsLoaderDefault.sys.mjs":
                ["static async load() {", "lazy.ActionsProviderQuickActions.addAction(key, actionData);",
                 "this.#loadedPromise = this.load();", "export class QuickActionsLoaderDefault {"],
            # La API pública que usa Aegis y cómo pinta el proveedor una acción (label como id, icon tal cual).
            ub + "ActionsProviderQuickActions.sys.mjs":
                ['return "ActionsProviderQuickActions";', "addAction(key, definition) {", "removeAction(key) {",
                 "getAction(key) {", "l10nId: action.label,", "icon: action.icon,",
                 "if (action.isUnsupported?.() || action.isInactive?.()) {",
                 "let options = this.#actions.get(key).onPick(queryContext, controller);",
                 "export var ActionsProviderQuickActions = new ProviderQuickActions();"],
            # La fila de botones: el texto de cada uno sale de getViewUpdate (label-<n>).
            ub + "UrlbarProviderGlobalActions.sys.mjs":
                ["export class UrlbarProviderGlobalActions extends UrlbarProvider {", "getViewUpdate(result) {",
                 "viewUpdate[`label-${i}`] = {", "l10n: { id: action.l10nId, args: action.l10nArgs },",
                 "src: action.icon || DEFAULT_ICON,"],
            # La lista del modo Acciones: el texto de cada fila sale de getViewUpdate (label).
            ub + "UrlbarProviderActionsSearchMode.sys.mjs":
                ["export class UrlbarProviderActionsSearchMode extends UrlbarProvider {", "getViewUpdate(result) {",
                 "l10n: { id: action.label },", "src: action.icon || DEFAULT_ICON,"],
            # getViewUpdate se llama en el proceso principal, sobre la instancia del proveedor (el prototipo envuelto).
            ub + "UrlbarProvidersManager.sys.mjs": ["result.payload.viewUpdate = provider.getViewUpdate("],
            # La vista admite textContent en lugar de l10n (el texto ya traducido de las acciones de Aegis).
            ub + "content/UrlbarView.mjs": ['} else if (update.hasOwnProperty("textContent")) {'],
            # «Importar datos de otro navegador» es esta orden de la ventana.
            "browser/base/content/browser-sets.js": ['case "cmd_file_importFromAnotherBrowser":'],
            # «Abrir las contraseñas»: el panel de la barra lateral (si no, about:logins).
            "browser/components/sidebar/browser-sidebar.js":
                ['"browser.contextual-password-manager.enabled",', '"viewCPMSidebar",'],
        }
        for rel, trozos in esperado.items():
            try:
                with open(os.path.join(src, *rel.split("/")), encoding="utf-8", errors="replace") as h:
                    texto = h.read()
            except OSError:
                mal(f"acciones: no existe {rel} en Firefox {v}; revisar acciones.sys.mjs")
                continue
            for t in trozos:
                if t not in texto:
                    mal(f"acciones: {rel} ya no contiene «{t}» (Firefox {v}); revisar acciones.sys.mjs")
        try:
            with open(os.path.join(src, *(ub + "QuickActionsLoaderDefault.sys.mjs").split("/")), encoding="utf-8") as h:
                cargador = h.read()
        except OSError:
            cargador = ""
        m = re.search(r"\nconst DEFAULT_ACTIONS = \{\n(.*?)\n\};\n", cargador, re.S)
        de_mozilla = set(re.findall(r"^  (\w+): \{$", m.group(1), re.M)) if m else set()
        if not de_mozilla:
            mal(f"acciones: no se encuentra DEFAULT_ACTIONS en QuickActionsLoaderDefault.sys.mjs (Firefox {v})")
        else:
            nuevas = de_mozilla - conocidas
            idas = conocidas - de_mozilla
            if nuevas:
                mal(f"acciones: Firefox {v} trae acciones que Aegis no conoce ({', '.join(sorted(nuevas))}); decidir en "
                    "acciones.sys.mjs si se quitan (QUITADAS) o se quedan con un glifo de Aegis (DE_FIREFOX)")
            if idas:
                mal(f"acciones: Firefox {v} ya no tiene {', '.join(sorted(idas))}; quitarlas de acciones.sys.mjs")
    if len(fallos) == antes:
        ok(f"acciones de la barra: {len(quitadas)} de Firefox fuera, {len(de_firefox) + 1} con glifo de Aegis, "
           f"{len(glifos)} glifos" + ("" if not src else f"; los puntos de Firefox {v} siguen igual"))


def buscadores(v, rapido):
    """La búsqueda limpia (overlay/…/busqueda-limpia.sys.mjs) quita de las búsquedas de DuckDuckGo, Bing, Startpage,
    Qwant, Ecosia y Wikipedia los parámetros fijos de la configuración de búsqueda de Firefox (form=MOZLBR,
    sourceid=Mozilla-search…) y sus códigos de socio, y reconoce las sugerencias del navegador por cómo las pide
    SearchSuggestionController (XMLHttpRequest del proceso padre). Si Firefox añade un parámetro a esas direcciones, un
    código de socio nuevo o cambia cómo pide las sugerencias, la limpieza se quedaría corta sin que nada fallara."""
    rel = "overlay/browser/components/aegis/busqueda-limpia.sys.mjs"
    modulo = leer_bytes(rel).decode("utf-8")
    arranque = leer_bytes("overlay/browser/components/aegis/AegisArranque.sys.mjs").decode("utf-8")
    if "AegisBusquedaLimpia.inicio()" not in arranque:
        mal("AegisArranque.sys.mjs ya no arranca la búsqueda limpia (AegisBusquedaLimpia.inicio())")
    if '"busqueda-limpia.sys.mjs"' not in leer_bytes("overlay/browser/components/aegis/moz.build").decode("utf-8"):
        mal("overlay/browser/components/aegis/moz.build no instala busqueda-limpia.sys.mjs")
    # El botón de Escudos en las páginas de resultados (la barra con los términos de búsqueda): interfaz.css.
    interfaz = re.sub(r"\s+", " ", leer_bytes("overlay/browser/components/aegis/estilos/interfaz.css").decode("utf-8"))
    selectores_barra = [
        '#urlbar[persistsearchterms]:not([focused]) > .urlbar-input-container > '
        '#page-action-buttons:has(> #aegis-escudos-button:not([hidden]))',
        '#urlbar[persistsearchterms]:not([focused]) > .urlbar-input-container[pageproxystate="invalid"] > '
        '#page-action-buttons > #aegis-escudos-button:not([hidden])',
    ]
    for sel in selectores_barra:
        if sel not in interfaz:
            mal(f"interfaz.css ya no tiene «{sel}»: el botón de Escudos no se vería en los resultados de los buscadores")
    src = None if rapido else arbol(v)
    if not src:
        aviso(f"búsqueda limpia: sin comprobar contra Firefox {v} (no se encuentra el árbol preparado)")
        return
    antes = len(fallos)
    # Parámetros que puede llevar cada dirección: los que el módulo quita y los de formato de la respuesta (q, type,
    # action, client=opensearch…). Uno nuevo hay que mirarlo antes de dejarlo pasar.
    conocidos = {
        "ddg": {"search": {"t"}, "suggestions": {"type"}},
        "bing": {"search": {"pc", "form"}, "suggestions": {"form"}, "trending": set()},
        "startpage": {"search": {"segment"}, "suggestions": {"segment"}},
        "qwant": {"search": {"client"}, "suggestions": {"client"}},
        "ecosia": {"search": {"tt"}, "suggestions": {"type"}},
        # variant: la escritura del chino (zh-tw, zh-cn…) en wikipedia-zh-*; cambia el resultado, no rastrea.
        "wikipedia": {"search": {"sourceid", "variant"}, "suggestions": {"action", "variant"}},
    }
    # Códigos de socio que el módulo reconoce (SOCIO), por si llegan de una build sin el parche 0400-privacidad/0002.
    socio = re.search(r"const SOCIO = \{(.*?)\n\};", modulo, re.S)
    listas = {m.group(1): set(re.findall(r'"([^"]+)"', m.group(2)))
              for m in re.finditer(r"^\s*(\w+): \[\"\w+\", v => \[(.*?)\]\.includes", socio.group(1) if socio else "", re.M)}
    if not socio or set(listas) != {"qwant", "ecosia"}:
        mal(f"{rel}: no se entiende SOCIO (verificar.py busca las listas de Qwant y Ecosia)")
        return
    pruebas = {
        "bing": lambda c: re.match(r"(?i)(MOZ|MZ)", c), "startpage": lambda c: c.startswith("startpage.apex"),
        "qwant": lambda c: c in listas["qwant"], "ecosia": lambda c: c in listas["ecosia"],
    }
    with open(os.path.join(src, "services", "settings", "dumps", "main", "search-config-v2.json"), encoding="utf-8") as h:
        config = json.load(h)["data"]

    def recorrer(nodo, cb):
        """Llama a cb(urls, codigo) con la base, cada variante y cada subvariante."""
        cb(nodo.get("urls", {}), nodo.get("partnerCode"))
        for var in nodo.get("variants", []) + nodo.get("subVariants", []):
            recorrer(var, cb)

    vistos = set()
    for r in config:
        ident = r.get("identifier", "")
        fam = "wikipedia" if ident.startswith("wikipedia") else ident
        if r.get("recordType") != "engine" or fam not in conocidos:
            continue
        vistos.add(fam)

        def mirar(urls, codigo, fam=fam, ident=ident):
            for tipo, u in urls.items():
                if tipo not in conocidos[fam]:
                    if tipo in ("search", "suggestions", "trending"):
                        mal(f"búsqueda limpia: {ident} tiene una dirección «{tipo}» que el módulo no conoce")
                    continue
                nombres = {p["name"] for p in u.get("params", [])}
                if "base" in u:
                    nombres |= set(re.findall(r"[?&]([^=&]+)=", u["base"]))
                if fam == "startpage" and tipo == "suggestions" and "base" in u and \
                        not u["base"].startswith("https://www.startpage.com/suggestions?"):
                    mal(f"búsqueda limpia: las sugerencias de Startpage ya no van a /suggestions ({u['base']}); "
                        "revisar sugerencias() en busqueda-limpia.sys.mjs")
                # Startpage: partner=apex&format=opensearch van en la base de sus sugerencias (las cambia el módulo).
                nuevos = nombres - conocidos[fam][tipo] - ({"partner", "format"} if fam == "startpage" else set())
                if nuevos:
                    mal(f"búsqueda limpia: {ident} ({tipo}) lleva parámetros nuevos en Firefox {v}: {sorted(nuevos)}; "
                        "mirar si rastrean y añadirlos a busqueda-limpia.sys.mjs o a «conocidos» aquí")
            if codigo and fam in pruebas and not pruebas[fam](codigo):
                mal(f"búsqueda limpia: código de socio nuevo de {ident} en Firefox {v} («{codigo}»); añadirlo a SOCIO")

        recorrer(r.get("base", {}) | {"variants": r.get("variants", [])}, mirar)
    for fam in sorted(set(conocidos) - vistos):
        mal(f"búsqueda limpia: «{fam}» ya no está en search-config-v2.json de Firefox {v}")
    with open(os.path.join(src, "toolkit", "components", "search", "SearchSuggestionController.sys.mjs"),
              encoding="utf-8") as h:
        controlador = h.read()
    for t in ("new XMLHttpRequest()", "request.open(method, submission.uri.spec, true)"):
        if t not in controlador:
            mal(f"búsqueda limpia: SearchSuggestionController.sys.mjs ya no contiene «{t}»; el módulo reconoce las "
                "sugerencias como XMLHttpRequest del proceso padre")
    # Lo que interfaz.css deshace para el botón de Escudos (arriba): las dos reglas de urlbar.css que ocultan los botones
    # de página, y los atributos de la barra que usa su selector. Si cambian, el botón volvería a ocultarse (o se vería
    # donde no toca) sin que fallara nada.
    with open(os.path.join(src, "browser", "themes", "shared", "urlbar.css"), encoding="utf-8") as h:
        urlbar_css = re.sub(r"\s+", " ", h.read())
    for t in ('.urlbar-input-container[pageproxystate="invalid"] > #page-action-buttons > '
              '.urlbar-page-action:not(#share-button)',
              "#urlbar[usertyping] > .urlbar-input-container > #page-action-buttons"):
        if t not in urlbar_css:
            mal(f"búsqueda limpia: urlbar.css de Firefox {v} ya no tiene «{t}»; revisar la regla del botón de Escudos "
                "en interfaz.css")
    contenido_barra = ""
    carpeta = os.path.join(src, "browser", "components", "urlbar", "content")
    for nombre in os.listdir(carpeta):
        if nombre.endswith(".mjs"):
            with open(os.path.join(carpeta, nombre), encoding="utf-8") as h:
                contenido_barra += h.read()
    for t in ('toggleAttribute("persistsearchterms"', 'toggleAttribute("usertyping"'):
        if t not in contenido_barra:
            mal(f"búsqueda limpia: la barra de Firefox {v} ya no hace {t}…); revisar la regla del botón de Escudos en "
                "interfaz.css")
    with open(os.path.join(src, "browser", "base", "content", "navigator-toolbox.inc.xhtml"), encoding="utf-8") as h:
        if '<hbox id="page-action-buttons"' not in h.read():
            mal(f"búsqueda limpia: #page-action-buttons ya no está en navigator-toolbox.inc.xhtml de Firefox {v}")
    if len(fallos) == antes:
        ok(f"búsqueda limpia: direcciones y códigos de socio de {len(vistos)} buscadores y el botón de Escudos con los "
           f"términos de búsqueda en la barra, al día con Firefox {v}")


PARCHE_EXE = "0200-branding/0002-propiedades-del-exe.patch"
# Los module.ver que cambia (firefox.exe, private_browsing.exe y plugin-container.exe; las DLL, no).
MODULE_VER_EXE = ("browser/app/module.ver", "browser/app/pbproxy/module.ver", "ipc/app/module.ver")
# Restos de Firefox (decisión del usuario, 2026-10-19): las prefs que los quitan, con su valor.
PREFS_RESTOS = {
    "browser.netError.illustration.enabled": "false",
    "browser.urlbar.groupLabels.enabled": "false",
    "browser.aboutpdf.promo.dismissed": "true",
    "pdfjs.featuresNotificationImpressionLimit": "0",
    # Ajustes › Idioma no pide nada a addons.mozilla.org ni ofrece descargar idiomas: los seis vienen en la build.
    "intl.multilingual.downloadEnabled": "false",
}
# Lo que ocultan las hojas, y en qué archivo de Firefox tiene que seguir existiendo cada cosa para que la regla sirva.
RESTOS_CSS = {
    "overlay/browser/components/aegis/estilos/interfaz.css": {
        "menu_openFirefoxView": "browser/base/content/browser-menubar.inc.xhtml",
        "menu_openHelp": "browser/base/content/browser-menubar.inc.xhtml",
        "help_reportBrokenSite": "browser/base/content/browser-menubar.inc.xhtml",
        "menu_HelpPopup_reportPhishingtoolmenu": "browser/base/content/browser-menubar.inc.xhtml",
        "menu_HelpPopup_reportPhishingErrortoolmenu": "browser/base/content/browser-menubar.inc.xhtml",
        "menu_FileRestartItem": "browser/base/content/browser-development-helpers.js",
        "extensionsForDevelopers": "devtools/client/menus.js",
        "appmenu-developer-tools-extensions": "devtools/client/menus.js",
        "appMenu-translate-button": "browser/base/content/appmenu-viewcache.inc.xhtml",
        "appmenu-abouttranslations-button": "browser/base/content/appmenu-viewcache.inc.xhtml",
        "PanelUI-helpItems": "browser/base/content/appmenu-viewcache.inc.xhtml",
        "widget-overflow-fixed-list": "browser/themes/shared/customizableui/customizeMode.css",
        "firefox-view-button": "browser/components/customizableui/CustomizableUI.sys.mjs",
    },
    "overlay/browser/branding/aegis/content/aboutDialog.css": {
        n: "browser/base/content/aboutDialog.xhtml"
        for n in ("communityDesc", "communityExperimentalDesc", "contributeDesc", "contributeDescReferrals",
                  "aboutDialogHelpLink", "submit-feedback")
    },
    "overlay/browser/components/aegis/estilos/ajustes.css": {
        "supportGetHelp": "browser/components/preferences/config/about-firefox.mjs",
        "supportShareIdeas": "browser/components/preferences/config/about-firefox.mjs",
    },
    "overlay/browser/components/aegis/paginas/errores.css": {
        "cert-error-mitm-mozilla": "toolkit/content/aboutNetError.mjs",
        "learnMoreLink": "toolkit/content/aboutNetError.html",
    },
}


def restos_firefox(v, rapido):
    """Lo que Aegis quita de Firefox por ser prescindible (docs/CONEXIONES.md, «Lo que Aegis corta»): cuatro prefs, las
    reglas de interfaz.css, aboutDialog.css, ajustes.css y errores.css, los enlaces legales de Acerca de
    (acerca.sys.mjs) y el parche de las propiedades de firefox.exe. Contra Firefox: que las prefs se sigan leyendo, que
    los ids que ocultan las hojas sigan existiendo y que module.ver se siga leyendo como supone el parche. Si algo
    cambia, el resto de Firefox volvería a verse sin más aviso."""
    antes = len(fallos)
    # Las prefs, con su valor.
    valores = {}
    for rel in archivos():
        if rel.startswith("settings/prefs/") and rel.endswith(".js"):
            for m in re.finditer(r'^\s*pref\(\s*"([^"]+)"\s*,\s*([^)]+?)\s*\)\s*;', leer_bytes(rel).decode("utf-8"), re.M):
                valores[m.group(1)] = m.group(2)
    for n, w in PREFS_RESTOS.items():
        if valores.get(n) != w:
            mal(f"restos de Firefox: settings/prefs tiene que llevar {n} = {w} (ahora: {valores.get(n, 'nada')})")
    # Las hojas: cada id sigue en su regla.
    for hoja, ids in RESTOS_CSS.items():
        texto = leer_bytes(hoja).decode("utf-8")
        for i in ids:
            if i not in texto:
                mal(f"restos de Firefox: {hoja} ya no oculta «{i}»")
    # Sin «Buscar más idiomas…» (decisión del usuario, 2026-10-20): ningún código de Aegis enciende la descarga de
    # idiomas ni queda el botón (los paquetes de addons.mozilla.org traen la marca de Firefox).
    for rel in archivos():
        if rel.startswith("overlay/") and ext(rel) in (".mjs", ".js", ".ftl", ".css", ".html", ".xhtml"):
            texto = leer_bytes(rel).decode("utf-8", "replace")
            if "intl.multilingual.downloadEnabled" in texto or "PREF_DESCARGA_IDIOMAS" in texto:
                mal(f"restos de Firefox: {rel} toca intl.multilingual.downloadEnabled: Aegis no descarga idiomas")
            if re.search(r"aegis-idiomas-mas|aegis-mas-idiomas|masIdiomas", texto):
                mal(f"restos de Firefox: {rel} aún tiene «Buscar más idiomas…», que se quitó")
    # Acerca de: los enlaces de las condiciones y la privacidad llevan a páginas que existen en web/.
    acerca = leer_bytes("overlay/browser/components/aegis/acerca.sys.mjs").decode("utf-8")
    rutas = re.findall(r'\b(?:es|en): "([^"]+)"', acerca)
    if len(rutas) != 4:
        mal("restos de Firefox: acerca.sys.mjs tiene que llevar las cuatro páginas legales (es y en)")
    for r in rutas:
        if not os.path.isfile(os.path.join(REPO, "web", *r.strip("/").split("/"), "index.html")):
            mal(f"restos de Firefox: acerca.sys.mjs lleva a «{r}», que no existe en web/")
    # El parche de firefox.exe: fabricante de la marca, sin marca registrada y sin tocar el copyright.
    try:
        nombre = json.loads(leer_bytes("branding/marca.json").decode("utf-8"))["nombre"]
    except (OSError, ValueError, KeyError):
        nombre = "Aegis"
    with open(os.path.join(REPO, "patches", "series"), encoding="utf-8") as f:
        serie = [l.strip() for l in f if l.strip() and not l.lstrip().startswith("#")]
    if PARCHE_EXE not in serie or not os.path.isfile(os.path.join(REPO, "patches", PARCHE_EXE)):
        mal(f"restos de Firefox: falta patches/{PARCHE_EXE} en patches/series (propiedades de firefox.exe)")
    else:
        texto = leer_bytes(f"patches/{PARCHE_EXE}").decode("utf-8")
        # Solo el diff (el mensaje del commit también tiene líneas que empiezan por «-», una lista), archivo a archivo.
        trozos = re.split(r"^diff --git a/(\S+) b/\S+\n", texto, flags=re.M)[1:]
        por_archivo = dict(zip(trozos[::2], trozos[1::2]))
        if set(por_archivo) != set(MODULE_VER_EXE):
            mal(f"restos de Firefox: patches/{PARCHE_EXE} tiene que tocar justo {', '.join(MODULE_VER_EXE)} "
                f"(ahora: {', '.join(sorted(por_archivo)) or 'nada'})")
        for rel, diff in por_archivo.items():
            cambios = [l for l in diff.splitlines() if l[:1] in "+-" and not l.startswith(("+++", "---"))]
            if not {f"+WIN32_MODULE_COMPANYNAME={nombre}", "+WIN32_MODULE_TRADEMARKS="} <= set(cambios):
                mal(f"restos de Firefox: patches/{PARCHE_EXE} tiene que poner WIN32_MODULE_COMPANYNAME={nombre} y "
                    f"WIN32_MODULE_TRADEMARKS vacío en {rel}")
            if any(l.startswith("-") or "COPYRIGHT" in l for l in cambios):
                mal(f"restos de Firefox: patches/{PARCHE_EXE} solo añade líneas a {rel}: el copyright de Firefox "
                    "(MPL) se queda")
        # aegis.py build rehace el .rc de cada uno (rules.mk no lo hace al cambiar module.ver).
        construir = leer_bytes("tools/aegis.py").decode("utf-8")
        for rel in MODULE_VER_EXE:
            if f'("{rel.rsplit("/", 1)[0]}", ' not in construir:
                mal(f"restos de Firefox: tools/aegis.py (RECURSOS_DE_VERSION) no rehace el .rc de {rel}")
    src = None if rapido else arbol(v)
    if not src:
        aviso(f"restos de Firefox: sin comprobar contra Firefox {v} (no se encuentra el árbol preparado)")
    else:
        def leer(rel):
            with open(os.path.join(src, *rel.split("/")), encoding="utf-8", errors="replace") as h:
                return h.read()
        try:
            # Cada pref sigue leyéndose donde se cuenta en su comentario.
            lecturas = {
                "browser.netError.illustration.enabled": ("toolkit/content/net-error-card.mjs",
                                                          "browser/app/profile/firefox.js"),
                "groupLabels.enabled": ("browser/components/urlbar/UrlbarPrefs.sys.mjs",
                                        "browser/components/urlbar/content/UrlbarView.mjs"),
                "browser.aboutpdf.promo.dismissed": ("toolkit/components/aboutpdf/content/aboutPDF.mjs",),
                "pdfjs.featuresNotificationImpressionLimit": (
                    "toolkit/components/pdfjs/content/PdfJsFeaturesNotification.sys.mjs",),
            }
            for n, rels in lecturas.items():
                for rel in rels:
                    if n not in leer(rel):
                        mal(f"restos de Firefox: en Firefox {v}, {rel} ya no usa «{n}»: revisar la pref")
            for hoja, ids in RESTOS_CSS.items():
                for i, rel in ids.items():
                    if i not in leer(rel):
                        mal(f"restos de Firefox: «{i}» ya no está en {rel} de Firefox {v}: revisar {hoja}")
            # Ajustes › Idioma: la lista remota (y la opción de buscar más) solo con la pref encendida, que va apagada.
            idiomas = leer("browser/components/preferences/config/languages.mjs")
            if "if (!this.#multilingualDownloadEnabled.value || !this.#languagesLoaded)" not in idiomas:
                mal(f"restos de Firefox: en Firefox {v}, languages.mjs ya no pide la lista de idiomas solo con "
                    "intl.multilingual.downloadEnabled encendida: revisar 50-interfaz.js y docs/CONEXIONES.md "
                    "(«Idiomas de la interfaz»)")
            panel = leer("browser/components/customizableui/content/panelUI.js")
            if '"appMenu_" + node.id' not in panel or not re.search(
                    r'HELP_VIEW_GROUPS = \[\s*\[\s*"menu_openHelp",\s*"help_reportBrokenSite"', panel):
                mal(f"restos de Firefox: en Firefox {v}, el submenú Ayuda (panelUI.js) ya no copia las filas como "
                    "appMenu_<id> o no empieza por «Get help» y «Report Broken Site»: revisar las líneas y las "
                    "cápsulas de interfaz.css")
            dialogo = leer("browser/base/content/aboutDialog.xhtml")
            for l10n in ("bottom-links-terms", "bottom-links-privacy"):
                if not re.search(rf'class="bottom-link"[^>]*data-l10n-id="{l10n}"', dialogo):
                    mal(f"restos de Firefox: en Firefox {v}, aboutDialog.xhtml ya no tiene el enlace «{l10n}»: revisar "
                        "acerca.sys.mjs")
            if 'key.setAttribute("id", "key_quickRestart")' not in leer("browser/base/content/browser-development-helpers.js"):
                mal(f"restos de Firefox: en Firefox {v} el atajo de «Restart (Developer)» ya no es key_quickRestart: "
                    "revisar AegisArranque.sinReinicioDeDesarrollo")
            for rel in MODULE_VER_EXE:
                if not os.path.isfile(os.path.join(src, *rel.split("/"))):
                    mal(f"restos de Firefox: Firefox {v} ya no tiene {rel}: revisar {PARCHE_EXE}")
            rc = leer("config/create_rc.py")
            if "result[entry.strip()] = value.strip()" not in rc or 'overrides.get("WIN32_MODULE_TRADEMARKS"' not in rc:
                mal(f"restos de Firefox: en Firefox {v}, create_rc.py ya no lee module.ver como supone {PARCHE_EXE} "
                    "(la última entrada gana)")
            config = leer("services/settings/dumps/main/search-config-v2.json")
            for socio in ("perplexity", "ebay", "mercadolivre", "leo_ende_de"):
                if f'"identifier": "{socio}"' not in config and f'"identifier":"{socio}"' not in config:
                    aviso(f"restos de Firefox: el buscador de socio «{socio}» ya no está en la configuración de "
                          f"Firefox {v}: revisar SOCIOS en AegisArranque.sys.mjs")
        except OSError as e:
            mal(f"restos de Firefox: no se puede leer el árbol de Firefox {v}: {e}")
    if len(fallos) == antes:
        ok(f"restos de Firefox: {len(PREFS_RESTOS)} prefs, las hojas, Acerca de y {PARCHE_EXE}"
           + ("" if not src else f"; los puntos de Firefox {v} siguen igual"))


def sin_dev():
    """El cargador de desarrollo (autoconfig) solo vive en tools/dev: nunca en lo que entra en una build."""
    for rel in archivos():
        if rel.startswith(("overlay/", "settings/", "mozconfigs/", "patches/")) and ext(rel) in TEXTO_EXT:
            texto = leer_bytes(rel).decode("utf-8", "replace")
            if "general.config.filename" in texto:
                mal(f"{rel}: activa autoconfig (general.config.filename); eso es solo del modo desarrollo (tools/dev)")
            # eval en el proceso padre: lo necesita el cargador de desarrollo y nada más.
            if "security.allow_eval_in_parent_process" in texto:
                mal(f"{rel}: toca security.allow_eval_in_parent_process; eso es solo del modo desarrollo (tools/dev)")
    ok("el cargador de desarrollo no entra en la build")


def listas_moz_build():
    """mozbuild exige que las listas «+= [...]» de un moz.build estén ordenadas; si no, configure falla."""
    n = 0
    for rel in archivos():
        if not (rel.startswith("overlay/") and rel.endswith("moz.build")):
            continue
        texto = leer_bytes(rel).decode("utf-8", "replace")
        for m in re.finditer(r"\+= \[\n(.*?)\n\s*\]", texto, re.S):
            elementos = re.findall(r'"([^"]+)"', m.group(1))
            n += 1
            if elementos != sorted(elementos, key=str.lower):
                fuera = next(e for e, o in zip(elementos, sorted(elementos, key=str.lower)) if e != o)
                mal(f"{rel}: lista sin ordenar (mozbuild la rechaza en configure); el primero fuera de sitio: {fuera}")
    ok(f"listas de moz.build ordenadas ({n})")


def main():
    rapido = "--rapido" in sys.argv
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    print("Aegis · comprobaciones\n")
    codificacion()
    python()
    shell(rapido)
    json_validos()
    v = upstream()
    parches()
    mozconfigs()
    marca_y_claves()
    identidad(v, rapido)
    tienda()
    textos()
    idiomas(v, rapido)
    tokens()
    prefs(v, rapido)
    enfasis_propio(v, rapido)
    huella(v, rapido)
    contrasenas(v, rapido)
    nueva_pestana(v, rapido)
    migracion(v, rapido)
    transferencia()
    extensiones(v, rapido)
    acciones(v, rapido)
    buscadores(v, rapido)
    restos_firefox(v, rapido)
    motor(v, rapido)
    sin_dev()
    listas_moz_build()
    print(f"\n{'✗' if fallos else '✓'} {len(fallos)} fallos · {len(avisos)} avisos")
    return 1 if fallos else 0


if __name__ == "__main__":
    sys.exit(main())
