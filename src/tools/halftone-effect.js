import {
  loadMediaFile, encodeFramesToGif, downloadBlob, stemFilename,
  canvasFromRgba, isImageOrGifFile,
} from './gif-shared.js'
import { halftoneRgba } from './image-effect-core.js'

;(function () {
  var P = 'hlf'
  var dropzone = document.getElementById(P + '-dropzone')
  var fileInput = document.getElementById(P + '-file')
  var workspace = document.getElementById(P + '-workspace')
  var progress = document.getElementById(P + '-progress')
  var progressText = document.getElementById(P + '-progress-text')
  var progressFill = document.getElementById(P + '-progress-fill')
  var errorEl = document.getElementById(P + '-error')
  var errorText = document.getElementById(P + '-error-text')

  var media = null

  function showErr(msg) {
    errorEl.style.display = ''
    errorText.textContent = msg
    workspace.style.display = 'none'
    progress.style.display = 'none'
  }

  function getOpts() {
    return {
      dotSize: parseInt(document.getElementById(P + '-dots').value, 10),
      pattern: document.getElementById(P + '-pattern').value,
      colored: document.getElementById(P + '-colored').checked,
    }
  }

  function buildWorkspace() {
    workspace.innerHTML =
      '<div class="' + P + '-preview-wrap"><canvas id="' + P + '-canvas"></canvas></div>' +
      '<div class="' + P + '-controls">' +
      '<div class="' + P + '-row"><label class="tool-label">Dot size <input type="range" id="' + P + '-dots" min="3" max="20" value="8" /></label></div>' +
      '<div class="' + P + '-row"><label class="tool-label">Pattern <select id="' + P + '-pattern" class="tool-input">' +
      '<option value="dots">Dots</option><option value="lines">Lines</option><option value="diamonds">Diamonds</option></select></label>' +
      '<label><input type="checkbox" id="' + P + '-colored" /> Colored halftone</label></div>' +
      '<div class="' + P + '-actions">' +
      '<button class="tool-button" id="' + P + '-apply">Apply & download</button>' +
      '<button class="copy-btn" id="' + P + '-change">Change file</button></div></div>'
    workspace.style.display = ''
    document.getElementById(P + '-apply').addEventListener('click', apply)
    document.getElementById(P + '-change').addEventListener('click', reset)
    ;[P + '-dots', P + '-pattern', P + '-colored'].forEach(function (id) {
      document.getElementById(id).addEventListener('input', preview)
      document.getElementById(id).addEventListener('change', preview)
    })
    preview()
  }

  function renderFrame(rgba, w, h) {
    var o = getOpts()
    return halftoneRgba(rgba, w, h, o.dotSize, o.pattern, o.colored)
  }

  function preview() {
    if (!media) return
    var canvas = document.getElementById(P + '-canvas')
    if (media.type === 'static') {
      var tmp = document.createElement('canvas')
      tmp.width = media.width; tmp.height = media.height
      tmp.getContext('2d').drawImage(media.image, 0, 0)
      var img = tmp.getContext('2d').getImageData(0, 0, media.width, media.height)
      var out = renderFrame(img.data, media.width, media.height)
      canvas.width = media.width; canvas.height = media.height
      canvas.getContext('2d').putImageData(new ImageData(out, media.width, media.height), 0, 0)
    } else {
      var f = media.gifData.parsedFrames[0]
      var out2 = renderFrame(f.rgba, media.gifData.width, media.gifData.height)
      var c = canvasFromRgba(out2, media.gifData.width, media.gifData.height)
      canvas.width = c.width; canvas.height = c.height
      canvas.getContext('2d').drawImage(c, 0, 0)
    }
  }

  async function apply() {
    if (!media) return
    progress.style.display = ''
    workspace.style.display = 'none'
    errorEl.style.display = 'none'
    var o = getOpts()
    try {
      if (media.type === 'static') {
        var tmp = document.createElement('canvas')
        tmp.width = media.width; tmp.height = media.height
        tmp.getContext('2d').drawImage(media.image, 0, 0)
        var img = tmp.getContext('2d').getImageData(0, 0, media.width, media.height)
        var out = halftoneRgba(img.data, media.width, media.height, o.dotSize, o.pattern, o.colored)
        tmp.getContext('2d').putImageData(new ImageData(out, media.width, media.height), 0, 0)
        var blob = await new Promise(function (res) { tmp.toBlob(res, 'image/png') })
        downloadBlob(blob, stemFilename(media.file.name, '-halftone', 'png'))
      } else {
        var w = media.gifData.width
        var h = media.gifData.height
        var frames = media.gifData.parsedFrames.map(function (f) {
          return { rgba: halftoneRgba(f.rgba, w, h, o.dotSize, o.pattern, o.colored), delay: f.delay }
        })
        var blob2 = await encodeFramesToGif(frames, w, h, {
          onProgress: function (k, t) {
            progressFill.style.width = Math.round((k / t) * 100) + '%'
            progressText.textContent = 'Frame ' + (k + 1) + ' / ' + t
          },
        })
        downloadBlob(blob2, stemFilename(media.file.name, '-halftone', 'gif'))
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
