(function () {
  var tabs = document.getElementById('uc-tabs')
  var fromUnit = document.getElementById('uc-from-unit')
  var toUnit = document.getElementById('uc-to-unit')
  var fromValue = document.getElementById('uc-from-value')
  var resultEl = document.getElementById('uc-result')
  var swapBtn = document.getElementById('uc-swap')
  var copyBtn = document.getElementById('uc-copy')

  // ── Unit definitions ──
  // Each unit has toBase and fromBase functions relative to the category's base unit

  var categories = {
    length: {
      base: 'meter',
      units: {
        'Kilometer (km)': { toBase: function (v) { return v * 1000 }, fromBase: function (v) { return v / 1000 } },
        'Meter (m)': { toBase: function (v) { return v }, fromBase: function (v) { return v } },
        'Centimeter (cm)': { toBase: function (v) { return v * 0.01 }, fromBase: function (v) { return v / 0.01 } },
        'Millimeter (mm)': { toBase: function (v) { return v * 0.001 }, fromBase: function (v) { return v / 0.001 } },
        'Mile (mi)': { toBase: function (v) { return v * 1609.344 }, fromBase: function (v) { return v / 1609.344 } },
        'Yard (yd)': { toBase: function (v) { return v * 0.9144 }, fromBase: function (v) { return v / 0.9144 } },
        'Foot (ft)': { toBase: function (v) { return v * 0.3048 }, fromBase: function (v) { return v / 0.3048 } },
        'Inch (in)': { toBase: function (v) { return v * 0.0254 }, fromBase: function (v) { return v / 0.0254 } },
        'Nautical Mile (nmi)': { toBase: function (v) { return v * 1852 }, fromBase: function (v) { return v / 1852 } },
      }
    },
    weight: {
      base: 'kilogram',
      units: {
        'Tonne (t)': { toBase: function (v) { return v * 1000 }, fromBase: function (v) { return v / 1000 } },
        'Kilogram (kg)': { toBase: function (v) { return v }, fromBase: function (v) { return v } },
        'Gram (g)': { toBase: function (v) { return v * 0.001 }, fromBase: function (v) { return v / 0.001 } },
        'Milligram (mg)': { toBase: function (v) { return v * 0.000001 }, fromBase: function (v) { return v / 0.000001 } },
        'Pound (lb)': { toBase: function (v) { return v * 0.453592 }, fromBase: function (v) { return v / 0.453592 } },
        'Ounce (oz)': { toBase: function (v) { return v * 0.0283495 }, fromBase: function (v) { return v / 0.0283495 } },
        'Stone (st)': { toBase: function (v) { return v * 6.35029 }, fromBase: function (v) { return v / 6.35029 } },
      }
    },
    temperature: {
      base: 'celsius',
      units: {
        'Celsius (\u00B0C)': {
          toBase: function (v) { return v },
          fromBase: function (v) { return v }
        },
        'Fahrenheit (\u00B0F)': {
          toBase: function (v) { return (v - 32) * 5 / 9 },
          fromBase: function (v) { return v * 9 / 5 + 32 }
        },
        'Kelvin (K)': {
          toBase: function (v) { return v - 273.15 },
          fromBase: function (v) { return v + 273.15 }
        }
      }
    },
    data: {
      base: 'byte',
      units: {
        'Bit (b)': { toBase: function (v) { return v / 8 }, fromBase: function (v) { return v * 8 } },
        'Byte (B)': { toBase: function (v) { return v }, fromBase: function (v) { return v } },
        'Kilobyte (KB)': { toBase: function (v) { return v * 1024 }, fromBase: function (v) { return v / 1024 } },
        'Megabyte (MB)': { toBase: function (v) { return v * 1048576 }, fromBase: function (v) { return v / 1048576 } },
        'Gigabyte (GB)': { toBase: function (v) { return v * 1073741824 }, fromBase: function (v) { return v / 1073741824 } },
        'Terabyte (TB)': { toBase: function (v) { return v * 1099511627776 }, fromBase: function (v) { return v / 1099511627776 } },
        'Kilobit (Kb)': { toBase: function (v) { return v * 128 }, fromBase: function (v) { return v / 128 } },
        'Megabit (Mb)': { toBase: function (v) { return v * 131072 }, fromBase: function (v) { return v / 131072 } },
        'Gigabit (Gb)': { toBase: function (v) { return v * 134217728 }, fromBase: function (v) { return v / 134217728 } },
      }
    },
    speed: {
      base: 'm/s',
      units: {
        'Meters/second (m/s)': { toBase: function (v) { return v }, fromBase: function (v) { return v } },
        'Kilometers/hour (km/h)': { toBase: function (v) { return v / 3.6 }, fromBase: function (v) { return v * 3.6 } },
        'Miles/hour (mph)': { toBase: function (v) { return v * 0.44704 }, fromBase: function (v) { return v / 0.44704 } },
        'Knot (kn)': { toBase: function (v) { return v * 0.514444 }, fromBase: function (v) { return v / 0.514444 } },
        'Feet/second (ft/s)': { toBase: function (v) { return v * 0.3048 }, fromBase: function (v) { return v / 0.3048 } },
      }
    },
    time: {
      base: 'second',
      units: {
        'Millisecond (ms)': { toBase: function (v) { return v * 0.001 }, fromBase: function (v) { return v / 0.001 } },
        'Second (s)': { toBase: function (v) { return v }, fromBase: function (v) { return v } },
        'Minute (min)': { toBase: function (v) { return v * 60 }, fromBase: function (v) { return v / 60 } },
        'Hour (h)': { toBase: function (v) { return v * 3600 }, fromBase: function (v) { return v / 3600 } },
        'Day (d)': { toBase: function (v) { return v * 86400 }, fromBase: function (v) { return v / 86400 } },
        'Week (wk)': { toBase: function (v) { return v * 604800 }, fromBase: function (v) { return v / 604800 } },
        'Year (yr)': { toBase: function (v) { return v * 31557600 }, fromBase: function (v) { return v / 31557600 } },
      }
    }
  }

  var currentCat = 'length'
  var lastResult = ''

  // ── Populate dropdowns ──

  function populateSelects() {
    var units = categories[currentCat].units
    var names = Object.keys(units)
    fromUnit.innerHTML = ''
    toUnit.innerHTML = ''
    names.forEach(function (name, i) {
      var o1 = document.createElement('option')
      o1.value = name
      o1.textContent = name
      fromUnit.appendChild(o1)

      var o2 = document.createElement('option')
      o2.value = name
      o2.textContent = name
      toUnit.appendChild(o2)
    })
    // Default: first and second unit
    if (names.length > 1) toUnit.value = names[1]
  }

  // ── Convert ──

  function convert() {
    var val = parseFloat(fromValue.value)
    if (isNaN(val)) {
      resultEl.textContent = '\u2014'
      lastResult = ''
      return
    }
    var units = categories[currentCat].units
    var from = units[fromUnit.value]
    var to = units[toUnit.value]
    if (!from || !to) return

    var base = from.toBase(val)
    var result = to.fromBase(base)

    // Smart formatting
    if (Math.abs(result) >= 1000000 || (Math.abs(result) < 0.001 && result !== 0)) {
      lastResult = result.toExponential(6)
    } else {
      // Remove trailing zeros but keep up to 10 decimals
      lastResult = parseFloat(result.toFixed(10)).toString()
    }
    resultEl.textContent = lastResult
  }

  // ── Tab switching ──

  tabs.addEventListener('click', function (e) {
    var btn = e.target.closest('.uc-tab')
    if (!btn) return
    var cat = btn.getAttribute('data-uc-cat')
    if (!cat || cat === currentCat) return

    tabs.querySelector('.uc-tab.active').classList.remove('active')
    btn.classList.add('active')
    currentCat = cat
    populateSelects()
    fromValue.value = ''
    resultEl.textContent = '\u2014'
    lastResult = ''
  })

  fromUnit.addEventListener('change', convert)
  toUnit.addEventListener('change', convert)
  fromValue.addEventListener('input', convert)

  // ── Swap ──

  swapBtn.addEventListener('click', function () {
    var tmp = fromUnit.value
    fromUnit.value = toUnit.value
    toUnit.value = tmp
    convert()
  })

  // ── Copy ──

  copyBtn.addEventListener('click', function () {
    if (!lastResult) return
    navigator.clipboard.writeText(lastResult).then(function () {
      var orig = copyBtn.textContent
      copyBtn.textContent = 'Copied!'
      copyBtn.classList.add('copied')
      setTimeout(function () {
        copyBtn.textContent = orig
        copyBtn.classList.remove('copied')
      }, 2000)
    })
  })

  // ── Init ──

  populateSelects()
})()
