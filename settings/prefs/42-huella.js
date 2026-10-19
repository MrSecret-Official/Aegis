// Aegis · huella digital: lo que una web puede leer del navegador (overlay/browser/components/aegis/huella.sys.mjs).
// Aquí va el nivel de serie, «equilibrada», como valores por defecto: así un perfil nuevo está protegido desde el
// primer momento y en todos los procesos. Los otros niveles los escribe huella.sys.mjs como valores del usuario.
// Qué oculta cada nivel y qué no: docs/PRIVACIDAD.md, «Huella digital».

// Nivel elegido: «firefox» (lo de Firefox de serie), «equilibrada», «estricta» o «caja_fuerte».
pref("aegis.huella.nivel", "equilibrada");
// Los sitios a los que el usuario deja ver los datos del navegador en Caja fuerte no van en prefs: son un permiso
// («aegis-huella») del gestor de permisos, que borran «Olvidar este sitio» y el borrado de datos. huella.sys.mjs
// reconstruye con ellos privacy.fingerprintingProtection.granularOverrides.

// La protección frente a la huella de Firefox (FPP) también en las ventanas normales, no solo en las privadas. Es lo
// que hace la protección contra rastreo estricta de Firefox, que Aegis trae de serie; aquí queda también para
// «Normal», que de otro modo la quitaría.
pref("privacy.fingerprintingProtection", true);

// Nivel «equilibrada»: lo de serie de Firefox (RFPTargetsDefault.inc: ruido en canvas, fuentes del sistema y del
// idioma, Math, pantalla disponible = resolución, núcleos por tramos, puntos táctiles agrupados, estilo del IME) y,
// además, lo que se puede ocultar sin romper webs normales (verificado en el código de la 157):
// - WebGL: fabricante y modelo de la tarjeta gráfica («Mozilla»). Firefox lo hace de serie en Nightly.
// - WebGPU: «adaptador de respaldo» siempre falso y tamaños de subgrupo fijos.
// - Audio: latencia fija y como mucho 2 canales en AudioContext.
// - Tipo de conexión, sensores del dispositivo, cámara frontal o trasera, buildID, pdf.js activo, texto de los errores
//   de vídeo, contadores de fotogramas propios de Gecko (mozPaintedFrames…) y color de la pantalla (24 bits, sRGB).
// ScreenOrientation no va aquí aunque parezca inocuo: deduce la orientación del tamaño de la ventana que solo guarda
// WindowOuterSize (nsPresContext::UpdateInnerSizeSpoofedForRFP); sin él, toda ventana apaisada diría «portrait».
// Fuera, aposta: accesibilidad (contraste, reducir movimiento), hora, idioma, tema oscuro, zoom, resolución, teclado,
// ratón, mandos, cámaras y micrófonos, calidad de vídeo (YouTube bajaría a 480p), WebCodecs y el ruido de WebGL.
pref("privacy.fingerprintingProtection.overrides", "+WebGLVendorSanitize,+WebGLVendorConstant,+WebGLRendererConstant,+WebGPUIsFallbackAdapter,+WebGPUSubgroupSizes,+AudioContext,+NetworkConnection,+DeviceSensors,+VideoElementMozFrames,+VideoElementMozFrameDelay,+MediaError,+PdfjsSpoof,+StreamVideoFacingMode,+NavigatorBuildID,+CSSColorInfo,+ScreenPixelDepth");

// ── Protecciones de todos los niveles (no son de la protección frente a la huella) ──

// UITour deja a webs de Mozilla (mozilla.org, firefox.com, support.mozilla.org) manejar partes de la interfaz y leer
// datos del navegador. Ninguna web tiene por qué hacerlo.
pref("browser.uitour.enabled", false);
// Permisos de serie a dominios de Mozilla (resource://app/defaults/permissions): UITour para mozilla.org,
// firefox.com y support.mozilla.org, leer los datos de solución de problemas desde support.mozilla.org e instalar
// complementos sin preguntar desde addons.mozilla.org. Sin ellos, instalar desde esa tienda pide un clic más.
pref("permissions.manager.defaultsUrl", "");
// WebRTC: solo la dirección de la ruta por defecto (no todas las interfaces de red, VPN incluida) y, con un proxy,
// solo a través de él. Las videollamadas siguen funcionando por STUN y TURN.
pref("media.peerconnection.ice.default_address_only", true);
pref("media.peerconnection.ice.proxy_only_if_behind_proxy", true);
// Referer a otros sitios: solo el origen (esquema, dominio y puerto), aunque la web pida enviar la dirección entera.
pref("network.http.referer.XOriginTrimmingPolicy", 2);
// Global Privacy Control (cabecera Sec-GPC) también en ventanas normales: pide a las webs que no vendan ni compartan
// tus datos. Es una señal más (Firefox solo la envía en privado), pero tiene valor legal en varios países.
pref("privacy.globalprivacycontrol.enabled", true);
// Que una web no pueda mover ni cambiar el tamaño de la ventana (window.moveTo, resizeTo…).
pref("dom.disable_window_move_resize", true);
// Sin JavaScript dentro de los PDF: algunos formularios con cálculos automáticos dejan de calcular.
pref("pdfjs.enableScripting", false);
