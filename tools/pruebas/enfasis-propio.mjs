// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

// Aegis · prueba del énfasis personalizado y de los temas (overlay/browser/components/aegis/enfasis-propio.sys.mjs,
// estilos/tokens.css, docs/DISENO.md §2): conversiones hexadecimal/RGB/HSV/OKLab, validación, la fórmula de tokens.css
// y su contraste en claro y en oscuro (temas y cualquier color que elija el usuario), la lista de guardados (guardar,
// actualizar, borrar, límite, tamaño de la pref) y que los textos y los módulos nuevos estén completos y sin red ni
// temporizadores. Sin navegador y sin red.
//
//   node tools/pruebas/enfasis-propio.mjs [--json <archivo>]     (en WSL: ~/.mozbuild/node/bin/node)
//
// Sale con 1 si algo falla.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import * as E from "../../overlay/browser/components/aegis/enfasis-propio.sys.mjs";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const AEGIS = join(REPO, "overlay", "browser", "components", "aegis");
const leer = (...partes) => readFileSync(join(...partes), "utf8");

let fallos = 0;
let pruebas = 0;
const resumen = {};
function comprobar(condicion, mensaje) {
  pruebas++;
  if (!condicion) {
    fallos++;
    console.log(`✗ ${mensaje}`);
  }
}
function bloque(nombre, fn) {
  const antes = fallos;
  fn();
  console.log(`${fallos == antes ? "✓" : "✗"} ${nombre}`);
}

// ── Hexadecimal ──────────────────────────────────────────────────────────────────────────────────────────────────

bloque("hexadecimal: normalizar y validar", () => {
  const casos = [
    ["#88C0DC", "#88c0dc"],
    ["88c0dc", "#88c0dc"],
    ["  #8cd ", "#88ccdd"],
    ["fff", "#ffffff"],
    ["#000000", "#000000"],
    ["#88c0d", null],
    ["#88c0dcff", null],
    ["#ggg", null],
    ["", null],
    ["#", null],
    ["rgb(1, 2, 3)", null],
    ["#88c0dc;background:url(x)", null],
    [null, null],
    [123, null],
    [{}, null],
  ];
  for (const [entrada, esperado] of casos) {
    comprobar(E.normalizarHex(entrada) === esperado, `normalizarHex(${JSON.stringify(entrada)}) = ${E.normalizarHex(entrada)}`);
  }
});

bloque("RGB ↔ hex ↔ HSV: ida y vuelta exacta (4096 colores)", () => {
  for (let r = 0; r < 256; r += 17) {
    for (let g = 0; g < 256; g += 17) {
      for (let b = 0; b < 256; b += 17) {
        const hex = E.rgbAHex([r, g, b]);
        comprobar(JSON.stringify(E.hexARgb(hex)) == JSON.stringify([r, g, b]), `hexARgb(${hex})`);
        const { h, s, v } = E.rgbAHsv([r, g, b]);
        comprobar(E.rgbAHex(E.hsvARgb(h, s, v)) == hex, `HSV ida y vuelta de ${hex}`);
      }
    }
  }
});

bloque("HSV: valores conocidos y tono de los grises", () => {
  const casos = [
    [[0, 1, 1], "#ff0000"],
    [[120, 1, 1], "#00ff00"],
    [[240, 1, 1], "#0000ff"],
    [[60, 1, 1], "#ffff00"],
    [[360, 1, 1], "#ff0000"],
    [[-120, 1, 1], "#0000ff"],
    [[200, 0, 1], "#ffffff"],
    [[200, 0.5, 0], "#000000"],
    [[200, 0, 0.5], "#808080"],
  ];
  for (const [[h, s, v], hex] of casos) {
    comprobar(E.rgbAHex(E.hsvARgb(h, s, v)) == hex, `hsvARgb(${h}, ${s}, ${v}) = ${E.rgbAHex(E.hsvARgb(h, s, v))}`);
  }
  // Un gris conserva el tono anterior (el cuadro no salta al rojo).
  comprobar(E.rgbAHsv([128, 128, 128], 210).h == 210, "un gris conserva el tono previo");
  comprobar(E.rgbAHsv([0, 0, 0], 90).h == 90, "el negro conserva el tono previo");
  const azul = E.rgbAHsv(E.hexARgb("#3366cc"));
  comprobar(Math.abs(azul.h - 220) < 0.01 && Math.abs(azul.s - 0.75) < 0.001 && Math.abs(azul.v - 0.8) < 0.001,
    `rgbAHsv(#3366cc) = ${JSON.stringify(azul)}`);
});

