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
