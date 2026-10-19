/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · Importar: las contraseñas, siempre por el camino honesto. El asistente de importar de Firefox, en Windows,
 * no lee las contraseñas de Chrome (las cifra con App-Bound Encryption, «v20»): enseña cómo exportarlas a un CSV y
 * pide el archivo (la página «page-chrome-windows-password-permission» de migration-wizard.mjs). Brave y Edge cifran
 * igual, pero Firefox intenta leerlas y, con las «v20», falla sin decir nada. Aegis lleva por esa página también a:
 *
 * - Brave, Edge y Edge Beta (en Windows), con sus pasos;
 * - Chrome Beta y Chrome Canary (en Windows), con los pasos de Chrome;
 * - Firefox (migradores.sys.mjs, aegis-firefox), con los de about:logins;
 * - otro Aegis (aegis-perfil): Aegis no exporta en claro, así que no hay CSV. Las contraseñas pasan con el código de
 *   6 palabras (contrasenas/transferencia/): la página explica cómo crear el paquete en el otro Aegis y su botón
 *   «Seleccionar archivo» elige el .aegisvault y abre el diálogo que pide el código (en lugar del CSV). Si entran, el
 *   asistente sigue con lo demás como con «Saltar». Sirve también para otro equipo: el paquete es un archivo.
 *
 * Lo llama MigrationWizardChild.beginMigration (parche 0900-migracion/0001) cuando se ha marcado «Contraseñas»:
 * AegisImportar.pasosDelCsv() pone los textos de Aegis en esa página y devuelve true para enseñarla; con cualquier
 * otro navegador deja la página como la trae Firefox y devuelve false. Los textos se escriben con textContent (nunca
 * aegis.ftl en el document.l10n de la página: si fallara, Fluent dejaría sin traducir lo de Firefox); si faltara
 * alguno, todo queda como en Firefox. Lo que entra por el CSV o por el paquete acaba en la bóveda con contraseña
 * principal (contrasenas.sys.mjs).
 *
 * El botón «Seleccionar archivo» de otro Aegis se intercepta con un oyente en captura en la propia página (llega antes
 * que el del asistente, que está en el botón), solo mientras la página lleva los textos de «aegis». En un proceso de
 * contenido (el asistente dentro de about:welcome) no se pueden abrir los diálogos ni tocar la bóveda: allí la página
 * esconde el botón y remite a Ajustes › Contraseñas y autorrelleno › «Recibir de otro Aegis».
 */

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  AppConstants: "resource://gre/modules/AppConstants.sys.mjs",
});

const PAGINA = 'div[name="page-chrome-windows-password-permission"]';
/** Marca de la página mientras lleva textos de Aegis (para devolverle los de Firefox). */
const MARCA = "aegis-pasos";

/**
 * Por clave del migrador: qué pasos enseñar. «fuente» null: los de Chrome que trae Firefox. «soloWindows»: el cifrado
 * que obliga al CSV solo existe allí (en Linux y macOS, Firefox lee esas contraseñas).
 */
const NAVEGADORES = {
  brave: { fuente: "brave", soloWindows: true },
  "chromium-edge": { fuente: "edge", soloWindows: true },
  "chromium-edge-beta": { fuente: "edge", soloWindows: true },
  "chrome-beta": { fuente: null, soloWindows: true },
  canary: { fuente: null, soloWindows: true },
  "aegis-firefox": { fuente: "firefox", soloWindows: false },
  "aegis-perfil": { fuente: "aegis", soloWindows: false },
};

/** En el proceso principal (Ajustes, la ventana propia del asistente): se pueden abrir los diálogos de Aegis. */
function enProcesoPrincipal() {
  return Services.appinfo.processType == Ci.nsIXULRuntime.PROCESS_TYPE_DEFAULT;
}

/** Ids de aegis.ftl por fuente: título, «En …:», tres pasos y el cierre. Firefox, con su prefijo (verificar.py). */
function ids(fuente) {
  if (fuente == "aegis") {
    return [
      "aegis-migracion-aegis-contrasenas-titulo",
      "aegis-migracion-aegis-contrasenas-en",
      "aegis-migracion-aegis-contrasenas-paso1",
      "aegis-migracion-aegis-contrasenas-paso2",
      "aegis-migracion-aegis-contrasenas-paso3",
      enProcesoPrincipal() ? "aegis-migracion-aegis-contrasenas-final" : "aegis-migracion-aegis-contrasenas-final-ajustes",
    ];
  }
  const base = fuente == "firefox" ? "aegis-migracion-navegador-firefox-csv" : `aegis-migracion-csv-${fuente}`;
  return [
    `${base}-titulo`,
    `${base}-en`,
    `${base}-paso1`,
    `${base}-paso2`,
    `${base}-paso3`,
    "aegis-migracion-csv-final",
  ];
}

let localizacion;
/** Los textos ya traducidos, o null si falta alguno. */
function textos(lista) {
  localizacion ??= new Localization(["aegis.ftl", "branding/brand.ftl"], true);
  const valores = localizacion.formatValuesSync(lista.map(id => ({ id })));
  return valores.every(v => typeof v == "string" && v) ? valores : null;
}

/** Lo que se cambia de la página, en orden fijo. */
function partes(pagina) {
  return {
    titulo: pagina.querySelector("h1"),
    en: pagina.querySelector(":scope > span"),
    pasos: [...pagina.querySelectorAll("ol > li")],
    final: pagina.querySelector("p > span"),
    elegir: pagina.querySelector(".manual-password-import-select"),
  };
}

/** Cómo era cada elemento antes de tocarlo (una vez por página). */
const originales = new WeakMap();

