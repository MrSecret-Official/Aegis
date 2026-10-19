# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

## about:escudos, «Cómo funcionan los Escudos» (paginas/escudos-ayuda.html): la ayuda de cada opción del panel de
## Escudos y de la huella digital. Para todo el mundo: de tú, frases cortas y sin jerga. Los nombres de las opciones
## son los del panel (aegis.ftl) y se escriben igual. <strong> se deja tal cual (negrita del nombre de la opción).

escudos-ayuda-pestana = Comment fonctionnent les Boucliers
escudos-ayuda-titulo = Comment fonctionnent les Boucliers
escudos-ayuda-entradilla = Ce que fait chaque option du panneau des Boucliers, quand la modifier et que faire si un site ne fonctionne plus.
# Etiqueta del índice (se muestra en mayúsculas).
escudos-ayuda-indice = Sur cette page
# Encabezados que se repiten en varias secciones.
escudos-ayuda-h-cuando = Quand l’utiliser
escudos-ayuda-h-falla = Si un site ne marche plus

## Qué son los Escudos y el contador

escudos-ayuda-escudos-titulo = Les Boucliers, c’est quoi
escudos-ayuda-escudos-que = Chaque site que vous ouvrez charge des éléments d’autres entreprises : publicités, compteurs de visites, boutons de réseaux sociaux. Beaucoup servent à vous suivre d’un site à l’autre et à savoir ce que vous faites. Les Boucliers les bloquent avant qu’ils n’arrivent.
escudos-ayuda-escudos-panel = Le bouton des Boucliers est l’anneau à droite de la barre d’adresse. Cliquez dessus pour ouvrir le panneau, avec ce qui a été bloqué sur la page et les options de protection. Chaque option indique si elle s’applique seulement au site affiché ou « Sur tous les sites ».
escudos-ayuda-contador-titulo = Le compteur
escudos-ayuda-contador-que = Le nombre sur le bouton compte ce qui a été bloqué sur la page affichée : publicités, traqueurs, traqueurs de réseaux sociaux, collecteurs d’empreinte numérique et mineurs de cryptomonnaies. Par défaut, il compte chaque requête bloquée ; dans Paramètres › Boucliers › « Compteur », vous pouvez faire compter chaque serveur une seule fois (« Origines »). Le nombre revient à zéro quand vous changez de page.
escudos-ayuda-contador-no = Il ne compte pas ce qui est protégé sans rien bloquer : les cookies rangés à part pour chaque site, les données du navigateur masquées ni les connexions passées en HTTPS. Quand les Boucliers sont baissés, le nombre n’apparaît pas.
escudos-ayuda-contador-total = Sous le grand nombre du panneau, vous voyez tout ce qui a été bloqué depuis l’installation d’{ -brand-short-name }. Ce total reste sur votre appareil et n’est envoyé nulle part. Il est compté à sa façon, il ne correspond donc pas forcément à la somme de ce que vous voyez sur chaque page.

## Escudos del sitio

escudos-ayuda-sitio-titulo = Boucliers du site
escudos-ayuda-sitio-que = Le grand interrupteur en haut du panneau lève ou baisse les Boucliers seulement pour le site affiché. Quand vous les baissez, la page se recharge sans blocage et sans la protection contre l’empreinte numérique, et le bouton apparaît barré.
escudos-ayuda-sitio-recuerda = { -brand-short-name } s’en souvient pour la prochaine fois. Si vous le faites dans une fenêtre de navigation privée, c’est oublié à sa fermeture.
escudos-ayuda-sitio-cuando = Quand un site de confiance ne fonctionne pas bien : une vidéo qui ne démarre pas, un paiement qui n’aboutit pas ou une connexion qui revient sans cesse au même écran.
escudos-ayuda-sitio-falla = Avec les Boucliers baissés, ce site recharge ce qui était bloqué et peut de nouveau vous suivre. Si les baisser ne règle rien, le problème venait d’ailleurs : relevez-les.

## Rastreadores y anuncios: Normal o Estricto

