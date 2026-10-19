"""Aegis bajo prueba: perfil temporal, arranque con Marionette y lo que se mira en la interfaz (Escudos, avisos,
permisos). Lo usan los bancos de tools/pruebas/.

El perfil de prueba es un perfil nuevo de Aegis con lo mínimo para el banco (cada pref con su porqué en
PREFS_BANCO). Nada más se cambia: el resto es Aegis tal como lo recibe una persona.
"""
import json
import os
import shutil
import subprocess
import time

from marionette import ErrorMarionette, Marionette

AQUI = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(AQUI))
COPIA_DESARROLLO = os.path.join(os.path.expanduser("~"), "Aegis-pruebas", "Aegis", "firefox", "firefox.exe")


def buscar_instalada():
    """El ejecutable de un Aegis instalado (instalador propio o zip portable)."""
    candidatos = []
    for base in (os.environ.get("ProgramFiles"), os.environ.get("ProgramFiles(x86)"),
                 os.path.join(os.environ.get("LOCALAPPDATA", ""), "Programs")):
        if base:
            for nombre in ("aegis.exe", "firefox.exe"):
                candidatos.append(os.path.join(base, "Aegis", nombre))
    for c in candidatos:
        if os.path.isfile(c):
            return c
    raise SystemExit("No encuentro un Aegis instalado. Indica el ejecutable con --exe.")


def prefs_banco(puerto_marionette, puerto_proxy, simulados, rastreo_simulado):
    """Prefs del perfil de prueba. Solo lo necesario para el banco; cada una dice por qué."""
    return {
        # Automatización: Marionette en un puerto propio y sin sus «prefs recomendadas», que cambian decenas de
        # ajustes (red, ventanas emergentes, actualizaciones…) y harían que no se probara Aegis tal cual.
        "marionette.port": puerto_marionette,
        "remote.prefs.recommended": False,
        # Red: todo por el proxy del banco (127.0.0.1). Los sitios de prueba se contestan allí; lo de fuera se corta y
        # se apunta. Sin salida directa si el proxy falla: el motor la intenta de serie para sus peticiones de sistema
        # (Remote Settings…), y eso sacaría tráfico del equipo durante la prueba (ver el informe, «red»).
        "network.proxy.type": 1,
        "network.proxy.http": "127.0.0.1",
        "network.proxy.http_port": puerto_proxy,
        "network.proxy.ssl": "127.0.0.1",
        "network.proxy.ssl_port": puerto_proxy,
        "network.proxy.no_proxies_on": "",
        "network.proxy.failover_direct": False,
        "network.proxy.allow_bypass": False,
        # Listas del clasificador sin tabla de prueba integrada: una entrada de prueba por categoría (la de
        # rastreadores, itisatracker.org y trackertest.org, ya la trae el motor).
        **{f"urlclassifier.features.{k}.blacklistHosts": v for k, v in simulados.items()},
        "urlclassifier.trackingTable.testEntries": rastreo_simulado,
        "urlclassifier.trackingAnnotationTable.testEntries": rastreo_simulado,
        # Huella: valores del «usuario» que hacen que lo protegido se distinga de lo real. Un usuario con el tema
        # oscuro, «reducir movimiento» y «reducir transparencias», y los idiomas en español.
        "layout.css.prefers-color-scheme.content-override": 0,
        "ui.prefersReducedMotion": 1,
        "ui.prefersReducedTransparency": 1,
        "intl.accept_languages": "es-ES, es, en-US, en",
        # Panel de Escudos con las opciones avanzadas abiertas (es una preferencia de la vista; el panel la recuerda).
        "aegis.escudos.avanzadas": True,
        # Que la ventana de prueba no deje de pintarse si otra ventana del escritorio la tapa: Windows la daría por
        # oculta, el motor pararía requestAnimationFrame y los paneles (y las medidas de fotogramas) fallarían.
        "widget.windows.window_occlusion_tracking.enabled": False,
        # Sin la página «Tú decides qué se conecta» (about:conexiones) en la primera ventana: el banco maneja la pestaña
        # elegida. Las conexiones siguen sin aceptar (y el proxy del banco cortaría cualquiera).
        "aegis.conexiones.decidido": True,
        # Sin diálogos de recuperación si una prueba anterior cerró el navegador a la fuerza.
        "browser.sessionstore.resume_from_crash": False,
        "toolkit.startup.max_resumed_crashes": -1,
    }


