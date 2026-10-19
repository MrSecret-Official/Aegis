// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

// Aegis · prueba del código de transferencia y del formato .aegisvault
// (overlay/browser/components/aegis/contrasenas/transferencia/formato.sys.mjs), sin navegador y sin red: ida y vuelta,
// código mal escrito, archivo tocado (cabecera, sal, IV, cifrado, etiqueta), iteraciones fuera de rango, versiones,
// caducidad, un solo uso, normalización del código, distribución de la elección de palabras y tamaño con relleno.
//
//   node tools/pruebas/transferencia.mjs [resultado.json]      (en WSL: ~/.mozbuild/node/bin/node)
//
// Sale con 1 si algo falla. Con un argumento, escribe ahí el resumen en JSON.

import { writeFileSync } from "node:fs";

import {
  aBase64url,
  apuntarUso,
  BLOQUE,
  CADUCIDAD_MS,
  cifrar,
  comprobarUso,
  descifrar,
  ErrorTransferencia,
  generarCodigo,
  indiceAleatorio,
  ITERACIONES,
  ITERACIONES_MAXIMAS,
  ITERACIONES_MINIMAS,
  leerCabecera,
  leerCodigo,
  MARGEN_RELOJ_MS,
  normalizarCodigo,
  tamanoConRelleno,
  usosVigentes,
} from "../../overlay/browser/components/aegis/contrasenas/transferencia/formato.sys.mjs";
import { PALABRAS, SHA256_ORIGEN } from "../../overlay/browser/components/aegis/contrasenas/transferencia/palabras.sys.mjs";
import { normalizar as normalizarTotp } from "../../overlay/browser/components/aegis/autenticador/totp.sys.mjs";

/** Para las pruebas: lo mínimo que se acepta, para que vayan rápidas (la de tiempos usa las de serie). */
const RAPIDO = { iteraciones: ITERACIONES_MINIMAS };

const resultados = [];
let fallos = 0;

function anotar(nombre, ok, detalle = "") {
  resultados.push({ nombre, ok, detalle });
  if (!ok) {
    fallos++;
  }
  console.log(`${ok ? "✓" : "✗"} ${nombre}${detalle ? ` · ${detalle}` : ""}`);
}

async function lanza(promesaOFuncion, codigo) {
  try {
    await (typeof promesaOFuncion == "function" ? promesaOFuncion() : promesaOFuncion);
    return "sin error";
  } catch (e) {
    if (codigo == "RangeError") {
      return e instanceof RangeError ? true : `${e?.name}: ${e?.message}`;
    }
    return e instanceof ErrorTransferencia && e.codigo == codigo ? true : `${e?.name}: ${e?.codigo ?? e?.message}`;
  }
}

async function esperarError(nombre, promesaOFuncion, codigo) {
  const r = await lanza(promesaOFuncion, codigo);
  anotar(nombre, r === true, r === true ? `«${codigo}»` : `esperaba «${codigo}», fue ${r}`);
}

const iguales = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function ejemplo(n) {
  return Array.from({ length: n }, (_, i) => ({
    origin: `https://sitio${i}.example`,
    formActionOrigin: `https://sitio${i}.example`,
    httpRealm: null,
    username: `usuaria${i}@example.com`,
    password: `contraseña-${i}-ñ€😀-${"x".repeat(i % 40)}`,
    usernameField: "email",
    passwordField: "password",
    timeCreated: 1700000000000 + i,
    timePasswordChanged: 1700000000000 + i,
    timeLastUsed: 1700000000000 + i,
    ...(i == 0
      ? {
          totp: {
            secreto: "JBSWY3DPEHPK3PXP",
            algoritmo: "SHA1",
            digitos: 6,
            periodo: 30,
            emisor: "Ejemplo",
            cuenta: "usuaria0",
          },
        }
      : {}),
  }));
}

