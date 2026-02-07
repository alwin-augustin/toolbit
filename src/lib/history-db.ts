export interface ToolHistoryEntry {
    id?: number
    toolId: string
    toolName: string
    timestamp: number
    input: string
    output?: string
    metadata?: Record<string, unknown>
}

const DB_NAME = "toolbit-history"
const DB_VERSION = 1
const STORE_NAME = "history"
const MAX_TOTAL_ENTRIES = 200
const MAX_PER_TOOL = 20

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
    if (dbPromise) return dbPromise
    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION)
        request.onerror = () => reject(request.error)
        request.onupgradeneeded = () => {
            const db = request.result
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true })
                store.createIndex("timestamp", "timestamp", { unique: false })
                store.createIndex("toolId", "toolId", { unique: false })
                store.createIndex("toolIdTimestamp", ["toolId", "timestamp"], { unique: false })
            }
        }
        request.onsuccess = () => resolve(request.result)
    })
    return dbPromise
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
    })
}

function transactionDone(tx: IDBTransaction): Promise<void> {
    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
        tx.onabort = () => reject(tx.error)
    })
}

async function pruneByToolId(db: IDBDatabase, toolId: string) {
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    const index = store.index("toolIdTimestamp")
    const range = IDBKeyRange.bound([toolId, 0], [toolId, Number.MAX_SAFE_INTEGER])
    let count = 0
    await new Promise<void>((resolve, reject) => {
        const request = index.openCursor(range, "prev")
        request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result
            if (!cursor) {
                resolve()
                return
            }
            count += 1
            if (count > MAX_PER_TOOL) {
                store.delete(cursor.primaryKey)
            }
            cursor.continue()
        }
        request.onerror = () => reject(request.error)
    })

    await transactionDone(tx)
}

async function pruneTotal(db: IDBDatabase) {
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    const index = store.index("timestamp")
    let count = 0

    await new Promise<void>((resolve, reject) => {
        const request = index.openCursor(null, "prev")
        request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result
            if (!cursor) {
                resolve()
                return
            }
            count += 1
            if (count > MAX_TOTAL_ENTRIES) {
                store.delete(cursor.primaryKey)
            }
            cursor.continue()
        }
        request.onerror = () => reject(request.error)
    })

    await transactionDone(tx)
}

export async function addHistoryEntry(entry: ToolHistoryEntry) {
    const db = await openDb()
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    await requestToPromise(store.add(entry))
    await transactionDone(tx)

    await pruneByToolId(db, entry.toolId)
    await pruneTotal(db)
}

export async function getHistoryByToolId(toolId: string, limit = MAX_PER_TOOL): Promise<ToolHistoryEntry[]> {
    const db = await openDb()
    const tx = db.transaction(STORE_NAME, "readonly")
    const store = tx.objectStore(STORE_NAME)
    const index = store.index("toolIdTimestamp")
    const range = IDBKeyRange.bound([toolId, 0], [toolId, Number.MAX_SAFE_INTEGER])
    const results: ToolHistoryEntry[] = []

    await new Promise<void>((resolve, reject) => {
        index.openCursor(range, "prev").onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result
            if (!cursor || results.length >= limit) {
                resolve()
                return
            }
            results.push(cursor.value as ToolHistoryEntry)
            cursor.continue()
        }
        index.openCursor(range, "prev").onerror = () => reject(index.openCursor(range, "prev").error)
    })

    await transactionDone(tx)
    return results
}

export async function getRecentHistory(limit = 10): Promise<ToolHistoryEntry[]> {
    const db = await openDb()
    const tx = db.transaction(STORE_NAME, "readonly")
    const store = tx.objectStore(STORE_NAME)
    const index = store.index("timestamp")
    const results: ToolHistoryEntry[] = []

    await new Promise<void>((resolve, reject) => {
        index.openCursor(null, "prev").onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result
            if (!cursor || results.length >= limit) {
                resolve()
                return
            }
            results.push(cursor.value as ToolHistoryEntry)
            cursor.continue()
        }
        index.openCursor(null, "prev").onerror = () => reject(index.openCursor(null, "prev").error)
    })

    await transactionDone(tx)
    return results
}

export async function clearHistoryByToolId(toolId: string) {
    const db = await openDb()
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    const index = store.index("toolId")
    const range = IDBKeyRange.only(toolId)

    await new Promise<void>((resolve, reject) => {
        index.openCursor(range).onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result
            if (!cursor) {
                resolve()
                return
            }
            store.delete(cursor.primaryKey)
            cursor.continue()
        }
        index.openCursor(range).onerror = () => reject(index.openCursor(range).error)
    })

    await transactionDone(tx)
}