bloque("OKLab ↔ sRGB: ida y vuelta", () => {
  let peor = 0;
  for (let r = 0; r < 256; r += 15) {
    for (let g = 0; g < 256; g += 15) {
      for (let b = 0; b < 256; b += 15) {
        const vuelta = E.rgbDeOklab(...E.oklab(r, g, b));
        peor = Math.max(peor, Math.abs(vuelta[0] - r), Math.abs(vuelta[1] - g), Math.abs(vuelta[2] - b));
      }
    }
  }
  comprobar(peor < 0.01, `error máximo de OKLab ida y vuelta: ${peor}`);
  // Referencias de OKLab (Björn Ottosson): blanco L = 1, rojo puro ≈ (0,628 0,2577 29,23°).
  const [L, C, h] = E.oklch(255, 0, 0);
  comprobar(Math.abs(L - 0.628) < 0.001 && Math.abs(C - 0.2577) < 0.001 && Math.abs(h - 29.23) < 0.05, `oklch(rojo) = ${L} ${C} ${h}`);
  comprobar(Math.abs(E.oklab(255, 255, 255)[0] - 1) < 1e-6, "L del blanco = 1");
});

// ── La fórmula de tokens.css ─────────────────────────────────────────────────────────────────────────────────────

const tokens = leer(AEGIS, "estilos", "tokens.css");
const enfasisMjs = leer(AEGIS, "enfasis.sys.mjs");
const temas = Object.fromEntries(
  [...tokens.matchAll(/--aegis-enfasis-([a-z]+): oklch\(([\d.]+) ([\d.]+) ([\d.]+)\);/g)].map(m => [m[1], m.slice(2).map(Number)])
);
const ENFASIS = JSON.parse(
  /export const ENFASIS = (\[[^\]]*\]);/.exec(enfasisMjs)[1].replace(/,\s*\]/, "]")
);
const TEMAS = ENFASIS.filter(e => !["monocromo", "windows", "fondo"].includes(e));

bloque("tokens.css: las bandas de la fórmula son las de enfasis-propio.sys.mjs", () => {
  const oscuro = /--aegis-accent: oklch\(from var\(--aegis-enfasis-base\) clamp\(([\d.]+), l, ([\d.]+)\) min\(c, ([\d.]+)\) h\);/.exec(tokens);
  const claro = [...tokens.matchAll(/--aegis-accent: oklch\(from var\(--aegis-enfasis-base\) clamp\(([\d.]+), l, ([\d.]+)\) min\(c, ([\d.]+)\) h\);/g)][1];
  comprobar(oscuro && claro, "no se encuentra la fórmula en tokens.css");
  const deCss = m => ({ minimo: Number(m[1]), maximo: Number(m[2]), croma: Number(m[3]) });
  comprobar(JSON.stringify(deCss(oscuro)) == JSON.stringify(E.BANDAS.oscuro), `banda oscura: ${JSON.stringify(deCss(oscuro))}`);
  comprobar(JSON.stringify(deCss(claro)) == JSON.stringify(E.BANDAS.claro), `banda clara: ${JSON.stringify(deCss(claro))}`);
  // El segundo color usa la misma banda.
  for (const [esq, banda] of Object.entries(E.BANDAS)) {
    const patron = `--aegis-accent-2: oklch(from var(--aegis-enfasis-base-2, var(--aegis-enfasis-base)) clamp(${banda.minimo.toFixed(2)}, l, ${banda.maximo.toFixed(2)}) min(c, ${banda.croma.toFixed(2)}) h);`;
    comprobar(tokens.includes(patron), `--aegis-accent-2 (${esq}) con la misma banda`);
  }
  comprobar(tokens.includes("--aegis-on-accent: #0b0b0c;") && tokens.includes("--aegis-on-accent: #ffffff;"), "on-accent");
});

const SUPERFICIES = {
  oscuro: { bg: "#0a0a0b", sidebar: "#0f0f11", surface: "#151517", dialog: "#131315", menu: "#1a1a1d" },
  claro: { bg: "#f5f5f7", sidebar: "#ececef", surface: "#ffffff", dialog: "#ffffff", menu: "#ffffff" },
};

