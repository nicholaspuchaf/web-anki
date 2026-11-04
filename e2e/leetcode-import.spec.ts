import { expect, test } from '@playwright/test';
import { createHandler } from '../backend/service';
import { createProblemLoader } from '../backend/leetcode';
import type { FlashcardStore } from '../backend/model';

const endpoint = process.env.VITE_API_URL;
test('preenche enunciado e metadados por link, preserva versos e tags, permite edição e trata falhas', async ({
  page,
}) => {
  test.skip(!endpoint, 'Configure VITE_API_URL no build e no teste.');
  const unavailable = async () => {
    throw new Error('No database needed');
  };
  const store: FlashcardStore = {
    get: unavailable,
    put: unavailable,
    changes: unavailable,
  };
  const load = createProblemLoader(async (_input, init) => {
    const slug = JSON.parse(init!.body as string).variables.titleSlug;
    return Response.json({
      data: {
        question:
          slug === 'not-found'
            ? null
            : {
                titleSlug: slug,
                title: 'Two Sum',
                questionFrontendId: '1',
                difficulty: 'Easy',
                isPaidOnly: slug === 'premium',
                topicTags: [{ name: 'Array' }, { name: 'Hash Table' }],
                content:
                  '<p>Given <code>nums</code> and <code>target</code>, return two indices.</p>' +
                  '<p><strong>Example 1:</strong></p><pre><strong>Input:</strong> nums = [2,7], target = 9\n<strong>Output:</strong> [0,1]</pre>' +
                  '<p>Constraints:</p><ul><li>2 &lt;= nums.length &lt;= 10<sup>4</sup></li></ul>' +
                  '<img src="https://untrusted.example/image.png" onerror="window.__unsafe=1">' +
                  '<script>window.__unsafe=1</script><iframe src="https://untrusted.example/frame"></iframe>',
              },
      },
    });
  });
  const handler = createHandler(
    store,
    ['http://127.0.0.1:4173'],
    () => new Date(),
    load,
  );
  await page.route(`${endpoint}/leetcode/problems/**`, async (route) => {
    const result = await handler({
      requestContext: {
        http: {
          method: route.request().method(),
          path: new URL(route.request().url()).pathname,
        },
      },
      headers: route.request().headers(),
    });
    await route.fulfill({
      status: result.statusCode,
      body: result.body,
      headers: { ...result.headers, 'access-control-allow-origin': '*' },
    });
  });
  const unsafeRequests: string[] = [];
  page.on('request', (req) => {
    if (req.url().includes('untrusted.example')) unsafeRequests.push(req.url());
  });
  await page.goto('/');
  await page.getByRole('button', { name: '+ Novo baralho' }).click();
  await page.getByLabel('Nome do baralho').fill('LeetCode');
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await page.getByRole('button', { name: /LeetCode.*Abrir baralho/ }).click();
  await page.getByRole('button', { name: '+ Novo cartão' }).click();
  const description = page.getByLabel('Pergunta · título e enunciado');
  await description.fill('Meu rascunho');
  await page.getByLabel('Tags separadas por vírgula').fill('minha tag');
  await page
    .getByLabel('Conteúdo do verso 2')
    .fill('Minha resposta deve permanecer');
  await page
    .getByLabel('Link do problema (HTTPS)')
    .fill('https://leetcode.com/problems/two-sum/description/?foo=bar');
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: 'Preencher pelo link' }).click();
  await expect(description).toHaveValue('Meu rascunho');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Preencher pelo link' }).click();
  await expect(page.getByRole('status')).toContainText('contém imagens');
  await expect(description).toHaveValue(/Two Sum\n\nGiven `nums`/);
  await expect(description).toHaveValue(/10\^\(4\)/);
  await expect(description).not.toHaveValue(/<script>|__unsafe|<iframe/);
  await expect(page.getByLabel('Número do problema')).toHaveValue('1');
  await expect(
    page.getByRole('dialog').getByLabel('Dificuldade', { exact: true }),
  ).toHaveValue('easy');
  await expect(page.getByLabel('Tags separadas por vírgula')).toHaveValue(
    'minha tag, array, hash table',
  );
  await expect(page.getByLabel('Conteúdo do verso 2')).toHaveValue(
    'Minha resposta deve permanecer',
  );
  await expect(page.getByLabel('Link do problema (HTTPS)')).toHaveValue(
    'https://leetcode.com/problems/two-sum/',
  );
  expect(unsafeRequests).toEqual([]);
  await page
    .getByLabel('Link do problema (HTTPS)')
    .fill('https://leetcode.com/problems/not-found/');
  const before = await description.inputValue();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Preencher pelo link' }).click();
  await expect(page.getByRole('alert')).toContainText('não encontrado');
  await expect(description).toHaveValue(before);
  await page
    .getByLabel('Link do problema (HTTPS)')
    .fill('https://leetcode.com/problems/premium/');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Preencher pelo link' }).click();
  await expect(page.getByRole('alert')).toContainText('Premium');
  await expect(description).toHaveValue(before);
  await page
    .getByLabel('Link do problema (HTTPS)')
    .fill('https://leetcode.com/problems/two-sum/');
  await page
    .getByLabel('Tags separadas por vírgula')
    .fill('minha tag, array, hash table, revisão');
  await description.fill(before + '\n\nMinha observação.');
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Editar', exact: true }).click();
  await expect(description).toHaveValue(/Minha observação\./);
  await expect(page.getByLabel('Tags separadas por vírgula')).toHaveValue(
    'minha tag, array, hash table, revisão',
  );
  await expect(page.getByLabel('Conteúdo do verso 2')).toHaveValue(
    'Minha resposta deve permanecer',
  );
});
