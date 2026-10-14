# Direção artística — refúgio pessoal de estudo

[← Documentação](README.md) · [Guia de uso atual](uso.md) · [Histórico de implementação](historico-implementacao.md)

Consolidação das respostas do proprietário e pesquisa aplicada, atualizada em 12/10/2026. Este documento distingue direção aprovada, recomendações e funcionalidades entregues. Caderno e portal agora compartilham a identidade de madeira e papel; entradas anteriores registram o histórico. O roteiro de implementação está em [passo-a-passo.md](passo-a-passo.md).

## Decisões complementares e exemplos visuais

### Refinamento do portal e câmera — 13/10/2026

Capa clicável e informações/ações agora são elementos irmãos em grid: o centro da capa abre o caderno, enquanto Organizar e favorito têm áreas próprias, sem posição absoluta. Metadados ficam próximos da capa e grupos longos quebram linha. Perfil mostra as quatro métricas reais já calculadas no Progresso, com painéis ajustados ao conteúdo. Controles, destinos e retomada usam cantos e estados consistentes; seleção de abas ganha peso e borda, favorito ganha preenchimento. Madeira tem veios mais suaves e repetição maior; livros do login recebem lombadas e bordas de papel mais definidas. Entrada móvel reduz a faixa de marca e elimina espaço residual de erro vazio.

A câmera centraliza a capa inteira e aproxima a folha ativa após abrir. Ajustar largura/Voltar à escrita enquadram a folha; Ver inteiro enquadra as duas faces. Redimensionar recalcula o modo automático e recentraliza o modo manual sem trocar seu zoom. Retomada usa os limites atuais da escrita. No celular, painéis começam fechados, a faixa de ferramentas fica acima da folha e a largura de texto se adapta somente na apresentação; notas, IDs, divisão das páginas e largura lógica de 840 px permanecem iguais. Altura comum se ajusta ao conteúdo renderizado pelo mecanismo existente. Mover caderno aceita arraste com mouse ou toque quando ativado; Escape encerra.

Sem dependências ou alteração de formato privado. Novo teste cobre centralização sem acumular deslocamento e o teste de pan inclui toque. Build, sintaxe de 38 arquivos, CSS pelo esbuild e 48 testes aprovados, incluindo SQL/API. Navegador: capa/ações/favorito separados; perfil inteiro em 1280×720; telas em 800×600; login/cadastro e leitura visual/Markdown em 390×844. Zoom manual 86% preservado ao redimensionar e 99% preservado ao virar; título editado na prévia e retomado corretamente, duas páginas e largura lógica de 840 px preservadas. Painéis móveis fechados e texto sem recorte lateral no conteúdo ensaiado. Botão Abrir caderno mantém alvo de 44 px visuais mesmo na visão inteira. Toque físico, teclado virtual e conteúdo arbitrariamente longo não foram ensaiados; o pan por toque foi verificado por eventos no teste.

### Título integrado ao papel e margem removida — 13/10/2026

O cabeçalho das folhas também deixa de exibir LIBRARY4 / NOTAS. Remoção no HTML original alcança as folhas e suas cópias da virada; regras do último span foram removidas para não ocultar o número da página no celular.

O campo de título não recebe a sombra rebaixada dos controles retrô: permanece transparente, sem borda, com indicação de foco ao editar. A linha vertical decorativa da margem foi removida de todas as folhas, incluindo cópias da virada, sem alterar pautas, conteúdo ou dimensões. library.css exclui .page-title do relevo geral; notebook.css desativa o pseudo-elemento somente nas folhas, preservando a moldura das capas. Conferência na prévia confirmou título sem sombra/borda e margem ausente; CSS validado pelo esbuild.

### Remoção de texto decorativo — 13/10/2026

Entrada ilustrada reduzida à marca maior e estante sem textos nos livros ou bilhete. Home conserva somente ícones, nomes dos destinos e retomada; coleção remove apresentação, cabeçalho redundante, ajuda decorativa, resumo da busca e rodapé. Perfil, Social, Progresso e diálogos usam títulos diretos, sem slogans. Botões estáticos e gerados pelo JavaScript não exibem setas; ações de navegação e desfazer/refazer mantêm rótulos acessíveis. Avisos de privacidade, recuperação, erros, salvamento e funções indisponíveis continuam presentes.

Mudanças em index.html/app.js eliminam elementos e seus escritores; library.css remove regras obsoletas, centraliza marca/estante e simplifica áreas do grid. Sem dependências nem alterações nas notas ou no fluxo de proteção.

Validação: 47 testes aprovados (incluindo SQL/API), sintaxe de 38 arquivos JavaScript e CSS validado pelo esbuild. Navegador conferiu login/cadastro, Home, Perfil, Progresso, Social, coleção, diálogo e abertura do caderno na prévia; sem erros de console. Rótulos Anterior/Próxima cabem nos controles. Entrada móvel em 390×844 mantém rolagem externa. Fluxo autenticado completo e toque físico não reensaiados nesta remoção de texto.

### Enquadramento na janela — 13/10/2026

Acima de 720 px de largura, html/body bloqueiam a rolagem externa e a entrada/portal ocupam 100dvh. Cabeçalhos usam altura própria, main recebe o restante e as telas têm min-height zero para poder encolher. Margens, títulos e ilustrações respondem à altura disponível. Cadastro distribui campos em duas colunas; home conserva os três destinos. Estantes organizam cabeçalho/filtros em grid, dedicando o restante à coleção; em janelas baixas, capas menores têm metadados e ações ao lado. Perfil/Social usam painéis limitados e Progresso mantém quatro métricas na mesma linha no desktop.

Conteúdo arbitrariamente grande não é cortado nem reduzido até ficar ilegível: formulários/painéis/lista podem rolar internamente quando necessário, mantendo página e navegação enquadradas. Diálogos conservam seu limite de altura e rolagem interna. Em até 720 px, entrada e portal mantêm o fluxo/rolagem móvel existentes. O caderno mantém sua geometria, zoom/pan e controles próprios. Implementação somente em library.css, sem lógica, dependências ou alterações de dados.

Validação: parsing CSS pelo esbuild sem avisos e 47 testes aprovados, incluindo SQL/API. Ensaio no navegador em 1280×600 e 800×600 confirmou home/perfil/social/estantes com altura externa igual à janela; progresso conferido em 800×600 e home em 1280×720. Login/cadastro também mantêm a página fixa, com fallback de rolagem interna no cadastro baixo. Em 390×844, login/home conservaram rolagem externa. Testes visuais usam a prévia em memória; não substituem ensaio de toque físico ou todas as combinações de zoom do navegador.

### Controles retrô e materiais — 13/10/2026

A identidade mantém os marrons, creme, tipografia literária e biblioteca rústica. As referências de Windows antigo, MSN e skins servem para relevo e interação, sem copiar interfaces ou assets: botões chanfrados, campos rebaixados, abas pressionadas e painéis com moldura discreta. Cursor próprio pixelado para mouse, mão em ações, I-beam na escrita e indicação de arraste nas bordas; celular conserva interação nativa. Foco visível, controles indisponíveis, movimento reduzido e alto contraste continuam considerados.

Arte combina CSS com SVG próprios locais: veios e nós da madeira, granulação estática de materiais e cursores. Madeira aparece na entrada, portal, mesa de madeira/escura e prateleiras; linho conserva seu acabamento. Livros do login ganham nervuras e faixas de encadernação. Papel e couro do caderno recebem granulação, incluindo faces de virada; material liso e opção sem textura mantêm suas escolhas. Nenhuma biblioteca gráfica nova: o shader WebGL opcional existente continua responsável apenas pela luz ambiental, e texto/edição permanecem HTML.

Integração alcança library.css, quatro SVG públicos e lista explícita de assets em server.js. Teste de assets verifica MIME e bloqueio de caminhos não publicados. Não muda dimensões das folhas, paginação, dados privados ou autosave. Renderização 3D e ilustrações pré-renderizadas mais elaboradas são possibilidades para avaliação posterior, não entregas desta rodada.

Validação: build concluído, sintaxe de 38 arquivos JavaScript, 47 testes aprovados sem skips (incluindo SQL/API), parsing CSS pelo esbuild sem avisos e diff sem erros de whitespace. Navegador conferiu login, abertura do caderno e abas, além de entrada/painel com viewport de 390×844; entrada sem transbordamento horizontal. Toque físico, desempenho prolongado e todas as rotas autenticadas não foram ensaiados nesta rodada.

### Portal de biblioteca — 12/10/2026

Entrada em duas superfícies: convite sobre madeira ilustrada e formulário sobre papel claro. Livros e prateleira são composição própria em CSS; ícones dos três caminhos são SVG locais originais. Paleta marrom/creme, luz quente e acabamento discreto conservam a direção do caderno, sem reproduzir Minecraft. No celular, o convite se reduz e os destinos ficam em uma coluna; controles preservam rótulos/foco e movimento reduzido elimina elevação das capas/cartões.

Início após desbloqueio oferece Perfil, Estantes e Social; retomada fica explícita. Estantes usam capas personalizadas, prateleiras discretas, busca/favoritos e grupos com seleção por teclado. Perfil contém dados reais e métricas da biblioteca desbloqueada. Feed/pessoas/conversas têm estados de construção claros e controles indisponíveis, sem conteúdo social fictício ou publicação automática. A navegação utiliza histórico do navegador, respeitando bloqueio de saída quando o editor não consegue sincronizar texto visual.

Escopo alcança index.html, app.js, library.css e registro de asset no servidor; não troca editor, banco, formato privado ou dependências. Integração SQL/API ampliada testa reentrada/desbloqueio e reabertura de capas/estantes/notas. Build, sintaxe e 45 testes aprovados. Navegador ensaiou rotas, duas páginas escritas e filtros; 390×844 sem transbordamento horizontal da home. Não declarar social funcional, recuperação de conta ou implantação pública concluídos.

