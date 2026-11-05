import type { Carousel, FeedSlide } from './model';

export const carouselTemplates = [
  {
    id: 'aurora',
    name: 'Aurora',
    color: '#7652be',
    description: 'Gradientes lilás, formas suaves e destaques luminosos.',
  },
  {
    id: 'oceano',
    name: 'Oceano',
    color: '#087e9a',
    description: 'Azul profundo, faixas fluidas e leitura arejada.',
  },
  {
    id: 'botanica',
    name: 'Botânica',
    color: '#39734b',
    description: 'Verde, cantos orgânicos e listas como pequenas fichas.',
  },
  {
    id: 'ambar',
    name: 'Âmbar',
    color: '#9c6708',
    description: 'Amarelo dourado, marcadores fortes e notas de estudo.',
  },
  {
    id: 'editorial',
    name: 'Editorial',
    color: '#5154a3',
    description: 'Índigo, títulos serifados e composição de revista.',
  },
  {
    id: 'blueprint',
    name: 'Blueprint',
    color: '#2567bd',
    description: 'Azul técnico, grade discreta e blocos de projeto.',
  },
  {
    id: 'grafite',
    name: 'Grafite',
    color: '#65772a',
    description: 'Verde oliva, tipografia monoespaçada e traços marcantes.',
  },
  {
    id: 'sakura',
    name: 'Sakura',
    color: '#af4776',
    description: 'Rosa, delicadeza visual e cartões arredondados.',
  },
  {
    id: 'terracota',
    name: 'Terracota',
    color: '#af5535',
    description: 'Tons de argila, molduras e textura pontilhada.',
  },
  {
    id: 'prisma',
    name: 'Prisma',
    color: '#317f78',
    description: 'Turquesa, geometria e blocos com acentos alternados.',
  },
] as const;
export type CarouselTemplate = (typeof carouselTemplates)[number]['id'];
export const slideStyles = [
  { value: 'opening', label: 'Abertura · título em destaque' },
  { value: 'reading', label: 'Leitura · texto fluido' },
  { value: 'spotlight', label: 'Destaque · ideia central' },
  { value: 'steps', label: 'Passos · blocos numerados' },
  { value: 'workshop', label: 'Laboratório · exemplos e código' },
  { value: 'gallery', label: 'Galeria · imagens em evidência' },
] as const;
export type SlideStyle = (typeof slideStyles)[number]['value'];

export function templateFor(
  carousel: Pick<Carousel, 'id' | 'template'>,
): CarouselTemplate {
  if (carousel.template) return carousel.template;
  // Stable across reloads, backups and devices, without rewriting study progress.
  let hash = 2166136261;
  for (const char of carousel.id)
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  return carouselTemplates[
    ((hash ^ (hash >>> 16)) >>> 0) % carouselTemplates.length
  ].id;
}
export function styleFor(slide: FeedSlide, index: number): SlideStyle {
  if (slide.style) return slide.style;
  if (!index) return 'opening';
  if (slide.blocks.some((b) => b.type === 'code')) return 'workshop';
  if (slide.blocks.some((b) => b.type === 'image')) return 'gallery';
  if (slide.blocks.some((b) => b.type === 'bullets')) return 'steps';
  return index % 2 === 0 ? 'spotlight' : 'reading';
}
