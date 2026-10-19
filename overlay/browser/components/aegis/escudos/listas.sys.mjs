/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · Escudos: las listas de filtros (de sus autores) y el motor que las usa.
 *
 * El motor es de Aegis; las reglas, de sus autores: uBlock Origin, EasyList, AdGuard y Brave (catalogo.json). Se
 * descargan solo de ellos y se renuevan solas.
 *
 * - Qué listas: las del nivel de Escudos (Normal y Estricto, la serie; Estricto+, además AdGuard Tracking
 *   Protection), los grupos de molestias encendidos (avisos de cookies, ventanas y banners, avisos anti-bloqueador) y
 *   las regionales del idioma de la interfaz.
 * - De dónde: la instantánea que va dentro de la build (filtros/, `aegis.py filtros`) o, si es más nueva, la copia
 *   descargada en el perfil (<perfil>/aegis-escudos/listas/). Con un perfil nuevo bloquea desde el primer arranque
 *   sin ninguna conexión.
 * - Motor: las listas se compilan fuera del hilo principal (motor.sys.mjs) a un .dat que se guarda en el perfil
 *   (<perfil>/aegis-escudos/motor.dat) junto a su clave (motor.json): qué listas, en qué versión y con qué motor. Si
 *   la clave casa, al arrancar solo se carga el .dat; si no, se recompila.
 * - Actualización (solo si el usuario ha aceptado las conexiones en la bienvenida, aegis.conexiones.aceptadas, con
 *   el grupo «Listas de protección», aegis.conexiones.listas, y no ha apagado aegis.escudos.listas.actualizar): el
 *   temporizador compartido de Firefox (nsIUpdateTimerManager, sin
 *   despertares propios) mira una vez al día qué listas han caducado según su «! Expires» (al menos un día y como
 *   mucho aegis.escudos.listas.intervalo días) y las pide a su autor: solo https, sin cookies, sin Referer, sin
 *   caché, con un Accept-Language fijo y condicional (If-None-Match / If-Modified-Since). Cada lista nueva se
 *   comprueba (tamaño, título, que no pierda más de la mitad de las reglas), cada una por separado, que compile, y,
 *   todas juntas, que compilen y carguen; si algo falla, se queda la versión anterior.
 * - Sin bucles de cierres: el motor es Rust dentro del navegador, y un fallo grave del analizador con una lista rara
 *   (un pánico) cerraría el navegador entero. Antes de compilar se escribe un marcador (aegis-escudos/compilando.json)
 *   con lo que se va a compilar, y se borra al terminar. Si al arrancar sigue ahí, la compilación anterior murió a
 *   medias: esas listas pasan a cuarentena (por su sha256, para no volver a aceptar ese mismo texto), vuelven las
 *   versiones anteriores (o la instantánea) y queda apuntado en `estado().incidencias`. Si lo que murió fue la
 *   instantánea de la build, el motor no la vuelve a compilar con esa build (solo bloquea ETP). Como cada lista nueva
 *   se compila antes sola, la culpable queda identificada sin tocar las demás.
 * - Excepciones por sitio frente a ETP: lo que las listas dejan pasar en una web concreta, ETP también lo deja pasar
 *   en esa web (escudos/etp.sys.mjs, escudos/red.sys.mjs). Los pares salen al compilar, se guardan en motor.json y se
 *   ponen en uso con el motor.
 *
 * Sin temporizadores propios ni trabajo en reposo.
 */

import { AegisEscudosEtp } from "./etp.sys.mjs";
import { AegisEscudosMotor } from "./motor.sys.mjs";
import { AegisEscudosRed } from "./red.sys.mjs";

const PREF_MOTOR = "aegis.escudos.motor";
const PREF_CATEGORIA = "browser.contentblocking.category";
const PREF_ESTRICTO_MAS = "aegis.escudos.estricto_mas";
const PREF_GRUPO = grupo => `aegis.escudos.molestias.${grupo}`;
const GRUPOS_MOLESTIAS = ["cookies", "ventanas", "antiadblock"];
/** Capa del motor de cada grupo de molestias (escudos/motor-nativo/src/lib.rs); el resto, la 0. */
const CAPA = { cookies: 1, ventanas: 2, antiadblock: 3 };
const PREF_ACEPTADAS = "aegis.conexiones.aceptadas";
/** El grupo «Listas de protección» de la bienvenida (about:conexiones): también las de los Escudos. */
const PREF_GRUPO_LISTAS = "aegis.conexiones.listas";
const PREF_ACTUALIZAR = "aegis.escudos.listas.actualizar";
const PREF_INTERVALO = "aegis.escudos.listas.intervalo";
const PREFS_VIGILADAS = [PREF_CATEGORIA, PREF_ESTRICTO_MAS, ...GRUPOS_MOLESTIAS.map(PREF_GRUPO)];

const TEMPORIZADOR = "aegis-escudos-listas";
const DIA = 24 * 3600 * 1000;
/** Lo que se espera a una lista antes de darla por perdida (un solo temporizador mientras dura la descarga). */
const ESPERA_RED = 60 * 1000;
const ACCEPT_LANGUAGE = "en-US,en;q=0.5";
/** Cambia si cambia lo que el worker hace con el texto (preprocesado): obliga a recompilar. */
const VERSION_PREPROCESADO = 4;

const URL_CATALOGO = new URL("catalogo.json", import.meta.url).href;
/** La instantánea: junto a este archivo en la build; en el modo desarrollo, la de la build instalada. */
const BASES_INSTANTANEA = [new URL("filtros/", import.meta.url).href, "resource:///modules/aegis/escudos/filtros/"];

