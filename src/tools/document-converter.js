import {
  detectInputFormat,
  getAvailableOutputs,
  getOutputMimeType,
  buildFilename,
  convertContent,
  stripRtf,
  rstToHtml,
  odtXmlToHtml,
  isPreviewable,
} from './document-converter-core.js'
import { markdownToHtml } from './markdown-to-html-core.js'

var mammothPromise = null
var jszipPromise = null
var html2pdfPromise = null

var state = {
  file: null,
  inputFormat: null,
  parsed: null,
  output: null,
}

function loadScript(src) {
  return new Promise(function (resolve, reject) {
    var existing = document.querySelector('script[data-src="' + src + '"]')
    if (existing) {
      if (existing.dataset.loaded === '1') resolve()
      else existing.addEventListener('load', resolve)
      return
    }
    var script = document.createElement('script')
    script.src = src
    script.dataset.src = src
    script.onload = function () {
      script.dataset.loaded = '1'
      resolve()
    }
    script.onerror = function () { reject(new Error('Failed to load ' + src)) }
    document.head.appendChild(script)
  })
}

function loadMammoth() {
  if (mammothPromise) return mammothPromise
  mammothPromise = loadScript('https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js').then(function () {
    return window.mammoth
  })
  return mammothPromise
}

function loadJsZip() {
  if (jszipPromise) return jszipPromise
  jszipPromise = import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm').then(function (mod) {
    return mod.default
  })
  return jszipPromise
}

function loadHtml2Pdf() {
  if (html2pdfPromise) return html2pdfPromise
  html2pdfPromise = Promise.all([
    loadScript('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js'),
    loadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js'),
  ]).then(function () {
    return function (element, options) {
      return window.html2canvas(element, options).then(function (canvas) {
        var imgData = canvas.toDataURL('image/png')
        var pdf = new window.jspdf.jsPDF({ unit: 'pt', format: 'a4' })
        var pageWidth = pdf.internal.pageSize.getWidth()
        var pageHeight = pdf.internal.pageSize.getHeight()
        var ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height)
        var w = canvas.width * ratio
        var h = canvas.height * ratio
        pdf.addImage(imgData, 'PNG', 0, 0, w, h)
        return pdf.output('blob')
      })
    }
  })
  return html2pdfPromise
}

function readFileAsText(file) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader()
    reader.onload = function () { resolve(reader.result) }
    reader.onerror = function () { reject(new Error('Failed to read file')) }
    reader.readAsText(file)
  })
}

function readFileAsArrayBuffer(file) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader()
    reader.onload = function () { resolve(reader.result) }
    reader.onerror = function () { reject(new Error('Failed to read file')) }
    reader.readAsArrayBuffer(file)
  })
}

async function parseDocx(buffer) {
  var mammoth = await loadMammoth()
  var result = await mammoth.convertToHtml({ arrayBuffer: buffer })
  return { format: 'docx', html: result.value, text: '', warnings: result.messages }
}

async function parseEpub(buffer) {
  var JSZip = await loadJsZip()
  var zip = await JSZip.loadAsync(buffer)
  var containerFile = zip.file('META-INF/container.xml')
  if (!containerFile) throw new Error('Invalid EPUB: missing container.xml')
  var containerXml = await containerFile.async('text')
  var containerDoc = new DOMParser().parseFromString(containerXml, 'text/xml')
  var rootfile = containerDoc.querySelector('rootfile')
  var opfPath = rootfile ? rootfile.getAttribute('full-path') : null
  if (!opfPath) throw new Error('Invalid EPUB: cannot find OPF path')
  var opfFile = zip.file(opfPath)
  if (!opfFile) throw new Error('Invalid EPUB: missing OPF file')
  var opfXml = await opfFile.async('text')
  var opfDoc = new DOMParser().parseFromString(opfXml, 'text/xml')
  var opfDir = opfPath.replace(/[^/]+$/, '')
  var manifest = {}
  opfDoc.querySelectorAll('manifest item, item').forEach(function (item) {
    var id = item.getAttribute('id')
    var href = item.getAttribute('href')
    if (id && href) manifest[id] = opfDir + href
  })
  var htmlParts = []
  var spineItems = opfDoc.querySelectorAll('spine itemref, itemref')
  if (spineItems.length) {
    for (var i = 0; i < spineItems.length; i++) {
      var idref = spineItems[i].getAttribute('idref')
      var path = manifest[idref]
      if (!path) continue
      var chapter = zip.file(path)
      if (chapter) {
        var chapterHtml = await chapter.async('text')
        var doc = new DOMParser().parseFromString(chapterHtml, 'text/html')
        htmlParts.push(doc.body ? doc.body.innerHTML : chapterHtml)
      }
    }
  } else {
    var files = Object.keys(zip.files).filter(function (name) {
      return /\.(x?html?)$/i.test(name) && !name.startsWith('META-INF/')
    })
    for (var j = 0; j < files.length; j++) {
      var content = await zip.file(files[j]).async('text')
      var parsed = new DOMParser().parseFromString(content, 'text/html')
      htmlParts.push(parsed.body ? parsed.body.innerHTML : content)
    }
  }
  return { format: 'epub', html: htmlParts.join('\n<hr>\n'), text: '' }
}

