/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · Ajustes › Escudos: una categoría propia de about:preferences (#escudos), en el grupo de Privacidad.
 *
 * - Nivel (Normal, Estricto, Estricto+), con una línea honesta de cada uno.
 * - Molestias: los tres interruptores generales (los mismos del panel de Escudos).
 * - Contador: peticiones u orígenes.
 * - Listas de filtros: las activas, la última actualización, «Actualizar ahora», la actualización automática (depende
 *   del permiso «Listas de protección» de Conexiones) y su intervalo.
 * - Excepciones por sitio (escudos/excepciones.sys.mjs): la lista de sitios y, para cada uno, «Permitir todo» (la
 *   excepción de Firefox, la del interruptor del panel) o grupo a grupo, con la herencia a la vista: un grupo apagado en
 *   general se ve como «Permitido por ajuste general», desactivado y con el motivo. En una ventana privada, la página
 *   trabaja con las excepciones de la sesión privada.
 *
 * Cómo entra en about:preferences sin parches: una categoría como las antiguas de Firefox (un elemento con
 * data-category="paneEscudos" dentro de #mainPrefPane, su botón moz-page-nav-button y register_module de
 * preferences.js). Se registra en DOMContentLoaded antes que init_all() de preferences.js, así about:preferences#escudos
 * abre directamente aquí. El contenido se construye la primera vez que se enseña.
 *
 * Ligero: sin temporizadores; solo observadores de prefs y de permisos mientras la página está abierta.
 */

import { AegisEscudosExcepciones as Ex } from "./excepciones.sys.mjs";

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  AegisConexiones: new URL("../conexiones.sys.mjs", import.meta.url).href,
  AegisEscudosAyuda: new URL("../escudos-ayuda.sys.mjs", import.meta.url).href,
  AegisEscudosListas: new URL("listas.sys.mjs", import.meta.url).href,
});

const VISTA = "paneEscudos";
const ICONO = new URL("../estilos/iconos/escudo.svg", import.meta.url).href;
const URL_CATALOGO = new URL("catalogo.json", import.meta.url).href;

const PREF_CATEGORIA = "browser.contentblocking.category";
const PREF_ESTRICTO_MAS = "aegis.escudos.estricto_mas";
const PREF_CONTADOR = "aegis.escudos.contador";
const PREF_ACTUALIZAR = "aegis.escudos.listas.actualizar";
const PREF_INTERVALO = "aegis.escudos.listas.intervalo";
const PREF_ACEPTADAS = "aegis.conexiones.aceptadas";
const PREF_GRUPO_LISTAS = "aegis.conexiones.listas";

/** Nivel → parte del id de Fluent. */
const NIVELES = [
  ["standard", "normal"],
  ["strict", "estricto"],
  ["strict+", "estricto-mas"],
];
/** Molestias: grupo de las excepciones, pref general y parte del id de Fluent. */
const MOLESTIAS = [
  ["cookies-avisos", "aegis.escudos.molestias.cookies", "cookies"],
  ["molestias", "aegis.escudos.molestias.ventanas", "ventanas"],
  ["antiadblock", "aegis.escudos.molestias.antiadblock", "antiadblock"],
];
const CONTADORES = ["peticiones", "origenes"];
const INTERVALOS = [1, 2, 4, 7];
/** Lo que se vigila para repintar: prefs (por prefijo o nombre). */
const PREFS_VIGILADAS = [
  PREF_CATEGORIA,
  PREF_ESTRICTO_MAS,
  PREF_CONTADOR,
  "aegis.escudos.molestias.",
  "aegis.escudos.listas.",
  "aegis.conexiones.",
];

/** Prefs que cambian qué listas se usan (el nivel y las molestias). */
const PREFS_DE_LISTAS = /^(browser\.contentblocking\.category|aegis\.escudos\.(estricto_mas|molestias\.))/;

/** Sitio que hay que enseñar al abrir la página (lo pone el panel con «Excepciones de este sitio…»). */
let pendiente = null;

let localizacion;
/**
 * Textos de Aegis con su propio Localization síncrono (nunca en el document.l10n de la página: si aegis.ftl fallara,
 * Fluent dejaría sin traducir los Ajustes enteros).
 *
 * @returns {{value: string, attributes: Record<string, string>}}
 */
function texto(id, args) {
  localizacion ??= new Localization(["aegis.ftl", "branding/brand.ftl"], true);
  const [m] = localizacion.formatMessagesSync([{ id, args }]);
  return {
    value: m?.value ?? "",
    attributes: Object.fromEntries((m?.attributes ?? []).map(a => [a.name, a.value])),
  };
}
const t = (id, args) => texto(id, args).value;

