import {
  footLengthToSizes,
  sizeToFootLength,
  parseSizeInput,
  referenceRows,
} from './shoe-size-core.js'

;(function () {
  var catBtns = Array.prototype.slice.call(document.querySelectorAll('.ssz-cat'))
  var fitBtns = Array.prototype.slice.call(document.querySelectorAll('.ssz-fit'))
  var systemSel = document.getElementById('ssz-system')
  var sizeInput = document.getElementById('ssz-size')
  var resultsEl = document.getElementById('ssz-results')
  var footEl = document.getElementById('ssz-foot')
  var theadEl = document.getElementById('ssz-thead')
  var tbodyEl = document.getElementById('ssz-tbody')
  var filterEl = document.getElementById('ssz-filter')
  if (!systemSel || !resultsEl) return

  // Display order + labels for the result cards.
  var CARD_SYSTEMS = [
    ['us', 'US'],
    ['uk', 'UK'],
    ['eu', 'EU'],
    ['br', 'Brazil'],
    ['jp', 'Japan'],
    ['mx', 'Mexico'],
    ['au', 'Australia'],
  ]
  var CHART_COLS = [
    ['us', 'US'],
    ['uk', 'UK'],
    ['eu', 'EU'],
    ['br', 'BR'],
    ['jp', 'JP'],
    ['mx', 'MX'],
    ['au', 'AU'],
    ['cm', 'cm'],
    ['inch', 'in'],
  ]

  var state = { cat: 'men', system: 'us', size: '9', fit: 'standard' }

  function fmt(v) {
    return v == null || v === '' ? '—' : v
  }

  function readHash() {
    try {
      var h = window.location.hash.slice(1)
      if (!h || h.indexOf('=') === -1) return
      var parts = h.split('&')
      for (var i = 0; i < parts.length; i++) {
        var kv = parts[i].split('=')
        if (kv[0] === 'cat' && ['men', 'women', 'kids'].indexOf(kv[1]) !== -1) state.cat = kv[1]
        if (kv[0] === 'fit' && ['standard', 'sneaker'].indexOf(kv[1]) !== -1) state.fit = kv[1]
        if (kv[0] === 'sys') state.system = decodeURIComponent(kv[1])
        if (kv[0] === 'size') state.size = decodeURIComponent(kv[1])
      }
    } catch (e) {}
  }

  function writeHash() {
    try {
      history.replaceState(null, '', '#cat=' + state.cat + '&fit=' + state.fit + '&sys=' + state.system + '&size=' + encodeURIComponent(state.size))
    } catch (e) {}
  }

  function currentFootLength() {
    var value = parseSizeInput(state.system, state.size, state.cat)
    if (value == null) return null
    return sizeToFootLength(state.system, value, state.cat, state.fit)
  }

  function render() {
    // Reflect category on the toggle.
    catBtns.forEach(function (b) {
      var on = b.getAttribute('data-cat') === state.cat
      b.classList.toggle('is-active', on)
      b.setAttribute('aria-selected', on ? 'true' : 'false')
    })
    fitBtns.forEach(function (b) {
      var on = b.getAttribute('data-fit') === state.fit
      b.classList.toggle('is-active', on)
      b.setAttribute('aria-selected', on ? 'true' : 'false')
    })

    var mm = currentFootLength()
    var sizes = mm ? footLengthToSizes(mm, state.cat, state.fit) : null

    // Result cards.
    var html = ''
    for (var i = 0; i < CARD_SYSTEMS.length; i++) {
      var key = CARD_SYSTEMS[i][0]
      var label = CARD_SYSTEMS[i][1]
      var val = sizes ? sizes[key] : null
      var isSource = key === state.system
      var copyVal = val == null ? '' : String(val)
      html +=
        '<button class="ssz-card' + (isSource ? ' is-source' : '') + '" data-copy="' + copyVal + '" type="button" title="Copy">' +
        '<span class="ssz-card-label">' + label + '</span>' +
        '<span class="ssz-card-value">' + fmt(val) + '</span>' +
        '</button>'
    }
    resultsEl.innerHTML = html

    // Foot length line.
    if (sizes) {
      footEl.textContent =
        'Foot length: ' + sizes.cm + ' cm  ·  ' + sizes.inch + ' in  ·  Mondopoint ' + sizes.mondopoint
    } else {
      footEl.textContent = 'Enter a size to see the conversions.'
    }

    renderChart(sizes)
    writeHash()
  }

  function renderChart(current) {
    if (!theadEl || !tbodyEl) return
    var head = '<tr>'
    for (var c = 0; c < CHART_COLS.length; c++) head += '<th>' + CHART_COLS[c][1] + '</th>'
    head += '</tr>'
    theadEl.innerHTML = head

    var rows = referenceRows(state.cat, state.fit)
    var filter = (filterEl && filterEl.value || '').trim().toLowerCase()
    var body = ''
    for (var r = 0; r < rows.length; r++) {
      var row = rows[r]
      var cells = ''
      var match = false
      var rowText = ''
      for (var k = 0; k < CHART_COLS.length; k++) {
        var v = row[CHART_COLS[k][0]]
        rowText += ' ' + (v == null ? '' : v)
        cells += '<td>' + fmt(v) + '</td>'
      }
      // Highlight the row closest to the current input.
      if (current && String(row[state.system]) === String(current[state.system])) match = true
      if (filter && rowText.toLowerCase().indexOf(filter) === -1) continue
      body += '<tr' + (match ? ' class="is-current"' : '') + '>' + cells + '</tr>'
    }
    tbodyEl.innerHTML = body || '<tr><td colspan="' + CHART_COLS.length + '" class="ssz-empty">No sizes match.</td></tr>'
  }

  // ── events ──
  catBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      state.cat = b.getAttribute('data-cat')
      render()
    })
  })
  fitBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      state.fit = b.getAttribute('data-fit')
      render()
    })
  })
  systemSel.addEventListener('change', function () {
    state.system = systemSel.value
    render()
  })
  sizeInput.addEventListener('input', function () {
    state.size = sizeInput.value
    render()
  })
  if (filterEl) filterEl.addEventListener('input', function () {
    var mm = currentFootLength()
    renderChart(mm ? footLengthToSizes(mm, state.cat, state.fit) : null)
  })

  resultsEl.addEventListener('click', function (e) {
    var card = e.target.closest('.ssz-card')
    if (!card) return
    var text = card.getAttribute('data-copy')
    if (!text) return
    navigator.clipboard.writeText(text).then(function () {
      card.classList.add('is-copied')
      setTimeout(function () { card.classList.remove('is-copied') }, 1500)
    })
  })

  // ── init ──
  readHash()
  systemSel.value = state.system
  sizeInput.value = state.size
  render()
})()
