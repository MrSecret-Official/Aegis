/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* eslint-env worker */

/**
 * Aegis · Escudos: prepara las listas para el motor (motor.sys.mjs lo lanza y lo cierra): las preprocesa y las reparte
 * por capas. Compilarlas a un .dat lo hace después el motor nativo, en su hilo de fondo. Aquí solo hay texto: la
 * memoria de partir cientos de miles de líneas se va con el worker.
 *
 * Mensaje de entrada: {listas: [{id, datos: ArrayBuffer, incluidas?: {nombre: ArrayBuffer}, permisos, capa}]}.
 * Respuesta: {textos: ArrayBuffer (UTF-8, un trozo detrás de otro), largos, permisos, capas (uno por trozo),
 * reglas: {id: número}} o {error}.
 *
 * Capas (escudos/motor-nativo/src/lib.rs): 0 anuncios y rastreo; 1, 2 y 3, la parte cosmética y los scriptlets de
 * cada grupo de molestias (avisos de cookies, ventanas y banners, avisos anti-bloqueador). Así cada grupo se puede
 * permitir en un sitio sin recompilar. Para que cada capa decida igual que un motor único:
 * - las reglas de red de todas las listas van a la capa 0 (la red solo se decide ahí);
 * - las excepciones que afectan al cosmético («#@#…», «@@…$generichide» y «$elemhide») de cualquier lista se copian a
 *   todas las capas.
 * - «$elemhide»/«$ehide» (adblock-rust no lo entiende y tiraría la regla): pasa a «$generichide» y, si es de un sitio
 *   entero («@@||sitio^$elemhide»), se añade «sitio##aegis-elemhide», el centinela que el motor reconoce para no
 *   ocultar nada en ese sitio.
 *
 * Antes de compilar, cada lista se preprocesa como la entiende uBlock Origin (adblock-rust no sabe de directivas: las
 * tomaría por comentarios y se quedaría con las dos ramas de cada «!#if»):
 * - «!#if <expresión>» … «!#else» … «!#endif», anidables. La expresión: fichas unidas de izquierda a derecha con «&&»
 *   y «||», cada una con «!» delante si se niega, y unos paréntesis exteriores opcionales. Una ficha conocida vale lo
 *   que vale en Aegis (FICHAS); una «cap_…» desconocida, falso; cualquier otra desconocida deja el bloque sin decidir y
 *   se conserva (así lo hace uBlock Origin).
 * - «!#include archivo» se sustituye por ese archivo (el que se descargó junto a la lista, de su misma carpeta), un
 *   solo nivel y nunca con «..» ni una dirección completa.
 * Implementación propia a partir de la documentación de la sintaxis (AdGuard, «conditions directive», y la wiki de
 * uBlock Origin, «!#if»).
 */

"use strict";

/**
 * Fichas de «!#if» y el entorno de Aegis: el motor entiende la sintaxis de uBlock Origin y va en un navegador basado en
 * Firefox. Sin filtrado de HTML («##^», cap_html_filtering) ni «$ipaddress» (cap_ipaddress): adblock-rust no los
 * tiene, y así las listas toman su alternativa.
 */
const FICHAS = new Map([
  ["ext_ublock", "ublock"],
  ["ext_ubol", "ubol"],
  ["ext_devbuild", "devbuild"],
  ["env_brave", "brave"],
  ["env_chromium", "chromium"],
  ["env_edge", "edge"],
  ["env_firefox", "firefox"],
  ["env_legacy", "legacy"],
  ["env_mobile", "mobile"],
  ["env_mv3", "mv3"],
  ["env_safari", "safari"],
  ["cap_html_filtering", "html_filtering"],
  ["cap_ipaddress", "ipaddress"],
  ["false", "false"],
  ["ext_abp", "false"],
  ["adguard", "adguard"],
  ["adguard_app_android", "false"],
  ["adguard_app_cli", "false"],
  ["adguard_app_ios", "false"],
  ["adguard_app_mac", "false"],
  ["adguard_app_windows", "false"],
  ["adguard_ext_android_cb", "false"],
  ["adguard_ext_chromium", "chromium"],
  ["adguard_ext_chromium_mv3", "mv3"],
  ["adguard_ext_edge", "edge"],
  ["adguard_ext_firefox", "firefox"],
  ["adguard_ext_opera", "chromium"],
  ["adguard_ext_safari", "false"],
]);
const ENTORNO = new Set(["ublock", "firefox"]);

