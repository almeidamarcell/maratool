// Pure helpers for ezgif-gap PDF tools.

export function parsePageRange(spec, total) {
  var pages = []
  var max = Math.max(1, Number(total) || 1)
  if (!spec || !String(spec).trim()) {
    for (var i = 1; i <= max; i++) pages.push(i)
    return pages
  }
  String(spec).split(',').forEach(function (part) {
    part = part.trim()
    if (!part) return
    if (part.indexOf('-') !== -1) {
      var bits = part.split('-')
      var start = Math.max(1, parseInt(bits[0], 10) || 1)
      var end = Math.min(max, parseInt(bits[1], 10) || start)
      for (var j = start; j <= end; j++) {
        if (pages.indexOf(j) === -1) pages.push(j)
      }
    } else {
      var p = Math.min(max, Math.max(1, parseInt(part, 10) || 1))
      if (pages.indexOf(p) === -1) pages.push(p)
    }
  })
  return pages.sort(function (a, b) { return a - b })
}

export function computePdfRenderScale(pageW, pageH, maxDim) {
  var max = Math.max(100, Number(maxDim) || 1200)
  var longest = Math.max(pageW, pageH)
  if (longest <= max) return 1
  return max / longest
}

export function getPdfOutputFilename(inputName, suffix, ext) {
  if (!inputName || typeof inputName !== 'string') return 'output-' + suffix + ext
  var stem = inputName.replace(/\.pdf$/i, '')
  if (stem === inputName) {
    var dot = inputName.lastIndexOf('.')
    stem = dot > 0 ? inputName.substring(0, dot) : inputName
  }
  return stem + '-' + suffix + ext
}

export function validatePdfPageCount(n) {
  var v = Number(n)
  if (!Number.isInteger(v) || v < 1 || v > 200) {
    return { valid: false, error: 'Page count must be between 1 and 200.' }
  }
  return { valid: true }
}
