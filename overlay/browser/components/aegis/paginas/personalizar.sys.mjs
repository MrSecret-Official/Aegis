/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · aspecto de las páginas propias en su proceso de contenido. Lo llama AegisPaginasChild al crearse cada
 * documento (antes de pintarse) y deshace lo suyo cuando la página se va:
 * - énfasis (todas las páginas propias): el estado que publica enfasis.sys.mjs en sharedData, en la raíz;
 * - nueva pestaña (about:newtab, about:home): el fondo, la posición del buscador, el orden y la separación de los
 *   accesos y el buscador, el ancho del buscador (prefs aegis.nuevapestana.*, docs/DISENO.md §9) y las secciones
 *   de Aegis en «Personalizar»: Fondo, Énfasis y Diseño, delante de los accesos de Firefox y de «Más ajustes». En
 *   Énfasis, el «+» abre el selector del personalizado (selector-enfasis.sys.mjs); lo que elige o guarda se pide al
 *   proceso principal (mensajes propio-usar, propio-guardar y propio-borrar, que enfasis.sys.mjs valida).
 *
 * Un proceso de contenido no escribe prefs: los cambios se piden al proceso principal (enfasis.sys.mjs comprueba el
 * nombre y el valor). Las prefs sí se leen aquí, y su observador aplica cada cambio en todas las pestañas nuevas
 * abiertas. Sin red y sin temporizadores: solo eventos.
 */

import {
  ANCHO,
  CLAVE_COMPARTIDA,
  ENFASIS,
  ESPACIADO,
  MENSAJE,
  MENSAJE_IMAGEN,
  MENSAJE_PROPIO,
  PROPIO,
  pintarPropio,
  sinPerfil,
} from "../enfasis.sys.mjs";
import { clave, leerGuardados, validarAcento } from "../enfasis-propio.sys.mjs";
import { abrirSelector, botonMas, nombreDe } from "../selector-enfasis.sys.mjs";

const RAMA = "aegis.nuevapestana.";
const PREF_FONDO = RAMA + "fondo";
const PREF_POSICION = RAMA + "posicion";
const PREF_ACCESOS = RAMA + "accesos";
const PREF_ESPACIADO = RAMA + "espaciado";
const PREF_ANCHO = RAMA + "ancho";
const PREF_BUSCADOR = "browser.newtabpage.activity-stream.showSearch";
const PREF_ENFASIS = "aegis.enfasis";

const FONDOS = ["liso", "degradado", "enfasis", "imagen"];

const HTML = "http://www.w3.org/1999/xhtml";

let localizacion;
/**
 * Textos de Aegis con su propio Localization síncrono (nunca el document.l10n de la página).
 *
 * @param {string} id
 * @param {object} [args]
 */
function texto(id, args) {
  localizacion ??= new Localization(["aegis.ftl", "branding/brand.ftl"], true);
  try {
    return localizacion.formatValueSync(id, args) ?? "";
  } catch (e) {
    console.error(`Aegis: texto ${id}`, e);
    return "";
  }
}

function prefTexto(nombre, valores, serie) {
  const v = Services.prefs.getStringPref(nombre, serie);
  return valores.includes(v) ? v : serie;
}

/** Valor entero de una pref dentro de su rango ({minimo, maximo, serie}). */
function prefRango(nombre, rango) {
  const v = Services.prefs.getIntPref(nombre, rango.serie);
  return Math.min(rango.maximo, Math.max(rango.minimo, v));
}

function espaciado() {
  return prefRango(PREF_ESPACIADO, ESPACIADO);
}

function ancho() {
  return prefRango(PREF_ANCHO, ANCHO);
}

/** Pide al proceso principal que cambie una pref (enfasis.sys.mjs solo acepta las de Personalizar). */
function pedirPref(nombre, valor) {
  Services.cpmm.sendAsyncMessage(MENSAJE, { tipo: "pref", nombre, valor });
}

// ── Énfasis ───────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Pone el énfasis en la raíz de una página propia y lo mantiene al día.
 *
 * @param {Window} win
 * @returns {() => void} para dejar de seguirlo
 */