/** Copia del archivo con la cabecera cambiada por otra (sin tocar lo cifrado). */
function conCabecera(bytes, cambiar) {
  const { cabecera, cifrado } = leerCabecera(bytes);
  const nueva = new TextEncoder().encode(
    typeof cambiar == "function" ? JSON.stringify(cambiar({ ...cabecera })) : cambiar
  );
  const salida = new Uint8Array(nueva.length + 1 + cifrado.length);
  salida.set(nueva);
  salida[nueva.length] = 0x0a;
  salida.set(cifrado, nueva.length + 1);
  return salida;
}

/** Cambia un carácter de base64url por otro distinto (sigue siendo base64url válido y canónico si no es el último). */
function otroCaracter(texto, i = 0) {
  const c = texto[i];
  return texto.slice(0, i) + (c == "A" ? "B" : "A") + texto.slice(i + 1);
}

async function sha256(texto) {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
  return Array.from(new Uint8Array(h), b => b.toString(16).padStart(2, "0")).join("");
}

/* ───────── La lista ───────── */

{
  const unicas = new Set(PALABRAS).size;
  anotar("lista: 7776 palabras sin repetir", PALABRAS.length == 7776 && unicas == 7776, `${PALABRAS.length} / ${unicas}`);
  anotar("lista: congelada", Object.isFrozen(PALABRAS));
  anotar(
    "lista: solo a–z y guion",
    PALABRAS.every(p => /^[a-z]+(-[a-z]+)?$/.test(p)),
    `con guion: ${PALABRAS.filter(p => p.includes("-")).join(", ")}`
  );
  const dados = i => i.toString(6).padStart(5, "0").replace(/./g, d => String(Number(d) + 1));
  const reconstruida = PALABRAS.map((p, i) => `${dados(i)}\t${p}\n`).join("");
  const h = await sha256(reconstruida);
  anotar("lista: reconstruida da el sha256 del EFF", h == SHA256_ORIGEN && dados(0) == "11111" && dados(7775) == "66666", h);
}

/* ───────── Normalización y lectura del código ───────── */

{
  const casos = [
    ["  Abacus\tABDOMEN\n\nabide-abiding—ability_ablaze  ", "abacus abdomen abide abiding ability ablaze"],
    ["ＡＢＡＣＵＳ　ａｂｄｏｍｅｎ", "abacus abdomen"], // ancho completo y espacio ideográfico (NFKC)
    ["1. abacus 2) abdomen 3·abide", "abacus abdomen abide"],
    ["T-Shirt  yo–yo\r\nfelt‑tip", "t shirt yo yo felt tip"], // guion, raya corta y guion que no corta (U+2011)
    ["", ""],
    [null, ""],
  ];
  for (const [entrada, esperado] of casos) {
    const r = normalizarCodigo(entrada);
    anotar(`normalizar ${JSON.stringify(entrada)}`, r === esperado, JSON.stringify(r));
  }
  const seis = "abacus abdomen abide abiding ability ablaze";
  const l = leerCodigo(seis.toUpperCase().replace(/ /g, "\n"));
  anotar("leer: 6 palabras en mayúsculas y saltos de línea", l.completo && l.palabras == 6 && l.normalizado == seis);
  const cinco = leerCodigo("abacus abdomen abide abiding ability");
  anotar("leer: 5 palabras, incompleto", !cinco.completo && cinco.palabras == 5);
  const siete = leerCodigo(`${seis} zoom`);
  anotar("leer: 7 palabras, incompleto", !siete.completo && siete.palabras == 7);
  const rara = leerCodigo("abacus abdomen abide abiding ability qwertyx");
  anotar("leer: una que no es de la lista", !rara.completo && rara.desconocida == "qwertyx");
  const camiseta = leerCodigo("t-shirt abacus abdomen abide abiding ability");
  const camiseta2 = leerCodigo("t shirt abacus abdomen abide abiding ability");
  anotar(
    "leer: «t-shirt» cuenta como una, con guion o con espacio",
    camiseta.completo && camiseta2.completo && camiseta.normalizado == camiseta2.normalizado
  );
  // «drop», «felt», «tip», «t» y «yo» no son palabras de la lista: separada, una palabra con guion solo se puede leer
  // como esa palabra, así que la forma normalizada no confunde dos códigos distintos.
  const abajo = leerCodigo("drop down abacus abdomen abide abiding ability");
  const abajo5 = leerCodigo("drop down abacus abdomen abide abiding");
  anotar("leer: «drop down» es «drop-down» (una palabra)", abajo.completo && !abajo5.completo && abajo5.palabras == 5);
  const sueltas = ["drop", "felt", "tip", "t", "yo"].filter(p => PALABRAS.includes(p));
  anotar("los trozos de las palabras con guion no son palabras sueltas (salvo «down» y «shirt»)", sueltas.length == 0);
}

