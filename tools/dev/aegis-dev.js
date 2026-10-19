// Aegis · activa el cargador de desarrollo (aegis-dev.cfg, junto al ejecutable).
// SOLO en copias de prueba: lo instala `aegis.py instalar-prueba` y nunca va en una versión publicada.
pref("general.config.filename", "aegis-dev.cfg");
pref("general.config.obscure_value", 0);
pref("general.config.sandbox_enabled", false);
// La copia compilada de AegisArranque se aparta: manda la del repo (resource://aegis/).
pref("aegis.dev", true);
