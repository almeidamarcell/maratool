import { loadFFmpeg } from './ffmpeg-loader.js'
import { validateVideoFile, formatFileSize } from './fps-converter-core.js'
import { setVisible, nextPaint, makeProgress } from './tool-utils.js'

// FFmpeg reports the output timestamp it has reached on stderr. We rarely know
// the target duration up front here, so surface it as elapsed media time rather
// than inventing a percentage.
export function parseFfmpegTime(message) {
  var m = /time=(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(message || '')
  if (!m) return null
  return parseInt(m[1], 10) * 3600 + parseInt(m[2], 10) * 60 + parseFloat(m[3])
}

export function formatClock(seconds) {
  var s = Math.max(0, Math.floor(seconds))
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0')
}

// Matches a File against an <input accept="..."> list: exact MIME types,
// `type/*` wildcards, and `.ext` suffixes.
export function matchesAccept(file, acceptAttr) {
  if (!acceptAttr) return true
  var type = (file.type || '').toLowerCase()
  var name = (file.name || '').toLowerCase()
  return acceptAttr.split(',').some(function (raw) {
    var pattern = raw.trim().toLowerCase()
    if (!pattern) return false
    if (pattern.charAt(0) === '.') return name.endsWith(pattern)
    if (pattern.slice(-2) === '/*') return type !== '' && type.indexOf(pattern.slice(0, -1)) === 0
    return type === pattern
  })
}

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
  var progressDetail = document.getElementById(prefix + '-progress-detail')
  var progress = makeProgress(progressText, progressFill)
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
    setVisible(dropzone, state === 'upload')
    setVisible(settingsEl, state === 'settings')
    setVisible(progressEl, state === 'progress')
    setVisible(resultEl, state === 'result')
    setVisible(errorEl, state === 'error')
    if (state !== 'progress') progress.reset()
  }

  function showError(msg) {
    if (errorText) errorText.textContent = msg
    showState('error')
  }

  function setDetail(text) {
    if (progressDetail) progressDetail.textContent = text || ''
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
    // The 25 MB WASM download dominates the first run. loadFFmpeg reports 5→50,
    // which maps onto the first half of the bar.
    progress.set('Loading FFmpeg…', 0)
    setDetail('Downloading ~25 MB (cached after first use)')
    var result = await loadFFmpeg(function (pct, detail) {
      progress.set('Loading FFmpeg…', Math.min(pct, 50) / 100)
      if (detail) setDetail(detail)
    })
    ffmpeg = result.ff
    ffmpeg.on('log', function (e) {
      var secs = parseFfmpegTime(e && e.message)
      if (secs != null) setDetail(formatClock(secs) + ' processed')
    })
    ffmpegLoaded = true
  }

  function validateFile(file) {
    if (acceptAudio && file.type.startsWith('audio/')) return { valid: true }
    if (acceptVideo) return validateVideoFile(file)
    // With neither flag set this used to reject unconditionally, so the six
    // GIF/WebP converters wired that way refused every upload. The file
    // input's own accept attribute is the real contract — honour it.
    if (matchesAccept(file, fileInput && fileInput.accept)) return { valid: true }
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
    progress.set('Loading FFmpeg…', 0)
    setDetail(currentFile.name + ' · ' + formatFileSize(currentFile.size))
    showState('progress')
    await nextPaint()
    try {
      await ensureFfmpeg()
      progress.set('Reading file…', 0.55)
      var opts = readOpts()
      var inputName = 'input' + (currentFile.name.match(/\.[^.]+$/) || ['.bin'])[0]
      var outputName = 'output' + outputExt
      var data = new Uint8Array(await currentFile.arrayBuffer())
      await ffmpeg.writeFile(inputName, data)
      // No reliable total to divide by here, so run the bar indeterminate and
      // let the log handler report elapsed media time underneath it.
      progress.pending('Converting…')
      var args = buildArgs(Object.assign({}, opts, { inputName: inputName, outputName: outputName }))
      await ffmpeg.exec(args)
      progress.set('Finishing…', 0.95)
      setDetail('')
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
      progress.done('Done')
      showState('result')
    } catch (e) {
      showError('Processing failed: ' + (e.message || String(e)))
    }
  }

  if (dropzone) {
    dropzone.addEventListener('click', function () { fileInput.click() })
    // Without preventDefault on dragover the browser takes the default action
    // and navigates away to the dropped file — drop never reached handleFile.
    dropzone.addEventListener('dragover', function (e) {
      e.preventDefault()
      dropzone.classList.add('drag-over')
    })
    dropzone.addEventListener('dragleave', function () { dropzone.classList.remove('drag-over') })
    dropzone.addEventListener('drop', function (e) {
      e.preventDefault()
      dropzone.classList.remove('drag-over')
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
