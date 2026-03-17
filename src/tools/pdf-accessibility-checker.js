import './hash-state.js'
import { loadPdfJs, readFileAsArrayBuffer, setupDropzone, formatBytes } from './pdf-common.js'
// PDF Accessibility Checker
;(function () {
  'use strict'

  var dropzone = document.getElementById('pac-dropzone')
  var fileInput = document.getElementById('pac-file')
  var resultEl = document.getElementById('pac-result')
  var progressEl = document.getElementById('pac-progress')
  var fileInfo = document.getElementById('pac-file-info')
  var checklistEl = document.getElementById('pac-checklist')
  var summaryEl = document.getElementById('pac-summary')
  var newBtn = document.getElementById('pac-new')

  function showState(state) {
    dropzone.style.display = state === 'dropzone' ? '' : 'none'
    progressEl.style.display = state === 'progress' ? '' : 'none'
    resultEl.style.display = state === 'result' ? '' : 'none'
  }

  setupDropzone(dropzone, fileInput, processFile)

  function createCheck(label, passed, detail) {
    var el = document.createElement('div')
    el.className = 'pac-check ' + (passed ? 'pac-check-pass' : 'pac-check-fail')
    var icon = document.createElement('span')
    icon.className = 'pac-check-icon'
    icon.textContent = passed ? '✓' : '✗'
    var text = document.createElement('span')
    text.className = 'pac-check-label'
    text.textContent = label
    el.appendChild(icon)
    el.appendChild(text)
    if (detail) {
      var detailEl = document.createElement('span')
      detailEl.className = 'pac-check-detail'
      detailEl.textContent = detail
      el.appendChild(detailEl)
    }
    return el
  }

  async function processFile(file) {
    showState('progress')
    progressEl.textContent = 'Loading PDF library...'
    fileInfo.textContent = file.name + ' (' + formatBytes(file.size) + ')'

    try {
      var pdfjsLib = await loadPdfJs()
      var data = await readFileAsArrayBuffer(file)
      progressEl.textContent = 'Analyzing accessibility...'

      var pdf = await pdfjsLib.getDocument({ data: data }).promise
      var meta = await pdf.getMetadata()
      var info = meta.info || {}

      var checks = []
      var passed = 0
      var total = 0

      // Check 1: Document title
      total++
      var hasTitle = !!(info.Title && info.Title.trim())
      if (hasTitle) passed++
      checks.push(createCheck('Document title', hasTitle, hasTitle ? info.Title : 'No title set'))

      // Check 2: Language
      total++
      var hasLang = false
      // pdf.js metadata may include Language
      if (meta.metadata) {
        try {
          var lang = meta.metadata.get('dc:language') || meta.metadata.get('pdf:Language')
          hasLang = !!(lang && lang.trim())
        } catch (e) { /* ignore */ }
      }
      if (hasLang) passed++
      checks.push(createCheck('Document language', hasLang, hasLang ? 'Language set' : 'No language specified'))

      // Check 3: Tagged PDF
      total++
      var isTagged = !!info.IsTagged
      if (isTagged) passed++
      checks.push(createCheck('Tagged PDF', isTagged, isTagged ? 'Structure tags present' : 'Not tagged — screen readers may not read this correctly'))

      // Check 4: Page count > 0 (basic validity)
      total++
      var hasPages = pdf.numPages > 0
      if (hasPages) passed++
      checks.push(createCheck('Valid PDF structure', hasPages, pdf.numPages + ' page(s)'))

      // Check 5: Author metadata
      total++
      var hasAuthor = !!(info.Author && info.Author.trim())
      if (hasAuthor) passed++
      checks.push(createCheck('Author metadata', hasAuthor, hasAuthor ? info.Author : 'No author set'))

      checklistEl.innerHTML = ''
      checks.forEach(function (el) { checklistEl.appendChild(el) })

      summaryEl.textContent = passed + ' of ' + total + ' checks passed'
      summaryEl.className = 'pac-summary ' + (passed === total ? 'pac-summary-pass' : passed >= total / 2 ? 'pac-summary-warn' : 'pac-summary-fail')

      showState('result')
    } catch (e) {
      checklistEl.innerHTML = '<div class="pac-error">Error: ' + e.message + '</div>'
      summaryEl.textContent = ''
      showState('result')
    }
  }

  newBtn.addEventListener('click', function () {
    checklistEl.innerHTML = ''
    summaryEl.textContent = ''
    fileInput.value = ''
    fileInfo.textContent = ''
    showState('dropzone')
  })
})()
