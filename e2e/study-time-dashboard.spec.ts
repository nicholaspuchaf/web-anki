import { patternProblemQuestion } from './patterns-fixture';
import { expect, test } from '@playwright/test';
import { navigateSection } from './app-navigation';

test('administração agrega tempo por dia e cartão, mantém estudos sem avaliação, funciona offline e atualiza entre abas', async ({
  page,
  context,
}, info) => {
  await page.goto('/#/admin');
  await expect(
    page.getByRole('heading', { name: 'Tempo de estudo por dia', exact: true }),
  ).toBeVisible();
  await page.clock.install({ time: new Date('2026-11-10T12:00:00Z') });
  await page.clock.pauseAt(new Date('2026-11-10T12:00:01Z'));
  await page
    .getByRole('button', { name: 'Meus baralhos', exact: true })
    .click();
  const begin = page.getByRole('button', {
    name: 'Revisar Design Patterns · Conceitos e decisões',
    exact: true,
  });
  await begin.click();
  await page.clock.runFor(6000);
  await page.getByRole('button', { name: '1 Resposta', exact: true }).click();
  await page.getByRole('button', { name: /Bom/ }).click();
  await expect(
    page.getByLabel('Tempo do cartão atual', { exact: true }),
  ).toHaveText('00:00');
  await page.clock.runFor(4000);
  await page.getByRole('button', { name: /Encerrar revisão/ }).click();
  await navigateSection(page, 'Administração');
  const stats = page.getByLabel('Resumo do tempo de estudo');
  await expect(stats.locator('article').nth(0)).toContainText('00:10');
  await expect(stats.locator('article').nth(1)).toContainText('00:05');
  const table = page.locator('.admin-panel').filter({
    has: page.getByRole('heading', {
      name: 'Tempo por flashcard',
      exact: true,
    }),
  });
  await expect(table.locator('tbody tr')).toHaveCount(2);
  await page
    .getByRole('button', { name: 'Meus baralhos', exact: true })
    .click();
  await begin.click();
  await page.clock.runFor(8000);
  await page.getByRole('button', { name: /Encerrar revisão/ }).click();
  await navigateSection(page, 'Administração');
  await expect(stats.locator('article').nth(0)).toContainText('00:18');
  await expect(stats.locator('article').nth(1)).toContainText('00:06');
  const row = table
    .locator('tbody tr')
    .filter({ hasText: patternProblemQuestion });
  await expect(row).toContainText('00:12');
  await expect(row.locator('td').nth(2)).toHaveText('2');
  await expect(row.locator('td').nth(3)).toHaveText('00:06');
  await page.clock.resume();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await context.setOffline(true);
  await page.reload();
  await expect(stats.locator('article').nth(0)).toContainText('00:18');
  await expect(row.locator('td').nth(3)).toHaveText('00:06');
  const other = await context.newPage();
  await other.clock.setFixedTime(new Date('2026-11-10T12:00:30Z'));
  await other.goto('/');
  await other.evaluate(() => {
    const prefix = 'folha:study-time:v1:';
    const key = Object.keys(localStorage).find((value) =>
      value.startsWith(prefix),
    )!;
    const previous = JSON.parse(localStorage.getItem(key)!);
    const record = { ...previous, id: 'another-tab', durationMs: 2000 };
    localStorage.setItem(
      `${prefix}${record.id}:${record.day}`,
      JSON.stringify(record),
    );
  });
  await expect(stats.locator('article').nth(0)).toContainText('00:20');
  await other.close();
  await page
    .getByLabel('Baralho do dashboard')
    .selectOption('builtin-aws-services');
  await expect(stats.locator('article').nth(0)).toContainText('00:00');
  await page
    .getByLabel('Baralho do dashboard')
    .selectOption('builtin-patterns-design');
  await expect(stats.locator('article').nth(0)).toContainText('00:20');
  await page.screenshot({
    path: info.outputPath('study-time-mobile.png'),
    fullPage: true,
    animations: 'disabled',
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
