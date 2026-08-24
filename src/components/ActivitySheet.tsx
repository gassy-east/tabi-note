import { useState } from 'react'
import { Sheet, Confirm } from './Sheet'
import { Icon } from './Icon'
import { PhotoUploader } from './PhotoUploader'
import { toast } from './Toast'
import { CATEGORIES, category } from '../lib/catalog'
import { mapSearchUrl } from '../lib/maps'
import { formatJp } from '../lib/date'
import { addActivity, moveActivityToDay, removeActivity, updateActivity } from '../state/store'
import type { Activity, CategoryId, Day } from '../types'

interface ActivitySheetProps {
  tripId: string
  dayId: string
  days: Day[]
  activity: Activity
  isNew: boolean
  onClose: () => void
}

export function ActivitySheet({
  tripId,
  dayId,
  days,
  activity,
  isNew,
  onClose,
}: ActivitySheetProps) {
  const [draft, setDraft] = useState<Activity>(activity)
  const [targetDay, setTargetDay] = useState(dayId)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const cat = category(draft.category)

  function patch(next: Partial<Activity>) {
    setDraft((d) => ({ ...d, ...next }))
  }

  function save() {
    const cleaned: Activity = { ...draft, title: draft.title.trim() }
    if (isNew) {
      addActivity(tripId, dayId, cleaned)
      toast('予定を追加しました')
    } else {
      updateActivity(tripId, dayId, cleaned)
      if (targetDay !== dayId) {
        moveActivityToDay(tripId, dayId, targetDay, cleaned.id)
        toast('別の日へ移動しました')
      } else {
        toast('予定を更新しました')
      }
    }
    onClose()
  }

  return (
    <>
      <Sheet
        title={isNew ? '予定を追加' : '予定を編集'}
        onClose={onClose}
        headerRight={
          isNew ? undefined : (
            <button
              className="iconbtn iconbtn--plain iconbtn--danger"
              onClick={() => setConfirmDelete(true)}
              aria-label="この予定を削除"
            >
              <Icon name="trash" size={18} />
            </button>
          )
        }
        footer={
          <>
            <button className="btn btn--soft" onClick={onClose}>
              キャンセル
            </button>
            <button className="btn btn--primary" onClick={save}>
              <Icon name="check" size={17} strokeWidth={2.4} />
              {isNew ? '追加する' : '保存する'}
            </button>
          </>
        }
      >
        <div className="field">
          <span className="field__label">
            <Icon name="sparkle" size={14} /> 種別
          </span>
          <div className="catpick">
            {CATEGORIES.map((c) => {
              const on = c.id === draft.category
              return (
                <button
                  key={c.id}
                  type="button"
                  className="catpick__item"
                  style={
                    on
                      ? { background: c.tint, borderColor: c.color, color: c.color }
                      : undefined
                  }
                  onClick={() => patch({ category: c.id as CategoryId })}
                >
                  <Icon name={c.icon} size={15} strokeWidth={2} />
                  {c.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="act-title">
            <Icon name={cat.icon} size={14} /> やること・行き先
          </label>
          <input
            id="act-title"
            className="input"
            value={draft.title}
            placeholder="伏見稲荷大社で千本鳥居さんぽ"
            onChange={(e) => patch({ title: e.target.value })}
            autoFocus
          />
        </div>

        <div className="field">
          <span className="field__label">
            <Icon name="clock" size={14} /> 時刻（任意）
          </span>
          <div className="field-row">
            <input
              className="input num"
              type="time"
              value={draft.time}
              onChange={(e) => patch({ time: e.target.value })}
              aria-label="開始時刻"
            />
            <input
              className="input num"
              type="time"
              value={draft.endTime}
              onChange={(e) => patch({ endTime: e.target.value })}
              aria-label="終了時刻"
            />
          </div>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="act-place">
            <Icon name="pin" size={14} /> 場所（地図リンクになります）
          </label>
          <input
            id="act-place"
            className="input"
            value={draft.place}
            placeholder="京都市伏見区深草藪之内町68"
            onChange={(e) => patch({ place: e.target.value })}
          />
          {draft.place ? (
            <a
              className="btn btn--soft btn--sm"
              style={{ marginTop: 8 }}
              href={mapSearchUrl(draft.place)}
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="pin" size={15} />
              Google マップで開く
            </a>
          ) : null}
        </div>

        <div className="field">
          <label className="field__label" htmlFor="act-memo">
            <Icon name="book" size={14} /> メモ
          </label>
          <textarea
            id="act-memo"
            className="textarea"
            value={draft.memo}
            placeholder="予約番号、行き方、食べたいもの、持ち物など"
            onChange={(e) => patch({ memo: e.target.value })}
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label className="field__label" htmlFor="act-cost">
              <Icon name="coin" size={14} /> 費用（円）
            </label>
            <input
              id="act-cost"
              className="input num"
              inputMode="numeric"
              value={draft.cost ?? ''}
              placeholder="1500"
              onChange={(e) => {
                const v = e.target.value.replace(/[^\d]/g, '')
                patch({ cost: v === '' ? null : Number(v) })
              }}
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="act-url">
              <Icon name="link" size={14} /> リンク
            </label>
            <input
              id="act-url"
              className="input"
              type="url"
              inputMode="url"
              value={draft.url}
              placeholder="https://"
              onChange={(e) => patch({ url: e.target.value })}
            />
          </div>
        </div>

        <div className="field">
          <span className="field__label">
            <Icon name="image" size={14} /> 写真
          </span>
          <PhotoUploader
            photoIds={draft.photoIds}
            onChange={(ids) => patch({ photoIds: ids })}
            max={8}
          />
        </div>

        {!isNew && days.length > 1 ? (
          <div className="field">
            <label className="field__label" htmlFor="act-day">
              <Icon name="calendar" size={14} /> 予定を移す日
            </label>
            <select
              id="act-day"
              className="select"
              value={targetDay}
              onChange={(e) => setTargetDay(e.target.value)}
            >
              {days.map((d, i) => (
                <option key={d.id} value={d.id}>
                  DAY {i + 1}　{formatJp(d.date)}
                  {d.title ? `　${d.title}` : ''}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </Sheet>

      {confirmDelete ? (
        <Confirm
          title="この予定を削除しますか？"
          message={`「${draft.title || '無題の予定'}」と、添えた写真も一緒に削除されます。`}
          confirmLabel="削除する"
          danger
          onClose={() => setConfirmDelete(false)}
          onConfirm={() => {
            removeActivity(tripId, dayId, draft.id)
            toast('予定を削除しました')
            onClose()
          }}
        />
      ) : null}
    </>
  )
}
