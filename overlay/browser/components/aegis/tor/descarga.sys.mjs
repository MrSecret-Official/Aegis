/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · Tor: la descarga aparte y opcional del Tor Expert Bundle de Windows. Solo ocurre cuando el usuario pulsa
 * «Descargar Tor» en Ajustes › Privacidad (docs/CONEXIONES.md); el navegador no lleva tor dentro.
 *
 * - Qué se descarga lo dice tor.json, escrito por `aegis.py tor-fijar` después de comprobar la firma GPG de Tor
 *   Browser: versión, las URL de dist.torproject.org y de archive.torproject.org (cuando esa versión sale de dist),
 *   el tamaño y el sha256. El navegador no necesita gpg: le basta con el sha256 fijado en la build.
 * - La petición va sin cookies ni caché, con un Accept-Language fijo (como la de las actualizaciones). Lleva la IP y el
 *   User-Agent, como cualquier descarga.
 * - Se comprueban el tamaño (durante la descarga) y el sha256 (al final) ANTES de extraer nada. Si no coinciden, no se
 *   escribe ni un byte en el disco.
 * - Gecko no tiene tar: el gzip se descomprime con el conversor de flujos de Necko
 *   (@mozilla.org/streamconv;1?from=gzip&to=uncompressed, el de Content-Encoding) y el tar (ustar, con cabeceras pax
 *   y nombres largos de GNU) se lee aquí. Solo archivos normales de una lista cerrada (ARCHIVOS); un nombre con «..»,
 *   ruta absoluta o caracteres raros hace fallar la extracción entera.
 * - Destino: <perfil local>/aegis-tor/<versión>/ (PathUtils.localProfileDir: en Windows, %LOCALAPPDATA%, fuera de la
 *   carpeta de la aplicación y de la copia itinerante del perfil). Se escribe en <versión>.parcial y se renombra al
 *   terminar: nunca queda una instalación a medias.
 *
 * Sin temporizadores: todo va con los eventos de la descarga y, al descomprimir, cediendo el hilo entre trozos.
 */

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  NetUtil: "resource://gre/modules/NetUtil.sys.mjs",
});

/** Lo que se extrae del paquete (y nada más). Ruta dentro del .tar.gz → obligatorio. */
const ARCHIVOS = new Map([
  ["tor/tor.exe", true],
  ["tor/pluggable_transports/lyrebird.exe", true],
  ["tor/pluggable_transports/pt_config.json", true],
  ["data/geoip", false],
  ["data/geoip6", false],
  // Licencias de lo que va dentro (tor, lyrebird y sus bibliotecas).
  ["docs/tor.txt", false],
  ["docs/lyrebird.txt", false],
  ["docs/openssl.txt", false],
  ["docs/libevent.txt", false],
  ["docs/zlib.txt", false],
]);
/** Nombres aceptables en el tar: segmentos de letras, cifras, «.», «_» y «-», separados por «/». */
const NOMBRE_VALIDO = /^[A-Za-z0-9_-][A-Za-z0-9._-]*(\/[A-Za-z0-9_-][A-Za-z0-9._-]*)*\/?$/;
/** Tope de lo descomprimido (el paquete de 15.0 ocupa unos 87 MB): un gzip malicioso no puede llenar el disco. */
const MAXIMO_DESCOMPRIMIDO = 512 * 1024 * 1024;
const ACCEPT_LANGUAGE = "en-US,en;q=0.5";
/** Cada cuántos bytes se cede el hilo principal al descomprimir. */
const TROZO = 1024 * 1024;

/** Carpeta raíz de Tor en el perfil local. */
export function raiz() {
  return PathUtils.join(PathUtils.localProfileDir, "aegis-tor");
}

/** Carpeta de una versión instalada. */
export function carpetaDe(version) {
  return PathUtils.join(raiz(), version);
}

let fijado = null;
/**
 * tor.json (va en la build, junto a este archivo).
 *
 * @returns {Promise<{version: string, tor: string?, archivo: string, urls: string[], tamano: number, sha256: string}>}
 */
