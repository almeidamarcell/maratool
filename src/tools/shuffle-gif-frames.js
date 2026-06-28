import {
  parseGifFile, encodeFramesToGif, downloadBlob, stemFilename, formatSize, isGifFile,
} from './gif-shared.js'
import { shuffleArray, partialShuffleIndices } from './image-effect-core.js'

;(function () {
  var P = 'sgf'
  var dropzone = document.getElementById(P + '-dropzone')
  var fileInput = document.getElementById(P + '-file')
  var workspace = document.getElementById(P + '-workspace')
  var progress = document.getElementById(P + '-progress')
  var progressText = document.getElementById(P + '-progress-text')
  var progressFill = document.getElementById(P + '-progress-fill')
  var errorEl = document.getElementById(P + '-error')
  var errorText = document.getElementById(P + '-error-text')

  var gifData = null
  var previewUrl = null
  var shuffledOrder = null

  function showErr(msg) {
    errorEl.style.display = ''
    errorText.textContent = msg
    workspace.style.display = 'none'
    progress.style.display = 'none'
  }

  function buildWorkspace() {
    workspace.innerHTML =
      '<div class="' + P + '-preview-wrap"><img id="' + P + '-preview" alt="Preview" /></div>' +
      '<div class="' + P + '-controls">' +
      '<div class="' + P + '-row"><label class="tool-label">Mode <select id="' + P + '-mode" class="tool-input">' +
      '<option value="full">Full shuffle</option><option value="partial">Partial shuffle</option></select></label>' +
      '<label class="tool-label" id="' + P + '-group-wrap" style="display:none;">Every N frames <input type="number" id="' + P + '-group" min="2" max="50" value="5" class="tool-input" style="width:4rem;" /></label></div>' +
      '<div class="' + P + '-row"><span id="' + P + '-meta"></span></div>' +
      '<div class="' + P + '-actions">' +
      '<button class="tool-button" id="' + P + '-shuffle">Shuffle & preview</button>' +
      '<button class="tool-button" id="' + P + '-download" style="display:none;">Download shuffled GIF</button>' +
      '<button class="copy-btn" id="' + P + '-change">Change GIF</button></div></div>'
    workspace.style.display = ''
    document.getElementById(P + '-meta').textContent =
      gifData.parsedFrames.length + ' frames — ' + gifData.width + '×' + gifData.height
    document.getElementById(P + '-mode').addEventListener('change', function () {
      document.getElementById(P + '-group-wrap').style.display =
        document.getElementById(P + '-mode').value === 'partial' ? '' : 'none'
    })
    document.getElementById(P + '-shuffle').addEventListener('click', shufflePreview)
    document.getElementById(P + '-download').addEventListener('click', download)
    document.getElementById(P + '-change').addEventListener('click', reset)
  }

  function computeOrder() {
    var n = gifData.parsedFrames.length
    if (document.getElementById(P + '-mode').value === 'partial') {
      var g = parseInt(document.getElementById(P + '-group').value, 10) || 5
      return partialShuffleIndices(n, g)
    }
    return shuffleArray(Array.from({ length: n }, function (_, i) { return i }))
  }

  async function shufflePreview() {
    progress.style.display = ''
    errorEl.style.display = 'none'
    shuffledOrder = computeOrder()
    var frames = shuffledOrder.map(function (i) { return gifData.parsedFrames[i] })
    try {
      var blob = await encodeFramesToGif(frames, gifData.width, gifData.height, {
        onProgress: function (k, t) {
          progressFill.style.width = Math.round((k / t) * 100) + '%'
          progressText.textContent = 'Encoding frame ' + (k + 1) + ' / ' + t
        },
      })
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      previewUrl = URL.createObjectURL(blob)
      document.getElementById(P + '-preview').src = previewUrl
      document.getElementById(P + '-download').style.display = ''
      document.getElementById(P + '-download')._blob = blob
      progress.style.display = 'none'
    } catch (e) {
      showErr(e.message || String(e))
    }
  }

  function download() {
    var btn = document.getElementById(P + '-download')
    if (btn._blob) downloadBlob(btn._blob, stemFilename(gifData.file && gifData.file.name || 'gif', '-shuffled', 'gif'))
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
    shuffledOrder = null
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
