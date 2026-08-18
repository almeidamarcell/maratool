// Pure image helpers for ezgif-gap image utility tools.

export function invertRgba(data) {
  var out = new Uint8ClampedArray(data.length)
  for (var i = 0; i < data.length; i += 4) {
    out[i] = 255 - data[i]
    out[i + 1] = 255 - data[i + 1]
    out[i + 2] = 255 - data[i + 2]
    out[i + 3] = data[i + 3]
  }
  return out
}

export function computeEnlargeDims(w, h, percent) {
  var p = Math.max(100, Math.min(400, Number(percent) || 200))
  return {
    width: Math.round(w * p / 100),
    height: Math.round(h * p / 100),
  }
}

export function computeAspectPad(srcW, srcH, ratioW, ratioH, mode) {
  var rw = Math.max(1, Number(ratioW) || 1)
  var rh = Math.max(1, Number(ratioH) || 1)
  var targetRatio = rw / rh
  var srcRatio = srcW / srcH
  var canvasW = srcW
  var canvasH = srcH
  var drawW = srcW
  var drawH = srcH
  var drawX = 0
  var drawY = 0

  if (mode === 'crop') {
    if (srcRatio > targetRatio) {
      canvasW = Math.round(srcH * targetRatio)
      canvasH = srcH
      drawX = Math.round((srcW - canvasW) / 2)
    } else {
      canvasW = srcW
      canvasH = Math.round(srcW / targetRatio)
      drawY = Math.round((srcH - canvasH) / 2)
    }
    drawW = canvasW
    drawH = canvasH
  } else {
    if (srcRatio > targetRatio) {
      canvasW = srcW
      canvasH = Math.round(srcW / targetRatio)
      drawY = Math.round((canvasH - srcH) / 2)
    } else {
      canvasH = srcH
      canvasW = Math.round(srcH * targetRatio)
      drawX = Math.round((canvasW - srcW) / 2)
    }
  }

  return { canvasW: canvasW, canvasH: canvasH, drawX: drawX, drawY: drawY, drawW: drawW, drawH: drawH }
}

export function computeSpriteTiles(imgW, imgH, rows, cols) {
  var r = Math.max(1, Math.floor(rows))
  var c = Math.max(1, Math.floor(cols))
  var tileW = Math.floor(imgW / c)
  var tileH = Math.floor(imgH / r)
  var tiles = []
  for (var row = 0; row < r; row++) {
    for (var col = 0; col < c; col++) {
      tiles.push({ x: col * tileW, y: row * tileH, w: tileW, h: tileH })
    }
  }
  return tiles
}

export function computeCollageCells(layout, sizes, gap) {
  var g = Math.max(0, Number(gap) || 0)
  var cells = []
  if (layout === 'horizontal') {
    var x = 0
  var maxH = 0
    sizes.forEach(function (s) {
      cells.push({ x: x, y: 0, w: s.w, h: s.h })
      x += s.w + g
      maxH = Math.max(maxH, s.h)
    })
    return cells
  }
  if (layout === 'vertical') {
    var y = 0
    sizes.forEach(function (s) {
      cells.push({ x: 0, y: y, w: s.w, h: s.h })
      y += s.h + g
    })
    return cells
  }
  if (layout === 'grid2x2') {
    var topW = Math.max(sizes[0]?.w || 0, sizes[1]?.w || 0)
    var botW = Math.max(sizes[2]?.w || 0, sizes[3]?.w || 0)
    var leftH = Math.max(sizes[0]?.h || 0, sizes[2]?.h || 0)
    if (sizes[0]) cells.push({ x: 0, y: 0, w: sizes[0].w, h: sizes[0].h })
    if (sizes[1]) cells.push({ x: topW + g, y: 0, w: sizes[1].w, h: sizes[1].h })
    if (sizes[2]) cells.push({ x: 0, y: leftH + g, w: sizes[2].w, h: sizes[2].h })
    if (sizes[3]) cells.push({ x: botW + g, y: leftH + g, w: sizes[3].w, h: sizes[3].h })
    return cells
  }
  if (sizes[0]) cells.push({ x: 0, y: 0, w: sizes[0].w, h: sizes[0].h })
  return cells
}

export function computeRoundedRadius(w, h, percent) {
  var p = Math.max(0, Math.min(50, Number(percent) || 10))
  var r = Math.round(Math.min(w, h) * (p / 100))
  return Math.max(0, Math.min(r, Math.min(w, h) / 2))
}

