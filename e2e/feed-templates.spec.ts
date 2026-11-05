import { expect, test } from '@playwright/test';
import { feedAction, feedTheme } from './feed-actions';
import {
  carouselTemplates,
  slideStyles,
} from '../src/features/feed/presentation';
import { readFile } from 'node:fs/promises';

test('dez templates, seis estilos e escolha persistida em mobile, desktop e backup', async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#/feed');
  await expect(page.locator('.learning-carousel').first()).toBeVisible();
  page.on('dialog', (d) => void d.accept());
  await page.getByLabel('Arquivo de backup do Feed').setInputFiles({
    name: 'templates.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify({
        format: 'folha-feed',
        version: 1,
        progress: [],
        carousels: [
          {
            id: 'visual-course',
            revision: 1,
            title: 'Construindo conhecimento',
            scope: 'Estudo visual',
            objective: 'Aprender com exemplos',
            tags: ['visual'],
            intervalDays: 3,
            slides: slideStyles.map((style, index) => ({
              id: 's-' + index,
              title: 'Aprenda uma ideia por vez',
              style: style.value,
              blocks: [
                {
                  id: 'p',
                  type: 'paragraph',
                  text: 'Uma boa explicação conecta o conceito a uma situação concreta. Varie a apresentação, mantendo a leitura confortável e a sequência das ideias.',
                },
                {
                  id: 'b',
                  type: 'bullets',
                  items: [
                    'Entenda o problema antes da ferramenta.',
                    'Explore um exemplo e compare as decisões.',
                  ],
                },
                {
                  id: 'c',
                  type: 'code',
                  language: 'typescript',
                  text: 'const aprender = (ideia: string) => {\n  return praticar(ideia);\n};',
                },
              ],
            })),
          },
        ],
      }),
    ),
  });
  await feedAction(page, 'Meus carrosséis');
  await page.getByRole('button', { name: 'Editar', exact: true }).click();
  const dialog = page.getByRole('dialog');
  const picker = dialog.getByRole('group', {
    name: 'Template visual do carrossel',
  });
  await expect(picker.getByRole('button')).toHaveCount(10);
  await page.setViewportSize({ width: 1280, height: 950 });
  for (const template of carouselTemplates) {
    await picker
      .getByRole('button', { name: template.name, exact: true })
      .click();
    await page
      .getByRole('button', { name: 'Pré-visualizar carrossel', exact: true })
      .click();
    const preview = dialog.locator('.learning-carousel');
    await expect(preview).toHaveAttribute('data-template', template.id);
    await expect(preview.locator('.feed-slide').first()).toHaveAttribute(
      'data-card-style',
      'opening',
    );
    await preview.scrollIntoViewIfNeeded();
    await preview.screenshot({
      path: info.outputPath(`template-${template.id}.png`),
    });
    await page
      .getByRole('button', { name: 'Voltar ao editor', exact: true })
      .click();
  }
  await dialog
    .getByLabel('Estilo do card 1', { exact: true })
    .selectOption('spotlight');
  await page
    .getByRole('button', { name: 'Salvar carrossel', exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  const waiting = page.waitForEvent('download');
  await feedAction(page, 'Exportar Feed');
  const data = JSON.parse(
    await readFile((await (await waiting).path())!, 'utf8'),
  );
  expect(data.carousels[0].template).toBe('prisma');
  expect(data.carousels[0].slides[0].style).toBe('spotlight');
  await feedAction(page, 'Aprender');
  await feedTheme(page);
  await page.setViewportSize({ width: 390, height: 844 });
  const current = page.locator('.feed-entry:not([hidden]) .learning-carousel');
  for (let index = 0; index < slideStyles.length; index++) {
    await current
      .getByRole('button', { name: `Ir para o card ${index + 1}`, exact: true })
      .click();
    await expect(current.locator('.feed-slide:not([inert])')).toHaveAttribute(
      'data-card-style',
      index === 0 ? 'spotlight' : slideStyles[index].value,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.screenshot({ path: info.outputPath('prisma-mobile-dark.png') });
  await page.reload();
  await expect(page.locator('.learning-carousel').first()).toHaveAttribute(
    'data-template',
    'prisma',
  );
  await expect(page.locator('.feed-slide:not([inert])')).toHaveAttribute(
    'data-card-style',
    'spotlight',
  );
});
