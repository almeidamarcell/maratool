import { hexToRgb, rgbToHex, isColorMatch, buildTransparentFrame, findOrAddTransparentIndex } from './gif-bg-remover-core.js'

;(function () {
  'use strict'

  // ── DOM refs ──
  var dropzone = document.getElementById('gbr-dropzone')
  var fileInput = document.getElementById('gbr-file-input')
  var editorEl = document.getElementById('gbr-editor')
  var previewImg = document.getElementById('gbr-preview-img')
  var pickCanvas = document.getElementById('gbr-pick-canvas')
  var pickOverlay = document.getElementById('gbr-pick-overlay')
  var swatchEl = document.getElementById('gbr-swatch')
  var hexInput = document.getElementById('gbr-hex-input')
  var toleranceSlider = document.getElementById('gbr-tolerance')
  var toleranceVal = document.getElementById('gbr-tolerance-val')
  var statsEl = document.getElementById('gbr-stats')
  var removeBtn = document.getElementById('gbr-remove')
  var changeBtn = document.getElementById('gbr-change')
  var progressEl = document.getElementById('gbr-progress')
  var progressText = document.getElementById('gbr-progress-text')
  var progressFill = document.getElementById('gbr-progress-fill')
  var progressDetail = document.getElementById('gbr-progress-detail')
  var errorEl = document.getElementById('gbr-error')
  var errorText = document.getElementById('gbr-error-text')
  var errorRetry = document.getElementById('gbr-error-retry')
  var resultEl = document.getElementById('gbr-result')
  var originalImg = document.getElementById('gbr-original-img')
  var resultImg = document.getElementById('gbr-result-img')
  var resultStats = document.getElementById('gbr-result-stats')
  var downloadBtn = document.getElementById('gbr-download')
  var newBtn = document.getElementById('gbr-new')

  // ── State ──
  var currentFile = null
  var previewUrl = null
  var resultBlobUrl = null
  var parsedFrames = null
  var gifWidth = 0
  var gifHeight = 0
  var targetColor = { r: 255, g: 255, b: 255 }

  // ── State management ──
  function showState(state) {
    dropzone.style.display = state === 'upload' ? '' : 'none'
    editorEl.style.display = state === 'configure' ? '' : 'none'
    progressEl.style.display = state === 'processing' ? '' : 'none'
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
  async function handleFile(file) {
    if (!file.type || file.type !== 'image/gif') {
      showError('Please select a GIF file.')
      return
    }
    if (file.size > 50 * 1024 * 1024) {
      showError('File too large. Maximum is 50 MB.')
      return
    }

    currentFile = file
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    previewUrl = URL.createObjectURL(file)
    previewImg.src = previewUrl

    try {
      showState('processing')
      progressText.textContent = 'Parsing GIF frames...'
      progressFill.style.width = '10%'
      progressDetail.textContent = 'Loading decoder...'

      var arrayBuffer = await file.arrayBuffer()
      var gifuctJs = await loadGifuct()
      var gif = gifuctJs.parseGIF(arrayBuffer)
      var frames = gifuctJs.decompressFrames(gif, true)

      if (!frames || frames.length === 0) {
        showError('Could not parse GIF frames.')
        return
      }

      // Composite frames to full RGBA
      gifWidth = frames[0].dims.width
      gifHeight = frames[0].dims.height
      // Use the GIF logical screen size if available
      if (gif.lsd && gif.lsd.width) gifWidth = gif.lsd.width
      if (gif.lsd && gif.lsd.height) gifHeight = gif.lsd.height

      progressDetail.textContent = 'Compositing ' + frames.length + ' frames...'
      progressFill.style.width = '30%'

      parsedFrames = compositeFrames(frames, gifWidth, gifHeight)

      // Draw first frame on pick canvas
      pickCanvas.width = gifWidth
      pickCanvas.height = gifHeight
      var ctx = pickCanvas.getContext('2d')
      var imgData = new ImageData(new Uint8ClampedArray(parsedFrames[0].rgba), gifWidth, gifHeight)
      ctx.putImageData(imgData, 0, 0)

      statsEl.innerHTML = '<strong>' + frames.length + '</strong> frames \u2014 ' + gifWidth + '\u00d7' + gifHeight

      // Set default color to white
      setColor(255, 255, 255)

      showState('configure')
    } catch (err) {
      console.error('GIF parse error:', err)
      showError('Failed to parse GIF: ' + (err.message || String(err)))
    }
  }

  // ── gifuct-js loader ──
  var gifuctModule = null
  async function loadGifuct() {
    if (gifuctModule) return gifuctModule
    var mod = await import('https://cdn.jsdelivr.net/npm/gifuct-js@2.1.2/+esm')
    gifuctModule = { parseGIF: mod.parseGIF, decompressFrames: mod.decompressFrames }
    return gifuctModule
  }

  // ── Frame compositing ──
  function compositeFrames(frames, w, h) {
    var canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    var ctx = canvas.getContext('2d')
    var result = []

    for (var i = 0; i < frames.length; i++) {
      var frame = frames[i]
      var patch = new ImageData(
        new Uint8ClampedArray(frame.patch),
        frame.dims.width,
        frame.dims.height
      )

      // Create temp canvas for the patch
      var tmpCanvas = document.createElement('canvas')
      tmpCanvas.width = frame.dims.width
      tmpCanvas.height = frame.dims.height
      var tmpCtx = tmpCanvas.getContext('2d')
      tmpCtx.putImageData(patch, 0, 0)

      ctx.drawImage(tmpCanvas, frame.dims.left, frame.dims.top)

      var fullFrame = ctx.getImageData(0, 0, w, h)
      result.push({
        rgba: new Uint8ClampedArray(fullFrame.data),
        delay: frame.delay,
      })

      // Handle disposal
      if (frame.disposalType === 2) {
        ctx.clearRect(frame.dims.left, frame.dims.top, frame.dims.width, frame.dims.height)
      }
    }

    return result
  }

  // ── Color picking ──
  var previewWrap = document.querySelector('.gbr-preview-wrap')
  previewWrap.addEventListener('click', function (e) {
    var rect = previewImg.getBoundingClientRect()
    var scaleX = gifWidth / rect.width
    var scaleY = gifHeight / rect.height
    var x = Math.floor((e.clientX - rect.left) * scaleX)
    var y = Math.floor((e.clientY - rect.top) * scaleY)
    x = Math.max(0, Math.min(x, gifWidth - 1))
    y = Math.max(0, Math.min(y, gifHeight - 1))

    var ctx = pickCanvas.getContext('2d')
    var pixel = ctx.getImageData(x, y, 1, 1).data
    setColor(pixel[0], pixel[1], pixel[2])
  })

  function setColor(r, g, b) {
    targetColor = { r: r, g: g, b: b }
    var hex = rgbToHex(r, g, b)
    swatchEl.style.background = hex
    hexInput.value = hex
  }

  hexInput.addEventListener('input', function () {
    var parsed = hexToRgb(hexInput.value)
    if (parsed) {
      targetColor = parsed
      swatchEl.style.background = rgbToHex(parsed.r, parsed.g, parsed.b)
    }
  })

  toleranceSlider.addEventListener('input', function () {
    toleranceVal.textContent = toleranceSlider.value + '%'
  })

  // ── Processing ──
  removeBtn.addEventListener('click', async function () {
    if (!parsedFrames || parsedFrames.length === 0) return

    var tolerance = parseInt(toleranceSlider.value, 10)
    var tr = targetColor.r, tg = targetColor.g, tb = targetColor.b

    showState('processing')
    progressText.textContent = 'Removing background...'
    progressFill.style.width = '0%'
    progressDetail.textContent = 'Loading encoder...'

    try {
      var gifencMod = await import('https://cdn.jsdelivr.net/npm/gifenc@1.0.3/dist/gifenc.esm.js')
      var GIFEncoder = gifencMod.GIFEncoder
      var quantize = gifencMod.quantize
      var applyPalette = gifencMod.applyPalette

      var gif = GIFEncoder()
      var total = parsedFrames.length

      for (var i = 0; i < total; i++) {
        progressDetail.textContent = 'Processing frame ' + (i + 1) + ' / ' + total
        progressFill.style.width = Math.round((i / total) * 100) + '%'

        var frame = parsedFrames[i]
        var rgba = frame.rgba
        var pixelCount = gifWidth * gifHeight

        var palette = quantize(rgba, 255)
        var indexed = applyPalette(rgba, palette)

        var transpIdx = findOrAddTransparentIndex(palette)
        var finalIndexed = buildTransparentFrame(indexed, rgba, gifWidth, gifHeight, tr, tg, tb, tolerance, transpIdx)

        gif.writeFrame(finalIndexed, gifWidth, gifHeight, {
          palette: palette,
          delay: Math.max(frame.delay, 20),
          transparent: true,
          transparentIndex: transpIdx,
          dispose: 2,
        })

        // Yield to event loop every 5 frames
        if (i % 5 === 4) {
          await new Promise(function (r) { setTimeout(r, 0) })
        }
      }

      gif.finish()

      progressFill.style.width = '100%'
      progressDetail.textContent = 'Encoding complete!'

      if (resultBlobUrl) URL.revokeObjectURL(resultBlobUrl)
      var blob = new Blob([gif.bytes()], { type: 'image/gif' })
      resultBlobUrl = URL.createObjectURL(blob)

      originalImg.src = previewUrl
      resultImg.src = resultBlobUrl
      resultStats.innerHTML = '<strong>' + total + '</strong> frames \u2014 ' + gifWidth + '\u00d7' + gifHeight + ' \u2014 <strong>' + formatSize(blob.size) + '</strong>'

      showState('result')
    } catch (err) {
      console.error('GIF background removal failed:', err)
      showError('Processing failed: ' + (err.message || String(err)))
    }
  })

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  // ── Download ──
  downloadBtn.addEventListener('click', function () {
    if (!resultBlobUrl) return
    var a = document.createElement('a')
    a.href = resultBlobUrl
    a.download = (currentFile ? currentFile.name.replace(/\.gif$/i, '') : 'gif') + '-transparent.gif'
    a.click()
  })

  // ── Reset ──
  function reset() {
    fileInput.value = ''
    currentFile = null
    parsedFrames = null
    gifWidth = 0
    gifHeight = 0
    targetColor = { r: 255, g: 255, b: 255 }
    if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = null }
    if (resultBlobUrl) { URL.revokeObjectURL(resultBlobUrl); resultBlobUrl = null }
    toleranceSlider.value = 15
    toleranceVal.textContent = '15%'
    hexInput.value = ''
    swatchEl.style.background = '#ffffff'
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
  errorRetry.addEventListener('click', reset)

  showState('upload')
})()
