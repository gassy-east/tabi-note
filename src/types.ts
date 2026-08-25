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
  /** 出発前に書く下調べメモ */
  memo: string
  /** 旅のあとに書く、その日の日記 */
  diary: string
  activities: Activity[]
}

export interface PackItem {
  id: string
  label: string
  done: boolean
}

/** 出発までに済ませておくこと */
export interface TodoItem {
  id: string
  label: string
  done: boolean
  /** yyyy-mm-dd。空なら期限なし */
  due: string
}

/** 旅先で撮った写真。行程とは別に「思い出アルバム」として持つ */
export interface Memory {
  id: string
  photoId: string
  caption: string
  /** 何日目の思い出か。空なら未指定 */
  dayId: string
  createdAt: number
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
  todos: TodoItem[]
  packing: PackItem[]
  memories: Memory[]
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
