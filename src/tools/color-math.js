// Color Math — pure functions for color conversion, shade generation, and export
// No DOM dependencies. All functions are exported for testability.

// ── sRGB ↔ Linear RGB (gamma transfer) ──

export function srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

export function linearToSrgb(c) {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
}

// ── Linear RGB ↔ Oklab (Bjorn Ottosson's matrices) ──

export function linearRgbToOklab(r, g, b) {
  var l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
  var m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
  var s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b

  var l_ = Math.cbrt(l)
  var m_ = Math.cbrt(m)
  var s_ = Math.cbrt(s)

  return {
    L: 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
  }
}

export function oklabToLinearRgb(L, a, b) {
  var l_ = L + 0.3963377774 * a + 0.2158037573 * b
  var m_ = L - 0.1055613458 * a - 0.0638541728 * b
  var s_ = L - 0.0894841775 * a - 1.2914855480 * b

  var l = l_ * l_ * l_
  var m = m_ * m_ * m_
  var s = s_ * s_ * s_

  return {
    r: +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
  }
}

// ── Oklab ↔ OKLCH (polar conversion) ──

export function oklabToOklch(L, a, b) {
  var C = Math.sqrt(a * a + b * b)
  var H = Math.atan2(b, a) * 180 / Math.PI
  if (H < 0) H += 360
  return { L: L, C: C, H: H }
}

export function oklchToOklab(L, C, H) {
  var rad = H * Math.PI / 180
  return {
    L: L,
    a: C * Math.cos(rad),
    b: C * Math.sin(rad)
  }
}

// ── HEX ↔ RGB ──