/** true, false o undefined (desconocida). */
function ficha(texto) {
  const no = texto.startsWith("!");
  const nombre = no ? texto.slice(1) : texto;
  let estado = FICHAS.get(nombre);
  if (estado === undefined) {
    if (!nombre.startsWith("cap_")) {
      return undefined;
    }
    estado = "false";
  }
  const si = estado != "false" && ENTORNO.has(estado);
  return no ? !si : si;
}

/** Valor de la expresión de un «!#if», o undefined si no se entiende. */
function expresion(texto) {
  let e = texto.trim();
  if (e.startsWith("(") && e.endsWith(")")) {
    e = e.slice(1, -1).trim();
  }
  const trozos = e.split(/\s+/).filter(Boolean);
  if (!trozos.length || trozos.length % 2 == 0) {
    return undefined;
  }
  let valor = ficha(trozos[0]);
  if (valor === undefined) {
    return undefined;
  }
  for (let i = 1; i < trozos.length; i += 2) {
    const otro = ficha(trozos[i + 1]);
    if (otro === undefined) {
      return undefined;
    }
    if (trozos[i] == "&&") {
      valor = valor && otro;
    } else if (trozos[i] == "||") {
      valor = valor || otro;
    } else {
      return undefined;
    }
  }
  return valor;
}

const NOMBRE_INCLUIDO = /^[\w.-]+(?:\/[\w.-]+)*$/;
/**
 * Regla de solo dominio que acaba en «^|» («||cmp.inmobi.com^|», «@@||trackcmp.net^|»): según la sintaxis, solo casa
 * con la raíz del sitio, sin nada detrás. adblock-rust lee «^|» como «^» (TODO en filters/network.rs:610) y la
 * aplicaría al sitio entero: un bloqueo de las listas para apps tumbaría el CMP de InMobi en todas las webs, y una
 * excepción sin «$domain=» desbloquearía un rastreador en todas. Se reescribe a «||dominio/|», que adblock-rust
 * compara exacto (la raíz «https://dominio/»), conservando «@@» y las opciones. Las que llevan ruta o «*» se quedan
 * como están: leídas como «^» bloquean de más en las webs que nombran, no de menos.
 */
