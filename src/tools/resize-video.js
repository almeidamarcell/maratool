import { validateVideoFile, formatDuration, formatFileSize } from './fps-converter-core.js'
import { validatePreset, getPresetDimensions, buildResizeArgs, computeAspectHeight, computeAspectWidth, getOutputFilename } from './resize-video-core.js'

;(function () {
  'use strict'

  // ── DOM refs ──
  var dropzone    = document.getElementById('rs-dropzone')
  var fileInput   = document.getElementById('rs-file-input')
  var infoEl      = document.getElementById('rs-info')
  var mobileBanner = document.getElementById('rs-mobile-banner')
  var mobileBannerDismiss = document.getElementById('rs-mobile-banner-dismiss')
  var settingsEl  = document.getElementById('rs-settings')
  var videoEl     = document.getElementById('rs-video')
  var durationEl  = document.getElementById('rs-duration')
  var dimensionsEl = document.getElementById('rs-dimensions')
  var filesizeEl  = document.getElementById('rs-filesize')
  var origResEl   = document.getElementById('rs-orig-res')
  var presetRadios = document.querySelectorAll('input[name="rs-preset"]')
  var customFields = document.getElementById('rs-custom-fields')
  var widthInput  = document.getElementById('rs-width')
  var heightInput = document.getElementById('rs-height')
  var aspectLock  = document.getElementById('rs-aspect-lock')
  var targetLine  = document.getElementById('rs-target-line')
  var resizeBtn   = document.getElementById('rs-resize')
  var changeBtn   = document.getElementById('rs-change')
  var progressEl  = document.getElementById('rs-progress')
  var progressText = document.getElementById('rs-progress-text')
  var progressFill = document.getElementById('rs-progress-fill')
  var progressDetail = document.getElementById('rs-progress-detail')
  var errorEl     = document.getElementById('rs-error')
  var errorText   = document.getElementById('rs-error-text')
  var errorRetry  = document.getElementById('rs-error-retry')
  var resultEl    = document.getElementById('rs-result')
  var resultVideo = document.getElementById('rs-result-video')
  var resultStats = document.getElementById('rs-result-stats')
  var downloadBtn = document.getElementById('rs-download')
  var newBtn      = document.getElementById('rs-new')

  // ── State ──
  var ffmpeg = null
  var ffmpegLoaded = false
  var fetchFile = null
  var currentFile = null
  var previewUrl = null
  var resultBlobUrl = null
  var origWidth = 0
  var origHeight = 0
  var MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024 // 2 GB

  // ── Mobile banner ──
  if (mobileBanner && window.matchMedia('(max-width: 768px)').matches) {
    var dismissed = false
    try { dismissed = localStorage.getItem('mt:rs-mobile-nudge') === '1' } catch (_) {}
    if (!dismissed) mobileBanner.style.display = ''
  }
  if (mobileBannerDismiss) {
    mobileBannerDismiss.addEventListener('click', function () {
      mobileBanner.style.display = 'none'
      try { localStorage.setItem('mt:rs-mobile-nudge', '1') } catch (_) {}
    })
  }

  // ── State management ──
  function showState(state) {
    dropzone.style.display   = state === 'dropzone'  ? '' : 'none'
    infoEl.style.display     = state === 'dropzone'  ? '' : 'none'
    settingsEl.style.display = state === 'settings'  ? '' : 'none'
    progressEl.style.display = state === 'progress'  ? '' : 'none'
    errorEl.style.display    = state === 'error'     ? '' : 'none'
    resultEl.style.display   = state === 'result'    ? '' : 'none'
  }

  function showError(msg) { errorText.textContent = msg; showState('error') }

  // ── Dropzone ──
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
    origResEl.textContent = '...'

    videoEl.onloadedmetadata = function () {
      origWidth = videoEl.videoWidth
      origHeight = videoEl.videoHeight
      durationEl.textContent = formatDuration(videoEl.duration)
      dimensionsEl.textContent = origWidth + '×' + origHeight
      origResEl.textContent = 'Original: ' + origWidth + '×' + origHeight

      // Seed custom inputs from current dimensions
      widthInput.value = origWidth
      heightInput.value = origHeight

      // Reset to default preset (720p)
      setPreset('720')
      showState('settings')
    }
  }

  // ── Preset handling ──
  function getSelectedPreset() {
    for (var i = 0; i < presetRadios.length; i++) {
      if (presetRadios[i].checked) return presetRadios[i].value
    }
    return '720'
  }

  function setPreset(value) {
    for (var i = 0; i < presetRadios.length; i++) {
      if (presetRadios[i].value === value) presetRadios[i].checked = true
    }
    onPresetChange()
  }

  function onPresetChange() {
    var preset = getSelectedPreset()
    if (preset === 'custom') {
      customFields.style.display = ''
      updateTargetLine()
      return
    }
    customFields.style.display = 'none'
    var dims = getPresetDimensions(preset)
    if (dims) updateTargetLine(dims.width, dims.height)
  }

  function updateTargetLine(w, h) {
    if (w === undefined) {
      var preset = getSelectedPreset()
      if (preset === 'custom') {
        w = parseInt(widthInput.value, 10) || origWidth
        h = parseInt(heightInput.value, 10) || origHeight
      } else {
        var dims = getPresetDimensions(preset)
        w = dims ? dims.width : origWidth
        h = dims ? dims.height : -2
      }
    }
    var hLabel = h === -2 ? 'auto' : h
    targetLine.textContent = 'Target output: ' + w + '×' + hLabel
  }

  for (var i = 0; i < presetRadios.length; i++) {
    presetRadios[i].addEventListener('change', onPresetChange)
  }

  // ── Custom W/H inputs with aspect-lock ──
  widthInput.addEventListener('input', function () {
    if (getSelectedPreset() !== 'custom') return
    if (aspectLock.checked && origWidth && origHeight) {
      var w = parseInt(widthInput.value, 10)
      if (w > 0) heightInput.value = computeAspectHeight(w, origWidth, origHeight)
    }
    updateTargetLine()
  })

  heightInput.addEventListener('input', function () {
    if (getSelectedPreset() !== 'custom') return
    if (aspectLock.checked && origWidth && origHeight) {
      var h = parseInt(heightInput.value, 10)
      if (h > 0) widthInput.value = computeAspectWidth(h, origWidth, origHeight)
    }
    updateTargetLine()
  })

  aspectLock.addEventListener('change', updateTargetLine)

  // ── Resolve final width/height for FFmpeg ──
  function resolveDimensions() {
    var preset = getSelectedPreset()
    if (preset !== 'custom') {
      var dims = getPresetDimensions(preset)
      return dims ? { width: dims.width, height: dims.height } : null
    }
    var w = parseInt(widthInput.value, 10)
    var h = parseInt(heightInput.value, 10)
    if (!w || !h || w < 2 || h < 2) return null
    return { width: w, height: h }
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
      if (!e.message) return
      ff._lastLogs.push(e.message)
      if (ff._lastLogs.length > 30) ff._lastLogs.shift()
      var timeMatch = e.message.match(/time=(\d+):(\d+):(\d+\.\d+)/)
      if (timeMatch) {
        var secs = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseFloat(timeMatch[3])
        var totalSecs = videoEl.duration || 60
        var pct = Math.min(Math.round((secs / totalSecs) * 100), 99)
        progressFill.style.width = (50 + pct * 0.45) + '%'
        progressDetail.textContent = 'Resizing... ' + pct + '%'
      }
    })

    ffmpeg = ff
    ffmpegLoaded = true
    progressFill.style.width = '50%'
    return ffmpeg
  }

  // ── Resize ──
  resizeBtn.addEventListener('click', async function () {
    var preset = getSelectedPreset()
    var presetValidation = validatePreset(preset)
    if (!presetValidation.valid) { showError(presetValidation.error); return }

    var dims = resolveDimensions()
    if (!dims) { showError('Enter valid width and height (minimum 2px each).'); return }

    try {
      var ff = await loadFfmpeg()
      progressText.textContent = 'Resizing video...'
      progressFill.style.width = '50%'
      progressDetail.textContent = 'Writing file to memory...'

      var inputExt = getExtension(currentFile.name)
      var inputName = 'input' + inputExt
      var outputName = 'output' + inputExt

      var fileData = await fetchFile(currentFile)
      await ff.writeFile(inputName, fileData)

      ff._lastLogs.length = 0
      progressDetail.textContent = 'Resizing...'
      var args = buildResizeArgs({ inputName: inputName, outputName: outputName, width: dims.width, height: dims.height })
      var ret = await ff.exec(args)

      if (ret !== 0) {
        throw new Error('Resize failed (code ' + ret + '): ' + ff._lastLogs.slice(-3).join(' '))
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

      // Show new resolution after decode
      resultVideo.onloadedmetadata = function () {
        var newW = resultVideo.videoWidth
        var newH = resultVideo.videoHeight
        resultStats.innerHTML =
          '<strong>' + newW + '×' + newH + '</strong> &mdash; <strong>' + formatFileSize(blob.size) + '</strong>'
      }

      showState('result')
    } catch (err) {
      console.error('Resize failed:', err)
      showError('Resize failed: ' + (err.message || String(err)).split('\n')[0])
    }
  })

  function getExtension(filename) {
    var dot = filename.lastIndexOf('.')
    return dot === -1 ? '.mp4' : filename.substring(dot)
  }

  // ── Download ──
  downloadBtn.addEventListener('click', function () {
    if (!resultBlobUrl || !currentFile) return
    var dims = resolveDimensions() || { width: 0, height: -2 }
    var a = document.createElement('a')
    a.href = resultBlobUrl
    a.download = getOutputFilename(currentFile.name, dims.width, dims.height)
    a.click()
  })

  // ── Reset ──
  function reset() {
    fileInput.value = ''; currentFile = null; origWidth = 0; origHeight = 0
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
