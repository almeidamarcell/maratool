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

// ── Group segments into readable paragraphs (plain-text view only) ──
// Whisper returns many short segments; joining them all with a single space
// produces one unreadable wall of text. This breaks paragraphs on a silence gap
// between segments, after a few sentences, or once a soft character cap is
// crossed — but never mid-sentence. Pure + deterministic; SRT/VTT are unaffected.
export function toParagraphs(chunks, opts) {
  if (!Array.isArray(chunks) || chunks.length === 0) return ''
  var o = opts || {}
  var gapSeconds = typeof o.gapSeconds === 'number' ? o.gapSeconds : 1.5
  var maxSentences = typeof o.maxSentences === 'number' ? o.maxSentences : 4
  var maxChars = typeof o.maxChars === 'number' ? o.maxChars : 600
  // A segment ends a sentence when its text ends in .!?… possibly followed by a
  // closing quote/bracket. Known false positive: abbreviations like "Mr." — we
  // accept that rather than maintain an abbreviation list.
  var endsSentence = /[.!?…]["'”’)\]]*$/

  var paragraphs = []
  var cur = []
  var curLen = 0
  var curSentences = 0
  var prevEnd = null

  function flush() {
    if (cur.length) { paragraphs.push(cur.join(' ')); cur = []; curLen = 0; curSentences = 0 }
  }

  for (var i = 0; i < chunks.length; i++) {
    var c = chunks[i]
    var text = String((c && c.text) || '').trim()
    var end = c && typeof c.end === 'number' ? c.end : null
    if (text === '') { if (end !== null) prevEnd = end; continue }
    var start = c && typeof c.start === 'number' ? c.start : null

    // Time-gap break (before appending): a real pause in speech. Missing or
    // non-numeric timestamps, and overlaps (negative gaps), never break.
    if (cur.length && prevEnd !== null && start !== null && (start - prevEnd) > gapSeconds) {
      flush()
    }

    cur.push(text)
    curLen += text.length + 1
    var atSentenceEnd = endsSentence.test(text)
    if (atSentenceEnd) curSentences++

    // Length/sentence breaks only ever land on a sentence boundary, so a run-on
    // with no terminal punctuation stays a single paragraph rather than splitting.
    if (curSentences >= maxSentences || (curLen > maxChars && atSentenceEnd)) {
      flush()
    }
    if (end !== null) prevEnd = end
  }
  flush()
  return paragraphs.join('\n\n').trim()
}

// ── Options for the transformers.js ASR pipeline call ──
// Only params supported by the pinned transformers.js (3.7.5) are set:
// `no_repeat_ngram_size` suppresses decoder repetition loops ("the the the…").
// The Whisper temperature-fallback thresholds (compression_ratio/logprob/
// no_speech) are NOT implemented in 3.7.5, so they're intentionally omitted
// rather than sent and silently ignored. `prompt_ids` is included only when a
// non-empty vocabulary was tokenized (see sanitizeVocabulary).
export function buildAsrOptions(params) {
  var p = params || {}
  var opts = {
    return_timestamps: true,
    chunk_length_s: 30,
    stride_length_s: 5,
    task: 'transcribe',
    language: p.language == null ? null : p.language,
    no_repeat_ngram_size: 3,
  }
  if (Array.isArray(p.promptIds) && p.promptIds.length > 0) {
    opts.prompt_ids = p.promptIds
  }
  return opts
}

// ── Normalize the optional "vocabulary / context" field into a Whisper prompt ──
// Collapses whitespace, trims, and caps the length without cutting a word in
// half. Returns '' when there's nothing usable. The cap keeps the prompt well
// under Whisper's 224-token budget.
export function sanitizeVocabulary(input, opts) {
  if (typeof input !== 'string') return ''
  var maxChars = opts && typeof opts.maxChars === 'number' ? opts.maxChars : 200
  var s = input.replace(/\s+/g, ' ').trim()
  if (s === '') return ''
  if (s.length > maxChars) {
    var cut = s.slice(0, maxChars)
    // Only back off to the previous word boundary if we sliced mid-word; if the
    // character at the cut point is a space, the last kept word is already whole.
    if (s.charAt(maxChars) !== ' ') {
      var lastSpace = cut.lastIndexOf(' ')
      if (lastSpace > 0) cut = cut.slice(0, lastSpace)
    }
    s = cut.replace(/[,;\s]+$/, '')
  }
  return s
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
