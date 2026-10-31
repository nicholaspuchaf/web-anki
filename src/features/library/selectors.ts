import type { Card, Library } from './model';

export function getDeckCards(library: Library, deckId: string): Card[] {
  return library.cards.filter((card) => card.deckId === deckId);
}

export function getDueCards(cards: Card[], now: number): Card[] {
  return cards.filter((card) => card.due <= now).sort((a, b) => a.due - b.due);
}
