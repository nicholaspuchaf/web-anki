export const DAY_MS = 86_400_000;
export const MAX_FEED_BACKUP_BYTES = 30_000_000;
export type FeedBlock =
  | { id: string; type: 'paragraph'; text: string }
  | { id: string; type: 'bullets'; items: string[] }
  | { id: string; type: 'image'; src: string; alt: string; caption: string };
export type FeedSlide = { id: string; title: string; blocks: FeedBlock[] };
export type Carousel = {
  id: string;
  revision: number;
  title: string;
  scope: string;
  objective: string;
  tags: string[];
  intervalDays: number;
  slides: FeedSlide[];
};
export type FeedProgress = {
  carouselId: string;
  contentRevision: number;
  seenSlideIds: string[];
  completedAt: number | null;
  nextDueAt: number | null;
  completions: number;
};
export type FeedData = {
  format: 'folha-feed';
  version: 1;
  carousels: Carousel[];
  progress: FeedProgress[];
};
export type FeedDraft = { carousel: Carousel; expectedRevision: number | null };
export const emptyFeed: FeedData = {
  format: 'folha-feed',
  version: 1,
  carousels: [],
  progress: [],
};

export function newSlide(): FeedSlide {
  return {
    id: crypto.randomUUID(),
    title: '',
    blocks: [{ id: crypto.randomUUID(), type: 'paragraph', text: '' }],
  };
}
export function newCarousel(): Carousel {
  return {
    id: crypto.randomUUID(),
    revision: 1,
    title: '',
    scope: '',
    objective: '',
    tags: [],
    intervalDays: 3,
    slides: ['O problema', 'Como funciona', 'Na prática'].map((title) => ({
      ...newSlide(),
      title,
    })),
  };
}
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Conteúdo do Feed inválido.');
  return value as Record<string, unknown>;
}
function string(value: unknown, label: string, required = true): string {
  if (
    typeof value !== 'string' ||
    value.length > 40_000 ||
    (required && !value.trim())
  )
    throw new Error(`Preencha ${label}.`);
  return value.trim();
}
function identifier(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,160}$/.test(value))
    throw new Error('Identificador do Feed inválido.');
  return value;
}
function unique<T extends { id: string }>(items: T[]): T[] {
  if (new Set(items.map((item) => item.id)).size !== items.length)
    throw new Error('Há identificadores duplicados no Feed.');
  return items;
}
export function safeFeedImage(src: unknown): src is string {
  return (
    typeof src === 'string' &&
    src.length <= 4_000_000 &&
    (/^\/study-assets\/[a-z0-9/-]+\.(png|svg|webp|jpg|jpeg)$/.test(src) ||
      /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(src))
  );
}
export function parseCarousel(value: unknown): Carousel {
  const input = record(value);
  if (!Number.isSafeInteger(input.revision) || (input.revision as number) < 1)
    throw new Error('Versão do carrossel inválida.');
  if (
    !Number.isInteger(input.intervalDays) ||
    (input.intervalDays as number) < 1 ||
    (input.intervalDays as number) > 30
  )
    throw new Error('Escolha um intervalo de 1 a 30 dias.');
  if (!Array.isArray(input.tags) || input.tags.length > 20)
    throw new Error('Use até 20 tags.');
  if (
    !Array.isArray(input.slides) ||
    !input.slides.length ||
    input.slides.length > 30
  )
    throw new Error('Use entre 1 e 30 cards por carrossel.');
  const slides = unique(
    input.slides.map((item): FeedSlide => {
      const slide = record(item);
      if (
        !Array.isArray(slide.blocks) ||
        !slide.blocks.length ||
        slide.blocks.length > 40
      )
        throw new Error('Cada card precisa de 1 a 40 blocos.');
      const blocks = unique(
        slide.blocks.map((item): FeedBlock => {
          const block = record(item);
          const id = identifier(block.id);
          if (block.type === 'paragraph')
            return {
              id,
              type: 'paragraph',
              text: string(block.text, 'o parágrafo'),
            };
          if (block.type === 'bullets') {
            if (
              !Array.isArray(block.items) ||
              !block.items.length ||
              block.items.length > 60
            )
              throw new Error('Preencha a lista com 1 a 60 itens.');
            return {
              id,
              type: 'bullets',
              items: block.items.map((item) =>
                string(item, 'os itens da lista'),
              ),
            };
          }
          if (block.type === 'image' && safeFeedImage(block.src))
            return {
              id,
              type: 'image',
              src: block.src,
              alt: string(block.alt, 'a descrição da imagem'),
              caption: string(block.caption, 'a legenda', false),
            };
          throw new Error(
            'Bloco inválido. Use imagens locais, PNG, JPEG ou WebP.',
          );
        }),
      );
      return {
        id: identifier(slide.id),
        title: string(slide.title, 'o título de cada card'),
        blocks,
      };
    }),
  );
  const carousel: Carousel = {
    id: identifier(input.id),
    revision: input.revision as number,
    title: string(input.title, 'o título do carrossel'),
    scope: string(input.scope, 'o escopo'),
    objective: string(input.objective, 'o objetivo de aprendizado'),
    tags: [
      ...new Set(
        input.tags.map((item) => string(item, 'as tags').toLocaleLowerCase()),
      ),
    ],
    intervalDays: input.intervalDays as number,
    slides,
  };
  if (JSON.stringify(carousel).length > 12_000_000)
    throw new Error('O carrossel deve ter até 12 MB. Reduza as imagens.');
  return carousel;
}
export function parseFeed(value: unknown): FeedData {
  const input = record(value);
  if (
    input.format !== 'folha-feed' ||
    input.version !== 1 ||
    !Array.isArray(input.carousels) ||
    input.carousels.length > 500 ||
    !Array.isArray(input.progress)
  )
    throw new Error('Backup do Feed incompatível.');
  if (
    new TextEncoder().encode(JSON.stringify(input)).byteLength >
    MAX_FEED_BACKUP_BYTES
  )
    throw new Error('O Feed deve ter até 30 MB. Reduza o tamanho das imagens.');
  const carousels = unique(input.carousels.map(parseCarousel));
  const ids = new Set<string>();
  const progress = input.progress.map((item): FeedProgress => {
    const p = record(item);
    const id = identifier(p.carouselId);
    const carousel = carousels.find((c) => c.id === id);
    if (
      !carousel ||
      ids.has(id) ||
      p.contentRevision !== carousel.revision ||
      !Array.isArray(p.seenSlideIds) ||
      !Number.isSafeInteger(p.completions) ||
      (p.completions as number) < 0
    )
      throw new Error('Progresso do Feed inválido.');
    ids.add(id);
    const seenSlideIds = p.seenSlideIds.map(identifier);
    if (
      new Set(seenSlideIds).size !== seenSlideIds.length ||
      seenSlideIds.some((id) => !carousel.slides.some((s) => s.id === id))
    )
      throw new Error('Cards lidos inválidos.');
    const validTime = (v: unknown) =>
      v === null || (typeof v === 'number' && Number.isFinite(v) && v >= 0);
    if (
      !validTime(p.completedAt) ||
      (p.completedAt === null &&
        seenSlideIds.length === carousel.slides.length) ||
      !validTime(p.nextDueAt) ||
      (p.completedAt === null) !== (p.nextDueAt === null) ||
      (p.completedAt !== null &&
        ((p.nextDueAt as number) <= (p.completedAt as number) ||
          seenSlideIds.length !== carousel.slides.length ||
          (p.completions as number) < 1))
    )
      throw new Error('Agendamento do Feed inválido.');
    return {
      carouselId: id,
      contentRevision: carousel.revision,
      seenSlideIds,
      completedAt: p.completedAt as number | null,
      nextDueAt: p.nextDueAt as number | null,
      completions: p.completions as number,
    };
  });
  return { format: 'folha-feed', version: 1, carousels, progress };
}
export function dueCarousels(data: FeedData, now: number): Carousel[] {
  return data.carousels.filter((carousel) => {
    const progress = data.progress.find((p) => p.carouselId === carousel.id);
    return (
      !progress ||
      progress.contentRevision !== carousel.revision ||
      progress.nextDueAt === null ||
      progress.nextDueAt <= now
    );
  });
}
export function readSlide(
  data: FeedData,
  carouselId: string,
  revision: number,
  slideId: string,
  now: number,
): FeedData {
  const carousel = data.carousels.find(
    (c) => c.id === carouselId && c.revision === revision,
  );
  if (!carousel || !carousel.slides.some((s) => s.id === slideId)) return data;
  const previous = data.progress.find((p) => p.carouselId === carouselId);
  if (
    previous?.nextDueAt !== null &&
    previous?.nextDueAt !== undefined &&
    previous.nextDueAt > now
  )
    return data;
  const reset =
    !previous ||
    previous.contentRevision !== revision ||
    previous.nextDueAt !== null;
  const seenSlideIds = reset
    ? [slideId]
    : [...new Set([...previous.seenSlideIds, slideId])];
  if (!reset && previous.seenSlideIds.length === seenSlideIds.length)
    return data;
  const complete = seenSlideIds.length === carousel.slides.length;
  const next: FeedProgress = {
    carouselId,
    contentRevision: revision,
    seenSlideIds,
    completedAt: complete ? now : null,
    nextDueAt: complete ? now + carousel.intervalDays * DAY_MS : null,
    completions: (previous?.completions ?? 0) + (complete ? 1 : 0),
  };
  return {
    ...data,
    progress: [
      ...data.progress.filter((p) => p.carouselId !== carouselId),
      next,
    ],
  };
}

export type FeedSession = {
  items: { key: number; carouselId: string; repeat: boolean }[];
  pending: string[];
  nextKey: number;
};
export function shuffled<T>(values: T[], random = Math.random): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function startFeedSession(
  data: FeedData,
  now: number,
  random = Math.random,
): FeedSession {
  return appendFeedSession(
    {
      items: [],
      pending: shuffled(
        dueCarousels(data, now).map((c) => c.id),
        random,
      ),
      nextKey: 0,
    },
    data,
    random,
  );
}
export function appendFeedSession(
  session: FeedSession,
  data: FeedData,
  random = Math.random,
): FeedSession {
  if (!data.carousels.length) return session;
  const pending = session.pending.filter((id) =>
    data.carousels.some((c) => c.id === id),
  );
  const last = session.items.at(-1)?.carouselId;
  const choices = data.carousels.filter(
    (c) => data.carousels.length === 1 || c.id !== last,
  );
  const carouselId =
    pending.shift() ?? choices[Math.floor(random() * choices.length)].id;
  return {
    items: [
      ...session.items,
      {
        key: session.nextKey,
        carouselId,
        repeat: !session.pending.includes(carouselId),
      },
    ],
    pending,
    nextKey: session.nextKey + 1,
  };
}
