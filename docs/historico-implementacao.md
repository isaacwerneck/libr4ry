# Histórico de implementação — Library4

Registro preservado do README anterior. As entradas descrevem entregas em momentos diferentes e podem conter comportamentos substituídos; para uso atual, consulte [o guia de uso](uso.md) e [a documentação](README.md). Portas, contagens de testes e evidências locais são registros daquela etapa.

## Estado atual

### Cadernos compartilhados e Markdown — 23/10/2026

O mesmo caderno agora pode ser privado ou público. Público significa leitura por qualquer conta autenticada; dono e whitelist podem editar em conjunto com Yjs, cursores e seleções. Lista negra e bloqueio social prevalecem; cadernos privados aparecem no perfil do dono e na estante dos autorizados, mas não nos perfis deles. Cadernos públicos aparecem no perfil do dono e de colaboradores autorizados, sem revelar os privados em perfis de terceiros. A chave do livro é encapsulada para cada participante com ECDH, sem compartilhar a senha do dono. Render/Hocuspocus entrega presença e atualizações cifradas; Neon armazena envelopes, ACL, atualizações e versões. Revogação bloqueia novos acessos pelo serviço, mas não remove cópias baixadas. Markdown exporta páginas em texto legível e permite criar ou atualizar cadernos, com prévia, confirmação, cópia integral anterior e retenção de páginas omitidas. Os serviços estão configurados para Netlify/Render/Neon, mas não foram criados ou implantados.

### Histórico coerente com a página e a escrita atual — 22/10/2026

Após o proprietário adiar a publicação e priorizar UI/UX, mecânicas e bugs, corrigido o fluxo de versões no frontend. Consulta pendente não abre diálogo em outra página/caderno, no portal, em capa/verso vazio ou com edição visual pendente. A mesma guarda impede restaurar uma seleção antiga se a navegação mudar com o diálogo aberto.

A abertura aguarda confirmação das edições e consulta novamente se a geração mudar durante a busca, inclusive quando o autosave já confirmou a geração nova. Isso evita restaurar antes de preservar a escrita atual e evita uma lista desatualizada após digitação durante a consulta. Botão mostra Carregando… e volta a Versões em sucesso, falha ou cancelamento; janela identifica o número da página. Nenhuma dependência ou mudança em SQL/envelopes.

Regressões executam os handlers reais com Promises controladas: navegação durante envio/consulta, edição nos dois intervalos, autosave concorrente, erros e restauração com contexto antigo. O código anterior falhou em 14 dos 15 cenários iniciais; os testes foram ampliados para 18 cenários. Validação final: 95 testes sem falhas ou skips, incluindo PostgreSQL local, e sintaxe de 62 arquivos aprovada. Esta etapa não teve conferência manual da janela no navegador.

### Índice com prévia das folhas sem título — 21/10/2026

Substituída a frase fixa Uma nova ideia no índice pelo início da anotação quando o título está vazio. Somente a primeira linha não vazia passa pelo renderizador Markdown seguro existente e depois é convertida em texto; títulos preenchidos continuam prioritários. Folhas vazias usam Sem título. Nenhuma escrita em título/conteúdo, alteração de payload ou dependência nova.

Ensaio no navegador em 1280×720 confirmou os títulos derivados das duas folhas da prévia, remoção de marcadores de cabeçalho/negrito/código, título vazio e Markdown original preservados por asserts sobre o DOM. Nova folha ficou identificada como 03 Sem título. Captura page-index-previews.png. Tentativa de conferir preenchimento de título vazio pelo navegador não foi concluída, pois o campo está recolhido pelo design atual; essa interação não foi validada. Alturas menores e dispositivos físicos não foram conferidos nesta etapa. Validação final: 77 testes sem falhas ou skips, incluindo PostgreSQL local, e sintaxe de 61 arquivos aprovada.

### Escolha de amizade sem interrupção da consulta automática — 21/10/2026

O ciclo de mensagens aguarda quando o seletor de destinatário está com foco. Antes, perform podia desabilitar esse seletor a cada consulta de fundo e interromper seu uso. Ao sair do seletor, a consulta volta no próximo ciclo de 10 segundos. Conservados bloqueio de operações simultâneas, rascunhos, erro/sucesso e proteção contra resposta de outra conversa.

Regressão no teste social existente capturou o callback do intervalo e primeiro falhou no código anterior: uma consulta iniciava durante foco no seletor. Após a correção, exige ausência desse pedido e seletor habilitado, e confirma retomada ao focar a mensagem. Validação final: 77 testes sem falhas ou skips, incluindo PostgreSQL local, e sintaxe de 61 arquivos aprovada. Comportamento do menu nativo não foi ensaiado manualmente nesta etapa.

### Mensagens de salvamento e conferência pública — 21/10/2026

