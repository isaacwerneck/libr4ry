# Contexto do Library4

Base: proposta enviada pelo usuário e decisões aprovadas em 07/10/2026. Este documento registra o planejamento da reconstrução; as funcionalidades descritas ainda não estão implementadas. As seções de decisões aprovadas são requisitos; as recomendações de UX e questões abertas continuam sujeitas à definição.

No projeto, a proposta principal agora está em `docs/proposta.md`, acompanhada de `docs/requisitos-funcionais.md`, `docs/banco-de-dados.md` e `docs/passo-a-passo.md`, com índice em `context.md`. Consulte esses documentos para escopo, critérios de aceite e sequência atualizados; este arquivo mantém o contexto de design da skill.

## Compromissos da proposta

O Library4 é um ambiente pessoal de estudo, escrita e continuidade. Seu núcleo é escrever, guardar, voltar e perceber progresso. Deve lembrar um caderno físico sem dificultar o uso digital.

- Aplicação web com contas desde o início e múltiplos cadernos por usuário.
- Cadernos possuem páginas independentes, com Markdown como base conceitual.
- Criação simples: nome, matéria/categoria e tags; personalização avançada posterior.
- Após login, entrar no ambiente de estudo sem tutorial obrigatório. O estado de primeira utilização precisa permitir criar o primeiro caderno.
- Metas opcionais, métricas básicas e dashboards de caderno e conta fazem parte da visão.
- Imagens, áudio e arquivos estão planejados para depois do núcleo de escrita, metas e métricas básicas. Blocos de código fazem parte do conteúdo Markdown.
- A identidade visual de caderno deve aparecer desde o MVP, com composição simples. Personalização avançada e animações complexas ficam para depois.
- Markdown direto com prévia, salvamento automático contínuo e histórico recente de versões foram aprovados.
- Cadernos privados por padrão, com opção de torná-los públicos para leitura por qualquer pessoa. Amigos e compartilhamento seletivo ficam para uma etapa posterior.
- O conteúdo privado deve ser protegido de forma que consultar o banco, o storage ou os backups não permita ao administrador lê-lo. A estratégia técnica deve atender esse requisito desde a disponibilização de cadernos privados.
- Stack, storage, mecanismo criptográfico e implementação da busca ainda exigem decisões técnicas.

## Decisões aprovadas e fluxo funcional

### Prioridades da reconstrução

1. Fundação: contas, autenticação, isolamento entre usuários e desenho da criptografia e recuperação das chaves.
2. Núcleo: criar e selecionar caderno, criar página, editar Markdown com prévia, salvar automaticamente, reabrir e recuperar versões recentes.
3. Metas simples e métricas básicas: páginas com conteúdo e palavras por caderno, separando estado atual de produção histórica.
4. Multimídia: imagens, áudio e arquivos, preservando as garantias de privacidade.
5. Histórico de progresso e dashboards mais completos, com definições explícitas de tempo e produção.
6. Personalização visual avançada e animações de páginas, sem prejudicar a escrita.
7. Camada social: amigos, perfis e compartilhamento seletivo.

A aparência básica de caderno acompanha o núcleo, não depende da fase de animações. A etapa de disponibilização de leitura pública ainda será definida; a opção não deve aparecer como funcional antes de ser implementada.

### Editor, salvamento e versões

Fluxo aprovado: abrir caderno → abrir/criar página → escrever Markdown → visualizar prévia quando desejado → salvar automaticamente → voltar posteriormente e continuar.

O salvamento deve ocorrer continuamente durante o uso, agrupando alterações quando necessário para não enviar uma requisição por tecla. Intervalos, pausa de digitação e política de novas tentativas ainda serão especificados. Não depender de clicar em salvar nem de fechar a página para persistir.

Mostrar os estados de alterações pendentes, salvamento, confirmação e falha. Só confirmar como salvo o conteúdo efetivamente persistido; respostas antigas não confirmam edições posteriores. Falhas e conflitos devem preservar as alterações e permitir recuperação, sem sobrescrita silenciosa.

Manter histórico recente recuperável por página. O usuário deve poder inspecionar uma versão anterior e restaurá-la sem perder silenciosamente a versão atual. Salvamento automático e criação de uma versão histórica podem ter frequências diferentes. Retenção, limites, agrupamento e comportamento com exclusão de páginas continuam em aberto; não prometer um prazo ainda indefinido.

Em cadernos privados, versões antigas recebem a mesma proteção do conteúdo atual. Histórico de versões serve para recuperar texto; histórico de métricas serve para acompanhar produção e não substitui as versões.

### Métricas

As métricas iniciais são páginas com conteúdo e palavras por caderno, além do acompanhamento das metas simples. Definir o que conta como página escrita e palavra antes de implementar.

Separar conteúdo atual de conteúdo produzido no período: apagar ou restaurar texto muda o estado atual, mas não deve apagar silenciosamente o histórico de atividade. Definir como contabilizar exclusões, restaurações e texto repetido para não inflar produção. Tempo com o caderno aberto não equivale a tempo estudado.

### Privacidade: privado ou público

- **Privado, padrão:** somente o proprietário pode acessar o conteúdo legível; administradores não possuem uma chave que permita descriptografá-lo no servidor.
- **Público:** qualquer visitante pode ler o conteúdo publicado, inclusive sem conta; edição permanece exclusiva do proprietário. Não publicar histórico de versões ou estatísticas pessoais implicitamente.

