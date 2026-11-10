import type { Page } from '@playwright/test';

export async function navigateSection(page: Page, name: string) {
  const link = page.getByRole('link', { name, exact: true });
  if (!(await link.isVisible())) {
    const menu = page.getByRole('button', { name: 'Abrir menu', exact: true });
    if (await menu.isVisible()) await menu.click();
    else await page.getByRole('button', { name: 'Abrir menu do Feed' }).click();
  }
  await link.click();
}
