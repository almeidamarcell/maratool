import {
  loadImageFromFile, encodeFramesToGif, downloadBlob, stemFilename, isStaticImageFile,
} from './gif-shared.js'

;(function () {
  var P = 'aig'
  var dropzone = document.getElementById(P + '-dropzone')
  var fileInput = document.getElementById(P + '-file')
  var workspace = document.getElementById(P + '-workspace')
  var progress = document.getElementById(P + '-progress')
  var progressText = document.getElementById(P + '-progress-text')
  var progressFill = document.getElementById(P + '-progress-fill')
  var errorEl = document.getElementById(P + '-error')
  var errorText = document.getElementById(P + '-error-text')

  var image = null
  var file = null
  var previewUrl = null

  var EFFECTS = ['zoom-in', 'zoom-out', 'pan-left', 'pan-right', 'pan-up', 'pan-down', 'bounce', 'rotate', 'fade-in', 'fade-out']

  function showErr(msg) {
    errorEl.style.display = ''
    errorText.textContent = msg
    workspace.style.display = 'none'
    progress.style.display = 'none'
  }

  function renderFrame(effect, t, w, h) {
    var canvas = document.createElement('canvas')
    canvas.width = w; canvas.height = h
    var ctx = canvas.getContext('2d')
    var p = t

    if (effect.indexOf('fade') === 0) {
      ctx.globalAlpha = effect === 'fade-in' ? p : 1 - p
      ctx.drawImage(image, 0, 0, w, h)
      return ctx.getImageData(0, 0, w, h).data
    }

    var scale = 1
    var ox = 0, oy = 0, rot = 0
    if (effect === 'zoom-in') scale = 1 + p * 0.3
    else if (effect === 'zoom-out') scale = 1.3 - p * 0.3
    else if (effect === 'pan-left') ox = -p * w * 0.15
    else if (effect === 'pan-right') ox = p * w * 0.15
    else if (effect === 'pan-up') oy = -p * h * 0.15
    else if (effect === 'pan-down') oy = p * h * 0.15
    else if (effect === 'bounce') oy = -Math.abs(Math.sin(p * Math.PI * 2)) * h * 0.08
    else if (effect === 'rotate') rot = p * Math.PI * 0.25

    ctx.save()
    ctx.translate(w / 2 + ox, h / 2 + oy)
    ctx.rotate(rot)
    ctx.scale(scale, scale)
    ctx.drawImage(image, -w / 2, -h / 2, w, h)
    ctx.restore()
    return ctx.getImageData(0, 0, w, h).data
  }

  function buildWorkspace() {
    var opts = EFFECTS.map(function (e) {
      return '<option value="' + e + '">' + e.replace(/-/g, ' ') + '</option>'
    }).join('')
    workspace.innerHTML =
      '<div class="' + P + '-preview-wrap"><img id="' + P + '-preview" alt="Preview" /></div>' +
      '<div class="' + P + '-controls">' +
      '<div class="' + P + '-row"><label class="tool-label">Effect <select id="' + P + '-effect" class="tool-input">' + opts + '</select></label></div>' +
      '<div class="' + P + '-row"><label class="tool-label">Duration (s) <input type="number" id="' + P + '-duration" value="3" min="1" max="15" class="tool-input" style="width:4rem;" /></label>' +
      '<label class="tool-label">FPS <input type="number" id="' + P + '-fps" value="12" min="5" max="30" class="tool-input" style="width:4rem;" /></label></div>' +
      '<div class="' + P + '-actions">' +
      '<button class="tool-button" id="' + P + '-generate">Generate GIF</button>' +
      '<button class="copy-btn" id="' + P + '-change">Change image</button></div></div>'
    workspace.style.display = ''
    document.getElementById(P + '-generate').addEventListener('click', generate)
    document.getElementById(P + '-change').addEventListener('click', reset)
  }

  async function generate() {
    if (!image) return
    var effect = document.getElementById(P + '-effect').value
    var duration = parseFloat(document.getElementById(P + '-duration').value) || 3
    var fps = parseInt(document.getElementById(P + '-fps').value, 10) || 12
    var w = image.naturalWidth
    var h = image.naturalHeight
    var total = Math.max(2, Math.round(duration * fps))
    var delay = Math.round(1000 / fps)

    progress.style.display = ''
    workspace.style.display = 'none'
    errorEl.style.display = 'none'

    try {
      var frames = []
      for (var i = 0; i < total; i++) {
        var t = i / (total - 1)
        frames.push({ rgba: renderFrame(effect, t, w, h), delay: delay })
        if (i % 4 === 3) await new Promise(function (r) { setTimeout(r, 0) })
        progressFill.style.width = Math.round((i / total) * 50) + '%'
        progressText.textContent = 'Rendering frame ' + (i + 1) + ' / ' + total
      }
      var blob = await encodeFramesToGif(frames, w, h, {
        onProgress: function (k, t2) {
          progressFill.style.width = 50 + Math.round((k / t2) * 50) + '%'
          progressText.textContent = 'Encoding frame ' + (k + 1) + ' / ' + t2
        },
      })
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      previewUrl = URL.createObjectURL(blob)
      document.getElementById(P + '-preview').src = previewUrl
      downloadBlob(blob, stemFilename(file.name, '-animated', 'gif'))
      progress.style.display = 'none'
      workspace.style.display = ''
    } catch (e) {
      showErr(e.message || String(e))
    }
  }

  async function handleFile(f) {
    if (!isStaticImageFile(f)) { showErr('Please upload a JPG, PNG, or WebP image.'); return }
    dropzone.style.display = 'none'
    file = f
    try {
      image = await loadImageFromFile(f)
      buildWorkspace()
      document.getElementById(P + '-preview').src = image.src
    } catch (e) {
      showErr(e.message || String(e))
      dropzone.style.display = ''
    }
  }

  function reset() {
    image = null
    file = null
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    previewUrl = null
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
