import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import path from 'node:path';

test.beforeEach(async ({ page }) => {
  if (process.env.TOOLBIT_BLOCK_ANALYTICS)
    await page.route(
      (url) => url.hostname === 'us.i.posthog.com',
      (route) => route.abort(),
    );
});

async function forceTheme(page: import('@playwright/test').Page, theme: 'light' | 'dark') {
  await page.addInitScript((value) => {
    window.localStorage.setItem('theme', value);
  }, theme);
}

test('settings theme choice applies and persists across reload', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/settings');
  const group = page.getByRole('group', { name: 'Theme' });
  await expect(group.getByRole('button', { name: 'System', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await group.getByRole('button', { name: 'Light', exact: true }).click();
  await expect(page.locator('html.light')).toHaveCount(1);
  await expect(await page.evaluate(() => window.localStorage.getItem('theme'))).toBe('light');
  await page.reload();
  await expect(page.locator('html.light')).toHaveCount(1);
  await expect(group.getByRole('button', { name: 'Light', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(errors).toEqual([]);
});

test('topbar toggle flips between explicit light and dark', async ({ page }) => {
  await forceTheme(page, 'dark');
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Switch to light theme' });
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(page.locator('html.light')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Switch to dark theme' })).toBeVisible();
  await expect(await page.evaluate(() => window.localStorage.getItem('theme'))).toBe('light');
});

for (const theme of ['light', 'dark'] as const) {
  test(`start and editor have no serious violations in ${theme} theme`, async ({ page }) => {
    await forceTheme(page, theme);
    for (const route of ['/', '/json-formatter']) {
      await page.goto(route);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const result = await new AxeBuilder({ page }).analyze();
      expect(
        result.violations.filter((v) => ['serious', 'critical'].includes(v.impact || '')),
      ).toEqual([]);
    }
  });
}

test('light theme visual review captures', async ({ page }, testInfo) => {
  await forceTheme(page, 'light');
  await page.goto('/');
  await page.screenshot({ path: path.join(testInfo.outputDir, 'theme-light-start.png') });
  await page.goto('/json-formatter');
  await page.screenshot({ path: path.join(testInfo.outputDir, 'theme-light-json.png') });
  await page.goto('/cron-parser');
  await page.screenshot({ path: path.join(testInfo.outputDir, 'theme-light-cron.png') });
});
