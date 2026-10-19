/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · huella digital: cuánto puede leer una web del navegador (pantalla, fuentes, tarjeta gráfica, hora, idioma…).
 *
 * Cuatro niveles (pref aegis.huella.nivel), todos sobre la protección frente a la huella de Firefox (FPP,
 * toolkit/components/resistfingerprinting). Cada «objetivo» (RFPTargets.inc) es algo que la web deja de ver tal cual:
 * - «firefox»: lo de Firefox de serie (RFPTargetsDefault.inc). Nunca menos que eso.
 * - «equilibrada» (de serie): además, lo que se puede ocultar sin romper webs normales. Sus valores van en
 *   settings/prefs/42-huella.js, como prefs por defecto: un perfil nuevo está protegido desde el primer momento.
 * - «estricta»: además, ventana, ratón, fuentes, voces y capacidades de WebGL. Alguna web falla.
 * - «caja_fuerte» (el uróboros): todos los objetivos menos el tema y lo que delata (DELATA): hora en
 *   UTC, inglés, 60 fps… y la web tiene que pedir permiso: la extracción de canvas pasa por el aviso nativo
 *   de Firefox, y el usuario puede dejar a un sitio ver los datos del navegador (permiso «aegis-huella» del gestor de
 *   permisos), que para ese sitio baja la protección a «equilibrada». Al ser un permiso, lo borran «Olvidar este
 *   sitio» y el borrado de datos del sitio, como cualquier otro.
 *
 * Cómo se aplica (comprobado en nsRFPService.cpp y FingerprintingWebCompatService.sys.mjs de la 157):
 * - privacy.fingerprintingProtection.overrides: «+Objetivo,-Objetivo…» sobre el conjunto de serie. nsRFPService lo
 *   relee al cambiar (todos los procesos).
 * - privacy.fingerprintingProtection.granularOverrides: JSON [{firstPartyDomain, overrides}]. El conjunto de un sitio
 *   SUSTITUYE al global y se calcula sobre el global de ese momento; por eso el de los sitios con permiso es absoluto
 *   («-AllTargets,+…»). Casa con el dominio base (eTLD+1) de la página principal y solo en contextos del propio sitio:
 *   los iframes de terceros dentro de él siguen en Caja fuerte (el esquema no admite «*» suelto). Vale igual en
 *   ventanas normales y privadas. Solo dominios que pasen el esquema (TLD de 2 a 6 letras, sin IP).
 * - Los ajustes de compatibilidad por sitio de Mozilla (Remote Settings, remoteOverrides) se dejan como están: también
 *   se calculan sobre el global del momento, así que al cambiar de nivel se fuerza a recalcularlos.
 * - FPP respeta la excepción de los Escudos (ContentBlockingAllowList): con los Escudos bajados en un sitio, ese sitio
 *   no tiene protección frente a la huella, como en Firefox.
 * - Los objetivos «globales» (60 fps, límite de almacenamiento, colores del sistema) valen para todo el navegador, no
 *   por sitio; el límite de almacenamiento, desde el siguiente arranque.
 *
 * Sin márgenes (letterboxing): encogían la web dentro de la tarjeta y el usuario lo descartó por cómo se veía. La
 * ventana marca en cambio que la Caja fuerte está puesta (atributo aegis-caja-fuerte en la raíz; las marcas de corte
 * alrededor de la web están en estilos/interfaz.css). El tamaño de la ventana sí lo ven las webs (docs/PRIVACIDAD.md).
 *
 * Ligero: sin temporizadores. Observa su pref y los cambios de su permiso; para el aviso de Caja fuerte, lo llama escudos.sys.mjs
 * cuando la pestaña visible tiene un evento de bloqueo (no observa peticiones).
 */

const PREF_NIVEL = "aegis.huella.nivel";
/** Permiso por sitio de Caja fuerte (gestor de permisos, con el principal https://<dominio base>). */
const TIPO = "aegis-huella";
/** Se notifica cuando cambia la lista de sitios con permiso (Ajustes la repinta). */
const TEMA_PERMITIDOS = "aegis-huella-permitidos";
/** Donde se guardaba la lista antes (JSON en prefs.js): se pasa al gestor de permisos una vez y se borra. */
const PREF_PERMITIDOS_ANTES = "aegis.huella.permitidos";
/** Último nivel aplicado (sin valor de serie): para saber al arrancar si hay que entrar o salir de Caja fuerte. */
const PREF_APLICADO = "aegis.huella.aplicado";
/** Idiomas que había antes de Caja fuerte (sin valor de serie): «» si no había valor propio. */
const PREF_IDIOMAS_ANTES = "aegis.huella.idiomas_antes";

