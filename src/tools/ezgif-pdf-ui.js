import { loadPdfJs, readFileAsArrayBuffer, formatBytes } from './pdf-common.js'
import { parsePageRange, computePdfRenderScale, getPdfOutputFilename } from './ezgif-pdf-core.js'
import { encodeGifFrames } from './ezgif-gif-ext-ui.js'

export function initPdfTool(config) {
  var mode = config.mode
  var suffix = config.suffix || mode
  var root = document.getElementById('ez-root')
  if (!root) return

  root.innerHTML =
    '<div class="ep-dropzone tool-dropzone" id="ep-dropzone">' +
      '<input type="file" id="ep-file" hidden accept="application/pdf" />' +
      '<p>Drop a PDF or click to upload</p>' +
    '</div>' +
    '<div id="ep-settings" hidden>' +
      '<label class="tool-label">Pages (e.g. 1,3-5 or blank for all)</label>' +
      '<input class="tool-input" id="ep-pages" type="text" placeholder="all pages" />' +
      (mode === 'compress' ? '<label class="tool-label">Image quality (1-100)</label><input class="tool-input" id="ep-quality" type="number" value="75" min="30" max="100" />' : '') +
      '<button type="button" class="tool-btn" id="ep-process" style="margin-top:1rem;">Process</button>' +
    '</div>' +
    '<div id="ep-progress" hidden><p id="ep-progress-text">Processing...</p></div>' +
    '<div id="ep-result" hidden>' +
      '<div id="ep-gallery" style="display:flex;flex-wrap:wrap;gap:8px;"></div>' +
      '<img id="ep-gif-preview" style="max-width:100%;display:none;" />' +
      '<button type="button" class="tool-btn" id="ep-download" style="margin-top:1rem;">Download</button>' +
    '</div>' +
    '<p id="ep-error" class="tool-error" hidden><span id="ep-error-text"></span></p>'

  var dropzone = document.getElementById('ep-dropzone')
  var fileInput = document.getElementById('ep-file')
  var settingsEl = document.getElementById('ep-settings')
  var progressEl = document.getElementById('ep-progress')
  var progressText = document.getElementById('ep-progress-text')
  var resultEl = document.getElementById('ep-result')
  var gallery = document.getElementById('ep-gallery')
  var gifPreview = document.getElementById('ep-gif-preview')
  var downloadBtn = document.getElementById('ep-download')
  var errorEl = document.getElementById('ep-error')
  var errorText = document.getElementById('ep-error-text')

  var currentFile = null
  var resultBlob = null
  var imageBlobs = []

  function showState(s) {
    dropzone.style.display = s === 'upload' ? '' : 'none'
    settingsEl.style.display = s === 'settings' ? '' : 'none'
    progressEl.style.display = s === 'progress' ? '' : 'none'
    resultEl.style.display = s === 'result' ? '' : 'none'
    errorEl.style.display = s === 'error' ? '' : 'none'
  }

  function showError(msg) {
    errorText.textContent = msg
    showState('error')
  }

  async function renderPage(pdf, pageNum, scale) {
    var page = await pdf.getPage(pageNum)
    var viewport = page.getViewport({ scale: scale })
    var canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    await page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport }).promise
    return canvas
  }

  async function process() {
    if (!currentFile) return
    showState('progress')
    try {
      var pdfjs = await loadPdfJs()
      var data = await readFileAsArrayBuffer(currentFile)
      var pdf = await pdfjs.getDocument({ data: data }).promise
      var pageSpec = document.getElementById('ep-pages').value
      var pages = parsePageRange(pageSpec, pdf.numPages)
      var firstPage = await pdf.getPage(pages[0])
      var baseVp = firstPage.getViewport({ scale: 1 })
      var scale = computePdfRenderScale(baseVp.width, baseVp.height, 1200)
      var quality = (parseInt(document.getElementById('ep-quality')?.value, 10) || 75) / 100

      gallery.innerHTML = ''
      imageBlobs = []
      var rgbaFrames = []
      var w = 0
      var h = 0

      for (var i = 0; i < pages.length; i++) {
        if (progressText) progressText.textContent = 'Rendering page ' + (i + 1) + ' / ' + pages.length
        var canvas = await renderPage(pdf, pages[i], scale)
        w = canvas.width
        h = canvas.height

        if (mode === 'to-gif') {
          var id = canvas.getContext('2d').getImageData(0, 0, w, h)
          rgbaFrames.push({ rgba: id.data, delay: 50 })
        } else {
          var mime = mode === 'to-jpg' ? 'image/jpeg' : 'image/png'
          var blob = await new Promise(function (res) {
            canvas.toBlob(res, mime, mode === 'to-jpg' ? quality : undefined)
          })
          imageBlobs.push(blob)
          var thumb = document.createElement('img')
          thumb.src = URL.createObjectURL(blob)
          thumb.style.maxWidth = '160px'
          gallery.appendChild(thumb)
        }
      }

      if (mode === 'to-gif') {
        resultBlob = await encodeGifFrames(rgbaFrames, w, h, 0)
        gifPreview.src = URL.createObjectURL(resultBlob)
        gifPreview.style.display = ''
        gallery.style.display = 'none'
      } else if (mode === 'compress') {
        var PDFLib = await import('https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js')
        var pdfDoc = await PDFLib.PDFDocument.load(data)
        var saved = await pdfDoc.save({ useObjectStreams: true })
        resultBlob = new Blob([saved], { type: 'application/pdf' })
        gallery.style.display = 'none'
        gifPreview.style.display = 'none'
      } else {
        gifPreview.style.display = 'none'
        gallery.style.display = 'flex'
      }

      showState('result')
    } catch (e) {
      showError(e.message || String(e))
    }
  }

  function handleFile(file) {
    if (!file || file.type !== 'application/pdf') {
      showError('Please upload a PDF file.')
      return
    }
    currentFile = file
    showState('settings')
  }

  dropzone.addEventListener('click', function () { fileInput.click() })
  dropzone.addEventListener('dragover', function (e) { e.preventDefault() })
  dropzone.addEventListener('drop', function (e) {
    e.preventDefault()
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0])
  })
  fileInput.addEventListener('change', function () {
    if (fileInput.files[0]) handleFile(fileInput.files[0])
  })
  document.getElementById('ep-process').addEventListener('click', process)

  downloadBtn.addEventListener('click', function () {
    if (mode === 'to-png' || mode === 'to-jpg') {
      imageBlobs.forEach(function (blob, idx) {
        var a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        var ext = mode === 'to-jpg' ? '.jpg' : '.png'
        a.download = getPdfOutputFilename(currentFile.name, suffix + '-' + (idx + 1), ext)
        a.click()
      })
      return
    }
    if (!resultBlob) return
    var ext2 = mode === 'to-gif' ? '.gif' : '.pdf'
    var a2 = document.createElement('a')
    a2.href = URL.createObjectURL(resultBlob)
    a2.download = getPdfOutputFilename(currentFile.name, suffix, ext2)
    a2.click()
  })

  showState('upload')
}
