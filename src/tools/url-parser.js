import { parseUrl } from './url-parser-core.js'

;(function () {
  var input = document.getElementById('up-input')
  var valid = document.getElementById('up-valid')
  var protocol = document.getElementById('up-protocol')
  var host = document.getElementById('up-host')
  var fields = document.getElementById('up-fields')
  var error = document.getElementById('up-error')

  function update() {
    var r = parseUrl(input.value)
    if (!r.valid) {
      valid.textContent = 'No'
      protocol.textContent = host.textContent = '—'
      fields.innerHTML = ''
      error.textContent = r.error || 'Invalid URL'
      return
    }
    error.textContent = ''
    valid.textContent = 'Yes'
    protocol.textContent = r.protocol
    host.textContent = r.hostname
    var rows = ['port', 'pathname', 'search', 'hash', 'origin', 'username']
    fields.innerHTML = rows.map(function (k) {
      return '<dt>' + k + '</dt><dd style="margin:0;word-break:break-all;">' + (r[k] || '—') + '</dd>'
    }).join('')
  }

  input.addEventListener('input', update)
  update()
})()
