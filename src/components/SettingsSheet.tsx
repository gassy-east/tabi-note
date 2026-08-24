import { useEffect, useRef, useState } from 'react'
import { Sheet } from './Sheet'
import { Icon } from './Icon'
import { toast } from './Toast'
import { useStore } from '../state/store'
import { usePackingTemplate } from '../state/settings'
import { PackingTemplateSheet } from './PackingTemplateSheet'
import { exportBackup, importBackup } from '../lib/backup'
import { estimateUsage } from '../lib/db'

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

export function SettingsSheet({ onClose }: { onClose: () => void }) {
  const { trips } = useStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [usage, setUsage] = useState<{ usage: number; quota: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const [template, setTemplate] = useState(false)
  const packingTemplate = usePackingTemplate()

  useEffect(() => {
    void estimateUsage().then(setUsage)
  }, [])

  async function handleExport() {
    if (trips.length === 0) {
      toast('書き出す旅がありません', 'error')
      return
    }
    setBusy(true)
    try {
      await exportBackup(trips)
      toast('バックアップを書き出しました')
    } catch {
      toast('書き出しに失敗しました', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function handleImport(file: File | undefined) {
    if (!file) return
    setBusy(true)
    try {
      const count = await importBackup(file)
      toast(`${count}件の旅を読み込みました`)
    } catch (e) {
      toast(e instanceof Error ? e.message : '読み込みに失敗しました', 'error')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <>
    <Sheet title="設定とバックアップ" onClose={onClose}>
      <div className="menu" style={{ padding: 0, marginBottom: 18 }}>
        <button className="menu__item" onClick={() => setTemplate(true)}>
          <span
            className="menu__icon"
            style={{ background: 'var(--coral-soft)', color: 'var(--coral-deep)' }}
          >
            <Icon name="suitcase" size={19} />
          </span>
          <span>
            持ち物テンプレートを編集
            <small>新しい旅の初期リスト（現在 {packingTemplate.length} 項目）</small>
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
          データはこの端末の中だけに保存されます
        </div>
        <p className="tiny" style={{ marginTop: 5, color: 'var(--ink-2)' }}>
          サーバーには何も送信されません。そのぶん、ブラウザの履歴やサイトデータを消すと旅の記録も消えます。
          大切な旅は、ときどきバックアップを書き出しておくと安心です。
        </p>
      </div>

      <div className="menu" style={{ padding: 0 }}>
        <button className="menu__item" onClick={() => void handleExport()} disabled={busy}>
          <span className="menu__icon">
            <Icon name="download" size={19} />
          </span>
          <span>
            バックアップを書き出す
            <small>写真も含めた JSON ファイル（{trips.length}件）</small>
          </span>
        </button>
        <button className="menu__item" onClick={() => fileRef.current?.click()} disabled={busy}>
          <span className="menu__icon">
            <Icon name="upload" size={19} />
          </span>
          <span>
            バックアップを読み込む
            <small>別の端末やブラウザの記録を取り込む</small>
          </span>
        </button>
      </div>

      <div className="divider-dash" style={{ margin: '16px 0' }} />

      <div className="tiny muted" style={{ lineHeight: 2 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span>保存した旅</span>
          <b className="num">{trips.length} 件</b>
        </div>
        {usage ? (
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span>使用中の容量</span>
            <b className="num">
              {formatBytes(usage.usage)}
              {usage.quota ? ` / ${formatBytes(usage.quota)}` : ''}
            </b>
          </div>
        ) : null}
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span>バージョン</span>
          <b className="num">1.0.0</b>
        </div>
      </div>

      <p className="tiny muted" style={{ marginTop: 14, paddingBottom: 10 }}>
        スマホのブラウザメニューから「ホーム画面に追加」すると、アプリのように全画面で開けます。
      </p>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => void handleImport(e.target.files?.[0])}
      />
    </Sheet>
    {template ? <PackingTemplateSheet onClose={() => setTemplate(false)} /> : null}
    </>
  )
}
