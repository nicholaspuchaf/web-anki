import { localDay } from '../review-history/model';
export type StudyRecord = {
  id: string;
  cardId: string;
  deckId: string;
  day: string;
  durationMs: number;
  lastStudiedAt: number;
  practice: boolean;
};
export function splitStudySpan(endedAt: number, durationMs: number) {
  const parts: { day: string; durationMs: number }[] = [];
  let start = endedAt - durationMs;
  while (start < endedAt) {
    const date = new Date(start);
    const midnight = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate() + 1,
    ).getTime();
    const end = Math.min(endedAt, midnight);
    parts.push({ day: localDay(start), durationMs: end - start });
    start = end;
  }
  return parts;
}
export function validStudyRecord(value: unknown): value is StudyRecord {
  if (!value || typeof value !== 'object') return false;
  const row = value as StudyRecord;
  return (
    typeof row.id === 'string' &&
    /^[\w-]{1,128}$/.test(row.id) &&
    typeof row.cardId === 'string' &&
    !!row.cardId &&
    typeof row.deckId === 'string' &&
    !!row.deckId &&
    typeof row.day === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(row.day) &&
    Number.isFinite(row.durationMs) &&
    row.durationMs > 0 &&
    Number.isFinite(row.lastStudiedAt) &&
    row.lastStudiedAt >= 0 &&
    Number.isFinite(new Date(row.lastStudiedAt).getTime()) &&
    localDay(new Date(`${row.day}T12:00:00`).getTime()) === row.day &&
    typeof row.practice === 'boolean'
  );
}
export function studyTimeSummary(
  records: StudyRecord[],
  now: number,
  deckId = '',
  selectedDay: string | null = null,
) {
  const today = new Date(now);
  const daily = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - 29 + index,
    );
    return {
      key: localDay(date.getTime()),
      label: date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      }),
      durationMs: 0,
    };
  });
  const days = new Map(daily.map((row) => [row.key, row]));
  const included = records.filter(
    (row) => (!deckId || row.deckId === deckId) && days.has(row.day),
  );
  for (const row of included) days.get(row.day)!.durationMs += row.durationMs;
  const byCard = new Map<
    string,
    { cardId: string; deckId: string; durationMs: number; visits: Set<string> }
  >();
  for (const row of included) {
    if (selectedDay && row.day !== selectedDay) continue;
    const card = byCard.get(row.cardId) ?? {
      cardId: row.cardId,
      deckId: row.deckId,
      durationMs: 0,
      visits: new Set<string>(),
    };
    card.durationMs += row.durationMs;
    card.visits.add(row.id);
    byCard.set(row.cardId, card);
  }
  const cards = [...byCard.values()]
    .map((row) => ({
      ...row,
      visits: row.visits.size,
      averageMs: row.durationMs / row.visits.size,
    }))
    .sort(
      (a, b) => b.durationMs - a.durationMs || a.cardId.localeCompare(b.cardId),
    );
  const totalMs = included.reduce((sum, row) => sum + row.durationMs, 0);
  const visits = new Set(included.map((row) => row.id)).size;
  return {
    daily,
    cards,
    totalMs,
    visits,
    averageMs: visits ? totalMs / visits : 0,
  };
}
