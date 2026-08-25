import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { Icon } from '../components/Icon'
import { Sheet, Confirm } from '../components/Sheet'
import { ActivitySheet } from '../components/ActivitySheet'
import { DaySheet } from '../components/DaySheet'
import { ExportSheet } from '../components/ExportSheet'
import { TripFormSheet } from '../components/TripFormSheet'
import { PackingCard, TodoCard } from '../components/ChecklistCards'
import { DiaryCard } from '../components/DiaryCard'
import { MemoryAlbum } from '../components/MemoryAlbum'
import { Lightbox } from '../components/Lightbox'
import { toast } from '../components/Toast'
import { usePhoto } from '../state/photos'
import {
  deleteTrip,
  duplicateTrip,
  emptyActivity,
  reorderActivities,
  sortActivitiesByTime,
  useTrip,
} from '../state/store'
import { category, categoryLabel, theme } from '../lib/catalog'
import {
  daysUntil,
  formatDate,
  formatOffset,
  formatShort,
  isWeekendIso,
  nightsBetween,
  rangeLabel,
  shiftTime,
  todayIso,
} from '../lib/date'
import { mapDirectionsUrl, mapSearchUrl } from '../lib/maps'
import { useScrolled } from '../lib/hooks'
import { clsx, yen } from '../lib/util'
import { goHome, navigate } from '../App'
import { t as tr, useT } from '../i18n'
import type { Activity, Day } from '../types'

/* ---------------------------------------------------------------- 写真 */

function Thumb({ id, onOpen, label }: { id: string; onOpen: () => void; label: string }) {
  const url = usePhoto(id)
  return (
    <button className="act__photo" onClick={onOpen} aria-label={label}>
      {url ? <img src={url} alt="" loading="lazy" /> : null}
    </button>
  )
}

/* ------------------------------------------------------------ 予定カード */

/** 現地時刻から自宅時刻の表示文字列を作る */
function homeTimeLabel(time: string, endTime: string, diff: number): string | null {
  if (!diff || !time) return null
  const start = shiftTime(time, -diff)
  if (!start) return null
  const suffix =
    start.dayShift < 0 ? ` ${tr('tz.prevDay')}` : start.dayShift > 0 ? ` ${tr('tz.nextDay')}` : ''
  const end = endTime ? shiftTime(endTime, -diff) : null
  return `${tr('tz.home')} ${start.time}${end ? ` 〜 ${end.time}` : ''}${suffix}`
}

interface ActivityRowProps {
  activity: Activity
  tripTimeDiff: number
  onEdit: () => void
  onPhotoOpen: (index: number) => void
}

