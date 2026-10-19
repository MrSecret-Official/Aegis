/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · Escudos, lado de la página (proceso de contenido): oculta lo que dicen las listas y ejecuta sus scriptlets.
 * Lo registra cosmetico.sys.mjs para webs http(s) en pestañas, también sus marcos (no con uBlock Origin activo).
 *
 * Al empezar cada documento (DOMDocElementInserted, antes de que la página ejecute nada):
 * 1. Pregunta al padre (una consulta por documento) y para el análisis de la página con document.blockParsing hasta
 *    tener la respuesta, como mucho TOPE_MS (si no llega, la página sigue y lo que llegue después se aplica tarde).
 * 2. Hojas de usuario (windowUtils, USER_SHEET, con !important: ganan a cualquier estilo de la página): la genérica de
 *    cada capa, analizada una vez por proceso y compartida (nsIStyleSheetService.preloadSheet + addSheet), y una con
 *    lo propio del sitio. No salen en document.styleSheets ni en el DOM.
 * 3. Scriptlets: en el mundo de la página con ChromeUtils.compileScript + executeInGlobal (lo mismo que usa Firefox
 *    para los scripts «world: MAIN» de las extensiones: la CSP de la página no los frena ni manda informes), antes que
 *    cualquier script de la página. Compilados una vez por proceso, origen y contenido.
 * 4. Si el sitio no tiene `generichide`: las reglas genéricas de clase e id (`##.anuncio`, `###banner`). Al terminar
 *    de analizar la página (DOMContentLoaded) junta sus clases e ids de una pasada y, desde ahí, con un
 *    MutationObserver, los nuevos; pregunta solo por los que no ha visto y con una sola consulta en vuelo (lo que
 *    llegue mientras tanto va en la siguiente). Añade otra hoja con lo que vuelva. Como uBlock Origin: durante el
 *    análisis no se vigila (cada elemento insertado costaría una llamada por Xray), así que un hueco genérico de clase
 *    puede verse un instante antes de DOMContentLoaded.
 * 5. Procedurales (procedural.sys.mjs): en DOMContentLoaded y, tras cambios del DOM, una vez por fotograma como mucho.
 *
 * También manda al padre qué tipos admiten data: según la CSP del documento (y otra vez si una <meta> la cambia): el
 * padre no redirige a un recurso neutro lo que la CSP bloquearía.
 *
 * Sin temporizadores en reposo: el tope del análisis vive solo mientras espera la respuesta, el observador solo
 * reacciona a cambios del DOM y nada se repite por tiempo.
 */

import { analizarSelector, comoCss, cssDeSelectores, esProcedural, INICIO_HOJA, Procedurales } from "./procedural.sys.mjs";

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  setTimeout: "resource://gre/modules/Timer.sys.mjs",
  clearTimeout: "resource://gre/modules/Timer.sys.mjs",
});

/** Lo más que se para el análisis de una página esperando al padre. */
const TOPE_MS = 1000;
/** Solo documentos HTML: ni imágenes, ni texto plano, ni el visor de PDF. */
const TIPOS = new Set(["text/html", "application/xhtml+xml"]);
/** sharedData que publica cosmetico.sys.mjs: {version, css: [hoja genérica de cada capa]}. */
const CLAVE_GENERICOS = "aegis:escudos:genericos";
/** Clases e ids por consulta como mucho (el resto va en la siguiente). */
const LOTE = 2000;
/** Scriptlets compilados que se guardan por proceso. */
const MAX_COMPILADOS = 8;

/** Bits de la máscara de la CSP (los mismos que cosmetico.sys.mjs) y las directivas que los deciden (todas a la vez). */
const CSP_DIRECTIVAS = [
  [1, ["SCRIPT_SRC_ELEM_DIRECTIVE", "SCRIPT_SRC_DIRECTIVE"]],
  [2, ["IMG_SRC_DIRECTIVE"]],
  [4, ["STYLE_SRC_ELEM_DIRECTIVE", "STYLE_SRC_DIRECTIVE"]],
  [8, ["MEDIA_SRC_DIRECTIVE"]],
  [16, ["FONT_SRC_DIRECTIVE"]],
  [32, ["CONNECT_SRC_DIRECTIVE"]],
  [64, ["FRAME_SRC_DIRECTIVE"]],
  [128, ["OBJECT_SRC_DIRECTIVE"]],
];
const CSP_TODO = 255;

