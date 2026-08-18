// Pure geometry for the PDF cropper.
//
// Two coordinate systems meet in this tool and they disagree about which way
// is up:
//
//   * PDF user space — origin bottom-left, unit is the point (1/72 in). This
//     is what `setCropBox` speaks. A page's box does NOT necessarily start at
//     (0, 0): a page that was cropped before, or one with an offset media box,
//     starts wherever its box says it does.
//   * Screen space — origin top-left, unit is the CSS/canvas pixel. This is
//     what the preview and the drag handles speak, and it is already rotated
//     by the page's /Rotate before the user ever sees it.
//
// Margins are always stored in points, always measured from the edges of the
// page *as displayed*. Everything that has to cross into user space goes
// through `cropBoxFromMargins`, which is the single place the flip and the
// rotation are applied. Getting either wrong crops the opposite edge, so the
// mapping is unit-tested per rotation in pdf-crop-core.test.js.

export var PT_PER_MM = 72 / 25.4
export var PT_PER_IN = 72

export function mmToPt(mm) { return (Number(mm) || 0) * PT_PER_MM }
export function ptToMm(pt) { return (Number(pt) || 0) / PT_PER_MM }

export function toPt(value, unit) {
  var n = Number(value) || 0
  if (unit === 'mm') return n * PT_PER_MM
  if (unit === 'in') return n * PT_PER_IN
  return n
}

export function fromPt(pt, unit) {
  var n = Number(pt) || 0
  if (unit === 'mm') return n / PT_PER_MM
  if (unit === 'in') return n / PT_PER_IN
  return n
}

// Rounds to the nearest quarter turn and folds into [0, 360). PDF /Rotate is
// meant to be a multiple of 90 but real files carry 360, -90 and worse.
export function normalizeRotation(angle) {
  var n = Math.round((Number(angle) || 0) / 90) * 90
  n = n % 360
  if (n < 0) n += 360
  return n
}

function num(v) { return Number(v) || 0 }
function size(v) { return Math.max(0, Number(v) || 0) }

// The page's width/height as the reader sees it: swapped on a quarter turn.
export function visualSize(box, rotation) {
  var r = normalizeRotation(rotation)
  var w = size(box && box.width)
  var h = size(box && box.height)
  return r % 180 === 0 ? { width: w, height: h } : { width: h, height: w }
}

// Keeps a crop from eating the whole page. When a pair of opposite margins
// overshoots, both shrink proportionally instead of one winning — pinning a
// single side makes a drag near the limit jump sideways.
export function clampMargins(margins, box, rotation, minSize) {
  var vis = visualSize(box, rotation)
  var min = Number(minSize) > 0 ? Number(minSize) : 1
  var m = {
    top: Math.max(0, num(margins && margins.top)),
    right: Math.max(0, num(margins && margins.right)),
    bottom: Math.max(0, num(margins && margins.bottom)),
    left: Math.max(0, num(margins && margins.left)),
  }
  var maxH = Math.max(0, vis.width - min)
  if (m.left + m.right > maxH) {
    var totalH = m.left + m.right
    var kH = totalH > 0 ? maxH / totalH : 0
    m.left *= kH
    m.right *= kH
  }
  var maxV = Math.max(0, vis.height - min)
  if (m.top + m.bottom > maxV) {
    var totalV = m.top + m.bottom
    var kV = totalV > 0 ? maxV / totalV : 0
    m.top *= kV
    m.bottom *= kV
  }
  return m
}

// Screen margins -> a crop box in PDF user space, inside `box`.
//
// `box` is the page's current crop box (fall back to the media box), so a page
// that already carries a crop or a shifted origin keeps it: every result is
// expressed relative to that origin rather than to (0, 0).
export function cropBoxFromMargins(box, rotation, margins, minSize) {
  var r = normalizeRotation(rotation)
  var m = clampMargins(margins, box, r, minSize)
  var x = num(box && box.x)
  var y = num(box && box.y)
  var w = size(box && box.width)
  var h = size(box && box.height)

  // Trims in user space: which screen edge eats into which side of the box.
  var left, right, top, bottom
  if (r === 0) {
    left = m.left; right = m.right; top = m.top; bottom = m.bottom
  } else if (r === 90) {
    left = m.top; right = m.bottom; top = m.right; bottom = m.left
  } else if (r === 180) {
    left = m.right; right = m.left; top = m.bottom; bottom = m.top
  } else {
    left = m.bottom; right = m.top; top = m.left; bottom = m.right
  }

  return {
    x: x + left,
    y: y + bottom,
    width: Math.max(0, w - left - right),
    height: Math.max(0, h - top - bottom),
  }
}

