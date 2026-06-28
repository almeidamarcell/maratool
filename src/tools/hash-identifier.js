import { identifyHash } from './hash-identifier-core.js'

;(function () {
  var input = document.getElementById('hi-input')
  var type = document.getElementById('hi-type')
  var msg = document.getElementById('hi-msg')

  function update() {
    var r = identifyHash(input.value)
    type.textContent = r.type
    msg.textContent = r.message
  }

  input.addEventListener('input', update)
  update()
})()
