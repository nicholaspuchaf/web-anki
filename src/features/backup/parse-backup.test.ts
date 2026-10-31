import { expect, test } from 'bun:test';
import type { Library } from '../library/model';
import { parseBackup } from './parse-backup';
const card = {
  id: 'c',
  deckId: 'd',
  front: 'Q',
  back: 'A',
  due: 0,
  interval: 0,
  reviews: 0,
};
const backup: Library = {
  version: 1,
  decks: [{ id: 'd', name: 'Estudo' }],
  cards: [card],
};

test('aceita um backup completo e descarta propriedades desconhecidas', () => {
  expect(parseBackup(JSON.stringify({ ...backup, secret: 'ignored' }))).toEqual(
    backup,
  );
});

test('rejeita formato, números inválidos, ids duplicados e referências ausentes', () => {
  for (const invalid of [
    null,
    {},
    { ...backup, version: 2 },
    { ...backup, decks: [] },
    { ...backup, cards: [card, card] },
    { ...backup, decks: [...backup.decks, ...backup.decks] },
    ...[{ due: -1 }, { interval: -1 }, { reviews: 1.5 }, { front: ' ' }].map(
      (change) => ({ ...backup, cards: [{ ...card, ...change }] }),
    ),
  ]) {
    expect(() => parseBackup(JSON.stringify(invalid))).toThrow();
  }
});
