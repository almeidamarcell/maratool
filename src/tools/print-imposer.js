import { formatBytes } from './pdf-common.js'

;(function () {
  'use strict'

  var MM_TO_PT = 72 / 25.4

  var SHEETS = {
    a4: { w: 210, h: 297 },
    a3: { w: 297, h: 420 },
    letter: { w: 216, h: 279 },
    tabloid: { w: 279, h: 432 },
  }

  var dropzone = document.getElementById('pi-dropzone')
  var fileInput = document.getElementById('pi-file')
  var fileInfo = document.getElementById('pi-file-info')
  var controls = document.getElementById('pi-controls')
  var modeSelect = document.getElementById('pi-mode')
  var nupOpts = document.getElementById('pi-nup-opts')
  var rowsInput = document.getElementById('pi-rows')
  var colsInput = document.getElementById('pi-cols')
  var sheetSelect = document.getElementById('pi-sheet')
  var previewCanvas = document.getElementById('pi-preview')
  var progressEl = document.getElementById('pi-progress')
  var generateBtn = document.getElementById('pi-generate')

  var pdfLibPromise = null
  function loadPdfLib() {
    if (pdfLibPromise) return pdfLibPromise
    pdfLibPromise = import('https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.esm.min.js')
    return pdfLibPromise
  }

  var sourceData = null
  var sourcePageCount = 0

  // Dropzone
  dropzone.addEventListener('click', function () { fileInput.click() })
  dropzone.addEventListener('dragover', function (e) {
    e.preventDefault()
    dropzone.classList.add('dropzone-active')
  })
  dropzone.addEventListener('dragleave', function () {
    dropzone.classList.remove('dropzone-active')
  })
  dropzone.addEventListener('drop', function (e) {
    e.preventDefault()
    dropzone.classList.remove('dropzone-active')
    var f = e.dataTransfer.files[0]
    if (f && f.type === 'application/pdf') loadFile(f)
  })
  fileInput.addEventListener('change', function (e) {
    if (e.target.files[0]) loadFile(e.target.files[0])
  })

  async function loadFile(file) {
    sourceData = await readFile(file)
    var PDFLib = await loadPdfLib()
    var doc = await PDFLib.PDFDocument.load(sourceData)
    sourcePageCount = doc.getPageCount()
    fileInfo.textContent = file.name + ' (' + formatBytes(file.size) + ') — ' + sourcePageCount + ' pages'
    controls.style.display = ''
    drawPreview()
  }

  modeSelect.addEventListener('change', function () {
    nupOpts.style.display = modeSelect.value === 'nup' ? '' : 'none'
    drawPreview()
  })
  sheetSelect.addEventListener('change', drawPreview)
  rowsInput.addEventListener('input', drawPreview)
  colsInput.addEventListener('input', drawPreview)

  function getGrid() {
    var mode = modeSelect.value
    if (mode === 'booklet' || mode === '2up') return { rows: 1, cols: 2 }
    if (mode === '4up') return { rows: 2, cols: 2 }
    return { rows: parseInt(rowsInput.value, 10) || 2, cols: parseInt(colsInput.value, 10) || 2 }
  }

  function drawPreview() {
    var ctx = previewCanvas.getContext('2d')
    var sheet = SHEETS[sheetSelect.value]
    // Landscape orientation for imposition
    var sw = Math.max(sheet.w, sheet.h)
    var sh = Math.min(sheet.w, sheet.h)

    var scale = Math.min(380 / sw, 260 / sh)
    previewCanvas.width = Math.round(sw * scale) + 20
    previewCanvas.height = Math.round(sh * scale) + 20

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, previewCanvas.width, previewCanvas.height)
    ctx.strokeStyle = '#ccc'
    ctx.lineWidth = 1
    ctx.strokeRect(10, 10, sw * scale, sh * scale)

    var grid = getGrid()
    var cellW = (sw * scale) / grid.cols
    var cellH = (sh * scale) / grid.rows
    var mode = modeSelect.value
    var pageNum = 1

    for (var r = 0; r < grid.rows; r++) {
      for (var c = 0; c < grid.cols; c++) {
        var x = 10 + c * cellW
        var y = 10 + r * cellH
        ctx.strokeStyle = 'var(--border, #e8e8e4)'
        ctx.strokeRect(x, y, cellW, cellH)
        ctx.fillStyle = '#f7f7f5'
        ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2)

        // Label
        var label = ''
        if (mode === 'booklet') {
          var total = padTo(sourcePageCount, 4)
          if (c === 0) label = String(total)
          else label = '1'
        } else {
          label = String(pageNum)
          pageNum++
        }

        ctx.fillStyle = '#6b6b63'
        ctx.font = '14px Inter, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('P' + label, x + cellW / 2, y + cellH / 2)
      }
    }
  }

  function padTo(n, multiple) {
    return n + (multiple - (n % multiple)) % multiple
  }

  // Generate
  generateBtn.addEventListener('click', async function () {
    if (!sourceData) return
    generateBtn.disabled = true
    progressEl.style.display = ''
    progressEl.textContent = 'Loading pdf-lib...'

    try {
      var PDFLib = await loadPdfLib()
      var sourceDoc = await PDFLib.PDFDocument.load(sourceData)
      var totalPages = sourceDoc.getPageCount()
      var mode = modeSelect.value
      var grid = getGrid()
      var sheet = SHEETS[sheetSelect.value]

      // Landscape
      var sheetW = Math.max(sheet.w, sheet.h) * MM_TO_PT
      var sheetH = Math.min(sheet.w, sheet.h) * MM_TO_PT

      var newDoc = await PDFLib.PDFDocument.create()
      var embeddedPages = await newDoc.embedPdf(sourceDoc, sourceDoc.getPageIndices())

      if (mode === 'booklet') {
        await generateBooklet(PDFLib, newDoc, embeddedPages, totalPages, sheetW, sheetH)
      } else {
        await generateNup(PDFLib, newDoc, embeddedPages, totalPages, sheetW, sheetH, grid)
      }

      progressEl.textContent = 'Generating output...'
      var bytes = await newDoc.save()
      downloadBlob(new Blob([bytes], { type: 'application/pdf' }), 'imposed.pdf')
      progressEl.textContent = 'Done!'
    } catch (err) {
      progressEl.textContent = 'Error: ' + err.message
    }
    generateBtn.disabled = false
  })

  async function generateBooklet(PDFLib, newDoc, embeddedPages, totalPages, sheetW, sheetH) {
    var padded = padTo(totalPages, 4)
    // Build page list with blanks
    var pages = []
    for (var i = 0; i < padded; i++) {
      pages.push(i < totalPages ? embeddedPages[i] : null)
    }

    var sheets = padded / 4
    var cellW = sheetW / 2
    var cellH = sheetH

    for (var s = 0; s < sheets; s++) {
      progressEl.textContent = 'Imposing sheet ' + (s + 1) + ' of ' + sheets + '...'

      // Front: (last, first)
      var frontLeft = padded - 1 - (s * 2)
      var frontRight = s * 2

      // Back: (first+1, last-1)
      var backLeft = s * 2 + 1
      var backRight = padded - 2 - (s * 2)

      // Front page
      var frontPage = newDoc.addPage([sheetW, sheetH])
      drawPageOnSheet(frontPage, pages[frontLeft], 0, 0, cellW, cellH)
      drawPageOnSheet(frontPage, pages[frontRight], cellW, 0, cellW, cellH)

      // Back page
      var backPage = newDoc.addPage([sheetW, sheetH])
      drawPageOnSheet(backPage, pages[backLeft], 0, 0, cellW, cellH)
      drawPageOnSheet(backPage, pages[backRight], cellW, 0, cellW, cellH)
    }
  }

  async function generateNup(PDFLib, newDoc, embeddedPages, totalPages, sheetW, sheetH, grid) {
    var perSheet = grid.rows * grid.cols
    var totalSheets = Math.ceil(totalPages / perSheet)
    var cellW = sheetW / grid.cols
    var cellH = sheetH / grid.rows

    var pageIdx = 0
    for (var s = 0; s < totalSheets; s++) {
      progressEl.textContent = 'Imposing sheet ' + (s + 1) + ' of ' + totalSheets + '...'
      var page = newDoc.addPage([sheetW, sheetH])

      for (var r = 0; r < grid.rows; r++) {
        for (var c = 0; c < grid.cols; c++) {
          if (pageIdx < totalPages) {
            var x = c * cellW
            var y = sheetH - (r + 1) * cellH // PDF coords are bottom-up
            drawPageOnSheet(page, embeddedPages[pageIdx], x, y, cellW, cellH)
            pageIdx++
          }
        }
      }
    }
  }

  function drawPageOnSheet(page, embeddedPage, x, y, cellW, cellH) {
    if (!embeddedPage) return
    var dims = embeddedPage.size()
    var scaleX = cellW / dims.width
    var scaleY = cellH / dims.height
    var scale = Math.min(scaleX, scaleY)
    var drawW = dims.width * scale
    var drawH = dims.height * scale
    // Center in cell
    var offsetX = x + (cellW - drawW) / 2
    var offsetY = y + (cellH - drawH) / 2

    page.drawPage(embeddedPage, {
      x: offsetX,
      y: offsetY,
      width: drawW,
      height: drawH,
    })
  }

  function readFile(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader()
      reader.onload = function () { resolve(new Uint8Array(reader.result)) }
      reader.onerror = function () { reject(new Error('Failed to read file')) }
      reader.readAsArrayBuffer(file)
    })
  }

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Initial preview
  drawPreview()
})()
