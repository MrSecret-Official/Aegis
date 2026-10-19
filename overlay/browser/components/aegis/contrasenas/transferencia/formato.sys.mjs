/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · código de transferencia: el código de 6 palabras, la clave que sale de él y el formato del paquete
 * .aegisvault con el que las contraseñas pasan de un Aegis a otro (fase 2 de docs/PLAN.md; el formato, en
 * docs/PRIVACIDAD.md, «Pasar las contraseñas a otro Aegis»).
 *
 * Sin dependencias de Gecko ni de red: solo WebCrypto (PBKDF2, AES-GCM y getRandomValues), TextEncoder y atob/btoa,
 * que existen en los módulos del proceso principal y en node. Así lo prueba tools/pruebas/transferencia.mjs. No guarda
 * nada ni sabe de prefs: el lado del navegador (transferencia.sys.mjs) lee y escribe el archivo, apunta los paquetes ya
 * importados y mete las contraseñas en la bóveda.
 *
 * El archivo:
 *
 *   <cabecera: JSON en UTF-8 en una línea> 0x0A <texto cifrado con AES-256-GCM, con su etiqueta de 16 bytes al final>
 *
 * - Cabecera, en claro y sin nada del usuario ni del equipo:
 *   {"formato":"aegisvault","version":1,"kdf":"PBKDF2-SHA256","iteraciones":2000000,"sal":"…","cifrado":"AES-256-GCM","iv":"…"}
 *   con la sal (16 bytes) y el IV (12 bytes) en base64url sin relleno. Va también como datos autenticados (AAD), tal
 *   cual está en el archivo: cambiar un solo byte de la cabecera hace fallar el descifrado.
 * - Lo cifrado: 4 bytes con la longitud L del JSON (big-endian), el JSON (L bytes, UTF-8) y ceros hasta un múltiplo de
 *   4096 bytes, para que el tamaño no diga cuántas contraseñas lleva. El JSON:
 *   {"id":"<16 bytes aleatorios, base64url>","creado":<milisegundos desde 1970>,"contrasenas":[…]}
 * - La clave: PBKDF2-HMAC-SHA256 del código normalizado (palabras en minúscula separadas por un espacio, en UTF-8) con
 *   esa sal y esas iteraciones, para una clave AES-256 que no se puede extraer.
 *
 * Al leer se rechaza, antes de derivar la clave (que es lo que cuesta), todo lo que no sea exactamente eso: otras
 * claves en la cabecera, iteraciones fuera de [ITERACIONES_MINIMAS, ITERACIONES_MAXIMAS] (un archivo manipulado no
 * puede tener el equipo ocupado minutos), sal o IV de otra longitud, un tamaño que no cuadre y archivos de más de
 * TAMANO_MAXIMO. Una versión mayor se dice aparte (hace falta un Aegis más nuevo). Si el código está mal escrito o el
 * archivo se ha tocado, AES-GCM no descifra y el error es el mismo para los dos casos («incorrecto»), sin pistas.
 *
 * La caducidad (24 h) y el «un solo uso» los decide quien importa con la hora y el identificador de dentro (que solo
 * se leen con el código): son reglas de Aegis, no del cifrado. Lo que protege el archivo es el código.
 *
 * Memoria: los Uint8Array con el claro (lo que se cifra y lo descifrado) y los bytes del código se rellenan con ceros en
 * cuanto dejan de hacer falta. Las cadenas de JavaScript (el JSON, las contraseñas una vez leídas) no se pueden borrar:
 * las recoge el recolector de basura cuando nadie las usa.
 */

import { PALABRAS } from "./palabras.sys.mjs";

export const FORMATO = "aegisvault";
export const VERSION = 1;
export const KDF = "PBKDF2-SHA256";
export const CIFRADO = "AES-256-GCM";
/** Extensión del archivo (sin punto). */
export const EXTENSION = "aegisvault";

/** 6 palabras de 7776: log2(7776^6) ≈ 77,5 bits. */
export const PALABRAS_DEL_CODIGO = 6;

/**
 * Iteraciones de PBKDF2 al crear un paquete. Medido el 2026-10-17 en el equipo de pruebas: 0,36 s en node 22 (OpenSSL)
 * y, por la relación de NSS (600 000 iteraciones de key4.db ≈ 0,3 s en Aegis), alrededor de 1 s en el navegador; en un
 * equipo lento, unos pocos segundos, una vez al crear y otra al importar. Con 77,5 bits de código, cada intento de
 * adivinarlo cuesta 2 millones de HMAC-SHA256: lo que da el margen es el código, y esto lo encarece todavía más.
 */
