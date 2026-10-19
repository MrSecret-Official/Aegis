#!/usr/bin/env python3
"""Banco de Aegis Setup de extremo a extremo, en Windows (docs/INSTALADOR.md).

    python tools/pruebas/instalador.py instalar    [--setup <exe>]    copia el Setup e instala desatendido
    python tools/pruebas/instalador.py navegador                       perfiles de prueba: ¿se aplican las elecciones?
    python tools/pruebas/instalador.py desinstalar                     desinstala como «Aplicaciones instaladas»
    python tools/pruebas/instalador.py estado                          registro y accesos de Aegis del usuario

Todo va en carpetas fuera de la temporal (en el Control inteligente de aplicaciones, Windows no deja abrir ahí un
ejecutable sin firmar): el Setup se copia a %USERPROFILE%\\Aegis-instalador-prueba\\ e instala en su carpeta
«instalado\\Aegis». Los perfiles de prueba van en «perfiles\\» de esa misma carpeta, con un proxy cerrado para que
nada salga del equipo. Los resultados (JSON y capturas de Marionette) van a out/pruebas/<fecha>-instalador/.

Ojo: la instalación escribe en el registro (HKCU) y en el menú Inicio del usuario real; «desinstalar» lo quita y
«estado» comprueba que no queda nada. Solo se terminan procesos lanzados por este banco, por su PID.
"""
import argparse
import base64
import datetime
import json
import os
import shutil
import subprocess
import sys
import time
import winreg

AQUI = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(AQUI))
sys.path.insert(0, AQUI)
from marionette import ErrorMarionette, Marionette  # noqa: E402

PRUEBA = os.path.join(os.path.expanduser("~"), "Aegis-instalador-prueba")
SETUP = os.path.join(PRUEBA, "Aegis Setup.exe")
INSTALADO = os.path.join(PRUEBA, "instalado", "Aegis")
PERFILES = os.path.join(PRUEBA, "perfiles")
SETUP_REPO = os.path.join(REPO, "packaging", "instalador", "dist", "Aegis Setup.exe")
SALIDA = os.path.join(REPO, "out", "pruebas", f"{datetime.date.today().isoformat()}-instalador")
# Registros y capturas de los navegadores de una pasada de «navegador» (una carpeta por pasada).
CORRIDA = os.path.join(SALIDA, f"navegador-{datetime.datetime.now():%H%M%S}")
JSON_ELECCIONES = os.path.join(INSTALADO, "distribution", "aegis-instalador.json")

CLAVES = [
    r"Software\Clients\StartMenuInternet\Aegis",
    r"Software\Classes\AegisURL",
    r"Software\Classes\AegisHTML",
    r"Software\Classes\AegisPDF",
    r"Software\Microsoft\Windows\CurrentVersion\Uninstall\Aegis",
    # La que escribe el propio navegador (fabricante «Aegis», docs/PLAN.md › Identidad en el sistema). Una copia de
    # Aegis abierta durante la prueba la vuelve a crear: «estado» lo diría como resto.
    r"Software\Aegis",
]


def guardar(nombre, datos):
    """Cada resultado con la hora: nunca se pisa uno anterior."""
    os.makedirs(SALIDA, exist_ok=True)
    base, ext = os.path.splitext(nombre)
    ruta = os.path.join(SALIDA, f"{base}-{datetime.datetime.now():%H%M%S}{ext}")
    with open(ruta, "w", encoding="utf-8", newline="\n") as f:
        json.dump(datos, f, ensure_ascii=False, indent=2)
    print(f"→ {ruta}")


def carpeta_conocida(nombre):
    clave = r"Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders"
    with winreg.OpenKey(winreg.HKEY_CURRENT_USER, clave) as k:
        return os.path.expandvars(winreg.QueryValueEx(k, nombre)[0])


def leer_clave(ruta):
    """Valores de HKCU\\ruta (y de sus subclaves), o None si no existe."""
    try:
        k = winreg.OpenKey(winreg.HKEY_CURRENT_USER, ruta)
    except FileNotFoundError:
        return None
    with k:
        valores, i = {}, 0
        while True:
            try:
                n, v, _ = winreg.EnumValue(k, i)
            except OSError:
                break
            valores[n or "(predeterminado)"] = v
            i += 1
        subclaves, i = {}, 0
        while True:
            try:
                s = winreg.EnumKey(k, i)
            except OSError:
                break
            subclaves[s] = leer_clave(ruta + "\\" + s)
            i += 1
    return {"valores": valores, "subclaves": subclaves}