function enfasis(win) {
  const pintar = () => {
    const raiz = win.document?.documentElement;
    const datos = Services.cpmm.sharedData.get(CLAVE_COMPARTIDA);
    if (!raiz || !datos) {
      return;
    }
    // Crear un perfil nuevo no es de ningún perfil: el énfasis de serie de Aegis (enfasis.sys.mjs, sinPerfil).
    if (sinPerfil(win.document.documentURI)) {
      raiz.removeAttribute("aegis-enfasis");
      raiz.removeAttribute("aegis-enfasis-degradado");
      return;
    }
    if (datos.modo == "monocromo" || !(ENFASIS.includes(datos.modo) || datos.modo == PROPIO)) {
      raiz.removeAttribute("aegis-enfasis");
    } else {
      raiz.setAttribute("aegis-enfasis", datos.modo);
    }
    // Los colores del personalizado (validados otra vez allí) y, si es el elegido y tiene dos, el degradado.
    pintarPropio(raiz, datos.modo, datos.propio);
    // Siempre que se sepan: también las usan las muestras de «Personalizar».
    for (const [variable, valor] of [
      ["--aegis-enfasis-windows", datos.windows],
      ["--aegis-enfasis-fondo", datos.fondo],
    ]) {
      if (valor) {
        raiz.style.setProperty(variable, valor);
      } else {
        raiz.style.removeProperty(variable);
      }
    }
  };
  const alCambiar = e => {
    if (e.changedKeys.includes(CLAVE_COMPARTIDA)) {
      pintar();
    }
  };
  pintar();
  Services.cpmm.sharedData.addEventListener("change", alCambiar);
  return () => Services.cpmm.sharedData.removeEventListener("change", alCambiar);
}

// ── Imagen propia de la nueva pestaña ─────────────────────────────────────────────────────────────────────────────

/** La imagen propia (Blob) en este proceso, compartida por todas sus pestañas nuevas. */
let imagen = null;
/** Pestañas nuevas abiertas en este proceso que esperan la imagen (o un error al guardarla). */
const avisos = new Set();
let escuchando = false;

function recibirImagen(mensaje) {
  if (mensaje.data?.imagen) {
    imagen = mensaje.data.imagen;
  }
  for (const aviso of avisos) {
    aviso(mensaje.data ?? {});
  }
}

function seguirImagen(aviso) {
  if (!escuchando) {
    escuchando = true;
    Services.cpmm.addMessageListener(MENSAJE_IMAGEN, recibirImagen);
  }
  avisos.add(aviso);
  return () => avisos.delete(aviso);
}

// ── El personalizado con su nombre y «Mis énfasis» ────────────────────────────────────────────────────────────────

/**
 * Lo que no va a sharedData (que ven también los procesos de las webs): el personalizado en uso con su nombre y los
 * guardados. enfasis.sys.mjs los manda solo a este proceso (el de las páginas privilegiadas), al pedirlos al abrir
 * «Personalizar» y cada vez que cambian. Se validan otra vez aquí.
 */
let personales = { propio: null, guardados: [] };
const avisosPersonales = new Set();
let escuchandoPersonales = false;

function recibirPersonales(mensaje) {
  const datos = mensaje.data ?? {};
  personales = {
    propio: validarAcento(datos.propio),
    guardados: leerGuardados(JSON.stringify(Array.isArray(datos.guardados) ? datos.guardados : [])),
  };
  for (const aviso of avisosPersonales) {
    aviso();
  }
}

/** Sigue los personales (y los pide al proceso principal); devuelve cómo dejar de seguirlos. */
function seguirPersonales(aviso) {
  if (!escuchandoPersonales) {
    escuchandoPersonales = true;
    Services.cpmm.addMessageListener(MENSAJE_PROPIO, recibirPersonales);
  }
  avisosPersonales.add(aviso);
  Services.cpmm.sendAsyncMessage(MENSAJE, { tipo: "pedir-propio" });
  return () => avisosPersonales.delete(aviso);
}

/**
 * El énfasis elegido (sharedData) con el personalizado en uso y los guardados: el nombre solo si los colores son los
 * del que está en uso ahora (el mensaje y sharedData pueden llegar en cualquier orden).
 */
function estadoEnfasis() {
  const datos = Services.cpmm.sharedData.get(CLAVE_COMPARTIDA) ?? {};
  const colores = validarAcento(datos.propio);
  const conNombre = colores && personales.propio && clave(personales.propio) == clave(colores) ? personales.propio : colores;
  return { modo: datos.modo ?? "monocromo", propio: conNombre, guardados: personales.guardados };
}

