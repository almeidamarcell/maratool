import {
  computeGifStats,
  computeOverlayPosition,
  getCanvasFilterForEffect,
  computeStaticGifKeyframes,
  formatFrameFilename,
} from './ezgif-gif-ext-core.js'
import { combineLayoutDims, getGifOutputFilename } from './gif-anim-core.js'
import { downloadBlob, setVisible, nextPaint, makeProgress, formatSize } from './tool-utils.js'
import { streamGifFrames } from './gif-shared.js'

var MAX_GIF = 50 * 1024 * 1024

async function loadGifenc() {
  return import('https://cdn.jsdelivr.net/npm/gifenc@1.0.3/dist/gifenc.esm.js')
}

// Delegates to the shared streaming decoder so a large GIF costs one
// source-size canvas instead of every frame at once. Keeps this module's
// { frames, width, height, raw } shape for its callers.
//
// onProgress(done, total) is optional and forwarded to the decoder. Streaming
// a large GIF is the slowest step in every one of these tools, so without it
// the progress panel sits frozen for the whole decode.
async function parseGifFile(file, onProgress) {
  var r = await streamGifFrames(file, onProgress ? { onProgress: onProgress } : undefined)
  return { frames: r.parsedFrames, width: r.width, height: r.height, raw: r.gif, notice: r.notice }
}

async function encodeGifFrames(frameData, w, h, repeat, onProgress) {
  var mod = await loadGifenc()
  var enc = mod.GIFEncoder()
  for (var i = 0; i < frameData.length; i++) {
    var rgba = frameData[i].rgba
    var palette = mod.quantize(rgba, 256)
    var indexed = mod.applyPalette(rgba, palette)
    var opts = { palette: palette, delay: Math.max(frameData[i].delay || 20, 20) }
    if (i === 0 && repeat !== undefined) opts.repeat = repeat
    enc.writeFrame(indexed, w, h, opts)
    // Quantizing a frame blocks the main thread for tens of milliseconds; yield
    // between frames so the progress bar actually advances on screen.
    if (onProgress) {
      onProgress((i + 1) / frameData.length, i + 1, frameData.length)
      await nextPaint()
    }
  }
  enc.finish()
  return new Blob([enc.bytes()], { type: 'image/gif' })
}

