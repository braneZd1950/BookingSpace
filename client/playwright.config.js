import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const clientDir = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.resolve(clientDir, '../server');
const port = Number(process.env.PW_PORT || 4173);
const baseURL = process.env.PW_BASE_URL || `http://127.0.0.1:${port}`;

/**
 * E2E against the Vite production preview (build once, then serve).
 * Locally: reuses an already-running preview/dev server when present.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  timeout: 30_000,
  expect: { timeout: 8_000 },
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'hr-HR',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Optional local/CI expansion:
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: [
    {
      command: 'node scripts/e2e-api.mjs',
      cwd: serverDir,
      url: 'http://127.0.0.1:4001/api/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: `npm run build && npm run preview -- --host 127.0.0.1 --port ${port} --strictPort`,
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: {
        ...process.env,
        VITE_API_URL: process.env.VITE_API_URL || 'http://127.0.0.1:4001/api',
        VITE_APP_MODE: process.env.VITE_APP_MODE || 'development',
        VITE_SENTRY_DSN: process.env.VITE_SENTRY_DSN || '',
      },
    },
  ],
});
