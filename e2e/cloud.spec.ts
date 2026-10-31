import { expect, test } from '@playwright/test';
import type { Library } from '../src/features/library/model';

const endpoint = process.env.VITE_API_URL;
test('sincronização pública baixa dados, publica alterações e preserva conflitos', async ({
  page,
}) => {
  test.skip(
    !endpoint,
    'Configure VITE_API_URL no build e no teste para validar a sincronização.',
  );
  let library: Library = {
    version: 1,
    decks: [{ id: 'd', name: 'Nuvem' }],
    cards: [],
  };
  let revision = '12345678-1234-1234-1234-123456789abc';
  await page.route(`${endpoint}/library`, async (route) => {
    const request = route.request();
    const headers = {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'content-type,if-match',
      'access-control-allow-methods': 'GET,PUT',
    };
    if (request.method() === 'OPTIONS')
      return route.fulfill({ status: 204, headers });
    if (request.method() === 'GET')
      return route.fulfill({
        json: { revision, updatedAt: null, library },
        headers,
      });
    if (request.headers()['if-match'] !== revision)
      return route.fulfill({
        status: 409,
        json: { error: 'Alterada em outro aparelho. Verifique novamente.' },
        headers,
      });
    library = request.postDataJSON();
    revision = crypto.randomUUID();
    return route.fulfill({
      json: { revision, updatedAt: '2026-10-31T00:00:00Z' },
      headers,
    });
  });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Biblioteca pública compartilhada' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Verificar nuvem' }).click();
  await expect(
    page.getByRole('button', { name: '↓ Baixar biblioteca' }),
  ).toBeEnabled();
  await page.getByRole('button', { name: '↓ Baixar biblioteca' }).click();
  await expect(
    page.getByRole('button', { name: /Nuvem.*Abrir baralho/ }),
  ).toBeVisible();
  await page.getByRole('button', { name: '+ Novo baralho' }).click();
  await page.getByLabel('Nome do baralho').fill('Somente local');
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  revision = crypto.randomUUID();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: '↑ Enviar biblioteca' }).click();
  await expect(page.getByRole('alert')).toContainText(
    'Alterada em outro aparelho',
  );
  await expect(
    page.getByRole('button', { name: /Somente local.*Abrir baralho/ }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Verificar nuvem' }).click();
  await expect(
    page.getByRole('button', { name: '↑ Enviar biblioteca' }),
  ).toBeEnabled();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: '↑ Enviar biblioteca' }).click();
  await expect(page.getByRole('status')).toContainText('Biblioteca publicada');
  expect(library.decks.map((deck) => deck.name)).toEqual([
    'Nuvem',
    'Somente local',
  ]);
});
