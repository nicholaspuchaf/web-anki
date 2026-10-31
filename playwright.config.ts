import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    viewport: { width: 390, height: 844 },
    serviceWorkers: 'allow',
  },
  webServer: {
    command:
      process.env.PLAYWRIGHT_ISOLATED_BUILD === '1'
        ? 'bun run build --outDir .cache/playwright-build && bun run preview --outDir .cache/playwright-build --port 4173 --strictPort'
        : 'bun run preview --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
  },
});
