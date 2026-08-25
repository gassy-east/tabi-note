import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Icon } from './Icon'
import { MemoryViewer } from './MemoryViewer'
import { toast } from './Toast'
import { savePhotos, usePhoto } from '../state/photos'
import { addMemories, updateDay } from '../state/store'
import { formatDate, todayIso } from '../lib/date'
import { useT } from '../i18n'
import { theme } from '../lib/catalog'
import { clsx } from '../lib/util'
import type { Day, Trip } from '../types'

const SAVE_DELAY = 700

function DiaryPhoto({ photoId, caption, onOpen }: { photoId: string; caption: string; onOpen: () => void }) {
  const url = usePhoto(photoId)
  return (
    <button className="diary__photo" onClick={onOpen} aria-label={caption}>
      {url ? <img src={url} alt="" loading="lazy" /> : null}
    </button>
  )
}

interface DiaryCardProps {
  trip: Trip
  day: Day
  index: number
}

export function DiaryCard({ trip, day, index }: DiaryCardProps) {
  const t = useT()
  const [text, setText] = useState(day.diary)
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const areaRef = useRef<HTMLTextAreaElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const timer = useRef<number | null>(null)

  const dayMemories = trip.memories.filter((m) => m.dayId === day.id)
  const th = theme(trip.theme)
  const isFuture = day.date > todayIso()

  // 日を切り替えたときだけ内容を読み直す（入力中の取り消しを防ぐ）
  useEffect(() => {
    setText(day.diary)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day.id])

  // 入力に合わせて高さを伸ばす
  useLayoutEffect(() => {
    const el = areaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(96, el.scrollHeight)}px`
  }, [text])

  function commit(value: string) {
    if (value !== day.diary) updateDay(trip.id, day.id, { diary: value })
  }

  function handleChange(value: string) {
    setText(value)
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => commit(value), SAVE_DELAY)
  }

  // 画面を離れるときに書きかけを取りこぼさない
  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current)
    },
    [],
  )

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    setBusy(true)
    try {
      const ids = await savePhotos(Array.from(fileList))
      if (ids.length > 0) {
        addMemories(trip.id, ids, day.id)
        toast(t('diary.photoAdded', { n: index + 1, m: ids.length }))
      }
    } catch {
      toast(t('photo.failed'), 'error')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <section className="card diary">
      <span className="diary__ribbon" style={{ background: th.gradient }} />
      <div className="row" style={{ justifyContent: 'space-between', gap: 10 }}>
        <h3 className="section-title" style={{ fontSize: 15 }}>
          <Icon name="book" size={17} />
          {t('diary.title', { n: index + 1 })}
        </h3>
        <span className="tiny muted num">{formatDate(day.date)}</span>
      </div>

      <textarea
        ref={areaRef}
        className="diary__area"
        value={text}
        placeholder={
          isFuture
            ? t('diary.phFuture')
            : t('diary.ph')
        }
        onChange={(e) => handleChange(e.target.value)}
        onBlur={() => {
          if (timer.current) window.clearTimeout(timer.current)
          commit(text)
        }}
      />

      <div className="diary__foot">
        <span className="tiny muted num">{text.trim().length > 0 ? t('diary.chars', { n: text.trim().length }) : ''}</span>
        <button
          className="btn btn--soft btn--sm"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          <Icon name={busy ? 'sparkle' : 'camera'} size={15} strokeWidth={2.2} />
          {busy ? t('common.adding') : t('diary.addPhoto')}
        </button>
      </div>

      {dayMemories.length > 0 ? (
        <div className="diary__photos">
          {dayMemories.map((m, i) => (
            <DiaryPhoto
              key={m.id}
              photoId={m.photoId}
              caption={m.caption}
              onOpen={() => setOpenIndex(i)}
            />
          ))}
          <button
            className={clsx('diary__add', busy && 'is-busy')}
            onClick={() => inputRef.current?.click()}
            aria-label={t('album.addAria')}
          >
            <Icon name="plus" size={18} strokeWidth={2.4} />
          </button>
        </div>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => void handleFiles(e.target.files)}
      />

      {openIndex != null && dayMemories.length > 0 ? (
        <MemoryViewer
          trip={trip}
          memories={dayMemories}
          index={Math.min(openIndex, dayMemories.length - 1)}
          onIndexChange={setOpenIndex}
          onClose={() => setOpenIndex(null)}
        />
      ) : null}
    </section>
  )
}
