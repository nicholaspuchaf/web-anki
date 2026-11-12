import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import original from '../../content/decks/mc714/flashcards';
import carousels from '../../content/decks/mc714/carousels';
import catalog from '../../content/decks/mc714-revisao/flashcards';
import coverage from '../../content/decks/mc714-revisao/coverage.json' with { type: 'json' };
import manifest from '../../content/decks/mc714-revisao/deck.json' with { type: 'json' };
import { withBundledDecks } from './catalog';
import { withBundledMc714Deck } from './mc714';
import { withBundledMc714RevisaoDeck } from './mc714-revisao';
import { ownsBundledId } from './ids';
import { emptyLibrary } from '../library/model';
import { putCard } from '../library/commands';
import { parseBackup } from '../backup/parse-backup';
import { pendingIds, emptySyncState } from '../sync/model';
import { enforceDeckTags } from '../decks/tag-policy';

test('novo MC714 cobre todos os cartões e páginas antigos com IDs novos, conteúdo válido e tags obrigatórias', () => {
  const library = withBundledMc714RevisaoDeck(emptyLibrary);
  const ids = new Set(catalog.cards.map((c) => c.id));
  expect(ids.size).toBe(218);
  expect(new Set(catalog.cards.map((c) => c.question)).size).toBe(ids.size);
  expect(coverage.sourceCardCount).toBe(original.cards.length);
  expect(coverage.targetCardCount).toBe(ids.size);
  expect(coverage.cards.map((row) => row.sourceCardId).sort()).toEqual(
    original.cards.map((c) => c.id).sort(),
  );
  const represented = new Set<string>();
  for (const row of coverage.cards) {
    expect(row.targetCardIds.length).toBeGreaterThan(0);
    for (const id of row.targetCardIds) {
      expect(ids.has(id)).toBe(true);
      expect(catalog.cards.find((c) => c.id === id)?.sourceCardIds).toContain(
        row.sourceCardId,
      );
      represented.add(id);
    }
  }
  expect(
    coverage.carouselSlides
      .map((s) => `${s.sourceCarouselId}:${s.sourceSlideId}`)
      .sort(),
  ).toEqual(
    carousels.carousels
      .flatMap((c) => c.slides.map((s) => `${c.id}:${s.id}`))
      .sort(),
  );
  for (const slide of coverage.carouselSlides) {
    expect(slide.targetCardIds.length).toBeGreaterThan(0);
    for (const id of slide.targetCardIds) {
      expect(ids.has(id)).toBe(true);
      represented.add(id);
    }
  }
  expect(represented.size).toBe(ids.size);
  for (const path of manifest.content.flashcards) {
    const file = JSON.parse(
      readFileSync(`src/content/decks/mc714-revisao/${path}`, 'utf8'),
    );
    expect(file.cards.length).toBeGreaterThan(0);
  }
  for (const card of library.cards) {
    expect(card.deckId).toBe(manifest.id);
    expect(ownsBundledId(manifest.id, card.id)).toBe(true);
    expect(ownsBundledId('builtin-mc714', card.id)).toBe(false);
    expect(card.faces?.map((f) => f.content.trim()).every(Boolean)).toBe(true);
    expect(card.faces).toHaveLength(2);
    expect(card.tags).toEqual(
      expect.arrayContaining([
        'sistemas-distribuidos',
        'unicamp',
        'mc714',
        'p2',
      ]),
    );
  }
  expect(enforceDeckTags(manifest.id, ['P3'])).toEqual([
    'sistemas-distribuidos',
    'unicamp',
    'mc714',
    'p3',
  ]);
  expect(() => enforceDeckTags(manifest.id, ['P1', 'P2'])).toThrow(
    'exatamente uma',
  );
  expect(parseBackup(JSON.stringify(library))).toEqual(library);
  expect(pendingIds(library, emptySyncState())).toEqual([]);
});

test('atualização renomeia só o baralho antigo, preserva progresso e mantém ambos independentes em sucessivos bootstraps', () => {
  let previous = withBundledMc714Deck(emptyLibrary);
  previous.decks[0].name = 'Sistemas Distribuidos - MC714';
  Object.assign(previous.cards[0], {
    reviews: 7,
    interval: 14,
    due: 987654,
    favorite: true,
  });
  previous = putCard(previous, {
    id: 'minha-questao-mc714',
    deckId: 'builtin-mc714',
    front: 'Minha revisão',
    back: 'Resposta',
    tags: ['p1'],
    due: 123,
    reviews: 2,
    interval: 3,
  });
  const saved = structuredClone(previous.cards);
  const upgraded = withBundledDecks(previous);
  expect(upgraded.decks.find((d) => d.id === 'builtin-mc714')?.name).toBe(
    'Sistemas Distribuidos - MC714 (antigo)',
  );
  expect(upgraded.decks.find((d) => d.id === manifest.id)?.name).toBe(
    'Sistemas Distribuidos - MC714',
  );
  for (const card of saved)
    expect(upgraded.cards.find((c) => c.id === card.id)).toEqual(card);
  const fresh = upgraded.cards.filter((c) => c.deckId === manifest.id);
  expect(fresh).toHaveLength(218);
  expect(
    fresh.every((c) => c.reviews === 0 && c.interval === 0 && !c.favorite),
  ).toBe(true);
  Object.assign(fresh[0], {
    reviews: 1,
    interval: 4,
    due: 11111,
    favorite: true,
  });
  const withPersonal = putCard(upgraded, {
    id: 'minha-questao-nova',
    deckId: manifest.id,
    front: 'Minha questão nova',
    back: 'Resposta nova',
    tags: ['p3'],
    due: 222,
    reviews: 3,
    interval: 7,
  });
  const refreshed = withBundledDecks(withPersonal);
  expect(refreshed.decks).toEqual(withPersonal.decks);
  expect([...refreshed.cards].sort((a, b) => a.id.localeCompare(b.id))).toEqual(
    [...withPersonal.cards].sort((a, b) => a.id.localeCompare(b.id)),
  );
  expect(withBundledDecks(refreshed)).toEqual(refreshed);
  expect(pendingIds(withPersonal, emptySyncState())).toEqual([]);
});