export function datosFijados() {
  fijado ??= fetch(new URL("tor.json", import.meta.url).href)
    .then(r => r.json())
    .then(d => {
      const valido =
        typeof d?.version == "string" &&
        /^[0-9][0-9a-z.]*$/.test(d.version) &&
        Array.isArray(d.urls) &&
        d.urls.length &&
        d.urls.every(u => typeof u == "string" && u.startsWith("https://")) &&
        Number.isSafeInteger(d.tamano) &&
        d.tamano > 0 &&
        /^[0-9a-f]{64}$/.test(d.sha256 ?? "");
      if (!valido) {
        throw new Error("tor.json no es válido");
      }
      return d;
    });
  fijado.catch(() => (fijado = null));
  return fijado;
}

class Cancelada extends Error {
  constructor() {
    super("descarga cancelada");
    this.name = "Cancelada";
  }
}

/**
 * Descarga una URL entera a memoria (sin tocar el disco), sin cookies ni caché. `alAvanzar(bytes)` en cada trozo.
 * Falla si el tamaño no es exactamente `tamano`.
 */
function bajar(url, tamano, alAvanzar, senal) {
  return new Promise((resolve, reject) => {
    const canal = lazy.NetUtil.newChannel({ uri: url, loadUsingSystemPrincipal: true });
    canal.loadFlags |=
      Ci.nsIRequest.LOAD_ANONYMOUS |
      Ci.nsIRequest.LOAD_BYPASS_CACHE |
      Ci.nsIRequest.INHIBIT_CACHING |
      Ci.nsIRequest.INHIBIT_PERSISTENT_CACHING;
    if (canal instanceof Ci.nsIHttpChannel) {
      canal.setRequestHeader("Accept-Language", ACCEPT_LANGUAGE, false);
      canal.referrerInfo = null;
    }
    const trozos = [];
    let total = 0;
    let fallo = null;
    const cortar = motivo => {
      fallo ??= motivo;
      try {
        canal.cancel(Cr.NS_BINDING_ABORTED);
      } catch {}
    };
    senal.cancelar = () => cortar(new Cancelada());
    canal.asyncOpen({
      QueryInterface: ChromeUtils.generateQI(["nsIStreamListener", "nsIRequestObserver"]),
      onStartRequest(peticion) {
        try {
          const http = peticion.QueryInterface(Ci.nsIHttpChannel);
          if (http.responseStatus != 200) {
            cortar(new Error(`HTTP ${http.responseStatus}`));
          } else if (http.contentLength >= 0 && http.contentLength != tamano) {
            cortar(new Error(`tamaño anunciado ${http.contentLength}, esperado ${tamano}`));
          }
        } catch (e) {
          cortar(e);
        }
      },
      onDataAvailable(peticion, flujo, desplazamiento, cuenta) {
        const lector = Cc["@mozilla.org/binaryinputstream;1"].createInstance(Ci.nsIBinaryInputStream);
        lector.setInputStream(flujo);
        const datos = new ArrayBuffer(cuenta);
        lector.readArrayBuffer(cuenta, datos);
        if (fallo) {
          return;
        }
        total += cuenta;
        if (total > tamano) {
          cortar(new Error("el paquete es más grande de lo esperado"));
          return;
        }
        trozos.push(new Uint8Array(datos));
        alAvanzar(total);
      },
      onStopRequest(peticion, estado) {
        if (fallo) {
          reject(fallo);
        } else if (!Components.isSuccessCode(estado)) {
          reject(new Error(`descarga fallida (0x${(estado >>> 0).toString(16)})`));
        } else if (total != tamano) {
          reject(new Error(`descarga incompleta: ${total} de ${tamano} bytes`));
        } else {
          resolve(trozos);
        }
      },
    });
  });
}

/** sha256 en hexadecimal de los trozos, sin juntarlos en memoria. */
function sha256(trozos) {
  const h = Cc["@mozilla.org/security/hash;1"].createInstance(Ci.nsICryptoHash);
  h.init(Ci.nsICryptoHash.SHA256);
  for (const t of trozos) {
    h.update(t, t.length);
  }
  return Array.from(h.finish(false), c => c.charCodeAt(0).toString(16).padStart(2, "0")).join("");
}

