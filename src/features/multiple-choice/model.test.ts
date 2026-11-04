import { expect, test } from 'bun:test';
import { createMultipleChoice, parseMultipleChoice } from './model';
import { emptyLibrary, type Library } from '../library/model';
import { addDeck, putCard } from '../library/commands';
import { parseBackup } from '../backup/parse-backup';
import { createLeetCode } from '../leetcode/model';
import { createCloudApi } from '../sync/api';
import { createHandler, type HttpEvent } from '../../../backend/service';
import type { FlashcardStore, StoredFlashcard } from '../../../backend/model';

const choice = {
  options: [' Uma fila ', 'Uma pilha', 'Um mapa', 'Um conjunto'] as [
    string,
    string,
    string,
    string,
  ],
  correctIndex: 1,
  explanation: '',
};
const card = {
  id: 'c',
  deckId: 'd',
  front: 'Qual estrutura usa LIFO?',
  back: '',
  due: 0,
  interval: 0,
  reviews: 0,
  multipleChoice: choice,
};

test('exige exatamente quatro alternativas distintas e uma resposta correta, com explicação opcional', () => {
  expect(() => parseMultipleChoice(createMultipleChoice())).toThrow();
  expect(parseMultipleChoice(choice)).toEqual({
    ...choice,
    options: ['Uma fila', 'Uma pilha', 'Um mapa', 'Um conjunto'],
  });
  for (const value of [
    { ...choice, options: [] },
    { ...choice, options: ['A', 'B', 'C'] },
    { ...choice, options: ['A', 'B', 'C', 'D', 'E'] },
    { ...choice, options: ['A', 'B', 'C', ' '] },
    { ...choice, options: ['A', 'B', 'C', 4] },
    { ...choice, options: ['A', ' a ', 'B', 'C'] },
    { ...choice, correctIndex: -1 },
    { ...choice, correctIndex: 4 },
    { ...choice, correctIndex: 1.5 },
    { ...choice, correctIndex: null },
    { ...choice, explanation: 4 },
  ])
    expect(() => parseMultipleChoice(value)).toThrow();
});

test('comandos e backups preservam o template padrão, alternativas e gabarito sem mudar os cartões antigos', () => {
  const library = putCard(
    addDeck(emptyLibrary, 'Certificação', 'd', 'multiple-choice'),
    card,
  );
  const restored = parseBackup(JSON.stringify(library));
  expect(restored.decks[0].defaultTemplate).toBe('multiple-choice');
  expect(restored.cards[0].multipleChoice?.correctIndex).toBe(1);
  expect(restored.cards[0].multipleChoice?.options[0]).toBe('Uma fila');
  expect(
    parseBackup(
      JSON.stringify({
        ...library,
        cards: [{ ...card, multipleChoice: undefined }],
      }),
    ).cards[0],
  ).not.toHaveProperty('multipleChoice');
  expect(() =>
    parseBackup(
      JSON.stringify({
        ...library,
        decks: [{ id: 'd', name: 'Nome', defaultTemplate: 'unknown' }],
      }),
    ),
  ).toThrow();
  expect(() =>
    putCard(library, {
      ...card,
      multipleChoice: { ...choice, options: ['A', 'A', 'B', 'C'] },
    }),
  ).toThrow();
  expect(() =>
    putCard(library, { ...card, leetcode: createLeetCode() }),
  ).toThrow();
  expect(() =>
    parseBackup(
      JSON.stringify({
        ...library,
        cards: [{ ...card, leetcode: createLeetCode() }],
      }),
    ),
  ).toThrow();
});

test('cartão de múltipla escolha atravessa a API real e mantém alternativas, gabarito e baralho', async () => {
  let stored: StoredFlashcard | null = null;
  const store: FlashcardStore = {
    async get() {
      return stored;
    },
    async put(value, expected) {
      if ((stored?.version ?? 0) !== expected) return false;
      stored = value;
      return true;
    },
    async changes() {
      return { items: stored ? [stored] : [] };
    },
  };
  const handler = createHandler(store, []);
  const api = createCloudApi('https://api.example', async (input, init) => {
    const url = new URL(String(input));
    const event: HttpEvent = {
      requestContext: {
        http: { method: init?.method ?? 'GET', path: url.pathname },
      },
      headers: Object.fromEntries(new Headers(init?.headers)),
      body: init?.body as string | undefined,
      queryStringParameters: Object.fromEntries(url.searchParams),
    };
    const result = await handler(event);
    return new Response(result.body, { status: result.statusCode });
  });
  const library: Library = putCard(
    addDeck(emptyLibrary, 'Certificação', 'd', 'multiple-choice'),
    card,
  );
  await api.put('c', { card: library.cards[0], deck: library.decks[0] }, 0);
  expect(await api.get('c')).toMatchObject({
    card: { multipleChoice: { correctIndex: 1, explanation: '' } },
    deck: { defaultTemplate: 'multiple-choice' },
  });
  expect((await api.changes()).changes[0]).toMatchObject({
    card: {
      multipleChoice: {
        options: ['Uma fila', 'Uma pilha', 'Um mapa', 'Um conjunto'],
      },
    },
  });
});
