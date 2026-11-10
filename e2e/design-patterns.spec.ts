import { setTheme } from './theme-actions';
import { expect, test } from '@playwright/test';
import catalog from '../src/content/decks/design-patterns/flashcards/index';
import assets from '../src/content/decks/design-patterns/assets.json' with { type: 'json' };

test('baralho de padrões tem oito cartões por padrão, imagens com crédito, revisão e todos os recursos offline', async ({
  page,
  context,
}, testInfo) => {
  const thirdPartyRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('refactoring.guru'))
      thirdPartyRequests.push(request.url());
  });
  await page.goto('/');
  const deck = page.getByRole('button', {
    name: /Design Patterns · Conceitos e decisões.*Abrir baralho/,
  });
  await expect(deck).toContainText('176 cartões');
  await expect(
    page.getByRole('button', {
      name: /AWS · Serviços e aplicações.*Abrir baralho/,
    }),
  ).toContainText('326 cartões');
  await deck.click();
  await expect(
    page.getByRole('button', { name: 'Excluir baralho', exact: true }),
  ).toBeDisabled();
  const search = page.getByRole('searchbox', { name: 'Buscar problema' });
  for (const pattern of catalog.patterns) {
    await page.getByLabel('Filtrar por tag').selectOption(pattern.id);
    await expect(page.locator('.problem-list-item')).toHaveCount(8);
  }
  await page.getByLabel('Filtrar por tag').selectOption('');
  await search.fill('Quem cria e quem usa?');
  await page.getByRole('button', { name: 'Favoritar cartão' }).click();
  await setTheme(page, 'dark');
  await page.getByRole('button', { name: /Revisar este baralho/ }).click();
  const original = page.getByRole('img', {
    name: 'Papéis do padrão Factory Method',
    exact: true,
  });
  await expect(original).toBeVisible();
  await expect(original).toHaveJSProperty('naturalWidth', 680);
  await expect(page.getByRole('button', { name: /Bom/ })).toHaveCount(0);
  const answer = catalog.patterns[0].cards.find(
    (entry) => entry.id === 'estrutura',
  )!.answer;
  await expect(page.getByText(answer, { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: /Estrutura ilustrada/ }).click();
  const official = page.getByRole('img', {
    name: 'Estrutura de factory method',
    exact: true,
  });
  await expect(official).toBeVisible();
  await expect(official).not.toHaveJSProperty('naturalWidth', 0);
  await expect(
    page.getByRole('link', {
      name: /Refactoring.Guru · ilustração: Dmitry Zhart/,
    }),
  ).toHaveAttribute('href', catalog.patterns[0].sourceUrl);
  await page.screenshot({
    path: testInfo.outputPath('patterns-mobile-dark.png'),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole('button', { name: /Resposta/ }).click();
  await expect(page.getByText(answer, { exact: true })).toBeVisible();
  await expect(official).toHaveCount(0);
  for (const [title, content] of [
    ['Entenda o padrão', catalog.patterns[0].explanation],
    ['Contexto e aplicação', catalog.patterns[0].background],
    [
      'Por que a resposta está certa?',
      catalog.patterns[0].cards.find((entry) => entry.id === 'estrutura')!
        .rationale,
    ],
  ]) {
    await page.getByRole('button', { name: title, exact: false }).click();
    await expect(
      page.getByText(content.split('\n\n')[0], { exact: false }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.getByRole('button', { name: /Bom/ }).click();
  await page.getByRole('button', { name: 'Voltar aos baralhos' }).click();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await context.setOffline(true);
  await page.reload();
  await deck.click();
  await search.fill('Quem cria e quem usa?');
  await expect(
    page.getByRole('button', { name: 'Remover favorito' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.problem-list-item')).toContainText('1 revisões');
  await page.getByRole('button', { name: 'Visualizar cartão' }).click();
  await expect(original).toHaveJSProperty('naturalWidth', 680);
  await page.getByRole('button', { name: /Estrutura ilustrada/ }).click();
  await expect(official).not.toHaveJSProperty('naturalWidth', 0);
  const paths = [
    ...catalog.patterns.map(
      (pattern) => `/study-assets/design-patterns/${pattern.id}-roles.svg`,
    ),
    ...assets.map((asset) => asset.src),
  ];
  const loaded = await page.evaluate(
    async (urls) =>
      Promise.all(
        urls.map(async (url) => {
          const response = await fetch(url);
          return (
            response.ok &&
            response.headers.get('content-type')?.startsWith('image/') &&
            (await response.arrayBuffer()).byteLength > 0
          );
        }),
      ),
    paths,
  );
  expect(loaded).toEqual(paths.map(() => true));
  expect(thirdPartyRequests).toEqual([]);
});
