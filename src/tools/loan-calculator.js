import { buildAmortizationSchedule, formatMoney } from './finance-amortization-core.js'

;(function () {
  var amount = document.getElementById('lc-amount')
  var rate = document.getElementById('lc-rate')
  var months = document.getElementById('lc-months')
  var paymentEl = document.getElementById('lc-payment')
  var interestEl = document.getElementById('lc-interest')
  var totalEl = document.getElementById('lc-total')

  function update() {
    var p = parseFloat(amount.value) || 0
    var r = parseFloat(rate.value) || 0
    var m = parseInt(months.value, 10) || 0
    if (p <= 0 || m <= 0) {
      paymentEl.textContent = '—'
      interestEl.textContent = '—'
      totalEl.textContent = '—'
      return
    }
    var result = buildAmortizationSchedule(p, r, m)
    paymentEl.textContent = formatMoney(result.monthlyPayment)
    interestEl.textContent = formatMoney(result.totalInterest)
    totalEl.textContent = formatMoney(result.totalPayment)
  }

  ;[amount, rate, months].forEach(function (el) { el.addEventListener('input', update) })
  update()
})()
