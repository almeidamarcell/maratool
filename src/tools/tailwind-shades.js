(function () {
  var pickerEl = document.getElementById('ts-picker')
  var hexEl = document.getElementById('ts-hex')
  var nameEl = document.getElementById('ts-name')
  var gridEl = document.getElementById('ts-grid')
  var exportOutput = document.getElementById('ts-export-output')
  var exportTabs = document.getElementById('ts-export-tabs')
  var copyExport = document.getElementById('ts-copy-export')

  var currentExport = 'tw3'
  var currentShades = []

  // ── Color math (inlined, no ES imports) ──

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
    var l = l_ * l_ * l_, m = m_ * m_ * m_, s = s_ * s_ * s_
    return {
      r: +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      b: -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
    }
  }

  function oklabToOklch(L, a, b) {
    var C = Math.sqrt(a * a + b * b)
    var H = Math.atan2(b, a) * 180 / Math.PI
    if (H < 0) H += 360
    return { L: L, C: C, H: H }
  }

  function oklchToOklab(L, C, H) {
    var rad = H * Math.PI / 180
    return { L: L, a: C * Math.cos(rad), b: C * Math.sin(rad) }
  }

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

  function clamp01(v) { return Math.max(0, Math.min(1, v)) }

  function gamutMapOklch(L, C, H) {
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

  function generateShades(hex) {
    var rgb = hexToRgb(hex)
    if (!rgb) return []
    var linR = srgbToLinear(rgb.r / 255)
    var linG = srgbToLinear(rgb.g / 255)
    var linB = srgbToLinear(rgb.b / 255)
    var lab = linearRgbToOklab(linR, linG, linB)
    var lch = oklabToOklch(lab.L, lab.a, lab.b)

    var steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
    var shift = 0.5
    var lightEnd = 0.80 + shift * 0.19
    var darkEnd = 0.30 - shift * 0.27
    if (darkEnd < 0.03) darkEnd = 0.03

    return steps.map(function (step) {
      var t = (step - 50) / 900
      var targetL = lightEnd + t * (darkEnd - lightEnd)
      var chromaScale = 1 - Math.pow(2 * Math.abs(targetL - 0.5), 2)
      chromaScale = Math.max(0.05, chromaScale)
      var targetC = lch.C * chromaScale
      var mapped = gamutMapOklch(targetL, targetC, lch.H)
      var lab2 = oklchToOklab(mapped.L, mapped.C, mapped.H)
      var lin = oklabToLinearRgb(lab2.L, lab2.a, lab2.b)
      var r8 = Math.max(0, Math.min(255, Math.round(linearToSrgb(clamp01(lin.r)) * 255)))
      var g8 = Math.max(0, Math.min(255, Math.round(linearToSrgb(clamp01(lin.g)) * 255)))
      var b8 = Math.max(0, Math.min(255, Math.round(linearToSrgb(clamp01(lin.b)) * 255)))
      return { step: step, hex: rgbToHex(r8, g8, b8) }
    })
  }

  // ── Export formatters ──

  function fmtTailwind3(name, shades) {
    var lines = ["'" + name + "': {"]
    shades.forEach(function (s) { lines.push("  '" + s.step + "': '" + s.hex + "',") })
    lines.push('}')
    return lines.join('\n')
  }

  function fmtTailwind4(name, shades) {
    var lines = ['@theme {']
    shades.forEach(function (s) { lines.push('  --color-' + name + '-' + s.step + ': ' + s.hex + ';') })
    lines.push('}')
    return lines.join('\n')
  }

  function fmtCssVars(name, shades) {
    var lines = [':root {']
    shades.forEach(function (s) { lines.push('  --' + name + '-' + s.step + ': ' + s.hex + ';') })
    lines.push('}')
    return lines.join('\n')
  }

  function fmtTokens(name, shades) {
    var obj = {}; obj[name] = {}
    shades.forEach(function (s) { obj[name][s.step] = { '$value': s.hex, '$type': 'color' } })
    return JSON.stringify(obj, null, 2)
  }

  // ── Hash state ──

  function readHash() {
    try {
      var h = window.location.hash.slice(1)
      if (!h) return {}
      return JSON.parse(decodeURIComponent(h))
    } catch (e) { return {} }
  }

  function writeHash(obj) {
    history.replaceState(null, '', '#' + encodeURIComponent(JSON.stringify(obj)))
  }

  // ── Render ──

  function renderGrid(shades) {
    var html = ''
    for (var i = 0; i < shades.length; i++) {
      var s = shades[i]
      var textColor = s.step >= 600 ? '#fff' : '#1a1a18'
      html += '<div class="ts-shade" style="background:' + s.hex + ';color:' + textColor + ';" data-hex="' + s.hex + '" role="listitem">' +
        '<span class="ts-shade-label">' + s.step + '</span>' +
        '<span class="ts-shade-hex">' + s.hex + '</span>' +
        '<div class="ts-shade-copied">Copied!</div>' +
        '</div>'
    }
    gridEl.innerHTML = html
  }

  function renderExport() {
    var name = nameEl.value.trim() || 'primary'
    var text = ''
    if (currentExport === 'tw3') text = fmtTailwind3(name, currentShades)
    else if (currentExport === 'tw4') text = fmtTailwind4(name, currentShades)
    else if (currentExport === 'css') text = fmtCssVars(name, currentShades)
    else if (currentExport === 'tokens') text = fmtTokens(name, currentShades)
    exportOutput.textContent = text
  }

  function updateAll() {
    var hex = hexEl.value.trim()
    if (hex.charAt(0) !== '#') hex = '#' + hex
    currentShades = generateShades(hex)
    if (currentShades.length === 0) return
    renderGrid(currentShades)
    renderExport()
    writeHash({ hex: hex, name: nameEl.value.trim() })
  }

  // ── Events ──

  pickerEl.addEventListener('input', function () {
    hexEl.value = pickerEl.value
    updateAll()
  })

  hexEl.addEventListener('input', function () {
    var rgb = hexToRgb(hexEl.value.trim())
    if (rgb) pickerEl.value = hexEl.value.trim().charAt(0) === '#' ? hexEl.value.trim() : '#' + hexEl.value.trim()
    updateAll()
  })

  nameEl.addEventListener('input', renderExport)

  exportTabs.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-export]')
    if (!btn) return
    exportTabs.querySelectorAll('.tool-tab').forEach(function (t) { t.classList.remove('active') })
    btn.classList.add('active')
    currentExport = btn.getAttribute('data-export')
    renderExport()
  })

  gridEl.addEventListener('click', function (e) {
    var shade = e.target.closest('.ts-shade')
    if (!shade) return
    var hex = shade.getAttribute('data-hex')
    navigator.clipboard.writeText(hex).then(function () {
      var badge = shade.querySelector('.ts-shade-copied')
      badge.classList.add('show')
      setTimeout(function () { badge.classList.remove('show') }, 1500)
    })
  })

  copyExport.addEventListener('click', function () {
    navigator.clipboard.writeText(exportOutput.textContent).then(function () {
      var orig = copyExport.textContent
      copyExport.textContent = 'Copied!'
      setTimeout(function () { copyExport.textContent = orig }, 2000)
    })
  })

  // ── Init ──
  var state = readHash()
  if (state.hex) { hexEl.value = state.hex; pickerEl.value = state.hex }
  if (state.name) nameEl.value = state.name

  updateAll()
})()
