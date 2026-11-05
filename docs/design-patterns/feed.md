# Design Patterns no Feed

O Feed inclui **22 carrosséis**, um para cada padrão do catálogo consultado, com **362 cards** no total. São **16 ou 17 cards por tema**, conforme o apoio visual disponível. O conteúdo foi preparado para aprender uma ideia de forma encadeada; os flashcards existentes continuam voltados à recuperação ativa e revisão.

## Organização de cada estudo

A sequência parte da intenção e de um problema concreto, explica a mudança de desenho e os participantes, define o contrato e acompanha uma execução. Depois apresenta uma implementação em TypeScript, interpreta o resultado e discute evolução, testes e limites. A parte final compara decisões, propõe um exercício, comenta a resposta e ajuda a decidir quando a complexidade se justifica.

Os estudos de caso, código e exercícios são originais deste projeto. As fontes do Refactoring.Guru apoiam a síntese conceitual e permanecem acessíveis em cada carrossel. O material não copia integralmente os artigos nem promete reproduzir todos os seus detalhes. Nenhum código do site foi copiado para os exemplos executáveis.

## Arquivos editáveis

- [Catálogo completo, também importável como backup do Feed](../../src/content/feed-design-patterns.json).
- [Matriz de temas e fontes por carrossel](feed-coverage.json).
- [Exemplos TypeScript executáveis](../../src/content/pattern-examples): cada arquivo exporta `demo`, sem rede ou acesso a dados reais.
- Os testes executam os exemplos e conferem se o código mostrado nos cards corresponde aos arquivos. Ao atualizar um exemplo, atualize também o bloco de código no catálogo.
- [Manifesto das ilustrações já incluídas](../../src/content/design-pattern-assets.json): reutiliza os mesmos dez arquivos autorizados, com créditos e links. Os 22 mapas de responsabilidades são autorais. Nenhuma nova ilustração do fornecedor foi adicionada.

## Instalação e persistência

`pattern-catalog.ts` adiciona os temas ausentes sem substituir IDs existentes. `loadFeed` faz a instalação em uma transação junto com o marcador `catalog:design-patterns:v1`. Funciona tanto em uma biblioteca nova quanto numa biblioteca local anterior a esta entrega. Os exemplos iniciais e os carrosséis pessoais são preservados.

A instalação acontece uma vez. Os carrosséis incluídos podem ser adaptados e excluídos pelo editor; alterações e exclusões não são desfeitas ao reabrir a página. Importar outro backup depois da instalação continua substituindo somente o Feed, sem repor automaticamente os temas excluídos. O catálogo do repositório continua disponível para uma restauração manual consciente.

Progresso, revisões de conteúdo, imagens locais e fontes são preservados no backup. Não há integração com DynamoDB. O catálogo é distribuído num chunk próprio e entra no precache da PWA. Após o carregamento completo da aplicação, o estudo funciona offline; abrir uma fonte externa exige internet.

A quantidade de cards de um carrossel não tem teto fixo. Permanecem os limites de tamanho do conteúdo e do armazenamento descritos em [Feed de aprendizado](../feed.md). Se uma biblioteca já estiver tão próxima desses limites que os temas não caibam, a instalação é adiada e os dados existentes continuam acessíveis; reduzir o conteúdo e reabrir permite tentar novamente.

## Índice

| Padrão / fonte                                                                              | Cards | Exemplo original                                                            |
| ------------------------------------------------------------------------------------------- | ----- | --------------------------------------------------------------------------- |
| [Factory Method](https://refactoring.guru/design-patterns/factory-method)                   | 17    | [TypeScript](../../src/content/pattern-examples/factory-method.ts)          |
| [Abstract Factory](https://refactoring.guru/design-patterns/abstract-factory)               | 16    | [TypeScript](../../src/content/pattern-examples/abstract-factory.ts)        |
| [Builder](https://refactoring.guru/design-patterns/builder)                                 | 17    | [TypeScript](../../src/content/pattern-examples/builder.ts)                 |
| [Prototype](https://refactoring.guru/design-patterns/prototype)                             | 16    | [TypeScript](../../src/content/pattern-examples/prototype.ts)               |
| [Singleton](https://refactoring.guru/design-patterns/singleton)                             | 16    | [TypeScript](../../src/content/pattern-examples/singleton.ts)               |
| [Adapter](https://refactoring.guru/design-patterns/adapter)                                 | 17    | [TypeScript](../../src/content/pattern-examples/adapter.ts)                 |
| [Bridge](https://refactoring.guru/design-patterns/bridge)                                   | 17    | [TypeScript](../../src/content/pattern-examples/bridge.ts)                  |
| [Composite](https://refactoring.guru/design-patterns/composite)                             | 17    | [TypeScript](../../src/content/pattern-examples/composite.ts)               |
| [Decorator](https://refactoring.guru/design-patterns/decorator)                             | 17    | [TypeScript](../../src/content/pattern-examples/decorator.ts)               |
| [Facade](https://refactoring.guru/design-patterns/facade)                                   | 16    | [TypeScript](../../src/content/pattern-examples/facade.ts)                  |
| [Flyweight](https://refactoring.guru/design-patterns/flyweight)                             | 16    | [TypeScript](../../src/content/pattern-examples/flyweight.ts)               |
| [Proxy](https://refactoring.guru/design-patterns/proxy)                                     | 16    | [TypeScript](../../src/content/pattern-examples/proxy.ts)                   |
| [Chain of Responsibility](https://refactoring.guru/design-patterns/chain-of-responsibility) | 17    | [TypeScript](../../src/content/pattern-examples/chain-of-responsibility.ts) |
| [Command](https://refactoring.guru/design-patterns/command)                                 | 16    | [TypeScript](../../src/content/pattern-examples/command.ts)                 |
| [Iterator](https://refactoring.guru/design-patterns/iterator)                               | 16    | [TypeScript](../../src/content/pattern-examples/iterator.ts)                |
| [Mediator](https://refactoring.guru/design-patterns/mediator)                               | 16    | [TypeScript](../../src/content/pattern-examples/mediator.ts)                |
| [Memento](https://refactoring.guru/design-patterns/memento)                                 | 16    | [TypeScript](../../src/content/pattern-examples/memento.ts)                 |
| [Observer](https://refactoring.guru/design-patterns/observer)                               | 17    | [TypeScript](../../src/content/pattern-examples/observer.ts)                |
| [State](https://refactoring.guru/design-patterns/state)                                     | 17    | [TypeScript](../../src/content/pattern-examples/state.ts)                   |
| [Strategy](https://refactoring.guru/design-patterns/strategy)                               | 17    | [TypeScript](../../src/content/pattern-examples/strategy.ts)                |
| [Template Method](https://refactoring.guru/design-patterns/template-method)                 | 16    | [TypeScript](../../src/content/pattern-examples/template-method.ts)         |
| [Visitor](https://refactoring.guru/design-patterns/visitor)                                 | 16    | [TypeScript](../../src/content/pattern-examples/visitor.ts)                 |
