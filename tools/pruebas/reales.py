#!/usr/bin/env python3
"""Pruebas con webs reales: las webs públicas de prueba que usa la gente, en cada modo de Escudos y de huella.

    python tools/pruebas/reales.py --exe C:\\…\\firefox.exe                 los modos de serie (abajo), todas las webs
    python tools/pruebas/reales.py --modos firefox,estricto-mas-caja-fuerte --webs creepjs,coveryourtracks
    python tools/pruebas/reales.py --resumen out/pruebas-reales/2026-10-15_0930   rehace resumen.md y resumen.html

Modos: «firefox» (todo apagado: Firefox de serie, abajo) o «<escudos>-<huella>», con
    escudos: normal | estricto | estricto-mas          huella: basica | equilibrada | estricta | caja-fuerte
De serie se miden siete: firefox y Estricto+ con Equilibrada (lo que trae Aegis), y desde ahí cada eje por separado
(los tres niveles de Escudos con Equilibrada; las cuatro huellas con Estricto+).

Qué hace:
1. Perfil base (una vez): un perfil nuevo de Aegis en el que se aceptan las conexiones como lo haría una persona en
   about:conexiones (AegisConexiones.aceptar), con «Seguridad» y «Listas de protección» y nada más: ni actualizaciones
   (la copia probada no debe cambiar), ni códecs, ni traducción, ni Safe Browsing, ni notificaciones. Se espera a que
   lleguen las listas de la protección contra rastreo (ETP, por Remote Settings) y a que los Escudos revisen las suyas,
   y se apunta cuánto tardan. Si la revisión diaria de los Escudos no salta sola en --espera-escudos, se pide
   «Actualizar ahora» (AegisEscudosListas.actualizarAhora) y se dice.
2. Cada modo: una copia del perfil base; un primer arranque pone el nivel (las mismas funciones que el panel de
   Escudos: browser.contentblocking.category, aegis.escudos.estricto_mas y AegisHuella.poner) y un segundo arranque,
   ya con todo aplicado (Caja fuerte y el motor necesitan reiniciar), visita las webs.
3. Cada web: se espera a su resultado, se leen sus datos del DOM (JSON), y se guardan la captura del contenido
   (WebDriver:TakeScreenshot, la vista y la página entera; nunca la pantalla de Windows), el PDF (WebDriver:Print), el
   texto, el HTML, los recursos cargados, lo que marcan los Escudos (contador y desglose del panel) y el registro de
   bloqueos de ETP. Si la web da un enlace a su resultado, también.
4. resumen.md y resumen.html comparan los modos en una tabla, con miniaturas y enlaces.

Todo va a out/pruebas-reales/<AAAA-MM-DD_HHMM>/<modo>/<web>/. Nunca se borra un resultado: si la carpeta existe, se
para. Los perfiles temporales sí se borran al terminar (salvo --mantener).

Límites que hay que saber al leer los resultados:
- Marionette pone navigator.webdriver = true (así lo hace el motor con cualquier automatización). CreepJS lo cuenta
  como «headless» y otras webs pueden tratarlo como un robot: es del banco, no de Aegis.
- Las visitas salen de la IP del equipo. Los resultados (capturas, PDF, JSON) llevan esa IP y la ubicación aproximada:
  cuidado al compartirlos. No se inicia sesión en nada ni se escribe nada en formularios.
- «firefox» no es un Firefox limpio: es Aegis con la protección contra rastreo «standard» de Firefox (sin bloquear
  rastreadores en ventanas normales), sin protección de huella en ventanas normales (privacy.fingerprintingProtection
  en false, nivel Básica), sin el motor de Escudos, sin «Google limpio» y con las prefs que cambian lo que ven las webs
  devueltas a su valor de Firefox (GPC, Referer, WebRTC). El resto de Aegis (interfaz, telemetría…) sigue igual.
"""
import argparse
import base64
import datetime
import html
import json
import os
import re
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import traceback

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)

from marionette import ErrorMarionette, Marionette  # noqa: E402
from navegador import COPIA_DESARROLLO, Navegador, buscar_instalada, escribir_user_js  # noqa: E402

REPO = os.path.dirname(os.path.dirname(AQUI))
SALIDA = os.path.join(REPO, "out", "pruebas-reales")

# ── Modos ────────────────────────────────────────────────────────────────────────────────────────────────────────

ESCUDOS = {"normal": "standard", "estricto": "strict", "estricto-mas": "strict+"}
HUELLA = {"basica": "firefox", "equilibrada": "equilibrada", "estricta": "estricta", "caja-fuerte": "caja_fuerte"}
NOMBRE_ESCUDOS = {"normal": "Normal", "estricto": "Estricto", "estricto-mas": "Estricto+"}
NOMBRE_HUELLA = {"basica": "Básica", "equilibrada": "Equilibrada", "estricta": "Estricta", "caja-fuerte": "Caja fuerte"}
MODOS_SERIE = ["firefox", "normal-equilibrada", "estricto-equilibrada", "estricto-mas-equilibrada",
               "estricto-mas-basica", "estricto-mas-estricta", "estricto-mas-caja-fuerte"]

# «Firefox de serie»: las prefs de Aegis que cambian lo que ve una web, devueltas al valor de Firefox 157.
PREFS_FIREFOX = {
    # Protección contra rastreo «standard» de Firefox: en ventanas normales no bloquea rastreadores (solo sus cookies).
    "privacy.trackingprotection.enabled": False,
    # Sin protección de huella en ventanas normales (Firefox solo la pone en privadas).
    "privacy.fingerprintingProtection": False,
    # Sin el motor de Escudos (se lee al arrancar) ni el filtro de Google.
    "aegis.escudos.motor": False,
    "aegis.google.limpio": False,
    # GPC, Referer entre sitios y WebRTC con sus valores de Firefox.
    "privacy.globalprivacycontrol.enabled": False,
    "network.http.referer.XOriginTrimmingPolicy": 0,
    "media.peerconnection.ice.default_address_only": False,
}


def leer_modo(nombre):
    """«firefox» o «<escudos>-<huella>» → {nombre, titulo, escudos, huella, firefox}."""
    if nombre == "firefox":
        return {"nombre": nombre, "titulo": "Firefox de serie (todo apagado)", "firefox": True,
                "escudos": "standard", "huella": "firefox"}
    for e in sorted(ESCUDOS, key=len, reverse=True):
        if nombre.startswith(e + "-") and nombre[len(e) + 1:] in HUELLA:
            h = nombre[len(e) + 1:]
            return {"nombre": nombre, "titulo": f"Escudos {NOMBRE_ESCUDOS[e]} · huella {NOMBRE_HUELLA[h]}",
                    "firefox": False, "escudos": ESCUDOS[e], "huella": HUELLA[h]}
    raise SystemExit(f"Modo desconocido: {nombre}. Usa firefox o <{'|'.join(ESCUDOS)}>-<{'|'.join(HUELLA)}>.")


# ── Webs ─────────────────────────────────────────────────────────────────────────────────────────────────────────

def js_texto(patron):
    """Condición de «listo»: el texto visible de la página casa con la expresión regular."""
    return f"return !!document.body && /{patron}/.test(document.body.innerText);"