export const ITERACIONES = 2000000;
/** Lo que se acepta al importar: nunca menos que la KDF de la bóveda, ni tanto que un archivo bloquee el equipo. */
export const ITERACIONES_MINIMAS = 600000;
export const ITERACIONES_MAXIMAS = 5000000;

export const BYTES_SAL = 16;
export const BYTES_IV = 12;
export const BYTES_ID = 16;
export const BYTES_ETIQUETA = 16;
/** El claro se rellena hasta un múltiplo de esto. */
export const BLOQUE = 4096;
/** Bytes de la cabecera como mucho (la de la versión 1 ocupa unos 170). */
export const CABECERA_MAXIMA = 512;
/** Un archivo de más de esto no es un paquete (unas 50 000 contraseñas caben de sobra). */
export const TAMANO_MAXIMO = 32 * 1024 * 1024;
/** Un paquete vale durante 24 h desde que se crea. */
export const CADUCIDAD_MS = 24 * 60 * 60 * 1000;
/** Diferencia de hora entre los dos equipos que se tolera (un paquete «del futuro» de más de esto se rechaza). */
export const MARGEN_RELOJ_MS = 5 * 60 * 1000;
/** Paquetes importados que se recuerdan como mucho (solo los de las últimas 24 h; más es imposible en la práctica). */
export const USOS_MAXIMOS = 1000;

/**
 * Error con un código que la interfaz traduce:
 * - «incorrecto»: el código o el archivo no son correctos (no se dice cuál), o no es un paquete;
 * - «version»: es de una versión del formato más nueva;
 * - «caducado»: tiene más de 24 h;
 * - «reloj»: se creó «en el futuro» (la hora de uno de los dos equipos está mal);
 * - «usado»: ya se importó en este perfil.
 */
export class ErrorTransferencia extends Error {
  /**
   * @param {"incorrecto"|"version"|"caducado"|"reloj"|"usado"} codigo
   */
  constructor(codigo) {
    super(`transferencia: ${codigo}`);
    this.codigo = codigo;
  }
}

const incorrecto = () => new ErrorTransferencia("incorrecto");

/* ───────── Bytes ───────── */

const ALEATORIO = bytes => globalThis.crypto.getRandomValues(bytes);

function aleatorios(n) {
  return ALEATORIO(new Uint8Array(n));
}

/** @param {Uint8Array} bytes */
export function aBase64url(bytes) {
  let binario = "";
  for (const b of bytes) {
    binario += String.fromCharCode(b);
  }
  return btoa(binario).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * base64url estricto: sin relleno, solo su alfabeto, exactamente n bytes y en su forma canónica.
 *
 * @param {unknown} texto
 * @param {number} n
 * @returns {Uint8Array}
 */
export function deBase64url(texto, n) {
  if (typeof texto != "string" || texto.length != Math.ceil((n * 4) / 3) || !/^[A-Za-z0-9_-]+$/.test(texto)) {
    throw incorrecto();
  }
  let binario;
  try {
    binario = atob(texto.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (texto.length % 4)) % 4));
  } catch (e) {
    throw incorrecto();
  }
  const bytes = Uint8Array.from(binario, c => c.charCodeAt(0));
  if (bytes.length != n || aBase64url(bytes) !== texto) {
    throw incorrecto();
  }
  return bytes;
}

/* ───────── El código ───────── */

const CONJUNTO = new Set(PALABRAS);
/** Las palabras con guion («t-shirt») se escriben a veces separadas: sus trozos también son fichas válidas. */
const TROZOS = new Set(PALABRAS.filter(p => p.includes("-")).flatMap(p => p.split("-")));

/**
 * Un número entero uniforme en [0, n) con getRandomValues y rechazo: los valores de 32 bits desde el mayor múltiplo de
 * n se descartan, porque con el módulo darían más peso a los primeros (7776 no divide 2^32). Se repite con probabilidad
 * menor que n / 2^32 (para 7776, una vez de cada 552 000).
 *
 * @param {number} n de 1 a 2^32
 * @param {(caja: Uint32Array) => void} [aleatorio] para las pruebas; de serie, crypto.getRandomValues
 * @returns {number}
 */
export function indiceAleatorio(n, aleatorio = ALEATORIO) {
  if (!Number.isInteger(n) || n < 1 || n > 0x100000000) {
    throw new RangeError("indiceAleatorio: n fuera de rango");
  }
  const limite = Math.floor(0x100000000 / n) * n;
  const caja = new Uint32Array(1);
  for (;;) {
    aleatorio(caja);
    const x = caja[0];
    caja[0] = 0;
    if (x < limite) {
      return x % n;
    }
  }
}

