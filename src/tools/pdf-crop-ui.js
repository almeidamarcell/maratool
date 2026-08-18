// PDF cropper: a draggable crop rectangle over a rendered page preview, kept
// in sync with numeric margin fields, applied through pdf-lib's setCropBox.
//
// The interaction is deliberately the same shape as crop-image.js — drag the
// background to draw a box, drag inside it to move, drag a handle to resize —
// so the two croppers feel like one product.
//
// The source of truth is `margins`: four numbers in points, measured from the
// edges of the page *as displayed*. The preview overlay derives from them, the
// numeric fields derive from them, and pdf-crop-core turns them into a user
// space crop box. Nothing else does coordinate maths.
import { loadPdfJs, readFileAsArrayBuffer } from './pdf-common.js'
import { getPdfOutputFilename, parsePageRange } from './ezgif-pdf-core.js'
import { setVisible, nextPaint, makeProgress, formatSize, downloadBlob } from './tool-utils.js'
import {
  toPt,
  fromPt,
  normalizeRotation,
  visualSize,
  cropBoxFromMargins,
  fractionsFromMargins,
  marginsFromFractions,
  detectContentBounds,
  padFractions,
  resolveCropScope,
  formatCropSize,
} from './pdf-crop-core.js'

var PDF_LIB_URL = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.esm.min.js'
var MIN_CROP_PT = 12          // never let a crop collapse below ~4 mm
var AUTO_TRIM_PAD_PT = 6      // scans have noise at the ink edge; keep 2 mm
var PREVIEW_MAX_PX = 1100     // rendered resolution; CSS scales it to fit
var DETECT_MAX_PX = 700       // white-margin detection does not need detail

