import {
  parseGifFile, encodeFramesToGif, downloadBlob, stemFilename, isGifFile, frameRangeIndices,
} from './gif-shared.js'

var GOOGLE_FONTS = ['Inter', 'Roboto', 'Oswald', 'Bebas Neue', 'Pacifico', 'Permanent Marker']

;(function () {
  var P = 'atg'
  var dropzone = document.getElementById(P + '-dropzone')
  var fileInput = document.getElementById(P + '-file')
  var workspace = document.getElementById(P + '-workspace')
  var progress = document.getElementById(P + '-progress')
  var progressText = document.getElementById(P + '-progress-text')
  var progressFill = document.getElementById(P + '-progress-fill')
  var errorEl = document.getElementById(P + '-error')
  var errorText = document.getElementById(P + '-error-text')

  var gifData = null
  var textPos = { x: 0, y: 0 }
  var dragging = false
  var dragOff = { x: 0, y: 0 }
  var fontLoaded = {}

  function showErr(msg) {
    errorEl.style.display = ''
    errorText.textContent = msg
    workspace.style.display = 'none'
    progress.style.display = 'none'
  }

  function loadGoogleFont(name) {
    if (fontLoaded[name] || name === 'Inter' || name === 'system-ui') return Promise.resolve()
    fontLoaded[name] = true
    var link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(name) + '&display=swap'
    document.head.appendChild(link)
    return document.fonts.load('24px "' + name + '"')
  }

  function buildWorkspace() {
    var fonts = ['system-ui', 'Inter'].concat(GOOGLE_FONTS).map(function (f) {
      return '<option value="' + f + '">' + f + '</option>'
    }).join('')
    workspace.innerHTML =
      '<div class="' + P + '-preview-wrap" style="position:relative;"><canvas id="' + P + '-canvas"></canvas></div>' +
      '<div class="' + P + '-controls">' +
      '<div class="' + P + '-row"><input type="text" id="' + P + '-text" class="tool-input" placeholder="Your caption..." style="flex:1;" /></div>' +
      '<div class="' + P + '-row"><label class="tool-label">Font <select id="' + P + '-font" class="tool-input">' + fonts + '</select></label>' +
      '<label class="tool-label">Size <input type="number" id="' + P + '-size" value="32" min="8" max="120" class="tool-input" style="width:4rem;" /></label></div>' +
      '<div class="' + P + '-row"><label class="tool-label">Color <input type="color" id="' + P + '-color" value="#ffffff" /></label>' +
      '<label class="tool-label">Stroke <input type="color" id="' + P + '-stroke" value="#000000" /></label>' +
      '<label class="tool-label">Stroke width <input type="number" id="' + P + '-stroke-w" value="2" min="0" max="20" class="tool-input" style="width:3rem;" /></label></div>' +
      '<div class="' + P + '-row"><label class="tool-label">Position <select id="' + P + '-pos" class="tool-input">' +
      '<option value="custom">Draggable</option><option value="top">Top</option><option value="center">Center</option><option value="bottom">Bottom</option></select></label>' +
      '<label><input type="checkbox" id="' + P + '-bg-enable" /> Text background</label>' +
      '<input type="color" id="' + P + '-bg-color" value="#000000" />' +
      '<label class="tool-label">BG opacity <input type="range" id="' + P + '-bg-opacity" min="0" max="100" value="50" /></label></div>' +
      '<div class="' + P + '-row"><label class="tool-label">Frame start <input type="number" id="' + P + '-fstart" value="0" min="0" class="tool-input" style="width:4rem;" /></label>' +
      '<label class="tool-label">Frame end <input type="number" id="' + P + '-fend" value="' + (gifData.parsedFrames.length - 1) + '" class="tool-input" style="width:4rem;" /></label></div>' +
      '<div class="' + P + '-actions">' +
      '<button class="tool-button" id="' + P + '-apply">Download captioned GIF</button>' +
      '<button class="copy-btn" id="' + P + '-change">Change GIF</button></div></div>'
    workspace.style.display = ''
    textPos.x = gifData.width / 2
    textPos.y = gifData.height / 2

    var canvas = document.getElementById(P + '-canvas')
    setupCanvas(canvas)
    document.getElementById(P + '-pos').addEventListener('change', setPresetPosition)
    document.getElementById(P + '-apply').addEventListener('click', apply)
    document.getElementById(P + '-change').addEventListener('click', reset)
    ;[P + '-text', P + '-font', P + '-size', P + '-color', P + '-stroke', P + '-stroke-w',
      P + '-bg-enable', P + '-bg-color', P + '-bg-opacity'].forEach(function (id) {
      document.getElementById(id).addEventListener('input', redraw)
      document.getElementById(id).addEventListener('change', async function () {
        if (id === P + '-font') await loadGoogleFont(document.getElementById(P + '-font').value)
        redraw()
      })
    })
    redraw()
  }

  function getTextOpts() {
    return {
      text: document.getElementById(P + '-text').value || 'Caption',
      font: document.getElementById(P + '-font').value,
      size: parseInt(document.getElementById(P + '-size').value, 10) || 32,
      color: document.getElementById(P + '-color').value,
      stroke: document.getElementById(P + '-stroke').value,
      strokeW: parseInt(document.getElementById(P + '-stroke-w').value, 10) || 0,
      bg: document.getElementById(P + '-bg-enable').checked,
      bgColor: document.getElementById(P + '-bg-color').value,
      bgOpacity: parseInt(document.getElementById(P + '-bg-opacity').value, 10) / 100,
    }
  }

  function drawText(ctx, opts) {
    var fontFamily = opts.font === 'system-ui' ? 'system-ui, sans-serif' : '"' + opts.font + '", sans-serif'
    ctx.font = 'bold ' + opts.size + 'px ' + fontFamily
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    var metrics = ctx.measureText(opts.text)
    var tw = metrics.width
    var th = opts.size * 1.2
    var x = textPos.x
    var y = textPos.y

    if (opts.bg) {
      ctx.fillStyle = opts.bgColor
      ctx.globalAlpha = opts.bgOpacity
      var pad = 8
      ctx.fillRect(x - tw / 2 - pad, y - th / 2, tw + pad * 2, th)
      ctx.globalAlpha = 1
    }
    if (opts.strokeW > 0) {
      ctx.strokeStyle = opts.stroke
      ctx.lineWidth = opts.strokeW
      ctx.strokeText(opts.text, x, y)
    }
    ctx.fillStyle = opts.color
    ctx.fillText(opts.text, x, y)
  }

  function setPresetPosition() {
    var pos = document.getElementById(P + '-pos').value
    var opts = getTextOpts()
    if (pos === 'top') { textPos.x = gifData.width / 2; textPos.y = opts.size }
    else if (pos === 'center') { textPos.x = gifData.width / 2; textPos.y = gifData.height / 2 }
    else if (pos === 'bottom') { textPos.x = gifData.width / 2; textPos.y = gifData.height - opts.size }
    redraw()
  }

  function setupCanvas(canvas) {
    canvas.width = gifData.width
    canvas.height = gifData.height
    canvas.addEventListener('mousedown', function (e) {
      if (document.getElementById(P + '-pos').value !== 'custom') return
      dragging = true
      var r = canvas.getBoundingClientRect()
      dragOff.x = (e.clientX - r.left) * (canvas.width / r.width) - textPos.x
      dragOff.y = (e.clientY - r.top) * (canvas.height / r.height) - textPos.y
    })
    canvas.addEventListener('mousemove', function (e) {
      if (!dragging) return
      var r = canvas.getBoundingClientRect()
      textPos.x = (e.clientX - r.left) * (canvas.width / r.width) - dragOff.x
      textPos.y = (e.clientY - r.top) * (canvas.height / r.height) - dragOff.y
      redraw()
    })
    canvas.addEventListener('mouseup', function () { dragging = false })
  }

  function redraw() {
    var canvas = document.getElementById(P + '-canvas')
    var ctx = canvas.getContext('2d')
    var f = gifData.parsedFrames[0]
    ctx.putImageData(new ImageData(new Uint8ClampedArray(f.rgba), gifData.width, gifData.height), 0, 0)
    drawText(ctx, getTextOpts())
  }

  function burnText(baseRgba) {
    var canvas = document.createElement('canvas')
    canvas.width = gifData.width; canvas.height = gifData.height
    var ctx = canvas.getContext('2d')
    ctx.putImageData(new ImageData(new Uint8ClampedArray(baseRgba), gifData.width, gifData.height), 0, 0)
    drawText(ctx, getTextOpts())
    return ctx.getImageData(0, 0, gifData.width, gifData.height).data
  }

  async function apply() {
    if (!gifData) return
    var font = document.getElementById(P + '-font').value
    await loadGoogleFont(font)
    progress.style.display = ''
    workspace.style.display = 'none'
    errorEl.style.display = 'none'
    var start = parseInt(document.getElementById(P + '-fstart').value, 10) || 0
    var end = parseInt(document.getElementById(P + '-fend').value, 10)
    var range = frameRangeIndices(gifData.parsedFrames.length, start, end)
    var rangeSet = {}
    range.forEach(function (i) { rangeSet[i] = true })

    try {
      var frames = gifData.parsedFrames.map(function (f, i) {
        return { rgba: rangeSet[i] ? burnText(f.rgba) : f.rgba, delay: f.delay }
      })
      var blob = await encodeFramesToGif(frames, gifData.width, gifData.height, {
        onProgress: function (k, t) {
          progressFill.style.width = Math.round((k / t) * 100) + '%'
          progressText.textContent = 'Frame ' + (k + 1) + ' / ' + t
        },
      })
      downloadBlob(blob, stemFilename(gifData.file.name, '-captioned', 'gif'))
      progress.style.display = 'none'
      workspace.style.display = ''
    } catch (e) {
      showErr(e.message || String(e))
    }
  }

  async function handleFile(file) {
    if (!isGifFile(file)) { showErr('Please upload a GIF file.'); return }
    dropzone.style.display = 'none'
    progress.style.display = ''
    try {
      var data = await parseGifFile(file)
      gifData = Object.assign({ file: file }, data)
      progress.style.display = 'none'
      buildWorkspace()
    } catch (e) {
      showErr(e.message || String(e))
      dropzone.style.display = ''
    }
  }

  function reset() {
    gifData = null
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