function aplicadoDeOklch([L, C, h], esquema) {
  const b = E.BANDAS[esquema];
  return E.rgbAHex(E.rgbDeOklch(Math.min(b.maximo, Math.max(b.minimo, L)), Math.min(C, b.croma), h));
}

bloque("temas: 13, cada uno con su base, su regla y su nombre en los seis idiomas", () => {
  comprobar(ENFASIS.length == 16 && TEMAS.length == 13, `ENFASIS: ${ENFASIS.length} (temas ${TEMAS.length})`);
  // Fila 1: Monocromo y los dos automáticos; luego los temas y el «+»: dos filas llenas de siete.
  comprobar((TEMAS.length + 1) % 7 == 0, "los temas y el «+» llenan filas de siete");
  for (const t of TEMAS) {
    comprobar(temas[t], `falta --aegis-enfasis-${t} en tokens.css`);
    comprobar(tokens.includes(`:root[aegis-enfasis="${t}"], [aegis-enfasis-muestra="${t}"] { --aegis-enfasis-base: var(--aegis-enfasis-${t}); }`),
      `falta la regla de ${t} en tokens.css`);
  }
  for (const idioma of ["es-ES", "en-US", "pt-BR", "fr", "de", "it"]) {
    const ftl = leer(AEGIS, "locales", idioma, "aegis.ftl");
    for (const e of ENFASIS) {
      comprobar(new RegExp(`^aegis-enfasis-${e} = \\S`, "m").test(ftl), `${idioma}: falta aegis-enfasis-${e}`);
    }
  }
});

bloque("temas: los valores de DISENO §2 salen de la fórmula", () => {
  const diseno = leer(REPO, "docs", "DISENO.md");
  const filas = [...diseno.matchAll(/^\| ([A-ZÁÉÍÓÚ][a-záéíóú]+) \| ([\d,]+) ([\d,]+) (\d+) \| `(#[0-9a-f]{6})` \| `(#[0-9a-f]{6})` \|$/gm)];
  comprobar(filas.length == 13, `filas de la tabla de temas en DISENO: ${filas.length}`);
  const tabla = {};
  for (const f of filas) {
    const base = [f[2], f[3], f[4]].map(x => Number(x.replace(",", ".")));
    const o = aplicadoDeOklch(base, "oscuro");
    const c = aplicadoDeOklch(base, "claro");
    tabla[f[1]] = { base, oscuro: o, claro: c };
    comprobar(o == f[5] && c == f[6], `${f[1]}: DISENO dice ${f[5]} / ${f[6]}, la fórmula da ${o} / ${c}`);
  }
  // Y que las bases de la tabla son las de tokens.css.
  const bases = new Set(Object.values(temas).map(b => b.join(" ")));
  for (const [nombre, { base }] of Object.entries(tabla)) {
    comprobar(bases.has(base.join(" ")), `${nombre}: la base de DISENO no está en tokens.css`);
  }
  resumen.temas = tabla;
});

bloque("temas: contraste AA y distintos entre sí en claro y en oscuro", () => {
  const datos = {};
  for (const t of TEMAS) {
    const fila = {};
    for (const esq of ["oscuro", "claro"]) {
      const acento = aplicadoDeOklch(temas[t], esq);
      const sobre = E.contraste(acento, E.SOBRE_ENFASIS[esq]);
      const marca = Math.min(...Object.values(SUPERFICIES[esq]).map(f => E.contraste(acento, f)));
      fila[esq] = { acento, sobre: +sobre.toFixed(2), marca: +marca.toFixed(2) };
      comprobar(sobre >= (esq == "oscuro" ? 6 : 5.3), `${t} (${esq}): texto encima ${sobre.toFixed(2)}:1`);
      comprobar(marca >= 4.5, `${t} (${esq}): marca sobre las superficies ${marca.toFixed(2)}:1`);
      comprobar(E.textoSobre(acento) == E.SOBRE_ENFASIS[esq], `${t} (${esq}): el texto encima no es el de más contraste`);
    }
    datos[t] = fila;
  }
  resumen.contrasteTemas = datos;
  let minimo = Infinity;
  let par = "";
  for (const esq of ["oscuro", "claro"]) {
    for (let i = 0; i < TEMAS.length; i++) {
      for (let j = i + 1; j < TEMAS.length; j++) {
        const a = E.oklab(...E.hexARgb(aplicadoDeOklch(temas[TEMAS[i]], esq)));
        const b = E.oklab(...E.hexARgb(aplicadoDeOklch(temas[TEMAS[j]], esq)));
        const d = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
        if (d < minimo) {
          minimo = d;
          par = `${TEMAS[i]}–${TEMAS[j]} (${esq})`;
        }
      }
    }
  }
  resumen.distanciaMinima = { distancia: +minimo.toFixed(3), par };
  comprobar(minimo >= 0.037, `dos temas demasiado parecidos: ${par}, ${minimo.toFixed(3)}`);
  console.log(`  distancia mínima entre temas: ${minimo.toFixed(3)} (${par})`);
});