const SOLO_RAIZ = /^(@@)?\|\|([^/^*|$#\s]+)\^\|(\$.*)?$/;

/**
 * Lista preprocesada y su número de reglas (líneas que no son comentarios ni están vacías).
 *
 * @param {string} texto
 * @param {(nombre: string) => string | null} incluida
 * @param {number} nivel
 */
function preprocesar(texto, incluida, nivel = 0) {
  const salida = [];
  // Cada bloque «!#if» abierto: {conocido, descartar}. Una línea se queda si ninguno conocido la descarta.
  const pila = [];
  let descartando = false;
  const recalcular = () => (descartando = pila.some(b => b.conocido && b.descartar));
  let reglas = 0;
  for (const cruda of texto.split("\n")) {
    let linea = cruda.endsWith("\r") ? cruda.slice(0, -1) : cruda;
    if (linea.startsWith("!#")) {
      if (linea.startsWith("!#if ")) {
        const v = expresion(linea.slice(5));
        pila.push({ conocido: v !== undefined, descartar: v === false });
        recalcular();
        continue;
      }
      if (linea.startsWith("!#else")) {
        const arriba = pila.at(-1);
        if (arriba) {
          arriba.descartar = !arriba.descartar;
          recalcular();
        }
        continue;
      }
      if (linea.startsWith("!#endif")) {
        pila.pop();
        recalcular();
        continue;
      }
      if (linea.startsWith("!#include ")) {
        if (descartando || nivel > 0) {
          continue;
        }
        const nombre = linea.slice(10).trim().split(/\s/)[0];
        const otro = NOMBRE_INCLUIDO.test(nombre) && !nombre.includes("..") ? incluida(nombre) : null;
        if (otro != null) {
          const r = preprocesar(otro, incluida, nivel + 1);
          salida.push(r.texto);
          reglas += r.reglas;
        }
        continue;
      }
    }
    if (descartando) {
      continue;
    }
    linea = linea.replace(SOLO_RAIZ, "$1||$2/|$3");
    salida.push(linea);
    if (linea && !linea.startsWith("!") && !linea.startsWith("[")) {
      reglas++;
    }
  }
  return { texto: salida.join("\n"), reglas };
}

const CAPAS = 4;
const CENTINELA_ELEMHIDE = "aegis-elemhide";
/** Una regla cosmética (ocultar, excepción, procedural, scriptlet): «##», «#@#», «#?#», «#$#», «#%#», «#$?#»… */
const COSMETICA = /#@?(?:\$\?|[?$%])?#/;
const EXCEPCION_COSMETICA = /#@(?:\$\?|[?$%])?#/;
const OPCIONES_GENERICAS = new Set(["generichide", "ghide", "elemhide", "ehide"]);
/** «@@||sitio^» o «@@||sitio/» (un sitio entero), para el centinela de «$elemhide». */
const SITIO_ENTERO = /^@@\|\|([a-z0-9.-]+)[\^/]?$/i;

/** Opciones de una regla de red («$a,b,~c»), o null si no tiene. */
function opcionesDe(linea) {
  const i = linea.lastIndexOf("$");
  // Un «$» dentro de una expresión regular («/…$/») no separa opciones.
  if (i <= 0 || (linea.startsWith("/") && linea.lastIndexOf("/") > i)) {
    return null;
  }
  return { patron: linea.slice(0, i), opciones: linea.slice(i + 1).split(",") };
}

/**
 * Reparte una lista preprocesada entre las capas y junta las excepciones que tienen que ver todas. Devuelve
 * {propias: texto para la capa de la lista, red: texto para la capa 0 (si la lista no es de la 0), comunes: [líneas]}.
 */
function repartir(texto, capa) {
  const propias = [];
  const red = [];
  const comunes = [];
  for (let linea of texto.split("\n")) {
    if (!linea || linea.startsWith("!") || linea.startsWith("[")) {
      continue;
    }
    if (COSMETICA.test(linea)) {
      propias.push(linea);
      if (EXCEPCION_COSMETICA.test(linea)) {
        comunes.push(linea);
      }
      continue;
    }
    if (linea.startsWith("@@")) {
      const o = opcionesDe(linea);
      if (o && o.opciones.some(x => OPCIONES_GENERICAS.has(x))) {
        if (o.opciones.includes("elemhide") || o.opciones.includes("ehide")) {
          const opciones = [
            ...new Set(o.opciones.map(x => (x == "elemhide" || x == "ehide" ? "generichide" : x))),
          ];
          linea = `${o.patron}$${opciones.join(",")}`;
          const sitio = SITIO_ENTERO.exec(o.patron);
          if (sitio && opciones.length == 1) {
            comunes.push(`${sitio[1]}##${CENTINELA_ELEMHIDE}`);
          }
        }
        comunes.push(linea);
      }
    }
    (capa == 0 ? propias : red).push(linea);
  }
  return { propias: propias.join("\n"), red: red.join("\n"), comunes };
}

onmessage = evento => {
  try {
    const { listas } = evento.data;
    const decodificador = new TextDecoder();
    const codificador = new TextEncoder();
    const reglas = {};
    const trozos = [];
    const largos = [];
    const permisosDe = [];
    const capasDe = [];
    const anadir = (texto, permisos, capa) => {
      if (!texto) {
        return;
      }
      const bytes = codificador.encode(texto);
      trozos.push(bytes);
      largos.push(bytes.length);
      permisosDe.push(permisos >>> 0);
      capasDe.push(capa);
    };
    const usadas = new Set([0]);
    const comunes = [];
    for (const l of listas) {
      const incluidas = l.incluidas ?? {};
      const r = preprocesar(decodificador.decode(l.datos), n =>
        incluidas[n] ? decodificador.decode(incluidas[n]) : null
      );
      const capa = Number.isInteger(l.capa) && l.capa > 0 && l.capa < CAPAS ? l.capa : 0;
      const partes = repartir(r.texto, capa);
      anadir(partes.propias, l.permisos, capa);
      anadir(partes.red, l.permisos, 0);
      comunes.push(...partes.comunes);
      usadas.add(capa);
      reglas[l.id] = r.reglas;
    }
    // Las excepciones del cosmético, en todas las capas con listas (sin permisos: no inyectan nada).
    const textoComunes = [...new Set(comunes)].join("\n");
    for (const capa of usadas) {
      anadir(textoComunes, 0, capa);
    }
    if (!capasDe.includes(0)) {
      throw new Error("no hay listas de anuncios y rastreo");
    }
    // Todo en un solo búfer, que se transfiere (no se copia) al hilo principal.
    const textos = new Uint8Array(largos.reduce((a, b) => a + b, 0));
    let i = 0;
    for (const t of trozos) {
      textos.set(t, i);
      i += t.length;
    }
    postMessage(
      { textos: textos.buffer, largos, permisos: permisosDe, capas: capasDe, reglas },
      [textos.buffer]
    );
  } catch (e) {
    postMessage({ error: String(e?.stack || e) });
  }
};
