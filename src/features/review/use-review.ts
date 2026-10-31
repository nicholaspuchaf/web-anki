import { getDueCards, getDeckCards } from '../library/selectors';
import { useState } from 'react';
import type { Library } from '../library/model';
import type { SaveLibrary } from '../library/hooks/use-library';
import { schedule, type Rating } from './scheduler';

export function useReview(library: Library, save: SaveLibrary) {
  const [practice, setPractice] = useState(false);
  const [queue, setQueue] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const current = library.cards.find((c) => c.id === queue[0]);

  function begin(
    deckId?: string,
    options?: { ids?: string[]; practice?: boolean },
  ) {
    const candidates = deckId ? getDeckCards(library, deckId) : library.cards;
    const filtered = options?.ids
      ? candidates.filter((c) => options.ids!.includes(c.id))
      : candidates;
    setQueue(
      (options?.practice ? filtered : getDueCards(filtered, Date.now())).map(
        (c) => c.id,
      ),
    );
    setPractice(options?.practice ?? false);
    setReviewed(0);
    setRevealed(false);
  }
  async function rate(rating: Rating) {
    if (!current) return;
    if (
      practice ||
      (await save({
        ...library,
        cards: library.cards.map((c) =>
          c.id === current.id ? schedule(c, rating) : c,
        ),
      }))
    ) {
      setQueue((q) => q.slice(1));
      setRevealed(false);
      setReviewed((n) => n + 1);
    }
  }
  return {
    practice,
    current,
    remaining: queue.length,
    revealed,
    reviewed,
    begin,
    rate,
    reveal: () => setRevealed(true),
  };
}
export type ReviewSession = ReturnType<typeof useReview>;
