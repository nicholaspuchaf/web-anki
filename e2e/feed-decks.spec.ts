import { expect, test } from '@playwright/test';
import { feedAction, swipeFeed } from './feed-actions';
import { readFile } from 'node:fs/promises';

test('baralho reúne flashcards e carrosséis, permite escolher tema e mantém estudo isolado', async ({
  page,
}, info) => {
  await page.goto('/');
  await page.getByRole('button', { name: '+ Novo baralho' }).click();
  await page.getByLabel('Nome do baralho').fill('Sistemas distribuídos');
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await page
    .getByRole('button', { name: /Sistemas distribuídos.*Abrir baralho/ })
    .click();
  await page.getByRole('button', { name: '+ Novo cartão' }).click();
  await page.getByLabel('Template', { exact: true }).selectOption('basic');
  await page.getByLabel('Frente · pergunta').fill('O que é consenso?');
  await page
    .getByLabel('Verso · resposta')
    .fill('Um acordo entre participantes.');
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await page
    .getByRole('button', { name: 'Carrosséis deste baralho', exact: true })
    .click();
  const selector = page.getByLabel('Baralho para estudar');
  await expect(selector.locator('option:checked')).toContainText(
    'Sistemas distribuídos',
  );
  const deckId = await selector.inputValue();
  await expect(
    page.getByText('Este baralho ainda não tem carrosséis.', { exact: false }),
  ).toBeVisible();
  for (const title of ['Entendendo consenso', 'Entendendo replicação']) {
    await feedAction(page, '+ Novo carrossel');
    await expect(page.getByLabel('Baralho do carrossel')).toHaveValue(deckId);
    await page.getByLabel('Título do carrossel', { exact: true }).fill(title);
    await page
      .getByLabel('Escopo', { exact: true })
      .fill('Participantes e suas decisões');
    await page
      .getByLabel('Objetivo de aprendizado', { exact: true })
      .fill('Explicar as garantias');
    for (let i = 1; i <= 3; i++) {
      await page
        .getByRole('navigation', { name: 'Cards para editar' })
        .getByRole('button')
        .nth(i - 1)
        .click();
      await page
        .getByLabel('Parágrafo 1', { exact: true })
        .fill('Uma explicação detalhada para compreender o conceito.');
    }
    await page
      .getByRole('button', { name: 'Salvar carrossel', exact: true })
      .click();
  }
  await expect(page.locator('.feed-manager article')).toHaveCount(2);
  await expect(selector.locator('option:checked')).toContainText('1 flashcard');
  const picked = page.locator('.feed-manager article').filter({
    has: page.getByRole('heading', {
      name: 'Entendendo consenso',
      exact: true,
    }),
  });
  await picked
    .getByRole('button', { name: 'Estudar carrossel', exact: true })
    .click();
  const visible = page.locator('.feed-entry:not([hidden]) .learning-carousel');
  await expect(visible).toHaveAttribute('aria-label', 'Entendendo consenso');
  await swipeFeed(page, 1);
  await expect(visible).toHaveAttribute('aria-label', 'Entendendo replicação');
  await feedAction(page, 'Meus carrosséis');
  await expect(selector).toHaveValue(deckId);
  await page.screenshot({ path: info.outputPath('mixed-deck-mobile.png') });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({ path: info.outputPath('mixed-deck-desktop.png') });
  await selector.selectOption('builtin-patterns-design');
  await expect(page.locator('.feed-manager article')).toHaveCount(22);
  await expect(selector.locator('option:checked')).toContainText(
    '176 flashcards',
  );
  const patternTitles = await page
    .locator('.feed-manager article h2')
    .allTextContents();
  const target = page
    .locator('.feed-manager article')
    .filter({ has: page.getByRole('heading', { name: /^Strategy ·/ }) });
  await target
    .getByRole('button', { name: 'Estudar carrossel', exact: true })
    .click();
  await expect(visible).toHaveAttribute('aria-label', /^Strategy ·/);
  await page
    .getByRole('button', { name: 'Próximo carrossel', exact: true })
    .click();
  expect(patternTitles).toContain(await visible.getAttribute('aria-label'));
  const waiting = page.waitForEvent('download');
  await feedAction(page, 'Exportar Feed');
  const backup = JSON.parse(
    await readFile((await (await waiting).path())!, 'utf8'),
  );
  expect(backup.decks.find((d: { id: string }) => d.id === deckId).name).toBe(
    'Sistemas distribuídos',
  );
  expect(
    backup.carousels.filter((c: { deckId: string }) => c.deckId === deckId),
  ).toHaveLength(2);
  await page.reload();
  await expect(page.getByLabel('Baralho para estudar')).toHaveValue(deckId);
});
