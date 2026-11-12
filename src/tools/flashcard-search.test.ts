import { expect, test } from 'bun:test';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { isExcludedDeck, ROOT } from '../../scripts/flashcard-search/config';
import {
  embeddingTexts,
  loadCorpus,
  parseCandidates,
  type Document,
} from '../../scripts/flashcard-search/corpus';
import { cosine, type Embed } from '../../scripts/flashcard-search/embeddings';
import { SearchIndex } from '../../scripts/flashcard-search/index';
import { batchNeighbors, search } from '../../scripts/flashcard-search/search';
import { AUVP_CARD_COUNT } from '../features/bundled-decks/auvp';
import { PATTERNS_CARD_COUNT } from '../features/bundled-decks/patterns';

const card = (id: string, question = id): Document => ({
  id,
  question,
  deckId: 'd',
  deckName: 'Atual',
  sourceFile: 'file.json',
  answer: 'Resposta curta',
  details: 'Explicação',
  tags: ['estudo'],
});
const embed: Embed = async (texts) => texts.map(() => [1, 0, 0]);

test('acervo usa os adaptadores reais e não inclui nenhum cartão de baralho antigo', () => {
  const corpus = loadCorpus();
  const expected = 326 + PATTERNS_CARD_COUNT + 218 + AUVP_CARD_COUNT;
  expect(corpus.documents).toHaveLength(expected);
  expect(corpus.excluded).toContain('builtin-mc714');
  expect(new Set(corpus.documents.map((d) => d.id)).size).toBe(expected);
  expect(corpus.documents.some((d) => d.deckId === 'builtin-mc714')).toBe(
    false,
  );
  expect(corpus.documents.some((d) => d.deckId === 'builtin-sd-mc714')).toBe(
    true,
  );
  for (const document of corpus.documents) {
    expect(existsSync(join(ROOT, document.sourceFile))).toBe(true);
    expect(document.question.trim()).toBeTruthy();
    expect(document.answer.trim()).toBeTruthy();
  }
  expect(isExcludedDeck('futuro', 'MC714 (ANTIGO)')).toBe(true);
  expect(isExcludedDeck('novo', 'MC714')).toBe(false);
  const aws = corpus.documents.find((d) => d.id === 'builtin-aws-amazon-ec2')!;
  expect(aws.details).toContain('capacidade');
  const chunks = embeddingTexts({
    ...aws,
    details: 'a'.repeat(4000) + ' SENTINELA_FIM',
  });
  expect(chunks.length).toBeGreaterThan(2);
  expect(chunks.some((text) => text.includes('SENTINELA_FIM'))).toBe(true);
  expect(chunks.every((text) => text.includes(aws.question))).toBe(true);
});

test('índice incremental reusa embeddings, atualiza metadados sem inferência, elimina removidos e invalida modelo antigo', async () => {
  const index = new SearchIndex(':memory:');
  let calls = 0;
  const counting: Embed = async (texts) => {
    calls++;
    return embed(texts);
  };
  try {
    const docs = [card('a', 'TCP handoff'), card('b', 'Redis sessão')];
    expect(await index.synchronize(docs, counting)).toMatchObject({
      updated: 2,
      removed: 0,
    });
    expect(calls).toBe(2);
    expect(await index.synchronize(docs, counting)).toMatchObject({
      updated: 0,
    });
    expect(calls).toBe(2);
    docs[0].sourceFile = 'renamed.json';
    expect(await index.synchronize(docs, counting)).toMatchObject({
      updated: 0,
      metadataUpdated: 1,
    });
    expect(calls).toBe(2);
    docs[1].answer = 'Resposta alterada';
    expect(await index.synchronize(docs, counting)).toMatchObject({
      updated: 1,
    });
    expect(calls).toBe(3);
    expect(await index.synchronize([docs[0]], counting)).toMatchObject({
      updated: 0,
      removed: 1,
    });
    expect(index.lexical('Redis')).toEqual([]);
    expect(index.vectors().every((v) => v.id === 'a')).toBe(true);
    index.db
      .query(
        "UPDATE metadata SET value='modelo-antigo' WHERE key='embedding_version'",
      )
      .run();
    expect(await index.synchronize([docs[0]], counting)).toMatchObject({
      updated: 1,
    });
    expect(calls).toBe(4);
  } finally {
    index.close();
  }
});

