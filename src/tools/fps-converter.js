import { validateFps, validateVideoFile, formatDuration, formatFileSize, buildFfmpegArgs, getOutputFilename, FPS_PRESETS } from './fps-converter-core.js'

;(function () {
  'use strict'

  // Elements
  var dropzone = document.getElementById('fps-dropzone')
  var fileInput = document.getElementById('fps-file-input')
  var infoEl = document.getElementById('fps-info')
  var settingsEl = document.getElementById('fps-settings')
  var videoPreview = document.getElementById('fps-video-preview')
  var originalFpsEl = document.getElementById('fps-original-fps')
  var durationEl = document.getElementById('fps-duration')
  var fileSizeEl = document.getElementById('fps-file-size')
  var presetsEl = document.getElementById('fps-presets')
  var customInput = document.getElementById('fps-custom')
  var convertBtn = document.getElementById('fps-convert')
  var changeFileBtn = document.getElementById('fps-change-file')
  var progressEl = document.getElementById('fps-progress')
  var progressText = document.getElementById('fps-progress-text')
  var progressBar = document.getElementById('fps-progress-bar')
  var progressDetail = document.getElementById('fps-progress-detail')
  var errorEl = document.getElementById('fps-error')
  var errorText = document.getElementById('fps-error-text')
  var errorRetry = document.getElementById('fps-error-retry')
  var resultEl = document.getElementById('fps-result')
  var resultStats = document.getElementById('fps-result-stats')
  var resultPreview = document.getElementById('fps-result-preview')
  var downloadBtn = document.getElementById('fps-download')
  var newBtn = document.getElementById('fps-new')

  // State
  var ffmpeg = null
  var currentFile = null
  var currentFilename = ''
  var resultBlobUrl = null
  var selectedFps = 30
  var detectedFps = null
  var previewUrl = null

  // --- State management ---
  function showState(state) {
    dropzone.style.display = state === 'dropzone' ? '' : 'none'
    infoEl.style.display = state === 'dropzone' ? '' : 'none'
    settingsEl.style.display = state === 'settings' ? '' : 'none'
    progressEl.style.display = state === 'progress' ? '' : 'none'
    errorEl.style.display = state === 'error' ? '' : 'none'
    resultEl.style.display = state === 'result' ? '' : 'none'
  }

  function showError(msg) {
    errorText.textContent = msg
    showState('error')
  }

  // --- Drop zone ---
  dropzone.addEventListener('click', function () {
    fileInput.click()
  })

  dropzone.addEventListener('dragover', function (e) {
    e.preventDefault()
    dropzone.classList.add('drag-over')
  })

  dropzone.addEventListener('dragleave', function () {
    dropzone.classList.remove('drag-over')
  })

  dropzone.addEventListener('drop', function (e) {
    e.preventDefault()
    dropzone.classList.remove('drag-over')
    var files = e.dataTransfer.files
    if (files.length > 0) handleFile(files[0])
  })

  fileInput.addEventListener('change', function () {
    if (fileInput.files.length > 0) handleFile(fileInput.files[0])
  })

  // --- File handling ---
  function handleFile(file) {
    var validation = validateVideoFile(file)
    if (!validation.valid) {
      showError(validation.error)
      return
    }

    currentFile = file
    currentFilename = file.name

    // Create preview
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    previewUrl = URL.createObjectURL(file)
    videoPreview.src = previewUrl

    // Show metadata
    fileSizeEl.textContent = formatFileSize(file.size)
    originalFpsEl.textContent = '...'
    durationEl.textContent = '...'
    detectedFps = null

    videoPreview.onloadedmetadata = function () {
      durationEl.textContent = formatDuration(videoPreview.duration)
      detectFps()
    }

    showState('settings')
  }

  // --- FPS detection ---
  function detectFps() {
    if (!('requestVideoFrameCallback' in HTMLVideoElement.prototype)) {
      originalFpsEl.textContent = 'N/A'
      return
    }

    var frameCount = 0
    var startTime = null
    var handle = null

    function countFrame(now, metadata) {
      if (startTime === null) {
        startTime = metadata.mediaTime
      }
      frameCount++
      var elapsed = metadata.mediaTime - startTime
      if (elapsed >= 1.0 && frameCount >= 2) {
        var fps = Math.round(frameCount / elapsed)
        detectedFps = fps
        originalFpsEl.textContent = fps + ' fps'
        videoPreview.pause()
        videoPreview.currentTime = 0
        return
      }
      handle = videoPreview.requestVideoFrameCallback(countFrame)
    }

    videoPreview.muted = true
    videoPreview.currentTime = 0
    handle = videoPreview.requestVideoFrameCallback(countFrame)
    videoPreview.play().catch(function () {
      originalFpsEl.textContent = 'N/A'
    })
  }

  // --- FPS preset buttons ---
  var presetBtns = presetsEl.querySelectorAll('.fps-preset')
  presetBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      presetBtns.forEach(function (b) { b.classList.remove('active') })
      btn.classList.add('active')
      selectedFps = parseInt(btn.dataset.fps, 10)
      customInput.value = ''
    })
  })

  customInput.addEventListener('input', function () {
    var val = parseInt(customInput.value, 10)
    if (val && val > 0) {
      presetBtns.forEach(function (b) { b.classList.remove('active') })
      selectedFps = val
    }
  })

  // --- FFmpeg loading ---
  var ffmpegLoaded = false
  var fetchFile = null

  async function loadFfmpeg() {
    if (ffmpeg && ffmpegLoaded) return ffmpeg

    showState('progress')
    progressText.textContent = 'Loading FFmpeg engine...'
    progressBar.style.width = '0%'
    progressDetail.textContent = 'Downloading ~25 MB (cached after first use)'

    var mod = await import('https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/esm/index.js')
    var utilMod = await import('https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12.1/dist/esm/index.js')
    fetchFile = utilMod.fetchFile

    var ff = new mod.FFmpeg()

    ff.on('log', function (e) {
      // Parse progress from ffmpeg log output
      if (e.message) {
        var timeMatch = e.message.match(/time=(\d+):(\d+):(\d+\.\d+)/)
        if (timeMatch) {
          var secs = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseFloat(timeMatch[3])
          var total = videoPreview.duration || 1
          var pct = Math.min(Math.round((secs / total) * 100), 99)
          progressBar.style.width = pct + '%'
          progressDetail.textContent = 'Converting... ' + pct + '%'
        }
      }
    })

    progressBar.style.width = '30%'
    progressDetail.textContent = 'Initializing FFmpeg...'

    await ff.load({
      coreURL: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
    })

    // Only cache after successful load
    ffmpeg = ff
    ffmpegLoaded = true

    progressBar.style.width = '50%'
    progressDetail.textContent = 'FFmpeg ready'

    return ffmpeg
  }

  // --- Conversion ---
  convertBtn.addEventListener('click', async function () {
    var check = validateFps(selectedFps)
    if (!check.valid) {
      showError(check.error)
      return
    }

    try {
      var ff = await loadFfmpeg()

      progressText.textContent = 'Converting video...'
      progressBar.style.width = '50%'
      progressDetail.textContent = 'Writing file to memory...'

      var inputName = 'input' + getExtension(currentFilename)
      var outputName = getOutputFilename(currentFilename, selectedFps)

      var fileData = await fetchFile(currentFile)
      await ff.writeFile(inputName, fileData)

      progressDetail.textContent = 'Processing...'
      var args = buildFfmpegArgs(inputName, outputName, selectedFps)
      await ff.exec(args)

      progressBar.style.width = '95%'
      progressDetail.textContent = 'Reading output...'

      var outputData = await ff.readFile(outputName)

      // Clean up ffmpeg FS
      await ff.deleteFile(inputName)
      await ff.deleteFile(outputName)

      // Create result blob
      if (resultBlobUrl) URL.revokeObjectURL(resultBlobUrl)
      var blob = new Blob([outputData.buffer], { type: 'video/mp4' })
      resultBlobUrl = URL.createObjectURL(blob)

      // Show result
      resultPreview.src = resultBlobUrl
      var originalSize = formatFileSize(currentFile.size)
      var newSize = formatFileSize(outputData.byteLength)
      var statsHtml = '<strong>Original:</strong> ' + (detectedFps ? detectedFps + ' fps' : 'unknown fps') + ' · ' + originalSize
      statsHtml += '<br><strong>Converted:</strong> ' + selectedFps + ' fps · ' + newSize
      resultStats.innerHTML = statsHtml

      progressBar.style.width = '100%'
      showState('result')
    } catch (err) {
      console.error('FPS conversion failed:', err)
      showError('Conversion failed: ' + (err.message || 'Unknown error'))
    }
  })

  function getExtension(filename) {
    var dot = filename.lastIndexOf('.')
    return dot === -1 ? '.mp4' : filename.substring(dot)
  }

  // --- Download ---
  downloadBtn.addEventListener('click', function () {
    if (!resultBlobUrl) return
    var a = document.createElement('a')
    a.href = resultBlobUrl
    a.download = getOutputFilename(currentFilename, selectedFps)
    a.click()
  })

  // --- Reset ---
  function reset() {
    fileInput.value = ''
    currentFile = null
    currentFilename = ''
    detectedFps = null
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      previewUrl = null
    }
    if (resultBlobUrl) {
      URL.revokeObjectURL(resultBlobUrl)
      resultBlobUrl = null
    }
    // Reset preset to 30
    selectedFps = 30
    presetBtns.forEach(function (b) {
      b.classList.toggle('active', b.dataset.fps === '30')
    })
    customInput.value = ''
    showState('dropzone')
  }

  newBtn.addEventListener('click', reset)
  changeFileBtn.addEventListener('click', function () {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      previewUrl = null
    }
    fileInput.value = ''
    currentFile = null
    showState('dropzone')
  })
  errorRetry.addEventListener('click', reset)

  // Init
  showState('dropzone')
})()
