import { parseBackup } from '../src/features/backup/parse-backup';
import type { Card, Deck } from '../src/features/library/model';

export const LIBRARY_ID = 'PUBLIC';
export const SYNC_INDEX = 'library-updated-at';
export const MAX_CARD_BYTES = 250_000;
export const SYNC_OVERLAP_MS = 120_000;
export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 50;
export type Flashcard = {
  flashcard_id: string;
  last_updated_at: string;
  version: number;
} & ({ deleted_at: null; card: Card; deck: Deck } | { deleted_at: string });
export type StoredFlashcard = Flashcard & {
  pk: string;
  library_id: typeof LIBRARY_ID;
};
export type PageKey = {
  pk: string;
  library_id: typeof LIBRARY_ID;
  last_updated_at: string;
};
export type ChangeQuery = {
  from: string;
  until: string;
  limit: number;
  after?: PageKey;
};
export interface FlashcardStore {
  get(id: string): Promise<StoredFlashcard | null>;
  put(item: StoredFlashcard, expectedVersion: number): Promise<boolean>;
  changes(query: ChangeQuery): Promise<{
    items: StoredFlashcard[];
    next?: PageKey;
  }>;
}
export function cardKey(id: string) {
  return `FLASHCARD#${id}`;
}
export function validId(id: unknown): id is string {
  return typeof id === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(id);
}
export function validTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const time = Date.parse(value);
  return (
    Number.isFinite(time) && time >= 0 && new Date(time).toISOString() === value
  );
}
export function parseCard(
  body: string,
  id: string,
): { card: Card; deck: Deck } {
  const value = JSON.parse(body);
  if (!value || typeof value !== 'object' || value.card?.id !== id)
    throw new Error('Identificador inválido.');
  const library = parseBackup(
    JSON.stringify({
      version: 1,
      cards: [value.card],
      decks: [value.deck],
    }),
  );
  if (!validId(library.decks[0].id)) throw new Error('Baralho inválido.');
  return { card: library.cards[0], deck: library.decks[0] };
}
export function publicCard(item: StoredFlashcard): Flashcard {
  const { pk: _pk, library_id: _library, ...card } = item;
  return card;
}
