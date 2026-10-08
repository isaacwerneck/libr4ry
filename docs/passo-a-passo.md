# Passo a passo da reconstrução — Library4

Base: [proposta](proposta.md), [requisitos](requisitos-funcionais.md) e [banco SQL](banco-de-dados.md). Sequência de trabalho, sem estimativa de prazo inventada. Cada etapa termina com um resultado verificável antes da seguinte.

## Andamento real — 07/10/2026

- Projeto antigo e estudos preservados em `tmp/library4-before-rebuild.tar`; substituição autorizada pelo usuário, `.git` preservado.
- Stack HTML/CSS/JavaScript, Node.js, PostgreSQL aprovada; `pg` e `markdown-it` aprovados e instalados. PostgreSQL local separado criado; migração executável aplicada.
- API de contas/sessões, cadernos privados, gravação atômica com revisão/idempotência e consulta de versões implementada. Testes reais de isolamento, conflitos e repetição passaram; criptografia e paginação também.
- Senha de conteúdo separada aprovada e implementada. Cadastro protege raiz no navegador; login abre desbloqueio; senha incorreta falha; recarregar exige a senha novamente. Senha de conteúdo não é enviada nem persistida.
- Interface conectada: criar/editar caderno, páginas, Markdown/prévia, autosave, reabertura, histórico/restauração, metas e métricas atuais. `/?preview=1` permanece uma demonstração separada sem salvamento.
- Autosave usa lote imutável e idempotente; edição durante envio fica pendente. Conflito mantém o rascunho e oferece cópia em outro caderno; logout salva antes de sair. Não há rascunho persistente após crash.
- Cinco testes automatizados passaram, incluindo PostgreSQL real, senha de conteúdo e timeout/edição durante envio. Navegador verificou login, desbloqueio, rejeição de senha incorreta, reabertura, restauração, edição de caderno, leitura Markdown, conflito entre duas abas, cópia do rascunho e logout. Inspeção SQL não encontrou senha de conteúdo/texto legíveis nos envelopes; conta descartável removida.
- Para concluir o MVP: recuperação de login, rascunhos criptografados persistentes, revisão semântica da paginação/validação visual e ensaio operacional de backup. Recuperação da senha de conteúdo por admin não faz parte do modelo.

## 1. Preservar o projeto atual e fechar o escopo

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
