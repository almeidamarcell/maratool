/** Wave 4 social utilities */

export function parseTimestamp(input) {
  const parts = String(input || '').trim().split(':').map(Number)
  if (parts.some(x => !isFinite(x) || x < 0)) return null
  let h = 0; let m = 0; let s = 0
  if (parts.length === 3) [h, m, s] = parts
  else if (parts.length === 2) [m, s] = parts
  else if (parts.length === 1) s = parts[0]
  else return null
  return { hours: h, minutes: m, seconds: s, totalSeconds: h * 3600 + m * 60 + s }
}

export function formatYoutubeTimestamp(totalSeconds) {
  const t = Math.max(0, Math.floor(Number(totalSeconds)))
  const h = Math.floor(t / 3600)
  const m = Math.floor((t % 3600) / 60)
  const s = t % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export function secondsToYoutubeLink(videoUrl, totalSeconds) {
  const base = String(videoUrl || '').split('&')[0]
  const t = Math.max(0, Math.floor(Number(totalSeconds)))
  if (!base) return ''
  const sep = base.includes('?') ? '&' : '?'
  return `${base}${sep}t=${t}`
}
