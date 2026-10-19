# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

## about:escudos, «Cómo funcionan los Escudos» (paginas/escudos-ayuda.html): la ayuda de cada opción del panel de
## Escudos y de la huella digital. Para todo el mundo: de tú, frases cortas y sin jerga. Los nombres de las opciones
## son los del panel (aegis.ftl) y se escriben igual. <strong> se deja tal cual (negrita del nombre de la opción).

escudos-ayuda-pestana = Como funcionam os Escudos
escudos-ayuda-titulo = Como funcionam os Escudos
escudos-ayuda-entradilla = O que faz cada opção do painel dos Escudos, quando vale a pena mexer nela e o que fazer se um site parar de funcionar.
# Etiqueta del índice (se muestra en mayúsculas).
escudos-ayuda-indice = Nesta página
# Encabezados que se repiten en varias secciones.
escudos-ayuda-h-cuando = Quando usar
escudos-ayuda-h-falla = Se um site falhar

## Qué son los Escudos y el contador

escudos-ayuda-escudos-titulo = O que são os Escudos
escudos-ayuda-escudos-que = Cada site que você abre carrega peças de outras empresas: anúncios, contadores de visitas, botões de redes sociais. Muitas servem para seguir você de um site a outro e saber o que você faz. Os Escudos bloqueiam essas peças antes que cheguem.
escudos-ayuda-escudos-panel = O botão dos Escudos é o anel à direita da barra de endereços. Ao clicar nele, abre-se o painel, com o que foi bloqueado na página e as opções de proteção. Cada opção diz se vale só para o site que você está vendo ou «Em todos os sites».
escudos-ayuda-contador-titulo = O contador
escudos-ayuda-contador-que = O número do botão conta o que foi bloqueado na página que você está vendo: anúncios, rastreadores, rastreadores de redes sociais, coletores de impressão digital e criptomineradores. Por padrão conta cada requisição bloqueada; em Configurações › Escudos › «Contador» você pode fazer cada servidor contar uma vez só («Origens»). O número volta a zero ao mudar de página.
escudos-ayuda-contador-no = Não conta o que é protegido sem bloquear nada: os cookies guardados à parte para cada site, os dados do navegador que são ocultados nem as conexões que passam para HTTPS. Com os Escudos desativados, o número não aparece.
escudos-ayuda-contador-total = Abaixo do número grande do painel você vê quanto foi bloqueado desde que instalou o { -brand-short-name }. Fica guardado só no seu dispositivo e não é enviado a ninguém. É contado do seu próprio jeito, então não precisa bater com a soma do que você vê em cada página.

## Escudos del sitio

escudos-ayuda-sitio-titulo = Escudos do site
escudos-ayuda-sitio-que = O interruptor grande no alto do painel ativa ou desativa os Escudos só para o site que você está vendo. Ao desativá-los, a página recarrega sem bloqueios e sem a proteção da impressão digital, e o botão aparece riscado.
escudos-ayuda-sitio-recuerda = O { -brand-short-name } lembra disso para a próxima vez. Se você fizer isso numa janela privativa, será esquecido ao fechá-la.
escudos-ayuda-sitio-cuando = Quando um site em que você confia não funciona direito: um vídeo que não começa, um pagamento que não avança ou um login que volta sempre para a mesma tela.
escudos-ayuda-sitio-falla = Com os Escudos desativados, esse site volta a carregar o que antes era bloqueado e pode seguir você. Se desativá-los não resolver, o problema era outro: ative-os de novo.

## Rastreadores y anuncios: Normal o Estricto

