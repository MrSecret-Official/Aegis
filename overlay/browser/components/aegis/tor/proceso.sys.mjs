/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · Tor: el proceso tor y su puerto de control.
 *
 * Portado de Tor Browser (MPL-2.0), repositorio tor-browser de gitlab.torproject.org, rama
 * tor-browser-153.5.0esr-16.0-1, toolkit/components/tor-launcher/:
 * - TorControlPort.sys.mjs: AsyncSocket (lecturas y escrituras asíncronas sobre nsISocketTransport, en cola) y la
 *   lectura de mensajes de TorController (líneas, respuestas de varias líneas, eventos 650), AUTHENTICATE,
 *   TAKEOWNERSHIP, GETINFO, SETEVENTS, SIGNAL NEWNYM y el análisis de BOOTSTRAP. Se ha quitado lo que Aegis no usa
 *   (sockets Unix, el puerto de control en Rust, circuitos, puentes, claves de cebolla) y traducido los comentarios.
 * - TorProcess.sys.mjs: el arranque con Subprocess.sys.mjs, el «__OwningControllerProcess» con el PID del navegador
 *   y la vigilancia de la salida del proceso.
 * Lo demás (torrc generado en el perfil, rutas relativas, lectura del puerto de control) es de Aegis.
 *
 * Cómo arranca (sin sondeos ni temporizadores):
 * 1. Se escribe <perfil local>/aegis-tor/torrc: SocksPort y ControlPort «auto» en 127.0.0.1, CookieAuthentication,
 *    ControlPortWriteToFile, DataDirectory en el perfil y ClientOnly. Las rutas van relativas a aegis-tor/ (el
 *    directorio de trabajo del proceso): así funcionan aunque la carpeta del usuario tenga espacios o tildes.
 * 2. tor se lanza con Subprocess (sin ventana) y «__OwningControllerProcess <PID de Aegis>»: si Aegis muere, tor lo
 *    nota y se cierra solo.
 * 3. Su salida (Log notice stdout) se lee según llega: con la línea «Opened Control listener … on 127.0.0.1:N», o el
 *    archivo de ControlPortWriteToFile, se sabe el puerto de control.
 * 4. Se conecta, se autentica con la cookie, TAKEOWNERSHIP (tor se cierra cuando se cierra esta conexión),
 *    GETINFO net/listeners/socks (el puerto SOCKS) y SETEVENTS STATUS_CLIENT (el progreso del arranque llega como
 *    eventos).
 */

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  Subprocess: "resource://gre/modules/Subprocess.sys.mjs",
});

/**
 * Envoltorio de un socket TCP con lecturas y escrituras asíncronas en cola (AsyncSocket de Tor Browser).
 */
class SocketAsincrono {
  #salida;
  #colaSalida = [];
  #entrada;
  #entradaScript;
  #colaEntrada = [];

  constructor(host, puerto) {
    const sts = Cc["@mozilla.org/network/socket-transport-service;1"].getService(Ci.nsISocketTransportService);
    const transporte = sts.createTransport([], host, puerto, null, null);
    const SIN_BUFFER = Ci.nsITransport.OPEN_UNBUFFERED;
    this.#salida = transporte.openOutputStream(SIN_BUFFER, 1, 1).QueryInterface(Ci.nsIAsyncOutputStream);
    this.#entrada = transporte.openInputStream(SIN_BUFFER, 1, 1).QueryInterface(Ci.nsIAsyncInputStream);
    this.#entradaScript = Cc["@mozilla.org/scriptableinputstream;1"].createInstance(Ci.nsIScriptableInputStream);
    this.#entradaScript.init(this.#entrada);
  }

