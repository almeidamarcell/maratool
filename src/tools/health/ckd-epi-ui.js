import { ckdEpi2021 } from './ckd-epi.js'
import { classifyGFR } from './cockcroft-gault.js'

;(function () {
  var ageIn = document.getElementById('ckd-age')
  var crIn = document.getElementById('ckd-cr')
  var sexIn = document.getElementById('ckd-sex')
  var out = document.getElementById('ckd-value')
  var cls = document.getElementById('ckd-class')
  function update() {
    var age = parseFloat(ageIn.value)
    var cr = parseFloat(crIn.value)
    var sex = sexIn.value
    if (!age || !cr) {
      out.textContent = '—'; cls.textContent = '—'
      cls.className = 'hcalc-output-value'
      return
    }
    var egfr = ckdEpi2021({ age: age, sex: sex, creatinineMgDl: cr })
    out.textContent = egfr !== null ? egfr + ' mL/min/1.73m²' : '—'
    var c = classifyGFR(egfr)
    cls.textContent = c || '—'
    cls.className = 'hcalc-output-value'
    if (c && (c.startsWith('G1') || c.startsWith('G2'))) cls.classList.add('cls-normal')
    else if (c && c.startsWith('G3')) cls.classList.add('cls-warn')
    else if (c && (c.startsWith('G4') || c.startsWith('G5'))) cls.classList.add('cls-danger')
  }
  [ageIn, crIn].forEach(function (i) { i.addEventListener('input', update) })
  sexIn.addEventListener('change', update)

  document.querySelectorAll('.copy-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var el = document.getElementById(btn.getAttribute('data-target'))
      if (!el || el.textContent === '—') return
      navigator.clipboard.writeText(el.textContent).then(function () {
        var o = btn.textContent
        btn.textContent = 'Copied!'
        setTimeout(function () { btn.textContent = o }, 2000)
      })
    })
  })
})()
