import { calcAmazonFees, formatMoney, formatPct } from './ecommerce-fees-core.js'

;(function () {
  var price = document.getElementById('amz-price')
  var category = document.getElementById('amz-category')
  var fulfillment = document.getElementById('amz-fulfillment')
  var referralEl = document.getElementById('amz-referral')
  var fbaEl = document.getElementById('amz-fba')
  var totalEl = document.getElementById('amz-total')
  var netEl = document.getElementById('amz-net')
  var marginEl = document.getElementById('amz-margin')

  function update() {
    var p = parseFloat(price.value) || 0
    if (p <= 0) {
      referralEl.textContent = fbaEl.textContent = totalEl.textContent = netEl.textContent = marginEl.textContent = '—'
      return
    }
    var result = calcAmazonFees(p, category.value, fulfillment.value)
    referralEl.textContent = formatMoney(result.referralFee)
    fbaEl.textContent = formatMoney(result.fbaFee)
    totalEl.textContent = formatMoney(result.totalFees)
    netEl.textContent = formatMoney(result.netProfit)
    marginEl.textContent = formatPct(result.margin)
  }

  ;[price, category, fulfillment].forEach(function (el) { el.addEventListener('input', update); el.addEventListener('change', update) })
  update()
})()
