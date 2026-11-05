import { expect, test } from 'bun:test';
import { readFileSync, existsSync } from 'node:fs';
import { patternFeed, withPatternCarousels } from './pattern-catalog';
import patterns from '../../content/design-patterns.json';
import assets from '../../content/design-pattern-assets.json';
import { emptyFeed, parseCarousel, parseFeed } from './model';
import { sampleFeed } from './sample';

const expected: [string, unknown][] = [
  ['factory-method', ['["A","B"]', 'A|B']],
  [
    'abstract-factory',
    [
      ['RESUMO', 'Tudo certo'],
      ['# Resumo', '> Tudo certo'],
    ],
  ],
  [
    'builder',
    [
      { fields: ['nome', 'email'], destination: 'arquivo' },
      { fields: ['id'], destination: 'memoria' },
    ],
  ],
  ['prototype', { original: 'Nome', copy: 'Participante', independent: true }],
  ['singleton', { same: true, name: 'Estudos' }],
  ['adapter', 'cobrado:15.90'],
  ['bridge', ['email:A', 'log:URGENTE B']],
  ['composite', 45],
  ['decorator', { inside: 1, outside: 2 }],
  ['facade', { id: 'material-1', indexed: ['material-1'] }],
  ['flyweight', { shared: true, positions: [1, 2] }],
  ['proxy', { deniedLoads: 0, loads: 1 }],
  ['chain-of-responsibility', ['lider', 'gerente', 'sem aprovador']],
  ['command', { after: 3, undone: 0 }],
  ['iterator', { depth: ['A', 'B', 'D', 'C'], breadth: ['A', 'B', 'C', 'D'] }],
  ['mediator', { smallRoom: false, largeRoom: true }],
  ['memento', { changed: 'Novo final', restored: 'Introdução' }],
  ['observer', ['A:1', 'B:1', 'B:2']],
  ['state', [true, false, true]],
  ['strategy', ['Ana', 'Bia']],
  ['template-method', [['a@x.test'], ['b@x.test']]],
  ['visitor', { estimatedBytes: 40, files: 2 }],
];

test.each(expected)(
  'exemplo publicado de %s executa com o resultado ensinado',
  async (slug, result) => {
    const module = (await import(
      `../../content/pattern-examples/${slug}.ts`
    )) as { demo: () => unknown };
    expect(module.demo()).toEqual(result);
    const carousel = patternFeed.carousels.find(
      (c) => c.id === `feed-pattern-${slug}`,
    )!;
    const code = carousel.slides
      .flatMap((s) => s.blocks)
      .find((b) => b.type === 'code');
    expect(code?.type === 'code' ? code.text : '').toBe(
      readFileSync(`src/content/pattern-examples/${slug}.ts`, 'utf8').trim(),
    );
  },
);

test('catálogo inclui um carrossel completo por padrão, recursos locais e créditos verificáveis', () => {
  expect(patternFeed.carousels).toHaveLength(patterns.patterns.length);
  expect(patternFeed.carousels).toHaveLength(22);
  expect(new Set(patternFeed.carousels.map((c) => c.id)).size).toBe(22);
  const thirdParty = new Set<string>();
  for (const pattern of patterns.patterns) {
    const carousel = patternFeed.carousels.find(
      (c) => c.id === `feed-pattern-${pattern.id}`,
    )!;
    expect(carousel.sourceUrl).toBe(pattern.sourceUrl);
    expect(carousel.slides.length).toBeGreaterThanOrEqual(16);
    const ids = carousel.slides.map((s) => s.id);
    for (const topic of [
      'cenario',
      'contrato',
      'codigo',
      'testes',
      'limites',
      'comparacao',
      'exercicio',
      'resposta',
    ])
      expect(ids).toContain(`${pattern.id}-${topic}`);
    expect(carousel.slides[0].title).toContain(pattern.name);
    for (const block of carousel.slides.flatMap((s) => s.blocks)) {
      if (block.type === 'paragraph') expect(block.text.trim()).not.toBe('');
      if (block.type === 'image') {
        expect(existsSync(`public${block.src}`)).toBe(true);
        expect(block.alt).not.toBe('');
        expect(block.credit).toBeTruthy();
        if (block.src.includes('-refactoring-guru')) {
          thirdParty.add(block.src);
          expect(block.sourceUrl).toBe(pattern.sourceUrl);
        }
      }
    }
  }
  expect(thirdParty.size).toBe(10);
  expect([...thirdParty].sort()).toEqual(assets.map((a) => a.src).sort());
  expect(parseFeed(patternFeed)).toEqual(patternFeed);
});

test('composição preserva conteúdos editados e progresso existente, sem duplicar carrosséis', () => {
  const original = structuredClone(sampleFeed);
  original.carousels[0].title = 'Meu texto';
  const first = withPatternCarousels(original);
  expect(first.carousels).toHaveLength(24);
  expect(first.carousels[0]).toEqual(original.carousels[0]);
  const course = first.carousels.find(
    (c) => c.id === patternFeed.carousels[0].id,
  )!;
  course.title = 'Minha adaptação';
  course.revision = 2;
  const updated = withPatternCarousels(first);
  expect(updated).toBe(first);
  expect(updated.carousels.find((c) => c.id === course.id)?.title).toBe(
    'Minha adaptação',
  );
});

test('criação e backup aceitam 65 cards sem teto quantitativo e mantêm validações de conteúdo', () => {
  const original = patternFeed.carousels[0];
  const long = {
    ...original,
    slides: Array.from({ length: 65 }, (_, index) => ({
      ...original.slides[index % original.slides.length],
      id: `long-${index}`,
    })),
  };
  expect(parseCarousel(long).slides).toHaveLength(65);
  expect(
    parseFeed({ ...emptyFeed, carousels: [long] }).carousels[0].slides,
  ).toHaveLength(65);
  expect(() => parseCarousel({ ...long, slides: [] })).toThrow();
  expect(() =>
    parseCarousel({ ...long, sourceUrl: 'javascript:alert(1)' }),
  ).toThrow();
  expect(() =>
    parseCarousel({
      ...long,
      slides: [
        {
          id: 'code',
          title: 'Código',
          blocks: [{ id: 'x', type: 'code', language: 'invalid', text: 'x' }],
        },
      ],
    }),
  ).toThrow();
});
