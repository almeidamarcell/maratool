import { copyWithFeedback, setVisible } from './tool-utils.js'

// Random Number Generator
//
// Values come from crypto.getRandomValues(). Two things make the distribution
// uniform rather than merely random-looking:
//
//   1. No Math.random(). It is seeded from an unspecified source and browsers
//      deliberately give it a short period; it is fine for jitter, not for a
//      draw someone may act on.
//   2. No plain modulo. 2^32 is not divisible by, say, 100, so `v % 100` hands
//      out the first 96 residues one extra time each — the low end of the
//      range wins slightly more often. Rejection sampling discards the ragged
//      tail of the 32-bit space instead, at the cost of a rare re-draw.
;(function () {
  var MAX_COUNT = 1000
  var TWO32 = 4294967296

  var minEl = document.getElementById('rng-min')
  var maxEl = document.getElementById('rng-max')
  var countEl = document.getElementById('rng-count')
  var modeEl = document.getElementById('rng-mode')
  var placesField = document.getElementById('rng-places-field')
  var placesEl = document.getElementById('rng-places')
  var dupEl = document.getElementById('rng-duplicates')
  var sortEl = document.getElementById('rng-sort')
  var genBtn = document.getElementById('rng-generate')
  var copyBtn = document.getElementById('rng-copy')
  var errorEl = document.getElementById('rng-error')
  var statsEl = document.getElementById('rng-stats')
  var listEl = document.getElementById('rng-list')

  if (!minEl || !maxEl || !listEl) return

  var statCount = document.getElementById('rng-stat-count')
  var statSum = document.getElementById('rng-stat-sum')
  var statMean = document.getElementById('rng-stat-mean')
  var statLow = document.getElementById('rng-stat-low')
  var statHigh = document.getElementById('rng-stat-high')

  // Results in draw order. Sorting re-renders from this, so ticking and
  // unticking "sort" never silently redraws a different set of numbers.
  var drawn = []
  var drawnPlaces = 0

  // ── randomness ────────────────────────────────────────────────────────

  // Uniform integer in [0, range). Rejection-sampled.
  function randomBelow(range) {
    if (range <= 1) return 0
    if (range <= TWO32) {
      var limit = Math.floor(TWO32 / range) * range
      var buf = new Uint32Array(1)
      for (;;) {
        crypto.getRandomValues(buf)
        if (buf[0] < limit) return buf[0] % range
      }
    }
    // Ranges past 2^32 need 64 bits of entropy per draw. Assembled from two
    // 32-bit words so this does not depend on BigUint64Array.
    var big = BigInt(Math.floor(range))
    var two64 = BigInt('18446744073709551616')
    var limitBig = (two64 / big) * big
    var pair = new Uint32Array(2)
    for (;;) {
      crypto.getRandomValues(pair)
      var v = BigInt(pair[0]) * BigInt(TWO32) + BigInt(pair[1])
      if (v < limitBig) return Number(v % big)
    }
  }

  // Sparse Fisher-Yates: draws `count` distinct indices from [0, rangeSize)
  // in O(count) time and memory. Drawing into a Set and retrying on a
  // collision degenerates when count approaches rangeSize — asking for all
  // 60 lottery balls would spend most of its time re-rolling numbers it
  // already had.
  function drawDistinct(rangeSize, count) {
    var swapped = new Map()
    var out = []
    for (var i = 0; i < count; i++) {
      var j = i + randomBelow(rangeSize - i)
      var vj = swapped.has(j) ? swapped.get(j) : j
      var vi = swapped.has(i) ? swapped.get(i) : i
      out.push(vj)
      swapped.set(j, vi)
    }
    return out
  }

  function drawWithRepeats(rangeSize, count) {
    var out = []
    for (var i = 0; i < count; i++) out.push(randomBelow(rangeSize))
    return out
  }

  // ── input reading ─────────────────────────────────────────────────────

  function fail(message) {
    errorEl.textContent = message
    setVisible(errorEl, true)
    setVisible(statsEl, false)
    listEl.textContent = ''
    drawn = []
    return null
  }

  // Returns { lo, hi, size, places } in scaled-integer space, or null after
  // rendering an error.
  function readInputs() {
    var min = parseFloat(minEl.value)
    var max = parseFloat(maxEl.value)
    if (!isFinite(min) || !isFinite(max)) return fail('Enter a number for both the minimum and the maximum.')
    if (min > max) { var t = min; min = max; max = t; minEl.value = String(min); maxEl.value = String(max) }

    var count = Math.floor(parseFloat(countEl.value))
    if (!isFinite(count) || count < 1) count = 1
    if (count > MAX_COUNT) count = MAX_COUNT
    countEl.value = String(count)

    var places = 0
    if (modeEl.value === 'dec') {
      places = Math.floor(parseFloat(placesEl.value))
      if (!isFinite(places) || places < 1) places = 1
      if (places > 10) places = 10
      placesEl.value = String(places)
    }

    var scale = Math.pow(10, places)
    var lo = Math.round(min * scale)
    var hi = Math.round(max * scale)
    if (!isFinite(lo) || !isFinite(hi) || Math.abs(lo) > Number.MAX_SAFE_INTEGER || Math.abs(hi) > Number.MAX_SAFE_INTEGER) {
      return fail('Those numbers are too large to draw from at that precision. Narrow the range or use fewer decimal places.')
    }
    var size = hi - lo + 1
    if (size < 1 || size > Number.MAX_SAFE_INTEGER) {
      return fail('That range is too wide to sample. Narrow the minimum and maximum, or reduce the decimal places.')
    }
    if (places === 0 && (min % 1 !== 0 || max % 1 !== 0)) {
      // Whole-number mode with fractional bounds: report what was actually used.
      minEl.value = String(lo)
      maxEl.value = String(hi)
    }

    var unique = !dupEl.checked
    if (unique && count > size) {
      return fail('Only ' + size.toLocaleString() + ' distinct ' + (places ? 'value' : 'whole number') + (size === 1 ? '' : 's') +
        ' exist between ' + (lo / scale).toFixed(places) + ' and ' + (hi / scale).toFixed(places) +
        '. Ask for ' + size.toLocaleString() + ' or fewer, widen the range, or allow duplicates.')
    }

    return { lo: lo, hi: hi, size: size, count: count, places: places, scale: scale, unique: unique }
  }

  // ── rendering ─────────────────────────────────────────────────────────

  function format(value, places) {
    return places ? value.toFixed(places) : String(value)
  }

  function render() {
    listEl.textContent = ''
    if (!drawn.length) { setVisible(statsEl, false); return }

    var values = sortEl.checked ? drawn.slice().sort(function (a, b) { return a - b }) : drawn
    var frag = document.createDocumentFragment()
    var sum = 0
    var low = values[0]
    var high = values[0]

    for (var i = 0; i < values.length; i++) {
      var v = values[i]
      sum += v
      if (v < low) low = v
      if (v > high) high = v
      var text = format(v, drawnPlaces)

      var li = document.createElement('li')
      li.className = 'uuid-item'

      var idx = document.createElement('span')
      idx.className = 'rng-index'
      idx.textContent = '#' + (i + 1)

      var val = document.createElement('span')
      val.className = 'uuid-value'
      val.textContent = text

      var btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'rng-copy-one'
      btn.textContent = 'Copy'
      btn.dataset.value = text

      li.appendChild(idx)
      li.appendChild(val)
      li.appendChild(btn)
      frag.appendChild(li)
    }
    listEl.appendChild(frag)

    var mean = sum / values.length
    statCount.textContent = values.length.toLocaleString()
    statSum.textContent = format(Number(sum.toFixed(drawnPlaces)), drawnPlaces)
    statMean.textContent = mean.toFixed(Math.min(drawnPlaces + 2, 10))
    statLow.textContent = format(low, drawnPlaces)
    statHigh.textContent = format(high, drawnPlaces)
    setVisible(statsEl, true)
  }

  function generate() {
    var cfg = readInputs()
    if (!cfg) return
    setVisible(errorEl, false)

    var indices = cfg.unique ? drawDistinct(cfg.size, cfg.count) : drawWithRepeats(cfg.size, cfg.count)
    drawnPlaces = cfg.places
    drawn = indices.map(function (i) {
      var scaled = cfg.lo + i
      return cfg.places ? Number((scaled / cfg.scale).toFixed(cfg.places)) : scaled
    })
    render()
  }

  function currentText() {
    var values = sortEl.checked ? drawn.slice().sort(function (a, b) { return a - b }) : drawn
    return values.map(function (v) { return format(v, drawnPlaces) }).join('\n')
  }

  // ── wiring ────────────────────────────────────────────────────────────

  modeEl.addEventListener('change', function () {
    setVisible(placesField, modeEl.value === 'dec')
    generate()
  })
  sortEl.addEventListener('change', render)
  ;[minEl, maxEl, countEl, placesEl].forEach(function (el) {
    el.addEventListener('change', generate)
  })
  dupEl.addEventListener('change', generate)
  if (genBtn) genBtn.addEventListener('click', generate)

  document.querySelectorAll('.rng-preset').forEach(function (btn) {
    btn.addEventListener('click', function () {
      minEl.value = btn.dataset.min
      maxEl.value = btn.dataset.max
      countEl.value = btn.dataset.count
      modeEl.value = 'int'
      setVisible(placesField, false)
      if (btn.dataset.unique) dupEl.checked = false
      generate()
    })
  })

  // One delegated listener instead of 1000 — a quantity of 1000 would
  // otherwise attach a thousand handlers on every draw.
  listEl.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('.rng-copy-one') : null
    if (!btn) return
    copyWithFeedback(btn, btn.dataset.value)
  })

  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      if (!drawn.length) return
      copyWithFeedback(copyBtn, currentText())
    })
  }

  setVisible(placesField, modeEl.value === 'dec')
  generate()
})()
