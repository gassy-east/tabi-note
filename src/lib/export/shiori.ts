import type { Activity, Day, Memory, Trip } from '../../types'
import { category, categoryLabel, theme } from '../catalog'
import { formatDate, formatDot, nightsBetween, rangeLabel, shiftTime, weekday } from '../date'
import { t } from '../../i18n'
import { yen } from '../util'
import { loadPhotos, peekPhoto } from '../../state/photos'
import { collectPhotoIds } from '../../state/store'

export const A4_W = 794
export const A4_H = 1123

const DAY_HEADER_H = 104
const PAGE_PAD = 44
const FOOTER_H = 46
const BODY_MAX = A4_H - DAY_HEADER_H - PAGE_PAD - FOOTER_H

export function esc(value: string): string {
  return value.replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;',
  )
}

const STYLE_ID = 'tabinote-export-style'

const CSS = `
.sh-root { position: fixed; left: -20000px; top: 0; z-index: -1; }
.sh-root * { box-sizing: border-box; margin: 0; padding: 0; }
.sh-page {
  width: ${A4_W}px; height: ${A4_H}px; position: relative; overflow: hidden;
  background: #ffffff; color: #16181d;
  font-family: 'Zen Kaku Gothic New', system-ui, sans-serif; line-height: 1.6;
}
/* tabular-nums は html2canvas の文字幅計算とずれて右端がはみ出すため使わない */
.sh-num { font-family: 'Outfit', sans-serif; }
.sh-serif { font-family: 'Fraunces', Georgia, serif; }

/* ---- 表紙 ---- */
.sh-cover-bg { position: absolute; inset: 0; }
.sh-cover-bg img { width: 100%; height: 100%; object-fit: cover; }
.sh-cover-veil { position: absolute; inset: 0; }
.sh-cover-in {
  position: absolute; inset: 0; padding: 64px 62px;
  display: flex; flex-direction: column; color: #ffffff;
}
.sh-cover-frame { position: absolute; inset: 30px; border: 1px solid rgba(255,255,255,0.34); border-radius: 18px; }
.sh-eyebrow { font-size: 12px; letter-spacing: 0.42em; font-weight: 700; text-transform: uppercase; }
.sh-cover-title { font-size: 52px; font-weight: 900; line-height: 1.2; letter-spacing: -0.01em; }
.sh-cover-dest { font-size: 17px; font-weight: 700; letter-spacing: 0.06em; }
.sh-cover-dates { font-size: 19px; font-weight: 600; letter-spacing: 0.04em; }
.sh-cover-rule { height: 0; border-top: 1px dashed rgba(255,255,255,0.65); }
.sh-cover-facts { display: flex; gap: 34px; }
.sh-fact-k { font-size: 10.5px; letter-spacing: 0.24em; font-weight: 700; opacity: 0.8; }
.sh-fact-v { font-size: 23px; font-weight: 700; margin-top: 2px; }
.sh-stamp {
  position: absolute; right: 58px; top: 54px; width: 108px; height: 108px; border-radius: 50%;
  border: 2px dashed rgba(255,255,255,0.7); display: flex; flex-direction: column;
  align-items: center; justify-content: center; color: #ffffff; transform: rotate(-11deg);
}
.sh-stamp b { font-size: 30px; font-weight: 700; line-height: 1; }
.sh-stamp span { font-size: 9px; letter-spacing: 0.2em; font-weight: 700; margin-top: 4px; opacity: 0.9; }

/* ---- 日ページ ---- */
.sh-dayhead { height: ${DAY_HEADER_H}px; padding: 0 ${PAGE_PAD}px; display: flex; align-items: center; gap: 20px; color: #ffffff; }
.sh-dayno { display: flex; flex-direction: column; line-height: 1; }
.sh-dayno span { font-size: 10px; letter-spacing: 0.26em; font-weight: 700; opacity: 0.85; }
.sh-dayno b { font-size: 42px; font-weight: 700; margin-top: 2px; }
.sh-daybar { width: 1px; height: 52px; background: rgba(255,255,255,0.45); }
.sh-daymeta { flex: 1; min-width: 0; }
.sh-daydate { font-size: 13px; font-weight: 700; letter-spacing: 0.1em; opacity: 0.9; }
.sh-daytitle { font-size: 22px; font-weight: 800; margin-top: 2px; }
.sh-body { height: ${BODY_MAX}px; overflow: hidden; padding: 26px ${PAGE_PAD}px 0; }
.sh-daymemo {
  font-size: 12.5px; color: #4a5364; background: #faf6ef; border-left: 3px solid #e7ded0;
  padding: 9px 13px; border-radius: 0 10px 10px 0; margin-bottom: 16px; white-space: pre-wrap;
}
.sh-item { display: flex; gap: 14px; margin-bottom: 13px; }
.sh-time { width: 62px; flex: none; padding-top: 12px; text-align: right; }
.sh-time b { font-size: 14.5px; font-weight: 700; color: #16181d; letter-spacing: 0.02em; }
.sh-time i { display: block; font-size: 11px; font-style: normal; color: #98a1ae; margin-top: 1px; }
.sh-time i.sh-hometime { font-size: 9.5px; color: #4b5bd6; margin-top: 3px; font-weight: 700; }
.sh-card {
  flex: 1; min-width: 0; position: relative; border: 1px solid #eee7db; border-radius: 14px;
  padding: 12px 15px 13px 17px; background: #ffffff; overflow: hidden;
}
.sh-stripe { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; }
.sh-tag { display: inline-block; font-size: 10.5px; font-weight: 800; letter-spacing: 0.06em; padding: 2px 9px; border-radius: 20px; }
.sh-title { font-size: 16px; font-weight: 800; margin-top: 6px; line-height: 1.4; }
.sh-place { font-size: 12px; font-weight: 700; color: #12a08f; margin-top: 3px; }
.sh-memo { font-size: 12px; color: #3d4552; margin-top: 6px; white-space: pre-wrap; line-height: 1.65; }
.sh-metarow { margin-top: 8px; display: flex; gap: 8px; flex-wrap: wrap; }
.sh-chip { font-size: 11px; font-weight: 700; color: #6b7482; background: #f5f1e9; border-radius: 20px; padding: 2px 9px; }
.sh-photos { display: flex; gap: 7px; margin-top: 10px; }
.sh-photo { width: 168px; height: 116px; border-radius: 9px; overflow: hidden; background: #f0ebe2; flex: none; }
.sh-photo img { width: 100%; height: 100%; object-fit: cover; }
.sh-foot {
  position: absolute; left: ${PAGE_PAD}px; right: ${PAGE_PAD}px; bottom: 16px; height: 22px;
  display: flex; align-items: center; justify-content: space-between;
  font-size: 10.5px; color: #98a1ae; letter-spacing: 0.1em; font-weight: 600;
  border-top: 1px solid #f0e9dd; padding-top: 8px;
}
.sh-empty { font-size: 13px; color: #98a1ae; padding: 26px 0; text-align: center; border: 1px dashed #e7ded0; border-radius: 12px; }

/* ---- 日記 ---- */
.sh-diaryhead { display: flex; align-items: center; gap: 10px; margin: 20px 0 9px; }
.sh-diaryhead b { font-size: 12.5px; font-weight: 800; letter-spacing: 0.12em; color: #6b7482; }
.sh-diaryhead i { flex: 1; height: 0; border-top: 1px dashed #d8ccb7; }
.sh-diaryline {
  font-size: 12.5px; line-height: 2; color: #3d4552;
  padding: 0 0 0 14px; border-left: 2px solid #efe7d8; min-height: 12px;
}

/* ---- まとめページ ---- */
.sh-plainhead { padding: 46px ${PAGE_PAD}px 0; }
.sh-h2 { font-size: 24px; font-weight: 900; letter-spacing: 0.02em; }
.sh-h2 + .sh-rule { margin-top: 12px; }
.sh-rule { height: 0; border-top: 1px dashed #d8ccb7; }
.sh-flowbody {
  display: flex; flex-wrap: wrap; align-content: flex-start;
  gap: 0 26px; overflow: hidden; margin-top: 4px;
}
.sh-secthead {
  width: 100%; font-size: 15px; font-weight: 800; letter-spacing: 0.04em;
  color: #16181d; margin: 22px 0 4px;
}
.sh-secthead:first-child { margin-top: 6px; }
.sh-check {
  width: calc(50% - 13px);
  display: flex; align-items: flex-start; gap: 9px; padding: 7px 0;
  border-bottom: 1px dashed #f0e9dd;
}
.sh-check--wide { width: 100%; }
.sh-box { width: 15px; height: 15px; border: 1.6px solid #c9bda7; border-radius: 4px; flex: none; margin-top: 3px; }
.sh-check span { font-size: 13px; }
.sh-check em { font-style: normal; font-size: 10.5px; font-weight: 800; color: #98a1ae; margin-left: 6px; letter-spacing: 0.04em; }
.sh-costrow, .sh-total, .sh-note, .sh-diaryhead, .sh-diaryline { width: 100%; }
/* space-between は html2canvas がずらすことがあるので flex:1 で寄せる */
.sh-costrow { display: flex; align-items: baseline; padding: 9px 0; border-bottom: 1px dashed #f0e9dd; font-size: 13.5px; }
.sh-costrow span { flex: 1; min-width: 0; }
.sh-costrow b { font-size: 15px; font-weight: 700; text-align: right; }
.sh-total { display: flex; align-items: baseline; margin-top: 14px; padding: 14px 18px; border-radius: 12px; background: #faf6ef; }
.sh-total span { flex: 1; min-width: 0; font-size: 12px; font-weight: 800; letter-spacing: 0.14em; color: #6b7482; }
.sh-total b { font-size: 26px; font-weight: 700; text-align: right; }
.sh-note { font-size: 13px; color: #3d4552; white-space: pre-wrap; margin-top: 14px; line-height: 1.8; }

/* ---- 思い出アルバム ---- */
.sh-memgrid { display: flex; flex-wrap: wrap; gap: 18px; margin-top: 22px; }
.sh-mem { width: 334px; }
.sh-mem-img { width: 334px; height: 232px; border-radius: 12px; overflow: hidden; background: #f0ebe2; }
.sh-mem-img img { width: 100%; height: 100%; object-fit: cover; }
.sh-mem-cap { font-size: 12.5px; color: #3d4552; margin-top: 8px; line-height: 1.55; }
.sh-mem-day { font-size: 10px; font-weight: 800; letter-spacing: 0.12em; color: #98a1ae; margin-top: 4px; }
.sh-poster-mem { display: flex; flex-wrap: wrap; gap: 24px; }
.sh-poster-mem .sh-mem { width: 468px; }
.sh-poster-mem .sh-mem-img { width: 468px; height: 330px; border-radius: 20px; }
.sh-poster-mem .sh-mem-cap { font-size: 20px; margin-top: 13px; }
.sh-poster-mem .sh-mem-day { font-size: 15px; margin-top: 6px; }

/* ---- PNG ポスター ---- */
.sh-poster { width: 1080px; background: #fbf7f0; position: relative; overflow: hidden;
  font-family: 'Zen Kaku Gothic New', system-ui, sans-serif; color: #16181d; }
.sh-poster-head { padding: 54px 60px 46px; color: #ffffff; position: relative; }
.sh-poster-body { padding: 34px 60px 46px; }
.sh-poster-foot { padding: 0 60px 46px; display: flex; justify-content: space-between; align-items: center;
  font-size: 15px; color: #98a1ae; font-weight: 700; letter-spacing: 0.08em; }

/* ポスターでは 1080px 幅に合わせて各要素を大きくする */
.sh-poster-body .sh-item { gap: 22px; margin-bottom: 20px; }
.sh-poster-body .sh-time { width: 96px; padding-top: 18px; }
.sh-poster-body .sh-time b { font-size: 22px; }
.sh-poster-body .sh-time i { font-size: 16px; }
.sh-poster-body .sh-card { border-radius: 22px; padding: 18px 24px 20px 26px; }
.sh-poster-body .sh-stripe { width: 6px; }
.sh-poster-body .sh-tag { font-size: 16px; padding: 4px 14px; border-radius: 30px; }
.sh-poster-body .sh-title { font-size: 26px; margin-top: 10px; }
.sh-poster-body .sh-place { font-size: 18px; margin-top: 6px; }
.sh-poster-body .sh-memo { font-size: 18px; margin-top: 10px; }
.sh-poster-body .sh-chip { font-size: 16px; padding: 4px 14px; }
.sh-poster-body .sh-photos { gap: 12px; margin-top: 16px; }
.sh-poster-body .sh-photo { width: 288px; height: 200px; border-radius: 16px; }
.sh-poster-body .sh-empty { font-size: 22px; padding: 52px 0; border-radius: 20px; }
.sh-poster-body .sh-diaryhead { margin: 34px 0 14px; }
.sh-poster-body .sh-diaryhead b { font-size: 19px; }
.sh-poster-body .sh-diaryline { font-size: 19px; padding-left: 22px; border-left-width: 3px; }
`

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = CSS
  document.head.appendChild(style)
}

