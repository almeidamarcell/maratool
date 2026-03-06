import './hash-state.js'
// JSON Formatter & Validator
(function () {
  var input = document.getElementById('json-input')
  var output = document.getElementById('json-output')
  var status = document.getElementById('json-status')
  var formatBtn = document.getElementById('json-format')
  var minifyBtn = document.getElementById('json-minify')
  var copyBtn = document.getElementById('json-copy')
  var inputCounter = document.getElementById('json-input-counter')
  var outputCounter = document.getElementById('json-output-counter')

  function countChars(text) {
    var len = text.length
    if (len >= 1000) {
      return (len / 1000).toFixed(1) + ' KB'
    }
    return len + ' characters'
  }

  function validate() {
    var raw = input.value.trim()
    inputCounter.textContent = countChars(input.value)

    if (!raw) {
      status.textContent = ''
      status.className = 'json-status'
      return null
    }

    try {
      var parsed = JSON.parse(raw)
      status.textContent = 'Valid JSON'
      status.className = 'json-status valid'
      return parsed
    } catch (e) {
      status.textContent = e.message
      status.className = 'json-status invalid'
      return null
    }
  }

  function format() {
    var parsed = validate()
    if (parsed !== null) {
      var formatted = JSON.stringify(parsed, null, 2)
      output.textContent = formatted
      output.classList.remove('error-state')
      outputCounter.textContent = countChars(formatted)
    } else if (input.value.trim()) {
      output.textContent = 'Cannot format — invalid JSON'
      output.classList.add('error-state')
      outputCounter.textContent = '0 characters'
    } else {
      output.textContent = ''
      output.classList.remove('error-state')
      outputCounter.textContent = '0 characters'
    }
  }

  function minify() {
    var parsed = validate()
    if (parsed !== null) {
      var minified = JSON.stringify(parsed)
      output.textContent = minified
      output.classList.remove('error-state')
      outputCounter.textContent = countChars(minified)
    } else if (input.value.trim()) {
      output.textContent = 'Cannot minify — invalid JSON'
      output.classList.add('error-state')
      outputCounter.textContent = '0 characters'
    } else {
      output.textContent = ''
      output.classList.remove('error-state')
      outputCounter.textContent = '0 characters'
    }
  }

  var saved = HashState.parse()
  if (saved.input) {
    input.value = saved.input
    validate()
  }

  input.addEventListener('input', function () {
    validate()
    HashState.save({ input: input.value })
  })
  formatBtn.addEventListener('click', format)
  minifyBtn.addEventListener('click', minify)

  copyBtn.addEventListener('click', function () {
    var text = output.textContent
    if (!text) return
    navigator.clipboard.writeText(text).then(function () {
      copyBtn.textContent = 'Copied!'
      copyBtn.classList.add('copied')
      setTimeout(function () {
        copyBtn.textContent = 'Copy'
        copyBtn.classList.remove('copied')
      }, 2000)
    })
  })
})()
