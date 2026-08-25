import { useState } from 'react'
import { Sheet } from './Sheet'
import { Icon } from './Icon'
import { toast } from './Toast'
import { updateDay } from '../state/store'
import { formatDate } from '../lib/date'
import { useT } from '../i18n'
import type { Day } from '../types'

interface DaySheetProps {
  tripId: string
  day: Day
  index: number
  onClose: () => void
}

export function DaySheet({ tripId, day, index, onClose }: DaySheetProps) {
  const t = useT()
  const [title, setTitle] = useState(day.title)
  const [memo, setMemo] = useState(day.memo)

  return (
    <Sheet
      title={`${t('day.label')} ${index + 1}・${formatDate(day.date)}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn--soft" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button
            className="btn btn--primary"
            onClick={() => {
              updateDay(tripId, day.id, { title: title.trim(), memo })
              toast(t('day.saved'))
              onClose()
            }}
          >
            <Icon name="check" size={17} strokeWidth={2.4} />
            {t('common.save')}
          </button>
        </>
      }
    >
      <div className="field">
        <label className="field__label" htmlFor="day-title">
          <Icon name="compass" size={14} /> {t('day.sheet.title')}
        </label>
        <input
          id="day-title"
          className="input"
          value={title}
          placeholder={t('day.sheet.titlePh')}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
      </div>
      <div className="field">
        <label className="field__label" htmlFor="day-memo">
          <Icon name="book" size={14} /> {t('day.sheet.memo')}
        </label>
        <textarea
          id="day-memo"
          className="textarea"
          value={memo}
          placeholder={t('day.sheet.memoPh')}
          onChange={(e) => setMemo(e.target.value)}
        />
      </div>
    </Sheet>
  )
}
