// Caption cue parsing and SRT serialisation for the subtitle burner.
// Pure logic — no DOM, no ffmpeg.

function pad(n, width) {
  var s = String(Math.floor(Math.abs(n)))
  while (s.length < width) s = '0' + s
  return s
}

// Accepts what people actually type: "12", "12.5", "1:23", "1:23.5",
// "00:01:23,500". Returns seconds, or null when it is not a timecode.
export function parseTimecode(input) {
  if (typeof input === 'number') return isFinite(input) && input >= 0 ? input : null
  if (input == null) return null
  var raw = String(input).trim()
  if (!raw) return null
  var m = raw.match(/^(?:(\d+):)?(?:(\d+):)?(\d+(?:[.,]\d+)?)$/)
  if (!m) return null
  var seconds = parseFloat(m[3].replace(',', '.'))
  var minutes = 0
  var hours = 0
  if (m[2] !== undefined) {
    hours = parseInt(m[1], 10)
    minutes = parseInt(m[2], 10)
  } else if (m[1] !== undefined) {
    minutes = parseInt(m[1], 10)
  }
  if (m[1] !== undefined && seconds >= 60) return null
  if (m[2] !== undefined && minutes >= 60) return null
  return hours * 3600 + minutes * 60 + seconds
}

function clockParts(sec) {
  // Round to whole milliseconds first: 1.9996s must become 00:00:02,000, never
  // 00:00:01,1000.
  var total = Math.max(0, Math.round((Number(sec) || 0) * 1000))
  return {
    h: Math.floor(total / 3600000),
    m: Math.floor((total % 3600000) / 60000),
    s: Math.floor((total % 60000) / 1000),
    ms: total % 1000,
  }
}

export function formatSrtTimecode(sec) {
  var p = clockParts(sec)
  return pad(p.h, 2) + ':' + pad(p.m, 2) + ':' + pad(p.s, 2) + ',' + pad(p.ms, 3)
}

// What the editor fields show. A dot reads as a decimal to most people; the
// comma is an SRT wire-format detail.
export function formatTimecodeInput(sec) {
  var p = clockParts(sec)
  return pad(p.h, 2) + ':' + pad(p.m, 2) + ':' + pad(p.s, 2) + '.' + pad(p.ms, 3)
}

// Rows straight out of the editor: strings for everything. Drops rows with no
// text, sorts by start time so out-of-order edits still produce valid SRT.
export function normalizeCues(rows) {
  var cues = []
  ;(rows || []).forEach(function (row) {
    if (!row) return
    var text = String(row.text == null ? '' : row.text).trim()
    if (!text) return
    cues.push({
      start: parseTimecode(row.start),
      end: parseTimecode(row.end),
      text: text,
    })
  })
  cues.sort(function (a, b) {
    if (a.start == null) return 1
    if (b.start == null) return -1
    return a.start - b.start
  })
  return cues
}

export function validateCues(cues) {
  if (!cues || !cues.length) {
    return { valid: false, error: 'Add at least one caption with some text.' }
  }
  for (var i = 0; i < cues.length; i++) {
    var c = cues[i]
    var label = 'Caption ' + (i + 1)
    if (c.start == null) return { valid: false, error: label + ': start time is not a valid timecode (try 0:05 or 00:00:05.000).' }
    if (c.end == null) return { valid: false, error: label + ': end time is not a valid timecode (try 0:08 or 00:00:08.000).' }
    if (c.end <= c.start) return { valid: false, error: label + ': end time must be after the start time.' }
  }
  return { valid: true }
}

export function buildSrt(cues) {
  return (cues || []).map(function (cue, i) {
    return [
      String(i + 1),
      formatSrtTimecode(cue.start) + ' --> ' + formatSrtTimecode(cue.end),
      cue.text,
    ].join('\n')
  }).join('\n\n') + '\n'
}

// Reads both SRT and WebVTT. VTT cue settings after the end timestamp
// ("00:00:02.000 --> 00:00:04.000 line:90%") are ignored rather than parsed.
export function parseSubtitleText(text) {
  var lines = String(text || '').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').split('\n')
  var cues = []
  for (var i = 0; i < lines.length; i++) {
    var arrow = lines[i].indexOf('-->')
    if (arrow === -1) continue
    var start = parseTimecode(lines[i].slice(0, arrow).trim())
    var end = parseTimecode(lines[i].slice(arrow + 3).trim().split(/\s+/)[0])
    if (start == null || end == null) continue
    var body = []
    for (var j = i + 1; j < lines.length; j++) {
      if (!lines[j].trim()) break
      if (lines[j].indexOf('-->') !== -1) break
      body.push(lines[j].trim())
      i = j
    }
    cues.push({ start: start, end: end, text: body.join('\n') })
  }
  return cues
}

// ASS alignment numbering: 1-3 bottom row, 4-6 middle, 7-9 top.
var ALIGNMENT = { bottom: 2, center: 5, top: 8 }

export var SUBTITLE_FONT_NAME = 'DejaVu Sans'

function clampNum(value, lo, hi, fallback) {
  // Number('') is 0, so an emptied number field would silently clamp to the
  // minimum instead of falling back to the default.
  if (value === '' || value === null || value === undefined) return fallback
  var n = Number(value)
  if (!isFinite(n)) return fallback
  return Math.min(hi, Math.max(lo, n))
}

// force_style is a comma-separated ASS style override list, so no value here
// may contain a comma or a single quote.
export function buildSubtitleStyle(opts) {
  var o = opts || {}
  var parts = [
    'FontName=' + (o.fontName || SUBTITLE_FONT_NAME),
    'FontSize=' + clampNum(o.fontSize, 8, 96, 24),
    'Alignment=' + (ALIGNMENT[o.position] || ALIGNMENT.bottom),
    'MarginV=' + clampNum(o.marginV, 0, 200, 24),
    'BorderStyle=1',
    'Outline=' + (o.outline === false ? 0 : clampNum(o.outlineWidth, 0, 8, 2)),
    'Shadow=0',
    'PrimaryColour=&H00FFFFFF&',
    'OutlineColour=&H00000000&',
  ]
  return parts.join(',')
}
