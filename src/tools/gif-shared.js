// Shared GIF parse/composite/encode helpers for maratool image tools.

export { formatSize, downloadBlob } from './tool-utils.js'
import { computeFitPlan, describeFitPlan, decodedSizeError } from './gif-anim-core.js'
import { mergeDelays } from './gif-compressor-core.js'

// A GIF's file size says nothing about what it costs to decode: every frame
// becomes width x height x 4 bytes of RGBA. A 14.9 MB 2808x1650 GIF with 597
// frames wants 10.3 GB and Chrome kills the tab ("Error code: 5"). Cap the
// decoded pixels, not the download.
export var MAX_DECODED_PIXELS = 120e6

// Thrown to unwind a decode whose upload has been superseded.
export var STALE_LOAD = 'gif-shared:stale-load'

var gifuctModule = null
var gifencModule = null

export async function loadGifuct() {
  if (gifuctModule) return gifuctModule
  var mod = await import('https://cdn.jsdelivr.net/npm/gifuct-js@2.1.2/+esm')
  gifuctModule = {
    parseGIF: mod.parseGIF,
    decompressFrame: mod.decompressFrame,
    decompressFrames: mod.decompressFrames,
  }
  return gifuctModule
}

export async function loadGifenc() {
  if (gifencModule) return gifencModule
  gifencModule = await import('https://cdn.jsdelivr.net/npm/gifenc@1.0.3/dist/gifenc.esm.js')
  return gifencModule
}

// Metadata every consumer reads off a frame, kept after the pixels are freed.
function frameMetaOf(frame) {
  return {
    dims: frame.dims,
    delay: frame.delay,
    disposalType: frame.disposalType,
    colorTable: frame.colorTable,
  }
}

// Decode a GIF one frame at a time, shrinking each frame to the plan size and
// dropping the full-resolution copy before the next one. Peak memory is a
// single source-size canvas rather than every frame at once.
//
// GIF frames are deltas, so every frame must still be composited even when
// frames are being dropped; skipping a decode would punch holes in the frames
// that are kept.
var decodeChain = Promise.resolve()

// Decodes are serialized process-wide.
//
// Yielding mid-decode is what keeps the tab alive on a 597-frame GIF, but it
// also lets two uploads interleave: drop a huge GIF then a small one and the
// small one finishes first, only to be overwritten when the huge one catches
// up. Queuing makes "last upload wins" true for every caller without each one
// needing its own guard. Callers that pass isCurrent still abort early instead
// of waiting the queue out.
export function streamGifFrames(file, options) {
  var run = decodeChain.then(
    function () { return decodeGifFile(file, options) },
    function () { return decodeGifFile(file, options) }
  )
  decodeChain = run.catch(function () {})
  return run
}

async function decodeGifFile(file, options) {
  var opts = options || {}
  var budget = opts.budgetPixels || MAX_DECODED_PIXELS
  var onProgress = opts.onProgress
  var isCurrent = opts.isCurrent
  // Callers that only report on a GIF (frame table, palette sizes) never touch
  // the pixels, so compositing them is pure cost. Skip it and the fit plan
  // stops mattering: nothing is retained.
  var metadataOnly = opts.metadataOnly === true

  var arrayBuffer = await file.arrayBuffer()
  var gifuctJs = await loadGifuct()
  var gif = gifuctJs.parseGIF(arrayBuffer)
  var imageFrames = (gif.frames || []).filter(function (f) { return f.image })
  if (!imageFrames.length) throw new Error('Could not read GIF frames.')

  var first = imageFrames[0].image && imageFrames[0].image.descriptor
  var w = (gif.lsd && gif.lsd.width) || (first && first.width)
  var h = (gif.lsd && gif.lsd.height) || (first && first.height)

  var plan = metadataOnly
    ? { scale: 100, skip: 1, width: w, height: h, frameCount: imageFrames.length,
        sourceFrameCount: imageFrames.length, compressed: false }
    : computeFitPlan(w, h, imageFrames.length, budget)
  if (!plan) throw new Error(decodedSizeError(w, h, imageFrames.length, budget))
  plan.sourceWidth = w
  plan.sourceHeight = h

  var canvas = null, ctx = null, patchCanvas = null, patchCtx = null, out = null, outCtx = null
  if (!metadataOnly) {
    canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    ctx = canvas.getContext('2d', { willReadFrequently: true })
    patchCanvas = document.createElement('canvas')
    patchCtx = patchCanvas.getContext('2d', { willReadFrequently: true })
    out = document.createElement('canvas')
    out.width = plan.width
    out.height = plan.height
    outCtx = out.getContext('2d', { willReadFrequently: true })
  }

  var parsedFrames = []
  var frameMeta = []
  var allDelays = []

  for (var i = 0; i < imageFrames.length; i++) {
    var frame = gifuctJs.decompressFrame(imageFrames[i], gif.gct, !metadataOnly)
    var d = frame.dims
    frameMeta.push(frameMetaOf(frame))
    allDelays.push(frame.delay)

    if (!metadataOnly) {
      patchCanvas.width = d.width
      patchCanvas.height = d.height
      patchCtx.putImageData(new ImageData(new Uint8ClampedArray(frame.patch), d.width, d.height), 0, 0)
      ctx.drawImage(patchCanvas, d.left, d.top)

      if (i % plan.skip === 0) {
        outCtx.clearRect(0, 0, plan.width, plan.height)
        outCtx.drawImage(canvas, 0, 0, w, h, 0, 0, plan.width, plan.height)
        parsedFrames.push({
          rgba: new Uint8ClampedArray(outCtx.getImageData(0, 0, plan.width, plan.height).data),
          delay: frame.delay,
        })
      }
      if (frame.disposalType === 2) ctx.clearRect(d.left, d.top, d.width, d.height)
    }
    frame.patch = null
    frame.pixels = null

    // Hundreds of frames take tens of seconds. Yield so the tab stays alive and
    // the caller can paint progress or abandon a superseded upload.
    if (i % 8 === 0) {
      if (isCurrent && !isCurrent()) throw new Error(STALE_LOAD)
      if (onProgress) onProgress(i, imageFrames.length)
      await new Promise(function (r) { setTimeout(r, 0) })
    }
  }

  // Dropped frames hand their delay to the frame that survived, so the
  // animation still runs for its original length.
  var merged = mergeDelays(allDelays, plan.skip)
  for (var k = 0; k < parsedFrames.length; k++) {
    if (merged[k] !== undefined) parsedFrames[k].delay = merged[k]
  }

  return {
    gif: gif,
    rawFrames: frameMeta,
    parsedFrames: parsedFrames,
    width: plan.width,
    height: plan.height,
    sourceWidth: w,
    sourceHeight: h,
    plan: plan,
    notice: describeFitPlan(plan, w, h),
    arrayBuffer: arrayBuffer,
  }
}

