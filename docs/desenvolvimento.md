# Configuração e desenvolvimento — Library4

[← Documentação](README.md)

## Requisitos

- Node.js 24 ou superior e npm.
- PostgreSQL acessível pela aplicação; a configuração local do projeto foi validada com PostgreSQL 17.5.
- Navegador com suporte às APIs de criptografia usadas pelo aplicativo. Execute pela origem local servida pelo Node.js.

O frontend usa HTML/CSS/JavaScript, Tiptap e Markdown. O backend usa Node.js e `pg`; esbuild empacota o editor. As dependências estão em [package.json](../package.json).

## Configuração com banco próprio

Na raiz do repositório:

```sh
npm install
```

Copie [.env.example](../.env.example) para `.env` e preencha:

| Variável | Uso |
| --- | --- |
| `DATABASE_URL` | URL de conexão do PostgreSQL, com usuário, senha, host, porta e banco. |
| `PORT` | Porta HTTP da aplicação; padrão `8000`. |

Use um banco dedicado ao desenvolvimento. Não publique `.env` nem credenciais no repositório. Em seguida:

```sh
npm run db:migrate
npm start
```

A migração executável está em [db/001-foundation.sql](../db/001-foundation.sql). Abra [a aplicação](http://127.0.0.1:8000/) ou [a prévia](http://127.0.0.1:8000/?preview=1); ajuste a porta se alterou `PORT`. O servidor escuta apenas em loopback.

## Instância local pelo script do projeto

O provisionamento disponível é voltado ao Windows e requer os binários PostgreSQL já instalados ou extraídos. Aponte `PG_BIN` para a pasta que contém `initdb.exe` e `pg_ctl.exe`, usando o caminho da sua instalação:

```powershell
$env:PG_BIN = 'C:\caminho\postgresql\bin'
npm install
node scripts/local-db.js
npm run db:migrate
npm start
```

O script cria ou inicia uma instância separada em `tmp/postgres`, porta `5547`, e gera `.env` com credenciais aleatórias na primeira configuração. Não altera os bancos anteriores. Se `.env` já existir e ainda não houver essa instância local, ele interrompe o provisionamento para preservar a configuração; nesse caso, use o banco próprio configurado ou prepare uma instalação separada.

Após reiniciar o computador, rode `node scripts/local-db.js` para iniciar novamente essa instância antes de executar a aplicação. Não é necessário reprovisionar um banco próprio já ativo.

## Comandos de desenvolvimento

| Comando | Função |
| --- | --- |
| `npm start` | Empacota o editor e inicia o servidor. |
| `npm run dev` | Empacota o editor e inicia o servidor com observação de arquivos. |
| `npm run build` | Recria o bundle do editor visual. |
| `npm run db:migrate` | Aplica a migração do banco. |
| `npm run check` | Verifica sintaxe dos arquivos JavaScript. |
| `npm test` | Executa os testes, incluindo integração SQL quando configurada. |

Ao alterar o entrypoint do editor, execute o build novamente; observar o servidor não recompila automaticamente esse bundle. O bundle gerado, `node_modules/`, `.env` e `tmp/` são ignorados pelo Git. Reinicie o servidor após mudanças em assets para conferir a versão atual.

## Verificação

```sh
npm run build
npm run check
npm test
```

`check` verifica sintaxe e não substitui um linter. Com `DATABASE_URL`, os testes de API criam contas e dados de ensaio, verificam isolamento, gravação, reabertura, conflitos e desbloqueio, e removem seus próprios registros ao finalizar. Execute-os num banco de desenvolvimento com permissão de escrita. Sem `DATABASE_URL`, a integração SQL é pulada explicitamente; isso não confirma persistência real.

Valide no navegador os fluxos afetados por mudanças visuais: entrada, criação/organização de caderno, escrita, leitura, navegação e cancelamento. A prévia é útil para a interface, mas não valida gravação no banco.

## Problemas comuns

- **Conexão recusada pelo PostgreSQL:** confirme se o banco está ativo e se a URL/porta correspondem à instância configurada.
- **Porta HTTP ocupada:** encerre a instância que você iniciou ou configure outro `PORT` antes de iniciar o servidor.
- **Aparece “Prévia · sem salvamento”:** entre pela URL sem `?preview=1` para acessar sua conta real.
- **Notas não desbloqueiam:** use a senha de conteúdo, distinta da senha de login. Atualmente não existe recuperação administrativa desse segredo.

## Limites atuais

O ambiente documentado é local. Implantação pública, recuperação de conta/chaves, backup operacional e backend social ainda precisam de implementação e validação próprias. A criptografia protege conteúdo armazenado, mas não transforma um navegador ou cliente comprometido num ambiente seguro.
