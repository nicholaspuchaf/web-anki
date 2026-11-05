import { expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { bundledDeckDefinitions } from './catalog';
import aws from './aws/flashcards';
import patterns from './design-patterns/flashcards';
import carousels from './design-patterns/carousels';
import {
  AWS_DECK_ID,
  PATTERNS_DECK_ID,
} from '../../features/bundled-decks/ids';

test('pastas de baralho compõem múltiplos arquivos e mantêm IDs e conteúdo', () => {
  expect(bundledDeckDefinitions.map((d) => d.deck.id)).toEqual([
    AWS_DECK_ID,
    PATTERNS_DECK_ID,
    'local-learning',
  ]);
  for (const [index, slug] of ['aws', 'design-patterns'].entries()) {
    const manifest = bundledDeckDefinitions[index];
    for (const [kind, files] of Object.entries(manifest.content)) {
      expect(existsSync(`src/content/decks/${slug}/${kind}`)).toBe(true);
      for (const path of files) {
        expect(path.startsWith(`${kind}/`)).toBe(true);
        expect(() =>
          JSON.parse(readFileSync(`src/content/decks/${slug}/${path}`, 'utf8')),
        ).not.toThrow();
      }
    }
    expect(manifest.content.flashcards.length).toBeGreaterThan(1);
  }
  expect(aws.cards).toHaveLength(326);
  expect(patterns.patterns.flatMap((p) => p.cards)).toHaveLength(176);
  expect(carousels.carousels).toHaveLength(22);
  expect(carousels.carousels.every((c) => c.deckId === PATTERNS_DECK_ID)).toBe(
    true,
  );
  const files = bundledDeckDefinitions[1].content.carousels;
  const source = files.flatMap(
    (path) =>
      JSON.parse(
        readFileSync(`src/content/decks/design-patterns/${path}`, 'utf8'),
      ).carousels,
  );
  expect(carousels.carousels).toEqual(
    source.sort(
      (a: { id: string }, b: { id: string }) =>
        carousels.carousels.findIndex((c) => c.id === a.id) -
        carousels.carousels.findIndex((c) => c.id === b.id),
    ),
  );
});
