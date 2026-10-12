# Library4 — Proposta de reconstrução

Atualizado em 10/10/2026. Reconstrução local iniciada; este documento define o produto. Andamento real registrado no [passo a passo](passo-a-passo.md), sem tratar requisitos como funcionalidades entregues.

Documentos associados: [requisitos](requisitos-funcionais.md), [modelo SQL](banco-de-dados.md) e [passo a passo](passo-a-passo.md).

## 1. Visão e propósito

Plataforma web para organizar estudos, escrever e acompanhar a própria evolução. O Library4 deve ser um lugar pessoal, acolhedor e permanente, com a experiência de abrir um caderno, escrever, guardar e voltar outro dia.

O núcleo é: **escrever → guardar → voltar → acompanhar → perceber progresso**. A proposta combina cadernos digitais, páginas Markdown, metas, métricas, busca e, posteriormente, multimídia, personalização e recursos sociais.

O progresso deve ser visível sem transformar estudo em competição obrigatória: perceber o crescimento de um caderno, encontrar o material produzido e acompanhar metas pessoais.

## 2. Experiência inicial e identidade

Direção revisada: depois de login e desbloqueio, abrir a Home com perfil, coleção e acesso social; retomar diretamente um caderno aberto nas últimas 24 horas. Definir o marco temporal e a sincronização entre dispositivos. No primeiro acesso, oferecer a criação do primeiro caderno, sem tutorial obrigatório. Recursos sociais continuam sujeitos ao escopo da seção 12.

A [direção artística consolidada](design-templo.md) orienta a próxima revisão: mesa de madeira, caderno físico central, conforto, personalização e progresso sem pressão. Pixel art é uma alternativa a comparar. O documento distingue decisões de funcionamento ainda abertas e não representa funcionalidades entregues.

Controles claros, ações importantes acessíveis, leitura confortável e interface intuitiva. A identidade de caderno aparece desde o MVP por composição, capas ou marcadores simples. Animações complexas e personalização avançada não são pré-requisitos da escrita.

Decisão complementar aprovada: escrever na folha com os efeitos aplicados, sem exigir conhecimento de Markdown; manter a fonte como opção avançada e formato privado. Ferramentas de seleção ficam diretas ao lado, personalização separada. Manipulação por Ctrl+roda/Ctrl+arraste esquerdo, virada por ponta arrastável e estados de capa/contracapa reforçam o caderno sem aumentar contagem de páginas. Cor/acabamento personalizáveis; desenhos complexos de capa continuam evolução posterior. Tiptap/extensões e esbuild foram aprovados para esta integração.

A interface deve adaptar a composição ao celular, permitir teclado e zoom e respeitar preferência por movimento reduzido. A skill `library4-design` orienta a direção visual e a validação.

## 3. Contas

Cadastro, login, sessão autenticada e recuperação de acesso desde o início. Cada usuário tem seus próprios cadernos. Autorização no servidor deve impedir acesso às entidades de outro proprietário.

Recuperação de conta e recuperação de chaves de conteúdo são processos distintos. Não prometer ao usuário que redefinir o login recupera automaticamente um caderno criptografado.

## 4. Cadernos

Múltiplos cadernos por usuário. A revisão pede nome, matéria/tags e tamanho na criação, com demais opções preenchidas pelo caderno padrão da pessoa. Especificar campos, obrigatoriedade e limites antes da implementação. Personalização pode ser acessada depois da criação. A coleção terá estantes, recentes e favoritos; falta definir se um caderno pertence a uma ou várias estantes.

Exemplos de cadernos: Programação, Design, Matemática, Inglês e projetos pessoais. Cada caderno reúne páginas independentes, metas opcionais e seus próprios indicadores.

## 5. Páginas com tamanhos selecionáveis

Direção aprovada: páginas pequenas, médias e grandes, fonte ajustável e criação automática da próxima ao atingir capacidade.

- Implementação inicial: 24/36/48 linhas de referência na fonte 16 e largura monoespaçada lógica de 64 colunas, ajustadas pela fonte. Valores iniciais revisáveis, não escolhidos pelo usuário. A contagem é estável entre dispositivos e não equivale à altura dos blocos Markdown renderizados.
- Definir o espaço ocupado por títulos, listas, código e, futuramente, imagens/áudio. Contar somente quebras no Markdown não garante aparência de folha preenchida.
- Ao exceder o limite, continuar automaticamente em novas páginas preservando todos os caracteres. O mesmo vale ao diminuir tamanho ou aumentar fonte. A divisão inicial do texto-fonte pode separar blocos Markdown; tratamento semântico de blocos ainda precisa de validação antes de concluir o editor.
- Mudar para um tamanho menor não pode cortar conteúdo; redimensionamento e restauração de uma versão maior precisam de tratamento sem perda.

