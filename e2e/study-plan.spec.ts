import { expect, test } from '@playwright/test';
import { navigateSection } from './app-navigation';
import { setTheme } from './theme-actions';

const preferenceKey = 'folha:study-preferences:v1';
test('plano ajusta projeção e agenda, mantém progresso e sincroniza preferências entre abas offline', async ({
  page,
  context,
}, info) => {
  await page.route('https://folha-api.example/**', (route) => route.abort());
  await page.goto('/');
  await navigateSection(page, 'Configurações');
  const goal = page.getByRole('slider', { name: 'Meta diária' });
  const spacing = page.getByRole('slider', {
    name: 'Espaçamento das revisões',
  });
  await expect(goal).toHaveValue('20');
  await expect(spacing).toHaveValue('1');
  const change = async (name: string, value: string) => {
    await page.getByRole('slider', { name }).fill(value);
  };
  await change('Meta diária', '40');
  await change('Espaçamento das revisões', '2');
  await expect(
    page.getByLabel('Exemplo de intervalos com três respostas Bom'),
  ).toContainText('2 dias → 5 dias → 12,5 dias');
  const bars = page.locator('.study-milestone');
  await expect(bars).toHaveCount(3);
  const total = await page.evaluate(() => {
    const el = document.querySelector('.study-projection-heading p strong');
    return Number(el?.textContent?.replace(/\./g, ''));
  });
  await expect(bars.nth(0)).toContainText(
    `${Math.ceil(total / 40)} dias de estudo`,
  );
  await page
    .getByRole('checkbox', {
      name: 'Ativar AWS · Serviços e aplicações',
      exact: true,
    })
    .uncheck();
  await expect(bars.nth(0)).toContainText(
    `${Math.ceil((total - 326) / 40)} dias de estudo`,
  );
  await page
    .getByRole('checkbox', {
      name: 'Ativar AWS · Serviços e aplicações',
      exact: true,
    })
    .check();
  await setTheme(page, 'dark');
  await page.screenshot({
    path: info.outputPath('study-plan-mobile-dark.png'),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const second = await context.newPage();
  await second.goto('/#/settings');
  await expect(second.getByRole('slider', { name: 'Meta diária' })).toHaveValue(
    '40',
  );
  await change('Meta diária', '30');
  await expect(second.getByRole('slider', { name: 'Meta diária' })).toHaveValue(
    '30',
  );
  await second.close();
  // Opening another tab may install Feed decks; reload the library before writing.
  await page.reload();
  await expect(page.getByRole('slider', { name: 'Meta diária' })).toHaveValue(
    '30',
  );
  await navigateSection(page, 'Flashcards');
  await page.getByRole('button', { name: /AWS.*Abrir baralho/ }).click();
  await page.getByRole('button', { name: /Revisar este baralho/ }).click();
  await page.getByRole('button', { name: '1 O que é', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Bom/ })).toContainText(
    '2 dia(s)',
  );
  await page.getByRole('button', { name: /^Bom/ }).click();
  await expect
    .poll(async () =>
      page.evaluate(async () => {
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open('folha', 1);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        try {
          const stored = await new Promise<{
            cards: {
              interval: number;
              reviews: number;
              spacingMultiplier?: number;
            }[];
          }>((resolve, reject) => {
            const request = db
              .transaction('library')
              .objectStore('library')
              .get('current');
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
          return stored.cards
            .filter((c) => c.reviews > 0)
            .map((c) => ({
              interval: c.interval,
              spacingMultiplier: c.spacingMultiplier,
            }));
        } finally {
          db.close();
        }
      }),
    )
    .toEqual([{ interval: 2, spacingMultiplier: 2 }]);
  await page.getByRole('button', { name: /Encerrar revisão/ }).click();
  await navigateSection(page, 'Configurações');
  await change('Espaçamento das revisões', '3');
  await page.reload();
  await expect(
    page.getByRole('slider', { name: 'Espaçamento das revisões' }),
  ).toHaveValue('3');
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('slider', { name: 'Meta diária' })).toHaveValue(
    '30',
  );
  await page.setViewportSize({ width: 1280, height: 900 });
  await setTheme(page, 'light');
  await page.screenshot({
    path: info.outputPath('study-plan-desktop-light.png'),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test('falha ao salvar plano mantém valores anteriores e informa o erro', async ({
  page,
}) => {
  await page.goto('/');
  await navigateSection(page, 'Configurações');
  await page.evaluate((key) => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      if (k === key) throw new DOMException('Quota', 'QuotaExceededError');
      original.call(this, k, v);
    };
  }, preferenceKey);
  await page.getByRole('slider', { name: 'Meta diária' }).fill('50');
  await expect(page.getByRole('slider', { name: 'Meta diária' })).toHaveValue(
    '20',
  );
  await expect(page.getByRole('alert')).toContainText(
    'Não foi possível salvar seu plano',
  );
});
