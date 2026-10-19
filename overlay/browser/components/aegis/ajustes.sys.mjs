/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · Ajustes (about:preferences) con la forma del Centro de SecretOS: cabecera pequeña con el icono, el buscador
 * arriba en la barra lateral y las categorías agrupadas con títulos (docs/DISENO.md).
 *
 * Lo llama AegisArranque para cada documento about:preferences o about:settings, en cuanto se crea (antes de que
 * exista el cuerpo). Idempotente, sin temporizadores: solo eventos del propio documento.
 *
 * - La forma va en estilos/ajustes.css (hoja de autor, la pone AegisArranque).
 * - Las piezas de dentro de los componentes de Firefox (shadow DOM: cabecera de la barra, leyendas de los grupos,
 *   ilustraciones…) no las alcanza una hoja de autor: van en estilos/ajustes-sombra.css como hoja de usuario, que sí
 *   entra en el shadow DOM. Sus colores salen de var(--aegis-*), que se heredan.
 */

import { AegisConexiones } from "./conexiones.sys.mjs";
import { minutosDeBloqueo, OPCIONES_BLOQUEO, PREF_BLOQUEO } from "./contrasenas.sys.mjs";
import { AegisEnfasis } from "./enfasis.sys.mjs";
import { AegisEscudosAyuda } from "./escudos-ayuda.sys.mjs";
import { AegisEscudosAjustes } from "./escudos/ajustes.sys.mjs";
import { AegisHuella } from "./huella.sys.mjs";
import { AegisIcono } from "./icono.sys.mjs";
import { AegisTor } from "./tor/tor.sys.mjs";

/** Grupos de la barra lateral (Fluent: aegis.ftl) con las vistas de Firefox que contienen, en orden. */
const GRUPOS = [
  ["aegis-ajustes-grupo-personal", ["paneSync", "paneHome", "paneAppearance"]],
  ["aegis-ajustes-grupo-navegacion", ["paneSearch", "paneTabsBrowsing", "paneDownloads"]],
  // paneEscudos: la categoría propia de Escudos (escudos/ajustes.sys.mjs).
  ["aegis-ajustes-grupo-privacidad", ["panePrivacy", "paneEscudos", "panePasswordsAutofill", "panePermissionsData"]],
  ["aegis-ajustes-grupo-sistema", ["paneLanguages", "paneAccessibility", "paneAbout"]],
];

const HOJA_SOMBRA = "estilos/ajustes-sombra.css";
const ICONO_AEGIS = "estilos/iconos/aegis-pequeno.svg";
/** Icono de «Acerca de»: Firefox pone su logotipo. */
const ICONO_ACERCA = "estilos/iconos/acerca.svg";
/** Icono de «General» (antes «Cuenta y sincronización», con el avatar de la cuenta de Mozilla). */
const ICONO_GENERAL = "chrome://global/skin/icons/settings.svg";

const hechos = new WeakSet();
let localizacion;

/**
 * Textos de Aegis con su propio Localization síncrono: nunca en el document.l10n de la página (si aegis.ftl fallara,
 * Fluent dejaría sin traducir los Ajustes enteros). brand.ftl, para el nombre del navegador.
 *
 * @param {string} id
 * @param {object} [args]
 * @returns {{value: string?, attributes: Record<string, string>}}
 */
function texto(id, args) {
  localizacion ??= new Localization(["aegis.ftl", "branding/brand.ftl"], true);
  const [m] = localizacion.formatMessagesSync([{ id, args }]);
  return {
    value: m?.value ?? null,
    attributes: Object.fromEntries((m?.attributes ?? []).map(a => [a.name, a.value])),
  };
}

/** Cabecera de la barra lateral (icono y título) con el buscador debajo, en la ranura «subheading» de la barra. */
function cabecera(doc, nav) {
  const caja = doc.createElement("div");
  caja.className = "aegis-ajustes-cabecera";
  caja.slot = "subheading";

  const marca = doc.createElement("div");
  marca.className = "aegis-ajustes-marca";
  const icono = doc.createElement("img");
  icono.className = "aegis-ajustes-icono";
  icono.src = new URL(ICONO_AEGIS, import.meta.url).href;
  icono.alt = "";
  const titulo = doc.createElement("span");
  titulo.className = "aegis-ajustes-titulo";
  titulo.textContent = texto("aegis-ajustes-titulo").value ?? "";
  marca.append(icono, titulo);
  caja.append(marca);

  // El buscador de Firefox (findInPage.js lo busca por su id, así que sigue funcionando al moverlo).
  const buscador = doc.getElementById("searchInput");
  if (buscador) {
    caja.append(buscador);
  }
  nav.prepend(caja);
}

/** Ordena las categorías en grupos con un título pequeño encima de cada uno. */
function agrupar(doc, nav) {
  const botones = new Map();
  for (const b of nav.querySelectorAll(":scope > moz-page-nav-button[view]:not([slot], .hidden-category)")) {
    botones.set(b.getAttribute("view"), b);
  }
  // El separador de Firefox sobra: los grupos ya separan.
  doc.getElementById("nav-separator")?.remove();

  // Se insertan delante del primer botón que no es de un grupo (los ocultos para rutas internas van al final).
  const ancla = nav.querySelector(":scope > moz-page-nav-button.hidden-category");
  let ultimo = null;
  for (const [id, vistas] of GRUPOS) {
    const presentes = vistas.map(v => botones.get(v)).filter(Boolean);
    if (!presentes.length) {
      continue;
    }
    const titulo = doc.createElement("div");
    titulo.className = "aegis-ajustes-grupo";
    // Solo visual: la lista de categorías es un tablist y sus hijos tienen que ser pestañas.
    titulo.setAttribute("aria-hidden", "true");
    titulo.textContent = texto(id).value ?? "";
    nav.insertBefore(titulo, ancla);
    for (const b of presentes) {
      nav.insertBefore(b, ancla);
      botones.delete(b.getAttribute("view"));
    }
    ultimo = presentes.at(-1);
  }
  // Categorías que no están en ningún grupo (otras versiones de Firefox): al final del último.
  for (const b of botones.values()) {
    nav.insertBefore(b, ultimo?.nextSibling ?? ancla);
    ultimo = b;
  }

  doc.getElementById("category-about-firefox")?.setAttribute("iconsrc", new URL(ICONO_ACERCA, import.meta.url).href);
}

/**
 * La tarjeta «navegador predeterminado» de Firefox habla con guiños («Psst…»): se cambia por una frase normal. Se
 * aplica cada vez que aparece una (los grupos se pintan al abrir su página), observando solo #mainPrefPane.
 */
function predeterminado(doc) {
  const panel = doc.getElementById("mainPrefPane");
  if (!panel) {
    return;
  }
  const mensaje = texto("aegis-ajustes-no-predeterminado").attributes.message;
  if (!mensaje) {
    return;
  }
  const aplicar = () => {
    for (const promo of panel.querySelectorAll('moz-promo[data-l10n-id="is-not-default-browser-2"]')) {
      promo.removeAttribute("data-l10n-id");
      promo.setAttribute("message", mensaje);
    }
  };
  aplicar();
  new doc.defaultView.MutationObserver(aplicar).observe(panel, { childList: true, subtree: true });
}

/**
 * Nombres de Firefox que en Aegis no van, por el id de Fluent con que Firefox los pone. Cada uno se cambia por un
 * texto de aegis.ftl: con una función, o copiando los atributos del mensaje (.label, .message…).
 * @type {Map<string, [string, ((el: Element, m: {value: string?}) => void)?]>}
 */
