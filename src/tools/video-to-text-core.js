// Pure, framework-free logic for the Video to Text tool.
// The heavy lifting (FFmpeg audio extraction + Whisper inference) lives in the
// UI module; everything here is deterministic and unit-tested.

// ── Supported languages (Whisper subset, curated for search demand) ──
export var LANGUAGES = [
  { code: 'auto', label: 'Auto-detect' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'it', label: 'Italian' },
  { code: 'nl', label: 'Dutch' },
  { code: 'ru', label: 'Russian' },
  { code: 'ja', label: 'Japanese' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ko', label: 'Korean' },
  { code: 'ar', label: 'Arabic' },
  { code: 'hi', label: 'Hindi' },
]

export function isSupportedLanguage(code) {
  if (typeof code !== 'string' || code === '') return false
  return LANGUAGES.some(function (l) { return l.code === code })
}

// Returns the code to pass to Whisper, or null to let it auto-detect.
export function resolveLanguage(code) {
  if (!isSupportedLanguage(code) || code === 'auto') return null
  return code
}

// ── File validation ──
export function validateMediaFile(file) {
  if (!file || typeof file.type !== 'string' || file.type === '') {
    return { valid: false, error: 'No file selected.' }
  }
  if (file.type.indexOf('video/') === 0 || file.type.indexOf('audio/') === 0) {
    return { valid: true }
  }
  return { valid: false, error: 'Unsupported format. Upload a video or audio file.' }
}

// ── FFmpeg: down-mix to 16 kHz mono PCM WAV, the input Whisper expects ──
export function buildAudioExtractArgs(inputName, outputName) {
  return [
    '-i', inputName,
    '-vn',
    '-ac', '1',
    '-ar', '16000',
    '-c:a', 'pcm_s16le',
    '-y', outputName,
  ]
}

// ── Timestamp formatting ──
function pad(n, width) {
  var s = String(n)
  while (s.length < width) s = '0' + s
  return s
}

export function formatTimestamp(seconds, opts) {
  var comma = opts && opts.comma
  var totalMs = Math.round((Number(seconds) || 0) * 1000)
  if (totalMs < 0) totalMs = 0
  var ms = totalMs % 1000
  var totalSec = (totalMs - ms) / 1000
  var s = totalSec % 60
  var totalMin = (totalSec - s) / 60
  var m = totalMin % 60
  var h = (totalMin - m) / 60
  var sep = comma ? ',' : '.'
  return pad(h, 2) + ':' + pad(m, 2) + ':' + pad(s, 2) + sep + pad(ms, 3)
}

// ── Normalize raw Whisper chunks into {start, end, text} ──
export function normalizeChunks(chunks) {
  if (!Array.isArray(chunks)) return []
  var cleaned = []
  for (var i = 0; i < chunks.length; i++) {
    var c = chunks[i]
    if (!c) continue
    var ts = c.timestamp || []
    var text = typeof c.text === 'string' ? c.text.trim() : ''
    if (text === '') continue
    cleaned.push({ start: ts[0], end: ts[1], text: text, _rawEnd: ts[1] })
  }
  for (var j = 0; j < cleaned.length; j++) {
    if (cleaned[j].end === null || cleaned[j].end === undefined) {
      var next = cleaned[j + 1]
      cleaned[j].end = next ? next.start : cleaned[j].start
    }
    delete cleaned[j]._rawEnd
  }
  return cleaned
}

// ── Serializers ──
export function toSRT(chunks) {
  return chunks
    .map(function (c, i) {
      return (
        (i + 1) + '\n' +
        formatTimestamp(c.start, { comma: true }) + ' --> ' + formatTimestamp(c.end, { comma: true }) + '\n' +
        c.text
      )
    })
    .join('\n\n')
}

export function toVTT(chunks) {
  var cues = chunks
    .map(function (c) {
      return (
        formatTimestamp(c.start, { comma: false }) + ' --> ' + formatTimestamp(c.end, { comma: false }) + '\n' +
        c.text
      )
    })
    .join('\n\n')
  return 'WEBVTT\n\n' + cues
}

export function toPlainText(chunks) {
  if (!Array.isArray(chunks) || chunks.length === 0) return ''
  return chunks
    .map(function (c) { return c.text })
    .join(' ')
    .trim()
}

// ── Output filename with swapped extension ──
export function getOutputFilename(inputName, ext) {
  if (!inputName || typeof inputName !== 'string' || inputName.trim() === '') {
    return 'transcript.' + ext
  }
  var dot = inputName.lastIndexOf('.')
  if (dot <= 0) return inputName + '.' + ext
  return inputName.substring(0, dot) + '.' + ext
}
