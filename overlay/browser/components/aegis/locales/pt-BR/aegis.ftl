# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

## Botão de modo na barra (Padrão / Workflow)

aegis-modo-button =
    .label = Modo
    .tooltiptext = Alternar entre os modos Padrão e Workflow

## Painel de favoritos no painel lateral

aegis-marcadores-ventana =
    .title = Gerenciar em uma janela
aegis-marcadores-todos =
    .label = Todos os favoritos
aegis-marcadores-ordenar =
    .title = Ordenar
aegis-marcadores-orden-propio =
    .label = Sua ordem
aegis-marcadores-orden-nombre =
    .label = Nome (A–Z)
aegis-marcadores-orden-recientes =
    .label = Mais recentes primeiro
aegis-marcadores-vista =
    .title = Visualização compacta
aegis-marcadores-editar =
    .title = Editar favoritos ao clicar
aegis-marcadores-nueva-carpeta =
    .label = Nova pasta
aegis-marcadores-anadir-pestana =
    .label = Adicionar aba atual

## Página de configurações: cabeçalho do painel lateral e grupos de categorias

aegis-ajustes-titulo = Configurações
aegis-ajustes-grupo-personal = Pessoal
aegis-ajustes-grupo-navegacion = Navegação
aegis-ajustes-grupo-privacidad = Privacidade
aegis-ajustes-grupo-sistema = Sistema
aegis-ajustes-no-predeterminado =
    .message = { -brand-short-name } não é o seu navegador padrão.

## Configurações › Aparência: ícone do aplicativo (Windows)

aegis-icono-titulo = Ícone do aplicativo
aegis-icono-descripcion = Aparece nas janelas do { -brand-short-name }. As janelas privativas sempre usam o fantasma com o buraco da fechadura.
aegis-icono-fantasma = Fantasma
aegis-icono-uroboros = Ouroboros

## Escudos (painel da barra de endereços)

aegis-escudos-boton =
    .tooltiptext = { $count ->
        [0] Escudos ativos
        [one] Escudos ativos: 1 bloqueado nesta página
       *[other] Escudos ativos: { $count } bloqueados nesta página
    }
aegis-escudos-boton-bajados =
    .tooltiptext = Escudos desativados neste site
aegis-escudos-activos-sitio = Escudos ativos neste site
aegis-escudos-bajados-sitio = Escudos desativados neste site
aegis-escudos-contador = { $count ->
        [one] anúncio ou rastreador bloqueado nesta página
       *[other] anúncios e rastreadores bloqueados nesta página
    }
aegis-escudos-contador-bajados = Os Escudos estão desativados: nada é bloqueado neste site.
aegis-escudos-total = { $total ->
        [one] 1 bloqueio desde que você instalou o { -brand-short-name }
       *[other] { $total } bloqueios desde que você instalou o { -brand-short-name }
    }
aegis-escudos-avanzadas = Opções avançadas
aegis-escudos-rastreadores = Rastreadores e anúncios
aegis-escudos-nivel-normal = Normal
aegis-escudos-nivel-estricto = Rigoroso
aegis-escudos-nivel-estricto-mas = Rigoroso+
aegis-escudos-personalizado = Personalizado
aegis-escudos-global = Em todos os sites
aegis-escudos-ver-bloqueado = Bloqueados nesta página
aegis-escudos-https = Usar HTTPS nas conexões
aegis-escudos-https-activo = Somente HTTPS neste site
aegis-escudos-https-excepcion = Este site pode abrir sem criptografia
aegis-escudos-https-apagado = O modo somente HTTPS está desativado nas Configurações
aegis-escudos-scripts = Bloquear scripts
aegis-escudos-scripts-pronto = Em breve
aegis-escudos-huella = Impressão digital
aegis-escudos-cookies = Cookies de terceiros
aegis-escudos-cookies-entre-sitios = Bloquear rastreio
aegis-escudos-cookies-todas = Bloquear todos
aegis-escudos-olvidar = Esquecer este site ao fechar
aegis-escudos-olvidar-detalle = Apaga os cookies e dados dele ao fechar o { -brand-short-name }
aegis-escudos-olvidar-privada = Uma janela privativa já esquece tudo ao ser fechada
aegis-escudos-listas = Listas de filtros
aegis-escudos-configuracion = Configurações gerais
aegis-escudos-pie = Se este site não funcionar direito, desative os Escudos nele. Isso reduz a proteção.
aegis-escudos-lista-titulo = Bloqueados nesta página
aegis-escudos-atras =
    .aria-label = Voltar
aegis-escudos-cat-rastreadores = Rastreadores e anúncios
aegis-escudos-cat-anuncios = Anúncios (listas de filtros)
aegis-escudos-cat-sociales = Rastreadores de redes sociais
aegis-escudos-cat-huella = Impressão digital
aegis-escudos-cat-criptomineros = Criptomineradores
aegis-escudos-lista-vacia = Nada foi bloqueado nesta página.

## Página de configurações: nomes do Aegis no lugar dos do Firefox

aegis-ajustes-general = Geral
aegis-ajustes-inicio-predeterminado =
    .label = Início do { -brand-short-name } (padrão)
aegis-ajustes-inicio =
    .label = Início do { -brand-short-name }
aegis-ajustes-inicio-aviso =
    .message = Para usar esses recursos, abra novas abas ou novas janelas com o Início do { -brand-short-name }.
aegis-ajustes-personalizar-inicio =
    .label = Personalizar Início do { -brand-short-name }

## Complementos (about:addons): cabecera de la barra lateral, buscador y estado vacío de Extensiones.

aegis-complementos-titulo = Extensões
# Texto de ayuda del buscador: abre la tienda de complementos en una pestaña.
aegis-complementos-buscar = Pesquisar extensões na web
aegis-complementos-vacio = Você ainda não tem extensões.
aegis-complementos-vacio-boton = Procurar extensões
# Panel de extensiones de la barra (la pieza de puzle) sin ninguna instalada: título, frase y, debajo, el botón
# aegis-complementos-vacio-boton, que abre la tienda de complementos en una pestaña.
aegis-extensiones-vacio-titulo = Você ainda não tem extensões
aegis-extensiones-vacio-texto = Procure-as na loja de extensões.
# Panel de extensiones con extensiones (al estilo de Chrome y Brave). Etiquetas de sección (se ven en MAYÚSCULAS):
# las fijadas en la barra de herramientas y, debajo, las que se ven solo dentro del panel.
aegis-extensiones-en-barra = Na barra
aegis-extensiones-en-panel = Neste painel
# Botón de la chincheta de cada extensión (texto de ayuda y para lectores de pantalla). Dice lo que hace al pulsarlo.
# Variables:
#   $nombre (String) - nombre de la extensión
aegis-extensiones-fijar = Fixar { $nombre } na barra
aegis-extensiones-desfijar = Desafixar { $nombre } da barra
# Pie del panel: abre Complementos › Extensiones (about:addons) y la tienda de complementos en una pestaña.
aegis-extensiones-gestionar = Gerenciar extensões
aegis-extensiones-anadir = Adicionar extensões

## Barra lateral y barra de marcadores

# Pie de «Personalizar barra lateral»: abre los Ajustes del navegador.
aegis-barra-ajustes = Configurações do { -brand-short-name }
# Botón junto al aviso de la barra de marcadores vacía: la oculta mientras no tenga marcadores (vuelve sola con el primero).
aegis-marcadores-aviso-cerrar = Agora não
    .title = Ocultar a barra de favoritos enquanto estiver vazia

## Contraseñas (about:logins): estado vacío. La bóveda propia llegará más adelante.

aegis-contrasenas-vacio = As senhas que você salvar ao entrar em um site vão aparecer aqui.
aegis-contrasenas-importar = Importar senhas

## Contraseñas: protección (contrasenas.sys.mjs), panel de la barra lateral (contrasenas-panel.sys.mjs) y aviso de
## about:logins. «Contraseña principal» es el término de Firefox (Primary Password): el mismo en todo el navegador.

# Botón del aviso del panel y de about:logins: abre el diálogo de la contraseña principal.
aegis-contrasenas-principal-crear = Criar senha principal
# Aviso del panel y de about:logins cuando no hay contraseña principal.
aegis-contrasenas-sin-principal = Sem senha principal: qualquer programa que copie seu perfil poderia ler as senhas salvas.
# Estado vacío del panel de la barra lateral.
aegis-contrasenas-panel-titulo = Suas senhas, a sete chaves
aegis-contrasenas-panel-texto = O { -brand-short-name } as guarda criptografadas neste dispositivo, protegidas pela sua senha principal, e nunca as envia a lugar nenhum.

## Ajustes › Contraseñas y autorrelleno: «Cierre automático de la bóveda» (ajustes.sys.mjs), detrás de «Contraseñas». Segmentos:
## Nunca, 15, 10, 5, 3, 2 y 1 min; caben siete en una fila, así que las etiquetas son cortas.