const FPP = "privacy.fingerprintingProtection";
const FPP_PRIVADA = "privacy.fingerprintingProtection.pbmode";
const OVERRIDES = "privacy.fingerprintingProtection.overrides";
const GRANULAR = "privacy.fingerprintingProtection.granularOverrides";
/** Los márgenes que ponía Caja fuerte antes: se quitan una vez a quien los tenga (MARGENES_QUITADOS). */
const LETTERBOXING = "privacy.resistFingerprinting.letterboxing";
const MARGENES_QUITADOS = "aegis.huella.margenes_quitados";
/** Atributo de la raíz de cada ventana con Caja fuerte puesta (el marco de interfaz.css). */
const ATRIBUTO = "aegis-caja-fuerte";
const IDIOMAS = "intl.accept_languages";
/** 2 = pedir las webs en inglés (nsRFPService solo aplica JSLocale con este valor). */
const INGLES_PREF = "privacy.spoof_english";
const INGLES = "en-US, en";

export const NIVELES = ["firefox", "equilibrada", "estricta", "caja_fuerte"];
const DE_SERIE = "equilibrada";

/**
 * Conjunto de serie de Firefox Release de escritorio (RFPTargetsDefault.inc de la 157, sin lo de NIGHTLY_BUILD).
 * Hace falta escrito porque el conjunto de un sitio con permiso empieza por -AllTargets. Al cambiar de versión de
 * Firefox, comparar con RFPTargetsDefault.inc.
 */
const SERIE_FIREFOX = [
  "CanvasRandomization",
  "EfficientCanvasRandomization",
  "FontVisibilityLangPack",
  "JSMathFdlibm",
  "ScreenAvailToResolution",
  "NavigatorHWConcurrencyTiered",
  "MaxTouchPointsCollapse",
  "IMEStyle",
];

/**
 * «estricta» = «equilibrada» (42-huella.js) y esto. Cada uno comprobado en el código de la 157:
 * - Fuentes: solo las de Windows de serie (sin las de paquetes de idioma ni las instaladas) y sustitutos fijos.
 * - Ventana: outerWidth = innerWidth (no se ven las barras de Aegis); screenX/Y y las coordenadas de pantalla del
 *   ratón y del tacto, relativas a la ventana; puntero «fino»; la orientación, deducida de la ventana (necesita
 *   WindowOuterSize: es quien guarda ese tamaño).
 * - Sin HDR ni voces de síntesis (speechSynthesis vacío); WebGL y WebGPU con capacidades y límites comunes (texturas
 *   de 2048 como mucho); subtítulos descargados aunque estén desactivados (si no, se nota cuáles usas).
 * - Límite de almacenamiento fijo (50 GiB en total, 10 por sitio), global y desde el siguiente arranque.
 * La pantalla y el canvas, como en «equilibrada» (DELATA). Los núcleos, también: los tramos de serie (4 u 8) dicen
 * casi lo mismo que un 4 fijo, que es menos común que 8 y hace que las webs pesadas repartan menos trabajo.
 */
const ESTRICTA = [
  "FontVisibilityBaseSystem",
  "UseHardcodedFontSubstitutes",
  "WindowOuterSize",
  "ScreenOrientation",
  "WindowScreenXY",
  "WindowInnerScreenXY",
  "MouseEventScreenPoint",
  "TouchEvents",
  "CSSPointerCapabilities",
  "CSSVideoDynamicRange",
  "SpeechSynthesis",
  "WebGLRenderCapability",
  "WebGPULimits",
  "DiskStorageLimit",
  "WebVTT",
];

