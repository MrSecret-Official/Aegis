"""Los sitios del banco de pruebas de Escudos: qué dominios hay y qué contesta cada dirección.

Todos los dominios se sirven desde este equipo (red.ServidorBanco). Ninguno existe de verdad para el banco salvo
por su nombre: así el navegador los trata como sitios distintos (primera parte frente a terceros, cookies por sitio,
Solo HTTPS, Google limpio) sin salir a Internet.

Páginas: tools/pruebas/escudos/ (la web de pruebas). Se busca primero en sitios/<host>/<ruta> y luego en
comun/<ruta>, así una misma página (rastreadores.html, huella.html…) se puede abrir en cualquier sitio de prueba.
Direcciones dinámicas bajo /__/ (registro de lo que llega, fases, cookies, inicio de sesión de prueba, vídeo).
"""
import json
import os
import threading
import time
import urllib.parse

import red

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ_WEB = os.path.join(AQUI, "escudos")
REPO = os.path.dirname(os.path.dirname(AQUI))
INTER = os.path.join(REPO, "overlay", "browser", "components", "aegis", "fuentes", "InterVariable.woff2")

# ── Dominios ──────────────────────────────────────────────────────────────────────────────────────────────────────

# Sitios propios del banco (dominio reservado .test, RFC 2606: no existe en Internet).
PROPIOS = ["aegis-banco.test", "sitio-a.test", "sitio-b.test", "sitio-c.test", "sitio-d.test", "sitio-e.test",
           "sitio-f.test", "sitio-g.test", "sitio-h.test", "sitio-i.test",
           "cdn.sitio-a.test"]
# Sin HTTPS: el puerto 443 no contesta (para el aviso de Solo HTTPS).
SOLO_HTTP = ["solo-http.test"]
# Rastreadores de las tablas de prueba que el clasificador trae dentro (moztest-track-simple: «trackertest.org/» e
# «itisatracker.org/», LookupCache.cpp). Lista real del navegador; el dominio, servido aquí.
RASTREADORES_REALES = ["itisatracker.org", "www.itisatracker.org", "trackertest.org"]
# Categorías sin tabla de prueba integrada: se añaden al perfil de prueba con las prefs de entradas de prueba del
# clasificador (urlclassifier.features.<categoría>.blacklistHosts). El bloqueo es el del navegador; la entrada en la
# lista es lo simulado.
SIMULADOS = {
    "socialtracking": "rastreador-social.test",
    "fingerprinting": "recolector-huella.test",
    "cryptomining": "criptominero.test",
}
# Una red social en la lista general de rastreo (lo que en la real es social-track-digest256, dentro de
# urlclassifier.trackingTable): entrada de prueba de la protección contra rastreo y de su anotación (cookies).
RASTREO_SIMULADO = "red-social-rastreo.test"

# Google y YouTube (Google limpio, google.sys.mjs). Todos con HTTPS (varios están en la lista HSTS precargada).
GOOGLE = [
    "www.google.com", "google.com", "www.google.es", "play.google.com", "docs.google.com", "accounts.google.com",
    "myaccount.google.com", "ogs.google.com", "id.google.com", "consent.google.com", "analytics.google.com",
    "ogads-pa.clients6.google.com", "www.gstatic.com", "fonts.googleapis.com", "maps.googleapis.com",
    "imasdk.googleapis.com", "firebaselogging-pa.googleapis.com", "csi.gstatic.com",
    "www.youtube.com", "i.ytimg.com", "rr1---sn-prueba.googlevideo.com",
    "stats.g.doubleclick.net", "googleads.g.doubleclick.net", "securepubads.g.doubleclick.net",
    "pagead2.googlesyndication.com", "www.googleadservices.com", "www.googletagservices.com",
    "www.google-analytics.com", "region1.google-analytics.com", "www.googletagmanager.com",
]

# Servidores de anuncios y de rastreo de las listas reales de Escudos (motor propio, escudos/red.sys.mjs): el bloqueo
# es de verdad (reglas de uBlock filters, EasyList, EasyPrivacy y AdGuard de filtros/); el dominio, servido aquí. Uno
# por grupo de listas: los de serie, AdGuard Tracking (solo Estricto+) y los tres de molestias (comun/anuncios.html).
ANUNCIOS = [
    "ads.pubmatic.com", "cdn.taboola.com", "static.criteo.net", "c.amazon-adsystem.com", "ib.adnxs.com",
    "mon.snssdk.com", "cookies.truecaller.com", "omapi.fangraphs.com", "abruptroad.com",
]
# Cosmético y scriptlets (comun/cosmetico.html): sitios con reglas propias de las listas reales (uBlock filters):
# angrybirdsnest.com (ocultar «.post-container > div.post:not([id])» y el scriptlet «set, adblock, false») y
# mobalytics.gg (el procedural «span:has-text(Advertisement):upward(3)») y www.mediafire.com (scriptlets de las capas 0
# y 2 a la vez). Servidos aquí.
COSMETICO = ["angrybirdsnest.com", "mobalytics.gg", "www.mediafire.com"]

