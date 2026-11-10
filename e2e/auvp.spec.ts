import { expect, test } from '@playwright/test';
import { navigateSection } from './app-navigation';

test('AUVP carrega 250 cartões com tags e páginas, preserva revisão offline e pode ser desativado', async ({
  page,
  context,
}) => {
  await page.goto('/');
  const deck = page.getByRole('button', {
    name: /AUVP - Renda Fixa.*Abrir baralho/,
  });
  await expect(deck).toContainText('250 cartões');
  await deck.click();
  await page.getByLabel('Filtrar por tag').selectOption('aula-06');
  await expect(page.locator('.problem-list-item')).toHaveCount(7);
  await page
    .getByRole('searchbox', { name: 'Buscar problema' })
    .fill('qual é a composição nominal exata');
  await expect(page.locator('.problem-list-item')).toHaveCount(1);
  await page
    .getByRole('button', { name: 'Favoritar cartão', exact: true })
    .click();
  await page.getByRole('button', { name: /Revisar este baralho/ }).click();
  await page.getByRole('button', { name: '1 Resposta', exact: true }).click();
  await expect(
    page.getByText(/14,45%, antes de custos e impostos/),
  ).toBeVisible();
  await page.getByRole('button', { name: /Origem no material/ }).click();
  await expect(page.getByText(/Página\(s\): 18/)).toBeVisible();
  await page.getByRole('button', { name: /Bom/ }).click();
  await page
    .getByRole('button', { name: 'Voltar aos baralhos', exact: true })
    .click();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await context.setOffline(true);
  await page.reload();
  await deck.click();
  await page
    .getByRole('searchbox', { name: 'Buscar problema' })
    .fill('qual é a composição nominal exata');
  await expect(page.locator('.problem-list-item')).toContainText('1 revisões');
  await expect(
    page.getByRole('button', { name: 'Remover favorito', exact: true }),
  ).toBeVisible();
  await navigateSection(page, 'Configurações');
  const toggle = page.getByRole('checkbox', {
    name: 'Ativar AUVP - Renda Fixa',
    exact: true,
  });
  await expect(toggle.locator('..')).toContainText(
    '250 flashcards · 0 carrosséis',
  );
  await toggle.uncheck();
  await navigateSection(page, 'Flashcards');
  await expect(deck).toHaveCount(0);
  await navigateSection(page, 'Configurações');
  await toggle.check();
  await navigateSection(page, 'Flashcards');
  await deck.click();
  await page
    .getByRole('searchbox', { name: 'Buscar problema' })
    .fill('qual é a composição nominal exata');
  await expect(page.locator('.problem-list-item')).toContainText('1 revisões');
});
