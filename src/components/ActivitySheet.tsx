import { useState } from 'react'
import { Sheet, Confirm } from './Sheet'
import { Icon } from './Icon'
import { PhotoUploader } from './PhotoUploader'
import { toast } from './Toast'
import { CATEGORIES, category, categoryLabel } from '../lib/catalog'
import { mapSearchUrl } from '../lib/maps'
import { formatDate, formatOffset, offsetChoices, shiftTime } from '../lib/date'
import { addActivity, moveActivityToDay, removeActivity, updateActivity } from '../state/store'
import { useT } from '../i18n'
import type { Activity, CategoryId, Day } from '../types'

interface ActivitySheetProps {
  tripId: string
  dayId: string
  days: Day[]
  activity: Activity
  isNew: boolean
  /** 旅全体の時差。予定側で上書きできる */
  tripTimeDiff: number
  onClose: () => void
}

export function ActivitySheet({
  tripId,
  dayId,
  days,
  activity,
  isNew,
  tripTimeDiff,
  onClose,
}: ActivitySheetProps) {
  const t = useT()
  const [draft, setDraft] = useState<Activity>(activity)
  const [targetDay, setTargetDay] = useState(dayId)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const cat = category(draft.category)
  const effectiveDiff = draft.timeDiff ?? tripTimeDiff
  const home = draft.time && effectiveDiff ? shiftTime(draft.time, -effectiveDiff) : null

  function patch(next: Partial<Activity>) {
    setDraft((d) => ({ ...d, ...next }))
  }

  function save() {
    const cleaned: Activity = { ...draft, title: draft.title.trim() }
    if (isNew) {
      addActivity(tripId, dayId, cleaned)
      toast(t('act.added'))
    } else {
      updateActivity(tripId, dayId, cleaned)
      if (targetDay !== dayId) {
        moveActivityToDay(tripId, dayId, targetDay, cleaned.id)
        toast(t('act.moved'))
      } else {
        toast(t('act.updated'))
      }
    }
    onClose()
  }

  return (
    <>
      <Sheet
        title={isNew ? t('act.add') : t('act.edit')}
        onClose={onClose}
        headerRight={
          isNew ? undefined : (
            <button
              className="iconbtn iconbtn--plain iconbtn--danger"
              onClick={() => setConfirmDelete(true)}
              aria-label={t('act.delete.title')}
            >
              <Icon name="trash" size={18} />
            </button>
          )
        }
        footer={
          <>
            <button className="btn btn--soft" onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button className="btn btn--primary" onClick={save}>
              <Icon name="check" size={17} strokeWidth={2.4} />
              {isNew ? t('common.add') : t('common.save')}
            </button>
          </>
        }
      >
        <div className="field">
          <span className="field__label">
            <Icon name="sparkle" size={14} /> {t('act.field.category')}
          </span>
          <div className="catpick">
            {CATEGORIES.map((c) => {
              const on = c.id === draft.category
              return (
                <button
                  key={c.id}
                  type="button"
                  className="catpick__item"
                  style={on ? { background: c.tint, borderColor: c.color, color: c.color } : undefined}
                  onClick={() => patch({ category: c.id as CategoryId })}
                >
                  <Icon name={c.icon} size={15} strokeWidth={2} />
                  {categoryLabel(c.id)}
                </button>
              )
            })}
          </div>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="act-title">
            <Icon name={cat.icon} size={14} /> {t('act.field.title')}
          </label>
          <input
            id="act-title"
            className="input"
            value={draft.title}
            placeholder={t('act.field.titlePh')}
            onChange={(e) => patch({ title: e.target.value })}
            autoFocus
          />
        </div>

        <div className="field">
          <span className="field__label">
            <Icon name="clock" size={14} /> {t('act.field.time')}
          </span>
          <div className="field-row">
            <input
              className="input num"
              type="time"
              value={draft.time}
              onChange={(e) => patch({ time: e.target.value })}
              aria-label={t('act.field.timeStart')}
            />
            <input
              className="input num"
              type="time"
              value={draft.endTime}
              onChange={(e) => patch({ endTime: e.target.value })}
              aria-label={t('act.field.timeEnd')}
            />
          </div>

          <label className="field__label" style={{ marginTop: 12 }} htmlFor="act-tz">
            <Icon name="plane" size={14} /> {t('tz.label')}
          </label>
          <select
            id="act-tz"
            className="select num"
            value={draft.timeDiff == null ? 'trip' : String(draft.timeDiff)}
            onChange={(e) =>
              patch({ timeDiff: e.target.value === 'trip' ? null : Number(e.target.value) })
            }
          >
            <option value="trip">
              {t('tz.followTrip', {
                v: tripTimeDiff === 0 ? t('tz.none') : formatOffset(tripTimeDiff),
              })}
            </option>
            {offsetChoices().map((v) => (
              <option key={v} value={v}>
                {v === 0 ? t('tz.none') : formatOffset(v)}
              </option>
            ))}
          </select>
          <p className="tiny muted" style={{ marginTop: 6 }}>
            {effectiveDiff ? t('tz.hint') : t('tz.tripHint')}
          </p>
          {home ? (
            <p
              className="tiny"
              style={{
                marginTop: 6,
                color: 'var(--indigo)',
                background: 'var(--indigo-soft)',
                padding: '8px 11px',
                borderRadius: 10,
                fontWeight: 700,
              }}
            >
              {t('tz.example', {
                local: draft.time,
                home:
                  home.dayShift === 0
                    ? home.time
                    : `${home.time}（${home.dayShift < 0 ? t('tz.prevDay') : t('tz.nextDay')}）`,
              })}
            </p>
          ) : null}
        </div>

        <div className="field">
          <label className="field__label" htmlFor="act-place">
            <Icon name="pin" size={14} /> {t('act.field.place')}
          </label>
          <input
            id="act-place"
            className="input"
            value={draft.place}
            placeholder={t('act.field.placePh')}
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
              {t('act.openMap')}
            </a>
          ) : null}
        </div>

        <div className="field">
          <label className="field__label" htmlFor="act-memo">
            <Icon name="book" size={14} /> {t('act.field.memo')}
          </label>
          <textarea
            id="act-memo"
            className="textarea"
            value={draft.memo}
            placeholder={t('act.field.memoPh')}
            onChange={(e) => patch({ memo: e.target.value })}
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label className="field__label" htmlFor="act-cost">
              <Icon name="coin" size={14} /> {t('act.field.cost')}
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
              <Icon name="link" size={14} /> {t('act.field.url')}
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
            <Icon name="image" size={14} /> {t('album.photo')}
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
              <Icon name="calendar" size={14} /> {t('act.field.moveDay')}
            </label>
            <select
              id="act-day"
              className="select"
              value={targetDay}
              onChange={(e) => setTargetDay(e.target.value)}
            >
              {days.map((d, i) => (
                <option key={d.id} value={d.id}>
                  {t('day.label')} {i + 1}　{formatDate(d.date)}
                  {d.title ? `　${d.title}` : ''}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </Sheet>

      {confirmDelete ? (
        <Confirm
          title={t('act.delete.title')}
          message={t('act.delete.body', { title: draft.title || t('act.untitled') })}
          confirmLabel={t('detail.delete.confirm')}
          danger
          onClose={() => setConfirmDelete(false)}
          onConfirm={() => {
            removeActivity(tripId, dayId, draft.id)
            toast(t('act.deleted'))
            onClose()
          }}
        />
      ) : null}
    </>
  )
}