const RETEXTOS = new Map([
  // «Cuenta y sincronización»: sin cuenta de Mozilla solo quedan el navegador predeterminado e importar datos.
  ["pane-account-sync-title2", ["aegis-ajustes-general", (el, m) => {
    // Solo el texto: «title» es un atributo que el componente se lleva a su botón interno (lo quita del elemento),
    // y ponerlo aquí haría que el observador lo repusiera sin fin.
    if (el.textContent != m.value) {
      el.textContent = m.value;
    }
    // Y el icono de ajustes en lugar del avatar de la cuenta.
    if (el.getAttribute("iconsrc") != ICONO_GENERAL) {
      el.setAttribute("iconsrc", ICONO_GENERAL);
    }
  }]],
  ["account-sync-section", ["aegis-ajustes-general", (el, m) => {
    if (el.getAttribute("heading") != m.value) {
      el.setAttribute("heading", m.value);
    }
  }]],
  // «Firefox Home»: la nueva pestaña de Aegis.
  ["home-mode-choice-default-fx", ["aegis-ajustes-inicio-predeterminado"]],
  ["home-prefs-content-header", ["aegis-ajustes-inicio"]],
  ["home-prefs-firefox-home-disabled-notice", ["aegis-ajustes-inicio-aviso"]],
  ["related-settings-home-link", ["aegis-ajustes-personalizar-inicio"]],
]);
const SELECTOR_RETEXTOS = [...RETEXTOS.keys()].map(id => `[data-l10n-id="${id}"]`).concat("[data-aegis-l10n]").join(",");

/**
 * Arreglos que dependen de lo que Firefox pinta al abrir cada página, con un solo observador sobre la barra y el
 * panel (sin temporizadores):
 * - los nombres de RETEXTOS (si Fluent vuelve a poner el suyo, se vuelve a cambiar);
 * - casillas y desplegables como filas del Centro de SecretOS: el control a la derecha (inputlayout="inline-end",
 *   que Firefox ya soporta; la etiqueta sigue unida al control, así que no cambia nada para los lectores de pantalla).
 */
function arreglos(doc) {
  const raices = [doc.getElementById("categories"), doc.getElementById("mainPrefPane")].filter(Boolean);
  const mensajes = new Map();
  const mensaje = id => {
    if (!mensajes.has(id)) {
      mensajes.set(id, texto(id));
    }
    return mensajes.get(id);
  };
  const aplicar = () => {
    for (const raiz of raices) {
      for (const el of raiz.querySelectorAll(SELECTOR_RETEXTOS)) {
        const id = el.getAttribute("data-l10n-id") ?? el.getAttribute("data-aegis-l10n");
        const regla = RETEXTOS.get(id);
        if (!regla) {
          continue;
        }
        const m = mensaje(regla[0]);
        if (!m.value && !Object.keys(m.attributes).length) {
          continue; // sin el texto de Aegis se queda el de Firefox
        }
        if (el.hasAttribute("data-l10n-id")) {
          el.removeAttribute("data-l10n-id");
          el.setAttribute("data-aegis-l10n", id);
        }
        if (regla[1]) {
          regla[1](el, m);
        } else {
          for (const [nombre, valor] of Object.entries(m.attributes)) {
            if (el.getAttribute(nombre) != valor) {
              el.setAttribute(nombre, valor);
            }
          }
        }
      }
      for (const el of raiz.querySelectorAll('moz-checkbox:not([inputlayout="inline-end"]), moz-select[label]:not([inputlayout="inline-end"])')) {
        el.setAttribute("inputlayout", "inline-end");
      }
    }
  };
  aplicar();
  const observador = new doc.defaultView.MutationObserver(aplicar);
  for (const raiz of raices) {
    observador.observe(raiz, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["data-l10n-id", "label", "heading", "message", "inputlayout"],
    });
  }
}

/**
 * Apariencia › «Icono de la app»: el fantasma (de serie) o el uróboros, con su miniatura de 64 (icono.sys.mjs). Una
 * sección como las de Firefox (etiqueta en versalitas, descripción y tarjeta), delante de la densidad de la ventana. La página de
 * Apariencia se pinta al abrirla por primera vez, así que se coloca en cada «paneshown» (idempotente).
 */
function iconoDeLaApp(doc) {
  if (!AegisIcono.disponible) {
    return;
  }
  const win = doc.defaultView;
  let seccion = null;

  const construir = () => {
    seccion = doc.createElement("div");
    seccion.id = "aegis-icono";
    seccion.className = "aegis-icono";

    const titulo = doc.createElement("h2");
    titulo.id = "aegis-icono-titulo";
    titulo.className = "aegis-icono-seccion";
    titulo.textContent = texto("aegis-icono-titulo").value ?? "";

    const tarjeta = doc.createElement("div");
    tarjeta.className = "aegis-icono-tarjeta";
    const ayuda = doc.createElement("p");
    ayuda.id = "aegis-icono-ayuda";
    ayuda.className = "aegis-icono-ayuda";
    ayuda.textContent = texto("aegis-icono-descripcion").value ?? "";

    const opciones = doc.createElement("div");
    opciones.className = "aegis-icono-opciones";
    opciones.setAttribute("role", "radiogroup");
    opciones.setAttribute("aria-labelledby", titulo.id);
    opciones.setAttribute("aria-describedby", ayuda.id);
    for (const nombre of AegisIcono.ICONOS) {
      const opcion = doc.createElement("label");
      opcion.className = "aegis-icono-opcion";
      const radio = doc.createElement("input");
      radio.type = "radio";
      radio.name = "aegis-icono";
      radio.value = nombre;
      const imagen = doc.createElement("img");
      imagen.src = AegisIcono.miniatura(nombre);
      imagen.alt = "";
      const nombreVisible = doc.createElement("span");
      nombreVisible.textContent = texto(`aegis-icono-${nombre}`).value ?? nombre;
      opcion.append(radio, imagen, nombreVisible);
      opciones.append(opcion);
    }
    opciones.addEventListener("change", e => Services.prefs.setStringPref(AegisIcono.PREF, e.target.value));
    tarjeta.append(opciones);
    seccion.append(titulo, ayuda, tarjeta);
  };

  // Refleja la pref (también si cambia desde otra ventana de Ajustes o about:config).
  const marcar = () => {
    const elegido = AegisIcono.actual();
    for (const radio of seccion?.querySelectorAll("input") ?? []) {
      radio.checked = radio.value == elegido;
    }
  };

  const colocar = () => {
    const pagina = doc.querySelector('setting-pane[data-category="paneAppearance"] > section');
    if (!pagina || seccion?.isConnected) {
      return;
    }
    if (!seccion) {
      construir();
      marcar();
    }
    pagina.insertBefore(seccion, pagina.querySelector(':scope > setting-group[groupid="windowDensity"]'));
  };

  colocar();
  doc.addEventListener("paneshown", colocar);
  Services.prefs.addObserver(AegisIcono.PREF, marcar);
  win.addEventListener("unload", () => Services.prefs.removeObserver(AegisIcono.PREF, marcar), { once: true });
}

/**
 * Apariencia › «Énfasis» (enfasis.sys.mjs, DISENO §2): Monocromo, los dos automáticos (Windows y el fondo de
 * escritorio) y los temas fijos, como muestras redondas con su nombre. Cada muestra lleva aegis-enfasis-muestra y
 * tokens.css le da su color con la misma fórmula que a la interfaz. Va detrás del icono de la app (o, sin él, delante
 * de la densidad de la ventana); se coloca en cada «paneshown», como el icono (idempotente).
 */
