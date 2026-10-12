# Library4

Ambiente pessoal de estudo com cadernos, páginas Markdown e conteúdo privado criptografado no navegador. Reconstrução iniciada do zero. Stack aprovada: HTML/CSS/JavaScript, Node.js e PostgreSQL; dependências autorizadas: `pg`, `markdown-it`, Tiptap e suas extensões, esbuild para empacotar o editor.

## Estado atual

### Caderno como objeto sobre a mesa — 12/10/2026

Prévias de guardas/versos vazios ocultam os contêineres reais do editor visual e da leitura Markdown. Ao arrastar uma folha, o conteúdo antigo fica apenas na face que está virando, sem reaparecer sobre a guarda até concluir a animação. Arraste confirmado/curto e leitura Markdown conferidos no navegador.

Ao reduzir a folha de grande para média/pequena, a altura é medida novamente sem conservar o maior tamanho anterior. As guardas descartam a capacidade da página que ocupava aquele lado; folhas e capas acompanham a altura comum atual. O rodapé permanece na base, inclusive com capacidades diferentes entre páginas. Conteúdo maior conserva espaço e a paginação existente continua sem cortar texto. 45 testes e sintaxe aprovados.

Viradas refinadas: aceleração/desaceleração suaves, sombra sincronizada ao ângulo e continuação do arraste sem final instantâneo. Prévia e página usam a mesma diagramação do editor; a superfície estacionária preserva seu DOM. Capas conservam acabamento durante o movimento e ferramentas aparecem depois de pousar. Limpeza idempotente em conclusão/interrupção; 44 testes e sintaxe aprovados. Detalhes em [design-templo.md](docs/design-templo.md).

Detalhes em zoom reduzido: pauta, quadriculado, pontos, margem e divisórias compensam a redução para evitar traços subpixel invisíveis. O pontilhado mantém separação mínima de 3 px na tela; o grão mantém amostragem mínima, inclusive nas guardas e no verso animado. Espaçamento das linhas e geometria do caderno permanecem iguais. Correção visual em CSS, sem biblioteca ou mudança nas notas.

Esta revisão substitui a divisão adaptativa das folhas e os menus separados anteriores. O caderno aberto mantém **duas faces de 840 px**, com eixo central e altura comum determinada pela maior capacidade das páginas; o zoom altera somente a câmera. Capa e contracapa continuam do tamanho de uma face: frente no lado direito da lombada, traseira no esquerdo. A primeira página fica à direita, seguida de página 2 à esquerda/página 3 à direita. O verso animado contém a página que pousará do outro lado; o conteúdo sob a folha corresponde ao próximo destino, sem repetir a página antiga. A página assentada permanece na abertura após remover a cópia da animação.

Guardas internas não são notas. Se a última página for uma frente ímpar, há um **verso em branco** antes da contracapa: sem edição ou produção fictícia; criar uma página torna o verso parte das anotações. Avançar/voltar funciona por navegação fixa e arraste das bordas, com sentido correspondente ao lado físico. Número/identidade/conteúdo das páginas existentes permanecem preservados. Espiral passa pelo centro, com anéis, furos e sombra metálica; os modelos conservam a mesma geometria.

Uma bancada lateral agrupa **Texto** (formatação/cores/Markdown), **Páginas** (índice, busca, metas, capacidade/letra base, versões/rascunhos), **Caderno** (enquadramento, estrutura, papel, materiais e edição contextual de capas), **Mesa** (luz, superfície e lembrete). Um painel aberto por vez, acesso direto e Escape recolhe; Escrever/Ler e navegação ficam fora dos painéis. Não há seletor uma/duas folhas. Guardas/capas desabilitam ferramentas de texto, preservando as demais funções. Voltar à escrita aproxima para pelo menos 100% e traz o cursor à área útil. Nenhuma biblioteca, formato cifrado ou migração de banco foi adicionada.

Validação: 43 testes passaram, incluindo SQL/API; sintaxe de 37 arquivos verificada. Ensaios de navegador: escrita e negrito, criação da terceira página, verso vazio/contracapa e retorno, espiral, arraste curto e zoom de 10–800% com dimensões iguais nas faces e scroll do documento em zero. A curvatura continua sendo uma superfície plana em CSS 3D; toque físico e desempenho em aparelho modesto não foram medidos. As seções abaixo registram entregas anteriores.

### Capas personalizadas — 11/10/2026

Capa → folhas → capa traseira compartilham navegação e arraste pelas bordas. Em **Escrever**, clique no título e matéria; Enter confirma e Escape desfaz o texto em edição. O painel direito personaliza material, cor e textura de cada lado. A frente atualiza os dados do caderno; atrás os textos são próprios e opcionais, sem repetir o título automaticamente. Em **Ler**, texto/imagem ficam protegidos e o painel some. A capa traseira tem lombada à direita e acabamento invertido; o verso animado da capa mostra uma guarda interna de papel, não outra capa externa.

Cada lado aceita uma imagem via arquivo, soltar sobre a capa ou Ctrl+V. PNG/JPEG/WebP até 8 MB/32 megapixels são reprocessados no navegador para WebP, até 640 px e 120 KB; o original não é enviado. Imagens podem ser substituídas, removidas, centralizadas, movidas e redimensionadas proporcionalmente pelos quatro cantos; setas ajustam posição/tamanho, Shift amplia o passo, Delete remove e Escape cancela um gesto em andamento. Soltar fora da capa avisa e impede navegação acidental do navegador. Posição fica dentro da superfície. A miniatura na coleção acompanha imagem, material e cor da frente.

