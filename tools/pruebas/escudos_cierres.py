#!/usr/bin/env python3
"""Escudos sin bucles de cierres: si el navegador muere mientras compila las listas, el arranque siguiente funciona,
bloquea con las listas de antes y la culpable queda en cuarentena (escudos/listas.sys.mjs, «Sin bucles de cierres»).

    python tools/pruebas/escudos_cierres.py --exe C:\\…\\firefox.exe

Siempre sobre una copia aislada de esa instalación (en un directorio temporal) y con perfiles nuevos: solo se cierra a
la fuerza el proceso que arranca esta prueba, nunca otro Aegis. El cierre se provoca matando ese proceso justo cuando
el marcador de compilación (aegis-escudos/compilando.json) aparece en el perfil: es lo mismo que deja un pánico de
adblock-rust (gkrust aborta el proceso entero). Nada sale del equipo: todo va por el proxy local del banco.

Escenarios:
1. «probar»: una versión nueva de AdGuard Tracking Protection muere en su prueba por separado → en cuarentena solo
   ella, sigue la de la instantánea, no se vuelve a aceptar el mismo texto, y un tercer arranque es normal (sin
   bucle).
2. «compilar» con una versión anterior descargada: otra versión nueva muere en la compilación de la tanda → vuelve la
   versión descargada anterior (sus reglas siguen), la nueva queda en cuarentena.
3. «instantánea»: la compilación del primer arranque (solo la instantánea de la build) muere → el motor no la vuelve a
   compilar con esta build (bloquea solo ETP) y los arranques siguientes son normales.
Además mide lo que cuestan las pruebas por separado frente a la compilación de la tanda (cinco listas grandes nuevas).

Informe en out/pruebas/<fecha>-escudos-cierres.{json,md}. Código de salida: 0 si todo está bien, 1 si algo falla.
"""
import argparse
import datetime
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)

import red  # noqa: E402
import sitios  # noqa: E402
from escudos import puerto_libre  # noqa: E402
from navegador import Navegador, copiar_aislada, escribir_user_js, prefs_banco  # noqa: E402

REPO = os.path.dirname(os.path.dirname(AQUI))

BASE = """const BASE = Services.prefs.getBoolPref("aegis.dev", false) ? "resource://aegis/escudos/"
  : "resource:///modules/aegis/escudos/";
const L = ChromeUtils.importESModule(BASE + "listas.sys.mjs").AegisEscudosListas;
const M = ChromeUtils.importESModule(BASE + "motor.sys.mjs").AegisEscudosMotor;
"""

JS_ESTADO = BASE + """
const fin = arguments[arguments.length - 1];
const URLS = arguments[0];
(async () => {
  const e = await L.estado();
  const bloquea = {};
  for (const u of URLS) { bloquea[u] = M.red(u, "https://sitio-a.test", "script") > 0; }
  const listas = Object.fromEntries(e.listas.map(l => [l.id, l.origen]));
  fin({ listo: e.listo, listas, incidencias: e.incidencias, cuarentena: e.cuarentena,
        instantaneaRota: e.instantaneaRota, bloquea, motor: e.motor });
})().catch(e => fin({ error: String(e) + "\\n" + e.stack }));"""

# Lanza la incorporación sin esperarla (el proceso puede morir dentro); el resultado queda en la ventana.
JS_LANZAR = BASE + """
const fin = arguments[arguments.length - 1];
const extra = arguments[0];
(async () => {
  const indice = await (await fetch(BASE + "filtros/filtros.json")).json();
  const textos = {};
  for (const [id, linea] of Object.entries(extra)) {
    textos[id] = (await (await fetch(BASE + "filtros/" + indice.listas[id].archivo)).text()) + "\\n" + linea + "\\n";
  }
  window.__aegisCierres = null;
  L._incorporar(textos).then(
    r => (window.__aegisCierres = r),
    e => (window.__aegisCierres = { error: String(e) })
  );
  fin(true);
})().catch(e => fin({ error: String(e) }));"""

JS_RESULTADO = "return window.__aegisCierres ?? null;"

CULPABLE = "https://aegis-culpable.test/a.js"
CULPABLE_2 = "https://aegis-culpable-2.test/a.js"
BUENA = "https://aegis-buena.test/a.js"
ANUNCIO = "https://ads.pubmatic.com/static/js/modulo-0.js"
URLS = [ANUNCIO, CULPABLE, CULPABLE_2, BUENA]
# La de la prueba por separado: la más grande (activa en Estricto+, el nivel de serie).
LISTA = "adguard-rastreo"
GRANDES = ["easylist", "easyprivacy", "ubo-filtros", "adguard-base", "adguard-rastreo"]


