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
import { category, theme } from '../lib/catalog'
import { daysUntil, formatJp, nightsBetween, rangeLabel, todayIso, weekday } from '../lib/date'
import { mapDirectionsUrl, mapSearchUrl } from '../lib/maps'
import { useScrolled } from '../lib/hooks'
import { clsx, yen } from '../lib/util'
import { goHome, navigate } from '../App'
import type { Activity, Day } from '../types'

/* ---------------------------------------------------------------- 写真 */

function Thumb({ id, onOpen }: { id: string; onOpen: () => void }) {
  const url = usePhoto(id)
  return (
    <button className="act__photo" onClick={onOpen} aria-label="写真を大きく見る">
      {url ? <img src={url} alt="" loading="lazy" /> : null}
    </button>
  )
}

/* ------------------------------------------------------------ 予定カード */

interface ActivityRowProps {
  activity: Activity
  onEdit: () => void
  onPhotoOpen: (index: number) => void
}

function ActivityRow({ activity, onEdit, onPhotoOpen }: ActivityRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: activity.id,
  })
  const cat = category(activity.category)

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
          '時刻未定'
        )}
      </div>

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
                {cat.label}
              </span>
            </div>
            <div className={clsx('act__title', !activity.title && 'act__title--empty')}>
              {activity.title || '（タップして予定を書く）'}
            </div>
            {activity.memo ? <div className="act__memo">{activity.memo}</div> : null}
          </button>

          <span
            className="act__handle"
            {...attributes}
            {...listeners}
            aria-label="ドラッグして並べ替え"
          >
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
                リンク
              </a>
            ) : null}
          </div>
        ) : null}

        {activity.photoIds.length > 0 ? (
          <div className={clsx('act__photos', activity.photoIds.length === 1 && 'act__photos--single')}>
            {activity.photoIds.map((id, i) => (
              <Thumb key={id} id={id} onOpen={() => onPhotoOpen(i)} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------ 本体 */

export function TripDetail({ tripId }: { tripId: string }) {
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
          <h3>旅が見つかりません</h3>
          <p>削除されたか、別の端末で作られた旅かもしれません。</p>
          <button className="btn btn--primary" style={{ marginTop: 16 }} onClick={() => navigate('/')}>
            ホームにもどる
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
        <button className="iconbtn" onClick={goHome} aria-label="もどる">
          <Icon name="left" size={19} strokeWidth={2.2} />
        </button>
        <span className="topbar__title">{trip.title}</span>
        <button className="iconbtn" onClick={() => setExporting(true)} aria-label="書き出す">
          <Icon name="download" size={19} />
        </button>
        <button className="iconbtn" onClick={() => setMenu(true)} aria-label="メニュー">
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
            <div className="cover__dates">{rangeLabel(trip.startDate, trip.endDate)}</div>
            <div className="cover__pills">
              <span className="cover__pill">
                <Icon name="calendar" size={13} strokeWidth={2.2} />
                {nightsBetween(trip.startDate, trip.endDate)}日間
              </span>
              <span className="cover__pill">
                <Icon name="route" size={13} strokeWidth={2.2} />
                予定 {totalPlans}件
              </span>
              {tripTotal > 0 ? (
                <span className="cover__pill num">
                  <Icon name="coin" size={13} strokeWidth={2.2} />
                  {yen(tripTotal)}
                </span>
              ) : null}
              {left != null && left > 0 ? (
                <span className="cover__pill">
                  <Icon name="plane" size={13} strokeWidth={2.2} />
                  あと{left}日
                </span>
              ) : null}
            </div>
            <div className="cover__actions">
              <button className="cover__btn" onClick={() => setExporting(true)}>
                <Icon name="download" size={15} strokeWidth={2.2} />
                しおりに書き出す
              </button>
              <button className="cover__btn cover__btn--outline" onClick={() => setEditTrip(true)}>
                <Icon name="pencil" size={15} strokeWidth={2.2} />
                旅の情報
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
                  ['土', '日'].includes(weekday(d.date)) && 'is-weekend',
                )}
                onClick={() => selectDay(i)}
              >
                <span>DAY</span>
                <b>{i + 1}</b>
                <small>
                  {d.date.slice(5).replace('-', '/')}
                  {weekday(d.date) ? `(${weekday(d.date)})` : ''}
                </small>
              </button>
            ))}
          </div>
        </nav>

        {day ? (
          <>
            <div className="dayhead">
              <div className="dayhead__stamp" style={{ background: th.gradient }}>
                <div style={{ textAlign: 'center' }}>
                  <span>DAY</span>
                  <b>{safeIndex + 1}</b>
                </div>
              </div>
              <div className="dayhead__main">
                <div className="dayhead__date">{formatJp(day.date)}</div>
                <div className={clsx('dayhead__title', !day.title && 'dayhead__title--empty')}>
                  {day.title || 'この日のテーマを決める'}
                </div>
                {day.memo ? <div className="dayhead__memo">{day.memo}</div> : null}
              </div>
              <button
                className="iconbtn"
                onClick={() => setEditDay(true)}
                aria-label="この日の情報を編集"
              >
                <Icon name="pencil" size={17} />
              </button>
            </div>

            <div className="daysum">
              <span className="stat-chip">
                予定 <b>{day.activities.length}</b>
              </span>
              {dayTotal > 0 ? (
                <span className="stat-chip">
                  費用 <b>{yen(dayTotal)}</b>
                </span>
              ) : null}
              {day.activities.length > 1 ? (
                <button
                  className="stat-chip"
                  onClick={() => {
                    sortActivitiesByTime(trip.id, day.id)
                    toast('時刻順に並べ替えました')
                  }}
                >
                  <Icon name="sort" size={14} />
                  時刻順に並べる
                </button>
              ) : null}
            </div>

            {day.activities.length === 0 ? (
              <div className="empty">
                <div className="empty__icon" style={{ background: th.gradient }}>
                  <Icon name="sparkle" size={30} strokeWidth={1.8} />
                </div>
                <h3>DAY {safeIndex + 1} はまだ真っ白</h3>
                <p>
                  行きたい場所、食べたいもの。
                  <br />
                  ひとつ足すところから始めましょう。
                </p>
                <button
                  className="btn btn--primary"
                  style={{ marginTop: 18 }}
                  onClick={() => setEditing({ activity: emptyActivity(), isNew: true })}
                >
                  <Icon name="plus" size={17} strokeWidth={2.4} />
                  最初の予定を追加
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
                                ここからの行き方を調べる
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
                DAY {safeIndex + 1} に予定を足す
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
          旅の準備と、記録
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
              旅のメモ
            </h3>
            <p style={{ fontSize: 13.5, color: 'var(--ink-2)', whiteSpace: 'pre-wrap' }}>{trip.memo}</p>
          </section>
        ) : null}
      </main>

      {day ? (
        <button
          className="fab"
          onClick={() => setEditing({ activity: emptyActivity(), isNew: true })}
        >
          <Icon name="plus" size={20} strokeWidth={2.6} />
          予定を追加
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
        <Sheet title="この旅について" onClose={() => setMenu(false)}>
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
                旅の情報を編集
                <small>タイトル・日程・テーマ・カバー写真</small>
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
                ファイルに書き出す
                <small>PDF のしおり / PNG 画像</small>
              </span>
            </button>
            <button
              className="menu__item"
              onClick={() => {
                const id = duplicateTrip(trip.id)
                setMenu(false)
                if (id) {
                  toast('旅を複製しました')
                  navigate(`/trip/${id}`)
                }
              }}
            >
              <span className="menu__icon">
                <Icon name="copy" size={18} />
              </span>
              <span>
                この旅を複製
                <small>同じ行程をベースに新しい旅を作る</small>
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
                この旅を削除
                <small>予定と写真もすべて消えます</small>
              </span>
            </button>
          </div>
        </Sheet>
      ) : null}

      {confirmDelete ? (
        <Confirm
          title="この旅を削除しますか？"
          message={`「${trip.title}」の予定 ${totalPlans}件と写真がすべて削除されます。この操作は取り消せません。`}
          confirmLabel="削除する"
          danger
          onClose={() => setConfirmDelete(false)}
          onConfirm={() => {
            deleteTrip(trip.id)
            toast('旅を削除しました')
            navigate('/')
          }}
        />
      ) : null}
    </>
  )
}
