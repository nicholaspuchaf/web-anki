import type { LeetCode } from '../leetcode/model';
export type Deck = { id: string; name: string };
export type Card = {
  id: string;
  deckId: string;
  front: string;
  back: string;
  due: number;
  interval: number;
  reviews: number;
  leetcode?: LeetCode;
  favorite?: boolean;
};
export type Library = { version: 1; decks: Deck[]; cards: Card[] };
export const emptyLibrary: Library = { version: 1, decks: [], cards: [] };
