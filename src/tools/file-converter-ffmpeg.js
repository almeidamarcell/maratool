// FFmpeg WASM runtime for file converter
import { loadFFmpeg } from './ffmpeg-loader.js'
import {
  buildFfmpegCommand,
  buildVideoToVideoArgs,
  resolveFfmpegOutputExt,
  getOutputMimeType,
  isVideoFormat,
} from './file-converter-ffmpeg-core.js'

var ffmpegState = null

export async function initFfmpeg(onProgress) {
  if (ffmpegState) return ffmpegState
  var loaded = await loadFFmpeg(onProgress)
  ffmpegState = { ff: loaded.ff, fetchFile: loaded.fetchFile }
  return ffmpegState
}

export async function convertWithFfmpeg(file, inputFormat, outputFormat, settings, onLog) {
  var state = await initFfmpeg()
  var ff = state.ff
  var fetchFile = state.fetchFile
  var inBare = inputFormat.replace(/^\./, '').toLowerCase()
  var outBare = outputFormat.replace(/^\./, '').toLowerCase()
  var outExt = resolveFfmpegOutputExt('.' + outBare)

  if (onLog) {
    ff.on('log', function (e) { if (e.message) onLog(e.message) })
  }

  var fileData = await fetchFile(file)
  await ff.writeFile('input', fileData)

  var isVidToVid = isVideoFormat(inBare) && isVideoFormat(outBare)
  var args
  if (isVidToVid) {
    var outName = 'output' + outExt
    args = buildVideoToVideoArgs({
      inputName: 'input',
      outputName: outName,
      inputFormat: inBare,
      outputFormat: outBare,
    })
  } else {
    args = buildFfmpegCommand({
      inputFormat: inBare,
      outputFormat: outBare,
      settings: settings || {},
      hasAlbumArt: false,
    })
  }

  var ret = await ff.exec(args)
  if (ret !== 0) {
    throw new Error('FFmpeg conversion failed (code ' + ret + ')')
  }

  var outputPath = isVidToVid ? ('output' + outExt) : ('output' + outExt)
  var outputData = await ff.readFile(outputPath)
  try { await ff.deleteFile('input') } catch (_) {}
  try { await ff.deleteFile(outputPath) } catch (_) {}

  var mime = getOutputMimeType(outExt)
  return new Blob([outputData.buffer || outputData], { type: mime })
}
