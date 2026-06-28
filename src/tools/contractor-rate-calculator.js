import { contractorRate, formatMoney } from './business-calc-core.js'

;(function () {
  var salary = document.getElementById('cr-salary')
  var hours = document.getElementById('cr-hours')
  var expense = document.getElementById('cr-expense')
  var tax = document.getElementById('cr-tax')
  var hourlyEl = document.getElementById('cr-hourly')
  var dailyEl = document.getElementById('cr-daily')

  function update() {
    var r = contractorRate(
      parseFloat(salary.value) || 0,
      parseFloat(hours.value) || 1200,
      parseFloat(expense.value) || 15,
      parseFloat(tax.value) || 25
    )
    hourlyEl.textContent = formatMoney(r.hourly)
    dailyEl.textContent = formatMoney(r.daily)
  }
  ;[salary, hours, expense, tax].forEach(function (el) { el.addEventListener('input', update) })
  update()
})()
