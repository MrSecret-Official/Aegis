// Aegis · webs en oscuro (overlay/browser/components/aegis/webs-oscuro): las webs se adaptan al tema oscuro de Aegis con
// el motor de Dark Reader, que va dentro del navegador (nada se descarga).

// «apagado» (de serie), «todas» o «sin_modo_oscuro» (solo las webs que no traen su propio modo oscuro). Se elige en
// Ajustes › Apariencia. Apagado de serie: cambiar el aspecto de una web deja rastro que la web puede ver (estilos y
// atributos de Dark Reader en su página), así que es una huella más; lo explica docs/PRIVACIDAD.md.
pref("aegis.webs_oscuro", "apagado");
