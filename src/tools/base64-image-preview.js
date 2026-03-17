import './hash-state.js'
// Base64 Image Previewer
;(function () {
  'use strict'

  var input = document.getElementById('bip-input')
  var errorEl = document.getElementById('bip-error')
  var resultEl = document.getElementById('bip-result')
  var preview = document.getElementById('bip-preview')
  var formatEl = document.getElementById('bip-format')
  var dimensionsEl = document.getElementById('bip-dimensions')
  var sizeEl = document.getElementById('bip-size')
  var copyBtn = document.getElementById('bip-copy')

  var currentDataUrl = ''

  function showError(msg) {
    errorEl.textContent = msg
    errorEl.style.display = ''
    resultEl.style.display = 'none'
    copyBtn.style.display = 'none'
  }

  function hideError() {
    errorEl.style.display = 'none'
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  function detectFormat(dataUrl) {
    var match = dataUrl.match(/^data:image\/([a-zA-Z0-9.+-]+)/)
    if (match) return match[1].toUpperCase()
    return 'Unknown'
  }

  function estimateSize(base64Str) {
    // Remove data URL prefix if present
    var raw = base64Str.replace(/^data:[^;]+;base64,/, '')
    // Remove whitespace
    raw = raw.replace(/\s/g, '')
    var padding = (raw.match(/=+$/) || [''])[0].length
    return Math.floor((raw.length * 3) / 4) - padding
  }

  function toDataUrl(value) {
    var trimmed = value.trim()
    if (!trimmed) return ''
    if (trimmed.startsWith('data:image/')) return trimmed
    // Try to wrap raw base64 as PNG, then fallback
    if (/^[A-Za-z0-9+/\s]+=*$/.test(trimmed.replace(/\s/g, ''))) {
      return 'data:image/png;base64,' + trimmed.replace(/\s/g, '')
    }
    return ''
  }

  function handleInput() {
    var value = input.value.trim()
    if (!value) {
      hideError()
      resultEl.style.display = 'none'
      copyBtn.style.display = 'none'
      currentDataUrl = ''
      return
    }

    var dataUrl = toDataUrl(value)
    if (!dataUrl) {
      showError('Invalid input. Paste a Base64 string or a data:image/... URL.')
      return
    }

    hideError()

    // Test if the image can actually load
    var testImg = new Image()
    testImg.onload = function () {
      currentDataUrl = dataUrl
      preview.src = dataUrl
      formatEl.textContent = detectFormat(dataUrl)
      dimensionsEl.textContent = testImg.naturalWidth + ' × ' + testImg.naturalHeight + ' px'
      sizeEl.textContent = '~' + formatBytes(estimateSize(value))
      resultEl.style.display = ''
      copyBtn.style.display = ''
    }
    testImg.onerror = function () {
      showError('Could not render image. Check that the Base64 data is valid.')
    }
    testImg.src = dataUrl
  }

  var debounceTimer
  input.addEventListener('input', function () {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(handleInput, 300)
  })

  copyBtn.addEventListener('click', function () {
    if (!currentDataUrl) return
    navigator.clipboard.writeText(currentDataUrl).then(function () {
      copyBtn.textContent = 'Copied!'
      copyBtn.classList.add('copied')
      setTimeout(function () {
        copyBtn.textContent = 'Copy data URL'
        copyBtn.classList.remove('copied')
      }, 2000)
    })
  })

  // Restore from hash
  var saved = HashState.parse()
  if (saved.input) {
    input.value = saved.input
    handleInput()
  }

  // Save to hash on change
  input.addEventListener('input', function () {
    HashState.save({ input: input.value })
  })
})()
