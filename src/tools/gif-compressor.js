import {
  getPresetSettings,
  computeScaledDims,
  selectFrameIndices,
  mergeDelays,
  getOutputFilename,
  formatSavings,
} from './gif-compressor-core.js'
import { streamGifFrames, STALE_LOAD } from './gif-shared.js'

;(function () {
  'use strict'

  // ── DOM refs ──
  var dropzone = document.getElementById('gc-dropzone')
  var fileInput = document.getElementById('gc-file-input')
  var infoEl = document.getElementById('gc-info')
  var settingsEl = document.getElementById('gc-settings')
  var previewImg = document.getElementById('gc-preview-img')
  var metaFrames = document.getElementById('gc-meta-frames')
  var metaDims = document.getElementById('gc-meta-dims')
  var metaSize = document.getElementById('gc-meta-size')
  var presetBtns = document.getElementById('gc-presets')
  var advToggle = document.getElementById('gc-adv-toggle')
  var advPanel = document.getElementById('gc-adv-panel')
  var colorsSelect = document.getElementById('gc-colors')
  var scaleSelect = document.getElementById('gc-scale')
  var skipSelect = document.getElementById('gc-skip')
  var compressBtn = document.getElementById('gc-compress')
  var changeBtn = document.getElementById('gc-change')
  var progressEl = document.getElementById('gc-progress')
  var progressText = document.getElementById('gc-progress-text')
  var progressFill = document.getElementById('gc-progress-fill')
  var progressDetail = document.getElementById('gc-progress-detail')
  var errorEl = document.getElementById('gc-error')
  var errorText = document.getElementById('gc-error-text')
  var errorRetry = document.getElementById('gc-error-retry')
  var resultEl = document.getElementById('gc-result')
  var originalImg = document.getElementById('gc-original-img')
  var resultImg = document.getElementById('gc-result-img')
  var resultStats = document.getElementById('gc-result-stats')
  var downloadBtn = document.getElementById('gc-download')
  var newBtn = document.getElementById('gc-new')
  var mobileBanner = document.getElementById('gc-mobile-banner')
  var mobileBannerDismiss = document.getElementById('gc-mobile-banner-dismiss')

  // ── State ──
  var currentFile = null
  var previewUrl = null
  var resultBlobUrl = null
  var parsedFrames = null // [{ rgba, delay }]
  // Decoding a large GIF takes tens of seconds. Without a sequence guard a
  // second upload started mid-decode races the first, and whichever finishes
  // LAST wins, leaving the preview and the frames out of sync.
  var loadSeq = 0
  var fitNoticeEl = null
  var gifWidth = 0
  var gifHeight = 0
  var originalSize = 0
  var selectedPreset = 'balanced'
  var MAX_FILE_SIZE = 50 * 1024 * 1024

  // ── Mobile banner ──
  if (mobileBanner && window.matchMedia('(max-width: 768px)').matches) {
    var dismissed = false
    try { dismissed = localStorage.getItem('mt:gc-mobile-nudge') === '1' } catch (_) {}
    if (!dismissed) mobileBanner.style.display = ''
  }
  if (mobileBannerDismiss) {
    mobileBannerDismiss.addEventListener('click', function () {
      mobileBanner.style.display = 'none'
      try { localStorage.setItem('mt:gc-mobile-nudge', '1') } catch (_) {}
    })
  }

  // ── State management ──
  function showState(state) {
    dropzone.style.display = state === 'upload' ? '' : 'none'
    infoEl.style.display = state === 'upload' ? '' : 'none'
    settingsEl.style.display = state === 'configure' ? '' : 'none'
    progressEl.style.display = state === 'processing' ? '' : 'none'
    errorEl.style.display = state === 'error' ? '' : 'none'
    resultEl.style.display = state === 'result' ? '' : 'none'
  }
  function showError(msg) { errorText.textContent = msg; showState('error') }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

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

  // Silently handing back a 702x413 GIF for a 2808x1650 upload would read as
  // the tool mangling the file. Say what was done and why.
  function showFitNotice(message) {
    if (!settingsEl) return
    if (!message) {
      if (fitNoticeEl) fitNoticeEl.hidden = true
      return
    }
    if (!fitNoticeEl) {
      fitNoticeEl = document.createElement('p')
      fitNoticeEl.className = 'tool-note'
      fitNoticeEl.id = 'gc-fit-notice'
      settingsEl.insertBefore(fitNoticeEl, settingsEl.firstChild)
    }
    fitNoticeEl.hidden = false
    fitNoticeEl.textContent = message
  }

  // ── File handling ──
  async function handleFile(file) {
    if (!file.type || file.type !== 'image/gif') { showError('Please select a GIF file.'); return }
    if (file.size > MAX_FILE_SIZE) {
      showError('File too large (' + formatSize(file.size) + '). Maximum is 50 MB.')
      return
    }

    currentFile = file
    originalSize = file.size
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    previewUrl = URL.createObjectURL(file)
    previewImg.src = previewUrl

    try {
      showState('processing')
      progressText.textContent = 'Reading GIF...'
      progressFill.style.width = '10%'
      progressDetail.textContent = 'Loading decoder...'

      var seq = ++loadSeq
      var isCurrent = function () { return seq === loadSeq }

      var parsed = await streamGifFrames(file, {
        isCurrent: isCurrent,
        onProgress: function (done, total) {
          progressDetail.textContent = 'Reading frame ' + (done + 1) + ' / ' + total + '...'
          progressFill.style.width = (10 + Math.round((done / total) * 30)) + '%'
        },
      })
      if (!isCurrent()) return

      parsedFrames = parsed.parsedFrames
      gifWidth = parsed.width
      gifHeight = parsed.height

      // Report the source file's real shape, not the decode size — the notice
      // below is what explains the difference.
      metaFrames.textContent = parsed.rawFrames.length
      metaDims.textContent = parsed.sourceWidth + '×' + parsed.sourceHeight
      metaSize.textContent = formatSize(originalSize)
      showFitNotice(parsed.notice)

      showState('configure')
    } catch (err) {
      if (err && err.message === STALE_LOAD) return
      console.error('GIF read error:', err)
      showError('Failed to read GIF: ' + (err.message || String(err)))
    }
  }

  // ── Preset buttons ──
  var presetButtonEls = presetBtns.querySelectorAll('.gc-preset-btn')
  presetButtonEls.forEach(function (btn) {
    btn.addEventListener('click', function () {
      presetButtonEls.forEach(function (b) { b.classList.remove('active') })
      btn.classList.add('active')
      selectedPreset = btn.dataset.preset
      // Sync advanced controls to the preset values so they stay consistent
      var s = getPresetSettings(selectedPreset)
      if (s) {
        colorsSelect.value = String(s.colors)
        scaleSelect.value = String(s.scale)
        skipSelect.value = String(s.skip)
      }
    })
  })

  // ── Advanced toggle ──
  advToggle.addEventListener('click', function () {
    var open = advPanel.style.display !== 'none' && advPanel.style.display !== ''
    // Toggle: if currently hidden, show; else hide
    if (advPanel.style.display === 'none' || advPanel.style.display === '') {
      advPanel.style.display = 'block'
      advToggle.setAttribute('aria-expanded', 'true')
    } else {
      advPanel.style.display = 'none'
      advToggle.setAttribute('aria-expanded', 'false')
    }
  })

  // Editing an advanced control means the user is overriding the preset —
  // settings come straight from the selects at compress time, so nothing to do here
  // except keep the preset highlight honest (clear it to signal "custom").
  function markCustom() {
    presetButtonEls.forEach(function (b) { b.classList.remove('active') })
    selectedPreset = 'custom'
  }
  colorsSelect.addEventListener('change', markCustom)
  scaleSelect.addEventListener('change', markCustom)
  skipSelect.addEventListener('change', markCustom)

  // ── Compress ──
  compressBtn.addEventListener('click', async function () {
    if (!parsedFrames || parsedFrames.length === 0) return

    var colors = parseInt(colorsSelect.value, 10)
    var scale = parseInt(scaleSelect.value, 10)
    var skip = parseInt(skipSelect.value, 10)

    showState('processing')
    progressText.textContent = 'Compressing GIF...'
    progressFill.style.width = '0%'
    progressDetail.textContent = 'Loading encoder...'

    try {
      var gifencMod = await import('https://cdn.jsdelivr.net/npm/gifenc@1.0.3/dist/gifenc.esm.js')
      var GIFEncoder = gifencMod.GIFEncoder
      var quantize = gifencMod.quantize
      var applyPalette = gifencMod.applyPalette

      var dims = computeScaledDims(gifWidth, gifHeight, scale)
      var outW = dims.width
      var outH = dims.height

      var keepIndices = selectFrameIndices(parsedFrames.length, skip)
      var allDelays = parsedFrames.map(function (f) { return f.delay })
      var keptDelays = mergeDelays(allDelays, skip)

      // Reusable scaling canvas
      var scaleCanvas = document.createElement('canvas')
      scaleCanvas.width = outW
      scaleCanvas.height = outH
      var scaleCtx = scaleCanvas.getContext('2d')

      // Source canvas (full-size frame)
      var srcCanvas = document.createElement('canvas')
      srcCanvas.width = gifWidth
      srcCanvas.height = gifHeight
      var srcCtx = srcCanvas.getContext('2d')

      var enc = GIFEncoder()
      var total = keepIndices.length

      for (var k = 0; k < total; k++) {
        progressDetail.textContent = 'Frame ' + (k + 1) + ' / ' + total
        progressFill.style.width = Math.round((k / total) * 95) + '%'

        var frame = parsedFrames[keepIndices[k]]
        var rgba

        if (outW === gifWidth && outH === gifHeight) {
          rgba = frame.rgba
        } else {
          // Scale the frame down through canvas
          var srcImg = new ImageData(new Uint8ClampedArray(frame.rgba), gifWidth, gifHeight)
          srcCtx.putImageData(srcImg, 0, 0)
          scaleCtx.clearRect(0, 0, outW, outH)
          scaleCtx.drawImage(srcCanvas, 0, 0, gifWidth, gifHeight, 0, 0, outW, outH)
          rgba = scaleCtx.getImageData(0, 0, outW, outH).data
        }

        var palette = quantize(rgba, colors)
        var indexed = applyPalette(rgba, palette)

        enc.writeFrame(indexed, outW, outH, {
          palette: palette,
          delay: Math.max(keptDelays[k] || frame.delay, 20),
        })

        if (k % 4 === 3) await new Promise(function (r) { setTimeout(r, 0) })
      }

      enc.finish()
      progressFill.style.width = '100%'
      progressDetail.textContent = 'Done'

      if (resultBlobUrl) URL.revokeObjectURL(resultBlobUrl)
      var blob = new Blob([enc.bytes()], { type: 'image/gif' })
      resultBlobUrl = URL.createObjectURL(blob)

      originalImg.src = previewUrl
      resultImg.src = resultBlobUrl

      var savings = formatSavings(originalSize, blob.size)
      var dimsLabel = outW + '×' + outH
      var framesLabel = total + (total === 1 ? ' frame' : ' frames')
      var detail = formatSize(originalSize) + ' → <strong>' + formatSize(blob.size) + '</strong> (' + savings.label +
        ') — ' + dimsLabel + ', ' + framesLabel + ', ' + colors + ' colors'

      if (savings.percent <= 0) {
        // The re-encoded file isn't smaller — this GIF is already well optimized.
        // Be honest and point the user at a stronger setting instead of pretending it worked.
        resultStats.innerHTML =
          '<span class="gc-warn">This GIF is already well optimized — these settings did not make it smaller. ' +
          'Try fewer colors, a smaller size, or dropping frames in Advanced settings.</span>' +
          '<span class="gc-result-detail">' + detail + '</span>'
      } else {
        resultStats.innerHTML = detail
      }

      showState('result')
    } catch (err) {
      console.error('GIF compression failed:', err)
      showError('Compression failed: ' + (err.message || String(err)))
    }
  })

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
    fileInput.value = ''
    currentFile = null
    parsedFrames = null
    gifWidth = 0
    gifHeight = 0
    originalSize = 0
    selectedPreset = 'balanced'
    if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = null }
    if (resultBlobUrl) { URL.revokeObjectURL(resultBlobUrl); resultBlobUrl = null }
    presetButtonEls.forEach(function (b) { b.classList.toggle('active', b.dataset.preset === 'balanced') })
    colorsSelect.value = '64'
    scaleSelect.value = '100'
    skipSelect.value = '1'
    advPanel.style.display = 'none'
    advToggle.setAttribute('aria-expanded', 'false')
    showState('upload')
  }

  changeBtn.addEventListener('click', function () {
    if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = null }
    fileInput.value = ''
    currentFile = null
    parsedFrames = null
    showState('upload')
  })
  newBtn.addEventListener('click', reset)
  errorRetry.addEventListener('click', function () {
    // Return to configure if we still have frames, else upload
    if (parsedFrames && parsedFrames.length) showState('configure')
    else showState('upload')
  })

  showState('upload')
})()
