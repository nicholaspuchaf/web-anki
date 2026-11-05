import { parseBackup } from '../backup/parse-backup';
import type { Card, Deck, Library } from '../library/model';
import { ownsBundledId } from './ids';

type BundledCard = Omit<Card, 'due' | 'interval' | 'reviews' | 'favorite'>;

export function mergeBundledDeck(
  library: Library,
  deck: Deck,
  content: BundledCard[],
  options: { preservePersonalCards?: boolean } = {},
): Library {
  const previous = new Map(library.cards.map((card) => [card.id, card]));
  const cards: Card[] = content.map((card) => {
    const old = previous.get(card.id);
    return {
      ...card,
      syncEnabled: false,
      due: old?.due ?? 0,
      interval: old?.interval ?? 0,
      reviews: old?.reviews ?? 0,
      ...(old?.favorite !== undefined ? { favorite: old.favorite } : {}),
    };
  });
  const localDeck = { ...deck, syncEnabled: false };
  return parseBackup(
    JSON.stringify({
      version: 1,
      decks: library.decks.some((item) => item.id === deck.id)
        ? library.decks.map((item) => (item.id === deck.id ? localDeck : item))
        : [...library.decks, localDeck],
      cards: [
        ...library.cards.filter(
          (card) =>
            !ownsBundledId(deck.id, card.id) &&
            (options.preservePersonalCards || card.deckId !== deck.id),
        ),
        ...cards,
      ],
    }),
  );
}
