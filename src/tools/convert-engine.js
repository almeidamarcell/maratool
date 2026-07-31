import { copyWithFeedback } from './tool-utils.js'

/**
 * Shared linear-factor conversion engine for Wave 5 converters.
 * Mirrors unit-converter.js UI wiring (from/to selects, live result, swap,
 * copy-with-feedback) but data-driven: per-tool config files call
 * window.maratoolConvertEngine(config) with plain multiply-to-base factors.
 *
 * config = {
 *   prefix: 'arc',                  // DOM id prefix: arc-from-unit, arc-result …
 *   categories: {
 *     area: { label: 'Area', base: 'square meter', units: { 'Square meter (m²)': 1, … } }
 *   },
 *   defaultFrom: 'Square foot (ft²)', // optional preselected units
 *   defaultTo: 'Square meter (m²)',
 * }
 *
 * Factors are plain numbers relative to the category base unit:
 * toBase = value × factor, fromBase = value ÷ factor. Offset units
 * (temperature-style) are intentionally not supported — configs stay
 * auditable line-by-line against NIST SP 811.
 */
;(function () {
  window.maratoolConvertEngine = function (config) {
    var p = config.prefix
    var tabs = document.getElementById(p + '-tabs')
    var fromUnit = document.getElementById(p + '-from-unit')
    var toUnit = document.getElementById(p + '-to-unit')
    var fromValue = document.getElementById(p + '-from-value')
    var resultEl = document.getElementById(p + '-result')
    var swapBtn = document.getElementById(p + '-swap')
    var copyBtn = document.getElementById(p + '-copy')
    if (!fromUnit || !toUnit || !fromValue || !resultEl) return

    var catKeys = Object.keys(config.categories)
    var currentCat = catKeys[0]
    var lastResult = ''

    // Single-category tools render no tab bar
    if (tabs && catKeys.length < 2) tabs.hidden = true

    function populateSelects() {
      var units = config.categories[currentCat].units
      var names = Object.keys(units)
      fromUnit.innerHTML = ''
      toUnit.innerHTML = ''
      names.forEach(function (name) {
        var o1 = document.createElement('option')
        o1.value = name
        o1.textContent = name
        fromUnit.appendChild(o1)

        var o2 = document.createElement('option')
        o2.value = name
        o2.textContent = name
        toUnit.appendChild(o2)
      })
      if (config.defaultFrom && units[config.defaultFrom] !== undefined) {
        fromUnit.value = config.defaultFrom
      }
      if (config.defaultTo && units[config.defaultTo] !== undefined) {
        toUnit.value = config.defaultTo
      } else if (names.length > 1 && toUnit.value === fromUnit.value) {
        toUnit.value = names[fromUnit.selectedIndex === 1 ? 0 : 1]
      }
    }

    function format(result) {
      if (!isFinite(result)) return '—'
      if (Math.abs(result) >= 1000000 || (Math.abs(result) < 0.001 && result !== 0)) {
        return result.toExponential(6)
      }
      // Remove trailing zeros but keep up to 10 decimals
      return parseFloat(result.toFixed(10)).toString()
    }

    function convert() {
      var val = parseFloat(fromValue.value)
      if (isNaN(val)) {
        resultEl.textContent = '—'
        lastResult = ''
        return
      }
      var units = config.categories[currentCat].units
      var from = units[fromUnit.value]
      var to = units[toUnit.value]
      if (from === undefined || to === undefined) return

      var result = (val * from) / to
      lastResult = format(result)
      resultEl.textContent = lastResult
    }

    if (tabs && catKeys.length > 1) {
      tabs.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-cat]')
        if (!btn) return
        var cat = btn.getAttribute('data-cat')
        if (!cat || cat === currentCat) return
        var active = tabs.querySelector('.uc-tab.active')
        if (active) active.classList.remove('active')
        btn.classList.add('active')
        currentCat = cat
        populateSelects()
        fromValue.value = ''
        resultEl.textContent = '—'
        lastResult = ''
      })
    }

    fromUnit.addEventListener('change', convert)
    toUnit.addEventListener('change', convert)
    fromValue.addEventListener('input', convert)

    if (swapBtn) {
      swapBtn.addEventListener('click', function () {
        var tmp = fromUnit.value
        fromUnit.value = toUnit.value
        toUnit.value = tmp
        convert()
      })
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        if (!lastResult || lastResult === '—') return
        copyWithFeedback(copyBtn, lastResult)
      })
    }

    populateSelects()
    convert()
  }
})()
