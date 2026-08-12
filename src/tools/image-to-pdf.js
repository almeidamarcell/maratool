import { readFileAsArrayBuffer } from './pdf-common.js'
import { downloadBlob, formatSize } from './tool-utils.js'

// Image → PDF — combine JPG/PNG/WebP into a single PDF with pdf-lib.
;(function () {
  'use strict'

  var PT_PER_PX = 72 / 96 // CSS px → PDF points
  var PAGE_SIZES = {
    a4: [595.28, 841.89],
    letter: [612, 792],
  }
  var MARGINS = { none: 0, small: 24, big: 48 }
  var ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']

  var pdfLibPromise = null
  function loadPdfLib() {
    if (pdfLibPromise) return pdfLibPromise
    pdfLibPromise = import('https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.esm.min.js')
    return pdfLibPromise
  }

  var dropzone = document.getElementById('itp-dropzone')
  var fileInput = document.getElementById('itp-file')
  var fileInputMore = document.getElementById('itp-file-more')
  var hint = document.getElementById('itp-hint')
  var listEl = document.getElementById('itp-list')
  var controls = document.getElementById('itp-controls')
  var sizeSel = document.getElementById('itp-size')
  var orientWrap = document.getElementById('itp-orient-wrap')
  var orientSel = document.getElementById('itp-orient')
  var marginSel = document.getElementById('itp-margin')
  var progress = document.getElementById('itp-progress')
  var convertBtn = document.getElementById('itp-convert')
  var resultEl = document.getElementById('itp-result')
  var resultInfo = document.getElementById('itp-result-info')
  var downloadBtn = document.getElementById('itp-download')
  var resetBtn = document.getElementById('itp-reset')

  if (!dropzone) return

  var images = [] // { file, url }
  var resultBlob = null
  var resultName = 'images.pdf'

  // ---- Upload wiring ----
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
    addFiles(e.dataTransfer.files)
  })
  fileInput.addEventListener('change', function (e) {
    addFiles(e.target.files)
    fileInput.value = ''
  })
  fileInputMore.addEventListener('change', function (e) {
    addFiles(e.target.files)
    fileInputMore.value = ''
  })

  function addFiles(fileList) {
    var accepted = 0
    var rejected = 0
    for (var i = 0; i < fileList.length; i++) {
      var f = fileList[i]
      if (ACCEPTED.indexOf(f.type) === -1) { rejected++; continue }
      images.push({ file: f, url: URL.createObjectURL(f) })
      accepted++
    }
    if (accepted === 0 && rejected > 0) {
      hint.style.display = ''
      hint.textContent = 'Only JPG, PNG, and WebP images are supported.'
    } else if (rejected > 0) {
      hint.style.display = ''
      hint.textContent = rejected + ' file(s) skipped — only JPG, PNG, and WebP are supported.'
    } else {
      hint.style.display = 'none'
    }
    // A new selection means any previous result is stale.
    hideResult()
    render()
  }

  function render() {
    listEl.innerHTML = ''
    images.forEach(function (img, idx) {
      var card = document.createElement('div')
      card.className = 'itp-card'

      var thumb = document.createElement('img')
      thumb.className = 'itp-thumb'
      thumb.src = img.url
      thumb.alt = img.file.name
      thumb.loading = 'lazy'
      card.appendChild(thumb)

      var meta = document.createElement('div')
      meta.className = 'itp-card-meta'
      meta.textContent = img.file.name + ' · ' + formatSize(img.file.size)
      card.appendChild(meta)

      var ctr = document.createElement('div')
      ctr.className = 'itp-card-controls'

      var up = document.createElement('button')
      up.className = 'itp-btn'
      up.type = 'button'
      up.textContent = '↑'
      up.title = 'Move earlier'
      up.setAttribute('aria-label', 'Move ' + img.file.name + ' earlier')
      up.disabled = idx === 0
      up.addEventListener('click', function () { move(idx, idx - 1) })
      ctr.appendChild(up)

      var down = document.createElement('button')
      down.className = 'itp-btn'
      down.type = 'button'
      down.textContent = '↓'
      down.title = 'Move later'
      down.setAttribute('aria-label', 'Move ' + img.file.name + ' later')
      down.disabled = idx === images.length - 1
      down.addEventListener('click', function () { move(idx, idx + 1) })
      ctr.appendChild(down)

      var rm = document.createElement('button')
      rm.className = 'itp-btn itp-remove'
      rm.type = 'button'
      rm.textContent = '×'
      rm.title = 'Remove'
      rm.setAttribute('aria-label', 'Remove ' + img.file.name)
      rm.addEventListener('click', function () { remove(idx) })
      ctr.appendChild(rm)

      card.appendChild(ctr)
      listEl.appendChild(card)
    })

    controls.style.display = images.length > 0 ? '' : 'none'
    convertBtn.disabled = images.length === 0
  }

  function move(from, to) {
    if (to < 0 || to >= images.length) return
    var tmp = images[from]
    images[from] = images[to]
    images[to] = tmp
    hideResult()
    render()
  }

  function remove(idx) {
    URL.revokeObjectURL(images[idx].url)
    images.splice(idx, 1)
    hideResult()
    render()
  }

  // Show/hide orientation control (only relevant for fixed page sizes)
  sizeSel.addEventListener('change', function () {
    orientWrap.style.display = sizeSel.value === 'fit' ? 'none' : ''
    hideResult()
  })
  orientSel.addEventListener('change', hideResult)
  marginSel.addEventListener('change', hideResult)

  function hideResult() {
    resultEl.style.display = 'none'
    resultBlob = null
  }

  // ---- Decode + embed ----
  async function embedImage(pdfDoc, PDFLib, file) {
    var bytes = new Uint8Array(await readFileAsArrayBuffer(file))
    if (file.type === 'image/jpeg') return pdfDoc.embedJpg(bytes)
    if (file.type === 'image/png') return pdfDoc.embedPng(bytes)
    // WebP: pdf-lib can't embed it — re-encode losslessly to PNG via canvas.
    var bitmap = await createImageBitmap(file)
    var canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    canvas.getContext('2d').drawImage(bitmap, 0, 0)
    bitmap.close && bitmap.close()
    var pngBytes = await new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (!blob) { reject(new Error('WebP conversion failed')); return }
        blob.arrayBuffer().then(function (buf) { resolve(new Uint8Array(buf)) }, reject)
      }, 'image/png')
    })
    return pdfDoc.embedPng(pngBytes)
  }

  function layout(imgW, imgH, sizeOpt, orientOpt, marginPt) {
    if (sizeOpt === 'fit') {
      var drawW = imgW * PT_PER_PX
      var drawH = imgH * PT_PER_PX
      return {
        pageW: drawW + marginPt * 2,
        pageH: drawH + marginPt * 2,
        x: marginPt,
        y: marginPt,
        drawW: drawW,
        drawH: drawH,
      }
    }
    var base = PAGE_SIZES[sizeOpt]
    var landscape
    if (orientOpt === 'portrait') landscape = false
    else if (orientOpt === 'landscape') landscape = true
    else landscape = imgW > imgH // auto
    var pageW = landscape ? base[1] : base[0]
    var pageH = landscape ? base[0] : base[1]
    var availW = Math.max(1, pageW - marginPt * 2)
    var availH = Math.max(1, pageH - marginPt * 2)
    var scale = Math.min(availW / imgW, availH / imgH)
    var dW = imgW * scale
    var dH = imgH * scale
    return {
      pageW: pageW,
      pageH: pageH,
      x: (pageW - dW) / 2,
      y: (pageH - dH) / 2,
      drawW: dW,
      drawH: dH,
    }
  }

  // ---- Convert ----
  convertBtn.addEventListener('click', async function () {
    if (images.length === 0) return
    convertBtn.disabled = true
    progress.style.display = ''
    progress.textContent = 'Loading PDF engine…'

    try {
      var PDFLib = await loadPdfLib()
      var pdfDoc = await PDFLib.PDFDocument.create()
      var sizeOpt = sizeSel.value
      var orientOpt = orientSel.value
      var marginPt = MARGINS[marginSel.value] || 0
      var failed = []

      for (var i = 0; i < images.length; i++) {
        progress.textContent = 'Adding image ' + (i + 1) + ' of ' + images.length + '…'
        try {
          var image = await embedImage(pdfDoc, PDFLib, images[i].file)
          var geo = layout(image.width, image.height, sizeOpt, orientOpt, marginPt)
          var page = pdfDoc.addPage([geo.pageW, geo.pageH])
          page.drawImage(image, { x: geo.x, y: geo.y, width: geo.drawW, height: geo.drawH })
        } catch (err) {
          failed.push(images[i].file.name)
        }
      }

      if (pdfDoc.getPageCount() === 0) {
        progress.textContent = 'None of the images could be added. Try different files.'
        convertBtn.disabled = false
        return
      }

      progress.textContent = 'Generating PDF…'
      var out = await pdfDoc.save()
      resultBlob = new Blob([out], { type: 'application/pdf' })
      resultName = images.length === 1
        ? images[0].file.name.replace(/\.[^.]+$/, '') + '.pdf'
        : 'images.pdf'

      progress.style.display = 'none'
      resultEl.style.display = ''
      var msg = 'PDF ready — ' + pdfDoc.getPageCount() + ' page(s), ' + formatSize(resultBlob.size) + '.'
      if (failed.length) msg += ' Skipped: ' + failed.join(', ') + '.'
      resultInfo.textContent = msg
    } catch (e) {
      progress.textContent = 'Error: ' + e.message
    }
    convertBtn.disabled = false
  })

  downloadBtn.addEventListener('click', function () {
    if (resultBlob) downloadBlob(resultBlob, resultName)
  })

  resetBtn.addEventListener('click', function () {
    images.forEach(function (img) { URL.revokeObjectURL(img.url) })
    images = []
    resultBlob = null
    hint.style.display = 'none'
    resultEl.style.display = 'none'
    progress.style.display = 'none'
    progress.textContent = ''
    sizeSel.value = 'fit'
    orientWrap.style.display = 'none'
    orientSel.value = 'auto'
    marginSel.value = 'none'
    render()
  })
})()