escudos-ayuda-nivel-titulo = Rastreadores e anúncios
escudos-ayuda-nivel-que = Escolha quanto os Escudos bloqueiam em todos os sites. O { -brand-short-name } vem no Rigoroso+. Também dá para escolher em Configurações › Escudos.
escudos-ayuda-nivel-normal = <strong>Normal</strong> bloqueia, em todas as janelas, os anúncios das listas de filtros, o conteúdo que rastreia da lista básica (anúncios e contadores de empresas que rastreiam), os criptomineradores e os coletores de impressão digital conhecidos, e os cookies que seguem você de um site a outro, inclusive os das redes sociais; os botões e vídeos incorporados delas continuam carregando.
escudos-ayuda-nivel-estricto = <strong>Rigoroso</strong> também usa a lista completa de conteúdo que rastreia, bloqueia ainda os botões e publicações incorporadas das redes sociais e tira dos links os dados adicionados para seguir você. Algum site pode falhar.
escudos-ayuda-nivel-personalizado = Se você mudar uma opção isolada, como os cookies de terceiros, o nível passa a <strong>Personalizado</strong>. Para voltar, escolha Normal, Rigoroso ou Rigoroso+.
escudos-ayuda-nivel-recarga = Ao mudar o nível, a página recarrega.
escudos-ayuda-nivel-cuando = Deixe no Rigoroso+ se não tiver problemas. Se muitos dos sites que você usa falharem, experimente o Normal; se só um falhar, é melhor desativar os Escudos nele.
escudos-ayuda-nivel-falla = No Rigoroso pode faltar um vídeo ou mapa incorporado, os comentários ou um botão «Entrar com…». Desative os Escudos nesse site e ele vai recarregar completo.

## Lo bloqueado en esta página

escudos-ayuda-lista-titulo = Bloqueados nesta página
escudos-ayuda-lista-que = Esta linha do painel mostra quais sites foram bloqueados na página, por grupos: rastreadores e anúncios, rastreadores de redes sociais, impressão digital e criptomineradores. Assim você vê quem estava tentando seguir você.
escudos-ayuda-lista-listas = Quem bloqueia é a proteção contra rastreamento do navegador (com as listas da Disconnect) e o bloqueador próprio dos Escudos (com as listas de filtros). O botão «Listas de filtros» abre Configurações › Escudos.
escudos-ayuda-lista-falla = Se na lista aparecer algo de que o site precisa, como o serviço de pagamento ou de vídeo dele, desative os Escudos nesse site.

## Pasar conexiones a HTTPS

escudos-ayuda-https-titulo = Usar HTTPS nas conexões
escudos-ayuda-https-que = Com o modo somente HTTPS, o { -brand-short-name } sempre abre a versão criptografada de cada site. Assim ninguém na sua rede, como o Wi-Fi de um café ou o seu provedor de internet, pode ler nem alterar o que você vê. Vem ativado em todos os sites.
escudos-ayuda-https-sitio = O interruptor do painel cria uma exceção para o site que você está vendo: ele poderá abrir sem criptografia. Se o modo somente HTTPS estiver desativado nas Configurações, a linha aparece apagada.
escudos-ayuda-https-cuando = Quase nunca. Só para um site sem versão criptografada em que você confia, como a página de configuração do seu roteador.
escudos-ayuda-https-falla = Se um site não tiver versão criptografada, o { -brand-short-name } avisa antes de abri-lo, e nesse aviso você pode continuar sem criptografia. Lembre que, sem criptografia, o que você digita nesse site viaja à vista.

## Bloquear scripts

escudos-ayuda-scripts-titulo = Bloquear scripts
escudos-ayuda-scripts-que = Bloquear os scripts (os programas que cada site traz) num site ainda não está disponível. O navegador ainda não tem uma forma confiável de fazer isso site a site, e o { -brand-short-name } não mostra um interruptor que não funciona. Vai chegar com o bloqueador próprio dos Escudos.

## Huella digital

