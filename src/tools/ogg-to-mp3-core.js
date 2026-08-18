// Shared core for the OGG → MP3 and Opus → MP3 converters.
// Both accept the full OGG family: the container (.ogg/.oga) and the
// codec-named .opus files are interchangeable in the wild.
export { validateBitrate, getOutputFilename } from './mp4-to-mp3-core.js'

var VALID_EXTENSIONS = ['.ogg', '.oga', '.opus']
var VALID_MIME_TYPES = ['audio/ogg', 'application/ogg', 'video/ogg', 'audio/opus']

export function validateAudioFile(file) {
  var error = 'Please select an OGG audio file (.ogg, .oga, .opus).'
  if (!file || typeof file.name !== 'string') {
    return { valid: false, error: error }
  }
  var name = file.name.toLowerCase()
  var hasValidExt = VALID_EXTENSIONS.some(function (ext) { return name.endsWith(ext) })
  var hasValidMime = VALID_MIME_TYPES.includes(file.type)
  if (!hasValidExt && !hasValidMime) {
    return { valid: false, error: error }
  }
  return { valid: true }
}

export function buildConvertArgs({ inputName, outputName, bitrate }) {
  return [
    '-i', inputName,
    '-vn',
    '-c:a', 'libmp3lame',
    '-b:a', String(bitrate) + 'k',
    '-y', outputName,
  ]
}

export function getMaxFileSize() {
  return 500 * 1024 * 1024
}