export function createRoot(): HTMLDivElement {
  ensureStyle()
  const root = document.createElement('div')
  root.className = 'sh-root'
  document.body.appendChild(root)
  return root
}

export async function readyForCapture(root: HTMLElement): Promise<void> {
  if (document.fonts?.ready) {
    try {
      await document.fonts.ready
    } catch {
      /* フォント待ちに失敗しても描画は続行する */
    }
  }
  const images = Array.from(root.querySelectorAll('img'))
  await Promise.all(
    images.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.onload = () => resolve()
            img.onerror = () => resolve()
          }),
    ),
  )
  // requestAnimationFrame はタブが非表示のとき止まるため、タイマーで待つ
  await new Promise((r) => setTimeout(r, 80))
}

/** 書き出しに必要な写真をすべてメモリに読み込む */
export async function preloadTripPhotos(trip: Trip): Promise<void> {
  await loadPhotos(collectPhotoIds(trip))
}

function photoTag(id: string, className: string): string {
  const url = peekPhoto(id)
  if (!url) return ''
  return `<div class="${className}"><img src="${url}" alt="" /></div>`
}

function timeLabel(act: Activity, tripDiff: number): string {
  if (!act.time) return `<i>${esc(t('act.noTime'))}</i>`
  const end = act.endTime ? `<i>〜 ${esc(act.endTime)}</i>` : ''
  const diff = act.timeDiff ?? tripDiff
  let home = ''
  if (diff) {
    const shifted = shiftTime(act.time, -diff)
    if (shifted) {
      const mark =
        shifted.dayShift < 0
          ? ` ${t('tz.prevDay')}`
          : shifted.dayShift > 0
            ? ` ${t('tz.nextDay')}`
            : ''
      home = `<i class="sh-hometime">${esc(t('tz.home'))} ${esc(shifted.time)}${esc(mark)}</i>`
    }
  }
  return `<b class="sh-num">${esc(act.time)}</b>${end}${home}`
}

