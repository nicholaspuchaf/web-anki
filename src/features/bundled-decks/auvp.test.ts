import { expect, test } from 'bun:test';
import catalog from '../../content/decks/auvp-renda-fixa/flashcards';
import coverage from '../../content/decks/auvp-renda-fixa/coverage.json' with { type: 'json' };
import manifest from '../../content/decks/auvp-renda-fixa/deck.json' with { type: 'json' };
import { withBundledAuvpDeck, AUVP_CARD_COUNT } from './auvp';
import { withBundledDecks } from './catalog';
import { emptyLibrary } from '../library/model';
import { emptySyncState, pendingIds } from '../sync/model';
import { parseBackup } from '../backup/parse-backup';
import { isBundledId } from './ids';
import { createHandler } from '../../../backend/service';

test('AUVP cobre todas as aulas e páginas de estudo com perguntas únicas, tags e origem verificável', () => {
  expect(AUVP_CARD_COUNT).toBe(250);
  expect(catalog.lessons).toHaveLength(19);
  expect(coverage.pdfPages).toBe(41);
  expect(coverage.sha256).toMatch(/^[a-f0-9]{64}$/);
  expect(coverage.editorialPages).toEqual([1, 2, 3, 4, 5]);
  const pages = new Set<number>();
  const questions = new Set<string>();
  const ids = new Set<string>();
  for (const lesson of catalog.lessons) {
    const expected = coverage.lessons.find((item) => item.id === lesson.id)!;
    expect(expected.cardIds).toEqual(lesson.cards.map((card) => card.id));
    expect(expected.pages).toEqual(lesson.sourcePages);
    expect(lesson.topics.length).toBeGreaterThan(1);
    for (const entry of lesson.cards) {
      expect(ids.has(entry.id)).toBe(false);
      expect(questions.has(entry.question)).toBe(false);
      ids.add(entry.id);
      questions.add(entry.question);
      expect(entry.tags).toEqual(
        expect.arrayContaining(['auvp', 'renda-fixa', 'modulo-3', lesson.id]),
      );
      expect(entry.tags.length).toBeGreaterThanOrEqual(5);
      expect(entry.answer.trim()).not.toBe('');
      expect(entry.explanation.trim().length).toBeGreaterThan(30);
      expect(entry.sourcePages.length).toBeGreaterThan(0);
      for (const page of entry.sourcePages) {
        // Cross-references to another lesson's page are allowed, within this PDF.
        expect(coverage.studyPages).toContain(page);
        pages.add(page);
      }
    }
  }
  expect([...pages].sort((a, b) => a - b)).toEqual(coverage.studyPages);
});

test('catálogo inclui explicações críticas para contas, limites e opiniões da apostila', () => {
  const cards = catalog.lessons.flatMap((lesson) => lesson.cards);
  expect(cards.find((card) => card.id === 'aula-06-03')!.answer).toContain(
    '14,45%',
  );
  expect(cards.find((card) => card.id === 'aula-07-2-15')!.answer).toContain(
    '57.874,53',
  );
  expect(33391.39 * Math.pow(1.13, 54 / 12)).toBeCloseTo(57874.53, 2);
  expect(cards.find((card) => card.id === 'aula-14-19')!.answer).toContain(
    'sobre rendimentos',
  );
  for (const topic of [
    'fgc',
    'come-cotas',
    'basileia',
    'pgbl',
    'vgbl',
    'itcmd',
    'contrafluxo',
    'mercado-secundario',
    'securitizacao',
    'custo-de-oportunidade',
  ])
    expect(cards.some((card) => card.tags.includes(topic))).toBe(true);
});

test('instalação e atualizações mantêm progresso, dados pessoais, backup completo e proteção contra sync', async () => {
  const existing = withBundledDecks(emptyLibrary);
  existing.decks.push({
    id: 'own',
    name: 'Anotações pessoais',
    syncEnabled: false,
  });
  existing.cards.push({
    id: 'personal-note',
    deckId: 'own',
    front: 'Minha pergunta',
    back: 'Minha resposta',
    reviews: 4,
    interval: 6,
    due: 999,
  });
  const first = withBundledAuvpDeck(existing);
  const card = first.cards.find((item) => item.deckId === manifest.id)!;
  Object.assign(card, {
    reviews: 12,
    interval: 30,
    due: 123456,
    favorite: true,
  });
  const old = structuredClone(first);
  const next = withBundledAuvpDeck(first);
  expect(next).toEqual(old);
  expect(parseBackup(JSON.stringify(next))).toEqual(next);
  expect(pendingIds(next, emptySyncState())).toEqual([]);
  expect(next.cards.filter((item) => item.deckId === manifest.id)).toHaveLength(
    250,
  );
  const beforeDeck = {
    ...next,
    decks: next.decks.filter((deck) => deck.id !== manifest.id),
    cards: next.cards.filter((item) => item.deckId !== manifest.id),
  };
  const restored = withBundledAuvpDeck(beforeDeck);
  for (const item of beforeDeck.cards)
    expect(restored.cards.find((current) => current.id === item.id)).toEqual(
      item,
    );
  for (const item of next.cards.filter((item) => item.deckId === manifest.id)) {
    expect(isBundledId(item.id)).toBe(true);
    expect(item.faces).toHaveLength(3);
    expect(item.faces!.every((face) => face.content.trim())).toBe(true);
    expect(item.syncEnabled).toBe(false);
  }
  let calls = 0;
  const forbidden = async () => {
    calls++;
    throw new Error('Não acessar banco');
  };
  const handler = createHandler(
    { get: forbidden, put: forbidden, changes: forbidden },
    [],
  );
  for (const id of [manifest.id, card.id])
    for (const method of ['GET', 'PUT', 'DELETE'])
      expect(
        (
          await handler({
            requestContext: { http: { path: `/flashcards/${id}`, method } },
          })
        ).statusCode,
      ).toBe(403);
  expect(calls).toBe(0);
});
