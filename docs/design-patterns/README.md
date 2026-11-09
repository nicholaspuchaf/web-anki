# Design Patterns · material de estudo local

Baralho incluído automaticamente: **176 cartões**, **22 padrões**, **8 cartões por padrão**. Conteúdo revisado em **2026-11-04**, em português, com perguntas, respostas e exemplos redigidos para este projeto.

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

Os IDs dos cartões usam esses oito temas. Eles são identificadores editoriais estáveis, não uma estimativa automática de cobertura textual. Cada resposta é curta para favorecer recuperação ativa; consulte a fonte para as explicações extensas e os exemplos completos.

## Conteúdo e operação

- [Conteúdo editável](../../src/content/decks/design-patterns/flashcards/index.ts): perguntas, respostas, categorias e fontes por padrão.
- [Manifesto das ilustrações](../../src/content/decks/design-patterns/assets.json): origem, crédito, data e SHA-256 dos arquivos obtidos do Refactoring.Guru.
- [Arquivos visuais locais](../../public/study-assets/design-patterns): dez ilustrações do site e 22 mapas autorais de responsabilidades. Os mapas não são diagramas UML nem cópias das ilustrações originais.
- `patterns.ts` converte o catálogo para o template de vários versos. O cartão de estrutura mostra o mapa autoral na pergunta; nos dez padrões com imagem do site, o verso “Estrutura ilustrada” pode ser revelado separadamente. Clique numa imagem para ampliá-la.
- Baralho e cartões usam `syncEnabled: false` e IDs `builtin-patterns-*`, protegidos pelo cliente e pelo backend. Não há gravação deste conteúdo ou progresso no DynamoDB.
- A composição de baralhos preserva conteúdo AWS, cartões pessoais, agendamento e favoritos. Catálogos são atualizados por ID ao abrir, salvar ou restaurar.
- A PWA inclui PNGs e SVGs no precache. Após o primeiro carregamento completo, cartões e imagens funcionam offline. Não há hotlink ou consulta ao Refactoring.Guru durante o estudo; links de fonte externos exigem internet.

## Uso das imagens e atribuição