### Guarda vazia durante a virada — 12/10/2026

As cópias inertes de destinos sem página agora escondem os contêineres reais `.visual-host` e `.markdown`; os seletores anteriores `.page-visual`/`.page-preview` confundiam IDs com classes e deixavam a escrita antiga visível sobre a guarda. A folha móvel conserva frente/verso corretos e a guarda permanece vazia até aterrissar. Sem alterar notas, salvamento ou duração do movimento. Ensaio por arraste confirmou editor/prévia/textarea com display none na guarda intermediária, cancelamento curto preservando página 2 e remoção das cópias após concluir. Leitura Markdown também ensaiada; toque físico não testado.

### Redução de tamanho sem altura residual — 12/10/2026

O cálculo de altura deixa de acumular o maior valor histórico. Primeiro remove a altura fixa das duas faces, mede a necessidade natural e aplica a maior altura entre essa medida e a capacidade atual do caderno. Guardas descartam a capacidade herdada de uma página anterior. As duas faces e capas continuam do mesmo tamanho, com rodapé na base mesmo quando a página ativa tem menor capacidade que as demais. Conteúdo excedente mantém a divisão existente, sem recorte ou alteração do formato privado.

Regressão automatizada cobre redução grande/médio/pequeno e conteúdo maior que a capacidade; 45 testes e sintaxe de 37 arquivos aprovados. Ensaio na prévia confirmou alturas lógicas 1576 → 1240 → 904 px, rodapé na base, guardas alinhadas, contracapa acompanhando 904 px e preservação de 148 palavras ao dividir por mudança de fonte. Sem dependências novas; toque físico não ensaiado.

### Continuidade da virada — 12/10/2026

Virada completa em 720 ms e leve em 260 ms, com aceleração/desaceleração suaves; continuação do arraste preserva o ângulo e tem mínimo de 120 ms. Retorno curto em 220 ms. Sombra usa a mesma curva temporal e acompanha o ângulo restante, sem reacender perto da aterrissagem. Faces separadas por 0,5 px no eixo Z e decoração com verso oculto; prévias não duplicam a sombra da encadernação. Não alterar notas ou geometria para animar.

A prévia de texto usa o mesmo parser/schema/serializador do editor visual, sem carregar a nota no editor nem disparar edição. A face estacionária conserva seu DOM real, e o modo Markdown preserva a superfície de origem. Cópias de capas mantêm material, padding e lombada; guarda animada tem acabamento compatível com a guarda assentada. Fechamento limpa temporários uma única vez e apresenta ferramentas de capa depois de pousar. Build, sintaxe e 44 testes aprovados; comparação no navegador confirmou diagramação e material iguais entre cópias e destinos. Desempenho em aparelhos modestos e toque físico não medidos.

### Objeto físico e bancada de ferramentas — 12/10/2026

Revisão vigente: a geometria pertence ao caderno, não ao espaço sobrando na tela. Cada face tem 840 px lógicos e a abertura 1680 px; altura comum acompanha capacidade e conteúdo, sem achatar capa ou folha. Zoom/pan enquadram esse objeto; telas menores conservam a abertura física e usam aproximação/deslocamento. Primeira frente à direita, versos pares à esquerda, frentes ímpares à direita. Guarda inicial/final e verso final vazio não inflacionam produção nem alteram páginas existentes. Voltar à escrita aproxima para leitura confortável e acompanha o cursor.

Avançar gira a folha direita sobre a lombada até o lado esquerdo; voltar faz o caminho inverso. Frente e verso têm conteúdos distintos renderizados com segurança. Prévia fica sob a face de saída, enquanto a face oposta antiga continua até a folha pousar. Depois, a face real ocupa o lugar da cópia. Capas fecham/abrem no mesmo eixo, com revestimento externo separado da guarda interna. Espiral ocupa a dobra central, com furos nas duas margens, anéis metálicos e sombra; remover a antiga régua colorida externa. Não há simulação de curvatura contínua ou espessura por número de folhas nesta entrega.

Controles em uma bancada lateral recolhível: Texto/Páginas/Caderno/Mesa. As quatro seções têm acesso direto e somente uma fica aberta; submenus de aparência/ambiente foram substituídos por grupos visíveis. Cor/material específicos da capa ficam no grupo contextual, separados do padrão da encadernação. Escrever/Ler permanecem no cabeçalho; navegação e criação na base. Capas/guardas desabilitam formatação de notas. Zoom e padrão de papel pertencem ao caderno; luz, mesa e lembrete pertencem ao ambiente. Confirmados 42 testes e ensaios desktop de edição, guardas/extremos, espiral, retorno curto e escala; toque físico ainda pendente.

### Personalização e anatomia das capas — 11/10/2026

