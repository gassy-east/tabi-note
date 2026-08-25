import { getLocale } from '../i18n'

export function todayIso(): string {
  return toIso(new Date())
}

export function toIso(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseIso(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return Number.isNaN(date.getTime()) ? null : date
}

export function addDays(iso: string, n: number): string {
  const d = parseIso(iso)
  if (!d) return iso
  d.setDate(d.getDate() + n)
  return toIso(d)
}

/** 開始日〜終了日の日数（両端含む）。不正なら 1 */
export function nightsBetween(start: string, end: string): number {
  const a = parseIso(start)
  const b = parseIso(end)
  if (!a || !b) return 1
  const diff = Math.round((b.getTime() - a.getTime()) / 86_400_000)
  return diff < 0 ? 1 : diff + 1
}

export function weekday(iso: string): string {
  const d = parseIso(iso)
  if (!d) return ''
  return new Intl.DateTimeFormat(getLocale(), { weekday: 'short' }).format(d)
}

export function isWeekendIso(iso: string): boolean {
  const d = parseIso(iso)
  if (!d) return false
  return d.getDay() === 0 || d.getDay() === 6
}

/** 「3月14日(金)」「Fri, Mar 14」など、その言語らしい日付 */
export function formatDate(iso: string): string {
  const d = parseIso(iso)
  if (!d) return ''
  return new Intl.DateTimeFormat(getLocale(), {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  }).format(d)
}

/** 「2026.03.14」— 言語によらず読める数字だけの表記 */
export function formatDot(iso: string): string {
  const d = parseIso(iso)
  if (!d) return ''
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}.${m}.${day}`
}

/** 日タブに出す短い日付「09/19(土)」 */
export function formatShort(iso: string): string {
  const d = parseIso(iso)
  if (!d) return ''
  const md = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
  const w = weekday(iso)
  return w ? `${md}(${w})` : md
}

/** 出発までの残り日数。過去なら負の数、当日は 0 */
export function daysUntil(iso: string): number | null {
  const d = parseIso(iso)
  if (!d) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - today.getTime()) / 86_400_000)
}

export function rangeLabel(start: string, end: string, fallback: string): string {
  if (!start) return fallback
  const a = parseIso(start)
  if (!a) return fallback
  const fmt = new Intl.DateTimeFormat(getLocale(), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const b = end ? parseIso(end) : null
  if (!b || start === end) return fmt.format(a)
  const range = fmt as unknown as { formatRange?: (x: Date, y: Date) => string }
  if (typeof range.formatRange === 'function') {
    try {
      return range.formatRange(a, b)
    } catch {
      /* formatRange が使えない環境では単純に連結する */
    }
  }
  return `${fmt.format(a)} – ${fmt.format(b)}`
}

// ---------- 時刻と時差 ----------

/** "HH:MM" を分に。読めなければ null */
export function timeToMinutes(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm)
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (h > 23 || min > 59) return null
  return h * 60 + min
}

export function minutesToTime(total: number): string {
  const wrapped = ((total % 1440) + 1440) % 1440
  const h = Math.floor(wrapped / 60)
  const m = wrapped % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export interface ShiftedTime {
  time: string
  /** -1 なら前日、+1 なら翌日 */
  dayShift: number
}

/** 時刻を hours 時間ずらす。日をまたいだ量も返す */
export function shiftTime(hhmm: string, hours: number): ShiftedTime | null {
  const base = timeToMinutes(hhmm)
  if (base == null) return null
  const total = base + Math.round(hours * 60)
  return { time: minutesToTime(total), dayShift: Math.floor(total / 1440) }
}

/** 時差の表示。0 なら空文字 */
export function formatOffset(hours: number): string {
  if (!hours) return '±0:00'
  const sign = hours > 0 ? '+' : '−'
  const abs = Math.abs(hours)
  const h = Math.floor(abs)
  const m = Math.round((abs - h) * 60)
  return `${sign}${h}:${String(m).padStart(2, '0')}`
}

/** 選べる時差の一覧（-12:00 〜 +14:00 を 15 分刻み） */
export function offsetChoices(): number[] {
  const out: number[] = []
  for (let v = -12; v <= 14; v += 0.25) out.push(Number(v.toFixed(2)))
  return out
}