/**
 * Lo que ni «estricta» ni «caja_fuerte» ponen: medido con webs reales (tools/pruebas/reales.py, 2026-10-15), hace la
 * huella más rara o delata la protección, y no oculta nada que la web no pueda leer de otro modo.
 * - ScreenRect, ScreenAvailRect y CSSDeviceSize: la pantalla igual a la ventana. El tamaño de la ventana lo ve
 *   cualquier web (innerWidth), y una pantalla del tamaño de la ventana y sin barra de tareas casi no existe (Cover
 *   Your Tracks: 17,5 bits frente a 5; CreepJS la cuenta como navegador sin interfaz: «noTaskbar»,
 *   «hasVvpScreenRes»). Queda lo de serie (ScreenAvailToResolution): la resolución real y el área libre como si la
 *   barra de tareas midiera 48 px. Con la ventana maximizada, la resolución se deduce igual de la ventana.
 * - AudioSampleRate: 44,1 kHz, cuando casi todos los equipos van a 48 (AmIUnique: 12 % frente a 30 %).
 * - MaxTouchPoints: en Windows dice 10 puntos táctiles a todos: raro sin pantalla táctil, y las webs sirven la
 *   versión táctil (ya va MaxTouchPointsCollapse, de serie).
 * El canvas tampoco se toca: EfficientCanvasRandomization (de serie) marca al azar solo la imagen que se saca
 * (toDataURL/toBlob), con una clave nueva en cada sesión y en cada sitio. Quitarlo para que CanvasRandomization
 * metiera ruido en los píxeles de getImageData lo detecta CreepJS como mentira («pixel data modified»).
 */
const DELATA = ["ScreenRect", "ScreenAvailRect", "CSSDeviceSize", "AudioSampleRate", "MaxTouchPoints"];

/** El esquema de FingerprintingWebCompatService para firstPartyDomain: lo que no pase, se descarta allí. */
const DOMINIO_VALIDO = /^((?!-)[A-Za-z0-9-]{1,63}(?<!-)\.)+[A-Za-z]{2,6}$/;

const W = Ci.nsIWebProgressListener;

/**
 * ¿Ha bloqueado Firefox un intento de sacar la huella hecho por un documento de este dominio base?
 * getContentBlockingLog() da JSON {origen: [[bandera, bloqueado, veces, …], …]}.
 */
function intentoDelSitio(browser, dominio) {
  let registro;
  try {
    registro = JSON.parse(browser.getContentBlockingLog() || "{}");
  } catch {
    return false;
  }
  for (const [origen, eventos] of Object.entries(registro)) {
    if (!eventos.some(([bandera, bloqueado]) => bloqueado && bandera & W.STATE_BLOCKED_SUSPICIOUS_FINGERPRINTING)) {
      continue;
    }
    try {
      if (Services.eTLD.getBaseDomain(Services.io.newURI(origen)).toLowerCase() == dominio) {
        return true;
      }
    } catch {}
  }
  return false;
}

let localizacion;
function texto(id, args) {
  localizacion ??= new Localization(["aegis.ftl", "branding/brand.ftl"], true);
  const [m] = localizacion.formatMessagesSync([{ id, args }]);
  return {
    value: m?.value ?? "",
    attributes: Object.fromEntries((m?.attributes ?? []).map(a => [a.name, a.value])),
  };
}

function nivelActual() {
  const n = Services.prefs.getStringPref(PREF_NIVEL, DE_SERIE);
  return NIVELES.includes(n) ? n : DE_SERIE;
}

/** Lo que 42-huella.js pone de serie en overrides: el nivel «equilibrada». */
function equilibrada() {
  try {
    return Services.prefs.getDefaultBranch("").getStringPref(OVERRIDES, "");
  } catch {
    return "";
  }
}

const mas = lista => lista.map(t => `+${t}`);

/** Texto de overrides para cada nivel; null = el de serie de Aegis («equilibrada»). */
function overridesDe(nivel) {
  switch (nivel) {
    case "firefox":
      return "";
    case "estricta":
      return [equilibrada(), ...mas(ESTRICTA)].filter(Boolean).join(",");
    case "caja_fuerte":
      // Todo menos prefers-color-scheme (forzar el tema claro deslumbraba con el navegador en oscuro, y oscuro o claro
      // lo comparte media Internet) y lo que delata.
      return ["+AllTargets", "-CSSPrefersColorScheme", ...DELATA.map(t => `-${t}`)].join(",");
    default:
      return null;
  }
}

/** Dominios base con permiso, sin repetir y ordenados. */
function permitidos() {
  const dominios = new Set();
  for (const p of Services.perms.getAllByTypes([TIPO])) {
    if (p.capability == Services.perms.ALLOW_ACTION && !p.principal.privateBrowsingId) {
      try {
        const d = p.principal.baseDomain.toLowerCase();
        if (DOMINIO_VALIDO.test(d)) {
          dominios.add(d);
        }
      } catch {}
    }
  }
  return [...dominios].sort();
}

