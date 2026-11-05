import { expect, test } from '@playwright/test';
import { swipeFeed } from './feed-actions';

test('Feed ocupa a tela, menu mobile e código longo sem misturar carrosséis', async ({
  page,
}, info) => {
  await page.addInitScript(() => {
    Math.random = () => 0.999;
  });
  await page.goto('/#/feed');
  await expect(page.locator('.learning-carousel').first()).toBeVisible();
  await expect(page.locator('.app-header')).toBeHidden();
  await expect(page.locator('.app-section-nav')).toBeHidden();
  await expect(page.locator('.app-footer, .feed-backup-tools')).toHaveCount(0);
  await page.getByRole('button', { name: 'Abrir menu do Feed' }).click();
  const menu = page.getByRole('dialog', { name: 'Menu do Feed' });
  await expect(
    menu.getByRole('button', { name: 'Importar Feed' }),
  ).toBeVisible();
  await menu.getByRole('link', { name: /Flashcards/ }).click();
  await expect(page.locator('.app-header')).toBeVisible();
  await page.getByRole('link', { name: /Feed/ }).click();
  page.on('dialog', (d) => void d.accept());
  await page.getByLabel('Arquivo de backup do Feed').setInputFiles({
    name: 'viewport.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify({
        format: 'folha-feed',
        version: 1,
        progress: [],
        carousels: ['short', 'long'].map((id) => ({
          id,
          revision: 1,
          title: id,
          scope: 'Teste',
          objective: 'Ler',
          tags: [],
          intervalDays: 3,
          slides: [
            {
              id: id + '-slide',
              title: id,
              blocks: [
                id === 'short'
                  ? { id: 'p', type: 'paragraph', text: 'Uma ideia breve.' }
                  : {
                      id: 'code',
                      type: 'code',
                      language: 'typescript',
                      text: Array.from(
                        { length: 150 },
                        (_, i) => `console.log(${i});`,
                      ).join('\n'),
                    },
              ],
            },
          ],
        })),
      }),
    ),
  });
  const visible = page.locator('.feed-entry:not([hidden]) .learning-carousel');
  const stream = page.locator('.feed-stream');
  await expect(visible).toHaveCount(1);
  await expect(
    visible.getByRole('heading', { name: 'short', exact: true }),
  ).toBeVisible();
  expect(
    await visible.evaluate((el) => el.clientHeight),
  ).toBeGreaterThanOrEqual(
    (await stream.evaluate((el) => el.clientHeight)) - 2,
  );
  await page.screenshot({
    path: info.outputPath('feed-fullscreen-mobile.png'),
  });
  await swipeFeed(page, 1);
  await expect(
    visible.getByRole('heading', { name: 'long', exact: true }),
  ).toBeVisible();
  expect(await visible.evaluate((el) => el.clientHeight)).toBeGreaterThan(2000);
  await swipeFeed(page, 1);
  await expect(
    visible.getByRole('heading', { name: 'long', exact: true }),
  ).toBeVisible();
  await stream.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  await expect(
    visible.getByText('console.log(149);', { exact: false }),
  ).toHaveCount(1);
  await swipeFeed(page, 1);
  await expect(page.locator('.feed-entry:not([hidden])')).toHaveCount(1);
  await stream.evaluate((el) => {
    el.scrollTop = 0;
  });
  await swipeFeed(page, -1);
  await expect(
    visible.getByRole('heading', { name: 'long', exact: true }),
  ).toBeVisible();
  await stream.evaluate((el) => {
    el.scrollTop = 0;
  });
  await swipeFeed(page, -1);
  await expect(
    visible.getByRole('heading', { name: 'short', exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 1366, height: 900 });
  await stream.hover();
  await page.mouse.wheel(0, 1800);
  await expect(
    visible.getByRole('heading', { name: 'short', exact: true }),
  ).toBeVisible();
  await swipeFeed(page, 1);
  await expect(
    visible.getByRole('heading', { name: 'short', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Próximo carrossel', exact: true })
    .click();
  await expect(
    visible.getByRole('heading', { name: 'long', exact: true }),
  ).toBeVisible();
  await stream.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  await expect(visible.locator('pre')).toContainText('console.log(149);');
  await page.screenshot({
    path: info.outputPath('feed-long-code-desktop.png'),
  });
});
