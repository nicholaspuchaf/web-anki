import { expect, test } from 'bun:test';
import { addDeck, putCard, removeCard, removeDeck } from './commands';
import { emptyLibrary } from './model';

test('cria e edita cartões sem mutar a biblioteca original', () => {
  const library = addDeck(emptyLibrary, ' Inglês ', 'd');
  const card = {
    id: 'c',
    deckId: 'd',
    front: ' hello ',
    back: ' olá ',
    due: 0,
    interval: 0,
    reviews: 0,
  };
  const next = putCard(library, card);
  expect(next.cards[0].front).toBe('hello');
  expect(library.cards).toHaveLength(0);
  const edited = putCard(next, { ...card, back: 'oi' });
  expect(edited.cards).toHaveLength(1);
  expect(edited.cards[0].back).toBe('oi');
  expect(removeCard(edited, 'c').cards).toHaveLength(0);
  expect(() => putCard(emptyLibrary, card)).toThrow();
  expect(() => addDeck(emptyLibrary, '  ')).toThrow();
});

test('excluir um baralho remove somente seus cartões', () => {
  const library = addDeck(addDeck(emptyLibrary, 'Um', 'a'), 'Dois', 'b');
  const first = putCard(library, {
    id: '1',
    deckId: 'a',
    front: 'Q',
    back: 'A',
    due: 0,
    interval: 0,
    reviews: 0,
  });
  const second = putCard(first, { ...first.cards[0], id: '2', deckId: 'b' });
  const result = removeDeck(second, 'a');
  expect(result.decks.map((d) => d.id)).toEqual(['b']);
  expect(result.cards.map((c) => c.id)).toEqual(['2']);
  expect(second.cards).toHaveLength(2);
});
