import { calcWeightedGrade } from './education-grade-core.js'

;(function () {
  var rows = document.getElementById('gc-rows')
  var add = document.getElementById('gc-add')
  var percent = document.getElementById('gc-percent')

  function rowHtml() {
    return '<div class="gc-row" style="display:grid;grid-template-columns:1fr 80px 80px 32px;gap:0.5rem;margin-bottom:0.5rem;">' +
      '<input type="text" class="tool-input gc-name" placeholder="Assignment" />' +
      '<input type="number" class="tool-input gc-score" placeholder="Score" min="0" max="100" step="any" />' +
      '<input type="number" class="tool-input gc-weight" placeholder="Weight %" min="0" step="any" />' +
      '<button type="button" class="copy-btn gc-remove" style="background:transparent;color:var(--text-2);">×</button></div>'
  }

  function read() {
    return Array.from(rows.querySelectorAll('.gc-row')).map(function (row) {
      return {
        name: row.querySelector('.gc-name').value,
        score: row.querySelector('.gc-score').value,
        weight: row.querySelector('.gc-weight').value,
      }
    })
  }

  function update() {
    var r = calcWeightedGrade(read())
    percent.textContent = r.totalWeight ? r.percent.toFixed(1) + '%' : '—'
  }

  function bind(row) {
    row.querySelectorAll('input').forEach(function (el) { el.addEventListener('input', update) })
    row.querySelector('.gc-remove').addEventListener('click', function () {
      if (rows.children.length > 1) row.remove()
      update()
    })
  }

  add.addEventListener('click', function () {
    var div = document.createElement('div')
    div.innerHTML = rowHtml()
    bind(div.firstChild)
    rows.appendChild(div.firstChild)
    update()
  })

  if (!rows.querySelector('.gc-row')) add.click()
  else bind(rows.querySelector('.gc-row'))
  update()
})()
