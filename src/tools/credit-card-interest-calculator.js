import { creditCardPayoff, formatMonths } from './wave5-debt-core.js'
import { formatMoney } from './finance-amortization-core.js'

;(function () {
  var balance = document.getElementById('cc-balance')
  var apr = document.getElementById('cc-apr')
  var payment = document.getElementById('cc-payment')
  var warnEl = document.getElementById('cc-warning')
  var fixedTime = document.getElementById('cc-fixed-time')
  var fixedInterest = document.getElementById('cc-fixed-interest')
  var fixedTotal = document.getElementById('cc-fixed-total')
  var minTime = document.getElementById('cc-min-time')
  var minInterest = document.getElementById('cc-min-interest')
  var minTotal = document.getElementById('cc-min-total')
  var savingsEl = document.getElementById('cc-savings')

  function setVisible(el, visible) {
    if (visible) el.removeAttribute('hidden')
    else el.setAttribute('hidden', '')
  }

  function clear() {
    ;[fixedTime, fixedInterest, fixedTotal, minTime, minInterest, minTotal].forEach(function (el) { el.textContent = '—' })
    savingsEl.textContent = ''
    setVisible(warnEl, false)
  }

  function update() {
    var bal = parseFloat(balance.value)
    var rate = parseFloat(apr.value)
    if (!(bal > 0) || !(rate >= 0)) { clear(); return }

    var min = creditCardPayoff(bal, rate, { mode: 'minimum', minPct: 1, minFloor: 25 })
    if (min && !min.neverPaysOff) {
      minTime.textContent = formatMonths(min.months)
      minInterest.textContent = formatMoney(min.totalInterest)
      minTotal.textContent = formatMoney(min.totalPaid)
    }

    var pay = parseFloat(payment.value)
    if (!(pay > 0)) {
      ;[fixedTime, fixedInterest, fixedTotal].forEach(function (el) { el.textContent = '—' })
      savingsEl.textContent = ''
      setVisible(warnEl, false)
      return
    }
    var fixed = creditCardPayoff(bal, rate, { mode: 'fixed', payment: pay })
    if (fixed.neverPaysOff) {
      ;[fixedTime, fixedInterest, fixedTotal].forEach(function (el) { el.textContent = '—' })
      warnEl.textContent = 'This payment never pays off the balance — monthly interest alone is ' + formatMoney(fixed.monthlyInterest) + '. Pay more than that.'
      setVisible(warnEl, true)
      savingsEl.textContent = ''
      return
    }
    setVisible(warnEl, false)
    fixedTime.textContent = formatMonths(fixed.months)
    fixedInterest.textContent = formatMoney(fixed.totalInterest)
    fixedTotal.textContent = formatMoney(fixed.totalPaid)
    if (min && !min.neverPaysOff && min.totalInterest > fixed.totalInterest) {
      savingsEl.textContent = 'Paying ' + formatMoney(pay) + '/mo instead of the minimum saves ' + formatMoney(min.totalInterest - fixed.totalInterest) + ' in interest and clears the debt ' + formatMonths(min.months - fixed.months) + ' sooner.'
    } else {
      savingsEl.textContent = ''
    }
  }

  ;[balance, apr, payment].forEach(function (el) { el.addEventListener('input', update) })
  update()
})()
