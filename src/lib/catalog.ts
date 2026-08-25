import type { CategoryId, ThemeId } from '../types'
import type { IconName } from '../components/Icon'

export interface CategoryDef {
  id: CategoryId
  label: string
  icon: IconName
  /** バッジの文字色 */
  color: string
  /** バッジの背景色 */
  tint: string
}

export const CATEGORIES: CategoryDef[] = [
  { id: 'sight', label: '観光', icon: 'camera', color: '#0f9488', tint: '#dcf5f1' },
  { id: 'food', label: '食事', icon: 'fork', color: '#e2582c', tint: '#ffe8de' },
  { id: 'move', label: '移動', icon: 'plane', color: '#3b63e0', tint: '#e2e9ff' },
  { id: 'stay', label: '宿泊', icon: 'bed', color: '#7b52d3', tint: '#eee6ff' },
  { id: 'shop', label: '買い物', icon: 'bag', color: '#d63c86', tint: '#ffe3f1' },
  { id: 'rest', label: '休憩', icon: 'cup', color: '#b8801a', tint: '#fdefd2' },
  { id: 'other', label: 'その他', icon: 'star', color: '#5b6577', tint: '#e9edf3' },
]

const CATEGORY_MAP = new Map(CATEGORIES.map((c) => [c.id, c]))

export function category(id: CategoryId): CategoryDef {
  return CATEGORY_MAP.get(id) ?? CATEGORIES[CATEGORIES.length - 1]
}

export interface ThemeDef {
  id: ThemeId
  label: string
  /** カバーのグラデーション */
  gradient: string
  /** 単色（PDF の帯などに使う） */
  solid: string
}

export const THEMES: ThemeDef[] = [
  {
    id: 'sunset',
    label: 'サンセット',
    gradient: 'linear-gradient(135deg, #ff8a3d 0%, #ff5f6d 55%, #b5307a 100%)',
    solid: '#ff5f6d',
  },
  {
    id: 'ocean',
    label: 'オーシャン',
    gradient: 'linear-gradient(135deg, #3ec7e0 0%, #2a7fd4 55%, #2b3fa4 100%)',
    solid: '#2a7fd4',
  },
  {
    id: 'forest',
    label: 'フォレスト',
    gradient: 'linear-gradient(135deg, #7ed08a 0%, #17a58c 55%, #0d6152 100%)',
    solid: '#17a58c',
  },
  {
    id: 'sakura',
    label: 'サクラ',
    gradient: 'linear-gradient(135deg, #ffc3d8 0%, #ff87ae 55%, #d4568c 100%)',
    solid: '#ff87ae',
  },
  {
    id: 'night',
    label: 'ナイト',
    gradient: 'linear-gradient(135deg, #4b5fa8 0%, #2b2f66 55%, #14173a 100%)',
    solid: '#2b2f66',
  },
  {
    id: 'citrus',
    label: 'シトラス',
    gradient: 'linear-gradient(135deg, #ffe14d 0%, #ffa62b 55%, #f2643c 100%)',
    solid: '#ffa62b',
  },
]

const THEME_MAP = new Map(THEMES.map((t) => [t.id, t]))

export function theme(id: ThemeId): ThemeDef {
  return THEME_MAP.get(id) ?? THEMES[0]
}

/** 新しい旅を作るときの「やること」テンプレート */
export const DEFAULT_TODOS = [
  '交通手段を予約する',
  '宿を予約する',
  '行きたいお店を調べて予約する',
  '現地の天気と服装を確認する',
  '現金・カードの準備をする',
  '身分証・チケットの期限を確認する',
  '家の戸締まりと郵便の手配',
]

/** 新しい旅を作るときのテンプレート持ち物リスト */
export const DEFAULT_PACKING = [
  '航空券 / 乗車券',
  'パスポート・身分証',
  '財布・現金',
  'スマホ充電器',
  'モバイルバッテリー',
  '着替え',
  '洗面用具',
  '常備薬',
]
