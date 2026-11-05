import 'fake-indexeddb/auto';
import { expect, test } from 'bun:test';
import { sampleFeed } from './sample';
import {
  replaceFeed,
  loadFeed,
  markSlideRead,
  saveCarousel,
  deleteCarousel,
} from './repository';
import {
  readLibrary,
  writeLibrary,
} from '../../shared/storage/library-repository';
import { bootstrapLibrary } from '../bundled-decks/bootstrap';
import { GENERAL_DECK } from './decks';

test('baralho misto compartilha identidade e conserva progresso ao mover um carrossel', async () => {
  const previousLibrary = await readLibrary();
  const previousFeed = await loadFeed();
  await replaceFeed(sampleFeed);
  const source = (await loadFeed()).carousels[0];
  for (const slide of source.slides)
    await markSlideRead(source, slide.id, 1000);
  const before = (await loadFeed()).progress.find(
    (p) => p.carouselId === source.id,
  )!;
  const deck = {
    id: 'mixed-deck-test',
    name: 'Tema compartilhado',
    syncEnabled: false,
  };
  const card = {
    id: 'mixed-card-test',
    deckId: deck.id,
    front: 'Pergunta',
    back: 'Resposta',
    due: 0,
    interval: 0,
    reviews: 0,
  };
  const library = {
    ...previousLibrary,
    decks: [...previousLibrary.decks, deck],
    cards: [...previousLibrary.cards, card],
  };
  await writeLibrary(library, previousLibrary);
  const moved = await saveCarousel(
    { ...source, deckId: deck.id },
    source.revision,
    deck,
  );
  expect(moved.progress.find((p) => p.carouselId === source.id)).toEqual({
    ...before,
    contentRevision: source.revision + 1,
  });
  const boot = await bootstrapLibrary();
  expect(boot.decks.filter((d) => d.id === deck.id)).toHaveLength(1);
  expect(boot.cards.find((c) => c.id === card.id)).toEqual(card);
  expect(boot.decks.some((d) => d.id === GENERAL_DECK.id)).toBe(true);
  await expect(
    writeLibrary(
      {
        ...boot,
        decks: boot.decks.filter((d) => d.id !== deck.id),
        cards: boot.cards.filter((c) => c.deckId !== deck.id),
      },
      boot,
    ),
  ).rejects.toThrow('contém carrosséis');
  expect((await readLibrary()).cards.find((c) => c.id === card.id)).toEqual(
    card,
  );
  await deleteCarousel(source.id, source.revision + 1);
  await replaceFeed(previousFeed);
  const current = await readLibrary();
  // Restore test-owned mutations without deleting decks referenced by prior feed fixtures.
  await writeLibrary(
    {
      ...current,
      decks: current.decks.filter((d) => d.id !== deck.id),
      cards: current.cards.filter((c) => c.id !== card.id),
    },
    current,
  );
});

test('novos arquivos de um baralho instalam apenas recursos novos e não ressuscitam exclusões', async () => {
  const { bundledCarouselDecks } = await import('./bundled-catalog');
  const original = await loadFeed();
  const deck = {
    id: 'repository-evolving',
    name: 'Baralho em expansão',
    syncEnabled: false,
  };
  const first = {
    ...structuredClone(sampleFeed.carousels[0]),
    id: 'evolving-first',
    deckId: deck.id,
  };
  const second = {
    ...structuredClone(sampleFeed.carousels[1]),
    id: 'evolving-second',
    deckId: deck.id,
  };
  const bundle = {
    deck,
    data: { ...sampleFeed, decks: [deck], carousels: [first], progress: [] },
    installation: 'catalog:evolving-test',
    legacyInstallation: undefined,
  };
  bundledCarouselDecks.push(bundle);
  try {
    expect((await loadFeed()).carousels.some((c) => c.id === first.id)).toBe(
      true,
    );
    await deleteCarousel(first.id, first.revision);
    bundle.data.carousels.push(second);
    const updated = await loadFeed();
    expect(updated.carousels.some((c) => c.id === first.id)).toBe(false);
    expect(updated.carousels.some((c) => c.id === second.id)).toBe(true);
    expect(
      (await loadFeed()).carousels.filter((c) => c.id === second.id),
    ).toHaveLength(1);
  } finally {
    bundledCarouselDecks.pop();
    await replaceFeed(original);
  }
});