aegis-bloqueo-titulo = Bloquear senhas automaticamente
aegis-bloqueo-descripcion = Depois desse tempo sem usar o computador, as senhas salvas são bloqueadas e o { -brand-short-name } pede a senha principal de novo. Elas também são bloqueadas quando o computador entra em suspensão e quando você fecha o { -brand-short-name }.
aegis-bloqueo-nunca-aviso = Com “Nunca”, elas só são bloqueadas quando você fecha o { -brand-short-name } ou o computador entra em suspensão.
aegis-bloqueo-sin-principal = Só tem efeito com uma senha principal.
aegis-bloqueo-nunca = Nunca
# Cada segmento con minutos. $minutos: 1, 2, 3, 5, 10 o 15.
aegis-bloqueo-minutos = { $minutos } min

## Diálogo de la contraseña principal (dialogos/contrasena-principal.xhtml), en lugar del de Firefox: crearla
## (antes de guardar la primera contraseña, desde el panel, about:logins o Ajustes) o cambiarla (Ajustes). Ancho
## fijo de 440 px: los textos largos pasan a otra línea.

# Título de la ventana o del marco del diálogo (Ajustes lo muestra arriba).
aegis-principal-ventana = Senha principal
aegis-principal-titulo-crear = Crie sua senha principal
aegis-principal-titulo-cambiar = Altere sua senha principal
# Antes de guardar la primera contraseña (botones «No guardar» y «Crear y guardar»).
aegis-principal-explicacion-guardar = Para salvar senhas, o { -brand-short-name } as criptografa com uma senha principal. Sem ela, qualquer programa que copie seu perfil poderia lê-las. Ela será pedida uma vez por sessão e de novo depois de um tempo sem usar o computador.
# Desde el aviso del panel o de about:logins, o desde Ajustes.
aegis-principal-explicacion-crear = O { -brand-short-name } a usa para criptografar as senhas que você salva. Sem ela, qualquer programa que copie seu perfil poderia lê-las. Ela será pedida uma vez por sessão e de novo depois de um tempo sem usar o computador.
aegis-principal-explicacion-cambiar = Para alterá-la, você precisa da atual. Suas senhas salvas continuam aqui, protegidas pela nova.
# Si una política de empresa exige la contraseña principal.
aegis-principal-politica = Sua organização exige uma senha principal.
aegis-principal-actual = Senha principal atual
aegis-principal-nueva = Senha principal
aegis-principal-nueva-cambiar = Nova senha principal
aegis-principal-repetir = Digite de novo
# Botón con el icono del ojo dentro de cada campo: muestra u oculta lo escrito.
aegis-principal-mostrar =
    .title = Mostrar senha
    .aria-label = Mostrar senha
# Debajo del campo, antes de escribir: el mínimo de Aegis.
aegis-principal-requisito = Pelo menos 12 caracteres. Uma frase de quatro ou mais palavras é fácil de lembrar e difícil de adivinhar.
# Mientras se escribe, lo que falta o el nivel. $faltan: caracteres que faltan para llegar a 12.
aegis-principal-corta =
    { $faltan ->
        [one] Curta demais: falta { $faltan } caractere.
       *[other] Curta demais: faltam { $faltan } caracteres.
    }
aegis-principal-comun = Fácil demais de adivinhar: evite palavras e senhas muito usadas.
aegis-principal-secuencia = Fácil demais de adivinhar: evite sequências como “1234” ou “qwerty”.
aegis-principal-repetida = Fácil demais de adivinhar: tem repetições demais.
aegis-principal-variedad = Fácil demais de adivinhar: use mais caracteres diferentes.
aegis-principal-aceptable = Força: aceitável. Mais longa seria melhor.
aegis-principal-fuerte = Força: forte.
aegis-principal-muy-fuerte = Força: muito forte.
aegis-principal-no-coinciden = As senhas não coincidem.
aegis-principal-error-actual = A senha atual está incorreta. Digite de novo.
aegis-principal-error = Não foi possível salvar a senha principal. Tente de novo.
# Tarjeta de aviso: no se puede recuperar (restablecerla en Firefox borra las contraseñas guardadas).
aegis-principal-olvido-titulo = Se você esquecê-la, não dá para recuperar
aegis-principal-olvido-texto = O { -brand-short-name } não a guarda em lugar nenhum e ninguém pode enviá-la a você. Para começar de novo, seria preciso redefini-la, e isso apaga todas as senhas salvas.
# La línea de honestidad: qué protege y qué no.
aegis-principal-limites = Protege suas senhas se alguém copiar seu perfil, usar outra conta deste computador ou levar o disco. Não as protege de um programa malicioso que já controle seu computador: ele poderia registrar o que você digita, inclusive esta senha.
# Botones. «No guardar» y «Crear y guardar», antes de guardar; los demás, desde Ajustes, el panel o about:logins.
aegis-principal-no-guardar = Não salvar
aegis-principal-cancelar = Cancelar
aegis-principal-crear-guardar = Criar e salvar
aegis-principal-crear = Criar senha
aegis-principal-cambiar = Alterar senha

## Códigos de verificación (autenticador/): panel de contraseñas, about:logins, el autorrelleno y el diálogo para
## añadirlos (dialogos/autenticador.xhtml). «Código de verificación» es el código de 6 u 8 cifras de la verificación
## en dos pasos (TOTP); «clave de configuración», el texto que da la web para configurarlo (glosario).

# Panel de contraseñas: título de la sección plegable.
aegis-codigos-titulo = Códigos de verificação
aegis-codigos-vacio = Salve aqui o código de verificação em duas etapas de uma conta e o { -brand-short-name } vai gerar os códigos dela.
# Botón compacto del panel: abre el diálogo para añadir uno.
aegis-codigos-anadir = Adicionar código
# Botones de icono de cada fila del panel. $sitio: el dominio («github.com»).
aegis-codigos-ver =
    .title = Mostrar o código de { $sitio }
    .aria-label = Mostrar o código de { $sitio }
aegis-codigos-copiar =
    .title = Copiar o código de { $sitio }
    .aria-label = Copiar o código de { $sitio }
aegis-codigos-editar =
    .title = Alterar ou remover o código de { $sitio }
    .aria-label = Alterar ou remover o código de { $sitio }
# Junto al código a la vista: segundos que le quedan. Cabe en poco: «18 s».
aegis-codigos-restante = { $segundos } s
# Tras copiar. $segundos: tras cuántos segundos se borra (30 de serie).
aegis-codigos-copiado = Código copiado. Ele será apagado da área de transferência em { $segundos } s se ainda estiver lá.
aegis-codigos-copiado-sin-borrar = Código copiado.
aegis-codigos-ilegible = Não é possível ler este código. Adicione-o de novo.
# Mensaje y título del diálogo de Windows Hello al ver o copiar un código.
aegis-codigos-autenticacion-ver = Para ver o código de verificação, digite suas credenciais do Windows. Isso ajuda a proteger suas contas.
aegis-codigos-autenticacion-copiar = Para copiar o código de verificação, digite suas credenciais do Windows. Isso ajuda a proteger suas contas.
aegis-codigos-autenticacion-titulo = { -brand-short-name }
# about:logins: la fila de la contraseña elegida y sus botones compactos.
aegis-codigos-etiqueta = Código de verificação
aegis-codigos-ninguno = Sem código de verificação
aegis-codigos-boton-mostrar = Mostrar
aegis-codigos-boton-ocultar = Ocultar
aegis-codigos-boton-copiar = Copiar
aegis-codigos-boton-cambiar = Alterar
aegis-codigos-boton-anadir = Adicionar
# Autorrelleno: el panelito junto al campo del código en la web. $sitio: el dominio.
aegis-codigos-ofrecer-titulo = Código de verificação
aegis-codigos-ofrecer-texto = O { -brand-short-name } tem o código de { $sitio }.
aegis-codigos-rellenar = Preencher o código
# Con varias cuentas en el sitio. $cuenta: el usuario (o un número).
aegis-codigos-rellenar-cuenta = Preencher o código de { $cuenta }
# Panel de contraseñas (solo Windows): sección «Passkeys». No prometer sincronización.
aegis-passkeys-titulo = Chaves de acesso
aegis-passkeys-texto = As chaves de acesso (passkeys) que você cria em um site ficam no Windows Hello, neste computador. Se ele tiver um chip de segurança (TPM), a chave privada não sai dele; se não, o Windows a protege por software. O { -brand-short-name } não a vê nem a copia. As do Windows Hello não são sincronizadas com outros computadores; se, no aviso do Windows, você escolher outro provedor de chaves de acesso, elas ficam onde ele indicar.
# Abre la Configuración de Windows › Cuentas › Claves de acceso.
aegis-passkeys-gestionar = Gerenciar no Windows
# Diálogo para añadir, cambiar o quitar un código de verificación.
aegis-autenticador-ventana = Código de verificação
aegis-autenticador-titulo = Adicionar código de verificação
aegis-autenticador-titulo-editar = Código de verificação
aegis-autenticador-explicacion = Quando um site pedir para configurar um app autenticador, leia aqui o código QR ou copie a chave de configuração. O { -brand-short-name } vai gerar os códigos neste computador.
aegis-autenticador-cuenta = Conta
# Primera opción del desplegable de cuentas.
aegis-autenticador-elige = Escolha uma conta salva
aegis-autenticador-sin-cuentas = Primeiro salve a senha dessa conta no { -brand-short-name }.
aegis-autenticador-existe = Esta conta já tem um código de verificação. Se você salvar outra chave, ela substitui a anterior.
aegis-autenticador-clave = Chave de configuração ou link otpauth://
# Botón del ojo dentro del campo de la clave.
aegis-autenticador-mostrar =
    .title = Mostrar a chave
    .aria-label = Mostrar a chave
