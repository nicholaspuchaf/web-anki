import { expect, test } from 'bun:test';
import { existsSync } from 'node:fs';
import catalog from '../../content/decks/mc714/flashcards';
import courses from '../../content/decks/mc714/carousels';
import manifest from '../../content/decks/mc714/deck.json' with { type: 'json' };
import { withBundledMc714Deck } from './mc714';
import { emptyLibrary } from '../library/model';
import { parseFeed, parseCarousel } from '../feed/model';
import { putCard } from '../library/commands';
import { parseBackup } from '../backup/parse-backup';
import { enforceDeckTags } from '../decks/tag-policy';
import { pendingIds } from '../sync/model';
import { emptySyncState } from '../sync/model';
import { isBundledId } from './ids';

test('MC714 cobre 132 flashcards, sete carrosséis com 66 páginas e diagramas locais válidos', () => {
  const library = withBundledMc714Deck(emptyLibrary);
  const feed = parseFeed(courses);
  expect(library.cards).toHaveLength(132);
  expect(feed.carousels).toHaveLength(7);
  expect(feed.carousels.flatMap((c) => c.slides)).toHaveLength(66);
  expect(new Set(library.cards.map((c) => c.id)).size).toBe(132);
  expect(new Set(library.cards.map((c) => c.front)).size).toBe(132);
  for (const item of [...library.cards, ...feed.carousels]) {
    expect(item.deckId).toBe(manifest.id);
    expect(item.tags).toEqual(
      expect.arrayContaining([
        'sistemas-distribuidos',
        'unicamp',
        'mc714',
        'p2',
      ]),
    );
    expect(item.tags!.filter((t) => ['p1', 'p2', 'p3'].includes(t))).toEqual([
      'p2',
    ]);
  }
  for (const card of library.cards) {
    expect(card.faces).toHaveLength(2);
    expect(card.faces!.every((f) => f.content.trim())).toBe(true);
    expect(isBundledId(card.id)).toBe(true);
  }
  for (const slide of feed.carousels.flatMap((c) => c.slides))
    for (const block of slide.blocks)
      if (block.type === 'image')
        expect(existsSync('public' + block.src)).toBe(true);
  const answers = catalog.cards
    .map((c) => c.answer + ' ' + c.explanation)
    .join('\n');
  for (const target of [
    '500 ms',
    '100 vezes',
    '70 ms',
    '9 GB',
    '16,7 ms',
    'INP',
    'jitter',
    'continuidade',
    'transparência',
  ])
    expect(
      (
        answers +
        ' ' +
        catalog.cards.map((c) => c.question).join('\n')
      ).toLowerCase(),
    ).toContain(target.toLowerCase());
  expect(pendingIds(library, emptySyncState())).toEqual([]);
  expect(library.decks[0].syncEnabled).toBe(false);
});

test('tags obrigatórias normalizam P2, completam ausências e rejeitam avaliações ambíguas', () => {
  expect(enforceDeckTags(manifest.id, ['P2', 'UNICAMP', 'extra'])).toEqual(
    expect.arrayContaining([
      'sistemas-distribuidos',
      'unicamp',
      'mc714',
      'p2',
      'extra',
    ]),
  );
  for (const assessment of ['p1', 'p2', 'p3'])
    expect(
      enforceDeckTags(manifest.id, [assessment]).filter((t) =>
        ['p1', 'p2', 'p3'].includes(t),
      ),
    ).toEqual([assessment]);
  expect(() => enforceDeckTags(manifest.id, ['p1', 'P2'])).toThrow(
    'exatamente uma',
  );
  const feed = parseFeed(courses);
  const source = feed.carousels[0];
  expect(parseCarousel({ ...source, tags: [] }).tags).toEqual([
    'sistemas-distribuidos',
    'unicamp',
    'mc714',
    'p2',
  ]);
  expect(() => parseCarousel({ ...source, tags: ['p1', 'p3'] })).toThrow(
    'exatamente uma',
  );
  let library = withBundledMc714Deck(emptyLibrary);
  const personal = {
    id: 'my-mc714-card',
    deckId: manifest.id,
    front: 'Minha questão',
    back: 'Minha resposta',
    due: 0,
    reviews: 0,
    interval: 0,
  };
  library = putCard(library, personal);
  expect(library.cards.find((c) => c.id === personal.id)?.tags).toContain('p2');
  const restored = parseBackup(
    JSON.stringify({ ...library, cards: [{ ...personal, tags: ['P3'] }] }),
  );
  expect(restored.cards[0].tags).toEqual(
    expect.arrayContaining(['sistemas-distribuidos', 'unicamp', 'mc714', 'p3']),
  );
  expect(() => putCard(library, { ...personal, tags: ['p1', 'p3'] })).toThrow();
});

test('atualizações do catálogo preservam revisões, favoritos e cartões pessoais de P1/P3 no mesmo baralho', () => {
  const library = withBundledMc714Deck(emptyLibrary);
  Object.assign(library.cards[0], {
    reviews: 3,
    interval: 7,
    due: 1000,
    favorite: true,
  });
  const own = putCard(library, {
    id: 'personal-mc714',
    deckId: manifest.id,
    front: 'Pergunta P1',
    back: 'Resposta',
    tags: ['p1'],
    due: 44,
    interval: 2,
    reviews: 1,
  });
  const result = withBundledMc714Deck(own);
  expect(result.cards.find((c) => c.id === library.cards[0].id)).toMatchObject({
    reviews: 3,
    interval: 7,
    due: 1000,
    favorite: true,
  });
  expect(result.cards.find((c) => c.id === 'personal-mc714')).toEqual(
    own.cards.at(-1)!,
  );
  expect(withBundledMc714Deck(result)).toEqual(result);
  expect(pendingIds(result, emptySyncState())).toEqual([]);
});

test('questões 3 e 4 ampliam o catálogo anterior sem perder revisões ou cartões pessoais', () => {
  const complete = withBundledMc714Deck(emptyLibrary);
  const previous = { ...complete, cards: complete.cards.slice(0, 66) };
  Object.assign(previous.cards[0], {
    due: 450,
    interval: 12,
    reviews: 5,
    favorite: true,
  });
  const old = structuredClone(previous.cards);
  const withPersonal = putCard(previous, {
    id: 'mc714-personal-before-q3',
    deckId: manifest.id,
    front: 'Minha anotação anterior',
    back: 'Resposta',
    tags: ['p1'],
    due: 10,
    interval: 3,
    reviews: 2,
  });
  const upgraded = withBundledMc714Deck(withPersonal);
  expect(upgraded.cards).toHaveLength(133);
  for (const card of old)
    expect(upgraded.cards.find((c) => c.id === card.id)).toEqual(card);
  expect(
    upgraded.cards.find((c) => c.id === 'mc714-personal-before-q3'),
  ).toEqual(withPersonal.cards.at(-1)!);
  expect(pendingIds(upgraded, emptySyncState())).toEqual([]);
});