export function hexToRgb(hex) {
  hex = hex.replace(/^#/, '')
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
  if (hex.length !== 6) return null
  var n = parseInt(hex, 16)
  if (isNaN(n)) return null
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(function (v) {
    var h = Math.max(0, Math.min(255, Math.round(v))).toString(16)
    return h.length === 1 ? '0' + h : h
  }).join('')
}

// ── RGB ↔ HSL ──

export function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255
  var max = Math.max(r, g, b), min = Math.min(r, g, b)
  var h, s, l = (max + min) / 2
  if (max === min) {
    h = s = 0
  } else {
    var d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

export function hslToRgb(h, s, l) {
  h /= 360; s /= 100; l /= 100
  var r, g, b
  if (s === 0) {
    r = g = b = l
  } else {
    function hue2rgb(p, q, t) {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s
    var p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) }
}

// ── WCAG contrast ──

export function luminance(r, g, b) {
  var a = [r, g, b].map(function (v) {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]
}

export function contrastRatio(l1, l2) {
  var lighter = Math.max(l1, l2)
  var darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

// ── Shade generation ──

var DEFAULT_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]

function getSteps(count) {
  if (count === 11) return DEFAULT_STEPS
  if (count === 13) return [50, 100, 150, 200, 300, 400, 500, 600, 700, 800, 850, 900, 950]
  if (count === 9) return [50, 100, 200, 300, 500, 700, 800, 900, 950]
  if (count === 7) return [50, 100, 300, 500, 700, 900, 950]
  if (count === 5) return [50, 200, 500, 800, 950]
  return DEFAULT_STEPS
}

function clamp01(v) { return Math.max(0, Math.min(1, v)) }

function oklchToSrgb(L, C, H) {
  var lab = oklchToOklab(L, C, H)
  var lin = oklabToLinearRgb(lab.L, lab.a, lab.b)
  return {
    r: clamp01(lin.r),
    g: clamp01(lin.g),
    b: clamp01(lin.b)
  }
}

function gamutMapOklch(L, C, H) {
  // Reduce chroma until all channels are in gamut
  var c = C
  for (var i = 0; i < 50; i++) {
    var lab = oklchToOklab(L, c, H)
    var lin = oklabToLinearRgb(lab.L, lab.a, lab.b)
    if (lin.r >= -0.001 && lin.r <= 1.001 &&
        lin.g >= -0.001 && lin.g <= 1.001 &&
        lin.b >= -0.001 && lin.b <= 1.001) {
      return { L: L, C: c, H: H }
    }
    c *= 0.95
  }
  return { L: L, C: 0, H: H }
}

function generateShadesOklch(baseHex, steps, contrastShift) {
  var rgb = hexToRgb(baseHex)
  var linR = srgbToLinear(rgb.r / 255)
  var linG = srgbToLinear(rgb.g / 255)
  var linB = srgbToLinear(rgb.b / 255)
  var lab = linearRgbToOklab(linR, linG, linB)
  var lch = oklabToOklch(lab.L, lab.a, lab.b)

  // Lightness range controlled by contrastShift (0-100)
  var shift = contrastShift / 100
  var lightEnd = 0.95 + shift * 0.04   // 0.95 to 0.99
  var darkEnd = 0.15 - shift * 0.10    // 0.15 to 0.05
  if (darkEnd < 0.03) darkEnd = 0.03

  var maxStep = steps[steps.length - 1]
  var minStep = steps[0]

  return steps.map(function (step) {
    var t = (step - minStep) / (maxStep - minStep) // 0 to 1
    var targetL = lightEnd + t * (darkEnd - lightEnd)

    // Chroma: reduce at extremes of lightness
    var chromaScale = 1 - Math.pow(2 * Math.abs(targetL - 0.5), 2)
    chromaScale = Math.max(0.05, chromaScale)
    var targetC = lch.C * chromaScale

    var mapped = gamutMapOklch(targetL, targetC, lch.H)

    var srgb = oklchToSrgb(mapped.L, mapped.C, mapped.H)
    var r8 = Math.round(linearToSrgb(srgb.r) * 255)
    var g8 = Math.round(linearToSrgb(srgb.g) * 255)
    var b8 = Math.round(linearToSrgb(srgb.b) * 255)
    r8 = Math.max(0, Math.min(255, r8))
    g8 = Math.max(0, Math.min(255, g8))
    b8 = Math.max(0, Math.min(255, b8))

    return {
      step: step,
      hex: rgbToHex(r8, g8, b8),
      rgb: { r: r8, g: g8, b: b8 },
      hsl: rgbToHsl(r8, g8, b8),
      oklch: { L: mapped.L, C: mapped.C, H: mapped.H }
    }
  })
}

function generateShadesHsl(baseHex, steps, contrastShift) {
  var rgb = hexToRgb(baseHex)
  var hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)

  var shift = contrastShift / 100
  var lightEnd = 95 + shift * 3
  var darkEnd = 10 - shift * 7
  if (darkEnd < 3) darkEnd = 3

  var maxStep = steps[steps.length - 1]
  var minStep = steps[0]

  return steps.map(function (step) {
    var t = (step - minStep) / (maxStep - minStep)
    var targetL = lightEnd + t * (darkEnd - lightEnd)

    // Slight saturation adjustment at extremes
    var satScale = 1 - 0.3 * Math.pow(2 * Math.abs(targetL / 100 - 0.5), 2)
    var targetS = Math.round(hsl.s * satScale)

    var out = hslToRgb(hsl.h, targetS, Math.round(targetL))
    var outHsl = { h: hsl.h, s: targetS, l: Math.round(targetL) }

    var linR = srgbToLinear(out.r / 255)
    var linG = srgbToLinear(out.g / 255)
    var linB = srgbToLinear(out.b / 255)
    var lab = linearRgbToOklab(linR, linG, linB)
    var lch = oklabToOklch(lab.L, lab.a, lab.b)

    return {
      step: step,
      hex: rgbToHex(out.r, out.g, out.b),
      rgb: { r: out.r, g: out.g, b: out.b },
      hsl: outHsl,
      oklch: { L: lch.L, C: lch.C, H: lch.H }
    }
  })
}

export function generateShades(baseHex, shadeCount, contrastShift, algorithm) {
  var steps = getSteps(shadeCount)
  if (algorithm === 'hsl') {
    return generateShadesHsl(baseHex, steps, contrastShift)
  }
  return generateShadesOklch(baseHex, steps, contrastShift)
}

// ── Format helpers ──

export function formatRgb(rgb) {
  return 'rgb(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ')'
}

export function formatHsl(hsl) {
  return 'hsl(' + hsl.h + ', ' + hsl.s + '%, ' + hsl.l + '%)'
}

export function formatOklch(oklch) {
  return 'oklch(' + oklch.L.toFixed(3) + ' ' + oklch.C.toFixed(3) + ' ' + oklch.H + ')'
}

// ── Export formatters ──

export function exportCssVariables(name, shades) {
  var lines = [':root {']
  shades.forEach(function (s) {
    lines.push('  --' + name + '-' + s.step + ': ' + s.hex + ';')
  })
  lines.push('}')
  return lines.join('\n')
}

export function exportTailwindConfig(name, shades) {
  var lines = ["'" + name + "': {"]
  shades.forEach(function (s) {
    lines.push("  '" + s.step + "': '" + s.hex + "',")
  })
  lines.push('}')
  return lines.join('\n')
}

export function exportTailwindV4(name, shades) {
  var lines = ['@theme {']
  shades.forEach(function (s) {
    lines.push('  --color-' + name + '-' + s.step + ': ' + s.hex + ';')
  })
  lines.push('}')
  return lines.join('\n')
}

export function exportDesignTokens(name, shades) {
  var obj = {}
  obj[name] = {}
  shades.forEach(function (s) {
    obj[name][s.step] = { '$value': s.hex, '$type': 'color' }
  })
  return JSON.stringify(obj, null, 2)
}