const ceder = () => new Promise(resolve => Services.tm.dispatchToMainThread(resolve));

/**
 * Descomprime el gzip con el conversor de Necko y pasa lo descomprimido a `alDatos(Uint8Array)`, en orden.
 * `alAvanzar(bytes)`: cuánto del comprimido se ha procesado, de vez en cuando.
 */
async function descomprimir(trozos, alDatos, alAvanzar) {
  let estadoFinal = Cr.NS_OK;
  const oyente = {
    QueryInterface: ChromeUtils.generateQI(["nsIStreamListener", "nsIRequestObserver"]),
    onStartRequest() {},
    onDataAvailable(peticion, flujo, desplazamiento, cuenta) {
      const lector = Cc["@mozilla.org/binaryinputstream;1"].createInstance(Ci.nsIBinaryInputStream);
      lector.setInputStream(flujo);
      const datos = new ArrayBuffer(cuenta);
      lector.readArrayBuffer(cuenta, datos);
      alDatos(new Uint8Array(datos));
    },
    onStopRequest(peticion, estado) {
      estadoFinal = estado;
    },
  };
  const conversor = Cc["@mozilla.org/streamConverters;1"]
    .getService(Ci.nsIStreamConverterService)
    .asyncConvertData("gzip", "uncompressed", oyente, null);
  // El conversor pide una petición: un canal sin abrir (no conecta con nada) le basta.
  const peticion = lazy.NetUtil.newChannel({ uri: "data:,", loadUsingSystemPrincipal: true });
  conversor.onStartRequest(peticion);
  let desplazamiento = 0;
  let desdeUltimaPausa = 0;
  for (const t of trozos) {
    const flujo = Cc["@mozilla.org/io/arraybuffer-input-stream;1"].createInstance(Ci.nsIArrayBufferInputStream);
    flujo.setData(t.buffer, t.byteOffset, t.byteLength);
    conversor.onDataAvailable(peticion, flujo, desplazamiento, t.byteLength);
    desplazamiento += t.byteLength;
    desdeUltimaPausa += t.byteLength;
    if (desdeUltimaPausa >= TROZO) {
      desdeUltimaPausa = 0;
      alAvanzar(desplazamiento);
      await ceder();
    }
  }
  conversor.onStopRequest(peticion, Cr.NS_OK);
  if (!Components.isSuccessCode(estadoFinal)) {
    throw new Error(`gzip no válido (0x${(estadoFinal >>> 0).toString(16)})`);
  }
}

const texto = new TextDecoder();
/** Cadena terminada en NUL dentro de una cabecera. */
function cadena(bloque, inicio, largo) {
  const fin = bloque.subarray(inicio, inicio + largo).indexOf(0);
  return texto.decode(bloque.subarray(inicio, fin < 0 ? inicio + largo : inicio + fin));
}
/** Número octal de una cabecera (sin la codificación base-256 de GNU: el paquete no la necesita). */
function octal(bloque, inicio, largo) {
  if (bloque[inicio] & 0x80) {
    throw new Error("tamaño en base 256: no admitido");
  }
  const s = cadena(bloque, inicio, largo).trim();
  if (!/^[0-7]*$/.test(s)) {
    throw new Error("número no válido en una cabecera tar");
  }
  return s ? parseInt(s, 8) : 0;
}

/**
 * Lector de tar por trozos (ustar, con cabeceras pax «x» y nombres largos de GNU «L»). Llama a
 * `alArchivo(nombre, datos)` con cada archivo normal de la lista ARCHIVOS; el resto se salta. Cualquier nombre
 * peligroso hace fallar la lectura entera.
 */
class LectorTar {
  #pendiente = new Uint8Array(0);
  #estado = "cabecera";
  #restante = 0;
  #relleno = 0;
  #actual = null; // {nombre, tipo, datos, escrito}
  #siguienteNombre = null; // de una cabecera pax o GNU
  #total = 0;
  #fin = false;

  constructor(alArchivo) {
    this.alArchivo = alArchivo;
  }

  get terminado() {
    return this.#fin;
  }

