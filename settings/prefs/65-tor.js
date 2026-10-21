// Aegis · Tor (overlay/browser/components/aegis/tor/): «Nueva ventana privada con Tor» (menú ☰ y Ctrl+Mayús.+U), en
// una instancia aparte de Aegis con su propio perfil. tor no viene con el navegador: se descarga aparte, solo si el
// usuario lo pide (Ajustes › Privacidad › Tor), con la versión y el sha256 fijados en tor/tor.json.

// ¿Es esta la instancia con Tor? Solo es true en el perfil de usar y tirar de esa instancia, cuyo user.js lo pone
// junto con el proxy, Caja fuerte y el resto (tor/tor.sys.mjs, userJs). En el Aegis normal, false: no hace nada de red.
pref("aegis.tor.instancia", false);

// Puentes para cuando la red bloquea Tor: "" (ninguno), "obfs4" o "snowflake", tal como vienen en pt_config.json del
// paquete. Se pasa a la instancia al abrirla.
pref("aegis.tor.puentes", "");
