# Contrato do backend de flashcards

Biblioteca pública única, sem login. O backend não aceita mais snapshots; `/library`
retorna **410** para impedir que clientes antigos substituam uma biblioteca inteira.
A interface React usa este contrato para sincronização manual nos dois sentidos.

## Um item por cartão

```json
{
  "pk": "FLASHCARD#c",
  "library_id": "PUBLIC",
  "flashcard_id": "c",
  "last_updated_at": "2026-11-01T10:00:00.000Z",
  "version": 1,
  "deleted_at": null,
  "card": {
    "id": "c",
    "deckId": "d",
    "front": "Two Sum: enunciado completo",
    "back": "",
    "due": 0,
    "interval": 0,
    "reviews": 0
  },
  "deck": { "id": "d", "name": "LeetCode" }
}
```

A API omite `pk` e `library_id`. `card` é o formato atual do aplicativo, incluindo
LeetCode, versos opcionais e favoritos. O parser compartilhado normaliza os dados.
IDs de cartão e baralho aceitam de 1 a 128 letras ASCII, números, `_` e `-`.
O limite é 250.000 bytes de JSON UTF-8 por cartão, antes de gravar. Datas são UTC
canônicas com milissegundos, como no exemplo. O backend ignora versões e datas
informadas no corpo: usa o relógio do servidor, com crescimento por cartão mesmo
quando duas alterações ocorrem no mesmo milissegundo.

O baralho acompanha o cartão. Não existe entidade remota independente de baralho:
baralhos vazios ficam locais; renomear um baralho exige atualizar os seus cartões.
Se nomes divergirem, o cliente precisa resolver essa diferença. O agendamento e os
favoritos também são compartilhados neste contrato, como na biblioteca pública anterior.

## Criar, consultar, alterar e excluir

`PUT /flashcards/c`, com `Content-Type: application/json` e `If-Match: 0`:

```json
{
  "card": {
    "id": "c",
    "deckId": "d",
    "front": "Two Sum: enunciado completo",
    "back": "",
    "due": 0,
    "interval": 0,
    "reviews": 0
  },
  "deck": { "id": "d", "name": "LeetCode" }
}
```

Retorna 201 e o registro aceito, com `version: 1`. Para editar, envie o mesmo
formato com `If-Match: 1`; a resposta 200 terá versão 2. `GET /flashcards/c` usa
leitura fortemente consistente e retorna o registro atual ou 404 se nunca existiu.

`DELETE /flashcards/c` com a versão atual em `If-Match` substitui o conteúdo por:

```json
{
  "flashcard_id": "c",
  "last_updated_at": "2026-11-01T10:01:00.000Z",
  "version": 2,
  "deleted_at": "2026-11-01T10:01:00.000Z"
}
```

O tombstone permanece sem TTL para que aparelhos offline recebam exclusões.
DELETE repetido com a versão atual retorna o mesmo registro. Repetir com versão
antiga retorna 409. Restaurar exige PUT com a versão atual do tombstone; versão zero
não recria um ID excluído. A condição atômica do DynamoDB protege contra duas
escritas que passaram simultaneamente pela leitura de versão.

Erros: 400 dados/parâmetros inválidos; 403 origem recusada; 404 inexistente;
405 método inválido; 409 conflito; 410 protocolo antigo; 413 tamanho; 415 tipo de
conteúdo; 428 If-Match ausente/inválido; 429 capacidade; 500 falha inesperada.
Um PUT é uma substituição completa do cartão, não um PATCH. Após timeout de escrita,
consulte o ID para descobrir se a operação foi aceita antes de tentar novamente.

## Buscar alterações

Primeira sincronização: `GET /sync?limit=25`.
Incremental: `GET /sync?since=2026-11-01T10%3A00%3A00.000Z&limit=25`.
Use URLSearchParams para codificar a URL. `limit` é de 1 a 50, padrão 25.