bloque("personalizado: cualquier color cumple el contraste en claro y en oscuro (32 768 colores)", () => {
  const minimos = {
    oscuro: { sobre: Infinity, marca: Infinity, peorSobre: "", peorMarca: "" },
    claro: { sobre: Infinity, marca: Infinity, peorSobre: "", peorMarca: "" },
  };
  let recortados = 0;
  let textoDistinto = 0;
  for (let r = 0; r < 256; r += 8) {
    for (let g = 0; g < 256; g += 8) {
      for (let b = 0; b < 256; b += 8) {
        const hex = E.rgbAHex([r, g, b]);
        for (const esq of ["oscuro", "claro"]) {
          const banda = E.BANDAS[esq];
          const [L, C, h] = E.oklch(r, g, b);
          const crudo = E.rgbDeOklch(Math.min(banda.maximo, Math.max(banda.minimo, L)), Math.min(C, banda.croma), h);
          if (crudo.some(v => v < -0.5 || v > 255.5)) {
            recortados++;
          }
          const acento = E.enfasisAplicado(hex, esq);
          const sobre = E.contraste(acento, E.SOBRE_ENFASIS[esq]);
          const marca = Math.min(...Object.values(SUPERFICIES[esq]).map(f => E.contraste(acento, f)));
          const m = minimos[esq];
          if (sobre < m.sobre) {
            m.sobre = sobre;
            m.peorSobre = hex;
          }
          if (marca < m.marca) {
            m.marca = marca;
            m.peorMarca = hex;
          }
          if (E.textoSobre(acento) != E.SOBRE_ENFASIS[esq]) {
            textoDistinto++;
          }
        }
      }
    }
  }
  for (const [esq, m] of Object.entries(minimos)) {
    console.log(`  ${esq}: texto encima ≥ ${m.sobre.toFixed(2)}:1 (peor ${m.peorSobre}), marca ≥ ${m.marca.toFixed(2)}:1 (peor ${m.peorMarca})`);
    // DISENO §2: oscuro ≥ 6:1 encima y ≥ 5,2:1 de marca; claro ≥ 5,3:1 y ≥ 4,5:1. Y siempre AA (4,5:1) y cMarca (3:1).
    comprobar(m.sobre >= (esq == "oscuro" ? 7.4 : 6), `${esq}: texto encima ${m.sobre.toFixed(2)}:1 con ${m.peorSobre}`);
    comprobar(m.marca >= (esq == "oscuro" ? 5.2 : 4.5), `${esq}: marca ${m.marca.toFixed(2)}:1 con ${m.peorMarca}`);
  }
  comprobar(textoDistinto == 0, `${textoDistinto} colores en los que el texto fijo encima no es el de más contraste`);
  console.log(`  ${recortados} de ${2 * 32 ** 3} casos quedan fuera de sRGB y se recortan por canal (el contraste de arriba ya los cuenta)`);
  resumen.contrastePersonalizado = Object.fromEntries(
    Object.entries(minimos).map(([k, m]) => [k, { sobre: +m.sobre.toFixed(2), marca: +m.marca.toFixed(2), peorSobre: m.peorSobre, peorMarca: m.peorMarca }])
  );
  resumen.recortados = recortados;
});

bloque("personalizado: colores extremos (primarios, blanco, negro)", () => {
  for (const hex of ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#00ffff", "#ff00ff", "#ffffff", "#000000", "#808080"]) {
    for (const esq of ["oscuro", "claro"]) {
      const acento = E.enfasisAplicado(hex, esq);
      comprobar(E.contraste(acento, E.SOBRE_ENFASIS[esq]) >= 4.5, `${hex} (${esq}) → ${acento}`);
    }
  }
});

