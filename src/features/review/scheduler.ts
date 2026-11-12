import { validSpacing } from '../settings/study-plan';
import type { Card } from '../library/model';
export type Rating = 'again' | 'hard' | 'good' | 'easy';
const DAY = 86_400_000;

// Simple interval scheduler, independent from Anki's FSRS algorithm.
export function schedule(
  card: Card,
  rating: Rating,
  now = Date.now(),
  spacingMultiplier = 1,
): Card {
  if (!validSpacing(spacingMultiplier))
    throw new Error('Espaçamento inválido.');
  const baseInterval = card.interval / (card.spacingMultiplier ?? 1);
  const interval =
    rating === 'again'
      ? 0
      : rating === 'hard'
        ? Math.max(1, baseInterval * 1.2)
        : rating === 'good'
          ? Math.max(1, baseInterval * 2.5)
          : Math.max(4, baseInterval * 3.5);
  return {
    ...card,
    interval: interval * spacingMultiplier,
    ...(spacingMultiplier !== 1 || card.spacingMultiplier !== undefined
      ? { spacingMultiplier }
      : {}),
    reviews: card.reviews + 1,
    due:
      now +
      (rating === 'again'
        ? 60_000
        : Math.round(interval * spacingMultiplier * DAY)),
  };
}
