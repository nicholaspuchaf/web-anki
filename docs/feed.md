# Feed de aprendizado

O Feed é uma página separada em `/#/feed`, dedicada a aprender conceitos. Flashcards
continuam na seção de revisão. A navegação entre seções usa o hash da URL, incluindo
acesso direto e botões de voltar/avançar do navegador.

## Baralhos compartilhados

Flashcards e carrosséis usam a mesma identidade de `Deck`, definida em
`features/decks/model.ts`. “Design Patterns” reúne 176 flashcards e 22 carrosséis.
No Feed, **Meus carrosséis** permite escolher o baralho, consultar a contagem de
flashcards e carrosséis, iniciar **Estudar baralho** ou escolher **Estudar carrossel**.
A fila fica restrita ao baralho escolhido, incluindo suas releituras aleatórias;
a escolha de um carrossel específico inicia por ele, mesmo se já estiver em dia.
“Todos os baralhos” permite voltar ao estudo global.

O editor permite atribuir/mover o carrossel a qualquer baralho existente. Baralhos
pessoais criados na biblioteca de flashcards aparecem na seleção. A página de um
baralho oferece **Carrosséis deste baralho**, com link direto
`/#/feed?deck=ID`. Os conteúdos do repositório ficam em
[`src/content/decks/`](../src/content/decks/README.md), separados em arquivos por formato.

O carregamento organiza carrosséis antigos sem alterar IDs, slides ou progresso:
recursos de Design Patterns vão ao baralho existente; outros conteúdos antigos
vão a “Aprendizado geral”. Mover de baralho ou trocar somente a aparência conserva
o progresso; mudar o conteúdo de aprendizagem inicia uma nova revisão.

Os backups do Feed incluem metadados `decks` e `deckId` dos carrosséis. Backups
antigos continuam aceitos; nomes de baralhos existentes na biblioteca têm prioridade
sobre snapshots importados. Baralhos referenciados pelo Feed são recuperados pela
biblioteca ao abrir o aplicativo. A exclusão de um baralho com carrosséis é recusada
até que estes sejam movidos ou excluídos. Backup de flashcards e backup do Feed
continuam separados; conteúdo de carrosséis permanece somente local.

## Leitura

- Apenas um carrossel fica visível, ocupando no mínimo a área de leitura da tela.
  O conteúdo não tem altura máxima: textos e códigos longos rolam no próprio tema.
- No mobile, deslize para cima quando já estiver no fim para avançar de tema, ou
  para baixo no topo para voltar. Um gesto que começa no meio apenas rola o conteúdo.
  O histórico preserva o card horizontal e a posição vertical de cada carrossel.
- Cada carrossel possui cards horizontais, com swipe, setas, indicadores e
  navegação por teclado. O conteúdo pode ser longo; a rolagem vertical alcança
  o fim do card antes de passar ao próximo tema.
- No computador, setas laterais para cima e para baixo levam ao carrossel anterior
  ou seguinte; somente essas setas trocam temas. Rodinha, teclado e trackpad rolam
  apenas o conteúdo atual. A seta para baixo carrega outro tema quando necessário.
- O cabeçalho compacto mantém título, modos, contagem do dia e criação sem tomar
  a área principal de leitura. No mobile, o cabeçalho global e as abas dão lugar
  ao menu flutuante no canto superior esquerdo, com navegação, criação, aparência
  e backup. Exportar/importar ficam nesse menu também no desktop; o Feed não exibe rodapé.
- Um card é considerado lido quando seu fim permanece visível por 1,5 segundo,
  com a aba visível, o card selecionado e suas imagens carregadas. Não há botão de
  confirmação. Isso é um sinal de exposição ao conteúdo, não prova de compreensão.
- Só depois de todos os cards lidos o carrossel é concluído. Pré-visualizações e
  conteúdo atrás do editor não contabilizam leitura.
- O intervalo padrão é três dias, configurável entre um e trinta dias. O prazo
  começa na conclusão do carrossel, não na leitura do primeiro card.
- A fila inicial prioriza carrosséis novos, parciais ou vencidos, embaralhados. Ao
  esgotá-los, continua com releituras aleatórias. Com mais de um tema disponível,
  uma repetição não é imediatamente vizinha do mesmo tema.
- Releituras antes do prazo não mudam a próxima data nem aumentam o contador de
  conclusões. Quando vence, uma nova passagem exige ler todos os cards novamente.
- Reabrir a página inicia outra seleção com as pendências atuais.

A leitura mostra apenas os títulos dos cards, sem cabeçalho do carrossel, avatar,
objetivo, escopo ou coluna lateral de orientação. Os metadados permanecem no editor
e na organização dos temas; as setas e o progresso continuam disponíveis.

## Aparência dos carrosséis

O editor oferece dez templates: **Aurora** (lilás e gradiente), **Oceano** (azul e
faixas), **Botânica** (verde e formas orgânicas), **Âmbar** (dourado e notas),
**Editorial** (índigo e revista), **Blueprint** (azul e grade), **Grafite** (oliva e
tipografia técnica), **Sakura** (rosa e curvas), **Terracota** (argila e molduras) e
**Prisma** (turquesa e geometria). As paletas acompanham o tema claro/escuro.

