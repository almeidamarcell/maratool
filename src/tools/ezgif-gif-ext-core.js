// Pure helpers for ezgif-gap GIF extension tools.

import { totalDurationMs } from './gif-anim-core.js'

export function computeGifStats(frameCount, delays, width, height) {
  var count = Number(frameCount) || 0
  var durationMs = totalDurationMs(delays || [])
  var avg = count ? delays.reduce(function (a, b) { return a + (Number(b) || 0) }, 0) / count : 0
  var fps = durationMs > 0 ? (count / (durationMs / 1000)) : 0
  return {
    frameCount: count,
    durationMs: durationMs,
    width: width,
    height: height,
    avgDelayCs: Math.round(avg),
    fps: Math.round(fps * 10) / 10,
  }
}

var POSITION_OFFSETS = {
  tl: function (bw, bh, ow, oh, m) { return { x: m, y: m } },
  tc: function (bw, bh, ow, oh, m) { return { x: (bw - ow) / 2, y: m } },
  tr: function (bw, bh, ow, oh, m) { return { x: bw - ow - m, y: m } },
  ml: function (bw, bh, ow, oh, m) { return { x: m, y: (bh - oh) / 2 } },
  mc: function (bw, bh, ow, oh, m) { return { x: (bw - ow) / 2, y: (bh - oh) / 2 } },
  mr: function (bw, bh, ow, oh, m) { return { x: bw - ow - m, y: (bh - oh) / 2 } },
  bl: function (bw, bh, ow, oh, m) { return { x: m, y: bh - oh - m } },
  bc: function (bw, bh, ow, oh, m) { return { x: (bw - ow) / 2, y: bh - oh - m } },
  br: function (bw, bh, ow, oh, m) { return { x: bw - ow - m, y: bh - oh - m } },
}

export function computeOverlayPosition(baseW, baseH, overlayW, overlayH, position, margin) {
  var m = Math.max(0, Number(margin) || 0)
  var fn = POSITION_OFFSETS[position] || POSITION_OFFSETS.mc
  var pos = fn(baseW, baseH, overlayW, overlayH, m)
  return { x: Math.round(pos.x), y: Math.round(pos.y) }
}

var EFFECT_FILTERS = {
  none: 'none',
  grayscale: 'grayscale(100%)',
  sepia: 'sepia(100%)',
  blur: 'blur(2px)',
  brightness: 'brightness(1.3)',
  contrast: 'contrast(1.4)',
  saturate: 'saturate(2)',
  invert: 'invert(100%)',
}

export function getCanvasFilterForEffect(effect) {
  return EFFECT_FILTERS[effect] || 'none'
}

export function computeStaticGifKeyframes(frameCount, style) {
  var n = Math.max(2, Math.min(60, Number(frameCount) || 8))
  var kf = []
  for (var i = 0; i < n; i++) {
    var t = i / (n - 1 || 1)
    var scale = 1
    var offsetX = 0
    var offsetY = 0
    if (style === 'zoom-in') {
      scale = 1 + t * 0.15
      offsetX = -t * 0.05
      offsetY = -t * 0.05
    } else if (style === 'zoom-out') {
      scale = 1.15 - t * 0.15
      offsetX = (1 - t) * -0.05
      offsetY = (1 - t) * -0.05
    } else if (style === 'pan-right') {
      offsetX = -t * 0.1
    } else if (style === 'pulse') {
      scale = 1 + Math.sin(t * Math.PI * 2) * 0.03
    }
    kf.push({ scale: scale, offsetX: offsetX, offsetY: offsetY })
  }
  return kf
}

export function formatFrameFilename(stem, index, total, ext) {
  var pad = String(total).length
  var num = String(index).padStart(pad, '0')
  return stem + '-frame-' + num + ext
}

// ── sprite sheet ─────────────────────────────────────────────────────────────
// A sprite sheet is one composited grid image, not a folder of stills. The GIF
// to Sprite Sheet page used to run the frame extractor, so it produced exactly
// the same output as GIF to Frames and satisfied neither query.

// columns <= 0 means "lay every frame out in a single row", which is what a
// CSS `steps()` animation wants.
export function computeSpriteLayout(frameCount, frameWidth, frameHeight, columns) {
  var n = Math.max(0, Math.floor(Number(frameCount) || 0))
  var fw = Math.max(1, Math.round(Number(frameWidth) || 1))
  var fh = Math.max(1, Math.round(Number(frameHeight) || 1))
  if (!n) return { columns: 0, rows: 0, width: 0, height: 0, frameWidth: fw, frameHeight: fh, cells: [] }
  var cols = Math.floor(Number(columns) || 0)
  if (cols <= 0) cols = n
  if (cols > n) cols = n
  var rows = Math.ceil(n / cols)
  var cells = []
  for (var i = 0; i < n; i++) {
    cells.push({ x: (i % cols) * fw, y: Math.floor(i / cols) * fh })
  }
  return {
    columns: cols,
    rows: rows,
    width: cols * fw,
    height: rows * fh,
    frameWidth: fw,
    frameHeight: fh,
    cells: cells,
  }
}

// Browsers refuse to allocate a canvas past a per-side and a total-area limit,
// and a refusal shows up as a blank white image rather than an exception. Check
// the numbers first so the failure can say what to change.
export function spriteSheetLimitError(layout, maxDimension, maxPixels) {
  if (!layout || !layout.width || !layout.height) return null
  var maxDim = maxDimension || 16384
  var maxPx = maxPixels || 100e6
  if (layout.width > maxDim || layout.height > maxDim) {
    return 'That layout is ' + layout.width + '×' + layout.height + ' pixels, past the ' + maxDim +
      '-pixel limit browsers put on a single image. Use more columns to make it squarer, or split the GIF first.'
  }
  if (layout.width * layout.height > maxPx) {
    return 'That layout needs ' + Math.round((layout.width * layout.height) / 1e6) + ' megapixels, more than a ' +
      'browser will draw in one image. Use a smaller GIF or fewer frames.'
  }
  return null
}

// The snippet is the reason to use a sprite sheet at all, so hand it over
// instead of leaving the user to work out the background-position maths.
export function spriteSheetCss(layout, frameCount, durationMs, className) {
  var name = className || 'sprite'
  var n = Math.max(1, Math.floor(Number(frameCount) || 1))
  var seconds = Math.max(0.1, (Number(durationMs) || n * 100) / 1000)
  var lines = [
    '.' + name + ' {',
    '  width: ' + layout.frameWidth + 'px;',
    '  height: ' + layout.frameHeight + 'px;',
    '  background-image: url("' + name + '.png");',
    '  background-repeat: no-repeat;',
    '  animation: ' + name + '-play ' + seconds.toFixed(2) + 's steps(' + layout.columns + ') infinite;',
    '}',
    '',
    '@keyframes ' + name + '-play {',
    '  from { background-position: 0 0; }',
    '  to   { background-position: -' + layout.width + 'px 0; }',
    '}',
  ]
  if (layout.rows > 1) {
    lines.push('')
    lines.push('/* ' + layout.rows + ' rows: a steps() animation only walks one row.')
    lines.push('   Set columns to ' + n + ' for a single-row strip if you want the CSS above to play the whole GIF. */')
  }
  return lines.join('\n')
}
