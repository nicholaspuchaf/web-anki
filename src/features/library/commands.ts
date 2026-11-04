import { parseLeetCode } from '../leetcode/model';
import {
  isCardTemplate,
  type Card,
  type CardTemplate,
  type Library,
} from './model';
import { parseMultipleChoice } from '../multiple-choice/model';

export function addDeck(
  library: Library,
  name: string,
  id: string = crypto.randomUUID(),
  defaultTemplate?: CardTemplate,
): Library {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Informe o nome do baralho.');
  if (defaultTemplate !== undefined && !isCardTemplate(defaultTemplate))
    throw new Error('Template de baralho inválido.');
  return {
    ...library,
    decks: [
      ...library.decks,
      { id, name: trimmed, ...(defaultTemplate ? { defaultTemplate } : {}) },
    ],
  };
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
  if (card.leetcode !== undefined && card.multipleChoice !== undefined)
    throw new Error('O cartão deve usar apenas um template.');
  const next = {
    ...card,
    front: card.front.trim(),
    back: card.back.trim(),
    ...(card.leetcode ? { leetcode: parseLeetCode(card.leetcode) } : {}),
    ...(card.multipleChoice
      ? { multipleChoice: parseMultipleChoice(card.multipleChoice) }
      : {}),
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