// ── El énfasis personalizado y los guardados ─────────────────────────────────────────────────────────────────────

bloque("validarAcento", () => {
  const v = E.validarAcento;
  comprobar(JSON.stringify(v({ c: "#88C0DC" })) == '{"c":"#88c0dc"}', "solo color");
  comprobar(JSON.stringify(v({ c: "88c0dc", c2: "#E1909F", n: "  Mar  y   fresa " })) == '{"c":"#88c0dc","c2":"#e1909f","n":"Mar y fresa"}', "con degradado y nombre");
  comprobar(JSON.stringify(v({ c: "#88c0dc", c2: "#88C0DC" })) == '{"c":"#88c0dc"}', "c2 igual a c no es degradado");
  comprobar(JSON.stringify(v({ c: "#88c0dc", c2: "" })) == '{"c":"#88c0dc"}', "c2 vacío");
  comprobar(v({ c: "#88c0dc", c2: "rojo" }) === null, "c2 no válido");
  for (const malo of [null, undefined, "", "#88c0dc", 5, [], [{ c: "#88c0dc" }], {}, { c: "" }, { c: "url(x)" }, { n: "x" }]) {
    comprobar(v(malo) === null, `no válido: ${JSON.stringify(malo)}`);
  }
  comprobar(v({ c: "#88c0dc", n: 42 }).n === undefined, "nombre que no es texto");
  comprobar(v({ c: "#88c0dc", n: "   " }).n === undefined, "nombre vacío");
  const largo = v({ c: "#88c0dc", n: "😀".repeat(40) }).n;
  comprobar([...largo].length == E.MAXIMO_NOMBRE, `nombre largo recortado a ${[...largo].length} caracteres`);
  const control = v({ c: "#88c0dc", n: "a\u0000b\nc\u202Ed\u2028e\u200Ff" }).n;
  comprobar(control == "a b c d e f", `nombre con caracteres de control: ${JSON.stringify(control)}`);
  comprobar(v({ c: "#88c0dc", n: "<img src=x onerror=alert(1)>" }).n.length <= E.MAXIMO_NOMBRE, "nombre con HTML: se recorta (y se pinta como texto)");
  comprobar(E.clave(v({ c: "#88c0dc", c2: "#e1909f", n: "x" })) == "#88c0dc>#e1909f", "clave con degradado");
  comprobar(E.clave(v({ c: "#88c0dc", n: "y" })) == "#88c0dc", "clave sin degradado");
});

bloque("leerPropio y leerGuardados", () => {
  comprobar(E.leerPropio("") === null && E.leerPropio("no es json") === null && E.leerPropio("[]") === null, "propio vacío o roto");
  comprobar(JSON.stringify(E.leerPropio('{"c":"#ABCDEF","x":1}')) == '{"c":"#abcdef"}', "propio válido (sin campos de más)");
  comprobar(JSON.stringify(E.leerGuardados("")) == "[]" && JSON.stringify(E.leerGuardados("{}")) == "[]", "guardados vacíos o no lista");
  comprobar(JSON.stringify(E.leerGuardados("[")) == "[]", "guardados con JSON roto");
  comprobar(JSON.stringify(E.leerGuardados("x".repeat(17 * 1024))) == "[]", "pref demasiado grande");
  const mezcla = JSON.stringify([{ c: "#111111" }, { c: "malo" }, null, { c: "#111111", n: "repetido" }, { c: "#111111", c2: "#222222" }, 7]);
  const lista = E.leerGuardados(mezcla);
  comprobar(lista.length == 2 && !lista[0].n && lista[1].c2 == "#222222", `mezcla: ${JSON.stringify(lista)}`);
  const muchos = JSON.stringify(Array.from({ length: 40 }, (_, i) => ({ c: E.rgbAHex([i, i, i]) })));
  comprobar(E.leerGuardados(muchos).length == E.MAXIMO_GUARDADOS, "como mucho 24 al leer");
});