# Cada web: dirección, cuándo está su resultado (`listo`, JS que devuelve verdadero; None = esperar `espera` segundos
# fijos), lo que se espera como mucho, una acción (pulsar algo) y un extractor propio en JS (además del texto).
WEBS = [
    {
        "id": "d3ward", "titulo": "d3ward · Test Ad Block", "url": "https://d3ward.github.io/toolz/adblock",
        "listo": js_texto(r"no longer maintained|\d+\s*%"), "espera": 45,
    },
    {
        "id": "coveryourtracks", "titulo": "Cover Your Tracks (EFF)", "url": "https://coveryourtracks.eff.org/",
        # «Test your browser» con la casilla de serie («Test with a real tracking company»).
        "accion": "#kcarterlink",
        "listo": "return location.pathname.startsWith('/results') && /Detailed Results/.test(document.body.innerText);",
        "espera": 180,
    },
    {
        "id": "creepjs", "titulo": "CreepJS", "url": "https://abrahamjuliot.github.io/creepjs/",
        "listo": "const w = window.wrappedJSObject || window; return !!w.Fingerprint && /FP ID: \\w{20,}/.test(document.body.innerText);",
        "espera": 120, "reposo": 5,
        "extractor": """
            const w = window.wrappedJSObject || window;
            const f = w.Fingerprint ? JSON.parse(JSON.stringify(w.Fingerprint)) : null;
            const c = w.Creep ? JSON.parse(JSON.stringify(w.Creep)) : null;
            return {fingerprint: f, creep: c};
        """,
    },
    {
        # La portada solo enlaza las pruebas: se mide la «eXtreme Test», la que pide el usuario.
        "id": "canyoublockit", "titulo": "Can You Block It · eXtreme Test", "url": "https://canyoublockit.com/extreme-test/",
        "listo": None, "espera": 30,
        "extractor": """
            const vis = e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e);
                               return r.width > 5 && r.height > 5 && s.visibility != 'hidden' && s.display != 'none'; };
            const bloques = [...document.querySelectorAll('.code-block')].map(b => {
              const r = b.getBoundingClientRect();
              const hijos = [...b.querySelectorAll('iframe, img, ins, a, video, div')].filter(vis);
              return {clase: b.className, ancho: Math.round(r.width), alto: Math.round(r.height), visibles: hijos.length,
                      iframes: b.querySelectorAll('iframe').length, scripts: [...b.querySelectorAll('script')].map(s => s.src)};
            });
            const iframes = [...document.querySelectorAll('iframe')].map(f => { const r = f.getBoundingClientRect();
              return {src: (f.src || '').slice(0, 300), ancho: Math.round(r.width), alto: Math.round(r.height), visible: vis(f)}; });
            const video = [...document.querySelectorAll('video')].map(v => ({src: (v.currentSrc || v.src || '').slice(0, 300)}));
            return {bloques, iframes, video};
        """,
    },
    {
        "id": "adblock-tester", "titulo": "AdBlock Tester", "url": "https://adblock-tester.com/",
        "listo": js_texto(r"\d+ points out of 100"), "espera": 120, "reposo": 3,
    },
    {
        "id": "browserleaks-canvas", "titulo": "BrowserLeaks · Canvas", "url": "https://browserleaks.com/canvas",
        "listo": js_texto(r"Signature\s+[0-9A-F]{32}"), "espera": 60, "reposo": 3,
    },
    {
        "id": "browserleaks-webgl", "titulo": "BrowserLeaks · WebGL", "url": "https://browserleaks.com/webgl",
        "listo": js_texto(r"WebGL Report Hash\s+[0-9A-F]{32}"), "espera": 60, "reposo": 3,
    },
    {
        "id": "browserleaks-fonts", "titulo": "BrowserLeaks · Fuentes", "url": "https://browserleaks.com/fonts",
        "listo": js_texto(r"\d+ fonts and \d+ unique metrics"), "espera": 120, "reposo": 3,
    },
    {
        "id": "browserleaks-javascript", "titulo": "BrowserLeaks · JavaScript", "url": "https://browserleaks.com/javascript",
        "listo": js_texto(r"hardwareConcurrency"), "espera": 60, "reposo": 5,
    },
    {
        "id": "whatismybrowser", "titulo": "WhatIsMyBrowser", "url": "https://www.whatismybrowser.com/",
        "listo": js_texto(r"unique URL"), "espera": 90, "reposo": 5,
    },
    {
        "id": "amiunique", "titulo": "AmIUnique", "url": "https://amiunique.org/fingerprint",
        "listo": js_texto(r"unique among|not unique|fingerprints in our entire dataset"), "espera": 180, "reposo": 5,
    },
]
WEB = {w["id"]: w for w in WEBS}

# Datos comunes de cada página (contexto de la web, como un script suyo).
JS_COMUNES = """
const recursos = performance.getEntriesByType("resource").map(e => ({
  url: e.name.slice(0, 400), tipo: e.initiatorType, bytes: e.transferSize, estado: e.responseStatus ?? null,
  ms: Math.round(e.duration)}));
return {
  url: location.href, titulo: document.title, webdriver: navigator.webdriver,
  texto: document.body ? document.body.innerText : "",
  html: document.documentElement ? document.documentElement.outerHTML : "",
  recursos,
  adsense: [...document.querySelectorAll("ins.adsbygoogle")].map(i => i.getAttribute("data-ad-status")),
  ventana: {interior: [innerWidth, innerHeight], exterior: [outerWidth, outerHeight], pantalla: [screen.width, screen.height]},
};
"""

# ── Scripts de la interfaz (contexto chrome) ─────────────────────────────────────────────────────────────────────

JS_BASE_MODULOS = """
const base = Services.prefs.getBoolPref("aegis.dev", false) ? "resource://aegis/" : "resource:///modules/aegis/";
const modulo = (ruta, nombre) => ChromeUtils.importESModule(base + ruta)[nombre];
"""

# Acepta las conexiones como el botón «Aceptar» de about:conexiones, con esta elección.
JS_ACEPTAR = JS_BASE_MODULOS + """
modulo("conexiones.sys.mjs", "AegisConexiones").aceptar(arguments[0]);
return modulo("conexiones.sys.mjs", "AegisConexiones").activos();
"""

# Tablas del clasificador de URLs (ETP) que hay en el perfil y la última actualización del proveedor de Mozilla.
JS_TABLAS_ETP = """
const fin = arguments[arguments.length - 1];
const db = Cc["@mozilla.org/url-classifier/dbservice;1"].getService(Ci.nsIUrlClassifierDBService);
const ultima = Services.prefs.getCharPref("browser.safebrowsing.provider.mozilla.lastupdatetime", "");
try {
  db.getTables(t => fin({tablas: t.split("\\n").filter(Boolean).map(l => l.split(";")[0]), crudo: t, ultima}));
} catch (e) {
  fin({error: String(e), ultima});
}
"""

# ¿Qué dice el clasificador de unas direcciones de rastreadores conocidos? (comprobación de que las listas sirven)
JS_CLASIFICAR = """
const fin = arguments[arguments.length - 1];
const urls = arguments[0];
const cls = Cc["@mozilla.org/url-classifier/dbservice;1"].getService(Ci.nsIURIClassifier);
const nombres = ["tracking-protection", "tracking-annotation", "fingerprinting-protection", "cryptomining-protection",
                 "socialtracking-protection"];
const features = nombres.map(n => { try { return cls.getFeatureByName(n); } catch { return null; } }).filter(Boolean);
const out = {};
let pendientes = urls.length;
for (const u of urls) {
  try {
    cls.asyncClassifyLocalWithFeatures(Services.io.newURI(u), features, Ci.nsIUrlClassifierFeature.blocklist, {
      onClassifyComplete(r) { out[u] = r.map(x => [x.feature.name, x.list]); if (--pendientes == 0) fin(out); },
    });
  } catch (e) { out[u] = "error: " + e; if (--pendientes == 0) fin(out); }
}
"""

# Estado de las listas de los Escudos (espera a que el motor termine lo que tenga en marcha).
JS_ESCUDOS_ESTADO = JS_BASE_MODULOS + """
const fin = arguments[arguments.length - 1];
modulo("escudos/listas.sys.mjs", "AegisEscudosListas").estado()
  .then(e => fin(e), e => fin({error: String(e)}));
"""

# «Actualizar ahora»: todas las listas activas, sin mirar su edad.
JS_ESCUDOS_ACTUALIZAR = JS_BASE_MODULOS + """
const fin = arguments[arguments.length - 1];
modulo("escudos/listas.sys.mjs", "AegisEscudosListas").actualizarAhora()
  .then(r => fin(r ?? null), e => fin({error: String(e)}));
"""

# El registro de las listas de los Escudos en el perfil (lo escribe la primera revisión).
JS_ESCUDOS_REGISTRO = """
const fin = arguments[arguments.length - 1];
const ruta = PathUtils.join(PathUtils.profileDir, "aegis-escudos", "listas.json");
IOUtils.readJSON(ruta).then(d => fin(d), () => fin(null));
"""

