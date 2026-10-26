# Requisitos funcionais — Library4

Atualização RF-M03 (15/10/2026): recuperação da senha da conta implementada por e-mail via Resend, condicionada à configuração do provedor. Link único de 30 minutos, cotas e revogação de sessões; não altera nem recupera a senha de conteúdo. Esta entrega substitui referências anteriores a recuperação de login pendente. Entrega externa e operação na hospedagem ainda precisam de validação.

[← Documentação](README.md) · [Guia de uso atual](uso.md)

Base: [proposta](proposta.md). Status: especificação para implementação, não checklist de funcionalidades existentes. As sugestões de política permanecem em aberto até serem confirmadas.

## 1. Atores e fronteiras

- **Proprietário:** cria e modifica seu material; desbloqueia conteúdo privado no dispositivo.
- **Visitante:** lê somente uma publicação pública disponível; não acessa versões privadas nem edita.
- **Administrador:** opera contas e infraestrutura; não recebe acesso legível ao conteúdo privado.

Atualização de 14/10/2026: o proprietário incluiu publicações, amizades e conversas no lançamento. A implementação atual publica cópias de texto para contas autenticadas, com revisão e consentimento explícitos; não libera biblioteca ou estatísticas privadas. Busca por nome, convites com aceite, remoção de amizade, bloqueio e conversas entre amizades aceitas funcionam pela API e PostgreSQL. Mensagens não têm criptografia de ponta a ponta. RF-P01 anônimo e compartilhamento de caderno inteiro/whitelist continuam sendo propostas distintas; não confundir com o feed autenticado entregue. Recuperação de login segue pendente e não é anunciada como disponível.

## 2. Requisitos do MVP

| ID | Funcionalidade | Critério de aceite |
| --- | --- | --- |
| RF-M01 | Cadastro | Conta criada com identificação válida e sem duplicidade conforme normalização definida; falhas são explicadas sem expor dados de terceiros. |
| RF-M02 | Login, sessão e logout | Usuário acessa seu ambiente; sessão inválida não permite operações; logout remove o acesso ativo e material de desbloqueio em memória conforme política definida. |
| RF-M03 | Recuperar acesso | Recuperação de login tem fluxo definido; a interface diferencia recuperar conta de recuperar chaves. |
| RF-M04 | Criar/desbloquear proteção privada | Um caderno escrito no dispositivo pode ser reaberto pelo proprietário; leitura direta do SQL e backups não revela seu conteúdo ou chaves legíveis. |
| RF-M05 | Recuperar proteção em outro dispositivo | O meio de recuperação aprovado permite desbloquear o material em um navegador novo, sem fornecer ao servidor o segredo de descriptografia; perda de todos os meios tem consequência informada. |
| RF-M06 | Entrada sem tutorial obrigatório | Conta nova encontra a ação de criar caderno; conta existente consegue abrir seus cadernos sem onboarding compulsório. |
| RF-M07 | Criar/listar/editar caderno | Nome, matéria e tags seguem validações definidas; somente o proprietário altera o caderno; metadados de conteúdo ficam criptografados. |
| RF-M08 | Criar/listar/abrir páginas e selecionar tamanho/fonte | Pequeno, médio e grande; fonte ajustável; ao exceder capacidade, criar automaticamente páginas seguintes preservando texto e cursor. Redução de tamanho e restauração não descartam texto. Título, formato e conteúdo ficam protegidos. |
| RF-M09 | Escrever Markdown com prévia | Texto, títulos, ênfase, listas, links e código da sintaxe definida são editáveis e renderizados com segurança; conteúdo longo não é cortado. |
| RF-M10 | Salvar automaticamente | Alterações são enviadas durante uso ativo sem botão obrigatório; estados pendente/enviando/salvo/erro correspondem à persistência real; espera máxima é definida antes de implementar. |
| RF-M11 | Reabrir conteúdo persistido | Após confirmação de salvamento, reabrir a conta/caderno/página recupera exatamente a versão confirmada. |
| RF-M12 | Tratar falhas e conflitos | Falha não descarta o buffer de escrita; edição simultânea de duas abas não provoca sobrescrita silenciosa; uma confirmação antiga não marca alterações novas como salvas. |
| RF-M13 | Consultar versões recentes | Proprietário lista checkpoints retidos e visualiza o conteúdo anterior; terceiros não leem suas versões. |
| RF-M14 | Restaurar uma versão | Restauração cria uma nova revisão; conteúdo anteriormente atual continua recuperável dentro da retenção; operação pode ser repetida após timeout sem duplicar a mesma mutação. |
| RF-M15 | Metas simples | Criar/editar tarefa, concluir e reabrir funciona no caderno; descrição e conclusão privadas não ficam legíveis no SQL; metas não bloqueiam escrita. |
| RF-M16 | Métricas atuais | Caderno mostra páginas com conteúdo, palavras e tarefas concluídas conforme definição documentada; edição, conclusão e restauração atualizam corretamente os totais. |
| RF-M17 | Resumo simples da conta | O usuário consegue visualizar totais dos cadernos carregados/desbloqueados; a interface não apresenta total parcial como completo. |