export function initPdfCropTool(config) {
  var opts = config || {}
  var suffix = opts.suffix || 'cropped'

  var byId = function (id) { return document.getElementById(id) }

  var dropzone = byId('pc-dropzone')
  var fileInput = byId('pc-file')
  var editor = byId('pc-editor')
  var stage = byId('pc-stage')
  var canvas = byId('pc-canvas')
  var boxEl = byId('pc-box')
  var prevBtn = byId('pc-prev')
  var nextBtn = byId('pc-next')
  var pageLabel = byId('pc-page-label')
  var unitSelect = byId('pc-unit')
  var scopeSelect = byId('pc-scope')
  var rangeField = byId('pc-range-field')
  var rangeInput = byId('pc-range')
  var autoEach = byId('pc-auto-each')
  var trimBtn = byId('pc-trim')
  var resetBtn = byId('pc-reset')
  var cropBtn = byId('pc-crop')
  var changeBtn = byId('pc-change')
  var pageSizeEl = byId('pc-page-size')
  var cropSizeEl = byId('pc-crop-size')
  var errorEl = byId('pc-error')
  var progressEl = byId('pc-progress')
  var progressDetail = byId('pc-progress-detail')
  var resultEl = byId('pc-result')
  var resultText = byId('pc-result-text')
  var downloadBtn = byId('pc-download')

  var marginInputs = {
    top: byId('pc-top'),
    right: byId('pc-right'),
    bottom: byId('pc-bottom'),
    left: byId('pc-left'),
  }

  if (!dropzone || !editor || !canvas || !boxEl) return

  var progress = makeProgress(byId('pc-progress-text'), byId('pc-progress-fill'))

  var pdfLibPromise = null
  function loadPdfLib() {
    if (!pdfLibPromise) pdfLibPromise = import(/* @vite-ignore */ PDF_LIB_URL)
    return pdfLibPromise
  }

  var file = null
  var sourceBytes = null       // untouched copy; pdf.js may detach what it gets
  var pdfDoc = null            // pdf.js document
  var pageCount = 0
  var pageNum = 1
  var pageBox = null           // current page crop box, PDF user space
  var pageRotation = 0
  var pageVisual = { width: 0, height: 0 }
  var margins = { top: 0, right: 0, bottom: 0, left: 0 }
  var unit = 'mm'
  var renderSeq = 0            // a slow page render must not paint over a newer one
  var resultBlob = null
  var drag = null
  var busy = false

  function clamp01(n) { return n < 0 ? 0 : n > 1 ? 1 : n }

  function showError(message) {
    if (!errorEl) return
    errorEl.textContent = message || ''
    setVisible(errorEl, !!message)
  }

  function setDetail(text) {
    if (progressDetail) progressDetail.textContent = text || ''
  }

  function setBusy(on, label) {
    busy = on
    setVisible(progressEl, on)
    if (!on) {
      progress.reset()
      setDetail('')
    } else if (label) {
      progress.pending(label)
    }
    ;[prevBtn, nextBtn, trimBtn, resetBtn, cropBtn, changeBtn].forEach(function (b) {
      if (b) b.disabled = on
    })
    if (!on) syncPageButtons()
  }

  function syncPageButtons() {
    if (prevBtn) prevBtn.disabled = busy || pageNum <= 1
    if (nextBtn) nextBtn.disabled = busy || pageNum >= pageCount
  }

  // ---- margins <-> overlay <-> fields -------------------------------------

  function currentFractions() {
    return fractionsFromMargins(margins, pageVisual)
  }

  function syncOverlay() {
    var f = currentFractions()
    boxEl.style.left = (f.x * 100) + '%'
    boxEl.style.top = (f.y * 100) + '%'
    boxEl.style.width = (f.w * 100) + '%'
    boxEl.style.height = (f.h * 100) + '%'
  }

  function decimals() { return unit === 'pt' ? 0 : unit === 'in' ? 2 : 1 }

  function syncFields() {
    var d = decimals()
    Object.keys(marginInputs).forEach(function (side) {
      var input = marginInputs[side]
      if (input) input.value = fromPt(margins[side], unit).toFixed(d)
    })
    if (cropSizeEl) {
      var box = cropBoxFromMargins(pageBox || { x: 0, y: 0, width: 0, height: 0 }, pageRotation, margins, MIN_CROP_PT)
      var vis = visualSize(box, pageRotation)
      cropSizeEl.textContent = pageBox ? formatCropSize(vis, unit) : '—'
    }
  }

  function syncAll() {
    syncOverlay()
    syncFields()
  }

  function setMarginsFromFractions(f) {
    margins = marginsFromFractions(f, pageVisual)
    syncAll()
  }

  function readMarginFields() {
    var next = {}
    Object.keys(marginInputs).forEach(function (side) {
      var input = marginInputs[side]
      next[side] = input ? Math.max(0, toPt(input.value, unit)) : 0
    })
    // Route through the fraction round-trip so an over-large number lands on
    // the same clamped value the drag path would produce.
    var f = fractionsFromMargins(next, pageVisual)
    var minW = pageVisual.width ? MIN_CROP_PT / pageVisual.width : 0
    var minH = pageVisual.height ? MIN_CROP_PT / pageVisual.height : 0
    if (f.w < minW) f.w = minW
    if (f.h < minH) f.h = minH
    if (f.x + f.w > 1) f.x = Math.max(0, 1 - f.w)
    if (f.y + f.h > 1) f.y = Math.max(0, 1 - f.h)
    setMarginsFromFractions(f)
  }

  // ---- dragging -----------------------------------------------------------

  function pointFromEvent(e) {
    var r = canvas.getBoundingClientRect()
    if (!r.width || !r.height) return { x: 0, y: 0 }
    return {
      x: clamp01((e.clientX - r.left) / r.width),
      y: clamp01((e.clientY - r.top) / r.height),
    }
  }

  function minFractions() {
    return {
      w: pageVisual.width ? MIN_CROP_PT / pageVisual.width : 0.02,
      h: pageVisual.height ? MIN_CROP_PT / pageVisual.height : 0.02,
    }
  }

  stage.addEventListener('pointerdown', function (e) {
    if (!pageBox || busy) return
    var handle = e.target && e.target.getAttribute ? e.target.getAttribute('data-handle') : null
    var p = pointFromEvent(e)
    var f = currentFractions()

    if (handle) {
      drag = { mode: 'resize', handle: handle, edges: { l: f.x, t: f.y, r: f.x + f.w, b: f.y + f.h } }
    } else if (e.target === boxEl) {
      drag = { mode: 'move', dx: p.x - f.x, dy: p.y - f.y, w: f.w, h: f.h }
    } else {
      drag = { mode: 'draw', ax: p.x, ay: p.y }
    }
    try { stage.setPointerCapture(e.pointerId) } catch (err) { /* older browsers */ }
    e.preventDefault()
  })

  stage.addEventListener('pointermove', function (e) {
    if (!drag || !pageBox) return
    var p = pointFromEvent(e)
    var min = minFractions()

    if (drag.mode === 'move') {
      setMarginsFromFractions({
        x: clamp01(Math.min(Math.max(p.x - drag.dx, 0), 1 - drag.w)),
        y: clamp01(Math.min(Math.max(p.y - drag.dy, 0), 1 - drag.h)),
        w: drag.w,
        h: drag.h,
      })
    } else if (drag.mode === 'draw') {
      var l = Math.min(drag.ax, p.x)
      var r = Math.max(drag.ax, p.x)
      var t = Math.min(drag.ay, p.y)
      var b = Math.max(drag.ay, p.y)
      if (r - l < min.w) r = Math.min(1, l + min.w)
      if (b - t < min.h) b = Math.min(1, t + min.h)
      setMarginsFromFractions({ x: l, y: t, w: r - l, h: b - t })
    } else {
      var edges = drag.edges
      var h = drag.handle
      if (h.indexOf('w') !== -1) edges.l = Math.min(p.x, edges.r - min.w)
      if (h.indexOf('e') !== -1) edges.r = Math.max(p.x, edges.l + min.w)
      if (h.indexOf('n') !== -1) edges.t = Math.min(p.y, edges.b - min.h)
      if (h.indexOf('s') !== -1) edges.b = Math.max(p.y, edges.t + min.h)
      setMarginsFromFractions({
        x: clamp01(edges.l),
        y: clamp01(edges.t),
        w: clamp01(edges.r) - clamp01(edges.l),
        h: clamp01(edges.b) - clamp01(edges.t),
      })
    }
    e.preventDefault()
  })

  function endDrag(e) {
    if (!drag) return
    drag = null
    try { stage.releasePointerCapture(e.pointerId) } catch (err) { /* ignore */ }
    syncAll()
  }
  stage.addEventListener('pointerup', endDrag)
  stage.addEventListener('pointercancel', endDrag)

  // ---- page rendering -----------------------------------------------------

  async function renderPageTo(targetCanvas, num, maxPx) {
    var page = await pdfDoc.getPage(num)
    var base = page.getViewport({ scale: 1 })
    var longest = Math.max(base.width, base.height) || 1
    var scale = Math.min(2, Math.max(0.1, maxPx / longest))
    var viewport = page.getViewport({ scale: scale })
    targetCanvas.width = Math.max(1, Math.round(viewport.width))
    targetCanvas.height = Math.max(1, Math.round(viewport.height))
    var ctx = targetCanvas.getContext('2d', { willReadFrequently: true })
    // pdf.js paints nothing where the page is blank, so lay down white first —
    // otherwise the preview shows the checkerboard and margin detection sees
    // transparent pixels instead of paper.
    ctx.save()
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, targetCanvas.width, targetCanvas.height)
    ctx.restore()
    await page.render({ canvasContext: ctx, viewport: viewport }).promise
    return page
  }

  async function showPage(num) {
    if (!pdfDoc) return
    var seq = ++renderSeq
    pageNum = Math.min(Math.max(1, num), pageCount)
    if (pageLabel) pageLabel.textContent = 'Page ' + pageNum + ' of ' + pageCount
    syncPageButtons()
    try {
      var page = await renderPageTo(canvas, pageNum, PREVIEW_MAX_PX)
      if (seq !== renderSeq) return
      var view = page.view || [0, 0, 612, 792]
      pageBox = {
        x: Math.min(view[0], view[2]),
        y: Math.min(view[1], view[3]),
        width: Math.abs(view[2] - view[0]),
        height: Math.abs(view[3] - view[1]),
      }
      pageRotation = normalizeRotation(page.rotate)
      pageVisual = visualSize(pageBox, pageRotation)
      if (pageSizeEl) pageSizeEl.textContent = formatCropSize(pageVisual, unit)
      syncAll()
    } catch (e) {
      if (seq === renderSeq) showError('That page could not be rendered. ' + (e && e.message ? e.message : ''))
    }
  }

  // ---- white-margin detection --------------------------------------------

  async function detectMarginsFor(num) {
    var scratch = document.createElement('canvas')
    await renderPageTo(scratch, num, DETECT_MAX_PX)
    var ctx = scratch.getContext('2d', { willReadFrequently: true })
    var img = ctx.getImageData(0, 0, scratch.width, scratch.height)
    var bounds = detectContentBounds(img)
    if (!bounds) return null
    var page = await pdfDoc.getPage(num)
    var view = page.view || [0, 0, 612, 792]
    var box = {
      x: Math.min(view[0], view[2]),
      y: Math.min(view[1], view[3]),
      width: Math.abs(view[2] - view[0]),
      height: Math.abs(view[3] - view[1]),
    }
    var vis = visualSize(box, normalizeRotation(page.rotate))
    return marginsFromFractions(padFractions(bounds, vis, AUTO_TRIM_PAD_PT), vis)
  }

  async function trimWhiteMargins() {
    if (!pdfDoc || busy) return
    showError('')
    setBusy(true, 'Looking for the printed area…')
    await nextPaint()
    try {
      var detected = await detectMarginsFor(pageNum)
      if (!detected) {
        showError('This page looks blank, so there is nothing to trim to.')
      } else {
        margins = detected
        syncAll()
      }
    } catch (e) {
      showError('Could not scan this page. ' + (e && e.message ? e.message : ''))
    } finally {
      setBusy(false)
    }
  }

  // ---- cropping -----------------------------------------------------------

  async function cropPdf() {
    if (!pdfDoc || !sourceBytes || busy) return
    showError('')
    setVisible(resultEl, false)
    resultBlob = null
    setBusy(true, 'Loading the PDF writer…')
    await nextPaint()

    try {
      var PDFLib = await loadPdfLib()
      var out = await PDFLib.PDFDocument.load(sourceBytes.slice())
      var scope = scopeSelect ? scopeSelect.value : 'all'
      var targets = resolveCropScope(scope, pageNum, pageCount, rangeInput ? rangeInput.value : '', parsePageRange)
      var perPage = !!(autoEach && autoEach.checked)
      var blanks = 0

      for (var i = 0; i < targets.length; i++) {
        var n = targets[i]
        progress.set(perPage ? 'Measuring and cropping…' : 'Cropping pages…', i / targets.length)
        setDetail('Page ' + n + ' (' + (i + 1) + ' of ' + targets.length + ')')
        await nextPaint()

        var applied = margins
        if (perPage) {
          var found = await detectMarginsFor(n)
          if (found) applied = found
          else blanks++
        }

        var page = out.getPage(n - 1)
        var box = page.getCropBox()
        var rotation = normalizeRotation(page.getRotation().angle)
        var next = cropBoxFromMargins(box, rotation, applied, MIN_CROP_PT)
        page.setCropBox(next.x, next.y, next.width, next.height)
      }

      progress.set('Writing the file…', 0.98)
      var bytes = await out.save({ useObjectStreams: true })
      resultBlob = new Blob([bytes], { type: 'application/pdf' })

      var summary = 'Cropped ' + targets.length + (targets.length === 1 ? ' page' : ' pages') +
        ' · ' + formatSize(resultBlob.size)
      if (blanks) summary += ' · ' + blanks + ' blank page' + (blanks === 1 ? '' : 's') + ' left uncropped'
      if (resultText) resultText.textContent = summary
      setVisible(resultEl, true)
    } catch (e) {
      showError('Could not write the cropped PDF. ' + (e && e.message ? e.message : ''))
    } finally {
      setBusy(false)
    }
  }

  // ---- file handling ------------------------------------------------------

  async function loadFile(f) {
    if (!f || (f.type && f.type !== 'application/pdf' && !/\.pdf$/i.test(f.name || ''))) {
      showError('That file is not a PDF.')
      return
    }
    showError('')
    file = f
    setVisible(dropzone, false)
    setVisible(editor, true)
    setVisible(resultEl, false)
    setBusy(true, 'Reading the PDF…')
    await nextPaint()

    try {
      var buffer = await readFileAsArrayBuffer(f)
      // Copy first: pdf.js can transfer this buffer to its worker, and pdf-lib
      // needs the original bytes when the crop is written.
      sourceBytes = new Uint8Array(buffer).slice()
      var pdfjs = await loadPdfJs()
      pdfDoc = await pdfjs.getDocument({ data: buffer }).promise
      pageCount = pdfDoc.numPages
      margins = { top: 0, right: 0, bottom: 0, left: 0 }
      setBusy(false)
      await showPage(1)
    } catch (e) {
      setBusy(false)
      showError('Could not open this PDF. ' + (e && e.message ? e.message : ''))
    }
  }

  function reset() {
    if (pdfDoc && pdfDoc.destroy) { try { pdfDoc.destroy() } catch (e) { /* ignore */ } }
    pdfDoc = null
    sourceBytes = null
    file = null
    pageCount = 0
    pageNum = 1
    pageBox = null
    pageVisual = { width: 0, height: 0 }
    margins = { top: 0, right: 0, bottom: 0, left: 0 }
    resultBlob = null
    renderSeq++
    if (fileInput) fileInput.value = ''
    var ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (pageSizeEl) pageSizeEl.textContent = '—'
    if (cropSizeEl) cropSizeEl.textContent = '—'
    if (pageLabel) pageLabel.textContent = 'Page 1 of 1'
    showError('')
    setVisible(resultEl, false)
    setVisible(editor, false)
    setVisible(dropzone, true)
    setBusy(false)
  }

  // ---- wiring -------------------------------------------------------------

  dropzone.addEventListener('click', function () { fileInput.click() })
  dropzone.addEventListener('dragover', function (e) { e.preventDefault(); dropzone.classList.add('drag-over') })
  dropzone.addEventListener('dragleave', function () { dropzone.classList.remove('drag-over') })
  dropzone.addEventListener('drop', function (e) {
    e.preventDefault()
    dropzone.classList.remove('drag-over')
    if (e.dataTransfer && e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0])
  })
  fileInput.addEventListener('change', function () {
    if (fileInput.files[0]) loadFile(fileInput.files[0])
  })

  Object.keys(marginInputs).forEach(function (side) {
    var input = marginInputs[side]
    if (input) input.addEventListener('change', readMarginFields)
  })

  if (unitSelect) {
    unitSelect.addEventListener('change', function () {
      unit = unitSelect.value
      if (pageBox && pageSizeEl) pageSizeEl.textContent = formatCropSize(pageVisual, unit)
      syncFields()
    })
  }

  if (scopeSelect) {
    scopeSelect.addEventListener('change', function () {
      setVisible(rangeField, scopeSelect.value === 'range')
    })
  }

  if (prevBtn) prevBtn.addEventListener('click', function () { if (pageNum > 1) showPage(pageNum - 1) })
  if (nextBtn) nextBtn.addEventListener('click', function () { if (pageNum < pageCount) showPage(pageNum + 1) })
  if (trimBtn) trimBtn.addEventListener('click', trimWhiteMargins)
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      margins = { top: 0, right: 0, bottom: 0, left: 0 }
      showError('')
      syncAll()
    })
  }
  if (cropBtn) cropBtn.addEventListener('click', cropPdf)
  if (changeBtn) changeBtn.addEventListener('click', reset)
  if (downloadBtn) {
    downloadBtn.addEventListener('click', function () {
      if (!resultBlob) return
      downloadBlob(resultBlob, getPdfOutputFilename(file ? file.name : 'document.pdf', suffix, '.pdf'))
    })
  }

  setVisible(editor, false)
  setVisible(resultEl, false)
  setVisible(rangeField, false)
  setVisible(progressEl, false)
  setVisible(dropzone, true)
}
