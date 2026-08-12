export function buildBaseFilters({ fps, speed, width, reverse }) {
  var filters = []
  if (speed && speed !== 1) filters.push('setpts=' + (1 / speed) + '*PTS')
  filters.push('fps=' + fps)
  if (width > 0) filters.push('scale=' + width + ':-1:flags=lanczos')
  if (reverse) filters.push('reverse')
  return filters.join(',')
}

export function escapeDrawtext(text) {
  return text.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/:/g, '\\:')
}

var POSITION_MAP = {
  top: 'y=20',
  center: 'y=(h-text_h)/2',
  bottom: 'y=h-text_h-20',
}

export function buildDrawtextFilter({ text, size, position, color }) {
  if (!text || !text.trim()) return null
  var escaped = escapeDrawtext(text)
  var y = POSITION_MAP[position] || POSITION_MAP.bottom
  return "drawtext=text='" + escaped + "':fontsize=" + size + ':fontcolor=' + color + ':borderw=2:bordercolor=black:x=(w-text_w)/2:' + y
}

export function buildPalettePassArgs({ trimStart, trimLen, inputName, paletteName, baseFilters }) {
  return [
    '-ss', String(trimStart), '-t', String(trimLen),
    '-i', inputName,
    '-vf', baseFilters + ',palettegen=stats_mode=diff',
    '-y', paletteName
  ]
}

export function buildEncodePassArgs({ trimStart, trimLen, inputName, paletteName, outputName, baseFilters, drawtextFilter, loop }) {
  var lavfi = baseFilters + (drawtextFilter ? ',' + drawtextFilter : '') + ' [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle'
  return [
    '-ss', String(trimStart), '-t', String(trimLen),
    '-i', inputName, '-i', paletteName,
    '-lavfi', lavfi,
    '-loop', String(loop),
    '-y', outputName
  ]
}

export function validateGifOptions({ trimLen, fps, speed, reverse }) {
  var s = speed === undefined ? 1 : speed
  if (!isFinite(trimLen) || trimLen <= 0) return { valid: false, error: 'End time must be after start time.' }
  if (!isFinite(s) || s <= 0) return { valid: false, error: 'Speed must be greater than 0.' }
  // Cap the OUTPUT duration: setpts runs before fps, so a 0.5x clip produces
  // twice the frames of its source length.
  var outLen = trimLen / s
  if (outLen > 600) return { valid: false, error: 'Maximum GIF duration is 600 seconds (10 minutes) of output. Shorten the clip or increase the speed.' }
  // ffmpeg's reverse filter buffers every decoded frame in memory at once,
  // so long reversed clips are guaranteed to exhaust the wasm heap.
  if (reverse && outLen > 60) return { valid: false, error: 'Reverse holds every frame in memory and is limited to 60 seconds. Shorten the clip or disable reverse.' }
  if (!isFinite(fps) || fps < 1 || fps > 50) return { valid: false, error: 'FPS must be between 1 and 50.' }
  return { valid: true }
}

// Above ~6000 output frames a conversion may exceed the wasm memory ceiling
// depending on width and device — worth a warning, not a block.
export var FRAME_WARN_THRESHOLD = 6000

export function estimateFrameCount({ trimLen, fps, speed }) {
  var s = speed === undefined || !isFinite(speed) || speed <= 0 ? 1 : speed
  if (!isFinite(trimLen) || trimLen <= 0 || !isFinite(fps) || fps <= 0) return 0
  return Math.round((trimLen / s) * fps)
}
