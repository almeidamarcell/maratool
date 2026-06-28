import {
  computeGifStats,
  computeOverlayPosition,
  getCanvasFilterForEffect,
  computeStaticGifKeyframes,
  formatFrameFilename,
} from './ezgif-gif-ext-core.js'
import { combineLayoutDims, getGifOutputFilename } from './gif-anim-core.js'

var MAX_GIF = 50 * 1024 * 1024

async function loadGifuct() {
  var mod = await import('https://cdn.jsdelivr.net/npm/gifuct-js@2.1.2/+esm')
  return { parseGIF: mod.parseGIF, decompressFrames: mod.decompressFrames }
}

async function loadGifenc() {
  return import('https://cdn.jsdelivr.net/npm/gifenc@1.0.3/dist/gifenc.esm.js')
}

function compositeGifFrames(frames, w, h) {
  var canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  var ctx = canvas.getContext('2d')
  var result = []
  for (var i = 0; i < frames.length; i++) {
    var frame = frames[i]
    var patch = new ImageData(new Uint8ClampedArray(frame.patch), frame.dims.width, frame.dims.height)
    var tmp = document.createElement('canvas')
    tmp.width = frame.dims.width
    tmp.height = frame.dims.height
    tmp.getContext('2d').putImageData(patch, 0, 0)
    ctx.drawImage(tmp, frame.dims.left, frame.dims.top)
    var full = ctx.getImageData(0, 0, w, h)
    result.push({ rgba: new Uint8ClampedArray(full.data), delay: frame.delay })
    if (frame.disposalType === 2) {
      ctx.clearRect(frame.dims.left, frame.dims.top, frame.dims.width, frame.dims.height)
    }
  }
  return result
}

async function parseGifFile(file) {
  var buf = await file.arrayBuffer()
  var gifuct = await loadGifuct()
  var gif = gifuct.parseGIF(buf)
  var frames = gifuct.decompressFrames(gif, true)
  if (!frames || !frames.length) throw new Error('Could not read GIF frames.')
  var w = (gif.lsd && gif.lsd.width) || frames[0].dims.width
  var h = (gif.lsd && gif.lsd.height) || frames[0].dims.height
  return { frames: compositeGifFrames(frames, w, h), width: w, height: h, raw: gif }
}

async function encodeGifFrames(frameData, w, h, repeat) {
  var mod = await loadGifenc()
  var enc = mod.GIFEncoder()
  for (var i = 0; i < frameData.length; i++) {
    var rgba = frameData[i].rgba
    var palette = mod.quantize(rgba, 256)
    var indexed = mod.applyPalette(rgba, palette)
    var opts = { palette: palette, delay: Math.max(frameData[i].delay || 20, 20) }
    if (i === 0 && repeat !== undefined) opts.repeat = repeat
    enc.writeFrame(indexed, w, h, opts)
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
    '<div id="ge-progress" hidden><p id="ge-progress-text">Processing...</p></div>' +
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

  function showState(state) {
    dropzone.style.display = state === 'upload' ? '' : 'none'
    settingsEl.style.display = state === 'settings' ? '' : 'none'
    progressEl.style.display = state === 'progress' ? '' : 'none'
    resultEl.style.display = state === 'result' ? '' : 'none'
    errorEl.style.display = state === 'error' ? '' : 'none'
  }

  function showError(msg) {
    errorText.textContent = msg
    showState('error')
  }

  function buildSettings() {
    var html = ''
    if (mode === 'overlay') {
      html += '<button type="button" class="tool-btn tool-btn-secondary" id="ge-pick-overlay">Choose overlay image</button>'
      html += '<label class="tool-label">Position</label><select class="tool-input" id="ge-opt-pos"><option value="br">Bottom right</option><option value="mc">Center</option><option value="tl">Top left</option></select>'
    }
    if (mode === 'add-text') {
      html += '<label class="tool-label">Caption text</label><input class="tool-input" id="ge-opt-text" type="text" value="Hello" />'
      html += '<label class="tool-label">Font size</label><input class="tool-input" id="ge-opt-font" type="number" value="24" min="10" max="72" />'
    }
    if (mode === 'effects') {
      html += '<label class="tool-label">Effect</label><select class="tool-input" id="ge-opt-effect"><option value="grayscale">Grayscale</option><option value="sepia">Sepia</option><option value="invert">Invert</option><option value="blur">Blur</option></select>'
    }
    if (mode === 'combine') {
      html += '<label class="tool-label">Layout</label><select class="tool-input" id="ge-opt-layout"><option value="horizontal">Side by side</option><option value="vertical">Stacked</option></select>'
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
    showState('progress')
    try {
      if (mode === 'analyzer') {
        var parsed0 = await parseGifFile(gifFiles[0])
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
        var parsedF = await parseGifFile(gifFiles[0])
        framesEl.style.display = 'flex'
        framesEl.innerHTML = ''
        preview.style.display = 'none'
        frameBlobs = []
        for (var fi = 0; fi < parsedF.frames.length; fi++) {
          var c = document.createElement('canvas')
          c.width = parsedF.width
          c.height = parsedF.height
          c.getContext('2d').putImageData(new ImageData(parsedF.frames[fi].rgba, parsedF.width, parsedF.height), 0, 0)
          var blob = await new Promise(function (res) { c.toBlob(res, 'image/png') })
          frameBlobs.push(blob)
          var thumb = document.createElement('img')
          thumb.src = URL.createObjectURL(blob)
          thumb.style.width = '80px'
          thumb.alt = 'Frame ' + (fi + 1)
          framesEl.appendChild(thumb)
        }
        downloadBtn.textContent = 'Download all (ZIP)'
        showState('result')
        return
      }

      var parsed = await parseGifFile(gifFiles[0])
      var outFrames = parsed.frames
      var outW = parsed.width
      var outH = parsed.height

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
        var parsedB = await parseGifFile(gifFiles[1])
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

      resultBlob = await encodeGifFrames(outFrames, outW, outH)
      preview.src = URL.createObjectURL(resultBlob)
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
  dropzone.addEventListener('dragover', function (e) { e.preventDefault() })
  dropzone.addEventListener('drop', function (e) {
    e.preventDefault()
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
  })
  fileInput.addEventListener('change', function () {
    if (fileInput.files.length) handleFiles(fileInput.files)
  })

  downloadBtn.addEventListener('click', async function () {
    if (mode === 'to-frames' && frameBlobs.length) {
      var stem = gifFiles[0].name.replace(/\.gif$/i, '')
      for (var i = 0; i < frameBlobs.length; i++) {
        var a = document.createElement('a')
        a.href = URL.createObjectURL(frameBlobs[i])
        a.download = formatFrameFilename(stem, i + 1, frameBlobs.length, '.png')
        a.click()
      }
      return
    }
    if (!resultBlob) return
    var a2 = document.createElement('a')
    a2.href = URL.createObjectURL(resultBlob)
    a2.download = getGifOutputFilename(gifFiles[0].name, suffix)
    a2.click()
  })

  showState('upload')
}

export { parseGifFile, encodeGifFrames, compositeGifFrames }
