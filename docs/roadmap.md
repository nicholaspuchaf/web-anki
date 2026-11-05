# Melhorias futuras

## Sincronização do Feed

**Estado: planejado; não implementado.** O usuário pediu manter o Feed local por
enquanto e registrar a sincronização como evolução posterior.

- Definir o escopo de compartilhamento dos carrosséis e do progresso antes de
  ampliar a API pública existente dos flashcards.
- Projetar uma entrada DynamoDB por carrossel, com revisão, data de atualização e
  tombstone para exclusão. O progresso deve ter identidade e contrato próprios,
  separados do conteúdo editorial.
- Armazenar imagens em object storage, com referência no conteúdo. O modelo atual
  usa imagens incorporadas para funcionar offline, mas não deve ser copiado como
  um único item DynamoDB: um carrossel pode superar o limite por item do serviço.
- Implementar sincronização incremental, conflitos, retomada e política de cache
  offline para as imagens, preservando edições e rascunhos locais.
- Manter o agendamento idempotente: reler antes do prazo não deve adiar a próxima
  apresentação, inclusive quando dois aparelhos enviam leitura simultaneamente.
- Definir migração e compatibilidade do backup `folha-feed` antes de publicar API
  e infraestrutura. A persistência do Feed tem um repositório próprio para receber
  esse adaptador sem misturar a biblioteca de flashcards.