function enfasisDeLaInterfaz(doc) {
  const win = doc.defaultView;
  let seccion = null;

  const construir = () => {
    seccion = doc.createElement("div");
    seccion.id = "aegis-enfasis";
    seccion.className = "aegis-enfasis";

    const titulo = doc.createElement("h2");
    titulo.id = "aegis-enfasis-titulo";
    titulo.className = "aegis-enfasis-seccion";
    titulo.textContent = texto("aegis-enfasis-titulo").value ?? "";

    const ayuda = doc.createElement("p");
    ayuda.id = "aegis-enfasis-ayuda";
    ayuda.className = "aegis-enfasis-ayuda";
    ayuda.textContent = texto("aegis-enfasis-descripcion").value ?? "";

    const tarjeta = doc.createElement("div");
    tarjeta.className = "aegis-enfasis-tarjeta";
    const opciones = doc.createElement("div");
    opciones.className = "aegis-enfasis-opciones";
    opciones.setAttribute("role", "radiogroup");
    opciones.setAttribute("aria-labelledby", titulo.id);
    opciones.setAttribute("aria-describedby", ayuda.id);
    for (const nombre of AegisEnfasis.ENFASIS) {
      const opcion = doc.createElement("label");
      opcion.className = "aegis-enfasis-opcion";
      const radio = doc.createElement("input");
      radio.type = "radio";
      radio.name = "aegis-enfasis";
      radio.value = nombre;
      const circulo = doc.createElement("span");
      circulo.className = "aegis-enfasis-circulo";
      circulo.setAttribute("aegis-enfasis-muestra", nombre);
      const nombreVisible = doc.createElement("span");
      nombreVisible.textContent = texto(`aegis-enfasis-${nombre}`).value ?? nombre;
      opcion.append(radio, circulo, nombreVisible);
      opciones.append(opcion);
    }
    opciones.addEventListener("change", e => Services.prefs.setStringPref(AegisEnfasis.PREF, e.target.value));
    const nota = doc.createElement("p");
    nota.className = "aegis-enfasis-nota";
    nota.textContent = texto("aegis-enfasis-automatico").value ?? "";
    tarjeta.append(opciones, nota);
    seccion.append(titulo, ayuda, tarjeta);
    // Que la muestra «Fondo de escritorio» tenga su color aunque no sea el énfasis elegido.
    AegisEnfasis.comprobarFondo();
  };

  // Refleja la pref (también si cambia desde la nueva pestaña, otra ventana de Ajustes o about:config).
  const marcar = () => {
    const elegido = AegisEnfasis.actual();
    for (const radio of seccion?.querySelectorAll("input") ?? []) {
      radio.checked = radio.value == elegido;
    }
  };

  const colocar = () => {
    const pagina = doc.querySelector('setting-pane[data-category="paneAppearance"] > section');
    if (!pagina || seccion?.isConnected) {
      return;
    }
    if (!seccion) {
      construir();
      marcar();
    }
    const icono = pagina.querySelector(":scope > #aegis-icono");
    pagina.insertBefore(
      seccion,
      icono?.nextSibling ?? pagina.querySelector(':scope > setting-group[groupid="windowDensity"]')
    );
  };

  // Después del icono de la app, que también se coloca en «paneshown».
  colocar();
  doc.addEventListener("paneshown", colocar);
  Services.prefs.addObserver(AegisEnfasis.PREF, marcar);
  win.addEventListener("unload", () => Services.prefs.removeObserver(AegisEnfasis.PREF, marcar), { once: true });
}

/**
 * Apariencia › «Webs en oscuro» (webs-oscuro/webs-oscuro.sys.mjs): Apagado, Todas las webs o Solo las que no tienen
 * modo oscuro, en segmentos como los de SecretOS. Va justo detrás de «Apariencia de los sitios web» (el grupo
 * «appearance» de Firefox), con la que va de la mano; se coloca en cada «paneshown», como el icono (idempotente).
 */
function websEnOscuro(doc) {
  const win = doc.defaultView;
  const PREF = "aegis.webs_oscuro";
  const OPCIONES = [
    ["apagado", "aegis-webs-oscuro-apagado"],
    ["todas", "aegis-webs-oscuro-todas"],
    ["sin_modo_oscuro", "aegis-webs-oscuro-sin-modo-oscuro"],
  ];
  let seccion = null;

  const construir = () => {
    seccion = doc.createElement("div");
    seccion.id = "aegis-webs-oscuro";
    seccion.className = "aegis-oscuro";

    const titulo = doc.createElement("h2");
    titulo.id = "aegis-webs-oscuro-titulo";
    titulo.className = "aegis-oscuro-seccion";
    titulo.textContent = texto("aegis-webs-oscuro-titulo").value ?? "";

    const ayuda = doc.createElement("p");
    ayuda.id = "aegis-webs-oscuro-ayuda";
    ayuda.className = "aegis-oscuro-ayuda";
    ayuda.textContent = texto("aegis-webs-oscuro-descripcion").value ?? "";
    // Principio 5 (honestidad): cambiar el aspecto de una web se nota desde la web.
    const aviso = doc.createElement("p");
    aviso.id = "aegis-webs-oscuro-aviso";
    aviso.className = "aegis-oscuro-ayuda";
    aviso.textContent = texto("aegis-webs-oscuro-aviso").value ?? "";

    const tarjeta = doc.createElement("div");
    tarjeta.className = "aegis-oscuro-tarjeta";
    const opciones = doc.createElement("div");
    opciones.className = "aegis-oscuro-segmentos";
    opciones.setAttribute("role", "radiogroup");
    opciones.setAttribute("aria-labelledby", titulo.id);
    opciones.setAttribute("aria-describedby", `${ayuda.id} ${aviso.id}`);
    for (const [valor, id] of OPCIONES) {
      const opcion = doc.createElement("label");
      opcion.className = "aegis-oscuro-segmento";
      const radio = doc.createElement("input");
      radio.type = "radio";
      radio.name = "aegis-webs-oscuro";
      radio.value = valor;
      const nombre = doc.createElement("span");
      nombre.textContent = texto(id).value ?? valor;
      opcion.append(radio, nombre);
      opciones.append(opcion);
    }
    opciones.addEventListener("change", e => Services.prefs.setStringPref(PREF, e.target.value));
    tarjeta.append(opciones);
    seccion.append(titulo, ayuda, aviso, tarjeta);
  };

  // Refleja la pref (también si cambia desde otra ventana de Ajustes o about:config).
  const marcar = () => {
    const elegido = Services.prefs.getStringPref(PREF, "apagado");
    for (const radio of seccion?.querySelectorAll("input") ?? []) {
      radio.checked = radio.value == elegido;
    }
  };

  const colocar = () => {
    const pagina = doc.querySelector('setting-pane[data-category="paneAppearance"] > section');
    if (!pagina || seccion?.isConnected) {
      return;
    }
    if (!seccion) {
      construir();
      marcar();
    }
    const apariencia = pagina.querySelector(':scope > setting-group[groupid="appearance"]');
    pagina.insertBefore(seccion, apariencia?.nextSibling ?? pagina.firstElementChild?.nextSibling ?? null);
  };

  colocar();
  doc.addEventListener("paneshown", colocar);
  Services.prefs.addObserver(PREF, marcar);
  win.addEventListener("unload", () => Services.prefs.removeObserver(PREF, marcar), { once: true });
}

/**
 * Privacidad › «Huella digital» (huella.sys.mjs): los cuatro niveles como tarjetas de opción con una línea honesta
 * cada una (Caja fuerte, con el uróboros) y, debajo, los sitios con permiso en Caja fuerte, con un botón para quitar
 * cada uno. Va justo detrás del estado de la protección contra rastreo; se coloca en cada «paneshown» (idempotente).
 */
