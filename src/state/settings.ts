import { useSyncExternalStore } from 'react'
import { DEFAULT_PACKING } from '../lib/catalog'

const KEY = 'tabinote.packingTemplate'

const listeners = new Set<() => void>()

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT_PACKING.slice()
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return DEFAULT_PACKING.slice()
    return parsed.filter((v): v is string => typeof v === 'string')
  } catch {
    return DEFAULT_PACKING.slice()
  }
}

let template: string[] = read()

function emit() {
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getPackingTemplate(): string[] {
  return template
}

/** 持ち物テンプレート（新しい旅を作るときの初期リスト） */
export function usePackingTemplate(): string[] {
  return useSyncExternalStore(subscribe, getPackingTemplate, getPackingTemplate)
}

export function setPackingTemplate(items: string[]): void {
  const cleaned = items.map((s) => s.trim()).filter(Boolean)
  template = cleaned
  try {
    localStorage.setItem(KEY, JSON.stringify(cleaned))
  } catch {
    /* 保存できなくても、その場の編集内容は反映する */
  }
  emit()
}

export function resetPackingTemplate(): void {
  setPackingTemplate(DEFAULT_PACKING.slice())
}

export function isFactoryPackingTemplate(): boolean {
  return (
    template.length === DEFAULT_PACKING.length &&
    template.every((v, i) => v === DEFAULT_PACKING[i])
  )
}