# Botones compactos para leer el código QR (en el equipo, sin red).
aegis-autenticador-qr-pagina = Ler o QR desta página
aegis-autenticador-qr-imagen = Ler o QR de uma imagem…
# Título del selector de archivos.
aegis-autenticador-qr-imagen-titulo = Escolha uma imagem com o código QR
aegis-autenticador-qr-no = Nenhum código QR encontrado. Deixe o código inteiro visível e tente de novo.
aegis-autenticador-qr-otro = Esse código QR não é de um app autenticador.
# La clave es válida. $emisor: quien la da; $digitos: 6–8; $periodo: segundos (30).
aegis-autenticador-valida = { $emisor }: { $digitos } dígitos a cada { $periodo } s.
aegis-autenticador-valida-sin-emisor = Chave válida: { $digitos } dígitos a cada { $periodo } s.
aegis-autenticador-error-formato = Não é uma chave válida. Copie a chave de configuração ou o link otpauth:// completo.
aegis-autenticador-error-hotp = Códigos por contador (HOTP) não são aceitos, só os baseados em tempo (TOTP).
aegis-autenticador-error-corta = A chave é curta demais para ser segura.
aegis-autenticador-error-parametros = Este código usa um formato não aceito (dígitos ou período incomuns).
aegis-autenticador-error-guardar = Não foi possível salvar o código. Tente de novo.
# La tarjeta de honestidad: los dos pasos juntos en la bóveda.
aegis-autenticador-honestidad-titulo = As duas etapas no mesmo lugar
aegis-autenticador-honestidad = Salvar o código junto com a senha reúne as duas etapas no { -brand-short-name }: quem desbloqueasse suas senhas teria as duas. Elas são protegidas pela sua senha principal e pela verificação de identidade ao ver ou copiar um código. Para suas contas mais importantes, um autenticador em outro dispositivo é mais seguro.
# Quitar pide dos pulsaciones: la segunda con «-confirmar» y el aviso.
aegis-autenticador-quitar = Remover o código
aegis-autenticador-quitar-confirmar = Remover definitivamente
aegis-autenticador-quitar-aviso = Antes de remover, confirme que você consegue entrar de outra forma (por exemplo, com os códigos de recuperação do site).
aegis-autenticador-cancelar = Cancelar
aegis-autenticador-guardar = Salvar

## Énfasis de color (Ajustes › Apariencia y «Personalizar» de la nueva pestaña)

aegis-enfasis-titulo = Destaque
aegis-enfasis-descripcion = A cor da seleção, do foco, dos interruptores, da borda da aba ativa e do degradê da moldura.
aegis-enfasis-automatico = “Cor do Windows” e “Plano de fundo” mudam sozinhos quando você os muda no Windows. O plano de fundo é lido neste computador e não sai dele.
aegis-enfasis-monocromo = Monocromático
aegis-enfasis-windows = Cor do Windows
aegis-enfasis-fondo = Plano de fundo
aegis-enfasis-hielo = Gelo
aegis-enfasis-pizarra = Ardósia
aegis-enfasis-salvia = Sálvia
aegis-enfasis-ambar = Âmbar
aegis-enfasis-coral = Coral
aegis-enfasis-lavanda = Lavanda
aegis-enfasis-malva = Malva
aegis-enfasis-cobalto = Cobalto
aegis-enfasis-piedra = Pedra
aegis-enfasis-laguna = Lagoa
aegis-enfasis-musgo = Musgo
aegis-enfasis-frambuesa = Framboesa
aegis-enfasis-ciruela = Ameixa

## Énfasis personalizado: el «+» de los selectores y su ventana («Crear» y «Mis énfasis»)

# Nombre de la opción del «+» en Ajustes y principio de sus etiquetas.
aegis-enfasis-propio = Sob medida
# Etiqueta (y descripción emergente) del «+» sin ningún personalizado en uso.
aegis-enfasis-propio-abrir = Sob medida: crie um ou escolha um salvo
# El «+» con un personalizado en uso. $nombre: su nombre o sus códigos (p. ej. #88C0DC)
aegis-enfasis-propio-abrir-activo = Sob medida: { $nombre }
# Línea del elegido, bajo las muestras de la nueva pestaña. $nombre: su nombre o sus códigos
aegis-enfasis-propio-actual = Sob medida: { $nombre }
aegis-enfasis-propio-titulo = Destaque personalizado
aegis-enfasis-propio-cerrar = Fechar
# Las dos pestañas de la ventana.
aegis-enfasis-propio-crear = Criar
aegis-enfasis-propio-mis = Meus destaques
aegis-enfasis-propio-degradado = Degradê
aegis-enfasis-propio-degradado-ayuda = Uma segunda cor para a moldura da janela e a borda da aba ativa. O resto usa a primeira.
# Para lectores de pantalla: los dos segmentos que eligen qué color se edita.
aegis-enfasis-propio-editando = Cor que você está editando
aegis-enfasis-propio-color-1 = Primeira cor
aegis-enfasis-propio-color-2 = Segunda cor
# El cuadro de color, para lectores de pantalla. $saturacion y $brillo: de 0 a 100
aegis-enfasis-propio-area = Saturação e brilho
aegis-enfasis-propio-area-valor = Saturação { $saturacion }%, brilho { $brillo }%
aegis-enfasis-propio-tono = Matiz
# Campo del color en hexadecimal (#RRGGBB).
aegis-enfasis-propio-hex = Código
aegis-enfasis-propio-hex-error = Digite uma cor em hexadecimal, como #88C0DC.
aegis-enfasis-propio-nombre = Nome
aegis-enfasis-propio-nombre-ejemplo = Opcional
aegis-enfasis-propio-vista = Prévia
aegis-enfasis-propio-ajuste = O { -brand-short-name } ajusta o brilho e a intensidade para que fique legível no tema claro e no escuro.
aegis-enfasis-propio-guardar = Salvar
aegis-enfasis-propio-usar = Usar
aegis-enfasis-propio-guardado = Salvo em “Meus destaques”.
aegis-enfasis-propio-actualizado = Já estava em “Meus destaques”.
# $maximo: cuántos se pueden guardar (24)
aegis-enfasis-propio-lleno = Você já tem { $maximo } salvos. Exclua algum em “Meus destaques” para salvar outro.
# $cuantos: los guardados; $maximo: el límite (24)
aegis-enfasis-propio-cuenta = { $cuantos } de { $maximo }
# Supr (Delete): la tecla que borra el guardado con el foco.
aegis-enfasis-propio-mis-ayuda = Escolha um para usá-lo. Delete o exclui.
aegis-enfasis-propio-sin-nombre = Sem nome
aegis-enfasis-propio-editar = Editar
aegis-enfasis-propio-borrar = Excluir
# $nombre: el nombre del guardado (o el texto de «sin nombre»)
aegis-enfasis-propio-borrar-pregunta = Excluir “{ $nombre }”? Não é possível desfazer.
aegis-enfasis-propio-borrar-confirmar = Excluir
aegis-enfasis-propio-cancelar = Cancelar
aegis-enfasis-propio-borrado = “{ $nombre }” foi excluído.
aegis-enfasis-propio-vacio-titulo = Nenhum salvo ainda
# Estado vacío de «Mis énfasis». $maximo: cuántos se pueden guardar (24)
aegis-enfasis-propio-vacio = Crie um destaque e clique em “Salvar”: ele aparece aqui para usar com um clique. Cabem { $maximo }.
aegis-enfasis-propio-ir-crear = Criar um

## Nueva pestaña › Personalizar: fondo, diseño (buscador, accesos y espaciado)