/* ───────── Elección de palabras sin sesgo ───────── */

{
  // Que el rechazo descarta: con n = 3·2^30 el límite es n; un valor ≥ n se descarta y se pide otro.
  const n = 3 * 2 ** 30;
  const valores = [n, 2 ** 32 - 1, 5];
  let llamadas = 0;
  const falso = caja => {
    caja[0] = valores[llamadas++];
  };
  const r = indiceAleatorio(n, falso);
  anotar("rechazo: descarta los valores desde el límite", r == 5 && llamadas == 3, `resultado ${r}, ${llamadas} tiradas`);

  // Sesgo: con n = 3·2^30, sin rechazo la mitad de los resultados caerían por debajo de 2^30; con rechazo, un tercio.
  const N = 300000;
  let bajos = 0;
  for (let i = 0; i < N; i++) {
    if (indiceAleatorio(n) < 2 ** 30) {
      bajos++;
    }
  }
  const p = bajos / N;
  const desv = Math.sqrt((1 / 3) * (2 / 3) / N);
  anotar("sin sesgo (n = 3·2^30): un tercio por debajo de 2^30", Math.abs(p - 1 / 3) < 5 * desv, `${p.toFixed(5)} (sin rechazo sería 0,5)`);

  // Uniformidad sobre 7776: chi cuadrado con 7775 grados de libertad (media 7775, desviación √15550 ≈ 124,7).
  const K = PALABRAS.length;
  const tiradas = K * 200;
  const cuenta = new Uint32Array(K);
  for (let i = 0; i < tiradas; i++) {
    cuenta[indiceAleatorio(K)]++;
  }
  const esperado = tiradas / K;
  let chi = 0;
  for (const c of cuenta) {
    chi += (c - esperado) ** 2 / esperado;
  }
  const z = (chi - (K - 1)) / Math.sqrt(2 * (K - 1));
  anotar(`uniforme en 7776 (${tiradas} tiradas)`, Math.abs(z) < 5, `χ² = ${chi.toFixed(1)}, z = ${z.toFixed(2)}`);

  // Cada posición del código, también uniforme (menos tiradas: 6 posiciones × 7776 × 20).
  const porPosicion = Array.from({ length: 6 }, () => new Uint32Array(K));
  const indice = new Map(PALABRAS.map((p, i) => [p, i]));
  const codigos = K * 20;
  for (let i = 0; i < codigos; i++) {
    generarCodigo().forEach((p, j) => porPosicion[j][indice.get(p)]++);
  }
  const zs = porPosicion.map(c => {
    let x = 0;
    for (const v of c) {
      x += (v - 20) ** 2 / 20;
    }
    return (x - (K - 1)) / Math.sqrt(2 * (K - 1));
  });
  anotar(`cada posición uniforme (${codigos} códigos)`, zs.every(v => Math.abs(v) < 5), `z = ${zs.map(v => v.toFixed(2)).join(", ")}`);
  const muestra = generarCodigo();
  anotar("generarCodigo: 6 palabras de la lista", muestra.length == 6 && muestra.every(p => indice.has(p)) && leerCodigo(muestra.join(" ")).completo, muestra.join(" "));
}

/* ───────── Ida y vuelta ───────── */

