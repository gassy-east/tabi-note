import { useState } from 'react'
import { Sheet } from './Sheet'
import { Icon } from './Icon'
import { toast } from './Toast'
import { updateDay } from '../state/store'
import { formatJp } from '../lib/date'
import type { Day } from '../types'

interface DaySheetProps {
  tripId: string
  day: Day
  index: number
  onClose: () => void
}

export function DaySheet({ tripId, day, index, onClose }: DaySheetProps) {
  const [title, setTitle] = useState(day.title)
  const [memo, setMemo] = useState(day.memo)

  return (
    <Sheet
      title={`DAY ${index + 1}・${formatJp(day.date)}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn--soft" onClick={onClose}>
            キャンセル
          </button>
          <button
            className="btn btn--primary"
            onClick={() => {
              updateDay(tripId, day.id, { title: title.trim(), memo })
              toast('この日の情報を保存しました')
              onClose()
            }}
          >
            <Icon name="check" size={17} strokeWidth={2.4} />
            保存する
          </button>
        </>
      }
    >
      <div className="field">
        <label className="field__label" htmlFor="day-title">
          <Icon name="compass" size={14} /> この日のテーマ
        </label>
        <input
          id="day-title"
          className="input"
          value={title}
          placeholder="嵐山さんぽと湯豆腐"
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
      </div>
      <div className="field">
        <label className="field__label" htmlFor="day-memo">
          <Icon name="book" size={14} /> この日のメモ
        </label>
        <textarea
          id="day-memo"
          className="textarea"
          value={memo}
          placeholder="朝は冷えるので上着を。バス一日券を買うと得。"
          onChange={(e) => setMemo(e.target.value)}
        />
      </div>
    </Sheet>
  )
}
