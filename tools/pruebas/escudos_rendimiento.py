#!/usr/bin/env python3
"""Lo que cuesta el bloqueador propio de Escudos: la misma build con el motor (aegis.escudos.motor = true, de serie) y
sin él (false: solo la protección contra rastreo de Firefox). Con --cosmetico, la misma build con el motor y con el
cosmético y los scriptlets (de serie) o sin ellos (aegis.escudos.cosmetico y aegis.escudos.scriptlets = false).

    python tools/pruebas/escudos_rendimiento.py --exe C:\\…\\firefox.exe [--veces 3] [--cosmetico]

Por cada configuración y vez, con un perfil nuevo y todo servido en local por el servidor del banco (nada sale del
equipo):
- primer arranque (perfil nuevo: compila las listas de la instantánea) y segundo arranque (carga el .dat guardado):
  primer pintado y «sesión restaurada» (Services.startup.getStartupInfo), y lo que tarda el motor en estar listo;
- memoria a los 10 s de cargar la página pesada (comun/carga.html: 300 peticiones a 20 sitios, un tercio de anuncios):
  la del proceso principal y la de todos (lo que ocupa el motor: la diferencia con y sin él);
- coste por petición en http-on-modify-request (aegis.escudos.medir = true) y tiempo de carga de la página pesada;
- cosmético (comun/dom.html: 3000 elementos con 537 clases y 1000 más después de cargar, en sitio-a.test, en
  www.youtube.com, con generichide y 136 KB de scriptlets, y en angrybirdsnest.com): tiempo hasta DOMContentLoaded y
  hasta la carga, el análisis parado por documento (document.blockParsing: consulta al padre, hojas y scriptlets) y
  lo que cuesta en el padre cada consulta al motor.
Imprime una tabla y deja el JSON en out/pruebas/.
"""
import argparse
import datetime
import json
import os
import shutil
import statistics
import sys
import tempfile
import time

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)

import red  # noqa: E402
import sitios  # noqa: E402
from escudos import puerto_libre  # noqa: E402
from navegador import Navegador, escribir_user_js, prefs_banco  # noqa: E402

REPO = os.path.dirname(os.path.dirname(AQUI))

JS_ARRANQUE = """
const i = Services.startup.getStartupInfo();
const base = i.process?.getTime?.() ?? 0;
const d = k => (i[k] && base ? i[k].getTime() - base : null);
return { primerPintado: d("firstPaint2") ?? d("firstPaint"), sesion: d("sessionRestored") };"""

JS_MOTOR = """
const fin = arguments[arguments.length - 1];
(async () => {
  if (!Services.prefs.getBoolPref("aegis.escudos.motor", true)) { fin({ apagado: true }); return; }
  const url = Services.prefs.getBoolPref("aegis.dev", false)
    ? "resource://aegis/escudos/" : "resource:///modules/aegis/escudos/";
  const t0 = ChromeUtils.now();
  const e = await ChromeUtils.importESModule(url + "listas.sys.mjs").AegisEscudosListas.estado();
  fin({ esperaMs: ChromeUtils.now() - t0, listo: e.listo, listas: e.listas.length, motor: e.motor });
})().catch(e => fin({ error: String(e) }));"""

JS_MEMORIA = """
const fin = arguments[arguments.length - 1];
ChromeUtils.requestProcInfo().then(p => {
  let hijos = 0;
  for (const c of p.children) { hijos += c.memory; }
  fin({ padreMB: p.memory / 1048576, todosMB: (p.memory + hijos) / 1048576 });
});"""

JS_COSMETICO = """
const url = Services.prefs.getBoolPref("aegis.dev", false) ? "resource://aegis/escudos/" : "resource:///modules/aegis/escudos/";
const C = ChromeUtils.importESModule(url + "cosmetico.sys.mjs").AegisEscudosCosmetico;
const M = ChromeUtils.importESModule(url + "motor.sys.mjs").AegisEscudosMotor;
const c = C.medidas();
const m = M.medidas();
if (arguments[0]) { C.reiniciarMedidas(); }
return { ...c, cosmeticos: m.cosmeticos, cosmeticoMs: m.cosmeticoMs, genericos: m.genericos, genericosMs: m.genericosMs,
         recursosMs: m.recursosMs, recursos: m.recursos };"""

PAGINAS_DOM = [("sitio-a.test", "normal"), ("www.youtube.com", "youtube"), ("angrybirdsnest.com", "especifica")]

JS_RED = """
const url = Services.prefs.getBoolPref("aegis.dev", false) ? "resource://aegis/escudos/" : "resource:///modules/aegis/escudos/";
const R = ChromeUtils.importESModule(url + "red.sys.mjs").AegisEscudosRed;
const m = R.medidas();
if (arguments[0]) { R.reiniciarMedidas(); }
return m;"""


