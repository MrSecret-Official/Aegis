/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · selector del énfasis personalizado (docs/DISENO.md §2 «Énfasis» y §9 «Selector del énfasis personalizado»):
 * el diálogo que abre el «+», la última muestra de los selectores de énfasis (Ajustes › Apariencia y «Personalizar» de
 * la nueva pestaña). Dos pestañas:
 * - «Crear»: cuadro de saturación y brillo con la barra de tono (HSV), el código #RRGGBB (se valida), el interruptor
 *   «Degradado» (un segundo color; con él, dos segmentos para elegir cuál se edita), un nombre opcional, la vista de cómo
 *   queda (con la fórmula de tokens.css, la misma de los temas) y «Guardar» (secundario) y «Usar» (principal).
 * - «Mis énfasis»: los guardados (como mucho 24) en una rejilla de muestras; un clic los usa, Supr o «Borrar» los
 *   borra después de confirmarlo y «Editar» los lleva a «Crear». Sin ninguno, un estado vacío que lo explica.
 *
 * Por qué cuadro y no rueda: el cuadro y la barra son el modelo HSV tal cual (el mismo del código hexadecimal), se
 * manejan con el teclado como dos deslizadores (flechas en el cuadro, el tono con un <input type="range"> nativo), caben
 * en los 440 del diálogo sin dejar esquinas vacías y son lo que la gente ya conoce de otros programas. Una rueda pide
 * además un deslizador de brillo y amontona los tonos en el centro, donde menos precisión hay.
 *
 * Un <dialog> modal (foco atrapado, Esc lo cierra, el resto de la página inerte) sin velo: es una capa elevada con su
 * sombra (DISENO §6), y así se ve detrás cómo cambia la página al usar un énfasis. Al cerrarse, el foco vuelve al «+».
 *
 * No escribe nada por sí mismo: quien lo abre le da usar, guardar y borrar (en Ajustes escriben las prefs con
 * enfasis.sys.mjs; en la nueva pestaña se piden al proceso principal, que valida otra vez) y le pasa el estado nuevo con
 * actualizar() cuando cambian. Todo el DOM se crea con createElementNS y textContent (nada de HTML en texto). Sin red y
 * sin temporizadores: solo eventos mientras está abierto.
 */

import {
  MAXIMO_GUARDADOS,
  MAXIMO_NOMBRE,
  borrarDe,
  clave,
  guardarEn,
  hexARgb,
  hsvARgb,
  normalizarHex,
  rgbAHex,
  rgbAHsv,
  validarAcento,
} from "./enfasis-propio.sys.mjs";

const HTML = "http://www.w3.org/1999/xhtml";
const SVG = "http://www.w3.org/2000/svg";
/** Color con el que empieza «Crear» si no hay ningún personalizado (la base de Hielo en oscuro). */
const INICIAL = "#88c0dc";
/** Pasos del teclado en el cuadro y en la barra (con Mayúsculas, el grande). */
const PASO = 0.01;
const PASO_GRANDE = 0.1;

/** Diálogos abiertos, uno por documento. */
const abiertos = new WeakMap();

function crear(doc, etiqueta, atributos = {}, contenido) {
  const el = doc.createElementNS(HTML, etiqueta);
  for (const [k, v] of Object.entries(atributos)) {
    el.setAttribute(k, v);
  }
  if (contenido !== undefined) {
    el.textContent = contenido;
  }
  return el;
}

/**
 * Glifo de línea (DISENO §8: rejilla de 24, trazo de 1,5, extremos redondos, del color del texto).
 *
 * @param {Document} doc
 * @param {"mas"|"cerrar"|"gota"} tipo
 * @returns {SVGElement}
 */
export function glifo(doc, tipo) {
  const trazos = {
    mas: ["M12 5v14", "M5 12h14"],
    cerrar: ["M6 6l12 12", "M18 6L6 18"],
    // Una gota: el color que se elige.
    gota: ["M12 3.5c-3.2 4-6 7.4-6 10.5a6 6 0 0 0 12 0c0-3.1-2.8-6.5-6-10.5z"],
  }[tipo];
  const svg = doc.createElementNS(SVG, "svg");
  for (const [k, v] of Object.entries({
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "1.5",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    "aria-hidden": "true",
    class: "aegis-ep-glifo",
  })) {
    svg.setAttribute(k, v);
  }
  for (const d of trazos) {
    const camino = doc.createElementNS(SVG, "path");
    camino.setAttribute("d", d);
    svg.append(camino);
  }
  return svg;
}

