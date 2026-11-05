# Baralhos de conteúdo do repositório

Um baralho é uma identidade compartilhada por flashcards, carrosséis e futuros
recursos de aprendizado. Cada recurso usa `deckId`, sem criar um baralho paralelo
para cada formato.

```text
src/content/decks/
├── aws/
│   ├── deck.json
│   ├── flashcards/
│   │   ├── index.ts
│   │   ├── part-01.json
│   │   └── part-02.json
│   └── carousels/
│       └── index.ts
├── learning/
│   ├── deck.json
│   ├── flashcards/
│   └── carousels/
│       ├── index.ts
│       └── intro.json
└── design-patterns/
    ├── deck.json
    ├── assets.json
    ├── flashcards/
    │   ├── index.ts
    │   ├── creational.json
    │   ├── structural.json
    │   └── behavioral.json
    └── carousels/
        ├── index.ts
        ├── creational.json
        ├── structural.json
        ├── behavioral.json
        └── examples/
```

`deck.json` contém ID, nome, política de sincronização e um mapa `content`, cujas
chaves identificam formatos e cujos valores listam arquivos relativos à pasta.
Novos formatos podem adicionar chaves sem alterar a identidade do baralho.

Os `index.ts` compõem vários arquivos JSON por formato em um único catálogo, com
imports explícitos que funcionam no Vite, no Bun e nos testes de navegador. Para
adicionar um arquivo a um baralho existente:

1. Crie o JSON na pasta do formato correspondente, seguindo seus vizinhos. Mantenha
   IDs de recursos, cards e blocos estáveis e únicos no escopo validado.
2. Acrescente o caminho em `deck.json` e o import/array no `index.ts` daquele formato.
3. Para carrosséis, use o mesmo `deckId` do manifesto. Cada JSON usa `folha-feed`,
   versão 1, `carousels` e `progress: []`; opcionalmente inclui os metadados `decks`.
4. Rode `bun run check:all`.

O carregador de carrosséis registra os IDs já oferecidos por baralho. Acrescentar
arquivos com novos IDs instala os novos recursos sem restaurar carrosséis que o
usuário excluiu nem substituir suas edições/progresso. Catálogos antigos com um
marcador booleano são migrados sem reinstalar recursos excluídos.

Para um baralho novo, registre seu manifesto em `catalog.ts`, o catálogo de
carrosséis em `features/feed/bundled-catalog.ts` e seu adaptador de flashcards em
`features/bundled-decks/catalog.ts`. Os formatos atuais de flashcards AWS e Design
Patterns têm adaptadores próprios; novos baralhos precisam de um adaptador
compatível com seu JSON. Reservas de IDs e política de sincronização ficam em
`features/bundled-decks/ids.ts` e devem acompanhar novos conteúdos locais.

Os IDs existentes foram preservados: `builtin-aws-services` e
`builtin-patterns-design`. Os exemplos iniciais foram movidos para `learning/`,
com o ID compartilhado `local-learning`; não são reinstalados em feeds existentes. Recursos do repositório continuam locais, e carrosséis
não participam do protocolo de sincronização de flashcards com o DynamoDB.
