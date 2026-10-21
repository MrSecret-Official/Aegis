/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · la bienvenida del navegador (about:bienvenida; docs/INSTALADOR.md, «Sin el instalador: la bienvenida»).
 *
 * La versión de la Microsoft Store y el zip no pasan por Aegis Setup, así que no hay distribution/aegis-instalador.json
 * con lo elegido. En ese caso (y solo en el primer arranque de un perfil nuevo: AegisInstalador.inicio lo dice),
 * AegisArranque pide la bienvenida (pedir(): pref aegis.bienvenida.pendiente) y la primera ventana la abre en lugar de
 * about:conexiones. Hace las mismas preguntas que el asistente, con el mismo aspecto (paginas/bienvenida.html y .css):
 * cómo navegar, Escudos, buscador y apariencia, con lo recomendado elegido de serie. Al terminar («Usar lo
 * recomendado» en el primer paso o «Continuar» en el último), aplica lo elegido con AegisInstalador.aplicar (las mismas
 * funciones y valores que el archivo del instalador), quita la marca para que no vuelva a salir y lleva la pestaña a
 * about:conexiones, que sigue siendo la puerta de la red. Si se cierra sin terminar, sale otra vez en el siguiente
 * arranque, como about:conexiones; mientras tanto no se aplica nada (el perfil se queda con lo de serie).
 *
 * La página es HTML estático sin scripts (su CSP no los admite): sus tarjetas son radios nativos y este módulo, desde el
 * proceso padre, atiende los botones, el teclado y los pasos. Sin red: la página no carga nada de fuera y elegir no
 * conecta nada (Startpage y Brave Search se añaden como buscadores del usuario sin conexión, docs/CONEXIONES.md). Sin
 * temporizadores: solo trabaja cuando el usuario pulsa algo.
 *
 * Tutorial de Workflow (docs/INSTALADOR.md, «Tutorial de Workflow»): cuatro pasos en la misma página (pestañas
 * verticales, mover y fijar, contenedores y acciones). Si se termina la bienvenida con Workflow elegido, se aplica lo
 * elegido (la ventana pasa ya a pestañas verticales) y sale el tutorial; al acabarlo o saltarlo, la pestaña va a
 * about:conexiones como siempre (si se cierra antes, about:conexiones sale en el siguiente arranque, como cuando se
 * cierra la bienvenida). Con Estándar, nada cambia. Para verlo cuando se quiera, about:bienvenida?tutorial (Ajustes ›
 * Pestañas y navegación y la acción «Ver el tutorial de Workflow»): solo el tutorial, y al acabar se cierra la pestaña.
 */

import { AegisInstalador, RECOMENDADO } from "./instalador.sys.mjs";
import { AegisConexiones } from "./conexiones.sys.mjs";

const PENDIENTE = "aegis.bienvenida.pendiente";
/** Las preguntas, en el orden de los pasos 2 a 5 (el 1 es el resumen). */
const PREGUNTAS = ["modo", "escudos", "buscador", "apariencia"];
const PASOS = PREGUNTAS.length + 1;

const NOMBRE = "bienvenida";
const DIRECCION = `about:${NOMBRE}`;
/** Solo el tutorial de Workflow, para verlo cuando se quiera. */
const DIRECCION_TUTORIAL = `${DIRECCION}?tutorial`;
const CONTRATO = `@mozilla.org/network/protocol/about;1?what=${NOMBRE}`;
const CID = Components.ID("{35795094-6616-42e0-8f15-ec132a3f1915}");
const PAGINA = new URL("paginas/bienvenida.html", import.meta.url).href;

/** El módulo about:bienvenida (nsIAboutModule), como about:conexiones: proceso padre. */
const modulo = {
  QueryInterface: ChromeUtils.generateQI(["nsIAboutModule", "nsIFactory"]),

  createInstance(iid) {
    return this.QueryInterface(iid);
  },

  getURIFlags() {
    return Ci.nsIAboutModule.IS_SECURE_CHROME_UI;
  },

  getChromeURI() {
    return Services.io.newURI(PAGINA);
  },

  newChannel(uri, loadInfo) {
    const canal = Services.io.newChannelFromURIWithLoadInfo(Services.io.newURI(PAGINA), loadInfo);
    canal.originalURI = uri;
    canal.owner = Services.scriptSecurityManager.getSystemPrincipal();
    return canal;
  },
};

