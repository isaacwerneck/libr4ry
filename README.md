# Library4

Uma biblioteca pessoal para escrever, organizar ideias e voltar aos seus estudos. O Library4 combina cadernos digitais com uma interface aconchegante de madeira e papel, capas personalizáveis e escrita visual. Controles com relevo retrô e cursor pixelado para mouse complementam texturas próprias em CSS e SVG; a direção visual está em [Direção artística](docs/design-templo.md). No desktop, a entrada e o portal ficam enquadrados na janela, com rolagem interna apenas para conteúdo excedente; em telas de até 720 px, a rolagem da página permanece disponível.

A coleção separa capas e ações, e o perfil apresenta as métricas atuais da biblioteca. O caderno enquadra a folha ativa para escrever, oferece visão inteira e adapta a largura de leitura ao celular sem alterar a divisão das notas.

A entrada ilustrada mostra apenas a marca e a estante. Menus e botões usam rótulos diretos, sem slogans ou setas decorativas; avisos de privacidade, salvamento e funções indisponíveis permanecem visíveis.

## O que você pode fazer

- Criar sua conta e acessar uma biblioteca privada.
- Criar cadernos, organizá-los em estantes e marcar favoritos.
- Escrever e formatar texto diretamente nas folhas, com Markdown disponível como opção avançada.
- Personalizar papel, capas, cores e imagens; navegar pelas folhas e ajustar o enquadramento.
- Salvar suas notas automaticamente e reabri-las depois de entrar e desbloquear a biblioteca.

O projeto está em desenvolvimento e funciona localmente. Perfil tem informações básicas da conta e da biblioteca; as interfaces sociais estão preparadas, mas publicações, amizades e mensagens ainda não estão disponíveis.

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
2. Entre e desbloqueie sua biblioteca. Na home, escolha **Estantes**.
3. Use **Novo caderno** para definir nome, matéria e estantes.
4. Abra o caderno, escreva nas folhas e use as ferramentas de texto e personalização.
5. Aguarde o estado **Salvo** antes de encerrar. Ao voltar, entre e desbloqueie novamente para acessar suas notas.

Você também pode [experimentar a prévia sem conta](http://127.0.0.1:8000/?preview=1). **A prévia não salva:** seu conteúdo é perdido ao recarregar ou fechar a aba.

Veja os controles e atalhos no [Guia de uso](docs/uso.md).

## Privacidade

Notas, capas e metadados dos cadernos são criptografados no navegador antes de serem armazenados. A senha de conteúdo desbloqueia suas chaves e não é enviada ao servidor. Informações de conta, como nome e e-mail, são armazenadas para autenticação.

**Guarde sua senha de conteúdo:** atualmente não existe recuperação administrativa das notas caso ela seja esquecida. Recuperação de conta e backup operacional ainda estão pendentes. Detalhes em [Banco e proteção dos dados](docs/banco-de-dados.md).

## Desenvolvimento

HTML, CSS e JavaScript no navegador; Node.js e PostgreSQL no servidor. O editor visual usa Tiptap, com empacotamento por esbuild.

```sh
npm run build
npm run check
npm test
```

`check` verifica sintaxe JavaScript. Os testes de integração usam PostgreSQL; sem `DATABASE_URL`, essa parte é pulada explicitamente. Consulte [Configuração e desenvolvimento](docs/desenvolvimento.md) antes de rodá-los.

## Documentação

Toda a documentação do aplicativo está em [docs/](docs/README.md): guia de uso, configuração, proposta, requisitos, banco, design, contexto e histórico de implementação.
