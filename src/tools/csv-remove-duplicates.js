import { attachCopyButton } from './tool-utils.js'
import { dedupCsv } from './csv-tools-core.js'

;(function () {
  var input = document.getElementById('cd-input')
  var col = document.getElementById('cd-column')
  var output = document.getElementById('cd-output')
  var copy = document.getElementById('cd-copy')

  function update() {
    var colIdx = col.value === 'all' ? 'all' : parseInt(col.value, 10)
    try { output.value = dedupCsv(input.value, colIdx) } catch (e) { output.value = 'Error: ' + e.message }
  }
  ;[input, col].forEach(function (el) { el.addEventListener('input', update); el.addEventListener('change', update) })
  attachCopyButton(copy, function () { return output.value }, { idle: 'Copy' })
})()
