"""Cliente mínimo de Marionette (el protocolo TCP de automatización del motor), sin dependencias.

Lo usan los bancos de pruebas de tools/pruebas/. Marionette habla JSON con un prefijo de longitud:
    <longitud>:[0, id, "Orden", {parámetros}]   →   <longitud>:[1, id, error|null, resultado]

Solo lo que hace falta para las pruebas: sesión, contexto (chrome = la interfaz con privilegios, content = la web),
ejecutar scripts, navegar, clics de verdad (acciones de WebDriver), ventanas y salir.
"""
import json
import socket
import time


class ErrorMarionette(RuntimeError):
    """Una orden ha fallado en el navegador (el mensaje trae el error de WebDriver y su texto)."""

    def __init__(self, orden, error):
        self.orden = orden
        self.error = error if isinstance(error, dict) else {"error": str(error)}
        super().__init__(f"{orden}: {self.error.get('error')}: {self.error.get('message', '')}".strip())


class Marionette:
    def __init__(self, puerto, espera=90.0, anfitrion="127.0.0.1"):
        fin = time.monotonic() + espera
        ultimo = None
        while True:
            try:
                self.s = socket.create_connection((anfitrion, puerto), timeout=5)
                # Con un puerto efímero, el sistema puede dar como origen el mismo puerto: el socket se conecta
                # consigo mismo (TCP simultaneous open) y el saludo de Marionette no llega nunca. Se reintenta.
                if self.s.getsockname() == self.s.getpeername():
                    self.s.close()
                    raise OSError("conectado consigo mismo")
                break
            except OSError as e:
                ultimo = e
                if time.monotonic() > fin:
                    raise ConnectionError(f"Marionette no responde en {anfitrion}:{puerto}: {ultimo}") from None
                time.sleep(0.3)
        self.s.settimeout(300)
        self.buf = b""
        self.id = 0
        self.contexto = None
        self.saludo = self._leer()

    # ── Protocolo ─────────────────────────────────────────────────────────────────────────────────────────────────

    def _recibir(self):
        datos = self.s.recv(1 << 16)
        if not datos:
            raise ConnectionError("Marionette ha cerrado la conexión")
        self.buf += datos

    def _leer(self):
        while b":" not in self.buf:
            self._recibir()
        cabecera = self.buf.partition(b":")[0]
        inicio, n = len(cabecera) + 1, int(cabecera)
        while len(self.buf) < inicio + n:
            self._recibir()
        datos, self.buf = self.buf[inicio:inicio + n], self.buf[inicio + n:]
        return json.loads(datos)

    def orden(self, nombre, params=None):
        self.id += 1
        datos = json.dumps([0, self.id, nombre, params or {}]).encode()
        self.s.sendall(str(len(datos)).encode() + b":" + datos)
        while True:
            r = self._leer()
            if r[0] == 1 and r[1] == self.id:
                if r[2]:
                    raise ErrorMarionette(nombre, r[2])
                return r[3]

    def cerrar(self):
        try:
            self.s.close()
        except OSError:
            pass

    # ── Sesión y contexto ─────────────────────────────────────────────────────────────────────────────────────────

    def sesion(self, **capacidades):
        """Abre la sesión. Sin acceptInsecureCerts: los certificados se comprueban de verdad."""
        r = self.orden("WebDriver:NewSession", {"capabilities": {"alwaysMatch": capacidades}})
        self.contexto = None
        return r

    def _contexto(self, valor):
        if self.contexto != valor:
            self.orden("Marionette:SetContext", {"value": valor})
            self.contexto = valor

    def chrome(self, script, *args, asincrono=False, espera=None):
        """Script en la ventana del navegador (privilegios de sistema). `return` devuelve el valor."""
        self._contexto("chrome")
        return self._ejecutar(script, args, asincrono, espera)

    def contenido(self, script, *args, asincrono=False, espera=None):
        """Script en la web de la pestaña elegida (sin privilegios, como un script de la propia web)."""
        self._contexto("content")
        return self._ejecutar(script, args, asincrono, espera)

    def _ejecutar(self, script, args, asincrono, espera):
        if espera is not None:
            self.orden("WebDriver:SetTimeouts", {"script": int(espera * 1000)})
        orden = "WebDriver:ExecuteAsyncScript" if asincrono else "WebDriver:ExecuteScript"
        # Sin sandbox: el script corre en el mundo de la página (ve lo mismo que ve la web).
        return self.orden(orden, {"script": script, "args": list(args), "newSandbox": False}).get("value")

    # ── Navegación y acciones ─────────────────────────────────────────────────────────────────────────────────────

    def ir(self, url, espera_carga="complete"):
        """Navega la pestaña elegida (como escribir la dirección en la barra: el principal es el del sistema)."""
        self._contexto("content")
        self.orden("WebDriver:SetTimeouts", {"pageLoad": 60000})
        self.orden("WebDriver:Navigate", {"url": url})

    def url(self):
        self._contexto("content")
        return self.orden("WebDriver:GetCurrentURL").get("value")

    def buscar(self, selector):
        self._contexto("content")
        r = self.orden("WebDriver:FindElement", {"using": "css selector", "value": selector})
        return r.get("value", r)

    def clic(self, selector):
        """Clic de verdad en un elemento de la web: eventos de ratón de confianza (cuentan como gesto del usuario)."""
        el = self.buscar(selector)
        self.orden("WebDriver:ElementClick", {"id": el["element-6066-11e4-a52e-4f735466cecf"]})

    def mover_raton(self, x, y):
        """Mueve el ratón al punto (x, y) del área de la web (coordenadas CSS)."""
        self._contexto("content")
        self.orden("WebDriver:PerformActions", {"actions": [{
            "type": "pointer", "id": "raton", "parameters": {"pointerType": "mouse"},
            "actions": [{"type": "pointerMove", "x": int(x), "y": int(y), "origin": "viewport", "duration": 0}],
        }]})
        self.orden("WebDriver:ReleaseActions")

    # ── Ventanas ──────────────────────────────────────────────────────────────────────────────────────────────────

    def ventanas_chrome(self):
        """Identificadores de las ventanas del navegador (en contexto chrome, una por ventana, no por pestaña)."""
        self._contexto("chrome")
        r = self.orden("WebDriver:GetWindowHandles")
        return r.get("value", r) if isinstance(r, dict) else r

    def ventana_chrome(self):
        self._contexto("chrome")
        r = self.orden("WebDriver:GetWindowHandle")
        return r.get("value", r) if isinstance(r, dict) else r

    def cambiar_ventana(self, identificador):
        self.orden("WebDriver:SwitchToWindow", {"handle": identificador, "focus": True})
        self.contexto = None

    def rect(self, **valores):
        return self.orden("WebDriver:SetWindowRect", valores)

    def salir(self, reiniciar=False):
        """Cierra el navegador de forma ordenada (como «Salir»: se ejecuta el borrado al cerrar)."""
        flags = ["eRestart"] if reiniciar else ["eAttemptQuit"]
        try:
            return self.orden("Marionette:Quit", {"flags": flags})
        except (ConnectionError, OSError):
            return None
        finally:
            self.cerrar()
