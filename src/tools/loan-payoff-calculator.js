import { loanPayoff, formatMonths } from './wave5-debt-core.js'
import { formatMoney } from './finance-amortization-core.js'

;(function () {
  var balance = document.getElementById('lp-balance')
  var apr = document.getElementById('lp-apr')
  var payment = document.getElementById('lp-payment')
  var extra = document.getElementById('lp-extra')
  var warnEl = document.getElementById('lp-warning')
  var baseTime = document.getElementById('lp-base-time')
  var baseInterest = document.getElementById('lp-base-interest')
  var extraTime = document.getElementById('lp-extra-time')
  var extraInterest = document.getElementById('lp-extra-interest')
  var savedTime = document.getElementById('lp-saved-time')
  var savedInterest = document.getElementById('lp-saved-interest')

  function setVisible(el, visible) {
    if (visible) el.removeAttribute('hidden')
    else el.setAttribute('hidden', '')
  }

  function clear() {
    ;[baseTime, baseInterest, extraTime, extraInterest, savedTime, savedInterest].forEach(function (el) { el.textContent = '—' })
    setVisible(warnEl, false)
  }

  function update() {
    var base = loanPayoff(balance.value, apr.value, payment.value, 0)
    if (!base) { clear(); return }
    if (base.neverPaysOff) {
      clear()
      warnEl.textContent = 'This payment never pays off the loan — monthly interest alone is ' + formatMoney(base.monthlyInterest) + '. Pay more than that.'
      setVisible(warnEl, true)
      return
    }
    setVisible(warnEl, false)
    baseTime.textContent = formatMonths(base.months)
    baseInterest.textContent = formatMoney(base.totalInterest)

    var extraAmt = parseFloat(extra.value) || 0
    if (extraAmt <= 0) {
      ;[extraTime, extraInterest, savedTime, savedInterest].forEach(function (el) { el.textContent = '—' })
      return
    }
    var boosted = loanPayoff(balance.value, apr.value, payment.value, extraAmt)
    extraTime.textContent = formatMonths(boosted.months)
    extraInterest.textContent = formatMoney(boosted.totalInterest)
    savedTime.textContent = formatMonths(base.months - boosted.months)
    savedInterest.textContent = formatMoney(base.totalInterest - boosted.totalInterest)
  }

  ;[balance, apr, payment, extra].forEach(function (el) { el.addEventListener('input', update) })
  update()
})()
