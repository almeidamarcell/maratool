import { EXCEL_FUNCTIONS } from './excel-functions-data.js'
import { copyWithFeedback } from './tool-utils.js'

;(function () {
  var search = document.getElementById('xl-search')
  var countEl = document.getElementById('xl-count')
  var bodyEl = document.getElementById('xl-body')

  function normalize(s) {
    return s.toUpperCase().replace(/[ÁÀÂÃ]/g, 'A').replace(/[ÉÈÊ]/g, 'E').replace(/[ÍÌÎ]/g, 'I').replace(/[ÓÒÔÕ]/g, 'O').replace(/[ÚÙÛÜ]/g, 'U').replace(/Ç/g, 'C').replace(/Ñ/g, 'N')
  }

  function render(list) {
    bodyEl.textContent = ''
    var frag = document.createDocumentFragment()
    list.forEach(function (fn) {
      var row = document.createElement('div')
      row.className = 'xl-row'
      ;['en', 'pt', 'es'].forEach(function (lang) {
        var cell = document.createElement('button')
        cell.type = 'button'
        cell.className = 'xl-cell'
        cell.textContent = fn[lang]
        cell.title = 'Copy ' + fn[lang]
        cell.addEventListener('click', function () { copyWithFeedback(cell, fn[lang]) })
        row.appendChild(cell)
      })
      frag.appendChild(row)
    })
    bodyEl.appendChild(frag)
    countEl.textContent = list.length === EXCEL_FUNCTIONS.length
      ? 'Showing all ' + list.length + ' functions. Click any name to copy it.'
      : list.length + ' function' + (list.length === 1 ? '' : 's') + ' found. Click any name to copy it.'
  }

  function update() {
    var q = normalize(search.value.trim())
    if (!q) { render(EXCEL_FUNCTIONS); return }
    render(EXCEL_FUNCTIONS.filter(function (fn) {
      return normalize(fn.en).indexOf(q) !== -1 || normalize(fn.pt).indexOf(q) !== -1 || normalize(fn.es).indexOf(q) !== -1
    }))
  }

  search.addEventListener('input', update)
  render(EXCEL_FUNCTIONS)
})()
