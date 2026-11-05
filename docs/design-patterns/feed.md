# Design Patterns no Feed

O Feed inclui **22 carrosséis**, um para cada padrão do catálogo consultado, com **362 cards** no total. São **16 ou 17 cards por tema**, conforme o apoio visual disponível. O conteúdo foi preparado para aprender uma ideia de forma encadeada; os flashcards existentes continuam voltados à recuperação ativa e revisão.

## Organização de cada estudo

A sequência parte da intenção e de um problema concreto, explica a mudança de desenho e os participantes, define o contrato e acompanha uma execução. Depois apresenta uma implementação em TypeScript, interpreta o resultado e discute evolução, testes e limites. A parte final compara decisões, propõe um exercício, comenta a resposta e ajuda a decidir quando a complexidade se justifica.

Os estudos de caso, código e exercícios são originais deste projeto. As fontes do Refactoring.Guru apoiam a síntese conceitual e permanecem acessíveis em cada carrossel. O material não copia integralmente os artigos nem promete reproduzir todos os seus detalhes. Nenhum código do site foi copiado para os exemplos executáveis.

## Arquivos editáveis

- [Composição dos arquivos de carrosséis](../../src/content/decks/design-patterns/carousels/index.ts).
- [Matriz de temas e fontes por carrossel](feed-coverage.json).
- [Exemplos TypeScript executáveis](../../src/content/decks/design-patterns/carousels/examples): cada arquivo exporta `demo`, sem rede ou acesso a dados reais.
- Os testes executam os exemplos e conferem se o código mostrado nos cards corresponde aos arquivos. Ao atualizar um exemplo, atualize também o bloco de código no catálogo.
- [Manifesto das ilustrações já incluídas](../../src/content/decks/design-patterns/assets.json): reutiliza os mesmos dez arquivos autorizados, com créditos e links. Os 22 mapas de responsabilidades são autorais. Nenhuma nova ilustração do fornecedor foi adicionada.

## Instalação e persistência

`bundled-catalog.ts` adiciona os temas ausentes sem substituir IDs existentes. `loadFeed` registra, em uma transação, os IDs já oferecidos por baralho. O marcador antigo `catalog:design-patterns:v1` é reconhecido e migrado sem restaurar exclusões. Funciona tanto em uma biblioteca nova quanto numa biblioteca local anterior a esta entrega. Os exemplos iniciais e os carrosséis pessoais são preservados.

Cada ID de carrossel é instalado uma vez; novos arquivos podem acrescentar novos IDs. Os carrosséis incluídos podem ser adaptados e excluídos pelo editor; alterações e exclusões não são desfeitas ao reabrir a página. Importar outro backup depois da instalação continua substituindo somente o Feed, sem repor automaticamente os temas excluídos. O catálogo do repositório continua disponível para uma restauração manual consciente.

Progresso, revisões de conteúdo, imagens locais e fontes são preservados no backup. Não há integração com DynamoDB. O catálogo é distribuído num chunk próprio e entra no precache da PWA. Após o carregamento completo da aplicação, o estudo funciona offline; abrir uma fonte externa exige internet.

A quantidade de cards de um carrossel não tem teto fixo. Permanecem os limites de tamanho do conteúdo e do armazenamento descritos em [Feed de aprendizado](../feed.md). Se uma biblioteca já estiver tão próxima desses limites que os temas não caibam, a instalação é adiada e os dados existentes continuam acessíveis; reduzir o conteúdo e reabrir permite tentar novamente.

## Índice

