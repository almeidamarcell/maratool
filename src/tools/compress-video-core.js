var VALID_PRESETS = ['high', 'balanced', 'small']

var CRF_MAP = {
  high: 20,
  balanced: 26,
  small: 32,
}

export function validateQualityPreset(preset) {
  if (!preset || typeof preset !== 'string' || VALID_PRESETS.indexOf(preset) === -1) {
    return { valid: false, error: 'Invalid quality preset. Must be one of: high, balanced, small.' }
  }
  return { valid: true }
}

export function getCrfForPreset(preset) {
  if (!preset || !(preset in CRF_MAP)) return CRF_MAP.balanced
  return CRF_MAP[preset]
}

export function buildCompressArgs({ inputName, outputName, crf }) {
  return [
    '-i', inputName,
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', String(crf),
    '-c:a', 'aac',
    '-b:a', '128k',
    '-y', outputName,
  ]
}

export function getOutputFilename(inputName) {
  if (!inputName || typeof inputName !== 'string') return 'video-compressed.mp4'
  var dot = inputName.lastIndexOf('.')
  if (dot === -1 || dot === 0) return inputName + '-compressed.mp4'
  var stem = inputName.substring(0, dot)
  var ext = inputName.substring(dot)
  return stem + '-compressed' + ext
}

export function formatSavings(originalSize, compressedSize) {
  if (
    typeof originalSize !== 'number' || !Number.isFinite(originalSize) || originalSize <= 0 ||
    typeof compressedSize !== 'number' || !Number.isFinite(compressedSize) || compressedSize <= 0
  ) {
    return { percent: 0, label: 'no change' }
  }
  var diff = originalSize - compressedSize
  var percent = Math.round((diff / originalSize) * 100)
  if (percent <= 0) {
    var increase = Math.abs(percent)
    if (increase === 0) return { percent: 0, label: 'no change' }
    return { percent: -increase, label: 'increased by ' + increase + '%' }
  }
  return { percent: percent, label: 'saved ' + percent + '%' }
}
