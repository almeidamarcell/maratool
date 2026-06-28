import {
  parseGifFile, encodeFramesToGif, downloadBlob, stemFilename, isGifFile,
} from './gif-shared.js'

;(function () {
  var P = 'sqg'
  var dropzone = document.getElementById(P + '-dropzone')
  var fileInput = document.getElementById(P + '-file')
  var workspace = document.getElementById(P + '-workspace')
  var progress = document.getElementById(P + '-progress')
  var progressText = document.getElementById(P + '-progress-text')
  var progressFill = document.getElementById(P + '-progress-fill')
  var errorEl = document.getElementById(P + '-error')
  var errorText = document.getElementById(P + '-error-text')

  var gifData = null
  var OUTPUT = 1080

  function showErr(msg) {
    errorEl.style.display = ''
    errorText.textContent = msg
    workspace.style.display = 'none'
    progress.style.display = 'none'
  }

  function squareFrame(rgba, w, h, mode, bg) {
    var canvas = document.createElement('canvas')
    canvas.width = OUTPUT
    canvas.height = OUTPUT
    var ctx = canvas.getContext('2d')
    ctx.fillStyle = bg || '#000000'
    ctx.fillRect(0, 0, OUTPUT, OUTPUT)

    var src = document.createElement('canvas')
    src.width = w; src.height = h
    src.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(rgba), w, h), 0, 0)

    if (mode === 'crop') {
      var side = Math.min(w, h)
      var sx = Math.floor((w - side) / 2)
      var sy = Math.floor((h - side) / 2)
      ctx.drawImage(src, sx, sy, side, side, 0, 0, OUTPUT, OUTPUT)
    } else {
      var scale = Math.min(OUTPUT / w, OUTPUT / h)
      var dw = Math.round(w * scale)
      var dh = Math.round(h * scale)
      var dx = Math.floor((OUTPUT - dw) / 2)
      var dy = Math.floor((OUTPUT - dh) / 2)
      ctx.drawImage(src, 0, 0, w, h, dx, dy, dw, dh)
    }
    return ctx.getImageData(0, 0, OUTPUT, OUTPUT).data
  }

  function buildWorkspace() {
    workspace.innerHTML =
      '<div class="' + P + '-preview-wrap"><canvas id="' + P + '-canvas"></canvas></div>' +
      '<div class="' + P + '-controls">' +
      '<div class="' + P + '-row"><label class="tool-label">Mode <select id="' + P + '-mode" class="tool-input">' +
      '<option value="pad">Pad to square</option><option value="crop">Crop to square</option></select></label>' +
      '<label class="tool-label">Background <input type="color" id="' + P + '-bg" value="#000000" /></label></div>' +
      '<div class="' + P + '-actions">' +
      '<button class="tool-button" id="' + P + '-apply">Download square GIF</button>' +
      '<button class="copy-btn" id="' + P + '-change">Change GIF</button></div></div>'
    workspace.style.display = ''
    document.getElementById(P + '-apply').addEventListener('click', apply)
    document.getElementById(P + '-change').addEventListener('click', reset)
    document.getElementById(P + '-mode').addEventListener('change', preview)
    document.getElementById(P + '-bg').addEventListener('input', preview)
    preview()
  }

  function preview() {
    if (!gifData) return
    var mode = document.getElementById(P + '-mode').value
    var bg = document.getElementById(P + '-bg').value
    var f = gifData.parsedFrames[0]
    var out = squareFrame(f.rgba, gifData.width, gifData.height, mode, bg)
    var canvas = document.getElementById(P + '-canvas')
    canvas.width = OUTPUT; canvas.height = OUTPUT
    canvas.getContext('2d').putImageData(new ImageData(out, OUTPUT, OUTPUT), 0, 0)
  }

  async function apply() {
    if (!gifData) return
    var mode = document.getElementById(P + '-mode').value
    var bg = document.getElementById(P + '-bg').value
    progress.style.display = ''
    workspace.style.display = 'none'
    errorEl.style.display = 'none'
    try {
      var frames = gifData.parsedFrames.map(function (f) {
        return {
          rgba: squareFrame(f.rgba, gifData.width, gifData.height, mode, bg),
          delay: f.delay,
        }
      })
      var blob = await encodeFramesToGif(frames, OUTPUT, OUTPUT, {
        onProgress: function (k, t) {
          progressFill.style.width = Math.round((k / t) * 100) + '%'
          progressText.textContent = 'Frame ' + (k + 1) + ' / ' + t
        },
      })
      downloadBlob(blob, stemFilename(gifData.file.name, '-square', 'gif'))
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
