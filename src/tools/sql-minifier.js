import { copyWithFeedback } from './tool-utils.js'
import { minifySql } from './sql-minify-core.js'

;(function () {
  var input = document.getElementById('sm-input')
  var output = document.getElementById('sm-output')
  var copy = document.getElementById('sm-copy')

  function update() { output.textContent = minifySql(input.value) }
  input.addEventListener('input', update)
  copy.addEventListener('click', function () {
    copyWithFeedback(copy, output.textContent, { idle: 'Copy' })
  })
  update()
})()
