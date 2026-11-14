"use client";

/**
 * Local byte store for the File Manager, backed by IndexedDB.
 *
 * - For guests / offline, this is the source of truth for file bytes.
 * - For signed-in users, it doubles as a fast preview/download cache in front
 *   of Backblaze B2 (so re-opening a file is instant and works offline).
 *
 * Keyed by the file node's client id. Values are raw `Blob`s.
 */
const DB_NAME = "nexus.files";
const STORE = "blobs";
const VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB unavailable"));
  }
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode);
        const store = transaction.objectStore(STORE);
        const request = run(store);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      })
  );
}

export const blobStore = {
  /** Store (or replace) a file's bytes. */
  async put(id: string, blob: Blob): Promise<void> {
    await tx("readwrite", (s) => s.put(blob, id));
  },

  /** Read a file's bytes, or null when not cached locally. */
  async get(id: string): Promise<Blob | null> {
    try {
      const blob = await tx<Blob | undefined>("readonly", (s) => s.get(id));
      return blob ?? null;
    } catch {
      return null;
    }
  },

  /** Whether bytes for this id exist locally. */
  async has(id: string): Promise<boolean> {
    try {
      const key = await tx<IDBValidKey | undefined>("readonly", (s) => s.getKey(id));
      return key !== undefined;
    } catch {
      return false;
    }
  },

  /** Delete a file's bytes. */
  async del(id: string): Promise<void> {
    try {
      await tx("readwrite", (s) => s.delete(id));
    } catch {
      /* ignore */
    }
  },

  /** Total size of locally cached bytes (used by the storage meter). */
  async totalSize(): Promise<number> {
    try {
      const db = await openDb();
      return await new Promise<number>((resolve) => {
        const transaction = db.transaction(STORE, "readonly");
        const store = transaction.objectStore(STORE);
        const cursorReq = store.openCursor();
        let total = 0;
        cursorReq.onsuccess = () => {
          const cursor = cursorReq.result;
          if (cursor) {
            const val = cursor.value as Blob;
            total += val?.size ?? 0;
            cursor.continue();
          } else {
            resolve(total);
          }
        };
        cursorReq.onerror = () => resolve(total);
      });
    } catch {
      return 0;
    }
  },
};
