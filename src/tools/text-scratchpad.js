(function () {
  var textarea = document.getElementById('ts-textarea')
  var wordsEl = document.getElementById('ts-words')
  var charsEl = document.getElementById('ts-chars')
  var linesEl = document.getElementById('ts-lines')
  var copyBtn = document.getElementById('ts-copy')
  var frToggle = document.getElementById('ts-fr-toggle')
  var frPanel = document.getElementById('ts-fr-panel')
  var findInput = document.getElementById('ts-find')
  var replaceInput = document.getElementById('ts-replace')
  var regexCheckbox = document.getElementById('ts-regex')
  var replaceBtn = document.getElementById('ts-replace-btn')
  var frStatus = document.getElementById('ts-fr-status')

  function updateStats() {
    var text = textarea.value
    var chars = text.length
    var words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length
    var lines = text === '' ? 0 : text.split('\n').length
    wordsEl.textContent = words + (words === 1 ? ' word' : ' words')
    charsEl.textContent = chars + (chars === 1 ? ' character' : ' characters')
    linesEl.textContent = lines + (lines === 1 ? ' line' : ' lines')
  }

  function toTitleCase(str) {
    return str.replace(/\w\S*/g, function (txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    })
  }

  function toSentenceCase(str) {
    return str.replace(/(^\s*|[.!?]\s+)([a-z])/g, function (match, sep, char) {
      return sep + char.toUpperCase()
    }).replace(/^[a-z]/, function (c) { return c.toUpperCase() })
  }

  function toCamelCase(str) {
    return str
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+(.)/g, function (match, char) {
        return char.toUpperCase()
      })
      .replace(/^[A-Z]/, function (c) { return c.toLowerCase() })
  }

  function toSlugCase(str) {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  function applyTransform(action) {
    var text = textarea.value
    switch (action) {
      case 'uppercase':
        textarea.value = text.toUpperCase()
        break
      case 'lowercase':
        textarea.value = text.toLowerCase()
        break
      case 'titlecase':
        textarea.value = toTitleCase(text)
        break
      case 'sentencecase':
        textarea.value = toSentenceCase(text)
        break
      case 'camelcase':
        textarea.value = toCamelCase(text)
        break
      case 'slugcase':
        textarea.value = toSlugCase(text)
        break
      case 'sort-asc':
        textarea.value = text.split('\n').sort(function (a, b) {
          return a.toLowerCase().localeCompare(b.toLowerCase())
        }).join('\n')
        break
      case 'sort-desc':
        textarea.value = text.split('\n').sort(function (a, b) {
          return b.toLowerCase().localeCompare(a.toLowerCase())
        }).join('\n')
        break
      case 'dedup':
        var seen = {}
        var result = []
        var lines = text.split('\n')
        for (var i = 0; i < lines.length; i++) {
          var line = lines[i]
          if (!seen[line]) {
            seen[line] = true
            result.push(line)
          }
        }
        textarea.value = result.join('\n')
        break
      case 'trim':
        textarea.value = text.split('\n').map(function (line) {
          return line.trim()
        }).join('\n')
        break
    }
    updateStats()
  }

  // Toolbar buttons
  document.querySelectorAll('.ts-btn[data-action]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var action = btn.getAttribute('data-action')
      if (action) applyTransform(action)
    })
  })

  // Find & Replace toggle
  frToggle.addEventListener('click', function () {
    var visible = frPanel.style.display !== 'none'
    frPanel.style.display = visible ? 'none' : 'block'
  })

  // Replace All
  replaceBtn.addEventListener('click', function () {
    var findVal = findInput.value
    if (!findVal) {
      frStatus.textContent = 'Enter a search term.'
      return
    }

    var text = textarea.value
    var useRegex = regexCheckbox.checked
    var count = 0

    if (useRegex) {
      try {
        var re = new RegExp(findVal, 'g')
        var matches = text.match(re)
        count = matches ? matches.length : 0
        textarea.value = text.replace(re, replaceInput.value)
      } catch (e) {
        frStatus.textContent = 'Invalid regex: ' + e.message
        return
      }
    } else {
      // Plain text replace all
      var idx = 0
      while (true) {
        var pos = text.indexOf(findVal, idx)
        if (pos === -1) break
        count++
        idx = pos + findVal.length
      }
      textarea.value = text.split(findVal).join(replaceInput.value)
    }

    frStatus.textContent = count + ' replacement' + (count === 1 ? '' : 's') + ' made.'
    updateStats()
  })

  // Copy button
  copyBtn.addEventListener('click', function () {
    var text = textarea.value
    if (!text) return
    navigator.clipboard.writeText(text).then(function () {
      var orig = copyBtn.textContent
      copyBtn.textContent = 'Copied!'
      copyBtn.classList.add('copied')
      setTimeout(function () {
        copyBtn.textContent = orig
        copyBtn.classList.remove('copied')
      }, 2000)
    })
  })

  // Stats update
  textarea.addEventListener('input', updateStats)
  updateStats()
})()
