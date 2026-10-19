#!/usr/bin/env python3
"""Banco de pruebas de Escudos: prueba de verdad que el escudo funciona en todos los casos y modos.

    python tools/pruebas/escudos.py                    todo, con la copia de desarrollo (~/Aegis-pruebas)
    python tools/pruebas/escudos.py --instalada        con el Aegis instalado (o --exe C:\\…\\aegis.exe)
    python tools/pruebas/escudos.py --solo rastreadores,google
    python tools/pruebas/escudos.py --manual           abre Aegis con el banco para probarlo a mano
    python tools/pruebas/escudos.py --aislar           copia la instalación de prueba a un directorio temporal

Qué hace:
1. Crea en el directorio temporal una CA de usar y tirar, un perfil nuevo de Aegis y el servidor del banco
   (red.ServidorBanco): un proxy local que sirve los sitios de prueba (sitio-a.test, itisatracker.org,
   www.google.com…) y corta y apunta cualquier otra conexión. Nada sale del equipo.
2. Arranca Aegis con Marionette y recorre los casos en sus modos, cambiándolos desde el panel de Escudos como lo haría
   una persona. Cada página de prueba guarda lo que ve; el ejecutor añade lo que se ve en la interfaz (contador,
   panel, avisos, permisos).
3. El veredicto de cada caso lo da la web (tools/pruebas/escudos/comun/casos.js, en resultado.html): es la misma
   lógica que ve quien prueba a mano.
4. Informe: tabla en la consola y un HTML (y un Markdown) en out/pruebas/.

Código de salida: 0 si todo está bien (o solo hay «no discrimina», «a mano» e «información»), 1 si hay algún fallo
de Aegis o del banco, 2 si el banco no pudo ni arrancar.
"""
import argparse
import datetime
import html
import json
import os
import shutil
import socket
import sys
import tempfile
import time
import traceback

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)

import red  # noqa: E402
import sitios  # noqa: E402
from navegador import COPIA_DESARROLLO, Navegador, buscar_instalada, copiar_aislada, escribir_user_js, prefs_banco  # noqa: E402

REPO = os.path.dirname(os.path.dirname(AQUI))
SONDAS = os.path.join(sitios.RAIZ_WEB, "comun", "sondas.js")
BANCO = "https://aegis-banco.test"

# Fuentes de serie de Windows y las de los paquetes de idioma (escudos/fuentes-windows.json): lo que no esté en
# ninguna de las dos listas y sí en el equipo se oculta desde Básica (FontVisibilityLangPack); las de los paquetes de
# idioma, desde Estricta (FontVisibilityBaseSystem).
def cargar_fuentes():
    with open(os.path.join(AQUI, "escudos", "fuentes-windows.json"), encoding="utf-8") as f:
        d = json.load(f)
    return set(d["base"]), set(d["paquetes_idioma"])


def puerto_libre():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