RF-M04/M05 exigem especificação de chaves e recuperação antes do desenvolvimento. Não adiar criptografia mantendo conteúdo legível no MVP.

Revisão aprovada de RF-M08/M09: edição visual padrão, sem sintaxe aparente; fonte Markdown é acesso avançado. Seleção permite formatação/fonte/tinta/tamanho diretamente, com undo/redo; notas abertas sem edição não têm a fonte regravada. Edição visual normaliza sintaxe/espaços. Ponta da folha aceita clique/arraste; Ctrl+roda e Ctrl+arraste esquerdo manipulam somente o enquadramento do caderno. Capa/contracapa não criam páginas falsas. Personalização separada inclui cor e acabamento cifrados. Falha de exportação visual conserva o buffer e apresenta pendência, sem alegar salvamento. Implementação e limites em [passo a passo](passo-a-passo.md#entrega-da-revisão-integrada-do-caderno--10102026).

### Estado de implementação local — 07/10/2026

Senha de conteúdo separada foi aprovada e integrada a cadastro/login/desbloqueio. Ela protege a chave raiz no navegador, não é transmitida nem persistida e é exigida novamente após recarregar. RF-M05 usa essa mesma senha em outro navegador; não há código de recuperação ou recuperação administrativa se ela for esquecida.

O fluxo de cadernos/páginas, Markdown/prévia, autosave, reabertura, versões/restauração, metas e métricas atuais está conectado ao SQL. Conflito mantém o rascunho na aba e oferece cópia em outro caderno. `/?preview=1` é um modo separado sem persistência. Cinco testes automatizados e verificação manual no navegador registradas no [andamento](passo-a-passo.md).

RF-M03 (recuperação de login) continua pendente, assim como rascunhos criptografados persistentes após crash e validação final da divisão de blocos Markdown. Não considerar todos os critérios de conclusão do MVP atendidos só porque o fluxo principal funciona. Limites locais iniciais: 500 páginas, 100 metas e 50 versões por página; não há garantia de período de retenção.

## 3. Condições transversais de aceite

Atualização de 10/10/2026: snapshots cifrados persistentes e recuperação foram implementados, com limites de origem/porta, quota e transações documentados. Organização básica permite várias estantes por caderno, favoritos, recentes e busca local de metadados; tamanho inicial é selecionável na criação. A matriz atual de entregas e pendências está em [passo-a-passo](passo-a-passo.md#plano-original-controle-de-escopo--10102026). O estado de 07/10 acima é histórico; RF-M03, backup/restauração operacional e validação final continuam pendentes.

- Autorização verifica proprietário em cada operação; IDs enviados pelo cliente não dão acesso por si só.
- Conteúdo privado não aparece em respostas de terceiros, URLs, logs, métricas operacionais ou relatórios de erro.
- Markdown e URLs são entrada não confiável; prévia não executa scripts inseridos pelo usuário.
- Tela estreita, teclado, foco, zoom e movimento reduzido são verificáveis no fluxo principal.
- Servidor valida formato, tamanho e relações das requisições criptografadas; não pode validar o significado do texto que não lê.
- Banco/storage/backups usam proteção operacional e comunicação segura além da criptografia no cliente.
- Não prometer rascunho persistente após fechar/crash até definir e implementar armazenamento local seguro. Texto não confirmado é identificado como pendente.
- Lint/testes existentes são executados nas mudanças aplicáveis. Recuperação de backup é ensaiada antes do lançamento.

## 4. Produto após o MVP

| ID | Entrega | Critério principal | Dependência |
| --- | --- | --- | --- |
| RF-P01 | Publicar caderno para qualquer visitante | Ação explícita publica somente conteúdo escolhido; visitante lê sem conta e não edita; nenhuma chave privada é revelada. | Aprovar fase e comportamento de publicação. |
| RF-P02 | Retirar publicação | Acesso público na plataforma é retirado; caches sob controle do serviço seguem política definida; limitações sobre cópias externas são comunicadas. | RF-P01. |
| RF-P03 | Imagens e áudio/MP3 | Upload, abertura e associação com página funcionam dentro de limites; anexo privado é criptografado antes do envio. | Storage, formatos e quotas definidos. |
| RF-P04 | Buscar cadernos e páginas | Resultados de texto/títulos/tags/matéria respeitam privacidade; informar o alcance se somente parte do material estiver carregada. | Estratégia local e escala definidas. |
| RF-P05 | Histórico de produção | Eventos registrados desde a ativação geram evolução por período; exclusões não apagam passado e restaurações não inflam produção. | Fórmula, timezone, eventos e retenção definidos. |
| RF-P06 | Tempo aberto e estudo | Indicadores separados, com tratamento de inatividade e múltiplas abas; não inferir estudo apenas da aba aberta. | Política de sessão/timer definida. |
| RF-P07 | Dashboards completos | Caderno e conta exibem períodos, unidades, comparação própria e estado sem dados; gráficos têm alternativa textual. | RF-P05/P06 quando exibidos. |
| RF-P08 | Personalizar cadernos | Capas, cores e estilos podem mudar depois da criação; permanecem legíveis e não alteram o significado dos controles. | Direção visual e assets definidos. |
| RF-P09 | Virar páginas e transições | Movimento funciona sem bloquear escrita; possui alternativa por controle/teclado e versão de movimento reduzido. | Comportamento das páginas aprovado. |
| RF-P10 | Amigos e perfis | Solicitação, aceitação e remoção seguem regras claras; amizade não concede conteúdo privado automaticamente. | Modelo social definido. |
| RF-P11 | Compartilhamento seletivo | Proprietário escolhe página/caderno/estatística e destinatário; revogação impede acesso futuro servido pelo sistema. | Modelo de permissões e distribuição de chaves aprovado. |

Publicação pode anteceder multimídia se essa prioridade for confirmada; amigos não são pré-requisito da leitura pública. Histórico de atividade começa a ser medido quando os eventos forem implementados, sem inventar passado a partir das versões.

## 5. Decisões necessárias

| Tema | Definir antes de |
| --- | --- |
| Validar capacidade e divisão de blocos Markdown | Editor final; presets pequeno/médio/grande, fonte ajustável e continuação automática aprovados. Referência inicial: 24/36/48 linhas na fonte 16. |
| Campos obrigatórios, limites e ordenação | Formulários e validação. |
| Auth, sessão e recuperação | Fundação de contas. |
| Algoritmos, envelopes, proteção e recuperação de chaves | Primeiro conteúdo privado persistido. |
| Debounce, espera máxima, retry, conflitos e buffer local | RF-M10/M12. |
| Retenção de versões por tempo/quantidade e checkpoints | RF-M13/M14; nenhuma duração já foi aprovada. |
| Contagem de palavras/conteúdo/produção e restauração | Métricas respectivas. |
| Publicação estática ou atualização automática | RF-P01. |
| Exclusão de conta/caderno/página, lixeira e backups | Operações destrutivas; não implementá-las implicitamente. |

## 6. Definição de MVP concluído

RF-M01 a RF-M17 funcionam com dados reais de teste e critérios transversais atendidos. Duas contas não acessam o material uma da outra; o proprietário recupera o conteúdo em nova sessão/dispositivo pelo mecanismo aprovado; falha de rede, timeout, duas abas e restauração não causam perda silenciosa.

A inspeção do armazenamento não encontra texto privado legível. O usuário consegue estudar no celular e por teclado. Políticas de salvamento, histórico, recuperação e metadados visíveis estão documentadas. Publicação e recursos futuros não aparecem como entregues enquanto não forem implementados.