function huellaDigital(doc) {
  const win = doc.defaultView;
  /** Nivel → parte del id de Fluent («firefox» se llama «Básica»: sin marcas en los textos). */
  const NOMBRES = {
    firefox: "basica",
    equilibrada: "equilibrada",
    estricta: "estricta",
    caja_fuerte: "caja-fuerte",
  };
  let seccion = null;
  let lista = null;

  const construir = () => {
    seccion = doc.createElement("div");
    seccion.id = "aegis-huella";
    seccion.className = "aegis-huella";

    const titulo = doc.createElement("h2");
    titulo.id = "aegis-huella-titulo";
    titulo.className = "aegis-huella-seccion";
    titulo.textContent = texto("aegis-huella-titulo").value ?? "";

    const ayuda = doc.createElement("p");
    ayuda.id = "aegis-huella-ayuda";
    ayuda.className = "aegis-huella-ayuda";
    ayuda.textContent = texto("aegis-huella-descripcion").value ?? "";
    // «Más información»: la explicación de cada nivel en about:escudos#huella (enlacesDeAyuda).
    ayuda.append(" ", enlaceDeAyuda(doc, "huella", "huella"));

    const tarjeta = doc.createElement("div");
    tarjeta.className = "aegis-huella-tarjeta";
    const opciones = doc.createElement("div");
    opciones.className = "aegis-huella-opciones";
    opciones.setAttribute("role", "radiogroup");
    opciones.setAttribute("aria-labelledby", titulo.id);
    opciones.setAttribute("aria-describedby", ayuda.id);
    for (const nivel of AegisHuella.NIVELES) {
      const nombre = NOMBRES[nivel];
      const opcion = doc.createElement("label");
      opcion.className = "aegis-huella-opcion";
      const radio = doc.createElement("input");
      radio.type = "radio";
      radio.name = "aegis-huella";
      radio.value = nivel;
      const descripcion = doc.createElement("span");
      descripcion.id = `aegis-huella-${nombre}-descripcion`;
      descripcion.className = "aegis-huella-opcion-descripcion";
      descripcion.textContent = texto(`aegis-huella-nivel-${nombre}-descripcion`).value ?? "";
      radio.setAttribute("aria-describedby", descripcion.id);
      const nombreVisible = doc.createElement("span");
      nombreVisible.className = "aegis-huella-opcion-nombre";
      nombreVisible.textContent = texto(`aegis-huella-nivel-${nombre}`).value ?? nivel;
      const textos = doc.createElement("span");
      textos.className = "aegis-huella-opcion-textos";
      textos.append(nombreVisible, descripcion);
      opcion.append(radio, textos);
      // Caja fuerte lleva el uróboros, el mismo del botón de Escudos.
      if (nivel == "caja_fuerte") {
        const glifo = doc.createElement("img");
        glifo.className = "aegis-huella-glifo";
        glifo.src = new URL("estilos/iconos/escudo.svg", import.meta.url).href;
        glifo.alt = "";
        opcion.append(glifo);
      }
      opciones.append(opcion);
    }
    opciones.addEventListener("change", e => AegisHuella.poner(e.target.value));
    // Principio 5 (honestidad): lo que ningún nivel puede ocultar.
    const nota = doc.createElement("p");
    nota.className = "aegis-huella-nota";
    nota.textContent = texto("aegis-huella-nota").value ?? "";
    tarjeta.append(opciones, nota);

    // Sitios con permiso (solo cuentan en Caja fuerte).
    const subtitulo = doc.createElement("h3");
    subtitulo.id = "aegis-huella-permitidos-titulo";
    subtitulo.className = "aegis-huella-subtitulo";
    subtitulo.textContent = texto("aegis-huella-permitidos-titulo").value ?? "";
    lista = doc.createElement("ul");
    lista.className = "aegis-huella-lista";
    lista.setAttribute("aria-labelledby", subtitulo.id);
    lista.addEventListener("click", e => {
      const boton = e.target.closest("button[data-dominio]");
      if (boton) {
        AegisHuella.permitir(boton.dataset.dominio, false);
      }
    });
    const permitidos = doc.createElement("div");
    permitidos.className = "aegis-huella-tarjeta aegis-huella-permitidos";
    permitidos.append(subtitulo, lista);

    seccion.append(titulo, ayuda, tarjeta, permitidos);
  };

  // Refleja el nivel y los permisos (también si cambian desde el panel de Escudos, otra ventana de Ajustes,
  // about:config o «Olvidar este sitio»).
  const marcar = () => {
    const elegido = AegisHuella.nivel();
    for (const radio of seccion?.querySelectorAll("input") ?? []) {
      radio.checked = radio.value == elegido;
    }
  };
  const pintarLista = () => {
    if (!lista) {
      return;
    }
    const dominios = AegisHuella.permitidos();
    if (!dominios.length) {
      const vacio = doc.createElement("li");
      vacio.className = "aegis-huella-vacio";
      vacio.textContent = texto("aegis-huella-permitidos-vacio").value ?? "";
      lista.replaceChildren(vacio);
      return;
    }
    lista.replaceChildren(
      ...dominios.map(dominio => {
        const fila = doc.createElement("li");
        fila.className = "aegis-huella-sitio";
        const nombre = doc.createElement("span");
        nombre.className = "aegis-huella-sitio-nombre";
        nombre.textContent = dominio;
        const quitar = doc.createElement("button");
        quitar.className = "aegis-huella-quitar";
        quitar.dataset.dominio = dominio;
        const m = texto("aegis-huella-quitar", { sitio: dominio });
        quitar.textContent = m.value ?? "";
        quitar.setAttribute("aria-label", m.attributes["aria-label"] ?? m.value ?? "");
        fila.append(nombre, quitar);
        return fila;
      })
    );
  };

  const colocar = () => {
    const pagina = doc.querySelector('setting-pane[data-category="panePrivacy"] > section');
    if (!pagina || seccion?.isConnected) {
      return;
    }
    if (!seccion) {
      construir();
      marcar();
      pintarLista();
    }
    const rastreo = pagina.querySelector(':scope > setting-group[groupid="etpStatus"]');
    pagina.insertBefore(seccion, rastreo?.nextSibling ?? pagina.firstElementChild?.nextSibling ?? null);
  };

  colocar();
  doc.addEventListener("paneshown", colocar);
  Services.prefs.addObserver(AegisHuella.PREF_NIVEL, marcar);
  Services.obs.addObserver(pintarLista, AegisHuella.TEMA_PERMITIDOS);
  win.addEventListener(
    "unload",
    () => {
      Services.prefs.removeObserver(AegisHuella.PREF_NIVEL, marcar);
      Services.obs.removeObserver(pintarLista, AegisHuella.TEMA_PERMITIDOS);
    },
    { once: true }
  );
}

/**
 * Privacidad › «Tor» (tor/tor.sys.mjs): la descarga aparte de Tor (estado, origen y tamaño, progreso, descargar,
 * cancelar, actualizar y borrar), abrir una ventana privada con Tor, los puentes y las notas de honestidad. En la
 * instancia con Tor, en cambio, el estado de la conexión y «Nueva identidad». Va detrás de «Huella digital»; se
 * coloca en cada «paneshown» (idempotente). data-subcategory="aegis-tor": openPreferences("privacy-aegis-tor") lleva
 * hasta aquí.
 */
