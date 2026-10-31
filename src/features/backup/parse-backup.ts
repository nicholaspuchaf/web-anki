import { parseLeetCode } from '../leetcode/model';
import type { Library } from '../library/model';

export function parseBackup(text: string): Library {
  const data: unknown = JSON.parse(text);
  if (!data || typeof data !== 'object') throw new Error('Backup inválido.');
  const value = data as Library;
  if (
    value.version !== 1 ||
    !Array.isArray(value.decks) ||
    !Array.isArray(value.cards)
  )
    throw new Error('Formato de backup incompatível.');
  const ids = new Set<string>();
  const decks = value.decks.map((d) => {
    if (
      !d ||
      typeof d.id !== 'string' ||
      !d.id ||
      ids.has(d.id) ||
      typeof d.name !== 'string' ||
      !d.name.trim()
    )
      throw new Error('Baralho inválido ou duplicado.');
    ids.add(d.id);
    return { id: d.id, name: d.name.trim() };
  });
  const cardIds = new Set<string>();
  const cards = value.cards.map((c) => {
    if (
      !c ||
      typeof c.id !== 'string' ||
      !c.id ||
      cardIds.has(c.id) ||
      !ids.has(c.deckId) ||
      typeof c.front !== 'string' ||
      !c.front.trim() ||
      typeof c.back !== 'string' ||
      (c.favorite !== undefined && typeof c.favorite !== 'boolean') ||
      !Number.isFinite(c.due) ||
      c.due < 0 ||
      !Number.isFinite(c.interval) ||
      c.interval < 0 ||
      !Number.isSafeInteger(c.reviews) ||
      c.reviews < 0
    )
      throw new Error('Cartão inválido ou sem baralho.');
    cardIds.add(c.id);
    const leetcode =
      c.leetcode !== undefined ? parseLeetCode(c.leetcode) : undefined;
    const legacyExamples = (
      c.leetcode as unknown as Record<string, unknown> | undefined
    )?.examples;
    const front =
      typeof legacyExamples === 'string' && legacyExamples.trim()
        ? `${c.front}\n\nExemplos:\n${legacyExamples}`
        : c.front;
    return {
      id: c.id,
      deckId: c.deckId,
      front,
      back: c.back,
      due: c.due,
      interval: c.interval,
      reviews: c.reviews,
      ...(c.favorite !== undefined ? { favorite: c.favorite } : {}),
      ...(leetcode ? { leetcode } : {}),
    };
  });
  return { version: 1, decks, cards };
}
