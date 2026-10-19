#!/usr/bin/env python3
"""Auditoría de red de Aegis: qué intenta conectar el navegador por su cuenta (docs/GUIA.md, principio 1).

    python tools/auditar-red.py --exe C:\\…\\Aegis\\firefox\\firefox.exe
        perfil nuevo, 10 minutos sin tocar nada: tiene que dar 0 intentos de salida
    python tools/auditar-red.py --exe … --minutos 10 --aceptar --despues 10
        lo mismo y, después, «Aceptar» en about:conexiones con los interruptores de serie: solo las de CONEXIONES.md
    python tools/auditar-red.py --exe … --aceptar --grupos actualizaciones,seguridad
        aceptar solo esos grupos (el resto, apagados)
    python tools/auditar-red.py --exe … --directo
        sin el proxy del banco: las conexiones salen de verdad y se ven por DNS (MOZ_LOG) y netstat

Cómo mira (tres caminos, para que no se escape nada):
1. Proxy (de serie): el navegador usa para todo el proxy local de tools/pruebas/red.py, que no deja salir nada y apunta
   cada intento (CONNECT host:puerto o la URL http). Así se ve la dirección y no sale ningún paquete del equipo.
2. DNS: MOZ_LOG=nsHostResolver:5 apunta cada nombre que el navegador intenta resolver él mismo. Con el proxy no
   debería resolver ninguno (lo resuelve el proxy): uno aquí es una conexión que se salta el proxy.
3. TCP: netstat cada 2 s, las conexiones de los procesos del navegador que no van a 127.0.0.1 (su número es el de
   muestras en que se vio abierta, no el de conexiones; en el modo directo se ven por IP, sin nombre).
UDP (QUIC/HTTP3, STUN) no se ve con netstat; sin navegar no debería haber (y con proxy HTTP no se usa HTTP/3). Para
lo que no pase por nada de esto, pktmon (Windows) a mano: ver docs/CONEXIONES.md.

El perfil de prueba solo lleva lo imprescindible: Marionette (para pulsar «Aceptar») y, en el modo proxy, el proxy.
Código de salida: 0 si antes de aceptar no hay ningún intento y después solo hay hosts de la lista de CONEXIONES.md;
1 si no; 2 si la prueba no pudo hacerse.
"""
import argparse
import datetime
import glob
import json
import os
import re
import shutil
import socket
import subprocess
import sys
import tempfile
import time

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(AQUI, "pruebas"))

import red  # noqa: E402
from marionette import ErrorMarionette, Marionette  # noqa: E402

REPO = os.path.dirname(AQUI)

# Lo que puede salir tras aceptar, por grupo (docs/CONEXIONES.md). Un host que no encaje es un fallo.
PERMITIDOS = [
    # Listas propias de los Escudos, de sus autores (escudos/catalogo.json).
    ("listas de los Escudos", r"^easylist\.to$|^easylist-downloads\.adblockplus\.org$|^filters\.adtidy\.org$"
                              r"|^ublockorigin\.github\.io$|^ublockorigin\.pages\.dev$|^raw\.githubusercontent\.com$"),
    ("actualizaciones", r"(^|\.)github\.com$|(^|\.)githubusercontent\.com$"),
    ("seguridad / listas (Remote Settings)",
     r"^firefox\.settings\.services\.mozilla\.com$|^firefox-settings-attachments\.cdn\.mozilla\.net$"
     r"|^content-signature-2\.cdn\.mozilla\.net$"),
    ("códecs", r"^aus5\.mozilla\.org$|^ciscobinary\.openh264\.org$|(^|\.)gvt1\.com$|^update\.googleapis\.com$"),
    ("safe browsing", r"^safebrowsing\.googleapis\.com$"),
    ("notificaciones (push)", r"^push\.services\.mozilla\.com$"),
]
LOCALES = {"localhost", "127.0.0.1", "::1"}


def puerto_libre():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def grupo_de(host):
    for nombre, patron in PERMITIDOS:
        if re.search(patron, host):
            return nombre
    return None


