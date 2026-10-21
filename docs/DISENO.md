# Lenguaje visual de Aegis

Blanco y negro. Calma. Precisión.

Aegis hereda el lenguaje de SecretOS: monocromo, sobrio y silencioso, con la claridad de un producto comercial bien
hecho. **El contenido manda**: en un navegador, la web es lo importante y la interfaz se aparta. Este documento es la
referencia de todo lo que se ve (CSS de la interfaz, páginas `about:`, iconos, marca). Lo revisa `inspector-visual`.

Los valores viven en un solo sitio: `overlay/browser/components/aegis/estilos/tokens.css` (variables `--aegis-*`). En el
CSS de Aegis **no hay colores, radios ni duraciones fijos** fuera de ese archivo. Única excepción:
`overlay/toolkit/themes/shared/design-system/src/aegis-enfasis.css` (el énfasis de serie en los documentos de elegir
perfil, parche `0500-ui/0003`), que se carga antes de que haya perfil, donde no llega `tokens.css`, y por eso lleva sus
valores escritos; `tools/verificar.py` comprueba que cada uno es un color de `tokens.css` y que los tokens de Firefox
que redefine siguen existiendo.

## 1. Principios

1. **Monocromo de serie.** El color aparece en el **contenido** (la web, los favicons, las fotos), en los **estados
   reales** (error, aviso, positivo, siempre con texto), si el usuario lo elige, en el **énfasis** (§2) y en el color
   que el usuario da a cada **contenedor** y a cada **grupo de pestañas** (§2), solo en su glifo, su punto o su
   etiqueta, su línea y su tinte, nunca en texto. Nunca como
   decoración ni como marca.
2. **El contenido manda.** Pocas líneas, ningún adorno. La jerarquía se marca con tamaño, peso y gris; nunca con
   color, recuadros dobles ni sombras pesadas.
3. **Una sola voz.** Una tipografía (Inter), una escala de radios, una de espacios y una forma de moverse.
4. **Precisión.** Rejilla de 4 px, bordes de 1 px y radios concéntricos.
5. **Calma.** Nada se mueve en reposo. Las animaciones son cortas y explican un cambio.
6. **Claro y oscuro, por igual.** Sigue al sistema (`prefers-color-scheme`) salvo que el usuario elija uno. El oscuro
   es la referencia.
7. **Accesible.** Contraste AA, foco visible, todo con teclado y nada que dependa solo del color.
8. **Ligero.** Ningún efecto que cueste batería sin aportar.

## 2. Color

### Oscuro

| Token | Valor | Uso |
|---|---|---|
| `--aegis-bg` | `#0a0a0b` | Fondo de la ventana (marco alrededor del contenido) |
| `--aegis-sidebar` | `#0f0f11` | Barra lateral (modo Workflow) |
| `--aegis-surface` | `#151517` | Barra de direcciones, grupos, tarjetas, páginas `about:` |
| `--aegis-dialog` | `#131315` | Diálogos |
| `--aegis-menu` | `#1a1a1d` | Menús y paneles emergentes |
| `--aegis-line` | blanco al 7 % | Bordes de 1 px y separadores |
| `--aegis-line-strong` | blanco al 16 % | Borde de un control elevado o separador marcado (**no** es foco) |
| `--aegis-focus` | texto al 55 % | Anillo de foco y borde del campo con foco en Monocromo (≥ 5,5:1) |
| `--aegis-text` | `#f4f4f5` | Texto principal |
| `--aegis-sub` | `#a1a1aa` | Secundario: descripciones, URL fuera del dominio |
| `--aegis-muted` | `#85858e` | Apagado: etiquetas de sección y marcadores (**no aclararlo**: 5,4:1 sobre bg, 4,75:1 sobre menu) |
| `--aegis-control` | blanco al 7 % | Botón secundario (encima 10 %, pulsado 14 %) |
| `--aegis-hover` | blanco al 4 % | Fila al pasar el ratón (pestañas, listas, menús) |
| `--aegis-sel` | blanco al 7,5 % | Fila elegida (pestaña activa en la barra lateral) |
| `--aegis-track` | blanco al 14 % | Pista de barras y del interruptor apagado |
| `--aegis-favicon-placa` | texto al 60 % | Placa detrás de un favicon oscuro y de color (§9, «Favicons de poco contraste»; solo en el oscuro) |
| `--aegis-prim` | `#ececee` (encima `#ffffff`, pulsado `#d4d4d8`) | Acción principal, interruptor encendido |
| `--aegis-on-prim` | `#0b0b0c` | Texto sobre la acción principal |
| `--aegis-grad-desde` / `--aegis-grad-hasta` | `#1a1a1d` → `#0a0a0b` | Degradado del marco (Firefox lo mezcla al 50 % sobre el fondo) |
| `--aegis-filo-desde` / `--aegis-filo-hasta` | blanco al 32 % → 6 % | Filo de 1 px de la pestaña activa |

### Claro

| Token | Valor |
|---|---|
| `--aegis-bg` | `#f5f5f7` |
| `--aegis-sidebar` | `#ececef` |
| `--aegis-surface`, `--aegis-dialog`, `--aegis-menu` | `#ffffff` |
| `--aegis-line` / `--aegis-line-strong` | negro al 8 % / 16 % |
| `--aegis-focus` | texto al 55 % (≥ 4,2:1; foco ≥ 3:1) |
| `--aegis-text` | `#0a0a0b` |
| `--aegis-sub`, `--aegis-muted` | `#5f5f67` (5,4:1 sobre la barra lateral; SecretOS usa `#6b6b73`, que ahí no llega a AA) |
| `--aegis-control` | negro al 5 % (encima 8 %, pulsado 12 %) |
| `--aegis-hover` / `--aegis-sel` / `--aegis-track` | negro al 3,5 % / 6,5 % / 13 % |
| `--aegis-prim` | `#1c1c1e` (encima `#000000`, pulsado `#3a3a3d`) con texto `#ffffff` |
| `--aegis-grad-*` / `--aegis-filo-*` | `#ffffff` → `#ececef` / negro al 28 % → 5 % |

**Regla del apagado:** `--aegis-muted` solo va sobre fondos en reposo (bg, sidebar, surface, dialog, menu). Sobre una
fila con hover, sel o control se usa `--aegis-sub`: el apagado bajaría de 4,5:1.

**Campos** (oscuro con blanco, claro con negro): relleno al 4 % (7 % con foco), borde al 10 % (`--aegis-focus` con
foco). Casilla sin marcar: borde blanco al 35 % en oscuro y negro al 45 % en claro (≥ 3:1). Segmentos sin elegir: 5 % (9 % al pasar el ratón).

### Estados

Solo cuando hay un problema o una confirmación de verdad, y siempre con texto.

| Estado | Texto oscuro | Texto claro | Iconos y rellenos |
|---|---|---|---|
| Error | `#fca5a5` | `#b91c1c` | `#f87171` / `#dc2626` |
| Aviso | `#fbbf24` | `#854d0e` | `#fbbf24` / `#854d0e` (`#ca8a04` solo como relleno acompañado de texto, nunca como única señal: 2,9:1) |
| Positivo | `#88b89a` | `#3a7352` | ídem |

- **Sitio inseguro** (HTTP, certificado malo): candado tachado con el color de error y el texto «No seguro». Un sitio
  seguro **no** lleva verde: el estado normal no se celebra.
- **Acciones destructivas** (borrar datos, olvidar un sitio): el botón sigue en blanco y negro; avisa el texto.

### Énfasis

Se elige en Ajustes › Apariencia › «Énfasis» o en «Personalizar» de la nueva pestaña, con las mismas muestras y el
mismo «+» del personalizado (pref `aegis.enfasis`;
`enfasis.sys.mjs` pone el atributo `aegis-enfasis` en la raíz de cada documento de la interfaz y de las páginas propias):
- **Monocromo** (de serie): el énfasis es `--aegis-prim` (blanco en oscuro, casi negro en claro).
- **Automáticos:**
  - **Color de Windows**: el color de sistema `AccentColor`, tal como lo ve la ventana del navegador. Se vuelve a leer
    cuando Windows avisa de un cambio de colores (`look-and-feel-changed`), sin sondear.
  - **Fondo de escritorio**: el color dominante del fondo, calculado en el equipo (la ruta sale del registro; la
    imagen se decodifica a 32 × 32 en memoria; el tono que más pesa, con el croma limitado a 0,10 y más suave si el
    fondo es casi gris). Se guarda solo el color y una huella; se recalcula al arrancar si la huella cambia, cuando
    Windows avisa de un cambio y al volver una ventana a primer plano (solo se compara la huella). Nada sale del equipo.
- **Temas fijos** (bases en `tokens.css`, `--aegis-enfasis-<tema>`), sobrios y de poco croma:

| Tema | Base (oklch) | Oscuro | Claro |
|---|---|---|---|
| Frambuesa | 0,74 0,10 8 | `#e1909f` | `#8c4353` |
| Coral | 0,76 0,10 35 | `#e99a86` | `#8d4635` |
| Ámbar | 0,80 0,10 75 | `#e4b572` | `#7e5403` |
| Musgo | 0,80 0,08 118 | `#b9c58a` | `#5a642c` |
| Salvia | 0,78 0,06 150 | `#9dc3a3` | `#45674c` |
| Laguna | 0,78 0,07 190 | `#81c6c1` | `#226a66` |
| Hielo | 0,78 0,07 230 | `#88c0dc` | `#2e657e` |
| Cobalto | 0,74 0,10 262 | `#88abea` | `#3e5c96` |
| Lavanda | 0,76 0,08 295 | `#b4a7df` | `#615486` |
| Ciruela | 0,74 0,08 322 | `#c39ac9` | `#734e78` |
| Malva | 0,76 0,07 350 | `#d49fb7` | `#7c4d63` |
| Piedra | 0,78 0,025 70 | `#c2b5a7` | `#675b4f` |
| Pizarra | 0,76 0,035 260 | `#a4b2c8` | `#525e72` |

  Trece temas: con el «+» del personalizado, dos filas llenas de siete. Van en el orden de la tabla: por tono, como una
  rueda de color (de Frambuesa a Malva), y al final los dos casi grises, Piedra (cálido) y Pizarra (frío), junto al «+».
  Entre dos temas cualesquiera hay al menos 0,037
  de distancia OKLab en los dos esquemas (la misma que ya había entre Hielo y Pizarra); lo comprueba
  `tools/pruebas/enfasis-propio.mjs`.
