import { toPostmanCollection } from './curl-convert-core.js'

;(function () {
  var url = document.getElementById('pm-url')
  var method = document.getElementById('pm-method')
  var headers = document.getElementById('pm-headers')
  var body = document.getElementById('pm-body')
  var name = document.getElementById('pm-name')
  var output = document.getElementById('pm-output')
  var copy = document.getElementById('pm-copy')

  function build() {
    var req = {
      method: method.value,
      url: url.value || 'https://example.com',
      headers: {},
      body: '',
    }
    if (headers.value) {
      headers.value.split('\n').forEach(function (line) {
        var idx = line.indexOf(':')
        if (idx > 0) req.headers[line.slice(0, idx).trim()] = line.slice(idx + 1).trim()
      })
    }
    if (body.value.trim()) req.body = body.value.trim()
    output.textContent = JSON.stringify(toPostmanCollection(req, name.value || 'My Collection'), null, 2)
  }

  ;[url, method, headers, body, name].forEach(function (el) { el.addEventListener('input', build) })
  copy.addEventListener('click', function () {
    navigator.clipboard.writeText(output.textContent).then(function () {
      copy.textContent = 'Copied!'
      setTimeout(function () { copy.textContent = 'Copy' }, 2000)
    })
  })
  build()
})()
