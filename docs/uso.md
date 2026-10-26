# Guia de uso — Library4

[← Documentação](README.md)

## Denúncias e contato

Em uma publicação de outra pessoa, abra **Denunciar**, escolha o motivo e acrescente detalhes se necessário. **Enviar denúncia** registra uma cópia do texto público para revisão manual; não envia cadernos ou conversas. Reenvios não duplicam a denúncia da mesma publicação. O bloqueio de pessoas continua disponível separadamente.

Contas autorizadas pela configuração do servidor veem **Social > Denúncias**. A fila mostra até 50 pendências por vez, das mais antigas; ao encerrar uma, a próxima passa a aparecer. **Encerrar sem remoção** conserva a publicação; **Remover publicação** pede confirmação e remove somente o texto social. O registro resolvido permanece por 90 dias. **Privacidade e contato**, disponível na entrada e no perfil, informa o canal de atendimento e contestação.

## Conta e desbloqueio

Na entrada, escolha **Crie sua conta** e preencha nome, e-mail e senha da conta. Defina também uma **senha de conteúdo**, confirme-a e leia o aviso de proteção.

A senha da conta aceita de **8 a 128 caracteres**; a senha de conteúdo dos cadernos, de **4 a 128 caracteres**. Ambas permitem letras e números. O mínimo de conteúdo facilita o uso, mas senhas curtas oferecem menos resistência a tentativas de adivinhação; prefira uma frase maior.

A senha da conta autentica você. A senha de conteúdo desbloqueia suas notas no navegador; ela é solicitada novamente ao recarregar. Atualmente, esquecer a senha de conteúdo impede recuperar suas notas pelo administrador. Com envio configurado, use **Esqueci a senha da conta**, informe seu e-mail e abra o link recebido. O link vale 30 minutos e pode ser usado uma vez; solicitar outro invalida o anterior. Se expirar, use **Solicitar outro link** na própria tela. Fechar a recuperação limpa os campos de senha. Após definir a nova senha da conta, entre novamente: todas as sessões anteriores são encerradas e a senha de conteúdo continua a mesma.

Durante login/cadastro, os campos e a troca para cadastro/recuperação ficam bloqueados até a resposta. No desbloqueio, aguarde **Desbloqueando…**; a saída fica bloqueada enquanto as chaves e a biblioteca carregam. Falhas liberam os controles para nova tentativa, sem limpar campos antes da autenticação ou da validação da senha de conteúdo. No login/cadastro, desbloqueio, recuperação e formulário de cadernos, o foco retorna ao campo ou botão usado no envio quando ficou na página ou no diálogo; se você navegar para outro controle durante a espera, esse foco é preservado.

Se aparecer **Muitas tentativas**, aguarde um minuto antes de tentar novamente. O aplicativo preserva o aviso de limite mesmo quando a hospedagem não responde em JSON e não repete o envio automaticamente.

Para experimentar sem cadastro, use a prévia. Ela funciona apenas na memória da aba e **não salva** notas, cadernos ou personalizações.

## Home

No desktop (largura acima de 720 px), a entrada e o portal ocupam a altura da janela sem rolagem da página. Espaços e cartões se ajustam à altura disponível; conteúdo maior continua acessível dentro dos formulários, painéis e coleção. Em telas de até 720 px, a entrada e o portal mantêm a rolagem normal. O caderno conserva seus controles próprios de zoom e deslocamento.

Após entrar e desbloquear a biblioteca, você encontra três destinos:

- **Perfil:** informações da conta, contagem de cadernos/estantes e acesso ao progresso.
- **Estantes:** seus cadernos, criação, busca, favoritos e organização.
- **Social:** publicações de texto, busca por nome, convites, amizades e conversas.

Quando há uma retomada disponível, **Continuar de onde parei** abre o caderno correspondente. Nenhum caderno é publicado automaticamente.

## Cadernos e estantes

