import { parseWorkspace, type ToolDocumentV1 } from '@/core/workspace-schema';
export interface WorkspaceToolState {
  toolId: string;
  state: string;
}

export interface Workspace {
  id: string;
  name: string;
  createdAt: number;
  updatedAt?: number;
  tools: WorkspaceToolState[];
  schemaVersion?: 1;
  productVersion?: string;
  documents?: ToolDocumentV1[];
  activeDocumentId?: string;
  layout?: { density: 'compact' | 'comfortable'; inspectorOpen: boolean };
}

import { createDatabaseOpener, requestToPromise, transactionDone } from '@/core/idb-utils';

const DB_NAME = 'toolbit-workspaces';
const DB_VERSION = 1;
const STORE_NAME = 'workspaces';

const openDb = createDatabaseOpener({
  name: DB_NAME,
  version: DB_VERSION,
  onUpgrade: (db) => {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      store.createIndex('createdAt', 'createdAt', { unique: false });
      store.createIndex('name', 'name', { unique: false });
    }
  },
});

export async function listWorkspaces(): Promise<Workspace[]> {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const index = store.index('createdAt');
  const results: Workspace[] = [];

  await new Promise<void>((resolve, reject) => {
    const request = index.openCursor(null, 'prev');
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
      if (!cursor) {
        resolve();
        return;
      }
      results.push(cursor.value as Workspace);
      cursor.continue();
    };
    request.onerror = () => reject(request.error);
  });

  await transactionDone(tx);
  return results.sort((a, b) => (b.updatedAt ?? b.createdAt) - (a.updatedAt ?? a.createdAt));
}

export async function getWorkspace(id: string): Promise<Workspace | null> {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const result = await requestToPromise(store.get(id));
  await transactionDone(tx);
  return (result as Workspace) || null;
}

export async function saveWorkspace(workspace: Workspace): Promise<void> {
  const validated = parseWorkspace(JSON.stringify(workspace));
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  await requestToPromise(
    store.put({
      ...validated,
      createdAt: workspace.createdAt || Date.now(),
      updatedAt: Date.now(),
      tools: validated.tools.map((tool) => ({ ...tool })),
    }),
  );
  await transactionDone(tx);
}

export async function deleteWorkspace(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  await requestToPromise(store.delete(id));
  await transactionDone(tx);
}