let catalogo = null;
async function nombresDeListas() {
  if (!catalogo) {
    try {
      const listas = (await (await fetch(URL_CATALOGO)).json()).listas ?? [];
      catalogo = new Map(listas.map(l => [l.id, l]));
    } catch {
      catalogo = new Map();
    }
  }
  return catalogo;
}

function nivelActual() {
  const categoria = Services.prefs.getStringPref(PREF_CATEGORIA, "standard");
  return categoria == "strict" && Services.prefs.getBoolPref(PREF_ESTRICTO_MAS, true) ? "strict+" : categoria;
}

/** Como el panel: primero la lista extra y luego la categoría (listas.sys.mjs recompila una sola vez). */
function ponerNivel(valor) {
  if (valor != "standard") {
    Services.prefs.setBoolPref(PREF_ESTRICTO_MAS, valor == "strict+");
  }
  Services.prefs.setStringPref(PREF_CATEGORIA, valor == "strict+" ? "strict" : valor);
}

/** Permiso de Conexiones para pedir listas (la bienvenida aceptada con «Listas de protección»). */
const conexionesPermiten = () =>
  Services.prefs.getBoolPref(PREF_ACEPTADAS, false) && Services.prefs.getBoolPref(PREF_GRUPO_LISTAS, false);

function fecha(iso, conHora = false) {
  const d = iso ? new Date(iso) : null;
  if (!d || isNaN(d)) {
    return "";
  }
  return new Intl.DateTimeFormat(Services.locale.appLocaleAsBCP47, {
    dateStyle: "medium",
    ...(conHora ? { timeStyle: "short" } : {}),
  }).format(d);
}

// ── La página ──────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Todo lo de una página de Ajustes: se construye al enseñarla por primera vez.
 */
class Pagina {
  constructor(doc, contenedor) {
    this.doc = doc;
    this.win = doc.defaultView;
    this.contenedor = contenedor;
    this.privada = !!this.win.browsingContext?.usePrivateBrowsing;
    this.hecha = false;
    /** Sitio abierto en el editor (o null) y sitios añadidos a mano que aún no tienen ninguna excepción. */
    this.abierto = null;
    this.nuevos = new Set();
    this.actualizando = false;
    this.resultado = null;
    this.verListas = false;
    this.repintar = this.repintar.bind(this);
  }

  el(etiqueta, props = {}, ...hijos) {
    const el = this.doc.createElement(etiqueta);
    for (const [k, v] of Object.entries(props)) {
      if (k.startsWith("aria-") || k.startsWith("data-") || k == "role" || k == "for") {
        el.setAttribute(k, v);
      } else {
        el[k] = v;
      }
    }
    el.append(...hijos.filter(x => x != null));
    return el;
  }

  /** «Más información» a una sección de about:escudos. */
  ayuda(tema) {
    const m = texto(`aegis-ayuda-${tema}`);
    const a = this.el("a", { className: "aegis-ayuda-enlace", href: `${lazy.AegisEscudosAyuda.DIRECCION}#${tema}` }, m.value);
    if (m.attributes["aria-label"]) {
      a.setAttribute("aria-label", m.attributes["aria-label"]);
    }
    a.addEventListener("click", e => {
      e.preventDefault();
      lazy.AegisEscudosAyuda.abrir(this.win, tema);
    });
    return a;
  }

  /** Etiqueta de sección, descripción (con «Más información») y el contenido. */
  bloque(id, titulo, descripcion, tema, ...contenido) {
    const h = this.el("h2", { className: "aegis-huella-seccion", id: `${id}-titulo` }, t(titulo));
    const p = this.el("p", { className: "aegis-huella-ayuda", id: `${id}-ayuda` }, t(descripcion));
    if (tema) {
      p.append(" ", this.ayuda(tema));
    }
    return this.el("div", { className: "aegis-escudos-aj-bloque", id }, h, p, ...contenido);
  }

  /** Fila de 44 con nombre, detalle y un interruptor (casilla con role=switch, como Google). */
  filaInterruptor(id, nombre, detalle, alCambiar) {
    const interruptor = this.el("input", {
      type: "checkbox",
      id: `${id}-interruptor`,
      className: "aegis-interruptor-ajustes",
      role: "switch",
      "aria-labelledby": `${id}-nombre`,
      "aria-describedby": `${id}-detalle`,
    });
    interruptor.addEventListener("change", () => alCambiar(interruptor.checked));
    const nombreEl = this.el("span", { className: "aegis-tor-nombre", id: `${id}-nombre` }, nombre);
    const detalleEl = this.el("span", { className: "aegis-tor-detalle", id: `${id}-detalle` }, detalle ?? "");
    const textos = this.el("label", { className: "aegis-tor-textos", htmlFor: interruptor.id }, nombreEl, detalleEl);
    const fila = this.el("div", { className: "aegis-tor-fila", id }, textos, interruptor);
    return Object.assign(fila, { interruptor, nombreEl, detalleEl });
  }

