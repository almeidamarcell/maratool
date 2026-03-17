import './hash-state.js'
import { formatBytes } from './pdf-common.js'
// PDF Merge & Split — uses pdf-lib
;(function () {
  'use strict'

  var pdfLibPromise = null
  function loadPdfLib() {
    if (pdfLibPromise) return pdfLibPromise
    pdfLibPromise = import('https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.esm.min.js')
    return pdfLibPromise
  }

  // Tab switching
  var tabs = document.querySelectorAll('.tool-tab')
  var panels = document.querySelectorAll('.tab-panel')
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('active') })
      panels.forEach(function (p) { p.style.display = 'none' })
      tab.classList.add('active')
      var target = document.getElementById(tab.dataset.panel)
      if (target) target.style.display = 'block'
    })
  })

  // ---- MERGE ----
  var mergeInput = document.getElementById('pms-merge-files')
  var mergeList = document.getElementById('pms-merge-list')
  var mergeBtn = document.getElementById('pms-merge-btn')
  var mergeProgress = document.getElementById('pms-merge-progress')
  var mergeFiles = []

  mergeInput.addEventListener('change', function (e) {
    for (var i = 0; i < e.target.files.length; i++) {
      mergeFiles.push(e.target.files[i])
    }
    renderMergeList()
  })

  function renderMergeList() {
    mergeList.innerHTML = ''
    mergeFiles.forEach(function (file, idx) {
      var item = document.createElement('div')
      item.className = 'pms-file-item'

      var info = document.createElement('span')
      info.className = 'pms-file-name'
      info.textContent = file.name + ' (' + formatBytes(file.size) + ')'

      var controls = document.createElement('span')
      controls.className = 'pms-file-controls'

      if (idx > 0) {
        var upBtn = document.createElement('button')
        upBtn.className = 'pms-move-btn'
        upBtn.textContent = '↑'
        upBtn.title = 'Move up'
        upBtn.addEventListener('click', function () {
          var tmp = mergeFiles[idx]
          mergeFiles[idx] = mergeFiles[idx - 1]
          mergeFiles[idx - 1] = tmp
          renderMergeList()
        })
        controls.appendChild(upBtn)
      }

      if (idx < mergeFiles.length - 1) {
        var downBtn = document.createElement('button')
        downBtn.className = 'pms-move-btn'
        downBtn.textContent = '↓'
        downBtn.title = 'Move down'
        downBtn.addEventListener('click', function () {
          var tmp = mergeFiles[idx]
          mergeFiles[idx] = mergeFiles[idx + 1]
          mergeFiles[idx + 1] = tmp
          renderMergeList()
        })
        controls.appendChild(downBtn)
      }

      var removeBtn = document.createElement('button')
      removeBtn.className = 'pms-move-btn pms-remove-btn'
      removeBtn.textContent = '×'
      removeBtn.title = 'Remove'
      removeBtn.addEventListener('click', function () {
        mergeFiles.splice(idx, 1)
        renderMergeList()
      })
      controls.appendChild(removeBtn)

      item.appendChild(info)
      item.appendChild(controls)
      mergeList.appendChild(item)
    })
    mergeBtn.style.display = mergeFiles.length >= 2 ? '' : 'none'
  }

  mergeBtn.addEventListener('click', async function () {
    mergeBtn.disabled = true
    mergeProgress.style.display = ''
    mergeProgress.textContent = 'Loading pdf-lib...'

    try {
      var PDFLib = await loadPdfLib()
      var merged = await PDFLib.PDFDocument.create()

      for (var i = 0; i < mergeFiles.length; i++) {
        mergeProgress.textContent = 'Merging file ' + (i + 1) + ' of ' + mergeFiles.length + '...'
        var data = await readFile(mergeFiles[i])
        var doc = await PDFLib.PDFDocument.load(data)
        var pages = await merged.copyPages(doc, doc.getPageIndices())
        pages.forEach(function (page) { merged.addPage(page) })
      }

      mergeProgress.textContent = 'Generating output...'
      var bytes = await merged.save()
      downloadBlob(new Blob([bytes], { type: 'application/pdf' }), 'merged.pdf')
      mergeProgress.textContent = 'Done!'
    } catch (e) {
      mergeProgress.textContent = 'Error: ' + e.message
    }
    mergeBtn.disabled = false
  })

  // ---- SPLIT ----
  var splitDropzone = document.getElementById('pms-split-dropzone')
  var splitFileInput = document.getElementById('pms-split-file')
  var splitInfo = document.getElementById('pms-split-info')
  var splitRangeInput = document.getElementById('pms-split-range')
  var splitBtn = document.getElementById('pms-split-btn')
  var splitProgress = document.getElementById('pms-split-progress')
  var splitControls = document.getElementById('pms-split-controls')
  var splitFileData = null
  var splitPageCount = 0

  splitDropzone.addEventListener('click', function () { splitFileInput.click() })
  splitDropzone.addEventListener('dragover', function (e) {
    e.preventDefault()
    splitDropzone.classList.add('dropzone-active')
  })
  splitDropzone.addEventListener('dragleave', function () {
    splitDropzone.classList.remove('dropzone-active')
  })
  splitDropzone.addEventListener('drop', function (e) {
    e.preventDefault()
    splitDropzone.classList.remove('dropzone-active')
    var file = e.dataTransfer.files[0]
    if (file && file.type === 'application/pdf') loadSplitFile(file)
  })
  splitFileInput.addEventListener('change', function (e) {
    if (e.target.files[0]) loadSplitFile(e.target.files[0])
  })

  async function loadSplitFile(file) {
    splitInfo.textContent = file.name + ' (' + formatBytes(file.size) + ')'
    splitFileData = await readFile(file)
    var PDFLib = await loadPdfLib()
    var doc = await PDFLib.PDFDocument.load(splitFileData)
    splitPageCount = doc.getPageCount()
    splitInfo.textContent += ' — ' + splitPageCount + ' pages'
    splitControls.style.display = ''
    splitRangeInput.placeholder = 'e.g. 1-3, 5, 7-' + splitPageCount
  }

  splitBtn.addEventListener('click', async function () {
    if (!splitFileData) return
    splitBtn.disabled = true
    splitProgress.style.display = ''
    splitProgress.textContent = 'Loading pdf-lib...'

    try {
      var PDFLib = await loadPdfLib()
      var sourceDoc = await PDFLib.PDFDocument.load(splitFileData)
      var indices = parsePageRange(splitRangeInput.value, splitPageCount)

      if (indices.length === 0) {
        splitProgress.textContent = 'No valid pages selected.'
        splitBtn.disabled = false
        return
      }

      splitProgress.textContent = 'Extracting pages...'
      var newDoc = await PDFLib.PDFDocument.create()
      var pages = await newDoc.copyPages(sourceDoc, indices)
      pages.forEach(function (page) { newDoc.addPage(page) })

      var bytes = await newDoc.save()
      downloadBlob(new Blob([bytes], { type: 'application/pdf' }), 'extracted.pdf')
      splitProgress.textContent = 'Done! Extracted ' + indices.length + ' page(s).'
    } catch (e) {
      splitProgress.textContent = 'Error: ' + e.message
    }
    splitBtn.disabled = false
  })

  function parsePageRange(str, max) {
    var indices = []
    var parts = str.split(',')
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i].trim()
      if (!part) continue
      var range = part.split('-')
      if (range.length === 2) {
        var start = parseInt(range[0], 10) || 1
        var end = parseInt(range[1], 10) || max
        for (var p = start; p <= end && p <= max; p++) {
          if (p >= 1) indices.push(p - 1) // 0-indexed
        }
      } else {
        var num = parseInt(part, 10)
        if (num >= 1 && num <= max) indices.push(num - 1)
      }
    }
    // Deduplicate and sort
    var seen = {}
    return indices.filter(function (idx) {
      if (seen[idx]) return false
      seen[idx] = true
      return true
    })
  }

  // Helpers
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
})()
