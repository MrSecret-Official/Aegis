# Glosario de traducción de Aegis

Términos acordados para los textos de Aegis: el navegador (`locales/<idioma>/aegis.ftl`), los temas
(`overlay/browser/themes/addons/aegis-*/_locales/`) y el instalador (`packaging/instalador/`, origen en inglés con
`@tr` en `ui/*.slint` y traducciones en `traducciones/<idioma>/LC_MESSAGES/aegis-setup.po`). El español de España es la referencia de
redacción y el inglés, el origen técnico. Lo que ya existe en Firefox usa la terminología de Firefox en cada idioma;
lo propio de Aegis, la de esta tabla. Un término nuevo se apunta aquí la primera vez que aparece.

## Términos propios de Aegis

| es-ES | en-US | pt-BR | fr | de | it | Nota |
|---|---|---|---|---|---|---|
| modo | mode | modo | mode | Modus | modalità | Las dos formas de usar Aegis (Estándar y Workflow). No «diseño» ni «layout»: en los documentos y en la interfaz son siempre «modos». |
| Estándar | Standard | Padrão | Standard | Standard | Standard | Nombre de modo: se traduce (es palabra corriente). Mayúscula inicial al nombrarlo. pt-BR «Padrão», como el nivel estándar de la protección contra rastreo en Firefox. |
| Workflow | Workflow | Workflow | Workflow | Workflow | Workflow | Nombre propio del modo: **no se traduce** en ningún idioma, siempre con mayúscula inicial. Es la marca del modo al estilo Zen; «Flujo de trabajo» o equivalentes serían largos para la barra y menos reconocibles. En alemán, compuesto con guion: «Workflow-Modus». |
| Escudos | Shields | Escudos | Boucliers | Schilde | Scudi | El bloqueador de Aegis (anuncios y rastreadores). Nombre de la función: mayúscula inicial («los Escudos»); en las etiquetas de sección, en mayúsculas. |
| Inicio de Aegis | Aegis Home | Início do Aegis | Accueil de Aegis | Aegis-Startseite | Pagina iniziale di Aegis | La nueva pestaña y la página de inicio de Aegis (el «Firefox Home» de Firefox, con su misma forma en cada idioma). Siempre `{ -brand-short-name }`. es «Personalizar Inicio de Aegis», de «Aegis-Startseite anpassen». |
| General | General | Geral | Général | Allgemein | Generale | Categoría de Ajustes que sustituye a «Cuenta y sincronización». |
| énfasis | accent | destaque | couleur d’accent | Akzentfarbe | colore d’accento | Color de la selección, el foco, los interruptores, el borde de la pestaña activa y el degradado del marco. Como opción de fondo, corto: fr «Accent», de «Akzent», it «Accento». |
| webs en oscuro | dark websites | sites em modo escuro | sites en mode sombre | dunkle Websites | siti in modalità scura | Oscurecer las webs con el tema oscuro de Aegis. Opciones: Apagado / Todas las webs / Solo las que no tienen modo oscuro. En el panel de Escudos: «Oscurecer este sitio» (pt-BR «Escurecer», fr «Assombrir», de «abdunkeln», it «Scurisci»). pt-BR nunca «no escuro» (es «a oscuras»). |
| modo oscuro (de una web) | dark mode | modo escuro | mode sombre | Dunkelmodus | modalità scura | El que trae la propia web; distinto del tema oscuro de Aegis. |
| Escudos activos / bajados | Shields up / down | Escudos ativos / desativados | Boucliers activés / baissés | Schilde aktiv / deaktiviert | Scudi attivi / abbassati | Estado de los Escudos en un sitio. El verbo va a juego: es «bajar los Escudos», pt-BR «desativar», fr «baisser», de «deaktivieren», it «abbassare». |
| Normal / Estricto | Normal / Strict | Normal / Rigoroso | Normal / Strict | Normal / Streng | Normale / Rigoroso | Niveles de los Escudos. pt-BR y de, como los niveles de protección contra rastreo de Firefox. |
| Estricto+ | Strict+ | Rigoroso+ | Strict+ | Streng+ | Rigoroso+ | Nivel de los Escudos por encima de Estricto (añade AdGuard Tracking Protection). El «+» pegado, sin espacio; misma forma que el nivel base en cada idioma. |
| Anuncios (listas de filtros) | Ads (filter lists) | Anúncios (listas de filtros) | Publicités (listes de filtres) | Werbung (Filterlisten) | Pubblicità (liste di filtri) | Categoría de los Escudos que bloquea con uBlock Origin, EasyList, AdGuard y Brave; distinta de «Rastreadores y anuncios» (listas de rastreo). «Listas de filtros» es el nombre de las listas de autores. |
| Listas de protección | Protection lists | Listas de proteção | Listes de protection | Schutzlisten | Elenchi di protezione | Grupo de about:conexiones: rastreo (Remote Settings) y filtros de los Escudos. it «elenchi», como los «elenchi» de Firefox. |
| icono de la app | app icon | ícone do aplicativo | icône de l’application | App-Symbol | icona dell’app | Ajustes › Apariencia (Windows). |
| Fantasma | Ghost | Fantasma | Fantôme | Geist | Fantasma | Nombre de un icono de la app; mayúscula inicial como opción. En la descripción, minúscula: «el fantasma con el hueco de la cerradura». |
| Uróboros | Ouroboros | Ouroboros | Ouroboros | Ouroboros | Uroboro | Nombre del otro icono. Forma usual de cada idioma (es con tilde, it «Uroboro»). |
| hueco de la cerradura (icono) | keyhole | buraco da fechadura | trou de serrure | Schlüsselloch | buco della serratura | La boca del fantasma de las ventanas privadas: el hueco de una cerradura (el ojo por donde entra la llave), no un candado. |
| espacios | spaces | espaços | espaces | Bereiche | spazi | Grupos de pestañas del modo Workflow (cada uno con su contenedor y su proxy). Minúscula: es nombre común. de «Bereiche», no «Spaces» ni «Arbeitsbereiche» (más largo). |
| Cómo funcionan los Escudos | How Shields work | Como funcionam os Escudos | Comment fonctionnent les Boucliers | So funktionieren die Schilde | Come funzionano gli Scudi | Página de ayuda about:escudos (escudos-ayuda.ftl) y enlace del pie del panel. Los enlaces de Ajustes que llevan a ella: «Más información» (en «Learn more», como los de Firefox). |
| Google limpio | Clean Google | Google limpo | Google propre | Sauberes Google | Google pulito | Lo que hace google.sys.mjs en Google y YouTube (Ajustes › Privacidad › Google). Nombre de la función: se traduce. «Google» y «YouTube» no se traducen. |
| código de transferencia | transfer code | código de transferência | code de transfert | Übertragungscode | codice di trasferimento | El código de 6 palabras con el que las contraseñas pasan de un Aegis a otro (fase 2, docs/PLAN.md). Minúscula: nombre común. Sale en la página de las contraseñas del asistente de importar. |
| Pasar a otro Aegis / Recibir de otro Aegis | Move to another Aegis / Receive from another Aegis | Transferir para outro Aegis / Receber de outro Aegis | Transférer vers un autre Aegis / Recevoir d’un autre Aegis | An ein anderes Aegis übertragen / Von einem anderen Aegis empfangen | Trasferisci a un altro Aegis / Ricevi da un altro Aegis | Las dos filas de Ajustes › Contraseñas y autorrelleno y los títulos de sus diálogos (siempre con `{ -brand-short-name }`). El verbo de cada idioma, el mismo en todos los textos de la transferencia: es «pasar», en «move», pt-BR «transferir», fr «transférer», de «übertragen», it «trasferire». |
| Transferencia de contraseñas | Password transfer | Transferência de senhas | Transfert des mots de passe | Passwortübertragung | Trasferimento delle password | Etiqueta de la sección de Ajustes (en mayúsculas, como las demás etiquetas). |
| archivo (de la transferencia) | file | arquivo | fichier | Datei | file | Lo que se crea y se abre: siempre «el archivo», nunca «paquete», «vault», «cofre», «coffre», «Tresor» ni «cassaforte» (la extensión `.aegisvault` no sale en los textos; «Caja fuerte» es un nivel de la huella digital). |
| código de 6 palabras | 6-word code | código de 6 palavras | code de 6 mots | Code aus 6 Wörtern | codice di 6 parole | La forma corta de «código de transferencia» en los diálogos. Las palabras son siempre las de la lista del EFF en inglés: no se traducen. |
| navegador de origen (importar) | source browser | navegador de origem | navigateur source | Quellbrowser | browser di origine | El navegador del que se importa en Ajustes › Importar datos. Sus nombres son marcas (Brave, Microsoft Edge, Firefox): no se traducen. «Firefox» solo puede salir en los ids `aegis-migracion-navegador-firefox*` (verificar.py). Los nombres de los menús de Brave y Edge, como los dice cada navegador en ese idioma. |