Em **Estantes**, clique em **Novo caderno**, defina nome, matéria, tags e tamanho inicial da folha. O campo de estantes aceita até 12 nomes, separados por vírgula. Reutilizar um nome reúne os cadernos no mesmo grupo. Durante a criação, aguarde **Criando caderno…**: o formulário bloqueia edição, fechamento e novos envios até receber a resposta. Uma falha libera o formulário e conserva os campos para revisão. Enviar novamente, mesmo após fechar e reabrir **Novo caderno**, retoma a criação pendente nesta aba sem gerar outra cópia. Alterações feitas antes da confirmação são salvas depois no mesmo caderno. Mantenha a aba aberta enquanto houver erro; ao recarregar, confira a coleção antes de criar novamente. Enquanto a criação estiver pendente, **Sair** mantém a conta aberta e orienta retomar em **Novo caderno**. Fechar ou recarregar solicita o aviso nativo do navegador quando ele oferece esse recurso.

Os botões das estantes filtram a coleção. A busca e o seletor **Mostrar** ajudam a encontrar cadernos; **Organizar** permite ajustar seus grupos e o favorito. Retirar um caderno de uma estante não apaga suas páginas. Estantes são grupos de cadernos; criar estantes vazias ou renomeá-las coletivamente ainda não está disponível.

Clique numa capa para abrir o caderno. A capa e a contracapa são personalizáveis, mas não contam como páginas de anotações.

### Compartilhar um caderno

No caderno, abra **Acesso**. O dono pode iniciar o compartilhamento do original, escolher se ele é privado ou público e gerenciar a lista de acesso. Um caderno público pode ser lido por qualquer conta conectada e aparece no perfil do dono; quando compartilhado com alguém na whitelist, também aparece no perfil dessa pessoa. Apenas o dono e quem estiver na whitelist pode editar. Um caderno privado aparece no perfil do dono e nas estantes das pessoas autorizadas, mas não nos perfis delas. Para adicionar alguém à whitelist, busque uma amizade aceita e selecione **Pode editar** ou **Pode ler**. **Bloqueado** impede aquela conta de abrir o caderno, mesmo que ele seja público. A senha de conteúdo do dono não é solicitada nem transmitida; cada conta usa sua própria chave. Versões antigas compartilhadas podem ser copiadas para um novo caderno. A revogação impede novos acessos pelo serviço, mas não apaga cópias que alguém já salvou.

### Importar e exportar Markdown

Em **Estantes**, use **Importar Markdown** para escolher um arquivo `.md`. A prévia permite criar um caderno novo, atualizar o identificado pelo próprio arquivo ou escolher manualmente um caderno. Antes de atualizar, o Libr4ry guarda uma cópia completa do estado atual; páginas que não vieram no arquivo são preservadas. Revise o resumo e confirme a alteração. **Baixar Markdown** exporta texto, títulos, datas e divisões de páginas, sem capas, personalizações ou tarefas. O conteúdo do arquivo fica em texto legível no computador; compartilhe o arquivo somente com quem pode acessá-lo.

## Social

Em **Publicações → Nova publicação**, escreva título e texto ou escolha um caderno e uma página para **Copiar para revisão**. Revise o conteúdo e marque o consentimento antes de **Publicar**. Só o texto exibido no formulário é enviado, em uma cópia independente; editar o original não altera a publicação. O texto público não preserva a formatação visual do caderno. **Remover publicação** retira sua cópia do feed; leitores podem ter guardado cópias por conta própria.

Em **Pessoas e amizades**, busque por nome (2–60 caracteres). **Adicionar** envia um convite, que a outra pessoa pode aceitar ou recusar. Você pode cancelar convites enviados ou remover amizades. E-mail, biblioteca e estatísticas privadas não aparecem na busca. **Bloquear** remove a amizade e impede contato nos dois sentidos; **Pessoas bloqueadas** permite desbloquear, sem restaurar a amizade automaticamente.