test('falhas de inferência e concorrência não gravam um índice parcial', async () => {
  const index = new SearchIndex(':memory:');
  try {
    await index.synchronize([card('a')], embed);
    const before = index.documents();
    await expect(
      index.synchronize([card('b')], async () => {
        throw new Error('CPU failure');
      }),
    ).rejects.toThrow('CPU failure');
    expect(index.documents()).toEqual(before);
    await expect(
      index.synchronize([card('b')], async (texts) =>
        texts.map(() => [Number.NaN]),
      ),
    ).rejects.toThrow('inválido');
    expect(index.documents()).toEqual(before);
    await expect(
      index.synchronize([card('b')], async (texts) => {
        index.db
          .query(
            "UPDATE metadata SET value='other-writer' WHERE key='generation'",
          )
          .run();
        return embed(texts);
      }),
    ).rejects.toThrow('outro processo');
    expect(index.documents()).toEqual(before);
  } finally {
    index.close();
  }
});

test('busca combina palavra-chave e vetores, retorna proveniência e exclui o próprio cartão', async () => {
  const index = new SearchIndex(':memory:');
  try {
    const docs = [
      card('a', 'TCP handoff transfere conexão'),
      card('b', 'Sessão no Redis'),
      card('c', 'Cálculo de energia'),
    ];
    await index.synchronize(docs, async (texts) =>
      texts.map((text) =>
        text.includes('TCP')
          ? [1, 0, 0]
          : text.includes('Redis')
            ? [0, 1, 0]
            : [0, 0, 1],
      ),
    );
    const result = search(index, 'Transferir conexão TCP', [1, 0, 0], 2);
    expect(result[0].id).toBe('a');
    expect(result[0].sourceFile).toBe('file.json');
    expect(result[0].semanticSimilarity).toBeGreaterThan(0.99);
    expect(result[0].lexicalRank).toBe(1);
    expect(
      search(index, 'TCP', [1, 0, 0], 5, 'a').some((r) => r.id === 'a'),
    ).toBe(false);
    expect(() => index.lexical('" OR * : - ( TCP )')).not.toThrow();
    expect(result.every((r) => !('duplicate' in r))).toBe(true);
  } finally {
    index.close();
  }
});

test('lotes com versos são normalizados, validados e comparados entre si sem decisões automáticas', () => {
  const docs = parseCandidates({
    cards: [
      {
        id: 'a',
        front: 'Pergunta A',
        faces: [{ content: 'Resposta A' }, { content: 'Explicação A' }],
      },
      { id: 'b', question: 'Pergunta B', answer: 'Resposta B' },
      { id: 'c', question: 'Pergunta C', answer: 'Resposta C' },
    ],
  });
  expect(docs[0].answer).toBe('Resposta A');
  expect(
    parseCandidates([
      {
        front: 'P',
        back: '',
        faces: [{ content: '' }, { content: 'Resposta' }],
      },
    ])[0].answer,
  ).toBe('Resposta');
  expect(docs[0].details).toBe('Explicação A');
  const neighbors = batchNeighbors(
    docs,
    [
      [1, 0],
      [1, 0.1],
      [0, 1],
    ],
    1,
  );
  expect(neighbors[0].matches[0].id).toBe('b');
  expect(neighbors[0].matches.some((m) => m.id === 'a')).toBe(false);
  expect(() => parseCandidates([{ question: '' }])).toThrow('Pergunta');
  expect(() => parseCandidates([{ question: 'Q', tags: [42] }])).toThrow(
    'Tags',
  );
  expect(() =>
    parseCandidates([
      { question: 'Q', id: 'a' },
      { question: 'Q2', id: 'a' },
    ]),
  ).toThrow('ID repetido');
  expect(() => cosine([0, 0], [1, 0])).toThrow('nulo');
  expect(() => cosine([1], [1, 0])).toThrow('Dimensões');
});
