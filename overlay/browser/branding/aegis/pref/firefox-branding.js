/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Prefs de la marca Aegis (a partir de la de unofficial). Las de Aegis van en settings/prefs/ (pref/aegis.js).

pref("startup.homepage_override_url", "");
pref("startup.homepage_welcome_url", "");
pref("startup.homepage_welcome_url.additional", "");
// Intervalo entre comprobaciones de actualizaciones (segundos).
pref("app.update.interval", 86400); // 24 horas
pref("app.update.promptWaitTime", 86400);
// Las páginas de descarga y de detalles de una versión las pone settings/prefs (GitHub Releases).
pref("app.update.url.manual", "");
pref("app.update.url.details", "");
pref("app.update.checkInstallTime.days", 2);
pref("app.update.badgeWaitTime", 0);

// Protección contra pegar código en la consola web (estafas «pega esto»): activa con un valor menor que 5,
// como la marca oficial de Firefox. Se desactiva escribiendo «allow pasting».
pref("devtools.selfxss.count", 0);