const TITULO = /^! Title: *(.+?) *$/m;
const EXPIRES = /^! Expires: *(\d+) *(days?|hours?|d|h)\b/im;
const INCLUDE = /^!#include +(\S+)/gm;
const NOMBRE_INCLUIDO = /^[\w.-]+(?:\/[\w.-]+)*$/;
/** Nombre de un archivo de aegis-escudos/listas/ sin extensión («id» o «id--incluida»): nunca una ruta. */
const NOMBRE_ARCHIVO = /^[\w-]+(?:\.[\w-]+)*$/;

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  NetUtil: "resource://gre/modules/NetUtil.sys.mjs",
  setTimeout: "resource://gre/modules/Timer.sys.mjs",
  clearTimeout: "resource://gre/modules/Timer.sys.mjs",
});

const decodificador = new TextDecoder();

let catalogo = null;
/** {base, fecha (ms), listas: {id: {archivo, sha256, reglas, expira_horas, incluidas}}} o null si no hay. */
let instantanea = null;
/** Estado de las listas descargadas: {listas: {id: {fecha, comprobada, etag, modificada, sha256, reglas, …}}}. */
let estado = { listas: {} };
/** La clave del motor cargado (qué listas y de dónde). */
let claveCargada = null;
/** Las tareas (preparar el motor, revisar las listas) van de una en una, en orden. */
let cola = Promise.resolve();
let iniciado = false;
let temporizadorPuesto = false;

const dir = () => PathUtils.join(PathUtils.profileDir, "aegis-escudos");
const dirListas = () => PathUtils.join(dir(), "listas");
const rutaEstado = () => PathUtils.join(dir(), "listas.json");
const rutaDat = () => PathUtils.join(dir(), "motor.dat");
const rutaClave = () => PathUtils.join(dir(), "motor.json");
/** Existe solo mientras se compila (y se carga lo compilado): ver la cabecera, «Sin bucles de cierres». */
const rutaMarcador = () => PathUtils.join(dir(), "compilando.json");
/** Incidencias que se recuerdan (para el panel y Ajustes) y textos en cuarentena (por sha256). */
const MAX_INCIDENCIAS = 10;
const MAX_CUARENTENA = 100;

async function leerJson(ruta) {
  try {
    return await IOUtils.readJSON(ruta);
  } catch {
    return null;
  }
}

async function cargarCatalogo() {
  catalogo ??= (await (await fetch(URL_CATALOGO)).json()).listas;
  return catalogo;
}

async function cargarInstantanea() {
  if (instantanea !== null) {
    return instantanea;
  }
  for (const base of BASES_INSTANTANEA) {
    try {
      const indice = await (await fetch(base + "filtros.json")).json();
      instantanea = { base, fecha: Date.parse(indice.fecha) || 0, listas: indice.listas ?? {} };
      return instantanea;
    } catch {}
  }
  instantanea = { base: null, fecha: 0, listas: {} };
  return instantanea;
}

/** Las listas que tocan ahora, según el nivel, las molestias y el idioma de la interfaz. */
function activas() {
  const categoria = Services.prefs.getStringPref(PREF_CATEGORIA, "standard");
  const estrictoMas = categoria == "strict" && Services.prefs.getBoolPref(PREF_ESTRICTO_MAS, true);
  const idioma = (Services.locale.appLocaleAsBCP47 || "en").split("-")[0].toLowerCase();
  return catalogo.filter(l => {
    switch (l.grupo) {
      case "base":
        return true;
      case "rastreo":
        return estrictoMas;
      case "regional":
        return (l.idiomas ?? []).includes(idioma);
      default:
        return GRUPOS_MOLESTIAS.includes(l.grupo) && Services.prefs.getBoolPref(PREF_GRUPO(l.grupo), true);
    }
  });
}

/**
 * De dónde sale cada lista: la descargada si es más nueva que la instantánea (y no está en cuarentena); si no, la
 * instantánea.
 */
function fuente(l) {
  const red = estado.listas[l.id];
  const build = instantanea.listas[l.id];
  if (red?.sha256 && !estado.cuarentena?.[red.sha256] && (!build || red.fecha > instantanea.fecha)) {
    return { origen: "red", sha256: red.sha256, fecha: red.fecha, reglas: red.reglas, datos: red };
  }
  if (build && estado.instantaneaRota != Services.appinfo.appBuildID) {
    return { origen: "build", sha256: build.sha256, fecha: instantanea.fecha, reglas: build.reglas, datos: build };
  }
  return null;
}

async function claveDe(listas) {
  const info = await AegisEscudosMotor.info();
  return JSON.stringify({
    motor: info.sha256,
    preprocesado: VERSION_PREPROCESADO,
    excepcionesEtp: AegisEscudosEtp.VERSION,
    listas: listas.map(l => [l.id, fuente(l)?.sha256 ?? null, l.confianza ? 1 : 0]),
  });
}

/** Bytes de una lista (y de lo que incluye) desde su fuente. */
async function bytesDe(l) {
  const f = fuente(l);
  if (!f) {
    return null;
  }
  const incluidas = {};
  if (f.origen == "red") {
    const datos = (await IOUtils.read(PathUtils.join(dirListas(), `${l.id}.txt`))).buffer;
    for (const [nombre, archivo] of Object.entries(f.datos.incluidas ?? {})) {
      incluidas[nombre] = (await IOUtils.read(PathUtils.join(dirListas(), archivo))).buffer;
    }
    return { datos, incluidas };
  }
  const base = instantanea.base;
  const datos = await (await fetch(base + f.datos.archivo)).arrayBuffer();
  for (const [nombre, archivo] of Object.entries(f.datos.incluidas ?? {})) {
    incluidas[nombre] = await (await fetch(base + archivo)).arrayBuffer();
  }
  return { datos, incluidas };
}