Cómo se nombra un modo: «el modo Estándar», «los modos Estándar y Workflow» (en «mode Standard», «modo Padrão»,
«Standard-Modus», «modalità Standard»).

### Énfasis: nombres de las opciones

Se traducen (son colores corrientes). En Ajustes van bajo una muestra de unos 90 px: nada de palabras largas sin
guion ni espacio (de «Desktop-Hintergrund», no «Desktophintergrund»).

| es-ES | en-US | pt-BR | fr | de | it |
|---|---|---|---|---|---|
| Monocromo | Monochrome | Monocromático | Monochrome | Monochrom | Monocromo |
| Color de Windows | Windows color | Cor do Windows | Couleur de Windows | Windows-Farbe | Colore di Windows |
| Fondo de escritorio | Desktop background | Plano de fundo | Arrière-plan du bureau | Desktop-Hintergrund | Sfondo del desktop |
| Hielo | Ice | Gelo | Glace | Eis | Ghiaccio |
| Pizarra | Slate | Ardósia | Ardoise | Schiefer | Ardesia |
| Salvia | Sage | Sálvia | Sauge | Salbei | Salvia |
| Ámbar | Amber | Âmbar | Ambre | Bernstein | Ambra |
| Coral | Coral | Coral | Corail | Koralle | Corallo |
| Lavanda | Lavender | Lavanda | Lavande | Lavendel | Lavanda |
| Malva | Mauve | Malva | Mauve | Malve | Malva |

