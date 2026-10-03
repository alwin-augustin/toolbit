import { test, expect } from './fixtures/axe';

test.beforeEach(async ({ page }) => {
  if (process.env.TOOLBIT_BLOCK_ANALYTICS)
    await page.route(
      (url) => url.hostname === 'us.i.posthog.com',
      (route) => route.abort(),
    );
});

// All 42 catalog routes. Mirrors src/content/tools.config.ts paths.
const TOOL_PATHS = [
  '/json-formatter',
  '/json-validator',
  '/csv-to-json',
  '/base64-encoder',
  '/url-encoder',
  '/html-escape',
  '/protobuf-decoder',
  '/case-converter',
  '/word-counter',
  '/strip-whitespace',
  '/diff-tool',
  '/git-diff-viewer',
  '/regex-tester',
  '/lorem-ipsum-generator',
  '/css-formatter',
  '/js-json-minifier',
  '/markdown-previewer',
  '/yaml-formatter',
  '/api-request-builder',
  '/xml-formatter',
  '/sql-formatter',
  '/graphql-formatter',
  '/websocket-tester',
  '/nginx-config-validator',
  '/hash-generator',
  '/jwt-decoder',
  '/password-generator',
  '/totp-generator',
  '/certificate-decoder',
  '/timestamp-converter',
  '/color-converter',
  '/unit-converter',
  '/image-converter',
  '/pdf-tools',
  '/date-calculator',
  '/cron-parser',
  '/uuid-generator',
  '/http-status-codes',
  '/fake-data-generator',
  '/qr-code-generator',
  '/crontab-generator',
  '/docker-command-builder',
];

for (const toolPath of TOOL_PATHS) {
  test(`tool smoke renders without errors: ${toolPath}`, async ({ page, makeAxeBuilder }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(toolPath);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(errors).toEqual([]);
    const result = await makeAxeBuilder().analyze();
    expect(
      result.violations.filter((v) => ['serious', 'critical'].includes(v.impact || '')),
    ).toEqual([]);
  });
}

test('curated visual baselines (light theme)', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('theme', 'light'));
  for (const toolPath of ['/', '/json-formatter', '/hash-generator', '/cron-parser']) {
    await page.goto(toolPath);
    await page.evaluate(() => document.fonts.ready);
    const name = toolPath === '/' ? 'start' : toolPath.slice(1);
    await expect(page).toHaveScreenshot(`sweep-${name}-light.png`, {
      maxDiffPixels: 200,
      mask: [page.locator('.wb-doc-tabs-row')],
    });
  }
});
