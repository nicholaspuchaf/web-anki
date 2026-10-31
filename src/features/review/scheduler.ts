import type { Card } from '../library/model';
export type Rating = 'again' | 'hard' | 'good' | 'easy';
const DAY = 86_400_000;

// Simple interval scheduler, independent from Anki's FSRS algorithm.
export function schedule(card: Card, rating: Rating, now = Date.now()): Card {
  const interval =
    rating === 'again'
      ? 0
      : rating === 'hard'
        ? Math.max(1, card.interval * 1.2)
        : rating === 'good'
          ? Math.max(1, card.interval * 2.5)
          : Math.max(4, card.interval * 3.5);
  return {
    ...card,
    interval,
    reviews: card.reviews + 1,
    due: now + (rating === 'again' ? 60_000 : Math.round(interval * DAY)),
  };
}
