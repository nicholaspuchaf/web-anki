import { setTheme } from './theme-actions';
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
  const picker = page.getByRole('button', { name: 'Tema escuro', exact: true });
  if (await picker.isVisible()) return setTheme(page, 'dark');
  await page.getByRole('button', { name: 'Abrir menu do Feed' }).click();
  await setTheme(page, 'dark');
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