escudos-ayuda-nivel-titulo = Traqueurs et publicités
escudos-ayuda-nivel-que = Choisissez ce que les Boucliers bloquent sur tous les sites. { -brand-short-name } est réglé sur Strict+ par défaut. Le niveau se choisit aussi dans Paramètres › Boucliers.
escudos-ayuda-nivel-normal = <strong>Normal</strong> bloque, dans toutes les fenêtres, les publicités des listes de filtres, le contenu qui piste de la liste de base (publicités et compteurs d’entreprises qui pistent), les mineurs de cryptomonnaies et les collecteurs d’empreinte connus, ainsi que les cookies qui vous suivent d’un site à l’autre, y compris ceux des réseaux sociaux ; leurs boutons et vidéos intégrés se chargent quand même.
escudos-ayuda-nivel-estricto = <strong>Strict</strong> utilise aussi la liste complète du contenu qui piste, bloque également les boutons et publications intégrés des réseaux sociaux, et retire des liens les données ajoutées pour vous suivre. Certains sites peuvent mal fonctionner.
escudos-ayuda-nivel-personalizado = Si vous modifiez une option isolée, comme les cookies tiers, le niveau passe à <strong>Personnalisé</strong>. Pour revenir, choisissez Normal, Strict ou Strict+.
escudos-ayuda-nivel-recarga = Quand vous changez de niveau, la page se recharge.
escudos-ayuda-nivel-cuando = Gardez Strict+ si tout fonctionne. Si beaucoup de vos sites ne marchent plus, essayez Normal ; si un seul pose problème, baissez plutôt les Boucliers sur ce site.
escudos-ayuda-nivel-falla = En Strict, il peut manquer une vidéo ou une carte intégrée, les commentaires ou un bouton « Se connecter avec… ». Baissez les Boucliers sur ce site et il se rechargera en entier.

## Lo bloqueado en esta página

escudos-ayuda-lista-titulo = Bloqué sur cette page
escudos-ayuda-lista-que = Cette ligne du panneau montre les sites bloqués sur la page, par groupes : traqueurs et publicités, traqueurs de réseaux sociaux, empreinte numérique et mineurs de cryptomonnaies. Vous voyez ainsi qui essayait de vous suivre.
escudos-ayuda-lista-listas = Ce qui est bloqué dépend de la protection contre le pistage du navigateur (avec les listes de Disconnect) et du bloqueur propre aux Boucliers (avec les listes de filtres). Le bouton « Listes de filtres » ouvre Paramètres › Boucliers.
escudos-ayuda-lista-falla = Si la liste contient quelque chose dont le site a besoin, comme son service de paiement ou de vidéo, baissez les Boucliers sur ce site.

## Pasar conexiones a HTTPS

escudos-ayuda-https-titulo = Passer les connexions en HTTPS
escudos-ayuda-https-que = Avec le mode HTTPS uniquement, { -brand-short-name } ouvre toujours la version chiffrée de chaque site. Ainsi, personne sur votre réseau (le Wi-Fi d’un café, votre fournisseur d’accès) ne peut lire ni modifier ce que vous voyez. Il est activé sur tous les sites.
escudos-ayuda-https-sitio = L’interrupteur du panneau crée une exception pour le site affiché : il pourra s’ouvrir sans chiffrement. Si le mode HTTPS uniquement est désactivé dans les Paramètres, la ligne apparaît grisée.
escudos-ayuda-https-cuando = Presque jamais. Seulement pour un site de confiance sans version chiffrée, comme la page de configuration de votre box.
escudos-ayuda-https-falla = Si un site n’a pas de version chiffrée, { -brand-short-name } vous prévient avant de l’ouvrir, et depuis cet avertissement vous pouvez continuer sans chiffrement. Sans chiffrement, ce que vous saisissez sur ce site circule en clair.

## Bloquear scripts

