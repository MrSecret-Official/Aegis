/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · Contraseñas: lo que protege el gestor de contraseñas de Firefox frente al robo (fase 5). Detalle y límites,
 * en docs/PRIVACIDAD.md, «Contraseñas».
 *
 * - **Contraseña principal recomendada, no obligatoria para guardar** (decisión del usuario, 2026-10-20). Sin ella,
 *   key4.db (la clave que cifra logins.json) no lleva contraseña y cualquier programa que copie el perfil descifra
 *   todo: se guarda como en Firefox, y el panel y about:logins lo avisan con «Crear contraseña principal».
 *   aegis.contrasenas.principal_obligatoria (false de serie) vuelve a exigirla antes de guardar la primera (aviso de
 *   guardar, a mano, importar, contraseña generada). Lo que la exige siempre, con la pref o sin ella:
 *   pedirPrincipal(), para pasar o recibir de otro Aegis y añadir un código de verificación.
 * - **Un solo diálogo, el de Aegis** (dialogos/contrasena-principal.xhtml): explica por qué, pide la contraseña dos
 *   veces con una fortaleza mínima obligatoria (dialogos/fortaleza.mjs) y avisa de que no se puede recuperar.
 *   Sustituye también al changemp.xhtml de Firefox («override» en el manifiesto chrome), así que Ajustes y
 *   about:logins usan el mismo (crear o cambiar).
 * - **KDF más fuerte.** NSS deriva la clave de la contraseña principal con PBKDF2-HMAC-SHA256 y 10 000 iteraciones.
 *   Su variable de entorno NSS_MIN_MP_PBE_ITERATION_COUNT sube el mínimo sin tocar C++: se lee cada vez que se pone o
 *   se cambia la contraseña, y las iteraciones quedan guardadas en key4.db (abrirla luego no depende de la variable).
 * - **Bloqueo por inactividad.** NSS ya no tiene security.password_lifetime: tras unos minutos sin usar el equipo, la
 *   bóveda se cierra (token.logout()) y la contraseña principal se vuelve a pedir. Lo avisa el servicio de
 *   inactividad del navegador; solo se escucha mientras la bóveda está abierta. Al cerrar Aegis se cierra siempre.
 * - **También al suspender el equipo** (aviso «sleep_notification» del sistema): quien abra el portátil después
 *   necesita la contraseña principal. Es un observador, sin temporizadores.
 * - **Ver, copiar y editar con autenticación** del sistema (Windows Hello) también sin contraseña principal: Firefox la
 *   apaga en los perfiles nuevos y Aegis la enciende una vez.
 * - **Sin exportar en claro.** LoginExport.exportAsCSV (about:logins y el panel) no escribe nada salvo que se active
 *   aegis.contrasenas.exportar_en_claro; las páginas además quitan la opción del menú.
 *
 * Sin parches: se envuelven métodos de módulos de Firefox (LoginManager y LoginExport), así que si cambian de nombre
 * en una versión nueva, se avisa en la consola y verificar.py lo comprueba contra el árbol.
 */

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  BrowserWindowTracker: "resource:///modules/BrowserWindowTracker.sys.mjs",
  LoginExport: "resource://gre/modules/LoginExport.sys.mjs",
  LoginHelper: "resource://gre/modules/LoginHelper.sys.mjs",
  LoginManager: "resource://gre/modules/LoginManager.sys.mjs",
  OSKeyStore: "resource://gre/modules/OSKeyStore.sys.mjs",
});

/** Si es true, no se guarda ninguna contraseña sin contraseña principal. De serie, false: como en Firefox. */
const PREF_OBLIGATORIA = "aegis.contrasenas.principal_obligatoria";
/** Minutos sin usar el equipo tras los que se cierra la bóveda; 0, nunca. Se elige en Ajustes › Privacidad. */
export const PREF_BLOQUEO = "aegis.contrasenas.bloqueo_minutos";
/** Lo que se puede elegir, en el orden de Ajustes (0 = nunca). */
export const OPCIONES_BLOQUEO = [0, 15, 10, 5, 3, 2, 1];

/**
 * Los minutos de bloqueo, siempre uno de OPCIONES_BLOQUEO: un valor fuera de la lista (puesto en about:config) se lleva
 * al más cercano (a igual distancia, al menor, que cierra antes); negativo, a «nunca»; más de 15, a 15.
 */