// Passport presets. Pixel sizes are the physical size at 300 dpi, which is
// what photo labs ask for. `headMin`/`headMax` are the chin-to-crown height as
// a fraction of the photo height and `eyeMin`/`eyeMax` the eye line measured
// from the bottom edge — both come from the published templates, and they are
// what the on-screen guide draws.
export var PASSPORT_PRESET_LIST = [
  { id: 'us', label: 'US 2×2 in', width: 600, height: 600, size: '51 × 51 mm', headMin: 0.5, headMax: 0.6875, eyeMin: 0.5625, eyeMax: 0.6875 },
  { id: 'eu', label: 'EU / Schengen 35×45 mm', width: 413, height: 531, size: '35 × 45 mm', headMin: 0.711, headMax: 0.8, eyeMin: 0.6, eyeMax: 0.722 },
  { id: 'uk', label: 'UK 35×45 mm', width: 413, height: 531, size: '35 × 45 mm', headMin: 0.644, headMax: 0.756, eyeMin: 0.6, eyeMax: 0.722 },
  { id: 'in', label: 'India 2×2 in', width: 600, height: 600, size: '51 × 51 mm', headMin: 0.49, headMax: 0.686, eyeMin: 0.55, eyeMax: 0.68 },
  { id: 'cn', label: 'China 33×48 mm', width: 390, height: 567, size: '33 × 48 mm', headMin: 0.583, headMax: 0.688, eyeMin: 0.583, eyeMax: 0.7 },
  { id: 'ca', label: 'Canada 50×70 mm', width: 591, height: 827, size: '50 × 70 mm', headMin: 0.443, headMax: 0.514, eyeMin: 0.55, eyeMax: 0.66 },
  { id: 'au', label: 'Australia 35×45 mm', width: 413, height: 531, size: '35 × 45 mm', headMin: 0.711, headMax: 0.8, eyeMin: 0.6, eyeMax: 0.722 },
]

var PASSPORT_PRESETS = {}
PASSPORT_PRESET_LIST.forEach(function (p) { PASSPORT_PRESETS[p.id] = p })

export function listPassportPresets() {
  return PASSPORT_PRESET_LIST
}

export function getPassportPreset(preset) {
  return PASSPORT_PRESETS[preset] || PASSPORT_PRESETS.us
}

export function computePassportSize(preset) {
  var p = getPassportPreset(preset)
  return { width: p.width, height: p.height }
}

// Eyes sit roughly 45% of the way down from the crown to the chin. That single
// ratio turns the published head-height and eye-line ranges into the three
// bands the overlay draws.
var EYE_RATIO = 0.45

function clamp01(v) {
  return Math.max(0, Math.min(1, v))
}

export function computeHeadGuide(preset) {
  var p = getPassportPreset(preset)
  var eyeTop = 1 - p.eyeMax
  var eyeBottom = 1 - p.eyeMin
  var headTopMin = clamp01(eyeTop - EYE_RATIO * p.headMax)
  var headTopMax = clamp01(eyeBottom - EYE_RATIO * p.headMin)
  return {
    eyeTop: clamp01(eyeTop),
    eyeBottom: clamp01(eyeBottom),
    headTopMin: headTopMin,
    headTopMax: headTopMax,
    chinMin: clamp01(headTopMin + p.headMin),
    chinMax: clamp01(headTopMax + p.headMax),
    headMin: p.headMin,
    headMax: p.headMax,
  }
}

// Cover-crop placement: scale so the photo fills the whole frame (never
// letterboxed), then apply zoom and a pan offset. Offsets are clamped so a
// drag can never expose a blank edge.
export function computeCoverPlacement(srcW, srcH, dstW, dstH, zoom, offsetX, offsetY) {
  var z = Math.max(1, Math.min(4, Number(zoom) || 1))
  var base = Math.max(dstW / srcW, dstH / srcH)
  var drawW = srcW * base * z
  var drawH = srcH * base * z
  var minX = dstW - drawW
  var minY = dstH - drawH
  var ox = Math.max(minX, Math.min(0, (dstW - drawW) / 2 + (Number(offsetX) || 0)))
  var oy = Math.max(minY, Math.min(0, (dstH - drawH) / 2 + (Number(offsetY) || 0)))
  return {
    drawX: Math.round(ox),
    drawY: Math.round(oy),
    drawW: Math.round(drawW),
    drawH: Math.round(drawH),
    offsetX: ox - (dstW - drawW) / 2,
    offsetY: oy - (dstH - drawH) / 2,
    scale: base * z,
  }
}

// ── format conversion ────────────────────────────────────────────────────

var CONVERT_TARGETS = {
  png: { format: 'png', mime: 'image/png', ext: '.png', label: 'PNG', lossy: false },
  jpg: { format: 'jpg', mime: 'image/jpeg', ext: '.jpg', label: 'JPG', lossy: true },
  webp: { format: 'webp', mime: 'image/webp', ext: '.webp', label: 'WebP', lossy: true },
}

