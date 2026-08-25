import { useState } from 'react'
import { Icon } from './Icon'
import { Lightbox } from './Lightbox'
import { Confirm } from './Sheet'
import { toast } from './Toast'
import { removeMemory, setCoverPhoto, updateMemory } from '../state/store'
import { formatDate } from '../lib/date'
import { useT } from '../i18n'
import type { Memory, Trip } from '../types'

interface MemoryViewerProps {
  trip: Trip
  /** 表示対象の思い出（アルバム全体でも、1 日ぶんでもよい） */
  memories: Memory[]
  index: number
  onIndexChange: (index: number) => void
  onClose: () => void
}

/** 思い出の全画面ビューア。ひとこと・日付・カバー設定・削除ができる */
export function MemoryViewer({
  trip,
  memories,
  index,
  onIndexChange,
  onClose,
}: MemoryViewerProps) {
  const t = useT()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const current = memories[index]
  if (!current) return null

  return (
    <>
      <Lightbox
        photoIds={memories.map((m) => m.photoId)}
        index={index}
        onIndexChange={onIndexChange}
        onClose={onClose}
      >
        <input
          className="lightbox__input"
          value={current.caption}
          placeholder={t('album.captionPh')}
          onChange={(e) => updateMemory(trip.id, { ...current, caption: e.target.value })}
        />
        <div className="lightbox__actions">
          <select
            className="lightbox__select"
            value={current.dayId}
            onChange={(e) => updateMemory(trip.id, { ...current, dayId: e.target.value })}
            aria-label={t('album.dayAria')}
          >
            <option value="">{t('album.dayNone')}</option>
            {trip.days.map((d, i) => (
              <option key={d.id} value={d.id}>
                {t('day.label')} {i + 1}・{formatDate(d.date)}
              </option>
            ))}
          </select>
          <button
            className="lightbox__btn"
            onClick={() => {
              setCoverPhoto(trip.id, current.photoId)
              toast(t('album.coverSet'))
            }}
          >
            <Icon name="sparkle" size={15} strokeWidth={2.2} />
            {t('album.setCover')}
          </button>
          <button
            className="lightbox__btn lightbox__btn--danger"
            onClick={() => setConfirmDelete(true)}
          >
            <Icon name="trash" size={15} strokeWidth={2.2} />
            {t('common.delete')}
          </button>
        </div>
      </Lightbox>

      {confirmDelete ? (
        <Confirm
          title={t('album.deleteTitle')}
          message={t('album.deleteBody')}
          confirmLabel={t('detail.delete.confirm')}
          danger
          onClose={() => setConfirmDelete(false)}
          onConfirm={() => {
            removeMemory(trip.id, current.id)
            toast(t('album.deleted'))
            if (memories.length <= 1) onClose()
            else onIndexChange(Math.max(0, index - 1))
          }}
        />
      ) : null}
    </>
  )
}
