import { useEffect, useRef, type ReactNode } from 'react'
import { Icon } from './Icon'
import { usePhoto } from '../state/photos'

interface LightboxProps {
  photoIds: string[]
  index: number
  onIndexChange: (index: number) => void
  onClose: () => void
  /** 写真の下に出す説明や操作ボタン */
  children?: ReactNode
}

export function Lightbox({ photoIds, index, onIndexChange, onClose, children }: LightboxProps) {
  const url = usePhoto(photoIds[index] ?? null)
  const touchX = useRef<number | null>(null)

  const go = (delta: number) => {
    const next = index + delta
    if (next >= 0 && next < photoIds.length) onIndexChange(next)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'ArrowRight') go(1)
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  })

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="写真を表示"
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX
      }}
      onTouchEnd={(e) => {
        if (touchX.current == null) return
        const dx = e.changedTouches[0].clientX - touchX.current
        if (Math.abs(dx) > 55) go(dx < 0 ? 1 : -1)
        touchX.current = null
      }}
    >
      <div className="lightbox__bar">
        <span className="lightbox__count num">
          {index + 1} / {photoIds.length}
        </span>
        <button className="lightbox__icon" onClick={onClose} aria-label="閉じる">
          <Icon name="close" size={20} strokeWidth={2.2} />
        </button>
      </div>

      <div
        className="lightbox__stage"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        {index > 0 ? (
          <button className="lightbox__nav lightbox__nav--prev" onClick={() => go(-1)} aria-label="前の写真">
            <Icon name="left" size={22} strokeWidth={2.2} />
          </button>
        ) : null}
        {url ? <img src={url} alt="" className="lightbox__img" /> : <div className="spinner" />}
        {index < photoIds.length - 1 ? (
          <button className="lightbox__nav lightbox__nav--next" onClick={() => go(1)} aria-label="次の写真">
            <Icon name="right" size={22} strokeWidth={2.2} />
          </button>
        ) : null}
      </div>

      {children ? <div className="lightbox__foot">{children}</div> : null}
    </div>
  )
}