def estado_sistema():
    inicio = os.path.join(carpeta_conocida("Programs"), "Aegis.lnk")
    escritorio = os.path.join(carpeta_conocida("Desktop"), "Aegis.lnk")
    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\RegisteredApplications") as k:
            registrada = winreg.QueryValueEx(k, "Aegis")[0]
    except FileNotFoundError:
        registrada = None
    temporales = [n for n in os.listdir(os.environ["TEMP"]) if n.startswith("aegis-desinstalar-")]
    return {
        "claves": {c: leer_clave(c) for c in CLAVES},
        "RegisteredApplications\\Aegis": registrada,
        "acceso_inicio": inicio if os.path.exists(inicio) else None,
        "acceso_escritorio": escritorio if os.path.exists(escritorio) else None,
        "carpeta_instalada": os.path.isdir(INSTALADO),
        "restos_hermanas": [n for n in os.listdir(os.path.dirname(INSTALADO))
                            if n.startswith("Aegis.")] if os.path.isdir(os.path.dirname(INSTALADO)) else [],
        "copias_desinstalador_en_temp": temporales,
    }


def ejecutable():
    """El del navegador instalado: aegis.exe o, en las builds que aún se llaman así por dentro, firefox.exe."""
    for nombre in ("aegis.exe", "firefox.exe"):
        if os.path.isfile(os.path.join(INSTALADO, nombre)):
            return os.path.join(INSTALADO, nombre)
    return None


def limpio(e):
    return (all(v is None for v in e["claves"].values()) and e["RegisteredApplications\\Aegis"] is None
            and not e["acceso_inicio"] and not e["acceso_escritorio"] and not e["carpeta_instalada"]
            and not e["restos_hermanas"])


# ── instalar ───────────────────────────────────────────────────────────────────────────────────────────────────

def instalar(args):
    os.makedirs(PRUEBA, exist_ok=True)
    antes = estado_sistema()
    shutil.copyfile(args.setup, SETUP)
    t = time.monotonic()
    p = subprocess.Popen([SETUP, "--automatico", "--carpeta", os.path.dirname(INSTALADO)])
    try:
        codigo = p.wait(timeout=600)
    except subprocess.TimeoutExpired:
        subprocess.run(["taskkill", "/PID", str(p.pid), "/T", "/F"], capture_output=True)
        codigo = "tiempo agotado"
    segundos = round(time.monotonic() - t, 1)
    despues = estado_sistema()
    archivos = []
    for raiz, _, nombres in os.walk(INSTALADO):
        archivos += [os.path.relpath(os.path.join(raiz, n), INSTALADO) for n in nombres]
    minus = [a.lower().replace("\\", "/") for a in archivos]
    # El cargador de desarrollo (tools/dev/) no puede viajar en una instalación: config de autoconfig ni prefs aegis.dev.
    cargador = [a for a in minus if "aegis-dev" in a or a.endswith(".cfg") or a.endswith("autoconfig.js")]
    prefs_dev = []
    for a in minus:
        if a.startswith("defaults/pref/") or a.endswith("/defaults/pref") or a.startswith("browser/defaults/"):
            with open(os.path.join(INSTALADO, a), encoding="utf-8", errors="replace") as f:
                texto = f.read()
            if "general.config.filename" in texto or "aegis.dev" in texto:
                prefs_dev.append(a)
    elecciones = None
    if os.path.isfile(JSON_ELECCIONES):
        with open(JSON_ELECCIONES, encoding="utf-8") as f:
            elecciones = json.load(f)
    r = {
        "setup": args.setup,
        "codigo_salida": codigo,
        "segundos": segundos,
        "antes": antes,
        "despues": despues,
        "archivos": len(archivos),
        "ejecutable": ejecutable(),
        "desinstalar_exe": os.path.isfile(os.path.join(INSTALADO, "desinstalar.exe")),
        "cargador_desarrollo": cargador,
        "prefs_desarrollo": prefs_dev,
        "elecciones": elecciones,
    }
    guardar("instalar.json", r)
    print(json.dumps({k: v for k, v in r.items() if k not in ("antes", "despues")}, ensure_ascii=False, indent=2))
    return 0 if codigo == 0 and r["ejecutable"] and not cargador and not prefs_dev else 1


# ── navegador ──────────────────────────────────────────────────────────────────────────────────────────────────