# Pone el modo con las mismas funciones que el panel de Escudos (escudos.sys.mjs: ponerNivel; huella.sys.mjs: poner).
JS_PONER_MODO = JS_BASE_MODULOS + """
const [modo, prefs] = [arguments[0], arguments[1]];
const fin = arguments[arguments.length - 1];
const poner = (k, v) => typeof v == "boolean" ? Services.prefs.setBoolPref(k, v)
  : typeof v == "number" ? Services.prefs.setIntPref(k, v) : Services.prefs.setStringPref(k, v);
(async () => {
  const huella = modulo("huella.sys.mjs", "AegisHuella");
  if (modo.escudos != "standard") {
    Services.prefs.setBoolPref("aegis.escudos.estricto_mas", modo.escudos == "strict+");
  }
  Services.prefs.setStringPref("browser.contentblocking.category", modo.escudos == "strict+" ? "strict" : modo.escudos);
  huella.poner(modo.huella);
  for (const [k, v] of Object.entries(prefs)) {
    poner(k, v);
  }
  // Que el motor termine de recompilar con las listas del nivel antes de cerrar.
  let estado = null;
  if (Services.prefs.getBoolPref("aegis.escudos.motor", true)) {
    estado = await modulo("escudos/listas.sys.mjs", "AegisEscudosListas").estado();
  }
  Services.prefs.savePrefFile(null);
  return {estado};
})().then(fin, e => fin({error: String(e)}));
"""

PREFS_CONFIG = [
    "browser.contentblocking.category", "aegis.escudos.estricto_mas", "aegis.escudos.motor", "aegis.huella.nivel",
    "privacy.trackingprotection.enabled", "privacy.trackingprotection.pbmode.enabled",
    "privacy.trackingprotection.socialtracking.enabled", "privacy.trackingprotection.fingerprinting.enabled",
    "privacy.trackingprotection.cryptomining.enabled", "privacy.trackingprotection.emailtracking.enabled",
    "network.cookie.cookieBehavior", "privacy.fingerprintingProtection", "privacy.fingerprintingProtection.pbmode",
    "privacy.fingerprintingProtection.overrides", "privacy.resistFingerprinting", "privacy.spoof_english",
    "privacy.globalprivacycontrol.enabled", "network.http.referer.XOriginTrimmingPolicy",
    "media.peerconnection.ice.default_address_only", "aegis.google.limpio", "aegis.conexiones.aceptadas",
    "aegis.conexiones.listas", "aegis.conexiones.seguridad", "aegis.conexiones.actualizaciones",
    "browser.safebrowsing.update.enabled", "aegis.remotesettings.colecciones", "intl.accept_languages",
    "layout.frame_rate", "dom.security.https_only_mode", "marionette.port", "remote.prefs.recommended",
]

JS_CONFIG = """
const p = n => { const t = Services.prefs.getPrefType(n);
  return t == 32 ? Services.prefs.getStringPref(n) : t == 64 ? Services.prefs.getIntPref(n)
       : t == 128 ? Services.prefs.getBoolPref(n) : null; };
return {prefs: Object.fromEntries(arguments[0].map(n => [n, p(n)])), version: Services.appinfo.version,
        buildID: Services.appinfo.appBuildID, locale: Services.locale.appLocaleAsBCP47, so: Services.appinfo.OS};
"""

JS_LOG_ETP = """
const fin = arguments[arguments.length - 1];
// Según la versión devuelve el texto o una promesa.
Promise.resolve(gBrowser.selectedBrowser.getContentBlockingLog()).then(s => fin(s), e => fin(null));
"""

# Bits de nsIWebProgressListener: lo que ETP bloquea (o sustituye) en un origen.
BITS_ETP = {
    "rastreo": 1 << 12, "huella": 1 << 6, "criptomineria": 1 << 11, "redes_sociales": 1 << 16,
    "correo": 1 << 22, "sustituido_smartblock": (1 << 4) | (1 << 27), "huella_sospechosa": 1 << 2,
    "rastreador_cargado": (1 << 13) | (1 << 20), "cookies_bloqueadas": (1 << 29) | (1 << 24) | (1 << 30) | (1 << 7) | (1 << 28),
    "cookies_aisladas": (1 << 1) | (1 << 31),
}
# Contenido que ETP no ha dejado cargar (el segundo campo de cada entrada del registro no dice «bloqueado»: va a true
# también para lo cargado; lo que cuenta son los bits).
BLOQUEO_ETP = (1 << 12) | (1 << 6) | (1 << 11) | (1 << 16) | (1 << 22)

# Prefs del perfil de prueba (user.js). Solo lo necesario para manejarlo; el resto es Aegis tal cual.
def prefs_perfil(puerto):
    return {
        # Marionette en un puerto propio y sin sus «prefs recomendadas» (cambian decenas de ajustes).
        "marionette.port": puerto,
        "remote.prefs.recommended": False,
        # Sin la página about:conexiones en la primera ventana: la elección se hace con AegisConexiones.aceptar,
        # que es lo que hace su botón «Aceptar» (ver preparar_base).
        "aegis.conexiones.decidido": True,
        # Que la ventana no deje de pintarse si otra la tapa (Windows la daría por oculta).
        "widget.windows.window_occlusion_tracking.enabled": False,
        # Sin diálogos de recuperación si una prueba anterior cerró el navegador a la fuerza.
        "browser.sessionstore.resume_from_crash": False,
        "toolkit.startup.max_resumed_crashes": -1,
    }


# Lo que se acepta en about:conexiones para la medición: listas y seguridad; nada que cambie la copia probada.
ELECCION = {"actualizaciones": False, "seguridad": True, "listas": True, "codecs": False, "traduccion": False,
            "safebrowsing": False, "push": False}

# Tablas de ETP que tienen que estar para dar las listas por llegadas (las de la categoría estricta).
TABLAS_ETP = ["ads-track-digest256", "analytics-track-digest256", "social-track-digest256", "content-track-digest256",
              "base-fingerprinting-track-digest256", "base-cryptomining-track-digest256", "mozstd-trackwhite-digest256"]
# Rastreadores conocidos para comprobar que el clasificador los reconoce.
URLS_RASTREO = ["https://www.google-analytics.com/analytics.js", "https://connect.facebook.net/en_US/fbevents.js",
                "https://doubleclick.net/", "https://static.hotjar.com/c/hotjar.js"]


# ── Utilidades ───────────────────────────────────────────────────────────────────────────────────────────────────

class Registro:
    """Imprime y apunta en ejecucion.log."""

    def __init__(self, ruta):
        self.f = open(ruta, "a", encoding="utf-8")

    def __call__(self, *partes):
        linea = " ".join(str(p) for p in partes)
        print(linea, flush=True)
        self.f.write(f"{datetime.datetime.now():%H:%M:%S} {linea}\n")
        self.f.flush()


def puerto_libre():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def escribir_json(ruta, datos):
    with open(ruta, "w", encoding="utf-8", newline="\n") as f:
        json.dump(datos, f, ensure_ascii=False, indent=1)


def escribir_texto(ruta, texto):
    with open(ruta, "w", encoding="utf-8", newline="\n") as f:
        f.write(texto)


def escribir_b64(ruta, b64):
    with open(ruta, "wb") as f:
        f.write(base64.b64decode(b64))


