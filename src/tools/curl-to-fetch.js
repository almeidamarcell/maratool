import { parseCurl, curlToFetch } from './curl-convert-core.js'

;(function () {
  var input = document.getElementById('ctf-input')
  var output = document.getElementById('ctf-output')
  var copy = document.getElementById('ctf-copy')

  function update() {
    var req = parseCurl(input.value)
    output.textContent = req ? curlToFetch(req) : '// Paste a valid cURL command'
  }
  input.addEventListener('input', update)
  copy.addEventListener('click', function () {
    navigator.clipboard.writeText(output.textContent).then(function () {
      copy.textContent = 'Copied!'
      setTimeout(function () { copy.textContent = 'Copy' }, 2000)
    })
  })
})()
