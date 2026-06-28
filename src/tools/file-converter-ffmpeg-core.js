// FFmpeg command builder for file converter audio/video conversions
import { FFMPEG_FORMATS, VIDEO_FORMATS } from './file-converter-formats.js'

export const VIDEO_FORMAT_EXTENSIONS = VIDEO_FORMATS
  .filter(function (f) { return f.fromSupported })
  .map(function (f) { return f.name.toLowerCase() })

export const AUDIO_OUTPUT_EXTENSIONS = FFMPEG_FORMATS
  .filter(function (f) { return f.isNative && f.toSupported })
  .map(function (f) { return f.name.toLowerCase() })

const LOSSLESS_FORMATS = ['flac', 'm4a', 'caf', 'alac', 'wav', 'dsd', 'dsf', 'dff']

export function isVideoFormat(ext) {
  var bare = ext.replace(/^\./, '').toLowerCase()
  return VIDEO_FORMAT_EXTENSIONS.indexOf(bare) !== -1 ||
    FFMPEG_FORMATS.some(function (f) { return f.name === bare && !f.isNative })
}

export function isAudioFormat(ext) {
  var bare = ext.replace(/^\./, '').toLowerCase()
  return FFMPEG_FORMATS.some(function (f) { return f.name === bare && f.isNative })
}

export function isAlacOutput(ext) {
  return ext.replace(/^\./, '').toLowerCase() === 'alac'
}

export function getCodecs(ext, isAlac) {
  var e = ext.startsWith('.') ? ext : '.' + ext
  switch (e) {
    case '.mp4':
    case '.mkv':
    case '.mov':
    case '.mts':
    case '.ts':
    case '.m2ts':
    case '.flv':
    case '.f4v':
    case '.m4v':
    case '.3gp':
    case '.3g2':
      return { video: 'libx264', audio: 'aac' }
    case '.wmv':
      return { video: 'wmv2', audio: 'wmav2' }
    case '.webm':
    case '.ogv':
      return { video: ext === '.webm' ? 'libvpx' : 'libtheora', audio: 'libvorbis' }
    case '.avi':
    case '.divx':
      return { video: 'mpeg4', audio: 'libmp3lame' }
    case '.mpg':
    case '.mpeg':
    case '.vob':
      return { video: 'mpeg2video', audio: 'mp2' }
    case '.mxf':
      return { video: 'mpeg2video', audio: 'pcm_s16le' }
    case '.mp3':
      return { video: 'libx264', audio: 'libmp3lame' }
    case '.flac':
      return { video: 'libx264', audio: 'flac' }
    case '.wav':
      return { video: 'libx264', audio: 'pcm_s16le' }
    case '.ogg':
    case '.oga':
      return { video: 'libx264', audio: 'libvorbis' }
    case '.opus':
      return { video: 'libx264', audio: 'libopus' }
    case '.aac':
      return { video: 'libx264', audio: 'aac' }
    case '.m4a':
      return { video: 'libx264', audio: isAlac ? 'alac' : 'aac' }
    case '.alac':
      return { video: 'libx264', audio: 'alac' }
    case '.wma':
      return { video: 'libx264', audio: 'wmav2' }
    default:
      return { video: 'libx264', audio: 'aac' }
  }
}

export function toArgs(ext, isAlac) {
  var e = ext.startsWith('.') ? ext : '.' + ext
  var codecs = getCodecs(e, isAlac)
  var args = ['-c:v', codecs.video]

  switch (codecs.video) {
    case 'libx264':
      args.push('-preset', 'ultrafast', '-crf', '18', '-tune', 'stillimage')
      break
    case 'libvpx':
      args.push('-c:v', 'libvpx-vp9')
      break
    case 'mpeg2video':
      if (e === '.mxf') args.push('-ar', '48000')
      break
  }

  args.push('-c:a', codecs.audio)
  if (codecs.audio === 'aac') args.push('-strict', 'experimental')
  if (e === '.divx') args.unshift('-f', 'avi')
  if (e === '.mxf') args.push('-strict', 'unofficial')
  return args
}

function metadataArgs(keepMetadata) {
  if (keepMetadata) return []
  return ['-map_metadata', '-1', '-map_chapters', '-1', '-map', 'a']
}