function torSeccion(doc) {
  const win = doc.defaultView;
  let seccion = null;
  let partes = null;

  const boton = (id, alPulsar) => {
    const b = doc.createElement("button");
    b.className = "aegis-huella-quitar aegis-tor-boton";
    b.textContent = texto(id).value ?? "";
    b.addEventListener("click", alPulsar);
    return b;
  };
  const fila = (...hijos) => {
    const f = doc.createElement("div");
    f.className = "aegis-tor-fila";
    f.append(...hijos);
    return f;
  };
  const textos = (clase = "") => {
    const caja = doc.createElement("div");
    caja.className = `aegis-tor-textos ${clase}`.trim();
    const nombre = doc.createElement("span");
    nombre.className = "aegis-tor-nombre";
    const detalle = doc.createElement("span");
    detalle.className = "aegis-tor-detalle";
    caja.append(nombre, detalle);
    caja.nombre = nombre;
    caja.detalle = detalle;
    return caja;
  };
  const nota = id => {
    const p = doc.createElement("p");
    p.className = "aegis-huella-nota";
    p.textContent = texto(id).value ?? "";
    return p;
  };

  const construir = () => {
    seccion = doc.createElement("div");
    seccion.id = "aegis-tor";
    seccion.className = "aegis-tor";
    seccion.dataset.subcategory = "aegis-tor";

    const titulo = doc.createElement("h2");
    titulo.id = "aegis-tor-titulo";
    titulo.className = "aegis-huella-seccion";
    titulo.textContent = texto("aegis-tor-titulo").value ?? "Tor";
    const ayuda = doc.createElement("p");
    ayuda.id = "aegis-tor-ayuda";
    ayuda.className = "aegis-huella-ayuda";
    ayuda.textContent = texto(AegisTor.esInstancia ? "aegis-tor-instancia-texto" : "aegis-tor-descripcion").value ?? "";

    const tarjeta = doc.createElement("div");
    tarjeta.className = "aegis-huella-tarjeta";
    tarjeta.setAttribute("role", "group");
    tarjeta.setAttribute("aria-labelledby", titulo.id);

    // Estado (de la descarga, o de la conexión en la instancia) con su botón.
    const estado = textos();
    estado.setAttribute("role", "status");
    const acciones = doc.createElement("div");
    acciones.className = "aegis-tor-acciones";
    const barra = doc.createElement("div");
    barra.className = "aegis-tor-barra";
    barra.setAttribute("role", "progressbar");
    barra.setAttribute("aria-valuemin", "0");
    barra.setAttribute("aria-valuemax", "100");
    barra.hidden = true;
    const relleno = doc.createElement("div");
    relleno.className = "aegis-tor-barra-relleno";
    barra.append(relleno);
    tarjeta.append(fila(estado, acciones), barra);

    partes = { estado, acciones, barra, relleno };

    if (!AegisTor.esInstancia) {
      // Abrir una ventana privada con Tor.
      const abrir = textos();
      abrir.nombre.textContent = texto("aegis-tor-abrir-titulo").value ?? "";
      abrir.detalle.textContent = texto("aegis-tor-abrir-detalle").value ?? "";
      const botonAbrir = boton("aegis-tor-boton-abrir", () =>
        AegisTor.abrirVentana(win.browsingContext.topChromeWindow ?? win).catch(e => console.error("Aegis: Tor", e))
      );
      tarjeta.append(fila(abrir, botonAbrir));
      partes.botonAbrir = botonAbrir;

      // Puentes: segmentos como los de «Webs en oscuro».
      const subtitulo = doc.createElement("h3");
      subtitulo.id = "aegis-tor-puentes-titulo";
      subtitulo.className = "aegis-huella-subtitulo aegis-tor-subtitulo";
      subtitulo.textContent = texto("aegis-tor-puentes-titulo").value ?? "";
      const descripcion = doc.createElement("p");
      descripcion.id = "aegis-tor-puentes-ayuda";
      descripcion.className = "aegis-huella-nota aegis-tor-puentes-ayuda";
      descripcion.textContent = texto("aegis-tor-puentes-descripcion").value ?? "";
      const segmentos = doc.createElement("div");
      segmentos.className = "aegis-oscuro-segmentos aegis-tor-segmentos";
      segmentos.setAttribute("role", "radiogroup");
      segmentos.setAttribute("aria-labelledby", subtitulo.id);
      segmentos.setAttribute("aria-describedby", descripcion.id);
      for (const [valor, id] of [
        ["", "aegis-tor-puentes-ninguno"],
        ["obfs4", "aegis-tor-puentes-obfs4"],
        ["snowflake", "aegis-tor-puentes-snowflake"],
      ]) {
        const opcion = doc.createElement("label");
        opcion.className = "aegis-oscuro-segmento";
        const radio = doc.createElement("input");
        radio.type = "radio";
        radio.name = "aegis-tor-puentes";
        radio.value = valor;
        const nombre = doc.createElement("span");
        nombre.textContent = texto(id).value ?? valor;
        opcion.append(radio, nombre);
        segmentos.append(opcion);
      }
      segmentos.addEventListener("change", e => AegisTor.ponerPuentes(e.target.value));
      tarjeta.append(subtitulo, descripcion, segmentos);
      partes.segmentos = segmentos;
    }

    // Honestidad (principio 5): lo que Tor en Aegis no hace.
    tarjeta.append(nota("aegis-tor-honestidad"), nota("aegis-tor-nota-huella"), nota("aegis-tor-nota-buscadores"));
    seccion.append(titulo, ayuda, tarjeta);
  };

  const mb = n => (n / (1024 * 1024)).toLocaleString(undefined, { maximumFractionDigits: 1 });

  let pintando = 0;
  const pintar = async () => {
    if (!partes) {
      return;
    }
    const turno = ++pintando;
    const e = await AegisTor.estado();
    if (turno != pintando || win.closed) {
      return;
    }
    const { estado: caja, acciones, barra, relleno } = partes;
    const poner = (id, args) => texto(id, args).value ?? "";
    let progreso = null;
    const botones = [];
    caja.detalle.textContent = "";
    if (e.instancia) {
      caja.nombre.textContent = poner(`aegis-tor-red-${e.red.fase}`, { progreso: e.red.progreso });
      caja.detalle.textContent = e.red.error ? poner(e.red.error) : e.red.aviso ? poner(e.red.aviso) : "";
      if (e.red.fase == "conectando" || e.red.fase == "arrancando") {
        progreso = e.red.progreso;
      }
      botones.push(
        boton("aegis-tor-boton-identidad", () =>
          AegisTor.nuevaIdentidad(win.browsingContext.topChromeWindow ?? win).catch(ex => console.error("Aegis: Tor", ex))
        )
      );
    } else {
      const origen = poner("aegis-tor-origen", { tamano: mb(e.tamano), origen: e.origen });
      switch (e.descarga.fase) {
        case "descargando":
          caja.nombre.textContent = poner("aegis-tor-descargando", { progreso: e.descarga.progreso });
          caja.detalle.textContent = origen;
          progreso = e.descarga.progreso;
          botones.push(boton("aegis-tor-boton-cancelar", () => AegisTor.cancelarDescarga()));
          break;
        case "comprobando":
          caja.nombre.textContent = poner("aegis-tor-comprobando");
          caja.detalle.textContent = origen;
          progreso = 100;
          break;
        case "extrayendo":
          caja.nombre.textContent = poner("aegis-tor-extrayendo", { progreso: e.descarga.progreso });
          caja.detalle.textContent = origen;
          progreso = e.descarga.progreso;
          break;
        default:
          if (e.instalada) {
            caja.nombre.textContent = e.desactualizada
              ? poner("aegis-tor-desactualizado", { version: e.fijada })
              : poner("aegis-tor-listo", { version: e.instalada, tor: e.tor ?? "" });
            caja.detalle.textContent = e.abierta ? poner("aegis-tor-borrar-abierta") : "";
            if (e.desactualizada) {
              botones.push(boton("aegis-tor-boton-actualizar", () => AegisTor.descargar()));
            }
            const borrar = boton("aegis-tor-boton-borrar", async () => {
              if (!(await AegisTor.borrar())) {
                caja.detalle.textContent = poner("aegis-tor-borrar-abierta");
              }
            });
            borrar.disabled = e.abierta;
            botones.push(borrar);
          } else {
            caja.nombre.textContent = poner("aegis-tor-no-descargado");
            caja.detalle.textContent =
              e.descarga.fase == "error" ? `${poner(e.descarga.error)} ${origen}` : origen;
            botones.push(boton("aegis-tor-boton-descargar", () => AegisTor.descargar()));
          }
      }
      if (partes.botonAbrir) {
        partes.botonAbrir.disabled = !e.instalada && e.descarga.fase != "nada" && e.descarga.fase != "error";
      }
      for (const radio of partes.segmentos?.querySelectorAll("input") ?? []) {
        radio.checked = radio.value == e.puentes;
      }
    }
    caja.toggleAttribute("aegis-tor-error", e.descarga.fase == "error" || e.red.fase == "error");
    acciones.replaceChildren(...botones);
    barra.hidden = progreso == null;
    if (progreso != null) {
      barra.setAttribute("aria-valuenow", String(progreso));
      relleno.style.width = `${progreso}%`;
    }
  };

  const colocar = () => {
    const pagina = doc.querySelector('setting-pane[data-category="panePrivacy"] > section');
    if (!pagina || seccion?.isConnected) {
      return;
    }
    if (!seccion) {
      construir();
      pintar();
    }
    const huella = pagina.querySelector(":scope > #aegis-huella");
    const rastreo = pagina.querySelector(':scope > setting-group[groupid="etpStatus"]');
    pagina.insertBefore(seccion, (huella ?? rastreo)?.nextSibling ?? pagina.firstElementChild?.nextSibling ?? null);
  };

  colocar();
  doc.addEventListener("paneshown", colocar);
  const alCambiar = () => pintar();
  Services.obs.addObserver(alCambiar, AegisTor.TEMA);
  win.addEventListener("unload", () => Services.obs.removeObserver(alCambiar, AegisTor.TEMA), { once: true });
}