// The bulk converters used to derive their output format from the *input*
// MIME type, so "JPG to PNG" handed back a JPEG named .png. The target now
// comes from the page config and nothing else.
export function resolveConvertTarget(format) {
  var key = String(format || 'png').toLowerCase()
  if (key === 'jpeg') key = 'jpg'
  return CONVERT_TARGETS[key] || CONVERT_TARGETS.png
}

export function formatConvertedName(inputName, ext) {
  var name = (inputName && typeof inputName === 'string') ? inputName : 'image'
  var dot = name.lastIndexOf('.')
  var stem = dot > 0 ? name.substring(0, dot) : name
  return (stem || 'image') + ext
}

export function clampQuality(percent, fallback) {
  var v = Number(percent)
  if (!isFinite(v)) v = fallback == null ? 90 : fallback
  return Math.max(0.3, Math.min(1, v / 100))
}

// Zero-padded to the width of the largest index, so a 16-tile sheet sorts
// correctly in a file manager (01…16, not 1, 10, 11…).
export function formatTileName(inputName, index, total) {
  var name = (inputName && typeof inputName === 'string') ? inputName : 'sprite'
  var dot = name.lastIndexOf('.')
  var stem = dot > 0 ? name.substring(0, dot) : name
  var pad = String(Math.max(1, total)).length
  var n = String(index + 1)
  while (n.length < pad) n = '0' + n
  return (stem || 'sprite') + '-' + n + '.png'
}

// ── image difference ─────────────────────────────────────────────────────

// Per-pixel absolute difference. `amplify` exists because a real regression is
// often a delta of 2–3 per channel, which renders as indistinguishable black
// without it. Counting uses the raw delta, so the stats stay honest.
export function computeImageDiff(a, b, options) {
  var opts = options || {}
  var threshold = opts.threshold == null ? 8 : opts.threshold
  var amplify = opts.amplify == null ? 4 : opts.amplify
  var len = Math.min(a.length, b.length)
  var out = new Uint8ClampedArray(len)
  var changed = 0
  var maxDelta = 0
  for (var i = 0; i < len; i += 4) {
    var dr = Math.abs(a[i] - b[i])
    var dg = Math.abs(a[i + 1] - b[i + 1])
    var db = Math.abs(a[i + 2] - b[i + 2])
    var da = Math.abs(a[i + 3] - b[i + 3])
    var delta = Math.max(dr, dg, db, da)
    if (delta > maxDelta) maxDelta = delta
    if (delta > threshold) changed++
    out[i] = dr * amplify
    out[i + 1] = dg * amplify
    out[i + 2] = db * amplify
    out[i + 3] = 255
  }
  return {
    data: out,
    changed: changed,
    total: Math.floor(len / 4),
    maxDelta: maxDelta,
    identical: maxDelta === 0,
  }
}

export function groupDigits(n) {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function formatDiffSummary(stats, sizeMismatch) {
  var prefix = sizeMismatch ? 'The two images are different sizes, so only the overlapping area is compared. ' : ''
  if (!stats || !stats.total) return prefix + 'Nothing to compare.'
  if (stats.identical) return prefix + 'Pixel for pixel identical — all ' + groupDigits(stats.total) + ' pixels match.'
  var pct = (stats.changed / stats.total) * 100
  var pctLabel = pct >= 0.1 ? pct.toFixed(1) + '%' : pct > 0 ? '<0.1%' : '0%'
  return prefix + groupDigits(stats.changed) + ' of ' + groupDigits(stats.total) +
    ' pixels differ (' + pctLabel + ') · largest channel gap ' + stats.maxDelta + '/255'
}

export function buildDataUri(mime, base64) {
  return 'data:' + mime + ';base64,' + String(base64).replace(/\s/g, '')
}

export function computeHalftoneCellSize(w, h, cells) {
  var n = Math.max(4, Number(cells) || 40)
  return Math.max(2, Math.round(Math.min(w, h) / n))
}

export function computeCensorRegion(imgW, imgH, x, y, w, h) {
  var rx = Math.max(0, Math.min(Math.round(x), imgW - 1))
  var ry = Math.max(0, Math.min(Math.round(y), imgH - 1))
  var rw = Math.max(1, Math.min(Math.round(w), imgW - rx))
  var rh = Math.max(1, Math.min(Math.round(h), imgH - ry))
  return { x: rx, y: ry, width: rw, height: rh }
}

export function formatImageOutputName(inputName, suffix, ext) {
  if (!inputName || typeof inputName !== 'string') return 'output-' + suffix + ext
  var dot = inputName.lastIndexOf('.')
  var stem = dot > 0 ? inputName.substring(0, dot) : inputName
  return stem + '-' + suffix + ext
}