renderSaveState conserva o texto atual quando estado de salvamento, erro de envio e aviso de proteção local não mudam. Evita substituir repetidamente os nós de texto das regiões status/alert durante a escrita e o autosave; mensagens, prioridades, botões de resolução e lógica de persistência permanecem iguais. Regressão executa a função real com contagem de escritas e cobre repetição, edição adicional no mesmo estado, falha e confirmação. Falhou no código anterior e passou após a correção. Validação final: 77 testes sem falhas ou skips, incluindo PostgreSQL local, e sintaxe de 61 arquivos aprovada. Anúncio com leitor de tela físico ainda não foi conferido.

Acesso de leitura a https://libr4ry.netlify.app exibiu Page not found do Netlify, registrado em public-release-404.png; não comprova disponibilidade do nome ou configuração da conta. Não houve login no painel, provisionamento nem deploy. A publicação real continua pendente.

### Concorrência na limpeza dos rascunhos — 21/10/2026

Reproduzida falha em clearDraft: enquanto a remoção do rascunho confirmado aguardava armazenamento, uma nova edição podia gerar outro rascunho; ao concluir, a limpeza antiga zerava a referência nova. O registro cifrado continuava no armazenamento, mas uma limpeza posterior já não o encontrava pela referência, podendo reaparecer como rascunho obsoleto ao entrar novamente.

Correção compartilhada pelo autosave, logout e cópia de conflito: capturar as referências antes da remoção e zerar somente as que continuarem iguais. Preservados comparação de stamp no IndexedDB, erros, cifragem e guardas de geração/lote. Regressão primeiro falhou no código anterior e passou após a correção; simula remoção pendente, nova edição protegida, leitura do envelope e limpeza final após confirmação. Validação final: 76 testes sem falhas ou skips, incluindo PostgreSQL local, e sintaxe de 60 arquivos aprovada. A intercalação foi controlada no teste; não foi reproduzida manualmente no navegador.

### Foco após falhas nos formulários — 21/10/2026

Login/cadastro, desbloqueio, recuperação de senha e criação/edição de cadernos guardam o controle focado antes de bloquear o formulário durante a operação. Ao falhar, reabilitam os controles antes de devolver o foco, sem rolar a página nem roubar foco movido para outro controle. Sucesso mantém o foco do próximo fluxo. O formulário de cadernos também limpa o erro antigo ao iniciar nova tentativa. Módulo compartilhado incluído na lista pública e no pacote Netlify, sem dependência nova.

Validação: 75 testes sem falhas ou skips, incluindo PostgreSQL local, e sintaxe de 60 arquivos aprovada. Autoverificação dos handlers de login/desbloqueio confirmou espera, bloqueio de repetição, erro, retorno ao botão e nova tentativa. Navegador com resposta 429 simulada confirmou retorno ao botão por clique e ao campo de senha por Enter; captura auth-focus-restored.png. Banco remoto, deploy e entrega real de e-mail continuam pendentes.

### Regra de autenticação na borda do Netlify — 21/10/2026

Criada Function auth com as quatro rotas de login/cadastro/recuperação e configuração rateLimit de 15 requisições em 60 segundos por IP e domínio. A Function api exclui exatamente essas rotas; ambas usam o mesmo handler, preservando as validações e a cota local, sem impor a cota de autenticação ao autosave. Nenhuma biblioteca, tabela ou credencial nova.

Cliente traduz respostas 429 em HTML, vazias ou com JSON sem mensagem para um aviso de espera em português; mantém status/cause, erros específicos do backend e uma única tentativa. Testes cobrem correspondência de rotas/exclusões, configuração preservada no bundle esbuild de auth e formatos de erro. Configuração local não comprova bloqueio da rede Netlify: conferir aceitação no log do deploy e enforcement real, considerando atraso de até 10 segundos documentado pelo provedor. Não houve deploy nem alteração de conta remota. Validação: 74 testes sem falhas ou skips, incluindo PostgreSQL local, e sintaxe de 58 arquivos aprovada. Navegador recebeu 429 HTML de um servidor isolado de ensaio e exibiu o aviso em português, com controles liberados; captura auth-rate-limit.png. A resposta foi simulada, sem comprovar o bloqueio do Netlify.

### Adaptador e build para Netlify — 19/10/2026

