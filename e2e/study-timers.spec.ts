import { expect, test } from '@playwright/test';

test('cronômetros acumulam sessão, reiniciam por cartão e pausam fora da revisão ou com aba oculta', async ({
  page,
}, info) => {
  await page.goto('/#/settings');
  await expect(
    page.getByRole('heading', { name: 'Configurações', exact: true }),
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
  const session = page.getByLabel('Tempo total da sessão', { exact: true });
  const card = page.getByLabel('Tempo do cartão atual', { exact: true });
  await expect(session).toHaveText('00:00');
  await page.clock.runFor(5000);
  await expect(session).toHaveText('00:05');
  await expect(card).toHaveText('00:05');
  await page.getByRole('button', { name: '1 Resposta', exact: true }).click();
  await page.clock.runFor(3000);
  await expect(card).toHaveText('00:08');
  await page.getByRole('button', { name: /Bom/ }).click();
  await expect(card).toHaveText('00:00');
  await expect(session).toHaveText('00:08');
  await page.clock.runFor(2000);
  await expect(session).toHaveText('00:10');
  await expect(card).toHaveText('00:02');
  await page.evaluate(() => {
    window.location.hash = '/settings';
  });
  await expect(
    page.getByRole('heading', { name: 'Configurações', exact: true }),
  ).toBeVisible();
  await page.clock.runFor(10000);
  await page.evaluate(() => {
    window.location.hash = '/';
  });
  await expect(session).toHaveText('00:10');
  await expect(card).toHaveText('00:02');
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.clock.runFor(10000);
  await expect(session).toHaveText('00:10');
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.clock.runFor(1000);
  await expect(session).toHaveText('00:11');
  await expect(card).toHaveText('00:03');
  await page.screenshot({
    path: info.outputPath('study-timers-mobile.png'),
    animations: 'disabled',
  });
  const left = await session.boundingBox();
  const right = await card.boundingBox();
  expect(left!.x).toBeLessThan(right!.x);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole('button', { name: /Encerrar revisão/ }).click();
  await begin.click();
  await expect(session).toHaveText('00:00');
  await expect(card).toHaveText('00:00');
});
