# Contexto do projeto

Reconstrução local iniciada do zero com autorização do proprietário. Projeto anterior preservado em `tmp/library4-before-rebuild.tar`.

Fonte principal de produto: [docs/proposta.md](docs/proposta.md). Implementar conforme [requisitos funcionais](docs/requisitos-funcionais.md), [modelo SQL proposto](docs/banco-de-dados.md) e [passo a passo](docs/passo-a-passo.md).

Decisões aprovadas: ambiente web de estudo com identidade de caderno; contas; múltiplos cadernos/páginas; Markdown com prévia; autosave contínuo; versões recentes; metas e métricas atuais. MVP somente privado. Publicação e whitelist de destinatários entram depois.

Conteúdo privado é criptografado no dispositivo, sem chave legível disponível ao administrador/servidor, inclusive metadados de conteúdo, versões e anexos. Login e recuperação de chaves são distintos. Não enfraquecer esse requisito para simplificar busca ou métricas.

Páginas pequenas, médias e grandes, fonte ajustável e criação automática da próxima ao exceder a capacidade, preservando texto. Parâmetros iniciais revisáveis: 24/36/48 linhas de referência na fonte 16, ajustadas pela fonte, em largura lógica estável entre dispositivos. Nunca cortar conteúdo ao reduzir tamanho ou aumentar fonte.

Stack aprovada: HTML/CSS/JavaScript, Node.js e PostgreSQL; `pg` e `markdown-it` aprovados. Consultar antes de adicionar outra dependência. Cadastro/login/desbloqueio, cadernos, autosave, reabertura e restauração conectados ao banco; somente `/?preview=1` é prévia sem persistência. "Salvo" exige confirmação da versão atual. Recuperação de login, rascunhos persistentes e backup operacional ainda pendentes.

Desbloqueio aprovado: senha de conteúdo separada do login, usada somente no navegador e solicitada novamente ao recarregar. PBKDF2/SHA-256/600.000 com salt aleatório protege a raiz via AES-GCM. Não guardar senha/chave legível no servidor ou armazenamento local. Esquecimento da senha de conteúdo não tem recuperação administrativa; não há código de recuperação neste fluxo. Hash de login não é chave reversível. Compartilhamento futuro protege a chave para cada destinatário.

Autosave: agrupamento de aproximadamente 900 ms, espera máxima de cerca de 5 s durante escrita contínua, retry após 5 s em falha; lote idempotente preservado após timeout. Conflito mantém rascunho na aba e permite salvar cópia em outro caderno. Rascunhos não confirmados ainda não sobrevivem a crash. Limites locais: 500 páginas e 100 metas por caderno; retenção de 50 versões por página, sem garantia temporal.

Usar `library4-design` e PonyTail. Nova direção: ateliê editorial, verde profundo, papel claro, tipografia expressiva e acentos lima. Preservar acessibilidade, dados e clareza dos estados. Atualizar documentos conforme entregas reais.
