import { useSyncExternalStore } from 'react'
import { DEFAULT_PACKING, DEFAULT_TODOS } from '../lib/catalog'

export type TemplateKind = 'packing' | 'todo'

const STORAGE_KEY: Record<TemplateKind, string> = {
  packing: 'tabinote.packingTemplate',
  todo: 'tabinote.todoTemplate',
}

const FACTORY: Record<TemplateKind, string[]> = {
  packing: DEFAULT_PACKING,
  todo: DEFAULT_TODOS,
}

const listeners = new Set<() => void>()

function read(kind: TemplateKind): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY[kind])
    if (!raw) return FACTORY[kind].slice()
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return FACTORY[kind].slice()
    return parsed.filter((v): v is string => typeof v === 'string')
  } catch {
    return FACTORY[kind].slice()
  }
}

const templates: Record<TemplateKind, string[]> = {
  packing: read('packing'),
  todo: read('todo'),
}

function emit() {
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getTemplate(kind: TemplateKind): string[] {
  return templates[kind]
}

/** テンプレート（新しい旅を作るときの初期リスト）を購読する */
export function useTemplate(kind: TemplateKind): string[] {
  return useSyncExternalStore(
    subscribe,
    () => templates[kind],
    () => templates[kind],
  )
}

export function setTemplate(kind: TemplateKind, items: string[]): void {
  const cleaned = items.map((s) => s.trim()).filter(Boolean)
  templates[kind] = cleaned
  try {
    localStorage.setItem(STORAGE_KEY[kind], JSON.stringify(cleaned))
  } catch {
    /* 保存できなくても、その場の編集内容は反映する */
  }
  emit()
}

export function factoryTemplate(kind: TemplateKind): string[] {
  return FACTORY[kind].slice()
}

export function resetTemplate(kind: TemplateKind): void {
  setTemplate(kind, factoryTemplate(kind))
}

/** この端末でまだ編集されていないか */
export function isFactoryTemplate(kind: TemplateKind): boolean {
  const current = templates[kind]
  const factory = FACTORY[kind]
  return current.length === factory.length && current.every((v, i) => v === factory[i])
}
