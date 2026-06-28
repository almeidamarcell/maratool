import { loadFFmpeg } from './ffmpeg-loader.js'
import { validateVideoFile, formatFileSize } from './fps-converter-core.js'

export function initFfmpegTool(config) {
  var prefix = config.prefix || 'ef'
  var buildArgs = config.buildArgs
  var outputExt = config.outputExt || '.mp4'
  var outputSuffix = config.outputSuffix || 'out'
  var acceptVideo = config.acceptVideo !== false
  var acceptAudio = config.acceptAudio || false
  var getOutputName = config.getOutputName

  var dropzone = document.getElementById(prefix + '-dropzone')
  var fileInput = document.getElementById(prefix + '-file-input')
  var settingsEl = document.getElementById(prefix + '-settings')
  var processBtn = document.getElementById(prefix + '-process')
  var progressEl = document.getElementById(prefix + '-progress')
  var progressText = document.getElementById(prefix + '-progress-text')
  var progressFill = document.getElementById(prefix + '-progress-fill')
  var resultEl = document.getElementById(prefix + '-result')
  var resultMedia = document.getElementById(prefix + '-result-media')
  var downloadBtn = document.getElementById(prefix + '-download')
  var errorEl = document.getElementById(prefix + '-error')
  var errorText = document.getElementById(prefix + '-error-text')

  var ffmpeg = null
  var ffmpegLoaded = false
  var currentFile = null
  var resultBlobUrl = null
  var MAX = config.maxBytes || 200 * 1024 * 1024

  function showState(state) {
    if (dropzone) dropzone.style.display = state === 'upload' ? '' : 'none'
    if (settingsEl) settingsEl.style.display = state === 'settings' ? '' : 'none'
    if (progressEl) progressEl.style.display = state === 'progress' ? '' : 'none'
    if (resultEl) resultEl.style.display = state === 'result' ? '' : 'none'
    if (errorEl) errorEl.style.display = state === 'error' ? '' : 'none'
  }

  function showError(msg) {
    if (errorText) errorText.textContent = msg
    showState('error')
  }

  function readOpts() {
    var opts = {}
    document.querySelectorAll('[data-ef-opt]').forEach(function (el) {
      opts[el.dataset.efOpt] = el.type === 'number' ? parseFloat(el.value) : el.value
    })
    return opts
  }

  async function ensureFfmpeg() {
    if (ffmpegLoaded) return
    if (progressText) progressText.textContent = 'Loading FFmpeg...'
    var result = await loadFFmpeg(function (pct) {
      if (progressFill) progressFill.style.width = Math.min(pct, 45) + '%'
    })
    ffmpeg = result.ff
    ffmpegLoaded = true
  }

  function validateFile(file) {
    if (acceptAudio && file.type.startsWith('audio/')) return { valid: true }
    if (acceptVideo) return validateVideoFile(file)
    return { valid: false, error: 'Unsupported file type.' }
  }

  async function handleFile(file) {
    var v = validateFile(file)
    if (!v.valid) { showError(v.error); return }
    if (file.size > MAX) {
      showError('File too large (' + formatFileSize(file.size) + ').')
      return
    }
    currentFile = file
    showState('settings')
  }

  async function process() {
    if (!currentFile) return
    showState('progress')
    try {
      await ensureFfmpeg()
      if (progressText) progressText.textContent = 'Processing...'
      var opts = readOpts()
      var inputName = 'input' + (currentFile.name.match(/\.[^.]+$/) || ['.bin'])[0]
      var outputName = 'output' + outputExt
      var data = new Uint8Array(await currentFile.arrayBuffer())
      await ffmpeg.writeFile(inputName, data)
      var args = buildArgs(Object.assign({}, opts, { inputName: inputName, outputName: outputName }))
      await ffmpeg.exec(args)
      var out = await ffmpeg.readFile(outputName)
      var mime = outputExt === '.gif' ? 'image/gif'
        : outputExt === '.png' ? 'image/png'
        : outputExt === '.webp' ? 'image/webp'
        : outputExt === '.apng' ? 'image/apng'
        : outputExt === '.mp3' ? 'audio/mpeg'
        : 'video/mp4'
      var blob = new Blob([out.buffer || out], { type: mime })
      if (resultBlobUrl) URL.revokeObjectURL(resultBlobUrl)
      resultBlobUrl = URL.createObjectURL(blob)
      if (resultMedia) {
        if (mime.startsWith('video/') || mime.startsWith('audio/')) {
          resultMedia.src = resultBlobUrl
        } else {
          resultMedia.src = resultBlobUrl
        }
      }
      if (progressFill) progressFill.style.width = '100%'
      showState('result')
    } catch (e) {
      showError('Processing failed: ' + (e.message || String(e)))
    }
  }

  if (dropzone) {
    dropzone.addEventListener('click', function () { fileInput.click() })
    dropzone.addEventListener('drop', function (e) {
      e.preventDefault()
      if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0])
    })
  }
  if (fileInput) {
    fileInput.addEventListener('change', function () {
      if (fileInput.files[0]) handleFile(fileInput.files[0])
    })
  }
  if (processBtn) processBtn.addEventListener('click', process)
  if (downloadBtn) {
    downloadBtn.addEventListener('click', function () {
      if (!resultBlobUrl || !currentFile) return
      var name = getOutputName
        ? getOutputName(currentFile.name, outputSuffix, outputExt)
        : currentFile.name.replace(/\.[^.]+$/, '') + '-' + outputSuffix + outputExt
      var a = document.createElement('a')
      a.href = resultBlobUrl
      a.download = name
      a.click()
    })
  }

  showState('upload')
}