- **Personalizado** (el «+», el último de la rejilla): lo crea el usuario en el selector de §9 con un color o con dos
  (**degradado**). Se guarda solo en el perfil (`aegis.enfasis.propio`, el que está en uso, y `aegis.enfasis.guardados`,
  «Mis énfasis», como mucho 24; JSON validado por `enfasis-propio.sys.mjs`). Pasa por la misma fórmula que los temas:
  el usuario elige el tono y la intensidad, y Aegis lleva la luminosidad a la banda y limita el croma (el selector lo
  dice y enseña cómo queda). Con degradado:
  - el **primer color** es el énfasis de todo (selección, foco, interruptores, cápsulas, deslizadores, el día de hoy);
  - el **segundo** (`--aegis-accent-2`, misma fórmula) solo llega a lo que §11 deja llevar degradado: el **marco**
    (`--aegis-grad-hasta`: la luminosidad del gris de serie, L 0,145 en oscuro y 0,944 en claro, con el 30 % —25 % en
    claro— del croma), el **filo de la pestaña activa** (`--aegis-filo-hasta`: el segundo al 45 %, 40 % en claro) y el
    fondo «Énfasis» de la nueva pestaña (un tinte del primero desde la izquierda y otro del segundo desde la derecha);
  - sin ángulo: el marco y el filo los dibuja el navegador en horizontal, así que un ángulo no cambiaría nada.

**Una sola fórmula** (en `tokens.css`) saca de cualquier base, también de las automáticas, todo lo demás, así que el
contraste está garantizado sin comprobarlo color a color:
- `--aegis-accent`: la base con la luminosidad en una banda y el croma limitado. Oscuro: L 0,72–0,80 y croma ≤ 0,11;
  claro: L 0,40–0,48 y croma ≤ 0,10. Encima del pulsado y del hover, igual (±0,04–0,06 de L).
- `--aegis-on-accent`: `#0b0b0c` en oscuro y blanco en claro. En el peor caso de cualquier base (todos los tonos, croma
  hasta el tope): en oscuro ≥ 7,4:1 en reposo, ≥ 8,6:1 encima y ≥ 5,9:1 pulsado; en claro ≥ 6:1 en reposo, ≥ 7,3:1
  encima y ≥ 5,3:1 pulsado (`tools/pruebas/enfasis-propio.mjs`).
- Marca sobre bg, barra lateral, superficie y menú: ≥ 5,2:1 en oscuro y ≥ 4,5:1 en claro. Por eso, con un énfasis de
  color, **el foco es el énfasis** (`--aegis-focus`), como pide `cMarca`.
- **Color secundario:** el filo de la pestaña activa (`--aegis-filo-*`: el énfasis al 70 % → 8 %; en claro, 60 % → 6 %),
  el **degradado del marco** (`--aegis-grad-desde`: la luminosidad del gris de serie con un 30 % del croma del énfasis;
  en claro, L 0,975 con un 25 %), la cápsula elegida (segmentos) y la marca de la opción elegida.

Dónde va el énfasis:
- La **selección**, el **anillo de foco** y el borde del campo con foco, los **interruptores encendidos**, las casillas
  y radios marcados, la **opción o cápsula elegida** (segmentos, muestras), el progreso de los deslizadores, el filo de
  la pestaña activa, el tinte del degradado del marco y el **día de hoy** de los selectores de fecha.
- **Nunca** en textos, iconos, la barra de direcciones, el contador de Escudos ni el botón principal (que sigue en
  `--aegis-prim`: una acción, no un estado).
- Lo que va encima del énfasis es blanco o negro, el que dé al menos 4,5:1.
- Una marca sobre la superficie (anillo de foco, opción elegida) solo lleva el énfasis si llega a **3:1** contra ella;
  si no, se usa `--aegis-focus`. Es la regla `cMarca` de SecretOS (con la fórmula de arriba, siempre llega).
- En **Monocromo** (de serie), el foco es `--aegis-focus`: anillo de 2 px por fuera, o el borde del campo.
- Lo de Firefox (la ventana, las páginas `about:`, los diálogos y los componentes `moz-*`) usa el mismo énfasis, nunca
  el violeta de su diseño Nova: sus tokens de acento, foco, enlace y botón principal se redefinen con los de Aegis:
  - antes de que haya perfil (la ventana de elegir perfil al arrancar y sus diálogos de crear perfil y de perfil más
    nuevo), Monocromo con `toolkit/themes/shared/design-system/src/aegis-enfasis.css`, que esos documentos enlazan
    (parche `0500-ui/0003`); va en `chrome://mozapps/skin/`, que una web no puede cargar, y no se importa desde los
    tokens de Firefox, así que una web no ve ninguna diferencia con Firefox (sin huella). Ahí, las tarjetas de los perfiles con un tema sin
    colores propios (el de serie, Claro u Oscuro) se pintan con el fondo y el texto de la página, no con los colores que
    Firefox guardó con ese tema; con otro tema, con los suyos. Crear, editar y borrar un perfil solo se abren desde un
    perfil en marcha, en un proceso de contenido: ahí manda `paginas/comun.css` (Monocromo al crear uno, `sinPerfil`);
  - encima, con el énfasis elegido, `estilos/mapeo-firefox.css` (interfaz, con cualquier tema) y `paginas/comun.css`
    (páginas de un proceso de contenido);
  - dentro del shadow DOM de los componentes que traen su violeta escrito, `estilos/sombra-firefox.css`;
  - en la vista de lectura, sin cambiar sus temas, solo sus enlaces, su foco y su selección (`paginas/lector.css`).
- Muestras en los selectores: círculos de 28 (Ajustes) o 24 en una zona de 32 (Personalizar) con
  `aegis-enfasis-muestra="<tema>"`, que reciben la misma fórmula; el borde de línea fuerte las separa del fondo. La de
  un personalizado con degradado va **partida en diagonal** (las dos mitades con corte duro, no un degradado). El
  último elemento es el **«+»**: un círculo del mismo tamaño, vacío, con el borde de línea fuerte y el «+» de línea de
  16 en `--aegis-sub` (al pasar, `--aegis-hover` y `--aegis-text`); con el personalizado en uso, lleva su color y el «+»
  en `--aegis-on-accent`, y se marca como las muestras elegidas. Es un botón (abre el selector), no una opción más.
- La rejilla de Ajustes (muestra y nombre debajo) está siempre llena, a cualquier ancho y en los seis idiomas: arriba
  Monocromo y los dos automáticos, que se reparten la fila en tres celdas iguales; debajo, dos filas de siete con los
  temas y el «+» (una rejilla de 21 columnas: 7 por celda arriba y 3 abajo). Los nombres de los temas van en una línea
  (los de arriba, en dos si hace falta); con la tarjeta por debajo de 600 px, huecos de 4 y nombres de 11 px, y por
  debajo de 440, los temas solo con su muestra (el nombre, para el lector de pantalla y al pasar el ratón).
- Fuera de un perfil (la ventana de perfiles y crear uno nuevo) va siempre el énfasis de serie, Monocromo, aunque el
  perfil en uso tenga otro (`enfasis.sys.mjs`, `sinPerfil`).

### Contenedores

Los colores que el usuario da a un contenedor (los diez de Firefox: azul, turquesa, verde, amarillo, naranja, rojo, rosa,
morado, violeta y gris) son identidad elegida por él, como el énfasis, no decoración. Pasan por la misma fórmula: el
tono de Firefox con la luminosidad en la banda del esquema y poco croma (`tokens.css`, `--aegis-contenedor`; el gris es
`--aegis-sub`). Solo van en el glifo del contenedor (menús, Ajustes, el selector), en el punto de la pestaña, en el tinte
del 14 % del indicador del editor y en sus muestras de color; nunca en textos.

### Grupos de pestañas

Los nueve colores de un grupo de pestañas (los de Firefox: azul, púrpura, turquesa, naranja, amarillo, rosa, verde, gris
y rojo) también son identidad elegida por el usuario. Mismos tonos que los contenedores y la misma fórmula que el
énfasis (`tokens.css`, `--aegis-grupo-*`; `mapeo-firefox.css` los pasa a los `--tab-group-*` de Firefox): oscuro,
L 0,72–0,80 y croma ≤ 0,11; claro, L 0,40–0,48 y croma ≤ 0,10; el gris es `--aegis-sub`. Solo van en:
- la etiqueta del grupo, como relleno, con el texto en `--aegis-on-prim` (≥ 6,26:1 en claro y ≥ 8,15:1 en oscuro);
- la línea del grupo;
- su glifo en los menús y en la lista de grupos;
- el tinte (`-invert`: el color al 25 % sobre el fondo).

Nunca en texto: el contador `+N` de un grupo plegado y «Eliminar grupo» van en `--aegis-text` (`interfaz.css`).

### Temas de Aegis

Además del de serie (oscuro o claro según el sistema), cuatro temas propios en `overlay/browser/themes/addons/`:
Grafito (`#26262a` → `#18181b`), Medianoche (blanco al 7 % → 0 sobre `#050506`), Niebla (`#ffffff` → `#ececef`) y Arena
(`#faf9f6` → `#ebe8e2`). Regla: grises o casi neutros (Arena es el único templado, apenas), degradado monocromo solo
en el marco, y los mismos contrastes que los tokens de Aegis. Con un tema activo (`[lwtheme]`) mandan sus colores;
radios, tipografía y forma siguen siendo de Aegis.