/**
 * Ejecuta fn con el marcador de compilación puesto: si el proceso muere dentro, el próximo arranque lo encuentra
 * (recuperar). `sospechosas`: [{id, sha256, archivos}] las listas a las que se culparía; `archivos`, los nombres de
 * aegis-escudos/listas/ que esa tanda ha cambiado (sus .nuevo y .anterior).
 */
async function conMarcador(fase, sospechosas, fn) {
  await IOUtils.makeDirectory(dir(), { ignoreExisting: true });
  // appBuildID, no platformBuildID: este no cambia en una build incremental (solo si cambia un objeto C++ de libxul).
  const marcador = { fase, fecha: Date.now(), compilacion: Services.appinfo.appBuildID, sospechosas };
  await IOUtils.writeJSON(rutaMarcador(), marcador, { tmpPath: rutaMarcador() + ".tmp" });
  vigilarCierre();
  marcadorPuesto = marcador;
  try {
    return await fn();
  } finally {
    marcadorPuesto = null;
    await quitarMarcador();
  }
}

/** El marcador puesto por este proceso (compilación en marcha), o null. */
let marcadorPuesto = null;
let cierreVigilado = false;
/**
 * Cerrar Aegis con normalidad en mitad de una compilación (por ejemplo, justo después de cambiar el nivel) no es un
 * cierre inesperado: el marcador se reescribe con la fase «interrumpida» antes de cerrar el perfil, y recuperar() solo
 * vuelve a compilar, sin cuarentena. Sin esto, el siguiente arranque culparía a la instantánea de la build y arrancaría
 * sin listas. Si el proceso muere de verdad (un fallo del analizador), el bloqueo de cierre no llega a correr y el
 * marcador sigue señalando a las sospechosas.
 */
function vigilarCierre() {
  if (cierreVigilado) {
    return;
  }
  cierreVigilado = true;
  try {
    IOUtils.profileBeforeChange.addBlocker("Aegis: Escudos, compilación interrumpida por el cierre", async () => {
      if (marcadorPuesto) {
        const marcador = { ...marcadorPuesto, fase: "interrumpida", faseOriginal: marcadorPuesto.fase };
        await IOUtils.writeJSON(rutaMarcador(), marcador).catch(() => {});
      }
    });
  } catch (e) {
    // Ya se está cerrando: el marcador queda como está (el peor caso es una cuarentena de más, como antes).
    console.warn("Aegis: Escudos, no se ha podido vigilar el cierre", e);
  }
}

/**
 * Quita el marcador al terminar bien. Si otro programa lo tiene abierto (un antivirus, el indexador) y Windows no deja
 * borrarlo, se reintenta y, si aun así no se puede, se sobrescribe con la fase «hecho», que recuperar() ignora: una
 * compilación que ha ido bien nunca deja una lista en cuarentena.
 */
async function quitarMarcador() {
  for (let intento = 0; intento < 3; intento++) {
    try {
      await IOUtils.remove(rutaMarcador(), { ignoreAbsent: true });
      return;
    } catch {
      if (Services.startup.shuttingDown) {
        return;
      }
      await new Promise(listo => lazy.setTimeout(listo, 100));
    }
  }
  try {
    await IOUtils.writeJSON(rutaMarcador(), { fase: "hecho", fecha: Date.now() });
  } catch (e) {
    console.error("Aegis: Escudos, no se ha podido quitar el marcador de compilación", e);
  }
}

/** Una lista como la quiere el motor (AegisEscudosMotor.compilar). */
function entradaDe(l, b) {
  return { id: l.id, datos: b.datos, incluidas: b.incluidas, permisos: l.confianza ? 1 : 0, capa: CAPA[l.grupo] ?? 0 };
}

/**
 * Compila las listas activas y pone el motor nuevo. Devuelve las reglas por lista. `sospechosas` (para el marcador):
 * de serie, las descargadas de la tanda (si no hay ninguna, la tanda es solo la instantánea); false si quien llama ya
 * ha puesto el marcador.
 */
async function compilarYCargar(listas, clave, sospechosas = null) {
  const entrada = [];
  const descargadas = [];
  for (const l of listas) {
    const b = await bytesDe(l);
    if (b) {
      entrada.push(entradaDe(l, b));
      const f = fuente(l);
      if (f.origen == "red") {
        descargadas.push({ id: l.id, sha256: f.sha256, archivos: [] });
      }
    }
  }
  if (!entrada.length) {
    throw new Error("no hay ninguna lista disponible");
  }
  // Antes de compilar: el motor se queda con los búferes de las listas.
  const pares = AegisEscudosEtp.pares(entrada);
  const trabajo = async () => {
    const r = await AegisEscudosMotor.compilar(entrada);
    await primeraVentana();
    if (!(await AegisEscudosMotor.cargar(r.dat))) {
      throw new Error("el motor no ha aceptado las listas recién compiladas");
    }
    await IOUtils.write(rutaDat(), r.dat, { tmpPath: rutaDat() + ".tmp" });
    return r.reglas;
  };
  const reglas =
    sospechosas === false ? await trabajo() : await conMarcador("compilar", sospechosas ?? descargadas, trabajo);
  AegisEscudosEtp.usar(pares);
  await IOUtils.writeJSON(rutaClave(), { clave, fecha: Date.now(), reglas, pares }, { tmpPath: rutaClave() + ".tmp" });
  claveCargada = clave;
  return reglas;
}

/**
 * Cargar el motor ocupa el hilo principal unas décimas de segundo (deserializar el .dat): al arrancar se hace cuando la
 * primera ventana ya está pintada (browser-delayed-startup-finished), para no retrasar la interfaz. Mientras tanto, las
 * peticiones de las webs esperan (red.sys.mjs, como mucho ESPERA_MAXIMA). Leer el .dat o compilar no espera: va fuera
 * del hilo principal.
 */