### Huella digital: niveles

Ajustes › Privacidad y el desplegable «Huella digital» del panel de Escudos. Nombres de opción: mayúscula inicial y
en femenino donde el idioma lo pida (es «la protección»). El primero es «lo que trae el navegador»: nunca se llama
como el navegador del que parte (marca registrada). «Caja fuerte» va con el uróboros y es nombre propio del nivel:
«en Caja fuerte», «Caja fuerte se los ha ocultado» (sin artículo en es e it; con artículo en pt-BR, fr y de).

| es-ES | en-US | pt-BR | fr | de | it |
|---|---|---|---|---|---|
| Básica | Basic | Básica | Basique | Einfach | Base |
| Equilibrada | Balanced | Equilibrada | Équilibrée | Ausgewogen | Bilanciata |
| Estricta | Strict | Rigorosa | Stricte | Streng | Rigorosa |
| Caja fuerte | Vault | Cofre | Coffre-fort | Tresor | Cassaforte |
| datos del navegador | browser data | dados do navegador | données du navigateur | Browserdaten | dati del browser |
| Permitir en este sitio | Allow on this site | Permitir neste site | Autoriser sur ce site | Auf dieser Website erlauben | Consenti su questo sito |

- En el aviso de Caja fuerte, `<>` es el nombre del sitio (lo pone el navegador en negrita): se deja tal cual.
- «Tor Browser» no se traduce.

### Tor

