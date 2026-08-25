import { useSyncExternalStore } from 'react'
import { ja, type MessageKey, type Messages } from './ja'
import { en } from './en'
import { ko } from './ko'
import { fr } from './fr'
import { zh } from './zh'
import { es } from './es'
import { de } from './de'

export type Lang = 'ja' | 'en' | 'ko' | 'fr' | 'zh' | 'es' | 'de'
export type { MessageKey }

interface LangDef {
  id: Lang
  /** その言語での表記 */
  label: string
  /** 補足（日本語話者にも分かるように） */
  note: string
  /** Intl 用のロケール */
  locale: string
}

export const LANGS: LangDef[] = [
  { id: 'ja', label: '日本語', note: 'Japanese', locale: 'ja-JP' },
  { id: 'en', label: 'English', note: '英語', locale: 'en-US' },
  { id: 'ko', label: '한국어', note: '韓国語', locale: 'ko-KR' },
  { id: 'fr', label: 'Français', note: 'フランス語', locale: 'fr-FR' },
  { id: 'zh', label: '简体中文', note: '中国語（簡体）', locale: 'zh-CN' },
  { id: 'es', label: 'Español', note: 'スペイン語', locale: 'es-ES' },
  { id: 'de', label: 'Deutsch', note: 'ドイツ語', locale: 'de-DE' },
]

const DICTS: Record<Lang, Messages> = { ja, en, ko, fr, zh, es, de }

const KEY = 'tabinote.lang'

function detect(): Lang {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved && saved in DICTS) return saved as Lang
  } catch {
    /* localStorage が使えなくても既定値で動かす */
  }
  const candidates = navigator.languages?.length ? navigator.languages : [navigator.language]
  for (const raw of candidates) {
    const lower = (raw || '').toLowerCase()
    if (lower.startsWith('ja')) return 'ja'
    if (lower.startsWith('ko')) return 'ko'
    if (lower.startsWith('fr')) return 'fr'
    if (lower.startsWith('zh')) return 'zh'
    if (lower.startsWith('es')) return 'es'
    if (lower.startsWith('de')) return 'de'
    if (lower.startsWith('en')) return 'en'
  }
  return 'en'
}

let current: Lang = detect()
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getLang(): Lang {
  return current
}

export function getLocale(): string {
  return LANGS.find((l) => l.id === current)?.locale ?? 'en-US'
}

export function setLang(lang: Lang): void {
  if (!(lang in DICTS) || lang === current) return
  current = lang
  try {
    localStorage.setItem(KEY, lang)
  } catch {
    /* 保存できなくても、その場の表示は切り替える */
  }
  applyDocumentLang()
  listeners.forEach((l) => l())
}

export function applyDocumentLang(): void {
  document.documentElement.lang = current
  document.title = `${t('app.name')} — ${t('app.tagline')}`
}

export function useLang(): Lang {
  return useSyncExternalStore(subscribe, getLang, getLang)
}

type Vars = Record<string, string | number>

/**
 * 文言に "|" があれば単数形・複数形の指定とみなし、{n} に合う方を選ぶ。
 * 例: "{n} photo|{n} photos"（日本語・韓国語・中国語は 1 形のみ）
 */
function selectPlural(template: string, vars?: Vars): string {
  if (!template.includes('|')) return template
  const forms = template.split('|')
  const n = vars?.n
  if (typeof n !== 'number') return forms[forms.length - 1]
  try {
    const category = new Intl.PluralRules(getLocale()).select(n)
    return category === 'one' ? forms[0] : forms[forms.length - 1]
  } catch {
    return n === 1 ? forms[0] : forms[forms.length - 1]
  }
}

function fill(template: string, vars?: Vars): string {
  const chosen = selectPlural(template, vars)
  if (!vars) return chosen
  return chosen.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in vars ? String(vars[name]) : whole,
  )
}

/** 現在の言語で文言を取り出す */
export function t(key: MessageKey, vars?: Vars): string {
  const dict = DICTS[current]
  const value = dict[key] ?? ja[key] ?? key
  return fill(value, vars)
}

/** 言語が変わったら再描画されるフック版 */
export function useT(): typeof t {
  useLang()
  return t
}

/** 改行区切りのテンプレート初期値を配列で取り出す */
export function tList(key: MessageKey): string[] {
  return t(key)
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
}
