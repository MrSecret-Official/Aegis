# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

## about:conexiones (paginas/conexiones.html ; conexiones.sys.mjs) : ce à quoi le navigateur se connecte de lui-même et
## l’autorisation de l’utilisateur. Affichée au premier lancement, avant toute connexion. Les noms de services (GitHub,
## Mozilla, Google, Cisco, Disconnect, Remote Settings, Safe Browsing, OpenH264, Widevine, CRLite, Netflix) ne se
## traduisent pas.

conexiones-pestana = Connexions
conexiones-titulo = C’est vous qui décidez ce qui se connecte
conexiones-entradilla = { -brand-short-name } ne s’est encore connecté à rien. Voici les connexions qu’il établit de lui-même, sans que vous naviguiez. Choisissez celles que vous autorisez.
# Libellé de la carte (affiché en majuscules).
conexiones-lista-titulo = Connexions d’{ -brand-short-name }

conexiones-actualizaciones-nombre = Mises à jour d’{ -brand-short-name }
conexiones-actualizaciones-que = Une fois par jour, il demande à GitHub s’il existe une nouvelle version et, le cas échéant, la télécharge depuis GitHub. GitHub voit votre adresse IP et votre version d’{ -brand-short-name }, sans cookies. Sans cela, vous devrez rechercher les mises à jour vous-même dans À propos d’{ -brand-short-name }.
conexiones-seguridad-nombre = Listes de sécurité
conexiones-seguridad-que = Certificats révoqués (CRLite) et modules complémentaires dangereux, depuis Remote Settings (services.mozilla.com). Recherche les changements une fois par jour. Ce serveur voit votre adresse IP et votre version. Sans cela, pour savoir si le certificat d’un site a été révoqué, { -brand-short-name } interroge l’autorité qui l’a émis chaque fois que vous ouvrez un nouveau site, souvent sans chiffrement : le désactiver entraîne plus de ces requêtes, pas moins.
conexiones-listas-nombre = Listes de protection
conexiones-listas-que = Les listes qui permettent aux Boucliers de reconnaître ce qui vous suit. Celles de la protection contre le pistage, depuis Remote Settings (basées sur celles de Disconnect) : sans elles, aucun traqueur, détecteur d’empreinte numérique, cryptomineur ou bouton de réseau social n’est reconnu, et les substituts qui évitent qu’un site ne casse quand on les bloque ne fonctionnent pas. Et les listes de filtres de leurs auteurs (EasyList, AdGuard, uBlock Origin) : sans elles, les Boucliers utilisent la copie fournie avec { -brand-short-name }, qui vieillit. Elles sont vérifiées au plus une fois par jour et seul ce qui a changé est téléchargé.
conexiones-codecs-nombre = Codecs vidéo
conexiones-codecs-que = OpenH264, de Cisco, pour les appels vidéo : téléchargé une fois. Widevine, de Google, pour les vidéos protégées (DRM), comme celles de Netflix : seulement si un site le demande et que vous l’activez. Ensuite, recherche de nouvelles versions au plus une fois par jour (sur aus5.mozilla.org et, pour Widevine, chez Google).
conexiones-traduccion-nombre = Traduction des pages
conexiones-traduccion-que = Traduit les sites sur votre appareil, sans les envoyer à personne. Seulement quand vous demandez à traduire une page ou téléchargez une langue dans les Paramètres, il télécharge le modèle de cette langue (plusieurs Mo) depuis Remote Settings (services.mozilla.com) ; la liste des langues est vérifiée une fois par jour. Sans cela, l’option de traduction n’apparaît pas.
conexiones-safebrowsing-nombre = Safe Browsing de Google
conexiones-safebrowsing-que = Vous avertit des sites frauduleux et des téléchargements dangereux grâce aux listes de Google, mises à jour environ toutes les demi-heures. Pour confirmer un avertissement, il envoie à Google un fragment d’un code calculé à partir de l’adresse, pas l’adresse elle-même.
conexiones-safebrowsing-sin-clave = Non disponible dans cette version d’{ -brand-short-name } : sa clé pour le service de Google est absente.
conexiones-push-nombre = Notifications des sites
conexiones-push-que = Une connexion ouverte avec un serveur de notifications (push.services.mozilla.com), pour que les sites que vous autorisez puissent vous prévenir même lorsqu’ils ne sont pas ouverts. Ce serveur voit votre adresse IP et un identifiant de ce navigateur.

conexiones-navegar = La navigation n’en dépend pas : quand vous ouvrez un site, { -brand-short-name } s’y connecte. Cette page ne concerne que ce qui se fait tout seul, sans action de votre part.
conexiones-cambiar = Les changements s’appliquent immédiatement, sans redémarrer. Vous pouvez revenir ici à tout moment depuis Paramètres › Vie privée.

conexiones-aceptar = Accepter
conexiones-guardar = Enregistrer
conexiones-ahora-no = Pas maintenant
conexiones-ninguna = N’en autoriser aucune
conexiones-estado-aceptadas = Enregistré. De lui-même, { -brand-short-name } ne se connectera que pour ce que vous avez laissé activé.
conexiones-estado-ninguna = Enregistré. { -brand-short-name } ne se connectera à rien de lui-même. Sans mises à jour ni listes, il prendra du retard en matière de sécurité.

## Paramètres › Vie privée › Connexions (ajustes.sys.mjs)

# Libellé de section (affiché en majuscules).
conexiones-ajustes-titulo = Connexions
conexiones-ajustes-ninguna = { -brand-short-name } ne se connecte à rien de lui-même.
# $lista : les noms des groupes actifs, sous forme de liste dans la langue (« Mises à jour d’Aegis et Listes de sécurité »).
conexiones-ajustes-activas = De lui-même, { -brand-short-name } ne se connecte que pour ceci : { $lista }.
conexiones-ajustes-elegir = Choisir ce qui se connecte
