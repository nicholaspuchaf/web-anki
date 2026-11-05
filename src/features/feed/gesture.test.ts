import { expect, test } from 'bun:test';
import { carouselGesture } from './gesture';

test('gestos trocam temas apenas nas extremidades e no mobile', () => {
  const start = { x: 100, y: 300, atTop: true, atBottom: true };
  expect(carouselGesture(start, { x: 100, y: 100 }, true)).toBe(1);
  expect(carouselGesture(start, { x: 100, y: 500 }, true)).toBe(-1);
  expect(carouselGesture(start, { x: 100, y: 100 }, false)).toBe(0);
  expect(
    carouselGesture({ ...start, atBottom: false }, { x: 100, y: 100 }, true),
  ).toBe(0);
  expect(
    carouselGesture({ ...start, atTop: false }, { x: 100, y: 500 }, true),
  ).toBe(0);
  expect(carouselGesture(start, { x: 400, y: 100 }, true)).toBe(0);
  expect(carouselGesture(start, { x: 100, y: 290 }, true)).toBe(0);
});