escudos-ayuda-huella-titulo = Impressão digital
escudos-ayuda-huella-que = Um site pode reconhecer você sem cookies juntando o que lê do seu navegador: o tamanho da tela, as fontes, a placa de vídeo, o fuso horário, o idioma… Essa combinação é a sua impressão digital. O { -brand-short-name } esconde parte desses dados ou mostra os mesmos para todos os sites.
escudos-ayuda-huella-donde = Escolha no painel, na linha «Impressão digital», ou em Configurações › Privacidade. Vale para todos os sites, em janelas normais e privativas. Se mudar pelo painel, a página recarrega.
escudos-ayuda-huella-niveles = Os quatro níveis
escudos-ayuda-huella-basica = <strong>Básica.</strong> A proteção que vem com o navegador: muda um pouco o que um site lê dos seus desenhos (o canvas), mostra só as fontes do sistema e iguala alguns cálculos.
escudos-ayuda-huella-equilibrada = <strong>Equilibrada</strong> (a padrão). Também oculta a placa de vídeo, os sensores, o tipo de conexão, detalhes do áudio e da cor da tela e outros dados de que os sites normais não precisam. Não quebra nada comum: login, vídeo, mapas, documentos e videochamadas continuam funcionando.
escudos-ayuda-huella-estricta = <strong>Rigorosa.</strong> Também oculta onde estão a janela e o mouse na tela e as barras da janela, as fontes (só mostra as padrão do sistema), as vozes de leitura e o que a placa de vídeo consegue fazer. O tamanho da tela, o áudio, os núcleos do processador e o canvas ficam como na Equilibrada: mudá-los deixava você mais fácil de reconhecer. Algum site pode falhar: algum mapa ou jogo em 3D não abre, a leitura em voz alta de alguns sites fica sem vozes e as telas sensíveis ao toque podem receber a versão para mouse.
escudos-ayuda-huella-caja = <strong>Cofre.</strong> Oculta quase tudo o que sabe ocultar: não se você usa tema escuro ou claro, nem o tamanho da tela (ocultá-lo deixava você mais fácil de reconhecer). Os sites veem a hora em UTC, o inglês, 60 quadros por segundo e um teclado dos EUA, e não veem as suas configurações de acessibilidade (alto contraste, reduzir movimento…). Para ler um canvas, o site precisa pedir sua permissão. Umas marcas nos cantos do site lembram que ele está ativado. Muitos sites vão falhar.
escudos-ayuda-caja-titulo = O Cofre e a permissão por site
escudos-ayuda-caja-aviso = Se um site tentar tirar a sua impressão digital de uma forma conhecida, aparece um aviso ao lado do botão dos Escudos: «Continuar bloqueando» ou «Permitir neste site». Aparece uma vez por site e sessão. Não reconhece todas as tentativas: as outras são bloqueadas do mesmo jeito, mas sem aviso.
escudos-ayuda-caja-permiso = «Permitir neste site», no aviso ou no painel, deixa esse site na Equilibrada; os outros continuam no Cofre. Fica guardado como uma permissão do site, que você pode remover em Configurações › Privacidade, em «Sites com permissão no Cofre», ou limpando os dados desse site.
escudos-ayuda-caja-limites = Não pode ser dada numa janela privativa, porque ficaria guardada, mas as permissões que você já tem valem lá também. Também não pode ser dada a endereços numéricos (IP), a «localhost» nem a alguns domínios pouco comuns. O idioma, os 60 quadros por segundo e as cores do sistema valem para o navegador todo e não mudam com a permissão.
escudos-ayuda-caja-salir = Ao sair do Cofre, seus idiomas voltam a ser os de antes.
escudos-ayuda-ven-titulo = O que os sites continuam vendo
escudos-ayuda-ven-ip = Seu endereço IP e, com ele, seu país e sua cidade aproximada. Para ocultá-lo, é preciso o Tor ou um proxy.
escudos-ayuda-ven-navegador = Qual navegador e qual sistema você usa, de forma genérica: o mesmo dado de milhões de pessoas. Nunca diz { -brand-short-name }.
escudos-ayuda-ven-resto = Seu idioma e seu fuso horário, menos no Cofre; o tamanho da janela e se você usa tema escuro ou claro, sempre.
escudos-ayuda-ven-ocultar = Que você esconde coisas: pouca gente navega assim, e isso também diferencia você. Acontece o mesmo com outros navegadores privados.
escudos-ayuda-ven-bajados = Se você desativar os Escudos num site, esse site fica sem proteção da impressão digital.
escudos-ayuda-huella-cuando = A Equilibrada serve para quase tudo. A Rigorosa, se você aceita que algum site falhe. O Cofre, para os momentos em que você quer deixar o menor rastro possível.
escudos-ayuda-huella-falla = Se um site falhar na Rigorosa ou no Cofre, desative os Escudos nele ou, no Cofre, use «Permitir neste site». Se muitos falharem, volte para a Equilibrada.

## Cookies de terceros

escudos-ayuda-cookies-titulo = Cookies de terceiros
escudos-ayuda-cookies-que = Cookies são dados que um site guarda no seu navegador para lembrar de você. Os de terceiros são de outras empresas que estão dentro do site que você visita, e servem principalmente para seguir você de um site a outro. Esta opção vale para todos os sites.
escudos-ayuda-cookies-rastreo = <strong>Bloquear rastreio</strong> (o padrão) bloqueia os cookies dos rastreadores conhecidos e guarda os outros separados para cada site, como numa gaveta própria. Assim, uma empresa não consegue juntar o que você faz em dois sites diferentes.
escudos-ayuda-cookies-todas = <strong>Bloquear todos</strong> não deixa entrar nenhum cookie de terceiros.
escudos-ayuda-cookies-cuando = «Bloquear rastreio» protege quase o mesmo e quebra muito menos. Escolha «Bloquear todos» só se quiser o máximo e aceitar que algumas coisas falhem.
escudos-ayuda-cookies-falla = Com «Bloquear todos» podem falhar os botões «Entrar com…», os pagamentos, os comentários e os vídeos incorporados: volte para «Bloquear rastreio». Se você mudar esta opção, o nível dos Escudos passa a Personalizado.

