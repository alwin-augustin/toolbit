import { test, expect } from '@playwright/test';

// Downloads the real embedding model (~25 MB) and the ONNX WebAssembly
// runtime, so it stays out of CI. Run against a preview build with:
//
//   TOOLBIT_VERIFY_SEMANTIC=1 npx playwright test tests/e2e/semantic-search.spec.ts
test('the on-device model reranks a paraphrase to the right tool', async ({ page }) => {
  test.skip(
    !process.env.TOOLBIT_VERIFY_SEMANTIC,
    'Downloads the real model; run with TOOLBIT_VERIFY_SEMANTIC=1.',
  );
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/settings');
  await page.getByRole('checkbox', { name: /Smarter search/ }).check();
  await expect(page.getByText('On-device model ready.')).toBeVisible({ timeout: 240_000 });

  await page.goto('/');
  await page.getByRole('button', { name: 'Search tools or actions...', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Search tools', exact: true })
    .fill('check my yaml is valid');

  // Lexical alone ties two validators above YAML Formatter; the corpus phrase
  // only wins once the on-device similarity is blended in.
  const first = page.locator('[data-index="0"]');
  await expect(first).toContainText('YAML Formatter', { timeout: 30_000 });
  expect(errors).toEqual([]);
});
