/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · logos de los accesos directos en la nueva pestaña (proceso de contenido). Lo pone AegisPaginasChild en
 * about:newtab y about:home; lo que necesita del perfil lo pide al proceso principal (logos.sys.mjs, a través de
 * AegisPaginasParent).
 *
 * - Accesos con la inicial: si Places tiene el favicon de una dirección equivalente (otro esquema, con o sin «www»,
 *   redirecciones), la loseta lo enseña en lugar de la letra. Solo se pinta (atributo aegis-logo y la variable
 *   --aegis-logo en la loseta, nueva-pestana.css): no cambia el acceso ni sale del equipo.
 * - Diálogo de añadir o editar un acceso: botón «Usar el logo de la web», junto a «Usar una imagen personalizada».
 *   Pide el logo (local o, si no hay, del sitio), lo pone como imagen personalizada del acceso y muestra la vista
 *   previa de Firefox. Se guarda con el botón «Guardar» del diálogo, como cualquier imagen personalizada.
 *
 * - Logos oscuros: un logo negro y monocromo con fondo transparente (el de GitHub, por ejemplo) no se ve sobre la
 *   loseta del tema oscuro. Se mide cada imagen una vez, en local (un lienzo de 32 × 32): si lo opaco es casi negro y
 *   sin color y alrededor hay transparencia, el elemento que pinta esa imagen lleva aegis-logo-oscuro y la hoja lo pinta
 *   en blanco en el tema oscuro. Los logos de color y los de fondo opaco no se tocan.
 * - Sin fondo claro: el icono más grande de un sitio suele ser el «apple-touch-icon» de iOS, el logo sobre un cuadrado
 *   opaco. Si ese cuadrado es blanco o gris muy claro (YouTube), en la loseta se ve como un cuadrado blanco: si el
 *   proceso principal manda además otro favicon de la misma página (alternativa, de 48 px o más si lo hay), se mide el
 *   grande y, si tiene fondo claro y el otro no, se pinta el otro. Un fondo oscuro (DeepL) o del color de la marca
 *   (Roblox) se ve bien sobre la loseta: se queda el grande, que se ve nítido (un favicon de 32 ampliado a la caja se
 *   vería pixelado). fondoClaro() y sinFondo() también los usa logos.sys.mjs (proceso principal).
 *
 * Sin temporizadores: un MutationObserver (la página la monta React) y una revisión por tanda de cambios. Cada imagen
 * se mide una vez (la misma medida vale para el fondo y para el tono).
 */

const HTML = "http://www.w3.org/1999/xhtml";

// ── Medidas de una imagen (también para el proceso principal) ─────────────────────────────────────────────────────

/** Lado del lienzo en el que se mide una imagen (estirada a un cuadrado). */
export const LADO_MEDIDA = 32;
/** Tamaño mínimo de un icono sin fondo claro para preferirlo a uno con él (un favicon de 16 px se vería borroso). */
export const LADO_MINIMO = 32;
/** Las esquinas se miran un 12,5 % hacia dentro (4 px de 32): un borde redondeado suave no cuenta como transparente. */
const MARGEN_ESQUINA = 0.125;
/** Alfa a partir del cual un píxel es opaco. */
const ALFA_OPACO = 200;
/** Un píxel opaco es claro si ninguno de sus canales baja de aquí (blanco o gris muy claro)… */
const CANAL_CLARO = 215;
/** …y casi no tiene color (diferencia entre el canal mayor y el menor). */
const COLOR_CLARO = 24;

/**
 * ¿La imagen tiene fondo claro opaco? Lo tiene si las cuatro esquinas (un bloque de 2 × 2 píxeles un poco hacia dentro)
 * son opacas y casi blancas o de un gris muy claro: el «apple-touch-icon» de logo sobre un cuadrado blanco, redondeado
 * o no (YouTube). Un logo con las esquinas transparentes, también uno redondo, no lo tiene; un icono sobre un cuadrado
 * oscuro (DeepL) o del color de su marca (Roblox), tampoco: se ve bien sobre la loseta.
 *
 * @param {ArrayLike<number>} d RGBA de lado × lado
 * @param {number} lado
 * @returns {boolean}
 */
