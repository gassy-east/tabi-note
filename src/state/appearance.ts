import { useSyncExternalStore } from 'react'

/** 画面全体の見た目。auto は端末の設定（ライト / ダーク）にしたがう */
export type Skin = 'auto' | 'default' | 'dark' | 'modern' | 'pop' | 'natural'

export interface SkinDef {
  id: Skin
  /** 選択カードのプレビューに使う色 */
  swatch: { paper: string; card: string; ink: string; accent: string }
  /** ブラウザの UI（アドレスバーなど）の色 */
  themeColor: string
}

export const SKINS: SkinDef[] = [
  {
    id: 'auto',
    swatch: { paper: '#f7f3ec', card: '#16161a', ink: '#16181d', accent: '#ff6a3d' },
    themeColor: '#ff6a3d',
  },
  {
    id: 'default',
    swatch: { paper: '#f7f3ec', card: '#ffffff', ink: '#16181d', accent: '#ff6a3d' },
    themeColor: '#ff6a3d',
  },
  {
    id: 'dark',
    swatch: { paper: '#16161a', card: '#23232b', ink: '#f2ede4', accent: '#ff8355' },
    themeColor: '#16161a',
  },
  {
    id: 'modern',
    swatch: { paper: '#f4f5f7', card: '#ffffff', ink: '#0b0d12', accent: '#2563eb' },
    themeColor: '#2563eb',
  },
  {
    id: 'pop',
    swatch: { paper: '#fff6e9', card: '#ffffff', ink: '#1b1533', accent: '#ff2d87' },
    themeColor: '#ff2d87',
  },
  {
    id: 'natural',
    swatch: { paper: '#f2f4ee', card: '#ffffff', ink: '#1c2119', accent: '#5f8f5f' },
    themeColor: '#5f8f5f',
  },
]

const KEY = 'tabinote.skin'
const listeners = new Set<() => void>()

function read(): Skin {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved && SKINS.some((s) => s.id === saved)) return saved as Skin
  } catch {
    /* localStorage が使えなくても既定値で動かす */
  }
  return 'default'
}

let current: Skin = read()

const darkQuery =
  typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null

/** auto のときは端末の設定を見て、実際に当てるスキンを決める */
function resolve(skin: Skin): Exclude<Skin, 'auto'> {
  if (skin !== 'auto') return skin
  return darkQuery?.matches ? 'dark' : 'default'
}

export function applySkin(): void {
  const resolved = resolve(current)
  document.documentElement.dataset.skin = resolved
  const def = SKINS.find((s) => s.id === resolved)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta && def) meta.setAttribute('content', def.themeColor)
}

darkQuery?.addEventListener('change', () => {
  if (current === 'auto') {
    applySkin()
    listeners.forEach((l) => l())
  }
})

export function getSkin(): Skin {
  return current
}

export function setSkin(skin: Skin): void {
  current = skin
  try {
    localStorage.setItem(KEY, skin)
  } catch {
    /* 保存できなくても、その場の見た目は切り替える */
  }
  applySkin()
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useSkin(): Skin {
  return useSyncExternalStore(subscribe, getSkin, getSkin)
}

// 初回の描画前に当てて、色のちらつきを防ぐ
applySkin()
