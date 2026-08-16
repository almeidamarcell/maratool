import { loadFFmpeg } from './ffmpeg-loader.js'
import {
  buildMergeVideosArgs,
  buildImagesToVideoArgs,
  buildVideoFiltersArgs,
  buildVideoStabilizerArgs,
  buildSubtitlesArgs,
  buildInterpolateArgs,
  buildInterpolateGifArgs,
  buildInterpolateGifPaletteArgs,
  buildEqFilterString,
  normalizeVideoFilterOptions,
  getVideoFilterPreset,
  isGifFile,
  VIDEO_FILTER_RANGES,
  getVideoExtOutputFilename,
} from './ezgif-video-ext-core.js'
import { buildMergeAudioArgs, buildAudioDenoiseArgs, buildWaveformImageArgs, getAudioOutputFilename } from './ezgif-audio-core.js'
import {
  buildSrt,
  buildSubtitleStyle,
  formatTimecodeInput,
  normalizeCues,
  parseSubtitleText,
  validateCues,
  SUBTITLE_FONT_NAME,
} from './subtitle-core.js'
import { validateVideoFile, formatFileSize } from './fps-converter-core.js'
import { downloadBlob, setVisible, nextPaint, makeProgress, formatSize } from './tool-utils.js'
import { parseFfmpegTime, formatClock } from './ezgif-ffmpeg-ui.js'

var MAX_BYTES = 200 * 1024 * 1024

// libass in the wasm core has no fontconfig and no built-in face, so burning
// subtitles without shipping it a font produces a clean encode with nothing
// drawn on it. DejaVu Sans is the usual subtitle default and covers Latin,
// Cyrillic and Greek.
var SUBTITLE_FONT_URL = 'https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans.ttf'
var SUBTITLE_FONT_FILE = 'DejaVuSans.ttf'
var PREVIEW_MAX_WIDTH = 480

// Wires the shared progress markup for one of the three tools in this file.
function attachProgress(prefix) {
  var detailEl = document.getElementById(prefix + '-progress-detail')
  var bar = makeProgress(
    document.getElementById(prefix + '-progress-text'),
    document.getElementById(prefix + '-progress-fill')
  )
  bar.detail = function (text) { if (detailEl) detailEl.textContent = text || '' }
  return bar
}

// Loads FFmpeg with the download mapped onto the first half of the bar, and
// keeps the elapsed media time flowing into the detail line while it encodes.
async function loadFFmpegWithProgress(bar) {
  bar.set('Loading FFmpeg…', 0)
  bar.detail('Downloading ~25 MB (cached after first use)')
  var r = await loadFFmpeg(function (pct, detail) {
    bar.set('Loading FFmpeg…', Math.min(pct, 50) / 100)
    if (detail) bar.detail(detail)
  })
  r.ff.on('log', function (e) {
    var secs = parseFfmpegTime(e && e.message)
    if (secs != null) bar.detail(formatClock(secs) + ' processed')
  })
  return r.ff
}

function wireDropzone(dropzone, fileInput, onFiles) {
  dropzone.addEventListener('click', function () { fileInput.click() })
  dropzone.addEventListener('dragover', function (e) {
    e.preventDefault()
    dropzone.classList.add('drag-over')
  })
  dropzone.addEventListener('dragleave', function () { dropzone.classList.remove('drag-over') })
  dropzone.addEventListener('drop', function (e) {
    e.preventDefault()
    dropzone.classList.remove('drag-over')
    if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files)
  })
  fileInput.addEventListener('change', function () {
    if (fileInput.files.length) onFiles(fileInput.files)
  })
}

function buildFfmpegShell(prefix, accept, multi) {
  return (
    '<div class="' + prefix + '-dropzone tool-dropzone" id="' + prefix + '-dropzone">' +
      '<input type="file" id="' + prefix + '-file" hidden accept="' + accept + '" ' + (multi ? 'multiple' : '') + ' />' +
      '<p>Drop file' + (multi ? 's' : '') + ' or click to upload</p>' +
    '</div>' +
    '<div id="' + prefix + '-settings" hidden></div>' +
    '<div id="' + prefix + '-progress" class="tool-progress" hidden><p id="' + prefix + '-progress-text" class="tool-progress-text">Loading FFmpeg…</p><div class="tool-progress-bar"><div id="' + prefix + '-progress-fill" class="tool-progress-fill"></div></div><p id="' + prefix + '-progress-detail" class="tool-progress-detail"></p></div>' +
    '<div id="' + prefix + '-result" hidden><video id="' + prefix + '-video" controls style="max-width:100%;display:none;"></video><img id="' + prefix + '-img" alt="Result preview" style="max-width:100%;display:none;" /><button type="button" class="tool-btn" id="' + prefix + '-download" style="margin-top:1rem;">Download</button></div>' +
    '<p id="' + prefix + '-error" class="tool-error" hidden><span id="' + prefix + '-error-text"></span></p>'
  )
}

