import { commission, formatMoney, formatPct } from './business-calc-core.js'

;(function () {
  var amount = document.getElementById('com-amount')
  var rate = document.getElementById('com-rate')
  var commEl = document.getElementById('com-commission')
  var netEl = document.getElementById('com-net')

  function update() {
    var r = commission(parseFloat(amount.value) || 0, parseFloat(rate.value) || 0)
    commEl.textContent = formatMoney(r.commission)
    netEl.textContent = formatMoney(r.net)
  }
  ;[amount, rate].forEach(function (el) { el.addEventListener('input', update) })
  update()
})()
