# Design Patterns · material de estudo local

Baralho incluído automaticamente: **147 cartões** sobre **22 padrões**, com quantidade determinada pelos alvos de aprendizagem de cada padrão. Conteúdo reformulado em **2026-11-12** com a skill `criar-otimizar-flashcards`, em português, com perguntas focadas, respostas curtas e exemplos de aplicação.

## Escopo e cobertura

Este diretório é um índice e uma matriz de estudo, não um espelho do site. O texto integral, as analogias, o pseudocódigo e todos os detalhes dos artigos não foram copiados. O material sintetiza os temas abaixo; não representa cobertura de 100% dos artigos nem substitui a leitura das páginas de origem.

| Tema do cartão | Foco de estudo                                |
| -------------- | --------------------------------------------- |
| Conceito       | Intenção e responsabilidade principal         |
| Problema       | Sintomas e acoplamento que motivam o padrão   |
| Estrutura      | Participantes e colaboração, com apoio visual |
| Implementação  | Decisões de introdução no código              |
| Exemplo        | Cenário curto e original                      |
| Aplicabilidade | Situações em que a abstração pode ajudar      |
| Trade-offs     | Custos, limites e cuidados de manutenção      |
| Comparação     | Diferenças e relações com outros mecanismos   |

Os temas são objetivos de cobertura, não uma quota de oito cartões. Um mesmo alvo pode cobrir problema e aplicabilidade sem exigir duas perguntas redundantes; comparações também podem estar num cartão de outro padrão. Os IDs mantidos permanecem estáveis. Consulte a fonte para explicações e exemplos completos dos artigos.

## Conteúdo e operação

- [Conteúdo editável](../../src/content/decks/design-patterns/flashcards/index.ts): perguntas, respostas, categorias e fontes por padrão.
- [Manifesto das ilustrações](../../src/content/decks/design-patterns/assets.json): origem, crédito, data e SHA-256 dos arquivos obtidos do Refactoring.Guru.
- [Arquivos visuais locais](../../public/study-assets/design-patterns): dez ilustrações do site e 22 mapas autorais de responsabilidades. Os mapas não são diagramas UML nem cópias das ilustrações originais.
- `patterns.ts` converte o catálogo para o template de vários versos. O cartão de estrutura oferece o mapa autoral num verso “Mapa de papéis”; nos dez padrões com imagem do site, o verso “Estrutura ilustrada” também pode ser revelado separadamente. As imagens não aparecem automaticamente na pergunta, evitando pistas que entreguem a resposta. Clique numa imagem para ampliá-la.
- Baralho e cartões usam `syncEnabled: false` e IDs `builtin-patterns-*`, protegidos pelo cliente e pelo backend. Não há gravação deste conteúdo ou progresso no DynamoDB.
- A composição de baralhos preserva conteúdo AWS, cartões pessoais, agendamento e favoritos. Catálogos são atualizados por ID ao abrir, salvar ou restaurar.
- A PWA inclui PNGs e SVGs no precache. Após o primeiro carregamento completo, cartões e imagens funcionam offline. Não há hotlink ou consulta ao Refactoring.Guru durante o estudo; links de fonte externos exigem internet.

## Revisão pedagógica e progresso

Os 176 registros anteriores foram retirados do índice semântico antes da análise. As perguntas foram reformuladas e comparadas com os demais baralhos e entre si. Vinte e nove alvos repetidos foram consolidados, resultando em 147 cartões, sem meta artificial de quantidade. Não houve classificação automática de duplicação por pontuação.

A análise manteve intenções, papéis, mecanismos, aplicações, custos e distinções relevantes. Por exemplo, a ordem de composição de uma cadeia e a regra de continuação de cada handler continuam separadas; perguntas que apenas repetiam a mesma extração de coordenação foram reunidas. Os exemplos agora pedem aplicar uma ideia num cenário, em vez de recordar uma narrativa arbitrária. O nome do padrão na frente não entrega a operação que precisa ser explicada.

[revision.json](../../src/content/decks/design-patterns/revision.json) associa cada um dos 176 IDs anteriores a seus destinos e registra exemplos de decisões sobre os candidatos semânticos. [coverage.json](coverage.json) mantém os temas de origem e a quantidade atual por padrão. A matriz verifica referências e cobertura estrutural; ela não prova automaticamente equivalência de todo conteúdo dos artigos.