  /** Escribe una cadena (ASCII) cuando el socket admita escritura. */
  write(cadena) {
    return new Promise((resolve, reject) => {
      const siguiente = () => {
        if (this.#colaSalida.length) {
          this.#salida.asyncWait(this.#colaSalida[0], 0, 0, Services.tm.currentThread);
        }
      };
      this.#colaSalida.push({
        onOutputStreamReady: () => {
          try {
            const escritos = this.#salida.write(cadena, cadena.length);
            this.#colaSalida.shift();
            siguiente();
            resolve(escritos);
          } catch (e) {
            reject(e);
          }
        },
      });
      if (this.#colaSalida.length == 1) {
        siguiente();
      }
    });
  }

  /** Lee lo que haya cuando llegue algo. Falla cuando el socket se cierra. */
  read() {
    return new Promise((resolve, reject) => {
      const siguiente = () => {
        if (this.#colaEntrada.length) {
          this.#entrada.asyncWait(this.#colaEntrada[0], 0, 0, Services.tm.currentThread);
        }
      };
      this.#colaEntrada.push({
        onInputStreamReady: () => {
          try {
            if (!this.#entradaScript.available()) {
              reject(new Error("el otro extremo ha cerrado la conexión"));
              return;
            }
            const cadena = this.#entradaScript.read(this.#entradaScript.available());
            this.#colaEntrada.shift();
            siguiente();
            resolve(cadena);
          } catch (e) {
            reject(e);
          }
        },
      });
      if (this.#colaEntrada.length == 1) {
        siguiente();
      }
    });
  }

  close() {
    this.#salida.close();
    this.#entrada.close();
  }
}

class ErrorDeTor extends Error {
  constructor(orden, respuesta) {
    super(`${orden.split(" ")[0]} -> ${respuesta}`);
    this.name = "ErrorDeTor";
  }
}

/** Claves y valores de un evento o respuesta («PROGRESS=50 TAG=… SUMMARY="…"»). */
function clavesYValores(texto) {
  const resultado = {};
  for (const m of texto.matchAll(/(\w+)=("(?:[^"\\]|\\.)*"|\S*)/g)) {
    let valor = m[2];
    if (valor.startsWith('"')) {
      valor = valor.slice(1, -1).replace(/\\(.)/g, "$1");
    }
    resultado[m[1]] = valor;
  }
  return resultado;
}

/** Línea de BOOTSTRAP (respuesta a GETINFO status/bootstrap-phase o evento STATUS_CLIENT). */
function arranque(linea) {
  const m = /^(NOTICE|WARN) BOOTSTRAP\s*(.*)$/.exec(linea);
  if (!m) {
    return null;
  }
  const estado = { TYPE: m[1], ...clavesYValores(m[2]) };
  estado.PROGRESS = parseInt(estado.PROGRESS ?? "0", 10) || 0;
  return estado;
}

/**
 * El puerto de control de tor (TorController de Tor Browser, reducido a lo que usa Aegis).
 */
export class ControlTor {
  #socket;
  #pendiente = "";
  #lineas = [];
  #ordenes = [];
  /** @type {{alArrancar?: (estado: object) => void, alCerrar?: () => void}} */
  oyente = {};

  constructor(host, puerto) {
    this.#socket = new SocketAsincrono(host, puerto);
    this.#bomba();
  }

  get abierto() {
    return !!this.#socket;
  }

