import { useState } from 'react'
import { Sheet, Confirm } from './Sheet'
import { Icon } from './Icon'
import { PhotoUploader } from './PhotoUploader'
import { toast } from './Toast'
import { CATEGORIES, category, categoryLabel } from '../lib/catalog'
import { mapSearchUrl } from '../lib/maps'
import { formatDate, formatOffset, shiftTime } from '../lib/date'
import { OffsetPicker } from './OffsetPicker'
import { addActivity, moveActivityToDay, removeActivity, updateActivity } from '../state/store'
import { formatMoney, parseAmount, roundMoney } from '../lib/money'
import { participantLabel, participants, toHome } from '../lib/expense'
import { clsx } from '../lib/util'
import { useT } from '../i18n'
import type { Activity, CategoryId, Trip } from '../types'

interface ActivitySheetProps {
  trip: Trip
  dayId: string
  activity: Activity
  isNew: boolean
  onClose: () => void
}

export function ActivitySheet({ trip, dayId, activity, isNew, onClose }: ActivitySheetProps) {
  const t = useT()
  const tripId = trip.id
  const days = trip.days
  const tripTimeDiff = trip.timeDiff
  const [draft, setDraft] = useState<Activity>(activity)
  const [targetDay, setTargetDay] = useState(dayId)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const cat = category(draft.category)
  const effectiveDiff = draft.timeDiff ?? tripTimeDiff
  const home = draft.time && effectiveDiff ? shiftTime(draft.time, -effectiveDiff) : null

  // 費用まわり。現地と自宅で通貨が違うときだけ、どちらで払ったかを選ばせる
  const costCurrency = draft.costCurrency || trip.currency
  const twoCurrencies = trip.currency !== trip.homeCurrency
  const converted =
    draft.cost != null && costCurrency !== trip.homeCurrency
      ? toHome(trip, draft.cost, costCurrency)
      : null
  const people = participants(trip)

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
          <OffsetPicker
            id="act-tz"
            value={draft.timeDiff}
            onChange={(v) => patch({ timeDiff: v })}
            inherit={{
              label: t('tz.followTrip', {
                v: tripTimeDiff === 0 ? t('tz.none') : formatOffset(tripTimeDiff),
              }),
            }}
          />
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
              <Icon name="coin" size={14} /> {t('act.field.cost', { code: costCurrency })}
            </label>
            <input
              id="act-cost"
              className="input num"
              inputMode="decimal"
              value={draft.cost ?? ''}
              placeholder="1500"
              onChange={(e) => patch({ cost: parseAmount(e.target.value, costCurrency) })}
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

        {twoCurrencies ? (
          <div className="field">
            <span className="field__label">
              <Icon name="swap" size={14} /> {t('money.costIn')}
            </span>
            <div className="money__switch">
              <button
                type="button"
                className={clsx('money__tab', costCurrency === trip.currency && 'is-on')}
                onClick={() => patch({ costCurrency: trip.currency })}
              >
                {t('money.currencyLocal', { code: trip.currency })}
              </button>
              <button
                type="button"
                className={clsx('money__tab', costCurrency === trip.homeCurrency && 'is-on')}
                onClick={() => patch({ costCurrency: trip.homeCurrency })}
              >
                {t('money.currencyHome', { code: trip.homeCurrency })}
              </button>
            </div>
            {converted != null ? (
              <p className="tiny muted num" style={{ marginTop: 6 }}>
                ≈ {formatMoney(roundMoney(converted, trip.homeCurrency), trip.homeCurrency)}
              </p>
            ) : null}
          </div>
        ) : null}

        {trip.members.length > 0 ? (
          <div className="field">
            <label className="field__label" htmlFor="act-payer">
              <Icon name="users" size={14} /> {t('money.payer')}
            </label>
            <select
              id="act-payer"
              className="select"
              value={draft.payer}
              onChange={(e) => patch({ payer: e.target.value })}
            >
              <option value="">{t('money.payerNone')}</option>
              {people.map((key) => (
                <option key={key} value={key}>
                  {participantLabel(key)}
                </option>
              ))}
            </select>

            {draft.payer ? (
              <>
                <span className="field__label" style={{ marginTop: 12 }}>
                  <Icon name="check" size={14} /> {t('money.shareWith')}
                </span>
                <div className="catpick">
                  {people.map((key) => {
                    const on = draft.shareWith.includes(key)
                    return (
                      <button
                        key={key}
                        type="button"
                        className="catpick__item"
                        style={
                          on
                            ? {
                                background: 'var(--teal-soft)',
                                borderColor: 'var(--teal)',
                                color: 'var(--teal)',
                              }
                            : undefined
                        }
                        onClick={() =>
                          patch({
                            shareWith: on
                              ? draft.shareWith.filter((k) => k !== key)
                              : [...draft.shareWith, key],
                          })
                        }
                      >
                        {on ? <Icon name="check" size={14} strokeWidth={2.4} /> : null}
                        {participantLabel(key)}
                      </button>
                    )
                  })}
                </div>
                <p className="tiny muted" style={{ marginTop: 6 }}>
                  {t('money.shareAll')}
                </p>
              </>
            ) : null}
          </div>
        ) : null}

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
