import catalog from '../../content/decks/design-patterns/carousels/index';
import { parseFeed, type FeedData } from './model';

export const PATTERN_FEED_INSTALLATION = 'catalog:design-patterns:v1';
export const patternFeed = parseFeed(catalog);

export function withPatternCarousels(data: FeedData): FeedData {
  const existing = new Set(data.carousels.map((carousel) => carousel.id));
  const additions = patternFeed.carousels.filter(
    (carousel) => !existing.has(carousel.id),
  );
  if (!additions.length) return data;
  return {
    ...data,
    carousels: [...data.carousels, ...structuredClone(additions)],
  };
}