export function initFfmpegMergeTool(config) {
  var type = config.type || 'video'
  var suffix = config.suffix || 'merged'
  var prefix = 'fm'
  var root = document.getElementById('ez-root')
  if (!root) return

  var accept = type === 'audio' ? 'audio/*' : 'video/mp4,video/webm,video/quicktime'
  root.innerHTML = buildFfmpegShell(prefix, accept, true)

  var files = []
  var ffmpeg = null
  var resultBlob = null
  var lastPreviewUrl = null
  var resultExt = type === 'audio' ? '.mp3' : '.mp4'

  var dropzone = document.getElementById(prefix + '-dropzone')
  var fileInput = document.getElementById(prefix + '-file')
  var settingsEl = document.getElementById(prefix + '-settings')
  var progressEl = document.getElementById(prefix + '-progress')
  var progress = attachProgress(prefix)
  var resultEl = document.getElementById(prefix + '-result')
  var videoEl = document.getElementById(prefix + '-video')
  var imgEl = document.getElementById(prefix + '-img')
  var downloadBtn = document.getElementById(prefix + '-download')
  var errorEl = document.getElementById(prefix + '-error')
  var errorText = document.getElementById(prefix + '-error-text')

  function showState(s) {
    setVisible(dropzone, s === 'upload')
    setVisible(settingsEl, s === 'settings')
    setVisible(progressEl, s === 'progress')
    setVisible(resultEl, s === 'result')
    setVisible(errorEl, s === 'error')
    if (s !== 'progress') progress.reset()
  }

  function showError(msg) {
    errorText.textContent = msg
    showState('error')
  }

  async function ensureFfmpeg() {
    if (ffmpeg) return
    ffmpeg = await loadFFmpegWithProgress(progress)
  }

  function handleFiles(fl) {
    files = Array.from(fl)
    if (files.length < 2) { showError('Please upload at least 2 files to merge.'); return }
    settingsEl.innerHTML = '<p class="tool-hint">' + files.length + ' files selected.</p><button type="button" class="tool-btn" id="fm-process">Merge</button>'
    document.getElementById('fm-process').addEventListener('click', process)
    showState('settings')
  }

  async function process() {
    progress.set('Loading FFmpeg…', 0)
    progress.detail(files.length + ' files')
    showState('progress')
    await nextPaint()
    try {
      await ensureFfmpeg()
      var listLines = []
      for (var i = 0; i < files.length; i++) {
        // 0.5→0.8 of the bar covers copying the inputs into the FFmpeg FS.
        progress.set('Reading files…', 0.5 + 0.3 * (i / files.length))
        progress.detail(files[i].name + ' · ' + formatSize(files[i].size))
        var name = 'part' + i + (files[i].name.match(/\.[^.]+$/) || ['.bin'])[0]
        var data = new Uint8Array(await files[i].arrayBuffer())
        await ffmpeg.writeFile(name, data)
        listLines.push("file '" + name + "'")
      }
      await ffmpeg.writeFile('list.txt', new TextEncoder().encode(listLines.join('\n')))
      var outputName = 'merged' + resultExt
      var args = type === 'audio'
        ? buildMergeAudioArgs({ listFile: 'list.txt', outputName: outputName })
        : buildMergeVideosArgs({ listFile: 'list.txt', outputName: outputName })
      progress.pending('Merging…')
      await ffmpeg.exec(args)
      progress.set('Finishing…', 0.95)
      progress.detail('')
      var out = await ffmpeg.readFile(outputName)
      resultBlob = new Blob([out.buffer || out], { type: type === 'audio' ? 'audio/mpeg' : 'video/mp4' })
      if (type === 'video') {
        if (lastPreviewUrl) URL.revokeObjectURL(lastPreviewUrl)
        lastPreviewUrl = URL.createObjectURL(resultBlob)
        videoEl.src = lastPreviewUrl
        videoEl.style.display = ''
      }
      showState('result')
    } catch (e) {
      showError(e.message || String(e))
    }
  }

  wireDropzone(dropzone, fileInput, handleFiles)
  downloadBtn.addEventListener('click', function () {
    if (!resultBlob) return
    downloadBlob(resultBlob, type === 'audio' ? getAudioOutputFilename(files[0].name, suffix) : getVideoExtOutputFilename(files[0].name, suffix, resultExt))
  })
  showState('upload')
}

