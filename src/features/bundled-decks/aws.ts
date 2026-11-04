import catalog from '../../content/aws-services.json';
import type { Library } from '../library/model';
import { mergeBundledDeck } from './merge';
import { AWS_DECK_ID } from './ids';

export const AWS_CATALOG_REVIEWED_AT = catalog.reviewedAt;
export const AWS_CARD_COUNT = catalog.cards.length;
export function withBundledAwsDeck(library: Library): Library {
  const cards = catalog.cards.map((entry) => {
    const id = `builtin-aws-${entry.id}`;
    return {
      id,
      deckId: AWS_DECK_ID,
      front: entry.name,
      back: '',
      faces: [
        { id: `${id}-definition`, title: 'O que é', content: entry.definition },
        {
          id: `${id}-application`,
          title: 'Quando usar',
          content: [entry.useCase, entry.availability]
            .filter(Boolean)
            .join('\n\n'),
        },
        {
          id: `${id}-intermediate`,
          title: 'Visão de pleno',
          content: entry.intermediateComment,
        },
        {
          id: `${id}-senior`,
          title: 'Visão de sênior',
          content: entry.seniorComment,
        },
      ],
      tags: [
        'aws',
        entry.category.toLocaleLowerCase(),
        ...(entry.availability ? ['verificar disponibilidade'] : []),
      ],
      sourceUrl: entry.sourceUrl,
      syncEnabled: false,
    };
  });
  return mergeBundledDeck(
    library,
    {
      id: AWS_DECK_ID,
      name: catalog.name,
      defaultTemplate: 'multi-face',
    },
    cards,
  );
}
