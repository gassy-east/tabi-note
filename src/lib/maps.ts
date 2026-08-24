/** 場所名から Google マップの検索リンクを作る */
export function mapSearchUrl(query: string): string {
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query)
}

/** 経路検索リンク（前の地点 → 次の地点） */
export function mapDirectionsUrl(from: string, to: string): string {
  const params = new URLSearchParams({
    api: '1',
    origin: from,
    destination: to,
  })
  return 'https://www.google.com/maps/dir/?' + params.toString()
}

export function isValidUrl(value: string): boolean {
  if (!value) return false
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}
