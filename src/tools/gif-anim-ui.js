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
  normalizeLoopCount,
  decodedSizeError,
  rewriteGifDelays,
  computeFitPlan,
  describeFitPlan,
} from './gif-anim-core.js'
import { computeScaledDims, mergeDelays } from './gif-compressor-core.js'

var MAX_FILE_SIZE = 50 * 1024 * 1024
// MAX_FILE_SIZE only caps the *compressed* bytes. We hold every frame as
// composited RGBA, so memory tracks width × height × frames × 4 — a 900 KB GIF
// at 2808×1650 decodes to 1.2 GB and takes the whole tab down with it
// ("Aw, Snap! Error code: 5"). Budget the decoded size instead.
var MAX_DECODED_PIXELS = 120e6
// Thrown to unwind a decode whose upload has been superseded.
var STALE_LOAD = 'gif-anim:stale-load'

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
    case 'loop-count':
      return { frames: frames.slice(), delays: delays.slice(), loopCount: normalizeLoopCount(opts.loopCount) }
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

// scale is the decoded-to-original ratio. The crop box the user typed is in
// original coordinates, so it has to be mapped down when the GIF was shrunk to
// fit memory — otherwise a crop at x=2000 lands outside a 702px-wide frame.
export function getCropRegionForFrame(srcW, srcH, opts, scale) {
  var s = scale && scale > 0 ? scale : 1
  var map = function (v, fallback) {
    var n = parseInt(v, 10)
    if (!n) return fallback
    return Math.max(1, Math.round(n * s))
  }
  return computeCropRegion(
    srcW,
    srcH,
    map(opts.cropW, srcW),
    map(opts.cropH, srcH),
    s === 1 ? parseInt(opts.cropX, 10) || 0 : Math.round((parseInt(opts.cropX, 10) || 0) * s),
    s === 1 ? parseInt(opts.cropY, 10) || 0 : Math.round((parseInt(opts.cropY, 10) || 0) * s),
  )
}