  /** Botón secundario compacto (30 de alto, el «Quitar» de Caja fuerte; desactivado, opacidad 0,28 como en Tor). */
  boton(id, alPulsar, args) {
    const m = texto(id, args);
    const b = this.el("button", { className: "aegis-huella-quitar aegis-tor-boton", type: "button" }, m.value);
    if (m.attributes["aria-label"]) {
      b.setAttribute("aria-label", m.attributes["aria-label"]);
    }
    b.addEventListener("click", alPulsar);
    return b;
  }

  /** Segmentos (DISENO §9) como los de «Webs en oscuro». */
  segmentos(nombre, opciones, etiquetadoPor, alElegir) {
    const caja = this.el("div", {
      className: "aegis-oscuro-segmentos aegis-escudos-aj-segmentos",
      role: "radiogroup",
      "aria-labelledby": etiquetadoPor,
    });
    for (const [valor, etiqueta] of opciones) {
      const radio = this.el("input", { type: "radio", name: nombre, value: String(valor) });
      caja.append(this.el("label", { className: "aegis-oscuro-segmento" }, radio, this.el("span", {}, etiqueta)));
    }
    caja.addEventListener("change", e => alElegir(e.target.value));
    caja.poner = valor => {
      for (const r of caja.querySelectorAll("input")) {
        r.checked = r.value == String(valor);
      }
    };
    return caja;
  }

  construir() {
    if (this.hecha) {
      return;
    }
    this.hecha = true;
    const cabecera = this.el("moz-page-header", {});
    cabecera.setAttribute("heading", t("aegis-ajustes-escudos"));
    cabecera.setAttribute("description", t("aegis-ajustes-escudos-descripcion"));
    const seccion = this.el(
      "section",
      {},
      cabecera,
      this.construirNivel(),
      this.construirMolestias(),
      this.construirContador(),
      this.construirListas(),
      this.construirExcepciones()
    );
    this.contenedor.append(seccion);

    for (const pref of PREFS_VIGILADAS) {
      Services.prefs.addObserver(pref, this.repintar);
    }
    Services.obs.addObserver(this.repintar, Ex.TEMA);
    this.win.addEventListener(
      "unload",
      () => {
        for (const pref of PREFS_VIGILADAS) {
          Services.prefs.removeObserver(pref, this.repintar);
        }
        Services.obs.removeObserver(this.repintar, Ex.TEMA);
      },
      { once: true }
    );
    this.repintar();
    this.pintarListas();
  }

  // ── Nivel ──

  construirNivel() {
    const opciones = this.el("div", {
      className: "aegis-huella-opciones",
      role: "radiogroup",
      "aria-labelledby": "aegis-escudos-aj-nivel-titulo",
      "aria-describedby": "aegis-escudos-aj-nivel-ayuda",
    });
    for (const [valor, nombre] of NIVELES) {
      const radio = this.el("input", { type: "radio", name: "aegis-escudos-nivel", value: valor });
      const descripcion = this.el(
        "span",
        { className: "aegis-huella-opcion-descripcion", id: `aegis-escudos-aj-nivel-${nombre}-descripcion` },
        t(`aegis-ajustes-escudos-nivel-${nombre}-descripcion`)
      );
      radio.setAttribute("aria-describedby", descripcion.id);
      const textos = this.el(
        "span",
        { className: "aegis-huella-opcion-textos" },
        this.el("span", { className: "aegis-huella-opcion-nombre" }, t(`aegis-ajustes-escudos-nivel-${nombre}`)),
        descripcion
      );
      opciones.append(this.el("label", { className: "aegis-huella-opcion" }, radio, textos));
    }
    opciones.addEventListener("change", e => ponerNivel(e.target.value));
    this.nivel = opciones;
    this.notaPersonalizado = this.el(
      "p",
      { className: "aegis-huella-nota", hidden: true },
      t("aegis-ajustes-escudos-nivel-personalizado")
    );
    const tarjeta = this.el(
      "div",
      { className: "aegis-huella-tarjeta" },
      opciones,
      this.notaPersonalizado,
      this.el("p", { className: "aegis-huella-nota" }, t("aegis-ajustes-escudos-nivel-nota"))
    );
    return this.bloque(
      "aegis-escudos-aj-nivel",
      "aegis-ajustes-escudos-nivel-titulo",
      "aegis-ajustes-escudos-nivel-descripcion",
      "nivel",
      tarjeta
    );
  }

