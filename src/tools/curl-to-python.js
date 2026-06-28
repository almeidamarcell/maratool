import { parseCurl, curlToPython } from './curl-convert-core.js'

;(function () {
  var input = document.getElementById('ctp-input')
  var output = document.getElementById('ctp-output')
  var copy = document.getElementById('ctp-copy')

  function update() {
    var req = parseCurl(input.value)
    output.textContent = req ? curlToPython(req) : '# Paste a valid cURL command'
  }
  input.addEventListener('input', update)
  copy.addEventListener('click', function () {
    navigator.clipboard.writeText(output.textContent).then(function () {
      copy.textContent = 'Copied!'
      setTimeout(function () { copy.textContent = 'Copy' }, 2000)
    })
  })
})()
