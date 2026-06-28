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

var PASSPORT_PRESETS = {
  us: { width: 600, height: 600 },
  eu: { width: 413, height: 531 },
  uk: { width: 413, height: 531 },
  in: { width: 413, height: 531 },
}

export function computePassportSize(preset) {
  return PASSPORT_PRESETS[preset] || PASSPORT_PRESETS.us
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
