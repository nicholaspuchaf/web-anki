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

test('persiste metadados e checkpoint atomicamente sem substituir alterações de outra aba', async () => {
  const { createSyncRepository } = await import('./library-repository');
  const endpoint = 'https://storage-test.example';
  const repository = createSyncRepository(endpoint);
  const initial = await repository.read();
  const next = {
    version: 1 as const,
    cards: [],
    decks: [{ id: 'atomic', name: 'Atômico' }],
  };
  const state = { ...initial.state, last_sync_at: '2026-11-01T10:00:00.000Z' };
  expect(await repository.commit(initial.revision, next, state)).toBe(true);
  expect((await repository.read()).state.last_sync_at).toBe(state.last_sync_at);
  expect(await readLibrary()).toEqual(next);
  expect(
    await repository.commit(
      initial.revision,
      { version: 1, cards: [], decks: [] },
      initial.state,
    ),
  ).toBe(false);
  expect(await readLibrary()).toEqual(next);
  const other = createSyncRepository('https://other-backend.example');
  expect((await other.read()).state.last_sync_at).toBeNull();
  const stale = await readLibrary();
  await writeLibrary({ version: 1, cards: [], decks: [] });
  await expect(writeLibrary(next, stale)).rejects.toThrow('outra aba');
  expect((await repository.read()).state.last_sync_at).toBe(state.last_sync_at);
});
