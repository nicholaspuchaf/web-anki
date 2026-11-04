import catalog from '../../content/design-patterns.json';
import illustrations from '../../content/design-pattern-assets.json';
import type { Library } from '../library/model';
import type { StudyFace } from '../standard/model';
import { PATTERNS_DECK_ID } from './ids';
import { mergeBundledDeck } from './merge';

export const PATTERNS_CATALOG_REVIEWED_AT = catalog.reviewedAt;
export const PATTERNS_CARD_COUNT = catalog.patterns.reduce(
  (sum, pattern) => sum + pattern.cards.length,
  0,
);

export function withBundledPatternsDeck(library: Library): Library {
  const cards = catalog.patterns.flatMap((pattern) =>
    pattern.cards.map((entry) => {
      const id = `builtin-patterns-${pattern.id}-${entry.id}`;
      const diagram = {
        src: `/study-assets/design-patterns/${pattern.id}-roles.svg`,
        alt: `Papéis do padrão ${pattern.name}`,
        caption: 'Explique a responsabilidade de cada participante.',
        credit: 'Mapa autoral · Folha',
      };
      const official = illustrations.find(
        (image) => image.pattern === pattern.id,
      );
      const faces: StudyFace[] = [
        { id: `${id}-answer`, title: 'Resposta', content: entry.answer },
      ];
      if (entry.id === 'estrutura' && official)
        faces.push({
          id: `${id}-illustration`,
          title: 'Estrutura ilustrada',
          content: '',
          image: official,
        });
      return {
        id,
        deckId: PATTERNS_DECK_ID,
        front: `${pattern.name} · ${entry.question}`,
        ...(entry.id === 'estrutura' ? { frontImage: diagram } : {}),
        back: '',
        faces,
        tags: [
          'design patterns',
          pattern.category.toLocaleLowerCase(),
          pattern.id,
          entry.id,
        ],
        sourceUrl: pattern.sourceUrl,
        syncEnabled: false,
      };
    }),
  );
  return mergeBundledDeck(
    library,
    {
      id: PATTERNS_DECK_ID,
      name: catalog.name,
      defaultTemplate: 'multi-face',
    },
    cards,
  );
}
