import type { LeetCode } from '../leetcode/model';
import type { MultipleChoice } from '../multiple-choice/model';
export type CardTemplate = 'basic' | 'leetcode' | 'multiple-choice';
export type Deck = { id: string; name: string; defaultTemplate?: CardTemplate };
export function isCardTemplate(value: unknown): value is CardTemplate {
  return (
    value === 'basic' || value === 'leetcode' || value === 'multiple-choice'
  );
}
export type Card = {
  id: string;
  deckId: string;
  front: string;
  back: string;
  due: number;
  interval: number;
  reviews: number;
  leetcode?: LeetCode;
  multipleChoice?: MultipleChoice;
  favorite?: boolean;
};
export type Library = { version: 1; decks: Deck[]; cards: Card[] };
export const emptyLibrary: Library = { version: 1, decks: [], cards: [] };