PREFS_PERFIL = {
    # Automatización en un puerto propio, sin las «prefs recomendadas» de Marionette (cambiarían Aegis).
    "remote.prefs.recommended": False,
    # Nada sale del equipo: todo a un proxy cerrado y sin salida directa si falla.
    "network.proxy.type": 1,
    "network.proxy.http": "127.0.0.1",
    "network.proxy.http_port": 9,
    "network.proxy.ssl": "127.0.0.1",
    "network.proxy.ssl_port": 9,
    "network.proxy.no_proxies_on": "",
    "network.proxy.failover_direct": False,
    "network.proxy.allow_bypass": False,
    "browser.sessionstore.resume_from_crash": False,
    "widget.windows.window_occlusion_tracking.enabled": False,
}

JS_ESTADO = """
const resolver = arguments[arguments.length - 1];
const esperado = arguments[0];
(async () => {
  const { SearchService } = ChromeUtils.importESModule("moz-src:///toolkit/components/search/SearchService.sys.mjs");
  const { AddonManager } = ChromeUtils.importESModule("resource://gre/modules/AddonManager.sys.mjs");
  await SearchService.init();
  // El buscador se pone al final del arranque (después del de serie): se espera un poco a que llegue.
  for (let i = 0; i < 40 && esperado && SearchService.defaultEngine?.name != esperado; i++) {
    await new Promise(r => setTimeout(r, 250));
  }
  const p = Services.prefs;
  const pref = (n) => {
    const t = p.getPrefType(n);
    const v = t == p.PREF_STRING ? p.getStringPref(n) : t == p.PREF_BOOL ? p.getBoolPref(n) : t == p.PREF_INT ? p.getIntPref(n) : null;
    return { valor: v, usuario: p.prefHasUserValue(n) };
  };
  const temas = await AddonManager.getAddonsByTypes(["theme"]);
  const l10n = new Localization(["aegis.ftl"], true);
  return {
    prefs: Object.fromEntries([
      "aegis.instalador.aplicado", "aegis.etp.inicial", "aegis.modo", "sidebar.verticalTabs",
      "browser.contentblocking.category", "aegis.escudos.estricto_mas", "intl.locale.requested",
      "extensions.activeThemeID", "aegis.dev", "general.config.filename",
    ].map(n => [n, pref(n)])),
    buscador: SearchService.defaultEngine?.name,
    buscador_carga: SearchService.defaultEngine?.wrappedJSObject?._loadPath ?? null,
    buscador_url: SearchService.defaultEngine?.getSubmission("prueba")?.uri?.spec,
    tema_activo: temas.find(t => t.isActive)?.id,
    idiomas_pedidos: Services.locale.requestedLocales,
    idioma_app: Services.locale.appLocaleAsBCP47,
    // El idioma de la build que corresponde al de Windows: el que usa Aegis con intl.locale.requested vacía.
    idioma_windows: Services.locale.negotiateLanguages(
      Cc["@mozilla.org/intl/ospreferences;1"].getService(Ci.mozIOSPreferences).systemLocales,
      Services.locale.availableLocales, "", Services.locale.langNegStrategyFiltering)[0]
      ?? Services.locale.defaultLocale,
    idiomas_disponibles: Services.locale.availableLocales,
    texto_aegis: l10n.formatValueSync("aegis-escudos-nivel-estricto-mas"),
    texto_firefox: new Localization(["browser/browser.ftl"], true).formatValueSync("browser-main-window-default-title")
      ?? null,
    pestanas_verticales_en_ventana: !!document.querySelector("#tabbrowser-tabs[orient='vertical']"),
  };
})().then(resolver, e => resolver({ error: String(e) }));
"""


JS_LISTAS = """
const resolver = arguments[arguments.length - 1];
(async () => {
  const dev = Services.prefs.getBoolPref("aegis.dev", false);
  const base = dev ? "resource://aegis/" : "resource:///modules/aegis/";
  const { AegisEscudosListas } = ChromeUtils.importESModule(base + "escudos/listas.sys.mjs");
  const e = await AegisEscudosListas.estado();
  return { listo: e.listo, listas: e.listas.filter(l => l.origen).length, cuarentena: e.cuarentena.length,
           incidencias: e.incidencias, instantaneaRota: e.instantaneaRota };
})().then(resolver, e => resolver({ error: String(e) }));
"""


def puerto_libre():
    import socket
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    n = s.getsockname()[1]
    s.close()
    return n


# Procesos lanzados por este banco: si algo falla, se terminan estos y solo estos (por su PID).
LANZADOS = []