function ActivityRow({ activity, tripTimeDiff, onEdit, onPhotoOpen }: ActivityRowProps) {
  const t = useT()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: activity.id,
  })
  const cat = category(activity.category)
  const diff = activity.timeDiff ?? tripTimeDiff
  const home = homeTimeLabel(activity.time, activity.endTime, diff)

  return (
    <div
      ref={setNodeRef}
      className="tl-item"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 30 : undefined,
        position: 'relative',
      }}
    >
      <span className="tl-item__dot" style={{ background: cat.tint, color: cat.color }}>
        <Icon name={cat.icon} size={16} strokeWidth={2} />
      </span>

      <div className={clsx('tl-item__time', !activity.time && 'is-empty')}>
        {activity.time ? (
          <>
            {activity.time}
            {activity.endTime ? ` 〜 ${activity.endTime}` : ''}
          </>
        ) : (
          t('act.noTime')
        )}
      </div>
      {home ? (
        <div className="tl-item__home">
          <i>{home}</i>
        </div>
      ) : null}

      <div className={clsx('act', isDragging && 'is-dragging')}>
        <span className="act__stripe" style={{ background: cat.color }} />
        <div className="act__main">
          <button
            className="act__texts"
            onClick={onEdit}
            style={{ textAlign: 'left', background: 'none' }}
          >
            <div className="act__tagrow">
              <span className="tag" style={{ background: cat.tint, color: cat.color }}>
                <Icon name={cat.icon} size={12} strokeWidth={2.2} />
                {categoryLabel(activity.category)}
              </span>
              {activity.timeDiff != null && activity.timeDiff !== tripTimeDiff ? (
                <span className="tag" style={{ background: 'var(--indigo-soft)', color: 'var(--indigo)' }}>
                  <Icon name="clock" size={12} strokeWidth={2.2} />
                  {formatOffset(activity.timeDiff)}
                </span>
              ) : null}
            </div>
            <div className={clsx('act__title', !activity.title && 'act__title--empty')}>
              {activity.title || t('act.tapToWrite')}
            </div>
            {activity.memo ? <div className="act__memo">{activity.memo}</div> : null}
          </button>

          <span className="act__handle" {...attributes} {...listeners} aria-label={t('act.dragAria')}>
            <Icon name="grip" size={16} />
          </span>
        </div>

        {activity.place || activity.cost != null || activity.url ? (
          <div className="act__footer" style={{ padding: '0 12px 12px 16px', marginTop: -2 }}>
            {activity.place ? (
              <a
                className="act__place"
                href={mapSearchUrl(activity.place)}
                target="_blank"
                rel="noreferrer"
              >
                <Icon name="pin" size={13} strokeWidth={2.2} />
                {activity.place}
              </a>
            ) : null}
            {activity.cost != null ? (
              <span className="act__chip num">
                <Icon name="coin" size={12} strokeWidth={2.2} />
                {yen(activity.cost)}
              </span>
            ) : null}
            {activity.url ? (
              <a
                className="act__chip act__chip--link"
                href={activity.url}
                target="_blank"
                rel="noreferrer"
              >
                <Icon name="link" size={12} strokeWidth={2.2} />
                {t('act.link')}
              </a>
            ) : null}
          </div>
        ) : null}

        {activity.photoIds.length > 0 ? (
          <div
            className={clsx('act__photos', activity.photoIds.length === 1 && 'act__photos--single')}
          >
            {activity.photoIds.map((id, i) => (
              <Thumb key={id} id={id} onOpen={() => onPhotoOpen(i)} label={t('album.viewAria')} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------ 本体 */

export function TripDetail({ tripId }: { tripId: string }) {
  const t = useT()
  const trip = useTrip(tripId)
  const scrolled = useScrolled()
  const cover = usePhoto(trip?.coverPhotoId ?? null)

  const [dayIndex, setDayIndex] = useState(0)
  const [editing, setEditing] = useState<{ activity: Activity; isNew: boolean } | null>(null)
  const [editDay, setEditDay] = useState(false)
  const [editTrip, setEditTrip] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [menu, setMenu] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [photoView, setPhotoView] = useState<{ ids: string[]; index: number } | null>(null)
  const dayBarRef = useRef<HTMLDivElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 160, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // 今日が旅程に含まれていれば、その日を最初に開く
  useEffect(() => {
    if (!trip) return
    const today = todayIso()
    const idx = trip.days.findIndex((d) => d.date === today)
    if (idx >= 0) setDayIndex(idx)
  }, [trip?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const safeIndex = trip ? Math.min(dayIndex, Math.max(0, trip.days.length - 1)) : 0
  const day: Day | undefined = trip?.days[safeIndex]

  const dayTotal = useMemo(
    () => (day ? day.activities.reduce((n, a) => n + (a.cost ?? 0), 0) : 0),
    [day],
  )

  if (!trip) {
    return (
      <main className="shell">
        <div className="empty" style={{ marginTop: 80 }}>
          <div className="empty__icon">
            <Icon name="compass" size={30} />
          </div>
          <h3>{t('app.notFound.title')}</h3>
          <p>{t('app.notFound.body')}</p>
          <button className="btn btn--primary" style={{ marginTop: 16 }} onClick={() => navigate('/')}>
            {t('app.notFound.home')}
          </button>
        </div>
      </main>
    )
  }

  const th = theme(trip.theme)
  const left = daysUntil(trip.startDate)
  const totalPlans = trip.days.reduce((n, d) => n + d.activities.length, 0)
  const tripTotal = trip.days.reduce(
    (n, d) => n + d.activities.reduce((m, a) => m + (a.cost ?? 0), 0),
    0,
  )

  function handleDragEnd(event: DragEndEvent) {
    setDragging(false)
    const { active, over } = event
    if (!over || active.id === over.id || !day || !trip) return
    const from = day.activities.findIndex((a) => a.id === active.id)
    const to = day.activities.findIndex((a) => a.id === over.id)
    if (from < 0 || to < 0) return
    reorderActivities(trip.id, day.id, from, to)
  }

  function selectDay(index: number) {
    setDayIndex(index)
    const bar = dayBarRef.current
    const target = bar?.children[index] as HTMLElement | undefined
    target?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }

  return (
    <>
      <header className={clsx('topbar', scrolled && 'is-scrolled')}>
        <button className="iconbtn" onClick={goHome} aria-label={t('common.back')}>
          <Icon name="left" size={19} strokeWidth={2.2} />
        </button>
        <span className="topbar__title">{trip.title}</span>
        <button className="iconbtn" onClick={() => setExporting(true)} aria-label={t('export.title')}>
          <Icon name="download" size={19} />
        </button>
        <button className="iconbtn" onClick={() => setMenu(true)} aria-label={t('common.menu')}>
          <Icon name="dots" size={19} />
        </button>
      </header>

      <main className="shell">
        <section className="cover">
          <div className="cover__bg" style={{ background: th.gradient }}>
            {cover ? <img src={cover} alt="" /> : null}
          </div>
          <div className="cover__veil" />
          <div className="cover__inner">
            {trip.destination ? (
              <span className="cover__dest">
                <Icon name="pin" size={13} strokeWidth={2.2} />
                {trip.destination}
              </span>
            ) : null}
            <h1 className="cover__title">{trip.title}</h1>
            <div className="cover__dates">
              {rangeLabel(trip.startDate, trip.endDate, t('trip.noDates'))}
            </div>
            <div className="cover__pills">
              <span className="cover__pill">
                <Icon name="calendar" size={13} strokeWidth={2.2} />
                {t('detail.pill.days', { n: nightsBetween(trip.startDate, trip.endDate) })}
              </span>
              <span className="cover__pill">
                <Icon name="route" size={13} strokeWidth={2.2} />
                {t('detail.pill.plans', { n: totalPlans })}
              </span>
              {trip.timeDiff !== 0 ? (
                <span className="cover__pill num">
                  <Icon name="clock" size={13} strokeWidth={2.2} />
                  {t('detail.pill.timeDiff', { v: formatOffset(trip.timeDiff) })}
                </span>
              ) : null}
              {tripTotal > 0 ? (
                <span className="cover__pill num">
                  <Icon name="coin" size={13} strokeWidth={2.2} />
                  {yen(tripTotal)}
                </span>
              ) : null}
              {left != null && left > 0 ? (
                <span className="cover__pill">
                  <Icon name="plane" size={13} strokeWidth={2.2} />
                  {t('detail.pill.left', { n: left })}
                </span>
              ) : null}
            </div>
            <div className="cover__actions">
              <button className="cover__btn" onClick={() => setExporting(true)}>
                <Icon name="download" size={15} strokeWidth={2.2} />
                {t('detail.exportCta')}
              </button>
              <button className="cover__btn cover__btn--outline" onClick={() => setEditTrip(true)}>
                <Icon name="pencil" size={15} strokeWidth={2.2} />
                {t('detail.infoCta')}
              </button>
            </div>
          </div>
        </section>

        <nav className="daybar">
          <div className="daybar__scroll" ref={dayBarRef}>
            {trip.days.map((d, i) => (
              <button
                key={d.id}
                className={clsx(
                  'daytab',
                  i === safeIndex && 'is-active',
                  isWeekendIso(d.date) && 'is-weekend',
                )}
                onClick={() => selectDay(i)}
              >
                <span>{t('day.label')}</span>
                <b>{i + 1}</b>
                <small>{formatShort(d.date)}</small>
              </button>
            ))}
          </div>
        </nav>

        {day ? (
          <>
            <div className="dayhead">
              <div className="dayhead__stamp" style={{ background: th.gradient }}>
                <div style={{ textAlign: 'center' }}>
                  <span>{t('day.label')}</span>
                  <b>{safeIndex + 1}</b>
                </div>
              </div>
              <div className="dayhead__main">
                <div className="dayhead__date">{formatDate(day.date)}</div>
                <div className={clsx('dayhead__title', !day.title && 'dayhead__title--empty')}>
                  {day.title || t('day.themePh')}
                </div>
                {day.memo ? <div className="dayhead__memo">{day.memo}</div> : null}
              </div>
              <button
                className="iconbtn"
                onClick={() => setEditDay(true)}
                aria-label={t('day.editAria')}
              >
                <Icon name="pencil" size={17} />
              </button>
            </div>

            <div className="daysum">
              <span className="stat-chip">
                {t('day.sum.plans')} <b>{day.activities.length}</b>
              </span>
              {dayTotal > 0 ? (
                <span className="stat-chip">
                  {t('day.sum.cost')} <b>{yen(dayTotal)}</b>
                </span>
              ) : null}
              {day.activities.length > 1 ? (
                <button
                  className="stat-chip"
                  onClick={() => {
                    sortActivitiesByTime(trip.id, day.id)
                    toast(t('day.sorted'))
                  }}
                >
                  <Icon name="sort" size={14} />
                  {t('day.sortByTime')}
                </button>
              ) : null}
            </div>

            {day.activities.length === 0 ? (
              <div className="empty">
                <div className="empty__icon" style={{ background: th.gradient }}>
                  <Icon name="sparkle" size={30} strokeWidth={1.8} />
                </div>
                <h3>{t('day.empty.title', { n: safeIndex + 1 })}</h3>
                <p style={{ whiteSpace: 'pre-line' }}>{t('day.empty.body')}</p>
                <button
                  className="btn btn--primary"
                  style={{ marginTop: 18 }}
                  onClick={() => setEditing({ activity: emptyActivity(), isNew: true })}
                >
                  <Icon name="plus" size={17} strokeWidth={2.4} />
                  {t('day.empty.cta')}
                </button>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                onDragStart={() => setDragging(true)}
                onDragCancel={() => setDragging(false)}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={day.activities.map((a) => a.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="timeline">
                    {day.activities.map((activity, i) => {
                      const next = day.activities[i + 1]
                      return (
                        // Fragment で包み、並べ替え対象を .timeline の直接の子に保つ
                        <Fragment key={activity.id}>
                          <ActivityRow
                            activity={activity}
                            tripTimeDiff={trip.timeDiff}
                            onEdit={() => setEditing({ activity, isNew: false })}
                            onPhotoOpen={(photoIndex) =>
                              setPhotoView({ ids: activity.photoIds, index: photoIndex })
                            }
                          />
                          {!dragging && next && activity.place && next.place ? (
                            <div className="tl-gap">
                              <a
                                className="tl-gap__inner"
                                href={mapDirectionsUrl(activity.place, next.place)}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <Icon name="route" size={13} strokeWidth={2.2} />
                                {t('act.routeCta')}
                              </a>
                            </div>
                          ) : null}
                        </Fragment>
                      )
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            {day.activities.length > 0 ? (
              <button
                className="btn btn--soft btn--block"
                style={{ marginTop: 6 }}
                onClick={() => setEditing({ activity: emptyActivity(), isNew: true })}
              >
                <Icon name="plus" size={17} strokeWidth={2.4} />
                {t('day.addPlan', { n: safeIndex + 1 })}
              </button>
            ) : null}
          </>
        ) : null}

        {day ? (
          <div style={{ marginTop: 24 }}>
            <DiaryCard trip={trip} day={day} index={safeIndex} />
          </div>
        ) : null}

        <h2 className="section-title" style={{ margin: '34px 0 12px' }}>
          <Icon name="suitcase" size={17} />
          {t('detail.sectionPrep')}
          <i className="section-title__line" />
        </h2>

        <TodoCard trip={trip} />

        <div style={{ marginTop: 16 }}>
          <PackingCard trip={trip} />
        </div>

        <div style={{ marginTop: 16 }}>
          <MemoryAlbum trip={trip} />
        </div>

        {trip.memo ? (
          <section className="card" style={{ marginTop: 16, padding: '16px 18px' }}>
            <h3 className="section-title" style={{ fontSize: 15, marginBottom: 8 }}>
              <Icon name="book" size={17} />
              {t('detail.tripMemo')}
            </h3>
            <p style={{ fontSize: 13.5, color: 'var(--ink-2)', whiteSpace: 'pre-wrap' }}>
              {trip.memo}
            </p>
          </section>
        ) : null}
      </main>

      {day ? (
        <button
          className="fab"
          onClick={() => setEditing({ activity: emptyActivity(), isNew: true })}
        >
          <Icon name="plus" size={20} strokeWidth={2.6} />
          {t('act.add')}
        </button>
      ) : null}

      {photoView ? (
        <Lightbox
          photoIds={photoView.ids}
          index={photoView.index}
          onIndexChange={(i) => setPhotoView({ ...photoView, index: i })}
          onClose={() => setPhotoView(null)}
        />
      ) : null}

      {editing && day ? (
        <ActivitySheet
          tripId={trip.id}
          dayId={day.id}
          days={trip.days}
          activity={editing.activity}
          isNew={editing.isNew}
          tripTimeDiff={trip.timeDiff}
          onClose={() => setEditing(null)}
        />
      ) : null}

      {editDay && day ? (
        <DaySheet tripId={trip.id} day={day} index={safeIndex} onClose={() => setEditDay(false)} />
      ) : null}

      {editTrip ? <TripFormSheet trip={trip} onClose={() => setEditTrip(false)} /> : null}

      {exporting ? (
        <ExportSheet trip={trip} dayIndex={safeIndex} onClose={() => setExporting(false)} />
      ) : null}

      {menu ? (
        <Sheet title={t('detail.menu.title')} onClose={() => setMenu(false)}>
          <div className="menu" style={{ padding: 0 }}>
            <button
              className="menu__item"
              onClick={() => {
                setMenu(false)
                setEditTrip(true)
              }}
            >
              <span className="menu__icon">
                <Icon name="pencil" size={18} />
              </span>
              <span>
                {t('detail.menu.edit')}
                <small>{t('detail.menu.editSub')}</small>
              </span>
            </button>
            <button
              className="menu__item"
              onClick={() => {
                setMenu(false)
                setExporting(true)
              }}
            >
              <span className="menu__icon">
                <Icon name="download" size={18} />
              </span>
              <span>
                {t('detail.menu.export')}
                <small>{t('detail.menu.exportSub')}</small>
              </span>
            </button>
            <button
              className="menu__item"
              onClick={() => {
                const id = duplicateTrip(trip.id)
                setMenu(false)
                if (id) {
                  toast(t('trip.duplicated'))
                  navigate(`/trip/${id}`)
                }
              }}
            >
              <span className="menu__icon">
                <Icon name="copy" size={18} />
              </span>
              <span>
                {t('detail.menu.duplicate')}
                <small>{t('detail.menu.duplicateSub')}</small>
              </span>
            </button>
            <button
              className="menu__item menu__item--danger"
              onClick={() => {
                setMenu(false)
                setConfirmDelete(true)
              }}
            >
              <span
                className="menu__icon"
                style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}
              >
                <Icon name="trash" size={18} />
              </span>
              <span>
                {t('detail.menu.delete')}
                <small>{t('detail.menu.deleteSub')}</small>
              </span>
            </button>
          </div>
        </Sheet>
      ) : null}

      {confirmDelete ? (
        <Confirm
          title={t('detail.delete.title')}
          message={t('detail.delete.body', { title: trip.title, n: totalPlans })}
          confirmLabel={t('detail.delete.confirm')}
          danger
          onClose={() => setConfirmDelete(false)}
          onConfirm={() => {
            deleteTrip(trip.id)
            toast(t('trip.deleted'))
            navigate('/')
          }}
        />
      ) : null}
    </>
  )
}