let ventanaLista = null;
function primeraVentana() {
  ventanaLista ??= new Promise(resolver => {
    const lista = Services.wm.getMostRecentWindow("navigator:browser")?.gBrowserInit?.delayedStartupFinished;
    if (lista) {
      resolver();
      return;
    }
    const observador = () => {
      Services.obs.removeObserver(observador, "browser-delayed-startup-finished");
      resolver();
    };
    Services.obs.addObserver(observador, "browser-delayed-startup-finished");
  });
  return ventanaLista;
}

/**
 * Una compilación anterior murió a medias (el marcador sigue ahí): sus listas sospechosas pasan a cuarentena, vuelven
 * las versiones anteriores y se apunta la incidencia. Idempotente: el marcador se borra al final.
 */
async function recuperar() {
  const m = await leerJson(rutaMarcador());
  if (!m) {
    return;
  }
  // La compilación terminó bien pero el marcador no se pudo borrar (quitarMarcador): nada que hacer.
  if (m.fase == "hecho") {
    await IOUtils.remove(rutaMarcador(), { ignoreAbsent: true }).catch(() => {});
    return;
  }
  // Se cerró Aegis con normalidad en mitad de la compilación (vigilarCierre): nadie tiene la culpa. Sin cuarentena ni
  // incidencia, pero lo que esa tanda dejó a medias en el perfil se deshace igual (abajo) y se compila otra vez.
  const interrumpida = m.fase == "interrumpida";
  const fase = interrumpida ? m.faseOriginal : m.fase;
  const ahora = Date.now();
  const sospechosas = Array.isArray(m.sospechosas) ? m.sospechosas : [];
  estado.cuarentena ??= {};
  for (const s of sospechosas) {
    if (!interrumpida && typeof s?.sha256 == "string") {
      estado.cuarentena[s.sha256] = { id: s.id, fecha: ahora, fase };
    }
    // Lo que esa tanda cambió en el perfil vuelve atrás: fuera los .nuevo y vuelven los .anterior.
    for (const a of s?.archivos ?? []) {
      if (!NOMBRE_ARCHIVO.test(a)) {
        continue;
      }
      const txt = PathUtils.join(dirListas(), `${a}.txt`);
      await IOUtils.remove(`${txt.slice(0, -4)}.nuevo`, { ignoreAbsent: true });
      // Solo la compilación de la tanda llega a cambiar los .txt (las pruebas de cada lista van antes).
      if (fase == "compilar") {
        if (await IOUtils.exists(`${txt}.anterior`)) {
          await IOUtils.move(`${txt}.anterior`, txt);
        } else {
          await IOUtils.remove(txt, { ignoreAbsent: true });
        }
      }
    }
    // Y lo que dice listas.json tiene que casar con lo que hay en disco; si no, esa lista vuelve a la instantánea.
    const meta = estado.listas[s?.id];
    if (meta?.sha256) {
      let bien = false;
      try {
        bien = sha256(await IOUtils.read(PathUtils.join(dirListas(), `${s.id}.txt`))) == meta.sha256;
      } catch {}
      if (!bien || estado.cuarentena[meta.sha256]) {
        delete meta.sha256;
        delete meta.fecha;
      }
    }
  }
  // El .dat pudo quedar a medio cambiar: sin su clave, se recompila con lo que ha quedado.
  await IOUtils.remove(rutaClave(), { ignoreAbsent: true });
  if (interrumpida) {
    await guardarEstado();
    await IOUtils.remove(rutaMarcador(), { ignoreAbsent: true });
    return;
  }
  // Sin listas descargadas en la tanda, lo que murió fue la instantánea: no se vuelve a compilar con esta build.
  if (!sospechosas.length && m.fase == "compilar") {
    estado.instantaneaRota = m.compilacion;
  }
  const claves = Object.entries(estado.cuarentena).sort((a, b) => b[1].fecha - a[1].fecha);
  estado.cuarentena = Object.fromEntries(claves.slice(0, MAX_CUARENTENA));
  estado.incidencias = [
    ...(estado.incidencias ?? []),
    {
      fecha: ahora,
      fase: m.fase,
      listas: sospechosas.map(s => s?.id).filter(Boolean),
      instantanea: !sospechosas.length && m.fase == "compilar",
    },
  ].slice(-MAX_INCIDENCIAS);
  // El .dat pudo quedar a medio cambiar: sin su clave, se recompila con lo que ha quedado.
  await IOUtils.remove(rutaClave(), { ignoreAbsent: true });
  await guardarEstado();
  await IOUtils.remove(rutaMarcador(), { ignoreAbsent: true });
  console.error(
    `Aegis: Escudos, la compilación anterior de las listas no terminó (${m.fase}); en cuarentena: ` +
      (sospechosas.map(s => s?.id).join(", ") || "la instantánea de esta build")
  );
}

/** Pone en marcha el motor con las listas que tocan: del .dat guardado si casa, o compilando. */
async function preparar() {
  await cargarCatalogo();
  await cargarInstantanea();
  estado = (await leerJson(rutaEstado())) ?? { listas: {} };
  estado.listas ??= {};
  await recuperar();
  const listas = activas();
  const clave = await claveDe(listas);
  if (clave == claveCargada && AegisEscudosMotor.listo) {
    return;
  }
  const guardada = await leerJson(rutaClave());
  // Sin «pares» (motor.json de antes de escudos/etp.sys.mjs) se recompila una vez para sacarlos.
  if (guardada?.clave == clave && guardada.pares) {
    try {
      const dat = await IOUtils.read(rutaDat());
      await primeraVentana();
      if (await AegisEscudosMotor.cargar(dat)) {
        AegisEscudosEtp.usar(guardada.pares);
        claveCargada = clave;
        return;
      }
    } catch (e) {
      console.warn("Aegis: Escudos, no se ha podido leer motor.dat; se recompila", e);
    }
  }
  await compilarYCargar(listas, clave);
}