O baralho mantém `builtin-patterns-design`. Os 147 IDs conservados preservam avaliações, intervalo, próxima revisão e favorito; as revisões dos 29 cartões consolidados não são copiadas para seus destinos. Não foi criado outro baralho nem apagado o histórico de eventos, que fica separado do conteúdo. Cartões pessoais do mesmo baralho também são preservados.

Permanecem os três complementos pedidos: **Entenda o padrão**, **Contexto e aplicação** e **Por que a resposta está certa?**. Os mapas e as ilustrações passam a ser consulta revelável; não há novos arquivos de terceiros ou alterações nos 22 carrosséis e seus exemplos.

A revisão usa o acervo local e verificações pontuais nas páginas de [Factory Method](https://refactoring.guru/design-patterns/factory-method), [Decorator](https://refactoring.guru/design-patterns/decorator), [State](https://refactoring.guru/design-patterns/state) e [Visitor](https://refactoring.guru/design-patterns/visitor). Não é uma nova auditoria integral de cada artigo nem uma cópia do site. Após a revisão, o índice recebe somente os 147 cartões atualizados deste baralho.

## Uso das imagens e atribuição

A [política de conteúdo do Refactoring.Guru](https://refactoring.guru/content-usage-policy), consultada em 2026-11-04, permite até dez ilustrações no conjunto das publicações e apresentações, com hyperlink para a página de origem. Este repositório inclui **dez arquivos distintos** sob essa permissão. O crédito exibido é **Refactoring.Guru · ilustração: Dmitry Zhart**. As imagens conservam seu conteúdo original.

Não foi obtida autorização para reproduzir integralmente os artigos nem para ampliar o número de ilustrações do fornecedor. Os demais recursos visuais são autorais. O manifesto e o teste de integridade permitem identificar quais arquivos são de terceiros e verificar o limite de dez.

## Índice das fontes e dos recursos

| Categoria       | Padrão / fonte consultada                                                                   | Cartões | Ilustração do site                                                                            | Mapa autoral                                                                       |
| --------------- | ------------------------------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Criacionais     | [Factory Method](https://refactoring.guru/design-patterns/factory-method)                   | 7       | [PNG](../../public/study-assets/design-patterns/factory-method-refactoring-guru.png)          | [SVG](../../public/study-assets/design-patterns/factory-method-roles.svg)          |
| Criacionais     | [Abstract Factory](https://refactoring.guru/design-patterns/abstract-factory)               | 6       | —                                                                                             | [SVG](../../public/study-assets/design-patterns/abstract-factory-roles.svg)        |
| Criacionais     | [Builder](https://refactoring.guru/design-patterns/builder)                                 | 7       | [PNG](../../public/study-assets/design-patterns/builder-refactoring-guru.png)                 | [SVG](../../public/study-assets/design-patterns/builder-roles.svg)                 |
| Criacionais     | [Prototype](https://refactoring.guru/design-patterns/prototype)                             | 7       | —                                                                                             | [SVG](../../public/study-assets/design-patterns/prototype-roles.svg)               |
| Criacionais     | [Singleton](https://refactoring.guru/design-patterns/singleton)                             | 7       | —                                                                                             | [SVG](../../public/study-assets/design-patterns/singleton-roles.svg)               |
| Estruturais     | [Adapter](https://refactoring.guru/design-patterns/adapter)                                 | 7       | [PNG](../../public/study-assets/design-patterns/adapter-refactoring-guru.png)                 | [SVG](../../public/study-assets/design-patterns/adapter-roles.svg)                 |
| Estruturais     | [Bridge](https://refactoring.guru/design-patterns/bridge)                                   | 7       | [PNG](../../public/study-assets/design-patterns/bridge-refactoring-guru.png)                  | [SVG](../../public/study-assets/design-patterns/bridge-roles.svg)                  |
| Estruturais     | [Composite](https://refactoring.guru/design-patterns/composite)                             | 6       | [PNG](../../public/study-assets/design-patterns/composite-refactoring-guru.png)               | [SVG](../../public/study-assets/design-patterns/composite-roles.svg)               |
| Estruturais     | [Decorator](https://refactoring.guru/design-patterns/decorator)                             | 7       | [PNG](../../public/study-assets/design-patterns/decorator-refactoring-guru.png)               | [SVG](../../public/study-assets/design-patterns/decorator-roles.svg)               |
| Estruturais     | [Facade](https://refactoring.guru/design-patterns/facade)                                   | 7       | —                                                                                             | [SVG](../../public/study-assets/design-patterns/facade-roles.svg)                  |
| Estruturais     | [Flyweight](https://refactoring.guru/design-patterns/flyweight)                             | 7       | —                                                                                             | [SVG](../../public/study-assets/design-patterns/flyweight-roles.svg)               |
| Estruturais     | [Proxy](https://refactoring.guru/design-patterns/proxy)                                     | 5       | —                                                                                             | [SVG](../../public/study-assets/design-patterns/proxy-roles.svg)                   |
| Comportamentais | [Chain of Responsibility](https://refactoring.guru/design-patterns/chain-of-responsibility) | 7       | [PNG](../../public/study-assets/design-patterns/chain-of-responsibility-refactoring-guru.png) | [SVG](../../public/study-assets/design-patterns/chain-of-responsibility-roles.svg) |
| Comportamentais | [Command](https://refactoring.guru/design-patterns/command)                                 | 8       | —                                                                                             | [SVG](../../public/study-assets/design-patterns/command-roles.svg)                 |
| Comportamentais | [Iterator](https://refactoring.guru/design-patterns/iterator)                               | 6       | —                                                                                             | [SVG](../../public/study-assets/design-patterns/iterator-roles.svg)                |
| Comportamentais | [Mediator](https://refactoring.guru/design-patterns/mediator)                               | 6       | —                                                                                             | [SVG](../../public/study-assets/design-patterns/mediator-roles.svg)                |
| Comportamentais | [Memento](https://refactoring.guru/design-patterns/memento)                                 | 6       | —                                                                                             | [SVG](../../public/study-assets/design-patterns/memento-roles.svg)                 |
| Comportamentais | [Observer](https://refactoring.guru/design-patterns/observer)                               | 7       | [PNG](../../public/study-assets/design-patterns/observer-refactoring-guru.png)                | [SVG](../../public/study-assets/design-patterns/observer-roles.svg)                |
| Comportamentais | [State](https://refactoring.guru/design-patterns/state)                                     | 7       | [PNG](../../public/study-assets/design-patterns/state-refactoring-guru.png)                   | [SVG](../../public/study-assets/design-patterns/state-roles.svg)                   |
| Comportamentais | [Strategy](https://refactoring.guru/design-patterns/strategy)                               | 6       | [PNG](../../public/study-assets/design-patterns/strategy-refactoring-guru.png)                | [SVG](../../public/study-assets/design-patterns/strategy-roles.svg)                |
| Comportamentais | [Template Method](https://refactoring.guru/design-patterns/template-method)                 | 7       | —                                                                                             | [SVG](../../public/study-assets/design-patterns/template-method-roles.svg)         |
| Comportamentais | [Visitor](https://refactoring.guru/design-patterns/visitor)                                 | 7       | —                                                                                             | [SVG](../../public/study-assets/design-patterns/visitor-roles.svg)                 |

## Apoio didático nos flashcards

Os 147 cartões revisados mantêm a resposta curta e os três versos complementares:

- **Entenda o padrão:** explicação acessível do mecanismo e de seus limites.
- **Contexto e aplicação:** cenário concreto, participantes e consequências da escolha.
- **Por que a resposta está certa?:** justificativa própria para a pergunta, aprofundando o raciocínio sem apenas repetir a resposta.

A explicação e o contexto são compartilhados pelas perguntas do mesmo padrão; cada pergunta possui sua própria justificativa no JSON. O adaptador materializa esses textos em versos com IDs estáveis. As ilustrações permanecem disponíveis. A atualização preserva IDs e progresso dos cartões mantidos, continua disponível offline e não envia o baralho ao DynamoDB; os destinos dos cartões consolidados são registrados na matriz de revisão.
