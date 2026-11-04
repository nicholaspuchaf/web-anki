import catalog from '../../content/aws-services.json';
import type { Card, Library } from '../library/model';
import { parseBackup } from '../backup/parse-backup';
import { AWS_DECK_ID, isBundledId } from './ids';

export const AWS_CATALOG_REVIEWED_AT = catalog.reviewedAt;
export const AWS_CARD_COUNT = catalog.cards.length;
export function withBundledAwsDeck(library: Library): Library {
  const previous = new Map(library.cards.map((card) => [card.id, card]));
  const cards: Card[] = catalog.cards.map((entry) => {
    const id = `builtin-aws-${entry.id}`;
    const old = previous.get(id);
    return {
      id,
      deckId: AWS_DECK_ID,
      front: entry.name,
      back: '',
      due: old?.due ?? 0,
      interval: old?.interval ?? 0,
      reviews: old?.reviews ?? 0,
      ...(old?.favorite !== undefined ? { favorite: old.favorite } : {}),
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
  const deck = {
    id: AWS_DECK_ID,
    name: catalog.name,
    defaultTemplate: 'multi-face',
    syncEnabled: false,
  };
  const decks = library.decks.some((item) => item.id === AWS_DECK_ID)
    ? library.decks.map((item) => (item.id === AWS_DECK_ID ? deck : item))
    : [...library.decks, deck];
  return parseBackup(
    JSON.stringify({
      version: 1,
      decks,
      cards: [
        ...library.cards.filter((card) => !isBundledId(card.id)),
        ...cards,
      ],
    }),
  );
}
