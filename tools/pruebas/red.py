"""Red de los bancos de pruebas: todo en este equipo, sin Internet y sin servidores de nadie.

- Certificados: una autoridad (CA) de usar y tirar y un certificado para los dominios de prueba, creados con openssl
  en el directorio temporal de la prueba. La CA se instala solo en el perfil de prueba (cert9.db de ese perfil).
- ServidorBanco: un proxy HTTP local (127.0.0.1, puerto libre) que hace a la vez de servidor de los sitios de
  prueba. El navegador de prueba lo usa para TODO (network.proxy.*): las peticiones a los dominios de prueba se
  contestan aquí (también por HTTPS, con CONNECT y TLS local) y cualquier otra se corta y se apunta como «externa».
  Así los sitios tienen sus nombres y puertos reales (https://www.google.com/, http://sitio-a.test/), que es lo que
  miran la protección contra rastreo, Solo HTTPS, las cookies y Google limpio, y nada sale del equipo.
- Registro: cada petición que llega, con sus cabeceras (cookies, idioma, Referer…). Es la prueba de verdad de si una
  petición salió del navegador o se bloqueó antes.
- VigiaRed: comprueba por otros dos caminos que el navegador no se salta el proxy: las resoluciones DNS que apunta
  MOZ_LOG (nsHostResolver) y las conexiones TCP abiertas por sus procesos (netstat), que tienen que ir solo a 127.0.0.1.
"""
import ctypes
import ctypes.wintypes
import email.utils
import glob
import http.server
import json
import mimetypes
import os
import re
import shutil
import socket
import socketserver
import ssl
import subprocess
import threading
import time
import urllib.parse

GIF = bytes.fromhex("47494638396101000100800000000000ffffff21f90401000000002c00000000010001000002024401003b")


# ── Certificados ──────────────────────────────────────────────────────────────────────────────────────────────────

def buscar_openssl():
    """openssl del PATH o el que trae Git para Windows."""
    for candidato in (shutil.which("openssl"),
                      r"C:\Program Files\Git\usr\bin\openssl.exe",
                      r"C:\Program Files\Git\mingw64\bin\openssl.exe",
                      r"C:\Program Files\Git\ucrt64\bin\openssl.exe"):
        if candidato and os.path.isfile(candidato):
            return candidato
    raise SystemExit("Falta openssl (viene con Git para Windows): hace falta para el certificado de prueba.")


def crear_certificados(carpeta, hosts):
    """CA temporal y certificado de servidor con todos los `hosts` como nombres alternativos. Devuelve las rutas."""
    openssl = buscar_openssl()
    os.makedirs(carpeta, exist_ok=True)
    r = {n: os.path.join(carpeta, n) for n in ("ca.pem", "ca.key", "hoja.pem", "hoja.key", "hoja.csr", "ext.cnf")}

    def correr(*args):
        p = subprocess.run([openssl, *args], capture_output=True, text=True)
        if p.returncode:
            raise RuntimeError(f"openssl {' '.join(args[:2])}: {p.stderr.strip()}")

    correr("req", "-x509", "-newkey", "rsa:2048", "-nodes", "-sha256", "-days", "7",
           "-keyout", r["ca.key"], "-out", r["ca.pem"], "-subj", "/CN=Aegis banco de pruebas (CA temporal)",
           "-addext", "basicConstraints=critical,CA:TRUE", "-addext", "keyUsage=critical,keyCertSign,cRLSign")
    correr("req", "-newkey", "rsa:2048", "-nodes", "-sha256", "-keyout", r["hoja.key"], "-out", r["hoja.csr"],
           "-subj", "/CN=aegis-banco.test")
    with open(r["ext.cnf"], "w", encoding="ascii") as f:
        f.write("basicConstraints=CA:FALSE\nkeyUsage=critical,digitalSignature,keyEncipherment\n"
                "extendedKeyUsage=serverAuth\nsubjectAltName=" + ",".join(f"DNS:{h}" for h in sorted(hosts)) + "\n")
    correr("x509", "-req", "-sha256", "-days", "7", "-in", r["hoja.csr"], "-CA", r["ca.pem"], "-CAkey", r["ca.key"],
           "-CAcreateserial", "-out", r["hoja.pem"], "-extfile", r["ext.cnf"])
    with open(r["ca.pem"], encoding="ascii") as f:
        pem = f.read()
    r["ca.base64"] = "".join(l for l in pem.splitlines() if l and not l.startswith("-----"))
    return r


