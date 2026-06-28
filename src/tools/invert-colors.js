import {
  loadMediaFile, encodeFramesToGif, formatSize, downloadBlob, stemFilename,
  canvasFromRgba, isImageOrGifFile,
} from './gif-shared.js'
import { invertRgba } from './image-effect-core.js'

;(function () {
  var P = 'inv'
  var dropzone = document.getElementById(P + '-dropzone')
  var fileInput = document.getElementById(P + '-file')
  var workspace = document.getElementById(P + '-workspace')
  var progress = document.getElementById(P + '-progress')
  var progressText = document.getElementById(P + '-progress-text')
  var progressFill = document.getElementById(P + '-progress-fill')
  var errorEl = document.getElementById(P + '-error')
  var errorText = document.getElementById(P + '-error-text')
  var resultEl = document.getElementById(P + '-result')

  var media = null
  var resultBlob = null

  function showErr(msg) {
    errorEl.style.display = ''
    errorText.textContent = msg
    workspace.style.display = 'none'
    progress.style.display = 'none'
    resultEl.style.display = 'none'
  }

  function buildWorkspace() {
    workspace.innerHTML =
      '<div class="' + P + '-preview-wrap"><canvas id="' + P + '-canvas"></canvas></div>' +
      '<div class="' + P + '-controls">' +
      '<div class="' + P + '-row"><label><input type="checkbox" id="' + P + '-r" checked /> Red</label>' +
      '<label><input type="checkbox" id="' + P + '-g" checked /> Green</label>' +
      '<label><input type="checkbox" id="' + P + '-b" checked /> Blue</label></div>' +
      '<div class="' + P + '-actions">' +
      '<button class="tool-button" id="' + P + '-apply">Apply & download</button>' +
      '<button class="copy-btn" id="' + P + '-change">Change file</button></div></div>'
    workspace.style.display = ''
    document.getElementById(P + '-apply').addEventListener('click', apply)
    document.getElementById(P + '-change').addEventListener('click', reset)
    ;['r', 'g', 'b'].forEach(function (ch) {
      document.getElementById(P + '-' + ch).addEventListener('change', preview)
    })
    preview()
  }

  function getChannels() {
    return {
      r: document.getElementById(P + '-r').checked,
      g: document.getElementById(P + '-g').checked,
      b: document.getElementById(P + '-b').checked,
    }
  }

  function preview() {
    if (!media) return
    var canvas = document.getElementById(P + '-canvas')
    var ch = getChannels()
    if (media.type === 'static') {
      canvas.width = media.width
      canvas.height = media.height
      var ctx = canvas.getContext('2d')
      ctx.drawImage(media.image, 0, 0)
      var img = ctx.getImageData(0, 0, canvas.width, canvas.height)
      var out = invertRgba(img.data, ch)
      ctx.putImageData(new ImageData(out, canvas.width, canvas.height), 0, 0)
    } else {
      var frame = media.gifData.parsedFrames[0]
      var out2 = invertRgba(frame.rgba, ch)
      var c = canvasFromRgba(out2, media.gifData.width, media.gifData.height)
      canvas.width = c.width
      canvas.height = c.height
      canvas.getContext('2d').drawImage(c, 0, 0)
    }
  }

  async function apply() {
    if (!media) return
    var ch = getChannels()
    progress.style.display = ''
    workspace.style.display = 'none'
    errorEl.style.display = 'none'
    try {
      if (media.type === 'static') {
        var canvas = document.createElement('canvas')
        canvas.width = media.width
        canvas.height = media.height
        var ctx = canvas.getContext('2d')
        ctx.drawImage(media.image, 0, 0)
        var img = ctx.getImageData(0, 0, canvas.width, canvas.height)
        var out = invertRgba(img.data, ch)
        ctx.putImageData(new ImageData(out, canvas.width, canvas.height), 0, 0)
        resultBlob = await new Promise(function (res) { canvas.toBlob(res, 'image/png') })
        downloadBlob(resultBlob, stemFilename(media.file.name, '-inverted', 'png'))
      } else {
        var frames = media.gifData.parsedFrames.map(function (f) {
          return { rgba: invertRgba(f.rgba, ch), delay: f.delay }
        })
        resultBlob = await encodeFramesToGif(frames, media.gifData.width, media.gifData.height, {
          onProgress: function (k, t) {
            progressFill.style.width = Math.round((k / t) * 100) + '%'
            progressText.textContent = 'Frame ' + (k + 1) + ' / ' + t
          },
        })
        downloadBlob(resultBlob, stemFilename(media.file.name, '-inverted', 'gif'))
      }
      progress.style.display = 'none'
      workspace.style.display = ''
    } catch (e) {
      showErr(e.message || String(e))
    }
  }

  async function handleFile(file) {
    if (!isImageOrGifFile(file)) { showErr('Please upload a JPG, PNG, WebP, or GIF.'); return }
    errorEl.style.display = 'none'
    dropzone.style.display = 'none'
    progress.style.display = ''
    progressText.textContent = 'Loading...'
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
    resultBlob = null
    workspace.style.display = 'none'
    workspace.innerHTML = ''
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