export function initImagesToVideoTool(config) {
  var suffix = config.suffix || 'slideshow'
  var prefix = 'iv'
  var root = document.getElementById('ez-root')
  if (!root) return
  root.innerHTML = buildFfmpegShell(prefix, 'image/*', true)

  var files = []
  var ffmpeg = null
  var resultBlob = null
  var lastPreviewUrl = null

  var dropzone = document.getElementById(prefix + '-dropzone')
  var fileInput = document.getElementById(prefix + '-file')
  var settingsEl = document.getElementById(prefix + '-settings')
  var progressEl = document.getElementById(prefix + '-progress')
  var progress = attachProgress(prefix)
  var resultEl = document.getElementById(prefix + '-result')
  var videoEl = document.getElementById(prefix + '-video')
  var downloadBtn = document.getElementById(prefix + '-download')
  var errorEl = document.getElementById(prefix + '-error')
  var errorText = document.getElementById(prefix + '-error-text')

  function showState(s) {
    setVisible(dropzone, s === 'upload')
    setVisible(settingsEl, s === 'settings')
    setVisible(progressEl, s === 'progress')
    setVisible(resultEl, s === 'result')
    setVisible(errorEl, s === 'error')
    if (s !== 'progress') progress.reset()
  }

  function showError(msg) { errorText.textContent = msg; showState('error') }

  wireDropzone(dropzone, fileInput, handleFiles)

  function handleFiles(fl) {
    files = Array.from(fl)
    settingsEl.innerHTML = '<label class="tool-label" for="iv-fps">FPS</label><input class="tool-input" id="iv-fps" type="number" value="2" min="1" max="30" />' +
      '<button class="tool-btn" id="iv-process" style="margin-top:1rem;">Create video</button>'
    document.getElementById('iv-process').addEventListener('click', process)
    showState('settings')
  }

  async function process() {
    progress.set('Loading FFmpeg…', 0)
    progress.detail(files.length + ' images')
    showState('progress')
    await nextPaint()
    try {
      ffmpeg = await loadFFmpegWithProgress(progress)
      for (var i = 0; i < files.length; i++) {
        progress.set('Reading images…', 0.5 + 0.3 * (i / files.length))
        progress.detail('Image ' + (i + 1) + ' of ' + files.length)
        var name = 'img' + String(i + 1).padStart(3, '0') + '.png'
        var data = new Uint8Array(await files[i].arrayBuffer())
        await ffmpeg.writeFile(name, data)
      }
      var fps = parseInt(document.getElementById('iv-fps').value, 10) || 2
      var outputName = 'out.mp4'
      progress.pending('Encoding video…')
      await ffmpeg.exec(buildImagesToVideoArgs({ pattern: 'img%03d.png', outputName: outputName, fps: fps }))
      progress.set('Finishing…', 0.95)
      progress.detail('')
      var out = await ffmpeg.readFile(outputName)
      resultBlob = new Blob([out.buffer || out], { type: 'video/mp4' })
      if (lastPreviewUrl) URL.revokeObjectURL(lastPreviewUrl)
      lastPreviewUrl = URL.createObjectURL(resultBlob)
      videoEl.src = lastPreviewUrl
      videoEl.style.display = ''
      showState('result')
    } catch (e) {
      showError(e.message || String(e))
    }
  }

  downloadBtn.addEventListener('click', function () {
    if (!resultBlob) return
    downloadBlob(resultBlob, getVideoExtOutputFilename(files[0]?.name || 'slideshow', suffix, '.mp4'))
  })
  showState('upload')
}

// Mirrors ffmpeg's vf_eq lookup table: contrast around the mid point, then
// brightness as an offset, then gamma, so the preview and the export agree.
function buildEqLut(opts) {
  var lut = new Uint8ClampedArray(256)
  var g = 1 / Math.max(0.1, opts.gamma)
  for (var i = 0; i < 256; i++) {
    var v = opts.contrast * (i / 255 - 0.5) + 0.5 + opts.brightness
    v = v <= 0 ? 0 : Math.pow(v, g)
    if (opts.negate) v = 1 - v
    lut[i] = v * 255
  }
  return lut
}