class NavegadorReal(Navegador):
    """El Navegador del banco, con la sesión que necesitan las webs reales: los alert() de una web se descartan
    solos (si no, la siguiente orden fallaría) y la carga de página se espera como de serie."""

    def arrancar(self, salida):
        args = [self.exe, "-no-remote", "-marionette", "-remote-allow-system-access", "-profile", self.perfil]
        if self.sin_ventana:
            args.insert(1, "-headless")
        self.proceso = subprocess.Popen(args, env={**os.environ, **self.entorno}, stdout=salida,
                                        stderr=subprocess.STDOUT)
        self.m = Marionette(self.puerto, espera=120)
        self.m.sesion(unhandledPromptBehavior="dismiss", pageLoadStrategy="normal")
        self.ventana_principal = self.m.ventana_chrome()
        self.esperar(lambda: self.m.chrome("return !!document.getElementById('aegis-escudos-button') && "
                                           "!!window.gBrowserInit?.delayedStartupFinished;"), 90,
                     "la ventana lista con el botón de Escudos")
        return self

    def pestana(self):
        self.m._contexto("content")
        r = self.m.orden("WebDriver:GetWindowHandle")
        return r.get("value", r) if isinstance(r, dict) else r

    def cerrar_otras(self, mia):
        """Cierra pestañas y ventanas que haya abierto una web (anuncios) y vuelve a la nuestra, en primer plano."""
        self.m._contexto("content")
        r = self.m.orden("WebDriver:GetWindowHandles")
        cerradas = 0
        for h in (r.get("value", r) if isinstance(r, dict) else r):
            if h != mia:
                try:
                    self.m.orden("WebDriver:SwitchToWindow", {"handle": h, "focus": False})
                    self.m.orden("WebDriver:CloseWindow")
                    cerradas += 1
                except ErrorMarionette:
                    pass
        self.m.orden("WebDriver:SwitchToWindow", {"handle": mia, "focus": True})
        self.m.contexto = None
        return cerradas


def cerrar(n):
    """Cierre ordenado; si no termina (o no llegó a arrancar del todo), se mata solo nuestro proceso (/PID … /T)."""
    try:
        n.salir()
    except Exception:  # noqa: BLE001
        pass
    finally:
        n.matar()


def copiar_perfil(origen, destino):
    """Copia el perfil base sin los cerrojos ni el puerto de Marionette del arranque anterior."""
    shutil.copytree(origen, destino, ignore=shutil.ignore_patterns(
        "parent.lock", "lock", ".parentlock", "MarionetteActivePort", "sessionstore-backups", "crashes", "minidumps"))


# ── Perfil base: conexiones aceptadas y listas al día ────────────────────────────────────────────────────────────

def preparar_base(a, exe, perfil, salida, reg):
    os.makedirs(perfil)
    puerto = puerto_libre()
    escribir_user_js(perfil, prefs_perfil(puerto))
    datos = {"eleccion": ELECCION, "tablas_requeridas": TABLAS_ETP}
    with open(os.path.join(salida, "aegis-preparacion.log"), "w", encoding="utf-8", errors="replace") as log:
        n = NavegadorReal(exe, perfil, puerto, sin_ventana=a.sin_ventana)
        try:
            n.arrancar(log)
            datos["config_inicial"] = n.m.chrome(JS_CONFIG, PREFS_CONFIG)
            datos["etp_antes"] = n.m.chrome(JS_TABLAS_ETP, asincrono=True, espera=60)
            datos["escudos_antes"] = n.m.chrome(JS_ESCUDOS_ESTADO, asincrono=True, espera=300)
            t0 = time.monotonic()
            datos["aceptado_a_las"] = datetime.datetime.now().isoformat(timespec="seconds")
            datos["grupos_activos"] = n.m.chrome(JS_ACEPTAR, ELECCION)
            reg(f"  conexiones aceptadas ({', '.join(datos['grupos_activos'])}); esperando las listas")

            # ETP: las tablas del clasificador, por Remote Settings.
            etp = None
            while time.monotonic() - t0 < a.espera_etp:
                etp = n.m.chrome(JS_TABLAS_ETP, asincrono=True, espera=60)
                if all(t in etp.get("tablas", []) for t in TABLAS_ETP):
                    break
                time.sleep(2)
            datos["etp"] = etp
            datos["etp_faltan"] = [t for t in TABLAS_ETP if t not in (etp or {}).get("tablas", [])]
            datos["etp_segundos"] = None if datos["etp_faltan"] else round(time.monotonic() - t0, 1)
            reg(f"  listas de ETP: {'listas en %s s' % datos['etp_segundos'] if datos['etp_segundos'] is not None else 'NO llegaron; faltan ' + ', '.join(datos['etp_faltan'])}"
                f" ({len((etp or {}).get('tablas', []))} tablas)")
            datos["clasificador"] = n.m.chrome(JS_CLASIFICAR, URLS_RASTREO, asincrono=True, espera=60)

            # Escudos: la revisión diaria (temporizador compartido; con un perfil nuevo salta a los pocos minutos).
            registro = None
            while time.monotonic() - t0 < a.espera_escudos:
                registro = n.m.chrome(JS_ESCUDOS_REGISTRO, asincrono=True, espera=30)
                if registro:
                    break
                time.sleep(3)
            datos["escudos_revision_sola"] = registro
            datos["escudos_revision_sola_segundos"] = round(time.monotonic() - t0, 1) if registro else None
            reg(f"  Escudos, revisión sola: {'en %s s' % datos['escudos_revision_sola_segundos'] if registro else 'no saltó en %d s' % a.espera_escudos}")
            # «Actualizar ahora»: todas las listas activas desde sus autores, para medir con todo al día.
            t1 = time.monotonic()
            datos["escudos_actualizar_ahora"] = n.m.chrome(JS_ESCUDOS_ACTUALIZAR, asincrono=True, espera=600)
            datos["escudos_actualizar_ahora_segundos"] = round(time.monotonic() - t1, 1)
            datos["escudos_despues"] = n.m.chrome(JS_ESCUDOS_ESTADO, asincrono=True, espera=300)
            r = datos["escudos_actualizar_ahora"] or {}
            reg(f"  Escudos, «Actualizar ahora»: {datos['escudos_actualizar_ahora_segundos']} s; "
                f"nuevas {len(r.get('nuevas', []))}, iguales {len(r.get('iguales', []))}, fallos {len(r.get('fallos', {}))}")
            datos["config_final"] = n.m.chrome(JS_CONFIG, PREFS_CONFIG)
        finally:
            cerrar(n)
    escribir_json(os.path.join(salida, "preparacion.json"), datos)
    return datos


# ── Un modo ──────────────────────────────────────────────────────────────────────────────────────────────────────

def poner_modo(a, exe, perfil, modo, carpeta, reg):
    puerto = puerto_libre()
    escribir_user_js(perfil, prefs_perfil(puerto))
    prefs = PREFS_FIREFOX if modo["firefox"] else {}
    with open(os.path.join(carpeta, "aegis-configurar.log"), "w", encoding="utf-8", errors="replace") as log:
        n = NavegadorReal(exe, perfil, puerto, sin_ventana=a.sin_ventana)
        try:
            n.arrancar(log)
            r = n.m.chrome(JS_PONER_MODO, {"escudos": modo["escudos"], "huella": modo["huella"]}, prefs,
                           asincrono=True, espera=600)
            if r.get("error"):
                raise RuntimeError(f"no se pudo poner el modo: {r['error']}")
        finally:
            cerrar(n)