const ahora = Date.UTC(2026, 9, 17, 12, 0, 0);
const codigo = ["abacus", "t-shirt", "zoom", "felt-tip", "yo-yo", "drop-down"];
const datos = ejemplo(25);
const { bytes, id } = await cifrar(datos, codigo, { ahora, ...RAPIDO });

{
  const abierto = await descifrar(bytes, codigo.join(" "), { ahora });
  anotar("ida y vuelta: mismos datos, id y hora", iguales(abierto.contrasenas, datos) && abierto.id == id && abierto.creado == ahora);
  // El código de verificación que va dentro se valida al recibirlo como lo que se pega (totp.sys.mjs, normalizar).
  const totp = normalizarTotp(abierto.contrasenas[0].totp);
  anotar("el código de verificación sale igual y se valida", iguales(totp, datos[0].totp));
  const malo = await lanza(() => normalizarTotp({ secreto: 12345 }), "x");
  anotar("un código de verificación con otro tipo se rechaza", malo !== "sin error", String(malo));
  const escrito = await descifrar(bytes, "  ABACUS\nT SHIRT  zoom\tfelt tip — yo yo · DROP DOWN ", { ahora });
  anotar("ida y vuelta: el código escrito de otra forma", iguales(escrito.contrasenas, datos));
  const otra = await cifrar(datos, codigo, { ahora, ...RAPIDO });
  const a = leerCabecera(bytes).cabecera;
  const b = leerCabecera(otra.bytes).cabecera;
  anotar("dos paquetes iguales: otra sal, otro IV, otro id", a.sal != b.sal && a.iv != b.iv && id != otra.id);
  const texto = new TextDecoder().decode(bytes);
  anotar(
    "nada en claro: ni contraseñas, ni usuarios, ni sitios",
    !texto.includes("contraseña-1") && !texto.includes("usuaria") && !texto.includes("sitio1") && !texto.includes("JBSWY3DP")
  );
  const cab = leerCabecera(bytes);
  anotar(
    "cabecera: solo lo del formato, menos de 512 bytes",
    Object.keys(cab.cabecera).sort().join() == "cifrado,formato,iteraciones,iv,kdf,sal,version" && cab.cabeceraBytes.length < 512,
    new TextDecoder().decode(cab.cabeceraBytes)
  );
}

/* ───────── Código mal escrito ───────── */

await esperarError("código con una palabra cambiada", descifrar(bytes, "abacus t-shirt zoom felt-tip yo-yo dropout", { ahora }), "incorrecto");
await esperarError("código con dos palabras cambiadas de sitio", descifrar(bytes, "t-shirt abacus zoom felt-tip yo-yo drop-down", { ahora }), "incorrecto");
await esperarError("código incompleto (5 palabras)", descifrar(bytes, "abacus t-shirt zoom felt-tip yo-yo", { ahora }), "incorrecto");
await esperarError("código vacío", descifrar(bytes, "", { ahora }), "incorrecto");

/* ───────── Archivo tocado ───────── */