async function parseOdt(buffer) {
  var JSZip = await loadJsZip()
  var zip = await JSZip.loadAsync(buffer)
  var contentFile = zip.file('content.xml')
  if (!contentFile) throw new Error('Invalid ODT: missing content.xml')
  var xml = await contentFile.async('text')
  return { format: 'odt', html: odtXmlToHtml(xml), text: '' }
}

async function parseInputFile(file, inputFormat) {
  if (inputFormat === 'docx' || inputFormat === 'doc') {
    var buffer = await readFileAsArrayBuffer(file)
    return parseDocx(buffer)
  }
  if (inputFormat === 'epub') {
    return parseEpub(await readFileAsArrayBuffer(file))
  }
  if (inputFormat === 'odt') {
    return parseOdt(await readFileAsArrayBuffer(file))
  }

  var text = await readFileAsText(file)

  if (inputFormat === 'html') {
    var htmlDoc = new DOMParser().parseFromString(text, 'text/html')
    return { format: 'html', html: htmlDoc.body ? htmlDoc.body.innerHTML : text, text: text }
  }
  if (inputFormat === 'md') {
    return { format: 'md', html: markdownToHtml(text), text: text }
  }
  if (inputFormat === 'rtf') {
    var plain = stripRtf(text)
    return { format: 'rtf', html: '<pre>' + plain.replace(/</g, '&lt;') + '</pre>', text: plain }
  }
  if (inputFormat === 'rst') {
    var rstHtml = rstToHtml(text)
    return { format: 'rst', html: rstHtml, text: text }
  }
  if (inputFormat === 'csv') {
    return { format: 'csv', text: text, html: '' }
  }
  if (inputFormat === 'json') {
    return { format: 'json', text: text, json: JSON.parse(text), html: '' }
  }
  return { format: 'txt', text: text, html: '<pre>' + text.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre>' }
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
}

function setStatus(message, isError) {
  var el = document.getElementById('dc-status')
  el.textContent = message || ''
  el.classList.toggle('dc-status-error', !!isError)
}

function showPreview(result, outputFormat) {
  var previewText = document.getElementById('dc-preview-text')
  var previewHtml = document.getElementById('dc-preview-html')
  previewText.style.display = 'none'
  previewHtml.style.display = 'none'

  if (!isPreviewable(outputFormat) || outputFormat === 'pdf') {
    document.getElementById('dc-preview-wrap').style.display = 'none'
    return
  }

  document.getElementById('dc-preview-wrap').style.display = ''

  if (outputFormat === 'html') {
    previewHtml.style.display = ''
    previewHtml.srcdoc = result.content
    return
  }

  previewText.style.display = ''
  previewText.value = result.content
}

async function runConversion() {
  if (!state.parsed || !state.file) return
  var outputFormat = document.getElementById('dc-output').value
  setStatus('Converting…')
  document.getElementById('dc-convert').disabled = true

  try {
    var result = convertContent(state.parsed, outputFormat)
    state.output = { format: outputFormat, result: result }

    if (outputFormat === 'pdf') {
      var renderPdf = await loadHtml2Pdf()
      var frame = document.getElementById('dc-pdf-render')
      frame.srcdoc = result.content
      await new Promise(function (resolve) {
        frame.onload = resolve
        setTimeout(resolve, 500)
      })
      var blob = await renderPdf(frame.contentDocument.body, { scale: 2 })
      state.output.blob = blob
      state.output.result = { type: 'pdf', content: blob }
      document.getElementById('dc-preview-wrap').style.display = 'none'
      setStatus('PDF ready — click Download to save.')
    } else {
      showPreview(result, outputFormat)
      setStatus('Conversion complete.')
    }

    document.getElementById('dc-download').disabled = false
    document.getElementById('dc-copy').disabled = result.type === 'pdf'
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
  state.parsed = null
  state.output = null

  showState('progress')
  setStatus('Reading ' + file.name + '…')

  try {
    state.parsed = await parseInputFile(file, inputFormat)
    document.getElementById('dc-file-name').textContent = file.name
    document.getElementById('dc-file-format').textContent = inputFormat.toUpperCase()
    populateOutputFormats(inputFormat)
    showState('workspace')
    setStatus('')
    document.getElementById('dc-download').disabled = true
    document.getElementById('dc-copy').disabled = true
    document.getElementById('dc-preview-wrap').style.display = 'none'
    await runConversion()
  } catch (err) {
    showState('dropzone')
    setStatus(err.message || 'Failed to read file', true)
  }
}

function downloadOutput() {
  if (!state.output || !state.file) return
  var outputFormat = state.output.format
  var result = state.output.result
  var blob

  if (result.type === 'pdf' && state.output.blob) {
    blob = state.output.blob
  } else {
    blob = new Blob([result.content], { type: getOutputMimeType(outputFormat) })
  }

  var url = URL.createObjectURL(blob)
  var a = document.createElement('a')
  a.href = url
  a.download = buildFilename(state.file.name, outputFormat)
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
    state.parsed = null
    state.output = null
    document.getElementById('dc-file').value = ''
    showState('dropzone')
    setStatus('')
  })

  document.getElementById('dc-copy').addEventListener('click', function () {
    var btn = document.getElementById('dc-copy')
    var text = ''
    if (state.output && state.output.result && state.output.result.type !== 'pdf') {
      text = state.output.result.content
    }
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
