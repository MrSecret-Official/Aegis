// Aegis · énfasis de color y nueva pestaña (docs/DISENO.md §2 «Énfasis» y §9; enfasis.sys.mjs y
// paginas/personalizar.sys.mjs). Se cambian en Ajustes › Apariencia o en «Personalizar» de la nueva pestaña.

// Énfasis: «monocromo» (de serie), «windows» (el color de énfasis de Windows), «fondo» (el color del fondo de
// escritorio, calculado en el equipo; nada sale de él), un tema fijo (hielo, pizarra, salvia, ambar, coral, lavanda,
// malva, cobalto, piedra, laguna, musgo, frambuesa, ciruela) o «propio», el personalizado que crea el usuario con el
// «+». Cambia la selección, el foco, los interruptores, el filo de la pestaña activa y el degradado del marco.
pref("aegis.enfasis", "monocromo");
// El énfasis personalizado tiene dos prefs más, a propósito SIN valor de serie aquí (solo existen cuando el usuario
// usa o guarda uno, en su perfil; ni se sincronizan ni salen del equipo):
// - aegis.enfasis.propio: el que está en uso, en JSON: {"c": "#rrggbb"} o, con degradado, {"c": "#rrggbb", "c2":
//   "#rrggbb"}, y un nombre opcional ("n");
// - aegis.enfasis.guardados: «Mis énfasis», una lista JSON de los mismos objetos, como mucho 24.
// Sin valor de serie, Gecko no copia su valor a los procesos de las webs ni a los precargados (Preferences.cpp,
// ShouldSanitizePreference, con fission.omitBlocklistedPrefsInSubprocesses; tools/verificar.py comprueba las dos cosas).
// Los demás procesos sí lo reciben, como cualquier pref: el de las páginas privilegiadas (privilegedabout), un
// privilegedmozilla creado en frío, el de las extensiones y el de file://. Es el modelo de Gecko: solo un proceso
// comprometido podría leerlo, y una web nunca. Los nombres y «Mis énfasis» llegan a la nueva pestaña por mensaje, no
// por la pref. Las valida enfasis-propio.sys.mjs (lo que no es válido no se aplica).

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