def visitar(n, web, carpeta, mia, reg):
    """Una web en el modo actual: espera su resultado y lo guarda todo en `carpeta`."""
    os.makedirs(carpeta)
    d = {"web": web["id"], "url_pedida": web["url"], "inicio": datetime.datetime.now().isoformat(timespec="seconds"),
         "errores": []}
    t0 = time.monotonic()
    try:
        d["pestanas_cerradas_antes"] = n.cerrar_otras(mia)
    except Exception as e:  # noqa: BLE001
        d["errores"].append(f"cerrar pestañas: {e}")

    try:
        n.m.ir(web["url"])
    except ErrorMarionette as e:
        d["errores"].append(f"navegar: {e}")
    d["carga_s"] = round(time.monotonic() - t0, 1)

    if web.get("accion"):
        try:
            n.esperar(lambda: n.m.contenido("return !!document.querySelector(arguments[0]);", web["accion"]), 30,
                      web["accion"])
            n.m.clic(web["accion"])
            d["accion"] = f"clic en {web['accion']}"
        except Exception as e:  # noqa: BLE001
            d["errores"].append(f"acción {web['accion']}: {e}")

    # Esperar al resultado.
    t1 = time.monotonic()
    d["listo"] = False
    if web.get("listo"):
        while time.monotonic() - t1 < web["espera"]:
            try:
                if n.m.contenido(web["listo"]):
                    d["listo"] = True
                    break
            except (ErrorMarionette, ConnectionError):
                pass
            time.sleep(1)
        if not d["listo"]:
            d["errores"].append(f"sin resultado en {web['espera']} s (se guarda lo que haya)")
    else:
        time.sleep(web["espera"])
        d["listo"] = True
    d["espera_s"] = round(time.monotonic() - t1, 1)
    time.sleep(web.get("reposo", 2))

    # Por si la web ha abierto otras pestañas (anuncios): volver a la nuestra.
    try:
        d["pestanas_cerradas_despues"] = n.cerrar_otras(mia)
    except Exception as e:  # noqa: BLE001
        d["errores"].append(f"cerrar pestañas: {e}")

    # Datos del DOM.
    try:
        comunes = n.m.contenido(JS_COMUNES)
        escribir_texto(os.path.join(carpeta, "texto.txt"), comunes.pop("texto"))
        escribir_texto(os.path.join(carpeta, "pagina.html"), comunes.pop("html"))
        escribir_json(os.path.join(carpeta, "recursos.json"), comunes.pop("recursos"))
        d.update(comunes)
    except Exception as e:  # noqa: BLE001
        d["errores"].append(f"datos comunes: {e}")
    if web.get("extractor"):
        try:
            d["extra"] = n.m.contenido(web["extractor"])
        except Exception as e:  # noqa: BLE001
            d["errores"].append(f"extractor: {e}")

    # Lo que marcan los Escudos y el registro de ETP de esta página.
    try:
        d["escudos_contador"] = n.contador(pausa=0.3, maximo=2.0)
        d["escudos_panel"] = n.leer_panel(desglose=True)
    except Exception as e:  # noqa: BLE001
        d["errores"].append(f"panel de Escudos: {e}")
    finally:
        try:
            n.cerrar_panel()
        except Exception:  # noqa: BLE001
            pass
    try:
        crudo = n.m.chrome(JS_LOG_ETP, asincrono=True, espera=30)
        log = json.loads(crudo) if crudo else {}
        escribir_json(os.path.join(carpeta, "etp.json"), log)
        d["etp"] = resumir_etp(log)
    except Exception as e:  # noqa: BLE001
        d["errores"].append(f"registro de ETP: {e}")

    # Captura de la vista, de la página entera y PDF (todo del contenido, por WebDriver).
    n.m._contexto("content")
    for nombre, params in (("captura.png", {"full": False, "hash": False, "scroll": False}),
                           ("captura-completa.png", {"full": True, "hash": False, "scroll": False})):
        try:
            r = n.m.orden("WebDriver:TakeScreenshot", params)
            escribir_b64(os.path.join(carpeta, nombre), r.get("value", r) if isinstance(r, dict) else r)
        except Exception as e:  # noqa: BLE001
            d["errores"].append(f"{nombre}: {e}")
    try:
        r = n.m.orden("WebDriver:Print", {"orientation": "portrait", "scale": 1, "background": True,
                                         "page": {"width": 21.0, "height": 29.7},
                                         "margin": {"top": 1, "bottom": 1, "left": 1, "right": 1},
                                         "shrinkToFit": True})
        escribir_b64(os.path.join(carpeta, "pagina.pdf"), r.get("value", r) if isinstance(r, dict) else r)
    except Exception as e:  # noqa: BLE001
        d["errores"].append(f"pagina.pdf: {e}")

    d["segundos"] = round(time.monotonic() - t0, 1)
    d["metricas"], d["enlace_resultado"] = metricas(web["id"], d, carpeta)
    escribir_json(os.path.join(carpeta, "datos.json"), d)
    return d


def medir_modo(a, exe, base, nombre, raiz, tmp, reg):
    modo = leer_modo(nombre)
    carpeta = os.path.join(raiz, nombre)
    os.makedirs(carpeta)
    reg(f"\n== {nombre}: {modo['titulo']}")
    perfil = os.path.join(tmp, nombre)
    copiar_perfil(base, perfil)
    t0 = time.monotonic()
    poner_modo(a, exe, perfil, modo, carpeta, reg)
    puerto = puerto_libre()
    escribir_user_js(perfil, prefs_perfil(puerto))
    resultado = {"modo": modo, "webs": {}}
    with open(os.path.join(carpeta, "aegis.log"), "w", encoding="utf-8", errors="replace") as log:
        n = NavegadorReal(exe, perfil, puerto, sin_ventana=a.sin_ventana)
        try:
            n.arrancar(log)
            resultado["config"] = n.m.chrome(JS_CONFIG, PREFS_CONFIG)
            resultado["escudos"] = n.m.chrome(JS_ESCUDOS_ESTADO, asincrono=True, espera=300)
            if not a.sin_ventana:
                try:
                    n.m._contexto("chrome")
                    n.m.orden("WebDriver:MaximizeWindow")
                except ErrorMarionette as e:
                    reg(f"  no se pudo maximizar: {e}")
            mia = n.pestana()
            cfg = resultado["config"]["prefs"]
            reg(f"  config: ETP {cfg['browser.contentblocking.category']}, estricto_mas {cfg['aegis.escudos.estricto_mas']}, "
                f"motor {cfg['aegis.escudos.motor']}, huella {cfg['aegis.huella.nivel']}, FPP {cfg['privacy.fingerprintingProtection']}")
            for web in a.webs:
                try:
                    d = visitar(n, WEB[web], os.path.join(carpeta, web), mia, reg)
                    resultado["webs"][web] = {"metricas": d["metricas"], "errores": d["errores"],
                                              "enlace_resultado": d["enlace_resultado"], "segundos": d["segundos"]}
                    estado = "ok" if not d["errores"] else "; ".join(d["errores"])
                    reg(f"  {web}: {d['segundos']} s · {estado}")
                    for k, v in d["metricas"].items():
                        reg(f"      {k}: {v}")
                except Exception as e:  # noqa: BLE001
                    reg(f"  {web}: FALLO {e}")
                    resultado["webs"][web] = {"metricas": {}, "errores": [f"fallo: {e}"], "enlace_resultado": None}
                    traceback.print_exc()
                    if n.proceso.poll() is not None:
                        raise RuntimeError("el navegador se ha cerrado") from e
        except Exception as e:  # noqa: BLE001
            resultado["fallo"] = f"{type(e).__name__}: {e}"
            reg(f"  modo {nombre}: FALLO {resultado['fallo']}")
        finally:
            cerrar(n)
            # Lo medido hasta aquí se guarda siempre (también si el modo se ha cortado a medias).
            resultado["segundos"] = round(time.monotonic() - t0, 1)
            escribir_json(os.path.join(carpeta, "modo.json"), resultado)
    return resultado


# ── Métricas de cada web (del texto y del DOM guardados) ─────────────────────────────────────────────────────────

def buscar(patron, texto, grupo=1, flags=0):
    m = re.search(patron, texto or "", flags)
    return m.group(grupo).strip() if m else None


def resumir_etp(log):
    """Orígenes de la página según ETP: con contenido bloqueado, rastreadores que sí cargaron y cookies, por categoría."""
    cuenta = {k: 0 for k in BITS_ETP}
    bloqueados = []
    for origen, entradas in (log or {}).items():
        estados = 0
        for e in entradas:
            estados |= int(e[0]) & 0xFFFFFFFF
        for k, bit in BITS_ETP.items():
            if estados & bit:
                cuenta[k] += 1
        if estados & BLOQUEO_ETP:
            bloqueados.append(origen)
    return {"origenes_bloqueados": len(bloqueados), "lista": bloqueados, "por_categoria": cuenta}


def leer_texto(carpeta):
    try:
        with open(os.path.join(carpeta, "texto.txt"), encoding="utf-8") as f:
            return f.read()
    except OSError:
        return ""