aegis-np-fondo-titulo = Fundo
aegis-np-fondo-liso = Liso
aegis-np-fondo-degradado = Degradê
aegis-np-fondo-enfasis = Destaque
aegis-np-fondo-imagen = Imagem
aegis-np-imagen-cambiar = Trocar imagem…
aegis-np-imagen-error = Não foi possível usar essa imagem. Tente outra JPG, PNG, WebP, AVIF ou GIF com menos de 20 MB.
aegis-np-diseno-titulo = Disposição
aegis-np-buscador = Mostrar a pesquisa
aegis-np-posicion = Posição da pesquisa
aegis-np-posicion-centro = No centro
aegis-np-posicion-arriba = Mais acima
aegis-np-accesos = Atalhos
aegis-np-accesos-arriba = Acima da pesquisa
aegis-np-accesos-abajo = Abaixo da pesquisa
aegis-np-espaciado = Espaçamento
# $px: número de píxeles
aegis-np-espaciado-valor = { $px } px
aegis-np-ancho = Largura da barra de pesquisa

## Menu de mecanismos de pesquisa da barra de endereços (a lupa)

# Linha exibida quando o mecanismo escolhido para esta pesquisa não é o padrão. $buscador: nome do mecanismo, p. ex. Google
aegis-buscador-predeterminado = Usar { $buscador } como padrão

## Nova aba › Adicionar ou editar um atalho: o logotipo do site como imagem do atalho

# Link ao lado de “Usar uma imagem personalizada”. Procura o ícone do site (primeiro no dispositivo, depois no próprio site) e o define como imagem personalizada.
aegis-logo-usar = Usar o logotipo do site
aegis-logo-buscando = Procurando o logotipo…
aegis-logo-sin-direccion = Digite primeiro o endereço do atalho.
aegis-logo-error = Não foi possível usar o logotipo deste site. Tente uma imagem personalizada.
aegis-logo-error-red = Não foi possível obter o logotipo do site. Verifique o endereço ou tente novamente mais tarde.

## Webs en oscuro (Ajustes › Apariencia y fila «Oscurecer este sitio» del panel de Escudos)

aegis-webs-oscuro-titulo = Sites em modo escuro
aegis-webs-oscuro-descripcion = Os sites se adaptam ao tema escuro do { -brand-short-name }. Só quando o { -brand-short-name } está com o tema escuro; imagens e vídeos não mudam.
aegis-webs-oscuro-aviso = Um site pode perceber que a aparência dele foi alterada.
aegis-webs-oscuro-apagado = Desativado
aegis-webs-oscuro-todas = Todos os sites
aegis-webs-oscuro-sin-modo-oscuro = Só os que não têm modo escuro
aegis-escudos-oscuro = Escurecer este site
aegis-escudos-oscuro-activo = Se adapta ao tema escuro
aegis-escudos-oscuro-propio = Este site já tem modo escuro
aegis-escudos-oscuro-claro = Só quando o { -brand-short-name } está com o tema escuro
aegis-escudos-oscuro-excepcion = Não é escurecido neste site

## Painel dos Escudos: ajuste do buscador (busqueda-limpia.sys.mjs). Só aparece no DuckDuckGo ou no Bing.

aegis-escudos-ddg-anuncios = Remover os anúncios do DuckDuckGo
aegis-escudos-ddg-anuncios-apagado = Desativado: os Escudos ocultam os que reconhecem
aegis-escudos-ddg-anuncios-activo = Usa o ajuste do DuckDuckGo para não mostrá-los
aegis-escudos-bing-rewards = Ganhar pontos do Microsoft Rewards
aegis-escudos-bing-rewards-apagado = Desativado: sua atividade não é enviada e as pesquisas não ganham pontos
aegis-escudos-bing-rewards-activo = O Bing recebe sua atividade de pesquisa para somar pontos

## Impressão digital (Configurações › Privacidade, painel dos Escudos e aviso do Cofre)

aegis-huella-titulo = Impressão digital
aegis-huella-descripcion = O que os sites podem ler do seu navegador para reconhecer você sem cookies: tela, fontes, placa de vídeo, fuso horário e mais.
aegis-huella-nivel-basica = Básica
aegis-huella-nivel-basica-descripcion = Só a proteção que vem no navegador.
aegis-huella-nivel-equilibrada = Equilibrada
aegis-huella-nivel-equilibrada-descripcion = Oculta tudo o que pode sem quebrar os sites. Recomendada.
aegis-huella-nivel-estricta = Rigorosa
aegis-huella-nivel-estricta-descripcion = Oculta também a posição da janela, as fontes, as vozes e o que a placa de vídeo consegue fazer. Alguns sites podem falhar.
aegis-huella-nivel-caja-fuerte = Cofre
aegis-huella-nivel-caja-fuerte-descripcion = Oculta quase tudo o que a proteção sabe ocultar (não o tema escuro ou claro nem o tamanho da tela): os sites veem o horário UTC, inglês e 60 fps, não veem suas configurações de acessibilidade e o alto contraste deixa de valer neles. Para ler um canvas precisam pedir sua permissão, e você pode deixar um site ver os dados do navegador. Muitos sites vão falhar.
aegis-huella-nota = Nenhuma proteção é perfeita: os sites continuam vendo seu endereço IP, e o { -brand-short-name } não é o Tor Browser.
aegis-huella-permitidos-titulo = Sites com permissão no Cofre
aegis-huella-permitidos-vacio = Nenhum site tem permissão.
# $sitio: domínio do site, por exemplo exemplo.com
aegis-huella-quitar = Remover
    .aria-label = Remover { $sitio }
aegis-huella-apagada = Desativada na proteção contra rastreamento
aegis-huella-permitir-sitio = Permitir neste site
aegis-huella-permiso-no = Dados do navegador: bloqueados
aegis-huella-permiso-si = Dados do navegador: proteção equilibrada
aegis-huella-permiso-privada = Só em uma janela normal
aegis-huella-permiso-no-disponible = Não disponível para este endereço
# <> é substituído pelo nome do site (em negrito). Mantenha como está.
aegis-huella-aviso = <> tentou ler dados do seu navegador. O Cofre os ocultou.
aegis-huella-aviso-permitir =
    .label = Permitir neste site
    .accesskey = P
aegis-huella-aviso-bloquear =
    .label = Continuar bloqueando
    .accesskey = C

## Tor: «Nova janela privativa com Tor» (menu ☰, Shift+Alt+N), Configurações › Privacidade › Tor, o indicador da barra
## e about:privatebrowsing na instância com Tor. «Tor» e «Tor Browser» são nomes de outro projeto: não se traduzem.

aegis-tor-titulo = Tor
aegis-tor-descripcion = Abra janelas privativas que passam pela rede Tor: os sites não veem seu IP. É um { -brand-short-name } separado, com perfil próprio, apagado ao fechar, e não compartilha nada com suas outras janelas.
aegis-tor-honestidad = O { -brand-short-name } com Tor não é o Tor Browser: o { -brand-short-name } é mais fácil de distinguir que o Tor Browser, que parece o mesmo navegador para todos. Para um anonimato forte, use o Tor Browser. O que você abrir fora do navegador (um download aberto em outro programa, um link de e-mail) não passa pelo Tor.
aegis-tor-no-descargado = O Tor não foi baixado
# $tamano: megabytes, p. ex. 21,5; $origen: servidor, p. ex. dist.torproject.org
aegis-tor-origen = { $tamano } MB do Tor Project ({ $origen }). A impressão digital sha256 é verificada antes de instalar.
# $progreso: porcentagem
aegis-tor-descargando = Baixando… { $progreso }%
aegis-tor-comprobando = Verificando o pacote…
# $progreso: porcentagem
aegis-tor-extrayendo = Instalando… { $progreso }%
# $tor: versão do tor; $version: versão do pacote
aegis-tor-listo = Tor { $tor } baixado (pacote { $version })
aegis-tor-desactualizado = Há uma nova versão do Tor (pacote { $version })
aegis-tor-boton-descargar = Baixar o Tor
aegis-tor-boton-actualizar = Atualizar
aegis-tor-boton-cancelar = Cancelar
aegis-tor-boton-borrar = Apagar
aegis-tor-borrar-abierta = Feche as janelas com Tor para poder apagá-lo.
aegis-tor-abrir-titulo = Nova janela privativa com Tor
aegis-tor-abrir-detalle = Também pelo menu ou com Shift+Alt+N.
aegis-tor-boton-abrir = Abrir
aegis-tor-puentes-titulo = Pontes
aegis-tor-puentes-descripcion = Para redes que bloqueiam o Tor. Vale a partir da próxima janela com Tor.
aegis-tor-puentes-ninguno = Sem pontes
aegis-tor-puentes-obfs4 = obfs4
aegis-tor-puentes-snowflake = Snowflake
aegis-tor-nota-huella = A janela com Tor usa o Cofre: o Tor oculta seu IP, mas o que o navegador revela de si depende do { -brand-short-name }.
aegis-tor-nota-buscadores = Alguns mecanismos de pesquisa, como o Google, pedem captchas ou bloqueiam conexões que chegam pelo Tor. O DuckDuckGo funciona.
aegis-tor-instancia-texto = Esta é uma janela privativa com Tor: todo o tráfego passa pelo Tor e nada é guardado ao fechar.
aegis-tor-boton-identidad = Nova identidade
aegis-tor-error-descarga = Não foi possível baixar o Tor. Verifique a conexão e tente novamente.
aegis-tor-error-suma = O download não é o pacote esperado (a impressão digital sha256 não confere) e foi descartado. Tente novamente mais tarde.
aegis-tor-error-sin-descargar = O Tor não foi baixado: baixe-o em Configurações › Privacidade.
aegis-tor-error-arranque = O Tor não conseguiu iniciar. Se o Windows o bloqueou, permita-o e abra outra janela com Tor.
aegis-tor-error-caido = O Tor foi fechado. Feche esta janela e abra outra com Tor.
aegis-tor-aviso-red = O Tor está com problemas para conectar. Se sua rede bloqueia o Tor, experimente as pontes.
aegis-tor-red-arrancando = Tor: iniciando…
# $progreso: porcentagem
aegis-tor-red-conectando = Tor: conectando… { $progreso }%
aegis-tor-red-conectado = Tor: conectado
aegis-tor-red-error = Tor: sem conexão.
aegis-tor-red-parado = Tor: parado.
aegis-tor-privada-nota = Os sites veem um IP da rede Tor, não o seu. O { -brand-short-name } com Tor não é o Tor Browser.
aegis-tor-menu-ventana =
    .label = Nova janela privativa com Tor