// Grabs one frame with the browser's own decoder — no FFmpeg download — and
// re-renders it on every slider move. Returns null when there is nothing to
// draw into; `render` is a no-op until the frame actually arrives.
function createFilterPreview(file, wrapEl, canvasEl) {
  if (!wrapEl || !canvasEl || typeof canvasEl.getContext !== 'function') return null

  var url = URL.createObjectURL(file)
  var video = document.createElement('video')
  var work = document.createElement('canvas')
  var source = null
  var width = 0
  var height = 0
  var scale = 1
  var lastOpts = null
  var frameHandle = 0
  var released = false

  function release() {
    if (released) return
    released = true
    video.removeAttribute('src')
    try { video.load() } catch (e) { /* ignore */ }
    URL.revokeObjectURL(url)
  }

  function grab() {
    if (source || released) return
    var vw = video.videoWidth
    var vh = video.videoHeight
    if (!vw || !vh) return
    scale = Math.min(1, PREVIEW_MAX_WIDTH / vw)
    width = Math.max(1, Math.round(vw * scale))
    height = Math.max(1, Math.round(vh * scale))
    work.width = width
    work.height = height
    canvasEl.width = width
    canvasEl.height = height
    var wctx = work.getContext('2d')
    wctx.drawImage(video, 0, 0, width, height)
    try {
      source = wctx.getImageData(0, 0, width, height)
    } catch (e) {
      release()
      return
    }
    release()
    setVisible(wrapEl, true)
    paint()
  }

  function paint() {
    if (!source || !lastOpts) return
    var lut = buildEqLut(lastOpts)
    var sat = lastOpts.saturation
    var src = source.data
    var wctx = work.getContext('2d')
    var out = wctx.createImageData(width, height)
    var dst = out.data
    for (var i = 0; i < src.length; i += 4) {
      var r = src[i]
      var g = src[i + 1]
      var b = src[i + 2]
      if (sat !== 1) {
        var luma = 0.299 * r + 0.587 * g + 0.114 * b
        r = luma + (r - luma) * sat
        g = luma + (g - luma) * sat
        b = luma + (b - luma) * sat
        r = r < 0 ? 0 : r > 255 ? 255 : r
        g = g < 0 ? 0 : g > 255 ? 255 : g
        b = b < 0 ? 0 : b > 255 ? 255 : b
      }
      dst[i] = lut[r | 0]
      dst[i + 1] = lut[g | 0]
      dst[i + 2] = lut[b | 0]
      dst[i + 3] = src[i + 3]
    }
    wctx.putImageData(out, 0, 0)
    var ctx = canvasEl.getContext('2d')
    // Blur is linear, so applying it after the LUT (and after negate) matches
    // ffmpeg's eq,gblur,negate chain.
    ctx.filter = lastOpts.blur > 0 ? 'blur(' + (lastOpts.blur * scale).toFixed(2) + 'px)' : 'none'
    ctx.clearRect(0, 0, width, height)
    ctx.drawImage(work, 0, 0)
    ctx.filter = 'none'
  }

  video.muted = true
  video.playsInline = true
  video.preload = 'auto'
  video.addEventListener('loadeddata', function () {
    var duration = isFinite(video.duration) && video.duration > 0 ? video.duration : 0
    var at = duration ? Math.min(1, duration / 3) : 0
    if (at > 0) {
      try { video.currentTime = at } catch (e) { grab() }
    } else {
      grab()
    }
  })
  video.addEventListener('seeked', grab)
  video.addEventListener('error', release)
  video.src = url

  return {
    render: function (opts) {
      lastOpts = opts
      if (!source) return
      if (frameHandle) return
      frameHandle = requestAnimationFrame(function () {
        frameHandle = 0
        paint()
      })
    },
    destroy: function () {
      if (frameHandle) cancelAnimationFrame(frameHandle)
      release()
      source = null
    },
  }
}

function rangeRow(id, label, key, value) {
  var range = VIDEO_FILTER_RANGES[key]
  return '<div class="fx-slider">' +
    '<label class="tool-label" for="' + id + '">' + label + ' <output class="fx-slider-value" id="' + id + '-out" for="' + id + '"></output></label>' +
    '<input class="fx-range" type="range" id="' + id + '" data-key="' + key + '" min="' + range.min + '" max="' + range.max + '" step="' + range.step + '" value="' + value + '" />' +
    '</div>'
}