  // ── Molestias ──

  construirMolestias() {
    const tarjeta = this.el("div", {
      className: "aegis-huella-tarjeta",
      role: "group",
      "aria-labelledby": "aegis-escudos-aj-molestias-titulo",
    });
    this.molestias = MOLESTIAS.map(([grupo, pref, nombre]) => {
      const f = this.filaInterruptor(
        `aegis-escudos-aj-molestia-${nombre}`,
        t(`aegis-escudos-grupo-${grupo}`),
        t(`aegis-ajustes-escudos-molestia-${nombre}-detalle`),
        si => Services.prefs.setBoolPref(pref, si)
      );
      tarjeta.append(f);
      return Object.assign(f, { pref });
    });
    tarjeta.append(this.el("p", { className: "aegis-huella-nota" }, t("aegis-ajustes-escudos-molestias-nota")));
    return this.bloque(
      "aegis-escudos-aj-molestias",
      "aegis-ajustes-escudos-molestias-titulo",
      "aegis-ajustes-escudos-molestias-descripcion",
      "molestias",
      tarjeta
    );
  }

  // ── Contador ──

  construirContador() {
    this.contador = this.segmentos(
      "aegis-escudos-contador",
      CONTADORES.map(c => [c, t(`aegis-ajustes-escudos-contador-${c}`)]),
      "aegis-escudos-aj-contador-titulo",
      valor => Services.prefs.setStringPref(PREF_CONTADOR, valor)
    );
    this.contador.setAttribute("aria-describedby", "aegis-escudos-aj-contador-ayuda");
    this.contadorNota = this.el("p", { className: "aegis-huella-nota" });
    const tarjeta = this.el("div", { className: "aegis-huella-tarjeta" }, this.contador, this.contadorNota);
    return this.bloque(
      "aegis-escudos-aj-contador",
      "aegis-ajustes-escudos-contador-titulo",
      "aegis-ajustes-escudos-contador-descripcion",
      "contador",
      tarjeta
    );
  }

  // ── Listas ──

  construirListas() {
    // Estado y «Actualizar ahora».
    this.listasNombre = this.el("span", { className: "aegis-tor-nombre" });
    this.listasDetalle = this.el("span", { className: "aegis-tor-detalle" });
    const estado = this.el("div", { className: "aegis-tor-textos", role: "status" }, this.listasNombre, this.listasDetalle);
    this.botonActualizar = this.boton("aegis-ajustes-escudos-actualizar-ahora", () => this.actualizarAhora());
    const filaEstado = this.el("div", { className: "aegis-tor-fila" }, estado, this.botonActualizar);

    // Actualización automática (depende del permiso de Conexiones).
    this.automatica = this.filaInterruptor(
      "aegis-escudos-aj-automatica",
      t("aegis-ajustes-escudos-automatica"),
      "",
      si => Services.prefs.setBoolPref(PREF_ACTUALIZAR, si)
    );
    this.enlaceConexiones = this.el("a", { className: "aegis-ayuda-enlace", href: lazy.AegisConexiones.DIRECCION });
    this.enlaceConexiones.textContent = t("aegis-ajustes-escudos-elegir-conexiones");
    this.enlaceConexiones.addEventListener("click", e => {
      e.preventDefault();
      lazy.AegisConexiones.abrir(this.win.browsingContext.topChromeWindow ?? this.win);
    });
    this.permisoConexiones = this.el(
      "p",
      { className: "aegis-huella-nota aegis-escudos-aj-dependencia", hidden: true },
      t("aegis-ajustes-escudos-sin-conexiones"),
      " ",
      this.enlaceConexiones
    );

    // Intervalo.
    const tituloIntervalo = this.el(
      "span",
      { className: "aegis-tor-nombre", id: "aegis-escudos-aj-intervalo-titulo" },
      t("aegis-ajustes-escudos-intervalo")
    );
    this.intervalo = this.segmentos(
      "aegis-escudos-intervalo",
      INTERVALOS.map(n => [n, t("aegis-ajustes-escudos-dias", { dias: n })]),
      "aegis-escudos-aj-intervalo-titulo",
      valor => Services.prefs.setIntPref(PREF_INTERVALO, Number(valor))
    );
    this.filaIntervalo = this.el(
      "div",
      { className: "aegis-escudos-aj-intervalo" },
      this.el(
        "div",
        { className: "aegis-tor-textos" },
        tituloIntervalo,
        this.el("span", { className: "aegis-tor-detalle" }, t("aegis-ajustes-escudos-intervalo-detalle"))
      ),
      this.intervalo
    );

    // Las listas activas, plegadas.
    this.botonVerListas = this.el("button", {
      className: "aegis-huella-quitar aegis-escudos-aj-ver",
      type: "button",
      "aria-expanded": "false",
      "aria-controls": "aegis-escudos-aj-listas-lista",
    });
    this.botonVerListas.addEventListener("click", () => {
      this.verListas = !this.verListas;
      this.pintarListas();
    });
    this.listaListas = this.el("ul", { className: "aegis-huella-lista", id: "aegis-escudos-aj-listas-lista", hidden: true });

    const tarjeta = this.el(
      "div",
      { className: "aegis-huella-tarjeta", role: "group", "aria-labelledby": "aegis-escudos-aj-listas-titulo" },
      filaEstado,
      this.automatica,
      this.permisoConexiones,
      this.filaIntervalo,
      this.el("div", { className: "aegis-escudos-aj-pie" }, this.botonVerListas),
      this.listaListas
    );
    return this.bloque(
      "aegis-escudos-aj-listas",
      "aegis-ajustes-escudos-listas-titulo",
      "aegis-ajustes-escudos-listas-descripcion",
      "listas",
      tarjeta
    );
  }