export function fondoClaro(d, lado) {
  if (!d || lado < 8 || d.length < lado * lado * 4) {
    return false;
  }
  const m = Math.max(1, Math.round(lado * MARGEN_ESQUINA));
  const lejos = lado - 2 - m;
  for (const [x0, y0] of [[m, m], [lejos, m], [m, lejos], [lejos, lejos]]) {
    for (let y = y0; y < y0 + 2; y++) {
      for (let x = x0; x < x0 + 2; x++) {
        const i = (y * lado + x) * 4;
        const [r, g, b, a] = [d[i], d[i + 1], d[i + 2], d[i + 3]];
        if (a < ALFA_OPACO || Math.min(r, g, b) < CANAL_CLARO || Math.max(r, g, b) - Math.min(r, g, b) > COLOR_CLARO) {
          return false;
        }
      }
    }
  }
  return true;
}

/**
 * ¿Logo negro y monocromo con transparencia alrededor? (ver «Logos oscuros» en la cabecera)
 *
 * @param {ArrayLike<number>} d RGBA de lado × lado
 * @param {number} lado
 * @returns {boolean}
 */
export function esOscuro(d, lado) {
  let opacos = 0;
  let transparentes = 0;
  let luz = 0;
  let color = 0;
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3];
    if (a < 32) {
      transparentes++;
      continue;
    }
    if (a < 160) {
      continue;
    }
    const [r, g, b] = [d[i], d[i + 1], d[i + 2]];
    const max = Math.max(r, g, b);
    opacos++;
    luz += (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    color += max ? (max - Math.min(r, g, b)) / max : 0;
  }
  const total = lado * lado;
  return opacos > total * 0.05 && transparentes > total * 0.15 && luz / opacos < 0.3 && color / opacos < 0.25;
}

/**
 * ¿Vale como icono sin fondo claro? Sin fondo claro opaco y de LADO_MINIMO o más.
 *
 * @param {{fondo: boolean, lado: number}|null} medida fondo: si tiene fondo claro (fondoClaro)
 */
export function sinFondo(medida) {
  return !!medida && !medida.fondo && medida.lado >= LADO_MINIMO;
}

/**
 * RGBA de una imagen ya decodificada, estirada a LADO_MEDIDA × LADO_MEDIDA. Lanza si el lienzo no se puede leer
 * (imagen de otro origen).
 *
 * @param {Document} doc
 * @param {HTMLImageElement} img
 */
export function pixeles(doc, img) {
  const lienzo = doc.createElementNS(HTML, "canvas");
  lienzo.width = lienzo.height = LADO_MEDIDA;
  const ctx = lienzo.getContext("2d");
  ctx.drawImage(img, 0, 0, LADO_MEDIDA, LADO_MEDIDA);
  return ctx.getImageData(0, 0, LADO_MEDIDA, LADO_MEDIDA).data;
}

let localizacion;
function texto(id, args) {
  localizacion ??= new Localization(["aegis.ftl"], true);
  try {
    return localizacion.formatValueSync(id, args) ?? "";
  } catch (e) {
    console.error(`Aegis: texto ${id}`, e);
    return "";
  }
}

/** La dirección como la guarda el diálogo (TopSiteForm.cleanUrl: sin esquema, http://). */
function limpiar(url) {
  const t = url.trim();
  return t.startsWith("http:") || t.startsWith("https:") ? t : `http://${t}`;
}

/**
 * Cambia el valor de un campo controlado por React como si lo hubiera escrito el usuario: el valor nativo (por Xray,
 * así React ve que ha cambiado) y un evento «input».
 */
function escribir(win, campo, valor) {
  campo.value = valor;
  campo.dispatchEvent(new win.Event("input", { bubbles: true }));
}

/** Espera a que haya un elemento dentro de `raiz` (o null si `raiz` desaparece). Sin temporizadores. */
function esperar(win, raiz, selector) {
  const ya = raiz.querySelector(selector);
  if (ya) {
    return Promise.resolve(ya);
  }
  return new Promise(resolver => {
    const obs = new win.MutationObserver(() => {
      const el = raiz.querySelector(selector);
      if (el || !raiz.isConnected) {
        obs.disconnect();
        resolver(el);
      }
    });
    obs.observe(raiz.ownerDocument, { childList: true, subtree: true });
  });
}

