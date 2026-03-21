export function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') return null
  var h = hex.replace(/^#/, '')
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  if (h.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(h)) return null
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  }
}

export function rgbToHex(r, g, b) {
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)
}

var MAX_DISTANCE = Math.sqrt(255 * 255 * 3)

export function colorDistance(r1, g1, b1, r2, g2, b2) {
  var dr = r1 - r2, dg = g1 - g2, db = b1 - b2
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

export function isColorMatch(r, g, b, tr, tg, tb, tolerancePercent) {
  var threshold = (tolerancePercent / 100) * MAX_DISTANCE
  return colorDistance(r, g, b, tr, tg, tb) <= threshold
}

export function removeColorFromFrame(rgbaData, width, height, targetR, targetG, targetB, tolerancePercent) {
  var result = new Uint8ClampedArray(rgbaData)
  var len = width * height
  for (var i = 0; i < len; i++) {
    var off = i * 4
    if (isColorMatch(result[off], result[off + 1], result[off + 2], targetR, targetG, targetB, tolerancePercent)) {
      result[off + 3] = 0
    }
  }
  return result
}

export function findOrAddTransparentIndex(palette) {
  if (palette.length < 256) {
    palette.push([0, 0, 0])
    return palette.length - 1
  }
  // Full palette — replace last entry
  palette[255] = [0, 0, 0]
  return 255
}

export function buildTransparentFrame(indexedData, rgbaData, width, height, targetR, targetG, targetB, tolerancePercent, transparentIndex) {
  var result = new Uint8Array(indexedData)
  var len = width * height
  for (var i = 0; i < len; i++) {
    var off = i * 4
    if (isColorMatch(rgbaData[off], rgbaData[off + 1], rgbaData[off + 2], targetR, targetG, targetB, tolerancePercent)) {
      result[i] = transparentIndex
    }
  }
  return result
}