Extraído createRequestHandler do servidor HTTP para compartilhar a mesma API com a Function. createServer conserva portas/timeouts locais. Adaptador Netlify converte Request/Response, preserva corpo/query/cookies/erros/cabeçalhos, exige origem HTTPS e usa apenas IP fornecido pelo contexto. Fecha o stream de entrada ao concluir. Rotas externas a /api/* não acessam assets pelo adaptador. Cota de autenticação permanece em memória por instância; proteção distribuída é pendência antes da abertura pública.

requestPasswordReset aceita um registrador opcional da Promise de envio; a Function fornece context.waitUntil, mantendo a resposta genérica independente do tempo do provedor. Continua sem fila durável. Teste com PostgreSQL confirmou cadastro, sessão Secure/HttpOnly/SameSite, consulta de identidade, logout/revogação e resposta de recuperação antes da conclusão do envio simulado; destinatário inexistente não agenda envio.

netlify.toml configura Node 24, esbuild e pg existente externo. build:netlify recompila o editor e recria dist somente com a lista de assets já permitida pelo servidor; gera cabeçalhos de segurança compartilhados. dist e .netlify ignorados no Git. Teste compara os arquivos, remove artefato antigo de ensaio e compila/executa a Function empacotada. Não houve instalação de dependência, CLI ou deploy remoto.

Validação: build:netlify aprovado, 73 testes sem falhas ou skips incluindo PostgreSQL local e sintaxe de 57 arquivos, incluindo .mjs da Function. Runtime Netlify, banco hospedado, limites do plano, segredos, e-mail real e domínio ainda não foram validados.

### Espera no social e preparação do banco para Netlify — 19/10/2026

Ações manuais do social mostram Aguarde… em vez de apagar o status durante chamadas assíncronas. finally remove apenas esse aviso temporário; preserva confirmação e erro, e consultas periódicas continuam silenciosas. Teste existente estendido para espera, erro preservado, controle liberado e nova busca concluída sem aviso residual.

Proprietário definiu Netlify e origem pretendida https://libr4ry.netlify.app, sem PostgreSQL hospedado disponível. database aceita NETLIFY_DB_URL como alternativa, conservando prioridade de DATABASE_URL, pool e opções existentes. Teste com Pool simulado cobre ambas as variáveis, reutilização do pool e configuração ausente; conexão hospedada não foi ensaiada. Documentadas pendências reais da adaptação HTTP/Functions e do envio assíncrono de recuperação; sem provisionamento remoto ou SDK novo. Validação final: 69 testes aprovados sem falhas ou skips, incluindo PostgreSQL local, e sintaxe de 53 arquivos aprovada.

### Entrada e desbloqueio durante espera — 19/10/2026

Login/cadastro e desbloqueio usam guarda de submissão e formulário inert durante operações assíncronas. A entrada desabilita também a abertura da recuperação; o desbloqueio informa aria-busy, mostra Desbloqueando… e bloqueia Sair da conta até concluir. finally libera os controles no sucesso e na falha. Reutiliza a proteção existente no formulário de cadernos, sem novas dependências ou mudanças de criptografia.

Autoensaio por assert executou os handlers reais extraídos do app com resposta controlada: verificou segunda submissão ignorada, estados ocupados, erro sem reset dos campos e nova tentativa bem-sucedida. Navegador com login fictício retido confirmou Entrando…, controles indisponíveis, timeout explícito e liberação para tentar novamente; captura auth-wait.png. Não houve cadastro ou acesso a conta real. Suíte: 68 testes sem falhas ou skips; sintaxe de 52 arquivos aprovada. Desbloqueio foi verificado pelo autoensaio, sem leitor de tela ou dispositivo físico nesta rodada.

### Encerramento dos testes com banco indisponível — 19/10/2026

Reproduzido travamento da integração de cadernos: falha na limpeza SQL impedia fechar o servidor, exigindo terminar o subprocesso após 15 segundos. A limpeza das integrações de cadernos, social e recuperação agora fecha o servidor antes de consultar o banco e encerra o pool em finally. Erros continuam sendo reportados; falha de limpeza pode deixar apenas os próprios registros fictícios, sem ampliar os filtros de exclusão. Nenhuma alteração no comportamento da aplicação.

Regressão executa cada integração num subprocesso com URL fictícia local indisponível, exige saída 1 e ECONNREFUSED, e falha se o processo precisar de timeout. O subprocesso remove NODE_TEST_CONTEXT herdado para iniciar seu runner independente. Os três cenários passaram após a correção. Suíte completa: 68 testes aprovados, sem falhas ou skips, com PostgreSQL real nos fluxos normais; sintaxe de 52 arquivos aprovada. Não foi necessário recompilar o frontend, pois esta rodada alterou somente testes e documentação.

### Identificação das folhas no editor — 18/10/2026

O editor visual usa o número da folha em seu nome acessível e atualiza aria-readonly ao alternar Ler/Escrever. renderPage fornece a identificação ao host por data-page-label, e os atributos dinâmicos do editor existente aplicam o nome apenas ao textbox, evitando anúncio duplicado do contêiner. Nenhuma alteração no conteúdo cifrado ou dependência.

Prévia no navegador confirmou criação por Enter com foco na página 3, nomes distintos nas páginas 2/3, persistência dos nomes após digitação e alternância contenteditable/aria-readonly nos dois modos sem perder o texto. Build aprovado, sintaxe de 51 arquivos e 65 testes sem falhas ou skips, incluindo PostgreSQL. Essa conferência de DOM/teclado não substitui leitor de tela real. Captura page-labels-writing.png registra a escrita; a prévia não salva ao recarregar.

### Avisos sem interrupção prematura — 15/10/2026

notify agora cancela o temporizador anterior antes de exibir a nova mensagem. Antes, dois avisos separados por 4,9 segundos faziam o segundo desaparecer após 0,1 segundo. Autoensaio por assert executou a função real com relógio simulado e confirmou cinco segundos completos para o segundo aviso. A notificação não contém ações e usa pointer-events: none, mantendo leitura por role=status sem interceptar cliques sobre a navegação.

Prévia no navegador confirmou mensagem de seleção de tinta visível, pointer-events computado e passagem à página 2 com o aviso aberto. Aviso posicionado acima da navegação; medição no navegador em 1280×720 confirmou base do aviso em 624 px e topo dos controles em 636 px, sem sobreposição. Captura notice-polish.png registra o aviso. Revisão das rotinas de virada confirmou guardas existentes de cancelamento ao trocar movimento/preferência do sistema; não houve alteração da física ou alegação de ganho de FPS nesta rodada.

### Conforto nas transições e saída pendente — 15/10/2026

Portal e diálogos recebem entrada por opacidade de 160 ms, sem deslocar alvos ou aguardar animação para interagir; seletor alcança também Perfil/Social, que usam portal-view. Regra somente para ausência de preferência de movimento reduzido. Navegador confirmou animação/duração computadas na coleção, no diálogo e no perfil, opacidade final 1, foco do diálogo e largura do documento sem excesso no perfil em 1280 px. Captura portal-polish.png registra composição final; não é prova de FPS ou teste de conforto com participantes.

Corrigido aviso de saída: creatingBook ainda não integra books, por isso não entrava na proteção anterior. Sair agora conserva a sessão e orienta retomar Novo caderno; beforeunload inclui a criação pendente. Autoensaio por assert executa os próprios handlers extraídos do app, verifica recusa antes do logout social, aviso de fechamento e preservação dos casos limpo/edição visual. O navegador pode não oferecer confirmação nativa, especialmente em encerramento móvel; tentativa continua apenas na memória da aba. Sintaxe, CSS processado pelo esbuild e 65 testes aprovados sem skips. Aviso nativo e preferência do sistema não foram alternados no navegador nesta rodada.

### Criação idempotente após resposta perdida — 15/10/2026

Cliente conserva ID, chave e envelopes da criação até a confirmação; Novo caderno retoma a tentativa pendente na mesma aba, inclusive ao reabrir o diálogo. Edições posteriores são encaminhadas pelo autosave após confirmar o pedido original. Servidor registra recibo na tabela existente, atomicamente com caderno/primeira página, e reconhece pedidos iguais concorrentes ou repetidos após salvamento posterior. Reutilizar ID com outro conteúdo ou proprietário recebe 409, sem sobrescrever dados. Sem migração ou dependência nova.

A cópia de conflito também conserva o mesmo caderno entre tentativas; antes de limpar o rascunho original, conclui lotes anteriores e envia as edições adicionais. Tentativas pendentes ficam só na memória da aba: recarregar ou fechar exige conferir a coleção antes de criar de novo. Testes cobrem concorrência SQL, isolamento, alteração de pedido, resposta perdida após commit real, repetição após autosave e decifragem das notas reabertas. Validação: 65 testes passaram sem skips, incluindo PostgreSQL; sintaxe de 51 arquivos aprovada. Ensaio posterior no navegador com PostgreSQL: primeira resposta de criação truncada após commit, erro exibido e formulário liberado; fechar/reabrir conserva nome e avisa sobre tentativa pendente. Segunda tentativa com nome revisado abre o caderno com Salvo. Assert externo confirmou dois POSTs, um único caderno e metadados decifrados com o nome revisado na revisão 2. Registros fictícios removidos; captura creation-retry-confirmed.png registra a coleção resultante.

### Criação protegida durante espera — 15/10/2026

Reproduzido em navegador com PostgreSQL e atraso de seis segundos: Escape fechava Novo caderno durante o envio, permitindo iniciar outra operação enquanto a primeira continuava. Agora o formulário fica inert, o diálogo informa aria-busy e o botão mostra Criando caderno…; cancelamento e submissão repetida ficam bloqueados. Finalmente libera o formulário tanto no sucesso quanto no erro, mantendo os campos em caso de falha. Organização/edição reutiliza a mesma guarda, sem alterar formato cifrado ou persistência.

Ensaio antes/depois confirmou fechamento antecipado na versão anterior e diálogo aberto/ocupado até a conclusão na corrigida. Conferência por assert contabilizou duas tentativas e dois cadernos persistidos; os registros fictícios foram removidos. O caminho de erro não foi ensaiado no navegador nesta rodada. A limitação de repetição após timeout foi tratada na entrada seguinte sobre criação idempotente.

### Teclado e identificação dos diálogos — 15/10/2026

Corrigido Ir para o conteúdo: antes apontava para o portal oculto na entrada e alterava o fragmento usado pela navegação. Agora foca o painel de autenticação ou main conforme a tela visível, sem mudar URL/histórico. Destinos têm tabindex negativo, sem acrescentar paradas à sequência normal. Criação/edição de caderno, desbloqueio, versões e recuperação de rascunhos receberam aria-labelledby ligado ao título; todos os diálogos têm nome resolvido no DOM.

Navegador confirmou Enter no atalho, próximo Tab no e-mail, foco em main com rotas #notebook/#library preservadas, abertura de Novo caderno por teclado, foco contido e Escape retornando a new-notebook. Essa conferência de teclado/DOM não substitui teste com leitor de tela real.

### Falhas de comunicação compreensíveis — 15/10/2026

O cliente HTTP compartilhado por autenticação, recuperação, social e cadernos traduz falha de conexão, timeout e resposta não JSON/incompleta para mensagens em português. Mantém status HTTP e causa técnica, rejeita JSON sem objeto e não reproduz HTML/respostas internas nas mensagens. Timeout durante leitura também é reconhecido; não indica que a operação foi desfeita nem repete requisições automaticamente. Salvamento conserva o lote idempotente existente e o rascunho pendente. Teste cobre queda de rede, timeout antes/depois dos cabeçalhos, HTML de proxy 401/502, JSON inválido, erro de API e resposta válida. Verificação: build e sintaxe de 51 arquivos aprovados; 64 testes passaram, sem skips, incluindo PostgreSQL e preservação do lote após timeout.

### Continuidade da recuperação — 15/10/2026

A tela de nova senha oferece Solicitar outro link sem fechar o diálogo: troca para e-mail, limpa senhas/token e mantém o foco no campo correto. Durante envio, essa ação e o fechamento ficam bloqueados; após sucesso, só resta Entrar. Fechar por Cancelar ou Escape também limpa os campos. Teste do controlador cobre confirmação divergente, erro de link expirado, troca durante envio, nova solicitação e conclusão sem manter senhas no formulário. Validação: 63 testes aprovados sem skips, sintaxe de 51 arquivos e navegador confirmando a transição para e-mail no mesmo diálogo.

### Recuperação por Resend e ensaio de restauração — 15/10/2026

Implementado Esqueci a senha da conta → solicitação genérica → link de 30 minutos → nova senha → revogação de sessões e novo login. Resend HTTP usa fetch nativo, chave e remetente no ambiente, sem dependência adicional. Migração 003 guarda somente hash do token e consumo atômico; nova emissão invalida anteriores, com três emissões por conta/hora e limite de autenticação por IP. Login e redefinição compartilham bloqueio do usuário para evitar sessão criada com senha antiga após troca concorrente. Chaves e envelopes dos cadernos permanecem intactos.

Verificação: build aprovado, sintaxe de 50 arquivos JavaScript e 62 testes aprovados, sem skips, incluindo PostgreSQL, expiração, repetição, consumo concorrente, revogação, provedor simulado e recuperação desativada. Navegador conferiu solicitação genérica, abertura por fragmento com remoção da URL e tela de nova senha em 320 px. Credenciais novas não foram digitadas pelo navegador; troca completa coberta pela API de ensaio.

check-backup.js executou pg_dump/pg_restore em dois bancos temporários próprios com as três migrações, comparou tabelas e dados sociais fictícios e decifrou o conteúdo restaurado. Dados reais não foram alterados. Não configura backup automático de produção.

Pendências operacionais: configurar RESEND_API_KEY, RECOVERY_FROM e PUBLIC_ORIGIN; validar entrega real/domínio HTTPS e backup da hospedagem. Envio atual roda em memória, sem fila durável; falha ou reinício exige nova solicitação. Não existe recuperação administrativa da senha de conteúdo.

### Saída com rascunhos sociais — 15/10/2026

Corrigida a ordem de saída: rascunhos sociais são confirmados antes de chamar logout, operações em andamento impedem a saída e novas consultas ficam suspensas durante o encerramento. O portal fica inerte enquanto conclui o salvamento; falhas restauram a interação sem descartar os textos. Os rascunhos só são limpos após sucesso da saída, evitando um aviso tardio de beforeunload depois da sessão encerrada. Teste de regressão cobre cancelamento, suspensão, erro de operação, rascunhos de publicação/mensagem e limpeza final. Navegador: prévia preserva o texto após cancelamento e retorna à entrada quando sai sem rascunho.

### Revisão de lançamento — 15/10/2026

Build e 58 testes aprovados, sem skips, incluindo PostgreSQL e social. Conferência atual no navegador: caderno em 390 px sem transbordamento horizontal; ferramentas Texto acessíveis, retorno à coleção e retomada pela home; data vazia em leitura sem formato/ícone; título vazio com altura zero. Cadastro em 320 px conserva rolagem e campos. Navegação da capa às duas páginas e contracapa concluída, com lombada espelhada corrigida e sem erros/avisos no console dessa aba. A inspeção usa dados fictícios da prévia; não comprova teclado virtual, toque físico, outros motores de navegador ou implantação HTTPS. Domínio/proxy, backup e restauração reais e operação do social seguem pendentes conforme desenvolvimento.md.

### Lombada da capa costurada — 15/10/2026

A lombada usa a cor da própria capa com relevo neutro e acompanha sua espessura até a base. Isso cobre a faixa clara das folhas sob a encadernação e elimina o tom marrom fixo em capas pretas. Contracapa mantém o espelhamento; corrigido o raio dos cantos, que era invertido duas vezes pela combinação de border-radius e scaleX. Espiral e capa flexível preservam seus acabamentos.

### Iluminação contínua no topo — 15/10/2026

Removidos o degradê próprio do cabeçalho do caderno e seu fundo noturno, que produziam uma faixa retangular sobre a mesa. O topo passa a receber a iluminação ambiente contínua da cena, preservando os fundos dos controles.

### Folhas sem título obrigatório — 15/10/2026

Removido o convite Dê um título à sua ideia. Campo vazio não ocupa espaço na folha fora de foco; títulos existentes continuam visíveis e editáveis. O título permanece opcional e acessível pelo teclado ou pelo comando Topo da folha, sem alterar dados salvos.

### Data discreta na folha — 15/10/2026

Campo de data sem ícone de calendário e sem indicação mm/dd/yyyy quando vazio e fora de foco. Os segmentos nativos aparecem ao editar pelo teclado; datas preenchidas, validação, histórico e faces da virada mantêm o funcionamento anterior.

### Capa sem botão — 15/10/2026

Removido o botão interno Abrir caderno/Voltar às anotações da capa e contracapa. A abertura continua pelas bordas e pelos controles de navegação de páginas.

### Luz sobre imagens da capa — 15/10/2026

O brilho, o sombreado e a textura do material passam a uma camada sobre capa, texto e PNG, em vez de ficarem atrás da imagem no fundo. A textura recebe a mesma escala e continuidade em toda a superfície, inclusive sobre fundos opacos pretos; a opção Sem textura também desliga o grão nessa camada. A camada ignora eventos do ponteiro, acompanha capa/contracapa e é clonada na virada; imagem original e controles de edição permanecem preservados.

### Miniaturas da coleção — 15/10/2026

Capas com imagem usam título legível de 14 px, limitado a duas linhas no topo. Número decorativo e matéria ficam ocultos nessa miniatura para evitar texto minúsculo e liberar espaço para a ilustração. As coordenadas salvas da imagem e as capas sem imagem são preservadas; o nome completo continua no nome acessível do botão.

Removida a linha horizontal acima da contagem de páginas na prévia das capas, preservando contagem, imagem e espaçamento.

### Social e refinamentos para publicação — 14–15/10/2026

Escopo social confirmado pelo proprietário: publicações, amizades e conversas no lançamento. Migração 002 e API persistem cópias revisadas de texto, busca por nome sem e-mail, convites/aceite/remoção, bloqueio e mensagens somente entre amizades aceitas. Feed/histórico paginados, limites por remetente e reenvio idempotente. Bloqueio interrompe acesso ao contato; notas cifradas nunca são publicadas implicitamente. Mensagens ficam legíveis ao servidor, com aviso explícito na interface.

Folhas recebem campo de data opcional no payload cifrado, sem preencher dados antigos retroativamente; histórico e undo/redo preservados. Removidas divisórias extras no topo/rodapé, pauta com espessura mínima visual de 1 px, guarda durante arraste de capa sem título/contador da primeira página. Zoom/enquadramento animados com cancelamento por interação e respeito a movimento reduzido. Fontes ampliadas para sete; sete papéis, seis paletas e sete mesas opcionais mantêm o padrão marrom/creme anterior.

Correção adicional de tinta: a CSP bloqueava a cor inline na leitura Markdown. O HTML agora preserva apenas o atributo hexadecimal validado; JavaScript aplica a variável de cor pelo mesmo helper em leitura, editor visual e faces da virada, sem liberar CSS arbitrário nem enfraquecer a CSP. Aplicação idempotente evita mutações repetidas no editor. Editar o título atualiza imediatamente a disponibilidade de desfazer/refazer; antes, o botão podia continuar desabilitado até outra ação. Conferido no navegador: tinta #9a3424 aparece como rgb(154, 52, 36) na leitura e na edição.

Servidor preparado para origem pública HTTPS, cookie Secure, HSTS, restrições de frames/permissões e timeouts. Concorrência de scrypt limitada antes de saturar recursos; encerramento por sinais fecha servidor e pool. Migrações são versionadas em ordem e preservam dados existentes. Configuração/limites da hospedagem documentados em desenvolvimento.md. Sem dependências novas.

Verificação de 15/10: build e 58 testes passaram, sem skips, incluindo PostgreSQL, isolamento social, paginação do histórico, repetição na cota, bloqueio, data cifrada, câmera e proxy confiável. Ensaio visual confirmou cadastro, login/desbloqueio, publicar texto literal sem executar HTML, enviar/aceitar convite, enviar/reabrir conversa e controles sociais de 44 px no celular, sem transbordamento horizontal. Campo de envio permanece visível no desktop. Contas fictícias de UI foram removidas após o ensaio. Arraste curto/confirmado de capa, data/desfazer, novas fontes, zoom e cores foram conferidos; documento permanece sem rolagem no desktop. A validação de domínio/TLS, topologia de proxy, backups reais e toque físico depende do ambiente de lançamento.

### Entrada, home e estantes — 12/10/2026

Login/cadastro e navegação reconstruídos em madeira, marrom e creme, com ilustrações próprias. O fluxo real é cadastro ou login → desbloquear conteúdo → Início, com três destinos centrais: **Perfil, Estantes e Social**. O último caderno pode ser retomado por um botão explícito. Cabeçalho, formulários, diálogos, coleção e estados vazios seguem a identidade quente do editor, com foco por teclado e movimento reduzido.

Estantes permitem criar cadernos, agrupá-los em até 12 estantes por caderno, filtrar pelo nome da estante, buscar, favoritar e reabrir para ler/escrever. Capas da coleção refletem personalização existente. Perfil mostra dados da conta, contagens e acesso às métricas atuais. Social apresenta feed, busca de pessoas e conversas como interfaces **em construção**, sem publicar cadernos nem simular usuários/mensagens reais.

PostgreSQL, sessão e criptografia existentes foram preservados: senha da conta para autenticação, senha de conteúdo usada no navegador para desbloquear a raiz e AES-GCM para notas/metadados/capas/estantes. Integração ampliada cobre sair, entrar novamente, rejeitar senhas incorretas e recuperar os dados após desbloquear novamente. Nenhuma dependência ou migração nova. `/?preview=1` permanece sem persistência; use a entrada sem esse parâmetro para criar sua conta real.

Validação: build e sintaxe aprovados; 45 testes passaram, sem skips, incluindo PostgreSQL real. Navegador conferiu criação de caderno, duas páginas escritas, filtro por estante, perfil, seções sociais e voltar pelo histórico, além do layout em 390×844. Cadastro/login completos foram conferidos na integração SQL/API; credenciais reais não foram preenchidas no ensaio visual. Recuperação de conta, backup operacional, backend social e publicação em produção permanecem pendentes.

### Caderno como objeto sobre a mesa — 12/10/2026

Prévias de guardas/versos vazios ocultam os contêineres reais do editor visual e da leitura Markdown. Ao arrastar uma folha, o conteúdo antigo fica apenas na face que está virando, sem reaparecer sobre a guarda até concluir a animação. Arraste confirmado/curto e leitura Markdown conferidos no navegador.

Ao reduzir a folha de grande para média/pequena, a altura é medida novamente sem conservar o maior tamanho anterior. As guardas descartam a capacidade da página que ocupava aquele lado; folhas e capas acompanham a altura comum atual. O rodapé permanece na base, inclusive com capacidades diferentes entre páginas. Conteúdo maior conserva espaço e a paginação existente continua sem cortar texto. 45 testes e sintaxe aprovados.

Viradas refinadas: aceleração/desaceleração suaves, sombra sincronizada ao ângulo e continuação do arraste sem final instantâneo. Prévia e página usam a mesma diagramação do editor; a superfície estacionária preserva seu DOM. Capas conservam acabamento durante o movimento e ferramentas aparecem depois de pousar. Limpeza idempotente em conclusão/interrupção; 44 testes e sintaxe aprovados. Detalhes em [design-templo.md](design-templo.md).

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

Build aprovado, sintaxe de 33 arquivos e **32 testes aprovados**, sem skips, incluindo PostgreSQL real e ciclo de pausa/fallback do efeito. Ensaio na prévia conferiu capa/contracapa, modelos, Alt+2/Alt+L, undo/redo, página nova, shader ativo/desligado, ajuste de largura e layout em 320/768 px. A prévia em [127.0.0.1:8006](http://127.0.0.1:8006/?preview=1) não salva. Evidência em `tmp/library4-cover-polished.png`. Não há linter configurado. A virada continua articulada, sem curva física contínua; FPS/GPU/bateria e teclados físicos diversos não foram medidos. Referências e detalhes em [direção artística](design-templo.md).

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

Verificação: 27 testes sem falhas/skips, sintaxe de 31 arquivos, 17 fluxos em Edge headless com PostgreSQL real, quatro grupos de UI em 320/768/1360 px e ensaio visual de formatação/undo, capas, Ctrl, ponta arrastável, colagem segura, erro de exportação e paginação/composição simulada. Referências, limites e plano em [direção artística](design-templo.md) e [passo a passo](passo-a-passo.md). Sem linter configurado. Aparelhos físicos, IME/teclado virtual reais, bateria e conforto prolongado permanecem sem ensaio.

### Luz, papel e controles — revisão de 10/10/2026

Pauta, pontilhado e quadriculado cobrem toda a folha, incluindo margens, cabeçalho e rodapé. A área de edição/leitura é transparente; a pauta acompanha a origem da escrita. A iluminação é uma camada visual suave sobre mesa, capa e folhas, sem filtros sobre o texto, mudança de conteúdo ou bloqueio de interação. Dia/noite/luz amarela continuam preferências privadas por caderno.

Escrever/Ler ficam diretamente no cabeçalho. Quatro acessos substituem o menu único: **Índice** (busca, páginas e lembretes), **Texto** (tamanho da página/letra, Markdown, undo/redo e estilo da seleção), **Zoom** (80–140%, centralizar, cursor, uma/duas folhas e movimento), **Caderno** (materiais, ambiente, versões, padrão, edição e foco). Abrem por clique/toque/teclado, um por vez; Escape ou clique fora fecha. A posição e o “+” continuam na navegação inferior. As descrições das rodadas anteriores abaixo são históricas; esta organização é a atual.

Zoom → Mover com o mouse habilita arraste esquerdo; o acesso passa a indicar “Movendo”. Escape, Escrever ou Voltar à escrita desativa o modo. Arraste direito, setas quando o enquadramento tem foco, rolagem e pinça nativas continuam disponíveis. O modo Mover é temporário; zoom e aparência seguem o salvamento existente. Sem nova dependência nem mudança de SQL/criptografia. Referências e decisões em [direção artística](design-templo.md#revisão-de-luz-papel-e-controles--10102026).

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

Um rascunho local inválido deixa um aviso e permanece preservado, enquanto os demais são recuperados normalmente. Esta rodada passou 18 testes (PostgreSQL real incluído), sintaxe de 26 arquivos e onze fluxos automatizados no navegador, incluindo persistência de organização, falha/retry e um registro local adulterado junto a um válido. O [controle do plano original](passo-a-passo.md#plano-original-controle-de-escopo--10102026) separa entregas parciais e pendências: progresso diário, ambientação, publicação/whitelist e social continuam previstos.

Versão desta rodada: [127.0.0.1:8004](http://127.0.0.1:8004/?preview=1), pois a 8003 está ocupada por outra instância. Rascunhos/padrão pessoal do navegador são separados por porta; os cadernos confirmados no PostgreSQL permanecem na mesma conta.

### Atualização ampla: escrita e ambiente

No modo Escrever, selecione um trecho e abra **⋯ → Estilo do trecho selecionado** para escolher fonte, tinta e tamanho; a amostra antecipa as escolhas. Aplicar grava uma extensão segura do Markdown (`{{serif;rust;20|texto}}`), e **Ler** mostra sua aparência. Remover estilo e undo/redo mantêm o texto; recarregar/desbloquear recupera a marcação cifrada. Esta primeira versão aceita texto literal de uma linha, sem chaves ou Markdown interno; selecionar o marcador inteiro permite mudar/remover o estilo. Outros leitores de Markdown exibem a extensão como texto até convertê-la; exportação ainda não está implementada.

**Modelo** alterna capa costurada, espiral e agenda flexível. **Papel e ambiente** oferece linhas, liso, pontos ou grade, madeira clara/escura/linho e luz amarela/janela/noite. As opções acompanham o caderno no autosave criptografado, sem alteração SQL. A fonte manuscrita depende das fontes do sistema, com fallback cursivo; nenhuma fonte externa foi instalada.

Enter continua listas/checklists/números/citações e preserva indentação de código cercado. Enter num item vazio encerra a lista; Shift+Enter e Tab mantêm comportamento nativo. O índice busca texto/títulos do caderno aberto localmente; clicar na contagem inferior permite ir direto a uma página. A prévia é renderizada somente ao ler, e digitação curta evita reconstruir índice/lembretes e outras folhas.

O lembrete opcional, inicialmente desligado, aparece após cerca de 45 minutos de caderno visível, incluindo leitura. Pausa com a aba oculta/fora do caderno, permanece até dispensar e reinicia ao abrir um caderno/recarregar. Não bloqueia ações nem mede horas efetivas de estudo.

Verificado: 29 arquivos com sintaxe válida, 23 testes sem skips e 16 fluxos automatizados em Edge headless, com PostgreSQL real, estilos/preferências persistentes, undo, busca/salto e 320 px. Ensaio local final de 50 entradas num bloco de código longo: média de 0,95 ms, maior amostra de 2,30 ms para atualização síncrona; não é medição de INP/FPS ou garantia em hardware físico. Timer coberto com relógio simulado. Evidências e limites no [andamento](passo-a-passo.md).

