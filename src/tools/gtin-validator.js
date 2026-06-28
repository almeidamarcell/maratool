import { validateGtin } from './gtin-validator-core.js'

;(function () {
  var input = document.getElementById('gtin-input')
  var valid = document.getElementById('gtin-valid')
  var type = document.getElementById('gtin-type')
  var msg = document.getElementById('gtin-msg')

  function update() {
    if (!input.value.trim()) {
      valid.textContent = '—'
      type.textContent = msg.textContent = '—'
      return
    }
    var r = validateGtin(input.value)
    valid.textContent = r.valid ? '✓ Valid' : '✗ Invalid'
    valid.style.color = r.valid ? '#276749' : '#c53030'
    type.textContent = r.type || '—'
    msg.textContent = r.error || 'Check digit matches'
  }
  input.addEventListener('input', update)
})()