function guardar(pagina) {
  if (originales.has(pagina)) {
    return;
  }
  const { titulo, en, pasos, final } = partes(pagina);
  originales.set(
    pagina,
    [titulo, en, ...pasos, final].filter(Boolean).map(el => ({
      el,
      id: el.getAttribute("data-l10n-id"),
      args: el.getAttribute("data-l10n-args"),
      hijos: [...el.childNodes].map(n => n.cloneNode(true)),
      display: el.style.display,
    }))
  );
}

/** Devuelve la página a como la trae Firefox: sus hijos (la imagen del menú de Chrome) y sus ids de Fluent. */
function restaurar(pagina) {
  if (!pagina.hasAttribute(MARCA)) {
    return;
  }
  for (const { el, id, args, hijos, display } of originales.get(pagina) ?? []) {
    el.replaceChildren(...hijos.map(n => n.cloneNode(true)));
    el.style.display = display;
    if (args) {
      el.setAttribute("data-l10n-args", args);
    }
    if (id) {
      // Fluent vuelve a traducirlo al ver el atributo.
      el.setAttribute("data-l10n-id", id);
    }
  }
  // El botón «Seleccionar archivo» y la lista de pasos solo se esconden (con otro perfil de Aegis): su texto o su
  // estructura son siempre los de Firefox.
  const { elegir, pasos } = partes(pagina);
  for (const el of [elegir, pasos[0]?.parentElement]) {
    if (el) {
      el.style.display = "";
    }
  }
  pagina.removeAttribute(MARCA);
}

function poner(el, texto) {
  if (!el) {
    return;
  }
  el.removeAttribute("data-l10n-id");
  el.removeAttribute("data-l10n-args");
  el.textContent = texto ?? "";
  el.style.display = texto ? "" : "none";
}

/* ───────── Otro Aegis: el paquete en lugar del CSV ───────── */

const interceptadas = new WeakSet();

/** «Seleccionar archivo» → el paquete y su código (transferencia.sys.mjs); si entran, «Saltar» sigue con el resto. */
async function recibirPaquete(pagina) {
  const win = pagina.ownerDocument?.defaultView;
  const boton = pagina.querySelector(".manual-password-import-select");
  const { AegisTransferencia } = ChromeUtils.importESModule(
    new URL("../contrasenas/transferencia/transferencia.sys.mjs", import.meta.url).href
  );
  let recibidas = false;
  if (boton) {
    boton.disabled = true;
  }
  try {
    recibidas = await AegisTransferencia.recibirDesdeAsistente(win);
  } finally {
    if (boton) {
      boton.disabled = false;
    }
  }
  if (recibidas && pagina.getAttribute(MARCA) == "aegis") {
    // Ya están en la bóveda: como «Saltar», el asistente desmarca «Contraseñas» e importa lo demás (o vuelve a la
    // lista si no había nada más marcado).
    pagina.querySelector(".manual-password-import-skip")?.click();
  }
}

function interceptar(pagina) {
  if (interceptadas.has(pagina)) {
    return;
  }
  interceptadas.add(pagina);
  pagina.addEventListener(
    "click",
    evento => {
      if (pagina.getAttribute(MARCA) != "aegis" || !evento.target?.closest?.(".manual-password-import-select")) {
        return;
      }
      // En captura y en un antepasado: el oyente del asistente (en el botón) ya no lo recibe, así que no se abre el
      // selector del CSV.
      evento.preventDefault();
      evento.stopPropagation();
      recibirPaquete(pagina).catch(e => console.error("Aegis: recibir las contraseñas de otro Aegis", e));
    },
    true
  );
}

/**
 * @param {Element} asistente el <migration-wizard>
 * @param {string} clave la del migrador elegido
 * @returns {boolean} true si hay que enseñar la página de las contraseñas en lugar de importarlas
 */
function pasosDelCsv(asistente, clave) {
  const pagina = asistente?.shadowRoot?.querySelector(PAGINA);
  if (!pagina) {
    return false;
  }
  try {
    guardar(pagina);
    const navegador = NAVEGADORES[clave];
    if (!navegador || (navegador.soloWindows && lazy.AppConstants.platform != "win")) {
      restaurar(pagina);
      return false;
    }
    if (!navegador.fuente) {
      restaurar(pagina);
      return true;
    }
    const valores = textos(ids(navegador.fuente));
    if (!valores) {
      restaurar(pagina);
      return false;
    }
    const { titulo, en, pasos, final, elegir } = partes(pagina);
    const [cabecera, enNavegador, paso1, paso2, paso3, cierre] = valores;
    poner(titulo, cabecera);
    poner(en, enNavegador);
    const lista = [paso1, paso2, paso3];
    pasos.forEach((li, i) => poner(li, lista[i] ?? ""));
    poner(final, cierre);
    for (const el of [elegir, pasos[0]?.parentElement]) {
      if (el) {
        el.style.display = "";
      }
    }
    if (navegador.fuente == "aegis") {
      if (enProcesoPrincipal()) {
        // «Seleccionar archivo» elige el paquete, no un CSV.
        interceptar(pagina);
      } else if (elegir) {
        // En un proceso de contenido no se puede recibir aquí: la página remite a Ajustes (el cierre lo dice).
        elegir.style.display = "none";
      }
    }
    pagina.setAttribute(MARCA, navegador.fuente);
    return true;
  } catch (e) {
    console.error("Aegis: importar contraseñas", e);
    try {
      restaurar(pagina);
    } catch (e2) {
      // Ya se ha avisado.
    }
    return false;
  }
}

/** Lo que usa MigrationWizardChild (parche 0900-migracion/0001). */
export const AegisImportar = { pasosDelCsv };
