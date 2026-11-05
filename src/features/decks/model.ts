/** A deck groups learning resources. New resource kinds reference this same ID. */
export type CardTemplate =
  'basic' | 'leetcode' | 'multiple-choice' | 'multi-face';
export type Deck = {
  id: string;
  name: string;
  defaultTemplate?: CardTemplate;
  syncEnabled?: boolean;
};
export function isCardTemplate(value: unknown): value is CardTemplate {
  return (
    value === 'basic' ||
    value === 'leetcode' ||
    value === 'multiple-choice' ||
    value === 'multi-face'
  );
}
export function parseDeck(value: unknown): Deck {
  if (!value || typeof value !== 'object') throw new Error('Baralho inválido.');
  const d = value as Record<string, unknown>;
  if (
    typeof d.id !== 'string' ||
    !/^[a-zA-Z0-9_-]{1,160}$/.test(d.id) ||
    typeof d.name !== 'string' ||
    !d.name.trim() ||
    d.name.length > 500 ||
    (d.defaultTemplate !== undefined && !isCardTemplate(d.defaultTemplate)) ||
    (d.syncEnabled !== undefined && typeof d.syncEnabled !== 'boolean')
  )
    throw new Error('Baralho inválido.');
  return {
    id: d.id,
    name: d.name.trim(),
    ...(d.defaultTemplate !== undefined
      ? { defaultTemplate: d.defaultTemplate as CardTemplate }
      : {}),
    ...(d.syncEnabled !== undefined
      ? { syncEnabled: d.syncEnabled as boolean }
      : {}),
  };
}
