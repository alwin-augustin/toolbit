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

const INPUT = 'Input code';
const OUTPUT = 'Result code';

test('start, smart paste, documents, history and recipe', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Start' })).toBeVisible();

  // Smart paste suggests JSON and opens a new document carrying the payload.
  await page.getByRole('textbox', { name: 'Paste data to find a tool' }).fill('{"b":2,"a":1}');
  await page.getByRole('button', { name: /Open JSON/ }).click();
  await expect(page).toHaveURL(/json-formatter/);
  await expect(page.getByRole('textbox', { name: INPUT })).toContainText('"b":2');
  await page.getByRole('button', { name: 'Format', exact: true }).click();
  await expect(page.getByRole('textbox', { name: OUTPUT })).toContainText('"b": 2');
  await expect(page.getByRole('button', { name: 'Copy result' })).toBeEnabled();

  // Command search opens another tool as a second document tab.
  await page.getByRole('button', { name: 'Search tools or actions...' }).click();
  await page.getByRole('textbox', { name: 'Search tools and saved work' }).fill('timestamp');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/timestamp-converter/);

  // Document tabs keep independent inputs (in-app navigation, no reload:
  // document payloads are session-only by design).
  await page
    .locator('.wb-doc-tabs-row')
    .getByRole('link', { name: 'JSON', exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/json-formatter/);
  await expect(page.getByRole('textbox', { name: INPUT })).toContainText('"b":2');

  // Opt-in history records the run; restoring reopens the original input.
  await page.getByRole('button', { name: 'History', exact: true }).click();
  await page.getByRole('checkbox', { name: /Remember runs in this session/ }).check();
  await page
    .locator('.wb-doc-tabs-row')
    .getByRole('link', { name: 'JSON', exact: true })
    .first()
    .click();
  await page.getByRole('button', { name: 'Format', exact: true }).click();
  await page.getByRole('button', { name: 'History', exact: true }).click();
  await page.getByRole('button', { name: /JSON · format/ }).click();
  await expect(page).toHaveURL(/json-formatter/);
  await expect(page.getByRole('textbox', { name: INPUT })).toContainText('"b":2');

  // The example recipe decodes and formats the invoice sample.
  await page.getByRole('button', { name: 'Saved', exact: true }).click();
  await page
    .getByRole('tab', { name: 'Examples' })
    .or(page.getByRole('button', { name: 'Examples' }))
    .click();
  await page.getByRole('button', { name: /Decode webhook payload/ }).click();
  await expect(page.getByRole('heading', { name: 'JSON' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: OUTPUT })).toContainText('invoice.paid');
  expect(errors).toEqual([]);
});

test('invalid JSON explains the location and disables copy', async ({ page }) => {
  await page.goto('/json-formatter');
  await page.getByRole('textbox', { name: INPUT }).fill('{"a":1,');
  await page.getByRole('button', { name: 'Format', exact: true }).click();
  const alert = page.getByRole('alert');
  // Chromium reports line/column; WebKit only gives the engine message.
  await expect(alert).toContainText(/line 1, column 8|must be a string literal/);
  await expect(page.getByRole('button', { name: 'Copy result' })).toBeDisabled();
  await page.getByRole('textbox', { name: INPUT }).fill('{"a":1}');
  await page.getByRole('button', { name: 'Format', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Copy result' })).toBeEnabled();
});

test('offline direct navigation reaches cached tools', async ({ page }) => {
  // Stop a dedicated origin instead of using WebKit's broken offline emulation.
  const { preview } = await import('vite');
  const server = await preview({ configFile: false, preview: { host: '127.0.0.1', port: 0 } });
  const address = server.httpServer.address();
  if (!address || typeof address === 'string') throw new Error('Preview failed to start');
  const origin = `http://127.0.0.1:${address.port}`;
  try {
    await page.goto(origin);
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Start' })).toBeVisible();
    (server.httpServer as unknown as { closeAllConnections: () => void }).closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.httpServer.close((error) => (error ? reject(error) : resolve())),
    );
    await page.goto(`${origin}/base64-encoder`);
    await page.getByRole('textbox', { name: INPUT }).fill('Hello');
    await page.getByRole('button', { name: 'Encode', exact: true }).click();
    await expect(page.getByRole('textbox', { name: OUTPUT })).toContainText('SGVsbG8=');
  } finally {
    if (server.httpServer.listening) {
      (server.httpServer as unknown as { closeAllConnections: () => void }).closeAllConnections();
      await new Promise<void>((resolve) => server.httpServer.close(() => resolve()));
    }
  }
});

test('storage and clipboard denial leave a working transform and an honest copy state', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('Denied', 'SecurityError');
      },
    });
    Object.defineProperty(window, 'indexedDB', {
      get() {
        throw new DOMException('Denied', 'SecurityError');
      },
    });
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.reject(new DOMException('Denied', 'NotAllowedError')) },
    });
    document.execCommand = () => false;
  });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/base64-encoder');
  await page.getByRole('textbox', { name: INPUT }).fill('Hello');
  await page.getByRole('button', { name: 'Encode', exact: true }).click();
  await expect(page.getByRole('textbox', { name: OUTPUT })).toContainText('SGVsbG8=');
  await page.getByRole('button', { name: 'Copy result' }).click();
  await expect(page.getByRole('status')).toContainText('Clipboard unavailable');
  expect(errors).toEqual([]);
});