def una_vez(a, config, srv, certs, tmp, n):
    motor, cosmetico = config["motor"], config["cosmetico"]
    perfil = os.path.join(tmp, f"perfil-{config['clave']}-{n}")
    os.makedirs(perfil)
    puerto = puerto_libre()
    prefs = prefs_banco(puerto, srv.puerto, sitios.SIMULADOS, sitios.RASTREO_SIMULADO)
    prefs.update({"aegis.escudos.motor": motor, "aegis.escudos.medir": True, "aegis.escudos.cosmetico": cosmetico,
                  "aegis.escudos.scriptlets": cosmetico})
    for par in a.pref or []:
        k, _, v = par.partition("=")
        prefs[k] = json.loads(v)
    escribir_user_js(perfil, prefs)
    salida = open(os.path.join(tmp, f"navegador-{n}.log"), "w", encoding="utf-8", errors="replace")
    datos = {"config": config["clave"], "motor": motor, "cosmetico": cosmetico}
    try:
        for arranque in ("primer", "segundo"):
            nav = Navegador(a.exe, perfil, puerto, {}, False)
            nav.arrancar(salida)
            try:
                if arranque == "primer":
                    nav.m.chrome("Cc['@mozilla.org/security/x509certdb;1'].getService(Ci.nsIX509CertDB)"
                                 ".addCertFromBase64(arguments[0], 'C,,');", certs["ca.base64"])
                datos[arranque] = {**nav.m.chrome(JS_ARRANQUE),
                                   "motor": nav.m.chrome(JS_MOTOR, asincrono=True, espera=180)}
                if arranque == "segundo":
                    nav.m.chrome(JS_RED, True)
                    cargas = []
                    for i in range(a.cargas):
                        nav.ir(f"https://sitio-a.test/carga.html?run=carga{n}{i}&caso=carga&fase=carga&auto=1")
                        cargas.append(nav.esperar_fase("carga", 60))
                    datos["red"] = nav.m.chrome(JS_RED, False)
                    datos["cargaMs"] = [c["ms"] for c in cargas]
                    datos["cargadas"] = [c["cargadas"] for c in cargas]
                    if motor:
                        nav.m.chrome(JS_COSMETICO, True)
                    datos["dom"] = {}
                    for host, nombre in PAGINAS_DOM:
                        vistas = []
                        for i in range(a.cargas):
                            nav.ir(f"https://{host}/dom.html?run=dom{n}{nombre}{i}&caso=carga&fase=dom&auto=1")
                            vistas.append(nav.esperar_fase("dom", 60))
                        datos["dom"][nombre] = vistas
                    if motor:
                        datos["cosmetico"] = nav.m.chrome(JS_COSMETICO, False)
                    time.sleep(10)
                    datos["memoria"] = nav.m.chrome(JS_MEMORIA, asincrono=True, espera=30)
            finally:
                nav.salir()
    finally:
        salida.close()
    return datos