  async actualizarAhora() {
    if (this.actualizando) {
      return;
    }
    this.actualizando = true;
    this.resultado = null;
    this.pintarEstadoListas();
    try {
      const r = await lazy.AegisEscudosListas.actualizarAhora();
      const fallos = Object.keys(r?.fallos ?? {}).length;
      this.resultado = r?.sinPermiso
        ? "sin-permiso"
        : fallos
          ? "fallos"
          : r?.nuevas?.length
            ? "nuevas"
            : "iguales";
      this.fallos = fallos;
    } catch (e) {
      console.error("Aegis: Ajustes › Escudos, actualizar listas", e);
      this.resultado = "error";
    }
    this.actualizando = false;
    if (!this.win.closed) {
      this.pintarListas();
    }
  }

  pintarEstadoListas(estado = this.estadoListas) {
    const n = estado?.listas?.length ?? 0;
    this.listasNombre.textContent = t("aegis-ajustes-escudos-listas-activas", { listas: n });
    let detalle = "";
    if (this.actualizando) {
      detalle = t("aegis-ajustes-escudos-actualizando");
    } else if (this.resultado) {
      detalle = t(`aegis-ajustes-escudos-resultado-${this.resultado}`, { listas: this.fallos ?? 0 });
    }
    const ultima = (estado?.listas ?? []).reduce((m, l) => (l.fecha && l.fecha > m ? l.fecha : m), "");
    const linea = ultima ? t("aegis-ajustes-escudos-ultima", { fecha: fecha(ultima, true) }) : "";
    this.listasDetalle.textContent = [detalle, linea].filter(Boolean).join(" · ");
    this.listasDetalle.parentElement.toggleAttribute(
      "aegis-tor-error",
      ["sin-permiso", "fallos", "error"].includes(this.resultado)
    );
    this.botonActualizar.disabled = this.actualizando || !conexionesPermiten();
  }

  async pintarListas() {
    let estado = null;
    try {
      estado = await lazy.AegisEscudosListas.estado();
    } catch (e) {
      console.error("Aegis: Ajustes › Escudos, estado de las listas", e);
    }
    const nombres = await nombresDeListas();
    if (this.win.closed) {
      return;
    }
    this.estadoListas = estado;
    this.pintarEstadoListas(estado);
    const listas = estado?.listas ?? [];
    this.botonVerListas.textContent = t(
      this.verListas ? "aegis-ajustes-escudos-ocultar-listas" : "aegis-ajustes-escudos-ver-listas",
      { listas: listas.length }
    );
    this.botonVerListas.setAttribute("aria-expanded", String(this.verListas));
    this.listaListas.hidden = !this.verListas;
    if (!this.verListas) {
      return;
    }
    this.listaListas.replaceChildren(
      ...listas.map(l => {
        const info = nombres.get(l.id);
        const origen = t(l.origen == "red" ? "aegis-ajustes-escudos-origen-red" : "aegis-ajustes-escudos-origen-build");
        const detalle = [info?.autor, fecha(l.fecha), origen].filter(Boolean).join(" · ");
        return this.el(
          "li",
          { className: "aegis-huella-sitio aegis-escudos-aj-lista" },
          this.el(
            "span",
            { className: "aegis-tor-textos" },
            this.el("span", { className: "aegis-tor-nombre" }, info?.nombre ?? l.id),
            this.el("span", { className: "aegis-tor-detalle" }, detalle)
          )
        );
      })
    );
  }