def host_de(destino):
    """Host de un intento del proxy: «host:443» (CONNECT) o «http://host/ruta»."""
    if "://" in destino:
        return re.sub(r"^[a-z]+://", "", destino).split("/")[0].split(":")[0].lower()
    return destino.rsplit(":", 1)[0].strip("[]").lower()


class Registros:
    """Los archivos de MOZ_LOG (uno por proceso) leídos por tramos: lo nuevo desde la última vez."""

    LINEA = re.compile(r"Resolving host \[([^\]<]+)")

    def __init__(self, prefijo):
        self.prefijo = prefijo
        self.leido = {}

    def nuevos(self):
        hosts = {}
        for ruta in glob.glob(self.prefijo + "*"):
            try:
                with open(ruta, "rb") as f:
                    f.seek(self.leido.get(ruta, 0))
                    datos = f.read()
                    self.leido[ruta] = f.tell()
            except OSError:
                continue
            for m in self.LINEA.finditer(datos.decode("utf-8", "replace")):
                h = m.group(1).strip().lower()
                if h not in LOCALES:
                    hosts[h] = hosts.get(h, 0) + 1
        return hosts


class Auditoria:
    def __init__(self, a):
        self.a = a
        self.tmp = tempfile.mkdtemp(prefix="aegis-auditar-red-")
        self.perfil = os.path.join(self.tmp, "perfil")
        os.makedirs(self.perfil)
        self.log = os.path.join(self.tmp, "moz-log", "red")
        os.makedirs(os.path.dirname(self.log))
        self.srv = None
        if not a.directo:
            certs = red.crear_certificados(os.path.join(self.tmp, "tls"), ["aegis-auditoria.test"])
            self.srv = red.ServidorBanco({}, lambda *x: (204, {}, b""), certs).arrancar()
        self.puerto = puerto_libre()
        self.proceso = None
        self.m = None
        self.vigia = None
        self.dns = Registros(self.log)
        self.fases = []

    def user_js(self):
        prefs = {
            # Marionette en un puerto propio y sin sus «prefs recomendadas», que cambian decenas de ajustes (red,
            # actualizaciones…): se prueba Aegis tal cual.
            "marionette.port": self.puerto,
            "remote.prefs.recommended": False,
        }
        if self.srv:
            # Todo por el proxy que no deja salir nada (y sin salida directa si falla: ya es lo de Aegis).
            prefs.update({
                "network.proxy.type": 1,
                "network.proxy.http": "127.0.0.1",
                "network.proxy.http_port": self.srv.puerto,
                "network.proxy.ssl": "127.0.0.1",
                "network.proxy.ssl_port": self.srv.puerto,
                "network.proxy.no_proxies_on": "",
            })
        with open(os.path.join(self.perfil, "user.js"), "w", encoding="utf-8", newline="\n") as f:
            for k, v in prefs.items():
                f.write(f"user_pref({json.dumps(k)}, {json.dumps(v)});\n")

    def arrancar(self):
        self.user_js()
        # nsHostResolver: los nombres que resuelve. Con --log se añaden otros módulos (p. ej. nsHttp:5, para ver la URL
        # y quién abre cada canal; ocupa mucho).
        modulos = ",".join(["timestamp", "nsHostResolver:5", *([self.a.log] if self.a.log else [])])
        entorno = {**os.environ, "MOZ_LOG": modulos, "MOZ_LOG_FILE": self.log}
        salida = open(os.path.join(self.tmp, "navegador.log"), "wb")
        # -remote-allow-system-access: Marionette puede ejecutar código en la ventana (para pulsar «Aceptar»).
        args = [self.a.exe, "-no-remote", "-marionette", "-remote-allow-system-access", "-profile", self.perfil]
        if self.a.sin_ventana:
            # Sin ventana en el escritorio: nadie puede tocarla sin querer, y no salen diálogos.
            args.insert(1, "-headless")
        self.proceso = subprocess.Popen(args,
                                        env=entorno, stdout=salida, stderr=subprocess.STDOUT)
        self.t0 = time.monotonic()
        self.vigia = red.VigiaRed(self.proceso.pid).arrancar()
        self.m = Marionette(self.puerto, espera=120)
        self.m.sesion()

    def cortar(self, nombre):
        """Cierra una fase: lo que ha intentado salir desde la anterior."""
        externas = self.srv.registro.lista_externas() if self.srv else []
        ya = sum(len(f["proxy"]) for f in self.fases)
        tcp = self.vigia.fuera
        self.vigia.parar()
        fase = {
            "fase": nombre,
            "segundos": round(time.monotonic() - self.t0),
            "proxy": externas[ya:],
            "dns": self.dns.nuevos(),
            "tcp": {k: {"veces": v["veces"], "pids": sorted(v["pids"])} for k, v in tcp.items()},
        }
        self.fases.append(fase)
        self.t0 = time.monotonic()
        self.vigia = red.VigiaRed(self.proceso.pid).arrancar()
        return fase

    def esperar(self, minutos, que):
        fin = time.monotonic() + minutos * 60
        print(f"  {que}: {minutos} min sin tocar nada", flush=True)
        while time.monotonic() < fin:
            if self.proceso.poll() is not None:
                raise RuntimeError("el navegador se ha cerrado durante la prueba")
            time.sleep(5)

    def aceptar(self, grupos):
        """Pulsa «Aceptar» en about:conexiones, que tiene que haberse abierto sola en la primera ventana."""
        self.m._contexto("chrome")
        abierta = self.m.chrome("""
            return gBrowser.tabs.some(t => t.linkedBrowser.currentURI?.spec == "about:conexiones");
        """)
        r = self.m.chrome("""
            const tab = gBrowser.tabs.find(t => t.linkedBrowser.currentURI?.spec == "about:conexiones");
            if (!tab) { return "sin-pagina"; }
            const doc = tab.linkedBrowser.contentDocument;
            const elegir = arguments[0];
            if (elegir) {
              for (const c of doc.querySelectorAll("input[data-grupo]")) {
                c.checked = !c.disabled && elegir.includes(c.dataset.grupo);
              }
            }
            doc.getElementById("conexiones-aceptar").click();
            return [...doc.querySelectorAll("input[data-grupo]")].filter(c => c.checked).map(c => c.dataset.grupo);
        """, grupos)
        if r == "sin-pagina":
            raise RuntimeError("about:conexiones no se ha abierto en la primera ventana")
        estado = self.m.chrome("""
            return {
              aceptadas: Services.prefs.getBoolPref("aegis.conexiones.aceptadas", false),
              colecciones: Services.prefs.getStringPref("aegis.remotesettings.colecciones", ""),
              actualizaciones: Services.prefs.getBoolPref("app.update.aegis.automaticas", false),
              listas: Services.prefs.getBoolPref("browser.safebrowsing.update.enabled", true),
              push: Services.prefs.getBoolPref("dom.push.connection.enabled", true),
              gmp: Services.prefs.getBoolPref("media.gmp-manager.updateEnabled", true),
            };
        """)
        return {"pagina_abierta_sola": abierta, "grupos": r, "prefs": estado}

    # Con --rastrear: cada canal de red que se abre en el proceso principal, con quién lo abre (principales, tipo y la
    # pila de JS si lo abre código del navegador). Para encontrar el origen de una conexión que no debería salir.
    JS_RASTREAR = """
        if (!window.__aegisCanales) {
          window.__aegisCanales = [];
          const obs = (subject) => {
            try {
              const ch = subject.QueryInterface(Ci.nsIHttpChannel);
              const li = ch.loadInfo;
              let pila = [];
              for (let f = Components.stack; f && pila.length < 25; f = f.caller) {
                if (f.filename) { pila.push(`${f.filename}:${f.lineNumber} ${f.name || ""}`); }
              }
              window.__aegisCanales.push({
                t: Date.now() / 1000, url: ch.URI.spec,
                tipo: li?.externalContentPolicyType, cargador: li?.loadingPrincipal?.origin ?? null,
                desencadenante: li?.triggeringPrincipal?.origin ?? null, sistema: !!li?.triggeringPrincipal?.isSystemPrincipal,
                contexto: li?.browsingContext?.currentURI?.spec ?? null,
                pila,
              });
            } catch (e) {}
          };
          Services.obs.addObserver(obs, "http-on-opening-request");
          window.__aegisObs = obs;
        }
        return true;
    """

    # Con --simular-reposo: lo que Firefox hace cuando el equipo está inactivo, que con alguien usando el equipo durante
    # la prueba no llega a pasar (el servicio de inactividad mira la actividad de todo Windows): las tareas «tardías»
    # de BrowserGlue (tras 20 s sin actividad) y «idle-daily» (tras 3 min).
    JS_REPOSO = """
        const glue = Cc["@mozilla.org/browser/browserglue;1"].getService().wrappedJSObject;
        glue._scheduleBestEffortUserIdleTasks();
        Services.obs.notifyObservers(null, "idle-daily");
        return true;
    """

    def simular_reposo(self):
        return self.m.chrome(self.JS_REPOSO)

    def rastrear(self):
        self.m.chrome(self.JS_RASTREAR)

    def canales(self):
        return self.m.chrome("const c = window.__aegisCanales || []; window.__aegisCanales = []; return c;")

    def estado_inicial(self):
        return self.m.chrome("""
            return {
              aceptadas: Services.prefs.getBoolPref("aegis.conexiones.aceptadas", false),
              colecciones: Services.prefs.getStringPref("aegis.remotesettings.colecciones", "?"),
              actualizaciones: Services.prefs.getBoolPref("app.update.aegis.automaticas", true),
              listas: Services.prefs.getBoolPref("browser.safebrowsing.update.enabled", true),
              push: Services.prefs.getBoolPref("dom.push.connection.enabled", true),
              gmp: Services.prefs.getBoolPref("media.gmp-manager.updateEnabled", true),
              pestanas: gBrowser.tabs.map(t => t.linkedBrowser.currentURI?.spec),
            };
        """)

    def cerrar(self):
        if self.m:
            self.m.salir()
        if self.proceso:
            try:
                self.proceso.wait(timeout=60)
            except subprocess.TimeoutExpired:
                # Solo el árbol de este navegador (nunca por nombre de imagen).
                subprocess.run(["taskkill", "/PID", str(self.proceso.pid), "/T", "/F"], capture_output=True)
        if self.vigia:
            self.vigia.parar()
        if self.srv:
            self.srv.parar()