/**
 * Pone en un elemento los colores de un énfasis personalizado para que tokens.css le aplique la fórmula (su
 * --aegis-accent y, con degradado, --aegis-accent-2): aegis-enfasis-muestra="propio", las dos variables y el atributo
 * aegis-enfasis-degradado. Con null, lo quita todo.
 *
 * @param {Element} el
 * @param {{c: string, c2?: string}|null} acento
 */
export function ponerColores(el, acento) {
  const valido = validarAcento(acento);
  if (!valido) {
    el.removeAttribute("aegis-enfasis-muestra");
    el.removeAttribute("aegis-enfasis-degradado");
    el.style.removeProperty("--aegis-enfasis-propio");
    el.style.removeProperty("--aegis-enfasis-propio-2");
    return;
  }
  el.setAttribute("aegis-enfasis-muestra", "propio");
  el.style.setProperty("--aegis-enfasis-propio", valido.c);
  el.style.setProperty("--aegis-enfasis-propio-2", valido.c2 ?? valido.c);
  el.toggleAttribute("aegis-enfasis-degradado", !!valido.c2);
}

/** «#88C0DC» o «#88C0DC → #E1909F». */
export function codigos(acento) {
  return acento.c2 ? `${acento.c.toUpperCase()} → ${acento.c2.toUpperCase()}` : acento.c.toUpperCase();
}

/**
 * El nombre corto de un énfasis personalizado (en el «+» y en la línea del elegido): el suyo o, sin nombre, sus
 * códigos.
 *
 * @param {{c: string, c2?: string, n?: string}} acento
 */
export function nombreDe(acento) {
  return acento.n ?? codigos(acento);
}

/**
 * El «+» de un selector de énfasis: un botón (no una opción del grupo de radios: abre el diálogo) con un círculo del
 * tamaño de las muestras. Si el personalizado es el elegido, el círculo lleva su color (con el «+» encima en
 * --aegis-on-accent) y el botón, aegis-ep-activo, para marcarlo como las muestras elegidas.
 *
 * @param {Document} doc
 * @param {{clase: string, claseCirculo: string, texto: Function, conNombre?: boolean}} opciones
 * @returns {{boton: HTMLButtonElement, marcar: (modo: string, propio: object|null) => void}}
 */
export function botonMas(doc, { clase, claseCirculo, texto, conNombre = false }) {
  const boton = crear(doc, "button", { type: "button", class: `${clase} aegis-ep-mas`, "aria-haspopup": "dialog" });
  const circulo = crear(doc, "span", { class: `${claseCirculo} aegis-ep-mas-circulo` });
  circulo.append(glifo(doc, "mas"));
  boton.append(circulo);
  const nombre = conNombre ? crear(doc, "span", {}, texto("aegis-enfasis-propio")) : null;
  if (nombre) {
    boton.append(nombre);
  }
  const marcar = (modo, propio) => {
    const activo = modo == "propio" && !!validarAcento(propio);
    boton.toggleAttribute("aegis-ep-activo", activo);
    ponerColores(circulo, activo ? propio : null);
    const etiqueta = activo
      ? texto("aegis-enfasis-propio-abrir-activo", { nombre: nombreDe(propio) })
      : texto("aegis-enfasis-propio-abrir");
    boton.setAttribute("aria-label", etiqueta);
    boton.setAttribute("title", etiqueta);
  };
  marcar("monocromo", null);
  return { boton, marcar };
}

/**
 * Abre el selector en un documento (o devuelve el que ya está abierto).
 *
 * @param {Document} doc
 * @param {object} opciones
 * @param {(id: string, args?: object) => string} opciones.texto textos de aegis.ftl
 * @param {{modo: string, propio: object|null, guardados: Array}} opciones.estado
 * @param {(acento: object) => void} opciones.usar
 * @param {(acento: object) => void} opciones.guardar
 * @param {(clave: string) => void} opciones.borrar
 * @param {Element} [opciones.abridor] el «+», que recupera el foco al cerrar
 * @returns {{actualizar: (estado: object) => void, cerrar: () => void}}
 */