Em **Conversas**, escolha uma amizade aceita. Envie até 4.000 caracteres por mensagem; a conversa consulta novas mensagens a cada 10 segundos enquanto estiver visível. A consulta automática aguarda enquanto o seletor de amizade estiver com foco, para não interromper sua escolha; após sair dele, retorna no próximo ciclo. **Mensagens anteriores** carrega o histórico. Só os dois participantes podem acessar pela aplicação. As mensagens são armazenadas no servidor, **sem criptografia de ponta a ponta**; a criptografia dos cadernos continua separada. Não há anexos nem chamadas.

Falhas preservam o texto em edição nesta aba e permitem tentar novamente, sem duplicar o envio confirmado. Rascunhos sociais não são persistidos ao fechar a aba; o navegador avisa se ainda há texto não enviado. Ao usar **Sair**, o descarte é confirmado antes de encerrar a sessão: cancelar mantém a conta e os textos, e uma falha na saída também os preserva. Aguarde operações sociais em andamento antes de sair. **Atualizar** recarrega feed e amizades. Ações manuais mostram **Aguarde…** durante a operação; ao terminar, o aviso é removido ou substituído pela confirmação/erro. A consulta periódica de mensagens continua discreta. A prévia sem conta não publica, convida ou envia mensagens.

## Escrita e leitura

Use **Escrever** para editar e **Ler** para consultar suas notas. O editor visual aplica a formatação sem exigir conhecimento de Markdown. Cada campo de escrita tem um nome acessível com o número da página, distinguindo as duas folhas abertas. No índice, títulos preenchidos têm prioridade; nas folhas sem título, aparece a primeira linha da anotação sem os marcadores de formatação. Uma folha vazia aparece como **Sem título**, sem preencher ou exigir título no papel. **Ler** informa o estado somente leitura; **Escrever** libera novamente a edição. Criar uma página por Enter leva o foco diretamente à escrita da nova folha. **Fonte Markdown** permite editar a marcação como opção avançada.

A bancada lateral reúne quatro seções, com um painel aberto por vez:

| Seção | Controles |
| --- | --- |
| Texto | Negrito, itálico, títulos, listas, fonte, tamanho, tinta, desfazer/refazer e Markdown. |
| Páginas | Índice, busca, metas, tamanho da folha, texto base, versões e rascunhos. |
| Caderno | Enquadramento, modelo, papel e personalização das capas. |
| Mesa | Superfície, iluminação e lembrete opcional. |

Selecione um trecho antes de aplicar um estilo específico. Use os botões inferiores para avançar, voltar ou criar uma página; você também pode arrastar a borda externa da folha. Um arraste curto retorna à página atual. **Escape** cancela o gesto ou recolhe o painel.

O topo da folha contém número e data editável. Folhas novas recebem a data local; folhas antigas sem data continuam vazias. A data segue o mesmo salvamento cifrado, histórico e desfazer/refazer das notas. No modo Ler ela fica protegida.

Folhas pequenas, médias e grandes têm capacidades de referência diferentes. Ao exceder a capacidade, a paginação procura continuar em novas páginas sem cortar o texto; reduzir o tamanho também preserva o conteúdo.

## Enquadramento e atalhos

O contorno de foco usa creme sobre madeira e fundos escuros, e marrom nos controles claros. Ao navegar com Tab, **Ir para o conteúdo** leva ao formulário na entrada ou ao conteúdo principal no portal/caderno, sem alterar a rota. Diálogos usam seus títulos como nomes acessíveis; Escape fecha os diálogos canceláveis e devolve o foco ao acionador. O desbloqueio exige desbloquear ou sair da conta.

O caderno aberto mantém duas faces sobre uma mesa fixa. Ao abrir, a câmera aproxima a folha ativa; **Ver inteiro** mostra o objeto completo, e **Ajustar largura** ou **Voltar à escrita** enquadram a folha. Ao redimensionar a janela, o modo automático se ajusta; zoom escolhido manualmente é preservado. No celular, a largura do texto se adapta à leitura, sem repartir as páginas existentes. As ferramentas iniciam recolhidas. Para alcançar outra região, ative **Mover caderno** e arraste com mouse ou toque; Escape encerra o deslocamento.