def metricas_cyt(t):
    m = {
        "Veredicto": buscar(r"Our tests indicate that you have ([^.\n]+)", t),
        "Anuncios de rastreo bloqueados": buscar(r"Blocking tracking ads\?\s*([^\n]+)", t),
        "Rastreadores invisibles bloqueados": buscar(r"Blocking invisible trackers\?\s*([^\n]+)", t),
        "Huella": buscar(r"Protecting you from fingerprinting\?\s*([^\n]+)", t),
        # Dos redacciones: «appears to be unique among the N tested…» o «only one in N browsers have the same…».
        "Unicidad": buscar(r"(appears to be unique among the [\d,.]+ tested[^\n.]*|only one in [\d,.]+ browsers have the same fingerprint as yours)", t),
        "Bits de información": buscar(r"conveys (?:at least )?([\d.]+) bits", t),
    }
    return m


def detalle_cyt(t):
    """Cada característica: valor, bits y «uno de cada x»."""
    partes = t.split("WHAT IS THIS?")
    out = []
    for i in range(len(partes) - 1):
        lineas = [l.strip() for l in partes[i].strip().split("\n") if l.strip()]
        bits = buscar(r"Bits of identifying information: ([\d.]+)", partes[i + 1])
        uno = buscar(r"One in x browsers have this value: ([\d.,]+)", partes[i + 1])
        # La cabecera: la última línea en mayúsculas antes del valor.
        cab = None
        for j in range(len(lineas) - 1, -1, -1):
            if lineas[j].isupper() and len(lineas[j]) < 60 and lineas[j] not in ("DEFAULT VIEW", "DETAILED VIEW"):
                cab = j
                break
        if cab is None:
            continue
        out.append({"caracteristica": lineas[cab], "valor": " ".join(lineas[cab + 1:])[:2000], "bits": bits,
                    "uno_de_cada": uno})
    return out


def metricas_creepjs(d, t):
    f = (d.get("extra") or {}).get("fingerprint") or {}
    lies = f.get("lies") or {}
    trash = (f.get("trash") or {}).get("trashBin") or []
    errores = (f.get("capturedErrors") or {}).get("data") or []
    hl = f.get("headless") or {}
    datos_lies = lies.get("data") or {}
    m = {
        "FP ID": (buscar(r"FP ID: (\w+)", t) or "")[:16] or None,
        "Mentiras (lies)": f"{lies.get('totalLies', '?')}" + (f": {', '.join(sorted(datos_lies))}" if datos_lies else ""),
        "Basura (trash)": f"{len(trash)}" + (f": {'; '.join(sorted({x.get('name', '') + ' → ' + str(x.get('value', '')) for x in trash}))}" if trash else ""),
        "Errores": len(errores),
        "Headless (%)": hl.get("headlessRating"),
        "Parece headless (%)": hl.get("likeHeadlessRating"),
        "Sigilo/stealth (%)": hl.get("stealthRating"),
        "Señales headless": ", ".join(k for k, v in (hl.get("headless") or {}).items() if v) or "ninguna",
        "Resistencia": ", ".join(f"{k}: {v}" for k, v in (f.get("resistance") or {}).items()
                                 if not k.startswith("$") and v not in (None, {}, "")) or None,
    }
    return m


def metricas_cybi(d):
    ex = d.get("extra") or {}
    bloques = ex.get("bloques") or []
    iframes = ex.get("iframes") or []
    con = [b for b in bloques if b.get("visibles") or (b.get("alto") or 0) > 30]
    return {
        "Huecos de anuncio con algo dentro": f"{len(con)} de {len(bloques)}",
        "iframes visibles": sum(1 for f in iframes if f.get("visible")),
        "AdSense (estado de cada hueco)": ", ".join(str(x) for x in d.get("adsense") or []) or "sin huecos",
    }


def metricas_adblock_tester(t):
    puntos = buscar(r"(\d+) points out of 100", t)
    # Servicio → comprobaciones fallidas.
    fallos = []
    servicio = None
    lineas = [l.strip() for l in t.split("\n")]
    for i, l in enumerate(lineas):
        if i + 1 < len(lineas) and lineas[i + 1] == "close" and l and l not in ("medium", "low", "high"):
            servicio = l
        if ("failed" in l or "❌" in l) and ":" in l:
            fallos.append(f"{servicio}: {l.split(':')[0]}")
    return {"Puntos (de 100)": puntos, "Comprobaciones fallidas": "; ".join(fallos) or "ninguna"}


def metricas_bl_canvas(t):
    return {"Firma": buscar(r"Signature\s+([0-9A-F]{32})", t), "Unicidad": buscar(r"Uniqueness\s+([^\n]+)", t)}


def metricas_bl_webgl(t):
    return {
        "Hash del informe": buscar(r"WebGL Report Hash\s+([0-9A-F]{32})", t),
        "Hash de la imagen": buscar(r"WebGL Image Hash\s+([0-9A-F]{32})", t),
        "Fabricante (unmasked)": buscar(r"Unmasked Vendor\s+(?:!\s+)?([^\n]+)", t),
        "Modelo (unmasked)": buscar(r"Unmasked Renderer\s+(?:!\s+)?([^\n]+)", t),
        "Tamaño máx. de textura": buscar(r"Max Texture Size\s+(\d+)", t),
    }


def metricas_bl_fonts(t):
    return {"Huella de métricas": buscar(r"Font Metrics\s+Fingerprint\s+(?:✔\s+)?([0-9A-F]{32})", t),
            "Fuentes": buscar(r"Report\s+(\d+ fonts and \d+ unique metrics)", t),
            "Glifos Unicode": buscar(r"Unicode Glyphs\s+Fingerprint\s+(?:✔\s+)?([0-9A-F]+)", t)}


def clave_valor(t):
    out = {}
    for l in t.split("\n"):
        if "\t" in l:
            k, _, v = l.partition("\t")
            if k.strip() and v.strip():
                out.setdefault(k.strip(), v.strip())
    return out


def metricas_bl_js(t):
    kv = clave_valor(t)
    return {
        "Pantalla": kv.get("Screen Resolution") or buscar(r"Screen Resolution\s+([^\n]+)", t),
        "Zona horaria": kv.get("timeZone"), "Idiomas": kv.get("languages"),
        "Núcleos": kv.get("hardwareConcurrency"), "webdriver": kv.get("webdriver"), "GPC": kv.get("globalPrivacyControl"),
        "Voces": len(re.findall(r"urn:moz-tts", t)),
    }


def metricas_wimb(t):
    return {
        # Sin bloqueador, la web mete enlaces de anuncios en su propio texto («YOUR  web browser IS»): sin mayúsculas fijas.
        "Navegador detectado": buscar(r"YOUR\s+WEB\s+BROWSER\s+IS:\s*\n([^\n]+)", t, flags=re.I),
        "Cookies de terceros": buscar(r"Are Third-Party Cookies enabled\?\s*\n([^\n]+)", t),
        "Pantalla": buscar(r"COMPUTER SCREEN\s*\n.*?\n\s*\n([^\n]+)", t, flags=re.S),
        "Ventana": buscar(r"BROWSER WINDOW SIZE\s*\n.*?\n\s*\n([^\n]+)", t, flags=re.S),
        "IP local": buscar(r"LOCAL IP ADDRESS\s*\n.*?\n\s*\n([^\n]+)", t, flags=re.S),
        "Complementos detectados": " ".join((buscar(r"We have detected these extra addons\.\s*\n(.*?)\n\s*USING TOR", t + "\n",
                                                    flags=re.S) or "").split()) or "ninguno",
    }


def detalle_amiunique(t):
    out = []
    for m in re.finditer(r"\n(\d+) - ([^\n]+?)\s*\n[\s\n]*?([\d.]+ %)", t):
        out.append({"n": int(m.group(1)), "atributo": m.group(2).strip(), "similitud": m.group(3)})
    return out


def metricas_amiunique(t):
    det = detalle_amiunique(t)
    raros = [x for x in det if float(x["similitud"].split()[0]) < 1.0]
    return {
        "¿Única?": buscar(r"((?:Yes! )?You are (?:not )?unique[^\n]*)", t),
        "Atributos con menos del 1 % de similitud": f"{len(raros)} de {len(det)}" + (
            f": {', '.join(x['atributo'] for x in raros[:12])}" if raros else ""),
    }


