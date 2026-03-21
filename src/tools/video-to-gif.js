import { validateVideoFile, formatDuration, formatFileSize } from './fps-converter-core.js'
import { buildBaseFilters, buildDrawtextFilter, buildPalettePassArgs, buildEncodePassArgs, validateGifOptions } from './video-to-gif-core.js'

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
  var speedPresetsEl = document.getElementById('vtg-speed-presets')
  var reverseCheckbox = document.getElementById('vtg-reverse')
  var textInput = document.getElementById('vtg-text')
  var textSizeSelect = document.getElementById('vtg-text-size')
  var textPosSelect = document.getElementById('vtg-text-pos')
  var textColorSelect = document.getElementById('vtg-text-color')
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
  var selectedSpeed = 1
  var videoDuration = 0
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
      updateTrimDuration()
    }
    showState('settings')
  }

  // ── Trim controls ──
  function updateTrimDuration() {
    var s = parseFloat(startInput.value) || 0
    var e = parseFloat(endInput.value) || 0
    trimDurationEl.textContent = Math.max(0, e - s).toFixed(1) + 's'
  }
  startInput.addEventListener('input', updateTrimDuration)
  endInput.addEventListener('input', updateTrimDuration)
  useStartBtn.addEventListener('click', function () { startInput.value = videoEl.currentTime.toFixed(1); updateTrimDuration() })
  useEndBtn.addEventListener('click', function () { endInput.value = videoEl.currentTime.toFixed(1); updateTrimDuration() })

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
    if (val && val > 0) { fpsBtns.forEach(function (b) { b.classList.remove('active') }); selectedFps = val }
  })

  // ── Speed presets ──
  var speedBtns = speedPresetsEl.querySelectorAll('.vtg-fps-btn')
  speedBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      speedBtns.forEach(function (b) { b.classList.remove('active') })
      btn.classList.add('active')
      selectedSpeed = parseFloat(btn.dataset.speed)
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
    var fps = selectedFps
    var speed = selectedSpeed
    var reverseEnabled = reverseCheckbox.checked

    var validation = validateGifOptions({ trimLen: trimLen, fps: fps, speed: speed })
    if (!validation.valid) { showError(validation.error); return }

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
      console.error('Video to GIF conversion failed:', err)
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
    textInput.value = ''
    textSizeSelect.value = '36'
    textPosSelect.value = 'bottom'
    textColorSelect.value = 'white'
    fpsCustom.value = ''; widthInput.value = ''
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
