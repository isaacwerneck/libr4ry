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
| `DATABASE_URL` | URL de conexão do PostgreSQL, com usuário, senha, host, porta e banco; tem prioridade quando definida. |
| `NETLIFY_DB_URL` | Alternativa fornecida pelo Netlify Database quando DATABASE_URL não está definida. Usa o pg existente, sem SDK adicional. |
| `PORT` | Porta HTTP da aplicação; padrão `8000`. |
| `HOST` | Endereço de escuta; padrão `127.0.0.1`. Na hospedagem, configurar o endereço solicitado pelo provedor. |
| `NODE_ENV` | Use `production` na hospedagem; exige origem pública HTTPS explícita. |
| `PUBLIC_ORIGIN` | Origem canônica, como `https://library.exemplo.com`, sem barra final, caminho ou credenciais. |
| `RESEND_API_KEY` | Chave privada da API Resend; vazia junto com RECOVERY_FROM desativa o envio. |
| `RECOVERY_FROM` | Remetente verificado no Resend, por exemplo `libr4ry <conta@seu-dominio>`. Requer PUBLIC_ORIGIN configurada. |
| `COLLABORATION_URL` | Opcional: URL `wss://` do serviço Hocuspocus no Render; habilita colaboração na interface. |
| `COLLABORATION_SECRET` | Segredo aleatório de pelo menos 32 bytes, igual no Netlify e no Render. Nunca incluir no frontend ou repositório. |
| `TRUSTED_PROXY` | Opcional: IP exato do proxy autorizado a informar um único IP de cliente em `X-Forwarded-For`. Vazio ignora o cabeçalho. |

Use um banco dedicado ao desenvolvimento. Não publique `.env` nem credenciais no repositório. Em seguida:

```sh
npm run db:migrate
npm start
```

