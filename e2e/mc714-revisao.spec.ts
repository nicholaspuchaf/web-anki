import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { navigateSection } from './app-navigation';

test('MC714 novo e antigo coexistem com estudo independente, backup e funcionamento offline', async ({
  page,
  context,
}) => {
  await page.route('https://folha-api.example/**', (route) => route.abort());
  await page.goto('/');
  const old = page.getByRole('button', {
    name: /Sistemas Distribuidos - MC714 \(antigo\).*Abrir baralho/,
  });
  const fresh = page.locator('.deck-open').filter({
    has: page.getByRole('heading', {
      name: 'Sistemas Distribuidos - MC714',
      exact: true,
    }),
  });
  await expect(old).toContainText('228 cartões');
  await expect(fresh).toContainText('218 cartões');
  await old.click();
  await page
    .getByRole('searchbox', { name: 'Buscar problema' })
    .fill('No X Window System, quem é o servidor');
  await page
    .getByRole('button', { name: 'Favoritar cartão', exact: true })
    .click();
  await page.getByRole('searchbox', { name: 'Buscar problema' }).fill('');
  await page.getByRole('button', { name: /Revisar este baralho/ }).click();
  await page.getByRole('button', { name: '1 Resposta', exact: true }).click();
  await page.getByRole('button', { name: /Bom/ }).click();
  await expect(page.getByText('1 revisados · 227 restantes')).toBeVisible();
  await page.getByRole('button', { name: /Encerrar revisão/ }).click();
  await page
    .getByRole('button', {
      name: 'Revisar Sistemas Distribuidos - MC714',
      exact: true,
    })
    .click();
  await expect(page.getByText('0 revisados · 218 restantes')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: /Um programa roda no laboratório/ }),
  ).toBeVisible();
  await page.getByRole('button', { name: '1 Resposta', exact: true }).click();
  await expect(page.getByLabel('Verso selecionado')).toContainText(
    'No notebook',
  );
  await page
    .getByRole('button', { name: '2 Entenda o raciocínio', exact: true })
    .click();
  await expect(page.getByLabel('Verso selecionado')).toContainText('cliente X');
  await page.getByRole('button', { name: /Bom/ }).click();
  await expect(page.getByText('1 revisados · 217 restantes')).toBeVisible();
  await page.getByRole('button', { name: /Encerrar revisão/ }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /Exportar backup/ }).click();
  const backup = JSON.parse(
    await readFile((await (await download).path())!, 'utf8'),
  );
  expect(
    backup.cards.find(
      (c: { id: string }) => c.id === 'builtin-mc714-x-window-1',
    ),
  ).toMatchObject({ reviews: 1, favorite: true });
  expect(
    backup.cards.find(
      (c: { id: string }) => c.id === 'builtin-sd-mc714-x-window-1',
    ),
  ).toMatchObject({ reviews: 1, interval: 1 });
  await navigateSection(page, 'Configurações');
  await page
    .getByRole('checkbox', {
      name: 'Ativar Sistemas Distribuidos - MC714 (antigo)',
      exact: true,
    })
    .uncheck();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole('checkbox', {
      name: 'Ativar Sistemas Distribuidos - MC714',
      exact: true,
    }),
  ).toBeChecked();
  await navigateSection(page, 'Flashcards');
  await page
    .getByRole('button', { name: 'Meus baralhos', exact: true })
    .click();
  await expect(old).toHaveCount(0);
  await expect(fresh).toContainText('218 cartões');
  await page
    .getByRole('button', {
      name: 'Revisar Sistemas Distribuidos - MC714',
      exact: true,
    })
    .click();
  await expect(page.getByText('0 revisados · 217 restantes')).toBeVisible();
});
