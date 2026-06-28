// Shared GIF parse/composite/encode helpers for maratool image tools.

var gifuctModule = null
var gifencModule = null

export function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export function downloadBlob(blob, filename) {
  var url = URL.createObjectURL(blob)
  var a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(function () { URL.revokeObjectURL(url) }, 1000)
}

export async function loadGifuct() {
  if (gifuctModule) return gifuctModule
  var mod = await import('https://cdn.jsdelivr.net/npm/gifuct-js@2.1.2/+esm')
  gifuctModule = { parseGIF: mod.parseGIF, decompressFrames: mod.decompressFrames }
  return gifuctModule
}

export async function loadGifenc() {
  if (gifencModule) return gifencModule
  gifencModule = await import('https://cdn.jsdelivr.net/npm/gifenc@1.0.3/dist/gifenc.esm.js')
  return gifencModule
}

export function getGifDimensions(gif, frames) {
  var width = (gif.lsd && gif.lsd.width) ? gif.lsd.width : frames[0].dims.width
  var height = (gif.lsd && gif.lsd.height) ? gif.lsd.height : frames[0].dims.height
  return { width: width, height: height }
}

export function compositeFrames(frames, w, h) {
  var canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  var ctx = canvas.getContext('2d')
  var result = []

  for (var i = 0; i < frames.length; i++) {
    var frame = frames[i]
    var patch = new ImageData(
      new Uint8ClampedArray(frame.patch),
      frame.dims.width,
      frame.dims.height
    )

    var tmpCanvas = document.createElement('canvas')
    tmpCanvas.width = frame.dims.width
    tmpCanvas.height = frame.dims.height
    var tmpCtx = tmpCanvas.getContext('2d')
    tmpCtx.putImageData(patch, 0, 0)
    ctx.drawImage(tmpCanvas, frame.dims.left, frame.dims.top)

    var fullFrame = ctx.getImageData(0, 0, w, h)
    result.push({
      rgba: new Uint8ClampedArray(fullFrame.data),
      delay: frame.delay,
      meta: frame,
    })

    if (frame.disposalType === 2) {
      ctx.clearRect(frame.dims.left, frame.dims.top, frame.dims.width, frame.dims.height)
    }
  }

  return result
}

export async function parseGifFile(file) {
  var arrayBuffer = await file.arrayBuffer()
  var gifuctJs = await loadGifuct()
  var gif = gifuctJs.parseGIF(arrayBuffer)
  var frames = gifuctJs.decompressFrames(gif, true)
  if (!frames || frames.length === 0) throw new Error('Could not read GIF frames.')
  var dims = getGifDimensions(gif, frames)
  var parsedFrames = compositeFrames(frames, dims.width, dims.height)
  return {
    gif: gif,
    rawFrames: frames,
    parsedFrames: parsedFrames,
    width: dims.width,
    height: dims.height,
    arrayBuffer: arrayBuffer,
  }
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