// ── Nueva pestaña ─────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Elemento con atributos y texto.
 *
 * @param {Document} doc
 * @param {string} etiqueta
 * @param {object} [atributos]
 * @param {string} [contenido]
 */
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

/** Sección con etiqueta en versalitas y tarjeta (como las de Ajustes). */
function seccion(doc, id, titulo) {
  const caja = crear(doc, "section", { class: "aegis-np-seccion", "aria-labelledby": id });
  caja.append(crear(doc, "h2", { class: "aegis-np-etiqueta", id }, titulo));
  const tarjeta = crear(doc, "div", { class: "aegis-np-tarjeta" });
  caja.append(tarjeta);
  return [caja, tarjeta];
}

/**
 * Grupo de opciones con radios nativos (flechas del teclado gratis), cada uno dentro de su etiqueta.
 *
 * @returns {HTMLElement}
 */
function grupo(doc, { nombre, clase, etiqueta, opciones }) {
  const caja = crear(doc, "div", { class: clase, role: "radiogroup", "aria-labelledby": etiqueta });
  for (const { valor, contenido, titulo, claseOpcion } of opciones) {
    const opcion = crear(doc, "label", { class: claseOpcion });
    if (titulo) {
      opcion.setAttribute("title", titulo);
    }
    const radio = crear(doc, "input", { type: "radio", name: nombre, value: valor });
    opcion.append(radio, ...contenido);
    caja.append(opcion);
  }
  return caja;
}

function marcarGrupo(caja, valor) {
  for (const radio of caja.querySelectorAll("input[type=radio]")) {
    radio.checked = radio.value == valor;
  }
}

/**
 * Deslizador en px con su rótulo y su valor (DISENO §9). Al moverlo se aplica en esta pestaña al momento; al soltarlo
 * se pide la pref (y con ella cambian las demás pestañas nuevas).
 *
 * @param {Document} doc
 * @param {{id: string, rango: object, pref: string, aplicar: (px: number) => void}} opciones
 * @returns {{fila: HTMLElement, mostrar: (px: number) => void}}
 */
function deslizador(doc, { id, rango, pref, aplicar }) {
  const fila = crear(doc, "div", { class: "aegis-np-bloque" });
  const cabecera = crear(doc, "div", { class: "aegis-np-cabecera" });
  const valor = crear(doc, "output", { class: "aegis-np-valor", for: id });
  cabecera.append(crear(doc, "label", { class: "aegis-np-rotulo", for: id }, texto(id)), valor);
  const entrada = crear(doc, "input", {
    type: "range",
    id,
    class: "aegis-np-deslizador",
    min: String(rango.minimo),
    max: String(rango.maximo),
    step: String(rango.paso),
  });
  fila.append(cabecera, entrada);
  const mostrar = px => {
    entrada.value = String(px);
    valor.textContent = texto("aegis-np-espaciado-valor", { px });
    entrada.style.setProperty("--aegis-np-progreso", `${((px - rango.minimo) / (rango.maximo - rango.minimo)) * 100}%`);
  };
  entrada.addEventListener("input", () => {
    const px = Number(entrada.value);
    mostrar(px);
    aplicar(px);
  });
  entrada.addEventListener("change", () => pedirPref(pref, Number(entrada.value)));
  return { fila, mostrar };
}

/**
 * Construye las secciones de Aegis para «Personalizar».
 *
 * @param {Document} doc
 * @param {{espaciado: (px: number) => void, ancho: (px: number) => void}} aplicar ponen la separación y el ancho del
 *   buscador en esta pestaña al mover los deslizadores
 * @returns {{raiz: HTMLElement, actualizar: () => void, mostrarError: () => void}}
 */
