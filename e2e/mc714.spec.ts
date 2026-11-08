import { expect, test } from '@playwright/test';
import { feedAction } from './feed-actions';
import { readFile } from 'node:fs/promises';

test('MC714 instala conteúdo local e aplica tags obrigatórias com uma avaliação por recurso', async ({
  page,
  context,
}, info) => {
  const api: string[] = [];
  await page.route('https://folha-api.example/**', (route) => {
    api.push(route.request().url());
    return route.abort();
  });
  await page.goto('/');
  const deck = page.getByRole('button', {
    name: /Sistemas Distribuidos - MC714.*Abrir baralho/,
  });
  await expect(deck).toContainText('168 cartões');
  await deck.click();
  await page
    .getByRole('button', { name: '+ Novo cartão', exact: true })
    .click();
  await expect(
    page.getByText('sistemas-distribuidos · unicamp · mc714', { exact: true }),
  ).toBeVisible();
  await page.getByLabel('Template', { exact: true }).selectOption('basic');
  await page.getByLabel('Avaliação', { exact: true }).selectOption('p1');
  await page
    .getByLabel('Tags adicionais (separadas por vírgula)', { exact: true })
    .fill('latencia, revisao');
  await page.getByLabel('Frente · pergunta').fill('Minha revisão de P1');
  await page
    .getByLabel('Verso · resposta')
    .fill('Resposta pessoal preservada.');
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText(/^169 cartões ·/)).toBeVisible();
  await page.reload();
  await deck.click();
  await page
    .getByRole('searchbox', { name: 'Buscar problema' })
    .fill('Minha revisão de P1');
  await expect(
    page.getByText('Minha revisão de P1', { exact: true }),
  ).toBeVisible();
  const waitCards = page.waitForEvent('download');
  await page
    .getByRole('button', { name: 'Todos os baralhos', exact: false })
    .click();
  await page.getByRole('button', { name: /Exportar backup/ }).click();
  const cards = JSON.parse(
    await readFile((await (await waitCards).path())!, 'utf8'),
  );
  const own = cards.cards.find(
    (c: { front: string }) => c.front === 'Minha revisão de P1',
  );
  expect(own.tags).toEqual(
    expect.arrayContaining([
      'sistemas-distribuidos',
      'unicamp',
      'mc714',
      'p1',
      'latencia',
      'revisao',
    ]),
  );
  expect(own.tags).not.toContain('p2');
  await deck.click();
  await page
    .getByRole('button', { name: 'Carrosséis deste baralho', exact: true })
    .click();
  await expect(page.locator('.feed-manager article')).toHaveCount(7);
  await expect(
    page.getByLabel('Baralho para estudar').locator('option:checked'),
  ).toContainText('169 flashcards');
  const wan = page.locator('.feed-manager article').filter({
    has: page.getByRole('heading', {
      name: 'X em WANs · O custo das esperas',
      exact: true,
    }),
  });
  await wan.getByRole('button', { name: 'Editar', exact: true }).click();
  await expect(page.getByLabel('Avaliação', { exact: true })).toHaveValue('p2');
  await page.getByLabel('Avaliação', { exact: true }).selectOption('p3');
  await page
    .getByLabel('Tags adicionais (separadas por vírgula)', { exact: true })
    .fill('latencia, contas');
  await page.screenshot({ path: info.outputPath('mc714-tags-mobile.png') });
  await page
    .getByRole('button', { name: 'Salvar carrossel', exact: true })
    .click();
  const waitFeed = page.waitForEvent('download');
  await feedAction(page, 'Exportar Feed');
  const feed = JSON.parse(
    await readFile((await (await waitFeed).path())!, 'utf8'),
  );
  const updated = feed.carousels.find(
    (c: { id: string }) => c.id === 'feed-mc714-x-wan',
  );
  expect(updated.tags).toEqual(
    expect.arrayContaining([
      'sistemas-distribuidos',
      'unicamp',
      'mc714',
      'p3',
      'latencia',
      'contas',
    ]),
  );
  expect(updated.tags).not.toContain('p2');
  const roles = page.locator('.feed-manager article').filter({
    has: page.getByRole('heading', {
      name: 'X Window System · Quem serve quem?',
      exact: true,
    }),
  });
  await roles
    .getByRole('button', { name: 'Estudar carrossel', exact: true })
    .click();
  const visible = page.locator('.feed-entry:not([hidden]) .learning-carousel');
  await visible
    .getByRole('button', { name: 'Próximo card', exact: true })
    .click();
  const image = visible.getByRole('img', {
    name: /Servidor X na máquina do usuário/,
  });
  await image.scrollIntoViewIfNeeded();
  await expect(image).not.toHaveJSProperty('naturalWidth', 0);
  await page.screenshot({ path: info.outputPath('mc714-x-mobile.png') });
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.feed-manager article')).toHaveCount(7);
  await wan.getByRole('button', { name: 'Editar', exact: true }).click();
  await expect(page.getByLabel('Avaliação', { exact: true })).toHaveValue('p3');
  expect(api).toEqual([]);
});