export function minutosDeBloqueo() {
  let valor = 10;
  try {
    valor = Services.prefs.getIntPref(PREF_BLOQUEO, 10);
  } catch (e) {
    // Una pref de otro tipo: la de serie.
  }
  if (valor <= 0) {
    return 0;
  }
  let mejor = 1;
  for (const o of OPCIONES_BLOQUEO.filter(m => m > 0).sort((a, b) => a - b)) {
    if (Math.abs(o - valor) < Math.abs(mejor - valor)) {
      mejor = o;
    }
  }
  return mejor;
}
/** Si es true, vuelve la exportación en claro (CSV) de Firefox, con su autenticación y su aviso. */
export const PREF_EXPORTAR = "aegis.contrasenas.exportar_en_claro";

/**
 * Iteraciones de PBKDF2-HMAC-SHA256 al poner o cambiar la contraseña principal: las que recomienda OWASP (2023). En el
 * equipo de pruebas, unos 0,3 s al abrir la bóveda, una vez por sesión; a quien pruebe contraseñas con una copia de
 * key4.db le cuesta 60 veces más que con las 10 000 de serie.
 */
const ITERACIONES_KDF = 600000;
const ENV_KDF = "NSS_MIN_MP_PBE_ITERATION_COUNT";

/** El diálogo de Aegis (dialogos/, servido por el manifiesto chrome overlay/browser/themes/addons/aegis-temas.inc.mn). */
const DIALOGO_PRINCIPAL = "chrome://browser/content/aegis/contrasena-principal.xhtml";

function token() {
  return Cc["@mozilla.org/security/internalkeytoken;1"].createInstance(Ci.nsIPKCS11Token);
}

/**
 * Error con el código de XPCOM que esperan quienes llaman (Components.Exception estropearía las tildes del mensaje).
 *
 * @param {string} mensaje
 * @param {number} codigo
 * @returns {Error}
 */
function error(mensaje, codigo) {
  return Object.assign(new Error(mensaje), { result: codigo });
}

/* ───────── KDF ───────── */

/** Lo llama inicio() y, por si acaso, el diálogo justo antes de poner o cambiar la contraseña. */
function reforzarKdf() {
  const actual = parseInt(Services.env.get(ENV_KDF), 10) || 0;
  if (actual < ITERACIONES_KDF) {
    Services.env.set(ENV_KDF, String(ITERACIONES_KDF));
  }
}

/* ───────── Autenticación del sistema para ver, copiar y editar ───────── */

/**
 * Con un perfil nuevo, Firefox (BrowserGlue, justo antes de llamar a Aegis) pone a false y bloquea
 * signon.management.page.os-auth.locked.enabled: ver, copiar o editar una contraseña no pide nada si no hay
 * contraseña principal. Aegis la enciende una sola vez (Windows y macOS; en Linux no existe); si después el usuario la
 * apaga en Ajustes (que pide autenticarse), se respeta.
 */
function autenticacionDelSistemaUnaVez() {
  const MARCA = "aegis.contrasenas.os_auth.inicial";
  if (Services.prefs.getBoolPref(MARCA, false)) {
    return;
  }
  if (lazy.OSKeyStore.canReauth()) {
    lazy.LoginHelper.setOSAuthEnabled(true);
  }
  Services.prefs.setBoolPref(MARCA, true);
}

/* ───────── Contraseña principal ───────── */

function ventana() {
  return lazy.BrowserWindowTracker.getTopWindow({ allowFromInactiveWorkspace: true });
}

/**
 * El diálogo de Aegis para crear la contraseña principal, modal en la ventana (gDialogBox, como los avisos de la
 * ventana) o, si no lo hay, en una ventana propia. «motivo» cambia los textos: «guardar» (antes de guardar, solo con
 * aegis.contrasenas.principal_obligatoria: «No guardar» y «Crear y guardar»), «accion» (antes de algo que la exige:
 * pedirPrincipal) o «crear». El propio diálogo avisa de «passwordmgr-primary-pw-changed» al crearla.
 *
 * @param {Window} win
 * @param {"guardar"|"accion"|"crear"} motivo
 */
async function abrirDialogoPrincipal(win, motivo) {
  const args = Cc["@mozilla.org/hash-property-bag;1"].createInstance(Ci.nsIWritablePropertyBag2);
  args.setPropertyAsBool("async", true);
  args.setPropertyAsAString("aegis-motivo", motivo);
  if (win.gDialogBox) {
    await win.gDialogBox.open(DIALOGO_PRINCIPAL, args);
  } else {
    win.openDialog(DIALOGO_PRINCIPAL, "", "centerscreen,chrome,modal,titlebar", args);
  }
}

