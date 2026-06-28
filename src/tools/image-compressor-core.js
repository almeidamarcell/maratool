export const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp']

export function validateQuality(quality) {
  var q = Number(quality)
  if (!Number.isFinite(q) || q < 1 || q > 100) {
    return { valid: false, error: 'Quality must be between 1 and 100' }
  }
  return { valid: true, value: Math.round(q) }
}

export function calculateDimensions(originalWidth, originalHeight, scalePercent) {
  var scale = Math.max(1, Math.min(100, Number(scalePercent) || 100)) / 100
  return {
    width: Math.max(1, Math.round(originalWidth * scale)),
    height: Math.max(1, Math.round(originalHeight * scale)),
  }
}

export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  var units = ['B', 'KB', 'MB', 'GB']
  var i = 0
  var size = bytes
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024
    i++
  }
  return size.toFixed(i === 0 ? 0 : 1) + ' ' + units[i]
}

export function compressionRatio(originalBytes, compressedBytes) {
  if (!originalBytes || originalBytes <= 0) return 0
  return ((originalBytes - compressedBytes) / originalBytes) * 100
}

export function getOutputMime(format) {
  if (format === 'png') return 'image/png'
  if (format === 'webp') return 'image/webp'
  return 'image/jpeg'
}

export function isSupportedMime(mime) {
  return SUPPORTED_FORMATS.includes(mime) || mime === 'image/gif' || mime === 'image/bmp'
}
