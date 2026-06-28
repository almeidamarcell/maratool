import { addVat, removeVat, formatMoney } from './business-calc-core.js'

;(function () {
  var amount = document.getElementById('vat-amount')
  var rate = document.getElementById('vat-rate')
  var mode = document.getElementById('vat-mode')
  var netEl = document.getElementById('vat-net')
  var taxEl = document.getElementById('vat-tax')
  var grossEl = document.getElementById('vat-gross')

  function update() {
    var a = parseFloat(amount.value) || 0
    var r = parseFloat(rate.value) || 0
    if (a <= 0) {
      netEl.textContent = taxEl.textContent = grossEl.textContent = '—'
      return
    }
    var result = mode.value === 'add' ? addVat(a, r) : removeVat(a, r)
    netEl.textContent = formatMoney(result.net)
    taxEl.textContent = formatMoney(result.tax)
    grossEl.textContent = formatMoney(result.gross)
  }

  ;[amount, rate, mode].forEach(function (el) { el.addEventListener('input', update); el.addEventListener('change', update) })
  update()
})()
