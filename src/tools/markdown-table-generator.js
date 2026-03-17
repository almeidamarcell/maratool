import './hash-state.js'
// Markdown Table Generator
;(function () {
  'use strict'

  var rowsInput = document.getElementById('mtg-rows')
  var colsInput = document.getElementById('mtg-cols')
  var addRowBtn = document.getElementById('mtg-add-row')
  var addColBtn = document.getElementById('mtg-add-col')
  var removeRowBtn = document.getElementById('mtg-remove-row')
  var removeColBtn = document.getElementById('mtg-remove-col')
  var gridEl = document.getElementById('mtg-grid')
  var output = document.getElementById('mtg-output')
  var copyBtn = document.getElementById('mtg-copy')
  var includeHeader = document.getElementById('mtg-header')

  var rows = 3
  var cols = 3
  var data = []
  var aligns = []

  function initData() {
    data = []
    aligns = []
    for (var r = 0; r < rows; r++) {
      data[r] = []
      for (var c = 0; c < cols; c++) {
        data[r][c] = ''
      }
    }
    for (var c2 = 0; c2 < cols; c2++) {
      aligns[c2] = 'left'
    }
  }

  function renderGrid() {
    gridEl.innerHTML = ''

    // Alignment row
    var alignRow = document.createElement('div')
    alignRow.className = 'mtg-row mtg-align-row'
    for (var ac = 0; ac < cols; ac++) {
      var alignBtn = document.createElement('button')
      alignBtn.className = 'mtg-align-btn'
      alignBtn.dataset.col = ac
      alignBtn.textContent = aligns[ac] === 'left' ? '←' : aligns[ac] === 'center' ? '↔' : '→'
      alignBtn.title = 'Alignment: ' + aligns[ac]
      alignBtn.addEventListener('click', (function (c) {
        return function () {
          if (aligns[c] === 'left') aligns[c] = 'center'
          else if (aligns[c] === 'center') aligns[c] = 'right'
          else aligns[c] = 'left'
          renderGrid()
          generate()
        }
      })(ac))
      alignRow.appendChild(alignBtn)
    }
    gridEl.appendChild(alignRow)

    // Data rows
    for (var r = 0; r < rows; r++) {
      var rowEl = document.createElement('div')
      rowEl.className = 'mtg-row'
      if (r === 0 && includeHeader.checked) rowEl.classList.add('mtg-header-row')
      for (var c = 0; c < cols; c++) {
        var cell = document.createElement('input')
        cell.type = 'text'
        cell.className = 'mtg-cell'
        cell.value = data[r][c] || ''
        cell.placeholder = r === 0 && includeHeader.checked ? 'Header' : ''
        cell.dataset.row = r
        cell.dataset.col = c
        cell.addEventListener('input', (function (rr, cc) {
          return function (e) {
            data[rr][cc] = e.target.value
            generate()
          }
        })(r, c))
        rowEl.appendChild(cell)
      }
      gridEl.appendChild(rowEl)
    }

    rowsInput.value = rows
    colsInput.value = cols
  }

  function generate() {
    if (rows === 0 || cols === 0) { output.value = ''; return }

    var headerRow = includeHeader.checked ? 0 : -1
    var lines = []

    if (headerRow >= 0) {
      lines.push('| ' + data[0].map(function (v) { return escapeCell(v || '') }).join(' | ') + ' |')
    } else {
      lines.push('| ' + Array(cols).fill('').map(function (_, i) { return 'Column ' + (i + 1) }).join(' | ') + ' |')
    }

    // Separator
    var sep = aligns.map(function (a) {
      if (a === 'center') return ':---:'
      if (a === 'right') return '---:'
      return '---'
    })
    lines.push('| ' + sep.join(' | ') + ' |')

    // Data rows
    var startRow = headerRow >= 0 ? 1 : 0
    for (var r = startRow; r < rows; r++) {
      lines.push('| ' + data[r].map(function (v) { return escapeCell(v || '') }).join(' | ') + ' |')
    }

    output.value = lines.join('\n')
  }

  function escapeCell(val) {
    return val.replace(/\|/g, '\\|')
  }

  addRowBtn.addEventListener('click', function () {
    rows++
    data.push(Array(cols).fill(''))
    renderGrid()
    generate()
  })

  addColBtn.addEventListener('click', function () {
    cols++
    for (var r = 0; r < data.length; r++) data[r].push('')
    aligns.push('left')
    renderGrid()
    generate()
  })

  removeRowBtn.addEventListener('click', function () {
    if (rows <= 1) return
    rows--
    data.pop()
    renderGrid()
    generate()
  })

  removeColBtn.addEventListener('click', function () {
    if (cols <= 1) return
    cols--
    for (var r = 0; r < data.length; r++) data[r].pop()
    aligns.pop()
    renderGrid()
    generate()
  })

  rowsInput.addEventListener('change', function () {
    var val = parseInt(rowsInput.value, 10)
    if (isNaN(val) || val < 1) val = 1
    if (val > 50) val = 50
    while (data.length < val) data.push(Array(cols).fill(''))
    while (data.length > val) data.pop()
    rows = val
    renderGrid()
    generate()
  })

  colsInput.addEventListener('change', function () {
    var val = parseInt(colsInput.value, 10)
    if (isNaN(val) || val < 1) val = 1
    if (val > 20) val = 20
    while (aligns.length < val) aligns.push('left')
    while (aligns.length > val) aligns.pop()
    for (var r = 0; r < data.length; r++) {
      while (data[r].length < val) data[r].push('')
      while (data[r].length > val) data[r].pop()
    }
    cols = val
    renderGrid()
    generate()
  })

  includeHeader.addEventListener('change', function () {
    renderGrid()
    generate()
  })

  copyBtn.addEventListener('click', function () {
    if (!output.value) return
    navigator.clipboard.writeText(output.value).then(function () {
      copyBtn.textContent = 'Copied!'
      copyBtn.classList.add('copied')
      setTimeout(function () {
        copyBtn.textContent = 'Copy Markdown'
        copyBtn.classList.remove('copied')
      }, 2000)
    })
  })

  initData()
  renderGrid()
  generate()
})()