def resumir(fase):
    """{host: {"veces": n, "por": [proxy|dns|tcp]}} de una fase."""
    hosts = {}

    def anotar(h, por, n=1):
        d = hosts.setdefault(h, {"veces": 0, "por": set()})
        d["veces"] += n
        d["por"].add(por)

    for e in fase["proxy"]:
        anotar(host_de(e["destino"]), "proxy")
    for h, n in fase["dns"].items():
        anotar(h, "dns", n)
    for destino, d in fase["tcp"].items():
        anotar(destino, "tcp", d["veces"])
    return {h: {"veces": d["veces"], "por": sorted(d["por"])} for h, d in sorted(hosts.items())}


def main():
    # Redirigida a un archivo en Windows, la salida sería cp1252: con «✓» y las tildes, UTF-8.
    if not sys.stdout.isatty():
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    p = argparse.ArgumentParser(description="Auditoría de red de Aegis (perfil nuevo).")
    p.add_argument("--exe", required=True, help="ejecutable de Aegis (firefox.exe o aegis.exe de una build empaquetada)")
    p.add_argument("--minutos", type=float, default=10, help="minutos sin tocar nada antes de aceptar (de serie, 10)")
    p.add_argument("--aceptar", action="store_true", help="después, pulsar «Aceptar» en about:conexiones")
    p.add_argument("--grupos", help="con --aceptar: grupos encendidos, separados por comas (de serie, los marcados)")
    p.add_argument("--despues", type=float, default=10, help="minutos tras aceptar (de serie, 10)")
    p.add_argument("--directo", action="store_true", help="sin proxy: las conexiones salen de verdad")
    p.add_argument("--sin-ventana", action="store_true",
                   help="sin ventana (headless): la prueba no depende de que nadie toque el escritorio")
    p.add_argument("--simular-reposo", action="store_true",
                   help="al minuto, lo que Firefox hace con el equipo inactivo (tareas tardías e idle-daily)")
    p.add_argument("--rastrear", action="store_true",
                   help="apuntar cada canal http del proceso principal con quién lo abre (en el JSON)")
    p.add_argument("--log", help="módulos de MOZ_LOG que añadir (p. ej. nsHttp:5) para buscar el origen de una conexión")
    p.add_argument("--json", help="guardar el resultado en este archivo")
    p.add_argument("--mantener", action="store_true", help="no borrar el directorio temporal (perfil, registros)")
    a = p.parse_args()
    if not os.path.isfile(a.exe):
        print(f"No existe {a.exe}", file=sys.stderr)
        return 2
    grupos = [g.strip() for g in a.grupos.split(",")] if a.grupos else None

    au = Auditoria(a)
    print(f"Auditoría de red · {a.exe}\n  modo: {'directo (DNS y netstat)' if a.directo else 'proxy que no deja salir nada'}"
          f"\n  temporal: {au.tmp}", flush=True)
    resultado = {"exe": a.exe, "modo": "directo" if a.directo else "proxy",
                 "fecha": datetime.datetime.now().isoformat(timespec="seconds")}
    try:
        au.arrancar()
        resultado["inicial"] = au.estado_inicial()
        if a.rastrear:
            au.rastrear()
        if a.simular_reposo:
            au.esperar(1, "antes de simular el reposo")
            au.simular_reposo()
            au.esperar(max(a.minutos - 1, 0), "tras simular el reposo")
        else:
            au.esperar(a.minutos, "antes de aceptar")
        fase = au.cortar("antes")
        if a.rastrear:
            resultado["antes_canales"] = au.canales()
        resultado["antes"], resultado["antes_proxy"] = resumir(fase), fase["proxy"]
        if a.aceptar:
            resultado["aceptar"] = au.aceptar(grupos)
            print(f"  aceptado: {', '.join(resultado['aceptar']['grupos']) or 'ninguno'}", flush=True)
            au.esperar(a.despues, "después de aceptar")
            fase = au.cortar("después")
            if a.rastrear:
                resultado["despues_canales"] = au.canales()
            resultado["despues"], resultado["despues_proxy"] = resumir(fase), fase["proxy"]
    except (RuntimeError, ConnectionError, ErrorMarionette, OSError) as e:
        print(f"✗ la prueba no pudo hacerse: {e}", file=sys.stderr)
        return 2
    finally:
        au.cerrar()

    # Primero se guarda: si algo falla al escribir en la consola, el resultado no se pierde.
    if a.json:
        with open(a.json, "w", encoding="utf-8") as f:
            json.dump(resultado, f, ensure_ascii=False, indent=2)
    fallo = False
    print("\nAntes de aceptar (tiene que estar vacío):")
    if not resultado["antes"]:
        print("  ✓ 0 intentos de salida")
    for h, d in resultado["antes"].items():
        fallo = True
        print(f"  ✗ {h}: {d['veces']} ({', '.join(d['por'])})")
    if "despues" in resultado:
        print("\nDespués de aceptar:")
        if not resultado["despues"]:
            print("  (ningún intento)")
        for h, d in resultado["despues"].items():
            g = grupo_de(h.rsplit(":", 1)[0]) if not re.match(r"^[\d.]+:\d+$|^\[", h) else "IP (netstat)"
            marca = "✓" if g else "✗"
            fallo |= not g
            print(f"  {marca} {h}: {d['veces']} ({', '.join(d['por'])}) → {g or 'NO está en CONEXIONES.md'}")
    if a.mantener:
        print(f"\nRegistros en {au.tmp}")
    else:
        shutil.rmtree(au.tmp, ignore_errors=True)
    print("\n" + ("✗ HAY CONEXIONES NO PERMITIDAS" if fallo else "✓ Bien"))
    return 1 if fallo else 0


if __name__ == "__main__":
    sys.exit(main())
