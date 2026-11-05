import { openDB } from 'idb';
import {
  emptyFeed,
  parseCarousel,
  parseFeed,
  readSlide,
  type Carousel,
  type FeedData,
  type FeedDraft,
} from './model';
import { sampleFeed } from './sample';

const database = () =>
  openDB('folha-feed', 1, {
    upgrade(db) {
      db.createObjectStore('state');
    },
  });
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
    const current = stored ? parseFeed(stored) : parseFeed(sampleFeed);
    if (!stored) await tx.store.put(current, 'current');
    await tx.done;
    return current;
  } finally {
    db.close();
  }
}
export function saveCarousel(
  value: Carousel,
  expectedRevision: number | null,
): Promise<FeedData> {
  const parsed = parseCarousel(value);
  return mutate((data) => {
    const old = data.carousels.find((c) => c.id === parsed.id);
    if ((old?.revision ?? null) !== expectedRevision)
      throw new Error(
        'Este carrossel mudou em outra aba. Feche e abra o editor para revisar a versão atual. Seu rascunho foi preservado.',
      );
    const carousel = { ...parsed, revision: (old?.revision ?? 0) + 1 };
    return {
      ...data,
      carousels: old
        ? data.carousels.map((c) => (c.id === carousel.id ? carousel : c))
        : [carousel, ...data.carousels],
      progress: data.progress.filter((p) => p.carouselId !== carousel.id),
    };
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
  return mutate(() => parsed);
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
