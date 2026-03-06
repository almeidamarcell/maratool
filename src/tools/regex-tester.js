import './hash-state.js'
// Regex Tester — live match highlighting
(function () {
  var patternInput = document.getElementById('regex-pattern')
  var testString = document.getElementById('regex-test-string')
  var errorEl = document.getElementById('regex-error')
  var statsEl = document.getElementById('regex-stats')
  var highlightEl = document.getElementById('regex-highlight')
  var matchListEl = document.getElementById('regex-match-list')
  var flagG = document.getElementById('flag-g')
  var flagI = document.getElementById('flag-i')
  var flagM = document.getElementById('flag-m')
  var debounceTimer = null

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  }

  function run() {
    var pattern = patternInput.value
    var text = testString.value
    errorEl.textContent = ''

    if (!pattern || !text) {
      highlightEl.innerHTML = escapeHtml(text || '')
      statsEl.textContent = '0 matches'
      matchListEl.innerHTML = ''
      return
    }

    // Build flags
    var flags = ''
    if (flagG.checked) flags += 'g'
    if (flagI.checked) flags += 'i'
    if (flagM.checked) flags += 'm'

    var regex
    try {
      regex = new RegExp(pattern, flags)
    } catch (e) {
      errorEl.textContent = 'Invalid regex: ' + e.message
      highlightEl.innerHTML = escapeHtml(text)
      statsEl.textContent = '0 matches'
      matchListEl.innerHTML = ''
      return
    }

    // Collect all matches
    var matches = []
    if (flags.indexOf('g') !== -1) {
      var m
      while ((m = regex.exec(text)) !== null) {
        matches.push({ value: m[0], index: m.index })
        // Prevent infinite loop on zero-length matches
        if (m[0].length === 0) {
          regex.lastIndex++
          if (regex.lastIndex > text.length) break
        }
      }
    } else {
      var m = regex.exec(text)
      if (m) {
        matches.push({ value: m[0], index: m.index })
      }
    }

    statsEl.textContent = matches.length + ' match' + (matches.length !== 1 ? 'es' : '')

    // Build highlighted HTML
    if (matches.length === 0) {
      highlightEl.innerHTML = escapeHtml(text)
    } else {
      var parts = []
      var lastEnd = 0
      for (var i = 0; i < matches.length; i++) {
        var idx = matches[i].index
        var val = matches[i].value
        if (idx > lastEnd) {
          parts.push(escapeHtml(text.slice(lastEnd, idx)))
        }
        parts.push('<mark>' + escapeHtml(val) + '</mark>')
        lastEnd = idx + val.length
      }
      if (lastEnd < text.length) {
        parts.push(escapeHtml(text.slice(lastEnd)))
      }
      highlightEl.innerHTML = parts.join('')
    }

    // Build match list
    if (matches.length === 0) {
      matchListEl.innerHTML = '<span style="color:var(--text-3)">No matches</span>'
    } else {
      var listHtml = []
      for (var i = 0; i < matches.length; i++) {
        listHtml.push(
          '<div>' +
          '<span style="color:var(--text-3)">' + (i + 1) + '.</span> ' +
          '"<strong>' + escapeHtml(matches[i].value) + '</strong>"' +
          ' <span style="color:var(--text-3)">at index ' + matches[i].index + '</span>' +
          '</div>'
        )
      }
      matchListEl.innerHTML = listHtml.join('')
    }
  }

  function saveState() {
    HashState.save({
      pattern: patternInput.value,
      test: testString.value,
      g: flagG.checked ? '1' : '0',
      i: flagI.checked ? '1' : '0',
      m: flagM.checked ? '1' : '0'
    })
  }

  function debouncedRun() {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(function () {
      run()
      saveState()
    }, 100)
  }

  patternInput.addEventListener('input', debouncedRun)
  testString.addEventListener('input', debouncedRun)
  flagG.addEventListener('change', function () { run(); saveState() })
  flagI.addEventListener('change', function () { run(); saveState() })
  flagM.addEventListener('change', function () { run(); saveState() })

  // Restore from hash state
  var _hs = HashState.parse()
  if (_hs.pattern !== undefined) patternInput.value = _hs.pattern
  if (_hs.test !== undefined) testString.value = _hs.test
  if (_hs.g !== undefined) flagG.checked = _hs.g === '1'
  if (_hs.i !== undefined) flagI.checked = _hs.i === '1'
  if (_hs.m !== undefined) flagM.checked = _hs.m === '1'
  if (_hs.pattern !== undefined || _hs.test !== undefined) run()
})()
