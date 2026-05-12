import { calculateBMI, classifyBMI, calculateBSA } from './bmi.js'

;(function () {
  var weightInput = document.getElementById('bmi-weight')
  var heightInput = document.getElementById('bmi-height')
  var bmiOut = document.getElementById('bmi-value')
  var classOut = document.getElementById('bmi-class')
  var bsaOut = document.getElementById('bmi-bsa')

  function update() {
    var w = parseFloat(weightInput.value)
    var h = parseFloat(heightInput.value)

    if (!w || !h) {
      bmiOut.textContent = '—'
      classOut.textContent = '—'
      bsaOut.textContent = '—'
      classOut.className = 'bmi-output-value'
      return
    }

    var bmi = calculateBMI(w, h)
    var cls = classifyBMI(bmi)
    var bsa = calculateBSA(w, h)

    bmiOut.textContent = bmi !== null ? bmi.toFixed(1) + ' kg/m²' : '—'
    classOut.textContent = cls || '—'
    bsaOut.textContent = bsa !== null ? bsa.toFixed(2) + ' m²' : '—'

    classOut.className = 'bmi-output-value'
    if (cls === 'Underweight') classOut.classList.add('cls-under')
    else if (cls === 'Normal weight') classOut.classList.add('cls-normal')
    else if (cls === 'Overweight') classOut.classList.add('cls-over')
    else if (cls && cls.startsWith('Obesity')) classOut.classList.add('cls-obese')
  }

  weightInput.addEventListener('input', update)
  heightInput.addEventListener('input', update)

  document.querySelectorAll('.copy-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var targetId = btn.getAttribute('data-target')
      var el = document.getElementById(targetId)
      if (!el || el.textContent === '—') return
      navigator.clipboard.writeText(el.textContent).then(function () {
        var orig = btn.textContent
        btn.textContent = 'Copied!'
        setTimeout(function () { btn.textContent = orig }, 2000)
      })
    })
  })
})()