function activityHtml(act: Activity, tripDiff: number): string {
  const cat = category(act.category)
  const photos = act.photoIds.slice(0, 3).map((id) => photoTag(id, 'sh-photo')).join('')
  const chips: string[] = []
  if (act.cost != null) chips.push(`<span class="sh-chip sh-num">${esc(yen(act.cost))}</span>`)
  if (act.url) chips.push(`<span class="sh-chip">${esc(t('act.hasLink'))}</span>`)
  return `
    <div class="sh-item">
      <div class="sh-time">${timeLabel(act, tripDiff)}</div>
      <div class="sh-card">
        <div class="sh-stripe" style="background:${cat.color}"></div>
        <span class="sh-tag" style="background:${cat.tint};color:${cat.color}">${esc(categoryLabel(act.category))}</span>
        <div class="sh-title">${esc(act.title || t('act.untitled'))}</div>
        ${act.place ? `<div class="sh-place">◎ ${esc(act.place)}</div>` : ''}
        ${act.memo ? `<div class="sh-memo">${esc(act.memo)}</div>` : ''}
        ${chips.length ? `<div class="sh-metarow">${chips.join('')}</div>` : ''}
        ${photos ? `<div class="sh-photos">${photos}</div>` : ''}
      </div>
    </div>`
}

