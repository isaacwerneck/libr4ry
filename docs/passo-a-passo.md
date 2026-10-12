# Passo a passo da reconstrução — Library4

Este documento reúne andamento e critérios históricos. Para instruções atuais, consulte o [guia de uso](uso.md); para executar e verificar o projeto, consulte [configuração e desenvolvimento](desenvolvimento.md). O [índice](README.md) organiza toda a documentação.

## Entrega: portal e uso privado real — 12/10/2026

1. Reconstruídos login/cadastro e navegação na paleta de madeira/papel; Início após desbloqueio com Perfil, Estantes e Social. Retomada explícita e histórico do navegador preservados.
2. Estantes mantêm criação, busca, favoritos, organização e reabertura; grupos têm filtros diretos acessíveis. Perfil usa dados reais e métricas; Social oferece interfaces de feed/pessoas/conversas sinalizadas como futuras.
3. Preservados banco, sessão, autosave e envelopes privados existentes; integração ampliada cobre login incorreto, sair/entrar, desbloqueio incorreto e recuperação de notas, capas e estantes.
4. Build, sintaxe e 45 testes aprovados, sem skips; prévia ensaiada com criação, escrita em duas páginas, filtro de estante, rotas e layout em 390×844.

Próximas etapas continuam separadas: recuperação de conta/chaves, backup operacional e implantação; depois backend social, amizades, compartilhamento explícito e mensagens. A interface pronta não significa que essas integrações estejam entregues. Detalhes em [portal de biblioteca](design-templo.md#portal-de-biblioteca--12102026).

## Correção entregue: capa e folhas sem salto — 11/10/2026

1. Capa/contracapa passam a acompanhar geometria da primeira/última folha, recalculada em zoom, resize e capacidade; removidos largura/proporção independentes.
2. Abertura preserva espaço das ferramentas e rolagem; cópia animada usa a origem do destino. Dupla corresponde a duas folhas do mesmo tamanho da capa individual.
3. Formatação sobreposta em até 1100 px evita mudanças de altura da cena; estado fechado mantém espaço do controle, com acesso bloqueado por inert/visibilidade.

35 testes e sintaxe aprovados; ensaio de abertura em 100/40%, retorno à capa, dupla/contracapa e 320 px com medidas/rolagem preservadas. Sem biblioteca, SQL ou formato novos. Toque físico e curva contínua seguem pendentes. Detalhes em [abertura contínua](design-templo.md#abertura-com-geometria-contínua--11102026).

## Correção entregue: zoom e movimento global — 11/10/2026

1. Ampliada faixa para 10–800% em controle, roda e preferência; passos proporcionais da roda e largura lógica estável de folha/capa.
2. Movimento passa a iniciar na mesa inteira, deslocando X/Y sem afetar ferramentas; Ctrl/soltura, Escape, exclusão de painéis e caderno oculto preservam demais fluxos.
3. Centralizar/Ajustar largura recupera ambos os eixos; caderno reduzido centralizado, sem caixa intermediária de recorte.

34 testes e sintaxe aprovados; prévia ensaiada a 10/168/800%, arraste fora da folha e proporção lógica estável. Sem biblioteca, SQL ou formato novos. Não prometer zoom infinito, desempenho universal ou toque físico validado. Detalhes em [manipulação da mesa](design-templo.md#zoom-e-manipulação-da-mesa--11102026).

## Correção entregue: bordas e enquadramento — 11/10/2026

1. Ampliadas áreas de arraste para as quatro bordas externas, com direção pelo gesto, preservando seleção, clique/teclado nas laterais e cancelamento.
2. Removidos recorte e rolagem internos; deslocamento horizontal passa a mover o caderno na cena. Ctrl/Mover tem prioridade, Centralizar recupera posição e folhas altas usam a rolagem normal.
3. Retirado retorno automático ao topo entre folhas; gesto mantém enquadramento. Removido ⌟, redundante com bordas laterais inteiras.

Sintaxe de 34 arquivos e 34 testes aprovados, incluindo banco real; ensaio da prévia com bordas superior/inferior/lateral, arraste curto e Mover sem virar. Sem mudança de dependência, SQL ou criptografia. Toque físico e curva contínua seguem pendentes. Detalhes em [bordas e enquadramento](design-templo.md#bordas-da-folha-e-caderno-livre-na-mesa--11102026); entradas anteriores registram o histórico.

## Complemento entregue: escrita, seleção e pontas — 11/10/2026

Revisados os três pontos combinados: entrelinha 1,75, seleção legível e persistente ao usar ferramentas do editor visual, acesso ⌟ à ponta real da folha ativa. Preservados texto, fontes e navegação; decoração não entra no Markdown. Corrigidos clique residual após Escape e limpeza do retorno; escrita visual também cancela movimentos. Sem novas dependências ou alterações de SQL/criptografia.

Critério de etapa: escrever/formatar, navegar e cancelar sem perder conteúdo ou deixar cópias. Build, sintaxe de 34 arquivos e 34 testes aprovados; ensaio da prévia com escrita nova, Ctrl+A/fonte, leitura, folha grande, arraste curto, Enter, duas folhas e 320 px. Cancelamento por Escape/perda de captura coberto em unit test. Fluxos e limites em [clareza da escrita](design-templo.md#clareza-da-escrita-e-acesso-às-pontas--11102026). Ensaios de aparelhos/participantes continuam pendentes.

## Entrega: capa e rodada de experiência/VFX — 11/10/2026

1. Corrigida capa horizontal e faixas soltas: proporção 3:4, lombada integrada, sombras próprias, espessura inferior alinhada; capa/contracapa preservam fluxo de navegação.
2. Simplificados títulos/lista para Alt+1/2/3 e Alt+L, mantendo botões e compatibilidade; cursor do histórico restaurado em posição válida do documento.
3. Virada com sombra variável, verso texturizado e indicação de ponta; capa rígida sem dobra de papel. Preservados cancelamento, botões e movimento reduzido. Curva contínua ainda pendente.
4. Materiais/luz localizada estáticos refinados, transição entre luzes, parágrafos/listas mais próximos; ajustes base recolhidos, aparência compacta e botão Ajustar largura.
5. Experimento de luz WebGL opt-in, buffer limitado, pausa por visibilidade/movimento e fallback explícito; testes de ciclo de recursos. Não afirmar ganho de desempenho: medição em hardware físico permanece necessária antes de ampliar o efeito ou ativá-lo por padrão.

Build e sintaxe aprovados; 32 testes sem skips, incluindo banco real. Ensaio da prévia: capas/modelos, atalhos, histórico, escrita nova, shader compilado/modo off, enquadramento e larguras 320/768 px. Não mudou SQL, formato de conteúdo ou criptografia; preferência ambiental é privada. Detalhes/limites em [direção artística](design-templo.md#capa-ferramentas-e-luz-viva--11102026). As rodadas datadas de 10/10 abaixo são históricas. Próximo trabalho exige calibrar desempenho/uso real e comparar uma virada com curva contínua antes de escolher uma implementação mais complexa.

## Entrega: atalhos e paleta RGB — 10/10/2026

Atalhos B/I, títulos, lista e undo/redo centralizados, botões mantidos com dicas; Shift+C contextual e Mais cores abrem paleta pronta/HEX/RGB/seletor. Seleção capturada antes da paleta, validada antes da aplicação, foco devolvido ao fechar; cor validada persiste na extensão Markdown privada e reimporta sem perder B/I. Corrigido `pre-wrap` do editor. Build/sintaxe e 29 testes aprovados, mais ensaio manual na prévia. Fluxos, limitações e evidência em [atalhos e seleção de tinta](design-templo.md#atalhos-e-seleção-de-tinta--10102026). Sem novas dependências, alterações SQL ou mudanças na criptografia. VFX continuam na próxima rodada, não entregues aqui.

## Próxima rodada: experiência e VFX — 10/10/2026

Ensaio manual na prévia com duas páginas novas, formatação/lista/undo, papel/materiais/luz, uma/duas folhas e arraste da ponta. Resultado e fontes em [ensaio de uso e prioridades de VFX](design-templo.md#ensaio-de-uso-e-prioridades-de-vfx--10102026). Não houve implantação de efeitos nesta rodada.

1. Investigar aviso de `white-space` do ProseMirror; conferir quebras, espaços, seleção e colagem, sem alterar notas silenciosamente.
2. Refinar virada: sombra da dobra, verso, contato e indicação da ponta; preservar confirmação/cancelamento, botões, teclado e redução de movimento. Comparar visualmente antes de decidir por curva contínua.
3. Refinar materiais e luz localizada com camadas estáticas; conferir texto/pauta/contraste e transição entre presets.
4. Reduzir ocupação dos painéis e facilitar enquadramento das duas folhas; validar edição, seleção e acesso por toque/teclado sem perda de funções.
5. Medir custo com efeitos ligados/desligados. Só então experimentar shader ambiental opcional com fallback; texto permanece DOM e caderno continua prioritário. Não adicionar dependências sem aprovação.

Cada entrega deve incluir evidência visual e verificação de escrita/navegação/cancelamento. Usabilidade com participantes, hardware físico, GPU/FPS e bateria seguem pendentes; a sessão de prévia não verificou persistência real.

## Plano da revisão integrada do caderno — 10/10/2026

Solicitação atual: escrita visual sem sintaxe aparente, ferramentas laterais diretas, acabamento ilustrado coerente, personalização separada, Ctrl+roda/Ctrl+arraste, virada pela ponta e navegação por capa/contracapa. Tiptap, suas extensões e esbuild aprovados pelo proprietário nesta conversa.

1. Integrar editor visual ao Markdown privado existente, preservar fonte de notas não editadas, estilos antigos, listas/código/tabelas, IME, undo e paginação sem descarte. Manter acesso explícito à fonte para compatibilidade e edição avançada.
2. Organizar ferramentas recorrentes numa faixa lateral: formatação, fonte/tinta/tamanho e undo diretos; navegação e aparência separados. Rótulos acessíveis, foco, toque e movimento reduzido obrigatórios.
3. Corrigir contornos/espessura inferiores, proporção e costura dos modelos; acrescentar cor e acabamento da capa em preferências cifradas. Arte CSS própria, sem copiar Minecraft.
4. Unificar zoom/arraste com Ctrl somente dentro do caderno; soltar Ctrl encerra o gesto. Manter botões, teclado e pinça nativa como alternativas.
5. Acrescentar capa inicial e contracapa como estados visuais, sem páginas falsas nem contagem de produção. Retomada de estudo preservada. Ponta arrastável com confirmação/cancelamento e navegação equivalente por botão/teclado.
6. Validar edição/formatação, seleção, undo/redo, colagem segura, persistência e recuperação, 320/768/1360 px, capas, viradas e gestos. Registrar entregas reais e limitações abaixo; não tratar este plano como implementação concluída.

Base: [proposta](proposta.md), [requisitos](requisitos-funcionais.md) e [banco SQL](banco-de-dados.md). Sequência de trabalho, sem estimativa de prazo inventada. Cada etapa termina com um resultado verificável antes da seguinte.

## Entrega da revisão integrada do caderno — 10/10/2026

1. **Escrita visual:** Tiptap/extensões aprovadas, bundle local via esbuild. Renderizar fonte segura → editar documento visual → exportar Markdown → paginação/autosave/AES-GCM existentes. Notas não editadas conservam fonte; editar normaliza sintaxe/espaços. Estilos antigos literais reaparecem; nova marca restrita preserva negrito/código internos. Fonte avançada permanece acessível. Formatação tem ações de undo separadas; Ctrl+B/I/Z/Y e Shift+Z mantêm alternativas de teclado.
2. **Ferramentas:** faixa direta no desktop com estado ativo e pequenos efeitos de hover/pressionamento. Fontes/tintas/tamanho da seleção ficam separados dos ajustes da folha. Em até 600 px começa recolhida e abre faixa contida; outros painéis continuam exclusivos/Escape. Aparência, versões, busca, lembretes, rascunhos e foco continuam acessíveis.
3. **Acabamento:** camadas inferiores alinhadas, materiais CSS próprios, cor hexadecimal validada, couro ilustrado/tecido/liso. Preferências e miniaturas acompanham a mesma aparência cifrada; não foi acrescentada migração SQL.
4. **Manipulação:** Ctrl+roda dentro do caderno atualiza zoom limitado e preferência; Ctrl+arraste esquerdo desloca rolagem até soltar o modificador. Botões, Mover opcional, clique direito simples e rolagem normal preservados.
5. **Virada/capas:** ponta arrastável mostra progresso, confirma com 25% ou retorna. Virada continua do ângulo atual; redução de movimento prevalece. Capa inicial e contracapa acessíveis pela navegação, sem páginas falsas; retomada recente abre notas. Curva contínua e capas autorais complexas não estão implementadas.
6. **Proteção:** colagem externa usa texto, não HTML. Composição adia divisão/troca de layout até confirmação. Erro de exportação conserva texto visual, apresenta pendência e bloqueia navegação/logout; desfazer restaura o último modelo sincronizado. Confirmação remota e proteção local continuam usando os critérios anteriores.

**Verificação:** `npm run build`, `npm run check` (31 arquivos), `npm test` (27 aprovados, zero falhas/skips), 17 fluxos em Edge headless/PostgreSQL real, quatro grupos de UI e ensaio visual de formatação/undo, capas, Ctrl, ponta, falha sem perda, colagem e composição/paginação. Evidências em `tmp/library4-new-cover.png`, `tmp/library4-new-editor.png`, `tmp/library4-ui-mobile.png`; fixtures usam conta própria descartável. Sem linter configurado. Hardware físico, teclado virtual/IME reais, uso longo e bateria seguem necessários.

**Execução:** `npm start`/`npm run dev` empacotam o editor antes de iniciar; alterar o entrypoint exige novo `npm run build`. Bundle gerado e ignorado pelo Git, sem CDN. Prévia desta rodada: `http://127.0.0.1:8006/?preview=1`, porque 8005 continua ocupada por processo anterior; nenhum processo desconhecido foi encerrado. Aguardar “Salvo” antes de trocar de porta; rascunhos/padrão locais são separados por origem. Pesquisa e limites em [direção artística](design-templo.md#escrita-visual-ferramentas-laterais-e-acabamento--10102026).

**Continuação do plano original:** validar conforto com o proprietário/aparelhos; padrão entre dispositivos, produção diária privada, coleção/estantes e fechamento operacional; depois publicação/whitelist e social. A autorização desta revisão não representa entrega desses recursos futuros.

## Plano original: controle de escopo — 10/10/2026

Revisão atual: pauta ocupa a folha inteira e luz alcança mesa/caderno. Menu único substituído por Índice/Texto/Zoom/Caderno com Escrever/Ler diretos; Zoom oferece arraste esquerdo opcional. Funcionalidades, formatos privados e plano original preservados. Fluxos e pesquisa em [direção artística](design-templo.md#revisão-de-luz-papel-e-controles--10102026), uso em README. Validado com 24 testes, 29 arquivos de sintaxe, 16 fluxos de regressão e quatro verificações adicionais de UI em Edge headless. Continuar com observação de uso real e aparelhos físicos antes de prometer conforto ou desempenho universal.

A autorização para prosseguir abrange o plano completo, em entregas verificáveis. Caderno e conforto continuam prioritários; social permanece em uma área separada. Não converter recomendações, protótipos ou testes em alegação de produto concluído.

| Frente combinada | Entregue até aqui | Continuação necessária |
| --- | --- | --- |
| Caderno alto, uma/duas folhas, tamanhos e continuação | Folhas editáveis, 24/36/48 linhas de referência, fonte por página, divisão preservando blocos, tamanho inicial na criação | Paginação de parágrafos/estilos, representação do caderno dobrado, estudo longo e aparelhos reais |
| HUD discreto e enquadramento | Menu recolhível, foco, índice com busca de texto, salto pelo número, zoom, arraste, centralizar e retorno ao cursor | Refinar gestos e testar teclado virtual/pinça físicos |
| Arte original e movimento | Papel, capa, madeira, lombada e virada com frente/verso e ponta articulada | Curva contínua, novos acabamentos/modelos e desempenho medido; sem copiar Minecraft |
| Escrita e personalização | Markdown seguro, atalhos, undo/redo, continuação de listas/código, fonte/cor/tamanho por trecho de uma linha, quatro pautas, capa costurada/espiral/agenda flexível e fontes do sistema | Estilos internos/multilinha, acabamento dos modelos, estampas/adesivos, exportação e importação |
| Salvamento e continuidade | Autosave, versões, conflitos/cópia, snapshots cifrados, retomada em até 24 h, preferências por caderno sincronizadas | Padrão pessoal entre dispositivos, abertura offline, recuperação de login e backup/restauração operacional |
| Coleção e estantes | Várias estantes por caderno, favoritos, recentes e busca por metadados desbloqueados | Estantes vazias independentes, gestão/renomeação coletiva, acabamento da Home com perfil |
| Progresso pessoal | Totais atuais de páginas/palavras/lembretes | Dias de escrita, páginas criadas com conteúdo versus editadas, cadernos usados, gráficos privados; não inventar passado a partir das versões |
| Ambiente acolhedor | Madeira clara/escura/linho e luz amarela/janela/noite por caderno, protegidos pelo autosave | Chuva, ambientação ampliada e padrão entre dispositivos |
| Som, efeitos e descanso | Intensidade/redução de movimento e lembrete opcional dispensável de 45 minutos de caderno visível | Sons ambientes/de escrita e efeitos opcionais; calibrar em aparelhos reais |
| Publicação e whitelist | Modelo privado e isolamento existentes | Publicação explícita/revogação e envelopes de chave por destinatário; amizade não libera conteúdo privado |
| Social separado | Especificação preservada, sem interface simulando recursos disponíveis | Perfis, amigos, estrelas públicas, descoberta, feed de trechos/folhas/cadernos/estantes, conversas e grupos |
| Multimídia e busca ampliada | Busca local de cadernos e texto/título das páginas do caderno aberto | Busca global de páginas, imagens/áudio privados, limites e armazenamento criptografado |

Próxima ordem: consolidar escrita/recuperação → estilos por trecho e padrão sincronizado → produção diária privada → ampliar estantes/Home → ambiente opcional → fechamento operacional do MVP → publicação/whitelist → social. A organização básica foi adiantada por caber no formato cifrado atual sem alterar SQL nem sobrecarregar o editor. Novas dependências continuam exigindo consulta.

## Atualização ampla do caderno — 10/10/2026

1. **Estilos por trecho:** selecionar texto em Escrever → menu → Estilo do trecho → fonte/tinta/tamanho → Aplicar → Ler. Quatro famílias do sistema (incluindo manuscrita), quatro tintas e 14/16/18/20/24 px. Amostra responde às escolhas. Remover estilo e undo/redo preservam o texto. Fechar o diálogo sem aplicar retorna à seleção. Estilos são texto dentro da página cifrada e reaparecem após desbloqueio.
2. **Modelo seguro:** extensão `{{serif;rust;20|texto}}` do Markdown existente, com opções enumeradas, texto literal escapado e classes CSS fixas. HTML bruto continua desativado. Dentro de código a sintaxe permanece literal. Primeira versão aceita um trecho de uma linha sem chaves; Markdown dentro dele é literal, e a extensão não é padrão de outros leitores. Para alterar/remover, selecionar o marcador inteiro; exportação futura deve oferecer fonte com marcadores para roundtrip e texto sem marcadores para Markdown comum. A divisão protege os marcadores inteiros; blocos grandes expandem a folha. Capacidade continua lógica, não medida física das diferentes fontes.
3. **Escrita mais fluida:** Enter continua lista, checklist desmarcada, numeração ou citação; um item vazio encerra a lista. Em código cercado, preserva indentação e não interpreta seu conteúdo como lista. Shift+Enter e Tab permanecem nativos. Cada ação pode ser desfeita pelo histórico da aba. A prévia só é renderizada ao ler; digitação curta atualiza a folha ativa sem reconstruir índice/lembretes/prévia, e o parser de blocos só entra quando há excesso de capacidade.
4. **Material e ambiente:** papel pautado/liso/pontilhado/quadriculado; capa costurada, espiral e agenda flexível com arte própria em CSS. Madeira clara/escura/linho e iluminação amarela/janela/noite. Preferências por caderno acompanham salvamento cifrado, reabertura e padrão pessoal local, sem migrar SQL. Papel segue alto, acessível por rolagem; cores de tinta foram escolhidas para permanecer escuras sobre os papéis.
5. **Encontrar e navegar:** índice busca título/conteúdo das páginas do caderno aberto no navegador, sem enviar consulta ou conteúdo ao servidor. A contagem inferior abre salto por número validado. Escolher resultado leva à folha e fecha o HUD; telas estreitas mantêm página ativa. Undo/redo mostram indisponibilidade quando não há ação na pilha. Navegação fica discreta em mouse e reaparece por hover/foco, mantendo alvos de 44 px.
6. **Descanso opcional:** lembrete desativado por padrão, habilitado por caderno. Relógio monotônico acumula caderno visível, incluindo leitura sem cliques, pausa fora da aba/coleção e permanece até dispensar. Dispensar inicia novo intervalo; abrir caderno/recarregar reinicia o timer da sessão. Não bloquear escrita, não tocar áudio e não tratar tempo visível como horas de estudo ou produção diária.

**Validação:** sintaxe de 29 arquivos, 23 testes aprovados sem skips (PostgreSQL real incluído), 16 fluxos em Edge headless sem erro JavaScript. Fluxos novos: Enter/undo/código, prévia adiada, estilos e persistência/reabertura, modelo/pauta/mesa/luz/lembrete, busca/salto/320 px e digitação em bloco cercado de 60 linhas. Cinquenta entradas no ensaio local final tiveram média de 0,95 ms e maior amostra de 2,30 ms para atualização síncrona; não é INP, FPS, percentil de produção ou garantia em outros dispositivos. Lembrete de 45 minutos é testado com relógio simulado, não por espera real de 45 minutos. Sem linter configurado.

**Evidências:** `tmp/library4-big-update.png`, `tmp/library4-big-update-day.png`, `tmp/library4-big-update-night.png`, `tmp/library4-big-update-mobile.png`, com conteúdo fictício e sem conta real do usuário. Prévia atual em `http://127.0.0.1:8005/?preview=1`, pois processos anteriores mantêm 8003/8004 ocupadas. Acesso real em `/` usa a mesma conta/banco; armazenamento local é separado por porta. Aguardar “Salvo” na aba antiga antes de trocar. Prévia/módulos desta instância também verificados no navegador.

**Continuação:** revisão visual pelo proprietário, estilos multilinha/exportação, padrão pessoal sincronizado, produção diária, dobra contínua e dispositivos físicos. Sons/chuva, social e recuperação/backup operacional não foram implementados implicitamente. A base privada e os testes de conflito/idempotência continuam exigidos em cada evolução.

Base técnica consultada para a extensão: [Ruler oficial do markdown-it](https://markdown-it.github.io/markdown-it/interfaces/Ruler.html), [arquitetura](https://markdown-it.github.io/markdown-it/documents/Architecture.html) e [regras de renderização](https://github.com/markdown-it/markdown-it/blob/master/docs/examples/renderer_rules.md). Implementação validada contra a dependência já instalada; nenhuma biblioteca nova.

## Organização básica e recuperação independente — 10/10/2026

- Fluxo: coleção → Organizar → nomes das estantes/favorito → salvamento cifrado → filtro por estante/favoritos ou recentes. Um caderno pertence a até 12 estantes, com nomes de até 60 caracteres, sem duplicar suas páginas. Normalização Unicode/capitalização reúne nomes equivalentes. Alterar a associação não exclui conteúdo.
- Estantes são associações nos metadados privados do caderno; aparecem quando contêm pelo menos um caderno. Ainda não há entidade independente para guardar estantes vazias ou renomear uma em todos os cadernos. Nenhuma migração SQL necessária. Cadernos antigos assumem lista vazia/favorito falso.
- Busca por nome/matéria/tags/estantes ocorre somente nos cadernos carregados e desbloqueados; não envia consulta ao servidor, não busca conteúdo das páginas e não revela nomes em URLs. Recentes ordena pela última posição capturada, sem fabricar visitas anteriores. Filtros/busca são da aba.
- Favoritar usa o mesmo autosave, revisão e proteção local. A coleção apresenta pendência e, em erro, acesso ao caderno para tentar novamente/preservar cópia. Remover um favorito no filtro correspondente mantém foco no filtro. Abaixo de 480 px, capas usam uma coluna para preservar títulos e alvos de 44 px.
- Criação permite escolher tamanho inicial; o padrão pessoal preenche a opção. Ajustar estantes não redistribui páginas existentes. A criação dentro de uma estante já sugere sua associação.
- Recuperação valida cada rascunho separadamente: registros inválidos são preservados e geram aviso persistente; registros válidos continuam disponíveis. O envio bem-sucedido do rascunho válido não apaga o aviso nem o registro inválido.
- Instância desta entrega em `http://127.0.0.1:8004/?preview=1`; porta 8003 ocupada por instância anterior. Não encerrar processo desconhecido. Armazenamento local de rascunhos/padrão é separado por porta; o conteúdo confirmado usa o mesmo PostgreSQL.
- Verificação: 18 testes aprovados, nenhum pulado, incluindo PostgreSQL real e ausência de nomes de estante legíveis no SQL/respostas; sintaxe de 26 arquivos. Onze fluxos em Edge headless, incluindo recarga/desbloqueio, persistência de estantes/favoritos, busca/recentes, tamanho inicial/criação na estante, estado vazio/foco, 320 px, falha/retry na coleção e recuperação com um registro IndexedDB adulterado ao lado de um válido (aviso/registro inválido preservados após confirmação). Evidências locais descartáveis em `tmp/library4-collection.png` e `tmp/library4-collection-mobile.png`. Sem linter configurado, ensaio com participantes ou hardware físico.

## Andamento real — 07/10/2026

- Projeto antigo e estudos preservados em `tmp/library4-before-rebuild.tar`; substituição autorizada pelo usuário, `.git` preservado.
- Stack HTML/CSS/JavaScript, Node.js, PostgreSQL aprovada; `pg` e `markdown-it` aprovados e instalados. PostgreSQL local separado criado; migração executável aplicada.
- API de contas/sessões, cadernos privados, gravação atômica com revisão/idempotência e consulta de versões implementada. Testes reais de isolamento, conflitos e repetição passaram; criptografia e paginação também.
- Senha de conteúdo separada aprovada e implementada. Cadastro protege raiz no navegador; login abre desbloqueio; senha incorreta falha; recarregar exige a senha novamente. Senha de conteúdo não é enviada nem persistida.
- Interface conectada: criar/editar caderno, páginas, Markdown/prévia, autosave, reabertura, histórico/restauração, metas e métricas atuais. `/?preview=1` permanece uma demonstração separada sem salvamento.
- Autosave usa lote imutável e idempotente; edição durante envio fica pendente. Conflito mantém o rascunho e oferece cópia em outro caderno; logout salva antes de sair. Não há rascunho persistente após crash.
- Cinco testes automatizados passaram, incluindo PostgreSQL real, senha de conteúdo e timeout/edição durante envio. Navegador verificou login, desbloqueio, rejeição de senha incorreta, reabertura, restauração, edição de caderno, leitura Markdown, conflito entre duas abas, cópia do rascunho e logout. Inspeção SQL não encontrou senha de conteúdo/texto legíveis nos envelopes; conta descartável removida.
- Para concluir o MVP: recuperação de login, rascunhos criptografados persistentes, revisão semântica da paginação/validação visual e ensaio operacional de backup. Recuperação da senha de conteúdo por admin não faz parte do modelo.

## Protótipo visual do caderno — 10/10/2026

- Folha única alta, dimensão por capacidade de referência, rolagem da tela e expansão para texto em largura estreita. Papel, capa/lombada e madeira desenhados em CSS, sem usar assets de Minecraft.
- Ferramentas e índice recolhíveis; navegação entre páginas ligada a Web Animations com transform/opacity. Conteúdo continua em HTML editável, sem captura como imagem e sem motor 3D ou dependência nova.
- Completa/leve/desligada, cancelamento ao escrever/navegar e redução de movimento do sistema. A articulação plana ainda não é a dobra curva final.
- A prévia abre duas páginas de demonstração sem persistência; conta real continua usando os envelopes e autosave existentes. Home/social não foram redesenhados nesta rodada.
- Próximas validações: dobra curva com conteúdo dinâmico, duas folhas simultâneas, pan/zoom e medição em hardware modesto. Não prometer desempenho universal.
- Verificado nesta entrega: sintaxe dos 17 arquivos JavaScript e seis testes, nenhum pulado, incluindo PostgreSQL real. Navegador: folha média de 1.232 px numa tela de 720 px, largura de celular de 390 px sem transbordamento horizontal, página grande e texto longo, navegação preservando título editado, transformação efetiva durante virada e troca sem transformação no modo desligado. Console sem erros/avisos no fluxo observado. Não foi medido FPS, consumo de memória ou bateria; redução de movimento foi coberta por teste de lógica, sem mudar a preferência do sistema. Não há linter configurado no projeto.

## Entrega de refinamento R1 inicial — 10/10/2026

- Materiais em CSS refinados: papel mais claro, pauta/margem suaves, espessura em camadas, lombada com costura decorativa e madeira com menor contraste. Folha continua alta e rolável. Sem assets externos ou dependência nova.
- Ferramentas abre por mouse e recolhe ao sair quando não há foco interno. Clique/toque/Enter/Espaço fixa; novo clique ou Escape fecha, devolvendo foco à aba. Painel em sobreposição evita deslocar a escrita; entrada curta respeita a preferência CSS por movimento reduzido. Índice mantém abertura nativa.
- Modo foco recolhe navegação de coleção/edição e índice; ferramentas, navegação de páginas e salvamento permanecem. Saída por botão/Escape; retorno à coleção encerra o modo. Botão Topo retorna à folha e posiciona foco no título ou no conteúdo de leitura.
- Fluxo de salvamento e formato dos documentos preservados. Preferências de foco/movimento continuam locais à aba. A prévia está em `http://127.0.0.1:8002/?preview=1`, sem persistência; a porta 8001 estava ocupada por instância anterior.
- Verificação: sintaxe de 19 arquivos JavaScript e sete testes aprovados, nenhum pulado, incluindo SQL real, autosave e estados de hover/foco/fixação/fechamento. Não há linter configurado. No navegador: modo foco com status visível, Escape, HUD sem mudar posição da folha, título preservado ao navegar, retorno ao topo em escrita/leitura e larguras emuladas de 390/320 px sem transbordamento horizontal. Folha desktop de aproximadamente 1.254 px em viewport de 720 px. Console sem erros/avisos no fluxo observado. Hover foi exercitado no teste de eventos; a operação real por teclado foi observada no navegador.
- Evidência: `tmp/library4-notebook-refined.png`. Ainda sem traces de performance, medições em aparelhos físicos ou avaliação com participantes; R0 tem apenas a linha de base funcional/visual parcial. Não declarar R0/R1 completos: arte precisa de revisão do proprietário, comparação de acabamentos e ensaio de estudo. Rascunhos persistentes, paginação por blocos, duas folhas, pan/zoom e dobra curva continuam pendentes.

## Lapidação: controles compactos e virada lateral — 10/10/2026

- Cabeçalho sem faixa sólida, retorno por seta e menu “⋯”. Índice/lembretes, topo, edição e modo foco foram movidos para esse menu, preservando ações existentes. Navegação inferior reduzida a duas setas rotuladas e posição; alvos de toque permanecem com 44 px.
- Virada substituída: apresentação antiga temporária cruza a lombada em 180°, com frente e verso; destino já está no editor real. No retorno, a apresentação da página anterior entra do outro lado sobre a folha de origem. Cópias inertes, sem IDs duplicados, removidas ao finalizar/interromper; nenhuma captura gráfica, engine, biblioteca ou mudança de persistência.
- Escrita em título/conteúdo, novo comando de navegação, troca de modo/tamanho, resize e aba oculta cancelam o efeito. Redução de movimento ou modo desligado evitam as cópias. A geometria ainda é plana rígida; dobra curva permanece pendente.
- Verificado: sintaxe de 19 arquivos e oito testes aprovados, nenhum pulado, incluindo banco real. Testes demonstram texto capturado independente da página de destino, remoção ao concluir/cancelar, navegação sobreposta com callback atrasado e fallback sem efeito.
- Navegador: menu acessível por teclado, índice/lembretes, modo foco com retorno à aba, transformação atravessando a lombada e verso no lado oposto, retorno com duas apresentações temporárias e cancelamento por edição. Em 320 px, menu dentro da tela, sem transbordamento horizontal e folha maior que viewport; modo desligado troca página sem cópias. Console sem erros/avisos no fluxo observado. Desempenho físico, memória e dobra curva não medidos/concluídos.

## Entrega inicial R4: duas folhas — 10/10/2026

- Menu atual recebe escolha Uma/Duas folhas. Par consecutivo editável com lombada central e lados próprios; foco/toque determina página dos ajustes, versões e topo. Títulos e conteúdo de ambos mantêm identidade e o fluxo existente de gravação, sem alteração SQL.
- Navegação por pares e índice por página. Última página ímpar mostra encerramento, sem criar folha vazia. Tela abaixo de 1.100 px apresenta a página ativa e restaura o par ao ampliar, sem repaginar documentos. Preferência vale para a aba.
- Continuação automática em ambos os lados preserva caracteres. No limite de 500 páginas, texto excedente permanece na página com aviso. Virada continua plana; pares incompletos trocam sem efeito.
- Verificado: sintaxe de 19 arquivos e 10 testes aprovados, nenhum pulado. Testes cobrem seleção de pares e limite com preservação do texto, além de SQL real/criptografia/autosave existentes. Navegador: edição independente, fonte por lado, escrita/leitura, divisão da folha direita em 32 + 8 linhas, página final ímpar, fallback em 320 px sem transbordamento e retorno ao par. Console sem erros/avisos no fluxo observado.
- Evidência: `tmp/library4-notebook-spread.png`. R4 tem implementação inicial, não aceite completo: ensaios de IME/undo, teclado virtual, aparelhos físicos e enquadramento permanecem pendentes. R2/R3 não foram encerrados por esta entrega; rascunhos após crash e Markdown por blocos seguem prioritários. Próximo refinamento deve consolidar escrita/preservação antes de pan/zoom ou efeitos elaborados.

## 1. Preservar o projeto atual e fechar o escopo

### Consolidação das seis frentes aprovadas — 10/10/2026

1. **Ações:** “+” visível na navegação, sem duplicação no índice; criação abre escrita também após leitura/modo foco. Página ativa discreta.
2. **Escrita:** atalhos de formatação Markdown, undo/redo de 30 grupos na aba preservando revisões; listas/código/citações/tabelas protegidos como blocos. Composição em andamento adia redistribuição por largura. Papel alto, pauta, margens e famílias de fonte ajustados.
3. **Continuidade:** snapshot/lote cifrado em IndexedDB por conta/caderno/aba; confirmação local somente após transação. Recuperação após desbloqueio, escolha entre várias abas e conflito preservado em cópia. Limpeza condicional por identificador e stamp após confirmação remota, sem expiração automática de pendências.
4. **Enquadramento:** zoom 80–140%, arraste direito com limiar que preserva clique simples, setas na região focada, centralizar e voltar ao cursor. Pinça nativa e rolagem preservadas. Posição proporcional por página permite adaptar outra largura.
5. **Virada:** ponta articulada no modo completo, frente/verso, cópias inertes sem IDs e remoção ao terminar/cancelar. Modo leve continua sem ponta; movimento reduzido/desligado evita efeito. Curva contínua e pares incompletos animados permanecem pendentes.
6. **Personalização:** três opções de papel/capa/fonte do sistema; preferências e posição nos metadados privados existentes, sem migração SQL. Retomada em até 24 h após desbloqueio. Padrão pessoal protegido com a raiz neste dispositivo e aplicado a novos cadernos; sincronização desse padrão ainda pendente.

**Verificação:** sintaxe de 24 arquivos e 16 testes aprovados, nenhum pulado, incluindo PostgreSQL real. Oito fluxos automatizados em Edge headless: criação visível, atalhos/undo/redo, personalização/zoom, 320 px, virada/arraste, composição simulada durante resize, falha de envio/IndexedDB/recarga/desbloqueio/recuperação/limpeza e preferências/retomada persistentes. Conta e banco de teste limpos; `tmp/verify-notebook.mjs` usa o runtime Playwright já disponível, sem dependência nova no app. Evidências em `tmp/library4-polished.png` e `tmp/library4-turn-refined.png`; instância atual em `http://127.0.0.1:8003/?preview=1`.

**Limites:** não declarar R0–R7 totalmente aceitos. Rascunho depende de transação, origem/porta e retenção do navegador; últimos caracteres ainda não gravados podem se perder. Login/desbloqueio não são totalmente offline. Blocos altos expandem folha; parágrafos continuam com capacidade lógica. Undo não remove páginas; folhas extras ficam vazias. IME físico, pinça em aparelhos reais, FPS/memória/bateria, curva contínua, caderno dobrado e estilos por trecho precisam de novas provas.

**Próxima sequência:** ensaio de estudo e refinamento pontual do que aparecer → modelo seguro de estilos por trecho/padrão entre dispositivos → eventos diários privados de produção → estantes/recentes/favoritos → ambiente opcional. Recuperação de login e backup/restore continuam requisitos de fechamento do MVP; social fica depois da base sólida.


- Inventariar código, dados, testes e integrações existentes; decidir o que serve como referência e se haverá migração dos estudos atuais.
- Preservar cópia recuperável antes de alterações estruturais. O usuário autorizou substituir o projeto neste repositório e isso foi feito após o backup.
- Fechar as decisões que impedem implementar: formato das páginas, stack, auth, chaves, recuperação, política de autosave/versões e contagens básicas.
- Manter RF-M01–M17 como MVP proposto; confirmar em que momento a publicação entra.

**Saída:** escopo e decisões registrados; material existente preservado. Esta documentação, por si só, não autoriza apagar dados ou publicar um site.

## 2. Desenhar os fluxos e a identidade inicial

- Aplicar `$library4-design`; ler o contexto e escolher direção visual com identidade de caderno.
- Esboçar cadastro/login/desbloqueio, criação/seleção de caderno, índice de páginas, editor/prévia, metas, resumo e histórico de versões.
- Desenhar estado vazio, conteúdo longo, envio, confirmação, erro, conflito e recuperação.
- Comparar composição móvel e desktop; especificar presets de tamanho, limite e contagem de linhas, enchimento e redimensionamento sem perda antes de fechar editor/navegação.

**Saída:** fluxo principal compreensível e telas/estados revisáveis, com aparência de caderno sem depender de animações.

## 3. Especificar e provar o modelo de privacidade

- Definir ameaças: leitura do banco, storage/backups, troca de payloads, acesso entre contas, XSS e adulteração do cliente.
- Selecionar mecanismos criptográficos reconhecidos e definir envelopes, vinculação à entidade/revisão, geração e proteção de chaves. Não adicionar biblioteca sem a autorização aplicável.
- Definir segredo de desbloqueio, recuperação e acesso em vários dispositivos sem segredo de leitura disponível ao servidor.
- Fazer uma prova pequena: criptografar, persistir, desbloquear em sessão nova, recuperar e rejeitar envelope adulterado.
- Separar recuperação de login de chaves; definir limpeza de chaves e rascunhos no logout/dispositivo compartilhado.

**Saída:** o proprietário reabre seu conteúdo; inspeção do armazenamento não o revela; recuperação e limitações estão demonstradas e documentadas. Não avançar com conteúdo privado legível como atalho.

## 4. Preparar ambiente e banco

- Confirmar SQL/PostgreSQL e ferramentas já existentes; separar configuração de desenvolvimento, teste e produção.
- Transformar o modelo lógico aprovado em migrações mínimas do MVP, sem tabelas sociais e de mídia antecipadas.
- Definir autenticação/credenciais/sessões conforme a arquitetura aprovada, segredos por ambiente e permissões do banco.
- Exercitar FKs, unicidades, revisão atual e criação atômica de página/versão inicial.

**Saída:** ambiente reproduzível e migrações verificadas em banco temporário. Nenhum segredo no repositório.

## 5. Implementar contas e acesso

- Entregar cadastro, login, sessão, logout e recuperação de acesso.
- Integrar criação/desbloqueio/recuperação dos keysets no cliente.
- Implementar autorização por proprietário em todas as operações privadas.
- Verificar com duas contas e sessão expirada; a segunda conta não lista nem modifica entidades da primeira.

**Saída:** RF-M01–M05 comprovados; conta não implica chave legível no backend.

## 6. Implementar cadernos e páginas

- Criar/listar/editar cadernos com metadados criptografados; apresentar primeiro acesso sem tutorial obrigatório.
- Criar/listar/abrir páginas e navegação conforme decisão de apresentação.
- Criar página e revisão inicial na mesma transação; proteger ordenação contra colisões.
- Conferir conteúdo longo e estados vazios com teclado e tela estreita.

**Saída:** RF-M06–M08; usuário abre seu caderno e encontra suas páginas após novo login.

## 7. Implementar editor e salvamento constante

- Entregar Markdown e prévia segura com sintaxe acordada.
- Definir/implementar agrupamento de alterações, espera máxima, retry limitado e estado visual verdadeiro.
- Usar revisão esperada e mutação idempotente; confirmar apenas após commit.
- Tratar edições durante envio, respostas atrasadas, timeout e duas abas.
- Implementar buffer/rascunho local somente segundo a política de segurança e persistência aprovada.

**Saída:** RF-M09–M12; escrever → confirmar → sair → voltar recupera texto. Desconexão não causa descarte silencioso e a interface distingue pendente de salvo.

## 8. Implementar versões e restauração

- Listar e inspecionar versões recentes, respeitando autorização e criptografia.
- Restaurar como nova revisão sem apagar o estado anterior.
- Aplicar limites e retenção aprovados; não apagar versão atual ou dependências recuperáveis.
- Testar retry da restauração e conflito com edição em outra aba.

**Saída:** RF-M13–M14; usuário recupera conteúdo anterior e consegue reconhecer o resultado.

## 9. Implementar metas e métricas básicas

- Criar/editar/concluir/reabrir tarefas com dados privados criptografados.
- Calcular páginas com conteúdo, palavras e tarefas conforme regras acordadas no cliente.
- Mostrar resumo por caderno e conta; sinalizar totais incompletos durante carregamento/desbloqueio.
- Não tratar restauração como produção nova nem confundir versões com histórico de atividade.

**Saída:** RF-M15–M17; números conferem com conteúdo de teste e continuam coerentes após alterações/restauração.

## 10. Validar e preparar o lançamento do MVP

- Executar lint/testes aplicáveis, revisão do fluxo, isolamento entre contas e inspeção de dados/erros/logs/backups.
- Testar teclado, zoom, movimento reduzido, telas estreitas/intermediárias/largas e conexão instável.
- Ensaiar backup e restauração incluindo envelopes e dependências de chaves; o backup não cria uma chave administrativa de leitura.
- Documentar retenção, limites, recuperação e metadados visíveis; tornar políticas e mensagens coerentes com o comportamento real.
- Preparar configuração de produção dos serviços confirmados e seguir a autorização de publicação aplicável.

**Saída:** definição de MVP concluído do documento de requisitos atendida, verificações registradas e limitações explícitas. Hospedagens citadas na proposta são candidatas, não destinos já contratados.

## 11. Evoluir por entregas separadas

| Entrega | Trabalho principal | Conclusão verificável |
| --- | --- | --- |
| Publicação básica, fase a confirmar | Aprovar snapshot ou atualização automática; publicar/retirar conteúdo com acesso anônimo. | Visitante só lê material publicado; nenhum histórico/chave privada exposto. |
| Multimídia | Storage, envelopes de arquivos, vínculo com página, limites e retenção. | Anexo privado abre para proprietário, não para outra conta; versões não perdem dependências silenciosamente. |
| Busca | Busca local e estratégia de carregamento/indexação. | Resultado pertinente sem revelar texto ao servidor; alcance informado. |
| Histórico/tempo/dashboards | Eventos, fórmula de produção, timezone, inatividade e agregação. | Períodos coerentes, sem duplicidade e sem fabricar histórico anterior à coleta. |
| Personalização/movimento | Capas, cores, transições e redução de movimento. | Identidade preservada sem dificultar leitura/navegação. |
| Social/seletivo | Amigos, perfis, permissões e distribuição/revogação de chaves. | Amizade não libera conteúdo automaticamente; destinatários e limites de revogação claros. |

Não criar tabelas ou interfaces futuras antes da respectiva entrega. Mudanças de escopo devem atualizar proposta, requisitos e modelo SQL juntos.

## Roteiro de refinamento — 10/10/2026

Este roteiro organiza a evolução do protótipo existente; as etapas 1–11 acima permanecem como histórico e critérios gerais da reconstrução. A base técnica/visual pesquisada está em [design-templo.md](design-templo.md#pesquisa-aplicada--10102026). Nenhuma biblioteca, prazo, implementação futura ou medição é declarada aprovada por esta tabela.

**Prioridade:** caderno primeiro, restante simples. Cada rodada entrega algo utilizável, preserva dados existentes e encerra com evidência. As linhas são sequência de dependências, não um pedido para implementar tudo de uma vez.

| Rodada | Resultado concreto | Dependência | Critério para seguir |
| --- | --- | --- | --- |
| R0 — Linha de base | Cenário de estudo, estados e riscos atuais registrados | Protótipo existente | Reproduzir escrita, paginação, navegação, reabertura e falha sem dúvida sobre o que está salvo |
| R1 — Caderno original | Uma família visual refinada: capa, papel, lombada, mesa e HUD | R0; escolha de acabamento com o proprietário | Caderno alto convincente e texto legível com conteúdo real, desktop e tela estreita |
| R2 — Continuidade segura | Rascunho local criptografado recuperável, limites coerentes | R0; política de retenção/limpeza | Crash/desconexão não descartam o rascunho protegido; confirmação remota continua verdadeira |
| R3 — Escrita e paginação | Contrato de capacidade, blocos e seleção/undo | R1/R2; prova do modelo de estilos antes de incluí-los | Texto preservado, código/listas íntegros e digitação estável ao criar próxima folha |
| R4 — Uma e duas folhas | Duas páginas consecutivas editáveis no mesmo caderno | R3 | Cada lado tem identidade, seleção e salvamento corretos; folha única continua disponível |
| R5 — Enquadramento | Pan/zoom, centralizar e focar escrita | R4 | Mouse, teclado e toque acessam o conteúdo sem bloquear seleção, scroll ou zoom nativo |
| R6 — Virada refinada | Movimento original com dobra ou ilusão convincente | R4/R5 e medição da técnica | Cancelável, configurável, foco preservado, fluidez medida e fallback funcional |
| R7 — Meu caderno | Poucas personalizações e preferências sincronizadas | R3/R5/R6; modelo de preferências | Padrão pessoal + substituições por caderno, reabertura e retomada em outra tela |
| R8 — Meu progresso | Histórico diário privado de páginas editadas/criadas com conteúdo | R3/R7; regras dos eventos | Repetição, formatação, restauração e redistribuição não fabricam produção |
| R9 — Minha coleção | Home simples, estantes, recentes e favoritos | Caderno estabilizado e R7/R8 | Encontrar e retomar caderno; múltiplas estantes sem cópia de conteúdo |
| R10 — Ambiente | Luz/clima/som opcionais e lembrete | R6/R7; custo medido | Estudo confortável, áudio por ação explícita e aba oculta tratada corretamente |
| R11 — Preparar MVP | Recuperação de login, backup/restore, segurança e validação completa | Lacunas do MVP fechadas | Requisitos atendidos com evidência e limitações reais documentadas |
| Depois — Social | Publicação, estrelas, feed e acesso seletivo; conversas/grupos em entregas próprias | MVP sólido e modelo de publicação/chaves aprovado | Nada privado aparece por acidente; estudo permanece independente do social |

R2 pode receber correções urgentes antes de terminar o acabamento de R1. R11 não adia segurança: isolamento, criptografia e recuperação de dados continuam critérios de todas as rodadas. Pesquisa de técnica 3D/sprites pode acontecer como prova descartável em R6; não implica adoção de engine.

### R0: estabelecer o que vamos comparar

- Usar um caderno de referência com resumo, títulos, listas, código, texto longo e páginas pequena/média/grande.
- Registrar captura desktop/tela estreita, fluxo, versão, ambiente e trace inicial de digitação/navegação. Não usar a prévia sem persistência como prova de autosave.
- Conferir riscos prioritários: limites da criação automática, Markdown cortado entre folhas, seleção/undo, edição durante envio, crash, quota local e conflito entre abas.
- Separar o observado do inferido: largura emulada já foi verificada; aparelhos físicos, memória e bateria ainda não.

**Entrega:** evidência reproduzível e lista curta de problemas por impacto: perda de conteúdo → dificuldade de escrever/ler → navegação → acabamento. Não ampliar o projeto para um dashboard de observabilidade.

### R1: próxima rodada visual recomendada

1. Manter a composição que o proprietário indicou: vista superior, mesa simples, caderno alto ultrapassando a tela e HUD discreto.
2. Comparar no máximo três acabamentos originais com o mesmo texto: diferenças de capa, cantos, espessura, papel e lombada. Sem copiar Minecraft e sem reintroduzir cenário fotográfico inclinado.
3. Escolher um acabamento e implementá-lo na folha única existente. Refinar margens, contraste, pauta, cabeçalho, estado de salvamento e aba de ferramentas.
4. Mostrar o caderno escrevendo, rolando e navegando. Ajustar o que parecer achatado, excessivamente antigo, ruidoso ou pouco acolhedor.
5. Validar teclado, zoom do navegador e tela estreita. Registrar o que foi aprovado antes de criar variações de catálogo.

**Aceite:** papel reconhecível como espaço de escrita, nenhuma distorção para caber na tela, controles encontrados sem explicação e dados preservados. O acabamento aprovado orienta modelos seguintes; não fecha automaticamente toda a identidade visual.

### R2/R3: proteção e editor antes de efeitos elaborados

- Rascunho: persistir envelope e revisão-base, sinalizar proteção local separada de confirmação remota, recuperar após desbloqueio e reconciliar conflitos sem sobrescrever silenciosamente.
- Política: definir retenção, exclusão, troca de conta, logout e dispositivo compartilhado; lidar com armazenamento indisponível/cheio. Não armazenar chave legível como atalho.
- Capacidade: definir largura lógica, fonte de referência, áreas úteis e política de redistribuição. Preservar todos os caracteres ao mudar tamanho/fonte.
- Blocos: provar código/listas/títulos no limite antes de escolher algoritmo. Não exigir reforma completa do editor se uma mudança menor cumprir o contrato.
- Seleção: provar undo/redo, colagem, IME, acentos, emojis, atalho aplicado a seleção e cursor depois de divisão. Não cancelar edição nativa indiscriminadamente.
- Estilos individuais: comparar extensão restrita com metadados de intervalos. Demonstrar um estilo completo antes de aprovar o modelo; nova biblioteca exige consulta.

**Verificação:** testes pequenos nos contratos novos, testes existentes de autosave/criptografia/revisão e fluxo real de rede/recuperação. Lint apenas se houver comando configurado; `npm run check` verifica sintaxe e não deve ser descrito como lint. Migração, se necessária, preserva documentos antigos e é ensaiada com cópia recuperável.

### R4/R5: o caderno como espaço navegável

- Abrir páginas consecutivas lado a lado; a última folha, um número ímpar de páginas e uma página recém-criada têm comportamento explícito.
- Um lado ativo determina cursor e atalhos; os dois são editáveis. Virar não depende de montar todas as páginas do caderno.
- Introduzir enquadramento com coordenadas do documento e limites compreensíveis; reabrir pelo trecho de referência, não por pixels absolutos de outro dispositivo.
- Provar rodinha, arraste com botão direito, botões e pinça sem prender rolagem/seleção. Menu de contexto deve continuar disponível fora do gesto de pan definido.
- HUD reaparece por hover, foco e toque; não recolhe enquanto a pessoa usa seus controles. Erro de salvamento fica perceptível com HUD fechado.

**Aceite:** ir do primeiro ao último trecho, selecionar/copiar, mudar de folha e voltar ao cursor por botão/teclado/toque. Testar teclado virtual e zoom do navegador. Se a tela não comportar duas folhas legíveis, oferecer folha única.

### R6: escolher a técnica pela prova

1. Produzir poses e ritmo do papel com um único modelo e conteúdo dinâmico.
2. Comparar alternativa DOM/sombras com quadros pré-renderizados somente se a primeira não alcançar o efeito desejado.
3. Medir tempo de quadros, scripting/layout/paint, memória e tráfego com a mesma tarefa. Registrar dispositivo e condições.
4. Conferir interrupção por digitação/nova navegação, foco, movimento reduzido e modo desligado.
5. Escolher a menor solução que entregue a qualidade aprovada; ampliar assets só depois. Runtime 3D permanece opção condicionada a necessidade demonstrada e autorização da stack.

**Aceite:** acabamento da virada aprovado e evidência de custo no hardware disponível. Sem medir, registrar “pendente”; não prometer que roda em qualquer dispositivo. Vídeo/gravação do protótipo funcionando é mais útil nesta etapa que uma nova imagem estática.

### R7/R8: personalização e continuidade com sentido

- Começar com poucas opções de capa/papel/fonte, sem um configurador enorme. Preferências têm valores seguros, padrão pessoal e substituição por caderno.
- Sincronizar identidade do caderno/página, referência de leitura, zoom/enquadramento e ambiente depois de desbloquear; adaptar à nova tela. Janela de 24 horas vem da última interação, com comportamento documentado.
- Definir produção diária usando exemplos de escrever → apagar, editar várias vezes, criar folha vazia, restaurar, redistribuir e retry. Separar identidade da página de unidades artificiais criadas por reflow.
- Armazenar eventos privados sem exigir conteúdo legível no backend. Não fabricar dias anteriores ao início da coleta.

**Aceite:** computador → notebook retoma o estudo, e resumo diário confere com eventos de teste. Versões continuam disponíveis para recuperar conteúdo; não substituem o histórico de produção.

### R9/R10 e social: expandir sem desviar do estudo

Coleção primeiro: criar/encontrar/abrir cadernos, estantes com vínculos e filtros de recentes/favoritos. Depois, ambiente estático configurável e áudio opcional. Chuva animada, partículas e som de escrita entram individualmente, mediante avaliação de conforto/custo.

Publicação merece entrega independente: escolher snapshot/atualização, trecho/folha/caderno/estante e retirada. Whitelist exige distribuição de chaves por destinatário; senha de login não resolve esse compartilhamento. Revogação não apaga cópias já obtidas. Ranking de estrelas, feed, amigos, chat e grupos não são uma única feature e ficam fora do foco atual.

### Ritual de cada rodada

**Antes:** ler contexto/código tocado, listar o contrato e riscos, escolher um resultado verificável. **Durante:** menor alteração completa, plataforma/dependências existentes, preservação de dados e teste proporcional. **Depois:** demonstrar fluxo real, atualizar a documentação categorizada e registrar evidência/limites.

Separar três avaliações: preferência visual do proprietário; funcionalidade demonstrada/testada; desempenho medido. Nenhuma substitui a outra. Não repetir baterias inteiras por uma edição documental, nem declarar ensaio físico realizado a partir de viewport emulado.

**Próxima entrega recomendada:** R0 + R1, um único caderno original refinado e uma referência reproduzível de estudo. Manter correção de risco de perda de dados à frente de acabamento quando identificada. Não iniciar Home/social ou um motor gráfico antes desse resultado.
