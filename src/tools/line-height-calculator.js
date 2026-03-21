(function () {
  var fontSizeInput = document.getElementById('lh-font-size')
  var ratioSlider = document.getElementById('lh-ratio')
  var ratioDisplay = document.getElementById('lh-ratio-display')
  var valPx = document.getElementById('lh-val-px')
  var valEm = document.getElementById('lh-val-em')
  var valUnitless = document.getElementById('lh-val-unitless')
  var preview = document.getElementById('lh-preview')
  var presets = document.querySelectorAll('.lh-preset')

  var values = { px: '', em: '', unitless: '' }

  function calculate() {
    var fontSize = parseFloat(fontSizeInput.value) || 16
    var ratio = parseFloat(ratioSlider.value) || 1.5

    var lineHeightPx = fontSize * ratio

    values.px = lineHeightPx.toFixed(1) + 'px'
    values.em = ratio.toFixed(3) + 'em'
    values.unitless = ratio.toFixed(3)

    valPx.textContent = values.px
    valEm.textContent = values.em
    valUnitless.textContent = values.unitless

    ratioDisplay.textContent = ratio.toFixed(2)

    // Update preview — cap preview font size at 32px for readability
    var previewSize = Math.min(fontSize, 32)
    preview.style.fontSize = previewSize + 'px'
    preview.style.lineHeight = ratio.toString()

    // Update active preset
    presets.forEach(function (btn) {
      var presetRatio = parseFloat(btn.getAttribute('data-ratio'))
      if (Math.abs(presetRatio - ratio) < 0.01) {
        btn.classList.add('active')
      } else {
        btn.classList.remove('active')
      }
    })
  }

  fontSizeInput.addEventListener('input', calculate)
  ratioSlider.addEventListener('input', calculate)

  // ── Preset buttons ──

  presets.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var ratio = btn.getAttribute('data-ratio')
      ratioSlider.value = ratio
      calculate()
    })
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

  document.querySelectorAll('[data-lh-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var field = btn.getAttribute('data-lh-copy')
      if (values[field]) copyText(values[field], btn)
    })
  })

  // ── Init ──

  calculate()
})()
