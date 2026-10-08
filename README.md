# Library4

Ambiente pessoal de estudo com cadernos, páginas Markdown e conteúdo privado criptografado no navegador. Reconstrução iniciada do zero. Stack aprovada: HTML/CSS/JavaScript, Node.js e PostgreSQL; dependências autorizadas: `pg` e `markdown-it`.

## Estado atual

A aplicação local já conecta cadastro/login, senha de conteúdo separada, cadernos/páginas, Markdown/prévia, autosave, reabertura, histórico/restauração, metas e métricas atuais ao PostgreSQL. `/?preview=1` continua uma demonstração isolada sem persistência; recarregar perde somente os dados desse modo.

A senha da conta faz login. A senha de conteúdo desbloqueia uma chave raiz no navegador via PBKDF2/SHA-256 (600.000 iterações, salt aleatório); AES-GCM protege a raiz, as chaves de caderno e o conteúdo. Essa senha não é enviada ao servidor nem persistida pelo app; recarregar exige informá-la novamente. Esquecê-la impede recuperar o conteúdo; redefinir login não contorna a criptografia.

Autosave agrupa mudanças após cerca de 900 ms sem edição, com envio durante escrita contínua em até cerca de 5 s, sujeito à conexão e ao navegador. Só exibe "Salvo" quando a versão atual está confirmada. Timeout repete o mesmo lote; texto digitado durante envio permanece pendente para o seguinte. Conflito oferece preservar o rascunho em outro caderno. Últimas 50 versões por página; restauração cria revisão nova. Fechar com alterações pendentes solicita confirmação nativa, e logout tenta salvar antes de sair.

Ainda não é o MVP completo: recuperação de login, rascunho criptografado persistente após crash, revisão semântica da paginação Markdown e ensaio operacional de backup continuam pendentes. Não há publicação/whitelist implementadas. Dados ainda não confirmados permanecem só na memória da aba.

## Executar localmente

Requer Node.js 24+ e PostgreSQL. No PowerShell, dentro deste repositório:

```powershell
npm install
node scripts/local-db.js
npm run db:migrate
npm start
```

O provisionamento usa os binários PostgreSQL encontrados em `C:/Users/isazky/pgsql-setup/tar-extract/pgsql/bin`; use `PG_BIN` para outro diretório. Cria uma instância separada em `tmp/postgres`, porta 5547, e uma `.env` com segredo aleatório; não altera os bancos anteriores. Para banco próprio, configure `DATABASE_URL` seguindo `.env.example` e execute a migração sem provisionamento.

Abra [a aplicação local](http://127.0.0.1:8000/) ou [a prévia sem conta](http://127.0.0.1:8000/?preview=1). O servidor escuta somente em loopback; a configuração não é de produção. `tmp/`, `.env` e `node_modules/` são ignorados pelo Git.

## Verificação

```powershell
npm run check
npm test
```

`check` verifica sintaxe JavaScript, não substitui um linter. Testes cobrem paginação, criptografia/adulteração, senha de conteúdo, autosave com edição durante envio/timeout, e PostgreSQL real: isolamento, conflitos, idempotência, reabertura e restauração. Sem `DATABASE_URL`, a integração é pulada explicitamente.

## Documentação

- [Contexto](context.md)
- [Proposta](docs/proposta.md)
- [Requisitos do MVP e etapas posteriores](docs/requisitos-funcionais.md)
- [Banco](docs/banco-de-dados.md) e [migração executável](db/001-foundation.sql)
- [Passo a passo e andamento](docs/passo-a-passo.md)
- [Skill de UI/UX](skills/library4-design/SKILL.md)

Projeto anterior e estudos preservados em `tmp/library4-before-rebuild.tar` antes da substituição. Material antigo não é servido pela aplicação nova.