### Contenido y tema de la web
- Aegis no tiñe la interfaz con el color de la web (`theme-color`) ni con el del favicon: el marco es siempre neutro.
- Los temas de Firefox que instale el usuario pueden cambiar colores; nuestra estructura (radios, tipografía) se
  mantiene.

### Webs en oscuro
Ajustes › Apariencia, justo debajo de «Apariencia de los sitios web»: **Apagado** (de serie), **Todas las webs** o
**Solo las que no tienen modo oscuro**, en tres segmentos (§9). La descripción lleva la línea de honestidad: «Una web
puede notar que se ha cambiado su aspecto».
- Solo con el oscuro: lo que la web ve en `prefers-color-scheme` (con «Apariencia de los sitios web» en Automático, el
  tema de Aegis). En claro no se toca nada.
- Colores de la web oscurecida: fondo `--aegis-bg` (`#0a0a0b`) y texto `--aegis-text` (`#f4f4f5`); el resto lo deriva el
  motor de Dark Reader (modo dinámico) de los colores de la propia web, así que el color del contenido se conserva
  (§1: el color va en el contenido).
- Fotos y vídeos no cambian. Los logotipos e iconos oscuros sobre transparente se invierten para que se lean (arreglos
  por sitio de Dark Reader y su análisis de imágenes, solo con lo que ya está en la caché).
- Una web que ya es oscura: en «Solo las que no tienen modo oscuro» se queda con su oscuro; en «Todas» toma los colores
  de Aegis sin los arreglos de Dark Reader (pensados para su versión clara).
- Excepción por sitio: fila «Oscurecer este sitio» del panel de Escudos (glifo de la luna, `escudo-oscuro.svg`), visible
  solo con la función encendida. Detalle de la fila: se adapta / ya tiene modo oscuro / solo con el oscuro / no se
  oscurece en este sitio.

## 3. Tipografía

- **Inter** para toda la interfaz; **JetBrains Mono** solo para código y datos técnicos (`about:config`, visor de
  certificados). Se cargan desde el propio navegador (`resource:///modules/aegis/fuentes/`, o `resource://aegis/` en el modo desarrollo) y
  **no** se instalan en el sistema: las webs no deben verlas.
- Pesos: 400 cuerpo, **600** jerarquía, 500 solo matices. Nunca Bold ni Black.
- Cifras que cambian (contador de Escudos, descargas, porcentajes): `font-variant-numeric: tabular-nums`.

| Nivel | Tamaño | Peso | Dónde |
|---|---|---|---|
| Título de página | 30 px, espaciado −0,4 | 600 | Bienvenida, `about:aegis-inicio` |
| Título de sección | 15–16 px | 600 | Ajustes, paneles |
| Cuerpo | 13 px (interfaz) · 14 px (páginas) | 400 | Pestañas, menús, barra de direcciones, textos |
| Secundario | 12 px | 400 | Descripciones, pies, URL del panel |
| Etiqueta de sección | 11 px, espaciado +0,8, MAYÚSCULAS | 600, apagado | «ESCUDOS», «SESIONES» (**único uso de mayúsculas**) |
| Cifra grande | 30 px | 600, tabulares | Contador de la tarjeta del panel de Escudos (como «Cifra grande» de SecretOS) |
| Título de página de Ajustes y Complementos | 24 px, espaciado −0,4 | 600 | Como el Centro de SecretOS (`Titulo.qml`) |

- Mínimo absoluto: **11 px**. Respeta el tamaño de texto del sistema.
- Mayúscula solo al principio de la frase.

## 4. Espacio y densidad del navegador

- Rejilla de **4 px** para separaciones y márgenes: 8 (dentro de un bloque), 12 (entre bloques afines), 16 (relleno de
  paneles) y 24 (entre secciones). Las alturas heredadas de SecretOS (34, 30, 18) se centran en su contenedor aunque
  el margen resultante no caiga en la rejilla.
- **Densidad del navegador** (más compacta que las páginas):

| Elemento | Medida |
|---|---|
| Barra de herramientas | 44 px de alto; botones de icono de 28 px, radio 7 |
| Barra de direcciones | 34 px de alto, radio 8, superficie con borde de línea; abierta, radio 12 (8 + 4 de desbordamiento) |
| Pestaña horizontal (Estándar) | 36 px de alto, radio 8, separación 4 |
| Pestaña vertical (Workflow) | fila de 36 px, resalte interior de radio 8 a 4 px del borde |
| Esenciales | rejilla de 44 px, radio 10 |
| Barra de favoritos | 32 px de alto, elementos de 28 px (toda la zona clicable) con radio 7 |
| Contenido web | tarjeta a 8 px del marco, radio 12, borde de 1 px (en modo compacto, a sangre). Con Caja fuerte, marcas de corte en las cuatro esquinas (L de 14 × 1 px a 3 px del borde, texto al 55 %), margen de 8 px también arriba y el borde de la tarjeta algo más claro; fijas, sin animación. Si alguien enciende el letterboxing a mano, sus márgenes son del color del marco |
| Contador de Escudos | pastilla de 14 px de alto (14 de ancho como mínimo), texto de **11 px** 600 en tabulares, radio 5, en la esquina inferior derecha del botón; fondo `--aegis-prim` y texto `--aegis-on-prim` (16,7:1), con un recorte de 1 px del color de la barra |

- En ventanas pequeñas, Firefox pasa solo a la densidad compacta (cuando la fila de pestañas ocuparía más del 5 % del
  alto, o el lanzador plegado más del 5 % del ancho; `browser.compactmode.auto.threshold`): barra de 42, fila de
  pestañas de 36 con pestañas de 28 y botones de 28. Las medidas de la tabla son las de la densidad normal.
- **Páginas** (`about:preferences`, bienvenida, `about:escudos`): las alturas de SecretOS. Campo 34, botón 38
  (principal de 112 de ancho como mínimo), fila de lista 44, segmentos 30, interruptor 34 × 20 con botón de 16,
  casilla 18.
- Zona clicable mínima: **28 px**.

## 5. Forma

| Radio | Elementos |
|---|---|
| 1–2 | Barras de progreso (carga de la página, descargas) |
| 5 | Etiquetas, casillas, contador de Escudos |
| 7–8 | Botones, campos, barra de direcciones, pestañas, filas |
| 10 | Esenciales, pastilla del interruptor, barras flotantes del modo compacto |
| 12 | Contenido web, menús, paneles, avisos, Glance |
| 13 | Loseta del icono de la app (a escala 64; §8) |
| 14 | Sub-tarjetas de las páginas |
| 20 | Tarjetas grandes (nueva pestaña, bienvenida) |
| círculo | Avatares de perfil, puntos de estado, icono de página del instalador (56, como SecretOS), icono del diálogo de la contraseña principal (40), muestras de énfasis y el «+» (28 en Ajustes; 24 en zona de 32 en Personalizar y en «Mis énfasis»), cursores del selector de color (16), botón del deslizador y botón de los interruptores |

- **Concéntricos:** el de dentro es el de fuera menos la separación (solo cuando la separación es menor que el radio de
  fuera; si no, el de dentro toma su propio valor de la escala, como la inicial de radio 8 en una loseta de 12). Se aplica dentro de nuestros componentes; el radio
  de la ventana lo pone el sistema (8 en Windows 11, 0 maximizada) y no cuenta. Si el resultado no está en la escala,
  se usa el escalón inmediatamente menor (botón dentro de la barra de direcciones: 8 − 2 = 6 → 5).
- **Bordes de 1 px.** En reposo, con el texto al 6–12 %; con foco, `--aegis-focus`. Nunca dobles ni de color.
- **El anillo de foco no es un borde:** `outline` de 2 px por fuera con `--aegis-focus` (o el énfasis según la regla
  cMarca de §2). Es la única excepción a la regla de 1 px.
- **Sombras** neutras y suaves, solo para separar capas (menús, paneles, Glance). Nunca de color.

## 6. Profundidad y cristal

Tres capas: **marco → superficie → elevada** (menús, paneles, Glance). No se apilan más.
- **Cristal** (opcional, apagado de serie): Mica en Windows 11. En Linux no se ofrece. **Nunca hay translucidez sin
  desenfoque.**
- **Modo compacto:** las barras aparecen por encima del contenido con la capa elevada y sombra suave.

## 7. Movimiento

| Duración | Uso |
|---|---|
| 90 ms | Pulsar: escala 0,97 |
| 110–150 ms | Pasar el ratón y cambios de color o de borde |
| 180–220 ms | Cambios de contenido y fundidos (cambiar de espacio, abrir un panel) |
| 225–300 ms | Deslizar (barra lateral, barras del modo compacto, Glance) |

- Curva de serie **OutCubic** (`cubic-bezier(0.33, 1, 0.68, 1)`). Sin rebotes ni muelles. **Tope de 300 ms.**
- **Nada animado en reposo**: solo el indicador de carga mientras carga y el cursor de un campo con foco.
- `prefers-reduced-motion: reduce` → cambios instantáneos.
- Si se sabe el progreso, una barra; sin datos, un indicador giratorio discreto.

## 8. Iconos

- **Glifos de línea** en rejilla de 24, trazo de 1,5, extremos redondos, monocromos con `context-fill`
  (`-moz-context-properties`). A 16 px, el trazo se mantiene nítido (revisarlo).
- La base son los glifos de SecretOS (`SecretOS-Private/system/share/centro/iconos.js` y `system/setup/icons/`),
  normalizados con `tools/iconos.py`.
