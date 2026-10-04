export function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export interface DatabaseOpenerOptions {
  name: string;
  version: number;
  onUpgrade: (db: IDBDatabase, oldVersion: number, newVersion: number | null) => void;
}

export function createDatabaseOpener({
  name,
  version,
  onUpgrade,
}: DatabaseOpenerOptions): () => Promise<IDBDatabase> {
  let dbPromise: Promise<IDBDatabase> | null = null;
  return () => {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(name, version);
        request.onerror = () => {
          dbPromise = null;
          reject(request.error);
        };
        request.onblocked = () => {
          dbPromise = null;
          reject(new Error('Storage upgrade blocked by another tab'));
        };
        request.onupgradeneeded = (event) => {
          onUpgrade(request.result, event.oldVersion, event.newVersion);
        };
        request.onsuccess = () => resolve(request.result);
      } catch (error) {
        dbPromise = null;
        throw error;
      }
    });
    return dbPromise;
  };
}
