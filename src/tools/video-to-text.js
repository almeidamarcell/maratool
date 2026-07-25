import {
  validateMediaFile,
  buildAudioExtractArgs,
  normalizeChunks,
  toSRT,
  toVTT,
  toPlainText,
  getOutputFilename,
  LANGUAGES,
  resolveLanguage,
} from './video-to-text-core.js'
import { formatDuration, formatFileSize } from './fps-converter-core.js'

;(function () {
  'use strict'

  var TRANSFORMERS_CDN = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.5'

  var MODELS = {
    tiny: { id: 'Xenova/whisper-tiny', label: 'Fast', size: '~40 MB' },
    base: { id: 'Xenova/whisper-base', label: 'Balanced', size: '~75 MB' },
    small: { id: 'Xenova/whisper-small', label: 'Accurate', size: '~240 MB' },
  }

  // ── DOM refs ──
  function $(id) { return document.getElementById(id) }
  var dropzone = $('vtt-dropzone')
  var fileInput = $('vtt-file-input')
  var infoEl = $('vtt-info')
  var settingsEl = $('vtt-settings')
  var mediaEl = $('vtt-media')
  var durationEl = $('vtt-duration')
  var filesizeEl = $('vtt-filesize')
  var langSelect = $('vtt-language')
  var modelBtns = document.querySelectorAll('.vtt-model-btn')
  var transcribeBtn = $('vtt-transcribe')
  var changeBtn = $('vtt-change')
  var progressEl = $('vtt-progress')
  var progressText = $('vtt-progress-text')
  var progressFill = $('vtt-progress-fill')
  var progressDetail = $('vtt-progress-detail')
  var errorEl = $('vtt-error')
  var errorText = $('vtt-error-text')
  var errorRetry = $('vtt-error-retry')
  var resultEl = $('vtt-result')
  var resultStats = $('vtt-result-stats')
  var formatBtns = document.querySelectorAll('.vtt-format-btn')
  var outputArea = $('vtt-output')
  var copyBtn = $('vtt-copy')
  var downloadBtn = $('vtt-download')
  var newBtn = $('vtt-new')

  // ── State ──
  var currentFile = null
  var previewUrl = null
  var selectedModel = 'base'
  var chunks = []
  var currentFormat = 'txt'
  var ffmpeg = null
  var ffmpegLoaded = false
  var fetchFile = null
  var transcriber = null
  var transcriberModelId = null

  // ── Populate language dropdown ──
  if (langSelect) {
    LANGUAGES.forEach(function (l) {
      var opt = document.createElement('option')
      opt.value = l.code
      opt.textContent = l.label
      langSelect.appendChild(opt)
    })
    langSelect.value = 'auto'
  }

  // ── State machine ──
  function showState(state) {
    dropzone.style.display = state === 'dropzone' ? '' : 'none'
    infoEl.style.display = state === 'dropzone' ? '' : 'none'
    settingsEl.style.display = state === 'settings' ? '' : 'none'
    progressEl.style.display = state === 'progress' ? '' : 'none'
    errorEl.style.display = state === 'error' ? '' : 'none'
    resultEl.style.display = state === 'result' ? '' : 'none'
  }
  function showError(msg) { errorText.textContent = msg; showState('error') }
  function setProgress(pct, text, detail) {
    if (text != null) progressText.textContent = text
    if (pct != null) progressFill.style.width = Math.max(0, Math.min(100, pct)) + '%'
    if (detail != null) progressDetail.textContent = detail
  }

  // ── Dropzone wiring ──
  dropzone.addEventListener('click', function () { fileInput.click() })
  dropzone.addEventListener('dragover', function (e) { e.preventDefault(); dropzone.classList.add('drag-over') })
  dropzone.addEventListener('dragleave', function () { dropzone.classList.remove('drag-over') })
  dropzone.addEventListener('drop', function (e) {
    e.preventDefault(); dropzone.classList.remove('drag-over')
    if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0])
  })
  fileInput.addEventListener('change', function () {
    if (fileInput.files.length > 0) handleFile(fileInput.files[0])
  })

  function handleFile(file) {
    var v = validateMediaFile(file)
    if (!v.valid) { showError(v.error); return }
    currentFile = file
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    previewUrl = URL.createObjectURL(file)
    mediaEl.src = previewUrl
    filesizeEl.textContent = formatFileSize(file.size)
    durationEl.textContent = '...'
    mediaEl.onloadedmetadata = function () {
      durationEl.textContent = formatDuration(mediaEl.duration)
    }
    showState('settings')
  }

  // ── Model selector ──
  modelBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      selectedModel = btn.dataset.model
      modelBtns.forEach(function (b) { b.classList.remove('active') })
      btn.classList.add('active')
    })
  })

  // ── Lazy loaders ──
  async function loadFfmpeg() {
    if (ffmpeg && ffmpegLoaded) return ffmpeg
    setProgress(0, 'Loading audio engine…', 'Downloading FFmpeg (~25 MB, cached after first use)')
    var loader = await import('./ffmpeg-loader.js')
    var result = await loader.loadFFmpeg(function (pct, detail) {
      setProgress(pct * 0.2, null, detail)
    })
    ffmpeg = result.ff
    fetchFile = result.fetchFile
    ffmpegLoaded = true
    return ffmpeg
  }

  async function loadTranscriber(modelId, onProgress) {
    if (transcriber && transcriberModelId === modelId) return transcriber
    var mod = await import(/* @vite-ignore */ TRANSFORMERS_CDN + '/dist/transformers.min.js')
    mod.env.allowLocalModels = false
    var device = 'wasm'
    var dtype = 'q8'
    try {
      if (typeof navigator !== 'undefined' && navigator.gpu) {
        var adapter = await navigator.gpu.requestAdapter()
        if (adapter) { device = 'webgpu'; dtype = 'fp16' }
      }
    } catch (_) { device = 'wasm'; dtype = 'q8' }

    try {
      transcriber = await mod.pipeline('automatic-speech-recognition', modelId, {
        dtype: dtype, device: device, progress_callback: onProgress,
      })
    } catch (err) {
      // Fall back to CPU/WASM if WebGPU init fails on this device.
      if (device !== 'wasm') {
        transcriber = await mod.pipeline('automatic-speech-recognition', modelId, {
          dtype: 'q8', device: 'wasm', progress_callback: onProgress,
        })
      } else {
        throw err
      }
    }
    transcriberModelId = modelId
    return transcriber
  }

  // ── Extract 16 kHz mono audio → Float32Array ──
  async function extractAudio(file) {
    var ff = await loadFfmpeg()
    setProgress(22, 'Extracting audio…', 'Reading file into memory')
    var inName = 'input' + getExt(file.name)
    var outName = 'audio.wav'
    var data = await fetchFile(file)
    await ff.writeFile(inName, data)
    var args = buildAudioExtractArgs(inName, outName)
    var ret = await ff.exec(args)
    if (ret !== 0) throw new Error('Could not extract audio from this file.')
    var wav = await ff.readFile(outName)
    try { await ff.deleteFile(inName) } catch (_) {}
    try { await ff.deleteFile(outName) } catch (_) {}

    setProgress(30, 'Decoding audio…', null)
    var AudioCtx = window.AudioContext || window.webkitAudioContext
    var ctx = new AudioCtx({ sampleRate: 16000 })
    var buf = wav.buffer.slice(wav.byteOffset, wav.byteOffset + wav.byteLength)
    var audioBuffer = await ctx.decodeAudioData(buf)
    var pcm = audioBuffer.getChannelData(0)
    try { ctx.close() } catch (_) {}
    return pcm
  }

  // ── Transcribe ──
  transcribeBtn.addEventListener('click', async function () {
    if (!currentFile) return
    try {
      showState('progress')
      setProgress(0, 'Starting…', null)

      var audio = await extractAudio(currentFile)

      var model = MODELS[selectedModel] || MODELS.base
      setProgress(35, 'Loading transcription model…', 'Downloading ' + model.size + ' (cached after first use)')
      var asr = await loadTranscriber(model.id, function (p) {
        if (p && p.status === 'progress' && typeof p.progress === 'number') {
          setProgress(35 + p.progress * 0.35, null, 'Downloading model… ' + Math.round(p.progress) + '%')
        }
      })

      setProgress(72, 'Transcribing…', 'This runs entirely on your device')
      var language = resolveLanguage(langSelect ? langSelect.value : 'auto')
      var output = await asr(audio, {
        return_timestamps: true,
        chunk_length_s: 30,
        stride_length_s: 5,
        task: 'transcribe',
        language: language,
      })

      chunks = normalizeChunks(output.chunks || [])
      if (chunks.length === 0 && output.text) {
        chunks = [{ start: 0, end: 0, text: output.text.trim() }]
      }
      if (chunks.length === 0) throw new Error('No speech detected in this file.')

      renderResult()
      showState('result')
    } catch (err) {
      console.error('Transcription failed:', err)
      showError('Transcription failed: ' + (err.message || String(err)).split('\n')[0])
    }
  })

  // ── Output formatting ──
  function currentText() {
    if (currentFormat === 'srt') return toSRT(chunks)
    if (currentFormat === 'vtt') return toVTT(chunks)
    return toPlainText(chunks)
  }

  function renderResult() {
    var words = toPlainText(chunks).split(/\s+/).filter(Boolean).length
    resultStats.innerHTML = '<strong>' + words + '</strong> words · <strong>' + chunks.length + '</strong> segments'
    outputArea.value = currentText()
  }

  formatBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      currentFormat = btn.dataset.format
      formatBtns.forEach(function (b) { b.classList.remove('active') })
      btn.classList.add('active')
      outputArea.value = currentText()
    })
  })

  copyBtn.addEventListener('click', function () {
    navigator.clipboard.writeText(outputArea.value).then(function () {
      var orig = copyBtn.textContent
      copyBtn.textContent = 'Copied!'
      setTimeout(function () { copyBtn.textContent = orig }, 2000)
    })
  })

  downloadBtn.addEventListener('click', function () {
    var blob = new Blob([currentText()], { type: 'text/plain;charset=utf-8' })
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a')
    a.href = url
    a.download = getOutputFilename(currentFile ? currentFile.name : '', currentFormat)
    a.click()
    setTimeout(function () { URL.revokeObjectURL(url) }, 1000)
  })

  // ── Reset ──
  function reset() {
    fileInput.value = ''
    currentFile = null
    chunks = []
    currentFormat = 'txt'
    formatBtns.forEach(function (b, i) { b.classList.toggle('active', i === 0) })
    if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = null }
    showState('dropzone')
  }
  changeBtn.addEventListener('click', reset)
  newBtn.addEventListener('click', reset)
  errorRetry.addEventListener('click', function () {
    if (currentFile) showState('settings'); else reset()
  })

  function getExt(name) {
    var dot = name.lastIndexOf('.')
    return dot === -1 ? '.mp4' : name.substring(dot)
  }

  showState('dropzone')
})()