/** Documentos de la página ya preparados. */
const preparados = new WeakSet();

/** Flechas en un grupo de tarjetas: [columna, fila] que se mueve. */
const FLECHAS = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

/**
 * Prepara la página: dibuja las miniaturas, marca lo recomendado y atiende tarjetas, filas del resumen, botones del pie
 * y teclado (DISENO §9, «Instalador»: Tab entre controles, flechas entre tarjetas, Intro hace la acción principal y
 * Esc vuelve un paso).
 *
 * @param {Document} doc
 */
function prepararPagina(doc) {
  const win = doc.defaultView;
  const $ = id => doc.getElementById(id);
  const pasos = [...doc.querySelectorAll(".bienvenida-paso[data-paso]")];
  const tutorial = [...doc.querySelectorAll(".bienvenida-tutorial")];
  const principal = $("bienvenida-principal");
  const secundario = $("bienvenida-secundario");
  const saltar = $("bienvenida-saltar");
  const eleccion = { ...RECOMENDADO };
  let paso = 0;
  let terminada = false;
  // Tutorial de Workflow: solo él (about:bienvenida?tutorial) o detrás de la bienvenida.
  const soloTutorial = /[?&]tutorial\b/.test(doc.documentURI);
  let enTutorial = false;
  let pasoTutorial = 0;

  // Miniaturas: cada hueco recibe su plantilla (y las de Escudos, la cifra del contador).
  for (const hueco of doc.querySelectorAll(".bienvenida-mini[data-mini]")) {
    const plantilla = $(`bienvenida-plantilla-${hueco.dataset.mini}`);
    if (plantilla && !hueco.firstElementChild) {
      hueco.append(plantilla.content.cloneNode(true));
    }
    const cifra = hueco.querySelector(".m-cifra");
    if (cifra) {
      cifra.textContent = hueco.dataset.cifra ?? "";
    }
  }

  const radios = pregunta => [...doc.querySelectorAll(`input[type="radio"][name="${pregunta}"]`)];
  const esRecomendado = () => PREGUNTAS.every(p => eleccion[p] == RECOMENDADO[p]);

  /** El resumen del primer paso, la nota del modo y el texto del botón principal, con lo elegido. */
  const pintarEleccion = () => {
    for (const pregunta of PREGUNTAS) {
      const radio = radios(pregunta).find(r => r.value == eleccion[pregunta]);
      const nombre = radio?.closest("label")?.querySelector(".bienvenida-tarjeta-nombre");
      const valor = doc.querySelector(`[data-valor="${pregunta}"]`);
      if (!nombre || !valor) {
        continue;
      }
      const id = nombre.getAttribute("data-l10n-id");
      if (id) {
        doc.l10n.setAttributes(valor, id);
      } else {
        // Los buscadores: su nombre, que no se traduce.
        valor.removeAttribute("data-l10n-id");
        valor.textContent = nombre.textContent;
      }
    }
    doc.l10n.setAttributes(
      $("bienvenida-modo-nota"),
      eleccion.modo == "workflow" ? "aegis-bienvenida-modo-nota-workflow" : "aegis-bienvenida-modo-nota-estandar"
    );
    pintarPie();
  };

  /** Las rayitas de los pasos: tantas como pasos (5 en la bienvenida, 4 en el tutorial), las hechas marcadas. */
  const pintarRayitas = (total, actual) => {
    const rayitas = $("bienvenida-rayitas");
    if (rayitas.children.length != total) {
      rayitas.replaceChildren(...Array.from({ length: total }, () => doc.createElement("span")));
    }
    [...rayitas.children].forEach((rayita, i) => {
      rayita.toggleAttribute("hecho", i <= actual);
      rayita.toggleAttribute("actual", i == actual);
    });
  };

  /** Rayitas, «Paso N de 5» y los dos botones. */
  const pintarPie = () => {
    if (enTutorial) {
      const ultimo = pasoTutorial == tutorial.length - 1;
      pintarRayitas(tutorial.length, pasoTutorial);
      doc.l10n.setAttributes($("bienvenida-paso-n"), "aegis-bienvenida-paso", {
        n: pasoTutorial + 1,
        total: tutorial.length,
      });
      // En el primero no hay «Atrás» (lo de antes ya está aplicado); saltar está arriba.
      secundario.hidden = pasoTutorial == 0;
      doc.l10n.setAttributes(secundario, "aegis-bienvenida-atras");
      const fin = soloTutorial ? "aegis-tutorial-hecho" : "aegis-tutorial-empezar";
      doc.l10n.setAttributes(principal, ultimo ? fin : "aegis-tutorial-siguiente");
      return;
    }
    pintarRayitas(PASOS, paso);
    doc.l10n.setAttributes($("bienvenida-paso-n"), "aegis-bienvenida-paso", { n: paso + 1, total: PASOS });
    doc.l10n.setAttributes(secundario, paso == 0 ? "aegis-bienvenida-personalizar" : "aegis-bienvenida-atras");
    let texto = "aegis-bienvenida-continuar";
    if (paso == 0) {
      texto = esRecomendado() ? "aegis-bienvenida-usar-recomendado" : "aegis-bienvenida-usar-eleccion";
    }
    doc.l10n.setAttributes(principal, texto);
  };

  /** Va a un paso: lo enseña (se desliza desde el lado del que viene) y le da el foco a su título. */
  const ir = n => {
    if (n == paso || n < 0 || n >= PASOS || terminada || enTutorial) {
      return;
    }
    doc.querySelector(".bienvenida").dataset.direccion = n < paso ? "atras" : "adelante";
    paso = n;
    for (const seccion of pasos) {
      seccion.hidden = Number(seccion.dataset.paso) != n;
    }
    pintarPie();
    win.scrollTo(0, 0);
    // El lector de pantalla lee el paso nuevo; Tab sigue por su primer control.
    pasos[n]?.querySelector(".bienvenida-titulo")?.focus();
  };

  const elegir = (pregunta, valor) => {
    if (!PREGUNTAS.includes(pregunta) || eleccion[pregunta] == valor) {
      return;
    }
    eleccion[pregunta] = valor;
    pintarEleccion();
  };

  /** Un paso del tutorial, con la misma entrada que los de la bienvenida y el foco en su título. */
  const irTutorial = n => {
    if (n < 0 || n >= tutorial.length || terminada) {
      return;
    }
    doc.querySelector(".bienvenida").dataset.direccion = n < pasoTutorial ? "atras" : "adelante";
    pasoTutorial = n;
    for (const seccion of pasos) {
      seccion.hidden = true;
    }
    tutorial.forEach((seccion, i) => {
      seccion.hidden = i != n;
    });
    pintarPie();
    win.scrollTo(0, 0);
    tutorial[n].querySelector(".bienvenida-titulo")?.focus();
  };

  const empezarTutorial = () => {
    enTutorial = true;
    pasoTutorial = 0;
    saltar.hidden = false;
    doc.l10n.setAttributes(doc.querySelector("title"), "aegis-tutorial-pestana");
    irTutorial(0);
  };

  /** Fin del tutorial (o saltarlo): solo él, se cierra la pestaña; detrás de la bienvenida, a about:conexiones. */
  const terminarTutorial = () => {
    if (terminada) {
      return;
    }
    terminada = true;
    principal.disabled = true;
    secundario.disabled = true;
    saltar.disabled = true;
    if (soloTutorial) {
      AegisBienvenida.cerrarTutorial(win);
    } else {
      AegisBienvenida.aConexiones(win);
    }
  };

  const terminar = () => {
    if (terminada || enTutorial) {
      return;
    }
    // Con Workflow, lo elegido se aplica ya (la ventana pasa a pestañas verticales) y sigue el tutorial.
    if (eleccion.modo == "workflow" && tutorial.length) {
      AegisBienvenida.aplicar({ ...eleccion });
      empezarTutorial();
      return;
    }
    terminada = true;
    principal.disabled = true;
    secundario.disabled = true;
    AegisBienvenida.terminar(win, { ...eleccion });
  };

  const accionPrincipal = () => {
    if (enTutorial) {
      return pasoTutorial == tutorial.length - 1 ? terminarTutorial() : irTutorial(pasoTutorial + 1);
    }
    return paso == 0 || paso == PASOS - 1 ? terminar() : ir(paso + 1);
  };
  const accionSecundaria = () => {
    if (enTutorial) {
      return irTutorial(pasoTutorial - 1);
    }
    return paso == 0 ? ir(1) : ir(paso - 1);
  };

  /** Flechas en un grupo: la tarjeta de al lado (sin dar la vuelta) y, en la rejilla, también arriba y abajo. */
  const mover = (radio, [dx, dy]) => {
    const grupo = radios(radio.name);
    const columnas = Number(radio.closest("[data-columnas]")?.dataset.columnas) || grupo.length;
    const i = grupo.indexOf(radio);
    let j = i;
    if (columnas >= grupo.length) {
      // Una sola fila: arriba y abajo hacen lo mismo que izquierda y derecha, como en un grupo de radios.
      j = i + (dx || dy);
    } else if (dx) {
      const col = i % columnas;
      j = col + dx >= 0 && col + dx < columnas ? i + dx : i;
    } else {
      j = i + dy * columnas;
    }
    if (j != i && j >= 0 && j < grupo.length) {
      grupo[j].checked = true;
      grupo[j].focus();
      elegir(radio.name, grupo[j].value);
    }
  };

  for (const pregunta of PREGUNTAS) {
    for (const radio of radios(pregunta)) {
      radio.checked = radio.value == eleccion[pregunta];
    }
  }
  doc.addEventListener("change", e => {
    if (e.target.type == "radio") {
      elegir(e.target.name, e.target.value);
    }
  });
  for (const fila of doc.querySelectorAll(".bienvenida-fila[data-ir]")) {
    fila.addEventListener("click", () => ir(Number(fila.dataset.ir)));
  }
  principal.addEventListener("click", accionPrincipal);
  secundario.addEventListener("click", accionSecundaria);
  saltar.addEventListener("click", terminarTutorial);
  doc.addEventListener("keydown", e => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || terminada) {
      return;
    }
    const objetivo = e.target;
    if (objetivo?.type == "radio" && FLECHAS[e.key] && !e.shiftKey) {
      e.preventDefault();
      mover(objetivo, FLECHAS[e.key]);
    } else if (e.key == "Escape" && enTutorial) {
      // En el tutorial, Esc vuelve un paso y, en el primero, lo salta.
      e.preventDefault();
      if (pasoTutorial > 0) {
        irTutorial(pasoTutorial - 1);
      } else {
        terminarTutorial();
      }
    } else if (e.key == "Escape" && paso > 0) {
      e.preventDefault();
      ir(paso - 1);
    } else if (e.key == "Enter" && !e.shiftKey && !objetivo?.closest?.("button, a")) {
      // En una tarjeta (o sin nada con foco), Intro hace la acción principal; en un botón, la suya.
      e.preventDefault();
      accionPrincipal();
    }
  });
  pintarEleccion();
  if (soloTutorial) {
    empezarTutorial();
  }
}