function coverPage(trip: Trip): HTMLElement {
  const th = theme(trip.theme)
  const page = document.createElement('div')
  page.className = 'sh-page'
  const cover = trip.coverPhotoId ? peekPhoto(trip.coverPhotoId) : null
  const days = nightsBetween(trip.startDate, trip.endDate)
  const plans = trip.days.reduce((n, d) => n + d.activities.length, 0)

  page.innerHTML = `
    <div class="sh-cover-bg" style="background:${th.gradient}">
      ${cover ? `<img src="${cover}" alt="" />` : ''}
    </div>
    <div class="sh-cover-veil" style="background:${
      cover
        ? 'linear-gradient(180deg, rgba(0,0,0,0.42), rgba(0,0,0,0.66))'
        : 'linear-gradient(180deg, rgba(0,0,0,0.06), rgba(0,0,0,0.2))'
    }"></div>
    <div class="sh-cover-frame"></div>
    <div class="sh-stamp">
      <b class="sh-serif">${days}</b><span>${esc(t('pdf.days'))}</span>
    </div>
    <div class="sh-cover-in">
      <div class="sh-eyebrow">${esc(t('pdf.itinerary'))}</div>
      <div style="flex:1"></div>
      ${trip.destination ? `<div class="sh-cover-dest">◎ ${esc(trip.destination)}</div>` : ''}
      <div class="sh-cover-title" style="margin-top:10px">${esc(trip.title)}</div>
      <div class="sh-cover-dates sh-num" style="margin-top:14px">${esc(
        formatDot(trip.startDate),
      )} — ${esc(formatDot(trip.endDate))}</div>
      <div class="sh-cover-rule" style="margin:26px 0 20px"></div>
      <div class="sh-cover-facts">
        <div><div class="sh-fact-k">${esc(t('pdf.days'))}</div><div class="sh-fact-v sh-serif">${days}</div></div>
        <div><div class="sh-fact-k">${esc(t('pdf.plans'))}</div><div class="sh-fact-v sh-serif">${plans}</div></div>
        ${
          trip.members.length
            ? `<div><div class="sh-fact-k">${esc(t('pdf.members'))}</div><div class="sh-fact-v" style="font-size:15px;font-weight:600">${esc(
                trip.members.join(' / '),
              )}</div></div>`
            : ''
        }
      </div>
      <div class="sh-eyebrow" style="margin-top:26px;opacity:0.72;font-size:10px">${esc(t('pdf.madeWith'))}</div>
    </div>`
  return page
}

