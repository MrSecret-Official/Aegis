// Aegis · Contraseñas: sin los avisos de filtraciones de Mozilla Monitor y con la protección frente al robo de la
// fase 5 (abajo). El aspecto de about:logins está en overlay/browser/components/aegis/paginas (contrasenas.*) y el
// del panel de la barra lateral, en contrasenas-panel.sys.mjs.

// Avisos de webs con filtraciones: comparan los inicios de sesión guardados con la lista de Mozilla Monitor, que
// Remote Settings descarga de los servidores de Mozilla. Apagado, BrowserGlue no se suscribe a esa lista ni
// la página pinta los avisos ni el orden «Alertas».
pref("signon.management.page.breach-alerts.enabled", false);

// Contraseñas «vulnerables» (las que salen en esas filtraciones): dependen de la misma lista.
pref("signon.management.page.vulnerable-passwords.enabled", false);

// Enlace de los avisos a monitor.firefox.com: vacío, para que ninguna página lo ofrezca.
pref("signon.management.page.breachAlertUrl", "");

// ───────── Protección frente al robo de credenciales (fase 5) ─────────
// Lo que protege cada una y lo que no: docs/PRIVACIDAD.md, «Contraseñas». Código: contrasenas.sys.mjs.

// No rellenar solo al cargar la página: el usuario elige la contraseña en el desplegable del campo. Así ninguna web
// (un script inyectado, un formulario oculto o invisible) recibe una contraseña sin un clic del usuario. Firefox: true.
pref("signon.autofillForms", false);

// Nunca rellenar solo en páginas http (ya es lo de Firefox; se fija aquí). Las guardadas para https nunca se ofrecen
// en http. Sin relleno automático, Firefox tampoco rellena solo en iframes de otro origen (sameOriginWithTop).
pref("signon.autofillForms.http", false);

// En el desplegable, solo las contraseñas del sitio exacto, no las de otros subdominios del mismo dominio (una página
// vulnerable de un subdominio no puede pedir las del inicio de sesión). Firefox: true.
pref("signon.includeOtherSubdomainsInLookup", false);

// Ver, copiar o editar una contraseña (y exportar) piden la autenticación de Windows (Windows Hello, PIN o la
// contraseña de la sesión), también sin contraseña principal. Firefox: false. En Linux no existe (OSKeyStore). Con
// un perfil nuevo Firefox la deja a false como valor del usuario (BrowserGlue): contrasenas.sys.mjs la enciende una
// vez (marca aegis.contrasenas.os_auth.inicial), y si luego la apagas en Ajustes se respeta.
pref("signon.management.page.os-auth.locked.enabled", true);

// Un recurso de otro sitio metido en una página (imagen, script) no puede abrir el diálogo de usuario y contraseña
// de HTTP: es una forma conocida de suplantar un inicio de sesión. Firefox: 2 (todos pueden).
pref("network.auth.subresource-http-auth-allow", 1);

// Contraseña principal obligatoria antes de guardar la primera contraseña (sin ella, key4.db no está cifrada).
pref("aegis.contrasenas.principal_obligatoria", true);

// Minutos sin usar el equipo tras los que se cierra la bóveda y se vuelve a pedir la contraseña principal. Se elige en
// Ajustes › Contraseñas y autorrelleno › «Cierre automático de la bóveda»: 0 (nunca), 15, 10, 5, 3, 2 o 1; otro valor se lleva al más
// cercano (contrasenas.sys.mjs). Con 0 solo se cierra al cerrar Aegis o al suspender el equipo.
pref("aegis.contrasenas.bloqueo_minutos", 10);

// Exportar en claro (CSV): cerrado. Un CSV deja todas las contraseñas legibles en el disco. Activarlo solo para
// llevárselas a otro navegador mientras no hay exportación cifrada para ellos (fase 5); sigue pidiendo autenticación.
// Para otro Aegis no hace falta: «Pasar a otro Aegis» (abajo) las lleva cifradas.
pref("aegis.contrasenas.exportar_en_claro", false);

// ───────── Pasar las contraseñas a otro Aegis (código de 6 palabras) ─────────
// Detalle y formato en docs/PRIVACIDAD.md, «Pasar las contraseñas a otro Aegis». Código:
// overlay/browser/components/aegis/contrasenas/transferencia/. El código no se guarda nunca; el formato y sus
// iteraciones de PBKDF2 van fijos en formato.sys.mjs (no en prefs: bajarlas debilitaría todos los paquetes).

// Paquetes ya importados en este perfil, para que cada uno valga una sola vez: lista JSON de [identificador aleatorio
// del paquete, hora de creación], solo de las últimas 24 h (uno más antiguo se rechaza igual por caducado). Lo escribe
// transferencia.sys.mjs al importar; no dice nada de las contraseñas ni de quién las mandó. Vacía de serie.
pref("aegis.contrasenas.transferencia.usados", "");

// Segundos tras los que se borra del portapapeles el código de transferencia copiado, si sigue ahí (un solo
// temporizador tras copiar, nunca en reposo; también se borra al cerrar Aegis). 0: no se borra. Como mucho, 600.
pref("aegis.contrasenas.transferencia.portapapeles_segundos", 60);

// ───────── Autenticador: códigos de verificación (TOTP) ─────────
// Detalle en docs/PRIVACIDAD.md, «Códigos de verificación». Código: overlay/browser/components/aegis/autenticador/.
// Los secretos van cifrados con la clave de las contraseñas en aegis-autenticador.json (perfil), nunca en prefs.

// Al enfocar un campo de código de verificación en un sitio https con código guardado (solo la página principal,
// nunca un marco), ofrecerlo en un panelito; se rellena solo tras un clic. El observador de las páginas solo existe
// mientras haya algún código guardado.
pref("aegis.autenticador.rellenar", true);

// Segundos tras los que se borra del portapapeles un código copiado, si sigue ahí (un solo temporizador tras copiar,
// nunca en reposo). 0: no se borra.
pref("aegis.autenticador.portapapeles_segundos", 30);
