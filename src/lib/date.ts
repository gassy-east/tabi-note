const WEEK = ['日', '月', '火', '水', '木', '金', '土']

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
  return d ? WEEK[d.getDay()] : ''
}

export function isWeekendIso(iso: string): boolean {
  const d = parseIso(iso)
  if (!d) return false
  return d.getDay() === 0 || d.getDay() === 6
}

/** 「3月14日(金)」 */
export function formatJp(iso: string): string {
  const d = parseIso(iso)
  if (!d) return ''
  return `${d.getMonth() + 1}月${d.getDate()}日(${WEEK[d.getDay()]})`
}

/** 「2026.03.14」 */
export function formatDot(iso: string): string {
  const d = parseIso(iso)
  if (!d) return ''
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}.${m}.${day}`
}

/** 出発までの残り日数。過去なら負の数、当日は 0 */
export function daysUntil(iso: string): number | null {
  const d = parseIso(iso)
  if (!d) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - today.getTime()) / 86_400_000)
}

export function rangeLabel(start: string, end: string): string {
  if (!start) return '日程未定'
  if (!end || start === end) return formatJp(start)
  const a = parseIso(start)
  const b = parseIso(end)
  if (!a || !b) return formatJp(start)
  const sameYear = a.getFullYear() === b.getFullYear()
  const left = `${a.getFullYear()}年${a.getMonth() + 1}月${a.getDate()}日`
  const right = sameYear
    ? `${b.getMonth() + 1}月${b.getDate()}日`
    : `${b.getFullYear()}年${b.getMonth() + 1}月${b.getDate()}日`
  return `${left} 〜 ${right}`
}