Menú ☰, Ajustes › Privacidad › Tor, el indicador de la barra y la página de navegación privada de la instancia con
Tor. «Tor», «Tor Browser», «Tor Project», «obfs4» y «Snowflake» son nombres de otro proyecto: no se traducen. La entrada
del menú sigue el nombre que Firefox da a «Nueva ventana privada» en cada idioma (it: «finestra anonima»).

| es-ES | en-US | pt-BR | fr | de | it |
|---|---|---|---|---|---|
| Nueva ventana privada con Tor | New private window with Tor | Nova janela privativa com Tor | Nouvelle fenêtre privée avec Tor | Neues privates Fenster mit Tor | Nuova finestra anonima con Tor |
| ventana con Tor | Tor window | janela com Tor | fenêtre avec Tor | Tor-Fenster | finestra con Tor |
| puentes | bridges | pontes | ponts | Brücken | bridge |
| Nueva identidad | New identity | Nova identidade | Nouvelle identité | Neue Identität | Nuova identità |
| circuitos | circuits | circuitos | circuits | Verbindungen | circuiti |
| huella sha256 (de un archivo) | sha256 fingerprint | impressão digital sha256 | empreinte sha256 | sha256-Fingerabdruck | impronta sha256 |
| paquete | package | pacote | paquet | Paket | pacchetto |

- «Huella» tiene aquí dos sentidos: la huella digital del navegador (Caja fuerte) y la huella sha256 de un archivo.
  En es se distinguen por el contexto («su huella sha256»); en los demás idiomas, con palabras distintas si hace
  falta.
- Atajo: es «Ctrl+Mayús.+U» (con punto, como `platformKeys.properties`), en-US y pt-BR «Ctrl+Shift+U», fr «Ctrl+Maj+U»,
  de «Strg+Umschalt+U», it «Ctrl+Maiusc+U».
- de: «Verbindungen» por «circuitos», más claro para todo el mundo que «Schaltkreise».

### Escudos: molestias, excepciones y contador

Panel de Escudos (opciones avanzadas), Ajustes › Escudos (categoría propia) y about:escudos. Los nombres de los grupos
son los mismos en los tres sitios (`aegis-escudos-grupo-*`). En una excepción, un interruptor encendido es «permitido en
ese sitio».

| es-ES | en-US | pt-BR | fr | de | it | Nota |
|---|---|---|---|---|---|---|
| molestias | annoyances | incômodos | nuisances | Belästigungen | elementi fastidiosi | Los tres grupos de abajo, con un interruptor general cada uno. |
| Avisos de cookies | Cookie notices | Avisos de cookies | Bandeaux de cookies | Cookie-Hinweise | Avvisi sui cookie | Banners de consentimiento. Distinto de «Cookies de terceros». |
| Ventanas y banners | Pop-ups and banners | Pop-ups e banners | Pop-ups et bannières | Pop-ups und Banner | Pop-up e banner | Ventanas emergentes, banners de apps y widgets. |
| Avisos anti-bloqueador | Anti-adblock notices | Avisos antibloqueador | Alertes anti-bloqueur | Anti-Adblock-Hinweise | Avvisi anti-adblock | Los que piden desactivar el bloqueador. |
| Elementos ocultos | Hidden elements | Elementos ocultos | Éléments masqués | Ausgeblendete Elemente | Elementi nascosti | El filtrado cosmético (lo que las listas esconden en la página). |
| Scripts de las listas | List scripts | Scripts das listas | Scripts des listes | Skripte der Listen | Script delle liste | Los scriptlets. Nunca «scriptlets» en la interfaz. |
| Excepciones por sitio | Site exceptions | Exceções por site | Exceptions par site | Ausnahmen pro Website | Eccezioni per sito | Sección de Ajustes › Escudos. En el panel: «Excepciones de este sitio…». |
| Permitir todo (en este sitio) | Allow everything (on this site) | Permitir tudo (neste site) | Tout autoriser (sur ce site) | (Auf dieser Website) alles erlauben | Consenti tutto (su questo sito) | Es la excepción «Escudos bajados»: el interruptor grande del panel. |
| Permitido por ajuste general | Allowed by a global setting | Permitido por um ajuste geral | Autorisé par un réglage global | Durch eine allgemeine Einstellung erlaubt | Consentito da un’impostazione generale | Herencia: el grupo está apagado para todos los sitios. |
| Contador: Peticiones / Orígenes | Counter: Requests / Origins | Contador: Requisições / Origens | Compteur : Requêtes / Origines | Zähler: Anfragen / Ursprünge | Contatore: Richieste / Origini | Qué cuenta el número del botón de Escudos (de serie, peticiones). |
| Nivel | Level | Nível | Niveau | Stufe | Livello | Normal, Estricto, Estricto+ (este con «(recomendado)» en Ajustes). |

