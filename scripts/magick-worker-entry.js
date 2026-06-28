// ImageMagick worker — core image conversion logic
import {
  initializeImageMagick,
  MagickFormat,
  MagickImage,
  MagickImageCollection,
  MagickReadSettings,
} from '@imagemagick/magick-wasm'

let magickInitialized = false

function magickConvert(img, to, keepMetadata, compression) {
  var fmt = to.slice(1).toUpperCase()
  if (fmt === 'JFIF') fmt = 'JPEG'

  if (fmt === 'ICO') {
    var max = 256
    var w = img.width
    var h = img.height
    if (w > max || h > max) {
      var scale = max / Math.max(w, h)
      img.resize(Math.max(1, Math.round(w * scale)), Math.max(1, Math.round(h * scale)))
    }
  }

  return new Promise(function (resolve, reject) {
    try {
      if (compression) img.quality = compression
      if (!keepMetadata) img.strip()
      img.write(fmt, function (o) {
        resolve(new Uint8Array(o))
      })
    } catch (err) {
      reject(err)
    }
  })
}

async function handleMessage(message) {
  switch (message.type) {
    case 'load': {
      if (!message.wasm || !(message.wasm instanceof ArrayBuffer)) {
        throw new Error('Invalid WASM data')
      }
      await initializeImageMagick(new Uint8Array(message.wasm))
      magickInitialized = true
      return { type: 'loaded' }
    }
    case 'convert': {
      if (!magickInitialized) return { type: 'error', error: 'magick-wasm not initialized' }

      var compression = message.compression
      var keepMetadata = message.keepMetadata !== false
      var to = message.to.startsWith('.') ? message.to.toLowerCase() : '.' + message.to.toLowerCase()
      if (to === '.jfif') to = '.jpeg'

      var from = message.input.from
      if (from === '.jfif') from = '.jpeg'
      if (from === '.fit') from = '.fits'

      var buffer = await message.input.file.arrayBuffer()

      if ((from === '.webp' || from === '.gif') && (to === '.gif' || to === '.webp')) {
        var collection = MagickImageCollection.create(new Uint8Array(buffer))
        var outFmt = to === '.gif' ? MagickFormat.Gif : MagickFormat.WebP
        var animResult = await new Promise(function (resolve) {
          collection.write(outFmt, function (output) {
            resolve(new Uint8Array(output))
          })
        })
        collection.dispose()
        return { type: 'finished', output: animResult }
      }

      var readFmt = from.slice(1).toUpperCase()
      var img = MagickImage.create(
        new Uint8Array(buffer),
        new MagickReadSettings({ format: readFmt }),
      )
      var converted = await magickConvert(img, to, keepMetadata, compression)
      img.dispose()
      return { type: 'finished', output: converted }
    }
    default:
      return { type: 'error', error: 'Unknown message type: ' + message.type }
  }
}

self.onmessage = async function (e) {
  var message = e.data
  try {
    var res = await handleMessage(message)
    if (!res) return
    self.postMessage(Object.assign({}, res, { id: message.id }))
  } catch (err) {
    self.postMessage({ type: 'error', error: String(err.message || err), id: message.id })
  }
}
