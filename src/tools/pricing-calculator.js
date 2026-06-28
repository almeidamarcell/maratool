import { pricingFromCost, pricingFromMargin, formatMoney, formatPct } from './business-calc-core.js'

;(function () {
  var cost = document.getElementById('pr-cost')
  var mode = document.getElementById('pr-mode')
  var pct = document.getElementById('pr-pct')
  var priceEl = document.getElementById('pr-price')
  var profitEl = document.getElementById('pr-profit')
  var marginEl = document.getElementById('pr-margin')

  function update() {
    var c = parseFloat(cost.value) || 0
    var p = parseFloat(pct.value) || 0
    var r = mode.value === 'markup' ? pricingFromCost(c, p) : pricingFromMargin(c, p)
    priceEl.textContent = formatMoney(r.price)
    profitEl.textContent = formatMoney(r.profit)
    marginEl.textContent = formatPct(r.margin)
  }
  ;[cost, mode, pct].forEach(function (el) { el.addEventListener('input', update); el.addEventListener('change', update) })
  update()
})()
