/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · Tor: aislamiento por sitio. Cada sitio (el dominio base de la página principal) va por su propio circuito
 * de Tor: el usuario SOCKS es el sitio y la contraseña, un número aleatorio. tor da un circuito distinto a cada pareja
 * usuario-contraseña (IsolateSOCKSAuth, de serie en SocksPort), así que dos webs no comparten nodo de salida y no se
 * pueden relacionar por él.
 *
 * Portado de Tor Browser (MPL-2.0), repositorio tor-browser de gitlab.torproject.org, rama
 * tor-browser-153.5.0esr-16.0-1, toolkit/components/tor-launcher/TorDomainIsolator.sys.mjs: los nonces por dominio y
 * por contenedor (#getSocksProxyCredentials, #nonce, #makeUsername), el circuito «comodín» para lo que no tiene sitio
 * con su vida máxima de 10 minutos, el caso del modo lectura y el borrado de todo con «Nueva identidad». Sin lo de la
 * pantalla de circuitos ni el temporizador de limpieza (aquí no hace falta: no se guardan circuitos).
 *
 * Diferencia con Tor Browser: allí el sitio sale de originAttributes.firstPartyDomain (First Party Isolation). Aegis
 * usa el aislamiento de estado de Firefox (dFPI), así que el sitio sale de, por orden:
 * 1. una carga de documento de primer nivel: su propia dirección;
 * 2. la clave de partición de la carga (cookieJarSettings.partitionKey, «(https,ejemplo.com)»), que es el sitio de la
 *    página principal, también para iframes y recursos de terceros;
 * 3. el documento de primer nivel de la pestaña (browsingContext.top);
 * 4. si nada de eso, el comodín.
 */

/** Usuario SOCKS para lo que no tiene sitio conocido. */
const COMODIN = "--desconocido--";
/** Vida máxima del circuito comodín (Tor Browser: CATCHALL_MAX_LIFETIME). Se mira la hora al usarlo: sin temporizador. */
const VIDA_COMODIN = 600_000;

/** 128 bits aleatorios en hexadecimal (#nonce de Tor Browser). */
function nonce() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, "0")).join("");
}

/** Sitio (esquema aparte) de una URI: «ejemplo.com», o el host si es una IP o un nombre sin dominio. */
function sitioDe(uri) {
  if (!uri || !(uri.schemeIs("http") || uri.schemeIs("https") || uri.schemeIs("ws") || uri.schemeIs("wss"))) {
    return null;
  }
  try {
    return Services.eTLD.getSchemelessSite(uri);
  } catch {
    try {
      return uri.asciiHost || null;
    } catch {
      return null;
    }
  }
}

/** Sitio de una clave de partición: «(https,ejemplo.com)», «(https,ejemplo.com,8443)» o con «,f» al final. */
function sitioDeParticion(clave) {
  const m = /^\(([a-z][a-z0-9+.-]*),([^,()]+)(?:,[^()]*)?\)$/i.exec(clave ?? "");
  return m ? m[2].toLowerCase() : null;
}

export class Aislamiento {
  #nonceDeSitio = new Map();
  #nonceDeContenedor = new Map();
  #comodinDesde = Date.now();

  /**
   * El sitio por el que se aísla un canal.
   *
   * @param {nsIChannel} canal
   * @returns {string}
   */
  sitio(canal) {
    const loadInfo = canal.loadInfo;
    // Modo lectura (about:reader?url=…): el sitio es el del artículo, como en Tor Browser.
    try {
      const principal = loadInfo.loadingPrincipal;
      if (principal?.URI?.schemeIs("about") && principal.URI.filePath == "reader") {
        const url = new URLSearchParams(principal.URI.query).get("url");
        const s = url && sitioDe(Services.io.newURI(url));
        if (s) {
          return s;
        }
      }
    } catch {}
    try {
      if (loadInfo.externalContentPolicyType == Ci.nsIContentPolicy.TYPE_DOCUMENT) {
        const s = sitioDe(canal.URI);
        if (s) {
          return s;
        }
      }
    } catch {}
    try {
      const s = sitioDeParticion(loadInfo.cookieJarSettings?.partitionKey);
      if (s) {
        return s;
      }
    } catch {}
    try {
      const s = loadInfo.browsingContext?.top?.currentWindowGlobal?.documentPrincipal?.siteOrigin;
      if (s) {
        const sitio = sitioDe(Services.io.newURI(s));
        if (sitio) {
          return sitio;
        }
      }
    } catch {}
    return COMODIN;
  }

  /**
   * Usuario y contraseña SOCKS para un canal.
   *
   * @param {nsIChannel} canal
   * @returns {{usuario: string, clave: string}}
   */
  credenciales(canal) {
    const sitio = this.sitio(canal);
    let contenedor = 0;
    try {
      contenedor = canal.loadInfo.originAttributes?.userContextId ?? 0;
    } catch {}
    if (sitio == COMODIN && Date.now() - this.#comodinDesde > VIDA_COMODIN) {
      this.#nonceDeSitio.set(COMODIN, nonce());
      this.#comodinDesde = Date.now();
    }
    if (!this.#nonceDeSitio.has(sitio)) {
      this.#nonceDeSitio.set(sitio, nonce());
    }
    if (!this.#nonceDeContenedor.has(contenedor)) {
      this.#nonceDeContenedor.set(contenedor, nonce());
    }
    return {
      usuario: `${sitio}:${contenedor}`,
      clave: this.#nonceDeSitio.get(sitio) + this.#nonceDeContenedor.get(contenedor),
    };
  }

  /** Todo nuevo: los siguientes circuitos no comparten nada con los de antes («Nueva identidad»). */
  olvidar() {
    this.#nonceDeSitio.clear();
    this.#nonceDeContenedor.clear();
    this.#comodinDesde = Date.now();
  }
}
