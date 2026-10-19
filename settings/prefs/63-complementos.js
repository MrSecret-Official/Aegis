// Aegis · Complementos (about:addons): sin recomendaciones ni promociones de la tienda. Lo principal ya está en
// 50-interfaz.js (browser.discovery.enabled, extensions.getAddons.showPane y
// extensions.htmlaboutaddons.recommendations.enabled); esto cierra lo que queda.

// Panel «Recomendaciones» (descubrimiento): sin dirección de la que pedirlas aunque se volviera a encender.
pref("extensions.getAddons.discovery.api_url", "");
// Aviso de las recomendaciones personalizadas (TAAR): no se muestra.
pref("extensions.recommendations.hideNotice", true);
// Enlaces del pie de las recomendaciones (temas de color y su política de privacidad): fuera.
pref("extensions.recommendations.themeRecommendationUrl", "");
pref("extensions.recommendations.privacyPolicyUrl", "");
