import { feedDatabase as database } from '../../shared/storage/feed-database';
import { withCarouselDecks } from './decks';
import type { Deck } from '../decks/model';
import {
  emptyFeed,
  MAX_FEED_BACKUP_BYTES,
  parseCarousel,
  parseFeed,
  readSlide,
  type Carousel,
  type FeedData,
  type FeedDraft,
} from './model';
import { sampleFeed } from './sample';
import { bundledCarouselDecks, addBundledCarousels } from './bundled-catalog';

async function mutate(change: (data: FeedData) => FeedData): Promise<FeedData> {
  const db = await database();
  try {
    const tx = db.transaction('state', 'readwrite');
    try {
      const stored = await tx.store.get('current');
      const current = stored ? parseFeed(stored) : structuredClone(emptyFeed);
      const next = change(current);
      if (next !== current) await tx.store.put(parseFeed(next), 'current');
      await tx.done;
      return next;
    } catch (error) {
      try {
        tx.abort();
      } catch {
        /* Transaction may already be finished. */
      }
      await tx.done.catch(() => {});
      throw error;
    }
  } finally {
    db.close();
  }
}
export async function loadFeed(): Promise<FeedData> {
  const db = await database();
  try {
    const tx = db.transaction('state', 'readwrite');
    const stored = await tx.store.get('current');
    let current = stored ? parseFeed(stored) : parseFeed(sampleFeed);
    for (const bundle of bundledCarouselDecks) {
      const installed = await tx.store.get(bundle.installation);
      const sourceIds = bundle.data.carousels.map((c) => c.id);
      // Old boolean markers mean these resources were already offered, including deletions.
      if (
        installed === true ||
        (!installed && stored && bundle.seedOnly) ||
        (!installed &&
          bundle.legacyInstallation &&
          (await tx.store.get(bundle.legacyInstallation)))
      ) {
        await tx.store.put(sourceIds, bundle.installation);
        continue;
      }
      const knownIds: string[] = Array.isArray(installed) ? installed : [];
      const additions = bundle.data.carousels.filter(
        (c) => !knownIds.includes(c.id),
      );
      if (!additions.length && installed) continue;
      const next = withCarouselDecks(
        addBundledCarousels(current, { ...bundle.data, carousels: additions }),
      );
      if (
        next.carousels.length <= 500 &&
        new TextEncoder().encode(JSON.stringify(next)).byteLength <=
          MAX_FEED_BACKUP_BYTES
      ) {
        current = parseFeed(next);
        await tx.store.put(
          [...knownIds, ...additions.map((c) => c.id)],
          bundle.installation,
        );
      }
    }
    if (!stored || JSON.stringify(current) !== JSON.stringify(stored))
      await tx.store.put(current, 'current');
    const organized = withCarouselDecks(current);
    if (JSON.stringify(organized) !== JSON.stringify(current))
      await tx.store.put(organized, 'current');
    await tx.done;
    return organized;
  } finally {
    db.close();
  }
}
function learningContent(carousel: Carousel) {
  return JSON.stringify({
    title: carousel.title,
    scope: carousel.scope,
    objective: carousel.objective,
    intervalDays: carousel.intervalDays,
    slides: carousel.slides.map((slide) => ({
      id: slide.id,
      title: slide.title,
      blocks: slide.blocks,
    })),
  });
}
export function saveCarousel(
  value: Carousel,
  expectedRevision: number | null,
  deck?: Deck,
): Promise<FeedData> {
  const parsed = parseCarousel(value);
  return mutate((data) => {
    const old = data.carousels.find((c) => c.id === parsed.id);
    if ((old?.revision ?? null) !== expectedRevision)
      throw new Error(
        'Este carrossel mudou em outra aba. Feche e abra o editor para revisar a versão atual. Seu rascunho foi preservado.',
      );
    const carousel = { ...parsed, revision: (old?.revision ?? 0) + 1 };
    return withCarouselDecks({
      ...data,
      decks: deck
        ? [...(data.decks ?? []).filter((d) => d.id !== deck.id), deck]
        : data.decks,
      carousels: old
        ? data.carousels.map((c) => (c.id === carousel.id ? carousel : c))
        : [carousel, ...data.carousels],
      progress:
        old && learningContent(old) === learningContent(carousel)
          ? data.progress.map((p) =>
              p.carouselId === carousel.id
                ? { ...p, contentRevision: carousel.revision }
                : p,
            )
          : data.progress.filter((p) => p.carouselId !== carousel.id),
    });
  });
}
export function markSlideRead(
  carousel: Carousel,
  slideId: string,
  now: number,
): Promise<FeedData> {
  return mutate((data) =>
    readSlide(data, carousel.id, carousel.revision, slideId, now),
  );
}
export function deleteCarousel(
  id: string,
  expectedRevision: number,
): Promise<FeedData> {
  return mutate((data) => {
    if (data.carousels.find((c) => c.id === id)?.revision !== expectedRevision)
      throw new Error(
        'Este carrossel mudou em outra aba. Atualize a página antes de excluir.',
      );
    return {
      ...data,
      carousels: data.carousels.filter((c) => c.id !== id),
      progress: data.progress.filter((p) => p.carouselId !== id),
    };
  });
}
export function replaceFeed(value: unknown): Promise<FeedData> {
  const parsed = parseFeed(value);
  return mutate(() => withCarouselDecks(parsed));
}
export async function loadDraft(key: string): Promise<FeedDraft | undefined> {
  const db = await database();
  try {
    return await db.get('state', `draft:${key}`);
  } finally {
    db.close();
  }
}
export async function saveDraft(
  key: string,
  draft: FeedDraft | null,
): Promise<void> {
  const db = await database();
  try {
    if (draft) await db.put('state', draft, `draft:${key}`);
    else await db.delete('state', `draft:${key}`);
  } finally {
    db.close();
  }
}
