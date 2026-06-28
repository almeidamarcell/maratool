import { breakEven, formatMoney, formatPct } from './business-calc-core.js'

;(function () {
  var fixed = document.getElementById('be-fixed')
  var price = document.getElementById('be-price')
  var variable = document.getElementById('be-variable')
  var unitsEl = document.getElementById('be-units')
  var revenueEl = document.getElementById('be-revenue')
  var marginEl = document.getElementById('be-margin')

  function update() {
    var f = parseFloat(fixed.value) || 0
    var p = parseFloat(price.value) || 0
    var v = parseFloat(variable.value) || 0
    var result = breakEven(f, p, v)
    if (!result) {
      unitsEl.textContent = revenueEl.textContent = marginEl.textContent = '—'
      return
    }
    unitsEl.textContent = Math.ceil(result.units).toLocaleString() + ' units'
    revenueEl.textContent = formatMoney(result.revenue)
    marginEl.textContent = formatPct(result.contributionMargin)
  }

  ;[fixed, price, variable].forEach(function (el) { el.addEventListener('input', update) })
  update()
})()
