import './hash-state.js'
import { convertXmlToJson } from './xml-to-json-core.js'
// XML to JSON Converter
;(function () {
  var xmlInput = document.getElementById('xtj-xml-input')
  var jsonOutput = document.getElementById('xtj-json-output')
  var errorEl = document.getElementById('xtj-error')
  var copyBtn = document.getElementById('xtj-copy')

  function setError(msg) {
    if (errorEl) { errorEl.textContent = msg; errorEl.style.display = msg ? '' : 'none' }
  }

  function convert() {
    var result = convertXmlToJson(xmlInput.value, window.DOMParser)
    if (result.error) {
      jsonOutput.value = ''
      setError(result.error)
    } else {
      jsonOutput.value = result.result
      setError('')
    }
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      if (!jsonOutput.value) return
      navigator.clipboard.writeText(jsonOutput.value).then(function () {
        var orig = copyBtn.textContent
        copyBtn.textContent = 'Copied!'
        setTimeout(function () { copyBtn.textContent = orig }, 2000)
      })
    })
  }

  if (xmlInput) xmlInput.addEventListener('input', convert)
})()
