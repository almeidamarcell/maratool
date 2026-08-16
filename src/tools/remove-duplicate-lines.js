import { copyWithFeedback } from './tool-utils.js'
;(function () {
  var input = document.getElementById('dup-input')
  var output = document.getElementById('dup-output')
  var copyBtn = document.getElementById('dup-copy')
  var clearBtn = document.getElementById('dup-clear')
  var modeBtns = Array.prototype.slice.call(document.querySelectorAll('.dup-mode'))
  var caseSensitive = document.getElementById('dup-case')
  var trimBefore = document.getElementById('dup-trim')
  var dropBlanks = document.getElementById('dup-blanks')
  var inCountEl = document.getElementById('dup-in-count')
  var outCountEl = document.getElementById('dup-out-count')
  var removedEl = document.getElementById('dup-removed')
  var summaryEl = document.getElementById('dup-summary')
  if (!input || !output) return

  var mode = 'first'

  // The comparison key. The raw line is what gets written out, so "trim before
  // comparing" treats "  apple" and "apple" as the same item without silently
  // reformatting whichever copy survives.
  function keyOf(line) {
    var key = trimBefore && trimBefore.checked ? line.trim() : line
    if (!(caseSensitive && caseSensitive.checked)) key = key.toLowerCase()
    return key
  }

  // A Set would collide with a line literally called "__proto__" if we used a
  // plain object, so counts live in a Map.
  function countKeys(lines) {
    var counts = new Map()
    lines.forEach(function (line) {
      var k = keyOf(line)
      counts.set(k, (counts.get(k) || 0) + 1)
    })
    return counts
  }

  function keepFirst(lines) {
    var seen = new Set()
    return lines.filter(function (line) {
      var k = keyOf(line)
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
  }

  // Walking backwards keeps the last copy of each key, then one reverse puts
  // the survivors back in document order.
  function keepLast(lines) {
    var seen = new Set()
    var out = []
    for (var i = lines.length - 1; i >= 0; i--) {
      var k = keyOf(lines[i])
      if (seen.has(k)) continue
      seen.add(k)
      out.push(lines[i])
    }
    return out.reverse()
  }

  // One representative per key that appears two or more times.
  function onlyDuplicates(lines) {
    var counts = countKeys(lines)
    var emitted = new Set()
    return lines.filter(function (line) {
      var k = keyOf(line)
      if (counts.get(k) < 2 || emitted.has(k)) return false
      emitted.add(k)
      return true
    })
  }

  // Lines whose key appears exactly once in the whole input.
  function onlyUnique(lines) {
    var counts = countKeys(lines)
    return lines.filter(function (line) { return counts.get(keyOf(line)) === 1 })
  }

  function summarize(inCount, outCount) {
    var removed = inCount - outCount
    if (inCount === 0) return 'Paste a list above to see the result.'
    if (mode === 'duplicates') {
      return outCount === 0
        ? 'No duplicates found — every line is unique.'
        : outCount + (outCount === 1 ? ' line appears' : ' lines appear') + ' more than once.'
    }
    if (mode === 'unique') {
      return outCount + (outCount === 1 ? ' line appears' : ' lines appear') + ' exactly once, out of ' + inCount + '.'
    }
    if (removed === 0) return 'No duplicates found — all ' + inCount + ' lines kept.'
    return removed + (removed === 1 ? ' duplicate line removed' : ' duplicate lines removed') + ', ' + outCount + ' kept.'
  }

  function render() {
    var raw = input.value
    var lines = raw === '' ? [] : raw.split('\n')
    var inCount = lines.length

    if (dropBlanks && dropBlanks.checked) {
      lines = lines.filter(function (l) { return l.trim() !== '' })
    }

    var result
    switch (mode) {
      case 'first': result = keepFirst(lines); break
      case 'last': result = keepLast(lines); break
      case 'duplicates': result = onlyDuplicates(lines); break
      case 'unique': result = onlyUnique(lines); break
      default: result = lines.slice()
    }

    output.value = result.join('\n')
    if (inCountEl) inCountEl.textContent = String(inCount)
    if (outCountEl) outCountEl.textContent = String(result.length)
    if (removedEl) removedEl.textContent = String(Math.max(0, inCount - result.length))
    if (summaryEl) summaryEl.textContent = summarize(inCount, result.length)
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
  ;[caseSensitive, trimBefore, dropBlanks].forEach(function (el) {
    if (el) el.addEventListener('change', render)
  })

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
