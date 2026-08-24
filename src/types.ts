export type CategoryId =
  | 'move'
  | 'food'
  | 'sight'
  | 'stay'
  | 'shop'
  | 'rest'
  | 'other'

export type ThemeId = 'sunset' | 'ocean' | 'forest' | 'sakura' | 'night' | 'citrus'

export interface Activity {
  id: string
  /** "09:30" 形式。空文字なら時刻未定 */
  time: string
  endTime: string
  title: string
  category: CategoryId
  /** 地図リンクに使う場所名・住所 */
  place: string
  memo: string
  /** 円。null なら未入力 */
  cost: number | null
  url: string
  photoIds: string[]
}

export interface Day {
  id: string
  /** yyyy-mm-dd。旅程の開始日からの自動計算値を保持する */
  date: string
  title: string
  memo: string
  activities: Activity[]
}

export interface PackItem {
  id: string
  label: string
  done: boolean
}

export interface Trip {
  id: string
  title: string
  destination: string
  startDate: string
  endDate: string
  coverPhotoId: string | null
  theme: ThemeId
  members: string[]
  memo: string
  days: Day[]
  packing: PackItem[]
  createdAt: number
  updatedAt: number
}

export interface PhotoRecord {
  id: string
  /** data:image/jpeg;base64,... 形式。書き出し時にそのまま使える */
  dataUrl: string
  width: number
  height: number
  createdAt: number
}
