/* Banco de pruebas de Escudos: lo común a todas las páginas.
 *
 * Cada página de prueba es una «fase» de un caso: hace lo que haría una web (cargar un rastreador, poner una cookie,
 * leer la pantalla…), apunta lo que ve y lo guarda en el servidor local del banco (/__/fase). La verdad de lo que ha
 * salido del navegador la tiene el servidor (/__/registro): una petición bloqueada no llega. resultado.html junta las
 * fases, el registro y la referencia (valores reales del equipo) y aplica casos.js.
 *
 * Parámetros de la dirección (los pone el ejecutor o el panel de index.html):
 *   run       identificador de esta ejecución del caso (va en cada petición: así el registro sabe qué es de quién)
 *   caso      rastreadores | cookies | https | olvidar | huella | cajafuerte | google | control | red
 *   fase      nombre de la fase
 *   nivel     estricto | normal          (rastreadores y anuncios)
 *   escudos   arriba | bajados           (en el sitio de la prueba)
 *   cookies   5 | 1                      (5: aisladas por sitio; 1: ninguna de terceros)
 *   huella    firefox | equilibrada | estricta | caja_fuerte
 *   privada   0 | 1
 *   permiso   0 | 1                      (Caja fuerte: el sitio tiene permiso)
 *   google    1 | 0                      (Google limpio encendido)
 *   auto      1 si lo maneja el ejecutor (no se navega solo)
 */
"use strict";

