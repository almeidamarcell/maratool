// Percentage Calculator — UI logic
import {
  percentOf,
  whatPercent,
  percentIncrease,
  percentDecrease,
  proportionPercent,
  addPercent,
  subtractPercent,
  originalBeforeIncrease,
  originalBeforeDecrease,
} from './percentage-calc.js'

;(function () {
  function getVal(id) {
    var el = document.getElementById(id)
    if (!el || el.value.trim() === '') return NaN
    return parseFloat(el.value)
  }

  function showResult(id, value) {
    var el = document.getElementById(id)
    var copyBtn = el.parentElement.querySelector('.pct-copy')
    if (value === null) {
      el.textContent = 'Cannot divide by zero'
      el.classList.add('error')
      copyBtn.classList.remove('visible')
      return
    }
    // Format: remove trailing zeros but keep up to 2 decimals
    var formatted = Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, '')
    el.textContent = formatted
    el.classList.remove('error')
    copyBtn.classList.add('visible')
  }

  function showError(id, msg) {
    var el = document.getElementById(id)
    var copyBtn = el.parentElement.querySelector('.pct-copy')
    el.textContent = msg
    el.classList.add('error')
    copyBtn.classList.remove('visible')
  }

  var calcs = {
    1: function () {
      var p = getVal('c1-percent')
      var v = getVal('c1-value')
      if (isNaN(p) || isNaN(v)) return showError('c1-result', 'Enter both values')
      showResult('c1-result', percentOf(p, v))
    },
    2: function () {
      var v = getVal('c2-value')
      var t = getVal('c2-total')
      if (isNaN(v) || isNaN(t)) return showError('c2-result', 'Enter both values')
      var r = whatPercent(v, t)
      if (r === null) return showResult('c2-result', null)
      showResult('c2-result', r)
      // Append % to display
      document.getElementById('c2-result').textContent += '%'
    },
    3: function () {
      var o = getVal('c3-original')
      var n = getVal('c3-new')
      if (isNaN(o) || isNaN(n)) return showError('c3-result', 'Enter both values')
      var r = percentIncrease(o, n)
      if (r === null) return showResult('c3-result', null)
      showResult('c3-result', r)
      document.getElementById('c3-result').textContent += '%'
    },
    4: function () {
      var o = getVal('c4-original')
      var n = getVal('c4-new')
      if (isNaN(o) || isNaN(n)) return showError('c4-result', 'Enter both values')
      var r = percentDecrease(o, n)
      if (r === null) return showResult('c4-result', null)
      showResult('c4-result', r)
      document.getElementById('c4-result').textContent += '%'
    },
    5: function () {
      var p = getVal('c5-part')
      var w = getVal('c5-whole')
      if (isNaN(p) || isNaN(w)) return showError('c5-result', 'Enter both values')
      var r = proportionPercent(p, w)
      if (r === null) return showResult('c5-result', null)
      showResult('c5-result', r)
      document.getElementById('c5-result').textContent += '%'
    },
    6: function () {
      var v = getVal('c6-value')
      var p = getVal('c6-percent')
      if (isNaN(v) || isNaN(p)) return showError('c6-result', 'Enter both values')
      showResult('c6-result', addPercent(v, p))
    },
    7: function () {
      var v = getVal('c7-value')
      var p = getVal('c7-percent')
      if (isNaN(v) || isNaN(p)) return showError('c7-result', 'Enter both values')
      showResult('c7-result', subtractPercent(v, p))
    },
    8: function () {
      var p = getVal('c8-percent')
      var f = getVal('c8-final')
      if (isNaN(p) || isNaN(f)) return showError('c8-result', 'Enter both values')
      showResult('c8-result', originalBeforeIncrease(p, f))
    },
    9: function () {
      var p = getVal('c9-percent')
      var f = getVal('c9-final')
      if (isNaN(p) || isNaN(f)) return showError('c9-result', 'Enter both values')
      showResult('c9-result', originalBeforeDecrease(p, f))
    },
  }

  // Bind Calculate buttons
  document.querySelectorAll('[data-calc]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var n = parseInt(btn.getAttribute('data-calc'))
      if (calcs[n]) calcs[n]()
    })
  })

  // Bind Enter key on inputs to trigger their row's Calculate
  document.querySelectorAll('.pct-input').forEach(function (input) {
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var calcBtn = input.closest('.pct-calc').querySelector('[data-calc]')
        if (calcBtn) calcBtn.click()
      }
    })
  })

  // Bind Copy buttons
  document.querySelectorAll('.pct-copy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var targetId = btn.getAttribute('data-target')
      var el = document.getElementById(targetId)
      if (!el || el.classList.contains('error') || el.textContent === '—') return
      navigator.clipboard.writeText(el.textContent).then(function () {
        btn.textContent = 'Copied!'
        btn.classList.add('copied')
        setTimeout(function () {
          btn.textContent = 'Copy'
          btn.classList.remove('copied')
        }, 2000)
      })
    })
  })
})()
