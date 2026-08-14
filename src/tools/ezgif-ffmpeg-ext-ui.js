import { loadFFmpeg } from './ffmpeg-loader.js'
import { buildMergeVideosArgs, buildImagesToVideoArgs, buildVideoFiltersArgs, buildVideoStabilizerArgs, buildSubtitlesArgs, buildInterpolateArgs, getVideoExtOutputFilename } from './ezgif-video-ext-core.js'
import { buildMergeAudioArgs, buildAudioDenoiseArgs, buildWaveformImageArgs, getAudioOutputFilename } from './ezgif-audio-core.js'
import { validateVideoFile, formatFileSize } from './fps-converter-core.js'
import { downloadBlob, setVisible, nextPaint, makeProgress, formatSize } from './tool-utils.js'
import { parseFfmpegTime, formatClock } from './ezgif-ffmpeg-ui.js'

var MAX_BYTES = 200 * 1024 * 1024

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

export function initFfmpegEffectsTool(config) {
  var mode = config.mode
  var suffix = config.suffix || mode
  var prefix = 'fx'
  var root = document.getElementById('ez-root')
  if (!root) return

  var accept = mode === 'waveform' || mode === 'denoise' ? 'audio/*' : 'video/mp4,video/webm,video/quicktime'
  var extra = mode === 'subtitles' ? '<input type="file" id="fx-srt" accept=".srt,.vtt,text/plain" hidden /><button type="button" class="tool-btn tool-btn-secondary" id="fx-pick-srt">Upload subtitles (.srt)</button>' : ''
  root.innerHTML = buildFfmpegShell(prefix, accept, false).replace('</div>\n    <div id="' + prefix + '-settings"', extra + '</div><div id="' + prefix + '-settings"')

  var currentFile = null
  var srtFile = null
  var ffmpeg = null
  var resultBlob = null
  var lastPreviewUrl = null
  var resultExt = mode === 'waveform' ? '.png' : mode === 'denoise' ? '.mp3' : '.mp4'

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

  function buildArgs(inputName, outputName) {
    if (mode === 'filters') {
      var filter = document.getElementById('fx-filter')?.value || 'eq=brightness=0.06:saturation=1.3'
      return buildVideoFiltersArgs({ inputName: inputName, outputName: outputName, filter: filter })
    }
    if (mode === 'stabilizer') return buildVideoStabilizerArgs({ inputName: inputName, outputName: outputName })
    if (mode === 'subtitles') return buildSubtitlesArgs({ inputName: inputName, outputName: outputName, subtitlesFile: 'subs.srt' })
    if (mode === 'interpolate') {
      var fps = parseInt(document.getElementById('fx-fps')?.value, 10) || 30
      return buildInterpolateArgs({ inputName: inputName, outputName: outputName, fps: fps })
    }
    if (mode === 'denoise') return buildAudioDenoiseArgs({ inputName: inputName, outputName: outputName })
    if (mode === 'waveform') return buildWaveformImageArgs({ inputName: inputName, outputName: outputName, width: 1200, height: 200 })
    return []
  }

  function handleFile(file) {
    if (mode !== 'waveform' && mode !== 'denoise') {
      var v = validateVideoFile(file)
      if (!v.valid) { showError(v.error); return }
    }
    if (file.size > MAX_BYTES) { showError('File too large.'); return }
    currentFile = file
    var html = ''
    if (mode === 'filters') {
      html += '<label class="tool-label" for="fx-filter">Filter</label><select class="tool-input" id="fx-filter"><option value="eq=brightness=0.06:saturation=1.3">Vivid</option><option value="hue=s=0">Grayscale</option><option value="negate">Negative</option></select>'
    }
    if (mode === 'interpolate') {
      html += '<label class="tool-label" for="fx-fps">Target FPS</label><input class="tool-input" id="fx-fps" type="number" value="30" min="24" max="60" />'
    }
    html += '<button class="tool-btn" id="fx-process" style="margin-top:1rem;">Process</button>'
    settingsEl.innerHTML = html
    document.getElementById('fx-process').addEventListener('click', process)
    var srtBtn = document.getElementById('fx-pick-srt')
    if (srtBtn) {
      srtBtn.addEventListener('click', function () {
        var inp = document.getElementById('fx-srt')
        inp.click()
        inp.onchange = function () { srtFile = inp.files[0] }
      })
    }
    showState('settings')
  }

  async function process() {
    if (!currentFile) return
    if (mode === 'subtitles' && !srtFile) { showError('Upload an .srt subtitle file.'); return }
    progress.set('Loading FFmpeg…', 0)
    progress.detail(currentFile.name + ' · ' + formatSize(currentFile.size))
    showState('progress')
    await nextPaint()
    try {
      ffmpeg = await loadFFmpegWithProgress(progress)
      progress.set('Reading file…', 0.55)
      var inputName = 'input' + (currentFile.name.match(/\.[^.]+$/) || ['.bin'])[0]
      await ffmpeg.writeFile(inputName, new Uint8Array(await currentFile.arrayBuffer()))
      if (srtFile) await ffmpeg.writeFile('subs.srt', new Uint8Array(await srtFile.arrayBuffer()))
      var outputName = 'output' + resultExt
      progress.pending('Processing…')
      await ffmpeg.exec(buildArgs(inputName, outputName))
      progress.set('Finishing…', 0.95)
      progress.detail('')
      var out = await ffmpeg.readFile(outputName)
      var mime = resultExt === '.png' ? 'image/png' : resultExt === '.mp3' ? 'audio/mpeg' : 'video/mp4'
      resultBlob = new Blob([out.buffer || out], { type: mime })
      if (lastPreviewUrl) URL.revokeObjectURL(lastPreviewUrl)
      lastPreviewUrl = URL.createObjectURL(resultBlob)
      if (mime.startsWith('video')) {
        videoEl.src = lastPreviewUrl
        videoEl.style.display = ''
      } else if (mime.startsWith('image')) {
        imgEl.src = lastPreviewUrl
        imgEl.style.display = ''
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
