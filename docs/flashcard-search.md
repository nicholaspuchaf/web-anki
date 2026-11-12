# Busca local de candidatos a flashcards semelhantes

A ferramenta auxilia a análise pedagógica antes de criar cartões. Semelhança significa **candidato para análise**, nunca uma decisão de duplicação. Perguntas sobre definição, finalidade e aplicação podem coexistir legitimamente. Nenhum comando altera cartões, progresso ou baralhos.

## Preparação e comandos

Com as dependências de desenvolvimento instaladas por `bun install`, execute uma vez:

```sh
bun run flashcards:setup
```

Esse é o único comando da ferramenta que permite downloads. Ele baixa aproximadamente 130 MB de arquivos públicos do modelo para `.cache/flashcard-search/models`. Não usa serviço de inferência nem envia conteúdo do acervo. O modelo é multilíngue, fixado por revisão e executado na CPU. Os arquivos precisam estar preparados em cada máquina; um cache de desenvolvimento não acompanha o clone do Git.

```sh
bun run flashcards:index
bun run flashcards:status
bun run flashcards:search --query "transferir uma conexão já estabelecida para outro servidor" --limit 5
bun run flashcards:compare --file /tmp/novos-cartoes.json --limit 5
```

Indexação, consultas e comparação funcionam offline e não baixam arquivos automaticamente. Se faltar modelo, o comando falha com orientação para executar a preparação. `status` não precisa do modelo e informa mudanças pendentes, contagens e exclusões. `search` e `compare` atualizam incrementalmente o índice antes de consultar, para evitar decisões sobre um cache desatualizado. A saída é JSON; mensagens de preparação e erros vão para stderr.

O lote de comparação aceita um array ou `{ "cards": [...] }` com perguntas e respostas:

```json
{
  "cards": [
    {
      "id": "minha-pergunta",
      "question": "O que precisa ser preservado num TCP handoff?",
      "answer": "O estado necessário para continuar a conexão estabelecida.",
      "explanation": "Identificação, progresso do fluxo e controle do protocolo precisam permanecer coerentes.",
      "tags": ["sistemas-distribuidos", "tcp"]
    }
  ]
}
```

Também aceita `front`, `back` e `faces` para cartões do aplicativo. Não é um importador de backups ou um validador de todos os templates. Um ID omitido recebe identificação temporária por posição. IDs repetidos no lote são erro; conteúdo parecido não é rejeitado. Se o ID já existir no índice, ele próprio não aparece como seu vizinho. Cada candidato recebe resultados do acervo e dos demais candidatos do lote, com pergunta e pontuação, para análise pelo agente.

## Acervo e exclusões

A origem são apenas os flashcards incluídos no repositório, usando os adaptadores e manifestos reais do aplicativo. O índice contém pergunta, resposta, explicações, tags, ID, nome/ID do baralho e arquivo de origem. Não lê localStorage, IndexedDB do navegador, PDFs, carrosséis ou DynamoDB. O conteúdo dos carrosséis já convertido em flashcards participa por esses cartões.

**Baralhos antigos ficam fora do banco**, inclusive textos e vetores. O MC714 `builtin-mc714` está excluído explicitamente em `scripts/flashcard-search/config.ts`; nomes com o marcador `(antigo)`, sem distinção de caixa, também são excluídos. O novo `builtin-sd-mc714` participa. Desabilitar um baralho nas preferências do navegador não o torna antigo: essa preferência é local ao aparelho e não é consultada pela ferramenta editorial.

O acervo inicial contém 966 cartões elegíveis: AWS, Design Patterns, AUVP e o novo MC714. A inclusão de futuros baralhos depende de registrá-los nos adaptadores do site e manter seus arquivos identificáveis pelos manifestos. Um formato desconhecido ou uma origem ambígua interrompe a atualização, sem substituir o índice anterior.

## Atualização e pesquisa

O banco `.cache/flashcard-search/index.sqlite` usa SQLite do Bun e FTS5. Conteúdo e pesos ficam ignorados pelo Git e não entram no frontend, Lambda ou deploy. É seguro reconstruir esse cache: os arquivos do repositório continuam sendo a fonte original.

- O hash do texto determina quais cartões precisam de novos embeddings. Renomear arquivo ou baralho atualiza metadados sem nova inferência.
- Cartões removidos ou excluídos da seleção são eliminados do banco, do FTS e dos vetores na próxima atualização bem-sucedida.
- Alterações no modelo, revisão, normalização ou segmentação exigem uma nova versão do embedding e recalculam o índice. A versão inclui o limite de tokens.
- A atualização prepara os vetores antes de uma transação atômica. Uma falha preserva o índice anterior. Escritores concorrentes são detectados para evitar sobrescrever silenciosamente outra atualização.
- Resposta principal e explicações são representadas separadamente, com janelas sobrepostas para textos longos. Cada trecho passa pelo limite de 256 tokens do tokenizador; a busca é aproximada, não uma prova de equivalência conceitual ou de ausência de duplicação.
- A consulta combina ranking textual BM25 e ranking por similaridade de vetores, usando Reciprocal Rank Fusion. Os vetores são comparados diretamente na CPU; o acervo atual não exige extensão vetorial ou serviço separado.

Os resultados incluem conteúdo, arquivo de origem, similaridade semântica, posição lexical e pontuação de fusão. As pontuações **não são probabilidades**, nem têm um limiar universal de duplicação. Mesmo resultados pouco próximos podem ser retornados quando se pedem vários candidatos. Leia a fonte antes de manter, reformular, dividir ou mesclar qualquer conteúdo.

## Referências da implementação

- [SQLite FTS5](https://www.sqlite.org/fts5.html).
- [SQLite no Bun](https://bun.sh/docs/runtime/sqlite).
- [Transformers.js — carregamento local](https://huggingface.co/docs/transformers.js/v3.0.0/en/custom_usage).
- [Modelo ONNX multilíngue](https://huggingface.co/Xenova/paraphrase-multilingual-MiniLM-L12-v2), revisão `2c4055b12046f11709e9df2c122e59ffbdc2f900`.
