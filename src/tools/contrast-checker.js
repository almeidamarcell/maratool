(function () {
  var fgPicker = document.getElementById('cc-fg-picker')
  var fgHex = document.getElementById('cc-fg-hex')
  var bgPicker = document.getElementById('cc-bg-picker')
  var bgHex = document.getElementById('cc-bg-hex')
  var swapBtn = document.getElementById('cc-swap')
  var preview = document.getElementById('cc-preview')
  var ratioEl = document.getElementById('cc-ratio')
  var aaNormal = document.getElementById('cc-aa-normal')
  var aaLarge = document.getElementById('cc-aa-large')
  var aaaNormal = document.getElementById('cc-aaa-normal')
  var aaaLarge = document.getElementById('cc-aaa-large')
  var uiComp = document.getElementById('cc-ui')

  function hexToRgb(hex) {
    hex = hex.replace(/^#/, '')
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
    if (hex.length !== 6) return null
    var n = parseInt(hex, 16)
    if (isNaN(n)) return null
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
  }

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

  function normalizeHex(val) {
    var v = val.trim()
    if (v.charAt(0) !== '#') v = '#' + v
    return v
  }

  function setBadge(el, pass) {
    el.textContent = pass ? 'Pass' : 'Fail'
    el.className = 'tool-badge ' + (pass ? 'pass' : 'fail')
  }

  function update() {
    var fg = normalizeHex(fgHex.value)
    var bg = normalizeHex(bgHex.value)
    var fgRgb = hexToRgb(fg)
    var bgRgb = hexToRgb(bg)

    if (!fgRgb || !bgRgb) {
      ratioEl.textContent = '\u2014'
      return
    }

    var l1 = luminance(fgRgb.r, fgRgb.g, fgRgb.b)
    var l2 = luminance(bgRgb.r, bgRgb.g, bgRgb.b)
    var ratio = contrastRatio(l1, l2)

    ratioEl.textContent = ratio.toFixed(2) + ':1'
    preview.style.color = fg
    preview.style.backgroundColor = bg

    setBadge(aaNormal, ratio >= 4.5)
    setBadge(aaLarge, ratio >= 3)
    setBadge(aaaNormal, ratio >= 7)
    setBadge(aaaLarge, ratio >= 4.5)
    setBadge(uiComp, ratio >= 3)

    writeHash({ fg: fg, bg: bg })
  }

  fgPicker.addEventListener('input', function () {
    fgHex.value = fgPicker.value
    update()
  })
  fgHex.addEventListener('input', function () {
    var rgb = hexToRgb(normalizeHex(fgHex.value))
    if (rgb) fgPicker.value = normalizeHex(fgHex.value)
    update()
  })
  bgPicker.addEventListener('input', function () {
    bgHex.value = bgPicker.value
    update()
  })
  bgHex.addEventListener('input', function () {
    var rgb = hexToRgb(normalizeHex(bgHex.value))
    if (rgb) bgPicker.value = normalizeHex(bgHex.value)
    update()
  })

  swapBtn.addEventListener('click', function () {
    var tmpHex = fgHex.value
    var tmpPicker = fgPicker.value
    fgHex.value = bgHex.value
    fgPicker.value = bgPicker.value
    bgHex.value = tmpHex
    bgPicker.value = tmpPicker
    update()
  })

  // Restore from hash
  var state = readHash()
  if (state.fg) { fgHex.value = state.fg; fgPicker.value = state.fg }
  if (state.bg) { bgHex.value = state.bg; bgPicker.value = state.bg }

  update()
})()
