import { useMemo, useState, type ReactNode } from 'react'
import { Icon } from './Icon'
import { category, categoryLabel, theme } from '../lib/catalog'
import { formatShort } from '../lib/date'
import { formatMoney, roundMoney } from '../lib/money'
import {
  balances,
  collectExpenses,
  hasSplit,
  participantLabel,
  settle,
  sumByCategory,
  sumByDay,
  totalHome,
} from '../lib/expense'
import { clsx } from '../lib/util'
import { useT } from '../i18n'
import type { Trip } from '../types'

interface BarRowProps {
  icon: ReactNode
  label: string
  sub?: string
  amount: string
  ratio: number
  color: string
}

function BarRow({ icon, label, sub, amount, ratio, color }: BarRowProps) {
  return (
    <div className="money__row">
      {icon}
      <div className="money__rowmain">
        <div className="money__rowhead">
          <span className="money__rowlabel">
            {label}
            {sub ? <i>{sub}</i> : null}
          </span>
          <b className="num">{amount}</b>
        </div>
        <div className="money__track">
          <i style={{ width: `${Math.max(ratio * 100, ratio > 0 ? 2 : 0)}%`, background: color }} />
        </div>
      </div>
      <span className="money__pct num">{Math.round(ratio * 100)}%</span>
    </div>
  )
}

export function BudgetCard({ trip, onOpenDetail }: { trip: Trip; onOpenDetail: () => void }) {
  const t = useT()
  const [mode, setMode] = useState<'category' | 'day'>('category')

  const expenses = useMemo(() => collectExpenses(trip), [trip])
  const total = totalHome(expenses)
  const cats = useMemo(() => sumByCategory(expenses), [expenses])
  const days = useMemo(() => sumByDay(trip, expenses), [trip, expenses])
  const th = theme(trip.theme)

  const home = trip.homeCurrency
  const perDay = trip.days.length > 0 ? total / trip.days.length : 0
  const budget = trip.budget
  const overBudget = budget != null && total > budget
  const budgetRatio = budget && budget > 0 ? Math.min(total / budget, 1) : 0

  return (
    <section className="card money">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h3 className="section-title" style={{ fontSize: 15 }}>
          <Icon name="wallet" size={17} />
          {t('money.section')}
        </h3>
        {expenses.length > 0 ? (
          <button className="btn btn--soft btn--sm" onClick={onOpenDetail}>
            <Icon name="receipt" size={15} />
            {t('money.detail')}
          </button>
        ) : null}
      </div>

      {expenses.length === 0 ? (
        <div className="money__blank">
          <b>{t('money.none')}</b>
          <span>{t('money.noneBody')}</span>
        </div>
      ) : (
        <>
          <div className="money__total">
            <span className="money__totallabel">{t('money.total')}</span>
            <b className="num">{formatMoney(roundMoney(total, home), home)}</b>
            <div className="money__totalsub">
              {trip.currency !== home ? (
                <span className="num">
                  {t('money.local', {
                    v: formatMoney(roundMoney(total / (trip.rate || 1), trip.currency), trip.currency),
                  })}
                </span>
              ) : null}
              {perDay > 0 ? (
                <span className="num">
                  {t('money.perDay', { v: formatMoney(roundMoney(perDay, home), home) })}
                </span>
              ) : null}
            </div>
          </div>

          {budget != null && budget > 0 ? (
            <div className={clsx('money__budget', overBudget && 'is-over')}>
              <div className="money__budgethead">
                <span>
                  {t('money.budgetUsed', {
                    used: formatMoney(roundMoney(total, home), home),
                    budget: formatMoney(roundMoney(budget, home), home),
                  })}
                </span>
                <b className="num">
                  {overBudget
                    ? t('money.budgetOver', {
                        v: formatMoney(roundMoney(total - budget, home), home),
                      })
                    : t('money.budgetLeft', {
                        v: formatMoney(roundMoney(budget - total, home), home),
                      })}
                </b>
              </div>
              <div className="money__budgetbar">
                <i style={{ width: `${budgetRatio * 100}%` }} />
              </div>
            </div>
          ) : null}

          <div className="money__switch" role="tablist">
            <button
              role="tab"
              aria-selected={mode === 'category'}
              className={clsx('money__tab', mode === 'category' && 'is-on')}
              onClick={() => setMode('category')}
            >
              {t('money.byCategory')}
            </button>
            <button
              role="tab"
              aria-selected={mode === 'day'}
              className={clsx('money__tab', mode === 'day' && 'is-on')}
              onClick={() => setMode('day')}
            >
              {t('money.byDay')}
            </button>
          </div>

          <div className="money__list">
            {mode === 'category'
              ? cats.map((c) => {
                  const cat = category(c.id)
                  return (
                    <BarRow
                      key={c.id}
                      icon={
                        <span
                          className="money__dot"
                          style={{ background: cat.tint, color: cat.color }}
                        >
                          <Icon name={cat.icon} size={14} strokeWidth={2} />
                        </span>
                      }
                      label={categoryLabel(c.id)}
                      sub={t('money.entries', { n: c.count })}
                      amount={formatMoney(roundMoney(c.total, home), home)}
                      ratio={c.ratio}
                      color={cat.color}
                    />
                  )
                })
              : days
                  .filter((d) => d.count > 0)
                  .map((d) => (
                    <BarRow
                      key={d.day.id}
                      icon={
                        <span className="money__dot money__dot--day" style={{ background: th.gradient }}>
                          {d.index + 1}
                        </span>
                      }
                      label={`${t('day.label')} ${d.index + 1}`}
                      sub={formatShort(d.day.date)}
                      amount={formatMoney(roundMoney(d.total, home), home)}
                      ratio={d.ratio}
                      color={th.solid}
                    />
                  ))}
          </div>
        </>
      )}
    </section>
  )
}

