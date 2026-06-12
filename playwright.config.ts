import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'e2e/test-results/report' }],
    ['json', { outputFile: 'e2e/test-results/results.json' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5175',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    userAgent: 'Playwright-E2E',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],

  outputDir: 'e2e/test-results/output',

  webServer: [
    {
      command: 'npm run dev',
      url: process.env.E2E_BASE_URL || 'http://localhost:5175',
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
  ],
});