## Términos de Firefox usados en Aegis

| es-ES | en-US | pt-BR | fr | de | it |
|---|---|---|---|---|---|
| barra de herramientas | toolbar | barra de ferramentas | barre d’outils | Symbolleiste | barra degli strumenti |
| barra lateral | sidebar | painel lateral | barre latérale | Sidebar | barra laterale |
| pestaña | tab | aba | onglet | Tab | scheda |
| pestañas verticales | vertical tabs | abas verticais | onglets verticaux | vertikale Tabs | schede verticali |
| marcador(es) | bookmark(s) | favorito(s) | marque-page(s) | Lesezeichen | segnalibro/i |
| administrar (marcadores) | manage | gerenciar | gérer | verwalten | gestire |
| Biblioteca (ventana) | Library | Biblioteca | Bibliothèque | Bibliothek | Libreria |
| carpeta | folder | pasta | dossier | Ordner | cartella |
| accesos (nueva pestaña) | shortcuts | atalhos | raccourcis | Verknüpfungen | scorciatoie |
| ventana privada | private window | janela privativa | fenêtre de navigation privée | privates Fenster | finestra anonima |
| Ajustes | Settings | Configurações | Paramètres | Einstellungen | Impostazioni |
| navegador predeterminado | default browser | navegador padrão | navigateur par défaut | Standardbrowser | browser predefinito |
| tema | theme | tema | thème | Theme | tema |
| Complementos | Add-ons | Extensões | Modules complémentaires | Add-ons | Componenti aggiuntivi |
| barra de marcadores | bookmarks toolbar | barra de favoritos | barre personnelle | Lesezeichen-Symbolleiste | barra dei segnalibri |
| buscador | search engine | mecanismo de pesquisa | moteur de recherche | Suchmaschine | motore di ricerca |
| rastreadores | trackers | rastreadores | traqueurs | Tracker | traccianti |
| modo solo HTTPS | HTTPS-Only Mode | modo somente HTTPS | mode HTTPS uniquement | Nur-HTTPS-Modus | modalità solo HTTPS |
| Solo HTTPS (en este sitio) | HTTPS-Only (on this site) | Somente HTTPS | HTTPS uniquement | Nur HTTPS | Solo HTTPS |
| cookies de terceros | third-party cookies | cookies de terceiros | cookies tiers | Drittanbieter-Cookies | cookie di terze parti |
| huella digital | fingerprinting | impressão digital | empreinte numérique | Fingerprinting | impronta digitale |
| criptomineros | cryptominers | criptomineradores | mineurs de cryptomonnaies | Krypto-Miner | cryptominer |
| rastreadores de redes sociales | social media trackers | rastreadores de redes sociais | traqueurs de réseaux sociaux | Social-Media-Tracker | traccianti dei social media |
| listas de filtros | filter lists | listas de filtros | listes de filtres | Filterlisten | liste di filtri |
| contraseña principal | primary password | senha principal | mot de passe principal | Hauptpasswort | password principale | Término de Firefox (Primary Password): el mismo en todo el navegador. Es opcional para guardar contraseñas (Aegis la recomienda); es obligatoria para pasarlas, recibirlas y añadir códigos de verificación. |
| bóveda (de contraseñas) | saved passwords | senhas salvas | mots de passe enregistrés | gespeicherte Passwörter | password salvate | Lo que se cierra y pide la contraseña principal. Solo es «bóveda» en es: en los demás idiomas **no** se usa vault, cofre, coffre, Tresor ni cassaforte, que son el nivel «Caja fuerte» de la huella digital; se dice «las contraseñas guardadas» y «bloquear» (lock, bloquear, verrouiller, sperren, bloccare). |
| fortaleza (de una contraseña) | strength | força | robustesse | Stärke | sicurezza | Medidor del diálogo de la contraseña principal: «Fortaleza: aceptable / fuerte / muy fuerte». Como el medidor de calidad de Firefox en cada idioma; it «sicurezza» (buona, ottima). |
| código de verificación | verification code | código de verificação | code de vérification | Bestätigungscode | codice di verifica | El de 6 u 8 cifras de la verificación en dos pasos (TOTP) que calcula Aegis. No «código OTP» ni «token». |
| clave de configuración | setup key | chave de configuração | clé de configuration | Einrichtungsschlüssel | chiave di configurazione | El texto en base32 que da la web para configurar una app de autenticación (lo que hay dentro del QR). |
| app de autenticación | authenticator app | app autenticador | application d’authentification | Authenticator-App | app di autenticazione | Como lo llaman las webs. |
| passkey | passkey | chave de acesso | clé d’accès | Passkey | passkey | es y en: «passkey» (es lo que el usuario busca), con «claves de acceso» entre paréntesis la primera vez, como Windows. pt-BR y fr, el nombre de Windows en su idioma. |
| extensiones | extensions | extensões | extensions | Erweiterungen | estensioni | Lo que se instala. «Complementos» es la sección de about:addons (que incluye temas), así que el panel vacío del puzle y su botón dicen «extensiones». |
| panel (de los Escudos) | panel | painel | panneau | Panel | pannello | El que se abre desde el anillo de la barra de direcciones. de «Panel», nunca «Bereich» (ya es «espacios»). En la ayuda, la «tarjeta» del panel es solo «el panel» (fr «carte» y it «scheda» chocan con mapas y pestañas). |
| logo de la web | site’s logo | logotipo do site | logo du site | Logo der Website | logo del sito | Imagen de un acceso de la nueva pestaña (Añadir o editar un acceso). |
| mecanismo de pesquisa (pt-BR) | search engine | mecanismo de pesquisa | moteur de recherche | Suchmaschine | motore di ricerca | Ya está arriba como «buscador»; en pt-BR siempre «mecanismo de pesquisa», no «buscador». |

