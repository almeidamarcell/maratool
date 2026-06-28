import { luhnCheck } from './luhn-checker-core.js'

;(function () {
  var input = document.getElementById('lu-input')
  var valid = document.getElementById('lu-valid')
  var msg = document.getElementById('lu-msg')

  function update() {
    var r = luhnCheck(input.value)
    valid.textContent = r.valid ? 'Pass' : 'Fail'
    msg.textContent = r.message
  }

  input.addEventListener('input', update)
  update()
})()
