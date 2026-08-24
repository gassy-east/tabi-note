import { useMemo, useState } from 'react'
import { Icon } from '../components/Icon'
import { TripFormSheet } from '../components/TripFormSheet'
import { SettingsSheet } from '../components/SettingsSheet'
import { useStore } from '../state/store'
import { usePhoto } from '../state/photos'
import { theme } from '../lib/catalog'
import { daysUntil, formatDot, nightsBetween, todayIso } from '../lib/date'
import { useScrolled } from '../lib/hooks'
import { navigate } from '../App'
import type { Trip } from '../types'

function TripCard({ trip, index }: { trip: Trip; index: number }) {
  const cover = usePhoto(trip.coverPhotoId)
  const th = theme(trip.theme)
  const left = daysUntil(trip.startDate)
  const days = nightsBetween(trip.startDate, trip.endDate)
  const plans = trip.days.reduce((n, d) => n + d.activities.length, 0)
  const past = trip.endDate < todayIso()
  const ongoing = !past && left !== null && left <= 0

  return (
    <button
      className="trip-card"
      style={{ animationDelay: `${index * 55}ms` }}
      onClick={() => navigate(`/trip/${trip.id}`)}
    >
      <div className="trip-card__cover" style={{ background: th.gradient }}>
        {cover ? <img src={cover} alt="" /> : <div className="trip-card__pattern" />}
        <div className="trip-card__scrim" />
        <div className={past ? 'trip-card__badge trip-card__badge--past' : 'trip-card__badge'}>
          {past ? (
            <>
              <span>ARCHIVE</span>
              <b>おつかれさま</b>
            </>
          ) : ongoing ? (
            <>
              <span>NOW</span>
              <b>旅の途中</b>
            </>
          ) : (
            <>
              <span>あと</span>
              <b>{left}</b>
              <span>DAYS</span>
            </>
          )}
        </div>
        <div className="trip-card__cover-text">
          {trip.destination ? (
            <span className="trip-card__dest">
              <Icon name="pin" size={12} strokeWidth={2.2} />
              {trip.destination}
            </span>
          ) : null}
          <div className="trip-card__name">{trip.title}</div>
        </div>
      </div>
      <div className="trip-card__body">
        <div className="trip-card__meta">
          <div className="trip-card__date">
            {formatDot(trip.startDate)} — {formatDot(trip.endDate)}
          </div>
          <div className="trip-card__counts">
            {days}日間・予定 {plans}件
            {trip.members.length ? `・${trip.members.length + 1}人` : ''}
            {trip.memories.length > 0 ? `・思い出 ${trip.memories.length}枚` : ''}
          </div>
        </div>
        <span className="iconbtn iconbtn--plain" aria-hidden="true">
          <Icon name="right" size={18} strokeWidth={2.2} />
        </span>
      </div>
    </button>
  )
}

export function Home() {
  const { trips } = useStore()
  const [creating, setCreating] = useState(false)
  const [settings, setSettings] = useState(false)
  const scrolled = useScrolled()

  const { upcoming, past } = useMemo(() => {
    const today = todayIso()
    const up = trips.filter((t) => t.endDate >= today)
    const old = trips.filter((t) => t.endDate < today)
    up.sort((a, b) => a.startDate.localeCompare(b.startDate))
    return { upcoming: up, past: old }
  }, [trips])

  const nextTrip = upcoming[0]
  const nextLeft = nextTrip ? daysUntil(nextTrip.startDate) : null
  const totalPlans = trips.reduce(
    (n, t) => n + t.days.reduce((m, d) => m + d.activities.length, 0),
    0,
  )

  return (
    <>
      <header className={scrolled ? 'topbar is-scrolled' : 'topbar'}>
        <span className="topbar__title">たびノート</span>
        <button className="iconbtn" onClick={() => setSettings(true)} aria-label="設定">
          <Icon name="dots" size={19} />
        </button>
      </header>

      <main className="shell">
        <section className="hero">
          <span className="hero__mark">
            <Icon name="compass" size={15} strokeWidth={2.2} />
            TABI NOTE
          </span>
          <h1 className="hero__title">
            つぎの旅は、
            <br />
            <em>どこへ行こう。</em>
          </h1>
          <p className="hero__sub">
            行きたい場所をならべて、写真とメモを添えて。できあがったらしおりに書き出せます。
          </p>
          <div className="hero__stats">
            <span className="stat-chip">
              旅の数 <b>{trips.length}</b>
            </span>
            <span className="stat-chip">
              予定 <b>{totalPlans}</b>
            </span>
            {nextLeft != null && nextLeft > 0 ? (
              <span className="stat-chip">
                つぎの出発まで <b>{nextLeft}</b> 日
              </span>
            ) : null}
          </div>
        </section>

        {trips.length === 0 ? (
          <div className="empty">
            <div className="empty__icon">
              <Icon name="suitcase" size={30} strokeWidth={1.8} />
            </div>
            <h3>まだ旅の予定がありません</h3>
            <p>
              行き先と日程を決めるところから。
              <br />
              1 分でしおりの土台ができます。
            </p>
            <button
              className="btn btn--primary"
              style={{ marginTop: 18 }}
              onClick={() => setCreating(true)}
            >
              <Icon name="plus" size={17} strokeWidth={2.4} />
              最初の旅をつくる
            </button>
          </div>
        ) : null}

        {upcoming.length > 0 ? (
          <section style={{ marginTop: 8 }}>
            <h2 className="section-title" style={{ marginBottom: 14 }}>
              <Icon name="plane" size={17} />
              これからの旅
              <i className="section-title__line" />
            </h2>
            <div className="trip-grid">
              {upcoming.map((t, i) => (
                <TripCard key={t.id} trip={t} index={i} />
              ))}
            </div>
          </section>
        ) : null}

        {past.length > 0 ? (
          <section style={{ marginTop: 34 }}>
            <h2 className="section-title" style={{ marginBottom: 14 }}>
              <Icon name="book" size={17} />
              旅のきろく
              <i className="section-title__line" />
            </h2>
            <div className="trip-grid">
              {past.map((t, i) => (
                <TripCard key={t.id} trip={t} index={i} />
              ))}
            </div>
          </section>
        ) : null}
      </main>

      {trips.length > 0 ? (
        <button className="fab" onClick={() => setCreating(true)}>
          <Icon name="plus" size={20} strokeWidth={2.6} />
          新しい旅
        </button>
      ) : null}

      {creating ? (
        <TripFormSheet
          onClose={() => setCreating(false)}
          onCreated={(id) => navigate(`/trip/${id}`)}
        />
      ) : null}
      {settings ? <SettingsSheet onClose={() => setSettings(false)} /> : null}
    </>
  )
}
