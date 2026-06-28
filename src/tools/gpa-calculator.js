import { calcGpa } from './education-gpa-core.js'

;(function () {
  var rows = document.getElementById('gpa-rows')
  var add = document.getElementById('gpa-add')
  var gpa = document.getElementById('gpa-value')
  var credits = document.getElementById('gpa-credits')

  function rowHtml() {
    return '<div class="gpa-row calc-row" style="display:flex;gap:0.5rem;margin-bottom:0.5rem;">' +
      '<input type="text" class="tool-input gpa-grade" placeholder="A" style="width:80px;" />' +
      '<input type="number" class="tool-input gpa-credit" placeholder="Credits" min="0" step="any" style="flex:1;" />' +
      '<button type="button" class="copy-btn gpa-remove" style="background:transparent;color:var(--text-2);">×</button></div>'
  }

  function read() {
    return Array.from(rows.querySelectorAll('.gpa-row')).map(function (row) {
      return {
        grade: row.querySelector('.gpa-grade').value,
        credits: row.querySelector('.gpa-credit').value,
      }
    })
  }

  function update() {
    var r = calcGpa(read())
    gpa.textContent = r.credits ? r.value.toFixed(2) : '—'
    credits.textContent = r.credits ? String(r.credits) : '—'
  }

  function bind(row) {
    row.querySelectorAll('input').forEach(function (el) { el.addEventListener('input', update) })
    row.querySelector('.gpa-remove').addEventListener('click', function () {
      if (rows.children.length > 1) row.remove()
      update()
    })
  }

  add.addEventListener('click', function () {
    var div = document.createElement('div')
    div.innerHTML = rowHtml()
    var row = div.firstChild
    rows.appendChild(row)
    bind(row)
    update()
  })

  if (!rows.querySelector('.gpa-row')) add.click()
  else bind(rows.querySelector('.gpa-row'))
  update()
})()