function construir(doc, aplicar) {
  const raiz = crear(doc, "div", { class: "aegis-np" });

  // Fondo
  const [fondo, tarjetaFondo] = seccion(doc, "aegis-np-fondo-titulo", texto("aegis-np-fondo-titulo"));
  const fondos = grupo(doc, {
    nombre: "aegis-np-fondo",
    clase: "aegis-np-fondos",
    etiqueta: "aegis-np-fondo-titulo",
    opciones: FONDOS.map(valor => ({
      valor,
      claseOpcion: "aegis-np-opcion",
      contenido: [
        crear(doc, "span", { class: "aegis-np-miniatura", "aegis-np-miniatura": valor }),
        crear(doc, "span", { class: "aegis-np-nombre" }, texto(`aegis-np-fondo-${valor}`)),
      ],
    })),
  });
  const archivo = crear(doc, "input", { type: "file", accept: "image/jpeg,image/png,image/webp,image/avif,image/gif", hidden: "" });
  const cambiar = crear(doc, "button", { type: "button", class: "aegis-np-boton" }, texto("aegis-np-imagen-cambiar"));
  const error = crear(doc, "p", { class: "aegis-np-error", role: "status" });
  const filaImagen = crear(doc, "div", { class: "aegis-np-imagen" });
  filaImagen.append(cambiar, archivo);
  tarjetaFondo.append(fondos, filaImagen, error);

  // Énfasis: las mismas opciones que Ajustes › Apariencia, y al final el «+» del personalizado (un botón que abre su
  // selector, selector-enfasis.sys.mjs). Las muestras (radios) y el «+» comparten la rejilla de siete.
  const [seccionEnfasis, tarjetaEnfasis] = seccion(doc, "aegis-np-enfasis-titulo", texto("aegis-enfasis-titulo"));
  const rejillaEnfasis = crear(doc, "div", { class: "aegis-np-muestras" });
  const muestras = grupo(doc, {
    nombre: "aegis-np-enfasis",
    clase: "aegis-np-muestras-grupo",
    etiqueta: "aegis-np-enfasis-titulo",
    opciones: ENFASIS.map(valor => {
      const nombre = texto(`aegis-enfasis-${valor}`);
      return {
        valor,
        titulo: nombre,
        claseOpcion: "aegis-np-muestra",
        contenido: [
          crear(doc, "span", { class: "aegis-enfasis-circulo", "aegis-enfasis-muestra": valor }),
          crear(doc, "span", { class: "aegis-np-oculto" }, nombre),
        ],
      };
    }),
  });
  const mas = botonMas(doc, { clase: "aegis-np-muestra", claseCirculo: "aegis-enfasis-circulo", texto });
  rejillaEnfasis.append(muestras, mas.boton);
  const elegido = crear(doc, "p", { class: "aegis-np-elegido" });
  tarjetaEnfasis.append(rejillaEnfasis, elegido);
  let selector = null;
  mas.boton.addEventListener("click", () => {
    selector = abrirSelector(doc, {
      texto,
      estado: estadoEnfasis(),
      // El proceso principal valida y escribe las prefs (enfasis.sys.mjs); el estado nuevo vuelve por sharedData (el
      // modo y los colores) y por MENSAJE_PROPIO (el nombre y los guardados).
      usar: acento => Services.cpmm.sendAsyncMessage(MENSAJE, { tipo: "propio-usar", acento }),
      guardar: acento => Services.cpmm.sendAsyncMessage(MENSAJE, { tipo: "propio-guardar", acento }),
      borrar: clave => Services.cpmm.sendAsyncMessage(MENSAJE, { tipo: "propio-borrar", clave }),
      abridor: mas.boton,
    });
  });

  // Diseño: buscador, su posición, los accesos y la separación.
  const [diseno, tarjetaDiseno] = seccion(doc, "aegis-np-diseno-titulo", texto("aegis-np-diseno-titulo"));
  const filaBuscador = crear(doc, "label", { class: "aegis-np-fila" });
  const interruptor = crear(doc, "input", { type: "checkbox", role: "switch", class: "aegis-np-interruptor" });
  filaBuscador.append(crear(doc, "span", {}, texto("aegis-np-buscador")), interruptor);

  const segmentos = (id, nombre, valores) => {
    const fila = crear(doc, "div", { class: "aegis-np-bloque" });
    fila.append(crear(doc, "span", { class: "aegis-np-rotulo", id }, texto(id)));
    const caja = grupo(doc, {
      nombre,
      clase: "aegis-np-segmentos",
      etiqueta: id,
      opciones: valores.map(valor => ({
        valor,
        claseOpcion: "aegis-np-segmento",
        contenido: [crear(doc, "span", {}, texto(`${id}-${valor}`))],
      })),
    });
    fila.append(caja);
    return [fila, caja];
  };
  const [filaPosicion, posicion] = segmentos("aegis-np-posicion", "aegis-np-posicion", ["centro", "arriba"]);
  const [filaAccesos, accesos] = segmentos("aegis-np-accesos", "aegis-np-accesos", ["arriba", "abajo"]);

  const separacion = deslizador(doc, {
    id: "aegis-np-espaciado",
    rango: ESPACIADO,
    pref: PREF_ESPACIADO,
    aplicar: aplicar.espaciado,
  });
  const anchura = deslizador(doc, { id: "aegis-np-ancho", rango: ANCHO, pref: PREF_ANCHO, aplicar: aplicar.ancho });
  tarjetaDiseno.append(filaBuscador, filaPosicion, filaAccesos, separacion.fila, anchura.fila);

  raiz.append(fondo, seccionEnfasis, diseno);

  const actualizar = () => {
    const f = prefTexto(PREF_FONDO, FONDOS, "liso");
    marcarGrupo(fondos, f);
    filaImagen.hidden = f != "imagen";
    // El elegido sale de lo publicado (con «propio», validado allí); la pref puede llegar antes, así que vale de reserva.
    const enfasisActual = estadoEnfasis();
    const e = Services.cpmm.sharedData.has(CLAVE_COMPARTIDA)
      ? enfasisActual.modo
      : Services.prefs.getStringPref(PREF_ENFASIS, "monocromo");
    marcarGrupo(muestras, e);
    mas.marcar(e, enfasisActual.propio);
    elegido.textContent =
      e == PROPIO && enfasisActual.propio
        ? texto("aegis-enfasis-propio-actual", { nombre: nombreDe(enfasisActual.propio) })
        : texto(`aegis-enfasis-${ENFASIS.includes(e) ? e : "monocromo"}`);
    selector?.actualizar(enfasisActual);
    interruptor.checked = Services.prefs.getBoolPref(PREF_BUSCADOR, true);
    marcarGrupo(posicion, prefTexto(PREF_POSICION, ["centro", "arriba"], "centro"));
    marcarGrupo(accesos, prefTexto(PREF_ACCESOS, ["arriba", "abajo"], "arriba"));
    separacion.mostrar(espaciado());
    anchura.mostrar(ancho());
  };

  // Cambios
  fondos.addEventListener("change", ev => {
    const valor = ev.target.value;
    error.textContent = "";
    if (valor == "imagen" && !imagen) {
      // Sin imagen guardada: primero se elige; la pref la cambia el proceso principal al guardarla.
      actualizar();
      archivo.click();
      return;
    }
    pedirPref(PREF_FONDO, valor);
  });
  cambiar.addEventListener("click", () => archivo.click());
  archivo.addEventListener("change", () => {
    const elegidoArchivo = archivo.files?.[0];
    archivo.value = "";
    if (!elegidoArchivo) {
      return;
    }
    error.textContent = "";
    Services.cpmm.sendAsyncMessage(MENSAJE, { tipo: "imagen", imagen: elegidoArchivo });
  });
  muestras.addEventListener("change", ev => pedirPref(PREF_ENFASIS, ev.target.value));
  interruptor.addEventListener("change", () => pedirPref(PREF_BUSCADOR, interruptor.checked));
  posicion.addEventListener("change", ev => pedirPref(PREF_POSICION, ev.target.value));
  accesos.addEventListener("change", ev => pedirPref(PREF_ACCESOS, ev.target.value));

  const mostrarError = () => {
    error.textContent = texto("aegis-np-imagen-error");
  };

  actualizar();
  return { raiz, actualizar, mostrarError };
}