Notas:
- «Vista compacta» (marcadores: filas más bajas) no es el «Modo compacto» de Workflow (pendiente, abajo): no se
  mezclan. en «Compact view», pt-BR «Visualização compacta», fr «Affichage compact», de «Kompakte Ansicht», it
  «Vista compatta».
- Grupos de Ajustes: Personal / Navegación / Privacidad / Sistema → en Personal / Browsing / Privacy / System, pt-BR
  Pessoal / Navegação / Privacidade / Sistema, fr Personnel / Navigation / Vie privée / Système, de Persönlich /
  Surfen / Datenschutz / System, it Personale / Navigazione / Privacy / Sistema (los nombres de sección de Firefox).
- El nombre del navegador nunca se escribe: `{ -brand-short-name }`.

## Temas integrados

Nombres en Complementos › Temas (`overlay/browser/themes/addons/aegis-*/_locales/<idioma>/messages.json`; ahí los
idiomas son `en_US`, `es`, `pt_BR`, `fr`, `de`, `it`). Se traducen; las descripciones, una frase corta sin punto de
exclamación.

| es-ES | en-US | pt-BR | fr | de | it |
|---|---|---|---|---|---|
| Grafito | Graphite | Grafite | Graphite | Graphit | Grafite |
| Medianoche | Midnight | Meia-noite | Minuit | Mitternacht | Mezzanotte |
| Niebla | Mist | Névoa | Brume | Nebel | Nebbia |
| Arena | Sand | Areia | Sable | Sand | Sabbia |

