import { attachCopyButton, setVisible } from './tool-utils.js'

// URL Encode / Decode — bidirectional percent-encoding.
//
// The mode toggle picks a *function pair*, not just a direction:
//   component → encodeURIComponent / decodeURIComponent
//   uri       → encodeURI / decodeURI
// Keeping the pair symmetric is what makes the two panes round-trip. Mixing
// encodeURI with decodeURIComponent looks fine until someone pastes a literal
// "%26" into a whole URL and it silently turns into "&".
;(function () {
  var plain = document.getElementById('ued-plain')
  var encoded = document.getElementById('ued-encoded')
  var modeInputs = Array.prototype.slice.call(document.querySelectorAll('input[name="ued-mode"]'))
  var errorEl = document.getElementById('ued-error')
  var copyPlain = document.getElementById('ued-copy-plain')
  var copyEncoded = document.getElementById('ued-copy-encoded')
  var swapBtn = document.getElementById('ued-swap')
  var clearBtn = document.getElementById('ued-clear')
  var statChars = document.getElementById('ued-stat-chars')
  var statBytes = document.getElementById('ued-stat-bytes')
  var statGrowth = document.getElementById('ued-stat-growth')

  if (!plain || !encoded) return

  // `updating` breaks the feedback loop: writing to one textarea does not fire
  // `input`, but a later programmatic sync could still re-enter through the
  // mode-change handler.
  var updating = false
  var lastEdited = 'plain'

  function mode() {
    for (var i = 0; i < modeInputs.length; i++) {
      if (modeInputs[i].checked) return modeInputs[i].value
    }
    return 'component'
  }

  function encodeFn(value) {
    return mode() === 'uri' ? encodeURI(value) : encodeURIComponent(value)
  }

  function decodeFn(value) {
    return mode() === 'uri' ? decodeURI(value) : decodeURIComponent(value)
  }

  function showError(message) {
    if (!errorEl) return
    errorEl.textContent = message
    setVisible(errorEl, true)
  }

  function clearError() {
    if (errorEl) setVisible(errorEl, false)
    plain.classList.remove('error-state')
    encoded.classList.remove('error-state')
  }

  function byteLength(value) {
    if (!value) return 0
    if (typeof TextEncoder === 'function') return new TextEncoder().encode(value).length
    return unescape(encodeURIComponent(value)).length
  }

  function updateStats() {
    if (!statChars) return
    var source = plain.value
    var out = encoded.value
    statChars.textContent = String(source.length)
    statBytes.textContent = String(byteLength(source))
    if (!source.length || !out.length) {
      statGrowth.textContent = '—'
      return
    }
    var growth = Math.round(((out.length - source.length) / source.length) * 100)
    statGrowth.textContent = (growth >= 0 ? '+' : '') + growth + '%'
  }

  function runEncode() {
    if (updating) return
    updating = true
    try {
      encoded.value = encodeFn(plain.value)
      clearError()
    } catch (e) {
      // encodeURIComponent throws URIError on a lone surrogate, e.g. a pasted
      // half of an emoji pair.
      encoded.value = ''
      plain.classList.add('error-state')
      showError('That text contains an unpaired surrogate character and cannot be percent-encoded. Remove the broken character and try again.')
    }
    updating = false
    updateStats()
  }

  function runDecode() {
    if (updating) return
    updating = true
    try {
      plain.value = decodeFn(encoded.value)
      clearError()
    } catch (e) {
      // decodeURIComponent('%E0%A4%A') throws URIError: URI malformed.
      encoded.classList.add('error-state')
      showError('Malformed percent-encoding. A % must be followed by two hex digits (%20, %E2%9C%93), and multi-byte sequences must be complete.')
    }
    updating = false
    updateStats()
  }

  plain.addEventListener('input', function () {
    lastEdited = 'plain'
    clearError()
    runEncode()
  })

  encoded.addEventListener('input', function () {
    lastEdited = 'encoded'
    clearError()
    runDecode()
  })

  modeInputs.forEach(function (input) {
    input.addEventListener('change', function () {
      clearError()
      if (lastEdited === 'encoded') runDecode()
      else runEncode()
    })
  })

  if (swapBtn) {
    swapBtn.addEventListener('click', function () {
      var carry = encoded.value
      updating = true
      encoded.value = ''
      plain.value = carry
      updating = false
      lastEdited = 'plain'
      clearError()
      runEncode()
      plain.focus()
    })
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      updating = true
      plain.value = ''
      encoded.value = ''
      updating = false
      lastEdited = 'plain'
      clearError()
      updateStats()
      plain.focus()
    })
  }

  if (copyPlain) attachCopyButton(copyPlain, function () { return plain.value }, { idle: 'Copy decoded' })
  if (copyEncoded) attachCopyButton(copyEncoded, function () { return encoded.value }, { idle: 'Copy encoded' })

  // Seed with a sample so the page is never a pair of empty boxes.
  if (!plain.value && !encoded.value) {
    plain.value = 'https://maratool.com/search?q=café & croissant'
    runEncode()
  } else {
    updateStats()
  }
})()