test('navigation drawer and narrow views remain usable', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('button', { name: 'Saved', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Saved' })).toBeVisible();
  await page.goto('/json-formatter');
  await page.getByRole('textbox', { name: INPUT }).fill('{"mobile":true}');
  await page.getByRole('button', { name: 'Format', exact: true }).click();
  await expect(page.getByRole('textbox', { name: OUTPUT })).toContainText('"mobile": true');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: path.join(testInfo.outputDir, 'mobile-json.png'), fullPage: true });
});

test('tabs survive refresh while payloads stay session-only', async ({ page }) => {
  await page.goto('/json-formatter');
  await page.getByRole('textbox', { name: INPUT }).fill('{"saved":true}');
  await page.getByRole('button', { name: 'Format', exact: true }).click();
  await page.reload();
  // The tab chrome is restored; its content is not persisted across refresh.
  await expect(
    page.locator('.wb-doc-tabs-row').getByRole('link', { name: 'JSON', exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByRole('textbox', { name: INPUT })).toContainText('invoice.paid');
});

test('large input shows a bounded preview and copies the complete output', async ({
  page,
  context,
  browserName,
}) => {
  if (browserName !== 'chromium') {
    await page.addInitScript(() => {
      let copied = '';
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: async (value: string) => {
            copied = value;
          },
          readText: async () => copied,
        },
      });
    });
  } else await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/json-formatter');
  const raw = JSON.stringify({ data: 'x'.repeat(120 * 1024) });
  await page.getByRole('textbox', { name: INPUT }).evaluate((element, text) => {
    const data = new DataTransfer();
    data.setData('text/plain', text);
    element.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }),
    );
  }, raw);
  await expect(
    page.getByText('Preview shows the first 100 KB. Processing uses the complete input.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Format', exact: true }).click();
  await expect(
    page.getByText('Preview shows the first 100 KB. Copy and pipe use the complete output.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Copy result' }).click();
  expect(JSON.parse(await page.evaluate(() => navigator.clipboard.readText()))).toEqual(
    JSON.parse(raw),
  );
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  await page.getByRole('textbox', { name: INPUT }).fill('{"new":true}');
  await page.getByRole('button', { name: 'Format', exact: true }).click();
  await expect(page.getByRole('textbox', { name: OUTPUT })).toContainText('"new": true');
});

test('search and save dialogs pass accessibility checks at 200 percent scale', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/json-formatter');
  await page.evaluate(() => {
    document.documentElement.style.zoom = '2';
  });
  await page.getByRole('button', { name: 'Search tools or actions...' }).click();
  let result = await new AxeBuilder({ page }).analyze();
  expect(result.violations.filter((v) => ['serious', 'critical'].includes(v.impact || ''))).toEqual(
    [],
  );
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Save session' }).click();
  result = await new AxeBuilder({ page }).analyze();
  expect(result.violations.filter((v) => ['serious', 'critical'].includes(v.impact || ''))).toEqual(
    [],
  );
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
