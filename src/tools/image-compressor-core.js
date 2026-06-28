export function validateQuality(q) {
  var n = Number(q)
  if (!n || n < 1 || n > 100) return { valid: false, value: 80 }
  return { valid: true, value: n }
}

export function calculateDimensions(w, h, scalePct) {
  var s = Number(scalePct) || 100
  if (s >= 100) return { width: w, height: h }
  return {
    width: Math.max(1, Math.round((w * s) / 100)),
    height: Math.max(1, Math.round((h * s) / 100)),
  }
}

export function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export function compressionRatio(original, compressed) {
  if (!original || original <= 0) return 0
  return ((original - compressed) / original) * 100
}

export function getOutputMime(format) {
  if (format === 'png') return 'image/png'
  if (format === 'webp') return 'image/webp'
  return 'image/jpeg'
}

export function isSupportedMime(type) {
  return /^image\/(jpeg|png|webp|gif|bmp)$/i.test(type || '')
}
