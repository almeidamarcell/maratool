import { formatIso8601, parseIso8601 } from './date-tools-core.js'

;(function () {
  var input = document.getElementById('iso-input')
  var iso = document.getElementById('iso-out')
  var local = document.getElementById('iso-local')
  var unix = document.getElementById('iso-unix')
  var nowBtn = document.getElementById('iso-now')

  function update() {
    var r = input.value.trim() ? parseIso8601(input.value) : formatIso8601(new Date())
    if (r.error) { iso.textContent = local.textContent = unix.textContent = r.error; return }
    iso.textContent = r.iso
    local.textContent = r.local
    unix.textContent = r.unix
  }

  input.addEventListener('input', update)
  nowBtn.addEventListener('click', function () {
    input.value = new Date().toISOString()
    update()
  })
  update()
})()
