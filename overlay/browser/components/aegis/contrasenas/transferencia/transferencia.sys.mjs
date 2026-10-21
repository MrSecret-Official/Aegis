/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · pasar las contraseñas a otro Aegis con el código de 6 palabras (fase 2 de docs/PLAN.md). El formato, el
 * código y el cifrado están en formato.sys.mjs; aquí, lo que toca el navegador. Detalle y límites en
 * docs/PRIVACIDAD.md, «Pasar las contraseñas a otro Aegis».
 *
 * - **Pasar** (Ajustes › Contraseñas y autorrelleno › «Pasar a otro Aegis», dialogos/transferencia-pasar.*): verifica la
 *   identidad (Windows Hello o la contraseña principal, LoginHelper.requestReauth como al exportar en Firefox, sin la
 *   gracia de 5 minutos), el usuario elige dónde guardar el archivo, se descifran los inicios de sesión
 *   (getAllLogins) y se serializan sin GUID ni nada del equipo, con los códigos de verificación de cada uno si se deja
 *   marcado (autenticador/, que los guarda en su propio archivo cifrado con la misma clave). Se genera el código, se
 *   cifra y se escribe. El código se enseña una vez y no se guarda; este perfil no apunta nada.
 * - **Recibir** (Ajustes › «Recibir de otro Aegis» y la página de las contraseñas del asistente de importar,
 *   migracion/asistente.sys.mjs; dialogos/transferencia-recibir.*): archivo y código → se descifra, se comprueba que no
 *   ha caducado ni se ha importado ya aquí, y entra por LoginHelper.maybeImportLogins, que no duplica lo que ya hay y
 *   llama a addLoginAsync. Pasar y recibir piden siempre la contraseña principal (AegisContrasenas.pedirPrincipal),
 *   aunque guardar una contraseña ya no la exija: el archivo lleva todas, y casi siempre sus códigos de verificación
 *   (los dos pasos de cada cuenta), así que tampoco se dejan, al recibirlos, en un perfil sin ella. El identificador del
 *   paquete se apunta en una pref del perfil (aegis.contrasenas.transferencia.usados) con su hora, y se olvida cuando
 *   el paquete ya habría caducado.
 * - **Copiar el código**: como dato sensible (fuera del historial del portapapeles de Windows) y, si sigue ahí, se
 *   borra a los 60 s (aegis.contrasenas.transferencia.portapapeles_segundos) o al cerrar Aegis. Firefox no tiene un
 *   borrado propio: es un único temporizador que se pone al copiar y se va al dispararse, como el de los códigos de
 *   verificación; nada corre en reposo.
 *
 * Nada de esto conecta con la red: lee y escribe un archivo que elige el usuario.
 */

import { AegisContrasenas } from "../../contrasenas.sys.mjs";
import {
  apuntarUso,
  cifrar,
  comprobarUso,
  descifrar,
  ErrorTransferencia,
  EXTENSION,
  generarCodigo,
  leerCodigo,
  TAMANO_MAXIMO,
  usosVigentes,
} from "./formato.sys.mjs";

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  AegisAutenticador: new URL("../../autenticador/autenticador.sys.mjs", import.meta.url).href,
  BrowserWindowTracker: "resource:///modules/BrowserWindowTracker.sys.mjs",
  clearTimeout: "resource://gre/modules/Timer.sys.mjs",
  LoginHelper: "resource://gre/modules/LoginHelper.sys.mjs",
  setTimeout: "resource://gre/modules/Timer.sys.mjs",
});

/** Paquetes ya importados en este perfil: JSON con [id, creado] de las últimas 24 h (formato.sys.mjs, usosVigentes). */
const PREF_USADOS = "aegis.contrasenas.transferencia.usados";
const PREF_PORTAPAPELES = "aegis.contrasenas.transferencia.portapapeles_segundos";
/** Tras verificar la identidad, el tiempo para elegir dónde guardar (y ni una exportación más sin volver a pedirla). */
const AUTORIZACION_MS = 2 * 60 * 1000;

const DIALOGO_PASAR = "chrome://browser/content/aegis/transferencia-pasar.xhtml";
const DIALOGO_RECIBIR = "chrome://browser/content/aegis/transferencia-recibir.xhtml";

