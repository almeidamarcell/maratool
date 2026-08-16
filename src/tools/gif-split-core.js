// Pure helpers for splitting one animated GIF into several shorter GIFs.
//
// "Split" used to be wired to the frame extractor, so it handed back a folder
// of PNG stills — the same output as GIF to Frames. Cutting a clip into shorter
// clips is a different job: every segment stays an animation, keeps its own
// per-frame delays and inherits the loop flag of the source.
//
// A range is { start, end }, both 0-based and inclusive, because that is what
// the frame timeline and the encoder both want.

export function clampFrameCount(frameCount) {
  return Math.max(0, Math.floor(Number(frameCount) || 0))
}

// Split into N segments of near-equal length. The remainder goes to the earlier
// segments, so a 10-frame GIF in 3 parts is 4 + 3 + 3 rather than 3 + 3 + 4 and
// a stray last frame never ends up alone in its own file.
export function equalPartRanges(frameCount, parts) {
  var n = clampFrameCount(frameCount)
  if (!n) return []
  var p = Math.max(1, Math.floor(Number(parts) || 1))
  if (p > n) p = n
  var base = Math.floor(n / p)
  var rem = n % p
  var out = []
  var start = 0
  for (var i = 0; i < p; i++) {
    var len = base + (i < rem ? 1 : 0)
    out.push({ start: start, end: start + len - 1 })
    start += len
  }
  return out
}

// Fixed number of frames per segment; the last one keeps whatever is left.
export function chunkRanges(frameCount, framesPerSegment) {
  var n = clampFrameCount(frameCount)
  if (!n) return []
  var size = Math.max(1, Math.floor(Number(framesPerSegment) || 1))
  var out = []
  for (var start = 0; start < n; start += size) {
    out.push({ start: start, end: Math.min(n - 1, start + size - 1) })
  }
  return out
}

// Cut points are the 0-based indices of frames that begin a new segment. Frame
// 0 always begins one, so it is ignored if passed. Duplicates and out-of-range
// values are dropped rather than throwing — they come from clicks on a
// timeline, not from typed input.
export function rangesFromCutPoints(frameCount, cutPoints) {
  var n = clampFrameCount(frameCount)
  if (!n) return []
  var seen = {}
  var cuts = []
  var src = cutPoints || []
  for (var i = 0; i < src.length; i++) {
    var c = Math.floor(Number(src[i]))
    if (!isFinite(c) || c <= 0 || c >= n || seen[c]) continue
    seen[c] = true
    cuts.push(c)
  }
  cuts.sort(function (a, b) { return a - b })
  var out = []
  var start = 0
  for (var k = 0; k < cuts.length; k++) {
    out.push({ start: start, end: cuts[k] - 1 })
    start = cuts[k]
  }
  out.push({ start: start, end: n - 1 })
  return out
}

// The inverse: the frame indices where the given segmentation starts a new
// segment. Used to seed the timeline when the user switches from "equal parts"
// to hand-placed cuts, so the clicks start from what is already on screen.
export function cutPointsFromRanges(ranges) {
  var out = []
  var list = ranges || []
  for (var i = 1; i < list.length; i++) out.push(list[i].start)
  return out
}

// Parses "1-12, 13-24" or "1-12; 20" as typed by a human: 1-based, inclusive,
// and every failure gets a message naming the part that could not be read.
export function parseRangeSpec(spec, frameCount) {
  var n = clampFrameCount(frameCount)
  var text = String(spec == null ? '' : spec).trim()
  if (!text) {
    throw new Error('Enter at least one frame range, for example 1-' + Math.min(n, 12) + ', ' +
      (Math.min(n, 12) + 1) + '-' + n + '.')
  }
  var parts = text.split(/[,;\n]+/)
  var out = []
  for (var i = 0; i < parts.length; i++) {
    var token = parts[i].trim()
    if (!token) continue
    var m = token.match(/^(\d+)\s*(?:-|–|to|:)\s*(\d+)$/i)
    var from, to
    if (m) {
      from = parseInt(m[1], 10)
      to = parseInt(m[2], 10)
    } else if (/^\d+$/.test(token)) {
      from = parseInt(token, 10)
      to = from
    } else {
      throw new Error('Could not read "' + token + '" as a frame range. Use start-end, like 1-12.')
    }
    if (from < 1) throw new Error('Range "' + token + '" starts before frame 1.')
    if (to > n) throw new Error('Range "' + token + '" goes past the last frame — this GIF has ' + n + '.')
    if (from > to) throw new Error('Range "' + token + '" ends before it starts.')
    out.push({ start: from - 1, end: to - 1 })
  }
  if (!out.length) throw new Error('Enter at least one frame range, for example 1-' + n + '.')
  return out
}

