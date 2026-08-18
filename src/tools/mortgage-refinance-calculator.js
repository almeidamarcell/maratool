import { refinance, formatMonths } from './wave5-debt-core.js'
import { formatMoney } from './finance-amortization-core.js'

;(function () {
  var balance = document.getElementById('rf-balance')
  var oldRate = document.getElementById('rf-old-rate')
  var oldYears = document.getElementById('rf-old-years')
  var newRate = document.getElementById('rf-new-rate')
  var newYears = document.getElementById('rf-new-years')
  var closing = document.getElementById('rf-closing')
  var oldPayEl = document.getElementById('rf-old-payment')
  var newPayEl = document.getElementById('rf-new-payment')
  var monthlyEl = document.getElementById('rf-monthly-savings')
  var breakEvenEl = document.getElementById('rf-break-even')
  var lifetimeEl = document.getElementById('rf-lifetime')
  var noteEl = document.getElementById('rf-note')

  function update() {
    var r = refinance(balance.value, oldRate.value, (parseFloat(oldYears.value) || 0) * 12, newRate.value, (parseFloat(newYears.value) || 0) * 12, closing.value)
    if (!r) {
      ;[oldPayEl, newPayEl, monthlyEl, breakEvenEl, lifetimeEl].forEach(function (el) { el.textContent = '—' })
      noteEl.textContent = ''
      return
    }
    oldPayEl.textContent = formatMoney(r.oldPayment)
    newPayEl.textContent = formatMoney(r.newPayment)
    monthlyEl.textContent = (r.monthlySavings < 0 ? '−' : '') + formatMoney(Math.abs(r.monthlySavings))
    breakEvenEl.textContent = r.breakEvenMonths === null ? 'never' : formatMonths(r.breakEvenMonths)
    lifetimeEl.textContent = (r.lifetimeSavings < 0 ? '−' : '') + formatMoney(Math.abs(r.lifetimeSavings))
    if (r.monthlySavings > 0 && r.lifetimeSavings < 0) {
      noteEl.textContent = 'The new payment is lower, but stretching the term means you pay more interest overall. Refinancing here trades total cost for monthly breathing room.'
    } else if (r.monthlySavings > 0 && r.lifetimeSavings > 0) {
      noteEl.textContent = 'You save monthly and over the life of the loan. If you stay past the break-even point, the refinance pays for itself.'
    } else if (r.monthlySavings <= 0) {
      noteEl.textContent = 'The new payment is not lower than your current one — this refinance only makes sense for other reasons (e.g. dropping mortgage insurance or a cash-out).'
    } else {
      noteEl.textContent = ''
    }
  }

  ;[balance, oldRate, oldYears, newRate, newYears, closing].forEach(function (el) { el.addEventListener('input', update) })
  update()
})()
