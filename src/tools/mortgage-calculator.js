import { buildAmortizationSchedule, formatMoney } from './finance-amortization-core.js'

;(function () {
  var amount = document.getElementById('mc-amount')
  var rate = document.getElementById('mc-rate')
  var years = document.getElementById('mc-years')
  var paymentEl = document.getElementById('mc-payment')
  var interestEl = document.getElementById('mc-interest')
  var totalEl = document.getElementById('mc-total')
  var scheduleEl = document.getElementById('mc-schedule')

  function update() {
    var p = parseFloat(amount.value) || 0
    var r = parseFloat(rate.value) || 0
    var y = parseFloat(years.value) || 0
    var months = Math.round(y * 12)
    if (p <= 0 || months <= 0) {
      paymentEl.textContent = '—'
      interestEl.textContent = '—'
      totalEl.textContent = '—'
      scheduleEl.innerHTML = ''
      return
    }
    var result = buildAmortizationSchedule(p, r, months)
    paymentEl.textContent = formatMoney(result.monthlyPayment)
    interestEl.textContent = formatMoney(result.totalInterest)
    totalEl.textContent = formatMoney(result.totalPayment)
    var rows = result.schedule.slice(0, 12).map(function (row) {
      return '<tr><td>' + row.month + '</td><td>' + formatMoney(row.payment) + '</td><td>' + formatMoney(row.principal) + '</td><td>' + formatMoney(row.interest) + '</td><td>' + formatMoney(row.balance) + '</td></tr>'
    }).join('')
    var more = result.schedule.length > 12 ? '<tr><td colspan="5" style="color:var(--text-3);font-size:12px;">… ' + (result.schedule.length - 12) + ' more months</td></tr>' : ''
    scheduleEl.innerHTML = '<table class="amort-table"><thead><tr><th>#</th><th>Payment</th><th>Principal</th><th>Interest</th><th>Balance</th></tr></thead><tbody>' + rows + more + '</tbody></table>'
  }

  ;[amount, rate, years].forEach(function (el) { el.addEventListener('input', update) })
  update()
})()