| Ação | Atalho |
| --- | --- |
| Negrito | Ctrl/Cmd + B |
| Itálico | Ctrl/Cmd + I |
| Títulos H1, H2 e H3 | Alt + 1, 2 ou 3 |
| Lista | Alt + L |
| Escolher tinta com texto selecionado | Shift + C |
| Ampliar ou reduzir o caderno | Ctrl + roda do mouse |
| Deslocar o caderno | Ctrl + arraste |
| Cancelar gesto ou recolher painel | Escape |

Os botões permanecem disponíveis como alternativa aos atalhos. Avisos temporários ficam visíveis por cinco segundos a partir da mensagem mais recente e não bloqueiam cliques nos controles. No caderno, aparecem acima da navegação inferior. **Mais cores** oferece paleta, seletor, HEX e RGB. **Centralizar**, **Ver inteiro** e **Voltar à escrita** ajudam a recuperar o enquadramento. Atalhos podem variar conforme navegador, sistema e teclado.

## Papéis, fontes e mesa

**Caderno** oferece 7 tons de papel e 6 paletas, além da cor livre, três materiais de capa e quatro pautas. **Fonte padrão** e os controles de seleção oferecem Simples, Literária, Monoespaçada, Manuscrita, Clássica de livro, Humanista e Máquina de escrever. São fontes do sistema, com fallback local; a aparência exata depende do dispositivo. **Mesa** oferece madeira clara/escura, linho, carvalho, cerejeira, café escuro e feltro verde. As opções anteriores permanecem válidas e os padrões não mudam.

Zoom e ações de enquadramento usam transições breves; digitar, tocar na folha ou mover o caderno interrompe a câmera. Movimento Leve reduz a duração e Sem movimento ou a preferência de movimento reduzido do sistema eliminam essas transições.

## Personalizar capas

Na capa ou contracapa, habilite **Escrever**. Clique no título ou na matéria para editá-los; Enter confirma e Escape cancela. A contracapa tem seus próprios textos e personalizações.

No painel **Caderno**, escolha material, cor e textura. Cada lado aceita uma imagem por arquivo, arraste sobre a capa ou Ctrl + V. Os formatos aceitos são PNG, JPEG e WebP; a imagem é reduzida no navegador antes de integrar os dados cifrados.

Selecione a imagem para movê-la ou redimensioná-la pelos cantos. Setas ajustam posição, Shift amplia o passo, Delete remove e Escape cancela um gesto em andamento. Em **Ler**, esses elementos ficam protegidos contra edição.

## Salvamento e retorno

Fora da prévia, o autosave envia as alterações criptografadas ao banco. **Salvo** indica confirmação da revisão enviada. Se houver falha ou conflito, leia o aviso e use as opções de recuperação; não trate uma alteração pendente como gravada. Falta de conexão, demora do servidor e resposta inválida têm mensagens próprias. Um timeout não confirma nem desfaz a operação; mantenha a aba aberta para conferir o estado ou tentar novamente.

Em **Páginas → Versões**, aguarde **Carregando…**. A janela identifica o número da folha e abre depois de confirmar as edições atuais; se você continuar escrevendo durante a consulta, ela é atualizada antes de abrir. Trocar de página/caderno, ir para uma capa ou sair do caderno cancela essa abertura, sem trocar seu foco de navegação. Se houver uma edição visual pendente, resolva-a antes. Restaurar mantém a versão atual no histórico e cria uma nova revisão; uma janela que perdeu o contexto da página não aplica a restauração. Falhas liberam o botão e conservam a escrita.

Versões recentes e rascunhos protegidos ajudam a recuperar trabalho, mas não substituem backup. Para retornar aos seus cadernos, entre, desbloqueie a biblioteca e abra a estante desejada.