const Banco = (() => {
  const q = new URLSearchParams(location.search);
  const DE_SERIE = {
    nivel: "estricto",
    escudos: "arriba",
    cookies: "5",
    huella: "equilibrada",
    privada: "0",
    permiso: "0",
    google: "1",
    // Escudos con el motor propio: qué cuenta el contador y qué grupos de molestias están encendidos.
    contador: "peticiones",
    molestias: "cva",
    // uBlock Origin activo (simulado en el banco): el cosmético propio se retira.
    ubo: "0",
  };
  const modo = Object.fromEntries(Object.entries(DE_SERIE).map(([k, v]) => [k, q.get(k) ?? v]));
  const run = q.get("run") || "manual";
  const caso = q.get("caso") || "";
  const fase = q.get("fase") || "";
  const auto = q.get("auto") === "1";

  /** Parámetros de modo y de ejecución para pasar a otra página del banco. */
  function parametros(extra = {}) {
    const p = new URLSearchParams({ run, caso, ...modo, ...(auto ? { auto: "1" } : {}) });
    for (const [k, v] of Object.entries(extra)) {
      p.set(k, v);
    }
    return p.toString();
  }

  /** Identificador de una petición de esta fase: va en la URL y el registro lo encuentra. */
  const id = etiqueta => `${run}.${fase}.${etiqueta}`;

  const espera = ms => new Promise(r => setTimeout(r, ms));

  async function json(url, opciones) {
    const r = await fetch(url, { cache: "no-store", ...opciones });
    return r.json();
  }

  /** Lo que ha llegado al servidor con este texto en la dirección (cualquier sitio). */
  const registro = texto => json(`/__/registro?id=${encodeURIComponent(texto)}`);

  /**
   * Espera a que el registro deje de crecer (las balizas y los marcos llegan después de la carga). Como mucho
   * `maximo` ms; estable = sin cambios durante `quieto` ms.
   */
  async function estabilizar(texto, { maximo = 6000, quieto = 900 } = {}) {
    const fin = performance.now() + maximo;
    let antes = -1;
    let desde = performance.now();
    let lista = [];
    while (performance.now() < fin) {
      lista = await registro(texto);
      if (lista.length !== antes) {
        antes = lista.length;
        desde = performance.now();
      } else if (performance.now() - desde >= quieto) {
        break;
      }
      await espera(200);
    }
    return lista;
  }

  /**
   * Carga un recurso como lo haría una web y dice si cargó: «carga», «error» o «sin-señal» (las balizas no
   * contestan a la página; para ellas manda el registro).
   */
  function cargar(tipo, url, { espera: ms = 5000 } = {}) {
    return new Promise(resolver => {
      let hecho = false;
      const fin = v => {
        if (!hecho) {
          hecho = true;
          resolver(v);
        }
      };
      setTimeout(() => fin("sin-señal"), ms);
      if (tipo === "script") {
        const s = document.createElement("script");
        s.onload = () => fin("carga");
        s.onerror = () => fin("error");
        s.src = url;
        document.head.append(s);
      } else if (tipo === "imagen") {
        const i = new Image();
        i.onload = () => fin("carga");
        i.onerror = () => fin("error");
        i.src = url;
      } else if (tipo === "marco") {
        const f = document.createElement("iframe");
        f.title = "marco de prueba";
        f.onload = () => fin("carga");
        f.onerror = () => fin("error");
        f.src = url;
        (document.getElementById("marcos") ?? document.body).append(f);
      } else if (tipo === "fetch") {
        fetch(url, { mode: "no-cors", credentials: "include", cache: "no-store" }).then(
          () => fin("carga"),
          () => fin("error")
        );
      } else if (tipo === "baliza") {
        fin(navigator.sendBeacon(url, "aegis-banco") ? "sin-señal" : "error");
      } else {
        fin("error");
      }
    });
  }

  /** Guarda lo observado en esta fase y lo deja a la vista (y en window.__fase para el ejecutor). */
  async function listo(datos, { siguiente = null, instrucciones = "" } = {}) {
    const cuerpo = { fase, url: location.href, momento: Date.now(), ...datos };
    await fetch(`/__/fase?run=${encodeURIComponent(run)}&fase=${encodeURIComponent(fase)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
    });
    window.__fase = cuerpo;
    const aviso = document.getElementById("estado-fase");
    if (aviso) {
      aviso.textContent = `Fase «${fase}» guardada.`;
    }
    const sig = document.getElementById("siguiente");
    if (sig && !auto) {
      const enlace = siguiente ?? `https://aegis-banco.test/resultado.html?${parametros()}`;
      sig.replaceChildren();
      if (instrucciones) {
        const p = document.createElement("p");
        p.textContent = instrucciones;
        sig.append(p);
      }
      const a = document.createElement("a");
      a.className = "boton principal";
      a.href = enlace;
      a.textContent = siguiente ? "Siguiente paso" : "Ver el resultado";
      sig.append(a);
    }
    return cuerpo;
  }

  /** Tabla de comprobaciones (la usan resultado.html y las páginas que se evalúan solas). */
  function pintar(destino, comprobaciones) {
    const cuenta = { ok: 0, fallo: 0, "no-discrimina": 0, manual: 0, info: 0 };
    for (const c of comprobaciones) {
      cuenta[c.estado] = (cuenta[c.estado] ?? 0) + 1;
    }
    const nombres = {
      ok: "Bien",
      fallo: "Fallo",
      "no-discrimina": "No discrimina",
      manual: "A mano",
      info: "Información",
    };
    const resumen = document.createElement("div");
    resumen.className = "resumen tarjeta";
    for (const [k, n] of Object.entries(cuenta)) {
      const d = document.createElement("div");
      d.className = k;
      const b = document.createElement("b");
      b.textContent = String(n);
      d.append(b, nombres[k]);
      resumen.append(d);
    }
    const tabla = document.createElement("table");
    tabla.innerHTML = "<thead><tr><th>Comprobación</th><th>Se esperaba</th><th>Ha pasado</th><th>Estado</th></tr></thead>";
    const cuerpo = document.createElement("tbody");
    for (const c of comprobaciones) {
      const tr = document.createElement("tr");
      tr.className = c.estado;
      const celda = (texto, clase) => {
        const td = document.createElement("td");
        if (clase) {
          td.className = clase;
        }
        td.textContent = texto;
        return td;
      };
      const titulo = celda(c.titulo);
      if (c.porque || c.codigo) {
        const p = document.createElement("div");
        p.className = "porque";
        p.textContent = [c.porque, c.codigo ? `Código: ${c.codigo}` : ""].filter(Boolean).join(" · ");
        titulo.append(p);
      }
      tr.append(titulo, celda(c.esperado), celda(c.observado), celda(nombres[c.estado] ?? c.estado, `estado ${c.estado}`));
      cuerpo.append(tr);
    }
    tabla.append(cuerpo);
    const tarjeta = document.createElement("div");
    tarjeta.className = "tarjeta";
    tarjeta.append(tabla);
    destino.replaceChildren(resumen, tarjeta);
  }

  return { q, modo, run, caso, fase, auto, parametros, id, espera, json, registro, estabilizar, cargar, listo, pintar };
})();