Degradado del tema: es «fundido», en «fade» (ortografía de EE. UU.: «gray»), pt-BR «degradê», fr «fondu», de
«Verlauf», it «sfumatura».

## Pendientes de acordar

Se apuntan cuando aparezcan en los textos: «Esenciales», «Modo compacto», «Aegis anónimo».

Notas de los Escudos:
- Honestidad: ningún texto dice «impenetrable», «infalible» ni «anónimo total». Aegis con Tor «no es Tor Browser» y los
  Escudos «no son invisibles»; se dice igual en los seis idiomas.
- «Solo HTTPS»: el modo de Firefox; en mitad de frase, como Firefox («el modo solo HTTPS», «Nur-HTTPS-Modus»).
- Fila «Rastreadores y anuncios» del panel: sustantivo y no «Bloquear…», porque a su lado va el desplegable con el
  nivel (Normal / Estricto / Personalizado) y en 340 px no cabe más.
- Desplegable de cookies de terceros: «Bloquear rastreo» / «Bloquear todas» (pt-BR «Bloquear rastreio» / «Bloquear todos» (cookies, masculino), fr «Bloquer
  le pistage» / «Tout bloquer», de «Tracker blockieren» / «Alle blockieren», it «Blocca traccianti» / «Blocca tutti»). En-US dice «Block cross-site»: el valor de Firefox
  (cookieBehavior 5) bloquea las cookies de rastreo entre sitios y aísla las demás.
- it: «traccianti» (como Firefox), no «tracciatori». de: «Werbung» sin contar; con número, «Anzeige(n)».

## Instalador (Windows)

| es-ES | en-US | pt-BR | fr | de | it |
|---|---|---|---|---|---|
| acceso directo | shortcut | atalho | raccourci | Verknüpfung | collegamento |
| menú Inicio | Start menu | menu Iniciar | menu Démarrer | Startmenü | menu Start |
| escritorio | desktop | área de trabalho | bureau | Desktop | desktop |
| permisos de administrador | administrator permission | permissão de administrador | droits d’administrateur | Administratorrechte | permessi di amministratore |
| Reintentar | Try again | Tentar novamente | Réessayer | Erneut versuchen | Riprova |

- Las fases de la instalación, todas con la misma forma: es gerundio («Copiando archivos»), pt-BR gerundio, fr e it
  sustantivo («Copie des fichiers», «Copia dei file»), de pasiva («Dateien werden kopiert», «Wird vorbereitet»).
- pt-BR lleva artículo con el nombre: «o Aegis» («Abrir o Aegis»); los demás, no.
- Apariencia: es «Negro y grises», pt-BR «Preto e tons de cinza» (no «cinzas»), en-US «grays».

## Estilo por idioma

- es-ES: de tú, sin exclamaciones, mayúscula solo al principio, comillas «latinas».
- en-US: sentence case, como Firefox.
- pt-BR: «você»; descripciones de botón en infinitivo («Alternar…»), como Firefox.
- fr: «vous», como Firefox; comillas « » con espacio fino; apóstrofo tipográfico.
- fr: delante de `{ -brand-short-name }` (siempre «Aegis», empieza por vocal) la elisión va escrita a mano: «d’{ -brand-short-name }»,
  «qu’{ -brand-short-name }», nunca «de { -brand-short-name }». Si el nombre de marca cambiara a uno con consonante inicial, hay que revisarlo.
- Conexiones: grupo «Traducción de páginas» (en Page translation, pt-BR Tradução de páginas, fr Traduction des pages, de Seitenübersetzung, it Traduzione delle pagine); OCSP va dentro del grupo de seguridad.
- de: «du», como Firefox; descripciones de botón en infinitivo al final («… wechseln»).
- it: «tu»; comillas «».
