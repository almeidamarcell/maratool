import { compoundInterest, formatMoney } from './finance-compound-core.js'

;(function () {
  var principal = document.getElementById('ci-principal')
  var rate = document.getElementById('ci-rate')
  var years = document.getElementById('ci-years')
  var monthly = document.getElementById('ci-monthly')
  var finalEl = document.getElementById('ci-final')
  var interestEl = document.getElementById('ci-interest')
  var contributedEl = document.getElementById('ci-contributed')

  function update() {
    var p = parseFloat(principal.value) || 0
    var r = parseFloat(rate.value) || 0
    var y = parseInt(years.value, 10) || 0
    var m = parseFloat(monthly.value) || 0
    if (y <= 0) {
      finalEl.textContent = '—'
      interestEl.textContent = '—'
      contributedEl.textContent = '—'
      return
    }
    var result = compoundInterest(p, r, y, m)
    finalEl.textContent = formatMoney(result.finalBalance)
    interestEl.textContent = formatMoney(result.totalInterest)
    contributedEl.textContent = formatMoney(result.totalContributed)
  }

  ;[principal, rate, years, monthly].forEach(function (el) { el.addEventListener('input', update) })
  update()
})()