bloque("guardar, actualizar, borrar y límite", () => {
  let lista = [];
  let r = E.guardarEn(lista, { c: "#88c0dc", n: "Hielo mío" });
  comprobar(r.resultado == "nuevo" && r.lista.length == 1, "guardar uno nuevo");
  lista = r.lista;
  r = E.guardarEn(lista, { c: "#88C0DC" });
  comprobar(r.resultado == "actualizado" && r.lista[0].n == "Hielo mío", "guardar el mismo sin nombre conserva el nombre");
  r = E.guardarEn(lista, { c: "#88c0dc", n: "Otro nombre" });
  comprobar(r.resultado == "actualizado" && r.lista.length == 1 && r.lista[0].n == "Otro nombre", "guardar el mismo con nombre lo cambia");
  lista = r.lista;
  r = E.guardarEn(lista, { c: "#88c0dc", c2: "#e1909f" });
  comprobar(r.resultado == "nuevo" && r.lista.length == 2, "el mismo color con degradado es otro");
  lista = r.lista;
  comprobar(E.guardarEn(lista, { c: "malo" }).resultado == "invalido", "inválido");
  comprobar(lista.length == 2, "la lista no se toca en sitio");
  for (let i = 0; lista.length < E.MAXIMO_GUARDADOS; i++) {
    lista = E.guardarEn(lista, { c: E.rgbAHex([i, 100, 200]) }).lista;
  }
  comprobar(lista.length == 24, "24 guardados");
  r = E.guardarEn(lista, { c: "#123456" });
  comprobar(r.resultado == "lleno" && r.lista.length == 24, "el 25.º no cabe");
  r = E.guardarEn(lista, { c: "#88c0dc", n: "Cambiado" });
  comprobar(r.resultado == "actualizado", "con la lista llena se puede renombrar uno");
  const sinUno = E.borrarDe(lista, "#88c0dc>#e1909f");
  comprobar(sinUno.length == 23 && !sinUno.some(a => a.c2), "borrar por clave");
  comprobar(E.borrarDe(lista, "#nada").length == 24, "borrar una clave que no está");
  comprobar(E.guardarEn(sinUno, { c: "#123456" }).resultado == "nuevo", "tras borrar, vuelve a caber");
  // Ida y vuelta por la pref.
  comprobar(JSON.stringify(E.leerGuardados(JSON.stringify(lista))) == JSON.stringify(lista), "ida y vuelta por JSON");
});

bloque("tamaño de la pref en el peor caso (24 con degradado y los nombres que más ocupan en JSON)", () => {
  // Lo que más ocupa por carácter en JSON: un sustituto suelto (\udXXX, 6 bytes; se quita), una comilla o una barra
  // (2 bytes) y un carácter fuera del plano básico (4 bytes en UTF-8).
  const nombres = ["\uD83D".repeat(30), '"'.repeat(30), "\\".repeat(30), "😀".repeat(30), "\uDE00a".repeat(15)];
  let bytes = 0;
  for (const n of nombres) {
    const peor = Array.from({ length: 24 }, (_, i) => E.validarAcento({ c: E.rgbAHex([i, 0, 0]), c2: E.rgbAHex([0, i, 0]), n }));
    bytes = Math.max(bytes, Buffer.byteLength(JSON.stringify(peor), "utf8"));
  }
  comprobar(E.validarAcento({ c: "#000000", n: "a\uD83Db\uDE00c" }).n == "a b c", "los sustitutos sueltos se quitan");
  comprobar(E.validarAcento({ c: "#000000", n: "😀" }).n == "😀", "un par de sustitutos (emoji) se queda");
  resumen.bytesPeorCaso = bytes;
  console.log(`  ${bytes} bytes`);
  // Por debajo de los 4 KB que Gecko aconseja para una pref (MAX_ADVISABLE_PREF_LENGTH).
  comprobar(bytes < 4096, `la pref de guardados ocupa ${bytes} bytes`);
});

