import { closeHistoryDb } from '@/core/history-db';
import { closeWorkspaceDb } from '@/core/workspace-db';

/**
 * "Delete all local data" — one action, one documented meaning.
 *
 * The store inventory lives in `PRIVACY.md` (Appendix B). Everything the app
 * writes is addressed here: localStorage keys under the `toolbit` prefix plus
 * the theme key, sessionStorage handoffs, and the IndexedDB databases. The
 * service worker's Cache Storage is deliberately left alone — it holds build
 * assets only, and wiping it would just break offline mode.
 *
 * "Delete" means gone: no tombstones, no leftover identifiers, no cached
 * copies of user content. Storage the browser denies (private mode, revoked
 * permission) leaves the session usable; the caller is told what was removed.
 */

/** Every local/session storage key the app owns shares this prefix. */
const KEY_PREFIX = 'toolbit';
/**
 * Keys that predate the prefix convention. `theme-init.js` reads this key
 * before the bundle loads, so it cannot be renamed without a migration.
 */
const EXTRA_LOCAL_KEYS = ['theme'];
/** Databases written by this app; enumeration catches any future additions. */
const DATABASE_NAMES = ['toolbit-history', 'toolbit-workspaces'];

function ownsKey(key: string): boolean {
  return key.startsWith(KEY_PREFIX) || EXTRA_LOCAL_KEYS.includes(key);
}

function sweep(storage: Storage): string[] {
  const removed: string[] = [];
  try {
    for (let i = storage.length - 1; i >= 0; i -= 1) {
      const key = storage.key(i);
      if (key === null || !ownsKey(key)) continue;
      storage.removeItem(key);
      removed.push(key);
    }
  } catch {
    /* Storage denied entirely: nothing to sweep. */
  }
  return removed;
}

function deleteDatabase(name: string): Promise<void> {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.deleteDatabase(name);
      // A blocked delete (another tab still holds the database open) is left
      // pending by the browser and completes when that tab lets go; resolving
      // here keeps the rest of the wipe — and the reload — moving.
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
      request.onblocked = () => resolve();
    } catch {
      resolve();
    }
  });
}

async function databaseNames(): Promise<string[]> {
  const names = new Set(DATABASE_NAMES);
  try {
    if (typeof indexedDB.databases === 'function') {
      for (const database of await indexedDB.databases()) {
        if (database.name?.startsWith(KEY_PREFIX)) names.add(database.name);
      }
    }
  } catch {
    /* Enumeration is a superset nicety; the named list is authoritative. */
  }
  return [...names];
}

/**
 * Remove every store this app keeps on the device. Returns the local and
 * session storage keys that were removed, so callers and tests can speak
 * about what happened instead of guessing.
 */
export async function deleteAllLocalData(): Promise<string[]> {
  const removed: string[] = [];
  try {
    removed.push(...sweep(window.localStorage), ...sweep(window.sessionStorage));
  } catch {
    /* Storage access denied: only the databases remain to clear. */
  }
  await Promise.allSettled([closeHistoryDb(), closeWorkspaceDb()]);
  await Promise.allSettled((await databaseNames()).map(deleteDatabase));
  return removed;
}