export function initGifExtTool(config) {
  var mode = config.mode
  var suffix = config.suffix || mode
  var root = document.getElementById('ez-root')
  if (!root) return

  var multi = mode === 'combine'
  var extraInput = mode === 'overlay' ? '<input type="file" id="ei-overlay-file" accept="image/*" hidden />' : ''

  root.innerHTML =
    '<div class="ge-dropzone tool-dropzone" id="ge-dropzone">' +
      '<input type="file" id="ge-file" hidden accept="image/gif" ' + (multi ? 'multiple' : '') + ' />' +
      extraInput +
      '<p>Drop GIF' + (multi ? 's' : '') + ' or click to upload</p>' +
    '</div>' +
    '<div id="ge-settings" hidden></div>' +
    '<div id="ge-progress" class="tool-progress" hidden>' +
      '<p id="ge-progress-text" class="tool-progress-text">Reading GIF…</p>' +
      '<div class="tool-progress-bar"><div id="ge-progress-fill" class="tool-progress-fill"></div></div>' +
      '<p id="ge-progress-detail" class="tool-progress-detail"></p>' +
    '</div>' +
    '<div id="ge-result" hidden>' +
      '<img id="ge-preview" alt="Result" style="max-width:100%;" />' +
      '<pre id="ge-stats" class="tool-hint" style="white-space:pre-wrap;display:none;"></pre>' +
      '<div id="ge-frames" style="display:none;flex-wrap:wrap;gap:8px;"></div>' +
      '<button type="button" class="tool-btn" id="ge-download" style="margin-top:1rem;">Download</button>' +
    '</div>' +
    '<p id="ge-error" class="tool-error" hidden><span id="ge-error-text"></span></p>'

  var dropzone = document.getElementById('ge-dropzone')
  var fileInput = document.getElementById('ge-file')
  var settingsEl = document.getElementById('ge-settings')
  var progressEl = document.getElementById('ge-progress')
  var progressDetail = document.getElementById('ge-progress-detail')
  var progress = makeProgress(
    document.getElementById('ge-progress-text'),
    document.getElementById('ge-progress-fill')
  )
  var resultEl = document.getElementById('ge-result')
  var preview = document.getElementById('ge-preview')
  var statsEl = document.getElementById('ge-stats')
  var framesEl = document.getElementById('ge-frames')
  var downloadBtn = document.getElementById('ge-download')
  var errorEl = document.getElementById('ge-error')
  var errorText = document.getElementById('ge-error-text')

  var gifFiles = []
  var overlayImg = null
  var resultBlob = null
  var frameBlobs = []
  var lastPreviewUrl = null
  var frameUrls = []

  function showState(state) {
    setVisible(dropzone, state === 'upload')
    setVisible(settingsEl, state === 'settings')
    setVisible(progressEl, state === 'progress')
    setVisible(resultEl, state === 'result')
    setVisible(errorEl, state === 'error')
    if (state !== 'progress') progress.reset()
  }

  function showError(msg) {
    errorText.textContent = msg
    showState('error')
  }

  function setDetail(text) {
    if (progressDetail) progressDetail.textContent = text || ''
  }

  // Streaming a large GIF is the slowest step in every one of these tools.
  // streamGifFrames reports (done, total) frames as it composites them.
  function decodeProgress(label) {
    return function (done, total) {
      progress.set(label, total ? done / total : 0)
      setDetail('Frame ' + (done + 1) + ' of ' + total)
    }
  }

  function buildSettings() {
    var html = ''
    if (mode === 'overlay') {
      html += '<button type="button" class="tool-btn tool-btn-secondary" id="ge-pick-overlay">Choose overlay image</button>'
      html += '<label class="tool-label" for="ge-opt-pos">Position</label><select class="tool-input" id="ge-opt-pos"><option value="br">Bottom right</option><option value="mc">Center</option><option value="tl">Top left</option></select>'
    }
    if (mode === 'add-text') {
      html += '<label class="tool-label" for="ge-opt-text">Caption text</label><input class="tool-input" id="ge-opt-text" type="text" value="Hello" />'
      html += '<label class="tool-label" for="ge-opt-font">Font size</label><input class="tool-input" id="ge-opt-font" type="number" value="24" min="10" max="72" />'
    }
    if (mode === 'effects') {
      html += '<label class="tool-label" for="ge-opt-effect">Effect</label><select class="tool-input" id="ge-opt-effect"><option value="grayscale">Grayscale</option><option value="sepia">Sepia</option><option value="invert">Invert</option><option value="blur">Blur</option></select>'
    }
    if (mode === 'combine') {
      html += '<label class="tool-label" for="ge-opt-layout">Layout</label><select class="tool-input" id="ge-opt-layout"><option value="horizontal">Side by side</option><option value="vertical">Stacked</option></select>'
    }
    if (mode !== 'analyzer') {
      html += '<button type="button" class="tool-btn" id="ge-process" style="margin-top:1rem;">Process</button>'
    }
    settingsEl.innerHTML = html
    var overlayBtn = document.getElementById('ge-pick-overlay')
    if (overlayBtn) {
      overlayBtn.addEventListener('click', function () {
        var inp = document.getElementById('ei-overlay-file') || document.getElementById('ge-overlay-file')
        if (!inp) {
          inp = document.createElement('input')
          inp.type = 'file'
          inp.id = 'ge-overlay-file'
          inp.accept = 'image/*'
          inp.hidden = true
          root.appendChild(inp)
          inp.addEventListener('change', function () {
            if (!inp.files[0]) return
            var reader = new FileReader()
            reader.onload = function () {
              var img = new Image()
              img.onload = function () { overlayImg = img }
              img.src = reader.result
            }
            reader.readAsDataURL(inp.files[0])
          })
        }
        inp.click()
      })
    }
    var btn = document.getElementById('ge-process')
    if (btn) btn.addEventListener('click', process)
    if (mode === 'analyzer') process()
  }

  async function process() {
    if (!gifFiles.length) return
    progress.set('Decoding GIF…', 0)
    setDetail(gifFiles[0].name + ' · ' + formatSize(gifFiles[0].size))
    showState('progress')
    await nextPaint()
    try {
      if (mode === 'analyzer') {
        var parsed0 = await parseGifFile(gifFiles[0], decodeProgress('Decoding GIF…'))
        var delays = parsed0.frames.map(function (f) { return f.delay })
        var stats = computeGifStats(parsed0.frames.length, delays, parsed0.width, parsed0.height)
        statsEl.style.display = ''
        preview.style.display = 'none'
        downloadBtn.style.display = 'none'
        statsEl.textContent = 'Frames: ' + stats.frameCount + '\nSize: ' + parsed0.width + '×' + parsed0.height +
          '\nDuration: ' + (stats.durationMs / 1000).toFixed(2) + 's\nAvg delay: ' + stats.avgDelayCs + ' cs\nFPS: ' + stats.fps
        showState('result')
        return
      }

      if (mode === 'to-frames') {
        var parsedF = await parseGifFile(gifFiles[0], decodeProgress('Decoding GIF…'))
        framesEl.style.display = 'flex'
        framesEl.innerHTML = ''
        preview.style.display = 'none'
        frameBlobs = []
        frameUrls.forEach(function (u) { URL.revokeObjectURL(u) })
        frameUrls = []
        for (var fi = 0; fi < parsedF.frames.length; fi++) {
          progress.set('Extracting frames…', fi / parsedF.frames.length)
          setDetail('Frame ' + (fi + 1) + ' of ' + parsedF.frames.length)
          var c = document.createElement('canvas')
          c.width = parsedF.width
          c.height = parsedF.height
          c.getContext('2d').putImageData(new ImageData(parsedF.frames[fi].rgba, parsedF.width, parsedF.height), 0, 0)
          var blob = await new Promise(function (res) { c.toBlob(res, 'image/png') })
          frameBlobs.push(blob)
          var thumb = document.createElement('img')
          var thumbUrl = URL.createObjectURL(blob)
          frameUrls.push(thumbUrl)
          thumb.src = thumbUrl
          thumb.style.width = '80px'
          thumb.alt = 'Frame ' + (fi + 1)
          framesEl.appendChild(thumb)
        }
        downloadBtn.textContent = 'Download all (ZIP)'
        showState('result')
        return
      }

      var parsed = await parseGifFile(gifFiles[0], decodeProgress('Decoding GIF…'))
      var outFrames = parsed.frames
      var outW = parsed.width
      var outH = parsed.height

      progress.pending('Applying changes…')
      setDetail(parsed.frames.length + ' frames · ' + parsed.width + '×' + parsed.height)
      await nextPaint()

      if (mode === 'effects') {
        var effect = document.getElementById('ge-opt-effect')?.value || 'grayscale'
        var filter = getCanvasFilterForEffect(effect)
        outFrames = outFrames.map(function (f) {
          var c = document.createElement('canvas')
          c.width = outW; c.height = outH
          var cx = c.getContext('2d')
          cx.filter = filter
          cx.putImageData(new ImageData(f.rgba, outW, outH), 0, 0)
          return { rgba: cx.getImageData(0, 0, outW, outH).data, delay: f.delay }
        })
      }

      if (mode === 'add-text') {
        var text = document.getElementById('ge-opt-text')?.value || ''
        var fontSize = parseInt(document.getElementById('ge-opt-font')?.value, 10) || 24
        outFrames = outFrames.map(function (f) {
          var c = document.createElement('canvas')
          c.width = outW; c.height = outH
          var cx = c.getContext('2d')
          cx.putImageData(new ImageData(f.rgba, outW, outH), 0, 0)
          cx.fillStyle = 'rgba(255,255,255,0.85)'
          cx.fillRect(0, outH - fontSize - 16, outW, fontSize + 16)
          cx.fillStyle = '#000'
          cx.font = 'bold ' + fontSize + 'px Inter, sans-serif'
          cx.fillText(text, 12, outH - 12)
          return { rgba: cx.getImageData(0, 0, outW, outH).data, delay: f.delay }
        })
      }

      if (mode === 'overlay' && overlayImg) {
        var pos = document.getElementById('ge-opt-pos')?.value || 'br'
        var ow = Math.round(outW * 0.25)
        var oh = Math.round(overlayImg.naturalHeight * (ow / overlayImg.naturalWidth))
        var offset = computeOverlayPosition(outW, outH, ow, oh, pos, 8)
        outFrames = outFrames.map(function (f) {
          var c = document.createElement('canvas')
          c.width = outW; c.height = outH
          var cx = c.getContext('2d')
          cx.putImageData(new ImageData(f.rgba, outW, outH), 0, 0)
          cx.drawImage(overlayImg, offset.x, offset.y, ow, oh)
          return { rgba: cx.getImageData(0, 0, outW, outH).data, delay: f.delay }
        })
      }

      if (mode === 'combine' && gifFiles.length >= 2) {
        var parsedB = await parseGifFile(gifFiles[1], decodeProgress('Decoding second GIF…'))
        var layout = document.getElementById('ge-opt-layout')?.value || 'horizontal'
        var sizes = [{ w: parsed.width, h: parsed.height }, { w: parsedB.width, h: parsedB.height }]
        var dims = combineLayoutDims(layout, sizes)
        outW = dims.width
        outH = dims.height
        var maxLen = Math.max(parsed.frames.length, parsedB.frames.length)
        outFrames = []
        for (var i = 0; i < maxLen; i++) {
          var fa = parsed.frames[i % parsed.frames.length]
          var fb = parsedB.frames[i % parsedB.frames.length]
          var c2 = document.createElement('canvas')
          c2.width = outW; c2.height = outH
          var cx2 = c2.getContext('2d')
          cx2.fillStyle = '#fff'
          cx2.fillRect(0, 0, outW, outH)
          if (layout === 'vertical') {
            cx2.putImageData(new ImageData(fa.rgba, parsed.width, parsed.height), 0, 0)
            cx2.putImageData(new ImageData(fb.rgba, parsedB.width, parsedB.height), 0, parsed.height)
          } else {
            cx2.putImageData(new ImageData(fa.rgba, parsed.width, parsed.height), 0, 0)
            cx2.putImageData(new ImageData(fb.rgba, parsedB.width, parsedB.height), parsed.width, 0)
          }
          outFrames.push({ rgba: cx2.getContext('2d').getImageData(0, 0, outW, outH).data, delay: fa.delay })
        }
      }

      resultBlob = await encodeGifFrames(outFrames, outW, outH, undefined, function (ratio, done, total) {
        progress.set('Encoding GIF…', ratio)
        setDetail('Frame ' + done + ' of ' + total)
      })
      if (lastPreviewUrl) URL.revokeObjectURL(lastPreviewUrl)
      lastPreviewUrl = URL.createObjectURL(resultBlob)
      preview.src = lastPreviewUrl
      preview.style.display = ''
      statsEl.style.display = 'none'
      framesEl.style.display = 'none'
      downloadBtn.textContent = 'Download'
      showState('result')
    } catch (e) {
      showError(e.message || String(e))
    }
  }

  async function handleFiles(files) {
    gifFiles = []
    for (var i = 0; i < files.length; i++) {
      if (files[i].type !== 'image/gif') { showError('Please upload GIF files.'); return }
      if (files[i].size > MAX_GIF) { showError('GIF too large (max 50 MB).'); return }
      gifFiles.push(files[i])
    }
    buildSettings()
    showState('settings')
  }

  dropzone.addEventListener('click', function () { fileInput.click() })
  dropzone.addEventListener('dragover', function (e) {
    e.preventDefault()
    dropzone.classList.add('drag-over')
  })
  dropzone.addEventListener('dragleave', function () { dropzone.classList.remove('drag-over') })
  dropzone.addEventListener('drop', function (e) {
    e.preventDefault()
    dropzone.classList.remove('drag-over')
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
  })
  fileInput.addEventListener('change', function () {
    if (fileInput.files.length) handleFiles(fileInput.files)
  })

  downloadBtn.addEventListener('click', async function () {
    if (mode === 'to-frames' && frameBlobs.length) {
      var stem = gifFiles[0].name.replace(/\.gif$/i, '')
      for (var i = 0; i < frameBlobs.length; i++) {
        downloadBlob(frameBlobs[i], formatFrameFilename(stem, i + 1, frameBlobs.length, '.png'))
      }
      return
    }
    if (!resultBlob) return
    downloadBlob(resultBlob, getGifOutputFilename(gifFiles[0].name, suffix))
  })

  showState('upload')
}

export { parseGifFile, encodeGifFrames }