function token() {
  return Cc["@mozilla.org/security/internalkeytoken;1"].createInstance(Ci.nsIPKCS11Token);
}

let localizacion;
function texto(id, args) {
  localizacion ??= new Localization(["aegis.ftl", "branding/brand.ftl"], true);
  return localizacion.formatValueSync(id, args) ?? "";
}

/** La ventana de arriba de la que sale una página (Ajustes, el asistente) o la ventana del navegador. */
function ventanaDe(win) {
  const arriba = win?.browsingContext?.topChromeWindow ?? win;
  if (arriba && !arriba.closed) {
    return arriba;
  }
  return lazy.BrowserWindowTracker.getTopWindow({ allowFromInactiveWorkspace: true });
}

/**
 * Un diálogo de Aegis, modal en la ventana (gDialogBox) o, si no la hay (el asistente de importar en su propia
 * ventana), en una ventana modal propia.
 */
async function abrirDialogo(win, url, args) {
  args.setPropertyAsBool("async", true);
  if (win.gDialogBox) {
    await win.gDialogBox.open(url, args);
  } else {
    win.openDialog(url, "", "centerscreen,chrome,modal,titlebar", args);
  }
  return args;
}

function bolsa() {
  return Cc["@mozilla.org/hash-property-bag;1"].createInstance(Ci.nsIWritablePropertyBag2);
}

/* ───────── Selector de archivos ───────── */

/**
 * @param {Window} win la ventana sobre la que sale el selector nativo
 * @param {"guardar"|"abrir"} modo
 * @returns {Promise<string|null>} la ruta, o null si se cancela
 */
async function elegirArchivo(win, modo) {
  const selector = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
  const guardar = modo == "guardar";
  selector.init(
    win.browsingContext,
    texto(guardar ? "aegis-transferencia-selector-guardar" : "aegis-transferencia-selector-abrir"),
    guardar ? Ci.nsIFilePicker.modeSave : Ci.nsIFilePicker.modeOpen
  );
  selector.appendFilter(texto("aegis-transferencia-selector-filtro"), `*.${EXTENSION}`);
  if (guardar) {
    selector.defaultString = `${texto("aegis-transferencia-nombre-archivo")}.${EXTENSION}`;
    selector.defaultExtension = EXTENSION;
  } else {
    selector.appendFilters(Ci.nsIFilePicker.filterAll);
  }
  const respuesta = await new Promise(resolver => selector.open(resolver));
  if (respuesta == Ci.nsIFilePicker.returnCancel || !selector.file) {
    if (modo == "guardar") {
      // Sin archivo no se crea nada: la autorización de verificarIdentidad() no queda viva esperando.
      autorizadoHasta = 0;
    }
    return null;
  }
  return selector.file.path;
}

/* ───────── Pasar ───────── */

let autorizadoHasta = 0;

/**
 * Windows Hello o la contraseña principal (con la bóveda cerrada, o sin autenticación del sistema), siempre: sin la
 * gracia de 5 minutos de about:logins. Sin contraseña principal, no: pasar la exige (abrirPasar la pide antes de abrir
 * el diálogo), y sin ella requestReauth se conformaría con el PIN de Windows o, con la autenticación del sistema
 * apagada, con nada. Así no basta con abrir el diálogo escribiendo su dirección.
 *
 * @param {Window} win
 * @returns {Promise<boolean>}
 */
async function verificarIdentidad(win) {
  autorizadoHasta = 0;
  if (!token().hasPassword) {
    return false;
  }
  const { isAuthorized } = await lazy.LoginHelper.requestReauth(
    { documentGlobal: ventanaDe(win) },
    0,
    texto("aegis-transferencia-autenticacion"),
    texto("aegis-transferencia-autenticacion-titulo"),
    "aegis_transferencia"
  );
  if (isAuthorized) {
    autorizadoHasta = Date.now() + AUTORIZACION_MS;
  }
  return isAuthorized;
}

/** Cuántas contraseñas y códigos hay, sin descifrar nada (no pide la contraseña principal). */
async function resumenParaPasar() {
  let contrasenas = 0;
  let codigos = 0;
  try {
    contrasenas = await Services.logins.countLoginsAsync("", "", "");
  } catch (e) {
    console.error("Aegis: contar las contraseñas", e);
  }
  try {
    codigos = (await lazy.AegisAutenticador.entradas()).length;
  } catch (e) {
    console.error("Aegis: contar los códigos de verificación", e);
  }
  return { contrasenas, codigos };
}