SITIOS = {}
for _h in PROPIOS + RASTREADORES_REALES + list(SIMULADOS.values()) + [RASTREO_SIMULADO] + GOOGLE + ANUNCIOS + COSMETICO:
    SITIOS[_h] = {"http": True, "https": True}
for _h in SOLO_HTTP:
    SITIOS[_h] = {"http": True, "https": False}
HOSTS_TLS = [h for h, s in SITIOS.items() if s["https"]]
# Direcciones del propio banco: no cuentan como peticiones de las páginas en el registro.
INTERNAS = {"/__/registro", "/__/fase", "/__/base", "/__/ajustes", "/__/externas"}


# ── Estado del servidor (fases guardadas por las páginas o por el ejecutor) ─────────────────────────────────────

class Estado:
    def __init__(self):
        self._cerrojo = threading.Lock()
        self.fases = {}      # run → {fase: datos}
        self.base = None     # valores reales del equipo (referencia de la huella)
        self.video = None    # vídeo de prueba (WebM) grabado por el propio navegador
        self.ajustes = {}    # lo que el ejecutor deja para las páginas (p. ej. fuentes a probar)

    def guardar_fase(self, run, fase, datos):
        with self._cerrojo:
            self.fases.setdefault(run, {})[fase] = datos

    def leer_fases(self, run):
        with self._cerrojo:
            return dict(self.fases.get(run, {}))


def _cors(cab):
    """CORS con credenciales para el origen que pregunta (las páginas de prueba se llaman entre sitios)."""
    origen = cab.get("Origin")
    if not origen or origen == "null":
        return {}
    return {"Access-Control-Allow-Origin": origen, "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Headers": "Content-Type", "Vary": "Origin"}


def _cookies(cab):
    salida = {}
    for parte in (cab.get("Cookie") or "").split(";"):
        k, sep, v = parte.strip().partition("=")
        if sep:
            salida[k] = v
    return salida


def _pagina(titulo, cuerpo):
    return (200, {"Content-Type": "text/html; charset=utf-8"},
            f"<!doctype html><meta charset=utf-8><title>{titulo}</title>{cuerpo}".encode())


