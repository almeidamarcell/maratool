// FFmpeg arg builders for ezgif-gap audio tools.

var VALID_BITRATES = [64, 96, 128, 160, 192, 256, 320]

export function validateAudioBitrate(kbps) {
  var n = Number(kbps)
  if (!VALID_BITRATES.includes(n)) {
    return { valid: false, error: 'Bitrate must be one of: ' + VALID_BITRATES.join(', ') + ' kbps.' }
  }
  return { valid: true }
}

export function buildCutAudioArgs({ inputName, outputName, start, end }) {
  return [
    '-ss', String(start),
    '-to', String(end),
    '-i', inputName,
    '-c', 'copy',
    '-y', outputName,
  ]
}

export function buildCompressAudioArgs({ inputName, outputName, bitrateKbps }) {
  return [
    '-i', inputName,
    '-c:a', 'libmp3lame',
    '-b:a', String(bitrateKbps) + 'k',
    '-y', outputName,
  ]
}

export function buildMergeAudioArgs({ listFile, outputName }) {
  return [
    '-f', 'concat',
    '-safe', '0',
    '-i', listFile,
    '-c', 'copy',
    '-y', outputName,
  ]
}

export function buildFadeAudioArgs({ inputName, outputName, fadeInSeconds, fadeOutSeconds, durationSeconds }) {
  var dur = Number(durationSeconds) || 0
  var fin = Number(fadeInSeconds) || 0
  var fout = Number(fadeOutSeconds) || 0
  var fadeOutStart = Math.max(0, dur - fout)
  var filter = 'afade=t=in:st=0:d=' + fin + ',afade=t=out:st=' + fadeOutStart + ':d=' + fout
  return [
    '-i', inputName,
    '-af', filter,
    '-y', outputName,
  ]
}

export function buildAudioSpeedArgs({ inputName, outputName, speed }) {
  var s = Number(speed) || 1
  return [
    '-i', inputName,
    '-af', 'atempo=' + Math.min(2, Math.max(0.5, s)),
    '-y', outputName,
  ]
}

export function buildBoostVolumeArgs({ inputName, outputName, gainDb }) {
  return [
    '-i', inputName,
    '-af', 'volume=' + Number(gainDb) + 'dB',
    '-y', outputName,
  ]
}

export function getAudioOutputFilename(inputName, suffix) {
  if (!inputName || typeof inputName !== 'string') return 'audio-' + suffix + '.mp3'
  var dot = inputName.lastIndexOf('.')
  var stem = dot > 0 ? inputName.substring(0, dot) : inputName
  var ext = dot > 0 ? inputName.substring(dot) : '.mp3'
  return stem + '-' + suffix + ext
}
