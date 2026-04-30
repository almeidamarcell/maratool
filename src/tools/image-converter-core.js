// Image Converter — pure functions, no DOM
// Used by image-converter.js tool and tested in image-converter-core.test.js

const HEIC_MIME_TYPES = [
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
]

const EXTENSION_BY_MIME = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/avif': 'avif',
}

export function isHeic(file) {
  if (!file) return false
  var name = (file.name || '').toLowerCase()
  var type = (file.type || '').toLowerCase()
  if (/\.(heic|heif)$/.test(name)) return true
  return HEIC_MIME_TYPES.indexOf(type) !== -1
}

export function getOutputExtension(mimeType) {
  return EXTENSION_BY_MIME[mimeType] || 'png'
}

export function getTargetDimension(input, fallback) {
  var v = parseInt(input, 10)
  return (v && v > 0) ? v : fallback
}

export function stripExtension(filename) {
  return (filename || '').replace(/\.[^.]+$/, '')
}
