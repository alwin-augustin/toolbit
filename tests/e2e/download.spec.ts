import { expect, test } from '@playwright/test';

/**
 * The download URLs stay version-free on purpose: the site resolves
 * `/download/<platform>` to the newest release asset (public/_redirects),
 * never to a pinned release. This pins the other half of that contract — a
 * path for every platform, exactly the ones the redirects and the desktop
 * workflow share.
 */
test('about page links every platform to a stable download URL', async ({ page }) => {
  await page.goto('/about');
  for (const [name, href] of [
    ['macOS (Apple silicon)', '/download/mac'],
    ['macOS (Intel)', '/download/mac-intel'],
    ['Windows', '/download/windows'],
    ['Linux', '/download/linux'],
  ] as const) {
    const link = page.getByRole('link', { name });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', href);
  }
});
