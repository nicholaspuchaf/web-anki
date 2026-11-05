export const MC714_DECK_ID = 'builtin-mc714';
export const AWS_DECK_ID = 'builtin-aws-services';
export const PATTERNS_DECK_ID = 'builtin-patterns-design';
const prefixes: Record<string, string> = {
  [MC714_DECK_ID]: 'builtin-mc714-',
  [AWS_DECK_ID]: 'builtin-aws-',
  [PATTERNS_DECK_ID]: 'builtin-patterns-',
};
export function ownsBundledId(deckId: string, id: string): boolean {
  return (
    Object.hasOwn(prefixes, deckId) &&
    (id === deckId || id.startsWith(prefixes[deckId]))
  );
}
export function isBundledId(id: string): boolean {
  return Object.keys(prefixes).some((deckId) => ownsBundledId(deckId, id));
}
