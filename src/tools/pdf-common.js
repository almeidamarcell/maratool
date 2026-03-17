// Shared PDF utilities — used by all PDF tools
// Loads pdf.js from CDN, provides dropzone setup and file reading

var pdfjsPromise = null

export function loadPdfJs() {
  if (pdfjsPromise) return pdfjsPromise
  pdfjsPromise = import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.min.mjs').then(function (mod) {
    var pdfjsLib = mod
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs'
    return pdfjsLib
  })
  return pdfjsPromise
}

export function readFileAsArrayBuffer(file) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader()
    reader.onload = function () { resolve(reader.result) }
    reader.onerror = function () { reject(new Error('Failed to read file')) }
    reader.readAsArrayBuffer(file)
  })
}

export function setupDropzone(dropzoneEl, fileInputEl, onFile) {
  dropzoneEl.addEventListener('click', function () { fileInputEl.click() })

  fileInputEl.addEventListener('change', function (e) {
    var file = e.target.files[0]
    if (file) onFile(file)
  })

  dropzoneEl.addEventListener('dragover', function (e) {
    e.preventDefault()
    dropzoneEl.classList.add('dropzone-active')
  })

  dropzoneEl.addEventListener('dragleave', function () {
    dropzoneEl.classList.remove('dropzone-active')
  })

  dropzoneEl.addEventListener('drop', function (e) {
    e.preventDefault()
    dropzoneEl.classList.remove('dropzone-active')
    var file = e.dataTransfer.files[0]
    if (file && file.type === 'application/pdf') onFile(file)
  })
}

export function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
