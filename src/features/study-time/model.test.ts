import { expect, test } from 'bun:test';
import { localDay } from '../review-history/model';
import { splitStudySpan, studyTimeSummary, type StudyRecord } from './model';
import {
  readStudyTime,
  recordStudySpan,
  STUDY_PREFIX,
  type StudyVisit,
} from './repository';

test('trecho atravessando meia-noite é dividido pelos dias locais, sem duplicar a passagem na média', () => {
  const midnight = new Date(2026, 10, 10).getTime();
  const parts = splitStudySpan(midnight + 4000, 10000);
  expect(parts).toEqual([
    { day: localDay(midnight - 1), durationMs: 6000 },
    { day: localDay(midnight), durationMs: 4000 },
  ]);
  const records: StudyRecord[] = parts.map((part) => ({
    ...part,
    id: 'visit',
    cardId: 'a',
    deckId: 'd',
    lastStudiedAt: midnight + 4000,
    practice: false,
  }));
  records.push({
    id: 'second',
    cardId: 'a',
    deckId: 'd',
    day: localDay(midnight),
    durationMs: 2000,
    lastStudiedAt: midnight + 6000,
    practice: true,
  });
  records.push({
    ...records[0],
    id: 'other',
    deckId: 'other',
    cardId: 'other',
    durationMs: 50000,
  });
  const summary = studyTimeSummary(records, midnight + 6000, 'd');
  expect(summary.totalMs).toBe(12000);
  expect(summary.visits).toBe(2);
  expect(summary.averageMs).toBe(6000);
  expect(summary.cards[0].averageMs).toBe(6000);
  expect(summary.daily).toHaveLength(30);
  expect(summary.daily.at(-1)!.durationMs).toBe(6000);
  expect(studyTimeSummary([], midnight).cards).toEqual([]);
  expect(
    studyTimeSummary(records, midnight + 6000, 'd', localDay(midnight)).cards[0]
      .durationMs,
  ).toBe(6000);
});

test('checkpoints idempotentes preservam tempo por visita, ignoram registros inválidos e recuperam falha de gravação', () => {
  const values = new Map<string, string>();
  const storage = {
    setItem(key: string, value: string) {
      values.set(key, value);
    },
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    key(index: number) {
      return [...values.keys()][index] ?? null;
    },
    get length() {
      return values.size;
    },
  };
  const visit: StudyVisit = {
    id: 'checkpoint-test',
    cardId: 'a',
    deckId: 'd',
    practice: false,
    days: new Map(),
  };
  const now = new Date(2026, 10, 10, 12).getTime();
  recordStudySpan(visit, 1000, now, storage);
  recordStudySpan(visit, 5000, now + 5000, storage);
  expect(readStudyTime(storage).records[0].durationMs).toBe(6000);
  expect(readStudyTime(storage).records).toHaveLength(1);
  expect(
    recordStudySpan(visit, 2000, now + 7000, {
      setItem() {
        throw new Error('quota');
      },
    }),
  ).toContain('memória');
  expect(readStudyTime(storage).records[0].durationMs).toBe(8000);
  recordStudySpan(visit, 1000, now + 8000, storage);
  expect(readStudyTime(storage).warning).toBe('');
  expect(readStudyTime(storage).records[0].durationMs).toBe(9000);
  values.set(STUDY_PREFIX + 'bad', '{}');
  expect(readStudyTime(storage).warning).toContain('inválidos');
  expect(readStudyTime(storage).records).toHaveLength(1);
});