  // ── Excepciones ──

  construirExcepciones() {
    this.campo = this.el("input", {
      type: "text",
      className: "aegis-escudos-aj-campo",
      id: "aegis-escudos-aj-campo",
      placeholder: t("aegis-ajustes-escudos-anadir-ejemplo"),
      autocomplete: "off",
      spellcheck: false,
      "aria-labelledby": "aegis-escudos-aj-anadir-etiqueta",
      "aria-describedby": "aegis-escudos-aj-anadir-error",
    });
    const anadir = this.boton("aegis-ajustes-escudos-anadir", () => this.anadir());
    this.campo.addEventListener("keydown", e => {
      if (e.key == "Enter") {
        e.preventDefault();
        this.anadir();
      }
    });
    this.campo.addEventListener("input", () => (this.error.hidden = true));
    this.error = this.el(
      "p",
      { className: "aegis-escudos-aj-error", id: "aegis-escudos-aj-anadir-error", hidden: true },
      t("aegis-ajustes-escudos-anadir-error")
    );
    const etiqueta = this.el(
      "label",
      { className: "aegis-huella-subtitulo", id: "aegis-escudos-aj-anadir-etiqueta", htmlFor: this.campo.id },
      t("aegis-ajustes-escudos-anadir-titulo")
    );
    const filaAnadir = this.el("div", { className: "aegis-escudos-aj-anadir" }, this.campo, anadir);

    this.sitios = this.el("ul", {
      className: "aegis-huella-lista aegis-escudos-aj-sitios",
      "aria-labelledby": "aegis-escudos-aj-excepciones-titulo",
    });
    const tarjeta = this.el("div", { className: "aegis-huella-tarjeta" }, etiqueta, filaAnadir, this.error, this.sitios);
    const bloque = this.bloque(
      "aegis-escudos-aj-excepciones",
      "aegis-ajustes-escudos-excepciones-titulo",
      this.privada ? "aegis-ajustes-escudos-excepciones-descripcion-privada" : "aegis-ajustes-escudos-excepciones-descripcion",
      "excepciones",
      tarjeta
    );
    return bloque;
  }

  anadir() {
    const d = Ex.dominioDe(this.campo.value);
    if (!d) {
      this.error.hidden = false;
      this.campo.focus();
      return;
    }
    this.campo.value = "";
    this.error.hidden = true;
    this.mostrarSitio(d);
  }

  /** Abre el editor de un sitio (de la lista o nuevo) y lo enseña. */
  mostrarSitio(d, enfocar = true) {
    if (!Ex.listar({ privada: this.privada }).some(s => s.sitio == d)) {
      this.nuevos.add(d);
    }
    this.abierto = d;
    this.pintarSitios();
    const fila = this.sitios.querySelector(`li[data-sitio="${CSS.escape(d)}"]`);
    if (fila) {
      fila.scrollIntoView({ block: "nearest" });
      if (enfocar) {
        fila.querySelector(".aegis-escudos-aj-editor input:not(:disabled)")?.focus({ focusVisible: false });
      }
    }
  }

  pintarSitios() {
    const opciones = { privada: this.privada };
    const lista = Ex.listar(opciones);
    const conocidos = new Set(lista.map(s => s.sitio));
    // Los añadidos a mano siguen en la lista hasta que se cierra la página o se quitan.
    for (const d of this.nuevos) {
      if (!conocidos.has(d)) {
        lista.push({ sitio: d, grupos: [], todo: false, nuevo: true });
      }
    }
    lista.sort((a, b) => a.sitio.localeCompare(b.sitio));
    if (!lista.length) {
      this.sitios.replaceChildren(
        this.el("li", { className: "aegis-huella-vacio" }, t("aegis-ajustes-escudos-excepciones-vacio"))
      );
      return;
    }
    const foco = this.doc.activeElement;
    const focoId = this.sitios.contains(foco) ? foco.id : null;
    this.sitios.replaceChildren(...lista.map(s => this.filaSitio(s)));
    if (focoId) {
      this.doc.getElementById(focoId)?.focus({ focusVisible: false });
    }
  }

  resumen(s) {
    if (s.todo) {
      return t("aegis-ajustes-escudos-sitio-todo");
    }
    if (!s.grupos.length) {
      return t("aegis-ajustes-escudos-sitio-nada");
    }
    const nombres = s.grupos.map(g => t(`aegis-escudos-grupo-${g}`));
    return new Intl.ListFormat(Services.locale.appLocaleAsBCP47, { type: "conjunction" }).format(nombres);
  }

