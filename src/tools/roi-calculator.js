import { calcRoi, formatMoney, formatPct } from './business-calc-core.js'

;(function () {
  var initial = document.getElementById('roi-initial')
  var finalVal = document.getElementById('roi-final')
  var profitEl = document.getElementById('roi-profit')
  var roiEl = document.getElementById('roi-pct')

  function update() {
    var i = parseFloat(initial.value) || 0
    var f = parseFloat(finalVal.value) || 0
    var result = calcRoi(i, f)
    if (!result) {
      profitEl.textContent = roiEl.textContent = '—'
      return
    }
    profitEl.textContent = formatMoney(result.profit)
    roiEl.textContent = (result.roi >= 0 ? '+' : '') + formatPct(result.roi)
  }

  ;[initial, finalVal].forEach(function (el) { el.addEventListener('input', update) })
  update()
})()
