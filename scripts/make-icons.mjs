// アプリアイコン（PNG）を生成する。依存なしで動くよう PNG を自前でエンコードする。
// 使い方: node scripts/make-icons.mjs
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')
mkdirSync(OUT, { recursive: true })

const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
})()

function crc32(buf) {
  let c = -1
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function encodePng(width, height, rgba) {
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // truecolour with alpha
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const mix = (a, b, t) => a + (b - a) * t

/** グラデーション（左上 #ff9d4d → 右下 #ea4620） */
function bgColor(u, v) {
  const t = Math.min(1, Math.max(0, (u + v) / 2))
  return [mix(255, 234, t), mix(157, 70, t), mix(77, 32, t)]
}

function insideRoundRect(x, y, size, radius) {
  const r = radius
  const cx = Math.min(Math.max(x, r), size - r)
  const cy = Math.min(Math.max(y, r), size - r)
  const dx = x - cx
  const dy = y - cy
  return dx * dx + dy * dy <= r * r
}

/** マップピンの形（白抜き）。scale で全体の大きさを調整する */
function insidePin(x, y, size, scale) {
  const cx = size / 2
  const cy = size / 2
  const s = size * scale
  const headY = cy - s * 0.1
  const headR = s * 0.3
  const dx = x - cx
  const dy = y - headY
  if (dx * dx + dy * dy <= headR * headR) return true
  // 下向きの三角
  const tipY = cy + s * 0.52
  const halfW = headR * 0.92
  if (y >= headY && y <= tipY) {
    const t = (y - headY) / (tipY - headY)
    const w = halfW * (1 - t)
    if (Math.abs(dx) <= w) return true
  }
  return false
}

function insideHole(x, y, size, scale) {
  const cx = size / 2
  const cy = size / 2
  const s = size * scale
  const headY = cy - s * 0.1
  const r = s * 0.125
  const dx = x - cx
  const dy = y - headY
  return dx * dx + dy * dy <= r * r
}

function render(size, { maskable = false } = {}) {
  const SS = 3 // スーパーサンプリング
  const rgba = Buffer.alloc(size * size * 4)
  const radius = maskable ? 0 : size * 0.225
  const pinScale = maskable ? 0.5 : 0.66

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let rSum = 0
      let gSum = 0
      let bSum = 0
      let aSum = 0
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = x + (sx + 0.5) / SS
          const py = y + (sy + 0.5) / SS
          const inBg = maskable || insideRoundRect(px, py, size, radius)
          if (!inBg) continue
          const [br, bg, bb] = bgColor(px / size, py / size)
          const pin = insidePin(px, py, size, pinScale) && !insideHole(px, py, size, pinScale)
          if (pin) {
            rSum += 255
            gSum += 253
            bSum += 249
          } else {
            rSum += br
            gSum += bg
            bSum += bb
          }
          aSum += 255
        }
      }
      const n = SS * SS
      const i = (y * size + x) * 4
      const a = aSum / n
      if (a > 0) {
        rgba[i] = Math.round(rSum / (aSum / 255))
        rgba[i + 1] = Math.round(gSum / (aSum / 255))
        rgba[i + 2] = Math.round(bSum / (aSum / 255))
      }
      rgba[i + 3] = Math.round(a)
    }
  }
  return encodePng(size, size, rgba)
}

const targets = [
  ['icon-192.png', 192, {}],
  ['icon-512.png', 512, {}],
  ['icon-512-maskable.png', 512, { maskable: true }],
  ['apple-touch-icon.png', 180, {}],
]

for (const [name, size, opts] of targets) {
  writeFileSync(join(OUT, name), render(size, opts))
  console.log('wrote', name, size)
}

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ff9d4d"/>
      <stop offset="1" stop-color="#ea4620"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="15" fill="url(#g)"/>
  <path d="M32 12c-6.6 0-12 5.4-12 12 0 8.6 12 24 12 24s12-15.4 12-24c0-6.6-5.4-12-12-12z" fill="#fffdf9"/>
  <circle cx="32" cy="24" r="4.6" fill="#ee5a26"/>
</svg>
`
writeFileSync(join(OUT, 'favicon.svg'), favicon)
console.log('wrote favicon.svg')
