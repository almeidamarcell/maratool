import './hash-state.js'
import { calculateCacLtv } from './cac-ltv-calculator-core.js'
import { formatCurrency } from './campaign-roi-calculator-core.js'

;(function () {
  var spend = document.getElementById('cl-spend')
  var customers = document.getElementById('cl-customers')
  var revenue = document.getElementById('cl-revenue')
  var lifespan = document.getElementById('cl-lifespan')
  var margin = document.getElementById('cl-margin')
  var errorEl = document.getElementById('cl-error')
  var resultsEl = document.getElementById('cl-results')
  var statCac = document.getElementById('cl-cac')
  var statLtv = document.getElementById('cl-ltv')
  var statRatio = document.getElementById('cl-ratio')
  var statPayback = document.getElementById('cl-payback')

  function update() {
    var result = calculateCacLtv(spend.value, customers.value, revenue.value, lifespan.value, margin.value)
    if (result.error) {
      errorEl.textContent = result.error
      errorEl.style.display = 'block'
      resultsEl.style.display = 'none'
      return
    }
    errorEl.style.display = 'none'
    resultsEl.style.display = 'block'
    statCac.textContent = formatCurrency(result.cac)
    statLtv.textContent = formatCurrency(result.ltv)
    statRatio.textContent = result.ratio.toFixed(1) + '×'
    statPayback.textContent = result.paybackMonths === Infinity ? '—' : result.paybackMonths.toFixed(1) + ' mo'
    HashState.save({
      spend: spend.value,
      customers: customers.value,
      revenue: revenue.value,
      lifespan: lifespan.value,
      margin: margin.value,
    })
  }

  ;[spend, customers, revenue, lifespan, margin].forEach(function (el) {
    el.addEventListener('input', update)
  })

  var saved = HashState.parse()
  if (saved.spend) spend.value = saved.spend
  if (saved.customers) customers.value = saved.customers
  if (saved.revenue) revenue.value = saved.revenue
  if (saved.lifespan) lifespan.value = saved.lifespan
  if (saved.margin) margin.value = saved.margin
  update()
})()