Front/back são superfícies distintas da mesma encadernação: frente com lombada à esquerda, traseira com lombada à direita, cantos e área de acabamento espelhados. A traseira começa sem título repetido, com marca discreta inferior; títulos/frases próprios são opcionais. Um livro encadernado reúne placas, revestimento, lombada, folhas e guardas, conforme a [British Library](https://events.bl.uk/events/bookbinding-masterclass). Nesta etapa a guarda aparece no verso animado, sem acrescentar páginas de estudo artificiais. A representação permanece cartunesca; não declarar simulação física completa ou curvatura de folha entregue.

Escrever permite editar título/matéria diretamente e personalizar o lado ativo no painel direito; Ler protege a superfície. Uma imagem por lado, importada localmente e reprocessada em WebP, posicionada por porcentagens para acompanhar zoom/tamanho. Moldura/alças só aparecem na seleção editável e são removidas das cópias de virada. Arraste/resize salvam apenas ao concluir; Escape/perda de captura/resize da janela cancelam e restauram posição. Texto confirma ao sair do campo/Enter, Escape retorna ao texto inicial. Painel não inicia movimento da mesa; Ctrl continua tendo prioridade no caderno. Capa/contracapa navegam por gesto e botões, com prévia do destino e cancelamento existentes.

Material/cor/textura/textos/imagem de cada lado pertencem ao envelope privado do caderno, incluídos na recuperação e cópia de conflito. Não persistir arquivos em claro ou expor anexos ao administrador. Limites: uma imagem por lado, 120 KB reprocessados, sem recorte/rotação ou camadas múltiplas. Guardas navegáveis, posição física de recto/verso, espessura progressiva e superfície curva ficam como próximos refinamentos específicos, não entregas desta etapa.

### Abertura com geometria contínua — 11/10/2026

Correção do salto entre capa e folha: usar as dimensões reais da primeira/última folha para capa/contracapa, retirando limite de 520 px e proporção independente. Medir dimensões visuais e dividir pelo zoom; recalcular ao mudar escala, capacidade e largura disponível. A medição temporária do spread oculto ocorre sem intervalo de pintura, restaurando o estado em finally. Em dupla, a capa corresponde a uma folha, não à soma do par.

Preservar margem do caderno e rolagem ao abrir; cópia animada realinhada à origem do estágio de destino. Fechar leva o estado à página da capa correspondente, permitindo recalcular corretamente após resize. Em até 1100 px, painel de formatação sobreposto evita empurrar a cena; o espaço do controle permanece reservado com capa fechada. Tamanhos de página distintos continuam possíveis; conteúdo não é cortado para forçar igualdade entre páginas.

35 testes e sintaxe aprovados. Teste novo cobre escala pequena/grande, deslocamento, posição lateral e restauração de visibilidade, inclusive em erro; teste de movimento cobre mudança de origem. Ensaio da prévia: abertura a 100% e 40% com largura/altura/X/Y/rolagem idênticos, fechamento a 40%, duas folhas com capa/contracapa alinhadas e abertura em 320 px sem alteração de geometria/rolagem. Sem novas bibliotecas ou mudança de salvamento. Toque físico e curva física contínua seguem pendentes.

### Zoom e manipulação da mesa — 11/10/2026

Escala entregue: 10–800%, com passos proporcionais pela roda com Ctrl. A folha mantém largura lógica ao ampliar; a capa também evita recalcular a largura pela escala. O objeto reduzido fica centralizado. Não há caixa intermediária de recorte: somente os limites naturais da tela, com arraste para trazer áreas ampliadas de volta.

Ctrl+arraste e Mover agora iniciam também na madeira, fora do contorno do caderno. Deslocamento X/Y afeta somente o objeto; HUD e navegação preservam posição. Painéis/botões não iniciam gesto, caderno oculto não intercepta Ctrl, soltar Ctrl/Escape interrompe, e Centralizar/Ajustar largura zera X/Y. A rolagem normal continua disponível. Preferência cifrada usa a nova validação de escala, sem alterar SQL ou conteúdo.

Sintaxe e 34 testes aprovados. Prévia ensaiada com 10%, 168% e 800% (840 px lógicos da folha preservados), e arraste iniciado na mesa fora da folha. Ctrl/soltura, reset X/Y, Escape e caderno oculto cobertos em teste. Limite finito é intencional; toque físico e desempenho em dispositivos fracos ainda exigem ensaio.

### Bordas da folha e caderno livre na mesa — 11/10/2026

Correção aprovada: a folha é puxada pela borda inteira, não apenas por uma ponta. Faixas transparentes nas quatro bordas externas mantêm a escrita livre; direção inicial para esquerda avança, direita volta. Laterais permitem clique/teclado; superior/inferior exigem arraste para evitar navegação acidental. Em duas folhas, a costura interna continua fora do gesto. Ctrl ou Mover desloca o caderno e não vira páginas.

Removida a área de rolagem própria que recortava a animação e mostrava barras internas. A cena usa rolagem vertical normal e deslocamento horizontal do objeto, preservado no zoom; Centralizar/Ajustar largura restaura posição. A mudança de folha não força retorno ao topo, e o gesto conserva a rolagem do início ao fim. Os limites da tela continuam naturais; folhas altas exigem rolagem. O acesso ⌟ anterior foi retirado, já que existe borda lateral ao longo de toda a altura. A virada continua uma dobra articulada, sem simulação de curva física contínua.

Sintaxe de 34 arquivos e 34 testes aprovados. Testes cobrem direção livre, rolagem estável, cancelamento, prioridade de Mover e deslocamento sem alterar scrollLeft. Prévia ensaiada nas bordas superior/inferior/lateral, arraste curto e Mover sem navegar. Sem novas bibliotecas ou mudança de conteúdo/autosave. Toque físico permanece pendente.

### Clareza da escrita e acesso às pontas — 11/10/2026

Complemento entregue da rodada: entrelinha de escrita/leitura em 1,75, mantendo margens de parágrafo em 0,65 em e itens de lista em 0,2 em. A pauta continua referência visual, sem promessa de alinhar títulos e fontes diferentes a todas as linhas. Seleção nativa tem fundo quente e texto escuro; seleção visual fora do foco recebe decoração temporária do ProseMirror ao abrir fonte/tamanho/controles. Funciona também em Ctrl+A. Decoração não modifica o documento nem a serialização; desaparece na leitura, seleção vazia ou retorno ao foco. A fonte Markdown conserva seleção nativa, sem decoração customizada persistente.

Para folhas altas, ⌟ na navegação inferior desloca até a ponta real externa da folha ativa e foca seu botão. A pessoa pode então arrastar ou pressionar Enter/Espaço; não precisa descobrir um canto fora da tela nem abrir menus de personalização. Em folha esquerda de uma dupla usa o canto anterior externo; em folha direita usa o posterior. Capa/contracapa escondem o acesso. Navegação inferior foi compactada em até 380 px, mantendo alvos de pelo menos 44 px. Não são pontas falsas fixadas no meio do papel. Voltar à escrita continua disponível no Zoom, com seleção do editor preservada.

Corrigido cancelamento: gesto interrompido por Escape/perda de captura não confirma o clique residual ao soltar. Retorno de arraste curto é rastreado e cancelado junto ao restante do caderno, inclusive por escrita visual/colagem, navegação e resize. Unit tests cobrem cancelamento com limpeza, clique residual, teclado, confirmação e retorno; teste de seleção cobre faixa entre parágrafos, Ctrl+A, leitura, cursor vazio e integridade do documento. Build/sintaxe e 34 testes aprovados. Prévia ensaiada com escrita, destaque ao abrir fonte, leitura sem decoração, ponta em folha grande, arraste curto mantendo a página, Enter navegando, dupla de folhas e 320 px sem transbordar a página. Evidência: `tmp/library4-selection-polished.png`. Escape durante gesto e perda de captura foram exercitados pelos testes unitários; não afirmar ensaio manual de toque/IME físico ou conforto prolongado.

### Capa, ferramentas e luz viva — 11/10/2026

Rodada entregue: capa/contracapa em proporção vertical 3:4 e até 520 px, título quebrável, lombada desenhada dentro da capa e poucas camadas inferiores alinhadas. O estado fechado usa sombras próprias para não herdar extrusões negativas dos modelos de folha. Couro ilustrado, tecido e acabamento liso permanecem arte CSS original. Folha aberta continua alta e rolável, conforme a capacidade; a capa não passa a definir o tamanho das anotações.

Fluxo de escrita: seleção/cursor na folha → Alt+1/2/3 para título ou Alt+L para lista; B/I e tinta continuam por teclado ou botões. Ctrl+1/2/3 não é interceptado, pois troca abas em navegadores. Comandos anteriores permanecem compatíveis. “Folha e texto base” recolhe ajustes ocasionais; fonte/tamanho/tinta da seleção seguem diretos. Aparência usa pares de controles, caixas de seleção de 18 px com rótulo clicável e painéis de até 340 px. Zoom → Ajustar largura enquadra com limite mínimo de 80%; pode continuar exigindo rolagem horizontal quando esse limite for insuficiente. Espaçamento de parágrafos/listas foi reduzido; hover da faixa é discreto e foco restabelece sua opacidade. Corrigida restauração do cursor em nós sem texto inline, observada ao desfazer uma lista.

Virada mantém confirmação/cancelamento existentes e acrescenta sombra que acompanha a posição, verso texturizado e indicação de canto. Capas usam frente/verso rígidos sem ponta dobrada. Não equivale a simulação contínua da curvatura do papel; não foi entregue um motor físico. Redução/desligamento de movimento e escrita cancelam as cópias conforme o fluxo anterior.

Luz amarela/janela/noite agora têm áreas localizadas e transição de opacidade, mantendo iluminação global sobre o caderno. Papel recebe granulação estática fina. **Luz viva** é experimento opcional, desligado por padrão: shader WebGL nativo sobre o ambiente com variação lenta, sem renderizar conteúdo ou receber notas. Buffer máximo 960×640, escala de até 0,6 e limite de 30 desenhos/s; requestAnimationFrame continua sendo agendado enquanto ativo. Movimento full, aba visível e preferência do sistema sem redução são necessários. Fora desses estados pausa; falha de inicialização/perda de contexto esconde o canvas e informa fallback estático. Restauração do contexto recompõe recursos. Não há CDN nem nova biblioteca. O desenho segue [boas práticas WebGL da MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices): buffer menor, atributo zero habilitado e liberação dos recursos temporários.

Verificação: build, sintaxe de 33 arquivos e 32 testes sem falhas/skips. Novos testes verificam política opt-in, resolução, limite de desenhos, pausa/retomada, falta/perda/restauração de contexto. Ensaio da prévia verificou shader compilado/ativo, desligamento por modo off, Alt+2/Alt+L, undo/redo, criação/escrita de página, capa/contracapa, modelos, enquadramento e layout sem transbordamento da página em 320/768 px. `tmp/library4-cover-polished.png` registra a capa. Não houve medição de GPU/FPS/bateria, IME físico ou teste com participantes; o ensaio não comprova conforto prolongado. A lista de prioridades de 10/10 abaixo é histórica; esta seção registra o alcance efetivamente entregue.

### Atalhos e seleção de tinta — 10/10/2026

Entregue: teclado complementa os botões, sem retirar comandos visíveis. Ctrl/Cmd+B/I alternam negrito/itálico; Alt+1/2/3 com Ctrl/Cmd escolhem títulos; Ctrl/Cmd+Shift+8 alterna lista; undo/redo usam o histórico existente. As dicas dos botões mostram as combinações. Shift+C só abre a paleta com seleção no conteúdo focado; sem seleção é digitação normal. Não capturar copiar/colar nem Ctrl+Shift+I. Composição/AltGraph/repetição não acionam o mapeamento. A restrição de foco segue a orientação de [atalhos de caracteres da W3C](https://www.w3.org/WAI/WCAG21/Understanding/character-key-shortcuts.html); não constitui auditoria completa de acessibilidade. Shift+C substitui a digitação de C quando há seleção, escolha explícita desta interação.

Fluxo: selecionar trecho → Shift+C ou Mais cores → escolher preset/aplicar HEX/RGB/seletor → retornar à folha conservando seleção e formatos; Escape cancela. Paleta compacta com foco contido, labels e erros; RGB exige inteiros 0–255 e HEX seis dígitos. Tinta personalizada é atributo validado no Markdown existente e usa o autosave cifrado, sem biblioteca nova. Cores arbitrárias podem ter contraste insuficiente; não ajustar a escolha silenciosamente. No editor visual funciona junto com negrito/itálico e reabertura; a fonte avançada mantém a personalização literal de uma linha. O aviso de `white-space` do ensaio anterior foi corrigido com `pre-wrap`.

Verificado: build/sintaxe e 29 testes, incluindo RGB inválido/CSS malicioso e composição/AltGraph/atalhos reservados; ensaio na prévia confirmou seleção+B/I, aplicação RGB/HEX, reimportação da tinta, Escape, títulos/lista e undo/redo. Evidência: `tmp/library4-shortcuts.png`. Sistemas, layouts físicos/IME e leitor de tela ainda não verificados nesta rodada; prévia não comprova persistência remota.

### Ensaio de uso e prioridades de VFX — 10/10/2026

Ensaio feito na aba de prévia `http://127.0.0.1:8006/?preview=1`, sem conta ou persistência. Foram criadas duas páginas curtas: “Um sábado de estudo” e “Pequenos próximos passos”. Exercitados escrita visual, seleção/negrito/tinta azul, lista de três itens, desfazer/refazer, quadriculado, luz noturna/janela, tecido, espiral/costura, zoom pelo controle, uma/duas folhas, navegação e arraste da ponta. O arraste confirmou a passagem da página 3 para a 4; a navegação preservou os trechos. Este é um ensaio do agente, não uma pesquisa com participantes nem verificação de autosave/criptografia.

**Observações desta sessão:** o papel alto e a pauta integral aproximam a composição da direção aprovada; a luz alcança a folha, mas o material ainda parece uniforme. A personalização aberta encobre boa parte do caderno; a coluna de texto ocupa altura mesmo sem seleção. Duas folhas em 100% exigem deslocamento horizontal nesta janela. A ponta fica no fim da folha alta, longe do começo da escrita; a navegação fixa oferece uma alternativa importante. Os parágrafos e itens deixam intervalos perceptíveis: comparar ritmo de escrita e pauta antes de acrescentar decoração. A virada atual articula planos, não uma superfície continuamente flexível; o código confirma esse limite. Não foi medido engasgo nem perda de frames.

**Pendência técnica observada:** o console emitiu um aviso do ProseMirror sobre `white-space`, recomendando `pre-wrap`/estilos do editor. Investigar a regra efetivamente calculada e validar espaços, quebras, seleção e colagem antes de corrigir; o aviso não prova perda de conteúdo. Nenhum erro de console apareceu na consulta feita, que não cobre toda a execução futura.

Ordem recomendada para a próxima implementação, ainda não entregue:

| Prioridade | Efeito ou ajuste | Fluxo e critério de conclusão |
| --- | --- | --- |
| 1 | Virada com sombra de dobra, verso e espessura coerentes | Aproximar a ponta → indicar discretamente que pode arrastar → luz/sombra acompanham o ângulo → confirmar ou retornar sem salto. Botões e teclado permanecem equivalentes; edição e cancelamento removem camadas temporárias. |
| 2 | Materiais ilustrados e luz localizada | Textura estática fina de papel/couro/tecido, sombra de contato sob o caderno e queda suave da luz da janela/luminária. A pauta continua inteira; texto permanece nítido e contraste deve ser conferido em todos os presets. |
| 3 | Ferramentas com presença menor | Separar seleção de folha, reduzir a área ocupada por personalização e oferecer enquadramento das duas folhas. Revelação por hover também por foco/toque, com opção de manter ferramentas abertas. Não esconder estado de salvamento nem navegação. |
| 4 | Feedback discreto de interação | Usar os efeitos existentes de hover/pressionamento como base; melhorar indicação de seleção, ponta e conclusão da virada. Nenhuma partícula por tecla, movimento do texto, tremor de câmera ou brilho sobre a leitura. Som futuro opcional e desligável. |
| 5 | Ensaio opcional de shader ambiental | Somente se houver ganho visual comparado ao CSS: chuva/reflexo numa área de janela ou luz suave no ambiente. Preservar texto em DOM, canvas decorativo sem capturar entrada, fallback estático e efeito desligável. Janela/cenário detalhado continuam posteriores ao acabamento do caderno. |

**Técnica proposta:** começar com gradientes e camadas estáticas; animar transformação/opacidade das camadas de sombra em vez de recalcular sombras borradas por frame. O [guia do web.dev](https://web.dev/articles/animations-guide) recomenda essas propriedades e verificar layout/pintura com DevTools; não promete fluidez automaticamente. Evitar `will-change` permanente sem evidência de necessidade. A dobra contínua exigiria um protótipo próprio e comparação com a solução articulada; um shader isolado não torna o conteúdo DOM uma folha flexível.

WebGL nativo permite avaliar um shader sem nova biblioteca, mas GPU, resolução e disponibilidade de contexto variam. Seguir [MDN: boas práticas WebGL](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices): orçamento de memória, tamanho do buffer e recuperação/fallback para perda de contexto. Proposta para o ensaio: camada ambiental de resolução limitada, animação somente quando habilitada/visível, sem loop gráfico em uma cena estática. Limites de resolução e qualidade devem vir da medição, não de uma promessa de funcionar em qualquer aparelho. Aproveitar Completa/Leve/Sem movimento e respeitar [prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion), sem criar configurações redundantes antes da necessidade.

**Validação antes de promover VFX:** comparar efeito ligado/desligado digitando, selecionando, desfazendo, virando e rolando folhas pequenas/grandes; conferir toque, teclado, redução de movimento, aba oculta, zoom e cancelamento. Medir frames perdidos, tempo de resposta à entrada e memória em hardware modesto; verificar consumo de bateria em uso prolongado. A prévia não permite concluir sobre salvamento. Evidência visual fictícia: `tmp/library4-vfx-review.png`; os textos desta sessão serão perdidos ao recarregar. Esta rodada documenta análise, sem novos shaders ou alterações de comportamento.

### Escrita visual, ferramentas laterais e acabamento — 10/10/2026

As três imagens mais recentes expuseram sintaxe na escrita, ferramentas escondidas em vários níveis e espessura inferior diagonal. Esta rodada troca a edição padrão por Tiptap visual, aprovado junto a esbuild, preservando Markdown privado. A faixa lateral oferece comandos de seleção diretamente: formatação primeiro, fonte/tinta/tamanho, ajustes da folha e fonte avançada por último. Estado ativo tem indicação discreta; hover sobe 2 px e pressionamento reduz ligeiramente, respeitando redução de movimento. No celular a faixa começa recolhida; quando aberta ocupa uma linha própria e não uma coluna estreita ao lado dos outros acessos.

Pesquisa complementar em fontes oficiais: [Photoshop: organização do espaço](https://helpx.adobe.com/photoshop/desktop/get-started/learn-the-basics/workspace-overview.html) e [painéis](https://helpx.adobe.com/uk/photoshop/desktop/get-started/learn-the-basics/add-remove-panels.html) orientam separar ferramentas recorrentes de propriedades; [toolbar de Ink Canvas](https://support.microsoft.com/en-us/ink-canvas/usethetoolbarininkcanvas) é referência de comandos diretos. São adaptações de interação, sem copiar aparência e sem alegar teste com nossos usuários. A pesquisa anterior de Word/Docs/Obsidian/Notion abaixo continua complementar.

Integração técnica: [Tiptap vanilla](https://tiptap.dev/docs/editor/getting-started/install/vanilla-javascript), [Markdown](https://tiptap.dev/docs/editor/markdown/getting-started/basic-usage) e [marca personalizada](https://tiptap.dev/docs/editor/markdown/guides/create-a-highlight-mark). Evitar `execCommand` para esta base: a [API é obsoleta](https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand). Tiptap cuida da seleção/documento; undo/paginação/rascunhos seguem o modelo existente. Markdown é normalizado somente ao editar; estilos antigos literais são importados e a nova marca comporta Markdown seguro. A extensão Markdown é Beta; não prometemos roundtrip universal de todos os dialetos. Colagem externa recebe apenas texto, renderizado com HTML desativado.

Arte: sombras das camadas inferiores agora têm deslocamento vertical alinhado, sem “pé” diagonal; capas usam cor hexadecimal ou modelo, couro ilustrado/tecido/liso. Caderno e miniatura compartilham cor/acabamento. Folhas continuam altas com pauta completa e luz ambiental global. Capa/contracapa são estados sem documentos fictícios; abrir pela primeira vez mostra a capa, retomada recente mostra a anotação. Estampas/adesivos e arte autoral de capa mais complexa continuam pendentes.

Gestos: Ctrl+roda amplia dentro do enquadramento; Ctrl+arraste esquerdo move e soltar o modificador para. A ponta acompanha a rotação por lombada, confirma aos 25% da largura ou retorna; click/teclado/setas oferecem equivalência. A animação completa continua usando frente/verso e ponta articulada, sem curva física contínua. Edição e cancelamentos removem as cópias; versões leve/desligada/reduzida continuam disponíveis. Zoom respeita 80–140% e pan usa rolagem horizontal/vertical, não uma mesa infinita.

Validação: 27 testes, 31 arquivos de sintaxe, 17 fluxos com banco real, quatro grupos de UI em 320/768/1360 px e ensaio visual de estilos/undo, capas, Ctrl, ponta, falha de exportação, colagem e composição/paginação simuladas. Evidências fictícias em `tmp/library4-new-cover.png`, `tmp/library4-new-editor.png` e `tmp/library4-ui-mobile.png`. Não substituem ensaio com participantes, IME/pinça reais ou hardware modesto. Prévia mais recente em `http://127.0.0.1:8006/?preview=1`; as descrições anteriores abaixo são históricas.

### Revisão de luz, papel e controles — 10/10/2026

Problemas observados na imagem do proprietário: quadriculado restrito ao campo central, luz aplicada principalmente à mesa e menu único acumulando escrita, navegação e personalização. Correção entregue: padrão no fundo inteiro da folha, campos transparentes, pauta ancorada ao início da escrita e camada ambiental fixa que alcança mesa/capas/papel, sem capturar ponteiros. O efeito é uma composição CSS de cor/luz, não simulação física de iluminação ou sombras dinâmicas. A leitura permanece prioritária; validação com pessoas ainda pendente.

Pesquisa em documentação oficial, consultada nesta revisão:

| Referência | Comportamento descrito pela fonte | Adaptação ao Library4 |
| --- | --- | --- |
| [Word: faixa de uma linha](https://support.microsoft.com/en-au/word/using-the-simplified-ribbon-in-word-for-the-web) | Comandos agrupados e opções relacionadas recolhidas | Painéis pequenos por tarefa; formatação separada dos materiais |
| [Google Docs: zoom e visualização](https://support.google.com/docs/answer/99753?co=GENIE.Platform%3DDesktop&hl=en) | Zoom acessível na barra e opções de visualização distintas | Acesso Zoom próprio, sem entrar em aparência; centralizar e voltar ao cursor próximos |
| [Obsidian: barras laterais](https://obsidian.md/help/sidebar) | Conteúdo auxiliar em painéis recolhíveis, inclusive no celular | Índice com acesso independente, mantendo busca/metas fora da escrita |
| [Notion: escrita e edição](https://www.notion.com/help/writing-and-editing-basics) | Formatação da seleção distinta dos ajustes da página; mobile usa controles próprios | Texto reúne ações sobre página ativa/seleção; Caderno reúne aparência e opções gerais |

São referências de interação, não prova de que esta solução é mais fácil para nossos usuários. Não foram copiados os layouts nem implementado o editor de blocos do Notion. A barra automática junto à seleção não entrou nesta rodada: Texto é um painel acionado explicitamente, que preserva a seleção do Markdown existente.

Fluxo entregue: escolher Escrever/Ler diretamente → abrir Índice, Texto, Zoom ou Caderno conforme a tarefa → um painel por vez → Escape/clique fora retorna à folha. No celular, duas faixas compactas e painéis contidos na tela, com alvos de 44 px. Versões, recuperação de rascunhos, edição, foco, padrão pessoal e todas as personalizações continuam acessíveis. Navegação inferior conserva anterior/posição/próxima/criar.

Manipulação: Zoom → Mover com o mouse → arrastar com o botão esquerdo, sem selecionar texto → Escape/Escrever/Voltar à escrita desativa. Estado temporário indicado por “Movendo”; clicar direito sem arrastar conserva o menu nativo. Também permanecem arraste direito, setas no enquadramento focado, zoom 80–140%, rolagem e pinça nativas. O modo não interfere nos dados privados nem é persistido como preferência.

Verificações: 24 testes e 16 fluxos de regressão aprovados; quatro verificações extras em Edge headless cobrem exclusividade/teclado/Escape, pauta na folha e luz sem bloquear interação, arraste esquerdo/zoom/cursor e painéis sem transbordamento em 320/768/1360 px. Capturas fictícias em `tmp/library4-ui-day.png`, `tmp/library4-ui-night.png` e `tmp/library4-ui-mobile.png`. Não equivalem a teste de usabilidade com participantes, auditoria completa de contraste ou teste físico de pinça/teclado virtual.

### Referência principal e prioridade atual

As cinco montagens enviadas pelo proprietário em 10/10/2026 substituem as pranchas geradas como referência principal. As pranchas anteriores foram rejeitadas e não orientam a implementação. A prioridade agora é o caderno; manter o restante simples e adiar o desenvolvimento visual/social ampliado.

Leitura da composição das montagens: superfície texturizada ocupando toda a tela, vista superior plana, folha ou caderno aberto central e áreas de papel como espaço real de leitura/escrita. Aparência de objeto ilustrado, contorno e lombada perceptíveis, com pouca interface ao redor. Não reproduzir o cenário fotográfico inclinado, os objetos decorativos abundantes nem o painel de rede social dos exemplos rejeitados.

As imagens mostram alternativas de folha simples, caderno de uma folha e livro de duas folhas. Texturas pixeladas são referências relevantes; não considerar amarelo dos botões, tipografia dos títulos, marcas d'água ou recortes dos assets como acabamento aprovado. Técnica gráfica e materiais finais ainda abertos.

Próxima validação focada: proporção e aparência do caderno, texto editável nas folhas, uma/duas páginas, navegação e virada, HUD recolhido e pan/zoom. Fundo simples de apoio. Home, social e ambiente detalhado ficam fora desta rodada. Preservar autosave e privacidade existentes.

- Markdown como editor, com atalhos para H1/H2/H3, negrito e itálico. Fonte/tamanho/cor por trecho têm primeira extensão segura de uma linha, descrita no andamento; Markdown puro não representa esses atributos e outros leitores não interpretam a extensão automaticamente. Sem nova dependência.
- Duas folhas editáveis; perspectiva personalizável com barra lateral translúcida que se revela ao passar o mouse. Rodinha move enquadramento, botão direito arrasta e celular aproxima com dois dedos.
- HUD superior recolhido com pequena aba visível; um caderno pode pertencer a várias estantes sem duplicação.
- Retomar tudo entre dispositivos: caderno, página, posição, zoom, enquadramento e ambiente. As 24 horas contam desde a última interação; login/desbloqueio continuam necessários. Adaptar enquadramento à tela.
- Ambiente pessoal padrão com substituições por caderno.
- Progresso mostra páginas editadas e páginas criadas com conteúdo. Criar páginas vazias e apagar não gera produção; definir inserção seguida de remoção e não inflar métricas por restauração ou formatação.
- Social separado: descoberta de cadernos públicos por estrelas, feed de folhas/trechos/cadernos/estantes compartilhados, perfis, amigos, conversas e grupos. Popularidade não transforma estudo privado em competição. Publicação sempre explícita.
- Lembrete opcional de 45 minutos permanece até dispensar; leitura sem interação também conta.

Arquivo histórico de pranchas **rejeitadas**, geradas pela ferramenta integrada `imagegen`: [mesa e ambiente](visual-explorations/01-mesa-ambiente.png), [caderno e HUD](visual-explorations/02-caderno-hud.png), [personalização e celular](visual-explorations/03-personalizacao-celular.png), [Home e social](visual-explorations/04-home-social.png). Preservadas para registrar o caminho descartado; não são especificações. Não há vídeo gerado.

Prompts em resumo: refúgio adulto em madeira, creme e luz âmbar, caderno dominante e controles discretos; (1) dia/noite e comparação ilustração/pixel, (2) HUD recolhido/aberto, uma folha e dobra, (3) modelos, atalhos Markdown, ambiente e gestos móveis, (4) estantes, progresso diário, estrelas públicas e conversas.

## Intenção e referências

O Library4 é a própria base: um lugar acolhedor para se preparar, estudar, guardar conhecimento e perceber o que já foi construído. A satisfação vem de reconhecer o próprio trabalho, sem pressão ou competição.

Referências declaradas: casa de vó, madeira, luz amarela, mesa limpa, janela entreaberta, vento suave, sábado chuvoso, céu ensolarado, conforto de WebFishing e sensação de aprender depois de uma aula. Dead Cells inspira a qualidade das animações.

A ideia inicial deste documento era um refúgio pixel art de 16 bits. As respostas posteriores retiram essa obrigação: pixel art continua uma possibilidade a comparar, e o produto não deve parecer um jogo. Contornos pixelados, fontes pixeladas, inventário e animações secas não são requisitos.

## Ambiente e caderno

- Quarto pessoal perto da janela, com enquadramento concentrado na mesa e no caderno. A janela não precisa aparecer sempre.
- Marrons, madeira, creme e luz quente; reduzir a predominância do verde. Paleta final depende de comparação visual.
- Dia, noite, chuva, luz da janela e iluminação amarela configuráveis. O cenário pode permanecer estático durante o estudo.
- Cadernos físicos personalizáveis: capa dura, espiral e pequenas agendas de couro; cores, estampas e adesivos. Começar com poucas opções de cada categoria.
- Papel pautado, quadriculado, pontilhado ou liso. Páginas pequenas, médias e grandes; fonte ajustável.
- Alternar entre duas folhas editáveis e uma folha com o caderno dobrado. Aproximar, afastar e mover o enquadramento; arrastar com botão direito, mover com a rodinha e ter botões para centralizar e aproximar da escrita. Perspectiva personalizável e pinça no celular estão na direção aprovada; conflitos entre gestos e rolagem precisam de protótipo.
- A folha continua abaixo da tela e é acessada por rolagem; não comprimir verticalmente o caderno para caber no viewport. Assets emprestados de Minecraft nas montagens não podem ser usados como arte final.
- Celular: uma folha quase em tela cheia, com navegação compacta.

## Navegação e fluxo desejado

Depois de autenticar e desbloquear o conteúdo, mostrar a Home com perfil, coleção de cadernos e acesso social. Quando a última interação com um caderno tiver ocorrido nas últimas 24 horas, retomá-lo diretamente, inclusive em outro dispositivo; essa retomada não dispensa o desbloqueio. Preservar página, posição, zoom e ambiente, adaptando o enquadramento à tela de destino.

A coleção mostra capas e permite criar estantes para organizar cadernos, com atalhos para recentes e favoritos. Um caderno pode pertencer a várias estantes sem duplicar conteúdo.

Implementação inicial: Organizar na capa configura associações e favorito em metadados privados; filtro de estante/favoritos/recentes e busca local de metadados. Capas acompanham a cor do caderno e usam uma coluna em telas pequenas. Estantes ainda dependem de ter cadernos associados; catálogo vazio independente, renomeação coletiva e arte da Home ficam para continuação. Este avanço não altera a prioridade do caderno nem transforma a coleção em rede social.

Criar caderno exige nome, matéria/tags e tamanho. O restante vem do caderno padrão configurado pela pessoa; personalizações podem ser feitas na criação ou depois. Validar o significado e a obrigatoriedade de matéria/tags antes de mudar o formulário.

HUD superior discreto: recolher a maior parte ao afastar o mouse, mantendo uma pequena aba visível. Controles reaparecem também por teclado e toque; falhas de salvamento continuam perceptíveis. O protótipo agora abre Ferramentas por hover de mouse e permite fixar por clique/toque/Enter/Espaço. Abertura automática permanece enquanto o foco está dentro; Escape fecha e retorna à aba. O painel sobrepõe a folha sem alterar sua posição. O índice continua com abertura nativa por clique/teclado.

Botão próximo ao caderno reúne personalizações visuais e experienciais. Escrita e leitura usam a mesma folha; lembretes/tarefas aparecem em uma lista discreta de apoio. O estado de salvamento é um texto pequeno na margem.

## Escrita e continuidade

Markdown com atalhos foi confirmado. Selecionar trechos e escolher fontes, inclusive cursivas, tamanho e cor exige extensão ou metadados: Markdown puro não representa esses estilos. Definir persistência, exportação, comportamento dos atalhos e paginação sem substituir automaticamente o editor por WYSIWYG. Nenhuma nova dependência foi aprovada nesta revisão.

Modelo inicial implementado: seleção literal de uma linha → diálogo com amostra/fonte/tinta/tamanho → marcador restrito na página → aparência em Ler. A fonte segue editável e cifrada, com remover estilo e undo/redo. Códigos e HTML permanecem seguros; estilos internos/multilinha, editor visual contínuo e exportação para leitores comuns são evolução posterior. Papel tem quatro pautas; modelo costurado/espiral/agenda flexível e luz/mesa por caderno estão disponíveis como arte candidata, sem motor novo. Lembrete de 45 minutos é opcional e conta somente visibilidade na sessão, sem afirmar estudo efetivo.

Autosave constante continua obrigatório. Conteúdo, posição, enquadramento e preferências fazem parte da continuidade desejada entre dispositivos; o mecanismo de sincronização ainda precisa de implementação. Nunca cortar texto ao mudar tamanho ou fonte.

## Movimento, som e descanso

Interações devem ter cuidado visual: abrir o caderno, virar folhas e responder à escrita. Virada com dobra de papel é a intenção, com intensidade configurável. Sons ao escrever e partículas foram sugeridos como possibilidades, sem efeito específico fechado.

Sons ambientes ativados pela pessoa: chuva, natureza, biblioteca e lareira. Personalização inclui caderno, mesa, luz e áudio. Um cenário estático pode coexistir com animações acionadas pelas interações.

Lembrete opcional a cada 45 minutos de uso contínuo, permanecendo até ser dispensado; não exigir modo de pausa. Leitura sem interação também conta. Especificar suspensão ao ocultar a aba, retomada e política de inatividade sem concluir que falta de mouse significa falta de leitura. Preservar legibilidade, operação por teclado e preferência por movimento reduzido.

## Progresso pessoal

Números discretos, consultados em gráficos e no perfil. Mostrar dias de escrita, cadernos utilizados e produção do dia, permitindo reconhecer algo como “escrevi três páginas hoje”. Isso exige histórico de produção, diferente das contagens atuais e das versões para recuperação.

A direção aprovada distingue páginas editadas e páginas criadas com conteúdo. Criar e apagar páginas vazias não gera produção. Falta fechar a contagem de inserções depois removidas, edições repetidas, timezone e alterações que só redistribuem texto entre folhas. Mudar fonte, tamanho ou restaurar uma versão não deve criar produção artificial. Métricas privadas devem manter a proteção do conteúdo.

## Cena de referência

Num sábado chuvoso, a pessoa abre o notebook na cama, lê um livro de design e escreve seus resumos no Library4. Depois de uma hora, encerra com confiança no salvamento. À noite, consulta seu perfil e reconhece o trabalho feito. Em outra ocasião, anota enquanto acompanha uma aula de programação e continua no dia seguinte, em outro computador, de onde parou.

## Próxima validação

Comparar acabamentos originais na composição já escolhida: vista superior, caderno alto, rolagem e HUD discreto. Variar capa, borda, papel e lombada mantendo geometria e conteúdo idênticos; não voltar a propor um quarto cinematográfico inteiro. O proprietário considerou o primeiro protótipo aceitável como ponto de partida, com muito refinamento pendente. Isso não equivale à aprovação da arte final.

A [Motion Twin](https://motiontwin.com/faq) confirma que grande parte da arte de Dead Cells foi produzida em 3D e convertida em 2D. Essa referência não obriga o Library4 a usar a mesma técnica; animação e renderização do caderno precisam de um protótipo próprio.

## Pesquisa aplicada — 10/10/2026

### Como usar esta base

Esta pesquisa cruza documentação primária da plataforma web, acessibilidade, segurança e produção de arte com as decisões do proprietário. Não é uma autorização para instalar ferramentas, mudar a stack ou implementar todo o futuro agora. “Aprovado” significa resposta do proprietário; “recomendação” é uma proposta de engenharia/design; “hipótese” precisa de experiência real antes de virar regra.

Os livros fornecem princípios, não uma receita estética. A leitura anterior foi seletiva, com páginas e limites registrados em [fontes](../skills/library4-design/references/fontes.md) e aplicações em [fundamentos](../skills/library4-design/references/fundamentos.md); não houve leitura integral dos seis PDFs. As duas cópias de Teixeira representam a mesma obra, não duas fontes independentes. Fontes da internet abaixo foram consultadas para esta pesquisa; documentação pode mudar e deve ser reconferida quando a implementação depender de uma API.

### 1. O que já temos e o que falta provar

| Área | Base existente | Lacuna que orienta o refinamento |
| --- | --- | --- |
| Composição | Uma/duas folhas altas editáveis, capa/lombada/madeira próprias em CSS | Arte ainda provisória, caderno dobrado e proporções precisam de revisão visual |
| Escrita | Markdown, atalhos, prévia segura, undo/redo, Enter assistido e estilos de uma linha | IME real, estilos internos/multilinha, ensaio prolongado e paginação física de parágrafos |
| Paginação | 24/36/48 linhas de referência e largura lógica | Não corresponde ao espaço renderizado de títulos, listas e código |
| Movimento | Frente/verso cruza lombada, ponta articulada no completo, três modos, cancelamento | Curva contínua, pares incompletos sem efeito e custo em hardware real |
| Salvamento | Revisão/idempotência e snapshots/lotes cifrados em IndexedDB | Alterações após último snapshot, quota/expulsão, abertura totalmente offline e backup operacional |
| Navegação | Índice, pares, criar página visível, zoom/arraste/retorno ao cursor e retomada | Ensaio de pinça/teclado virtual em aparelhos reais e refinamento dos gestos |
| Personalização | Quatro pautas, três modelos, mesa/luz/fontes/estilos por trecho e preferências por caderno sincronizadas | Padrão pessoal entre dispositivos, estampas/adesivos, acabamento e estilos multilinha |
| Progresso | Inventário atual e versões | Eventos de produção diária com regras sem inflação |
| Validação | Testes funcionais e fluxo observado em navegador | Sem ensaio de FPS, memória, bateria ou dispositivos físicos variados |

Não atribuir porcentagem de conclusão ao projeto. O “1%” expressa a percepção do proprietário; não é uma medida técnica de escopo.

Refinamento R1 inicial implementado: papel mais claro, margem/pauta suave, lombada com costura decorativa, espessura em camadas e madeira menos contrastada; HUD em sobreposição com entrada curta, modo de foco e retorno ao topo. A arte continua candidata a revisão, não acabamento final aprovado. Orientação reforçada pelo proprietário: reduzir aparência rígida/genérica, desenvolver materiais e interações mais naturais gradualmente, sem efeitos que disputem com a escrita.

Lapidação posterior: cabeçalho sem faixa sólida e ações secundárias no único menu “⋯”; índice, topo e modo foco deixam de ocupar botões separados na área de estudo. Permanecem salvamento e navegação por setas com alvos de 44 px. A virada anterior que fazia a página nova retornar à posição inicial foi substituída por frente/verso temporários atravessando a lombada sobre a próxima folha. O resultado ainda é plano rígido, sem curva física do papel; não declarar esse acabamento final aprovado.

### 2. Princípios de experiência que devem virar decisões concretas

Entrega de consolidação: criação de página saiu do índice para o “+” na navegação; seletores secundários continuam no menu. Papel/capa/fonte oferecem três opções cada, com poucas escolhas iniciais. Corpo de texto simples é o padrão; monoespaçado/literário permanecem disponíveis. Numeral identifica discretamente o lado ativo, e voltar à escrita enquadra a posição do cursor.

Texto continua em HTML selecionável. Listas/código/citações/tabelas permanecem em blocos; um bloco alto expande sua folha. Undo/redo de até 30 grupos mantém IDs/revisões e limpa folhas geradas ao desfazer divisão. Ponta articulada usa duas superfícies HTML adicionais somente durante a virada completa, preservando cancelamento e redução de movimento. Zoom/arraste não bloqueiam pinça/rolagem nativas.

Validação desta rodada: 16 testes, banco real e oito fluxos em Edge headless, inclusive rascunho cifrado em IndexedDB e recuperação após recarga, preferências/retomada, teclado, 320 px, arraste e composição simulada. Não equivale a aprovação estética final ou teste físico de IME, FPS, memória e bateria. Estado e limites atualizados no README. [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB), [Pointer capture](https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture), [CSS zoom](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/zoom).

Krug orienta rótulos claros e caminhos reconhecíveis; Norman orienta modelo mental e feedback; Williams orienta proximidade, alinhamento, repetição e contraste; Teixeira orienta hierarquia, contexto e revelação progressiva. A aplicação aqui é: caderno como objeto principal, atalhos perto da escrita, poucas ações visíveis e estado de salvamento compreensível. O levantamento dos livros está nas referências locais acima.

As heurísticas de Nielsen sustentam feedback do sistema, liberdade para desfazer, prevenção de erros e reconhecimento das ações. São critérios de revisão, não prova de que esta interface será intuitiva. [Fonte: heurísticas publicadas pelo autor, NN/g](https://www.nngroup.com/articles/ten-usability-heuristics/).

| Intenção | Aplicação proposta | Como verificar |
| --- | --- | --- |
| Meu lugar de estudo | Reabrir no caderno e no trecho onde parei | Duas sessões e dois tamanhos de tela, após desbloqueio |
| Conforto | Papel legível, textura discreta, som e movimento opcionais | Sessão de leitura/escrita sem ajustes obrigatórios |
| Objeto real | Capa, espessura, junção das folhas e orientação coerentes | Identificar começo/fim e próxima folha sem explicação |
| Tranquilidade | Estado “pendente”, “salvando”, “salvo” e erro verdadeiro | Rede interrompida, timeout e conflito sem falsa confirmação |
| Progresso pessoal | Consultar produção depois do estudo | Números conferem, sem ranking no caderno |
| Controle | Ação disponível por botão, teclado e toque | Não depender exclusivamente de gesto escondido |

Recomendação: um fluxo de referência guia cada rodada — abrir → escrever um resumo → continuar na próxima folha → confirmar salvamento → sair → voltar. A decoração melhora esse fluxo; não pode obrigar a navegar por ambientes para escrever.

### 3. Linguagem visual original

**Recomendação de acabamento inicial:** ilustração tátil, vista superior, madeira castanha de baixa intensidade, papel claro e quente, capa com cor própria e sombras localizadas. Pixel art pode aparecer na capa e em detalhes decorativos; texto e ícones funcionais permanecem nítidos. Não misturar resoluções de pixels arbitrariamente, nem aplicar uma fonte pixelada obrigatória à escrita.

| Camada | Direção de trabalho | Evitar |
| --- | --- | --- |
| Mesa | Veios largos e contraste inferior ao caderno | Repetição muito evidente, textura ruidosa disputando atenção |
| Capa | Material reconhecível, cantos e espessura consistentes | Contorno, paleta ou silhueta copiados de Minecraft |
| Papel | Base uniforme e textura suave, margem funcional | Manchas sob texto, efeito amarelado que reduz legibilidade |
| Lombada | Junção clara, pequena sombra e volume | Sombra central que invade o texto ou divide a seleção |
| Pauta | Ritmo alinhado à escrita do preset | Forçar títulos/código a uma pauta incompatível |
| Luz | Variação discreta nas bordas e na mesa | Mudar contraste de texto conforme hora/clima |
| HUD | Rótulos curtos, grupos de ações e aba identificável | Controles totalmente invisíveis, opacidade baixa durante uso |

Ainda não fechar cores hexadecimais, fonte final ou número de modelos por catálogo. Primeiro comparar dois ou três acabamentos do **mesmo** caderno, com texto real e mesma geometria. Escolher uma família de capa e um papel para refinar antes de expandir opções.

Proporções devem surgir da leitura: largura útil, margens, tamanho/interlinha e capacidade, depois capa e mesa. A altura não é determinada pela tela. Em telas estreitas, mais quebras visuais podem aumentar a altura; manter conteúdo e número lógico de página estáveis. Duas folhas só fazem sentido quando ambas continuam legíveis; manter acesso à folha única.

**Pacote de arte por modelo:** frente de capa, verso se necessário, lombada, bordas, papel, variantes de sombra e eventual sequência de virada. Registrar autoria, licença, resolução e origem. Gerar imagens ajuda a explorar; não garante consistência entre quadros nem substitui a revisão dos assets finais. Marcas d'água e assets encontrados em screenshots não devem ser incorporados.

### 4. Texto e papel têm responsabilidades diferentes

Arquitetura recomendada, dentro da stack atual:

1. Conteúdo e seleção continuam no DOM, com controles semânticos e edição acessível.
2. Capa, papel e sombra são decoração; não entram na ordem de leitura ou de foco.
3. Transformação de enquadramento atua no conjunto visual, preservando referências estáveis às páginas.
4. Animação é uma camada cancelável. Navegação e dados funcionam com movimento desligado.
5. Criptografia/persistência recebem o documento, não uma imagem da folha.

Não desenhar todo o texto em Canvas apenas para dar aparência de jogo: seria necessário reconstruir edição, seleção, navegação assistiva e parte da interação nativa. Não transformar 500 páginas em 500 superfícies animadas. Começar com as folhas visíveis e, se necessário, uma vizinha para transição; medir antes de ampliar.

Separar atualização de conteúdo, índice e prévia merece avaliação: reconstruir o índice inteiro e recalcular dimensões a cada tecla pode custar mais que a virada. Instrumentar o fluxo antes de refatorar; preservar seleção, undo e confirmação de autosave é mais importante que uma arquitetura nova.

### 5. Contrato do editor e da paginação

CommonMark define blocos e sintaxe, não fontes/cores por trecho nem paginação física. Cortar uma cerca de código ou uma lista no meio pode alterar a interpretação quando cada folha é renderizada isoladamente. [Fonte: especificação CommonMark 0.31.2](https://spec.commonmark.org/0.31.2/).

**Decisões a fechar antes de expandir o editor:**

- “Linha” é capacidade de referência na fonte padrão; não prometer contagem idêntica de linhas visíveis em telas diferentes.
- A largura lógica de paginação deve ser estável. Zoom e largura do dispositivo mudam apresentação, sem criar/apagar páginas automaticamente.
- Aumentar fonte ou reduzir tamanho preserva todos os caracteres; definir se redistribui páginas ou oferece confirmação quando muda muitas folhas.
- Título, margem e espaço dos controles precisam de regra explícita: contam ou não no espaço de escrita?
- Página é uma entidade com identidade estável para versões, links e futura publicação. Redistribuir texto não pode silenciosamente trocar o significado de uma folha compartilhada.

**Alternativas para estilos por trecho — avaliação, não decisão aprovada:**

| Modelo | Benefício | Custo/risco |
| --- | --- | --- |
| Markdown + extensão textual restrita | Estilos via atalhos aparecem no próprio documento; exportação reproduzível | Parser/escaping, legibilidade do source e interação com blocos |
| Markdown + intervalos em metadados | Source fica simples | Cada inserção, remoção, colagem, undo e divisão precisa remapear intervalos |
| Editor estruturado com exportação Markdown | Modelos de seleção/formatação mais completos | Mudança de arquitetura/dependências e exportação possivelmente incompleta |

Começar provando um único estilo por trecho com seleção, edição posterior, colagem, undo, reabertura e exportação. Não habilitar HTML bruto para obter estilos; restringir fontes a IDs de catálogo, cores a valores validados e tamanhos a limites definidos. Manter a prévia atual com HTML bruto desativado. Segurança de renderização deve continuar sendo uma propriedade explícita do fluxo, inclusive para conteúdo importado. [Fonte: OWASP, prevenção de DOM XSS](https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html).

`beforeinput` ajuda a identificar alterações, mas pode não disparar ou não ser cancelável em determinadas edições; precisa de `input` e reconciliação. `isComposing` identifica composição: não dividir a palavra/página no meio de um IME. Verificar composição, acentos, emojis e ditado, não apenas teclado latino desktop. [Fontes: MDN beforeinput](https://developer.mozilla.org/en-US/docs/Web/API/Element/beforeinput_event), [MDN isComposing](https://developer.mozilla.org/en-US/docs/Web/API/InputEvent/isComposing).

Medir texto antes do carregamento da fonte produz limites instáveis. A plataforma oferece `document.fonts.ready` após carregamento/layout; `ResizeObserver` observa alterações de dimensões. Usar os mecanismos quando necessários, evitar ciclos de medir → escrever → medir e invalidar só o que mudou. Não repaginar todo o caderno ao redimensionar a janela. [Fontes: FontFaceSet.ready](https://developer.mozilla.org/en-US/docs/Web/API/FontFaceSet/ready), [ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver).

**Casos obrigatórios da prova de paginação:** texto no limite, parágrafo enorme, URL longa, cerca de código atravessando limite, lista aninhada, título junto do parágrafo, caracteres compostos, colagem de várias páginas e redução de tamanho. Conferir preservação exata do source, identidade/ordem das páginas e posição do cursor. Ao atingir 500 páginas, recusar ou guardar o excedente de forma recuperável; nunca truncar. Verificar que criação automática aplica os mesmos limites da criação manual.

### 6. O que aproveitar de Dead Cells

Thomas Vasseur, artista do jogo, descreve um processo com modelo/rig 3D, poses importantes, ajustes de tempo e exportação de quadros 2D. Esse relato é uma fonte primária de **produção de arte**; não obriga o navegador a executar 3D. O artigo também relata limitações do acabamento em baixa resolução. [Fonte: relato do artista sobre o pipeline de Dead Cells](https://www.gamedeveloper.com/production/art-design-deep-dive-using-a-3d-pipeline-for-2d-animation-in-i-dead-cells-i-).

Aplicação proposta: definir poses da folha fechada, levantada, no meio da virada e assentada; testar ritmo primeiro; depois refinar curva, sombra e detalhes. Para o Library4, o gesto deve ser calmo e breve, adequado à escrita. O ritmo de combate do jogo não é referência direta de conforto. Quadros pré-renderizados podem representar papel/capa, mas não resolvem a deformação de notas editáveis diferentes a cada uso.

| Técnica | Uso candidato | Limite a provar |
| --- | --- | --- |
| CSS/Web Animations no DOM | HUD, entrada, pequenas respostas e virada simples | Plano girando não é folha curvada |
| Ilustração estática + sombras animadas | Caderno convincente com pouco movimento | Ilusão de dobra pode ser insuficiente |
| Quadros 2D pré-renderizados | Material/contorno da folha e capa | Vários tamanhos, memória, alinhamento com texto dinâmico |
| Modelo 3D usado só para produzir assets | Consistência de perspectiva/luz/poses | Ferramenta de autoria e tempo de produção, sem runtime 3D obrigatório |
| Renderização 3D em runtime | Dobra real com parâmetros | Complexidade, GPU, acessibilidade e texto; só explorar se as alternativas falharem |

Prioridade técnica: `transform` e `opacity` tendem a evitar layout/paint, mas conteúdo, camadas e área renderizada ainda influenciam o custo. Não promover toda página com `will-change` permanente. [Fonte: guia de animações de web.dev](https://web.dev/articles/animations-guide).

**Contrato de movimento proposto:** navegação responde imediatamente; nova navegação cancela a anterior; escrever cancela o efeito; não enfileirar viradas; foco/cursor permanecem corretos; modo desligado não tem espera artificial. Ajustar duração com protótipo, sem transformar valores atuais de 160/360 ms em padrão definitivo. Dobra final deve ser testada com notas curtas e longas, uma e duas folhas, zoom e rolagem.

### 7. Memória e desempenho: medir o custo real

Tamanho de download não é memória de imagem. Um quadro RGBA8 de 4096 × 4096 contém 64 MiB de pixels; dez quadros inteiros representam 640 MiB nessa representação, antes de cópias, mipmaps e outras despesas. É uma conta ilustrativa, não medição do protótipo. Sprites “leves” em PNG podem ser caros depois de decodificados. Resolução, área e quantidade de quadros precisam de orçamento.

WebGL traz limites variáveis, gerenciamento de recursos e perda de contexto; adicionar um motor não garante fluidez. Se houver prova 3D, exigir fallback e descarte de recursos. [Fonte: MDN, boas práticas WebGL](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices).

**Metas propostas para orientar ensaios, ainda sem resultado medido:**

- Digitação e seleção continuam responsivas com animação acontecendo; registrar atrasos e tarefas longas.
- Buscar quadro de aproximadamente 16,7 ms quando o dispositivo entregar 60 Hz, sem tratar isso como promessa universal.
- Verificar INP como indicador de interação. O limite “bom” de até 200 ms considera o percentil 75 dos dados de uso; um teste local não demonstra esse resultado em produção. [Fonte: definição de INP, web.dev](https://web.dev/articles/inp).
- Registrar memória, tráfego, tempo de abertura e custo da maior folha em um dispositivo modesto escolhido explicitamente. Definir limites absolutos depois da linha de base, não inventar números de RAM aceitáveis.
- Sem loop contínuo para uma mesa estática; áudio/efeitos pausam conforme política de visibilidade. Só carregar arte de variantes utilizadas.

Usar traces com scripting, layout, paint e quadros para comparar a mesma tarefa antes/depois. Gravação visual ajuda a avaliar ritmo; não substitui o trace. [Fonte: Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance).

Matriz mínima proposta: computador modesto, computador principal, Android físico modesto e iPhone/Safari quando houver acesso; Chrome/Edge desktop e pelo menos outro motor. Registrar modelo, sistema, versão, resolução, escala e rede. Emulação de largura e CPU é triagem, não certificação de aparelho real. Conteúdo de ensaio: folha longa, Markdown com código/listas, 500 páginas e navegação repetida; não renderizar todas as páginas para simular carga artificial.

“Completa”, “leve” e “desligada” devem mudar efeitos, não qualidade de conteúdo, salvamento ou privacidade. Preferência por movimento reduzido deve valer na primeira abertura. Não classificar hardware automaticamente como fraco por uma regra inventada; oferecer controle explícito e avaliar adaptação depois de medir.

### 8. Acessibilidade faz parte do conforto

| Critério | Aplicação no caderno | Referência |
| --- | --- | --- |
| Contraste | Texto normal ≥ 4,5:1; texto grande elegível ≥ 3:1. Conferir estados e textura real | [WCAG contraste mínimo](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) |
| Reflow | Oferecer leitura/escrita adaptável em 320 CSS px; não usar o caderno como desculpa para texto inacessível | [WCAG reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) |
| Alvos | AA considera 24 × 24 CSS px ou condições de espaçamento/exceção; propor 44 × 44 como conforto de toque | [WCAG tamanho mínimo](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) |
| Arrastar | Botões de mover/centralizar/zoom permitem ação sem arraste; teclado também disponível | [WCAG dragging movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html) |
| Pinça/gestos | Alternativas por clique/toque simples; gesto não é única forma | [WCAG pointer gestures](https://www.w3.org/WAI/WCAG22/Understanding/pointer-gestures.html) |
| Movimento | Desligar animações não essenciais por interação; é critério AAA adotado como meta própria | [WCAG animation from interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) |
| HUD | Estado expandido, operação por Enter/Espaço e foco coerente; não fechar sobre o foco | [ARIA APG disclosure](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) |

Não anunciar “conforme WCAG” apenas porque esses itens passaram. Avaliar o conjunto dos critérios aplicáveis e o fluxo completo. Ajustes de fonte/cor precisam de uma opção de voltar ao padrão legível, sem impedir as escolhas pessoais.

Não aplicar `touch-action: none` à página inteira: isso altera os gestos nativos, inclusive zoom. Isolar qualquer navegação personalizada e manter zoom do navegador e seleção de texto. Testar rolagem, pinça e teclado virtual juntos. [Fonte: MDN touch-action](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action).

### 9. Salvamento confiável e privacidade

O visual deve comunicar exatamente a garantia disponível: conteúdo pendente em memória, rascunho protegido localmente e revisão confirmada pelo servidor são estados distintos. Uma animação de sucesso não deve aparecer antes da confirmação aplicável. A prioridade é adicionar recuperação de rascunho criptografado sem alterar a semântica de confirmação atual.

IndexedDB oferece armazenamento assíncrono e transações para dados estruturados; é candidato nativo para guardar envelopes de rascunhos. Não guardar conteúdo ou chave em texto legível. A pessoa desbloqueia novamente para recuperar o material. Isso não torna o sistema automaticamente offline: abertura de cadernos, sessão expirada e conflitos têm fluxos próprios. [Fonte: MDN IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API).

Armazenamento local tem quotas e pode ser removido; persistência solicitada não substitui backup. Tratar falta de espaço/negação com mensagem e caminho de recuperação, nunca com falsa garantia de salvamento. Definir política para logout, dispositivos compartilhados e rascunhos órfãos de outra conta. [Fonte: MDN quotas e eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria).

O fluxo de recovery deve provar: escrever → perder rede → proteger localmente → encerrar inesperadamente → reabrir → desbloquear → revisar rascunho → reconciliar revisão remota → confirmar. Rascunho e histórico não devem ser apagados ao primeiro erro. Formatação e novas preferências entram nos envelopes conforme o modelo de privacidade aprovado.

Criptografia de conteúdo protege contra leitura do banco/storage, mas XSS ou um cliente adulterado executando durante desbloqueio pode acessar texto/chaves em uso. Não prometer invulnerabilidade ao servidor que entrega o código. Preservar criptografia autenticada, geração de IVs, vínculo de contexto, validação e proteção do cliente conforme o modelo documentado. [Fontes: OWASP armazenamento criptográfico](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html), [OWASP DOM XSS](https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html).

Versões, preferências e futuros eventos precisam respeitar revisão/idempotência. Uma transação isoladamente não elimina conflitos de negócio; manter a checagem da revisão esperada e testar concorrência. Não trocar a base atual por colaboração em tempo real sem necessidade. [Fonte: PostgreSQL 17, isolamento de transações](https://www.postgresql.org/docs/17/transaction-iso.html).

### 10. Ambiente, áudio e produção pessoal

Som começa por ação explícita, com mute/volume acessíveis e sem obrigar a escutar cada tecla. A plataforma impõe políticas de reprodução automática e requer cuidado com início/contexto de áudio. Provar custo e interrupções de um único som/loop antes de catálogo amplo. [Fonte: MDN Web Audio best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices).

Sugestão de prioridades: iluminação estática configurável → chuva/ambiente opcional → sons de interação opcionais → partículas discretas, apenas se melhorarem a experiência. Não animar clima continuamente para simular conforto antes de validar leitura e consumo.

Abas ocultas podem sofrer throttling de timers; o lembrete não deve depender de contar callbacks de intervalo. Definir tempo de uso pela política de visibilidade e timestamps. Ler uma folha visível conta conforme direção aprovada; o app não pode deduzir atenção/estudo efetivo só pela ausência de movimento. [Fonte: MDN Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API).

Para produção diária, recomendação a validar: contar IDs distintos de páginas com alteração textual válida no dia; separar páginas novas com conteúdo de páginas já existentes; eventos idempotentes, timezone explícito e nenhum histórico inventado retroativamente. Redistribuição automática de texto, formatação e restauração precisam de tratamento específico. O servidor recebe envelopes e não pode comprovar semanticamente que a pessoa escreveu; ranking público futuro não pode usar esse contador privado como prova contra fraude.

### 11. Protocolo de refinamento visual e funcional

1. Fixar um caderno de referência com resumo, título, lista, código e conteúdo longo. Usar os mesmos dados em todas as comparações.
2. Escolher uma pergunta por rodada: “a lombada convence?”, “acho o índice?”, “a virada atrapalha escrever?”. Não mudar tudo ao mesmo tempo.
3. Apresentar tela parada e interação funcionando. Captura aprova composição; teste funcional aprova fluxo; nenhum dos dois sozinho aprova performance.
4. Observar tarefas sem ensinar a resposta. Registrar hesitação, erro, volta e ajuste pedido; separar opinião estética de falha operacional.
5. Se houver participantes, fazer uma rodada exploratória pequena, por exemplo 3–5 pessoas com hábitos diferentes. É investigação qualitativa, não confirmação estatística.
6. Corrigir o que impede estudar, depois refinar acabamento. Comparar novamente com o mesmo conteúdo e condições.
7. Registrar aprovado, rejeitado e pendente; atualizar o roteiro e não reintroduzir opções descartadas.

**Primeiro ensaio sugerido:** estudar por 20–30 minutos com um resumo real, em computador e tela estreita. Verificar legibilidade, altura da folha, seleção, rolagem, navegação, estado de salvamento e reabertura. A duração é uma hipótese prática de ensaio, não tempo mínimo científico de conforto.

### 12. Próximas decisões, sem bloquear a pesquisa

| Decisão | Momento adequado | Material para decidir |
| --- | --- | --- |
| Acabamento da capa/papel | Próxima rodada visual | Duas ou três variantes originais no mesmo caderno alto |
| Contagem de capacidade e blocos | Antes de modificar paginação | Exemplos de título/lista/código e fonte maior |
| Estilos por trecho | Antes de implementar fonte/cor individual | Prova de uma seleção, edição, undo, exportação e reabertura |
| Qualidade da dobra | Depois do modelo de uma/duas folhas | Comparação de efeito DOM e material pré-renderizado com texto real |
| Persistência e retomada | Antes de sincronizar preferências | Rascunho protegido, login novo, conflito e duas telas |
| Produção diária | Antes dos gráficos de histórico | Tabela de eventos com escrever/apagar/restaurar/redistribuir |

Executar em fatias verificáveis conforme o [roteiro de refinamento](passo-a-passo.md#roteiro-de-refinamento--10102026). Essa pesquisa não declara nenhuma dessas entregas concluída.