O modelo SQL mantém páginas como documentos lógicos e registra o formato/capacidade no payload privado versionado. A apresentação pode adaptar-se ao dispositivo sem redistribuir automaticamente o conteúdo entre páginas apenas por mudar a largura da tela.

## 6. Editor

Decisão aprovada: escrita direta em Markdown com prévia. Suporte inicial a texto, títulos, ênfase, listas, links e blocos de código. A sintaxe suportada e o comportamento de edição/prévia precisam ser documentados na implementação.

Revisão artística: selecionar trechos e mudar fontes como no Word foi solicitado. Markdown puro não representa fontes por trecho; definir editor visual, formato persistido e relação com Markdown antes de implementar. A implementação atual permanece Markdown com prévia. Imagens, áudio, MP3 e outros arquivos são etapas posteriores. Drag-and-drop e atalhos adicionais não estão definidos. Conteúdo e URLs não confiáveis precisam de tratamento seguro na renderização.

## 7. Salvamento automático contínuo

O usuário não depende de botão salvar. Implementação local agrupa mudanças após aproximadamente 900 ms sem edição e envia durante escrita contínua em até cerca de 5 s, sujeito ao navegador/conexão. Novas tentativas após falha usam o mesmo lote idempotente a cada cerca de 5 s; conflito exige ação explícita e preserva o rascunho na aba.

Fluxo: editar → indicar alterações pendentes → enviar → confirmar persistência da versão enviada → indicar salvo apenas quando o conteúdo atual estiver confirmado.

Uma confirmação antiga não confirma texto novo. Em falha ou conflito, preservar alterações e oferecer recuperação sem sobrescrita silenciosa. Salvar apenas ao fechar a aba não atende ao requisito. O escopo de recuperação após fechar o navegador e o armazenamento local seguro ainda precisam ser fechados.

## 8. Histórico recente de versões

Cada página deve permitir consultar versões recentes e restaurar conteúdo. Restauração gera uma nova versão, preservando a versão que estava atual, dentro da política de retenção.

Histórico de versões e histórico de produção são diferentes. Implementação local retém as últimas 50 versões por página; cada salvamento que altera a página gera uma versão, sem garantia de período. Restauração cria nova revisão. Versões privadas mantêm a criptografia do conteúdo atual. Avaliar checkpoints mais espaçados antes de uso amplo.

## 9. Metas

Área opcional integrada ao caderno para criar, editar, concluir e reabrir tarefas. Ela não bloqueia a escrita. O MVP inclui tarefas simples; metas com prazos, recorrência ou recursos avançados ficam para depois.

## 10. Métricas e dashboards

MVP: páginas com conteúdo, palavras atuais e tarefas concluídas por caderno, com resumo simples. Contagens da conta podem somar os cadernos desbloqueados, sem montar um dashboard complexo.

Definir contagem de palavras, conteúdo significativo e tratamento de Markdown antes de implementar. Separar estado atual de produção histórica: apagar ou restaurar texto muda o estado atual, mas não reescreve silenciosamente o passado. Restauração não deve contar automaticamente como nova produção.

O histórico diário ganhou importância na revisão: consultar no perfil os dias de escrita, quais cadernos foram usados e quanto foi produzido. Definir o significado de “páginas escritas” sem inflar produção por mudanças de fonte/tamanho ou restauração. Ainda não implementado. Produção por semana/mês, linhas, tempo e dashboards completos dependem de definição própria. Tempo aberto não prova estudo; definir timezone, sessões inativas e metodologia antes de exibir números históricos.

## 11. Privacidade e criptografia

- **Privado, padrão:** somente o proprietário pode ler o conteúdo. O administrador não possui uma chave para descriptografar os dados armazenados.
- **Público:** qualquer pessoa pode ler o conteúdo publicado, inclusive sem conta. Somente o proprietário pode editar. Histórico de versões e estatísticas pessoais não são publicados implicitamente.

Conteúdo privado é criptografado no dispositivo antes do envio e descriptografado nele. Servidor, SQL, storage e backups guardam dados protegidos, sem material suficiente para desbloqueá-los autonomamente. Criptografia de disco com chave disponível ao serviço não basta.

Proteger textos, títulos, matérias, tags, metas, anexos, versões e métricas privadas. Identificar os metadados operacionais que continuam visíveis, como conta proprietária, identificadores, tamanhos, ordem e horários. O requisito não é anonimato de toda atividade.

Busca e métricas sobre conteúdo privado precisam respeitar esse modelo; processamento local é a proposta inicial. Não enviar texto legível a logs, telemetria ou ferramentas administrativas. O servidor não consegue conferir semanticamente contagens de texto que não pode ler.