/** Una tarea detrás de otra. Devuelve lo que devuelva fn (o undefined si falla, que se apunta en la consola). */
function trabajar(fn) {
  const tarea = cola.then(fn).catch(e => console.error("Aegis: Escudos, listas", e));
  cola = tarea.finally(() => AegisEscudosRed.cargando(false));
  return tarea;
}

// ── Actualización ────────────────────────────────────────────────────────────────────────────────────────────────

/** Con permiso para pedir listas: la bienvenida aceptada con «Listas de protección» y sin apagarlo en Escudos. */
function conPermiso() {
  return (
    Services.prefs.getBoolPref(PREF_ACEPTADAS, false) &&
    Services.prefs.getBoolPref(PREF_GRUPO_LISTAS, false) &&
    Services.prefs.getBoolPref(PREF_ACTUALIZAR, true)
  );
}

/**
 * ¿Se puede pedir ahora? `aMano`: «Actualizar ahora» de Ajustes, que solo necesita el permiso de Conexiones (no la
 * actualización automática).
 */
function puedeConectar(aMano = false) {
  const permiso = aMano
    ? Services.prefs.getBoolPref(PREF_ACEPTADAS, false) && Services.prefs.getBoolPref(PREF_GRUPO_LISTAS, false)
    : conPermiso();
  return permiso && !Services.io.offline;
}

/** Cada cuánto toca pedir una lista: su «! Expires», al menos un día y como mucho el intervalo (de serie, 4 días). */
function vigencia(l) {
  const f = fuente(l);
  const horas = f?.datos?.expira_horas ?? f?.datos?.expiraHoras ?? 24 * 4;
  const maximo = Math.max(1, Services.prefs.getIntPref(PREF_INTERVALO, 4)) * DIA;
  return Math.min(maximo, Math.max(DIA, horas * 3600 * 1000));
}

function caducada(l, ahora = Date.now()) {
  const f = fuente(l);
  if (!f) {
    return true;
  }
  const comprobada = estado.listas[l.id]?.comprobada ?? 0;
  // Un pequeño margen: el temporizador diario vence casi a la misma hora cada día.
  return ahora - Math.max(f.fecha, comprobada) >= vigencia(l) - 3600 * 1000;
}

/** Reglas de un texto (líneas que no son comentarios, cabeceras ni vacías), sin partirlo en un array. */
function contarReglas(texto) {
  let n = 0;
  let i = 0;
  while (i < texto.length) {
    let fin = texto.indexOf("\n", i);
    if (fin < 0) {
      fin = texto.length;
    }
    const c = texto.charCodeAt(i);
    // 0x21 «!», 0x5b «[», 0x0a/0x0d línea vacía
    if (fin > i && c != 0x21 && c != 0x5b && c != 0x0d) {
      n++;
    }
    i = fin + 1;
  }
  return n;
}

/**
 * Comprueba una lista recién descargada. Las listas no van firmadas: se mira que sea la que se espera y que no haya
 * perdido de golpe la mitad de sus reglas. Devuelve {texto, reglas, expiraHoras, incluye} o lanza.
 */
function comprobar(l, bytes, anterior) {
  const [minimo, maximo] = l.tamano;
  if (bytes.byteLength < minimo || bytes.byteLength > maximo) {
    throw new Error(`${bytes.byteLength} bytes, fuera de [${minimo}, ${maximo}]`);
  }
  const texto = decodificador.decode(bytes);
  const cabecera = texto.slice(0, 4096);
  const titulo = TITULO.exec(cabecera)?.[1];
  if (!titulo?.startsWith(l.titulo)) {
    throw new Error(`el título no es el esperado (${titulo ?? "sin título"})`);
  }
  const reglas = contarReglas(texto);
  if (anterior && reglas < anterior / 2) {
    throw new Error(`${reglas} reglas, menos de la mitad que antes (${anterior})`);
  }
  const e = EXPIRES.exec(cabecera);
  const expiraHoras = e ? Number(e[1]) * (e[2].toLowerCase().startsWith("d") ? 24 : 1) : null;
  const incluye = [...new Set([...texto.matchAll(INCLUDE)].map(m => m[1]))].filter(
    n => NOMBRE_INCLUIDO.test(n) && !n.includes("..")
  );
  return { reglas, expiraHoras, incluye };
}

/** Redirecciones que se siguen como mucho (todas a https). */
const MAX_SALTOS = 5;

/**
 * Una petición a un autor, con un canal de red propio (no fetch) para decidir cada redirección antes de que se pida:
 * solo se sigue si va a https, y como mucho MAX_SALTOS; una a http se corta sin conectar con ella. Sin cookies
 * (LOAD_ANONYMOUS), sin Referer (principal de sistema), sin caché, con un Accept-Language fijo y con tope de tiempo
 * (un solo temporizador mientras dura la petición).
 *
 * @returns {Promise<{estado: number, cabecera: (nombre: string) => string | null, bytes: ArrayBuffer | null}>}
 */
