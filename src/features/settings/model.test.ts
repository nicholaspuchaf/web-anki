import { expect, test } from 'bun:test';
import { activeFeed, activeLibrary, parseDisabledDecks } from './model';
import { withBundledDecks } from '../bundled-decks/catalog';
import { emptyLibrary } from '../library/model';
import { withPatternCarousels } from '../feed/pattern-catalog';
import { emptyFeed } from '../feed/model';

test('preferências inválidas não desativam baralhos pessoais nem duplicam IDs', () => {
  for (const raw of [null, '{', '{}', 'true'])
    expect(parseDisabledDecks(raw)).toEqual([]);
  expect(
    parseDisabledDecks(
      '["builtin-patterns-design", "personal", null, 1, "builtin-patterns-design"]',
    ),
  ).toEqual(['builtin-patterns-design']);
});

test('ocultar e reativar formatos mantém os objetos completos e o progresso de origem', () => {
  const library = withBundledDecks(emptyLibrary);
  const personal = { id: 'personal', name: 'Meu baralho' };
  library.decks.push(personal);
  Object.assign(library.cards[0], {
    reviews: 12,
    interval: 7,
    due: 1000,
    favorite: true,
  });
  const feed = withPatternCarousels(structuredClone(emptyFeed));
  feed.progress.push({
    carouselId: feed.carousels[0].id,
    contentRevision: feed.carousels[0].revision,
    seenSlideIds: [feed.carousels[0].slides[0].id],
    completedAt: 100,
    nextDueAt: 1000,
    completions: 3,
  });
  const before = structuredClone({ library, feed });
  const disabled = [
    'builtin-patterns-design',
    'builtin-aws-services',
    'personal',
  ];
  const active = activeLibrary(library, disabled);
  expect(active.decks).toContainEqual(personal);
  expect(active.cards.some((card) => disabled.includes(card.deckId))).toBe(
    false,
  );
  expect(activeFeed(feed, disabled).carousels).toHaveLength(0);
  expect({ library, feed }).toEqual(before);
  expect(activeLibrary(library, [])).toEqual(library);
  expect(activeFeed(feed, [])).toEqual(feed);
});
