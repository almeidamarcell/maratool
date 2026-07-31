import { attachCopyButton } from './tool-utils.js'
import { cleanCsv } from './csv-tools-core.js'

;(function () {
  var input = document.getElementById('cc-input')
  var output = document.getElementById('cc-output')
  var copy = document.getElementById('cc-copy')

  function update() {
    try { output.value = cleanCsv(input.value) } catch (e) { output.value = 'Error: ' + e.message }
  }
  input.addEventListener('input', update)
  attachCopyButton(copy, function () { return output.value }, { idle: 'Copy' })
})()