/**
 * Un código nuevo: 6 palabras de la lista del EFF, independientes y uniformes. Nunca se guarda: se enseña una vez.
 *
 * @param {(caja: Uint32Array) => void} [aleatorio]
 * @returns {string[]}
 */
export function generarCodigo(aleatorio = ALEATORIO) {
  return Array.from({ length: PALABRAS_DEL_CODIGO }, () => PALABRAS[indiceAleatorio(PALABRAS.length, aleatorio)]);
}

/**
 * La forma con la que se deriva la clave: NFKC, minúsculas y cualquier cosa que no sea una letra a–z (espacios,
 * guiones, saltos de línea, números de la lista, puntos) como una sola separación, sin separaciones al principio ni al
 * final. «Felt-Tip  YO-YO\n» y «felt tip yo yo» dan lo mismo («felt tip yo yo»).
 *
 * @param {unknown} texto
 * @returns {string}
 */
export function normalizarCodigo(texto) {
  return String(texto ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z]+/g, " ")
    .trim();
}

/**
 * Lo que ha escrito el usuario, leído como código: si son 6 palabras de la lista (contando «t-shirt» como una, se
 * escriba con guion o con espacio), cuántas lleva y la primera ficha que no es de la lista. Para el diálogo (activar
 * «Recibir», decir cuántas faltan) y para descifrar.
 *
 * @param {unknown} texto
 * @returns {{normalizado: string, completo: boolean, palabras: number, desconocida: string|null}}
 */
export function leerCodigo(texto) {
  const normalizado = normalizarCodigo(texto);
  const fichas = normalizado ? normalizado.split(" ") : [];
  const desconocida = fichas.find(f => !CONJUNTO.has(f) && !TROZOS.has(f)) ?? null;
  // De cuántas palabras se pueden leer las fichas desde la i (una palabra es una ficha de la lista o dos unidas por el
  // guion de una de las cuatro con guion).
  const cuentas = Array.from({ length: fichas.length + 1 }, () => new Set());
  cuentas[fichas.length].add(0);
  for (let i = fichas.length - 1; i >= 0; i--) {
    if (CONJUNTO.has(fichas[i])) {
      for (const c of cuentas[i + 1]) {
        cuentas[i].add(c + 1);
      }
    }
    if (i + 1 < fichas.length && CONJUNTO.has(`${fichas[i]}-${fichas[i + 1]}`)) {
      for (const c of cuentas[i + 2]) {
        cuentas[i].add(c + 1);
      }
    }
  }
  const posibles = cuentas[0];
  const completo = !desconocida && posibles.has(PALABRAS_DEL_CODIGO);
  const palabras = completo ? PALABRAS_DEL_CODIGO : posibles.size ? Math.max(...posibles) : fichas.length;
  return { normalizado, completo, palabras, desconocida };
}

/* ───────── Clave ───────── */

/**
 * @param {string} normalizado
 * @param {Uint8Array} sal
 * @param {number} iteraciones
 * @param {KeyUsage[]} usos
 * @returns {Promise<CryptoKey>}
 */
async function derivarClave(normalizado, sal, iteraciones, usos) {
  const sutil = globalThis.crypto.subtle;
  const bytes = new TextEncoder().encode(normalizado);
  try {
    const base = await sutil.importKey("raw", bytes, "PBKDF2", false, ["deriveKey"]);
    return await sutil.deriveKey(
      { name: "PBKDF2", hash: "SHA-256", salt: sal, iterations: iteraciones },
      base,
      { name: "AES-GCM", length: 256 },
      false,
      usos
    );
  } finally {
    bytes.fill(0);
  }
}

/* ───────── Cifrar ───────── */

/**
 * El tamaño del claro con relleno para un JSON de «longitud» bytes: 4 de la longitud más el JSON, al múltiplo de 4096.
 *
 * @param {number} longitud
 */
export function tamanoConRelleno(longitud) {
  return Math.ceil((4 + longitud) / BLOQUE) * BLOQUE;
}

/**
 * Crea un paquete.
 *
 * @param {object[]} contrasenas lo que se lleva (transferencia.sys.mjs decide los campos)
 * @param {string[]|string} codigo las palabras de generarCodigo()
 * @param {object} [opciones]
 * @param {number} [opciones.ahora] hora de creación, en ms
 * @param {number} [opciones.iteraciones] solo para las pruebas (de serie, ITERACIONES)
 * @returns {Promise<{bytes: Uint8Array, id: string}>} el archivo entero y su identificador
 */
