import { expect, test } from '@playwright/test';

/**
 * The download addresses stay version-free on purpose: the site resolves
 * `/download/<platform>` to a stable-named object in the toolbit-downloads R2
 * bucket (public/_redirects), never to a pinned release. `/download` itself is
 * the page that starts the right one for the visitor, because only the browser
 * knows the platform (src/platform/downloads.ts).
 *
 * These pin the half a unit test cannot: the page is reachable, it lists every
 * build, and its script actually navigates to the one this machine needs. The
 * redirect target is not followed here — `_redirects` is a Cloudflare feature,
 * so `vite preview` answers `/download/<platform>` with the app shell, which is
 * exactly the URL assertion below.
 */
const PLATFORMS = [
  ['macOS (Apple silicon)', '/download/mac'],
  ['macOS (Intel)', '/download/mac-intel'],
  ['Windows', '/download/windows'],
  ['Linux', '/download/linux'],
] as const;

const ANDROID =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36';
const WINDOWS =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const UBUNTU = 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0';

test('about page links every platform to a stable download URL', async ({ page }) => {
  await page.goto('/about');
  for (const [name, href] of PLATFORMS) {
    const link = page.getByRole('link', { name });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', href);
  }
});

// A phone has no build to offer, so the page has to stay a page — and that is
// also what makes the markup assertions below deterministic, since a platform
// the script recognises navigates away from the document.
test.describe('a visitor with no build for their platform', () => {
  test.use({ userAgent: ANDROID });

  test('keeps the download page, with every build still on it', async ({ page }) => {
    await page.goto('/download');
    await expect(page.getByRole('heading', { name: 'Download Toolbit for desktop' })).toBeVisible();
    for (const [name, href] of PLATFORMS) {
      const link = page.getByRole('link', { name });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('href', href);
    }
    await expect(page).toHaveURL(/\/download$/);
  });
});

for (const [platform, userAgent, expected] of [
  ['Windows', WINDOWS, '/download/windows'],
  ['Linux', UBUNTU, '/download/linux'],
] as const) {
  test.describe(`a visitor on ${platform}`, () => {
    test.use({ userAgent });

    test(`is sent straight to the ${platform} installer`, async ({ page }) => {
      await page.goto('/download');
      await expect(page).toHaveURL(new RegExp(`${expected}$`));
    });
  });
}
