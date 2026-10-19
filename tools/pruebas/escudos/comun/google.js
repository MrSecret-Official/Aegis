/* Peticiones de Google para el caso «google». Cada página (la portada simulada de Google, YouTube y una web de
 * terceros) lanza las suyas como lo haría la web real: píxeles con imágenes, balizas, fetch, scripts y marcos. El
 * servidor apunta lo que le llega; casos.js lo compara con lo que se espera de cada una. */
"use strict";

const PeticionesGoogle = {
  // [etiqueta, url, tipo, qué se espera: "cancelar" | "pasar" | "etp" (se deja a la protección contra rastreo)]
  "g-inicio": [
    ["gen_204", "https://www.google.com/gen_204?atyp=i&ei=x", "imagen", "cancelar"],
    ["client_204", "https://www.google.com/client_204?atyp=i", "imagen", "cancelar"],
    ["log", "https://play.google.com/log?format=json&hasfast=true", "fetch-post", "cancelar"],
    ["csi", "https://www.google.com/csi?v=3&s=web", "imagen", "cancelar"],
    ["pagead", "https://www.google.com/pagead/1p-user-list/123/?random=1", "imagen", "cancelar"],
    ["ga-audiences", "https://www.google.com/ads/ga-audiences?v=1&t=sr", "imagen", "cancelar"],
    ["ads-measurement", "https://www.google.com/ads/measurement/l?ebcid=x", "imagen", "cancelar"],
    ["rmkt", "https://www.google.com/rmkt/collect/123/?random=1", "imagen", "cancelar"],
    ["ccm", "https://www.google.com/ccm/collect?en=page_view", "fetch", "cancelar"],
    ["afs", "https://www.google.com/afs/ads?client=x&q=y", "fetch", "cancelar"],
    ["g-collect", "https://analytics.google.com/g/collect?v=2&tid=G-X", "baliza", "cancelar"],
    ["maps-gen_204", "https://www.google.com/maps/gen_204?atyp=csi", "imagen", "cancelar"],
    ["logImpressions", "https://docs.google.com/document/d/x/logImpressions?id=1", "fetch-post", "cancelar"],
    ["jserror", "https://docs.google.com/document/d/x/jserror?error=1", "fetch-post", "cancelar"],
    ["gen_204-es", "https://www.google.es/gen_204?atyp=i", "imagen", "cancelar"],
    ["url-baliza", "https://www.google.com/url?sa=t&source=web&url=https://sitio-a.test/", "baliza", "cancelar"],
    ["doubleclick", "https://stats.g.doubleclick.net/g/collect?v=2", "imagen", "cancelar"],
    ["viewthrough", "https://googleads.g.doubleclick.net/pagead/viewthroughconversion/1/?random=1", "imagen", "cancelar"],
    ["adsbygoogle", "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1", "script", "cancelar"],
    ["adservices", "https://www.googleadservices.com/pagead/conversion/1/?label=x", "imagen", "cancelar"],
    ["gpt", "https://www.googletagservices.com/tag/js/gpt.js", "script", "cancelar"],
    ["ga-collect", "https://www.google-analytics.com/g/collect?v=2&tid=G-X", "baliza", "cancelar"],
    ["gtag", "https://www.googletagmanager.com/gtag/js?id=G-X", "script", "cancelar"],
    ["ima3", "https://imasdk.googleapis.com/js/sdkloader/ima3.js", "script", "cancelar"],
    ["csi-gstatic", "https://csi.gstatic.com/csi?v=3", "imagen", "cancelar"],
    ["firelog", "https://firebaselogging-pa.googleapis.com/v1/firelog/legacy/log", "fetch-post", "cancelar"],
    ["accounts-gsi", "https://accounts.google.com/gsi/client", "script", "pasar"],
    ["accounts-gen_204", "https://accounts.google.com/gen_204?exento=1", "imagen", "pasar"],
    ["recaptcha", "https://www.google.com/recaptcha/api.js", "script", "pasar"],
    ["recaptcha-gstatic", "https://www.gstatic.com/recaptcha/releases/x/recaptcha__es.js", "script", "pasar"],
    ["fonts", "https://fonts.googleapis.com/css2?family=Roboto", "fetch", "pasar"],
    ["ogs", "https://ogs.google.com/widget/app/so", "imagen", "pasar"],
    ["complete", "https://www.google.com/complete/search?q=a&client=gws-wiz", "fetch", "pasar"],
    [
      "ogads",
      "https://ogads-pa.clients6.google.com/$rpc/google.internal.onegoogle.asyncdata.v1.AsyncDataService/GetAsyncData",
      "fetch-post",
      "pasar",
    ],
    ["maps-js", "https://maps.googleapis.com/maps/api/js?key=x", "script", "pasar"],
    ["xjs", "https://www.google.com/xjs/_/js/k=xjs.s.es.x/m=cdos", "script", "pasar"],
    ["gstatic-img", "https://www.gstatic.com/images/branding/googlelogo/1x/googlelogo_color_92x30dp.png", "imagen", "pasar"],
  ],
  "g-youtube": [
    ["stats-ads", "https://www.youtube.com/api/stats/ads?ver=2", "imagen", "cancelar"],
    ["stats-atr", "https://www.youtube.com/api/stats/atr?ns=yt", "fetch-post", "cancelar"],
    ["stats-qoe", "https://www.youtube.com/api/stats/qoe?fmt=1", "fetch-post", "cancelar"],
    ["ptracking", "https://www.youtube.com/ptracking?video_id=x", "imagen", "cancelar"],
    ["csi_204", "https://www.youtube.com/csi_204?v=3", "imagen", "cancelar"],
    ["error_204", "https://www.youtube.com/error_204?a=1", "imagen", "cancelar"],
    ["log_event", "https://www.youtube.com/youtubei/v1/log_event?alt=json", "fetch-post", "cancelar"],
    ["midroll", "https://www.youtube.com/get_midroll_info?ei=x", "fetch", "cancelar"],
    ["pagead-yt", "https://www.youtube.com/pagead/adview?ai=x", "imagen", "cancelar"],
    ["activeview", "https://www.youtube.com/pcs/activeview?xai=x", "imagen", "cancelar"],
    ["playback", "https://www.youtube.com/api/stats/playback?ns=yt&docid=x", "imagen", "pasar"],
    ["watchtime", "https://www.youtube.com/api/stats/watchtime?ns=yt&docid=x", "imagen", "pasar"],
    ["generate_204", "https://www.youtube.com/generate_204?x=1", "imagen", "pasar"],
    ["player", "https://www.youtube.com/youtubei/v1/player?prettyPrint=false", "fetch-post", "pasar"],
    ["videoplayback", "https://rr1---sn-prueba.googlevideo.com/videoplayback?expire=1", "fetch", "pasar"],
    ["ytimg", "https://i.ytimg.com/vi/x/hqdefault.jpg", "imagen", "pasar"],
  ],
  "g-terceros": [
    ["analytics.js", "https://www.google-analytics.com/analytics.js", "script", "etp"],
    ["gtm.js", "https://www.googletagmanager.com/gtm.js?id=GTM-X", "script", "etp"],
    ["gpt.js", "https://securepubads.g.doubleclick.net/tag/js/gpt.js", "script", "etp"],
    ["adsbygoogle.js", "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1", "script", "etp"],
    ["ima3.js", "https://imasdk.googleapis.com/js/sdkloader/ima3.js", "script", "etp"],
    ["conversion_async.js", "https://www.googleadservices.com/pagead/conversion_async.js", "script", "etp"],
    ["gtag-terceros", "https://www.googletagmanager.com/gtag/js?id=G-X", "script", "cancelar"],
    ["ga-collect-terceros", "https://www.google-analytics.com/g/collect?v=2&tid=G-X", "baliza", "cancelar"],
    ["doubleclick-terceros", "https://stats.g.doubleclick.net/j/collect?t=dc", "imagen", "cancelar"],
    ["pagead-terceros", "https://www.google.com/pagead/1p-conversion/1/?random=1", "imagen", "cancelar"],
    ["viewthrough-terceros", "https://googleads.g.doubleclick.net/pagead/viewthroughconversion/1/", "imagen", "cancelar"],
    ["afs-marco", "https://www.google.com/afs/ads/i/iframe.html?client=x", "marco", "cancelar"],
    ["recaptcha-terceros", "https://www.google.com/recaptcha/api.js", "script", "pasar"],
    ["fonts-terceros", "https://fonts.googleapis.com/css2?family=Roboto", "fetch", "pasar"],
  ],
};

/** Lanza las peticiones de la fase (cada una con su id) y espera a que el registro se calme. */
async function lanzarGoogle(fase) {
  const lista = PeticionesGoogle[fase] ?? [];
  const senales = {};
  await Promise.all(
    lista.map(async ([etiqueta, url, tipo]) => {
      const u = new URL(url);
      u.searchParams.set("aegisid", Banco.id(etiqueta));
      let v;
      if (tipo === "fetch-post") {
        v = await fetch(u, { method: "POST", mode: "no-cors", body: "{}", cache: "no-store" }).then(
          () => "carga",
          () => "error"
        );
      } else {
        v = await Banco.cargar(tipo, u.href);
      }
      senales[etiqueta] = v;
    })
  );
  await Banco.estabilizar(`${Banco.run}.${Banco.fase}.`);
  return senales;
}

// Para el ejecutor (Marionette no ve las declaraciones const de la página).
window.PeticionesGoogle = PeticionesGoogle;
