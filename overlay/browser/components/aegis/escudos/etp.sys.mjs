/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · Escudos: las excepciones por sitio de las listas, para la protección contra rastreo de Firefox (ETP).
 *
 * ETP no sabe de excepciones por sitio. Las listas de filtros, en cambio, dejan pasar algunos dominios solo en webs
 * concretas (`@@||dominio^$…,domain=web`), casi siempre porque esa web deja de funcionar o detecta el bloqueador sin
 * ellos (work.ink comprueba doubleverify.com y adligature.com). Este módulo saca esos pares (dominio, web) del texto
 * de las listas al compilarlas, y escudos/red.sys.mjs los consulta cuando ETP va a bloquear algo
 * (nsIChannelClassifierService): si hay excepción, la petición sigue y decide el motor con la regla exacta de la lista
 * (que solo deja pasar lo que dice).
 *
 * - Los pares se guardan con el motor (motor.json) y se cargan con él.
 * - exceptuado() es una búsqueda en un Map por cada sufijo del dominio; nada de temporizadores.
 */

/**
 * Una excepción de red con dominio completo: `@@||dominio^…$opciones` (o `@@||dominio/…`). Sin «\r» en las opciones:
 * las listas descargadas pueden traer finales CRLF (las de AdGuard), y la instantánea de la build, LF.
 */
const EXCEPCION = /^@@\|\|([a-z0-9-]+(?:\.[a-z0-9-]+)+)[\^/][^\r\n$]*\$([^\r\n]*)/gm;
/** Las webs de la excepción: `domain=` o `from=` (separadas por «|»). */
const WEBS = /(?:^|,)(?:domain|from)=([^,]+)/;
/** Solo webs con nombre completo: fuera las negadas (~web), las de comodín (web.*) y las expresiones regulares. */
const WEB = /^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/;
/**
 * Excepciones que no dejan pasar peticiones (solo quitan lo cosmético, una CSP, un parámetro, un recurso neutro, o
 * dejan abrir una ventana emergente) o que anulan otra regla: no son motivo para que ETP deje pasar nada.
 */
const NO_DEJA_PASAR =
  /(?:^|,)~?(?:generichide|ghide|elemhide|ehide|specifichide|shide|csp|removeparam|redirect(?:-rule)?|permissions|header|replace|urltransform|uritransform|badfilter|popup)(?:[=,]|$)/;

/** dominio → Set de webs. */
let pares = new Map();

/** El dominio y cada dominio padre («a.b.c.com», «b.c.com», «c.com»). */
function* sufijos(host) {
  for (let s = host; s.includes("."); s = s.slice(s.indexOf(".") + 1)) {
    yield s;
  }
}

export const AegisEscudosEtp = {
  /** Sube si cambia cómo se sacan los pares: entra en la clave del motor (listas.sys.mjs) y fuerza a sacarlos de nuevo. */
  VERSION: 2,

  /**
   * Las excepciones por sitio de unas listas: {dominio: [web]}. `listas`: lo que recibe el motor ({datos, incluidas}
   * como ArrayBuffer); hay que llamarlo antes de compilar, que se queda con los búferes.
   */
  pares(listas) {
    const salida = new Map();
    const decodificador = new TextDecoder();
    for (const l of listas) {
      for (const bytes of [l.datos, ...Object.values(l.incluidas ?? {})]) {
        for (const [, dominio, opciones] of decodificador.decode(bytes).matchAll(EXCEPCION)) {
          if (NO_DEJA_PASAR.test(opciones)) {
            continue;
          }
          const webs = WEBS.exec(opciones)?.[1].split("|").filter(w => WEB.test(w));
          if (webs?.length) {
            const de = salida.get(dominio) ?? new Set();
            webs.forEach(w => de.add(w));
            salida.set(dominio, de);
          }
        }
      }
    }
    return Object.fromEntries([...salida].sort().map(([d, webs]) => [d, [...webs].sort()]));
  },

  /**
   * Pone los pares en uso (los del motor recién cargado). Fuera las webs que son un sufijo público (csb.app, gouv.fr):
   * contarían para todas las que cuelgan de él.
   */
  usar(nuevos) {
    const esSufijo = w => {
      try {
        return Services.eTLD.getPublicSuffixFromHost(w) == w;
      } catch {
        return true;
      }
    };
    pares = new Map();
    for (const [d, webs] of Object.entries(nuevos ?? {})) {
      const buenas = webs.filter(w => !esSufijo(w));
      if (buenas.length) {
        pares.set(d, new Set(buenas));
      }
    }
  },

  /**
   * ¿Dejan las listas pasar `host` en alguna de estas webs (la página principal o el documento que la pide)? Como en
   * las listas, una web cuenta también con sus subdominios.
   *
   * @param {string} host
   * @param {string[]} webs
   */
  exceptuado(host, webs) {
    if (!pares.size || !host) {
      return false;
    }
    for (const d of sufijos(host)) {
      const de = pares.get(d);
      if (de) {
        for (const w of webs) {
          for (const s of sufijos(w ?? "")) {
            if (de.has(s)) {
              return true;
            }
          }
        }
      }
    }
    return false;
  },
};
