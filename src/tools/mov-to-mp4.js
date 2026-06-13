import { formatDuration, formatFileSize } from './fps-converter-core.js'
import { buildLosslessArgs, buildReencodeArgs, getOutputFilename, validateFormatInput } from './format-convert-core.js'

;(function () {
  'use strict'

  // ── DOM refs ──
  var dropzone = document.getElementById('mm-dropzone')
  var fileInput = document.getElementById('mm-file-input')
  var infoEl = document.getElementById('mm-info')
  var mobileBanner = document.getElementById('mm-mobile-banner')
  var mobileBannerDismiss = document.getElementById('mm-mobile-banner-dismiss')
  var settingsEl = document.getElementById('mm-settings')
  var videoEl = document.getElementById('mm-video')
  var durationEl = document.getElementById('mm-duration')
  var dimensionsEl = document.getElementById('mm-dimensions')
  var filesizeEl = document.getElementById('mm-filesize')
  var convertBtn = document.getElementById('mm-convert')
  var changeBtn = document.getElementById('mm-change')
  var progressEl = document.getElementById('mm-progress')
  var progressText = document.getElementById('mm-progress-text')
  var progressFill = document.getElementById('mm-progress-fill')
  var progressDetail = document.getElementById('mm-progress-detail')
  var errorEl = document.getElementById('mm-error')
  var errorText = document.getElementById('mm-error-text')
  var errorRetry = document.getElementById('mm-error-retry')
  var resultEl = document.getElementById('mm-result')
  var resultVideo = document.getElementById('mm-result-video')
  var resultStats = document.getElementById('mm-result-stats')
  var downloadBtn = document.getElementById('mm-download')
  var newBtn = document.getElementById('mm-new')

  // ── State ──
  var ffmpeg = null
  var ffmpegLoaded = false
  var fetchFile = null
  var currentFile = null
  var previewUrl = null
  var resultBlobUrl = null
  var MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024 // 2 GB
  var ALLOWED_TYPES = ['video/quicktime']

  // ── Mobile banner ──
  if (mobileBanner && window.matchMedia('(max-width: 768px)').matches) {
    var dismissed = false
    try { dismissed = localStorage.getItem('mt:mov-mp4-mobile-nudge') === '1' } catch (_) {}
    if (!dismissed) mobileBanner.style.display = ''
  }
  if (mobileBannerDismiss) {
    mobileBannerDismiss.addEventListener('click', function () {
      mobileBanner.style.display = 'none'
      try { localStorage.setItem('mt:mov-mp4-mobile-nudge', '1') } catch (_) {}
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
      progressText.textContent = 'Converting to MP4...'
      progressFill.style.width = '50%'
      progressDetail.textContent = 'Writing file to memory...'

      var inputName = 'input.mov'
      var outputName = 'output.mp4'

      var fileData = await fetchFile(currentFile)
      await ff.writeFile(inputName, fileData)

      // Lossless path: -c copy
      ff._lastLogs.length = 0
      progressDetail.textContent = 'Converting (lossless)...'
      var args = buildLosslessArgs({ inputName: inputName, outputName: outputName })
      var ret = await ff.exec(args)

      // Fallback to re-encode if lossless failed
      if (ret !== 0) {
        ff._lastLogs.length = 0
        progressDetail.textContent = 'Re-encoding for compatibility...'
        try { await ff.deleteFile(outputName) } catch (_) {}
        var reArgs = buildReencodeArgs({
          inputName: inputName,
          outputName: outputName,
          vcodec: 'libx264',
          acodec: 'aac',
          extraVideoArgs: ['-preset', 'veryfast', '-crf', '22']
        })
        ret = await ff.exec(reArgs)
        if (ret !== 0) {
          throw new Error('Conversion failed (code ' + ret + '): ' + ff._lastLogs.slice(-3).join(' '))
        }
      }

      progressFill.style.width = '95%'
      progressDetail.textContent = 'Reading output...'

      var outputData = await ff.readFile(outputName)
      try { await ff.deleteFile(inputName) } catch (_) {}
      try { await ff.deleteFile(outputName) } catch (_) {}

      if (resultBlobUrl) URL.revokeObjectURL(resultBlobUrl)
      var blob = new Blob([outputData.buffer || outputData], { type: 'video/mp4' })
      resultBlobUrl = URL.createObjectURL(blob)

      resultVideo.src = resultBlobUrl
      resultStats.innerHTML = '<strong>' + formatFileSize(blob.size) + '</strong> — MP4 output'

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
    a.download = getOutputFilename(currentFile.name, '.mp4')
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
