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

test('aumento inicial se propaga proporcionalmente sem composição do multiplicador', () => {
  let original = card;
  let expanded = card;
  for (const rating of ['good', 'good', 'hard', 'easy', 'good'] as const) {
    original = schedule(original, rating, 1000, 1);
    expanded = schedule(expanded, rating, 1000, 2);
    expect(expanded.interval).toBeCloseTo(original.interval * 2);
    expect(expanded.due - 1000).toBe(Math.round(expanded.interval * 86400000));
    expect(expanded.reviews).toBe(original.reviews);
  }
});

test('trocar ou restaurar espaçamento normaliza o intervalo anterior e não modifica o passado', () => {
  const legacy = {
    ...card,
    interval: 10,
    due: 123,
    reviews: 5,
    favorite: true,
  };
  const stretched = schedule(legacy, 'good', 1000, 2);
  expect(stretched.interval).toBe(50);
  expect(schedule(stretched, 'good', 1000, 3).interval).toBe(187.5);
  expect(schedule(stretched, 'good', 1000, 1).interval).toBe(62.5);
  expect(legacy).toEqual({
    ...card,
    interval: 10,
    due: 123,
    reviews: 5,
    favorite: true,
  });
  const retry = schedule(stretched, 'again', 1000, 4);
  expect(retry.interval).toBe(0);
  expect(retry.due).toBe(61000);
  expect(schedule(retry, 'good', 1000, 4).interval).toBe(4);
  for (const invalid of [0, -1, 1.1, 5, NaN, Infinity])
    expect(() => schedule(card, 'good', 0, invalid)).toThrow(
      'Espaçamento inválido',
    );
});
