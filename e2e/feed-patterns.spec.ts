import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import catalog from '../src/content/feed-design-patterns.json' with { type: 'json' };
import type { FeedData } from '../src/features/feed/model';

async function exportFeed(page: Page): Promise<FeedData> {
  const waiting = page.waitForEvent('download');
  await page
    .getByRole('button', { name: 'Exportar Feed', exact: true })
    .click();
  return JSON.parse(
    await readFile((await (await waiting).path())!, 'utf8'),
  ) as FeedData;
}

test('catálogo chega a feeds existentes sem perder progresso ou ressuscitar exclusões', async ({
  page,
}) => {
  await page.goto('/');
  const legacy: FeedData = {
    format: 'folha-feed',
    version: 1,
    carousels: [
      {
        id: 'personal-old',
        revision: 4,
        title: 'Conteúdo pessoal',
        objective: 'Aprender um tema meu.',
        scope: 'Um assunto.',
        tags: ['meu'],
        intervalDays: 3,
        slides: [
          {
            id: 'old-slide',
            title: 'Minha explicação',
            blocks: [
              {
                id: 'old-p',
                type: 'paragraph',
                text: 'Um conteúdo já existente que deve permanecer.',
              },
            ],
          },
        ],
      },
    ],
    progress: [
      {
        carouselId: 'personal-old',
        contentRevision: 4,
        seenSlideIds: ['old-slide'],
        completedAt: 1000,
        nextDueAt: Date.now() + 3 * 86400000,
        completions: 2,
      },
    ],
  };
  await page.evaluate(async (data) => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('folha-feed', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('state');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('state', 'readwrite');
        tx.objectStore('state').put(data, 'current');
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      };
    });
  }, legacy);
  const remoteRequests: string[] = [];
  page.on('request', (request) => {
    if (
      request.url().includes('refactoring.guru') ||
      request.url().includes('folha-api.example')
    )
      remoteRequests.push(request.url());
  });
  await page.getByRole('link', { name: 'Feed', exact: false }).click();
  await page
    .getByRole('button', { name: 'Meus carrosséis', exact: true })
    .click();
  await expect(page.locator('.feed-manager article')).toHaveCount(23);
  for (const carousel of catalog.carousels)
    await expect(
      page.getByRole('heading', { name: carousel.title, exact: true }),
    ).toHaveCount(1);
  const backup = await exportFeed(page);
  expect(
    backup.carousels.filter((c) => c.id.startsWith('feed-pattern-')),
  ).toHaveLength(22);
  expect(backup.carousels.find((c) => c.id === 'personal-old')).toEqual(
    legacy.carousels[0],
  );
  expect(backup.progress.find((p) => p.carouselId === 'personal-old')).toEqual(
    legacy.progress[0],
  );
  const item = page.locator('.feed-manager article').filter({
    has: page.getByRole('heading', {
      name: catalog.carousels[0].title,
      exact: true,
    }),
  });
  page.on('dialog', (dialog) => void dialog.accept());
  await item.getByRole('button', { name: 'Excluir', exact: true }).click();
  await expect(item).toHaveCount(0);
  await page.reload();
  await page
    .getByRole('button', { name: 'Meus carrosséis', exact: true })
    .click();
  await expect(page.locator('.feed-manager article')).toHaveCount(22);
  await expect(item).toHaveCount(0);
  expect(remoteRequests).toEqual([]);
});

test('editor duplica e adiciona além de 65 cards, código permanece legível e o conteúdo funciona offline', async ({
  page,
  context,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#/feed');
  await expect(
    page.getByRole('button', { name: 'Importar Feed', exact: true }),
  ).toBeVisible();
  const original = catalog.carousels[0];
  const long = {
    ...original,
    id: 'long-course',
    title: 'Carrossel longo de estudo',
    slides: Array.from({ length: 65 }, (_, index) => ({
      ...original.slides[index % original.slides.length],
      id: `long-${index}`,
    })),
  };
  page.on('dialog', (dialog) => void dialog.accept());
  await page.getByLabel('Arquivo de backup do Feed').setInputFiles({
    name: 'long.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify({
        format: 'folha-feed',
        version: 1,
        carousels: [long],
        progress: [],
      }),
    ),
  });
  await page
    .getByRole('button', { name: 'Meus carrosséis', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: long.title, exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Editar', exact: true }).click();
  await page
    .getByRole('button', { name: 'Duplicar card', exact: true })
    .click();
  await expect(page.getByText('66 card(s)', { exact: true })).toBeVisible();
  await page
    .getByRole('button', { name: '+ Adicionar card', exact: true })
    .click();
  await page
    .getByLabel('Título do card 67', { exact: true })
    .fill('Sem um teto artificial de cards');
  await page
    .getByLabel('Parágrafo 1', { exact: true })
    .fill(
      'Este conteúdo pode continuar enquanto o tema precisar de explicação.',
    );
  await page
    .getByRole('button', { name: 'Salvar carrossel', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const backup = await exportFeed(page);
  expect(backup.carousels[0].slides).toHaveLength(67);
  await page.getByRole('button', { name: 'Aprender', exact: true }).click();
  const post = page.locator('.learning-carousel').first();
  expect(await post.locator('.feed-dots button').count()).toBeLessThan(10);
  await post
    .getByRole('button', { name: 'Ir para o card 67', exact: true })
    .click();
  await expect(
    post.getByRole('heading', {
      name: 'Sem um teto artificial de cards',
      exact: true,
    }),
  ).toBeVisible();
  const codeIndex = backup.carousels[0].slides.findIndex((slide) =>
    slide.blocks.some((block) => block.type === 'code'),
  );
  await post.locator('.feed-slide-track').evaluate((el, index) => {
    el.scrollLeft = el.clientWidth * index;
  }, codeIndex);
  const code = post
    .locator('.feed-slide:not([inert])')
    .getByLabel('Código em typescript', { exact: true });
  await expect(code).toContainText('abstract class ExportJob');
  await code.focus();
  await code.press('ArrowRight');
  await expect(
    post.getByRole('button', {
      name: `Ir para o card ${codeIndex + 1}`,
      exact: true,
    }),
  ).toHaveAttribute('aria-current', 'step');
  await page.getByLabel('Tema', { exact: true }).selectOption('dark');
  await post.evaluate((el) => {
    const parent = el.parentElement!;
    parent.scrollTop +=
      el.getBoundingClientRect().top - parent.getBoundingClientRect().top;
  });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: testInfo.outputPath('pattern-course-code-mobile.png'),
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await context.setOffline(true);
  await page.reload();
  await page
    .getByRole('button', { name: 'Meus carrosséis', exact: true })
    .click();
  await expect(page.getByText('67 CARDS', { exact: false })).toBeVisible();
  const restored = await exportFeed(page);
  expect(restored.carousels[0]).toEqual(backup.carousels[0]);
});
