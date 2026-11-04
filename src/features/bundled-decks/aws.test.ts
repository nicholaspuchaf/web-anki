import { expect, test } from 'bun:test';
import catalog from '../../content/aws-services.json';
import { AWS_CARD_COUNT, withBundledAwsDeck } from './aws';
import { AWS_DECK_ID, isBundledId } from './ids';
import { emptyLibrary, type Library } from '../library/model';
import {
  pendingIds,
  emptySyncState,
  mergeChanges,
  type CloudCard,
} from '../sync/model';
import { createCloudApi } from '../sync/api';
import { createHandler, type HttpEvent } from '../../../backend/service';
import type { FlashcardStore } from '../../../backend/model';
import { parseBackup } from '../backup/parse-backup';
import { parseStudyFaces } from '../standard/model';
import { removeCard, removeDeck } from '../library/commands';

test('catálogo extenso tem IDs estáveis, quatro versos com aprofundamento, categorias e fontes oficiais', () => {
  const library = withBundledAwsDeck(emptyLibrary);
  expect(AWS_CARD_COUNT).toBeGreaterThanOrEqual(300);
  expect(
    catalog.cards.filter((card) => card.category.startsWith('Bedrock')),
  ).toHaveLength(45);
  expect(
    new Set(catalog.cards.map((card) => card.category)).size,
  ).toBeGreaterThanOrEqual(20);
  expect(library.decks[0]).toMatchObject({
    id: AWS_DECK_ID,
    syncEnabled: false,
    defaultTemplate: 'multi-face',
  });
  expect(new Set(library.cards.map((card) => card.id)).size).toBe(
    AWS_CARD_COUNT,
  );
  expect(
    new Set(catalog.cards.map((entry) => entry.intermediateComment)).size,
  ).toBe(AWS_CARD_COUNT);
  expect(new Set(catalog.cards.map((entry) => entry.seniorComment)).size).toBe(
    AWS_CARD_COUNT,
  );
  for (const card of library.cards) {
    expect(isBundledId(card.id)).toBe(true);
    expect(card.syncEnabled).toBe(false);
    expect(card.faces).toHaveLength(4);
    const entry = catalog.cards.find(
      (item) => card.id === `builtin-aws-${item.id}`,
    )!;
    expect(card.faces![3]).toEqual({
      id: `${card.id}-senior`,
      title: 'Visão de sênior',
      content: entry.seniorComment,
    });
    expect(entry.seniorComment.length).toBeGreaterThan(250);
    expect(entry.seniorComment).not.toBe(entry.intermediateComment);
    expect(card.faces![2].title).toBe('Visão de pleno');
    expect(card.faces![2].content.length).toBeGreaterThan(150);
    expect(card.faces![0].title).toBe('O que é');
    expect(card.faces![0].content.length).toBeLessThanOrEqual(150);
    expect(card.faces![0].content.split('\n').length).toBeLessThanOrEqual(4);
    expect(card.faces![1].content.length).toBeGreaterThan(35);
    expect(card.tags?.length).toBeGreaterThanOrEqual(2);
    const url = new URL(card.sourceUrl!);
    expect(url.protocol).toBe('https:');
    expect([
      'aws.amazon.com',
      'docs.aws.amazon.com',
      'builder.aws.com',
      'kiro.dev',
    ]).toContain(url.hostname);
  }
  expect(withBundledAwsDeck(library)).toEqual(library);
});

test.each([2, 3])(
  'atualiza cartões de %i versos sem duplicar nem perder revisões e favoritos',
  (previousFaceCount) => {
    const library = withBundledAwsDeck(emptyLibrary);
    const card = library.cards[0];
    card.due = 12345;
    card.interval = 7;
    card.reviews = 4;
    card.favorite = true;
    card.front = 'Conteúdo antigo';
    card.faces![0].content = 'Versão antiga';
    card.faces = card.faces!.slice(0, previousFaceCount);
    card.syncEnabled = true;
    library.decks[0].syncEnabled = true;
    const migrated = withBundledAwsDeck(library);
    expect(migrated.cards).toHaveLength(AWS_CARD_COUNT);
    expect(migrated.cards[0]).toMatchObject({
      front: catalog.cards[0].name,
      due: 12345,
      interval: 7,
      reviews: 4,
      favorite: true,
      syncEnabled: false,
    });
    expect(migrated.cards[0].faces![0].content).toBe(
      catalog.cards[0].definition,
    );
    expect(migrated.cards[0].faces![2]).toMatchObject({
      title: 'Visão de pleno',
      content: catalog.cards[0].intermediateComment,
    });
    expect(migrated.cards[0].faces).toHaveLength(4);
    expect(migrated.cards[0].faces![3]).toMatchObject({
      title: 'Visão de sênior',
      content: catalog.cards[0].seniorComment,
    });
    expect(parseBackup(JSON.stringify(migrated))).toEqual(migrated);
    expect(() => removeCard(migrated, card.id)).toThrow('repositório');
    expect(() => removeDeck(migrated, AWS_DECK_ID)).toThrow('repositório');
  },
);