# ── Registro ──────────────────────────────────────────────────────────────────────────────────────────────────────

class Registro:
    """Lo que llega al servidor (sitios de prueba) y lo que se corta por ir fuera (externas). Seguro entre hilos."""

    def __init__(self):
        self._cerrojo = threading.Lock()
        self.peticiones = []
        self.externas = []

    def apuntar(self, entrada):
        with self._cerrojo:
            entrada["n"] = len(self.peticiones)
            self.peticiones.append(entrada)

    def apuntar_externa(self, entrada):
        with self._cerrojo:
            self.externas.append(entrada)

    def buscar(self, texto):
        with self._cerrojo:
            return [p for p in self.peticiones if texto in p["url"]]

    def todas(self):
        with self._cerrojo:
            return list(self.peticiones)

    def lista_externas(self):
        with self._cerrojo:
            return list(self.externas)


# ── Servidor ──────────────────────────────────────────────────────────────────────────────────────────────────────

class Manejador(http.server.BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
    server_version = "AegisBanco"
    sys_version = ""
    timeout = 60
    tls_host = None   # en un túnel CONNECT, el host del túnel

    def log_message(self, *args):   # sin ruido en la consola
        pass

    # ── Proxy ──

    def do_CONNECT(self):
        host, _, puerto = self.path.rpartition(":")
        srv = self.server
        if puerto == "443" and srv.sitio(host, "https"):
            self.send_response(200, "Connection Established")
            self.end_headers()
            try:
                tls = srv.contexto_tls.wrap_socket(self.connection, server_side=True)
            except (ssl.SSLError, OSError):
                self.close_connection = True
                return
            clase = type("ManejadorTLS", (Manejador,), {"tls_host": host})
            try:
                clase(tls, self.client_address, srv)
            except (OSError, ssl.SSLError):
                pass
            self.close_connection = True
            return
        if srv.sitio(host, None):
            # Un sitio de prueba sin HTTPS: el túnel se abre y la conexión se corta en el saludo TLS, como un servidor
            # que no habla TLS en el 443. (Un 502 del proxy lo vería el navegador como error del servidor, no como
            # «este sitio no tiene HTTPS», y no es lo que le pasa a quien navega sin proxy.)
            self.send_response(200, "Connection Established")
            self.end_headers()
            self.wfile.flush()
            self.close_connection = True
            return
        srv.registro.apuntar_externa({"t": time.time(), "metodo": "CONNECT", "destino": self.path})
        # Un sitio de fuera: el banco no deja salir nada.
        self.send_response(502, "Bad Gateway")
        self.send_header("Content-Length", "0")
        self.end_headers()
        self.close_connection = True

    def _url(self):
        """(esquema, host, ruta con consulta) de la petición, venga por el proxy o por un túnel TLS."""
        if self.tls_host:
            return "https", self.tls_host, self.path
        if self.path.startswith("http://"):
            p = urllib.parse.urlsplit(self.path)
            return "http", p.hostname or "", (p.path or "/") + (f"?{p.query}" if p.query else "")
        return "directo", self.headers.get("Host", ""), self.path

    def _atender(self):
        esquema, host, ruta = self._url()
        srv = self.server
        largo = int(self.headers.get("Content-Length") or 0)
        cuerpo = self.rfile.read(largo) if largo else b""
        if esquema == "directo" or not srv.sitio(host, esquema):
            srv.registro.apuntar_externa({"t": time.time(), "metodo": self.command, "destino": f"{esquema}://{host}{ruta}"})
            self._responder(502, b"", "text/plain")
            return
        url = f"{esquema}://{host}{ruta}"
        h = self.headers
        srv.registro.apuntar({
            "t": time.time(), "metodo": self.command, "url": url, "esquema": esquema, "host": host,
            "ruta": ruta.split("?")[0], "consulta": ruta.partition("?")[2],
            "cookie": h.get("Cookie", ""), "referer": h.get("Referer", ""), "idioma": h.get("Accept-Language", ""),
            "gpc": h.get("Sec-GPC", ""), "destino": h.get("Sec-Fetch-Dest", ""), "sitio": h.get("Sec-Fetch-Site", ""),
            "origen": h.get("Origin", ""), "ua": h.get("User-Agent", ""), "tipo": h.get("Content-Type", ""),
            "cuerpo": cuerpo[:2000].decode("utf-8", "replace"),
        })
        try:
            estado, cabeceras, datos = srv.contestar(self.command, esquema, host, ruta, h, cuerpo)
        except Exception as e:   # un fallo del banco no debe colgar la página: se ve en la respuesta
            estado, cabeceras, datos = 500, {"Content-Type": "text/plain; charset=utf-8"}, f"banco: {e!r}".encode()
        self._responder(estado, datos, None, cabeceras)

    def _responder(self, estado, datos, tipo, cabeceras=None):
        self.send_response(estado)
        cab = {"Cache-Control": "no-store", "Content-Length": str(len(datos))}
        if tipo:
            cab["Content-Type"] = tipo
        cab.update(cabeceras or {})
        for k, v in cab.items():
            if isinstance(v, list):
                for x in v:
                    self.send_header(k, x)
            else:
                self.send_header(k, v)
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(datos)

    do_GET = do_POST = do_HEAD = do_PUT = do_OPTIONS = _atender

    def handle_one_request(self):
        try:
            super().handle_one_request()
        except (ConnectionError, ssl.SSLError, socket.timeout, TimeoutError):
            self.close_connection = True


class ServidorBanco(socketserver.ThreadingMixIn, http.server.HTTPServer):
    """Proxy y servidor de los sitios de prueba. `sitios`: {host: {"http": bool, "https": bool}}."""
    daemon_threads = True
    allow_reuse_address = False

    def __init__(self, sitios, contestar, certificados):
        super().__init__(("127.0.0.1", 0), Manejador)
        self.sitios = sitios
        self.contestar = contestar
        self.registro = Registro()
        ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        ctx.load_cert_chain(certificados["hoja.pem"], certificados["hoja.key"])
        ctx.set_alpn_protocols(["http/1.1"])
        self.contexto_tls = ctx
        self.hilo = threading.Thread(target=self.serve_forever, name="banco", daemon=True)

    @property
    def puerto(self):
        return self.server_address[1]

    def sitio(self, host, esquema):
        s = self.sitios.get((host or "").lower())
        if s is None:
            return False
        return True if esquema is None else bool(s.get(esquema))

    def arrancar(self):
        self.hilo.start()
        return self

    def parar(self):
        self.shutdown()
        self.server_close()


# ── Respuestas comunes ────────────────────────────────────────────────────────────────────────────────────────────

def respuesta_archivo(ruta):
    with open(ruta, "rb") as f:
        datos = f.read()
    tipo = mimetypes.guess_type(ruta)[0] or "application/octet-stream"
    if tipo.startswith("text/") or tipo in ("application/javascript", "application/json", "image/svg+xml"):
        tipo += "; charset=utf-8"
    if ruta.endswith(".mjs"):
        tipo = "text/javascript; charset=utf-8"
    return 200, {"Content-Type": tipo}, datos


def respuesta_json(objeto, estado=200, cabeceras=None):
    cab = {"Content-Type": "application/json; charset=utf-8"}
    cab.update(cabeceras or {})
    return estado, cab, json.dumps(objeto, ensure_ascii=False).encode("utf-8")


def respuesta_neutra(destino):
    """Lo que contestaría un servidor cualquiera según lo que se pide: imagen, script, página o nada."""
    if destino == "image":
        return 200, {"Content-Type": "image/gif"}, GIF
    if destino == "script":
        return 200, {"Content-Type": "text/javascript; charset=utf-8"}, b"/* banco */"
    if destino in ("iframe", "frame", "document"):
        return 200, {"Content-Type": "text/html; charset=utf-8"}, b"<!doctype html><meta charset=utf-8><p>banco"
    return 204, {}, b""


def fecha_http(segundos_desde_ahora):
    return email.utils.formatdate(time.time() + segundos_desde_ahora, usegmt=True)


# ── Vigilancia de la red ──────────────────────────────────────────────────────────────────────────────────────────

class _PROCESSENTRY32(ctypes.Structure):
    _fields_ = [("dwSize", ctypes.wintypes.DWORD), ("cntUsage", ctypes.wintypes.DWORD),
                ("th32ProcessID", ctypes.wintypes.DWORD), ("th32DefaultHeapID", ctypes.c_void_p),
                ("th32ModuleID", ctypes.wintypes.DWORD), ("cntThreads", ctypes.wintypes.DWORD),
                ("th32ParentProcessID", ctypes.wintypes.DWORD), ("pcPriClassBase", ctypes.c_long),
                ("dwFlags", ctypes.wintypes.DWORD), ("szExeFile", ctypes.c_wchar * 260)]


def arbol_de_procesos(raiz):
    """PID de `raiz` y todos sus descendientes (Windows, sin dependencias: Toolhelp32)."""
    if os.name != "nt":
        return {raiz}
    k32 = ctypes.windll.kernel32
    k32.CreateToolhelp32Snapshot.restype = ctypes.wintypes.HANDLE
    instantanea = k32.CreateToolhelp32Snapshot(0x2, 0)
    hijos = {}
    try:
        e = _PROCESSENTRY32()
        e.dwSize = ctypes.sizeof(e)
        ok = k32.Process32FirstW(instantanea, ctypes.byref(e))
        while ok:
            hijos.setdefault(e.th32ParentProcessID, []).append(e.th32ProcessID)
            ok = k32.Process32NextW(instantanea, ctypes.byref(e))
    finally:
        k32.CloseHandle(instantanea)
    vistos, pendientes = set(), [raiz]
    while pendientes:
        p = pendientes.pop()
        if p not in vistos:
            vistos.add(p)
            pendientes.extend(hijos.get(p, []))
    return vistos


class VigiaRed:
    """Muestras de netstat cada `intervalo` s: conexiones TCP de los procesos del navegador que no van a 127.0.0.1."""

    def __init__(self, pid_raiz, intervalo=2.0):
        self.pid_raiz = pid_raiz
        self.intervalo = intervalo
        self.fuera = {}       # "ip:puerto" → {"pids": set, "veces": n}
        self.muestras = 0
        self._parar = threading.Event()
        self._hilo = threading.Thread(target=self._bucle, name="vigia-red", daemon=True)

    def arrancar(self, pid_raiz=None):
        if pid_raiz:
            self.pid_raiz = pid_raiz
        if not self._hilo.is_alive():
            self._parar.clear()
            self._hilo = threading.Thread(target=self._bucle, name="vigia-red", daemon=True)
            self._hilo.start()
        return self

    def parar(self):
        self._parar.set()
        if self._hilo.is_alive():
            self._hilo.join(timeout=10)

    def _bucle(self):
        while not self._parar.is_set():
            try:
                self.muestra()
            except Exception:
                pass
            self._parar.wait(self.intervalo)

    def muestra(self):
        pids = arbol_de_procesos(self.pid_raiz)
        salida = subprocess.run(["netstat", "-ano", "-p", "TCP"], capture_output=True, text=True,
                                errors="replace").stdout
        salida += subprocess.run(["netstat", "-ano", "-p", "TCPv6"], capture_output=True, text=True,
                                 errors="replace").stdout
        self.muestras += 1
        for linea in salida.splitlines():
            partes = linea.split()
            if len(partes) < 5 or partes[0].upper() != "TCP" or not partes[-1].isdigit():
                continue
            pid = int(partes[-1])
            remoto = partes[2]
            if pid not in pids or partes[3] == "LISTENING":
                continue
            ip = remoto.rsplit(":", 1)[0].strip("[]")
            if ip in ("127.0.0.1", "::1", "0.0.0.0", "::", "*") or ip.startswith("127."):
                continue
            d = self.fuera.setdefault(remoto, {"pids": set(), "veces": 0, "estado": partes[3]})
            d["pids"].add(pid)
            d["veces"] += 1


DNS_LINEA = re.compile(r"Resolving host \[([^\]]+)\]")


def resoluciones_dns(prefijo_log):
    """Hosts que el navegador ha intentado resolver por su cuenta, según los registros de MOZ_LOG (nsHostResolver)."""
    hosts = {}
    for ruta in glob.glob(prefijo_log + "*"):
        try:
            with open(ruta, encoding="utf-8", errors="replace") as f:
                for linea in f:
                    m = DNS_LINEA.search(linea)
                    if m:
                        h = m.group(1).split("<")[0].strip()
                        hosts[h] = hosts.get(h, 0) + 1
        except OSError:
            pass
    return hosts