Cada template combina seis estilos de card: abertura, leitura, destaque, passos,
laboratório e galeria. O modo automático usa abertura no primeiro card, laboratório
quando há código, galeria quando há imagens, passos quando há listas e alterna
leitura/destaque nos demais. A ordem dos blocos permanece a ordem do autor. Cada
card também permite escolher um estilo manualmente e voltar ao automático.

Carrosséis sem `template` recebem uma escolha estável a partir do ID; cards sem
`style` usam composição automática. Não há migração nem alteração do progresso ao
abrir conteúdo antigo. Os campos opcionais são validados e preservados na
publicação, nos rascunhos e nos backups. A prévia usa o mesmo componente do Feed,
e todas as composições permitem altura livre e rolagem para código longo.

## Template e editor

O botão **Novo carrossel** abre um template com três cards: **O problema**,
**Como funciona** e **Na prática**. Os títulos e a estrutura são editáveis.

Campos do carrossel: título, escopo, objetivo de aprendizado, tags e intervalo de
reapresentação. O escopo delimita o assunto; o objetivo descreve o que a pessoa
conseguirá explicar ou aplicar ao terminar.

Cada card aceita blocos ordenados de parágrafo, lista, código e imagem. É possível
adicionar, remover, reordenar e duplicar cards; os blocos também são reordenáveis.
Listas usam um item por linha. Texto é renderizado como texto, sem executar HTML.
Imagens aceitam PNG, JPEG e WebP, inclusive múltiplas seleções; o navegador limita
o maior lado a 1.800 pixels e prepara uma cópia local. A descrição acessível é
obrigatória; a legenda é opcional. Imagens podem ser ampliadas pelo link do arquivo.

O editor funciona em desktop e mobile e compartilha a visualização com o Feed.
Rascunhos incompletos são salvos após uma pausa de 600 ms e recuperados ao reabrir
“novo” ou o mesmo carrossel. Fechar preserva o rascunho; “Descartar rascunho” remove
somente essa cópia. Salvar publica o carrossel localmente e limpa o rascunho.
Editar conteúdo publicado aumenta sua revisão e reinicia o progresso desse tema.

Limites atuais: 500 carrosséis; ao menos um card por carrossel, sem teto de quantidade; 1–40 blocos por card;
até 60 itens por lista e 20 tags. Arquivos de imagem têm até 8 MB antes da redução,
com limite de 50 milhões de pixels e até 4 milhões de caracteres na imagem preparada.
Um carrossel tem até 12 MB na representação JSON; o Feed completo e seus backups,
até 30 MB. Esses limites não reservam espaço: a disponibilidade real depende do
armazenamento do navegador. Falhas de gravação mantêm o estado anterior e exibem erro.

Um [exemplo JSON de template](templates/feed-carousel.json) pode ser adaptado e
importado. O editor visual é o fluxo principal; não exige escrever JSON.

Blocos de código usam linguagem selecionada e texto literal, sem execução no navegador.
As fontes e os créditos das imagens podem acompanhar o conteúdo. A paginação mostra
uma janela de indicadores para evitar que carrosséis longos ocupem o rodapé inteiro.

## Persistência e backup

`src/features/feed/model.ts` contém contratos, validação, agendamento e composição
da fila. `repository.ts` encapsula IndexedDB; `components/` contém leitura e edição.
O banco `folha-feed`, versão 1, é independente do banco dos flashcards. O estado
publicado ocupa `state/current`; rascunhos usam `state/draft:<id>` ou `state/draft:new`.
As imagens enviadas estão incorporadas no conteúdo, sem uploads nem URLs remotas.

Gravações leem e modificam o estado numa transação readwrite. Leituras de cards
concorrentes se combinam sem sobrescrever progresso de outra aba. Edição e exclusão
verificam a revisão esperada, rejeitando alterações obsoletas. O progresso está
ligado à revisão do conteúdo; callbacks atrasados de uma versão antiga são ignorados.

O backup usa `format: "folha-feed"`, `version: 1`, `carousels` e `progress`. Exportar
inclui conteúdo, imagens e progresso; rascunhos ficam fora. Importar valida antes de
substituir e pede confirmação apenas para o Feed. Backups de flashcards permanecem
independentes. Links de imagem executáveis ou remotos não são aceitos.

Dois carrosséis originais de exemplo são gravados somente na primeira inicialização.
O catálogo de Design Patterns acrescenta 22 carrosséis com 362 cards, também para feeds
existentes, numa instalação única que preserva edições e exclusões. Veja
[conteúdo e fontes](design-patterns/feed.md).
Depois de excluí-los, eles não reaparecem. A PWA inclui o módulo do Feed e a imagem
local de exemplo no cache; após carregar a aplicação completamente, a leitura e a
criação funcionam offline. Conteúdo e progresso ficam neste navegador/aparelho.

## Melhoria futura: sincronização na nuvem

A integração com DynamoDB está planejada em [roadmap.md](roadmap.md), sem implementação
ou mudança de Terraform nesta entrega. O Feed não participa de `Library`, `/sync`,
pendências ou chamadas de escrita dos flashcards. Nenhum recurso AWS foi criado.
