import { useMemo, useState } from 'react'
import { Sheet } from './Sheet'
import { Icon } from './Icon'
import { CoverPicker } from './PhotoUploader'
import { ChecklistTemplateSheet } from './ChecklistTemplateSheet'
import { useTemplate, type TemplateKind } from '../state/settings'
import { THEMES, themeLabel } from '../lib/catalog'
import { addDays, nightsBetween, rangeLabel } from '../lib/date'
import { OffsetPicker } from './OffsetPicker'
import {
  createTrip,
  newTripDefaults,
  setCoverPhoto,
  updateTripMeta,
  type NewTripInput,
} from '../state/store'
import type { ThemeId, Trip } from '../types'
import { toast } from './Toast'
import { useT } from '../i18n'

interface TemplateToggleProps {
  label: string
  items: string[]
  checked: boolean
  onChange: (value: boolean) => void
  onEdit: () => void
  editLabel: string
  emptyLabel: string
  previewLabel: (items: string, n: number) => string
}

function TemplateToggle({
  label,
  items,
  checked,
  onChange,
  onEdit,
  editLabel,
  emptyLabel,
  previewLabel,
}: TemplateToggleProps) {
  const preview =
    items.length === 0
      ? emptyLabel
      : items.length <= 2
        ? items.join(' · ')
        : previewLabel(items.slice(0, 2).join(' · '), items.length - 2)

  return (
    <div
      style={{
        padding: '12px 14px',
        borderRadius: 14,
        background: '#fffdfa',
        border: '1.5px solid var(--line)',
      }}
    >
      <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
        <label className="row" style={{ gap: 10, cursor: 'pointer', flex: 1, minWidth: 0 }}>
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            style={{ width: 18, height: 18, accentColor: 'var(--coral)', flex: 'none' }}
          />
          <span style={{ fontSize: 14, fontWeight: 700 }}>
            {label}
            <small style={{ display: 'block', fontWeight: 500, color: 'var(--ink-4)', fontSize: 12 }}>
              {preview}
            </small>
          </span>
        </label>
        <button
          type="button"
          className="iconbtn iconbtn--plain"
          style={{ width: 34, height: 34 }}
          onClick={onEdit}
          aria-label={editLabel}
        >
          <Icon name="pencil" size={16} />
        </button>
      </div>
    </div>
  )
}

interface TripFormSheetProps {
  trip?: Trip
  onClose: () => void
  onCreated?: (id: string) => void
}