function pedir(url, cabeceras = {}) {
  if (!url.startsWith("https://")) {
    return Promise.reject(new Error("solo https"));
  }
  return new Promise((resolver, rechazar) => {
    const canal = lazy.NetUtil.newChannel({
      uri: url,
      loadUsingSystemPrincipal: true,
      contentPolicyType: Ci.nsIContentPolicy.TYPE_OTHER,
    }).QueryInterface(Ci.nsIHttpChannel);
    canal.loadFlags |= Ci.nsIRequest.LOAD_ANONYMOUS | Ci.nsIRequest.LOAD_BYPASS_CACHE | Ci.nsIRequest.INHIBIT_CACHING;
    canal.redirectionLimit = MAX_SALTOS;
    canal.setRequestHeader("Accept-Language", ACCEPT_LANGUAGE, false);
    for (const [nombre, valor] of Object.entries(cabeceras)) {
      canal.setRequestHeader(nombre, valor, false);
    }
    let fueraDeHttps = false;
    let saltos = 0;
    canal.notificationCallbacks = {
      QueryInterface: ChromeUtils.generateQI(["nsIInterfaceRequestor", "nsIChannelEventSink"]),
      getInterface(iid) {
        return this.QueryInterface(iid);
      },
      asyncOnChannelRedirect(viejo, nuevo, banderas, respuesta) {
        if (!nuevo.URI.schemeIs("https")) {
          fueraDeHttps = true;
          respuesta.onRedirectVerifyCallback(Cr.NS_ERROR_ABORT);
          return;
        }
        // El tope se cuenta aquí: redirectionLimit no se respeta en todos los casos (un bucle llegaba a 20 saltos).
        if (++saltos > MAX_SALTOS) {
          respuesta.onRedirectVerifyCallback(Cr.NS_ERROR_REDIRECT_LOOP);
          return;
        }
        // Las cabeceras puestas a mano no pasan al canal nuevo: el mismo Accept-Language fijo también en él.
        try {
          nuevo.QueryInterface(Ci.nsIHttpChannel).setRequestHeader("Accept-Language", ACCEPT_LANGUAGE, false);
        } catch {}
        respuesta.onRedirectVerifyCallback(Cr.NS_OK);
      },
    };
    const tope = lazy.setTimeout(() => canal.cancel(Cr.NS_ERROR_NET_TIMEOUT), ESPERA_RED);
    lazy.NetUtil.asyncFetch(canal, (flujo, resultado, peticion) => {
      lazy.clearTimeout(tope);
      try {
        if (fueraDeHttps) {
          throw new Error("redirigida fuera de https");
        }
        if (!Components.isSuccessCode(resultado)) {
          throw new Error(`error de red 0x${(resultado >>> 0).toString(16)}`);
        }
        const http = peticion.QueryInterface(Ci.nsIHttpChannel);
        if (!http.URI.schemeIs("https")) {
          throw new Error("redirigida fuera de https");
        }
        const estado = http.responseStatus;
        const cabecera = nombre => {
          try {
            return http.getResponseHeader(nombre);
          } catch {
            return null;
          }
        };
        const bytes = estado == 200 ? lazy.NetUtil.readInputStream(flujo, flujo.available()) : null;
        resolver({ estado, cabecera, bytes });
      } catch (e) {
        rechazar(e);
      } finally {
        try {
          flujo?.close();
        } catch {}
      }
    });
  });
}

/**
 * Pide una lista a su autor (primero su URL principal; si falla, las demás). Devuelve null si no ha cambiado o
 * {bytes, incluidas, meta} si hay versión nueva ya comprobada. Lanza si ninguna URL ha servido.
 */
async function descargar(l) {
  const previo = estado.listas[l.id];
  const anterior = fuente(l)?.reglas;
  let ultimo = null;
  for (const url of l.urls) {
    try {
      const cabeceras = {};
      if (previo?.url == url && previo.etag) {
        cabeceras["If-None-Match"] = previo.etag;
      }
      if (previo?.url == url && previo.modificada) {
        cabeceras["If-Modified-Since"] = previo.modificada;
      }
      const { estado: codigo, cabecera, bytes } = await pedir(url, cabeceras);
      if (codigo == 304) {
        return null;
      }
      if (codigo != 200) {
        throw new Error(`HTTP ${codigo}`);
      }
      const meta = comprobar(l, bytes, anterior);
      const incluidas = {};
      for (const nombre of meta.incluye) {
        const sub = await pedir(url.slice(0, url.lastIndexOf("/") + 1) + nombre);
        if (sub.estado != 200) {
          throw new Error(`${nombre}: HTTP ${sub.estado}`);
        }
        incluidas[nombre] = sub.bytes;
      }
      return {
        bytes,
        incluidas,
        meta: {
          url,
          etag: cabecera("ETag"),
          modificada: cabecera("Last-Modified"),
          reglas: meta.reglas,
          expiraHoras: meta.expiraHoras,
        },
      };
    } catch (e) {
      ultimo = e;
      console.warn(`Aegis: Escudos, ${l.id}: ${url} no ha servido (${e.message ?? e})`);
    }
  }
  throw ultimo ?? new Error("sin URL");
}

function sha256(bytes) {
  const h = Cc["@mozilla.org/security/hash;1"].createInstance(Ci.nsICryptoHash);
  h.init(Ci.nsICryptoHash.SHA256);
  const datos = new Uint8Array(bytes);
  h.update(datos, datos.length);
  return Array.from(h.finish(false), c => c.charCodeAt(0).toString(16).padStart(2, "0")).join("");
}

async function guardarEstado() {
  await IOUtils.makeDirectory(dir(), { ignoreExisting: true });
  await IOUtils.writeJSON(rutaEstado(), estado, { tmpPath: rutaEstado() + ".tmp" });
}

/**
 * Pone en uso las listas recién descargadas (`nuevas`: [[lista del catálogo, {bytes, incluidas, meta, sha256}]]):
 * 1. cada una se compila antes sola, con su propio marcador: si una hace caer el navegador, el próximo arranque sabe
 *    cuál fue y solo esa queda en cuarentena; si falla sin caer, se descarta solo esa;
 * 2. las que pasan van a archivos aparte (.nuevo), pasan a ser las .txt (las de antes quedan como .anterior) y se
 *    compilan y cargan todas juntas, con el marcador de la tanda puesto desde antes de tocar ningún archivo;
 * 3. si eso falla, vuelven las anteriores.
 */
