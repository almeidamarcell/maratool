import { copyWithFeedback } from './tool-utils.js'
import { formatSql } from './sql-format-core.js'

;(function () {
  var input = document.getElementById('sql-input')
  var output = document.getElementById('sql-output')
  var copyBtn = document.getElementById('sql-copy')

  function update() {
    output.textContent = formatSql(input.value)
  }

  input.addEventListener('input', update)

  copyBtn.addEventListener('click', function () {
    copyWithFeedback(copyBtn, output.textContent, { idle: 'Copy' })
  })
})()
