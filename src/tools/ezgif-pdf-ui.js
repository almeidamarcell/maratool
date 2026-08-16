import { loadPdfJs, readFileAsArrayBuffer } from './pdf-common.js'
import { parsePageRange, computePdfRenderScale, getPdfOutputFilename } from './ezgif-pdf-core.js'
import { encodeGifFrames } from './ezgif-gif-ext-ui.js'
import { downloadBlob, setVisible, nextPaint, makeProgress, formatSize } from './tool-utils.js'

// The ESM build. The UMD bundle (pdf-lib.min.js) that used to be imported here
// exports nothing to an ES import — it only assigns window.PDFLib — so
// `PDFLib.PDFDocument` came back undefined and compression threw.
var PDF_LIB_URL = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.esm.min.js'

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
      '<label class="tool-label" for="ep-pages">Pages (e.g. 1,3-5 or blank for all)</label>' +
      '<input class="tool-input" id="ep-pages" type="text" placeholder="all pages" />' +
      (mode === 'compress' ?
        '<label class="tool-label" for="ep-method">How to compress</label>' +
        '<select class="tool-select" id="ep-method">' +
          '<option value="rebuild">Rebuild the file — keeps text selectable</option>' +
          '<option value="rasterize">Flatten pages to images — much smaller, text becomes a picture</option>' +
        '</select>' +
        '<p class="tool-hint" id="ep-method-hint"></p>' +
        '<div id="ep-image-opts" hidden>' +
          '<label class="tool-label" for="ep-quality">JPEG quality (10-100)</label>' +
          '<input class="tool-input" id="ep-quality" type="number" value="75" min="10" max="100" />' +
          '<label class="tool-label" for="ep-dpi">Resolution</label>' +
          '<select class="tool-select" id="ep-dpi">' +
            '<option value="96">96 DPI — screen reading, smallest</option>' +
            '<option value="150" selected>150 DPI — good all-round</option>' +
            '<option value="200">200 DPI — close reading</option>' +
            '<option value="300">300 DPI — print</option>' +
          '</select>' +
        '</div>'
        : '') +
      '<button type="button" class="tool-btn" id="ep-process" style="margin-top:1rem;">Process</button>' +
    '</div>' +
    '<div id="ep-progress" class="tool-progress" hidden>' +
      '<p id="ep-progress-text" class="tool-progress-text">Processing…</p>' +
      '<div class="tool-progress-bar"><div id="ep-progress-fill" class="tool-progress-fill"></div></div>' +
      '<p id="ep-progress-detail" class="tool-progress-detail"></p>' +
    '</div>' +
    '<div id="ep-result" hidden>' +
      '<div id="ep-gallery" style="display:flex;flex-wrap:wrap;gap:8px;"></div>' +
      '<img id="ep-gif-preview" style="max-width:100%;display:none;" />' +
      '<p id="ep-result-note" class="tool-hint"></p>' +
      '<button type="button" class="tool-btn" id="ep-download" style="margin-top:1rem;">Download</button>' +
    '</div>' +
    '<p id="ep-error" class="tool-error" hidden><span id="ep-error-text"></span></p>'

  var dropzone = document.getElementById('ep-dropzone')
  var fileInput = document.getElementById('ep-file')
  var settingsEl = document.getElementById('ep-settings')
  var progressEl = document.getElementById('ep-progress')
  var progressDetail = document.getElementById('ep-progress-detail')
  var progress = makeProgress(
    document.getElementById('ep-progress-text'),
    document.getElementById('ep-progress-fill')
  )
  var resultEl = document.getElementById('ep-result')
  var gallery = document.getElementById('ep-gallery')
  var gifPreview = document.getElementById('ep-gif-preview')
  var resultNote = document.getElementById('ep-result-note')
  var downloadBtn = document.getElementById('ep-download')
  var errorEl = document.getElementById('ep-error')
  var errorText = document.getElementById('ep-error-text')
  var methodSelect = document.getElementById('ep-method')
  var methodHint = document.getElementById('ep-method-hint')
  var imageOpts = document.getElementById('ep-image-opts')

  // The compress page used to show a quality box that nothing read: the value
  // was only ever passed to canvas.toBlob on the to-jpg path, while compress
  // re-saved the original bytes. Now the method picker decides whether pages
  // are re-encoded at all, and the image options only appear when they do.
  var METHOD_HINTS = {
    rebuild: 'Rewrites the file structure with compact object streams and drops unused objects. Text stays selectable and nothing is re-encoded, so the saving is modest — often nothing at all on a file that was already optimised.',
    rasterize: 'Renders every page and stores it as a JPEG. This is where the quality setting bites: it usually cuts a scanned or image-heavy PDF by most of its size, but the text becomes a picture, so it stops being selectable or searchable.',
  }

  function syncMethod() {
    if (!methodSelect) return
    var method = methodSelect.value
    setVisible(imageOpts, method === 'rasterize')
    if (methodHint) methodHint.textContent = METHOD_HINTS[method] || ''
  }

  if (methodSelect) {
    methodSelect.addEventListener('change', syncMethod)
    syncMethod()
  }

  var currentFile = null
  var resultBlob = null
  var imageBlobs = []
  // Preview URLs (thumbnails + GIF) are recreated on every run; without
  // revoking, each re-process orphans the previous batch of blobs.
  var previewUrls = []

  function releasePreviewUrls() {
    previewUrls.forEach(function (u) { URL.revokeObjectURL(u) })
    previewUrls = []
  }

  function showState(s) {
    setVisible(dropzone, s === 'upload')
    setVisible(settingsEl, s === 'settings')
    setVisible(progressEl, s === 'progress')
    setVisible(resultEl, s === 'result')
    setVisible(errorEl, s === 'error')
    if (s !== 'progress') progress.reset()
  }

  function showError(msg) {
    errorText.textContent = msg
    showState('error')
  }

  function setDetail(text) {
    if (progressDetail) progressDetail.textContent = text || ''
  }

  async function renderPage(pdf, pageNum, scale, opaque) {
    var page = await pdf.getPage(pageNum)
    var viewport = page.getViewport({ scale: scale })
    var canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    var ctx = canvas.getContext('2d')
    if (opaque) {
      // JPEG has no alpha: without a white ground, everything pdf.js leaves
      // untouched turns black in the encoded page.
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    await page.render({ canvasContext: ctx, viewport: viewport }).promise
    return canvas
  }

  // Re-encodes every page as a JPEG and rebuilds the document around those
  // images. This is the only path where the quality number changes the output.
  async function rasterizePdf(PDFLib, pdf, pages, quality, dpi) {
    var out = await PDFLib.PDFDocument.create()
    for (var i = 0; i < pages.length; i++) {
      progress.set('Re-encoding pages…', i / pages.length)
      setDetail('Page ' + (i + 1) + ' of ' + pages.length)
      await nextPaint()

      var page = await pdf.getPage(pages[i])
      var base = page.getViewport({ scale: 1 })
      var scale = dpi / 72
      // A poster-sized page at 300 DPI can blow past the canvas limit, so cap
      // the pixel budget rather than hand the browser an allocation it will
      // silently fail.
      var budget = 30e6
      if (base.width * base.height * scale * scale > budget) {
        scale = Math.sqrt(budget / (base.width * base.height))
      }
      var canvas = await renderPage(pdf, pages[i], scale, true)
      var blob = await new Promise(function (res) { canvas.toBlob(res, 'image/jpeg', quality) })
      if (!blob) throw new Error('This browser could not encode page ' + pages[i] + ' as JPEG.')
      var bytes = new Uint8Array(await blob.arrayBuffer())
      var embedded = await out.embedJpg(bytes)
      // base.width/height already carry the page's /Rotate, and so does the
      // canvas, so the new page needs no rotation of its own.
      var newPage = out.addPage([base.width, base.height])
      newPage.drawImage(embedded, { x: 0, y: 0, width: base.width, height: base.height })
      canvas.width = 0
      canvas.height = 0
    }
    progress.set('Writing the file…', 0.98)
    setDetail('')
    return out.save({ useObjectStreams: true })
  }

  function describeSaving(originalSize, newSize) {
    var delta = originalSize - newSize
    var pct = originalSize > 0 ? Math.round((delta / originalSize) * 100) : 0
    if (delta > 0) {
      return formatSize(originalSize) + ' → ' + formatSize(newSize) + ' · ' + pct + '% smaller'
    }
    return formatSize(originalSize) + ' → ' + formatSize(newSize) +
      ' · no saving. This file is already tightly packed; flattening the pages to images is the only way to make it much smaller.'
  }

  async function process() {
    if (!currentFile) return
    progress.pending('Loading PDF engine…')
    setDetail(currentFile.name + ' · ' + formatSize(currentFile.size))
    showState('progress')
    await nextPaint()
    try {
      var pdfjs = await loadPdfJs()
      progress.pending('Reading PDF…')
      var buffer = await readFileAsArrayBuffer(currentFile)
      // Copy before pdf.js sees the buffer: it may transfer it to its worker,
      // which leaves pdf-lib holding a detached ArrayBuffer at save time. Only
      // the compress path needs the original bytes, and a second copy of a
      // 100 MB file is not free, so the other modes skip it.
      var data = mode === 'compress' ? new Uint8Array(buffer).slice() : null
      var pdf = await pdfjs.getDocument({ data: buffer }).promise
      var pageSpec = document.getElementById('ep-pages').value
      var pages = parsePageRange(pageSpec, pdf.numPages)
      var firstPage = await pdf.getPage(pages[0])
      var baseVp = firstPage.getViewport({ scale: 1 })
      var scale = computePdfRenderScale(baseVp.width, baseVp.height, 1200)
      var quality = (parseInt(document.getElementById('ep-quality')?.value, 10) || 75) / 100

      if (mode === 'compress') {
        var method = methodSelect ? methodSelect.value : 'rebuild'
        var dpi = parseInt(document.getElementById('ep-dpi')?.value, 10) || 150
        progress.pending('Loading the PDF writer…')
        setDetail('')
        var PDFLib = await import(/* @vite-ignore */ PDF_LIB_URL)
        var saved
        if (method === 'rasterize') {
          saved = await rasterizePdf(PDFLib, pdf, pages, Math.min(1, Math.max(0.1, quality)), dpi)
        } else {
          progress.pending('Rebuilding the file…')
          var pdfDoc = await PDFLib.PDFDocument.load(data)
          saved = await pdfDoc.save({ useObjectStreams: true })
        }
        resultBlob = new Blob([saved], { type: 'application/pdf' })
        releasePreviewUrls()
        imageBlobs = []
        gallery.innerHTML = ''
        gallery.style.display = 'none'
        gifPreview.style.display = 'none'
        if (resultNote) resultNote.textContent = describeSaving(currentFile.size, resultBlob.size)
        showState('result')
        return
      }

      gallery.innerHTML = ''
      releasePreviewUrls()
      imageBlobs = []
      var rgbaFrames = []
      var w = 0
      var h = 0

      for (var i = 0; i < pages.length; i++) {
        progress.set('Rendering pages…', i / pages.length)
        setDetail('Page ' + (i + 1) + ' of ' + pages.length)
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
          var thumbUrl = URL.createObjectURL(blob)
          previewUrls.push(thumbUrl)
          var thumb = document.createElement('img')
          thumb.src = thumbUrl
          thumb.alt = 'Page ' + pages[i] + ' preview'
          thumb.style.maxWidth = '160px'
          gallery.appendChild(thumb)
        }
      }

      if (mode === 'to-gif') {
        resultBlob = await encodeGifFrames(rgbaFrames, w, h, 0, function (ratio, done, total) {
          progress.set('Encoding GIF…', ratio)
          setDetail('Frame ' + done + ' of ' + total)
        })
        var gifUrl = URL.createObjectURL(resultBlob)
        previewUrls.push(gifUrl)
        gifPreview.src = gifUrl
        gifPreview.alt = 'Converted GIF preview'
        gifPreview.style.display = ''
        gallery.style.display = 'none'
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
  dropzone.addEventListener('dragover', function (e) {
    e.preventDefault()
    dropzone.classList.add('drag-over')
  })
  dropzone.addEventListener('dragleave', function () { dropzone.classList.remove('drag-over') })
  dropzone.addEventListener('drop', function (e) {
    dropzone.classList.remove('drag-over')
    e.preventDefault()
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0])
  })
  fileInput.addEventListener('change', function () {
    if (fileInput.files[0]) handleFile(fileInput.files[0])
  })
  document.getElementById('ep-process').addEventListener('click', process)

  downloadBtn.addEventListener('click', function () {
    if (mode === 'to-png' || mode === 'to-jpg') {
      var ext = mode === 'to-jpg' ? '.jpg' : '.png'
      imageBlobs.forEach(function (blob, idx) {
        downloadBlob(blob, getPdfOutputFilename(currentFile.name, suffix + '-' + (idx + 1), ext))
      })
      return
    }
    if (!resultBlob) return
    var ext2 = mode === 'to-gif' ? '.gif' : '.pdf'
    downloadBlob(resultBlob, getPdfOutputFilename(currentFile.name, suffix, ext2))
  })

  showState('upload')
}