class Aegis:
    def __init__(self, perfil):
        self.perfil = perfil
        self.puerto = None
        self.proceso = None
        self.m = None

    def arrancar(self, nombre_registro):
        self.puerto = puerto_libre()
        prefs = {**PREFS_PERFIL, "marionette.port": self.puerto}
        # user.js se reescribe en cada arranque con el puerto nuevo (es una pref de la prueba, no de Aegis).
        with open(os.path.join(self.perfil, "user.js"), "a", encoding="utf-8", newline="\n") as f:
            for k, v in prefs.items():
                f.write(f"user_pref({json.dumps(k)}, {json.dumps(v)});\n")
        exe = ejecutable()
        salida = open(os.path.join(CORRIDA, nombre_registro), "w", encoding="utf-8")
        self.proceso = subprocess.Popen([exe, "-no-remote", "-marionette", "-remote-allow-system-access",
                                         "-profile", self.perfil], stdout=salida, stderr=subprocess.STDOUT)
        LANZADOS.append(self.proceso)
        # El saludo de Marionette puede tardar más de 5 s si el arranque está ocupado: se reintenta la conexión.
        for intento in range(6):
            try:
                self.m = Marionette(self.puerto, espera=120)
                break
            except TimeoutError:
                if intento == 5:
                    raise
                time.sleep(2)
        self.m.sesion()
        fin = time.monotonic() + 60
        while time.monotonic() < fin:
            try:
                if self.m.chrome("return !!document.getElementById('aegis-escudos-button');"):
                    break
            except ErrorMarionette:
                pass
            time.sleep(0.25)
        return self

    def estado(self, buscador_esperado=None):
        return self.m.chrome(JS_ESTADO, buscador_esperado, asincrono=True, espera=60)

    def captura(self, nombre):
        self.m._contexto("chrome")
        r = self.m.orden("WebDriver:TakeScreenshot", {"full": False, "hash": False})
        datos = r.get("value", r) if isinstance(r, dict) else r
        ruta = os.path.join(CORRIDA, nombre)
        with open(ruta, "wb") as f:
            f.write(base64.b64decode(datos))
        return ruta

    def salir(self):
        if self.m:
            self.m.salir()
            self.m = None
        if self.proceso:
            try:
                self.proceso.wait(timeout=60)
            except subprocess.TimeoutExpired:
                # Solo el proceso que ha lanzado este banco, por su PID.
                subprocess.run(["taskkill", "/PID", str(self.proceso.pid), "/T", "/F"], capture_output=True)
            self.proceso = None


def perfil_nuevo(nombre, user_js_extra=None):
    ruta = os.path.join(PERFILES, nombre)
    if os.path.isdir(ruta):
        shutil.rmtree(ruta)
    os.makedirs(ruta)
    if user_js_extra:
        with open(os.path.join(ruta, "user.js"), "w", encoding="utf-8", newline="\n") as f:
            for k, v in user_js_extra.items():
                f.write(f"user_pref({json.dumps(k)}, {json.dumps(v)});\n")
    return ruta


def escribir_elecciones(datos):
    with open(JSON_ELECCIONES, "w", encoding="utf-8", newline="\n") as f:
        if isinstance(datos, str):
            f.write(datos)
        else:
            json.dump(datos, f, ensure_ascii=False, indent=2)


def comprobar(nombre, estado, esperado):
    """Compara campos del estado con lo esperado. Devuelve la lista de diferencias."""
    fallos = []
    for clave, valor in esperado.items():
        partes = clave.split(".", 1) if clave.startswith("prefs.") else [clave]
        actual = estado["prefs"][partes[1]]["valor"] if len(partes) == 2 else estado.get(clave)
        if actual != valor:
            fallos.append(f"{nombre}: {clave} = {actual!r}, se esperaba {valor!r}")
    return fallos


