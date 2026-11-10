import { expect, test } from '@playwright/test';

test('atalho da página inicial revisa só o baralho escolhido e fica desabilitado quando não há pendências', async ({
  page,
}, info) => {
  await page.clock.setFixedTime(new Date('2026-11-09T12:00:00.000Z'));
  await page.goto('/');
  await page
    .getByRole('button', {
      name: 'Revisar Design Patterns · Conceitos e decisões',
      exact: true,
    })
    .click();
  await expect(page.getByText('0 revisados · 176 restantes')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: /Factory Method/ }),
  ).toBeVisible();
  await page.getByRole('button', { name: /Encerrar revisão/ }).click();
  await page
    .getByRole('button', {
      name: 'Revisar Sistemas Distribuidos - MC714',
      exact: true,
    })
    .click();
  await expect(page.getByText('0 revisados · 228 restantes')).toBeVisible();
  await page.getByRole('button', { name: /Encerrar revisão/ }).click();
  await page
    .getByRole('button', { name: '+ Novo baralho', exact: true })
    .click();
  await page.getByLabel('Nome do baralho').fill('Revisão direta');
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  const shortcut = page.getByRole('button', {
    name: 'Revisar Revisão direta',
    exact: true,
  });
  const open = page.getByRole('button', {
    name: /Revisão direta.*Abrir baralho/,
  });
  await expect(shortcut).toBeDisabled();
  await open.click();
  await page
    .getByRole('button', { name: '+ Novo cartão', exact: true })
    .click();
  await page.getByLabel('Template', { exact: true }).selectOption('basic');
  await page
    .getByLabel('Frente · pergunta', { exact: true })
    .fill('Uma revisão apenas deste baralho');
  await page
    .getByLabel('Verso · resposta (opcional)', { exact: true })
    .fill('Resposta de teste');
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await page.getByRole('button', { name: /Todos os baralhos/ }).click();
  await expect(shortcut).toBeEnabled();
  await page.getByLabel('Tema', { exact: true }).selectOption('dark');
  await page.screenshot({
    path: info.outputPath('deck-review-mobile.png'),
    fullPage: true,
    animations: 'disabled',
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({
    path: info.outputPath('deck-review-desktop.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await shortcut.focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('heading', {
      name: 'Uma revisão apenas deste baralho',
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText('0 revisados · 1 restantes')).toBeVisible();
  await page
    .getByRole('button', { name: 'Mostrar resposta', exact: true })
    .click();
  await page.getByRole('button', { name: /Bom/ }).click();
  await page
    .getByRole('button', { name: 'Voltar aos baralhos', exact: true })
    .click();
  await expect(shortcut).toBeDisabled();
  await open.click();
  await expect(
    page.getByRole('heading', { name: 'Revisão direta', exact: true }),
  ).toBeVisible();
});
