# Front-end e validação

As normas citadas têm condições e exceções: consulte o critério original antes de declarar conformidade. Esta lista orienta implementação; não substitui auditoria completa.

## Estrutura e componentes

Use controles HTML nativos para ações, links, campos e seleção. Mantenha labels visíveis e nomes acessíveis. ARIA complementa semântica e comportamento; não implementa interação por si só. Consulte o [APG](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/) para padrões complexos, como diálogos e tabs.

Modais devem administrar foco, fechamento e retorno ao acionador conforme o padrão escolhido. Não capture atalhos quando a pessoa escreve sem considerar editor, métodos de entrada e atalhos do navegador. Ações precisam funcionar sem hover ou arrastar.

## Tokens e composição

Defina tokens por intenção: fundo, superfície, texto, texto secundário, destaque, borda, erro e sucesso. Verifique combinações efetivamente usadas, inclusive estados. Se houver tema escuro, valide-o separadamente.

Prefira rem para tipografia e medidas flexíveis para layout. Use Grid/Flexbox conforme a composição, sem acrescentar ambos por obrigação. Tipografia fluida tem limites legíveis e preserva zoom. Container queries podem responder ao espaço de um componente; verifique suporte exigido pelo projeto na [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries).

Texturas não devem atravessar texto pequeno. Decoração de papel, lombada ou sombra fica subordinada ao conteúdo. Escolha largura de leitura e entrelinha por experimentação com português, listas, código e parágrafos longos; faixas tipográficas são ponto de partida, não prova de legibilidade.

## Critérios de acessibilidade

Referência: [WCAG 2.2](https://www.w3.org/TR/WCAG22/).

- Texto: contraste de 4,5:1; texto grande, 3:1, conforme definição e exceções do critério 1.4.3.
- Componentes e informação gráfica: avaliar 3:1 nas situações do critério 1.4.11.
- Teclado: ordem coerente, sem armadilha, foco visível e não totalmente encoberto por conteúdo do autor.
- Não depender só de cor para transmitir informação.
- Verificar ampliação de texto a 200% e reflow a 320 CSS px, respeitando exceções pertinentes.
- Alvos: mínimo de 24 × 24 CSS px ou condições alternativas do critério 2.5.8. Recomendar 44 × 44 para controles frequentes; não confundir recomendação com mínimo AA.
- Drag exige alternativa sem arrastar quando aplicável.
- Erros identificam problema e correção; atualizações de estado importantes são perceptíveis por tecnologia assistiva.

Consultar também [Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html). Contraste de texto grande depende do tamanho e peso: não usar 3:1 para qualquer título.

## Responsividade e movimento

Use [layout fluido e breakpoints orientados pelo conteúdo](https://web.dev/articles/responsive-web-design-basics). Teste larguras intermediárias além de extremos. Tabelas ou blocos de código podem ter rolagem própria quando necessário; o restante da página deve continuar legível.

Considere teclado virtual, foco em campos, menus, barras persistentes e área disponível para escrever. Não bloqueie zoom nem imponha orientação da tela sem necessidade essencial.

Respeite [prefers-reduced-motion](https://web.dev/articles/prefers-reduced-motion). Reduza deslocamentos e rotações não essenciais, preservando feedback. Animação deve explicar estado ou continuidade; não atrasar uma ação para terminar um espetáculo visual.

## Conteúdo, dados e segurança da interface

Markdown e uploads são entrada não confiável. Use a solução segura já adotada no projeto; não injetar HTML bruto sem tratamento adequado. A UI de compartilhamento não substitui autorização no servidor.

Não expor conteúdo privado em URLs, telemetria, logs ou capturas de validação. Não enviar anotações a serviços externos para testar a interface sem autorização. Use conteúdo fictício representativo para demonstrações.

Em gráficos, apresentar período, unidade e acesso aos valores por texto ou tabela. Sem dados, mostrar o estado vazio, não fabricar uma tendência. Progresso percentual requer denominador definido.

## Desempenho percebido e real

Reserve espaço para mídia e evite deslocar conteúdo durante carregamento. Carregue recursos secundários conforme necessidade; não atrasar conteúdo principal indiscriminadamente. Evite processar documento inteiro a cada tecla se isso prejudicar a escrita; meça antes de adicionar mecanismos complexos.

Metas dos [Core Web Vitals](https://web.dev/articles/vitals): LCP ≤ 2,5 s, INP ≤ 200 ms e CLS ≤ 0,1, avaliados no percentil 75 de visitas. Medição local é diagnóstico, não comprovação desses resultados em produção. INP mede interação, não persistência do salvamento.

Não instalar ferramentas só para marcar a checklist. Use as ferramentas existentes e declare lacunas.

## Roteiro de verificação

Adapte ao que mudou; não repetir testes sem motivo.

| Verificação | Evidência esperada |
| --- | --- |
| Criar e abrir caderno | Nome correto, seleção clara, navegação reversível |
| Escrever e voltar | Conteúdo reaparece conforme persistência implementada |
| Editar durante salvamento | Estado não confirma indevidamente uma versão antiga |
| Falha ao salvar | Conteúdo preservado e ação de recuperação funcional |
| Caderno/página vazios | Próxima ação reconhecível sem tutorial |
| Títulos e Markdown longos | Hierarquia, quebra e rolagem adequadas |
| Teclado | Controles alcançáveis; foco visível; fechamento e retorno corretos |
| Tela estreita e zoom | Escrita viável; nenhuma sobreposição crítica |
| Movimento reduzido | Navegação e feedback funcionam sem animação espacial |
| Metas e métricas | Valores, período e estados sem dados coerentes |

Para validação de usabilidade, observe pessoas realizando tarefas sem indicar os controles. Registre conclusão, hesitações, erros e compreensão do estado salvo. Não simule participantes nem confunda inspeção heurística com teste empírico.

Antes de entregar, execute lint e testes aplicáveis presentes no projeto. Uma screenshot comprova composição naquele estado; não comprova persistência, teclado ou autorização. Informe bloqueios e verificações não executadas.
