/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · webs en oscuro, lado de la página (proceso de contenido). Lo registra webs-oscuro.sys.mjs, y solo cuando la
 * función se ha encendido alguna vez: para webs http(s) en pestañas, también sus marcos.
 *
 * Motor: el modo dinámico de Dark Reader (darkreader.js, MIT; ver NOTICE.md), en un sandbox por documento:
 * - Principal expandido con el de la página y Xrays, como un content script: ve el DOM de verdad sin ver lo que la página
 *   cambie en sus objetos, y sus <style> pasan la CSP de la página sin informes de violación (nsStyleUtil).
 * - Sin red: fetch, sessionStorage y console del sandbox son propios. El CSS que la página ya ha descargado se lee de
 *   la propia página (cssLocal) y las imágenes de fondo que Dark Reader analiza (logotipos e iconos oscuros sobre
 *   transparente, que invierte), solo de la caché HTTP (imagenLocal, LOAD_ONLY_FROM_CACHE): si no están, no se analizan.
 *   Nunca se pide nada a un servidor. <img> y <video> no se tocan, salvo lo que digan los arreglos del sitio.
 * - El «proxy» de Dark Reader (vigila insertRule y compañía en el mundo de la página) se ejecuta con un sandbox del
 *   principal de la página y sin <script> en línea: con una CSP estricta ese <script> se bloquearía, se enviaría un
 *   informe de violación al servidor y Dark Reader vigilaría las hojas con requestAnimationFrame sin parar.
 *
 * Sin temporizadores propios: eventos (DOMDocElementInserted, carga de las hojas, cambio del tema) y mensajes. Lo que
 * hace Dark Reader mientras está puesto (MutationObserver y su cola por fotogramas) solo existe en las páginas que oscurece.
 */

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  NetUtil: "resource://gre/modules/NetUtil.sys.mjs",
});

/** sharedData: {modo} que publica webs-oscuro.sys.mjs; aquí solo se lee para no preguntar con la función apagada. */
const CLAVE = "aegis:webs-oscuro";
const MOTOR = new URL("darkreader.js", import.meta.url).href;
/** Solo documentos HTML: ni PDF (el visor tiene su propio oscuro), ni imágenes, vídeo o texto plano sueltos. */
const TIPOS = new Set(["text/html", "application/xhtml+xml"]);

/** Colores de Aegis en oscuro (docs/DISENO.md §2): --aegis-bg y --aegis-text. */
const TEMA = {
  mode: 1,
  brightness: 100,
  contrast: 100,
  grayscale: 0,
  sepia: 0,
  darkSchemeBackgroundColor: "#0a0a0b",
  darkSchemeTextColor: "#f4f4f5",
};

/**
 * Único cambio sobre darkreader.js, al cargarlo: el proxy se le pasa a __aegisProxy en lugar de meterlo en un <script>.
 * Tiene que estar tal cual; si no (otra versión de Dark Reader), la función no se enciende.
 */
const SANGRIA = " ".repeat(12);
const PROXY_ORIGINAL = [
  'const proxyScript = createOrUpdateScript("darkreader--proxy");',
  "proxyScript.append(",
  "    `(${injectProxy})(${enableStyleSheetsProxy}, ${enableCustomElementRegistryProxy})`",
  ");",
  "document.head.insertBefore(proxyScript, rootVarsStyle.nextSibling);",
  "proxyScript.remove();",
]
  .map(linea => SANGRIA + linea)
  .join("\n");
const PROXY_AEGIS =
  SANGRIA + "__aegisProxy(`(${injectProxy})(${enableStyleSheetsProxy}, ${enableCustomElementRegistryProxy})`);";