def mediana(xs):
    xs = [x for x in xs if isinstance(x, (int, float))]
    return round(statistics.median(xs), 1) if xs else None


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    p = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    p.add_argument("--exe", required=True)
    p.add_argument("--veces", type=int, default=3)
    p.add_argument("--cargas", type=int, default=5, help="cargas de la página pesada por vez")
    p.add_argument("--pref", action="append", help="pref de más para el perfil, nombre=valor JSON (se puede repetir)")
    p.add_argument("--solo-motor", action="store_true", help="solo la configuración con motor")
    p.add_argument("--cosmetico", action="store_true",
                   help="comparar con y sin cosmético y scriptlets (con el motor en las dos)")
    a = p.parse_args()
    if a.cosmetico:
        configs = [{"clave": "con cosmético", "motor": True, "cosmetico": True},
                   {"clave": "sin cosmético", "motor": True, "cosmetico": False}]
    else:
        configs = [{"clave": "con motor", "motor": True, "cosmetico": True},
                   {"clave": "sin motor", "motor": False, "cosmetico": True}]
        if a.solo_motor:
            configs = configs[:1]
    tmp = tempfile.mkdtemp(prefix="aegis-rendimiento-escudos-")
    certs = red.crear_certificados(os.path.join(tmp, "tls"), sitios.HOSTS_TLS)
    srv = red.ServidorBanco(sitios.SITIOS, None, certs)
    srv.contestar = sitios.crear_contestador(sitios.Estado(), srv.registro)
    srv.arrancar()
    resultados = []
    try:
        for n in range(a.veces):
            for config in configs:
                r = una_vez(a, config, srv, certs, tmp, n)
                resultados.append(r)
                print(f"vez {n + 1} · {config['clave']}: {json.dumps(r, ensure_ascii=False)[:400]}")
    finally:
        srv.parar()
    tabla = {}
    for config in configs:
        rs = [r for r in resultados if r["config"] == config["clave"]]
        cos = [r["cosmetico"] for r in rs if r.get("cosmetico") and isinstance(r["cosmetico"], dict)]
        dom = lambda nombre, k: mediana([v[k] for r in rs for v in r["dom"][nombre] if v.get(k) is not None])
        tabla[config["clave"]] = {
            "primer arranque, primer pintado (ms)": mediana([r["primer"]["primerPintado"] for r in rs]),
            "primer arranque, motor listo tras el pintado (ms)": mediana([r["primer"]["motor"].get("esperaMs") for r in rs]),
            "compilar listas, fuera del hilo principal (ms)": mediana([r["primer"]["motor"].get("motor", {}).get("compilarMs") for r in rs]),
            "segundo arranque, primer pintado (ms)": mediana([r["segundo"]["primerPintado"] for r in rs]),
            "segundo arranque, sesión restaurada (ms)": mediana([r["segundo"]["sesion"] for r in rs]),
            "cargar el .dat, en un hilo de fondo (ms)": mediana([r["segundo"]["motor"].get("motor", {}).get("cargarMs") for r in rs]),
            "  de ello, en el hilo principal (ms)": mediana([r["segundo"]["motor"].get("motor", {}).get("cambiarMs") for r in rs]),
            "proceso principal (MB)": mediana([r["memoria"]["padreMB"] for r in rs]),
            "todos los procesos (MB)": mediana([r["memoria"]["todosMB"] for r in rs]),
            "página pesada, 300 peticiones (ms)": mediana([x for r in rs for x in r["cargaMs"]]),
            "µs por petición (media)": mediana([r["red"]["mediaUs"] for r in rs]),
            "µs por petición, solo el motor (media)": mediana([r["red"].get("motorUs") for r in rs]),
            "µs por petición bloqueada, contador (media)": mediana([r["red"].get("anotarUs") for r in rs]),
            "µs por petición (peor)": mediana([r["red"]["maximoMs"] * 1000 for r in rs]),
            "peticiones vistas / bloqueadas": f"{mediana([r['red']['peticiones'] for r in rs])} / {mediana([r['red']['bloqueadas'] for r in rs])}",
            "dom.html normal: DOMContentLoaded (ms)": dom("normal", "dcl"),
            "dom.html normal: carga (ms)": dom("normal", "carga"),
            "dom.html normal: 1000 elementos después (ms)": dom("normal", "dinamicoMs"),
            "dom.html normal: huecos ocultos (de 30)": dom("normal", "anunciosOcultos"),
            "dom.html youtube.com: DOMContentLoaded (ms)": dom("youtube", "dcl"),
            "dom.html youtube.com: carga (ms)": dom("youtube", "carga"),
            "dom.html angrybirdsnest.com: DOMContentLoaded (ms)": dom("especifica", "dcl"),
            "análisis parado por documento, media (ms)": mediana([c["bloqueoMs"] / c["bloqueos"] for c in cos if c.get("bloqueos")]),
            "análisis parado por documento, peor (ms)": mediana([c["bloqueoMaximoMs"] for c in cos if c.get("bloqueos")]),
            "  de ello, esperando al padre (IPC y su cola), media (ms)": mediana([c["esperaMs"] / c["bloqueos"] for c in cos if c.get("bloqueos")]),
            "    la consulta tarda en llegar al padre, media (ms)": mediana([c["llegadaMs"] / c["documentos"] for c in cos if c.get("documentos")]),
            "    el padre la contesta en, media (ms)": mediana([c["padreMs"] / c["documentos"] for c in cos if c.get("documentos")]),
            "  de ello, hojas en el hijo, media (ms)": mediana([c["hojasMs"] / c["bloqueos"] for c in cos if c.get("bloqueos")]),
            "  de ello, scriptlets en el hijo, media (ms)": mediana([c["scriptMs"] / c["bloqueos"] for c in cos if c.get("bloqueos")]),
            "documentos que llegaron al tope (1 s)": mediana([c["topes"] for c in cos]),
            "consulta cosmética en el padre, media (ms)": mediana([c["cosmeticoMs"] / c["cosmeticos"] for c in cos if c.get("cosmeticos")]),
            "consulta de clases e ids en el padre, media (ms)": mediana([c["genericosMs"] / c["genericos"] for c in cos if c.get("genericos")]),
            "consultas de clases e ids por página": mediana([c["genericosLotes"] / max(1, c["documentos"]) for c in cos]),
            "cargar recursos.json en el motor (ms)": mediana([c["recursosMs"] for c in cos]),
        }
    print()
    claves = [c["clave"] for c in configs]
    print(f"  {'':<52} " + " ".join(f"{k:>14}" for k in claves))
    for k in tabla[claves[0]]:
        print(f"  {k:<52} " + " ".join(f"{str(tabla[c][k]):>14}" for c in claves))
    ruta = os.path.join(REPO, "out", "pruebas", f"escudos-rendimiento-{datetime.datetime.now():%Y%m%d-%H%M}.json")
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    with open(ruta, "w", encoding="utf-8") as f:
        json.dump({"tabla": tabla, "resultados": resultados}, f, indent=1, ensure_ascii=False)
    print(f"\n{ruta}")
    shutil.rmtree(tmp, ignore_errors=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
