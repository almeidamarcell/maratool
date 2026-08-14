import { computeStaticGifKeyframes } from './ezgif-gif-ext-core.js'
import { encodeGifFrames } from './ezgif-gif-ext-ui.js'
import { getGifOutputFilename } from './gif-anim-core.js'
import { initFfmpegTool } from './ezgif-ffmpeg-ui.js'
import { buildVideoToApngArgs, buildVideoToWebpArgs, buildVideoToAvifArgs, getVideoExtOutputFilename } from './ezgif-video-ext-core.js'
import { downloadBlob, setVisible, nextPaint, makeProgress, readFileAsDataURL, formatSize } from './tool-utils.js'

var MAX_IMAGE = 25 * 1024 * 1024

async function loadImage(file, onProgress) {
  if (file.size > MAX_IMAGE) throw new Error(file.name + ' is too large (max 25 MB).')
  var dataUrl = await readFileAsDataURL(file, onProgress)
  return new Promise(function (resolve, reject) {
    var img = new Image()
    img.onload = function () { resolve(img) }
    img.onerror = function () { reject(new Error('Could not decode ' + file.name + '.')) }
    img.src = dataUrl
  })
}

export function initAnimMakerTool(config) {
  var format = config.format || 'gif'
  var suffix = config.suffix || format

  if (format === 'livephoto') {
    return initLivePhotoTool(suffix)
  }

  var root = document.getElementById('ez-root')
  if (!root) return

  root.innerHTML =
    '<div class="am-dropzone tool-dropzone" id="am-dropzone">' +
      '<input type="file" id="am-file" hidden accept="image/*" multiple />' +
      '<p>Drop images or click to upload (multiple for frame animation)</p>' +
    '</div>' +
    '<div id="am-settings" hidden>' +
      '<label class="tool-label" for="am-delay">Frame delay (cs)</label><input class="tool-input" id="am-delay" type="number" value="20" min="2" max="200" />' +
      '<label class="tool-label" for="am-style">Animation style (single image)</label><select class="tool-input" id="am-style"><option value="zoom-in">Zoom in</option><option value="zoom-out">Zoom out</option><option value="pan-right">Pan right</option><option value="pulse">Pulse</option></select>' +
      '<label class="tool-label" for="am-frames">Frames (single image)</label><input class="tool-input" id="am-frames" type="number" value="12" min="4" max="40" />' +
      '<button type="button" class="tool-btn" id="am-process" style="margin-top:1rem;">Create ' + format.toUpperCase() + '</button>' +
    '</div>' +
    '<div id="am-progress" class="tool-progress" hidden>' +
      '<p id="am-progress-text" class="tool-progress-text">Encoding…</p>' +
      '<div class="tool-progress-bar"><div id="am-progress-fill" class="tool-progress-fill"></div></div>' +
      '<p id="am-progress-detail" class="tool-progress-detail"></p>' +
    '</div>' +
    '<div id="am-result" hidden><img id="am-preview" alt="Result" style="max-width:100%;" /><button type="button" class="tool-btn" id="am-download" style="margin-top:1rem;">Download</button></div>' +
    '<p id="am-error" class="tool-error" hidden><span id="am-error-text"></span></p>'

  var dropzone = document.getElementById('am-dropzone')
  var fileInput = document.getElementById('am-file')
  var settingsEl = document.getElementById('am-settings')
  var progressEl = document.getElementById('am-progress')
  var progressDetail = document.getElementById('am-progress-detail')
  var progress = makeProgress(
    document.getElementById('am-progress-text'),
    document.getElementById('am-progress-fill')
  )
  var resultEl = document.getElementById('am-result')
  var preview = document.getElementById('am-preview')
  var downloadBtn = document.getElementById('am-download')
  var errorEl = document.getElementById('am-error')
  var errorText = document.getElementById('am-error-text')

  var files = []
  var resultBlob = null
  var lastPreviewUrl = null

  function showState(s) {
    setVisible(dropzone, s === 'upload')
    setVisible(settingsEl, s === 'settings')
    setVisible(progressEl, s === 'progress')
    setVisible(resultEl, s === 'result')
    setVisible(errorEl, s === 'error')
    if (s !== 'progress') progress.reset()
  }

  function setDetail(text) {
    if (progressDetail) progressDetail.textContent = text || ''
  }

  async function handleFiles(fl) {
    files = Array.from(fl)
    showState('settings')
  }

  async function process() {
    if (!files.length) return
    progress.set('Reading images…', 0)
    setDetail(files.length + ' file' + (files.length === 1 ? '' : 's'))
    showState('progress')
    await nextPaint()
    try {
      var delay = parseInt(document.getElementById('am-delay').value, 10) || 20
      var rgbaFrames = []
      var w = 0
      var h = 0

      if (files.length > 1) {
        // Two passes over the same files: size them all, then draw them all.
        // Report across both so the bar never rewinds.
        var steps = files.length * 2
        for (var i = 0; i < files.length; i++) {
          progress.set('Reading images…', i / steps)
          setDetail(files[i].name + ' · ' + formatSize(files[i].size))
          var img = await loadImage(files[i])
          w = Math.max(w, img.naturalWidth)
          h = Math.max(h, img.naturalHeight)
        }
        for (var j = 0; j < files.length; j++) {
          progress.set('Building frames…', (files.length + j) / steps)
          setDetail('Frame ' + (j + 1) + ' of ' + files.length)
          var img2 = await loadImage(files[j])
          var c = document.createElement('canvas')
          c.width = w; c.height = h
          var cx = c.getContext('2d')
          cx.fillStyle = '#fff'
          cx.fillRect(0, 0, w, h)
          cx.drawImage(img2, Math.round((w - img2.naturalWidth) / 2), Math.round((h - img2.naturalHeight) / 2))
          rgbaFrames.push({ rgba: cx.getImageData(0, 0, w, h).data, delay: delay })
        }
      } else {
        setDetail(files[0].name + ' · ' + formatSize(files[0].size))
        var single = await loadImage(files[0], function (ratio) {
          progress.set('Reading image…', ratio)
        })
        progress.pending('Building frames…')
        await nextPaint()
        w = single.naturalWidth
        h = single.naturalHeight
        var n = parseInt(document.getElementById('am-frames').value, 10) || 12
        var style = document.getElementById('am-style').value
        var kf = computeStaticGifKeyframes(n, style)
        kf.forEach(function (k) {
          var c2 = document.createElement('canvas')
          c2.width = w; c2.height = h
          var cx2 = c2.getContext('2d')
          cx2.fillStyle = '#fff'
          cx2.fillRect(0, 0, w, h)
          var sw = w * k.scale
          var sh = h * k.scale
          var sx = (w - sw) / 2 + k.offsetX * w
          var sy = (h - sh) / 2 + k.offsetY * h
          cx2.drawImage(single, sx, sy, sw, sh)
          rgbaFrames.push({ rgba: cx2.getContext('2d').getImageData(0, 0, w, h).data, delay: delay })
        })
      }

      resultBlob = await encodeGifFrames(rgbaFrames, w, h, 0, function (ratio, done, total) {
        progress.set('Encoding GIF…', ratio)
        setDetail('Frame ' + done + ' of ' + total)
      })

      if (format !== 'gif') {
        progress.pending('Loading ' + format.toUpperCase() + ' encoder…')
        setDetail('')
        var ffmpegMod = await import('./ffmpeg-loader.js')
        var r = await ffmpegMod.loadFFmpeg()
        var ff = r.ff
        for (var k = 0; k < rgbaFrames.length; k++) {
          progress.set('Writing frames…', k / rgbaFrames.length)
          setDetail('Frame ' + (k + 1) + ' of ' + rgbaFrames.length)
          var fc = document.createElement('canvas')
          fc.width = w; fc.height = h
          fc.getContext('2d').putImageData(new ImageData(rgbaFrames[k].rgba, w, h), 0, 0)
          var pngBuf = await new Promise(function (res) {
            fc.toBlob(function (b) {
              b.arrayBuffer().then(function (ab) { res(new Uint8Array(ab)) })
            }, 'image/png')
          })
          await ff.writeFile('frame' + String(k + 1).padStart(3, '0') + '.png', pngBuf)
        }
        var extMap = { apng: '.apng', webp: '.webp', avif: '.avif', jxl: '.jxl' }
        var outName = 'out' + extMap[format]
        var fps = 10
        progress.pending('Encoding ' + format.toUpperCase() + '…')
        setDetail('')
        if (format === 'apng' || format === 'jxl') {
          await ff.exec(buildVideoToApngArgs({ inputName: 'frame%03d.png', outputName: outName, fps: fps }))
        } else if (format === 'webp') {
          await ff.exec(['-framerate', String(fps), '-i', 'frame%03d.png', '-loop', '0', '-f', 'webp', '-y', outName])
        } else if (format === 'avif') {
          await ff.exec(buildVideoToAvifArgs({ inputName: 'frame%03d.png', outputName: outName, fps: fps }))
        }
        var out = await ff.readFile(outName)
        resultBlob = new Blob([out.buffer || out], { type: 'application/octet-stream' })
      }

      if (lastPreviewUrl) URL.revokeObjectURL(lastPreviewUrl)
      lastPreviewUrl = URL.createObjectURL(resultBlob)
      preview.src = lastPreviewUrl
      showState('result')
    } catch (e) {
      errorText.textContent = e.message || String(e)
      showState('error')
    }
  }

  dropzone.addEventListener('click', function () { fileInput.click() })
  dropzone.addEventListener('dragover', function (e) { e.preventDefault(); dropzone.classList.add('drag-over') })
  dropzone.addEventListener('dragleave', function () { dropzone.classList.remove('drag-over') })
  dropzone.addEventListener('drop', function (e) { e.preventDefault(); dropzone.classList.remove('drag-over'); if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files) })
  fileInput.addEventListener('change', function () { if (fileInput.files.length) handleFiles(fileInput.files) })
  document.getElementById('am-process').addEventListener('click', process)
  downloadBtn.addEventListener('click', function () {
    if (!resultBlob) return
    var ext = format === 'gif' ? '.gif' : format === 'webp' ? '.webp' : format === 'apng' ? '.apng' : format === 'avif' ? '.avif' : '.jxl'
    downloadBlob(resultBlob, format === 'gif' ? getGifOutputFilename(files[0]?.name || 'anim', suffix) : getVideoExtOutputFilename(files[0]?.name || 'anim', suffix, ext))
  })
  showState('upload')
}

