import { expect, test } from '@playwright/test';
import { cloudFixture, START } from '../tests/helpers/cloud';
import type { CardContent } from '../src/features/sync/model';

const endpoint = process.env.VITE_API_URL;
test('sincroniza cartões com o backend real, persiste checkpoint e resolve conflitos sem perder edição local', async ({
  page,
  context,
}) => {
  test.skip(!endpoint, 'Configure VITE_API_URL no build e no teste.');
  await page.clock.setFixedTime(new Date(START));
  const cloud = cloudFixture(['http://127.0.0.1:4173']);
  const content: CardContent = {
    card: {
      id: 'c',
      deckId: 'd',
      front: 'Two Sum',
      back: 'Hash map',
      due: 0,
      interval: 0,
      reviews: 0,
    },
    deck: { id: 'd', name: 'Nuvem' },
  };
  await cloud.api.put('c', content, 0);
  await context.route(`${endpoint}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const result = await cloud.dispatch({
      requestContext: {
        http: { method: request.method(), path: url.pathname },
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
        'access-control-allow-headers': 'content-type,if-match',
        'access-control-allow-methods': 'GET,PUT,DELETE',
      },
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Sincronizar', exact: true }).click();
  await expect(page.getByRole('status')).toContainText(
    'Sincronização concluída',
  );
  await expect(
    page.getByRole('button', { name: /Nuvem.*Abrir baralho/ }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: /Nuvem.*Abrir baralho/ }).click();
  await page.getByRole('button', { name: 'Editar', exact: true }).click();
  await page
    .getByLabel('Verso · resposta (opcional)')
    .fill('Minha solução offline');
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: '← Todos os baralhos' }).click();
  cloud.advance();
  await cloud.api.put(
    'c',
    { ...content, card: { ...content.card, back: 'Outra pessoa editou' } },
    1,
  );
  await page.getByRole('button', { name: 'Sincronizar', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Conflito: Two Sum' }),
  ).toBeVisible();
  expect(
    cloud.calls.filter((call) => call.path === '/sync').at(-1)?.query.since,
  ).toBeTruthy();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Conflito: Two Sum' }),
  ).toBeVisible();
  await page.getByText('Minha versão', { exact: true }).click();
  await expect(page.locator('.sync-conflict-preview').first()).toContainText(
    'Minha solução offline',
  );
  await page.getByRole('button', { name: 'Manter minha alteração' }).click();
  await expect(
    page.getByRole('heading', { name: 'Conflito: Two Sum' }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Sincronizar', exact: true }).click();
  await expect(page.getByRole('status')).toContainText(
    '1 alteração(ões) enviada(s)',
  );
  expect(cloud.records.get('c')).toMatchObject({
    version: 3,
    card: { back: 'Minha solução offline' },
  });
  await page.getByRole('button', { name: /Nuvem.*Abrir baralho/ }).click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Excluir', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Two Sum', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: '← Todos os baralhos' }).click();
  await page.getByRole('button', { name: 'Sincronizar', exact: true }).click();
  await expect(page.getByRole('status')).toContainText(
    '1 alteração(ões) enviada(s)',
  );
  expect(cloud.records.get('c')?.deleted_at).not.toBeNull();
  expect(cloud.calls.filter((call) => call.method === 'DELETE')).toHaveLength(
    1,
  );
  expect(cloud.calls.some((call) => call.path === '/library')).toBe(false);
  await context.setOffline(true);
  await expect(
    page.getByRole('button', { name: 'Sincronizar', exact: true }),
  ).toBeDisabled();
});
