import { validateVideoFile, formatDuration, formatFileSize } from './fps-converter-core.js'
import { buildMuteArgs, getOutputFilename } from './mute-video-core.js'

;(function () {
  'use strict'

  // ── DOM refs ──
  var dropzone = document.getElementById('mu-dropzone')
  var fileInput = document.getElementById('mu-file-input')
  var infoEl = document.getElementById('mu-info')
  var mobileBanner = document.getElementById('mu-mobile-banner')
  var mobileBannerDismiss = document.getElementById('mu-mobile-banner-dismiss')
  var settingsEl = document.getElementById('mu-settings')
  var videoEl = document.getElementById('mu-video')
  var durationEl = document.getElementById('mu-duration')
  var dimensionsEl = document.getElementById('mu-dimensions')
  var filesizeEl = document.getElementById('mu-filesize')
  var muteBtn = document.getElementById('mu-mute')
  var changeBtn = document.getElementById('mu-change')
  var progressEl = document.getElementById('mu-progress')
  var progressText = document.getElementById('mu-progress-text')
  var progressFill = document.getElementById('mu-progress-fill')
  var progressDetail = document.getElementById('mu-progress-detail')
  var errorEl = document.getElementById('mu-error')
  var errorText = document.getElementById('mu-error-text')
  var errorRetry = document.getElementById('mu-error-retry')
  var resultEl = document.getElementById('mu-result')
  var resultVideo = document.getElementById('mu-result-video')
  var resultStats = document.getElementById('mu-result-stats')
  var downloadBtn = document.getElementById('mu-download')
  var newBtn = document.getElementById('mu-new')

  // ── State ──
  var ffmpeg = null
  var ffmpegLoaded = false
  var fetchFile = null
  var currentFile = null
  var previewUrl = null
  var resultBlobUrl = null
  var MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024 // 2 GB

  // ── Mobile banner ──
  if (mobileBanner && window.matchMedia('(max-width: 768px)').matches) {
    var dismissed = false
    try { dismissed = localStorage.getItem('mt:mu-mobile-nudge') === '1' } catch (_) {}
    if (!dismissed) mobileBanner.style.display = ''
  }
  if (mobileBannerDismiss) {
    mobileBannerDismiss.addEventListener('click', function () {
      mobileBanner.style.display = 'none'
      try { localStorage.setItem('mt:mu-mobile-nudge', '1') } catch (_) {}
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
    var validation = validateVideoFile(file)
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
        // Lossless copy — minimal log output, just show progress
        var timeMatch = e.message.match(/time=(\d+):(\d+):(\d+\.\d+)/)
        if (timeMatch) {
          progressFill.style.width = '80%'
          progressDetail.textContent = 'Muting...'
        }
      }
    })

    ffmpeg = ff
    ffmpegLoaded = true
    progressFill.style.width = '50%'
    return ffmpeg
  }

  // ── Mute ──
  muteBtn.addEventListener('click', async function () {
    try {
      var ff = await loadFfmpeg()
      progressText.textContent = 'Removing audio...'
      progressFill.style.width = '50%'
      progressDetail.textContent = 'Writing file to memory...'

      var inputExt = getExtension(currentFile.name)
      var inputName = 'input' + inputExt
      var outputName = 'output' + inputExt

      var fileData = await fetchFile(currentFile)
      await ff.writeFile(inputName, fileData)

      ff._lastLogs.length = 0
      progressDetail.textContent = 'Stripping audio (lossless)...'
      var args = buildMuteArgs({ inputName: inputName, outputName: outputName })
      var ret = await ff.exec(args)

      if (ret !== 0) {
        throw new Error('Mute failed (code ' + ret + '): ' + ff._lastLogs.slice(-3).join(' '))
      }

      progressFill.style.width = '95%'
      progressDetail.textContent = 'Reading output...'

      var outputData = await ff.readFile(outputName)
      try { await ff.deleteFile(inputName) } catch (_) {}
      try { await ff.deleteFile(outputName) } catch (_) {}

      if (resultBlobUrl) URL.revokeObjectURL(resultBlobUrl)
      var mime = currentFile.type || 'video/mp4'
      var blob = new Blob([outputData.buffer || outputData], { type: mime })
      resultBlobUrl = URL.createObjectURL(blob)

      resultVideo.src = resultBlobUrl
      resultStats.innerHTML = 'Audio removed — <strong>' + formatFileSize(blob.size) + '</strong>'

      showState('result')
    } catch (err) {
      console.error('Mute failed:', err)
      showError('Mute failed: ' + (err.message || String(err)).split('\n')[0])
    }
  })

  function getExtension(filename) {
    var dot = filename.lastIndexOf('.')
    return dot === -1 ? '.mp4' : filename.substring(dot)
  }

  // ── Download ──
  downloadBtn.addEventListener('click', function () {
    if (!resultBlobUrl || !currentFile) return
    var a = document.createElement('a')
    a.href = resultBlobUrl
    a.download = getOutputFilename(currentFile.name)
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