| Padrão / fonte                                                                              | Cards | Exemplo original                                                                                    |
| ------------------------------------------------------------------------------------------- | ----- | --------------------------------------------------------------------------------------------------- |
| [Factory Method](https://refactoring.guru/design-patterns/factory-method)                   | 17    | [TypeScript](../../src/content/decks/design-patterns/carousels/examples/factory-method.ts)          |
| [Abstract Factory](https://refactoring.guru/design-patterns/abstract-factory)               | 16    | [TypeScript](../../src/content/decks/design-patterns/carousels/examples/abstract-factory.ts)        |
| [Builder](https://refactoring.guru/design-patterns/builder)                                 | 17    | [TypeScript](../../src/content/decks/design-patterns/carousels/examples/builder.ts)                 |
| [Prototype](https://refactoring.guru/design-patterns/prototype)                             | 16    | [TypeScript](../../src/content/decks/design-patterns/carousels/examples/prototype.ts)               |
| [Singleton](https://refactoring.guru/design-patterns/singleton)                             | 16    | [TypeScript](../../src/content/decks/design-patterns/carousels/examples/singleton.ts)               |
| [Adapter](https://refactoring.guru/design-patterns/adapter)                                 | 17    | [TypeScript](../../src/content/decks/design-patterns/carousels/examples/adapter.ts)                 |
| [Bridge](https://refactoring.guru/design-patterns/bridge)                                   | 17    | [TypeScript](../../src/content/decks/design-patterns/carousels/examples/bridge.ts)                  |
| [Composite](https://refactoring.guru/design-patterns/composite)                             | 17    | [TypeScript](../../src/content/decks/design-patterns/carousels/examples/composite.ts)               |
| [Decorator](https://refactoring.guru/design-patterns/decorator)                             | 17    | [TypeScript](../../src/content/decks/design-patterns/carousels/examples/decorator.ts)               |
| [Facade](https://refactoring.guru/design-patterns/facade)                                   | 16    | [TypeScript](../../src/content/decks/design-patterns/carousels/examples/facade.ts)                  |
| [Flyweight](https://refactoring.guru/design-patterns/flyweight)                             | 16    | [TypeScript](../../src/content/decks/design-patterns/carousels/examples/flyweight.ts)               |
| [Proxy](https://refactoring.guru/design-patterns/proxy)                                     | 16    | [TypeScript](../../src/content/decks/design-patterns/carousels/examples/proxy.ts)                   |
| [Chain of Responsibility](https://refactoring.guru/design-patterns/chain-of-responsibility) | 17    | [TypeScript](../../src/content/decks/design-patterns/carousels/examples/chain-of-responsibility.ts) |
| [Command](https://refactoring.guru/design-patterns/command)                                 | 16    | [TypeScript](../../src/content/decks/design-patterns/carousels/examples/command.ts)                 |
| [Iterator](https://refactoring.guru/design-patterns/iterator)                               | 16    | [TypeScript](../../src/content/decks/design-patterns/carousels/examples/iterator.ts)                |
| [Mediator](https://refactoring.guru/design-patterns/mediator)                               | 16    | [TypeScript](../../src/content/decks/design-patterns/carousels/examples/mediator.ts)                |
| [Memento](https://refactoring.guru/design-patterns/memento)                                 | 16    | [TypeScript](../../src/content/decks/design-patterns/carousels/examples/memento.ts)                 |
| [Observer](https://refactoring.guru/design-patterns/observer)                               | 17    | [TypeScript](../../src/content/decks/design-patterns/carousels/examples/observer.ts)                |
| [State](https://refactoring.guru/design-patterns/state)                                     | 17    | [TypeScript](../../src/content/decks/design-patterns/carousels/examples/state.ts)                   |
| [Strategy](https://refactoring.guru/design-patterns/strategy)                               | 17    | [TypeScript](../../src/content/decks/design-patterns/carousels/examples/strategy.ts)                |
| [Template Method](https://refactoring.guru/design-patterns/template-method)                 | 16    | [TypeScript](../../src/content/decks/design-patterns/carousels/examples/template-method.ts)         |
| [Visitor](https://refactoring.guru/design-patterns/visitor)                                 | 16    | [TypeScript](../../src/content/decks/design-patterns/carousels/examples/visitor.ts)                 |