let creando = null;
/**
 * Abre el diálogo para crear la contraseña principal si aún no hay: desde el aviso del panel, de about:logins y antes
 * de guardar. Una sola pregunta a la vez: si ya hay una abierta, se espera a esa.
 *
 * @param {Window} [win] ventana del navegador; si no, la de arriba
 * @param {"guardar"|"accion"|"crear"} [motivo]
 * @returns {Promise<boolean>} si al final hay contraseña principal
 */
function crearPrincipal(win, motivo = "crear") {
  if (token().hasPassword) {
    return Promise.resolve(true);
  }
  creando ??= (async () => {
    try {
      const destino = win && !win.closed ? win : ventana();
      if (!destino) {
        return false;
      }
      await abrirDialogoPrincipal(destino, motivo);
      return token().hasPassword;
    } finally {
      creando = null;
    }
  })();
  return creando;
}

/**
 * Lo que exige la contraseña principal aunque guardar no la exija: pasar las contraseñas a otro Aegis (las saca todas
 * del equipo), recibirlas de otro Aegis y añadir un código de verificación (juntaría los dos pasos en un perfil que
 * cualquiera que lo copie descifra). Si no la hay, el diálogo explica por qué y ofrece crearla; con «Cancelar» (o
 * Esc), no se hace.
 *
 * @param {Window} [win] ventana del navegador; si no, la de arriba
 * @returns {Promise<boolean>} si hay contraseña principal
 */
function pedirPrincipal(win) {
  return crearPrincipal(win, "accion");
}

/**
 * Antes de guardar, solo con aegis.contrasenas.principal_obligatoria: si no hay contraseña principal, el diálogo
 * explica por qué hace falta y ofrece crearla, con «No guardar» (o Esc): entonces no se guarda nada. De serie, se
 * guarda sin ella, como en Firefox.
 *
 * @returns {Promise<boolean>} si se puede guardar
 */
function asegurarPrincipal() {
  if (!Services.prefs.getBoolPref(PREF_OBLIGATORIA, false) || token().hasPassword) {
    return Promise.resolve(true);
  }
  return crearPrincipal(ventana(), "guardar");
}

/**
 * Todo lo que guarda una contraseña nueva pasa por LoginManager.addLoginAsync o addLogins (aviso de guardar,
 * contraseña generada, about:logins, el panel, importar, autenticación HTTP). Se envuelven en el prototipo: el
 * servicio Services.logins es una instancia de esa clase y XPConnect busca el método en cada llamada.
 */
function exigirPrincipalAlGuardar() {
  const prototipo = lazy.LoginManager?.prototype;
  for (const nombre of ["addLoginAsync", "addLogins"]) {
    const original = prototipo?.[nombre];
    if (typeof original != "function") {
      console.error(`Aegis: LoginManager.${nombre} no existe; no se puede exigir la contraseña principal`);
      continue;
    }
    if (original.aegis) {
      continue;
    }
    const envuelto = async function (...args) {
      const vacio = nombre == "addLogins" && !args[0]?.length;
      if (!vacio && !(await asegurarPrincipal())) {
        throw error("Aegis: sin contraseña principal no se guardan contraseñas", Cr.NS_ERROR_ABORT);
      }
      return original.apply(this, args);
    };
    envuelto.aegis = true;
    prototipo[nombre] = envuelto;
  }
}

/* ───────── Bloqueo por inactividad ───────── */

const inactividad = {
  segundos: 0,
  observe(_sujeto, tema) {
    if (tema == "idle") {
      bloquear().catch(e => console.error("Aegis: bloqueo de contraseñas", e));
    }
  },
};

function servicioInactividad() {
  return Cc["@mozilla.org/widget/useridleservice;1"].getService(Ci.nsIUserIdleService);
}

function dejarDeVigilar() {
  if (inactividad.segundos) {
    servicioInactividad().removeIdleObserver(inactividad, inactividad.segundos);
    inactividad.segundos = 0;
  }
}

/**
 * Escucha la inactividad solo mientras la bóveda está abierta y tiene contraseña principal. Se vuelve a llamar al
 * cambiar los minutos (observador de la pref): quita el observador de inactividad anterior y pone el nuevo, o ninguno
 * con «Nunca». Es un aviso del servicio de inactividad, no un temporizador de Aegis.
 */
