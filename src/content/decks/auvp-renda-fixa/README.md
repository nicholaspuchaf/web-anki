# AUVP - Renda Fixa

**185 flashcards**, em 18 arquivos de 17 aulas, reformulados com a skill `criar-otimizar-flashcards`. O baralho continua local, instalado automaticamente e disponível offline, com ativação independente em Configurações. Não contém carrosséis.

Cada cartão tem pergunta autossuficiente, resposta principal curta, explicação opcional em **Entenda o raciocínio** e referência em **Origem no material**. Permanecem as tags `auvp`, `renda-fixa`, `modulo-3`, aula e assuntos específicos.

## O que mudou

O índice de busca foi esvaziado dos 246 cartões AUVP anteriores antes da análise, para não confundir o material em reformulação com um acervo já aprovado. Os cartões provisórios foram comparados com os outros baralhos e entre si; depois da revisão, o índice recebe somente a versão nova.

Foram reformulados 181 cartões, consolidados 60 repetidos e removidas quatro perguntas sobre listas de marcas, condições promocionais, acesso a uma tela e estatísticas sem metodologia suficiente. Um cartão com três siglas foi dividido: a pergunta de CDB mantém o ID e LC/RDB recebem IDs novos. Um novo cartão aborda como avaliar estatísticas, em lugar de decorar percentuais históricos sem contexto. O total final é 185, sem meta artificial de volume.

A análise semântica foi usada como seleção de candidatos, não como decisão automática. Mantivemos, por exemplo, cartões parecidos sobre faixas diferentes de IR, bases de PGBL/VGBL e limites distintos do FGC. Consolidamos a repetição entre compras sucessivas na mesma série e entre descrições idênticas da remuneração IPCA + taxa real. As decisões ficam em [revision.json](revision.json), com destino de cada ID anterior e exemplos da análise.

## Progresso e atualização

O ID do baralho permanece `builtin-auvp-renda-fixa`. Os **182 IDs anteriores mantidos** preservam avaliações, intervalo, próxima revisão e favorito. Três IDs novos começam sem revisões. Cartões pessoais do mesmo baralho são preservados pelo carregador. Não copiamos avaliações de cartões consolidados para os destinos nem para os novos, pois isso inventaria evidência de aprendizagem.

Os 64 IDs consolidados ou removidos deixam o catálogo ativo; não há um segundo baralho AUVP antigo. O histórico de eventos é separado do conteúdo e não é apagado por esta revisão. O conteúdo continua com `syncEnabled: false`, fora do DynamoDB.

## Fontes e limites desta revisão

A origem é o acervo anterior criado a partir do PDF **AUVP ESCOLA - MÓDULO 3 - RENDA FIXA.pdf**, de Raul Sena (AUVP), com 41 páginas e SHA-256 `71e60ca1e939efa77e8d7020b08268722cb1a8ad55e2b958f10baa625f1fe453`.

O PDF original não estava disponível para releitura nesta etapa. A reformulação usa os cartões, explicações, páginas e objetivos já registrados, com verificações pontuais em fontes primárias; não deve ser apresentada como uma nova auditoria integral do PDF. A versão original tinha registrado leitura do texto e das figuras. Capas e sumário (páginas 1–5) continuam editoriais, e a introdução da página 6 permanece excluída por solicitação do usuário.

[coverage.json](coverage.json) relaciona as aulas, objetivos, páginas e IDs atuais. Todos os conceitos essenciais registrados nas 17 aulas continuam representados, com referências às páginas 7–41. Cobertura de páginas e correspondências entre IDs são verificações estruturais, não uma prova automática de equivalência de todo texto ou figura.

As perguntas deixam de exigir a memorização de listas comerciais e narrativas históricas sem valor durável. Exemplos numéricos úteis continuam identificados como exemplos; a opinião do autor não é convertida em garantia de retorno ou recomendação universal.

## Matriz por aula

