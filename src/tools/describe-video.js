// Describe Video with AI — samples frames from a local video and captions
// each one with an on-device vision model. Nothing is uploaded.
//
// Model strategy (mirrors alt-text-generator.js, which established the
// in-browser transformers.js pattern):
//   - WebGPU available  → SmolVLM-500M (promptable: user context steers it)
//   - No WebGPU (wasm)  → ViT-GPT2 (short captions, works everywhere)
// The model only loads after the user clicks "Describe" — page stays light.
import {
  frameTimesForDuration,
  isTruncated,
  formatTimestamp,
  cleanCaption,
  baseName,
  mergeTimeline,
  buildCombinedPlainText,
  buildCombinedVtt,
  buildCombinedSrt,
} from './describe-video-core.js'
import { buildAudioExtractArgs, normalizeChunks } from './video-to-text-core.js'
import { isNonSpeechCue, buildVlmPrompt } from './describe-video-core.js'

;(function () {
  'use strict'

  // Same transformers.js build video-to-text runs in production.
  var TRANSFORMERS_CDN = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.5/dist/transformers.min.js'
  // Promptable VLM: accepts free-text instructions, so user context ("this is
  // a padel match") steers the description. Florence-2 only takes fixed task
  // tokens and can't be steered — that's why it was replaced.
  var VLM_MODEL = 'HuggingFaceTB/SmolVLM-500M-Instruct'
  var VIT_MODEL = 'Xenova/vit-gpt2-image-captioning'
  var WHISPER_MODEL = 'Xenova/whisper-base'
  var MAX_FRAMES = 150
  var CAPTION_WIDTH = 512 // frames are downscaled to this before captioning
  var THUMB_WIDTH = 160

  var dropzone = document.getElementById('dv-dropzone')
  var fileInput = document.getElementById('dv-file')
  var settingsEl = document.getElementById('dv-settings')
  var videoPreview = document.getElementById('dv-video-preview')
  var intervalSelect = document.getElementById('dv-interval')
  var audioCheckbox = document.getElementById('dv-audio')
  var contextInput = document.getElementById('dv-context')
  var modelNote = document.getElementById('dv-model-note')
  var frameEstimate = document.getElementById('dv-frame-estimate')
  var engineNote = document.getElementById('dv-engine-note')
  var describeBtn = document.getElementById('dv-describe')
  var progressEl = document.getElementById('dv-progress')
  var progressText = document.getElementById('dv-progress-text')
  var progressBar = document.getElementById('dv-progress-bar')
  var stopBtn = document.getElementById('dv-stop')
  var resultEl = document.getElementById('dv-result')
  var timelineEl = document.getElementById('dv-timeline')
  var transcriptEl = document.getElementById('dv-transcript')
  var copyBtn = document.getElementById('dv-copy')
  var downloadTxtBtn = document.getElementById('dv-download-txt')
  var downloadVttBtn = document.getElementById('dv-download-vtt')
  var downloadSrtBtn = document.getElementById('dv-download-srt')
  var newBtn = document.getElementById('dv-new')
  var errorEl = document.getElementById('dv-error')
  var errorText = document.getElementById('dv-error-text')

  var currentFile = null
  var videoUrl = null
  var videoDuration = 0
  var results = [] // visual: { time, text }
  var speechSegments = [] // Whisper: { start, end, text }
  var stopRequested = false
  var engine = null // { kind: 'smolvlm' | 'vit', ..., loadError? }
  var transcriber = null // Whisper pipeline, cached across runs
  var ffmpegBundle = null // { ff, fetchFile }
  // Incremented on every run start AND on "New video" — a describe loop
  // compares its captured value against this and bails if it went stale,
  // so resetting mid-run actually cancels the run.
  var runId = 0

  function showState(state) {
    dropzone.style.display = state === 'dropzone' ? '' : 'none'
    settingsEl.style.display = state === 'settings' ? '' : 'none'
    progressEl.style.display = state === 'progress' ? '' : 'none'
    resultEl.style.display = state === 'result' ? '' : 'none'
    errorEl.style.display = 'none'
  }

  function showError(message) {
    errorText.textContent = message
    errorEl.style.display = ''
  }

  // ── Upload ──
  dropzone.addEventListener('click', function () { fileInput.click() })
  fileInput.addEventListener('change', function (e) {
    if (e.target.files[0]) loadVideo(e.target.files[0])
  })
  dropzone.addEventListener('dragover', function (e) {
    e.preventDefault()
    dropzone.classList.add('dropzone-active')
  })
  dropzone.addEventListener('dragleave', function () {
    dropzone.classList.remove('dropzone-active')
  })
  dropzone.addEventListener('drop', function (e) {
    e.preventDefault()
    dropzone.classList.remove('dropzone-active')
    var file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('video/')) loadVideo(file)
  })

  // MediaRecorder-produced WebMs (browser screen recordings) report
  // duration=Infinity at loadedmetadata. Seeking to a huge time forces the
  // browser to resolve the real duration ("durationchange" fires).
  function resolveDuration(video) {
    return new Promise(function (resolve) {
      if (Number.isFinite(video.duration)) { resolve(video.duration); return }
      var settled = false
      var finish = function () {
        if (settled) return
        settled = true
        video.removeEventListener('durationchange', onChange)
        video.currentTime = 0
        resolve(video.duration) // may still be non-finite — caller validates
      }
      var onChange = function () {
        if (Number.isFinite(video.duration)) finish()
      }
      video.addEventListener('durationchange', onChange)
      video.currentTime = Number.MAX_SAFE_INTEGER
      setTimeout(finish, 3000)
    })
  }

  function loadVideo(file) {
    currentFile = file
    if (videoUrl) URL.revokeObjectURL(videoUrl)
    videoUrl = URL.createObjectURL(file)
    videoPreview.src = videoUrl
    videoPreview.onloadedmetadata = function () {
      resolveDuration(videoPreview).then(function (duration) {
        if (!Number.isFinite(duration) || !(duration > 0)) {
          showState('dropzone')
          showError('Could not read the video duration. Try re-encoding the file as MP4.')
          return
        }
        videoDuration = duration
        updateFrameEstimate()
        showState('settings')
      })
    }
    videoPreview.onerror = function () {
      showState('dropzone')
      showError('Could not read this video. Try MP4, WebM, or MOV.')
    }
  }

  function updateFrameEstimate() {
    var interval = parseFloat(intervalSelect.value)
    var times = frameTimesForDuration(videoDuration, interval, MAX_FRAMES)
    var msg = times.length + ' frames will be described (video is ' + formatTimestamp(videoDuration) + ')'
    if (isTruncated(videoDuration, interval, MAX_FRAMES)) {
      msg += ' — capped at ' + MAX_FRAMES + ' frames; use a longer interval for full coverage'
    }
    frameEstimate.textContent = msg
  }

  intervalSelect.addEventListener('change', updateFrameEstimate)

  // ── Engine detection note ──
  async function hasWebGPU() {
    try {
      if (!navigator.gpu) return false
      var adapter = await navigator.gpu.requestAdapter()
      return !!adapter
    } catch (e) {
      return false
    }
  }

  hasWebGPU().then(function (ok) {
    engineNote.textContent = ok
      ? 'Your browser supports WebGPU — the SmolVLM model will generate detailed, context-aware descriptions (~400 MB one-time download, cached after that).'
      : 'No WebGPU detected — a lighter model will be used (~50 MB download, shorter generic captions, slower; the context field is ignored). Chrome or Edge on desktop gives the best results.'
  })

  // Persistent record of which model produced the current results — shown in
  // the result state so it's still visible during/after the run.
  function setModelNote() {
    if (!modelNote || !engine) return
    if (engine.kind === 'smolvlm') {
      modelNote.textContent = 'Described with SmolVLM (WebGPU)' +
        (contextValue() ? ' — using your context: "' + contextValue() + '"' : '')
    } else {
      var reason = engine.loadError
        ? 'the WebGPU model failed to load (' + engine.loadError + ')'
        : 'no WebGPU in this browser'
      modelNote.textContent = 'Described with ViT-GPT2, the lightweight fallback — ' + reason +
        '. Captions are shorter and generic; the context field is ignored. Chrome or Edge on desktop gives the richer model.'
    }
  }

  function contextValue() {
    return contextInput ? contextInput.value.replace(/\s+/g, ' ').trim() : ''
  }

  // ── Model loading ──
  function onDownloadProgress(progress) {
    if (progress.status === 'progress' && progress.progress) {
      var pct = Math.round(progress.progress)
      progressBar.style.width = pct + '%'
      progressText.textContent = 'Downloading AI model… ' + pct + '% (one-time, cached after this)'
    }
  }

  async function loadEngine() {
    if (engine) return engine
    progressText.textContent = 'Loading AI model (first use downloads it — this can take a minute)…'
    progressBar.style.width = '0%'

    var transformers = await import(/* @vite-ignore */ TRANSFORMERS_CDN)
    transformers.env.allowLocalModels = false

    var webgpuError = null
    if (await hasWebGPU()) {
      try {
        var processor = await transformers.AutoProcessor.from_pretrained(VLM_MODEL)
        var model = await transformers.AutoModelForVision2Seq.from_pretrained(VLM_MODEL, {
          dtype: {
            embed_tokens: 'fp16',
            vision_encoder: 'q4',
            decoder_model_merged: 'q4',
          },
          device: 'webgpu',
          progress_callback: onDownloadProgress,
        })
        engine = {
          kind: 'smolvlm',
          RawImage: transformers.RawImage,
          model: model,
          processor: processor,
        }
        return engine
      } catch (e) {
        // WebGPU init can fail on some GPUs — fall through to wasm, but keep
        // the reason so the result note can surface it instead of hiding it.
        webgpuError = (e && e.message ? e.message : String(e)).split('\n')[0].slice(0, 120)
        console.warn('SmolVLM/WebGPU failed, falling back to wasm model:', e)
      }
    }

    var captioner = await transformers.pipeline('image-to-text', VIT_MODEL, {
      device: 'wasm',
      progress_callback: onDownloadProgress,
    })
    engine = { kind: 'vit', captioner: captioner, loadError: webgpuError }
    return engine
  }

  // ── Speech transcription (opt-in) ──
  // Whisper runs on wasm deliberately even when WebGPU exists: the vision
  // model already occupies the GPU, and holding two models in VRAM risks OOM
  // on 8 GB machines. Sequential + wasm keeps the memory budget predictable.
  async function loadTranscriber() {
    if (transcriber) return transcriber
    var transformers = await import(/* @vite-ignore */ TRANSFORMERS_CDN)
    transcriber = await transformers.pipeline('automatic-speech-recognition', WHISPER_MODEL, {
      dtype: 'q8',
      device: 'wasm',
      progress_callback: function (p) {
        if (p.status === 'progress' && p.progress) {
          progressText.textContent = 'Downloading speech model… ' + Math.round(p.progress) + '% (one-time, cached)'
          progressBar.style.width = Math.round(p.progress) + '%'
        }
      },
    })
    return transcriber
  }

  async function extractAudioPcm(file) {
    if (!ffmpegBundle) {
      progressText.textContent = 'Loading audio engine… (~25 MB, cached after first use)'
      var loader = await import('./ffmpeg-loader.js')
      var result = await loader.loadFFmpeg(function (pct, detail) {
        if (detail) progressText.textContent = detail
      })
      ffmpegBundle = { ff: result.ff, fetchFile: result.fetchFile }
    }
    progressText.textContent = 'Extracting audio…'
    var ff = ffmpegBundle.ff
    var dot = file.name.lastIndexOf('.')
    var inName = 'input' + (dot === -1 ? '.mp4' : file.name.substring(dot))
    var outName = 'audio.wav'
    await ff.writeFile(inName, await ffmpegBundle.fetchFile(file))
    var ret = await ff.exec(buildAudioExtractArgs(inName, outName))
    if (ret !== 0) throw new Error('no audio track')
    var wav = await ff.readFile(outName)
    try { await ff.deleteFile(inName) } catch (e) {}
    try { await ff.deleteFile(outName) } catch (e) {}

    var AudioCtx = window.AudioContext || window.webkitAudioContext
    var ctx = new AudioCtx({ sampleRate: 16000 })
    var buf = wav.buffer.slice(wav.byteOffset, wav.byteOffset + wav.byteLength)
    var audioBuffer = await ctx.decodeAudioData(buf)
    var pcm = audioBuffer.getChannelData(0)
    try { ctx.close() } catch (e) {}
    return pcm
  }

  // Returns Whisper segments, or [] if the video has no usable speech.
  // A failure here must never abort the visual run.
  async function transcribeSpeech(file) {
    try {
      var pcm = await extractAudioPcm(file)
      var asr = await loadTranscriber()
      progressText.textContent = 'Transcribing speech… (runs on your device)'
      progressBar.style.width = '100%'
      var output = await asr(pcm, {
        return_timestamps: true,
        chunk_length_s: 30,
        stride_length_s: 5,
        task: 'transcribe',
      })
      var chunks = normalizeChunks(output.chunks || [])
      if (chunks.length === 0 && output.text && output.text.trim()) {
        chunks = [{ start: 0, end: videoDuration, text: output.text.trim() }]
      }
      // Drop pure non-speech annotations ("[Music]", "(applause)", "♪").
      return chunks.filter(function (c) { return !isNonSpeechCue(c.text) })
    } catch (e) {
      console.warn('Speech transcription skipped:', e)
      return []
    }
  }

  async function captionCanvas(canvas) {
    var dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    if (engine.kind === 'smolvlm') {
      var image = await engine.RawImage.fromURL(dataUrl)
      var messages = [{
        role: 'user',
        content: [
          { type: 'image' },
          { type: 'text', text: buildVlmPrompt(contextValue()) },
        ],
      }]
      var prompt = engine.processor.apply_chat_template(messages, { add_generation_prompt: true })
      var inputs = await engine.processor(prompt, image)
      var generatedIds = await engine.model.generate(
        Object.assign({}, inputs, { max_new_tokens: 128 })
      )
      // Decode only the newly generated tokens, not the echoed prompt.
      var newTokens = generatedIds.slice(null, [inputs.input_ids.dims.at(-1), null])
      var out = engine.processor.batch_decode(newTokens, { skip_special_tokens: true })[0]
      return (out || '').trim()
    }
    var out2 = await engine.captioner(dataUrl)
    return out2 && out2[0] ? out2[0].generated_text : ''
  }

  // ── Frame extraction ──
  var SEEK_TIMEOUT_MS = 10000

  function seekTo(video, time) {
    return new Promise(function (resolve, reject) {
      var cleanup = function () {
        clearTimeout(timer)
        video.removeEventListener('seeked', onSeeked)
        video.removeEventListener('error', onError)
      }
      var onSeeked = function () { cleanup(); resolve() }
      var onError = function () { cleanup(); reject(new Error('Seek failed at ' + time + 's')) }
      // A corrupt segment can leave "seeked" unfired forever — fail loudly
      // instead of hanging the whole run.
      var timer = setTimeout(function () {
        cleanup()
        reject(new Error('Timed out seeking to ' + time + 's'))
      }, SEEK_TIMEOUT_MS)
      video.addEventListener('seeked', onSeeked)
      video.addEventListener('error', onError)
      video.currentTime = time
    })
  }

  function drawFrame(video, width) {
    var scale = Math.min(1, width / video.videoWidth)
    var canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale))
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale))
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
    return canvas
  }

  // ── Main run ──
  describeBtn.addEventListener('click', async function () {
    var myRun = ++runId
    stopRequested = false
    results = []
    speechSegments = []
    timelineEl.innerHTML = ''
    showState('progress')

    // Phase A (opt-in): transcribe speech BEFORE loading the vision model —
    // sequential keeps peak memory down, and the transcript shows up first.
    if (audioCheckbox && audioCheckbox.checked && currentFile) {
      speechSegments = await transcribeSpeech(currentFile)
      if (myRun !== runId) return
      progressBar.style.width = '0%'
    }

    try {
      await loadEngine()
    } catch (e) {
      showState('settings')
      showError('Could not load the AI model: ' + e.message)
      return
    }
    if (myRun !== runId) return // user reset while the model was loading

    var interval = parseFloat(intervalSelect.value)
    var times = frameTimesForDuration(videoDuration, interval, MAX_FRAMES)
    if (!times.length) {
      showState('settings')
      showError('Could not read the video duration. Try a different file.')
      return
    }

    // Hidden worker video so the visible preview doesn't jump around.
    var video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    video.src = videoUrl
    var metaError = null
    await new Promise(function (resolve) {
      video.onloadedmetadata = resolve
      video.onerror = function () {
        metaError = new Error('Could not decode video')
        resolve()
      }
    })
    if (metaError) {
      showState('settings')
      showError(metaError.message)
      return
    }
    await resolveDuration(video) // MediaRecorder WebM: make worker seekable
    if (myRun !== runId) return

    stopBtn.style.display = ''
    showState('result') // show results streaming in
    progressEl.style.display = '' // keep progress visible alongside
    setModelNote() // persistent record of which model is producing this run

    // Speech segments are fully known now — render them up front; visual
    // items will be inserted between them by timestamp as they stream in.
    speechSegments.forEach(function (seg) {
      timelineEl.appendChild(buildSpeechItem(seg))
    })
    if (audioCheckbox && audioCheckbox.checked && speechSegments.length === 0) {
      var note = document.createElement('p')
      note.className = 'dv-no-speech-note'
      note.textContent = 'No speech detected in this video — showing visual descriptions only.'
      timelineEl.appendChild(note)
    }
    updateTranscript()

    for (var i = 0; i < times.length; i++) {
      if (stopRequested || myRun !== runId) break
      var t = times[i]
      progressText.textContent = 'Describing frame ' + (i + 1) + ' of ' + times.length + ' (' + formatTimestamp(t) + ')…'
      progressBar.style.width = Math.round(((i + 1) / times.length) * 100) + '%'

      try {
        await seekTo(video, t)
        var canvas = drawFrame(video, CAPTION_WIDTH)
        var caption = cleanCaption(await captionCanvas(canvas))
        if (myRun !== runId) break // stale result — user already reset
        if (!caption) caption = '(no description generated)'
        results.push({ time: t, text: caption })
        appendTimelineItem(video, t, caption)
        updateTranscript()
      } catch (e) {
        if (myRun !== runId) break
        results.push({ time: t, text: '(frame could not be described: ' + e.message + ')' })
        updateTranscript()
      }
    }

    // Only touch the UI if this run still owns it.
    if (myRun === runId) {
      progressEl.style.display = 'none'
      stopBtn.style.display = 'none'
    }
    video.removeAttribute('src')
    video.load()
  })

  stopBtn.addEventListener('click', function () {
    stopRequested = true
    stopBtn.disabled = true
    setTimeout(function () { stopBtn.disabled = false }, 500)
  })

  function buildItemBody(time, text, extraTimeClass) {
    var body = document.createElement('div')
    body.className = 'dv-item-body'
    var ts = document.createElement('span')
    ts.className = 'dv-item-time' + (extraTimeClass ? ' ' + extraTimeClass : '')
    ts.textContent = formatTimestamp(time)
    var p = document.createElement('p')
    p.className = 'dv-item-text'
    p.textContent = text
    body.appendChild(ts)
    body.appendChild(p)
    return body
  }

  function buildSpeechItem(seg) {
    var item = document.createElement('div')
    item.className = 'dv-item dv-item-speech'
    item.dataset.time = seg.start
    var icon = document.createElement('span')
    icon.className = 'dv-speech-icon'
    icon.textContent = '🗣'
    icon.setAttribute('aria-label', 'Speech')
    item.appendChild(icon)
    item.appendChild(buildItemBody(seg.start, seg.text, 'dv-item-time-speech'))
    return item
  }

  // Insert visual items at their timestamp position: speech items are
  // pre-rendered, so append before the first sibling with a LATER time
  // (ties keep speech first, matching mergeTimeline's ordering).
  function appendTimelineItem(video, time, caption) {
    var item = document.createElement('div')
    item.className = 'dv-item'
    item.dataset.time = time

    var thumb = drawFrame(video, THUMB_WIDTH)
    thumb.className = 'dv-item-thumb'
    thumb.setAttribute('role', 'img')
    thumb.setAttribute('aria-label', 'Frame at ' + formatTimestamp(time))

    item.appendChild(thumb)
    item.appendChild(buildItemBody(time, caption))

    var siblings = timelineEl.children
    for (var i = 0; i < siblings.length; i++) {
      var st = parseFloat(siblings[i].dataset ? siblings[i].dataset.time : '')
      if (Number.isFinite(st) && st > time) {
        timelineEl.insertBefore(item, siblings[i])
        return
      }
    }
    timelineEl.appendChild(item)
  }

  function updateTranscript() {
    transcriptEl.value = buildCombinedPlainText(mergeTimeline(results, speechSegments))
  }

  // ── Export ──
  copyBtn.addEventListener('click', function () {
    if (!transcriptEl.value) return
    navigator.clipboard.writeText(transcriptEl.value).then(function () {
      copyBtn.textContent = 'Copied!'
      copyBtn.classList.add('copied')
      setTimeout(function () {
        copyBtn.textContent = 'Copy transcript'
        copyBtn.classList.remove('copied')
      }, 2000)
    })
  })

  function download(content, ext, mime) {
    var blob = new Blob([content], { type: mime })
    var a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = baseName(currentFile && currentFile.name) + '-description' + ext
    a.click()
    setTimeout(function () { URL.revokeObjectURL(a.href) }, 1000)
  }

  function merged() {
    return mergeTimeline(results, speechSegments)
  }

  downloadTxtBtn.addEventListener('click', function () {
    var m = merged()
    if (m.length) download(buildCombinedPlainText(m), '.txt', 'text/plain')
  })
  downloadVttBtn.addEventListener('click', function () {
    var m = merged()
    if (m.length) download(buildCombinedVtt(m, videoDuration), '.vtt', 'text/vtt')
  })
  downloadSrtBtn.addEventListener('click', function () {
    var m = merged()
    if (m.length) download(buildCombinedSrt(m, videoDuration), '.srt', 'text/plain')
  })

  newBtn.addEventListener('click', function () {
    runId++ // cancel any in-flight describe loop
    stopRequested = true
    results = []
    speechSegments = []
    timelineEl.innerHTML = ''
    transcriptEl.value = ''
    fileInput.value = ''
    if (videoUrl) { URL.revokeObjectURL(videoUrl); videoUrl = null }
    currentFile = null
    stopBtn.style.display = 'none'
    showState('dropzone')
  })
})()
