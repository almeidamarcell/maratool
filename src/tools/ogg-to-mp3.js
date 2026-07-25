import { formatDuration, formatFileSize } from './fps-converter-core.js'
import { validateAudioFile, validateBitrate, buildConvertArgs, getOutputFilename, getMaxFileSize } from './ogg-to-mp3-core.js'

// Shared by the OGG → MP3 and Opus → MP3 pages — both use the same o3- DOM ids;
// page-specific copy (headings, accept list) lives in the Astro markup.
;(function () {
  'use strict'

  // ── DOM refs ──
  var dropzone = document.getElementById('o3-dropzone')
  var fileInput = document.getElementById('o3-file-input')
  var infoEl = document.getElementById('o3-info')
  var mobileBanner = document.getElementById('o3-mobile-banner')
  var mobileBannerDismiss = document.getElementById('o3-mobile-banner-dismiss')
  var settingsEl = document.getElementById('o3-settings')
  var audioWrap = document.getElementById('o3-audio-wrap')
  var audioEl = document.getElementById('o3-audio')
  var filenameEl = document.getElementById('o3-filename')
  var durationEl = document.getElementById('o3-duration')
  var filesizeEl = document.getElementById('o3-filesize')
  var bitrateSelect = document.getElementById('o3-bitrate')
  var convertBtn = document.getElementById('o3-convert')
  var changeBtn = document.getElementById('o3-change')
  var progressEl = document.getElementById('o3-progress')
  var progressText = document.getElementById('o3-progress-text')
  var progressFill = document.getElementById('o3-progress-fill')
  var progressDetail = document.getElementById('o3-progress-detail')
  var errorEl = document.getElementById('o3-error')
  var errorText = document.getElementById('o3-error-text')
  var errorRetry = document.getElementById('o3-error-retry')
  var resultEl = document.getElementById('o3-result')
  var resultAudio = document.getElementById('o3-result-audio')
  var resultStats = document.getElementById('o3-result-stats')
  var downloadBtn = document.getElementById('o3-download')
  var newBtn = document.getElementById('o3-new')

  // ── State ──
  var ffmpeg = null
  var ffmpegLoaded = false
  var fetchFile = null
  var currentFile = null
  var previewUrl = null
  var resultBlobUrl = null
  var inputDuration = 0

  // Safari can't play OGG/Opus in <audio>; conversion still works (ffmpeg decodes,
  // not the browser), so only the input preview is hidden.
  var canPreviewInput = audioEl && audioEl.canPlayType &&
    (audioEl.canPlayType('audio/ogg') !== '' || audioEl.canPlayType('audio/ogg; codecs="opus"') !== '')

  // ── Mobile banner ──
  if (mobileBanner && window.matchMedia('(max-width: 768px)').matches) {
    var dismissed = false
    try { dismissed = localStorage.getItem('mt:o3-mobile-nudge') === '1' } catch (_) {}
    if (!dismissed) mobileBanner.style.display = ''
  }
  if (mobileBannerDismiss) {
    mobileBannerDismiss.addEventListener('click', function () {
      mobileBanner.style.display = 'none'
      try { localStorage.setItem('mt:o3-mobile-nudge', '1') } catch (_) {}
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
    var validation = validateAudioFile(file)
    if (!validation.valid) { showError(validation.error); return }
    if (file.size > getMaxFileSize()) {
      showError('File too large (' + formatFileSize(file.size) + '). Maximum is ' + formatFileSize(getMaxFileSize()) + '.')
      return
    }
    currentFile = file
    inputDuration = 0
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    filenameEl.textContent = file.name
    filesizeEl.textContent = formatFileSize(file.size)
    durationEl.textContent = '—'

    if (canPreviewInput) {
      previewUrl = URL.createObjectURL(file)
      audioEl.src = previewUrl
      audioWrap.style.display = ''
      audioEl.onloadedmetadata = function () {
        if (isFinite(audioEl.duration) && audioEl.duration > 0) {
          inputDuration = audioEl.duration
          durationEl.textContent = formatDuration(audioEl.duration)
        }
      }
    } else {
      audioWrap.style.display = 'none'
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
        if (timeMatch && inputDuration > 0) {
          var secs = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseFloat(timeMatch[3])
          var pct = Math.min(Math.round((secs / inputDuration) * 100), 99)
          progressFill.style.width = (50 + pct * 0.45) + '%'
          progressDetail.textContent = 'Converting to MP3... ' + pct + '%'
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
    var bitrate = bitrateSelect ? parseInt(bitrateSelect.value, 10) : 192
    var bitrateValidation = validateBitrate(bitrate)
    if (!bitrateValidation.valid) { showError(bitrateValidation.error); return }

    try {
      var ff = await loadFfmpeg()
      progressText.textContent = 'Converting to MP3...'
      progressFill.style.width = '50%'
      progressDetail.textContent = 'Writing file to memory...'

      var inputName = 'input' + getExt(currentFile.name)
      var outputName = 'output.mp3'

      var fileData = await fetchFile(currentFile)
      await ff.writeFile(inputName, fileData)

      ff._lastLogs.length = 0
      progressDetail.textContent = 'Converting to MP3...'

      var args = buildConvertArgs({ inputName: inputName, outputName: outputName, bitrate: bitrate })
      var ret = await ff.exec(args)

      if (ret !== 0) {
        throw new Error('Conversion failed (code ' + ret + '): ' + ff._lastLogs.slice(-3).join(' '))
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
      console.error('Conversion failed:', err)
      showError('Conversion failed: ' + (err.message || String(err)).split('\n')[0])
    }
  })

  function getExt(filename) {
    var dot = filename.lastIndexOf('.')
    return dot === -1 ? '.ogg' : filename.substring(dot)
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
    fileInput.value = ''; currentFile = null; inputDuration = 0
    if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = null }
    if (resultBlobUrl) { URL.revokeObjectURL(resultBlobUrl); resultBlobUrl = null }
    audioEl.src = ''
    showState('dropzone')
  }

  changeBtn.addEventListener('click', function () {
    if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = null }
    fileInput.value = ''; currentFile = null; inputDuration = 0; showState('dropzone')
  })
  newBtn.addEventListener('click', reset)
  errorRetry.addEventListener('click', reset)

  showState('dropzone')
})()
