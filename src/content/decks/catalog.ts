import aws from './aws/deck.json' with { type: 'json' };
import patterns from './design-patterns/deck.json' with { type: 'json' };
import learning from './learning/deck.json' with { type: 'json' };
import { parseDeck } from '../../features/decks/model';

/** Resource folders are open to future learning formats; identity stays on Deck. */
export const bundledDeckDefinitions = [aws, patterns, learning].map(
  (manifest) => ({
    deck: parseDeck(manifest),
    content: manifest.content as Record<string, string[]>,
  }),
);
