import { calcCagr, formatMoney } from './finance-compound-core.js'

;(function () {
  var begin = document.getElementById('cagr-begin')
  var end = document.getElementById('cagr-end')
  var years = document.getElementById('cagr-years')
  var resultEl = document.getElementById('cagr-result')
  var totalReturnEl = document.getElementById('cagr-total-return')

  function update() {
    var b = parseFloat(begin.value) || 0
    var e = parseFloat(end.value) || 0
    var y = parseFloat(years.value) || 0
    if (b <= 0 || e <= 0 || y <= 0) {
      resultEl.textContent = '—'
      totalReturnEl.textContent = '—'
      return
    }
    var cagr = calcCagr(b, e, y)
    resultEl.textContent = cagr.toFixed(2) + '%'
    totalReturnEl.textContent = (((e - b) / b) * 100).toFixed(2) + '%'
  }

  ;[begin, end, years].forEach(function (el) { el.addEventListener('input', update) })
  update()
})()
