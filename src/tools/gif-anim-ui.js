import {
  reverseFrameOrder,
  scaleDelays,
  cutFramesByTime,
  pingPongFrames,
  shuffleFrames,
  extendToDuration,
  computeResizeDims,
  computeCropRegion,
  getGifOutputFilename,
} from './gif-anim-core.js'
import { computeScaledDims } from './gif-compressor-core.js'

var MAX_FILE_SIZE = 50 * 1024 * 1024

export function applyGifOperation(op, frames, delays, opts) {
  switch (op) {
    case 'reverse':
      return { frames: reverseFrameOrder(frames), delays: reverseFrameOrder(delays) }
    case 'speed':
      return { frames: frames.slice(), delays: scaleDelays(delays, opts.speedPercent || 100) }
    case 'cut':
      return cutFramesByTime(frames, delays, (opts.startSec || 0) * 1000, (opts.endSec || 0) * 1000)
    case 'ping-pong':
      return { frames: pingPongFrames(frames), delays: pingPongFrames(delays) }
    case 'randomize':
      return { frames: shuffleFrames(frames), delays: shuffleFrames(delays) }
    case 'extend':
      return extendToDuration(frames, delays, (opts.targetSec || 5) * 1000)
    default:
      return { frames: frames.slice(), delays: delays.slice() }
  }
}

export function getResizeTargetDims(srcW, srcH, opts) {
  var tw = parseInt(opts.width, 10) || srcW
  var th = parseInt(opts.height, 10) || srcH
  if (opts.width && !opts.height) {
    return computeScaledDims(srcW, srcH, Math.round((tw / srcW) * 100))
  }
  return computeResizeDims(srcW, srcH, tw, th, opts.mode || 'contain')
}

export function getCropRegionForFrame(srcW, srcH, opts) {
  return computeCropRegion(
    srcW,
    srcH,
    parseInt(opts.cropW, 10) || srcW,
    parseInt(opts.cropH, 10) || srcH,
    parseInt(opts.cropX, 10) || 0,
    parseInt(opts.cropY, 10) || 0,
  )
}