def metricas(web, d, carpeta):
    """Las métricas clave para la tabla y el enlace al resultado (si la web lo da)."""
    t = leer_texto(carpeta)
    enlace = None
    if web == "d3ward":
        m = {"Estado": "archivada: la página ya no tiene la prueba" if "no longer maintained" in t
             else buscar(r"(\d+\s*%)", t)}
    elif web == "coveryourtracks":
        m = metricas_cyt(t)
        d["caracteristicas"] = detalle_cyt(t)
        if "/results" in (d.get("url") or ""):
            enlace = d["url"]
    elif web == "creepjs":
        m = metricas_creepjs(d, t)
    elif web == "canyoublockit":
        m = metricas_cybi(d)
    elif web == "adblock-tester":
        m = metricas_adblock_tester(t)
    elif web == "browserleaks-canvas":
        m = metricas_bl_canvas(t)
    elif web == "browserleaks-webgl":
        m = metricas_bl_webgl(t)
    elif web == "browserleaks-fonts":
        m = metricas_bl_fonts(t)
    elif web == "browserleaks-javascript":
        m = metricas_bl_js(t)
        d["navegador"] = clave_valor(t)
    elif web == "whatismybrowser":
        m = metricas_wimb(t)
        u = buscar(r"unique URL:\s*\n\s*(whatismybrowser\.com/w/\w+)", t)
        enlace = f"https://{u}" if u else None
    elif web == "amiunique":
        m = metricas_amiunique(t)
        d["atributos"] = detalle_amiunique(t)
    else:
        m = {}
    panel = d.get("escudos_panel") or {}
    if panel:
        m["Escudos: contador"] = panel.get("numero")
        secciones = panel.get("secciones") or {}
        m["Escudos: orígenes por categoría"] = ", ".join(f"{k} {len(v)}" for k, v in secciones.items() if v) or "ninguno"
    # El resumen de ETP se rehace del registro guardado (así un resumen viejo se corrige al regenerarlo).
    try:
        with open(os.path.join(carpeta, "etp.json"), encoding="utf-8") as f:
            d["etp"] = resumir_etp(json.load(f))
    except (OSError, ValueError):
        pass
    if d.get("etp"):
        m["ETP: orígenes bloqueados"] = d["etp"].get("origenes_bloqueados")
        m["ETP: rastreadores que cargaron"] = d["etp"].get("por_categoria", {}).get("rastreador_cargado")
    if not d.get("listo"):
        m["Aviso"] = "la web no llegó a dar su resultado a tiempo"
    return m, enlace


# ── Resumen ──────────────────────────────────────────────────────────────────────────────────────────────────────

def cargar_resultados(raiz):
    """Lee lo guardado (sirve también para rehacer el resumen más tarde) y recalcula las métricas del texto."""
    modos = []
    for nombre in sorted(os.listdir(raiz), key=lambda x: (MODOS_SERIE.index(x) if x in MODOS_SERIE else 99, x)):
        carpeta = os.path.join(raiz, nombre)
        if not os.path.isfile(os.path.join(carpeta, "modo.json")):
            continue
        with open(os.path.join(carpeta, "modo.json"), encoding="utf-8") as f:
            r = json.load(f)
        for web in list(r["webs"]):
            ruta = os.path.join(carpeta, web, "datos.json")
            if os.path.isfile(ruta):
                with open(ruta, encoding="utf-8") as f:
                    d = json.load(f)
                d["metricas"], d["enlace_resultado"] = metricas(web, d, os.path.join(carpeta, web))
                r["webs"][web].update({"metricas": d["metricas"], "enlace_resultado": d["enlace_resultado"]})
        modos.append(r)
    return modos


def escribir_resumen(raiz, prep=None):
    modos = cargar_resultados(raiz)
    if prep is None and os.path.isfile(os.path.join(raiz, "preparacion.json")):
        with open(os.path.join(raiz, "preparacion.json"), encoding="utf-8") as f:
            prep = json.load(f)
    webs = [w["id"] for w in WEBS if any(w["id"] in r["webs"] for r in modos)]
    nombres = [r["modo"]["nombre"] for r in modos]

    def celda(r, web, k):
        v = (r["webs"].get(web) or {}).get("metricas", {}).get(k)
        return "—" if v in (None, "") else str(v)

    filas = []
    for web in webs:
        claves = []
        for r in modos:
            for k in (r["webs"].get(web) or {}).get("metricas", {}):
                if k not in claves:
                    claves.append(k)
        for k in claves:
            filas.append((web, k, [celda(r, web, k) for r in modos]))

    # Markdown
    md = [f"# Pruebas con webs reales · {os.path.basename(raiz)}", ""]
    if modos:
        c = modos[0].get("config") or {}
        md.append(f"Aegis {c.get('version')}" + (f" (build {c['buildID']})" if c.get('buildID') else "") + f", interfaz {c.get('locale')}. "
                  "Capturas y PDF sacados del contenido con WebDriver. Marionette deja `navigator.webdriver = true`.")
        md.append("")
    md += texto_preparacion(prep)
    md += ["## Modos", ""]
    for r in modos:
        md.append(f"- `{r['modo']['nombre']}`: {r['modo']['titulo']}")
    md += ["", "## Tabla", "", "| Web | Métrica | " + " | ".join(f"`{n}`" for n in nombres) + " |",
           "|---|---|" + "---|" * len(nombres)]
    for web, k, vals in filas:
        md.append(f"| {WEB[web]['titulo']} | {k} | " + " | ".join(v.replace("|", "/").replace("\n", " ") for v in vals) + " |")
    md += ["", "## Archivos", ""]
    for web in webs:
        md.append(f"### {WEB[web]['titulo']}")
        for r in modos:
            n = r["modo"]["nombre"]
            w = r["webs"].get(web) or {}
            base = f"{n}/{web}"
            enl = [f"[captura]({base}/captura.png)", f"[página entera]({base}/captura-completa.png)",
                   f"[PDF]({base}/pagina.pdf)", f"[datos]({base}/datos.json)"]
            if w.get("enlace_resultado"):
                enl.append(f"[resultado en la web]({w['enlace_resultado']})")
            err = f" · errores: {'; '.join(w.get('errores', []))}" if w.get("errores") else ""
            md.append(f"- `{n}`: " + " · ".join(enl) + err)
        md.append("")
    escribir_texto(os.path.join(raiz, "resumen.md"), "\n".join(md) + "\n")

    # HTML
    e = html.escape
    h = ["<!doctype html><html lang='es'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>",
         f"<title>Pruebas reales {e(os.path.basename(raiz))}</title><style>",
         ":root{--fondo:#fff;--texto:#111;--suave:#666;--borde:#ddd;--celda:#f6f6f6}",
         "@media (prefers-color-scheme:dark){:root{--fondo:#111;--texto:#eee;--suave:#999;--borde:#333;--celda:#1a1a1a}}",
         "body{font:14px/1.45 Inter,system-ui,sans-serif;background:var(--fondo);color:var(--texto);margin:24px}",
         "table{border-collapse:collapse;margin:12px 0}th,td{border:1px solid var(--borde);padding:6px 8px;vertical-align:top;text-align:left}",
         "th{background:var(--celda);position:sticky;top:0}td.web{font-weight:600}td small{color:var(--suave)}",
         "img{width:220px;border:1px solid var(--borde);display:block;margin-bottom:4px}a{color:inherit}",
         ".err{color:#b00}.ancha{overflow-x:auto}</style></head><body>",
         f"<h1>Pruebas con webs reales · {e(os.path.basename(raiz))}</h1>"]
    if modos:
        c = modos[0].get("config") or {}
        h.append(f"<p>Aegis {e(str(c.get('version')))}" + (f" (build {e(str(c['buildID']))})" if c.get('buildID') else "") + f", interfaz {e(str(c.get('locale')))}. "
                 "Capturas y PDF sacados del contenido con WebDriver (nunca de la pantalla). Marionette deja "
                 "<code>navigator.webdriver = true</code>.</p>")
    for l in texto_preparacion(prep):
        if l.startswith("## "):
            h.append(f"<h2>{e(l[3:])}</h2>")
        elif l.startswith("- "):
            h.append(f"<p>• {e(l[2:])}</p>")
        elif l:
            h.append(f"<p>{e(l)}</p>")
    h.append("<h2>Tabla</h2><div class='ancha'><table><tr><th>Web</th><th>Métrica</th>" +
             "".join(f"<th>{e(r['modo']['titulo'])}<br><small>{e(r['modo']['nombre'])}</small></th>" for r in modos) + "</tr>")
    ultima = None
    for web, k, vals in filas:
        h.append("<tr>" + (f"<td class='web'>{e(WEB[web]['titulo'])}</td>" if web != ultima else "<td></td>") +
                 f"<td>{e(k)}</td>" + "".join(f"<td>{e(v)}</td>" for v in vals) + "</tr>")
        ultima = web
    h.append("</table></div><h2>Capturas</h2><div class='ancha'><table><tr><th>Web</th>" +
             "".join(f"<th>{e(r['modo']['nombre'])}</th>" for r in modos) + "</tr>")
    for web in webs:
        h.append(f"<tr><td class='web'>{e(WEB[web]['titulo'])}<br><small><a href='{e(WEB[web]['url'])}'>{e(WEB[web]['url'])}</a></small></td>")
        for r in modos:
            n = r["modo"]["nombre"]
            w = r["webs"].get(web)
            if not w:
                h.append("<td>—</td>")
                continue
            base = f"{n}/{web}"
            enl = [f"<a href='{base}/captura-completa.png'>página entera</a>", f"<a href='{base}/pagina.pdf'>PDF</a>",
                   f"<a href='{base}/datos.json'>datos</a>", f"<a href='{base}/texto.txt'>texto</a>"]
            if w.get("enlace_resultado"):
                enl.append(f"<a href='{e(w['enlace_resultado'])}'>resultado</a>")
            err = f"<div class='err'>{e('; '.join(w['errores']))}</div>" if w.get("errores") else ""
            h.append(f"<td><a href='{base}/captura.png'><img loading='lazy' src='{base}/captura.png' alt='{e(web)} · {e(n)}'></a>"
                     + " · ".join(enl) + err + "</td>")
        h.append("</tr>")
    h.append("</table></div></body></html>")
    escribir_texto(os.path.join(raiz, "resumen.html"), "\n".join(h) + "\n")