def navegador(args):
    os.makedirs(CORRIDA, exist_ok=True)
    with open(JSON_ELECCIONES, encoding="utf-8") as f:
        original_texto = f.read()
    original = json.loads(original_texto)
    resultados, fallos = {}, []
    try:
        # A · lo que deja el instalador desatendido (lo de serie e idioma de Windows).
        a = Aegis(perfil_nuevo("A-de-serie")).arrancar("A-de-serie.log")
        ea = a.estado("DuckDuckGo")
        ea["captura"] = a.captura("A-de-serie.png")
        a.salir()
        resultados["A_de_serie"] = {"elecciones": original, "estado": ea}
        fallos += comprobar("A", ea, {
            "prefs.aegis.instalador.aplicado": True, "prefs.browser.contentblocking.category": "strict",
            "prefs.aegis.escudos.estricto_mas": True, "prefs.aegis.modo": "estandar",
            "prefs.sidebar.verticalTabs": False, "buscador": "DuckDuckGo", "tema_activo": "default-theme@mozilla.org",
            # El idioma del instalador es el de Windows: no se toca y la aplicación sigue a Windows (pref vacía).
            "prefs.intl.locale.requested": "", "idioma_app": ea.get("idioma_windows"),
        })

        # B · otras elecciones: Workflow, Normal, Startpage, oscuro y alemán (la build lo trae: la interfaz en alemán).
        otras = {**original, "modo": "workflow", "escudos": "normal", "buscador": "startpage",
                 "apariencia": "oscuro", "idioma": "de-DE"}
        escribir_elecciones(otras)
        b = Aegis(perfil_nuevo("B-otras")).arrancar("B-otras.log")
        eb = b.estado("Startpage")
        eb["captura"] = b.captura("B-otras.png")
        # El usuario cambia algo después: el nivel a Estricto y el tema a claro. Al volver a arrancar debe seguir así.
        b.m.chrome("""
          Services.prefs.setStringPref("browser.contentblocking.category", "strict");
          Services.prefs.setBoolPref("aegis.escudos.estricto_mas", false);
        """)
        # Y cierra enseguida, con el bloqueador recompilando las listas: el siguiente arranque tiene que volver a
        # compilarlas sin poner nada en cuarentena (fase «interrumpida» de escudos/listas.sys.mjs).
        b.salir()
        b2 = Aegis(b.perfil).arrancar("B-otras-segundo.log")
        eb2 = b2.estado()
        eb2["listas_escudos"] = b2.m.chrome(JS_LISTAS, asincrono=True, espera=120)
        b2.salir()
        with open(os.path.join(CORRIDA, "B-otras-segundo.log"), encoding="utf-8", errors="replace") as f:
            registro = f.read()
        le = eb2["listas_escudos"]
        if (not le.get("listo") or not le.get("listas") or le.get("cuarentena") or le.get("instantaneaRota")
                or "cuarentena" in registro or "no hay ninguna lista" in registro):
            fallos.append(f"B2: listas de Escudos tras cerrar compilando: listo={le.get('listo')}, "
                          f"listas={le.get('listas')}, cuarentena={le.get('cuarentena')}, "
                          f"instantaneaRota={le.get('instantaneaRota')}, "
                          f"«cuarentena» en el registro={'cuarentena' in registro}")
        resultados["B_otras"] = {"elecciones": otras, "estado": eb, "segundo_arranque": eb2}
        fallos += comprobar("B", eb, {
            "prefs.aegis.instalador.aplicado": True, "prefs.browser.contentblocking.category": "standard",
            "prefs.aegis.modo": "workflow", "prefs.sidebar.verticalTabs": True, "buscador": "Startpage",
            "tema_activo": "firefox-compact-dark@mozilla.org", "idioma_app": "de",
        })
        fallos += comprobar("B2", eb2, {
            "prefs.browser.contentblocking.category": "strict", "prefs.aegis.escudos.estricto_mas": False,
            "buscador": "Startpage", "tema_activo": "firefox-compact-dark@mozilla.org",
        })

        # C · Estricto, Brave Search, claro y un idioma que la build no trae (japonés): se salta y sigue a Windows.
        brave = {**original, "modo": "estandar", "escudos": "estricto", "buscador": "brave", "apariencia": "claro",
                 "idioma": "ja-JP"}
        escribir_elecciones(brave)
        c = Aegis(perfil_nuevo("C-brave")).arrancar("C-brave.log")
        ec = c.estado("Brave Search")
        ec["captura"] = c.captura("C-brave.png")
        c.salir()
        resultados["C_brave"] = {"elecciones": brave, "estado": ec}
        fallos += comprobar("C", ec, {
            "prefs.browser.contentblocking.category": "strict", "prefs.aegis.escudos.estricto_mas": False,
            "buscador": "Brave Search", "tema_activo": "firefox-compact-light@mozilla.org",
            "prefs.intl.locale.requested": "", "idioma_app": ec.get("idioma_windows"),
        })

        # D · perfil que ya había arrancado Aegis antes: no se aplica nada (solo la marca).
        escribir_elecciones(otras)
        d = Aegis(perfil_nuevo("D-perfil-usado", {"aegis.etp.inicial": True})).arrancar("D-perfil-usado.log")
        ed = d.estado()
        d.salir()
        resultados["D_perfil_usado"] = {"elecciones": otras, "estado": ed}
        fallos += comprobar("D", ed, {
            "prefs.aegis.instalador.aplicado": True, "prefs.aegis.modo": "estandar",
            "tema_activo": "default-theme@mozilla.org", "buscador": "DuckDuckGo",
        })

        # E · archivo roto y formato desconocido: no se aplica nada y Aegis arranca igual.
        for nombre, contenido in (("E-roto", "{ esto no es json"), ("F-formato-99", {**otras, "formato": 99})):
            escribir_elecciones(contenido)
            e = Aegis(perfil_nuevo(nombre)).arrancar(f"{nombre}.log")
            ee = e.estado("DuckDuckGo")
            e.salir()
            resultados[nombre] = {"elecciones": contenido, "estado": ee}
            fallos += comprobar(nombre, ee, {
                "prefs.aegis.instalador.aplicado": True, "prefs.aegis.modo": "estandar",
                "prefs.browser.contentblocking.category": "strict", "buscador": "DuckDuckGo",
                "tema_activo": "default-theme@mozilla.org",
            })
    finally:
        for p in LANZADOS:
            if p.poll() is None:
                subprocess.run(["taskkill", "/PID", str(p.pid), "/T", "/F"], capture_output=True)
        # El archivo vuelve a ser el que dejó el instalador.
        with open(JSON_ELECCIONES, "w", encoding="utf-8", newline="") as f:
            f.write(original_texto)
    resultados["fallos"] = fallos
    guardar("navegador.json", resultados)
    for f in fallos:
        print("✗", f)
    print("✓ todo como se esperaba" if not fallos else f"{len(fallos)} diferencias")
    return 1 if fallos else 0


