import { test as base, chromium, type Page } from '@playwright/test';

/**
 * Lightpanda page fixture.
 *
 * Lightpanda has no rendering engine, so everything mouse- or pixel-based
 * is unavailable: click/fill/hover/pressSequentially, screenshots, geometry
 * (getBoundingClientRect returns stubs), clipboard, ServiceWorker, downloads.
 * What works: navigation, AX-tree queries, textContent reads, JS focus +
 * keyboard Enter/Space, typing into NATIVE inputs, dialogs, console/network
 * observation. Helpers below encode exactly that contract — nothing else.
 */

const LP_CDP_URL = process.env.LP_CDP_URL || 'ws://127.0.0.1:9222';

export const lpTest = base.extend<{ lpPage: Page }>({
  // Playwright requires the object-destructuring fixture pattern.
  // eslint-disable-next-line no-empty-pattern
  lpPage: async ({}, use) => {
    let browser;
    try {
      browser = await chromium.connectOverCDP(LP_CDP_URL, { timeout: 15000 });
    } catch {
      throw new Error(
        `Lightpanda CDP unreachable at ${LP_CDP_URL}. Start it with: lightpanda serve --host 127.0.0.1 --port 9222`,
      );
    }
    const context = await browser.newContext({});
    const page = await context.newPage();
    // `use` is the Playwright fixture mechanism, not a React hook.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(page);
    await page.close().catch(() => {});
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  },
});

/** Collect page errors for `expect(errors).toEqual([])` at test end. */
export function trackPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

/** Activate a control the way Lightpanda allows: DOM focus + Enter. */
export async function lpActivate(
  page: Page,
  role: 'button' | 'link' | 'checkbox' | 'radio' | 'tab',
  name: string | RegExp,
): Promise<void> {
  await page.getByRole(role, { name }).evaluate((el) => (el as HTMLElement).focus());
  await page.keyboard.press('Enter');
}

/** Type into a NATIVE input/textarea (CodeMirror editors are unsupported). */
export async function lpTypeNative(page: Page, name: string | RegExp, text: string): Promise<void> {
  const input = page.getByRole('textbox', { name });
  await input.evaluate((el) => {
    (el as HTMLElement).focus();
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) el.select();
  });
  await page.keyboard.type(text, { delay: 5 });
}

/** Read visible text of the first element matching the role+name. */
export async function lpText(
  page: Page,
  role: 'textbox' | 'status' | 'alert' | 'heading',
  name: string | RegExp,
): Promise<string> {
  return (await page.getByRole(role, { name }).first().textContent()) ?? '';
}
