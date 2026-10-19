/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · autenticador: el cálculo de los códigos de verificación (TOTP, RFC 6238, sobre HOTP, RFC 4226) y la lectura
 * de lo que da una web al configurar la verificación en dos pasos (un enlace otpauth:// o la clave en base32).
 *
 * Sin dependencias de Gecko ni de red: solo Web Crypto (HMAC-SHA1, SHA-256 y SHA-512), que existe en los módulos del
 * navegador y en node. Así lo prueba tools/pruebas/totp.mjs con los vectores de la RFC 6238. No guarda nada: quien
 * llama decide qué hacer con el secreto (autenticador.sys.mjs lo cifra con la clave de las contraseñas).
 */

const HASH = { SHA1: "SHA-1", SHA256: "SHA-256", SHA512: "SHA-512" };
const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/** Bytes mínimos del secreto: 80 bits, lo menos que usan las webs (RFC 4226 pide 128; recomienda 160). */
export const SECRETO_MINIMO = 10;

/** Error con un código que la interfaz traduce. */
export class ErrorTotp extends Error {
  /**
   * @param {"formato"|"hotp"|"corta"|"parametros"} codigo
   */
  constructor(codigo) {
    super(`totp: ${codigo}`);
    this.codigo = codigo;
  }
}

/**
 * Base32 (RFC 4648), sin relleno obligatorio, sin distinguir mayúsculas y sin espacios ni guiones.
 *
 * @param {string} texto
 * @returns {Uint8Array}
 */
export function base32(texto) {
  const limpio = texto.toUpperCase().replace(/[\s-]+/g, "").replace(/=+$/, "");
  if (!limpio || /[^A-Z2-7]/.test(limpio)) {
    throw new ErrorTotp("formato");
  }
  const bytes = [];
  let acumulado = 0;
  let bits = 0;
  for (const c of limpio) {
    acumulado = (acumulado << 5) | BASE32.indexOf(c);
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((acumulado >>> bits) & 0xff);
    }
  }
  return new Uint8Array(bytes);
}

/**
 * @typedef {object} Totp
 * @property {string} secreto en base32, normalizado (mayúsculas, sin espacios ni relleno)
 * @property {"SHA1"|"SHA256"|"SHA512"} algoritmo
 * @property {number} digitos 6, 7 u 8
 * @property {number} periodo segundos (de 15 a 120)
 * @property {string} emisor quien lo da (puede faltar)
 * @property {string} cuenta la cuenta en esa web (puede faltar)
 */

/**
 * Comprueba y deja en su forma normal un secreto con sus parámetros. Lo usa leer() y, al recibir códigos de otro Aegis
 * (contrasenas/transferencia/), autenticador.sys.mjs: lo que llega en el paquete se valida igual que lo que se pega.
 *
 * @param {object} totp
 * @returns {Totp}
 */
export function normalizar({ secreto, algoritmo = "SHA1", digitos = 6, periodo = 30, emisor = "", cuenta = "" }) {
  if (typeof secreto != "string" || typeof emisor != "string" || typeof cuenta != "string") {
    throw new ErrorTotp("formato");
  }
  const bytes = base32(secreto);
  if (bytes.length < SECRETO_MINIMO) {
    throw new ErrorTotp("corta");
  }
  algoritmo = String(algoritmo).toUpperCase().replace("-", "");
  digitos = Number(digitos);
  periodo = Number(periodo);
  if (!HASH[algoritmo] || ![6, 7, 8].includes(digitos) || !Number.isInteger(periodo) || periodo < 15 || periodo > 120) {
    throw new ErrorTotp("parametros");
  }
  const s = secreto.toUpperCase().replace(/[\s-]+/g, "").replace(/=+$/, "");
  return { secreto: s, algoritmo, digitos, periodo, emisor: emisor.slice(0, 200), cuenta: cuenta.slice(0, 200) };
}

/**
 * Lo que pega el usuario o lee el QR: un enlace otpauth://totp/… o la clave de configuración en base32.
 *
 * @param {string} texto
 * @returns {Totp}
 */
export function leer(texto) {
  const t = String(texto ?? "").trim();
  if (!/^otpauth:/i.test(t)) {
    return normalizar({ secreto: t });
  }
  let url;
  try {
    url = new URL(t);
  } catch (e) {
    throw new ErrorTotp("formato");
  }
  const tipo = url.host.toLowerCase() || url.pathname.replace(/^\/+/, "").split("/")[0].toLowerCase();
  if (tipo == "hotp") {
    throw new ErrorTotp("hotp");
  }
  if (tipo != "totp") {
    throw new ErrorTotp("formato");
  }
  const p = url.searchParams;
  if (!p.get("secret")) {
    throw new ErrorTotp("formato");
  }
  // La etiqueta: «Emisor:cuenta» o solo «cuenta» (codificada).
  let etiqueta = "";
  try {
    etiqueta = decodeURIComponent(url.pathname.replace(/^\/+/, "").replace(/^totp\//i, ""));
  } catch (e) {}
  const [antes, despues] = etiqueta.includes(":") ? etiqueta.split(/:(.*)/s) : ["", etiqueta];
  return normalizar({
    secreto: p.get("secret"),
    algoritmo: p.get("algorithm") ?? "SHA1",
    digitos: p.get("digits") ?? 6,
    periodo: p.get("period") ?? 30,
    emisor: (p.get("issuer") ?? antes ?? "").trim(),
    cuenta: (despues ?? "").trim(),
  });
}

/**
 * El código TOTP de un momento.
 *
 * @param {Totp} totp
 * @param {number} [ahora] milisegundos desde 1970 (para las pruebas)
 * @returns {Promise<{codigo: string, restante: number}>} restante: segundos hasta el siguiente
 */
export async function codigo(totp, ahora = Date.now()) {
  const { secreto, algoritmo, digitos, periodo } = normalizar(totp);
  const segundos = Math.floor(ahora / 1000);
  const contador = Math.floor(segundos / periodo);
  // Contador de 8 bytes, big endian (los segundos de hoy no caben en 32 bits a partir de 2106; el contador sí).
  const mensaje = new Uint8Array(8);
  let resto = contador;
  for (let i = 7; i >= 0; i--) {
    mensaje[i] = resto % 256;
    resto = Math.floor(resto / 256);
  }
  const sutil = globalThis.crypto.subtle;
  const clave = await sutil.importKey("raw", base32(secreto), { name: "HMAC", hash: HASH[algoritmo] }, false, [
    "sign",
  ]);
  const hmac = new Uint8Array(await sutil.sign("HMAC", clave, mensaje));
  // Truncado dinámico (RFC 4226, 5.3).
  const desplazamiento = hmac[hmac.length - 1] & 0x0f;
  const binario =
    ((hmac[desplazamiento] & 0x7f) << 24) |
    (hmac[desplazamiento + 1] << 16) |
    (hmac[desplazamiento + 2] << 8) |
    hmac[desplazamiento + 3];
  const valor = binario % 10 ** digitos;
  return { codigo: String(valor).padStart(digitos, "0"), restante: periodo - (segundos % periodo) };
}

/**
 * Para leer en pantalla: «123 456», «1234 567», «1234 5678».
 *
 * @param {string} c
 */
export function agrupar(c) {
  const corte = Math.ceil(c.length / 2);
  return `${c.slice(0, corte)} ${c.slice(corte)}`;
}
