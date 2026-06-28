import { beautifyHtml } from './html-format-core.js'

;(function () {
  var input = document.getElementById('hbea-input')
  var output = document.getElementById('hbea-output')
  var copy = document.getElementById('hbea-copy')

  function update() { output.textContent = beautifyHtml(input.value) }
  input.addEventListener('input', update)
  copy.addEventListener('click', function () {
    navigator.clipboard.writeText(output.textContent).then(function () {
      copy.textContent = 'Copied!'
      setTimeout(function () { copy.textContent = 'Copy' }, 2000)
    })
  })
  update()
})()
