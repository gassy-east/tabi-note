import { getLocale } from '../i18n'

/**
 * 通貨まわりの小さな道具。
 * 桁数も名前も Intl に任せているので、辞書を増やさなくても表示言語についてくる。
 */

/** 選択肢に出す通貨。旅先としてよく使うものを、地域ごとにゆるく並べている */
export const CURRENCIES = [
  'JPY',
  'USD',
  'EUR',
  'GBP',
  'CHF',
  'KRW',
  'CNY',
  'TWD',
  'HKD',
  'THB',
  'VND',
  'SGD',
  'MYR',
  'IDR',
  'PHP',
  'INR',
  'AUD',
  'NZD',
  'CAD',
  'MXN',
  'BRL',
  'TRY',
  'AED',
  'EGP',
  'ZAR',
  'SEK',
  'NOK',
  'DKK',
  'PLN',
  'CZK',
  'HUF',
] as const

const digitsCache = new Map<string, number>()

/** その通貨がふつう小数点以下何桁まで使うか（円・ウォンなら 0） */
export function currencyDigits(code: string): number {
  const key = code || 'JPY'
  const hit = digitsCache.get(key)
  if (hit != null) return hit
  let digits = 2
  try {
    digits =
      new Intl.NumberFormat('en', { style: 'currency', currency: key }).resolvedOptions()
        .maximumFractionDigits ?? 2
  } catch {
    /* 知らないコードは 2 桁として扱う */
  }
  digitsCache.set(key, digits)
  return digits
}

/** 金額をその通貨の桁数に丸める */
export function roundMoney(amount: number, code: string): number {
  const f = 10 ** currencyDigits(code)
  return Math.round(amount * f) / f
}

/**
 * 「¥1,500」「$12.40」のように、表示言語の書き方で整える。
 * ちょうどの額なら小数点以下は出さない（NT$160.00 より NT$160 のほうが読みやすい）。
 */
export function formatMoney(amount: number, code: string): string {
  const safe = code || 'JPY'
  const rounded = roundMoney(amount, safe)
  const digits = Number.isInteger(rounded) ? 0 : currencyDigits(safe)
  try {
    return new Intl.NumberFormat(getLocale(), {
      style: 'currency',
      currency: safe,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(rounded)
  } catch {
    return `${safe} ${rounded.toLocaleString()}`
  }
}

/**
 * 為替レートは金額ではないので、通貨の桁数で丸めない。
 * 1 TWD = 4.8 JPY を「¥5」と出してしまわないための書式。
 */
export function formatRate(rate: number, homeCode: string): string {
  const digits = rate >= 100 ? 2 : rate >= 1 ? 4 : 6
  try {
    const n = new Intl.NumberFormat(getLocale(), { maximumFractionDigits: digits }).format(rate)
    return `${n} ${homeCode}`
  } catch {
    return `${rate} ${homeCode}`
  }
}

const nameCache = new Map<string, string>()

/** 「日本円」「US ドル」のような通貨名。取れなければコードをそのまま返す */
export function currencyName(code: string): string {
  const key = `${getLocale()}:${code}`
  const hit = nameCache.get(key)
  if (hit != null) return hit
  let name = code
  try {
    name = new Intl.DisplayNames([getLocale()], { type: 'currency' }).of(code) ?? code
  } catch {
    /* 対応していない環境ではコードだけ見せる */
  }
  nameCache.set(key, name)
  return name
}

/** 選択肢の表示。「JPY — 日本円」 */
export function currencyOptionLabel(code: string): string {
  const name = currencyName(code)
  return name === code ? code : `${code} — ${name}`
}

/** 表示言語から、たぶんこれだろうという自宅の通貨を決める */
export function guessHomeCurrency(): string {
  const locale = getLocale().toLowerCase()
  if (locale.startsWith('ja')) return 'JPY'
  if (locale.startsWith('ko')) return 'KRW'
  if (locale.startsWith('zh')) return 'CNY'
  if (locale.startsWith('en-gb')) return 'GBP'
  if (locale.startsWith('en')) return 'USD'
  return 'EUR'
}

/** 入力欄の文字列を金額に。空なら null */
export function parseAmount(raw: string, code: string): number | null {
  const cleaned = raw.replace(/[^\d.]/g, '')
  if (cleaned === '') return null
  const n = Number(cleaned)
  if (!Number.isFinite(n)) return null
  return currencyDigits(code) === 0 ? Math.round(n) : n
}
