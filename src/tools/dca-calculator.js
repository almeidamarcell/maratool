import { dcaSchedule, formatMoney } from './finance-stock-core.js'

;(function () {
  var monthly = document.getElementById('dca-monthly')
  var months = document.getElementById('dca-months')
  var price = document.getElementById('dca-price')
  var avgEl = document.getElementById('dca-avg')
  var investedEl = document.getElementById('dca-invested')
  var sharesEl = document.getElementById('dca-shares')

  function update() {
    var r = dcaSchedule({
      monthlyAmount: parseFloat(monthly.value) || 0,
      months: parseInt(months.value, 10) || 0,
      prices: [parseFloat(price.value) || 0],
    })
    avgEl.textContent = formatMoney(r.avgCost)
    investedEl.textContent = formatMoney(r.totalInvested)
    sharesEl.textContent = r.totalShares.toFixed(4)
  }
  ;[monthly, months, price].forEach(function (el) { el.addEventListener('input', update) })
  update()
})()
