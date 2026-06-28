import { cleanCsv } from './csv-tools-core.js'

;(function () {
  var input = document.getElementById('cc-input')
  var output = document.getElementById('cc-output')
  var copy = document.getElementById('cc-copy')

  function update() {
    try { output.value = cleanCsv(input.value) } catch (e) { output.value = 'Error: ' + e.message }
  }
  input.addEventListener('input', update)
  copy.addEventListener('click', function () {
    navigator.clipboard.writeText(output.value).then(function () {
      copy.textContent = 'Copied!'
      setTimeout(function () { copy.textContent = 'Copy' }, 2000)
    })
  })
})()
