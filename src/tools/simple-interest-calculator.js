import { simpleInterest } from './wave5-debt-core.js'
import { formatMoney } from './finance-amortization-core.js'

;(function () {
  var principal = document.getElementById('si-principal')
  var rate = document.getElementById('si-rate')
  var time = document.getElementById('si-time')
  var unit = document.getElementById('si-unit')
  var interestEl = document.getElementById('si-interest')
  var totalEl = document.getElementById('si-total')
  var compoundEl = document.getElementById('si-compound')

  function update() {
    var r = simpleInterest(principal.value, rate.value, time.value, unit.value)
    if (!r) {
      interestEl.textContent = '—'
      totalEl.textContent = '—'
      compoundEl.textContent = '—'
      return
    }
    interestEl.textContent = formatMoney(r.interest)
    totalEl.textContent = formatMoney(r.total)
    // Same rate compounded annually — shows what "simple" is giving up (or saving).
    var p = parseFloat(principal.value)
    var annual = parseFloat(rate.value) / 100
    compoundEl.textContent = formatMoney(p * Math.pow(1 + annual, r.years))
  }

  ;[principal, rate, time].forEach(function (el) { el.addEventListener('input', update) })
  unit.addEventListener('change', update)
  update()
})()