  async #leerLinea() {
    while (!this.#lineas.length) {
      if (!this.#socket) {
        throw new Error("puerto de control cerrado");
      }
      this.#pendiente += await this.#socket.read();
      const lineas = this.#pendiente.split("\r\n");
      this.#pendiente = lineas.pop();
      this.#lineas.push(...lineas);
    }
    return this.#lineas.shift();
  }

  /** Un mensaje entero (respuestas de varias líneas y valores multilínea terminados en «.»). */
  async #leerMensaje() {
    let multilinea = false;
    const mensaje = [];
    for (;;) {
      const linea = await this.#leerLinea();
      mensaje.push(linea);
      if (multilinea) {
        if (linea === ".") {
          multilinea = false;
        }
      } else if (mensaje.length === 1 && /^\d\d\d\+.+?=$/.test(linea)) {
        multilinea = true;
      } else if (/^\d\d\d /.test(linea)) {
        if (mensaje.length === 1 || mensaje[0].substring(0, 3) === linea.substring(0, 3)) {
          return mensaje.join("\r\n");
        }
      }
    }
  }

  async #bomba() {
    try {
      while (this.#socket) {
        const mensaje = await this.#leerMensaje();
        try {
          if (mensaje.startsWith("650")) {
            this.#evento(mensaje);
          } else {
            const orden = this.#ordenes.shift();
            orden?.resolve(mensaje);
            if (this.#ordenes.length) {
              this.#escribirSiguiente();
            }
          }
        } catch (e) {
          console.error("Aegis: Tor, mensaje del puerto de control", e);
        }
      }
    } catch (e) {
      this.#cerrar(e);
    }
  }

  #evento(mensaje) {
    const m = /^650\s+(\S+)\s*(.*)$/s.exec(mensaje);
    if (m?.[1] == "STATUS_CLIENT") {
      const estado = arranque(m[2]);
      if (estado) {
        this.oyente.alArrancar?.(estado);
      }
    }
  }

  #escribirSiguiente() {
    const orden = this.#ordenes[0];
    this.#socket.write(`${orden.texto}\r\n`).catch(orden.reject);
  }

  #enviar(texto) {
    if (!this.#socket) {
      return Promise.reject(new Error("puerto de control cerrado"));
    }
    return new Promise((resolve, reject) => {
      this.#ordenes.push({ texto, resolve, reject });
      if (this.#ordenes.length === 1) {
        this.#escribirSiguiente();
      }
    });
  }

  async #enviarSimple(texto) {
    const respuesta = await this.#enviar(texto);
    if (!/^250 OK\s*$/i.test(respuesta)) {
      throw new ErrorDeTor(texto, respuesta);
    }
  }

  async #getInfo(clave) {
    const orden = `GETINFO ${clave}`;
    const respuesta = await this.#enviar(orden);
    const m =
      respuesta.match(/^250-([^=]+)=(.*)$/m) ||
      respuesta.match(/^250\+([^=]+)=\r?\n(.*?)\r?\n^\.\r?\n^250 OK\s*$/ms);
    if (!m || m[1] !== clave) {
      throw new ErrorDeTor(orden, respuesta);
    }
    return m[2];
  }

  #cerrar(motivo) {
    const ordenes = this.#ordenes;
    this.#ordenes = [];
    for (const o of ordenes) {
      o.reject(new Error(`puerto de control cerrado${motivo ? `: ${motivo.message}` : ""}`));
    }
    const socket = this.#socket;
    this.#socket = null;
    try {
      socket?.close();
    } catch {}
    if (socket) {
      this.oyente.alCerrar?.();
    }
  }

  close() {
    this.#cerrar(null);
  }

  /** AUTHENTICATE con la cookie (bytes) en hexadecimal. */
  authenticate(cookie) {
    const hex = Array.from(cookie, b => b.toString(16).padStart(2, "0")).join("");
    return this.#enviarSimple(`AUTHENTICATE ${hex}`);
  }

  /** tor se cierra cuando se cierra esta conexión. */
  takeOwnership() {
    return this.#enviarSimple("TAKEOWNERSHIP");
  }

  /** Circuitos nuevos para todo lo que se abra a partir de ahora (y la caché de DNS de tor, vacía). */
  newnym() {
    return this.#enviarSimple("SIGNAL NEWNYM");
  }

  /** tor se cierra (un cliente sale en el acto). */
  shutdown() {
    return this.#enviarSimple("SIGNAL SHUTDOWN");
  }

  setEvents(tipos) {
    return this.#enviarSimple(`SETEVENTS ${tipos.join(" ")}`);
  }

  async getBootstrapPhase() {
    return arranque(await this.#getInfo("status/bootstrap-phase"));
  }

  /** Primer puerto SOCKS TCP en 127.0.0.1. */
  async getSocksPort() {
    const lista = await this.#getInfo("net/listeners/socks");
    for (const m of lista.matchAll(/"?127\.0\.0\.1:(\d+)"?/g)) {
      const puerto = parseInt(m[1], 10);
      if (puerto > 0 && puerto < 65536) {
        return puerto;
      }
    }
    throw new Error(`sin puerto SOCKS en 127.0.0.1: ${lista}`);
  }
}

