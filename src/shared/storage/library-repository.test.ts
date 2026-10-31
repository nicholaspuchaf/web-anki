import 'fake-indexeddb/auto';
import { expect, test } from 'bun:test';
import { readLibrary, writeLibrary } from './library-repository';
import type { Library } from '../../features/library/model';

test('persiste cartões e revisões entre aberturas do banco', async () => {
  expect((await readLibrary()).cards).toEqual([]);
  const data: Library = {
    version: 1,
    decks: [{ id: 'd', name: 'Teste' }],
    cards: [
      {
        id: 'c',
        deckId: 'd',
        front: 'Q',
        back: 'A',
        due: 123,
        interval: 1,
        reviews: 2,
      },
    ],
  };
  await writeLibrary(data);
  expect(await readLibrary()).toEqual(data);
  await writeLibrary({ version: 1, decks: [], cards: [] });
  expect((await readLibrary()).decks).toEqual([]);
});
