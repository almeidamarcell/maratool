// Pure image effect helpers — used by invert, halftone, round corners, censor tools.

export function invertRgba(data, channels) {
  channels = channels || { r: true, g: true, b: true }
  var out = new Uint8ClampedArray(data.length)
  for (var i = 0; i < data.length; i += 4) {
    out[i] = channels.r ? 255 - data[i] : data[i]
    out[i + 1] = channels.g ? 255 - data[i + 1] : data[i + 1]
    out[i + 2] = channels.b ? 255 - data[i + 2] : data[i + 2]
    out[i + 3] = data[i + 3]
  }
  return out
}

export function pixelateRegion(ctx, x, y, w, h, blockSize) {
  var size = Math.max(2, blockSize || 8)
  var img = ctx.getImageData(x, y, w, h)
  var data = img.data
  for (var by = 0; by < h; by += size) {
    for (var bx = 0; bx < w; bx += size) {
      var r = 0, g = 0, b = 0, a = 0, count = 0
      for (var py = by; py < Math.min(by + size, h); py++) {
        for (var px = bx; px < Math.min(bx + size, w); px++) {
          var idx = (py * w + px) * 4
          r += data[idx]; g += data[idx + 1]; b += data[idx + 2]; a += data[idx + 3]; count++
        }
      }
      r = Math.round(r / count); g = Math.round(g / count); b = Math.round(b / count); a = Math.round(a / count)
      for (var py2 = by; py2 < Math.min(by + size, h); py2++) {
        for (var px2 = bx; px2 < Math.min(bx + size, w); px2++) {
          var idx2 = (py2 * w + px2) * 4
          data[idx2] = r; data[idx2 + 1] = g; data[idx2 + 2] = b; data[idx2 + 3] = a
        }
      }
    }
  }
  ctx.putImageData(img, x, y)
}

export function blurRegion(ctx, x, y, w, h, radius) {
  var r = Math.max(1, radius || 5)
  var tmp = document.createElement('canvas')
  tmp.width = w; tmp.height = h
  var tctx = tmp.getContext('2d')
  tctx.filter = 'blur(' + r + 'px)'
  tctx.drawImage(ctx.canvas, x, y, w, h, 0, 0, w, h)
  ctx.drawImage(tmp, x, y, w, h, x, y, w, h)
}

export function applyCensorRect(ctx, rect, effect, intensity) {
  var x = Math.round(rect.x)
  var y = Math.round(rect.y)
  var w = Math.round(rect.w)
  var h = Math.round(rect.h)
  if (w <= 0 || h <= 0) return
  if (effect === 'blur') blurRegion(ctx, x, y, w, h, intensity)
  else pixelateRegion(ctx, x, y, w, h, intensity)
}

export function drawRoundedRectPath(ctx, x, y, w, h, radius) {
  var r = Math.min(radius, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

export function applyRoundCorners(rgba, width, height, radius, bgColor, circle) {
  var canvas = document.createElement('canvas')
  canvas.width = width; canvas.height = height
  var ctx = canvas.getContext('2d')
  if (bgColor) {
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, width, height)
  }
  var src = document.createElement('canvas')
  src.width = width; src.height = height
  src.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(rgba), width, height), 0, 0)
  var r = circle ? Math.min(width, height) / 2 : radius
  drawRoundedRectPath(ctx, 0, 0, width, height, r)
  ctx.save()
  ctx.clip()
  ctx.drawImage(src, 0, 0)
  ctx.restore()
  return ctx.getImageData(0, 0, width, height).data
}

export function halftoneRgba(data, width, height, dotSize, pattern, colored) {
  dotSize = Math.max(2, dotSize || 6)
  pattern = pattern || 'dots'
  var out = new Uint8ClampedArray(data.length)
  out.fill(255)

  for (var y = 0; y < height; y += dotSize) {
    for (var x = 0; x < width; x += dotSize) {
      var r = 0, g = 0, b = 0, count = 0
      for (var py = y; py < Math.min(y + dotSize, height); py++) {
        for (var px = x; px < Math.min(x + dotSize, width); px++) {
          var idx = (py * width + px) * 4
          r += data[idx]; g += data[idx + 1]; b += data[idx + 2]; count++
        }
      }
      r = Math.round(r / count); g = Math.round(g / count); b = Math.round(b / count)
      var lum = 0.299 * r + 0.587 * g + 0.114 * b
      var fill = lum < 128
      var dr = colored ? r : 0
      var dg = colored ? g : 0
      var db = colored ? b : 0
      var fr = fill ? dr : 255
      var fg = fill ? dg : 255
      var fb = fill ? db : 255

      for (var y2 = y; y2 < Math.min(y + dotSize, height); y2++) {
        for (var x2 = x; x2 < Math.min(x + dotSize, width); x2++) {
          var cx = x2 - x - dotSize / 2
          var cy = y2 - y - dotSize / 2
          var inside = false
          if (pattern === 'lines') inside = Math.abs(cy) < dotSize * 0.15
          else if (pattern === 'diamonds') inside = Math.abs(cx) + Math.abs(cy) < dotSize * 0.4
          else inside = cx * cx + cy * cy < (dotSize * 0.35) * (dotSize * 0.35)
          if (inside) {
            var oidx = (y2 * width + x2) * 4
            out[oidx] = fr; out[oidx + 1] = fg; out[oidx + 2] = fb; out[oidx + 3] = 255
          }
        }
      }
    }
  }
  return out
}

export function shuffleArray(arr, rng) {
  rng = rng || Math.random
  var a = arr.slice()
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(rng() * (i + 1))
    var tmp = a[i]; a[i] = a[j]; a[j] = tmp
  }
  return a
}

export function partialShuffleIndices(count, groupSize, rng) {
  rng = rng || Math.random
  var out = []
  for (var i = 0; i < count; i++) out.push(i)
  var g = Math.max(2, groupSize || count)
  for (var start = 0; start < count; start += g) {
    var end = Math.min(start + g, count)
    var chunk = out.slice(start, end)
    chunk = shuffleArray(chunk, rng)
    for (var k = 0; k < chunk.length; k++) out[start + k] = chunk[k]
  }
  return out
}
