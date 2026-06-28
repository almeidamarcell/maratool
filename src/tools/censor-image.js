import {
  loadMediaFile, encodeFramesToGif, downloadBlob, stemFilename,
  canvasFromRgba, isImageOrGifFile, frameRangeIndices,
} from './gif-shared.js'
import { applyCensorRect } from './image-effect-core.js'

;(function () {
  var P = 'cen'
  var dropzone = document.getElementById(P + '-dropzone')
  var fileInput = document.getElementById(P + '-file')
  var workspace = document.getElementById(P + '-workspace')
  var progress = document.getElementById(P + '-progress')
  var progressText = document.getElementById(P + '-progress-text')
  var progressFill = document.getElementById(P + '-progress-fill')
  var errorEl = document.getElementById(P + '-error')
  var errorText = document.getElementById(P + '-error-text')

  var media = null
  var rects = []
  var drawing = false
  var startX = 0, startY = 0

  function showErr(msg) {
    errorEl.style.display = ''
    errorText.textContent = msg
    workspace.style.display = 'none'
    progress.style.display = 'none'
  }

  function buildWorkspace() {
    workspace.innerHTML =
      '<div class="' + P + '-preview-wrap" style="position:relative;"><canvas id="' + P + '-canvas"></canvas></div>' +
      '<p class="tool-hint">Click and drag on the preview to draw censor regions.</p>' +
      '<div class="' + P + '-controls">' +
      '<div class="' + P + '-row"><label class="tool-label">Effect <select id="' + P + '-effect" class="tool-input">' +
      '<option value="pixelate">Pixelate</option><option value="blur">Blur</option></select></label>' +
      '<label class="tool-label">Intensity <input type="range" id="' + P + '-intensity" min="2" max="20" value="10" /></label></div>' +
      '<div class="' + P + '-row"><label class="tool-label">Frame start <input type="number" id="' + P + '-fstart" value="0" min="0" class="tool-input" style="width:4rem;" /></label>' +
      '<label class="tool-label">Frame end <input type="number" id="' + P + '-fend" value="' + (media.type === 'gif' ? media.gifData.parsedFrames.length - 1 : 0) + '" class="tool-input" style="width:4rem;" /></label></div>' +
      '<div class="' + P + '-actions">' +
      '<button class="copy-btn" id="' + P + '-clear">Clear regions</button>' +
      '<button class="tool-button" id="' + P + '-apply">Apply & download</button>' +
      '<button class="copy-btn" id="' + P + '-change">Change file</button></div></div>'
    workspace.style.display = ''
    rects = []
    var canvas = document.getElementById(P + '-canvas')
    setupCanvas(canvas)
    document.getElementById(P + '-apply').addEventListener('click', apply)
    document.getElementById(P + '-clear').addEventListener('click', function () { rects = []; redraw() })
    document.getElementById(P + '-change').addEventListener('click', reset)
  }

  function setupCanvas(canvas) {
    var w, h, rgba
    if (media.type === 'static') {
      w = media.width; h = media.height
      canvas.width = w; canvas.height = h
      canvas.getContext('2d').drawImage(media.image, 0, 0)
    } else {
      w = media.gifData.width; h = media.gifData.height
      rgba = media.gifData.parsedFrames[0].rgba
      canvas.width = w; canvas.height = h
      canvas.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(rgba), w, h), 0, 0)
    }

    canvas.addEventListener('mousedown', function (e) {
      drawing = true
      var r = canvas.getBoundingClientRect()
      var scaleX = w / r.width, scaleY = h / r.height
      startX = (e.clientX - r.left) * scaleX
      startY = (e.clientY - r.top) * scaleY
    })
    canvas.addEventListener('mousemove', function (e) {
      if (!drawing) return
      var r = canvas.getBoundingClientRect()
      var scaleX = w / r.width, scaleY = h / r.height
      var x = (e.clientX - r.left) * scaleX
      var y = (e.clientY - r.top) * scaleY
      rects[rects.length - 1] = {
        x: Math.min(startX, x), y: Math.min(startY, y),
        w: Math.abs(x - startX), h: Math.abs(y - startY),
      }
      redraw()
    })
    canvas.addEventListener('mouseup', function () {
      if (!drawing) return
      drawing = false
      if (rects.length && rects[rects.length - 1].w < 4 && rects[rects.length - 1].h < 4) rects.pop()
    })
    canvas.addEventListener('mousedown', function () {
      rects.push({ x: 0, y: 0, w: 0, h: 0 })
    })
  }

  function redraw() {
    var canvas = document.getElementById(P + '-canvas')
    var ctx = canvas.getContext('2d')
    if (media.type === 'static') {
      ctx.drawImage(media.image, 0, 0)
    } else {
      var f = media.gifData.parsedFrames[0]
      ctx.putImageData(new ImageData(new Uint8ClampedArray(f.rgba), media.gifData.width, media.gifData.height), 0, 0)
    }
    ctx.strokeStyle = '#2d6ef6'
    ctx.lineWidth = 2
    rects.forEach(function (rect) {
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h)
    })
  }

  function censorRgba(rgba, w, h) {
    var canvas = canvasFromRgba(rgba, w, h)
    var ctx = canvas.getContext('2d')
    var effect = document.getElementById(P + '-effect').value
    var intensity = parseInt(document.getElementById(P + '-intensity').value, 10)
    rects.forEach(function (rect) {
      applyCensorRect(ctx, rect, effect, intensity)
    })
    return ctx.getImageData(0, 0, w, h).data
  }

  async function apply() {
    if (!media || !rects.length) { showErr('Draw at least one region to censor.'); return }
    progress.style.display = ''
    workspace.style.display = 'none'
    errorEl.style.display = 'none'
    try {
      if (media.type === 'static') {
        var tmp = document.createElement('canvas')
        tmp.width = media.width; tmp.height = media.height
        tmp.getContext('2d').drawImage(media.image, 0, 0)
        var img = tmp.getContext('2d').getImageData(0, 0, media.width, media.height)
        var censored = censorRgba(img.data, media.width, media.height)
        tmp.getContext('2d').putImageData(new ImageData(censored, media.width, media.height), 0, 0)
        var blob = await new Promise(function (res) { tmp.toBlob(res, 'image/png') })
        downloadBlob(blob, stemFilename(media.file.name, '-censored', 'png'))
      } else {
        var w = media.gifData.width
        var h = media.gifData.height
        var start = parseInt(document.getElementById(P + '-fstart').value, 10) || 0
        var end = parseInt(document.getElementById(P + '-fend').value, 10)
        var range = frameRangeIndices(media.gifData.parsedFrames.length, start, end)
        var rangeSet = {}
        range.forEach(function (i) { rangeSet[i] = true })
        var frames = media.gifData.parsedFrames.map(function (f, i) {
          var rgba = rangeSet[i] ? censorRgba(f.rgba, w, h) : f.rgba
          return { rgba: rgba, delay: f.delay }
        })
        var blob2 = await encodeFramesToGif(frames, w, h, {
          onProgress: function (k, t) {
            progressFill.style.width = Math.round((k / t) * 100) + '%'
            progressText.textContent = 'Frame ' + (k + 1) + ' / ' + t
          },
        })
        downloadBlob(blob2, stemFilename(media.file.name, '-censored', 'gif'))
      }
      progress.style.display = 'none'
      workspace.style.display = ''
    } catch (e) {
      showErr(e.message || String(e))
    }
  }

  async function handleFile(file) {
    if (!isImageOrGifFile(file)) { showErr('Please upload a JPG, PNG, WebP, or GIF.'); return }
    dropzone.style.display = 'none'
    progress.style.display = ''
    try {
      media = await loadMediaFile(file)
      progress.style.display = 'none'
      buildWorkspace()
    } catch (e) {
      showErr(e.message || String(e))
      dropzone.style.display = ''
    }
  }

  function reset() {
    media = null
    rects = []
    workspace.innerHTML = ''
    workspace.style.display = 'none'
    dropzone.style.display = ''
    fileInput.value = ''
  }

  dropzone.addEventListener('click', function () { fileInput.click() })
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