def escribir_user_js(perfil, prefs):
    with open(os.path.join(perfil, "user.js"), "w", encoding="utf-8", newline="\n") as f:
        for k, v in prefs.items():
            f.write(f"user_pref({json.dumps(k)}, {json.dumps(v)});\n")


# ── Scripts de la interfaz (contexto chrome) ──────────────────────────────────────────────────────────────────

JS_MODULO = """
const dev = Services.prefs.getBoolPref("aegis.dev", false);
const base = dev ? "resource://aegis/" : "resource:///modules/aegis/";
window.__aegis ??= {
  huella: ChromeUtils.importESModule(base + "huella.sys.mjs").AegisHuella,
};
"""

JS_CONTADOR = """
const c = document.getElementById("aegis-escudos-contador");
const b = document.getElementById("aegis-escudos-button");
return {
  boton: !!b && !b.hidden,
  visible: !!c && !c.hidden && !!b && !b.hidden,
  texto: c ? c.textContent : null,
  bajados: b ? b.hasAttribute("bajados") : null,
};
"""

JS_ABRIR_PANEL = """
const p = document.getElementById("aegis-escudos-panel");
if (p && (p.state == "open" || p.state == "showing")) {
  return "open";
}
document.getElementById("aegis-escudos-button").click();
return "abriendo";
"""

JS_ESTADO_PANEL = """
const p = document.getElementById("aegis-escudos-panel");
return p ? p.state : "sin-panel";
"""

JS_LEER_PANEL = """
const p = document.getElementById("aegis-escudos-panel");
const q = s => p.querySelector(s);
const sw = s => { const b = q(s); return b ? {on: b.getAttribute("aria-checked") == "true", desactivado: !!b.disabled} : null; };
const det = s => q(s)?.textContent ?? null;
return {
  estado: p.state,
  numero: q(".aegis-escudos-numero").textContent,
  numeroOculto: q(".aegis-escudos-numero").hidden,
  estadoTexto: document.getElementById("aegis-escudos-estado").textContent,
  sitio: sw(".aegis-escudos-cabecera .aegis-interruptor"),
  https: sw("#aegis-escudos-https .aegis-interruptor"),
  httpsDetalle: det("#aegis-escudos-https-detalle"),
  olvidar: sw("#aegis-escudos-olvidar .aegis-interruptor"),
  olvidarDetalle: det("#aegis-escudos-olvidar-detalle"),
  permiso: sw("#aegis-escudos-permiso .aegis-interruptor"),
  permisoDetalle: det("#aegis-escudos-permiso-detalle"),
  permisoVisible: !q("#aegis-escudos-permiso")?.closest(".aegis-escudos-tarjeta")?.hidden,
  nivel: document.getElementById("aegis-escudos-menu-nivel-valor")?.textContent ?? null,
  huella: document.getElementById("aegis-escudos-menu-huella-valor")?.textContent ?? null,
  cookies: document.getElementById("aegis-escudos-menu-cookies-valor")?.textContent ?? null,
};
"""

JS_DESGLOSE = """
const p = document.getElementById("aegis-escudos-panel");
p.querySelector("#aegis-escudos-ver").click();
const l10n = new Localization(["aegis.ftl", "branding/brand.ftl"], true);
const nombres = {};
for (const [k, id] of [["rastreadores", "aegis-escudos-cat-rastreadores"], ["anuncios", "aegis-escudos-cat-anuncios"],
                       ["sociales", "aegis-escudos-cat-sociales"], ["huella", "aegis-escudos-cat-huella"],
                       ["criptomineros", "aegis-escudos-cat-criptomineros"]]) {
  nombres[l10n.formatValueSync(id)] = k;
}
const secciones = {};
const cuentas = {};
for (const s of p.querySelectorAll(".aegis-escudos-lista section")) {
  const titulo = s.querySelector("h3 span").textContent;
  secciones[nombres[titulo] ?? titulo] = [...s.querySelectorAll("li")].map(li => li.textContent);
  cuentas[nombres[titulo] ?? titulo] = s.querySelector(".aegis-escudos-etiqueta-cuenta")?.textContent ?? "";
}
p.querySelector(".aegis-escudos-atras").click();
return { secciones, cuentas };
"""

