import { setTheme } from './theme-actions';
import { navigateSection } from './app-navigation';
import { feedAction } from './feed-actions';
import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('configurações ativam baralhos nos dois formatos sem apagar revisões, favoritos ou backups', async ({
  page,
  context,
}, info) => {
  await page.route('https://folha-api.example/**', (route) => route.abort());
  await page.goto('/');
  const patterns = page.getByRole('button', {
    name: /Design Patterns.*Abrir baralho/,
  });
  await patterns.click();
  await page
    .getByRole('searchbox', { name: 'Buscar problema' })
    .fill('Quem cria e quem usa?');
  await page.getByRole('button', { name: 'Favoritar cartão' }).click();
  await page.getByRole('button', { name: /Revisar este baralho/ }).click();
  await page.getByRole('button', { name: /Resposta/ }).click();
  await page.getByRole('button', { name: /Bom/ }).click();
  await navigateSection(page, 'Configurações');
  const patternToggle = page.getByRole('checkbox', {
    name: 'Ativar Design Patterns · Conceitos e decisões',
    exact: true,
  });
  const awsToggle = page.getByRole('checkbox', {
    name: 'Ativar AWS · Serviços e aplicações',
    exact: true,
  });
  const mcToggle = page.getByRole('checkbox', {
    name: 'Ativar Sistemas Distribuidos - MC714',
    exact: true,
  });
  const generalToggle = page.getByRole('checkbox', {
    name: 'Ativar Aprendizado geral',
    exact: true,
  });
  await expect(page.getByRole('checkbox')).toHaveCount(4);
  await expect(patternToggle.locator('..')).toContainText(
    '176 flashcards · 22 carrosséis',
  );
  await expect(awsToggle.locator('..')).toContainText(
    '326 flashcards · 0 carrosséis',
  );
  await expect(mcToggle.locator('..')).toContainText(
    '228 flashcards · 7 carrosséis',
  );
  await patternToggle.uncheck();
  await awsToggle.uncheck();
  await generalToggle.uncheck();
  await setTheme(page, 'dark');
  await page.screenshot({
    path: info.outputPath('settings-mobile-dark.png'),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.reload();
  await expect(patternToggle).not.toBeChecked();
  await expect(mcToggle).toBeChecked();
  await navigateSection(page, 'Flashcards');
  await page.getByRole('button', { name: 'Meus baralhos' }).click();
  await expect(patterns).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: /AWS.*Abrir baralho/ }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: /Revisar agora/ }).click();
  await expect(page.getByText('0 revisados · 228 restantes')).toBeVisible();
  await page.getByRole('button', { name: 'Resposta', exact: false }).click();
  await page.getByRole('button', { name: /Bom/ }).click();
  await page.getByRole('button', { name: /Encerrar revisão/ }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /Exportar backup/ }).click();
  const backup = JSON.parse(
    await readFile((await (await download).path())!, 'utf8'),
  );
  expect(
    backup.cards.filter(
      (card: { deckId: string }) => card.deckId === 'builtin-patterns-design',
    ),
  ).toHaveLength(176);
  expect(
    backup.cards.find(
      (card: { id: string }) =>
        card.id === 'builtin-patterns-factory-method-estrutura',
    ),
  ).toMatchObject({ reviews: 1, favorite: true });
  await navigateSection(page, 'Feed');
  await feedAction(page, 'Meus carrosséis');
  await expect(page.getByLabel('Baralho para estudar')).not.toContainText(
    'Design Patterns',
  );
  await expect(page.getByLabel('Baralho para estudar')).not.toContainText(
    'Aprendizado geral',
  );
  await expect(page.locator('.feed-manager article')).toHaveCount(7);
  await page.getByRole('button', { name: 'Abrir menu do Feed' }).click();
  await page
    .getByRole('dialog')
    .getByRole('link', { name: /Configurações/ })
    .click();
  await patternToggle.check();
  await navigateSection(page, 'Flashcards');
  await page.getByRole('button', { name: 'Meus baralhos' }).click();
  await patterns.click();
  await expect(
    page.getByRole('button', { name: 'Remover favorito' }),
  ).toBeVisible();
  await expect(
    page
      .locator('.problem-list-item')
      .filter({ hasText: 'Quem cria e quem usa?' }),
  ).toContainText('1 revisões');
  await navigateSection(page, 'Configurações');
  const other = await context.newPage();
  await other.goto('/#/settings');
  await other
    .getByRole('checkbox', {
      name: 'Ativar Design Patterns · Conceitos e decisões',
      exact: true,
    })
    .uncheck();
  await expect(patternToggle).not.toBeChecked();
  await other.close();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await context.setOffline(true);
  await page.reload();
  await expect(patternToggle).not.toBeChecked();
  await patternToggle.check();
  await expect(patternToggle).toBeChecked();
  await navigateSection(page, 'Feed');
  await feedAction(page, 'Meus carrosséis');
  await expect(page.locator('.feed-manager article')).toHaveCount(29);
  await page.getByRole('button', { name: 'Abrir menu do Feed' }).click();
  await page
    .getByRole('dialog')
    .getByRole('link', { name: /Configurações/ })
    .click();
  await patternToggle.uncheck();
  await mcToggle.uncheck();
  await navigateSection(page, 'Flashcards');
  await page.getByRole('button', { name: 'Meus baralhos' }).click();
  await expect(page.locator('.deck-grid .deck')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: /Revisar agora/ }),
  ).toBeDisabled();
  await navigateSection(page, 'Feed');
  await expect(
    page.getByRole('heading', { name: 'Sem carrosséis ativos' }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Configurar baralhos' }),
  ).toBeVisible();
});

test('falha ao salvar preferências mantém o checkbox anterior e todos os baralhos', async ({
  page,
}) => {
  await page.goto('/#/settings');
  const toggle = page.getByRole('checkbox', {
    name: 'Ativar AWS · Serviços e aplicações',
    exact: true,
  });
  await expect(toggle).toBeChecked();
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'folha:settings:v1')
        throw new DOMException('Sem espaço', 'QuotaExceededError');
      return original.call(this, key, value);
    };
  });
  await toggle.click();
  await expect(
    page.getByText(/Não foi possível salvar a configuração/),
  ).toBeVisible();
  await expect(toggle).toBeChecked();
});
