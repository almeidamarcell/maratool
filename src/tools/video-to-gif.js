import { validateVideoFile, formatDuration, formatFileSize } from './fps-converter-core.js'
import { buildBaseFilters, buildDrawtextFilter, buildPalettePassArgs, buildEncodePassArgs, validateGifOptions, estimateFrameCount, FRAME_WARN_THRESHOLD } from './video-to-gif-core.js'

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
  var untilEndCheckbox = document.getElementById('vtg-until-end')
  var trimDurationEl = document.getElementById('vtg-trim-duration')
  var fpsPresetsEl = document.getElementById('vtg-fps-presets')
  var fpsCustom = document.getElementById('vtg-fps-custom')
  var widthInput = document.getElementById('vtg-width')
  var loopSelect = document.getElementById('vtg-loop')
  var speedPresetsEl = document.getElementById('vtg-speed-presets')
  var reverseCheckbox = document.getElementById('vtg-reverse')
  var textInput = document.getElementById('vtg-text')
  var textSizeSelect = document.getElementById('vtg-text-size')
  var textPosSelect = document.getElementById('vtg-text-pos')
  var textColorSelect = document.getElementById('vtg-text-color')
  var frameWarningEl = document.getElementById('vtg-frame-warning')
  var convertBtn = document.getElementById('vtg-convert')
  var changeBtn = document.getElementById('vtg-change')
  var progressEl = document.getElementById('vtg-progress')
  var cancelBtn = document.getElementById('vtg-cancel')
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
  var selectedSpeed = 1
  var videoDuration = 0
  var cancelRequested = false
  var MAX_FILE_SIZE = 200 * 1024 * 1024

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
      var defaultEnd = Math.min(5, videoDuration)
      startInput.value = '0'
      endInput.value = defaultEnd.toFixed(1)
      startInput.max = videoDuration.toFixed(1)
      endInput.max = videoDuration.toFixed(1)
      applyUntilEnd()
    }
    showState('settings')
  }

  // ── Trim controls ──
  function updateTrimDuration() {
    var s = parseFloat(startInput.value) || 0
    var e = parseFloat(endInput.value) || 0
    trimDurationEl.textContent = Math.max(0, e - s).toFixed(1) + 's'
    updateFrameWarning()
  }
  function updateFrameWarning() {
    var s = parseFloat(startInput.value) || 0
    var e = parseFloat(endInput.value) || 0
    var frames = estimateFrameCount({ trimLen: e - s, fps: selectedFps, speed: selectedSpeed })
    if (frames > FRAME_WARN_THRESHOLD) {
      frameWarningEl.textContent = '⚠ This GIF will have ~' + frames.toLocaleString() + ' frames and may run out of browser memory. Consider lowering the frame rate, reducing the width, or shortening the clip.'
      frameWarningEl.style.display = ''
    } else {
      frameWarningEl.style.display = 'none'
    }
  }
  function applyUntilEnd() {
    var on = untilEndCheckbox.checked
    endInput.disabled = on
    useEndBtn.disabled = on
    // isFinite guard: streamed/MediaRecorder WebMs report duration as Infinity or NaN
    if (on && isFinite(videoDuration) && videoDuration > 0) endInput.value = videoDuration.toFixed(1)
    updateTrimDuration()
  }
  startInput.addEventListener('input', updateTrimDuration)
  endInput.addEventListener('input', updateTrimDuration)
  useStartBtn.addEventListener('click', function () { startInput.value = videoEl.currentTime.toFixed(1); updateTrimDuration() })
  useEndBtn.addEventListener('click', function () {
    if (useEndBtn.disabled) return
    endInput.value = videoEl.currentTime.toFixed(1); updateTrimDuration()
  })
  untilEndCheckbox.addEventListener('change', applyUntilEnd)

  // ── FPS presets ──
  var fpsBtns = fpsPresetsEl.querySelectorAll('.vtg-fps-btn')
  fpsBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      fpsBtns.forEach(function (b) { b.classList.remove('active') })
      btn.classList.add('active')
      selectedFps = parseInt(btn.dataset.fps, 10)
      fpsCustom.value = ''
      updateFrameWarning()
    })
  })
  fpsCustom.addEventListener('input', function () {
    var val = parseInt(fpsCustom.value, 10)
    if (val && val > 0) { fpsBtns.forEach(function (b) { b.classList.remove('active') }); selectedFps = val }
    updateFrameWarning()
  })

  // ── Speed presets ──
  var speedBtns = speedPresetsEl.querySelectorAll('.vtg-fps-btn')
  speedBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      speedBtns.forEach(function (b) { b.classList.remove('active') })
      btn.classList.add('active')
      selectedSpeed = parseFloat(btn.dataset.speed)
      updateFrameWarning()
    })
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
        // ffmpeg reports OUTPUT time; setpts rescales it by speed, so divide
        // or the progress % is wrong by the speed factor.
        var trimLen = Math.max(0.1, (trimEnd - trimStart) / (selectedSpeed || 1))
        var timeMatch = e.message.match(/time=(\d+):(\d+):(\d+\.\d+)/)
        if (timeMatch) {
          var secs = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseFloat(timeMatch[3])
          var pct = Math.min(Math.round((secs / trimLen) * 100), 99)
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

  // ── Conversion ──
  // ── Cancel ──
  // Terminating the worker is the only way to abort a running exec; the dead
  // instance is discarded so the next convert reloads it (browser-cached).
  cancelBtn.addEventListener('click', function () {
    cancelRequested = true
    try { if (ffmpeg) ffmpeg.terminate() } catch (_) {}
    ffmpeg = null
    ffmpegLoaded = false
    showState('settings')
  })

  convertBtn.addEventListener('click', async function () {
    cancelRequested = false
    // NaN-safe parsing: `|| videoDuration` would silently turn an explicit "0"
    // end time into a full-length conversion.
    var startRaw = parseFloat(startInput.value)
    var endRaw = parseFloat(endInput.value)
    var trimStart = isNaN(startRaw) ? 0 : startRaw
    var trimEnd = isNaN(endRaw) ? videoDuration : endRaw
    var trimLen = trimEnd - trimStart
    var fps = selectedFps
    var speed = selectedSpeed
    var reverseEnabled = reverseCheckbox.checked

    var validation = validateGifOptions({ trimLen: trimLen, fps: fps, speed: speed, reverse: reverseEnabled })
    if (!validation.valid) { showError(validation.error); return }

    try {
      var ff = await loadFfmpeg()
      // Cancel clicked while the engine was still downloading: the fresh
      // instance stays cached for next time, but this conversion stops here.
      if (cancelRequested) return

      // loadFfmpeg only shows the progress state on a cold load; on the cached
      // path the early return skips it, leaving the settings panel (and a live
      // Convert button) visible for the whole conversion.
      showState('progress')
      progressText.textContent = 'Converting video to GIF...'
      progressFill.style.width = '50%'
      progressDetail.textContent = 'Writing file to memory...'

      var ext = getExtension(currentFile.name)
      var inputName = 'input' + ext
      var paletteName = 'palette.png'
      var outputName = 'output.gif'

      var fileData = await fetchFile(currentFile)
      await ff.writeFile(inputName, fileData)

      var loop = parseInt(loopSelect.value, 10)
      var outputWidth = parseInt(widthInput.value, 10)

      var baseFilters = buildBaseFilters({ fps: fps, speed: speed, width: outputWidth, reverse: reverseEnabled })

      var drawtextFilter = buildDrawtextFilter({
        text: textInput.value,
        size: parseInt(textSizeSelect.value, 10),
        position: textPosSelect.value,
        color: textColorSelect.value,
      })

      // Pass 1: generate palette
      progressDetail.textContent = 'Generating color palette...'
      ff._lastLogs.length = 0

      var pass1Args = buildPalettePassArgs({
        trimStart: trimStart, trimLen: trimLen, inputName: inputName, paletteName: paletteName, baseFilters: baseFilters
      })
      var ret1 = await ff.exec(pass1Args)
      if (ret1 !== 0) {
        throw new Error('Palette generation failed (code ' + ret1 + '): ' + ff._lastLogs.slice(-3).join(' '))
      }

      // Pass 2: encode GIF with palette
      progressDetail.textContent = 'Encoding GIF...'
      ff._lastLogs.length = 0

      var pass2Args = buildEncodePassArgs({
        trimStart: trimStart, trimLen: trimLen, inputName: inputName, paletteName: paletteName,
        outputName: outputName, baseFilters: baseFilters, drawtextFilter: drawtextFilter, loop: loop
      })
      var ret2 = await ff.exec(pass2Args)
      if (ret2 !== 0) {
        throw new Error('GIF encoding failed (code ' + ret2 + '): ' + ff._lastLogs.slice(-3).join(' '))
      }

      progressFill.style.width = '95%'
      progressDetail.textContent = 'Reading output...'

      var outputData = await ff.readFile(outputName)
      if (cancelRequested) return

      try { await ff.deleteFile(inputName) } catch (_) {}
      try { await ff.deleteFile(paletteName) } catch (_) {}
      try { await ff.deleteFile(outputName) } catch (_) {}

      if (resultBlobUrl) URL.revokeObjectURL(resultBlobUrl)
      var blob = new Blob([outputData.buffer || outputData], { type: 'image/gif' })
      resultBlobUrl = URL.createObjectURL(blob)

      resultImg.src = resultBlobUrl
      var widthLabel = outputWidth > 0 ? outputWidth + 'px wide' : 'original size'
      var speedLabel = speed !== 1 ? ' at ' + speed + '\u00d7 speed' : ''
      var reverseLabel = reverseEnabled ? ' (reversed)' : ''
      resultStats.innerHTML = '<strong>' + trimLen.toFixed(1) + 's</strong> at <strong>' + fps + ' fps</strong>' + speedLabel + reverseLabel + ' \u2014 ' + widthLabel + ' \u2014 <strong>' + formatFileSize(blob.size) + '</strong>'

      showState('result')
    } catch (err) {
      // User-initiated cancel: the terminate() rejection is expected, the
      // cancel handler already restored the settings state. Not an error.
      if (cancelRequested) return
      console.error('Video to GIF conversion failed:', err)
      // A wasm OOM/abort kills the FFmpeg instance; keeping it cached would
      // make every retry fail until a page reload. Terminate and force a
      // reload (the ~25 MB download is browser-cached, so this is cheap).
      try { if (ffmpeg) ffmpeg.terminate() } catch (_) {}
      ffmpeg = null
      ffmpegLoaded = false
      showError('Conversion failed: ' + (err.message || String(err)).split('\n')[0])
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
    a.download = (currentFile ? currentFile.name.replace(/\.[^.]+$/, '') : 'video') + '.gif'
    a.click()
  })

  // ── Reset ──
  function reset() {
    fileInput.value = ''; currentFile = null; videoDuration = 0; selectedFps = 10; selectedSpeed = 1
    if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = null }
    if (resultBlobUrl) { URL.revokeObjectURL(resultBlobUrl); resultBlobUrl = null }
    fpsBtns.forEach(function (b) { b.classList.toggle('active', b.dataset.fps === '10') })
    speedBtns.forEach(function (b) { b.classList.toggle('active', b.dataset.speed === '1') })
    reverseCheckbox.checked = false
    untilEndCheckbox.checked = false
    endInput.disabled = false
    useEndBtn.disabled = false
    textInput.value = ''
    textSizeSelect.value = '36'
    textPosSelect.value = 'bottom'
    textColorSelect.value = 'white'
    fpsCustom.value = ''; widthInput.value = ''
    frameWarningEl.style.display = 'none'
    showState('dropzone')
  }

  changeBtn.addEventListener('click', function () {
    if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = null }
    fileInput.value = ''; currentFile = null; showState('dropzone')
  })
  newBtn.addEventListener('click', reset)
  // Keep the loaded video and settings on retry — a validation error (e.g.
  // "Until end" on an 11-minute video) shouldn't nuke the whole session.
  errorRetry.addEventListener('click', function () {
    if (currentFile) { showState('settings') } else { reset() }
  })

  showState('dropzone')
})()
