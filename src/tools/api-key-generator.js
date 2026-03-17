import './hash-state.js'
import { generateApiKey, validateApiKeyOptions } from './api-key-generator-core.js'
// API Key Generator
;(function () {
  var formatInputs = document.querySelectorAll('input[name="akg-format"]')
  var lengthInput = document.getElementById('akg-length')
  var lengthVal = document.getElementById('akg-length-val')
  var countInput = document.getElementById('akg-count')
  var generateBtn = document.getElementById('akg-generate')
  var output = document.getElementById('akg-output')
  var copyBtn = document.getElementById('akg-copy')

  function getFormat() {
    for (var i = 0; i < formatInputs.length; i++) {
      if (formatInputs[i].checked) return formatInputs[i].value
    }
    return 'hex'
  }

  function generate() {
    var format = getFormat()
    var length = parseInt(lengthInput.value, 10) || 32
    var count = Math.min(parseInt(countInput.value, 10) || 1, 20)

    var validation = validateApiKeyOptions({ format: format, length: length })
    if (!validation.valid) { output.value = '# ' + validation.error; return }

    var keys = []
    for (var i = 0; i < count; i++) {
      keys.push(generateApiKey({ format: format, length: length }))
    }
    output.value = keys.join('\n')
    HashState.save({ format: format, length: length, count: count })
  }

  if (lengthInput) {
    lengthInput.addEventListener('input', function () {
      if (lengthVal) lengthVal.textContent = lengthInput.value
      generate()
    })
  }
  if (countInput) countInput.addEventListener('input', generate)
  formatInputs.forEach(function (el) { el.addEventListener('change', generate) })
  if (generateBtn) generateBtn.addEventListener('click', generate)

  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      if (!output.value) return
      navigator.clipboard.writeText(output.value).then(function () {
        var orig = copyBtn.textContent
        copyBtn.textContent = 'Copied!'
        setTimeout(function () { copyBtn.textContent = orig }, 2000)
      })
    })
  }

  var s = HashState.parse()
  if (s.format) {
    formatInputs.forEach(function (el) { el.checked = el.value === s.format })
  }
  if (s.length && lengthInput) {
    lengthInput.value = s.length
    if (lengthVal) lengthVal.textContent = s.length
  }
  if (s.count && countInput) countInput.value = s.count

  generate()
})()
