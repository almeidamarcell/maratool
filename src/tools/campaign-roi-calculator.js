import './hash-state.js'
import { calculateRoi, formatCurrency } from './campaign-roi-calculator-core.js'

;(function () {
  var revenue = document.getElementById('roi-revenue')
  var cost = document.getElementById('roi-cost')
  var errorEl = document.getElementById('roi-error')
  var resultsEl = document.getElementById('roi-results')
  var statProfit = document.getElementById('roi-profit')
  var statRoi = document.getElementById('roi-roi')
  var statRoas = document.getElementById('roi-roas')

  function update() {
    var result = calculateRoi(revenue.value, cost.value)
    if (result.error) {
      errorEl.textContent = result.error
      errorEl.style.display = 'block'
      resultsEl.style.display = 'none'
      return
    }
    errorEl.style.display = 'none'
    resultsEl.style.display = 'block'
    statProfit.textContent = formatCurrency(result.profit)
    statRoi.textContent = (result.roi >= 0 ? '+' : '') + result.roi.toFixed(1) + '%'
    statRoas.textContent = result.roas.toFixed(2) + '×'
    HashState.save({ revenue: revenue.value, cost: cost.value })
  }

  ;[revenue, cost].forEach(function (el) {
    el.addEventListener('input', update)
  })

  var saved = HashState.parse()
  if (saved.revenue) revenue.value = saved.revenue
  if (saved.cost) cost.value = saved.cost
  update()
})()