let uriData = null;
/** Qué tipos de recurso admiten una dirección data: según la CSP del documento (255: todos, sin CSP). */
function mascaraCsp(doc) {
  let csp = null;
  try {
    csp = doc.policyContainer?.csp ?? null;
  } catch {}
  if (!csp || !csp.policyCount) {
    return CSP_TODO;
  }
  uriData ??= Services.io.newURI("data:text/plain,");
  let m = 0;
  for (const [bit, directivas] of CSP_DIRECTIVAS) {
    const admite = directivas.every(nombre => {
      try {
        return csp.permits(null, null, uriData, Ci.nsIContentSecurityPolicy[nombre], false, false);
      } catch {
        return false;
      }
    });
    if (admite) {
      m |= bit;
    }
  }
  return m;
}

/** Hojas genéricas preanalizadas de este proceso, de la versión del motor que las publicó. */
let genericas = { version: -1, hojas: [] };
let servicioHojas = null;

function hojaGenerica(version, capa) {
  const datos = Services.cpmm.sharedData.get(CLAVE_GENERICOS);
  if (!datos || datos.version != version) {
    return null;
  }
  if (genericas.version != version) {
    genericas = { version, hojas: [] };
  }
  if (genericas.hojas[capa] === undefined) {
    const css = datos.css?.[capa] ?? "";
    servicioHojas ??= Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
    genericas.hojas[capa] = css
      ? servicioHojas.preloadSheet(
          Services.io.newURI("data:text/css;charset=utf-8," + encodeURIComponent(INICIO_HOJA + css)),
          servicioHojas.USER_SHEET
        )
      : null;
  }
  return genericas.hojas[capa];
}

/** Scriptlets compilados: «origen\ntexto» → Promise<PrecompiledScript> (los más recientes al final). */
const compilados = new Map();

/**
 * Compila los scriptlets de un documento. Van en una función propia con `scriptletGlobals` (lo que esperan los de
 * uBlock Origin) y con el origen de la página como nombre de archivo: en una traza de error se ven como un script de
 * la propia página, nunca con la dirección de otra.
 */
function compilar(texto, origen) {
  const clave = origen + "\n" + texto;
  let p = compilados.get(clave);
  if (p) {
    compilados.delete(clave);
  } else {
    const codigo = `(function() {\nconst scriptletGlobals = {};\n${texto}\n})();\n`;
    p = ChromeUtils.compileScript("data:text/javascript;charset=utf-8," + encodeURIComponent(codigo), {
      filename: origen + "/",
      lazilyParse: true,
    });
    p.catch(() => compilados.delete(clave));
  }
  compilados.set(clave, p);
  while (compilados.size > MAX_COMPILADOS) {
    compilados.delete(compilados.keys().next().value);
  }
  return p;
}

export class AegisEscudosChild extends JSWindowActorChild {
  handleEvent(evento) {
    try {
      if (evento.type == "DOMDocElementInserted") {
        this.#empezar(evento);
      } else if (evento.type == "DOMContentLoaded") {
        if (evento.target == this.document && this.alCargar) {
          this.alCargar();
        }
      } else if (evento.type == "DOMMetaAdded") {
        this.#meta(evento);
      }
    } catch (e) {
      console.error("Aegis: Escudos (página)", e);
    }
  }

  didDestroy() {
    this.observador?.disconnect();
    this.observador = null;
    this.procedurales = null;
  }