A [política de conteúdo do Refactoring.Guru](https://refactoring.guru/content-usage-policy), consultada em 2026-11-04, permite até dez ilustrações no conjunto das publicações e apresentações, com hyperlink para a página de origem. Este repositório inclui **dez arquivos distintos** sob essa permissão. O crédito exibido é **Refactoring.Guru · ilustração: Dmitry Zhart**. As imagens conservam seu conteúdo original.

Não foi obtida autorização para reproduzir integralmente os artigos nem para ampliar o número de ilustrações do fornecedor. Os demais recursos visuais são autorais. O manifesto e o teste de integridade permitem identificar quais arquivos são de terceiros e verificar o limite de dez.

## Índice das fontes e dos recursos

| Categoria       | Padrão / fonte consultada                                                                   | Cartões | Ilustração do site                                                                            | Mapa autoral                                                                       |
| --------------- | ------------------------------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Criacionais     | [Factory Method](https://refactoring.guru/design-patterns/factory-method)                   | 8       | [PNG](../../public/study-assets/design-patterns/factory-method-refactoring-guru.png)          | [SVG](../../public/study-assets/design-patterns/factory-method-roles.svg)          |
| Criacionais     | [Abstract Factory](https://refactoring.guru/design-patterns/abstract-factory)               | 8       | —                                                                                             | [SVG](../../public/study-assets/design-patterns/abstract-factory-roles.svg)        |
| Criacionais     | [Builder](https://refactoring.guru/design-patterns/builder)                                 | 8       | [PNG](../../public/study-assets/design-patterns/builder-refactoring-guru.png)                 | [SVG](../../public/study-assets/design-patterns/builder-roles.svg)                 |
| Criacionais     | [Prototype](https://refactoring.guru/design-patterns/prototype)                             | 8       | —                                                                                             | [SVG](../../public/study-assets/design-patterns/prototype-roles.svg)               |
| Criacionais     | [Singleton](https://refactoring.guru/design-patterns/singleton)                             | 8       | —                                                                                             | [SVG](../../public/study-assets/design-patterns/singleton-roles.svg)               |
| Estruturais     | [Adapter](https://refactoring.guru/design-patterns/adapter)                                 | 8       | [PNG](../../public/study-assets/design-patterns/adapter-refactoring-guru.png)                 | [SVG](../../public/study-assets/design-patterns/adapter-roles.svg)                 |
| Estruturais     | [Bridge](https://refactoring.guru/design-patterns/bridge)                                   | 8       | [PNG](../../public/study-assets/design-patterns/bridge-refactoring-guru.png)                  | [SVG](../../public/study-assets/design-patterns/bridge-roles.svg)                  |
| Estruturais     | [Composite](https://refactoring.guru/design-patterns/composite)                             | 8       | [PNG](../../public/study-assets/design-patterns/composite-refactoring-guru.png)               | [SVG](../../public/study-assets/design-patterns/composite-roles.svg)               |
| Estruturais     | [Decorator](https://refactoring.guru/design-patterns/decorator)                             | 8       | [PNG](../../public/study-assets/design-patterns/decorator-refactoring-guru.png)               | [SVG](../../public/study-assets/design-patterns/decorator-roles.svg)               |
| Estruturais     | [Facade](https://refactoring.guru/design-patterns/facade)                                   | 8       | —                                                                                             | [SVG](../../public/study-assets/design-patterns/facade-roles.svg)                  |
| Estruturais     | [Flyweight](https://refactoring.guru/design-patterns/flyweight)                             | 8       | —                                                                                             | [SVG](../../public/study-assets/design-patterns/flyweight-roles.svg)               |
| Estruturais     | [Proxy](https://refactoring.guru/design-patterns/proxy)                                     | 8       | —                                                                                             | [SVG](../../public/study-assets/design-patterns/proxy-roles.svg)                   |
| Comportamentais | [Chain of Responsibility](https://refactoring.guru/design-patterns/chain-of-responsibility) | 8       | [PNG](../../public/study-assets/design-patterns/chain-of-responsibility-refactoring-guru.png) | [SVG](../../public/study-assets/design-patterns/chain-of-responsibility-roles.svg) |
| Comportamentais | [Command](https://refactoring.guru/design-patterns/command)                                 | 8       | —                                                                                             | [SVG](../../public/study-assets/design-patterns/command-roles.svg)                 |
| Comportamentais | [Iterator](https://refactoring.guru/design-patterns/iterator)                               | 8       | —                                                                                             | [SVG](../../public/study-assets/design-patterns/iterator-roles.svg)                |
| Comportamentais | [Mediator](https://refactoring.guru/design-patterns/mediator)                               | 8       | —                                                                                             | [SVG](../../public/study-assets/design-patterns/mediator-roles.svg)                |
| Comportamentais | [Memento](https://refactoring.guru/design-patterns/memento)                                 | 8       | —                                                                                             | [SVG](../../public/study-assets/design-patterns/memento-roles.svg)                 |
| Comportamentais | [Observer](https://refactoring.guru/design-patterns/observer)                               | 8       | [PNG](../../public/study-assets/design-patterns/observer-refactoring-guru.png)                | [SVG](../../public/study-assets/design-patterns/observer-roles.svg)                |
| Comportamentais | [State](https://refactoring.guru/design-patterns/state)                                     | 8       | [PNG](../../public/study-assets/design-patterns/state-refactoring-guru.png)                   | [SVG](../../public/study-assets/design-patterns/state-roles.svg)                   |
| Comportamentais | [Strategy](https://refactoring.guru/design-patterns/strategy)                               | 8       | [PNG](../../public/study-assets/design-patterns/strategy-refactoring-guru.png)                | [SVG](../../public/study-assets/design-patterns/strategy-roles.svg)                |
| Comportamentais | [Template Method](https://refactoring.guru/design-patterns/template-method)                 | 8       | —                                                                                             | [SVG](../../public/study-assets/design-patterns/template-method-roles.svg)         |
| Comportamentais | [Visitor](https://refactoring.guru/design-patterns/visitor)                                 | 8       | —                                                                                             | [SVG](../../public/study-assets/design-patterns/visitor-roles.svg)                 |

## Apoio didático nos flashcards

Os 176 cartões mantêm a resposta curta e recebem três versos adicionais:

- **Entenda o padrão:** explicação acessível do mecanismo e de seus limites.
- **Contexto e aplicação:** cenário concreto, participantes e consequências da escolha.
- **Por que a resposta está certa?:** justificativa própria para a pergunta, aprofundando o raciocínio sem apenas repetir a resposta.

A explicação e o contexto são compartilhados pelas oito perguntas do mesmo padrão; cada pergunta possui sua própria justificativa no JSON. O adaptador materializa esses textos em versos com IDs estáveis. Respostas e ilustrações anteriores permanecem disponíveis. A atualização do catálogo preserva IDs, revisões, intervalos, vencimentos e favoritos, continua disponível offline e não envia o baralho ao DynamoDB.
