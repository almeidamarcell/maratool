import {
  detectExtension,
  getCategory,
  getAvailableOutputs,
  findEngine,
  buildOutputFilename,
  getEngineLabel,
  groupOutputsByCategory,
  canConvert,
} from './vert-converter-core.js'
import {
  detectInputFormat,
  buildFilename,
  isPreviewable,
  wrapHtmlPreview,
  getOutputMimeType as getDocMimeType,
} from './document-converter-core.js'
import { initPandoc, convertDocument, zipWithMedia } from './document-converter-pandoc.js'
import { initMagick, convertImage, svgToPngBlob, getImageMimeType } from './vert-converter-magick.js'
import { convertWithFfmpeg } from './vert-converter-ffmpeg.js'

;(function () {
  'use strict'

  var state = {
    file: null,
    inputExt: '',
    category: '',
    outputExt: '',
    engine: '',
    resultBlob: null,
    resultText: null,
    pandocReady: false,
    magickReady: false,
    ffmpegReady: false,
  }

  var els = {}

  function $(id) { return document.getElementById(id) }

  function setStatus(msg, isError) {
    var el = els.status
    if (!el) return
    el.textContent = msg || ''
    el.className = 'vc-status' + (isError ? ' vc-status-error' : '')
  }

  function showPanel(name) {
    els.dropzone.style.display = name === 'dropzone' ? '' : 'none'
    els.engine.style.display = name === 'engine' ? '' : 'none'
    els.progress.style.display = name === 'progress' ? '' : 'none'
    els.workspace.style.display = name === 'workspace' ? '' : 'none'
  }

  function formatLabel(ext) {
    return ext.replace(/^\./, '').toUpperCase()
  }

  function populateOutputSelect() {
    var outputs = getAvailableOutputs(state.inputExt)
    var groups = groupOutputsByCategory(outputs)
    var select = els.output
    select.innerHTML = ''

    var labels = { image: 'Images', audio: 'Audio', video: 'Video', doc: 'Documents' }
    Object.keys(labels).forEach(function (cat) {
      var items = groups[cat]
      if (!items || !items.length) return
      var og = document.createElement('optgroup')
      og.label = labels[cat]
      items.forEach(function (ext) {
        var opt = document.createElement('option')
        opt.value = ext
        opt.textContent = formatLabel(ext)
        og.appendChild(opt)
      })
      select.appendChild(og)
    })

    if (select.options.length) {
      state.outputExt = select.value
    }
  }

  async function ensureEngine(engine, onProgress) {
    if (engine === 'pandoc') {
      if (!state.pandocReady) {
        els.engineText.textContent = 'Loading Pandoc WASM (~56 MB)…'
        showPanel('engine')
        await initPandoc(function (pct, detail) {
          els.engineText.textContent = detail || 'Loading Pandoc…'
        })
        state.pandocReady = true
      }
      return
    }
    if (engine === 'imagemagick') {
      if (!state.magickReady) {
        els.engineText.textContent = 'Loading ImageMagick WASM (~15 MB)…'
        showPanel('engine')
        await initMagick(function (pct, detail) {
          els.engineText.textContent = detail || 'Loading ImageMagick…'
        })
        state.magickReady = true
      }
      return
    }
    if (engine === 'ffmpeg') {
      if (!state.ffmpegReady) {
        els.engineText.textContent = 'Loading FFmpeg WASM (~25 MB)…'
        showPanel('engine')
        var ffMod = await import('./vert-converter-ffmpeg.js')
        await ffMod.initFfmpeg(function (pct, detail) {
          els.engineText.textContent = detail || 'Loading FFmpeg…'
        })
        state.ffmpegReady = true
      }
    }
  }

  async function handleFile(file) {
    state.file = file
    state.inputExt = detectExtension(file.name)
    state.category = getCategory(state.inputExt)

    if (!state.category) {
      setStatus('Unsupported file type: ' + state.inputExt, true)
      return
    }

    els.fileName.textContent = file.name
    els.fileBadge.textContent = formatLabel(state.inputExt) + ' · ' + state.category
    populateOutputSelect()
    els.download.disabled = true
    els.previewWrap.style.display = 'none'
    state.resultBlob = null
    state.resultText = null
    setStatus('')
    showPanel('workspace')
  }

  async function runConversion() {
    if (!state.file || !els.output.value) return
    state.outputExt = els.output.value
    state.engine = findEngine(state.inputExt, state.outputExt)

    if (!state.engine) {
      setStatus('Cannot convert ' + formatLabel(state.inputExt) + ' → ' + formatLabel(state.outputExt), true)
      return
    }

    els.convert.disabled = true
    els.download.disabled = true
    showPanel('progress')
    els.progressText.textContent = 'Converting with ' + getEngineLabel(state.engine) + '…'

    try {
      await ensureEngine(state.engine)

      if (state.engine === 'pandoc') {
        var inputFmt = detectInputFormat(state.file.name)
        var outputFmt = state.outputExt.replace(/^\./, '')
        var result = await convertDocument(state.file, inputFmt, outputFmt)

        if (result.hasMedia && result.blob) {
          state.resultBlob = await zipWithMedia(result.blob, buildFilename(state.file.name, outputFmt), result.mediaFiles)
        } else if (result.type === 'binary' && result.blob) {
          state.resultBlob = result.blob
        } else {
          state.resultText = result.content
          state.resultBlob = new Blob([result.content], { type: getDocMimeType(outputFmt) })
        }

        if (isPreviewable(outputFmt, result.type === 'binary' && !result.hasMedia)) {
          els.previewWrap.style.display = ''
          if (outputFmt === 'html') {
            els.previewHtml.style.display = ''
            els.previewText.style.display = 'none'
            els.previewHtml.srcdoc = wrapHtmlPreview(result.content || '')
          } else {
            els.previewHtml.style.display = 'none'
            els.previewText.style.display = ''
            els.previewText.value = result.content || ''
          }
        }
      } else if (state.engine === 'imagemagick') {
        var imgFile = state.file
        if (state.inputExt === '.svg') {
          var pngBlob = await svgToPngBlob(state.file)
          imgFile = new File([pngBlob], state.file.name.replace(/\.svg$/i, '.png'), { type: 'image/png' })
          if (state.outputExt === '.png') {
            state.resultBlob = pngBlob
          } else {
            var outBytes = await convertImage(imgFile, '.png', state.outputExt, { quality: 92 })
            state.resultBlob = new Blob([outBytes], { type: getImageMimeType(state.outputExt) })
          }
        } else {
          var converted = await convertImage(imgFile, state.inputExt, state.outputExt, { quality: 92 })
          state.resultBlob = new Blob([converted], { type: getImageMimeType(state.outputExt) })
        }
        if (state.category === 'image' && state.resultBlob.type.startsWith('image/')) {
          els.previewWrap.style.display = ''
          els.previewHtml.style.display = 'none'
          els.previewText.style.display = 'none'
          var imgUrl = URL.createObjectURL(state.resultBlob)
          var prevImg = els.previewImg
          prevImg.src = imgUrl
          prevImg.style.display = ''
        }
      } else if (state.engine === 'ffmpeg') {
        state.resultBlob = await convertWithFfmpeg(
          state.file,
          state.inputExt,
          state.outputExt,
          { quality: '192', sampleRate: 'auto', keepMetadata: false },
        )
      }

      els.download.disabled = false
      setStatus('Done — ' + formatLabel(state.inputExt) + ' → ' + formatLabel(state.outputExt))
      showPanel('workspace')
    } catch (err) {
      console.error(err)
      setStatus((err && err.message) || 'Conversion failed', true)
      showPanel('workspace')
    } finally {
      els.convert.disabled = false
    }
  }

  function downloadResult() {
    if (!state.resultBlob) return
    var isZip = state.resultBlob.type === 'application/zip'
    var outFmt = state.outputExt.replace(/^\./, '')
    var name
    if (state.engine === 'pandoc') {
      name = buildFilename(state.file.name, outFmt, isZip)
    } else {
      name = buildOutputFilename(state.file.name, state.outputExt)
    }
    var a = document.createElement('a')
    a.href = URL.createObjectURL(state.resultBlob)
    a.download = name
    a.click()
    setTimeout(function () { URL.revokeObjectURL(a.href) }, 5000)
  }

  function reset() {
    state.file = null
    els.fileInput.value = ''
    els.download.disabled = true
    els.previewWrap.style.display = 'none'
    setStatus('')
    showPanel('dropzone')
  }

  function init() {
    els.dropzone = $('vc-dropzone')
    els.fileInput = $('vc-file')
    els.engine = $('vc-engine')
    els.engineText = $('vc-engine-text')
    els.progress = $('vc-progress')
    els.progressText = $('vc-progress-text')
    els.workspace = $('vc-workspace')
    els.fileName = $('vc-file-name')
    els.fileBadge = $('vc-file-badge')
    els.output = $('vc-output')
    els.convert = $('vc-convert')
    els.download = $('vc-download')
    els.change = $('vc-change')
    els.status = $('vc-status')
    els.previewWrap = $('vc-preview-wrap')
    els.previewHtml = $('vc-preview-html')
    els.previewText = $('vc-preview-text')
    els.previewImg = $('vc-preview-img')

    els.dropzone.addEventListener('click', function () { els.fileInput.click() })
    els.dropzone.addEventListener('dragover', function (e) {
      e.preventDefault()
      els.dropzone.classList.add('dragover')
    })
    els.dropzone.addEventListener('dragleave', function () {
      els.dropzone.classList.remove('dragover')
    })
    els.dropzone.addEventListener('drop', function (e) {
      e.preventDefault()
      els.dropzone.classList.remove('dragover')
      if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0])
    })
    els.fileInput.addEventListener('change', function () {
      if (els.fileInput.files.length) handleFile(els.fileInput.files[0])
    })
    els.convert.addEventListener('click', runConversion)
    els.download.addEventListener('click', downloadResult)
    els.change.addEventListener('click', reset)
    els.output.addEventListener('change', function () {
      state.outputExt = els.output.value
    })

    showPanel('dropzone')
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
