// FFmpeg arg builders for ezgif-gap video tools.

export function validateFps(fps) {
  var n = Number(fps)
  if (!Number.isFinite(n) || n < 1 || n > 60) {
    return { valid: false, error: 'FPS must be between 1 and 60.' }
  }
  return { valid: true }
}

function trimPrefix(start, end) {
  var args = []
  if (typeof start === 'number' && start > 0) args.push('-ss', String(start))
  if (typeof end === 'number' && end > 0) args.push('-to', String(end))
  return args
}

function scaleFilter(width, fps) {
  var parts = []
  if (fps) parts.push('fps=' + fps)
  if (width) parts.push('scale=' + width + ':-1:flags=lanczos')
  return parts.length ? parts.join(',') : null
}

export function buildVideoToApngArgs({ inputName, outputName, start, end, fps, width }) {
  var vf = scaleFilter(width, fps)
  return trimPrefix(start, end).concat(
    '-i', inputName,
    ...(vf ? ['-vf', vf] : []),
    '-f', 'apng',
    '-plays', '0',
    '-y', outputName,
  )
}

export function buildVideoToWebpArgs({ inputName, outputName, start, end, fps, width }) {
  var vf = scaleFilter(width, fps)
  return trimPrefix(start, end).concat(
    '-i', inputName,
    ...(vf ? ['-vf', vf] : []),
    '-loop', '0',
    '-f', 'webp',
    '-y', outputName,
  )
}

export function buildVideoToAvifArgs({ inputName, outputName, start, end, fps, width }) {
  var vf = scaleFilter(width, fps)
  return trimPrefix(start, end).concat(
    '-i', inputName,
    ...(vf ? ['-vf', vf] : []),
    '-c:v', 'libaom-av1',
    '-still_picture', '0',
    '-y', outputName,
  )
}

export function buildGifToMp4Args({ inputName, outputName }) {
  return [
    '-i', inputName,
    '-movflags', '+faststart',
    '-pix_fmt', 'yuv420p',
    '-c:v', 'libx264',
    '-y', outputName,
  ]
}

export function buildMergeVideosArgs({ listFile, outputName }) {
  return [
    '-f', 'concat',
    '-safe', '0',
    '-i', listFile,
    '-c', 'copy',
    '-y', outputName,
  ]
}

export function buildReverseVideoArgs({ inputName, outputName }) {
  return [
    '-i', inputName,
    '-vf', 'reverse',
    '-af', 'areverse',
    '-y', outputName,
  ]
}

export function buildVideoSpeedArgs({ inputName, outputName, speed }) {
  var s = Number(speed) || 1
  var pts = (1 / s).toFixed(4)
  var atempo = s
  // atempo supports 0.5-2.0 per filter; chain if needed — keep simple for 0.25-4
  var af = 'atempo=' + Math.min(2, Math.max(0.5, atempo))
  return [
    '-i', inputName,
    '-filter_complex', '[0:v]setpts=' + pts + '*PTS[v];[0:a]' + af + '[a]',
    '-map', '[v]',
    '-map', '[a]',
    '-c:v', 'libx264',
    '-c:a', 'aac',
    '-y', outputName,
  ]
}

export function buildFreezeVideoArgs({ inputName, outputName, atSeconds, durationSeconds }) {
  var at = Number(atSeconds) || 0
  var dur = Number(durationSeconds) || 1
  return [
    '-i', inputName,
    '-vf', 'tpad=stop_mode=clone:stop_duration=' + dur + ':start_duration=' + at,
    '-c:v', 'libx264',
    '-c:a', 'aac',
    '-y', outputName,
  ]
}

export function buildVideoScreenshotArgs({ inputName, outputName, atSeconds }) {
  return [
    '-ss', String(atSeconds),
    '-i', inputName,
    '-frames:v', '1',
    '-y', outputName,
  ]
}

export function buildImagesToVideoArgs({ pattern, outputName, fps }) {
  return [
    '-framerate', String(fps || 2),
    '-i', pattern,
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-y', outputName,
  ]
}

// ---------------------------------------------------------------------------
// Video filters — slider values mapped onto ffmpeg's `eq` filter.
// ---------------------------------------------------------------------------

export var VIDEO_FILTER_DEFAULTS = {
  brightness: 0,
  contrast: 1,
  saturation: 1,
  gamma: 1,
  blur: 0,
  negate: false,
}

export var VIDEO_FILTER_RANGES = {
  brightness: { min: -1, max: 1, step: 0.01 },
  contrast: { min: 0, max: 3, step: 0.01 },
  saturation: { min: 0, max: 3, step: 0.01 },
  gamma: { min: 0.1, max: 3, step: 0.01 },
  blur: { min: 0, max: 20, step: 0.5 },
}

// The three fixed options this tool used to ship as a <select>, expressed as
// slider positions so the old one-click results stay reachable.
export var VIDEO_FILTER_PRESETS = {
  original: {},
  vivid: { brightness: 0.06, saturation: 1.3 },
  grayscale: { saturation: 0 },
  negative: { negate: true },
}

function clampFilterValue(value, key) {
  var range = VIDEO_FILTER_RANGES[key]
  var n = Number(value)
  if (!isFinite(n)) return VIDEO_FILTER_DEFAULTS[key]
  return Math.min(range.max, Math.max(range.min, n))
}

export function normalizeVideoFilterOptions(opts) {
  var o = opts || {}
  var out = { negate: !!o.negate }
  Object.keys(VIDEO_FILTER_RANGES).forEach(function (key) {
    out[key] = o[key] === undefined || o[key] === null || o[key] === ''
      ? VIDEO_FILTER_DEFAULTS[key]
      : clampFilterValue(o[key], key)
  })
  return out
}

