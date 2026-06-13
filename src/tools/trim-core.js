export function validateTrimRange({ start, end, duration }) {
  if (typeof start !== 'number' || !Number.isFinite(start) || start < 0) {
    return { valid: false, error: 'Start time must be 0 or greater.' }
  }
  if (typeof end !== 'number' || !Number.isFinite(end)) {
    return { valid: false, error: 'End time is invalid.' }
  }
  if (end <= start) {
    return { valid: false, error: 'End time must be after start time.' }
  }
  if (typeof duration === 'number' && Number.isFinite(duration) && duration > 0) {
    if (end > duration + 0.05) {
      return { valid: false, error: 'End time is past the end of the video.' }
    }
  }
  if (end - start < 0.05) {
    return { valid: false, error: 'Trim segment is too short (under 0.05s).' }
  }
  return { valid: true }
}

export function buildTrimArgs({ start, end, inputName, outputName }) {
  return [
    '-ss', String(start),
    '-to', String(end),
    '-i', inputName,
    '-c', 'copy',
    '-avoid_negative_ts', 'make_zero',
    '-y', outputName,
  ]
}

export function buildTrimReencodeArgs({ start, end, inputName, outputName }) {
  return [
    '-ss', String(start),
    '-to', String(end),
    '-i', inputName,
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-crf', '22',
    '-c:a', 'aac',
    '-y', outputName,
  ]
}

export function getOutputFilename(inputName) {
  if (!inputName || typeof inputName !== 'string') return 'video-trimmed.mp4'
  var dot = inputName.lastIndexOf('.')
  if (dot === -1 || dot === 0) return inputName + '-trimmed.mp4'
  var stem = inputName.substring(0, dot)
  var ext = inputName.substring(dot)
  return stem + '-trimmed' + ext
}