export function initGifAnimTool(config) {
  var op = config.op
  var suffix = config.suffix || op
  var prefix = config.prefix || 'ga'

  var dropzone = document.getElementById(prefix + '-dropzone')
  var fileInput = document.getElementById(prefix + '-file-input')
  var settingsEl = document.getElementById(prefix + '-settings')
  var processBtn = document.getElementById(prefix + '-process')
  var progressEl = document.getElementById(prefix + '-progress')
  var progressText = document.getElementById(prefix + '-progress-text')
  var progressFill = document.getElementById(prefix + '-progress-fill')
  var resultEl = document.getElementById(prefix + '-result')
  var previewImg = document.getElementById(prefix + '-preview')
  var resultImg = document.getElementById(prefix + '-result-img')
  var downloadBtn = document.getElementById(prefix + '-download')
  var errorEl = document.getElementById(prefix + '-error')
  var errorText = document.getElementById(prefix + '-error-text')

  var parsedFrames = null
  var gifWidth = 0
  var gifHeight = 0
  var currentFile = null
  var resultBlobUrl = null

  function showState(state) {
    if (dropzone) dropzone.style.display = state === 'upload' ? '' : 'none'
    if (settingsEl) settingsEl.style.display = state === 'settings' ? '' : 'none'
    if (progressEl) progressEl.style.display = state === 'progress' ? '' : 'none'
    if (resultEl) resultEl.style.display = state === 'result' ? '' : 'none'
    if (errorEl) errorEl.style.display = state === 'error' ? '' : 'none'
  }

  function showError(msg) {
    if (errorText) errorText.textContent = msg
    showState('error')
  }

  function readOpts() {
    var opts = {}
    document.querySelectorAll('[data-ga-opt]').forEach(function (el) {
      opts[el.dataset.gaOpt] = el.type === 'number' ? parseFloat(el.value) : el.value
    })
    return opts
  }

  async function loadGifuct() {
    var mod = await import('https://cdn.jsdelivr.net/npm/gifuct-js@2.1.2/+esm')
    return { parseGIF: mod.parseGIF, decompressFrames: mod.decompressFrames }
  }

  function compositeFrames(frames, w, h) {
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
    return { frames: compositeFrames(frames, w, h), width: w, height: h }
  }

  async function encodeGif(frameData, w, h) {
    var gifencMod = await import('https://cdn.jsdelivr.net/npm/gifenc@1.0.3/dist/gifenc.esm.js')
    var enc = gifencMod.GIFEncoder()
    var quantize = gifencMod.quantize
    var applyPalette = gifencMod.applyPalette
    for (var i = 0; i < frameData.length; i++) {
      var rgba = frameData[i].rgba
      if (op === 'resizer') {
        rgba = await scaleRgba(rgba, w, h, frameData[i]._outW, frameData[i]._outH)
      } else if (op === 'cropper') {
        rgba = cropRgba(rgba, w, h, frameData[i]._crop)
      } else if (op === 'rotate' && frameData[i]._angle) {
        rgba = rotateRgba(rgba, w, h, frameData[i]._angle)
      }
      var outW = frameData[i]._outW || w
      var outH = frameData[i]._outH || h
      var palette = quantize(rgba, 256)
      var indexed = applyPalette(rgba, palette)
      enc.writeFrame(indexed, outW, outH, { palette: palette, delay: Math.max(frameData[i].delay || 20, 20) })
    }
    enc.finish()
    return new Blob([enc.bytes()], { type: 'image/gif' })
  }

  function scaleRgba(rgba, w, h, outW, outH) {
    return new Promise(function (resolve) {
      var c = document.createElement('canvas')
      c.width = w
      c.height = h
      c.getContext('2d').putImageData(new ImageData(rgba, w, h), 0, 0)
      var c2 = document.createElement('canvas')
      c2.width = outW
      c2.height = outH
      c2.getContext('2d').drawImage(c, 0, 0, outW, outH)
      resolve(c2.getContext('2d').getImageData(0, 0, outW, outH).data)
    })
  }

  function cropRgba(rgba, w, h, crop) {
    var c = document.createElement('canvas')
    c.width = w
    c.height = h
    c.getContext('2d').putImageData(new ImageData(rgba, w, h), 0, 0)
    var c2 = document.createElement('canvas')
    c2.width = crop.width
    c2.height = crop.height
    c2.getContext('2d').drawImage(c, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height)
    return c2.getContext('2d').getImageData(0, 0, crop.width, crop.height).data
  }

  function rotateRgba(rgba, w, h, angle) {
    var c = document.createElement('canvas')
    c.width = w
    c.height = h
    c.getContext('2d').putImageData(new ImageData(rgba, w, h), 0, 0)
    var rad = (angle * Math.PI) / 180
    var c2 = document.createElement('canvas')
    c2.width = angle % 180 === 0 ? w : h
    c2.height = angle % 180 === 0 ? h : w
    var ctx = c2.getContext('2d')
    ctx.translate(c2.width / 2, c2.height / 2)
    ctx.rotate(rad)
    ctx.drawImage(c, -w / 2, -h / 2)
    return c2.getContext('2d').getImageData(0, 0, c2.width, c2.height).data
  }

  async function handleFile(file) {
    if (!file || file.type !== 'image/gif') {
      showError('Please select a GIF file.')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      showError('File too large. Maximum is 50 MB.')
      return
    }
    currentFile = file
    showState('progress')
    if (progressText) progressText.textContent = 'Reading GIF...'
    try {
      var parsed = await parseGifFile(file)
      parsedFrames = parsed.frames
      gifWidth = parsed.width
      gifHeight = parsed.height
      if (previewImg) previewImg.src = URL.createObjectURL(file)
      showState('settings')
    } catch (e) {
      showError(e.message || String(e))
    }
  }

  async function process() {
    if (!parsedFrames || !parsedFrames.length) return
    showState('progress')
    if (progressText) progressText.textContent = 'Processing...'
  var opts = readOpts()
    var rgbaFrames = parsedFrames.map(function (f) { return { rgba: f.rgba, delay: f.delay } })
    var delays = rgbaFrames.map(function (f) { return f.delay })
    var simpleFrames = rgbaFrames

    if (op === 'resizer') {
      var dims = getResizeTargetDims(gifWidth, gifHeight, opts)
      simpleFrames = rgbaFrames.map(function (f) {
        return Object.assign({}, f, { _outW: dims.width, _outH: dims.height })
      })
    } else if (op === 'cropper') {
      var crop = getCropRegionForFrame(gifWidth, gifHeight, opts)
      if (!crop) { showError('Invalid crop region.'); return }
      simpleFrames = rgbaFrames.map(function (f) {
        return Object.assign({}, f, { _crop: crop, _outW: crop.width, _outH: crop.height })
      })
    } else if (op === 'rotate') {
      var angle = parseInt(opts.angle, 10) || 90
      simpleFrames = rgbaFrames.map(function (f) {
        return Object.assign({}, f, { _angle: angle, _outW: angle % 180 === 0 ? gifWidth : gifHeight, _outH: angle % 180 === 0 ? gifHeight : gifWidth })
      })
    } else {
      var applied = applyGifOperation(op, rgbaFrames, delays, opts)
      simpleFrames = applied.frames
      delays = applied.delays
      simpleFrames = simpleFrames.map(function (f, i) {
        return Object.assign({}, f, { delay: delays[i] || f.delay })
      })
    }

    try {
      if (progressFill) progressFill.style.width = '50%'
      var blob = await encodeGif(simpleFrames, gifWidth, gifHeight)
      if (resultBlobUrl) URL.revokeObjectURL(resultBlobUrl)
      resultBlobUrl = URL.createObjectURL(blob)
      if (resultImg) resultImg.src = resultBlobUrl
      if (progressFill) progressFill.style.width = '100%'
      showState('result')
    } catch (e) {
      showError('Processing failed: ' + (e.message || String(e)))
    }
  }

  if (dropzone) {
    dropzone.addEventListener('click', function () { fileInput.click() })
    dropzone.addEventListener('dragover', function (e) { e.preventDefault() })
    dropzone.addEventListener('drop', function (e) {
      e.preventDefault()
      if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0])
    })
  }
  if (fileInput) {
    fileInput.addEventListener('change', function () {
      if (fileInput.files[0]) handleFile(fileInput.files[0])
    })
  }
  if (processBtn) processBtn.addEventListener('click', process)
  if (downloadBtn) {
    downloadBtn.addEventListener('click', function () {
      if (!resultBlobUrl || !currentFile) return
      var a = document.createElement('a')
      a.href = resultBlobUrl
      a.download = getGifOutputFilename(currentFile.name, suffix)
      a.click()
    })
  }

  showState('upload')
}
