// Color Picker — HEX / RGB / HSL with contrast checker
(function () {
  var picker = document.getElementById('cp-picker')
  var swatch = document.getElementById('cp-swatch')
  var hexInput = document.getElementById('cp-hex')
  var rInput = document.getElementById('cp-r')
  var gInput = document.getElementById('cp-g')
  var bInput = document.getElementById('cp-b')
  var hInput = document.getElementById('cp-h')
  var sInput = document.getElementById('cp-s')
  var lInput = document.getElementById('cp-l')
  var copyHex = document.getElementById('cp-copy-hex')
  var copyRgb = document.getElementById('cp-copy-rgb')
  var copyHsl = document.getElementById('cp-copy-hsl')
  var textOnWhite = document.getElementById('cp-text-on-white')
  var textOnBlack = document.getElementById('cp-text-on-black')
  var ratioWhite = document.getElementById('cp-ratio-white')
  var ratioBlack = document.getElementById('cp-ratio-black')
  var aaWhite = document.getElementById('cp-aa-white')
  var aaaWhite = document.getElementById('cp-aaa-white')
  var aaBlack = document.getElementById('cp-aa-black')
  var aaaBlack = document.getElementById('cp-aaa-black')
  var recentList = document.getElementById('cp-recent-list')

  var recentColors = []
  var currentR = 45, currentG = 110, currentB = 246

  // ── Color conversion helpers ──
  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(function (v) {
      var h = Math.max(0, Math.min(255, Math.round(v))).toString(16)
      return h.length === 1 ? '0' + h : h
    }).join('')
  }

  function hexToRgb(hex) {
    hex = hex.replace(/^#/, '')
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
    if (hex.length !== 6) return null
    var n = parseInt(hex, 16)
    if (isNaN(n)) return null
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
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
        if (t < 1/6) return p + (q - p) * 6 * t
        if (t < 1/2) return q
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
        return p
      }
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s
      var p = 2 * l - q
      r = hue2rgb(p, q, h + 1/3)
      g = hue2rgb(p, q, h)
      b = hue2rgb(p, q, h - 1/3)
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) }
  }

  // ── WCAG contrast ratio ──
  function luminance(r, g, b) {
    var a = [r, g, b].map(function (v) {
      v /= 255
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]
  }

  function contrastRatio(l1, l2) {
    var lighter = Math.max(l1, l2)
    var darker = Math.min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)
  }

  // ── Update everything from RGB ──
  function updateFromRgb(r, g, b, source) {
    currentR = r; currentG = g; currentB = b
    var hex = rgbToHex(r, g, b)
    var hsl = rgbToHsl(r, g, b)

    swatch.style.background = hex
    if (source !== 'picker') picker.value = hex
    if (source !== 'hex') hexInput.value = hex
    if (source !== 'rgb') { rInput.value = r; gInput.value = g; bInput.value = b }
    if (source !== 'hsl') { hInput.value = hsl.h; sInput.value = hsl.s; lInput.value = hsl.l }

    // Contrast
    var lum = luminance(r, g, b)
    var whiteLum = luminance(255, 255, 255)
    var blackLum = luminance(0, 0, 0)

    var ratioW = contrastRatio(whiteLum, lum)
    var ratioB = contrastRatio(lum, blackLum)

    textOnWhite.style.color = hex
    textOnBlack.style.color = hex

    ratioWhite.textContent = ratioW.toFixed(2) + ':1'
    ratioBlack.textContent = ratioB.toFixed(2) + ':1'

    aaWhite.textContent = 'AA ' + (ratioW >= 4.5 ? 'Pass' : 'Fail')
    aaWhite.className = 'cp-badge ' + (ratioW >= 4.5 ? 'pass' : 'fail')
    aaaWhite.textContent = 'AAA ' + (ratioW >= 7 ? 'Pass' : 'Fail')
    aaaWhite.className = 'cp-badge ' + (ratioW >= 7 ? 'pass' : 'fail')

    aaBlack.textContent = 'AA ' + (ratioB >= 4.5 ? 'Pass' : 'Fail')
    aaBlack.className = 'cp-badge ' + (ratioB >= 4.5 ? 'pass' : 'fail')
    aaaBlack.textContent = 'AAA ' + (ratioB >= 7 ? 'Pass' : 'Fail')
    aaaBlack.className = 'cp-badge ' + (ratioB >= 7 ? 'pass' : 'fail')
  }

  function addRecent(hex) {
    hex = hex.toLowerCase()
    var idx = recentColors.indexOf(hex)
    if (idx !== -1) recentColors.splice(idx, 1)
    recentColors.unshift(hex)
    if (recentColors.length > 8) recentColors.pop()
    renderRecent()
  }

  function renderRecent() {
    recentList.innerHTML = ''
    recentColors.forEach(function (hex) {
      var btn = document.createElement('button')
      btn.className = 'cp-recent-swatch'
      btn.style.background = hex
      btn.title = hex
      btn.addEventListener('click', function () {
        var rgb = hexToRgb(hex)
        if (rgb) updateFromRgb(rgb.r, rgb.g, rgb.b, 'recent')
      })
      recentList.appendChild(btn)
    })
  }

  // ── Event listeners ──
  picker.addEventListener('input', function () {
    var rgb = hexToRgb(picker.value)
    if (rgb) updateFromRgb(rgb.r, rgb.g, rgb.b, 'picker')
  })
  picker.addEventListener('change', function () {
    addRecent(picker.value)
  })

  hexInput.addEventListener('input', function () {
    var rgb = hexToRgb(hexInput.value)
    if (rgb) {
      updateFromRgb(rgb.r, rgb.g, rgb.b, 'hex')
      addRecent(hexInput.value)
    }
  })

  function onRgbInput() {
    var r = parseInt(rInput.value, 10)
    var g = parseInt(gInput.value, 10)
    var b = parseInt(bInput.value, 10)
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      updateFromRgb(
        Math.max(0, Math.min(255, r)),
        Math.max(0, Math.min(255, g)),
        Math.max(0, Math.min(255, b)),
        'rgb'
      )
      addRecent(rgbToHex(r, g, b))
    }
  }
  rInput.addEventListener('input', onRgbInput)
  gInput.addEventListener('input', onRgbInput)
  bInput.addEventListener('input', onRgbInput)

  function onHslInput() {
    var h = parseInt(hInput.value, 10)
    var s = parseInt(sInput.value, 10)
    var l = parseInt(lInput.value, 10)
    if (!isNaN(h) && !isNaN(s) && !isNaN(l)) {
      var rgb = hslToRgb(
        Math.max(0, Math.min(360, h)),
        Math.max(0, Math.min(100, s)),
        Math.max(0, Math.min(100, l))
      )
      updateFromRgb(rgb.r, rgb.g, rgb.b, 'hsl')
      addRecent(rgbToHex(rgb.r, rgb.g, rgb.b))
    }
  }
  hInput.addEventListener('input', onHslInput)
  sInput.addEventListener('input', onHslInput)
  lInput.addEventListener('input', onHslInput)

  // ── Copy buttons ──
  function copyWithFeedback(btn, text, label) {
    navigator.clipboard.writeText(text).then(function () {
      btn.textContent = 'Copied!'
      btn.classList.add('copied')
      setTimeout(function () {
        btn.textContent = label
        btn.classList.remove('copied')
      }, 2000)
    })
  }

  copyHex.addEventListener('click', function () {
    copyWithFeedback(copyHex, hexInput.value, 'Copy HEX')
  })
  copyRgb.addEventListener('click', function () {
    copyWithFeedback(copyRgb, 'rgb(' + currentR + ', ' + currentG + ', ' + currentB + ')', 'Copy RGB')
  })
  copyHsl.addEventListener('click', function () {
    copyWithFeedback(copyHsl, 'hsl(' + hInput.value + ', ' + sInput.value + '%, ' + lInput.value + '%)', 'Copy HSL')
  })

  // ── Init ──
  updateFromRgb(45, 110, 246, 'init')
})()
