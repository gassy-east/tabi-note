import { useEffect, type ReactNode } from 'react'
import { Icon } from './Icon'
import { useT } from '../i18n'

interface SheetProps {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  headerRight?: ReactNode
}

let openCount = 0

export function Sheet({ title, onClose, children, footer, headerRight }: SheetProps) {
  const t = useT()
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    openCount += 1
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      openCount -= 1
      if (openCount === 0) document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <div
      className="scrim"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet__grab" />
        <div className="sheet__head">
          <h2 className="sheet__title">{title}</h2>
          {headerRight}
          <button className="iconbtn iconbtn--plain" onClick={onClose} aria-label={t('common.close')}>
            <Icon name="close" size={19} strokeWidth={2.1} />
          </button>
        </div>
        <div className="sheet__body">{children}</div>
        {footer ? <div className="sheet__foot">{footer}</div> : null}
      </div>
    </div>
  )
}

interface ConfirmProps {
  title: string
  message: string
  confirmLabel: string
  danger?: boolean
  onConfirm: () => void
  onClose: () => void
}

export function Confirm({
  title,
  message,
  confirmLabel,
  danger,
  onConfirm,
  onClose,
}: ConfirmProps) {
  const t = useT()
  return (
    <Sheet
      title={title}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn--soft" onClick={onClose}>
            {t('detail.confirm.cancel')}
          </button>
          <button
            className={danger ? 'btn btn--danger' : 'btn btn--primary'}
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p style={{ fontSize: 14, color: 'var(--ink-2)', whiteSpace: 'pre-wrap', paddingBottom: 8 }}>
        {message}
      </p>
    </Sheet>
  )
}
