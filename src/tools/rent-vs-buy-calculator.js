import { rentVsBuy } from './wave5-debt-core.js'
import { formatMoney } from './finance-amortization-core.js'

;(function () {
  var ids = ['rb-price', 'rb-down', 'rb-rate', 'rb-term', 'rb-tax', 'rb-maint', 'rb-appr', 'rb-closing', 'rb-rent', 'rb-rent-growth', 'rb-invest', 'rb-years']
  var el = {}
  ids.forEach(function (id) { el[id] = document.getElementById(id) })
  var verdictEl = document.getElementById('rb-verdict')
  var buyCostEl = document.getElementById('rb-buy-cost')
  var rentCostEl = document.getElementById('rb-rent-cost')
  var paymentEl = document.getElementById('rb-payment')
  var equityEl = document.getElementById('rb-equity')
  var noteEl = document.getElementById('rb-note')

  function val(id, fallback) {
    var v = parseFloat(el[id].value)
    return isFinite(v) ? v : fallback
  }

  function update() {
    var r = rentVsBuy({
      homePrice: val('rb-price', NaN),
      downPct: val('rb-down', 20),
      mortgageRatePct: val('rb-rate', NaN),
      termYears: val('rb-term', 30),
      propertyTaxPct: val('rb-tax', 1.1),
      maintenancePct: val('rb-maint', 1),
      appreciationPct: val('rb-appr', 3),
      closingPct: val('rb-closing', 3),
      monthlyRent: val('rb-rent', NaN),
      rentIncreasePct: val('rb-rent-growth', 3),
      investmentReturnPct: val('rb-invest', 7),
      yearsToStay: val('rb-years', NaN),
    })
    if (!r) {
      verdictEl.textContent = '—'
      buyCostEl.textContent = '—'
      rentCostEl.textContent = '—'
      paymentEl.textContent = '—'
      equityEl.textContent = '—'
      noteEl.textContent = ''
      return
    }
    verdictEl.textContent = r.verdict === 'buy' ? 'Buying wins' : 'Renting wins'
    buyCostEl.textContent = formatMoney(r.netCostBuy)
    rentCostEl.textContent = formatMoney(r.netCostRent)
    paymentEl.textContent = formatMoney(r.monthlyPayment)
    equityEl.textContent = formatMoney(r.equity)
    noteEl.textContent = (r.verdict === 'buy' ? 'Buying' : 'Renting') + ' comes out ahead by ' + formatMoney(Math.abs(r.netAdvantage)) + ' over ' + val('rb-years', 0) + ' years. Net cost = everything paid out minus what you walk away with (home equity after 6% selling costs, or investment gains).'
  }

  ids.forEach(function (id) { el[id].addEventListener('input', update) })
  update()
})()