/**
 * Privacidad › «Google» (google.sys.mjs): «Google limpio» y «Solo resultados web en Google», dos filas de 44 con su
 * línea de detalle y un interruptor a la derecha, en una tarjeta como la de Tor (mismas clases: etiqueta de sección,
 * descripción con «Más información», filas separadas por la línea). La segunda solo actúa con la primera encendida,
 * así que sin ella se ve desactivada. Va detrás de «Huella digital», delante de Tor; se coloca en cada «paneshown».
 */
function googleSeccion(doc) {
  const win = doc.defaultView;
  const PREFS = [
    ["aegis.google.limpio", "aegis-google-limpio"],
    ["aegis.google.solo_web", "aegis-google-solo-web"],
  ];
  let seccion = null;
  const interruptores = new Map();

  const construir = () => {
    seccion = doc.createElement("div");
    seccion.id = "aegis-google";
    seccion.className = "aegis-google";

    const titulo = doc.createElement("h2");
    titulo.id = "aegis-google-titulo";
    titulo.className = "aegis-huella-seccion";
    titulo.textContent = texto("aegis-google-titulo").value ?? "Google";
    const ayuda = doc.createElement("p");
    ayuda.className = "aegis-huella-ayuda";
    ayuda.textContent = texto("aegis-google-descripcion").value ?? "";
    ayuda.append(" ", enlaceDeAyuda(doc, "google", "google"));

    const tarjeta = doc.createElement("div");
    tarjeta.className = "aegis-huella-tarjeta";
    tarjeta.setAttribute("role", "group");
    tarjeta.setAttribute("aria-labelledby", titulo.id);
    for (const [pref, id] of PREFS) {
      const interruptor = doc.createElement("input");
      interruptor.type = "checkbox";
      interruptor.id = `${id}-interruptor`;
      interruptor.className = "aegis-interruptor-ajustes";
      interruptor.setAttribute("role", "switch");
      interruptor.setAttribute("aria-labelledby", `${id}-nombre`);
      interruptor.setAttribute("aria-describedby", `${id}-detalle`);
      interruptor.addEventListener("change", () => Services.prefs.setBoolPref(pref, interruptor.checked));
      // Los textos son la etiqueta del interruptor: pulsarlos también lo cambia.
      const textos = doc.createElement("label");
      textos.className = "aegis-tor-textos";
      textos.htmlFor = interruptor.id;
      const nombre = doc.createElement("span");
      nombre.id = `${id}-nombre`;
      nombre.className = "aegis-tor-nombre";
      nombre.textContent = texto(id).value ?? "";
      const detalle = doc.createElement("span");
      detalle.id = `${id}-detalle`;
      detalle.className = "aegis-tor-detalle";
      detalle.textContent = texto(`${id}-detalle`).value ?? "";
      textos.append(nombre, detalle);
      const fila = doc.createElement("div");
      fila.className = "aegis-tor-fila";
      fila.append(textos, interruptor);
      tarjeta.append(fila);
      interruptores.set(pref, interruptor);
    }
    seccion.append(titulo, ayuda, tarjeta);
  };

  // Refleja las prefs (también si cambian desde otra ventana de Ajustes o about:config).
  const marcar = () => {
    for (const [pref, interruptor] of interruptores) {
      interruptor.checked = Services.prefs.getBoolPref(pref, true);
    }
    const soloWeb = interruptores.get("aegis.google.solo_web");
    if (soloWeb) {
      soloWeb.disabled = !Services.prefs.getBoolPref("aegis.google.limpio", true);
    }
  };

  const colocar = () => {
    const pagina = doc.querySelector('setting-pane[data-category="panePrivacy"] > section');
    if (!pagina || seccion?.isConnected) {
      return;
    }
    if (!seccion) {
      construir();
      marcar();
    }
    const huella = pagina.querySelector(":scope > #aegis-huella");
    const rastreo = pagina.querySelector(':scope > setting-group[groupid="etpStatus"]');
    pagina.insertBefore(seccion, (huella ?? rastreo)?.nextSibling ?? pagina.firstElementChild?.nextSibling ?? null);
  };

  colocar();
  doc.addEventListener("paneshown", colocar);
  for (const [pref] of PREFS) {
    Services.prefs.addObserver(pref, marcar);
  }
  win.addEventListener(
    "unload",
    () => {
      for (const [pref] of PREFS) {
        Services.prefs.removeObserver(pref, marcar);
      }
    },
    { once: true }
  );
}

/**
 * Enlace «Más información» a una sección de about:escudos («Cómo funcionan los Escudos», escudos-ayuda.sys.mjs). Se
 * abre en una pestaña junto a Ajustes (o en la que ya la tenga abierta), para leerlo mientras se cambia la opción.
 *
 * @param {Document} doc
 * @param {string} tema parte del id de Fluent (aegis-ayuda-<tema>)
 * @param {string} ancla id de la sección de la página
 */
function enlaceDeAyuda(doc, tema, ancla) {
  const m = texto(`aegis-ayuda-${tema}`);
  const a = doc.createElement("a");
  a.className = "aegis-ayuda-enlace";
  a.href = `${AegisEscudosAyuda.DIRECCION}#${ancla}`;
  a.textContent = m.value ?? "";
  if (m.attributes["aria-label"]) {
    a.setAttribute("aria-label", m.attributes["aria-label"]);
  }
  a.addEventListener("click", e => {
    e.preventDefault();
    AegisEscudosAyuda.abrir(doc.defaultView, ancla);
  });
  return a;
}

/**
 * Privacidad › «Conexiones» (conexiones.sys.mjs): para qué se conecta Aegis por su cuenta ahora mismo y el enlace a
 * about:conexiones para cambiarlo. Va donde Firefox tenía «Recogida de datos» (oculta en Aegis) o, si no está, al final
 * de la página. Se coloca en cada «paneshown» (idempotente) y se actualiza si cambia la elección.
 */
