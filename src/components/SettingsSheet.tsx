import { useEffect, useRef, useState } from 'react'
import { Sheet } from './Sheet'
import { Icon } from './Icon'
import { toast } from './Toast'
import { useStore } from '../state/store'
import { useTemplate, type TemplateKind } from '../state/settings'
import { ChecklistTemplateSheet } from './ChecklistTemplateSheet'
import { LanguageSheet } from './LanguageSheet'
import { exportBackup, importBackup } from '../lib/backup'
import { estimateUsage } from '../lib/db'
import { LANGS, getLang, useT } from '../i18n'

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

export function SettingsSheet({ onClose }: { onClose: () => void }) {
  const t = useT()
  const { trips } = useStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [usage, setUsage] = useState<{ usage: number; quota: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const [template, setTemplate] = useState<TemplateKind | null>(null)
  const [language, setLanguage] = useState(false)
  const packingTemplate = useTemplate('packing')
  const todoTemplate = useTemplate('todo')
  const langLabel = LANGS.find((l) => l.id === getLang())?.label ?? ''

  useEffect(() => {
    void estimateUsage().then(setUsage)
  }, [])

  async function handleExport() {
    if (trips.length === 0) {
      toast(t('settings.noTrips'), 'error')
      return
    }
    setBusy(true)
    try {
      await exportBackup(trips)
      toast(t('settings.backupDone'))
    } catch {
      toast(t('settings.backupFailed'), 'error')
    } finally {
      setBusy(false)
    }
  }

  async function handleImport(file: File | undefined) {
    if (!file) return
    setBusy(true)
    try {
      const count = await importBackup(file)
      toast(t('settings.importDone', { n: count }))
    } catch (e) {
      toast(e instanceof Error ? e.message : t('settings.importFailed'), 'error')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <>
      <Sheet title={t('settings.title')} onClose={onClose}>
        <div className="menu" style={{ padding: 0, marginBottom: 18 }}>
          <button className="menu__item" onClick={() => setLanguage(true)}>
            <span className="menu__icon" style={{ background: '#e3f1f7', color: '#2f7fa8' }}>
              <Icon name="compass" size={19} />
            </span>
            <span>
              {t('common.language')}
              <small>{langLabel}</small>
            </span>
            <Icon name="right" size={17} />
          </button>
          <button className="menu__item" onClick={() => setTemplate('todo')}>
            <span
              className="menu__icon"
              style={{ background: 'var(--indigo-soft)', color: 'var(--indigo)' }}
            >
              <Icon name="check" size={19} />
            </span>
            <span>
              {t('settings.todoTemplate')}
              <small>{t('settings.todoTemplateSub', { n: todoTemplate.length })}</small>
            </span>
            <Icon name="right" size={17} />
          </button>
          <button className="menu__item" onClick={() => setTemplate('packing')}>
            <span
              className="menu__icon"
              style={{ background: 'var(--coral-soft)', color: 'var(--coral-deep)' }}
            >
              <Icon name="suitcase" size={19} />
            </span>
            <span>
              {t('settings.packTemplate')}
              <small>{t('settings.packTemplateSub', { n: packingTemplate.length })}</small>
            </span>
            <Icon name="right" size={17} />
          </button>
        </div>

        <div
          style={{
            padding: '14px 16px',
            borderRadius: 16,
            background: 'var(--gold-soft)',
            border: '1px solid #f2e0b8',
            marginBottom: 18,
          }}
        >
          <div className="row" style={{ gap: 8, fontWeight: 800, fontSize: 13.5 }}>
            <Icon name="sparkle" size={16} />
            {t('settings.privacy')}
          </div>
          <p className="tiny" style={{ marginTop: 5, color: 'var(--ink-2)' }}>
            {t('settings.privacyBody')}
          </p>
        </div>

        <div className="menu" style={{ padding: 0 }}>
          <button className="menu__item" onClick={() => void handleExport()} disabled={busy}>
            <span className="menu__icon">
              <Icon name="download" size={19} />
            </span>
            <span>
              {t('settings.exportBackup')}
              <small>{t('settings.exportBackupSub', { n: trips.length })}</small>
            </span>
          </button>
          <button className="menu__item" onClick={() => fileRef.current?.click()} disabled={busy}>
            <span className="menu__icon">
              <Icon name="upload" size={19} />
            </span>
            <span>
              {t('settings.importBackup')}
              <small>{t('settings.importBackupSub')}</small>
            </span>
          </button>
        </div>

        <div className="divider-dash" style={{ margin: '16px 0' }} />

        <div className="tiny muted" style={{ lineHeight: 2 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span>{t('settings.tripCount')}</span>
            <b className="num">{t('settings.tripCountUnit', { n: trips.length })}</b>
          </div>
          {usage ? (
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span>{t('settings.usage')}</span>
              <b className="num">
                {formatBytes(usage.usage)}
                {usage.quota ? ` / ${formatBytes(usage.quota)}` : ''}
              </b>
            </div>
          ) : null}
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span>{t('settings.version')}</span>
            <b className="num">1.2.0</b>
          </div>
        </div>

        <p className="tiny muted" style={{ marginTop: 14, paddingBottom: 10 }}>
          {t('settings.pwa')}
        </p>

        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => void handleImport(e.target.files?.[0])}
        />
      </Sheet>
      {template ? (
        <ChecklistTemplateSheet kind={template} onClose={() => setTemplate(null)} />
      ) : null}
      {language ? <LanguageSheet onClose={() => setLanguage(false)} /> : null}
    </>
  )
}