escudos-ayuda-scripts-titulo = Bloquer les scripts
escudos-ayuda-scripts-que = Bloquer les scripts (les programmes qu’apporte chaque site) sur un site n’est pas encore disponible. Le navigateur n’a pas encore de moyen fiable de le faire site par site, et { -brand-short-name } n’affiche pas un interrupteur qui ne fonctionne pas. Cela arrivera avec le bloqueur propre aux Boucliers.

## Huella digital

escudos-ayuda-huella-titulo = Empreinte numérique
escudos-ayuda-huella-que = Un site peut vous reconnaître sans cookies en combinant ce qu’il lit de votre navigateur : la taille de l’écran, les polices, la carte graphique, le fuseau horaire, la langue… Cette combinaison, c’est votre empreinte numérique. { -brand-short-name } masque une partie de ces données ou montre les mêmes à tous les sites.
escudos-ayuda-huella-donde = Elle se choisit dans le panneau, à la ligne « Empreinte numérique », ou dans Paramètres › Vie privée. Elle s’applique à tous les sites, en fenêtre normale comme privée. Si vous la changez depuis le panneau, la page se recharge.
escudos-ayuda-huella-niveles = Les quatre niveaux
escudos-ayuda-huella-basica = <strong>Basique.</strong> La protection intégrée au navigateur : elle modifie légèrement ce qu’un site lit de ses dessins (le canvas), ne lui montre que les polices du système et uniformise certains calculs.
escudos-ayuda-huella-equilibrada = <strong>Équilibrée</strong> (par défaut). Elle masque aussi la carte graphique, les capteurs, le type de connexion, des détails sur l’audio et la couleur de l’écran, et d’autres données dont les sites ordinaires n’ont pas besoin. Elle ne casse rien d’habituel : connexion, vidéo, cartes, documents et visioconférences continuent de fonctionner.
escudos-ayuda-huella-estricta = <strong>Stricte.</strong> Elle masque aussi la position de la fenêtre et de la souris à l’écran et les barres de la fenêtre, les polices (seulement celles du système par défaut), les voix de lecture et les capacités de la carte graphique. La taille de l’écran, l’audio, les cœurs du processeur et le canvas restent comme en Équilibrée : les modifier vous rendait plus facile à reconnaître. Certains sites peuvent mal fonctionner : certaines cartes ou jeux en 3D ne démarrent pas, la lecture à voix haute de certains sites n’a plus de voix et les écrans tactiles peuvent recevoir la version pour souris.
escudos-ayuda-huella-caja = <strong>Coffre-fort.</strong> Il masque presque tout ce qu’il sait masquer : pas le thème sombre ou clair, ni la taille de l’écran (la masquer vous rendait plus facile à reconnaître). Les sites voient l’heure UTC, l’anglais, 60 images par seconde et un clavier américain, et ne voient pas vos réglages d’accessibilité (contraste élevé, réduire les animations…). Pour lire un canvas, le site doit vous demander l’autorisation. Des repères aux coins du site rappellent qu’il est activé. Beaucoup de sites ne fonctionneront pas.
escudos-ayuda-caja-titulo = Le Coffre-fort et l’autorisation par site
escudos-ayuda-caja-aviso = Si un site essaie de relever votre empreinte d’une manière connue, un avertissement s’affiche à côté du bouton des Boucliers : « Continuer à bloquer » ou « Autoriser sur ce site ». Il apparaît une fois par site et par session. Il ne reconnaît pas toutes les tentatives : les autres sont bloquées quand même, mais sans avertissement.
escudos-ayuda-caja-permiso = « Autoriser sur ce site », dans l’avertissement ou dans le panneau, place ce site en Équilibrée ; les autres restent dans le Coffre-fort. C’est enregistré comme une autorisation du site, que vous pouvez retirer dans Paramètres › Vie privée, sous « Sites autorisés dans le Coffre-fort », ou en effaçant les données de ce site.
escudos-ayuda-caja-limites = Elle ne peut pas être donnée depuis une fenêtre privée, car elle resterait enregistrée, mais les autorisations que vous avez déjà s’y appliquent aussi. Elle ne peut pas non plus être donnée aux adresses numériques (IP), à « localhost » ni à certains domaines peu courants. La langue, les 60 images par seconde et les couleurs du système valent pour tout le navigateur et ne changent pas avec l’autorisation.
escudos-ayuda-caja-salir = Quand vous quittez le Coffre-fort, vos langues redeviennent celles d’avant.
escudos-ayuda-ven-titulo = Ce que les sites voient toujours
escudos-ayuda-ven-ip = Votre adresse IP et, avec elle, votre pays et votre ville approximative. Pour la masquer, il faut Tor ou un proxy.
escudos-ayuda-ven-navegador = Le navigateur et le système que vous utilisez, de façon générique : la même information que des millions de personnes. Il n’indique jamais { -brand-short-name }.
escudos-ayuda-ven-resto = Votre langue et votre fuseau horaire, sauf dans le Coffre-fort ; la taille de la fenêtre et si vous utilisez un thème sombre ou clair, toujours.
escudos-ayuda-ven-ocultar = Que vous masquez des choses : peu de gens naviguent ainsi, et cela vous distingue aussi. C’est pareil avec d’autres navigateurs privés.
escudos-ayuda-ven-bajados = Si vous baissez les Boucliers sur un site, ce site n’a plus de protection contre l’empreinte numérique.
escudos-ayuda-huella-cuando = Équilibrée convient à presque tout. Stricte, si vous acceptez que certains sites ne marchent pas. Le Coffre-fort, pour les moments où vous voulez laisser le moins de traces possible.
escudos-ayuda-huella-falla = Si un site ne marche pas en Stricte ou dans le Coffre-fort, baissez les Boucliers sur ce site ou, dans le Coffre-fort, utilisez « Autoriser sur ce site ». Si beaucoup ne marchent pas, revenez à Équilibrée.

