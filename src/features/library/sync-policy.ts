import type { Card, Deck, Library } from './model';
import { isBundledId } from '../bundled-decks/ids';
export type SyncCandidate = {
  flashcard_id: string;
  deleted_at: string | null;
  card?: Card;
  deck?: Deck;
};
export function canSyncCard(
  library: Library,
  id: string,
  known?: SyncCandidate,
): boolean {
  if (isBundledId(id)) return false;
  const card = library.cards.find((card) => card.id === id) ?? known?.card;
  const deck =
    library.decks.find((deck) => deck.id === card?.deckId) ?? known?.deck;
  return (
    card?.syncEnabled !== false &&
    deck?.syncEnabled !== false &&
    (!card || !isBundledId(card.deckId)) &&
    (!known?.deck || known.deck.syncEnabled !== false) &&
    known?.card?.syncEnabled !== false &&
    (!known?.card || !isBundledId(known.card.deckId))
  );
}
