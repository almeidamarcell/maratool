(function () {
  // ── Color conversion helpers ──
  function hexToRgb(hex) {
    hex = hex.replace(/^#/, '')
    if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2]
    if (hex.length !== 6) return null
    var n = parseInt(hex, 16)
    if (isNaN(n)) return null
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
  }

  function rgbToHex(r, g, b) {
    return '#' + [r,g,b].map(function (v) {
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
        if (t < 0) t += 1; if (t > 1) t -= 1
        if (t < 1/6) return p + (q-p)*6*t
        if (t < 1/2) return q
        if (t < 2/3) return p + (q-p)*(2/3-t)*6
        return p
      }
      var q = l < 0.5 ? l*(1+s) : l+s-l*s
      var p = 2*l-q
      r = hue2rgb(p, q, h + 1/3)
      g = hue2rgb(p, q, h)
      b = hue2rgb(p, q, h - 1/3)
    }
    return { r: Math.round(r*255), g: Math.round(g*255), b: Math.round(b*255) }
  }

  // ── Harmony definitions ──
  var HARMONIES = {
    complementary: { offsets: [0, 180], labels: ['Base', 'Complement'] },
    analogous: { offsets: [-30, 0, 30], labels: ['Analogous -30\u00b0', 'Base', 'Analogous +30\u00b0'] },
    triadic: { offsets: [0, 120, 240], labels: ['Base', 'Triadic +120\u00b0', 'Triadic +240\u00b0'] },
    split: { offsets: [0, 150, 210], labels: ['Base', 'Split +150\u00b0', 'Split +210\u00b0'] },
    tetradic: { offsets: [0, 60, 180, 240], labels: ['Base', 'Tetradic +60\u00b0', 'Tetradic +180\u00b0', 'Tetradic +240\u00b0'] },
    square: { offsets: [0, 90, 180, 270], labels: ['Base', 'Square +90\u00b0', 'Square +180\u00b0', 'Square +270\u00b0'] },
  }

  // ── DOM refs ──
  var picker = document.getElementById('chg-picker')
  var hexInput = document.getElementById('chg-hex')
  var harmonyTabs = document.getElementById('chg-harmony-tabs')
  var wheelCanvas = document.getElementById('chg-wheel')
  var swatchContainer = document.getElementById('chg-swatches')

  var state = {
    hex: '#2d6ef6',
    harmony: 'complementary'
  }

  // ── Tab switching ──
  harmonyTabs.addEventListener('click', function (e) {
    var btn = e.target.closest('.tool-tab')
    if (!btn) return
    var val = btn.getAttribute('data-harmony')
    state.harmony = val
    var btns = harmonyTabs.querySelectorAll('.tool-tab')
    for (var i = 0; i < btns.length; i++) btns[i].classList.toggle('active', btns[i] === btn)
    update()
  })

  // ── Compute harmony colors ──
  function getHarmonyColors() {
    var rgb = hexToRgb(state.hex)
    if (!rgb) return []
    var hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
    var h = HARMONIES[state.harmony]
    var colors = []
    for (var i = 0; i < h.offsets.length; i++) {
      var newH = (hsl.h + h.offsets[i] + 360) % 360
      var cRgb = hslToRgb(newH, hsl.s, hsl.l)
      var cHex = rgbToHex(cRgb.r, cRgb.g, cRgb.b)
      var cHsl = rgbToHsl(cRgb.r, cRgb.g, cRgb.b)
      colors.push({
        hex: cHex,
        rgb: cRgb,
        hsl: cHsl,
        hue: newH,
        label: h.labels[i]
      })
    }
    return colors
  }

  // ── Draw color wheel ──
  function drawWheel(colors) {
    var ctx = wheelCanvas.getContext('2d')
    var size = 280
    var cx = size / 2
    var cy = size / 2
    var outerR = 130
    var innerR = 90

    ctx.clearRect(0, 0, size, size)

    // Draw hue ring
    for (var deg = 0; deg < 360; deg++) {
      var rad1 = (deg - 90) * Math.PI / 180
      var rad2 = (deg + 1.5 - 90) * Math.PI / 180
      ctx.beginPath()
      ctx.arc(cx, cy, outerR, rad1, rad2)
      ctx.arc(cx, cy, innerR, rad2, rad1, true)
      ctx.closePath()
      ctx.fillStyle = 'hsl(' + deg + ', 100%, 50%)'
      ctx.fill()
    }

    // Center circle background
    ctx.beginPath()
    ctx.arc(cx, cy, innerR - 2, 0, Math.PI * 2)
    ctx.fillStyle = '#f7f7f5'
    ctx.fill()

    // Draw lines connecting harmony colors
    if (colors.length > 1) {
      ctx.beginPath()
      for (var i = 0; i < colors.length; i++) {
        var angle = (colors[i].hue - 90) * Math.PI / 180
        var midR = (outerR + innerR) / 2
        var px = cx + Math.cos(angle) * midR
        var py = cy + Math.sin(angle) * midR
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.strokeStyle = 'rgba(0,0,0,0.15)'
      ctx.lineWidth = 2
      ctx.stroke()
    }

    // Draw markers
    for (var i = 0; i < colors.length; i++) {
      var angle = (colors[i].hue - 90) * Math.PI / 180
      var midR = (outerR + innerR) / 2
      var mx = cx + Math.cos(angle) * midR
      var my = cy + Math.sin(angle) * midR

      ctx.beginPath()
      ctx.arc(mx, my, 10, 0, Math.PI * 2)
      ctx.fillStyle = colors[i].hex
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 3
      ctx.stroke()
      ctx.strokeStyle = 'rgba(0,0,0,0.2)'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    // Draw base color in center
    ctx.beginPath()
    ctx.arc(cx, cy, 30, 0, Math.PI * 2)
    ctx.fillStyle = state.hex
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 3
    ctx.stroke()
  }

  // ── Render swatches ──
  function renderSwatches(colors) {
    swatchContainer.innerHTML = ''
    for (var i = 0; i < colors.length; i++) {
      var c = colors[i]
      var card = document.createElement('div')
      card.className = 'chg-swatch-card'

      var preview = document.createElement('div')
      preview.className = 'chg-swatch-preview'
      preview.style.background = c.hex

      var details = document.createElement('div')
      details.className = 'chg-swatch-details'

      var label = document.createElement('div')
      label.className = 'chg-swatch-label'
      label.textContent = c.label

      var hexDiv = document.createElement('div')
      hexDiv.className = 'chg-swatch-hex'
      hexDiv.textContent = c.hex

      var formats = document.createElement('div')
      formats.className = 'chg-swatch-formats'
      formats.textContent = 'rgb(' + c.rgb.r + ', ' + c.rgb.g + ', ' + c.rgb.b + ')  \u00b7  hsl(' + c.hsl.h + ', ' + c.hsl.s + '%, ' + c.hsl.l + '%)'

      details.appendChild(label)
      details.appendChild(hexDiv)
      details.appendChild(formats)

      card.appendChild(preview)
      card.appendChild(details)

      ;(function (hex, cardEl) {
        cardEl.addEventListener('click', function () {
          navigator.clipboard.writeText(hex).then(function () {
            cardEl.classList.add('copied')
            var hexEl = cardEl.querySelector('.chg-swatch-hex')
            var orig = hexEl.textContent
            hexEl.textContent = 'Copied!'
            setTimeout(function () {
              cardEl.classList.remove('copied')
              hexEl.textContent = orig
            }, 2000)
          })
        })
      })(c.hex, card)

      swatchContainer.appendChild(card)
    }
  }

  // ── Update all ──
  function update() {
    var colors = getHarmonyColors()
    drawWheel(colors)
    renderSwatches(colors)
  }

  // ── Event listeners ──
  picker.addEventListener('input', function () {
    state.hex = picker.value
    hexInput.value = picker.value
    update()
  })

  hexInput.addEventListener('input', function () {
    var val = hexInput.value.trim()
    if (val.length >= 4) {
      var rgb = hexToRgb(val)
      if (rgb) {
        state.hex = rgbToHex(rgb.r, rgb.g, rgb.b)
        picker.value = state.hex
        update()
      }
    }
  })

  // ── Init ──
  update()
})()