export async function parseGifFile(file, options) {
  return streamGifFrames(file, options)
}

export function frameRangeIndices(total, start, end) {
  var s = Math.max(0, start || 0)
  var e = Math.min(total - 1, end == null ? total - 1 : end)
  var out = []
  for (var i = s; i <= e; i++) out.push(i)
  return out
}

export async function encodeFramesToGif(parsedFrames, width, height, options) {
  options = options || {}
  var colors = options.colors || 256
  var frameIndices = options.frameIndices
  var onProgress = options.onProgress
  var frameOptions = options.frameOptions

  var gifenc = await loadGifenc()
  var GIFEncoder = gifenc.GIFEncoder
  var quantize = gifenc.quantize
  var applyPalette = gifenc.applyPalette

  var enc = GIFEncoder()
  var indices = frameIndices || parsedFrames.map(function (_, i) { return i })
  var total = indices.length

  for (var k = 0; k < total; k++) {
    if (onProgress) onProgress(k, total)
    var frame = parsedFrames[indices[k]]
    var rgba = frame.rgba
    var palette = quantize(rgba, colors)
    var indexed = applyPalette(rgba, palette)
    var opts = {
      palette: palette,
      delay: Math.max(frame.delay || 100, 20),
    }
    if (frameOptions) Object.assign(opts, frameOptions(frame, indices[k]))
    enc.writeFrame(indexed, width, height, opts)
    if (k % 4 === 3) await new Promise(function (r) { setTimeout(r, 0) })
  }

  enc.finish()
  return new Blob([enc.bytes()], { type: 'image/gif' })
}

export function loadImageFromFile(file) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader()
    reader.onload = function () {
      var img = new Image()
      img.onload = function () { resolve(img) }
      img.onerror = function () { reject(new Error('Failed to load image.')) }
      img.src = reader.result
    }
    reader.onerror = function () { reject(new Error('Failed to read file.')) }
    reader.readAsDataURL(file)
  })
}

export function isGifFile(file) {
  return file && (file.type === 'image/gif' || /\.gif$/i.test(file.name || ''))
}

export function isStaticImageFile(file) {
  return file && /^image\/(png|jpeg|webp|bmp)$/i.test(file.type || '')
}

export function isImageOrGifFile(file) {
  return isGifFile(file) || isStaticImageFile(file)
}

export function canvasFromRgba(rgba, width, height) {
  var canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  var ctx = canvas.getContext('2d')
  ctx.putImageData(new ImageData(new Uint8ClampedArray(rgba), width, height), 0, 0)
  return canvas
}

export function rgbaFromCanvas(canvas) {
  var ctx = canvas.getContext('2d')
  return ctx.getImageData(0, 0, canvas.width, canvas.height).data
}

export async function loadMediaFile(file) {
  if (isGifFile(file)) {
    var gifData = await parseGifFile(file)
    return { type: 'gif', file: file, gifData: gifData }
  }
  if (isStaticImageFile(file)) {
    var img = await loadImageFromFile(file)
    return {
      type: 'static',
      file: file,
      image: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
    }
  }
  throw new Error('Unsupported file type.')
}

export function stemFilename(name, suffix, ext) {
  var stem = (name || 'output').replace(/\.[^.]+$/, '')
  return stem + suffix + '.' + ext
}
