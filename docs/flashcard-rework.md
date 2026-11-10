# Cartões para refazer

O botão **Refazer**, ao lado de **Consultar fonte** (ou **Abrir problema**, no LeetCode), registra um pedido para melhorar o conteúdo. Também está disponível em cartões sem fonte. Não agenda uma revisão, altera o progresso ou exclui o cartão. Rascunhos na pré-visualização do editor não enviam marcações.

A confirmação aparece somente após sucesso na API. Sem rede ou sem API configurada, o botão fica indisponível. Em caso de erro, é possível tentar novamente. Reabrir o cartão permite reenviar a marcação com segurança: a idempotência é garantida no backend, independentemente do estado do botão.

## Persistência e idempotência

Usa a mesma tabela DynamoDB e o índice `library-updated-at`, sem novos recursos ou permissões IAM:

- Chave do item: `pk = REWORK#<flashcard_id>`.
- Partição do índice: `library_id = REWORK` (a sincronização usa `PUBLIC`).
- Ordenação do índice: `last_updated_at = requested_at`, com data do servidor.
- Campos públicos: `flashcard_id`, `deck_id`, `question`, `source_url` opcional, `requested_at` e `status = pending`.

A escrita usa `PutItem` com `attribute_not_exists(pk)`. O primeiro pedido cria o item; pedidos concorrentes ou retries recebem sucesso indicando que já estava marcado, sem duplicar nem sobrescrever os dados ou a data original. Outros erros do DynamoDB continuam sendo erros. Veja [escritas condicionais na documentação AWS](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.ConditionExpressions.html).

Cartões incluídos no repositório continuam fora da sincronização. A exceção é esse pequeno registro de feedback: apenas ID, baralho, pergunta (até 2000 caracteres) e fonte são enviados. Respostas, versos, imagens e progresso não são enviados. O corpo do pedido de marcação tem limite de 16 KB. O snapshot da pergunta vem do cliente; não é uma cópia canônica de todo o cartão.

## API

- `PUT /flashcards/:id/rework`: corpo JSON `{ "deck_id": "builtin-mc714", "question": "O que é TCP handoff?" }`, com `source_url` HTTPS opcional. Retorna `201` para a primeira marcação e `200` para repetição, com `{ "flashcard_id": "...", "status": "pending", "already_marked": false }` (ou `true` na repetição). Não usa `If-Match`, pois não altera o cartão sincronizado.
- `GET /rework-requests?limit=50`: retorna `{ "requests": [...], "next_cursor": "..." }`. Envie o cursor na próxima página até receber `null`. `limit` aceita 1 a 50. Cursores são validados para a partição de marcações.

A lista usa Query, sem Scan, e a consistência eventual do índice: uma marcação recém-gravada pode demorar a aparecer. A paginação não é um snapshot transacional; o script deduplica IDs entre páginas. As rotas seguem a biblioteca pública do projeto e sua validação de origem, sem login.

## Script local

Com Bun instalado, execute na raiz do repositório:

```sh
bun scripts/list-rework.ts 'https://SUA-API.lambda-url.REGIAO.on.aws' > /tmp/flashcards-refazer.json
```

Ou use a variável `API_URL` (também aceita `VITE_API_URL`):

```sh
API_URL='https://SUA-API.lambda-url.REGIAO.on.aws' bun scripts/list-rework.ts
```

A saída é JSON com `exported_at`, `count` e `requests`. O script percorre todas as páginas; não remove cartões, não limpa marcações e não altera o DynamoDB. Em falhas HTTP, resposta inválida ou cursor repetido, termina com código 1 e escreve o erro em stderr, sem imprimir um resultado parcial como se fosse completo. Não requer SDK AWS, credenciais AWS ou dependências novas.

## Publicação

O frontend utiliza o `VITE_API_URL` existente. Para disponibilizar as rotas na AWS, gere o novo pacote da Lambda e aplique o Terraform normalmente:

```sh
bun run build:backend
terraform -chdir=infra/terraform plan
terraform -chdir=infra/terraform apply
```

Publique o frontend atualizado pela integração do GitHub com a Cloudflare. O esquema da tabela, o índice e as permissões existentes já suportam essas operações; esta mudança não precisa de migração de dados nem cria outro índice ou tabela.