export function initFfmpegEffectsTool(config) {
  var mode = config.mode
  var suffix = config.suffix || mode
  var prefix = 'fx'
  var root = document.getElementById('ez-root')
  if (!root) return

  var isInterpolate = mode === 'interpolate'
  var accept = mode === 'waveform' || mode === 'denoise'
    ? 'audio/*'
    : isInterpolate
      // The page promises smoothing a choppy GIF, so a GIF has to be pickable.
      ? 'image/gif,.gif,video/mp4,video/webm,video/quicktime'
      : 'video/mp4,video/webm,video/quicktime'
  root.innerHTML = buildFfmpegShell(prefix, accept, false)

  var currentFile = null
  var gifJob = false
  var ffmpeg = null
  var resultBlob = null
  var lastPreviewUrl = null
  var filterPreview = null
  var filterOptions = getVideoFilterPreset('original')
  var cueRows = [{ start: '00:00:00.000', end: '00:00:03.000', text: '' }]
  var staticExt = mode === 'waveform' ? '.png' : mode === 'denoise' ? '.mp3' : '.mp4'
  var resultExt = staticExt

  var dropzone = document.getElementById(prefix + '-dropzone')
  var fileInput = document.getElementById(prefix + '-file')
  var settingsEl = document.getElementById(prefix + '-settings')
  var progressEl = document.getElementById(prefix + '-progress')
  var progress = attachProgress(prefix)
  var resultEl = document.getElementById(prefix + '-result')
  var videoEl = document.getElementById(prefix + '-video')
  var imgEl = document.getElementById(prefix + '-img')
  var downloadBtn = document.getElementById(prefix + '-download')
  var errorEl = document.getElementById(prefix + '-error')
  var errorText = document.getElementById(prefix + '-error-text')

  function showState(s) {
    setVisible(dropzone, s === 'upload')
    setVisible(settingsEl, s === 'settings')
    setVisible(progressEl, s === 'progress')
    setVisible(resultEl, s === 'result')
    setVisible(errorEl, s === 'error')
    if (s !== 'progress') progress.reset()
  }

  function showError(msg) { errorText.textContent = msg; showState('error') }

  // ---- filters: sliders, presets, one-frame preview ----------------------

  function readFilterOptions() {
    var raw = { negate: !!(document.getElementById('fx-negate') || {}).checked }
    Object.keys(VIDEO_FILTER_RANGES).forEach(function (key) {
      var input = document.getElementById('fx-' + key)
      if (input) raw[key] = input.value
    })
    return normalizeVideoFilterOptions(raw)
  }

  function syncFilterUi() {
    filterOptions = readFilterOptions()
    Object.keys(VIDEO_FILTER_RANGES).forEach(function (key) {
      var out = document.getElementById('fx-' + key + '-out')
      if (out) out.textContent = key === 'blur' && filterOptions.blur === 0 ? 'off' : String(filterOptions[key])
    })
    var chain = document.getElementById('fx-filter-string')
    if (chain) chain.textContent = 'FFmpeg filter: ' + buildEqFilterString(filterOptions)
    if (filterPreview) filterPreview.render(filterOptions)
  }

  function applyFilterOptions(opts) {
    Object.keys(VIDEO_FILTER_RANGES).forEach(function (key) {
      var input = document.getElementById('fx-' + key)
      if (input) input.value = opts[key]
    })
    var negate = document.getElementById('fx-negate')
    if (negate) negate.checked = !!opts.negate
    syncFilterUi()
  }

  function filterSettingsHtml() {
    return '<div class="fx-preview" id="fx-preview" hidden>' +
        '<canvas id="fx-preview-canvas" class="fx-preview-canvas"></canvas>' +
        '<p class="tool-hint">Live preview of one frame. Gamma and blur are approximated here; the export is rendered by FFmpeg at full resolution.</p>' +
      '</div>' +
      '<div class="fx-presets">' +
        '<span class="tool-label">Presets</span>' +
        '<div class="fx-preset-row">' +
          '<button type="button" class="tool-btn tool-btn-secondary" data-preset="vivid">Vivid</button>' +
          '<button type="button" class="tool-btn tool-btn-secondary" data-preset="grayscale">Grayscale</button>' +
          '<button type="button" class="tool-btn tool-btn-secondary" data-preset="negative">Negative</button>' +
          '<button type="button" class="tool-btn tool-btn-secondary" data-preset="original">Reset</button>' +
        '</div>' +
      '</div>' +
      rangeRow('fx-brightness', 'Brightness', 'brightness', filterOptions.brightness) +
      rangeRow('fx-contrast', 'Contrast', 'contrast', filterOptions.contrast) +
      rangeRow('fx-saturation', 'Saturation', 'saturation', filterOptions.saturation) +
      rangeRow('fx-gamma', 'Gamma', 'gamma', filterOptions.gamma) +
      rangeRow('fx-blur', 'Blur', 'blur', filterOptions.blur) +
      '<label class="fx-check"><input type="checkbox" id="fx-negate" /> Invert colours (negative)</label>' +
      '<p class="tool-hint" id="fx-filter-string"></p>'
  }

  function wireFilterSettings() {
    settingsEl.addEventListener('input', function (e) {
      if (e.target.classList.contains('fx-range') || e.target.id === 'fx-negate') syncFilterUi()
    })
    settingsEl.addEventListener('change', function (e) {
      if (e.target.id === 'fx-negate') syncFilterUi()
    })
    settingsEl.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('[data-preset]') : null
      if (!btn) return
      applyFilterOptions(getVideoFilterPreset(btn.dataset.preset))
    })
    if (filterPreview) filterPreview.destroy()
    filterPreview = createFilterPreview(
      currentFile,
      document.getElementById('fx-preview'),
      document.getElementById('fx-preview-canvas')
    )
    syncFilterUi()
  }

  // ---- subtitles: caption editor ----------------------------------------

  function cueRowHtml(i) {
    var n = i + 1
    return '<div class="fx-cue" data-index="' + i + '">' +
      '<input class="tool-input fx-cue-time" data-field="start" placeholder="00:00:00.000" aria-label="Caption ' + n + ' start time" />' +
      '<input class="tool-input fx-cue-time" data-field="end" placeholder="00:00:03.000" aria-label="Caption ' + n + ' end time" />' +
      '<textarea class="tool-input fx-cue-text" data-field="text" rows="1" placeholder="Caption text" aria-label="Caption ' + n + ' text"></textarea>' +
      '<button type="button" class="tool-btn tool-btn-secondary fx-cue-remove" aria-label="Remove caption ' + n + '">Remove</button>' +
      '</div>'
  }

  function renderCueRows() {
    var host = document.getElementById('fx-cues')
    if (!host) return
    host.innerHTML = cueRows.map(function (_, i) { return cueRowHtml(i) }).join('')
    // Values are assigned as properties, never interpolated into the markup,
    // so a caption containing quotes or angle brackets stays text.
    Array.prototype.forEach.call(host.querySelectorAll('.fx-cue'), function (rowEl, i) {
      Array.prototype.forEach.call(rowEl.querySelectorAll('[data-field]'), function (input) {
        input.value = cueRows[i][input.getAttribute('data-field')] || ''
      })
    })
  }

  function syncCueRows() {
    var host = document.getElementById('fx-cues')
    if (!host) return
    var next = []
    Array.prototype.forEach.call(host.querySelectorAll('.fx-cue'), function (rowEl) {
      var row = { start: '', end: '', text: '' }
      Array.prototype.forEach.call(rowEl.querySelectorAll('[data-field]'), function (input) {
        row[input.getAttribute('data-field')] = input.value
      })
      next.push(row)
    })
    cueRows = next
  }

  function subtitleSettingsHtml() {
    return '<p class="tool-hint">Type the captions below, or import an .srt / .vtt file and correct it before burning it in.</p>' +
      '<div class="fx-cues" id="fx-cues"></div>' +
      '<div class="fx-preset-row">' +
        '<button type="button" class="tool-btn tool-btn-secondary" id="fx-add-cue">Add caption</button>' +
        '<button type="button" class="tool-btn tool-btn-secondary" id="fx-pick-srt">Import .srt / .vtt</button>' +
        '<input type="file" id="fx-srt" accept=".srt,.vtt,text/plain" hidden />' +
      '</div>' +
      '<div class="fx-sub-style">' +
        '<div class="fx-field"><label class="tool-label" for="fx-sub-size">Font size</label>' +
          '<input class="tool-input" id="fx-sub-size" type="number" value="24" min="8" max="96" /></div>' +
        '<div class="fx-field"><label class="tool-label" for="fx-sub-pos">Position</label>' +
          '<select class="tool-input" id="fx-sub-pos"><option value="bottom">Bottom</option><option value="center">Middle</option><option value="top">Top</option></select></div>' +
      '</div>' +
      '<label class="fx-check"><input type="checkbox" id="fx-sub-outline" checked /> Black outline (readable over bright footage)</label>' +
      '<p class="tool-hint">Font size is relative to the video height, so 24 looks the same on a 480p and a 1080p export.</p>'
  }

  function wireSubtitleSettings() {
    renderCueRows()
    settingsEl.addEventListener('input', function (e) {
      if (e.target.closest && e.target.closest('.fx-cue')) syncCueRows()
    })
    settingsEl.addEventListener('click', function (e) {
      var remove = e.target.closest ? e.target.closest('.fx-cue-remove') : null
      if (remove) {
        syncCueRows()
        var index = Number(remove.parentElement.getAttribute('data-index'))
        cueRows.splice(index, 1)
        if (!cueRows.length) cueRows = [{ start: '00:00:00.000', end: '00:00:03.000', text: '' }]
        renderCueRows()
        return
      }
      if (e.target.id === 'fx-add-cue') {
        syncCueRows()
        var last = cueRows[cueRows.length - 1] || { end: '00:00:00.000' }
        var startAt = last.end || '00:00:00.000'
        var parsed = normalizeCues([{ start: startAt, end: startAt, text: 'x' }])[0]
        var startSec = parsed && parsed.start != null ? parsed.start : 0
        cueRows.push({
          start: formatTimecodeInput(startSec),
          end: formatTimecodeInput(startSec + 3),
          text: '',
        })
        renderCueRows()
        return
      }
      if (e.target.id === 'fx-pick-srt') document.getElementById('fx-srt').click()
    })
    document.getElementById('fx-srt').addEventListener('change', async function (e) {
      var file = e.target.files && e.target.files[0]
      if (!file) return
      var parsed = parseSubtitleText(await file.text())
      if (!parsed.length) { showError('No captions found in ' + file.name + '. Expected SRT or WebVTT cues.'); return }
      cueRows = parsed.map(function (cue) {
        return {
          start: formatTimecodeInput(cue.start),
          end: formatTimecodeInput(cue.end),
          text: cue.text,
        }
      })
      renderCueRows()
    })
  }

  function readSubtitleStyle() {
    var size = document.getElementById('fx-sub-size')
    var pos = document.getElementById('fx-sub-pos')
    var outline = document.getElementById('fx-sub-outline')
    return buildSubtitleStyle({
      fontSize: size ? size.value : 24,
      position: pos ? pos.value : 'bottom',
      outline: outline ? outline.checked : true,
      fontName: SUBTITLE_FONT_NAME,
    })
  }

  // ---- shared ------------------------------------------------------------

  function buildArgs(inputName, outputName) {
    if (mode === 'filters') {
      return buildVideoFiltersArgs({
        inputName: inputName,
        outputName: outputName,
        filter: buildEqFilterString(readFilterOptions()),
      })
    }
    if (mode === 'stabilizer') return buildVideoStabilizerArgs({ inputName: inputName, outputName: outputName })
    if (mode === 'subtitles') {
      return buildSubtitlesArgs({
        inputName: inputName,
        outputName: outputName,
        subtitlesFile: 'subs.srt',
        fontsDir: '.',
        style: readSubtitleStyle(),
      })
    }
    if (mode === 'interpolate') {
      return buildInterpolateArgs({
        inputName: inputName,
        outputName: outputName,
        fps: interpolateFps(),
        method: interpolateMethod(),
      })
    }
    if (mode === 'denoise') return buildAudioDenoiseArgs({ inputName: inputName, outputName: outputName })
    if (mode === 'waveform') return buildWaveformImageArgs({ inputName: inputName, outputName: outputName, width: 1200, height: 200 })
    return []
  }

  function interpolateFps() {
    return parseInt((document.getElementById('fx-fps') || {}).value, 10) || 30
  }

  function interpolateMethod() {
    return (document.getElementById('fx-method') || {}).value || 'motion'
  }

  function handleFile(file) {
    if (!file) return
    if (mode !== 'waveform' && mode !== 'denoise') {
      gifJob = isInterpolate && isGifFile(file)
      if (!gifJob) {
        var v = validateVideoFile(file)
        if (!v.valid) {
          showError(isInterpolate ? 'Unsupported format. Use GIF, MP4, WebM, or MOV.' : v.error)
          return
        }
      }
    }
    if (file.size > MAX_BYTES) { showError('File too large.'); return }
    currentFile = file
    resultExt = isInterpolate ? (gifJob ? '.gif' : '.mp4') : staticExt

    var html = ''
    if (mode === 'filters') html += filterSettingsHtml()
    if (mode === 'subtitles') html += subtitleSettingsHtml()
    if (mode === 'interpolate') {
      html += '<label class="tool-label" for="fx-fps">Target FPS</label><input class="tool-input" id="fx-fps" type="number" value="30" min="24" max="60" />' +
        '<label class="tool-label" for="fx-method">Interpolation</label>' +
        '<select class="tool-input" id="fx-method">' +
          '<option value="motion">Motion compensated (smoothest, slow)</option>' +
          '<option value="blend">Blend frames (fast)</option>' +
        '</select>' +
        '<p class="tool-hint">' + (gifJob
          ? 'GIF in, GIF out. The new frames are quantised through a shared palette so the colours survive.'
          : 'MP4 in, MP4 out. Drop a GIF instead to get a smoother GIF back.') + '</p>'
    }
    html += '<button class="tool-btn" id="fx-process" style="margin-top:1rem;">' +
      (mode === 'filters' ? 'Apply and export' : 'Process') + '</button>'
    settingsEl.innerHTML = html
    document.getElementById('fx-process').addEventListener('click', process)
    if (mode === 'filters') wireFilterSettings()
    if (mode === 'subtitles') wireSubtitleSettings()
    showState('settings')
  }

  async function writeSubtitleAssets(ff) {
    var cues = normalizeCues(cueRows)
    var check = validateCues(cues)
    if (!check.valid) throw new Error(check.error)
    await ff.writeFile('subs.srt', new TextEncoder().encode(buildSrt(cues)))
    progress.pending('Loading subtitle font…')
    progress.detail(SUBTITLE_FONT_NAME + ' · ~740 KB, cached after first use')
    var resp = await fetch(SUBTITLE_FONT_URL)
    if (!resp.ok) throw new Error('Could not download the subtitle font. Check your connection and try again.')
    await ff.writeFile(SUBTITLE_FONT_FILE, new Uint8Array(await resp.arrayBuffer()))
  }

  async function process() {
    if (!currentFile) return
    if (mode === 'subtitles') {
      // Fail before the 25 MB FFmpeg download, not after it.
      var check = validateCues(normalizeCues(cueRows))
      if (!check.valid) { showError(check.error); return }
    }
    progress.set('Loading FFmpeg…', 0)
    progress.detail(currentFile.name + ' · ' + formatSize(currentFile.size))
    showState('progress')
    await nextPaint()
    try {
      ffmpeg = await loadFFmpegWithProgress(progress)
      progress.set('Reading file…', 0.55)
      var inputName = 'input' + (currentFile.name.match(/\.[^.]+$/) || ['.bin'])[0]
      await ffmpeg.writeFile(inputName, new Uint8Array(await currentFile.arrayBuffer()))
      if (mode === 'subtitles') await writeSubtitleAssets(ffmpeg)
      var outputName = 'output' + resultExt
      if (isInterpolate && gifJob) {
        var fps = interpolateFps()
        var method = interpolateMethod()
        progress.pending('Interpolating frames and building the palette…')
        progress.detail('')
        await ffmpeg.exec(buildInterpolateGifPaletteArgs({
          inputName: inputName, paletteName: 'palette.png', fps: fps, method: method,
        }))
        await nextPaint()
        progress.pending('Rendering the smoothed GIF…')
        await ffmpeg.exec(buildInterpolateGifArgs({
          inputName: inputName, paletteName: 'palette.png', outputName: outputName, fps: fps, method: method,
        }))
      } else {
        progress.pending('Processing…')
        await ffmpeg.exec(buildArgs(inputName, outputName))
      }
      progress.set('Finishing…', 0.95)
      progress.detail('')
      var out = await ffmpeg.readFile(outputName)
      var mime = resultExt === '.png' ? 'image/png'
        : resultExt === '.mp3' ? 'audio/mpeg'
        : resultExt === '.gif' ? 'image/gif'
        : 'video/mp4'
      if (!out || !out.length) throw new Error('FFmpeg produced an empty file. Try a shorter clip or the fast blend mode.')
      resultBlob = new Blob([out.buffer || out], { type: mime })
      if (lastPreviewUrl) URL.revokeObjectURL(lastPreviewUrl)
      lastPreviewUrl = URL.createObjectURL(resultBlob)
      if (mime.startsWith('video')) {
        videoEl.src = lastPreviewUrl
        videoEl.style.display = ''
        imgEl.style.display = 'none'
      } else if (mime.startsWith('image')) {
        imgEl.src = lastPreviewUrl
        imgEl.style.display = ''
        videoEl.style.display = 'none'
      }
      showState('result')
    } catch (e) {
      showError(e.message || String(e))
    }
  }

  wireDropzone(dropzone, fileInput, function (fl) { handleFile(fl[0]) })
  downloadBtn.addEventListener('click', function () {
    if (!resultBlob) return
    var filename
    if (mode === 'waveform' || mode === 'denoise') {
      filename = mode === 'waveform' ? getVideoExtOutputFilename(currentFile.name, suffix, '.png') : getAudioOutputFilename(currentFile.name, suffix)
    } else {
      filename = getVideoExtOutputFilename(currentFile.name, suffix, resultExt)
    }
    downloadBlob(resultBlob, filename)
  })
  showState('upload')
}