  #empezar(evento) {
    const doc = this.document;
    if (evento.target != doc || this.empezado || !TIPOS.has(doc.contentType)) {
      return;
    }
    this.empezado = true;
    const t0 = ChromeUtils.now();
    this.csp = mascaraCsp(doc);
    let tope = null;
    let alTope = false;
    const trabajo = this.sendQuery("Aegis:Escudos:Cosmetico", { csp: this.csp, enviado: Date.now() })
      .then(r => this.#aplicar(r, t0, ChromeUtils.now(), () => alTope))
      .catch(e => {
        if (e?.name != "AbortError") {
          console.error("Aegis: Escudos (página)", e);
        }
      });
    const limite = new Promise(resolver => {
      tope = lazy.setTimeout(() => {
        alTope = true;
        resolver();
      }, TOPE_MS);
    });
    const bloqueo = Promise.race([trabajo, limite]).finally(() => lazy.clearTimeout(tope));
    if (doc.readyState != "complete") {
      try {
        doc.blockParsing(bloqueo, { blockScriptCreated: false });
      } catch {}
    }
  }

  #meta(evento) {
    const meta = evento.target;
    if (!this.empezado || meta?.ownerDocument != this.document) {
      return;
    }
    if (String(meta.httpEquiv).toLowerCase() != "content-security-policy") {
      return;
    }
    const m = mascaraCsp(this.document);
    if (m != this.csp) {
      this.csp = m;
      this.sendAsyncMessage("Aegis:Escudos:Csp", { csp: m });
    }
  }

  async #aplicar(r, t0, tRespuesta, alTope) {
    const win = this.contentWindow;
    if (!r || !win) {
      return;
    }
    const wu = win.windowUtils;
    const t1 = ChromeUtils.now();
    // Hojas: la genérica de cada capa (compartida), las genéricas recortadas por excepciones del sitio y lo propio.
    for (const capa of r.capas ?? []) {
      const hoja = hojaGenerica(r.version, capa);
      if (hoja) {
        wu.addSheet(hoja, wu.USER_SHEET);
      }
    }
    let css = "";
    for (const selectores of Object.values(r.filtrados ?? {})) {
      css += cssDeSelectores(selectores);
    }
    const procedurales = [];
    // Los selectores del sitio con operadores procedurales (llegan sin separar, ver procedural.sys.mjs) van al
    // intérprete; el resto, a la hoja.
    const normales = [];
    for (const s of r.especificos ?? []) {
      if (esProcedural(s)) {
        const selector = analizarSelector(s);
        if (selector?.length == 1 && selector[0].type == "css-selector") {
          // Al final era CSS (p. ej. :if-not() sin procedurales dentro, que pasa a :not(:has())).
          normales.push(selector[0].arg);
        } else if (selector) {
          procedurales.push({ selector });
        }
      } else {
        normales.push(s);
      }
    }
    css += cssDeSelectores(normales);
    for (const json of r.procedurales ?? []) {
      let f;
      try {
        f = JSON.parse(json);
      } catch {
        continue;
      }
      const regla = comoCss(f);
      if (regla === null) {
        procedurales.push(f);
      } else {
        css += regla;
      }
    }
    this.#hoja(css);
    const t2 = ChromeUtils.now();
    // Scriptlets, antes que la página.
    if (r.script) {
      try {
        const script = await compilar(r.script, this.document.nodePrincipal.originNoSuffix);
        if (this.contentWindow) {
          script.executeInGlobal(this.contentWindow);
        }
      } catch (e) {
        console.error("Aegis: Escudos, scriptlets", e);
      }
    }
    const t3 = ChromeUtils.now();
    if (procedurales.length) {
      this.procedurales = new Procedurales(win, procedurales);
    }
    if (r.genericos || this.procedurales) {
      // Al terminar el análisis (o ya, si ha terminado).
      this.genericos = !!r.genericos;
      if (this.document.readyState == "loading") {
        this.alCargar = () => {
          this.alCargar = null;
          this.#vigilar();
        };
      } else {
        this.#vigilar();
      }
    }
    if (r.medir) {
      this.sendAsyncMessage("Aegis:Escudos:Medida", {
        bloqueoMs: t3 - t0,
        esperaMs: tRespuesta - t0,
        tope: alTope(),
        hojasMs: t2 - t1,
        scriptMs: t3 - t2,
      });
    }
  }

  #hoja(css) {
    if (!css) {
      return;
    }
    const wu = this.contentWindow?.windowUtils;
    wu?.loadSheetUsingURIString("data:text/css;charset=utf-8," + encodeURIComponent(INICIO_HOJA + css), wu.USER_SHEET);
  }

  // ── Genéricas por clase e id y procedurales ──

  #vigilar() {
    const win = this.contentWindow;
    const doc = this.document;
    if (!win || !doc) {
      return;
    }
    const genericos = this.genericos;
    this.vistos = new Set();
    this.pendientes = [];
    this.enVuelo = false;
    this.programado = false;
    this.observador = new win.MutationObserver(registros => this.#mutaciones(registros));
    this.observador.observe(doc, {
      subtree: true,
      childList: true,
      attributes: genericos,
      attributeFilter: genericos ? ["class", "id"] : undefined,
    });
    // Lo que ya hay, de una pasada: un atributo por elemento (menos llamadas por Xray que classList).
    if (genericos) {
      for (const el of doc.querySelectorAll("[class]")) {
        this.#clases(el.getAttribute("class"));
      }
      for (const el of doc.querySelectorAll("[id]")) {
        this.#id(el.getAttribute("id"));
      }
    }
    this.#enviar();
    this.#programarProcedurales();
  }

  #clases(texto) {
    if (!texto) {
      return;
    }
    for (const c of texto.split(/\s+/)) {
      const k = "." + c;
      if (c && !this.vistos.has(k)) {
        this.vistos.add(k);
        this.pendientes.push(k);
      }
    }
  }

  #id(id) {
    const k = "#" + id;
    if (id && !this.vistos.has(k)) {
      this.vistos.add(k);
      this.pendientes.push(k);
    }
  }

  #anotar(el) {
    if (this.genericos) {
      this.#clases(el.getAttribute("class"));
      this.#id(el.getAttribute("id"));
    }
  }

  #recoger(el) {
    this.#anotar(el);
    if (this.genericos && el.firstElementChild) {
      for (const x of el.querySelectorAll("[class],[id]")) {
        this.#anotar(x);
      }
    }
  }

  #mutaciones(registros) {
    let nuevos = false;
    for (const r of registros) {
      if (r.type == "childList") {
        for (const n of r.addedNodes) {
          if (n.nodeType == 1) {
            nuevos = true;
            this.#recoger(n);
          }
        }
      } else if (r.target?.nodeType == 1) {
        this.#anotar(r.target);
      }
    }
    this.#enviar();
    if (nuevos) {
      this.#programarProcedurales();
    }
  }

  /** Una consulta en vuelo como mucho; lo que se junte mientras tanto sale al volver. */
  #enviar() {
    if (this.enVuelo || !this.pendientes?.length) {
      return;
    }
    const lote = this.pendientes.splice(0, LOTE);
    const clases = [];
    const ids = [];
    for (const k of lote) {
      (k[0] == "." ? clases : ids).push(k.slice(1));
    }
    this.enVuelo = true;
    this.sendQuery("Aegis:Escudos:Genericos", { clases, ids })
      .then(selectores => {
        if (Array.isArray(selectores) && selectores.length) {
          this.#hoja(cssDeSelectores(selectores));
        }
      })
      .catch(() => {})
      .finally(() => {
        this.enVuelo = false;
        if (this.observador) {
          this.#enviar();
        }
      });
  }

  /** Los procedurales, una vez en el siguiente fotograma (si llegan muchos cambios seguidos, una sola vez). */
  #programarProcedurales() {
    if (!this.procedurales || this.programado) {
      return;
    }
    this.programado = true;
    this.contentWindow?.requestAnimationFrame(() => {
      this.programado = false;
      try {
        this.procedurales?.aplicar();
      } catch (e) {
        console.error("Aegis: Escudos, procedurales", e);
      }
    });
  }
}