- **Icono de la app: el fantasma** (`branding/icono/aegis.svg`, decidido por el usuario el 2026-10-10). Loseta negra
  `#0a0a0b` a sangre, de radio 13 a escala 64 (52 sobre 256), con filo blanco al 10 %, y un fantasma blanco
  `#f4f4f5` con dos ojos. La versión pequeña (16–32 px) lo agranda en la loseta. Es la excepción a «glifo de línea»:
  el icono de la app es una silueta rellena.
- **Navegación privada (modo incógnito):** el mismo fantasma con el hueco de una cerradura por boca
  (`branding/icono/privado/`): icono de las ventanas privadas, su mosaico y la página de navegación privada. En la
  barra de pestañas, el indicador es su glifo de línea (`estilos/iconos/privado.svg`, rejilla de 24, trazo de 1,5).
  Las ventanas privadas usan el mismo tema de Aegis que las normales (sin el violeta de Firefox): se distinguen por
  ese icono y por el indicador de la barra de pestañas.
- **Loseta de los iconos pequeños** (16–32 px): radio 7 sobre 32 (14 a escala 64), un poco más que el 13 de la grande
  para que la esquina se lea a ese tamaño.
- **Navegador controlado por un programa** (pruebas automáticas): robot de línea (`estilos/iconos/automatizado.svg`) y
  la barra de direcciones con rayas de `--aegis-control` de corte duro (no es un degradado; solo sale en pruebas).
- **Icono alternativo (Ajustes › Apariencia):** el uróboros en espectro (`branding/icono/alternos/uroboros.svg`),
  trazado en vector desde el grabado `Ouroboros.jpg` con `tools/icono-vector.py`: se apaga hacia la cola, que entra en
  la boca. `tools/iconos.py` genera todos los PNG e ICO (también `alternos/uroboros.ico`).
- **Botón de Escudos:** el uróboros (`estilos/iconos/escudo.svg`, del icono alternativo) sin desvanecido y en
  `context-fill`, con el contador encima (§4). Es la única silueta rellena permitida en la barra: a 16 px se lee como
  un anillo, es decir, como un trazo. Con los Escudos bajados en el sitio, el mismo con una barra diagonal. El
  contador no lleva color.
- **Caja fuerte** (huella digital, el nivel que lo bloquea todo): el mismo uróboros marca ese nivel, y solo ese, en
  el panel de Escudos (glifo de la fila «Huella digital» cuando está elegido y de la tarjeta «Permitir en este
  sitio»), en su tarjeta de Ajustes › Privacidad y en su aviso. Es la otra excepción a «no se mezclan iconos de
  relleno con iconos de línea»: a 16 px se lee como un anillo, igual que en la barra.
- **Candado de identidad** (a la izquierda de la barra): glifo de línea; sin conexión segura, tachado en
  `--aegis-err-fill` y con el texto «No seguro». Un sitio seguro no lleva verde.
- Sin emojis. No se mezclan iconos de relleno con iconos de línea en la misma vista.

## 9. Componentes