export function TripFormSheet({ trip, onClose, onCreated }: TripFormSheetProps) {
  const t = useT()
  const isEdit = Boolean(trip)
  const defaults: NewTripInput = useMemo(() => newTripDefaults(), [])

  const [title, setTitle] = useState(trip?.title ?? '')
  const [destination, setDestination] = useState(trip?.destination ?? '')
  const [startDate, setStartDate] = useState(trip?.startDate ?? defaults.startDate)
  const [endDate, setEndDate] = useState(trip?.endDate ?? defaults.endDate)
  const [themeId, setThemeId] = useState<ThemeId>(trip?.theme ?? 'sunset')
  const [timeDiff, setTimeDiff] = useState<number>(trip?.timeDiff ?? 0)
  const [members, setMembers] = useState((trip?.members ?? []).join(', '))
  const [memo, setMemo] = useState(trip?.memo ?? '')
  const [coverId, setCoverId] = useState<string | null>(trip?.coverPhotoId ?? null)
  const [withPacking, setWithPacking] = useState(true)
  const [withTodos, setWithTodos] = useState(true)
  const [templateOpen, setTemplateOpen] = useState<TemplateKind | null>(null)
  const packingTemplate = useTemplate('packing')
  const todoTemplate = useTemplate('todo')

  const dayCount = nightsBetween(startDate, endDate)
  const losing = trip ? trip.days.slice(dayCount).filter((d) => d.activities.length > 0).length : 0

  function handleStart(value: string) {
    setStartDate(value)
    if (value && endDate && value > endDate) setEndDate(addDays(value, dayCount - 1))
  }

  function submit() {
    if (!startDate || !endDate) {
      toast(t('trip.needDates'), 'error')
      return
    }
    const memberList = members
      // 区切りはカンマ類のみ。空白で切ると「Jean Dupont」のような名前が割れてしまう
      .split(/[、,，]+/)
      .map((m) => m.trim())
      .filter(Boolean)

    if (trip) {
      updateTripMeta(trip.id, {
        title,
        destination,
        startDate,
        endDate,
        theme: themeId,
        timeDiff,
        members: memberList,
        memo,
      })
      if (coverId !== trip.coverPhotoId) setCoverPhoto(trip.id, coverId)
      toast(t('trip.updated'))
    } else {
      const id = createTrip({
        title,
        destination,
        startDate,
        endDate,
        theme: themeId,
        timeDiff,
        members: memberList,
        withTodoTemplate: withTodos,
        withPackingTemplate: withPacking,
      })
      if (coverId) setCoverPhoto(id, coverId)
      toast(t('trip.created'))
      onCreated?.(id)
    }
    onClose()
  }

  return (
    <>
      <Sheet
        title={isEdit ? t('trip.edit') : t('trip.new')}
        onClose={onClose}
        footer={
          <>
            <button className="btn btn--soft" onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button className="btn btn--primary" onClick={submit}>
              <Icon name={isEdit ? 'check' : 'sparkle'} size={17} strokeWidth={2.2} />
              {isEdit ? t('common.save') : t('trip.start')}
            </button>
          </>
        }
      >
        <div className="field">
          <label className="field__label" htmlFor="trip-title">
            <Icon name="compass" size={14} /> {t('trip.field.title')}
          </label>
          <input
            id="trip-title"
            className="input"
            value={title}
            placeholder={t('trip.field.titlePh')}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus={!isEdit}
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor="trip-dest">
            <Icon name="pin" size={14} /> {t('trip.field.destination')}
          </label>
          <input
            id="trip-dest"
            className="input"
            value={destination}
            placeholder={t('trip.field.destinationPh')}
            onChange={(e) => setDestination(e.target.value)}
          />
        </div>

        <div className="field">
          <span className="field__label">
            <Icon name="calendar" size={14} /> {t('trip.field.dates')}
          </span>
          <div className="field-row">
            <input
              className="input num"
              type="date"
              value={startDate}
              onChange={(e) => handleStart(e.target.value)}
              aria-label={t('trip.field.startDate')}
            />
            <input
              className="input num"
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              aria-label={t('trip.field.endDate')}
            />
          </div>
          <p className="tiny muted" style={{ marginTop: 6 }}>
            {t('trip.dateSummary', {
              range: rangeLabel(startDate, endDate, t('trip.noDates')),
              n: dayCount,
            })}
            {dayCount > 1 ? t('trip.nights', { n: dayCount - 1 }) : ''}
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
              {t('trip.shrinkWarn', { n: losing })}
            </p>
          ) : null}
        </div>

        <div className="field">
          <label className="field__label" htmlFor="trip-tz">
            <Icon name="clock" size={14} /> {t('tz.tripField')}
          </label>
          <OffsetPicker id="trip-tz" value={timeDiff} onChange={(v) => setTimeDiff(v ?? 0)} />
          <p className="tiny muted" style={{ marginTop: 6 }}>
            {t('tz.tripHint')}
          </p>
        </div>

        <div className="field">
          <span className="field__label">
            <Icon name="sparkle" size={14} /> {t('trip.field.theme')}
          </span>
          <div className="themepick">
            {THEMES.map((th) => (
              <button
                key={th.id}
                type="button"
                className={th.id === themeId ? 'themepick__item is-active' : 'themepick__item'}
                style={{ background: th.gradient }}
                onClick={() => setThemeId(th.id)}
                aria-label={themeLabel(th.id)}
                title={themeLabel(th.id)}
              />
            ))}
          </div>
        </div>

        <div className="field">
          <span className="field__label">
            <Icon name="image" size={14} /> {t('trip.field.cover')}
          </span>
          <CoverPicker photoId={coverId} onChange={setCoverId} />
        </div>

        <div className="field">
          <label className="field__label" htmlFor="trip-members">
            <Icon name="users" size={14} /> {t('trip.field.members')}
          </label>
          <input
            id="trip-members"
            className="input"
            value={members}
            placeholder={t('trip.field.membersPh')}
            onChange={(e) => setMembers(e.target.value)}
          />
        </div>

        {isEdit ? (
          <div className="field">
            <label className="field__label" htmlFor="trip-memo">
              <Icon name="book" size={14} /> {t('trip.field.memo')}
            </label>
            <textarea
              id="trip-memo"
              className="textarea"
              value={memo}
              placeholder={t('trip.field.memoPh')}
              onChange={(e) => setMemo(e.target.value)}
            />
          </div>
        ) : (
          <div className="stack" style={{ gap: 10, marginBottom: 8 }}>
            <TemplateToggle
              label={t('tpl.withTodos')}
              items={todoTemplate}
              checked={withTodos}
              onChange={setWithTodos}
              onEdit={() => setTemplateOpen('todo')}
              editLabel={t('list.editTemplate')}
              emptyLabel={t('tpl.empty')}
              previewLabel={(items, n) => t('tpl.preview', { items, n })}
            />
            <TemplateToggle
              label={t('tpl.withPacking')}
              items={packingTemplate}
              checked={withPacking}
              onChange={setWithPacking}
              onEdit={() => setTemplateOpen('packing')}
              editLabel={t('list.editTemplate')}
              emptyLabel={t('tpl.empty')}
              previewLabel={(items, n) => t('tpl.preview', { items, n })}
            />
          </div>
        )}
      </Sheet>
      {templateOpen ? (
        <ChecklistTemplateSheet kind={templateOpen} onClose={() => setTemplateOpen(null)} />
      ) : null}
    </>
  )
}
