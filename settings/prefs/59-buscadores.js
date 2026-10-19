// Aegis · Búsqueda limpia en DuckDuckGo, Bing, Startpage, Qwant, Ecosia y Wikipedia (docs/PLAN.md, «Buscar sin ser
// rastreado en los demás buscadores»; docs/CONEXIONES.md, «Otros buscadores»). Google va aparte, en 59-google.js.

// Filtro de los buscadores (busqueda-limpia.sys.mjs): corta sus pings de telemetría, quita los parámetros de socio y
// de seguimiento de sus búsquedas, hace directos los enlaces de resultados (duckduckgo.com/l/, bing.com/ck/a) y pide
// las sugerencias de Startpage a su dirección pública. Con false, el módulo se apaga del todo (sin reiniciar).
pref("aegis.buscadores.limpio", true);

// Búsquedas de DuckDuckGo hechas desde el navegador: en noai.duckduckgo.com, su versión sin IA (sin Search Assist ni
// Duck.ai y con las imágenes hechas con IA ocultas), como su extensión oficial «DuckDuckGo No-AI Search».
pref("aegis.buscadores.sin_ia", true);

// DuckDuckGo sin anuncios (k1=-1, su ajuste «Advertisements: Off»). Apagado de serie: DuckDuckGo pide que no se quite
// su publicidad salvo por decisión de cada persona. Lo enciende el usuario con el interruptor del panel de Escudos en
// DuckDuckGo. Sin él, los Escudos ocultan igualmente los anuncios que reconocen sus listas.
pref("aegis.buscadores.sin_anuncios", false);

// Microsoft Rewards en Bing: false (de serie) corta /rewardsapp/reportActivity, la actividad que Bing envía para sumar
// puntos, así que las búsquedas no suman puntos de Rewards; true la deja pasar. Lo decide el usuario con el
// interruptor del panel de Escudos en Bing.
pref("aegis.buscadores.bing_rewards", false);
