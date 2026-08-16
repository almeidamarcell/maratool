import { copyWithFeedback } from './tool-utils.js'
;(function () {
  var input = document.getElementById('cvc-input')
  var output = document.getElementById('cvc-output')
  var copyBtn = document.getElementById('cvc-copy')
  var clearBtn = document.getElementById('cvc-clear')
  var modeBtns = Array.prototype.slice.call(document.querySelectorAll('.cvc-mode'))
  var charsEl = document.getElementById('cvc-chars')
  var wordsEl = document.getElementById('cvc-words')
  var linesEl = document.getElementById('cvc-lines')
  if (!input || !output) return

  var mode = 'upper'

  // Words that stay lowercase inside a title, unless they are the first or the
  // last word. Naively capitalising every word gives "The Lord Of The Rings"
  // instead of "The Lord of the Rings".
  var SMALL_WORDS = ['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'from', 'by', 'of', 'in']

  function isSmallWord(token) {
    var bare = token.toLowerCase().replace(/^[^a-z0-9]+/, '').replace(/[^a-z0-9]+$/, '')
    return SMALL_WORDS.indexOf(bare) !== -1
  }

  // Uppercases the first letter or digit, so quotes and brackets around the
  // word do not swallow the capital: "hello" -> "Hello".
  function capitalizeFirstLetter(token) {
    return token.replace(/[a-zA-Z]/, function (c) { return c.toUpperCase() })
  }

  function titleCaseLine(line) {
    var tokens = line.split(/(\s+)/)
    var wordPositions = []
    for (var i = 0; i < tokens.length; i++) {
      if (/\S/.test(tokens[i])) wordPositions.push(i)
    }
    if (!wordPositions.length) return line
    var first = wordPositions[0]
    var last = wordPositions[wordPositions.length - 1]
    return tokens.map(function (token, idx) {
      if (!/\S/.test(token)) return token
      var lower = token.toLowerCase()
      if (idx === first || idx === last) return capitalizeFirstLetter(lower)
      if (isSmallWord(token)) return lower
      return capitalizeFirstLetter(lower)
    }).join('')
  }

  function sentenceCase(text) {
    return text.toLowerCase().replace(
      /(^|[.!?]["'\)\]]?\s+|\n)(\s*)([a-z])/g,
      function (_m, before, space, ch) { return before + space + ch.toUpperCase() }
    )
  }

  // Splits an arbitrary string into the words a programmer-case would use.
  // Handles existing camelCase and ALLCAPS runs so "parseHTMLValue" becomes
  // ["parse", "HTML", "Value"] rather than one blob.
  function splitWords(str) {
    return str
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
      .split(/[^A-Za-z0-9]+/)
      .filter(Boolean)
  }

  function camelCaseLine(line) {
    var w = splitWords(line)
    if (!w.length) return ''
    return w.map(function (word, i) {
      var lower = word.toLowerCase()
      return i === 0 ? lower : lower.charAt(0).toUpperCase() + lower.slice(1)
    }).join('')
  }

  function pascalCaseLine(line) {
    var w = splitWords(line)
    return w.map(function (word) {
      var lower = word.toLowerCase()
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    }).join('')
  }

  function joinWords(line, sep, upper) {
    var w = splitWords(line)
    return w.map(function (word) {
      return upper ? word.toUpperCase() : word.toLowerCase()
    }).join(sep)
  }

  function alternating(text) {
    var upper = false
    var out = ''
    for (var i = 0; i < text.length; i++) {
      var ch = text[i]
      if (/[a-zA-Z]/.test(ch)) {
        out += upper ? ch.toUpperCase() : ch.toLowerCase()
        upper = !upper
      } else {
        out += ch
      }
    }
    return out
  }

  function perLine(text, fn) {
    return text.split('\n').map(fn).join('\n')
  }

  function transform(text, which) {
    switch (which) {
      case 'upper': return text.toUpperCase()
      case 'lower': return text.toLowerCase()
      case 'title': return perLine(text, titleCaseLine)
      case 'sentence': return sentenceCase(text)
      case 'camel': return perLine(text, camelCaseLine)
      case 'pascal': return perLine(text, pascalCaseLine)
      case 'snake': return perLine(text, function (l) { return joinWords(l, '_', false) })
      case 'kebab': return perLine(text, function (l) { return joinWords(l, '-', false) })
      case 'constant': return perLine(text, function (l) { return joinWords(l, '_', true) })
      case 'alternating': return alternating(text)
      default: return text
    }
  }

  function render() {
    var text = input.value
    output.value = transform(text, mode)
    var trimmed = text.trim()
    if (charsEl) charsEl.textContent = String(text.length)
    if (wordsEl) wordsEl.textContent = String(trimmed ? trimmed.split(/\s+/).length : 0)
    if (linesEl) linesEl.textContent = String(text === '' ? 0 : text.split('\n').length)
  }

  modeBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      mode = btn.getAttribute('data-mode')
      modeBtns.forEach(function (b) {
        var on = b === btn
        b.classList.toggle('active', on)
        b.setAttribute('aria-pressed', on ? 'true' : 'false')
      })
      render()
    })
  })

  input.addEventListener('input', render)

  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      copyWithFeedback(copyBtn, output.value, { idle: 'Copy' })
    })
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      input.value = ''
      render()
      input.focus()
    })
  }

  render()
})()
