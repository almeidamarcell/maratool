import { jsonToCreateTable } from './sql-create-table-core.js'

;(function () {
  var table = document.getElementById('sct-table')
  var json = document.getElementById('sct-schema')
  var output = document.getElementById('sct-output')
  var copy = document.getElementById('sct-copy')

  function update() {
    var r = jsonToCreateTable(table.value || 'my_table', json.value)
    output.textContent = r.error || r
    output.classList.toggle('error-state', !!r.error)
  }

  ;[table, json].forEach(function (el) { el.addEventListener('input', update) })
  copy.addEventListener('click', function () {
    navigator.clipboard.writeText(output.textContent).then(function () {
      copy.textContent = 'Copied!'
      setTimeout(function () { copy.textContent = 'Copy' }, 2000)
    })
  })
  update()
})()
