var VALID_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']

export var FPS_PRESETS = [24, 25, 30, 50, 60]

export function validateFps(fps) {
  if (typeof fps !== 'number' || !Number.isFinite(fps) || !Number.isInteger(fps)) {
    return { valid: false, error: 'FPS must be a whole number' }
  }
  if (fps < 1 || fps > 240) {
    return { valid: false, error: 'FPS must be between 1 and 240' }
  }
  return { valid: true }
}

export function validateVideoFile(file) {
  if (!file || !file.type) {
    return { valid: false, error: 'No file selected' }
  }
  if (!VALID_VIDEO_TYPES.includes(file.type)) {
    return { valid: false, error: 'Unsupported format. Use MP4, WebM, or MOV.' }
  }
  return { valid: true }
}

export function formatDuration(seconds) {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds < 0) {
    return '—'
  }
  var h = Math.floor(seconds / 3600)
  var m = Math.floor((seconds % 3600) / 60)
  var s = Math.floor(seconds % 60)
  if (h > 0) {
    return h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0')
  }
  return m + ':' + String(s).padStart(2, '0')
}

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  var units = ['B', 'KB', 'MB', 'GB']
  var i = 0
  var size = bytes
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024
    i++
  }
  if (i === 0) return size + ' ' + units[i]
  return size.toFixed(1) + ' ' + units[i]
}

export function buildFfmpegArgs(inputFilename, outputFilename, targetFps) {
  return ['-i', inputFilename, '-filter:v', 'fps=' + targetFps, '-c:a', 'copy', outputFilename]
}

export function getOutputFilename(inputFilename, targetFps) {
  var dotIndex = inputFilename.lastIndexOf('.')
  if (dotIndex === -1) {
    return inputFilename + '-' + targetFps + 'fps'
  }
  var name = inputFilename.substring(0, dotIndex)
  var ext = inputFilename.substring(dotIndex)
  return name + '-' + targetFps + 'fps' + ext
}

export function isPresetFps(fps) {
  return FPS_PRESETS.indexOf(fps) !== -1
}
