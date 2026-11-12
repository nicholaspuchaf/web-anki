import { setTheme } from './theme-actions';
import { expect, test } from '@playwright/test';
import { createHandler } from '../backend/service';
import type { FlashcardStore } from '../backend/model';
import type { StoredRework, ReworkStore } from '../backend/rework';

test('Refazer confirma marcação remota, permite retry e é idempotente após reabrir o cartão', async ({
  page,
}, info) => {
  const records = new Map<string, StoredRework>();
  let fail = true;
  let writes = 0;
  const store: ReworkStore = {
    async mark(item) {
      writes++;
      if (fail)
        throw Object.assign(new Error('Throttled'), {
          name: 'ThrottlingException',
        });
      if (records.has(item.pk)) return false;
      records.set(item.pk, item);
      return true;
    },
    async list() {
      return { items: [...records.values()] };
    },
  };
  const forbidden = async () => {
    throw new Error('Não acessar biblioteca');
  };
  const cards: FlashcardStore = {
    get: forbidden,
    put: forbidden,
    changes: forbidden,
  };
  const handler = createHandler(
    cards,
    ['http://127.0.0.1:4173'],
    () => new Date('2026-11-09T12:00:00.000Z'),
    undefined,
    store,
  );
  await page.route('https://folha-api.example/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const result = await handler({
      requestContext: {
        http: { path: url.pathname, method: request.method() },
      },
      headers: request.headers(),
      body: request.postData(),
      queryStringParameters: Object.fromEntries(url.searchParams),
    });
    await route.fulfill({
      status: result.statusCode,
      body: result.body,
      headers: {
        ...result.headers,
        'access-control-allow-origin': '*',
        'access-control-allow-headers': 'content-type',
        'access-control-allow-methods': 'GET,PUT',
      },
    });
  });
  await page.goto('/');
  const open = async () => {
    await page
      .getByRole('button', { name: /Design Patterns.*Abrir baralho/ })
      .click();
    await page
      .getByRole('searchbox', { name: 'Buscar problema' })
      .fill('Quem cria e quem usa?');
    await page.getByRole('button', { name: /Revisar este baralho/ }).click();
  };
  await open();
  const button = page.getByRole('button', { name: 'Refazer', exact: true });
  const source = page.getByRole('link', {
    name: 'Consultar fonte ↗',
    exact: true,
  });
  await expect(source.locator('..')).toContainText('Refazer');
  await button.click();
  await expect(page.getByRole('alert')).toContainText('Muitas operações');
  await expect(button).toBeEnabled();
  expect(records.size).toBe(0);
  fail = false;
  await button.click();
  await expect(
    page.getByRole('button', { name: 'Marcado para refazer', exact: true }),
  ).toBeDisabled();
  await expect(page.getByRole('button', { name: /Bom/ })).toHaveCount(0);
  expect(records.size).toBe(1);
  const initial = structuredClone([...records.values()][0]);
  expect(initial.flashcard_id).toBe(
    'builtin-patterns-factory-method-estrutura',
  );
  expect(initial.question).toContain('Quem cria e quem usa?');
  await setTheme(page, 'dark');
  await page.screenshot({
    path: info.outputPath('rework-mobile-dark.png'),
    animations: 'disabled',
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.reload();
  await open();
  await button.click();
  await expect(
    page.getByRole('button', { name: 'Marcado para refazer', exact: true }),
  ).toBeDisabled();
  expect(writes).toBe(3);
  expect([...records.values()]).toEqual([initial]);
  await page.getByRole('button', { name: /Encerrar revisão/ }).click();
  await page
    .getByRole('button', {
      name: /Sistemas Distribuidos.*\(antigo\).*Abrir baralho/,
    })
    .click();
  await page.getByRole('button', { name: /Revisar este baralho/ }).click();
  await expect(
    page.getByRole('button', { name: 'Refazer', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Consultar fonte ↗', exact: true }),
  ).toHaveCount(0);
});
