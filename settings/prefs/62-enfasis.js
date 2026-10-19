// Aegis · énfasis de color y nueva pestaña (docs/DISENO.md §2 «Énfasis» y §9; enfasis.sys.mjs y
// paginas/personalizar.sys.mjs). Se cambian en Ajustes › Apariencia o en «Personalizar» de la nueva pestaña.

// Énfasis: «monocromo» (de serie), «windows» (el color de énfasis de Windows), «fondo» (el color del fondo de
// escritorio, calculado en el equipo; nada sale de él) o un tema fijo: hielo, pizarra, salvia, ambar, coral, lavanda,
// malva. Cambia la selección, el foco, los interruptores, el filo de la pestaña activa y el degradado del marco.
pref("aegis.enfasis", "monocromo");

// Nueva pestaña. Fondo: «liso» (el de la interfaz), «degradado» (el del marco), «enfasis» (un degradado suave del
// énfasis) o «imagen» (una imagen del disco, que se guarda en el perfil y no sale del equipo).
pref("aegis.nuevapestana.fondo", "liso");
// Posición del buscador y los accesos: «centro» (como de serie) o «arriba» (el bloque arriba, como Brave).
pref("aegis.nuevapestana.posicion", "centro");
// Accesos encima («arriba», como Brave) o debajo («abajo») del buscador.
pref("aegis.nuevapestana.accesos", "arriba");
// Separación en px entre las losetas de los accesos y el buscador (los nombres de los accesos quedan dentro): de 36
// (como Brave) a 64 (la de siempre de Aegis), de 4 en 4.
pref("aegis.nuevapestana.espaciado", 64);
// Ancho en px del buscador de la nueva pestaña: de 416 (el de Brave) a 600 (el de siempre de Aegis), de 8 en 8. En
// una ventana estrecha nunca pasa del ancho de la página.
pref("aegis.nuevapestana.ancho", 600);
