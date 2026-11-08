import type { Card, Library } from '../library/model';
import type { Rating } from '../review/scheduler';

export type ReviewEvent = {
  id: string;
  cardId: string;
  deckId: string;
  reviewedAt: number;
  reviewNumber: number;
  rating: Rating;
  intervalBefore: number;
  intervalAfter: number;
};
export type HistoryMeta = {
  version: 1;
  undated: Record<string, { deckId: string; count: number }>;
  totals: Record<string, number>;
  decks: Record<string, string>;
};
export type ReviewHistory = {
  meta: HistoryMeta;
  events: ReviewEvent[];
  warning?: string;
};
export function emptyHistory(): HistoryMeta {
  return {
    version: 1,
    undated: Object.create(null),
    totals: Object.create(null),
    decks: Object.create(null),
  };
}

export function historyAfterSave(
  stored: HistoryMeta | undefined,
  current: Library,
  next: Library,
  event?: ReviewEvent,
): HistoryMeta {
  if (stored && stored.version !== 1)
    throw new Error('Versão do histórico de revisões não reconhecida.');
  if (event) {
    const before = current.cards.find((c) => c.id === event.cardId);
    const after = next.cards.find((c) => c.id === event.cardId);
    if (
      !before ||
      !after ||
      after.reviews !== before.reviews + 1 ||
      event.reviewNumber !== after.reviews ||
      event.deckId !== after.deckId ||
      !event.id ||
      !Number.isFinite(event.reviewedAt) ||
      event.reviewedAt < 0 ||
      !['again', 'hard', 'good', 'easy'].includes(event.rating) ||
      event.intervalBefore !== before.interval ||
      event.intervalAfter !== after.interval
    )
      throw new Error(
        'Registro de revisão incompatível com o progresso salvo.',
      );
  }
  const meta: HistoryMeta = {
    version: 1,
    undated: Object.assign(Object.create(null), stored?.undated),
    totals: Object.assign(Object.create(null), stored?.totals),
    decks: Object.assign(Object.create(null), stored?.decks),
  };
  for (const deck of [...current.decks, ...next.decks])
    meta.decks[deck.id] = deck.name;
  function recover(card: Card, count: number) {
    const known = meta.totals[card.id] ?? 0;
    if (count <= known) return;
    const previous = meta.undated[card.id];
    meta.undated[card.id] = {
      deckId: previous?.deckId ?? card.deckId,
      count: (previous?.count ?? 0) + count - known,
    };
    meta.totals[card.id] = count;
  }
  for (const card of current.cards) recover(card, card.reviews);
  for (const card of next.cards)
    recover(card, card.reviews - (event?.cardId === card.id ? 1 : 0));
  if (event) meta.totals[event.cardId] = (meta.totals[event.cardId] ?? 0) + 1;
  return meta;
}
export function newReviewEvent(
  before: Card,
  after: Card,
  rating: Rating,
  now: number,
): ReviewEvent {
  return {
    id: crypto.randomUUID(),
    cardId: before.id,
    deckId: after.deckId,
    reviewedAt: now,
    reviewNumber: after.reviews,
    rating,
    intervalBefore: before.interval,
    intervalAfter: after.interval,
  };
}
export function localDay(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export type DailyActivity = {
  key: string;
  label: string;
  cards: number;
  reviews: number;
  undated?: boolean;
};
export function dailyActivity(
  history: ReviewHistory,
  now: number,
  deckId = '',
): DailyActivity[] {
  const old = Object.entries(history.meta.undated).filter(
    ([, value]) => !deckId || value.deckId === deckId,
  );
  const result: DailyActivity[] = [
    {
      key: 'undated',
      label: 'Sem data',
      cards: old.filter(([, v]) => v.count > 0).length,
      reviews: old.reduce((sum, [, v]) => sum + v.count, 0),
      undated: true,
    },
  ];
  const days = new Map<string, { row: DailyActivity; seen: Set<string> }>();
  for (let offset = 29; offset >= 0; offset--) {
    const date = new Date(now);
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    const key = localDay(date.getTime());
    const row = {
      key,
      label: `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`,
      cards: 0,
      reviews: 0,
    };
    days.set(key, { row, seen: new Set() });
    result.push(row);
  }
  for (const event of history.events) {
    if (deckId && event.deckId !== deckId) continue;
    const day = days.get(localDay(event.reviewedAt));
    if (!day) continue;
    day.row.reviews++;
    day.seen.add(event.cardId);
    day.row.cards = day.seen.size;
  }
  return result;
}
export type IntervalStage = { key: string; label: string; count: number };
export function intervalStages(cards: Card[]): IntervalStage[] {
  const days = new Map<number, number>(
    [1, 3, 5, 7, 14, 30, 60, 90, 180, 365].map((day) => [day, 0]),
  );
  let fresh = 0,
    short = 0;
  for (const card of cards) {
    if (!card.reviews) {
      fresh++;
      continue;
    }
    if (card.interval < 1) {
      short++;
      continue;
    }
    const interval = Math.round(card.interval);
    days.set(interval, (days.get(interval) ?? 0) + 1);
  }
  return [
    { key: 'new', label: 'Novos', count: fresh },
    { key: 'short', label: '<1 dia', count: short },
    ...[...days]
      .sort(([a], [b]) => a - b)
      .map(([day, count]) => ({
        key: String(day),
        label: `${day} ${day === 1 ? 'dia' : 'dias'}`,
        count,
      })),
  ];
}
