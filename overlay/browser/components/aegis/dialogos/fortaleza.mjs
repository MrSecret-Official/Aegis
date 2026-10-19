/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Aegis · fortaleza de la contraseña principal (diálogo contrasena-principal.xhtml). Detalle y por qué, en
 * docs/PRIVACIDAD.md, «Contraseñas».
 *
 * Todo pasa en esta función, en el equipo: no hay red, ni registro, ni almacenamiento. Recibe el texto y devuelve un
 * nivel; no guarda nada entre llamadas (solo las listas fijas de abajo).
 *
 * Por qué un mínimo obligatorio: la contraseña principal es lo único que protege key4.db si alguien copia el perfil. Con
 * 600 000 iteraciones de PBKDF2 cada intento cuesta, pero una contraseña corta o de las que se prueban primero (listas
 * de filtraciones, palabras corrientes, «qwerty», «1234») se encuentra igual. Por eso:
 * - al menos 12 caracteres (MINIMO);
 * - quitando lo que se adivina primero (palabras y contraseñas muy usadas, secuencias, filas del teclado y
 *   repeticiones), tienen que quedar al menos 8 (MINIMO_EFECTIVO);
 * - al menos 5 caracteres distintos;
 * - ninguna de las contraseñas largas más usadas (COMUNES).
 *
 * Es una estimación sencilla y conservadora, no una medida exacta: «aceptable», «fuerte» y «muy fuerte» orientan, no
 * garantizan. Lo que más ayuda es la longitud: una frase de cuatro o más palabras que no uses en otro sitio.
 *
 * Módulo sin dependencias de Gecko: se puede probar fuera del navegador (node).
 */

/** Longitud mínima, en caracteres (puntos de código, no unidades UTF-16). */
export const MINIMO = 12;
/** Lo que tiene que quedar tras quitar lo predecible. */
const MINIMO_EFECTIVO = 8;
/** Caracteres distintos como mínimo («aaaaaaaabbbb» no vale). */
const MINIMO_DISTINTOS = 5;

/**
 * Palabras que un atacante prueba primero (en los seis idiomas de Aegis y las de las listas de filtraciones), en
 * minúsculas y sin tildes. Dentro de la contraseña cuentan como un solo carácter.
 */
const PALABRAS = [
  "password", "passwort", "passwd", "motdepasse", "contrasena", "clave", "senha", "segredo", "secret", "secreto",
  "segreto", "geheim", "admin", "administrator", "administrador", "root", "usuario", "user", "login", "letmein",
  "welcome", "bienvenido", "bemvindo", "bienvenue", "willkommen", "benvenuto", "iloveyou", "teamo", "teadoro",
  "jetaime", "ichliebedich", "tiamo", "amor", "amore", "love", "hello", "hola", "ola", "ciao", "hallo", "bonjour",
  "monkey", "dragon", "master", "sunshine", "princess", "princesa", "football", "futbol", "soccer", "baseball",
  "superman", "batman", "pokemon", "starwars", "shadow", "michael", "jordan", "charlie", "changeme", "default",
  "test", "prueba", "qwerty", "azerty", "qwertz", "asdf", "zxcv", "aegis", "firefox", "mozilla", "google", "windows",
  "microsoft", "facebook", "instagram", "abc",
];

/**
 * Contraseñas largas de las listas de filtraciones (minúsculas, sin espacios ni tildes): fuera aunque pasaran lo
 * demás. Casi todas las caen ya las reglas; están por si acaso, y «correcthorsebatterystaple» porque es famosa.
 */
const COMUNES = new Set([
  "correcthorsebatterystaple", "trustno1trustno1", "1q2w3e4r5t6y", "1q2w3e4r5t6y7u", "1qaz2wsx3edc", "zaq12wsxcde3",
  "qazwsxedcrfv", "q1w2e3r4t5y6", "a1b2c3d4e5f6", "passw0rd1234", "p@ssw0rd1234", "iloveyou1234", "letmein12345",
  "welcome12345", "administrator", "administrador", "qwertyuiopasdfghjkl", "thequickbrownfox",
]);

/** Filas del teclado (QWERTY, AZERTY, QWERTZ) y de números: 4 seguidas cuentan como un carácter. */
const FILAS = [
  "1234567890", "qwertyuiop", "asdfghjkl", "zxcvbnm", "azertyuiop", "qsdfghjklm", "wxcvbn", "qwertzuiop", "yxcvbnm",
  "1qaz2wsx3edc4rfv", "qazwsxedcrfv",
];

/** Sustituciones típicas («p@ssw0rd»): se deshacen solo para buscar palabras. */
const LEET = { 0: "o", 1: "i", 3: "e", 4: "a", 5: "s", 7: "t", 8: "b", "@": "a", $: "s", "!": "i" };

/** Minúsculas, sin tildes ni diacríticos (ñ → n), en forma NFKC. */
function plano(texto) {
  return texto
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .normalize("NFKC")
    .toLowerCase();
}

/**
 * Cambia cada tramo predecible por un solo carácter y cuenta cuánto ha quitado cada tipo.
 *
 * @param {string} texto ya en plano(), sin espacios
 * @returns {{resto: string, quitado: {comun: number, secuencia: number, repetida: number}}}
 */
