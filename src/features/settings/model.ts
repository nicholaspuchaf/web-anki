import { bundledDeckDefinitions } from '../../content/decks/catalog';
import type { Library } from '../library/model';
import { carouselDeckId } from '../feed/decks';
import type { FeedData } from '../feed/model';

export const SETTINGS_KEY = 'folha:settings:v1';
const bundledIds = new Set(bundledDeckDefinitions.map(({ deck }) => deck.id));

export function parseDisabledDecks(raw: string | null): string[] {
  try {
    const value: unknown = JSON.parse(raw ?? '[]');
    return Array.isArray(value)
      ? [
          ...new Set(
            value.filter(
              (id): id is string =>
                typeof id === 'string' && bundledIds.has(id),
            ),
          ),
        ]
      : [];
  } catch {
    return [];
  }
}

export function activeLibrary(
  library: Library,
  disabled: readonly string[],
): Library {
  const excluded = new Set(disabled.filter((id) => bundledIds.has(id)));
  return {
    ...library,
    decks: library.decks.filter((deck) => !excluded.has(deck.id)),
    cards: library.cards.filter((card) => !excluded.has(card.deckId)),
  };
}

export function activeFeed(
  data: FeedData,
  disabled: readonly string[],
): FeedData {
  const excluded = new Set(disabled.filter((id) => bundledIds.has(id)));
  const carousels = data.carousels.filter(
    (carousel) => !excluded.has(carouselDeckId(carousel)),
  );
  const ids = new Set(carousels.map((carousel) => carousel.id));
  return {
    ...data,
    decks: data.decks?.filter((deck) => !excluded.has(deck.id)),
    carousels,
    progress: data.progress.filter((progress) => ids.has(progress.carouselId)),
  };
}
