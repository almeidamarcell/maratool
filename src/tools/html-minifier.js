import { minifyHtml } from './html-format-core.js'

;(function () {
  var input = document.getElementById('hmin-input')
  var output = document.getElementById('hmin-output')
  var copy = document.getElementById('hmin-copy')

  function update() { output.textContent = minifyHtml(input.value) }
  input.addEventListener('input', update)
  copy.addEventListener('click', function () {
    navigator.clipboard.writeText(output.textContent).then(function () {
      copy.textContent = 'Copied!'
      setTimeout(function () { copy.textContent = 'Copy' }, 2000)
    })
  })
  update()
})()
