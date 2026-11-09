import mc714 from '../../content/decks/mc714/flashcards';
import { expect, test } from 'bun:test';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import catalog from '../../content/decks/design-patterns/flashcards/index';
import assets from '../../content/decks/design-patterns/assets.json' with { type: 'json' };
import { withBundledDecks } from './catalog';
import { withBundledPatternsDeck, PATTERNS_CARD_COUNT } from './patterns';
import { withBundledAwsDeck, AWS_CARD_COUNT } from './aws';
import { PATTERNS_DECK_ID, AWS_DECK_ID, isBundledId } from './ids';
import { emptyLibrary } from '../library/model';
import {
  emptySyncState,
  pendingIds,
  mergeChanges,
  type CloudCard,
} from '../sync/model';
import { parseBackup } from '../backup/parse-backup';
import { parseStudyImage } from '../standard/image';
import { filledFaces } from '../standard/model';
import { createHandler } from '../../../backend/service';
import { createCloudApi } from '../sync/api';

const topics = [
  'conceito',
  'problema',
  'estrutura',
  'implementacao',
  'exemplo',
  'aplicabilidade',
  'trade-offs',
  'comparacao',
];

test('22 padrões têm oito perguntas distintas, cobertura temática, fontes e imagens locais íntegras', () => {
  expect(catalog.patterns).toHaveLength(22);
  expect(PATTERNS_CARD_COUNT).toBe(176);
  const library = withBundledPatternsDeck(emptyLibrary);
  expect(new Set(library.cards.map((card) => card.id)).size).toBe(176);
  for (const pattern of catalog.patterns) {
    expect(pattern.cards.map((entry) => entry.id)).toEqual(topics);
    expect(new Set(pattern.cards.map((entry) => entry.question)).size).toBe(8);
    expect(pattern.cards.every((entry) => entry.answer.trim())).toBe(true);
    expect(pattern.sourceUrl).toBe(
      `https://refactoring.guru/design-patterns/${pattern.id}`,
    );
    const words = pattern.cards
      .flatMap((entry) => [entry.question, entry.answer])
      .join(' ')
      .split(/\s+/).length;
    expect(words).toBeLessThanOrEqual(185);
    const card = library.cards.find(
      (item) => item.id === `builtin-patterns-${pattern.id}-estrutura`,
    )!;
    expect(existsSync(`public${card.frontImage!.src}`)).toBe(true);
    expect(parseStudyImage(card.frontImage)).toEqual(card.frontImage!);
    expect(card.frontImage!.alt).toContain(pattern.name);
  }
  expect(assets).toHaveLength(10);
  expect(new Set(assets.map((asset) => asset.originalUrl)).size).toBe(10);
  for (const asset of assets) {
    const data = readFileSync(`public${asset.src}`);
    expect(createHash('sha256').update(data).digest('hex')).toBe(asset.sha256);
    expect(data.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(asset.credit).toContain('Dmitry Zhart');
    expect(asset.sourceUrl).toBe(
      `https://refactoring.guru/design-patterns/${asset.pattern}`,
    );
  }
});

test('recompor dois baralhos preserva conteúdo, progresso, favoritos e cartões pessoais em qualquer ordem', () => {
  const own = {
    ...emptyLibrary,
    decks: [{ id: 'own', name: 'Meu' }],
    cards: [
      {
        id: 'personal',
        deckId: 'own',
        front: 'Minha pergunta',
        back: 'Resposta',
        due: 4,
        interval: 2,
        reviews: 1,
      },
    ],
  };
  const library = withBundledDecks(own);
  expect(library.cards).toHaveLength(
    AWS_CARD_COUNT + PATTERNS_CARD_COUNT + mc714.cards.length + 1,
  );
  expect(library.cards[0]).toEqual(own.cards[0]);
  const pattern = library.cards.find(
    (card) => card.deckId === PATTERNS_DECK_ID,
  )!;
  const aws = library.cards.find((card) => card.deckId === AWS_DECK_ID)!;
  Object.assign(pattern, { due: 123, interval: 8, reviews: 4, favorite: true });
  Object.assign(aws, { due: 456, interval: 3, reviews: 2 });
  const expected = structuredClone(library);
  expect(withBundledDecks(library)).toEqual(expected);
  const reverse = withBundledAwsDeck(withBundledPatternsDeck(library));
  expect(new Map(reverse.cards.map((card) => [card.id, card]))).toEqual(
    new Map(expected.cards.map((card) => [card.id, card])),
  );
  expect(parseBackup(JSON.stringify(library))).toEqual(library);
  expect(pendingIds(library, emptySyncState())).toEqual(['personal']);
});

test('IDs do novo baralho bloqueiam mutação remota e qualquer operação DynamoDB', async () => {
  const library = withBundledDecks(emptyLibrary);
  const card = library.cards.find((item) => item.deckId === PATTERNS_DECK_ID)!;
  const deck = library.decks.find((item) => item.id === PATTERNS_DECK_ID)!;
  const remote: CloudCard = {
    flashcard_id: card.id,
    version: 3,
    last_updated_at: '2026-11-04T12:00:00.000Z',
    deleted_at: null,
    card: { ...card, front: 'Remoto', syncEnabled: true },
    deck: { ...deck, syncEnabled: true },
  };
  expect(mergeChanges(library, emptySyncState(), [remote]).library).toEqual(
    library,
  );
  expect(
    mergeChanges(library, emptySyncState(), [
      { ...remote, deleted_at: remote.last_updated_at },
    ]).library,
  ).toEqual(library);
  expect(pendingIds(library, emptySyncState())).toEqual([]);
  let calls = 0;
  const unavailable = async () => {
    calls++;
    throw new Error('Não acessar DynamoDB ou rede');
  };
  const handler = createHandler(
    { get: unavailable, put: unavailable, changes: unavailable },
    [],
  );
  for (const id of [card.id, PATTERNS_DECK_ID]) {
    expect(isBundledId(id)).toBe(true);
    for (const method of ['GET', 'PUT', 'DELETE'])
      expect(
        (
          await handler({
            requestContext: { http: { method, path: `/flashcards/${id}` } },
          })
        ).statusCode,
      ).toBe(403);
  }
  const api = createCloudApi('https://api.example', unavailable);
  await expect(api.put(card.id, { card, deck }, 0)).rejects.toMatchObject({
    status: 403,
  });
  await expect(api.delete(card.id, 1)).rejects.toMatchObject({ status: 403 });
  expect(calls).toBe(0);
});

test('backup preserva imagens e versos visuais, rejeitando caminhos e URLs inseguros', () => {
  const library = withBundledPatternsDeck(emptyLibrary);
  expect(parseBackup(JSON.stringify(library))).toEqual(library);
  const image = library.cards.find((card) => card.frontImage)!.frontImage!;
  for (const src of [
    'https://tracker.example/image.png',
    '/study-assets/../secret.png',
    'javascript:alert(1)',
    '//evil.test/a.png',
    '/study-assets/x.svg?onload=x',
  ])
    expect(() => parseStudyImage({ ...image, src })).toThrow();
  expect(() => parseStudyImage({ ...image, alt: '' })).toThrow();
  expect(() =>
    parseStudyImage({ ...image, sourceUrl: 'javascript:alert(1)' }),
  ).toThrow();
  expect(
    filledFaces([{ id: 'visual', title: 'Imagem', content: '', image }]),
  ).toHaveLength(1);
});

test('todos os cartões recebem três versos didáticos e atualizam versões antigas sem perder progresso', () => {
  const library = withBundledPatternsDeck(emptyLibrary);
  for (const pattern of catalog.patterns) {
    expect(pattern.explanation.length).toBeGreaterThan(350);
    expect(pattern.background.length).toBeGreaterThan(300);
    expect(new Set(pattern.cards.map((entry) => entry.rationale)).size).toBe(8);
    for (const entry of pattern.cards) {
      const id = `builtin-patterns-${pattern.id}-${entry.id}`;
      const card = library.cards.find((item) => item.id === id)!;
      const faces = card.faces!;
      expect(new Set(faces.map((face) => face.id)).size).toBe(faces.length);
      expect(faces.find((face) => face.id === `${id}-answer`)!.content).toBe(
        entry.answer,
      );
      expect(
        faces.find((face) => face.id === `${id}-explanation`)!.content,
      ).toBe(pattern.explanation);
      expect(
        faces.find((face) => face.id === `${id}-background`)!.content,
      ).toBe(pattern.background);
      expect(faces.find((face) => face.id === `${id}-rationale`)!.content).toBe(
        entry.rationale,
      );
      expect(entry.rationale.length).toBeGreaterThan(140);
      expect(faces).toHaveLength(
        entry.id === 'estrutura' &&
          assets.some((asset) => asset.pattern === pattern.id)
          ? 5
          : 4,
      );
    }
  }
  const old = structuredClone(library);
  for (const card of old.cards) {
    card.faces = card.faces!.filter(
      (face) =>
        !['explanation', 'background', 'rationale'].some((suffix) =>
          face.id.endsWith(`-${suffix}`),
        ),
    );
    Object.assign(card, {
      due: 123456,
      interval: 7,
      reviews: 12,
      favorite: true,
    });
  }
  const upgraded = withBundledPatternsDeck(old);
  for (const card of upgraded.cards) {
    expect(card).toMatchObject({
      due: 123456,
      interval: 7,
      reviews: 12,
      favorite: true,
    });
    expect(card.faces).toEqual(
      library.cards.find((item) => item.id === card.id)!.faces,
    );
  }
  expect(parseBackup(JSON.stringify(upgraded))).toEqual(upgraded);
  expect(pendingIds(upgraded, emptySyncState())).toEqual([]);
});