test('adiciona o padrão a uma biblioteca existente e mantém os dados pessoais intactos', () => {
  const own: Library = {
    version: 1,
    decks: [{ id: 'mine', name: 'Pessoal' }],
    cards: [
      {
        id: 'c',
        deckId: 'mine',
        front: 'Pergunta',
        back: 'Resposta',
        due: 8,
        interval: 2,
        reviews: 3,
      },
    ],
  };
  const result = withBundledAwsDeck(own);
  expect(result.cards[0]).toEqual(own.cards[0]);
  expect(result.decks[0]).toEqual(own.decks[0]);
  expect(result.cards).toHaveLength(AWS_CARD_COUNT + 1);
  expect(pendingIds(result, emptySyncState())).toEqual(['c']);
});

test('cartões locais não geram pendências, atualizações, exclusões ou conflitos de nuvem', async () => {
  const library = withBundledAwsDeck(emptyLibrary);
  const card = library.cards[0];
  const remote: CloudCard = {
    flashcard_id: card.id,
    version: 9,
    last_updated_at: '2026-11-04T10:00:00.000Z',
    deleted_at: null,
    card: { ...card, front: 'Alterado na nuvem', syncEnabled: true },
    deck: { ...library.decks[0], syncEnabled: true },
  };
  const state = {
    ...emptySyncState(),
    records: { [card.id]: remote },
    conflicts: { [card.id]: remote },
  };
  expect(pendingIds(library, state)).toEqual([]);
  const merged = mergeChanges(library, state, [
    remote,
    {
      flashcard_id: card.id,
      version: 10,
      last_updated_at: remote.last_updated_at,
      deleted_at: remote.last_updated_at,
    },
  ]);
  expect(merged.library.cards[0].front).toBe(card.front);
  expect(merged.state.records).toEqual({});
  expect(merged.state.conflicts).toEqual({});
  expect(pendingIds(emptyLibrary, state)).toEqual([]);
  let requests = 0;
  const api = createCloudApi('https://api.example', async () => {
    requests++;
    return Response.json({});
  });
  await expect(
    api.put(card.id, { card, deck: library.decks[0] }, 0),
  ).rejects.toMatchObject({ status: 403 });
  await expect(api.delete(card.id, 9)).rejects.toMatchObject({ status: 403 });
  expect(requests).toBe(0);
});

test('flag syncEnabled também impede envio de cartões e baralhos locais criados pelo usuário', () => {
  const card = {
    id: 'c',
    deckId: 'd',
    front: 'Pergunta',
    back: '',
    due: 0,
    interval: 0,
    reviews: 0,
  };
  expect(
    pendingIds(
      {
        version: 1,
        cards: [{ ...card, syncEnabled: false }],
        decks: [{ id: 'd', name: 'Local' }],
      },
      emptySyncState(),
    ),
  ).toEqual([]);
  expect(
    pendingIds(
      {
        version: 1,
        cards: [card],
        decks: [{ id: 'd', name: 'Local', syncEnabled: false }],
      },
      emptySyncState(),
    ),
  ).toEqual([]);
});

test('backend bloqueia IDs do repositório e a flag local antes de qualquer acesso ao DynamoDB', async () => {
  let operations = 0;
  const unavailable = async () => {
    operations++;
    throw new Error('DynamoDB must not be called');
  };
  const store: FlashcardStore = {
    get: unavailable,
    put: unavailable,
    changes: unavailable,
  };
  const handler = createHandler(store, []);
  const card = withBundledAwsDeck(emptyLibrary).cards[0];
  function event(method: string, id: string, body?: unknown): HttpEvent {
    return {
      requestContext: { http: { method, path: `/flashcards/${id}` } },
      headers: { 'content-type': 'application/json', 'if-match': '0' },
      body: body ? JSON.stringify(body) : undefined,
    };
  }
  for (const method of ['GET', 'PUT', 'DELETE'])
    expect(
      (
        await handler(
          event(method, card.id, {
            card,
            deck: { id: card.deckId, name: 'AWS' },
          }),
        )
      ).statusCode,
    ).toBe(403);
  const local = { ...card, id: 'mine', deckId: 'd', syncEnabled: false };
  expect(
    (
      await handler(
        event('PUT', 'mine', { card: local, deck: { id: 'd', name: 'Local' } }),
      )
    ).statusCode,
  ).toBe(403);
  expect(
    (
      await handler(
        event('PUT', 'mine', {
          card: { ...local, syncEnabled: true },
          deck: { id: 'd', name: 'Local', syncEnabled: false },
        }),
      )
    ).statusCode,
  ).toBe(403);
  expect(operations).toBe(0);
});

test('versos padrão rejeitam IDs duplicados e formatos inválidos', () => {
  expect(parseStudyFaces([{ id: 'one', title: '', content: '' }])).toEqual([
    { id: 'one', title: 'Verso 1', content: '' },
  ]);
  for (const input of [
    null,
    {},
    [{ id: 'x', title: 'Título', content: 4 }],
    [
      { id: 'x', title: '', content: '' },
      { id: 'x', title: '', content: '' },
    ],
  ])
    expect(() => parseStudyFaces(input)).toThrow();
});
