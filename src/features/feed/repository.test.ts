import 'fake-indexeddb/auto';
import { expect, test } from 'bun:test';
import { emptyFeed } from './model';
import { sampleFeed } from './sample';
import {
  deleteCarousel,
  loadDraft,
  loadFeed,
  markSlideRead,
  replaceFeed,
  saveCarousel,
  saveDraft,
} from './repository';
import { readLibrary } from '../../shared/storage/library-repository';

test('Feed inicializa uma vez, mantém exclusões e persiste independentemente da biblioteca de flashcards', async () => {
  const library = await readLibrary();
  expect(
    (await loadFeed()).carousels.filter((c) =>
      c.id.startsWith('feed-pattern-'),
    ),
  ).toHaveLength(22);
  await replaceFeed(emptyFeed);
  expect((await loadFeed()).carousels).toEqual([]);
  const carousel = structuredClone(sampleFeed.carousels[0]);
  const saved = await saveCarousel(carousel, null);
  expect(await loadFeed()).toEqual(saved);
  await deleteCarousel(carousel.id, 1);
  expect((await loadFeed()).carousels).toEqual([]);
  expect(await readLibrary()).toEqual(library);
});

test('transações combinam leituras paralelas e rejeitam edição obsoleta sem perder dados', async () => {
  await replaceFeed(sampleFeed);
  const carousel = structuredClone(sampleFeed.carousels[0]);
  await Promise.all(
    carousel.slides.map((slide) => markSlideRead(carousel, slide.id, 1000)),
  );
  expect((await loadFeed()).progress[0].seenSlideIds).toHaveLength(
    carousel.slides.length,
  );
  expect((await loadFeed()).progress[0].completions).toBe(1);
  const outcomes = await Promise.allSettled([
    saveCarousel({ ...carousel, title: 'Alteração A' }, 1),
    saveCarousel({ ...carousel, title: 'Alteração B' }, 1),
  ]);
  expect(outcomes.filter((item) => item.status === 'fulfilled')).toHaveLength(
    1,
  );
  expect(outcomes.filter((item) => item.status === 'rejected')).toHaveLength(1);
  const current = await loadFeed();
  expect(current.carousels[0].revision).toBe(2);
  expect(current.progress).toEqual([]);
  await markSlideRead(carousel, carousel.slides[0].id, 5000);
  expect((await loadFeed()).progress).toEqual([]);
  await expect(deleteCarousel(carousel.id, 1)).rejects.toThrow('outra aba');
  expect(await loadFeed()).toEqual(current);
});

test('rascunhos incompletos são recuperáveis e backup inválido não altera o estado salvo', async () => {
  const current = await loadFeed();
  const draft = {
    carousel: { ...structuredClone(sampleFeed.carousels[0]), objective: '' },
    expectedRevision: 1,
  };
  await saveDraft('draft-test', draft);
  expect(await loadDraft('draft-test')).toEqual(draft);
  expect(() => replaceFeed({ ...sampleFeed, version: 2 })).toThrow();
  expect(await loadFeed()).toEqual(current);
  await saveDraft('draft-test', null);
  expect(await loadDraft('draft-test')).toBeUndefined();
});
