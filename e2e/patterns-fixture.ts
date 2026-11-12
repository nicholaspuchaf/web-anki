import catalog from '../src/content/decks/design-patterns/flashcards';

export const patternCardCount = catalog.patterns.reduce(
  (sum, pattern) => sum + pattern.cards.length,
  0,
);
export const patternStructureQuestion = catalog.patterns[0].cards.find(
  (card) => card.id === 'estrutura',
)!.question;
export const patternProblemQuestion = catalog.patterns[0].cards.find(
  (card) => card.id === 'problema',
)!.question;
