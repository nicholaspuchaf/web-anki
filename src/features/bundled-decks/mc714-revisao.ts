import manifest from '../../content/decks/mc714-revisao/deck.json' with { type: 'json' };
import catalog from '../../content/decks/mc714-revisao/flashcards';
import type { Library } from '../library/model';
import { parseDeck } from '../decks/model';
import { mergeBundledDeck } from './merge';

export const MC714_REVISAO_REVIEWED_AT = manifest.reviewedAt;
export function withBundledMc714RevisaoDeck(library: Library): Library {
  return mergeBundledDeck(
    library,
    parseDeck(manifest),
    catalog.cards.map((entry) => {
      const id = `builtin-sd-mc714-${entry.id}`;
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
        ],
      };
    }),
    { preservePersonalCards: true },
  );
}
