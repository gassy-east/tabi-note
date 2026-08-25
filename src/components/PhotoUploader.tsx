import { useRef, useState } from 'react'
import { Icon } from './Icon'
import { deletePhoto, savePhotos, usePhoto } from '../state/photos'
import { toast } from './Toast'
import { useT } from '../i18n'

function Tile({ id, onRemove }: { id: string; onRemove: () => void }) {
  const t = useT()
  const url = usePhoto(id)
  return (
    <div className="uploader__tile">
      {url ? <img src={url} alt="" /> : null}
      <button className="uploader__remove" onClick={onRemove} aria-label={t('photo.removeAria')}>
        <Icon name="close" size={13} strokeWidth={2.6} />
      </button>
    </div>
  )
}

interface PhotoUploaderProps {
  photoIds: string[]
  onChange: (ids: string[]) => void
  max?: number
}

export function PhotoUploader({ photoIds, onChange, max = 8 }: PhotoUploaderProps) {
  const t = useT()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    const room = max - photoIds.length
    if (room <= 0) {
      toast(t('photo.max', { n: max }), 'error')
      return
    }
    setBusy(true)
    try {
      const ids = await savePhotos(Array.from(fileList).slice(0, room))
      if (ids.length > 0) onChange([...photoIds, ...ids])
    } catch {
      toast(t('photo.failed'), 'error')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <>
      <div className="uploader">
        {photoIds.map((id) => (
          <Tile
            key={id}
            id={id}
            onRemove={() => {
              onChange(photoIds.filter((p) => p !== id))
              void deletePhoto(id)
            }}
          />
        ))}
        {photoIds.length < max ? (
          <button
            type="button"
            className={busy ? 'uploader__add is-busy' : 'uploader__add'}
            onClick={() => inputRef.current?.click()}
          >
            <Icon name={busy ? 'sparkle' : 'image'} size={20} />
            <span>{busy ? t('common.processing') : t('photo.add')}</span>
          </button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => void handleFiles(e.target.files)}
      />
    </>
  )
}

interface CoverPickerProps {
  photoId: string | null
  onChange: (id: string | null) => void
}

export function CoverPicker({ photoId, onChange }: CoverPickerProps) {
  const t = useT()
  const inputRef = useRef<HTMLInputElement>(null)
  const url = usePhoto(photoId)
  const [busy, setBusy] = useState(false)

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    setBusy(true)
    try {
      const ids = await savePhotos([fileList[0]])
      if (ids[0]) onChange(ids[0])
    } catch {
      toast(t('photo.failed'), 'error')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <>
      {url ? (
        <div
          className="uploader__tile"
          style={{ aspectRatio: '16 / 9', borderRadius: 16, marginBottom: 8 }}
        >
          <img src={url} alt="" />
          <button className="uploader__remove" onClick={() => onChange(null)} aria-label={t('photo.removeCover')}>
            <Icon name="close" size={13} strokeWidth={2.6} />
          </button>
        </div>
      ) : null}
      <button
        type="button"
        className="btn btn--soft btn--sm"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        <Icon name="image" size={16} />
        {busy ? t('common.processing') : url ? t('photo.changeCover') : t('photo.pickCover')}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => void handleFiles(e.target.files)}
      />
    </>
  )
}
