import { expect, test } from 'bun:test';
import type { Card, Library } from '../library/model';
import {
  dailyActivity,
  emptyHistory,
  historyAfterSave,
  intervalStages,
  localDay,
  newReviewEvent,
} from './model';
import { schedule } from '../review/scheduler';
const card: Card = {
  id: 'a',
  deckId: 'd',
  front: 'Pergunta',
  back: 'Resposta',
  reviews: 5,
  interval: 3,
  due: 200000,
};
const library: Library = {
  version: 1,
  decks: [{ id: 'd', name: 'Meu baralho' }],
  cards: [card, { ...card, id: 'b', reviews: 3 }],
};

test('revisões antigas são recuperadas sem data e migração é idempotente, sem alterar o progresso', () => {
  const before = structuredClone(library);
  const meta = historyAfterSave(undefined, library, library);
  expect(Object.values(meta.undated).reduce((sum, v) => sum + v.count, 0)).toBe(
    8,
  );
  expect(historyAfterSave(meta, library, library)).toEqual(meta);
  const series = dailyActivity({ meta, events: [] }, Date.now());
  expect(series[0]).toMatchObject({ key: 'undated', cards: 2, reviews: 8 });
  expect(series.slice(1).every((row) => row.reviews === 0)).toBe(true);
  expect(library).toEqual(before);
});

test('cada avaliação datada acrescenta uma revisão e não duplica a contagem sem data', () => {
  const now = new Date(2026, 10, 8, 13).getTime();
  const next = schedule(card, 'good', now);
  const event = newReviewEvent(card, next, 'good', now);
  const meta = historyAfterSave(
    undefined,
    library,
    { ...library, cards: [next, library.cards[1]] },
    event,
  );
  expect(meta.undated.a.count).toBe(5);
  expect(meta.totals.a).toBe(6);
  const twice = {
    ...event,
    id: 'second',
    reviewNumber: 7,
    reviewedAt: now + 1,
  };
  const third = {
    ...event,
    id: 'third',
    cardId: 'b',
    reviewNumber: 4,
    reviewedAt: now + 2,
  };
  const series = dailyActivity(
    { meta, events: [event, twice, third] },
    now + 3,
  );
  expect(series).toHaveLength(31);
  expect(series[0]).toMatchObject({ reviews: 8, cards: 2 });
  expect(series.at(-1)).toMatchObject({
    key: localDay(now),
    cards: 2,
    reviews: 3,
  });
  expect(() => historyAfterSave(meta, library, library, event)).toThrow(
    'incompatível',
  );
});

test('últimos 30 dias usam dias de calendário locais, incluindo hoje e excluindo o dia anterior à janela', () => {
  const now = new Date(2026, 10, 8, 15).getTime();
  const start = new Date(2026, 9, 10, 0).getTime();
  const base = {
    id: '1',
    cardId: 'a',
    deckId: 'd',
    reviewedAt: start,
    reviewNumber: 1,
    rating: 'good' as const,
    intervalBefore: 0,
    intervalAfter: 1,
  };
  const series = dailyActivity(
    {
      meta: emptyHistory(),
      events: [
        base,
        { ...base, id: '2', reviewedAt: start - 1 },
        {
          ...base,
          id: '3',
          reviewedAt: new Date(2026, 10, 8, 23, 59).getTime(),
        },
        { ...base, id: '4', deckId: 'other', reviewedAt: now },
      ],
    },
    now,
    'd',
  );
  expect(series[1]).toMatchObject({ key: '2026-10-10', reviews: 1 });
  expect(series.at(-1)).toMatchObject({ key: '2026-11-08', reviews: 1 });
  expect(series.reduce((sum, row) => sum + row.reviews, 0)).toBe(2);
});

test('intervalos fracionários são agrupados explicitamente e todo cartão entra em exatamente uma etapa', () => {
  const cards = [
    { ...card, reviews: 0, interval: 0 },
    ...[0, 0.5, 1.2, 2.5, 5, 6.25, 7, 400].map((interval, i) => ({
      ...card,
      id: String(i),
      interval,
    })),
  ];
  const before = structuredClone(cards);
  const stages = intervalStages(cards);
  expect(stages.reduce((sum, s) => sum + s.count, 0)).toBe(cards.length);
  for (const [key, count] of [
    ['new', 1],
    ['short', 2],
    ['1', 1],
    ['3', 1],
    ['5', 1],
    ['6', 1],
    ['7', 1],
    ['400', 1],
  ] as const)
    expect(stages.find((s) => s.key === key)?.count).toBe(count);
  expect(cards).toEqual(before);
});

test('importação, remoção e restauração de contadores não apagam o histórico já conhecido', () => {
  const baseline = historyAfterSave(undefined, library, library);
  const imported = { ...library, cards: [{ ...card, reviews: 8 }] };
  const next = historyAfterSave(baseline, library, imported);
  expect(next.undated.a.count).toBe(8);
  const removed = historyAfterSave(next, imported, { ...library, cards: [] });
  expect(removed.undated.a.count).toBe(8);
  expect(historyAfterSave(removed, { ...library, cards: [] }, library)).toEqual(
    removed,
  );
});
