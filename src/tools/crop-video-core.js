var VALID_RATIOS = ['free', '16:9', '9:16', '1:1', '4:3', '3:4']

export function validateAspectRatio(ratio) {
  if (typeof ratio !== 'string') return { valid: false, error: 'Ratio must be a string.' }
  if (!VALID_RATIOS.includes(ratio)) return { valid: false, error: 'Invalid aspect ratio: ' + ratio }
  return { valid: true }
}

export function getAspectValue(ratio) {
  if (ratio === 'free') return null
  if (ratio === '16:9') return 16 / 9
  if (ratio === '9:16') return 9 / 16
  if (ratio === '1:1') return 1
  if (ratio === '4:3') return 4 / 3
  if (ratio === '3:4') return 3 / 4
  return null
}

function roundToEven(n) {
  var r = Math.round(n)
  return r % 2 === 0 ? r : r - 1
}

export function pctToPixels(box, videoW, videoH) {
  var x = roundToEven((box.leftPct / 100) * videoW)
  var y = roundToEven((box.topPct / 100) * videoH)
  var w = roundToEven((box.widthPct / 100) * videoW)
  var h = roundToEven((box.heightPct / 100) * videoH)

  // Ensure w/h are at least 2
  if (w < 2) w = 2
  if (h < 2) h = 2

  // Clamp so x+w <= videoW and y+h <= videoH (both even)
  if (x + w > videoW) {
    w = roundToEven(videoW - x)
    if (w < 2) { x = roundToEven(videoW - 2); w = 2 }
  }
  if (y + h > videoH) {
    h = roundToEven(videoH - y)
    if (h < 2) { y = roundToEven(videoH - 2); h = 2 }
  }

  return { x: x, y: y, w: w, h: h }
}

export function buildCropArgs({ inputName, outputName, x, y, w, h }) {
  return [
    '-i', inputName,
    '-vf', 'crop=' + w + ':' + h + ':' + x + ':' + y,
    '-c:a', 'copy',
    '-y', outputName,
  ]
}

export function getOutputFilename(inputName) {
  if (!inputName || typeof inputName !== 'string') return 'video-cropped.mp4'
  var dot = inputName.lastIndexOf('.')
  if (dot === -1 || dot === 0) return inputName + '-cropped.mp4'
  var stem = inputName.substring(0, dot)
  var ext = inputName.substring(dot)
  return stem + '-cropped' + ext
}

export function snapToAspect(box, ratio) {
  var ar = getAspectValue(ratio)
  if (ar === null) return Object.assign({}, box)

  var cx = box.leftPct + box.widthPct / 2
  var cy = box.topPct + box.heightPct / 2

  // Try to keep the current width, adjust height
  var newW = box.widthPct
  var newH = newW / ar

  // If newH is too large, scale down from height instead
  if (newH > 100) {
    newH = 100
    newW = newH * ar
  }
  if (newW > 100) {
    newW = 100
    newH = newW / ar
  }

  var newLeft = cx - newW / 2
  var newTop = cy - newH / 2

  // Clamp to [0, 100]
  if (newLeft < 0) newLeft = 0
  if (newTop < 0) newTop = 0
  if (newLeft + newW > 100) newLeft = 100 - newW
  if (newTop + newH > 100) newTop = 100 - newH

  return { leftPct: newLeft, topPct: newTop, widthPct: newW, heightPct: newH }
}
