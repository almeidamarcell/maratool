export var ALLOWED_MNG_TYPES = ['video/x-mng', 'image/x-mng', 'application/x-mng']
export var MAX_FILE_SIZE = 200 * 1024 * 1024 // 200 MB — matches ezgif limit

export function isMngFile(file) {
  if (!file) return false
  var name = (file.name || '').toLowerCase()
  if (name.endsWith('.mng')) return true
  return ALLOWED_MNG_TYPES.indexOf(file.type) !== -1
}

export function validateMngFile(file) {
  if (!file) return { valid: false, error: 'No file selected' }
  if (!isMngFile(file)) {
    return { valid: false, error: 'Unsupported format. Upload a .mng (Multiple-image Network Graphics) file.' }
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File too large. Maximum is 200 MB.' }
  }
  return { valid: true }
}

/** FFmpeg args: decode MNG frames and mux as APNG, preserving frame delays from source. */
export function buildMngToApngArgs({ inputName, outputName }) {
  return ['-i', inputName, '-f', 'apng', '-y', outputName]
}

export function getOutputFilename(inputName) {
  if (!inputName || typeof inputName !== 'string' || inputName === '') return 'output.apng'
  var dot = inputName.lastIndexOf('.')
  if (dot === -1 || dot === 0) return inputName + '.apng'
  return inputName.substring(0, dot) + '.apng'
}
