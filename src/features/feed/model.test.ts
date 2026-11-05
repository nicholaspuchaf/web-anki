import template from '../../../docs/templates/feed-carousel.json';
import { expect, test } from 'bun:test';
import {
  DAY_MS,
  appendFeedSession,
  dueCarousels,
  emptyFeed,
  parseCarousel,
  parseFeed,
  readSlide,
  startFeedSession,
} from './model';
import { sampleFeed } from './sample';

const NOW = Date.UTC(2026, 10, 4, 12);

test('leitura parcial não conclui, duplicatas são idempotentes e releitura antecipada não adia a próxima data', () => {
  let data = parseFeed(sampleFeed);
  const carousel = data.carousels[0];
  const first = carousel.slides[0].id;
  data = readSlide(data, carousel.id, 1, first, NOW);
  expect(data.progress[0].completedAt).toBeNull();
  expect(dueCarousels(data, NOW)).toHaveLength(2);
  expect(readSlide(data, carousel.id, 1, first, NOW)).toBe(data);
  expect(readSlide(data, carousel.id, 9, first, NOW)).toBe(data);
  expect(readSlide(data, carousel.id, 1, 'missing', NOW)).toBe(data);
  for (const slide of carousel.slides)
    data = readSlide(data, carousel.id, 1, slide.id, NOW);
  expect(data.progress[0]).toMatchObject({
    completedAt: NOW,
    nextDueAt: NOW + 3 * DAY_MS,
    completions: 1,
  });
  expect(dueCarousels(data, NOW)).toHaveLength(1);
  expect(readSlide(data, carousel.id, 1, first, NOW + DAY_MS)).toBe(data);
  expect(parseFeed(data)).toEqual(data);
  const due = NOW + 3 * DAY_MS;
  data = readSlide(data, carousel.id, 1, first, due);
  expect(data.progress[0]).toMatchObject({
    completedAt: null,
    nextDueAt: null,
    completions: 1,
    seenSlideIds: [first],
  });
  for (const slide of carousel.slides)
    data = readSlide(data, carousel.id, 1, slide.id, due);
  expect(data.progress[0]).toMatchObject({
    nextDueAt: due + 3 * DAY_MS,
    completions: 2,
  });
});

test('fila prioriza temas pendentes, preserva histórico e repete sem vizinhos iguais quando há alternativas', () => {
  let data = parseFeed(sampleFeed);
  const zero = () => 0;
  let session = startFeedSession(data, NOW, zero);
  expect(session.items).toHaveLength(1);
  expect(session.items[0].repeat).toBe(false);
  session = appendFeedSession(session, data, zero);
  expect(new Set(session.items.map((item) => item.carouselId)).size).toBe(2);
  const previous = [...session.items];
  session = appendFeedSession(session, data, zero);
  expect(session.items.slice(0, 2)).toEqual(previous);
  expect(session.items[2].repeat).toBe(true);
  expect(session.items[2].carouselId).not.toBe(session.items[1].carouselId);
  for (const carousel of data.carousels)
    for (const slide of carousel.slides)
      data = readSlide(data, carousel.id, carousel.revision, slide.id, NOW);
  expect(dueCarousels(data, NOW)).toEqual([]);
  expect(startFeedSession(data, NOW, zero).items[0].repeat).toBe(true);
  expect(startFeedSession(emptyFeed, NOW).items).toEqual([]);
  const single = { ...emptyFeed, carousels: [data.carousels[0]] };
  expect(
    appendFeedSession(startFeedSession(single, NOW), single).items,
  ).toHaveLength(2);
});

test('template aceita blocos ricos e imagens offline, mas recusa contratos e metadados perigosos', () => {
  expect(parseFeed(sampleFeed).carousels).toHaveLength(2);
  expect(parseFeed(template).carousels[0].slides).toHaveLength(3);
  const original = structuredClone(sampleFeed.carousels[0]);
  for (const invalid of [
    { ...original, objective: '' },
    { ...original, scope: '' },
    { ...original, intervalDays: 0 },
    { ...original, intervalDays: 31 },
    { ...original, slides: [] },
    { ...original, slides: [original.slides[0], original.slides[0]] },
    {
      ...original,
      slides: [
        {
          ...original.slides[0],
          blocks: [{ id: 'unsafe', type: 'html', text: '<script>x</script>' }],
        },
      ],
    },
  ])
    expect(() => parseCarousel(invalid)).toThrow();
  for (const src of [
    'https://tracker.test/a.png',
    'javascript:alert(1)',
    'data:image/svg+xml;base64,PHN2Zz4=',
    '/study-assets/../a.png',
  ])
    expect(() =>
      parseCarousel({
        ...original,
        slides: [
          {
            id: 'image',
            title: 'Imagem',
            blocks: [
              { id: 'i', type: 'image', src, alt: 'Descrição', caption: '' },
            ],
          },
        ],
      }),
    ).toThrow();
  const accepted = parseCarousel({
    ...original,
    slides: [
      {
        id: 'image',
        title: 'Imagem',
        blocks: [
          {
            id: 'i',
            type: 'image',
            src: 'data:image/png;base64,aGVsbG8=',
            alt: 'Descrição',
            caption: 'Legenda',
          },
        ],
      },
    ],
  });
  expect(accepted.slides[0].blocks[0].type).toBe('image');
  expect(() =>
    parseFeed({ ...sampleFeed, carousels: [original, original] }),
  ).toThrow();
  expect(() => parseFeed({ version: 1, decks: [], cards: [] })).toThrow();
  expect(() =>
    parseFeed({
      ...sampleFeed,
      progress: [
        {
          carouselId: original.id,
          contentRevision: 1,
          seenSlideIds: ['missing'],
          completedAt: null,
          nextDueAt: null,
          completions: 0,
        },
      ],
    }),
  ).toThrow();
});