export const AegisBienvenida = {
  DIRECCION,

  /** Una vez por arranque, en el proceso padre (AegisArranque.inicio): registra about:bienvenida. */
  inicio() {
    const registro = Components.manager.QueryInterface(Ci.nsIComponentRegistrar);
    if (!registro.isContractIDRegistered(CONTRATO)) {
      registro.registerFactory(CID, "Aegis: about:bienvenida", CONTRATO, modulo);
    }
  },

  /**
   * Primer arranque de un perfil nuevo sin el archivo de Aegis Setup (AegisInstalador.inicio): la bienvenida queda
   * pendiente hasta que el usuario la termine. La instancia con Tor (perfil de usar y tirar) no la tiene.
   */
  pedir() {
    if (Services.prefs.getBoolPref("aegis.tor.instancia", false)) {
      return;
    }
    Services.prefs.setBoolPref(PENDIENTE, true);
  },

  get pendiente() {
    return Services.prefs.getBoolPref(PENDIENTE, false);
  },

  /**
   * Cada ventana del navegador al terminar de abrirse (AegisArranque.ventana), antes que about:conexiones. Mientras la
   * bienvenida esté pendiente, la primera ventana de cada arranque la abre en primer plano.
   *
   * @param {Window} win
   * @returns {boolean} true si la bienvenida se ocupa de llevar a about:conexiones en este arranque (y esa página no
   *   tiene que abrirse sola)
   */
  ventana(win) {
    if (this._mostrada) {
      return true;
    }
    if (!this.pendiente || !win?.gBrowser || win.closed) {
      return false;
    }
    this._mostrada = true;
    win.switchToTabHavingURI(DIRECCION, true, {
      relatedToCurrent: true,
      triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
    });
    return true;
  },

  /**
   * Lo elegido en la página: se aplica (AegisInstalador.aplicar, sin esperar al tema ni al buscador), la bienvenida
   * deja de estar pendiente y la pestaña pasa a about:conexiones (sin dejar la bienvenida en el historial).
   *
   * @param {Window} win la ventana de la página
   * @param {object} eleccion modo, escudos, buscador y apariencia, con los valores del archivo del instalador
   */
  terminar(win, eleccion) {
    this.aplicar(eleccion);
    this.aConexiones(win);
  },

  /**
   * Aplica lo elegido (AegisInstalador.aplicar, sin esperar al tema ni al buscador) y la bienvenida deja de estar
   * pendiente. Con Workflow, antes del tutorial: la ventana ya enseña las pestañas verticales mientras se explican.
   *
   * @param {object} eleccion
   */
  aplicar(eleccion) {
    Services.prefs.clearUserPref(PENDIENTE);
    AegisInstalador.aplicar(eleccion).catch(e => console.error("Aegis: elecciones de la bienvenida", e));
  },

  /** La pestaña de la página pasa a about:conexiones, sin dejar la bienvenida en el historial. */
  aConexiones(win) {
    if (!win.closed) {
      win.location.replace(AegisConexiones.DIRECCION);
    }
  },

  DIRECCION_TUTORIAL,

  /**
   * El tutorial de Workflow cuando se quiera (Ajustes › Pestañas y navegación, acción «Ver el tutorial de Workflow»):
   * about:bienvenida?tutorial en una pestaña, o la que ya lo tenga.
   *
   * @param {Window} win la ventana del navegador
   */
  abrirTutorial(win) {
    win.switchToTabHavingURI(DIRECCION_TUTORIAL, true, {
      triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
    });
  },

  /**
   * Fin del tutorial abierto aparte: se cierra su pestaña (si es la única, antes se abre una nueva para no cerrar la
   * ventana).
   *
   * @param {Window} win la ventana de la página
   */
  cerrarTutorial(win) {
    const browser = win.browsingContext?.top?.embedderElement;
    const ventana = win.browsingContext?.topChromeWindow;
    const tab = ventana?.gBrowser?.getTabForBrowser(browser);
    if (!tab) {
      return;
    }
    if (ventana.gBrowser.visibleTabs.length <= 1) {
      ventana.openTrustedLinkIn(ventana.BROWSER_NEW_TAB_URL, "tab");
    }
    ventana.gBrowser.removeTab(tab);
  },

  /**
   * Cada documento de la página (AegisArranque.aplicarHojas, en document-element-inserted).
   *
   * @param {Document} doc
   */
  pagina(doc) {
    if (preparados.has(doc) || !doc.nodePrincipal?.isSystemPrincipal) {
      return;
    }
    preparados.add(doc);
    const win = doc.defaultView;
    if (doc.readyState == "loading") {
      win.addEventListener("DOMContentLoaded", () => prepararPagina(doc), { once: true });
    } else {
      prepararPagina(doc);
    }
  },
};