export function abrirSelector(doc, opciones) {
  const yaAbierto = abiertos.get(doc);
  if (yaAbierto) {
    yaAbierto.actualizar(opciones.estado);
    return yaAbierto;
  }
  const { texto, usar, guardar, borrar, abridor } = opciones;
  let estado = { modo: "monocromo", propio: null, guardados: [], ...opciones.estado };

  // ── Estado del selector ──
  const inicial = validarAcento(estado.propio) ?? { c: INICIAL };
  const deHex = (hex, tonoPrevio) => rgbAHsv(hexARgb(hex), tonoPrevio);
  const s = {
    colores: [deHex(inicial.c), deHex(inicial.c2 ?? inicial.c)],
    activo: 0,
    degradado: !!inicial.c2,
    nombre: inicial.n ?? "",
    /** Clave del guardado que se ve en el detalle de «Mis énfasis». */
    seleccion: null,
  };
  const hexDe = i => rgbAHex(hsvARgb(s.colores[i].h, s.colores[i].s, s.colores[i].v));
  const acentoActual = () =>
    validarAcento({ c: hexDe(0), c2: s.degradado ? hexDe(1) : undefined, n: s.nombre });

  // ── Marco ──
  const dialogo = crear(doc, "dialog", { class: "aegis-ep", "aria-labelledby": "aegis-ep-titulo" });
  const cabecera = crear(doc, "div", { class: "aegis-ep-cabecera" });
  const cerrarBoton = crear(doc, "button", {
    type: "button",
    class: "aegis-ep-icono",
    "aria-label": texto("aegis-enfasis-propio-cerrar"),
    title: texto("aegis-enfasis-propio-cerrar"),
  });
  cerrarBoton.append(glifo(doc, "cerrar"));
  cabecera.append(
    crear(doc, "h2", { id: "aegis-ep-titulo", class: "aegis-ep-titulo" }, texto("aegis-enfasis-propio-titulo")),
    cerrarBoton
  );

  // Pestañas (ARIA: tablist, con el foco itinerante y activación al moverse), con la forma de los segmentos.
  const pestanas = crear(doc, "div", { class: "aegis-ep-pestanas", role: "tablist" });
  const pestana = (id, etiqueta) =>
    crear(doc, "button", {
      type: "button",
      role: "tab",
      id: `aegis-ep-pestana-${id}`,
      class: "aegis-ep-pestana",
      "aria-controls": `aegis-ep-panel-${id}`,
    }, etiqueta);
  const pestanaCrear = pestana("crear", texto("aegis-enfasis-propio-crear"));
  const pestanaMis = pestana("mis", texto("aegis-enfasis-propio-mis"));
  pestanas.append(pestanaCrear, pestanaMis);
  const panel = id => crear(doc, "div", {
    role: "tabpanel",
    id: `aegis-ep-panel-${id}`,
    class: "aegis-ep-panel",
    "aria-labelledby": `aegis-ep-pestana-${id}`,
  });
  const panelCrear = panel("crear");
  const panelMis = panel("mis");

  // ── Crear ──
  const filaDegradado = crear(doc, "label", { class: "aegis-ep-fila" });
  const textosDegradado = crear(doc, "span", { class: "aegis-ep-fila-textos" });
  textosDegradado.append(
    crear(doc, "span", { class: "aegis-ep-rotulo" }, texto("aegis-enfasis-propio-degradado")),
    crear(doc, "span", { class: "aegis-ep-ayuda", id: "aegis-ep-degradado-ayuda" }, texto("aegis-enfasis-propio-degradado-ayuda"))
  );
  const interruptor = crear(doc, "input", {
    type: "checkbox",
    role: "switch",
    class: "aegis-ep-interruptor",
    "aria-describedby": "aegis-ep-degradado-ayuda",
  });
  filaDegradado.append(textosDegradado, interruptor);

  // Qué color se edita (solo con degradado): dos segmentos con su muestra.
  const paradas = crear(doc, "div", {
    class: "aegis-ep-segmentos",
    role: "radiogroup",
    "aria-label": texto("aegis-enfasis-propio-editando"),
  });
  const puntos = [];
  for (const i of [0, 1]) {
    const opcion = crear(doc, "label", { class: "aegis-ep-segmento" });
    const radio = crear(doc, "input", { type: "radio", name: "aegis-ep-parada", value: String(i) });
    const punto = crear(doc, "span", { class: "aegis-ep-punto", "aria-hidden": "true" });
    puntos.push(punto);
    opcion.append(radio, punto, crear(doc, "span", {}, texto(i ? "aegis-enfasis-propio-color-2" : "aegis-enfasis-propio-color-1")));
    paradas.append(opcion);
  }

  // Cuadro de saturación (horizontal) y brillo (vertical): un deslizador de dos ejes.
  const area = crear(doc, "div", {
    class: "aegis-ep-area",
    role: "slider",
    tabindex: "0",
    "aria-label": texto("aegis-enfasis-propio-area"),
    "aria-valuemin": "0",
    "aria-valuemax": "100",
  });
  const cursor = crear(doc, "span", { class: "aegis-ep-cursor", "aria-hidden": "true" });
  area.append(cursor);
  const tono = crear(doc, "input", {
    type: "range",
    class: "aegis-ep-tono",
    min: "0",
    max: "359",
    step: "1",
    "aria-label": texto("aegis-enfasis-propio-tono"),
  });

  // Código y nombre, en una fila.
  const campos = crear(doc, "div", { class: "aegis-ep-campos" });
  const campoHex = crear(doc, "div", { class: "aegis-ep-campo aegis-ep-campo-hex" });
  const hex = crear(doc, "input", {
    type: "text",
    id: "aegis-ep-hex",
    class: "aegis-ep-entrada aegis-ep-hex",
    maxlength: "7",
    spellcheck: "false",
    autocomplete: "off",
    "aria-describedby": "aegis-ep-hex-error",
  });
  campoHex.append(crear(doc, "label", { for: "aegis-ep-hex", class: "aegis-ep-etiqueta" }, texto("aegis-enfasis-propio-hex")), hex);
  const campoNombre = crear(doc, "div", { class: "aegis-ep-campo aegis-ep-campo-nombre" });
  const nombre = crear(doc, "input", {
    type: "text",
    id: "aegis-ep-nombre",
    class: "aegis-ep-entrada",
    maxlength: String(MAXIMO_NOMBRE),
    autocomplete: "off",
    placeholder: texto("aegis-enfasis-propio-nombre-ejemplo"),
  });
  campoNombre.append(crear(doc, "label", { for: "aegis-ep-nombre", class: "aegis-ep-etiqueta" }, texto("aegis-enfasis-propio-nombre")), nombre);
  campos.append(campoHex, campoNombre);
  const errorHex = crear(doc, "p", { id: "aegis-ep-hex-error", class: "aegis-ep-error" });

  // Así queda: el marco con la pestaña activa (y su filo), un interruptor encendido y una cápsula elegida, con los
  // colores que salen de la fórmula. Solo para verlo: el texto de debajo lo explica.
  const vista = crear(doc, "div", { class: "aegis-ep-vista" });
  const muestra = crear(doc, "div", { class: "aegis-ep-vista-muestra", "aria-hidden": "true" });
  const marco = crear(doc, "span", { class: "aegis-ep-vista-marco" });
  const pestanaVista = crear(doc, "span", { class: "aegis-ep-vista-pestana" });
  marco.append(pestanaVista);
  muestra.append(
    marco,
    crear(doc, "span", { class: "aegis-ep-vista-interruptor" }),
    crear(doc, "span", { class: "aegis-ep-vista-capsula" }, "Aa")
  );
  vista.append(
    crear(doc, "span", { class: "aegis-ep-etiqueta" }, texto("aegis-enfasis-propio-vista")),
    muestra,
    crear(doc, "p", { class: "aegis-ep-ayuda" }, texto("aegis-enfasis-propio-ajuste"))
  );

  const estadoCrear = crear(doc, "p", { class: "aegis-ep-estado", role: "status" });
  const pie = crear(doc, "div", { class: "aegis-ep-pie" });
  const guardarBoton = crear(doc, "button", { type: "button", class: "aegis-ep-boton" }, texto("aegis-enfasis-propio-guardar"));
  const usarBoton = crear(doc, "button", { type: "button", class: "aegis-ep-boton aegis-ep-principal" }, texto("aegis-enfasis-propio-usar"));
  pie.append(guardarBoton, usarBoton);
  panelCrear.append(filaDegradado, paradas, area, tono, campos, errorHex, vista, estadoCrear, pie);

  // ── Mis énfasis ──
  const cuenta = crear(doc, "p", { class: "aegis-ep-cuenta" });
  const guardados = crear(doc, "div", {
    class: "aegis-ep-guardados",
    role: "radiogroup",
    "aria-label": texto("aegis-enfasis-propio-mis"),
    "aria-describedby": "aegis-ep-mis-ayuda",
  });
  const ayudaMis = crear(doc, "p", { class: "aegis-ep-ayuda", id: "aegis-ep-mis-ayuda" }, texto("aegis-enfasis-propio-mis-ayuda"));
  const detalle = crear(doc, "div", { class: "aegis-ep-detalle" });
  const detalleTextos = crear(doc, "div", { class: "aegis-ep-detalle-textos" });
  const detalleNombre = crear(doc, "span", { class: "aegis-ep-detalle-nombre" });
  const detalleCodigo = crear(doc, "span", { class: "aegis-ep-detalle-codigo" });
  detalleTextos.append(detalleNombre, detalleCodigo);
  const editarBoton = crear(doc, "button", { type: "button", class: "aegis-ep-compacto" }, texto("aegis-enfasis-propio-editar"));
  const borrarBoton = crear(doc, "button", { type: "button", class: "aegis-ep-compacto" }, texto("aegis-enfasis-propio-borrar"));
  detalle.append(detalleTextos, editarBoton, borrarBoton);
  const confirmar = crear(doc, "div", { class: "aegis-ep-detalle aegis-ep-confirmar", role: "group", hidden: "" });
  const pregunta = crear(doc, "p", { class: "aegis-ep-pregunta", id: "aegis-ep-pregunta" });
  confirmar.setAttribute("aria-labelledby", "aegis-ep-pregunta");
  const cancelarBorrar = crear(doc, "button", { type: "button", class: "aegis-ep-compacto" }, texto("aegis-enfasis-propio-cancelar"));
  const confirmarBorrar = crear(doc, "button", { type: "button", class: "aegis-ep-compacto" }, texto("aegis-enfasis-propio-borrar-confirmar"));
  confirmar.append(pregunta, cancelarBorrar, confirmarBorrar);
  const estadoMis = crear(doc, "p", { class: "aegis-ep-estado", role: "status" });
  const vacio = crear(doc, "div", { class: "aegis-ep-vacio" });
  const irACrear = crear(doc, "button", { type: "button", class: "aegis-ep-boton" }, texto("aegis-enfasis-propio-ir-crear"));
  vacio.append(
    glifo(doc, "gota"),
    crear(doc, "p", { class: "aegis-ep-vacio-titulo" }, texto("aegis-enfasis-propio-vacio-titulo")),
    crear(doc, "p", { class: "aegis-ep-ayuda" }, texto("aegis-enfasis-propio-vacio", { maximo: MAXIMO_GUARDADOS })),
    irACrear
  );
  panelMis.append(cuenta, guardados, ayudaMis, detalle, confirmar, estadoMis, vacio);

  dialogo.append(cabecera, pestanas, panelCrear, panelMis);

  // ── Pintar ──
  let editandoHex = false;
  const pintarCrear = () => {
    const c = s.colores[s.activo];
    area.style.setProperty("--aegis-ep-tono", rgbAHex(hsvARgb(c.h, 1, 1)));
    cursor.style.left = `${c.s * 100}%`;
    cursor.style.top = `${(1 - c.v) * 100}%`;
    cursor.style.setProperty("--aegis-ep-color", hexDe(s.activo));
    area.setAttribute("aria-valuenow", String(Math.round(c.v * 100)));
    area.setAttribute(
      "aria-valuetext",
      texto("aegis-enfasis-propio-area-valor", { saturacion: Math.round(c.s * 100), brillo: Math.round(c.v * 100) })
    );
    tono.value = String(Math.round(c.h) % 360);
    if (!editandoHex) {
      hex.value = hexDe(s.activo).toUpperCase();
    }
    interruptor.checked = s.degradado;
    paradas.hidden = !s.degradado;
    for (const radio of paradas.querySelectorAll("input")) {
      radio.checked = Number(radio.value) == s.activo;
    }
    puntos.forEach((p, i) => p.style.setProperty("--aegis-ep-color", hexDe(i)));
    if (nombre.value != s.nombre) {
      nombre.value = s.nombre;
    }
    ponerColores(muestra, acentoActual());
  };

  const verPestana = (id, enfocar = false) => {
    for (const [t, p, esta] of [
      [pestanaCrear, panelCrear, id == "crear"],
      [pestanaMis, panelMis, id == "mis"],
    ]) {
      t.setAttribute("aria-selected", String(esta));
      t.tabIndex = esta ? 0 : -1;
      p.hidden = !esta;
    }
    if (enfocar) {
      (id == "crear" ? pestanaCrear : pestanaMis).focus();
    }
  };

  /** El guardado que se ve en el detalle: el elegido, si está en la lista; si no, el primero. */
  const enLista = k => estado.guardados.some(a => clave(a) == k);
  const acentoNombre = acento => acento.n ?? texto("aegis-enfasis-propio-sin-nombre");
  const pintarMis = (enfocar = null) => {
    const lista = estado.guardados;
    const enUso = estado.modo == "propio" && estado.propio ? clave(estado.propio) : null;
    if (!enLista(s.seleccion)) {
      s.seleccion = enLista(enUso) ? enUso : lista[0] ? clave(lista[0]) : null;
    }
    cuenta.textContent = texto("aegis-enfasis-propio-cuenta", { cuantos: lista.length, maximo: MAXIMO_GUARDADOS });
    const hay = lista.length > 0;
    for (const el of [cuenta, guardados, ayudaMis]) {
      el.hidden = !hay;
    }
    vacio.hidden = hay;
    if (!hay) {
      detalle.hidden = true;
      confirmar.hidden = true;
    }
    const conFoco = guardados.contains(doc.activeElement) ? doc.activeElement.value : null;
    guardados.replaceChildren(
      ...lista.map(acento => {
        const k = clave(acento);
        const leer = `${acentoNombre(acento)}, ${codigos(acento)}`;
        const opcion = crear(doc, "label", { class: "aegis-ep-guardado", title: leer });
        const radio = crear(doc, "input", { type: "radio", name: "aegis-ep-guardado", value: k });
        radio.checked = k == enUso;
        const circulo = crear(doc, "span", { class: "aegis-enfasis-circulo aegis-ep-circulo" });
        ponerColores(circulo, acento);
        opcion.append(radio, circulo, crear(doc, "span", { class: "aegis-ep-oculto" }, leer));
        return opcion;
      })
    );
    const elegido = lista.find(a => clave(a) == s.seleccion);
    if (elegido && confirmar.hidden) {
      detalle.hidden = false;
      detalleNombre.textContent = acentoNombre(elegido);
      detalleCodigo.textContent = codigos(elegido);
    }
    const aEnfocar = enfocar ?? conFoco;
    if (aEnfocar) {
      [...guardados.querySelectorAll("input")].find(r => r.value == aEnfocar)?.focus();
    }
  };

  const mostrarEstado = (el, id, args, error = false) => {
    el.textContent = id ? texto(id, args) : "";
    el.toggleAttribute("aegis-ep-error", error);
  };

  // ── Crear: eventos ──
  const cambiarColor = cambio => {
    Object.assign(s.colores[s.activo], cambio);
    mostrarEstado(estadoCrear, null);
    pintarCrear();
  };
  const fijar = v => Math.min(1, Math.max(0, v));
  const desdePuntero = e => {
    const r = area.getBoundingClientRect();
    // El cuadro va siempre de izquierda a derecha (direction: ltr en su hoja), como el código hexadecimal.
    cambiarColor({ s: fijar((e.clientX - r.left) / r.width), v: fijar(1 - (e.clientY - r.top) / r.height) });
  };
  area.addEventListener("pointerdown", e => {
    if (e.button != 0) {
      return;
    }
    e.preventDefault();
    area.focus();
    area.setPointerCapture(e.pointerId);
    desdePuntero(e);
  });
  area.addEventListener("pointermove", e => {
    if (area.hasPointerCapture(e.pointerId)) {
      desdePuntero(e);
    }
  });
  area.addEventListener("keydown", e => {
    const c = s.colores[s.activo];
    const paso = e.shiftKey ? PASO_GRANDE : PASO;
    const cambios = {
      ArrowRight: { s: c.s + paso },
      ArrowLeft: { s: c.s - paso },
      ArrowUp: { v: c.v + paso },
      ArrowDown: { v: c.v - paso },
      PageUp: { v: c.v + PASO_GRANDE },
      PageDown: { v: c.v - PASO_GRANDE },
      Home: { s: 0 },
      End: { s: 1 },
    }[e.key];
    if (!cambios) {
      return;
    }
    e.preventDefault();
    cambiarColor(Object.fromEntries(Object.entries(cambios).map(([k, v]) => [k, fijar(v)])));
  });
  tono.addEventListener("input", () => cambiarColor({ h: Number(tono.value) }));

  const validarHex = () => {
    const valido = normalizarHex(hex.value);
    if (valido) {
      hex.removeAttribute("aria-invalid");
    } else {
      hex.setAttribute("aria-invalid", "true");
    }
    mostrarEstado(errorHex, valido ? null : "aegis-enfasis-propio-hex-error", undefined, !valido);
    return valido;
  };
  hex.addEventListener("focus", () => {
    editandoHex = true;
  });
  hex.addEventListener("input", () => {
    const valido = normalizarHex(hex.value);
    // Mientras se escribe, solo se aplica lo que ya es un color; el error sale al terminar (Intro o al salir).
    if (valido && valido.length == 7 && hex.value.replace(/[\s#]/g, "").length == 6) {
      const previo = s.colores[s.activo].h;
      Object.assign(s.colores[s.activo], deHex(valido, previo));
      if (hex.hasAttribute("aria-invalid")) {
        validarHex();
      }
      mostrarEstado(estadoCrear, null);
      pintarCrear();
    }
  });
  const terminarHex = () => {
    const valido = validarHex();
    if (valido) {
      const previo = s.colores[s.activo].h;
      Object.assign(s.colores[s.activo], deHex(valido, previo));
      editandoHex = false;
      pintarCrear();
      editandoHex = doc.activeElement == hex;
    }
  };
  hex.addEventListener("change", terminarHex);
  hex.addEventListener("keydown", e => {
    if (e.key == "Enter") {
      e.preventDefault();
      terminarHex();
    }
  });
  hex.addEventListener("blur", () => {
    editandoHex = false;
    if (validarHex()) {
      pintarCrear();
    }
  });
  nombre.addEventListener("input", () => {
    s.nombre = nombre.value;
    mostrarEstado(estadoCrear, null);
  });
  interruptor.addEventListener("change", () => {
    s.degradado = interruptor.checked;
    if (s.degradado) {
      // El segundo color empieza siendo el primero, para moverlo desde ahí.
      if (hexDe(1) == hexDe(0)) {
        s.colores[1] = { ...s.colores[0] };
      }
    } else {
      s.activo = 0;
    }
    mostrarEstado(estadoCrear, null);
    pintarCrear();
  });
  paradas.addEventListener("change", e => {
    s.activo = Number(e.target.value) ? 1 : 0;
    editandoHex = false;
    pintarCrear();
  });

  guardarBoton.addEventListener("click", () => {
    const acento = acentoActual();
    if (!acento || !validarHex()) {
      return;
    }
    const { lista, resultado } = guardarEn(estado.guardados, acento);
    if (resultado == "lleno") {
      mostrarEstado(estadoCrear, "aegis-enfasis-propio-lleno", { maximo: MAXIMO_GUARDADOS }, true);
      return;
    }
    // Se ve al momento; el estado de verdad llega luego con actualizar().
    estado = { ...estado, guardados: lista };
    s.seleccion = clave(acento);
    guardar(acento);
    mostrarEstado(estadoCrear, resultado == "nuevo" ? "aegis-enfasis-propio-guardado" : "aegis-enfasis-propio-actualizado");
    pintarMis();
  });
  usarBoton.addEventListener("click", () => {
    const acento = acentoActual();
    if (!acento || !validarHex()) {
      hex.focus();
      return;
    }
    usar(acento);
    cerrar();
  });

  // ── Mis énfasis: eventos ──
  const acentoDe = k => estado.guardados.find(a => clave(a) == k);
  const pedirBorrar = k => {
    const acento = acentoDe(k);
    if (!acento) {
      return;
    }
    s.seleccion = k;
    detalle.hidden = true;
    confirmar.hidden = false;
    pregunta.textContent = texto("aegis-enfasis-propio-borrar-pregunta", { nombre: acentoNombre(acento) });
    mostrarEstado(estadoMis, null);
    cancelarBorrar.focus();
  };
  const dejarDeBorrar = () => {
    confirmar.hidden = true;
    pintarMis(s.seleccion);
  };
  guardados.addEventListener("change", e => {
    const acento = acentoDe(e.target.value);
    if (!acento) {
      return;
    }
    s.seleccion = e.target.value;
    estado = { ...estado, modo: "propio", propio: acento };
    usar(acento);
    mostrarEstado(estadoMis, null);
    pintarMis(e.target.value);
  });
  guardados.addEventListener("focusin", e => {
    if (e.target.value && e.target.value != s.seleccion && confirmar.hidden) {
      s.seleccion = e.target.value;
      const acento = acentoDe(s.seleccion);
      if (acento) {
        detalleNombre.textContent = acentoNombre(acento);
        detalleCodigo.textContent = codigos(acento);
      }
    }
  });
  guardados.addEventListener("keydown", e => {
    if ((e.key == "Delete" || e.key == "Backspace") && e.target.value) {
      e.preventDefault();
      pedirBorrar(e.target.value);
    }
  });
  borrarBoton.addEventListener("click", () => pedirBorrar(s.seleccion));
  cancelarBorrar.addEventListener("click", dejarDeBorrar);
  confirmarBorrar.addEventListener("click", () => {
    const k = s.seleccion;
    const acento = acentoDe(k);
    if (!acento) {
      dejarDeBorrar();
      return;
    }
    const i = estado.guardados.findIndex(a => clave(a) == k);
    estado = { ...estado, guardados: borrarDe(estado.guardados, k) };
    const siguiente = estado.guardados[Math.min(i, estado.guardados.length - 1)];
    s.seleccion = siguiente ? clave(siguiente) : null;
    confirmar.hidden = true;
    borrar(k);
    mostrarEstado(estadoMis, "aegis-enfasis-propio-borrado", { nombre: acentoNombre(acento) });
    pintarMis(s.seleccion);
    if (!siguiente) {
      irACrear.focus();
    }
  });
  editarBoton.addEventListener("click", () => {
    const acento = acentoDe(s.seleccion);
    if (!acento) {
      return;
    }
    s.colores = [deHex(acento.c), deHex(acento.c2 ?? acento.c)];
    s.degradado = !!acento.c2;
    s.activo = 0;
    s.nombre = acento.n ?? "";
    editandoHex = false;
    mostrarEstado(estadoCrear, null);
    mostrarEstado(errorHex, null);
    pintarCrear();
    verPestana("crear");
    area.focus();
  });
  irACrear.addEventListener("click", () => {
    verPestana("crear");
    area.focus();
  });

  // ── Pestañas y cierre ──
  pestanas.addEventListener("click", e => {
    const t = e.target.closest?.("[role=tab]");
    if (t) {
      verPestana(t == pestanaMis ? "mis" : "crear");
    }
  });
  pestanas.addEventListener("keydown", e => {
    // Dos pestañas: las dos flechas llevan a la otra.
    const orden = [pestanaCrear, pestanaMis];
    const i = orden.indexOf(doc.activeElement);
    const destino = {
      ArrowRight: orden[1 - i],
      ArrowLeft: orden[1 - i],
      Home: orden[0],
      End: orden[1],
    }[e.key];
    if (i < 0 || !destino) {
      return;
    }
    e.preventDefault();
    verPestana(destino == pestanaMis ? "mis" : "crear", true);
  });

  let cerrado = false;
  const cerrar = () => {
    if (!cerrado && dialogo.open) {
      dialogo.close();
    }
  };
  cerrarBoton.addEventListener("click", cerrar);
  // Un clic fuera del diálogo (sin velo, en la página de detrás) lo cierra, como Esc.
  dialogo.addEventListener("click", e => {
    if (e.target != dialogo) {
      return;
    }
    const r = dialogo.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
      cerrar();
    }
  });
  // Esc cierra el diálogo, y solo el diálogo (no el panel de «Personalizar» de detrás).
  dialogo.addEventListener("keydown", e => {
    if (e.key == "Escape") {
      e.stopPropagation();
    }
  });
  dialogo.addEventListener("close", () => {
    cerrado = true;
    abiertos.delete(doc);
    dialogo.remove();
    if (abridor?.isConnected) {
      abridor.focus();
    }
  });

  const controlador = {
    actualizar(nuevo) {
      if (cerrado || !nuevo) {
        return;
      }
      estado = { ...estado, ...nuevo };
      if (confirmar.hidden || enLista(s.seleccion)) {
        pintarMis();
      } else {
        dejarDeBorrar();
      }
    },
    cerrar,
  };
  abiertos.set(doc, controlador);

  pintarCrear();
  pintarMis();
  verPestana("crear");
  (doc.body ?? doc.documentElement).append(dialogo);
  dialogo.showModal();
  area.focus();
  return controlador;
}
