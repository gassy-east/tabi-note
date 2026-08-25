import { useState } from 'react'
import { Sheet } from './Sheet'
import { Icon } from './Icon'
import { BusyVeil } from './BusyVeil'
import { toast } from './Toast'
import {
  exportCoverPng,
  exportDayPng,
  exportMemoriesPng,
  exportTripPdf,
  exportTripPng,
} from '../lib/export/render'
import { formatDate } from '../lib/date'
import { useT } from '../i18n'
import type { Trip } from '../types'

interface ExportSheetProps {
  trip: Trip
  dayIndex: number
  onClose: () => void
}

export function ExportSheet({ trip, dayIndex, onClose }: ExportSheetProps) {
  const t = useT()
  const [busy, setBusy] = useState<string | null>(null)
  const day = trip.days[dayIndex]

  async function run(label: string, task: () => Promise<void>) {
    setBusy(label)
    try {
      await task()
      toast(t('export.done'))
      onClose()
    } catch {
      toast(t('export.failed'), 'error')
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <Sheet title={t('export.title')} onClose={onClose}>
        <p className="tiny muted" style={{ marginBottom: 14 }}>
          {t('export.lead')}
        </p>

        <div className="menu" style={{ padding: 0 }}>
          <button
            className="menu__item"
            disabled={busy !== null}
            onClick={() =>
              void run(t('export.building'), () =>
                exportTripPdf(trip, (done, total) =>
                  setBusy(t('export.buildingN', { done, total })),
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
              {t('export.pdf')}
              <small>
                {t('export.pdfSub')}
                {trip.memories.length > 0 ? t('export.pdfSubMemories') : ''}
              </small>
            </span>
            <Icon name="download" size={17} />
          </button>

          <button
            className="menu__item"
            disabled={busy !== null || !day}
            onClick={() => void run(t('export.makingImage'), () => exportDayPng(trip, dayIndex))}
          >
            <span className="menu__icon" style={{ background: 'var(--teal-soft)', color: 'var(--teal)' }}>
              <Icon name="image" size={19} />
            </span>
            <span>
              {t('export.dayPng')}
              <small>
                {t('export.dayPngSub', {
                  n: dayIndex + 1,
                  date: day ? `・${formatDate(day.date)}` : '',
                })}
              </small>
            </span>
            <Icon name="download" size={17} />
          </button>

          <button
            className="menu__item"
            disabled={busy !== null}
            onClick={() => void run(t('export.makingImage'), () => exportTripPng(trip))}
          >
            <span
              className="menu__icon"
              style={{ background: 'var(--indigo-soft)', color: 'var(--indigo)' }}
            >
              <Icon name="route" size={19} />
            </span>
            <span>
              {t('export.tripPng')}
              <small>{t('export.tripPngSub')}</small>
            </span>
            <Icon name="download" size={17} />
          </button>

          {trip.memories.length > 0 ? (
            <button
              className="menu__item"
              disabled={busy !== null}
              onClick={() => void run(t('export.makingAlbum'), () => exportMemoriesPng(trip))}
            >
              <span className="menu__icon" style={{ background: 'var(--sky-soft)', color: 'var(--sky)' }}>
                <Icon name="camera" size={19} />
              </span>
              <span>
                {t('export.memoriesPng')}
                <small>{t('export.memoriesPngSub', { n: trip.memories.length })}</small>
              </span>
              <Icon name="download" size={17} />
            </button>
          ) : null}

          <button
            className="menu__item"
            disabled={busy !== null}
            onClick={() => void run(t('export.makingImage'), () => exportCoverPng(trip))}
          >
            <span className="menu__icon" style={{ background: 'var(--gold-soft)', color: 'var(--gold-ink)' }}>
              <Icon name="sparkle" size={19} />
            </span>
            <span>
              {t('export.coverPng')}
              <small>{t('export.coverPngSub')}</small>
            </span>
            <Icon name="download" size={17} />
          </button>
        </div>

        <p className="tiny muted" style={{ marginTop: 16, paddingBottom: 8 }}>
          {t('export.note')}
        </p>
      </Sheet>
      {busy ? <BusyVeil message={busy} /> : null}
    </>
  )
}
