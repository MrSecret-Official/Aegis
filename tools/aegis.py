#!/usr/bin/env python3
"""Herramienta única de Aegis: de la fuente de Firefox a un navegador compilado y actualizable.

    aegis.py fetch                 descarga el tarball de upstream.json y lo verifica (sha256 + GPG)
    aegis.py prepare [--limpio]    descomprime, crea un repo git, aplica patches/series y overlay/
    aegis.py patch [--check]       aplica los parches que falten (o comprueba la serie entera, con cada motor)
    aegis.py overlay               vuelve a copiar overlay/ (y las claves MAR) al árbol
    aegis.py export                regenera patches/*.patch desde los commits del árbol
    aegis.py mozconfig [--objetivo …] [--marca unofficial|aegis]   (sin --objetivo, los de todos)
    aegis.py bootstrap [--objetivo …]  instala dependencias y compiladores (mach bootstrap)
    aegis.py build [--objetivo …] [--rapido]   compila (mach build; --rapido: solo interfaz, mach build faster)
    aegis.py run [args…]           arranca el navegador compilado (solo Linux)
    aegis.py package [--objetivo …]  empaqueta (mach package: zip en Windows, tar.xz en Linux)
    aegis.py instalar-prueba --destino /mnt/c/…   deja la build de Windows en una carpeta de Windows
    aegis.py claves-mar            crea las claves de firma de las actualizaciones (una vez)
    aegis.py mar [--objetivo …]    MAR completo firmado + update-<objetivo>-release.xml del paquete
    aegis.py publicar [--borrador] sube lo del manifiesto de la versión a GitHub Releases (gh)
    aegis.py msix [--prueba | --firma-local] [--privado]   paquete MSIX para la Microsoft Store (docs/TIENDA.md)
    aegis.py tor-fijar [--version …]  fija en tor/tor.json el Tor Expert Bundle que se ofrece descargar (GPG)
    aegis.py recursos-escudos      recursos neutros y scriptlets de Escudos (uBlock Origin y Brave fijados) al overlay
    aegis.py filtros               instantánea de las listas de Escudos de serie en filtros/ (va dentro de la build)
    aegis.py estado                versión, rutas y parches aplicados

Objetivos: windows-x86_64-cross (de serie; Windows compilado en cruzado) y linux-x86_64. Se ejecuta en
Linux (WSL Arch en el equipo de desarrollo), nunca como root. El trabajo vive en
$AEGIS_WORK (por defecto ~/aegis): fuente en src/firefox-<v>, objdir en obj/firefox-<v>, descargas
en cache/ y lo publicable en salida/. Nunca en /mnt/<unidad>: la E/S sobre NTFS es de 5 a 10 veces
más lenta y mach falla. Las claves privadas viven en ~/.config/aegis-firma (fuera del repo).

Códigos de salida: 0 bien · 1 error · 2 uso incorrecto · 3 verificación fallida.
"""
import argparse
import datetime
import glob
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tarfile
import tempfile
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
import xml.sax.saxutils
import zipfile

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORK = os.path.abspath(os.path.expanduser(os.environ.get("AEGIS_WORK", "~/aegis")))
CACHE = os.path.join(WORK, "cache")
SALIDA = os.path.join(WORK, "salida")
FIRMA = os.path.abspath(os.path.expanduser(os.environ.get("AEGIS_FIRMA", "~/.config/aegis-firma")))
ETIQUETA_BASE = "aegis-upstream"          # etiqueta git del commit con la fuente intacta
# Objetivos de compilación, en orden de prioridad: Windows (compilado en cruzado desde WSL, con el kit de
# Visual Studio y el SDK que descarga `--enable-bootstrap`) y Linux. El de serie lo cambia AEGIS_OBJETIVO.
OBJETIVOS = ("windows-x86_64-cross", "linux-x86_64")
OBJETIVO = os.environ.get("AEGIS_OBJETIVO", OBJETIVOS[0])
AUTOR = ["-c", "user.name=Aegis", "-c", "user.email=aegis@localhost"]
REMOLQUE = re.compile(r"^Aegis-Parche: (\S+)\s*$", re.M)
RUTA_PARCHE = re.compile(r"^\d{4}-[a-z0-9-]+/[\w.-]+\.patch$")

# Archivos de Firefox que Aegis sustituye a propósito (y solo estos): las claves públicas con las
# que el updater comprueba los MAR. Origen en el repo → destino en el árbol.
REEMPLAZOS = {
    "updates/claves/primaria.der": "toolkit/mozapps/update/updater/release_primary.der",
    "updates/claves/secundaria.der": "toolkit/mozapps/update/updater/release_secondary.der",
}

# Motor de Escudos (upstream.json › escudos › motor; sin la clave, el primero). "etp_engine": el fork de adblock-rust
# que Firefox trae en toolkit/components/content-classifier/etp_engine (de serie: no duplica código en xul.dll).
# "propio": plan B, nuestra copia de adblock-rust 0.12.1 en overlay/<MOTOR_DIR>/adblock. Un motor que no es el de serie
# cambia (1) los parches que tengan variante en patches/<grupo>/alternativos/<motor>/<nombre>.patch, que ocupan el
# sitio de <grupo>/<nombre>.patch de la serie (mismo remolque), y (2) el Cargo.toml del motor, que sale de
# Cargo.toml.<motor>. La copia propia solo se copia al árbol con el motor «propio».
MOTORES = ("etp_engine", "propio")
MOTOR_DIR = "browser/components/aegis/escudos/motor-nativo"
COPIA_PROPIA = MOTOR_DIR + "/adblock/"


class Error(Exception):
    def __init__(self, msg, codigo=1):
        super().__init__(msg)
        self.codigo = codigo


def info(msg):
    print(f"· {msg}", flush=True)


def hecho(msg):
    print(f"✓ {msg}", flush=True)


def escribir(ruta, texto, modo=None):
    """Escritura atómica: temporal en el mismo directorio y os.replace. Nunca un archivo a medias."""
    os.makedirs(os.path.dirname(ruta) or ".", exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=os.path.dirname(ruta) or ".", prefix=".aegis-")
    try:
        datos = texto if isinstance(texto, bytes) else texto.encode("utf-8")
        with os.fdopen(fd, "wb") as f:
            f.write(datos)
        if modo is not None:
            os.chmod(tmp, modo)
        os.replace(tmp, ruta)
    except BaseException:
        if os.path.exists(tmp):
            os.remove(tmp)
        raise


def leer_json(rel):
    with open(os.path.join(REPO, rel), encoding="utf-8") as f:
        return json.load(f)


def upstream():
    return leer_json("upstream.json")["firefox"]


def marca():
    return leer_json("branding/marca.json")


def motor_escudos():
    m = leer_json("upstream.json").get("escudos", {}).get("motor", MOTORES[0])
    if m not in MOTORES:
        raise Error(f"upstream.json › escudos › motor: «{m}» no es uno de {', '.join(MOTORES)}", 2)
    return m


def version_aegis():
    """Versión que ve el usuario: la de Firefox y la revisión de Aegis sobre ella (157.0.1-1)."""
    return f"{upstream()['version']}-{leer_json('upstream.json')['aegis']['revision']}"


def arbol(v=None):
    return os.path.join(WORK, "src", f"firefox-{v or upstream()['version']}")


def objdir(objetivo):
    base = os.path.join(WORK, "obj", f"firefox-{upstream()['version']}")
    return base if objetivo == "linux-x86_64" else f"{base}-{objetivo}"


def comprobar_entorno():
    if os.name != "posix":
        raise Error("aegis.py se ejecuta en Linux (WSL). Desde Windows usa tools/build-wsl.sh.", 2)
    if os.geteuid() == 0:
        raise Error("aegis.py no se ejecuta como root (mach tampoco): usa tools/build-wsl.sh", 2)
    if OBJETIVO not in OBJETIVOS:
        raise Error(f"AEGIS_OBJETIVO={OBJETIVO} no es un objetivo: {', '.join(OBJETIVOS)}", 2)
    if re.match(r"^/mnt/[a-z]/", WORK + "/"):
        raise Error(f"AEGIS_WORK={WORK} está en una unidad de Windows: usa el ext4 de WSL (~/aegis).", 2)


def run(cmd, cwd=None, env=None, check=True):
    r = subprocess.run(cmd, cwd=cwd, env=env)
    if check and r.returncode != 0:
        raise Error(f"falló ({r.returncode}): {' '.join(cmd)}")
    return r.returncode


def git(*args, cwd, check=True, salida=False, env=None):
    cmd = ["git", *AUTOR, *args]
    if salida:
        r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, env=env)
        if check and r.returncode != 0:
            raise Error(f"git {' '.join(args)}: {r.stderr.strip()}")
        return r.stdout
    return run(cmd, cwd=cwd, env=env, check=check)


def descargar(url, destino):
    """Descarga a un temporal y renombra al terminar: nunca queda un archivo a medias."""
    tmp = destino + ".parcial"
    info(f"descargando {url}")
    with urllib.request.urlopen(url, timeout=60) as r, open(tmp, "wb") as f:
        shutil.copyfileobj(r, f, 1 << 20)
    os.replace(tmp, destino)


def sha(ruta, algo="sha256"):
    h = hashlib.new(algo)
    with open(ruta, "rb") as f:
        for bloque in iter(lambda: f.read(1 << 20), b""):
            h.update(bloque)
    return h.hexdigest()


# --- Fuente --------------------------------------------------------------------------------------

def verificar_gpg(up, sumas, firma):
    """Comprueba que SHA256SUMS está firmado por la clave de Mozilla con la huella de upstream.json."""
    if not shutil.which("gpg"):
        raise Error("falta gpg para verificar la firma de Mozilla (pacman -S gnupg)", 3)
    clave = os.path.join(CACHE, "mozilla-KEY.asc")
    if not os.path.exists(clave):
        descargar(up["clave_url"], clave)
    with tempfile.TemporaryDirectory() as gh:
        base = ["gpg", "--homedir", gh, "--batch", "--quiet"]
        subprocess.run(base + ["--import", clave], check=True, capture_output=True)
        huellas = subprocess.run(base + ["--with-colons", "--fingerprint"], capture_output=True, text=True).stdout
        if up["clave_huella"] not in huellas:
            raise Error("la clave descargada no es la de Mozilla (huella distinta)", 3)
        r = subprocess.run(base + ["--status-fd", "1", "--verify", firma, sumas], capture_output=True, text=True)
        validas = [l for l in r.stdout.splitlines() if l.startswith("[GNUPG:] VALIDSIG ")]
        # VALIDSIG <huella de la subclave> … <huella de la clave principal> (último campo)
        if r.returncode != 0 or not any(l.split()[-1] == up["clave_huella"] for l in validas):
            raise Error("la firma de SHA256SUMS no es válida", 3)


def tarball():
    return os.path.join(CACHE, os.path.basename(upstream()["url"]))


def cmd_fetch(a):
    up = upstream()
    os.makedirs(CACHE, exist_ok=True)
    tb = tarball()
    if os.path.exists(tb) and sha(tb) == up["sha256"]:
        hecho(f"{os.path.basename(tb)} ya está descargado y verificado")
        return 0
    v = up["version"]
    sumas = os.path.join(CACHE, f"SHA256SUMS-{v}")
    firma = sumas + ".asc"
    descargar(up["sumas_url"], sumas)
    descargar(up["firma_url"], firma)
    verificar_gpg(up, sumas, firma)
    hecho("SHA256SUMS firmado por Mozilla")
    with open(sumas, encoding="utf-8") as f:
        linea = [l for l in f if l.rstrip().endswith(f"source/{os.path.basename(tb)}")]
    if not linea or linea[0].split()[0] != up["sha256"]:
        raise Error("la suma de upstream.json no coincide con SHA256SUMS firmado", 3)
    descargar(up["url"], tb)
    if sha(tb) != up["sha256"]:
        os.remove(tb)
        raise Error("el tarball descargado no coincide con su suma", 3)
    hecho(f"{os.path.basename(tb)} descargado y verificado")
    return 0


# --- Tor (descarga aparte, opcional) -----------------------------------------------------------------
#
# El navegador NO lleva tor dentro: lo descarga el usuario, si quiere, desde Ajustes › Privacidad › Tor
# (overlay/browser/components/aegis/tor/). Lo que sí va en la build es qué descargar y su sha256, en
# tor/tor.json, que escribe esta orden tras comprobar la firma GPG de los autores. Así el navegador no
# necesita gpg: le basta con comparar el sha256 fijado.

# Clave de firma de Tor Browser («Tor Browser Developers (signing key)»), que también firma el Expert Bundle.
# Huella publicada en support.torproject.org/tbb/how-to-verify-signature/ (comprobada el 2026-10-13).
TOR_HUELLA = "EF6E286DDA85EA2A4BA7DE684E2C6E8793298290"
# La misma clave por WKD, la vía que da esa página. Lo que vale es la huella, no de dónde venga la clave.
TOR_CLAVE_URL = ("https://openpgpkey.torproject.org/.well-known/openpgpkey/torproject.org/hu/"
                 "kounek7zrdx745qydx6p59t9mqjpuhdf")
# Versión estable actual de Tor Browser (y de su Expert Bundle) para Windows x86_64.
TOR_ULTIMA_URL = "https://aus1.torproject.org/torbrowser/update_3/release/download-windows-x86_64.json"
TOR_DIST = "https://dist.torproject.org/torbrowser/{v}/{archivo}"
# Cuando una versión sale de dist (solo guarda las últimas), sigue en el archivo histórico.
TOR_ARCHIVO = "https://archive.torproject.org/tor-package-archive/torbrowser/{v}/{archivo}"
TOR_JSON = os.path.join("overlay", "browser", "components", "aegis", "tor", "tor.json")
VERSION_TB = re.compile(r"^\d+\.\d+(\.\d+)?(a\d+)?$")


