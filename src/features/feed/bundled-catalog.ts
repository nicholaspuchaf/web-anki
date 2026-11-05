import mc714 from '../../content/decks/mc714/carousels';
import learning from '../../content/decks/learning/carousels';
import type { Deck } from '../decks/model';
import aws from '../../content/decks/aws/carousels';
import patterns from '../../content/decks/design-patterns/carousels';
import { bundledDeckDefinitions } from '../../content/decks/catalog';
import { parseFeed, type FeedData } from './model';
import { PATTERN_FEED_INSTALLATION } from './pattern-catalog';

type BundledCarouselDeck = {
  deck: Deck;
  data: FeedData;
  installation: string;
  legacyInstallation?: string;
  seedOnly?: boolean;
};
export const bundledCarouselDecks: BundledCarouselDeck[] = [
  { id: 'builtin-aws-services', source: aws },
  { id: 'builtin-patterns-design', source: patterns },
  { id: 'local-learning', source: learning },
  { id: 'builtin-mc714', source: mc714 },
].map(({ id, source }) => {
  const deck = bundledDeckDefinitions.find(
    (definition) => definition.deck.id === id,
  )!.deck;
  const data = parseFeed({
    ...source,
    decks: [deck],
    carousels: source.carousels.map((c) => ({ ...c, deckId: deck.id })),
  });
  return {
    deck,
    data,
    seedOnly: deck.id === 'local-learning',
    installation: `catalog:carousels:${deck.id}:v1`,
    legacyInstallation:
      deck.id === 'builtin-patterns-design'
        ? PATTERN_FEED_INSTALLATION
        : undefined,
  };
});
export function addBundledCarousels(
  current: FeedData,
  source: FeedData,
): FeedData {
  const ids = new Set(current.carousels.map((c) => c.id));
  return {
    ...current,
    carousels: [
      ...current.carousels,
      ...structuredClone(source.carousels.filter((c) => !ids.has(c.id))),
    ],
    decks: [
      ...(current.decks ?? []),
      ...(source.decks ?? []).filter(
        (d) => !current.decks?.some((old) => old.id === d.id),
      ),
    ],
  };
}
