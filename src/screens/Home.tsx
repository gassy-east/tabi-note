import { useMemo, useState } from 'react'
import { Icon } from '../components/Icon'
import { TripFormSheet } from '../components/TripFormSheet'
import { SettingsSheet } from '../components/SettingsSheet'
import { LanguageSheet } from '../components/LanguageSheet'
import { AppearanceSheet } from '../components/AppearanceSheet'
import { useStore } from '../state/store'
import { usePhoto } from '../state/photos'
import { theme } from '../lib/catalog'
import { daysUntil, formatDot, nightsBetween, todayIso } from '../lib/date'
import { useScrolled } from '../lib/hooks'
import { navigate } from '../App'
import { getLang, useT } from '../i18n'
import type { Trip } from '../types'

function TripCard({ trip, index }: { trip: Trip; index: number }) {
  const t = useT()
  const cover = usePhoto(trip.coverPhotoId)
  const th = theme(trip.theme)
  const left = daysUntil(trip.startDate)
  const days = nightsBetween(trip.startDate, trip.endDate)
  const plans = trip.days.reduce((n, d) => n + d.activities.length, 0)
  const past = trip.endDate < todayIso()
  const ongoing = !past && left !== null && left <= 0

  const meta = [t('home.card.daysCount', { n: days }), t('home.card.plansCount', { n: plans })]
  if (trip.members.length) meta.push(t('home.card.people', { n: trip.members.length + 1 }))
  if (trip.memories.length) meta.push(t('home.card.memories', { n: trip.memories.length }))

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
              <span>{t('home.card.archive')}</span>
              <b>{t('home.card.archiveLabel')}</b>
            </>
          ) : ongoing ? (
            <>
              <span>{t('home.card.now')}</span>
              <b>{t('home.card.nowLabel')}</b>
            </>
          ) : (
            <>
              <span>{t('home.card.left')}</span>
              <b>{left}</b>
              <span>{t('home.card.days')}</span>
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
          <div className="trip-card__counts">{meta.join('・')}</div>
        </div>
        <span className="iconbtn iconbtn--plain" aria-hidden="true">
          <Icon name="right" size={18} strokeWidth={2.2} />
        </span>
      </div>
    </button>
  )
}

export function Home() {
  const t = useT()
  const lang = getLang()
  const { trips } = useStore()
  const [creating, setCreating] = useState(false)
  const [settings, setSettings] = useState(false)
  const [language, setLanguage] = useState(false)
  const [appearance, setAppearance] = useState(false)
  const scrolled = useScrolled()

  const { upcoming, past } = useMemo(() => {
    const today = todayIso()
    const up = trips.filter((x) => x.endDate >= today)
    const old = trips.filter((x) => x.endDate < today)
    up.sort((a, b) => a.startDate.localeCompare(b.startDate))
    return { upcoming: up, past: old }
  }, [trips])

  const nextTrip = upcoming[0]
  const nextLeft = nextTrip ? daysUntil(nextTrip.startDate) : null
  const totalPlans = trips.reduce(
    (n, x) => n + x.days.reduce((m, d) => m + d.activities.length, 0),
    0,
  )

  return (
    <>
      <header className={scrolled ? 'topbar is-scrolled' : 'topbar'}>
        <span className="topbar__title">{t('app.name')}</span>
        <button className="langbtn" onClick={() => setLanguage(true)} aria-label={t('lang.aria')}>
          <Icon name="compass" size={15} strokeWidth={2.2} />
          {lang.toUpperCase()}
        </button>
        <button className="iconbtn" onClick={() => setAppearance(true)} aria-label={t('skin.aria')}>
          <Icon name="sparkle" size={18} />
        </button>
        <button className="iconbtn" onClick={() => setSettings(true)} aria-label={t('common.settings')}>
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
            {t('home.title1')}
            <br />
            <em>{t('home.title2')}</em>
          </h1>
          <p className="hero__sub">{t('home.sub')}</p>
          <div className="hero__stats">
            <span className="stat-chip">
              {t('home.stat.trips')} <b>{trips.length}</b>
            </span>
            <span className="stat-chip">
              {t('home.stat.plans')} <b>{totalPlans}</b>
            </span>
            {nextLeft != null && nextLeft > 0 ? (
              <span className="stat-chip">
                {t('home.stat.countdown')} <b>{nextLeft}</b> {t('home.stat.days', { n: nextLeft })}
              </span>
            ) : null}
          </div>
        </section>

        {trips.length === 0 ? (
          <div className="empty">
            <div className="empty__icon">
              <Icon name="suitcase" size={30} strokeWidth={1.8} />
            </div>
            <h3>{t('home.empty.title')}</h3>
            <p style={{ whiteSpace: 'pre-line' }}>{t('home.empty.body')}</p>
            <button
              className="btn btn--primary"
              style={{ marginTop: 18 }}
              onClick={() => setCreating(true)}
            >
              <Icon name="plus" size={17} strokeWidth={2.4} />
              {t('home.empty.cta')}
            </button>
          </div>
        ) : null}

        {upcoming.length > 0 ? (
          <section style={{ marginTop: 8 }}>
            <h2 className="section-title" style={{ marginBottom: 14 }}>
              <Icon name="plane" size={17} />
              {t('home.section.upcoming')}
              <i className="section-title__line" />
            </h2>
            <div className="trip-grid">
              {upcoming.map((x, i) => (
                <TripCard key={x.id} trip={x} index={i} />
              ))}
            </div>
          </section>
        ) : null}

        {past.length > 0 ? (
          <section style={{ marginTop: 34 }}>
            <h2 className="section-title" style={{ marginBottom: 14 }}>
              <Icon name="book" size={17} />
              {t('home.section.past')}
              <i className="section-title__line" />
            </h2>
            <div className="trip-grid">
              {past.map((x, i) => (
                <TripCard key={x.id} trip={x} index={i} />
              ))}
            </div>
          </section>
        ) : null}
      </main>

      {trips.length > 0 ? (
        <button className="fab" onClick={() => setCreating(true)}>
          <Icon name="plus" size={20} strokeWidth={2.6} />
          {t('home.fab')}
        </button>
      ) : null}

      {creating ? (
        <TripFormSheet
          onClose={() => setCreating(false)}
          onCreated={(id) => navigate(`/trip/${id}`)}
        />
      ) : null}
      {settings ? <SettingsSheet onClose={() => setSettings(false)} /> : null}
      {language ? <LanguageSheet onClose={() => setLanguage(false)} /> : null}
      {appearance ? <AppearanceSheet onClose={() => setAppearance(false)} /> : null}
    </>
  )
}
