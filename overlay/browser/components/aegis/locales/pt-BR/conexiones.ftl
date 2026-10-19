# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

## about:conexiones (paginas/conexiones.html; conexiones.sys.mjs): o que o navegador conecta por conta própria e a
## permissão do usuário. Aparece na primeira execução, antes de qualquer conexão. Nomes de serviços (GitHub, Mozilla,
## Google, Cisco, Disconnect, Remote Settings, Safe Browsing, OpenH264, Widevine, CRLite, Netflix) não se traduzem.

conexiones-pestana = Conexões
conexiones-titulo = Você decide o que se conecta
conexiones-entradilla = O { -brand-short-name } ainda não se conectou a nada. Estas são as conexões que ele faz por conta própria, sem você navegar. Escolha quais você permite.
# Rótulo do cartão (aparece em maiúsculas).
conexiones-lista-titulo = Conexões do { -brand-short-name }

conexiones-actualizaciones-nombre = Atualizações do { -brand-short-name }
conexiones-actualizaciones-que = Uma vez por dia, pergunta ao GitHub se há uma versão nova e, se houver, baixa de lá. O GitHub vê seu IP e sua versão do { -brand-short-name }, sem cookies. Sem isso, você terá de procurar atualizações manualmente em Sobre o { -brand-short-name }.
conexiones-seguridad-nombre = Listas de segurança
conexiones-seguridad-que = Certificados revogados (CRLite) e complementos perigosos, do Remote Settings (services.mozilla.com). Verifica se há mudanças uma vez por dia. Esse servidor vê seu IP e sua versão. Sem isso, para saber se o certificado de um site foi revogado, o { -brand-short-name } pergunta à autoridade que o emitiu toda vez que você abre um site novo, muitas vezes sem criptografia: desativar isso causa mais consultas, não menos.
conexiones-listas-nombre = Listas de proteção
conexiones-listas-que = As listas com que os Escudos reconhecem o que segue você. As da proteção contra rastreamento, do Remote Settings (baseadas nas da Disconnect): sem elas, nenhum rastreador, coletor de impressão digital, criptominerador ou botão de rede social é reconhecido, e não funcionam os substitutos que evitam que um site quebre ao bloqueá-los. E as listas de filtros dos seus autores (EasyList, AdGuard, uBlock Origin): sem elas, os Escudos usam a cópia que vem com o { -brand-short-name }, que vai ficando desatualizada. São verificadas no máximo uma vez por dia e só se baixa o que mudou.
conexiones-codecs-nombre = Codecs de vídeo
conexiones-codecs-que = OpenH264, da Cisco, para videochamadas: baixado uma vez. Widevine, do Google, para vídeo protegido (DRM), como o da Netflix: só se um site pedir e você ativar. Depois, verifica no máximo uma vez por dia se há versões novas (em aus5.mozilla.org e, para o Widevine, no Google).
conexiones-traduccion-nombre = Tradução de páginas
conexiones-traduccion-que = Traduz os sites no seu dispositivo, sem enviá-los a ninguém. Só quando você pede para traduzir uma página ou baixa um idioma nas Configurações, baixa o modelo desse idioma (vários MB) do Remote Settings (services.mozilla.com); a lista de idiomas é verificada uma vez por dia. Sem isso, a opção de traduzir não aparece.
conexiones-safebrowsing-nombre = Safe Browsing do Google
conexiones-safebrowsing-que = Avisa sobre sites de golpe e downloads perigosos com listas do Google, que se atualizam mais ou menos a cada meia hora. Para confirmar um aviso, envia ao Google um fragmento de um código calculado a partir do endereço, não o endereço.
conexiones-safebrowsing-sin-clave = Não disponível nesta versão do { -brand-short-name }: falta a chave dele para o serviço do Google.
conexiones-push-nombre = Notificações de sites
conexiones-push-que = Uma conexão aberta com um servidor de notificações (push.services.mozilla.com), para que os sites aos quais você der permissão possam avisar você, mesmo quando não estiverem abertos. Esse servidor vê seu IP e um identificador deste navegador.

conexiones-navegar = Navegar não depende disto: quando você abre um site, o { -brand-short-name } se conecta a ele. Aqui está só o que acontece sozinho, sem você fazer nada.
conexiones-cambiar = As mudanças valem na hora, sem reiniciar. Você pode voltar aqui quando quiser em Configurações › Privacidade.

conexiones-aceptar = Aceitar
conexiones-guardar = Salvar
conexiones-ahora-no = Agora não
conexiones-ninguna = Não permitir nenhuma
conexiones-estado-aceptadas = Salvo. Por conta própria, o { -brand-short-name } só vai se conectar para o que você deixou ativado.
conexiones-estado-ninguna = Salvo. O { -brand-short-name } não vai se conectar a nada por conta própria. Sem atualizações nem listas, ele vai ficando para trás em segurança.

## Configurações › Privacidade › Conexões (ajustes.sys.mjs)

# Rótulo de seção (aparece em maiúsculas).
conexiones-ajustes-titulo = Conexões
conexiones-ajustes-ninguna = O { -brand-short-name } não se conecta a nada por conta própria.
# $lista: os nomes dos grupos ativos, em forma de lista do idioma («Atualizações do Aegis e Listas de segurança»).
conexiones-ajustes-activas = Por conta própria, o { -brand-short-name } só se conecta para isto: { $lista }.
conexiones-ajustes-elegir = Escolher o que se conecta