def verificar_gpg_tor(datos, firma):
    """Comprueba que `firma` (.asc) es una firma válida de `datos` hecha con la clave de TOR_HUELLA."""
    if not shutil.which("gpg"):
        raise Error("falta gpg para verificar la firma de Tor (pacman -S gnupg)", 3)
    clave = os.path.join(CACHE, "torbrowser-clave.gpg")
    if not os.path.exists(clave):
        descargar(TOR_CLAVE_URL, clave)
    with tempfile.TemporaryDirectory() as gh:
        base = ["gpg", "--homedir", gh, "--batch", "--quiet"]
        subprocess.run(base + ["--import", clave], check=True, capture_output=True)
        huellas = subprocess.run(base + ["--with-colons", "--fingerprint"], capture_output=True, text=True).stdout
        if f"fpr:::::::::{TOR_HUELLA}:" not in huellas:
            os.remove(clave)
            raise Error("la clave descargada no es la de Tor Browser (huella distinta)", 3)
        r = subprocess.run(base + ["--status-fd", "1", "--verify", firma, datos], capture_output=True, text=True)
        validas = [l for l in r.stdout.splitlines() if l.startswith("[GNUPG:] VALIDSIG ")]
        # VALIDSIG <huella de la subclave> … <huella de la clave principal> (último campo)
        if r.returncode != 0 or not any(l.split()[-1] == TOR_HUELLA for l in validas):
            raise Error(f"la firma de {os.path.basename(datos)} no es válida", 3)


def miembros_tar(ruta):
    """Lista (nombre, tamaño) de los archivos normales del .tar.gz, con las mismas reglas que el navegador:
    sin rutas absolutas ni «..», solo archivos y carpetas."""
    import tarfile
    archivos = []
    with tarfile.open(ruta, "r:gz") as t:
        for m in t.getmembers():
            partes = m.name.replace("\\", "/").split("/")
            if m.name.startswith("/") or ".." in partes:
                raise Error(f"el paquete trae una ruta peligrosa: {m.name}", 3)
            if m.isfile():
                archivos.append((m.name, m.size))
            elif not m.isdir():
                info(f"se ignorará (no es archivo ni carpeta): {m.name}")
    return archivos


def version_de_tor(ruta):
    """Versión de tor del paquete, leída de tor.exe: la cadena 0.x.y.z que más se repite (tor.exe nombra también
    alguna versión antigua, p. ej. «0.4.9.1-alpha» en un aviso). Solo informativa; None si no se encuentra."""
    import collections
    import tarfile
    with tarfile.open(ruta, "r:gz") as t:
        for m in t.getmembers():
            if m.isfile() and m.name == "tor/tor.exe":
                cuenta = collections.Counter(re.findall(rb"\b(0\.\d+\.\d+\.\d+)(?![\w.-])", t.extractfile(m).read()))
                return cuenta.most_common(1)[0][0].decode() if cuenta else None
    return None


def cmd_tor_fijar(a):
    """Fija la versión de tor que el navegador ofrece descargar: descarga el Tor Expert Bundle de Windows
    x86_64 y su firma de dist.torproject.org, comprueba la firma con la clave de Tor Browser y escribe tor.json
    con la versión, las dos URL (dist y el archivo histórico), el tamaño y el sha256."""
    v = a.version
    if not v:
        info(f"buscando la versión estable en {TOR_ULTIMA_URL}")
        with urllib.request.urlopen(TOR_ULTIMA_URL, timeout=60) as r:
            v = json.load(r).get("version", "")
    if not VERSION_TB.match(v or ""):
        raise Error(f"versión de Tor Browser no válida: {v!r}", 2)
    archivo = f"tor-expert-bundle-windows-x86_64-{v}.tar.gz"
    os.makedirs(CACHE, exist_ok=True)
    ruta = os.path.join(CACHE, archivo)
    firma = ruta + ".asc"
    urls = [TOR_DIST.format(v=v, archivo=archivo), TOR_ARCHIVO.format(v=v, archivo=archivo)]
    for destino, sufijo in ((ruta, ""), (firma, ".asc")):
        if os.path.exists(destino):
            continue
        for url in urls:
            try:
                descargar(url + sufijo, destino)
                break
            except OSError as e:
                info(f"no está en {url + sufijo}: {e}")
        else:
            raise Error(f"no se pudo descargar {archivo}{sufijo}", 1)
    try:
        verificar_gpg_tor(ruta, firma)
    except Error:
        # Ni el paquete ni su firma se reutilizan si no se han podido comprobar.
        for x in (ruta, firma):
            if os.path.exists(x):
                os.remove(x)
        raise
    hecho(f"{archivo} firmado por Tor Browser Developers ({TOR_HUELLA})")
    miembros = miembros_tar(ruta)
    nombres = {n for n, _ in miembros}
    for necesario in ("tor/tor.exe",):
        if necesario not in nombres:
            raise Error(f"el paquete no trae {necesario}: ¿ha cambiado su formato?", 3)
    for n, t in miembros:
        info(f"  {t:>10}  {n}")
    datos = {
        "version": v,
        "tor": version_de_tor(ruta),
        "archivo": archivo,
        "urls": urls,
        "tamano": os.path.getsize(ruta),
        "sha256": sha(ruta),
        "firma": {"huella": TOR_HUELLA, "comprobada": True},
    }
    escribir(os.path.join(REPO, TOR_JSON), json.dumps(datos, indent=2, ensure_ascii=False) + "\n")
    hecho(f"{TOR_JSON}: Tor Browser {v} (tor {datos['tor'] or '¿?'}), {datos['tamano']} bytes, sha256 "
          f"{datos['sha256']}")
    return 0


# --- Escudos: recursos neutros y scriptlets -------------------------------------------------------------
#
# Las reglas $redirect y ##+js de las listas usan una biblioteca de recursos (data: neutros como noop.js o
# googlesyndication_adsbygoogle.js) y de scriptlets (set-constant, abort-on-property-read…). Se generan aquí, al
# construir, desde una etiqueta fijada de uBlock Origin (GPL-3.0) y un commit fijado de brave/adblock-resources
# (MPL-2.0), comprobados con el sha256 de upstream.json › escudos. El resultado (escudos/recursos.json, formato
# `Resource` de adblock-rust) va dentro de la build: el navegador nunca descarga JS para inyectar en las webs. Se
# revisa con cada versión de Aegis (`aegis.py recursos-escudos` tras subir la etiqueta en upstream.json).

RECURSOS_GENERADOR = os.path.join("tools", "recursos-escudos.mjs")
# El código de Escudos en el overlay (el motor, adblock-rust en gkrust, está en escudos/motor-nativo/).
ESCUDOS_DESTINO = os.path.join("overlay", "browser", "components", "aegis", "escudos")


def fuente_escudos(clave, datos):
    """Descarga (una vez, a la caché) y comprueba con su sha256 una fuente de upstream.json › escudos."""
    os.makedirs(os.path.join(CACHE, "escudos"), exist_ok=True)
    ruta = os.path.join(CACHE, "escudos", f"{clave}-{datos.get('version') or datos['commit'][:12]}.tar.gz")
    if not os.path.exists(ruta) or sha(ruta) != datos["sha256"]:
        descargar(datos["url"], ruta)
    suma = sha(ruta)
    if suma != datos["sha256"]:
        os.remove(ruta)
        raise Error(f"{clave}: el sha256 descargado ({suma}) no es el de upstream.json ({datos['sha256']})", 3)
    return ruta


def extraer_tar(ruta, destino):
    """Extrae un .tar.gz sin salir de `destino` (sin rutas absolutas, «..», enlaces ni dispositivos). Devuelve la
    carpeta raíz del archivo."""
    with tarfile.open(ruta, "r:gz") as t:
        raices = set()
        for m in t.getmembers():
            nombre = m.name
            if nombre.startswith("/") or ".." in nombre.split("/") or not (m.isfile() or m.isdir()):
                if m.issym() or m.islnk():
                    continue            # los enlaces de los repositorios no hacen falta
                raise Error(f"{os.path.basename(ruta)}: entrada no admitida en el archivo: {nombre}", 3)
            raices.add(nombre.split("/")[0])
            t.extract(m, destino, set_attrs=False, filter="data")
    if len(raices) != 1:
        raise Error(f"{os.path.basename(ruta)}: se esperaba una sola carpeta raíz ({', '.join(sorted(raices))})", 3)
    return os.path.join(destino, raices.pop())


