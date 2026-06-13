import { validateVideoFile, formatDuration, formatFileSize } from './fps-converter-core.js'
import { pctToPixels, buildCropArgs, getOutputFilename } from './crop-video-core.js'

;(function () {
  'use strict'

  // ── DOM refs ──
  var dropzone = document.getElementById('cp-dropzone')
  var fileInput = document.getElementById('cp-file-input')
  var infoEl = document.getElementById('cp-info')
  var mobileBanner = document.getElementById('cp-mobile-banner')
  var mobileBannerDismiss = document.getElementById('cp-mobile-banner-dismiss')
  var editorEl = document.getElementById('cp-editor')
  var videoEl = document.getElementById('cp-video')
  var cropOverlay = document.getElementById('cp-crop-overlay')
  var cropBoxEl = document.getElementById('cp-crop-box')
  var shadeTop = document.getElementById('cp-shade-top')
  var shadeBottom = document.getElementById('cp-shade-bottom')
  var shadeLeft = document.getElementById('cp-shade-left')
  var shadeRight = document.getElementById('cp-shade-right')
  var cropReadout = document.getElementById('cp-crop-readout')
  var ratioBtns = document.querySelectorAll('.cp-ratio-btn')
  var cropBtn = document.getElementById('cp-crop-btn')
  var changeBtn = document.getElementById('cp-change-btn')
  var progressEl = document.getElementById('cp-progress')
  var progressText = document.getElementById('cp-progress-text')
  var progressFill = document.getElementById('cp-progress-fill')
  var progressDetail = document.getElementById('cp-progress-detail')
  var errorEl = document.getElementById('cp-error')
  var errorText = document.getElementById('cp-error-text')
  var errorRetry = document.getElementById('cp-error-retry')
  var resultEl = document.getElementById('cp-result')
  var resultVideo = document.getElementById('cp-result-video')
  var resultStats = document.getElementById('cp-result-stats')
  var downloadBtn = document.getElementById('cp-download')
  var newBtn = document.getElementById('cp-new')

  // ── State ──
  var ffmpeg = null
  var ffmpegLoaded = false
  var fetchFile = null
  var currentFile = null
  var previewUrl = null
  var resultBlobUrl = null
  var videoNaturalW = 0
  var videoNaturalH = 0
  var MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024 // 2 GB

  var box = { leftPct: 10, topPct: 10, widthPct: 80, heightPct: 80 }
  var activeRatio = 'free' // 'free' | '16:9' | '9:16' | '1:1' | '4:3' | '3:4'
  var lockedAr = null // null or numeric W/H ratio

  // Drag/resize state
  var dragMode = null // null | 'move' | 'resize'
  var activeHandle = null // 'tl' | 'tr' | 'bl' | 'br'
  var dragStartX = 0
  var dragStartY = 0
  var boxAtDragStart = null

  // ── Mobile banner ──
  if (mobileBanner && window.matchMedia('(max-width: 768px)').matches) {
    var dismissed = false
    try { dismissed = localStorage.getItem('mt:cp-mobile-nudge') === '1' } catch (_) {}
    if (!dismissed) mobileBanner.style.display = ''
  }
  if (mobileBannerDismiss) {
    mobileBannerDismiss.addEventListener('click', function () {
      mobileBanner.style.display = 'none'
      try { localStorage.setItem('mt:cp-mobile-nudge', '1') } catch (_) {}
    })
  }

  // ── State machine ──
  function showState(state) {
    dropzone.style.display = state === 'dropzone' ? '' : 'none'
    infoEl.style.display = state === 'dropzone' ? '' : 'none'
    editorEl.style.display = state === 'editor' ? '' : 'none'
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

    videoEl.onloadedmetadata = function () {
      videoNaturalW = videoEl.videoWidth
      videoNaturalH = videoEl.videoHeight
      // Reset box to default
      box = { leftPct: 10, topPct: 10, widthPct: 80, heightPct: 80 }
      activeRatio = 'free'
      lockedAr = null
      updateRatioButtons()
      updateOverlay()
    }
    showState('editor')
  }

  // ── Overlay rendering ──
  function updateOverlay() {
    var b = box
    cropBoxEl.style.left = b.leftPct + '%'
    cropBoxEl.style.top = b.topPct + '%'
    cropBoxEl.style.width = b.widthPct + '%'
    cropBoxEl.style.height = b.heightPct + '%'
    shadeTop.style.cssText = 'position:absolute;background:rgba(0,0,0,0.5);left:0;right:0;top:0;height:' + b.topPct + '%;pointer-events:none;'
    shadeBottom.style.cssText = 'position:absolute;background:rgba(0,0,0,0.5);left:0;right:0;top:' + (b.topPct + b.heightPct) + '%;bottom:0;pointer-events:none;'
    shadeLeft.style.cssText = 'position:absolute;background:rgba(0,0,0,0.5);left:0;top:' + b.topPct + '%;width:' + b.leftPct + '%;height:' + b.heightPct + '%;pointer-events:none;'
    shadeRight.style.cssText = 'position:absolute;background:rgba(0,0,0,0.5);top:' + b.topPct + '%;left:' + (b.leftPct + b.widthPct) + '%;right:0;height:' + b.heightPct + '%;pointer-events:none;'
    updateReadout()
  }

  function updateReadout() {
    if (!videoNaturalW || !videoNaturalH) { cropReadout.textContent = ''; return }
    var px = pctToPixels(box, videoNaturalW, videoNaturalH)
    cropReadout.textContent = 'Crop: ' + px.w + ' × ' + px.h + ' px'
  }

  // ── Pointer Events for drag/resize ──
  function getOverlayRect() {
    return cropOverlay.getBoundingClientRect()
  }

  function pctFromClient(clientX, clientY) {
    var rect = getOverlayRect()
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    }
  }

  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)) }

  cropBoxEl.addEventListener('pointerdown', function (e) {
    if (e.target.classList.contains('cp-handle')) return // handled separately
    e.stopPropagation()
    e.preventDefault()
    cropBoxEl.setPointerCapture(e.pointerId)
    dragMode = 'move'
    var pt = pctFromClient(e.clientX, e.clientY)
    dragStartX = pt.x
    dragStartY = pt.y
    boxAtDragStart = Object.assign({}, box)
  })

  var handles = cropBoxEl.querySelectorAll('.cp-handle')
  handles.forEach(function (handle) {
    handle.addEventListener('pointerdown', function (e) {
      e.stopPropagation()
      e.preventDefault()
      handle.setPointerCapture(e.pointerId)
      dragMode = 'resize'
      activeHandle = handle.dataset.handle
      var pt = pctFromClient(e.clientX, e.clientY)
      dragStartX = pt.x
      dragStartY = pt.y
      boxAtDragStart = Object.assign({}, box)
    })
  })

  window.addEventListener('pointermove', function (e) {
    if (!dragMode) return
    var pt = pctFromClient(e.clientX, e.clientY)
    var dx = pt.x - dragStartX
    var dy = pt.y - dragStartY

    if (dragMode === 'move') {
      var newLeft = clamp(boxAtDragStart.leftPct + dx, 0, 100 - boxAtDragStart.widthPct)
      var newTop = clamp(boxAtDragStart.topPct + dy, 0, 100 - boxAtDragStart.heightPct)
      box = Object.assign({}, box, { leftPct: newLeft, topPct: newTop })
    } else if (dragMode === 'resize') {
      var b = Object.assign({}, boxAtDragStart)
      var MIN = 10

      if (activeHandle === 'tl') {
        var newL = clamp(b.leftPct + dx, 0, b.leftPct + b.widthPct - MIN)
        var newT = clamp(b.topPct + dy, 0, b.topPct + b.heightPct - MIN)
        var newW = b.leftPct + b.widthPct - newL
        var newH = b.topPct + b.heightPct - newT
        if (lockedAr !== null) {
          // Determine which dim changed more proportionally and lock the other
          var wRatio = newW / b.widthPct
          var hRatio = newH / b.heightPct
          if (Math.abs(wRatio - 1) >= Math.abs(hRatio - 1)) {
            newH = newW / lockedAr
            newT = b.topPct + b.heightPct - newH
            if (newT < 0) { newT = 0; newH = b.topPct + b.heightPct; newW = newH * lockedAr; newL = b.leftPct + b.widthPct - newW }
          } else {
            newW = newH * lockedAr
            newL = b.leftPct + b.widthPct - newW
            if (newL < 0) { newL = 0; newW = b.leftPct + b.widthPct; newH = newW / lockedAr; newT = b.topPct + b.heightPct - newH }
          }
        }
        box = { leftPct: newL, topPct: newT, widthPct: newW, heightPct: newH }
      } else if (activeHandle === 'tr') {
        var newT2 = clamp(b.topPct + dy, 0, b.topPct + b.heightPct - MIN)
        var newW2 = clamp(b.widthPct + dx, MIN, 100 - b.leftPct)
        var newH2 = b.topPct + b.heightPct - newT2
        if (lockedAr !== null) {
          var wRatio2 = newW2 / b.widthPct
          var hRatio2 = newH2 / b.heightPct
          if (Math.abs(wRatio2 - 1) >= Math.abs(hRatio2 - 1)) {
            newH2 = newW2 / lockedAr
            newT2 = b.topPct + b.heightPct - newH2
            if (newT2 < 0) { newT2 = 0; newH2 = b.topPct + b.heightPct; newW2 = newH2 * lockedAr }
            if (b.leftPct + newW2 > 100) { newW2 = 100 - b.leftPct; newH2 = newW2 / lockedAr; newT2 = b.topPct + b.heightPct - newH2 }
          } else {
            newW2 = newH2 * lockedAr
            if (b.leftPct + newW2 > 100) { newW2 = 100 - b.leftPct; newH2 = newW2 / lockedAr; newT2 = b.topPct + b.heightPct - newH2 }
          }
        }
        box = { leftPct: b.leftPct, topPct: newT2, widthPct: newW2, heightPct: newH2 }
      } else if (activeHandle === 'bl') {
        var newL3 = clamp(b.leftPct + dx, 0, b.leftPct + b.widthPct - MIN)
        var newW3 = b.leftPct + b.widthPct - newL3
        var newH3 = clamp(b.heightPct + dy, MIN, 100 - b.topPct)
        if (lockedAr !== null) {
          var wRatio3 = newW3 / b.widthPct
          var hRatio3 = newH3 / b.heightPct
          if (Math.abs(wRatio3 - 1) >= Math.abs(hRatio3 - 1)) {
            newH3 = newW3 / lockedAr
            if (b.topPct + newH3 > 100) { newH3 = 100 - b.topPct; newW3 = newH3 * lockedAr; newL3 = b.leftPct + b.widthPct - newW3 }
          } else {
            newW3 = newH3 * lockedAr
            newL3 = b.leftPct + b.widthPct - newW3
            if (newL3 < 0) { newL3 = 0; newW3 = b.leftPct + b.widthPct; newH3 = newW3 / lockedAr }
          }
        }
        box = { leftPct: newL3, topPct: b.topPct, widthPct: newW3, heightPct: newH3 }
      } else if (activeHandle === 'br') {
        var newW4 = clamp(b.widthPct + dx, MIN, 100 - b.leftPct)
        var newH4 = clamp(b.heightPct + dy, MIN, 100 - b.topPct)
        if (lockedAr !== null) {
          var wRatio4 = newW4 / b.widthPct
          var hRatio4 = newH4 / b.heightPct
          if (Math.abs(wRatio4 - 1) >= Math.abs(hRatio4 - 1)) {
            newH4 = newW4 / lockedAr
            if (b.topPct + newH4 > 100) { newH4 = 100 - b.topPct; newW4 = newH4 * lockedAr }
            if (b.leftPct + newW4 > 100) { newW4 = 100 - b.leftPct; newH4 = newW4 / lockedAr }
          } else {
            newW4 = newH4 * lockedAr
            if (b.leftPct + newW4 > 100) { newW4 = 100 - b.leftPct; newH4 = newW4 / lockedAr }
          }
        }
        box = { leftPct: b.leftPct, topPct: b.topPct, widthPct: newW4, heightPct: newH4 }
      }
    }

    updateOverlay()
  })

  window.addEventListener('pointerup', function (e) {
    if (!dragMode) return
    dragMode = null
    activeHandle = null
    boxAtDragStart = null
    try { cropBoxEl.releasePointerCapture(e.pointerId) } catch (_) {}
    handles.forEach(function (h) {
      try { h.releasePointerCapture(e.pointerId) } catch (_) {}
    })
  })

  // ── Aspect ratio buttons ──
  function getAspectValue(ratio) {
    if (ratio === 'free') return null
    if (ratio === '16:9') return 16 / 9
    if (ratio === '9:16') return 9 / 16
    if (ratio === '1:1') return 1
    if (ratio === '4:3') return 4 / 3
    if (ratio === '3:4') return 3 / 4
    return null
  }

  function snapBoxToAspect(currentBox, ar) {
    if (ar === null) return Object.assign({}, currentBox)
    var cx = currentBox.leftPct + currentBox.widthPct / 2
    var cy = currentBox.topPct + currentBox.heightPct / 2
    var newW = currentBox.widthPct
    var newH = newW / ar
    if (newH > 100) { newH = 100; newW = newH * ar }
    if (newW > 100) { newW = 100; newH = newW / ar }
    var newLeft = cx - newW / 2
    var newTop = cy - newH / 2
    if (newLeft < 0) newLeft = 0
    if (newTop < 0) newTop = 0
    if (newLeft + newW > 100) newLeft = 100 - newW
    if (newTop + newH > 100) newTop = 100 - newH
    return { leftPct: newLeft, topPct: newTop, widthPct: newW, heightPct: newH }
  }

  function updateRatioButtons() {
    ratioBtns.forEach(function (btn) {
      btn.classList.toggle('cp-ratio-btn--active', btn.dataset.ratio === activeRatio)
    })
  }

  ratioBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      activeRatio = btn.dataset.ratio
      lockedAr = getAspectValue(activeRatio)
      if (lockedAr !== null) {
        box = snapBoxToAspect(box, lockedAr)
      }
      updateRatioButtons()
      updateOverlay()
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
          var dur = videoEl.duration || 1
          var pct = Math.min(Math.round((secs / dur) * 100), 99)
          progressFill.style.width = (50 + pct * 0.45) + '%'
          progressDetail.textContent = 'Cropping... ' + pct + '%'
        }
      }
    })

    ffmpeg = ff
    ffmpegLoaded = true
    progressFill.style.width = '50%'
    return ffmpeg
  }

  // ── Crop ──
  cropBtn.addEventListener('click', async function () {
    if (!currentFile) return

    var px = pctToPixels(box, videoNaturalW, videoNaturalH)

    try {
      var ff = await loadFfmpeg()
      progressText.textContent = 'Cropping video...'
      progressFill.style.width = '50%'
      progressDetail.textContent = 'Writing file to memory...'

      var inputExt = getExtension(currentFile.name)
      var inputName = 'input' + inputExt
      var outputName = 'output' + inputExt

      var fileData = await fetchFile(currentFile)
      await ff.writeFile(inputName, fileData)

      ff._lastLogs.length = 0
      progressDetail.textContent = 'Cropping...'
      var args = buildCropArgs({ inputName: inputName, outputName: outputName, x: px.x, y: px.y, w: px.w, h: px.h })
      var ret = await ff.exec(args)

      if (ret !== 0) {
        throw new Error('Crop failed (code ' + ret + '): ' + ff._lastLogs.slice(-3).join(' '))
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
      resultStats.innerHTML = '<strong>' + px.w + ' × ' + px.h + ' px</strong> — <strong>' + formatFileSize(blob.size) + '</strong>'

      showState('result')
    } catch (err) {
      console.error('Crop failed:', err)
      showError('Crop failed: ' + (err.message || String(err)).split('\n')[0])
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
    fileInput.value = ''; currentFile = null; videoNaturalW = 0; videoNaturalH = 0
    box = { leftPct: 10, topPct: 10, widthPct: 80, heightPct: 80 }
    activeRatio = 'free'; lockedAr = null
    if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = null }
    if (resultBlobUrl) { URL.revokeObjectURL(resultBlobUrl); resultBlobUrl = null }
    showState('dropzone')
  }

  changeBtn.addEventListener('click', function () {
    if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = null }
    fileInput.value = ''; currentFile = null
    videoNaturalW = 0; videoNaturalH = 0
    showState('dropzone')
  })
  newBtn.addEventListener('click', reset)
  errorRetry.addEventListener('click', reset)

  showState('dropzone')
})()
