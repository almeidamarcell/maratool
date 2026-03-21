import { loadPdfJs, readFileAsArrayBuffer, setupDropzone, formatBytes } from './pdf-common.js'

;(function () {
  'use strict'

  var dropzone = document.getElementById('pf-dropzone')
  var fileInput = document.getElementById('pf-file')
  var statusEl = document.getElementById('pf-status')
  var summaryEl = document.getElementById('pf-summary')
  var reportEl = document.getElementById('pf-report')
  var docBody = document.getElementById('pf-doc-body')
  var pagesBody = document.getElementById('pf-pages-body')
  var fontsBody = document.getElementById('pf-fonts-body')
  var colorsBody = document.getElementById('pf-colors-body')
  var imagesBody = document.getElementById('pf-images-body')

  var pdfLibPromise = null
  function loadPdfLib() {
    if (pdfLibPromise) return pdfLibPromise
    pdfLibPromise = import('https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.esm.min.js')
    return pdfLibPromise
  }

  setupDropzone(dropzone, fileInput, function (file) {
    analyzePdf(file)
  })

  async function analyzePdf(file) {
    statusEl.textContent = 'Loading PDF libraries...'
    summaryEl.style.display = 'none'
    reportEl.style.display = 'none'

    var issues = []
    var arrayBuffer = await readFileAsArrayBuffer(file)

    try {
      // Load both libraries
      var pdfjsLib = await loadPdfJs()
      var PDFLib = await loadPdfLib()

      statusEl.textContent = 'Analyzing document...'

      // ---- pdf-lib analysis ----
      var pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer, { ignoreEncryption: true })
      var pageCount = pdfDoc.getPageCount()
      var pages = pdfDoc.getPages()

      // Document info
      var title = pdfDoc.getTitle() || '(none)'
      var author = pdfDoc.getAuthor() || '(none)'
      var creator = pdfDoc.getCreator() || '(none)'

      docBody.innerHTML = row('info', 'File name', file.name) +
        row('info', 'File size', formatBytes(file.size)) +
        row('info', 'Page count', String(pageCount)) +
        row('info', 'Title', title) +
        row('info', 'Author', author) +
        row('info', 'Creator', creator)

      // ---- Page sizes ----
      statusEl.textContent = 'Checking page sizes...'
      var pageSizes = []
      var sizeSet = {}
      for (var i = 0; i < pages.length; i++) {
        var pg = pages[i]
        var size = pg.getSize()
        var wMM = (size.width / 72 * 25.4).toFixed(1)
        var hMM = (size.height / 72 * 25.4).toFixed(1)
        var label = wMM + ' x ' + hMM + ' mm'
        pageSizes.push(label)
        sizeSet[label] = true
      }

      var sizeKeys = Object.keys(sizeSet)
      var mixedSizes = sizeKeys.length > 1
      var pagesHtml = ''
      for (var j = 0; j < pageSizes.length; j++) {
        pagesHtml += row('info', 'Page ' + (j + 1), pageSizes[j])
      }
      if (mixedSizes) {
        pagesHtml += row('warn', 'Mixed sizes', sizeKeys.length + ' different page sizes detected')
        issues.push('warn')
      } else {
        pagesHtml += row('pass', 'Consistent', 'All pages are ' + sizeKeys[0])
      }
      pagesBody.innerHTML = pagesHtml

      // ---- Font analysis via pdf.js ----
      statusEl.textContent = 'Checking fonts...'
      var pdfJsDoc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise
      var allFonts = {}
      for (var p = 1; p <= Math.min(pageCount, 50); p++) {
        var page = await pdfJsDoc.getPage(p)
        var opList = await page.getOperatorList()
        // Get font names from the page
        try {
          var textContent = await page.getTextContent()
          if (textContent && textContent.items) {
            for (var ti = 0; ti < textContent.items.length; ti++) {
              var item = textContent.items[ti]
              if (item.fontName) allFonts[item.fontName] = true
            }
          }
        } catch (fontErr) { /* ignore */ }
      }

      var fontNames = Object.keys(allFonts)
      var fontsHtml = ''
      if (fontNames.length === 0) {
        fontsHtml = row('info', 'Fonts', 'No text fonts detected (image-based PDF?)')
      } else {
        for (var f = 0; f < fontNames.length; f++) {
          var fn = fontNames[f]
          // Heuristic: standard 14 fonts are not embedded
          var isStd = /^(Helvetica|Courier|Times|Symbol|ZapfDingbats)/i.test(fn)
          if (isStd) {
            fontsHtml += row('warn', fn, 'Standard font — may not be embedded')
            issues.push('warn')
          } else {
            fontsHtml += row('pass', fn, 'Detected in document')
          }
        }
      }
      fontsBody.innerHTML = fontsHtml

      // ---- Color space detection ----
      statusEl.textContent = 'Checking color spaces...'
      var colorSpaces = { RGB: false, CMYK: false, Gray: false }
      for (var cp = 1; cp <= Math.min(pageCount, 20); cp++) {
        var cpage = await pdfJsDoc.getPage(cp)
        var cops = await cpage.getOperatorList()
        for (var oi = 0; oi < cops.fnArray.length; oi++) {
          var fn2 = cops.fnArray[oi]
          var args = cops.argsArray[oi]
          // OPS.setFillRGBColor=17, OPS.setStrokeRGBColor=18
          if (fn2 === 17 || fn2 === 18) colorSpaces.RGB = true
          // OPS.setFillCMYKColor=21, OPS.setStrokeCMYKColor=22
          if (fn2 === 21 || fn2 === 22) colorSpaces.CMYK = true
          // OPS.setFillGray=15, OPS.setStrokeGray=16
          if (fn2 === 15 || fn2 === 16) colorSpaces.Gray = true
        }
      }

      var colorsHtml = ''
      if (colorSpaces.CMYK) colorsHtml += row('pass', 'CMYK', 'CMYK colors detected — print ready')
      if (colorSpaces.RGB) {
        colorsHtml += row('warn', 'RGB', 'RGB colors detected — may need conversion to CMYK for print')
        issues.push('warn')
      }
      if (colorSpaces.Gray) colorsHtml += row('pass', 'Grayscale', 'Grayscale colors detected')
      if (!colorSpaces.CMYK && !colorSpaces.RGB && !colorSpaces.Gray) {
        colorsHtml = row('info', 'Colors', 'No explicit color operators found')
      }
      colorsBody.innerHTML = colorsHtml

      // ---- Image analysis ----
      statusEl.textContent = 'Checking images...'
      var imageCount = 0
      var lowRes = 0
      for (var ip = 1; ip <= Math.min(pageCount, 20); ip++) {
        var ipage = await pdfJsDoc.getPage(ip)
        var iops = await ipage.getOperatorList()
        var pageSize2 = ipage.getViewport({ scale: 1 })
        for (var ioi = 0; ioi < iops.fnArray.length; ioi++) {
          // OPS.paintImageXObject=85, OPS.paintJpegXObject=82
          if (iops.fnArray[ioi] === 85 || iops.fnArray[ioi] === 82) {
            imageCount++
            // Try to estimate resolution
            try {
              var imgName = iops.argsArray[ioi][0]
              var imgObj = await new Promise(function (resolve) {
                ipage.objs.get(imgName, resolve)
              })
              if (imgObj && imgObj.width && imgObj.height) {
                // Estimate DPI: pixels / (page dimension in inches)
                var dpiX = imgObj.width / (pageSize2.width / 72)
                var dpiY = imgObj.height / (pageSize2.height / 72)
                var dpi = Math.min(dpiX, dpiY)
                if (dpi < 150) lowRes++
              }
            } catch (imgErr) { /* ignore */ }
          }
        }
      }

      var imagesHtml = ''
      imagesHtml += row('info', 'Total images', String(imageCount) + ' found in first ' + Math.min(pageCount, 20) + ' pages')
      if (lowRes > 0) {
        imagesHtml += row('fail', 'Low resolution', lowRes + ' image(s) estimated below 150 DPI')
        issues.push('fail')
      } else if (imageCount > 0) {
        imagesHtml += row('pass', 'Resolution', 'No obviously low-resolution images detected')
      }
      imagesBody.innerHTML = imagesHtml

      // ---- Summary ----
      var hasError = issues.indexOf('fail') !== -1
      var hasWarn = issues.indexOf('warn') !== -1
      if (hasError) {
        summaryEl.className = 'pf-summary fail'
        summaryEl.textContent = '\u274C Issues found — address errors before printing'
      } else if (hasWarn) {
        summaryEl.className = 'pf-summary warn'
        summaryEl.textContent = '\u26A0\uFE0F Warnings found — review before printing'
      } else {
        summaryEl.className = 'pf-summary pass'
        summaryEl.textContent = '\u2705 PDF looks ready for print'
      }

      summaryEl.style.display = ''
      reportEl.style.display = ''
      statusEl.textContent = ''

      pdfJsDoc.destroy()
    } catch (err) {
      statusEl.textContent = 'Error analyzing PDF: ' + err.message
    }
  }

  function row(severity, label, value) {
    var iconMap = { pass: '\u2705', warn: '\u26A0\uFE0F', fail: '\u274C', info: '\u2139\uFE0F' }
    return '<div class="pf-row">' +
      '<span class="pf-icon ' + severity + '">' + iconMap[severity] + '</span>' +
      '<span class="pf-label">' + label + '</span>' +
      '<span class="pf-value">' + value + '</span>' +
      '</div>'
  }
})()
