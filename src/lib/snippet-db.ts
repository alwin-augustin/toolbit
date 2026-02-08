export interface Snippet {
    id: string
    name: string
    content: string
    toolId?: string
    createdAt: number
}

const DB_NAME = "toolbit-snippets"
const DB_VERSION = 1
const STORE_NAME = "snippets"

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
    if (dbPromise) return dbPromise
    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION)
        request.onerror = () => reject(request.error)
        request.onupgradeneeded = () => {
            const db = request.result
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: "id" })
                store.createIndex("createdAt", "createdAt", { unique: false })
                store.createIndex("name", "name", { unique: false })
                store.createIndex("toolId", "toolId", { unique: false })
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

export async function listSnippets(): Promise<Snippet[]> {
    const db = await openDb()
    const tx = db.transaction(STORE_NAME, "readonly")
    const store = tx.objectStore(STORE_NAME)
    const index = store.index("createdAt")
    const results: Snippet[] = []

    await new Promise<void>((resolve, reject) => {
        const request = index.openCursor(null, "prev")
        request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result
            if (!cursor) {
                resolve()
                return
            }
            results.push(cursor.value as Snippet)
            cursor.continue()
        }
        request.onerror = () => reject(request.error)
    })

    await transactionDone(tx)
    return results
}

export async function saveSnippet(snippet: Snippet): Promise<void> {
    const db = await openDb()
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    await requestToPromise(store.put(snippet))
    await transactionDone(tx)
}

export async function deleteSnippet(id: string): Promise<void> {
    const db = await openDb()
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    await requestToPromise(store.delete(id))
    await transactionDone(tx)
}
