import { inflationAdjust, formatMoney } from './finance-inflation-core.js'

;(function () {
  var amount = document.getElementById('inf-amount')
  var from = document.getElementById('inf-from')
  var to = document.getElementById('inf-to')
  var adj = document.getElementById('inf-adjusted')
  var pct = document.getElementById('inf-pct')

  function update() {
    var r = inflationAdjust(parseFloat(amount.value) || 0, parseInt(from.value, 10), parseInt(to.value, 10))
    adj.textContent = formatMoney(r.adjusted)
    pct.textContent = (r.pctChange >= 0 ? '+' : '') + r.pctChange.toFixed(1) + '%'
  }
  ;[amount, from, to].forEach(function (el) { el.addEventListener('input', update) })
  update()
})()