/**
 * @param {Window} win la nueva pestaña
 * @param {(nombre: string, datos: object) => Promise<any>} pedir pregunta al proceso principal
 * @returns {() => void} para deshacerlo
 */
export function logos(win, pedir) {
  const doc = win.document;
  /** dirección → {dato, alternativa?} o null (sin icono local). */
  const conocidos = new Map();
  const pendientes = new Set();
  let programado = false;

  const pintar = (li, url, dato) => {
    li.setAttribute("aegis-logo", "");
    li.setAttribute("aegis-logo-url", url);
    li.style.setProperty("--aegis-logo", `url("${dato}")`);
  };
  const despintar = li => {
    li.removeAttribute("aegis-logo");
    li.removeAttribute("aegis-logo-url");
    li.style.removeProperty("--aegis-logo");
  };

  // ── Accesos con la inicial ──
  const losetas = () => {
    const faltan = [];
    for (const li of doc.querySelectorAll(".top-site-outer")) {
      const url = li.querySelector("a.top-site-button")?.getAttribute("href");
      const pintada = li.getAttribute("aegis-logo-url");
      const conLetra = li.querySelector(".icon-wrapper.letter-fallback");
      // Otro acceso en la misma loseta, o Firefox ya le pone imagen (la suya o una personalizada): fuera lo nuestro.
      if (pintada && (pintada != url || !conLetra)) {
        despintar(li);
      }
      if (!url || !conLetra) {
        continue;
      }
      if (conocidos.has(url)) {
        const dato = elegido(conocidos.get(url));
        if (dato && li.getAttribute("aegis-logo-url") != url) {
          pintar(li, url, dato);
        }
      } else if (!pendientes.has(url)) {
        pendientes.add(url);
        faltan.push(url);
      }
    }
    if (!faltan.length) {
      return;
    }
    pedir("Aegis:LogosLocales", { urls: faltan })
      .catch(() => ({}))
      .then(respuesta => {
        const imagen = v => typeof v == "string" && v.startsWith("data:image/");
        for (const url of faltan) {
          const icono = respuesta?.[url];
          const alternativa = imagen(icono?.alternativa) ? icono.alternativa : null;
          conocidos.set(url, imagen(icono?.dato) ? { dato: icono.dato, alternativa } : null);
          pendientes.delete(url);
        }
        programar();
      });
  };
  /**
   * La imagen que se pinta para un icono conocido: el principal, o la alternativa si el principal tiene fondo claro y
   * ella no. null mientras se mide (la loseta sigue con la inicial hasta la siguiente revisión).
   */
  const elegido = icono => {
    if (!icono) {
      return null;
    }
    if (!icono.alternativa) {
      return icono.dato;
    }
    const principal = medida(icono.dato);
    if (!principal) {
      return null;
    }
    if (!principal.fondo) {
      return icono.dato;
    }
    const alternativa = medida(icono.alternativa);
    if (!alternativa) {
      return null;
    }
    return sinFondo(alternativa) ? icono.alternativa : icono.dato;
  };

  // ── Medidas (fondo y tono) y logos oscuros (ver la cabecera) ──
  /** imagen → {oscuro, fondo (claro), lado}, o null mientras se mide. */
  const medidas = new Map();
  const URL_IMAGEN = /url\("?(.+?)"?\)/;
  const CANDIDATOS = ".tile .icon-wrapper, .tile .top-site-icon, .tile .screenshot";
  /** El elemento de la loseta que pinta la imagen y su dirección, o null. */
  const imagenDe = li => {
    for (const el of li.querySelectorAll(CANDIDATOS)) {
      const m = URL_IMAGEN.exec(win.getComputedStyle(el).backgroundImage);
      if (m) {
        return { el, src: m[1] };
      }
    }
    return null;
  };
  /** Solo imágenes que ya están en el equipo: una de la red se volvería a pedir (aunque fuera de la caché). */
  const LOCAL = /^(?:data|blob|page-icon|moz-page-thumb|resource|chrome|moz-icon):/;
  /** Medida de una imagen que no se puede leer: ni oscura ni con fondo claro (se deja como está). */
  const SIN_MEDIDA = { oscuro: false, fondo: false, lado: 0 };
  const medir = src =>
    new Promise(listo => {
      if (!LOCAL.test(src)) {
        listo(SIN_MEDIDA);
        return;
      }
      const img = new win.Image();
      img.onload = () => {
        try {
          const d = pixeles(doc, img);
          listo({
            oscuro: esOscuro(d, LADO_MEDIDA),
            fondo: fondoClaro(d, LADO_MEDIDA),
            // Un SVG sin tamaño propio se escala sin perder nitidez: cuenta como grande.
            lado: Math.max(img.naturalWidth, img.naturalHeight) || Infinity,
          });
        } catch {
          // Imagen de otro origen (el lienzo no se puede leer) o rota: se deja como está.
          listo(SIN_MEDIDA);
        }
      };
      img.onerror = () => listo(SIN_MEDIDA);
      img.src = src;
    });
  /** La medida de una imagen, o null si aún no está (la pide una vez y vuelve a revisar al tenerla). */
  const medida = src => {
    if (!medidas.has(src)) {
      medidas.set(src, null);
      medir(src).then(m => {
        medidas.set(src, m);
        programar();
      });
    }
    return medidas.get(src);
  };
  const oscuros = () => {
    for (const li of doc.querySelectorAll(".top-site-outer")) {
      const imagen = imagenDe(li);
      // La marca va en el elemento que pinta la imagen, no en la loseta: si se invirtieran también sus padres o hijos,
      // dos inversiones se anularían (el logo volvería a negro).
      const oscuro = !!imagen && medida(imagen.src)?.oscuro === true;
      for (const el of li.querySelectorAll(CANDIDATOS)) {
        el.toggleAttribute("aegis-logo-oscuro", oscuro && el == imagen.el);
      }
    }
  };

  // ── Diálogo de añadir o editar un acceso ──
  const usarLogo = async (form, boton, estado) => {
    const campoUrl = [...form.querySelectorAll(".field.url input")].find(
      c => !c.closest(".custom-image-input-container")
    );
    const url = campoUrl?.value.trim();
    if (!url) {
      estado.textContent = texto("aegis-logo-sin-direccion");
      return;
    }
    boton.disabled = true;
    estado.textContent = texto("aegis-logo-buscando");
    let respuesta;
    try {
      respuesta = await pedir("Aegis:Logo", { url: limpiar(url) });
    } catch {
      respuesta = null;
    }
    boton.disabled = false;
    if (!form.isConnected) {
      return;
    }
    if (!respuesta?.clave) {
      estado.textContent = texto(respuesta?.error == "red" ? "aegis-logo-error-red" : "aegis-logo-error");
      return;
    }
    estado.textContent = "";
    // Que se vea el campo «imagen personalizada» (el enlace de Firefox lo abre), ponerle la dirección del logo y
    // pedir la vista previa, que Firefox lee del almacén de miniaturas donde se ha dejado.
    form.querySelector(".enable-custom-image-input")?.click();
    const campo = await esperar(win, form, ".custom-image-input-container input");
    if (!campo) {
      return;
    }
    escribir(win, campo, respuesta.clave);
    (await esperar(win, form, "#topsites-form-preview-button"))?.click();
  };

  const formulario = () => {
    const form = doc.querySelector("form.topsite-form");
    const acciones = form?.querySelector(".topsite-form-footer > .actions");
    if (!acciones || form.querySelector(".aegis-logo")) {
      return;
    }
    const caja = doc.createElementNS(HTML, "div");
    caja.className = "aegis-logo";
    const boton = doc.createElementNS(HTML, "button");
    boton.type = "button";
    boton.className = "a11y-link-button aegis-logo-boton";
    boton.textContent = texto("aegis-logo-usar");
    const estado = doc.createElementNS(HTML, "span");
    estado.className = "aegis-logo-estado";
    estado.setAttribute("role", "status");
    caja.append(boton, estado);
    acciones.before(caja);
    boton.addEventListener("click", () => usarLogo(form, boton, estado));
  };

  const revisar = () => {
    programado = false;
    try {
      losetas();
      oscuros();
      formulario();
    } catch (e) {
      console.error("Aegis: logos de los accesos", e);
    }
  };
  const programar = () => {
    if (!programado) {
      programado = true;
      Promise.resolve().then(revisar);
    }
  };

  const observador = new win.MutationObserver(programar);
  observador.observe(doc, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "href", "style"] });
  programar();
  return () => observador.disconnect();
}
