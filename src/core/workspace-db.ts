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

const DB_NAME = 'toolbit-workspaces';
const DB_VERSION = 1;
const STORE_NAME = 'workspaces';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => {
        dbPromise = null;
        reject(request.error);
      };
      request.onblocked = () => {
        dbPromise = null;
        reject(new Error('Storage upgrade blocked by another tab'));
      };
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('name', 'name', { unique: false });
        }
      };
      request.onsuccess = () => resolve(request.result);
    } catch (error) {
      dbPromise = null;
      throw error;
    }
  });
  return dbPromise;
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

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
