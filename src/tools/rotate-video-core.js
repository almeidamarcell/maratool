var VALID_ROTATIONS = ['90cw', '90ccw', '180']

export function validateRotation(rotation) {
  if (rotation === null || rotation === undefined || typeof rotation !== 'string') {
    return { valid: false, error: 'Rotation must be a string.' }
  }
  if (!VALID_ROTATIONS.includes(rotation)) {
    return { valid: false, error: 'Rotation must be one of: 90cw, 90ccw, 180.' }
  }
  return { valid: true }
}

export function buildRotateArgs({ inputName, outputName, rotation }) {
  var filter
  if (rotation === '90cw') {
    filter = 'transpose=1'
  } else if (rotation === '90ccw') {
    filter = 'transpose=2'
  } else if (rotation === '180') {
    filter = 'transpose=2,transpose=2'
  } else {
    throw new Error('Invalid rotation: ' + rotation)
  }
  return ['-i', inputName, '-vf', filter, '-c:a', 'copy', '-y', outputName]
}

export function getOutputFilename(inputName, rotation) {
  if (!inputName || typeof inputName !== 'string') return 'video-rotated-' + (rotation || '90cw') + '.mp4'
  var dot = inputName.lastIndexOf('.')
  if (dot === -1 || dot === 0) return inputName + '-rotated-' + (rotation || '90cw') + '.mp4'
  var stem = inputName.substring(0, dot)
  var ext = inputName.substring(dot)
  return stem + '-rotated-' + (rotation || '90cw') + ext
}