class Banco:
    def __init__(self, a):
        self.a = a
        self.tmp = tempfile.mkdtemp(prefix="aegis-banco-escudos-")
        self.estado = sitios.Estado()
        self.certs = red.crear_certificados(os.path.join(self.tmp, "tls"), sitios.HOSTS_TLS)
        self.srv = red.ServidorBanco(sitios.SITIOS, None, self.certs)
        self.srv.contestar = sitios.crear_contestador(self.estado, self.srv.registro)
        self.srv.arrancar()
        exe = a.exe or (buscar_instalada() if a.instalada else COPIA_DESARROLLO)
        if not os.path.isfile(exe):
            raise SystemExit(f"No existe {exe}")
        if a.aislar:
            exe = copiar_aislada(exe, os.path.join(self.tmp, "aegis"))
        self.exe = exe
        self.perfil = os.path.join(self.tmp, "perfil")
        os.makedirs(self.perfil)
        self.puerto = puerto_libre()
        self.prefs = prefs_banco(self.puerto, self.srv.puerto, sitios.SIMULADOS, sitios.RASTREO_SIMULADO)
        for par in a.pref or []:
            k, _, v = par.partition("=")
            self.prefs[k] = json.loads(v)
        escribir_user_js(self.perfil, self.prefs)
        self.log = os.path.join(self.tmp, "moz")
        self.entorno = {"MOZ_LOG": "nsHostResolver:5", "MOZ_LOG_FILE": self.log}
        self.salida = open(os.path.join(self.tmp, "navegador.log"), "w", encoding="utf-8", errors="replace")
        self.n = None
        self.vigia = None
        self.resultados = []   # {caso, modo, run, comprobaciones}
        self.controles = []    # {titulo, fallos}
        self.errores = []
        self.inicio = time.time()

    # ── Navegador ──

    def arrancar(self, primera=False):
        # Se guarda antes de arrancar: si el arranque falla, cerrar() aún puede terminar el proceso.
        self.n = Navegador(self.exe, self.perfil, self.puerto, self.entorno, self.a.sin_ventana)
        self.n.arrancar(self.salida)
        if self.vigia is None:
            self.vigia = red.VigiaRed(self.n.proceso.pid).arrancar()
        else:
            self.vigia.arrancar(self.n.proceso.pid)
        if primera:
            # Los idiomas del «usuario» van en user.js solo para el primer arranque: user.js se aplica en cada
            # arranque y pisaría lo que Aegis cambia (Caja fuerte pone el inglés y lo deja guardado en prefs.js).
            escribir_user_js(self.perfil, {k: v for k, v in self.prefs.items() if k != "intl.accept_languages"})
            # La CA del banco, solo en este perfil (cert9.db), como raíz de confianza para servidores.
            self.n.m.chrome(
                "Cc['@mozilla.org/security/x509certdb;1'].getService(Ci.nsIX509CertDB).addCertFromBase64(arguments[0], 'C,,');",
                self.certs["ca.base64"])
        # Ventana normal (no maximizada) lejos de la esquina: así la posición y el tamaño de la pantalla se distinguen.
        self.n.m.rect(x=60, y=40, width=1200, height=860)
        time.sleep(1)

    def reiniciar(self):
        self.n.salir()
        self.vigia.parar()
        self.arrancar()

    def url(self, host, pagina, run, caso, fase, modo, esquema="https", **extra):
        from urllib.parse import urlencode
        q = {"run": run, "caso": caso, "fase": fase, **modo, "auto": "1", **extra}
        return f"{esquema}://{host}/{pagina}?{urlencode(q)}"

    def fase(self, host, pagina, run, caso, fase, modo, maximo=45, **extra):
        self.n.ir(self.url(host, pagina, run, caso, fase, modo, **extra))
        return self.n.esperar_fase(fase, maximo)

    def esperar_documento(self, prefijo, antes=None, maximo=20):
        """Espera a que la pestaña muestre un documento que empiece por `prefijo`; si no llega, devuelve el que haya
        (el veredicto lo dará como fallo, con lo que se ve de verdad)."""
        fin = time.monotonic() + maximo
        doc = None
        while time.monotonic() < fin:
            doc = self.n.documento() or ""
            if doc.startswith(prefijo) and (antes is None or self.n.id_documento() != antes):
                return doc
            time.sleep(0.3)
        return doc or "(nada)"

    def nav(self, run, fase, datos):
        """Lo visto en la interfaz, guardado como una fase más (casos.js lo evalúa)."""
        self.estado.guardar_fase(run, fase, {"fase": fase, **datos})

    def veredicto(self, caso, run, modo, guardar=True, etiqueta=None):
        from urllib.parse import urlencode
        self.n.ir(f"{BANCO}/resultado.html?{urlencode({'run': run, 'caso': caso, **modo})}")
        v = self.n.esperar(lambda: self.n.m.contenido("return window.__veredicto ?? null;"), 60, f"el veredicto de {caso}")
        if guardar:
            self.resultados.append({"caso": caso, "etiqueta": etiqueta or caso, "modo": modo, "run": run,
                                    "comprobaciones": v["comprobaciones"]})
            self.mostrar(etiqueta or caso, modo, v["comprobaciones"])
        return v

    def control(self, titulo, caso, run, modo_falso):
        """Caso de control: se evalúa lo observado con un modo que NO es el real. Tiene que salir algún fallo."""
        v = self.veredicto(caso, run, modo_falso, guardar=False)
        fallos = [c for c in v["comprobaciones"] if c["estado"] == "fallo"]
        self.controles.append({"titulo": titulo, "fallos": len(fallos), "ejemplo": fallos[0]["titulo"] if fallos else ""})
        print(f"  control · {titulo}: {'falla como debe' if fallos else 'NO FALLA (el banco no discrimina)'} "
              f"({len(fallos)} fallos)")

    def mostrar(self, etiqueta, modo, comps):
        cuenta = {}
        for c in comps:
            cuenta[c["estado"]] = cuenta.get(c["estado"], 0) + 1
        resumen = " ".join(f"{k}:{v}" for k, v in sorted(cuenta.items()))
        print(f"  {etiqueta:<34} {describir(modo):<52} {resumen}")
        for c in comps:
            if c["estado"] == "fallo":
                print(f"      ✗ {c['titulo']}: se esperaba {c['esperado']}; ha pasado {c['observado']}")

    def run(self, nombre):
        return f"{nombre}-{int(time.time() * 1000) % 10_000_000}"

    def modo(self, **cambios):
        m = {"nivel": "estricto", "escudos": "arriba", "cookies": "5", "huella": "equilibrada", "privada": "0",
             "permiso": "0", "google": "1", "contador": "peticiones", "molestias": "cva", "ubo": "0"}
        m.update({k: str(v) for k, v in cambios.items()})
        return m

    def limpia(self, host, run="prep", fase="limpia"):
        return self.fase(host, "limpia.html", run, "rastreadores", fase, self.modo())

    def bajar(self, host):
        """Baja los Escudos en `host` con el interruptor del panel."""
        self.limpia(host)
        if self.n.leer_panel()["sitio"]["on"]:
            self.n.interruptor("sitio")
        self.n.cerrar_panel()

    def subir(self, host):
        self.limpia(host)
        if not self.n.leer_panel()["sitio"]["on"]:
            self.n.interruptor("sitio")
        self.n.cerrar_panel()

    # ── Preparación ──

    def preparacion(self):
        comps = []

        def c(titulo, esperado, observado, bien, porque="", codigo=""):
            comps.append({"titulo": titulo, "esperado": str(esperado), "observado": str(observado),
                          "estado": "ok" if bien else "fallo", "porque": porque, "codigo": codigo})

        p = self.n.m.chrome("""
          const P = Services.prefs;
          return {
            categoria: P.getStringPref("browser.contentblocking.category", ""),
            huella: P.getStringPref("aegis.huella.nivel", ""),
            https: P.getBoolPref("dom.security.https_only_mode", false),
            cookies: P.getIntPref("network.cookie.cookieBehavior", -1),
            tp: P.getBoolPref("privacy.trackingprotection.enabled", false),
            google: P.getBoolPref("aegis.google.limpio", false),
            dev: P.getBoolPref("aegis.dev", false),
            version: Services.appinfo.version,
          };""")
        c("Perfil nuevo: protección contra rastreo estricta", "strict", p["categoria"], p["categoria"] == "strict",
          codigo="overlay/browser/components/aegis/AegisArranque.sys.mjs: aplicarEtpEstrictoUnaVez()")
        c("Perfil nuevo: huella «equilibrada»", "equilibrada", p["huella"], p["huella"] == "equilibrada",
          codigo="settings/prefs/42-huella.js")
        c("Perfil nuevo: Solo HTTPS", True, p["https"], p["https"] is True, codigo="settings/prefs/40-privacidad.js")
        c("Perfil nuevo: cookies de terceros aisladas (5)", 5, p["cookies"], p["cookies"] == 5)
        c("Perfil nuevo: Google limpio", True, p["google"], p["google"] is True, codigo="settings/prefs/59-google.js")
        # El clasificador conoce las entradas de prueba (sin esto, nada de «rastreadores» valdría).
        clasif = self.n.m.chrome("""
          const svc = Cc["@mozilla.org/url-classifier/dbservice;1"].getService(Ci.nsIURIClassifier);
          const feats = [svc.getFeatureByName("tracking-protection")];
          const uri = Services.io.newURI("https://itisatracker.org/");
          return new Promise(ok => svc.asyncClassifyLocalWithFeatures(uri, feats, Ci.nsIUrlClassifierFeature.blocklist,
            r => ok(r.map(x => x.list))));""")
        c("El clasificador reconoce el rastreador de prueba (itisatracker.org)", "en moztest-track-simple", clasif,
          bool(clasif) and "moztest-track-simple" in json.dumps(clasif), porque="Tabla de prueba integrada (LookupCache.cpp)")
        # El vídeo de prueba lo graba el propio navegador.
        try:
            d = self.fase("aegis-banco.test", "grabar-video.html", "prep", "control", "video", self.modo(), maximo=30)
            c("Vídeo de prueba grabado (WebM)", "> 1000 bytes", d.get("bytes"), (d.get("bytes") or 0) > 1000)
        except TimeoutError as e:
            c("Vídeo de prueba grabado (WebM)", "> 1000 bytes", e, False)
        c("HTTPS con la CA del banco", "la página carga por https", self.n.m.url(), self.n.m.url().startswith("https://aegis-banco.test/"))
        self.resultados.append({"caso": "preparacion", "etiqueta": "Preparación y valores de serie",
                                "modo": self.modo(), "run": "prep", "comprobaciones": comps})
        self.mostrar("Preparación y valores de serie", self.modo(), comps)
        return p

    def referencia(self):
        """Valores reales del equipo, medidos en la ventana del navegador (la protección no se aplica a la interfaz)."""
        with open(SONDAS, encoding="utf-8") as f:
            sondas = f.read()
        base, idioma = cargar_fuentes()
        instaladas = self.n.m.chrome(
            "return Cc['@mozilla.org/gfx/fontenumerator;1'].getService(Ci.nsIFontEnumerator).EnumerateAllFonts();")
        # Fuentes del equipo que no son de serie de Windows ni de sus paquetes de idioma (las que trae el propio
        # navegador, como «Twemoji Mozilla», se ven siempre: no cuentan). Y las de paquetes de idioma instaladas.
        propias = ("@", "Segoe Fluent", "Segoe MDL2", "HoloLens", "Segoe UI Emoji")
        ocultables = sorted(f for f in instaladas if f not in base and f not in idioma and f.isascii()
                            and "Mozilla" not in f and not f.startswith(propias))[:10]
        de_idioma = sorted(f for f in instaladas if f in idioma)[:10]
        de_serie = [f for f in ("Arial", "Segoe UI", "Courier New", "Times New Roman") if f in instaladas]
        fuentes = ocultables + de_idioma + de_serie
        self.estado.ajustes = {"fuentes": fuentes}
        valores = self.n.m.chrome(sondas + "\nreturn Sondas.medir(arguments[0]);", {"fuentes": fuentes})
        valores["interior"] = self.n.m.chrome(
            "const r = gBrowser.selectedBrowser.getBoundingClientRect();"
            "return [Math.round(mozInnerScreenX + r.left), Math.round(mozInnerScreenY + r.top)];")
        idiomas = self.n.m.chrome("return Services.prefs.getCharPref('intl.accept_languages');")
        self.estado.base = {"valores": valores, "idiomasPref": idiomas,
                            "fuentes": {"ocultables": ocultables, "idioma": de_idioma, "base": de_serie}}
        # Lo que solo tiene sentido medir en una web (los colores del sistema dependen del tema de la página, y las
        # matemáticas, del tipo de código): una web sin protección, con los Escudos bajados en sitio-e.test.
        self.bajar("sitio-e.test")
        self.n.ir(self.url("sitio-e.test", "huella.html", "ref", "huella", "ref", self.modo(escudos="bajados")))
        self.n.m.mover_raton(300, 220)
        web = self.n.esperar_fase("ref", 60)["valores"]
        self.subir("sitio-e.test")
        self.estado.base["contenido"] = {"coloresSistema": web["coloresSistema"], "matematicas": web["matematicas"]}
        print(f"  referencia: {valores['nucleos']} núcleos, pantalla {valores['pantalla']}, {valores['zona']['nombre']}, "
              f"{valores['webgl'].get('modelo')}, {len(ocultables)} fuentes no de serie: {', '.join(ocultables) or '—'}")

    # ── Casos ─────────────────────────────────────────────────────────────────────────────────────────────────

    def caso_rastreadores(self):
        print("\nRastreadores")
        n = self.n

        def una(etiqueta, modo, host="sitio-a.test", subidos=None):
            run = self.run("r")
            self.fase(host, "rastreadores.html", run, "rastreadores", "pagina", modo)
            panel = n.leer_panel(desglose=modo["escudos"] == "arriba")
            panel["interruptor"] = panel["sitio"]["on"]
            panel["estado"] = panel["estadoTexto"]
            n.cerrar_panel()
            cont = n.contador()
            self.nav(run, "nav-pagina", {"contador": cont, "bajados": cont["bajados"], "panel": panel})
            n.m.contenido("location.hash = 'ancla';")
            self.nav(run, "nav-ancla", {"contador": n.contador()})
            if subidos is not None:
                subidos(run)
            self.fase(host, "limpia.html", run, "rastreadores", "limpia", modo)
            self.nav(run, "nav-limpia", {"contador": n.contador()})
            self.veredicto("rastreadores", run, modo, etiqueta=etiqueta)
            return run, cont

        run_estricto, cont_estricto = una("Rastreadores · Estricto", self.modo())

        # Escudos bajados en sitio-a con el interruptor del panel; luego se suben en la misma página.
        self.bajar("sitio-a.test")

        def subir_en_la_pagina(run):
            n.interruptor("sitio")   # sube: la página se recarga y vuelve a pedir todo
            n.esperar_fase("pagina")
            self.nav(run, "nav-subidos", {"contador": n.contador(1.5), "esperado": cont_estricto["texto"]})

        run_bajados, _ = una("Rastreadores · Escudos bajados", self.modo(escudos="bajados"), subidos=subir_en_la_pagina)
        self.control("Rastreadores con Escudos bajados evaluados como «arriba»", "rastreadores", run_bajados,
                     self.modo())
        # Los Escudos son por sitio: con sitio-a bajado, otro sitio sigue protegido.
        self.bajar("sitio-a.test")
        una("Rastreadores · otro sitio con sitio-a bajado", self.modo(), host="sitio-c.test")
        self.subir("sitio-a.test")

        # Nivel Normal, con el desplegable del panel.
        self.limpia("sitio-a.test")
        n.elegir("aegis-escudos-menu-nivel", "standard")
        una("Rastreadores · Normal", self.modo(nivel="normal"))
        h = n.abrir_ventana(privada=True)
        una("Rastreadores · Normal, ventana privada", self.modo(nivel="normal", privada=1))
        n.cerrar_ventana(h)
        self.limpia("sitio-a.test")
        n.elegir("aegis-escudos-menu-nivel", "strict")
        h = n.abrir_ventana(privada=True)
        una("Rastreadores · Estricto, ventana privada", self.modo(privada=1))
        n.cerrar_ventana(h)

    # ── Anuncios: el motor propio con las listas de filtros (escudos/red.sys.mjs, escudos/listas.sys.mjs) ──

    JS_MOTOR = """
      const fin = arguments[arguments.length - 1];
      (async () => {
        // El módulo en uso: el del repo en una copia de desarrollo, el de la build si no.
        const url = Services.prefs.getBoolPref("aegis.dev", false)
          ? "resource://aegis/escudos/listas.sys.mjs" : "resource:///modules/aegis/escudos/listas.sys.mjs";
        const e = await ChromeUtils.importESModule(url).AegisEscudosListas.estado();
        fin({ listo: e.listo, origenes: e.listas.map(l => l.origen), listas: e.listas.map(l => l.id),
              puedeConectar: e.puedeConectar, temporizador: e.temporizador, motor: e.motor });
      })().catch(e => fin({ error: String(e) }));"""

    def esperar_motor(self):
        """Espera a que el motor termine lo que tenga en marcha (cargar o recompilar al cambiar de nivel)."""
        r = self.n.m.chrome(self.JS_MOTOR, asincrono=True, espera=180)
        if r.get("error"):
            raise RuntimeError(f"motor de Escudos: {r['error']}")
        return r

    def caso_anuncios(self):
        print("\nAnuncios (motor propio)")
        n = self.n
        motor = self.esperar_motor()
        print(f"  motor: {'listo' if motor['listo'] else 'SIN MOTOR'}, {len(motor['listas'])} listas, "
              f"cargar {motor['motor'].get('cargarMs', 0):.0f} ms, "
              f"compilar {motor['motor'].get('compilarMs', 0):.0f} ms")

        def una(etiqueta, modo, host="sitio-a.test", atras=False, con_motor=False):
            run = self.run("a")
            self.fase(host, "anuncios.html", run, "anuncios", "pagina", modo)
            arriba = modo["escudos"] == "arriba"
            panel = n.leer_panel(desglose=arriba)
            n.cerrar_panel()
            self.nav(run, "nav-pagina", {"contador": n.contador(), "panel": {
                "numero": panel["numero"], "secciones": panel.get("secciones", {}), "cuentas": panel.get("cuentas")}})
            self.fase(host, "limpia.html", run, "anuncios", "limpia", modo)
            self.nav(run, "nav-limpia", {"contador": n.contador()})
            if atras:
                antes = n.id_documento()
                n.m.contenido("history.back();")
                n.esperar(lambda: n.id_documento() != antes, 20, "la página anterior")
                n.esperar_fase("pagina")
                self.nav(run, "nav-atras", {"contador": n.contador(1.5)})
            if con_motor:
                self.nav(run, "nav-motor", motor)
            self.veredicto("anuncios", run, modo, etiqueta=etiqueta)
            return run

        def nivel(valor):
            self.limpia("sitio-a.test")
            n.elegir("aegis-escudos-menu-nivel", valor)
            self.esperar_motor()

        def prefs(**valores):
            for k, v in valores.items():
                if v is None:
                    n.m.chrome("Services.prefs.clearUserPref(arguments[0]);", k)
                elif isinstance(v, bool):
                    n.m.chrome("Services.prefs.setBoolPref(arguments[0], arguments[1]);", k, v)
                else:
                    n.m.chrome("Services.prefs.setStringPref(arguments[0], arguments[1]);", k, v)
            self.esperar_motor()

        nivel("strict+")
        una("Anuncios · Estricto+ (de serie)", self.modo(nivel="estricto+"), atras=True, con_motor=True)
        prefs(**{"aegis.escudos.contador": "origenes"})
        una("Anuncios · contando orígenes", self.modo(nivel="estricto+", contador="origenes"))
        prefs(**{"aegis.escudos.contador": None})
        nivel("strict")
        run_estricto = una("Anuncios · Estricto", self.modo())
        self.control("Anuncios en Estricto evaluados como Estricto+", "anuncios", run_estricto, self.modo(nivel="estricto+"))
        sin = {f"aegis.escudos.molestias.{g}": False for g in ("cookies", "ventanas", "antiadblock")}
        prefs(**sin)
        run_sin = una("Anuncios · molestias apagadas", self.modo(molestias=""))
        prefs(**{k: None for k in sin})
        self.control("Molestias apagadas evaluadas como encendidas", "anuncios", run_sin, self.modo())
        h = n.abrir_ventana(privada=True)
        una("Anuncios · Estricto, ventana privada", self.modo(privada=1))
        n.cerrar_ventana(h)
        nivel("standard")
        una("Anuncios · Normal", self.modo(nivel="normal"))
        nivel("strict")
        self.bajar("sitio-a.test")
        run_bajados = una("Anuncios · Escudos bajados", self.modo(escudos="bajados"))
        self.subir("sitio-a.test")
        self.control("Anuncios con Escudos bajados evaluados como «arriba»", "anuncios", run_bajados, self.modo())

    # ── Cosmético, scriptlets y recursos neutros (escudos/cosmetico.sys.mjs, AegisEscudosChild.sys.mjs) ──

    JS_COSMETICO = """
      const url = Services.prefs.getBoolPref("aegis.dev", false) ? "resource://aegis/escudos/" : "resource:///modules/aegis/escudos/";
      const C = ChromeUtils.importESModule(url + "cosmetico.sys.mjs").AegisEscudosCosmetico;
      const R = ChromeUtils.importESModule(url + "red.sys.mjs").AegisEscudosRed;
      const salida = { cosmetico: C.medidas(), red: R.medidas() };
      if (arguments[0] !== undefined) { C._simularUbo(arguments[0]); }
      return salida;"""

    def caso_cosmetico(self):
        print("\nCosmético, scriptlets y recursos neutros")
        n = self.n
        self.esperar_motor()
        hosts = ("sitio-a.test", "angrybirdsnest.com", "www.youtube.com", "mobalytics.gg", "www.mediafire.com")

        def una(etiqueta, modo, csp=False):
            run = self.run("k")
            for host, fase in zip(hosts, ("sitio-a", "abn", "yt", "moba", "mf")):
                self.fase(host, "cosmetico.html", run, "cosmetico", fase, modo)
            if csp:
                self.fase("sitio-c.test", "csp.html", run, "cosmetico", "csp", modo)
            self.nav(run, "nav-cosmetico", n.m.chrome(self.JS_COSMETICO))
            self.veredicto("cosmetico", run, modo, etiqueta=etiqueta)
            return run

        def prefs(**valores):
            for k, v in valores.items():
                if v is None:
                    n.m.chrome("Services.prefs.clearUserPref(arguments[0]);", k)
                else:
                    n.m.chrome("Services.prefs.setBoolPref(arguments[0], arguments[1]);", k, v)
            self.esperar_motor()

        run_serie = una("Cosmético · Estricto (de serie)", self.modo(), csp=True)
        self.control("Cosmético en Estricto evaluado con los Escudos bajados", "cosmetico", run_serie,
                     self.modo(escudos="bajados"))
        sin = {f"aegis.escudos.molestias.{g}": False for g in ("cookies", "ventanas", "antiadblock")}
        prefs(**sin)
        run_sin = una("Cosmético · molestias apagadas", self.modo(molestias=""))
        prefs(**{k: None for k in sin})
        self.control("Cosmético con molestias apagadas evaluado como encendidas", "cosmetico", run_sin, self.modo())
        for host in hosts:
            self.bajar(host)
        run_bajados = una("Cosmético · Escudos bajados", self.modo(escudos="bajados"))
        for host in hosts:
            self.subir(host)
        self.control("Cosmético con Escudos bajados evaluado como «arriba»", "cosmetico", run_bajados, self.modo())
        # uBlock Origin activo (simulado con el mismo aviso que daría AddonManager): sin cosmético propio; la red sigue.
        n.m.chrome(self.JS_COSMETICO, True)
        try:
            una("Cosmético · con uBlock Origin activo (simulado)", self.modo(ubo=1), csp=True)
        finally:
            n.m.chrome(self.JS_COSMETICO, False)
        una("Cosmético · sin uBlock Origin otra vez", self.modo())

    def caso_cookies(self):
        print("\nCookies de terceros")
        n = self.n

        def serie(etiqueta, modo, privada_nueva=False):
            run = self.run("c")
            for fase, host, extra in [
                ("f1", "sitio-a.test", {"marco": "sitio-b.test", "accion": "poner"}),
                ("f2", "sitio-b.test", {"accion": "leer"}),
                ("f3", "sitio-c.test", {"marco": "sitio-b.test", "accion": "leer"}),
                ("f4", "sitio-a.test", {"marco": "sitio-b.test", "accion": "leer"}),
                ("f5", "sitio-a.test", {"marco": "itisatracker.org", "accion": "poner"}),
                ("f7", "itisatracker.org", {"accion": "leer"}),
            ]:
                self.fase(host, "cookies.html", run, "cookies", fase, modo, **extra)
            if privada_nueva:
                return run
            self.veredicto("cookies", run, modo, etiqueta=etiqueta)
            return run

        serie("Cookies · aisladas por sitio", self.modo())
        self.limpia("sitio-a.test")
        n.elegir("aegis-escudos-menu-cookies", "1")
        run_todas = serie("Cookies · bloquear todas", self.modo(cookies=1))
        self.control("Cookies «bloquear todas» evaluadas como «aisladas»", "cookies", run_todas, self.modo())
        self.limpia("sitio-a.test")
        n.elegir("aegis-escudos-menu-cookies", "5")
        self.bajar("sitio-a.test")
        serie("Cookies · Escudos bajados en sitio-a", self.modo(escudos="bajados"))
        self.subir("sitio-a.test")
        self.limpia("sitio-a.test")
        n.elegir("aegis-escudos-menu-nivel", "standard")
        serie("Cookies · Normal", self.modo(nivel="normal"))
        self.limpia("sitio-a.test")
        n.elegir("aegis-escudos-menu-nivel", "strict")
        # Ventana privada: lo mismo dentro, y nada queda al cerrarla.
        modo = self.modo(privada=1)
        h = n.abrir_ventana(privada=True)
        run = serie("", modo, privada_nueva=True)
        n.cerrar_ventana(h)
        h = n.abrir_ventana(privada=True)
        self.fase("sitio-a.test", "cookies.html", run, "cookies", "f6", modo, marco="sitio-b.test", accion="leer")
        self.veredicto("cookies", run, modo, etiqueta="Cookies · ventana privada")
        n.cerrar_ventana(h)

    def caso_https(self):
        print("\nSolo HTTPS")
        n = self.n
        run = self.run("h")
        modo = self.modo()
        n.ir(self.url("sitio-a.test", "https.html", run, "https", "h1", modo, esquema="http"))
        n.esperar_fase("h1")
        n.ir(self.url("solo-http.test", "https.html", run, "https", "h2", modo, esquema="http"))
        doc = self.esperar_documento("about:httpsonlyerror")
        self.nav(run, "nav-h2", {"documento": doc, "momento": time.time()})
        if not doc.startswith("about:httpsonlyerror"):
            self.veredicto("https", run, modo, etiqueta="Solo HTTPS")
            return
        # Excepción desde el panel, sobre la propia página de aviso (escudos.sys.mjs abre entonces la dirección sin
        # cifrar). Si en el aviso no está el botón de Escudos, se usa el botón del propio aviso para seguir probando.
        boton = n.contador(0.6)["boton"]
        self.nav(run, "nav-h2b", {"boton": boton})
        if boton:
            n.abrir_panel()
            n.m.chrome("document.getElementById('aegis-escudos-panel').querySelector('#aegis-escudos-https .aegis-interruptor').click();")
            via = "panel"
        else:
            # El botón del aviso se activa un segundo después de que la página tenga el foco (contra el clickjacking).
            n.m.contenido("window.focus();")
            n.esperar(lambda: n.m.contenido(
                "return !document.getElementById('openInsecure').classList.contains('disabled');"), 10,
                "que se active «Continuar al sitio HTTP»")
            n.m.clic("#openInsecure")
            via = "aviso"
        d = n.esperar_fase("h2")
        self.nav(run, "h3", {"protocolo": d["protocolo"], "host": d["host"], "via": via})
        panel = n.leer_panel()
        esperado = n.m.chrome("return new Localization(['aegis.ftl', 'branding/brand.ftl'], true)"
                              ".formatValueSync('aegis-escudos-https-excepcion');")
        self.nav(run, "nav-h3", {"interruptor": panel["https"]["on"], "detalle": panel["httpsDetalle"],
                                 "detalleEsperado": esperado})
        n.cerrar_panel()
        antes = n.id_documento()
        n.abrir_panel()
        n.m.chrome("document.getElementById('aegis-escudos-panel').querySelector('#aegis-escudos-https .aegis-interruptor').click();")
        n.cerrar_panel()
        doc = self.esperar_documento("about:httpsonlyerror", antes)
        self.nav(run, "nav-h4", {"documento": doc})
        # Un sitio con HTTPS y excepción: se abre sin cifrar.
        self.fase("sitio-c.test", "limpia.html", run, "https", "previa", modo)
        n.interruptor("https")
        n.ir(self.url("sitio-c.test", "https.html", run, "https", "h5", modo, esquema="http"))
        d5 = n.esperar_fase("h5")
        n.interruptor("https", recarga=True)   # quita la excepción: la página se recarga (y vuelve a guardar «h5»)
        d5b = n.esperar_fase("h5")
        self.nav(run, "h5", {"protocolo": d5["protocolo"], "host": d5["host"], "url": d5["url"]})
        self.nav(run, "h5b", {"protocolo": d5b["protocolo"], "host": d5b["host"]})
        h = n.abrir_ventana(privada=True)
        n.ir(self.url("sitio-a.test", "https.html", run, "https", "h6", self.modo(privada=1), esquema="http"))
        n.esperar_fase("h6")
        n.cerrar_ventana(h)
        self.veredicto("https", run, modo, etiqueta="Solo HTTPS")

    def caso_olvidar(self):
        print("\nOlvidar este sitio al cerrar")
        n = self.n
        run = self.run("o")
        modo = self.modo()
        self.limpia("sitio-a.test")
        n.interruptor("olvidar", recarga=False)
        panel = n.leer_panel()
        n.cerrar_panel()
        permiso = n.m.chrome("""
          const p = Services.scriptSecurityManager.createContentPrincipalFromOrigin("https://sitio-a.test");
          return Services.perms.testExactPermissionFromPrincipal(p, "cookie");""")
        self.nav(run, "nav-o0", {"interruptor": panel["olvidar"]["on"], "permiso": permiso})
        self.fase("sitio-a.test", "olvidar.html", run, "olvidar", "o1", modo, accion="poner")
        self.fase("sitio-b.test", "olvidar.html", run, "olvidar", "o2", modo, accion="poner")
        self.reiniciar()
        self.fase("sitio-a.test", "olvidar.html", run, "olvidar", "o3", modo, accion="leer")
        self.fase("sitio-b.test", "olvidar.html", run, "olvidar", "o4", modo, accion="leer")
        self.limpia("sitio-a.test")
        panel = self.n.leer_panel()
        self.n.cerrar_panel()
        self.nav(run, "nav-o5", {"interruptor": panel["olvidar"]["on"]})
        h = self.n.abrir_ventana(privada=True)
        self.limpia("sitio-a.test")
        panel = self.n.leer_panel()
        self.n.cerrar_panel()
        self.nav(run, "nav-o6", {"desactivado": panel["olvidar"]["desactivado"], "detalle": panel["olvidarDetalle"]})
        self.n.cerrar_ventana(h)
        # Se deja como estaba: sin «Olvidar» en sitio-a.
        self.limpia("sitio-a.test")
        self.n.interruptor("olvidar", recarga=False)
        self.veredicto("olvidar", run, modo, etiqueta="Olvidar este sitio al cerrar")

    def una_huella(self, etiqueta, modo, host="sitio-a.test", reiniciado=False, arrancado_en_caja=False):
        n = self.n
        run = self.run("p")
        n.ir(self.url(host, "huella.html", run, "huella", "p", modo))
        time.sleep(0.4)
        n.m.mover_raton(300, 220)
        n.m.mover_raton(320, 240)
        n.esperar_fase("p", 60)
        panel = n.leer_panel()
        n.cerrar_panel()
        h = n.abrir_ventana()
        ventanas = n.m.chrome("""
          return [...Services.wm.getEnumerator("navigator:browser")].map(w => w.document.documentElement.hasAttribute("aegis-caja-fuerte"));""")
        n.cerrar_ventana(h)
        idiomas = n.m.chrome("return Services.prefs.getCharPref('intl.accept_languages');")
        nombre = {"firefox": "basica", "caja_fuerte": "caja-fuerte"}.get(modo["huella"], modo["huella"])
        esperado = n.m.chrome("return new Localization(['aegis.ftl', 'branding/brand.ftl'], true)"
                              ".formatValueSync(arguments[0]);", f"aegis-huella-nivel-{nombre}")
        estado = n.m.chrome("return {estado: window.windowState, foco: document.hasFocus(), oculta: document.hidden};")
        self.nav(run, "nav-p", {"ventanas": ventanas, "panelNivel": panel["huella"], "panelNivelEsperado": esperado,
                                "idiomasPref": idiomas, "reiniciado": reiniciado, "arrancadoEnCaja": arrancado_en_caja,
                                "ventana": estado})
        self.veredicto("huella", run, modo, etiqueta=etiqueta)
        return run

    def caso_huella(self):
        print("\nHuella digital")
        n = self.n
        self.una_huella("Huella · Equilibrada (de serie)", self.modo())
        self.bajar("sitio-a.test")
        self.una_huella("Huella · Escudos bajados", self.modo(escudos="bajados"))
        self.subir("sitio-a.test")
        run_basica = None
        for nivel, nombre in [("firefox", "Básica"), ("estricta", "Estricta"), ("caja_fuerte", "Caja fuerte")]:
            self.limpia("sitio-a.test")
            n.elegir("aegis-escudos-menu-huella", nivel)
            r = self.una_huella(f"Huella · {nombre}", self.modo(huella=nivel))
            if nivel == "firefox":
                run_basica = r
        self.control("Huella Básica evaluada como Caja fuerte", "huella", run_basica, self.modo(huella="caja_fuerte"))
        if "cajafuerte" in self.casos:
            self.caso_cajafuerte()
        if "control" in self.casos:
            self.caso_control(self.modo(huella="caja_fuerte"), "Web normal · Caja fuerte")
        # Lo global de Caja fuerte (60 fps, límite de almacenamiento) se aplica al arrancar.
        self.reiniciar()
        self.una_huella("Huella · Caja fuerte tras reiniciar", self.modo(huella="caja_fuerte"), reiniciado=True)
        n = self.n
        self.limpia("sitio-a.test")
        n.elegir("aegis-escudos-menu-huella", "equilibrada")
        self.una_huella("Huella · de vuelta a Equilibrada", self.modo(), arrancado_en_caja=True)

    def aviso(self, espera=4.0):
        time.sleep(espera)
        return self.n.m.chrome("""
          const b = gBrowser.selectedBrowser;
          const a = PopupNotifications.getNotification("aegis-huella", b);
          return {aviso: !!a, anclado: !!a && a.anchorElement?.id == "aegis-escudos-button"};""")

    def caso_cajafuerte(self):
        print("\nCaja fuerte: aviso y permiso por sitio")
        n = self.n
        run = self.run("k")
        modo = self.modo(huella="caja_fuerte")
        caja = "cajafuerte"
        self.fase("sitio-d.test", "recolector.html", run, caja, "r1", modo, metodo="todo")
        self.nav(run, "nav-aviso-sitio", self.aviso())
        # «Permitir en este sitio» en el aviso (botón secundario), con su retardo de seguridad respetado.
        antes = n.id_documento()
        pulsado = n.m.chrome("""
          const b = gBrowser.selectedBrowser;
          const a = PopupNotifications.getNotification("aegis-huella", b);
          if (!a) { return "sin aviso"; }
          if (PopupNotifications.panel.state != "open") { a.reshow(); }
          return "abierto";""")
        if pulsado == "abierto":
            time.sleep(1.5)
            n.m.chrome("""
              const el = PopupNotifications.panel.querySelector("#aegis-huella-notification");
              el.secondaryButton.click();""")
            n.esperar_documento_nuevo(antes)
        panel = n.leer_panel()
        n.cerrar_panel()
        datos = n.chrome("return {permisos: __aegis.huella.permitidos(), granular: Services.prefs.getStringPref('privacy.fingerprintingProtection.granularOverrides', '')};")
        self.nav(run, "nav-permitir", {**datos, "interruptor": panel["permiso"]["on"] if panel["permiso"] else None,
                                       "detalle": panel["permisoDetalle"]})
        self.fase("sitio-f.test", "recolector.html", run, caja, "r-fuentes", modo, metodo="fuentes")
        self.nav(run, "nav-aviso-fuentes", self.aviso())
        self.fase("sitio-g.test", "recolector.html", run, caja, "r-todataurl", modo, metodo="todataurl")
        self.nav(run, "nav-aviso-todataurl", self.aviso())
        self.fase("sitio-c.test", "recolector.html", run, caja, "r-marco", modo, metodo="marco", marco="sitio-b.test")
        self.nav(run, "nav-aviso-marco", self.aviso())
        # Con permiso, sitio-d está en Equilibrada; su marco de sitio-b, no.
        n.ir(self.url("sitio-d.test", "huella.html", run, caja, "p-permiso", self.modo(huella="caja_fuerte", permiso=1)))
        n.m.mover_raton(300, 220)
        n.esperar_fase("p-permiso", 60)
        # Quitar el permiso en Ajustes › Privacidad.
        n.m.chrome("openPreferences('privacy');")
        lista = n.esperar(lambda: n.m.chrome("""
          const doc = gBrowser.selectedBrowser.contentDocument;
          if (!doc || !doc.querySelector('#aegis-huella')) { return null; }
          return [...doc.querySelectorAll('.aegis-huella-lista button[data-dominio]')].map(b => b.dataset.dominio);"""),
                          20, "la lista de sitios con permiso en Ajustes")
        n.m.chrome("""gBrowser.selectedBrowser.contentDocument.querySelector('.aegis-huella-lista button[data-dominio="sitio-d.test"]')?.click();""")
        time.sleep(0.5)
        despues = n.chrome("return {permisos: __aegis.huella.permitidos(), granular: Services.prefs.getStringPref('privacy.fingerprintingProtection.granularOverrides', '')};")
        n.m.chrome("gBrowser.removeTab(gBrowser.selectedTab);")
        self.nav(run, "nav-quitar-ajustes", {"listaAntes": lista, "permisosDespues": despues["permisos"],
                                             "granularDespues": despues["granular"]})
        n.ir(self.url("sitio-d.test", "huella.html", run, caja, "p-sin-permiso", modo))
        n.m.mover_raton(300, 220)
        n.esperar_fase("p-sin-permiso", 60)
        # El interruptor del panel da el permiso; «Olvidar este sitio» (borrar sus datos) lo quita.
        self.fase("sitio-d.test", "limpia.html", run, caja, "previa-olvidar", modo)
        n.interruptor("permiso")
        antes_p = n.chrome("return __aegis.huella.permitidos();")
        n.m.chrome("""
          const { ForgetAboutSite } = ChromeUtils.importESModule("moz-src:///toolkit/components/forgetaboutsite/ForgetAboutSite.sys.mjs");
          return ForgetAboutSite.removeDataFromBaseDomain("sitio-d.test");""")
        time.sleep(0.5)
        desp = n.chrome("return {permisos: __aegis.huella.permitidos(), granular: Services.prefs.getStringPref('privacy.fingerprintingProtection.granularOverrides', '')};")
        self.nav(run, "nav-olvidar-sitio", {"permisosAntes": antes_p, "permisosDespues": desp["permisos"],
                                            "granularDespues": desp["granular"]})
        self.fase("sitio-d.test", "recolector.html", run, caja, "r-otra-vez", modo, metodo="todo")
        self.nav(run, "nav-una-vez", self.aviso())
        # Ventana privada.
        h = n.abrir_ventana(privada=True)
        mp = self.modo(huella="caja_fuerte", privada=1)
        self.fase("sitio-h.test", "recolector.html", run, caja, "r-privada", mp, metodo="todo")
        av = self.aviso()
        panel = n.leer_panel()
        r = n.m.chrome("""
          const b = document.getElementById('aegis-escudos-panel').querySelector('#aegis-escudos-permiso .aegis-interruptor');
          b.click();""")
        n.cerrar_panel()
        permisos = n.chrome("return __aegis.huella.permitidos();")
        marco = n.m.chrome("return document.documentElement.hasAttribute('aegis-caja-fuerte');")
        self.nav(run, "nav-privada", {"aviso": av["aviso"], "desactivado": panel["permiso"]["desactivado"],
                                      "detalle": panel["permisoDetalle"], "marcoCaja": marco,
                                      "permisosTrasIntento": permisos})
        n.cerrar_ventana(h)
        # Un permiso dado en la ventana normal vale también en la privada.
        self.fase("sitio-d.test", "limpia.html", run, caja, "previa-privada", modo)
        n.interruptor("permiso")
        h = n.abrir_ventana(privada=True)
        n.ir(self.url("sitio-d.test", "huella.html", run, caja, "p-privada-permiso", self.modo(huella="caja_fuerte", permiso=1, privada=1)))
        n.m.mover_raton(300, 220)
        n.esperar_fase("p-privada-permiso", 60)
        n.cerrar_ventana(h)
        n.chrome("__aegis.huella.permitir('sitio-d.test', false);")
        # El aviso propio del navegador para leer un lienzo: solo con un clic.
        self.fase("sitio-i.test", "recolector.html", run, caja, "r-clic", modo, metodo="lienzo")
        leer = """
          const n = PopupNotifications.getNotification("canvas-permissions-prompt", gBrowser.selectedBrowser);
          return {existe: !!n, abierto: !!n && PopupNotifications.panel.state == "open" && !n.dismissed};"""
        antes_c = n.m.chrome(leer)
        n.m.clic("#extraer")
        time.sleep(1.5)
        self.nav(run, "nav-lienzo-clic", {"antes": antes_c, "despues": n.m.chrome(leer)})
        n.m.chrome("PopupNotifications.panel.hidePopup?.();")
        self.veredicto("cajafuerte", run, modo, etiqueta="Caja fuerte · aviso y permiso")

    def google(self, etiqueta, modo):
        n = self.n
        run = self.run("g")
        g = "google"
        self.fase("www.google.com", "", run, g, "g-inicio", modo)
        # Lo que deciden las listas del motor propio para cada petición de las tres páginas (casos.js lo junta con lo
        # que corta Google limpio): el motor de la propia build, con el origen de cada página.
        self.nav(run, "nav-g-motor", n.m.chrome(JS_MOTOR_GOOGLE, n.m.contenido("return window.PeticionesGoogle;")))
        # El contador se lee cuando ya marca lo que el servidor no recibió (lo cancelado: peticiones u orígenes, según
        # aegis.escudos.contador), con un tope: si no llega a esa cifra en 10 s, se apunta lo que marque y el veredicto
        # lo dará como fallo.
        esperados = n.m.contenido("""
          const [run, porOrigenes] = arguments;
          return fetch(`/__/registro?id=${encodeURIComponent(run + ".g-inicio.")}`, {cache: "no-store"})
            .then(r => r.json())
            .then(reg => {
              const ids = new Set(reg.map(p => new URL(p.url).searchParams.get("aegisid")));
              const fuera = window.PeticionesGoogle["g-inicio"].filter(([e]) => !ids.has(`${run}.g-inicio.${e}`));
              return porOrigenes ? new Set(fuera.map(([, u]) => new URL(u).origin)).size : fuera.length;
            });""", run, modo.get("contador") == "origenes")
        texto = str(esperados) if esperados and modo["escudos"] == "arriba" else None
        fin = time.monotonic() + 10
        cont = n.contador()
        while texto is not None and time.monotonic() < fin and not (cont["visible"] and cont["texto"] == texto):
            time.sleep(0.5)
            cont = n.contador(0.2, 1.0)
        panel = n.leer_panel(desglose=True)
        n.cerrar_panel()
        self.nav(run, "nav-g-inicio", {"contador": cont, "secciones": panel.get("secciones", {})})
        for enlace, fase_destino in [("#url-firmado", "g-url-firmado"), ("#url-sinfirma", None), ("#url-javascript", None),
                                     ("#busqueda", "g-busqueda-enlace")]:
            self.fase("www.google.com", "", run, g, "g-inicio-2", modo)
            n.m.clic(enlace)
            if fase_destino and (enlace != "#url-firmado" or modo["google"] == "1" and modo["escudos"] == "arriba"):
                n.esperar_fase(fase_destino)
            else:
                time.sleep(2.5)
        from urllib.parse import urlencode
        base = {"run": run, "caso": g, **modo, "auto": "1"}
        n.ir("https://www.google.com/search?" + urlencode({"q": f"{run}-barra", "ved": "1", "ei": "2", "oq": "x",
                                                          "sxsrf": "3", "client": "firefox-b-d", "gs_lcrp": "y",
                                                          "start": "10", **base, "fase": "g-busqueda"}))
        n.esperar_fase("g-busqueda")
        n.ir("https://www.google.com/search?" + urlencode({"q": f"{run}-img", "tbm": "isch", "ved": "1", **base,
                                                          "fase": "g-busqueda-tbm"}))
        n.esperar_fase("g-busqueda-tbm")
        self.fase("www.youtube.com", "", run, g, "g-youtube", modo)
        n.m.clic("#redirect")
        if modo["google"] == "1" and modo["escudos"] == "arriba":
            n.esperar_fase("g-yt-redirect")
        else:
            time.sleep(2.5)
        self.fase("sitio-a.test", "google-terceros.html", run, g, "g-terceros", modo)
        n.m.clic("#url-externo")
        time.sleep(2.5)
        self.veredicto(g, run, modo, etiqueta=etiqueta)
        return run

    def caso_google(self):
        print("\nGoogle limpio")
        n = self.n
        self.google("Google limpio · Estricto", self.modo())
        for host in ("www.google.com", "www.youtube.com", "sitio-a.test"):
            self.bajar(host)
        run_b = self.google("Google limpio · Escudos bajados", self.modo(escudos="bajados"))
        for host in ("www.google.com", "www.youtube.com", "sitio-a.test"):
            self.subir(host)
        self.control("Google con Escudos bajados evaluado como «arriba»", "google", run_b, self.modo())
        self.google("Google limpio · Escudos subidos otra vez", self.modo())
        n.m.chrome("Services.prefs.setBoolPref('aegis.google.limpio', false);")
        run_off = self.google("Google limpio · apagado (control)", self.modo(google=0))
        n.m.chrome("Services.prefs.setBoolPref('aegis.google.limpio', true);")
        self.control("Google limpio apagado evaluado como encendido", "google", run_off, self.modo())
        self.limpia("sitio-a.test")
        n.elegir("aegis-escudos-menu-nivel", "standard")
        self.google("Google limpio · Normal", self.modo(nivel="normal"))
        self.limpia("sitio-a.test")
        n.elegir("aegis-escudos-menu-nivel", "strict")

    def caso_control(self, modo=None, etiqueta="Web normal · Estricto"):
        print(f"\n{etiqueta}")
        n = self.n
        modo = modo or self.modo()
        run = self.run("w")
        self.fase("sitio-a.test", "control.html", run, "control", "c-control", modo, maximo=40)
        n.m.clic("#entrar button")
        n.esperar_fase("c-cuenta")
        n.ir("https://sitio-a.test/__/salir")
        self.veredicto("control", run, modo, etiqueta=etiqueta)

    def caso_red(self):
        print("\nRed")
        time.sleep(1)
        self.vigia.muestra()
        run = "red"
        self.nav(run, "nav-red", {
            "externas": self.srv.registro.lista_externas(),
            "dns": red.resoluciones_dns(self.log),
            "tcp": {k: {"veces": v["veces"], "estado": v["estado"]} for k, v in self.vigia.fuera.items()},
            "muestras": self.vigia.muestras,
            "url": f"{BANCO}/?run=red",
        })
        self.veredicto("red", run, self.modo(), etiqueta="Red: conexiones durante la prueba")

    # ── Excepciones por sitio (escudos/excepciones.sys.mjs, Ajustes › Escudos) ──

    JS_EXCEPCIONES = """
      const url = Services.prefs.getBoolPref("aegis.dev", false) ? "resource://aegis/escudos/" : "resource:///modules/aegis/escudos/";
      const Ex = ChromeUtils.importESModule(url + "excepciones.sys.mjs").AegisEscudosExcepciones;
      const [orden, sitio, grupo, valor] = arguments;
      const privada = window.gBrowser?.selectedBrowser?.browsingContext?.usePrivateBrowsing ?? false;
      if (orden == "listar") { return Ex.listar({ privada: !!valor }); }
      if (orden == "motivo") { return Ex.motivo(sitio, grupo, { privada }); }
      if (orden == "quitar") { Ex.quitar(sitio); Ex.quitar(sitio, { privada: true }); return true; }
      if (orden == "permisos") {
        return Services.perms.getAllByTypes(Ex.GRUPOS.map(g => "aegis-escudos-" + g)).map(p =>
          ({ origen: p.principal.origin, tipo: p.type, privada: p.principal.privateBrowsingId > 0,
             sesion: p.expireType == Services.perms.EXPIRE_SESSION }));
      }
      return null;"""

    # Ajustes › Escudos en la pestaña elegida: añade `sitio` con el campo, abre su editor y, si se pide, pulsa el
    # interruptor de un grupo. Devuelve cómo se ve cada fila del editor (la herencia).
    JS_AJUSTES_SITIO = """
      const fin = arguments[arguments.length - 1];
      const [sitio, pulsar] = arguments;
      (async () => {
        const espera = ms => new Promise(r => setTimeout(r, ms));
        const br = gBrowser.selectedBrowser;
        let doc = null;
        for (let i = 0; i < 80; i++) {
          doc = br.contentDocument;
          if (doc?.documentURI?.startsWith("about:preferences") && doc.readyState == "complete" &&
              doc.getElementById("aegis-escudos-aj-campo")) { break; }
          await espera(250);
        }
        const panel = doc.getElementById("aegis-escudos-ajustes");
        const campo = doc.getElementById("aegis-escudos-aj-campo");
        if (!panel || panel.hidden || !campo) { return fin({ error: "Ajustes › Escudos no se ve" }); }
        campo.value = sitio;
        campo.dispatchEvent(new doc.defaultView.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
        await espera(300);
        const li = () => panel.querySelector(`li[data-sitio="${sitio}"]`);
        if (pulsar) {
          li()?.querySelector(`input[id$="-${pulsar}-interruptor"]`)?.click();
          await espera(300);
        }
        const filas = {};
        for (const f of li()?.querySelectorAll(".aegis-escudos-aj-editor .aegis-tor-fila") ?? []) {
          const i = f.querySelector("input");
          const id = i.id.replace(/^.*-(anuncios|rastreadores|cookies-avisos|molestias|antiadblock|cosmetico|scriptlets|todo)-interruptor$/, "$1");
          filas[id] = { on: i.checked, desactivado: i.disabled, heredada: f.hasAttribute("aegis-heredada"),
                        detalle: f.querySelector(".aegis-tor-detalle")?.textContent ?? "" };
        }
        fin({ filas, resumen: li()?.querySelector(".aegis-escudos-aj-sitio-cabecera .aegis-tor-detalle")?.textContent ?? null,
              privadaTexto: doc.getElementById("aegis-escudos-aj-excepciones-ayuda")?.textContent ?? "" });
      })().catch(e => fin({ error: String(e) }));"""

    JS_OLVIDAR_SITIO = """
      const fin = arguments[arguments.length - 1];
      ChromeUtils.importESModule("moz-src:///toolkit/components/forgetaboutsite/ForgetAboutSite.sys.mjs")
        .ForgetAboutSite.removeDataFromBaseDomain(arguments[0]).then(() => fin(true), e => fin(String(e)));"""

    JS_TEXTO = """
      const l10n = new Localization(["aegis.ftl", "branding/brand.ftl"], true);
      return l10n.formatValueSync(arguments[0]);"""

    def tabla_anuncios(self, host, run, fase):
        """Carga la página de anuncios del banco en `host` y devuelve {etiqueta: (grupo, llega)}."""
        self.fase(host, "anuncios.html", run, "anuncios", fase, self.modo())
        filas = self.n.m.contenido(
            "return [...document.querySelectorAll('#tabla tr')].map(tr => [...tr.children].map(td => td.textContent));")
        peticiones = self.n.m.contenido("return window.__fase.peticiones;")
        return {p[0]: (p[3], f[2] == "llega") for p, f in zip(peticiones, filas)}

    def caso_excepciones(self):
        print("\nExcepciones por sitio")
        n = self.n
        self.esperar_motor()
        comps = []

        def c(titulo, esperado, observado, bien, porque="", codigo="overlay/browser/components/aegis/escudos/excepciones.sys.mjs"):
            comps.append({"titulo": titulo, "esperado": str(esperado), "observado": str(observado),
                          "estado": "ok" if bien else "fallo", "porque": porque, "codigo": codigo})

        def ex(*args):
            return n.m.chrome(self.JS_EXCEPCIONES, *args)

        def bloqueadas(tabla, grupo="base"):
            return sorted(k for k, (g, llega) in tabla.items() if g == grupo and not llega)

        run = self.run("x")
        ex("quitar", "sitio-a.test")
        ex("quitar", "sitio-b.test")

        # 1. Referencia: sin excepciones, el motor bloquea los anuncios de la página en sitio-a.
        antes = self.tabla_anuncios("sitio-a.test", run, "x-antes")
        base = bloqueadas(antes)
        c("Sin excepción: el motor bloquea los anuncios en sitio-a", "al menos 3 peticiones de anuncios bloqueadas",
          ", ".join(base) or "ninguna", len(base) >= 3, porque="Si no bloquea nada, el resto del caso no discrimina.",
          codigo="overlay/browser/components/aegis/escudos/red.sys.mjs")

        # 2. Excepción de «anuncios» en sitio-a, desde Ajustes › Escudos como lo haría una persona.
        n.ir("about:preferences#escudos")
        r = n.m.chrome(self.JS_AJUSTES_SITIO, "sitio-a.test", "anuncios", asincrono=True, espera=60)
        c("Ajustes › Escudos: «Anuncios» encendido en sitio-a", "interruptor encendido, sin desactivar",
          r.get("filas", {}).get("anuncios") or r, (r.get("filas", {}).get("anuncios") or {}).get("on") is True,
          codigo="overlay/browser/components/aegis/escudos/ajustes.sys.mjs")
        permisos = ex("permisos")
        c("Se guarda como permiso de sitio (aegis-escudos-anuncios, https://sitio-a.test, persistente)",
          "un permiso persistente", permisos,
          any(p["tipo"] == "aegis-escudos-anuncios" and p["origen"] == "https://sitio-a.test" and not p["sesion"]
              for p in permisos))
        con = self.tabla_anuncios("sitio-a.test", run, "x-con")
        pasan = sorted(k for k in base if con.get(k, ("", False))[1])
        c("Con la excepción: los anuncios de sitio-a llegan", ", ".join(base), ", ".join(pasan) or "ninguno",
          pasan == base and bool(base), codigo="overlay/browser/components/aegis/escudos/red.sys.mjs")
        otro = self.tabla_anuncios("sitio-b.test", run, "x-otro")
        otro_base = [k for k in base if k != "prebid-ruta"]
        siguen = [k for k in otro_base if not otro.get(k, ("", True))[1]]
        c("En otro sitio (sitio-b, sin excepción) se siguen bloqueando", ", ".join(otro_base), ", ".join(siguen) or "ninguno",
          siguen == otro_base and bool(otro_base), porque="prebid-ruta es de sitio-b: allí es de primera parte.",
          codigo="overlay/browser/components/aegis/escudos/red.sys.mjs")

        # 3. Herencia: «Ventanas y banners» apagado en general → en el sitio, «Permitido por ajuste general».
        n.m.chrome("Services.prefs.setBoolPref('aegis.escudos.molestias.ventanas', false);")
        self.esperar_motor()
        motivo = ex("motivo", "sitio-a.test", "molestias")
        c("Grupo apagado en general: cuenta como permitido en el sitio", "general", motivo, motivo == "general")
        n.ir("about:preferences#escudos")
        r = n.m.chrome(self.JS_AJUSTES_SITIO, "sitio-a.test", None, asincrono=True, espera=60)
        fila = (r.get("filas") or {}).get("molestias") or {}
        texto = n.m.chrome(self.JS_TEXTO, "aegis-ajustes-escudos-por-ajuste-general")
        c("Ajustes › Escudos: la fila se ve «Permitido por ajuste general», encendida y desactivada",
          f"encendida, desactivada, «{texto}»", fila,
          fila.get("on") is True and fila.get("desactivado") is True and fila.get("heredada") is True
          and fila.get("detalle") == texto, codigo="overlay/browser/components/aegis/escudos/ajustes.sys.mjs")
        self.limpia("sitio-a.test")
        n.abrir_panel()
        panel = n.m.chrome("""
          const f = document.getElementById("aegis-escudos-molestia-molestias");
          return { on: f?.querySelector(".aegis-interruptor")?.getAttribute("aria-checked"),
                   detalle: f?.querySelector(".aegis-escudos-fila-detalle")?.textContent };""")
        n.cerrar_panel()
        apagado = n.m.chrome(self.JS_TEXTO, "aegis-escudos-molestia-apagada")
        c("Panel: el interruptor general de «Ventanas y banners» apagado, con su motivo", f"apagado, «{apagado}»",
          panel, panel.get("on") == "false" and panel.get("detalle") == apagado,
          codigo="overlay/browser/components/aegis/escudos.sys.mjs")
        n.m.chrome("Services.prefs.clearUserPref('aegis.escudos.molestias.ventanas');")
        self.esperar_motor()
        # «Excepciones de este sitio…» del panel abre Ajustes › Escudos con el editor del sitio abierto.
        self.limpia("sitio-a.test")
        n.abrir_panel()
        abierto = n.m.chrome("""
          const fin = arguments[arguments.length - 1];
          (async () => {
            const espera = ms => new Promise(r => setTimeout(r, ms));
            document.getElementById("aegis-escudos-excepciones").click();
            for (let i = 0; i < 80; i++) {
              const d = gBrowser.selectedBrowser.contentDocument;
              const ed = d?.querySelector?.('#aegis-escudos-ajustes li[data-sitio="sitio-a.test"] .aegis-escudos-aj-editor');
              if (ed && !d.getElementById("aegis-escudos-ajustes").hidden) {
                const r = { url: d.documentURI, editor: true, panel: document.getElementById("aegis-escudos-panel").state };
                gBrowser.removeTab(gBrowser.selectedTab);
                return fin(r);
              }
              await espera(250);
            }
            fin({ url: gBrowser.selectedBrowser.currentURI.spec, editor: false });
          })();""", asincrono=True, espera=60)
        c("Panel › «Excepciones de este sitio…» abre Ajustes › Escudos con el sitio elegido",
          "about:preferences#escudos con el editor de sitio-a.test", abierto,
          abierto.get("editor") is True and "#escudos" in abierto.get("url", ""),
          codigo="overlay/browser/components/aegis/escudos.sys.mjs")
        motivo = ex("motivo", "sitio-b.test", "molestias")
        c("Al volver a encenderlo en general, sitio-b vuelve a bloquear el grupo", "bloquea", motivo, motivo == "bloquea")

        # 4. «Olvidar este sitio» (historial › Olvidar este sitio) quita las excepciones del sitio.
        olvido = n.m.chrome(self.JS_OLVIDAR_SITIO, "sitio-a.test", asincrono=True, espera=60)
        lista = ex("listar", None, None, False)
        c("«Olvidar este sitio» quita sus excepciones", "sitio-a.test fuera de la lista", lista,
          olvido is True and not any(s["sitio"] == "sitio-a.test" for s in lista),
          porque="ClearDataService › PermissionsCleaner borra los permisos de todos los tipos del sitio.")
        tras = self.tabla_anuncios("sitio-a.test", run, "x-olvidado")
        vuelven = [k for k in base if not tras.get(k, ("", True))[1]]
        c("Tras olvidarlo, los anuncios de sitio-a se vuelven a bloquear", ", ".join(base), ", ".join(vuelven) or "ninguno",
          vuelven == base and bool(base), codigo="overlay/browser/components/aegis/escudos/red.sys.mjs")

        # «Permitir todo» desde Ajustes (para todo el sitio) es la excepción del interruptor del panel.
        n.ir("about:preferences#escudos")
        r = n.m.chrome(self.JS_AJUSTES_SITIO, "sitio-a.test", "todo", asincrono=True, espera=60)
        filas = r.get("filas") or {}
        c("Ajustes › Escudos: con «Permitir todo», cada grupo se ve permitido y desactivado",
          "todos encendidos y desactivados", {k: (v.get("on"), v.get("desactivado")) for k, v in filas.items()},
          bool(filas) and all(v.get("on") and v.get("desactivado") for k, v in filas.items() if k != "todo"),
          codigo="overlay/browser/components/aegis/escudos/ajustes.sys.mjs")
        todo = self.tabla_anuncios("sitio-a.test", run, "x-todo")
        pasan = [k for k in base if todo.get(k, ("", False))[1]]
        c("Con «Permitir todo», los anuncios de sitio-a llegan", ", ".join(base), ", ".join(pasan) or "ninguno",
          pasan == base and bool(base))
        panel = n.leer_panel()
        c("El panel lo ve como Escudos bajados en el sitio", "interruptor del sitio apagado", panel["sitio"],
          panel["sitio"]["on"] is False, codigo="overlay/browser/components/aegis/escudos.sys.mjs")
        n.cerrar_panel()
        n.interruptor("sitio")
        lista = ex("listar", None, None, False)
        c("Subir los Escudos en el panel quita «Permitir todo» del sitio", "sin «todo» en sitio-a", lista,
          not any(s["sitio"] == "sitio-a.test" and s["todo"] for s in lista),
          codigo="overlay/browser/components/aegis/escudos.sys.mjs")

        # 5. Ventana privada: la excepción es de sesión y solo de las ventanas privadas.
        h = n.abrir_ventana(privada=True)
        n.ir("about:preferences#escudos")
        r = n.m.chrome(self.JS_AJUSTES_SITIO, "sitio-a.test", "anuncios", asincrono=True, espera=60)
        privada_desc = n.m.chrome(self.JS_TEXTO, "aegis-ajustes-escudos-excepciones-descripcion-privada")
        c("Ajustes en una ventana privada: avisa de que las excepciones son de la sesión privada", privada_desc,
          r.get("privadaTexto"), privada_desc and r.get("privadaTexto", "").startswith(privada_desc[:30]),
          codigo="overlay/browser/components/aegis/escudos/ajustes.sys.mjs")
        permisos = ex("permisos")
        priv = [p for p in permisos if p["tipo"] == "aegis-escudos-anuncios" and "sitio-a.test" in p["origen"]]
        c("En privada se guarda con el principal privado y de sesión", "privateBrowsingId=1, EXPIRE_SESSION", priv,
          bool(priv) and all(p["privada"] and p["sesion"] for p in priv))
        en_privada = self.tabla_anuncios("sitio-a.test", run, "x-privada")
        pasan = [k for k in base if en_privada.get(k, ("", False))[1]]
        c("En la ventana privada, los anuncios de sitio-a llegan", ", ".join(base), ", ".join(pasan) or "ninguno",
          pasan == base and bool(base), codigo="overlay/browser/components/aegis/escudos/red.sys.mjs")
        n.cerrar_ventana(h)
        normal = self.tabla_anuncios("sitio-a.test", run, "x-normal")
        siguen = [k for k in base if not normal.get(k, ("", True))[1]]
        c("La excepción privada no vale en las ventanas normales", ", ".join(base), ", ".join(siguen) or "ninguno",
          siguen == base and bool(base), codigo="overlay/browser/components/aegis/escudos/red.sys.mjs")
        restos = None
        try:
            restos = n.esperar(lambda: not ex("listar", None, None, True), 20, "el borrado de las excepciones privadas")
        except TimeoutError:
            restos = False
        c("Al cerrar la última ventana privada, sus excepciones se borran", "ninguna excepción privada",
          ex("listar", None, None, True), restos is True,
          porque="El gestor de permisos borra los de las ventanas privadas al cerrarse la última (last-pb-context-exited).")

        ex("quitar", "sitio-a.test")
        self.resultados.append({"caso": "excepciones", "etiqueta": "Excepciones por sitio", "modo": self.modo(),
                                "run": run, "comprobaciones": comps})
        self.mostrar("Excepciones por sitio", self.modo(), comps)

    # ── Recorrido ──

    def todo(self):
        casos = self.casos
        self.arrancar(primera=True)
        self.preparacion()
        self.referencia()
        for nombre in ("rastreadores", "anuncios", "cosmetico", "excepciones", "cookies", "https", "olvidar", "google"):
            if nombre in casos:
                self.intentar(getattr(self, f"caso_{nombre}"))
        if "control" in casos:
            self.intentar(self.caso_control)
            self.intentar(lambda: self.caso_control(self.modo(nivel="normal"), "Web normal · Normal (nivel)")
                          if self.cambiar_nivel("standard") else None)
            self.intentar(lambda: self.cambiar_nivel("strict"))
        if "huella" in casos or "cajafuerte" in casos:
            self.intentar(self.caso_huella)
        self.intentar(self.caso_red)

    def cambiar_nivel(self, valor):
        self.limpia("sitio-a.test")
        self.n.elegir("aegis-escudos-menu-nivel", valor)
        return True

    def intentar(self, fn):
        try:
            fn()
        except Exception as e:
            nombre = getattr(fn, "__name__", "caso")
            print(f"  ✗ ERROR DEL BANCO en {nombre}: {e}")
            self.errores.append({"caso": nombre, "error": f"{e}", "traza": traceback.format_exc()})
            try:
                self.n.cerrar_panel()
                self.n.m.cambiar_ventana(self.n.ventana_principal)
            except Exception:
                pass

    def cerrar(self):
        try:
            if self.vigia:
                self.vigia.parar()
            if self.n:
                try:
                    self.n.salir(30)
                finally:
                    self.n.matar()
        finally:
            self.srv.parar()
            self.salida.close()