export async function cifrar(contrasenas, codigo, { ahora = Date.now(), iteraciones = ITERACIONES } = {}) {
  if (!Array.isArray(contrasenas)) {
    throw new TypeError("cifrar: contrasenas tiene que ser una lista");
  }
  if (!Number.isSafeInteger(iteraciones) || iteraciones < ITERACIONES_MINIMAS || iteraciones > ITERACIONES_MAXIMAS) {
    throw new RangeError("cifrar: iteraciones fuera de rango");
  }
  const leido = leerCodigo(Array.isArray(codigo) ? codigo.join(" ") : codigo);
  if (!leido.completo) {
    throw new RangeError("cifrar: el código no son 6 palabras de la lista");
  }
  const sal = aleatorios(BYTES_SAL);
  const iv = aleatorios(BYTES_IV);
  const id = aBase64url(aleatorios(BYTES_ID));
  // El orden de las claves es fijo; al leer, la cabecera se autentica tal cual está en el archivo.
  const cabecera = new TextEncoder().encode(
    JSON.stringify({
      formato: FORMATO,
      version: VERSION,
      kdf: KDF,
      iteraciones,
      sal: aBase64url(sal),
      cifrado: CIFRADO,
      iv: aBase64url(iv),
    })
  );
  const json = new TextEncoder().encode(JSON.stringify({ id, creado: ahora, contrasenas }));
  const claro = new Uint8Array(tamanoConRelleno(json.length));
  try {
    new DataView(claro.buffer).setUint32(0, json.length);
    claro.set(json, 4);
    json.fill(0);
    const clave = await derivarClave(leido.normalizado, sal, iteraciones, ["encrypt"]);
    const cifrado = new Uint8Array(
      await globalThis.crypto.subtle.encrypt(
        { name: "AES-GCM", iv, additionalData: cabecera, tagLength: BYTES_ETIQUETA * 8 },
        clave,
        claro
      )
    );
    const bytes = new Uint8Array(cabecera.length + 1 + cifrado.length);
    bytes.set(cabecera, 0);
    bytes[cabecera.length] = 0x0a;
    bytes.set(cifrado, cabecera.length + 1);
    return { bytes, id };
  } finally {
    json.fill(0);
    claro.fill(0);
  }
}

/* ───────── Leer ───────── */

const CLAVES_CABECERA = ["cifrado", "formato", "iteraciones", "iv", "kdf", "sal", "version"].join();

/**
 * Lee y comprueba la cabecera (sin derivar nada: es barato). Lanza ErrorTransferencia («incorrecto» o «version»).
 *
 * @param {Uint8Array|ArrayBuffer} archivo
 * @returns {{cabecera: object, cabeceraBytes: Uint8Array, sal: Uint8Array, iv: Uint8Array, cifrado: Uint8Array}}
 */
export function leerCabecera(archivo) {
  const bytes = archivo instanceof Uint8Array ? archivo : new Uint8Array(archivo);
  if (bytes.length > TAMANO_MAXIMO) {
    throw incorrecto();
  }
  const fin = bytes.subarray(0, CABECERA_MAXIMA + 1).indexOf(0x0a);
  if (fin <= 0) {
    throw incorrecto();
  }
  const cabeceraBytes = bytes.subarray(0, fin);
  let cabecera;
  try {
    cabecera = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(cabeceraBytes));
  } catch (e) {
    throw incorrecto();
  }
  if (!cabecera || typeof cabecera != "object" || Array.isArray(cabecera) || cabecera.formato !== FORMATO) {
    throw incorrecto();
  }
  if (!Number.isSafeInteger(cabecera.version) || cabecera.version < 1) {
    throw incorrecto();
  }
  if (cabecera.version > VERSION) {
    throw new ErrorTransferencia("version");
  }
  if (Object.keys(cabecera).sort().join() !== CLAVES_CABECERA || cabecera.kdf !== KDF || cabecera.cifrado !== CIFRADO) {
    throw incorrecto();
  }
  const { iteraciones } = cabecera;
  if (!Number.isSafeInteger(iteraciones) || iteraciones < ITERACIONES_MINIMAS || iteraciones > ITERACIONES_MAXIMAS) {
    throw incorrecto();
  }
  const sal = deBase64url(cabecera.sal, BYTES_SAL);
  const iv = deBase64url(cabecera.iv, BYTES_IV);
  const cifrado = bytes.subarray(fin + 1);
  if (cifrado.length < BLOQUE + BYTES_ETIQUETA || (cifrado.length - BYTES_ETIQUETA) % BLOQUE) {
    throw incorrecto();
  }
  return { cabecera, cabeceraBytes, sal, iv, cifrado };
}

