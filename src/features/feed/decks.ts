import { bundledDeckDefinitions } from '../../content/decks/catalog';
import type { Deck } from '../decks/model';
import type { Carousel, FeedData } from './model';
import patterns from '../../content/decks/design-patterns/deck.json' with { type: 'json' };
import learning from '../../content/decks/learning/deck.json' with { type: 'json' };
import { parseDeck } from '../decks/model';

export const GENERAL_DECK: Deck = parseDeck(learning);
export function carouselDeckId(
  carousel: Pick<Carousel, 'id' | 'deckId'>,
): string {
  return (
    carousel.deckId ??
    (carousel.id.startsWith('feed-pattern-') ? patterns.id : GENERAL_DECK.id)
  );
}
export function feedDecks(data: FeedData, library: Deck[] = []): Deck[] {
  const known = new Map<string, Deck>(
    [
      ...bundledDeckDefinitions.map(({ deck }) => deck),
      ...(data.decks ?? []),
      ...library,
    ].map((d) => [d.id, d]),
  );
  const ids = new Set([
    ...library.map((d) => d.id),
    ...data.carousels.map(carouselDeckId),
  ]);
  return [...ids].map(
    (id) => known.get(id) ?? { id, name: `Baralho ${id}`, syncEnabled: false },
  );
}
export function withCarouselDecks(data: FeedData): FeedData {
  return {
    ...data,
    decks: feedDecks(data),
    carousels: data.carousels.map((c) => ({ ...c, deckId: carouselDeckId(c) })),
  };
}
export function selectDeckFeed(data: FeedData, deckId: string): FeedData {
  if (!deckId) return data;
  const carousels = data.carousels.filter((c) => carouselDeckId(c) === deckId);
  const ids = new Set(carousels.map((c) => c.id));
  return {
    ...data,
    carousels,
    progress: data.progress.filter((p) => ids.has(p.carouselId)),
  };
}