def describir(modo):
    partes = [f"nivel {modo['nivel']}", f"escudos {modo['escudos']}", f"cookies {modo['cookies']}",
              f"huella {modo['huella']}"]
    if modo.get("privada") == "1":
        partes.append("privada")
    if modo.get("permiso") == "1":
        partes.append("con permiso")
    if modo.get("google") == "0":
        partes.append("Google limpio apagado")
    if modo.get("contador") == "origenes":
        partes.append("contador por orígenes")
    if modo.get("molestias", "cva") != "cva":
        partes.append(f"molestias «{modo.get('molestias')}»")
    if modo.get("ubo") == "1":
        partes.append("uBlock Origin activo")
    return ", ".join(partes)


JS_MOTOR_GOOGLE = """
const peticiones = arguments[0];
const url = Services.prefs.getBoolPref("aegis.dev", false) ? "resource://aegis/escudos/" : "resource:///modules/aegis/escudos/";
const M = ChromeUtils.importESModule(url + "motor.sys.mjs").AegisEscudosMotor;
const ORIGEN = { "g-inicio": "https://www.google.com", "g-youtube": "https://www.youtube.com", "g-terceros": "https://sitio-a.test" };
const TIPO = { imagen: "image", fetch: "xmlhttprequest", "fetch-post": "xmlhttprequest", baliza: "ping", script: "script", marco: "subdocument" };
const salida = {};
for (const [fase, lista] of Object.entries(peticiones)) {
  salida[fase] = {};
  for (const [etiqueta, u, tipo] of lista) {
    const x = new URL(u);
    x.searchParams.set("aegisid", "x");
    salida[fase][etiqueta] = M.red(x.href, ORIGEN[fase], TIPO[tipo] ?? "other") > 0;
  }
}
return salida;"""


