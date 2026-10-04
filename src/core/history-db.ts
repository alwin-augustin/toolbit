import { canPersistTool } from '@/core/tool-policy';
import { usePreferences } from '@/core/preferences';
export interface ToolHistoryEntry {
  id?: number;
  toolId: string;
  toolName: string;
  timestamp: number;
  input: string;
  output?: string;
  metadata?: Record<string, unknown>;
}

import { createDatabaseOpener, requestToPromise, transactionDone } from '@/core/idb-utils';

const DB_NAME = 'toolbit-history';
const DB_VERSION = 1;
const STORE_NAME = 'history';
const MAX_TOTAL_ENTRIES = 200;
const MAX_PER_TOOL = 20;

const openDb = createDatabaseOpener({
  name: DB_NAME,
  version: DB_VERSION,
  onUpgrade: (db) => {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      store.createIndex('timestamp', 'timestamp', { unique: false });
      store.createIndex('toolId', 'toolId', { unique: false });
      store.createIndex('toolIdTimestamp', ['toolId', 'timestamp'], { unique: false });
    }
  },
});

async function pruneByToolId(db: IDBDatabase, toolId: string) {
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const index = store.index('toolIdTimestamp');
  const range = IDBKeyRange.bound([toolId, 0], [toolId, Number.MAX_SAFE_INTEGER]);
  let count = 0;
  await new Promise<void>((resolve, reject) => {
    const request = index.openCursor(range, 'prev');
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
      if (!cursor) {
        resolve();
        return;
      }
      count += 1;
      if (count > MAX_PER_TOOL) {
        store.delete(cursor.primaryKey);
      }
      cursor.continue();
    };
    request.onerror = () => reject(request.error);
  });

  await transactionDone(tx);
}

async function pruneTotal(db: IDBDatabase) {
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const index = store.index('timestamp');
  let count = 0;

  await new Promise<void>((resolve, reject) => {
    const request = index.openCursor(null, 'prev');
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
      if (!cursor) {
        resolve();
        return;
      }
      count += 1;
      if (count > MAX_TOTAL_ENTRIES) {
        store.delete(cursor.primaryKey);
      }
      cursor.continue();
    };
    request.onerror = () => reject(request.error);
  });

  await transactionDone(tx);
}

export async function addHistoryEntry(entry: ToolHistoryEntry) {
  if (!canPersistTool(entry.toolId) || !usePreferences.getState().history) return;
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  await requestToPromise(store.add(entry));
  await transactionDone(tx);

  await pruneByToolId(db, entry.toolId);
  await pruneTotal(db);
}

export async function getHistoryByToolId(
  toolId: string,
  limit = MAX_PER_TOOL,
): Promise<ToolHistoryEntry[]> {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const index = store.index('toolIdTimestamp');
  const range = IDBKeyRange.bound([toolId, 0], [toolId, Number.MAX_SAFE_INTEGER]);
  const results: ToolHistoryEntry[] = [];

  await new Promise<void>((resolve, reject) => {
    const request = index.openCursor(range, 'prev');
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
      if (!cursor || results.length >= limit) {
        resolve();
        return;
      }
      results.push(cursor.value as ToolHistoryEntry);
      cursor.continue();
    };
    request.onerror = () => reject(request.error);
  });

  await transactionDone(tx);
  return results;
}

export async function getRecentHistory(limit = 10): Promise<ToolHistoryEntry[]> {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const index = store.index('timestamp');
  const results: ToolHistoryEntry[] = [];

  await new Promise<void>((resolve, reject) => {
    const request = index.openCursor(null, 'prev');
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
      if (!cursor || results.length >= limit) {
        resolve();
        return;
      }
      results.push(cursor.value as ToolHistoryEntry);
      cursor.continue();
    };
    request.onerror = () => reject(request.error);
  });

  await transactionDone(tx);
  return results;
}

export async function clearHistoryByToolId(toolId: string) {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const index = store.index('toolId');
  const range = IDBKeyRange.only(toolId);

  await new Promise<void>((resolve, reject) => {
    const request = index.openCursor(range);
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
      if (!cursor) {
        resolve();
        return;
      }
      store.delete(cursor.primaryKey);
      cursor.continue();
    };
    request.onerror = () => reject(request.error);
  });

  await transactionDone(tx);
}

export async function clearAllHistory() {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await requestToPromise(tx.objectStore(STORE_NAME).clear());
  await transactionDone(tx);
}
export async function pruneExpiredHistory() {
  let retention = usePreferences.getState().retentionDays;
  if (!Number.isFinite(retention) || retention < 1 || retention > 365) retention = 30;
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const cutoff = Date.now() - retention * 86400000;
  const store = tx.objectStore(STORE_NAME);
  await new Promise<void>((resolve, reject) => {
    const request = store.index('timestamp').openCursor(IDBKeyRange.upperBound(cutoff));
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) return resolve();
      cursor.delete();
      cursor.continue();
    };
    request.onerror = () => reject(request.error);
  });
  await transactionDone(tx);
}
