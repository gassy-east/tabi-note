import type { CategoryId, ThemeId } from '../types'
import { t, tList } from '../i18n'
import type { IconName } from '../components/Icon'

export interface CategoryDef {
  id: CategoryId
  icon: IconName
  /** バッジの文字色 */
  color: string
  /** バッジの背景色 */
  tint: string
}

export const CATEGORIES: CategoryDef[] = [
  { id: 'sight', icon: 'camera', color: '#0f9488', tint: '#dcf5f1' },
  { id: 'food', icon: 'fork', color: '#e2582c', tint: '#ffe8de' },
  { id: 'move', icon: 'plane', color: '#3b63e0', tint: '#e2e9ff' },
  { id: 'stay', icon: 'bed', color: '#7b52d3', tint: '#eee6ff' },
  { id: 'shop', icon: 'bag', color: '#d63c86', tint: '#ffe3f1' },
  { id: 'rest', icon: 'cup', color: '#b8801a', tint: '#fdefd2' },
  { id: 'other', icon: 'star', color: '#5b6577', tint: '#e9edf3' },
]

const CATEGORY_MAP = new Map(CATEGORIES.map((c) => [c.id, c]))

export function category(id: CategoryId): CategoryDef {
  return CATEGORY_MAP.get(id) ?? CATEGORIES[CATEGORIES.length - 1]
}

export function categoryLabel(id: CategoryId): string {
  switch (id) {
    case 'sight':
      return t('cat.sight')
    case 'food':
      return t('cat.food')
    case 'move':
      return t('cat.move')
    case 'stay':
      return t('cat.stay')
    case 'shop':
      return t('cat.shop')
    case 'rest':
      return t('cat.rest')
    default:
      return t('cat.other')
  }
}

export interface ThemeDef {
  id: ThemeId
  /** カバーのグラデーション */
  gradient: string
  /** 単色（PDF の帯などに使う） */
  solid: string
}

export const THEMES: ThemeDef[] = [
  {
    id: 'sunset',
    gradient: 'linear-gradient(135deg, #ff8a3d 0%, #ff5f6d 55%, #b5307a 100%)',
    solid: '#ff5f6d',
  },
  {
    id: 'ocean',
    gradient: 'linear-gradient(135deg, #3ec7e0 0%, #2a7fd4 55%, #2b3fa4 100%)',
    solid: '#2a7fd4',
  },
  {
    id: 'forest',
    gradient: 'linear-gradient(135deg, #7ed08a 0%, #17a58c 55%, #0d6152 100%)',
    solid: '#17a58c',
  },
  {
    id: 'sakura',
    gradient: 'linear-gradient(135deg, #ffc3d8 0%, #ff87ae 55%, #d4568c 100%)',
    solid: '#ff87ae',
  },
  {
    id: 'night',
    gradient: 'linear-gradient(135deg, #4b5fa8 0%, #2b2f66 55%, #14173a 100%)',
    solid: '#2b2f66',
  },
  {
    id: 'citrus',
    gradient: 'linear-gradient(135deg, #ffe14d 0%, #ffa62b 55%, #f2643c 100%)',
    solid: '#ffa62b',
  },
]

const THEME_MAP = new Map(THEMES.map((t) => [t.id, t]))

export function theme(id: ThemeId): ThemeDef {
  return THEME_MAP.get(id) ?? THEMES[0]
}

export function themeLabel(id: ThemeId): string {
  switch (id) {
    case 'ocean':
      return t('theme.ocean')
    case 'forest':
      return t('theme.forest')
    case 'sakura':
      return t('theme.sakura')
    case 'night':
      return t('theme.night')
    case 'citrus':
      return t('theme.citrus')
    default:
      return t('theme.sunset')
  }
}

/** 新しい旅を作るときの持ち物テンプレート（表示言語に合わせる） */
export function defaultPacking(): string[] {
  return tList('seed.packing')
}

/** 新しい旅を作るときの「やること」テンプレート（表示言語に合わせる） */
export function defaultTodos(): string[] {
  return tList('seed.todo')
}
