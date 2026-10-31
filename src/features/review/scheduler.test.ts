import { expect, test } from 'bun:test';
import { schedule } from './scheduler';
import type { Card } from '../library/model';
const card: Card = {
  id: 'c',
  deckId: 'd',
  front: 'Q',
  back: 'A',
  due: 0,
  interval: 0,
  reviews: 0,
};

test('repetir agenda para um minuto e preserva o cartão original', () => {
  expect(schedule(card, 'again', 1000)).toEqual({
    ...card,
    reviews: 1,
    due: 61000,
  });
  expect(card.reviews).toBe(0);
});

test('acertos espaçam revisões de acordo com a dificuldade', () => {
  const first = schedule(card, 'good', 0);
  const second = schedule(first, 'good', first.due);
  expect(first.interval).toBe(1);
  expect(second.interval).toBe(2.5);
  expect(second.due).toBe(first.due + 2.5 * 86400000);
  expect(schedule(card, 'easy', 0).interval).toBe(4);
  expect(schedule(first, 'hard', 0).interval).toBe(1.2);
});