def cmd_recursos_escudos(a):
    fuentes = leer_json("upstream.json").get("escudos")
    if not fuentes or "ublock" not in fuentes or "brave" not in fuentes:
        raise Error("upstream.json no fija las fuentes de los recursos de Escudos (escudos › ublock y brave)", 2)
    node = shutil.which("node") or os.path.expanduser("~/.mozbuild/node/bin/node")
    if not os.path.exists(node):
        raise Error("no encuentro Node (el de mozbuild: ejecuta antes `aegis.py bootstrap`)", 2)
    ubo_tar = fuente_escudos("ublock", fuentes["ublock"])
    brave_tar = fuente_escudos("brave", fuentes["brave"])
    with tempfile.TemporaryDirectory(prefix="aegis-recursos-") as tmp:
        ubo = extraer_tar(ubo_tar, os.path.join(tmp, "ublock"))
        brave = extraer_tar(brave_tar, os.path.join(tmp, "brave"))
        salida = os.path.join(tmp, "recursos.json")
        # El generador se copia fuera de las fuentes descargadas: Node resuelve los módulos desde donde está el script.
        generador = os.path.join(tmp, "generador", "recursos-escudos.mjs")
        os.makedirs(os.path.dirname(generador))
        shutil.copyfile(os.path.join(REPO, RECURSOS_GENERADOR), generador)
        r = subprocess.run([node, generador, ubo, brave, salida], cwd=os.path.dirname(generador),
                           capture_output=True, text=True)
        if r.returncode != 0:
            raise Error("el generador de recursos falló:\n" + "\n".join(r.stderr.strip().splitlines()[-20:]))
        for linea in r.stdout.strip().splitlines():
            info(linea.strip())
        with open(salida, encoding="utf-8") as f:
            recursos = json.load(f)
    # Comprobaciones mínimas del formato Resource de adblock-rust (lo que no cuadre, el motor lo ignoraría sin avisar).
    if not isinstance(recursos, list) or len(recursos) < 100:
        raise Error(f"recursos.json: se esperaban más de 100 recursos y hay {len(recursos)}", 3)
    nombres = set()
    for x in recursos:
        if not isinstance(x.get("name"), str) or not isinstance(x.get("content"), str) or "kind" not in x:
            raise Error(f"recursos.json: recurso mal formado ({str(x)[:80]})", 3)
        nombres.add(x["name"])
    for imprescindible in ("noop.js", "googlesyndication_adsbygoogle.js", "set-constant.js", "safe-self.fn",
                           "abort-on-property-read.js", "1x1.gif"):
        if imprescindible not in nombres:
            raise Error(f"recursos.json: falta {imprescindible}", 3)
    destino = os.path.join(REPO, ESCUDOS_DESTINO, "recursos.json")
    datos = json.dumps(recursos, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    escribir(destino, datos + b"\n")
    hecho(f"recursos.json: {len(recursos)} recursos, {len(datos) // 1024} KB (uBlock Origin "
          f"{fuentes['ublock']['version']}, brave/adblock-resources {fuentes['brave']['commit'][:12]})")
    print(f"  Pasa {ESCUDOS_DESTINO.replace(os.sep, '/')}/recursos.json por las revisiones antes de compilar.")
    return 0


# --- Escudos: instantánea de las listas -----------------------------------------------------------------
#
# Las listas de serie de Escudos van dentro de la build (omni.ja) para que el bloqueador funcione desde el primer
# arranque sin ninguna conexión. Se descargan de sus autores (las URL de escudos/catalogo.json), se comprueban igual
# que en el navegador (título, tamaño) y se guardan en filtros/ tal cual, con los finales de línea en LF. Las licencias
# y la atribución van al lado (filtros/licencias/, filtros/AVISO.txt). `overlay` las copia al árbol en
# browser/components/aegis/escudos/filtros/ y el moz.build de Aegis las empaqueta. Se rehace antes de cada versión.

CATALOGO = os.path.join("overlay", "browser", "components", "aegis", "escudos", "catalogo.json")
FILTROS = "filtros"
FILTROS_DESTINO = "browser/components/aegis/escudos/filtros"
LICENCIAS = {
    # El LICENSE que publican los autores de uBlock filters (texto íntegro de la GPL-3.0).
    "GPL-3.0.txt": "https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/LICENSE",
    "CC-BY-SA-3.0.txt": "https://creativecommons.org/licenses/by-sa/3.0/legalcode.txt",
    "MPL-2.0.txt": "https://www.mozilla.org/media/MPL/2.0/index.txt",
}
TITULO_LISTA = re.compile(r"^! Title: *(.+?) *$", re.M)
EXPIRES_LISTA = re.compile(r"^! Expires: *(\d+) *(days?|hours?|d|h)\b", re.M | re.I)
INCLUDE_LISTA = re.compile(r"^!#include +(\S+)", re.M)


def bajar_lista(url):
    """Una descarga sin cookies ni Referer, como la hará el navegador (urllib no manda ninguna de las dos)."""
    pet = urllib.request.Request(url, headers={"Accept-Language": "en-US,en;q=0.5", "User-Agent": "aegis.py"})
    with urllib.request.urlopen(pet, timeout=60) as r:
        if r.status != 200:
            raise Error(f"{url}: HTTP {r.status}")
        return r.read()


def comprobar_lista(l, datos, url):
    """Las mismas comprobaciones que listas.sys.mjs: tamaño entre límites y título esperado."""
    minimo, maximo = l["tamano"]
    if not minimo <= len(datos) <= maximo:
        raise Error(f"{l['id']} ({url}): {len(datos)} bytes, fuera de [{minimo}, {maximo}]", 3)
    texto = datos.decode("utf-8")
    m = TITULO_LISTA.search(texto[:4096])
    if not m or not m.group(1).startswith(l["titulo"]):
        raise Error(f"{l['id']} ({url}): el título no es «{l['titulo']}…» ({m.group(1) if m else 'sin título'})", 3)
    return texto.replace("\r\n", "\n").replace("\r", "\n")


# Dónde está la fuente de cada lista (va al final de filtros/AVISO.txt).
AVISO_FUENTES = [
    "Dónde está la fuente (la «forma preferida» para modificar cada lista):",
    "- uBlock filters: las versiones .min.txt (uAssetsCDN) se generan de los archivos de filters/ del repositorio",
    "  https://github.com/uBlockOrigin/uAssets (filters.txt, privacy.txt, badware.txt, quick-fixes.txt, unbreak.txt,",
    "  annoyances*.txt), en la versión de la fecha de su línea «! Last modified».",
    "- AdGuard: las listas compiladas de filters.adtidy.org se generan de las carpetas de",
    "  https://github.com/AdguardTeam/AdguardFilters (BaseFilter, SpywareFilter, AnnoyancesFilter, SpanishFilter,",
    "  FrenchFilter…) con https://github.com/AdguardTeam/FiltersCompiler, en la versión de su línea «! Version».",
    "- EasyList y sus listas: se generan de los repositorios de https://github.com/easylist (easylist, easylistgermany,",
    "  easylistspanish, easylistitaly, antiadblockfilters), en la versión de su línea «! Version».",
    "- Brave: los archivos de https://github.com/brave/adblock-lists ya son la fuente.",
    "",
    "Aviso: que estas listas puedan ir dentro de Aegis como obras separadas junto a un programa MPL-2.0 (agregación) está",
    "pendiente de una revisión jurídica antes de publicar.",
    "",
]


def cmd_filtros(a):
    with open(os.path.join(REPO, CATALOGO), encoding="utf-8") as f:
        catalogo = json.load(f)["listas"]
    destino = os.path.join(REPO, FILTROS)
    os.makedirs(os.path.join(destino, "licencias"), exist_ok=True)
    for nombre, url in LICENCIAS.items():
        ruta = os.path.join(destino, "licencias", nombre)
        if not os.path.exists(ruta):
            escribir(ruta, bajar_lista(url).decode("utf-8").replace("\r\n", "\n"))
            hecho(f"licencia {nombre}")
    indice = {"fecha": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "listas": {}}
    archivos = []
    for l in catalogo:
        ultimo = None
        for url in l["urls"]:
            try:
                texto = comprobar_lista(l, bajar_lista(url), url)
                break
            except (OSError, Error, UnicodeDecodeError) as e:
                ultimo = e
                info(f"{l['id']}: {url} no vale ({e}); se prueba la siguiente")
        else:
            raise Error(f"{l['id']}: ninguna URL de su autor ha servido ({ultimo})", 1)
        incluidas = {}
        for nombre in sorted(set(INCLUDE_LISTA.findall(texto))):
            if ".." in nombre or "://" in nombre or not re.fullmatch(r"[\w.-]+(?:/[\w.-]+)*", nombre):
                continue
            sub = url.rsplit("/", 1)[0] + "/" + nombre
            archivo = f"{l['id']}--{nombre.replace('/', '--')}"
            datos = bajar_lista(sub).decode("utf-8").replace("\r\n", "\n")
            escribir(os.path.join(destino, archivo), datos)
            incluidas[nombre] = archivo
            archivos.append(archivo)
        archivo = f"{l['id']}.txt"
        escribir(os.path.join(destino, archivo), texto)
        archivos.append(archivo)
        e = EXPIRES_LISTA.search(texto[:4096])
        horas = (int(e.group(1)) * (24 if e.group(2).lower().startswith("d") else 1)) if e else None
        reglas = sum(1 for x in texto.split("\n") if x and not x.startswith(("!", "[")))
        indice["listas"][l["id"]] = {
            "archivo": archivo, "url": url, "titulo": TITULO_LISTA.search(texto[:4096]).group(1),
            "licencia": l["licencia"], "autor": l["autor"], "tamano": len(texto.encode("utf-8")),
            "sha256": hashlib.sha256(texto.encode("utf-8")).hexdigest(), "reglas": reglas, "expira_horas": horas,
            "incluidas": incluidas,
        }
        hecho(f"{l['id']}: {reglas} reglas, {len(texto) // 1024} KB ({url})")
    for viejo in os.listdir(destino):
        if viejo.endswith(".txt") and viejo not in archivos and viejo != "AVISO.txt":
            os.remove(os.path.join(destino, viejo))
            info(f"retirada {viejo}")
    escribir(os.path.join(destino, "filtros.json"), json.dumps(indice, indent=1, ensure_ascii=False) + "\n")
    aviso = ["Listas de filtros de Escudos incluidas en Aegis, tal como las publican sus autores (solo con los finales",
             "de línea en LF). Son obras de sus autores, distribuidas junto a Aegis con su licencia; Aegis no las",
             "modifica. Cada una se actualiza sola desde la URL de su autor. Licencias en licencias/.", ""]
    for l in catalogo:
        d = indice["listas"][l["id"]]
        aviso.append(f"- {d['titulo']} ({d['archivo']}): {l['autor']}. Licencia: {l['licencia']}. Origen: {d['url']}")
    aviso += ["", "EasyList, EasyPrivacy, Adblock Warning Removal List y las regionales de EasyList: © The EasyList",
              "authors (https://easylist.to/), con licencia GPL-3.0 o CC BY-SA 3.0, a elegir.",
              "uBlock filters: © Raymond Hill y colaboradores de uBlockOrigin/uAssets, GPL-3.0.",
              "Listas de AdGuard: © AdGuard Software Ltd y colaboradores de AdguardTeam/AdguardFilters, GPL-3.0.",
              "Listas de Brave: © Brave Software, MPL-2.0.", ""] + AVISO_FUENTES
    escribir(os.path.join(destino, "AVISO.txt"), "\n".join(aviso))
    # El moz.build de Aegis tiene que empaquetarlas todas.
    with open(os.path.join(REPO, "overlay", "browser", "components", "aegis", "moz.build"), encoding="utf-8") as f:
        mozbuild = f.read()
    faltan = [x for x in archivos + ["filtros.json", "AVISO.txt"] if f'"escudos/filtros/{x}"' not in mozbuild]
    if faltan:
        raise Error("el moz.build de Aegis no empaqueta: " + ", ".join(faltan), 3)
    total = sum(d["tamano"] for d in indice["listas"].values())
    hecho(f"instantánea de {len(catalogo)} listas en {FILTROS}/ ({total // 1048576} MB)")
    print(f"  Pasa {FILTROS}/ por las revisiones antes de compilar.")
    return 0


# --- Parches -------------------------------------------------------------------------------------

def series():
    """Parches de patches/series, en orden."""
    out = []
    with open(os.path.join(REPO, "patches", "series"), encoding="utf-8") as f:
        for l in f:
            l = l.strip()
            if l and not l.startswith("#"):
                if not RUTA_PARCHE.match(l):
                    raise Error(f"patches/series: «{l}» no tiene la forma NNNN-grupo/nombre.patch", 2)
                if not os.path.isfile(os.path.join(REPO, "patches", l)):
                    raise Error(f"patches/series cita {l}, que no existe")
                out.append(l)
    if len(set(out)) != len(out):
        raise Error("patches/series tiene parches repetidos", 2)
    return out


def ruta_parche(p, motor=None):
    """Archivo (relativo a patches/) que ocupa el sitio `p` de la serie con ese motor de Escudos (de serie, el de
    upstream.json): su variante de alternativos/<motor>/ si la tiene; si no, el mismo."""
    motor = motor or motor_escudos()
    if motor != MOTORES[0]:
        grupo, nombre = p.split("/", 1)
        alt = f"{grupo}/alternativos/{motor}/{nombre}"
        if os.path.isfile(os.path.join(REPO, "patches", alt)):
            return alt
    return p


def con_variantes():
    """Motores con algún parche alternativo (el de serie, siempre)."""
    return [m for m in MOTORES if m == MOTORES[0] or any(ruta_parche(p, m) != p for p in series())]


def commits_aegis(src):
    """[(hash, ruta del remolque o None)] de los commits sobre la base, en orden. Único lector del remolque."""
    crudo = git("log", "--reverse", "--format=%H%x00%B%x1e", f"{ETIQUETA_BASE}..HEAD", cwd=src, salida=True)
    out = []
    for bloque in crudo.split("\x1e"):
        bloque = bloque.strip("\n")
        if not bloque:
            continue
        h, _, cuerpo = bloque.partition("\x00")
        m = REMOLQUE.findall(cuerpo)
        out.append((h.strip(), m[-1] if m else None))
    return out


def aplicados(src):
    return [r for _, r in commits_aegis(src) if r]


def comprobar_serie(src, motor=None):
    """Aplica la serie entera (con las variantes del motor de Escudos dado), en orden y acumulando, sobre un índice
    temporal con la fuente intacta. No toca el árbol de trabajo ni el índice real."""
    motor = motor or motor_escudos()
    fd, idx = tempfile.mkstemp(prefix="aegis-indice-")
    os.close(fd)
    os.remove(idx)
    env = dict(os.environ, GIT_INDEX_FILE=idx)
    try:
        git("read-tree", ETIQUETA_BASE, cwd=src, env=env)
        for p in series():
            p = ruta_parche(p, motor)
            ruta = os.path.join(REPO, "patches", p)
            r = subprocess.run(["git", "apply", "--cached", "--check", ruta], cwd=src, env=env,
                               capture_output=True, text=True)
            if r.returncode != 0:
                raise Error(f"{p} no se aplica sobre la fuente más los anteriores:\n{r.stderr.strip()}", 3)
            git("apply", "--cached", ruta, cwd=src, env=env)
            hecho(f"{p} se aplica")
    finally:
        if os.path.exists(idx):
            os.remove(idx)
    hecho(f"la serie completa ({len(series())} parches, motor de Escudos «{motor}») se aplica sobre "
          f"Firefox {upstream()['version']}")
    return 0


def mismo_parche(src, h, r, motor):
    return patch_id(src, commit=h) == patch_id(src, archivo=os.path.join(REPO, "patches", ruta_parche(r, motor)))


def rebobinar_motor(src, commits, motor):
    """Si upstream.json pide otro motor de Escudos que el del árbol, vuelve (git reset --keep) al commit anterior al
    primer parche del otro motor, para que aplicar_parches ponga los de este: sin rehacer el árbol ni perder la
    compilación (solo cambian los archivos de esos parches). Solo si no se pierde nada: cada commit desde ahí tiene que
    ser exactamente un archivo de patches/ (de algún motor). Devuelve True si ha rebobinado."""
    for i, (h, r) in enumerate(commits):
        if not r or mismo_parche(src, h, r, motor):
            continue
        otro = next((m for m in MOTORES if m != motor and mismo_parche(src, h, r, m)), None)
        if not otro:
            return False                      # un parche cambiado de verdad: lo dice aplicar_parches
        for h2, r2 in commits[i:]:
            if not r2 or not any(mismo_parche(src, h2, r2, m) for m in MOTORES):
                raise Error(f"el árbol tiene el motor de Escudos «{otro}» y upstream.json pide «{motor}», pero el "
                            f"commit {h2[:10]} ({r2 or 'sin remolque'}) no está tal cual en patches/: haz `export` "
                            "antes (o `prepare --limpio`)", 2)
        info(f"el árbol tiene el motor de Escudos «{otro}» y upstream.json pide «{motor}»: se vuelve a antes de {r} "
             "(git reset --keep; el resto del árbol y el objdir no se tocan)")
        git("reset", "--quiet", "--keep", f"{h}^", cwd=src)
        return True
    return False


def patch_id(src, commit=None, archivo=None):
    """Huella del contenido de un parche (git patch-id --stable): igual para el commit y su .patch."""
    if commit:
        texto = git("show", "--format=", "--binary", commit, cwd=src, salida=True)
    else:
        with open(archivo, encoding="utf-8") as f:
            texto = f.read()
    r = subprocess.run(["git", "patch-id", "--stable"], cwd=src, input=texto, capture_output=True, text=True)
    if r.returncode != 0 or not r.stdout.split():
        raise Error(f"git patch-id no pudo leer {'el commit ' + commit[:10] if commit else archivo}", 3)
    return r.stdout.split()[0]


def aplicar_parches(src):
    """Aplica lo que falte de la serie (con las variantes del motor de Escudos de upstream.json). Devuelve True si ha
    tenido que cambiar de motor (rebobinar_motor): entonces hay que volver a copiar el overlay."""
    ser = series()
    motor = motor_escudos()
    ap = aplicados(src)
    if ap != ser[:len(ap)]:
        raise Error("los parches del árbol no son el principio de patches/series (cambió el orden): "
                    "usa `aegis.py prepare --limpio`", 2)
    cambio = rebobinar_motor(src, commits_aegis(src), motor)
    if cambio:
        ap = aplicados(src)
    for h, r in commits_aegis(src):        # un .patch cambiado después de aplicarlo
        if r and not mismo_parche(src, h, r, motor):
            raise Error(f"{ruta_parche(r, motor)} ha cambiado desde que se aplicó en el árbol: usa "
                        "`aegis.py prepare --limpio` (o `export` si el cambio está en el árbol)", 2)
    for p in ser[len(ap):]:
        ruta = os.path.join(REPO, "patches", ruta_parche(p, motor))
        # am conserva autor y mensaje; el remolque Aegis-Parche une el commit con su archivo.
        if git("am", "--quiet", "--keep-cr", ruta, cwd=src, check=False) != 0:
            git("am", "--abort", cwd=src, check=False)
            raise Error(f"{p} no se aplica: corrige el parche (git am lo dejó tal cual estaba)", 3)
        h, r = commits_aegis(src)[-1]
        if r != p:
            msg = git("log", "-1", "--format=%B", cwd=src, salida=True).rstrip()
            msg = REMOLQUE.sub("", msg).rstrip()
            git("commit", "--quiet", "--amend", "-m", f"{msg}\n\nAegis-Parche: {p}", cwd=src)
        hecho(f"{ruta_parche(p, motor)} aplicado")
    if len(ser) == len(ap):
        hecho("parches al día")
    return cambio


# --- Overlay y claves ----------------------------------------------------------------------------

def copiar_overlay(src):
    """overlay/ se copia sobre el árbol (archivos NUEVOS de Aegis; no se commitea: queda en
    .git/info/exclude para que `export` solo vea los parches). Más los REEMPLAZOS (claves MAR)."""
    base = os.path.join(REPO, "overlay")
    seguidos = set(git("ls-files", "-z", cwd=src, salida=True).split("\0"))
    ex = os.path.join(src, ".git", "info", "exclude")
    anteriores = set()
    if os.path.exists(ex):
        with open(ex, encoding="utf-8") as f:
            anteriores = {l.strip()[1:] for l in f if l.startswith("/") and not l.startswith(("/mozconfig", "/obj-"))}
    nuevos = []
    motor = motor_escudos()
    # overlay/ tal cual y, además, la instantánea de las listas de Escudos (filtros/, `aegis.py filtros`) dentro del
    # código de Escudos, donde la empaqueta el moz.build de Aegis.
    origenes = [(base, "")]
    if os.path.isdir(os.path.join(REPO, FILTROS)):
        origenes.append((os.path.join(REPO, FILTROS), FILTROS_DESTINO + "/"))
    for origen, prefijo in origenes:
        for raiz, _, archivos in os.walk(origen):
            for a in archivos:
                if a == ".gitkeep":
                    continue
                o = os.path.join(raiz, a)
                rel = prefijo + os.path.relpath(o, origen).replace(os.sep, "/")
                # Motor de Escudos: las variantes Cargo.toml.<motor> solo como Cargo.toml del motor elegido, y la copia
                # propia de adblock-rust solo con el motor «propio».
                if rel.startswith(MOTOR_DIR + "/Cargo.toml.") or (rel.startswith(COPIA_PROPIA) and motor != "propio"):
                    continue
                variante = rel == MOTOR_DIR + "/Cargo.toml" and motor != MOTORES[0]
                if variante:
                    o = os.path.join(base, MOTOR_DIR, f"Cargo.toml.{motor}")
                    if not os.path.isfile(o):
                        raise Error(f"falta overlay/{MOTOR_DIR}/Cargo.toml.{motor} (motor de Escudos «{motor}»)", 2)
                if rel in seguidos:
                    raise Error(f"overlay/{rel} pisaría un archivo de Firefox: eso se hace con un parche", 2)
                d = os.path.join(src, rel)
                os.makedirs(os.path.dirname(d), exist_ok=True)
                if rel == MOTOR_DIR + "/Cargo.toml" and os.path.isfile(d) and not mismo_contenido(o, d):
                    shutil.copyfile(o, d)      # al cambiar de motor, con la hora de ahora (Cargo mira la fecha)
                else:
                    shutil.copy2(o, d)
                nuevos.append(rel)
    copia_retirada = 0
    for rel in sorted(anteriores - set(nuevos)):   # quitado de overlay/: fuera del árbol también
        p = os.path.join(src, rel)
        if os.path.isfile(p):
            os.remove(p)
            if rel.startswith(COPIA_PROPIA):
                copia_retirada += 1
            else:
                info(f"overlay: retirado {rel}")
            try:                                   # y las carpetas que queden vacías (la copia propia del motor)
                os.removedirs(os.path.dirname(p))
            except OSError:
                pass
    if copia_retirada:
        info(f"overlay: retirada la copia propia de adblock-rust ({copia_retirada} archivos de {COPIA_PROPIA})")
    if motor != MOTORES[0]:
        hecho(f"overlay: motor de Escudos «{motor}» (Cargo.toml.{motor})")
    generados = generar_prefs(src)
    escribir(ex, "# generado por aegis.py: archivos de overlay/ y generados\n/mozconfig*\n/obj-*/\n" +
             "".join(f"/{r}\n" for r in sorted(nuevos + generados)))
    hecho(f"overlay: {len(nuevos)} archivos copiados")
    claves = 0
    for origen, destino in REEMPLAZOS.items():
        o = os.path.join(REPO, origen)
        if os.path.isfile(o):
            shutil.copyfile(o, os.path.join(src, destino))
            claves += 1
    if claves == len(REEMPLAZOS):
        hecho("claves MAR de Aegis instaladas en el updater")
    else:
        info("sin claves MAR de Aegis (updates/claves/): el updater no aceptará actualizaciones. "
             "Créalas una vez con `aegis.py claves-mar`")


def mismo_contenido(a, b):
    with open(a, "rb") as fa, open(b, "rb") as fb:
        return fa.read() == fb.read()


PREFS_DESTINO = "browser/branding/aegis/pref/firefox-branding.js"
PREFS_MARCA = os.path.join("overlay", "browser", "branding", "aegis", "pref", "firefox-branding.js")


def generar_prefs(src):
    """firefox-branding.js de la marca en el árbol = el del overlay + settings/prefs/*.js (en orden), con @REPO@
    sustituido (branding/marca.json). Es el archivo de prefs de la marca que sí empaqueta package-manifest.in y que
    se lee después de firefox.js, así que gana; las de settings van detrás para ganar también a las de la marca."""
    base = os.path.join(REPO, "settings", "prefs")
    if not os.path.isdir(os.path.join(src, os.path.dirname(PREFS_DESTINO))):
        return []
    with open(os.path.join(REPO, PREFS_MARCA), encoding="utf-8") as f:
        partes = [f.read(), "\n// --- Generado por tools/aegis.py a partir de settings/prefs/. No editar aquí. ---\n"]
    for nombre in sorted(n for n in os.listdir(base) if n.endswith(".js")):
        with open(os.path.join(base, nombre), encoding="utf-8") as f:
            partes.append(f"\n// --- settings/prefs/{nombre} ---\n" + f.read())
    texto = "".join(partes).replace("@REPO@", marca()["publicacion"]["github"])
    if re.search(r"@[A-Z_]+@", texto):
        raise Error(f"settings/prefs con marcadores sin sustituir: {sorted(set(re.findall(r'@[A-Z_]+@', texto)))}", 2)
    escribir(os.path.join(src, PREFS_DESTINO), texto)
    hecho(f"prefs: {len(partes) - 2} archivos de settings/prefs en {PREFS_DESTINO}")
    return [PREFS_DESTINO]


def cmd_claves_mar(a):
    """Dos pares RSA de 4096 bits (primaria para firmar, secundaria de reserva para rotar). La privada
    nunca sale de ~/.config/aegis-firma; los certificados públicos van al repo y al updater."""
    if not shutil.which("openssl"):
        raise Error("falta openssl", 2)
    os.makedirs(FIRMA, mode=0o700, exist_ok=True)
    os.chmod(FIRMA, 0o700)
    for nombre in ("primaria", "secundaria"):
        clave = os.path.join(FIRMA, f"mar-{nombre}.pem")
        der = os.path.join(REPO, "updates", "claves", f"{nombre}.der")
        if not os.path.exists(clave):
            tmp = clave + ".parcial"
            run(["openssl", "genrsa", "-out", tmp, "4096"])
            os.chmod(tmp, 0o600)
            os.replace(tmp, clave)
            hecho(f"clave {nombre} creada en {clave}")
        else:
            info(f"la clave {nombre} ya existe: no se toca")
        r = subprocess.run(["openssl", "req", "-new", "-x509", "-key", clave, "-outform", "DER", "-days", "36500",
                            "-subj", f"/CN=Aegis MAR {nombre}", "-sha384"], capture_output=True)
        if r.returncode != 0:
            raise Error(f"openssl req: {r.stderr.decode(errors='replace').strip()}")
        actual = open(der, "rb").read() if os.path.exists(der) else None
        pub_clave = pub_de_clave(clave)
        if not pub_clave or not r.stdout:
            raise Error(f"openssl no pudo leer la clave {nombre}", 3)
        if actual and pub_de_der(actual) == pub_clave:
            info(f"updates/claves/{nombre}.der ya corresponde a la clave")
            continue
        if actual:
            raise Error(f"updates/claves/{nombre}.der es de OTRA clave: no se sustituye (los equipos instalados "
                        "dejarían de aceptar actualizaciones). Restaura la clave privada de la copia de seguridad.", 3)
        escribir(der, r.stdout)
        hecho(f"certificado público en updates/claves/{nombre}.der")
    print("! Haz una copia de seguridad de " + FIRMA + " fuera del equipo: sin la clave primaria, "
          "los Aegis instalados no aceptarán más actualizaciones.")
    return 0


def pub_de_der(der):
    r = subprocess.run(["openssl", "x509", "-inform", "DER", "-noout", "-pubkey"], input=der, capture_output=True)
    return r.stdout.strip() if r.returncode == 0 else None


def pub_de_clave(clave):
    r = subprocess.run(["openssl", "pkey", "-in", clave, "-pubout"], capture_output=True)
    return r.stdout.strip() if r.returncode == 0 else None


# --- Configuración y compilación -----------------------------------------------------------------

def sccache():
    """Caché de compilación: la que deja `mach bootstrap` en ~/.mozbuild/sccache (no está en el PATH) o la del
    sistema. Con ella, lo que ya se compiló no se vuelve a compilar (cambios de opciones, versión nueva de Firefox)."""
    for c in (shutil.which("sccache"), os.path.expanduser("~/.mozbuild/sccache/sccache")):
        if c and os.path.isfile(c) and os.access(c, os.X_OK):
            return c
    return None


def mozconfig_ruta(objetivo, src=None):
    return os.path.join(src or arbol(), f"mozconfig-{objetivo}")


def cmd_mozconfig(a, src=None):
    """Un mozconfig por objetivo (<árbol>/mozconfig-<objetivo>): Windows y Linux conviven en el mismo árbol
    con objdirs distintos. Sin --objetivo, se escriben los de todos."""
    for objetivo in ([a.objetivo] if getattr(a, "objetivo", None) else OBJETIVOS):
        escribir_mozconfig(objetivo, a.marca, src)
    viejo = os.path.join(src or arbol(), "mozconfig")       # el único de antes de los objetivos
    if os.path.exists(viejo):
        os.remove(viejo)
    return 0


def escribir_mozconfig(objetivo, marca_elegida, src=None):
    src = src or arbol()
    m = marca()
    partes = []
    for nombre in ("common", objetivo):
        with open(os.path.join(REPO, "mozconfigs", nombre), encoding="utf-8") as f:
            partes.append(f"# --- mozconfigs/{nombre} ---\n" + f.read())
    ruta_marca = {"unofficial": "browser/branding/unofficial", "aegis": "browser/branding/aegis"}[marca_elegida]
    partes.append(f"# --- marca ---\nac_add_options --with-branding={ruta_marca}\n")
    cache = sccache()
    if cache:
        partes.append(f"# --- caché de compilación ---\nac_add_options --with-ccache={cache}\n")
    texto = "\n".join(partes)
    valores = {
        "@OBJDIR@": objdir(objetivo),
        "@MAR_CANAL@": m["actualizaciones"]["mar_canal"],
        "@UPDATE_HOST@": f"github.com/{m['publicacion']['github']}/releases/latest/download",
    }
    for k, v in valores.items():
        texto = texto.replace(k, v)
    codigo = "\n".join(l for l in texto.splitlines() if not l.lstrip().startswith("#"))
    if re.search(r"@[A-Z_]+@", codigo):
        raise Error(f"mozconfig con valores sin sustituir: {sorted(set(re.findall(r'@[A-Z_]+@', codigo)))}", 2)
    escribir(mozconfig_ruta(objetivo, src), texto)
    hecho(f"mozconfig-{objetivo}: marca {marca_elegida}")


def cmd_prepare(a):
    up = upstream()
    src = arbol()
    tb = tarball()
    if not os.path.exists(tb) or sha(tb) != up["sha256"]:   # nunca se usa un tarball sin verificar
        cmd_fetch(a)
    if os.path.exists(src) and a.limpio:
        info(f"borrando {src} (el objdir se conserva)")
        shutil.rmtree(src)
    if not os.path.exists(src):
        os.makedirs(os.path.dirname(src), exist_ok=True)
        tmp = src + ".parcial"
        if os.path.exists(tmp):
            shutil.rmtree(tmp)
        os.makedirs(tmp)
        info("descomprimiendo (unos minutos)")
        run(["tar", "-xf", tb, "-C", tmp, "--strip-components=1"])
        info("creando el repo git del árbol")
        git("init", "--quiet", "-b", "upstream", cwd=tmp)
        git("config", "core.autocrlf", "false", cwd=tmp)
        # Sin normalizar finales de línea (los .gitattributes de Firefox lo harían) y con TODOS los
        # archivos del tarball, también los que el .gitignore de Firefox ignora: la base es la fuente exacta.
        escribir(os.path.join(tmp, ".git", "info", "attributes"), "* -text\n")
        git("add", "-A", "--force", ".", cwd=tmp)
        git("commit", "--quiet", "-m", f"Firefox {up['version']} (fuente intacta)", cwd=tmp)
        git("tag", ETIQUETA_BASE, cwd=tmp)
        git("checkout", "--quiet", "-b", "aegis", cwd=tmp)
        os.replace(tmp, src)
        hecho(f"árbol en {src}")
    aplicar_parches(src)
    copiar_overlay(src)
    cmd_mozconfig(a, src)
    return 0


def cmd_patch(a):
    """Sin --check, aplica lo que falte (y, si upstream.json cambió de motor de Escudos, vuelve a copiar el overlay).
    Con --check, la serie con el motor de upstream.json y, además, con cada motor alternativo (el plan B también
    tiene que aplicar en la versión fijada)."""
    src = arbol()
    if not a.check:
        if aplicar_parches(src):
            copiar_overlay(src)
        return 0
    actual = motor_escudos()
    for m in [actual] + [m for m in con_variantes() if m != actual]:
        info(f"motor de Escudos «{m}»{'' if m == actual else ' (alternativo, el plan B)'}")
        comprobar_serie(src, m)
    return 0


def cmd_overlay(a):
    copiar_overlay(arbol())
    return 0


def cmd_export(a):
    """Un .patch por commit sobre la base, sin hash ni fecha: diffs estables entre exportaciones.
    Se niega si se perdería algo: parches de la serie sin aplicar, rutas repetidas o raras."""
    src = arbol()
    commits = commits_aegis(src)
    rutas = []
    for h, r in commits:
        if not r:
            raise Error(f"el commit {h[:10]} no lleva «Aegis-Parche: NNNN-grupo/nombre.patch»", 2)
        if not RUTA_PARCHE.match(r):
            raise Error(f"el commit {h[:10]} tiene una ruta de parche no válida: {r}", 2)
        rutas.append(r)
    if len(set(rutas)) != len(rutas):
        raise Error("dos commits llevan el mismo Aegis-Parche", 2)
    for h, r in commits:
        tocados = set(git("diff-tree", "--no-commit-id", "--name-only", "-r", h, cwd=src, salida=True).split())
        if tocados & set(REEMPLAZOS.values()):
            raise Error(f"el commit {h[:10]} ({r}) incluye las claves del updater: van en updates/claves "
                        "(REEMPLAZOS), nunca en un parche", 2)
    faltan = set(series()) - set(rutas)
    if faltan:
        raise Error("hay parches de patches/series que no están en el árbol y se perderían: " +
                    ", ".join(sorted(faltan)) + ". Termina de aplicarlos (o quítalos de series a mano).", 2)
    motor = motor_escudos()
    for h, r in commits:                   # el árbol con otro motor: se escribiría en la variante que no es
        if any(ruta_parche(r, m) != ruta_parche(r, motor) and mismo_parche(src, h, r, m) and
               not mismo_parche(src, h, r, motor) for m in MOTORES):
            raise Error(f"{r}: el árbol tiene otro motor de Escudos que el de upstream.json («{motor}»); "
                        "`prepare` antes de `export`", 2)
    for (h, r) in commits:
        texto = git("format-patch", "-1", "--stdout", "--no-signature", "--zero-commit", "--no-stat",
                    "--keep-subject", "--binary", h, cwd=src, salida=True)
        texto = re.sub(r"^Date: .*\n", "", texto, count=1, flags=re.M)
        escribir(os.path.join(REPO, "patches", ruta_parche(r)), texto)   # la variante del motor del árbol
    with open(os.path.join(REPO, "patches", "series"), encoding="utf-8") as f:
        cabecera = [l for l in f if l.startswith("#")]
    escribir(os.path.join(REPO, "patches", "series"), "".join(cabecera) + "".join(r + "\n" for r in rutas))
    hecho(f"{len(rutas)} parches exportados")
    return 0


def mach(args, objetivo, check=True, extra=None):
    src = arbol()
    if not os.path.exists(os.path.join(src, "mach")):
        raise Error("no hay árbol preparado: ejecuta antes `aegis.py prepare`", 2)
    mc = mozconfig_ruta(objetivo, src)
    if not os.path.exists(mc):
        raise Error(f"falta {os.path.basename(mc)}: ejecuta `aegis.py mozconfig`", 2)
    # La caché vive en el área de trabajo (ext4) y con sitio para Windows y Linux a la vez.
    # Ninguna SCCACHE_* heredada (SCCACHE_BUCKET, _REDIS, _WEBDAV…): la caché nunca sale del equipo.
    env = {k: v for k, v in os.environ.items() if not k.startswith("SCCACHE_")}
    conf = os.path.join(WORK, "sccache.conf")           # vacío: ni ~/.config/sccache/config con caché remota
    if not os.path.exists(conf):
        escribir(conf, "")
    env.update(MOZCONFIG=mc, DISABLE_TELEMETRY="1", SCCACHE_CONF=conf,
               SCCACHE_DIR=os.path.join(WORK, "sccache"), SCCACHE_CACHE_SIZE="60G")
    env.update(extra or {})
    return run([sys.executable, "./mach", *args], cwd=src, env=env, check=check)


# Triple de Rust de cada objetivo: mach bootstrap solo instala el de la máquina que compila.
RUST_TRIPLE = {"windows-x86_64-cross": "x86_64-pc-windows-msvc", "linux-x86_64": "x86_64-unknown-linux-gnu"}


def asegurar_rust(objetivo):
    """Añade la biblioteca estándar de Rust del objetivo (rustup target add; no hace nada si ya está)."""
    rustup = shutil.which("rustup") or os.path.expanduser("~/.cargo/bin/rustup")
    if not os.path.exists(rustup):
        raise Error("no encuentro rustup: ejecuta antes `aegis.py bootstrap`", 2)
    instalados = subprocess.run([rustup, "target", "list", "--installed"], capture_output=True, text=True).stdout
    if RUST_TRIPLE[objetivo] not in instalados.split():
        run([rustup, "target", "add", RUST_TRIPLE[objetivo]])


def cmd_bootstrap(a):
    r = mach(["--no-interactive", "bootstrap", "--application-choice=browser"], a.objetivo)
    asegurar_rust(a.objetivo)
    return r


def recursos_de_icono_al_dia(objetivo):
    """Los .res de Windows (firefox.exe, private_browsing.exe…) llevan dentro los .ico de la marca, pero el sistema de
    build no los tiene como dependencia: si cambian los iconos, una build incremental deja los viejos. Se borran los
    .res más antiguos que el .ico más reciente de la marca para que se vuelvan a generar."""
    if not objetivo.startswith("windows"):
        return
    marca_dir = os.path.join(arbol(), "browser", "branding", "aegis")
    icos = [os.path.join(marca_dir, n) for n in os.listdir(marca_dir) if n.endswith(".ico")] \
        if os.path.isdir(marca_dir) else []
    if not icos:
        return
    reciente = max(os.path.getmtime(p) for p in icos)
    app = os.path.join(objdir(objetivo), "browser", "app")
    for raiz, _, nombres in os.walk(app):
        for n in nombres:
            ruta = os.path.join(raiz, n)
            if n.endswith(".exe.res") and os.path.getmtime(ruta) < reciente:
                os.remove(ruta)
                print(f"  icono cambiado: se regenera {os.path.relpath(ruta, objdir(objetivo))}")


def cmd_build(a):
    # El parche 0500-ui/0001 añade «aegis» a browser/components/moz.build: sin el overlay copiado, configure falla.
    if not os.path.isfile(os.path.join(arbol(), "browser", "components", "aegis", "moz.build")):
        raise Error("falta el código de Aegis en el árbol: ejecuta antes `aegis.py overlay`", 2)
    recursos_de_icono_al_dia(a.objetivo)
    asegurar_rust(a.objetivo)
    # Un solo buildID por compilación. Sin MOZ_BUILD_DATE, mach genera buildid.h con la hora en cada pasada (dos en
    # una build incremental): firefox.exe se enlazaba con el de la primera y application.ini (el que `mar` pone en
    # update.xml) salía con el de la segunda. Con buildIDs distintos, el navegador ya actualizado vería en update.xml
    # una build «distinta» de la suya y volvería a bajar e instalar la misma versión cada día. La CI de Mozilla lo fija
    # igual (MOZ_BUILD_DATE); `mar` comprueba además que el del ejecutable coincide.
    buildid = os.environ.get("MOZ_BUILD_DATE") or datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    if not re.fullmatch(r"\d{14}", buildid):
        raise Error(f"MOZ_BUILD_DATE={buildid} no tiene la forma AAAAMMDDhhmmss", 2)
    info(f"buildID {buildid}")
    # --rapido: `mach build faster`, solo lo que no es C++ ni Rust (JS, CSS, FTL, prefs, iconos): 1–2 minutos.
    return mach(["build", "faster"] if a.rapido else ["build"], a.objetivo, extra={"MOZ_BUILD_DATE": buildid})


def cmd_run(a):
    if a.objetivo.startswith("windows"):
        raise Error("la build de Windows se prueba en Windows: `aegis.py instalar-prueba --destino …`", 2)
    return mach(["run", *a.resto], a.objetivo, check=False)


def cmd_package(a):
    return mach(["package"], a.objetivo)


def cmd_instalar_prueba(a):
    """Descomprime el último paquete de Windows en una carpeta de Windows (p. ej. /mnt/c/Users/<tú>/Aegis-pruebas)
    para abrirlo allí. Se sustituye entera de golpe: primero en una carpeta aparte y luego se renombra."""
    destino = os.path.abspath(a.destino)
    if not re.match(r"^/mnt/[a-z]/", destino + "/"):
        raise Error("--destino tiene que ser una carpeta de Windows (/mnt/<unidad>/…)", 2)
    pkg = paquete(a.objetivo)
    if not pkg.endswith(".zip"):
        raise Error(f"{os.path.basename(pkg)} no es un paquete de Windows", 2)
    os.makedirs(destino, exist_ok=True)
    final = os.path.join(destino, "Aegis")
    tmp = final + ".parcial"
    if os.path.exists(tmp):
        shutil.rmtree(tmp)
    os.makedirs(tmp)
    run(["unzip", "-q", pkg, "-d", tmp])
    if os.path.exists(final):
        info("si falla al sustituir la carpeta, cierra Aegis en Windows y repite")
        viejo = final + ".anterior"
        if os.path.exists(viejo):
            shutil.rmtree(viejo)
        os.replace(final, viejo)
        os.replace(tmp, final)
        shutil.rmtree(viejo)
    else:
        os.replace(tmp, final)
    exes = [e for e in glob.glob(os.path.join(final, "*", "*.exe")) if os.path.basename(e) in ("aegis.exe", "firefox.exe")]
    if len(exes) != 1:
        raise Error(f"no encuentro el ejecutable del navegador en {final}", 1)
    hecho(f"build de Windows en {final}")
    if not a.sin_dev:
        instalar_dev(os.path.dirname(exes[0]))
    escribir_lanzador(destino, os.path.relpath(exes[0], destino))
    return 0


def ruta_windows(ruta):
    r = subprocess.run(["wslpath", "-w", ruta], capture_output=True, text=True)
    if r.returncode != 0 or not r.stdout.strip():
        raise Error(f"wslpath no pudo convertir {ruta}", 1)
    return r.stdout.strip()


def instalar_dev(appdir):
    """Cargador de desarrollo (tools/dev): la copia de prueba lee del repo las prefs y el código de interfaz en
    cada arranque, así que un cambio se ve al reiniciar Aegis, sin compilar. Nunca va en una versión publicada."""
    dev = os.path.join(REPO, "tools", "dev")
    with open(os.path.join(dev, "aegis-dev.js"), encoding="utf-8") as f:
        escribir(os.path.join(appdir, "defaults", "pref", "aegis-dev.js"), f.read())
    with open(os.path.join(dev, "aegis-dev.cfg"), encoding="utf-8") as f:
        cfg = f.read().replace("@REPO_WIN@", json.dumps(ruta_windows(REPO)))
    escribir(os.path.join(appdir, "aegis-dev.cfg"), cfg)
    hecho("modo desarrollo: lee settings/prefs y overlay/browser/components/aegis del repo al arrancar")


def escribir_lanzador(destino, exe_rel):
    """«Abrir Aegis (prueba).cmd»: perfil propio (no toca un Firefox instalado) y -purgecaches para que la caché de
    arranque no sirva código viejo del repo."""
    exe = exe_rel.replace("/", "\\")
    texto = ("@echo off\r\n"
             "rem Abre la copia de prueba de Aegis con un perfil propio (no toca el Firefox del equipo).\r\n"
             'if not exist "%~dp0perfil" mkdir "%~dp0perfil"\r\n'
             f'start "" "%~dp0{exe}" -no-remote -purgecaches -profile "%~dp0perfil"\r\n')
    escribir(os.path.join(destino, "Abrir Aegis (prueba).cmd"), texto)
    hecho(f"lanzador: {os.path.join(destino, 'Abrir Aegis (prueba).cmd')}")


# --- Actualizaciones -----------------------------------------------------------------------------

OBJETIVO_VALIDO = re.compile(r"^[A-Za-z]+_[A-Za-z0-9_-]+$")
# Mientras docs/CONEXIONES.md lleve este aviso, la build hace conexiones de Firefox antes de la
# bienvenida (fase 0): `publicar` solo deja publicar en borrador.
AVISO_FASE0 = "Estado (fase 0)"


def config_status(nombre, objetivo):
    """Valor de una sustitución de config.status del objdir (OS_TARGET, TARGET_XPCOM_ABI…). config.status
    tiene el mismo nombre como define (con comillas dentro: '"x86_64-gcc3"') y como subst ('x86_64-gcc3')."""
    ruta = os.path.join(objdir(objetivo), "config.status")
    with open(ruta, encoding="utf-8") as f:
        texto = f.read()
    for v in re.findall(rf"['\"]{nombre}['\"]\s*[:,]\s*'([^']*)'", texto):
        v = v.strip('"')
        if v:
            return v
    raise Error(f"no encuentro {nombre} en {ruta}", 1)


def application_ini(objetivo):
    ini = {}
    base = os.path.join(objdir(objetivo), "dist", "bin")
    for ruta in [p for p in (os.path.join(base, "application.ini"), os.path.join(base, "browser", "application.ini"))
                 if os.path.isfile(p)][:1]:
        with open(ruta, encoding="utf-8") as f:
            for l in f:
                if "=" in l and not l.startswith((";", "[")):
                    k, _, v = l.strip().partition("=")
                    ini[k] = v
    if "BuildID" not in ini:
        raise Error("no hay application.ini en el objdir: compila antes", 2)
    return ini


def herramienta_mar():
    """venv con mardor (la biblioteca de Mozilla para MAR) y sus dependencias, fijadas con hash en
    tools/requisitos-mar.txt: este código carga la clave privada de firma."""
    venv = os.path.join(WORK, "venv-mar")
    exe = os.path.join(venv, "bin", "mar")
    req = os.path.join(REPO, "tools", "requisitos-mar.txt")
    huella = os.path.join(venv, ".requisitos.sha256")
    actual = open(huella, encoding="utf-8").read().strip() if os.path.exists(huella) else ""
    if not os.path.exists(exe) or actual != sha(req):
        info("preparando mardor (versiones fijadas con hash)")
        if os.path.exists(venv):
            shutil.rmtree(venv)
        run([sys.executable, "-m", "venv", venv])
        run([os.path.join(venv, "bin", "pip"), "install", "--quiet", "--require-hashes", "--only-binary", ":all:",
             "--no-deps", "-r", req])
        escribir(huella, sha(req) + "\n")
    return exe


def paquete(objetivo):
    """El paquete más reciente de `mach package` (tar.xz en Linux, zip en Windows)."""
    dist = os.path.join(objdir(objetivo), "dist")
    cands = [p for p in glob.glob(os.path.join(dist, "*.tar.xz")) + glob.glob(os.path.join(dist, "*.zip"))
             if ".langpack" not in p and "-symbols" not in p and "xpt_artifacts" not in p]
    if not cands:
        raise Error("no hay paquete: ejecuta antes `aegis.py package`", 2)
    return max(cands, key=os.path.getmtime)


def sin_cargador_dev(pkg):
    """El cargador de desarrollo (tools/dev) nunca puede ir en algo publicable (MAR, MSIX), ni en el .zip de Windows
    ni en el .tar.xz de Linux."""
    if pkg.endswith(".zip"):
        with zipfile.ZipFile(pkg) as z:
            nombres = z.namelist()
    elif pkg.endswith((".tar.xz", ".tar.bz2", ".tar.gz")):
        with tarfile.open(pkg) as t:
            nombres = t.getnames()
    else:
        raise Error(f"{os.path.basename(pkg)}: formato de paquete desconocido; no se puede comprobar", 3)
    if any(n.endswith(("aegis-dev.cfg", "aegis-dev.js")) for n in nombres):
        raise Error(f"{os.path.basename(pkg)} lleva el cargador de desarrollo (aegis-dev): no se publica", 3)


def pub_der(ruta):
    with open(ruta, "rb") as f:
        pub = pub_de_der(f.read())
    if not pub:
        raise Error(f"{ruta} no es un certificado válido (openssl)", 3)
    return pub


def cmd_mar(a):
    objetivo_build = a.objetivo
    clave = os.path.join(FIRMA, "mar-primaria.pem")
    cert = os.path.join(REPO, "updates", "claves", "primaria.der")
    if not (os.path.exists(clave) and os.path.exists(cert)):
        raise Error("faltan las claves MAR: `aegis.py claves-mar` (y compilar con ellas)", 2)
    pub_clave = pub_de_clave(clave)
    if not pub_clave or pub_der(cert) != pub_clave:
        raise Error("la clave privada no corresponde a updates/claves/primaria.der", 3)
    m = marca()
    canal_mar = m["actualizaciones"]["mar_canal"]
    ini = application_ini(objetivo_build)
    # La URL compilada tiene que ser la de Aegis: si MOZ_APPUPDATE_HOST faltara, Firefox pondría aus5.
    host = f"github.com/{m['publicacion']['github']}/releases/latest/download/"
    if not ini.get("URL", "").startswith(f"https://{host}update-"):
        raise Error(f"application.ini no apunta a las actualizaciones de Aegis: URL={ini.get('URL')}", 3)
    mar = herramienta_mar()
    objetivo = f"{config_status('OS_TARGET', objetivo_build)}_{config_status('TARGET_XPCOM_ABI', objetivo_build)}"
    if not OBJETIVO_VALIDO.match(objetivo):
        raise Error(f"objetivo de actualización no válido: «{objetivo}»", 3)
    va = version_aegis()
    pkg = paquete(objetivo_build)
    sin_cargador_dev(pkg)
    os.makedirs(SALIDA, exist_ok=True)
    nombre_mar = f"aegis-{va}-{objetivo}.complete.mar"
    destino = os.path.join(SALIDA, nombre_mar)
    parcial = destino + ".parcial"
    if os.path.exists(parcial):          # de una ejecución cortada: nunca se da por bueno un MAR viejo
        os.remove(parcial)
    with tempfile.TemporaryDirectory(prefix="aegis-mar-") as tmp:
        info(f"desempaquetando {os.path.basename(pkg)}")
        if pkg.endswith(".zip"):
            run(["unzip", "-q", pkg, "-d", tmp])
        else:
            run(["tar", "-xf", pkg, "-C", tmp])
        dentro = [d for d in os.listdir(tmp) if os.path.isdir(os.path.join(tmp, d))]
        if len(dentro) != 1:
            raise Error(f"el paquete no tiene una sola carpeta raíz: {dentro}")
        # El buildID que va en update.xml (application.ini) tiene que ser el que lleva compilado el ejecutable
        # (Services.appinfo.appBuildID): si no, el navegador ya actualizado volvería a ver una versión «nueva» y bajaría
        # la misma cada día (ver cmd_build, MOZ_BUILD_DATE).
        exe = [p for p in (os.path.join(tmp, dentro[0], n) for n in ("firefox.exe", "firefox")) if os.path.isfile(p)]
        if not exe:
            raise Error("no encuentro el ejecutable del navegador en el paquete", 3)
        with open(exe[0], "rb") as f:
            if ini["BuildID"].encode() not in f.read():
                raise Error(f"{os.path.basename(exe[0])} no lleva el buildID de application.ini ({ini['BuildID']}): "
                            "build incoherente; vuelve a compilar con `aegis.py build` (fija MOZ_BUILD_DATE)", 3)
        # mardor firma con sha384 al recibir una clave RSA de 4096 bits (-k). make_full_update.sh
        # parte $MAR en palabras: las rutas no llevan espacios.
        env = dict(os.environ, MOZ_PRODUCT_VERSION=ini["Version"], MAR_CHANNEL_ID=canal_mar, MAR=f"{mar} -k {clave}")
        script = os.path.join(arbol(), "tools", "update-packaging", "make_full_update.sh")
        # El mar en C de Mozilla crea output.mar dentro de -C; mardor, en el directorio actual. El script lo
        # busca en "<dir>.work": se ejecuta ahí para que lo encuentre (y no deje cientos de MB en otro sitio).
        trabajo = os.path.join(tmp, dentro[0]) + ".work"
        os.makedirs(trabajo)
        run(["bash", script, parcial, os.path.join(tmp, dentro[0])], env=env, cwd=trabajo)
        if not os.path.isfile(parcial):      # el script no informa de sus fallos con el código de salida
            raise Error("make_full_update.sh no produjo el MAR", 3)
    try:
        # Comprobaciones como las del updater: firma con el certificado público, canal, versión y sha384.
        with tempfile.TemporaryDirectory() as tmp:
            pub = os.path.join(tmp, "pub.pem")
            escribir(pub, pub_der(cert))
            if run([mar, "-v", parcial, "-k", pub], check=False) != 0:
                raise Error("la firma del MAR no se verifica con updates/claves/primaria.der", 3)
        det = subprocess.run([mar, "-T", parcial], capture_output=True, text=True)
        texto = det.stdout + det.stderr
        for esperado, que in ((canal_mar, "el canal MAR"), (ini["Version"], "la versión"), ("sha384", "la firma sha384")):
            if esperado not in texto:
                raise Error(f"el MAR no lleva {que} esperado ({esperado}):\n{texto.strip()}", 3)
    except BaseException:
        if os.path.exists(parcial):
            os.remove(parcial)
        raise
    os.replace(parcial, destino)
    hecho(f"{nombre_mar} firmado y verificado (canal {canal_mar}, sha384)")
    repo = m["publicacion"]["github"]
    url = f"https://github.com/{repo}/releases/download/v{va}/{nombre_mar}"
    attr = xml.sax.saxutils.quoteattr
    xml_texto = (
        '<?xml version="1.0" encoding="UTF-8"?>\n<updates>\n'
        f'  <update type="minor" displayVersion={attr(va)} appVersion={attr(ini["Version"])} '
        f'platformVersion={attr(ini["Version"])} buildID={attr(ini["BuildID"])} '
        f'detailsURL={attr(f"https://github.com/{repo}/releases/tag/v{va}")}>\n'
        f'    <patch type="complete" URL={attr(url)} hashFunction="sha512" '
        f'hashValue={attr(sha(destino, "sha512"))} size="{os.path.getsize(destino)}"/>\n'
        '  </update>\n</updates>\n')
    # El nombre lo pide el navegador: update-%BUILD_TARGET%-%CHANNEL%.xml (parche 0100-build/0001).
    # Los nombres los pide el navegador: update-%BUILD_TARGET%-%CHANNEL%.xml (parche 0100-build/0001). En Windows,
    # %BUILD_TARGET% lleva además la arquitectura de la CPU del equipo (UpdateUtils.sys.mjs, gWinCPUArch): x64, o
    # aarch64 en un Windows ARM64 que ejecuta la build x64 en emulación. Mismo MAR para los dos.
    canal = m["actualizaciones"]["canal"]
    if objetivo.startswith("WINNT_"):
        nombres_xml = [f"update-{objetivo}-{cpu}-{canal}.xml" for cpu in ("x64", "aarch64")]
    else:
        nombres_xml = [f"update-{objetivo}-{canal}.xml"]
    for nombre_xml in nombres_xml:
        escribir(os.path.join(SALIDA, nombre_xml), xml_texto)
        hecho(f"{nombre_xml} (Aegis {va}, build {ini['BuildID']})")
    nombre_pkg = f"aegis-{va}-{objetivo}{'.zip' if pkg.endswith('.zip') else '.tar.xz'}"
    shutil.copyfile(pkg, os.path.join(SALIDA, nombre_pkg + ".parcial"))
    os.replace(os.path.join(SALIDA, nombre_pkg + ".parcial"), os.path.join(SALIDA, nombre_pkg))
    hecho(f"paquete en {os.path.join(SALIDA, nombre_pkg)}")
    # Manifiesto de esta versión: lo que `publicar` sube (y nada más), por objetivo.
    manifiesto = os.path.join(SALIDA, f"manifiesto-{va}.json")
    datos = {}
    if os.path.exists(manifiesto):
        with open(manifiesto, encoding="utf-8") as f:
            datos = json.load(f)
    datos[objetivo] = [nombre_pkg, nombre_mar, *nombres_xml]
    escribir(manifiesto, json.dumps(datos, indent=1, ensure_ascii=False) + "\n")
    return 0


def marca_provisional():
    """Archivos de overlay/browser/branding/aegis idénticos a los de browser/branding/unofficial de Firefox: iconos,
    logotipos y textos que todavía no son de Aegis (lo exige inspector-visual antes de publicar)."""
    propia = os.path.join(REPO, "overlay", "browser", "branding", "aegis")
    firefox = os.path.join(arbol(), "browser", "branding", "unofficial")
    if not os.path.isdir(firefox):
        raise Error("no hay árbol preparado para comparar la marca con la de Firefox", 2)
    iguales = []
    for raiz, _, nombres in os.walk(propia):
        for n in nombres:
            rel = os.path.relpath(os.path.join(raiz, n), propia)
            otro = os.path.join(firefox, rel)
            if os.path.isfile(otro) and sha(otro) == sha(os.path.join(raiz, n)):
                iguales.append(rel.replace(os.sep, "/"))
    for rel in ("content/aboutDialog.css", "firefox.VisualElementsManifest.xml"):
        with open(os.path.join(propia, rel), encoding="utf-8", errors="replace") as f:
            if re.search(r"#130829|#14171a|hsla\(235", f.read()) and rel not in iguales:
                iguales.append(rel)
    return sorted(iguales)


def cmd_publicar(a):
    """Sube lo que `mar` dejó para esta versión (manifiesto-<v>.json) a una release v<versión> de GitHub.
    Primero en borrador; solo se publica como «latest» cuando todo está subido y comprobado, para que
    latest/download nunca apunte a medias."""
    if not shutil.which("gh"):
        raise Error("falta gh (pacman -S github-cli) y `gh auth login` la primera vez", 2)
    if not a.borrador:
        if en_fase0():
            raise Error("esta build todavía hace conexiones antes de la bienvenida (docs/CONEXIONES.md, "
                        f"«{AVISO_FASE0}»): solo se puede publicar en borrador (--borrador) hasta la 0.1", 2)
        provisionales = marca_provisional()
        if provisionales:
            raise Error("la marca aún lleva recursos de Firefox Nightly (" + ", ".join(provisionales[:6]) +
                        (", …" if len(provisionales) > 6 else "") + "): solo en borrador hasta tener los de Aegis", 2)
    repo = marca()["publicacion"]["github"]
    va = version_aegis()
    tag = f"v{va}"
    manifiesto = os.path.join(SALIDA, f"manifiesto-{va}.json")
    if not os.path.exists(manifiesto):
        raise Error(f"no hay {os.path.basename(manifiesto)}: ejecuta antes `aegis.py mar`", 2)
    with open(manifiesto, encoding="utf-8") as f:
        datos = json.load(f)
    archivos = [os.path.join(SALIDA, n) for lista in datos.values() for n in lista]
    if any(p.endswith(".msix") for p in archivos):   # el paquete de la Tienda va a Partner Center, nunca a GitHub
        raise Error(f"{os.path.basename(manifiesto)} cita un .msix: el de la Tienda se sube en Partner Center "
                    "(docs/TIENDA.md), no en GitHub Releases", 2)
    for p in archivos:
        if not os.path.isfile(p):
            raise Error(f"falta {p} (del manifiesto): vuelve a ejecutar `aegis.py mar`", 2)
    info(f"objetivos: {', '.join(sorted(datos))}")
    existe = subprocess.run(["gh", "release", "view", tag, "-R", repo], capture_output=True).returncode == 0
    if not existe:
        run(["gh", "release", "create", tag, "-R", repo, "--draft", "--title", f"Aegis {va}",
             "--notes", f"Aegis {va}, basado en el código de Firefox {upstream()['version']}."])
    run(["gh", "release", "upload", tag, "-R", repo, "--clobber", *archivos])
    vista = subprocess.run(["gh", "release", "view", tag, "-R", repo, "--json", "assets"],
                           capture_output=True, text=True)
    subidos = {x["name"]: x["size"] for x in json.loads(vista.stdout or "{}").get("assets", [])}
    for p in archivos:
        if subidos.get(os.path.basename(p)) != os.path.getsize(p):
            raise Error(f"{os.path.basename(p)} no se subió entero; repite `aegis.py publicar`", 1)
    hecho(f"{len(archivos)} archivos subidos y comprobados")
    if a.borrador:
        info("queda en borrador (--borrador)")
        return 0
    run(["gh", "release", "edit", tag, "-R", repo, "--draft=false", "--latest"])
    hecho(f"publicada {tag}: los Aegis instalados la verán en su próxima comprobación")
    return 0


# --- Microsoft Store (MSIX) ----------------------------------------------------------------------
#
# `mach repackage msix` (python/mozbuild/mozbuild/repackaging/msix.py de Firefox) prepara el contenido del paquete a
# partir del zip de `package`: VFS/ProgramFiles/<Aegis Package Root>/, msix/Assets de la marca, Resources.pri y el
# AppxManifest.xml de su plantilla (browser/installer/windows/msix/). Aegis le pasa como «makeappx» un sustituto que
# no empaqueta: solo apunta dónde quedó esa carpeta. Después aegis.py ajusta el manifiesto y la distribución, comprueba
# todo y empaqueta con el makemsix de Mozilla. Sin firmar: la Tienda firma el paquete al publicarlo. Ver docs/TIENDA.md.

# Objetivo de compilación → (--arch de mach, ProcessorArchitecture del paquete).
MSIX_ARQUITECTURA = {"windows-x86_64-cross": ("x86_64", "x64")}
MSIX_TOOLCHAIN = "linux64-msix-packaging"
# makemsix de Mozilla (github.com/mozilla/msix-packaging, la revisión que fija taskcluster/kinds/fetch/toolchains.yml de
# Firefox 157), compilado por la CI de Mozilla. `mach artifact toolchain` comprueba la descarga con el sha256 de su
# chain-of-trust.json; aquí, además, van fijadas las sumas de lo que se ejecuta. Si al cambiar de versión de Firefox el
# toolchain cambia, `msix` se niega: se revisa la descarga nueva y se actualizan estas sumas.
MSIX_SUMAS = {
    "makemsix": "10bba1a24b5e5667e4afc7f235f0bbd1f116a3d795a7fbb422dcb8fa79ae3dd7",
    "libmsix.so": "7e344a8a376d135a45d2f4529cdf14cd26d565eb601d4cec441b9c5d80a0b02d",
    "libicuuc.so.52": "fc90740ac01bc4dc11c539967891892347f66ee249e50015c332374f60c76cea",
    "libicudata.so.52": "7ac198dd207270c0f65d1ce8394442af066cf546eba7ee0db5b6430e51342989",
}
# branding/marca.json › tienda: los datos de Partner Center › Identidad del producto, con el mismo nombre que allí.
TIENDA_CLAVES = {
    "Package/Identity/Name": r"[A-Za-z0-9][A-Za-z0-9.-]{1,48}[A-Za-z0-9]",
    "Package/Identity/Publisher": r"CN=[^\"<>&]{1,8000}",
    "Package/Properties/PublisherDisplayName": r"[^\"<>&]{1,256}",
    "Package/Properties/DisplayName": r"[^\"<>&]{1,256}",
}
PENDIENTE = "PENDIENTE"          # valor provisional de marca.json: con él solo hay paquetes de prueba
# Editor de los paquetes firmados en el equipo (--firma-local): el sujeto del certificado autofirmado de pruebas.
MSIX_EDITOR_PRUEBA = "CN=Aegis Pruebas Locales"
NS_APPX = "{http://schemas.microsoft.com/appx/manifest/foundation/windows10}"

# Hace de «makeappx» para `mach repackage msix`. mach lo llama sin argumentos (para saber qué herramienta es) y luego
# con `pack -d <carpeta> -p <paquete>`: no empaqueta, apunta la carpeta en $AEGIS_MSIX_CARPETA.
SUSTITUTO_MAKEAPPX = """#!/bin/sh
# Generado por tools/aegis.py msix (ver allí). No empaqueta: apunta la carpeta preparada por mach.
[ "$1" = pack ] || exit 0
shift
while [ $# -gt 0 ]; do
    if [ "$1" = -d ] && [ $# -ge 2 ]; then
        printf '%s' "$2" > "$AEGIS_MSIX_CARPETA"
        exit 0
    fi
    shift
done
echo "makeappx (Aegis): falta -d <carpeta>" >&2
exit 1
"""


def en_fase0():
    """docs/CONEXIONES.md aún lleva el aviso de la fase 0: la build hace conexiones de Firefox antes de la bienvenida."""
    with open(os.path.join(REPO, "docs", "CONEXIONES.md"), encoding="utf-8") as f:
        return AVISO_FASE0 in f.read()


def fuera_del_msix(rel):
    """Archivos de browser/branding/aegis que no llegan al paquete MSIX ni se ven en él (no cuentan como «marca de
    Nightly» para la Tienda): los de macOS, los del instalador NSIS y el stub (Aegis tiene el suyo), los de build, y los
    VisualElements del ejecutable (en un paquete, los mosaicos salen del AppxManifest y de msix/Assets)."""
    return (rel.endswith((".icns", ".car", ".VisualElementsManifest.xml")) or rel == "dsstore" or
            rel.startswith("stubinstaller/") or re.fullmatch(r"wiz\w*\.bmp", rel) is not None or
            os.path.basename(rel) in ("jar.mn", "moz.build"))


def tienda():
    """(datos de la Tienda, claves que aún son provisionales) de branding/marca.json › tienda."""
    t = marca().get("tienda")
    if not isinstance(t, dict):
        raise Error("branding/marca.json no tiene la sección «tienda» (ver docs/TIENDA.md)", 2)
    for clave, forma in TIENDA_CLAVES.items():
        valor = t.get(clave)
        if not isinstance(valor, str) or not re.fullmatch(forma, valor):
            raise Error(f"branding/marca.json › tienda › «{clave}» no vale: «{valor}». Cópialo tal cual de Partner "
                        "Center › Identidad del producto (docs/TIENDA.md)", 2)
    return t, [c for c in TIENDA_CLAVES if PENDIENTE in t[c]]


def version_msix():
    """Versión del paquete: cuatro números de 16 bits y el último a 0 (lo reserva la Tienda). <mayor>.<menor>.<parche
    × 100 + revisión>.0, para que cada revisión de Aegis sobre la misma versión de Firefox suba la versión y la Tienda
    acepte la actualización: 157.0.1-1 → 157.0.101.0; 157.0.1-2 → 157.0.102.0; 158.0-1 → 158.0.1.0."""
    v = upstream()["version"]
    rev = leer_json("upstream.json")["aegis"]["revision"]
    m = re.fullmatch(r"(\d+)\.(\d+)(?:\.(\d+))?", v)
    if not m:
        raise Error(f"versión de Firefox «{v}» sin la forma X.Y o X.Y.Z", 2)
    if not isinstance(rev, int) or not 1 <= rev <= 99:
        raise Error(f"upstream.json › aegis.revision «{rev}» tiene que ir de 1 a 99 para el paquete MSIX", 2)
    numeros = (int(m[1]), int(m[2]), int(m[3] or 0) * 100 + rev)
    if max(numeros) > 65535:
        raise Error(f"la versión {v}-{rev} no cabe en una versión MSIX (16 bits por número)", 2)
    return "{}.{}.{}.0".format(*numeros)


def fondo_loseta():
    """Color de la loseta del icono (primer <rect> de branding/icono/aegis.svg): el de los mosaicos que pinta
    tools/iconos.py y el BackgroundColor del AppxManifest. Una sola fuente: el SVG."""
    with open(os.path.join(REPO, "branding", "icono", "aegis.svg"), encoding="utf-8") as f:
        m = re.search(r'<rect\b[^>]*\bfill="(#[0-9a-fA-F]{6})"', f.read())
    if not m:
        raise Error("branding/icono/aegis.svg no tiene la loseta (<rect fill=\"#rrggbb\">)", 2)
    return m.group(1).lower()


def comprobar_sumas_msix(carpeta):
    hay = sorted(os.listdir(carpeta))
    if hay != sorted(MSIX_SUMAS):
        raise Error(f"{carpeta} no tiene exactamente {', '.join(sorted(MSIX_SUMAS))} (tiene {', '.join(hay)})", 3)
    for nombre, suma in MSIX_SUMAS.items():
        if sha(os.path.join(carpeta, nombre)) != suma:
            raise Error(f"{carpeta}/{nombre} no tiene la suma fijada en aegis.py (MSIX_SUMAS). Si cambió la versión de "
                        "Firefox, bórrala, vuelve a ejecutar `msix` para descargarla, compruébala y actualiza las sumas",
                        3)


def herramienta_msix():
    """makemsix: la primera vez se descarga con `mach artifact toolchain` (como los compiladores de `mach bootstrap`) en
    ~/.mozbuild/msix-packaging; siempre se comprueban las sumas fijadas en MSIX_SUMAS."""
    estado = os.path.abspath(os.path.expanduser(os.environ.get("MOZBUILD_STATE_PATH", "~/.mozbuild")))
    carpeta = os.path.join(estado, "msix-packaging")
    if not os.path.isfile(os.path.join(carpeta, "makemsix")):
        if not os.path.isfile(os.path.join(arbol(), "mach")):
            raise Error("no hay árbol preparado para descargar makemsix: ejecuta antes `aegis.py prepare`", 2)
        info(f"descargando makemsix (toolchain {MSIX_TOOLCHAIN} de la CI de Mozilla; mach comprueba su sha256)")
        os.makedirs(estado, exist_ok=True)
        tmp = tempfile.mkdtemp(dir=estado, prefix=".msix-packaging-")
        try:
            env = {k: v for k, v in os.environ.items() if not k.startswith("SCCACHE_")}
            env["DISABLE_TELEMETRY"] = "1"
            run([sys.executable, os.path.join(arbol(), "mach"), "artifact", "toolchain", "--from-build",
                 MSIX_TOOLCHAIN], cwd=tmp, env=env)
            bajada = os.path.join(tmp, "msix-packaging")
            if not os.path.isdir(bajada):
                raise Error("mach artifact toolchain no dejó msix-packaging/", 3)
            comprobar_sumas_msix(bajada)
            if os.path.isdir(carpeta):
                shutil.rmtree(carpeta)
            os.replace(bajada, carpeta)
        finally:
            shutil.rmtree(tmp, ignore_errors=True)
        hecho(f"makemsix en {carpeta}")
    comprobar_sumas_msix(carpeta)
    return os.path.join(carpeta, "makemsix")


def certificado_prueba_msix():
    """(.pfx, .cer) del certificado autofirmado de --firma-local: sujeto MSIX_EDITOR_PRUEBA, solo «firma de código».
    Se crea una vez en ~/.config/aegis-firma (nunca en el repo). El .pfx va sin contraseña porque makemsix no las
    admite: por eso permisos 600. El .cer (público) es el que se instala en Windows (docs/TIENDA.md)."""
    if not shutil.which("openssl"):
        raise Error("falta openssl", 2)
    pfx = os.path.join(FIRMA, "msix-prueba.pfx")
    cer = os.path.join(FIRMA, "msix-prueba.cer")
    os.makedirs(FIRMA, mode=0o700, exist_ok=True)
    os.chmod(FIRMA, 0o700)
    if not (os.path.isfile(pfx) and os.path.isfile(cer)):
        def openssl(*args):
            r = subprocess.run(["openssl", *args], capture_output=True, text=True)
            if r.returncode != 0:
                raise Error(f"openssl {args[0]}: {r.stderr.strip()}", 1)

        with tempfile.TemporaryDirectory(dir=FIRMA, prefix=".msix-prueba-") as tmp:
            clave, crt = os.path.join(tmp, "clave.pem"), os.path.join(tmp, "cert.pem")
            openssl("req", "-x509", "-newkey", "rsa:3072", "-sha256", "-nodes", "-days", "1825",
                    "-keyout", clave, "-out", crt, "-subj", "/" + MSIX_EDITOR_PRUEBA,
                    "-addext", "basicConstraints=critical,CA:FALSE", "-addext", "keyUsage=critical,digitalSignature",
                    "-addext", "extendedKeyUsage=codeSigning")
            # Sin cifrar ni contraseña (las tres opciones hacen falta, como en msix.py de Firefox).
            openssl("pkcs12", "-export", "-inkey", clave, "-in", crt, "-name", MSIX_EDITOR_PRUEBA[3:],
                    "-keypbe", "NONE", "-certpbe", "NONE", "-passout", "pass:", "-out", os.path.join(tmp, "p.pfx"))
            openssl("x509", "-in", crt, "-outform", "DER", "-out", os.path.join(tmp, "p.cer"))
            os.chmod(os.path.join(tmp, "p.pfx"), 0o600)
            os.replace(os.path.join(tmp, "p.cer"), cer)
            os.replace(os.path.join(tmp, "p.pfx"), pfx)
        hecho(f"certificado de pruebas creado en {FIRMA} (msix-prueba.pfx y .cer)")
    r = subprocess.run(["openssl", "x509", "-inform", "DER", "-in", cer, "-noout", "-subject", "-nameopt", "RFC2253"],
                       capture_output=True, text=True)
    if r.returncode != 0 or r.stdout.strip() != f"subject={MSIX_EDITOR_PRUEBA}":
        raise Error(f"{cer} no es el certificado de pruebas ({MSIX_EDITOR_PRUEBA}): bórralo junto a msix-prueba.pfx "
                    "y repite", 3)
    return pfx, cer


def ajustar_manifiesto(ruta, nombre_identidad, editor, t, nombre):
    """AppxManifest.xml de la plantilla de Firefox → el de Aegis. Cada cambio tiene que encontrarse exactamente una
    vez: si la plantilla cambia en una versión nueva de Firefox, `msix` se niega en lugar de hacer un paquete raro."""
    with open(ruta, encoding="utf-8") as f:
        texto = f.read()
    attr = xml.sax.saxutils.quoteattr
    esc = xml.sax.saxutils.escape
    cambios = [
        # Identidad exacta de Partner Center (mach la compone como «<vendor>.<nombre>»).
        ("Identity Name", r'(<Identity\b[^>]*?\bName=)"[^"]*"', lambda m: m[1] + attr(nombre_identidad)),
        ("Identity Publisher", r'(<Identity\b[^>]*?\bPublisher=)"[^"]*"', lambda m: m[1] + attr(editor)),
        # El nombre del paquete tiene que ser el reservado en Partner Center.
        ("DisplayName", r"<DisplayName>[^<]*</DisplayName>",
         lambda m: f"<DisplayName>{esc(t['Package/Properties/DisplayName'])}</DisplayName>"),
        ("PublisherDisplayName", r"<PublisherDisplayName>[^<]*</PublisherDisplayName>",
         lambda m: f"<PublisherDisplayName>{esc(t['Package/Properties/PublisherDisplayName'])}</PublisherDisplayName>"),
        # Fondo de los mosaicos: la loseta del icono, no el violeta de Firefox (#20123A).
        ("BackgroundColor", r'\bBackgroundColor="[^"]*"', lambda m: f"BackgroundColor={attr(fondo_loseta())}"),
        # Alias de la línea de órdenes: «aegis.exe», no «firefox.exe» (chocaría con el Firefox de la Tienda).
        ("ExecutionAlias", r'(<desktop:ExecutionAlias\s+Alias=)"[^"]*"', lambda m: m[1] + attr(f"{nombre.lower()}.exe")),
        # Sin tarea en segundo plano con temporizador (la del agente del navegador predeterminado, que Aegis no
        # compila: --disable-default-browser-agent) ni su servidor COM, msixcomserver.dll, que el zip no lleva.
        ("windows.backgroundTasks", r'\s*<Extension Category="windows\.backgroundTasks".*?</Extension>', lambda m: ""),
        ("windows.activatableClass.inProcessServer",
         r'\s*<Extension Category="windows\.activatableClass\.inProcessServer">.*?</Extension>', lambda m: ""),
    ]
    for que, patron, nuevo in cambios:
        texto, n = re.subn(patron, nuevo, texto, flags=re.S)
        if n != 1:
            raise Error(f"la plantilla AppxManifest.xml de Firefox ha cambiado ({que}: {n} veces, se esperaba 1): "
                        "revisa ajustar_manifiesto() en tools/aegis.py", 3)
    if re.search(r"@[A-Z_]+@", texto) or "msixcomserver.dll" in texto:
        raise Error("el AppxManifest.xml lleva valores sin sustituir o msixcomserver.dll", 3)
    try:
        ET.fromstring(texto.encode("utf-8"))
    except ET.ParseError as e:
        raise Error(f"el AppxManifest.xml ajustado no es XML válido: {e}", 3)
    escribir(ruta, texto)


def comprobar_msix(ruta, makemsix, firmado, esperado, assets, exe_rel):
    """Lo que hay dentro del .msix: archivos del formato, identidad, ejecutable, assets de Aegis, distribución propia
    y nada del modo desarrollo. Después, `makemsix unpack` lo desempaqueta entero comprobando el mapa de bloques (el
    hash de cada archivo) y, si va firmado, la firma."""
    with zipfile.ZipFile(ruta) as z:
        nombres = {urllib.parse.unquote(n): n for n in z.namelist()}
        manifiesto = z.read(nombres["AppxManifest.xml"]) if "AppxManifest.xml" in nombres else b""
        dist = [n for n in nombres if n.endswith("/distribution/distribution.ini")]
        distribucion = z.read(nombres[dist[0]]) if len(dist) == 1 else b""
        assets_dentro = {n[len("Assets/"):]: hashlib.sha256(z.read(o)).hexdigest()
                         for n, o in nombres.items() if n.startswith("Assets/")}
    for n in ("AppxManifest.xml", "AppxBlockMap.xml", "[Content_Types].xml"):
        if n not in nombres:
            raise Error(f"{os.path.basename(ruta)} no lleva {n}", 3)
    if ("AppxSignature.p7x" in nombres) != firmado:
        raise Error(f"{os.path.basename(ruta)} {'no ' if firmado else ''}lleva firma y {'' if firmado else 'no '}"
                    "debería", 3)
    raiz = ET.fromstring(manifiesto)
    ident = raiz.find(f"{NS_APPX}Identity")
    props = raiz.find(f"{NS_APPX}Properties")
    vistos = {**{k: ident.get(k) for k in esperado["Identity"]},
              **{k: props.findtext(f"{NS_APPX}{k}") for k in esperado["Properties"]}}
    for k, v in {**esperado["Identity"], **esperado["Properties"]}.items():
        if vistos[k] != v:
            raise Error(f"AppxManifest.xml: {k} es «{vistos[k]}» y tendría que ser «{v}»", 3)
    app = raiz.find(f"{NS_APPX}Applications/{NS_APPX}Application")
    if app is None or app.get("Executable", "").replace("\\", "/") != exe_rel or exe_rel not in nombres:
        raise Error(f"AppxManifest.xml: el ejecutable no es {exe_rel} o no está en el paquete", 3)
    if assets_dentro != assets:
        raise Error("los assets del paquete no son los de overlay/browser/branding/aegis/msix/Assets", 3)
    with open(os.path.join(REPO, "packaging", "msix", "distribution.ini"), "rb") as f:
        if distribucion != f.read():
            raise Error("la distribución del paquete no es packaging/msix/distribution.ini", 3)
    if any(n.endswith(("aegis-dev.cfg", "aegis-dev.js")) for n in nombres):
        raise Error("el paquete lleva el cargador de desarrollo (aegis-dev)", 3)
    with tempfile.TemporaryDirectory(dir=WORK, prefix=".msix-comprobar-") as tmp:
        run([makemsix, "unpack", "-p", ruta, "-d", tmp, "-ac" if firmado else "-ss"])
        if not os.path.isfile(os.path.join(tmp, exe_rel)):
            raise Error(f"makemsix unpack no extrajo {exe_rel}", 3)


def cmd_msix(a):
    """Paquete MSIX para la Microsoft Store desde el zip de `package`, con la identidad de branding/marca.json › tienda.
    Sin opciones: el de subir a Partner Center (sin firmar; firma la Tienda), en salida/. --prueba: con la identidad
    provisional si hace falta, en salida/pruebas/ (no se sube). --firma-local: como --prueba y firmado con un
    certificado autofirmado para instalarlo en el propio equipo."""
    if a.objetivo not in MSIX_ARQUITECTURA:
        raise Error("el paquete MSIX es solo para Windows (--objetivo windows-x86_64-cross)", 2)
    prueba = a.prueba or a.firma_local
    t, provisionales = tienda()
    if provisionales and not prueba:
        raise Error("la identidad de la Tienda aún es provisional (" + ", ".join(provisionales) + " en "
                    "branding/marca.json › tienda): copia los datos de Partner Center (docs/TIENDA.md). Para probar "
                    "sin subir: --prueba o --firma-local", 2)
    if not prueba:
        if en_fase0() and not a.privado:
            raise Error("esta build todavía hace conexiones antes de la bienvenida (docs/CONEXIONES.md, "
                        f"«{AVISO_FASE0}»): hasta la 0.1, solo un envío con audiencia privada (--privado; "
                        "docs/TIENDA.md)", 2)
        provis = [r for r in marca_provisional() if not fuera_del_msix(r)]
        if provis:
            raise Error("la marca aún lleva recursos de Firefox Nightly (" + ", ".join(provis[:6]) +
                        (", …" if len(provis) > 6 else "") + "): no se sube a la Tienda hasta tener los de Aegis", 2)
    elif a.privado:
        raise Error("--privado es para el paquete de la Tienda; con --prueba o --firma-local no se sube nada", 2)
    arch, arch_msix = MSIX_ARQUITECTURA[a.objetivo]
    pkg = paquete(a.objetivo)
    if not pkg.endswith(".zip"):
        raise Error(f"{os.path.basename(pkg)} no es un paquete de Windows", 2)
    sin_cargador_dev(pkg)
    # mach toma los assets de la marca del árbol: tienen que ser los de overlay/ (tools/iconos.py los genera).
    propios_dir = os.path.join(REPO, "overlay", "browser", "branding", "aegis", "msix", "Assets")
    arbol_dir = os.path.join(arbol(), "browser", "branding", "aegis", "msix", "Assets")
    assets = {n: sha(os.path.join(propios_dir, n)) for n in sorted(os.listdir(propios_dir))}
    en_arbol = {n: sha(os.path.join(arbol_dir, n)) for n in sorted(os.listdir(arbol_dir))} \
        if os.path.isdir(arbol_dir) else {}
    if en_arbol != assets:
        raise Error("los assets MSIX del árbol no son los de overlay/browser/branding/aegis/msix/Assets: ejecuta "
                    "`aegis.py overlay`", 2)
    makemsix = herramienta_msix()
    nombre = marca()["nombre"]
    editor = MSIX_EDITOR_PRUEBA if a.firma_local else t["Package/Identity/Publisher"]
    nombre_identidad = t["Package/Identity/Name"]
    version = version_msix()
    va = version_aegis()
    carpeta = os.path.join(SALIDA, "pruebas") if prueba else SALIDA
    final = os.path.join(carpeta, f"aegis-{va}-{arch_msix}{'-prueba' if prueba else ''}.msix")
    parcial = final + ".parcial"
    os.makedirs(carpeta, exist_ok=True)
    if os.path.exists(parcial):          # de una ejecución cortada
        os.remove(parcial)
    with zipfile.ZipFile(pkg) as z:          # carpeta raíz del zip = MOZ_APP_NAME = nombre del ejecutable
        raices = {n.split("/", 1)[0] for n in z.namelist()}
    if len(raices) != 1:
        raise Error(f"{os.path.basename(pkg)} no tiene una sola carpeta raíz: {sorted(raices)}", 3)
    instdir = f"{nombre} Package Root"     # msix.py: «<nombre> Package Root» dentro de VFS/ProgramFiles
    exe_rel = f"VFS/ProgramFiles/{instdir}/{raices.pop()}.exe"
    cache_msix = os.path.join(os.path.dirname(os.path.dirname(makemsix)), "cache", "mach-msix")
    pfx = cer = None
    if a.firma_local:
        pfx, cer = certificado_prueba_msix()
    info(f"identidad {nombre_identidad} · {editor} · versión {version} · {arch_msix}" +
         (" (PROVISIONAL)" if provisionales else ""))
    with tempfile.TemporaryDirectory(dir=WORK, prefix=".msix-") as tmp:
        registro = os.path.join(tmp, "carpeta")
        sustituto = os.path.join(tmp, "makeappx")
        escribir(sustituto, SUSTITUTO_MAKEAPPX, 0o755)
        os.environ["AEGIS_MSIX_CARPETA"] = registro
        mach(["repackage", "msix", "--input", pkg, "--channel", "unofficial", "--arch", arch,
              "--identity-name", nombre, "--vendor", nombre, "--publisher", editor,
              "--publisher-display-name", t["Package/Properties/PublisherDisplayName"], "--version", version,
              "--makeappx", sustituto, "--output", os.path.join(tmp, "sin-usar.msix")], a.objetivo)
        if not os.path.isfile(registro):
            raise Error("mach repackage msix terminó sin llegar a empaquetar", 1)
        with open(registro, encoding="utf-8") as f:
            preparada = os.path.realpath(f.read().strip())
        if not preparada.startswith(os.path.realpath(cache_msix) + os.sep):
            raise Error(f"mach preparó el paquete en un sitio inesperado: {preparada}", 3)
        try:
            ajustar_manifiesto(os.path.join(preparada, "AppxManifest.xml"), nombre_identidad, editor, t, nombre)
            dist = os.path.join(preparada, *exe_rel.split("/")[:-1], "distribution", "distribution.ini")
            if not os.path.isfile(dist):
                raise Error("mach ya no pone distribution/distribution.ini en el paquete: revisa cmd_msix", 3)
            with open(os.path.join(REPO, "packaging", "msix", "distribution.ini"), "rb") as f:
                escribir(dist, f.read())
            info(f"empaquetando con makemsix ({os.path.basename(final)})")
            run([makemsix, "pack", "-d", preparada, "-p", parcial])
        finally:
            shutil.rmtree(preparada, ignore_errors=True)     # unos 400 MB en ~/.mozbuild/cache/mach-msix
    try:
        if a.firma_local:
            run([makemsix, "sign", "-p", parcial, "-c", pfx])
        esperado = {"Identity": {"Name": nombre_identidad, "Publisher": editor, "Version": version,
                                 "ProcessorArchitecture": arch_msix},
                    "Properties": {"DisplayName": t["Package/Properties/DisplayName"],
                                   "PublisherDisplayName": t["Package/Properties/PublisherDisplayName"]}}
        comprobar_msix(parcial, makemsix, a.firma_local, esperado, assets, exe_rel)
    except BaseException:
        if os.path.exists(parcial):
            os.remove(parcial)
        raise
    os.replace(parcial, final)
    hecho(f"{final} ({os.path.getsize(final) // (1 << 20)} MB) comprobado")
    if a.firma_local:
        destino_cer = os.path.join(carpeta, "aegis-msix-prueba.cer")
        shutil.copyfile(cer, destino_cer + ".parcial")
        os.replace(destino_cer + ".parcial", destino_cer)
        hecho(f"firmado con el certificado de pruebas; instálalo en Windows desde {destino_cer} (docs/TIENDA.md)")
    elif prueba:
        info("paquete de prueba sin firmar: sirve para revisarlo, no para instalarlo ni subirlo")
    else:
        info("súbelo en Partner Center › tu app › Paquetes (docs/TIENDA.md). La Tienda lo firma.")
    return 0


def cmd_estado(a):
    up = upstream()
    src = arbol()
    print(f"Firefox      {up['version']} ({up['canal']}) · Aegis {version_aegis()}")
    print(f"Trabajo      {WORK}")
    print(f"Árbol        {src}{'' if os.path.exists(src) else '  (sin preparar)'}")
    for o in OBJETIVOS:
        print(f"Objdir       {objdir(o)}{'' if os.path.exists(objdir(o)) else '  (sin compilar)'}  [{o}]")
    print(f"Claves MAR   {'sí' if os.path.exists(os.path.join(FIRMA, 'mar-primaria.pem')) else 'no'} ({FIRMA})")
    try:
        _, prov = tienda()
        print(f"Tienda       identidad {'provisional: faltan ' + ', '.join(prov) if prov else 'completa'} "
              "(branding/marca.json › tienda; docs/TIENDA.md)")
    except Error as e:
        print(f"Tienda       {e}")
    ser = series()
    print(f"Parches      {len(ser)} en patches/series")
    print(f"Motor        de Escudos: {motor_escudos()} (upstream.json › escudos › motor)")
    if os.path.exists(os.path.join(src, ".git")):
        ap = aplicados(src)
        print(f"Aplicados    {len(ap)}")
        for p in ser:
            print(f"   {'✓' if p in ap else '·'} {p}")
    return 0


def main():
    ap = argparse.ArgumentParser(prog="aegis.py", description=__doc__.split("\n\n")[0])
    sub = ap.add_subparsers(dest="orden", required=True)
    sub.add_parser("fetch")
    p = sub.add_parser("prepare")
    p.add_argument("--limpio", action="store_true", help="borra el árbol (no el objdir) y empieza de cero")
    for q in (p, sub.add_parser("mozconfig")):
        q.add_argument("--objetivo", default=None, choices=OBJETIVOS, help="sin él, todos")
        q.add_argument("--marca", default="aegis", choices=["aegis", "unofficial"])
    sub.add_parser("patch").add_argument("--check", action="store_true")
    for n in ("overlay", "export", "estado", "claves-mar", "recursos-escudos", "filtros"):
        sub.add_parser(n)
    con_objetivo = {n: sub.add_parser(n) for n in ("bootstrap", "build", "package", "mar", "run", "instalar-prueba",
                                                   "msix")}
    for q in con_objetivo.values():
        q.add_argument("--objetivo", default=OBJETIVO, choices=OBJETIVOS)
    con_objetivo["instalar-prueba"].add_argument("--destino", required=True,
                                                  help="carpeta de Windows, p. ej. /mnt/c/Users/<tú>/Aegis-pruebas")
    con_objetivo["instalar-prueba"].add_argument("--sin-dev", action="store_true",
                                                  help="sin el cargador de desarrollo (como una versión publicada)")
    con_objetivo["run"].add_argument("resto", nargs=argparse.REMAINDER)
    con_objetivo["build"].add_argument("--rapido", action="store_true",
                                       help="solo interfaz (JS, CSS, FTL, prefs): mach build faster")
    modo_msix = con_objetivo["msix"].add_mutually_exclusive_group()
    modo_msix.add_argument("--prueba", action="store_true",
                           help="admite la identidad provisional; en salida/pruebas, sin firmar (no se sube)")
    modo_msix.add_argument("--firma-local", action="store_true",
                           help="como --prueba y firmado con el certificado autofirmado de ~/.config/aegis-firma")
    con_objetivo["msix"].add_argument("--privado", action="store_true",
                                      help="fase 0: el envío a la Tienda será con audiencia privada")
    sub.add_parser("publicar").add_argument("--borrador", action="store_true")
    sub.add_parser("tor-fijar").add_argument("--version", default=None,
                                             help="versión de Tor Browser (sin ella, la estable actual)")
    a = ap.parse_args()
    try:
        # `filtros` solo descarga listas al repo: también vale desde Windows.
        if a.orden != "filtros":
            comprobar_entorno()
        return globals()[f"cmd_{a.orden.replace('-', '_')}"](a)
    except Error as e:
        print(f"✗ {e}", file=sys.stderr)
        return e.codigo
    except subprocess.CalledProcessError as e:
        print(f"✗ falló ({e.returncode}): {' '.join(map(str, e.cmd))}", file=sys.stderr)
        return 1
    except OSError as e:          # red, disco, permisos
        print(f"✗ {e}", file=sys.stderr)
        return 1
    except KeyboardInterrupt:
        return 1


if __name__ == "__main__":
    sys.exit(main())