function conexionesSeccion(doc) {
  const win = doc.defaultView;
  // Sus textos están en conexiones.ftl, con los de la página.
  const l10n = new Localization(["conexiones.ftl", "branding/brand.ftl"], true);
  const t = (id, args) => l10n.formatValueSync(id, args) ?? "";
  let seccion = null;
  let estado = null;

  const construir = () => {
    seccion = doc.createElement("div");
    seccion.id = "aegis-conexiones";
    seccion.className = "aegis-conexiones";
    const titulo = doc.createElement("h2");
    titulo.className = "aegis-conexiones-seccion";
    titulo.textContent = t("conexiones-ajustes-titulo");
    estado = doc.createElement("p");
    estado.className = "aegis-conexiones-ayuda";
    const enlace = doc.createElement("a");
    enlace.className = "aegis-ayuda-enlace";
    enlace.href = AegisConexiones.DIRECCION;
    enlace.textContent = t("conexiones-ajustes-elegir");
    enlace.addEventListener("click", e => {
      e.preventDefault();
      AegisConexiones.abrir(win);
    });
    const fila = doc.createElement("p");
    fila.className = "aegis-conexiones-ayuda";
    fila.append(enlace);
    seccion.append(titulo, estado, fila);
  };

  const marcar = () => {
    if (!estado) {
      return;
    }
    const nombres = AegisConexiones.activos().map(g => t(`conexiones-${g}-nombre`));
    const lista = new Intl.ListFormat(Services.locale.appLocaleAsBCP47, { type: "conjunction" }).format(nombres);
    estado.textContent = nombres.length ? t("conexiones-ajustes-activas", { lista }) : t("conexiones-ajustes-ninguna");
  };

  const colocar = () => {
    const pagina = doc.querySelector('setting-pane[data-category="panePrivacy"] > section');
    if (!pagina || seccion?.isConnected) {
      return;
    }
    if (!seccion) {
      construir();
    }
    marcar();
    const datos = pagina.querySelector(':scope > setting-group[groupid="dataCollection"]');
    pagina.insertBefore(seccion, datos?.nextSibling ?? null);
  };

  colocar();
  doc.addEventListener("paneshown", colocar);
  Services.prefs.addObserver("aegis.conexiones.", marcar);
  win.addEventListener("unload", () => Services.prefs.removeObserver("aegis.conexiones.", marcar), { once: true });
}

/** Grupos de Firefox con opciones de los Escudos: [groupid, tema del texto, ancla de about:escudos]. */
const AYUDA_ESCUDOS = [
  ["etpStatus", "rastreo", "nivel"],
  ["etpAdvanced", "rastreo", "nivel"],
  ["etpCustomize", "cookies", "cookies"],
  ["httpsOnly", "https", "https"],
  ["cookiesAndSiteData2", "olvidar", "olvidar"],
];

/**
 * «Más información» debajo de cada grupo de Firefox que lleva una opción del panel de Escudos (protección contra
 * rastreo, cookies, solo HTTPS, datos de los sitios). Va como hermano y no dentro del grupo: setting-group lo pinta Lit
 * y lo borraría. Se coloca en cada «paneshown» (idempotente); la huella digital lleva el suyo en su descripción.
 */
function enlacesDeAyuda(doc) {
  const colocar = () => {
    for (const [grupo, tema, ancla] of AYUDA_ESCUDOS) {
      const el = doc.querySelector(`setting-group[groupid="${grupo}"]`);
      if (!el || doc.querySelector(`[data-aegis-ayuda="${grupo}"]`)) {
        continue;
      }
      const fila = doc.createElement("p");
      fila.className = "aegis-ayuda";
      fila.dataset.aegisAyuda = grupo;
      fila.append(enlaceDeAyuda(doc, tema, ancla));
      el.after(fila);
    }
  };
  colocar();
  doc.addEventListener("paneshown", colocar);
}

/**
 * Contraseñas y autorrelleno › «Cierre automático de la bóveda» (contrasenas.sys.mjs): tras cuántos minutos sin usar
 * el equipo se cierra la bóveda de contraseñas (Nunca, 15, 10, 5, 3, 2 o 1), en segmentos como los de «Webs en
 * oscuro». Va justo detrás del grupo «Contraseñas» de Firefox; se coloca en cada «paneshown» (idempotente). El cambio se aplica al
 * momento: contrasenas.sys.mjs observa la pref y vuelve a poner (o quita) el aviso de inactividad.
 */
function bloqueoDeContrasenas(doc) {
  const win = doc.defaultView;
  let seccion = null;
  let nunca = null;
  let sinPrincipal = null;

  const construir = () => {
    seccion = doc.createElement("div");
    seccion.id = "aegis-bloqueo";
    seccion.className = "aegis-oscuro aegis-bloqueo";
    seccion.dataset.subcategory = "aegis-bloqueo";

    const titulo = doc.createElement("h2");
    titulo.id = "aegis-bloqueo-titulo";
    titulo.className = "aegis-oscuro-seccion";
    titulo.textContent = texto("aegis-bloqueo-titulo").value ?? "";

    const ayuda = doc.createElement("p");
    ayuda.id = "aegis-bloqueo-ayuda";
    ayuda.className = "aegis-oscuro-ayuda";
    ayuda.textContent = texto("aegis-bloqueo-descripcion").value ?? "";
    // Con «Nunca»: cuándo se cierra entonces (principio 5, honestidad).
    nunca = doc.createElement("p");
    nunca.id = "aegis-bloqueo-nunca";
    nunca.className = "aegis-oscuro-ayuda";
    nunca.textContent = texto("aegis-bloqueo-nunca-aviso").value ?? "";
    // Sin contraseña principal no hay nada que cerrar.
    sinPrincipal = doc.createElement("p");
    sinPrincipal.id = "aegis-bloqueo-sin-principal";
    sinPrincipal.className = "aegis-oscuro-ayuda";
    sinPrincipal.textContent = texto("aegis-bloqueo-sin-principal").value ?? "";

    const tarjeta = doc.createElement("div");
    tarjeta.className = "aegis-oscuro-tarjeta";
    const opciones = doc.createElement("div");
    opciones.className = "aegis-oscuro-segmentos";
    opciones.setAttribute("role", "radiogroup");
    opciones.setAttribute("aria-labelledby", titulo.id);
    opciones.setAttribute("aria-describedby", `${ayuda.id} ${nunca.id} ${sinPrincipal.id}`);
    for (const minutos of OPCIONES_BLOQUEO) {
      const opcion = doc.createElement("label");
      opcion.className = "aegis-oscuro-segmento";
      const radio = doc.createElement("input");
      radio.type = "radio";
      radio.name = "aegis-bloqueo";
      radio.value = String(minutos);
      const nombre = doc.createElement("span");
      nombre.textContent =
        (minutos ? texto("aegis-bloqueo-minutos", { minutos }) : texto("aegis-bloqueo-nunca")).value ?? String(minutos);
      opcion.append(radio, nombre);
      opciones.append(opcion);
    }
    opciones.addEventListener("change", e => Services.prefs.setIntPref(PREF_BLOQUEO, Number(e.target.value)));
    tarjeta.append(opciones);
    seccion.append(titulo, ayuda, nunca, sinPrincipal, tarjeta);
  };

  // Refleja la pref (también si cambia desde about:config u otra ventana de Ajustes) y si hay contraseña principal.
  const marcar = () => {
    if (!seccion) {
      return;
    }
    const elegido = minutosDeBloqueo();
    for (const radio of seccion.querySelectorAll("input")) {
      radio.checked = Number(radio.value) == elegido;
    }
    nunca.hidden = elegido != 0;
    const token = Cc["@mozilla.org/security/internalkeytoken;1"].createInstance(Ci.nsIPKCS11Token);
    sinPrincipal.hidden = token.hasPassword;
  };

  // En Firefox 158 el grupo «Contraseñas» vive en su propia página (Contraseñas y autorrelleno), que se pinta al
  // abrirla: la sección se pone (o se recoloca) justo detrás de él cada vez que se muestra una página.
  const colocar = () => {
    const contrasenas = doc.querySelector(
      'setting-pane[data-category="panePasswordsAutofill"] > section > setting-group[groupid="passwords"], ' +
        'setting-pane[data-category="panePrivacy"] > section > setting-group[groupid="passwords"]'
    );
    if (!contrasenas) {
      return;
    }
    if (!seccion) {
      construir();
    }
    marcar();
    if (seccion.previousElementSibling != contrasenas) {
      contrasenas.after(seccion);
    }
  };

  colocar();
  doc.addEventListener("paneshown", colocar);
  Services.prefs.addObserver(PREF_BLOQUEO, marcar);
  Services.obs.addObserver(marcar, "passwordmgr-primary-pw-changed");
  win.addEventListener(
    "unload",
    () => {
      Services.prefs.removeObserver(PREF_BLOQUEO, marcar);
      Services.obs.removeObserver(marcar, "passwordmgr-primary-pw-changed");
    },
    { once: true }
  );
}

