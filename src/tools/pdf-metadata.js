import './hash-state.js'
import { loadPdfJs, readFileAsArrayBuffer, setupDropzone, formatBytes } from './pdf-common.js'
// PDF Metadata Viewer
;(function () {
  'use strict'

  var dropzone = document.getElementById('pm-dropzone')
  var fileInput = document.getElementById('pm-file')
  var resultEl = document.getElementById('pm-result')
  var progressEl = document.getElementById('pm-progress')
  var fileInfo = document.getElementById('pm-file-info')
  var statsGrid = document.getElementById('pm-stats')
  var metaGrid = document.getElementById('pm-meta')
  var newBtn = document.getElementById('pm-new')

  function showState(state) {
    dropzone.style.display = state === 'dropzone' ? '' : 'none'
    progressEl.style.display = state === 'progress' ? '' : 'none'
    resultEl.style.display = state === 'result' ? '' : 'none'
  }

  setupDropzone(dropzone, fileInput, processFile)

  function createStat(label, value, isBadge) {
    var el = document.createElement('div')
    el.className = 'pm-stat'
    var labelEl = document.createElement('div')
    labelEl.className = 'pm-stat-label'
    labelEl.textContent = label
    var valueEl = document.createElement('div')
    if (isBadge) {
      valueEl.className = 'pm-stat-badge ' + (value ? 'pm-badge-pass' : 'pm-badge-fail')
      valueEl.textContent = value ? 'Yes' : 'No'
    } else {
      valueEl.className = 'pm-stat-value'
      valueEl.textContent = value || '—'
    }
    el.appendChild(labelEl)
    el.appendChild(valueEl)
    return el
  }

  async function processFile(file) {
    showState('progress')
    progressEl.textContent = 'Loading PDF library...'
    fileInfo.textContent = file.name + ' (' + formatBytes(file.size) + ')'

    try {
      var pdfjsLib = await loadPdfJs()
      var data = await readFileAsArrayBuffer(file)
      progressEl.textContent = 'Reading metadata...'

      var pdf = await pdfjsLib.getDocument({ data: data }).promise
      var meta = await pdf.getMetadata()
      var info = meta.info || {}

      statsGrid.innerHTML = ''
      statsGrid.appendChild(createStat('Pages', pdf.numPages))
      statsGrid.appendChild(createStat('File size', formatBytes(file.size)))
      statsGrid.appendChild(createStat('PDF version', info.PDFFormatVersion || '—'))

      metaGrid.innerHTML = ''
      metaGrid.appendChild(createStat('Title', info.Title))
      metaGrid.appendChild(createStat('Author', info.Author))
      metaGrid.appendChild(createStat('Subject', info.Subject))
      metaGrid.appendChild(createStat('Creator', info.Creator))
      metaGrid.appendChild(createStat('Producer', info.Producer))
      metaGrid.appendChild(createStat('Created', info.CreationDate ? formatPdfDate(info.CreationDate) : ''))
      metaGrid.appendChild(createStat('Modified', info.ModDate ? formatPdfDate(info.ModDate) : ''))
      metaGrid.appendChild(createStat('Tagged', !!info.IsTagged, true))
      metaGrid.appendChild(createStat('Encrypted', !!info.IsEncrypted, true))
      metaGrid.appendChild(createStat('Linearized', !!info.IsLinearized, true))

      showState('result')
    } catch (e) {
      statsGrid.innerHTML = '<div class="pm-error">Error: ' + e.message + '</div>'
      metaGrid.innerHTML = ''
      showState('result')
    }
  }

  function formatPdfDate(str) {
    // PDF dates: D:YYYYMMDDHHmmSS
    if (!str) return '—'
    var m = str.match(/D:(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?/)
    if (!m) return str
    return m[1] + '-' + m[2] + '-' + m[3] + (m[4] ? ' ' + m[4] + ':' + (m[5] || '00') : '')
  }

  newBtn.addEventListener('click', function () {
    statsGrid.innerHTML = ''
    metaGrid.innerHTML = ''
    fileInput.value = ''
    fileInfo.textContent = ''
    showState('dropzone')
  })
})()