/**
 * Abre un paquete con el código y comprueba su hora. No mira si ya se ha importado (comprobarUso).
 *
 * @param {Uint8Array|ArrayBuffer} archivo
 * @param {string} codigo lo que ha escrito el usuario
 * @param {object} [opciones]
 * @param {number} [opciones.ahora]
 * @returns {Promise<{id: string, creado: number, contrasenas: object[]}>}
 */
export async function descifrar(archivo, codigo, { ahora = Date.now() } = {}) {
  const { cabecera, cabeceraBytes, sal, iv, cifrado } = leerCabecera(archivo);
  const leido = leerCodigo(codigo);
  if (!leido.completo) {
    throw incorrecto();
  }
  const clave = await derivarClave(leido.normalizado, sal, cabecera.iteraciones, ["decrypt"]);
  let claro;
  try {
    claro = new Uint8Array(
      await globalThis.crypto.subtle.decrypt(
        { name: "AES-GCM", iv, additionalData: cabeceraBytes, tagLength: BYTES_ETIQUETA * 8 },
        clave,
        cifrado
      )
    );
  } catch (e) {
    // Código mal escrito o archivo tocado (cabecera, IV, cifrado o etiqueta): la misma respuesta.
    throw incorrecto();
  }
  try {
    if (claro.length % BLOQUE) {
      throw incorrecto();
    }
    const longitud = new DataView(claro.buffer, claro.byteOffset, claro.byteLength).getUint32(0);
    if (!longitud || longitud > claro.length - 4) {
      throw incorrecto();
    }
    for (let i = 4 + longitud; i < claro.length; i++) {
      if (claro[i]) {
        throw incorrecto();
      }
    }
    let datos;
    try {
      datos = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(claro.subarray(4, 4 + longitud)));
    } catch (e) {
      throw incorrecto();
    }
    if (
      !datos ||
      typeof datos != "object" ||
      Array.isArray(datos) ||
      !Number.isSafeInteger(datos.creado) ||
      datos.creado <= 0 ||
      !Array.isArray(datos.contrasenas)
    ) {
      throw incorrecto();
    }
    deBase64url(datos.id, BYTES_ID);
    if (datos.creado > ahora + MARGEN_RELOJ_MS) {
      throw new ErrorTransferencia("reloj");
    }
    if (ahora - datos.creado > CADUCIDAD_MS) {
      throw new ErrorTransferencia("caducado");
    }
    return { id: datos.id, creado: datos.creado, contrasenas: datos.contrasenas };
  } finally {
    claro.fill(0);
  }
}

/* ───────── Un solo uso ───────── */

/**
 * Los paquetes ya importados que siguen contando: [id, creado] de las últimas 24 h (más el margen del reloj). Uno más
 * antiguo se rechazaría igualmente por caducado, así que no hace falta recordarlo.
 *
 * @param {unknown} lista lo guardado (cualquier cosa: se limpia)
 * @param {number} ahora
 * @returns {[string, number][]}
 */
export function usosVigentes(lista, ahora) {
  if (!Array.isArray(lista)) {
    return [];
  }
  return lista
    .filter(
      u =>
        Array.isArray(u) &&
        u.length == 2 &&
        typeof u[0] == "string" &&
        Number.isSafeInteger(u[1]) &&
        u[1] >= ahora - CADUCIDAD_MS - MARGEN_RELOJ_MS
    )
    .slice(-USOS_MAXIMOS);
}

/**
 * Lanza ErrorTransferencia («usado») si el paquete ya se importó.
 *
 * @param {[string, number][]} vigentes
 * @param {string} id
 */
export function comprobarUso(vigentes, id) {
  if (vigentes.some(([visto]) => visto === id)) {
    throw new ErrorTransferencia("usado");
  }
}

/**
 * La lista con este paquete apuntado (y sin los que ya no cuentan).
 *
 * @param {unknown} lista
 * @param {string} id
 * @param {number} creado
 * @param {number} ahora
 * @returns {[string, number][]}
 */
export function apuntarUso(lista, id, creado, ahora) {
  const vigentes = usosVigentes(lista, ahora).filter(([visto]) => visto !== id);
  vigentes.push([id, creado]);
  return vigentes.slice(-USOS_MAXIMOS);
}