  filaSitio(s) {
    const d = s.sitio;
    const base = `aegis-escudos-aj-sitio-${d.replace(/[^a-z0-9]/gi, "_")}`;
    const abierto = this.abierto == d;
    const nombre = this.el("span", { className: "aegis-tor-nombre aegis-escudos-aj-sitio-nombre", id: `${base}-nombre` }, d);
    const detalle = this.el("span", { className: "aegis-tor-detalle", id: `${base}-resumen` }, this.resumen(s));
    const editar = this.boton(abierto ? "aegis-ajustes-escudos-cerrar" : "aegis-ajustes-escudos-editar", () => {
      this.abierto = abierto ? null : d;
      this.pintarSitios();
    }, { sitio: d });
    editar.id = `${base}-editar`;
    editar.setAttribute("aria-expanded", String(abierto));
    editar.setAttribute("aria-controls", `${base}-editor`);
    const quitar = this.boton("aegis-ajustes-escudos-quitar", () => {
      Ex.quitar(d, { privada: this.privada });
      this.nuevos.delete(d);
      if (this.abierto == d) {
        this.abierto = null;
      }
      this.pintarSitios();
    }, { sitio: d });
    quitar.id = `${base}-quitar`;
    const cabecera = this.el(
      "div",
      { className: "aegis-tor-fila aegis-escudos-aj-sitio-cabecera" },
      this.el("span", { className: "aegis-tor-textos" }, nombre, detalle),
      this.el("span", { className: "aegis-tor-acciones" }, editar, quitar)
    );
    const li = this.el("li", { className: "aegis-escudos-aj-sitio", "data-sitio": d }, cabecera);
    if (abierto) {
      li.append(this.editor(d, base));
    }
    return li;
  }

  /**
   * El editor de un sitio: «Permitir todo» y, debajo, un interruptor por grupo (encendido = permitido en el sitio),
   * con la herencia: un grupo apagado en general sale encendido, desactivado y «Permitido por ajuste general»; con
   * «Permitir todo», todos encendidos y desactivados.
   */
  editor(d, base) {
    const opciones = { privada: this.privada };
    const editor = this.el("div", {
      className: "aegis-escudos-aj-editor",
      id: `${base}-editor`,
      role: "group",
      "aria-labelledby": `${base}-nombre`,
    });
    const todo = Ex.todoPermitido(d, opciones);
    const filaTodo = this.filaInterruptor(
      `${base}-todo`,
      t("aegis-ajustes-escudos-permitir-todo"),
      t("aegis-ajustes-escudos-permitir-todo-detalle"),
      si => Ex.permitirTodo(d, si, opciones)
    );
    filaTodo.interruptor.checked = todo;
    editor.append(filaTodo);
    editor.append(
      this.el("p", { className: "aegis-huella-subtitulo aegis-escudos-aj-que" }, t("aegis-ajustes-escudos-que-permitir"))
    );
    for (const grupo of Ex.GRUPOS) {
      const motivo = Ex.motivo(d, grupo, opciones);
      const f = this.filaInterruptor(
        `${base}-${grupo}`,
        t(`aegis-escudos-grupo-${grupo}`),
        "",
        si => Ex.poner(d, grupo, si, opciones)
      );
      f.interruptor.checked = motivo != "bloquea";
      const heredada = motivo == "general" || motivo == "todo";
      f.interruptor.disabled = heredada;
      f.toggleAttribute("aegis-heredada", heredada);
      f.detalleEl.textContent =
        motivo == "general"
          ? t("aegis-ajustes-escudos-por-ajuste-general", { grupo: t(`aegis-escudos-grupo-${grupo}`) })
          : motivo == "todo"
            ? t("aegis-ajustes-escudos-por-permitir-todo")
            : t(`aegis-ajustes-escudos-grupo-${grupo}-detalle`);
      editor.append(f);
    }
    return editor;
  }

  // ── Repintar ──

