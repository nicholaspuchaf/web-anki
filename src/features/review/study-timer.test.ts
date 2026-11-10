import { expect, test } from 'bun:test';
import { advanceStudyTime, formatStudyTime } from './study-timer';

test('tempo total acumula entre cartões, cartão reinicia e nova sessão zera os dois', () => {
  const start = { session: 0, totalMs: 0, cardMs: 0 };
  const first = advanceStudyTime(start, 1, 'a', 8500);
  const second = advanceStudyTime(first, 1, 'b', 2000);
  expect(second).toEqual({
    session: 1,
    cardId: 'b',
    totalMs: 10500,
    cardMs: 2000,
  });
  expect(advanceStudyTime(second, 2, 'b', 1000)).toEqual({
    session: 2,
    cardId: 'b',
    totalMs: 1000,
    cardMs: 1000,
  });
  expect(advanceStudyTime(first, 1, 'a', -500).totalMs).toBe(8500);
  expect(formatStudyTime(59999)).toBe('00:59');
  expect(formatStudyTime(60000)).toBe('01:00');
  expect(formatStudyTime(3661000)).toBe('01:01:01');
});
