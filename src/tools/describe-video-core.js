// describe-video-core.js
// Pure, framework-free helpers for the "Describe Video with AI" tool.
// No DOM, no model — just timing math and transcript formatting so the
// logic is unit-testable without a browser.

// Compute the list of timestamps (in seconds) to sample from a video.
// Samples at 0, interval, 2*interval, … up to (but not including) duration.
// Capped at maxFrames — when the cap is hit, sampling stops early and the
// caller can tell the user coverage was truncated.
export function frameTimesForDuration(duration, intervalSec, maxFrames) {
  const times = []
  if (!Number.isFinite(duration) || !(duration > 0) || !(intervalSec > 0)) return times
  const cap = Number.isFinite(maxFrames) && maxFrames > 0 ? maxFrames : Infinity
  for (let t = 0; t < duration; t += intervalSec) {
    if (times.length >= cap) break
    // Nudge t=0 slightly forward — the very first frame is often black.
    times.push(t === 0 ? Math.min(0.1, duration / 2) : Math.min(t, duration - 0.01))
  }
  return times
}

// Would sampling this video at this interval exceed the frame cap?
export function isTruncated(duration, intervalSec, maxFrames) {
  if (!Number.isFinite(duration) || !(duration > 0) || !(intervalSec > 0)) return false
  const total = Math.ceil(duration / intervalSec)
  return Number.isFinite(maxFrames) && maxFrames > 0 && total > maxFrames
}

function pad(n, width) {
  return String(Math.floor(n)).padStart(width, '0')
}

// "MM:SS" — or "H:MM:SS" once we cross an hour.
export function formatTimestamp(sec) {
  const s = Math.max(0, Math.floor(sec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = s % 60
  if (h > 0) return `${h}:${pad(m, 2)}:${pad(r, 2)}`
  return `${pad(m, 2)}:${pad(r, 2)}`
}

// "HH:MM:SS.mmm" for WebVTT cues. Round to whole ms FIRST so a fraction
// like 1.9996s becomes 2000ms → "00:00:02.000", never "00:00:01.1000".
export function formatVttTime(sec) {
  const totalMs = Math.round(Math.max(0, sec) * 1000)
  const h = Math.floor(totalMs / 3600000)
  const m = Math.floor((totalMs % 3600000) / 60000)
  const s = Math.floor((totalMs % 60000) / 1000)
  const ms = totalMs % 1000
  return `${pad(h, 2)}:${pad(m, 2)}:${pad(s, 2)}.${pad(ms, 3)}`
}

// "HH:MM:SS,mmm" for SRT cues.
export function formatSrtTime(sec) {
  return formatVttTime(sec).replace('.', ',')
}

// Tidy a raw model caption: collapse whitespace, capitalize, end with a period.
export function cleanCaption(text) {
  if (!text) return ''
  let t = String(text).replace(/\s+/g, ' ').trim()
  if (!t) return ''
  t = t.charAt(0).toUpperCase() + t.slice(1)
  if (!/[.!?]$/.test(t)) t += '.'
  return t
}

// items: [{ time: seconds, text: caption }]
export function buildPlainText(items) {
  return items
    .map((it) => `[${formatTimestamp(it.time)}] ${it.text}`)
    .join('\n')
}

// Each caption becomes a cue that runs until the next sample (or the video end).
function cueEnd(items, index, duration) {
  const next = items[index + 1]
  if (next) return next.time
  if (Number.isFinite(duration) && duration > items[index].time) return duration
  return items[index].time + 2
}

export function buildVtt(items, duration) {
  const lines = ['WEBVTT', '']
  items.forEach((it, i) => {
    lines.push(`${formatVttTime(it.time)} --> ${formatVttTime(cueEnd(items, i, duration))}`)
    lines.push(it.text)
    lines.push('')
  })
  return lines.join('\n')
}

export function buildSrt(items, duration) {
  const blocks = items.map((it, i) => {
    return [
      String(i + 1),
      `${formatSrtTime(it.time)} --> ${formatSrtTime(cueEnd(items, i, duration))}`,
      it.text,
      '',
    ].join('\n')
  })
  return blocks.join('\n')
}

// Strip the extension from an uploaded filename so we can build "clip.txt" etc.
export function baseName(filename) {
  if (!filename) return 'video-description'
  return filename.replace(/\.[^.]+$/, '') || 'video-description'
}

// ── Combined audio + visual timeline ──
// visual: [{ time, text }] from frame captioning
// speech: [{ start, end, text }] from Whisper (video-to-text-core shape)
// Output: [{ time, end?, kind: 'speech' | 'visual', text }] sorted by time,
// speech first on ties (you hear the words as the scene appears).

export function mergeTimeline(visualItems, speechSegments) {
  const merged = []
  for (const s of speechSegments || []) {
    merged.push({ time: s.start, end: s.end, kind: 'speech', text: s.text })
  }
  for (const v of visualItems || []) {
    merged.push({ time: v.time, kind: 'visual', text: v.text })
  }
  merged.sort((a, b) => {
    if (a.time !== b.time) return a.time - b.time
    if (a.kind === b.kind) return 0
    return a.kind === 'speech' ? -1 : 1
  })
  return merged
}

function hasSpeech(merged) {
  return merged.some((m) => m.kind === 'speech')
}

function label(item, withLabels) {
  if (!withLabels) return item.text
  return (item.kind === 'speech' ? 'Speech: ' : 'Visual: ') + item.text
}

// A visual cue describes the scene until the NEXT visual caption (speech cues
// in between don't end it); the last one runs to the video duration.
function visualCueEnds(merged, duration) {
  const visuals = merged.filter((m) => m.kind === 'visual')
  const ends = new Map()
  visuals.forEach((v, i) => {
    const next = visuals[i + 1]
    if (next) ends.set(v, next.time)
    else if (Number.isFinite(duration) && duration > v.time) ends.set(v, duration)
    else ends.set(v, v.time + 2)
  })
  return ends
}

export function buildCombinedPlainText(merged) {
  const withLabels = hasSpeech(merged)
  return merged
    .map((m) => `[${formatTimestamp(m.time)}] ${label(m, withLabels)}`)
    .join('\n')
}

function combinedCues(merged, duration) {
  const withLabels = hasSpeech(merged)
  const ends = visualCueEnds(merged, duration)
  return merged.map((m) => ({
    start: m.time,
    end: m.kind === 'speech' ? m.end : ends.get(m),
    text: label(m, withLabels),
  }))
}

export function buildCombinedVtt(merged, duration) {
  const lines = ['WEBVTT', '']
  for (const cue of combinedCues(merged, duration)) {
    lines.push(`${formatVttTime(cue.start)} --> ${formatVttTime(cue.end)}`)
    lines.push(cue.text)
    lines.push('')
  }
  return lines.join('\n')
}

export function buildCombinedSrt(merged, duration) {
  return combinedCues(merged, duration)
    .map((cue, i) => [
      String(i + 1),
      `${formatSrtTime(cue.start)} --> ${formatSrtTime(cue.end)}`,
      cue.text,
      '',
    ].join('\n'))
    .join('\n')
}
