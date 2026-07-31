import { attachCopyButton } from './tool-utils.js'
import { minifyCss } from './css-minify-core.js'

;(function () {
  var input = document.getElementById('cssm-input')
  var output = document.getElementById('cssm-output')
  var copy = document.getElementById('cssm-copy')

  function update() { output.textContent = minifyCss(input.value) }
  input.addEventListener('input', update)
  attachCopyButton(copy, function () { return output.textContent }, { idle: 'Copy' })
  update()
})()