aegis-tor-menu-identidad =
    .label = Nova identidade do Tor
aegis-tor-menu-ajustes =
    .label = Configurações do Tor
aegis-tor-ofrecer-titulo = Baixar o Tor
# $tamano: megabytes, p. ex. 21,5
aegis-tor-ofrecer-texto = Para abrir uma janela privativa com Tor é preciso o Tor, que não vem com o { -brand-short-name }. Serão baixados { $tamano } MB do Tor Project (dist.torproject.org) e a impressão digital será verificada antes de instalar no seu perfil.
aegis-tor-ofrecer-botones =
    .descargar = Baixar
aegis-tor-identidad-confirmar = Todas as janelas com Tor serão fechadas, tudo desta sessão será apagado e o Tor usará novos circuitos.
    .title = Nova identidade
    .aceptar = Nova identidade

## Google (Ajustes › Privacidad; google.sys.mjs). «Google» y «YouTube» son nombres propios: no se traducen.

aegis-google-titulo = Google
aegis-google-descripcion = A proteção contra rastreamento não age nos sites do Google nem do YouTube. Neles, o { -brand-short-name } corta os dados de uso e os anúncios, e os links dos resultados vão direto para o site.
# Mismo nombre que la sección «Google limpio» de about:escudos (escudos-ayuda-google-titulo).
aegis-google-limpio = Google limpo
aegis-google-limpio-detalle = O Google continua vendo seu IP, o que você pesquisa e, se você entrar na conta, quem você é.
# Pide a Google la vista «Web» (udm=14). Solo actúa con «Google limpio» encendido.
aegis-google-solo-web = Só resultados da web no Google
aegis-google-solo-web-detalle = Nas pesquisas feitas pela barra de endereços, sem respostas de IA nem módulos.

## Links para «Como funcionam os Escudos» (about:escudos)

# Pie del panel de Escudos: abre la página de ayuda en una pestaña.
aegis-escudos-ayuda = Como funcionam os Escudos
# Ajustes: enlace junto a cada opción de Escudos y de huella; abre la ayuda en su sección.
aegis-ayuda-rastreo = Saiba mais
    .aria-label = Saiba mais sobre a proteção contra rastreamento
aegis-ayuda-cookies = Saiba mais
    .aria-label = Saiba mais sobre os cookies de terceiros
aegis-ayuda-https = Saiba mais
    .aria-label = Saiba mais sobre o modo somente HTTPS
aegis-ayuda-olvidar = Saiba mais
    .aria-label = Saiba mais sobre esquecer sites ao fechar
aegis-ayuda-huella = Saiba mais
    .aria-label = Saiba mais sobre a impressão digital
aegis-ayuda-google = Saiba mais
    .aria-label = Saiba mais sobre o Google limpo

## Escudos: molestias, excepciones por sitio y Ajustes › Escudos (escudos.sys.mjs, escudos/ajustes.sys.mjs)

aegis-escudos-molestia-activa = Ocultos em todos os sites
aegis-escudos-molestia-apagada = Desativado em todos os sites
aegis-escudos-molestia-permitida-sitio = Permitidos neste site

aegis-escudos-excepciones-sitio = Exceções deste site…
aegis-escudos-excepciones-ninguna = Nenhuma

aegis-escudos-grupo-anuncios = Anúncios
aegis-escudos-grupo-rastreadores = Rastreadores
aegis-escudos-grupo-cookies-avisos = Avisos de cookies
aegis-escudos-grupo-molestias = Pop-ups e banners
aegis-escudos-grupo-antiadblock = Avisos antibloqueador
aegis-escudos-grupo-cosmetico = Elementos ocultos
aegis-escudos-grupo-scriptlets = Scripts das listas

aegis-ajustes-escudos = Escudos
aegis-ajustes-escudos-descripcion = O que os Escudos bloqueiam em todos os sites e as exceções de cada site.

aegis-ajustes-escudos-nivel-titulo = Nível
aegis-ajustes-escudos-nivel-descripcion = Quanto os Escudos bloqueiam em todos os sites. É o mesmo ajuste do painel.
aegis-ajustes-escudos-nivel-normal = Normal
aegis-ajustes-escudos-nivel-normal-descripcion = Bloqueia rastreadores conhecidos e anúncios das listas de filtros. Quase nenhum site quebra.
aegis-ajustes-escudos-nivel-estricto = Rigoroso
aegis-ajustes-escudos-nivel-estricto-descripcion = Também bloqueia vídeos, comentários e botões de redes sociais que rastreiam, e remove dos links os dados de rastreamento. Alguns sites podem ficar incompletos.
aegis-ajustes-escudos-nivel-estricto-mas = Rigoroso+ (recomendado)
aegis-ajustes-escudos-nivel-estricto-mas-descripcion = Tudo do Rigoroso e uma lista de rastreamento mais ampla (AdGuard Tracking Protection). Usa um pouco mais de memória.
aegis-ajustes-escudos-nivel-personalizado = Você mudou a proteção contra rastreamento manualmente em Privacidade, então nenhum nível corresponde. Escolha um para voltar.
aegis-ajustes-escudos-nivel-nota = Nenhum nível torna o bloqueio invisível: um site pode perceber que faltam os anúncios dele.

aegis-ajustes-escudos-molestias-titulo = Incômodos
aegis-ajustes-escudos-molestias-descripcion = Ficam ocultos em todos os sites. Para vê-los em um site específico, adicione-o em “Exceções por site”.
aegis-ajustes-escudos-molestia-cookies-detalle = Banners de consentimento. Ocultar um nem sempre equivale a recusar: o site decide o que fazer sem a sua resposta.
aegis-ajustes-escudos-molestia-ventanas-detalle = Pop-ups, banners para instalar apps, widgets e outros incômodos.
aegis-ajustes-escudos-molestia-antiadblock-detalle = Avisos que pedem para desativar o bloqueador. Não funciona em todos os sites.
aegis-ajustes-escudos-molestias-nota = Cada grupo usa listas dos seus autores (uBlock Origin, AdGuard e EasyList). Ao mudar, os Escudos levam alguns segundos para prepará-las.

aegis-ajustes-escudos-contador-titulo = Contador
aegis-ajustes-escudos-contador-descripcion = O que o número do botão dos Escudos e do painel conta.
aegis-ajustes-escudos-contador-peticiones = Requisições
aegis-ajustes-escudos-contador-origenes = Origens
aegis-ajustes-escudos-contador-peticiones-detalle = Cada requisição bloqueada soma uma, mesmo que vá para o mesmo servidor.
aegis-ajustes-escudos-contador-origenes-detalle = Cada servidor bloqueado soma uma só vez por página, por mais que tente.

aegis-ajustes-escudos-listas-titulo = Listas de filtros
aegis-ajustes-escudos-listas-descripcion = As regras são dos seus autores (uBlock Origin, EasyList, AdGuard e Brave). O { -brand-short-name } as baixa diretamente deles, sem cookies.
aegis-ajustes-escudos-listas-activas = { $listas ->
        [one] 1 lista ativa
       *[other] { $listas } listas ativas
    }
aegis-ajustes-escudos-ultima = Última atualização: { $fecha }
aegis-ajustes-escudos-actualizar-ahora = Atualizar agora
aegis-ajustes-escudos-actualizando = Atualizando…
aegis-ajustes-escudos-resultado-nuevas = Listas atualizadas
aegis-ajustes-escudos-resultado-iguales = Já estavam em dia
aegis-ajustes-escudos-resultado-fallos = { $listas ->
        [one] Uma lista não pôde ser baixada e fica a versão anterior
       *[other] { $listas } listas não puderam ser baixadas e ficam as versões anteriores
    }
