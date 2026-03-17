import './hash-state.js'
import { loadPdfJs, readFileAsArrayBuffer, setupDropzone, formatBytes } from './pdf-common.js'
// PDF to Text Extractor
;(function () {
  'use strict'

  var dropzone = document.getElementById('ptt-dropzone')
  var fileInput = document.getElementById('ptt-file')
  var resultEl = document.getElementById('ptt-result')
  var output = document.getElementById('ptt-output')
  var progressEl = document.getElementById('ptt-progress')
  var fileInfo = document.getElementById('ptt-file-info')
  var copyBtn = document.getElementById('ptt-copy')
  var newBtn = document.getElementById('ptt-new')

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
      var allText = []

      for (var i = 1; i <= totalPages; i++) {
        progressEl.textContent = 'Extracting page ' + i + ' of ' + totalPages + '...'
        var page = await pdf.getPage(i)
        var content = await page.getTextContent()
        var pageText = ''
        var lastY = null

        for (var j = 0; j < content.items.length; j++) {
          var item = content.items[j]
          if (!item.str && item.str !== '') continue
          var y = item.transform ? item.transform[5] : null
          if (lastY !== null && y !== null && Math.abs(y - lastY) > 2) {
            pageText += '\n'
          }
          pageText += item.str
          lastY = y
        }
        allText.push(pageText)
      }

      output.value = allText.join('\n\n--- Page Break ---\n\n')
      showState('result')
    } catch (e) {
      output.value = 'Error: ' + e.message
      showState('result')
    }
  }

  copyBtn.addEventListener('click', function () {
    if (!output.value) return
    navigator.clipboard.writeText(output.value).then(function () {
      copyBtn.textContent = 'Copied!'
      copyBtn.classList.add('copied')
      setTimeout(function () {
        copyBtn.textContent = 'Copy text'
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