```json
{
  "changes": [],
  "next_cursor": null,
  "last_sync_at": "2026-11-01T10:05:00.000Z",
  "overlap_seconds": 120
}
```

O backend consulta o índice `library-updated-at`, partição `PUBLIC`, entre
`since - 120 segundos` e a data de início da consulta, inclusivamente. Sem `since`,
a leitura começa no epoch e permite recuperar todos os registros, inclusive exclusões.
O DynamoDB também pode limitar a página a 1 MB, independentemente de `limit`.
O conteúdo completo é projetado no índice; não existe Scan nem filtro posterior.

Se houver mais páginas, `last_sync_at` será null e `next_cursor` conterá um token.
Continue com `GET /sync?cursor=<token>` **sem since ou limit**. O cursor carrega o
intervalo inicial, tamanho de página e LastEvaluatedKey, incluindo a chave do cartão
para distinguir registros com timestamps iguais. O cliente deve tratá-lo como opaco.
O intervalo não muda entre páginas, mas isso não constitui um snapshot transacional.

O cursor é codificado, não assinado; não é credencial. O backend valida o formato,
intervalo, tamanho e partição fixa. Os dados são intencionalmente públicos.

## Responsabilidades do cliente

1. Manter um checkpoint `last_sync_at` separado dos cartões. Nem o cartão mais novo
   nem a resposta de um PUT avançam esse checkpoint.
2. Buscar todas as páginas, mesmo quando uma página vier sem alterações.
3. Mesclar pelo `flashcard_id` e `version`: ignorar versões menores/iguais; aplicar
   versões maiores e remover conteúdo de cartões com `deleted_at` preenchido.
4. Persistir dados e checkpoint de forma atômica no IndexedDB ao concluir. Se as
   páginas forem aplicadas gradualmente, manter o checkpoint anterior até o final.
5. Guardar a versão do tombstone localmente para não ressuscitar cartões com uma
   resposta atrasada. Preservar alterações locais pendentes, resolvendo conflitos.
6. Executar reconciliação completa ocasional, por exemplo uma vez por dia de uso,
   chamando `/sync` sem `since` e mesclando todas as páginas por ID/versão. Não remover
   cartões apenas por estarem ausentes dessa leitura eventualmente consistente.

A reconciliação é uma operação disponível na API, não um agendamento no backend.
O frontend implementa estes passos em `features/sync`. A primeira sincronização e a
primeira após 24 horas fazem reconciliação completa. O botão **Reconciliar biblioteca**
também inicia uma leitura completa, seguida do envio das alterações locais.

A sincronização continua manual: salvar, revisar ou excluir altera apenas os dados
locais até clicar em **Sincronizar**. A interface mostra quantos cartões têm
alterações pendentes. Em caso de conflito, mostra as duas versões e oferece manter
a alteração local (pendente de publicação) ou aplicar a versão da nuvem.

Metadados são separados por URL da API. Trocar `VITE_API_URL` inicia um novo vínculo
com a biblioteca local existente; versões de um backend não são reutilizadas em
outro. Não há migração automática do snapshot `PUBLIC_LIBRARY`. Para aproveitá-lo,
exporte usando o aplicativo antigo, importe o JSON no novo e sincronize.

## Limites da estratégia por data

O GSI tem consistência eventual; a janela de dois minutos reduz perdas por atraso,
mas não há limite garantido de propagação. Uma alteração atrasada além da janela
pode exigir a próxima reconciliação. Relógios de instâncias distintas e gravações
em andamento também impedem tratar timestamps como uma sequência global absoluta.
Não há promessa de captura de todas as versões intermediárias: o sistema sincroniza
o estado mais recente de cada cartão, não um histórico de eventos.

A reconciliação repetida permite recuperar divergências quando os dados se
estabilizam; uma única leitura completa não garante uma fotografia consistente
sob alterações concorrentes. Para garantias mais fortes, seria necessário outro
protocolo de ordenação/registro de alterações.

