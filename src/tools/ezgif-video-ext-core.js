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

export function getVideoExtOutputFilename(inputName, suffix, ext) {
  if (!inputName || typeof inputName !== 'string') return 'output-' + suffix + ext
  var dot = inputName.lastIndexOf('.')
  var stem = dot > 0 ? inputName.substring(0, dot) : inputName
  return stem + '-' + suffix + ext
}
