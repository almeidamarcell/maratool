(function () {
  var baseInput = document.getElementById('pr-base')
  var pxInput = document.getElementById('pr-px-input')
  var remInput = document.getElementById('pr-rem-input')
  var remResult = document.getElementById('pr-rem-result')
  var pxResult = document.getElementById('pr-px-result')
  var copyRem = document.getElementById('pr-copy-rem')
  var copyPx = document.getElementById('pr-copy-px')
  var tableBody = document.getElementById('pr-table-body')

  var commonPx = [4, 8, 10, 12, 14, 16, 18, 20, 24, 32, 48, 64, 72, 96]
  var lastRemValue = ''
  var lastPxValue = ''

  function readHash() {
    try {
      var h = window.location.hash.slice(1)
      if (!h) return {}
      return JSON.parse(decodeURIComponent(h))
    } catch (e) { return {} }
  }

  function writeHash(obj) {
    history.replaceState(null, '', '#' + encodeURIComponent(JSON.stringify(obj)))
  }

  function getBase() {
    var v = parseFloat(baseInput.value)
    return (v && v > 0) ? v : 16
  }

  function round(n) {
    return Math.round(n * 10000) / 10000
  }

  function convertPxToRem() {
    var base = getBase()
    var px = parseFloat(pxInput.value)
    if (isNaN(px)) {
      remResult.textContent = '\u2014'
      lastRemValue = ''
      return
    }
    var rem = round(px / base)
    lastRemValue = rem + 'rem'
    remResult.textContent = lastRemValue
    writeHash({ base: getBase(), px: pxInput.value, rem: '' })
  }

  function convertRemToPx() {
    var base = getBase()
    var rem = parseFloat(remInput.value)
    if (isNaN(rem)) {
      pxResult.textContent = '\u2014'
      lastPxValue = ''
      return
    }
    var px = round(rem * base)
    lastPxValue = px + 'px'
    pxResult.textContent = lastPxValue
    writeHash({ base: getBase(), px: '', rem: remInput.value })
  }

  function buildTable() {
    var base = getBase()
    var html = ''
    for (var i = 0; i < commonPx.length; i++) {
      var px = commonPx[i]
      var rem = round(px / base)
      html += '<tr data-rem="' + rem + 'rem" data-px="' + px + 'px">' +
        '<td>' + px + 'px</td>' +
        '<td>' + rem + 'rem</td>' +
        '</tr>'
    }
    tableBody.innerHTML = html
  }

  function copyText(text, btn) {
    if (!text) return
    navigator.clipboard.writeText(text).then(function () {
      var orig = btn.textContent
      btn.textContent = 'Copied!'
      setTimeout(function () { btn.textContent = orig }, 2000)
    })
  }

  pxInput.addEventListener('input', convertPxToRem)
  remInput.addEventListener('input', convertRemToPx)

  baseInput.addEventListener('input', function () {
    buildTable()
    if (pxInput.value) convertPxToRem()
    if (remInput.value) convertRemToPx()
  })

  copyRem.addEventListener('click', function () {
    copyText(lastRemValue, copyRem)
  })

  copyPx.addEventListener('click', function () {
    copyText(lastPxValue, copyPx)
  })

  tableBody.addEventListener('click', function (e) {
    var tr = e.target.closest('tr')
    if (!tr) return
    var td = e.target.closest('td')
    if (!td) return
    var colIndex = Array.prototype.indexOf.call(tr.children, td)
    var text = colIndex === 0 ? tr.getAttribute('data-px') : tr.getAttribute('data-rem')
    navigator.clipboard.writeText(text).then(function () {
      td.classList.add('copied')
      setTimeout(function () { td.classList.remove('copied') }, 2000)
    })
  })

  // Restore from hash
  var state = readHash()
  if (state.base) baseInput.value = state.base
  if (state.px) { pxInput.value = state.px; convertPxToRem() }
  if (state.rem) { remInput.value = state.rem; convertRemToPx() }

  buildTable()
})()
