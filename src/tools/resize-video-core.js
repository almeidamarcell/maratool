var VALID_PRESETS = ['1080', '720', '480', '360', 'custom']

export function validatePreset(preset) {
  if (!preset || typeof preset !== 'string') {
    return { valid: false, error: 'Preset must be a string.' }
  }
  if (!VALID_PRESETS.includes(preset)) {
    return { valid: false, error: 'Unknown preset: ' + preset + '. Valid: ' + VALID_PRESETS.join(', ') }
  }
  return { valid: true }
}

export function getPresetDimensions(preset) {
  switch (preset) {
    case '1080': return { width: 1920, height: -2 }
    case '720':  return { width: 1280, height: -2 }
    case '480':  return { width: 854,  height: -2 }
    case '360':  return { width: 640,  height: -2 }
    default:     return null
  }
}

export function buildResizeArgs({ inputName, outputName, width, height }) {
  var scaleFilter = 'scale=' + width + ':' + height
  return ['-i', inputName, '-vf', scaleFilter, '-c:a', 'copy', '-y', outputName]
}

// Round to nearest even number (required by libx264 for -2 workaround)
function roundEven(n) {
  return Math.round(n / 2) * 2
}

export function computeAspectHeight(width, origW, origH) {
  if (!origW || !origH || origW <= 0 || origH <= 0) return -2
  return roundEven(Math.round((width / origW) * origH))
}

export function computeAspectWidth(height, origW, origH) {
  if (!origW || !origH || origW <= 0 || origH <= 0) return -2
  return roundEven(Math.round((height / origH) * origW))
}

export function getOutputFilename(inputName, width, height) {
  if (!inputName || typeof inputName !== 'string') return 'video-resized.mp4'
  var dot = inputName.lastIndexOf('.')
  var stem = dot > 0 ? inputName.substring(0, dot) : inputName
  var ext  = dot > 0 ? inputName.substring(dot) : '.mp4'

  // Build a label from the height if it matches a preset, otherwise use WxH
  var label
  if (height === -2) {
    // We only know width; derive a preset label if it matches
    if (width === 1920) label = '1080p'
    else if (width === 1280) label = '720p'
    else if (width === 854)  label = '480p'
    else if (width === 640)  label = '360p'
    else label = width + 'w'
  } else {
    label = width + 'x' + height
  }

  return stem + '-' + label + ext
}