// Show or hide a state container.
//
// Exported so the `hidden`-attribute contract is pinned by a test: global CSS
// carries `[hidden] { display: none !important }`, so clearing the inline
// display is not enough to reveal an element that shipped with the attribute.
// Getting this wrong left every GIF tool looking dead after upload.
export function setVisible(el, visible) {
  if (!el) return
  el.hidden = !visible
  el.style.display = visible ? '' : 'none'
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
  var rawBytes = null
  var previewBlobUrl = null
  var fitNoticeEl = null
  var loadSeq = 0
  // Ratio of decoded size to original size. 1 unless the GIF had to be shrunk
  // to fit memory, in which case coordinates the user typed (crop box) refer to
  // the original and have to be mapped onto the smaller decoded frames.
  var decodeScale = 1

  // Speed is timing metadata, so it can be rewritten straight in the byte
  // stream. That skips the decode entirely, which is the only way a big GIF
  // (2808×1650 × 597 frames = 10.3 GB decoded) can be processed at all.
  var isByteRewrite = op === 'speed'

  function showState(state) {
    setVisible(dropzone, state === 'upload')
    setVisible(settingsEl, state === 'settings')
    setVisible(progressEl, state === 'progress')
    setVisible(resultEl, state === 'result')
    setVisible(errorEl, state === 'error')
  }

  function showError(msg) {
    if (errorText) errorText.textContent = msg
    showState('error')
  }

  // Never shrink a GIF without saying so — silently returning a 702×413 result
  // for a 2808×1650 input would look like the tool mangled the file.
  function showFitNotice(message) {
    if (!settingsEl) return
    if (!message) {
      if (fitNoticeEl) fitNoticeEl.hidden = true
      return
    }
    if (!fitNoticeEl) {
      fitNoticeEl = document.createElement('p')
      fitNoticeEl.className = 'tool-note'
      fitNoticeEl.id = prefix + '-fit-notice'
      settingsEl.insertBefore(fitNoticeEl, settingsEl.firstChild)
    }
    fitNoticeEl.hidden = false
    fitNoticeEl.textContent = message
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
    return { parseGIF: mod.parseGIF, decompressFrame: mod.decompressFrame }
  }

  // Decode one frame at a time, shrink it to the plan's size, and drop the
  // full-resolution copy before moving on. Only a single full-size composite
  // canvas stays alive, so peak memory is one frame instead of all of them —
  // the difference between 17.7 MB and 10.3 GB on a 2808×1650 × 597 GIF.
  //
  // Compositing has to run over *every* frame even when frames are being
  // dropped: GIF frames are deltas, so skipping a decode would leave holes in
  // the frames that are kept.
  async function streamFrames(gifuct, gif, imageFrames, plan, isCurrent) {
    var canvas = document.createElement('canvas')
    canvas.width = plan.sourceWidth
    canvas.height = plan.sourceHeight
    var ctx = canvas.getContext('2d', { willReadFrequently: true })
    var patchCanvas = document.createElement('canvas')
    var patchCtx = patchCanvas.getContext('2d', { willReadFrequently: true })
    var out = document.createElement('canvas')
    out.width = plan.width
    out.height = plan.height
    var outCtx = out.getContext('2d', { willReadFrequently: true })

    var kept = []
    var allDelays = []
    for (var i = 0; i < imageFrames.length; i++) {
      var frame = gifuct.decompressFrame(imageFrames[i], gif.gct, true)
      var d = frame.dims
      patchCanvas.width = d.width
      patchCanvas.height = d.height
      patchCtx.putImageData(new ImageData(new Uint8ClampedArray(frame.patch), d.width, d.height), 0, 0)
      ctx.drawImage(patchCanvas, d.left, d.top)
      allDelays.push(frame.delay)

      if (i % plan.skip === 0) {
        outCtx.clearRect(0, 0, plan.width, plan.height)
        outCtx.drawImage(canvas, 0, 0, plan.sourceWidth, plan.sourceHeight, 0, 0, plan.width, plan.height)
        kept.push({
          rgba: new Uint8ClampedArray(outCtx.getImageData(0, 0, plan.width, plan.height).data),
          delay: frame.delay,
        })
      }
      if (frame.disposalType === 2) ctx.clearRect(d.left, d.top, d.width, d.height)
      frame.patch = null
      frame.pixels = null

      // Decoding 597 frames takes tens of seconds; without yielding the tab
      // just locks up and looks crashed, which is the bug we started from.
      if (i % 8 === 0) {
        // A second upload during this decode makes the whole run pointless.
        // Bail instead of burning another minute of CPU on a discarded result.
        if (isCurrent && !isCurrent()) throw new Error(STALE_LOAD)
        if (progressText) {
          progressText.textContent = 'Reading GIF... ' + Math.round((i / imageFrames.length) * 100) + '%'
        }
        if (progressFill) progressFill.style.width = Math.round((i / imageFrames.length) * 100) + '%'
        await new Promise(function (r) { setTimeout(r, 0) })
      }
    }

    // Frames that were dropped hand their delay to the frame that survived,
    // so the animation still runs for its original length.
    var merged = mergeDelays(allDelays, plan.skip)
    for (var k = 0; k < kept.length; k++) {
      if (merged[k] !== undefined) kept[k].delay = merged[k]
    }
    return kept
  }

  async function parseGifFile(file, isCurrent) {
    var buf = await file.arrayBuffer()
    var gifuct = await loadGifuct()
    var gif = gifuct.parseGIF(buf)
    var imageFrames = (gif.frames || []).filter(function (f) { return f.image })
    if (!imageFrames.length) throw new Error('Could not read GIF frames.')
    var w = (gif.lsd && gif.lsd.width) || imageFrames[0].dims.width
    var h = (gif.lsd && gif.lsd.height) || imageFrames[0].dims.height

    var plan = computeFitPlan(w, h, imageFrames.length, MAX_DECODED_PIXELS)
    if (!plan) {
      throw new Error(decodedSizeError(w, h, imageFrames.length, MAX_DECODED_PIXELS))
    }
    plan.sourceWidth = w
    plan.sourceHeight = h

    var frames = await streamFrames(gifuct, gif, imageFrames, plan, isCurrent)
    return { frames: frames, width: plan.width, height: plan.height, plan: plan }
  }

  async function encodeGif(frameData, w, h, repeat) {
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
      var frameOpts = { palette: palette, delay: Math.max(frameData[i].delay || 20, 20) }
      if (i === 0 && repeat !== undefined) frameOpts.repeat = repeat
      enc.writeFrame(indexed, outW, outH, frameOpts)
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
    // Decoding a large GIF takes ~a minute. Without this guard a second upload
    // started mid-decode races the first, and whichever finishes LAST wins —
    // leaving the preview showing one file and parsedFrames holding the other.
    var seq = ++loadSeq
    var isCurrent = function () { return seq === loadSeq }

    currentFile = file
    showState('progress')
    if (progressText) progressText.textContent = 'Reading GIF...'
    try {
      if (isByteRewrite) {
        var bytes = new Uint8Array(await file.arrayBuffer())
        if (!isCurrent()) return
        rawBytes = bytes
      } else {
        var parsed = await parseGifFile(file, isCurrent)
        if (!isCurrent()) return
        parsedFrames = parsed.frames
        gifWidth = parsed.width
        gifHeight = parsed.height
        decodeScale = parsed.plan.width / parsed.plan.sourceWidth
        showFitNotice(describeFitPlan(parsed.plan, parsed.plan.sourceWidth, parsed.plan.sourceHeight))
      }
      if (previewImg) {
        if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl)
        previewBlobUrl = URL.createObjectURL(file)
        previewImg.src = previewBlobUrl
      }
      showState('settings')
    } catch (e) {
      // A superseded load must not paint its error over the newer upload.
      if (!isCurrent() || (e && e.message === STALE_LOAD)) return
      showError(e.message || String(e))
    }
  }

  function showResultBlob(blob) {
    if (resultBlobUrl) URL.revokeObjectURL(resultBlobUrl)
    resultBlobUrl = URL.createObjectURL(blob)
    if (resultImg) resultImg.src = resultBlobUrl
    if (progressFill) progressFill.style.width = '100%'
    showState('result')
  }

  function processByteRewrite() {
    if (!rawBytes) return
    showState('progress')
    if (progressText) progressText.textContent = 'Processing...'
    if (progressFill) progressFill.style.width = '50%'
    try {
      var out = rewriteGifDelays(rawBytes, readOpts().speedPercent)
      showResultBlob(new Blob([out], { type: 'image/gif' }))
    } catch (e) {
      showError('Processing failed: ' + (e.message || String(e)))
    }
  }

  async function process() {
    if (isByteRewrite) return processByteRewrite()
    if (!parsedFrames || !parsedFrames.length) return
    showState('progress')
    if (progressText) progressText.textContent = 'Processing...'
  var opts = readOpts()
    var rgbaFrames = parsedFrames.map(function (f) { return { rgba: f.rgba, delay: f.delay } })
    var delays = rgbaFrames.map(function (f) { return f.delay })
    var simpleFrames = rgbaFrames
    var loopRepeat

    if (op === 'resizer') {
      var dims = getResizeTargetDims(gifWidth, gifHeight, opts)
      simpleFrames = rgbaFrames.map(function (f) {
        return Object.assign({}, f, { _outW: dims.width, _outH: dims.height })
      })
    } else if (op === 'cropper') {
      var crop = getCropRegionForFrame(gifWidth, gifHeight, opts, decodeScale)
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
      if (op === 'loop-count') loopRepeat = applied.loopCount
    }

    if (op === 'loop-count' && loopRepeat === undefined) {
      loopRepeat = normalizeLoopCount(opts.loopCount)
    }

    try {
      if (progressFill) progressFill.style.width = '50%'
      var blob = await encodeGif(simpleFrames, gifWidth, gifHeight, op === 'loop-count' ? loopRepeat : undefined)
      showResultBlob(blob)
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