## Cookies de terceros

escudos-ayuda-cookies-titulo = Cookies tiers
escudos-ayuda-cookies-que = Les cookies sont des données qu’un site enregistre dans votre navigateur pour se souvenir de vous. Les cookies tiers appartiennent à d’autres entreprises présentes dans le site que vous visitez, et servent surtout à vous suivre d’un site à l’autre. Cette option s’applique à tous les sites.
escudos-ayuda-cookies-rastreo = <strong>Bloquer le pistage</strong> (par défaut) bloque les cookies des traqueurs connus et range les autres à part pour chaque site, comme dans un tiroir séparé. Ainsi, une entreprise ne peut pas relier ce que vous faites sur deux sites différents.
escudos-ayuda-cookies-todas = <strong>Tout bloquer</strong> ne laisse entrer aucun cookie tiers.
escudos-ayuda-cookies-cuando = « Bloquer le pistage » protège presque autant et casse beaucoup moins. Choisissez « Tout bloquer » seulement si vous voulez le maximum et acceptez que certaines choses ne marchent pas.
escudos-ayuda-cookies-falla = Avec « Tout bloquer », les boutons « Se connecter avec… », les paiements, les commentaires et les vidéos intégrées peuvent ne plus marcher : revenez à « Bloquer le pistage ». Si vous changez cette option, le niveau des Boucliers passe à Personnalisé.

## Olvidar este sitio al cerrar

escudos-ayuda-olvidar-titulo = Oublier ce site à la fermeture
escudos-ayuda-olvidar-que = Efface les cookies et les données enregistrés par le site affiché chaque fois que vous fermez { -brand-short-name }. Cela ne concerne que ce site : les autres ne sont pas touchés. Ce n’est pas la même chose que « Oublier ce site » dans l’historique, qui efface tout immédiatement.
escudos-ayuda-olvidar-privada = Dans une fenêtre privée, l’option est désactivée : une fenêtre privée oublie déjà tout à sa fermeture.
escudos-ayuda-olvidar-cuando = Pour les sites que vous utilisez de temps en temps et qui ne doivent pas se souvenir de vous : boutiques, journaux ou comparateurs de vols.
escudos-ayuda-olvidar-falla = Vous devrez vous reconnecter à chaque fois, et le site aura oublié vos préférences, comme la langue, le panier ou votre réponse à la bannière de cookies. Si cela vous gêne, désactivez l’option pour ce site.

