import { validateVideoFile, formatDuration, formatFileSize } from './fps-converter-core.js'
import { validateRotation, buildRotateArgs, getOutputFilename } from './rotate-video-core.js'

;(function () {
  'use strict'

  // ── DOM refs ──
  var dropzone = document.getElementById('rv-dropzone')
  var fileInput = document.getElementById('rv-file-input')
  var infoEl = document.getElementById('rv-info')
  var mobileBanner = document.getElementById('rv-mobile-banner')
  var mobileBannerDismiss = document.getElementById('rv-mobile-banner-dismiss')
  var settingsEl = document.getElementById('rv-settings')
  var videoEl = document.getElementById('rv-video')
  var durationEl = document.getElementById('rv-duration')
  var dimensionsEl = document.getElementById('rv-dimensions')
  var filesizeEl = document.getElementById('rv-filesize')
  var rotationBtns = document.querySelectorAll('.rv-rotation-btn')
  var rotateBtn = document.getElementById('rv-rotate')
  var changeBtn = document.getElementById('rv-change')
  var progressEl = document.getElementById('rv-progress')
  var progressText = document.getElementById('rv-progress-text')
  var progressFill = document.getElementById('rv-progress-fill')
  var progressDetail = document.getElementById('rv-progress-detail')
  var errorEl = document.getElementById('rv-error')
  var errorText = document.getElementById('rv-error-text')
  var errorRetry = document.getElementById('rv-error-retry')
  var resultEl = document.getElementById('rv-result')
  var resultVideo = document.getElementById('rv-result-video')
  var resultStats = document.getElementById('rv-result-stats')
  var downloadBtn = document.getElementById('rv-download')
  var newBtn = document.getElementById('rv-new')

  // ── State ──
  var ffmpeg = null
  var ffmpegLoaded = false
  var fetchFile = null
  var currentFile = null
  var previewUrl = null
  var resultBlobUrl = null
  var selectedRotation = null
  var MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024 // 2 GB

  // ── Mobile banner ──
  if (mobileBanner && window.matchMedia('(max-width: 768px)').matches) {
    var dismissed = false
    try { dismissed = localStorage.getItem('mt:rv-mobile-nudge') === '1' } catch (_) {}
    if (!dismissed) mobileBanner.style.display = ''
  }
  if (mobileBannerDismiss) {
    mobileBannerDismiss.addEventListener('click', function () {
      mobileBanner.style.display = 'none'
      try { localStorage.setItem('mt:rv-mobile-nudge', '1') } catch (_) {}
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

    // Reset rotation selection
    selectedRotation = null
    rotationBtns.forEach(function (btn) { btn.classList.remove('active') })
    rotateBtn.disabled = true

    showState('settings')
  }

  // ── Rotation button selection ──
  rotationBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      selectedRotation = btn.dataset.rotation
      rotationBtns.forEach(function (b) { b.classList.remove('active') })
      btn.classList.add('active')
      rotateBtn.disabled = false
    })
  })

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
          var pct = Math.min(Math.round(secs * 2), 99)
          progressFill.style.width = (50 + pct * 0.45) + '%'
          progressDetail.textContent = 'Rotating... ' + pct + '%'
        }
      }
    })

    ffmpeg = ff
    ffmpegLoaded = true
    progressFill.style.width = '50%'
    return ffmpeg
  }

  // ── Rotate ──
  rotateBtn.addEventListener('click', async function () {
    var rotValidation = validateRotation(selectedRotation)
    if (!rotValidation.valid) { showError(rotValidation.error); return }

    try {
      var ff = await loadFfmpeg()
      progressText.textContent = 'Rotating video...'
      progressFill.style.width = '50%'
      progressDetail.textContent = 'Writing file to memory...'

      var inputExt = getExtension(currentFile.name)
      var inputName = 'input' + inputExt
      var outputName = 'output' + inputExt

      var fileData = await fetchFile(currentFile)
      await ff.writeFile(inputName, fileData)

      ff._lastLogs.length = 0
      progressDetail.textContent = 'Rotating...'
      var args = buildRotateArgs({ inputName: inputName, outputName: outputName, rotation: selectedRotation })
      var ret = await ff.exec(args)

      if (ret !== 0) {
        throw new Error('Rotate failed (code ' + ret + '): ' + ff._lastLogs.slice(-3).join(' '))
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
      var rotationLabel = { '90cw': '90° clockwise', '90ccw': '90° counter-clockwise', '180': '180°' }[selectedRotation] || selectedRotation
      resultStats.innerHTML = 'Rotated <strong>' + rotationLabel + '</strong> — <strong>' + formatFileSize(blob.size) + '</strong>'

      showState('result')
    } catch (err) {
      console.error('Rotate failed:', err)
      showError('Rotate failed: ' + (err.message || String(err)).split('\n')[0])
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
    a.download = getOutputFilename(currentFile.name, selectedRotation)
    a.click()
  })

  // ── Reset ──
  function reset() {
    fileInput.value = ''; currentFile = null; selectedRotation = null
    if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = null }
    if (resultBlobUrl) { URL.revokeObjectURL(resultBlobUrl); resultBlobUrl = null }
    showState('dropzone')
  }

  changeBtn.addEventListener('click', function () {
    if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = null }
    fileInput.value = ''; currentFile = null; selectedRotation = null; showState('dropzone')
  })
  newBtn.addEventListener('click', reset)
  errorRetry.addEventListener('click', reset)

  showState('dropzone')
})()
