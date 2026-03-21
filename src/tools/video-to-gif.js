import { validateVideoFile, formatDuration, formatFileSize } from './fps-converter-core.js'

;(function () {
  'use strict'

  // ── DOM refs ──
  var dropzone = document.getElementById('vtg-dropzone')
  var fileInput = document.getElementById('vtg-file-input')
  var infoEl = document.getElementById('vtg-info')
  var settingsEl = document.getElementById('vtg-settings')
  var videoEl = document.getElementById('vtg-video')
  var durationEl = document.getElementById('vtg-duration')
  var dimensionsEl = document.getElementById('vtg-dimensions')
  var filesizeEl = document.getElementById('vtg-filesize')
  var startInput = document.getElementById('vtg-start')
  var endInput = document.getElementById('vtg-end')
  var useStartBtn = document.getElementById('vtg-use-start')
  var useEndBtn = document.getElementById('vtg-use-end')
  var trimDurationEl = document.getElementById('vtg-trim-duration')
  var fpsPresetsEl = document.getElementById('vtg-fps-presets')
  var fpsCustom = document.getElementById('vtg-fps-custom')
  var widthInput = document.getElementById('vtg-width')
  var loopSelect = document.getElementById('vtg-loop')
  var convertBtn = document.getElementById('vtg-convert')
  var changeBtn = document.getElementById('vtg-change')
  var progressEl = document.getElementById('vtg-progress')
  var progressText = document.getElementById('vtg-progress-text')
  var progressFill = document.getElementById('vtg-progress-fill')
  var progressDetail = document.getElementById('vtg-progress-detail')
  var errorEl = document.getElementById('vtg-error')
  var errorText = document.getElementById('vtg-error-text')
  var errorRetry = document.getElementById('vtg-error-retry')
  var resultEl = document.getElementById('vtg-result')
  var resultImg = document.getElementById('vtg-result-img')
  var resultStats = document.getElementById('vtg-result-stats')
  var downloadBtn = document.getElementById('vtg-download')
  var newBtn = document.getElementById('vtg-new')

  // ── State ──
  var ffmpeg = null
  var ffmpegLoaded = false
  var fetchFile = null
  var currentFile = null
  var previewUrl = null
  var resultBlobUrl = null
  var selectedFps = 10
  var videoDuration = 0

  var MAX_FILE_SIZE = 200 * 1024 * 1024 // 200 MB

  // CDN URLs (same as fps-converter)
  var CDN = 'https://cdn.jsdelivr.net/npm'
  var CORE_URL = CDN + '/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js'
  var WASM_URL = CDN + '/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm'
  var WORKER_URL = CDN + '/@ffmpeg/ffmpeg@0.12.10/dist/esm/worker.js'

  // ── State management ──
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

  // ── Drop zone ──
  dropzone.addEventListener('click', function () { fileInput.click() })

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
      showError('File too large (' + formatFileSize(file.size) + '). Maximum is 200 MB.')
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
      dimensionsEl.textContent = videoEl.videoWidth + '\u00d7' + videoEl.videoHeight

      // Default end time: min(5s, video duration)
      var defaultEnd = Math.min(5, videoDuration)
      startInput.value = '0'
      endInput.value = defaultEnd.toFixed(1)
      startInput.max = videoDuration.toFixed(1)
      endInput.max = videoDuration.toFixed(1)
      updateTrimDuration()
    }

    showState('settings')
  }

  // ── Trim controls ──
  function updateTrimDuration() {
    var s = parseFloat(startInput.value) || 0
    var e = parseFloat(endInput.value) || 0
    var dur = Math.max(0, e - s)
    trimDurationEl.textContent = dur.toFixed(1) + 's'
  }

  startInput.addEventListener('input', updateTrimDuration)
  endInput.addEventListener('input', updateTrimDuration)

  useStartBtn.addEventListener('click', function () {
    startInput.value = videoEl.currentTime.toFixed(1)
    updateTrimDuration()
  })
  useEndBtn.addEventListener('click', function () {
    endInput.value = videoEl.currentTime.toFixed(1)
    updateTrimDuration()
  })

  // ── FPS presets ──
  var fpsBtns = fpsPresetsEl.querySelectorAll('.vtg-fps-btn')
  fpsBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      fpsBtns.forEach(function (b) { b.classList.remove('active') })
      btn.classList.add('active')
      selectedFps = parseInt(btn.dataset.fps, 10)
      fpsCustom.value = ''
    })
  })
  fpsCustom.addEventListener('input', function () {
    var val = parseInt(fpsCustom.value, 10)
    if (val && val > 0) {
      fpsBtns.forEach(function (b) { b.classList.remove('active') })
      selectedFps = val
    }
  })

  // ── FFmpeg loading (same pattern as fps-converter) ──
  async function toBlobURL(url, mimeType) {
    var response = await fetch(url)
    var blob = new Blob([await response.arrayBuffer()], { type: mimeType })
    return URL.createObjectURL(blob)
  }

  async function loadFfmpeg() {
    if (ffmpeg && ffmpegLoaded) return ffmpeg

    showState('progress')
    progressText.textContent = 'Loading FFmpeg engine...'
    progressFill.style.width = '0%'
    progressDetail.textContent = 'Downloading ~25 MB (cached after first use)'

    var mod = await import(CDN + '/@ffmpeg/ffmpeg@0.12.10/dist/esm/index.js')
    var utilMod = await import(CDN + '/@ffmpeg/util@0.12.1/dist/esm/index.js')
    fetchFile = utilMod.fetchFile

    var ff = new mod.FFmpeg()

    var lastLogs = []
    ff.on('log', function (e) {
      if (e.message) {
        console.log('[ffmpeg]', e.message)
        lastLogs.push(e.message)
        if (lastLogs.length > 30) lastLogs.shift()
        // Parse progress from time= in ffmpeg output
        var trimStart = parseFloat(startInput.value) || 0
        var trimEnd = parseFloat(endInput.value) || 0
        var trimLen = Math.max(0.1, trimEnd - trimStart)
        var timeMatch = e.message.match(/time=(\d+):(\d+):(\d+\.\d+)/)
        if (timeMatch) {
          var secs = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseFloat(timeMatch[3])
          var pct = Math.min(Math.round((secs / trimLen) * 100), 99)
          progressFill.style.width = (50 + pct * 0.45) + '%'
          progressDetail.textContent = 'Converting... ' + pct + '%'
        }
      }
    })
    ff._lastLogs = lastLogs

    progressFill.style.width = '10%'
    progressDetail.textContent = 'Downloading FFmpeg core...'
    var coreBlobURL = await toBlobURL(CORE_URL, 'text/javascript')
    progressFill.style.width = '20%'
    var wasmBlobURL = await toBlobURL(WASM_URL, 'application/wasm')
    progressFill.style.width = '40%'
    progressDetail.textContent = 'Loading worker...'
    var workerBlobURL = await toBlobURL(WORKER_URL, 'text/javascript')

    progressFill.style.width = '45%'
    progressDetail.textContent = 'Initializing FFmpeg...'

    await ff.load({
      coreURL: coreBlobURL,
      wasmURL: wasmBlobURL,
      classWorkerURL: workerBlobURL,
    })

    ffmpeg = ff
    ffmpegLoaded = true
    progressFill.style.width = '50%'
    return ffmpeg
  }

  // ── Conversion ──
  convertBtn.addEventListener('click', async function () {
    var trimStart = parseFloat(startInput.value) || 0
    var trimEnd = parseFloat(endInput.value) || videoDuration
    var trimLen = trimEnd - trimStart

    if (trimLen <= 0) { showError('End time must be after start time.'); return }
    if (trimLen > 60) { showError('Maximum GIF duration is 60 seconds. Shorten your selection.'); return }
    if (selectedFps < 1 || selectedFps > 50) { showError('FPS must be between 1 and 50.'); return }

    try {
      var ff = await loadFfmpeg()

      progressText.textContent = 'Converting video to GIF...'
      progressFill.style.width = '50%'
      progressDetail.textContent = 'Writing file to memory...'

      var ext = getExtension(currentFile.name)
      var inputName = 'input' + ext
      var paletteName = 'palette.png'
      var outputName = 'output.gif'

      var fileData = await fetchFile(currentFile)
      await ff.writeFile(inputName, fileData)

      // Build ffmpeg args for high-quality GIF using palette method
      var fps = selectedFps
      var loop = parseInt(loopSelect.value, 10)
      var outputWidth = parseInt(widthInput.value, 10)

      // Scale filter
      var scaleFilter = ''
      if (outputWidth > 0) {
        scaleFilter = ',scale=' + outputWidth + ':-1:flags=lanczos'
      }

      // Pass 1: generate optimal palette
      progressDetail.textContent = 'Generating color palette...'
      if (ff._lastLogs) ff._lastLogs.length = 0

      var paletteArgs = [
        '-ss', String(trimStart),
        '-t', String(trimLen),
        '-i', inputName,
        '-vf', 'fps=' + fps + scaleFilter + ',palettegen=stats_mode=diff',
        '-y', paletteName
      ]

      var exitCode = await ff.exec(paletteArgs)
      if (exitCode !== 0) {
        var logTail = (ff._lastLogs || []).slice(-5).join('\n')
        throw new Error('Palette generation failed (code ' + exitCode + ')' + (logTail ? ':\n' + logTail : ''))
      }

      // Pass 2: convert using palette for best quality
      progressDetail.textContent = 'Encoding GIF...'
      if (ff._lastLogs) ff._lastLogs.length = 0

      var gifArgs = [
        '-ss', String(trimStart),
        '-t', String(trimLen),
        '-i', inputName,
        '-i', paletteName,
        '-lavfi', 'fps=' + fps + scaleFilter + ' [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle',
        '-loop', String(loop),
        '-y', outputName
      ]

      var exitCode2 = await ff.exec(gifArgs)
      if (exitCode2 !== 0) {
        var logTail2 = (ff._lastLogs || []).slice(-5).join('\n')
        throw new Error('GIF encoding failed (code ' + exitCode2 + ')' + (logTail2 ? ':\n' + logTail2 : ''))
      }

      progressFill.style.width = '95%'
      progressDetail.textContent = 'Reading output...'

      var outputData
      try {
        outputData = await ff.readFile(outputName)
      } catch (readErr) {
        var logTail3 = (ff._lastLogs || []).slice(-5).join('\n')
        throw new Error('Output file not created:\n' + logTail3)
      }

      // Clean up ffmpeg FS
      try { await ff.deleteFile(inputName) } catch (_) {}
      try { await ff.deleteFile(paletteName) } catch (_) {}
      try { await ff.deleteFile(outputName) } catch (_) {}

      // Show result
      if (resultBlobUrl) URL.revokeObjectURL(resultBlobUrl)
      var blob = new Blob([outputData.buffer], { type: 'image/gif' })
      resultBlobUrl = URL.createObjectURL(blob)

      resultImg.src = resultBlobUrl
      var sizeStr = formatFileSize(blob.size)
      var widthLabel = outputWidth > 0 ? outputWidth + 'px wide' : 'original size'
      resultStats.innerHTML = '<strong>' + trimLen.toFixed(1) + 's</strong> at <strong>' + fps + ' fps</strong> \u2014 ' + widthLabel + ' \u2014 <strong>' + sizeStr + '</strong>'

      progressFill.style.width = '100%'
      showState('result')
    } catch (err) {
      console.error('Video to GIF conversion failed:', err)
      var msg = (err.message || String(err)).split('\n')[0]
      showError('Conversion failed: ' + msg)
    }
  })

  function getExtension(filename) {
    var dot = filename.lastIndexOf('.')
    return dot === -1 ? '.mp4' : filename.substring(dot)
  }

  // ── Download ──
  downloadBtn.addEventListener('click', function () {
    if (!resultBlobUrl) return
    var a = document.createElement('a')
    a.href = resultBlobUrl
    var baseName = currentFile ? currentFile.name.replace(/\.[^.]+$/, '') : 'video'
    a.download = baseName + '.gif'
    a.click()
  })

  // ── Reset ──
  function reset() {
    fileInput.value = ''
    currentFile = null
    videoDuration = 0
    selectedFps = 10
    if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = null }
    if (resultBlobUrl) { URL.revokeObjectURL(resultBlobUrl); resultBlobUrl = null }
    fpsBtns.forEach(function (b) { b.classList.toggle('active', b.dataset.fps === '10') })
    fpsCustom.value = ''
    widthInput.value = ''
    showState('dropzone')
  }

  changeBtn.addEventListener('click', function () {
    if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = null }
    fileInput.value = ''
    currentFile = null
    showState('dropzone')
  })
  newBtn.addEventListener('click', reset)
  errorRetry.addEventListener('click', reset)

  // Init
  showState('dropzone')
})()
