// Describe Video with AI — samples frames from a local video and captions
// each one with an on-device vision model. Nothing is uploaded.
//
// Model strategy (mirrors alt-text-generator.js, which established the
// in-browser transformers.js pattern):
//   - WebGPU available  → Florence-2 base (rich detailed captions)
//   - No WebGPU (wasm)  → ViT-GPT2 (short captions, works everywhere)
// The model only loads after the user clicks "Describe" — page stays light.
import {
  frameTimesForDuration,
  isTruncated,
  formatTimestamp,
  cleanCaption,
  buildPlainText,
  buildVtt,
  buildSrt,
  baseName,
} from './describe-video-core.js'

;(function () {
  'use strict'

  var TRANSFORMERS_CDN = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.4.1'
  var FLORENCE_MODEL = 'onnx-community/Florence-2-base-ft'
  var FLORENCE_TASK = '<DETAILED_CAPTION>'
  var VIT_MODEL = 'Xenova/vit-gpt2-image-captioning'
  var MAX_FRAMES = 150
  var CAPTION_WIDTH = 512 // frames are downscaled to this before captioning
  var THUMB_WIDTH = 160

  var dropzone = document.getElementById('dv-dropzone')
  var fileInput = document.getElementById('dv-file')
  var settingsEl = document.getElementById('dv-settings')
  var videoPreview = document.getElementById('dv-video-preview')
  var intervalSelect = document.getElementById('dv-interval')
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
  var results = [] // { time, text }
  var stopRequested = false
  var engine = null // { kind: 'florence' | 'vit', ... }
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
      ? 'Your browser supports WebGPU — the Florence-2 model will generate detailed descriptions.'
      : 'No WebGPU detected — a lighter model will be used (shorter captions). Chrome or Edge on desktop gives the best results.'
  })

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

    if (await hasWebGPU()) {
      try {
        var model = await transformers.Florence2ForConditionalGeneration.from_pretrained(FLORENCE_MODEL, {
          dtype: {
            embed_tokens: 'fp16',
            vision_encoder: 'fp16',
            encoder_model: 'q4',
            decoder_model_merged: 'q4',
          },
          device: 'webgpu',
          progress_callback: onDownloadProgress,
        })
        var processor = await transformers.AutoProcessor.from_pretrained(FLORENCE_MODEL)
        var tokenizer = await transformers.AutoTokenizer.from_pretrained(FLORENCE_MODEL)
        engine = {
          kind: 'florence',
          RawImage: transformers.RawImage,
          model: model,
          processor: processor,
          tokenizer: tokenizer,
        }
        return engine
      } catch (e) {
        // WebGPU init can fail on some GPUs — fall through to wasm.
        console.warn('Florence-2/WebGPU failed, falling back to wasm model:', e)
      }
    }

    var captioner = await transformers.pipeline('image-to-text', VIT_MODEL, {
      device: 'wasm',
      progress_callback: onDownloadProgress,
    })
    engine = { kind: 'vit', captioner: captioner }
    return engine
  }

  async function captionCanvas(canvas) {
    var dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    if (engine.kind === 'florence') {
      var image = await engine.RawImage.fromURL(dataUrl)
      var prompts = engine.processor.construct_prompts(FLORENCE_TASK)
      var textInputs = engine.tokenizer(prompts)
      var visionInputs = await engine.processor(image)
      var generatedIds = await engine.model.generate(
        Object.assign({}, textInputs, visionInputs, { max_new_tokens: 128 })
      )
      var raw = engine.tokenizer.batch_decode(generatedIds, { skip_special_tokens: false })[0]
      var post = engine.processor.post_process_generation(raw, FLORENCE_TASK, image.size)
      return post[FLORENCE_TASK] || ''
    }
    var out = await engine.captioner(dataUrl)
    return out && out[0] ? out[0].generated_text : ''
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
    timelineEl.innerHTML = ''
    showState('progress')

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

  function appendTimelineItem(video, time, caption) {
    var item = document.createElement('div')
    item.className = 'dv-item'

    var thumb = drawFrame(video, THUMB_WIDTH)
    thumb.className = 'dv-item-thumb'

    var body = document.createElement('div')
    body.className = 'dv-item-body'

    var ts = document.createElement('span')
    ts.className = 'dv-item-time'
    ts.textContent = formatTimestamp(time)

    var text = document.createElement('p')
    text.className = 'dv-item-text'
    text.textContent = caption

    body.appendChild(ts)
    body.appendChild(text)
    item.appendChild(thumb)
    item.appendChild(body)
    timelineEl.appendChild(item)
  }

  function updateTranscript() {
    transcriptEl.value = buildPlainText(results)
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

  downloadTxtBtn.addEventListener('click', function () {
    if (results.length) download(buildPlainText(results), '.txt', 'text/plain')
  })
  downloadVttBtn.addEventListener('click', function () {
    if (results.length) download(buildVtt(results, videoDuration), '.vtt', 'text/vtt')
  })
  downloadSrtBtn.addEventListener('click', function () {
    if (results.length) download(buildSrt(results, videoDuration), '.srt', 'text/plain')
  })

  newBtn.addEventListener('click', function () {
    runId++ // cancel any in-flight describe loop
    stopRequested = true
    results = []
    timelineEl.innerHTML = ''
    transcriptEl.value = ''
    fileInput.value = ''
    if (videoUrl) { URL.revokeObjectURL(videoUrl); videoUrl = null }
    currentFile = null
    stopBtn.style.display = 'none'
    showState('dropzone')
  })
})()