# ── desinstalar ────────────────────────────────────────────────────────────────────────────────────────────────

def desinstalar(args):
    antes = estado_sistema()
    des = os.path.join(INSTALADO, "desinstalar.exe")
    r = {"antes": antes, "via": None}
    if os.path.isfile(des):
        # Como «Aplicaciones instaladas»: el desinstalador de la carpeta se copia a %TEMP% y sigue desde allí.
        r["via"] = "desinstalar.exe"
        try:
            p = subprocess.run([des, "--desinstalar", "--automatico"], timeout=120)
            r["codigo_lanzador"] = p.returncode
        except OSError as e:
            # El Control inteligente de aplicaciones puede no dejar abrir desinstalar.exe (sin firma y sin la carga,
            # otro hash que el Setup): se apunta y, con --respaldo, se sigue con el Setup.
            r["error_lanzador"] = str(e)
        fin = time.monotonic() + 90
        while time.monotonic() < fin and os.path.isdir(INSTALADO):
            time.sleep(0.5)
        if os.path.isdir(INSTALADO) and args.respaldo:
            # Si Windows no deja abrir la copia de %TEMP% (Control inteligente), con el Setup desde su carpeta.
            p = subprocess.run([SETUP, "--desinstalar", "--automatico", "--carpeta", INSTALADO], timeout=180)
            r["via"] = "Aegis Setup.exe --desinstalar (respaldo)"
            r["codigo_respaldo"] = p.returncode
    time.sleep(1)
    r["despues"] = estado_sistema()
    r["limpio"] = limpio(r["despues"])
    r["perfiles_intactos"] = os.path.isdir(PERFILES) and sorted(os.listdir(PERFILES))
    guardar("desinstalar.json", r)
    print(json.dumps({k: v for k, v in r.items() if k != "antes"}, ensure_ascii=False, indent=2))
    return 0 if r["limpio"] else 1


def estado(args):
    e = estado_sistema()
    print(json.dumps(e, ensure_ascii=False, indent=2))
    print("limpio" if limpio(e) else "QUEDAN RESTOS")
    return 0


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("orden", choices=["instalar", "navegador", "desinstalar", "estado"])
    ap.add_argument("--setup", default=SETUP_REPO, help="el Aegis Setup.exe que se prueba")
    ap.add_argument("--respaldo", action="store_true",
                    help="al desinstalar, si la copia de %%TEMP%% no se abre, desinstalar con el Setup")
    args = ap.parse_args()
    return {"instalar": instalar, "navegador": navegador, "desinstalar": desinstalar, "estado": estado}[args.orden](args)


if __name__ == "__main__":
    sys.exit(main())