## Olvidar este sitio al cerrar

escudos-ayuda-olvidar-titulo = Esquecer este site ao fechar
escudos-ayuda-olvidar-que = Apaga os cookies e os dados que o site que você está vendo guarda, toda vez que você fecha o { -brand-short-name }. Só vale para esse site: os outros não são tocados. Não é o mesmo que «Esquecer este site» do histórico, que apaga tudo na hora.
escudos-ayuda-olvidar-privada = Numa janela privativa aparece desativado: uma janela privativa já esquece tudo ao ser fechada.
escudos-ayuda-olvidar-cuando = Para sites que você usa de vez em quando e não quer que lembrem de você: lojas, jornais ou buscadores de voos.
escudos-ayuda-olvidar-falla = Toda vez você vai precisar entrar de novo, e o site terá esquecido suas preferências, como o idioma, o carrinho ou sua resposta ao aviso de cookies. Se isso incomodar, desative para esse site.

## Oscurecer este sitio

escudos-ayuda-oscuro-titulo = Escurecer este site
escudos-ayuda-oscuro-que = Esta linha só aparece se você ativou «Sites em modo escuro» em Configurações › Aparência. Desative-a para que o site que você está vendo fique com as cores dele. A mudança aparece na hora, sem recarregar.
escudos-ayuda-oscuro-falla = O escurecimento automático às vezes erra: um logotipo que não aparece ou um texto com pouco contraste. Desative nesse site. Lembre que um site pode perceber que a aparência dele foi alterada.

## Google limpio

escudos-ayuda-google-titulo = Google limpo
escudos-ayuda-google-que = Nos sites do Google e do YouTube, o { -brand-short-name } corta os dados de uso e os anúncios deles, tira das pesquisas os dados de rastreamento e faz os links dos resultados irem direto ao site, sem passar pelo Google. O que ele corta soma no contador.
escudos-ayuda-google-busqueda = As pesquisas no Google feitas pela barra de endereços pedem só resultados da web, sem respostas de IA nem módulos. Dentro do Google você pode voltar para «Todas».
escudos-ayuda-google-pasa = De propósito, deixa passar o que é necessário: o login, os captchas, o Gmail, o Drive, o Maps, a reprodução do YouTube e o histórico dele.
escudos-ayuda-google-limites-titulo = O que ele não faz
escudos-ayuda-google-limites = Se você desativar os Escudos num site do Google, ele deixa de agir nesse site. Você pode desativá-lo em Configurações › Privacidade › Google. O Google continua vendo seu IP e o que você pesquisa, e se você entrar na sua conta, sabe quem você é nos serviços dele. Os anúncios que vêm dentro da página, como os resultados patrocinados ou os anúncios de vídeo do YouTube, ainda não são removidos.

## Lo que los Escudos no hacen

escudos-ayuda-limites-titulo = O que os Escudos não fazem
escudos-ayuda-limites-ip = <strong>Não ocultam seu endereço IP.</strong> Todos os sites que você visita o veem e, com ele, sabem mais ou menos onde você está. Para ocultá-lo, é preciso o Tor ou um proxy.
escudos-ayuda-limites-detectable = <strong>Não são invisíveis.</strong> Um site pode perceber que você bloqueia coisas ou oculta dados, e algum vai avisar. Nenhum bloqueador evita isso 100%.
escudos-ayuda-limites-tor = <strong>O { -brand-short-name } não é o Tor Browser.</strong> O Tor Browser faz todos os usuários parecerem o mesmo navegador e oculta o IP. O { -brand-short-name } reduz o que um site pode saber de você, mas um site determinado ainda pode distinguir você.
escudos-ayuda-limites-cuenta = <strong>Não escondem você do site em que você entra na conta.</strong> Se você entrar na sua conta, esse site sabe quem você é. O que os Escudos fazem é impedir que ele siga você por outros sites.

