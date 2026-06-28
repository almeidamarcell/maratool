import { profitMargin, formatMoney, formatPct } from './business-calc-core.js'

;(function () {
  var revenue = document.getElementById('pm-revenue')
  var cogs = document.getElementById('pm-cogs')
  var expenses = document.getElementById('pm-expenses')
  var grossProfit = document.getElementById('pm-gross-profit')
  var netProfit = document.getElementById('pm-net-profit')
  var grossMargin = document.getElementById('pm-gross-margin')
  var netMargin = document.getElementById('pm-net-margin')

  function update() {
    var r = parseFloat(revenue.value) || 0
    var c = parseFloat(cogs.value) || 0
    var e = parseFloat(expenses.value) || 0
    if (r <= 0) {
      grossProfit.textContent = netProfit.textContent = grossMargin.textContent = netMargin.textContent = '—'
      return
    }
    var result = profitMargin(r, c, e)
    grossProfit.textContent = formatMoney(result.grossProfit)
    netProfit.textContent = formatMoney(result.netProfit)
    grossMargin.textContent = formatPct(result.grossMargin)
    netMargin.textContent = formatPct(result.netMargin)
  }

  ;[revenue, cogs, expenses].forEach(function (el) { el.addEventListener('input', update) })
  update()
})()