JS_CERRAR_PANEL = """
const p = document.getElementById("aegis-escudos-panel");
if (p && p.state != "closed") { p.hidePopup(); }
for (const id of ["aegis-escudos-menu-nivel", "aegis-escudos-menu-huella", "aegis-escudos-menu-cookies"]) {
  const m = document.getElementById(id);
  if (m && m.state != "closed") { m.hidePopup(); }
}
"""

JS_INTERRUPTOR = """
const sel = {
  sitio: ".aegis-escudos-cabecera .aegis-interruptor",
  https: "#aegis-escudos-https .aegis-interruptor",
  olvidar: "#aegis-escudos-olvidar .aegis-interruptor",
  permiso: "#aegis-escudos-permiso .aegis-interruptor",
}[arguments[0]];
const b = document.getElementById("aegis-escudos-panel").querySelector(sel);
const antes = b.getAttribute("aria-checked") == "true";
b.click();
return {antes, desactivado: !!b.disabled};
"""

JS_MENU = """
const menu = document.getElementById(arguments[0]);
const item = [...menu.children].find(i => i.getAttribute("value") == arguments[1]);
if (!item) { return false; }
item.doCommand();
return true;
"""

JS_VENTANA_ID = "return gBrowser.selectedBrowser.innerWindowID;"


