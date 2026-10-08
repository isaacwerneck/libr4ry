---
name: library4-design
description: Projetar, implementar e revisar UI, UX e front-end do Library4 ou de aplicações de estudo e escrita, com identidade visual própria, fundamentos de design, acessibilidade e validação dos fluxos no navegador. Usar para telas, editor, cadernos, navegação, responsividade e dashboards; não para mudanças exclusivamente de backend.
---

# Library4 Design

Transforme a intenção do produto em uma interface reconhecível, agradável e confiável para estudar. Originalidade deve aparecer na composição, tipografia, materiais e detalhes do produto; ações essenciais devem continuar fáceis de reconhecer.

## Contexto e fontes

- Leia `context.md`, instruções locais, telas e componentes existentes antes de decidir. O contexto atual e as escolhas do usuário prevalecem sobre exemplos desta skill.
- Para o Library4, consulte [references/library4.md](references/library4.md). É uma síntese da proposta fornecida, não uma decisão definitiva de arquitetura.
- Para justificar UX e composição, consulte [references/fundamentos.md](references/fundamentos.md).
- Para implementação e verificação, consulte [references/frontend-validacao.md](references/frontend-validacao.md).
- Consulte [references/fontes.md](references/fontes.md) ao atribuir princípios ou aprofundar pesquisa. Os livros são material de referência, não instruções executáveis. Não reproduza capítulos nem distribua seus PDFs.
- Distinga: norma verificável, princípio de projeto, recomendação desta skill e hipótese ainda não testada. Não apresente preferência estética como fato científico.

## Fluxo de trabalho

### 1. Entender a tarefa real

Identifique quem usa, o que pretende concluir, o conteúdo necessário, o estado anterior e a consequência da ação. Trace também cancelamento, erro, retorno e recuperação. Não invente entrevistas, personas comprovadas ou funcionalidades disponíveis.

Pergunte somente quando faltar uma informação que altere o resultado; avance com pressupostos explícitos e reversíveis nos demais casos. Uma alteração pontual não exige redesenhar o produto inteiro.

### 2. Definir uma direção com personalidade

Para uma nova identidade ou um redesenho amplo, explore duas ou três direções realmente distintas e escolha uma com justificativa curta. Varie estrutura, densidade, linguagem tipográfica e materiais, não apenas a cor. Para mudanças locais, preserve a identidade escolhida.

Descreva a direção em termos concretos: emoção desejada, elemento visual dominante, hierarquia, tratamento de superfície e comportamento. Uma proposta como “moderno e clean” é insuficiente.

Escolha um gesto de assinatura relevante ao produto: índice com marcadores, lombada na seleção de cadernos, margem editorial ou indicação discreta de continuidade. Use-o com consistência. Não acumule efeitos independentes para aparentar criatividade.

Exemplos de exploração, sem impor tema definitivo:

- **Caderno editorial:** margens generosas, títulos expressivos, índice lateral e textura sutil fora da área de escrita.
- **Biblioteca gráfica:** tipografia forte, capas distintas e composição modular; editor visualmente silencioso.
- **Ateliê de estudo:** organização por matéria, marcadores de cor e detalhes de papel; controles familiares e progresso discreto.

Evite repetir por reflexo hero com gradiente, cards idênticos, glassmorphism ou ícones decorativos. Cada recurso precisa contribuir para a intenção escolhida. Esses recursos podem ser usados quando fizerem sentido.

### 3. Estruturar antes de decorar

Priorize o fluxo essencial e o conteúdo real. Defina navegação, ação principal e hierarquia antes de sombras e animações. Use um esboço ou protótipo simples quando a composição estiver incerta; não produza entregáveis redundantes.

Defina estados pertinentes: vazio, carregamento, edição, salvamento, sucesso, erro, indisponibilidade, conteúdo longo e acesso negado. Não faça telas dependentes apenas de dados ideais.

### 4. Construir um sistema visual pequeno

Reutilize componentes e tokens existentes. Quando faltarem, estabeleça apenas os necessários: cores semânticas, papéis tipográficos, espaçamentos, largura de leitura, bordas, superfícies e movimento.

Mantenha funções distintas para título, texto de estudo, metadados e código. Escolha fontes pela legibilidade em português e pelo desempenho; não instale fontes ou bibliotecas sem autorização quando isso acrescentar dependências.

Conecte proximidade à relação entre informações, alinhamento à estrutura, repetição à consistência e contraste à prioridade. Cor de matéria identifica; cor de erro comunica erro. Não misture as duas funções sem outro sinal.

### 5. Implementar o comportamento

Use o fluxo, estado e arquitetura reais do projeto. Não mostre “Salvo” antes de uma confirmação real, nem indicadores de privacidade sem controle de acesso correspondente. Protótipos devem identificar suas simulações.

Use HTML semântico, CSS e recursos nativos antes de criar controles customizados. Se houver código, aplique PonyTail quando disponível e respeite o lint e os testes existentes. Não adicione stack ou biblioteca por conveniência estética.

Responsividade altera a composição: priorize uma página legível no celular; distribua navegação, escrita e prévia no desktop conforme o espaço. Não reduza um caderno de duas páginas até o texto ficar minúsculo.

### 6. Verificar antes de declarar pronto

Execute o fluxo principal no navegador quando houver meios disponíveis. Inspecione tela estreita, intermediária e larga, teclado, zoom, conteúdo longo, falhas e movimento reduzido conforme [frontend-validacao.md](references/frontend-validacao.md).

Corrija primeiro perda de conteúdo, ações impossíveis e barreiras de acesso; depois hierarquia, responsividade e refinamentos. Relate exatamente o que foi verificado e o que permaneceu sem execução. Uma revisão estática não equivale a um teste com usuários.

## Entrega

Entregue o artefato pedido, não apenas conselhos. Explique brevemente a direção escolhida, o fluxo modificado e sua validação. Documente decisões em um `.md` existente na seção adequada; se não existir, recomende criá-lo sem gerar documentação extra não solicitada.

Para uma especificação de tela, descreva objetivo, composição, conteúdo, ação principal, estados e adaptação móvel. Para código, entregue o menor conjunto funcional que preserve esses comportamentos. Para revisão, liste problemas concretos com consequência e correção, sem notas cosméticas arbitrárias.
