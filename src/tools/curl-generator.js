;(function () {
  var url = document.getElementById('curl-url')
  var method = document.getElementById('curl-method')
  var headers = document.getElementById('curl-headers')
  var body = document.getElementById('curl-body')
  var output = document.getElementById('curl-output')
  var copyBtn = document.getElementById('curl-copy')

  function build() {
    var parts = ['curl -X ' + method.value + " '" + (url.value || 'https://example.com') + "'"]
    var headerLines = (headers.value || '').split('\n').filter(function (l) { return l.trim() })
    headerLines.forEach(function (line) {
      var idx = line.indexOf(':')
      if (idx > 0) {
        parts.push("-H '" + line.trim().replace(/'/g, "'\\''") + "'")
      }
    })
    if (body.value.trim() && method.value !== 'GET') {
      parts.push("-d '" + body.value.trim().replace(/'/g, "'\\''") + "'")
    }
    output.textContent = parts.join(' \\\n  ')
  }

  ;[url, method, headers, body].forEach(function (el) {
    el.addEventListener('input', build)
    el.addEventListener('change', build)
  })

  copyBtn.addEventListener('click', function () {
    navigator.clipboard.writeText(output.textContent).then(function () {
      copyBtn.textContent = 'Copied!'
      setTimeout(function () { copyBtn.textContent = 'Copy' }, 2000)
    })
  })
  build()
})()
