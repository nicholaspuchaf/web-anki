import { setTheme } from './theme-actions';
import { expect, test } from '@playwright/test';

test('cria, revisa, restaura backup e mantém dados offline', async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: '+ Novo baralho' }).click();
  await page.getByLabel('Nome do baralho').fill('Inglês');
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await page.getByRole('button', { name: /Inglês.*Abrir baralho/ }).click();
  await page.getByRole('button', { name: '+ Novo cartão' }).click();
  await page.getByLabel('Template', { exact: true }).selectOption('basic');
  await page.getByLabel('Frente · pergunta').fill('Hello');
  await page.getByLabel('Verso · resposta').fill('Olá');
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await page.getByRole('button', { name: /Revisar este baralho/ }).click();
  await expect(page.getByRole('heading', { name: 'Hello' })).toBeVisible();
  await page.getByRole('button', { name: 'Mostrar resposta' }).click();
  await expect(page.getByText('Olá', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Bom/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Mais um passo dado.' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Voltar aos baralhos' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Exportar backup/ }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).toBeTruthy();
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('input[type=file]').setInputFiles(path!);
  await expect(page.getByRole('status')).toContainText('Backup restaurado');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect(
    page.getByRole('button', { name: /Inglês.*Abrir baralho/ }),
  ).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Offline', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Inglês.*Abrir baralho/ }).click();
  await expect(page.getByRole('heading', { name: 'Hello' })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test('template LeetCode com dicas, código, tags, filtros e treino livre', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: '+ Novo baralho' }).click();
  await page.getByLabel('Nome do baralho').fill('Algoritmos');
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await page.getByRole('button', { name: /Algoritmos.*Abrir baralho/ }).click();
  await page.getByRole('button', { name: '+ Novo cartão' }).click();
  await page
    .getByLabel('Pergunta · título e enunciado')
    .fill(
      'Two Sum\nEncontre dois índices cuja soma é o alvo.\n\n\nExample 1:\n\nInput: nums = [2,7], target = 9\n\nOutput: [0,1]\n\nExplanation:\n\nA soma é 9.\n\nConstraints:\n\n    2 <= nums.length <= 104\n    Only one valid answer exists.\n\nFollow-up: Can you do better?',
    );
  await expect(
    page.getByRole('textbox', { name: 'Linguagem do verso 3' }),
  ).toHaveCount(0);
  await page
    .getByRole('combobox', { name: 'Linguagem do verso 3' })
    .selectOption('typescript');
  await expect(
    page.getByRole('combobox', { name: 'Linguagem do verso 3' }),
  ).toHaveValue('typescript');
  await page
    .getByRole('combobox', { name: 'Linguagem do verso 3' })
    .selectOption('python');
  await page.getByLabel('Número do problema').fill('1');
  await page
    .getByLabel('Link do problema (HTTPS)')
    .fill('https://leetcode.com/problems/two-sum/');
  await page.getByLabel('Tags separadas por vírgula').fill('array, hash map');
  await expect(page.getByLabel('Exemplos de entrada e saída')).toHaveCount(0);
  await expect(
    page.getByLabel('Título do verso 2', { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByLabel('Título do verso 3', { exact: true }),
  ).toHaveCount(0);
  await page
    .getByLabel('Conteúdo do verso 4', { exact: true })
    .fill('Tempo: O(n)\nEspaço: O(n)');
  await page
    .getByLabel('Título do verso 1', { exact: true })
    .fill('Primeiro passo');
  await page
    .getByLabel('Conteúdo do verso 1', { exact: true })
    .fill('Pense no complemento.');
  await page
    .getByLabel('Conteúdo do verso 2', { exact: true })
    .fill('Uso um mapa para guardar os valores já vistos.');
  await page
    .getByLabel('Conteúdo do verso 3', { exact: true })
    .fill(
      'def twoSum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return [seen[target - n], i]\n        seen[n] = i',
    );
  await page.getByRole('button', { name: '+ Dica', exact: true }).click();
  await page
    .getByLabel('Título do verso 5', { exact: true })
    .fill('Segundo passo');
  await page
    .getByLabel('Conteúdo do verso 5', { exact: true })
    .fill('Guarde valor e índice em um mapa.');
  await page.getByRole('button', { name: 'Mover verso 5 para cima' }).click();
  await page.getByRole('button', { name: 'Mover verso 4 para cima' }).click();
  await expect(
    page.getByLabel('Título do verso 3', { exact: true }),
  ).toHaveValue('Segundo passo');
  await page.getByRole('button', { name: 'Pré-visualizar cartão' }).click();
  await expect(
    page.getByRole('heading', { name: 'Two Sum', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Pense no complemento.', { exact: true }),
  ).not.toBeVisible();
  await expect(page.getByRole('region', { name: 'Exemplo 1' })).toContainText(
    'nums = [2,7], target = 9',
  );
  await expect(
    page.getByRole('heading', { name: 'Restrições', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Desafio adicional' }),
  ).toBeVisible();
  await page.locator('dialog').evaluate((element) => {
    element.scrollTop = 0;
  });
  await page.screenshot({
    path: test.info().outputPath('problem-description-mobile.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: /Revelar próxima dica/ }).click();
  await expect(
    page.getByText('Pense no complemento.', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: /Revelar próxima dica/ }).click();
  await expect(
    page.getByText('Guarde valor e índice em um mapa.', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Tempo: O(n)', { exact: false }),
  ).not.toBeVisible();
  await page.getByRole('button', { name: /Complexidade/ }).click();
  await expect(page.getByLabel('Verso selecionado')).toContainText(
    'Tempo: O(n)',
  );
  await page.getByRole('button', { name: /Código da solução/ }).click();
  await expect(page.getByLabel('Solução em python')).toContainText(
    'def twoSum',
  );
  await expect(page.getByText('hash map', { exact: true })).not.toBeVisible();
  await page.getByRole('button', { name: /Mostrar tags/ }).click();
  await expect(page.getByText('hash map', { exact: true })).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath('leetcode-mobile.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Continuar editando' }).click();
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await page.getByRole('button', { name: 'Favoritar cartão' }).click();
  await page.getByRole('button', { name: /Mostrar tags/ }).click();
  await page.getByRole('button', { name: 'hash map', exact: true }).click();
  await expect(page.getByLabel('Filtrar por tag')).toHaveValue('hash map');
  await page.getByLabel('Buscar problema').fill('inexistente');
  await expect(
    page.getByText('Nenhum problema com esses filtros'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Limpar filtros' }).click();
  await page.getByRole('button', { name: /Revisar este baralho/ }).click();
  await page.getByRole('button', { name: /Minha resposta/ }).click();
  await expect(
    page.getByText('Uso um mapa para guardar os valores já vistos.'),
  ).toBeVisible();
  await page.getByRole('button', { name: /Bom/ }).click();
  await page.getByRole('button', { name: 'Voltar aos baralhos' }).click();
  await page.getByRole('button', { name: /Algoritmos.*Abrir baralho/ }).click();
  await expect(
    page.getByRole('button', { name: /Revisar este baralho/ }),
  ).toBeDisabled();
  const before = await page
    .locator('.problem-list-item small')
    .last()
    .textContent();
  await page.getByRole('button', { name: /Treino livre/ }).click();
  await page
    .getByRole('button', { name: /Concluir treino deste cartão/ })
    .click();
  await page.getByRole('button', { name: 'Voltar aos baralhos' }).click();
  await page.getByRole('button', { name: /Algoritmos.*Abrir baralho/ }).click();
  await expect(page.locator('.problem-list-item small').last()).toHaveText(
    before!,
  );
  await page.getByRole('button', { name: 'Editar', exact: true }).click();
  await expect(
    page.getByLabel('Título do verso 3', { exact: true }),
  ).toHaveValue('Segundo passo');
  await expect(
    page.getByLabel('Conteúdo do verso 4', { exact: true }),
  ).toHaveValue(/def twoSum/);
});

test('temas persistentes, versos opcionais e painéis responsivos', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await setTheme(page, 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(
    page.getByRole('button', { name: 'Tema escuro', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '+ Novo baralho' }).click();
  await page.getByLabel('Nome do baralho').fill('Revisão');
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await page.getByRole('button', { name: /Revisão.*Abrir baralho/ }).click();
  await page.getByRole('button', { name: '+ Novo cartão' }).click();
  await page
    .getByLabel('Pergunta · título e enunciado')
    .fill(
      'Two Sum\nRetorne os índices de dois números cuja soma é o alvo.\n\nExample 1:\nInput: nums = [2,7], target = 9\nOutput: [0,1]\n\nConstraints:\nOnly one valid answer exists.',
    );
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: /Revisar este baralho/ }).click();
  await expect(page.getByText('Nenhum verso preenchido ainda.')).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Revelar próxima dica/ }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: /Bom/ }).click();
  await page.getByRole('button', { name: 'Voltar aos baralhos' }).click();
  await page.getByRole('button', { name: /Revisão.*Abrir baralho/ }).click();
  await page.getByRole('button', { name: 'Editar', exact: true }).click();
  await expect(page.locator('.face-editor')).toHaveCount(4);
  await page
    .getByLabel('Conteúdo do verso 3', { exact: true })
    .fill(
      'class Solution:\n    def twoSum(self, nums, target):\n        seen = {}\n        for i, n in enumerate(nums):\n            if target - n in seen:\n                return [seen[target - n], i]\n            seen[n] = i',
    );
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page
    .getByRole('button', { name: 'Visualizar cartão', exact: true })
    .click();
  await expect(page.locator('.face-options button')).toHaveCount(1);
  await page.getByRole('button', { name: /Código da solução/ }).click();
  const left = await page.locator('.problem-pane').boundingBox();
  const right = await page.locator('.answer-pane').boundingBox();
  expect(right!.x).toBeGreaterThan(left!.x + left!.width);
  await page.screenshot({
    path: test.info().outputPath('leetcode-dark-desktop.png'),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  const mobileLeft = await page.locator('.problem-pane').boundingBox();
  const mobileRight = await page.locator('.answer-pane').boundingBox();
  expect(mobileRight!.y).toBeGreaterThan(mobileLeft!.y);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: test.info().outputPath('leetcode-dark-mobile.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Fechar', exact: true }).click();
  await setTheme(page, 'light');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Editar', exact: true }).click();
  while (await page.locator('.face-editor').count())
    await page
      .getByRole('button', { name: /^Remover verso/ })
      .first()
      .click();
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: /Revisão.*Abrir baralho/ }).click();
  await page
    .getByRole('button', { name: 'Visualizar cartão', exact: true })
    .click();
  await expect(page.getByText('Nenhum verso preenchido ainda.')).toBeVisible();
});
