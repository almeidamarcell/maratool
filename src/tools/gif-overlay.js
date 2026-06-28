import {
  parseGifFile, loadImageFromFile, encodeFramesToGif, downloadBlob, stemFilename,
  isGifFile, isStaticImageFile, frameRangeIndices,
} from './gif-shared.js'

;(function () {
  var P = 'gov'
  var dropzone = document.getElementById(P + '-dropzone')
  var fileInput = document.getElementById(P + '-file')
  var workspace = document.getElementById(P + '-workspace')
  var progress = document.getElementById(P + '-progress')
  var progressText = document.getElementById(P + '-progress-text')
  var progressFill = document.getElementById(P + '-progress-fill')
  var errorEl = document.getElementById(P + '-error')
  var errorText = document.getElementById(P + '-error-text')

  var baseGif = null
  var overlay = null
  var overlayPos = { x: 0, y: 0, w: 100, h: 100 }
  var dragging = false
  var dragOff = { x: 0, y: 0 }

  function showErr(msg) {
    errorEl.style.display = ''
    errorText.textContent = msg
    workspace.style.display = 'none'
    progress.style.display = 'none'
  }

  function buildWorkspace() {
    workspace.innerHTML =
      '<div class="' + P + '-preview-wrap" style="position:relative;"><canvas id="' + P + '-canvas"></canvas></div>' +
      '<p class="tool-hint">Drag the overlay to position it. Use size and opacity sliders below.</p>' +
      '<div class="' + P + '-controls">' +
      '<div class="' + P + '-row"><label class="tool-label">Overlay width % <input type="range" id="' + P + '-scale" min="5" max="100" value="25" /></label>' +
      '<label class="tool-label">Opacity <input type="range" id="' + P + '-opacity" min="10" max="100" value="100" /></label></div>' +
      '<div class="' + P + '-row"><label class="tool-label">Frame start <input type="number" id="' + P + '-fstart" value="0" min="0" class="tool-input" style="width:4rem;" /></label>' +
      '<label class="tool-label">Frame end <input type="number" id="' + P + '-fend" value="' + (baseGif.parsedFrames.length - 1) + '" class="tool-input" style="width:4rem;" /></label></div>' +
      '<div class="' + P + '-actions">' +
      '<button class="copy-btn" id="' + P + '-overlay-btn">Choose overlay</button>' +
      '<input type="file" id="' + P + '-overlay-file" accept="image/*" hidden />' +
      '<button class="tool-button" id="' + P + '-apply">Apply & download</button>' +
      '<button class="copy-btn" id="' + P + '-change">Change base GIF</button></div></div>'
    workspace.style.display = ''
    overlayPos.w = Math.round(baseGif.width * 0.25)
    overlayPos.h = overlayPos.w
    overlayPos.x = Math.round((baseGif.width - overlayPos.w) / 2)
    overlayPos.y = Math.round((baseGif.height - overlayPos.h) / 2)

    var canvas = document.getElementById(P + '-canvas')
    setupCanvas(canvas)
    document.getElementById(P + '-scale').addEventListener('input', updateScale)
    document.getElementById(P + '-opacity').addEventListener('input', redraw)
    document.getElementById(P + '-overlay-btn').addEventListener('click', function () {
      document.getElementById(P + '-overlay-file').click()
    })
    document.getElementById(P + '-overlay-file').addEventListener('change', async function (e) {
      var f = e.target.files[0]
      if (!f) return
      if (isGifFile(f)) {
        var d = await parseGifFile(f)
        overlay = { type: 'gif', data: d }
      } else if (isStaticImageFile(f)) {
        overlay = { type: 'static', image: await loadImageFromFile(f) }
      }
      redraw()
    })
    document.getElementById(P + '-apply').addEventListener('click', apply)
    document.getElementById(P + '-change').addEventListener('click', reset)
    redraw()
  }

  function updateScale() {
    var pct = parseInt(document.getElementById(P + '-scale').value, 10) / 100
    var aspect = overlay && overlay.type === 'static'
      ? overlay.image.naturalHeight / overlay.image.naturalWidth
      : 1
    overlayPos.w = Math.round(baseGif.width * pct)
    overlayPos.h = Math.round(overlayPos.w * aspect)
    redraw()
  }

  function setupCanvas(canvas) {
    canvas.width = baseGif.width
    canvas.height = baseGif.height
    canvas.addEventListener('mousedown', function (e) {
      var r = canvas.getBoundingClientRect()
      var x = (e.clientX - r.left) * (canvas.width / r.width)
      var y = (e.clientY - r.top) * (canvas.height / r.height)
      if (x >= overlayPos.x && x <= overlayPos.x + overlayPos.w && y >= overlayPos.y && y <= overlayPos.y + overlayPos.h) {
        dragging = true
        dragOff.x = x - overlayPos.x
        dragOff.y = y - overlayPos.y
      }
    })
    canvas.addEventListener('mousemove', function (e) {
      if (!dragging) return
      var r = canvas.getBoundingClientRect()
      overlayPos.x = (e.clientX - r.left) * (canvas.width / r.width) - dragOff.x
      overlayPos.y = (e.clientY - r.top) * (canvas.height / r.height) - dragOff.y
      redraw()
    })
    canvas.addEventListener('mouseup', function () { dragging = false })
  }

  function drawOverlay(ctx, frameIndex) {
    if (!overlay) return
    var opacity = parseInt(document.getElementById(P + '-opacity').value, 10) / 100
    ctx.globalAlpha = opacity
    if (overlay.type === 'static') {
      ctx.drawImage(overlay.image, overlayPos.x, overlayPos.y, overlayPos.w, overlayPos.h)
    } else {
      var idx = frameIndex % overlay.data.parsedFrames.length
      var f = overlay.data.parsedFrames[idx]
      var tmp = document.createElement('canvas')
      tmp.width = overlay.data.width; tmp.height = overlay.data.height
      tmp.getContext('2d').putImageData(
        new ImageData(new Uint8ClampedArray(f.rgba), overlay.data.width, overlay.data.height), 0, 0
      )
      ctx.drawImage(tmp, overlayPos.x, overlayPos.y, overlayPos.w, overlayPos.h)
    }
    ctx.globalAlpha = 1
  }

  function redraw() {
    var canvas = document.getElementById(P + '-canvas')
    var ctx = canvas.getContext('2d')
    var f = baseGif.parsedFrames[0]
    ctx.putImageData(new ImageData(new Uint8ClampedArray(f.rgba), baseGif.width, baseGif.height), 0, 0)
    drawOverlay(ctx, 0)
    ctx.strokeStyle = '#2d6ef6'
    ctx.strokeRect(overlayPos.x, overlayPos.y, overlayPos.w, overlayPos.h)
  }

  function compositeFrame(baseRgba, frameIndex) {
    var canvas = document.createElement('canvas')
    canvas.width = baseGif.width; canvas.height = baseGif.height
    var ctx = canvas.getContext('2d')
    ctx.putImageData(new ImageData(new Uint8ClampedArray(baseRgba), baseGif.width, baseGif.height), 0, 0)
    drawOverlay(ctx, frameIndex)
    return ctx.getImageData(0, 0, baseGif.width, baseGif.height).data
  }

  async function apply() {
    if (!baseGif) return
    progress.style.display = ''
    workspace.style.display = 'none'
    errorEl.style.display = 'none'
    var start = parseInt(document.getElementById(P + '-fstart').value, 10) || 0
    var end = parseInt(document.getElementById(P + '-fend').value, 10)
    var range = frameRangeIndices(baseGif.parsedFrames.length, start, end)
    var rangeSet = {}
    range.forEach(function (i) { rangeSet[i] = true })

    try {
      var frames = baseGif.parsedFrames.map(function (f, i) {
        var rgba = rangeSet[i] ? compositeFrame(f.rgba, i) : f.rgba
        return { rgba: rgba, delay: f.delay }
      })
      var blob = await encodeFramesToGif(frames, baseGif.width, baseGif.height, {
        onProgress: function (k, t) {
          progressFill.style.width = Math.round((k / t) * 100) + '%'
          progressText.textContent = 'Frame ' + (k + 1) + ' / ' + t
        },
      })
      downloadBlob(blob, stemFilename(baseGif.file.name, '-overlay', 'gif'))
      progress.style.display = 'none'
      workspace.style.display = ''
    } catch (e) {
      showErr(e.message || String(e))
    }
  }

  async function handleFile(file) {
    if (!isGifFile(file)) { showErr('Upload a base GIF first.'); return }
    dropzone.style.display = 'none'
    progress.style.display = ''
    try {
      var data = await parseGifFile(file)
      baseGif = Object.assign({ file: file }, data)
      progress.style.display = 'none'
      buildWorkspace()
    } catch (e) {
      showErr(e.message || String(e))
      dropzone.style.display = ''
    }
  }

  function reset() {
    baseGif = null
    overlay = null
    workspace.innerHTML = ''
    workspace.style.display = 'none'
    dropzone.style.display = ''
    fileInput.value = ''
  }

  dropzone.addEventListener('click', function () { fileInput.click() })
  fileInput.setAttribute('accept', 'image/gif')
  dropzone.addEventListener('dragover', function (e) { e.preventDefault(); dropzone.classList.add('drag-over') })
  dropzone.addEventListener('dragleave', function () { dropzone.classList.remove('drag-over') })
  dropzone.addEventListener('drop', function (e) {
    e.preventDefault(); dropzone.classList.remove('drag-over')
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0])
  })
  fileInput.addEventListener('change', function () {
    if (fileInput.files[0]) handleFile(fileInput.files[0])
  })
})()