/** Escapa un valor para el torrc (cadena entre comillas con escapes de C). */
function comillas(valor) {
  return `"${valor.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

/**
 * El proceso tor. Se crea por arranque; al pararse, se descarta.
 */
export class ProcesoTor {
  #proceso = null;
  #salidaReciente = [];
  #control = null;
  /** Llamado si tor termina sin que se le haya pedido. */
  alSalir = () => {};

  /**
   * @param {object} opciones
   * @param {string} opciones.raiz <perfil local>/aegis-tor (directorio de trabajo)
   * @param {string} opciones.version carpeta de la versión instalada, dentro de raiz
   * @param {string[]} [opciones.puentes] líneas extra del torrc para los puentes (ya comprobadas)
   */
  constructor({ raiz, version, puentes = [] }) {
    this.raiz = raiz;
    this.version = version;
    this.puentes = puentes;
  }

  /** Últimas líneas de la salida de tor (para el registro si algo falla). */
  get salidaReciente() {
    return this.#salidaReciente.join("\n");
  }

  /** torrc de Aegis. Todo relativo a `raiz`, que es el directorio de trabajo de tor. */
  #torrc() {
    const v = this.version;
    return [
      "# Generado por Aegis en cada arranque (overlay/browser/components/aegis/tor/proceso.sys.mjs): no editar.",
      "DataDirectory datos",
      // Puertos «auto» solo en 127.0.0.1. KeepAliveIsolateSOCKSAuth: el aislamiento por usuario y contraseña SOCKS
      // (IsolateSOCKSAuth va de serie) se mantiene también en conexiones largas, como en Tor Browser.
      "SocksPort 127.0.0.1:auto IPv6Traffic PreferIPv6 KeepAliveIsolateSOCKSAuth",
      "ControlPort 127.0.0.1:auto",
      `ControlPortWriteToFile ${comillas("datos/puerto-control")}`,
      "CookieAuthentication 1",
      `CookieAuthFile ${comillas("datos/control_auth_cookie")}`,
      "ClientOnly 1",
      "AvoidDiskWrites 1",
      "DormantCanceledByStartup 1",
      "Log notice stdout",
      `GeoIPFile ${comillas(`${v}/data/geoip`)}`,
      `GeoIPv6File ${comillas(`${v}/data/geoip6`)}`,
      ...this.puentes,
      "",
    ].join("\n");
  }

  /**
   * Arranca tor y devuelve el puerto de control ya autenticado y con la propiedad tomada.
   *
   * @param {(estado: object) => void} alArrancar progreso del arranque (eventos BOOTSTRAP)
   * @returns {Promise<{control: ControlTor, socks: number, arranque: object}>}
   */
  async arrancar(alArrancar) {
    const datos = PathUtils.join(this.raiz, "datos");
    await IOUtils.makeDirectory(datos, { createAncestors: true });
    const archivoPuerto = PathUtils.join(datos, "puerto-control");
    await IOUtils.remove(archivoPuerto, { ignoreAbsent: true });
    // La cookie de un arranque anterior no vale: tor escribe una nueva.
    await IOUtils.remove(PathUtils.join(datos, "control_auth_cookie"), { ignoreAbsent: true });
    await IOUtils.writeUTF8(PathUtils.join(this.raiz, "torrc"), this.#torrc());
    // Un torrc-defaults vacío: si no, tor leería el de %APPDATA%\tor del usuario, si lo hubiera.
    await IOUtils.writeUTF8(PathUtils.join(this.raiz, "torrc-defaults"), "");
    const exe = PathUtils.join(this.raiz, this.version, "tor", "tor.exe");
    const argumentos = ["-f", "torrc", "--defaults-torrc", "torrc-defaults"];
    const pid = Services.appinfo.processID;
    if (pid) {
      argumentos.push("__OwningControllerProcess", String(pid));
    }

    this.#proceso = await lazy.Subprocess.call({
      command: exe,
      arguments: argumentos,
      workdir: this.raiz,
      stderr: "stdout",
    });
    const proceso = this.#proceso;
    this.#vigilar(proceso);

    // El puerto de control: de la salida de tor o del archivo que escribe (lo que llegue antes), y solo cuando ya está
    // la cookie (tor la escribe al preparar el puerto de control, no siempre antes de anunciarlo). Se mira con cada
    // trozo de salida: tor escribe varias líneas más al arrancar.
    const archivoCookie = PathUtils.join(datos, "control_auth_cookie");
    const puertoControl = await new Promise((resolve, reject) => {
      let resuelto = false;
      let puerto = null;
      const probarArchivo = async () => {
        try {
          if (puerto == null) {
            const m = /PORT=127\.0\.0\.1:(\d+)/.exec(await IOUtils.readUTF8(archivoPuerto));
            if (m) {
              puerto = parseInt(m[1], 10);
            }
          }
          if (puerto != null && !resuelto && (await IOUtils.exists(archivoCookie))) {
            resuelto = true;
            resolve(puerto);
          }
        } catch {}
      };
      (async () => {
        let pendiente = "";
        for (;;) {
          let trozo;
          try {
            trozo = await proceso.stdout.readString();
          } catch {
            trozo = "";
          }
          if (!trozo) {
            break; // tor ha cerrado su salida (ha terminado)
          }
          pendiente += trozo;
          const lineas = pendiente.split(/\r?\n/);
          pendiente = lineas.pop();
          for (const linea of lineas) {
            this.#salidaReciente.push(linea);
            if (this.#salidaReciente.length > 30) {
              this.#salidaReciente.shift();
            }
            const m = /Opened Control listener.* on 127\.0\.0\.1:(\d+)/.exec(linea);
            if (m) {
              puerto = parseInt(m[1], 10);
            }
          }
          if (!resuelto) {
            await probarArchivo();
          }
        }
        if (!resuelto) {
          resuelto = true;
          reject(new Error(`tor ha terminado al arrancar:\n${this.salidaReciente}`));
        }
      })();
    });

    const cookie = await IOUtils.read(archivoCookie);
    const control = new ControlTor("127.0.0.1", puertoControl);
    this.#control = control;
    control.oyente.alArrancar = alArrancar;
    await control.authenticate(cookie);
    await control.takeOwnership();
    await control.setEvents(["STATUS_CLIENT"]);
    const socks = await control.getSocksPort();
    const fase = await control.getBootstrapPhase();
    return { control, socks, arranque: fase };
  }

  /** Espera a que el proceso termine; si no se le había pedido, avisa. */
  async #vigilar(proceso) {
    let codigo = null;
    try {
      ({ exitCode: codigo } = await proceso.wait());
    } catch (e) {
      console.error("Aegis: Tor, no se pudo vigilar el proceso", e);
    }
    if (this.#proceso === proceso) {
      this.#proceso = null;
      console.warn(`Aegis: tor ha terminado (código ${codigo}).\n${this.salidaReciente}`);
      this.alSalir(codigo);
    }
  }

  /** Para tor: SIGNAL SHUTDOWN y se cierra la conexión (con TAKEOWNERSHIP, eso basta); si no, se mata. */
  async parar() {
    const proceso = this.#proceso;
    const control = this.#control;
    this.#proceso = null;
    this.#control = null;
    if (control?.abierto) {
      try {
        await control.shutdown();
      } catch {}
      control.close();
    }
    if (proceso) {
      try {
        // Si en 2 s no ha salido, Subprocess lo mata (un solo aviso diferido, solo mientras se para).
        await proceso.kill(2000);
      } catch {}
    }
  }
}