async function incorporar(nuevas, resumen) {
  const t0 = ChromeUtils.now();
  const buenas = [];
  for (const [l, d] of nuevas) {
    if (estado.cuarentena?.[d.sha256]) {
      resumen.fallos[l.id] = "en cuarentena";
      continue;
    }
    const copia = {
      datos: d.bytes.slice(0),
      incluidas: Object.fromEntries(Object.entries(d.incluidas).map(([n, b]) => [n, b.slice(0)])),
    };
    try {
      await conMarcador("probar", [{ id: l.id, sha256: d.sha256, archivos: [] }], () =>
        AegisEscudosMotor.compilar([entradaDe(l, copia)], { probar: true })
      );
      buenas.push([l, d]);
    } catch (e) {
      console.error(`Aegis: Escudos, ${l.id}: la versión nueva no compila; se queda la anterior`, e);
      resumen.fallos[l.id] = `no compila: ${e.message ?? e}`;
    }
  }
  resumen.probarMs = ChromeUtils.now() - t0;
  if (!buenas.length) {
    return;
  }
  // Primero a archivos aparte; solo si el motor compila y carga con ellas pasan a ser las buenas.
  await IOUtils.makeDirectory(dirListas(), { ignoreExisting: true });
  const previo = JSON.parse(JSON.stringify(estado.listas));
  const archivos = [];
  const sospechosas = [];
  for (const [l, d] of buenas) {
    const nombres = {};
    const propios = [l.id];
    await IOUtils.write(PathUtils.join(dirListas(), `${l.id}.nuevo`), new Uint8Array(d.bytes));
    for (const [nombre, b] of Object.entries(d.incluidas)) {
      const archivo = `${l.id}--${nombre.replaceAll("/", "--")}`;
      await IOUtils.write(PathUtils.join(dirListas(), `${archivo}.nuevo`), new Uint8Array(b));
      propios.push(archivo);
      nombres[nombre] = `${archivo}.txt`;
    }
    archivos.push(...propios);
    sospechosas.push({ id: l.id, sha256: d.sha256, archivos: propios });
    estado.listas[l.id] = {
      ...d.meta,
      fecha: Date.now(),
      comprobada: Date.now(),
      sha256: d.sha256,
      tamano: d.bytes.byteLength,
      incluidas: nombres,
    };
  }
  const t1 = ChromeUtils.now();
  await conMarcador("compilar", sospechosas, async () => {
    // Los .nuevo pasan a .txt; si algo falla al compilar, se vuelve a los anteriores.
    const respaldo = [];
    try {
      for (const a of archivos) {
        const txt = PathUtils.join(dirListas(), `${a}.txt`);
        if (await IOUtils.exists(txt)) {
          await IOUtils.move(txt, `${txt}.anterior`);
          respaldo.push(txt);
        }
        await IOUtils.move(PathUtils.join(dirListas(), `${a}.nuevo`), txt);
      }
      const listas = activas();
      await compilarYCargar(listas, await claveDe(listas), false);
      for (const txt of respaldo) {
        await IOUtils.remove(`${txt}.anterior`, { ignoreAbsent: true });
      }
      resumen.nuevas = buenas.map(([l]) => l.id);
    } catch (e) {
      console.error("Aegis: Escudos, las listas nuevas no compilan; se quedan las anteriores", e);
      for (const a of archivos) {
        const txt = PathUtils.join(dirListas(), `${a}.txt`);
        await IOUtils.remove(txt, { ignoreAbsent: true });
        await IOUtils.remove(PathUtils.join(dirListas(), `${a}.nuevo`), { ignoreAbsent: true });
        if (respaldo.includes(txt)) {
          await IOUtils.move(`${txt}.anterior`, txt);
        }
      }
      estado.listas = previo;
      for (const [l] of buenas) {
        estado.listas[l.id] = { ...(estado.listas[l.id] ?? {}), comprobada: Date.now() };
        resumen.fallos[l.id] = `no compila: ${e.message ?? e}`;
      }
    }
  });
  resumen.tandaMs = ChromeUtils.now() - t1;
}

/**
 * Revisa las listas activas caducadas (o todas, con `todas`) y, si alguna ha cambiado, recompila. Si la versión
 * nueva no pasa las comprobaciones o no compila, se queda la anterior. Devuelve un resumen para las pruebas.
 */
async function revisar({ todas = false, aMano = false } = {}) {
  const resumen = { revisadas: [], nuevas: [], iguales: [], fallos: {} };
  if (!puedeConectar(aMano)) {
    resumen.sinPermiso = true;
    return resumen;
  }
  await cargarCatalogo();
  await cargarInstantanea();
  const ahora = Date.now();
  const nuevas = [];
  for (const l of activas()) {
    if (!todas && !caducada(l, ahora)) {
      continue;
    }
    resumen.revisadas.push(l.id);
    try {
      const d = await descargar(l);
      estado.listas[l.id] = { ...(estado.listas[l.id] ?? {}), comprobada: Date.now() };
      if (d) {
        d.sha256 = sha256(d.bytes);
      }
      if (d && estado.cuarentena?.[d.sha256]) {
        // El mismo texto que ya tumbó una compilación: no se acepta. Se apunta para la petición condicional (así no se
        // vuelve a bajar entero hasta que su autor lo cambie).
        const { url, etag, modificada } = d.meta;
        Object.assign(estado.listas[l.id], { url, etag, modificada });
        resumen.fallos[l.id] = "en cuarentena";
      } else if (d && d.sha256 != fuente(l)?.sha256) {
        nuevas.push([l, d]);
      } else {
        // 304, o el mismo texto que ya se usa (p. ej. el de la instantánea): solo se apunta para la próxima petición
        // condicional. Sin sha256, la fuente sigue siendo la de antes.
        if (d) {
          const { url, etag, modificada } = d.meta;
          Object.assign(estado.listas[l.id], { url, etag, modificada });
        }
        resumen.iguales.push(l.id);
      }
    } catch (e) {
      resumen.fallos[l.id] = String(e.message ?? e);
    }
    // Si el usuario retira el permiso a mitad, no se pide nada más.
    if (!puedeConectar(aMano)) {
      break;
    }
  }
  if (nuevas.length) {
    await incorporar(nuevas, resumen);
  }
  await guardarEstado();
  return resumen;
}

