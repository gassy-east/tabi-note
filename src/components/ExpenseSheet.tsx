import { Fragment, useMemo, useState } from 'react'
import { Sheet } from './Sheet'
import { Icon } from './Icon'
import { category, categoryLabel } from '../lib/catalog'
import { formatDate } from '../lib/date'
import { formatMoney, formatRate, roundMoney } from '../lib/money'
import { collectExpenses, participantLabel, sumByCategory, totalHome } from '../lib/expense'
import { clsx } from '../lib/util'
import { useT } from '../i18n'
import type { Activity, CategoryId, Trip } from '../types'

interface ExpenseSheetProps {
  trip: Trip
  onClose: () => void
  /** 明細をタップしたら、その予定の編集をひらく */
  onPick: (dayId: string, activity: Activity) => void
}

export function ExpenseSheet({ trip, onClose, onPick }: ExpenseSheetProps) {
  const t = useT()
  const [filter, setFilter] = useState<CategoryId | 'all'>('all')

  const all = useMemo(() => collectExpenses(trip), [trip])
  const cats = useMemo(() => sumByCategory(all), [all])
  const rows = useMemo(
    () => (filter === 'all' ? all : all.filter((e) => e.activity.category === filter)),
    [all, filter],
  )
  const home = trip.homeCurrency
  const total = totalHome(rows)

  return (
    <Sheet title={t('money.detailTitle')} onClose={onClose}>
      <div className="money__sum">
        <span>{t('money.total')}</span>
        <b className="num">{formatMoney(roundMoney(total, home), home)}</b>
        <i className="num">{t('money.entries', { n: rows.length })}</i>
      </div>

      {cats.length > 1 ? (
        <div className="money__filters">
          <button
            className={clsx('money__filter', filter === 'all' && 'is-on')}
            onClick={() => setFilter('all')}
          >
            {t('money.filterAll')}
          </button>
          {cats.map((c) => {
            const cat = category(c.id)
            const on = filter === c.id
            return (
              <button
                key={c.id}
                className={clsx('money__filter', on && 'is-on')}
                style={on ? { background: cat.tint, borderColor: cat.color, color: cat.color } : undefined}
                onClick={() => setFilter(c.id)}
              >
                <Icon name={cat.icon} size={13} strokeWidth={2.2} />
                {categoryLabel(c.id)}
              </button>
            )
          })}
        </div>
      ) : null}

      {rows.length === 0 ? (
        <p className="tiny muted" style={{ padding: '20px 2px' }}>
          {t('money.emptyFilter')}
        </p>
      ) : (
        <div className="money__ledger">
          {rows.map((e, i) => {
            const cat = category(e.activity.category)
            const newDay = i === 0 || rows[i - 1].day.id !== e.day.id
            const daySum = rows.filter((r) => r.day.id === e.day.id).reduce((n, r) => n + r.home, 0)
            return (
              <Fragment key={e.activity.id}>
                {newDay ? (
                  <div className="money__ledgerday">
                    <span>
                      {t('day.label')} {e.dayIndex + 1}
                      <i>{formatDate(e.day.date)}</i>
                    </span>
                    <b className="num">{formatMoney(roundMoney(daySum, home), home)}</b>
                  </div>
                ) : null}
                <button className="money__entry" onClick={() => onPick(e.day.id, e.activity)}>
                  <span className="money__dot" style={{ background: cat.tint, color: cat.color }}>
                    <Icon name={cat.icon} size={14} strokeWidth={2} />
                  </span>
                  <span className="money__entrymain">
                    <b>{e.activity.title || t('act.untitled')}</b>
                    <i>
                      {e.activity.time ? `${e.activity.time}・` : ''}
                      {categoryLabel(e.activity.category)}
                      {e.activity.payer ? `・${participantLabel(e.activity.payer)}` : ''}
                    </i>
                  </span>
                  <span className="money__entryamount">
                    <b className="num">{formatMoney(roundMoney(e.home, home), home)}</b>
                    {e.converted ? (
                      <i className="num">{formatMoney(e.amount, e.currency)}</i>
                    ) : null}
                  </span>
                </button>
              </Fragment>
            )
          })}
        </div>
      )}

      {trip.currency !== home ? (
        <p className="tiny muted" style={{ marginTop: 14 }}>
          {t('pdf.rateNote', {
            local: trip.currency,
            v: formatRate(trip.rate, home),
          })}
        </p>
      ) : null}
    </Sheet>
  )
}