/**
 * Lo que va en el sandbox antes que Dark Reader: sustituye lo que tocaría la red o dejaría rastro en la página.
 * - fetch: una dirección data: se descodifica aquí mismo (con el fetch de la página la CSP la bloquearía y podría
 *   mandar un informe de violación); otra dirección, solo si es CSS que la página ya tiene (__aegisCss) o una imagen
 *   que está en la caché (__aegisImagen). Nada más.
 * - sessionStorage: Dark Reader guarda ahí una caché que la página podría leer; aquí no guarda nada.
 * - console: sin mensajes en la consola de la web.
 * - chrome: Dark Reader se monta ahí su mensajería de extensión.
 */
const PREPARACION = `
var chrome = {};
var console = new Proxy({}, { get: () => () => {} });
var sessionStorage = { getItem: () => null, setItem() {}, removeItem() {} };
var fetch = async function (recurso) {
  const url = String(recurso);
  const respuesta = (tipo, blob) => ({
    ok: true,
    status: 200,
    statusText: "",
    redirected: false,
    url,
    headers: { get: nombre => (String(nombre).toLowerCase() == "content-type" ? tipo : null) },
    text: () => blob.text(),
    blob: async () => blob,
  });
  if (url.startsWith("data:")) {
    const coma = url.indexOf(",");
    const cabecera = url.slice(5, coma);
    const base64 = /;base64$/i.test(cabecera);
    const tipo = cabecera.replace(/;base64$/i, "").split(";")[0] || "text/plain";
    const datos = decodeURIComponent(url.slice(coma + 1));
    const bytes = base64 ? Uint8Array.from(atob(datos), c => c.charCodeAt(0)) : new TextEncoder().encode(datos);
    return respuesta(tipo, new Blob([bytes], { type: tipo }));
  }
  const css = __aegisCss(url);
  if (css != null) {
    return respuesta("text/css", new Blob([css], { type: "text/css" }));
  }
  const [tipo, binario] = await new Promise(listo => __aegisImagen(url, (t, b) => listo([t, b])));
  if (binario == null) {
    throw new Error("Aegis: las webs en oscuro no usan la red");
  }
  return respuesta(tipo, new Blob([Uint8Array.from(binario, c => c.charCodeAt(0))], { type: tipo }));
};
`;

/** @type {Promise<PrecompiledScript>|null} darkreader.js compilado, una vez por proceso y solo si hace falta. */
let motor = null;

function cargarMotor() {
  motor ??= (async () => {
    const fuente = await (await fetch(MOTOR)).text();
    if (fuente.split(PROXY_ORIGINAL).length != 2) {
      throw new Error("Aegis: darkreader.js no es la versión esperada (cambio del proxy)");
    }
    const cambiada = fuente.replace(PROXY_ORIGINAL, () => PROXY_AEGIS);
    return ChromeUtils.compileScript("data:text/javascript;charset=utf-8," + encodeURIComponent(cambiada));
  })().catch(e => {
    motor = null; // se vuelve a intentar la próxima vez
    throw e;
  });
  return motor;
}