bloque("contraste también encima y pulsado (las variantes de la fórmula)", () => {
  // tokens.css: oscuro encima +0,04 y pulsado −0,06; claro encima −0,05 y pulsado +0,03. Mínimos de DISENO §2.
  const variantes = {
    oscuro: { encima: [0.04, 8.6], pulsado: [-0.06, 5.9] },
    claro: { encima: [-0.05, 7.3], pulsado: [0.03, 5.3] },
  };
  comprobar(tokens.includes("calc(clamp(0.72, l, 0.80) + 0.04)") && tokens.includes("calc(clamp(0.72, l, 0.80) - 0.06)") &&
    tokens.includes("calc(clamp(0.40, l, 0.48) - 0.05)") && tokens.includes("calc(clamp(0.40, l, 0.48) + 0.03)"),
    "las variantes de tokens.css son las de esta prueba");
  resumen.contrasteVariantes = {};
  for (const [esq, lista] of Object.entries(variantes)) {
    const b = E.BANDAS[esq];
    for (const [nombre, [delta, minimo]] of Object.entries(lista)) {
      let peor = Infinity;
      for (let h = 0; h < 360; h += 2) {
        for (let C = 0; C <= b.croma + 1e-9; C += 0.01) {
          for (const L of [b.minimo, (b.minimo + b.maximo) / 2, b.maximo]) {
            const hex = E.rgbAHex(E.rgbDeOklch(L + delta, C, h));
            peor = Math.min(peor, E.contraste(hex, E.SOBRE_ENFASIS[esq]));
          }
        }
      }
      resumen.contrasteVariantes[`${esq}-${nombre}`] = +peor.toFixed(2);
      console.log(`  ${esq}, ${nombre}: texto encima ≥ ${peor.toFixed(2)}:1`);
      comprobar(peor >= minimo && peor >= 4.5, `${esq} ${nombre}: ${peor.toFixed(2)}:1 (DISENO dice ≥ ${minimo})`);
    }
  }
});

// ── Módulos y textos ─────────────────────────────────────────────────────────────────────────────────────────────

bloque("módulos nuevos: sin red, sin temporizadores y sin HTML en texto", () => {
  for (const archivo of ["enfasis-propio.sys.mjs", "selector-enfasis.sys.mjs", "enfasis.sys.mjs", "paginas/personalizar.sys.mjs"]) {
    // Sin comentarios ni los espacios de nombres de XHTML y SVG (identificadores, no direcciones que se abran).
    const codigo = leer(AEGIS, archivo)
      .replace(/^\s*(\*|\/\/).*$/gm, "")
      .replace(/"http:\/\/www\.w3\.org\/(1999\/xhtml|2000\/svg)"/g, "");
    for (const prohibido of [/\bfetch\(/, /XMLHttpRequest/, /newChannel/, /https?:\/\//, /\bsetTimeout\(/, /\bsetInterval\(/,
      /requestAnimationFrame/, /\binnerHTML\b/, /\bouterHTML\b/, /insertAdjacentHTML/, /\beval\(/]) {
      comprobar(!prohibido.test(codigo), `${archivo}: ${prohibido}`);
    }
  }
});

bloque("textos: los ids que usa el código están en los seis idiomas, con los mismos argumentos", () => {
  const codigo = ["selector-enfasis.sys.mjs", "paginas/personalizar.sys.mjs", "ajustes.sys.mjs"].map(a => leer(AEGIS, a)).join("\n");
  const ids = [...new Set([...codigo.matchAll(/"(aegis-enfasis-propio[a-z0-9-]*)"/g)].map(m => m[1]))];
  comprobar(ids.length >= 35, `ids encontrados: ${ids.length}`);
  const argumentos = {};
  for (const idioma of ["en-US", "es-ES", "pt-BR", "fr", "de", "it"]) {
    const ftl = leer(AEGIS, "locales", idioma, "aegis.ftl");
    for (const id of ids) {
      const m = new RegExp(`^${id} = (.+)$`, "m").exec(ftl);
      comprobar(m, `${idioma}: falta ${id}`);
      if (!m) {
        continue;
      }
      const args = [...m[1].matchAll(/\{ \$([a-z0-9]+) \}/g)].map(a => a[1]).sort().join(",");
      argumentos[id] ??= args;
      comprobar(argumentos[id] == args, `${idioma}: ${id} usa {${args}} y en-US {${argumentos[id]}}`);
      comprobar(!/Firefox|Mozilla/.test(m[1]), `${idioma}: ${id} nombra una marca`);
    }
  }
});

console.log(`\n${fallos ? "✗" : "✓"} ${pruebas - fallos} de ${pruebas} comprobaciones`);
const json = process.argv.indexOf("--json");
if (json > 0) {
  writeFileSync(process.argv[json + 1], JSON.stringify({ fecha: new Date().toISOString(), pruebas, fallos, ...resumen }, null, 2) + "\n");
}
process.exit(fallos ? 1 : 0);
