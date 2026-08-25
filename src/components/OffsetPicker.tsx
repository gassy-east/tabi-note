import { formatOffset } from '../lib/date'
import { useT } from '../i18n'

/** 時差として選べる時間の幅。地球上のどの 2 地点の差もこの中に収まる */
const MIN_HOURS = -26
const MAX_HOURS = 26

export function splitOffset(value: number): { hours: number; minutes: number } {
  const hours = Math.trunc(value)
  const minutes = Math.round(Math.abs(value - hours) * 60)
  return { hours, minutes }
}

export function joinOffset(hours: number, minutes: number): number {
  const fraction = minutes / 60
  return hours < 0 ? hours - fraction : hours + fraction
}

interface OffsetPickerProps {
  /** null なら「旅の設定にしたがう」 */
  value: number | null
  onChange: (value: number | null) => void
  /** 予定側で使うとき。旅の時差を継承する選択肢を出す */
  inherit?: { label: string }
  id?: string
}

export function OffsetPicker({ value, onChange, inherit, id }: OffsetPickerProps) {
  const t = useT()
  const follows = inherit != null && value == null
  const { hours, minutes } = splitOffset(value ?? 0)

  const hourOptions: number[] = []
  for (let h = MAX_HOURS; h >= MIN_HOURS; h--) hourOptions.push(h)

  return (
    <div className="stack" style={{ gap: 8 }}>
      {inherit ? (
        <select
          id={id}
          className="select"
          value={follows ? 'inherit' : 'custom'}
          onChange={(e) => onChange(e.target.value === 'inherit' ? null : 0)}
        >
          <option value="inherit">{inherit.label}</option>
          <option value="custom">{t('tz.custom')}</option>
        </select>
      ) : null}

      {!follows ? (
        <div className="field-row">
          <label className="offset__unit">
            <select
              id={inherit ? undefined : id}
              className="select num"
              value={String(hours)}
              onChange={(e) => onChange(joinOffset(Number(e.target.value), minutes))}
              aria-label={t('tz.hours')}
            >
              {hourOptions.map((h) => (
                <option key={h} value={h}>
                  {h > 0 ? `+${h}` : h === 0 ? '±0' : `−${Math.abs(h)}`}
                </option>
              ))}
            </select>
            <span>{t('tz.hours')}</span>
          </label>
          <label className="offset__unit">
            <select
              className="select num"
              value={String(minutes)}
              onChange={(e) => onChange(joinOffset(hours, Number(e.target.value)))}
              aria-label={t('tz.minutes')}
            >
              {[0, 15, 30, 45].map((m) => (
                <option key={m} value={m}>
                  {String(m).padStart(2, '0')}
                </option>
              ))}
            </select>
            <span>{t('tz.minutes')}</span>
          </label>
        </div>
      ) : null}

      {!follows ? (
        <p className="tiny muted num" style={{ marginTop: -2 }}>
          {value ? formatOffset(value) : t('tz.none')}
        </p>
      ) : null}
    </div>
  )
}