// Inverse of cropBoxFromMargins: reads an existing inner box back as screen
// margins, so opening a file that was already cropped shows real numbers.
export function marginsFromCropBox(outer, rotation, inner) {
  var r = normalizeRotation(rotation)
  var ox = num(outer && outer.x)
  var oy = num(outer && outer.y)
  var ow = size(outer && outer.width)
  var oh = size(outer && outer.height)
  var ix = num(inner && inner.x)
  var iy = num(inner && inner.y)
  var iw = size(inner && inner.width)
  var ih = size(inner && inner.height)

  var left = Math.max(0, ix - ox)
  var bottom = Math.max(0, iy - oy)
  var right = Math.max(0, ox + ow - (ix + iw))
  var top = Math.max(0, oy + oh - (iy + ih))

  if (r === 0) return { top: top, right: right, bottom: bottom, left: left }
  if (r === 90) return { top: left, right: top, bottom: right, left: bottom }
  if (r === 180) return { top: bottom, right: left, bottom: top, left: right }
  return { top: right, right: bottom, bottom: left, left: top }
}

// Fractions are of the page as displayed, origin top-left — the shape the
// preview overlay and the drag handles work in.
export function fractionsFromMargins(margins, visual) {
  var vw = size(visual && visual.width) || 1
  var vh = size(visual && visual.height) || 1
  var m = margins || {}
  var x = Math.max(0, num(m.left) / vw)
  var y = Math.max(0, num(m.top) / vh)
  var w = Math.max(0, 1 - x - Math.max(0, num(m.right) / vw))
  var h = Math.max(0, 1 - y - Math.max(0, num(m.bottom) / vh))
  return { x: x, y: y, w: w, h: h }
}

export function marginsFromFractions(frac, visual) {
  var vw = size(visual && visual.width)
  var vh = size(visual && visual.height)
  var f = frac || {}
  var x = Math.max(0, num(f.x))
  var y = Math.max(0, num(f.y))
  var w = Math.max(0, num(f.w))
  var h = Math.max(0, num(f.h))
  return {
    top: y * vh,
    right: Math.max(0, 1 - x - w) * vw,
    bottom: Math.max(0, 1 - y - h) * vh,
    left: x * vw,
  }
}

export function cropBoxArea(boxLike) {
  return size(boxLike && boxLike.width) * size(boxLike && boxLike.height)
}

// Finds the bounding box of everything that is not page background, returned
// as fractions of the rendered image (origin top-left). Used by the
// trim-white-margins preset. Returns null when the page is blank, so the
// caller can say so instead of cropping to a 1pt sliver.
//
// `image` is anything shaped like ImageData: { data, width, height } in RGBA.
export function detectContentBounds(image, options) {
  var opts = options || {}
  var threshold = typeof opts.threshold === 'number' ? opts.threshold : 247
  var data = image && image.data
  var w = Math.floor(size(image && image.width))
  var h = Math.floor(size(image && image.height))
  if (!data || !w || !h) return null

  var minX = w
  var minY = h
  var maxX = -1
  var maxY = -1

  for (var y = 0; y < h; y++) {
    var rowOffset = y * w * 4
    for (var x = 0; x < w; x++) {
      var i = rowOffset + x * 4
      var a = data[i + 3]
      // Fully transparent pixels are page background too — a PDF rendered on
      // an untouched canvas leaves the margins at alpha 0, not white.
      if (a === 0) continue
      var lum = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114)
      if (a < 255) lum = 255 - ((255 - lum) * a) / 255
      if (lum >= threshold) continue
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }

  if (maxX < 0 || maxY < 0) return null
  return {
    x: minX / w,
    y: minY / h,
    w: (maxX + 1 - minX) / w,
    h: (maxY + 1 - minY) / h,
  }
}

// Grows a detected content box by `padPt` on every side without letting it
// spill past the page. Scans always have a little noise right at the text
// edge, and a zero-pad crop clips descenders.
export function padFractions(frac, visual, padPt) {
  var vw = size(visual && visual.width) || 1
  var vh = size(visual && visual.height) || 1
  var pad = Math.max(0, Number(padPt) || 0)
  var px = pad / vw
  var py = pad / vh
  var f = frac || {}
  var x = Math.max(0, num(f.x) - px)
  var y = Math.max(0, num(f.y) - py)
  var right = Math.min(1, num(f.x) + num(f.w) + px)
  var bottom = Math.min(1, num(f.y) + num(f.h) + py)
  return { x: x, y: y, w: Math.max(0, right - x), h: Math.max(0, bottom - y) }
}

// "current" | "range" | "all" -> the 1-based page numbers to crop.
export function resolveCropScope(scope, currentPage, totalPages, rangeSpec, parseRange) {
  var total = Math.max(1, Math.floor(Number(totalPages) || 1))
  var page = Math.min(total, Math.max(1, Math.floor(Number(currentPage) || 1)))
  if (scope === 'current') return [page]
  if (scope === 'range' && typeof parseRange === 'function') {
    var parsed = parseRange(rangeSpec, total)
    return parsed && parsed.length ? parsed : [page]
  }
  var all = []
  for (var i = 1; i <= total; i++) all.push(i)
  return all
}

export function formatCropSize(boxLike, unit) {
  var w = fromPt(size(boxLike && boxLike.width), unit)
  var h = fromPt(size(boxLike && boxLike.height), unit)
  var digits = unit === 'pt' ? 0 : unit === 'in' ? 2 : 1
  return w.toFixed(digits) + ' × ' + h.toFixed(digits) + ' ' + (unit || 'pt')
}