  empujar(trozo) {
    this.#total += trozo.length;
    if (this.#total > MAXIMO_DESCOMPRIMIDO) {
      throw new Error("el paquete descomprimido es demasiado grande");
    }
    let datos = trozo;
    if (this.#pendiente.length) {
      datos = new Uint8Array(this.#pendiente.length + trozo.length);
      datos.set(this.#pendiente);
      datos.set(trozo, this.#pendiente.length);
    }
    let i = 0;
    while (i < datos.length && !this.#fin) {
      if (this.#estado == "cabecera") {
        if (datos.length - i < 512) {
          break;
        }
        this.#cabecera(datos.subarray(i, i + 512));
        i += 512;
      } else if (this.#estado == "datos") {
        const n = Math.min(this.#restante, datos.length - i);
        this.#datos(datos.subarray(i, i + n));
        i += n;
        this.#restante -= n;
        if (!this.#restante) {
          this.#cerrarArchivo();
        }
      } else {
        // Relleno hasta el siguiente bloque de 512.
        const n = Math.min(this.#relleno, datos.length - i);
        i += n;
        this.#relleno -= n;
        if (!this.#relleno) {
          this.#estado = "cabecera";
        }
      }
    }
    this.#pendiente = this.#fin ? new Uint8Array(0) : datos.slice(i);
  }

  #cabecera(bloque) {
    if (bloque.every(b => b == 0)) {
      // Dos bloques de ceros cierran el tar; con uno basta para dejar de leer.
      this.#fin = true;
      return;
    }
    const magia = cadena(bloque, 257, 6);
    if (!magia.startsWith("ustar")) {
      throw new Error("no es un tar ustar");
    }
    let nombre = cadena(bloque, 0, 100);
    const prefijo = cadena(bloque, 345, 155);
    if (prefijo && magia == "ustar") {
      nombre = `${prefijo}/${nombre}`;
    }
    const tipo = String.fromCharCode(bloque[156] || 0x30);
    const tamano = octal(bloque, 124, 12);
    if (this.#siguienteNombre != null && tipo != "x" && tipo != "L") {
      nombre = this.#siguienteNombre;
      this.#siguienteNombre = null;
    }
    if (nombre.startsWith("./")) {
      nombre = nombre.slice(2);
    }
    if (tipo != "x" && tipo != "g" && tipo != "L") {
      if (!NOMBRE_VALIDO.test(nombre) || nombre.split("/").includes("..")) {
        throw new Error(`nombre peligroso en el paquete: ${JSON.stringify(nombre)}`);
      }
    }
    const quiero = (tipo == "0" || tipo == "7") && ARCHIVOS.has(nombre);
    const necesitoDatos = quiero || tipo == "x" || tipo == "L";
    this.#actual = necesitoDatos
      ? { nombre, tipo, datos: new Uint8Array(tamano), escrito: 0, quiero }
      : null;
    this.#restante = tamano;
    this.#relleno = (512 - (tamano % 512)) % 512;
    if (tamano) {
      this.#estado = "datos";
    } else {
      this.#cerrarArchivo();
    }
  }

  #datos(parte) {
    if (this.#actual) {
      this.#actual.datos.set(parte, this.#actual.escrito);
      this.#actual.escrito += parte.length;
    }
  }

  #cerrarArchivo() {
    const a = this.#actual;
    this.#actual = null;
    this.#estado = this.#relleno ? "relleno" : "cabecera";
    if (!a) {
      return;
    }
    if (a.tipo == "L") {
      this.#siguienteNombre = cadena(a.datos, 0, a.datos.length);
    } else if (a.tipo == "x") {
      // Registros «<largo> <clave>=<valor>\n»: solo interesa path.
      for (const linea of texto.decode(a.datos).split("\n")) {
        const m = /^\d+ path=(.*)$/.exec(linea);
        if (m) {
          this.#siguienteNombre = m[1];
        }
      }
    } else if (a.quiero) {
      this.alArchivo(a.nombre, a.datos);
    }
  }
}

/**
 * Descarga, comprueba y extrae el paquete fijado en tor.json. Devuelve la versión instalada.
 *
 * @param {(fase: "descargando"|"comprobando"|"extrayendo", progreso: number) => void} alAvanzar progreso de 0 a 100
 * @param {{cancelar?: () => void}} senal se le pone `cancelar` para poder pararla
 * @returns {Promise<string>}
 */
export async function descargar(alAvanzar, senal = {}) {
  const d = await datosFijados();
  let trozos = null;
  let ultimoError = null;
  for (const url of d.urls) {
    try {
      trozos = await bajar(url, d.tamano, n => alAvanzar("descargando", Math.floor((n * 100) / d.tamano)), senal);
      break;
    } catch (e) {
      if (e instanceof Cancelada) {
        throw e;
      }
      ultimoError = e;
      console.warn(`Aegis: Tor, no se pudo descargar ${url}`, e);
    }
  }
  if (!trozos) {
    throw ultimoError ?? new Error("sin URL de descarga");
  }
  alAvanzar("comprobando", 100);
  await ceder();
  const suma = sha256(trozos);
  if (suma != d.sha256) {
    // No se guarda nada: lo descargado no es lo que se fijó en la build.
    throw new Error(`el sha256 no coincide (${suma})`);
  }

  // Comprobado: ahora sí se extrae, en una carpeta temporal que se renombra al final.
  alAvanzar("extrayendo", 0);
  const destino = carpetaDe(d.version);
  const parcial = `${destino}.parcial`;
  await IOUtils.remove(parcial, { recursive: true, ignoreAbsent: true });
  await IOUtils.makeDirectory(parcial, { createAncestors: true });
  const escrituras = [];
  const vistos = new Set();
  const tar = new LectorTar((nombre, datos) => {
    vistos.add(nombre);
    const ruta = PathUtils.join(parcial, ...nombre.split("/"));
    escrituras.push(
      IOUtils.makeDirectory(PathUtils.parent(ruta), { createAncestors: true }).then(() =>
        IOUtils.write(ruta, datos, { mode: "create" })
      )
    );
  });
  try {
    await descomprimir(
      trozos,
      parte => {
        if (!tar.terminado) {
          tar.empujar(parte);
        }
      },
      n => alAvanzar("extrayendo", Math.min(99, Math.floor((n * 100) / d.tamano)))
    );
    trozos = null;
    await Promise.all(escrituras);
    for (const [nombre, obligatorio] of ARCHIVOS) {
      if (obligatorio && !vistos.has(nombre)) {
        throw new Error(`el paquete no trae ${nombre}`);
      }
    }
    await IOUtils.remove(destino, { recursive: true, ignoreAbsent: true });
    await IOUtils.move(parcial, destino);
  } catch (e) {
    await Promise.allSettled(escrituras);
    await IOUtils.remove(parcial, { recursive: true, ignoreAbsent: true });
    throw e;
  }
  alAvanzar("extrayendo", 100);
  // Otras versiones que hubiera (de una versión anterior de Aegis): fuera.
  for (const hijo of await IOUtils.getChildren(raiz()).catch(() => [])) {
    const nombre = PathUtils.filename(hijo);
    if (nombre != d.version && nombre != "datos" && /^[0-9][0-9a-z.]*(\.parcial)?$/.test(nombre)) {
      await IOUtils.remove(hijo, { recursive: true, ignoreAbsent: true }).catch(() => {});
    }
  }
  return d.version;
}

/** ¿Están los archivos que hacen falta para arrancar tor? */
export async function instalada(version) {
  if (!version || !/^[0-9][0-9a-z.]*$/.test(version)) {
    return false;
  }
  const base = carpetaDe(version);
  for (const [nombre, obligatorio] of ARCHIVOS) {
    if (obligatorio && !(await IOUtils.exists(PathUtils.join(base, ...nombre.split("/"))))) {
      return false;
    }
  }
  return true;
}

/** Borra todo lo de Tor del perfil (programas y datos de tor). */
export async function borrar() {
  await IOUtils.remove(raiz(), { recursive: true, ignoreAbsent: true });
}

export const ARCHIVOS_TOR = ARCHIVOS;