function anadirPermiso(dominio) {
  const principal = Services.scriptSecurityManager.createContentPrincipalFromOrigin(`https://${dominio}`);
  Services.perms.addFromPrincipal(principal, TIPO, Services.perms.ALLOW_ACTION, Services.perms.EXPIRE_NEVER);
}

/** La lista de antes (pref con JSON) pasa al gestor de permisos y la pref se borra. Solo hace algo una vez. */
function migrar() {
  if (!Services.prefs.prefHasUserValue(PREF_PERMITIDOS_ANTES)) {
    return;
  }
  try {
    const lista = JSON.parse(Services.prefs.getStringPref(PREF_PERMITIDOS_ANTES, "[]"));
    for (const d of Array.isArray(lista) ? lista : []) {
      if (typeof d == "string" && DOMINIO_VALIDO.test(d)) {
        anadirPermiso(d);
      }
    }
  } catch {}
  Services.prefs.clearUserPref(PREF_PERMITIDOS_ANTES);
}

/** granularOverrides: en Caja fuerte, «equilibrada» para cada sitio con permiso. */
function granularDe(nivel) {
  const lista = nivel == "caja_fuerte" ? permitidos() : [];
  if (!lista.length) {
    return "";
  }
  const conjunto = ["-AllTargets", ...mas(SERIE_FIREFOX), ...equilibrada().split(",").filter(Boolean)].join(",");
  return JSON.stringify(lista.map(firstPartyDomain => ({ firstPartyDomain, overrides: conjunto })));
}

/** Escribe (o devuelve al de serie) una pref de texto; true si ha cambiado algo. */
function escribirTexto(pref, valor) {
  if (valor == null) {
    if (Services.prefs.prefHasUserValue(pref)) {
      Services.prefs.clearUserPref(pref);
      return true;
    }
  } else if (Services.prefs.getStringPref(pref, "") !== valor) {
    Services.prefs.setStringPref(pref, valor);
    return true;
  }
  return false;
}

/**
 * Escribe granularOverrides. Con `forzar`, aunque no cambie: FingerprintingWebCompatService solo recalcula los
 * conjuntos por sitio (los suyos y los de Mozilla) cuando cambia esta pref, y los calcula sobre el global del momento.
 * Se escribe entonces una forma equivalente: «[]» por «» o la misma lista con un espacio al final (JSON lo admite; la
 * próxima vez vuelve a ir sin él).
 */
function escribirGranular(nivel, forzar) {
  let valor = granularDe(nivel);
  const actual = Services.prefs.getStringPref(GRANULAR, "");
  if (valor === actual) {
    if (!forzar) {
      return;
    }
    valor = valor === "" ? "[]" : `${valor} `;
  }
  Services.prefs.setStringPref(GRANULAR, valor);
}

/** Caja fuerte: webs en inglés (Accept-Language, navigator.languages y, con JSLocale, Intl). */
function entrarEnCajaFuerte() {
  if (!Services.prefs.prefHasUserValue(PREF_IDIOMAS_ANTES)) {
    const antes = Services.prefs.prefHasUserValue(IDIOMAS) ? Services.prefs.getCharPref(IDIOMAS, "") : "";
    Services.prefs.setStringPref(PREF_IDIOMAS_ANTES, antes);
  }
  Services.prefs.setIntPref(INGLES_PREF, 2);
  Services.prefs.setCharPref(IDIOMAS, INGLES);
}

/**
 * Deja los idiomas como estaban antes de Caja fuerte. Si el usuario cambió los idiomas estando
 * en Caja fuerte (ya no son los de INGLES), se respeta su cambio.
 */
function salirDeCajaFuerte() {
  if (Services.prefs.prefHasUserValue(PREF_IDIOMAS_ANTES)) {
    const antes = Services.prefs.getStringPref(PREF_IDIOMAS_ANTES, "");
    if (Services.prefs.getCharPref(IDIOMAS, "") == INGLES) {
      if (antes) {
        Services.prefs.setCharPref(IDIOMAS, antes);
      } else {
        Services.prefs.clearUserPref(IDIOMAS);
      }
    }
    Services.prefs.clearUserPref(INGLES_PREF);
    Services.prefs.clearUserPref(PREF_IDIOMAS_ANTES);
  }
}