// delaysMs are per-frame delays in milliseconds, which is what the GIF decoders
// in this project hand back (gifuct multiplies the file's hundredths by 10).
export function segmentDurationMs(delaysMs, range) {
  var total = 0
  var list = delaysMs || []
  for (var i = range.start; i <= range.end; i++) total += Number(list[i]) || 0
  return total
}

export function describeSegments(ranges, delaysMs) {
  var list = ranges || []
  return list.map(function (r, i) {
    return {
      index: i,
      start: r.start,
      end: r.end,
      frameCount: r.end - r.start + 1,
      durationMs: segmentDurationMs(delaysMs, r),
    }
  })
}

export function formatSegmentFilename(stem, index, total, ext) {
  var pad = String(Math.max(1, total)).length
  var num = String(index).padStart(pad, '0')
  return (stem || 'output') + '-part-' + num + (ext || '.gif')
}

// ── ZIP (stored, no compression) ─────────────────────────────────────────────
// GIF bytes are already LZW-compressed, so deflating them again buys nothing.
// A stored archive keeps this to ~40 lines of pure code and avoids pulling a
// zip library onto a page that only needs to bundle a handful of files.

var crcTable = null

function makeCrcTable() {
  crcTable = new Uint32Array(256)
  for (var n = 0; n < 256; n++) {
    var c = n
    for (var k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    crcTable[n] = c >>> 0
  }
}

export function crc32(data) {
  if (!crcTable) makeCrcTable()
  var crc = 0xffffffff
  for (var i = 0; i < data.length; i++) {
    crc = crcTable[(crc ^ data[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function encodeName(name) {
  var out = []
  for (var i = 0; i < name.length; i++) {
    var code = name.charCodeAt(i)
    if (code < 128) out.push(code)
    else out.push(0x5f) // non-ASCII filenames vary by unzip tool; underscore is safe
  }
  return new Uint8Array(out)
}

// files: [{ name, data: Uint8Array }] → Uint8Array of a valid .zip
export function buildStoredZip(files, now) {
  var list = files || []
  var date = now || new Date()
  var dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1)
  var dosDate = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()

  var locals = []
  var centrals = []
  var offset = 0

  for (var i = 0; i < list.length; i++) {
    var nameBytes = encodeName(list[i].name)
    var data = list[i].data
    var sum = crc32(data)

    var local = new Uint8Array(30 + nameBytes.length)
    var lv = new DataView(local.buffer)
    lv.setUint32(0, 0x04034b50, true)
    lv.setUint16(4, 20, true)
    lv.setUint16(6, 0, true)
    lv.setUint16(8, 0, true)
    lv.setUint16(10, dosTime, true)
    lv.setUint16(12, dosDate, true)
    lv.setUint32(14, sum, true)
    lv.setUint32(18, data.length, true)
    lv.setUint32(22, data.length, true)
    lv.setUint16(26, nameBytes.length, true)
    lv.setUint16(28, 0, true)
    local.set(nameBytes, 30)

    var central = new Uint8Array(46 + nameBytes.length)
    var cv = new DataView(central.buffer)
    cv.setUint32(0, 0x02014b50, true)
    cv.setUint16(4, 20, true)
    cv.setUint16(6, 20, true)
    cv.setUint16(8, 0, true)
    cv.setUint16(10, 0, true)
    cv.setUint16(12, dosTime, true)
    cv.setUint16(14, dosDate, true)
    cv.setUint32(16, sum, true)
    cv.setUint32(20, data.length, true)
    cv.setUint32(24, data.length, true)
    cv.setUint16(28, nameBytes.length, true)
    cv.setUint16(30, 0, true)
    cv.setUint16(32, 0, true)
    cv.setUint16(34, 0, true)
    cv.setUint16(36, 0, true)
    cv.setUint32(38, 0, true)
    cv.setUint32(42, offset, true)
    central.set(nameBytes, 46)

    locals.push({ header: local, data: data })
    centrals.push(central)
    offset += local.length + data.length
  }

  var centralSize = 0
  for (var c = 0; c < centrals.length; c++) centralSize += centrals[c].length

  var end = new Uint8Array(22)
  var ev = new DataView(end.buffer)
  ev.setUint32(0, 0x06054b50, true)
  ev.setUint16(4, 0, true)
  ev.setUint16(6, 0, true)
  ev.setUint16(8, list.length, true)
  ev.setUint16(10, list.length, true)
  ev.setUint32(12, centralSize, true)
  ev.setUint32(16, offset, true)
  ev.setUint16(20, 0, true)

  var total = offset + centralSize + end.length
  var out = new Uint8Array(total)
  var p = 0
  for (var j = 0; j < locals.length; j++) {
    out.set(locals[j].header, p); p += locals[j].header.length
    out.set(locals[j].data, p); p += locals[j].data.length
  }
  for (var k2 = 0; k2 < centrals.length; k2++) {
    out.set(centrals[k2], p); p += centrals[k2].length
  }
  out.set(end, p)
  return out
}
