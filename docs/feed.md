# Feed de aprendizado

O Feed é uma página separada em `/#/feed`, dedicada a aprender conceitos. Flashcards
continuam na seção de revisão. A navegação entre seções usa o hash da URL, incluindo
acesso direto e botões de voltar/avançar do navegador.

## Leitura

- O feed rola verticalmente. Deslizar para cima ou voltar a rolagem preserva os
  carrosséis anteriores da sessão e o card horizontal selecionado em cada um.
- Cada carrossel possui cards horizontais, com swipe, setas, indicadores e
  navegação por teclado. O conteúdo pode ser longo; a rolagem vertical alcança
  o fim do card antes de passar ao próximo tema.
- No computador, setas laterais para cima e para baixo levam ao carrossel anterior
  ou seguinte. A seta para baixo também carrega outro carrossel quando necessário.
- O cabeçalho compacto mantém título, modos, contagem do dia e criação sem tomar
  a área principal de leitura.
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
- “Atualizar fila”, na orientação lateral do desktop, ou reabrir a página inicia
  outra seleção com as pendências atuais.

## Template e editor

O botão **Novo carrossel** abre um template com três cards: **O problema**,
**Como funciona** e **Na prática**. Os títulos e a estrutura são editáveis.

Campos do carrossel: título, escopo, objetivo de aprendizado, tags e intervalo de
reapresentação. O escopo delimita o assunto; o objetivo descreve o que a pessoa
conseguirá explicar ou aplicar ao terminar.

Cada card aceita blocos ordenados de parágrafo, lista e imagem. É possível
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

Limites atuais: 500 carrosséis; 1–30 cards por carrossel; 1–40 blocos por card;
até 60 itens por lista e 20 tags. Arquivos de imagem têm até 8 MB antes da redução,
com limite de 50 milhões de pixels e até 4 milhões de caracteres na imagem preparada.
Um carrossel tem até 12 MB na representação JSON; o Feed completo e seus backups,
até 30 MB. Esses limites não reservam espaço: a disponibilidade real depende do
armazenamento do navegador. Falhas de gravação mantêm o estado anterior e exibem erro.

Um [exemplo JSON de template](templates/feed-carousel.json) pode ser adaptado e
importado. O editor visual é o fluxo principal; não exige escrever JSON.

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
Depois de excluí-los, eles não reaparecem. A PWA inclui o módulo do Feed e a imagem
local de exemplo no cache; após carregar a aplicação completamente, a leitura e a
criação funcionam offline. Conteúdo e progresso ficam neste navegador/aparelho.

## Melhoria futura: sincronização na nuvem

A integração com DynamoDB está planejada em [roadmap.md](roadmap.md), sem implementação
ou mudança de Terraform nesta entrega. O Feed não participa de `Library`, `/sync`,
pendências ou chamadas de escrita dos flashcards. Nenhum recurso AWS foi criado.
