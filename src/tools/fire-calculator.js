import { calcFire, formatMoney } from './finance-fire-core.js'

;(function () {
  var savings = document.getElementById('fire-savings')
  var expenses = document.getElementById('fire-expenses')
  var income = document.getElementById('fire-income')
  var rate = document.getElementById('fire-return')
  var fiEl = document.getElementById('fire-fi')
  var yearsEl = document.getElementById('fire-years')
  var saveEl = document.getElementById('fire-save-rate')

  function update() {
    var r = calcFire({
      savings: parseFloat(savings.value) || 0,
      annualExpenses: parseFloat(expenses.value) || 0,
      annualIncome: parseFloat(income.value) || 0,
      expectedReturn: parseFloat(rate.value) || 7,
    })
    fiEl.textContent = formatMoney(r.fiNumber)
    yearsEl.textContent = r.years == null ? '—' : r.years + ' years'
    saveEl.textContent = r.saveRatePct.toFixed(1) + '%'
  }
  ;[savings, expenses, income, rate].forEach(function (el) { el.addEventListener('input', update) })
  update()
})()