Referências: [índices globais e consistência](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GSI.html)
e [Query, limites e paginação](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Query.html).

## Consultar dados de um problema LeetCode

`GET /leetcode/problems/two-sum` retorna `slug`, `url`, `title`, `number`,
`difficulty`, `tags` e `content_html`. A rota recebe apenas um slug validado, e
consulta um endpoint fixo `https://leetcode.com/graphql/`. Não aceita URL de destino
arbitrária, cookies ou sessão do usuário. Importar não lê ou escreve no DynamoDB.

O backend usa timeout de oito segundos, limita a resposta upstream a 1 MB e mantém
até 100 problemas em cache por seis horas na memória da instância Lambda. O cache
é oportunista: desaparece em cold starts e não é compartilhado entre instâncias.
Não há novo recurso de infraestrutura ou tarefa periódica para a importação.

Erros: 400 slug inválido; 404 problema inexistente; 422 enunciado Premium ou
indisponível; 429 limite do LeetCode; 502 bloqueio/falha/formato inválido; 504 timeout.
O endpoint GraphQL usado pelo próprio site não tem um contrato público estável;
mudanças e bloqueios podem interromper a importação. O preenchimento manual segue
disponível. O comportamento com o IP de saída da AWS deve ser conferido após deploy.

A interface interpreta o HTML em um template inerte e extrai texto, sem inserir o
HTML recebido na página. Exemplos, restrições, código inline e potências são
preservados. Imagens viram indicações para consulta no enunciado original. Antes de
substituir uma pergunta existente, o usuário confirma; versos e tags personalizadas
são preservados. O resultado só é salvo quando o usuário clica em Salvar.

## Cartões de múltipla escolha

O campo opcional `card.multipleChoice` preserva alternativas e resposta correta:

```json
{
  "options": ["Uma fila", "Uma pilha", "Um mapa", "Um conjunto"],
  "correctIndex": 1,
  "explanation": "Uma pilha usa a ordem LIFO."
}
```

São exigidas quatro alternativas não vazias e distintas, um índice inteiro de 0 a
3 e uma explicação string (pode ser vazia). Esse campo não pode coexistir com
`card.leetcode`. A API rejeita dados inválidos com 400 usando o mesmo parser do app.
`deck.defaultTemplate` pode ser `basic`, `leetcode` ou `multiple-choice`; sua ausência
mantém o comportamento dos baralhos existentes. Não há mudança de rotas, esquema
de chaves do DynamoDB ou infraestrutura. O backend precisa ser republicado para
reconhecer e preservar esses campos antes de sincronizar com o frontend novo.

## Conteúdo local e incluído no site

`deck.syncEnabled` e `card.syncEnabled` são booleanos opcionais; `false` exclui o
conteúdo da sincronização. A ausência mantém o comportamento público anterior.
O cliente não gera PUT nem DELETE para esses cartões, e preserva o conteúdo local
quando recebe versões ou exclusões remotas incompatíveis.

O baralho AWS usa a chave local `builtin-aws-services` e cartões `builtin-aws-*`.
Esses IDs são recusados com 403 nas rotas individuais antes de acessar DynamoDB,
inclusive se o corpo tentar declarar `syncEnabled: true`. PUT de qualquer outro
cartão ou baralho marcado com `syncEnabled: false` também retorna 403.
O catálogo é entregue com o frontend e não precisa de uma operação de seed na AWS.

`card.faces` é uma lista opcional de `{ id, title, content }` para o template
`multi-face`; não pode coexistir com `leetcode` ou `multipleChoice`. `card.tags` e
`card.sourceUrl` são opcionais e preservados pelo parser. Cartões de vários versos
criados em baralhos comuns continuam sincronizáveis. Publique o backend atualizado
para que ele reconheça os campos e aplique a proteção adicional; não há novo recurso
Terraform para esse baralho.
