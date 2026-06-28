import { jsonToInsert } from './sql-insert-core.js'

;(function () {
  var table = document.getElementById('sig-table')
  var json = document.getElementById('sig-json')
  var output = document.getElementById('sig-output')
  var copy = document.getElementById('sig-copy')

  function update() {
    var r = jsonToInsert(table.value || 'my_table', json.value)
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
