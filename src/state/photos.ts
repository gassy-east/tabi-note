import { useEffect, useState } from 'react'
import { photosDb } from '../lib/db'
import { processImageFile } from '../lib/image'
import { uid } from '../lib/util'
import type { PhotoRecord } from '../types'

/** 読み込み済み写真の data URL キャッシュ */
const cache = new Map<string, string>()
const pending = new Map<string, Promise<string | null>>()
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((l) => l())
}

export function loadPhoto(id: string): Promise<string | null> {
  const hit = cache.get(id)
  if (hit) return Promise.resolve(hit)
  const inflight = pending.get(id)
  if (inflight) return inflight
  const task = photosDb
    .get(id)
    .then((rec) => {
      if (rec?.dataUrl) {
        cache.set(id, rec.dataUrl)
        notify()
        return rec.dataUrl
      }
      return null
    })
    .catch(() => null)
    .finally(() => pending.delete(id))
  pending.set(id, task)
  return task
}

export function loadPhotos(ids: string[]): Promise<void> {
  return Promise.all(ids.map((id) => loadPhoto(id))).then(() => undefined)
}

export function peekPhoto(id: string): string | undefined {
  return cache.get(id)
}

/** 写真を保存して新しい ID を返す */
export async function savePhoto(file: File): Promise<string> {
  const processed = await processImageFile(file)
  const record: PhotoRecord = {
    id: uid('ph_'),
    dataUrl: processed.dataUrl,
    width: processed.width,
    height: processed.height,
    createdAt: Date.now(),
  }
  await photosDb.put(record)
  cache.set(record.id, record.dataUrl)
  notify()
  return record.id
}

export async function savePhotos(files: File[]): Promise<string[]> {
  const ids: string[] = []
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue
    ids.push(await savePhoto(file))
  }
  return ids
}

export async function deletePhoto(id: string): Promise<void> {
  cache.delete(id)
  await photosDb.remove(id)
  notify()
}

/** 画像 1 枚を購読する。読み込みは遅延で行う */
export function usePhoto(id: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(() => (id ? (cache.get(id) ?? null) : null))

  useEffect(() => {
    if (!id) {
      setUrl(null)
      return
    }
    let alive = true
    const sync = () => {
      const hit = cache.get(id)
      if (alive && hit) setUrl(hit)
    }
    listeners.add(sync)
    const hit = cache.get(id)
    if (hit) setUrl(hit)
    else void loadPhoto(id).then((v) => alive && setUrl(v))
    return () => {
      alive = false
      listeners.delete(sync)
    }
  }, [id])

  return url
}