aegis-ajustes-escudos-resultado-sin-permiso = Falta a permissão de Conexões para baixá-las
aegis-ajustes-escudos-resultado-error = Não foi possível atualizar. Tente de novo mais tarde
aegis-ajustes-escudos-automatica = Atualizar as listas automaticamente
aegis-ajustes-escudos-automatica-detalle = Uma verificação por dia; cada lista só é baixada quando expira.
aegis-ajustes-escudos-automatica-sin-permiso = Precisa da permissão “Listas de proteção” em Conexões.
aegis-ajustes-escudos-sin-conexiones = Enquanto você não der, os Escudos usam as listas que vêm com o { -brand-short-name }.
aegis-ajustes-escudos-elegir-conexiones = Escolher conexões

aegis-ajustes-escudos-intervalo = Renovar cada lista pelo menos a cada
aegis-ajustes-escudos-intervalo-detalle = Antes, se o autor pedir: algumas listas expiram em poucas horas.
aegis-ajustes-escudos-dias = { $dias ->
        [one] 1 dia
       *[other] { $dias } dias
    }
aegis-ajustes-escudos-ver-listas = Ver as listas ({ $listas })
aegis-ajustes-escudos-ocultar-listas = Ocultar as listas

aegis-ajustes-escudos-origen-red = baixada
aegis-ajustes-escudos-origen-build = incluída no { -brand-short-name }

aegis-ajustes-escudos-excepciones-titulo = Exceções por site
aegis-ajustes-escudos-excepciones-descripcion = Sites em que os Escudos deixam passar algo. “Permitir tudo” é o mesmo que desativar os Escudos pelo painel.
aegis-ajustes-escudos-excepciones-descripcion-privada = Em uma janela privativa, as exceções duram até você fechar a última janela privativa. “Permitir tudo” é o mesmo que desativar os Escudos pelo painel.
aegis-ajustes-escudos-anadir-titulo = Adicionar um site

aegis-ajustes-escudos-anadir-ejemplo = exemplo.com
aegis-ajustes-escudos-anadir = Adicionar
aegis-ajustes-escudos-anadir-error = Digite o endereço de um site, como exemplo.com.
aegis-ajustes-escudos-excepciones-vacio = Nenhum site tem exceções.
aegis-ajustes-escudos-sitio-todo = Tudo permitido: Escudos desativados
aegis-ajustes-escudos-sitio-nada = Nada permitido ainda
aegis-ajustes-escudos-editar = Editar
    .aria-label = Editar as exceções de { $sitio }
aegis-ajustes-escudos-cerrar = Fechar
    .aria-label = Fechar as exceções de { $sitio }
aegis-ajustes-escudos-quitar = Remover
    .aria-label = Remover todas as exceções de { $sitio }
aegis-ajustes-escudos-permitir-todo = Permitir tudo neste site
aegis-ajustes-escudos-permitir-todo-detalle = Desativa os Escudos: nada é bloqueado. É o interruptor grande do painel.
aegis-ajustes-escudos-que-permitir = Ou escolha o que permitir

aegis-ajustes-escudos-por-ajuste-general = Permitido por um ajuste geral: está desativado para todos os sites.
aegis-ajustes-escudos-por-permitir-todo = Permitido: este site tem “Permitir tudo”.
aegis-ajustes-escudos-grupo-anuncios-detalle = Requisições a servidores de anúncios das listas de filtros.
aegis-ajustes-escudos-grupo-rastreadores-detalle = Os das listas de filtros. A proteção contra rastreamento do navegador continua ativa; para desativá-la também, use “Permitir tudo”.
aegis-ajustes-escudos-grupo-cookies-avisos-detalle = Os banners de consentimento de cookies.
aegis-ajustes-escudos-grupo-molestias-detalle = Pop-ups, banners de apps e widgets.
aegis-ajustes-escudos-grupo-antiadblock-detalle = Os avisos que pedem para desativar o bloqueador.
aegis-ajustes-escudos-grupo-cosmetico-detalle = Espaços de anúncios e outros elementos que as listas ocultam na página.
aegis-ajustes-escudos-grupo-scriptlets-detalle = Pequenos scripts das listas que desativam anúncios e detectores dentro da página.

aegis-ayuda-nivel = Saiba mais
    .aria-label = Saiba mais sobre os níveis dos Escudos
aegis-ayuda-molestias = Saiba mais
    .aria-label = Saiba mais sobre os incômodos
aegis-ayuda-contador = Saiba mais
    .aria-label = Saiba mais sobre o contador
aegis-ayuda-listas = Saiba mais
    .aria-label = Saiba mais sobre as listas de filtros
aegis-ayuda-excepciones = Saiba mais
    .aria-label = Saiba mais sobre as exceções por site

## Importar de otros navegadores (migracion/). Nombres de los navegadores de origen en el asistente de importar
## (marcas: no se traducen) y la página de las contraseñas: cómo sacar un CSV de cada uno. Solo los ids que empiezan
## por «aegis-migracion-navegador-firefox» pueden nombrar ese navegador (tools/verificar.py).

aegis-migracion-navegador-firefox = Firefox
aegis-migracion-navegador-aegis = { -brand-short-name }

aegis-migracion-navegador-firefox-csv-titulo = Como importar senhas do Firefox
aegis-migracion-navegador-firefox-csv-en = No Firefox:
aegis-migracion-navegador-firefox-csv-paso1 = Digite about:logins na barra de endereços e pressione Enter.
aegis-migracion-navegador-firefox-csv-paso2 = Abra o menu (…) no canto superior direito e escolha “Exportar senhas…”.
aegis-migracion-navegador-firefox-csv-paso3 = Confirme e salve o arquivo no seu dispositivo.
aegis-migracion-csv-brave-titulo = Como importar senhas do Brave
aegis-migracion-csv-brave-en = No Brave:
aegis-migracion-csv-brave-paso1 = Digite brave://password-manager/settings na barra de endereços e pressione Enter.
aegis-migracion-csv-brave-paso2 = Em “Exportar senhas”, clique em “Baixar arquivo”.
aegis-migracion-csv-brave-paso3 = Salve o arquivo no seu dispositivo.
aegis-migracion-csv-edge-titulo = Como importar senhas do Microsoft Edge
aegis-migracion-csv-edge-en = No Microsoft Edge:
aegis-migracion-csv-edge-paso1 = Digite edge://settings/passwords na barra de endereços e pressione Enter.
aegis-migracion-csv-edge-paso2 = Abra “Mais ações” (…) ao lado das senhas salvas e escolha “Exportar senhas”.
aegis-migracion-csv-edge-paso3 = Confirme com o PIN ou a senha do Windows e salve o arquivo no seu dispositivo.
# Último paso, común: vuelve al asistente y elige el CSV con su botón (el de Firefox, «Seleccionar archivo»).
aegis-migracion-csv-final = Volte aqui e escolha o arquivo para concluir. Ele guarda suas senhas sem criptografia: exclua-o assim que terminar.

# Otro Aegis (otro perfil o el de otro equipo): no exporta en claro; las contraseñas pasan con el código de
# transferencia (contrasenas/transferencia/). El botón «Seleccionar archivo» de la página (el de Firefox) elige el
# archivo y luego se pide el código. «-final-ajustes»: cuando el asistente no puede abrir el diálogo (dentro de la
# bienvenida), remite a Ajustes. Los nombres de Ajustes y de los botones, como salen en la interfaz.
aegis-migracion-aegis-contrasenas-titulo = Como transferir as senhas de outro { -brand-short-name }
aegis-migracion-aegis-contrasenas-en = No outro { -brand-short-name } (neste computador ou em outro):
aegis-migracion-aegis-contrasenas-paso1 = Abra Configurações › Senhas e, em “Transferir para outro { -brand-short-name }”, clique em “Criar arquivo…”.
aegis-migracion-aegis-contrasenas-paso2 = Salve o arquivo e anote o código de 6 palavras que aparece.
aegis-migracion-aegis-contrasenas-paso3 = Se for outro computador, traga o arquivo até este (em um pen drive ou na sua nuvem).
aegis-migracion-aegis-contrasenas-final = Volte aqui, escolha o arquivo e digite o código. Se preferir não transferi-las agora, pule esta etapa para importar o restante.
aegis-migracion-aegis-contrasenas-final-ajustes = Depois, abra-o em Configurações › Senhas › “Receber de outro { -brand-short-name }”. Por enquanto, pule esta etapa para importar o restante.

## Pasar las contraseñas a otro Aegis con el código de 6 palabras (contrasenas/transferencia/): Ajustes › Contraseñas
## y autorrelleno («Transferencia de contraseñas», detrás del cierre automático), los diálogos de pasar y de recibir
## (dialogos/transferencia-*.xhtml, 440 px de ancho: los textos largos pasan a otra línea) y el selector de archivos.
## «Código de transferencia» está en el glosario. Las palabras del código son siempre las de la lista del EFF, en
## inglés: no se traducen ni salen aquí. Honestidad: la caducidad (24 h) y el «una sola vez» los comprueba Aegis al
## abrir el archivo; lo que protege el archivo es el código.

