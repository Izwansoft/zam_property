import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Configuration
 *
 * Run: pnpm test:e2e
 * Run specific: pnpm test:e2e -- --grep "vendor listing"
 *
 * @see docs/ai-prompt/part-18.md §18.5
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',
  timeout: 30_000,

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Start dev server before tests if not in CI */
  webServer: process.env.CI
    ? undefined
    : {
        command: 'pnpm dev',
        url: 'http://localhost:3001',
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