function vigilar() {
  dejarDeVigilar();
  const minutos = minutosDeBloqueo();
  const t = token();
  if (minutos <= 0 || !t.hasPassword || !t.isLoggedIn) {
    return;
  }
  inactividad.segundos = minutos * 60;
  servicioInactividad().addIdleObserver(inactividad, inactividad.segundos);
}

/** Cierra la bóveda: lo próximo que necesite una contraseña volverá a pedir la principal. */
async function bloquear() {
  dejarDeVigilar();
  const t = token();
  // Con el diálogo de la contraseña principal abierto no se toca nada (lo está usando alguien).
  if (t.hasPassword && t.isLoggedIn && !Services.logins.uiBusy) {
    await t.logout();
  }
}

const observador = {
  observe(_sujeto, tema, dato) {
    if (tema == "sleep_notification") {
      // El equipo se suspende: la bóveda se cierra ya, sin esperar a la inactividad (al volver, quien abra el equipo
      // necesita la contraseña principal).
      bloquear().catch(e => console.error("Aegis: bloqueo de contraseñas al suspender", e));
      return;
    }
    if (tema == "nsPref:changed" && dato != PREF_BLOQUEO) {
      return;
    }
    if (tema == "nsPref:changed") {
      // Un valor fuera de la lista (about:config) queda guardado como el más cercano, el mismo que se aplica.
      const normal = minutosDeBloqueo();
      if (Services.prefs.getPrefType(PREF_BLOQUEO) != Services.prefs.PREF_INT || Services.prefs.getIntPref(PREF_BLOQUEO) != normal) {
        Services.prefs.clearUserPref(PREF_BLOQUEO);
        if (normal != Services.prefs.getIntPref(PREF_BLOQUEO, 10)) {
          Services.prefs.setIntPref(PREF_BLOQUEO, normal);
        }
        return; // El cambio vuelve a llamar a este observador, que ya vigila con el valor bueno.
      }
    }
    // passwordmgr-crypto-login: se acaba de abrir la bóveda. passwordmgr-primary-pw-changed: se ha creado o cambiado
    // la contraseña (y la bóveda queda abierta).
    vigilar();
  },
};

/* ───────── Exportación en claro ───────── */

function cerrarExportacionEnClaro() {
  const exportador = lazy.LoginExport;
  const original = exportador?.exportAsCSV;
  if (typeof original != "function") {
    console.error("Aegis: LoginExport.exportAsCSV no existe; no se puede cerrar la exportación en claro");
    return;
  }
  if (original.aegis) {
    return;
  }
  const envuelto = async function (...args) {
    if (!Services.prefs.getBoolPref(PREF_EXPORTAR, false)) {
      throw error("Aegis: la exportación en claro está desactivada", Cr.NS_ERROR_NOT_AVAILABLE);
    }
    return original.apply(this, args);
  };
  envuelto.aegis = true;
  exportador.exportAsCSV = envuelto;
}

export const AegisContrasenas = {
  /** Una vez por arranque, antes de que nadie pueda poner la contraseña principal. */
  inicio() {
    reforzarKdf();
    autenticacionDelSistemaUnaVez();
    exigirPrincipalAlGuardar();
    cerrarExportacionEnClaro();
    Services.obs.addObserver(observador, "passwordmgr-crypto-login");
    Services.obs.addObserver(observador, "passwordmgr-primary-pw-changed");
    // Suspender el equipo (Windows lo avisa con PBT_APMSUSPEND; Linux, por D-Bus): un aviso, nada que sondear.
    Services.obs.addObserver(observador, "sleep_notification");
    Services.prefs.addObserver(PREF_BLOQUEO, observador);
    // Sin vigilar() aquí: al arrancar la bóveda nunca está abierta, y crear el token NSS en el arranque solo cuesta.
    // La vigilancia empieza con passwordmgr-crypto-login (observador).
  },

  crearPrincipal,

  pedirPrincipal,

  /** Para el diálogo de la contraseña principal (dialogos/contrasena-principal.mjs), justo antes de ponerla. */
  reforzarKdf,

  /** Cierra la bóveda ya (lo mismo que tras la inactividad). */
  bloquear,

  /** Para las páginas (about:logins) y el panel. */
  estado() {
    return {
      principal: token().hasPassword,
      exportar: Services.prefs.getBoolPref(PREF_EXPORTAR, false),
    };
  },
};