As migrações executáveis são [fundação](../db/001-foundation.sql), [social](../db/002-social.sql), [recuperação de conta](../db/003-password-reset.sql), [moderação](../db/004-moderation.sql), [colaboração](../db/005-collaboration.sql) e [preferências pessoais por caderno compartilhado](../db/006-personal-notebook-settings.sql). O runner aplica cada versão uma única vez, em ordem e com bloqueio transacional; execute-o também ao atualizar uma instalação existente. Abra [a aplicação](http://127.0.0.1:8000/) ou [a prévia](http://127.0.0.1:8000/?preview=1); ajuste a porta se alterou `PORT`. O servidor escuta em loopback por padrão; `HOST` permite a configuração da hospedagem.

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
| `npm run build:netlify` | Recria o editor e o diretório público dist; apaga a saída gerada anterior, copia somente os assets permitidos e gera _headers. |
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

`check` verifica sintaxe e não substitui um linter. Com `DATABASE_URL`, os testes de API criam contas e dados de ensaio, verificam isolamento, gravação, reabertura, conflitos e desbloqueio, e removem seus próprios registros ao finalizar. Execute-os num banco de desenvolvimento com permissão de escrita. Sem `DATABASE_URL`, a integração SQL é pulada explicitamente; isso não confirma persistência real. Testes de regressão separados executam as integrações contra uma conexão local indisponível e exigem falha explícita com encerramento do processo. Servidor e pool são fechados mesmo se a limpeza SQL falhar; essa falha continua visível e pode deixar os próprios dados fictícios no banco até a conexão ser restabelecida.

A limpeza dos rascunhos captura as referências local/restituída antes de aguardar IndexedDB e só libera cada referência se ela continuar igual. A remoção no armazenamento mantém a comparação de stamp. Isso preserva uma proteção nova gravada durante a limpeza anterior e permite removê-la depois da confirmação remota, sem deixar um rascunho obsoleto reaparecer. Teste em notebook-state.test.js controla essa intercalação com Promises e envelopes cifrados reais.

Valide no navegador os fluxos afetados por mudanças visuais: entrada, criação/organização de caderno, escrita, leitura, navegação e cancelamento. A prévia é útil para a interface, mas não valida gravação no banco.

## Recuperação por e-mail

Configure RESEND_API_KEY, RECOVERY_FROM e PUBLIC_ORIGIN no ambiente do servidor e reinicie-o. As duas primeiras vazias ocultam a recuperação; configuração parcial ou origem inválida impede iniciar. O adaptador usa fetch nativo para [POST /emails do Resend](https://resend.com/docs/api-reference/emails/send-email), sem SDK adicional. Chave fica somente no servidor; e-mail do destinatário e link de recuperação são enviados ao provedor. Verifique domínio/remetente e faça um envio real no domínio HTTPS antes do lançamento.

O banco guarda apenas SHA-256 do token aleatório de 32 bytes, com validade de 30 minutos e consumo atômico. Solicitações têm resposta genérica, até três emissões por conta/hora e compartilham o limite de autenticação por IP. Novo link invalida anteriores. A troca revoga sessões, exige novo login e preserva os envelopes privados. O token chega em fragmento da URL, removido do histórico ao abrir a tela.

O envio roda no processo com timeout de 10 segundos; na Function, sua Promise é registrada em context.waitUntil para estender a execução após responder, sem esperar o provedor no caminho da resposta. Isso não cria fila durável: falha do provedor ou reinício pode impedir entrega. O log informa falha sem registrar destinatário, token ou resposta do provedor; confirme a operação no Resend e solicite outro link quando necessário. Testes usam envio simulado e PostgreSQL; não comprovam entrega externa.

## Ensaio local de backup e restauração

Execute `node --env-file-if-exists=.env scripts/check-backup.js` com DATABASE_URL local, permissão de criar bancos e binários pg_dump/pg_restore em PG_BIN (ou instalação local já usada pelo projeto). O script cria dois bancos temporários próprios, aplica as três migrações, grava dados fictícios sociais e cifrados, exporta/restaura e compara tabelas e conteúdo decifrado. Ao finalizar, remove somente seus bancos e arquivo temporário. Não copia nem modifica os dados reais da aplicação.

Esse ensaio não configura backups automáticos, retenção ou armazenamento externo. Para o primeiro lançamento, o proprietário escolheu depender somente da janela curta de restauração do Neon, sem cópia independente. A [documentação oficial do Neon](https://neon.com/blog/neon-free-plan-1-gb-per-project) informa uma janela de restauração instantânea de 6 horas no plano Free; confirme a janela efetiva no painel antes da abertura, pois plano e configuração podem mudar. Essa janela não substitui backup independente: falhas descobertas depois dela podem tornar dados irrecuperáveis. Antes da publicação, faça um ensaio de restauração em ambiente isolado e confirme o desbloqueio com a senha de conteúdo.

## Problemas comuns

- **Conexão recusada pelo PostgreSQL:** confirme se o banco está ativo e se a URL/porta correspondem à instância configurada.
- **Porta HTTP ocupada:** encerre a instância que você iniciou ou configure outro `PORT` antes de iniciar o servidor.
- **Aparece “Prévia · sem salvamento”:** entre pela URL sem `?preview=1` para acessar sua conta real.
- **Notas não desbloqueiam:** use a senha de conteúdo, distinta da senha de login. Atualmente não existe recuperação administrativa desse segredo.

## Preparação para a hospedagem

Destino escolhido: Netlify para o frontend/API, Render para Hocuspocus e Neon para PostgreSQL, usando somente planos grátis. Ainda não existe projeto remoto criado. `netlify.toml` usa Node 24, build `npm run build:netlify`, publicação de `dist` e Functions em `netlify/functions`; conectar o repositório e usar esse build, pois enviar apenas os arquivos estáticos não publica as Functions. Não publicar a raiz, `public/` ou `tmp/`.

O [plano grátis do Netlify](https://www.netlify.com/pricing/) inclui 300 créditos mensais e pausa os sites quando a cota acaba. O [Render Free](https://render.com/docs/free) suspende o serviço WebSocket após 15 minutos sem tráfego e leva cerca de um minuto para acordar; desconexões são esperadas. A cota é de 750 horas gratuitas por workspace/mês. Limites de banda de saída e minutos de build podem gerar cobrança se houver método de pagamento; sem pagamento, os serviços param ao atingir os limites. A [Neon Free](https://neon.com/pricing/) oferece 100 CU-hours e 1 GB de armazenamento por projeto. Esses planos permitem começar sem contratação, mas não garantem serviço contínuo. O plano escolhido depende da janela curta de restauração do Neon; não haverá cópia independente no primeiro lançamento, então dados com perda descoberta fora da janela podem ser irrecuperáveis. O projeto já protege edições pendentes no dispositivo.

O build recria dist e copia a lista de assets do servidor, incluindo o editor e markdown-it nas URLs já usadas pelo frontend; gera _headers com as mesmas proteções, sem copiar código do backend, SQL, .env ou node_modules inteiros. A Function api atende /api/* com as rotas de autenticação excluídas; a Function auth recebe /api/login, /api/register e /api/password-reset/request e /complete. Ambas reutilizam o mesmo adaptador Request/Response e handler do servidor local, sem porta HTTP ou dependência nova. O pg permanece externo no bundle da Function. `npm start` continua disponível no desenvolvimento.

A conexão já aceita NETLIFY_DB_URL quando DATABASE_URL estiver ausente. Segundo a [documentação de drivers](https://docs.netlify.com/build/data-and-storage/netlify-database/tooling/), o Netlify Database pode ser provisionado manualmente no painel e usado com o pg existente. Não houve provisionamento, contratação ou instalação de SDK nesta etapa. Ao usar as branches automáticas do provedor, evite fixar DATABASE_URL de produção em previews: essa variável explícita tem prioridade. Testes SQL continuam exigindo DATABASE_URL de desenvolvimento explícita, evitando que NETLIFY_DB_URL automático execute ensaios no banco hospedado por engano.

Na configuração do projeto Netlify, definir `PUBLIC_ORIGIN=https://libr4ry.netlify.app` no escopo das Functions, além de `COLLABORATION_URL` com a URL `wss://` pública do Render e `COLLABORATION_SECRET` aleatório de pelo menos 32 bytes. Definir no serviço Render o mesmo segredo, `PUBLIC_ORIGIN=https://libr4ry.netlify.app`, `DATABASE_URL` do projeto Neon e `HOST=0.0.0.0`; a API Netlify também precisa do `DATABASE_URL` Neon. Armazenar segredos apenas nos painéis desses provedores. Gerar um segredo novo e igual nos dois serviços; nunca reutilizar token de sessão ou chave do Resend. A Function exige HTTPS mesmo se NODE_ENV não estiver definido e não usa HOST/PORT/TRUSTED_PROXY. Ela obtém o IP exclusivamente de context.ip, ignora X-Forwarded-For e rejeita contexto sem IP ou waitUntil válidos. Configure RESEND_API_KEY e RECOVERY_FROM nesse mesmo escopo quando houver remetente verificado; não coloque segredos em netlify.toml ou no frontend. A emissão de links registra o envio em [context.waitUntil](https://docs.netlify.com/build/functions/api/#waituntil), sem prometer entrega após falha/reinício do provedor.

Aplicar as migrações pelo runner existente num contexto seguro com a conexão do banco hospedado; o build não migra nem roda testes SQL no banco de produção automaticamente. Previews exigem origem e banco isolados; não apontá-los silenciosamente para a produção.

Verificações locais: pacote estático comparado à lista de assets, bundle da Function compilado/executado com esbuild e integração Request/Response com PostgreSQL. Isso não substitui deploy no runtime Netlify. Antes de abrir ao público, verificar limites efetivos de payload/resposta e conexões simultâneas do plano/banco, além de confirmar a regra de autenticação descrita abaixo no runtime Netlify. Não há provisionamento remoto, SDK Netlify ou instalação de CLI nesta etapa.

Use `npm ci`, `npm run db:migrate`, `npm run build`, `npm run check` e `npm test` no ambiente de validação. Configure `NODE_ENV=production`, `PUBLIC_ORIGIN=https://seu-dominio`, `HOST` e `PORT` de acordo com o provedor. A aplicação Node serve HTTP atrás de um terminador TLS da hospedagem; não exponha esse transporte interno diretamente à Internet. Sem origem HTTPS, o servidor recusa iniciar em produção.

A origem configurada valida requisições que alteram dados e permite HTTPS no proxy. Cookies de sessão recebem `Secure`, além de `HttpOnly` e `SameSite=Strict`; logout remove o mesmo cookie. Respostas incluem CSP, proteção de frames, permissões restritas e HSTS na configuração HTTPS. Não é necessário confiar em cabeçalhos `X-Forwarded-*` para validar a origem. Redirecionamento HTTP→HTTPS, certificado e domínio pertencem à hospedagem.

Timeouts HTTP limitam recebimento de requisições e conexões ociosas. PostgreSQL limita comandos e transações ociosas a 15 segundos. A autenticação aceita até quatro trabalhos scrypt simultâneos; excesso recebe 503 e pode ser tentado novamente. SIGTERM/SIGINT encerram o servidor e o pool, dando até 20 segundos às conexões existentes.

O limite local de login/cadastro/recuperação é 15 tentativas por minuto por cliente, em memória de um processo. Sem `TRUSTED_PROXY`, usa o endereço do socket e ignora `X-Forwarded-For`. Atrás de proxy, configure `TRUSTED_PROXY` com seu IP exato e faça o proxy **sobrescrever** esse cabeçalho com um único IP de cliente, sem cadeia nem valor fornecido pelo visitante. Só conexões desse IP podem encaminhar a identidade; cabeçalhos inválidos são rejeitados. Sem essa configuração, visitantes do mesmo proxy compartilham a cota. No Netlify, auth.mjs declara uma regra de borda: 15 requisições em 60 segundos por IP e domínio, com resposta 429; a Function api exclui essas quatro rotas, e o autosave não compartilha essa cota. O limitador Node continua por processo, complementando a regra. Segundo a [documentação de rate limiting](https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/), regras em código estão disponíveis em todos os planos, o bloqueio pode levar até 10 segundos para começar e uma regra inválida não impede o deploy. Conferir explicitamente sua aceitação no log de pós-processamento e ensaiar o bloqueio real antes da abertura pública; testes locais de configuração não provam enforcement na borda. Em outras hospedagens com múltiplas réplicas, configurar proteção equivalente. Social limita novas publicações a 5/minuto, convites a 15/minuto e mensagens a 30/minuto por remetente, com serialização no PostgreSQL.

Antes do lançamento no provedor, testar cadastro/login/logout pelo domínio HTTPS, cookies, persistência após reinício e migrações; confirmar a janela de restauração do Neon no plano escolhido e ensaiar a recuperação em uma branch/banco isolado. O primeiro lançamento não terá backup independente. Definir e validar um mecanismo confiável de aferição etária adequado ao serviço antes de abrir o cadastro ao público: a declaração 18+ do formulário é uma regra de produto, não comprova a idade. Usar usuário de banco com privilégios mínimos em execução, segredos fora do repositório e acesso de rede restrito ao banco. A política de privacidade deve refletir o mecanismo efetivamente ativado.

## Conferência de lançamento — 23/10/2026

Este registro separa as verificações locais da validação em hospedagem; a publicação não foi feita. A suíte tem 107 testes aprovados e a verificação de sintaxe cobre 79 arquivos JavaScript. `npm audit --omit=dev` não encontrou vulnerabilidades. As seis migrações foram aplicadas no PostgreSQL local e o teste WebSocket executou a sincronização entre contas. Nenhum serviço remoto, e-mail real ou domínio foi configurado.

| Área | Evidência disponível | Verificação restante |
| --- | --- | --- |
| Dependências | `markdown-it` está em 15.0.3; `npm audit --omit=dev` retornou 0 vulnerabilidades. | Repetir `npm audit` após atualizar dependências. |
| Versão que será publicada | Git mostra mudanças locais e arquivos essenciais não rastreados, incluindo Functions, netlify.toml e migrações 002/003. | Revisar e incluir todos os fontes/migrações/configurações necessários no commit usado para publicar; preservar .env, tmp, dist e segredos fora do versionamento. Não houve commit ou push nesta revisão. |
| Pacote Netlify | Build e testes de pacote/Functions executados localmente; assets públicos ficam em dist. | Criar projeto conectado ao repositório e testar rotas no domínio HTTPS. |
| Persistência, Markdown e compartilhamento | PostgreSQL local: propriedade, criação, reabertura, versões, importação com cópia anterior, permissões públicas/privadas, bloqueios e dados cifrados. WebSocket real: escritas simultâneas, confirmação e revogação. | Provisionar Neon, aplicar seis migrações e repetir os fluxos pelo domínio público e após reinícios/hibernação. |
| Sessão e transporte | Testes locais de origem HTTPS, cookies Secure, origem forjada, IP do contexto Netlify e limitação de autenticação. Regra de borda declarada na Function auth. | Certificado, redirecionamento, cookies, cadastro/login/logout e aceitação/bloqueio real da regra no Netlify. |
| Recuperação da conta | Resend HTTP e tokens testados com provedor simulado e PostgreSQL local, incluindo uso único e revogação de sessões. | Configurar chave/remetente verificado e validar entrega externa, link e nova autenticação no domínio HTTPS. |
| Recuperação do banco | Ensaio local de pg_dump/pg_restore em bancos temporários próprios, com dados cifrados e sociais. | Confirmar janela curta de restauração do Neon e testar recuperação isolada; não há cópia independente no primeiro lançamento. |
| Interface e movimento | Ensaios de teclado, larguras estreitas, criação com falha, foco após erro e índice sem título obrigatório. Testes de virada/câmera/luz incluem interrupção, movimento reduzido e fallback WebGL. Evidências específicas no histórico. | Uso em celular físico com teclado virtual, leitor de tela e medições de desempenho reais; verificação visual não cobre todos os tamanhos nem substitui esses ensaios. |
| Social e moderação | API/SQL locais: publicação, amizades, mensagens, bloqueios, denúncias, revisão manual e retenção de 90 dias. | Repetir com contas reais na hospedagem e cadastrar o ID da conta administradora somente após ela existir. |

Antes da publicação, o proprietário ainda precisa criar os projetos Netlify, Render e Neon, conectar o repositório, definir as variáveis secretas nos painéis, aplicar seis migrações no Neon, testar HTTPS, autenticação, sincronização após o serviço acordar, envio real de recuperação por e-mail, a regra de limite na borda e restauração dentro da janela disponível. A política de cadastro é 18+, mas ainda falta escolher e validar mecanismo confiável de aferição etária adequado ao serviço. Até validar esses passos, a hospedagem e o lançamento permanecem pendentes.

## Limites observados na revisão de 23/10/2026

Testes de código e integração local não cobrem todas as larguras, leitores de tela, teclado virtual ou aparelhos físicos. A colaboração exige que o Render esteja acordado; o plano grátis pode interromper conexões. A senha de conteúdo não tem recuperação administrativa, e mensagens sociais não usam criptografia de ponta a ponta; esses limites estão informados na interface/documentação.

## Limites atuais

A implantação e os backups reais dependem dos serviços que o proprietário criará depois. Recuperação de login depende do Resend e de entrega real validada; não existe recuperação administrativa da senha de conteúdo. Cadernos públicos são legíveis para contas autenticadas; a whitelist concede edição ao mesmo original e a blacklist impede acesso. Conversas são privadas por autorização no servidor, sem criptografia de ponta a ponta. A criptografia dos cadernos protege conteúdo armazenado, mas não protege um navegador comprometido. A declaração 18+ no cadastro pode ser contornada e não deve ser apresentada como comprovação de idade; conferir a legislação e a orientação atual da ANPD e validar a solução etária antes de abrir o serviço ao público. A restauração curta do Neon não é backup independente e limita a recuperação ao histórico retido pelo provedor.
