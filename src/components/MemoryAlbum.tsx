import { useRef, useState } from 'react'
import { Icon } from './Icon'
import { MemoryViewer } from './MemoryViewer'
import { toast } from './Toast'
import { savePhotos, usePhoto } from '../state/photos'
import { addMemories } from '../state/store'
import { clsx } from '../lib/util'
import { useT } from '../i18n'
import type { Trip } from '../types'

function AlbumTile({
  photoId,
  caption,
  onOpen,
  index,
}: {
  photoId: string
  caption: string
  onOpen: () => void
  index: number
}) {
  const url = usePhoto(photoId)
  return (
    <button className="album__tile" onClick={onOpen} style={{ animationDelay: `${index * 35}ms` }}>
      {url ? <img src={url} alt={caption || ''} loading="lazy" /> : null}
      {caption ? <span className="album__caption">{caption}</span> : null}
    </button>
  )
}

export function MemoryAlbum({ trip }: { trip: Trip }) {
  const t = useT()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const memories = trip.memories

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    setBusy(true)
    try {
      const ids = await savePhotos(Array.from(fileList))
      if (ids.length > 0) {
        addMemories(trip.id, ids)
        toast(t('album.added', { n: ids.length }))
      }
    } catch {
      toast(t('photo.failed'), 'error')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <section className="card album">
      <div className="row" style={{ justifyContent: 'space-between', gap: 10 }}>
        <h3 className="section-title" style={{ fontSize: 15 }}>
          <Icon name="camera" size={17} />
          {t('album.title')}
        </h3>
        <div className="row" style={{ gap: 8 }}>
          {memories.length > 0 ? <span className="tiny muted num">{t('album.count', { n: memories.length })}</span> : null}
          <button
            className="btn btn--soft btn--sm"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            <Icon name={busy ? 'sparkle' : 'plus'} size={15} strokeWidth={2.4} />
            {busy ? t('common.adding') : t('album.photo')}
          </button>
        </div>
      </div>

      {memories.length === 0 ? (
        <button className="album__empty" disabled={busy} onClick={() => inputRef.current?.click()}>
          <span className="album__empty-icon">
            <Icon name="image" size={24} strokeWidth={1.8} />
          </span>
          <b>{t('album.empty.title')}</b>
          <small>{t('album.empty.body')}</small>
        </button>
      ) : (
        <div className="album__grid stagger">
          {memories.map((m, i) => (
            <AlbumTile
              key={m.id}
              index={i}
              photoId={m.photoId}
              caption={m.caption}
              onOpen={() => setOpenIndex(i)}
            />
          ))}
          <button
            className={clsx('album__add', busy && 'is-busy')}
            onClick={() => inputRef.current?.click()}
            aria-label={t('album.addAria')}
          >
            <Icon name="plus" size={20} strokeWidth={2.4} />
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => void handleFiles(e.target.files)}
      />

      {openIndex != null ? (
        <MemoryViewer
          trip={trip}
          memories={memories}
          index={Math.min(openIndex, memories.length - 1)}
          onIndexChange={setOpenIndex}
          onClose={() => setOpenIndex(null)}
        />
      ) : null}
    </section>
  )
}
