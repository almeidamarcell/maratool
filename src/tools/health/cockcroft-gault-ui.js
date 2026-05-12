import { cockcroftGault, classifyGFR } from './cockcroft-gault.js'

;(function () {
  var ageIn = document.getElementById('cg-age')
  var wtIn = document.getElementById('cg-weight')
  var crIn = document.getElementById('cg-cr')
  var sexIn = document.getElementById('cg-sex')
  var out = document.getElementById('cg-value')
  var cls = document.getElementById('cg-class')

  function update() {
    var age = parseFloat(ageIn.value)
    var weight = parseFloat(wtIn.value)
    var cr = parseFloat(crIn.value)
    var sex = sexIn.value
    if (!age || !weight || !cr) {
      out.textContent = '—'; cls.textContent = '—'
      cls.className = 'hcalc-output-value'
      return
    }
    var crcl = cockcroftGault({ age: age, weightKg: weight, creatinineMgDl: cr, sex: sex })
    out.textContent = crcl !== null ? crcl + ' mL/min' : '—'
    var c = classifyGFR(crcl)
    cls.textContent = c || '—'
    cls.className = 'hcalc-output-value'
    if (c && (c.startsWith('G1') || c.startsWith('G2'))) cls.classList.add('cls-normal')
    else if (c && c.startsWith('G3')) cls.classList.add('cls-warn')
    else if (c && (c.startsWith('G4') || c.startsWith('G5'))) cls.classList.add('cls-danger')
  }
  [ageIn, wtIn, crIn].forEach(function (i) { i.addEventListener('input', update) })
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
