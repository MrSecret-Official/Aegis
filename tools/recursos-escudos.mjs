/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · recursos de Escudos: junta, al construir Aegis, los recursos neutros y los scriptlets que usan las listas
 * ($redirect y ##+js) en el formato `Resource` de adblock-rust. Lo lanza `aegis.py recursos-escudos` con el Node de
 * mozbuild sobre las fuentes ya verificadas (sha256 de upstream.json); el navegador nunca descarga nada de esto.
 *
 *   node recursos-escudos.mjs <uBlock-x.y.z> <adblock-resources-…> <salida.json>
 *
 * - Scriptlets de uBlock Origin (src/js/resources/scriptlets.js, un módulo ES): cada uno con su código
 *   (fn.toString()), alias, dependencias (las funciones «.fn», tipo fn/javascript) y permiso: los que piden confianza
 *   (requiresTrust) y todos los que se llaman «trusted-*» (en 1.75.0, trusted-prevent-xhr no lo pide) llevan el bit 0
 *   del PermissionMask, que solo tienen las listas de uBlock Origin.
 *   Es lo mismo que hace Brave (brave-core-crx-packager, lib/adBlockRustUtils.js).
 * - Recursos neutros de uBlock Origin (src/web_accessible_resources/, con el índice de src/js/redirect-resources.js):
 *   nombre, alias y tipo por la extensión, como el ensamblador de adblock-rust (resource_assembler.rs). Los que
 *   necesitan parámetros (click2load.html) no sirven para una redirección data: y se quedan fuera. Los que uBO marca
 *   con requiresTrust (google-ima-dai.js, que hace peticiones con credenciales) llevan el bit 0: adblock-rust no sirve
 *   como $redirect un recurso con permiso, así que una regla que lo pida corta la petición.
 * - Recursos de Brave (adblock-resources: metadata.json y resources/).
 *
 * Un nombre o alias repetido se queda con el primero (scriptlets, luego recursos de uBO, luego Brave) y se avisa.
 */

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const [ubo, brave, salida] = process.argv.slice(2);
if (!ubo || !brave || !salida) {
  console.error("uso: node recursos-escudos.mjs <uBlock-x.y.z> <adblock-resources-…> <salida.json>");
  process.exit(2);
}

const MIME = {
  css: "text/css",
  gif: "image/gif",
  html: "text/html",
  js: "application/javascript",
  json: "application/json",
  mp3: "audio/mp3",
  mp4: "video/mp4",
  png: "image/png",
  txt: "text/plain",
  xml: "text/xml",
};
const mimeDe = nombre => MIME[path.extname(nombre).slice(1)] ?? "application/octet-stream";
const TEXTO = new Set(["application/javascript", "text/html", "text/plain"]);
const base64 = datos => Buffer.from(datos).toString("base64");

const recursos = [];
const usados = new Map();
const avisos = [];

function anadir(r, origen) {
  const nombres = [r.name, ...(r.aliases ?? [])];
  const repetido = nombres.find(n => usados.has(n));
  if (repetido) {
    avisos.push(`${origen}: «${repetido}» ya viene de ${usados.get(repetido)}; se queda el primero`);
    return;
  }
  for (const n of nombres) {
    usados.set(n, origen);
  }
  recursos.push(r);
}

// ── Scriptlets de uBlock Origin ──
const { builtinScriptlets } = await import(pathToFileURL(path.join(ubo, "src/js/resources/scriptlets.js")).href);
let scriptlets = 0;
let deConfianza = 0;
for (const s of builtinScriptlets) {
  if (typeof s.fn != "function" || typeof s.name != "string") {
    throw new Error(`scriptlet sin función o sin nombre: ${JSON.stringify(s.name)}`);
  }
  const codigo = s.fn.toString();
  const dependencia = s.name.endsWith(".fn");
  // Lo que se inyecta lo llama adblock-rust por su nombre: tiene que ser «function nombre(». Una dependencia se pega
  // tal cual delante (puede ser una clase, como ArglistParser).
  if (!dependencia && !/^function\s+[^()\s{}]+\s*\(/.test(codigo)) {
    throw new Error(`${s.name}: no empieza por «function nombre(» (adblock-rust no sabría llamarlo)`);
  }
  if (dependencia && !/^(?:async\s+)?(?:function\s*\*?\s*|class\s+)[^()\s{}]+/.test(codigo)) {
    throw new Error(`${s.name}: una dependencia tiene que ser una función o una clase con nombre`);
  }
  const dependencias = (s.dependencies ?? []).map(d => (typeof d == "function" ? d.details?.name : d));
  if (dependencias.some(d => typeof d != "string")) {
    throw new Error(`${s.name}: una dependencia sin nombre`);
  }
  const r = {
    name: s.name,
    aliases: s.aliases ?? [],
    kind: { mime: dependencia ? "fn/javascript" : "application/javascript" },
    content: base64(codigo),
  };
  if (dependencias.length) {
    r.dependencies = dependencias;
  }
  if (s.requiresTrust || s.name.startsWith("trusted-")) {
    r.permission = 1;
    deConfianza++;
  }
  anadir(r, "uBO scriptlets");
  scriptlets++;
}

// ── Recursos neutros de uBlock Origin ──
const { default: mapa } = await import(pathToFileURL(path.join(ubo, "src/js/redirect-resources.js")).href);
const war = path.join(ubo, "src/web_accessible_resources");
let neutros = 0;
let neutrosDeConfianza = 0;
for (const [nombre, detalles] of mapa) {
  if (detalles.params) {
    continue;
  }
  const mime = mimeDe(nombre);
  let datos = fs.readFileSync(path.join(war, nombre));
  if (TEXTO.has(mime)) {
    datos = Buffer.from(datos.toString("utf8").replaceAll("\r", ""), "utf8");
  }
  const alias = detalles.alias === undefined ? [] : [].concat(detalles.alias);
  const r = { name: nombre, aliases: alias, kind: { mime }, content: base64(datos) };
  if (detalles.requiresTrust) {
    r.permission = 1;
    neutrosDeConfianza++;
  }
  anadir(r, "uBO web_accessible_resources");
  neutros++;
}

// ── Recursos de Brave ──
const metadatos = JSON.parse(fs.readFileSync(path.join(brave, "metadata.json"), "utf8"));
let deBrave = 0;
for (const m of metadatos) {
  const datos = fs.readFileSync(path.join(brave, "resources", m.resourcePath));
  const r = { name: m.name, aliases: m.aliases ?? [], kind: m.kind, content: base64(datos) };
  if (m.dependencies?.length) {
    r.dependencies = m.dependencies;
  }
  if (m.permission) {
    r.permission = m.permission;
  }
  anadir(r, "Brave adblock-resources");
  deBrave++;
}

fs.writeFileSync(salida, JSON.stringify(recursos));
for (const a of avisos) {
  console.log(`  aviso: ${a}`);
}
console.log(
  JSON.stringify({
    total: recursos.length,
    scriptlets,
    deConfianza,
    neutros,
    neutrosDeConfianza,
    deBrave,
    repetidos: avisos.length,
  })
);
