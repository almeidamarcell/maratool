import './hash-state.js'
import { loadPdfJs, readFileAsArrayBuffer, setupDropzone, formatBytes } from './pdf-common.js'
// PDF to Markdown Converter
;(function () {
  'use strict'

  var dropzone = document.getElementById('ptm-dropzone')
  var fileInput = document.getElementById('ptm-file')
  var resultEl = document.getElementById('ptm-result')
  var output = document.getElementById('ptm-output')
  var progressEl = document.getElementById('ptm-progress')
  var fileInfo = document.getElementById('ptm-file-info')
  var copyBtn = document.getElementById('ptm-copy')
  var newBtn = document.getElementById('ptm-new')

  function showState(state) {
    dropzone.style.display = state === 'dropzone' ? '' : 'none'
    progressEl.style.display = state === 'progress' ? '' : 'none'
    resultEl.style.display = state === 'result' ? '' : 'none'
  }

  setupDropzone(dropzone, fileInput, processFile)

  async function processFile(file) {
    showState('progress')
    progressEl.textContent = 'Loading PDF library...'
    fileInfo.textContent = file.name + ' (' + formatBytes(file.size) + ')'

    try {
      var pdfjsLib = await loadPdfJs()
      var data = await readFileAsArrayBuffer(file)
      progressEl.textContent = 'Opening PDF...'

      var pdf = await pdfjsLib.getDocument({ data: data }).promise
      var totalPages = pdf.numPages
      var allMd = []

      for (var i = 1; i <= totalPages; i++) {
        progressEl.textContent = 'Converting page ' + i + ' of ' + totalPages + '...'
        var page = await pdf.getPage(i)
        var content = await page.getTextContent()
        var pageMd = convertToMarkdown(content.items)
        allMd.push(pageMd)
      }

      output.value = allMd.join('\n\n---\n\n')
      showState('result')
    } catch (e) {
      output.value = 'Error: ' + e.message
      showState('result')
    }
  }

  function convertToMarkdown(items) {
    if (!items || items.length === 0) return ''

    // Detect the most common font size (body text)
    var sizeCount = {}
    items.forEach(function (item) {
      if (!item.str || !item.str.trim()) return
      var size = item.transform ? Math.round(item.transform[0]) : 12
      sizeCount[size] = (sizeCount[size] || 0) + item.str.length
    })

    var bodySize = 12
    var maxCount = 0
    for (var s in sizeCount) {
      if (sizeCount[s] > maxCount) {
        maxCount = sizeCount[s]
        bodySize = parseInt(s, 10)
      }
    }

    var lines = []
    var currentLine = ''
    var lastY = null
    var lastSize = bodySize

    for (var j = 0; j < items.length; j++) {
      var item = items[j]
      if (!item.str && item.str !== '') continue

      var y = item.transform ? item.transform[5] : null
      var size = item.transform ? Math.round(item.transform[0]) : bodySize

      // New line detection
      if (lastY !== null && y !== null && Math.abs(y - lastY) > 2) {
        // Flush current line
        if (currentLine.trim()) {
          lines.push({ text: currentLine.trim(), size: lastSize })
        }
        currentLine = ''
      }

      currentLine += item.str
      lastY = y
      lastSize = size
    }
    // Flush last line
    if (currentLine.trim()) {
      lines.push({ text: currentLine.trim(), size: lastSize })
    }

    // Convert to markdown based on font size
    var md = []
    for (var k = 0; k < lines.length; k++) {
      var line = lines[k]
      var ratio = line.size / bodySize

      if (ratio >= 1.8) {
        md.push('\n# ' + line.text + '\n')
      } else if (ratio >= 1.4) {
        md.push('\n## ' + line.text + '\n')
      } else if (ratio >= 1.15) {
        md.push('\n### ' + line.text + '\n')
      } else {
        md.push(line.text)
      }
    }

    return md.join('\n')
  }

  copyBtn.addEventListener('click', function () {
    if (!output.value) return
    navigator.clipboard.writeText(output.value).then(function () {
      copyBtn.textContent = 'Copied!'
      copyBtn.classList.add('copied')
      setTimeout(function () {
        copyBtn.textContent = 'Copy Markdown'
        copyBtn.classList.remove('copied')
      }, 2000)
    })
  })

  newBtn.addEventListener('click', function () {
    output.value = ''
    fileInput.value = ''
    fileInfo.textContent = ''
    showState('dropzone')
  })
})()