O fluxo de tornar público deve deixar claro o alcance e pedir uma ação explícita do proprietário. Definir se a publicação acompanha futuras edições ou representa uma versão publicada. Voltar para privado deve retirar o acesso público mantido pela plataforma, mas não pode apagar cópias já feitas por visitantes.

Para atender ao requisito privado, criptografar conteúdo no dispositivo do usuário antes de enviá-lo e descriptografá-lo ali. O servidor pode armazenar chaves protegidas, mas não material que permita desbloqueá-las por conta própria. Criptografia de disco/banco com chave disponível ao serviço não atende, sozinha, ao requisito.

Proteger texto, anexos, versões, títulos, tags, metas e demais dados de conteúdo privado. Identificar separadamente os metadados técnicos indispensáveis ao serviço e o que revelam, como identificadores, tamanho e horários. Não tratar a criptografia como garantia de ocultar toda atividade.

Busca e cálculo de métricas sobre conteúdo privado devem respeitar as chaves controladas pelo usuário; processamento local é uma possibilidade a especificar. Não enviar texto descriptografado ao backend, logs, telemetria ou ferramentas administrativas para viabilizar esses recursos. Backups de conteúdo privado também devem permanecer criptografados.

Definir recuperação e acesso em vários dispositivos sem dar ao administrador a capacidade de ler os cadernos. Recuperar login não significa recuperar as chaves do conteúdo. A experiência precisa explicar o que acontece se o usuário perder todos os meios de desbloqueio; o suporte não pode prometer restaurar conteúdo sem eles.

O requisito protege o conteúdo armazenado contra leitura administrativa. Em uma aplicação web, código adulterado entregue ao navegador ou dispositivo comprometido pode capturar conteúdo durante o uso. O modelo de ameaças precisa considerar esses casos; não prometer proteção absoluta contra quem controla a distribuição do cliente. Referências técnicas: [OWASP — Cryptographic Storage](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html) e [W3C — Web Cryptography, considerações de segurança](https://www.w3.org/TR/webcrypto/#security-considerations).

## Recomendações de UX específicas

### Entrada e continuidade

No primeiro acesso, apresentar uma ação clara para criar caderno, com explicação curta e sem passos compulsórios extras. Para quem retorna, facilitar continuar o último estudo quando esse comportamento estiver definido no produto. Não colocar um dashboard promocional no caminho da escrita.

### Cadernos e páginas

Usar capas, nomes e matéria para identificação; não depender apenas de cores. Manter índice, título e posição da página compreensíveis. Títulos longos devem continuar acessíveis mesmo quando abreviados visualmente.

Direção definida pelo usuário: páginas com limite de linhas e vários tamanhos selecionáveis para personalização. Quantidades e presets ainda serão escolhidos.

- Distinguir linhas do Markdown de linhas visuais, que variam com fonte, largura, zoom e dispositivo.
- Definir capacidade para texto, títulos, código e mídia futura, além do fluxo ao encher.
- Reduzir o tamanho ou restaurar uma versão maior não pode cortar conteúdo; a criação automática de páginas ainda precisa de decisão.

Manter formato/capacidade junto ao conteúdo privado versionado. Adaptação ao celular não deve alterar silenciosamente a divisão das anotações.

### Editor e salvamento

Priorizar a área de escrita. Markdown direto com prévia foi aprovado para a versão inicial. No celular, alternar edição e prévia pode ser melhor do que comprimir ambas; a composição ainda será definida.

Projetar os estados e a recuperação conforme o fluxo aprovado de salvamento automático e histórico de versões acima.

“Sem conexão” exige detecção apropriada; falha genérica de requisição não prova ausência de internet. Armazenamento local de cadernos privados demanda decisão de privacidade, especialmente em dispositivos compartilhados.

### Progresso sem pressão

Exibir métricas com nomes e períodos explícitos. “Tempo aberto” e “tempo estudado” têm significados diferentes. “Palavras atuais” e “palavras produzidas no período” também. Não inventar histórico com base em um total atual.

Mostrar evolução própria sem punição por pausas, culpa por metas atrasadas ou ranking social automático. Gráficos devem oferecer informação textual equivalente e indicar situações sem dados.

### Metas e privacidade

Metas ficam próximas ao caderno, mas não bloqueiam a escrita. Diferenciar tarefa concluída de caderno concluído.

Quando a publicação existir, mostrar seu alcance: qualquer pessoa pode ler o conteúdo público. Compartilhamento seletivo, se implementado posteriormente, precisa indicar os destinatários. Prévia pública exige verificar quais dados ela expõe. Não mostrar opção de compartilhar antes de existir suporte funcional, salvo protótipo explicitamente identificado.

### Movimento e materialidade

Capas, marcadores e margens podem estabelecer identidade desde o MVP. Virar páginas é um aprimoramento: não deve bloquear navegação, captura de teclado ou seleção de texto. Gestos têm alternativa visível. Com movimento reduzido, manter a mudança de contexto clara sem rotação espacial.

## Decisões que continuam abertas

Quantidades/presets de linhas e fluxo ao encher; navegação das páginas; tags; busca em conteúdo privado; criação e ordenação de páginas; intervalos de salvamento; conflitos; retenção e limites das versões; recuperação e sincronização de chaves; metadados técnicos; publicação de edições futuras; etapa de lançamento da leitura pública; limites multimídia; tema; definições de contagem e tempo; tecnologia; mecanismo criptográfico e permissões sociais futuras.

Feche apenas as decisões necessárias à tarefa atual. Nenhum exemplo desta skill autoriza implementá-las por antecipação.
