import {
  detectInputFormat,
  getAvailableOutputs,
  getOutputMimeType,
  buildFilename,
  isPreviewable,
  wrapHtmlPreview,
  getOutputExtension,
} from './document-converter-core.js'
import { initPandoc, convertDocument, zipWithMedia } from './document-converter-pandoc.js'

var state = {
  file: null,
  inputFormat: null,
  output: null,
  pandocReady: false,
}

function populateOutputFormats(inputFormat) {
  var select = document.getElementById('dc-output')
  var outputs = getAvailableOutputs(inputFormat)
  select.innerHTML = ''
  outputs.forEach(function (fmt) {
    var opt = document.createElement('option')
    opt.value = fmt
    opt.textContent = fmt.toUpperCase()
    select.appendChild(opt)
  })
}

function showState(name) {
  document.getElementById('dc-dropzone').style.display = name === 'dropzone' ? '' : 'none'
  document.getElementById('dc-workspace').style.display = name === 'workspace' ? '' : 'none'
  document.getElementById('dc-progress').style.display = name === 'progress' ? '' : 'none'
  document.getElementById('dc-engine').style.display = name === 'engine' ? '' : 'none'
}

function setStatus(message, isError) {
  var el = document.getElementById('dc-status')
  el.textContent = message || ''
  el.classList.toggle('dc-status-error', !!isError)
}

function setEngineStatus(message) {
  var el = document.getElementById('dc-engine-text')
  if (el) el.textContent = message
}

function showPreview(parsed, outputFormat) {
  var previewText = document.getElementById('dc-preview-text')
  var previewHtml = document.getElementById('dc-preview-html')
  previewText.style.display = 'none'
  previewHtml.style.display = 'none'

  if (!isPreviewable(outputFormat, parsed.type === 'binary')) {
    document.getElementById('dc-preview-wrap').style.display = 'none'
    return
  }

  document.getElementById('dc-preview-wrap').style.display = ''

  if (outputFormat === 'html') {
    previewHtml.style.display = ''
    previewHtml.srcdoc = wrapHtmlPreview(parsed.content)
    return
  }

  previewText.style.display = ''
  previewText.value = parsed.content || ''
}

async function ensurePandoc() {
  if (state.pandocReady) return
  showState('engine')
  await initPandoc(setEngineStatus)
  state.pandocReady = true
}

async function runConversion() {
  if (!state.file) return
  var outputFormat = document.getElementById('dc-output').value
  setStatus('Converting with Pandoc…')
  document.getElementById('dc-convert').disabled = true
  document.getElementById('dc-download').disabled = true
  document.getElementById('dc-copy').disabled = true

  try {
    await ensurePandoc()
    showState('workspace')

    var parsed = await convertDocument(state.file, state.inputFormat, outputFormat)
    var downloadBlob = null
    var downloadName = buildFilename(state.file.name, outputFormat, false)
    var isZip = false

    if (parsed.type === 'binary') {
      downloadBlob = parsed.blob
      if (parsed.hasMedia) {
        downloadBlob = await zipWithMedia(parsed.blob, parsed.outputFilename || ('output.' + getOutputExtension(outputFormat)), parsed.mediaFiles)
        downloadName = buildFilename(state.file.name, outputFormat, true)
        isZip = true
      }
      state.output = {
        format: outputFormat,
        type: 'binary',
        blob: downloadBlob,
        content: null,
        downloadName: downloadName,
        isZip: isZip,
      }
      document.getElementById('dc-preview-wrap').style.display = 'none'
      setStatus(isZip ? 'Conversion complete — output includes extracted media (ZIP).' : 'Conversion complete.')
    } else {
      if (parsed.hasMedia && parsed.content) {
        var textBlob = new Blob([parsed.content], { type: getOutputMimeType(outputFormat) })
        downloadBlob = await zipWithMedia(textBlob, 'output.' + getOutputExtension(outputFormat), parsed.mediaFiles)
        downloadName = buildFilename(state.file.name, outputFormat, true)
        isZip = true
      }
      state.output = {
        format: outputFormat,
        type: 'text',
        blob: downloadBlob,
        content: parsed.content,
        downloadName: downloadName,
        isZip: isZip,
      }
      showPreview(state.output, outputFormat)
      setStatus(isZip ? 'Conversion complete — output includes extracted media (ZIP).' : 'Conversion complete.')
    }

    document.getElementById('dc-download').disabled = false
    document.getElementById('dc-copy').disabled = state.output.type === 'binary'
  } catch (err) {
    setStatus(err.message || 'Conversion failed', true)
    document.getElementById('dc-download').disabled = true
    document.getElementById('dc-copy').disabled = true
  } finally {
    document.getElementById('dc-convert').disabled = false
  }
}

async function handleFile(file) {
  if (!file) return
  var inputFormat = detectInputFormat(file.name)
  state.file = file
  state.inputFormat = inputFormat
  state.output = null

  showState('progress')
  setStatus('Preparing ' + file.name + '…')

  try {
    document.getElementById('dc-file-name').textContent = file.name
    document.getElementById('dc-file-format').textContent = inputFormat.toUpperCase()
    populateOutputFormats(inputFormat)
    showState('workspace')
    setStatus('Loading Pandoc engine on first use (~56 MB, cached by browser)…')
    await runConversion()
  } catch (err) {
    showState('dropzone')
    setStatus(err.message || 'Failed to open file', true)
  }
}

function downloadOutput() {
  if (!state.output || !state.file) return
  var blob = state.output.blob
  if (!blob && state.output.content) {
    blob = new Blob([state.output.content], { type: getOutputMimeType(state.output.format) })
  }
  if (!blob) return

  var url = URL.createObjectURL(blob)
  var a = document.createElement('a')
  a.href = url
  a.download = state.output.downloadName || buildFilename(state.file.name, state.output.format, state.output.isZip)
  a.click()
  setTimeout(function () { URL.revokeObjectURL(url) }, 2000)
}

function setupDropzone() {
  var dropzone = document.getElementById('dc-dropzone')
  var fileInput = document.getElementById('dc-file')

  dropzone.addEventListener('click', function () { fileInput.click() })
  fileInput.addEventListener('change', function (e) {
    if (e.target.files[0]) handleFile(e.target.files[0])
  })

  dropzone.addEventListener('dragover', function (e) {
    e.preventDefault()
    dropzone.classList.add('dragover')
  })
  dropzone.addEventListener('dragleave', function () {
    dropzone.classList.remove('dragover')
  })
  dropzone.addEventListener('drop', function (e) {
    e.preventDefault()
    dropzone.classList.remove('dragover')
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0])
  })
}

;(function () {
  setupDropzone()

  document.getElementById('dc-convert').addEventListener('click', runConversion)
  document.getElementById('dc-output').addEventListener('change', runConversion)
  document.getElementById('dc-download').addEventListener('click', downloadOutput)

  document.getElementById('dc-change').addEventListener('click', function () {
    state.file = null
    state.output = null
    document.getElementById('dc-file').value = ''
    showState('dropzone')
    setStatus('')
  })

  document.getElementById('dc-copy').addEventListener('click', function () {
    var btn = document.getElementById('dc-copy')
    var text = state.output && state.output.content ? state.output.content : ''
    if (!text) return
    navigator.clipboard.writeText(text).then(function () {
      btn.textContent = 'Copied!'
      btn.classList.add('copied')
      setTimeout(function () {
        btn.textContent = 'Copy output'
        btn.classList.remove('copied')
      }, 2000)
    })
  })
})()