/** Un inicio de sesión como va en el paquete: lo que hace falta para recrearlo, sin GUID ni contadores. */
function serializar(login) {
  login.QueryInterface(Ci.nsILoginMetaInfo);
  return {
    origin: login.origin,
    formActionOrigin: login.formActionOrigin ?? null,
    httpRealm: login.httpRealm ?? null,
    username: login.username ?? "",
    password: login.password,
    usernameField: login.usernameField ?? "",
    passwordField: login.passwordField ?? "",
    timeCreated: login.timeCreated,
    timePasswordChanged: login.timePasswordChanged,
    timeLastUsed: login.timeLastUsed,
  };
}

/**
 * Crea el paquete en «ruta». Solo justo después de verificarIdentidad() (una vez por verificación).
 *
 * @param {object} opciones
 * @param {string} opciones.ruta
 * @param {boolean} opciones.incluirCodigos
 * @returns {Promise<{palabras: string[], contrasenas: number, codigos: number}>}
 */
async function pasar({ ruta, incluirCodigos }) {
  // Sin contraseña principal no se crea ningún paquete, se llegue por donde se llegue (abrirPasar, el diálogo abierto
  // a mano o una llamada directa).
  if (!token().hasPassword) {
    autorizadoHasta = 0;
    throw new ErrorTransferencia("sin-principal");
  }
  if (Date.now() >= autorizadoHasta) {
    throw new ErrorTransferencia("autenticacion");
  }
  autorizadoHasta = 0;
  const logins = await Services.logins.getAllLogins();
  if (!logins.length) {
    throw new ErrorTransferencia("vacio");
  }
  const secretos = incluirCodigos ? await lazy.AegisAutenticador.secretosParaTransferir() : new Map();
  let codigos = 0;
  const contrasenas = logins.map(login => {
    const entrada = serializar(login);
    const totp = secretos.get(login.guid);
    if (totp) {
      entrada.totp = totp;
      codigos++;
    }
    return entrada;
  });
  secretos.clear();
  const palabras = generarCodigo();
  const { bytes } = await cifrar(contrasenas, palabras);
  contrasenas.length = 0;
  try {
    await IOUtils.write(ruta, bytes, { tmpPath: `${ruta}.tmp` });
  } catch (e) {
    console.error("Aegis: guardar el paquete de contraseñas", e);
    throw new ErrorTransferencia("escribir");
  }
  return { palabras, contrasenas: logins.length, codigos };
}

/* ───────── Recibir ───────── */

function usados() {
  try {
    return JSON.parse(Services.prefs.getStringPref(PREF_USADOS, "[]"));
  } catch (e) {
    return [];
  }
}

async function leerArchivo(ruta) {
  let info;
  try {
    info = await IOUtils.stat(ruta);
  } catch (e) {
    throw new ErrorTransferencia("leer");
  }
  if (info.type != "regular" || info.size > TAMANO_MAXIMO) {
    throw new ErrorTransferencia("incorrecto");
  }
  try {
    return await IOUtils.read(ruta, { maxBytes: TAMANO_MAXIMO });
  } catch (e) {
    throw new ErrorTransferencia("leer");
  }
}

const textoO = (v, otro = "") => (typeof v == "string" ? v : otro);
// Nunca en el futuro: un paquete con una fecha de cambio inventada pisaría siempre la contraseña que ya hay.
const fecha = v => (Number.isSafeInteger(v) && v > 0 ? Math.min(v, Date.now()) : undefined);

/**
 * Una entrada del paquete como la espera maybeImportLogins, o null si no vale (lo de dentro solo lo puede escribir
 * quien tiene el código, pero se comprueba igual: tipos, campos obligatorios).
 */
