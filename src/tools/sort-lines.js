import { copyWithFeedback } from './tool-utils.js'
;(function () {
  var input = document.getElementById('srt-input')
  var output = document.getElementById('srt-output')
  var copyBtn = document.getElementById('srt-copy')
  var clearBtn = document.getElementById('srt-clear')
  var modeBtns = Array.prototype.slice.call(document.querySelectorAll('.srt-mode'))
  var caseSensitive = document.getElementById('srt-case')
  var ignoreIndent = document.getElementById('srt-indent')
  var dropBlanks = document.getElementById('srt-blanks')
  var natural = document.getElementById('srt-natural')
  var inCountEl = document.getElementById('srt-in-count')
  var outCountEl = document.getElementById('srt-out-count')
  var removedEl = document.getElementById('srt-removed')
  if (!input || !output) return

  var mode = 'az'

  // The string actually compared. The raw line is what gets written out, so
  // "ignore leading whitespace" only changes ordering, never the indentation.
  function sortKey(line) {
    var key = ignoreIndent && ignoreIndent.checked ? line.replace(/^\s+/, '') : line
    if (!(caseSensitive && caseSensitive.checked)) key = key.toLowerCase()
    return key
  }

  function compare(a, b) {
    var ka = sortKey(a)
    var kb = sortKey(b)
    if (natural && natural.checked) {
      // Numeric collation is what puts item2 before item10; a plain string
      // compare sorts "10" before "2" because "1" < "2".
      return ka.localeCompare(kb, undefined, { numeric: true, sensitivity: 'variant' })
    }
    if (ka < kb) return -1
    if (ka > kb) return 1
    return 0
  }

  // First number anywhere in the line, sign and decimals included.
  function numberIn(line) {
    var m = line.match(/-?\d+(?:\.\d+)?/)
    return m ? parseFloat(m[0]) : null
  }

  // Lines with no number keep their relative order and sink to the bottom in
  // both directions, so flipping asc/desc never buries them mid-list.
  function numericSort(lines, desc) {
    var withNum = []
    var without = []
    lines.forEach(function (line, i) {
      var n = numberIn(line)
      if (n === null || isNaN(n)) without.push(line)
      else withNum.push({ line: line, n: n, i: i })
    })
    withNum.sort(function (a, b) {
      if (a.n !== b.n) return desc ? b.n - a.n : a.n - b.n
      return a.i - b.i
    })
    return withNum.map(function (x) { return x.line }).concat(without)
  }

  function lengthSort(lines, desc) {
    return lines.map(function (line, i) { return { line: line, i: i } })
      .sort(function (a, b) {
        var la = a.line.length
        var lb = b.line.length
        if (la !== lb) return desc ? lb - la : la - lb
        return a.i - b.i
      })
      .map(function (x) { return x.line })
  }

  function shuffle(lines) {
    var out = lines.slice()
    var rand = function (max) {
      if (window.crypto && window.crypto.getRandomValues) {
        var buf = new Uint32Array(1)
        window.crypto.getRandomValues(buf)
        return buf[0] % max
      }
      return Math.floor(Math.random() * max)
    }
    // Fisher-Yates. sort(() => Math.random() - 0.5) is not a uniform shuffle
    // and leaves short lists close to their original order.
    for (var i = out.length - 1; i > 0; i--) {
      var j = rand(i + 1)
      var tmp = out[i]
      out[i] = out[j]
      out[j] = tmp
    }
    return out
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
      case 'az': result = lines.slice().sort(compare); break
      case 'za': result = lines.slice().sort(function (a, b) { return -compare(a, b) }); break
      case 'num-asc': result = numericSort(lines, false); break
      case 'num-desc': result = numericSort(lines, true); break
      case 'len-asc': result = lengthSort(lines, false); break
      case 'len-desc': result = lengthSort(lines, true); break
      case 'reverse': result = lines.slice().reverse(); break
      case 'shuffle': result = shuffle(lines); break
      default: result = lines.slice()
    }

    output.value = result.join('\n')
    if (inCountEl) inCountEl.textContent = String(inCount)
    if (outCountEl) outCountEl.textContent = String(result.length)
    if (removedEl) removedEl.textContent = String(Math.max(0, inCount - result.length))
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
  ;[caseSensitive, ignoreIndent, dropBlanks, natural].forEach(function (el) {
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
