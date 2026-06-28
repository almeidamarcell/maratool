import './hash-state.js'
import { calculateAbTest, formatPercent } from './ab-test-calculator-core.js'

;(function () {
  var controlVisitors = document.getElementById('ab-control-visitors')
  var controlConversions = document.getElementById('ab-control-conversions')
  var variantVisitors = document.getElementById('ab-variant-visitors')
  var variantConversions = document.getElementById('ab-variant-conversions')
  var confidence = document.getElementById('ab-confidence')
  var errorEl = document.getElementById('ab-error')
  var resultsEl = document.getElementById('ab-results')
  var statControl = document.getElementById('ab-stat-control')
  var statVariant = document.getElementById('ab-stat-variant')
  var statLift = document.getElementById('ab-stat-lift')
  var statPvalue = document.getElementById('ab-stat-pvalue')
  var statSignificant = document.getElementById('ab-stat-significant')

  function update() {
    var result = calculateAbTest(
      controlVisitors.value,
      controlConversions.value,
      variantVisitors.value,
      variantConversions.value,
      Number(confidence.value)
    )

    if (result.error) {
      errorEl.textContent = result.error
      errorEl.style.display = 'block'
      resultsEl.style.display = 'none'
      return
    }

    errorEl.style.display = 'none'
    resultsEl.style.display = 'block'
    statControl.textContent = formatPercent(result.controlRate)
    statVariant.textContent = formatPercent(result.variantRate)
    statLift.textContent = (result.lift >= 0 ? '+' : '') + result.lift.toFixed(2) + '%'
    statPvalue.textContent = result.pValue < 0.001 ? '< 0.001' : result.pValue.toFixed(4)
    statSignificant.textContent = result.significant ? 'Yes ✓' : 'No'
    statSignificant.className = 'tool-stat-value ' + (result.significant ? 'ab-sig-yes' : 'ab-sig-no')

    HashState.save({
      cv: controlVisitors.value,
      cc: controlConversions.value,
      vv: variantVisitors.value,
      vc: variantConversions.value,
      conf: confidence.value,
    })
  }

  ;[controlVisitors, controlConversions, variantVisitors, variantConversions, confidence].forEach(function (el) {
    el.addEventListener('input', update)
    el.addEventListener('change', update)
  })

  var saved = HashState.parse()
  if (saved.cv) controlVisitors.value = saved.cv
  if (saved.cc) controlConversions.value = saved.cc
  if (saved.vv) variantVisitors.value = saved.vv
  if (saved.vc) variantConversions.value = saved.vc
  if (saved.conf) confidence.value = saved.conf
  update()
})()