/* ------------------------------------------------------------ 割り勘 */

export function SplitCard({ trip }: { trip: Trip }) {
  const t = useT()
  const expenses = useMemo(() => collectExpenses(trip), [trip])
  const ready = hasSplit(trip, expenses)
  const rows = useMemo(() => (ready ? balances(trip, expenses) : []), [trip, expenses, ready])
  const transfers = useMemo(
    () => (ready ? settle(rows, trip.homeCurrency) : []),
    [rows, ready, trip.homeCurrency],
  )
  const home = trip.homeCurrency

  return (
    <section className="card money">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h3 className="section-title" style={{ fontSize: 15 }}>
          <Icon name="users" size={17} />
          {t('money.split')}
        </h3>
      </div>
      <p className="tiny muted" style={{ marginTop: 2 }}>
        {ready ? t('money.splitLead') : t('money.splitEmpty')}
      </p>

      {ready ? (
        <>
          <div className="money__people">
            {rows.map((b) => {
              const positive = b.net > 0
              return (
                <div key={b.key} className="money__person">
                  <div className="money__personmain">
                    <b>{participantLabel(b.key)}</b>
                    <i className="num">
                      {t('money.paid')} {formatMoney(b.paid, home)} · {t('money.owed')}{' '}
                      {formatMoney(b.owed, home)}
                    </i>
                  </div>
                  {b.net === 0 ? (
                    <span className="money__net">—</span>
                  ) : (
                    <span className={clsx('money__net', positive ? 'is-plus' : 'is-minus')}>
                      <small>{positive ? t('money.getBack') : t('money.payBack')}</small>
                      <b className="num">{formatMoney(Math.abs(b.net), home)}</b>
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          <div className="money__settle">
            <div className="money__settlehead">{t('money.settleTitle')}</div>
            {transfers.length === 0 ? (
              <p className="tiny muted">{t('money.settled')}</p>
            ) : (
              transfers.map((tr, i) => (
                <div key={i} className="money__transfer">
                  <span>
                    {t('money.settleRow', {
                      from: participantLabel(tr.from),
                      to: participantLabel(tr.to),
                    })}
                  </span>
                  <b className="num">{formatMoney(tr.amount, home)}</b>
                </div>
              ))
            )}
          </div>
        </>
      ) : null}
    </section>
  )
}