# Ajustes: etiqueta de la sección (en mayúsculas), su descripción y dos filas con su detalle y un botón compacto.
aegis-transferencia-titulo = Transferência de senhas
aegis-transferencia-descripcion = Transfira suas senhas para outro { -brand-short-name } (neste computador ou em outro) em um arquivo criptografado que só abre com um código de 6 palavras. Elas não passam por nenhum servidor: você mesmo leva o arquivo.
aegis-transferencia-pasar = Transferir para outro { -brand-short-name }
aegis-transferencia-pasar-detalle = Cria o arquivo e o código. O código aparece uma única vez e o arquivo expira em 24 horas.
aegis-transferencia-pasar-boton = Criar arquivo…
aegis-transferencia-recibir = Receber de outro { -brand-short-name }
aegis-transferencia-recibir-detalle = Abre aqui o arquivo com o código. As senhas que você já tem não são duplicadas.
aegis-transferencia-recibir-boton = Abrir arquivo…
# Títulos del selector de archivos del sistema, el nombre del tipo de archivo y el nombre que se propone (sin la
# extensión .aegisvault, que se añade sola).
aegis-transferencia-selector-guardar = Salvar o arquivo de senhas
aegis-transferencia-selector-abrir = Escolha o arquivo de senhas
aegis-transferencia-selector-filtro = Senhas do { -brand-short-name }
aegis-transferencia-nombre-archivo = Senhas do { -brand-short-name }
# Mensaje y título del diálogo de Windows Hello al crear el archivo.
aegis-transferencia-autenticacion = Para transferir suas senhas para outro { -brand-short-name }, digite suas credenciais do Windows. Isso ajuda a proteger suas contas.
aegis-transferencia-autenticacion-titulo = { -brand-short-name }
# Botones comunes de los dos diálogos.
aegis-transferencia-cancelar = Cancelar
aegis-transferencia-hecho = Concluído

# Diálogo «Pasar a otro Aegis». Paso 1: qué se lleva y el aviso.
aegis-pasar-ventana = Transferir para outro { -brand-short-name }
aegis-pasar-titulo = Transfira suas senhas para outro { -brand-short-name }
aegis-pasar-explicacion = Elas são salvas em um arquivo criptografado. No final, você verá um código de 6 palavras: no outro { -brand-short-name }, abra o arquivo em Configurações › Senhas › “Receber de outro { -brand-short-name }” e digite o código.
# $contrasenas: cuántas hay guardadas (1 o más).
aegis-pasar-resumen =
    { $contrasenas ->
        [one] 1 senha salva será transferida.
       *[other] { $contrasenas } senhas salvas serão transferidas.
    }
aegis-pasar-vacio = Não há senhas salvas para transferir.
# Casilla, marcada de serie. $codigos: cuántos códigos de verificación hay guardados.
aegis-pasar-incluir-codigos =
    { $codigos ->
        [one] Incluir também o código de verificação salvo
       *[other] Incluir também os { $codigos } códigos de verificação salvos
    }
aegis-pasar-aviso-titulo = Quem tiver o arquivo e o código terá suas senhas
aegis-pasar-aviso-texto = Guarde o arquivo em um lugar seu e não o envie junto com o código. Assim que abri-lo no outro { -brand-short-name }, exclua-o.
# Solo con la casilla de los códigos marcada.
aegis-pasar-aviso-codigos = Com os códigos de verificação, o arquivo leva as duas etapas dessas contas.
aegis-pasar-limites = O arquivo expira em 24 horas e só pode ser aberto uma vez em cada perfil: o { -brand-short-name } verifica isso ao abri-lo. O que realmente o protege é o código.
aegis-pasar-crear = Criar arquivo…
# Paso 2: el código, una sola vez.
aegis-pasar-codigo-titulo = Seu código de transferência
aegis-pasar-codigo-explicacion = Digite-o no outro { -brand-short-name } ao abrir o arquivo. Ele expira em 24 horas.
aegis-pasar-copiar = Copiar código
# Tras copiar. $segundos: tras cuántos segundos se borra (60 de serie).
aegis-pasar-copiado = Copiado. Ele será apagado da área de transferência em { $segundos } s se ainda estiver lá.
aegis-pasar-copiado-sin-borrar = Copiado. Limpe a área de transferência depois de colá-lo.
aegis-pasar-copiar-error = Não foi possível copiar. Anote-o à mão.
aegis-pasar-una-vez-titulo = Ele não será mostrado de novo
aegis-pasar-una-vez-texto = Anote-o ou copie-o agora. O { -brand-short-name } não o guarda: se você perdê-lo, o arquivo não poderá ser aberto e será preciso criar outro.
# $archivo: el nombre del archivo; $contrasenas y $codigos: cuántos lleva.
aegis-pasar-guardado =
    Em “{ $archivo }”: { $contrasenas ->
        [one] 1 senha
       *[other] { $contrasenas } senhas
    }.
aegis-pasar-guardado-codigos =
    Em “{ $archivo }”: { $contrasenas ->
        [one] 1 senha
       *[other] { $contrasenas } senhas
    } e { $codigos ->
        [one] 1 código de verificação
       *[other] { $codigos } códigos de verificação
    }.
aegis-pasar-error-autenticacion = Não foi possível verificar sua identidade. Tente de novo.
aegis-pasar-error-escribir = Não foi possível salvar o arquivo. Escolha outra pasta e tente de novo.
aegis-pasar-error = Não foi possível criar o arquivo. Tente de novo.

# Diálogo «Recibir de otro Aegis». Paso 1: el archivo y el código.
aegis-recibir-ventana = Receber de outro { -brand-short-name }
aegis-recibir-titulo = Receba senhas de outro { -brand-short-name }
aegis-recibir-explicacion = Escolha o arquivo que você criou no outro { -brand-short-name } e digite o código de 6 palavras dele.
aegis-recibir-archivo = Arquivo
aegis-recibir-sin-archivo = Nenhum arquivo escolhido
aegis-recibir-elegir = Escolher…
aegis-recibir-cambiar = Trocar…
aegis-recibir-codigo = Código de 6 palavras
# Debajo del campo: antes de escribir, cuántas palabras lleva o cuál no es del código. $palabras: de 1 a 7 o más.
aegis-recibir-codigo-nota = As palavras em ordem, separadas por espaços. Maiúsculas não fazem diferença.
aegis-recibir-codigo-cuenta = { $palabras } de 6 palavras
aegis-recibir-codigo-desconocida = “{ $palabra }” não é uma palavra do código. Confira como se escreve.
aegis-recibir-limites = Elas são adicionadas às suas senhas salvas, protegidas pela sua senha principal. As que você já tem não são duplicadas; se a do arquivo for mais recente, ela substitui a sua.
aegis-recibir-boton = Receber
aegis-recibir-abriendo = Abrindo o arquivo…
# Errores. «-incorrecto» no dice si el fallo es del código o del archivo (a propósito).
aegis-recibir-error-incorrecto = O código ou o arquivo não está correto. Confira as 6 palavras e se este é o arquivo que você criou.
aegis-recibir-error-version = Este arquivo é de uma versão mais nova do { -brand-short-name }. Atualize o { -brand-short-name } e tente de novo.
aegis-recibir-error-caducado = Este arquivo expirou: ele só vale por 24 horas. Crie outro no outro { -brand-short-name }.
aegis-recibir-error-reloj = A data deste arquivo é posterior à deste computador. Confira a data e a hora dos dois computadores.
aegis-recibir-error-usado = Este arquivo já foi aberto aqui e só vale uma vez. Se precisar, crie outro no outro { -brand-short-name }.
aegis-recibir-error-leer = Não foi possível ler o arquivo. Confira se ele ainda está no lugar e tente de novo.
aegis-recibir-error-sin-principal = Sem senha principal, nenhuma senha é salva. Crie uma e tente de novo.
aegis-recibir-error-bloqueada = Sua senha principal é necessária para salvar as senhas. Tente de novo.
aegis-recibir-error = Não foi possível receber as senhas. Tente de novo.
# Paso 2: el resumen (una línea por cada cosa que no sea cero; la primera, siempre) y borrar el archivo. $n: cuántas.
aegis-recibir-hecho-titulo = Senhas recebidas
aegis-recibir-hecho-explicacion = Elas já estão nas suas senhas salvas, protegidas pela sua senha principal.
aegis-recibir-resumen-nuevas =
    { $n ->
        [one] 1 senha nova
       *[other] { $n } senhas novas
    }
aegis-recibir-resumen-actualizadas =
    { $n ->
        [one] 1 atualizada (a do arquivo era mais recente)
       *[other] { $n } atualizadas (as do arquivo eram mais recentes)
    }