class Navegador:
    """Una instancia de Aegis con su perfil de prueba, manejada por Marionette."""

    def __init__(self, exe, perfil, puerto, entorno=None, sin_ventana=False):
        self.exe = exe
        self.perfil = perfil
        self.puerto = puerto
        self.entorno = entorno or {}
        self.sin_ventana = sin_ventana
        self.proceso = None
        self.m = None
        self.ventana_principal = None

    # ── Arranque y cierre ──

    def arrancar(self, salida):
        args = [self.exe, "-no-remote", "-marionette", "-remote-allow-system-access", "-profile", self.perfil]
        if self.sin_ventana:
            args.insert(1, "-headless")
        self.proceso = subprocess.Popen(args, env={**os.environ, **self.entorno}, stdout=salida,
                                        stderr=subprocess.STDOUT)
        self.m = Marionette(self.puerto, espera=120)
        self.m.sesion()
        self.ventana_principal = self.m.ventana_chrome()
        # Espera a que el código de Aegis haya montado el botón de Escudos en la ventana.
        self.esperar(lambda: self.m.chrome("return !!document.getElementById('aegis-escudos-button');"), 60,
                     "el botón de Escudos")
        self.m.chrome(JS_MODULO)
        return self

    def salir(self, maximo=60):
        """Cierre ordenado (se ejecuta el borrado al cerrar)."""
        if self.m:
            self.m.salir()
            self.m = None
        if self.proceso:
            try:
                self.proceso.wait(timeout=maximo)
            except subprocess.TimeoutExpired:
                self.matar()

    def matar(self):
        if self.proceso and self.proceso.poll() is None:
            subprocess.run(["taskkill", "/PID", str(self.proceso.pid), "/T", "/F"], capture_output=True)
        if self.m:
            self.m.cerrar()
            self.m = None

    # ── Utilidades ──

    @staticmethod
    def esperar(condicion, maximo, que, intervalo=0.25):
        fin = time.monotonic() + maximo
        ultimo = None
        while time.monotonic() < fin:
            try:
                ultimo = condicion()
                if ultimo:
                    return ultimo
            except ErrorMarionette:
                pass
            time.sleep(intervalo)
        raise TimeoutError(f"esperando {que} ({maximo} s); último valor: {ultimo!r}")

    def chrome(self, script, *args):
        return self.m.chrome(JS_MODULO + script, *args)

    def ir(self, url):
        """Navega la pestaña elegida. Una página de error (Solo HTTPS) no es un fallo aquí: se mira después."""
        try:
            self.m.ir(url)
        except ErrorMarionette as e:
            if "error page" not in str(e).lower() and "about:" not in str(e):
                raise

    def esperar_fase(self, fase, maximo=45):
        return self.esperar(
            lambda: self.m.contenido("return window.__fase && window.__fase.fase == arguments[0] ? window.__fase : null;", fase),
            maximo, f"la fase {fase}")

    def documento(self):
        return self.m.chrome("return gBrowser.selectedBrowser.documentURI?.spec ?? null;")

    def id_documento(self):
        return self.m.chrome(JS_VENTANA_ID)

    def esperar_documento_nuevo(self, antes, maximo=30):
        return self.esperar(lambda: self.id_documento() != antes and
                            self.m.chrome("return gBrowser.selectedBrowser.webProgress?.isLoadingDocument === false;"),
                            maximo, "la recarga de la página")

    # ── Escudos ──

    def contador(self, pausa=0.8, maximo=4.0):
        """Lo que marca el botón de Escudos, cuando deja de cambiar (se repinta como mucho cada 250 ms)."""
        time.sleep(pausa)
        antes = self.m.chrome(JS_CONTADOR)
        fin = time.monotonic() + maximo
        while time.monotonic() < fin:
            time.sleep(0.5)
            ahora = self.m.chrome(JS_CONTADOR)
            if ahora == antes:
                return ahora
            antes = ahora
        return antes

    def abrir_panel(self):
        """Abre el panel de Escudos. Si estaba a medio cerrarse («hiding»), espera a que termine antes de pulsar (el
        botón no lo abre en ese estado); si no llega a abrirse, vuelve a pulsar. El error dice en qué estado quedó."""
        fin = time.monotonic() + 10
        estados = []
        while time.monotonic() < fin:
            estado = self.m.chrome(JS_ESTADO_PANEL)
            estados.append(estado)
            if estado == "open":
                time.sleep(0.2)
                return
            if estado in ("closed", "sin-panel"):
                self.m.chrome(JS_ABRIR_PANEL)
                # El clic abre el panel de forma asíncrona: se le da un momento antes de volver a mirar.
                parcial = time.monotonic() + 2.5
                while time.monotonic() < parcial and self.m.chrome(JS_ESTADO_PANEL) not in ("open",):
                    time.sleep(0.1)
                continue
            time.sleep(0.1)       # «showing» o «hiding»: transición en curso
        raise TimeoutError(f"esperando el panel de Escudos (10 s); estados vistos: {' → '.join(dict.fromkeys(estados))}")

    def leer_panel(self, desglose=False):
        self.abrir_panel()
        datos = self.m.chrome(JS_LEER_PANEL)
        if desglose:
            d = self.m.chrome(JS_DESGLOSE)
            datos["secciones"], datos["cuentas"] = d["secciones"], d["cuentas"]
        return datos

    def cerrar_panel(self):
        self.m.chrome(JS_CERRAR_PANEL)

    def interruptor(self, cual, recarga=True):
        """Pulsa un interruptor del panel como lo haría una persona. Con `recarga`, espera a la página recargada."""
        self.abrir_panel()
        antes = self.id_documento()
        r = self.m.chrome(JS_INTERRUPTOR, cual)
        if recarga and not r["desactivado"]:
            self.esperar_documento_nuevo(antes)
        self.cerrar_panel()
        return r

    def elegir(self, menu, valor):
        """Elige una opción de un desplegable del panel (nivel, huella, cookies). El panel recarga la pestaña."""
        self.abrir_panel()
        antes = self.id_documento()
        if not self.m.chrome(JS_MENU, menu, valor):
            raise RuntimeError(f"{menu}: no hay opción {valor}")
        self.esperar_documento_nuevo(antes)
        self.cerrar_panel()

    # ── Ventanas ──

    def abrir_ventana(self, privada=False):
        antes = set(self.m.ventanas_chrome())
        self.m.chrome("OpenBrowserWindow({private: arguments[0]});", privada)
        nueva = self.esperar(lambda: (set(self.m.ventanas_chrome()) - antes) or None, 30, "la ventana nueva")
        h = nueva.pop()
        self.m.cambiar_ventana(h)
        self.esperar(lambda: self.m.chrome("return !!document.getElementById('aegis-escudos-button') && "
                                           "!!window.gBrowserInit?.delayedStartupFinished;"), 30, "la ventana lista")
        return h

    def cerrar_ventana(self, h):
        self.m.cambiar_ventana(h)
        self.m.chrome("window.close();")
        self.esperar(lambda: h not in self.m.ventanas_chrome(), 15, "el cierre de la ventana")
        self.m.cambiar_ventana(self.ventana_principal)


def copiar_aislada(exe, destino):
    """Copia la instalación de prueba a `destino` (otra prueba que arranque la misma copia no le pisa los archivos)."""
    origen = os.path.dirname(exe)
    shutil.copytree(origen, destino, ignore=shutil.ignore_patterns("aegis-dev", "aegis-dev.log"))
    return os.path.join(destino, os.path.basename(exe))
