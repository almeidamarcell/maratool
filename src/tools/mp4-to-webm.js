import { formatDuration, formatFileSize } from './fps-converter-core.js'
import { buildReencodeArgs, getOutputFilename, validateFormatInput } from './format-convert-core.js'

;(function () {
  'use strict'

  // ── DOM refs ──
  var dropzone = document.getElementById('mw-dropzone')
  var fileInput = document.getElementById('mw-file-input')
  var infoEl = document.getElementById('mw-info')
  var mobileBanner = document.getElementById('mw-mobile-banner')
  var mobileBannerDismiss = document.getElementById('mw-mobile-banner-dismiss')
  var settingsEl = document.getElementById('mw-settings')
  var videoEl = document.getElementById('mw-video')
  var durationEl = document.getElementById('mw-duration')
  var dimensionsEl = document.getElementById('mw-dimensions')
  var filesizeEl = document.getElementById('mw-filesize')
  var convertBtn = document.getElementById('mw-convert')
  var changeBtn = document.getElementById('mw-change')
  var progressEl = document.getElementById('mw-progress')
  var progressText = document.getElementById('mw-progress-text')
  var progressFill = document.getElementById('mw-progress-fill')
  var progressDetail = document.getElementById('mw-progress-detail')
  var errorEl = document.getElementById('mw-error')
  var errorText = document.getElementById('mw-error-text')
  var errorRetry = document.getElementById('mw-error-retry')
  var resultEl = document.getElementById('mw-result')
  var resultVideo = document.getElementById('mw-result-video')
  var resultStats = document.getElementById('mw-result-stats')
  var downloadBtn = document.getElementById('mw-download')
  var newBtn = document.getElementById('mw-new')

  // ── State ──
  var ffmpeg = null
  var ffmpegLoaded = false
  var fetchFile = null
  var currentFile = null
  var previewUrl = null
  var resultBlobUrl = null
  var MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024 // 2 GB
  var ALLOWED_TYPES = ['video/mp4']

  // ── Mobile banner ──
  if (mobileBanner && window.matchMedia('(max-width: 768px)').matches) {
    var dismissed = false
    try { dismissed = localStorage.getItem('mt:mp4-webm-mobile-nudge') === '1' } catch (_) {}
    if (!dismissed) mobileBanner.style.display = ''
  }
  if (mobileBannerDismiss) {
    mobileBannerDismiss.addEventListener('click', function () {
      mobileBanner.style.display = 'none'
      try { localStorage.setItem('mt:mp4-webm-mobile-nudge', '1') } catch (_) {}
    })
  }

  // ── State management ──
  function showState(state) {
    dropzone.style.display = state === 'dropzone' ? '' : 'none'
    infoEl.style.display = state === 'dropzone' ? '' : 'none'
    settingsEl.style.display = state === 'settings' ? '' : 'none'
    progressEl.style.display = state === 'progress' ? '' : 'none'
    errorEl.style.display = state === 'error' ? '' : 'none'
    resultEl.style.display = state === 'result' ? '' : 'none'
  }

  function showError(msg) { errorText.textContent = msg; showState('error') }

  // ── Drop zone ──
  dropzone.addEventListener('click', function () { fileInput.click() })
  dropzone.addEventListener('dragover', function (e) { e.preventDefault(); dropzone.classList.add('drag-over') })
  dropzone.addEventListener('dragleave', function () { dropzone.classList.remove('drag-over') })
  dropzone.addEventListener('drop', function (e) {
    e.preventDefault(); dropzone.classList.remove('drag-over')
    if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0])
  })
  fileInput.addEventListener('change', function () {
    if (fileInput.files.length > 0) handleFile(fileInput.files[0])
  })

  // ── File handling ──
  function handleFile(file) {
    var validation = validateFormatInput(file, ALLOWED_TYPES)
    if (!validation.valid) { showError(validation.error); return }
    if (file.size > MAX_FILE_SIZE) {
      showError('File too large (' + formatFileSize(file.size) + '). Maximum is 2 GB.')
      return
    }
    currentFile = file
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    previewUrl = URL.createObjectURL(file)
    videoEl.src = previewUrl
    filesizeEl.textContent = formatFileSize(file.size)
    durationEl.textContent = '...'
    dimensionsEl.textContent = '...'

    videoEl.onloadedmetadata = function () {
      durationEl.textContent = formatDuration(videoEl.duration)
      dimensionsEl.textContent = videoEl.videoWidth + '×' + videoEl.videoHeight
    }
    showState('settings')
  }

  // ── FFmpeg loading ──
  async function loadFfmpeg() {
    if (ffmpeg && ffmpegLoaded) return ffmpeg

    showState('progress')
    progressText.textContent = 'Loading FFmpeg engine...'
    progressFill.style.width = '0%'
    progressDetail.textContent = 'Downloading ~25 MB (cached after first use)'

    var loader = await import('./ffmpeg-loader.js')
    var result = await loader.loadFFmpeg(function (pct, detail) {
      progressFill.style.width = pct + '%'
      progressDetail.textContent = detail
    })

    var ff = result.ff
    fetchFile = result.fetchFile

    ff.on('log', function (e) {
      if (e.message) {
        console.log('[ffmpeg]', e.message)
        ff._lastLogs.push(e.message)
        if (ff._lastLogs.length > 30) ff._lastLogs.shift()
        var timeMatch = e.message.match(/time=(\d+):(\d+):(\d+\.\d+)/)
        if (timeMatch) {
          var secs = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseFloat(timeMatch[3])
          var dur = videoEl.duration || 60
          var pct = Math.min(Math.round((secs / dur) * 100), 99)
          progressFill.style.width = (50 + pct * 0.45) + '%'
          progressDetail.textContent = 'Converting... ' + pct + '%'
        }
      }
    })

    ffmpeg = ff
    ffmpegLoaded = true
    progressFill.style.width = '50%'
    return ffmpeg
  }

  // ── Convert ──
  convertBtn.addEventListener('click', async function () {
    try {
      var ff = await loadFfmpeg()
      progressText.textContent = 'Converting to WebM...'
      progressFill.style.width = '50%'
      progressDetail.textContent = 'Writing file to memory...'

      var inputName = 'input.mp4'
      var outputName = 'output.webm'

      var fileData = await fetchFile(currentFile)
      await ff.writeFile(inputName, fileData)

      ff._lastLogs.length = 0
      progressDetail.textContent = 'Encoding VP9 + Opus...'
      var args = buildReencodeArgs({
        inputName: inputName,
        outputName: outputName,
        vcodec: 'libvpx-vp9',
        acodec: 'libopus',
        extraVideoArgs: ['-b:v', '1M', '-deadline', 'realtime', '-cpu-used', '5']
      })
      var ret = await ff.exec(args)

      if (ret !== 0) {
        throw new Error('Conversion failed (code ' + ret + '): ' + ff._lastLogs.slice(-3).join(' '))
      }

      progressFill.style.width = '95%'
      progressDetail.textContent = 'Reading output...'

      var outputData = await ff.readFile(outputName)
      try { await ff.deleteFile(inputName) } catch (_) {}
      try { await ff.deleteFile(outputName) } catch (_) {}

      if (resultBlobUrl) URL.revokeObjectURL(resultBlobUrl)
      var blob = new Blob([outputData.buffer || outputData], { type: 'video/webm' })
      resultBlobUrl = URL.createObjectURL(blob)

      resultVideo.src = resultBlobUrl
      resultStats.innerHTML = '<strong>' + formatFileSize(blob.size) + '</strong> — WebM (VP9 + Opus)'

      showState('result')
    } catch (err) {
      console.error('Conversion failed:', err)
      showError('Conversion failed: ' + (err.message || String(err)).split('\n')[0])
    }
  })

  // ── Download ──
  downloadBtn.addEventListener('click', function () {
    if (!resultBlobUrl || !currentFile) return
    var a = document.createElement('a')
    a.href = resultBlobUrl
    a.download = getOutputFilename(currentFile.name, '.webm')
    a.click()
  })

  // ── Reset ──
  function reset() {
    fileInput.value = ''; currentFile = null
    if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = null }
    if (resultBlobUrl) { URL.revokeObjectURL(resultBlobUrl); resultBlobUrl = null }
    showState('dropzone')
  }

  changeBtn.addEventListener('click', function () {
    if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = null }
    fileInput.value = ''; currentFile = null; showState('dropzone')
  })
  newBtn.addEventListener('click', reset)
  errorRetry.addEventListener('click', reset)

  showState('dropzone')
})()