/**
 * Contraseñas y autorrelleno › «Pasar a otro Aegis» (contrasenas/transferencia/): dos filas de 44 con su línea de
 * detalle y un botón compacto cada una, en la tarjeta de Tor: «Pasar a otro Aegis» (crea el paquete cifrado y enseña
 * el código de 6 palabras) y «Recibir de otro Aegis» (lo abre aquí; lo mismo que el asistente de importar). Va detrás
 * de «Cierre automático de la bóveda» (o del grupo «Contraseñas»); se coloca en cada «paneshown» (idempotente).
 * data-subcategory="aegis-transferencia": openPreferences("privacy-aegis-transferencia") lleva hasta aquí.
 */
function transferenciaSeccion(doc) {
  const win = doc.defaultView;
  let seccion = null;
  const transferencia = () =>
    ChromeUtils.importESModule(new URL("contrasenas/transferencia/transferencia.sys.mjs", import.meta.url).href)
      .AegisTransferencia;

  const construir = () => {
    seccion = doc.createElement("div");
    seccion.id = "aegis-transferencia";
    seccion.className = "aegis-transferencia";
    seccion.dataset.subcategory = "aegis-transferencia";

    const titulo = doc.createElement("h2");
    titulo.id = "aegis-transferencia-titulo";
    titulo.className = "aegis-huella-seccion";
    titulo.textContent = texto("aegis-transferencia-titulo").value ?? "";
    const ayuda = doc.createElement("p");
    ayuda.className = "aegis-huella-ayuda";
    ayuda.textContent = texto("aegis-transferencia-descripcion").value ?? "";

    const tarjeta = doc.createElement("div");
    tarjeta.className = "aegis-huella-tarjeta";
    tarjeta.setAttribute("role", "group");
    tarjeta.setAttribute("aria-labelledby", titulo.id);
    for (const [id, accion] of [
      ["aegis-transferencia-pasar", () => transferencia().abrirPasar(win)],
      ["aegis-transferencia-recibir", () => transferencia().abrirRecibir(win)],
    ]) {
      const textos = doc.createElement("div");
      textos.className = "aegis-tor-textos";
      const nombre = doc.createElement("span");
      nombre.id = `${id}-nombre`;
      nombre.className = "aegis-tor-nombre";
      nombre.textContent = texto(id).value ?? "";
      const detalle = doc.createElement("span");
      detalle.id = `${id}-detalle`;
      detalle.className = "aegis-tor-detalle";
      detalle.textContent = texto(`${id}-detalle`).value ?? "";
      textos.append(nombre, detalle);
      const boton = doc.createElement("button");
      boton.className = "aegis-huella-quitar aegis-tor-boton";
      boton.textContent = texto(`${id}-boton`).value ?? "";
      boton.setAttribute("aria-describedby", `${nombre.id} ${detalle.id}`);
      boton.addEventListener("click", async () => {
        boton.disabled = true;
        try {
          await accion();
        } catch (e) {
          console.error(`Aegis: Ajustes, ${id}`, e);
        } finally {
          boton.disabled = false;
        }
      });
      const fila = doc.createElement("div");
      fila.className = "aegis-tor-fila";
      fila.append(textos, boton);
      tarjeta.append(fila);
    }
    seccion.append(titulo, ayuda, tarjeta);
  };

  const colocar = () => {
    const ancla =
      doc.getElementById("aegis-bloqueo") ??
      doc.querySelector(
        'setting-pane[data-category="panePasswordsAutofill"] > section > setting-group[groupid="passwords"], ' +
          'setting-pane[data-category="panePrivacy"] > section > setting-group[groupid="passwords"]'
      );
    if (!ancla?.isConnected) {
      return;
    }
    if (!seccion) {
      construir();
    }
    if (seccion.previousElementSibling != ancla) {
      ancla.after(seccion);
    }
  };

  colocar();
  doc.addEventListener("paneshown", colocar);
}

function montar(doc) {
  const nav = doc.getElementById("categories");
  if (!nav) {
    return;
  }
  for (const [nombre, paso] of [
    ["cabecera", () => cabecera(doc, nav)],
    ["grupos", () => agrupar(doc, nav)],
    ["navegador predeterminado", () => predeterminado(doc)],
    ["nombres y controles", () => arreglos(doc)],
    ["icono de la app", () => iconoDeLaApp(doc)],
    ["énfasis", () => enfasisDeLaInterfaz(doc)],
    ["webs en oscuro", () => websEnOscuro(doc)],
    ["huella digital", () => huellaDigital(doc)],
    // Después de la huella: se coloca detrás de su sección.
    ["tor", () => torSeccion(doc)],
    // Después de Tor: las dos se ponen detrás de la huella, así que Google queda entre ambas.
    ["google", () => googleSeccion(doc)],
    ["ayuda de los Escudos", () => enlacesDeAyuda(doc)],
    ["conexiones", () => conexionesSeccion(doc)],
    ["cierre de la bóveda", () => bloqueoDeContrasenas(doc)],
    // Después del cierre de la bóveda: se coloca detrás de su sección.
    ["pasar a otro Aegis", () => transferenciaSeccion(doc)],
  ]) {
    try {
      paso();
    } catch (e) {
      console.error(`Aegis: Ajustes, ${nombre}`, e);
    }
  }
  doc.documentElement.setAttribute("aegis-ajustes", "");
}

/**
 * Prepara una página de Ajustes. Se puede llamar en cuanto se crea el documento (document-element-inserted) o más
 * tarde; una sola vez por documento.
 *
 * @param {Document} doc
 */
export function pagina(doc) {
  const win = doc?.defaultView;
  if (!win || hechos.has(doc) || !doc.nodePrincipal?.isSystemPrincipal) {
    return;
  }
  hechos.add(doc);
  try {
    const utils = win.windowUtils;
    utils.loadSheetUsingURIString(new URL(HOJA_SOMBRA, import.meta.url).href, utils.USER_SHEET);
  } catch (e) {
    console.error(`Aegis: no se pudo cargar ${HOJA_SOMBRA}`, e);
  }
  // Ajustes › Escudos: se registra antes que las categorías de Firefox (antes de init_all) para que #escudos abra ahí.
  try {
    AegisEscudosAjustes.preparar(doc);
  } catch (e) {
    console.error("Aegis: Ajustes › Escudos", e);
  }
  if (doc.readyState == "loading") {
    // En la ventana y no en el documento: así va después de init_all() de preferences.js, que monta la barra.
    win.addEventListener("DOMContentLoaded", () => montar(doc), { once: true });
  } else {
    montar(doc);
  }
}
