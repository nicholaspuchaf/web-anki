export const AWS_DECK_ID = 'builtin-aws-services';
export function isBundledId(id: string): boolean {
  return id === AWS_DECK_ID || id.startsWith('builtin-aws-');
}
