// ImageMagick WASM runtime for file converter
var wasmBuffer = null
var worker = null

function waitForMessage(w, type) {
  return new Promise(function (resolve, reject) {
    function onMsg(e) {
      if (e.data.type === 'error') {
        w.removeEventListener('message', onMsg)
        reject(new Error(e.data.error || 'Magick worker error'))
        return
      }
      if (!type || e.data.type === type) {
        w.removeEventListener('message', onMsg)
        resolve(e.data)
      }
    }
    w.addEventListener('message', onMsg)
  })
}

export async function initMagick(onProgress) {
  onProgress = onProgress || function () {}
  if (wasmBuffer && worker) return

  onProgress(10, 'Downloading ImageMagick WASM…')
  var wasmResp = await fetch('/vendor/magick.wasm')
  if (!wasmResp.ok) throw new Error('Failed to load ImageMagick WASM')
  wasmBuffer = await wasmResp.arrayBuffer()

  onProgress(60, 'Starting ImageMagick worker…')
  worker = new Worker('/vendor/magick-worker.js', { type: 'module' })
  worker.postMessage({ type: 'load', wasm: wasmBuffer, id: 'init' })
  await waitForMessage(worker, 'loaded')
  onProgress(100, 'ImageMagick ready')
}

export async function convertImage(file, fromExt, toExt, options) {
  options = options || {}
  if (!worker) await initMagick()
  var id = Math.random().toString(36).slice(2, 10)
  worker.postMessage({
    type: 'convert',
    id: id,
    to: toExt,
    input: { file: file, from: fromExt },
    compression: options.quality || 100,
    keepMetadata: options.keepMetadata !== false,
  })
  var result = await waitForMessage(worker)
  if (result.type !== 'finished') throw new Error('Image conversion failed')
  return result.output
}

export async function svgToPngBlob(file) {
  var text = await file.text()
  var svgBlob = new Blob([text], { type: 'image/svg+xml' })
  var url = URL.createObjectURL(svgBlob)
  try {
    var img = await new Promise(function (resolve, reject) {
      var el = new Image()
      el.onload = function () { resolve(el) }
      el.onerror = reject
      el.src = url
    })
    var canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth || 512
    canvas.height = img.naturalHeight || 512
    var ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0)
    return await new Promise(function (resolve) {
      canvas.toBlob(function (b) { resolve(b) }, 'image/png')
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function getImageMimeType(ext) {
  var bare = ext.replace(/^\./, '').toLowerCase()
  var map = {
    png: 'image/png', jpeg: 'image/jpeg', jpg: 'image/jpeg', webp: 'image/webp',
    gif: 'image/gif', avif: 'image/avif', bmp: 'image/bmp', tiff: 'image/tiff',
    tif: 'image/tiff', ico: 'image/x-icon', jxl: 'image/jxl',
  }
  return map[bare] || 'application/octet-stream'
}
