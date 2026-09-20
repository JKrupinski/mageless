import { defineConfig, devices } from '@playwright/test';

/*
 * Deliberately not 4321.
 *
 * Playwright reuses an already-listening server outside CI, and a dev server on
 * the default port serves different code than the production build these tests
 * are meant to exercise — the suite would silently test the wrong thing. Using
 * a separate port means `npm run dev` and `npm run test:e2e` can run at once.
 */
const PORT = Number(process.env['E2E_PORT'] ?? 4331);
const baseURL = process.env['E2E_BASE_URL'] ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 2 : undefined,
  reporter: process.env['CI'] ? [['github'], ['html', { open: 'never' }]] : [['list']],
  timeout: 45_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],

  // The storefront is built once and served from the Node adapter, which is
  // what production runs — testing `astro dev` would test a different server.
  webServer: {
    command: 'npm run build && npm run preview',
    url: baseURL,
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000,
    env: { HOST: '127.0.0.1', PORT: String(PORT) },
  },
});
