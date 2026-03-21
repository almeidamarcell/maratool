(function () {
  var widthInput = document.getElementById('pg-width')
  var heightInput = document.getElementById('pg-height')
  var bgColor = document.getElementById('pg-bg')
  var bgHex = document.getElementById('pg-bg-hex')
  var fgColor = document.getElementById('pg-fg')
  var fgHex = document.getElementById('pg-fg-hex')
  var textInput = document.getElementById('pg-text')
  var canvas = document.getElementById('pg-canvas')
  var downloadBtn = document.getElementById('pg-download')
  var presets = document.querySelectorAll('.pg-preset')

  function getWidth() {
    var v = parseInt(widthInput.value, 10)
    return (v && v > 0 && v <= 4096) ? v : 800
  }

  function getHeight() {
    var v = parseInt(heightInput.value, 10)
    return (v && v > 0 && v <= 4096) ? v : 600
  }

  function getText() {
    var custom = textInput.value.trim()
    if (custom) return custom
    return getWidth() + ' \u00d7 ' + getHeight()
  }

  function render() {
    var w = getWidth()
    var h = getHeight()
    var bg = bgColor.value
    var fg = fgColor.value
    var text = getText()

    canvas.width = w
    canvas.height = h
    var ctx = canvas.getContext('2d')

    // Background
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, w, h)

    // Auto font size: roughly 1/8 of the smaller dimension, clamped
    var fontSize = Math.max(12, Math.min(Math.min(w, h) / 8, 120))
    ctx.fillStyle = fg
    ctx.font = 'bold ' + fontSize + 'px Inter, -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, w / 2, h / 2)
  }

  function download() {
    var w = getWidth()
    var h = getHeight()
    canvas.toBlob(function (blob) {
      if (!blob) return
      var url = URL.createObjectURL(blob)
      var a = document.createElement('a')
      a.href = url
      a.download = 'placeholder-' + w + 'x' + h + '.png'
      a.click()
      URL.revokeObjectURL(url)
    }, 'image/png')
  }

  // ── Sync color inputs ──

  bgColor.addEventListener('input', function () {
    bgHex.value = bgColor.value
    render()
  })

  bgHex.addEventListener('input', function () {
    if (/^#[0-9a-f]{6}$/i.test(bgHex.value)) {
      bgColor.value = bgHex.value
      render()
    }
  })

  fgColor.addEventListener('input', function () {
    fgHex.value = fgColor.value
    render()
  })

  fgHex.addEventListener('input', function () {
    if (/^#[0-9a-f]{6}$/i.test(fgHex.value)) {
      fgColor.value = fgHex.value
      render()
    }
  })

  // ── Other inputs ──

  widthInput.addEventListener('input', render)
  heightInput.addEventListener('input', render)
  textInput.addEventListener('input', render)

  // ── Presets ──

  for (var i = 0; i < presets.length; i++) {
    presets[i].addEventListener('click', function () {
      widthInput.value = this.getAttribute('data-w')
      heightInput.value = this.getAttribute('data-h')
      render()
    })
  }

  // ── Download ──

  downloadBtn.addEventListener('click', download)

  // ── Initial render ──

  render()
})()
