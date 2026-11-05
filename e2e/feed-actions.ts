import type { Page } from '@playwright/test';

export async function feedAction(page: Page, name: string) {
  const button = page.getByRole('button', { name, exact: true });
  if (await button.isVisible()) return button.click();
  await page.getByRole('button', { name: 'Abrir menu do Feed' }).click();
  await page
    .getByRole('dialog', { name: 'Menu do Feed' })
    .getByRole('button', { name, exact: true })
    .click();
}

export async function feedTheme(page: Page) {
  const picker = page.getByLabel('Tema', { exact: true });
  if (await picker.isVisible()) return picker.selectOption('dark');
  await page.getByRole('button', { name: 'Abrir menu do Feed' }).click();
  await page
    .getByRole('dialog', { name: 'Menu do Feed' })
    .getByLabel('Tema', { exact: true })
    .selectOption('dark');
  await page.getByRole('button', { name: 'Fechar menu', exact: true }).click();
}

export async function swipeFeed(page: Page, direction: number) {
  const stream = page.locator('.feed-stream');
  await stream.dispatchEvent('touchstart', {
    touches: [{ identifier: 1, clientX: 160, clientY: 400 }],
  });
  await stream.dispatchEvent('touchend', {
    changedTouches: [
      { identifier: 1, clientX: 160, clientY: 400 - 140 * direction },
    ],
  });
}
