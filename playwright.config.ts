import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  outputDir: process.env.TOOLBIT_TEST_OUTPUT || 'test-results',
  timeout: 45000,
  retries: process.env.CI ? 1 : 0,
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' }, testIgnore: /lp-.*\.spec\.ts/ },
    { name: 'firefox', use: { browserName: 'firefox' }, testIgnore: /lp-.*\.spec\.ts/ },
    { name: 'webkit', use: { browserName: 'webkit' }, testIgnore: /lp-.*\.spec\.ts/ },
    {
      // Lightpanda over CDP: functional sweep only. No rendering engine, so
      // no screenshots, geometry, mouse, clipboard, SW or downloads here.
      // Specs use the lpPage fixture (tests/e2e/helpers/lp.ts), never `page`.
      name: 'lp',
      testMatch: /lp-.*\.spec\.ts/,
      use: { screenshot: 'off' },
    },
  ],
  fullyParallel: false,
  use: {
    baseURL: process.env.TOOLBIT_PREVIEW_URL || 'http://localhost:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: process.env.TOOLBIT_PREVIEW_URL
    ? undefined
    : {
        command: 'npm run preview -- --host localhost --port 4173',
        url: 'http://localhost:4173',
        reuseExistingServer: !process.env.CI,
      },
});
