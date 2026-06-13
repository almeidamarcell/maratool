// Pure, testable helpers for the GIF compressor.
// Compression has three levers: color count, resize %, and frame dropping.

export var COLOR_OPTIONS = [256, 128, 64, 32]
export var SCALE_OPTIONS = [100, 75, 50]
export var SKIP_OPTIONS = [1, 2, 3] // 1 = keep all, 2 = every 2nd, 3 = every 3rd

// Presets are tuned so every level reliably reduces size on real GIFs.
// 256 colors (no quantization gain) stays an Advanced-only manual option —
// it can inflate an already-optimized GIF, so it's not a preset default.
export var PRESETS = {
  light: { colors: 128, scale: 100, skip: 1 },
  balanced: { colors: 64, scale: 100, skip: 1 },
  strong: { colors: 32, scale: 75, skip: 2 },
}

export function validatePreset(preset) {
  return Object.prototype.hasOwnProperty.call(PRESETS, preset)
}

export function getPresetSettings(preset) {
  var p = PRESETS[preset]
  if (!p) return null
  return { colors: p.colors, scale: p.scale, skip: p.skip }
}

export function validateColors(colors) {
  return COLOR_OPTIONS.indexOf(Number(colors)) !== -1
}

export function validateScale(scale) {
  return SCALE_OPTIONS.indexOf(Number(scale)) !== -1
}

export function validateSkip(skip) {
  return SKIP_OPTIONS.indexOf(Number(skip)) !== -1
}

// Compute output dimensions for a resize percentage. Always >= 1px.
export function computeScaledDims(width, height, scalePct) {
  if (!scalePct || scalePct >= 100) return { width: width, height: height }
  var w = Math.max(1, Math.round((width * scalePct) / 100))
  var h = Math.max(1, Math.round((height * scalePct) / 100))
  return { width: w, height: h }
}

// Indices of frames to keep when dropping every Nth frame.
// skip=1 keeps all; skip=2 keeps 0,2,4...; skip=3 keeps 0,3,6...
export function selectFrameIndices(count, skip) {
  var s = skip && skip > 1 ? skip : 1
  var out = []
  for (var i = 0; i < count; i += s) out.push(i)
  return out
}

// Merge dropped frames' delays into the kept frame so total duration is preserved.
// Returns one delay per kept frame.
export function mergeDelays(delays, skip) {
  if (!skip || skip <= 1) return delays.slice()
  var out = []
  for (var i = 0; i < delays.length; i += skip) {
    var sum = 0
    for (var j = i; j < Math.min(i + skip, delays.length); j++) {
      sum += delays[j] || 0
    }
    out.push(sum)
  }
  return out
}

export function getOutputFilename(inputName) {
  if (!inputName || typeof inputName !== 'string') return 'compressed.gif'
  var stem = inputName.replace(/\.gif$/i, '')
  if (stem === inputName) {
    // no .gif extension present
    var dot = inputName.lastIndexOf('.')
    if (dot > 0) stem = inputName.substring(0, dot)
  }
  return stem + '-compressed.gif'
}

// Savings between original and compressed byte sizes.
// Returns { percent, label } — percent is positive when smaller.
export function formatSavings(originalSize, compressedSize) {
  if (!originalSize || originalSize <= 0) return { percent: 0, label: 'no change' }
  var diff = originalSize - compressedSize
  var percent = Math.round((diff / originalSize) * 100)
  if (percent > 0) return { percent: percent, label: 'saved ' + percent + '%' }
  if (percent < 0) return { percent: percent, label: (-percent) + '% larger' }
  return { percent: 0, label: 'no change' }
}
