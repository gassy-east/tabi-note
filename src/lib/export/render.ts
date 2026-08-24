import type { Trip } from '../../types'
import { downloadDataUrl } from '../image'
import {
  A4_H,
  A4_W,
  buildDayPoster,
  buildMemoriesPoster,
  buildShioriPages,
  buildTripPoster,
  createRoot,
  preloadTripPhotos,
  readyForCapture,
} from './shiori'

function safeName(value: string): string {
  const cleaned = value.replace(/[\\/:*?"<>|\n\r\t]/g, '').trim()
  return cleaned.slice(0, 40) || '旅のしおり'
}

async function capture(node: HTMLElement, scale: number): Promise<HTMLCanvasElement> {
  const { default: html2canvas } = await import('html2canvas-pro')
  return html2canvas(node, {
    scale,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
    width: node.offsetWidth,
    height: node.offsetHeight,
    windowWidth: node.offsetWidth,
    windowHeight: node.offsetHeight,
  })
}

/** しおりを PDF（A4 縦・複数ページ）で書き出す */
export async function exportTripPdf(
  trip: Trip,
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  await preloadTripPhotos(trip)
  const root = createRoot()
  try {
    const pages = buildShioriPages(trip, root)
    await readyForCapture(root)

    const { jsPDF } = await import('jspdf')
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true })

    for (let i = 0; i < pages.length; i++) {
      onProgress?.(i, pages.length)
      const canvas = await capture(pages[i], 2)
      const data = canvas.toDataURL('image/jpeg', 0.92)
      if (i > 0) pdf.addPage()
      pdf.addImage(data, 'JPEG', 0, 0, 210, 297, undefined, 'FAST')
    }
    onProgress?.(pages.length, pages.length)
    pdf.save(`${safeName(trip.title)}-しおり.pdf`)
  } finally {
    root.remove()
  }
}

/** 1 日ぶんの予定を PNG で書き出す */
export async function exportDayPng(trip: Trip, dayIndex: number): Promise<void> {
  const day = trip.days[dayIndex]
  if (!day) return
  await preloadTripPhotos(trip)
  const root = createRoot()
  try {
    const poster = buildDayPoster(trip, day, dayIndex, root)
    await readyForCapture(root)
    const canvas = await capture(poster, 1.5)
    downloadDataUrl(
      canvas.toDataURL('image/png'),
      `${safeName(trip.title)}-day${dayIndex + 1}.png`,
    )
  } finally {
    root.remove()
  }
}

/** 旅全体の概要を PNG で書き出す */
export async function exportTripPng(trip: Trip): Promise<void> {
  await preloadTripPhotos(trip)
  const root = createRoot()
  try {
    const poster = buildTripPoster(trip, root)
    await readyForCapture(root)
    const canvas = await capture(poster, 1.5)
    downloadDataUrl(canvas.toDataURL('image/png'), `${safeName(trip.title)}-まとめ.png`)
  } finally {
    root.remove()
  }
}

/** 思い出アルバムを PNG で書き出す */
export async function exportMemoriesPng(trip: Trip): Promise<void> {
  await preloadTripPhotos(trip)
  const root = createRoot()
  try {
    const poster = buildMemoriesPoster(trip, root)
    await readyForCapture(root)
    const canvas = await capture(poster, 1.3)
    downloadDataUrl(canvas.toDataURL('image/png'), `${safeName(trip.title)}-思い出.png`)
  } finally {
    root.remove()
  }
}

/** 表紙 1 枚だけの PNG（SNS 共有向け） */
export async function exportCoverPng(trip: Trip): Promise<void> {
  await preloadTripPhotos(trip)
  const root = createRoot()
  try {
    const pages = buildShioriPages(trip, root)
    await readyForCapture(root)
    const canvas = await capture(pages[0], 2)
    downloadDataUrl(canvas.toDataURL('image/png'), `${safeName(trip.title)}-表紙.png`)
  } finally {
    root.remove()
  }
}

export const PAGE_SIZE = { width: A4_W, height: A4_H }
