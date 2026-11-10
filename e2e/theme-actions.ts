import type { Page } from '@playwright/test';
export async function setTheme(page: Page, theme: 'light' | 'dark') {
  const button = page.getByRole('button', { name: 'Tema escuro', exact: true });
  if ((await button.getAttribute('aria-pressed')) !== String(theme === 'dark'))
    await button.click();
}