/** Las versiones anteriores de Caja fuerte encendían los márgenes: se apagan una sola vez. */
function quitarMargenes() {
  if (Services.prefs.getBoolPref(MARGENES_QUITADOS, false)) {
    return;
  }
  if (Services.prefs.prefHasUserValue(LETTERBOXING)) {
    Services.prefs.clearUserPref(LETTERBOXING);
  }
  Services.prefs.setBoolPref(MARGENES_QUITADOS, true);
}

/** Marca (o desmarca) la raíz de una ventana del navegador según el nivel. */
function marcarVentana(win) {
  win?.document?.documentElement?.toggleAttribute(ATRIBUTO, nivelActual() == "caja_fuerte");
}

function marcarVentanas() {
  for (const win of Services.wm.getEnumerator("navigator:browser")) {
    marcarVentana(win);
  }
}

/**
 * Pone las prefs de Firefox del nivel elegido. Al arrancar (cambio = false) solo corrige lo que no cuadre. Fuerza a
 * recalcular los conjuntos por sitio al cambiar de nivel y también si al arrancar ha cambiado el conjunto global (otro
 * de serie tras una actualización): FingerprintingWebCompatService ya los calculó sobre el global anterior.
 */
function aplicar(cambio) {
  const nivel = nivelActual();
  const antes = Services.prefs.getStringPref(PREF_APLICADO, "");
  const globalCambiado = escribirTexto(OVERRIDES, overridesDe(nivel));
  escribirGranular(nivel, globalCambiado || (cambio && antes != nivel));
  if (nivel == "caja_fuerte" && antes != "caja_fuerte") {
    entrarEnCajaFuerte();
  } else if (nivel != "caja_fuerte" && antes == "caja_fuerte") {
    salirDeCajaFuerte();
  }
  if (antes != nivel) {
    Services.prefs.setStringPref(PREF_APLICADO, nivel);
  }
}

const observador = {
  observe(sujeto, tema, dato) {
    try {
      if (tema == "nsPref:changed" && dato == PREF_NIVEL) {
        aplicar(true);
        marcarVentanas();
      } else if (tema == "perm-changed") {
        // «cleared» llega sin permiso (se ha borrado todo); si no, solo interesa el nuestro.
        const permiso = sujeto instanceof Ci.nsIPermission ? sujeto : null;
        if (dato == "cleared" || permiso?.type == TIPO) {
          escribirGranular(nivelActual(), false);
          Services.obs.notifyObservers(null, TEMA_PERMITIDOS);
        }
      } else if (tema == "quit-application-granted") {
        Services.prefs.removeObserver(PREF_NIVEL, observador);
        Services.obs.removeObserver(observador, "perm-changed");
        Services.obs.removeObserver(observador, "quit-application-granted");
      }
    } catch (e) {
      console.error("Aegis: huella", e);
    }
  },
};

/** Sitios ya avisados en esta sesión (en memoria: se olvidan al cerrar). */
const avisados = new Set();
const ANCLA = "aegis-huella-notification-icon";

