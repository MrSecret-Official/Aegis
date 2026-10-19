// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

// Aegis · prueba del autenticador (overlay/browser/components/aegis/autenticador/totp.sys.mjs) con los vectores de la
// RFC 6238 (apéndice B: SHA-1, SHA-256 y SHA-512, 8 dígitos, 30 s) y la lectura de enlaces otpauth://. Sin red.
//
//   node tools/pruebas/totp.mjs        (en WSL: ~/.mozbuild/node/bin/node)
//
// Sale con 1 si algo falla.

import { agrupar, base32, codigo, ErrorTotp, leer } from "../../overlay/browser/components/aegis/autenticador/totp.sys.mjs";

const ALFABETO = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function aBase32(texto) {
  const bytes = new TextEncoder().encode(texto);
  let bits = "";
  for (const b of bytes) {
    bits += b.toString(2).padStart(8, "0");
  }
  let salida = "";
  for (let i = 0; i < bits.length; i += 5) {
    salida += ALFABETO[parseInt(bits.slice(i, i + 5).padEnd(5, "0"), 2)];
  }
  return salida;
}

// RFC 6238, apéndice B: las semillas son ASCII de 20, 32 y 64 bytes.
const SEMILLAS = {
  SHA1: "12345678901234567890",
  SHA256: "12345678901234567890123456789012",
  SHA512: "1234567890123456789012345678901234567890123456789012345678901234",
};
const VECTORES = [
  [59, "94287082", "46119246", "90693936"],
  [1111111109, "07081804", "68084774", "25091201"],
  [1111111111, "14050471", "67062674", "99943326"],
  [1234567890, "89005924", "91819424", "93441116"],
  [2000000000, "69279037", "90698825", "38618901"],
  [20000000000, "65353130", "77737706", "47863826"],
];

let fallos = 0;
function comprobar(nombre, obtenido, esperado) {
  if (obtenido === esperado) {
    console.log(`✓ ${nombre}`);
  } else {
    fallos++;
    console.log(`✗ ${nombre}: ${obtenido} (esperado ${esperado})`);
  }
}

for (const [t, sha1, sha256, sha512] of VECTORES) {
  for (const [algoritmo, esperado] of [
    ["SHA1", sha1],
    ["SHA256", sha256],
    ["SHA512", sha512],
  ]) {
    const totp = { secreto: aBase32(SEMILLAS[algoritmo]), algoritmo, digitos: 8, periodo: 30 };
    const { codigo: c } = await codigo(totp, t * 1000);
    comprobar(`RFC 6238 ${algoritmo} t=${t}`, c, esperado);
  }
}

// Lectura de enlaces y claves.
const uri = leer(
  "otpauth://totp/ACME%20Co:john.doe@email.com?secret=HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ&issuer=ACME%20Co&algorithm=SHA1&digits=6&period=30"
);
comprobar("otpauth: emisor", uri.emisor, "ACME Co");
comprobar("otpauth: cuenta", uri.cuenta, "john.doe@email.com");
comprobar("otpauth: secreto", uri.secreto, "HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ");
comprobar("otpauth: dígitos y periodo", `${uri.digitos}/${uri.periodo}`, "6/30");
comprobar("clave con espacios y minúsculas", leer("jbsw y3dp ehpk 3pxp").secreto, "JBSWY3DPEHPK3PXP");
comprobar("base32 de «foobar»", new TextDecoder().decode(base32("MZXW6YTBOI======")), "foobar");
comprobar("agrupar 6", agrupar("123456"), "123 456");
comprobar("agrupar 8", agrupar("12345678"), "1234 5678");

for (const [nombre, entrada, error] of [
  ["HOTP no", "otpauth://hotp/x?secret=JBSWY3DPEHPK3PXP&counter=1", "hotp"],
  ["clave corta", "JBSWY3DP", "corta"],
  ["caracteres raros", "JBSWY3DP!EHPK3PXP", "formato"],
  ["dígitos raros", "otpauth://totp/x?secret=JBSWY3DPEHPK3PXP&digits=5", "parametros"],
  ["sin secreto", "otpauth://totp/x?issuer=a", "formato"],
]) {
  try {
    leer(entrada);
    comprobar(nombre, "sin error", error);
  } catch (e) {
    comprobar(nombre, e instanceof ErrorTotp ? e.codigo : String(e), error);
  }
}

console.log(fallos ? `\n✗ ${fallos} fallos` : "\n✓ 0 fallos");
process.exitCode = fallos ? 1 : 0;
