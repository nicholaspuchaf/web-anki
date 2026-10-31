import { parseLeetCode } from '../leetcode/model';
import type { Card, Library } from './model';

export function addDeck(
  library: Library,
  name: string,
  id: string = crypto.randomUUID(),
): Library {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Informe o nome do baralho.');
  return { ...library, decks: [...library.decks, { id, name: trimmed }] };
}

export function removeDeck(library: Library, id: string): Library {
  return {
    ...library,
    decks: library.decks.filter((d) => d.id !== id),
    cards: library.cards.filter((c) => c.deckId !== id),
  };
}

export function putCard(library: Library, card: Card): Library {
  if (!library.decks.some((d) => d.id === card.deckId))
    throw new Error('Baralho não encontrado.');
  if (!card.front.trim()) throw new Error('Preencha a pergunta.');
  const next = {
    ...card,
    front: card.front.trim(),
    back: card.back.trim(),
    ...(card.leetcode ? { leetcode: parseLeetCode(card.leetcode) } : {}),
  };
  return {
    ...library,
    cards: library.cards.some((c) => c.id === card.id)
      ? library.cards.map((c) => (c.id === card.id ? next : c))
      : [...library.cards, next],
  };
}

export function removeCard(library: Library, id: string): Library {
  return { ...library, cards: library.cards.filter((c) => c.id !== id) };
}
