import { validSpacing } from '../settings/study-plan';
import { deckTagPolicy, enforceDeckTags } from '../decks/tag-policy';
import { parseStudyImage } from '../standard/image';
import { parseLeetCode } from '../leetcode/model';
import { isCardTemplate, type Library } from '../library/model';
import { parseStudyFaces } from '../standard/model';
import { safeProblemUrl } from '../leetcode/model';
import { parseMultipleChoice } from '../multiple-choice/model';

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
      !d.name.trim() ||
      (d.defaultTemplate !== undefined && !isCardTemplate(d.defaultTemplate)) ||
      (d.syncEnabled !== undefined && typeof d.syncEnabled !== 'boolean')
    )
      throw new Error('Baralho inválido ou duplicado.');
    ids.add(d.id);
    return {
      id: d.id,
      name: d.name.trim(),
      ...(d.syncEnabled !== undefined ? { syncEnabled: d.syncEnabled } : {}),
      ...(d.defaultTemplate !== undefined
        ? { defaultTemplate: d.defaultTemplate }
        : {}),
    };
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
      (c.syncEnabled !== undefined && typeof c.syncEnabled !== 'boolean') ||
      (c.tags !== undefined &&
        (!Array.isArray(c.tags) ||
          c.tags.some((tag) => typeof tag !== 'string' || !tag.trim()))) ||
      (c.sourceUrl !== undefined &&
        (typeof c.sourceUrl !== 'string' || !safeProblemUrl(c.sourceUrl))) ||
      !Number.isFinite(c.due) ||
      c.due < 0 ||
      !Number.isFinite(c.interval) ||
      c.interval < 0 ||
      (c.spacingMultiplier !== undefined &&
        !validSpacing(c.spacingMultiplier)) ||
      !Number.isSafeInteger(c.reviews) ||
      c.reviews < 0
    )
      throw new Error('Cartão inválido ou sem baralho.');
    cardIds.add(c.id);
    if (
      [c.leetcode, c.multipleChoice, c.faces].filter(
        (value) => value !== undefined,
      ).length > 1
    )
      throw new Error('O cartão deve usar apenas um template.');
    const multipleChoice =
      c.multipleChoice !== undefined
        ? parseMultipleChoice(c.multipleChoice)
        : undefined;
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
      ...(c.frontImage !== undefined
        ? { frontImage: parseStudyImage(c.frontImage) }
        : {}),
      back: c.back,
      due: c.due,
      interval: c.interval,
      ...(c.spacingMultiplier !== undefined
        ? { spacingMultiplier: c.spacingMultiplier }
        : {}),
      reviews: c.reviews,
      ...(c.favorite !== undefined ? { favorite: c.favorite } : {}),
      ...(leetcode ? { leetcode } : {}),
      ...(multipleChoice ? { multipleChoice } : {}),
      ...(c.faces !== undefined ? { faces: parseStudyFaces(c.faces) } : {}),
      ...(c.tags !== undefined || deckTagPolicy(c.deckId)
        ? {
            tags: enforceDeckTags(
              c.deckId,
              deckTagPolicy(c.deckId)
                ? [...(c.tags ?? []), ...(leetcode?.tags ?? [])]
                : (c.tags ?? []),
            ),
          }
        : {}),
      ...(c.sourceUrl !== undefined ? { sourceUrl: c.sourceUrl } : {}),
      ...(c.syncEnabled !== undefined ? { syncEnabled: c.syncEnabled } : {}),
    };
  });
  return { version: 1, decks, cards };
}
