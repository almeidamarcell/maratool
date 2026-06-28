import { validateIban } from './iban-validator-core.js'

;(function () {
  var input = document.getElementById('ib-input')
  var valid = document.getElementById('ib-valid')
  var country = document.getElementById('ib-country')
  var msg = document.getElementById('ib-msg')

  function update() {
    var r = validateIban(input.value)
    valid.textContent = r.valid ? 'Yes' : 'No'
    country.textContent = r.country || '—'
    msg.textContent = r.message
  }

  input.addEventListener('input', update)
  update()
})()