function fila(e) {
  if (!e || typeof e != "object" || typeof e.origin != "string" || !e.origin) {
    return null;
  }
  if (typeof e.password != "string" || !e.password) {
    return null;
  }
  const creado = fecha(e.timeCreated) ?? Date.now();
  return {
    origin: e.origin,
    formActionOrigin: typeof e.formActionOrigin == "string" ? e.formActionOrigin : null,
    httpRealm: typeof e.httpRealm == "string" ? e.httpRealm : null,
    username: textoO(e.username),
    password: e.password,
    usernameElement: textoO(e.usernameField),
    passwordElement: textoO(e.passwordField),
    timeCreated: creado,
    timePasswordChanged: fecha(e.timePasswordChanged) ?? creado,
    timeLastUsed: fecha(e.timeLastUsed) ?? creado,
  };
}

/** El guid del inicio de sesión que ha quedado guardado para una fila (nuevo o el que ya estaba). */
async function guidDe(f) {
  const candidatos = (await Services.logins.searchLoginsAsync({ origin: f.origin })).filter(
    l => l.username === f.username && (l.httpRealm ?? null) === f.httpRealm
  );
  const login = candidatos.find(l => l.password === f.password) ?? candidatos[0];
  return login ? login.QueryInterface(Ci.nsILoginMetaInfo).guid : null;
}

let recibiendo = false;

/**
 * Abre un paquete y mete su contenido en la bóveda.
 *
 * @param {object} opciones
 * @param {string} opciones.ruta
 * @param {string} opciones.codigo lo que ha escrito el usuario
 * @returns {Promise<{nuevas: number, actualizadas: number, yaEstaban: number, errores: number,
 *   codigosNuevos: number, codigosYaEstaban: number}>}
 */
async function recibir({ ruta, codigo }) {
  if (recibiendo) {
    throw new ErrorTransferencia("ocupado");
  }
  recibiendo = true;
  try {
    const datos = await descifrar(await leerArchivo(ruta), codigo, { ahora: Date.now() });
    comprobarUso(usosVigentes(usados(), Date.now()), datos.id);

    // Sin contraseña principal no se recibe nada; quien abre el diálogo ya la ha pedido (abrirRecibir), y desde aquí no
    // se puede abrir el suyo (gDialogBox lo dejaría en cola detrás de este). La bóveda, abierta: NSS pide aquí la
    // contraseña principal una sola vez, no una por inicio de sesión.
    const t = token();
    if (!t.hasPassword) {
      throw new ErrorTransferencia("sin-principal");
    }
    if (t.hasPassword && !t.isLoggedIn) {
      try {
        await t.login();
      } catch (e) {
        // Cancelado.
      }
      if (!t.isLoggedIn) {
        throw new ErrorTransferencia("bloqueada");
      }
    }

    const filas = [];
    const totps = [];
    let errores = 0;
    for (const e of datos.contrasenas) {
      const f = fila(e);
      if (!f) {
        errores++;
        continue;
      }
      filas.push(f);
      if (e.totp && typeof e.totp == "object") {
        totps.push([f, e.totp]);
      }
    }
    datos.contrasenas.length = 0;

    const resumen = filas.length ? await lazy.LoginHelper.maybeImportLogins(filas) : [];
    // Abierto y procesado: no vale otra vez (aunque alguna fila fallara, repetirlo no la arreglaría).
    Services.prefs.setStringPref(PREF_USADOS, JSON.stringify(apuntarUso(usados(), datos.id, datos.creado, Date.now())));

    const cuantas = resultado => resumen.filter(r => r.result == resultado).length;
    const total = {
      nuevas: cuantas("added"),
      actualizadas: cuantas("modified"),
      yaEstaban: cuantas("no_change"),
      errores: errores + resumen.filter(r => String(r.result).startsWith("error")).length,
      codigosNuevos: 0,
      codigosYaEstaban: 0,
    };
    for (const [f, totp] of totps) {
      try {
        const guid = await guidDe(f);
        if (!guid) {
          continue;
        }
        if (await lazy.AegisAutenticador.recibir(guid, totp)) {
          total.codigosNuevos++;
        } else {
          total.codigosYaEstaban++;
        }
      } catch (e) {
        console.error("Aegis: recibir un código de verificación", e);
        total.errores++;
      }
    }
    return total;
  } finally {
    recibiendo = false;
  }
}

/* ───────── Portapapeles ───────── */

let limpieza = null;