function reducir(texto) {
  const quitado = { comun: 0, secuencia: 0, repetida: 0 };
  // Filas del teclado (de 4 en adelante, en los dos sentidos).
  let cadena = texto;
  for (const fila of FILAS) {
    for (const f of [fila, [...fila].reverse().join("")]) {
      for (let largo = f.length; largo >= 4; largo--) {
        for (let i = 0; i + largo <= f.length; i++) {
          const trozo = f.slice(i, i + largo);
          const partes = cadena.split(trozo);
          if (partes.length > 1) {
            quitado.secuencia += (largo - 1) * (partes.length - 1);
            cadena = partes.join("¤");
          }
        }
      }
    }
  }
  const s = [...cadena];

  // Secuencias de 3 o más («abc», «123», «987»): letras o cifras consecutivas en un sentido.
  const salida = [];
  for (let i = 0; i < s.length; ) {
    let j = i + 1;
    const paso = s[j] ? s[j].codePointAt(0) - s[i].codePointAt(0) : 0;
    if (Math.abs(paso) == 1 && /[a-z0-9]/.test(s[i])) {
      while (j < s.length && s[j].codePointAt(0) - s[j - 1].codePointAt(0) == paso && /[a-z0-9]/.test(s[j])) {
        j++;
      }
    }
    if (j - i >= 3) {
      quitado.secuencia += j - i - 1;
      salida.push("¤");
      i = j;
    } else {
      salida.push(s[i]);
      i++;
    }
  }

  // El mismo carácter 3 o más veces seguidas.
  cadena = salida.join("").replace(/(.)\1{2,}/gu, (m, c) => {
    quitado.repetida += [...m].length - 1;
    return c;
  });

  // Palabras muy usadas, también con sustituciones («p4ssw0rd»).
  cadena = [...cadena].map(c => LEET[c] ?? c).join("");
  for (const palabra of PALABRAS) {
    const partes = cadena.split(palabra);
    if (partes.length > 1) {
      quitado.comun += (palabra.length - 1) * (partes.length - 1);
      cadena = partes.join("§");
    }
  }

  // Un bloque repetido («abcdabcd», «perroperro»): queda uno.
  cadena = cadena.replace(/(.{2,}?)\1+/gu, (m, bloque) => {
    quitado.repetida += [...m].length - [...bloque].length;
    return bloque;
  });

  return { resto: cadena, quitado };
}

/**
 * @typedef {object} Fortaleza
 * @property {0|1|2|3|4} nivel 0 vacía, 1 insuficiente, 2 aceptable, 3 fuerte, 4 muy fuerte
 * @property {boolean} valida si cumple el mínimo de Aegis
 * @property {"corta"|"comun"|"secuencia"|"repetida"|"variedad"|null} motivo por qué no vale (si no vale)
 * @property {number} faltan caracteres que faltan para el mínimo (con motivo «corta»)
 */

/**
 * @param {string} texto la contraseña tal cual
 * @returns {Fortaleza}
 */
export function evaluar(texto) {
  const largo = [...texto].length;
  if (!largo) {
    return { nivel: 0, valida: false, motivo: null, faltan: MINIMO };
  }
  if (largo < MINIMO) {
    return { nivel: 1, valida: false, motivo: "corta", faltan: MINIMO - largo };
  }
  const p = plano(texto);
  const junto = p.replace(/[\s._\-]+/gu, "");
  if (COMUNES.has(junto) || COMUNES.has([...junto].map(c => LEET[c] ?? c).join(""))) {
    return { nivel: 1, valida: false, motivo: "comun", faltan: 0 };
  }
  const { resto, quitado } = reducir(junto);
  const efectivo = [...resto].length;
  if (efectivo < MINIMO_EFECTIVO) {
    // El motivo, lo que más ha quitado.
    const [motivo] = Object.entries(quitado).sort((a, b) => b[1] - a[1])[0];
    return { nivel: 1, valida: false, motivo, faltan: 0 };
  }
  if (new Set(junto).size < MINIMO_DISTINTOS) {
    return { nivel: 1, valida: false, motivo: "variedad", faltan: 0 };
  }

  // Válida: el nivel, por longitud, lo que queda tras quitar lo predecible y la variedad (clases de caracteres o
  // palabras de una frase).
  const clases = [/\p{Ll}/u, /\p{Lu}/u, /\p{N}/u, /[^\p{L}\p{N}\s]/u].filter(r => r.test(texto)).length;
  const palabras = p.split(/[\s._\-]+/u).filter(w => [...w].length >= 3).length;
  let nivel = 2;
  // Fuerte: larga y variada, o de 12 o más con los cuatro tipos de caracteres y casi nada predecible (lo que sale de un
  // generador de contraseñas).
  if ((largo >= 16 && efectivo >= 12 && (clases >= 2 || palabras >= 3)) || (clases == 4 && efectivo >= 12)) {
    nivel = 3;
  }
  if (largo >= 20 && efectivo >= 16 && (clases >= 3 || palabras >= 4)) {
    nivel = 4;
  }
  return { nivel, valida: true, motivo: null, faltan: 0 };
}
