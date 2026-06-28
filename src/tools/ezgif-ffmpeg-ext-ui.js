import { loadFFmpeg } from './ffmpeg-loader.js'
import { buildMergeVideosArgs, buildImagesToVideoArgs, buildVideoFiltersArgs, buildVideoStabilizerArgs, buildSubtitlesArgs, buildInterpolateArgs, getVideoExtOutputFilename } from './ezgif-video-ext-core.js'
import { buildMergeAudioArgs, buildAudioDenoiseArgs, buildWaveformImageArgs, getAudioOutputFilename } from './ezgif-audio-core.js'
import { validateVideoFile, formatFileSize } from './fps-converter-core.js'

var MAX_BYTES = 200 * 1024 * 1024

function buildFfmpegShell(prefix, accept, multi) {
  return (
    '<div class="' + prefix + '-dropzone tool-dropzone" id="' + prefix + '-dropzone">' +
      '<input type="file" id="' + prefix + '-file" hidden accept="' + accept + '" ' + (multi ? 'multiple' : '') + ' />' +
      '<p>Drop file' + (multi ? 's' : '') + ' or click to upload</p>' +
    '</div>' +
    '<div id="' + prefix + '-settings" hidden></div>' +
    '<div id="' + prefix + '-progress" hidden><p id="' + prefix + '-progress-text">Loading FFmpeg...</p><div class="tool-progress-bar"><div id="' + prefix + '-progress-fill" class="tool-progress-fill"></div></div></div>' +
    '<div id="' + prefix + '-result" hidden><video id="' + prefix + '-video" controls style="max-width:100%;display:none;"></video><img id="' + prefix + '-img" style="max-width:100%;display:none;" /><button type="button" class="tool-btn" id="' + prefix + '-download" style="margin-top:1rem;">Download</button></div>' +
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
  var resultExt = type === 'audio' ? '.mp3' : '.mp4'

  var dropzone = document.getElementById(prefix + '-dropzone')
  var fileInput = document.getElementById(prefix + '-file')
  var settingsEl = document.getElementById(prefix + '-settings')
  var progressEl = document.getElementById(prefix + '-progress')
  var progressText = document.getElementById(prefix + '-progress-text')
  var progressFill = document.getElementById(prefix + '-progress-fill')
  var resultEl = document.getElementById(prefix + '-result')
  var videoEl = document.getElementById(prefix + '-video')
  var imgEl = document.getElementById(prefix + '-img')
  var downloadBtn = document.getElementById(prefix + '-download')
  var errorEl = document.getElementById(prefix + '-error')
  var errorText = document.getElementById(prefix + '-error-text')

  function showState(s) {
    dropzone.style.display = s === 'upload' ? '' : 'none'
    settingsEl.style.display = s === 'settings' ? '' : 'none'
    progressEl.style.display = s === 'progress' ? '' : 'none'
    resultEl.style.display = s === 'result' ? '' : 'none'
    errorEl.style.display = s === 'error' ? '' : 'none'
  }

  function showError(msg) {
    errorText.textContent = msg
    showState('error')
  }

  async function ensureFfmpeg() {
    if (ffmpeg) return
    var r = await loadFFmpeg(function (pct) {
      if (progressFill) progressFill.style.width = Math.min(pct, 40) + '%'
    })
    ffmpeg = r.ff
  }

  function handleFiles(fl) {
    files = Array.from(fl)
    if (files.length < 2) { showError('Please upload at least 2 files to merge.'); return }
    settingsEl.innerHTML = '<p class="tool-hint">' + files.length + ' files selected.</p><button type="button" class="tool-btn" id="fm-process">Merge</button>'
    document.getElementById('fm-process').addEventListener('click', process)
    showState('settings')
  }

  async function process() {
    showState('progress')
    try {
      await ensureFfmpeg()
      var listLines = []
      for (var i = 0; i < files.length; i++) {
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
      await ffmpeg.exec(args)
      var out = await ffmpeg.readFile(outputName)
      resultBlob = new Blob([out.buffer || out], { type: type === 'audio' ? 'audio/mpeg' : 'video/mp4' })
      if (type === 'video') {
        videoEl.src = URL.createObjectURL(resultBlob)
        videoEl.style.display = ''
      }
      showState('result')
    } catch (e) {
      showError(e.message || String(e))
    }
  }

  dropzone.addEventListener('click', function () { fileInput.click() })
  dropzone.addEventListener('dragover', function (e) { e.preventDefault() })
  dropzone.addEventListener('drop', function (e) { e.preventDefault(); if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files) })
  fileInput.addEventListener('change', function () { if (fileInput.files.length) handleFiles(fileInput.files) })
  downloadBtn.addEventListener('click', function () {
    if (!resultBlob) return
    var a = document.createElement('a')
    a.href = URL.createObjectURL(resultBlob)
    a.download = type === 'audio' ? getAudioOutputFilename(files[0].name, suffix) : getVideoExtOutputFilename(files[0].name, suffix, resultExt)
    a.click()
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

  var dropzone = document.getElementById(prefix + '-dropzone')
  var fileInput = document.getElementById(prefix + '-file')
  var settingsEl = document.getElementById(prefix + '-settings')
  var progressEl = document.getElementById(prefix + '-progress')
  var resultEl = document.getElementById(prefix + '-result')
  var videoEl = document.getElementById(prefix + '-video')
  var downloadBtn = document.getElementById(prefix + '-download')
  var errorEl = document.getElementById(prefix + '-error')
  var errorText = document.getElementById(prefix + '-error-text')

  function showState(s) {
    dropzone.style.display = s === 'upload' ? '' : 'none'
    settingsEl.style.display = s === 'settings' ? '' : 'none'
    progressEl.style.display = s === 'progress' ? '' : 'none'
    resultEl.style.display = s === 'result' ? '' : 'none'
    errorEl.style.display = s === 'error' ? '' : 'none'
  }

  function showError(msg) { errorText.textContent = msg; showState('error') }

  dropzone.addEventListener('click', function () { fileInput.click() })
  dropzone.addEventListener('dragover', function (e) { e.preventDefault() })
  dropzone.addEventListener('drop', function (e) {
    e.preventDefault()
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
  })
  fileInput.addEventListener('change', function () {
    if (fileInput.files.length) handleFiles(fileInput.files)
  })

  function handleFiles(fl) {
    files = Array.from(fl)
    settingsEl.innerHTML = '<label class="tool-label">FPS</label><input class="tool-input" id="iv-fps" type="number" value="2" min="1" max="30" />' +
      '<button class="tool-btn" id="iv-process" style="margin-top:1rem;">Create video</button>'
    document.getElementById('iv-process').addEventListener('click', process)
    showState('settings')
  }

  async function process() {
    showState('progress')
    try {
      var r = await loadFFmpeg()
      ffmpeg = r.ff
      for (var i = 0; i < files.length; i++) {
        var name = 'img' + String(i + 1).padStart(3, '0') + '.png'
        var data = new Uint8Array(await files[i].arrayBuffer())
        await ffmpeg.writeFile(name, data)
      }
      var fps = parseInt(document.getElementById('iv-fps').value, 10) || 2
      var outputName = 'out.mp4'
      await ffmpeg.exec(buildImagesToVideoArgs({ pattern: 'img%03d.png', outputName: outputName, fps: fps }))
      var out = await ffmpeg.readFile(outputName)
      resultBlob = new Blob([out.buffer || out], { type: 'video/mp4' })
      videoEl.src = URL.createObjectURL(resultBlob)
      videoEl.style.display = ''
      showState('result')
    } catch (e) {
      showError(e.message || String(e))
    }
  }

  downloadBtn.addEventListener('click', function () {
    if (!resultBlob) return
    var a = document.createElement('a')
    a.href = URL.createObjectURL(resultBlob)
    a.download = getVideoExtOutputFilename(files[0]?.name || 'slideshow', suffix, '.mp4')
    a.click()
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
  var resultExt = mode === 'waveform' ? '.png' : mode === 'denoise' ? '.mp3' : '.mp4'

  var dropzone = document.getElementById(prefix + '-dropzone')
  var fileInput = document.getElementById(prefix + '-file')
  var settingsEl = document.getElementById(prefix + '-settings')
  var progressEl = document.getElementById(prefix + '-progress')
  var resultEl = document.getElementById(prefix + '-result')
  var videoEl = document.getElementById(prefix + '-video')
  var imgEl = document.getElementById(prefix + '-img')
  var downloadBtn = document.getElementById(prefix + '-download')
  var errorEl = document.getElementById(prefix + '-error')
  var errorText = document.getElementById(prefix + '-error-text')

  function showState(s) {
    dropzone.style.display = s === 'upload' ? '' : 'none'
    settingsEl.style.display = s === 'settings' ? '' : 'none'
    progressEl.style.display = s === 'progress' ? '' : 'none'
    resultEl.style.display = s === 'result' ? '' : 'none'
    errorEl.style.display = s === 'error' ? '' : 'none'
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
      html += '<label class="tool-label">Filter</label><select class="tool-input" id="fx-filter"><option value="eq=brightness=0.06:saturation=1.3">Vivid</option><option value="hue=s=0">Grayscale</option><option value="negate">Negative</option></select>'
    }
    if (mode === 'interpolate') {
      html += '<label class="tool-label">Target FPS</label><input class="tool-input" id="fx-fps" type="number" value="30" min="24" max="60" />'
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
    showState('progress')
    try {
      var r = await loadFFmpeg()
      ffmpeg = r.ff
      var inputName = 'input' + (currentFile.name.match(/\.[^.]+$/) || ['.bin'])[0]
      await ffmpeg.writeFile(inputName, new Uint8Array(await currentFile.arrayBuffer()))
      if (srtFile) await ffmpeg.writeFile('subs.srt', new Uint8Array(await srtFile.arrayBuffer()))
      var outputName = 'output' + resultExt
      await ffmpeg.exec(buildArgs(inputName, outputName))
      var out = await ffmpeg.readFile(outputName)
      var mime = resultExt === '.png' ? 'image/png' : resultExt === '.mp3' ? 'audio/mpeg' : 'video/mp4'
      resultBlob = new Blob([out.buffer || out], { type: mime })
      if (mime.startsWith('video')) {
        videoEl.src = URL.createObjectURL(resultBlob)
        videoEl.style.display = ''
      } else if (mime.startsWith('image')) {
        imgEl.src = URL.createObjectURL(resultBlob)
        imgEl.style.display = ''
      }
      showState('result')
    } catch (e) {
      showError(e.message || String(e))
    }
  }

  dropzone.addEventListener('click', function () { fileInput.click() })
  dropzone.addEventListener('dragover', function (e) { e.preventDefault() })
  dropzone.addEventListener('drop', function (e) { e.preventDefault(); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]) })
  fileInput.addEventListener('change', function () { if (fileInput.files[0]) handleFile(fileInput.files[0]) })
  downloadBtn.addEventListener('click', function () {
    if (!resultBlob) return
    var a = document.createElement('a')
    a.href = URL.createObjectURL(resultBlob)
    if (mode === 'waveform' || mode === 'denoise') {
      a.download = mode === 'waveform' ? getVideoExtOutputFilename(currentFile.name, suffix, '.png') : getAudioOutputFilename(currentFile.name, suffix)
    } else {
      a.download = getVideoExtOutputFilename(currentFile.name, suffix, resultExt)
    }
    a.click()
  })
  showState('upload')
}