function bitrateArgs(inputFormat, outputFormat, quality) {
  var inBare = inputFormat.replace(/^\./, '').toLowerCase()
  var outBare = outputFormat.replace(/^\./, '').toLowerCase()
  var isLosslessToLossy = LOSSLESS_FORMATS.indexOf(inBare) !== -1 && LOSSLESS_FORMATS.indexOf(outBare) === -1
  if (quality && quality !== 'auto') return ['-b:a', quality + 'k']
  if (isLosslessToLossy) return ['-b:a', '128k']
  return []
}

function sampleRateArgs(outputFormat, sampleRate) {
  var outBare = outputFormat.replace(/^\./, '').toLowerCase()
  if (sampleRate && sampleRate !== 'auto') return ['-ar', String(sampleRate)]
  if (outBare === 'opus') return ['-ar', '48000']
  return []
}

export function buildFfmpegCommand(opts) {
  var inputFormat = opts.inputFormat.replace(/^\./, '').toLowerCase()
  var outputFormat = opts.outputFormat.replace(/^\./, '').toLowerCase()
  var settings = opts.settings || {}
  var keepMetadata = settings.keepMetadata !== false
  var isAlac = isAlacOutput(outputFormat)
  var toExt = isAlac ? '.m4a' : ('.' + outputFormat)
  var meta = metadataArgs(keepMetadata)
  var br = bitrateArgs('.' + inputFormat, '.' + outputFormat, settings.quality)
  var sr = sampleRateArgs('.' + outputFormat, settings.sampleRate)

  // video → audio
  if (isVideoFormat(inputFormat) && isAudioFormat(outputFormat)) {
    return ['-i', 'input', '-map', '0:a:0'].concat(meta, br, sr, 'output' + toExt)
  }

  // audio → video
  if (isAudioFormat(inputFormat) && isVideoFormat(outputFormat)) {
    if (opts.hasAlbumArt) {
      return [
        '-loop', '1', '-i', 'cover.jpg', '-i', 'input',
        '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
        '-shortest', '-pix_fmt', 'yuv420p', '-r', '1',
      ].concat(toArgs(toExt, isAlac), meta, br, sr, 'output' + toExt)
    }
    return [
      '-f', 'lavfi', '-i', 'color=c=black:s=512x512:rate=1', '-i', 'input',
      '-shortest', '-pix_fmt', 'yuv420p', '-r', '1',
    ].concat(toArgs(toExt, isAlac), meta, br, sr, 'output' + toExt)
  }

  // audio → audio
  var codecs = getCodecs('.' + outputFormat, isAlac)
  var m4aArgs = (toExt === '.m4a' && keepMetadata) ? ['-c:v', 'copy'] : []
  return ['-i', 'input']
    .concat(m4aArgs, ['-c:a', codecs.audio], meta, br, sr, 'output' + toExt)
}

export function buildVideoToVideoArgs(opts) {
  var outputFormat = opts.outputFormat.replace(/^\./, '').toLowerCase()
  var toExt = '.' + outputFormat
  var codecs = getCodecs(toExt, false)
  var args = ['-i', opts.inputName, '-c:v', codecs.video]

  if (codecs.video === 'libx264') {
    args.push('-preset', 'veryfast', '-crf', '22')
  } else if (codecs.video === 'libvpx') {
    args.push('-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '30')
  } else if (codecs.video === 'libtheora') {
    args.push('-q:v', '6')
  }

  args.push('-c:a', codecs.audio)
  if (codecs.audio === 'aac') args.push('-strict', 'experimental')
  if (toExt === '.divx') args.unshift('-f', 'avi')
  if (toExt === '.mxf') args.push('-strict', 'unofficial', '-ar', '48000')
  if (toExt === '.gif') {
    return ['-i', opts.inputName, '-vf', 'fps=10,scale=480:-1:flags=lanczos', '-y', opts.outputName]
  }
  args.push('-y', opts.outputName)
  return args
}

export function resolveFfmpegOutputExt(outputFormat) {
  return isAlacOutput(outputFormat) ? '.m4a' : ('.' + outputFormat.replace(/^\./, '').toLowerCase())
}

export function getOutputMimeType(ext) {
  var bare = ext.replace(/^\./, '').toLowerCase()
  var map = {
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    flac: 'audio/flac',
    ogg: 'audio/ogg',
    oga: 'audio/ogg',
    opus: 'audio/opus',
    aac: 'audio/aac',
    m4a: 'audio/mp4',
    alac: 'audio/mp4',
    wma: 'audio/x-ms-wma',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mkv: 'video/x-matroska',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    wmv: 'video/x-ms-wmv',
    gif: 'image/gif',
  }
  return map[bare] || 'application/octet-stream'
}