def crear_contestador(estado, registro):
    """La función que el servidor llama por cada petición a un sitio de prueba."""

    def contestar(metodo, esquema, host, ruta, cab, cuerpo):
        camino, _, consulta = ruta.partition("?")
        q = dict(urllib.parse.parse_qsl(consulta, keep_blank_values=True))
        destino = cab.get("Sec-Fetch-Dest", "")
        cors = _cors(cab)
        if metodo == "OPTIONS":
            return 204, {**cors, "Access-Control-Allow-Methods": "GET, POST"}, b""

        # ── Dinámicas ──
        if camino.startswith("/__/"):
            accion = camino[4:]
            if accion == "registro":
                texto = q.get("id", "")
                lista = [p for p in (registro.buscar(texto) if texto else registro.todas())
                         if p["ruta"] not in INTERNAS]
                return red.respuesta_json(lista, cabeceras=cors)
            if accion == "fase":
                if metodo == "POST":
                    estado.guardar_fase(q["run"], q["fase"], json.loads(cuerpo or b"null"))
                    return red.respuesta_json({"ok": True}, cabeceras=cors)
                return red.respuesta_json(estado.leer_fases(q.get("run", "")), cabeceras=cors)
            if accion == "base":
                if metodo == "POST":
                    estado.base = json.loads(cuerpo or b"null")
                    return red.respuesta_json({"ok": True}, cabeceras=cors)
                return red.respuesta_json(estado.base, cabeceras=cors)
            if accion == "ajustes":
                return red.respuesta_json(estado.ajustes, cabeceras=cors)
            if accion == "externas":
                return red.respuesta_json(registro.lista_externas(), cabeceras=cors)
            if accion == "cookie":
                # Pone (si se pide) una cookie de tercero válida en HTTPS (SameSite=None; Secure) y dice cuáles llegaron.
                extra = {}
                if q.get("poner"):
                    atributos = "Path=/; SameSite=None" + ("; Secure" if esquema == "https" else "")
                    if q.get("sesion") != "1":
                        atributos += "; Max-Age=86400"
                    extra["Set-Cookie"] = f"{q['poner']}={q.get('valor', '1')}; {atributos}"
                return red.respuesta_json({"recibidas": _cookies(cab), "idioma": cab.get("Accept-Language", ""),
                                           "referer": cab.get("Referer", ""), "gpc": cab.get("Sec-GPC", "")},
                                          cabeceras={**cors, **extra})
            if accion == "eco":
                return red.respuesta_json({"recibidas": _cookies(cab), "idioma": cab.get("Accept-Language", ""),
                                           "referer": cab.get("Referer", ""), "gpc": cab.get("Sec-GPC", ""),
                                           "ua": cab.get("User-Agent", "")}, cabeceras=cors)
            if accion == "entrar":
                datos = dict(urllib.parse.parse_qsl(cuerpo.decode("utf-8", "replace")))
                if datos.get("usuario") == "prueba" and datos.get("clave") == "aegis-1234":
                    ficha = f"s{int(time.time() * 1000)}"
                    seguro = "; Secure" if esquema == "https" else ""
                    return 303, {"Location": f"/cuenta.html?{consulta}",
                                 "Set-Cookie": f"sesion_banco={ficha}; Path=/; HttpOnly; SameSite=Lax{seguro}"}, b""
                return 303, {"Location": f"/control.html?{consulta}&error=clave"}, b""
            if accion == "cuenta":
                ficha = _cookies(cab).get("sesion_banco")
                return red.respuesta_json({"usuario": "prueba" if ficha else None, "ficha": ficha})
            if accion == "salir":
                return 303, {"Location": f"/control.html?{consulta}",
                             "Set-Cookie": "sesion_banco=; Path=/; Max-Age=0"}, b""
            if accion == "formulario":
                datos = dict(urllib.parse.parse_qsl(cuerpo.decode("utf-8", "replace") if metodo == "POST" else consulta))
                return red.respuesta_json({"metodo": metodo, "campos": datos})
            if accion == "video":
                if metodo == "POST":
                    estado.video = cuerpo
                    return red.respuesta_json({"ok": True, "bytes": len(cuerpo)})
                if not estado.video:
                    return 404, {}, b""
                return 200, {"Content-Type": "video/webm", "Accept-Ranges": "none"}, estado.video
            if accion == "js":
                clave = json.dumps(q.get("id", ""))
                return 200, {"Content-Type": "text/javascript; charset=utf-8"}, \
                    f"(window.__cargados ??= {{}})[{clave}] = true;".encode()
            if accion == "px":
                return 200, {"Content-Type": "image/gif"}, red.GIF
            if accion == "marco":
                return _pagina("marco", "<p>marco de prueba")
            return red.respuesta_neutra(destino) if metodo != "POST" else (204, cors, b"")

        if camino == "/fuentes/inter.woff2" and os.path.isfile(INTER):
            estado_, cab_, datos = red.respuesta_archivo(INTER)
            return estado_, {**cab_, "Access-Control-Allow-Origin": "*"}, datos

        # ── Redirecciones de Google (si llegan aquí es que no se han hecho directas) ──
        if (host.endswith("google.com") or host.endswith("google.es")) and camino == "/url" or \
                host.endswith("youtube.com") and camino == "/redirect":
            return _pagina("Aviso de redirección",
                           "<h1>Aviso de redirección</h1><p>La página de la redirección de Google (simulada).")

        # ── Archivos ──
        archivo = _archivo(host, camino)
        if archivo and camino == "/csp.html":
            # Una web con CSP estricta: los scripts solo de sí misma y de pagead2 (no data:), y los informes de
            # violación a este mismo servidor (así se ve si el navegador delata el bloqueador).
            estado_, cab_, datos = red.respuesta_archivo(archivo)
            informe = f"/__/csp-informe?id={urllib.parse.quote(q.get('run', ''))}.{urllib.parse.quote(q.get('fase', ''))}.informe"
            return estado_, {**cab_, "Content-Security-Policy":
                             f"script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com; report-uri {informe}"}, datos
        if archivo:
            return red.respuesta_archivo(archivo)
        if camino.endswith(".js") and destino in ("script", ""):
            return 200, {"Content-Type": "text/javascript; charset=utf-8", **cors}, b"/* banco */"
        return red.respuesta_neutra(destino) if metodo != "POST" else (204, cors, b"")

    return contestar


def _archivo(host, camino):
    if camino.endswith("/"):
        camino += "index.html"
    rel = os.path.normpath(urllib.parse.unquote(camino).lstrip("/"))
    if rel.startswith(".."):
        return None
    for base in (os.path.join(RAIZ_WEB, "sitios", host), os.path.join(RAIZ_WEB, "comun")):
        for ruta in (os.path.join(base, rel), os.path.join(base, rel + ".html")):
            # Sin extensión (https://www.google.com/search): la página .html del mismo nombre.
            if os.path.isfile(ruta) and (ruta.endswith(rel) or not os.path.splitext(rel)[1]):
                return ruta
    return None
