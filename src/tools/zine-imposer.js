import { formatBytes } from './pdf-common.js'

;(function () {
  'use strict'

  var MM_TO_PT = 72 / 25.4
  // A4 landscape
  var SHEET_W = 297 * MM_TO_PT
  var SHEET_H = 210 * MM_TO_PT

  var dropzone = document.getElementById('zi-dropzone')
  var fileInput = document.getElementById('zi-file')
  var fileInfo = document.getElementById('zi-file-info')
  var previewWrap = document.getElementById('zi-preview')
  var frontCanvas = document.getElementById('zi-front')
  var backCanvas = document.getElementById('zi-back')
  var instructions = document.getElementById('zi-instructions')
  var progressEl = document.getElementById('zi-progress')
  var generateBtn = document.getElementById('zi-generate')

  var pdfLibPromise = null
  function loadPdfLib() {
    if (pdfLibPromise) return pdfLibPromise
    pdfLibPromise = import('https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.esm.min.js')
    return pdfLibPromise
  }

  var sourceData = null
  var sourcePageCount = 0

  // Standard 8-page zine layout:
  // Front (landscape, 4 columns x 2 rows):
  //   Top row (rotated 180):  page5, page4, page3, page2  (reading R-to-L because flipped)
  //   Bottom row (normal):    page6, page7, page8, page1
  // Back:
  //   Mirrored for double-sided printing

  // Front layout: [row][col] = { page: 1-based, rotate: degrees }
  var FRONT_LAYOUT = [
    [{ page: 5, rotate: 180 }, { page: 4, rotate: 180 }, { page: 3, rotate: 180 }, { page: 2, rotate: 180 }],
    [{ page: 6, rotate: 0 }, { page: 7, rotate: 0 }, { page: 8, rotate: 0 }, { page: 1, rotate: 0 }],
  ]

  // Back layout (mirrored horizontally for double-sided flip on long edge):
  var BACK_LAYOUT = [
    [{ page: 2, rotate: 180 }, { page: 3, rotate: 180 }, { page: 4, rotate: 180 }, { page: 5, rotate: 180 }],
    [{ page: 1, rotate: 0 }, { page: 8, rotate: 0 }, { page: 7, rotate: 0 }, { page: 6, rotate: 0 }],
  ]

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
    var usable = Math.min(sourcePageCount, 8)
    fileInfo.textContent = file.name + ' (' + formatBytes(file.size) + ') — ' + sourcePageCount + ' pages (using ' + usable + ')'
    previewWrap.style.display = ''
    instructions.style.display = ''
    generateBtn.style.display = ''
    drawPreview()
  }

  function drawPreview() {
    drawSide(frontCanvas, FRONT_LAYOUT, 'Front')
    drawSide(backCanvas, BACK_LAYOUT, 'Back')
  }

  function drawSide(canvas, layout, label) {
    var ctx = canvas.getContext('2d')
    var cols = 4
    var rows = 2
    var scale = Math.min(380 / cols, 130)
    var cellW = scale
    var cellH = scale * 0.7
    canvas.width = cols * cellW + 20
    canvas.height = rows * cellH + 20

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var cell = layout[r][c]
        var x = 10 + c * cellW
        var y = 10 + r * cellH

        ctx.strokeStyle = '#ccc'
        ctx.lineWidth = 1
        ctx.strokeRect(x, y, cellW, cellH)
        ctx.fillStyle = cell.page <= sourcePageCount ? '#f0f0ee' : '#fafaf8'
        ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2)

        // Page label
        ctx.save()
        ctx.translate(x + cellW / 2, y + cellH / 2)
        if (cell.rotate === 180) ctx.rotate(Math.PI)
        ctx.fillStyle = cell.page <= sourcePageCount ? '#333' : '#bbb'
        ctx.font = '13px Inter, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('P' + cell.page, 0, 0)
        ctx.restore()
      }
    }

    // Draw cut line (center horizontal, middle two columns)
    if (label === 'Front') {
      ctx.strokeStyle = '#dc2626'
      ctx.lineWidth = 2
      ctx.setLineDash([4, 4])
      var cutY = 10 + cellH
      ctx.beginPath()
      ctx.moveTo(10 + cellW, cutY)
      ctx.lineTo(10 + 3 * cellW, cutY)
      ctx.stroke()
      ctx.setLineDash([])
    }
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
      var newDoc = await PDFLib.PDFDocument.create()

      // Embed source pages (up to 8)
      var usable = Math.min(sourceDoc.getPageCount(), 8)
      var indices = []
      for (var i = 0; i < usable; i++) indices.push(i)
      var embeddedPages = await newDoc.embedPdf(sourceDoc, indices)

      // Front page
      progressEl.textContent = 'Creating front side...'
      var frontPage = newDoc.addPage([SHEET_W, SHEET_H])
      placeSide(frontPage, embeddedPages, FRONT_LAYOUT)

      // Back page
      progressEl.textContent = 'Creating back side...'
      var backPage = newDoc.addPage([SHEET_W, SHEET_H])
      placeSide(backPage, embeddedPages, BACK_LAYOUT)

      progressEl.textContent = 'Generating output...'
      var bytes = await newDoc.save()
      downloadBlob(new Blob([bytes], { type: 'application/pdf' }), 'zine-layout.pdf')
      progressEl.textContent = 'Done!'
    } catch (err) {
      progressEl.textContent = 'Error: ' + err.message
    }
    generateBtn.disabled = false
  })

  function placeSide(page, embeddedPages, layout) {
    var cols = 4
    var rows = 2
    var cellW = SHEET_W / cols
    var cellH = SHEET_H / rows

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var cell = layout[r][c]
        var pageIdx = cell.page - 1
        if (pageIdx >= embeddedPages.length) continue

        var ep = embeddedPages[pageIdx]
        var dims = ep.size()

        // Scale to fit cell
        var scaleX = cellW / dims.width
        var scaleY = cellH / dims.height
        var scale = Math.min(scaleX, scaleY)
        var drawW = dims.width * scale
        var drawH = dims.height * scale

        // PDF coordinates: bottom-left origin
        var x = c * cellW + (cellW - drawW) / 2
        var y = SHEET_H - (r + 1) * cellH + (cellH - drawH) / 2

        if (cell.rotate === 180) {
          // For 180 rotation, we need to adjust the position
          page.drawPage(ep, {
            x: x + drawW,
            y: y + drawH,
            width: drawW,
            height: drawH,
            rotate: { type: 'degrees', angle: 180 },
          })
        } else {
          page.drawPage(ep, {
            x: x,
            y: y,
            width: drawW,
            height: drawH,
          })
        }
      }
    }
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

  // Initial empty preview
  drawPreview()
})()