## Oscurecer este sitio

escudos-ayuda-oscuro-titulo = Assombrir ce site
escudos-ayuda-oscuro-que = Cette ligne n’apparaît que si vous avez activé « Sites en mode sombre » dans Paramètres › Apparence. Désactivez-la pour que le site affiché garde ses couleurs. Le changement est immédiat, sans rechargement.
escudos-ayuda-oscuro-falla = L’assombrissement automatique se trompe parfois : un logo invisible ou un texte peu contrasté. Désactivez-le sur ce site. Sachez qu’un site peut remarquer que son apparence a été modifiée.

## Google limpio

escudos-ayuda-google-titulo = Google propre
escudos-ayuda-google-que = Sur les sites de Google et de YouTube, { -brand-short-name } coupe leurs données d’utilisation et leurs publicités, retire des recherches les données de pistage et fait pointer les liens des résultats directement vers le site, sans passer par Google. Ce qu’il coupe s’ajoute au compteur.
escudos-ayuda-google-busqueda = Les recherches Google lancées depuis la barre d’adresse demandent uniquement des résultats web, sans réponses d’IA ni modules. Dans Google, vous pouvez revenir à « Tous ».
escudos-ayuda-google-pasa = Ce qui est nécessaire passe volontairement : la connexion, les captchas, Gmail, Drive, Maps, la lecture YouTube et son historique.
escudos-ayuda-google-limites-titulo = Ce qu’il ne fait pas
escudos-ayuda-google-limites = Si vous baissez les Boucliers sur un site de Google, il cesse d’y agir. Vous pouvez le désactiver dans Paramètres › Vie privée › Google. Google voit toujours votre IP et ce que vous cherchez, et si vous vous connectez, il sait qui vous êtes sur ses services. Les publicités intégrées à la page, comme les résultats sponsorisés ou les publicités vidéo de YouTube, ne sont pas encore retirées.

## Lo que los Escudos no hacen

escudos-ayuda-limites-titulo = Ce que les Boucliers ne font pas
escudos-ayuda-limites-ip = <strong>Ils ne masquent pas votre adresse IP.</strong> Tous les sites que vous visitez la voient et savent ainsi à peu près où vous êtes. Pour la masquer, il faut Tor ou un proxy.
escudos-ayuda-limites-detectable = <strong>Ils ne sont pas invisibles.</strong> Un site peut remarquer que vous bloquez des choses ou masquez des données, et certains vous le diront. Aucun bloqueur ne l’empêche à 100 %.
escudos-ayuda-limites-tor = <strong>{ -brand-short-name } n’est pas Tor Browser.</strong> Tor Browser fait que tous ses utilisateurs ressemblent au même navigateur et masque l’IP. { -brand-short-name } réduit ce qu’un site peut savoir de vous, mais un site déterminé peut encore vous distinguer.
escudos-ayuda-limites-cuenta = <strong>Ils ne vous cachent pas du site sur lequel vous vous connectez.</strong> Si vous vous connectez à votre compte, ce site sait qui vous êtes. Les Boucliers l’empêchent de vous suivre sur d’autres sites.

## Lo que viene

escudos-ayuda-pronto-titulo = À venir
escudos-ayuda-pronto-que = Cette page ne décrit que ce qui fonctionne aujourd’hui. Ceci n’existe pas encore :
escudos-ayuda-pronto-motor = Choisir les listes de filtres une par une et ajouter les vôtres.
escudos-ayuda-pronto-scripts = Le blocage des scripts site par site.

## Estricto+, molestias, excepciones por sitio y listas de filtros (los nombres, como en el panel y en Ajustes › Escudos)