## Lo que viene

escudos-ayuda-pronto-titulo = O que vem por aí
escudos-ayuda-pronto-que = Esta página só descreve o que funciona hoje. Isto ainda não existe:
escudos-ayuda-pronto-motor = Escolher as listas de filtros uma a uma e adicionar as suas.
escudos-ayuda-pronto-scripts = Bloquear scripts site a site.

## Estricto+, molestias, excepciones por sitio y listas de filtros (los nombres, como en el panel y en Ajustes › Escudos)

escudos-ayuda-nivel-estricto-mas = <strong>Rigoroso+</strong> (o padrão) é o Rigoroso com uma lista de rastreamento mais ampla, a AdGuard Tracking Protection. Usa um pouco mais de memória.
escudos-ayuda-molestias-titulo = Incômodos
escudos-ayuda-molestias-que = Além de anúncios e rastreadores, os Escudos ocultam três tipos de incômodos, cada um com seu interruptor: <strong>Avisos de cookies</strong> (os banners de consentimento), <strong>Pop-ups e banners</strong> (janelas pop-up, banners para instalar apps e widgets) e <strong>Avisos antibloqueador</strong> (os que pedem para desativar o bloqueador). Vêm ativados.
escudos-ayuda-molestias-donde = Eles são ativados e desativados para todos os sites nas opções avançadas do painel ou em Configurações › Escudos. Para um só site, use as exceções dele.
escudos-ayuda-molestias-cookies = Ocultar um aviso de cookies nem sempre equivale a recusá-los: se você não responder, o site faz o que tiver como padrão, e alguns salvam cookies mesmo assim.
escudos-ayuda-molestias-falla = Se um site não deixa continuar sem responder ao aviso, ou um botão de que você precisa está numa janela que é ocultada, adicione para ele uma exceção desse grupo. Os avisos antibloqueador não são removidos em todos os sites: alguns percebem o bloqueio de outras formas.
escudos-ayuda-excepciones-titulo = Exceções por site
escudos-ayuda-excepciones-que = Uma exceção faz os Escudos deixarem passar algo em um site específico. Elas ficam em Configurações › Escudos › «Exceções por site» e, no painel, em «Exceções deste site…». Valem para o site inteiro (exemplo.com e seus subdomínios).
escudos-ayuda-excepciones-todo = <strong>Permitir tudo</strong> é o mesmo que desativar os Escudos com o interruptor grande do painel: nada é bloqueado. É o mais rápido quando um site falha.
escudos-ayuda-excepciones-grupos = Se preferir ajustar melhor, escolha o que permitir: anúncios, rastreadores das listas, avisos de cookies, pop-ups e banners, avisos antibloqueador, elementos ocultos ou scripts das listas. O resto continua bloqueado.
escudos-ayuda-excepciones-herencia = Se um grupo está desativado para todos os sites, na exceção ele aparece como «Permitido por um ajuste geral» e não pode ser mudado ali: para mudar, ative-o de novo no geral.
escudos-ayuda-excepciones-guardado = Elas ficam salvas no seu dispositivo como permissões do site. Se você esquecer o site ou apagar os dados dele ou o histórico, elas são apagadas junto. As que você cria em uma janela privativa duram até você fechar a última janela privativa.
escudos-ayuda-excepciones-rastreadores = A exceção de rastreadores só afeta as listas de filtros: a proteção contra rastreamento do navegador continua ativa. Para desativá-la também, use «Permitir tudo».
escudos-ayuda-listas-titulo = Listas de filtros
escudos-ayuda-listas-que = O que o bloqueador próprio dos Escudos bloqueia é decidido pelas listas de filtros dos seus autores: uBlock Origin, EasyList, AdGuard e Brave. O nível e os incômodos escolhem quais são usadas, e entram também as do idioma do { -brand-short-name }.
escudos-ayuda-listas-copia = O { -brand-short-name } vem com uma cópia das listas, então bloqueia desde o primeiro momento, sem se conectar a nada.
escudos-ayuda-listas-actualizar = Se em Conexões você permitir «Listas de proteção», as listas se renovam sozinhas: uma verificação por dia, e cada lista só é pedida ao autor quando expira, sem cookies e sem dizer quais sites você visita. Se uma lista nova chegar com problema, fica a anterior. Em Configurações › Escudos você pode desativar isso, escolher a cada quanto tempo elas se renovam ou pedi-las agora.
