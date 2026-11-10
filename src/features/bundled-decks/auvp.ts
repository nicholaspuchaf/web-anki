import manifest from '../../content/decks/auvp-renda-fixa/deck.json' with { type: 'json' };
import catalog from '../../content/decks/auvp-renda-fixa/flashcards';
import source from '../../content/decks/auvp-renda-fixa/coverage.json' with { type: 'json' };
import type { Library } from '../library/model';
import { parseDeck } from '../decks/model';
import { mergeBundledDeck } from './merge';

export const AUVP_CARD_COUNT = catalog.lessons.reduce(
  (sum, lesson) => sum + lesson.cards.length,
  0,
);
export const AUVP_REVIEWED_AT = manifest.reviewedAt;
export function withBundledAuvpDeck(library: Library): Library {
  return mergeBundledDeck(
    library,
    parseDeck(manifest),
    catalog.lessons.flatMap((lesson) =>
      lesson.cards.map((entry) => {
        const id = `builtin-auvp-${entry.id}`;
        return {
          id,
          deckId: manifest.id,
          front: entry.question,
          back: '',
          tags: entry.tags,
          syncEnabled: false,
          faces: [
            { id: `${id}-answer`, title: 'Resposta', content: entry.answer },
            {
              id: `${id}-explanation`,
              title: 'Entenda o raciocínio',
              content: entry.explanation,
            },
            {
              id: `${id}-source`,
              title: 'Origem no material',
              content: `${lesson.title}\nPDF: ${source.file}\nPágina(s): ${entry.sourcePages.join(', ')}.`,
            },
          ],
        };
      }),
    ),
    { preservePersonalCards: true },
  );
}