{
  const t = (nombre, cambiar) => esperarError(nombre, () => descifrar(cambiar(bytes.slice()), codigo.join(" "), { ahora }), "incorrecto");
  const fin = bytes.indexOf(0x0a);
  await t("cabecera: iteraciones cambiadas (dentro del rango)", b => conCabecera(b, c => ({ ...c, iteraciones: c.iteraciones + 1 })));
  await t("cabecera: misma información con otros espacios", b => conCabecera(b, JSON.stringify(leerCabecera(b).cabecera, null, 1).replace(/\n/g, "")));
  await t("cabecera: sal cambiada", b => conCabecera(b, c => ({ ...c, sal: otroCaracter(c.sal) })));
  await t("cabecera: IV cambiado", b => conCabecera(b, c => ({ ...c, iv: otroCaracter(c.iv) })));
  await t("cabecera: IV de 11 bytes", b => conCabecera(b, c => ({ ...c, iv: aBase64url(new Uint8Array(11)) })));
  await t("cabecera: sal no canónica", b => conCabecera(b, c => ({ ...c, sal: c.sal.slice(0, -1) + (c.sal.endsWith("A") ? "B" : "A") })));
  await t("cabecera: una clave de más", b => conCabecera(b, c => ({ ...c, nombre: "x" })));
  await t("cabecera: otro kdf", b => conCabecera(b, c => ({ ...c, kdf: "PBKDF2-SHA1" })));
  await t("cabecera: otro formato", b => conCabecera(b, c => ({ ...c, formato: "otro" })));
  await t("cabecera: versión 0", b => conCabecera(b, c => ({ ...c, version: 0 })));
  await t("cabecera: versión «1» como texto", b => conCabecera(b, c => ({ ...c, version: "1" })));
  await t("cabecera: no es JSON", b => conCabecera(b, "{formato:aegisvault}"));
  await t("cifrado: un bit del primer bloque", b => ((b[fin + 1] ^= 1), b));
  await t("cifrado: un bit en medio", b => ((b[fin + 1 + 2000] ^= 0x80), b));
  await t("etiqueta: el último byte", b => ((b[b.length - 1] ^= 1), b));
  await t("separador: sin salto de línea", b => ((b[fin] = 0x20), b));
  await t("recortado: un byte menos", b => b.subarray(0, b.length - 1));
  await t("recortado: sin la etiqueta", b => b.subarray(0, b.length - 16));
  await t("alargado: un byte más", b => {
    const x = new Uint8Array(b.length + 1);
    x.set(b);
    return x;
  });
  await t("vacío", () => new Uint8Array(0));
  await t("otro archivo (texto)", () => new TextEncoder().encode("url,username,password\nhttps://a,b,c\n"));
  await esperarError("versión 2: se dice aparte", () => descifrar(conCabecera(bytes, c => ({ ...c, version: 2 })), codigo.join(" "), { ahora }), "version");
}

/* ───────── Iteraciones fuera de rango (sin gastar tiempo) ───────── */

for (const n of [ITERACIONES_MINIMAS - 1, ITERACIONES_MAXIMAS + 1, 1e12, 0, -1, 1.5, "2000000"]) {
  const inicio = performance.now();
  const r = await lanza(() => descifrar(conCabecera(bytes, c => ({ ...c, iteraciones: n })), codigo.join(" "), { ahora }), "incorrecto");
  const ms = performance.now() - inicio;
  anotar(`iteraciones ${JSON.stringify(n)}: rechazadas antes de derivar`, r === true && ms < 50, `${ms.toFixed(1)} ms`);
}
await esperarError("cifrar con iteraciones bajas", () => cifrar(datos, codigo, { ahora, iteraciones: ITERACIONES_MINIMAS - 1 }), "RangeError");
await esperarError("cifrar con un código que no es de la lista", () => cifrar(datos, ["abacus", "x", "y", "z", "w", "v"], { ahora, ...RAPIDO }), "RangeError");

/* ───────── Caducidad y reloj ───────── */

{
  const ok = await descifrar(bytes, codigo.join(" "), { ahora: ahora + CADUCIDAD_MS });
  anotar("justo a las 24 h: vale", ok.id == id);
  await esperarError("24 h y 1 ms después: caducado", descifrar(bytes, codigo.join(" "), { ahora: ahora + CADUCIDAD_MS + 1 }), "caducado");
  await esperarError("una semana después: caducado", descifrar(bytes, codigo.join(" "), { ahora: ahora + 7 * CADUCIDAD_MS }), "caducado");
  const antes = await descifrar(bytes, codigo.join(" "), { ahora: ahora - MARGEN_RELOJ_MS });
  anotar("hasta 5 min «del futuro»: vale", antes.id == id);
  await esperarError("más de 5 min «del futuro»: reloj", descifrar(bytes, codigo.join(" "), { ahora: ahora - MARGEN_RELOJ_MS - 1 }), "reloj");
  await esperarError("caducado con el código mal: dice «incorrecto», no «caducado»", descifrar(bytes, "abacus abdomen abide abiding ability ablaze", { ahora: ahora + 7 * CADUCIDAD_MS }), "incorrecto");
}

