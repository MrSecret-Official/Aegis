/* Banco de pruebas de Escudos: qué se espera en cada caso y en cada modo, y el veredicto.
 *
 * Es la única fuente de los veredictos: la usa resultado.html (en el navegador, también en las pruebas a mano) y,
 * a través de esa página, el ejecutor tools/pruebas/escudos.py. Cada caso recibe:
 *   m         el modo (Banco.modo: nivel, escudos, cookies, huella, privada, permiso, google, contador, molestias)
 *   F         las fases guardadas: lo que vio cada página y, con nombre «nav-…», lo que el ejecutor vio en la
 *             interfaz del navegador (contador, panel, avisos, permisos). Si falta una «nav-…» (prueba a mano), la
 *             comprobación sale «a mano» con lo que hay que mirar.
 *   R         el registro del servidor: lo que de verdad salió del navegador
 *   B         la referencia: los valores reales del equipo (huella), medidos en la interfaz del navegador
 * y devuelve comprobaciones {titulo, esperado, observado, estado, porque, codigo}.
 * Estados: ok · fallo · no-discrimina (el valor protegido coincide con el real en este equipo: no se puede saber) ·
 * manual · info.
 */
"use strict";

const Casos = (() => {
  // ── Utilidades ────────────────────────────────────────────────────────────────────────────────────────────────

  const ESCUDOS = "overlay/browser/components/aegis/escudos.sys.mjs";
  const HUELLA = "overlay/browser/components/aegis/huella.sys.mjs";
  const PREFS_HUELLA = "settings/prefs/42-huella.js";
  const GOOGLE = "overlay/browser/components/aegis/google.sys.mjs";
  const RED_ESCUDOS = "overlay/browser/components/aegis/escudos/red.sys.mjs";
  const LISTAS = "overlay/browser/components/aegis/escudos/listas.sys.mjs";

  /** ¿Cuenta el contador peticiones (de serie) u orígenes? (aegis.escudos.contador) */
  const porOrigenes = m => m.contador === "origenes";

  function comp(titulo, esperado, observado, bien, extra = {}) {
    return {
      titulo,
      esperado: texto(esperado),
      observado: texto(observado),
      estado: extra.estado ?? (bien ? "ok" : "fallo"),
      porque: extra.porque ?? "",
      codigo: extra.codigo ?? "",
    };
  }

  function texto(v) {
    if (v === undefined) {
      return "—";
    }
    if (typeof v === "string") {
      return v;
    }
    if (typeof v === "boolean") {
      return v ? "sí" : "no";
    }
    return JSON.stringify(v);
  }

  const manual = (titulo, instruccion, extra = {}) =>
    comp(titulo, instruccion, "mirar a mano", false, { ...extra, estado: "manual" });

  const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  /** El mismo objeto con las claves en orden (para comparar sin que importe el orden de las categorías). */
  const ordenarClaves = o => Object.fromEntries(Object.keys(o ?? {}).sort().map(k => [k, o[k]]));

  /** ¿Llegó al servidor una petición con este id (parámetro id o aegisid)? */
  function llegadas(R, id) {
    return R.filter(p => {
      try {
        const s = new URL(p.url).searchParams;
        return s.get("id") === id || s.get("aegisid") === id;
      } catch {
        return false;
      }
    });
  }
  const llego = (R, id) => llegadas(R, id).length > 0;

  // ── Rastreadores ──────────────────────────────────────────────────────────────────────────────────────────────

  const CATEGORIAS = {
    rastreadores: "Rastreadores y anuncios",
    anuncios: "Anuncios (listas de filtros)",
    sociales: "Rastreadores de redes sociales",
    huella: "Huella digital",
    criptomineros: "Criptomineros",
    control: "Sitio normal (control)",
  };

  /**
   * ¿Debe bloquearse esta petición? La bloquea la protección contra rastreo (esperaBloqueoEtp) o, si no, el motor
   * propio con las listas: EasyPrivacy corta toda baliza (sendBeacon) a otro sitio («*$ping,third-party») y todos los
   * sitios de la página de rastreadores son de otro sitio.
   */
  function esperaBloqueo(cat, tipo, m) {
    return esperaBloqueoEtp(cat, tipo, m) || esperaBloqueoMotor(cat, tipo, m);
  }

  function esperaBloqueoMotor(cat, tipo, m) {
    return m.escudos !== "bajados" && tipo === "baliza" && !esperaBloqueoEtp(cat, tipo, m);
  }

  /** ¿Debe bloquearla la protección contra rastreo de Firefox (ETP)? */
  function esperaBloqueoEtp(cat, tipo, m) {
    if (cat === "control" || m.escudos === "bajados") {
      return false;
    }
    if (cat === "huella") {
      // Contenido pasivo (imágenes): la protección contra la huella del motor no lo bloquea, por diseño
      // (UrlClassifierFeatureFingerprintingProtection: IsPassiveContent).
      return tipo !== "imagen";
    }
    // La lista propia de redes sociales (social-tracking-protection) solo bloquea su carga en Estricto; en Normal,
    // sus cookies. Las redes sociales que están en la lista de rastreo (social-track-digest256) sí se bloquean.
    if (cat === "sociales" && m.nivel === "normal") {
      return false;
    }
    return true;
  }

  function porqueBloqueo(cat, m) {
    if (m.escudos === "bajados") {
      return "Escudos bajados en el sitio: la protección contra rastreo no actúa en él (ContentBlockingAllowList).";
    }
    if (cat === "control") {
      return "Un sitio que no está en ninguna lista nunca se bloquea.";
    }
    if (cat === "rastreadores" && m.nivel === "normal") {
      return (
        "Normal es la categoría «standard» del motor con privacy.trackingprotection.enabled = true de serie " +
        "(settings/prefs/58-escudos.js): los rastreadores conocidos se bloquean también en las ventanas normales."
      );
    }
    if (cat === "sociales" && m.nivel === "normal") {
      return "Lista propia de redes sociales (social-tracking-protection): en Normal se bloquean sus cookies, no su carga (eso es de Estricto).";
    }
    if (cat === "huella") {
      return "Lista de recolectores de huella (entrada de prueba en urlclassifier.features.fingerprinting.blacklistHosts). Las imágenes no se bloquean.";
    }
    return "Sitio de la lista de rastreo del clasificador.";
  }

  function rastreadores(m, F, R) {
    const lista = [];
    const p = F.pagina;
    if (!p) {
      return [comp("Página de rastreadores", "cargada", "sin datos", false)];
    }
    const bloqueadosPorOrigen = {};
    let peticionesBloqueadas = 0;
    for (const [host, cat] of p.hosts) {
      const bloqueados = [];
      const esperados = [];
      let porEtp = false;
      let porMotor = false;
      for (const tipo of p.tipos) {
        const id = `${p.url ? new URL(p.url).searchParams.get("run") : ""}.pagina.${host}.${tipo}`;
        const b = !llego(R, id);
        if (b) {
          bloqueados.push(tipo);
          peticionesBloqueadas++;
        }
        if (esperaBloqueo(cat, tipo, m)) {
          esperados.push(tipo);
        }
        if (b) {
          porEtp ||= esperaBloqueoEtp(cat, tipo, m);
          porMotor ||= esperaBloqueoMotor(cat, tipo, m);
        }
      }
      if (bloqueados.length) {
        // En el panel: en la categoría de ETP si ETP le bloqueó algo; si solo lo bloqueó el motor, en «anuncios».
        bloqueadosPorOrigen[`https://${host}`] = porEtp || !porMotor ? cat : "anuncios";
      }
      lista.push(
        comp(
          `${CATEGORIAS[cat]}: ${host}`,
          esperados.length ? `bloquea ${esperados.join(", ")}` : "no bloquea nada",
          bloqueados.length ? `bloquea ${bloqueados.join(", ")}` : "no bloquea nada",
          igual(bloqueados, esperados),
          {
            porque: porqueBloqueo(cat, m) + (m.escudos !== "bajados" ? " La baliza a otro sitio la corta también EasyPrivacy («*$ping,third-party») con el motor propio." : ""),
            codigo: "ETP del motor; categoría elegida en " + ESCUDOS + "; " + RED_ESCUDOS,
          }
        )
      );
    }
    const origenes = Object.keys(bloqueadosPorOrigen);
    // Lo que cuenta el contador: peticiones (de serie) u orígenes (aegis.escudos.contador = «origenes»).
    const n = porOrigenes(m) ? origenes.length : peticionesBloqueadas;
    const unidad = porOrigenes(m) ? "por origen" : "por petición";
    const esperadoContador = m.escudos === "bajados" || n === 0 ? "oculto (0)" : String(n > 99 ? "99+" : n);
    const nav = F["nav-pagina"];
    if (!nav) {
      lista.push(
        manual("Contador del botón de Escudos", `Debe marcar ${esperadoContador} (${unidad})`, {
          codigo: `${ESCUDOS}: bloqueado(), actualizar()`,
        })
      );
    } else {
      const visto = nav.contador.visible ? nav.contador.texto : "oculto (0)";
      lista.push(
        comp(`Contador del botón: lo bloqueado en la página, ${unidad}`, esperadoContador, visto, visto === esperadoContador, {
          porque: `Según el servidor: ${peticionesBloqueadas} peticiones bloqueadas de ${origenes.length} orígenes (${origenes.join(", ") || "ninguno"}).`,
          codigo: `${ESCUDOS}: bloqueado(), actualizar()`,
        })
      );
      if (m.escudos !== "bajados" && origenes.length > 0 && porOrigenes(m)) {
        lista.push(
          comp(
            "El mismo origen no cuenta dos veces",
            `${peticionesBloqueadas} peticiones bloqueadas → ${n} en el contador`,
            `${peticionesBloqueadas} peticiones bloqueadas → ${nav.contador.texto}`,
            peticionesBloqueadas > n && nav.contador.texto === String(n),
            { codigo: `${ESCUDOS}: bloqueado() (orígenes)` }
          )
        );
      }
      lista.push(
        comp("Botón tachado (Escudos bajados) solo si están bajados", m.escudos === "bajados", nav.bajados, nav.bajados === (m.escudos === "bajados"), {
          codigo: `${ESCUDOS}: actualizar() (atributo «bajados»)`,
        })
      );
      if (nav.panel) {
        lista.push(
          comp(
            "Panel: la cifra coincide con el botón",
            m.escudos === "bajados" ? "sin cifra, «Escudos bajados»" : String(n),
            m.escudos === "bajados" ? `${nav.panel.numeroOculto ? "sin cifra" : nav.panel.numero}, «${nav.panel.estado}»` : nav.panel.numero,
            m.escudos === "bajados" ? nav.panel.numeroOculto && nav.panel.interruptor === false : nav.panel.numero === String(n),
            { codigo: `${ESCUDOS}: pintarPanel()` }
          )
        );
        const esperadoDesglose = {};
        for (const [origen, cat] of Object.entries(bloqueadosPorOrigen)) {
          if (m.escudos !== "bajados") {
            (esperadoDesglose[cat] ??= []).push(new URL(origen).host);
          }
        }
        for (const k of Object.keys(esperadoDesglose)) {
          esperadoDesglose[k].sort();
        }
        const visto = Object.fromEntries(Object.entries(nav.panel.secciones ?? {}).map(([k, v]) => [k, [...v].sort()]));
        lista.push(
          comp("Panel: lista de lo bloqueado por categoría", esperadoDesglose, visto, igual(ordenarClaves(esperadoDesglose), ordenarClaves(visto)), {
            porque: "Cada origen en la categoría de su lista; un origen que entra en varias, solo en la primera.",
            codigo: `${ESCUDOS}: pintarLista(), BANDERAS_ETP`,
          })
        );
      }
    }
    const limpia = F["nav-limpia"];
    if (limpia) {
      lista.push(
        comp("Al ir a otra página, el contador vuelve a 0", "oculto (0)", limpia.contador.visible ? limpia.contador.texto : "oculto (0)", !limpia.contador.visible, {
          codigo: `${ESCUDOS}: onLocationChange → actualizar()`,
        })
      );
    } else {
      lista.push(manual("Al ir a otra página, el contador vuelve a 0", "Abre la página limpia: el contador desaparece"));
    }
    const ancla = F["nav-ancla"];
    if (ancla && nav) {
      lista.push(
        comp(
          "Un cambio de ancla (#) no es otra página: el contador se queda",
          nav.contador.visible ? nav.contador.texto : "oculto (0)",
          ancla.contador.visible ? ancla.contador.texto : "oculto (0)",
          ancla.contador.visible === nav.contador.visible && ancla.contador.texto === nav.contador.texto,
          { codigo: `${ESCUDOS}: LOCATION_CHANGE_SAME_DOCUMENT` }
        )
      );
    }
    const subidos = F["nav-subidos"];
    if (subidos) {
      lista.push(
        comp(
          "Al subir los Escudos, vuelve el bloqueo",
          `contador ${subidos.esperado}`,
          `contador ${subidos.contador.visible ? subidos.contador.texto : "oculto (0)"}`,
          subidos.contador.visible && subidos.contador.texto === subidos.esperado,
          { codigo: `${ESCUDOS}: interruptor del sitio (ContentBlockingAllowList.remove)` }
        )
      );
    }
    return lista;
  }

  // ── Cookies de terceros ──────────────────────────────────────────────────────────────────────────────────────

  /** Lo que se espera ver en cada fase: {cargado, visible}. */
  function esperaCookies(fase, m) {
    const bajados = m.escudos === "bajados";
    const aisladas = m.cookies === "5";
    // Normal y Estricto bloquean los rastreadores en todas las ventanas (58-escudos.js).
    const rastreoBloqueado = !bajados;
    switch (fase) {
      case "f1":
      case "f4":
        return { cargado: true, visible: aisladas || bajados };
      case "f2":
        // Con los Escudos bajados en sitio-a, su marco de sitio-b usa el almacén normal de sitio-b (sin aislar).
        return { cargado: true, visible: bajados };
      case "f3":
      case "f6":
        return { cargado: true, visible: false };
      case "f5":
        // Bloquear rastreo (5 = BEHAVIOR_PARTITION_FOREIGN en la 157): un rastreador que se carga tiene cookies, pero
        // aisladas por sitio (no lo sigue a otras webs: f7). Con «bloquear todas», ninguna.
        return { cargado: !rastreoBloqueado, visible: bajados || aisladas };
      case "f7":
        return { cargado: true, visible: bajados && !rastreoBloqueado };
      default:
        return null;
    }
  }

  const DESCRIPCION_COOKIES = {
    f1: "sitio-a.test con un marco de sitio-b.test que pone una cookie (JS y Set-Cookie) y localStorage",
    f2: "sitio-b.test abierto como sitio principal: ¿ve lo que puso su marco dentro de sitio-a?",
    f3: "sitio-c.test con un marco de sitio-b.test: ¿ve lo que puso dentro de sitio-a?",
    f4: "sitio-a.test otra vez con el marco de sitio-b.test: ¿sigue ahí lo suyo?",
    f5: "sitio-a.test con un marco de un rastreador (itisatracker.org) que intenta poner cookies",
    f6: "Ventana privada nueva: ¿queda algo de la anterior?",
    f7: "itisatracker.org abierto como sitio principal: ¿ve lo que puso como rastreador dentro de sitio-a?",
  };

  function cookies(m, F, R) {
    const lista = [];
    const run = Object.values(F)[0]?.url ? new URL(Object.values(F)[0].url).searchParams.get("run") : "";
    const sufijo = run.replace(/[^A-Za-z0-9]/g, "");
    for (const fase of ["f1", "f2", "f3", "f4", "f5", "f7", "f6"]) {
      const e = esperaCookies(fase, m);
      const d = F[fase];
      if (!d) {
        continue;
      }
      // La prueba de verdad: la cabecera Cookie que recibió el servidor en la petición «eco» de esa fase.
      const eco = llegadas(R, `${run}.${fase}.eco`)[0];
      const servidor = !!eco && eco.cookie.split(";").some(c => c.trim() === `ch_${sufijo}=v`);
      const cargado = d.cargado !== false && (!!eco || d.marco === null);
      const vio = { js: !!d.js, http: servidor, localStorage: d.ls === "si" };
      const esperado = e.cargado ? (e.visible ? "cookies y localStorage visibles" : "nada visible") : "marco bloqueado";
      let observado;
      let bien;
      if (!cargado) {
        observado = "marco bloqueado";
        bien = !e.cargado;
      } else {
        const todos = vio.js && vio.http && vio.localStorage;
        const ninguno = !vio.js && !vio.http && !vio.localStorage;
        observado = todos ? "cookies y localStorage visibles" : ninguno ? "nada visible" : `mezcla: ${texto(vio)}`;
        bien = e.cargado && (e.visible ? todos : ninguno);
        if (!ninguno && d.ls && d.ls.startsWith("excepcion")) {
          observado += ` (localStorage: ${d.ls})`;
        }
      }
      lista.push(
        comp(`${fase}: ${DESCRIPCION_COOKIES[fase]}`, esperado, observado, bien, {
          porque:
            m.cookies === "1"
              ? "Bloquear todas: ninguna cookie ni almacenamiento de terceros (network.cookie.cookieBehavior = 1)."
              : m.escudos === "bajados"
                ? "Escudos bajados en sitio-a: sin aislamiento por sitio para lo que carga sitio-a."
                : "Bloquear rastreo: las de terceros, aisladas por sitio principal (cookieBehavior = 5); las de rastreadores, nunca.",
          codigo: `${ESCUDOS}: desplegable de cookies (PREFS_COOKIES)`,
        })
      );
    }
    return lista;
  }

  // ── Solo HTTPS ───────────────────────────────────────────────────────────────────────────────────────────────

  function https(m, F, R) {
    const lista = [];
    const run = runDe(F);
    const deFase = fase => R.filter(p => new URL(p.url).searchParams.get("run") === run && new URL(p.url).searchParams.get("fase") === fase);
    if (F.h1) {
      const sinCifrar = deFase("h1").filter(p => p.esquema === "http");
      lista.push(
        comp("http://sitio-a.test se abre con https://", "https:, sin ninguna petición sin cifrar", `${F.h1.protocolo}, ${sinCifrar.length} sin cifrar`, F.h1.protocolo === "https:" && !sinCifrar.length, {
          porque: "Solo HTTPS pasa la petición a HTTPS antes de enviarla.",
          codigo: "settings/prefs/40-privacidad.js (dom.security.https_only_mode)",
        })
      );
    }
    const h2 = F["nav-h2"];
    // Hasta que se pone la excepción (después, abrir sin cifrar es lo pedido).
    const limite = h2?.momento ? h2.momento : Infinity;
    const fugaSoloHttp = deFase("h2").filter(p => p.esquema === "http" && p.t < limite);
    if (h2) {
      lista.push(
        comp("Sitio sin HTTPS: aviso en vez de abrirlo", "página de aviso de Solo HTTPS", h2.documento, h2.documento.startsWith("about:httpsonlyerror"), {
          codigo: "dom.security.https_only_mode",
        })
      );
    } else {
      lista.push(manual("Sitio sin HTTPS: aviso en vez de abrirlo", "Abre http://solo-http.test/: debe salir el aviso de Solo HTTPS"));
    }
    lista.push(
      comp("Mientras avisa, no se manda nada sin cifrar a ese sitio", "0 peticiones http", `${fugaSoloHttp.length} peticiones http`, fugaSoloHttp.length === 0, {
        porque: "Sin la petición HTTP de fondo (dom.security.https_only_mode_send_http_background_request = false).",
        codigo: "settings/prefs/40-privacidad.js",
      })
    );
    const b = F["nav-h2b"];
    if (b) {
      lista.push(
        comp("En el aviso de Solo HTTPS está el botón de Escudos (para poner la excepción)", "visible", b.boton ? "visible" : "oculto", b.boton, {
          porque: "escudos.sys.mjs tiene código para poner la excepción desde el aviso (about:httpsonlyerror); sin el botón no se puede usar.",
          codigo: `${ESCUDOS}: aplicable() y el interruptor «Pasar conexiones a HTTPS»`,
        })
      );
    }
    if (F.h3) {
      lista.push(
        comp(`Excepción desde ${F.h3.via === "aviso" ? "el aviso («Continuar al sitio HTTP»)" : "el panel"}: el sitio se abre sin cifrar`, "http:", F.h3.protocolo, F.h3.protocolo === "http:", {
          codigo: `${ESCUDOS}: interruptor «Pasar conexiones a HTTPS» (https-only-load-insecure)`,
        })
      );
    }
    const n3 = F["nav-h3"];
    if (n3) {
      lista.push(
        comp("Panel: el interruptor queda apagado y lo dice", `apagado, «${n3.detalleEsperado ?? "Este sitio puede abrirse sin cifrar"}»`, `${n3.interruptor ? "encendido" : "apagado"}, «${n3.detalle}»`, n3.interruptor === false && n3.detalle === (n3.detalleEsperado ?? "Este sitio puede abrirse sin cifrar"), {
          codigo: `${ESCUDOS}: pintarPanel() (excepcionHttps)`,
        })
      );
    }
    const n4 = F["nav-h4"];
    if (n4) {
      lista.push(
        comp("Al quitar la excepción, vuelve el aviso", "página de aviso de Solo HTTPS", n4.documento, n4.documento.startsWith("about:httpsonlyerror"), {
          codigo: `${ESCUDOS}: removeFromPrincipal(https-only-load-insecure)`,
        })
      );
    }
    if (F.h5) {
      lista.push(
        comp("Con excepción, un sitio que sí tiene HTTPS se abre sin cifrar", "http:", F.h5.protocolo, F.h5.protocolo === "http:", {
          codigo: `${ESCUDOS}: interruptor «Pasar conexiones a HTTPS»`,
        })
      );
    }
    if (F.h5b) {
      lista.push(
        comp("Al quitar la excepción desde el panel, vuelve a HTTPS", "https:", F.h5b.protocolo, F.h5b.protocolo === "https:", {
          codigo: `${ESCUDOS}: removeFromPrincipal(https-only-load-insecure)`,
        })
      );
    }
    if (F.h6) {
      lista.push(
        comp("Ventana privada: también pasa a HTTPS", "https:", F.h6.protocolo, F.h6.protocolo === "https:", {
          codigo: "dom.security.https_only_mode",
        })
      );
    }
    return lista;
  }

  // ── Olvidar este sitio ───────────────────────────────────────────────────────────────────────────────────────

  function olvidar(m, F) {
    const lista = [];
    const resumen = d => ({
      cookieJs: !!d.js,
      cookieServidor: !!d.httpServidor,
      localStorage: d.ls === "si",
      indexedDB: d.idb === "si",
      cache: d.cache === "si",
    });
    const todo = (d, v) => Object.values(resumen(d)).every(x => x === v);
    const n0 = F["nav-o0"];
    if (n0) {
      lista.push(
        comp("Panel: «Olvidar este sitio al cerrar» queda encendido", "encendido (permiso cookie de sesión)", `${n0.interruptor ? "encendido" : "apagado"} (permiso ${n0.permiso})`, n0.interruptor && n0.permiso === 8, {
          codigo: `${ESCUDOS}: interruptor «olvidar» (ALLOW_COOKIES_FOR_SESSION)`,
        })
      );
    }
    for (const [fase, host] of [
      ["o1", "sitio-a.test"],
      ["o2", "sitio-b.test"],
    ]) {
      if (F[fase]) {
        lista.push(
          comp(`Antes de cerrar, ${host} tiene sus datos (si no, la prueba no vale)`, resumen({ js: 1, httpServidor: 1, ls: "si", idb: "si", cache: "si" }), resumen(F[fase]), todo(F[fase], true))
        );
      }
    }
    if (F.o3) {
      lista.push(
        comp("Tras cerrar y abrir: sitio-a.test (con «Olvidar») no tiene nada", "nada", resumen(F.o3), todo(F.o3, false), {
          porque: "Sanitizer borra al cerrar las cookies y el almacenamiento de los sitios con permiso cookie = sesión.",
          codigo: `${ESCUDOS} → browser/modules/Sanitizer.sys.mjs (maybeSanitizeSessionPrincipals)`,
        })
      );
    } else {
      lista.push(manual("Tras cerrar y abrir: sitio-a.test no tiene nada", "Cierra Aegis, ábrelo y abre la fase o3"));
    }
    if (F.o4) {
      lista.push(comp("Tras cerrar y abrir: sitio-b.test (sin «Olvidar») lo conserva todo", "todo", resumen(F.o4), todo(F.o4, true)));
    }
    const n5 = F["nav-o5"];
    if (n5) {
      lista.push(comp("El permiso sigue tras reiniciar (y seguirá olvidando)", "encendido", n5.interruptor ? "encendido" : "apagado", n5.interruptor === true));
    }
    const n6 = F["nav-o6"];
    if (n6) {
      lista.push(
        comp("En una ventana privada la opción está desactivada", "desactivada, «Una ventana privada ya lo olvida todo…»", `${n6.desactivado ? "desactivada" : "activa"}, «${n6.detalle}»`, n6.desactivado === true, {
          codigo: `${ESCUDOS}: pintarPanel() (enPrivada)`,
        })
      );
    }
    return lista;
  }

  // ── Huella digital ───────────────────────────────────────────────────────────────────────────────────────────

  const ORDEN = { ninguna: -1, firefox: 0, equilibrada: 1, estricta: 2, caja_fuerte: 3 };
  const NOMBRE_NIVEL = { ninguna: "sin protección", firefox: "Básica", equilibrada: "Equilibrada", estricta: "Estricta", caja_fuerte: "Caja fuerte" };

  /**
   * Nivel que se aplica a una sonda: `sitio` (por sitio: Escudos bajados lo quita, el permiso de Caja fuerte lo baja a
   * Equilibrada) o `global` (de todo el navegador: ni los Escudos bajados ni el permiso lo cambian).
   */
  function nivelDe(m, ambito, { marco = false } = {}) {
    if (ambito === "global") {
      return m.huella;
    }
    if (m.escudos === "bajados") {
      return "ninguna";
    }
    if (!marco && m.huella === "caja_fuerte" && m.permiso === "1") {
      return "equilibrada";
    }
    return m.huella;
  }
  const desde = (L, minimo) => ORDEN[L] >= ORDEN[minimo];

  /**
   * Una sonda: oculta desde `minimo`. `protegido(v)` dice si el valor visto es el protegido; si el valor protegido es
   * también el real del equipo, la prueba no discrimina.
   */
  function sonda(lista, L, { titulo, minimo, real, visto, protegido, objetivo, nunca }) {
    const ocultar = !nunca && desde(L, minimo);
    const codigo = `${objetivo} · ${minimo === "firefox" ? "de serie del motor" : minimo === "equilibrada" ? PREFS_HUELLA : HUELLA}`;
    if (visto === undefined || visto === null) {
      lista.push(comp(titulo, ocultar ? "oculto" : "real", "sin dato", false, { estado: "info", codigo }));
      return;
    }
    const esProtegido = protegido(visto);
    const esReal = igual(visto, real);
    let estado;
    if (ocultar) {
      // Protegido y distinto del real: bien. Protegido pero igual que el real: en este equipo no se puede saber.
      estado = !esProtegido ? "fallo" : esReal ? "no-discrimina" : "ok";
    } else {
      estado = esReal ? "ok" : "fallo";
    }
    lista.push(
      comp(titulo, ocultar ? `oculto (${NOMBRE_NIVEL[L]})` : `real: ${texto(real)}`, texto(visto), estado === "ok", {
        estado,
        codigo,
        porque: ocultar ? `Real en este equipo: ${texto(real)}.` : nunca ? "No se toca en ningún nivel." : "",
      })
    );
  }

  const ZONAS_UTC = ["UTC", "Etc/UTC", "Etc/GMT", "Atlantic/Reykjavik", "GMT"];

  function evaluarHuella(m, v, B, { cabeceras = null, marco = null, prefijo = "", reiniciado = false, arrancadoEnCaja = false } = {}) {
    const lista = [];
    const t = B?.valores;
    if (!t) {
      return [comp(`${prefijo}Referencia (valores reales)`, "medida", "falta", false, { estado: "manual", porque: "Sin referencia no se puede comparar: el ejecutor la mide en la interfaz del navegador." })];
    }
    const S = nivelDe(m, "sitio");
    const G = nivelDe(m, "global");
    const P = prefijo;
    const tramo = n => (n >= 8 ? 8 : 4);

    sonda(lista, S, {
      titulo: `${P}Núcleos (hardwareConcurrency)`, minimo: "firefox", objetivo: "NavigatorHWConcurrencyTiered / NavigatorHWConcurrency",
      real: t.nucleos, visto: v.nucleos,
      // NavigatorHWConcurrency (4 fijo) solo en Caja fuerte: Estricta deja los tramos de serie (huella.sys.mjs).
      protegido: x => (desde(S, "caja_fuerte") ? x === 4 : x === tramo(t.nucleos)),
    });
    sonda(lista, S, {
      // Ningún nivel pone ScreenRect: la pantalla del tamaño de la ventana hacía la huella más rara (huella.sys.mjs).
      titulo: `${P}Tamaño de la pantalla`, minimo: "caja_fuerte", nunca: true, objetivo: "-ScreenRect",
      real: t.pantalla, visto: v.pantalla, protegido: () => false,
    });
    sonda(lista, S, {
      titulo: `${P}Área libre de la pantalla (sin la barra de tareas)`, minimo: "firefox", objetivo: "ScreenAvailToResolution / ScreenAvailRect",
      real: t.pantallaLibre, visto: v.pantallaLibre,
      // ScreenAvailToResolution: la pantalla menos una barra de tareas fija de 48 px (nsRFPService::GetSpoofedScreenAvailSize).
      protegido: x => igual(x, [v.pantalla[0], v.pantalla[1] - 48]),
    });
    sonda(lista, S, {
      titulo: `${P}Profundidad de color`, minimo: "equilibrada", objetivo: "ScreenPixelDepth",
      real: t.profundidad, visto: v.profundidad, protegido: x => igual(x, [24, 24]),
    });
    sonda(lista, S, {
      titulo: `${P}Densidad de píxeles (devicePixelRatio)`, minimo: "caja_fuerte", objetivo: "WindowDevicePixelRatio",
      real: t.dpr, visto: v.dpr, protegido: x => x === 2,
    });
    sonda(lista, S, {
      titulo: `${P}Tamaño exterior de la ventana`, minimo: "estricta", objetivo: "WindowOuterSize",
      real: t.exterior, visto: v.exterior, protegido: x => igual(x, v.ventana),
    });
    sonda(lista, S, {
      titulo: `${P}Posición de la ventana (screenX/Y)`, minimo: "estricta", objetivo: "WindowScreenXY",
      real: t.posicion, visto: v.posicion, protegido: x => igual(x, [0, 0]),
    });
    if (t.interior && v.interior) {
      const cerca = (a, b) => Math.abs(a[0] - b[0]) <= 2 && Math.abs(a[1] - b[1]) <= 2;
      const ocultar = desde(S, "estricta");
      const esReal = cerca(v.interior, t.interior);
      lista.push(
        comp(`${P}Posición de la web en la pantalla (mozInnerScreenX/Y)`, ocultar ? "oculta" : `real: ${texto(t.interior)}`, texto(v.interior), ocultar ? !esReal : esReal, {
          estado: ocultar && igual(t.interior, [0, 0]) ? "no-discrimina" : undefined,
          codigo: `WindowInnerScreenXY · ${HUELLA}`,
        })
      );
    }
    if (v.raton) {
      const igualCliente = v.raton.screenX === v.raton.clientX && v.raton.screenY === v.raton.clientY;
      const ocultar = desde(S, "estricta");
      lista.push(
        comp(`${P}Ratón: coordenadas de pantalla`, ocultar ? "relativas a la web (screenX = clientX)" : "reales (screenX ≠ clientX)", texto(v.raton), ocultar ? igualCliente : !igualCliente, {
          estado: !ocultar && t.interior && igual(t.interior, [0, 0]) ? "no-discrimina" : undefined,
          codigo: `MouseEventScreenPoint · ${HUELLA}`,
        })
      );
    } else {
      lista.push(manual(`${P}Ratón: coordenadas de pantalla`, "Mueve el ratón por la página de huella antes de que termine de medir"));
    }
    sonda(lista, S, {
      // Como screen.*: ningún nivel lo pone (huella.sys.mjs), y device-width tiene que cuadrar con screen.width.
      titulo: `${P}Media queries device-width/height`, minimo: "caja_fuerte", nunca: true, objetivo: "-CSSDeviceSize",
      real: t.dispositivo, visto: v.dispositivo, protegido: () => false,
    });
    // Lo que nunca se toca: el tema claro u oscuro (el perfil de prueba fuerza el oscuro para que se note).
    sonda(lista, S, {
      titulo: `${P}Tema oscuro (prefers-color-scheme)`, minimo: "caja_fuerte", nunca: true, objetivo: "-CSSPrefersColorScheme",
      real: "dark", visto: v.medios.tema, protegido: () => false,
    });
    sonda(lista, S, {
      titulo: `${P}Reducir movimiento (accesibilidad)`, minimo: "caja_fuerte", objetivo: "CSSPrefersReducedMotion",
      real: t.medios.movimiento, visto: v.medios.movimiento, protegido: x => x === "no-preference",
    });
    if (v.medios.transparencia === "?") {
      lista.push(comp(`${P}Reducir transparencias (accesibilidad)`, "—", "las webs no tienen esta media query en esta versión", true, { estado: "info", codigo: "CSSPrefersReducedTransparency" }));
    } else {
      sonda(lista, S, {
        titulo: `${P}Reducir transparencias (accesibilidad)`, minimo: "caja_fuerte", objetivo: "CSSPrefersReducedTransparency",
        real: t.medios.transparencia, visto: v.medios.transparencia, protegido: x => x === "no-preference",
      });
    }
    sonda(lista, S, {
      titulo: `${P}Contraste (prefers-contrast)`, minimo: "caja_fuerte", objetivo: "CSSPrefersContrast",
      real: t.medios.contraste, visto: v.medios.contraste, protegido: x => x === "no-preference",
    });
    sonda(lista, S, {
      titulo: `${P}Pantalla HDR (dynamic-range)`, minimo: "estricta", objetivo: "CSSVideoDynamicRange",
      real: t.medios.hdr, visto: v.medios.hdr, protegido: x => x === false,
    });
    sonda(lista, S, {
      titulo: `${P}Gama de color P3`, minimo: "equilibrada", objetivo: "CSSColorInfo",
      real: t.medios.gamaP3, visto: v.medios.gamaP3, protegido: x => x === false,
    });
    sonda(lista, S, {
      titulo: `${P}Tipo de puntero`, minimo: "estricta", objetivo: "CSSPointerCapabilities",
      real: t.medios.puntero, visto: v.medios.puntero, protegido: x => x === "fine",
    });
    sonda(lista, S, {
      titulo: `${P}Voces de lectura en voz alta`, minimo: "estricta", objetivo: "SpeechSynthesis",
      real: t.voces, visto: v.voces, protegido: x => x === 0,
    });
    sonda(lista, S, {
      // 44,1 kHz es menos común que la frecuencia real (casi siempre 48): ningún nivel lo pone (huella.sys.mjs).
      titulo: `${P}Frecuencia del audio`, minimo: "caja_fuerte", nunca: true, objetivo: "-AudioSampleRate",
      real: t.audio.frecuencia, visto: v.audio.frecuencia, protegido: () => false,
    });
    sonda(lista, S, {
      titulo: `${P}Latencia y canales del audio`, minimo: "equilibrada", objetivo: "AudioContext",
      // outputLatency fija (0,04 s en Windows) y como mucho 2 canales (AudioContext::OutputLatency, MaxChannelCount).
      real: [t.audio.salida, t.audio.canales], visto: [v.audio.salida, v.audio.canales],
      protegido: x => igual(x, [0.04, 2]),
    });
    sonda(lista, S, {
      titulo: `${P}Tarjeta gráfica (WebGL: fabricante y modelo)`, minimo: "equilibrada", objetivo: "WebGLVendorConstant / WebGLRendererConstant",
      real: [t.webgl.fabricante, t.webgl.modelo], visto: [v.webgl.fabricante, v.webgl.modelo],
      protegido: x => !igual(x, [t.webgl.fabricante, t.webgl.modelo]) && !String(x).includes("ANGLE"),
    });
    sonda(lista, S, {
      titulo: `${P}Capacidades de WebGL (tamaño máximo de textura)`, minimo: "estricta", objetivo: "WebGLRenderCapability",
      real: t.webgl.maxTextura, visto: v.webgl.maxTextura, protegido: x => x <= 2048,
    });
    lista.push(
      comp(`${P}Número de compilación (buildID)`, "20181001000000 (fijo)", v.buildID, v.buildID === "20181001000000", {
        porque: `El motor nunca da el real (${t.buildID}) a las webs, en ningún nivel (Navigator::GetBuildID): el objetivo NavigatorBuildID de Equilibrada no cambia nada que se vea.`,
        codigo: "dom/base/Navigator.cpp (LEGACY_BUILD_ID)",
      })
    );
    {
      const ocultar = desde(S, "equilibrada");
      lista.push(
        comp(`${P}Texto de los errores de vídeo (MediaError.message)`, ocultar ? "vacío" : "con texto", v.errorMedio, ocultar ? v.errorMedio === "" : !!v.errorMedio, {
          codigo: `MediaError · ${PREFS_HUELLA}`,
        })
      );
    }
    const ajustesFuentes = B.fuentes ?? { ocultables: [], base: [] };
    for (const f of ajustesFuentes.base ?? []) {
      lista.push(
        comp(`${P}Fuente de serie de Windows visible: ${f}`, "visible", v.fuentes[f] ? "visible" : "no visible", v.fuentes[f] === true, {
          porque: "Las fuentes de serie del sistema se ven en todos los niveles (si no, se romperían las webs).",
          codigo: "FontVisibilityBaseSystem",
        })
      );
    }
    for (const [grupo, minimo, nombre, objetivo] of [
      [ajustesFuentes.ocultables ?? [], "firefox", "instaladas por el usuario o por programas", "FontVisibilityLangPack (de serie del motor)"],
      [ajustesFuentes.idioma ?? [], "estricta", "de los paquetes de idioma de Windows", `FontVisibilityBaseSystem · ${HUELLA}`],
    ]) {
      const ocultar = desde(S, minimo);
      if (!grupo.length) {
        lista.push(comp(`${P}Fuentes ${nombre}`, ocultar ? "ocultas" : "visibles", "no hay ninguna en este equipo", false, { estado: "no-discrimina", codigo: objetivo }));
        continue;
      }
      const vistas = grupo.filter(f => v.fuentes[f]);
      lista.push(
        comp(`${P}Fuentes ${nombre} (${grupo.length})`, ocultar ? "ninguna visible" : "todas visibles", vistas.length ? `visibles: ${vistas.join(", ")}` : "ninguna visible", ocultar ? !vistas.length : vistas.length === grupo.length, {
          codigo: objetivo,
        })
      );
    }
    {
      const ocultar = desde(S, "caja_fuerte");
      const utc = ZONAS_UTC.includes(v.zona.nombre) && v.zona.enero === 0 && v.zona.julio === 0;
      lista.push(
        comp(`${P}Zona horaria`, ocultar ? "UTC" : `real: ${t.zona.nombre}`, `${v.zona.nombre} (${v.zona.enero}/${v.zona.julio})`, ocultar ? utc : igual(v.zona, t.zona), {
          estado: ocultar && ZONAS_UTC.includes(t.zona.nombre) ? "no-discrimina" : undefined,
          porque: ocultar ? "" : "La hora no se toca en Básica, Equilibrada ni Estricta.",
          codigo: `JSDateTimeUTC · ${HUELLA}`,
        })
      );
    }
    {
      // El idioma pedido es del navegador entero (intl.accept_languages): ni el permiso ni los Escudos bajados lo cambian.
      const ingles = G === "caja_fuerte";
      lista.push(
        comp(`${P}Idiomas (navigator.languages)`, ingles ? ["en-US", "en"] : t.idioma.lista, v.idioma.lista, ingles ? igual(v.idioma.lista, ["en-US", "en"]) : igual(v.idioma.lista, t.idioma.lista), {
          estado: ingles && igual(t.idioma.lista, ["en-US", "en"]) ? "no-discrimina" : undefined,
          codigo: `${HUELLA}: entrarEnCajaFuerte() / salirDeCajaFuerte()`,
        })
      );
      if (cabeceras) {
        lista.push(
          comp(`${P}Cabecera Accept-Language`, ingles ? "en-US,en;…" : "la de tus idiomas (es-ES…)", cabeceras.idioma, ingles ? cabeceras.idioma.startsWith("en-US") : cabeceras.idioma.startsWith(t.idioma.lista[0]), {
            codigo: `${HUELLA}: intl.accept_languages`,
          })
        );
      }
      sonda(lista, S, {
        titulo: `${P}Idioma de Intl`, minimo: "caja_fuerte", objetivo: "JSLocale",
        real: t.idioma.intl, visto: v.idioma.intl, protegido: x => x === "en-US",
      });
    }
    {
      const ocultar = desde(S, "caja_fuerte");
      const paso = v.temporizador.performance;
      lista.push(
        comp(`${P}Precisión de performance.now()`, ocultar ? "≥ 16 ms" : "≤ 1 ms", `${paso} ms`, ocultar ? paso >= 16 : paso !== null && paso <= 1.001, {
          codigo: `ReduceTimerPrecision · ${HUELLA}`,
        })
      );
    }
    {
      // Lo real, con un 6 % de margen (es una medida de tiempo).
      const ocultar = desde(G, "caja_fuerte");
      const cerca = (a, b) => a !== null && Math.abs(a - b) <= Math.max(3, b * 0.06);
      if (!ocultar && arrancadoEnCaja) {
        // El navegador arrancó en Caja fuerte: la frecuencia se quedó en 60 hasta el próximo arranque.
        lista.push(
          comp(`${P}Fotogramas por segundo (arrancó en Caja fuerte)`, "real tras reiniciar", v.fps, true, {
            estado: "info",
            porque: "Lo global de Caja fuerte se fija al arrancar: al salir de Caja fuerte sigue a 60 fps hasta reiniciar.",
            codigo: "gfx/thebes/gfxPlatform.cpp (LayoutFrameRateFromPrefs)",
          })
        );
      } else if (ocultar && !reiniciado) {
        // gfxPlatform fija la frecuencia del refresco al crear la fuente de vsync (al arrancar): hasta reiniciar, no
        // cambia. Se comprueba de verdad en «Caja fuerte tras reiniciar».
        lista.push(
          comp(`${P}Fotogramas por segundo (sin reiniciar)`, "60 tras reiniciar", v.fps, true, {
            estado: "info",
            porque: "FrameRate es global y se lee al crear la fuente de vsync (gfxPlatform::GetSoftwareVsyncRate): solo cambia al reiniciar.",
            codigo: "gfx/thebes/gfxPlatform.cpp (LayoutFrameRateFromPrefs)",
          })
        );
      } else {
        lista.push(
          comp(`${P}Fotogramas por segundo`, ocultar ? "60" : `real: ${t.fps}`, v.fps, ocultar ? cerca(v.fps, 60) : cerca(v.fps, t.fps), {
            estado: ocultar && cerca(t.fps, 60) ? "no-discrimina" : undefined,
            codigo: `FrameRate (de todo el navegador) · ${HUELLA}`,
          })
        );
      }
      if (reiniciado) {
        lista.push(
          comp(`${P}Límite de almacenamiento (navigator.storage.estimate)`, "fijo tras reiniciar", v.almacenamiento, true, {
            estado: "info",
            porque: "DiskStorageLimit: el valor se apunta para comparar entre equipos; aquí no hay otro equipo con el que compararlo.",
            codigo: `DiskStorageLimit · ${HUELLA}`,
          })
        );
      }
    }
    for (const api of ["getImageData", "toDataURL"]) {
      // getImageData: el método eficiente del motor (de serie, en todos los niveles) no toca los píxeles: el ruido en
      // ellos lo detectaba CreepJS como mentira (huella.sys.mjs, DELATA). toDataURL lleva ruido desde Básica.
      const conRuido = api === "toDataURL" ? desde(S, "firefox") : false;
      const esperado = S === "ninguna" ? "real" : desde(S, "caja_fuerte") ? "bloqueado" : conRuido ? "ruido" : "real";
      const d = v.lienzo[api] ?? {};
      lista.push(
        comp(`${P}Lectura de un lienzo con ${api}`, esperado, `${d.estado} (${d.cambiados ?? "?"} de ${d.total ?? "?"} píxeles distintos)`, d.estado === esperado, {
          porque:
            esperado === "bloqueado"
              ? "Caja fuerte: sin un clic del usuario no se deja leer (sale un relleno)."
              : esperado === "ruido"
                ? "Ruido en la imagen: con el método eficiente, un bloque al azar (deBG) dentro del PNG que cambia su hash."
                : api === "getImageData" && S !== "ninguna"
                  ? "El método eficiente del motor (EfficientCanvasRandomization) solo marca el PNG de toDataURL y toBlob: getImageData devuelve los píxeles tal cual (el ruido en ellos se detectaba)."
                  : "",
          codigo: "CanvasRandomization / EfficientCanvasRandomization / CanvasExtractionBeforeUserInputIsBlocked",
        })
      );
    }
    {
      const real = B.contenido?.matematicas ?? t.matematicas;
      const distintas = real.filter((x, i) => x !== v.matematicas[i]).length;
      const ocultar = desde(S, "firefox");
      lista.push(
        comp(`${P}Matemáticas (fdlibm en vez de la libm del sistema)`, ocultar ? "algún resultado distinto del sistema" : "los del sistema", `${distintas} de ${real.length} distintos`, ocultar ? distintas > 0 : distintas === 0, {
          estado: ocultar && distintas === 0 ? "no-discrimina" : undefined,
          porque: ocultar && distintas === 0 ? "En este equipo la libm del sistema da los mismos resultados que fdlibm en estas funciones: no se puede ver la diferencia." : "",
          codigo: "JSMathFdlibm (de serie del motor)",
        })
      );
    }
    sonda(lista, G, {
      titulo: `${P}WebCodecs`, minimo: "caja_fuerte", objetivo: "WebCodecs (global)",
      real: t.webcodecs, visto: v.webcodecs, protegido: x => !igual(x, t.webcodecs),
    });
    if (B.contenido?.coloresSistema) {
      // La referencia es la de una web sin protección (Escudos bajados): la ventana del navegador tiene su propio tema.
      sonda(lista, G, {
        titulo: `${P}Colores del sistema`, minimo: "caja_fuerte", objetivo: "UseStandinsForNativeColors (de todo el navegador)",
        // Las webs ya reciben colores de sustitución del propio motor (tema no nativo): en Caja fuerte pueden coincidir.
        real: B.contenido.coloresSistema, visto: v.coloresSistema, protegido: () => true,
      });
    }
    lista.push(
      comp(`${P}Señal Global Privacy Control (navigator.globalPrivacyControl)`, true, v.gpc, v.gpc === true, {
        porque: "En todos los niveles, también en ventanas normales.",
        codigo: `${PREFS_HUELLA} (privacy.globalprivacycontrol.enabled)`,
      })
    );
    if (cabeceras) {
      lista.push(
        comp(`${P}Cabecera Sec-GPC`, "1", cabeceras.gpc || "(no llega)", cabeceras.gpc === "1", { codigo: PREFS_HUELLA })
      );
      lista.push(
        comp(`${P}Referer a otro sitio: solo el origen`, "https://sitio-a.test/", cabeceras.referer || "(vacío)", /^https:\/\/[^/]+\/$/.test(cabeceras.referer), {
          codigo: `${PREFS_HUELLA} (network.http.referer.XOriginTrimmingPolicy = 2)`,
        })
      );
    }
    if (marco !== undefined) {
      lista.push(...evaluarMarco(m, marco, t));
    }
    return lista;
  }

  /** El marco de otro sitio: mismo nivel que la página, salvo el permiso de Caja fuerte (que es solo del sitio). */
  function evaluarMarco(m, v, t) {
    const lista = [];
    if (!v) {
      return [comp("Marco de otro sitio", "medido", "no contestó", false)];
    }
    const L = nivelDe(m, "sitio", { marco: true });
    const caja = desde(L, "caja_fuerte");
    const utc = ZONAS_UTC.includes(v.zona.nombre) && v.zona.enero === 0;
    lista.push(
      comp("Marco de otro sitio: zona horaria", caja ? "UTC" : `real: ${t.zona.nombre}`, v.zona.nombre, caja ? utc : igual(v.zona, t.zona), {
        porque: m.permiso === "1" ? "El permiso de Caja fuerte es del sitio principal: lo que otros sitios meten dentro sigue en Caja fuerte." : "",
        codigo: `${HUELLA}: granularDe() (firstPartyDomain)`,
      })
    );
    const esperado = L === "ninguna" ? "real" : caja ? "bloqueado" : "ruido";
    const visto = v.lienzo.toDataURL?.estado;
    lista.push(
      comp("Marco de otro sitio: lectura de un lienzo (toDataURL)", esperado, visto, visto === esperado, {
        porque: caja ? "Caja fuerte: los terceros nunca pueden leer un lienzo (CanvasExtractionFromThirdPartiesIsBlocked)." : "",
        codigo: "CanvasExtractionFromThirdPartiesIsBlocked",
      })
    );
    // 4 fijos solo en Caja fuerte; Estricta deja los tramos de serie, como la página principal (línea de arriba).
    const nucleos = L === "ninguna" ? t.nucleos : desde(L, "caja_fuerte") ? 4 : t.nucleos >= 8 ? 8 : 4;
    lista.push(comp("Marco de otro sitio: núcleos", nucleos, v.nucleos, v.nucleos === nucleos, { codigo: "NavigatorHWConcurrency" }));
    return lista;
  }

  function cabecerasDe(R, run, fase) {
    const p = llegadas(R, `${run}.${fase}.cabeceras`)[0];
    return p ? { idioma: p.idioma, gpc: p.gpc, referer: p.referer } : null;
  }

  function huella(m, F, R, B) {
    const p = F.p;
    if (!p) {
      return [comp("Página de huella", "medida", "sin datos", false)];
    }
    const run = runDe(F);
    const lista = evaluarHuella(m, p.valores, B, { cabeceras: cabecerasDe(R, run, "p"), marco: p.marco, reiniciado: !!F["nav-p"]?.reiniciado, arrancadoEnCaja: !!F["nav-p"]?.arrancadoEnCaja });
    const nav = F["nav-p"];
    if (nav) {
      const caja = m.huella === "caja_fuerte";
      lista.push(
        comp("Marco de Caja fuerte en todas las ventanas (atributo aegis-caja-fuerte)", caja ? "en todas" : "en ninguna", nav.ventanas, nav.ventanas.every(x => x === caja), {
          codigo: `${HUELLA}: marcarVentana()`,
        })
      );
      if (nav.panelNivel) {
        const nombres = { firefox: "Básica", equilibrada: "Equilibrada", estricta: "Estricta", caja_fuerte: "Caja fuerte" };
        const esperado = nav.panelNivelEsperado ?? nombres[m.huella];
        lista.push(comp("Panel de Escudos: el desplegable «Huella digital» dice el nivel", esperado, nav.panelNivel, nav.panelNivel === esperado, { codigo: `${ESCUDOS}: pintarHuella()` }));
      }
      if (nav.idiomasPref !== undefined && m.huella !== "caja_fuerte") {
        lista.push(comp("Idiomas del navegador como estaban (intl.accept_languages)", B.idiomasPref, nav.idiomasPref, nav.idiomasPref === B.idiomasPref, { codigo: `${HUELLA}: salirDeCajaFuerte()` }));
      }
    }
    return lista;
  }

  // ── Caja fuerte: aviso, permiso por sitio, privadas ──────────────────────────────────────────────────────────

  function cajafuerte(m, F, R, B) {
    const lista = [];
    const n = F;
    const aviso = (fase, titulo, esperado, extra = {}) => {
      const d = n[fase];
      if (!d) {
        lista.push(manual(titulo, esperado ? "Debe salir el aviso junto al botón de Escudos" : "No debe salir el aviso"));
        return;
      }
      lista.push(comp(titulo, esperado ? "aviso junto al botón de Escudos" : "sin aviso", d.aviso ? `aviso${d.anclado ? " junto al botón de Escudos" : " (en otro sitio)"}` : "sin aviso", esperado ? d.aviso && d.anclado : !d.aviso, { codigo: `${HUELLA}: avisar()`, ...extra }));
    };
    aviso("nav-aviso-sitio", "La propia web saca la huella (lienzo y fuentes): avisa", true);
    aviso("nav-aviso-fuentes", "La propia web solo sondea fuentes: avisa", true);
    aviso("nav-aviso-marco", "Lo hace un marco de otro sitio: no avisa", false, {
      porque: "El permiso no cambiaría nada para un marco de otro sitio (sigue en Caja fuerte).",
    });
    if (n["nav-aviso-todataurl"]) {
      const d = n["nav-aviso-todataurl"];
      lista.push(
        comp("Un recolector que lee el lienzo con toDataURL", "sin aviso (límite conocido del motor)", d.aviso ? "aviso" : "sin aviso", true, {
          estado: "info",
          porque: "En Caja fuerte toDataURL devuelve el lienzo en blanco sin anotar el uso (HTMLCanvasElement::ExtractData solo llama a RecordCanvasUsage si no es Placeholder), así que el motor no lo reconoce. docs/PRIVACIDAD.md ya dice que no reconoce todos los intentos.",
          codigo: "dom/html/HTMLCanvasElement.cpp (ExtractData)",
        })
      );
    }
    const pe = n["nav-permitir"];
    if (pe) {
      lista.push(comp("«Permitir en este sitio» en el aviso guarda el permiso", "permiso aegis-huella para sitio-d.test", pe.permisos, pe.permisos.includes("sitio-d.test"), { codigo: `${HUELLA}: permitir()` }));
      lista.push(comp("…y lo lleva a granularOverrides", "sitio-d.test en la lista", pe.granular, String(pe.granular).includes('"sitio-d.test"'), { codigo: `${HUELLA}: granularDe()` }));
      lista.push(comp("…y el panel lo muestra encendido", "encendido, «Datos del navegador: protección equilibrada»", `${pe.interruptor ? "encendido" : "apagado"}, «${pe.detalle}»`, pe.interruptor === true, { codigo: `${ESCUDOS}: pintarHuella()` }));
    }
    if (n["p-permiso"]) {
      const mm = { ...m, huella: "caja_fuerte", permiso: "1", escudos: "arriba" };
      lista.push(...evaluarHuella(mm, n["p-permiso"].valores, B, { marco: n["p-permiso"].marco, prefijo: "Con permiso · " }).filter(c => SONDAS_CLAVE.test(c.titulo)));
    }
    const qa = n["nav-quitar-ajustes"];
    if (qa) {
      lista.push(comp("Ajustes › Privacidad lista el sitio con permiso", "sitio-d.test", qa.listaAntes, qa.listaAntes.includes("sitio-d.test"), { codigo: "overlay/browser/components/aegis/ajustes.sys.mjs: huellaDigital()" }));
      lista.push(comp("«Quitar» en Ajustes quita el permiso", "sin permiso", qa.permisosDespues, !qa.permisosDespues.includes("sitio-d.test") && !String(qa.granularDespues).includes("sitio-d.test"), { codigo: `${HUELLA}: permitir(dominio, false)` }));
    }
    if (n["p-sin-permiso"]) {
      const mm = { ...m, huella: "caja_fuerte", permiso: "0", escudos: "arriba" };
      lista.push(...evaluarHuella(mm, n["p-sin-permiso"].valores, B, { prefijo: "Sin permiso otra vez · " }).filter(c => SONDAS_CLAVE.test(c.titulo)));
    }
    const ol = n["nav-olvidar-sitio"];
    if (ol) {
      lista.push(comp("El interruptor del panel también da el permiso", "con permiso", ol.permisosAntes, ol.permisosAntes.includes("sitio-d.test"), { codigo: `${ESCUDOS}: interruptor «Permitir en este sitio»` }));
      lista.push(comp("Borrar los datos del sitio («Olvidar este sitio») quita el permiso", "sin permiso", ol.permisosDespues, !ol.permisosDespues.includes("sitio-d.test") && !String(ol.granularDespues).includes("sitio-d.test"), { codigo: `${HUELLA}: observador perm-changed` }));
    }
    aviso("nav-una-vez", "Una vez por sitio y sesión: no vuelve a avisar en sitio-d.test", false);
    const pr = n["nav-privada"];
    if (pr) {
      lista.push(comp("Ventana privada: sin aviso aunque la web saque la huella", "sin aviso", pr.aviso ? "aviso" : "sin aviso", !pr.aviso, { codigo: `${HUELLA}: avisar() (usePrivateBrowsing)` }));
      lista.push(comp("Ventana privada: «Permitir en este sitio» desactivado", "desactivado, «Solo desde una ventana normal»", `${pr.desactivado ? "desactivado" : "activo"}, «${pr.detalle}»`, pr.desactivado === true, { codigo: `${ESCUDOS}: pintarHuella()` }));
      lista.push(comp("Ventana privada: marco de Caja fuerte", "sí", pr.marcoCaja, pr.marcoCaja === true, { codigo: `${HUELLA}: marcarVentana()` }));
      if (pr.permisosTrasIntento !== undefined) {
        lista.push(comp("Desde una ventana privada no se guarda el permiso", "sin permiso para sitio-h.test", pr.permisosTrasIntento, !pr.permisosTrasIntento.includes("sitio-h.test"), { codigo: `${HUELLA}: permitir(…, privada)` }));
      }
    }
    if (n["p-privada-permiso"]) {
      const mm = { ...m, huella: "caja_fuerte", permiso: "1", escudos: "arriba", privada: "1" };
      lista.push(...evaluarHuella(mm, n["p-privada-permiso"].valores, B, { prefijo: "Privada con permiso de la normal · " }).filter(c => SONDAS_CLAVE.test(c.titulo)));
    }
    const cl = n["nav-lienzo-clic"];
    if (cl) {
      lista.push(comp("Sin clic: la web no puede leer el lienzo ni abre el aviso del navegador", "sin aviso abierto", cl.antes, !cl.antes.abierto, { codigo: "CanvasExtractionBeforeUserInputIsBlocked" }));
      lista.push(comp("Con un clic: aviso del navegador para leer el lienzo", "aviso «canvas-permissions-prompt» abierto", cl.despues, cl.despues.existe && cl.despues.abierto, { codigo: "CanvasImageExtractionPrompt" }));
    }
    return lista;
  }
  /** Las sondas que dicen si el sitio está en Caja fuerte o en Equilibrada (para las fases de permiso). */
  const SONDAS_CLAVE = /Zona horaria|lienzo con toDataURL|lienzo \(toDataURL\)|Núcleos|Tarjeta gráfica|Idiomas \(/;

  // ── Google limpio ────────────────────────────────────────────────────────────────────────────────────────────

  const PARAMETROS_RASTREO = ["ved", "ei", "oq", "sxsrf", "gs_lcrp", "client"];

  function google(m, F, R) {
    const lista = [];
    const run = runDe(F);
    const activo = m.google === "1" && m.escudos === "arriba";
    const porqueInactivo = m.google !== "1" ? "Google limpio apagado (aegis.google.limpio = false)." : "Escudos bajados en el sitio: Google limpio no toca nada.";
    const cancelados = new Set();
    let canceladas = 0;
    for (const fase of ["g-inicio", "g-youtube", "g-terceros"]) {
      if (!F[fase] || typeof PeticionesGoogle === "undefined") {
        continue;
      }
      for (const [etiqueta, url, tipo, espera] of PeticionesGoogle[fase]) {
        const llegada = llego(R, `${run}.${fase}.${etiqueta}`);
        if (!llegada) {
          cancelados.add(fase === "g-inicio" ? new URL(url).origin : "");
          canceladas += fase === "g-inicio" ? 1 : 0;
        }
        // Las listas del motor propio también actúan (con los Escudos arriba, también sin Google limpio): lo que
        // deciden lo da el propio motor (nav-g-motor, el ejecutor se lo pregunta con el origen de cada página).
        const porListas = m.escudos === "arriba" && !!F["nav-g-motor"]?.[fase]?.[etiqueta];
        const porGoogle = activo && espera === "cancelar";
        const cancelar = porGoogle || porListas;
        lista.push(
          comp(`${fase === "g-inicio" ? "Google" : fase === "g-youtube" ? "YouTube" : "Otra web"}: ${new URL(url).host}${new URL(url).pathname} (${tipo})`, cancelar ? "cancelada" : "llega", llegada ? "llega" : "cancelada", llegada !== cancelar, {
            porque: porListas && !porGoogle
              ? "La cortan las listas de filtros del motor propio (uBlock filters, EasyList, EasyPrivacy, AdGuard), que mandan sobre las excepciones de Google limpio."
              : !activo ? porqueInactivo : espera === "etp" ? "Script que la protección contra rastreo sabe sustituir: se le deja a ella. Sin sus listas (el banco no las descarga), se carga, como dice docs/PRIVACIDAD.md." : espera === "pasar" ? "Hace falta (inicio de sesión, reCAPTCHA, contenido…)." : "",
            codigo: `${GOOGLE}: REGLAS, SOLO_PUBLICIDAD, CON_SUSTITUTO; ${RED_ESCUDOS}`,
          })
        );
      }
    }
    cancelados.delete("");
    const nav = F["nav-g-inicio"];
    if (nav) {
      const cuenta = porOrigenes(m) ? cancelados.size : canceladas;
      const esperado = m.escudos !== "arriba" || !cuenta ? "oculto (0)" : String(cuenta);
      const visto = nav.contador.visible ? nav.contador.texto : "oculto (0)";
      const enPanel = new Set(Object.values(nav.secciones ?? {}).flat());
      const faltan = [...cancelados].map(o => new URL(o).host).filter(h => !enPanel.has(h));
      lista.push(
        comp(`Contador de Escudos en Google: ${porOrigenes(m) ? "orígenes cancelados" : "peticiones canceladas"} (Google limpio y listas)`, esperado, visto, visto === esperado, {
          porque: `Cancelados: ${[...cancelados].join(", ") || "ninguno"}.${faltan.length ? ` Faltan en el panel: ${faltan.join(", ")}.` : ""}`,
          codigo: `${GOOGLE} → ${ESCUDOS}: anotar()`,
        })
      );
    }
    const consulta = fase => {
      const d = F[fase];
      return d ? new URLSearchParams(d.consulta) : null;
    };
    for (const [fase, titulo, conUdm] of [
      ["g-busqueda", "Búsqueda desde la barra de direcciones", true],
      ["g-busqueda-tbm", "Búsqueda de imágenes desde la barra (tbm=isch)", false],
      ["g-busqueda-enlace", "Búsqueda desde un enlace de la propia página", false],
    ]) {
      const q = consulta(fase);
      if (!q) {
        continue;
      }
      // Lo que recibió el servidor: la dirección de verdad (la limpieza es interna, antes de enviar).
      const recibida = R.filter(p => p.ruta === "/search" && new URLSearchParams(p.consulta).get("fase") === fase && new URLSearchParams(p.consulta).get("run") === run);
      const sucios = recibida.flatMap(p => PARAMETROS_RASTREO.filter(k => new URLSearchParams(p.consulta).has(k)));
      const udm = recibida.some(p => new URLSearchParams(p.consulta).get("udm") === "14");
      const esperado = activo ? `sin ${PARAMETROS_RASTREO.join(", ")}${conUdm ? "; con udm=14" : "; sin udm"}` : "tal cual (con ved, ei…; sin udm)";
      const observado = `${recibida.length} petición(es); ${sucios.length ? `con ${[...new Set(sucios)].join(", ")}` : "sin parámetros de rastreo"}; ${udm ? "con udm=14" : "sin udm"}`;
      const bien = recibida.length > 0 && (activo ? !sucios.length && udm === conUdm : sucios.length > 0 && !udm);
      lista.push(comp(`${titulo}: lo que recibe Google`, esperado, observado, bien, { codigo: `${GOOGLE}: documento() (PARAMETROS_BUSQUEDA, udm=14)` }));
    }
    const directo = (fase, titulo, debeIrDirecto, extra = {}) => {
      const pasoPorUrl = llego(R, `${run}.${fase}.url`);
      const destino = F[fase];
      const fueDirecto = !!destino && !pasoPorUrl;
      if (!destino && !pasoPorUrl) {
        lista.push(comp(titulo, debeIrDirecto ? "directo al destino" : "pasa por google.com/url", "no se abrió nada", false, extra));
        return;
      }
      lista.push(comp(titulo, debeIrDirecto ? "directo al destino" : "pasa por google.com/url", fueDirecto ? "directo al destino" : "pasa por google.com/url", fueDirecto === debeIrDirecto, { codigo: `${GOOGLE}: documento() (enlaces directos)`, ...extra }));
    };
    directo("g-url-firmado", "Resultado de Google firmado (usg), clic desde Google", activo);
    directo("g-url-sinfirma", "Enlace de Google sin firma, clic desde Google", false, { porque: "Un enlace sin firma sigue pasando por el aviso de Google." });
    if (F["g-url-javascript"] !== undefined || llego(R, `${run}.g-url-javascript.url`)) {
      const paso = llego(R, `${run}.g-url-javascript.url`);
      lista.push(comp("Enlace de Google con destino javascript:", "pasa por google.com/url (nunca se ejecuta)", paso ? "pasa por google.com/url" : "no llegó", paso, { codigo: `${GOOGLE}: destinoDirecto()` }));
    }
    directo("g-url-externo", "Enlace firmado a google.com/url desde otra web", false, { porque: "Solo se hace directo si el clic sale de una página de Google." });
    directo("g-yt-redirect", "Enlace de la descripción de YouTube (/redirect)", activo);
    if (F["g-url-firmado"] && activo) {
      const q = new URLSearchParams(F["g-url-firmado"].consulta);
      const quitado = !q.has("gclid");
      lista.push(
        comp("El destino llega sin gclid (query stripping nativo)", m.nivel === "estricto" ? "sin gclid" : "sin gclid (solo lo promete Estricto)", quitado ? "sin gclid" : "con gclid", quitado, {
          estado: m.nivel === "estricto" ? undefined : quitado ? "ok" : "info",
          porque: "privacy.query_stripping.enabled lo enciende la categoría estricta (settings/prefs/59-google.js).",
          codigo: `${GOOGLE}: sinParametrosNativos()`,
        })
      );
    }
    return lista;
  }

  // ── Lo que no se debe romper ─────────────────────────────────────────────────────────────────────────────────

  function control(m, F, R) {
    const lista = [];
    const c = F["c-control"];
    if (c) {
      for (const [k, v] of Object.entries(c.recursos)) {
        lista.push(comp(`Recurso ${k}`, "carga", v, v === "carga"));
      }
      lista.push(comp("Formulario (POST a la misma web)", { nombre: "Ada", comentario: "hola, ñandú" }, c.formulario.campos ?? c.formulario, igual(c.formulario.campos, { nombre: "Ada", comentario: "hola, ñandú" })));
      lista.push(comp("Vídeo local (WebM)", "se reproduce", c.video, c.video.reproduce === true && c.video.ancho > 0));
    }
    const cu = F["c-cuenta"];
    if (cu) {
      lista.push(comp("Inicio de sesión de prueba (cookie de sesión de la propia web)", "prueba", cu.usuario ?? "sin sesión", cu.usuario === "prueba"));
    } else {
      lista.push(manual("Inicio de sesión de prueba", "Pulsa «Entrar» en la página de control: tiene que decir «Hola, prueba»"));
    }
    return lista;
  }

  // ── Red ──────────────────────────────────────────────────────────────────────────────────────────────────────

  /** Conexiones de fuera que docs/CONEXIONES.md ya da por pendientes (aviso «Estado (fase 0)»). */
  const CONOCIDAS = [
    [/^firefox\.settings\.services\.mozilla\.com$|^firefox-settings-attachments\.cdn\.mozilla\.net$|^content-signature-2\.cdn\.mozilla\.net$/, "Remote Settings (pendiente de la fase 1)"],
    [/^shavar\.services\.mozilla\.com$|^safebrowsing\.googleapis\.com$|^safebrowsing\.google\.com$/, "listas de la protección contra rastreo y de Safe Browsing (fase 1)"],
    [/^push\.services\.mozilla\.com$/, "push (fase 1)"],
    [/^aus5\.mozilla\.org$|\.gvt1\.com$|^ciscobinary\.openh264\.org$|^update\.googleapis\.com$/, "GMP: OpenH264 y Widevine (fase 1; update.googleapis.com es media.gmp-manager.chromium-update-url)"],
    [/^github\.com$|githubusercontent\.com$/, "comprobación de actualizaciones (docs/CONEXIONES.md, primera fila)"],
  ];

  function red(m, F, R) {
    const lista = [];
    const n = F["nav-red"];
    const conAegis = R.filter(p => /aegis/i.test(p.ua));
    lista.push(comp("El User-Agent nunca lleva «Aegis»", "0 peticiones", `${conAegis.length} de ${R.length}`, conAegis.length === 0, { codigo: "docs/GUIA.md, «Reglas al cambiar cosas»" }));
    if (!n) {
      lista.push(manual("Conexiones fuera de este equipo", "Solo con el ejecutor (mira el proxy, MOZ_LOG y netstat)"));
      return lista;
    }
    const porHost = {};
    for (const e of n.externas) {
      const host = e.destino.replace(/^[a-z]+:\/\//, "").split(/[/:]/)[0];
      porHost[host] = (porHost[host] ?? 0) + 1;
    }
    for (const [host, veces] of Object.entries(porHost).sort()) {
      const conocida = CONOCIDAS.find(([re]) => re.test(host));
      lista.push(
        comp(`Intento de conexión por su cuenta: ${host}`, conocida ? "documentada como pendiente" : "ninguna fuera de docs/CONEXIONES.md", `${veces} vez/veces (cortada por el proxy del banco)`, !!conocida, {
          estado: conocida ? "info" : "fallo",
          porque: conocida ? conocida[1] : "No está en docs/CONEXIONES.md: principio 1 de docs/GUIA.md.",
        })
      );
    }
    const dns = Object.entries(n.dns).filter(([h]) => !["127.0.0.1", "localhost", "::1"].includes(h));
    lista.push(comp("Resoluciones DNS propias (MOZ_LOG nsHostResolver)", "ninguna fuera de 127.0.0.1", dns.length ? dns.map(([h, k]) => `${h} ×${k}`).join(", ") : "ninguna", !dns.length, { porque: "Con un proxy, el navegador no debe resolver nombres por su cuenta: sería salir sin él." }));
    const tcp = Object.keys(n.tcp);
    lista.push(comp(`Conexiones TCP fuera de 127.0.0.1 (netstat, ${n.muestras} muestras)`, "ninguna", tcp.length ? tcp.join(", ") : "ninguna", !tcp.length));
    return lista;
  }

  // ── Anuncios (motor propio con las listas de filtros) ─────────────────────────────────────────────────────────

  /** ¿Está activo el grupo de listas en este modo? molestias: letras de los grupos encendidos (c, v, a). */
  function grupoActivo(grupo, m) {
    switch (grupo) {
      case "base":
        return true;
      case "rastreo":
        return m.nivel === "estricto+";
      case "cookies":
        return (m.molestias ?? "cva").includes("c");
      case "ventanas":
        return (m.molestias ?? "cva").includes("v");
      case "antiadblock":
        return (m.molestias ?? "cva").includes("a");
      default:
        return false;
    }
  }

  const GRUPOS_LISTAS = {
    base: "listas de serie (uBlock filters, EasyList, EasyPrivacy, AdGuard Base, Brave), en todos los niveles",
    rastreo: "AdGuard Tracking Protection: solo en Estricto+",
    cookies: "molestias · avisos de cookies (aegis.escudos.molestias.cookies)",
    ventanas: "molestias · ventanas y banners (aegis.escudos.molestias.ventanas)",
    antiadblock: "molestias · avisos anti-bloqueador (aegis.escudos.molestias.antiadblock)",
    control: "un sitio que no está en ninguna lista",
  };

  function anuncios(m, F, R) {
    const lista = [];
    const p = F.pagina;
    if (!p) {
      return [comp("Página de anuncios", "cargada", "sin datos", false)];
    }
    const run = new URL(p.url).searchParams.get("run");
    const bloqueadasPorOrigen = {};
    // Lo mismo sin las imágenes que la página vio cargar: al volver atrás, una imagen que recibió la respuesta neutra
    // (un GIF de un píxel, con un 200) sale de la caché de imágenes de Firefox sin pedirse, así que no hay nada que
    // bloquear ni que contar. Una que dio error no se guarda y se vuelve a pedir (y a bloquear).
    const sinImagenesPorOrigen = {};
    let bloqueadas = 0;
    let bloqueadasSinImagenes = 0;
    for (const [i, [etiqueta, url, tipo, grupo]] of p.peticiones.entries()) {
      const id = `${run}.pagina.${etiqueta}`;
      const bloqueada = !llego(R, id);
      const espera = m.escudos !== "bajados" && grupoActivo(grupo, m);
      if (bloqueada) {
        bloqueadas++;
        const o = new URL(url).origin;
        bloqueadasPorOrigen[o] = (bloqueadasPorOrigen[o] ?? 0) + 1;
        if (!(tipo === "imagen" && p.enPagina?.[i] === "carga")) {
          bloqueadasSinImagenes++;
          sinImagenesPorOrigen[o] = (sinImagenesPorOrigen[o] ?? 0) + 1;
        }
      }
      lista.push(
        comp(`${new URL(url).host}${new URL(url).pathname} (${tipo})`, espera ? "bloqueada" : "llega", bloqueada ? "bloqueada" : "llega", bloqueada === espera, {
          porque: m.escudos === "bajados" ? "Escudos bajados en el sitio: el motor no actúa (isOnContentBlockingAllowList)." : `Regla real de las ${GRUPOS_LISTAS[grupo]}.`,
          codigo: `${RED_ESCUDOS} · ${LISTAS}: activas()`,
        })
      );
    }
    const origenes = Object.keys(bloqueadasPorOrigen);
    const n = porOrigenes(m) ? origenes.length : bloqueadas;
    const esperado = m.escudos === "bajados" || !n ? "oculto (0)" : String(n);
    const nav = F["nav-pagina"];
    if (nav) {
      const visto = nav.contador.visible ? nav.contador.texto : "oculto (0)";
      lista.push(
        comp(`Contador del botón: ${porOrigenes(m) ? "orígenes" : "peticiones"} bloqueados por el motor`, esperado, visto, visto === esperado, {
          porque: `Según el servidor: ${bloqueadas} peticiones de ${origenes.length} orígenes.`,
          codigo: `${RED_ESCUDOS} → ${ESCUDOS}: anotar(), bloqueado()`,
        })
      );
      if (nav.panel && m.escudos !== "bajados") {
        lista.push(
          comp("Panel: la cifra coincide con el botón", String(n), nav.panel.numero, nav.panel.numero === String(n), { codigo: `${ESCUDOS}: pintarPanel()` })
        );
        const esperadoDesglose = origenes.length ? { anuncios: origenes.map(o => new URL(o).host).sort() } : {};
        const visto = Object.fromEntries(Object.entries(nav.panel.secciones ?? {}).map(([k, v]) => [k, [...v].sort()]));
        lista.push(
          comp("Panel: lo bloqueado por el motor, en «Anuncios (listas de filtros)»", esperadoDesglose, visto, igual(esperadoDesglose, visto), {
            porque: "Ninguno de estos sitios está en las listas de la protección contra rastreo del banco: cuentan como anuncios.",
            codigo: `${RED_ESCUDOS}: anotar()`,
          })
        );
        if (nav.panel.cuentas) {
          const cifra = String(n);
          const vistaCifra = nav.panel.cuentas.anuncios ?? "—";
          lista.push(
            comp("Panel: la cifra de la categoría", origenes.length ? cifra : "—", vistaCifra, origenes.length ? vistaCifra === cifra : vistaCifra === "—", { codigo: `${ESCUDOS}: pintarLista() (cuentas)` })
          );
        }
      }
    }
    const limpia = F["nav-limpia"];
    if (limpia) {
      lista.push(
        comp("La vuelta del contador: en otra página vuelve a 0", "oculto (0)", limpia.contador.visible ? limpia.contador.texto : "oculto (0)", !limpia.contador.visible, {
          codigo: `${ESCUDOS}: anotados por documento (WindowGlobalParent)`,
        })
      );
    }
    const atras = F["nav-atras"];
    if (atras && nav) {
      const visto = atras.contador.visible ? atras.contador.texto : "oculto (0)";
      const nAtras = porOrigenes(m) ? Object.keys(sinImagenesPorOrigen).length : bloqueadasSinImagenes;
      const esperadoAtras = m.escudos === "bajados" || !nAtras ? "oculto (0)" : String(nAtras);
      lista.push(
        comp("La vuelta del contador: al volver atrás a la página, cuenta lo de esa carga", esperadoAtras, visto, visto === esperadoAtras, {
          porque:
            "La página vuelve a pedirlo todo (no-store) y el motor lo vuelve a bloquear, salvo las imágenes: las que " +
            "la página vio cargar (respuesta neutra) salen de la caché de imágenes sin pedirse (nada que bloquear ni " +
            "que contar); las que dieron error se vuelven a pedir.",
          codigo: `${ESCUDOS}: onLocationChange → actualizar()`,
        })
      );
    }
    const motor = F["nav-motor"];
    if (motor) {
      lista.push(
        comp("Motor listo con las listas de la instantánea (sin red)", "listo, todas de la build", `${motor.listo ? "listo" : "sin motor"}, ${motor.origenes.join("/")}`, motor.listo && motor.origenes.every(o => o === "build"), { codigo: LISTAS })
      );
    }
    return lista;
  }

  // ── Cosmético, scriptlets y recursos neutros (escudos/cosmetico.sys.mjs, AegisEscudosChild, red.sys.mjs) ──────

  const COSMETICO = "overlay/browser/components/aegis/escudos/cosmetico.sys.mjs";
  const HIJO = "overlay/browser/components/aegis/escudos/AegisEscudosChild.sys.mjs";
  const PAGINAS_COSMETICO = [
    ["sitio-a", "sitio-a.test"],
    ["abn", "angrybirdsnest.com"],
    ["yt", "www.youtube.com"],
    ["moba", "mobalytics.gg"],
    ["mf", "www.mediafire.com"],
  ];
  const ELEMENTOS_COSMETICO = {
    "generico-1": "anuncio genérico complejo ([data-ad-module], hoja genérica compartida)",
    "generico-2": "anuncio genérico complejo ([data-ad-cls])",
    ad_banner: "anuncio genérico por id (###ad_banner, consulta de clases e ids)",
    dinamico: "anuncio genérico por clase añadido después de cargar (##.ad-slot, MutationObserver)",
    "cookie-notice": "aviso de cookies (###cookie-notice, capa de molestias «cookies»)",
    "adblock-notice": "aviso anti-bloqueador (###adblock-notice, capa «anti-bloqueador»)",
    youtube: "regla propia de youtube.com (###shopping-timely-shelf)",
    angrybirdsnest: "regla propia de angrybirdsnest.com (.post-container > div.post:not([id]))",
    procedural: "procedural propio de mobalytics.gg (span:has-text(Advertisement):upward(3))",
    control: "contenido normal",
  };

  function cosmetico(m, F, R) {
    const lista = [];
    const run = runDe(F);
    const arriba = m.escudos !== "bajados";
    const ubo = m.ubo === "1";
    const molestias = m.molestias ?? "cva";
    // El cosmético propio actúa con los Escudos subidos y sin uBlock Origin activo.
    const actua = arriba && !ubo;
    for (const [fase, host] of PAGINAS_COSMETICO) {
      const d = F[fase];
      if (!d) {
        lista.push(comp(`${host}: página de cosmético`, "cargada", "sin datos", false));
        continue;
      }
      // youtube.com lleva «@@||www.youtube.com^$generichide» en las listas: allí no hay genéricos.
      const generico = actua && host !== "www.youtube.com";
      const esperado = {
        "generico-1": generico,
        "generico-2": generico,
        // mediafire.com tiene la excepción «mediafire.com#@##ad_banner» en las listas.
        ad_banner: generico && host !== "www.mediafire.com",
        dinamico: generico,
        "cookie-notice": generico && molestias.includes("c"),
        "adblock-notice": generico && molestias.includes("a"),
        youtube: actua && host === "www.youtube.com",
        angrybirdsnest: actua && host === "angrybirdsnest.com",
        procedural: actua && host === "mobalytics.gg",
        control: false,
      };
      for (const [k, descripcion] of Object.entries(ELEMENTOS_COSMETICO)) {
        const visto = d.ocultos?.[k] ? "oculto" : "se ve";
        const espera = esperado[k] ? "oculto" : "se ve";
        let porque = "";
        if (!arriba) {
          porque = "Escudos bajados en el sitio: ni hojas ni scriptlets.";
        } else if (ubo) {
          porque = "uBlock Origin activo (simulado): el actor cosmético de Aegis se retira.";
        } else if (host === "www.youtube.com" && k !== "youtube" && k !== "control") {
          porque = "generichide de las listas en youtube.com: solo las reglas propias del sitio.";
        } else if (k === "ad_banner" && host === "www.mediafire.com") {
          porque = "Excepción de las listas: mediafire.com#@##ad_banner.";
        } else if ((k === "cookie-notice" && !molestias.includes("c")) || (k === "adblock-notice" && !molestias.includes("a"))) {
          porque = "Ese grupo de molestias está apagado: su capa no cuenta.";
        }
        lista.push(comp(`${host}: ${descripcion}`, espera, visto, visto === espera, { porque, codigo: `${COSMETICO} · ${HIJO}` }));
      }
      const h = d.hojas ?? {};
      lista.push(
        comp(`${host}: document.styleSheets solo con las hojas de la página`, "2 (las suyas)", `${h.alFinal} (en el DOM: ${h.propias})`, h.alFinal === 2 && h.propias === 2, {
          porque: "Las hojas de Escudos son de usuario (windowUtils.loadSheet/addSheet): no salen en document.styleSheets ni en el DOM.",
          codigo: HIJO,
        })
      );
      // Solo el procedural de mobalytics.gg toca el DOM (un estilo en línea, como uBlock Origin).
      const enLinea = actua && host === "mobalytics.gg" ? 1 : 0;
      lista.push(
        comp(`${host}: estilos en línea añadidos`, enLinea, d.atributos, d.atributos === enLinea, {
          porque: "Ocultar va en hojas de usuario; solo los procedurales tocan el DOM (aquí, el de mobalytics.gg).",
          codigo: `${HIJO} · overlay/browser/components/aegis/escudos/procedural.sys.mjs`,
        })
      );
      const adblockEsperado = !(actua && host === "angrybirdsnest.com");
      lista.push(
        comp(`${host}: scriptlet set-constant (window.adblock)`, adblockEsperado, d.adblock, d.adblock === adblockEsperado, {
          porque: "angrybirdsnest.com##+js(set, adblock, false) (uBlock filters): corre antes que la página, que la pone a true.",
          codigo: `${HIJO}: compilar() + executeInGlobal`,
        })
      );
      // Scriptlets de dos capas a la vez (cada capa en su ámbito: si no, la clase RangeParser se declararía dos veces
      // y no correría ninguno).
      const mf = host === "www.mediafire.com";
      const c0 = actua && mf;
      const c2 = actua && mf && molestias.includes("v");
      lista.push(
        comp(`${host}: scriptlet de la capa 0 (set-constant InfCustomFPSTAFunc)`, c0 ? "corre" : "no corre", d.capas?.capa0 ? "corre" : "no corre", !!d.capas?.capa0 === c0, {
          porque: mf ? "mediafire.com##+js(set-constant, InfCustomFPSTAFunc, noopFunc) (AdGuard Base)." : "Ninguna regla en este sitio.",
          codigo: "escudos/motor-nativo/src/lib.rs: cosmetico() · " + HIJO,
        })
      );
      lista.push(
        comp(`${host}: scriptlet de la capa 2, ventanas y banners (nostif scan 500)`, c2 ? "corre" : "no corre", d.capas?.capa2 ? "corre" : "no corre", !!d.capas?.capa2 === c2, {
          porque: mf ? "mediafire.com##+js(nostif, scan, 500) (uBlock filters – Annoyances), en la misma página que el de la capa 0." : "Ninguna regla en este sitio.",
          codigo: "escudos/motor-nativo/src/lib.rs: cosmetico() · " + HIJO,
        })
      );
      if (fase === "sitio-a") {
        const det = d.detector ?? {};
        // Sin el actor cosmético (uBlock Origin activo) no se sabe la CSP de la página: se corta en vez de redirigir.
        const redirige = arriba && !ubo;
        const llegada = llego(R, `${run}.sitio-a.adsbygoogle`);
        lista.push(
          comp("Recurso neutro: adsbygoogle.js no llega al servidor", arriba ? "no llega" : "llega", llegada ? "llega" : "no llega", llegada === !arriba, {
            porque: "||pagead2.googlesyndication.com/pagead/js/adsbygoogle.js$redirect=googlesyndication_adsbygoogle.js (AdGuard Base).",
            codigo: `${RED_ESCUDOS}: redirigir()`,
          })
        );
        lista.push(
          comp("Recurso neutro: el detector simulado no salta (adsbygoogle.loaded)", redirige ? "no salta" : "salta", det.adsbygoogle ? "no salta" : "salta", det.adsbygoogle === redirige, {
            porque: redirige
              ? "El script carga (data: neutro de uBlock Origin) y define window.adsbygoogle."
              : ubo
                ? "Sin el actor cosmético no se conoce la CSP de la página: se corta en vez de redirigir (uBlock Origin pondría el suyo)."
                : "Con los Escudos bajados llega al servidor del banco, que no es AdSense.",
            codigo: `${RED_ESCUDOS} · escudos/recursos.json`,
          })
        );
      }
    }
    const csp = F.csp;
    if (csp) {
      const llegada = llego(R, `${run}.csp.adsbygoogle`);
      const informe = llego(R, `${run}.csp.informe`);
      lista.push(comp("CSP estricta: adsbygoogle.js no llega al servidor", "no llega", llegada ? "llega" : "no llega", !llegada, { codigo: RED_ESCUDOS }));
      lista.push(
        comp("CSP estricta: se cancela en vez de redirigir (la página ve un error)", "error", csp.carga, csp.carga === "error", {
          porque: "La CSP no admite data: para scripts: redirigir haría que la propia CSP lo bloqueara y lo denunciara.",
          codigo: `${RED_ESCUDOS}: redirigir() · ${COSMETICO}: cspPermite()`,
        })
      );
      lista.push(
        comp("CSP estricta: ninguna violación en la página", 0, csp.violaciones?.length, csp.violaciones?.length === 0, {
          porque: "securitypolicyviolation: una redirección a data: la dispararía.",
          codigo: HIJO,
        })
      );
      lista.push(comp("CSP estricta: ningún informe de violación al servidor", "ninguno", informe ? "recibido" : "ninguno", !informe, { codigo: RED_ESCUDOS }));
    }
    const nav = F["nav-cosmetico"];
    if (nav) {
      lista.push(
        comp("Actor cosmético registrado", !ubo, nav.cosmetico?.activo, nav.cosmetico?.activo === !ubo, {
          porque: ubo ? "Con uBlock Origin activo se retira (AddonManager)." : "",
          codigo: COSMETICO,
        })
      );
      const c = nav.cosmetico ?? {};
      lista.push(
        comp(
          "Medidas del cosmético y de la red (información)",
          "—",
          {
            documentos: c.documentos,
            bloqueoMediaMs: c.bloqueos ? +(c.bloqueoMs / c.bloqueos).toFixed(2) : null,
            bloqueoMaximoMs: c.bloqueoMaximoMs != null ? +c.bloqueoMaximoMs.toFixed(2) : null,
            topes: c.topes,
            lotesGenericos: c.genericosLotes,
            redirigidas: nav.red?.redirigidas,
            cspCanceladas: nav.red?.cspCanceladas,
          },
          true,
          { estado: "info", codigo: `${COSMETICO}: medidas()` }
        )
      );
    }
    return lista;
  }

  function runDe(F) {
    for (const d of Object.values(F)) {
      if (d?.url) {
        return new URL(d.url).searchParams.get("run");
      }
    }
    return "";
  }

  return { rastreadores, anuncios, cosmetico, cookies, https, olvidar, huella, cajafuerte, google, control, red, evaluarHuella };
})();
