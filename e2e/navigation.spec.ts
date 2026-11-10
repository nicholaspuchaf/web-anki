import { expect, test } from '@playwright/test';
import { navigateSection } from './app-navigation';

test('menu lateral mobile navega por todas as páginas e subpáginas, fecha com Escape e preserva abas no desktop', async ({
  page,
}, info) => {
  await page.goto('/');
  await expect(page.locator('.app-section-nav')).toBeHidden();
  await page
    .getByRole('button', { name: /Design Patterns.*Abrir baralho/ })
    .click();
  await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
  const drawer = page.getByRole('dialog', { name: 'Menu do aplicativo' });
  await expect(drawer).toBeVisible();
  const bounds = await drawer.boundingBox();
  expect(bounds!.x).toBe(0);
  await expect(drawer.getByRole('link')).toHaveCount(4);
  await page.screenshot({
    path: info.outputPath('mobile-drawer.png'),
    animations: 'disabled',
  });
  await page.keyboard.press('Escape');
  await expect(drawer).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Abrir menu', exact: true }),
  ).toBeFocused();
  for (const [section, heading] of [
    ['Administração', 'Administração dos flashcards'],
    ['Configurações', 'Configurações'],
  ]) {
    await navigateSection(page, section);
    await expect(
      page.getByRole('heading', { name: heading, exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  }
  await navigateSection(page, 'Feed');
  await page.getByRole('button', { name: 'Abrir menu do Feed' }).click();
  const feedDrawer = page.getByRole('dialog', { name: 'Menu do Feed' });
  expect((await feedDrawer.boundingBox())!.x).toBe(0);
  await feedDrawer
    .getByRole('button', { name: 'Tema escuro', exact: true })
    .click();
  await feedDrawer
    .getByRole('link', { name: 'Flashcards', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Revisão de cartões', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Tema escuro', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  const review = page.getByRole('button', {
    name: 'Revisar Design Patterns · Conceitos e decisões',
    exact: true,
  });
  const box = await review.boundingBox();
  const tile = await review.locator('..').boundingBox();
  expect(box!.width).toBeLessThan(tile!.width / 2);
  const footer = await review
    .locator('..')
    .locator('.deck-bottom')
    .boundingBox();
  expect(box!.y + box!.height).toBeLessThanOrEqual(footer!.y);
  await review.click();
  await expect(
    page.getByRole('button', { name: 'Abrir menu', exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(page.locator('.app-section-nav')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Abrir menu', exact: true }),
  ).toBeHidden();
});
