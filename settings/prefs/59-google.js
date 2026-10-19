// Aegis · Google limpio (docs/PLAN.md, «Buscar en Google sin ser rastreado»; docs/CONEXIONES.md, «Google»).
// Google se puede elegir como buscador (sin código de socio: parche 0400-privacidad/0002). El buscador de serie
// sigue siendo DuckDuckGo (AegisArranque).

// Filtro de Google (google.sys.mjs): cancela la telemetría y los anuncios de Google en sus servicios, limpia las
// búsquedas y hace directos los enlaces /url?q=. Con false, el módulo se apaga del todo (sin reiniciar).
pref("aegis.google.limpio", true);

// Búsquedas de Google hechas desde el navegador: «solo resultados web» (udm=14), sin respuestas de IA ni módulos.
// Dentro de Google se puede volver a «Todo»; con false, Google muestra su página de resultados normal.
pref("aegis.google.solo_web", true);

// Sugerencias de búsqueda mientras se escribe: apagadas de serie, porque mandan cada tecla al buscador (con Google,
// a www.google.com/complete/search). Afecta a todos los buscadores; se activan en Ajustes › Búsqueda.
pref("browser.search.suggest.enabled", false);

// Eliminación nativa de parámetros de rastreo (query stripping): la activa la protección estricta (qps y qpsPBM),
// que pone AegisArranque; aquí solo se añaden los identificadores de clic de Google a su lista, que Firefox aplica
// al entrar en otra web desde un enlace o al pegar una dirección. Solo nombres que no usa nadie más: los cortos de
// la búsqueda de Google (ved, ei, sa, oq…) los quita google.sys.mjs solo en Google, porque esta lista vale para
// todas las webs. gclid/gclsrc/dclid/gbraid/wbraid/gad_source/gad_campaignid: clics de anuncios de Google Ads;
// srsltid: clics de resultados de Google Shopping; _gl: enlace entre dominios de Google Analytics. msclkid: clics de
// anuncios de Microsoft Advertising (los de Bing, DuckDuckGo, Qwant y Ecosia); lo quitan ClearURLs (reglas globales) y
// AdGuard URL Tracking Protection («$removeparam=msclkid»). Los de la búsqueda de los demás buscadores (cvid, form…),
// solo en su buscador: busqueda-limpia.sys.mjs.
pref("privacy.query_stripping.strip_list", "gclid gclsrc dclid gbraid wbraid gad_source gad_campaignid srsltid _gl msclkid");
