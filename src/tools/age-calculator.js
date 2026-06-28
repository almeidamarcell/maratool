import { calcAge } from './date-tools-core.js'

;(function () {
  var birth = document.getElementById('age-birth')
  var target = document.getElementById('age-target')
  var years = document.getElementById('age-years')
  var months = document.getElementById('age-months')
  var days = document.getElementById('age-days')
  var total = document.getElementById('age-total')

  target.value = new Date().toISOString().slice(0, 10)

  function update() {
    var r = calcAge(birth.value, target.value)
    if (!r) { years.textContent = months.textContent = days.textContent = total.textContent = '—'; return }
    years.textContent = r.years
    months.textContent = r.months
    days.textContent = r.days
    total.textContent = r.totalDays.toLocaleString() + ' days'
  }
  ;[birth, target].forEach(function (el) { el.addEventListener('input', update); el.addEventListener('change', update) })
  update()
})()
