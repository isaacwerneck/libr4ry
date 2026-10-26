# Library4

Uma biblioteca pessoal para escrever, organizar ideias e voltar aos seus estudos. O Library4 combina cadernos digitais com uma interface aconchegante de madeira e papel, capas personalizáveis e escrita visual. Controles com relevo retrô, foco de teclado adaptado à superfície e cursor pixelado para mouse complementam texturas próprias em CSS e SVG; a direção visual está em [Direção artística](docs/design-templo.md). No desktop, a entrada e o portal ficam enquadrados na janela, com rolagem interna apenas para conteúdo excedente; em telas de até 720 px, a rolagem da página permanece disponível.

A coleção separa capas e ações, e o perfil apresenta as métricas atuais da biblioteca. O caderno enquadra a folha ativa para escrever, oferece visão inteira e adapta a largura de leitura ao celular sem alterar a divisão das notas.

A entrada ilustrada mostra apenas a marca e a estante. Menus e botões usam rótulos diretos, sem slogans ou setas decorativas; avisos de privacidade, salvamento e funções indisponíveis permanecem visíveis.

## O que você pode fazer

- Criar sua conta e acessar uma biblioteca privada.
- Criar cadernos, organizá-los em estantes e marcar favoritos.
- Escrever e formatar texto diretamente nas folhas, com Markdown disponível como opção avançada.
- Personalizar papel, capas, cores, imagens, fontes e mesa; navegar pelas folhas, editar sua data e ajustar o enquadramento. O índice identifica folhas sem título pelo começo da anotação.
- Salvar suas notas automaticamente e reabri-las depois de entrar e desbloquear a biblioteca.
- Exportar e importar cadernos Markdown, criando outro ou atualizando um existente com confirmação e cópia de segurança.
- Compartilhar o original com amizades aceitas na whitelist e editar em tempo real, com cursores e seleções visíveis.

O social permite publicar uma cópia revisada de texto, buscar pessoas pelo nome, enviar/aceitar convites, conversar com amizades aceitas, remover publicações e bloquear pessoas. Também permite denunciar publicações para revisão manual; administradores autorizados por ID podem encerrar denúncias ou remover o texto público, sem acesso aos cadernos privados. Registros resolvidos expiram após 90 dias.

Cadernos públicos podem ser lidos por qualquer conta autenticada; o dono e as pessoas autorizadas na whitelist podem editar o mesmo original em tempo real. Livros públicos aparecem nos perfis do dono e dos colaboradores autorizados. Cadernos privados aparecem no perfil do dono e nas estantes de quem recebeu acesso, mas não nos perfis dos colaboradores. A blacklist impede leitura mesmo de caderno público. O servidor recebe conteúdo de caderno cifrado, e cada participante usa sua própria chave de conta; mensagens sociais não têm criptografia de ponta a ponta. Exportar/importar Markdown permite criar um caderno ou atualizar um existente após revisar o plano e guardar uma cópia de segurança. Exportações incluem o texto e avisam antes do download.

O destino escolhido é Netlify para o site/API, Render para WebSocket de colaboração e Neon para PostgreSQL, todos inicialmente no plano grátis. As configurações locais estão preparadas, mas nenhum serviço remoto foi criado ou implantado. A política inicial exige 18 anos ou mais; a confirmação do cadastro não comprova a idade e o mecanismo confiável ainda precisa ser definido antes da publicação. O primeiro lançamento dependerá apenas da janela curta de restauração do Neon, sem cópia independente. A [página de privacidade e contato](public/privacy.html) identifica o responsável. Favicon e imagem de compartilhamento acompanham o pacote público. O Markdown usa a versão corrigida 15.0.3.

## Executar localmente

Requer **Node.js 24 ou superior** e **PostgreSQL**.

1. Instale as dependências:

   ```sh
   npm install
   ```

2. Copie [.env.example](.env.example) para `.env` e configure `DATABASE_URL` com um banco PostgreSQL acessível. `PORT` define a porta da aplicação; o padrão é `8000`.
3. Prepare o banco e inicie a aplicação:

   ```sh
   npm run db:migrate
   npm start
   ```

Abra [http://127.0.0.1:8000](http://127.0.0.1:8000/). O servidor aceita conexões locais; essa configuração não é uma implantação pública.

Para configurar uma instância PostgreSQL local pelo script do projeto, consulte [Configuração e desenvolvimento](docs/desenvolvimento.md).

## Começar a usar

1. Crie uma conta e defina sua **senha de conteúdo**, separada da senha de login.
2. Entre e desbloqueie sua biblioteca. Aguarde a resposta antes de tentar novamente; os formulários bloqueiam operações simultâneas e, em caso de erro, liberam os controles e recuperam o foco usado no envio, sem interromper a navegação para outro controle. Na home, escolha **Estantes**.
3. Use **Novo caderno** para definir nome, matéria e estantes. Se o envio falhar, tente novamente na mesma aba: a criação pendente é retomada sem duplicar o caderno. A saída da conta pede concluir essa tentativa antes de encerrar.
4. Abra o caderno, escreva nas folhas e use as ferramentas de texto e personalização. Os campos de escrita são identificados pelo número da página para acessibilidade; **Ler** os torna somente leitura. **Versões** confirma as edições antes de abrir e descarta a abertura se você trocar de folha durante a consulta.
5. Aguarde o estado **Salvo** antes de encerrar. A limpeza do rascunho confirmado preserva edições protegidas durante esse intervalo. Estados de salvamento só atualizam o texto quando mudam; avisos temporários não bloqueiam a navegação. Ao voltar, entre e desbloqueie novamente para acessar suas notas.

Você também pode [experimentar a prévia sem conta](http://127.0.0.1:8000/?preview=1). **A prévia não salva:** seu conteúdo é perdido ao recarregar ou fechar a aba.

Veja os controles e atalhos no [Guia de uso](docs/uso.md).

## Privacidade

Notas, capas e metadados dos cadernos são criptografados no navegador antes de serem armazenados. A senha de conteúdo desbloqueia suas chaves e não é enviada ao servidor. Informações de conta, como nome e e-mail, são armazenadas para autenticação. No social, o nome é pesquisável e o e-mail não é exposto. Publicações confirmadas são visíveis a contas autenticadas. Mensagens exigem amizade aceita e autorização dos participantes; são armazenadas no servidor sem criptografia de ponta a ponta.

**Guarde sua senha de conteúdo:** atualmente não existe recuperação administrativa das notas caso ela seja esquecida. A recuperação da senha da conta por e-mail usa Resend quando configurado; ela não recupera a senha de conteúdo. O plano escolhido para o primeiro lançamento depende somente da janela curta de restauração do Neon e não inclui uma cópia independente. Detalhes em [Banco e proteção dos dados](docs/banco-de-dados.md).

## Desenvolvimento

HTML, CSS e JavaScript no navegador; Node.js e PostgreSQL no servidor. O editor visual usa Tiptap, com empacotamento por esbuild.

```sh
npm run build
npm run check
npm test
```

`check` verifica sintaxe JavaScript. Os testes de integração usam PostgreSQL; sem `DATABASE_URL`, essa parte é pulada explicitamente. A suíte também confere se falhas de conexão encerram os testes com erro, sem travar o processo. Consulte [Configuração e desenvolvimento](docs/desenvolvimento.md) antes de rodá-los.

## Documentação

Toda a documentação do aplicativo está em [docs/](docs/README.md): guia de uso, configuração, proposta, requisitos, banco, design, contexto e histórico de implementação.