Personalizações e imagens integram os metadados AES-GCM, autosave, rascunhos protegidos e cópia de conflito existentes. Limite do envelope de metadados ampliado para 600.000 caracteres; páginas/chaves mantêm 100.000 e requisições mantêm 2 MB. CSP permite imagens locais data/blob; não permite HTML livre, SVG ou URLs remotas no editor de capa. Sem nova dependência ou migração SQL. A prévia continua sem persistência.

Referência de encadernação: [British Library](https://events.bl.uk/events/bookbinding-masterclass), que distingue folhas, placas, lombada, revestimento e guardas. Aplicação ilustrada dessas partes; não é simulação de todas as forças físicas de um livro. Curvatura contínua, distribuição real de espessura e guardas como estados navegáveis independentes ainda não implementadas; layouts de páginas digitais existentes preservados.

Validação: 41 testes aprovados, incluindo SQL/API com imagem maior que o limite antigo, reabertura das duas capas e recuperação de rascunho cifrado; sintaxe de 37 arquivos verificada. Prévia desktop: título/matéria, material, importação por arquivo, Ctrl+V na contracapa, movimento, ajuste proporcional por teclado, Ler/Escrever e abertura traseira por arraste ensaiados. Arraste de arquivo vindo do sistema, cancelamento físico durante resize, toque e teclado virtual ainda não ensaiados.

### Mesa fixa e acabamento cozy — 11/10/2026

Na tela do caderno, documento e corpo ficam fixos com `overflow: clip`: sem barra geral, roda comum ou rolagem oculta acionada pelo foco. Ctrl+roda mantém zoom; Ctrl+arraste, Mover, botão direito e setas com foco na cena deslocam o objeto. Navegação e aviso de prévia ficam fixos. Centralizar, Topo da folha, retomada e Voltar à escrita usam deslocamento da mesa. O cursor visual/Markdown desloca o caderno apenas ao ultrapassar os limites úteis, preservando acesso à escrita de folhas altas. Zoom → **Ver inteiro** enquadra capa ou folhas pela largura e altura disponíveis. Coleção conserva seu fluxo próprio.

Couro recebeu granulação irregular e relevo discreto, tecido trama cruzada e capa lisa reflexo suave; cores/modelos existentes preservados. Controles têm ícones SVG próprios para lista/código/undo/redo, seleção pressionada, sombras leves e hover com pequena elasticidade. Painéis têm bordas quentes, acabamento consistente e abertura curta; no celular, formatação tem superfície opaca e rolagem interna. Movimento reduzido elimina as microanimações. Shader opcional de luz viva ficou mais suave e alcança o caderno; mantém limite de resolução/30 desenhos por segundo, pausa e fallback existentes.

36 testes aprovados e sintaxe de 34 arquivos validada. Prévia desktop: roda sem rolagem, root/corpo em zero durante escrita, cabeçalho estável, acompanhamento do cursor, Ver inteiro e shader compilado/ativo (768×432), sem erros no console. Inspeção em 390×844; toque físico, IME/teclado virtual e desempenho em dispositivos fracos não validados. Sem dependências novas ou mudança de conteúdo/SQL/criptografia.

### Próxima página visível durante o arraste — 11/10/2026

As bordas mantêm hover e acesso por teclado, sem setas ou triângulos nas pontas. Ao puxar uma folha, uma prévia inerte do destino aparece por baixo imediatamente, usando o mesmo renderizador Markdown seguro; na dupla, ambas as folhas mostram o próximo par. A prévia não troca a página ativa, não modifica notas e não aciona salvamento. Confirmar remove a prévia e navega normalmente; arraste curto, Escape, perda de captura e interrupções removem as cópias e conservam a página original. Capa/contracapa também aparecem nos limites do caderno.

35 testes aprovados, incluindo criação/limpeza da prévia ao cancelar, retornar e confirmar. Na prévia do navegador foi observado o conteúdo da página anterior por baixo enquanto a página ativa ainda era a segunda, sem IDs duplicados; retorno curto preservou a página e removeu as camadas. Toque físico e curvatura contínua continuam pendentes.

### Virada para trás sem sobreposição — 11/10/2026

Botão e arraste usam uma única cópia da folha que sai: avanço gira pelo eixo esquerdo, volta pelo direito. Em duas folhas, os botões animam a direita ao avançar e a esquerda ao voltar; o estágio animado fica acima do par. Removidas a segunda cópia estática da volta e a dobra em tiras que fragmentava o acabamento. A folha permanece inteira, com verso e sombra, sem mudar texto, salvamento ou enquadramento.

35 testes e sintaxe aprovados. Prévia: ida/volta por botão, volta arrastada em uma/duas folhas, retorno curto sem navegação e remoção das cópias após concluir. A superfície ainda é plana em 3D; curvatura contínua e toque físico não foram validados.

### Capa e folhas com geometria compartilhada — 11/10/2026

Capa/contracapa acompanham largura, altura e posição da primeira/última folha, incluindo capacidade, zoom, deslocamento e resize. Foi removido o limite independente de 520 px/proporção 3:4 da capa. A abertura conserva a posição da cena, sem rolar automaticamente ao topo ou mudar a margem reservada às ferramentas. Em duas folhas, cada capa corresponde a uma folha; o caderno aberto ocupa o par.

A cópia animada usa a origem do estágio de destino, evitando a faixa solta ao passar entre capa e folha. Em telas de até 1100 px, a formatação abre sobre a cena; o espaço do seu controle permanece reservado também com o caderno fechado, impedindo mudança de altura do cabeçalho na abertura. Conteúdo, salvamento e personalizações preservados.

35 testes e sintaxe aprovados. Prévia: medidas idênticas antes/depois de abrir a 100% e 40%, fechamento a 40%, primeira/última folha em duas folhas e abertura em 320 px com rolagem preservada. Medição da capa divide a escala visual para manter dimensões lógicas, recalculadas no zoom. Sem novas dependências; toque físico e curva contínua continuam pendentes. As seções anteriores registram comportamento histórico.

### Zoom amplo e movimento na mesa inteira — 11/10/2026

Zoom passa de 80–140% para **10–800%**, tanto no controle quanto na roda com Ctrl e na preferência salva. A roda usa passos proporcionais para navegar entre escalas pequenas e grandes. A largura lógica da folha permanece estável: ampliar não refaz a diagramação nem cria um recorte dentro da mesa. Capa conserva sua proporção e caderno reduzido fica centralizado.

Ctrl+arraste esquerdo e Mover funcionam também na mesa fora do caderno, deslocando o objeto nos dois eixos; ferramentas e navegação continuam fixas. Soltar Ctrl/Escape interrompe o movimento. Painéis e botões conservam suas interações. Centralizar e Ajustar largura zeram os dois deslocamentos; rolagem normal continua alcançando folhas altas. O limite da tela é natural, sem caixa intermediária: conteúdo ampliado fora da tela pode ser trazido pelo arraste.

34 testes e verificação de sintaxe aprovados. Prévia ensaiada a 10%, 168% e 800%, com movimento iniciado fora da folha e preservação da largura lógica. Ctrl/soltura, Escape, estado oculto, limites e reset cobertos em teste. Sem novas dependências, mudança de SQL ou formato de conteúdo. Escala não é infinita; toque físico e desempenho em hardware fraco seguem pendentes.

### Bordas e enquadramento livre — 11/10/2026

Arraste qualquer uma das quatro bordas externas da folha: para a esquerda avança, para a direita volta. As faixas são discretas e ficam fora da escrita; nas laterais continuam disponíveis clique e teclado. Arraste curto retorna sem navegar, e Escape cancela. Ctrl ou o modo Mover tem prioridade sobre virar a folha.

O caderno deixou de ter uma caixa com rolagem interna: a virada pode ocupar a mesa, sem barras próprias ou recorte no contêiner. A troca entre folhas preserva a posição vertical; Ctrl+arraste desloca o objeto horizontalmente e usa a rolagem da cena na vertical. Centralizar/Ajustar largura restaura o deslocamento. Folhas altas continuam acessíveis pela rolagem normal. O botão ⌟ foi removido, pois a borda lateral está disponível ao longo da folha; as seções anteriores registram as entregas históricas.

Sintaxe de 34 arquivos e 34 testes aprovados, incluindo banco real, direção livre, preservação da rolagem, prioridade do movimento e cancelamento. Ensaio da prévia com bordas superior/inferior/lateral, retorno de arraste curto e Mover sem navegar. Sem nova dependência ou mudança de conteúdo/criptografia. Toque físico e curva contínua da folha ainda não foram validados.

### Escrita, seleção e ponta acessível — 11/10/2026

Entrelinha de escrita/leitura alinhada em 1,75, mantendo parágrafos compactos e itens de lista próximos. Seleção usa destaque quente com texto escuro; no editor visual, continua visível ao abrir ferramentas e some ao voltar à leitura, ao recolocar o cursor ou retornar ao foco. É decoração do editor, sem alteração do Markdown/autosave. Inclui seleção completa com Ctrl+A.

O símbolo **⌟** na navegação inferior leva à ponta real da folha ativa e dá foco ao botão: arraste para virar ou Enter/Espaço para navegar. Em duas folhas usa a ponta externa disponível da folha ativa; não aparece em capa/contracapa. Rolagem é instantânea e preserva o texto. Zoom → Voltar à escrita continua permitindo retornar ao cursor.

Escape/perda de captura cancela o arraste sem deixar o clique residual virar a página. Escrita visual, colagem, navegação, resize e mudança de modo também cancelam gesto/retorno e removem cópias. Build e sintaxe de 34 arquivos aprovados; 34 testes sem falhas/skips. Ensaio na prévia: escrita nova, Ctrl+A/ferramentas, leitura sem destaque, folha grande, arraste curto sem navegação, Enter na ponta, dupla de folhas e navegação inferior em 320 px sem transbordamento. Evidência em `tmp/library4-selection-polished.png`. Não houve ensaio físico de toque/IME nem pesquisa de conforto com participantes.

### Capa, controles e luz viva — 11/10/2026

Capa e contracapa agora usam proporção vertical 3:4, largura máxima de 520 px, lombada interna e espessura inferior discreta. O acabamento fechado não herda mais as faixas laterais das folhas; couro, tecido, capa lisa e modelos continuam personalizáveis. Folhas mantêm a altura definida pela capacidade e rolagem normal.

Títulos usam **Alt+1/2/3** e lista **Alt+L**, com foco na escrita; os atalhos anteriores continuam como alternativas. Ctrl+1/2/3 permanece disponível para as abas do navegador. B/I, undo/redo, Shift+C e botões permanecem. “Folha e texto base” recolhe ajustes menos frequentes, aparência usa controles compactos e Zoom → **Ajustar largura** enquadra entre 80–100%, respeitando o limite de legibilidade existente. Parágrafos/listas têm espaçamento menor. O cursor restaurado pelo histórico procura uma posição de seleção válida, inclusive dentro de listas.

Virada ganhou sombra variável, verso com textura e indicação da ponta; capas não recebem a dobra articulada das folhas. A iluminação estática alcança mesa/caderno e transita entre presets sem alterar texto. **Caderno → Papel e ambiente → Luz viva** habilita shader WebGL nativo opcional, desligado por padrão, com buffer de até 960×640 e no máximo 30 desenhos/s. Movimento leve/desligado, preferência por movimento reduzido, aba oculta ou saída do caderno pausam o efeito; falta/perda de contexto conserva luz estática e mostra um estado explícito. Texto continua no DOM, sem dependência nova ou mudança de SQL/criptografia.

Build aprovado, sintaxe de 33 arquivos e **32 testes aprovados**, sem skips, incluindo PostgreSQL real e ciclo de pausa/fallback do efeito. Ensaio na prévia conferiu capa/contracapa, modelos, Alt+2/Alt+L, undo/redo, página nova, shader ativo/desligado, ajuste de largura e layout em 320/768 px. A prévia em [127.0.0.1:8006](http://127.0.0.1:8006/?preview=1) não salva. Evidência em `tmp/library4-cover-polished.png`. Não há linter configurado. A virada continua articulada, sem curva física contínua; FPS/GPU/bateria e teclados físicos diversos não foram medidos. Referências e detalhes em [direção artística](docs/design-templo.md).

### Atalhos e tinta personalizada — 10/10/2026

Com foco no conteúdo da folha: Ctrl+B alterna negrito; Ctrl+I, itálico; Ctrl+Alt+1/2/3, títulos; Ctrl+Shift+8, lista; Ctrl+Z desfaz e Ctrl+Shift+Z/Ctrl+Y refaz. Os comandos também aceitam Cmd como modificador. Botões continuam presentes e mostram atalhos em suas dicas. Combinações não tratadas seguem para editor/navegador; composição, AltGraph e repetição não disparam esses comandos.

**Shift+C, somente com trecho selecionado**, abre a paleta; sem seleção escreve C normalmente. “Mais cores” oferece o mesmo acesso pelo mouse/toque. Escolher tinta pronta aplica e retorna à seleção; seletor, HEX de seis dígitos e RGB inteiro de 0–255 permitem tinta personalizada. Escape cancela sem mudar o texto. No modo Fonte Markdown, Shift+C também está disponível, com o limite existente de estilo literal de uma linha. Cores muito claras podem reduzir contraste: não há correção automática que altere a escolha.

A tinta é codificada na extensão Markdown existente (por exemplo, `{{l4;sans;#1c5fa0;16}}**ideia**{{/l4}}`), reimportada com atributos validados e salva pelo mesmo fluxo cifrado. Não aceita CSS arbitrário nem requer biblioteca/migração SQL. Corrigido também o `white-space: pre-wrap` do editor, conforme aviso observado no ensaio anterior. Build, sintaxe e 29 testes aprovados; ensaio na prévia conferiu B/I, paleta/RGB, reabertura, cancelamento, título/lista e undo/redo. IME e combinações em sistemas/teclados físicos distintos continuam pendentes.

### Edição visual e caderno integrado — 10/10/2026

Prévia atual: [127.0.0.1:8006](http://127.0.0.1:8006/?preview=1), iniciada sem encerrar processos antigos. A prévia não salva; contas usam `/`. Aguarde “Salvo” na aba anterior antes de trocar: banco confirmado é compartilhado, rascunhos/padrão local são separados por porta.

Esta revisão substitui a organização das rodadas históricas abaixo. **Escrever** edita diretamente títulos, listas, código e texto formatado na folha, sem exibir a sintaxe. Selecione um trecho e use Negrito/Itálico/H1–H3/Lista/Código, fonte, tamanho ou tinta na faixa lateral. Os botões indicam o formato ativo e têm resposta curta de hover/pressionamento; undo/redo continuam no histórico da aba, com formatações como ações separadas. **Fonte Markdown** oferece edição avançada, mantendo o texto original de notas que só foram abertas; editar visualmente normaliza a sintaxe e os espaços conforme o editor. HTML externo não é colado: entra texto interpretado pelo renderizador seguro.

Formatação fica diretamente acessível no desktop; em até 600 px, Texto começa recolhido e abre uma faixa própria sem transbordar. Índice, Zoom e Caderno continuam separados, com Escape/clique fora. Personalização oferece cor hexadecimal e couro ilustrado/tecido/capa lisa, junto aos modelos existentes; cores e acabamento também aparecem na coleção. As camadas inferiores foram alinhadas para remover o acabamento diagonal. Papel, madeira e contornos seguem arte CSS própria.

**Ctrl+roda**, dentro do caderno, altera zoom de 80–140%; **Ctrl+botão esquerdo+arraste** move o enquadramento e soltar Ctrl encerra a movimentação. Rolagem comum permanece disponível; botões e modo Mover são alternativas. Arrastar a ponta inicia a virada acompanhando o ponteiro: ultrapassar 25% da largura confirma, soltar antes retorna. Clique/teclado na ponta e setas continuam funcionando. Frente/verso e ponta articulada compõem o efeito; não há curva física contínua. Movimento reduzido/desligado prevalece.

Um caderno sem retomada recente abre na **capa**; anterior à primeira folha chega à capa e depois da última à **contracapa**. Abrir/voltar leva às anotações; esses estados não criam páginas nem produção fictícia. A retomada de até 24 horas continua abrindo as notas. Preferências e texto seguem o mesmo salvamento AES-GCM/versões/rascunhos, sem migração SQL. Falha de exportação visual mantém a edição na folha, mostra pendência persistente e bloqueia navegação/logout até nova sincronização ou desfazer; não marca esse texto como salvo.

Tiptap é empacotado localmente por `npm run build`; `npm start`/`npm run dev` constroem o bundle automaticamente. Depois de alterar `public/notebook-visual.js`, execute o build novamente; não há watcher do bundle. O arquivo gerado `public/vendor/visual-editor.js` é ignorado pelo Git e servido por `/visual-editor.js`, sem CDN. Markdown é o formato persistido, não JSON do Tiptap. Estilo antigo `{{serif;rust;20|texto}}` continua literal; estilo visual usa `{{l4;serif;blue;20}}**texto**{{/l4}}`, com atributos enumerados e Markdown interno seguro. Esses estilos são extensão do Library4, não Markdown universal. A integração Markdown do Tiptap ainda é apresentada como Beta em sua documentação; importação/exportação irrestrita não é prometida.

Verificação: 27 testes sem falhas/skips, sintaxe de 31 arquivos, 17 fluxos em Edge headless com PostgreSQL real, quatro grupos de UI em 320/768/1360 px e ensaio visual de formatação/undo, capas, Ctrl, ponta arrastável, colagem segura, erro de exportação e paginação/composição simulada. Referências, limites e plano em [direção artística](docs/design-templo.md) e [passo a passo](docs/passo-a-passo.md). Sem linter configurado. Aparelhos físicos, IME/teclado virtual reais, bateria e conforto prolongado permanecem sem ensaio.

### Luz, papel e controles — revisão de 10/10/2026

Pauta, pontilhado e quadriculado cobrem toda a folha, incluindo margens, cabeçalho e rodapé. A área de edição/leitura é transparente; a pauta acompanha a origem da escrita. A iluminação é uma camada visual suave sobre mesa, capa e folhas, sem filtros sobre o texto, mudança de conteúdo ou bloqueio de interação. Dia/noite/luz amarela continuam preferências privadas por caderno.

Escrever/Ler ficam diretamente no cabeçalho. Quatro acessos substituem o menu único: **Índice** (busca, páginas e lembretes), **Texto** (tamanho da página/letra, Markdown, undo/redo e estilo da seleção), **Zoom** (80–140%, centralizar, cursor, uma/duas folhas e movimento), **Caderno** (materiais, ambiente, versões, padrão, edição e foco). Abrem por clique/toque/teclado, um por vez; Escape ou clique fora fecha. A posição e o “+” continuam na navegação inferior. As descrições das rodadas anteriores abaixo são históricas; esta organização é a atual.

Zoom → Mover com o mouse habilita arraste esquerdo; o acesso passa a indicar “Movendo”. Escape, Escrever ou Voltar à escrita desativa o modo. Arraste direito, setas quando o enquadramento tem foco, rolagem e pinça nativas continuam disponíveis. O modo Mover é temporário; zoom e aparência seguem o salvamento existente. Sem nova dependência nem mudança de SQL/criptografia. Referências e decisões em [direção artística](docs/design-templo.md#revisão-de-luz-papel-e-controles--10102026).

Validação: 24 testes aprovados sem skips, sintaxe de 29 arquivos, 16 fluxos de regressão em Edge headless e quatro verificações adicionais de painéis/teclado, pauta/luz, arraste e larguras 320/768/1360 px. Sem linter configurado. Pinça/teclado virtual e conforto em uso prolongado ainda exigem aparelhos e pessoas reais.

Versão mais recente para revisão: [127.0.0.1:8005](http://127.0.0.1:8005/?preview=1). A prévia não salva; contas reais usam `/`. Instâncias anteriores podem permanecer em outras portas: aguarde confirmação de salvamento antes de trocar, pois rascunhos/padrão pessoal locais são separados por origem/porta.

A aplicação local já conecta cadastro/login, senha de conteúdo separada, cadernos/páginas, Markdown/prévia, autosave, reabertura, histórico/restauração, metas e métricas atuais ao PostgreSQL. `/?preview=1` continua uma demonstração isolada sem persistência; recarregar perde somente os dados desse modo.

A senha da conta faz login. A senha de conteúdo desbloqueia uma chave raiz no navegador via PBKDF2/SHA-256 (600.000 iterações, salt aleatório); AES-GCM protege a raiz, as chaves de caderno e o conteúdo. Essa senha não é enviada ao servidor nem persistida pelo app; recarregar exige informá-la novamente. Esquecê-la impede recuperar o conteúdo; redefinir login não contorna a criptografia.

Autosave agrupa mudanças após cerca de 900 ms sem edição, com envio durante escrita contínua em até cerca de 5 s, sujeito à conexão e ao navegador. Só exibe "Salvo" quando a versão atual está confirmada. Timeout repete o mesmo lote; texto digitado durante envio permanece pendente para o seguinte. Conflito oferece preservar o rascunho em outro caderno. Últimas 50 versões por página; restauração cria revisão nova. Fechar com alterações pendentes solicita confirmação nativa, e logout tenta salvar antes de sair.

Ainda não é o MVP completo: recuperação de login, refinamento da paginação Markdown e ensaio operacional de backup continuam pendentes. Não há publicação/whitelist implementadas. Rascunhos agora podem ser recuperados do armazenamento local criptografado após desbloquear; a proteção só vale para snapshots cuja gravação local foi concluída.

### Protótipo do caderno — 10/10/2026

O editor agora apresenta uma folha alta sobre uma superfície de madeira feita em CSS, com desenho próprio. Pequeno/médio/grande controlam 24/36/48 linhas de referência; a altura acompanha essa capacidade, sem reduzir a folha para caber na tela. Texto que ocupa mais espaço em telas estreitas expande a área de escrita; a rolagem é da página, sem esconder conteúdo num campo com rolagem interna.

Fluxo: abrir caderno → escrever/ler na folha → abrir Ferramentas para tamanho, letra ou movimento → Anterior/Próxima troca a página e executa uma animação nativa curta. A troca de conteúdo é imediata e não aguarda a animação. A escrita cancela o efeito, e nova navegação substitui o movimento anterior. Índice e lembretes ficam em um painel recolhível. Estados de erro continuam visíveis; o salvamento usa o mesmo fluxo criptografado existente.

Modos de virada completa, leve e sem movimento, com preferência do sistema por movimento reduzido prevalecendo. Navegador sem suporte à animação continua trocando páginas. Movimento é salvo nos metadados privados do caderno. A virada usa frente/verso e uma ponta articulada no modo completo; uma curva contínua e animações pré-renderizadas ainda não estão implementadas. Desempenho em hardware modesto não foi medido.

A prévia abre um caderno de exemplo com duas páginas consecutivas. Seus dados permanecem só na aba e não são gravados no PostgreSQL nem no IndexedDB. A instância atual está em [127.0.0.1:8005](http://127.0.0.1:8005/?preview=1); `npm start` continua usando a porta configurada no `.env` (8000 na configuração local).

### Refinamento do caderno — primeira rodada

Papel, bordas, espessura e lombada foram refinados em CSS próprio, com madeira mais discreta. Ferramentas abre ao passar o mouse; clique/toque ou Enter/Espaço mantém o painel fixado. Ao afastar o mouse, o painel automático recolhe quando não há foco em seus controles. Escape fecha e retorna à aba. O painel se sobrepõe ao papel, sem empurrar o texto; a entrada curta respeita movimento reduzido.

Modo foco recolhe coleção, edição e índice, mantendo ferramentas, navegação e estado de salvamento. “Sair do foco” ou Escape restaura os controles; sair para a coleção encerra o modo. “Topo” retorna ao início da folha e leva o foco ao título, ou ao texto de leitura. Os ajustes de foco/movimento são da aba atual, sem promessa de sincronização. Autosave, criptografia e estrutura dos documentos não foram alterados.

A instância desta rodada está em [127.0.0.1:8002](http://127.0.0.1:8002/?preview=1), pois a porta 8001 estava ocupada por uma instância anterior. A prévia continua sem salvamento. Testes incluem os controles de hover/foco/fixação/fechamento do HUD.

### Controles compactos e virada lateral

O cabeçalho foi reduzido a voltar à coleção, nome do caderno, salvamento e “⋯” (Opções do caderno). Escrita/leitura, tamanho, letra, versões, topo, edição, modo foco, índice e lembretes ficam nesse único menu, acessível por clique/toque/teclado. A navegação inferior usa duas setas com rótulos acessíveis e a posição atual. As áreas de toque continuam com 44 px; reduzir visibilidade não reduz o alvo funcional.

Virada: capturar a apresentação da folha antiga → mostrar imediatamente a página de destino no editor → girar a cópia visual 180° pela lombada, revelando a próxima folha. No caminho inverso, a folha de destino retorna do outro lado sobre a apresentação anterior. Frente e verso têm orientação própria; a cópia é inerte, oculta de tecnologia assistiva, sem IDs duplicados e removida ao terminar/cancelar. O texto do editor real nunca gira nem espera a animação.

Escrever no título/conteúdo, trocar tamanho/modo, redimensionar, ocultar a aba ou navegar novamente cancela o efeito e remove as cópias. Modo desligado/redução de movimento evita criar cópias. No modo completo, a ponta dobra durante a rotação; a curva física contínua permanece pendente, sem motor ou biblioteca nova.

### Duas folhas editáveis

Opções do caderno → Folhas → Duas folhas apresenta páginas consecutivas lado a lado em larguras a partir de 1.100 px. Ambas aceitam título e Markdown; clicar ou focar uma determina os ajustes de tamanho/letra, versões e retorno ao topo. O menu informa a página desses ajustes. Setas navegam por pares; o índice pode escolher qualquer página. Uma última página ímpar mostra a capa de encerramento ao lado, sem criar folha vazia.

Na leitura, o campo de título vazio fica oculto para evitar repetir “Dê um título à sua ideia” sobre o conteúdo. Voltar a escrever reapresenta o campo; títulos existentes continuam visíveis.

O foco no campo de escrita usa uma linha suave no topo, sem a barra escura na lateral esquerda. A margem decorativa do papel permanece separada desse indicador.

Ao estreitar a tela, o editor apresenta somente a página ativa; ampliar restaura o par. Alterar a visualização preserva os documentos, sem repaginar, e a preferência é salva nos metadados privados do caderno. A continuação automática funciona nos dois lados; ao alcançar 500 páginas, mantém o texto excedente na folha e avisa. Título/conteúdo seguem o mesmo fluxo de autosave criptografado, sem mudança no esquema SQL. Pares incompletos trocam sem animação; curva contínua e desenho de caderno dobrado continuam pendentes.

Verificação desta rodada: sintaxe de 19 arquivos e 10 testes aprovados, nenhum pulado, incluindo PostgreSQL real. Navegador verificou edição independente, fonte por folha, escrita/leitura, paginação pela folha direita, pares ímpares e fallback em 320 px sem transbordamento. Não há linter configurado.

### Escrita, continuidade e personalização — 10/10/2026

O “+” de criar página fica junto às setas, disponível também no modo foco; cria uma página no fim e abre sua escrita mesmo quando o caderno estava em leitura. O botão duplicado no índice foi removido. A página ativa tem numeração destacada de forma discreta. Tipografia e espaçamentos foram ajustados; a fonte inicial é de leitura simples, com alternativas literária e monoespaçada.

No menu, Negrito/Itálico/H1/H2/H3/Lista/Código inserem Markdown na seleção. Ctrl/Cmd+B/I e Ctrl/Cmd+Z, Shift+Z ou Y cobrem formatação e desfazer/refazer. O histórico da aba guarda até 30 grupos de edição, agrupando digitação próxima. Restaurar preserva revisões recebidas do servidor. Desfazer uma divisão limpa as folhas geradas, sem apagar suas identidades, pois a API não permite descartar páginas. O histórico de undo não é persistido; versões do servidor continuam sendo o recurso de recuperação duradoura.

A divisão consulta os tokens do `markdown-it` existente e preserva listas, código cercado/indentado, citações e tabelas como blocos inteiros. Um bloco maior que a capacidade expande sua folha. Parágrafos longos ainda usam a largura lógica de referência; capacidade não é uma medição física exata do Markdown renderizado. Alterar largura durante composição de texto adia a troca de folha até a confirmação, preservando o texto em edição.

Rascunho: alteração → snapshot → AES-GCM com contexto de conta/caderno → transação IndexedDB concluída → indicador de proteção local. A verificação ocorre a cada cerca de 500 ms; alterações posteriores à última transação ainda não estão protegidas. O lote idempotente também é protegido antes do envio. Só existem envelopes e identificadores no armazenamento, nunca senha ou chave legível. Ao desbloquear novamente, um único rascunho pendente é recuperado; vários abrem uma escolha no menu. Revisão remota divergente exige preservar uma cópia; timeout pode repetir o mesmo lote. Confirmação remota limpa as cópias locais correspondentes; logout salva e limpa antes de sair. Rascunhos de outras abas não são sobrescritos nem expiram automaticamente.

IndexedDB é separado por origem, inclusive porta. Limpar os dados do navegador, modo privado, quota ou expulsão do armazenamento podem remover/impedir a proteção. Erros locais ficam visíveis e não impedem a tentativa de salvar no servidor. É necessário alcançar o servidor para entrar e carregar as chaves antes da recuperação; não é um aplicativo totalmente offline. [Transações IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction).

Enquadramento: menu → zoom de 80–140%, centralizar ou voltar ao cursor. Arrastar com o botão direito move horizontalmente o caderno e verticalmente a tela; um clique direito simples mantém o menu de contexto. A rolagem normal e a pinça nativa do navegador permanecem disponíveis no celular. A ampliação usa [CSS zoom](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/zoom), que requer navegador atual; não há garantia para navegadores antigos.

“Meu caderno” oferece três papéis, três cores de capa e três famílias de fonte do sistema. Preferências de visualização/movimento/zoom e referência de página/cursor são criptografadas junto aos metadados e sincronizam pelo salvamento existente. Após desbloquear, o caderno mais recentemente usado nas últimas 24 h reabre pelo trecho proporcional à folha; posições de leitura são registradas periodicamente e ao navegar/sair. “Usar como meu padrão neste dispositivo” protege o padrão com a chave raiz no IndexedDB e aplica a novos cadernos; esse padrão pessoal ainda não sincroniza entre dispositivos.

Verificado: sintaxe de 24 arquivos JavaScript, 16 testes sem falhas ou skips (PostgreSQL real incluído) e oito fluxos automatizados em Edge headless com conta descartável. O ensaio inclui erro de envio, transação IndexedDB real, recarga/desbloqueio/recuperação/limpeza, preferências e retomada, composição simulada durante resize, uma/duas folhas, 320 px, atalhos, zoom/arraste e virada com cancelamento/remoção. Evidência: `tmp/library4-polished.png`. O ensaio descartável usa o Playwright já disponível no runtime, sem adicionar dependência ao app. IME real, aparelhos físicos, FPS, memória e bateria continuam sem medição. Não há linter configurado.

### Estantes, favoritos e busca privada

Na coleção, **Organizar** permite associar um caderno a várias estantes e marcar favorito. Os nomes ficam nos metadados criptografados e acompanham o salvamento/recarga, sem duplicar páginas. São até 12 estantes de até 60 caracteres por caderno; nomes iguais sem distinção de capitalização se reúnem. Uma estante aparece quando contém cadernos; entidades vazias e renomeação coletiva ainda não estão implementadas.

O filtro oferece estantes, favoritos e recentes primeiro; recentes usa a última posição registrada. A busca consulta nome, matéria, tags e estantes na coleção desbloqueada, inteiramente no navegador. Ainda não busca texto das páginas. Busca/filtro não são persistidos. Erros de envio na coleção oferecem abrir o caderno para recuperação; retirar um favorito de sua lista mantém o foco acessível. Capas acompanham a preferência do caderno e usam uma coluna nas telas pequenas.

Criar caderno permite selecionar o tamanho inicial, preenchido pelo padrão pessoal. Criar a partir do filtro de estante sugere essa associação. Editar a organização mantém conteúdo e tamanho das folhas existentes.

Um rascunho local inválido deixa um aviso e permanece preservado, enquanto os demais são recuperados normalmente. Esta rodada passou 18 testes (PostgreSQL real incluído), sintaxe de 26 arquivos e onze fluxos automatizados no navegador, incluindo persistência de organização, falha/retry e um registro local adulterado junto a um válido. O [controle do plano original](docs/passo-a-passo.md#plano-original-controle-de-escopo--10102026) separa entregas parciais e pendências: progresso diário, ambientação, publicação/whitelist e social continuam previstos.

Versão desta rodada: [127.0.0.1:8004](http://127.0.0.1:8004/?preview=1), pois a 8003 está ocupada por outra instância. Rascunhos/padrão pessoal do navegador são separados por porta; os cadernos confirmados no PostgreSQL permanecem na mesma conta.

### Atualização ampla: escrita e ambiente

No modo Escrever, selecione um trecho e abra **⋯ → Estilo do trecho selecionado** para escolher fonte, tinta e tamanho; a amostra antecipa as escolhas. Aplicar grava uma extensão segura do Markdown (`{{serif;rust;20|texto}}`), e **Ler** mostra sua aparência. Remover estilo e undo/redo mantêm o texto; recarregar/desbloquear recupera a marcação cifrada. Esta primeira versão aceita texto literal de uma linha, sem chaves ou Markdown interno; selecionar o marcador inteiro permite mudar/remover o estilo. Outros leitores de Markdown exibem a extensão como texto até convertê-la; exportação ainda não está implementada.

**Modelo** alterna capa costurada, espiral e agenda flexível. **Papel e ambiente** oferece linhas, liso, pontos ou grade, madeira clara/escura/linho e luz amarela/janela/noite. As opções acompanham o caderno no autosave criptografado, sem alteração SQL. A fonte manuscrita depende das fontes do sistema, com fallback cursivo; nenhuma fonte externa foi instalada.

Enter continua listas/checklists/números/citações e preserva indentação de código cercado. Enter num item vazio encerra a lista; Shift+Enter e Tab mantêm comportamento nativo. O índice busca texto/títulos do caderno aberto localmente; clicar na contagem inferior permite ir direto a uma página. A prévia é renderizada somente ao ler, e digitação curta evita reconstruir índice/lembretes e outras folhas.

O lembrete opcional, inicialmente desligado, aparece após cerca de 45 minutos de caderno visível, incluindo leitura. Pausa com a aba oculta/fora do caderno, permanece até dispensar e reinicia ao abrir um caderno/recarregar. Não bloqueia ações nem mede horas efetivas de estudo.

Verificado: 29 arquivos com sintaxe válida, 23 testes sem skips e 16 fluxos automatizados em Edge headless, com PostgreSQL real, estilos/preferências persistentes, undo, busca/salto e 320 px. Ensaio local final de 50 entradas num bloco de código longo: média de 0,95 ms, maior amostra de 2,30 ms para atualização síncrona; não é medição de INP/FPS ou garantia em hardware físico. Timer coberto com relógio simulado. Evidências e limites no [andamento](docs/passo-a-passo.md).

## Executar localmente

Requer Node.js 24+ e PostgreSQL. No PowerShell, dentro deste repositório:

```powershell
npm install
node scripts/local-db.js
npm run db:migrate
npm start
```

O provisionamento usa os binários PostgreSQL encontrados em `C:/Users/isazky/pgsql-setup/tar-extract/pgsql/bin`; use `PG_BIN` para outro diretório. Cria uma instância separada em `tmp/postgres`, porta 5547, e uma `.env` com segredo aleatório; não altera os bancos anteriores. Para banco próprio, configure `DATABASE_URL` seguindo `.env.example` e execute a migração sem provisionamento.

Abra [a aplicação local](http://127.0.0.1:8000/) ou [a prévia sem conta](http://127.0.0.1:8000/?preview=1). O servidor escuta somente em loopback; a configuração não é de produção. `tmp/`, `.env` e `node_modules/` são ignorados pelo Git.

## Verificação

```powershell
npm run check
npm test
```

`check` verifica sintaxe JavaScript, não substitui um linter. Testes cobrem paginação, criptografia/adulteração, senha de conteúdo, autosave com edição durante envio/timeout, e PostgreSQL real: isolamento, conflitos, idempotência, reabertura e restauração. Sem `DATABASE_URL`, a integração é pulada explicitamente.

## Documentação

- [Contexto](context.md)
- [Proposta](docs/proposta.md)
- [Requisitos do MVP e etapas posteriores](docs/requisitos-funcionais.md)
- [Banco](docs/banco-de-dados.md) e [migração executável](db/001-foundation.sql)
- [Passo a passo e andamento](docs/passo-a-passo.md)
- [Skill de UI/UX](skills/library4-design/SKILL.md)

Projeto anterior e estudos preservados em `tmp/library4-before-rebuild.tar` antes da substituição. Material antigo não é servido pela aplicação nova.