# ── Informe ───────────────────────────────────────────────────────────────────────────────────────────────────

REAL_Y_SIMULADO = [
    ("Real", "El navegador entero: el Aegis de la copia indicada, con el código del repo, sus prefs y un perfil nuevo."),
    ("Real", "Bloqueo de rastreadores: el clasificador de URL del motor con su tabla de prueba integrada "
             "(moztest-track-simple: itisatracker.org, trackertest.org) y la protección contra rastreo de verdad."),
    ("Simulado", "Las listas de redes sociales, recolectores de huella y criptomineros: una entrada de prueba por "
                 "categoría en urlclassifier.features.<categoría>.blacklistHosts (el bloqueo sí es el del motor). "
                 "Las listas reales (Disconnect, por Remote Settings) no se descargan."),
    ("Real", "Sitios distintos con sus nombres y puertos reales (https://www.google.com/, http://sitio-a.test/): "
             "primera parte frente a terceros, cookies por sitio, Solo HTTPS y HSTS se comportan como en Internet."),
    ("Simulado", "Lo que contestan los sitios: un servidor local (proxy en 127.0.0.1) con páginas de prueba. Google y "
                 "YouTube son páginas simuladas que lanzan las peticiones reales que hace Google (rutas y tipos)."),
    ("Simulado", "HTTPS: una CA temporal creada por el banco e instalada solo en el perfil de prueba."),
    ("Real", "Cambios de modo: con el panel de Escudos (interruptores y desplegables), Ajustes y el aviso de Caja "
             "fuerte, pulsando sus botones."),
    ("Real", "Reinicio para «Olvidar este sitio»: cierre ordenado del navegador y nuevo arranque con el mismo perfil."),
    ("Simulado", "El usuario: tema oscuro, «reducir movimiento», «reducir transparencias» e idiomas en español puestos "
                 "en el perfil para que lo protegido se distinga de lo real."),
    ("Real", "Referencia de la huella: los valores reales del equipo medidos en la ventana del navegador (a la "
             "interfaz no se le aplica la protección)."),
]


