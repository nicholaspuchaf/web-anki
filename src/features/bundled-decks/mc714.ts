import manifest from '../../content/decks/mc714/deck.json' with { type: 'json' };
import catalog from '../../content/decks/mc714/flashcards';
import type { Library } from '../library/model';
import { parseDeck } from '../decks/model';
import { mergeBundledDeck } from './merge';

export function withBundledMc714Deck(library: Library): Library {
  return mergeBundledDeck(
    library,
    parseDeck(manifest),
    catalog.cards.map((entry) => {
      const id = `builtin-mc714-${entry.id}`;
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
            title: 'Por quê / atenção',
            content: entry.explanation,
          },
        ],
      };
    }),
    { preservePersonalCards: true },
  );
}
export const MC714_REVIEWED_AT = manifest.reviewedAt;