export const AegisHuella = {
  NIVELES,
  PREF_NIVEL,
  TEMA_PERMITIDOS,

  /** Una vez por arranque (AegisArranque.inicio). */
  inicio() {
    migrar();
    quitarMargenes();
    aplicar(false);
    Services.prefs.addObserver(PREF_NIVEL, observador);
    Services.obs.addObserver(observador, "perm-changed");
    Services.obs.addObserver(observador, "quit-application-granted");
  },

  nivel: nivelActual,

  /** Cada ventana del navegador al abrirse (AegisArranque.ventana): el marco de Caja fuerte. */
  ventana: marcarVentana,

  /**
   * Elige un nivel (panel de Escudos o Ajustes). Si la protección frente a la huella estaba quitada en los ajustes de
   * rastreo de Firefox, se vuelve a encender: si no, el nivel no haría nada.
   *
   * @param {string} nivel uno de NIVELES
   */
  poner(nivel) {
    if (!NIVELES.includes(nivel)) {
      return;
    }
    if (nivel != "firefox") {
      for (const p of [FPP, FPP_PRIVADA]) {
        if (!Services.prefs.getBoolPref(p, false)) {
          Services.prefs.setBoolPref(p, true);
        }
      }
    }
    Services.prefs.setStringPref(PREF_NIVEL, nivel);
  },

  /** ¿Funciona la protección frente a la huella en este tipo de ventana? */
  activa(privada) {
    return (
      Services.prefs.getBoolPref("privacy.resistFingerprinting", false) ||
      Services.prefs.getBoolPref(FPP, false) ||
      (privada && Services.prefs.getBoolPref(FPP_PRIVADA, false))
    );
  },

  /**
   * Dominio base de la página, como lo compara Firefox, o null si no admite permiso (no es http(s), es una IP o no
   * pasa el esquema de los ajustes por sitio).
   *
   * @param {MozBrowser} browser
   */
  dominio(browser) {
    const uri = browser?.currentURI;
    if (!uri || !(uri.schemeIs("http") || uri.schemeIs("https"))) {
      return null;
    }
    try {
      const d = Services.eTLD.getBaseDomain(uri).toLowerCase();
      return DOMINIO_VALIDO.test(d) ? d : null;
    } catch {
      return null;
    }
  },

  permitidos,

  permitido(dominio) {
    return !!dominio && permitidos().includes(dominio);
  },

  /**
   * Da o quita a un sitio el permiso de ver los datos del navegador (solo cuenta en Caja fuerte). Desde una ventana
   * privada no se da (quedaría en el disco); quitarlo, siempre.
   *
   * @param {string} dominio
   * @param {boolean} si
   * @param {boolean} [privada] si la petición sale de una ventana privada
   */
  permitir(dominio, si, privada = false) {
    if (!dominio || !DOMINIO_VALIDO.test(dominio)) {
      return;
    }
    if (si) {
      if (!privada && !permitidos().includes(dominio)) {
        anadirPermiso(dominio);
      }
      return;
    }
    for (const p of Services.perms.getAllByTypes([TIPO])) {
      let base = "";
      try {
        base = p.principal.baseDomain.toLowerCase();
      } catch {}
      if (base == dominio) {
        Services.perms.removePermission(p);
      }
    }
  },

  /**
   * Caja fuerte: si la web de la pestaña visible ha intentado sacar la huella (la detección de Firefox de recolectores
   * de canvas y de fuentes, STATE_BLOCKED_SUSPICIOUS_FINGERPRINTING), un aviso anclado al botón de Escudos, una vez
   * por sitio y sesión. No en ventanas privadas: allí no se guardan permisos.
   *
   * Solo si el intento es del propio sitio: el registro de la pestaña junta también los de los iframes de otros
   * sitios, y para ellos el permiso no cambiaría nada (siguen en Caja fuerte). El origen que apunta Firefox es el del
   * documento que ejecutó el código, así que un script de un CDN dentro de la página cuenta para la página.
   *
   * @param {Window} win
   * @param {MozBrowser} browser
   * @param {Element} boton el botón de Escudos
   * @param {(browser: MozBrowser) => void} recargar
   */
  avisar(win, browser, boton, recargar) {
    if (nivelActual() != "caja_fuerte" || browser.browsingContext?.usePrivateBrowsing || !win.PopupNotifications) {
      return;
    }
    const dominio = this.dominio(browser);
    if (!dominio || avisados.has(dominio) || this.permitido(dominio)) {
      return;
    }
    if (!intentoDelSitio(browser, dominio)) {
      return;
    }
    avisados.add(dominio);
    // PopupNotifications busca el ancla en browser["<prefijo>popupnotificationanchor"], con el prefijo del id sin
    // «notification-icon»: así solo este aviso se ancla al botón de Escudos.
    browser[ANCLA.replace("notification-icon", "") + "popupnotificationanchor"] = boton;
    // PopupNotifications exige texto y tecla de acceso en cada botón: si faltara la traducción, los de en-US.
    const permitir = texto("aegis-huella-aviso-permitir").attributes;
    const bloquear = texto("aegis-huella-aviso-bloquear").attributes;
    win.PopupNotifications.show(
      browser,
      "aegis-huella",
      texto("aegis-huella-aviso").value,
      ANCLA,
      {
        label: bloquear.label || "Keep blocking",
        accessKey: bloquear.accesskey || "K",
        // Sin disableSecurityDelay: el aviso sale cuando la web quiere (le basta con ejecutar un recolector), así que
        // conserva el retardo de seguridad para que no pueda hacerlo coincidir con un clic y arrancar un «Permitir».
        callback() {},
      },
      [
        {
          label: permitir.label || "Allow on this site",
          accessKey: permitir.accesskey || "A",
          callback: () => {
            this.permitir(dominio, true);
            recargar(browser);
          },
        },
      ],
      {
        name: browser.currentURI.displayHost,
        popupIconURL: new URL("estilos/iconos/escudo.svg", import.meta.url).href,
        removeOnDismissal: true,
      }
    );
  },
};