escudos-ayuda-nivel-estricto-mas = <strong>Strict+</strong> (par défaut) correspond à Strict avec une liste de pistage plus large, AdGuard Tracking Protection. Il utilise un peu plus de mémoire.
escudos-ayuda-molestias-titulo = Nuisances
escudos-ayuda-molestias-que = En plus des publicités et des traqueurs, les Boucliers masquent trois types de nuisances, chacun avec son interrupteur : <strong>Bandeaux de cookies</strong> (les bannières de consentement), <strong>Pop-ups et bannières</strong> (fenêtres surgissantes, bannières d’installation d’applis et widgets) et <strong>Alertes anti-bloqueur</strong> (celles qui demandent de désactiver le bloqueur). Ils sont activés par défaut.
escudos-ayuda-molestias-donde = On les active et on les désactive pour tous les sites dans les options avancées du panneau ou dans Paramètres › Boucliers. Pour un seul site, utilisez ses exceptions.
escudos-ayuda-molestias-cookies = Masquer un bandeau de cookies ne revient pas toujours à les refuser : si vous ne répondez pas, le site fait ce qu’il fait par défaut, et certains enregistrent des cookies malgré tout.
escudos-ayuda-molestias-falla = Si un site ne vous laisse pas continuer sans répondre à son bandeau, ou si un bouton dont vous avez besoin se trouve dans une fenêtre masquée, ajoutez pour lui une exception de ce groupe. Les alertes anti-bloqueur ne disparaissent pas sur tous les sites : certains détectent le blocage autrement.
escudos-ayuda-excepciones-titulo = Exceptions par site
escudos-ayuda-excepciones-que = Une exception fait que les Boucliers laissent passer quelque chose sur un site précis. Elles se gèrent dans Paramètres › Boucliers › « Exceptions par site » et, depuis le panneau, avec « Exceptions pour ce site… ». Elles valent pour tout le site (exemple.com et ses sous-domaines).
escudos-ayuda-excepciones-todo = <strong>Tout autoriser</strong> revient à baisser les Boucliers avec le grand interrupteur du panneau : rien n’est bloqué. C’est le plus rapide quand un site ne fonctionne pas.
escudos-ayuda-excepciones-grupos = Pour affiner, choisissez quoi autoriser : publicités, traqueurs des listes, bandeaux de cookies, pop-ups et bannières, alertes anti-bloqueur, éléments masqués ou scripts des listes. Le reste reste bloqué.
escudos-ayuda-excepciones-herencia = Si un groupe est désactivé pour tous les sites, l’exception l’affiche comme « Autorisé par un réglage global » et on ne peut pas le modifier à cet endroit : pour le changer, réactivez-le globalement.
escudos-ayuda-excepciones-guardado = Elles sont enregistrées sur votre appareil comme permissions du site. Si vous oubliez le site ou effacez ses données ou l’historique, elles disparaissent avec. Celles que vous créez dans une fenêtre privée durent jusqu’à la fermeture de la dernière fenêtre privée.
escudos-ayuda-excepciones-rastreadores = L’exception des traqueurs ne concerne que les listes de filtres : la protection contre le pistage du navigateur reste active. Pour la retirer aussi, utilisez « Tout autoriser ».
escudos-ayuda-listas-titulo = Listes de filtres
escudos-ayuda-listas-que = Ce que bloque le bloqueur propre aux Boucliers est décidé par les listes de filtres de leurs auteurs : uBlock Origin, EasyList, AdGuard et Brave. Le niveau et les nuisances choisissent celles qui sont utilisées, plus celles de la langue d’{ -brand-short-name }.
escudos-ayuda-listas-copia = { -brand-short-name } est fourni avec une copie des listes : il bloque dès le premier instant, sans se connecter à quoi que ce soit.
escudos-ayuda-listas-actualizar = Si vous autorisez « Listes de protection » dans Connexions, les listes se renouvellent seules : une vérification par jour, et chaque liste n’est demandée à son auteur qu’à son expiration, sans cookies et sans dire quels sites vous visitez. Si une nouvelle liste arrive abîmée, la précédente est conservée. Dans Paramètres › Boucliers, vous pouvez désactiver cela, choisir leur fréquence de renouvellement ou les demander tout de suite.