export function getVideoFilterPreset(name) {
  var preset = VIDEO_FILTER_PRESETS[name]
  if (!preset) return normalizeVideoFilterOptions({})
  var merged = {}
  Object.keys(VIDEO_FILTER_DEFAULTS).forEach(function (k) { merged[k] = VIDEO_FILTER_DEFAULTS[k] })
  Object.keys(preset).forEach(function (k) { merged[k] = preset[k] })
  return normalizeVideoFilterOptions(merged)
}

// 0.06 * 3 lands on 0.18000000000000002 in binary floating point; ffmpeg
// accepts it but the filter string is also shown to the user.
function filterNum(n) {
  return String(Math.round(n * 100) / 100)
}

export function buildEqFilterString(opts) {
  var o = normalizeVideoFilterOptions(opts)
  var parts = ['eq=brightness=' + filterNum(o.brightness) +
    ':contrast=' + filterNum(o.contrast) +
    ':saturation=' + filterNum(o.saturation) +
    ':gamma=' + filterNum(o.gamma)]
  if (o.blur > 0) parts.push('gblur=sigma=' + filterNum(o.blur))
  if (o.negate) parts.push('negate')
  return parts.join(',')
}

export function isVideoFilterIdentity(opts) {
  var o = normalizeVideoFilterOptions(opts)
  return !o.negate && o.blur === 0 && o.brightness === 0 &&
    o.contrast === 1 && o.saturation === 1 && o.gamma === 1
}

export function buildVideoFiltersArgs({ inputName, outputName, filter }) {
  var vf = filter || 'eq=brightness=0.06:saturation=1.2'
  return [
    '-i', inputName,
    '-vf', vf,
    '-c:v', 'libx264',
    '-c:a', 'copy',
    '-y', outputName,
  ]
}

export function buildVideoStabilizerArgs({ inputName, outputName }) {
  return [
    '-i', inputName,
    '-vf', 'deshake',
    '-c:v', 'libx264',
    '-c:a', 'copy',
    '-y', outputName,
  ]
}

// `fontsDir` matters more than it looks: the wasm build of libass ships with no
// fontconfig and no bundled face, so `subtitles=subs.srt` on its own encodes
// happily and burns in nothing at all. Point it at a directory holding a TTF
// and name that face in force_style, or the captions are invisible.
export function buildSubtitlesArgs({ inputName, outputName, subtitlesFile, fontsDir, style }) {
  var filter = 'subtitles=' + subtitlesFile
  if (fontsDir) filter += ':fontsdir=' + fontsDir
  if (style) filter += ":force_style='" + style + "'"
  return [
    '-i', inputName,
    '-vf', filter,
    '-c:v', 'libx264',
    '-c:a', 'copy',
    '-y', outputName,
  ]
}

export function clampInterpolateFps(fps) {
  return Math.max(24, Math.min(60, Number(fps) || 30))
}

// `blend` cross-fades neighbouring frames — much faster, no motion artefacts on
// hard cuts. The default motion-compensated mode is what makes panning smooth.
export function buildInterpolateFilter(fps, method) {
  return 'minterpolate=fps=' + clampInterpolateFps(fps) + (method === 'blend' ? ':mi_mode=blend' : '')
}

export function buildInterpolateArgs({ inputName, outputName, fps, method }) {
  return [
    '-i', inputName,
    '-vf', buildInterpolateFilter(fps, method),
    '-c:v', 'libx264',
    '-c:a', 'copy',
    '-y', outputName,
  ]
}

// GIF in → GIF out needs the same two-pass palette treatment as any other GIF
// encode; a straight `-i in.gif out.gif` quantises per frame and bands badly.
export function buildInterpolateGifPaletteArgs({ inputName, paletteName, fps, method }) {
  return [
    '-i', inputName,
    '-vf', buildInterpolateFilter(fps, method) + ',palettegen=stats_mode=diff',
    '-y', paletteName,
  ]
}

export function buildInterpolateGifArgs({ inputName, paletteName, outputName, fps, method }) {
  return [
    '-i', inputName,
    '-i', paletteName,
    '-lavfi', buildInterpolateFilter(fps, method) +
      ' [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle',
    '-loop', '0',
    '-y', outputName,
  ]
}

export function isGifFile(file) {
  if (!file) return false
  if (file.type && file.type.toLowerCase() === 'image/gif') return true
  return /\.gif$/i.test(file.name || '')
}

export function buildVideoToImageArgs({ inputName, outputName, atSeconds }) {
  return [
    '-ss', String(atSeconds || 0),
    '-i', inputName,
    '-frames:v', '1',
    '-y', outputName,
  ]
}

export function buildAddAudioToVideoArgs({ videoName, audioName, outputName }) {
  return [
    '-i', videoName,
    '-i', audioName,
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-shortest',
    '-y', outputName,
  ]
}

export function buildAnimatedToGifArgs({ inputName, outputName, fps, width }) {
  var vf = []
  if (fps) vf.push('fps=' + fps)
  if (width) vf.push('scale=' + width + ':-1:flags=lanczos')
  var args = ['-i', inputName]
  if (vf.length) args.push('-vf', vf.join(','))
  args.push('-y', outputName)
  return args
}

export function getVideoExtOutputFilename(inputName, suffix, ext) {
  if (!inputName || typeof inputName !== 'string') return 'output-' + suffix + ext
  var dot = inputName.lastIndexOf('.')
  var stem = dot > 0 ? inputName.substring(0, dot) : inputName
  return stem + '-' + suffix + ext
}