function dayPage(trip: Trip, day: Day, index: number, cont: boolean): { page: HTMLElement; body: HTMLElement } {
  const th = theme(trip.theme)
  const page = document.createElement('div')
  page.className = 'sh-page'
  page.innerHTML = `
    <div class="sh-dayhead" style="background:${th.gradient}">
      <div class="sh-dayno">
        <span>${esc(t('day.label'))}</span><b class="sh-serif">${String(index + 1).padStart(2, '0')}</b>
      </div>
      <div class="sh-daybar"></div>
      <div class="sh-daymeta">
        <div class="sh-daydate">${esc(formatDate(day.date))}</div>
        <div class="sh-daytitle">${esc(day.title || t('day.nthTitle', { n: index + 1 }))}${
          cont
            ? `<span style="font-size:14px;font-weight:600;opacity:0.85">${esc(t('pdf.continued'))}</span>`
            : ''
        }</div>
      </div>
    </div>
    <div class="sh-body"></div>
    <div class="sh-foot"><span>${esc(trip.title)}</span><span class="sh-num sh-pageno"></span></div>`
  const body = page.querySelector('.sh-body') as HTMLElement
  if (!cont && day.memo) {
    const memo = document.createElement('div')
    memo.className = 'sh-daymemo'
    memo.textContent = day.memo
    body.appendChild(memo)
  }
  return { page, body }
}

const SUMMARY_HEAD_H = 136
const SUMMARY_BODY_MAX = A4_H - SUMMARY_HEAD_H - FOOTER_H - 24

function summaryShell(trip: Trip, cont: boolean): { page: HTMLElement; body: HTMLElement } {
  const page = document.createElement('div')
  page.className = 'sh-page'
  page.innerHTML = `
    <div class="sh-plainhead">
      <div class="sh-eyebrow" style="color:#98a1ae">${esc(t('pdf.checklistEyebrow'))}</div>
      <div class="sh-h2" style="margin-top:8px">${esc(t('pdf.checklistTitle'))}${
        cont
          ? `<span style="font-size:15px;font-weight:600;color:#98a1ae">${esc(t('pdf.continued'))}</span>`
          : ''
      }</div>
      <div class="sh-rule"></div>
      <div class="sh-flowbody" style="height:${SUMMARY_BODY_MAX}px"></div>
    </div>
    <div class="sh-foot"><span>${esc(trip.title)}</span><span class="sh-num sh-pageno"></span></div>`
  return { page, body: page.querySelector('.sh-flowbody') as HTMLElement }
}

function node(html: string): HTMLElement {
  const holder = document.createElement('div')
  holder.innerHTML = html.trim()
  return holder.firstElementChild as HTMLElement
}

/** ページをまたいで要素を流し込むための小さな仕組み */
function makeFlow(
  makePage: (cont: boolean) => { page: HTMLElement; body: HTMLElement },
  max: number,
  root: HTMLElement,
) {
  let current = makePage(false)
  const pages: HTMLElement[] = [current.page]
  root.appendChild(current.page)
  return {
    pages,
    get body() {
      return current.body
    },
    push(el: HTMLElement) {
      current.body.appendChild(el)
      if (current.body.scrollHeight > max && current.body.childElementCount > 1) {
        current.body.removeChild(el)
        current = makePage(true)
        pages.push(current.page)
        root.appendChild(current.page)
        current.body.appendChild(el)
      }
    },
  }
}