Definir criação, proteção, recuperação, troca e sincronização das chaves, incluindo vários dispositivos. Se todos os meios de desbloqueio forem perdidos, o suporte não pode inventar uma recuperação. Nenhum segredo conhecido pelo servidor pode ser o único meio de proteger a chave privada.

O modelo protege o conteúdo armazenado contra leitura administrativa. Código adulterado entregue ao navegador ou dispositivo comprometido pode capturar conteúdo durante o uso; isso precisa entrar no modelo de ameaças, sem promessa de proteção absoluta. Referências: [OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html) e [W3C](https://www.w3.org/TR/webcrypto/#security-considerations).

## 12. Publicação e recursos sociais

A escolha privado/público está aprovada para o produto; o MVP inicial será somente privado, conforme aprovação na conversa. Proposta futura: publicar uma cópia explicitamente escolhida, separada do material privado. Novas edições exigiriam republicação; esse comportamento precisa de aprovação.

Tornar público explica o alcance antes da confirmação. Voltar a privado retira o acesso público servido pela plataforma, mas não elimina cópias feitas por visitantes. Nunca disponibilizar a chave privada do caderno para viabilizar leitura pública.

Amigos, perfis, compartilhamento seletivo de páginas ou cadernos e estatísticas compartilhadas são posteriores. Regras detalhadas de acesso social ainda não estão aprovadas.

## 13. Busca e armazenamento

Markdown é o formato conceitual de conteúdo; isso não obriga guardar cada página como arquivo `.md` no servidor. SQL pode guardar envelopes criptografados e relações. Multimídia futura fica em storage, com referências SQL e a mesma política de proteção.

Busca por texto, título, tags e matéria está na visão do produto. Para cadernos privados, busca local é a proposta inicial; escalabilidade e indexação serão avaliadas sem copiar conteúdo legível para o backend. Exportação Markdown é uma extensão possível, não um requisito já aprovado do MVP.

## 14. Escopo e ordem

O MVP entrega conta → caderno → página → Markdown/prévia → salvamento constante → retorno → recuperação recente, com metas e métricas básicas. Cadernos privados seguros são requisito do MVP, não uma melhoria posterior.

Após o núcleo, a revisão artística prioriza a experiência física do caderno e o reconhecimento do progresso. A sequência de personalização, animações, histórico diário, multimídia e recursos sociais será refinada após as decisões do editor e a comparação visual; esses requisitos não estão todos entregues no MVP atual. A publicação básica tem prioridade própria a fechar, sem depender obrigatoriamente de amigos.

Requisitos e critérios de aceite estão em [requisitos-funcionais.md](requisitos-funcionais.md); sequência e condições de conclusão em [passo-a-passo.md](passo-a-passo.md).

## 15. Tecnologia e decisões pendentes

Stack local aprovada: HTML/CSS/JavaScript, Node.js e PostgreSQL. `pg` e `markdown-it` aprovados e instalados. Netlify, Render e Neon continuam apenas candidatos; hospedagem não foi contratada.

Migração inicial aplicada em PostgreSQL 17.5 local separado. Login usa scrypt; sessão usa cookie HttpOnly/SameSite; conteúdo usa envelopes AES-GCM via Web Crypto. Senha de conteúdo separada aprovada e integrada: PBKDF2/SHA-256/600.000 protege a raiz somente no navegador, sem transmitir a senha. Referências: [Web Crypto/MDN](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveKey) e [parâmetros PBKDF2/OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).

Cadastro, login, desbloqueio, autosave, reabertura e restauração já estão conectados à interface local. Pendências: recuperação de login; rascunhos criptografados persistentes após crash; paginação semântica de Markdown; publicação; busca; exclusão e backups operacionais. Revisão do caderno, gravação atômica e identificador de mutação protegem contra sobrescrita/repetição; conflito permite preservar cópia do rascunho.

## 16. Chaves e whitelist

Hash de senha verifica login, mas não recupera conteúdo. Uma chave aleatória cifra o caderno e é guardada protegida por uma chave que o navegador desbloqueia; o servidor guarda envelopes sem segredo de leitura. Na whitelist futura, cada destinatário recebe um envelope que somente ele desbloqueia. Revogar acesso exige definir rotação de chaves para conteúdo futuro e não desfaz cópias já obtidas.

No MVP só o proprietário tem acesso. Escolha aprovada: senha separada do conteúdo, não lembrada pelo app e exigida novamente ao recarregar ou em outro navegador. Cadastro confirma a senha e informa que esquecê-la impede recuperar os cadernos. Não há código de recuperação nem chave administrativa neste fluxo; trocar/redefinir login não recupera conteúdo sem essa senha.