/* ───────── Un solo uso ───────── */

{
  let lista = usosVigentes(JSON.parse("[]"), ahora);
  comprobarUso(lista, id);
  lista = apuntarUso(lista, id, ahora, ahora);
  await esperarError("el mismo paquete otra vez: usado", () => comprobarUso(usosVigentes(lista, ahora + 1000), id), "usado");
  const otro = await cifrar(datos, codigo, { ahora, ...RAPIDO });
  anotar("otro paquete con el mismo código: vale", (await lanza(() => comprobarUso(usosVigentes(lista, ahora), otro.id), "usado")) === "sin error");
  const tarde = ahora + CADUCIDAD_MS + MARGEN_RELOJ_MS + 1;
  anotar("pasadas 24 h (más el margen), se olvida (ya caducaría)", usosVigentes(lista, tarde).length == 0);
  anotar("basura en la lista: se limpia", usosVigentes([["a", 1], "x", [1, 2], ["b", ahora, 3], null, ["c", ahora]], ahora).length == 1);
  let muchos = [];
  for (let i = 0; i < 1100; i++) {
    muchos = apuntarUso(muchos, `id${i}`, ahora, ahora);
  }
  anotar("como mucho 1000 recordados (los últimos)", muchos.length == 1000 && muchos.at(-1)[0] == "id1099");
  anotar("apuntar dos veces el mismo no lo repite", apuntarUso(apuntarUso([], id, ahora, ahora), id, ahora, ahora).length == 1);
}

/* ───────── Tamaño con relleno ───────── */

const tamanos = [];
{
  for (const n of [0, 1, 5, 10, 11, 50, 200, 1000]) {
    const paquete = await cifrar(ejemplo(n), codigo, { ahora, ...RAPIDO });
    const { cifrado } = leerCabecera(paquete.bytes);
    tamanos.push({ contrasenas: n, archivo: paquete.bytes.length, cifrado: cifrado.length });
    anotar(`${n} contraseñas: cifrado = múltiplo de 4096 + 16`, (cifrado.length - 16) % BLOQUE == 0, `${paquete.bytes.length} bytes`);
  }
  const t = Object.fromEntries(tamanos.map(x => [x.contrasenas, x.archivo]));
  anotar("0, 1, 5 y 10 contraseñas: el mismo tamaño", t[0] == t[1] && t[1] == t[5] && t[5] == t[10], `${t[0]} bytes`);
  anotar("tamanoConRelleno", tamanoConRelleno(0) == 4096 && tamanoConRelleno(4092) == 4096 && tamanoConRelleno(4093) == 8192);
  const vacio = await descifrar((await cifrar([], codigo, { ahora, ...RAPIDO })).bytes, codigo.join(" "), { ahora });
  anotar("paquete sin contraseñas: se abre y está vacío", vacio.contrasenas.length == 0);
}

/* ───────── Tiempo con las iteraciones de serie ───────── */

const tiempos = {};
{
  let inicio = performance.now();
  const serie = await cifrar(datos, codigo, { ahora });
  tiempos.cifrar_ms = Math.round(performance.now() - inicio);
  inicio = performance.now();
  await descifrar(serie.bytes, codigo.join(" "), { ahora });
  tiempos.descifrar_ms = Math.round(performance.now() - inicio);
  anotar(
    `iteraciones de serie (${ITERACIONES}): en la cabecera`,
    leerCabecera(serie.bytes).cabecera.iteraciones == ITERACIONES,
    `cifrar ${tiempos.cifrar_ms} ms, descifrar ${tiempos.descifrar_ms} ms (node ${process.version})`
  );
}

console.log(`\n${fallos ? "✗" : "✓"} ${resultados.length - fallos} de ${resultados.length} pruebas`);
if (process.argv[2]) {
  writeFileSync(
    process.argv[2],
    JSON.stringify({ fecha: new Date().toISOString(), node: process.version, fallos, pruebas: resultados, tamanos, tiempos }, null, 2) + "\n"
  );
}
process.exit(fallos ? 1 : 0);
