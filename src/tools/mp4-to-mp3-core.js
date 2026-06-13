var VALID_BITRATES = [128, 192, 320]

export function validateBitrate(bitrate) {
  var n = Number(bitrate)
  if (!VALID_BITRATES.includes(n)) {
    return { valid: false, error: 'Bitrate must be 128, 192, or 320 kbps.' }
  }
  return { valid: true }
}

export function buildMp3Args({ inputName, outputName, bitrate }) {
  return [
    '-i', inputName,
    '-vn',
    '-c:a', 'libmp3lame',
    '-b:a', String(bitrate) + 'k',
    '-y', outputName,
  ]
}

export function getOutputFilename(inputName) {
  if (!inputName || typeof inputName !== 'string' || inputName.trim() === '') {
    return 'audio.mp3'
  }
  var dot = inputName.lastIndexOf('.')
  if (dot === -1 || dot === 0) return inputName + '.mp3'
  var stem = inputName.substring(0, dot)
  return stem + '.mp3'
}
