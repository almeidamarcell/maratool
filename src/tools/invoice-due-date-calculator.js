import { invoiceDueDate } from './business-calc-core.js'

;(function () {
  var issue = document.getElementById('inv-issue')
  var terms = document.getElementById('inv-terms')
  var dueEl = document.getElementById('inv-due')

  issue.value = new Date().toISOString().slice(0, 10)

  function update() {
    var d = invoiceDueDate(issue.value, parseInt(terms.value, 10) || 30)
    dueEl.textContent = d ? d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '—'
  }
  ;[issue, terms].forEach(function (el) { el.addEventListener('input', update); el.addEventListener('change', update) })
  update()
})()
