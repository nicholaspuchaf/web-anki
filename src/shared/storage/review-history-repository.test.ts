import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { afterEach, beforeEach, expect, test } from 'bun:test';
import type { Library } from '../../features/library/model';
import { schedule } from '../../features/review/scheduler';
import { newReviewEvent } from '../../features/review-history/model';
import { libraryDatabase } from './library-database';
import { readLibrary, writeLibrary } from './library-repository';
import {
  readReviewHistory,
  mirrorHistory,
  HISTORY_LOCAL_PREFIX,
} from './review-history-repository';
let previous: IDBFactory;
beforeEach(() => {
  previous = globalThis.indexedDB as IDBFactory;
  globalThis.indexedDB = new IDBFactory();
});
afterEach(() => {
  globalThis.indexedDB = previous;
});
const library: Library = {
  version: 1,
  decks: [{ id: 'd', name: 'Histórico' }],
  cards: [
    {
      id: 'a',
      deckId: 'd',
      front: 'Pergunta',
      back: 'Resposta',
      reviews: 4,
      interval: 3,
      due: 5,
    },
  ],
};
async function legacy() {
  const db = await libraryDatabase();
  await db.put('library', structuredClone(library), 'current');
  db.close();
}

test('abrir um banco antigo cria somente metadados de histórico e não modifica cartões ou vencimentos', async () => {
  await legacy();
  const history = await readReviewHistory();
  expect(history.meta.undated.a.count).toBe(4);
  expect(history.events).toEqual([]);
  expect(await readLibrary()).toEqual(library);
  expect((await readReviewHistory()).meta).toEqual(history.meta);
});

test('histórico e progresso são salvos juntos; conflitos e registros duplicados não criam avaliações extras', async () => {
  await legacy();
  const before = await readLibrary(),
    now = 123456789;
  const after = schedule(before.cards[0], 'good', now);
  const event = newReviewEvent(before.cards[0], after, 'good', now);
  const next = { ...before, cards: [after] };
  await writeLibrary(next, before, event);
  const history = await readReviewHistory();
  expect(history.events).toEqual([event]);
  expect(history.meta.undated.a.count).toBe(4);
  expect(await readLibrary()).toEqual(next);
  await expect(
    writeLibrary(next, before, { ...event, id: 'conflict' }),
  ).rejects.toThrow('outra aba');
  await expect(
    writeLibrary(
      { ...next, cards: [{ ...after, reviews: after.reviews + 1 }] },
      next,
      {
        ...event,
        reviewNumber: after.reviews + 1,
        intervalBefore: after.interval,
      },
    ),
  ).rejects.toThrow('já foi registrada');
  expect((await readReviewHistory()).events).toEqual([event]);
  expect(await readLibrary()).toEqual(next);
});

test('falha de gravação da cópia localStorage não apaga o histórico durável e o cache pode ser reconstruído', async () => {
  await legacy();
  const before = await readLibrary();
  const after = schedule(before.cards[0], 'easy', 9000);
  const event = newReviewEvent(before.cards[0], after, 'easy', 9000);
  await writeLibrary({ ...before, cards: [after] }, before, event);
  const history = await readReviewHistory();
  expect(
    mirrorHistory(history.meta, history.events, {
      setItem() {
        throw new Error('QuotaExceededError');
      },
    }),
  ).toContain('preservadas');
  const cache = new Map<string, string>();
  expect(
    mirrorHistory(history.meta, history.events, {
      setItem: (key, value) => {
        cache.set(key, value);
      },
    }),
  ).toBeUndefined();
  expect(
    JSON.parse(cache.get(HISTORY_LOCAL_PREFIX + 'event:' + event.id)!),
  ).toEqual(event);
  expect((await readReviewHistory()).events).toEqual([event]);
});
