/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · Escudos: el motor del bloqueador. adblock-rust 0.12.1 (de Brave, MPL-2.0), en su fork etp_engine, el mismo
 * crate que Firefox ya compila en gkrust para su ContentClassifierService, tras el servicio XPCOM @aegis/escudos/motor;1
 * (escudos/motor-nativo/, enlazado en gkrust por el parche 0600-escudos).
 *
 * - Proceso padre, hilo principal: decide cada petición de red (red.sys.mjs) con una llamada síncrona de unos µs y da
 *   el cosmético y los scriptlets de cada documento (cosmetico.sys.mjs).
 * - Capas: un motor por grupo de listas (0 anuncios y rastreo; 1, 2 y 3 los grupos de molestias), para permitir un
 *   grupo en un sitio sin recompilar. La red solo mira la capa 0.
 * - Recursos neutros y scriptlets (recursos.json, de `aegis.py recursos-escudos`, dentro de la build): se cargan con
 *   cada .dat; nunca se descargan.
 * - Cargar el .dat (deserializar) y compilar las listas van en un hilo de fondo del motor: el hilo principal solo
 *   cambia el motor en uso cuando el nuevo está listo. Antes de compilar, un ChromeWorker (motor-worker.js) que se
 *   cierra al terminar preprocesa las listas y las reparte por capas.
 *
 * Sin temporizadores ni trabajo en reposo: todo lo hace quien llama (cargar, compilar) o una petición de red.
 *
 * API que usa el resto de Escudos:
 * - `listo`, `version` (cambia con cada motor puesto en uso; 0 sin motor), `esperarListo(ms)` → Promise<boolean>,
 *   `capas()` → máscara de capas cargadas, `disponible()`, `info()`, `descargar()`, `medidas()`.
 * - `info()` → {motor, contenedor, firefox, compilacion, sha256}: `sha256` identifica el motor (no es un hash del
 *   código): cambia con cada build de Aegis, así un .dat guardado con otro motor se recompila en vez de cargarse.
 * - `compilar(listas, {probar})`: cada lista lleva `capa` (0 anuncios y rastreo; 1 avisos de cookies; 2 ventanas y
 *   banners; 3 avisos anti-bloqueador). Las reglas de red de todas van a la capa 0; las excepciones del cosmético
 *   (#@#, $generichide, $elemhide) valen en todas (lo hace motor-worker.js, función repartir()). Con `probar`, solo
 *   comprueba que compilan (listas.sys.mjs prueba así cada lista nueva antes de la tanda).
 * - `cargar(dat)`: pone el motor en uso con los recursos de recursos.json (formato Resource de adblock-rust) y
 *   notifica TEMA_MOTOR.
 * - `red(url, origen, tipo)` → RESULTADO; con REDIRIGIR, `salida()` es el recurso «data:…;base64,…» (léelo antes de
 *   otra llamada al motor); con REESCRIBIR, la URL nueva.
 * - `cosmetico(url, mascara)` → {especificos: string[], capas: number[], filtrados: {capa: string[]}, procedurales:
 *   string[] (JSON de adblock-rust), excepciones: string[], script: string, generichide, elemhide} o null. `capas`:
 *   las capas cuya hoja genérica vale tal cual; `filtrados`: la genérica de una capa sin los selectores exceptuados
 *   en el sitio; `especificos`: el resto de selectores a ocultar (sin los de la hoja genérica). `$elemhide` de un sitio
 *   entero llega como el selector centinela «aegis-elemhide» (motor-worker.js) y aquí sale como elemhide = true.
 * - `genericos(clases, ids, excepciones, mascara)` → string[] (hidden_class_id_selectors de las capas de la máscara).
 * - `genericosCapa(capa)` → string[]: la hoja genérica de la capa (lo que da una dirección sin reglas propias).
 */

const CONTRATO = "@aegis/escudos/motor;1";
const URL_WORKER = new URL("motor-worker.js", import.meta.url).href;
const URL_RECURSOS = new URL("recursos.json", import.meta.url).href;
/** Se notifica (sin sujeto) cada vez que hay un motor nuevo en uso: cosmetico.sys.mjs rehace la hoja genérica. */
export const TEMA_MOTOR = "aegis-escudos-motor";

/** El servicio nativo (null si esta build no lo trae). */
let servicio;
function nativo() {
  if (servicio === undefined) {
    servicio = CONTRATO in Cc ? Cc[CONTRATO].getService(Ci.nsIAegisEscudosMotor) : null;
  }
  return servicio;
}

/** Hay un motor en uso (se guarda aquí para no cruzar a XPCOM en cada petición). */
let enUso = false;
/** Cuántos motores se han puesto en uso (cambia con cada carga: la hoja genérica va con esta versión). */
let version = 0;
/** Quien espera a que haya motor (el cosmético del primer documento al arrancar). */
let esperando = [];
/** Lo último medido: para las pruebas y el informe de rendimiento. */
const medidas = {
  cargarMs: 0,
  cambiarMs: 0,
  recursosMs: 0,
  recursos: false,
  datBytes: 0,
  memoriaBytes: 0,
  preprocesarMs: 0,
  compilarMs: 0,
  probar: 0,
  probarMs: 0,
  fallosInstancia: 0,
  cosmeticos: 0,
  cosmeticoMs: 0,
  genericos: 0,
  genericosMs: 0,
};

/** Una llamada del motor que termina en otro hilo, como promesa: resuelve con el JSON de lo medido. */
function trabajo(fn) {
  return new Promise((resolver, rechazar) =>
    fn((resultado, detalle) => {
      if (Components.isSuccessCode(resultado)) {
        resolver(JSON.parse(detalle || "{}"));
      } else {
        rechazar(new Error(detalle || `error ${resultado}`));
      }
    })
  );
}

/** Ejecuta el worker que preprocesa las listas y lo cierra. */
function preprocesar(listas) {
  const transferir = [];
  for (const l of listas) {
    transferir.push(l.datos, ...Object.values(l.incluidas ?? {}));
  }
  return new Promise((resolver, rechazar) => {
    const w = new ChromeWorker(URL_WORKER);
    w.onmessage = e => {
      w.terminate();
      if (e.data?.error) {
        rechazar(new Error(e.data.error));
      } else {
        resolver(e.data);
      }
    };
    w.onerror = e => {
      w.terminate();
      rechazar(new Error(e.message || "error en motor-worker.js"));
    };
    w.postMessage({ listas }, transferir);
  });
}

export const RESULTADO = Object.freeze({ PASA: 0, BLOQUEAR: 1, REDIRIGIR: 2, REESCRIBIR: 3 });

export const AegisEscudosMotor = {
  RESULTADO,

  /** ¿Trae esta build el motor? */
  disponible() {
    return nativo() != null;
  },

  get listo() {
    return enUso;
  },

  /** Qué motor es (ver arriba, `info()`). */
  async info() {
    const m = nativo();
    const contenedor = m?.versionContenedor ?? 0;
    // Las dos: platformBuildID (libxul) no cambia en una build incremental que solo toque Rust o JS; appBuildID
    // (application.ini, fijado por aegis.py build con MOZ_BUILD_DATE) cambia en cada build. Así una build nueva siempre
    // recompila el .dat (unos segundos, una vez), aunque su formato no haya cambiado.
    const compilacion = `${Services.appinfo.platformBuildID}-${Services.appinfo.appBuildID}`;
    return {
      motor: "nativo",
      contenedor,
      firefox: Services.appinfo.platformVersion,
      compilacion,
      sha256: `nativo-${compilacion}-${contenedor}`,
    };
  },

  /**
   * Carga un .dat en un hilo de fondo y, si va bien, lo pone en uso (el anterior se suelta). Si falla, sigue el que
   * había.
   *
   * @param {Uint8Array} dat
   * @returns {Promise<boolean>}
   */
  async cargar(dat) {
    const m = nativo();
    if (!m) {
      return false;
    }
    const t0 = ChromeUtils.now();
    // Recursos neutros y scriptlets: sin ellos el motor bloquea igual (una regla $redirect bloquea), pero los
    // scriptlets no hacen nada.
    let recursos = new Uint8Array(0);
    try {
      recursos = new Uint8Array(await (await fetch(URL_RECURSOS)).arrayBuffer());
    } catch (e) {
      console.error("Aegis: Escudos, sin recursos neutros ni scriptlets", e);
    }
    const t1 = ChromeUtils.now();
    let detalle;
    try {
      detalle = await trabajo(hecho => m.cargar(dat instanceof Uint8Array ? dat : new Uint8Array(dat), recursos, hecho));
    } catch (e) {
      console.error("Aegis: Escudos, el motor no ha podido cargar las listas", e);
      return false;
    }
    enUso = true;
    version++;
    Object.assign(medidas, {
      cargarMs: detalle.fondoMs ?? 0,
      cambiarMs: detalle.cambiarMs ?? 0,
      recursosMs: t1 - t0,
      recursos: !!detalle.recursos,
      datBytes: dat.length ?? dat.byteLength ?? 0,
    });
    for (const resolver of esperando.splice(0)) {
      resolver(true);
    }
    Services.obs.notifyObservers(null, TEMA_MOTOR);
    return true;
  },

  /** Versión del motor en uso (0 si no hay): cambia con cada carga. */
  get version() {
    return enUso ? version : 0;
  },

  /**
   * Espera a que haya un motor en uso, como mucho `ms` (un temporizador de un disparo solo mientras se espera). true
   * si lo hay.
   *
   * @param {number} ms
   * @returns {Promise<boolean>}
   */
  esperarListo(ms) {
    if (enUso) {
      return Promise.resolve(true);
    }
    return new Promise(resolver => {
      const tope = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
      const listo = si => {
        tope.cancel();
        resolver(si);
      };
      esperando.push(listo);
      tope.initWithCallback(
        () => {
          esperando = esperando.filter(f => f !== listo);
          resolver(false);
        },
        ms,
        Ci.nsITimer.TYPE_ONE_SHOT
      );
    });
  },

  /** Capas cargadas (bit c = capa c). */
  capas() {
    return enUso ? servicio.capas : 0;
  },

  /**
   * Cosmético y scriptlets de un documento, juntando las capas de `mascara` (ver motor-nativo/src/lib.rs,
   * cosmetico()). null sin motor.
   *
   * @param {string} url
   * @param {number} mascara
   */
  cosmetico(url, mascara) {
    if (!enUso) {
      return null;
    }
    const t0 = ChromeUtils.now();
    try {
      const json = servicio.cosmetico(url, mascara >>> 0);
      return json ? JSON.parse(json) : null;
    } catch (e) {
      console.error("Aegis: Escudos, cosmético", e);
      return null;
    } finally {
      medidas.cosmeticos++;
      medidas.cosmeticoMs += ChromeUtils.now() - t0;
    }
  },

  /**
   * Selectores genéricos de clase e id para las clases e ids nuevos de un documento. [] sin motor.
   *
   * @param {string[]} clases
   * @param {string[]} ids
   * @param {string[]} excepciones las de cosmetico() para ese documento
   * @param {number} mascara
   * @returns {string[]}
   */
  genericos(clases, ids, excepciones, mascara) {
    if (!enUso) {
      return [];
    }
    const t0 = ChromeUtils.now();
    try {
      return JSON.parse(servicio.genericos(clases, ids, excepciones, mascara >>> 0) || "[]");
    } catch (e) {
      console.error("Aegis: Escudos, clases e ids", e);
      return [];
    } finally {
      medidas.genericos++;
      medidas.genericosMs += ChromeUtils.now() - t0;
    }
  },

  /**
   * La hoja genérica de una capa (lo que ve una web sin reglas propias): array de selectores. [] sin motor.
   *
   * @param {number} capa
   * @returns {string[]}
   */
  genericosCapa(capa) {
    if (!enUso) {
      return [];
    }
    try {
      return JSON.parse(servicio.genericosCapa(capa >>> 0) || "[]");
    } catch (e) {
      console.error("Aegis: Escudos, hoja genérica", e);
      return [];
    }
  },

  /** Quita el motor (las peticiones pasan con la protección contra rastreo de Firefox). */
  descargar() {
    enUso = false;
    nativo()?.descargar();
  },

  /**
   * Decide una petición. Síncrono y barato (unos µs). Sin motor, pasa.
   *
   * @param {string} url
   * @param {string} origen dirección del documento que la pide («https://ejemplo.com»)
   * @param {string} tipo tipo de adblock-rust («script», «image», «subdocument»…)
   * @returns {number} uno de RESULTADO; con REDIRIGIR o REESCRIBIR, el destino lo da salida()
   */
  red(url, origen, tipo) {
    if (!enUso) {
      return RESULTADO.PASA;
    }
    try {
      const r = servicio.red(url, origen, tipo);
      return r > 0 ? r : RESULTADO.PASA;
    } catch (e) {
      return RESULTADO.PASA;
    }
  },

  /** El recurso (data:) o la URL nueva de la última llamada a red() que devolvió REDIRIGIR o REESCRIBIR. */
  salida() {
    return enUso ? servicio.salida : "";
  },

  /**
   * Compila listas a un .dat: las preprocesa un ChromeWorker que se cierra al terminar y las compila el motor en su
   * hilo de fondo, que deja el .dat en un archivo temporal del perfil (se lee y se borra aquí).
   *
   * @param {{id: string, datos: ArrayBuffer, incluidas?: Record<string, ArrayBuffer>, permisos: number,
   *   capa: number}[]} listas
   *   los ArrayBuffer se transfieren al worker (quedan vacíos aquí)
   * @param {{probar?: boolean}} [opciones] con `probar`, solo se comprueba que compilan (y que el motor responde con
   *   ellas): no se lee el .dat, y `dat` es null
   * @returns {Promise<{dat: Uint8Array | null, reglas: Record<string, number>, ms: number}>}
   */
  async compilar(listas, { probar = false } = {}) {
    const m = nativo();
    if (!m) {
      throw new Error("esta build no trae el motor de Escudos");
    }
    const t0 = ChromeUtils.now();
    const partes = await preprocesar(listas);
    const t1 = ChromeUtils.now();
    const dir = PathUtils.join(PathUtils.profileDir, "aegis-escudos");
    const ruta = PathUtils.join(dir, probar ? "motor-probando.tmp" : "motor-compilando.tmp");
    let dat = null;
    try {
      await IOUtils.makeDirectory(dir, { ignoreExisting: true });
      await trabajo(hecho =>
        m.compilar(new Uint8Array(partes.textos), partes.largos, partes.permisos, partes.capas, ruta, hecho)
      );
      if (!probar) {
        dat = await IOUtils.read(ruta);
      }
    } finally {
      await IOUtils.remove(ruta, { ignoreAbsent: true }).catch(() => {});
    }
    const ms = ChromeUtils.now() - t0;
    if (probar) {
      medidas.probar++;
      medidas.probarMs += ms;
    } else {
      medidas.preprocesarMs = t1 - t0;
      medidas.compilarMs = ms;
    }
    return { dat, reglas: partes.reglas, ms };
  },

  /** Para las pruebas y el banco de rendimiento. */
  medidas() {
    return { ...medidas };
  },
};
