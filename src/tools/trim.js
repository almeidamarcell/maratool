import { validateVideoFile, formatDuration, formatFileSize } from './fps-converter-core.js'
import { validateTrimRange, buildTrimArgs, buildTrimReencodeArgs, getOutputFilename } from './trim-core.js'

;(function () {
  'use strict'

  // ── DOM refs ──
  var dropzone = document.getElementById('tv-dropzone')
  var fileInput = document.getElementById('tv-file-input')
  var infoEl = document.getElementById('tv-info')
  var mobileBanner = document.getElementById('tv-mobile-banner')
  var mobileBannerDismiss = document.getElementById('tv-mobile-banner-dismiss')
  var settingsEl = document.getElementById('tv-settings')
  var videoEl = document.getElementById('tv-video')
  var durationEl = document.getElementById('tv-duration')
  var dimensionsEl = document.getElementById('tv-dimensions')
  var filesizeEl = document.getElementById('tv-filesize')
  var startInput = document.getElementById('tv-start')
  var endInput = document.getElementById('tv-end')
  var startRange = document.getElementById('tv-start-range')
  var endRange = document.getElementById('tv-end-range')
  var rangeFill = document.getElementById('tv-range-fill')
  var useStartBtn = document.getElementById('tv-use-start')
  var useEndBtn = document.getElementById('tv-use-end')
  var trimDurationEl = document.getElementById('tv-trim-duration')
  var trimBtn = document.getElementById('tv-trim')
  var changeBtn = document.getElementById('tv-change')
  var progressEl = document.getElementById('tv-progress')
  var progressText = document.getElementById('tv-progress-text')
  var progressFill = document.getElementById('tv-progress-fill')
  var progressDetail = document.getElementById('tv-progress-detail')
  var errorEl = document.getElementById('tv-error')
  var errorText = document.getElementById('tv-error-text')
  var errorRetry = document.getElementById('tv-error-retry')
  var resultEl = document.getElementById('tv-result')
  var resultVideo = document.getElementById('tv-result-video')
  var resultStats = document.getElementById('tv-result-stats')
  var downloadBtn = document.getElementById('tv-download')
  var newBtn = document.getElementById('tv-new')

  // ── State ──
  var ffmpeg = null
  var ffmpegLoaded = false
  var fetchFile = null
  var currentFile = null
  var previewUrl = null
  var resultBlobUrl = null
  var videoDuration = 0
  var MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024 // 2 GB

  // ── Mobile banner (R12 — V1 inline banner; modal extracted in V2) ──
  if (mobileBanner && window.matchMedia('(max-width: 768px)').matches) {
    var dismissed = false
    try { dismissed = localStorage.getItem('mt:trim-mobile-nudge') === '1' } catch (_) {}
    if (!dismissed) mobileBanner.style.display = ''
  }
  if (mobileBannerDismiss) {
    mobileBannerDismiss.addEventListener('click', function () {
      mobileBanner.style.display = 'none'
      try { localStorage.setItem('mt:trim-mobile-nudge', '1') } catch (_) {}
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
      videoDuration = videoEl.duration
      durationEl.textContent = formatDuration(videoDuration)
      dimensionsEl.textContent = videoEl.videoWidth + '×' + videoEl.videoHeight

      var defaultEnd = videoDuration
      startInput.value = '0'
      endInput.value = defaultEnd.toFixed(1)
      startInput.max = videoDuration.toFixed(1)
      endInput.max = videoDuration.toFixed(1)
      startRange.max = videoDuration.toFixed(2)
      endRange.max = videoDuration.toFixed(2)
      startRange.value = '0'
      endRange.value = defaultEnd.toFixed(2)
      updateTrimDuration()
    }
    showState('settings')
  }

  // ── Range slider <-> numeric input sync ──
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)) }

  function syncFromRange() {
    var s = parseFloat(startRange.value) || 0
    var e = parseFloat(endRange.value) || 0
    if (s >= e) {
      // Don't let handles cross — push the one that wasn't just moved
      if (document.activeElement === startRange) {
        s = Math.max(0, e - 0.1)
        startRange.value = s.toFixed(2)
      } else {
        e = Math.min(videoDuration, s + 0.1)
        endRange.value = e.toFixed(2)
      }
    }
    startInput.value = s.toFixed(1)
    endInput.value = e.toFixed(1)
    updateTrimDuration()
    updateRangeFill()
  }

  function syncFromNumeric() {
    var s = clamp(parseFloat(startInput.value) || 0, 0, videoDuration)
    var e = clamp(parseFloat(endInput.value) || videoDuration, 0, videoDuration)
    if (e <= s) e = clamp(s + 0.1, 0, videoDuration)
    startRange.value = s.toFixed(2)
    endRange.value = e.toFixed(2)
    updateTrimDuration()
    updateRangeFill()
  }

  function updateRangeFill() {
    if (!videoDuration || videoDuration <= 0) return
    var s = parseFloat(startRange.value) || 0
    var e = parseFloat(endRange.value) || 0
    var leftPct = (s / videoDuration) * 100
    var rightPct = (e / videoDuration) * 100
    rangeFill.style.left = leftPct + '%'
    rangeFill.style.width = (rightPct - leftPct) + '%'
  }

  function updateTrimDuration() {
    var s = parseFloat(startInput.value) || 0
    var e = parseFloat(endInput.value) || 0
    trimDurationEl.textContent = Math.max(0, e - s).toFixed(1) + 's'
  }

  startRange.addEventListener('input', syncFromRange)
  endRange.addEventListener('input', syncFromRange)
  startInput.addEventListener('input', syncFromNumeric)
  endInput.addEventListener('input', syncFromNumeric)
  useStartBtn.addEventListener('click', function () {
    startInput.value = videoEl.currentTime.toFixed(1); syncFromNumeric()
  })
  useEndBtn.addEventListener('click', function () {
    endInput.value = videoEl.currentTime.toFixed(1); syncFromNumeric()
  })

  // ── FFmpeg loading (uses shared ffmpeg-loader.js) ──
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
        var trimStart = parseFloat(startInput.value) || 0
        var trimEnd = parseFloat(endInput.value) || 0
        var trimLen = Math.max(0.1, trimEnd - trimStart)
        var timeMatch = e.message.match(/time=(\d+):(\d+):(\d+\.\d+)/)
        if (timeMatch) {
          var secs = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseFloat(timeMatch[3])
          var pct = Math.min(Math.round((secs / trimLen) * 100), 99)
          progressFill.style.width = (50 + pct * 0.45) + '%'
          progressDetail.textContent = 'Trimming... ' + pct + '%'
        }
      }
    })

    ffmpeg = ff
    ffmpegLoaded = true
    progressFill.style.width = '50%'
    return ffmpeg
  }

  // ── Trim ──
  trimBtn.addEventListener('click', async function () {
    var trimStart = parseFloat(startInput.value) || 0
    var trimEnd = parseFloat(endInput.value) || videoDuration

    var validation = validateTrimRange({ start: trimStart, end: trimEnd, duration: videoDuration })
    if (!validation.valid) { showError(validation.error); return }

    try {
      var ff = await loadFfmpeg()
      progressText.textContent = 'Trimming video...'
      progressFill.style.width = '50%'
      progressDetail.textContent = 'Writing file to memory...'

      var inputExt = getExtension(currentFile.name)
      var inputName = 'input' + inputExt
      var outputName = 'output' + inputExt

      var fileData = await fetchFile(currentFile)
      await ff.writeFile(inputName, fileData)

      // Lossless path: -c copy
      ff._lastLogs.length = 0
      progressDetail.textContent = 'Trimming (lossless)...'
      var args = buildTrimArgs({ start: trimStart, end: trimEnd, inputName: inputName, outputName: outputName })
      var ret = await ff.exec(args)

      // Fall back to re-encode if lossless failed
      if (ret !== 0) {
        ff._lastLogs.length = 0
        progressDetail.textContent = 'Re-encoding for compatibility...'
        try { await ff.deleteFile(outputName) } catch (_) {}
        var reArgs = buildTrimReencodeArgs({ start: trimStart, end: trimEnd, inputName: inputName, outputName: outputName })
        ret = await ff.exec(reArgs)
        if (ret !== 0) {
          throw new Error('Trim failed (code ' + ret + '): ' + ff._lastLogs.slice(-3).join(' '))
        }
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
      var trimLen = trimEnd - trimStart
      resultStats.innerHTML = '<strong>' + trimLen.toFixed(1) + 's</strong> trimmed — <strong>' + formatFileSize(blob.size) + '</strong>'

      showState('result')
    } catch (err) {
      console.error('Trim failed:', err)
      showError('Trim failed: ' + (err.message || String(err)).split('\n')[0])
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
    fileInput.value = ''; currentFile = null; videoDuration = 0
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
