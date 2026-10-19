// Aegis · nueva pestaña limpia: sin patrocinados, sin noticias, sin tiempo y sin accesos puestos de serie.
// Nada de la nueva pestaña se conecta por su cuenta: ni anuncios, ni noticias, ni fondos, ni capturas de webs.

// Accesos y contenido patrocinados (Amazon, Temu, AliExpress…).
pref("browser.newtabpage.activity-stream.showSponsored", false);
pref("browser.newtabpage.activity-stream.showSponsoredTopSites", false);
pref("browser.newtabpage.activity-stream.showSponsoredCheckboxes", false);
pref("browser.topsites.contile.enabled", false);
// Anuncios unificados (ads.mozilla.org): accesos y tarjetas. Sin patrocinados no se piden, pero se apagan por si
// una de las de arriba se enciende a mano.
pref("browser.newtabpage.activity-stream.unifiedAds.tiles.enabled", false);
pref("browser.newtabpage.activity-stream.unifiedAds.spocs.enabled", false);
// Sin accesos puestos de serie: solo los que el usuario visite o fije. Sin la lista de Remote Settings (que además
// los pondría), se usa default.sites, que está vacío. Con un perfil nuevo basta; ActivityStream respeta un valor
// de serie que ya exista (DefaultPrefs.init y _updateDynamicPrefs no lo pisan).
pref("browser.topsites.useRemoteSetting", false);
pref("browser.newtabpage.activity-stream.default.sites", "");
// Tampoco accesos de búsqueda fijados solos (@amazon, @google… según la región).
pref("browser.newtabpage.activity-stream.improvesearch.topSiteSearchShortcuts", false);
// Caché de arranque de about:home: es la página de inicio pintada al cerrar, que se sirve tal cual al abrir. Guardaba
// los accesos de serie de una sesión anterior y los seguía enseñando aunque ya no existieran (la página no se
// actualiza con el estado nuevo). Sin ella, about:home se pinta con el estado real en cada arranque.
pref("browser.startup.homepage.abouthome_cache.enabled", false);
// Sin capturas de las webs de los accesos: para un acceso sin icono, Firefox carga la web en segundo plano para
// sacarle una miniatura (una conexión que el usuario no ha pedido). Sin ella se usa el icono o la inicial.
pref("browser.pagethumbnails.capturing_disabled", true);
// Sin el logotipo y el nombre grandes encima del buscador (además, nueva-pestana.css los oculta en el diseño Nova).
pref("browser.newtabpage.activity-stream.logowordmark.alwaysVisible", false);

// Noticias recomendadas (antes Pocket).
pref("browser.newtabpage.activity-stream.feeds.section.topstories", false);

// Fondos de pantalla: las miniaturas y los fondos se descargan del CDN de Mozilla al abrir «Personalizar». El fondo
// de Aegis es el de la interfaz (--aegis-bg).
pref("browser.newtabpage.activity-stream.newtabWallpapers.enabled", false);

// El tiempo: pide la ubicación y consulta un servicio externo.
pref("browser.newtabpage.activity-stream.showWeather", false);
pref("browser.newtabpage.activity-stream.system.showWeather", false);
pref("browser.newtabpage.activity-stream.widgets.weather.enabled", false);
pref("browser.newtabpage.activity-stream.widgets.system.weather.enabled", false);

// Ping «privado» de la nueva pestaña (Glean): con la telemetría apagada no sale, pero no se prepara.
pref("browser.newtabpage.activity-stream.telemetry.privatePing.enabled", false);

// Recomendaciones de extensiones y funciones (CFR).
pref("browser.newtabpage.activity-stream.asrouter.userprefs.cfr.addons", false);
pref("browser.newtabpage.activity-stream.asrouter.userprefs.cfr.features", false);

// Barra de direcciones: sin sugerencias patrocinadas, de Mozilla ni de tendencias.
pref("browser.urlbar.quicksuggest.enabled", false);
pref("browser.urlbar.suggest.quicksuggest.sponsored", false);
pref("browser.urlbar.suggest.quicksuggest.nonsponsored", false);
pref("browser.urlbar.trending.featureGate", false);
pref("browser.urlbar.sponsoredTopSites", false);
