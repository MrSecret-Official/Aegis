/* Sondas de huella digital: lo que un script de huella lee del navegador (como FingerprintJS, CreepJS o TZP).
 *
 * El mismo archivo se ejecuta en dos sitios:
 * - en la web (huella.html, huella-marco.html): lo que la web ve;
 * - en la ventana del navegador, con privilegios (lo hace el ejecutor por Marionette): los valores reales del equipo,
 *   que la protección no toca en la interfaz. Esa es la referencia con la que se compara.
 * Por eso solo usa APIs que existen en los dos sitios y crea los elementos HTML con su espacio de nombres (la ventana
 * del navegador es un documento XUL).
 */
"use strict";

const Sondas = (() => {
  const HTML = "http://www.w3.org/1999/xhtml";
  const nuevo = etiqueta => document.createElementNS(HTML, etiqueta);
  const espera = ms => new Promise(r => setTimeout(r, ms));
  const conTiempo = (promesa, ms, valor = null) => Promise.race([promesa, espera(ms).then(() => valor)]);
  const mq = consulta => matchMedia(consulta).matches;

  function medios() {
    const elegir = (nombre, valores) => valores.find(v => mq(`(${nombre}: ${v})`)) ?? "?";
    return {
      tema: elegir("prefers-color-scheme", ["dark", "light"]),
      movimiento: elegir("prefers-reduced-motion", ["reduce", "no-preference"]),
      transparencia: elegir("prefers-reduced-transparency", ["reduce", "no-preference"]),
      contraste: elegir("prefers-contrast", ["more", "less", "custom", "no-preference"]),
      invertidos: elegir("inverted-colors", ["inverted", "none"]),
      puntero: elegir("pointer", ["fine", "coarse", "none"]),
      hover: elegir("hover", ["hover", "none"]),
      hdr: mq("(dynamic-range: high)"),
      videoHdr: mq("(video-dynamic-range: high)"),
      gamaP3: mq("(color-gamut: p3)"),
      coloresForzados: mq("(forced-colors: active)"),
    };
  }

  async function voces() {
    if (typeof speechSynthesis === "undefined") {
      return null;
    }
    let lista = speechSynthesis.getVoices();
    if (!lista.length) {
      await conTiempo(new Promise(r => speechSynthesis.addEventListener("voiceschanged", r, { once: true })), 2000);
      lista = speechSynthesis.getVoices();
    }
    return lista.length;
  }

  async function audio() {
    try {
      const ctx = new AudioContext();
      const r = {
        frecuencia: ctx.sampleRate,
        latencia: ctx.baseLatency,
        salida: ctx.outputLatency,
        canales: ctx.destination.maxChannelCount,
      };
      await ctx.close();
      return r;
    } catch (e) {
      return { error: String(e) };
    }
  }

  function webgl() {
    try {
      const c = nuevo("canvas");
      const gl = c.getContext("webgl");
      if (!gl) {
        return { error: "sin WebGL" };
      }
      const info = gl.getExtension("WEBGL_debug_renderer_info");
      return {
        fabricante: info ? gl.getParameter(info.UNMASKED_VENDOR_WEBGL) : null,
        modelo: info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : null,
        maxTextura: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        maxRender: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
      };
    } catch (e) {
      return { error: String(e) };
    }
  }

  async function webgpu() {
    if (!navigator.gpu) {
      return { disponible: false };
    }
    try {
      const a = await conTiempo(navigator.gpu.requestAdapter(), 4000);
      if (!a) {
        return { disponible: true, adaptador: false };
      }
      return {
        disponible: true,
        adaptador: true,
        respaldo: a.isFallbackAdapter ?? a.info?.isFallbackAdapter ?? null,
        maxTextura2D: a.limits?.maxTextureDimension2D ?? null,
        subgrupos: [a.info?.subgroupMinSize ?? null, a.info?.subgroupMaxSize ?? null],
      };
    } catch (e) {
      return { disponible: true, error: String(e) };
    }
  }

  function errorMedio() {
    return new Promise(resolver => {
      const v = nuevo("video");
      v.onerror = () => resolver(v.error ? v.error.message : null);
      setTimeout(() => resolver(null), 3000);
      v.src = "data:video/webm;base64,AAAAAAAA";
    });
  }

  /** ¿Se ve esta fuente del sistema? Ancho de un texto con la fuente y dos genéricas de respaldo distintas. */
  function fuentes(lista) {
    const c = nuevo("canvas");
    const ctx = c.getContext("2d");
    const texto = "mmmmmmmmmmlli WQ@#~ 0123456789 ÆÇ";
    const ancho = familia => {
      ctx.font = `48px ${familia}`;
      return ctx.measureText(texto).width;
    };
    const resp = { monospace: ancho("monospace"), serif: ancho("serif") };
    const r = {};
    for (const f of lista) {
      r[f] = ancho(`"${f}", monospace`) !== resp.monospace || ancho(`"${f}", serif`) !== resp.serif;
    }
    return r;
  }

  function zona() {
    const o = Intl.DateTimeFormat().resolvedOptions();
    return {
      nombre: o.timeZone,
      enero: new Date(2026, 0, 15, 12).getTimezoneOffset(),
      julio: new Date(2026, 6, 15, 12).getTimezoneOffset(),
    };
  }

  function idioma() {
    return {
      principal: navigator.language,
      lista: [...navigator.languages],
      intl: Intl.DateTimeFormat().resolvedOptions().locale,
      numero: (1234567.891).toLocaleString(),
    };
  }

  /** Resolución de los relojes: el paso más pequeño que se ve en ~150 ms de lecturas seguidas. */
  function temporizador() {
    const pasos = reloj => {
      let min = Infinity;
      let antes = reloj();
      const fin = performance.now() + 150;
      while (performance.now() < fin) {
        const ahora = reloj();
        if (ahora > antes) {
          min = Math.min(min, ahora - antes);
          antes = ahora;
        }
      }
      return min === Infinity ? null : Math.round(min * 1000) / 1000;
    };
    return { performance: pasos(() => performance.now()), fecha: pasos(() => Date.now()) };
  }

  /** Fotogramas por segundo de requestAnimationFrame: los que caben en algo más de un segundo de reloj. */
  function fps() {
    return conTiempo(
      new Promise(resolver => {
        let n = 0;
        let inicio = null;
        const paso = () => {
          const ahora = Date.now();
          inicio ??= ahora;
          n++;
          if (ahora - inicio >= 1200) {
            resolver(Math.round(((n - 1) * 1000) / (ahora - inicio)));
          } else {
            requestAnimationFrame(paso);
          }
        };
        requestAnimationFrame(paso);
      }),
      5000
    );
  }

  /**
   * Lienzo (canvas): se pintan rectángulos de colores exactos y se leen de las dos formas que usan los scripts de huella:
   * getImageData (los píxeles) y toDataURL (la imagen, que se vuelve a decodificar aquí para comparar). Sin protección,
   * cada píxel es el color pintado; con el ruido de la protección, unos pocos cambian; con la lectura bloqueada (Caja
   * fuerte), sale un relleno que no se parece a lo pintado (todos o casi todos los píxeles distintos).
   */
  const COLORES = [
    [200, 40, 60],
    [30, 160, 90],
    [20, 80, 220],
    [240, 200, 30],
  ];

  function pintarLienzo() {
    const c = nuevo("canvas");
    c.width = 64;
    c.height = 32;
    const ctx = c.getContext("2d");
    COLORES.forEach(([r, g, b], i) => {
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(i * 16, 0, 16, 32);
    });
    return [c, ctx];
  }

  function compararPixeles(d) {
    const total = 64 * 32;
    let cambiados = 0;
    for (let p = 0; p < total; p++) {
      const [r, g, b] = COLORES[Math.floor((p % 64) / 16)];
      if (d[p * 4] !== r || d[p * 4 + 1] !== g || d[p * 4 + 2] !== b || d[p * 4 + 3] !== 255) {
        cambiados++;
      }
    }
    const estado = cambiados >= total * 0.9 ? "bloqueado" : cambiados === 0 ? "real" : "ruido";
    return { estado, cambiados, total };
  }

  async function lienzo() {
    const r = {};
    try {
      const [, ctx] = pintarLienzo();
      r.getImageData = compararPixeles(ctx.getImageData(0, 0, 64, 32).data);
    } catch (e) {
      r.getImageData = { estado: "error", error: String(e) };
    }
    try {
      const [c] = pintarLienzo();
      const url = c.toDataURL("image/png");
      const img = nuevo("img");
      img.src = url;
      await img.decode();
      // Decodificar y releer en un lienzo propio: getImageData no añade ruido con el método eficiente del motor,
      // así que lo que se ve aquí es lo que salió de toDataURL.
      const c2 = nuevo("canvas");
      c2.width = 64;
      c2.height = 32;
      const ctx2 = c2.getContext("2d");
      ctx2.drawImage(img, 0, 0);
      const pixeles = compararPixeles(ctx2.getImageData(0, 0, 64, 32).data);
      // El método eficiente del motor no toca los píxeles: añade al PNG un bloque «deBG» con datos al azar por sitio y
      // sesión, así que el resultado (y su hash) cambia. Se busca ese bloque en la imagen.
      const binario = atob(url.slice(url.indexOf(",") + 1));
      const marca = binario.includes("deBG");
      r.toDataURL = {
        ...pixeles,
        marca,
        estado: pixeles.estado === "bloqueado" ? "bloqueado" : marca || pixeles.cambiados > 0 ? "ruido" : "real",
      };
    } catch (e) {
      r.toDataURL = { estado: "error", error: String(e) };
    }
    return r;
  }

  /** Tamaño de la «pantalla» que ven las media queries (device-width/height), por búsqueda binaria. */
  function tamanoDispositivo() {
    const buscar = eje => {
      let bajo = 0;
      let alto = 20000;
      while (bajo < alto) {
        const medio = Math.ceil((bajo + alto) / 2);
        if (mq(`(min-device-${eje}: ${medio}px)`)) {
          bajo = medio;
        } else {
          alto = medio - 1;
        }
      }
      return bajo;
    };
    return [buscar("width"), buscar("height")];
  }

  function matematicas() {
    // Funciones donde la libm del sistema y fdlibm suelen diferir en el último bit (las que usan TZP y CreepJS).
    const f = [
      Math.tan(-1e300),
      Math.sinh(1),
      Math.cosh(10),
      Math.expm1(1),
      Math.atanh(0.5),
      Math.cbrt(Math.PI),
      Math.log1p(10),
      Math.exp(-1e-15 + 1),
      Math.pow(Math.PI, -100),
      Math.acosh(1e300),
      Math.asinh(1),
      Math.tanh(0.5),
      Math.sin(1e300),
      Math.cos(1e300),
      Math.log10(7),
    ];
    return f.map(x => String(x));
  }

  function coloresSistema() {
    const el = nuevo("div");
    (document.body ?? document.documentElement).append(el);
    const r = {};
    for (const c of ["Highlight", "AccentColor", "ButtonFace", "Canvas", "GrayText"]) {
      el.style.color = c;
      r[c] = getComputedStyle(el).color;
    }
    el.remove();
    return r;
  }

  async function almacenamiento() {
    try {
      return (await navigator.storage.estimate()).quota ?? null;
    } catch {
      return null;
    }
  }

  /** Último movimiento del ratón sobre la página (lo provoca el ejecutor con una acción de ratón de verdad). */
  let ultimoRaton = null;
  if (typeof window !== "undefined" && window.addEventListener) {
    window.addEventListener(
      "mousemove",
      e => (ultimoRaton = { screenX: e.screenX, screenY: e.screenY, clientX: e.clientX, clientY: e.clientY }),
      true
    );
  }

  /** Todas las sondas. `opciones.fuentes`: lista de familias que probar. */
  async function medir(opciones = {}) {
    return {
      nucleos: navigator.hardwareConcurrency,
      pantalla: [screen.width, screen.height],
      pantallaLibre: [screen.availWidth, screen.availHeight],
      ventana: [innerWidth, innerHeight],
      exterior: [outerWidth, outerHeight],
      posicion: [screenX, screenY],
      interior: typeof mozInnerScreenX === "number" ? [mozInnerScreenX, mozInnerScreenY] : null,
      dpr: devicePixelRatio,
      profundidad: [screen.colorDepth, screen.pixelDepth],
      dispositivo: tamanoDispositivo(),
      orientacion: screen.orientation?.type ?? null,
      tactil: navigator.maxTouchPoints,
      medios: medios(),
      voces: await voces(),
      audio: await audio(),
      webgl: webgl(),
      webgpu: await webgpu(),
      buildID: navigator.buildID ?? null,
      errorMedio: await errorMedio(),
      fuentes: fuentes(opciones.fuentes ?? []),
      zona: zona(),
      idioma: idioma(),
      temporizador: temporizador(),
      fps: await fps(),
      lienzo: await lienzo(),
      matematicas: matematicas(),
      webcodecs: [typeof VideoDecoder, typeof VideoEncoder, typeof AudioDecoder],
      coloresSistema: coloresSistema(),
      gpc: navigator.globalPrivacyControl ?? null,
      conexion: navigator.connection?.type ?? null,
      almacenamiento: await almacenamiento(),
      raton: ultimoRaton,
      visibilidad: typeof document !== "undefined" ? document.visibilityState : null,
    };
  }

  /** Lo justo para un marco de otro sitio. */
  async function medirMarco() {
    return {
      nucleos: navigator.hardwareConcurrency,
      zona: zona(),
      idioma: idioma(),
      lienzo: await lienzo(),
      webgl: webgl(),
      buildID: navigator.buildID ?? null,
    };
  }

  return { medir, medirMarco, raton: () => ultimoRaton };
})();
