(function () {
  var picker = document.getElementById('cc-picker')
  var swatch = document.getElementById('cc-swatch')
  var hexInput = document.getElementById('cc-hex')
  var rgbInput = document.getElementById('cc-rgb')
  var hslInput = document.getElementById('cc-hsl')
  var oklchInput = document.getElementById('cc-oklch')

  // ── Color math (inline to avoid ES module issues) ──

  function hexToRgb(hex) {
    hex = hex.replace(/^#/, '')
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
    if (hex.length !== 6) return null
    var n = parseInt(hex, 16)
    if (isNaN(n)) return null
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(function (v) {
      var h = Math.max(0, Math.min(255, Math.round(v))).toString(16)
      return h.length === 1 ? '0' + h : h
    }).join('')
  }

  function rgbToHsl(r, g, b) {
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

  function hslToRgb(h, s, l) {
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

  function srgbToLinear(c) {
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }

  function linearToSrgb(c) {
    return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
  }

  function linearRgbToOklab(r, g, b) {
    var l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
    var m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
    var s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b
    var l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s)
    return {
      L: 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
      a: 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
      b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
    }
  }

  function oklabToLinearRgb(L, a, b) {
    var l_ = L + 0.3963377774 * a + 0.2158037573 * b
    var m_ = L - 0.1055613458 * a - 0.0638541728 * b
    var s_ = L - 0.0894841775 * a - 1.2914855480 * b
    return {
      r: +4.0767416621 * l_ * l_ * l_ - 3.3077115913 * m_ * m_ * m_ + 0.2309699292 * s_ * s_ * s_,
      g: -1.2684380046 * l_ * l_ * l_ + 2.6097574011 * m_ * m_ * m_ - 0.3413193965 * s_ * s_ * s_,
      b: -0.0041960863 * l_ * l_ * l_ - 0.7034186147 * m_ * m_ * m_ + 1.7076147010 * s_ * s_ * s_
    }
  }

  function rgbToOklch(r, g, b) {
    var lr = srgbToLinear(r / 255)
    var lg = srgbToLinear(g / 255)
    var lb = srgbToLinear(b / 255)
    var lab = linearRgbToOklab(lr, lg, lb)
    var C = Math.sqrt(lab.a * lab.a + lab.b * lab.b)
    var H = Math.atan2(lab.b, lab.a) * 180 / Math.PI
    if (H < 0) H += 360
    return { L: lab.L, C: C, H: H }
  }

  function oklchToRgb(L, C, H) {
    var rad = H * Math.PI / 180
    var a = C * Math.cos(rad)
    var b = C * Math.sin(rad)
    var lin = oklabToLinearRgb(L, a, b)
    var clamp = function (v) { return Math.max(0, Math.min(1, v)) }
    return {
      r: Math.round(linearToSrgb(clamp(lin.r)) * 255),
      g: Math.round(linearToSrgb(clamp(lin.g)) * 255),
      b: Math.round(linearToSrgb(clamp(lin.b)) * 255)
    }
  }

  // ── Parsing helpers ──

  function parseHex(val) {
    val = val.trim()
    if (val.charAt(0) !== '#') val = '#' + val
    return hexToRgb(val)
  }

  function parseRgb(val) {
    var m = val.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
    if (!m) return null
    var r = parseInt(m[1]), g = parseInt(m[2]), b = parseInt(m[3])
    if (r > 255 || g > 255 || b > 255) return null
    return { r: r, g: g, b: b }
  }

  function parseHsl(val) {
    var m = val.match(/hsla?\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?/)
    if (!m) return null
    var h = parseInt(m[1]), s = parseInt(m[2]), l = parseInt(m[3])
    if (h > 360 || s > 100 || l > 100) return null
    return hslToRgb(h, s, l)
  }

  function parseOklch(val) {
    var m = val.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/)
    if (!m) return null
    var L = parseFloat(m[1]), C = parseFloat(m[2]), H = parseFloat(m[3])
    if (isNaN(L) || isNaN(C) || isNaN(H)) return null
    return oklchToRgb(L, C, H)
  }

  // ── Update all fields from RGB ──

  var updating = false

  function updateAll(rgb, source) {
    if (updating) return
    updating = true

    var hex = rgbToHex(rgb.r, rgb.g, rgb.b)
    var hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
    var oklch = rgbToOklch(rgb.r, rgb.g, rgb.b)

    if (source !== 'hex') hexInput.value = hex
    if (source !== 'rgb') rgbInput.value = 'rgb(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ')'
    if (source !== 'hsl') hslInput.value = 'hsl(' + hsl.h + ', ' + hsl.s + '%, ' + hsl.l + '%)'
    if (source !== 'oklch') oklchInput.value = 'oklch(' + oklch.L.toFixed(3) + ' ' + oklch.C.toFixed(3) + ' ' + Math.round(oklch.H) + ')'

    swatch.style.background = hex
    picker.value = hex

    updating = false
  }

  // ── Event listeners ──

  hexInput.addEventListener('input', function () {
    var rgb = parseHex(hexInput.value)
    if (rgb) updateAll(rgb, 'hex')
  })

  rgbInput.addEventListener('input', function () {
    var rgb = parseRgb(rgbInput.value)
    if (rgb) updateAll(rgb, 'rgb')
  })

  hslInput.addEventListener('input', function () {
    var rgb = parseHsl(hslInput.value)
    if (rgb) updateAll(rgb, 'hsl')
  })

  oklchInput.addEventListener('input', function () {
    var rgb = parseOklch(oklchInput.value)
    if (rgb) updateAll(rgb, 'oklch')
  })

  picker.addEventListener('input', function () {
    var rgb = hexToRgb(picker.value)
    if (rgb) updateAll(rgb, 'picker')
  })

  // ── Copy buttons ──

  function copyText(text, btn) {
    if (!text) return
    navigator.clipboard.writeText(text).then(function () {
      var orig = btn.textContent
      btn.textContent = 'Copied!'
      btn.classList.add('copied')
      setTimeout(function () {
        btn.textContent = orig
        btn.classList.remove('copied')
      }, 2000)
    })
  }

  document.querySelectorAll('[data-cc-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var field = btn.getAttribute('data-cc-copy')
      var input = document.getElementById('cc-' + field)
      if (input) copyText(input.value, btn)
    })
  })

  // ── Restore from hash ──

  function readHash() {
    try {
      var h = window.location.hash.slice(1)
      if (!h) return null
      return JSON.parse(decodeURIComponent(h))
    } catch (e) { return null }
  }

  var state = readHash()
  if (state && state.hex) {
    var rgb = hexToRgb(state.hex)
    if (rgb) updateAll(rgb, 'none')
  } else {
    // Default color
    updateAll({ r: 45, g: 110, b: 246 }, 'none')
  }
})()