aegis-recibir-resumen-ya =
    { $n ->
        [one] 1 já estava salva
       *[other] { $n } já estavam salvas
    }
aegis-recibir-resumen-codigos =
    { $n ->
        [one] 1 código de verificação novo
       *[other] { $n } códigos de verificação novos
    }
aegis-recibir-resumen-codigos-ya =
    { $n ->
        [one] 1 conta já tinha seu código de verificação (não foi alterado)
       *[other] { $n } contas já tinham seu código de verificação (não foi alterado)
    }
aegis-recibir-resumen-errores =
    { $n ->
        [one] 1 não pôde ser adicionada
       *[other] { $n } não puderam ser adicionadas
    }
aegis-recibir-borrar-titulo = Exclua o arquivo
aegis-recibir-borrar-texto = Ele não é mais necessário e, com ele e o código, qualquer pessoa poderia ler suas senhas. Exclua-o também de onde o copiou (um pen drive, sua nuvem).
aegis-recibir-borrar = Excluir arquivo
aegis-recibir-borrado = Arquivo excluído.
aegis-recibir-borrar-error = Não foi possível excluí-lo. Exclua-o pela pasta.

## about:bienvenida (paginas/bienvenida.html; bienvenida.sys.mjs): las preguntas de Aegis Setup dentro del navegador,
## para quien no pasa por el instalador (Microsoft Store, zip). Sale en el primer arranque, antes de «Tú decides qué se
## conecta». Misma redacción que el asistente del instalador (packaging/instalador/traducciones/): si cambia uno, cambia
## el otro. Los nombres de los buscadores (DuckDuckGo, Startpage, Brave Search, Google) y «Workflow» no se traducen.

aegis-bienvenida-pestana = Boas-vindas
aegis-bienvenida-nombre = { -brand-short-name }
aegis-bienvenida-lema = Um navegador privado, limpo e rápido
# Etiqueta de sección del resumen (se muestra en mayúsculas).
aegis-bienvenida-resumen = Sua configuração
aegis-bienvenida-fila-modo = Modo
aegis-bienvenida-fila-escudos = Escudos
aegis-bienvenida-fila-buscador = Mecanismo de pesquisa
aegis-bienvenida-fila-apariencia = Aparência
aegis-bienvenida-resumen-nota = Você pode mudar tudo quando quiser nas Configurações.
aegis-bienvenida-modo-titulo = Como você quer navegar?
aegis-bienvenida-modo-subtitulo = Escolha um modo. Você pode mudar quando quiser nas Configurações.
aegis-bienvenida-modo-estandar = Padrão
aegis-bienvenida-modo-estandar-detalle = Abas em cima, como sempre
aegis-bienvenida-modo-workflow = Workflow
aegis-bienvenida-modo-workflow-detalle = Abas verticais ao lado
aegis-bienvenida-modo-nota-estandar = Uma barra limpa, com as abas em cima e a barra de favoritos discreta.
aegis-bienvenida-modo-nota-workflow = Abas em uma barra lateral, com mais largura para a página.
aegis-bienvenida-escudos-titulo = Quanto você quer bloquear?
aegis-bienvenida-escudos-subtitulo = Os Escudos bloqueiam anúncios e rastreadores desde o primeiro minuto.
aegis-bienvenida-escudos-normal = Normal
aegis-bienvenida-escudos-normal-detalle = Bloqueia rastreadores conhecidos e anúncios. Quase nenhum site quebra.
aegis-bienvenida-escudos-estricto = Rigoroso
aegis-bienvenida-escudos-estricto-detalle = Também bloqueia botões sociais e vídeos que rastreiam. Alguns sites podem ficar incompletos.
aegis-bienvenida-escudos-estricto-mas = Rigoroso+
# Nombre que lee el lector de pantalla para la tarjeta de Estricto+ (la insignia es parte del dibujo).
aegis-bienvenida-escudos-estricto-mas-accesible =
    .aria-label = Rigoroso+ (recomendado)
aegis-bienvenida-escudos-estricto-mas-detalle = Tudo do Rigoroso e uma lista de rastreamento mais ampla. Usa um pouco mais de memória.
# Insignia sobre la tarjeta de Estricto+ (se muestra en mayúsculas).
aegis-bienvenida-recomendado = Recomendado
aegis-bienvenida-escudos-nota = Você pode mudar quando quiser em Configurações › Escudos.
aegis-bienvenida-buscador-titulo = Onde você quer pesquisar?
aegis-bienvenida-buscador-subtitulo = O mecanismo de pesquisa da barra de endereço. Você pode mudar quando quiser nas Configurações.
aegis-bienvenida-buscador-duckduckgo = Não guarda o que você pesquisa.
aegis-bienvenida-buscador-startpage = Resultados do Google sem que o Google saiba quem você é.
aegis-bienvenida-buscador-brave = Índice próprio e independente, sem perfis.
aegis-bienvenida-buscador-google = Os resultados de sempre. O Google guarda o que você pesquisa.
aegis-bienvenida-apariencia-titulo = Escolha a aparência
aegis-bienvenida-apariencia-subtitulo = O { -brand-short-name } é preto e branco: a cor vem da web.
aegis-bienvenida-apariencia-oscuro = Escuro
aegis-bienvenida-apariencia-oscuro-detalle = Preto e tons de cinza
aegis-bienvenida-apariencia-claro = Claro
aegis-bienvenida-apariencia-claro-detalle = Branco e tons de cinza
aegis-bienvenida-apariencia-auto = Automático
# Automático sigue el tema del sistema: en Windows, como en el instalador.
aegis-bienvenida-apariencia-auto-detalle =
    { PLATFORM() ->
        [windows] Como o Windows
       *[other] Como o sistema
    }
aegis-bienvenida-apariencia-nota = Você pode mudar quando quiser em Configurações › Aparência.
# Pie: los pasos. $n es el paso en el que se está y $total, cuántos hay (5).
aegis-bienvenida-paso = Passo { $n } de { $total }
aegis-bienvenida-atras = Voltar
aegis-bienvenida-continuar = Continuar
# Primer paso: ver y cambiar cada pregunta.
aegis-bienvenida-personalizar = Personalizar
# Primer paso, sin haber cambiado nada: aplica lo recomendado y sigue (se salta las preguntas).
aegis-bienvenida-usar-recomendado = Usar o recomendado
# Primer paso, después de cambiar algo: aplica lo elegido y sigue.
aegis-bienvenida-usar-eleccion = Usar esta configuração

## Barra de direcciones: modo «Acciones» (escribir «>» o elegir Acciones en el menú de la lupa) y la fila de botones
## que sale al escribir una palabra clave (acciones.sys.mjs). Cada acción es un botón pequeño: textos cortos, como los
## de las acciones del navegador («Ver descargas»). Los «-claves» son las palabras que la buscan: separadas por comas,
## en minúsculas y en el idioma de la interfaz (Aegis las busca también sin tildes). No se traducen palabra por
## palabra: las que usaría alguien de ese idioma para encontrar la acción.

aegis-accion-escudos = Abrir o painel dos Escudos
aegis-accion-escudos-claves = escudos, bloqueador, anúncios, rastreadores, painel dos escudos
aegis-accion-escudos-bajar = Desativar os Escudos neste site
aegis-accion-escudos-subir = Ativar os Escudos neste site
aegis-accion-escudos-sitio-claves = escudos, desativar escudos, ativar escudos, desativar bloqueador, permitir anúncios
aegis-accion-escudos-ajustes = Configurações dos Escudos
aegis-accion-escudos-ajustes-claves = escudos, configurações dos escudos, exceções, listas de filtros, filtros
aegis-accion-conexiones = Escolher o que se conecta
aegis-accion-conexiones-claves = conexões, conectar, rede, privacidade
aegis-accion-modo-workflow = Mudar para o modo Workflow
aegis-accion-modo-estandar = Mudar para o modo Padrão
aegis-accion-modo-claves = modo, workflow, padrão, abas verticais
aegis-accion-apariencia = Aparência e destaque
aegis-accion-apariencia-claves = aparência, destaque, cor, tema escuro, tema claro
aegis-accion-tor = Nova janela privativa com Tor
aegis-accion-tor-claves = tor, janela com tor, anônimo, onion
aegis-accion-contrasenas = Abrir as senhas
aegis-accion-contrasenas-claves = senhas, logins, contas, códigos de verificação
aegis-accion-pasar = Transferir senhas para outro { -brand-short-name }
aegis-accion-pasar-claves = transferir senhas, exportar senhas, transferência, senhas
aegis-accion-recibir = Receber senhas de outro { -brand-short-name }
aegis-accion-recibir-claves = receber senhas, transferência, código de transferência, senhas
aegis-accion-importar = Importar dados de outro navegador
aegis-accion-importar-claves = importar, importar dados, chrome, edge, brave, migrar
