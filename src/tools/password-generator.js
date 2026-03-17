import './hash-state.js'
import { getCharSets, generatePassword, calculateStrength } from './password-generator-core.js'
// Password Generator
;(function () {
  var lengthInput = document.getElementById('pwd-length')
  var lengthValue = document.getElementById('pwd-length-value')
  var optUpper = document.getElementById('pwd-upper')
  var optLower = document.getElementById('pwd-lower')
  var optDigits = document.getElementById('pwd-digits')
  var optSymbols = document.getElementById('pwd-symbols')
  var optAmbiguous = document.getElementById('pwd-ambiguous')
  var output = document.getElementById('pwd-output')
  var strengthBar = document.getElementById('pwd-strength-bar')
  var strengthLabel = document.getElementById('pwd-strength-label')
  var generateBtn = document.getElementById('pwd-generate')
  var copyBtn = document.getElementById('pwd-copy')

  function getOptions() {
    return {
      upper: optUpper.checked,
      lower: optLower.checked,
      digits: optDigits.checked,
      symbols: optSymbols.checked,
      excludeAmbiguous: optAmbiguous.checked,
    }
  }

  function generate() {
    var length = parseInt(lengthInput.value, 10)
    var opts = getOptions()
    var charSets = getCharSets(opts)

    if (!charSets) {
      output.value = ''
      setStrength('')
      return
    }

    var pwd = generatePassword(length, charSets)
    output.value = pwd
    setStrength(pwd)
    saveState()
  }

  function setStrength(pwd) {
    if (!pwd) {
      strengthBar.style.width = '0%'
      strengthBar.className = 'pwd-strength-fill'
      strengthLabel.textContent = ''
      return
    }
    var result = calculateStrength(pwd)
    var pct = (result.score / 4) * 100
    strengthBar.style.width = pct + '%'
    strengthBar.className = 'pwd-strength-fill pwd-strength-' + result.label.toLowerCase()
    strengthLabel.textContent = result.label
  }

  function saveState() {
    HashState.save({
      length: lengthInput.value,
      upper: optUpper.checked ? '1' : '0',
      lower: optLower.checked ? '1' : '0',
      digits: optDigits.checked ? '1' : '0',
      symbols: optSymbols.checked ? '1' : '0',
      ambiguous: optAmbiguous.checked ? '1' : '0',
    })
  }

  lengthInput.addEventListener('input', function () {
    lengthValue.textContent = lengthInput.value
    generate()
  })

  ;[optUpper, optLower, optDigits, optSymbols, optAmbiguous].forEach(function (el) {
    el.addEventListener('change', generate)
  })

  generateBtn.addEventListener('click', generate)

  copyBtn.addEventListener('click', function () {
    if (!output.value) return
    navigator.clipboard.writeText(output.value).then(function () {
      var orig = copyBtn.textContent
      copyBtn.textContent = 'Copied!'
      setTimeout(function () { copyBtn.textContent = orig }, 2000)
    })
  })

  // Restore state
  var saved = HashState.parse()
  if (saved.length) { lengthInput.value = saved.length; lengthValue.textContent = saved.length }
  if (saved.upper !== undefined) optUpper.checked = saved.upper === '1'
  if (saved.lower !== undefined) optLower.checked = saved.lower === '1'
  if (saved.digits !== undefined) optDigits.checked = saved.digits === '1'
  if (saved.symbols !== undefined) optSymbols.checked = saved.symbols === '1'
  if (saved.ambiguous !== undefined) optAmbiguous.checked = saved.ambiguous === '1'

  generate()
})()