  repintar(_sujeto, tema, dato) {
    if (!this.hecha || this.win.closed) {
      return;
    }
    // El nivel y las molestias cambian qué listas se usan: se vuelven a leer (listas.sys.mjs responde cuando ha
    // terminado de prepararlas).
    if (tema == "nsPref:changed" && PREFS_DE_LISTAS.test(dato)) {
      this.pintarListas();
    }
    const nivel = nivelActual();
    const conocido = NIVELES.some(([v]) => v == nivel);
    for (const r of this.nivel.querySelectorAll("input")) {
      r.checked = r.value == nivel;
    }
    this.notaPersonalizado.hidden = conocido;

    for (const f of this.molestias) {
      f.interruptor.checked = Services.prefs.getBoolPref(f.pref, true);
    }

    const contador = Services.prefs.getStringPref(PREF_CONTADOR, "peticiones");
    this.contador.poner(contador);
    const cuenta = contador == "origenes" ? "origenes" : "peticiones";
    this.contadorNota.textContent = t(`aegis-ajustes-escudos-contador-${cuenta}-detalle`);

    const permitido = conexionesPermiten();
    const auto = Services.prefs.getBoolPref(PREF_ACTUALIZAR, true);
    this.automatica.interruptor.checked = permitido && auto;
    this.automatica.interruptor.disabled = !permitido;
    this.automatica.toggleAttribute("aegis-heredada", !permitido);
    this.automatica.detalleEl.textContent = t(
      permitido ? "aegis-ajustes-escudos-automatica-detalle" : "aegis-ajustes-escudos-automatica-sin-permiso"
    );
    this.permisoConexiones.hidden = permitido;
    this.intervalo.poner(Services.prefs.getIntPref(PREF_INTERVALO, 4));
    const sinIntervalo = !permitido || !auto;
    for (const r of this.intervalo.querySelectorAll("input")) {
      r.disabled = sinIntervalo;
    }
    this.filaIntervalo.toggleAttribute("aegis-desactivada", sinIntervalo);
    this.pintarEstadoListas();
    this.pintarSitios();
  }

  /** La categoría se enseña: si el panel ha pedido un sitio, se abre su editor. */
  mostrada() {
    this.construir();
    if (pendiente) {
      const d = pendiente;
      pendiente = null;
      this.mostrarSitio(d);
      this.doc.getElementById("aegis-escudos-aj-excepciones")?.scrollIntoView({ block: "start" });
    }
  }
}

// ── Registro en about:preferences ─────────────────────────────────────────────────────────────────────────────────

const paginas = new WeakMap();

/**
 * Añade la categoría a una página de Ajustes: botón en la barra lateral, contenedor y register_module. Devuelve si la
 * ha añadido.
 */
function registrar(doc) {
  const win = doc.defaultView;
  const nav = doc.getElementById("categories");
  const panel = doc.getElementById("mainPrefPane");
  if (!win || !nav || !panel || typeof win.register_module != "function" || paginas.has(doc)) {
    return false;
  }
  const boton = doc.createElement("moz-page-nav-button");
  boton.id = "category-escudos";
  boton.setAttribute("view", VISTA);
  boton.setAttribute("iconsrc", ICONO);
  boton.textContent = t("aegis-ajustes-escudos");
  const privacidad = doc.getElementById("category-privacy");
  if (privacidad) {
    privacidad.after(boton);
  } else {
    nav.append(boton);
  }

  const contenedor = doc.createElement("div");
  contenedor.id = "aegis-escudos-ajustes";
  contenedor.className = "aegis-escudos-ajustes";
  contenedor.setAttribute("data-category", VISTA);
  contenedor.hidden = true;
  panel.append(contenedor);

  const pagina = new Pagina(doc, contenedor);
  paginas.set(doc, pagina);
  win.register_module(VISTA, {
    init() {
      pagina.construir();
    },
  });
  // Cada vez que se enseña (también si ya estaba elegida y el panel pide otro sitio).
  doc.addEventListener("paneshown", e => {
    if (e.detail?.category == VISTA) {
      try {
        pagina.mostrada();
      } catch (ex) {
        console.error("Aegis: Ajustes › Escudos", ex);
      }
    }
  });
  return true;
}

export const AegisEscudosAjustes = {
  VISTA,

  /**
   * Prepara una página de Ajustes (lo llama ajustes.sys.mjs en cuanto se crea el documento). Si aún se está cargando,
   * la categoría se registra en DOMContentLoaded antes que init_all() de preferences.js (este oyente se pone antes que
   * el suyo); si ya está cargada, ahora, y si la dirección pedía #escudos, se va a ella.
   *
   * @param {Document} doc
   */
  preparar(doc) {
    const hacer = () => {
      try {
        return registrar(doc);
      } catch (e) {
        console.error("Aegis: Ajustes › Escudos", e);
        return false;
      }
    };
    if (doc.readyState == "loading") {
      doc.addEventListener("DOMContentLoaded", hacer, { once: true });
      return;
    }
    if (hacer() && /^#escudos\b/.test(doc.location.hash)) {
      doc.defaultView.gotoPref?.(VISTA);
    }
  },

  /**
   * Abre Ajustes › Escudos (desde el panel), con el editor de `dominio` abierto si se da.
   *
   * @param {Window} win ventana del navegador
   * @param {string?} [dominio]
   */
  abrir(win, dominio) {
    pendiente = dominio || null;
    win.openPreferences("escudos");
  },
};
