import { test, expect } from '@playwright/test';

/**
 * T2.4 (PRIVACY.md §5): "Delete all local data" empties every documented store
 * — localStorage, sessionStorage, and the IndexedDB databases — and the reload
 * does not bring any of it back. The stores are seeded directly so the spec
 * asserts the deletion surface, not the journeys that created the data.
 */

test('delete all local data empties every store and a reload leaves nothing', async ({ page }) => {
  await page.goto('/settings');
  await page.evaluate(async () => {
    localStorage.setItem('toolbit:favorites', '["json-formatter"]');
    localStorage.setItem('toolbit:panel', 'collapsed');
    sessionStorage.setItem('toolbit:smart-paste', '{"seeded":true}');
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('toolbit-history', 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore('history', { keyPath: 'id', autoIncrement: true });
      };
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction('history', 'readwrite');
        transaction.objectStore('history').put({
          toolId: 'json-formatter',
          toolName: 'JSON Formatter',
          timestamp: 1,
          input: 'CANARY_SEEDED',
        });
        transaction.oncomplete = () => {
          db.close();
          resolve();
        };
        transaction.onerror = () => {
          db.close();
          reject(transaction.error);
        };
      };
      request.onerror = () => reject(request.error);
    });
  });

  await Promise.all([
    page.waitForEvent('load'),
    (async () => {
      await page.getByRole('button', { name: 'Delete all local data' }).click();
      await page.getByRole('button', { name: 'Delete everything' }).click();
    })(),
  ]);

  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
  expect(await page.evaluate(() => Object.keys(sessionStorage))).toEqual([]);

  // Boot may recreate empty container databases, but no record may survive.
  const historyCount = await page.evaluate(
    () =>
      new Promise<number>((resolve, reject) => {
        const request = indexedDB.open('toolbit-history', 1);
        request.onupgradeneeded = () => {
          request.result.createObjectStore('history', { keyPath: 'id', autoIncrement: true });
        };
        request.onsuccess = () => {
          const db = request.result;
          const count = db.transaction('history', 'readonly').objectStore('history').count();
          count.onsuccess = () => {
            db.close();
            resolve(count.result);
          };
          count.onerror = () => {
            db.close();
            reject(count.error);
          };
        };
        request.onerror = () => reject(request.error);
      }),
  );
  expect(historyCount).toBe(0);

  const databases = await page.evaluate(async () =>
    typeof indexedDB.databases === 'function'
      ? (await indexedDB.databases()).map((database) => database.name)
      : [],
  );
  expect(databases).not.toContain('toolbit-workspaces');

  // The app is still fully usable after the wipe.
  await page.goto('/json-formatter');
  await page.getByRole('textbox', { name: 'Input code', exact: true }).fill('{"after":true}');
  await page.getByRole('button', { name: 'Format', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Result code', exact: true })).toContainText(
    '"after"',
  );
});
