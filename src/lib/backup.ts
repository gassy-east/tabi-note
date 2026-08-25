import type { PhotoRecord, Trip } from '../types'
import { photosDb } from './db'
import { collectPhotoIds, importTrips } from '../state/store'
import { getTemplate, isFactoryTemplate, setTemplate } from '../state/settings'
import { downloadBlob } from './image'

const FORMAT = 'tabinote-backup'
const VERSION = 3

interface BackupFile {
  format: string
  version: number
  exportedAt: string
  trips: Trip[]
  photos: PhotoRecord[]
  packingTemplate?: string[]
  todoTemplate?: string[]
}

export async function exportBackup(trips: Trip[]): Promise<void> {
  const ids = new Set<string>()
  for (const trip of trips) for (const id of collectPhotoIds(trip)) ids.add(id)

  const photos: PhotoRecord[] = []
  for (const id of ids) {
    const rec = await photosDb.get(id)
    if (rec) photos.push(rec)
  }

  const payload: BackupFile = {
    format: FORMAT,
    version: VERSION,
    exportedAt: new Date().toISOString(),
    trips,
    photos,
    packingTemplate: getTemplate('packing'),
    todoTemplate: getTemplate('todo'),
  }
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  downloadBlob(blob, `tabinote-backup-${stamp}.json`)
}

export async function importBackup(file: File): Promise<number> {
  const text = await file.text()
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('ファイルを読み取れませんでした')
  }
  if (!isBackup(data)) throw new Error('たびノートのバックアップファイルではないようです')

  for (const photo of data.photos) {
    if (photo && typeof photo.id === 'string' && typeof photo.dataUrl === 'string') {
      await photosDb.put(photo)
    }
  }

  // テンプレートは、この端末でまだ手を加えていないときだけ復元する
  if (Array.isArray(data.packingTemplate) && isFactoryTemplate('packing')) {
    setTemplate('packing', data.packingTemplate)
  }
  if (Array.isArray(data.todoTemplate) && isFactoryTemplate('todo')) {
    setTemplate('todo', data.todoTemplate)
  }

  return importTrips(data.trips)
}

function isBackup(value: unknown): value is BackupFile {
  if (!value || typeof value !== 'object') return false
  const v = value as Partial<BackupFile>
  return v.format === FORMAT && Array.isArray(v.trips) && Array.isArray(v.photos)
}
