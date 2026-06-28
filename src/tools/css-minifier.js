import { minifyCss } from './css-minify-core.js'

;(function () {
  var input = document.getElementById('cssm-input')
  var output = document.getElementById('cssm-output')
  var copy = document.getElementById('cssm-copy')

  function update() { output.textContent = minifyCss(input.value) }
  input.addEventListener('input', update)
  copy.addEventListener('click', function () {
    navigator.clipboard.writeText(output.textContent).then(function () {
      copy.textContent = 'Copied!'
      setTimeout(function () { copy.textContent = 'Copy' }, 2000)
    })
  })
  update()
})()
