import type { Activity, CategoryId, Day, Trip } from '../types'
import { CATEGORIES } from './catalog'
import { currencyDigits, roundMoney } from './money'
import { t } from '../i18n'

/**
 * 費用の集計と割り勘。金額はすべて「自宅の通貨」にそろえてから計算する。
 */

/** 割り勘の参加者としての「自分」。同行者の名前と混ざらない値にしてある */
export const SELF = '@me'

export function participants(trip: Trip): string[] {
  return [SELF, ...trip.members]
}

export function participantLabel(key: string): string {
  return key === SELF ? t('money.me') : key
}

/** 予定の費用を自宅の通貨に換算する */
export function toHome(trip: Trip, amount: number, code: string): number {
  const currency = code || trip.currency
  if (currency === trip.homeCurrency) return amount
  if (currency === trip.currency) return amount * (trip.rate || 1)
  // 旅に登録されていない通貨は、換算のしようがないのでそのまま足す
  return amount
}

export interface Expense {
  activity: Activity
  day: Day
  dayIndex: number
  /** 入力されたままの額 */
  amount: number
  /** 入力された通貨 */
  currency: string
  /** 自宅の通貨に換算した額 */
  home: number
  /** 換算が起きたか（明細に現地通貨を併記するかの判断に使う） */
  converted: boolean
}

/** 旅のなかの「費用が入っている予定」を、日付順に並べて取り出す */
export function collectExpenses(trip: Trip): Expense[] {
  const list: Expense[] = []
  trip.days.forEach((day, dayIndex) => {
    for (const activity of day.activities) {
      if (activity.cost == null) continue
      const currency = activity.costCurrency || trip.currency
      list.push({
        activity,
        day,
        dayIndex,
        amount: activity.cost,
        currency,
        home: toHome(trip, activity.cost, currency),
        converted: currency !== trip.homeCurrency,
      })
    }
  })
  return list
}

export function totalHome(list: Expense[]): number {
  return list.reduce((n, e) => n + e.home, 0)
}

export interface CategorySum {
  id: CategoryId
  total: number
  count: number
  /** 合計に対する割合（0〜1） */
  ratio: number
}

/** 種別ごとの内訳。金額の多い順で、0 円のものは落とす */
export function sumByCategory(list: Expense[]): CategorySum[] {
  const total = totalHome(list)
  const map = new Map<CategoryId, { total: number; count: number }>()
  for (const e of list) {
    const cur = map.get(e.activity.category) ?? { total: 0, count: 0 }
    map.set(e.activity.category, { total: cur.total + e.home, count: cur.count + 1 })
  }
  return CATEGORIES.map((c) => {
    const hit = map.get(c.id)
    return {
      id: c.id,
      total: hit?.total ?? 0,
      count: hit?.count ?? 0,
      ratio: total > 0 ? (hit?.total ?? 0) / total : 0,
    }
  })
    .filter((c) => c.count > 0)
    .sort((a, b) => b.total - a.total)
}

export interface DaySum {
  day: Day
  index: number
  total: number
  count: number
  ratio: number
}

/** 日ごとの内訳。予定のない日も並びを保つため残す */
export function sumByDay(trip: Trip, list: Expense[]): DaySum[] {
  const total = totalHome(list)
  return trip.days.map((day, index) => {
    const rows = list.filter((e) => e.day.id === day.id)
    const sum = totalHome(rows)
    return { day, index, total: sum, count: rows.length, ratio: total > 0 ? sum / total : 0 }
  })
}

export interface Balance {
  key: string
  /** 立て替えた額 */
  paid: number
  /** 負担すべき額 */
  owed: number
  /** paid − owed。プラスなら受け取る側 */
  net: number
}

/**
 * 参加者ごとの貸し借り。
 * 支払った人が決まっている予定だけを対象にする（未指定のものは誰の負担でもない）。
 */
export function balances(trip: Trip, list: Expense[]): Balance[] {
  const people = participants(trip)
  const paid = new Map<string, number>()
  const owed = new Map<string, number>()

  for (const e of list) {
    const payer = e.activity.payer
    if (!payer || !people.includes(payer)) continue
    paid.set(payer, (paid.get(payer) ?? 0) + e.home)

    const picked = e.activity.shareWith.filter((k) => people.includes(k))
    const sharers = picked.length > 0 ? picked : people
    const each = e.home / sharers.length
    for (const key of sharers) owed.set(key, (owed.get(key) ?? 0) + each)
  }

  const digits = currencyDigits(trip.homeCurrency)
  const round = (n: number) => Math.round(n * 10 ** digits) / 10 ** digits

  return people.map((key) => {
    const p = round(paid.get(key) ?? 0)
    const o = round(owed.get(key) ?? 0)
    return { key, paid: p, owed: o, net: round(p - o) }
  })
}

export interface Transfer {
  from: string
  to: string
  amount: number
}

/** 「だれがだれにいくら渡すか」を、やりとりの回数が少なくなるように決める */
export function settle(list: Balance[], homeCurrency: string): Transfer[] {
  const eps = 10 ** -currencyDigits(homeCurrency) / 2
  const debtors = list
    .filter((b) => b.net < -eps)
    .map((b) => ({ key: b.key, amount: -b.net }))
    .sort((a, b) => b.amount - a.amount)
  const creditors = list
    .filter((b) => b.net > eps)
    .map((b) => ({ key: b.key, amount: b.net }))
    .sort((a, b) => b.amount - a.amount)

  const transfers: Transfer[] = []
  let i = 0
  let j = 0
  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].amount, creditors[j].amount)
    if (amount > eps) {
      transfers.push({
        from: debtors[i].key,
        to: creditors[j].key,
        amount: roundMoney(amount, homeCurrency),
      })
    }
    debtors[i].amount -= amount
    creditors[j].amount -= amount
    if (debtors[i].amount <= eps) i += 1
    if (creditors[j].amount <= eps) j += 1
  }
  return transfers
}

/** 割り勘の計算対象になる費用があるか */
export function hasSplit(trip: Trip, list: Expense[]): boolean {
  if (trip.members.length === 0) return false
  const people = participants(trip)
  return list.some((e) => e.activity.payer && people.includes(e.activity.payer))
}