function initLivePhotoTool(suffix) {
  var root = document.getElementById('ez-root')
  if (!root) return
  root.innerHTML =
    '<div class="ef-dropzone tool-dropzone" id="ef-dropzone">' +
      '<input type="file" id="ef-file-input" accept="video/*,image/*,.mov,.livp" hidden />' +
      '<p>Drop Live Photo video (MOV) or paired media</p>' +
    '</div>' +
    '<div id="ef-settings" hidden><button type="button" class="tool-btn" id="ef-process">Convert to GIF</button></div>' +
    '<div id="ef-progress" class="tool-progress" hidden><p id="ef-progress-text" class="tool-progress-text">Loading…</p><div class="tool-progress-bar"><div id="ef-progress-fill" class="tool-progress-fill"></div></div><p id="ef-progress-detail" class="tool-progress-detail"></p></div>' +
    '<div id="ef-result" hidden><img id="ef-result-media" alt="Result" style="max-width:100%;" /><button type="button" class="tool-btn" id="ef-download" style="margin-top:1rem;">Download</button></div>' +
    '<p id="ef-error" class="tool-error" hidden><span id="ef-error-text"></span></p>'

  initFfmpegTool({
    buildArgs: function (o) {
      return ['-i', o.inputName, '-vf', 'fps=10,scale=480:-1:flags=lanczos', '-y', o.outputName]
    },
    outputExt: '.gif',
    outputSuffix: suffix,
    acceptVideo: true,
    getOutputName: function (n, s) { return getGifOutputFilename(n, s) },
  })
}