def informe(b, ruta_html):
    filas = []
    total = {}
    for r in b.resultados:
        for c in r["comprobaciones"]:
            total[c["estado"]] = total.get(c["estado"], 0) + 1
    duracion = int(time.time() - b.inicio)
    os.makedirs(os.path.dirname(ruta_html), exist_ok=True)
    e = html.escape
    for r in b.resultados:
        cuenta = {}
        for c in r["comprobaciones"]:
            cuenta[c["estado"]] = cuenta.get(c["estado"], 0) + 1
        filas.append(f"<h2>{e(r['etiqueta'])}</h2><p class='mono'>{e(describir(r['modo']))} · run {e(r['run'])} · "
                     + " · ".join(f"{k}: {v}" for k, v in sorted(cuenta.items())) + "</p><table><thead><tr>"
                     "<th>Comprobación</th><th>Se esperaba</th><th>Ha pasado</th><th>Estado</th></tr></thead><tbody>")
        for c in r["comprobaciones"]:
            detalle = " · ".join(x for x in (c.get("porque"), f"Código: {c['codigo']}" if c.get("codigo") else "") if x)
            filas.append(f"<tr class='{e(c['estado'])}'><td>{e(c['titulo'])}<div class='porque'>{e(detalle)}</div></td>"
                         f"<td>{e(c['esperado'])}</td><td>{e(c['observado'])}</td>"
                         f"<td class='estado {e(c['estado'])}'>{e(c['estado'])}</td></tr>")
        filas.append("</tbody></table>")
    controles = "".join(
        f"<tr class='{'ok' if c['fallos'] else 'fallo'}'><td>{e(c['titulo'])}</td><td>{c['fallos']} fallos"
        f"{' (p. ej. ' + e(c['ejemplo']) + ')' if c['ejemplo'] else ''}</td>"
        f"<td class='estado {'ok' if c['fallos'] else 'fallo'}'>{'falla como debe' if c['fallos'] else 'NO FALLA'}</td></tr>"
        for c in b.controles)
    errores = "".join(f"<h3>{e(x['caso'])}</h3><pre class='mono'>{e(x['traza'])}</pre>" for x in b.errores)
    real = "".join(f"<tr><td>{e(a)}</td><td>{e(t)}</td></tr>" for a, t in REAL_Y_SIMULADO)
    with open(os.path.join(sitios.RAIZ_WEB, "comun", "banco.css"), encoding="utf-8") as f:
        css = f.read().replace('url("/fuentes/inter.woff2")', f'url("{sitios.INTER.replace(os.sep, "/")}")')
    pagina = f"""<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Informe del banco de Escudos</title>
<meta name="viewport" content="width=device-width, initial-scale=1"><style>{css}</style></head><body>
<p class="etiqueta">Banco de pruebas de Escudos · informe</p><h1>Escudos, en todos los casos y modos</h1>
<p class="mono">{e(datetime.datetime.now().strftime('%Y-%m-%d %H:%M'))} · {e(b.exe)} · {duracion} s</p>
<div class="resumen tarjeta">{''.join(f"<div class='{k}'><b>{v}</b>{e(k)}</div>" for k, v in sorted(total.items()))}</div>
<h2>Controles que tienen que fallar</h2><p>Lo observado en un modo, evaluado como si fuera otro. Si no falla, el banco no
distingue ese modo y sus «bien» no valdrían.</p><div class="tarjeta"><table><tbody>{controles}</tbody></table></div>
{('<h2>Errores del propio banco</h2>' + errores) if errores else ''}
{''.join(filas)}
<h2>Qué es real y qué simulado</h2><div class="tarjeta"><table><tbody>{real}</tbody></table></div>
</body></html>"""
    with open(ruta_html, "w", encoding="utf-8", newline="\n") as f:
        f.write(pagina)
    with open(ruta_html[:-5] + ".md", "w", encoding="utf-8", newline="\n") as f:
        f.write(f"# Banco de Escudos · {datetime.datetime.now():%Y-%m-%d %H:%M}\n\n")
        f.write(f"Ejecutable: `{b.exe}` · {duracion} s · " + " · ".join(f"{k}: {v}" for k, v in sorted(total.items())) + "\n\n")
        f.write("## Controles que tienen que fallar\n\n")
        for c in b.controles:
            f.write(f"- {c['titulo']}: {'falla como debe' if c['fallos'] else '**NO FALLA**'} ({c['fallos']} fallos)\n")
        for r in b.resultados:
            f.write(f"\n## {r['etiqueta']}\n\n{describir(r['modo'])}\n\n| Comprobación | Se esperaba | Ha pasado | Estado |\n|---|---|---|---|\n")
            for c in r["comprobaciones"]:
                celda = lambda s: str(s).replace("|", "\\|").replace("\n", " ")
                f.write(f"| {celda(c['titulo'])} | {celda(c['esperado'])} | {celda(c['observado'])} | {c['estado']} |\n")
        if b.errores:
            f.write("\n## Errores del banco\n\n")
            for x in b.errores:
                f.write(f"- {x['caso']}: {x['error']}\n")
    return total


