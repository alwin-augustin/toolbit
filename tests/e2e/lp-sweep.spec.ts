import { expect } from '@playwright/test';
import { lpTest, trackPageErrors, lpActivate, lpTypeNative } from './helpers/lp';

lpTest('start smart-paste suggests JSON and opens it', async ({ lpPage: page }) => {
  const errors = trackPageErrors(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Start' })).toBeVisible();
  await lpTypeNative(page, 'Paste data to find a tool', '{"b":2,"a":1}');
  await expect(page.getByRole('button', { name: /Open JSON/ })).toBeVisible();
  await lpActivate(page, 'button', /Open JSON/);
  await expect(page).toHaveURL(/json-formatter/);
  expect(errors).toEqual([]);
});

lpTest('command search opens the timestamp tool', async ({ lpPage: page }) => {
  const errors = trackPageErrors(page);
  await page.goto('/');
  await lpActivate(page, 'button', 'Search tools or actions...');
  await lpTypeNative(page, 'Search tools and saved work', 'timestamp');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/timestamp-converter/);
  expect(errors).toEqual([]);
});

lpTest('uuid generate needs no input', async ({ lpPage: page }) => {
  const errors = trackPageErrors(page);
  await page.goto('/uuid-generator');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await lpActivate(page, 'button', 'Generate');
  await expect(
    page.getByText(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i).first(),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

lpTest('settings theme choice persists', async ({ lpPage: page }) => {
  const errors = trackPageErrors(page);
  await page.goto('/settings');
  await lpActivate(page, 'button', 'Light');
  expect(await page.evaluate(() => window.localStorage.getItem('theme'))).toBe('light');
  expect(await page.evaluate(() => document.documentElement.classList.contains('light'))).toBe(
    true,
  );
  expect(errors).toEqual([]);
});
