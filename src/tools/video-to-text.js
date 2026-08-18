import {
  validateMediaFile,
  buildAudioExtractArgs,
  normalizeChunks,
  toSRT,
  toVTT,
  toPlainText,
  toParagraphs,
  buildAsrOptions,
  sanitizeVocabulary,
  getOutputFilename,
  LANGUAGES,
  resolveLanguage,
} from './video-to-text-core.js'
import { formatDuration, formatFileSize } from './fps-converter-core.js'

;(function () {
  'use strict'

  var TRANSFORMERS_CDN = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.5'

  // The default WebGPU dtype for Whisper. Whole-model fp16 returns broken/empty
  // output on some GPUs (Apple Metal); fp32 encoder + q4 decoder is reliable and
  // small for tiny/base/small.
  var WEBGPU_DTYPE = { encoder_model: 'fp32', decoder_model_merged: 'q4' }

  var MODELS = {
    tiny: { id: 'Xenova/whisper-tiny', label: 'Fast', size: '~40 MB' },
    base: { id: 'Xenova/whisper-base', label: 'Balanced', size: '~75 MB' },
    small: { id: 'Xenova/whisper-small', label: 'Accurate', size: '~240 MB' },
    // Max: full whisper-large-v3-turbo, WebGPU only (the fp32 encoder is ~2.5 GB,
    // so this tier uses the fp16 encoder + q4 decoder combo the transformers.js
    // turbo demos ship — ~1.6 GB, and far too heavy/slow for the wasm path).
    large: {
      id: 'onnx-community/whisper-large-v3-turbo',
      label: 'Max',
      size: '~1.6 GB',
      webgpuOnly: true,
      webgpuDtype: { encoder_model: 'fp16', decoder_model_merged: 'q4' },
    },
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
  var modelHint = $('vtt-model-hint')
  var vocabInput = $('vtt-vocab')
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
  var transcriberDevice = null
  var webgpuAvailable = false
  var promptSupported = null   // null = untested, true/false once probed

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
      if (btn.disabled) return
      selectedModel = btn.dataset.model
      modelBtns.forEach(function (b) { b.classList.remove('active') })
      btn.classList.add('active')
    })
  })

  // ── WebGPU capability probe — gates the WebGPU-only "Max" model ──
  // The Max button ships disabled in static HTML (no flash, no CLS); we enable it
  // only once an adapter is confirmed. `navigator.gpu` can exist while
  // requestAdapter() returns null (blocklisted GPUs), so probe the adapter.
  async function detectWebGPU() {
    try {
      if (typeof navigator === 'undefined' || !navigator.gpu) return false
      return !!(await navigator.gpu.requestAdapter())
    } catch (_) { return false }
  }
  detectWebGPU().then(function (ok) {
    webgpuAvailable = ok
    if (!ok) return
    modelBtns.forEach(function (b) {
      if (b.dataset.model && MODELS[b.dataset.model] && MODELS[b.dataset.model].webgpuOnly) b.disabled = false
    })
    if (modelHint) modelHint.textContent = 'Max runs on your GPU via WebGPU — large first download, cached afterwards.'
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

  async function loadTranscriber(model, onProgress, forceWasm) {
    var modelId = model.id
    if (transcriber && transcriberModelId === modelId && (!forceWasm || transcriberDevice === 'wasm')) return transcriber
    var mod = await import(/* @vite-ignore */ TRANSFORMERS_CDN + '/dist/transformers.min.js')
    mod.env.allowLocalModels = false
    var device = 'wasm'
    var dtype = 'q8'
    if (!forceWasm) {
      try {
        if (typeof navigator !== 'undefined' && navigator.gpu) {
          var adapter = await navigator.gpu.requestAdapter()
          // NOTE: whole-model fp16 Whisper on WebGPU returns broken/empty output
          // on many GPUs (notably Apple Metal). fp32 encoder + q4 decoder is the
          // config the transformers.js whisper-webgpu demos ship; the Max model
          // overrides it via webgpuDtype (fp16 encoder — its fp32 encoder is ~2.5 GB).
          if (adapter) { device = 'webgpu'; dtype = model.webgpuDtype || WEBGPU_DTYPE }
        }
      } catch (_) { device = 'wasm'; dtype = 'q8' }
    }

    // WebGPU-only models (Max) must never touch the wasm path — that would mean a
    // second multi-hundred-MB download and minutes-per-minute transcription.
    if (model.webgpuOnly && device !== 'webgpu') {
      throw new Error('Max quality needs WebGPU, which this browser does not support. Pick another model.')
    }

    try {
      transcriber = await mod.pipeline('automatic-speech-recognition', modelId, {
        dtype: dtype, device: device, progress_callback: onProgress,
      })
      transcriberDevice = device
    } catch (err) {
      // Fall back to CPU/WASM if WebGPU init fails — but never for webgpuOnly models.
      if (device !== 'wasm' && !model.webgpuOnly) {
        transcriber = await mod.pipeline('automatic-speech-recognition', modelId, {
          dtype: 'q8', device: 'wasm', progress_callback: onProgress,
        })
        transcriberDevice = 'wasm'
      } else {
        throw err
      }
    }
    transcriberModelId = modelId
    return transcriber
  }

  // Best-effort Whisper prompt biasing from the optional vocabulary field.
  // transformers.js 3.7.5 has no WhisperProcessor.get_prompt_ids, so we build the
  // prompt manually: <|startofprev|> followed by the tokenized vocabulary. Any
  // failure (missing special token, API drift) returns null and the feature
  // silently no-ops — it must never break transcription.
  function buildPromptIds(asr, vocab) {
    try {
      var tok = asr && asr.tokenizer
      if (!tok || !vocab) return null
      var sop = null
      if (tok.model && tok.model.tokens_to_ids && typeof tok.model.tokens_to_ids.get === 'function') {
        sop = tok.model.tokens_to_ids.get('<|startofprev|>')
      }
      if (sop == null) return null
      var textIds = tok.encode(' ' + vocab, { add_special_tokens: false })
      if (!textIds || !textIds.length) return null
      var ids = [sop].concat(Array.from(textIds))
      return ids.every(function (n) { return Number.isInteger(n) }) ? ids : null
    } catch (_) { return null }
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
      var sizeNote = model.webgpuOnly ? ' — the Max model is big; cached after first use' : ' (cached after first use)'
      setProgress(35, 'Loading transcription model…', 'Downloading ' + model.size + sizeNote)
      var onModelProgress = function (p) {
        if (p && p.status === 'progress' && typeof p.progress === 'number') {
          setProgress(35 + p.progress * 0.35, null, 'Downloading model… ' + Math.round(p.progress) + '%')
        }
      }
      var asr = await loadTranscriber(model, onModelProgress)

      setProgress(72, 'Transcribing…', 'This runs entirely on your device')
      var language = resolveLanguage(langSelect ? langSelect.value : 'auto')

      // Optional vocabulary biasing (best-effort, feature-detected).
      var vocab = sanitizeVocabulary(vocabInput ? vocabInput.value : '')
      var promptIds = vocab ? buildPromptIds(asr, vocab) : null
      if (vocab && promptSupported === null) promptSupported = promptIds != null

      // Run the pipeline with the enhanced decoder options; if this transformers.js
      // version rejects any of them (or prompt_ids), retry once with the minimal
      // known-good options so a transcription always completes.
      var runAsr = async function (pipe) {
        try {
          return await pipe(audio, buildAsrOptions({ language: language, promptIds: promptIds }))
        } catch (err) {
          console.warn('Enhanced ASR options rejected; retrying with minimal options.', err)
          return await pipe(audio, buildAsrOptions({ language: language }))
        }
      }

      var output = await runAsr(asr)

      chunks = normalizeChunks(output.chunks || [])
      if (chunks.length === 0 && output.text) {
        chunks = [{ start: 0, end: 0, text: output.text.trim() }]
      }

      // A GPU backend can occasionally return an empty transcription for audio
      // that clearly contains speech. Before reporting "no speech", retry once on
      // the reliable CPU/WASM path — except for WebGPU-only models, which cannot
      // run on wasm.
      if (chunks.length === 0 && transcriberDevice !== 'wasm' && !model.webgpuOnly) {
        setProgress(72, 'Retrying on CPU…', 'The GPU returned no text — using the reliable engine')
        var asrCpu = await loadTranscriber(model, onModelProgress, true)
        setProgress(72, 'Transcribing…', 'This runs entirely on your device')
        promptIds = vocab ? buildPromptIds(asrCpu, vocab) : null
        output = await runAsr(asrCpu)
        chunks = normalizeChunks(output.chunks || [])
        if (chunks.length === 0 && output.text) {
          chunks = [{ start: 0, end: 0, text: output.text.trim() }]
        }
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
    return toParagraphs(chunks)
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
