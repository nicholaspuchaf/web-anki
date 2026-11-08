import { expect, test, type Page } from '@playwright/test';
test.use({ timezoneId: 'America/Sao_Paulo' });
const timestamp = new Date('2026-11-08T15:00:00Z');
const prefix = 'folha:review-history:v1:';
async function seedLegacy(page: Page) {
  await page.clock.setFixedTime(timestamp);
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: '+ Novo baralho' }),
  ).toBeVisible();
  await page.evaluate(async () => {
    const data = {
      version: 1,
      decks: [
        { id: 'history-deck', name: 'Estudo histórico', syncEnabled: false },
      ],
      cards: [
        {
          id: 'legacy-a',
          deckId: 'history-deck',
          front: 'Pergunta antiga A',
          back: 'Resposta A',
          reviews: 4,
          interval: 1.2,
          due: 1000,
        },
        {
          id: 'legacy-b',
          deckId: 'history-deck',
          front: 'Pergunta antiga B',
          back: 'Resposta B',
          reviews: 2,
          interval: 2.5,
          due: 2000,
        },
      ],
    };
    await new Promise<void>((resolve, reject) => {
      const open = indexedDB.open('folha', 1);
      open.onerror = () => reject(open.error);
      open.onsuccess = () => {
        const db = open.result;
        const tx = db.transaction('library', 'readwrite');
        tx.objectStore('library').clear();
        tx.objectStore('library').put(data, 'current');
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
    });
    for (const key of Object.keys(localStorage))
      if (key.startsWith('folha:review-history:v1:'))
        localStorage.removeItem(key);
  });
  await page.reload();
}
async function admin(page: Page) {
  await page.getByRole('link', { name: /Administração/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Administração dos flashcards' }),
  ).toBeVisible();
  await page.getByLabel('Baralho do dashboard').selectOption('history-deck');
  await expect(page.getByText('Abrindo o histórico…')).toHaveCount(0);
}
const activity = (page: Page) =>
  page.getByRole('region', {
    name: 'Atividade dos últimos 30 dias e revisões sem data',
    exact: true,
  });
async function openDeck(page: Page) {
  await page.getByRole('button', { name: /Meus baralhos/ }).click();
  await page
    .getByRole('button', { name: /Estudo histórico.*Abrir baralho/ })
    .click();
}

test('administração preserva legado sem data, registra avaliações, separa cartões/revisões e funciona offline', async ({
  page,
  context,
}, info) => {
  await seedLegacy(page);
  await admin(page);
  await page.getByLabel('Métrica do gráfico').selectOption('reviews');
  await expect(activity(page).getByRole('button').first()).toHaveAccessibleName(
    'Sem data: 6 revisões',
  );
  await expect(activity(page).getByRole('button')).toHaveCount(31);
  const stages = page.getByRole('region', {
    name: 'Distribuição dos intervalos de revisão',
    exact: true,
  });
  await expect(
    stages.getByRole('button', { name: '1 dia: 1 cartões', exact: true }),
  ).toBeVisible();
  await expect(
    stages.getByRole('button', { name: '3 dias: 1 cartões', exact: true }),
  ).toBeVisible();
  await activity(page).getByRole('button').first().click();
  await expect(
    page.getByRole('heading', { name: 'Histórico sem data' }),
  ).toBeVisible();
  const initial = await page.evaluate(
    async () =>
      new Promise<unknown>((resolve) => {
        const open = indexedDB.open('folha', 1);
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction('library');
          const r = tx.objectStore('library').get('current');
          r.onsuccess = () =>
            resolve(
              r.result.cards.filter(
                (c: { deckId: string }) => c.deckId === 'history-deck',
              ),
            );
          tx.oncomplete = () => db.close();
        };
      }),
  );
  expect(initial).toMatchObject([
    { id: 'legacy-a', reviews: 4, interval: 1.2, due: 1000 },
    { id: 'legacy-b', reviews: 2, interval: 2.5, due: 2000 },
  ]);
  await page.reload();
  await page.getByLabel('Baralho do dashboard').selectOption('history-deck');
  await page.getByLabel('Métrica do gráfico').selectOption('reviews');
  await expect(activity(page).getByRole('button').first()).toHaveAccessibleName(
    'Sem data: 6 revisões',
  );
  await openDeck(page);
  await page.getByRole('button', { name: /Revisar este baralho/ }).click();
  await page
    .getByRole('button', { name: 'Mostrar resposta', exact: true })
    .click();
  await page.getByRole('button', { name: /De novo/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Pergunta antiga B', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Mostrar resposta', exact: true })
    .click();
  await page.getByRole('button', { name: /Bom/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Mais um passo dado.' }),
  ).toBeVisible();
  await admin(page);
  await page.getByLabel('Métrica do gráfico').selectOption('reviews');
  await expect(
    activity(page).getByRole('button', {
      name: '08/11: 2 revisões',
      exact: true,
    }),
  ).toBeAttached();
  await expect(activity(page).getByRole('button').first()).toHaveAccessibleName(
    'Sem data: 6 revisões',
  );
  await page.clock.setFixedTime(new Date(timestamp.getTime() + 61000));
  await page.reload();
  await openDeck(page);
  await page.getByRole('button', { name: /Revisar este baralho/ }).click();
  await page
    .getByRole('button', { name: 'Mostrar resposta', exact: true })
    .click();
  await page.getByRole('button', { name: /Bom/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Mais um passo dado.' }),
  ).toBeVisible();
  await admin(page);
  await page.getByLabel('Métrica do gráfico').selectOption('reviews');
  await expect(
    activity(page).getByRole('button', {
      name: '08/11: 3 revisões',
      exact: true,
    }),
  ).toBeAttached();
  await page.getByLabel('Métrica do gráfico').selectOption('cards');
  await expect(
    activity(page).getByRole('button', {
      name: '08/11: 2 cartões',
      exact: true,
    }),
  ).toBeAttached();
  const cached = await page.evaluate(
    (p) =>
      Object.keys(localStorage)
        .filter((k) => k.startsWith(p + 'event:'))
        .map((k) => JSON.parse(localStorage.getItem(k)!)),
    prefix,
  );
  expect(cached).toHaveLength(3);
  expect(
    cached.every(
      (e: { reviewedAt: number }) => e.reviewedAt >= timestamp.getTime(),
    ),
  ).toBe(true);
  await openDeck(page);
  await page.getByRole('button', { name: /Treino livre/ }).click();
  for (let i = 0; i < 2; i++)
    await page
      .getByRole('button', { name: /Concluir treino deste cartão/ })
      .click();
  await expect(
    page.getByRole('heading', { name: 'Mais um passo dado.' }),
  ).toBeVisible();
  await admin(page);
  await page.getByLabel('Métrica do gráfico').selectOption('reviews');
  await expect(
    activity(page).getByRole('button', {
      name: '08/11: 3 revisões',
      exact: true,
    }),
  ).toBeAttached();
  await page
    .getByLabel('Baralho do dashboard')
    .selectOption('builtin-aws-services');
  await expect(activity(page).getByRole('button').first()).toHaveAccessibleName(
    'Sem data: 0 revisões',
  );
  await page.getByLabel('Baralho do dashboard').selectOption('history-deck');
  await page.screenshot({
    path: info.outputPath('admin-mobile.png'),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 1366, height: 1000 });
  await page.getByLabel('Tema', { exact: true }).selectOption('dark');
  await expect
    .poll(() =>
      activity(page)
        .getByRole('button')
        .first()
        .evaluate((el) =>
          Math.max(
            ...(getComputedStyle(el).backgroundColor.match(/\d+/g) ?? []).map(
              Number,
            ),
          ),
        ),
    )
    .toBeLessThan(100);
  await page.screenshot({
    path: info.outputPath('admin-desktop-dark.png'),
    fullPage: true,
  });
  await page.evaluate((p) => {
    for (const key of Object.keys(localStorage))
      if (key.startsWith(p)) localStorage.removeItem(key);
  }, prefix);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await context.setOffline(true);
  await page.reload();
  await page.getByLabel('Baralho do dashboard').selectOption('history-deck');
  await page.getByLabel('Métrica do gráfico').selectOption('reviews');
  await expect(
    activity(page).getByRole('button', {
      name: '08/11: 3 revisões',
      exact: true,
    }),
  ).toBeAttached();
  await expect(activity(page).getByRole('button').first()).toHaveAccessibleName(
    'Sem data: 6 revisões',
  );
  expect(
    await page.evaluate(
      (p) =>
        Object.keys(localStorage).filter((k) => k.startsWith(p + 'event:'))
          .length,
      prefix,
    ),
  ).toBe(3);
});

test('quota de localStorage não perde avaliação nem progresso', async ({
  page,
}) => {
  await seedLegacy(page);
  await openDeck(page);
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith('folha:review-history:v1:'))
        throw new DOMException('Quota cheia', 'QuotaExceededError');
      return original.call(this, key, value);
    };
  });
  await page.getByRole('button', { name: /Revisar este baralho/ }).click();
  await page
    .getByRole('button', { name: 'Mostrar resposta', exact: true })
    .click();
  await page.getByRole('button', { name: /Bom/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Pergunta antiga B', exact: true }),
  ).toBeVisible();
  await admin(page);
  await page.getByLabel('Métrica do gráfico').selectOption('reviews');
  await expect(
    page.getByText(
      'Não foi possível atualizar a cópia do histórico no localStorage.',
      { exact: false },
    ),
  ).toBeVisible();
  await expect(
    activity(page).getByRole('button', {
      name: '08/11: 1 revisões',
      exact: true,
    }),
  ).toBeAttached();
  await page.reload();
  await page.getByLabel('Baralho do dashboard').selectOption('history-deck');
  await page.getByLabel('Métrica do gráfico').selectOption('reviews');
  await expect(
    activity(page).getByRole('button', {
      name: '08/11: 1 revisões',
      exact: true,
    }),
  ).toBeAttached();
});

test('dashboard acompanha intervalos e atividade de uma revisão feita em outra aba', async ({
  page,
  context,
}) => {
  await seedLegacy(page);
  await admin(page);
  await page.getByLabel('Métrica do gráfico').selectOption('reviews');
  const other = await context.newPage();
  await other.clock.setFixedTime(timestamp);
  await other.goto('/');
  await openDeck(other);
  await other.getByRole('button', { name: /Revisar este baralho/ }).click();
  await other
    .getByRole('button', { name: 'Mostrar resposta', exact: true })
    .click();
  await other.getByRole('button', { name: /Bom/ }).click();
  await expect(
    other.getByRole('heading', { name: 'Pergunta antiga B', exact: true }),
  ).toBeVisible();
  await expect(
    activity(page).getByRole('button', {
      name: '08/11: 1 revisões',
      exact: true,
    }),
  ).toBeAttached();
  const intervals = page.getByRole('region', {
    name: 'Distribuição dos intervalos de revisão',
    exact: true,
  });
  await expect(
    intervals.getByRole('button', { name: '3 dias: 2 cartões', exact: true }),
  ).toBeVisible();
  await other.close();
});