/** Luminancia relativa (WCAG) de {r, g, b} en 0–255. */
function luminancia({ r, g, b }) {
  const canal = c => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

/** Fondo opaco (o casi) de un elemento, o null si es transparente. Admite cualquier sintaxis de color (oklch…). */
function fondo(win, el) {
  const color = InspectorUtils.colorToRGBA(win.getComputedStyle(el).backgroundColor);
  return color && color.a >= 0.5 ? color : null;
}

/**
 * ¿La página ya se ve en oscuro por sí misma? Se mira con el tema oscuro puesto (prefers-color-scheme: dark), así que
 * una web que lo respeta ya ha cambiado sus colores. En orden:
 * 0. Lo que sabe Dark Reader del sitio (arreglos.sys.mjs): oscuro de serie (dark-sites.config) o una pista
 *    (detector-hints.config): «no tiene modo oscuro», «sigue al sistema» o «está puesto si la raíz tiene tal clase».
 *    Si la pista dice que no está puesto, se sigue mirando: el sitio puede oscurecerse por CSS sin esa clase.
 * 1. <meta name="darkreader-lock">: la web pide que no se le aplique Dark Reader.
 * 2. El fondo de la raíz o del cuerpo, si tienen uno.
 * 3. Si los dos son transparentes, el primer fondo desde el centro de la ventana hacia arriba (aplicaciones que pintan
 *    su propio contenedor) y, si no hay ninguno, el lienzo: oscuro si la página declara color-scheme con «dark».
 * Oscuro = luminancia por debajo de 0,2 (un gris medio, #7c7c7c, ronda 0,2).
 *
 * @param {Window} win
 * @param {{pista: object?, oscuroDeSerie: boolean}} sitio
 */
function tieneModoOscuro(win, { pista, oscuroDeSerie }) {
  const doc = win.document;
  if (oscuroDeSerie || pista?.systemTheme) {
    return true;
  }
  if (pista?.noDarkTheme) {
    return false;
  }
  const objetivo = pista?.target ? doc.querySelector(pista.target) : null;
  const coincide = selector => {
    try {
      return objetivo.matches(selector) || !!objetivo.querySelector(selector);
    } catch {
      return false; // selector que este motor no entiende
    }
  };
  if (objetivo && pista.match.some(coincide)) {
    return true;
  }
  if (doc.querySelector('meta[name="darkreader-lock"]')) {
    return true;
  }
  const raiz = doc.documentElement;
  const color = fondo(win, raiz) ?? (doc.body ? fondo(win, doc.body) : null) ?? fondoVisible(win);
  if (color) {
    return luminancia(color) < 0.2;
  }
  // Sin ningún fondo opaco (degradados o imágenes): si el texto del centro es claro, la página es oscura.
  const texto = textoDelCentro(win);
  if (texto) {
    return luminancia(texto) > 0.6;
  }
  return /\bdark\b/.test(win.getComputedStyle(raiz).colorScheme);
}

/**
 * Primer fondo opaco que se ve en tres puntos de la ventana (centro, arriba y abajo), mirando todas las capas
 * apiladas en cada punto (elementsFromPoint) y no solo los padres: muchas webs pintan el fondo en una capa fija aparte,
 * detrás del contenido (spicetify.app), que no es antecesora de lo que hay en el centro. Gana el que más se repite.
 *
 * @param {Window} win
 */
function fondoVisible(win) {
  const puntos = [0.5, 0.25, 0.75].map(y => [win.innerWidth / 2, win.innerHeight * y]);
  const vistos = [];
  for (const [x, y] of puntos) {
    for (const el of win.document.elementsFromPoint(x, y)) {
      const color = fondo(win, el);
      if (color) {
        vistos.push(color);
        break;
      }
    }
  }
  if (!vistos.length) {
    return null;
  }
  const oscuros = vistos.filter(c => luminancia(c) < 0.2);
  return oscuros.length * 2 >= vistos.length ? oscuros[0] : vistos.find(c => luminancia(c) >= 0.2);
}

/** Color del texto del elemento que hay en el centro de la ventana, si hay alguno con texto. */
function textoDelCentro(win) {
  const el = win.document.elementFromPoint(win.innerWidth / 2, win.innerHeight / 2);
  if (!el?.textContent?.trim()) {
    return null;
  }
  const color = InspectorUtils.colorToRGBA(win.getComputedStyle(el).color);
  return color && color.a >= 0.5 ? color : null;
}

/**
 * ¿Hoja de estilos que todavía se está descargando? Sin hoja todavía (salvo las desactivadas o alternativas, que no se
 * cargan), o con una hoja incompleta (su cssRules lanza).
 */
function cargando(link) {
  if (!link.sheet) {
    return !link.disabled && !/\balternate\b/i.test(link.rel);
  }
  try {
    link.sheet.cssRules;
    return false;
  } catch {
    return true;
  }
}

/**
 * tieneModoOscuro() con Dark Reader ya puesto: sus hojas (todas llevan la clase «darkreader») se desactivan un momento
 * para ver la página como es. Es síncrono, así que no llega a pintarse nada entre medias.
 *
 * @param {Window} win
 * @param {object} sitio
 */
function tieneModoOscuroBajoElMotor(win, sitio) {
  const hojas = Array.from(win.document.querySelectorAll("style.darkreader"), s => s.sheet).filter(h => h && !h.disabled);
  for (const hoja of hojas) {
    hoja.disabled = true;
  }
  try {
    return tieneModoOscuro(win, sitio);
  } finally {
    for (const hoja of hojas) {
      hoja.disabled = false;
    }
  }
}

/**
 * Se resuelve cuando la página tiene su CSS: tras DOMContentLoaded y cuando acaban las hojas <link> pendientes (o, como
 * mucho, en «load»). Solo eventos.
 *
 * @param {Window} win
 */
function estilosListos(win) {
  return new Promise(resolver => {
    const doc = win.document;
    const comprobar = () => {
      if (doc.readyState == "loading") {
        win.addEventListener("DOMContentLoaded", comprobar, { once: true });
        return;
      }
      const pendientes = Array.from(doc.querySelectorAll('link[rel~="stylesheet" i]')).filter(cargando);
      if (!pendientes.length || doc.readyState == "complete") {
        resolver();
        return;
      }
      let quedan = pendientes.length;
      const una = () => {
        if (--quedan == 0) {
          resolver();
        }
      };
      for (const link of pendientes) {
        link.addEventListener("load", una, { once: true });
        link.addEventListener("error", una, { once: true });
      }
      win.addEventListener("load", () => resolver(), { once: true });
    };
    comprobar();
  });
}

/**
 * Se resuelve con el evento «load» de la página, o en el acto si ya ha cargado. Solo eventos.
 *
 * @param {Window} win
 */
function cargada(win) {
  return new Promise(resolver => {
    if (win.document.readyState == "complete") {
      resolver();
    } else {
      win.addEventListener("load", () => resolver(), { once: true });
    }
  });
}

/**
 * CSS ya descargado de una hoja de la página, para que Dark Reader no tenga que volver a pedirlo. Este módulo puede leer
 * las reglas de una hoja de otro origen; Dark Reader las copia a la página (como hace con lo que descarga), así que solo
 * se entregan si eso no le enseña a la página nada privado:
 * - hoja del mismo sitio que la página; o
 * - de otro sitio con las cookies de terceros aisladas por sitio o bloqueadas (cookieBehavior 1, 2 o 5, como en Aegis):
 *   entonces la petición no llevó tu sesión de ese otro sitio.
 * Dark Reader ya descarta antes las direcciones locales, por IP, con puerto o sin https (shouldIgnoreCors).
 *
 * @param {Window} win
 * @param {string} url
 * @returns {string|null}
 */
function cssLocal(win, url) {
  if (!copiable(win.document, url)) {
    return null;
  }
  const doc = win.document;
  const pila = Array.from(doc.styleSheets);
  let hoja = null;
  while (pila.length && !hoja) {
    const h = pila.pop();
    let reglas;
    try {
      reglas = h.cssRules;
    } catch {
      continue; // todavía cargando
    }
    if (h.href == url) {
      hoja = h;
      break;
    }
    for (const regla of reglas) {
      if (regla.styleSheet) {
        pila.push(regla.styleSheet); // @import
      }
    }
  }
  if (!hoja) {
    return null;
  }
  try {
    return Array.from(hoja.cssRules, regla => regla.cssText).join("\n");
  } catch {
    return null;
  }
}

/**
 * ¿Se puede dar a Dark Reader (y, a través de lo que genera, a la página) algo de esta dirección? Ver cssLocal.
 *
 * @param {Document} doc
 * @param {string} url
 */
function copiable(doc, url) {
  try {
    const terceros = doc.nodePrincipal.isThirdPartyURI(Services.io.newURI(url));
    return !terceros || [1, 2, 5].includes(doc.cookieJarSettings?.cookieBehavior);
  } catch {
    return false;
  }
}

/** Tope de una imagen para analizarla (Dark Reader no filtra las grandes de todas formas). */
const MAX_IMAGEN = 1024 * 1024;

/**
 * Una imagen que la página ya ha descargado, sacada de la caché HTTP y nunca de la red: el canal lleva
 * LOAD_ONLY_FROM_CACHE (si no está en la caché, falla sin conectar) y VALIDATE_NEVER, y sale del documento (loadingNode),
 * así que usa su misma partición de caché. Solo imágenes, solo copiables (ver copiable) y de 1 MB como mucho.
 *
 * @param {Window} win
 * @param {string} url
 * @param {(tipo: string?, binario: string?) => void} listo
 */
function imagenLocal(win, url, listo) {
  const doc = win.document;
  let uri;
  try {
    uri = Services.io.newURI(url);
  } catch {
    listo(null, null);
    return;
  }
  if (!(uri.schemeIs("https") || uri.schemeIs("http")) || !copiable(doc, url)) {
    listo(null, null);
    return;
  }
  let canal;
  try {
    canal = lazy.NetUtil.newChannel({
      uri,
      loadingNode: doc,
      securityFlags: Ci.nsILoadInfo.SEC_ALLOW_CROSS_ORIGIN_SEC_CONTEXT_IS_NULL,
      contentPolicyType: Ci.nsIContentPolicy.TYPE_INTERNAL_IMAGE,
    });
    canal.loadFlags |=
      Ci.nsIRequest.LOAD_FROM_CACHE |
      Ci.nsICachingChannel.LOAD_ONLY_FROM_CACHE |
      Ci.nsIRequest.VALIDATE_NEVER |
      Ci.nsIRequest.LOAD_BACKGROUND;
  } catch {
    listo(null, null);
    return;
  }
  lazy.NetUtil.asyncFetch(canal, (flujo, estado) => {
    try {
      const tipo = canal.contentType;
      const n = Components.isSuccessCode(estado) ? flujo.available() : 0;
      if (!n || n > MAX_IMAGEN || !tipo.startsWith("image/")) {
        listo(null, null);
        return;
      }
      listo(tipo, lazy.NetUtil.readInputStreamToString(flujo, n));
    } catch {
      listo(null, null);
    }
  });
}

export class AegisWebsOscuroChild extends JSWindowActorChild {
  /** Cada evaluación nueva deja sin efecto las anteriores que estén esperando. */
  #turno = 0;
  #modo = "apagado";
  /** Lo que manda el padre para este documento: arreglos de Dark Reader y pistas del detector. */
  #sitio = { arreglos: null, pista: null, oscuroDeSerie: false };
  /** Sandbox de Dark Reader (principal expandido) y el del mundo de la página (proxy). */
  #sandbox = null;
  #mundo = null;
  #activo = false;
  /** Resultado de tieneModoOscuro() en este documento (undefined: sin mirar). */
  #propio = undefined;
  /** Si #propio se miró con la página ya cargada (evento load): entonces no hay que volver a mirarlo. */
  #propioFinal = false;
  /** MediaQueryList del tema mientras la función está encendida en esta página. */
  #tema = null;
  #alCambiarTema = () => this.#decidir(++this.#turno);
  /** Último estado enviado al padre (solo el documento principal de la pestaña). */
  #estado = null;

  handleEvent(evento) {
    if (evento.type == "DOMDocElementInserted" && evento.target == this.document) {
      this.#evaluar();
    }
  }

  receiveMessage({ name, data }) {
    if (name == "AegisWebsOscuro:reevaluar") {
      this.#evaluar(data?.modo);
    }
  }

  didDestroy() {
    this.#turno++;
    this.#escucharTema(false);
    for (const sandbox of [this.#sandbox, this.#mundo]) {
      if (sandbox) {
        Cu.nukeSandbox(sandbox);
      }
    }
    this.#sandbox = this.#mundo = null;
    this.#activo = false;
  }

  /** Web http(s) en HTML con un principal de contenido (deja fuera el visor de PDF y los documentos sueltos). */
  #aplicable() {
    const doc = this.document;
    const principal = doc?.nodePrincipal;
    return (
      !!principal?.isContentPrincipal &&
      (principal.schemeIs("http") || principal.schemeIs("https")) &&
      TIPOS.has(doc.contentType)
    );
  }

  /** @param {string} [modoDado] el que manda el padre al cambiar la pref o una excepción */
  async #evaluar(modoDado) {
    const turno = ++this.#turno;
    const modo = modoDado ?? Services.cpmm.sharedData.get(CLAVE)?.modo ?? "apagado";
    if (modo == "apagado" || !this.#aplicable()) {
      this.#apagar("apagado");
      return;
    }
    let respuesta;
    try {
      respuesta = await this.sendQuery("AegisWebsOscuro:consulta");
    } catch {
      return; // el documento ya no está
    }
    if (turno != this.#turno) {
      return;
    }
    this.#modo = respuesta?.modo ?? "apagado";
    this.#sitio = {
      arreglos: respuesta?.arreglos ?? null,
      pista: respuesta?.pista ?? null,
      oscuroDeSerie: !!respuesta?.oscuroDeSerie,
    };
    if (this.#modo == "apagado" || !respuesta.aplicar) {
      this.#apagar(this.#modo == "apagado" ? "apagado" : "excepcion");
      return;
    }
    this.#escucharTema(true);
    await this.#decidir(turno);
  }

  /** Con la función encendida en esta página: oscurecer o no según el tema y, si hace falta, la propia página. */
  async #decidir(turno) {
    const win = this.contentWindow;
    if (!win) {
      return;
    }
    if (!win.matchMedia("(prefers-color-scheme: dark)").matches) {
      this.#quitar();
      this.#informar("claro");
      return;
    }
    if (this.#modo == "sin_modo_oscuro") {
      if (this.#propio === undefined) {
        this.#quitar(); // se mira la página sin el motor puesto
        await estilosListos(win);
        if (turno != this.#turno || !this.contentWindow) {
          return;
        }
        this.#propio = tieneModoOscuro(win, this.#sitio);
        this.#propioFinal = win.document.readyState == "complete";
      }
      if (this.#propio) {
        this.#quitar();
        this.#informar("propio");
        return;
      }
    }
    let script;
    try {
      script = await cargarMotor();
    } catch (e) {
      console.error("Aegis: webs en oscuro", e);
      return;
    }
    if (turno != this.#turno || !this.contentWindow) {
      return;
    }
    try {
      this.#poner(script);
      this.#informar("aplicado");
    } catch (e) {
      console.error("Aegis: webs en oscuro", e);
      return;
    }
    // «Sin modo oscuro»: si se miró antes de acabar la carga, se vuelve a mirar con el evento load, con las hojas del motor
    // apartadas un momento. Hay webs que ponen su tema oscuro con un script que llega después de DOMContentLoaded
    // (Cloudflare Rocket Loader retrasa así todos los scripts: spicetify.app); si ya es oscura, se quita el motor.
    if (this.#modo == "sin_modo_oscuro" && !this.#propioFinal) {
      await cargada(win);
      if (turno != this.#turno || !this.contentWindow || !this.#activo) {
        return;
      }
      this.#propio = tieneModoOscuroBajoElMotor(win, this.#sitio);
      this.#propioFinal = true;
      if (this.#propio) {
        this.#quitar();
        this.#informar("propio");
      }
      return;
    }
    // «Todas»: se oscurece en el acto, sin esperar. Si luego resulta que la página ya era oscura por sí misma (GitHub, por
    // ejemplo), se sigue con los colores de Aegis pero sin los arreglos de Dark Reader: están pensados para la versión
    // clara del sitio (invertir un título o la regla común de ::placeholder) y en la oscura la estropean.
    if (this.#modo == "todas" && this.#propio === undefined && this.#sitio.arreglos) {
      await estilosListos(win);
      if (turno != this.#turno || !this.contentWindow || !this.#activo) {
        return;
      }
      this.#propio = tieneModoOscuroBajoElMotor(win, this.#sitio);
      this.#propioFinal = win.document.readyState == "complete";
      if (this.#propio) {
        this.#quitar();
        try {
          this.#poner(script);
        } catch (e) {
          console.error("Aegis: webs en oscuro", e);
        }
      }
    }
  }

  #apagar(estado) {
    this.#escucharTema(false);
    this.#quitar();
    this.#informar(estado);
  }

  /** Escucha los cambios del tema (claro ↔ oscuro) solo mientras la función está encendida en esta página. */
  #escucharTema(si) {
    if (si && !this.#tema) {
      this.#tema = this.contentWindow.matchMedia("(prefers-color-scheme: dark)");
      this.#tema.addEventListener("change", this.#alCambiarTema);
    } else if (!si && this.#tema) {
      this.#tema.removeEventListener("change", this.#alCambiarTema);
      this.#tema = null;
    }
  }

  /** @param {PrecompiledScript} script */
  #poner(script) {
    if (this.#activo) {
      return;
    }
    if (!this.#sandbox) {
      const win = this.contentWindow;
      const sandbox = Cu.Sandbox([win.document.nodePrincipal], {
        sandboxName: "Aegis · webs en oscuro",
        sandboxPrototype: win,
        sameZoneAs: win,
        wantXrays: true,
        wantComponents: false,
        wantExportHelpers: false,
      });
      Cu.exportFunction(url => cssLocal(win, String(url)), sandbox, { defineAs: "__aegisCss" });
      Cu.exportFunction((url, listo) => imagenLocal(win, String(url), listo), sandbox, { defineAs: "__aegisImagen" });
      Cu.exportFunction(codigo => this.#proxy(String(codigo)), sandbox, { defineAs: "__aegisProxy" });
      Cu.evalInSandbox(PREPARACION, sandbox, null, "aegis-webs-oscuro-preparacion.js", 1);
      script.executeInGlobal(sandbox);
      Cu.evalInSandbox("DarkReader.setFetchMethod(fetch);", sandbox);
      this.#sandbox = sandbox;
    }
    // Los arreglos del sitio (arreglos.sys.mjs) van como JSON: datos, no código. En una página que ya era oscura, ninguno.
    const arreglos = JSON.stringify(this.#propio ? null : this.#sitio.arreglos);
    Cu.evalInSandbox(`DarkReader.enable(${JSON.stringify(TEMA)}, ${arreglos});`, this.#sandbox);
    this.#activo = true;
  }

  #quitar() {
    if (this.#activo && this.#sandbox) {
      try {
        Cu.evalInSandbox("DarkReader.disable();", this.#sandbox);
      } catch (e) {
        console.error("Aegis: webs en oscuro", e);
      }
    }
    this.#activo = false;
  }

  /**
   * El proxy de Dark Reader, en el mundo de la página: un sandbox con el principal de la página y sin Xrays, así que sus
   * cambios en CSSStyleSheet y compañía son los de la página. Lo que ejecuta es el propio injectProxy de darkreader.js.
   *
   * @param {string} codigo
   */
  #proxy(codigo) {
    const win = this.contentWindow;
    if (!win) {
      return;
    }
    this.#mundo ??= Cu.Sandbox(win.document.nodePrincipal, {
      sandboxName: "Aegis · webs en oscuro (página)",
      sandboxPrototype: win,
      sameZoneAs: win,
      wantXrays: false,
      wantComponents: false,
      wantExportHelpers: false,
    });
    Cu.evalInSandbox(codigo, this.#mundo, null, "aegis-webs-oscuro-proxy.js", 1);
  }

  /** Para el panel de Escudos: qué ha pasado en el documento principal de la pestaña. */
  #informar(estado) {
    if (this.browsingContext.parent || estado == this.#estado) {
      return;
    }
    this.#estado = estado;
    try {
      this.sendAsyncMessage("AegisWebsOscuro:estado", { estado });
    } catch {
      // el documento ya no está
    }
  }
}
