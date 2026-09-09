import { useMemo } from 'react'
import { CURRENCIES, currencyOptionLabel } from '../lib/money'
import { useLang } from '../i18n'

interface CurrencySelectProps {
  id?: string
  value: string
  onChange: (code: string) => void
  'aria-label'?: string
}

/** 通貨を選ぶ。一覧にない通貨が入っていても、選択肢の先頭に足して選べる状態を保つ */
export function CurrencySelect({ id, value, onChange, ...rest }: CurrencySelectProps) {
  useLang()
  const codes = useMemo(() => {
    const list: string[] = [...CURRENCIES]
    return value && !list.includes(value) ? [value, ...list] : list
  }, [value])

  return (
    <select
      id={id}
      className="select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={rest['aria-label']}
    >
      {codes.map((code) => (
        <option key={code} value={code}>
          {currencyOptionLabel(code)}
        </option>
      ))}
    </select>
  )
}
