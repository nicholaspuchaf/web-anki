import { expect, test } from 'bun:test';
import { carouselTemplates, templateFor, styleFor } from './presentation';
import { parseCarousel, parseFeed, type FeedSlide } from './model';
import { sampleFeed } from './sample';
import catalog from '../../content/decks/design-patterns/carousels/index';

test('dez templates distribuídos de forma estável no catálogo existente, sem mutar dados', () => {
  expect(carouselTemplates).toHaveLength(10);
  expect(new Set(carouselTemplates.map((t) => t.name)).size).toBe(10);
  const data = parseFeed(catalog);
  const before = structuredClone(data);
  const templates = data.carousels.map(templateFor);
  expect(new Set(templates).size).toBeGreaterThanOrEqual(7);
  expect(data.carousels.map(templateFor)).toEqual(templates);
  expect(data).toEqual(before);
});

test('template e estilo manual sobrevivem ao backup; legados continuam intactos e valores inválidos são recusados', () => {
  const old = parseFeed(sampleFeed).carousels[0];
  expect(parseCarousel(old)).toEqual(old);
  for (const template of carouselTemplates) {
    const styled = {
      ...old,
      template: template.id,
      slides: old.slides.map((s) => ({ ...s, style: 'spotlight' as const })),
    };
    expect(parseCarousel(JSON.parse(JSON.stringify(styled)))).toEqual(styled);
    expect(templateFor(styled)).toBe(template.id);
  }
  expect(() => parseCarousel({ ...old, template: 'unknown' })).toThrow();
  expect(() =>
    parseCarousel({ ...old, slides: [{ ...old.slides[0], style: 'unknown' }] }),
  ).toThrow();
});

test('variação automática respeita o conteúdo e a escolha manual sem reordenar blocos', () => {
  const slide: FeedSlide = {
    id: 's',
    title: 'Título',
    blocks: [{ id: 'p', type: 'paragraph', text: 'Texto' }],
  };
  expect(styleFor(slide, 0)).toBe('opening');
  expect(styleFor(slide, 1)).toBe('reading');
  expect(styleFor(slide, 2)).toBe('spotlight');
  expect(
    styleFor(
      { ...slide, blocks: [{ id: 'b', type: 'bullets', items: ['item'] }] },
      1,
    ),
  ).toBe('steps');
  expect(
    styleFor(
      {
        ...slide,
        blocks: [
          { id: 'c', type: 'code', language: 'python', text: 'print(1)' },
        ],
      },
      1,
    ),
  ).toBe('workshop');
  expect(
    styleFor(
      {
        ...slide,
        blocks: [
          {
            id: 'i',
            type: 'image',
            src: '/study-assets/example.png',
            alt: 'Imagem',
            caption: '',
          },
        ],
      },
      1,
    ),
  ).toBe('gallery');
  expect(styleFor({ ...slide, style: 'reading' }, 0)).toBe('reading');
});