def manual(a):
    """Abre Aegis con el banco listo para probar a mano (sin Marionette: el navegador se ve tal cual)."""
    b = Banco(a)
    try:
        b.arrancar(primera=True)
        b.referencia()
        b.n.salir()
        b.vigia.parar()
        import subprocess
        while True:
            p = subprocess.Popen([b.exe, "-no-remote", "-profile", b.perfil, f"{BANCO}/"])
            print(f"\nBanco abierto: {BANCO}/ (proxy en 127.0.0.1:{b.srv.puerto}). Cierra Aegis para terminar.")
            p.wait()
            # «Olvidar este sitio» se prueba cerrando y abriendo: mismo perfil y mismo servidor.
            try:
                otra = input("¿Abrir Aegis otra vez con el mismo perfil? [s/N] ").strip().lower()
            except EOFError:
                otra = ""
            if otra not in ("s", "si", "sí"):
                break
    finally:
        b.srv.parar()
        if not a.mantener:
            shutil.rmtree(b.tmp, ignore_errors=True)


CASOS = ("rastreadores", "anuncios", "cosmetico", "excepciones", "cookies", "https", "olvidar", "google", "control",
         "huella", "cajafuerte")


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    p = argparse.ArgumentParser(description="Banco de pruebas de Escudos (Aegis).")
    p.add_argument("--exe", help="ejecutable de Aegis que probar")
    p.add_argument("--instalada", action="store_true", help="probar el Aegis instalado en vez de la copia de desarrollo")
    p.add_argument("--solo", help=f"casos separados por comas ({', '.join(CASOS)})")
    p.add_argument("--manual", action="store_true", help="abrir el banco para probarlo a mano")
    p.add_argument("--aislar", action="store_true", help="copiar la instalación de prueba a un directorio temporal")
    p.add_argument("--sin-ventana", action="store_true", help="sin ventana (headless): algunas pruebas de pantalla no discriminan")
    p.add_argument("--informe", help="ruta del informe HTML (de serie, out/pruebas/escudos-<fecha>.html)")
    p.add_argument("--mantener", action="store_true", help="no borrar el directorio temporal (perfil, registros)")
    p.add_argument("--abrir", action="store_true", help="abrir el informe HTML al terminar")
    p.add_argument("--pref", action="append", help="pref de más para el perfil de prueba, nombre=valor JSON (repetible)")
    a = p.parse_args()
    if a.manual:
        manual(a)
        return 0
    casos = set(a.solo.split(",")) if a.solo else set(CASOS)
    desconocidos = casos - set(CASOS)
    if desconocidos:
        p.error(f"casos desconocidos: {', '.join(sorted(desconocidos))}")
    try:
        b = Banco(a)
    except Exception as e:
        print(f"El banco no ha podido arrancar: {e}")
        return 2
    b.casos = casos
    print(f"Banco de Escudos · {b.exe}\n  temporal: {b.tmp} · proxy 127.0.0.1:{b.srv.puerto} · Marionette {b.puerto}")
    try:
        b.todo()
    except Exception as e:
        b.errores.append({"caso": "arranque", "error": str(e), "traza": traceback.format_exc()})
        print(f"✗ ERROR DEL BANCO: {e}")
    finally:
        b.cerrar()
    ruta = a.informe or os.path.join(REPO, "out", "pruebas", f"escudos-{datetime.datetime.now():%Y%m%d-%H%M}.html")
    total = informe(b, ruta)
    controles_mal = [c for c in b.controles if not c["fallos"]]
    print("\nResumen: " + " · ".join(f"{k}: {v}" for k, v in sorted(total.items())))
    print(f"Controles: {len(b.controles) - len(controles_mal)} de {len(b.controles)} fallan como deben")
    if b.errores:
        print(f"Errores del banco: {len(b.errores)} (ver el informe)")
    print(f"Informe: {ruta}\n         {ruta[:-5]}.md")
    if a.abrir and hasattr(os, "startfile"):
        os.startfile(ruta)
    if not a.mantener:
        shutil.rmtree(b.tmp, ignore_errors=True)
    else:
        print(f"Temporal conservado: {b.tmp}")
    return 1 if total.get("fallo") or controles_mal or b.errores else 0


if __name__ == "__main__":
    sys.exit(main())
