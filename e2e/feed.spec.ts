import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { FeedData } from '../src/features/feed/model';

async function exportedFeed(
  page: import('@playwright/test').Page,
): Promise<FeedData> {
  const download = page.waitForEvent('download');
  await page
    .getByRole('button', { name: 'Exportar Feed', exact: true })
    .click();
  const file = await download;
  return JSON.parse(await readFile((await file.path())!, 'utf8')) as FeedData;
}

test('editor do Feed recupera rascunhos, cria blocos e imagens, preserva backup e funciona offline em mobile e desktop', async ({
  page,
  context,
}, testInfo) => {
  await page.goto('/#/feed');
  await expect(
    page.getByRole('heading', { name: 'Feed', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: '+ Novo carrossel', exact: true })
    .click();
  await page
    .getByLabel('Título do carrossel', { exact: true })
    .fill('Aprendendo filas');
  await page
    .getByLabel('Escopo', { exact: true })
    .fill('Separar produção e consumo de trabalho.');
  await page
    .getByLabel('Objetivo de aprendizado', { exact: true })
    .fill('Explicar como uma fila desacopla ritmos de processamento.');
  await page.getByLabel('Reapresentar após (dias)').fill('2');
  await page
    .getByLabel('Parágrafo 1', { exact: true })
    .fill(
      'O produtor pode receber mais trabalho do que o consumidor consegue processar agora.',
    );
  await expect(
    page
      .getByRole('status')
      .filter({ hasText: 'Rascunho salvo neste aparelho.' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Fechar', exact: true }).click();
  await page
    .getByRole('button', { name: '+ Novo carrossel', exact: true })
    .click();
  await expect(
    page.getByLabel('Título do carrossel', { exact: true }),
  ).toHaveValue('Aprendendo filas');
  await page.getByRole('button', { name: '+ Lista', exact: true }).click();
  await page
    .getByLabel('Lista 2 (um item por linha)')
    .fill('Produtor publica trabalho.\nConsumidor processa no próprio ritmo.');
  await page
    .getByLabel('Adicionar imagens ao card')
    .setInputFiles(['public/icon-192.png', 'public/icon-512.png']);
  await page
    .getByLabel('Descrição da imagem 3', { exact: true })
    .fill('Primeiro exemplo de imagem local');
  await page
    .getByLabel('Descrição da imagem 4', { exact: true })
    .fill('Segundo exemplo de imagem local');
  await page.getByRole('button', { name: /2 Como funciona/ }).click();
  await page
    .getByLabel('Parágrafo 1', { exact: true })
    .fill(
      'Uma mensagem fica disponível até ser processada conforme o contrato da fila.',
    );
  await page.getByRole('button', { name: /3 Na prática/ }).click();
  await page
    .getByLabel('Parágrafo 1', { exact: true })
    .fill(
      'Observe a idade das mensagens e planeje recuperar o atraso depois de uma falha.',
    );
  await page
    .getByRole('button', { name: 'Pré-visualizar carrossel', exact: true })
    .click();
  const dialog = page.getByRole('dialog');
  await expect(
    dialog.getByRole('heading', { name: 'O problema', exact: true }),
  ).toBeVisible();
  await dialog
    .getByRole('img', { name: 'Primeiro exemplo de imagem local' })
    .scrollIntoViewIfNeeded();
  await expect(
    dialog.getByRole('img', { name: 'Primeiro exemplo de imagem local' }),
  ).not.toHaveJSProperty('naturalWidth', 0);
  await page
    .getByRole('button', { name: 'Salvar carrossel', exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  const backup = await exportedFeed(page);
  const own = backup.carousels.find((c) => c.title === 'Aprendendo filas')!;
  expect(own.slides).toHaveLength(3);
  expect(own.intervalDays).toBe(2);
  expect(own.slides[0].blocks.map((b) => b.type)).toEqual([
    'paragraph',
    'bullets',
    'image',
    'image',
  ]);
  expect(
    backup.progress.find((p) => p.carouselId === own.id)?.completedAt ?? null,
  ).toBeNull();
  await page
    .getByRole('button', { name: 'Meus carrosséis', exact: true })
    .click();
  const item = page
    .locator('.feed-manager article')
    .filter({ hasText: 'Aprendendo filas' });
  await item.getByRole('button', { name: 'Editar', exact: true }).click();
  await page
    .getByRole('button', { name: 'Pré-visualizar carrossel', exact: true })
    .click();
  await dialog.evaluate((el) => {
    el.scrollTop = 0;
  });
  await page.screenshot({
    path: testInfo.outputPath('feed-editor-mobile.png'),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.screenshot({
    path: testInfo.outputPath('feed-editor-desktop.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Fechar', exact: true }).click();
  page.on('dialog', (confirmation) => void confirmation.accept());
  await item.getByRole('button', { name: 'Excluir', exact: true }).click();
  await expect(item).toHaveCount(0);
  await page.getByLabel('Arquivo de backup do Feed').setInputFiles({
    name: 'feed.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await expect(item).toHaveCount(1);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await context.setOffline(true);
  await page.reload();
  await page
    .getByRole('button', { name: 'Meus carrosséis', exact: true })
    .click();
  await item.getByRole('button', { name: 'Editar', exact: true }).click();
  await page
    .getByRole('button', { name: 'Pré-visualizar carrossel', exact: true })
    .click();
  await page
    .getByRole('dialog')
    .getByRole('img', { name: 'Primeiro exemplo de imagem local' })
    .scrollIntoViewIfNeeded();
  await expect(
    page
      .getByRole('dialog')
      .getByRole('img', { name: 'Primeiro exemplo de imagem local' }),
  ).not.toHaveJSProperty('naturalWidth', 0);
  await page.getByRole('button', { name: 'Fechar', exact: true }).click();
  await page.getByRole('link', { name: 'Flashcards', exact: false }).click();
  await expect(
    page.getByRole('button', {
      name: /AWS · Serviços e aplicações.*Abrir baralho/,
    }),
  ).toContainText('326 cartões');
});

test('Feed exige todos os cards, agenda retorno, permite rolagem vertical e releitura sem adiar o prazo', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const fixture: FeedData = {
    format: 'folha-feed',
    version: 1,
    progress: [],
    carousels: ['alfa', 'beta'].map((id) => ({
      id,
      revision: 1,
      title: `Conceito ${id}`,
      scope: 'Um tema específico.',
      objective: 'Explicar uma ideia nova.',
      intervalDays: 2,
      tags: ['estudo'],
      slides: [1, 2].map((i) => ({
        id: `${id}-${i}`,
        title: `Ideia ${i}`,
        blocks: [
          {
            id: `${id}-p-${i}`,
            type: 'paragraph',
            text: 'Leia esta explicação antes de seguir para o próximo card.',
          },
        ],
      })),
    })),
  };
  await page.goto('/#/feed');
  await expect(
    page.getByRole('button', { name: 'Importar Feed', exact: true }),
  ).toBeVisible();
  page.on('dialog', (dialog) => void dialog.accept());
  await page.getByLabel('Arquivo de backup do Feed').setInputFiles({
    name: 'fixture.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(fixture)),
  });
  await expect(page.getByText('2 para hoje', { exact: false })).toBeVisible();
  await expect(
    page.locator('.feed-guide, .feed-post-header, .feed-learning-goal'),
  ).toHaveCount(0);
  const posts = page.locator('.feed-stream .learning-carousel');
  const first = posts.nth(0);
  await first
    .locator('.feed-slide:not([inert]) .feed-read-marker')
    .scrollIntoViewIfNeeded();
  await expect(first.getByRole('status')).toContainText('1 de 2 cards lidos');
  await expect(page.getByText('2 para hoje', { exact: false })).toBeVisible();
  await first
    .getByRole('button', { name: 'Próximo card', exact: true })
    .click();
  await expect(
    first.getByRole('button', { name: 'Ir para o card 2' }),
  ).toHaveAttribute('aria-current', 'step');
  await expect
    .poll(() =>
      first
        .locator('.feed-slide-track')
        .evaluate((el) => Math.abs(el.scrollLeft - el.clientWidth)),
    )
    .toBeLessThan(2);
  await first
    .locator('.feed-slide:not([inert]) .feed-read-marker')
    .scrollIntoViewIfNeeded();
  await expect(first.getByRole('status')).toContainText('Carrossel concluído');
  const stream = page.getByRole('region', { name: 'Feed de aprendizado' });
  await page.locator('.feed-stream').evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect(posts.nth(1)).toBeAttached();
  const second = posts.nth(1);
  await second
    .locator('.feed-slide:not([inert]) .feed-read-marker')
    .scrollIntoViewIfNeeded();
  await expect(second.getByRole('status')).toContainText('1 de 2 cards lidos');
  await second
    .getByRole('button', { name: 'Próximo card', exact: true })
    .click();
  await expect(
    second.getByRole('button', { name: 'Ir para o card 2' }),
  ).toHaveAttribute('aria-current', 'step');
  await expect
    .poll(() =>
      second
        .locator('.feed-slide-track')
        .evaluate((el) => Math.abs(el.scrollLeft - el.clientWidth)),
    )
    .toBeLessThan(2);
  await second
    .locator('.feed-slide:not([inert]) .feed-read-marker')
    .scrollIntoViewIfNeeded();
  await expect(second.getByRole('status')).toContainText('Carrossel concluído');
  await expect(page.getByText('0 para hoje', { exact: false })).toBeVisible();
  const before = await exportedFeed(page);
  expect(before.progress).toHaveLength(2);
  expect(
    before.progress.every(
      (p) => p.nextDueAt! - p.completedAt! === 2 * 86_400_000,
    ),
  ).toBe(true);
  await page.locator('.feed-stream').evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect(posts.nth(2)).toBeAttached();
  await posts
    .nth(2)
    .locator('.feed-slide:not([inert]) .feed-read-marker')
    .scrollIntoViewIfNeeded();
  await expect(posts.nth(2).getByRole('status')).toContainText(
    'Carrossel concluído',
  );
  await first.scrollIntoViewIfNeeded();
  await expect(
    first.getByRole('button', { name: 'Ir para o card 2' }),
  ).toHaveAttribute('aria-current', 'step');
  const after = await exportedFeed(page);
  expect(after.progress).toEqual(before.progress);
  await page.getByLabel('Tema', { exact: true }).selectOption('dark');
  await first.getByRole('button', { name: 'Ir para o card 2' }).click();
  await expect
    .poll(() =>
      first
        .locator('.feed-slide-track')
        .evaluate((el) => Math.abs(el.scrollLeft - el.clientWidth)),
    )
    .toBeLessThan(2);
  await first.evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await page.evaluate(() => window.scrollTo(0, 0));

  await page.screenshot({
    path: testInfo.outputPath('feed-mobile-dark.png'),
    fullPage: false,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect
    .poll(() =>
      first
        .locator('.feed-slide-track')
        .evaluate((el) => Math.abs(el.scrollLeft - el.clientWidth)),
    )
    .toBeLessThan(2);
  await expect(
    page.getByRole('button', { name: 'Li este card', exact: true }),
  ).toHaveCount(0);
  await page.setViewportSize({ width: 1280, height: 900 });
  expect(
    await page
      .locator('.feed-topbar')
      .evaluate((el) => el.getBoundingClientRect().height),
  ).toBeLessThan(70);
  await first.evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await page
    .getByRole('button', { name: 'Próximo carrossel', exact: true })
    .click();
  await expect
    .poll(() =>
      second.evaluate((el) =>
        Math.abs(
          el.getBoundingClientRect().top -
            el.parentElement!.getBoundingClientRect().top,
        ),
      ),
    )
    .toBeLessThan(12);
  await page
    .getByRole('button', { name: 'Carrossel anterior', exact: true })
    .click();
  await expect
    .poll(() =>
      first.evaluate((el) =>
        Math.abs(
          el.getBoundingClientRect().top -
            el.parentElement!.getBoundingClientRect().top,
        ),
      ),
    )
    .toBeLessThan(12);
  await page.screenshot({
    path: testInfo.outputPath('feed-desktop-navigation.png'),
    fullPage: false,
  });
  await page.clock.setFixedTime(
    new Date(Math.max(...before.progress.map((p) => p.nextDueAt!)) + 1),
  );
  await page.reload();
  await expect(page.getByText('2 para hoje', { exact: false })).toBeVisible();
  await expect(stream).toHaveCount(1);
});
