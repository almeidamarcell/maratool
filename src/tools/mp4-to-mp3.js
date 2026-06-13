import { validateVideoFile, formatDuration, formatFileSize } from './fps-converter-core.js'
import { validateBitrate, buildMp3Args, getOutputFilename } from './mp4-to-mp3-core.js'

;(function () {
  'use strict'

  // ── DOM refs ──
  var dropzone = document.getElementById('m3-dropzone')
  var fileInput = document.getElementById('m3-file-input')
  var infoEl = document.getElementById('m3-info')
  var mobileBanner = document.getElementById('m3-mobile-banner')
  var mobileBannerDismiss = document.getElementById('m3-mobile-banner-dismiss')
  var settingsEl = document.getElementById('m3-settings')
  var videoEl = document.getElementById('m3-video')
  var durationEl = document.getElementById('m3-duration')
  var dimensionsEl = document.getElementById('m3-dimensions')
  var filesizeEl = document.getElementById('m3-filesize')
  var bitrateSelect = document.getElementById('m3-bitrate')
  var extractBtn = document.getElementById('m3-extract')
  var changeBtn = document.getElementById('m3-change')
  var progressEl = document.getElementById('m3-progress')
  var progressText = document.getElementById('m3-progress-text')
  var progressFill = document.getElementById('m3-progress-fill')
  var progressDetail = document.getElementById('m3-progress-detail')
  var errorEl = document.getElementById('m3-error')
  var errorText = document.getElementById('m3-error-text')
  var errorRetry = document.getElementById('m3-error-retry')
  var resultEl = document.getElementById('m3-result')
  var resultAudio = document.getElementById('m3-result-audio')
  var resultStats = document.getElementById('m3-result-stats')
  var downloadBtn = document.getElementById('m3-download')
  var newBtn = document.getElementById('m3-new')

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
    try { dismissed = localStorage.getItem('mt:m3-mobile-nudge') === '1' } catch (_) {}
    if (!dismissed) mobileBanner.style.display = ''
  }
  if (mobileBannerDismiss) {
    mobileBannerDismiss.addEventListener('click', function () {
      mobileBanner.style.display = 'none'
      try { localStorage.setItem('mt:m3-mobile-nudge', '1') } catch (_) {}
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
        var timeMatch = e.message.match(/time=(\d+):(\d+):(\d+\.\d+)/)
        if (timeMatch) {
          var secs = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseFloat(timeMatch[3])
          var totalSecs = videoEl.duration || 1
          var pct = Math.min(Math.round((secs / totalSecs) * 100), 99)
          progressFill.style.width = (50 + pct * 0.45) + '%'
          progressDetail.textContent = 'Extracting audio... ' + pct + '%'
        }
      }
    })

    ffmpeg = ff
    ffmpegLoaded = true
    progressFill.style.width = '50%'
    return ffmpeg
  }

  // ── Extract ──
  extractBtn.addEventListener('click', async function () {
    var bitrate = bitrateSelect ? parseInt(bitrateSelect.value, 10) : 192
    var bitrateValidation = validateBitrate(bitrate)
    if (!bitrateValidation.valid) { showError(bitrateValidation.error); return }

    try {
      var ff = await loadFfmpeg()
      progressText.textContent = 'Extracting audio...'
      progressFill.style.width = '50%'
      progressDetail.textContent = 'Writing file to memory...'

      var inputName = 'input' + getExt(currentFile.name)
      var outputName = 'output.mp3'

      var fileData = await fetchFile(currentFile)
      await ff.writeFile(inputName, fileData)

      ff._lastLogs.length = 0
      progressDetail.textContent = 'Converting to MP3...'

      var args = buildMp3Args({ inputName: inputName, outputName: outputName, bitrate: bitrate })
      var ret = await ff.exec(args)

      if (ret !== 0) {
        throw new Error('Extraction failed (code ' + ret + '): ' + ff._lastLogs.slice(-3).join(' '))
      }

      progressFill.style.width = '95%'
      progressDetail.textContent = 'Reading output...'

      var outputData = await ff.readFile(outputName)
      try { await ff.deleteFile(inputName) } catch (_) {}
      try { await ff.deleteFile(outputName) } catch (_) {}

      if (resultBlobUrl) URL.revokeObjectURL(resultBlobUrl)
      var blob = new Blob([outputData.buffer || outputData], { type: 'audio/mpeg' })
      resultBlobUrl = URL.createObjectURL(blob)

      resultAudio.src = resultBlobUrl
      resultStats.innerHTML = '<strong>' + formatFileSize(blob.size) + '</strong> — ' + bitrate + ' kbps MP3'

      showState('result')
    } catch (err) {
      console.error('Extraction failed:', err)
      showError('Extraction failed: ' + (err.message || String(err)).split('\n')[0])
    }
  })

  function getExt(filename) {
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
    videoEl.src = ''
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
