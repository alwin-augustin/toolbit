import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route(
    (url) => url.hostname === 'us.i.posthog.com',
    (route) => route.abort(),
  );
});

function collectErrors(page: import('@playwright/test').Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

test('generic modes: base64 url-safe, timestamp explicit unit, yaml to-json', async ({ page }) => {
  const errors = collectErrors(page);

  await page.goto('/base64-encoder');
  await page.getByRole('textbox', { name: 'Input code' }).fill('>>>');
  await page.getByRole('button', { name: 'Encode', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Result code' })).not.toBeEmpty();

  await page.goto('/timestamp-converter');
  await page.getByRole('textbox', { name: 'Input code' }).fill('1790942400');
  await page.getByLabel('Unit').selectOption('seconds');
  await page.getByRole('button', { name: 'Convert', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Result code' })).toContainText(
    'UTC: 2026-10-02T12:00:00.000Z',
  );

  await page.goto('/yaml-formatter');
  await page.getByRole('textbox', { name: 'Input code' }).fill('a: 1\n');
  await page.getByRole('button', { name: 'YAML to JSON' }).click();
  await expect(page.getByRole('textbox', { name: 'Result code' })).toContainText('"a": 1');
  expect(errors).toEqual([]);
});

test('generators: hash digests, password strength, uuid batch', async ({ page }) => {
  const errors = collectErrors(page);

  await page.goto('/hash-generator');
  await page.getByRole('button', { name: 'Load sample' }).click();
  await expect(page.getByTestId('output-sha256')).not.toBeEmpty();
  await expect(page.getByRole('button', { name: 'Copy all' })).toBeEnabled();

  await page.goto('/password-generator');
  await page.getByRole('button', { name: 'Generate', exact: true }).click();
  await expect(page.getByTestId('password-output').first()).not.toBeEmpty();

  await page.goto('/uuid-generator');
  await page.getByRole('button', { name: 'Generate', exact: true }).click();
  await expect(
    page.getByText(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i).first(),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test('generators: qr image, fake-data fixtures, lorem text', async ({ page }) => {
  const errors = collectErrors(page);

  await page.goto('/qr-code-generator');
  await page.getByRole('button', { name: 'Load sample' }).click();
  await expect(page.getByAltText('QR Code')).toBeVisible();

  await page.goto('/fake-data-generator');
  await page.getByRole('button', { name: 'Generate', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Generated fixtures' })).not.toBeEmpty();

  await page.goto('/lorem-ipsum-generator');
  await page.getByRole('button', { name: 'Generate', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Generated placeholder text' })).not.toBeEmpty();
  expect(errors).toEqual([]);
});

test('decoders: jwt claims, certificate details, protobuf fields', async ({ page }) => {
  const errors = collectErrors(page);

  await page.goto('/jwt-decoder');
  await page.getByRole('button', { name: 'Load sample' }).click();
  await expect(page.getByRole('textbox', { name: 'Decoded claims' })).toContainText('Ada');
  await page.getByRole('textbox', { name: 'JWT token' }).fill('onlyone');
  await expect(page.getByRole('alert')).toContainText("Couldn't decode");

  await page.goto('/certificate-decoder');
  await page.getByRole('button', { name: 'Load sample' }).click();
  await expect(page.getByText('example.com').first()).toBeVisible();

  await page.goto('/protobuf-decoder');
  await page.getByRole('button', { name: 'Load sample' }).click();
  await expect(page.getByText(/Fields/).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('compare: diff output, regex matches and invalid pattern', async ({ page }) => {
  const errors = collectErrors(page);

  await page.goto('/diff-tool');
  await page.getByRole('button', { name: 'Load sample' }).click();
  await expect(page.getByRole('textbox', { name: 'Diff result' })).not.toBeEmpty();
  await expect(page.getByRole('button', { name: 'Copy diff' })).toBeEnabled();

  await page.goto('/regex-tester');
  await page.getByRole('button', { name: 'Load sample' }).click();
  await expect(page.getByText(/Matches/).first()).toBeVisible();
  await page.getByRole('textbox', { name: 'Pattern' }).fill('([');
  await expect(page.getByRole('alert')).toContainText('Invalid pattern');
  expect(errors).toEqual([]);
});

test('validate: json-validator, xml prettify, markdown preview, git-diff files', async ({
  page,
}) => {
  const errors = collectErrors(page);

  await page.goto('/json-validator');
  await page.getByRole('button', { name: 'Load sample' }).click();
  await page.getByRole('button', { name: 'Validate' }).click();
  await expect(page.getByRole('heading', { name: 'Valid against schema' })).toBeVisible();

  await page.goto('/xml-formatter');
  await page.getByRole('button', { name: 'Load sample' }).click();
  await page.getByRole('button', { name: 'Prettify' }).click();
  await expect(page.getByRole('textbox', { name: 'XML result' })).not.toBeEmpty();

  await page.goto('/markdown-previewer');
  await page.getByRole('button', { name: 'Load sample' }).click();
  await expect(page.getByText('Waiting for input')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Copy HTML' }).first()).toBeEnabled();

  await page.goto('/git-diff-viewer');
  await page.getByRole('button', { name: 'Load sample' }).click();
  await expect(page.getByText(/files changed/).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('api builder: mocked 200 response and invalid-url honesty', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/api-request-builder');

  await page.route('https://api.example.com/users', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{"hello":"world"}',
    }),
  );
  await page.getByRole('textbox', { name: 'Request URL' }).fill('https://api.example.com/users');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByText(/Status 200/).first()).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole('textbox', { name: 'Response body' })).toContainText('hello');

  await page.getByRole('textbox', { name: 'Request URL' }).fill('not a url');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  expect(errors).toEqual([]);
});

test('websocket: invalid url rejected, refused endpoint reports honestly', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/websocket-tester');

  await page.getByRole('textbox', { name: 'WebSocket URL' }).fill('http://example.com');
  await page.getByRole('button', { name: 'Connect' }).click();
  await expect(page.getByRole('alert')).toBeVisible();

  // Unroutable high port: refused fast, not on the browser's blocked-port list.
  await page.getByRole('textbox', { name: 'WebSocket URL' }).fill('wss://127.0.0.1:44444');
  await page.getByRole('button', { name: 'Connect' }).click();
  await expect(page.getByRole('alert').or(page.getByText('Error', { exact: true }))).toBeVisible({
    timeout: 20000,
  });
  expect(errors).toEqual([]);
});

test('builders: docker command, nginx checks, cron explain, date/color/unit/status', async ({
  page,
}) => {
  const errors = collectErrors(page);

  await page.goto('/docker-command-builder');
  await page.getByRole('button', { name: 'Load sample' }).click();
  await expect(page.getByRole('textbox', { name: 'Generated docker command' })).toContainText(
    'docker run',
  );

  await page.goto('/nginx-config-validator');
  await page.getByRole('button', { name: 'Load sample' }).click();
  await expect(page.getByRole('button', { name: 'Copy' })).toBeEnabled();

  await page.goto('/cron-parser');
  await page.getByRole('button', { name: /Weekdays 9am/ }).click();
  await page.getByRole('button', { name: 'Explain' }).click();
  await expect(page.getByRole('textbox', { name: 'Schedule explanation' })).toContainText(
    'Monday through Friday',
  );

  await page.goto('/date-calculator');
  await page.getByRole('button', { name: 'Load sample' }).click();
  await page.getByRole('button', { name: 'Calculate difference' }).click();
  await expect(page.getByTestId('diff-days')).not.toBeEmpty();

  await page.goto('/color-converter');
  await page.getByRole('button', { name: 'Load sample' }).click();
  await expect(page.getByTestId('color-preview')).toBeVisible();

  await page.goto('/unit-converter');
  await page.getByRole('button', { name: 'Convert', exact: true }).click();
  await expect(page.getByTestId('unit-result')).not.toBeEmpty();

  await page.goto('/http-status-codes');
  await page.getByRole('textbox', { name: 'Search status codes' }).fill('404');
  await expect(page.getByTestId('status-code-404')).toBeVisible();

  await page.goto('/crontab-generator');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Cron');
  expect(errors).toEqual([]);
});

test('text tools: case convert, word stats, totp error honesty', async ({ page }) => {
  const errors = collectErrors(page);

  await page.goto('/case-converter');
  await page.getByRole('button', { name: 'Load sample' }).click();
  await page.getByRole('button', { name: 'Convert', exact: true }).click();
  await expect(page.getByTestId('output-snake')).not.toBeEmpty();

  await page.goto('/word-counter');
  await page.getByRole('button', { name: 'Load sample' }).click();
  await expect(page.getByTestId('stat-words')).not.toContainText('0');

  await page.goto('/totp-generator');
  await page.getByRole('textbox', { name: 'TOTP secret' }).fill('!!!');
  await expect(page.getByRole('alert')).toBeVisible();
  expect(errors).toEqual([]);
});

test('image converter: upload png, convert, download', async ({ page }, testInfo) => {
  const errors = collectErrors(page);
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  );
  const file = path.join(testInfo.outputDir, 'tiny.png');
  await fs.mkdir(testInfo.outputDir, { recursive: true });
  await fs.writeFile(file, png);

  await page.goto('/image-converter');
  await page.getByRole('button', { name: 'Select image' }).click();
  await page.locator('input[type="file"]').setInputFiles(file);
  await expect(page.getByAltText('Source preview')).toBeVisible({ timeout: 15000 });
  await page.getByRole('button', { name: 'Convert', exact: true }).click();
  await expect(page.getByAltText('Converted preview')).toBeVisible({ timeout: 20000 });

  const downloadPromise = page.waitForEvent('download');
  await page
    .getByRole('button', { name: /Download/ })
    .first()
    .click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.(png|jpg|jpeg|webp)$/);
  expect(errors).toEqual([]);
});

test('pdf tools: merge two generated pdfs and download', async ({ page }, testInfo) => {
  const errors = collectErrors(page);
  const { PDFDocument } = await import('pdf-lib');
  const path = await import('node:path');
  const fs = await import('node:fs/promises');

  async function onePage(text: string, file: string) {
    const doc = await PDFDocument.create();
    const pdfPage = doc.addPage([300, 200]);
    pdfPage.drawText(text, { x: 20, y: 100, size: 18 });
    await fs.writeFile(file, await doc.save());
  }
  await fs.mkdir(testInfo.outputDir, { recursive: true });
  const a = path.join(testInfo.outputDir, 'a.pdf');
  const b = path.join(testInfo.outputDir, 'b.pdf');
  await onePage('alpha', a);
  await onePage('beta', b);

  await page.goto('/pdf-tools');
  await page.getByRole('button', { name: /Add PDFs?/ }).click();
  await page.locator('input[type="file"]').setInputFiles([a, b]);
  await expect(page.getByText(/No PDFs yet/)).toHaveCount(0, { timeout: 15000 });

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Merge \d+ PDFs/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  expect(errors).toEqual([]);
});