class Prueba:
    def __init__(self, a):
        self.a = a
        self.tmp = tempfile.mkdtemp(prefix="aegis-cierres-")
        self.exe = copiar_aislada(a.exe, os.path.join(self.tmp, "aegis"))
        self.certs = red.crear_certificados(os.path.join(self.tmp, "tls"), sitios.HOSTS_TLS)
        self.srv = red.ServidorBanco(sitios.SITIOS, None, self.certs)
        self.srv.contestar = sitios.crear_contestador(sitios.Estado(), self.srv.registro)
        self.resultados = []
        self.datos = {}
        self.salida = open(os.path.join(self.tmp, "navegador.log"), "w", encoding="utf-8", errors="replace")

    def comprobar(self, escenario, que, bien, detalle=""):
        self.resultados.append({"escenario": escenario, "que": que, "bien": bool(bien), "detalle": detalle})
        print(f"  {'✓' if bien else '✗'} {que}" + (f" ({detalle})" if detalle and not bien else ""), flush=True)

    def perfil(self, nombre):
        ruta = os.path.join(self.tmp, f"perfil-{nombre}")
        os.makedirs(ruta)
        return ruta

    def arrancar(self, perfil, primera=False):
        puerto = puerto_libre()
        escribir_user_js(perfil, prefs_banco(puerto, self.srv.puerto, sitios.SIMULADOS, sitios.RASTREO_SIMULADO))
        nav = Navegador(self.exe, perfil, puerto, {}, False)
        nav.arrancar(self.salida)
        if primera:
            nav.m.chrome("Cc['@mozilla.org/security/x509certdb;1'].getService(Ci.nsIX509CertDB)"
                         ".addCertFromBase64(arguments[0], 'C,,');", self.certs["ca.base64"])
        return nav

    def estado(self, nav):
        e = nav.m.chrome(JS_ESTADO, URLS, asincrono=True, espera=240)
        if e.get("error"):
            raise RuntimeError(e["error"])
        return e

    def matar_restos(self):
        """Los procesos hijos que sigan vivos, solo los de la copia aislada de esta prueba (por la ruta del .exe)."""
        orden = ("Get-CimInstance Win32_Process -Filter \"Name='firefox.exe'\" | Where-Object { $_.ExecutablePath "
                 f"-like '{os.path.dirname(self.exe)}*' }} | ForEach-Object {{ Stop-Process -Id $_.ProcessId -Force }}")
        subprocess.run(["powershell", "-NoProfile", "-Command", orden], capture_output=True, timeout=60)
        time.sleep(1)

    @staticmethod
    def marcador(perfil):
        """Lee el marcador sin impedir que Aegis lo borre: con open() de Python, Windows no deja borrar un archivo
        abierto, y una lectura a destiempo dejaría el marcador puesto (como si la compilación hubiera muerto)."""
        ruta = os.path.join(perfil, "aegis-escudos", "compilando.json")
        try:
            if os.name == "nt":
                import ctypes
                import msvcrt
                k32 = ctypes.WinDLL("kernel32", use_last_error=True)
                k32.CreateFileW.restype = ctypes.c_void_p
                # GENERIC_READ; FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE; OPEN_EXISTING.
                h = k32.CreateFileW(ruta, 0x80000000, 0x7, None, 3, 0x80, None)
                if h in (None, ctypes.c_void_p(-1).value):
                    return None
                with os.fdopen(msvcrt.open_osfhandle(h, os.O_RDONLY), encoding="utf-8") as f:
                    return json.load(f)
            with open(ruta, encoding="utf-8") as f:
                return json.load(f)
        except (OSError, ValueError):
            return None

    def matar_en(self, nav, perfil, fase, maximo=120):
        """Mata el proceso de esta prueba en cuanto el marcador de `fase` aparece. Devuelve el marcador que quedó."""
        fin = time.monotonic() + maximo
        while time.monotonic() < fin:
            m = self.marcador(perfil)
            if m and m.get("fase") == fase:
                # TerminateProcess directo sobre el proceso principal (el que compila): taskkill tarda demasiado para
                # una prueba de una lista, que dura décimas. Los procesos hijos se cierran solos al perderlo; matar()
                # recoge lo que quede del árbol.
                nav.proceso.kill()
                nav.proceso.wait(30)
                nav.matar()
                self.matar_restos()
                return self.marcador(perfil)
            time.sleep(0.005)
        nav.matar()
        return None

    # ── Escenarios ──

    def instantanea(self):
        print("\n3. La instantánea de la build muere al compilarse en el primer arranque")
        p = self.perfil("instantanea")
        nav = self.arrancar(p, primera=True)
        quedo = self.matar_en(nav, p, "compilar")
        self.comprobar("instantánea", "el proceso murió con el marcador puesto (sin listas descargadas)",
                       quedo is not None and quedo.get("sospechosas") == [], json.dumps(quedo))
        nav = self.arrancar(p)
        e = self.estado(nav)
        nav.salir()
        self.datos["instantanea-2"] = e
        inc = e["incidencias"]
        self.comprobar("instantánea", "el segundo arranque funciona y apunta la incidencia",
                       len(inc) == 1 and inc[0]["instantanea"], json.dumps(inc))
        self.comprobar("instantánea", "no vuelve a compilar la instantánea con esta build",
                       e["instantaneaRota"] and not e["listo"], f"rota={e['instantaneaRota']} listo={e['listo']}")
        self.comprobar("instantánea", "sin marcador tras el arranque", self.marcador(p) is None)
        nav = self.arrancar(p)
        e = self.estado(nav)
        nav.salir()
        self.datos["instantanea-3"] = e
        self.comprobar("instantánea", "tercer arranque normal: ninguna incidencia nueva (sin bucle)",
                       len(e["incidencias"]) == 1 and self.marcador(p) is None, json.dumps(e["incidencias"]))

    def probar(self):
        print("\n1. Una lista nueva muere en su prueba por separado")
        p = self.perfil("probar")
        nav = self.arrancar(p, primera=True)
        e = self.estado(nav)
        self.comprobar("probar", "primer arranque: motor listo con la instantánea",
                       e["listo"] and e["bloquea"][ANUNCIO])
        # La lista más grande (unos 350 000 líneas): su prueba por separado dura lo bastante para cerrar dentro.
        nav.m.chrome(JS_LANZAR, {LISTA: "||aegis-culpable.test^"}, asincrono=True, espera=60)
        quedo = self.matar_en(nav, p, "probar")
        self.comprobar("probar", f"el proceso murió en la prueba de {LISTA}, con el marcador puesto",
                       quedo and quedo["fase"] == "probar" and [s["id"] for s in quedo["sospechosas"]] == [LISTA],
                       json.dumps(quedo))
        sha_mala = quedo["sospechosas"][0]["sha256"] if quedo else None
        nav = self.arrancar(p)
        e = self.estado(nav)
        self.datos["probar-2"] = e
        inc = e["incidencias"]
        self.comprobar("probar", "el segundo arranque funciona: motor listo y bloquea con las listas de antes",
                       e["listo"] and e["bloquea"][ANUNCIO] and not e["bloquea"][CULPABLE], json.dumps(e["bloquea"]))
        self.comprobar("probar", f"{LISTA} sigue con la instantánea", e["listas"].get(LISTA) == "build",
                       str(e["listas"].get(LISTA)))
        self.comprobar("probar", f"incidencia apuntada: fase probar, solo {LISTA}",
                       len(inc) == 1 and inc[0]["fase"] == "probar" and inc[0]["listas"] == [LISTA],
                       json.dumps(inc))
        self.comprobar("probar", f"en cuarentena solo esa versión de {LISTA}",
                       [c["sha256"] for c in e["cuarentena"]] == [sha_mala], json.dumps(e["cuarentena"]))
        nav.m.chrome(JS_LANZAR, {LISTA: "||aegis-culpable.test^"}, asincrono=True, espera=60)
        r = nav.esperar(lambda: nav.m.chrome(JS_RESULTADO), 120, "la incorporación")
        self.comprobar("probar", "el mismo texto no se vuelve a aceptar",
                       r.get("fallos", {}).get(LISTA) == "en cuarentena", json.dumps(r))
        nav.salir()
        nav = self.arrancar(p)
        e = self.estado(nav)
        nav.salir()
        self.comprobar("probar", "tercer arranque normal: ninguna incidencia nueva (sin bucle)",
                       e["listo"] and len(e["incidencias"]) == 1 and self.marcador(p) is None,
                       json.dumps(e["incidencias"]))

    def compilar(self):
        print("\n2. Una lista nueva muere en la compilación de la tanda (con una versión descargada anterior)")
        p = self.perfil("compilar")
        nav = self.arrancar(p, primera=True)
        self.estado(nav)
        # Coste de las pruebas por separado: cinco listas grandes nuevas a la vez (una regla de más en cada una).
        extra = {i: f"||aegis-buena-{i}.test^" for i in GRANDES}
        extra["easylist"] = "||aegis-buena.test^"
        nav.m.chrome(JS_LANZAR, extra, asincrono=True, espera=60)
        r = nav.esperar(lambda: nav.m.chrome(JS_RESULTADO), 300, "la incorporación")
        self.datos["coste"] = r
        print(f"  coste: pruebas por separado {r.get('probarMs', 0):.0f} ms, tanda {r.get('tandaMs', 0):.0f} ms "
              f"({len(r.get('nuevas', []))} listas)")
        e = self.estado(nav)
        self.comprobar("compilar", "versión buena incorporada (easylist descargada, bloquea su regla nueva)",
                       sorted(r.get("nuevas", [])) == sorted(extra) and e["listas"].get("easylist") == "red"
                       and e["bloquea"][BUENA], json.dumps(r))
        nav.m.chrome(JS_LANZAR, {"easylist": "||aegis-buena.test^\n||aegis-culpable-2.test^"}, asincrono=True,
                     espera=60)
        quedo = self.matar_en(nav, p, "compilar")
        self.comprobar("compilar", "el proceso murió compilando la tanda, con el marcador puesto",
                       quedo and [s["id"] for s in quedo["sospechosas"]] == ["easylist"], json.dumps(quedo))
        nav = self.arrancar(p)
        e = self.estado(nav)
        nav.salir()
        self.datos["compilar-2"] = e
        inc = e["incidencias"]
        self.comprobar("compilar", "el segundo arranque funciona y vuelve la versión descargada anterior",
                       e["listo"] and e["listas"].get("easylist") == "red" and e["bloquea"][BUENA]
                       and not e["bloquea"][CULPABLE_2] and e["bloquea"][ANUNCIO], json.dumps(e["bloquea"]))
        self.comprobar("compilar", "incidencia apuntada: fase compilar, solo easylist",
                       len(inc) == 1 and inc[0]["fase"] == "compilar" and inc[0]["listas"] == ["easylist"],
                       json.dumps(inc))
        self.comprobar("compilar", "la versión nueva queda en cuarentena", len(e["cuarentena"]) == 1,
                       json.dumps(e["cuarentena"]))
        restos = [n for n in os.listdir(os.path.join(p, "aegis-escudos", "listas"))
                  if n.endswith((".nuevo", ".anterior"))]
        self.comprobar("compilar", "sin .nuevo ni .anterior sueltos", not restos, str(restos))
        nav = self.arrancar(p)
        e = self.estado(nav)
        nav.salir()
        self.comprobar("compilar", "tercer arranque normal: ninguna incidencia nueva (sin bucle)",
                       e["listo"] and len(e["incidencias"]) == 1 and self.marcador(p) is None,
                       json.dumps(e["incidencias"]))

    def ejecutar(self):
        self.srv.arrancar()
        try:
            for escenario in (self.probar, self.compilar, self.instantanea):
                try:
                    escenario()
                except Exception as e:  # noqa: BLE001 - un escenario roto no para los demás
                    self.comprobar(escenario.__name__, "el escenario terminó", False, repr(e))
                    # Su navegador pudo quedar abierto: fuera todo lo de esta copia antes del siguiente.
                    self.matar_restos()
        finally:
            self.matar_restos()
            self.srv.parar()
            self.salida.close()
        fallos = [r for r in self.resultados if not r["bien"]]
        print(f"\nResumen: {len(self.resultados) - len(fallos)} bien · {len(fallos)} ✗")
        nombre = f"{datetime.datetime.now():%Y%m%d-%H%M}-escudos-cierres"
        dest = os.path.join(REPO, "out", "pruebas")
        os.makedirs(dest, exist_ok=True)
        with open(os.path.join(dest, nombre + ".json"), "w", encoding="utf-8") as f:
            json.dump({"resultados": self.resultados, "datos": self.datos}, f, indent=1, ensure_ascii=False)
        with open(os.path.join(dest, nombre + ".md"), "w", encoding="utf-8") as f:
            f.write("# Escudos sin bucles de cierres\n\n| Escenario | Comprobación | |\n|---|---|---|\n")
            for r in self.resultados:
                f.write(f"| {r['escenario']} | {r['que']} | {'✓' if r['bien'] else '✗'} |\n")
            c = self.datos.get("coste", {})
            f.write(f"\nCoste de probar cada lista por separado: {c.get('probarMs', 0):.0f} ms para "
                    f"{len(c.get('nuevas', []))} listas; compilación de la tanda: {c.get('tandaMs', 0):.0f} ms.\n")
        print(os.path.join(dest, nombre + ".md"))
        if not self.a.mantener:
            shutil.rmtree(self.tmp, ignore_errors=True)
        return 1 if fallos else 0


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    p = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    p.add_argument("--exe", required=True, help="ejecutable de la copia de prueba (se copia aparte antes de usarlo)")
    p.add_argument("--mantener", action="store_true", help="no borrar el directorio temporal (perfiles, registro)")
    return Prueba(p.parse_args()).ejecutar()


if __name__ == "__main__":
    sys.exit(main())