/** 準備（やること・持ち物）と費用のページ */
function summaryPages(trip: Trip, root: HTMLElement): HTMLElement[] {
  const costs = trip.days.map((d) => ({
    date: d.date,
    total: d.activities.reduce((n, a) => n + (a.cost ?? 0), 0),
  }))
  const grand = costs.reduce((n, c) => n + c.total, 0)
  const todos = trip.todos ?? []
  const packing = trip.packing ?? []
  if (todos.length === 0 && packing.length === 0 && grand === 0 && !trip.memo) return []

  const flow = makeFlow((cont) => summaryShell(trip, cont), SUMMARY_BODY_MAX, root)

  if (todos.length > 0) {
    flow.push(node(`<div class="sh-secthead">${esc(t('pdf.todoSection'))}</div>`))
    for (const item of todos) {
      flow.push(
        node(
          `<div class="sh-check"><div class="sh-box"></div><span>${esc(item.label)}${
            item.due ? `<em>${esc(t('todo.due.until', { date: formatDate(item.due) }))}</em>` : ''
          }</span></div>`,
        ),
      )
    }
  }

  if (packing.length > 0) {
    flow.push(node(`<div class="sh-secthead">${esc(t('pdf.packSection'))}</div>`))
    for (const p of packing) {
      flow.push(
        node(`<div class="sh-check"><div class="sh-box"></div><span>${esc(p.label)}</span></div>`),
      )
    }
  }

  if (grand > 0) {
    flow.push(node(`<div class="sh-secthead">${esc(t('pdf.costSection'))}</div>`))
    costs.forEach((c, i) => {
      flow.push(
        node(
          `<div class="sh-costrow"><span>${esc(t('day.label'))} ${i + 1}　${esc(
            formatDate(c.date),
          )}</span><b class="sh-num">${esc(yen(c.total))}</b></div>`,
        ),
      )
    })
    flow.push(
      node(
        `<div class="sh-total"><span>${esc(t('pdf.total'))}</span><b class="sh-num sh-serif">${esc(
          yen(grand),
        )}</b></div>`,
      ),
    )
  }

  if (trip.memo) {
    flow.push(node(`<div class="sh-secthead">${esc(t('pdf.memoSection'))}</div>`))
    for (const line of splitParagraphs(trip.memo)) {
      flow.push(node(`<div class="sh-note" style="margin-top:0">${esc(line) || '&nbsp;'}</div>`))
    }
  }

  return flow.pages
}

/** 長文をページ送りできる大きさに切り分ける */
function splitParagraphs(text: string, chunk = 420): string[] {
  const out: string[] = []
  for (const para of text.split('\n')) {
    if (para.length <= chunk) {
      out.push(para)
      continue
    }
    for (let i = 0; i < para.length; i += chunk) out.push(para.slice(i, i + chunk))
  }
  return out
}

const MEMORIES_PER_PAGE = 6

function truncate(value: string, max: number): string {
  return value.length > max ? value.slice(0, max - 1) + '…' : value
}

function memoryHtml(trip: Trip, memory: Memory): string {
  const dayIndex = trip.days.findIndex((d) => d.id === memory.dayId)
  const url = peekPhoto(memory.photoId)
  return `
    <div class="sh-mem">
      <div class="sh-mem-img">${url ? `<img src="${url}" alt="" />` : ''}</div>
      ${memory.caption ? `<div class="sh-mem-cap">${esc(truncate(memory.caption, 72))}</div>` : ''}
      ${dayIndex >= 0 ? `<div class="sh-mem-day">${esc(t('day.label'))} ${dayIndex + 1}・${esc(formatDate(trip.days[dayIndex].date))}</div>` : ''}
    </div>`
}

/** 思い出アルバムのページ（写真 6 枚ごとに 1 ページ） */
function memoriesPages(trip: Trip): HTMLElement[] {
  const memories = trip.memories ?? []
  if (memories.length === 0) return []

  const pages: HTMLElement[] = []
  for (let start = 0; start < memories.length; start += MEMORIES_PER_PAGE) {
    const slice = memories.slice(start, start + MEMORIES_PER_PAGE)
    const page = document.createElement('div')
    page.className = 'sh-page'
    page.innerHTML = `
      <div class="sh-plainhead">
        <div class="sh-eyebrow" style="color:#98a1ae">${esc(t('pdf.memoriesEyebrow'))}</div>
        <div class="sh-h2" style="margin-top:8px">${esc(t('pdf.memoriesTitle'))}${
          start > 0
            ? `<span style="font-size:15px;font-weight:600;color:#98a1ae">${esc(t('pdf.continued'))}</span>`
            : ''
        }</div>
        <div class="sh-rule"></div>
        <div class="sh-memgrid">${slice.map((m) => memoryHtml(trip, m)).join('')}</div>
      </div>
      <div class="sh-foot"><span>${esc(trip.title)}</span><span class="sh-num sh-pageno"></span></div>`
    pages.push(page)
  }
  return pages
}

