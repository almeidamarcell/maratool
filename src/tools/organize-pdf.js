import { loadPdfJs, readFileAsArrayBuffer, setupDropzone, formatBytes } from './pdf-common.js'
import { downloadBlob } from './tool-utils.js'
import { getPdfOutputFilename } from './ezgif-pdf-core.js'

// Organize PDF — reorder, rotate, and delete pages, then export with pdf-lib.
;(function () {
  'use strict'

  var pdfLibPromise = null
  function loadPdfLib() {
    if (pdfLibPromise) return pdfLibPromise
    pdfLibPromise = import('https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.esm.min.js')
    return pdfLibPromise
  }

  var dropzone = document.getElementById('op-dropzone')
  var fileInput = document.getElementById('op-file')
  var info = document.getElementById('op-info')
  var progress = document.getElementById('op-progress')
  var toolbar = document.getElementById('op-toolbar')
  var countEl = document.getElementById('op-count')
  var rotateAllBtn = document.getElementById('op-rotate-all')
  var undoBtn = document.getElementById('op-undo')
  var resetBtn = document.getElementById('op-reset')
  var downloadBtn = document.getElementById('op-download')
  var grid = document.getElementById('op-grid')

  if (!dropzone) return

  var currentFile = null
  var originalBytes = null          // Uint8Array copy kept for pdf-lib export
  var canvasByIndex = {}            // srcIndex -> rendered <canvas>
  var pageCount = 0
  var pages = []                    // [{ srcIndex, rotation }] in current order
  var undoStack = []
  var loadToken = 0
  var dragFrom = -1

  setupDropzone(dropzone, fileInput, onFile)

  async function onFile(file) {
    var token = ++loadToken
    currentFile = file
    reset(true)
    info.textContent = file.name + ' (' + formatBytes(file.size) + ')'
    progress.style.display = ''
    progress.textContent = 'Reading file…'

    try {
      var buffer = await readFileAsArrayBuffer(file)
      // Copy before pdf.js sees the buffer — it may transfer it to its worker,
      // and pdf-lib needs the original bytes at export time.
      originalBytes = new Uint8Array(buffer).slice()

      var pdfjs = await loadPdfJs()
      var doc = await pdfjs.getDocument({ data: buffer }).promise
      if (token !== loadToken) return
      pageCount = doc.numPages

      for (var n = 1; n <= pageCount; n++) {
        progress.textContent = 'Rendering page ' + n + ' of ' + pageCount + '…'
        var page = await doc.getPage(n)
        if (token !== loadToken) return
        var baseW = page.getViewport({ scale: 1 }).width
        var viewport = page.getViewport({ scale: 160 / baseW })
        var canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        await page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport }).promise
        if (token !== loadToken) return
        canvasByIndex[n - 1] = canvas
        pages.push({ srcIndex: n - 1, rotation: 0 })
      }

      progress.style.display = 'none'
      toolbar.style.display = ''
      render()
    } catch (e) {
      progress.style.display = ''
      progress.textContent = 'Error: could not read this PDF. ' + (e && e.message ? e.message : '')
    }
  }

  function snapshot() {
    undoStack.push(pages.map(function (p) { return { srcIndex: p.srcIndex, rotation: p.rotation } }))
    if (undoStack.length > 50) undoStack.shift()
    undoBtn.disabled = false
  }

  function render() {
    grid.innerHTML = ''
    pages.forEach(function (p, idx) {
      var card = document.createElement('div')
      card.className = 'op-card'
      card.draggable = true

      card.addEventListener('dragstart', function (e) {
        dragFrom = idx
        card.classList.add('op-dragging')
        if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
      })
      card.addEventListener('dragend', function () {
        dragFrom = -1
        card.classList.remove('op-dragging')
        Array.prototype.forEach.call(grid.children, function (c) { c.classList.remove('op-drop-target') })
      })
      card.addEventListener('dragover', function (e) {
        e.preventDefault()
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
        card.classList.add('op-drop-target')
      })
      card.addEventListener('dragleave', function () { card.classList.remove('op-drop-target') })
      card.addEventListener('drop', function (e) {
        e.preventDefault()
        card.classList.remove('op-drop-target')
        if (dragFrom > -1 && dragFrom !== idx) moveTo(dragFrom, idx)
      })

      var wrap = document.createElement('div')
      wrap.className = 'op-thumb-wrap'
      var canvas = canvasByIndex[p.srcIndex]
      if (canvas) {
        canvas.style.transform = 'rotate(' + p.rotation + 'deg)'
        wrap.appendChild(canvas)
      }
      card.appendChild(wrap)

      var num = document.createElement('div')
      num.className = 'op-page-num'
      num.textContent = 'Page ' + (p.srcIndex + 1)
      card.appendChild(num)

      var ctr = document.createElement('div')
      ctr.className = 'op-card-controls'

      var left = mkBtn('op-btn', '←', 'Move page ' + (p.srcIndex + 1) + ' left', idx === 0, function () { moveTo(idx, idx - 1) })
      var rot = mkBtn('op-btn', '↻', 'Rotate page ' + (p.srcIndex + 1), false, function () {
        snapshot()
        p.rotation = (p.rotation + 90) % 360
        render()
      })
      var del = mkBtn('op-btn op-btn-del', '×', 'Delete page ' + (p.srcIndex + 1), false, function () {
        snapshot()
        pages.splice(idx, 1)
        render()
      })
      var right = mkBtn('op-btn', '→', 'Move page ' + (p.srcIndex + 1) + ' right', idx === pages.length - 1, function () { moveTo(idx, idx + 1) })

      ctr.appendChild(left)
      ctr.appendChild(rot)
      ctr.appendChild(del)
      ctr.appendChild(right)
      card.appendChild(ctr)

      grid.appendChild(card)
    })

    if (pages.length === 0) {
      countEl.textContent = 'All pages deleted — undo or reset.'
      downloadBtn.disabled = true
    } else {
      countEl.textContent = pages.length + ' of ' + pageCount + ' page(s)'
      downloadBtn.disabled = false
    }
  }

  function mkBtn(cls, label, aria, disabled, onClick) {
    var b = document.createElement('button')
    b.className = cls
    b.type = 'button'
    b.textContent = label
    b.setAttribute('aria-label', aria)
    b.title = aria
    b.disabled = !!disabled
    b.addEventListener('click', onClick)
    return b
  }

  function moveTo(from, to) {
    if (to < 0 || to >= pages.length || from === to) return
    snapshot()
    var item = pages.splice(from, 1)[0]
    pages.splice(to, 0, item)
    render()
  }

  rotateAllBtn.addEventListener('click', function () {
    if (pages.length === 0) return
    snapshot()
    pages.forEach(function (p) { p.rotation = (p.rotation + 90) % 360 })
    render()
  })

  undoBtn.addEventListener('click', function () {
    if (undoStack.length === 0) return
    pages = undoStack.pop()
    undoBtn.disabled = undoStack.length === 0
    render()
  })

  resetBtn.addEventListener('click', function () {
    if (pageCount === 0) return
    snapshot()
    pages = []
    for (var i = 0; i < pageCount; i++) pages.push({ srcIndex: i, rotation: 0 })
    render()
  })

  downloadBtn.addEventListener('click', async function () {
    if (!originalBytes || pages.length === 0) return
    downloadBtn.disabled = true
    progress.style.display = ''
    progress.textContent = 'Building PDF…'
    try {
      var PDFLib = await loadPdfLib()
      var srcDoc = await PDFLib.PDFDocument.load(originalBytes)
      var out = await PDFLib.PDFDocument.create()
      var copied = await out.copyPages(srcDoc, pages.map(function (p) { return p.srcIndex }))
      copied.forEach(function (page, i) {
        var extra = pages[i].rotation
        if (extra) page.setRotation(PDFLib.degrees((page.getRotation().angle + extra) % 360))
        out.addPage(page)
      })
      var bytes = await out.save()
      downloadBlob(new Blob([bytes], { type: 'application/pdf' }), getPdfOutputFilename(currentFile.name, 'organized', '.pdf'))
      progress.style.display = 'none'
    } catch (e) {
      progress.textContent = 'Error: ' + e.message
    }
    downloadBtn.disabled = false
  })

  function reset(keepFile) {
    canvasByIndex = {}
    pages = []
    undoStack = []
    pageCount = 0
    dragFrom = -1
    grid.innerHTML = ''
    toolbar.style.display = 'none'
    undoBtn.disabled = true
    downloadBtn.disabled = false
    if (!keepFile) {
      currentFile = null
      originalBytes = null
      info.textContent = ''
      progress.style.display = 'none'
    }
  }
})()