| Seção                                              | Páginas do PDF | Cartões | Conteúdo                                                                                                                 |
| -------------------------------------------------- | -------------- | ------: | ------------------------------------------------------------------------------------------------------------------------ |
| Aula 1 — Fundamentos da renda fixa                 | 7, 8           |       7 | Regra de remuneração; Empréstimo e juros; Renda variável; Papel na carteira; Mapa de produtos                            |
| Aula 2 — Corretoras, custódia e incentivos         | 8, 9, 10       |      13 | Intermediação e custódia; FGC e fiscalização; B3 e CVM; Comparação de plataformas; Remuneração e incentivos              |
| Aula 3 — Tesouro Direto, inflação e Selic          | 11, 12, 13     |      12 | Dívida soberana; Acesso ao Tesouro; Inflação e deflação; Política monetária; Famílias de títulos                         |
| Aula 4 — Tesouro Selic e tributação                | 13, 14, 15     |      11 | Pós-fixação; Liquidez da reserva; Selic meta e efetiva; DI; IOF e IR                                                     |
| Aula 5 — Prefixados e poder de compra              | 15, 16, 17     |      10 | Taxa contratada; Juros compostos; Valor de face; Venda antecipada; Nominal e real                                        |
| Aula 6 — Tesouro IPCA+                             | 18             |       6 | Indexação e taxa real; Composição das taxas; Valor nominal atualizado; IR sobre correção monetária                       |
| Aula 7.1 — Marcação a mercado: mecanismo           | 18, 19         |       3 | Preço e taxa; Analogia da balança; Ganho antecipado; Limites da especulação                                              |
| Aula 7.2 — Marcação a mercado: gráficos e decisões | 20, 21, 22     |      11 | Acesso e cotações; Curvas de preço; Exemplos históricos; Venda líquida e reinvestimento; Limites das heurísticas         |
| Aula 8 — Títulos com juros semestrais              | 23             |       6 | Cupons e renda; Acumulação e reinvestimento; Tributação; Calendário                                                      |
| Aula 9 — Tesouro Educa+ e Renda+                   | 24, 25         |       7 | Objetivos educacionais e aposentadoria; Acumulação e conversão; Simuladores; Pagamentos mensais                          |
| Aula 10 — CDB, LC, RDB, bancos e FGC               | 26, 27, 28     |      17 | Liquidez interbancária e DI; Prêmio de risco; Índice de Basileia; Emissores e siglas; Garantia agregada                  |
| Aula 11 — LCI, LCA e mercado secundário            | 29, 30         |      10 | Setores de crédito; Tributação e comparação líquida; FGC; Prazos e carência; Revenda                                     |
| Aula 12 — CRI, CRA e ratings                       | 30, 31         |       8 | Securitização; Diferenças frente a LCI/LCA; FGC e garantias; Tributação; Ratings e fluxos                                |
| Aula 13 — Debêntures                               | 31, 32, 33     |      14 | Dívida empresarial; Incentivadas; Análise do emissor; Credor versus acionista; Liquidez, IR e distribuição               |
| Aula 14 — Fundos, custos e come-cotas              | 33, 34, 35, 36 |      15 | Cotas e gestão; Benchmark; Taxas; Exemplos históricos; Comportamento; Come-cotas; Posição do curso                       |
| Aula 15 — Previdência privada e planejamento       | 36, 37, 38     |      18 | Reserva e capitalização; Previdência e supervisão; Custos e portabilidade; PGBL e VGBL; Sucessão e tributação            |
| Aula 16 — Contrafluxo e incentivos de distribuição | 39, 40, 41     |      13 | Spread e rebate; Conflitos e sazonalidade; CDI versus taxa fixa e IPCA; Exemplos e limitações; Horizonte de investimento |
| Aula 17 — Montagem da carteira de renda fixa       | 41             |       4 | Rotina de pesquisa; Mercado secundário; Aplicação do contrafluxo; Comparação e objetivos                                 |

## Precisão técnica

- Regra de remuneração não é preço fixo ou ausência de risco de crédito.
- Inflação, retorno nominal, retorno real e resultado líquido são grandezas diferentes.
- Marcação a mercado depende de fluxos e taxas; venda e reinvestimento exigem o mesmo horizonte e bases líquidas compatíveis.
- A composição de inflação de 9% e taxa real de 5% resulta em 14,45%; o exemplo de R$ 33.391,39 a 13% por 54 meses resulta em aproximadamente R$ 57.874,53 na convenção simplificada.
- FGC, custódia, fiscalização e liquidez não são garantias intercambiáveis.
- Tributação é tratada por base, prazo e enquadramento; não se generaliza isenção, come-cotas ou alíquota para todo produto.
- Rating, Basileia e relatórios são insumos de análise, não certificados de ausência de risco.
- Contrafluxo e preferências do curso são apresentados com suas hipóteses e limitações.

As fontes e o recorte das verificações estão em [references.json](references.json), incluindo [FGC](https://www.fgc.org.br/pt-br/sobre-garantia-fgc), [Tesouro Direto](https://www.tesourodireto.com.br/b/declaracao-imposto-de-renda), [SUSEP](https://www.gov.br/susep/pt-br/assuntos/meu-futuro-seguro/seguros-previdencia-e-capitalizacao/providencia-complementar-aberta/pgbl-vgbl), Banco Central e referências jurídicas do Tema 1214.
