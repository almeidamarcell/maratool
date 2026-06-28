import { calcEtsyFees, formatMoney, formatPct } from './ecommerce-fees-core.js'

;(function () {
  var price = document.getElementById('etsy-price')
  var shipping = document.getElementById('etsy-shipping')
  var listingEl = document.getElementById('etsy-listing')
  var transactionEl = document.getElementById('etsy-transaction')
  var paymentEl = document.getElementById('etsy-payment')
  var totalEl = document.getElementById('etsy-total')
  var netEl = document.getElementById('etsy-net')
  var marginEl = document.getElementById('etsy-margin')

  function update() {
    var p = parseFloat(price.value) || 0
    var s = parseFloat(shipping.value) || 0
    if (p <= 0) {
      listingEl.textContent = transactionEl.textContent = paymentEl.textContent = totalEl.textContent = netEl.textContent = marginEl.textContent = '—'
      return
    }
    var result = calcEtsyFees(p, s)
    listingEl.textContent = formatMoney(result.listingFee)
    transactionEl.textContent = formatMoney(result.transactionFee)
    paymentEl.textContent = formatMoney(result.paymentProcessing)
    totalEl.textContent = formatMoney(result.totalFees)
    netEl.textContent = formatMoney(result.netProfit)
    marginEl.textContent = formatPct(result.margin)
  }

  ;[price, shipping].forEach(function (el) { el.addEventListener('input', update) })
  update()
})()