/** しおり全体のページ要素を組み立てて root に流し込む */
export function buildShioriPages(trip: Trip, root: HTMLElement): HTMLElement[] {
  const pages: HTMLElement[] = []

  const cover = coverPage(trip)
  root.appendChild(cover)
  pages.push(cover)

  trip.days.forEach((day, index) => {
    const flow = makeFlow((cont) => dayPage(trip, day, index, cont), BODY_MAX, root)

    if (day.activities.length === 0) {
      const empty = document.createElement('div')
      empty.className = 'sh-empty'
      empty.textContent = t('pdf.noPlans')
      flow.body.appendChild(empty)
    } else {
      for (const act of day.activities) flow.push(node(activityHtml(act, trip.timeDiff)))
    }

    if (day.diary) {
      flow.push(
        node(
          `<div class="sh-diaryhead"><b>${esc(t('pdf.diaryTitle', { n: index + 1 }))}</b><i></i></div>`,
        ),
      )
      for (const line of splitParagraphs(day.diary)) {
        flow.push(node(`<div class="sh-diaryline">${esc(line) || '&nbsp;'}</div>`))
      }
    }

    pages.push(...flow.pages)
  })

  pages.push(...summaryPages(trip, root))

  for (const page of memoriesPages(trip)) {
    root.appendChild(page)
    pages.push(page)
  }

  pages.forEach((page, i) => {
    const label = page.querySelector('.sh-pageno')
    if (label) label.textContent = `${i + 1} / ${pages.length}`
  })

  return pages
}

/** 1 日ぶんの縦長ポスター（PNG 用） */
export function buildDayPoster(trip: Trip, day: Day, index: number, root: HTMLElement): HTMLElement {
  const th = theme(trip.theme)
  const total = day.activities.reduce((n, a) => n + (a.cost ?? 0), 0)
  const poster = document.createElement('div')
  poster.className = 'sh-poster'
  poster.innerHTML = `
    <div class="sh-poster-head" style="background:${th.gradient}">
      <div class="sh-eyebrow" style="font-size:15px">${esc(trip.title)}</div>
      <div style="display:flex;align-items:flex-end;gap:24px;margin-top:26px">
        <div class="sh-dayno">
          <span style="font-size:14px">${esc(t('day.label'))}</span>
          <b class="sh-serif" style="font-size:78px">${String(index + 1).padStart(2, '0')}</b>
        </div>
        <div style="padding-bottom:12px">
          <div class="sh-daydate" style="font-size:19px">${esc(formatDate(day.date))}</div>
          <div style="font-size:34px;font-weight:900;margin-top:4px">${esc(
            day.title || t('pdf.thisDay'),
          )}</div>
        </div>
      </div>
      ${
        day.memo
          ? `<div style="margin-top:22px;font-size:17px;opacity:0.92;white-space:pre-wrap">${esc(
              day.memo,
            )}</div>`
          : ''
      }
    </div>
    <div class="sh-poster-body">
      ${
        day.activities.length
          ? day.activities.map((a) => activityHtml(a, trip.timeDiff)).join('')
          : `<div class="sh-empty">${esc(t('pdf.noPlans'))}</div>`
      }
      ${
        day.diary
          ? `<div class="sh-diaryhead"><b>${esc(t('pdf.diaryTitle', { n: index + 1 }))}</b><i></i></div>
             <div class="sh-diaryline">${esc(day.diary).replace(/\n/g, '<br />')}</div>`
          : ''
      }
    </div>
    <div class="sh-poster-foot">
      <span>${esc(total > 0 ? t('pdf.dayCost', { v: yen(total) }) : t('app.name'))}</span>
      <span>${esc(formatDot(day.date))}・${esc(weekday(day.date))}</span>
    </div>`
  root.appendChild(poster)
  return poster
}

