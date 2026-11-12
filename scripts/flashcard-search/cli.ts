import { mkdirSync, readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { CACHE, DATABASE, EMBEDDING_VERSION } from './config';
import { embeddingTexts, loadCorpus, parseCandidates } from './corpus';
import { createEmbedder, type Embed } from './embeddings';
import { SearchIndex } from './index';
import { batchNeighbors, search } from './search';

async function main() {
  const { positionals, values } = parseArgs({
    args: Bun.argv.slice(2),
    allowPositionals: true,
    options: {
      query: { type: 'string' },
      file: { type: 'string' },
      limit: { type: 'string', default: '5' },
    },
  });
  const command = positionals[0];
  if (
    !['setup', 'index', 'status', 'search', 'compare'].includes(command) ||
    positionals.length !== 1
  )
    throw new Error(
      'Uso: bun scripts/flashcard-search/cli.ts setup|index|status|search --query "texto"|compare --file lote.json [--limit 5]',
    );
  const limit = Number(values.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 50)
    throw new Error('--limit deve estar entre 1 e 50.');
  if (command === 'search' && !values.query?.trim())
    throw new Error('Informe --query com o conteúdo a procurar.');
  if (command === 'compare' && !values.file)
    throw new Error('Informe --file com o caminho do lote JSON.');
  const candidates =
    command === 'compare'
      ? parseCandidates(JSON.parse(readFileSync(values.file ?? '', 'utf8')))
      : [];
  mkdirSync(CACHE, { recursive: true });
  if (command === 'setup') {
    console.error(
      'Baixando apenas arquivos públicos do modelo fixado; inferência na CPU local.',
    );
    const embed = await createEmbedder(true);
    await embed(['Preparação do modelo local.']);
    console.log(
      JSON.stringify(
        { ready: true, embeddingVersion: EMBEDDING_VERSION, cache: CACHE },
        null,
        2,
      ),
    );
    return;
  }
  const { documents, excluded } = loadCorpus();
  const index = new SearchIndex(DATABASE);
  let local: Embed | undefined;
  const embed: Embed = async (texts) => {
    try {
      local ??= await createEmbedder();
    } catch (error) {
      throw new Error(
        'Modelo local indisponível. Execute bun run flashcards:setup uma vez para baixar os arquivos. ' +
          String(error),
        { cause: error },
      );
    }
    return local(texts);
  };
  try {
    if (command === 'status') {
      console.log(
        JSON.stringify(
          {
            database: DATABASE,
            excludedDecks: excluded,
            ...index.status(documents),
          },
          null,
          2,
        ),
      );
      return;
    }
    const synchronization = await index.synchronize(documents, embed);
    if (command === 'index') {
      console.log(
        JSON.stringify(
          { ...synchronization, excludedDecks: excluded },
          null,
          2,
        ),
      );
      return;
    }
    const notice =
      'Resultados são candidatos para análise. Similaridade não é probabilidade de duplicação; não exclua ou mescle automaticamente.';
    if (command === 'search') {
      const query = values.query!.trim();
      const [vector] = await embed([query]);
      console.log(
        JSON.stringify(
          {
            notice,
            synchronization,
            query,
            matches: search(index, query, vector, limit),
          },
          null,
          2,
        ),
      );
    } else {
      const texts = candidates.map((c) => embeddingTexts(c)[0]);
      const vectors = await embed(texts);
      const neighbors = batchNeighbors(candidates, vectors, limit);
      console.log(
        JSON.stringify(
          {
            notice,
            synchronization,
            candidates: candidates.map((candidate, i) => ({
              id: candidate.id,
              question: candidate.question,
              existing: search(
                index,
                texts[i],
                vectors[i],
                limit,
                candidate.id,
              ),
              inBatch: neighbors[i].matches,
            })),
          },
          null,
          2,
        ),
      );
    }
  } finally {
    index.close();
  }
}

await main().catch((error) => {
  console.error(String(error));
  process.exitCode = 1;
});