function textoDelPortapapeles() {
  try {
    const trans = Cc["@mozilla.org/widget/transferable;1"].createInstance(Ci.nsITransferable);
    trans.init(null);
    trans.addDataFlavor("text/plain");
    Services.clipboard.getData(trans, Services.clipboard.kGlobalClipboard);
    const valor = {};
    trans.getTransferData("text/plain", valor);
    return valor.value?.QueryInterface(Ci.nsISupportsString).data ?? null;
  } catch (e) {
    return null;
  }
}

const alCerrar = {
  observe() {
    if (limpieza) {
      limpiarPortapapeles();
    }
  },
};

/** Borra el código si sigue siendo lo último copiado (lo que el usuario copie después no se toca). */
function limpiarPortapapeles() {
  const actual = limpieza;
  if (!actual) {
    return;
  }
  lazy.clearTimeout(actual.id);
  limpieza = null;
  Services.obs.removeObserver(alCerrar, "quit-application-granted");
  if (textoDelPortapapeles() === actual.copiado) {
    Services.clipboard.emptyClipboard(Services.clipboard.kGlobalClipboard);
  }
}

/**
 * Copia el código (las palabras separadas por un espacio) como dato sensible.
 *
 * @param {string[]} palabras
 * @returns {number} segundos tras los que se borra; 0, nunca
 */
function copiarCodigo(palabras) {
  const copiado = palabras.join(" ");
  const ayudante = Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper);
  ayudante.copyString(copiado, null, Ci.nsIClipboardHelper.Sensitive);
  if (limpieza) {
    lazy.clearTimeout(limpieza.id);
    limpieza = null;
    Services.obs.removeObserver(alCerrar, "quit-application-granted");
  }
  const segundos = Math.min(Math.max(Services.prefs.getIntPref(PREF_PORTAPAPELES, 60), 0), 600);
  if (!segundos) {
    return 0;
  }
  // Un solo temporizador, solo tras copiar; se va al dispararse.
  limpieza = { copiado, id: lazy.setTimeout(limpiarPortapapeles, segundos * 1000) };
  Services.obs.addObserver(alCerrar, "quit-application-granted");
  return segundos;
}

/* ───────── Abrir los diálogos ───────── */

/**
 * Ajustes › «Pasar a otro Aegis». Pide siempre la contraseña principal, también ahora que guardar no la exige: saca
 * todas las contraseñas del equipo de una vez, y sin ella requestReauth se conformaría con la autenticación de Windows
 * (un PIN) o, si está apagada, con nada.
 */
async function abrirPasar(win) {
  const destino = ventanaDe(win);
  if (!destino) {
    return;
  }
  if (!(await AegisContrasenas.pedirPrincipal(destino))) {
    return;
  }
  await abrirDialogo(destino, DIALOGO_PASAR, bolsa());
}

/**
 * Ajustes › «Recibir de otro Aegis» y el asistente de importar. Antes de abrirlo, si hace falta, la contraseña
 * principal (dentro del diálogo no se podría: gDialogBox pondría el suyo en cola).
 *
 * @param {Window} win
 * @param {string} [ruta] el archivo, si ya se ha elegido (el asistente)
 * @returns {Promise<boolean>} si se han recibido las contraseñas
 */
async function abrirRecibir(win, ruta = "") {
  const destino = ventanaDe(win);
  if (!destino) {
    return false;
  }
  if (!(await AegisContrasenas.pedirPrincipal(destino))) {
    return false;
  }
  const args = bolsa();
  args.setPropertyAsAString("aegis-ruta", ruta);
  await abrirDialogo(destino, DIALOGO_RECIBIR, args);
  try {
    return args.getPropertyAsBool("aegis-recibidas");
  } catch (e) {
    return false;
  }
}

/** El asistente de importar: «Seleccionar archivo» elige el paquete y luego se pide el código. */
async function recibirDesdeAsistente(win) {
  const destino = ventanaDe(win);
  if (!destino) {
    return false;
  }
  const ruta = await elegirArchivo(destino, "abrir");
  return ruta ? abrirRecibir(destino, ruta) : false;
}

export const AegisTransferencia = {
  abrirPasar,
  abrirRecibir,
  recibirDesdeAsistente,
  // Para los diálogos (dialogos/transferencia-*.mjs).
  elegirArchivo,
  verificarIdentidad,
  resumenParaPasar,
  pasar,
  recibir,
  copiarCodigo,
  leerCodigo,
  borrarArchivo: ruta => IOUtils.remove(ruta),
};