def texto_preparacion(prep):
    if not prep:
        return []
    l = ["## Perfil base: conexiones y listas", ""]
    l.append(f"- Elección en about:conexiones: {', '.join(k for k, v in prep.get('eleccion', {}).items() if v)} "
             f"(apagado: {', '.join(k for k, v in prep.get('eleccion', {}).items() if not v)}).")
    if prep.get("etp_segundos") is not None:
        l.append(f"- Listas de ETP (Remote Settings) listas en {prep['etp_segundos']} s desde «Aceptar» "
                 f"({len((prep.get('etp') or {}).get('tablas', []))} tablas).")
    else:
        l.append(f"- Listas de ETP: NO llegaron a tiempo; faltan {', '.join(prep.get('etp_faltan') or [])}.")
    cls = prep.get("clasificador") or {}
    if cls:
        l.append("- Clasificador con las listas: " + "; ".join(
            f"{u.split('/')[2]} → {', '.join(sorted({x[0] for x in v})) if isinstance(v, list) and v else 'sin coincidencia'}"
            for u, v in cls.items()))
    if prep.get("escudos_revision_sola_segundos") is not None:
        revisadas = len(((prep.get("escudos_revision_sola") or {}).get("listas")) or {})
        l.append(f"- Escudos: la revisión diaria saltó sola a los {prep['escudos_revision_sola_segundos']} s y pidió "
                 f"{revisadas} listas" + (" (ninguna había caducado: cuenta la fecha de la instantánea de la build)"
                                          if not revisadas else "") + ".")
    else:
        l.append("- Escudos: la revisión diaria no saltó sola en la espera.")
    r = prep.get("escudos_actualizar_ahora") or {}
    l.append(f"- Escudos, «Actualizar ahora» (todas las listas desde sus autores): {prep.get('escudos_actualizar_ahora_segundos')} s; "
             f"{len(r.get('nuevas', []))} nuevas, {len(r.get('iguales', []))} iguales a la instantánea de la build, "
             f"{len(r.get('fallos', {}))} fallos" + (f" ({', '.join(f'{k}: {v}' for k, v in r['fallos'].items())})" if r.get('fallos') else "") + ".")
    l.append("")
    return l


# ── Principal ────────────────────────────────────────────────────────────────────────────────────────────────────

def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    p = argparse.ArgumentParser(description="Pruebas de Aegis con webs públicas reales (Escudos y huella).")
    p.add_argument("--exe", help="ejecutable de Aegis (de serie, la copia de desarrollo o el instalado)")
    p.add_argument("--modos", default=",".join(MODOS_SERIE), help=f"modos separados por comas (de serie: {','.join(MODOS_SERIE)})")
    p.add_argument("--webs", default=",".join(WEB), help=f"webs separadas por comas ({','.join(WEB)})")
    p.add_argument("--salida", help="carpeta de resultados (de serie, out/pruebas-reales/<AAAA-MM-DD_HHMM>); no debe existir")
    p.add_argument("--perfil-base", help="usar este perfil base ya preparado (se copia, no se toca)")
    p.add_argument("--espera-etp", type=int, default=600, help="segundos como mucho para las listas de ETP (600)")
    p.add_argument("--espera-escudos", type=int, default=420, help="segundos como mucho para la revisión sola de los Escudos (420)")
    p.add_argument("--sin-ventana", action="store_true", help="headless (la huella no es la de una ventana real)")
    p.add_argument("--mantener", action="store_true", help="no borrar los perfiles temporales")
    p.add_argument("--resumen", help="solo rehacer resumen.md y resumen.html de una carpeta de resultados")
    a = p.parse_args()

    if a.resumen:
        escribir_resumen(a.resumen)
        print(f"Resumen: {os.path.join(a.resumen, 'resumen.html')}")
        return 0

    a.webs = [w.strip() for w in a.webs.split(",") if w.strip()]
    for w in a.webs:
        if w not in WEB:
            raise SystemExit(f"Web desconocida: {w} ({', '.join(WEB)})")
    modos = [m.strip() for m in a.modos.split(",") if m.strip()]
    for m in modos:
        leer_modo(m)
    exe = a.exe or (COPIA_DESARROLLO if os.path.isfile(COPIA_DESARROLLO) else buscar_instalada())
    if not os.path.isfile(exe):
        raise SystemExit(f"No existe {exe}")

    raiz = a.salida or os.path.join(SALIDA, f"{datetime.datetime.now():%Y-%m-%d_%H%M}")
    if os.path.exists(raiz):
        raise SystemExit(f"{raiz} ya existe: no se pisan resultados. Elige otra con --salida.")
    os.makedirs(raiz)
    reg = Registro(os.path.join(raiz, "ejecucion.log"))
    reg(f"Pruebas reales · {exe}")
    reg(f"Resultados en {raiz}")
    tmp = tempfile.mkdtemp(prefix="aegis-reales-")
    prep = None
    try:
        if a.perfil_base:
            base = a.perfil_base
            reg(f"Perfil base: {base} (ya preparado)")
            if os.path.isfile(os.path.join(base, "..", "preparacion.json")):
                with open(os.path.join(base, "..", "preparacion.json"), encoding="utf-8") as f:
                    prep = json.load(f)
                escribir_json(os.path.join(raiz, "preparacion.json"), prep)
        else:
            base = os.path.join(tmp, "base")
            reg("Perfil base: perfil nuevo, conexiones aceptadas")
            prep = preparar_base(a, exe, base, raiz, reg)
        resultados = []
        for m in modos:
            try:
                resultados.append(medir_modo(a, exe, base, m, raiz, tmp, reg))
            except Exception as e:  # noqa: BLE001
                reg(f"  modo {m}: FALLO {e}")
                traceback.print_exc()
            escribir_resumen(raiz, prep)
        escribir_resumen(raiz, prep)
        reg(f"\nResumen: {os.path.join(raiz, 'resumen.html')}")
    finally:
        if a.mantener:
            reg(f"Perfiles en {tmp}")
        else:
            shutil.rmtree(tmp, ignore_errors=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
