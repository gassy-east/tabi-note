import { Sheet } from './Sheet'
import { Icon } from './Icon'
import { toast } from './Toast'
import { LANGS, getLang, setLang, useT, type Lang } from '../i18n'

export function LanguageSheet({ onClose }: { onClose: () => void }) {
  const t = useT()
  const current = getLang()

  function pick(lang: Lang) {
    setLang(lang)
    toast(t('lang.changed'))
    onClose()
  }

  return (
    <Sheet title={t('lang.title')} onClose={onClose}>
      <p className="tiny muted" style={{ marginBottom: 14 }}>
        {t('lang.lead')}
      </p>
      <div className="menu" style={{ padding: 0, paddingBottom: 8 }}>
        {LANGS.map((l) => (
          <button
            key={l.id}
            className="menu__item"
            onClick={() => pick(l.id)}
            aria-current={l.id === current ? 'true' : undefined}
          >
            <span
              className="menu__icon"
              style={
                l.id === current
                  ? { background: 'var(--coral-soft)', color: 'var(--coral-deep)' }
                  : undefined
              }
            >
              <Icon name={l.id === current ? 'check' : 'compass'} size={18} strokeWidth={2.2} />
            </span>
            <span>
              {l.label}
              <small>{l.note}</small>
            </span>
          </button>
        ))}
      </div>
    </Sheet>
  )
}
