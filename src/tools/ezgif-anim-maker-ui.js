import { computeStaticGifKeyframes } from './ezgif-gif-ext-core.js'
import { encodeGifFrames } from './ezgif-gif-ext-ui.js'
import { getGifOutputFilename } from './gif-anim-core.js'
import { initFfmpegTool } from './ezgif-ffmpeg-ui.js'
import { buildVideoToApngArgs, buildVideoToWebpArgs, buildVideoToAvifArgs, getVideoExtOutputFilename } from './ezgif-video-ext-core.js'

var MAX_IMAGE = 25 * 1024 * 1024

function loadImage(file) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader()
    reader.onload = function () {
      var img = new Image()
      img.onload = function () { resolve(img) }
      img.onerror = function () { reject(new Error('Failed to load image')) }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
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
      '<label class="tool-label">Frame delay (cs)</label><input class="tool-input" id="am-delay" type="number" value="20" min="2" max="200" />' +
      '<label class="tool-label">Animation style (single image)</label><select class="tool-input" id="am-style"><option value="zoom-in">Zoom in</option><option value="zoom-out">Zoom out</option><option value="pan-right">Pan right</option><option value="pulse">Pulse</option></select>' +
      '<label class="tool-label">Frames (single image)</label><input class="tool-input" id="am-frames" type="number" value="12" min="4" max="40" />' +
      '<button type="button" class="tool-btn" id="am-process" style="margin-top:1rem;">Create ' + format.toUpperCase() + '</button>' +
    '</div>' +
    '<div id="am-progress" hidden><p>Encoding...</p></div>' +
    '<div id="am-result" hidden><img id="am-preview" alt="Result" style="max-width:100%;" /><button type="button" class="tool-btn" id="am-download" style="margin-top:1rem;">Download</button></div>' +
    '<p id="am-error" class="tool-error" hidden><span id="am-error-text"></span></p>'

  var dropzone = document.getElementById('am-dropzone')
  var fileInput = document.getElementById('am-file')
  var settingsEl = document.getElementById('am-settings')
  var progressEl = document.getElementById('am-progress')
  var resultEl = document.getElementById('am-result')
  var preview = document.getElementById('am-preview')
  var downloadBtn = document.getElementById('am-download')
  var errorEl = document.getElementById('am-error')
  var errorText = document.getElementById('am-error-text')

  var files = []
  var resultBlob = null

  function showState(s) {
    dropzone.style.display = s === 'upload' ? '' : 'none'
    settingsEl.style.display = s === 'settings' ? '' : 'none'
    progressEl.style.display = s === 'progress' ? '' : 'none'
    resultEl.style.display = s === 'result' ? '' : 'none'
    errorEl.style.display = s === 'error' ? '' : 'none'
  }

  async function handleFiles(fl) {
    files = Array.from(fl)
    showState('settings')
  }

  async function process() {
    showState('progress')
    try {
      var delay = parseInt(document.getElementById('am-delay').value, 10) || 20
      var rgbaFrames = []
      var w = 0
      var h = 0

      if (files.length > 1) {
        for (var i = 0; i < files.length; i++) {
          var img = await loadImage(files[i])
          w = Math.max(w, img.naturalWidth)
          h = Math.max(h, img.naturalHeight)
        }
        for (var j = 0; j < files.length; j++) {
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
        var single = await loadImage(files[0])
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

      resultBlob = await encodeGifFrames(rgbaFrames, w, h, 0)

      if (format !== 'gif') {
        var ffmpegMod = await import('./ffmpeg-loader.js')
        var r = await ffmpegMod.loadFFmpeg()
        var ff = r.ff
        for (var k = 0; k < rgbaFrames.length; k++) {
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

      preview.src = URL.createObjectURL(resultBlob)
      showState('result')
    } catch (e) {
      errorText.textContent = e.message || String(e)
      showState('error')
    }
  }

  dropzone.addEventListener('click', function () { fileInput.click() })
  dropzone.addEventListener('dragover', function (e) { e.preventDefault() })
  dropzone.addEventListener('drop', function (e) { e.preventDefault(); if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files) })
  fileInput.addEventListener('change', function () { if (fileInput.files.length) handleFiles(fileInput.files) })
  document.getElementById('am-process').addEventListener('click', process)
  downloadBtn.addEventListener('click', function () {
    if (!resultBlob) return
    var a = document.createElement('a')
    a.href = URL.createObjectURL(resultBlob)
    var ext = format === 'gif' ? '.gif' : format === 'webp' ? '.webp' : format === 'apng' ? '.apng' : format === 'avif' ? '.avif' : '.jxl'
    a.download = format === 'gif' ? getGifOutputFilename(files[0]?.name || 'anim', suffix) : getVideoExtOutputFilename(files[0]?.name || 'anim', suffix, ext)
    a.click()
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
    '<div id="ef-progress" hidden><p id="ef-progress-text">Loading...</p><div class="tool-progress-bar"><div id="ef-progress-fill" class="tool-progress-fill"></div></div></div>' +
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
