import { expect, test } from '@playwright/test';
import catalog from '../src/content/aws-services.json' with { type: 'json' };
import { cloudFixture } from '../tests/helpers/cloud';

const endpoint = process.env.VITE_API_URL;
test('baralho AWS carrega automaticamente, revela três versos, mantém progresso offline e nunca envia cartões à nuvem', async ({
  page,
  context,
}, testInfo) => {
  const cloud = cloudFixture(['http://127.0.0.1:4173']);
  if (endpoint)
    await context.route(`${endpoint}/**`, async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const response = await cloud.dispatch({
        requestContext: {
          http: { method: request.method(), path: url.pathname },
        },
        headers: request.headers(),
        body: request.postData(),
        queryStringParameters: Object.fromEntries(url.searchParams),
      });
      await route.fulfill({
        status: response.statusCode,
        body: response.body,
        headers: {
          ...response.headers,
          'access-control-allow-origin': '*',
          'access-control-allow-headers': 'content-type,if-match',
          'access-control-allow-methods': 'GET,PUT,DELETE',
        },
      });
    });
  const entry = catalog.cards.find((card) => card.name === 'Amazon DynamoDB')!;
  await page.goto('/');
  const deckButton = page.getByRole('button', {
    name: /AWS · Serviços e aplicações.*Abrir baralho/,
  });
  await expect(deckButton).toBeVisible();
  await expect(deckButton).toContainText(`${catalog.cards.length} cartões`);
  await expect(
    page.getByText('0 alteração(ões) local(is) para enviar', { exact: false }),
  ).toBeVisible();
  await deckButton.click();
  await expect(
    page.getByRole('button', { name: 'Excluir baralho', exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByText('Conteúdo mantido no repositório', { exact: false }),
  ).toBeVisible();
  await expect(page.locator('.problem-list-item')).toHaveCount(50);
  await page
    .getByRole('searchbox', { name: 'Buscar problema' })
    .fill('AgentCore');
  await expect(
    page.getByRole('heading', {
      name: 'Amazon Bedrock AgentCore — Harness',
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', {
      name: 'Amazon Bedrock AgentCore — Payments',
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole('searchbox', { name: 'Buscar problema' })
    .fill('Amazon DynamoDB');
  await expect(page.locator('.problem-list-item')).toHaveCount(1);
  await expect(
    page.getByRole('button', { name: 'Editar', exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'Excluir', exact: true }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Favoritar cartão' }).click();
  await page.getByLabel('Tema', { exact: true }).selectOption('dark');
  await page.getByRole('button', { name: /Revisar este baralho/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Amazon DynamoDB', exact: true }),
  ).toBeVisible();
  await expect(page.getByText(entry.definition, { exact: true })).toHaveCount(
    0,
  );
  await expect(
    page.getByText(entry.intermediateComment, { exact: true }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: /O que é/ }).click();
  await expect(page.getByText(entry.definition, { exact: true })).toBeVisible();
  const lineCounts = await page.evaluate(
    (definitions) => {
      const paragraph = document.querySelector('.standard-face p')!;
      const style = getComputedStyle(paragraph);
      const measure = document.createElement('p');
      Object.assign(measure.style, {
        width: style.width,
        font: style.font,
        lineHeight: style.lineHeight,
        position: 'fixed',
        left: '-10000px',
        margin: '0',
      });
      document.body.append(measure);
      const counts = definitions.map((text) => {
        measure.textContent = text;
        return Math.round(
          measure.getBoundingClientRect().height / parseFloat(style.lineHeight),
        );
      });
      measure.remove();
      return counts;
    },
    catalog.cards.map((card) => card.definition),
  );
  expect(Math.max(...lineCounts)).toBeLessThanOrEqual(4);
  await page.getByRole('button', { name: /Quando usar/ }).click();
  await expect(page.getByText(entry.useCase, { exact: true })).toBeVisible();
  await expect(page.getByText(entry.definition, { exact: true })).toHaveCount(
    0,
  );
  await page.getByRole('button', { name: /Visão de pleno/ }).click();
  await expect(
    page.getByText(entry.intermediateComment, { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(entry.useCase, { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole('link', { name: 'Consultar fonte oficial' }),
  ).toHaveAttribute('href', entry.sourceUrl);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath('aws-deck-mobile-dark.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: /Bom/ }).click();
  await page.getByRole('button', { name: 'Voltar aos baralhos' }).click();
  if (endpoint) {
    await page
      .getByRole('button', { name: 'Sincronizar', exact: true })
      .click();
    await expect(page.getByRole('status')).toContainText(
      '0 alteração(ões) enviada(s)',
    );
    expect(cloud.records.size).toBe(0);
    expect(
      cloud.calls.some((call) => ['PUT', 'DELETE'].includes(call.method)),
    ).toBe(false);
    expect(cloud.calls.some((call) => call.path.includes('builtin-aws-'))).toBe(
      false,
    );
  }
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await context.setOffline(true);
  await page.reload();
  await expect(deckButton).toBeVisible();
  await expect(deckButton).toContainText(`${catalog.cards.length} cartões`);
  await deckButton.click();
  await page
    .getByRole('searchbox', { name: 'Buscar problema' })
    .fill('Amazon DynamoDB');
  await expect(page.locator('.problem-list-item')).toHaveCount(1);
  await expect(
    page.getByRole('button', { name: 'Remover favorito' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.problem-list-item')).toContainText('1 revisões');
});
