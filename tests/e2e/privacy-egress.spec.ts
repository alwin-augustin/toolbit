import { test, expect } from '@playwright/test';

/**
 * Keystone privacy spec (PRIVACY.md §5, T2.1): with default settings and no
 * user action, the built app must make zero requests beyond its own origin —
 * through boot, a full tool journey, and navigation across screens. The only
 * network features are the API Request Builder and the WebSocket Tester, and
 * this spec deliberately never runs them.
 */

const APP_ORIGIN = new URL(process.env.TOOLBIT_PREVIEW_URL || 'http://localhost:4173').origin;

test('boot, a tool journey, and navigation make zero requests off the app origin', async ({
  page,
}) => {
  const canary = `CANARY_${crypto.randomUUID()}`;
  const foreign: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.origin !== APP_ORIGIN && url.protocol !== 'data:' && url.protocol !== 'blob:')
      foreign.push(request.url());
  });

  await page.goto(`/json-formatter?token=${canary}#${canary}`);
  await page
    .getByRole('textbox', { name: 'Input code', exact: true })
    .fill(JSON.stringify({ secret: canary }));
  await page.getByRole('button', { name: 'Format', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Result code', exact: true })).toContainText(
    canary,
  );

  await page.goto('/');
  await expect(page.getByRole('banner').first()).toBeVisible();
  await page.goto('/settings');
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  await page.goto('/about');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  expect(foreign).toEqual([]);
  // Content must not stick in the key/value store either: the canary never
  // appears in localStorage, not in a URL, a key, or a value.
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain(canary);
});