/** El temporizador compartido de Firefox llama aquí (como mucho una vez al día). */
const temporizador = {
  notify() {
    if (puedeConectar()) {
      trabajar(() => revisar());
    }
  },
};

function ponerTemporizador() {
  const quiere = conPermiso();
  let gestor;
  try {
    gestor = Cc["@mozilla.org/updates/timer-manager;1"].getService(Ci.nsIUpdateTimerManager);
  } catch (e) {
    console.error("Aegis: Escudos, sin el temporizador de actualizaciones", e);
    return;
  }
  if (quiere && !temporizadorPuesto) {
    gestor.registerTimer(TEMPORIZADOR, temporizador, 24 * 3600);
    temporizadorPuesto = true;
  } else if (!quiere && temporizadorPuesto) {
    gestor.unregisterTimer(TEMPORIZADOR);
    temporizadorPuesto = false;
  }
}

function cambioDeListas() {
  AegisEscudosRed.cargando(true);
  trabajar(preparar);
}

export const AegisEscudosListas = {
  /** Una vez por arranque (AegisArranque): red, motor y temporizador. Idempotente. */
  inicio() {
    if (iniciado) {
      return;
    }
    iniciado = true;
    // Interruptor general del bloqueador propio (se lee al arrancar): con false, solo bloquea la protección de ETP.
    if (!Services.prefs.getBoolPref(PREF_MOTOR, true)) {
      return;
    }
    AegisEscudosRed.inicio();
    if (!AegisEscudosMotor.disponible()) {
      console.error("Aegis: Escudos, esta build no trae el motor del bloqueador: solo bloquea la protección de ETP");
      return;
    }
    cambioDeListas();
    // Cosmético y scriptlets en las páginas (escudos/cosmetico.sys.mjs). Si fallara al cargar, la red sigue.
    try {
      ChromeUtils.importESModule(new URL("cosmetico.sys.mjs", import.meta.url).href).AegisEscudosCosmetico.inicio();
    } catch (e) {
      console.error("Aegis: Escudos, cosmético", e);
    }
    for (const p of PREFS_VIGILADAS) {
      Services.prefs.addObserver(p, cambioDeListas);
    }
    Services.obs.addObserver(cambioDeListas, "intl:app-locales-changed");
    Services.prefs.addObserver(PREF_ACEPTADAS, ponerTemporizador);
    Services.prefs.addObserver(PREF_GRUPO_LISTAS, ponerTemporizador);
    Services.prefs.addObserver(PREF_ACTUALIZAR, ponerTemporizador);
    ponerTemporizador();
  },

  /**
   * «Actualizar ahora» (Ajustes › Escudos): todas las activas, sin mirar su edad. Basta con el permiso de Conexiones,
   * aunque la actualización automática esté apagada.
   */
  actualizarAhora() {
    return trabajar(() => revisar({ todas: true, aMano: true }));
  },

  /** Para las pruebas y Ajustes: qué listas hay, de dónde salen y cuándo. */
  async estado() {
    await cola;
    await cargarCatalogo();
    await cargarInstantanea();
    const listas = activas();
    return {
      listo: AegisEscudosMotor.listo,
      puedeConectar: puedeConectar(),
      temporizador: temporizadorPuesto,
      instantanea: instantanea.fecha ? new Date(instantanea.fecha).toISOString() : null,
      listas: listas.map(l => {
        const f = fuente(l);
        return {
          id: l.id,
          grupo: l.grupo,
          origen: f?.origen ?? null,
          fecha: f ? new Date(f.fecha).toISOString() : null,
          reglas: f?.reglas ?? null,
          caducada: caducada(l),
        };
      }),
      motor: AegisEscudosMotor.medidas(),
      // Compilaciones que murieron a medias (las más recientes al final) y textos de listas en cuarentena: para que
      // el panel o Ajustes lo puedan decir.
      incidencias: estado.incidencias ?? [],
      cuarentena: Object.entries(estado.cuarentena ?? {}).map(([sha256, c]) => ({ sha256, ...c })),
      instantaneaRota: estado.instantaneaRota == Services.appinfo.appBuildID,
    };
  },

  /** Para las pruebas: revisión inmediata de las caducadas (lo mismo que hace el temporizador). */
  revisarAhora() {
    return trabajar(() => revisar());
  },

  _activas: () => activas().map(l => l.id),
  /**
   * Para las pruebas (tools/pruebas/escudos_cierres.py): pone cada texto de `textos` ({id: texto}) como la versión
   * recién descargada de esa lista, igual que si llegara de su autor (pruebas, marcadores, compilación). Devuelve el
   * resumen de la revisión.
   */
  _incorporar(textos) {
    return trabajar(async () => {
      await cargarCatalogo();
      await cargarInstantanea();
      const nuevas = [];
      for (const [id, texto] of Object.entries(textos)) {
        const l = catalogo.find(x => x.id == id);
        const bytes = new TextEncoder().encode(texto).buffer;
        nuevas.push([l, { bytes, incluidas: {}, sha256: sha256(bytes), meta: { reglas: contarReglas(texto) } }]);
      }
      const resumen = { revisadas: Object.keys(textos), nuevas: [], iguales: [], fallos: {} };
      await incorporar(nuevas, resumen);
      await guardarEstado();
      return resumen;
    });
  },
  /** Para las pruebas: una petición a un autor, tal cual (redirecciones, cabeceras). */
  _pedir: pedir,
};
