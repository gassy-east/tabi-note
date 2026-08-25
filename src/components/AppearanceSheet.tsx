import { Sheet } from './Sheet'
import { Icon } from './Icon'
import { toast } from './Toast'
import { SKINS, setSkin, useSkin, type Skin } from '../state/appearance'
import { useT, type MessageKey } from '../i18n'

const NAME_KEY: Record<Skin, MessageKey> = {
  auto: 'skin.auto',
  default: 'skin.default',
  dark: 'skin.dark',
  modern: 'skin.modern',
  pop: 'skin.pop',
  natural: 'skin.natural',
}

const NOTE_KEY: Record<Skin, MessageKey> = {
  auto: 'skin.autoSub',
  default: 'skin.defaultSub',
  dark: 'skin.darkSub',
  modern: 'skin.modernSub',
  pop: 'skin.popSub',
  natural: 'skin.naturalSub',
}

export function AppearanceSheet({ onClose }: { onClose: () => void }) {
  const t = useT()
  const current = useSkin()

  return (
    <Sheet title={t('skin.title')} onClose={onClose}>
      <p className="tiny muted" style={{ marginBottom: 14 }}>
        {t('skin.lead')}
      </p>

      <div className="skinpick">
        {SKINS.map((s) => {
          const active = s.id === current
          return (
            <button
              key={s.id}
              className={active ? 'skincard is-active' : 'skincard'}
              onClick={() => {
                setSkin(s.id)
                toast(t('skin.changed'))
              }}
              aria-current={active ? 'true' : undefined}
            >
              <span
                className="skincard__preview"
                style={
                  s.id === 'auto'
                    ? {
                        background: `linear-gradient(115deg, ${s.swatch.paper} 0 50%, ${s.swatch.card} 50% 100%)`,
                      }
                    : { background: s.swatch.paper }
                }
              >
                <span className="skincard__dot" style={{ background: s.swatch.accent }} />
                <span className="skincard__bar" style={{ background: s.swatch.ink }} />
                <span className="skincard__chip" style={{ background: s.swatch.card }} />
                <span
                  className="skincard__chip"
                  style={{ background: s.swatch.accent, flex: '0 0 22px' }}
                />
              </span>
              {active ? (
                <span className="skincard__check">
                  <Icon name="check" size={13} strokeWidth={3} />
                </span>
              ) : null}
              <b className="skincard__name">{t(NAME_KEY[s.id])}</b>
              <small className="skincard__note">{t(NOTE_KEY[s.id])}</small>
            </button>
          )
        })}
      </div>
    </Sheet>
  )
}