/**
 * Nueva pestaña: aplica las prefs en la raíz y añade las secciones de Aegis a «Personalizar» cuando la página lo monte.
 *
 * @param {Window} win
 * @returns {() => void} para deshacerlo
 */
function nuevaPestana(win) {
  const doc = win.document;
  const raiz = doc.documentElement;
  let urlImagen = null;
  let interfaz = null;

  const aplicarEspaciado = px => raiz.style.setProperty("--aegis-np-espaciado", `${px}px`);
  const aplicarAncho = px => raiz.style.setProperty("--aegis-np-ancho", `${px}px`);

  const ponerImagen = () => {
    if (!imagen || urlImagen) {
      return;
    }
    urlImagen = win.URL.createObjectURL(imagen);
    raiz.style.setProperty("--aegis-np-imagen", `url("${urlImagen}")`);
  };

  const aplicar = () => {
    const fondo = prefTexto(PREF_FONDO, FONDOS, "liso");
    raiz.setAttribute("aegis-np-fondo", fondo);
    raiz.setAttribute("aegis-np-posicion", prefTexto(PREF_POSICION, ["centro", "arriba"], "centro"));
    raiz.setAttribute("aegis-np-accesos", prefTexto(PREF_ACCESOS, ["arriba", "abajo"], "arriba"));
    aplicarEspaciado(espaciado());
    aplicarAncho(ancho());
    if (fondo == "imagen") {
      if (imagen) {
        ponerImagen();
      } else {
        Services.cpmm.sendAsyncMessage(MENSAJE, { tipo: "pedir-imagen" });
      }
    }
    interfaz?.actualizar();
  };

  const dejarImagen = seguirImagen(datos => {
    if (datos.error) {
      interfaz?.mostrarError();
      return;
    }
    // Imagen nueva: la URL anterior se suelta y se crea otra.
    if (urlImagen) {
      win.URL.revokeObjectURL(urlImagen);
      urlImagen = null;
    }
    if (raiz.getAttribute("aegis-np-fondo") == "imagen") {
      ponerImagen();
    }
  });

  const observador = { observe: () => aplicar() };
  Services.prefs.addObserver(RAMA, observador);
  Services.prefs.addObserver(PREF_BUSCADOR, observador);
  Services.prefs.addObserver(PREF_ENFASIS, observador);
  // El énfasis elegido y los colores del personalizado llegan por sharedData; su nombre y los guardados, por mensaje
  // (seguirPersonales, que se pide al montar «Personalizar»).
  const alCambiarEnfasis = e => {
    if (e.changedKeys.includes(CLAVE_COMPARTIDA)) {
      interfaz?.actualizar();
    }
  };
  Services.cpmm.sharedData.addEventListener("change", alCambiarEnfasis);
  let dejarPersonales = null;
  aplicar();

  // «Personalizar» lo monta React: se espera a que exista su lista de secciones y se vuelve a poner si React la
  // rehace. Los observadores miran solo el árbol de la página mientras se monta y, después, solo el panel.
  let observadorPanel = null;
  const colocar = () => {
    const lista = doc.querySelector(".customize-menu .home-section");
    if (!lista) {
      return false;
    }
    if (!interfaz) {
      interfaz = construir(doc, { espaciado: aplicarEspaciado, ancho: aplicarAncho });
      // Que la muestra «Fondo de escritorio» tenga su color.
      Services.cpmm.sendAsyncMessage(MENSAJE, { tipo: "fondo-escritorio" });
      // El nombre del personalizado y «Mis énfasis».
      dejarPersonales = seguirPersonales(() => interfaz?.actualizar());
    }
    if (!interfaz.raiz.isConnected || interfaz.raiz.parentNode != lista) {
      lista.insertBefore(interfaz.raiz, lista.querySelector(":scope > .settings-toggles"));
    }
    return true;
  };
  const vigilarPanel = () => {
    const panel = doc.querySelector(".customize-menu");
    observadorPanel = new win.MutationObserver(() => colocar());
    observadorPanel.observe(panel, { childList: true, subtree: true });
  };
  let observadorPagina = null;
  if (colocar()) {
    vigilarPanel();
  } else {
    observadorPagina = new win.MutationObserver(() => {
      if (colocar()) {
        observadorPagina.disconnect();
        observadorPagina = null;
        vigilarPanel();
      }
    });
    observadorPagina.observe(doc, { childList: true, subtree: true });
  }

  return () => {
    Services.prefs.removeObserver(RAMA, observador);
    Services.prefs.removeObserver(PREF_BUSCADOR, observador);
    Services.prefs.removeObserver(PREF_ENFASIS, observador);
    Services.cpmm.sharedData.removeEventListener("change", alCambiarEnfasis);
    dejarPersonales?.();
    dejarImagen();
    observadorPagina?.disconnect();
    observadorPanel?.disconnect();
  };
}

/**
 * Punto de entrada desde AegisPaginasChild, al crearse el documento.
 *
 * @param {Window} win
 * @param {string} direccion
 * @returns {() => void} para deshacerlo cuando la página se va
 */
export function aspecto(win, direccion) {
  const deshacer = [];
  try {
    deshacer.push(enfasis(win));
  } catch (e) {
    console.error("Aegis: énfasis de la página", e);
  }
  if (direccion.startsWith("about:newtab") || direccion.startsWith("about:home")) {
    try {
      deshacer.push(nuevaPestana(win));
    } catch (e) {
      console.error("Aegis: nueva pestaña", e);
    }
  }
  return () => {
    for (const f of deshacer) {
      try {
        f();
      } catch {}
    }
  };
}
