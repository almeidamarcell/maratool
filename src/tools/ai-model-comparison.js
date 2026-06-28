import { compareModels } from './ai-model-comparison-core.js'
import { formatUsd, MODEL_PRICING } from './ai-cost-calculator-core.js'

;(function () {
  var inputTok = document.getElementById('amc-in')
  var outputTok = document.getElementById('amc-out')
  var list = document.getElementById('amc-models')
  var table = document.getElementById('amc-table')

  Object.keys(MODEL_PRICING).forEach(function (id) {
    var label = document.createElement('label')
    label.style.cssText = 'display:inline-flex;align-items:center;gap:0.35rem;font-size:13px;'
    var cb = document.createElement('input')
    cb.type = 'checkbox'
    cb.value = id
    cb.checked = id === 'gpt-4o' || id === 'gpt-4o-mini' || id === 'claude-sonnet'
    cb.addEventListener('change', update)
    label.appendChild(cb)
    label.appendChild(document.createTextNode(MODEL_PRICING[id].name))
    list.appendChild(label)
  })

  function update() {
    var ids = Array.from(list.querySelectorAll('input:checked')).map(function (el) { return el.value })
    var rows = compareModels(Number(inputTok.value) || 0, Number(outputTok.value) || 0, ids)
    if (!rows.length) {
      table.innerHTML = ''
      return
    }
    table.innerHTML = '<table style="width:100%;border-collapse:collapse;font-size:13px;">' +
      '<thead><tr style="text-align:left;border-bottom:1px solid var(--border);">' +
      '<th style="padding:0.5rem 0;">Model</th><th>Input</th><th>Output</th><th>Total</th></tr></thead><tbody>' +
      rows.map(function (r) {
        return '<tr style="border-bottom:1px solid var(--border);">' +
          '<td style="padding:0.5rem 0;">' + r.model + '</td>' +
          '<td>' + formatUsd(r.inputCost) + '</td>' +
          '<td>' + formatUsd(r.outputCost) + '</td>' +
          '<td><strong>' + formatUsd(r.totalCost) + '</strong></td></tr>'
      }).join('') + '</tbody></table>'
  }

  ;[inputTok, outputTok].forEach(function (el) { el.addEventListener('input', update) })
  update()
})()
