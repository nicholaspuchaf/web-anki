import { setTheme } from './theme-actions';
import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('baralho de múltipla escolha cria, valida, revisa e preserva alternativas em backup e treino offline', async ({
  page,
  context,
}, testInfo) => {
  await page.goto('/');
  await page.getByRole('button', { name: '+ Novo baralho' }).click();
  await page.getByLabel('Nome do baralho').fill('Conhecimentos gerais');
  await page
    .getByLabel('Template padrão dos cartões')
    .selectOption('multiple-choice');
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await page
    .getByRole('button', { name: /Conhecimentos gerais.*Abrir baralho/ })
    .click();
  await page.getByRole('button', { name: '+ Novo cartão' }).click();
  await expect(page.getByLabel('Template', { exact: true })).toHaveValue(
    'multiple-choice',
  );
  await page.getByLabel('Frente · pergunta').fill('Qual estrutura usa LIFO?');
  for (const [letter, option] of [
    ['A', 'Uma fila'],
    ['B', 'Uma pilha'],
    ['C', 'Um mapa'],
    ['D', 'Um conjunto'],
  ])
    await page
      .getByLabel(`Alternativa ${letter}`, { exact: true })
      .fill(option);
  await page
    .getByLabel('Explicação (opcional)')
    .fill('Na pilha, o último elemento a entrar é o primeiro a sair.');
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText(
    'marque uma única resposta correta',
  );
  await page.getByRole('radio', { name: 'B é a resposta correta' }).check();
  await page.getByRole('button', { name: 'Pré-visualizar cartão' }).click();
  await expect(
    page.getByRole('button', { name: 'Confirmar resposta' }),
  ).toBeDisabled();
  await expect(
    page.getByText(
      'Na pilha, o último elemento a entrar é o primeiro a sair.',
      { exact: true },
    ),
  ).toHaveCount(0);
  await page.getByRole('radio', { name: 'Uma pilha', exact: true }).check();
  await page.getByRole('button', { name: 'Confirmar resposta' }).click();
  await expect(page.getByRole('status')).toContainText('Resposta correta!');
  await page.getByRole('button', { name: 'Continuar editando' }).click();
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: '+ Novo cartão' }).click();
  await page
    .getByLabel('Frente · pergunta')
    .fill('Qual é a capital do Brasil?');
  for (const [letter, option] of [
    ['A', 'São Paulo'],
    ['B', 'Rio de Janeiro'],
    ['C', 'Brasília'],
    ['D', 'Salvador'],
  ])
    await page
      .getByLabel(`Alternativa ${letter}`, { exact: true })
      .fill(option);
  await page.getByRole('radio', { name: 'C é a resposta correta' }).check();
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Editar', exact: true })
    .first()
    .click();
  await expect(page.getByLabel('Template', { exact: true })).toHaveValue(
    'multiple-choice',
  );
  await expect(page.getByLabel('Alternativa B', { exact: true })).toHaveValue(
    'Uma pilha',
  );
  await expect(
    page.getByRole('radio', { name: 'B é a resposta correta' }),
  ).toBeChecked();
  await page.getByRole('button', { name: 'Fechar', exact: true }).click();
  await setTheme(page, 'dark');
  await page.getByRole('button', { name: /Revisar este baralho/ }).click();
  await expect(page.getByRole('button', { name: /Bom/ })).toHaveCount(0);
  await page.getByRole('radio', { name: 'Uma fila', exact: true }).check();
  await expect(page.getByRole('status')).toHaveCount(0);
  await page.getByRole('button', { name: 'Confirmar resposta' }).click();
  await expect(page.getByRole('status')).toContainText(
    'A resposta correta é B',
  );
  await expect(page.getByRole('button', { name: /Bom/ })).toHaveCount(0);
  await expect(page.getByRole('radio', { name: /Uma pilha/ })).toBeDisabled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath('multiple-choice-dark-mobile.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: /De novo/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Qual é a capital do Brasil?' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Confirmar resposta' }),
  ).toBeDisabled();
  await page.getByRole('radio', { name: 'Brasília', exact: true }).check();
  await page.getByRole('button', { name: 'Confirmar resposta' }).click();
  await expect(page.getByRole('status')).toContainText('Resposta correta!');
  await page.getByRole('button', { name: /Bom/ }).click();
  await page.getByRole('button', { name: 'Voltar aos baralhos' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Exportar backup/ }).click();
  const download = await downloadPromise;
  const path = (await download.path())!;
  const backup = JSON.parse(await readFile(path, 'utf8'));
  expect(
    backup.decks.find(
      (deck: { name: string }) => deck.name === 'Conhecimentos gerais',
    ).defaultTemplate,
  ).toBe('multiple-choice');
  expect(backup.cards[0].multipleChoice.correctIndex).toBe(1);
  expect(backup.cards[0].reviews).toBe(1);
  expect(backup.cards[0].interval).toBe(0);
  expect(backup.cards[1].reviews).toBe(1);
  expect(backup.cards[1].interval).toBeGreaterThan(0);
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('input[type=file]').setInputFiles(path);
  await expect(page.getByRole('status')).toContainText('Backup restaurado');
  await page.reload();
  await page
    .getByRole('button', { name: /Conhecimentos gerais.*Abrir baralho/ })
    .click();
  await context.setOffline(true);
  await page.getByRole('button', { name: /Treino livre/ }).click();
  await expect(
    page.getByRole('button', { name: /Concluir treino/ }),
  ).toHaveCount(0);
  await page.getByRole('radio', { name: 'Uma pilha', exact: true }).check();
  await page.getByRole('button', { name: 'Confirmar resposta' }).click();
  await page.getByRole('button', { name: /Concluir treino/ }).click();
  await page.getByRole('radio', { name: 'Brasília', exact: true }).check();
  await page.getByRole('button', { name: 'Confirmar resposta' }).click();
  await page.getByRole('button', { name: /Concluir treino/ }).click();
  await page.getByRole('button', { name: 'Voltar aos baralhos' }).click();
  const after = await page.evaluate(async () => {
    const request = indexedDB.open('folha');
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const read = db
      .transaction('library')
      .objectStore('library')
      .get('current');
    const value = await new Promise<unknown>((resolve, reject) => {
      read.onsuccess = () => resolve(read.result);
      read.onerror = () => reject(read.error);
    });
    db.close();
    return value;
  });
  expect(after).toEqual(backup);
});
