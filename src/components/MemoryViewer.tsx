import { useState } from 'react'
import { Icon } from './Icon'
import { Lightbox } from './Lightbox'
import { Confirm } from './Sheet'
import { toast } from './Toast'
import { removeMemory, setCoverPhoto, updateMemory } from '../state/store'
import { formatJp } from '../lib/date'
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
          placeholder="ひとこと添える（例：宿の窓から見えた朝焼け）"
          onChange={(e) => updateMemory(trip.id, { ...current, caption: e.target.value })}
        />
        <div className="lightbox__actions">
          <select
            className="lightbox__select"
            value={current.dayId}
            onChange={(e) => updateMemory(trip.id, { ...current, dayId: e.target.value })}
            aria-label="いつの思い出か"
          >
            <option value="">日付なし</option>
            {trip.days.map((d, i) => (
              <option key={d.id} value={d.id}>
                DAY {i + 1}・{formatJp(d.date)}
              </option>
            ))}
          </select>
          <button
            className="lightbox__btn"
            onClick={() => {
              setCoverPhoto(trip.id, current.photoId)
              toast('カバー写真にしました')
            }}
          >
            <Icon name="sparkle" size={15} strokeWidth={2.2} />
            カバーに
          </button>
          <button
            className="lightbox__btn lightbox__btn--danger"
            onClick={() => setConfirmDelete(true)}
          >
            <Icon name="trash" size={15} strokeWidth={2.2} />
            削除
          </button>
        </div>
      </Lightbox>

      {confirmDelete ? (
        <Confirm
          title="この写真を削除しますか？"
          message="アルバムから取り除かれ、端末からも消えます。"
          confirmLabel="削除する"
          danger
          onClose={() => setConfirmDelete(false)}
          onConfirm={() => {
            removeMemory(trip.id, current.id)
            toast('写真を削除しました')
            if (memories.length <= 1) onClose()
            else onIndexChange(Math.max(0, index - 1))
          }}
        />
      ) : null}
    </>
  )
}
