import './hash-state.js'
// CSS Gradient Generator
(function () {
  var preview = document.getElementById('gradient-preview')
  var output = document.getElementById('gradient-output')
  var color1 = document.getElementById('color-1')
  var color2 = document.getElementById('color-2')
  var angleSlider = document.getElementById('angle-slider')
  var angleValue = document.getElementById('angle-value')
  var angleGroup = document.getElementById('angle-group')
  var linearBtn = document.getElementById('type-linear')
  var radialBtn = document.getElementById('type-radial')
  var copyBtn = document.getElementById('gradient-copy')

  var gradientType = 'linear'

  function update() {
    var c1 = color1.value
    var c2 = color2.value
    var angle = angleSlider.value
    var css

    if (gradientType === 'linear') {
      css = 'background: linear-gradient(' + angle + 'deg, ' + c1 + ', ' + c2 + ');'
    } else {
      css = 'background: radial-gradient(circle, ' + c1 + ', ' + c2 + ');'
    }

    preview.style.cssText = css
    output.textContent = css
    angleValue.textContent = angle
  }

  function saveState() {
    HashState.save({
      type: gradientType,
      c1: color1.value,
      c2: color2.value,
      angle: angleSlider.value
    })
  }

  function setType(type) {
    gradientType = type
    if (type === 'linear') {
      linearBtn.classList.add('active')
      radialBtn.classList.remove('active')
      angleGroup.style.display = ''
    } else {
      radialBtn.classList.add('active')
      linearBtn.classList.remove('active')
      angleGroup.style.display = 'none'
    }
    update()
    saveState()
  }

  color1.addEventListener('input', function () { update(); saveState() })
  color2.addEventListener('input', function () { update(); saveState() })
  angleSlider.addEventListener('input', function () { update(); saveState() })
  linearBtn.addEventListener('click', function () { setType('linear') })
  radialBtn.addEventListener('click', function () { setType('radial') })

  // Direction presets
  document.querySelectorAll('.preset-dir').forEach(function (btn) {
    btn.addEventListener('click', function () {
      angleSlider.value = btn.dataset.angle
      setType('linear')
    })
  })

  // Color presets
  document.querySelectorAll('.gradient-swatch').forEach(function (swatch) {
    swatch.style.background = 'linear-gradient(135deg, ' + swatch.dataset.c1 + ', ' + swatch.dataset.c2 + ')'
    swatch.addEventListener('click', function () {
      color1.value = swatch.dataset.c1
      color2.value = swatch.dataset.c2
      update()
      saveState()
    })
  })

  // Copy
  copyBtn.addEventListener('click', function () {
    navigator.clipboard.writeText(output.textContent).then(function () {
      copyBtn.textContent = 'Copied!'
      copyBtn.classList.add('copied')
      setTimeout(function () {
        copyBtn.textContent = 'Copy CSS'
        copyBtn.classList.remove('copied')
      }, 2000)
    })
  })

  // Restore from hash state
  var _hs = HashState.parse()
  if (_hs.c1) color1.value = _hs.c1
  if (_hs.c2) color2.value = _hs.c2
  if (_hs.angle) angleSlider.value = _hs.angle
  if (_hs.type) {
    setType(_hs.type)
  } else {
    update()
  }
})()
