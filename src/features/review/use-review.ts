import { newReviewEvent } from '../review-history/model';
import { getDueCards, getDeckCards } from '../library/selectors';
import { useRef, useState } from 'react';
import type { Library } from '../library/model';
import type { SaveLibrary } from '../library/hooks/use-library';
import { schedule, type Rating } from './scheduler';

export function useReview(
  library: Library,
  save: SaveLibrary,
  disabledDecks: readonly string[] = [],
) {
  const ratingLock = useRef(false);
  const [practice, setPractice] = useState(false);
  const [queue, setQueue] = useState<string[]>([]);
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [choice, setChoice] = useState<{ id: string; correct: boolean } | null>(
    null,
  );
  const [reviewed, setReviewed] = useState(0);
  const activeIds = new Set(
    library.cards
      .filter((card) => !disabledDecks.includes(card.deckId))
      .map((card) => card.id),
  );
  const activeQueue = queue.filter((id) => activeIds.has(id));
  const current = library.cards.find((c) => c.id === activeQueue[0]);

  const revealed = !!current && revealedId === current.id;
  const choiceCorrect =
    choice?.id === current?.id ? (choice?.correct ?? null) : null;

  function begin(
    deckId?: string,
    options?: { ids?: string[]; practice?: boolean },
  ) {
    const candidates = (
      deckId ? getDeckCards(library, deckId) : library.cards
    ).filter((card) => activeIds.has(card.id));
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
    setRevealedId(null);
    setChoice(null);
  }
  async function rate(rating: Rating) {
    if (!current || ratingLock.current) return;
    if (current.multipleChoice) {
      if (!revealed || choiceCorrect === null) return;
      if (!practice && !choiceCorrect) rating = 'again';
    }
    ratingLock.current = true;
    try {
      const now = Date.now();
      const updated = practice ? current : schedule(current, rating, now);
      const saved =
        practice ||
        (await save(
          {
            ...library,
            cards: library.cards.map((c) =>
              c.id === current.id ? updated : c,
            ),
          },
          newReviewEvent(current, updated, rating, now),
        ));
      if (saved) {
        setQueue((q) => q.filter((id) => id !== current.id));
        setRevealedId(null);
        setChoice(null);
        setReviewed((n) => n + 1);
      }
    } finally {
      ratingLock.current = false;
    }
  }

  return {
    practice,
    current,
    remaining: activeQueue.length,
    revealed,
    choiceCorrect,
    answerChoice: (correct: boolean) => {
      if (!current) return;
      setChoice({ id: current.id, correct });
      setRevealedId(current.id);
    },
    reviewed,
    begin,
    rate,
    reveal: () => {
      if (current) setRevealedId(current.id);
    },
  };
}
export type ReviewSession = ReturnType<typeof useReview>;
