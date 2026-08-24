import type { PhotoRecord, Trip } from '../types'

const DB_NAME = 'tabinote'
const DB_VERSION = 1
const TRIPS = 'trips'
const PHOTOS = 'photos'

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(TRIPS)) db.createObjectStore(TRIPS, { keyPath: 'id' })
      if (!db.objectStoreNames.contains(PHOTOS)) db.createObjectStore(PHOTOS, { keyPath: 'id' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

function run<T>(
  store: string,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(store, mode)
        const req = fn(tx.objectStore(store))
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      }),
  )
}

export const tripsDb = {
  all: () => run<Trip[]>(TRIPS, 'readonly', (s) => s.getAll() as IDBRequest<Trip[]>),
  put: (trip: Trip) => run(TRIPS, 'readwrite', (s) => s.put(trip)),
  remove: (id: string) => run(TRIPS, 'readwrite', (s) => s.delete(id)),
}

export const photosDb = {
  get: (id: string) => run<PhotoRecord | undefined>(PHOTOS, 'readonly', (s) => s.get(id)),
  allIds: () => run<IDBValidKey[]>(PHOTOS, 'readonly', (s) => s.getAllKeys()),
  all: () => run<PhotoRecord[]>(PHOTOS, 'readonly', (s) => s.getAll() as IDBRequest<PhotoRecord[]>),
  put: (photo: PhotoRecord) => run(PHOTOS, 'readwrite', (s) => s.put(photo)),
  remove: (id: string) => run(PHOTOS, 'readwrite', (s) => s.delete(id)),
}

/** おおよその使用容量（ブラウザ が対応していれば） */
export async function estimateUsage(): Promise<{ usage: number; quota: number } | null> {
  if (!navigator.storage?.estimate) return null
  const { usage = 0, quota = 0 } = await navigator.storage.estimate()
  return { usage, quota }
}