/** 旅全体の概要ポスター（PNG 用・正方形に近い比率） */
export function buildTripPoster(trip: Trip, root: HTMLElement): HTMLElement {
  const th = theme(trip.theme)
  const cover = trip.coverPhotoId ? peekPhoto(trip.coverPhotoId) : null
  const plans = trip.days.reduce((n, d) => n + d.activities.length, 0)
  const total = trip.days.reduce(
    (n, d) => n + d.activities.reduce((m, a) => m + (a.cost ?? 0), 0),
    0,
  )
  const poster = document.createElement('div')
  poster.className = 'sh-poster'
  poster.style.width = '1080px'
  poster.innerHTML = `
    <div style="position:relative;height:560px;background:${th.gradient};overflow:hidden">
      ${
        cover
          ? `<img src="${cover}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" />`
          : ''
      }
      <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0.25), rgba(0,0,0,0.66))"></div>
      <div style="position:absolute;inset:0;padding:56px 60px;display:flex;flex-direction:column;color:#fff">
        <div class="sh-eyebrow" style="font-size:15px">${esc(t('pdf.itinerary'))}</div>
        <div style="flex:1"></div>
        ${
          trip.destination
            ? `<div style="font-size:22px;font-weight:700;letter-spacing:0.06em">◎ ${esc(
                trip.destination,
              )}</div>`
            : ''
        }
        <div style="font-size:60px;font-weight:900;line-height:1.2;margin-top:10px">${esc(
          trip.title,
        )}</div>
        <div class="sh-num" style="font-size:24px;font-weight:600;margin-top:14px;opacity:0.95">${esc(
          rangeLabel(trip.startDate, trip.endDate, t('trip.noDates')),
        )}</div>
      </div>
    </div>
    <div style="padding:44px 60px 20px;display:flex;gap:48px">
      <div><div class="sh-fact-k" style="color:#98a1ae">${esc(t('pdf.days'))}</div><div class="sh-serif" style="font-size:40px;font-weight:700">${nightsBetween(
        trip.startDate,
        trip.endDate,
      )}</div></div>
      <div><div class="sh-fact-k" style="color:#98a1ae">${esc(t('pdf.plans'))}</div><div class="sh-serif" style="font-size:40px;font-weight:700">${plans}</div></div>
      ${
        total > 0
          ? `<div><div class="sh-fact-k" style="color:#98a1ae">${esc(t('pdf.budget'))}</div><div class="sh-serif sh-num" style="font-size:40px;font-weight:700">${esc(
              yen(total),
            )}</div></div>`
          : ''
      }
    </div>
    <div style="padding:0 60px 50px">
      <div class="sh-rule" style="margin-bottom:20px"></div>
      ${trip.days
        .map((d, i) => {
          const heads = d.activities
            .slice(0, 3)
            .map((a) => esc(a.title || '無題'))
            .join(' → ')
          return `<div style="display:flex;gap:20px;padding:14px 0;border-bottom:1px dashed #eee7db">
            <div class="sh-serif" style="font-size:26px;font-weight:700;color:${th.solid};width:64px;flex:none">${String(
              i + 1,
            ).padStart(2, '0')}</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:19px;font-weight:800">${esc(d.title || formatDate(d.date))}</div>
              <div style="font-size:16px;color:#6b7482;margin-top:2px">${
                heads || esc(t('pdf.noPlans'))
              }${d.activities.length > 3 ? ` +${d.activities.length - 3}` : ''}</div>
            </div>
          </div>`
        })
        .join('')}
    </div>
    <div class="sh-poster-foot"><span>${esc(t('pdf.madeWith'))}</span><span></span></div>`
  root.appendChild(poster)
  return poster
}

/** 思い出アルバムのポスター（PNG 用） */
export function buildMemoriesPoster(trip: Trip, root: HTMLElement): HTMLElement {
  const th = theme(trip.theme)
  const memories = trip.memories ?? []
  const poster = document.createElement('div')
  poster.className = 'sh-poster'
  poster.innerHTML = `
    <div class="sh-poster-head" style="background:${th.gradient}">
      <div class="sh-eyebrow" style="font-size:15px">${esc(t('pdf.memoriesEyebrow'))}</div>
      <div style="font-size:52px;font-weight:900;line-height:1.2;margin-top:18px">${esc(t('pdf.memoriesTitle'))}</div>
      <div style="font-size:22px;font-weight:700;margin-top:10px;opacity:0.95">${esc(
        trip.title,
      )}</div>
      <div class="sh-num" style="font-size:19px;font-weight:600;margin-top:6px;opacity:0.9">${esc(
        formatDot(trip.startDate),
      )} — ${esc(formatDot(trip.endDate))}${
        trip.destination ? `　◎ ${esc(trip.destination)}` : ''
      }</div>
    </div>
    <div class="sh-poster-body sh-poster-mem">
      ${
        memories.length
          ? memories.map((m) => memoryHtml(trip, m)).join('')
          : `<div class="sh-empty">${esc(t('pdf.noPhotos'))}</div>`
      }
    </div>
    <div class="sh-poster-foot">
      <span>${esc(t('pdf.madeWith'))}</span>
      <span class="sh-num">${esc(t('pdf.photos', { n: memories.length }))}</span>
    </div>`
  root.appendChild(poster)
  return poster
}