| Componente | Cómo es |
|---|---|
| **Botón principal** | `--aegis-prim`, texto `--aegis-on-prim` 14 px 600, alto 38, radio 8, al menos 112 de ancho, escala 0,97 al pulsar. Uno por pantalla. Desactivado: opacidad 0,28 |
| **Botón secundario** | `--aegis-control` (7 → 10 → 14 %), texto normal 14 px, alto 38, radio 8 |
| **Botón de icono** | 28 × 28, radio 7, sin fondo; al pasar `--aegis-hover`, pulsado `--aegis-control` |
| **Nueva pestaña** | Como Brave: accesos arriba (losetas de 64 con radio 12, borde de línea, inicial sobre `--aegis-control` en un cuadro de radio 8, título de 12 px en `--aegis-sub` en una línea; el favicon, si lo hay, llena la caja del icono, también el de una dirección equivalente —otro esquema, «www», redirecciones—, y si Firefox solo tiene uno pequeño (16–95 px, como el de una página importada) y hay uno más grande de una dirección equivalente, va el grande, que no se ve pixelado; si el icono grande es un cuadrado blanco o gris muy claro, que se vería como un cuadrado blanco, va otro favicon transparente de la página —de 48 o más si lo hay, si no el de 32—; un cuadrado oscuro o del color de la marca se queda, nítido) y el buscador debajo (de 416 a 600 × 44, radio 12, superficie y borde). En el diálogo de añadir o editar un acceso, junto a «Usar una imagen personalizada», el enlace «Usar el logo de la web» con una línea de estado de 12 px en `--aegis-sub`. El «+» es una loseta vacía de 64. Personalizar: la brocha (`brocha.svg`) como botón de icono arriba a la derecha y, a su izquierda, el sobre del correo (fila «Botón del correo»); el panel abre con las secciones de Aegis (etiqueta en versalitas y tarjeta): **Fondo** (Liso, Degradado del marco, Énfasis —un degradado radial suave del énfasis— o una Imagen del disco, que se guarda en el perfil y lleva un velo del fondo al 30 % y los nombres de los accesos en una etiqueta opaca), **Énfasis** (las muestras: arriba Monocromo y los automáticos, debajo los trece temas y el «+» del personalizado, en dos filas llenas de siete) y **Diseño** (mostrar el buscador; su posición: «En el centro» o «Más arriba», a unos 40 px del borde; los accesos encima o debajo del buscador; el espaciado entre las losetas y el buscador, de 36 a 64 px de 4 en 4; y el ancho del buscador, de 416 —el de Brave— a 600 px de 8 en 8, sin pasar nunca del ancho de la página). Debajo, los accesos y filas de Firefox y «Más ajustes». Sin logotipo, sin accesos de serie, sin temas ni fondos de Firefox (se descargan). **Los accesos automáticos solo salen de lo visitado en Aegis** (`accesos.sys.mjs`): una página entra si tiene una visita posterior a la creación del perfil que no venga de «Importar datos» (cada importación de historial apunta su tramo de visitas en `aegis.accesos.importaciones`). Lo importado de otro navegador sigue en la barra de direcciones y en el historial, pero no llena las losetas ni entra al descartar una; los fijados y «Añadir acceso directo» no cambian, y un perfil sin importaciones se ve igual que antes. El mismo filtro vale para los accesos de la barra de direcciones (salen de los de la nueva pestaña) y para la API `topSites` de las extensiones. Se guardan las 20 últimas importaciones (sin juntarlas) y la lista se vacía al borrar todo el historial. «Descartar» quita el sitio entero |
| **Botón del correo** (nueva pestaña, `paginas/correo.sys.mjs`) | El mismo botón que la brocha de Personalizar (moz-button de 32, radio 8, sin fondo; al pasar `--aegis-hover`) con el sobre de línea (`correo.svg`), a 4 a su izquierda. Sin dirección, el clic abre su diálogo: el marco de los diálogos de Aegis (440 de ancho, relleno 24, `--aegis-dialog`, borde de línea, radio 12, sombra suave, sin velo), título de 16 px 600, explicación de 13 px en `--aegis-sub`, campo de 34 (radio 7, §2 «Campos») con su rótulo de 13 px encima, una línea de ejemplos de 12 px en `--aegis-sub`, el error de 12 px en `--aegis-err` (y el borde del campo en `--aegis-err-fill`) y el pie a la derecha: «Cancelar» (secundario) y «Guardar» (principal, 112 como mínimo), de 34 y radio 8. Con dirección, el clic abre la bandeja (clic central o Ctrl+clic, en otra pestaña) y el título dice cuál. Clic derecho: menú (`--aegis-menu`, radio 12, borde de línea, sombra suave, filas de 32 con radio 7 a 4 px) con «Cambiar la dirección del correo…» y «Quitar». En Personalizar, la sección «Correo» al final de las de Aegis: la dirección en 13 px `--aegis-sub` y los botones compactos «Cambiar…» y «Quitar». Nunca el favicon de la web del correo: siempre el sobre |
| **Favicons de poco contraste** (`favicons.sys.mjs`, `estilos/favicons.css`) | En pestañas, barra de marcadores, menús de Marcadores e Historial y paneles de la barra lateral. Cada favicon se mide una vez en el equipo: monocromo y con menos de 3:1 contra el fondo del tema (el negro de GitHub en el oscuro, uno blanco en el claro), **invertido**; oscuro y de color con menos de 2:1 en el oscuro (un azul marino), una **placa** detrás, `--aegis-favicon-placa` (texto al 60 %, ≥ 4,5:1 con un azul marino encima), con 2 px de aire y radio 5. Los de fondo propio, los que ya se ven y los SVG que se adaptan solos al tema no se tocan |
| **Instalador** (Aegis Setup) | Como el asistente de SecretOS: icono de página en círculo de 56, título de 24, tarjetas de opción con miniatura quieta y monocroma (modo, Escudos, apariencia) y, sin miniatura, tarjetas compactas de radio 12 y relleno 16 en rejilla (buscador, 2 × 2). La elegida, como las «Tarjetas de nivel»: borde de 1 px del color del texto, relleno `--aegis-sel` y nombre en 600. La opción recomendada lleva «RECOMENDADO» como pestaña sobre el borde superior (11 px 600 en mayúsculas, `--aegis-sub`, radio 5, sin relleno de énfasis: no pide atención). El contador de la miniatura de Escudos es parte del dibujo (la pastilla de §4 a escala), no texto de la interfaz: por eso puede bajar de 11 px. Flechas y Tab entre tarjetas. Pie con pasos en rayitas, «Atrás» secundario y «Continuar» principal. Excepción heredada de SecretOS: filas de 40 (resumen de la bienvenida), 50 (carpeta) y 60 (casilla con dos líneas) además de las de 44. Todo con teclado y anillo de foco de 2 px (§5) |
| **Bienvenida del navegador** (`about:bienvenida`, cuando no se pasa por Aegis Setup: Microsoft Store y zip) | El asistente del Instalador (fila de arriba) en una pestaña, medida a medida (`paginas/bienvenida.css`): marca arriba a la izquierda (icono de 20 y «Aegis» en 16 px 600, a 28 y 24 del borde), contenido centrado de 600, icono de página en círculo de 56 (`--aegis-control`, borde de línea) con el glifo de línea de 26 del paso del instalador (`bienvenida-*.svg`), título de 24 (30, con el logo de 64, en el primer paso) y subtítulo de 14 en `--aegis-sub`. Primer paso: «Tu configuración» (etiqueta de sección) y un grupo de filas de 40 (glifo de 18, nombre de 14, valor de 13 en `--aegis-sub` y chevron de 16), cada una lleva a su paso. Tarjetas con miniatura de 244 × 132 (modo) o 184 × 100 (Escudos, apariencia), con 24 entre ellas, y compactas de 264 en rejilla de 2 × 2 con 16 (buscador; una columna por debajo de 560 px), con la elegida, la insignia y los textos del Instalador. Las miniaturas son el dibujo de `miniaturas.slint` (solo rectángulos) con la tinta del tema de la página (`--aegis-tinta`) o la del tema que enseñan (`--aegis-tema-oscuro-*`, `--aegis-tema-claro-*`) y la escala de radios reducida (`--aegis-mini-r-*`); no cambian en alto contraste. Pie fijo de 76 con la línea arriba: rayitas de 12 (la actual, 26) separadas 6, las hechas del color del texto; «Paso N de 5» en 12 px apagado y, a la derecha, el secundario («Personalizar» / «Atrás») y el principal («Usar lo recomendado», «Usar esta configuración» si se ha cambiado algo, o «Continuar»), de 38 con 10 entre ellos. Las tarjetas son radios nativos: el foco se ve con el anillo de 2 px por fuera de la lámina. Al cambiar de paso, el nuevo entra deslizándose 30 px y apareciendo (`--aegis-t-slide`, OutCubic; nada con el movimiento reducido) y el foco va a su título. Nada se mueve en reposo |
| **Buscador de la barra lateral** (Ajustes) | Alto 32, radio 8, superficie: como el del Centro de SecretOS |
| **Campo** | Alto 34, radio 7, relleno al 4 % (7 % con foco), borde al 10 % (`--aegis-focus` con foco, o el énfasis según cMarca) |
| **Barra de direcciones** | Campo de 34 con superficie; al enfocar, se eleva a panel de resultados de radio 12. Menú de la lupa: filas de radio 7; con un buscador elegido para una búsqueda que no es el predeterminado, una fila más antes de «Ajustes», «Usar <buscador> como predeterminado», con el glifo `predeterminado.svg` (círculo con visto). **Acciones** (modo «Acciones»: «> » o Acciones en el menú de la lupa; y la fila de botones que sale al escribir una palabra clave, `acciones.sys.mjs`): los botones de la barra, cada uno con un glifo de línea de 16 (§8: rejilla de 24, trazo de 1,5, `context-fill`; `estilos/iconos/accion-*.svg` y los de Aegis: `modo`, `contenedor`, `privado`, `tor`, `llave`, `extensiones`, `escudo-ajustes`), nunca un icono de color ni el violeta de la ventana privada. Los Escudos, con un escudo de línea (con visto; tachado para «Bajar los Escudos en este sitio»), no con el uróboros relleno: en la lista solo hay glifos de línea. Primero las de Aegis (Escudos, Ajustes de Escudos, Conexiones, modo, contenedor, tutorial de Workflow, apariencia, ventana privada y con Tor, contraseñas, pasar y recibir, importar) y después las del navegador que se quedan (descargas, marcadores, historial, imprimir, PDF, captura, traducir, código, silenciar, extensiones, temas, ajustes, reiniciar, actualizar). Una acción que no se puede usar ahora (sin web en la pestaña, sin audio) sale atenuada en la lista y no sale en la fila |
| **Interruptor del sitio** (cabecera del panel de Escudos) | 42 × 24, radio 12, botón de 20: el control principal del panel, más grande que los de las filas |
| **Interruptor** | 34 × 20, radio 10, botón de 16. Encendido: el énfasis (`--aegis-accent`, en Monocromo `--aegis-prim`) con el botón `--aegis-on-accent`. Apagado: `--aegis-track` con el botón `--aegis-sub` |
| **Segmentos** | Alto 30, borde al 10 %, contenedor de radio 10 con opciones de radio 8 a 2 px. Elegido (la «cápsula»): el énfasis con texto `--aegis-on-accent` 600 (en Monocromo, `--aegis-prim` y `--aegis-on-prim`) |
| **Deslizador** | Pista de 4 (`--aegis-track`, radio 2), progreso del énfasis y botón de 16 en `--aegis-prim` con borde de línea fuerte; el valor, a la derecha en 12 px tabulares |
| **Menú y panel** | `--aegis-menu`, radio 12, borde de línea, sombra suave. Menús de la barra (`menupopup`): filas de 32 con resalte de radio 7 a 4 px. Paneles del menú principal: **cápsulas**, cada grupo de filas en un bloque `--aegis-control` (al pasar `--aegis-control-hover`, pulsado `--aegis-control-down`) a 4 px del borde y con radio 8 solo en sus extremos; los grupos, separados por la línea con 8 px |
| **Aviso** | Barra de mensaje sobre el contenido: tarjeta a 8 px, `--aegis-surface`, borde de línea, radio 12, sombra suave. El estado (aviso, error) solo tiñe el icono |
| **Pestaña activa** | Estándar: superficie con borde de línea. Workflow: `--aegis-sel` con el filo de la activa (sin el borde de línea) y título en `--aegis-text` 500, frente a `--aegis-sub` en las demás (no depende solo del relleno); filas de 36 (`estilos/workflow.css`). Sin rayas de color |
| **Contenedor de la pestaña** | Un punto de 6 del color del contenedor en la esquina del icono de la pestaña, con un recorte de 1,5 del fondo de la fila (en la fila de pestañas, sin favicon, ocupa el sitio del icono delante del título). Sustituye a la raya de color de Firefox (`estilos/contenedores.css`) |
| **Selector de contenedor** (`contenedores.sys.mjs`, `estilos/contenedores.css`) | En la barra de direcciones, el indicador de Firefox (glifo del contenedor en su color, nombre de 12 px 500 en `--aegis-sub` y chevron de 12) como un botón más de la barra: radio 5, sin fondo, `--aegis-hover` al pasar y `--aegis-control` abierto. Sin contenedor, en su sitio un botón de icono con el glifo `contenedor.svg`. Abre (también con Ctrl+Mayús+L —no Alt+Mayús+letra, que en Windows es la tecla de las accesskey de las webs— y la acción «Cambiar de contenedor») un panel como el de Escudos: 340 de ancho, relleno 16, 12 entre bloques; cabecera «Contenedor» (15 px 600) con el de la pestaña debajo (12 px apagado) y el atajo a la derecha (12 px tabulares); etiqueta «PASAR LA PESTAÑA A» y una tarjeta `--aegis-control` (radio 12, relleno 4) con filas de 36 (radio 8): glifo de 16 del contenedor en su color (`contenedor-ninguno.svg` en `--aegis-sub` para «Sin contenedor»), nombre de 13 px (600 y el visto `visto.svg` en la de la pestaña) y el «+» como botón de icono de 28 (radio 7, `mas.svg`) que abre una pestaña nueva en él. Si la pestaña tiene algo escrito en un formulario, una tarjeta de aviso con `aviso.svg` en `--aegis-warn` (el estado solo tiñe el icono); con una web, la línea de honestidad en 12 px apagado (se recarga sin las cookies pero con la misma dirección, la pestaña de antes se cierra y vuelve con Ctrl+Mayús+T). Pie: «Nuevo contenedor…» y «Gestionar», secundarios de 34 que crecen desde su texto. Teclado: flechas, Inicio y Fin, Intro (Mayús+Intro, pestaña nueva), 0–9 y Esc; foco con el anillo de 2 px por dentro. Nada se mueve en reposo |
| **Tutorial de Workflow** (`about:bienvenida`, tras la bienvenida con Workflow o `about:bienvenida?tutorial`) | Los pasos de la Bienvenida del navegador (fila de arriba): icono de página de 56 (`modo`, `fijar`, `contenedor`, `acciones.svg`), título de 24 y subtítulo; debajo, una chuleta en el grupo de filas del resumen (filas de 40 sin acción: lo que se hace en 14 px y cómo en 13 px `--aegis-sub` tabulares, separadas por la línea) y, si hace falta, una nota de 12 px. Pie con 4 rayitas, «Paso N de 4», «Atrás» (no en el primero) y el principal «Siguiente» / «Empezar» (sigue a `about:conexiones`) o «Hecho» (cierra la pestaña). «Saltar el tutorial» arriba a la derecha, frente a la marca: botón de texto de 13 px en `--aegis-sub` con zona de 28 (radio 7). Esc vuelve un paso o, en el primero, lo salta |
| **Estado vacío** | Glifo, una frase y, si hay algo que hacer, un botón |
| **Tarjetas de nivel** (Ajustes › Privacidad › «Huella digital») | Lista vertical dentro de una tarjeta de superficie (radio 12, relleno 12): cada opción, fila de 44 como mínimo con radio 8, borde de línea, nombre de 13 px 600 y una línea de 12 px en `--aegis-sub`; la elegida, con `--aegis-sel` y borde del color del texto (como las opciones del icono de la app). Caja fuerte lleva el uróboros de 16 a la derecha. Debajo, otra tarjeta con los sitios con permiso: filas de 44 separadas por la línea y un «Quitar» secundario compacto (30 de alto, radio 7) |
| **Panel de Escudos: huella** | «Huella digital» es una fila de las opciones avanzadas con el mismo desplegable que «Rastreadores y anuncios» (Básica, Equilibrada, Estricta, Caja fuerte). En Caja fuerte aparece, entre el contador y «Opciones avanzadas», una tarjeta con una sola fila: el uróboros, «Permitir en este sitio» con el estado debajo («Datos del navegador: bloqueados») y un interruptor; desactivada en ventanas privadas y en direcciones sin dominio |
| **Aviso de Caja fuerte** | El aviso emergente del navegador (Aviso, §9) anclado al botón de Escudos, con el uróboros: «<sitio> ha intentado leer datos de tu navegador. Caja fuerte se los ha ocultado». Principal «Seguir bloqueando» y secundaria «Permitir en este sitio». Una vez por sitio y sesión. Como todos los avisos emergentes: panel de radio 12 y botones de 34 con radio 8, sin borde (el principal en 600, el secundario en 400) |
| **Lanzador de la barra lateral** | Botones de icono de 28 × 28, radio 7, sin fondo ni borde en reposo; al pasar `--aegis-hover`, pulsado `--aegis-control`. La herramienta abierta, `--aegis-sel` con un contorno de 1 px `--aegis-line-strong` (no depende solo del relleno). En columna, 4 entre botones y 8 encima y debajo de cada grupo (herramientas y engranaje), a la distancia del borde del primer botón de la barra de herramientas; con pestañas verticales, centrados en el ancho de la pestaña plegada (en el eje de los favicons) y, con la barra expandida, en fila con 4 de separación. Foco: anillo de 2 px |
| **«Quitar» compacto** | El botón secundario para filas de 44 (sitios con permiso en Caja fuerte, botones de Tor en Ajustes, «Editar» y el del aviso en el panel de contraseñas): 30 de alto, radio 7, `--aegis-control` (encima `--aegis-control-hover`, pulsado `--aegis-control-down`), texto de 13 px 400, 12 de relleno lateral, escala 0,97 al pulsar. Desactivado: opacidad 0,28 |
| **Panel de extensiones vacío** | El estado vacío dentro del panel de la pieza de puzle: glifo `extensiones.svg` de 32 en `--aegis-sub` (24 encima, 12 debajo), título de 15 px 600, una línea de 12 px en `--aegis-sub` y un botón secundario de 34 × 112 como mínimo, radio 8, que abre la tienda de complementos; 16 de relleno. Con extensiones desactivadas o sin permiso en privado, los textos de Firefox con el mismo glifo |
| **Panel de extensiones** (con extensiones) | Como el de Chrome y Brave; el botón lo abre siempre, también con todas fijadas. Arriba, la etiqueta de sección «En la barra» y las fijadas; debajo, «En este panel» (solo si hay filas en las dos partes) y la lista de Firefox. Filas de 44 con resalte de radio 7 (`--aegis-hover`, pulsado `--aegis-control`) e icono de la extensión de 24 a 12 del nombre (13 px). **Chincheta** en cada fila con botón: botón de icono de 28, radio 7, glifo `fijar.svg` de 16 en `--aegis-sub`; fijada, `--aegis-sel` con borde de 1 px `--aegis-line-strong` y el glifo en `--aegis-text` (no depende solo del relleno). Su texto dice lo que hace («Fijar <extensión> en la barra», «Quitar <extensión> de la barra») y se llega a ella con el tabulador, como al «…». Pie: «Gestionar extensiones» y «Añadir extensiones», secundarios de 34 que llenan el ancho creciendo por igual desde su texto (8 de relleno como mínimo, para que quepan los textos largos), radio 8, con 8 entre ellos y hasta el borde; sin ninguna extensión, solo «Gestionar extensiones» (el estado vacío ya tiene «Buscar extensiones») |
| **Panel de contraseñas** (barra lateral) | Cabecera de 15 px 600 y botones de icono de 28 (radio 7). Tarjetas de superficie con borde de línea y radio 12; dentro, filas con resalte de radio 8, etiquetas de 11 px en `--aegis-sub` (sin mayúsculas) y valores de 13 (la contraseña, en JetBrains Mono). Botones de 38 y radio 8, de 14 px (el principal en 600); «Editar», compacto. Campos de 32 con radio 7 (el buscador, 8). Vacío: el glifo de la llave de 32, título de 15 px 600, una frase de 13 en `--aegis-sub` y los botones apilados con 8 entre ellos. Arriba, sin contraseña principal, el aviso: tarjeta de superficie con borde de línea, radio 12 y relleno de 12, texto de 12 y el botón «Crear contraseña principal», compacto |
| **Diálogo de la contraseña principal** (`dialogos/contrasena-principal.xhtml`, sustituye al de Firefox) | Modal de la ventana (o el marco de Ajustes), 440 de ancho, relleno de 24, fondo `--aegis-dialog`. Cabecera: el glifo de la llave de 20 en un círculo de 40 sobre `--aegis-control`, título de 16 px 600 y explicación de 13 px en `--aegis-sub`. Campos de 34 (radio 7, §2 «Campos») con la etiqueta de 13 px encima y, dentro a la derecha, el botón de mostrar de 30 a 2 px del borde (radio 5, concéntrico) con el ojo de 16 (`ojo.svg` / `ojo-tachado.svg`); visible, la contraseña va en JetBrains Mono. Medidor de fortaleza: cuatro tramos de 4 de alto (radio 2, separados 4) en `--aegis-track`; insuficiente, el primero en `--aegis-sub`; desde aceptable, los tramos en el énfasis. Debajo, el nivel o lo que falta en 12 px `--aegis-sub` (no depende del color). Errores en 12 px `--aegis-err` y el borde del campo en `--aegis-err-fill`. Aviso «Si la olvidas, no se puede recuperar»: tarjeta de superficie con borde de línea, radio 12 y relleno 12 (título de 13 px 600, texto de 12). La línea de límites, 12 px `--aegis-sub`. Pie a la derecha: secundario («No guardar» / «Cancelar», 400) y principal («Crear y guardar» / «Crear contraseña» / «Cambiar contraseña», 600, 112 como mínimo, desactivado con opacidad 0,28 hasta que es válida), de 34 y radio 8. Foco inicial en el primer campo, Intro envía, Esc cierra sin crear. Nada se mueve en reposo |
| **Diálogo de los códigos de verificación** (`dialogos/autenticador.xhtml`) | Mismo marco que el de la contraseña principal (`dialogo.css`: 440 de ancho, relleno 24, `--aegis-dialog`), con el glifo del cronómetro (`autenticador.svg`) en el círculo de 40. Campos de 34 (radio 7): la cuenta en un desplegable con el chevron de 16 (sin chevron cuando la cuenta está fija y no se puede elegir) y la clave con el botón de mostrar. Debajo de la clave, dos botones compactos (30, radio 7, 13 px 400) para leer el QR de la página o de una imagen, y una línea de 12 px con lo leído («GitHub: 6 cifras cada 30 s») o el error en `--aegis-err`. Tarjeta de honestidad (superficie, borde de línea, radio 12, relleno 12). Pie: «Quitar el código» (secundario, a la izquierda; pide una segunda pulsación con el aviso), «Cancelar» y «Guardar» (principal) |
| **Diálogos de la transferencia de contraseñas** (`dialogos/transferencia-pasar.xhtml` y `transferencia-recibir.xhtml`) | Mismo marco que el de la contraseña principal (`dialogo.css`: 440 de ancho, relleno 24, `--aegis-dialog`), con el glifo de las dos flechas (`transferencia.svg`) en el círculo de 40, y `transferencia.css`. **Pasar**, en dos pasos dentro del mismo diálogo: primero, cuántas contraseñas se llevan (12 px `--aegis-sub`), la casilla de los códigos de verificación (13 px, marcada de serie, solo si hay alguno), la tarjeta de aviso (superficie, borde de línea, radio 12, relleno 12) y la línea de límites; pie con «Cancelar» y «Crear archivo…» (principal). Después, **el código**: seis palabras numeradas en una rejilla de 2 × 3 con 8 de separación, cada una en una tarjeta de superficie de 44 como mínimo (borde de línea, radio 8, relleno 8 × 12) con el número en 12 px tabulares `--aegis-sub` y la palabra en JetBrains Mono de 18 px 600; debajo, «Copiar el código» compacto (30, radio 7, 13 px 400) con su estado en 12 px, la tarjeta «No se volverá a mostrar» y la línea de lo guardado; el pie solo con «Hecho» (principal), que es lo único que lo cierra (Esc no, para no perder el código). **Recibir**: la fila del archivo, un campo de 34 (radio 7, relleno al 4 %, borde al 10 %) con el nombre (en `--aegis-sub` si no hay ninguno, con puntos suspensivos si no cabe) y «Elegir…» compacto dentro, a 2 px del borde (radio 5, concéntrico); el campo del código, de 34 y visible en JetBrains Mono, sin botón de mostrar; debajo, en 12 px, cuántas palabras lleva o cuál no es del código (con el borde del campo en `--aegis-err-fill`); los errores en 12 px `--aegis-err`, uno solo para código y archivo. Al terminar, el resumen en filas de 32 separadas por la línea, tabulares, y la tarjeta «Borra el archivo» con su botón compacto. Foco inicial en la acción, Intro envía, nada se mueve en reposo |
| **Panel de contraseñas: códigos y passkeys** | Encima de la lista, a 3 px de los lados: tarjeta de superficie (borde de línea, radio 12, relleno 4) con dos filas plegables de 36 (radio 8; glifo de 16 —cronómetro, persona con llave—, título de 13 px 600, la cuenta en 12 px tabulares `--aegis-sub` y el chevron de 16 a la derecha: de lado plegada, hacia abajo desplegada), separadas por la línea. Plegadas de serie. Cada código: fila de 44 con el sitio y la cuenta en 12 px `--aegis-sub`, el código en JetBrains Mono de 15 px 600 tabular («••• •••» oculto) y los segundos en 12 px, y tres botones de icono de 28 (radio 7; ojo, copiar, lápiz). Al pie, el aviso de copiado (12 px) y «Añadir código» compacto. Passkeys (solo Windows): un párrafo corto de 12 px y «Gestionar en Windows» compacto |
| **Código de verificación en about:logins** | Una fila más de la tarjeta de la contraseña elegida, como usuario y contraseña: la etiqueta de 12 px, el código en JetBrains Mono de 15 px 600 («••• •••» oculto; sin código, «Sin código de verificación» en 14 px `--aegis-sub`) con los segundos en 12 px, y a la derecha botones compactos («Mostrar»/«Ocultar», «Copiar», «Cambiar»/«Añadir»). No sale al editar ni al añadir una contraseña |
| **Autorrelleno de códigos** (`estilos/codigos.css`) | Panel emergente anclado al campo de la web (capa elevada de Firefox con los tokens: `--aegis-menu`, radio 12, borde de línea, sombra suave), 16 de relleno y 320 de ancho como mucho: «Código de verificación» en 13 px 600, «Aegis tiene el código de <sitio>» en 12 px `--aegis-sub` y un botón principal de 34 (radio 8, 600) «Rellenar el código»; con varias cuentas, un botón secundario por cuenta (una sola acción principal). No toma el foco (la flecha abajo en el campo lo lleva al panel) |
| **Ajustes › Contraseñas y autorrelleno › Cierre automático de las contraseñas** | Detrás del grupo «Contraseñas», con el esqueleto de «Webs en oscuro»: etiqueta de sección de 11 px 600 en mayúsculas, descripción de 13 px, la línea de «Nunca» (solo con Nunca elegido) y la de «Solo tiene efecto con una contraseña principal» (solo sin ella), y una tarjeta con siete segmentos (Nunca, 15, 10, 5, 3, 2 y 1 min) que se reparten el ancho y bajan de línea si no caben; el elegido, la cápsula del énfasis |
| **Ajustes › Contraseñas y autorrelleno › Transferencia de contraseñas** | Detrás del cierre automático, con el esqueleto de «Tor»: etiqueta de sección de 11 px 600 en mayúsculas, descripción de 13 px en `--aegis-sub` y una tarjeta de superficie (radio 12, relleno 12) con dos filas de 44 separadas por la línea («Pasar a otro Aegis» y «Recibir de otro Aegis»: nombre de 13 px 600, detalle de 12 px `--aegis-sub`) y a la derecha su botón compacto («Crear archivo…», «Abrir archivo…») |
| **Ajustes › Tor** | El esqueleto de «Huella digital»: etiqueta de sección, descripción de 13 px en `--aegis-sub` y tarjeta de superficie (radio 12, relleno 12). Filas de 44 como mínimo separadas por la línea, con el nombre en 13 px 600 tabulares, el detalle en 12 px `--aegis-sub` (un error, en `--aegis-err`) y los botones compactos a la derecha. Descarga en curso: barra de 4 (radio 2) con pista `--aegis-track` y relleno del énfasis. Puentes en segmentos (§9) y, al final, las notas de honestidad en 12 px `--aegis-sub`. «Google» va con la misma tarjeta, con un interruptor (§9) en cada fila |
| **Indicador de Tor** (instancia con Tor, junto al de navegación privada) | 28 de alto, radio 7, 6 de relleno lateral (el glifo queda donde el de un botón de icono) y 4 entre el glifo `tor.svg` de 16 y el texto, «Tor» o el porcentaje en 11 px 600 tabulares. Sin fondo; al pasar `--aegis-hover`, abierto o pulsado `--aegis-control`. Con error o Tor parado, el glifo en `--aegis-err-fill` y el estado en el menú |
| **about:conexiones** (primer arranque) | Misma página de lectura que about:escudos, sin índice: título de 30 px 600, entradilla en `--aegis-sub` y una tarjeta de 680 (radio 14, relleno de 16 × 24) con la etiqueta de sección y una fila por grupo de conexiones (nombre de 15 px 600, explicación de 14 px, nota de 12 px, interruptor de 34 × 20). Pie a la derecha: secundario «Ahora no» / «No permitir ninguna» (400) y principal «Aceptar» / «Guardar» (600), de 38 y radio 8. Sin scripts y nada se mueve |
| **Ajustes › Privacidad › Conexiones** | Como «Huella digital»: etiqueta de sección de 11 px 600 en mayúsculas, descripción de 13 px en `--aegis-sub` con la lista de grupos aceptados y un enlace (color del texto, subrayado) que abre about:conexiones |
| **Ajustes › Privacidad › Sesiones** (`ajustes.sys.mjs`, `sesionesSeccion`; lógica en `sesiones.sys.mjs`) | El esqueleto de «Tor», detrás de su sección (o de la de Google o la de Huella digital): etiqueta de sección «Sesiones» de 11 px 600 en mayúsculas, descripción de 13 px en `--aegis-sub` y tarjeta de superficie (radio 12, relleno 12) con dos filas de 44 separadas por la línea: «Cerrar las sesiones al salir de Aegis» (nombre de 13 px 600, detalle de 12 px `--aegis-sub` e interruptor de 34 × 20, **apagado de serie**; el texto es la etiqueta del interruptor) y «Webs que conservan la sesión» con «Elegir webs…» compacto (§9, «Quitar» compacto), que abre el diálogo de excepciones de Firefox. Debajo, las tres notas de honestidad de 12 px en `--aegis-sub` (lo que protege, lo que no y qué pasa si se cierra a la fuerza). Sin color de aviso: lo dice el texto |
| **Ajustes › Escudos** (categoría propia, `about:preferences#escudos`, en el grupo Privacidad) | Cabecera de página de Ajustes (24 px 600, sin icono, como todas las de Ajustes) y cinco secciones separadas 24 con el esqueleto de «Huella digital»: etiqueta de 11 px 600 en mayúsculas, descripción de 13 px en `--aegis-sub` con «Más información» y tarjeta de superficie (radio 12, relleno 12). Nivel: tarjetas de nivel. Molestias: filas de 44 con interruptor de 34 × 20. Contador e intervalo de las listas: segmentos de 30. Listas: fila de estado con «Actualizar ahora» compacto y las listas plegadas tras un botón compacto. Excepciones: campo de 34 (radio 7) con «Añadir» compacto a su altura; cada sitio, fila de 44 con «Editar» y «Quitar» compactos; su editor, con 12 de sangría: «Permitir todo» y un interruptor por grupo (encendido = permitido en el sitio). **Fila heredada** (grupo apagado en general o sitio con «Permitir todo»): interruptor encendido y atenuado (0,4) y el motivo a contraste completo («Permitido por ajuste general»), nunca la fila entera atenuada. Igual «Actualizar las listas solas» sin el permiso de Conexiones, con el enlace para darlo |
| **Panel del candado** (el «trust panel» de Firefox; `escudos.sys.mjs`, `estilos/escudos.css`) | Una sola protección a la vista (decisión del usuario, 2026-10-20): sin la tarjeta de Firefox con su escudo de colores y su contador, sin su interruptor de protección contra rastreo y sin el aviso de Mozilla Monitor. Debajo de la fila del sitio y «Conexión segura», una fila del menú del panel (`subviewbutton` con chevron, como «Conexión segura») con el uróboros de 16 (tachado con los Escudos bajados) y el estado del botón en corto («Escudos activos: 3 bloqueados», la misma cuenta; «Escudos bajados en este sitio»): cierra el panel y abre el de Escudos. No sale fuera de una web (about:, archivos, aviso de Solo HTTPS). En una conexión sin cifrar se queda, de la tarjeta, solo «Tu conexión no es segura» con su explicación (es un hecho, no una protección) |
| **Ajustes › Privacidad › Escudos** (`ajustes.sys.mjs`, `escudosEnPrivacidad`) | Donde estaba la protección contra rastreo de Firefox (su tarjeta de estado, su grupo Estándar / Estricto / Personalizado y sus subpáginas, ocultos en `ajustes.css` y fuera de la búsqueda; `#etp` lleva a Ajustes › Escudos): el esqueleto de «Tor», etiqueta de sección «Escudos», descripción de 13 px en `--aegis-sub` y una tarjeta con una fila de 44 («Nivel» y el nivel en 12 px `--aegis-sub`) y «Abrir Escudos» compacto. Arriba del todo, solo en la versión que se actualiza sola y sin «Actualizaciones» en Conexiones, una tarjeta con la fila «Actualizaciones automáticas apagadas», su motivo en 12 px y «Elegir conexiones» compacto (sin color de aviso: lo dice el texto) |
| **Panel de Escudos: molestias y excepciones** | En las opciones avanzadas, tras «Rastreadores y anuncios», tres filas como las demás (glifo de línea de 16, título de 13 px, detalle de 12 px, interruptor de 34 × 20), generales para todos los sitios: «Avisos de cookies» (`escudo-aviso-cookies.svg`), «Ventanas y banners» (`escudo-ventanas.svg`) y «Avisos anti-bloqueador» (`escudo-antiadblock.svg`); el detalle dice si están apagadas o permitidas en este sitio. Debajo, la fila «Excepciones de este sitio…» (`escudo-excepciones.svg` y chevron) con lo permitido en el sitio o «Ninguna»: abre Ajustes › Escudos con el editor del sitio |
| **about:escudos** («Cómo funcionan los Escudos») | Página de lectura: índice de 200 a la izquierda, fijo al desplazarse (arriba y en fila por debajo de 920 px), con etiqueta de sección y enlaces de 13 px en filas de 32 con radio 7 en `--aegis-sub` (al pasar, `--aegis-hover` y el color del texto); columna de 680 con título de 30 px 600 (−0,4), entradilla en `--aegis-sub` y una sub-tarjeta por sección (superficie, borde de línea, radio 14, relleno de 16 × 24, separadas 12) con título de 16 px 600 y cuerpo de 14 px. Nada se mueve |
| **Fila «Usar <buscador> como predeterminado»** (menú de la lupa) | Una fila del menú como las demás: 32 de alto, radio 7, texto de 12 px y el glifo de línea `predeterminado.svg` de 16. Sale solo si el buscador elegido para esta búsqueda no es el predeterminado, detrás de la línea del pie y antes de «Ajustes» |
| **Deslizador de ancho del buscador** (Personalizar › Diseño) | El deslizador de §9: rótulo de 13 px y, a la derecha, el valor en 12 px tabulares `--aegis-sub` («600 px»); pista de 4 (radio 2) en `--aegis-track`, progreso del énfasis y botón de 16 en `--aegis-prim` con borde de línea fuerte. De 416 a 600 px de 8 en 8 (de serie, 600); el buscador nunca pasa del ancho de la página |
| **Selector del énfasis personalizado** (`selector-enfasis.sys.mjs`, `estilos/selector-enfasis.css`; lo abre el «+» de Ajustes y de Personalizar) | Diálogo modal (`<dialog>`: foco atrapado, Esc lo cierra y el foco vuelve al «+») con el marco de los diálogos de Aegis: 440 de ancho (nunca más que la ventana menos 16 por lado), relleno 24, `--aegis-dialog`, borde de línea, radio 12 y sombra suave. **Sin velo**: es una capa elevada (§6) y detrás se ve cómo cambia la página. Cabecera: título de 16 px 600 y el botón de icono de cerrar (28, radio 7). Debajo, las dos pestañas, **Crear** y **Mis énfasis**, con la forma de los segmentos (la elegida, la cápsula del énfasis) y el teclado de unas pestañas (flechas, Inicio y Fin). **Crear**: la fila «Degradado» con su interruptor (rótulo de 13 px y ayuda de 12 en `--aegis-sub`); con él encendido, dos segmentos «Primer color» / «Segundo color» con un punto de 12 del color que se edita. El **cuadro de saturación y brillo** (alto 136, radio 8, siempre de izquierda a derecha; con el teclado, flechas de 1 en 1, Mayúsculas de 10 en 10, Re Pág y Av Pág para el brillo, Inicio y Fin para la saturación) y la **barra de tono** (pista de 10 con radio 5; un `range` nativo) se eligen frente a una rueda porque son el modelo HSV del código hexadecimal tal cual, se manejan como dos deslizadores y caben en el ancho sin esquinas vacías. Sus cursores son círculos de 16 con aro blanco de 2 y línea oscura de 1 (parte del dibujo: se ven sobre cualquier color). El espectro y los extremos del cuadro son tokens (`--aegis-espectro*`): son el contenido que se elige, no decoración. Debajo, en una fila, el **código** (campo de 34 de 120 de ancho, JetBrains Mono; acepta «#88C0DC», «88c0dc» o «#8cd»; mientras se escribe solo se aplica un código completo y, al salir o con Intro, si no es válido, borde `--aegis-err-fill` y el error de 12 px en `--aegis-err`) y el **nombre** (opcional, 24 caracteres). **Así queda**: etiqueta de 12 px y una tarjeta de superficie (radio 12, relleno 12) con el marco (radio 8) y su pestaña activa (radio 5 a 3 px, con el filo de 1 px), un interruptor encendido y una cápsula «Aa», todo con la fórmula; debajo, la línea de honestidad («Aegis ajusta el brillo y la intensidad…»). Línea de estado de 12 px (guardado, ya estaba, lleno en `--aegis-err`) y el pie a la derecha: «Guardar» (secundario) y «Usar» (principal, 112 como mínimo), de 34 y radio 8. **Mis énfasis**: «n de 24» (12 px tabulares `--aegis-sub`), las muestras de 24 en zonas de 32, ocho por fila (24 = tres filas llenas), como radios (un clic las usa; la que está en uso, con el anillo del énfasis), una línea de ayuda y, separada por la línea, la fila de 44 del detalle (nombre de 13 px 600 y códigos de 12 px en JetBrains Mono) con «Editar» (la lleva a Crear) y «Borrar» compactos. Borrar (o Supr sobre la muestra) cambia esa fila por la pregunta «¿Borrar «…»? No se puede deshacer.» con «Cancelar» y «Borrar» compactos (el foco va a «Cancelar»; el botón sigue en blanco y negro, avisa el texto). Vacío: la gota de línea de 32 en `--aegis-sub`, título de 15 px 600, una frase de 12 y «Crear uno» secundario. Nada se mueve en reposo |
| **Perfiles** (menú ☰, ventana de perfiles y `about:editprofile`, `about:newprofile`, `about:deleteprofile`; `estilos/interfaz.css`, `paginas/perfiles.css` y `perfiles-sombra.css`) | Subvista del perfil: el avatar en un círculo de 48 (`--aegis-control` con el glifo en `--aegis-text`) y las filas en cápsulas como los demás paneles del menú (Editar y Copiar; «Otros perfiles» en una sola cápsula; Administrar y Crear). Sin perfiles creados, «Crear un perfil nuevo» es un estado vacío: glifo `perfiles.svg` de 32 en `--aegis-sub`, título de 15 px 600, una línea de 12 px y un secundario de 34; sin «What Are Profiles?». Ventana de perfiles: título de 24, texto de 14 en `--aegis-sub` y tarjetas de superficie (radio 14) con el avatar de 56 y, debajo de la línea, el nombre en 14 px 600 y los botones de icono de 28 (radio 7); «Crear un perfil», la misma tarjeta vacía con el «+» en `--aegis-sub`. La papelera de otro perfil abre el diálogo de Aegis (440, relleno 24, `--aegis-dialog`, radio 12): avatar de 40, «¿Borrar el perfil «…»?» en 16 px 600, qué se borra en 13 px `--aegis-sub` (y el acceso directo, si lo tiene), el error en 12 px `--aegis-err` y el pie con «Cancelar» (con el foco) y «Borrar perfil» (principal, en blanco y negro). La del perfil en uso lleva a `about:deleteprofile`. Páginas: tarjeta de 680 (radio 14, relleno 24), avatar de 64 con el lápiz en un círculo de 28 (`--aegis-menu`, borde de línea fuerte), título de 24, campo de 34, interruptor de 34 × 20 y pie de 38 con el secundario a la izquierda y el principal (también «Eliminar»: avisa el texto) a la derecha; lo que se borra, en filas de 44 separadas por la línea dentro de un recuadro de radio 12. Sin los temas de Firefox: el tema y el énfasis se eligen en Ajustes › Apariencia |

## 10. Escritura

- Español de España, de **tú**, frases cortas y directas, sin signos de exclamación. Palabra normal antes que
  tecnicismo.
- Botones con verbos que dicen lo que pasa: «Bloquear», «Desactivar en este sitio», «Borrar datos del sitio».
- Errores en dos partes: qué ha pasado y qué hacer, sin culpar al usuario.
- Comillas «latinas», puntos suspensivos «…», unidades con espacio («80 %», «16 GB»).
- Honestidad: lo que Aegis no protege se dice («Aegis anónimo no es Tor Browser»).

## 11. Lo que nunca se hace

- Colores de marca, degradados de color o brillos; teñir la interfaz con el color de la web. Los degradados
  **monocromos** sí se permiten donde están definidos: el marco, el filo de la pestaña activa y el icono de la app; con
  un énfasis de color elegido por el usuario, el marco, el filo y el fondo «Énfasis» de la nueva pestaña llevan su
  tinte suave (§2), nunca otro color. Un personalizado con degradado lleva su segundo color **solo** ahí (y en su
  muestra partida); todo lo demás usa el primero, sólido. Tampoco es decoración el espectro del selector del énfasis
  personalizado (§9): la barra de tono y los extremos del cuadro de saturación y brillo (`--aegis-espectro*`, en
  `tokens.css`) son el contenido que se elige, y solo salen ahí.
- Emojis, iconos de colores, iconografía mezclada. Única excepción: el glifo y el punto de un contenedor, y la etiqueta,
  la línea y el glifo de un grupo de pestañas, van en el color que les ha dado el usuario (§2, §9).
- Más de una acción principal por pantalla.
- Mayúsculas fuera de las etiquetas de sección.
- Bordes dobles o de más de 1 px (salvo el anillo de foco de §5), sombras de color, radios fuera de la escala.
- Animaciones en reposo, rebotes o más de 300 ms.
- Translucidez sin desenfoque, colores fijos fuera de `tokens.css` (salvo `aegis-enfasis.css`, la única hoja con colores
  escritos fuera de él: se carga antes de que haya perfil, donde no llega `tokens.css`, y solo puede llevar sus colores;
  lo comprueba `verificar.py`).
- Texto por debajo de 11 px o grises más claros que el apagado.
- Publicidad, sugerencias patrocinadas, «novedades» que interrumpen o insignias que piden atención.
- Dos protecciones a la vista: la protección contra rastreo de Firefox trabaja por debajo de los Escudos, pero ni su
  tarjeta, ni su contador, ni su interruptor, ni about:protections salen como algo aparte; todo lleva a los Escudos.

## 12. Revisión visual (lista de comprobación)

1. ¿Solo blanco, negro y grises, con color únicamente en el contenido, en estados reales con texto, en el énfasis
   elegido o en el color de un contenedor (glifo, punto y tinte) o de un grupo de pestañas (etiqueta, línea, glifo y
   tinte), nunca en texto, en sus usos?
2. ¿Bien en **oscuro y en claro**, a 100, 125, 150 y 200 %, en modo Estándar, Workflow y compacto?
3. ¿Inter en la escala y pesos de §3? ¿Cifras tabulares donde cambian?
4. ¿Rejilla de 4, radios de la escala y concéntricos, bordes de 1 px?
5. ¿Una sola acción principal?
6. ¿Movimiento de §7, con OutCubic, nada en reposo y reducir movimiento respetado?
7. ¿Contraste AA, foco visible y teclado?
8. ¿Textos de tú, cortos, con mayúscula solo inicial?
9. ¿Se ve igual que el resto de Aegis?
