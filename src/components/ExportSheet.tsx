import { useState } from 'react'
import { Sheet } from './Sheet'
import { Icon } from './Icon'
import { BusyVeil } from './BusyVeil'
import { toast } from './Toast'
import { exportCoverPng, exportDayPng, exportTripPdf, exportTripPng } from '../lib/export/render'
import { formatJp } from '../lib/date'
import type { Trip } from '../types'

interface ExportSheetProps {
  trip: Trip
  dayIndex: number
  onClose: () => void
}

export function ExportSheet({ trip, dayIndex, onClose }: ExportSheetProps) {
  const [busy, setBusy] = useState<string | null>(null)
  const day = trip.days[dayIndex]

  async function run(label: string, task: () => Promise<void>) {
    setBusy(label)
    try {
      await task()
      toast('ダウンロードしました')
      onClose()
    } catch {
      toast('書き出しに失敗しました', 'error')
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <Sheet title="ファイルに書き出す" onClose={onClose}>
        <p className="tiny muted" style={{ marginBottom: 14 }}>
          いま作っている旅程を、そのままファイルとして保存できます。写真とメモも一緒に入ります。
        </p>

        <div className="menu" style={{ padding: 0 }}>
          <button
            className="menu__item"
            disabled={busy !== null}
            onClick={() =>
              void run('しおりを組み立てています…', () =>
                exportTripPdf(trip, (done, total) =>
                  setBusy(`しおりを組み立てています… ${done}/${total}`),
                ),
              )
            }
          >
            <span
              className="menu__icon"
              style={{ background: 'var(--coral-soft)', color: 'var(--coral-deep)' }}
            >
              <Icon name="book" size={19} />
            </span>
            <span>
              旅のしおり（PDF）
              <small>表紙 ＋ 日ごとのページ ＋ 持ち物・費用のまとめ</small>
            </span>
            <Icon name="download" size={17} />
          </button>

          <button
            className="menu__item"
            disabled={busy !== null || !day}
            onClick={() =>
              void run('画像を作っています…', () => exportDayPng(trip, dayIndex))
            }
          >
            <span className="menu__icon" style={{ background: 'var(--teal-soft)', color: 'var(--teal)' }}>
              <Icon name="image" size={19} />
            </span>
            <span>
              この日の予定（PNG）
              <small>
                DAY {dayIndex + 1}
                {day ? `・${formatJp(day.date)}` : ''} を縦長の画像で
              </small>
            </span>
            <Icon name="download" size={17} />
          </button>

          <button
            className="menu__item"
            disabled={busy !== null}
            onClick={() => void run('画像を作っています…', () => exportTripPng(trip))}
          >
            <span
              className="menu__icon"
              style={{ background: 'var(--indigo-soft)', color: 'var(--indigo)' }}
            >
              <Icon name="route" size={19} />
            </span>
            <span>
              旅のまとめ（PNG）
              <small>全日程をひと目で見られる 1 枚。共有向き</small>
            </span>
            <Icon name="download" size={17} />
          </button>

          <button
            className="menu__item"
            disabled={busy !== null}
            onClick={() => void run('画像を作っています…', () => exportCoverPng(trip))}
          >
            <span className="menu__icon" style={{ background: 'var(--gold-soft)', color: '#b8801a' }}>
              <Icon name="sparkle" size={19} />
            </span>
            <span>
              表紙だけ（PNG）
              <small>しおりの表紙を壁紙やアイコンに</small>
            </span>
            <Icon name="download" size={17} />
          </button>
        </div>

        <p className="tiny muted" style={{ marginTop: 16, paddingBottom: 8 }}>
          スマホでは、ダウンロードしたファイルが「ファイル」アプリや通知欄から開けます。
        </p>
      </Sheet>
      {busy ? <BusyVeil message={busy} /> : null}
    </>
  )
}
