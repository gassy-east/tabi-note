import { useEffect, useSyncExternalStore } from 'react'
import { Icon } from './Icon'
import { uid } from '../lib/util'

type ToastKind = 'success' | 'info' | 'error'

interface ToastItem {
  id: string
  message: string
  kind: ToastKind
}

let items: ToastItem[] = []
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

export function toast(message: string, kind: ToastKind = 'success'): void {
  const item: ToastItem = { id: uid('t_'), message, kind }
  items = [...items.slice(-2), item]
  emit()
  setTimeout(() => {
    items = items.filter((t) => t.id !== item.id)
    emit()
  }, 2800)
}

export function ToastHost() {
  const list = useSyncExternalStore(
    subscribe,
    () => items,
    () => items,
  )

  useEffect(() => () => void 0, [])

  if (list.length === 0) return null

  return (
    <div className="toasts" role="status" aria-live="polite">
      {list.map((t) => (
        <div key={t.id} className={`toast toast--${t.kind}`}>
          <Icon
            className="toast__ic"
            name={t.kind === 'error' ? 'close' : t.kind === 'info' ? 'sparkle' : 'check'}
            size={17}
            strokeWidth={2.4}
          />
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}
