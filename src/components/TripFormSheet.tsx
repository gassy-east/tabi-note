import { useMemo, useState } from 'react'
import { Sheet } from './Sheet'
import { Icon } from './Icon'
import { CoverPicker } from './PhotoUploader'
import { THEMES } from '../lib/catalog'
import { addDays, nightsBetween, rangeLabel } from '../lib/date'
import {
  createTrip,
  newTripDefaults,
  setCoverPhoto,
  updateTripMeta,
  type NewTripInput,
} from '../state/store'
import type { ThemeId, Trip } from '../types'
import { toast } from './Toast'

interface TripFormSheetProps {
  trip?: Trip
  onClose: () => void
  onCreated?: (id: string) => void
}

export function TripFormSheet({ trip, onClose, onCreated }: TripFormSheetProps) {
  const isEdit = Boolean(trip)
  const defaults: NewTripInput = useMemo(() => newTripDefaults(), [])

  const [title, setTitle] = useState(trip?.title ?? '')
  const [destination, setDestination] = useState(trip?.destination ?? '')
  const [startDate, setStartDate] = useState(trip?.startDate ?? defaults.startDate)
  const [endDate, setEndDate] = useState(trip?.endDate ?? defaults.endDate)
  const [themeId, setThemeId] = useState<ThemeId>(trip?.theme ?? 'sunset')
  const [members, setMembers] = useState((trip?.members ?? []).join('、'))
  const [memo, setMemo] = useState(trip?.memo ?? '')
  const [coverId, setCoverId] = useState<string | null>(trip?.coverPhotoId ?? null)
  const [withPacking, setWithPacking] = useState(true)

  const dayCount = nightsBetween(startDate, endDate)
  const losing = trip ? trip.days.slice(dayCount).filter((d) => d.activities.length > 0).length : 0

  function handleStart(value: string) {
    setStartDate(value)
    if (value && endDate && value > endDate) setEndDate(addDays(value, dayCount - 1))
  }

  function submit() {
    if (!startDate || !endDate) {
      toast('日程を入れてください', 'error')
      return
    }
    const memberList = members
      .split(/[、,\s]+/)
      .map((m) => m.trim())
      .filter(Boolean)

    if (trip) {
      updateTripMeta(trip.id, {
        title,
        destination,
        startDate,
        endDate,
        theme: themeId,
        members: memberList,
        memo,
      })
      if (coverId !== trip.coverPhotoId) setCoverPhoto(trip.id, coverId)
      toast('旅の情報を更新しました')
    } else {
      const id = createTrip({
        title,
        destination,
        startDate,
        endDate,
        theme: themeId,
        members: memberList,
        withPackingTemplate: withPacking,
      })
      if (coverId) setCoverPhoto(id, coverId)
      toast('新しい旅をつくりました')
      onCreated?.(id)
    }
    onClose()
  }

  return (
    <Sheet
      title={isEdit ? '旅の情報を編集' : '新しい旅をつくる'}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn--soft" onClick={onClose}>
            キャンセル
          </button>
          <button className="btn btn--primary" onClick={submit}>
            <Icon name={isEdit ? 'check' : 'sparkle'} size={17} strokeWidth={2.2} />
            {isEdit ? '保存する' : 'はじめる'}
          </button>
        </>
      }
    >
      <div className="field">
        <label className="field__label" htmlFor="trip-title">
          <Icon name="compass" size={14} /> 旅のタイトル
        </label>
        <input
          id="trip-title"
          className="input"
          value={title}
          placeholder="はじめての京都旅"
          onChange={(e) => setTitle(e.target.value)}
          autoFocus={!isEdit}
        />
      </div>

      <div className="field">
        <label className="field__label" htmlFor="trip-dest">
          <Icon name="pin" size={14} /> 行き先
        </label>
        <input
          id="trip-dest"
          className="input"
          value={destination}
          placeholder="京都・大阪"
          onChange={(e) => setDestination(e.target.value)}
        />
      </div>

      <div className="field">
        <span className="field__label">
          <Icon name="calendar" size={14} /> 日程
        </span>
        <div className="field-row">
          <input
            className="input num"
            type="date"
            value={startDate}
            onChange={(e) => handleStart(e.target.value)}
            aria-label="出発日"
          />
          <input
            className="input num"
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
            aria-label="帰着日"
          />
        </div>
        <p className="tiny muted" style={{ marginTop: 6 }}>
          {rangeLabel(startDate, endDate)}・{dayCount}日間
          {dayCount > 1 ? `（${dayCount - 1}泊）` : ''}
        </p>
        {losing > 0 ? (
          <p
            className="tiny"
            style={{
              marginTop: 6,
              color: 'var(--danger)',
              background: 'var(--danger-soft)',
              padding: '8px 11px',
              borderRadius: 10,
            }}
          >
            日程を短くすると、{losing}日ぶんの予定が削除されます
          </p>
        ) : null}
      </div>

      <div className="field">
        <span className="field__label">
          <Icon name="sparkle" size={14} /> テーマカラー
        </span>
        <div className="themepick">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              className={t.id === themeId ? 'themepick__item is-active' : 'themepick__item'}
              style={{ background: t.gradient }}
              onClick={() => setThemeId(t.id)}
              aria-label={t.label}
              title={t.label}
            />
          ))}
        </div>
      </div>

      <div className="field">
        <span className="field__label">
          <Icon name="image" size={14} /> カバー写真
        </span>
        <CoverPicker photoId={coverId} onChange={setCoverId} />
      </div>

      <div className="field">
        <label className="field__label" htmlFor="trip-members">
          <Icon name="users" size={14} /> 同行者（カンマ区切り）
        </label>
        <input
          id="trip-members"
          className="input"
          value={members}
          placeholder="ゆい、たける"
          onChange={(e) => setMembers(e.target.value)}
        />
      </div>

      {isEdit ? (
        <div className="field">
          <label className="field__label" htmlFor="trip-memo">
            <Icon name="book" size={14} /> 旅全体のメモ
          </label>
          <textarea
            id="trip-memo"
            className="textarea"
            value={memo}
            placeholder="予約番号、集合場所、覚えておきたいことなど"
            onChange={(e) => setMemo(e.target.value)}
          />
        </div>
      ) : (
        <label
          className="row"
          style={{
            gap: 10,
            padding: '12px 14px',
            borderRadius: 14,
            background: '#fffdfa',
            border: '1.5px solid var(--line)',
            marginBottom: 8,
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={withPacking}
            onChange={(e) => setWithPacking(e.target.checked)}
            style={{ width: 18, height: 18, accentColor: 'var(--coral)' }}
          />
          <span style={{ fontSize: 14, fontWeight: 700 }}>
            持ち物リストのテンプレートを入れる
            <small style={{ display: 'block', fontWeight: 500, color: 'var(--ink-4)', fontSize: 12 }}>
              航空券・充電器・常備薬など 8 項目
            </small>
          </span>
        </label>
      )}
    </Sheet>
  )
}
