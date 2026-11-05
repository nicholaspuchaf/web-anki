import { expect, test } from 'bun:test';
import {
  carouselDeckId,
  feedDecks,
  withCarouselDecks,
  selectDeckFeed,
  GENERAL_DECK,
} from './decks';
import { parseFeed } from './model';
import { sampleFeed } from './sample';
import { patternFeed } from './pattern-catalog';

test('organiza legado por baralho sem perder progresso, identidade ou conteúdo', () => {
  const old = parseFeed(sampleFeed);
  const source = {
    ...old,
    carousels: [...old.carousels, patternFeed.carousels[0]],
  };
  const next = withCarouselDecks(source);
  expect(next.carousels.map((c) => c.id)).toEqual(
    source.carousels.map((c) => c.id),
  );
  expect(next.progress).toEqual(source.progress);
  expect(carouselDeckId(next.carousels[0])).toBe(GENERAL_DECK.id);
  expect(carouselDeckId(next.carousels.at(-1)!)).toBe(
    'builtin-patterns-design',
  );
  expect(withCarouselDecks(next)).toEqual(next);
  expect(parseFeed(next)).toEqual(next);
});
test('filtra estudo sem misturar baralhos e compartilha metadados com flashcards', () => {
  const data = withCarouselDecks({
    ...parseFeed(sampleFeed),
    carousels: [...sampleFeed.carousels, patternFeed.carousels[0]],
  });
  const library = [
    { id: GENERAL_DECK.id, name: 'Meu assunto', syncEnabled: false },
  ];
  expect(
    feedDecks(data, library).find((d) => d.id === GENERAL_DECK.id)?.name,
  ).toBe('Meu assunto');
  expect(
    selectDeckFeed(data, 'builtin-patterns-design').carousels,
  ).toHaveLength(1);
  expect(selectDeckFeed(data, 'missing').carousels).toHaveLength(0);
  expect(selectDeckFeed(data, '')).toBe(data);
  // An empty backup snapshot must not recreate a deleted deck.
  expect(feedDecks({ ...data, carousels: [] })).toEqual([]);
});
test('backup preserva baralhos, rejeita duplicatas e referências ausentes', () => {
  const data = withCarouselDecks(parseFeed(sampleFeed));
  expect(parseFeed(JSON.parse(JSON.stringify(data)))).toEqual(data);
  expect(() => parseFeed({ ...data, decks: [] })).toThrow('Baralho');
  expect(() =>
    parseFeed({ ...data, decks: [...data.decks!, ...data.decks!] }),
  ).toThrow();
});
