import { useSyncExternalStore } from 'react'
import { defaultPacking, defaultTodos } from '../lib/catalog'
import { useLang } from '../i18n'

export type TemplateKind = 'packing' | 'todo'

const STORAGE_KEY: Record<TemplateKind, string> = {
  packing: 'tabinote.packingTemplate',
  todo: 'tabinote.todoTemplate',
}

const listeners = new Set<() => void>()

/** 保存されていなければ、いまの表示言語の初期値を使う */
export function factoryTemplate(kind: TemplateKind): string[] {
  return kind === 'packing' ? defaultPacking() : defaultTodos()
}

function read(kind: TemplateKind): string[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY[kind])
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    return parsed.filter((v): v is string => typeof v === 'string')
  } catch {
    return null
  }
}

const stored: Record<TemplateKind, string[] | null> = {
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
  return stored[kind] ?? factoryTemplate(kind)
}

/** テンプレート（新しい旅を作るときの初期リスト）を購読する */
export function useTemplate(kind: TemplateKind): string[] {
  useLang()
  useSyncExternalStore(
    subscribe,
    () => stored[kind],
    () => stored[kind],
  )
  return getTemplate(kind)
}

export function setTemplate(kind: TemplateKind, items: string[]): void {
  const cleaned = items.map((s) => s.trim()).filter(Boolean)
  stored[kind] = cleaned
  try {
    localStorage.setItem(STORAGE_KEY[kind], JSON.stringify(cleaned))
  } catch {
    /* 保存できなくても、その場の編集内容は反映する */
  }
  emit()
}

export function resetTemplate(kind: TemplateKind): void {
  stored[kind] = null
  try {
    localStorage.removeItem(STORAGE_KEY[kind])
  } catch {
    /* 消せなくても既定値にもどす */
  }
  emit()
}

/** この端末でまだ編集されていないか */
export function isFactoryTemplate(kind: TemplateKind): boolean {
  return stored[kind] === null
}
